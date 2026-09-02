import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Radio, 
  ExternalLink, 
  Copy, 
  Check, 
  Users, 
  Sparkles, 
  Mic, 
  Volume2, 
  Flame, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Play, 
  Square,
  MessageSquare,
  Award,
  RefreshCw,
  Headphones,
  Zap,
  Globe,
  Swords,
  ChevronDown,
  ChevronUp,
  Search,
  CheckCircle2,
  Share2,
  VolumeX,
  Bell,
  BellOff,
  RotateCcw,
  SkipForward,
  Shuffle,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { LiveCallSession, UserProfile, Subscription, Beat } from '../types';
import { PRESET_BEATS, globalBeatEngine } from '../lib/audio/beatEngine';
import { FREESTYLE_WORDS, FreestyleWordItem, MentorshipCheckin } from '../data/freestyleTopics';

interface LiveCallRoomProps {
  liveCall: LiveCallSession | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  onOpenAdmin: () => void;
  onOpenSubscription: () => void;
  onOpenStudio: () => void;
  onOpenVoiceCoach?: () => void;
  isPlayingBeat: boolean;
  onToggleBeat: () => void;
  currentBeat: Beat;
  onSelectBeat: (beat: Beat) => void;
  onShowToast: (title: string, desc: string, type?: 'xp' | 'ach' | 'info') => void;
  onAddXP?: (amount: number, reason: string) => void;
}

export interface DiscordVoiceChannel {
  id: string;
  name: string;
  category: '🔊 Salas de Prática' | '🎤 Call Aulas - Iniciante' | '🎤 Call Aulas - Intermediário' | '🎤 Call Aulas - Avançado' | string;
  topic?: string;
  url?: string;
  userCount: number;
  isActiveCall?: boolean;
  users: string[];
}

export interface DiscordServerStatus {
  guildId: string;
  serverName: string;
  instantInvite: string;
  widgetUrl: string;
  presenceCount: number;
  isLiveCallActive: boolean;
  voiceChannels: DiscordVoiceChannel[];
  onlineMembers: Array<{
    id: string;
    username: string;
    status: string;
    role?: string;
    inCall?: boolean;
    channelName?: string;
  }>;
}

