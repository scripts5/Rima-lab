import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Mic, 
  MicOff, 
  Sliders, 
  Volume2, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  TrendingUp, 
  Clock, 
  Zap, 
  FileText, 
  Layers, 
  Compass, 
  Award,
  AlertCircle,
  Radio,
  Camera,
  CameraOff,
  Video,
  Monitor,
  Activity,
  SlidersHorizontal,
  Wand2,
  Share2,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Beat, RhymeAnalysis, UserProfile } from '../types';
import { PRESET_BEATS, globalBeatEngine } from '../lib/audio/beatEngine';
import { SpeechHandler } from '../lib/speech/speechRecognition';

interface FreestyleStudioProps {
  profile: UserProfile | null;
  onSessionComplete: (sessionData: {
    beatId: string;
    beatStyle: string;
    bpm: number;
    durationSeconds: number;
    transcript: string;
    analysis: RhymeAnalysis;
    xpEarned: number;
  }) => void;
  activeChallengeTheme?: {
    title: string;
    theme: string;
    requiredWords: string[];
    timeLimitSeconds?: number;
  } | null;
  onClearChallengeTheme?: () => void;
  onOpenPromptGen: () => void;
  isPlayingBeat: boolean;
  setIsPlayingBeat: (playing: boolean) => void;
  currentBeat: Beat;
  setCurrentBeat: (beat: Beat) => void;
}

