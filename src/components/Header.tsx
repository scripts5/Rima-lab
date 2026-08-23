import React from 'react';
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
  Terminal
} from 'lucide-react';
import { UserProfile, Subscription } from '../types';

interface HeaderProps {
  activeTab: 'studio' | 'lessons' | 'challenges' | 'achievements' | 'profile' | 'leaderboard' | 'bot';
  setActiveTab: (tab: 'studio' | 'lessons' | 'challenges' | 'achievements' | 'profile' | 'leaderboard' | 'bot') => void;
  profile: UserProfile | null;
  subscription: Subscription | null;
  onOpenSubscription: () => void;
  onOpenPromptGen: () => void;
  isPlayingBeat: boolean;
  onToggleBeat: () => void;
  currentBeatTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  profile,
  subscription,
  onOpenSubscription,
  onOpenPromptGen,
  isPlayingBeat,
  onToggleBeat,
  currentBeatTitle,
}) => {
  const level = profile?.level || 1;
  const totalXP = profile?.totalXP || 0;
  const currentLevelXP = totalXP % 1000;
  const progressPercent = Math.min(100, Math.round((currentLevelXP / 1000) * 100));
  const streak = profile?.streakDays || 1;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <button
            id="brand-logo-btn"
            onClick={() => setActiveTab('studio')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 shadow-lg shadow-amber-500/20 text-neutral-950 font-black text-xl tracking-tighter transition-transform group-hover:scale-105">
              <Mic className="h-5 w-5 text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg font-extrabold tracking-tight text-white">
                  Rima<span className="text-amber-500">Lab</span>
                </span>
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                  AI
                </span>
              </div>
              <p className="hidden text-[11px] text-neutral-400 sm:block">
                Treinamento de Freestyle & Métrica
              </p>
            </div>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800">
          <button
            id="nav-studio-btn"
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'studio'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Studio</span>
          </button>

          <button
            id="nav-bot-btn"
            onClick={() => setActiveTab('bot')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'bot'
                ? 'bg-[#5865F2] text-white shadow-md font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Headphones className="h-3.5 w-3.5 text-[#5865F2] group-hover:text-white" />
            <span>Bot / Beats 🎧</span>
          </button>

          <button
            id="nav-lessons-btn"
            onClick={() => setActiveTab('lessons')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'lessons'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Academia</span>
          </button>

          <button
            id="nav-challenges-btn"
            onClick={() => setActiveTab('challenges')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'challenges'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Desafios</span>
          </button>

          <button
            id="nav-achievements-btn"
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'achievements'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Conquistas</span>
          </button>

          <button
            id="nav-leaderboard-btn"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Ranking</span>
          </button>

          <button
            id="nav-profile-btn"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'profile'
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Meu Perfil</span>
          </button>
        </nav>

        {/* Actions & Status Stats */}
        <div className="flex items-center gap-2.5">
          
          {/* Quick AI Topic Generator button */}
          <button
            id="header-prompt-gen-btn"
            onClick={onOpenPromptGen}
            title="Gerar temas e palavras-chave para treino com IA"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-950/40 px-2.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/50 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            <span>Tema IA</span>
          </button>

          {/* Quick Beat Controller Pill */}
          <div className="hidden lg:flex items-center gap-2 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
            <button
              id="header-toggle-beat-btn"
              onClick={onToggleBeat}
              className={`p-1.5 rounded-md text-xs font-bold transition-all ${
                isPlayingBeat
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
              title={isPlayingBeat ? 'Pausar Beat' : 'Tocar Beat'}
            >
              {isPlayingBeat ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
            </button>
            <div className="text-[11px] truncate max-w-[100px] text-neutral-400 font-medium">
              {currentBeatTitle}
            </div>
          </div>

          {/* Streak Counter */}
          <div 
            title={`Sequência de treino: ${streak} dias seguidos`}
            className="flex items-center gap-1 rounded-lg bg-orange-950/40 border border-orange-500/30 px-2 py-1 text-xs font-bold text-orange-400"
          >
            <Flame className="h-3.5 w-3.5 text-orange-500 fill-orange-500 animate-bounce" />
            <span>{streak}d</span>
          </div>

          {/* XP & Level Pill */}
          <div 
            onClick={() => setActiveTab('profile')}
            className="cursor-pointer flex items-center gap-2 rounded-lg bg-neutral-900 border border-neutral-800 px-2.5 py-1 hover:border-amber-500/50 transition-colors"
            title={`Nível ${level} • ${totalXP} XP acumulados (${progressPercent}% para o próximo)`}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-black text-amber-400">
              {level}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-semibold text-neutral-400 leading-none">
                {totalXP} XP
              </span>
              <div className="mt-0.5 h-1 w-12 rounded-full bg-neutral-800 overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Plan Upgrade Pill */}
          <button
            id="header-plan-btn"
            onClick={onOpenSubscription}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              subscription?.plan === 'PRO' || subscription?.plan === 'PREMIUM'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 shadow'
                : 'border border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-amber-500/60 hover:text-amber-400'
            }`}
          >
            <Crown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {subscription?.plan === 'PRO' ? 'PRO' : subscription?.plan === 'PREMIUM' ? 'PREMIUM' : 'FREE'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Sub-nav */}
      <div className="flex md:hidden border-t border-neutral-800/60 bg-neutral-950 px-2 py-1.5 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex-1 py-1 px-2 text-center rounded text-xs font-semibold whitespace-nowrap ${
            activeTab === 'studio' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'
          }`}
        >
          Studio
        </button>
        <button
          onClick={() => setActiveTab('bot')}
          className={`flex-1 py-1 px-2 text-center rounded text-xs font-semibold whitespace-nowrap ${
            activeTab === 'bot' ? 'bg-[#5865F2] text-white font-bold' : 'text-neutral-400'
          }`}
        >
          Bot / Beats 🎧
        </button>
        <button
          onClick={() => setActiveTab('lessons')}
          className={`flex-1 py-1 px-2 text-center rounded text-xs font-semibold whitespace-nowrap ${
            activeTab === 'lessons' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'
          }`}
        >
          Academia
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 py-1 px-2 text-center rounded text-xs font-semibold whitespace-nowrap ${
            activeTab === 'challenges' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'
          }`}
        >
          Desafios
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 py-1 px-2 text-center rounded text-xs font-semibold whitespace-nowrap ${
            activeTab === 'achievements' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'
          }`}
        >
          Conquistas
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-1 px-2 text-center rounded text-xs font-semibold whitespace-nowrap ${
            activeTab === 'leaderboard' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'
          }`}
        >
          Ranking
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-1 px-2 text-center rounded text-xs font-semibold whitespace-nowrap ${
            activeTab === 'profile' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'
          }`}
        >
          Perfil
        </button>
      </div>
    </header>
  );
};
