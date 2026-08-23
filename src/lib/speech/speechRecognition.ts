// Advanced Speech Recognition, Audio Recorder, VAD and Speed Flow Engine for RimaLab

export interface SpeechRecognitionResultState {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  micVolume: number; // 0 to 100
  isSpeaking: boolean;
  syllablesPerSec: number;
  isSpeedFlow: boolean;
  error: string | null;
}

export class SpeechHandler {
  private recognition: any = null;
  private isListening: boolean = false;
  private fullTranscript: string = '';
  private interimTranscript: string = '';
  private onTranscriptChange: ((full: string, interim: string) => void) | null = null;
  private onVolumeChange: ((volume: number, isSpeaking: boolean, sps: number, isSpeedFlow: boolean) => void) | null = null;
  private onErrorCallback: ((err: string) => void) | null = null;

  // Audio analysis & recording
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private animFrameId: number | null = null;

  // Advanced VAD & Speed Flow Detector variables
  private energyHistory: number[] = [];
  private syllablePeaks: number[] = [];
  private lastPeakTime: number = 0;
  private isSpeaking: boolean = false;
  private currentSPS: number = 0;

  constructor() {
    this.initSpeechRecognition();
  }

  public isSupported(): boolean {
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  private initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      this.recognition.lang = 'pt-BR';

      this.recognition.onresult = (event: any) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) {
            const cleanText = text.trim();
            if (cleanText) {
              this.fullTranscript += (this.fullTranscript ? ' ' : '') + cleanText;
            }
          } else {
            currentInterim += text;
          }
        }

        this.interimTranscript = currentInterim;
        if (this.onTranscriptChange) {
          this.onTranscriptChange(this.fullTranscript, this.interimTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'aborted' || event.error === 'no-speech') return;
        console.warn('Speech recognition status:', event.error);
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          // Restart immediately to never miss fast rhymes in speed flow
          try {
            this.recognition.start();
          } catch (e) {
            // Ignore retry collisions
          }
        }
      };
    } catch (e) {
      console.warn('Could not initialize Web Speech API:', e);
    }
  }

  public async startListening(): Promise<boolean> {
    if (this.isListening) return true;

    this.recordedChunks = [];
    this.syllablePeaks = [];
    this.energyHistory = [];

    // 1. Start High-Definition Audio Capture & Analyser
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false, // Keep dynamic rap voice transients
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 44100,
          },
        });

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioCtx();
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }

        const source = this.audioCtx.createMediaStreamSource(this.mediaStream);
        this.micAnalyser = this.audioCtx.createAnalyser();
        this.micAnalyser.fftSize = 256;
        this.micAnalyser.smoothingTimeConstant = 0.3;
        source.connect(this.micAnalyser);

        // Start MediaRecorder to capture audio for AI Multimodal Speed Flow Transcription
        try {
          const mimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/mp4',
          ];
          let chosenMime = '';
          for (const m of mimeTypes) {
            if (MediaRecorder.isTypeSupported(m)) {
              chosenMime = m;
              break;
            }
          }

          this.mediaRecorder = chosenMime
            ? new MediaRecorder(this.mediaStream, { mimeType: chosenMime })
            : new MediaRecorder(this.mediaStream);

          this.mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              this.recordedChunks.push(e.data);
            }
          };

          this.mediaRecorder.start(500); // 500ms time slices
        } catch (recErr) {
          console.warn('MediaRecorder error:', recErr);
        }

        this.startMicLoop();
      }
    } catch (e: any) {
      console.warn('Microphone stream access error:', e);
    }

    // 2. Start Web Speech recognition
    this.isListening = true;
    if (this.recognition) {
      try {
        this.recognition.start();
        return true;
      } catch (err: any) {
        console.warn('Recognition start warning:', err);
      }
    }

    return true;
  }

  private startMicLoop() {
    if (!this.micAnalyser) return;
    const dataArray = new Uint8Array(this.micAnalyser.frequencyBinCount);

    const update = () => {
      if (!this.isListening || !this.micAnalyser) return;
      this.micAnalyser.getByteFrequencyData(dataArray);

      let sum = 0;
      let vocalEnergySum = 0;
      // Rap vocals are mostly concentrated in 300Hz - 3500Hz range (bins 2 to 24 with fftSize 256)
      const vocalStartBin = 2;
      const vocalEndBin = Math.min(30, dataArray.length);

      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
        if (i >= vocalStartBin && i <= vocalEndBin) {
          vocalEnergySum += dataArray[i];
        }
      }

      const avg = sum / dataArray.length;
      const vocalAvg = vocalEnergySum / (vocalEndBin - vocalStartBin + 1);
      const vol = Math.min(100, Math.round((avg / 128) * 100));

      const now = performance.now();

      // Advanced Voice Activity Detection (VAD)
      const speakingThreshold = 18;
      this.isSpeaking = vol > speakingThreshold || vocalAvg > 24;

      // Speed Flow Syllable Detection: Detect sudden rhythmic energy onset spikes (consonant-vowel bursts)
      if (this.isSpeaking) {
        const energyDelta = vocalAvg - (this.energyHistory[this.energyHistory.length - 1] || 0);
        if (energyDelta > 14 && now - this.lastPeakTime > 90) { // minimum 90ms between rapid syllables
          this.syllablePeaks.push(now);
          this.lastPeakTime = now;
        }
      }

      this.energyHistory.push(vocalAvg);
      if (this.energyHistory.length > 20) this.energyHistory.shift();

      // Clean syllable peaks older than 2.5 seconds
      this.syllablePeaks = this.syllablePeaks.filter(t => now - t <= 2500);

      // Syllables per second (SPS)
      const count = this.syllablePeaks.length;
      this.currentSPS = count > 0 ? parseFloat(((count / 2.5) * 1.5).toFixed(1)) : 0;
      const isSpeedFlow = this.currentSPS >= 4.8; // > 4.8 syllables/sec indicates rapid freestyle / speed flow

      if (this.onVolumeChange) {
        this.onVolumeChange(vol, this.isSpeaking, this.currentSPS, isSpeedFlow);
      }

      this.animFrameId = requestAnimationFrame(update);
    };

    update();
  }

  public async stopListening(): Promise<Blob | null> {
    this.isListening = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    let recordedBlob: Blob | null = null;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        await new Promise<void>((resolve) => {
          if (!this.mediaRecorder) return resolve();
          this.mediaRecorder.onstop = () => resolve();
          this.mediaRecorder.stop();
        });
        if (this.recordedChunks.length > 0) {
          recordedBlob = new Blob(this.recordedChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm',
          });
        }
      } catch (e) {
        console.warn('Error stopping MediaRecorder:', e);
      }
    } else if (this.recordedChunks.length > 0) {
      recordedBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    if (this.onVolumeChange) {
      this.onVolumeChange(0, false, 0, false);
    }

    return recordedBlob;
  }

  public setCallbacks(
    onTranscript: (full: string, interim: string) => void,
    onVolume: (vol: number, isSpeaking: boolean, sps: number, isSpeedFlow: boolean) => void,
    onError: (err: string) => void
  ) {
    this.onTranscriptChange = onTranscript;
    this.onVolumeChange = onVolume;
    this.onErrorCallback = onError;
  }

  public appendTranscript(text: string) {
    this.fullTranscript += (this.fullTranscript ? ' ' : '') + text.trim();
    if (this.onTranscriptChange) {
      this.onTranscriptChange(this.fullTranscript, this.interimTranscript);
    }
  }

  public setFullTranscript(text: string) {
    this.fullTranscript = text;
    this.interimTranscript = '';
    if (this.onTranscriptChange) {
      this.onTranscriptChange(this.fullTranscript, this.interimTranscript);
    }
  }

  public resetTranscript() {
    this.fullTranscript = '';
    this.interimTranscript = '';
    if (this.onTranscriptChange) {
      this.onTranscriptChange('', '');
    }
  }

  public getFullTranscript(): string {
    return this.fullTranscript;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

