import { Beat } from '../../types';

export const PRESET_BEATS: Beat[] = [
  {
    id: 'beat_boom_bap_classic',
    title: 'Classic 90s Boom Bap',
    style: 'Boom Bap',
    bpm: 90,
    key: 'C Min',
    producer: 'RimaLab Originals',
    energy: 'Médio',
    description: 'Bateria pesada com groove clássico dos anos 90, caixa estalada e linha de baixo encorpada.',
    source: 'synth',
    durationFormatted: '03:20',
  },
  {
    id: 'beat_trap_dark_808',
    title: 'Dark 808 Trap Heat',
    style: 'Trap',
    bpm: 140,
    key: 'F Min',
    producer: 'RimaLab Originals',
    energy: 'Agressivo',
    description: 'Sub 808 pesado e distorcido, hi-hats rápidos em tercinas e palmas cortantes para flow acelerado.',
    source: 'synth',
    durationFormatted: '02:45',
  },
  {
    id: 'beat_uk_drill_slide',
    title: 'UK / BR Drill Sliding Sub',
    style: 'Drill',
    bpm: 142,
    key: 'E Min',
    producer: 'RimaLab Originals',
    energy: 'Agressivo',
    description: 'Contratempos sincopados, graves 808 com deslizes (glide) e caixas fantasmas de batalha.',
    source: 'synth',
    durationFormatted: '03:10',
  },
  {
    id: 'beat_lofi_study_rhymes',
    title: 'Midnight Lo-Fi Chill',
    style: 'Lo-Fi',
    bpm: 82,
    key: 'A Maj',
    producer: 'RimaLab Originals',
    energy: 'Chill',
    description: 'Textura de vinil nostálgica, acordes suaves de piano elétrico e bateria quente para rimas poéticas.',
    source: 'synth',
    durationFormatted: '03:40',
  },
  {
    id: 'beat_speed_flow_rap',
    title: 'Speed Flow Double Time',
    style: 'Speed Flow',
    bpm: 108,
    key: 'G Min',
    producer: 'RimaLab Originals',
    energy: 'Épico',
    description: 'Bateria contínua e rápida para treinar respiração, dicção e rimas dobradas em alta velocidade.',
    source: 'synth',
    durationFormatted: '02:30',
  },
  {
    id: 'beat_grime_energy',
    title: 'Raw Grime Cypher',
    style: 'Grime',
    bpm: 140,
    key: 'D Min',
    producer: 'RimaLab Originals',
    energy: 'Épico',
    description: 'Sintetizador cortante, kicks agressivos e ritmo frenético para treinar ataque e punchlines.',
    source: 'synth',
    durationFormatted: '03:00',
    isPro: true,
  },
  {
    id: 'beat_detroit_pure_808',
    title: 'Detroit 8 Mile Piano Stabs',
    style: 'Detroit',
    bpm: 100,
    key: 'F# Min',
    producer: 'RimaLab Originals',
    energy: 'Agressivo',
    description: 'Acordes secos e rápidos de piano, sub 808 cortante e bateria de Detroit sincopada para flow fora do tempo e punchline pesada.',
    source: 'synth',
    durationFormatted: '02:55',
    isPro: true,
  },
  {
    id: 'beat_detroit_punch',
    title: 'Detroit Flute & 808 Off-Beat',
    style: 'Detroit',
    bpm: 98,
    key: 'C# Min',
    producer: 'Discord BeatBot Community',
    energy: 'Agressivo',
    description: 'Linha de flauta contínua, bumbo solto e rimas no contratempo características do flow clássico de Detroit.',
    source: 'synth',
    durationFormatted: '02:50',
    isPro: true,
  },
  {
    id: 'beat_cypher_underground',
    title: 'SP Cypher Underground 95',
    style: 'Boom Bap',
    bpm: 88,
    key: 'G# Min',
    producer: 'Discord BeatBot Community',
    energy: 'Médio',
    description: 'Sample de trompete com poeira de vinil, caixa pesada e linha de baixo acústico.',
    source: 'synth',
    durationFormatted: '03:15',
  },
];

