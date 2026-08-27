import React, { useState } from 'react';
import { 
  Mic, 
  BookOpen, 
  Flame, 
  Award, 
  BarChart2, 
  Crown, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Zap, 
  Play, 
  Square, 
  Trophy, 
  Sliders,
  Headphones,
  Terminal,
  ShieldCheck,
  Radio,
  Mail,
  Video,
  Layers,
  Filter,
  ChevronDown,
  ChevronRight,
  Hash,
  Volume2 as VoiceIcon,
  MessageSquare,
  Compass,
  FolderOpen,
  Home,
  Target,
  GraduationCap,
  Swords,
  Medal,
  Lightbulb,
  User,
  X
} from 'lucide-react';
import { UserProfile, Subscription, LiveCallSession } from '../types';
import { useNavigation, NavTabId, DiscordCategory, DiscordChannel } from '../context/NavigationContext';

interface HeaderProps {
  activeTab: 'studio' | 'lessons' | 'challenges' | 'achievements' | 'profile' | 'leaderboard' | 'bot' | 'onboarding' | 'calls' | 'suggestions' | 'tracks';
  setActiveTab: (tab: 'studio' | 'lessons' | 'challenges' | 'achievements' | 'profile' | 'leaderboard' | 'bot' | 'onboarding' | 'calls' | 'suggestions' | 'tracks') => void;
  profile: UserProfile | null;
  subscription: Subscription | null;
  liveCall: LiveCallSession | null;
  onOpenSubscription: () => void;
  onOpenPromptGen: () => void;
  onOpenAdmin: () => void;
  onOpenGmailAuth: () => void;
  onOpenVoiceCoach?: () => void;
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string;
  isPlayingBeat: boolean;
  onToggleBeat: () => void;
  currentBeatTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  profile,
  subscription,
  liveCall,
  onOpenSubscription,
  onOpenPromptGen,
  onOpenAdmin,
  onOpenGmailAuth,
  onOpenVoiceCoach,
  onSelectCategory,
  selectedCategory: propsSelectedCategory,
  isPlayingBeat,
  onToggleBeat,
  currentBeatTitle,
}) => {
  const { 
    selectedCategories, 
    activeRoles,
    discordCategories,
    activeDiscordCategory,
    setActiveDiscordCategoryId,
    openChannel,
    activeChannelId,
    collapsedCategories,
    toggleCategoryCollapse,
    filterStats,
  } = useNavigation();

  const [isServerBrowserOpen, setIsServerBrowserOpen] = useState<boolean>(false);

  const level = profile?.level || 1;
  const totalXP = profile?.totalXP || 0;
  const currentLevelXP = totalXP % 1000;
  const progressPercent = Math.min(100, Math.round((currentLevelXP / 1000) * 100));
  const streak = profile?.streakDays || 1;

  const getChannelIcon = (type: string, isLive?: boolean) => {
    if (isLive) return <Video className="h-3.5 w-3.5 text-red-400 animate-pulse" />;
    if (type === 'voice') return <VoiceIcon className="h-3.5 w-3.5 text-emerald-400" />;
    if (type === 'forum') return <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />;
    return <Hash className="h-3.5 w-3.5 text-neutral-400" />;
  };

  interface MainNavTabItem {
    id: 'studio' | 'lessons' | 'challenges' | 'achievements' | 'profile' | 'leaderboard' | 'bot' | 'onboarding' | 'calls' | 'suggestions' | 'tracks';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    isLive?: boolean;
  }

  // Main classic navigation tabs
  const mainNavTabs: MainNavTabItem[] = [
    { id: 'onboarding', label: 'Início', icon: Home },
    { id: 'tracks', label: 'Minhas Trilhas', icon: Target, badge: 'Cargos' },
    { id: 'studio', label: 'Studio', icon: Mic },
    { id: 'bot', label: 'Bot Beats', icon: Headphones },
    { id: 'calls', label: 'Calls Ao Vivo', icon: Video, badge: liveCall?.isActive ? 'AO VIVO' : undefined, isLive: !!liveCall?.isActive },
    { id: 'lessons', label: 'Academia', icon: BookOpen },
    { id: 'challenges', label: 'Desafios', icon: Zap },
    { id: 'achievements', label: 'Conquistas', icon: Award },
    { id: 'leaderboard', label: 'Ranking', icon: Trophy },
    { id: 'suggestions', label: 'Sugestões', icon: Lightbulb },
    { id: 'profile', label: 'Meu Perfil', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/95 backdrop-blur-md">
      
      {/* Active Teacher Live Call Global Top Banner */}
      {liveCall?.isActive && (
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 px-4 py-1.5 text-xs font-bold text-white shadow-inner flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-2xl truncate">
            <span className="flex h-2 w-2 rounded-full bg-white animate-ping shrink-0" />
            <span className="uppercase font-black text-[10px] tracking-wider bg-black/30 px-2 py-0.5 rounded">
              🔴 AO VIVO COM OS PROFESSORES
            </span>
            <span className="truncate">{liveCall.title} ({liveCall.hostName})</span>
          </div>
          <a
            id="join-live-banner-btn"
            href={liveCall.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-black hover:bg-neutral-900 text-amber-400 text-[11px] font-black px-3 py-1 rounded-full shadow transition-transform hover:scale-105 shrink-0"
          >
            <Video className="h-3.5 w-3.5 text-amber-400" />
            <span>Entrar na Chamada de Vídeo</span>
          </a>
        </div>
      )}

      {/* Main Top Header Bar with Brand, Primary Tabs, and Action Controls */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5 gap-2">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            id="brand-logo-btn"
            onClick={() => setActiveTab('onboarding')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
            title="Ir para o Dashboard de Apresentação & Início"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 shadow-lg shadow-amber-500/20 text-neutral-950 font-black text-xl tracking-tighter transition-transform group-hover:scale-105">
              <Mic className="h-5 w-5 text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg font-extrabold tracking-tight text-white">
                  Academia de <span className="text-amber-500">Rimas</span>
                </span>
                <span className="rounded bg-[#5865F2]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#8ea1e1] border border-[#5865F2]/40">
                  Discord Server
                </span>
              </div>
              <p className="hidden text-[10px] text-amber-400/90 font-medium sm:block">
                Por Kowalski MC & Luquita MC
              </p>
            </div>
          </button>
        </div>

        {/* PRIMARY NAVIGATION TABS (All original tabs fully accessible) */}
        <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1 px-1 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
          {mainNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/70'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-neutral-950' : 'text-neutral-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                    tab.isLive 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : isActive 
                        ? 'bg-black/30 text-neutral-950' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Admin Tab in Main Nav */}
          <button
            id="nav-tab-admin"
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-400 bg-amber-950/30 border border-amber-500/30 hover:bg-amber-500/20 transition-all whitespace-nowrap"
            title="Painel de Controle dos Professores & Gestão de Aulas"
          >
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            <span>Admin</span>
            <span className="text-[9px] px-1 py-0.2 rounded font-black bg-amber-500/30 text-amber-300">
              Professores
            </span>
          </button>
        </nav>

        {/* Right Actions & Status Stats */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Professor IA Live Voice Button */}
          {onOpenVoiceCoach && (
            <button
              id="header-voice-coach-btn"
              onClick={onOpenVoiceCoach}
              title="Falar em tempo real com o Professor Rima IA (Gemini Live)"
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1.5 text-xs font-black text-neutral-950 hover:from-amber-400 hover:to-orange-400 transition-all shadow-md shadow-amber-500/20 hover:scale-105"
            >
              <Mic className="h-3.5 w-3.5 text-neutral-950 animate-pulse" />
              <span className="hidden sm:inline">Professor IA</span>
              <span className="rounded bg-black/30 px-1 py-0.2 text-[9px] font-black text-amber-300">
                Live
              </span>
            </button>
          )}

          {/* Gmail Login Button */}
          <button
            id="header-gmail-btn"
            onClick={onOpenGmailAuth}
            title="Entrar com seu Gmail para salvar seu progresso e XP (100% Gratuito)"
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 to-amber-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition-all shadow-sm"
          >
            <Mail className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {subscription?.gmail ? subscription.gmail.split('@')[0] : 'Entrar (Gmail)'}
            </span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-black text-emerald-400 border border-emerald-500/30">
              100% Grátis
            </span>
          </button>

          {/* Quick AI Topic Generator button */}
          <button
            id="header-prompt-gen-btn"
            onClick={onOpenPromptGen}
            title="Gerar temas e palavras-chave para treino com IA"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-950/40 px-2.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/50 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            <span className="hidden md:inline">Tema IA</span>
          </button>

          {/* Streak Counter */}
          <div 
            title={`Sequência de treino: ${streak} dias seguidos`}
            className="hidden sm:flex items-center gap-1 rounded-lg bg-orange-950/40 border border-orange-500/30 px-2 py-1 text-xs font-bold text-orange-400"
          >
            <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500 animate-bounce" />
            <span>{streak}d</span>
          </div>

          {/* XP & Level Pill */}
          <div 
            onClick={() => setActiveTab('profile')}
            className="cursor-pointer flex items-center gap-1.5 sm:gap-2 rounded-lg bg-neutral-900 border border-neutral-800 px-2 sm:px-2.5 py-1 hover:border-amber-500/50 transition-colors"
            title={`Nível ${level} • ${totalXP} XP acumulados (${progressPercent}% para o próximo)`}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-black text-amber-400">
              {level}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[10px] font-semibold text-neutral-400 leading-none">
                Nv. {level}
              </span>
              <div className="mt-0.5 h-1.5 w-12 rounded-full bg-neutral-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Global Beat Player Pill */}
          <div className="flex items-center gap-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 px-2 py-1">
            <button
              id="header-toggle-beat-btn"
              onClick={onToggleBeat}
              className={`flex h-6 w-6 items-center justify-center rounded-md transition-all ${
                isPlayingBeat
                  ? 'bg-amber-500 text-neutral-950 font-black scale-105 animate-pulse'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
              }`}
              title={isPlayingBeat ? 'Pausar Beat Atual' : 'Tocar Beat Selecionado'}
            >
              {isPlayingBeat ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current ml-0.5" />}
            </button>
            <button
              id="header-current-beat-btn"
              onClick={() => setActiveTab('bot')}
              className="text-left group focus:outline-none"
              title="Abrir o Bot de Beats no Discord"
            >
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-neutral-400">Beat:</span>
                <span className="max-w-[70px] sm:max-w-[90px] truncate text-[11px] font-bold text-amber-400 group-hover:underline">
                  {currentBeatTitle || 'Boom Bap 90s'}
                </span>
              </div>
            </button>
          </div>

          {/* Admin Control Link Button */}
          <button
            id="header-admin-btn"
            onClick={onOpenAdmin}
            title="Painel de Controle dos Professores (Admin)"
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-amber-500/40 bg-neutral-900 text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            <Sliders className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden lg:inline text-xs font-bold">Admin</span>
          </button>
        </div>
      </div>

      {/* SECONDARY HEADER: Medium Screen Primary Tabs (visible when screen < xl) */}
      <div className="xl:hidden border-t border-neutral-800/80 bg-neutral-900/70 px-3 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {mainNavTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-neutral-950 font-black shadow'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Icon className={`h-3 w-3 ${isActive ? 'text-neutral-950' : 'text-neutral-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[8px] px-1 py-0.2 rounded font-black ${
                  tab.isLive ? 'bg-red-500 text-white' : 'bg-black/30 text-neutral-900'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={onOpenAdmin}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 whitespace-nowrap"
        >
          <Sliders className="h-3 w-3" />
          <span>Admin</span>
        </button>
      </div>

      {/* DISCORD SERVER CATEGORIES & SUB-CHANNELS BAR */}
      <div className="border-t border-neutral-800/80 bg-[#0e0e12]/95 px-3 sm:px-6 py-2 flex flex-col gap-2 shadow-inner">
        
        {/* Categories Selector Row */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-0.5">
          
          <div className="flex items-center gap-1 shrink-0">
            <button
              id="open-discord-browser-btn"
              onClick={() => setIsServerBrowserOpen(!isServerBrowserOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                isServerBrowserOpen 
                  ? 'bg-[#5865F2] text-white shadow-md' 
                  : 'text-[#8ea1e1] bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30'
              }`}
              title="Abrir Navegador Completo de Canais do Servidor"
            >
              <Compass className="h-3.5 w-3.5 text-indigo-300" />
              <span>Canais ({filterStats.unlockedChannelsCount})</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${isServerBrowserOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className="h-4 w-px bg-neutral-800 mx-1" />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
            {discordCategories.map((cat) => {
              const isCategoryActive = activeDiscordCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`cat-nav-${cat.id}`}
                  onClick={() => {
                    setActiveDiscordCategoryId(cat.id);
                    if (cat.channels.length > 0) {
                      openChannel(cat.channels[0]);
                    }
                  }}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    isCategoryActive
                      ? 'bg-amber-500 text-neutral-950 shadow-md font-black scale-105'
                      : 'text-neutral-300 bg-neutral-900/80 border border-neutral-800/80 hover:text-white hover:bg-neutral-800'
                  }`}
                  title={cat.description}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.shortName}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                    isCategoryActive ? 'bg-black/30 text-neutral-950 font-black' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {cat.channels.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* User Role Tag & Role Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden lg:flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-lg text-[10px]">
              <span className="text-neutral-400">Cargo:</span>
              <span className="font-bold text-amber-300">{activeRoles[0] || 'MC Rimador'}</span>
            </div>
            
            <button
              onClick={() => setActiveTab('onboarding')}
              className="text-[11px] text-neutral-400 hover:text-amber-300 font-semibold px-2 py-1 rounded hover:bg-neutral-900 transition-colors whitespace-nowrap"
              title="Trocar cargos e liberar outras categorias no Onboarding"
            >
              ⚙️ Trocar Cargo
            </button>
          </div>
        </div>

        {/* Active Category Sub-Channels Strip */}
        {activeDiscordCategory && activeDiscordCategory.channels.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none border-t border-neutral-800/60 pt-1.5">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <span>{activeDiscordCategory.emoji}</span>
              <span className="hidden sm:inline font-mono">{activeDiscordCategory.name}:</span>
            </span>

            {activeDiscordCategory.channels.map((channel) => {
              const isChannelActive = activeTab === channel.tabId;
              return (
                <button
                  key={channel.id}
                  id={`ch-btn-${channel.id}`}
                  onClick={() => openChannel(channel)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    isChannelActive
                      ? 'bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/25 font-black scale-105'
                      : 'bg-neutral-900/90 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white hover:bg-neutral-800'
                  }`}
                  title={channel.description}
                >
                  {getChannelIcon(channel.type, channel.isLive)}
                  <span className="font-mono">{channel.name}</span>
                  {channel.badge && (
                    <span className="rounded bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[9px] font-black border border-amber-500/30">
                      {channel.badge}
                    </span>
                  )}
                  {channel.isLive && (
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* DISCORD SERVER BROWSER MODAL / DRAWER (Full channel tree view) */}
      {isServerBrowserOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-16 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            
            {/* Drawer Header */}
            <div className="bg-[#5865F2] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Compass className="h-6 w-6 text-white" />
                <div>
                  <h3 className="font-black text-base">Navegador do Servidor RimaLab (Discord)</h3>
                  <p className="text-xs text-indigo-100">
                    Canais desbloqueados com base no seu cargo: <strong className="text-white">{activeRoles.join(' • ')}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsServerBrowserOpen(false)}
                className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Categories & Channels Accordion */}
            <div className="p-4 overflow-y-auto space-y-4 divide-y divide-neutral-800/60">
              {discordCategories.map((category) => {
                const isCollapsed = collapsedCategories[category.id];
                const isCatActive = activeDiscordCategory?.id === category.id;

                return (
                  <div key={category.id} className="pt-3 first:pt-0">
                    {/* Category Title bar with Collapse Toggle */}
                    <button
                      onClick={() => toggleCategoryCollapse(category.id)}
                      className="w-full flex items-center justify-between text-left py-1 px-2 rounded-lg hover:bg-neutral-800/60 transition-colors group"
                    >
                      <div className="flex items-center gap-2 font-mono text-xs font-black tracking-wider text-neutral-300 group-hover:text-white">
                        {isCollapsed ? (
                          <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
                        )}
                        <span>{category.emoji}</span>
                        <span>{category.name}</span>
                        {isCatActive && (
                          <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.2 rounded border border-amber-500/30">
                            Ativa
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {category.channels.length} canais
                      </span>
                    </button>

                    {/* Channels inside this category */}
                    {!isCollapsed && (
                      <div className="mt-1 ml-4 pl-2 border-l border-neutral-800 space-y-1">
                        {category.channels.map((channel) => {
                          const isChActive = activeTab === channel.tabId;
                          return (
                            <button
                              key={channel.id}
                              onClick={() => {
                                openChannel(channel);
                                setIsServerBrowserOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                                isChActive
                                  ? 'bg-[#5865F2] text-white font-bold shadow'
                                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {getChannelIcon(channel.type, channel.isLive)}
                                <span className="font-mono">{channel.name}</span>
                                <span className="text-[11px] text-neutral-400 truncate max-w-xs hidden sm:inline">
                                  - {channel.description}
                                </span>
                              </div>
                              {channel.badge && (
                                <span className="shrink-0 text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  {channel.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
              <span>💡 Quer liberar outros canais? Altere suas preferências no Onboarding.</span>
              <button
                onClick={() => {
                  setActiveTab('onboarding');
                  setIsServerBrowserOpen(false);
                }}
                className="text-amber-400 hover:underline font-bold"
              >
                Ir para Onboarding &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
