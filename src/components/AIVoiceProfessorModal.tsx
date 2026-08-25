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
  AlertCircle
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
  const [conversation, setConversation] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'coach',
      text: `Salve, ${profile?.artisticName || 'MC'}! Sou o Professor Rima IA do RimaLab. Como posso te ajudar hoje? Pode falar comigo no microfone ou digitar: métrica, velocidade de flow, punchlines ou uma trocação de rimas de treino!`,
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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      disconnectLive();
    }
  }, [isOpen]);

  const disconnectLive = () => {
    try {
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      if (inputAudioCtxRef.current && inputAudioCtxRef.current.state !== 'closed') {
        inputAudioCtxRef.current.close();
        inputAudioCtxRef.current = null;
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.stopAll();
        audioPlayerRef.current.close();
        audioPlayerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    } catch (e) {
      console.warn('Error during live disconnect:', e);
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsMicActive(false);
    setIsCoachSpeaking(false);
    setAudioLevel(0);
  };

  const startLiveSession = async () => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      // 1. Initialize 24kHz Audio Player for responses
      audioPlayerRef.current = new LiveAudioPlayer();

      // 2. Establish WebSocket connection to backend Live API
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live-coach`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('[Live Professor] WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        onShowToast('🎙️ Professor Conectado!', 'A voz ao vivo da IA está ativa no Gemini Live.');

        // 3. Request Microphone Access
        try {
          await startMicrophoneStream(ws);
        } catch (micErr) {
          console.warn('Microphone stream error:', micErr);
          setErrorMessage('Microfone não ativado automaticamente. Você pode digitar ou permitir o microfone.');
        }

        // Send initial greeting context
        ws.send(JSON.stringify({
          text: `[Contexto: Aluno ${profile?.artisticName || 'MC'}, nível ${profile?.level || 1}, estilo ${profile?.favoriteStyle || 'Boom Bap'}. Dê as boas-vindas curtas e com rima, em português, e pergunte o que vamos treinar agora!]`
        }));
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
          } else if (data.type === 'error') {
            setErrorMessage(data.error || 'Erro no canal do Professor IA');
            setIsConnecting(false);
          }
        } catch (err) {
          console.warn('Live message parse error:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('[Live Professor] WS error:', err);
        setErrorMessage('Não foi possível conectar com o Gemini Live API. Verifique a chave de API ou conexão.');
        setIsConnecting(false);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('[Live Professor] WS closed');
        setIsConnected(false);
        setIsConnecting(false);
        setIsCoachSpeaking(false);
        setIsMicActive(false);
      };

    } catch (err: unknown) {
      console.error('Failed to start live session:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao iniciar Professor IA';
      setErrorMessage(msg);
      setIsConnecting(false);
    }
  };

  const startMicrophoneStream = async (ws: WebSocket) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
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
      setAudioLevel(Math.min(100, Math.round(rms * 250)));

      // Send PCM audio via WebSocket to Gemini Live
      if (ws && ws.readyState === WebSocket.OPEN) {
        const base64PCM = pcmFloat32ToBase64(channelData);
        ws.send(JSON.stringify({ audio: base64PCM }));
      }
    };

    source.connect(processor);
    processor.connect(inputAudioCtx.destination);
    setIsMicActive(true);
  };

  const handleToggleMic = async () => {
    if (isMicActive) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
      }
      setIsMicActive(false);
      setAudioLevel(0);
    } else {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          await startMicrophoneStream(wsRef.current);
          onShowToast('🎤 Microfone Ativo', 'O Professor Rima está te ouvindo em tempo real!');
        } catch (e) {
          setErrorMessage('Erro ao acessar o microfone.');
        }
      } else {
        startLiveSession();
      }
    }
  };

  const handleSendText = (customText?: string) => {
    const textToSend = customText || textInput;
    if (!textToSend.trim()) return;

    // Add user message to conversation
    const newMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setConversation(prev => [...prev, newMsg]);

    if (!customText) setTextInput('');

    // If connected via Live WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text: textToSend }));
    } else {
      // Fallback via HTTP API
      handleHttpFallback(textToSend);
    }

    if (onGainXP) {
      onGainXP(15, 'Treino com o Professor Rima IA');
    }
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
        const replyText = data.reply || 'Excelente treino! Mantenha a respiração no tempo do bumbo e da caixa!';
        setConversation(prev => [
          ...prev,
          {
            id: `coach_${Date.now()}`,
            sender: 'coach',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        // If Speech Synthesis available, read aloud for seamless voice feel
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(replyText);
          utterance.lang = 'pt-BR';
          utterance.rate = 1.05;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-neutral-950 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-red-600 text-neutral-950 font-black shadow-lg shadow-amber-500/20">
              <Mic className="h-6 w-6 text-neutral-950" />
              {isConnected && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-neutral-950"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white">
                  Professor Rima <span className="text-amber-400">Live Voice</span>
                </h2>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                  Gemini 3.1 Flash Live
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Treinador vocal de Freestyle, Métrica e Flow em Tempo Real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="coach-close-btn"
              onClick={onClose}
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Live Audio Visualizer Bar */}
        <div className="px-5 py-3 bg-neutral-900/90 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Live Connection Status Button */}
            {!isConnected ? (
              <button
                id="connect-live-voice-btn"
                onClick={startLiveSession}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105 disabled:opacity-50"
              >
                <Radio className={`h-4 w-4 ${isConnecting ? 'animate-spin' : 'animate-pulse'}`} />
                <span>{isConnecting ? 'Conectando ao Live...' : '🎙️ Ligar Voz em Tempo Real'}</span>
              </button>
            ) : (
              <button
                id="disconnect-live-voice-btn"
                onClick={disconnectLive}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 font-bold text-xs hover:bg-red-900 transition-colors"
              >
                <Square className="h-3.5 w-3.5 fill-red-400 text-red-400" />
                <span>Desconectar Live</span>
              </button>
            )}

            {/* Mic Toggle Button */}
            <button
              id="toggle-mic-coach-btn"
              onClick={handleToggleMic}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                isMicActive
                  ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                  : 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {isMicActive ? (
                <>
                  <Mic className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                  <span>Microfone Ligado</span>
                </>
              ) : (
                <>
                  <MicOff className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Microfone Mudo</span>
                </>
              )}
            </button>
          </div>

          {/* Live Waveform Indicator */}
          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
            <span className="text-[11px] font-bold text-neutral-400">Status:</span>
            {isCoachSpeaking ? (
              <span className="flex items-center gap-1 text-[11px] font-black text-amber-400 animate-pulse">
                <Volume2 className="h-3.5 w-3.5 text-amber-400" />
                Professor Falando...
              </span>
            ) : isMicActive ? (
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-bold text-emerald-400">Ouvindo você...</span>
                <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-75"
                    style={{ width: `${Math.max(5, audioLevel)}%` }}
                  />
                </div>
              </div>
            ) : (
              <span className="text-[11px] font-medium text-neutral-500">Pronto para conversar</span>
            )}
          </div>
        </div>

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

        {/* Quick Training Modes / Suggested Prompts */}
        <div className="px-5 py-2.5 bg-neutral-950 border-b border-neutral-800 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 shrink-0">
            Treinos Rápidos:
          </span>

          <button
            onClick={() => selectQuickPractice('speed_flow', 'Professor, me passa um exercício prático para aumentar a velocidade do meu flow sem embolar as palavras?')}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 font-medium shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <Zap className="h-3 w-3 text-amber-400" />
            <span>Speed Flow</span>
          </button>

          <button
            onClick={() => selectQuickPractice('punchlines', 'Professor, como eu construo uma punchline forte preparando o terceiro compasso para explodir no quarto?')}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 font-medium shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <Flame className="h-3 w-3 text-orange-400" />
            <span>Punchlines</span>
          </button>

          <button
            onClick={() => selectQuickPractice('troca_rimas', 'Professor, manda 2 versos e deixa o terceiro e quarto para eu rimar de volta!')}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 font-medium shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <Music className="h-3 w-3 text-amber-400" />
            <span>Troca de Rimas</span>
          </button>

          <button
            onClick={() => selectQuickPractice('metrica', 'Professor, como respirar e não perder o tempo quando o beat estiver a 95 BPM?')}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-neutral-300 hover:text-amber-300 font-medium shrink-0 flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="h-3 w-3 text-cyan-400" />
            <span>Métrica & Respiração</span>
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
                  {msg.sender === 'user' ? (profile?.artisticName || 'Você') : 'Professor Rima IA'}
                </span>
                <span className="text-[9px] text-neutral-500">{msg.timestamp}</span>
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-neutral-950 font-semibold shadow-md'
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
              <span>Professor formulando e cantando rimas...</span>
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
              placeholder="Pergunte ao Professor, mande uma rima para ele avaliar ou ligue o mic acima..."
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
              Ganhe <strong className="text-amber-300">+15 XP</strong> a cada interação pedagógica.
            </span>
            <span className="text-neutral-400">
              Voz de IA em tempo real powered by Gemini Live API
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