export class BeatEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentBeat: Beat = PRESET_BEATS[0];
  private bpm: number = 90;
  private volume: number = 0.8;
  private metronomeEnabled: boolean = false;
  private audioElement: HTMLAudioElement | null = null;
  private isAudioElementConnected: boolean = false;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;

  private nextNoteTime: number = 0;
  private currentStep: number = 0; // 0 to 15 (16-step grid, 4 beats of 4 16ths)
  private timerId: number | null = null;
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // seconds

  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private onStepCallback: ((step: number, beat: number) => void) | null = null;

  constructor() {
    this.bpm = this.currentBeat.bpm;
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public setOnStepCallback(cb: ((step: number, beat: number) => void) | null) {
    this.onStepCallback = cb;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(60, Math.min(180, newBpm));
    if (this.audioElement && this.currentBeat.bpm > 0) {
      try {
        this.audioElement.playbackRate = Math.max(0.5, Math.min(2.0, this.bpm / this.currentBeat.bpm));
      } catch (e) {
        // ignore playback rate edge cases
      }
    }
  }

  public getBpm(): number {
    return this.bpm;
  }

  public setMetronome(enabled: boolean) {
    this.metronomeEnabled = enabled;
  }

  public getMetronome(): boolean {
    return this.metronomeEnabled;
  }

  public setBeat(beat: Beat) {
    const wasPlaying = this.isPlaying;
    if (this.isPlaying) {
      this.stop();
    }

    this.currentBeat = beat;
    this.bpm = beat.bpm;

    // Handle custom audio URL
    if (beat.audioUrl) {
      this.setupAudioElement(beat.audioUrl);
    } else {
      this.cleanupAudioElement();
    }

    if (wasPlaying) {
      this.start();
    }
  }

  private setupAudioElement(url: string) {
    this.cleanupAudioElement();
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.src = url;
    audio.loop = true;
    audio.volume = this.volume;
    this.audioElement = audio;

    audio.addEventListener('error', () => {
      console.warn('Audio element failed to load stream, falling back to synth engine');
    });
  }

  private cleanupAudioElement() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }
    this.isAudioElementConnected = false;
  }

  public getCurrentBeat(): Beat {
    return this.currentBeat;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public start() {
    this.initContext();
    if (!this.ctx || this.isPlaying) return;

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // If beat has an audio element, play it
    if (this.audioElement) {
      this.audioElement.play().catch(err => {
        console.warn('Audio autoplay blocked or failed:', err);
      });
    }

    this.scheduler();
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
    }
    this.currentStep = 0;
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  private nextStep() {
    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPer16th = secondsPerBeat / 4;
    this.nextNoteTime += secondsPer16th;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  private scheduler = () => {
    if (!this.isPlaying || !this.ctx) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.nextStep();
    }

    this.timerId = window.setTimeout(this.scheduler, this.lookahead);
  };

  private scheduleStep(step: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    const currentBeatNumber = Math.floor(step / 4) + 1;

    // Metronome tick
    if (this.metronomeEnabled && step % 4 === 0) {
      this.playMetronomeTick(time, step === 0);
    }

    // Trigger instruments based on active beat style
    const style = this.currentBeat.style;

    if (style === 'Boom Bap') {
      // Classic 90s Kick on 0, 6, 8, 10
      if (step === 0 || step === 6 || step === 8 || step === 10) {
        this.playKick(time, 1.0, 55, 0.28);
      }
      // Snare on 4, 12
      if (step === 4 || step === 12) {
        this.playSnare(time, 0.9, 220);
      }
      // Hi-hats with swing
      if (step % 2 === 0) {
        this.playHiHat(time, step % 4 === 0 ? 0.6 : 0.35, false);
      }
      // Bass notes
      if (step === 0 || step === 6 || step === 10) {
        this.playBassNote(time, step === 6 ? 65.41 : 55.0, 0.35); // C -> E
      }
    } else if (style === 'Trap') {
      // Trap Kick / 808
      if (step === 0 || step === 7 || step === 10) {
        this.play808Bass(time, step === 7 ? 43.65 : 38.89, 0.45); // F -> C
      }
      // Trap Snare / Clap on 4, 12
      if (step === 4 || step === 12) {
        this.playClap(time, 0.95);
      }
      // Trap Hi-Hats with rolling triplets on steps 14, 15
      this.playHiHat(time, 0.4, step === 14 || step === 15);
      // Extra ghost kick
      if (step === 13) {
        this.playKick(time, 0.7, 45, 0.15);
      }
    } else if (style === 'Drill') {
      // Drill Kick on 0, 6, 11
      if (step === 0 || step === 6 || step === 11) {
        this.playKick(time, 1.0, 48, 0.25);
      }
      // Drill Snare on 6 and 14
      if (step === 6 || step === 14) {
        this.playSnare(time, 0.95, 260);
      }
      // Drill Sliding 808 Bass
      if (step === 0 || step === 8) {
        this.play808Bass(time, step === 8 ? 41.2 : 36.71, 0.55);
      }
      // Syncopated Hi-Hats
      if (step % 3 === 0 || step === 14) {
        this.playHiHat(time, 0.45, false);
      }
    } else if (style === 'Lo-Fi') {
      // Lo-fi soft kick on 0, 7, 10
      if (step === 0 || step === 7 || step === 10) {
        this.playKick(time, 0.75, 42, 0.35, true);
      }
      // Rimshot / Snare on 4, 12
      if (step === 4 || step === 12) {
        this.playSnare(time, 0.6, 190, true);
      }
      // Soft Hi-Hats on even steps
      if (step % 2 === 0) {
        this.playHiHat(time, 0.25, false, true);
      }
      // Mellow Rhodes chord pad on beat 1
      if (step === 0) {
        this.playLoFiPad(time);
      }
    } else if (style === 'Grime') {
      // Grime 4x4 + syncopation
      if (step === 0 || step === 4 || step === 8 || step === 12 || step === 14) {
        this.playKick(time, 1.0, 60, 0.2);
      }
      if (step === 4 || step === 12) {
        this.playSnare(time, 1.0, 240);
      }
      // Square Wave Bass
      if (step === 0 || step === 6 || step === 10 || step === 14) {
        this.playSquareBass(time, step === 6 ? 73.42 : 55.0);
      }
      this.playHiHat(time, 0.5, false);
    } else if (style === 'Detroit') {
      // Detroit Characteristic: Off-beat minor piano stabs, bouncy 808 and snapping claps
      if (step === 0 || step === 3 || step === 8 || step === 11 || step === 14) {
        this.playDetroitPianoStab(time, step % 2 === 0 ? 370 : 440);
      }
      // Heavy Detroit 808
      if (step === 0 || step === 6 || step === 10) {
        this.play808Bass(time, step === 6 ? 46.25 : 36.71, 0.4);
      }
      // Snare / Clap on 4, 12 with syncopated ghost roll on 15
      if (step === 4 || step === 12) {
        this.playClap(time, 1.0);
      }
      if (step === 15) {
        this.playSnare(time, 0.45, 260, true);
      }
      // Bouncy hi-hats with swing
      if (step % 2 === 0 || step === 7 || step === 13) {
        this.playHiHat(time, step === 0 || step === 8 ? 0.55 : 0.35, false);
      }
    } else if (style === 'Speed Flow') {
      // Driving double time
      if (step % 4 === 0) {
        this.playKick(time, 0.9, 52, 0.2);
      }
      if (step === 4 || step === 12) {
        this.playSnare(time, 0.9, 230);
      }
      // Driving 16th Hi-Hats
      this.playHiHat(time, step % 2 === 0 ? 0.5 : 0.3, false);
      // Fast bass groove
      if (step === 0 || step === 4 || step === 8 || step === 12) {
        this.playBassNote(time, 49.0, 0.2);
      }
    }

    // Trigger step callback on browser thread
    if (this.onStepCallback) {
      setTimeout(() => {
        if (this.onStepCallback && this.isPlaying) {
          this.onStepCallback(step, currentBeatNumber);
        }
      }, Math.max(0, (time - this.ctx.currentTime) * 1000));
    }
  }

  // --- Sound Synthesizers using Web Audio Nodes ---

  private playKick(time: number, gainVal: number, baseFreq = 50, duration = 0.25, isLoFi = false) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isLoFi ? 100 : 150, time);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.08);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + duration);

    gain.gain.setValueAtTime(gainVal * (isLoFi ? 0.6 : 0.9), time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private play808Bass(time: number, freq: number, duration = 0.5) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04);

    gain.gain.setValueAtTime(0.85, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private playSnare(time: number, gainVal: number, toneFreq = 200, isLoFi = false) {
    if (!this.ctx || !this.masterGain) return;

    // Noise buffer for snap
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = isLoFi ? 'lowpass' : 'highpass';
    filter.frequency.value = isLoFi ? 2500 : 1000;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(gainVal * 0.7, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + (isLoFi ? 0.12 : 0.18));

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.18);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(toneFreq, time);
    osc.frequency.exponentialRampToValueAtTime(toneFreq * 0.4, time + 0.08);

    oscGain.gain.setValueAtTime(gainVal * 0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  private playClap(time: number, gainVal: number) {
    if (!this.ctx || !this.masterGain) return;

    // Multiple quick bursts for authentic trap clap
    const offsets = [0, 0.012, 0.024];
    offsets.forEach((offset, idx) => {
      const bufferSize = this.ctx!.sampleRate * (idx === 2 ? 0.15 : 0.02);
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx!.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1200;

      const gain = this.ctx!.createGain();
      gain.gain.setValueAtTime(gainVal * (idx === 2 ? 0.8 : 0.4), time + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, time + offset + (idx === 2 ? 0.15 : 0.02));

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      noise.start(time + offset);
      noise.stop(time + offset + 0.16);
    });
  }

  private playHiHat(time: number, gainVal: number, isRoll = false, isLoFi = false) {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * (isRoll ? 0.03 : 0.05);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = isLoFi ? 'bandpass' : 'highpass';
    filter.frequency.value = isLoFi ? 4500 : 7000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal * 0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isRoll ? 0.03 : 0.05));

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(time);
    source.stop(time + 0.05);
  }

  private playBassNote(time: number, freq: number, duration = 0.3) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + duration);

    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private playSquareBass(time: number, freq: number) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playLoFiPad(time: number) {
    if (!this.ctx || !this.masterGain) return;

    const chord = [220, 261.63, 329.63, 392.0]; // A Minor 7
    chord.forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.value = 800;

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 1.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + 1.6);
    });
  }

  private playDetroitPianoStab(time: number, rootFreq = 370) {
    if (!this.ctx || !this.masterGain) return;

    // Minor triad stab: root, minor third, fifth
    const notes = [rootFreq, rootFreq * 1.1892, rootFreq * 1.4983];
    notes.forEach(f => {
      const osc = this.ctx!.createOscillator();
      const filter = this.ctx!.createBiquadFilter();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, time);
      filter.frequency.exponentialRampToValueAtTime(600, time + 0.12);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + 0.14);
    });
  }

  private playMetronomeTick(time: number, isHigh: boolean) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHigh ? 1200 : 800, time);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.04);
  }

  public cleanup() {
    this.stop();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const globalBeatEngine = new BeatEngine();