const DEFAULT_CHANNELS: DiscordVoiceChannel[] = [
  // 🔊 Salas de Prática
  {
    id: 'vc_pratica_1',
    name: '👥 Prática Livre 1',
    category: '🔊 Salas de Prática',
    topic: 'Sala de voz para prática de rimas ao vivo e improviso aberto',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_pratica_2',
    name: '👥 Prática Livre 2',
    category: '🔊 Salas de Prática',
    topic: 'Sala de treino de rimas e troca de ideias',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_pratica_3',
    name: '👥 Prática Livre 3',
    category: '🔊 Salas de Prática',
    topic: 'Rimas livres e desafios rápidos',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_studio_virtual',
    name: '👥 Studio Virtual',
    category: '🔊 Salas de Prática',
    topic: 'Gravação e mixagem de improviso com instrumental',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_freestyle_24h',
    name: '👥 Freestyle 24h',
    category: '🔊 Salas de Prática',
    topic: 'Canal de voz 24h aberto para treino contínuo no beat',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },

  // 🎤 Call Aulas - Iniciante
  {
    id: 'vc_aula_ini_1',
    name: '👥 Aula Iniciante 1',
    category: '🎤 Call Aulas - Iniciante',
    topic: 'Aulas fundamentais de rima, métrica e dicção',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_aula_ini_2',
    name: '👥 Aula Iniciante 2',
    category: '🎤 Call Aulas - Iniciante',
    topic: 'Sala complementar de aula para novos MCs',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_mentoria_1_1',
    name: '👥 Mentoria Um-a-Um',
    category: '🎤 Call Aulas - Iniciante',
    topic: 'Mentoria individual direta com os professores',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_workshop_ini',
    name: '👥 Workshop Iniciante',
    category: '🎤 Call Aulas - Iniciante',
    topic: 'Workshops práticos de rima e ritmo no beat',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_pratica_guiada',
    name: '👥 Prática Guiada',
    category: '🎤 Call Aulas - Iniciante',
    topic: 'Treino assistido passo a passo',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },

  // 🎤 Call Aulas - Intermediário
  {
    id: 'vc_aula_inter_1',
    name: '👥 Aula Intermediário 1',
    category: '🎤 Call Aulas - Intermediário',
    topic: 'Métrica avançada, flow melódico e encaixe no compasso',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_aula_inter_2',
    name: '👥 Aula Intermediário 2',
    category: '🎤 Call Aulas - Intermediário',
    topic: 'Treino de velocidade de raciocínio e resposta',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_seminario_tec',
    name: '👥 Seminário Técnico',
    category: '🎤 Call Aulas - Intermediário',
    topic: 'Seminário de estruturação lírica e figuras de linguagem',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_debate_criativo',
    name: '👥 Debate Criativo',
    category: '🎤 Call Aulas - Intermediário',
    topic: 'Debate de temas para batalhas temáticas e rima de mensagem',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_jam_session',
    name: '👥 Jam Session',
    category: '🎤 Call Aulas - Intermediário',
    topic: 'Jam de improviso coletivo',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },

  // 🎤 Call Aulas - Avançado
  {
    id: 'vc_masterclass',
    name: '👥 Masterclass',
    category: '🎤 Call Aulas - Avançado',
    topic: 'Masterclass de alto rendimento para MCs de batalha',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_mentorado_av',
    name: '👥 Mentorado Avançado',
    category: '🎤 Call Aulas - Avançado',
    topic: 'Acompanhamento de MCs profissionais',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_aula_av_1',
    name: '👥 Aula Avançado 1',
    category: '🎤 Call Aulas - Avançado',
    topic: 'Técnicas de contra-ataque e punchlines de 4 compassos',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_aula_av_2',
    name: '👥 Aula Avançado 2',
    category: '🎤 Call Aulas - Avançado',
    topic: 'Presença cênica, respiração e leitura de jurados',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
  {
    id: 'vc_roda_rim',
    name: '👥 Roda de Rim',
    category: '🎤 Call Aulas - Avançado',
    topic: 'Roda de rima fechada de alto nível',
    url: 'https://discord.com/channels/1522381290001928242',
    userCount: 0,
    isActiveCall: false,
    users: [],
  },
];

export const LiveCallRoom: React.FC<LiveCallRoomProps> = ({
  liveCall,
  profile,
  subscription,
  onOpenAdmin,
  onOpenSubscription,
  onOpenStudio,
  onOpenVoiceCoach,
  isPlayingBeat,
  onToggleBeat,
  currentBeat,
  onSelectBeat,
  onShowToast,
  onAddXP,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [selectedBeatId, setSelectedBeatId] = useState(currentBeat.id);
  const [isRefreshingDiscord, setIsRefreshingDiscord] = useState(false);
  const [showDiscordWidgetEmbed, setShowDiscordWidgetEmbed] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Audio alerts settings
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('rimalab_audio_alerts') !== 'false';
    } catch {
      return true;
    }
  });

  // Discord Server 1522381290001928242 live status
  const [discordStatus, setDiscordStatus] = useState<DiscordServerStatus>({
    guildId: '1522381290001928242',
    serverName: '🎤 Academia de Rimas',
    instantInvite: 'https://discord.gg/xXEEtTZzd',
    widgetUrl: 'https://discord.com/widget?id=1522381290001928242&theme=dark',
    presenceCount: 0,
    isLiveCallActive: false,
    voiceChannels: DEFAULT_CHANNELS,
    onlineMembers: [],
  });

  const previousOccupantsRef = useRef<number>(0);

  // Sound synthesis for alerts
  const playAlertChime = (type: 'call_start' | 'turn_switch' | 'beat_tick' = 'call_start') => {
    if (!audioAlertsEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      if (type === 'call_start') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'turn_switch') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'beat_tick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch {}
  };

  const toggleAudioAlerts = () => {
    const next = !audioAlertsEnabled;
    setAudioAlertsEnabled(next);
    try {
      localStorage.setItem('rimalab_audio_alerts', String(next));
    } catch {}
    if (next) {
      playAlertChime('call_start');
      onShowToast('🔔 Alertas Sonoros Ativados', 'Você ouvirá um sinal quando novas chamadas forem iniciadas.', 'info');
    } else {
      onShowToast('🔕 Alertas Sonoros Silenciados', 'Notificações de áudio desativadas.', 'info');
    }
  };

  const fetchDiscordServerStatus = async () => {
    setIsRefreshingDiscord(true);
    try {
      const res = await fetch('/api/discord/server');
      if (res.ok) {
        const data = await res.json();
        const nextChannels = (data.voiceChannels && data.voiceChannels.length > 0) ? data.voiceChannels : DEFAULT_CHANNELS;
        const currentOccupants = nextChannels.reduce((sum: number, ch: DiscordVoiceChannel) => sum + (ch.userCount || 0), 0);

        // Check if new people joined
        if (currentOccupants > previousOccupantsRef.current && previousOccupantsRef.current !== 0) {
          playAlertChime('call_start');
          onShowToast(
            '🔥 Novos MCs na Call!',
            `A contagem de participantes aumentou para ${currentOccupants} pessoas no servidor.`,
            'ach'
          );
        }
        previousOccupantsRef.current = currentOccupants;

        setDiscordStatus(prev => ({
          ...prev,
          guildId: data.guildId || prev.guildId,
          serverName: data.serverName || prev.serverName,
          instantInvite: data.instantInvite || prev.instantInvite,
          widgetUrl: data.widgetUrl || prev.widgetUrl,
          presenceCount: typeof data.presenceCount === 'number' ? data.presenceCount : 0,
          isLiveCallActive: Boolean(data.isLiveCallActive),
          voiceChannels: nextChannels,
          onlineMembers: data.onlineMembers || [],
        }));
      }
    } catch (e) {
      console.warn('Discord server status fetch fallback:', e);
    } finally {
      setIsRefreshingDiscord(false);
    }
  };

  useEffect(() => {
    fetchDiscordServerStatus();
    const interval = setInterval(fetchDiscordServerStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const isCallActive = liveCall ? (liveCall.isActive !== false) : false;
  const rawUrl = (liveCall?.url || 'https://discord.gg/xXEEtTZzd').trim();
  const currentUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  const inviteUrl = discordStatus.instantInvite || 'https://discord.gg/xXEEtTZzd';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    onShowToast('📋 Link Copiado!', 'O link da chamada foi copiado para sua área de transferência.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    onShowToast('📋 Convite Discord Copiado!', `Link ${inviteUrl} copiado para a área de transferência.`);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleCopyChannelLink = (channelName: string, channelUrl: string) => {
    navigator.clipboard.writeText(channelUrl);
    onShowToast('📋 Link da Call Copiado!', `Link direto para "${channelName}" copiado.`);
  };

  // Total people in calls calculation (actual detection)
  const totalOccupants = discordStatus.voiceChannels.reduce((sum, ch) => sum + (ch.userCount || 0), 0);
  const occupiedChannelsCount = discordStatus.voiceChannels.filter((ch) => (ch.userCount || 0) > 0 || (ch.users && ch.users.length > 0)).length;

  // Filter and auto-sort channels (moving occupied channels to the top)
  const filteredChannels = discordStatus.voiceChannels
    .filter((ch) => {
      if (activeCategoryFilter === 'occupied_only') {
        return (ch.userCount || 0) > 0 || (ch.users && ch.users.length > 0);
      }
      const matchesCategory = activeCategoryFilter === 'all' || ch.category === activeCategoryFilter;
      const matchesSearch = !searchQuery || 
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (ch.topic && ch.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ch.category && ch.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      const aUsers = (a.userCount || 0) || (a.users ? a.users.length : 0);
      const bUsers = (b.userCount || 0) || (b.users ? b.users.length : 0);
      if (aUsers !== bUsers) {
        return bUsers - aUsers;
      }
      if (a.isActiveCall && !b.isActiveCall) return -1;
      if (!a.isActiveCall && b.isActiveCall) return 1;
      return 0;
    });

  const categories = [
    { id: 'all', label: 'Todas as Calls', count: discordStatus.voiceChannels.length },
    ...(occupiedChannelsCount > 0 ? [{ id: 'occupied_only', label: '🔥 Calls com Gente', count: occupiedChannelsCount }] : []),
    { id: '🔊 Salas de Prática', label: '🔊 Salas de Prática', count: discordStatus.voiceChannels.filter(c => c.category === '🔊 Salas de Prática').length },
    { id: '🎤 Call Aulas - Iniciante', label: '🎤 Iniciante', count: discordStatus.voiceChannels.filter(c => c.category === '🎤 Call Aulas - Iniciante').length },
    { id: '🎤 Call Aulas - Intermediário', label: '🎤 Intermediário', count: discordStatus.voiceChannels.filter(c => c.category === '🎤 Call Aulas - Intermediário').length },
    { id: '🎤 Call Aulas - Avançado', label: '🎤 Avançado', count: discordStatus.voiceChannels.filter(c => c.category === '🎤 Call Aulas - Avançado').length },
  ];

  /* -------------------------------------------------------------
     FEATURE 1: MODO DUELO 1V1 COM TIMER & METRÔNOMO DE 4 COMPASSOS
  ------------------------------------------------------------- */
  const [isBattleRunning, setIsBattleRunning] = useState(false);
  const [battleFormat, setBattleFormat] = useState<'4_bars' | '8_bars' | '2_bars'>('4_bars');
  const [currentMC, setCurrentMC] = useState<'MC 1 (Ataque)' | 'MC 2 (Resposta)'>('MC 1 (Ataque)');
  const [mc1Name, setMc1Name] = useState('Você / MC 1');
  const [mc2Name, setMc2Name] = useState('Adversário / Professor');
  const [currentBar, setCurrentBar] = useState(1); // 1..4 (or 1..8)
  const [currentBeatStep, setCurrentBeatStep] = useState(1); // 1..4
  const [currentRound, setCurrentRound] = useState(1);
  const [battleSoundEnabled, setBattleSoundEnabled] = useState(true);

  const maxBars = battleFormat === '8_bars' ? 8 : battleFormat === '2_bars' ? 2 : 4;
  const battleBpm = currentBeat?.bpm || 90;
  const beatIntervalMs = (60 / battleBpm) * 1000;

  useEffect(() => {
    let timer: any = null;
    if (isBattleRunning) {
      timer = setInterval(() => {
        setCurrentBeatStep(prevStep => {
          if (prevStep >= 4) {
            // New Bar
            setCurrentBar(prevBar => {
              if (prevBar >= maxBars) {
                // Switch MC Turn!
                playAlertChime('turn_switch');
                setCurrentMC(prevMC => {
                  const nextMC = prevMC === 'MC 1 (Ataque)' ? 'MC 2 (Resposta)' : 'MC 1 (Ataque)';
                  if (nextMC === 'MC 1 (Ataque)') {
                    setCurrentRound(r => r + 1);
                  }
                  return nextMC;
                });
                return 1;
              }
              return prevBar + 1;
            });
            return 1;
          }
          if (battleSoundEnabled) {
            playAlertChime('beat_tick');
          }
          return prevStep + 1;
        });
      }, beatIntervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isBattleRunning, beatIntervalMs, maxBars, battleSoundEnabled]);

  const handleStartBattle = () => {
    setIsBattleRunning(true);
    setCurrentBar(1);
    setCurrentBeatStep(1);
    playAlertChime('call_start');
    if (!isPlayingBeat) {
      onToggleBeat();
    }
  };

  const handlePauseBattle = () => {
    setIsBattleRunning(false);
  };

  const handleResetBattle = () => {
    setIsBattleRunning(false);
    setCurrentBar(1);
    setCurrentBeatStep(1);
    setCurrentMC('MC 1 (Ataque)');
    setCurrentRound(1);
  };

  const handleSwitchMCTurn = () => {
    playAlertChime('turn_switch');
    setCurrentBar(1);
    setCurrentBeatStep(1);
    setCurrentMC(prev => prev === 'MC 1 (Ataque)' ? 'MC 2 (Resposta)' : 'MC 1 (Ataque)');
  };

  /* -------------------------------------------------------------
     FEATURE 2: GERADOR DE PALAVRAS / TEMAS PARA FREESTYLE
  ------------------------------------------------------------- */
  const [wordCategory, setWordCategory] = useState<string>('all');
  const [currentWordItem, setCurrentWordItem] = useState<FreestyleWordItem>(FREESTYLE_WORDS[0]);
  const [wordHistory, setWordHistory] = useState<string[]>([FREESTYLE_WORDS[0].word]);
  const [autoRotateSeconds, setAutoRotateSeconds] = useState<number>(0); // 0 = off, 10, 15, 30

  const handleNextRandomWord = () => {
    const available = wordCategory === 'all' 
      ? FREESTYLE_WORDS 
      : FREESTYLE_WORDS.filter(w => w.category === wordCategory);
    const pool = available.length > 0 ? available : FREESTYLE_WORDS;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const selected = pool[randomIndex];
    setCurrentWordItem(selected);
    setWordHistory(prev => [selected.word, ...prev.slice(0, 4)]);
  };

  useEffect(() => {
    let rotateTimer: any = null;
    if (autoRotateSeconds > 0) {
      rotateTimer = setInterval(handleNextRandomWord, autoRotateSeconds * 1000);
    }
    return () => {
      if (rotateTimer) clearInterval(rotateTimer);
    };
  }, [autoRotateSeconds, wordCategory]);

  /* -------------------------------------------------------------
     FEATURE 3: CHECK-IN DE PRESENÇA NAS MENTORIAS & HISTÓRICO
  ------------------------------------------------------------- */
  const [checkins, setCheckins] = useState<MentorshipCheckin[]>(() => {
    try {
      const saved = localStorage.getItem('rimalab_mentorship_checkins');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const todayStr = new Date().toLocaleDateString('pt-BR');
  const hasCheckedInToday = checkins.some(c => c.date === todayStr);

  const handleCheckinMentorship = () => {
    if (hasCheckedInToday) {
      onShowToast('✅ Presença Já Confirmada', 'Você já registrou sua presença na aula de hoje!', 'info');
      return;
    }

    const now = new Date();
    const newCheckin: MentorshipCheckin = {
      id: `checkin_${Date.now()}`,
      date: todayStr,
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      channelName: liveCall?.title || 'Mentoria Geral Discord',
      host: liveCall?.hostName || 'Kowalski MC & Luquita MC',
      xpEarned: 150,
    };

    const updated = [newCheckin, ...checkins];
    setCheckins(updated);
    try {
      localStorage.setItem('rimalab_mentorship_checkins', JSON.stringify(updated));
    } catch {}

    if (onAddXP) {
      onAddXP(150, 'Presença VIP na Mentoria ao Vivo');
    } else {
      onShowToast('🎉 Presença Confirmada!', '+150 XP creditados e medalha de Aluno VIP registrada!', 'xp');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Header Banner with Sound Alert and Refresh Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isCallActive ? 'bg-red-400' : 'bg-emerald-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                isCallActive ? 'bg-red-500' : 'bg-emerald-500'
              }`} />
            </span>
            <span className={`text-xs font-black uppercase tracking-wider ${
              isCallActive ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {isCallActive ? '● Transmissão de Aula Ativa' : '● Servidor de Voz Online'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
            <span>Chamadas de Voz & Aulas ao Vivo</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
              Academia de Rimas
            </span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Entre nas salas de voz oficiais do servidor <strong>🎤 Academia de Rimas</strong> para praticar improviso no beat e participar de mentorias com os professores Kowalski MC & Luquita MC.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={toggleAudioAlerts}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
              audioAlertsEnabled
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Ativar/desativar alerta sonoro de novas calls"
          >
            {audioAlertsEnabled ? <Bell className="h-3.5 w-3.5 text-amber-400" /> : <BellOff className="h-3.5 w-3.5" />}
            <span>{audioAlertsEnabled ? 'Alertas Ativos' : 'Alertas Mudos'}</span>
          </button>

          <button
            onClick={fetchDiscordServerStatus}
            disabled={isRefreshingDiscord}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-xs font-bold text-neutral-200 transition-colors"
            title="Atualizar status e presença no Discord"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isRefreshingDiscord ? 'animate-spin' : ''}`} />
            <span>{isRefreshingDiscord ? 'Sincronizando...' : 'Atualizar Calls'}</span>
          </button>

          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-black shadow-lg shadow-[#5865F2]/25 transition-all hover:scale-105"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Entrar no Discord</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Official Discord Server Card */}
      <div className="rounded-3xl border border-indigo-500/50 bg-gradient-to-r from-indigo-950/70 via-neutral-950 to-neutral-950 p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5865F2]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-[#5865F2] px-3 py-1 text-[11px] font-black text-white shadow-md shadow-[#5865F2]/30">
                <Headphones className="h-3.5 w-3.5" />
                <span>SERVIDOR OFICIAL DISCORD</span>
              </span>
              <span className="rounded-full bg-neutral-900 border border-neutral-700 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                ID: 1522381290001928242
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Detector de Voz Ativo</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>{discordStatus.serverName || '🎤 Academia de Rimas'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Use o convite oficial abaixo para entrar no servidor, desbloquear os cargos de MC, acessar todas as <strong>20 salas de voz</strong> e trocar ideias no chat de texto.
            </p>

            {/* Invite URL Display & Copy */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-700 font-mono text-xs text-indigo-300">
                <span>🔗 Convite:</span>
                <span className="text-white font-bold">{inviteUrl}</span>
              </div>

              <button
                onClick={handleCopyInvite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-xs font-bold text-neutral-200 transition-colors"
              >
                {copiedInvite ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-neutral-400" />}
                <span>{copiedInvite ? 'Copiado!' : 'Copiar Convite'}</span>
              </button>
            </div>
          </div>

          {/* Direct CTA Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] text-white text-sm font-black shadow-xl shadow-[#5865F2]/30 transition-all hover:scale-105 active:scale-95"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Entrar no Servidor Oficial</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <a
              href="https://discord.com/channels/1522381290001928242"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold transition-colors"
            >
              <Headphones className="h-3.5 w-3.5 text-indigo-400" />
              <span>Abrir Navegador / App Discord</span>
            </a>
          </div>
        </div>
      </div>

      {/* NEW FEATURE 1 & 2: MODO DUELO 1V1 + GERADOR DE PALAVRAS INTERATIVO NA CALL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: 1v1 Battle Timer & 4-Bar Metronome (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-7 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 font-bold">
                <Swords className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>Modo Duelo 1v1 & Metrônomo 4 Compassos</span>
                </h3>
                <p className="text-xs text-neutral-400">Contador de métrica sincronizado para batalhas na call</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setBattleFormat('4_bars')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  battleFormat === '4_bars' ? 'bg-amber-500 text-neutral-950 font-black' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                }`}
              >
                4 Compassos
              </button>
              <button
                onClick={() => setBattleFormat('8_bars')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  battleFormat === '8_bars' ? 'bg-amber-500 text-neutral-950 font-black' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                }`}
              >
                8 Compassos
              </button>
              <button
                onClick={() => setBattleFormat('2_bars')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  battleFormat === '2_bars' ? 'bg-amber-500 text-neutral-950 font-black' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                }`}
              >
                Bate-e-Volta (2)
              </button>
            </div>
          </div>

          {/* Active MC Turn & Bar Visualizer */}
          <div className={`rounded-2xl border p-5 transition-all text-center space-y-4 ${
            currentMC === 'MC 1 (Ataque)'
              ? 'border-amber-500/60 bg-gradient-to-b from-amber-950/30 to-neutral-900/90 shadow-lg shadow-amber-950/20'
              : 'border-red-500/60 bg-gradient-to-b from-red-950/30 to-neutral-900/90 shadow-lg shadow-red-950/20'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-400 uppercase tracking-wider">
                Round {currentRound} • {battleBpm} BPM
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                currentMC === 'MC 1 (Ataque)' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'
              }`}>
                {currentMC}
              </span>
            </div>

            {/* Big Visual Pulse Bar */}
            <div className="py-2">
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center gap-3 font-display">
                <span>Compasso {currentBar}</span>
                <span className="text-neutral-500 text-2xl font-sans">/ {maxBars}</span>
              </div>
              <p className="text-xs font-semibold text-neutral-400 mt-1">
                {currentMC === 'MC 1 (Ataque)' ? `Vez de: ${mc1Name}` : `Vez de: ${mc2Name}`}
              </p>
            </div>

            {/* 4 Beat Pulse Spheres */}
            <div className="grid grid-cols-4 gap-2.5 max-w-sm mx-auto pt-1">
              {[1, 2, 3, 4].map((step) => {
                const isActiveStep = isBattleRunning && currentBeatStep === step;
                return (
                  <div
                    key={step}
                    className={`py-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isActiveStep
                        ? 'border-amber-400 bg-amber-500 text-neutral-950 font-black scale-110 shadow-lg shadow-amber-500/40'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 font-bold'
                    }`}
                  >
                    <span className="text-sm">{step}</span>
                    <span className="text-[9px] uppercase font-mono tracking-tighter">Tempo</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Battle Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {!isBattleRunning ? (
                <button
                  onClick={handleStartBattle}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Iniciar Duelo</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseBattle}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
                >
                  <Square className="h-4 w-4 fill-current" />
                  <span>Pausar</span>
                </button>
              )}

              <button
                onClick={handleSwitchMCTurn}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 transition-colors"
                title="Trocar a vez do MC imediatamente"
              >
                <SkipForward className="h-3.5 w-3.5 text-amber-400" />
                <span>Trocar MC</span>
              </button>

              <button
                onClick={handleResetBattle}
                className="p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Reiniciar contagem de rounds"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Quick Beat Trigger Button */}
            <button
              onClick={onToggleBeat}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isPlayingBeat
                  ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white'
              }`}
            >
              <Volume2 className="h-3.5 w-3.5 text-amber-400" />
              <span>{isPlayingBeat ? 'Pausar Beat' : 'Tocar Beat'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Random Freestyle Word & Rhyme Suggestions (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-7 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold">
                  <Lightbulb className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">Sorteador de Palavras ao Vivo</h3>
                  <p className="text-xs text-neutral-400">Temas e palavras surpresa para a call</p>
                </div>
              </div>

              <button
                onClick={handleNextRandomWord}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105"
              >
                <Shuffle className="h-3 w-3" />
                <span>Sortear</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'conceito', label: 'Conceitos' },
                { id: 'sangue', label: 'Sangue' },
                { id: 'rica', label: 'Rimas Ricas' },
                { id: 'objeto', label: 'Objetos' },
                { id: 'gastacao', label: 'Gastação' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setWordCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                    wordCategory === cat.id
                      ? 'bg-amber-500 text-neutral-950 font-black'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Word Display Box */}
            <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-neutral-900 to-neutral-900 p-5 text-center space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase">
                <span className="bg-neutral-800 px-2 py-0.5 rounded text-amber-400 font-bold">{currentWordItem.category}</span>
                <span className="bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">Dificuldade: {currentWordItem.difficulty}</span>
              </div>

              <div className="py-2">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-wide font-display">
                  "{currentWordItem.word}"
                </span>
                <p className="text-xs text-neutral-400 mt-1 italic">
                  {currentWordItem.tips}
                </p>
              </div>

              {/* Rhyme suggestions tags */}
              <div className="pt-2 border-t border-neutral-800 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1.5">
                  💡 Rimas prontas para usar no 4º compasso:
                </span>
                <div className="flex flex-wrap gap-1">
                  {currentWordItem.rhymeSuggestions.map((rhyme, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-800 text-neutral-200 border border-neutral-700"
                    >
                      {rhyme}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Auto rotate settings */}
          <div className="pt-2 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-800">
            <span>Troca automática de palavra:</span>
            <div className="flex items-center gap-1">
              {[0, 10, 15, 30].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setAutoRotateSeconds(sec)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    autoRotateSeconds === sec
                      ? 'bg-amber-500 text-neutral-950'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {sec === 0 ? 'Manual' : `${sec}s`}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* NEW FEATURE 3: CHECK-IN DE PRESENÇA NAS MENTORIAS & HISTÓRICO */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">Check-in de Presença nas Mentorias</h3>
              <p className="text-xs text-neutral-400">Garanta sua presença nas aulas com os professores e acumule XP VIP no ranking</p>
            </div>
          </div>

          <button
            onClick={handleCheckinMentorship}
            disabled={hasCheckedInToday}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${
              hasCheckedInToday
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 cursor-default'
                : 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-lg shadow-emerald-500/30 hover:scale-105'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{hasCheckedInToday ? '✓ Presença Registrada Hoje (+150 XP)' : 'Registrar Presença na Call (+150 XP)'}</span>
          </button>
        </div>

        {/* Checkin History Display */}
        {checkins.length > 0 && (
          <div className="pt-3 border-t border-neutral-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 block">
              Suas Presenças Recentes ({checkins.length}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {checkins.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">{item.channelName}</span>
                    <span className="text-[10px] text-neutral-400">{item.date} às {item.time}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    +{item.xpEarned} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Voice Channels Section Header & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Salas de Voz do Discord (20 Calls)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400">
              Detector em tempo real: chamadas com usuários conectados são <strong>destacadas e movidas automaticamente para o topo</strong>.
            </p>
          </div>

          {/* Real-time Occupants Live Detector Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-neutral-900 border border-neutral-800">
            <span className={`h-2.5 w-2.5 rounded-full ${totalOccupants > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-xs font-bold text-neutral-200">
              {totalOccupants > 0 
                ? `${totalOccupants} pessoa(s) rimando nas calls`
                : '0 pessoas nas calls no momento (Salas Livres)'
              }
            </span>
          </div>
        </div>

        {/* Occupied Calls Notification Banner (When users are detected) */}
        {occupiedChannelsCount > 0 && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-indigo-950/40 to-neutral-900 border border-emerald-500/40 text-emerald-300 text-xs shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-bold">
                🔥 <strong>{occupiedChannelsCount} chamada(s) com usuários ativos</strong> foram movidas para o topo da lista de opções!
              </span>
            </div>
            {activeCategoryFilter !== 'occupied_only' && (
              <button
                onClick={() => setActiveCategoryFilter('occupied_only')}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-bold border border-emerald-500/30 transition-colors whitespace-nowrap"
              >
                Ver Apenas Salas Ocupadas
              </button>
            )}
          </div>
        )}

        {/* Search & Category Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => {
              const isSelected = activeCategoryFilter === cat.id;
              const isOccupiedCategory = cat.id === 'occupied_only';
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? isOccupiedCategory 
                        ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/30 font-black'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black'
                      : isOccupiedCategory
                        ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 animate-pulse font-bold'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800 border border-neutral-800'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected 
                      ? isOccupiedCategory ? 'bg-black/20 text-neutral-950 font-black' : 'bg-white/20 text-white' 
                      : 'bg-neutral-800 text-neutral-500'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar canal de voz..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Voice Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChannels.map((channel) => {
          const userCount = (channel.userCount || 0) || (channel.users ? channel.users.length : 0);
          const hasUsers = userCount > 0;
          const channelUrl = channel.url || `https://discord.com/channels/1522381290001928242`;

          return (
            <div
              key={channel.id}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between gap-4 relative overflow-hidden ${
                hasUsers
                  ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 bg-gradient-to-b from-indigo-950/60 via-emerald-950/20 to-neutral-900 shadow-xl shadow-emerald-950/20'
                  : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
              }`}
            >
              {/* Highlight Tag when moved to the top due to active users */}
              {hasUsers && (
                <div className="absolute top-0 right-0">
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-bl-xl bg-emerald-500 text-neutral-950 text-[10px] font-black tracking-wide shadow-md">
                    <Flame className="h-3 w-3 fill-current" />
                    <span>EM DESTAQUE NO TOPO</span>
                  </span>
                </div>
              )}

              <div className="space-y-2.5">
                {/* Channel Category Tag & Live Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-md">
                    {channel.category}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                    hasUsers
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-black'
                      : 'bg-neutral-800/80 border-neutral-700 text-neutral-400'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${hasUsers ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
                    <span>{hasUsers ? `👥 ${userCount} na call` : '0 pessoas (Livre)'}</span>
                  </span>
                </div>

                {/* Channel Title & Topic */}
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <Headphones className={`h-4 w-4 shrink-0 ${hasUsers ? 'text-emerald-400 animate-bounce' : 'text-indigo-400'}`} />
                    <span>{channel.name}</span>
                  </h4>
                  {channel.topic && (
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {channel.topic}
                    </p>
                  )}
                </div>

                {/* Detected Live Occupants (shows actual users if any detected) */}
                {hasUsers && channel.users && channel.users.length > 0 && (
                  <div className="pt-2 border-t border-neutral-800">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center gap-1">
                      <Mic className="h-3 w-3 text-emerald-400 animate-pulse" />
                      <span>Falando na call agora:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {channel.users.map((uname, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1"
                        >
                          <span>🎤</span>
                          <span>{uname}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons for this specific voice channel */}
              <div className="pt-3 border-t border-neutral-800/80 flex items-center gap-2">
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition-all hover:scale-[1.02] active:scale-95 ${
                    hasUsers
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                      : 'bg-[#5865F2] hover:bg-[#4752c4] shadow-[#5865F2]/20'
                  }`}
                >
                  <Headphones className="h-3.5 w-3.5" />
                  <span>{hasUsers ? 'Entrar na Call ao Vivo' : 'Entrar na Call'}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyChannelLink(channel.name, channelUrl)}
                  className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition-colors"
                  title="Copiar link desta chamada"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Embedded Discord Widget Viewer Toggle */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-400" />
              <span>Widget Oficial do Discord (Servidor ID: 1522381290001928242)</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Visualização integrada fornecida diretamente pelo Discord.
            </p>
          </div>

          <button
            onClick={() => setShowDiscordWidgetEmbed(!showDiscordWidgetEmbed)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-bold text-indigo-300 hover:text-white transition-colors"
          >
            {showDiscordWidgetEmbed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span>{showDiscordWidgetEmbed ? 'Ocultar Widget' : 'Visualizar Widget'}</span>
          </button>
        </div>

        {showDiscordWidgetEmbed && (
          <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 p-2 animate-in fade-in">
            <iframe
              src={`https://discord.com/widget?id=1522381290001928242&theme=dark`}
              width="100%"
              height="380"
              frameBorder="0"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              title="Discord Server Widget"
              className="rounded-xl w-full"
            />
          </div>
        )}
      </div>

      {/* Interactive Beat Player & Guidelines Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Beat Player */}
        <div className="lg:col-span-2 rounded-3xl border border-neutral-800 bg-neutral-950 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Aquecimento: Beats para Rimar na Call</h3>
            </div>
            <button
              id="call-beat-toggle-btn"
              onClick={onToggleBeat}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                isPlayingBeat
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-emerald-500 text-neutral-950 shadow-lg shadow-emerald-500/30'
              }`}
            >
              {isPlayingBeat ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              <span>{isPlayingBeat ? 'Pausar Beat' : 'Tocar Beat de Treino'}</span>
            </button>
          </div>

          <p className="text-xs text-neutral-400">
            Selecione o instrumental abaixo para aquecer antes de entrar na call ou tocar durante o seu round com os professores:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESET_BEATS.slice(0, 4).map((beat) => {
              const isSelected = beat.id === selectedBeatId;
              return (
                <div
                  key={beat.id}
                  onClick={() => {
                    setSelectedBeatId(beat.id);
                    onSelectBeat(beat);
                    globalBeatEngine.setBeat(beat);
                    if (!isPlayingBeat) {
                      globalBeatEngine.start();
                      onToggleBeat();
                    }
                  }}
                  className={`cursor-pointer rounded-2xl border p-3.5 transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 shadow-md'
                      : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{beat.title}</span>
                      <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-400">
                        {beat.bpm} BPM
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400 capitalize">{beat.style}</span>
                  </div>

                  <span className={`text-xs font-black ${isSelected ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {isSelected && isPlayingBeat ? '▶ Tocando' : 'Escolher'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Guidelines for Live Calls */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Regras da Call com os MCs</h3>
          </div>

          <ul className="space-y-2.5 text-xs text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">1.</span>
              <span><strong>Mantenha o microfone mutado</strong> até os professores chamarem o seu nome para a rodada.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">2.</span>
              <span><strong>Ajuste o volume do fone de ouvido</strong> para não dar eco nem microfonia no beat.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">3.</span>
              <span><strong>Foco na métrica e ideia</strong>: Rime 4 a 8 compassos seguindo o compasso 4/4 do BPM.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">4.</span>
              <span><strong>Feedback imediato</strong>: Ouça a correção dos professores sobre respiração e punchline.</span>
            </li>
          </ul>

          <div className="pt-2 border-t border-neutral-800/80">
            <button
              onClick={onOpenStudio}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 py-2.5 text-xs font-bold text-amber-400 hover:border-amber-500/50 hover:bg-neutral-850 transition-colors"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Abrir Studio com Jurado IA</span>
            </button>
          </div>
        </div>

      </div>

      {/* Live Mentorship Schedule */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Cronograma Oficial de Mentorias Semanais</h3>
          </div>
          <span className="text-xs text-neutral-400 font-medium">Horário de Brasília (BRT)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase">Terça-feira</span>
              <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                <Clock className="h-3 w-3" /> 20:00
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">Fundamentos de Métrica & Flow</h4>
            <p className="text-xs text-neutral-400">Contagem de tempos, pausas e respiração no Boom Bap com Kowalski MC.</p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase">Quinta-feira</span>
              <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                <Clock className="h-3 w-3" /> 20:00
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">Construção de Punchlines & Resposta</h4>
            <p className="text-xs text-neutral-400">Como armar rimas de ataque e técnicas de improviso com Luquita MC.</p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-red-400 uppercase">Sábado</span>
              <span className="flex items-center gap-1 text-[11px] text-neutral-400">
                <Clock className="h-3 w-3" /> 16:00
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">Arena de Batalhas 1v1 & Roda de Rima</h4>
            <p className="text-xs text-neutral-400">Simulação de duelo real entre alunos com jurados e feedback ao vivo.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
