// AI Voice Tutor & Rap Cadence Synthesis Engine for RimaLab Academy

export interface VoiceTutorOptions {
  rate?: number; // 0.8 to 1.5
  pitch?: number; // 0.8 to 1.2
  volume?: number; // 0 to 1
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

class AIVoiceTutorEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private audioCtx: AudioContext | null = null;
  private metronomeInterval: number | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking || (this.synth?.speaking ?? false);
  }

  public speak(text: string, options: VoiceTutorOptions = {}) {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      options.onError?.('SpeechSynthesis unsupported');
      return;
    }

    this.stop();

    // Clean markdown or bracket artifacts
    const cleanText = text
      .replace(/•/g, ', ')
      .replace(/[\(\)]/g, ' ')
      .replace(/\*/g, '')
      .replace(/Verso \d+:/gi, '')
      .replace(/DOUBLE TIME/gi, 'em ritmo acelerado!')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = options.rate ?? 1.05;
    utterance.pitch = options.pitch ?? 0.95; // slightly lower pitch for warm rap tone
    utterance.volume = options.volume ?? 1.0;

    // Pick best Portuguese voice if available
    const voices = this.synth.getVoices();
    const ptVoices = voices.filter(v => v.lang.startsWith('pt') || v.lang.includes('BR') || v.lang.includes('PT'));
    
    // Prefer Google or natural PT-BR voice
    const preferredVoice = ptVoices.find(v => v.name.toLowerCase().includes('brazil') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('luciana') || v.name.toLowerCase().includes('felipe')) || ptVoices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      options.onError?.(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  // Metronome for Speed Flow drills
  public startMetronome(bpm: number, onTick?: (beat: number) => void) {
    this.stopMetronome();
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.audioCtx && AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('AudioContext not available', e);
    }

    let beat = 0;
    const intervalMs = (60 / bpm) * 1000;

    const playClick = () => {
      beat = (beat % 4) + 1;
      onTick?.(beat);

      if (this.audioCtx) {
        try {
          if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
          }
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          // Accent beat 1 with high frequency (1000Hz), beats 2-4 with 600Hz
          osc.frequency.value = beat === 1 ? 950 : 600;
          gain.gain.setValueAtTime(0.18, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.09);
        } catch (err) {
          // ignore audio context errors
        }
      }
    };

    playClick();
    this.metronomeInterval = window.setInterval(playClick, intervalMs);
  }

  public stopMetronome() {
    if (this.metronomeInterval !== null) {
      clearInterval(this.metronomeInterval);
      this.metronomeInterval = null;
    }
  }

  public isMetronomeRunning(): boolean {
    return this.metronomeInterval !== null;
  }
}

export const aiVoiceTutor = new AIVoiceTutorEngine();
