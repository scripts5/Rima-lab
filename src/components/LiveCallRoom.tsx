import React, { useState } from 'react';
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
  Award
} from 'lucide-react';
import { LiveCallSession, UserProfile, Subscription, Beat } from '../types';
import { PRESET_BEATS, globalBeatEngine } from '../lib/audio/beatEngine';

interface LiveCallRoomProps {
  liveCall: LiveCallSession | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  onOpenAdmin: () => void;
  onOpenSubscription: () => void;
  onOpenStudio: () => void;
  isPlayingBeat: boolean;
  onToggleBeat: () => void;
  currentBeat: Beat;
  onSelectBeat: (beat: Beat) => void;
  onShowToast: (title: string, desc: string, type?: 'xp' | 'ach' | 'info') => void;
}

export const LiveCallRoom: React.FC<LiveCallRoomProps> = ({
  liveCall,
  profile,
  subscription,
  onOpenAdmin,
  onOpenSubscription,
  onOpenStudio,
  isPlayingBeat,
  onToggleBeat,
  currentBeat,
  onSelectBeat,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedBeatId, setSelectedBeatId] = useState(currentBeat.id);

  const isCallActive = liveCall?.isActive && !!liveCall?.url;
  const currentUrl = liveCall?.url || 'https://discord.gg/rimalab';
  const platform = liveCall?.platform || 'discord';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    onShowToast('📋 Link Copiado!', 'O link da chamada foi copiado para sua área de transferência.');
    setTimeout(() => setCopied(false), 2500);
  };

  const getPlatformDetails = () => {
    switch (platform) {
      case 'whatsapp':
        return {
          name: 'WhatsApp Chamada / Grupo',
          color: 'from-emerald-600 to-green-700',
          borderColor: 'border-emerald-500/40',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: '💬',
          actionText: 'Abrir no WhatsApp Web / App',
        };
      case 'discord':
        return {
          name: 'Discord Sala de Voz / Palco',
          color: 'from-[#5865F2] to-indigo-800',
          borderColor: 'border-indigo-500/40',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          icon: '🎧',
          actionText: 'Entrar no Servidor do Discord',
        };
      case 'meet':
        return {
          name: 'Google Meet',
          color: 'from-blue-600 to-cyan-700',
          borderColor: 'border-blue-500/40',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: '📹',
          actionText: 'Entrar na Reunião Google Meet',
        };
      case 'zoom':
        return {
          name: 'Zoom Video',
          color: 'from-sky-600 to-blue-800',
          borderColor: 'border-sky-500/40',
          badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          icon: '🎥',
          actionText: 'Abrir Reunião no Zoom',
        };
      default:
        return {
          name: 'Sala de Vídeo',
          color: 'from-amber-600 to-orange-700',
          borderColor: 'border-amber-500/40',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: '🎙️',
          actionText: 'Entrar na Chamada',
        };
    }
  };

  const platformInfo = getPlatformDetails();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black tracking-widest uppercase text-red-400">
              AULAS & MENTORIA AO VIVO
            </span>
            <span className="rounded-full bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
              Kowalski MC & Luquita MC
            </span>
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Sala de <span className="text-amber-400">Calls & Treino</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Conecte-se em tempo real com os professores para treinar métrica, flow e receber correções no beat.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="call-room-admin-btn"
            onClick={onOpenAdmin}
            className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-bold text-neutral-300 hover:border-amber-500/50 hover:text-amber-300 transition-colors"
          >
            <span>👑</span>
            <span>Painel do Professor</span>
          </button>
          
          <button
            id="call-room-studio-btn"
            onClick={onOpenStudio}
            className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-neutral-950 transition-all"
          >
            <Mic className="h-4 w-4" />
            <span>Abrir Studio</span>
          </button>
        </div>
      </div>

      {/* Main Broadcast Stage */}
      {isCallActive ? (
        <div className="relative overflow-hidden rounded-3xl border border-red-500/40 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 p-6 sm:p-10 shadow-2xl shadow-red-950/20">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            
            {/* Left: Status & Details */}
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-lg shadow-red-600/40 animate-pulse">
                  <Radio className="h-3.5 w-3.5" />
                  <span>TRANSMISSÃO AO VIVO ATIVA</span>
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold ${platformInfo.badgeBg}`}>
                  {platformInfo.icon} {platformInfo.name}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {liveCall.title || 'Mentoria Prática de Freestyle'}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-neutral-300 leading-relaxed">
                  {liveCall.description || 'Entre para rimar ao vivo no beat e receber feedback detalhado com os MCs professores.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-2 border-t border-neutral-800">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-amber-400" />
                  <span>Host: <strong className="text-white">{liveCall.hostName || 'Kowalski MC & Luquita MC'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Acesso: <strong className="text-emerald-300">Liberado para Alunos</strong></span>
                </div>
              </div>
            </div>

            {/* Right: Big Interactive Join Actions */}
            <div className="w-full lg:w-auto flex flex-col gap-3 shrink-0 bg-neutral-900/80 p-5 rounded-2xl border border-neutral-800/80 shadow-xl">
              <span className="text-[11px] font-bold text-neutral-400 text-center uppercase tracking-wider">
                Clique para se conectar agora
              </span>

              <a
                id="main-enter-call-btn"
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 px-8 py-4 text-base font-black text-white hover:from-red-500 hover:to-amber-500 shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95 text-center"
              >
                <Video className="h-6 w-6" />
                <span>Entrar na Chamada de Vídeo 🚀</span>
                <ExternalLink className="h-4 w-4" />
              </a>

              <div className="flex items-center gap-2">
                <div className="flex-1 truncate rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-neutral-400 font-mono">
                  {currentUrl}
                </div>
                <button
                  id="copy-call-url-btn"
                  onClick={handleCopyLink}
                  title="Copiar Link da Chamada"
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-bold text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <p className="text-[10px] text-neutral-500 text-center">
                Você será redirecionado para a sala de vídeo/voz oficial.
              </p>
            </div>

          </div>
        </div>
      ) : (
        /* Offline State / Standby Schedule */
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 sm:p-10 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Radio className="h-8 w-8 text-amber-500" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-white">Nenhuma chamada ao vivo no momento</h2>
            <p className="text-sm text-neutral-400">
              Os professores Luquita MC & Kowalski MC iniciam as mentorias de métrica e treino em horários programados. Fique atento às notificações!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors"
            >
              <span>👑 É um Professor? Iniciar Chamada Agora</span>
            </button>
            <a
              href="https://discord.gg/rimalab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-[#5865F2]/40 bg-[#5865F2]/20 px-5 py-3 text-xs font-bold text-indigo-300 hover:bg-[#5865F2]/30 transition-colors"
            >
              <span>🎧 Sala de Espera no Discord</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Interactive Beat Player & Training Sandbox */}
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
            Selecione o beat abaixo para aquecer antes de entrar na call ou tocar durante o seu round com os professores:
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
            <h4 className="text-sm font-bold text-white">Roda de Batalha & Duelo de Alunos</h4>
            <p className="text-xs text-neutral-400">Duelos 1-a-1 avaliados ao vivo pelos professores com ranking de XP.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
