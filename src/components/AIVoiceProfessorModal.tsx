import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  X, 
  Flame, 
  Zap, 
  Radio, 
  RotateCcw, 
  Send, 
  BookOpen, 
  Award,
  Play,
  Square,
  Music,
  CheckCircle2,
  AlertCircle,
  MessageSquareQuote,
  Activity
} from 'lucide-react';
import { LiveAudioPlayer, pcmFloat32ToBase64 } from '../lib/audio/liveAudioUtils';
import { UserProfile, Subscription } from '../types';

interface AIVoiceProfessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  subscription: Subscription | null;
  onShowToast: (title: string, desc: string, type?: 'xp' | 'ach' | 'info') => void;
  onGainXP?: (amount: number, reason: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'coach' | 'system';
  text: string;
  timestamp: string;
}

export const AIVoiceProfessorModal: React.FC<AIVoiceProfessorModalProps> = ({
  isOpen,
  onClose,
  profile,
  subscription,
  onShowToast,
  onGainXP,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCoachSpeaking, setIsCoachSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [conversation, setConversation] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: `Salve, ${profile?.artisticName || 'MC'}! Sou o Professor Rima IA ao vivo. Meu microfone está sincronizado para te ouvir em tempo real enquanto você fala e te responder no instante em que você terminar o verso! Pode soltar sua rima ou tirar dúvidas de métrica e flow!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [textInput, setTextInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<'geral' | 'speed_flow' | 'punchlines' | 'metrica' | 'troca_rimas'>('geral');
  const [audioLevel, setAudioLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<LiveAudioPlayer | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenTextRef = useRef<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, liveTranscript]);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      disconnectLive();
    } else {
      // Auto-initialize when modal opens for instant ready state
      startLiveSession(true);
    }
  }, [isOpen]);

  const disconnectLive = () => {
    stopSpeechRecognition();
    stopMicrophoneStream();
    
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stopAll();
      audioPlayerRef.current.close();
      audioPlayerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsMicActive(false);
    setIsCoachSpeaking(false);
    setAudioLevel(0);
    setLiveTranscript('');
  };

  const stopMicrophoneStream = () => {
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {}
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      } catch {}
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
      try {
        inputAudioCtxRef.current.close();
      } catch {}
      inputAudioCtxRef.current = null;
    }
  };

  const stopSpeechRecognition = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const startLiveSession = async (autoStartMic = false) => {
    if (isConnected || isConnecting) return;
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      // 1. Initialize Audio Player for responses
      audioPlayerRef.current = new LiveAudioPlayer();

      // 2. Establish WebSocket connection to backend Live API
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live-coach`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setIsConnecting(false);
        onShowToast('🎙️ Professor Rima Conectado!', 'Voz ao vivo da IA pronta para conversar e avaliar suas rimas.');

        // Start mic stream and speech recognition immediately
        if (autoStartMic) {
          try {
            await startMicrophoneStream(ws);
            startSpeechRecognition();
          } catch (micErr) {
            console.warn('Auto mic start warning:', micErr);
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'audio' && data.audio) {
            setIsCoachSpeaking(true);
            audioPlayerRef.current?.playChunk(data.audio);
          } else if (data.type === 'text' && data.text) {
            setConversation((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.sender === 'coach' && last.id !== 'welcome') {
                return [
                  ...prev.slice(0, -1),
                  { ...last, text: last.text + data.text },
                ];
              } else {
                return [
                  ...prev,
                  {
                    id: `coach_${Date.now()}`,
                    sender: 'coach',
                    text: data.text,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ];
              }
            });
          } else if (data.type === 'turnComplete') {
            setIsCoachSpeaking(false);
          } else if (data.type === 'interrupted') {
            audioPlayerRef.current?.stopAll();
            setIsCoachSpeaking(false);
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
          } else if (data.type === 'error') {
            setErrorMessage(data.error || 'Erro no canal do Professor IA');
            setIsConnecting(false);
          }
        } catch (err) {
          console.warn('Live message parse error:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[Live Professor] WS fallback to HTTP stream');
        setIsConnecting(false);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setIsCoachSpeaking(false);
      };

    } catch (err: unknown) {
      console.warn('Live session init fallback:', err);
      setIsConnecting(false);
    }
  };

  const startMicrophoneStream = async (ws?: WebSocket | null) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const inputAudioCtx = new AudioContextClass({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputAudioCtx;

      const source = inputAudioCtx.createMediaStreamSource(stream);
      const processor = inputAudioCtx.createScriptProcessor(2048, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const channelData = e.inputBuffer.getChannelData(0);
        
        // Calculate audio meter level
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        const level = Math.min(100, Math.round(rms * 350));
        setAudioLevel(level);

        // Barge-in: if user starts speaking while coach is speaking, interrupt coach
        if (level > 25 && isCoachSpeaking) {
          interruptCoach();
        }

        // Send PCM audio via WebSocket to Gemini Live if open
        const activeWs = ws || wsRef.current;
        if (activeWs && activeWs.readyState === WebSocket.OPEN) {
          const base64PCM = pcmFloat32ToBase64(channelData);
          activeWs.send(JSON.stringify({ audio: base64PCM }));
        }
      };

      source.connect(processor);
      processor.connect(inputAudioCtx.destination);
      setIsMicActive(true);
    } catch (err: any) {
      console.warn('Microphone stream error:', err);
      setErrorMessage('Acesso ao microfone negado ou indisponível.');
      setIsMicActive(false);
    }
  };

  const startSpeechRecognition = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      console.warn('SpeechRecognition API not available in browser');
      return;
    }

    stopSpeechRecognition();

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'pt-BR';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        const currentSpeech = (finalText || interimText).trim();
        if (currentSpeech) {
          setLiveTranscript(currentSpeech);
          lastSpokenTextRef.current = currentSpeech;

          // Barge-in interruption
          if (isCoachSpeaking) {
            interruptCoach();
          }

          // Voice Activity Detection: reset silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Auto-respond when student pauses speaking (>650ms of silence)
          silenceTimerRef.current = setTimeout(() => {
            const textToRespond = lastSpokenTextRef.current.trim();
            if (textToRespond && textToRespond.length > 2) {
              setLiveTranscript('');
              lastSpokenTextRef.current = '';
              handleUserSpokeTurn(textToRespond);
            }
          }, 650);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition error:', event.error);
        }
      };

      recognition.onend = () => {
        // Auto-restart recognition if mic is still active
        if (isMicActive) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (e) {
      console.warn('Could not start speech recognition:', e);
    }
  };

  const interruptCoach = () => {
    setIsCoachSpeaking(false);
    audioPlayerRef.current?.stopAll();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: '[Aluno começou a falar, interrompa a fala anterior imediatamente]' }));
    }
  };

  // Immediate toggle of mic with real-time update
  const handleToggleMic = async () => {
    if (isMicActive) {
      // User pressed mute: stop microphone and speech recognition
      stopSpeechRecognition();
      stopMicrophoneStream();
      setIsMicActive(false);
      setAudioLevel(0);

      // If user had spoken something right before muting, dispatch immediately
      const pendingText = (liveTranscript || lastSpokenTextRef.current).trim();
      if (pendingText) {
        setLiveTranscript('');
        lastSpokenTextRef.current = '';
        handleUserSpokeTurn(pendingText);
      }
      onShowToast('🔇 Microfone Mudo', 'Microfone pausado. Clique para falar novamente.');
    } else {
      // User pressed unmute: start stream and recognition instantly
      if (!isConnected) {
        await startLiveSession(true);
      } else {
        await startMicrophoneStream(wsRef.current);
        startSpeechRecognition();
      }
      setIsMicActive(true);
      onShowToast('🎤 Microfone Ativo', 'Professor Rima ouvindo em tempo real!');
    }
  };

  const handleUserSpokeTurn = (text: string) => {
    if (!text.trim()) return;

    // Add user message to conversation
    const newMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setConversation(prev => [...prev, newMsg]);

    // Send to WebSocket or HTTP rapid fallback
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: text.trim() }));
    } else {
      handleHttpFallback(text.trim());
    }

    if (onGainXP) {
      onGainXP(15, 'Treino de voz com Professor Rima');
    }
  };

  const handleSendText = (customText?: string) => {
    const textToSend = customText || textInput;
    if (!textToSend.trim()) return;

    handleUserSpokeTurn(textToSend);
    if (!customText) setTextInput('');
  };

  const handleHttpFallback = async (text: string) => {
    setIsCoachSpeaking(true);
    try {
      const res = await fetch('/api/voice-coach/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          topic: selectedTopic,
          userStyle: profile?.favoriteStyle || 'Boom Bap',
          artisticName: profile?.artisticName || 'MC',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || 'Visão! Treino de alto nível. Mantenha o ritmo no 4/4 e acerte a punchline na caixa!';
        
        setConversation(prev => [
          ...prev,
          {
            id: `coach_${Date.now()}`,
            sender: 'coach',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        // Speak aloud with SpeechSynthesis for immediate instant response
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(replyText);
          utterance.lang = 'pt-BR';
          utterance.rate = 1.1;
          utterance.pitch = 0.95;
          utterance.onend = () => setIsCoachSpeaking(false);
          utterance.onerror = () => setIsCoachSpeaking(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setIsCoachSpeaking(false);
        }
      }
    } catch (e) {
      console.warn('HTTP coach fallback error:', e);
      setIsCoachSpeaking(false);
    }
  };

  const selectQuickPractice = (topic: typeof selectedTopic, promptText: string) => {
    setSelectedTopic(topic);
    handleSendText(promptText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-neutral-950 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-neutral-950 font-black shadow-lg shadow-amber-500/20">
              <Mic className="h-6 w-6 text-neutral-950" />
              {isMicActive && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-neutral-950"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Professor Rima <span className="text-amber-400">Live Voice</span>
                </h2>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  Ao Vivo & Em Tempo Real
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Fala simultânea e resposta instantânea para treino de freestyle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="coach-close-btn"
              onClick={onClose}
              className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Live Audio Control & Visualizer Bar */}
        <div className="px-5 py-3.5 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Main Microphone Button */}
            <button
              id="toggle-mic-coach-btn"
              onClick={handleToggleMic}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md active:scale-95 ${
                isMicActive
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-500/20'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
              }`}
            >
              {isMicActive ? (
                <>
                  <Mic className="h-4 w-4 animate-bounce text-neutral-950" />
                  <span>Microfone Ligado (Ouvindo)</span>
                </>
              ) : (
                <>
                  <MicOff className="h-4 w-4 text-neutral-400" />
                  <span>Microfone Mudo (Clique para Falar)</span>
                </>
              )}
            </button>

            {/* Live Mode Connection Toggle */}
            {!isConnected ? (
              <button
                id="connect-live-voice-btn"
                onClick={() => startLiveSession(true)}
                disabled={isConnecting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all"
              >
                <Radio className={`h-3.5 w-3.5 ${isConnecting ? 'animate-spin' : 'animate-pulse'}`} />
                <span>{isConnecting ? 'Conectando...' : 'Reconectar Servidor'}</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                <Activity className="h-3.5 w-3.5 animate-pulse" />
                Conectado
              </span>
            )}
          </div>

          {/* Live Waveform / Audio State Indicator */}
          <div className="flex items-center gap-3 bg-neutral-950 px-3.5 py-2 rounded-xl border border-neutral-800">
            <span className="text-[11px] font-bold text-neutral-400">Estado:</span>
            {isCoachSpeaking ? (
              <span className="flex items-center gap-1.5 text-xs font-black text-amber-400 animate-pulse">
                <Volume2 className="h-4 w-4 text-amber-400" />
                Professor Falando...
              </span>
            ) : isMicActive ? (
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-emerald-400">Ouvindo sua voz</span>
                <div className="w-20 h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                    style={{ width: `${Math.max(8, audioLevel)}%` }}
                  />
                </div>
              </div>
            ) : (
              <span className="text-xs font-medium text-neutral-500">Mudo (Clique no microfone para falar)</span>
            )}
          </div>
        </div>

        {/* Real-time Spoken Words Floating Banner */}
        {liveTranscript && isMicActive && (
          <div className="px-5 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 text-xs text-amber-300 animate-in fade-in slide-in-from-top-2 duration-150">
            <MessageSquareQuote className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="font-bold shrink-0">Ouvindo agora:</span>
            <span className="italic text-white truncate font-mono">"{liveTranscript}"</span>
          </div>
        )}

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="px-5 py-2.5 bg-red-950/70 border-b border-red-800/50 flex items-center justify-between text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="text-red-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Quick Training Modes */}
        <div className="px-5 py-2.5 bg-neutral-950 border-b border-neutral-800 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 shrink-0">
            Atalhos:
          </span>

          <button
            onClick={() => selectQuickPractice('troca_rimas', 'Professor, manda 2 versos de rap no estilo Boom Bap e deixa o terceiro e quarto para eu responder!')}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 font-medium shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <Music className="h-3 w-3 text-amber-400" />
            <span>⚔️ Troca de Rimas</span>
          </button>

          <button
            onClick={() => selectQuickPractice('punchlines', 'Professor, como eu preparo a rima do terceiro compasso para a punchline explodir no quarto compasso?')}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 font-medium shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <Flame className="h-3 w-3 text-orange-400" />
            <span>🔥 Punchlines</span>
          </button>

          <button
            onClick={() => selectQuickPractice('speed_flow', 'Professor, me passa uma técnica para dobrar o speed flow sem engasgar as sílabas?')}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 font-medium shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <Zap className="h-3 w-3 text-amber-400" />
            <span>⚡ Speed Flow</span>
          </button>

          <button
            onClick={() => selectQuickPractice('metrica', 'Professor, como controlar a respiração para não perder o compasso 4/4 a 95 BPM?')}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 font-medium shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="h-3 w-3 text-cyan-400" />
            <span>🥁 Métrica & Tempo</span>
          </button>
        </div>

        {/* Conversation Message Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[260px] max-h-[420px] bg-gradient-to-b from-neutral-950 via-neutral-900/50 to-neutral-950">
          {conversation.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-bold text-neutral-400">
                  {msg.sender === 'user' ? (profile?.artisticName || 'Você') : '👑 Professor Rima IA'}
                </span>
                <span className="text-[9px] text-neutral-500">{msg.timestamp}</span>
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-neutral-950 font-bold shadow-md'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-200 shadow-inner'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>
            </div>
          ))}

          {isCoachSpeaking && (
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold py-1 px-2 animate-pulse">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Professor Rima formulando e cantando ao vivo...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendText();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="coach-text-input"
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Fale no microfone ou digite uma rima/pergunta aqui..."
              className="flex-1 rounded-xl bg-neutral-950 border border-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
            />

            <button
              id="coach-send-text-btn"
              type="submit"
              disabled={!textInput.trim()}
              className="flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold p-2.5 transition-all disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-neutral-400 px-1">
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-400" />
              Ganhe <strong className="text-amber-300">+15 XP</strong> a cada rima ou pergunta praticada.
            </span>
            <span className="text-neutral-500">
              Resposta por voz em tempo real
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