export const FreestyleStudio: React.FC<FreestyleStudioProps> = ({
  profile,
  onSessionComplete,
  activeChallengeTheme,
  onClearChallengeTheme,
  onOpenPromptGen,
  isPlayingBeat,
  setIsPlayingBeat,
  currentBeat,
  setCurrentBeat,
}) => {
  // Beat Engine State
  const [bpm, setBpm] = useState<number>(currentBeat.bpm);
  const [volume, setVolume] = useState<number>(0.8);
  const [metronome, setMetronome] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [currentBeatNumber, setCurrentBeatNumber] = useState<number>(1);

  // Speech & Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [syllablesPerSec, setSyllablesPerSec] = useState<number>(0);
  const [isSpeedFlow, setIsSpeedFlow] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isTranscribingAI, setIsTranscribingAI] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<RhymeAnalysis | null>(null);
  const [liveRhymeSuggestions, setLiveRhymeSuggestions] = useState<string[]>([]);
  const [lastSpokenWord, setLastSpokenWord] = useState<string>('');
  const [lastAudioBlob, setLastAudioBlob] = useState<Blob | null>(null);

  // Camera & Visual Stage State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stageViewMode, setStageViewMode] = useState<'camera' | 'spectrum' | 'split'>('camera');
  const [cameraFilter, setCameraFilter] = useState<'normal' | 'cyberpunk' | 'dark' | 'neon'>('normal');

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const splitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const speechHandlerRef = useRef<SpeechHandler | null>(null);
  const sessionTimerRef = useRef<number | null>(null);

  // Initialize Speech Handler and Beat Callbacks
  useEffect(() => {
    const handler = new SpeechHandler();
    speechHandlerRef.current = handler;
    setSpeechSupported(handler.isSupported());

    handler.setCallbacks(
      (full, interim) => {
        setTranscript(full);
        setInterimTranscript(interim);
        extractLiveRhymeSuggestions(interim || full);
      },
      (vol, speaking, sps, speedFlow) => {
        setMicVolume(vol);
        setIsSpeaking(speaking);
        setSyllablesPerSec(sps);
        setIsSpeedFlow(speedFlow);
      },
      (err) => {
        console.warn('Speech status callback:', err);
      }
    );

    globalBeatEngine.setOnStepCallback((step, beatNum) => {
      setCurrentStep(step);
      setCurrentBeatNumber(beatNum);
    });

    // Auto-attempt starting camera if available
    initCamera(false);

    return () => {
      handler.stopListening();
      globalBeatEngine.setOnStepCallback(null);
      stopCamera();
      if (sessionTimerRef.current) {
        window.clearInterval(sessionTimerRef.current);
      }
    };
  }, []);

  // Update Beat Engine when beat or BPM changes
  useEffect(() => {
    globalBeatEngine.setBeat(currentBeat);
    setBpm(currentBeat.bpm);
  }, [currentBeat]);

  useEffect(() => {
    globalBeatEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    globalBeatEngine.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    globalBeatEngine.setMetronome(metronome);
  }, [metronome]);

  // Session duration timer
  useEffect(() => {
    if (isRecording) {
      sessionTimerRef.current = window.setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        window.clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
    }
    return () => {
      if (sessionTimerRef.current) {
        window.clearInterval(sessionTimerRef.current);
      }
    };
  }, [isRecording]);

  // Camera Management
  const initCamera = async (showErrorAlert = true) => {
    if (cameraStreamRef.current) return;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (showErrorAlert) setCameraError('Seu navegador não suporta acesso direto à câmera.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setIsCameraActive(true);
      setCameraError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      if (showErrorAlert) {
        setCameraError('Permissão de câmera não concedida. Clique no ícone de cadeado do navegador para autorizar.');
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      initCamera(true);
    }
  };

  // Attach stream when video element mounts or camera turns on
  useEffect(() => {
    if (isCameraActive && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [isCameraActive, stageViewMode]);

  // Extract instant rhyming suggestions for HUD
  const extractLiveRhymeSuggestions = (text: string) => {
    if (!text) return;
    const words = text.trim().split(/\s+/);
    const last = words[words.length - 1]?.toLowerCase().replace(/[^a-zãõáéíóú]/g, '');
    if (!last || last.length < 3) return;

    setLastSpokenWord(last);

    // Dictionary of Portuguese rhyme endings
    const rhymeBank: Record<string, string[]> = {
      ao: ['visão', 'criação', 'direção', 'irmão', 'coração', 'pressão', 'missão', 'nação', 'evolução'],
      ar: ['caminhar', 'superar', 'rimar', 'lutar', 'brilhar', 'dominar', 'improvisar', 'conquistar', 'mar'],
      or: ['valor', 'calor', 'amor', 'flow', 'resplendor', 'lutador', 'vencedor', 'mentor'],
      er: ['saber', 'vencer', 'acontecer', 'fazer', 'poder', 'conhecer', 'escrever'],
      ir: ['sentir', 'subir', 'evoluir', 'seguir', 'partir', 'abrir', 'construir'],
      ente: ['mente', 'presente', 'frente', 'quente', 'consciente', 'diferente', 'urgente'],
      ado: ['passado', 'pesado', 'focado', 'falado', 'marcado', 'estruturado', 'preparado'],
      eza: ['certeza', 'firmeza', 'clareza', 'nobreza', 'pureza', 'grandeza'],
      ista: ['artista', 'conquista', 'pista', 'vista', 'realista', 'otimista'],
      oso: ['poderoso', 'perigoso', 'furioso', 'glorioso', 'valioso'],
      ica: ['prática', 'métrica', 'tática', 'crítica', 'autêntica'],
      al: ['real', 'moral', 'original', 'letal', 'fundamental', 'vital'],
    };

    let found: string[] = [];
    if (last.endsWith('ão') || last.endsWith('ao')) {
      found = rhymeBank.ao;
    } else if (last.endsWith('ar')) {
      found = rhymeBank.ar;
    } else if (last.endsWith('or')) {
      found = rhymeBank.or;
    } else if (last.endsWith('er')) {
      found = rhymeBank.er;
    } else if (last.endsWith('ir')) {
      found = rhymeBank.ir;
    } else if (last.endsWith('ente') || last.endsWith('ent')) {
      found = rhymeBank.ente;
    } else if (last.endsWith('ado')) {
      found = rhymeBank.ado;
    } else if (last.endsWith('eza')) {
      found = rhymeBank.eza;
    } else if (last.endsWith('ista')) {
      found = rhymeBank.ista;
    } else if (last.endsWith('al')) {
      found = rhymeBank.al;
    } else {
      found = ['visão', 'direção', 'superar', 'mente', 'pesado', 'firmeza'].filter(w => w !== last);
    }

    setLiveRhymeSuggestions(found.slice(0, 6));
  };

  // Real-time Canvas Waveform Visualizer
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current || splitCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const analyser = globalBeatEngine.getAnalyser();

      if (analyser && isPlayingBeat) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 2.2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.85;

          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          if (isSpeedFlow) {
            // Hot fire colors in speed flow
            grad.addColorStop(0, '#f97316');
            grad.addColorStop(0.5, '#ef4444');
            grad.addColorStop(1, '#e11d48');
          } else {
            grad.addColorStop(0, '#f59e0b');
            grad.addColorStop(0.7, '#ea580c');
            grad.addColorStop(1, '#ef4444');
          }

          ctx.fillStyle = grad;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      } else {
        ctx.beginPath();
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 2;
        ctx.moveTo(0, height / 2);
        for (let x = 0; x < width; x += 10) {
          const waveHeight = isRecording ? (isSpeaking ? (isSpeedFlow ? 14 : 9) : 4) : 2;
          const y = height / 2 + Math.sin(x * 0.05 + Date.now() * 0.003) * waveHeight;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlayingBeat, isRecording, isSpeaking, isSpeedFlow, stageViewMode]);

  // Toggle Master Beat
  const handleToggleBeat = () => {
    const playing = globalBeatEngine.togglePlay();
    setIsPlayingBeat(playing);
  };

  // Toggle Microphone / Recording
  const handleToggleRecording = async () => {
    if (!isRecording) {
      if (!isPlayingBeat) {
        globalBeatEngine.start();
        setIsPlayingBeat(true);
      }
      if (!isCameraActive) {
        initCamera(false);
      }
      await speechHandlerRef.current?.startListening();
      setIsRecording(true);
      setSessionSeconds(0);
      setAnalysisResult(null);
    } else {
      const audioBlob = await speechHandlerRef.current?.stopListening();
      setIsRecording(false);
      if (audioBlob) {
        setLastAudioBlob(audioBlob);
      }

      // If speech recognition gathered transcript, analyze
      if (transcript.trim().length > 10) {
        handleAnalyzeLyrics(transcript);
      } else if (audioBlob) {
        // If transcript is short (e.g. rapid speed flow missed by browser speech), auto-transcribe with AI
        handleTranscribeAudioWithAI(audioBlob);
      }
    }
  };

  // Multimodal AI Audio Transcription for Ultra-Fast Speed Flow
  const handleTranscribeAudioWithAI = async (blobToTranscribe?: Blob) => {
    const targetBlob = blobToTranscribe || lastAudioBlob;
    if (!targetBlob) return;

    setIsTranscribingAI(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(targetBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        const response = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: targetBlob.type || 'audio/webm',
          }),
        });

        const data = await response.json();
        if (data.transcript && data.transcript.trim()) {
          setTranscript(data.transcript);
          extractLiveRhymeSuggestions(data.transcript);
          // Auto analyze the newly transcribed lyrics
          handleAnalyzeLyrics(data.transcript);
        }
      };
    } catch (err) {
      console.error('Error transcribing audio with AI:', err);
    } finally {
      setIsTranscribingAI(false);
    }
  };

  // Analyze Lyrics via Backend API (Deterministic + Gemini AI)
  const handleAnalyzeLyrics = async (customText?: string) => {
    const textToAnalyze = (customText || transcript).trim();
    if (!textToAnalyze) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-rhymes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics: textToAnalyze,
          beatStyle: currentBeat.style,
          bpm: bpm,
          durationSeconds: Math.max(sessionSeconds, 20),
          theme: activeChallengeTheme?.theme || 'Freestyle Livre',
          requiredWords: activeChallengeTheme?.requiredWords || [],
        }),
      });

      const data = await response.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);

        if (data.analysis.overallScore >= 80) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#ea580c', '#10b981'],
          });
        }

        const xpEarned = data.xpEarned || Math.round(data.analysis.overallScore * 2.5);
        onSessionComplete({
          beatId: currentBeat.id,
          beatStyle: currentBeat.style,
          bpm: bpm,
          durationSeconds: Math.max(sessionSeconds, 20),
          transcript: textToAnalyze,
          analysis: data.analysis,
          xpEarned,
        });
      }
    } catch (err) {
      console.error('Error analyzing rhymes:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Sample verses injection for quick testing
  const injectSampleVerse = (type: 'boombap' | 'drill' | 'speedflow') => {
    let sample = '';
    if (type === 'boombap') {
      sample = `Entro na batida com postura e visão\nCada verso que eu solto vem direto do coração\nNo asfalto da cidade busco superação\nO microfone é a arma da minha evolução`;
    } else if (type === 'drill') {
      sample = `Deslizo no grave 808 daquele jeito\nRima cortante que exige respeito\nMantenho a postura sem nenhum defeito\nFaço o improviso bater no seu peito`;
    } else {
      sample = `Acelero o flow na velocidade máxima da mente\nDisparo rimas afiadas pra calar qualquer concorrente\nO raciocínio é veloz a cada segundo presente\nNenhum adversário segura o impacto desse repente`;
    }
    setTranscript(sample);
    extractLiveRhymeSuggestions(sample);
  };

  // Video Filter CSS Mapping
  const getFilterStyle = () => {
    switch (cameraFilter) {
      case 'cyberpunk':
        return 'contrast(125%) saturate(140%) hue-rotate(15deg)';
      case 'dark':
        return 'contrast(135%) grayscale(60%) brightness(90%)';
      case 'neon':
        return 'contrast(120%) saturate(160%) drop-shadow(0 0 10px rgba(245,158,11,0.4))';
      default:
        return 'none';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      
      {/* Active Challenge Theme Banner */}
      {activeChallengeTheme && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Zap className="h-5 w-5 fill-amber-500/30" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Desafio Ativo
                </span>
                <span className="text-sm font-extrabold text-white">
                  {activeChallengeTheme.title}
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                Tema: <span className="font-semibold text-amber-200">{activeChallengeTheme.theme}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400 font-medium">Palavras Obrigatórias:</span>
            {activeChallengeTheme.requiredWords.map((word, idx) => {
              const matched = transcript.toLowerCase().includes(word.toLowerCase());
              return (
                <span
                  key={idx}
                  className={`rounded-md px-2 py-0.5 text-xs font-bold transition-colors ${
                    matched
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                  }`}
                >
                  {word} {matched && '✓'}
                </span>
              );
            })}
            {onClearChallengeTheme && (
              <button
                onClick={onClearChallengeTheme}
                className="ml-2 text-xs text-neutral-400 hover:text-white underline"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Studio Interactive Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* Left Column: Stage & Camera + Beat Machine (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Audio & Video Live Stage Card */}
          <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5 shadow-2xl">
            
            {/* Top Bar: Beat Title, View Mode Selector & Camera Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`h-3 w-3 rounded-full ${isPlayingBeat ? 'bg-emerald-500 animate-ping' : 'bg-neutral-600'}`} />
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white leading-none">
                    {currentBeat.title}
                  </h2>
                  <span className="text-[11px] text-neutral-400">
                    {currentBeat.style} • {bpm} BPM • Tom: {currentBeat.key}
                  </span>
                </div>
              </div>

              {/* Stage View Mode & Camera Controls */}
              <div className="flex items-center gap-2">
                {/* View Mode Buttons */}
                <div className="flex items-center rounded-xl bg-neutral-900 border border-neutral-800 p-0.5">
                  <button
                    onClick={() => {
                      setStageViewMode('camera');
                      if (!isCameraActive) initCamera(true);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                      stageViewMode === 'camera'
                        ? 'bg-amber-500 text-neutral-950 shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Modo Câmera do MC"
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Câmera</span>
                  </button>

                  <button
                    onClick={() => setStageViewMode('spectrum')}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                      stageViewMode === 'spectrum'
                        ? 'bg-amber-500 text-neutral-950 shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Modo Espectro de Áudio"
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Áudio</span>
                  </button>

                  <button
                    onClick={() => {
                      setStageViewMode('split');
                      if (!isCameraActive) initCamera(true);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                      stageViewMode === 'split'
                        ? 'bg-amber-500 text-neutral-950 shadow'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                    title="Modo Split Câmera + Espectro"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Split</span>
                  </button>
                </div>

                {/* Camera Quick Toggle Button */}
                <button
                  id="studio-toggle-camera-btn"
                  onClick={toggleCamera}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold border transition-all ${
                    isCameraActive
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                  title={isCameraActive ? 'Desativar Câmera' : 'Ativar Câmera'}
                >
                  {isCameraActive ? <Camera className="h-3.5 w-3.5" /> : <CameraOff className="h-3.5 w-3.5" />}
                  <span>{isCameraActive ? 'Câmera ON' : 'Câmera OFF'}</span>
                </button>
              </div>
            </div>

            {/* Stage Arena Screen */}
            <div className="relative h-64 sm:h-72 w-full rounded-2xl bg-neutral-950 border border-neutral-800/80 overflow-hidden flex items-center justify-center shadow-inner">
              
              {/* Camera Display Feed */}
              {(stageViewMode === 'camera' || stageViewMode === 'split') && (
                <div className={`relative h-full ${stageViewMode === 'split' ? 'w-1/2 border-r border-neutral-800' : 'w-full'} overflow-hidden bg-neutral-950 flex items-center justify-center`}>
                  {isCameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ filter: getFilterStyle() }}
                      className="h-full w-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                      <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
                        <Camera className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-semibold text-neutral-400">
                        Câmera Desativada
                      </p>
                      <button
                        onClick={() => initCamera(true)}
                        className="rounded-lg bg-amber-500 hover:bg-amber-400 px-3 py-1 text-xs font-bold text-neutral-950 shadow"
                      >
                        Ligar Câmera ao Vivo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Audio Spectrum Canvas */}
              {(stageViewMode === 'spectrum' || stageViewMode === 'split') && (
                <div className={`relative h-full ${stageViewMode === 'split' ? 'w-1/2' : 'w-full'} bg-neutral-950 overflow-hidden flex items-center justify-center`}>
                  <canvas
                    ref={stageViewMode === 'split' ? splitCanvasRef : canvasRef}
                    width={stageViewMode === 'split' ? 320 : 640}
                    height={280}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Camera Filter Controls Overlay */}
              {isCameraActive && stageViewMode !== 'spectrum' && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-neutral-950/80 px-2 py-1 rounded-xl border border-neutral-800 backdrop-blur-md">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Filtro:</span>
                  {(['normal', 'cyberpunk', 'dark', 'neon'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setCameraFilter(f)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                        cameraFilter === f
                          ? 'bg-amber-500 text-neutral-950'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              {/* Compass HUD Badge (1, 2, 3, 4) */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-neutral-950/85 px-3 py-1.5 rounded-xl border border-neutral-800/90 backdrop-blur-md shadow-lg">
                <span className="text-[10px] font-bold text-neutral-400 uppercase mr-0.5">Compasso:</span>
                {[1, 2, 3, 4].map(b => (
                  <div
                    key={b}
                    className={`flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-black transition-all ${
                      isPlayingBeat && currentBeatNumber === b
                        ? 'bg-amber-500 text-neutral-950 scale-110 shadow-lg shadow-amber-500/40'
                        : 'bg-neutral-800/80 text-neutral-400'
                    }`}
                  >
                    {b}
                  </div>
                ))}
              </div>

              {/* Recording Indicator & Live Duration Timer */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {isRecording && (
                  <div className="flex items-center gap-1.5 rounded-xl bg-red-600/90 px-2.5 py-1 text-xs font-black text-white shadow-lg animate-pulse backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-white" />
                    <span>REC</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 rounded-xl bg-neutral-950/85 px-2.5 py-1 text-xs font-mono font-bold text-neutral-200 border border-neutral-800 backdrop-blur-md">
                  <Clock className="h-3 w-3 text-amber-400" />
                  <span>
                    {Math.floor(sessionSeconds / 60).toString().padStart(2, '0')}:
                    {(sessionSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Speed Flow & Voice VAD Live Meter Overlay */}
              {isRecording && (
                <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1.5">
                  
                  {/* Speed Flow Alert Badge */}
                  {isSpeedFlow ? (
                    <div className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 px-3 py-1 text-xs font-black text-white shadow-lg animate-bounce backdrop-blur-md border border-orange-400/50">
                      <Flame className="h-4 w-4 fill-white" />
                      <span>SPEED FLOW ATIVO ({syllablesPerSec} síl/s)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-xl bg-neutral-950/80 px-2.5 py-1 text-[11px] font-bold text-neutral-300 border border-neutral-800 backdrop-blur-md">
                      <Activity className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Flow: {syllablesPerSec} síl/s</span>
                    </div>
                  )}

                  {/* Mic Volume Level Bar */}
                  <div className="flex items-center gap-2 rounded-xl bg-neutral-950/80 px-2.5 py-1 border border-neutral-800 backdrop-blur-md">
                    <Mic className={`h-3.5 w-3.5 ${isSpeaking ? 'text-emerald-400' : 'text-neutral-500'}`} />
                    <div className="h-2 w-20 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-75 ${
                          isSpeedFlow 
                            ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500' 
                            : 'bg-gradient-to-r from-emerald-500 to-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, micVolume * 1.5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Camera error message if permission blocked */}
            {cameraError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-2.5 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Studio Controls (Play, Record, BPM, Volume) */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/80">
              
              {/* Main Play & Record Action Buttons */}
              <div className="flex items-center gap-3">
                
                {/* Beat Play/Stop */}
                <button
                  id="studio-play-beat-btn"
                  onClick={handleToggleBeat}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold shadow-lg transition-all ${
                    isPlayingBeat
                      ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 hover:brightness-110 shadow-amber-500/20'
                  }`}
                >
                  {isPlayingBeat ? (
                    <>
                      <Square className="h-4 w-4 fill-current" />
                      <span>Pausar Beat</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      <span>Iniciar Beat</span>
                    </>
                  )}
                </button>

                {/* Mic Record Toggle */}
                <button
                  id="studio-record-mic-btn"
                  onClick={handleToggleRecording}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold shadow-lg transition-all ${
                    isRecording
                      ? 'bg-red-600 text-white animate-pulse shadow-red-500/30'
                      : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 border border-neutral-700 hover:text-white'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      <span>Finalizar Gravação</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 text-red-400" />
                      <span>Gravar Freestyle</span>
                    </>
                  )}
                </button>
              </div>

              {/* Metronome & Volume Controls */}
              <div className="flex items-center gap-3">
                
                {/* Metronome button */}
                <button
                  id="studio-metronome-btn"
                  onClick={() => setMetronome(!metronome)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-all ${
                    metronome
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                  }`}
                  title="Metrônomo de apoio para contagem de tempo"
                >
                  Metrônomo {metronome ? 'ON' : 'OFF'}
                </button>

                {/* Volume Slider */}
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-neutral-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 accent-amber-500 cursor-pointer"
                    title={`Volume: ${Math.round(volume * 100)}%`}
                  />
                </div>
              </div>
            </div>

            {/* BPM Slider & Stepper */}
            <div className="mt-3 pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs font-bold text-neutral-400">Tempo (BPM):</span>
                <button
                  onClick={() => setBpm(Math.max(60, bpm - 2))}
                  className="h-7 w-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-black text-sm flex items-center justify-center"
                >
                  -
                </button>
                <span className="font-mono text-sm font-black text-amber-400 min-w-[2.5rem] text-center">
                  {bpm}
                </span>
                <button
                  onClick={() => setBpm(Math.min(180, bpm + 2))}
                  className="h-7 w-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-black text-sm flex items-center justify-center"
                >
                  +
                </button>
                <input
                  type="range"
                  min="60"
                  max="180"
                  step="1"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                  className="w-24 sm:w-32 accent-amber-500 cursor-pointer"
                />
              </div>

              {/* AI Prompt Generator Shortcut */}
              <button
                onClick={onOpenPromptGen}
                className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Sortear Tema com IA</span>
              </button>
            </div>
          </div>

          {/* Beat Selector Carousel / List */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-500" />
                Biblioteca de Beats ao Vivo
              </h3>
              <span className="text-[11px] text-neutral-500">
                Sintetizador Web Audio + Bot de Beats
              </span>
            </div>

            {/* Custom Loaded Beat Banner (if chosen from Discord Bot) */}
            {!PRESET_BEATS.some(b => b.id === currentBeat.id) && (
              <div className="mb-3 p-3 rounded-xl border border-[#5865F2]/50 bg-[#5865F2]/10 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5865F2] text-white font-black text-xs shadow">
                    🎧
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-[#5865F2] px-1.5 py-0.2 text-[9px] font-black uppercase text-white">
                        DISCORD /PLAY
                      </span>
                      <span className="text-xs font-bold text-white">{currentBeat.title}</span>
                    </div>
                    <p className="text-[10px] text-neutral-300">
                      {currentBeat.bpm} BPM • {currentBeat.style} • Prod: {currentBeat.producer}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  ATIVO NO STUDIO
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_BEATS.map((beat) => {
                const isSelected = currentBeat.id === beat.id;
                return (
                  <button
                    key={beat.id}
                    onClick={() => setCurrentBeat(beat)}
                    className={`flex items-start gap-3 rounded-xl p-3 text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-500/50 shadow-md'
                        : 'bg-neutral-900/80 border border-neutral-800/80 hover:bg-neutral-800/50 hover:border-neutral-700'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-amber-500 text-neutral-950 font-black' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {isSelected && isPlayingBeat ? (
                        <div className="flex items-center gap-0.5">
                          <span className="h-3 w-1 bg-neutral-950 animate-audio-bar" />
                          <span className="h-4 w-1 bg-neutral-950 animate-audio-bar" style={{ animationDelay: '0.2s' }} />
                          <span className="h-2 w-1 bg-neutral-950 animate-audio-bar" style={{ animationDelay: '0.4s' }} />
                        </div>
                      ) : (
                        <Radio className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                          {beat.title}
                        </span>
                        <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                          {beat.bpm} BPM
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                        {beat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Rhyme HUD Assistant */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Assistente de Rima em Tempo Real
                </h3>
              </div>
              {lastSpokenWord && (
                <span className="text-[11px] text-neutral-400">
                  Última palavra: <strong className="text-amber-400">{lastSpokenWord}</strong>
                </span>
              )}
            </div>

            {liveRhymeSuggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {liveRhymeSuggestions.map((sug, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-neutral-800 border border-neutral-700 px-2.5 py-1 text-xs font-bold text-amber-300 shadow-sm transition-transform hover:scale-105"
                  >
                    {sug}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 py-1">
                Comece a falar no microfone ou digitar versos para receber sugestões dinâmicas de rima.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Live Lyrics, Speed Flow AI Transcriber & AI Feedback (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Live Lyrics Transcription / Input Box */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">
                  {isRecording ? 'Transcrevendo Voz ao Vivo...' : 'Seus Versos de Freestyle'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {lastAudioBlob && (
                  <button
                    onClick={() => handleTranscribeAudioWithAI()}
                    disabled={isTranscribingAI}
                    className="flex items-center gap-1 rounded-lg bg-purple-500/20 border border-purple-500/40 px-2 py-1 text-[11px] font-bold text-purple-300 hover:bg-purple-500/30 transition-colors"
                    title="Transcrever gravação usando IA Multimodal Gemini especializada em Speed Flow"
                  >
                    {isTranscribingAI ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3 text-purple-400" />
                    )}
                    <span>Transcrever com IA</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setTranscript('');
                    setInterimTranscript('');
                    setAnalysisResult(null);
                  }}
                  className="p-1 text-neutral-400 hover:text-white transition-colors"
                  title="Limpar letra"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Lyrics Area */}
            <div className="relative">
              <textarea
                id="studio-lyrics-input"
                rows={6}
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  extractLiveRhymeSuggestions(e.target.value);
                }}
                placeholder={
                  isRecording
                    ? 'Ouvindo sua voz e cadência... Mande seu improviso!'
                    : 'Fale no microfone ou digite suas rimas aqui para receber uma análise profunda de métrica, flow, vocabulário e punchlines...'
                }
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans leading-relaxed"
              />

              {/* Interim realtime ghost text overlay */}
              {interimTranscript && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-400/90 italic bg-neutral-950/60 p-1.5 rounded-lg border border-amber-500/20">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Ouvindo: "{interimTranscript}..."</span>
                </div>
              )}
            </div>

            {/* Quick Demo Verse Injectors for Testing */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-neutral-400">Exemplos rápidos:</span>
              <button
                onClick={() => injectSampleVerse('boombap')}
                className="rounded-md bg-neutral-800 hover:bg-neutral-700 px-2 py-1 text-[11px] font-medium text-neutral-300 transition-colors"
              >
                Boom Bap
              </button>
              <button
                onClick={() => injectSampleVerse('drill')}
                className="rounded-md bg-neutral-800 hover:bg-neutral-700 px-2 py-1 text-[11px] font-medium text-neutral-300 transition-colors"
              >
                BR Drill
              </button>
              <button
                onClick={() => injectSampleVerse('speedflow')}
                className="rounded-md bg-neutral-800 hover:bg-neutral-700 px-2 py-1 text-[11px] font-medium text-orange-300 border border-orange-500/30 transition-colors"
              >
                🔥 Speed Flow
              </button>
            </div>

            {/* Action to Analyze */}
            <button
              id="studio-analyze-btn"
              disabled={isAnalyzing || transcript.trim().length < 5}
              onClick={() => handleAnalyzeLyrics()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isAnalyzing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
                  <span>Analisando Métrica & Rimas com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 fill-current" />
                  <span>Analisar Desempenho & Ganhar XP</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Result Card (Pro Judge Evaluation) */}
          {analysisResult && (
            <div className="rounded-2xl border border-amber-500/40 bg-neutral-900/95 p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              
              {/* Header Score & Verdict Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                      ⚖️ Avaliação Técnica do Jurado
                    </span>
                    {analysisResult.evaluationVerdict && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide border ${
                        analysisResult.evaluationVerdict === 'Lendário'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : analysisResult.evaluationVerdict === 'Excelente'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : analysisResult.evaluationVerdict === 'Sólido'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                          : analysisResult.evaluationVerdict === 'Em Evolução'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                          : 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                      }`}>
                        {analysisResult.evaluationVerdict}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-white tracking-tight">
                      {analysisResult.overallScore}
                    </span>
                    <span className="text-xs text-neutral-400 font-semibold">/ 100 PTS</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2">
                  <Award className="h-5 w-5 text-amber-400" />
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-black text-amber-400">XP Conquistado</span>
                    <p className="text-sm font-black text-white">
                      +{Math.round(analysisResult.overallScore * 2.5)} XP
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Pro Judge Feedback (Straight to the Point) */}
              {(analysisResult.directFeedback || analysisResult.aiCommentary) && (
                <div className="rounded-xl bg-neutral-950 p-3.5 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Visão do Jurado (Direto ao Ponto):</span>
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-400">Análise Real</span>
                  </div>
                  <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                    {analysisResult.directFeedback || analysisResult.aiCommentary}
                  </p>
                </div>
              )}

              {/* 4 to 6 Core Technical Pillars Breakdown */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-neutral-950 p-2.5 border border-neutral-800">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Qualidade da Rima</span>
                    <strong className="text-amber-400">{analysisResult.rhymeQuality}%</strong>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${analysisResult.rhymeQuality}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-neutral-950 p-2.5 border border-neutral-800">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Métrica & Compasso</span>
                    <strong className="text-cyan-400">{analysisResult.metricScore || 75}%</strong>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: `${analysisResult.metricScore || 75}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-neutral-950 p-2.5 border border-neutral-800">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Cadência & Flow</span>
                    <strong className="text-emerald-400">{analysisResult.flowScore}%</strong>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${analysisResult.flowScore}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-neutral-950 p-2.5 border border-neutral-800">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Punchline & Ataque</span>
                    <strong className="text-rose-400">{analysisResult.punchlineImpact || 70}%</strong>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${analysisResult.punchlineImpact || 70}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-neutral-950 p-2.5 border border-neutral-800">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Vocabulário Único</span>
                    <strong className="text-purple-400">{Math.round(analysisResult.uniqueWordsRatio * 100)}%</strong>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${analysisResult.uniqueWordsRatio * 100}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-neutral-950 p-2.5 border border-neutral-800">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Coerência Temática</span>
                    <strong className="text-blue-400">{analysisResult.coherenceScore}%</strong>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${analysisResult.coherenceScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Punchline & Flow Tips */}
              {(analysisResult.punchlineFeedback || analysisResult.flowTips) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {analysisResult.punchlineFeedback && (
                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                      <strong className="text-rose-400 block mb-0.5">💥 Impacto da Punchline:</strong>
                      <span className="text-neutral-300 text-[11px]">{analysisResult.punchlineFeedback}</span>
                    </div>
                  )}
                  {analysisResult.flowTips && (
                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                      <strong className="text-emerald-400 block mb-0.5">⏱️ Dica de Encaixe no Beat:</strong>
                      <span className="text-neutral-300 text-[11px]">{analysisResult.flowTips}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Surgical Corrections from Pro Judge */}
              {analysisResult.corrections && analysisResult.corrections.length > 0 && (
                <div className="rounded-xl bg-orange-950/20 border border-orange-500/30 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400">
                    <span>🎯 Correções Cirúrgicas:</span>
                  </div>
                  <ul className="list-disc pl-4 text-[11px] text-neutral-200 space-y-0.5">
                    {analysisResult.corrections.map((corr, idx) => (
                      <li key={idx}>{corr}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rhyme Pairs Detected */}
              {analysisResult.rhymePairs && analysisResult.rhymePairs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-neutral-300 mb-1.5">
                    Pares de Rima Identificados ({analysisResult.rhymePairs.length}):
                  </h4>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {analysisResult.rhymePairs.map((pair, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-neutral-950 border border-neutral-800 px-2 py-1 text-xs text-neutral-300"
                      >
                        <strong className="text-amber-400">{pair.word1}</strong> ↔{' '}
                        <strong className="text-amber-400">{pair.word2}</strong>{' '}
                        <span className="text-[10px] text-neutral-500">({pair.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Improvements */}
              <div className="space-y-2 text-xs">
                {analysisResult.strengths && analysisResult.strengths.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Pontos Fortes:</span>
                    </div>
                    <ul className="list-disc pl-5 text-neutral-300 space-y-0.5 text-[11px]">
                      {analysisResult.strengths.map((str, i) => (
                        <li key={i}>{str}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.improvements && analysisResult.improvements.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-bold text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Para Subir de Nível:</span>
                    </div>
                    <ul className="list-disc pl-5 text-neutral-300 space-y-0.5 text-[11px]">
                      {analysisResult.improvements.map((imp, i) => (
                        <li key={i}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommended Next Exercise */}
              {analysisResult.nextExercise && (
                <div className="pt-2 border-t border-neutral-800 text-xs text-neutral-300 flex items-center justify-between">
                  <div>
                    💡 <strong className="text-white">Próximo Treino Recomendado:</strong> {analysisResult.nextExercise}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
