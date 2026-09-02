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
  Settings,
  X
} from 'lucide-react';
import { UserProfile, Subscription, LiveCallSession } from '../types';
import { useNavigation, NavTabId, DiscordCategory, DiscordChannel } from '../context/NavigationContext';
import { useSiteCustomization } from '../context/SiteCustomizationContext';
import { DuolingoNotificationCenter } from './DuolingoNotificationCenter';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface HeaderProps {
  activeTab: 'studio' | 'lessons' | 'challenges' | 'achievements' | 'profile' | 'leaderboard' | 'bot' | 'onboarding' | 'calls' | 'suggestions' | 'tracks';
  setActiveTab: (tab: 'studio' | 'lessons' | 'challenges' | 'achievements' | 'profile' | 'leaderboard' | 'bot' | 'onboarding' | 'calls' | 'suggestions' | 'tracks') => void;
  profile: UserProfile | null;
  subscription: Subscription | null;
  liveCall: LiveCallSession | null;
  onOpenSubscription: () => void;
  onOpenPromptGen: () => void;
  onOpenAdmin: () => void;
  onOpenStudioConfig?: () => void;
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
  onOpenStudioConfig,
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

  const { customization } = useSiteCustomization();
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
                  {customization.brandName || 'Academia de Rimas'}
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

        {/* Center Desktop Primary Navigation Tabs */}
        <nav className="hidden xl:flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
          {mainNavTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`main-nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-neutral-950 shadow-md font-black'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-neutral-950' : 'text-neutral-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                    tab.isLive 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : isActive 
                      ? 'bg-black/30 text-neutral-950' 
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Side Controls (PWA Install, Duolingo Notifications, Streak, Level, Beat Player, Prof & Admin Buttons) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Duolingo Notification Center Bell */}
          <DuolingoNotificationCenter
            currentStreak={streak}
            onNavigateToTab={(tabId) => setActiveTab(tabId as any)}
          />

          {/* PWA Install Button in Header */}
          <PWAInstallPrompt variant="navbar" />

          {/* Streak Badge */}
          <div 
            className="flex items-center gap-1 rounded-lg bg-orange-500/10 border border-orange-500/30 px-2 py-1 text-xs font-bold text-orange-400"
            title="Sequência de dias praticando rima"
          >
            <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
            <span>{streak}d</span>
          </div>

          {/* Level Progress */}
          <div 
            onClick={() => setActiveTab('profile')}
            className="hidden sm:flex items-center gap-2 rounded-lg bg-neutral-900 border border-neutral-800 px-2.5 py-1 text-xs cursor-pointer hover:border-amber-500/50 transition-colors"
            title={`Nível ${level} (${totalXP} XP Total) - Clique para ver Perfil`}
          >
            <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <div className="text-left">
              <span className="font-bold text-white block text-[11px] leading-tight">
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

          {/* PROF BUTTON (Renamed from Admin, for professors Luquita & Kowalski) */}
          <button
            id="header-prof-btn"
            onClick={onOpenAdmin}
            title="Painel dos Professores (Kowalski MC & Luquita MC)"
            className="flex items-center gap-1 h-8 px-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors font-bold text-xs"
          >
            <GraduationCap className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Prof</span>
          </button>

          {/* ADMIN BUTTON (Kowalski Studio - Site Customization & Chat AI) */}
          {onOpenStudioConfig && (
            <button
              id="header-admin-studio-btn"
              onClick={onOpenStudioConfig}
              title="Kowalski Studio - Chat IA & Modificação Visual do Site"
              className="flex items-center gap-1 h-8 px-2.5 rounded-lg border border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-amber-500/50 hover:text-amber-300 transition-colors font-bold text-xs"
            >
              <Settings className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden md:inline">Admin</span>
            </button>
          )}
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
        
        {/* Mobile Prof & Admin Buttons */}
        <button
          onClick={onOpenAdmin}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 whitespace-nowrap"
        >
          <GraduationCap className="h-3 w-3" />
          <span>Prof</span>
        </button>

        {onOpenStudioConfig && (
          <button
            onClick={onOpenStudioConfig}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-neutral-200 bg-neutral-900 border border-neutral-700 whitespace-nowrap"
          >
            <Settings className="h-3 w-3 text-amber-400" />
            <span>Admin</span>
          </button>
        )}
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
              onClick={() => setActiveTab('tracks')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors shrink-0"
              title="Personalizar Cargos e Trilha de Estudos"
            >
              <Target className="h-3 w-3 text-amber-400" />
              <span className="hidden sm:inline">Trilhas</span>
            </button>
          </div>
        </div>

        {/* Sub-Channels list for the currently selected Discord category */}
        {activeDiscordCategory && activeDiscordCategory.channels.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <span>{activeDiscordCategory.emoji}</span>
              <span className="hidden sm:inline">Salas:</span>
            </span>

            {activeDiscordCategory.channels.map((channel) => {
              const isChannelSelected = activeChannelId === channel.id;
              const hasBadge = channel.isLive || channel.isCallActive;
              return (
                <button
                  key={channel.id}
                  id={`channel-pill-${channel.id.replace(/[^a-zA-Z0-9]/g, '-')}`}
                  onClick={() => openChannel(channel)}
                  className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    isChannelSelected
                      ? 'bg-[#5865F2] text-white shadow-md font-bold'
                      : 'bg-neutral-950/70 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800/80'
                  }`}
                  title={`${channel.name} — ${channel.description}`}
                >
                  {getChannelIcon(channel.type, channel.isLive || channel.isCallActive)}
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{channel.name}</span>
                  
                  {hasBadge && (
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping shrink-0" />
                  )}
                  {channel.userCount && channel.userCount > 0 ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-mono">
                      {channel.userCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

      </div>

      {/* FULL DISCORD SERVER BROWSER MODAL / DRAWER */}
      {isServerBrowserOpen && (
        <div className="border-t border-neutral-800 bg-neutral-950/98 p-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="mx-auto max-w-7xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-[#5865F2]" />
                <h4 className="font-bold text-sm text-white">
                  Estrutura Completa de Canais do Servidor Discord
                </h4>
                <span className="rounded bg-[#5865F2]/20 px-2 py-0.5 text-xs font-bold text-[#8ea1e1]">
                  {filterStats.unlockedChannelsCount} canais disponíveis para seu cargo
                </span>
              </div>
              <button
                onClick={() => setIsServerBrowserOpen(false)}
                className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
              {discordCategories.map((cat) => (
                <div key={cat.id} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {cat.channels.length} canais
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">{cat.description}</p>
                  
                  <div className="space-y-1 pt-1">
                    {cat.channels.map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => {
                          setActiveDiscordCategoryId(cat.id);
                          openChannel(ch);
                          setIsServerBrowserOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition-all ${
                          activeChannelId === ch.id
                            ? 'bg-[#5865F2] text-white font-bold'
                            : 'hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {getChannelIcon(ch.type, ch.isLive || ch.isCallActive)}
                          <span className="truncate">{ch.name}</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-neutral-500" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </header>
  );
};
