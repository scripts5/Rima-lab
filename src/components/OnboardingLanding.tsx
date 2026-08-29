import React, { useState, useMemo } from 'react';
import { 
  Mic, 
  Headphones, 
  Sparkles, 
  Zap, 
  Award, 
  Crown, 
  Play, 
  Square, 
  ArrowRight, 
  CheckCircle2, 
  Flame, 
  Trophy, 
  ShieldCheck, 
  Volume2,
  Users,
  Radio,
  Hash,
  Layers,
  Check,
  Plus,
  Clock,
  HelpCircle,
  TrendingUp,
  Settings
} from 'lucide-react';
import { UserProfile, Beat, BattleTrainingType, SkillFocusType } from '../types';
import { PRESET_BEATS, globalBeatEngine } from '../lib/audio/beatEngine';
import { useSiteCustomization } from '../context/SiteCustomizationContext';

export interface DiscordRoleItem {
  id: string;
  name: string;
  badge: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  unlockedCategories: string[];
  unlockedChannels: string[];
  suggestedStyle: string;
  suggestedTrainingType: BattleTrainingType;
  skills: SkillFocusType[];
}

export const DISCORD_ROLES: DiscordRoleItem[] = [
  {
    id: 'mc_batalha_sangue',
    name: 'MC de Batalha (Sangue)',
    badge: '⚔️',
    color: 'text-red-400',
    bgColor: 'bg-red-950/40',
    borderColor: 'border-red-500/50',
    description: 'Ataque, respostas instantâneas, rimas agressivas e postura de palco.',
    unlockedCategories: ['Punchlines', 'Batalhas & Improviso', 'Drill'],
    unlockedChannels: ['#batalha-sangue', '#cypher-ao-vivo', '#arena-versus'],
    suggestedStyle: 'Drill',
    suggestedTrainingType: 'sangue',
    skills: ['punchline', 'encaixe_beat', 'flow'],
  },
  {
    id: 'speed_flow_master',
    name: 'Speed Flow Master',
    badge: '⚡',
    color: 'text-amber-400',
    bgColor: 'bg-amber-950/40',
    borderColor: 'border-amber-500/50',
    description: 'Dicção ultrarrápida, métrica acelerada, trava-línguas e respiração.',
    unlockedCategories: ['Speed Flow', 'Métrica & Flow', 'Dicção & Agilidade'],
    unlockedChannels: ['#speedflow-treino', '#trava-linguas', '#metronomo-desafios'],
    suggestedStyle: 'Detroit',
    suggestedTrainingType: 'gastacao',
    skills: ['speedflow', 'encaixe_beat', 'flow'],
  },
  {
    id: 'mc_gastacao_humor',
    name: 'MC Gastação & Resposta',
    badge: '🎭',
    color: 'text-orange-400',
    bgColor: 'bg-orange-950/40',
    borderColor: 'border-orange-500/50',
    description: 'Tiradas cômicas, trocadilhos, quebra de expectativa e sarcasmo.',
    unlockedCategories: ['Gastação & Humor', 'Improviso Rápido', 'Punchlines'],
    unlockedChannels: ['#gastacao-e-tiradas', '#trocadilhos-duplos', '#sala-de-deboche'],
    suggestedStyle: 'Trap',
    suggestedTrainingType: 'gastacao',
    skills: ['punchline', 'flow'],
  },
  {
    id: 'mc_conhecimento_filo',
    name: 'MC de Conhecimento & Mensagem',
    badge: '📜',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/40',
    borderColor: 'border-emerald-500/50',
    description: 'Rimas conscientes, vocabulário rebuscado, história e metáforas ricas.',
    unlockedCategories: ['Conhecimento & Mensagem', 'Vocabulário Rico', 'Metáforas'],
    unlockedChannels: ['#rima-conhecimento', '#leitura-e-versos', '#filosofia-hiphop'],
    suggestedStyle: 'Boom Bap',
    suggestedTrainingType: 'conhecimento',
    skills: ['contagem_versos', 'flow', 'encaixe_beat'],
  },
  {
    id: 'beatmaker_flow_analyst',
    name: 'Produtor & Mestre de Beat',
    badge: '🎹',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-950/40',
    borderColor: 'border-indigo-500/50',
    description: 'Metrônomo, contagem de compassos 4/4, sintetizadores e mixagem.',
    unlockedCategories: ['Encaixe no Beat', 'Fundamentos', 'Beats & Métrica'],
    unlockedChannels: ['#sala-beatmaker', '#comandos-de-beat', '#troca-de-samples'],
    suggestedStyle: 'Boom Bap',
    suggestedTrainingType: 'conhecimento',
    skills: ['encaixe_beat', 'contagem_versos'],
  },
  {
    id: 'iniciante_aprendiz',
    name: 'Freestyler Aprendiz',
    badge: '🎤',
    color: 'text-zinc-300',
    bgColor: 'bg-zinc-900',
    borderColor: 'border-zinc-700',
    description: 'Começando do zero: primeiras rimas, rimas ricas e perda da timidez.',
    unlockedCategories: ['Fundamentos', 'Contagem de Versos', 'Primeiras Rimas'],
    unlockedChannels: ['#iniciantes-treino', '#primeiras-rimas', '#dicas-dos-mestres'],
    suggestedStyle: 'Boom Bap',
    suggestedTrainingType: 'conhecimento',
    skills: ['encaixe_beat', 'contagem_versos', 'flow'],
  },
];

interface OnboardingLandingProps {
  onEnterApp: (customProfile?: Partial<UserProfile>) => void;
  onSelectBeatAndStart: (beat: Beat) => void;
  isPlayingBeat: boolean;
  onToggleBeat: () => void;
  currentBeat: Beat;
  onOpenGmailAuth?: () => void;
  onOpenAdmin?: () => void;
  onOpenStudioConfig?: () => void;
  onOpenSubscription?: () => void;
}

export const OnboardingLanding: React.FC<OnboardingLandingProps> = ({
  onEnterApp,
  onSelectBeatAndStart,
  isPlayingBeat,
  onToggleBeat,
  currentBeat,
  onOpenGmailAuth,
  onOpenAdmin,
  onOpenStudioConfig,
  onOpenSubscription,
}) => {
  const { customization } = useSiteCustomization();

  // Basic Profile State
  const [mcName, setMcName] = useState('MC Visitante');
  const [mcAge, setMcAge] = useState<number | string>(18);
  const [trainingType, setTrainingType] = useState<BattleTrainingType>('gastacao');
  const [selectedStyle, setSelectedStyle] = useState('Detroit');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(['mc_batalha_sangue', 'speed_flow_master']);
  const [focusSkills, setFocusSkills] = useState<SkillFocusType[]>(['speedflow', 'punchline', 'encaixe_beat', 'flow', 'contagem_versos']);
  
  // NEW ONBOARDING QUESTIONS REQUESTED BY USER:
  // 1. "Você já rimou alguma vez?"
  const [hasRhymedBefore, setHasRhymedBefore] = useState<'sim' | 'nao'>('sim');
  // 2. "Quanto tempo você já rimou?" (se sim)
  const [rhymeDuration, setRhymeDuration] = useState<'menos_6m' | '6m_1ano' | '1_2anos' | 'mais_2anos'>('6m_1ano');

  const [activeDemoTab, setActiveDemoTab] = useState<'beats' | 'ai_judge' | 'studio' | 'battles'>('beats');
  const [demoPlayingId, setDemoPlayingId] = useState<string | null>(null);

  // Dynamic starting XP and Level calculation based on 55 XP evolution rule
  const calculatedStartingXP = useMemo(() => {
    if (hasRhymedBefore === 'nao') {
      return 55; // 1 evolution step
    }
    switch (rhymeDuration) {
      case 'menos_6m': return 110; // 2 evolutions (55 * 2)
      case '6m_1ano': return 165; // 3 evolutions (55 * 3)
      case '1_2anos': return 220; // 4 evolutions (55 * 4)
      case 'mais_2anos': return 330; // 6 evolutions (55 * 6)
      default: return 110;
    }
  }, [hasRhymedBefore, rhymeDuration]);

  const calculatedLevel = useMemo(() => {
    return Math.max(1, Math.floor(calculatedStartingXP / 55) + 1);
  }, [calculatedStartingXP]);

  // Toggle role selection
  const handleToggleRole = (role: DiscordRoleItem) => {
    setSelectedRoleIds(prev => {
      const exists = prev.includes(role.id);
      let next: string[];
      if (exists) {
        if (prev.length === 1) return prev;
        next = prev.filter(id => id !== role.id);
      } else {
        next = [...prev, role.id];
      }

      const activeRoles = DISCORD_ROLES.filter(r => next.includes(r.id));
      if (activeRoles.length > 0) {
        const lastRole = activeRoles[activeRoles.length - 1];
        setTrainingType(lastRole.suggestedTrainingType);
        setSelectedStyle(lastRole.suggestedStyle);
        
        const mergedSkills = new Set<SkillFocusType>();
        activeRoles.forEach(r => r.skills.forEach(s => mergedSkills.add(s)));
        setFocusSkills(Array.from(mergedSkills));
      }

      return next;
    });
  };

  // Derive unlocked categories and channels dynamically based on selected roles
  const { unlockedCategories, unlockedChannels, roleNames } = useMemo(() => {
    const categoriesSet = new Set<string>();
    const channelsSet = new Set<string>();
    const names: string[] = [];

    const activeRoles = DISCORD_ROLES.filter(r => selectedRoleIds.includes(r.id));
    activeRoles.forEach(role => {
      names.push(`${role.badge} ${role.name}`);
      role.unlockedCategories.forEach(c => categoriesSet.add(c));
      role.unlockedChannels.forEach(ch => channelsSet.add(ch));
    });

    return {
      unlockedCategories: Array.from(categoriesSet),
      unlockedChannels: Array.from(channelsSet),
      roleNames: names,
    };
  }, [selectedRoleIds]);

  const handleStartWithProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onEnterApp({
      artisticName: mcName.trim() || 'MC Foco & Flow',
      age: Number(mcAge) || 18,
      trainingType,
      favoriteStyle: selectedStyle,
      focusSkills,
      roles: roleNames,
      selectedCategories: unlockedCategories,
      unlockedChannels: unlockedChannels,
      tagline: roleNames[0] || 'MC Rimador RimaLab',
      totalXP: calculatedStartingXP,
      level: calculatedLevel,
      bio: hasRhymedBefore === 'sim'
        ? `Rimador há ${rhymeDuration === 'menos_6m' ? 'menos de 6 meses' : rhymeDuration === '6m_1ano' ? '6 meses a 1 ano' : rhymeDuration === '1_2anos' ? '1 a 2 anos' : 'mais de 2 anos'}. Evoluindo na Academia de Rimas.`
        : 'Iniciando no freestyle do zero na Academia de Rimas.',
    });
  };

  const handlePreviewBeat = (beat: Beat) => {
    if (demoPlayingId === beat.id && isPlayingBeat) {
      globalBeatEngine.stop();
      setDemoPlayingId(null);
    } else {
      globalBeatEngine.setBeat(beat);
      globalBeatEngine.start();
      setDemoPlayingId(beat.id);
    }
  };

  // Gradient Helper for Customization
  const getHeroGradientClass = () => {
    switch (customization.heroGradient) {
      case 'purple-pink-red': return 'from-purple-400 via-pink-500 to-red-500';
      case 'emerald-teal-cyan': return 'from-emerald-400 via-teal-500 to-cyan-400';
      case 'blue-indigo-purple': return 'from-blue-400 via-indigo-500 to-purple-500';
      case 'red-gold-yellow': return 'from-red-500 via-amber-400 to-yellow-300';
      case 'cyberpunk-neon': return 'from-green-400 via-lime-400 to-yellow-300';
      case 'amber-orange-red':
      default: return 'from-amber-400 via-orange-500 to-red-500';
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-950">
      
      {/* Optional Announcement Banner (Live configurable via Kowalski Studio) */}
      {customization.announcementBanner?.enabled && (
        <div className={`w-full py-2 px-4 text-center text-xs font-bold transition-all border-b ${
          customization.announcementBanner.style === 'red'
            ? 'bg-red-950/90 text-red-200 border-red-500/40'
            : customization.announcementBanner.style === 'emerald'
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
            : customization.announcementBanner.style === 'purple'
            ? 'bg-purple-950/90 text-purple-200 border-purple-500/40'
            : 'bg-amber-950/90 text-amber-200 border-amber-500/40'
        }`}>
          <div className="mx-auto max-w-7xl flex items-center justify-center gap-2">
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] uppercase font-black tracking-wider">
              {customization.announcementBanner.badge || 'AVISO'}
            </span>
            <span>{customization.announcementBanner.text}</span>
          </div>
        </div>
      )}

      {/* Top Creators Prestige Badge */}
      <div className="w-full bg-gradient-to-r from-amber-950/80 via-neutral-900 to-orange-950/80 border-b border-amber-500/30 py-2 px-4 text-center">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs">
          <span className="flex items-center gap-1.5 font-black uppercase tracking-wider text-amber-400">
            <Crown className="h-3.5 w-3.5 fill-amber-400" />
            Criado & Idealizado por
          </span>
          <div className="flex items-center gap-2 font-bold text-white">
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-amber-300 border border-amber-500/40">
              🎤 Luquita MC
            </span>
            <span className="text-amber-500">&</span>
            <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-orange-300 border border-orange-500/40">
              ⚡ Kowalski MC
            </span>
          </div>
          <span className="hidden md:inline text-[11px] text-neutral-400 font-medium">
            • Mestres da Rima, Métrica & Inteligência Artificial
          </span>
        </div>
      </div>

      {/* Main Hero Header */}
      <header className="relative overflow-hidden border-b border-neutral-800/80 bg-gradient-to-b from-neutral-900/50 via-neutral-950 to-[#08080a] py-12 sm:py-16 px-4 sm:px-6">
        {/* Glow backdrop circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[600px] h-96 sm:h-[600px] bg-gradient-to-tr from-amber-500/10 via-orange-600/10 to-red-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-5xl text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-400 shadow-lg shadow-amber-500/10">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            <span>{customization.brandName || 'Academia de Rimas'} • Treino com IA & Beats em Tempo Real</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight sm:leading-none">
            {customization.heroTitle ? (
              <>
                {customization.heroTitle}{' '}
                {customization.heroHighlightWord && (
                  <span className={`text-transparent bg-clip-text bg-gradient-to-r ${getHeroGradientClass()}`}>
                    {customization.heroHighlightWord}
                  </span>
                )}
              </>
            ) : (
              <>
                Domine o <span className={`text-transparent bg-clip-text bg-gradient-to-r ${getHeroGradientClass()}`}>Freestyle</span> & as Batalhas de Rima
              </>
            )}
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-neutral-300 font-normal leading-relaxed">
            {customization.heroSubtitle || 'Treine improviso, speed flow e punchlines com sintetizador de beats em tempo real, bot estilo Discord com comandos /play e avaliação técnica direta ao ponto.'}
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              id="hero-enter-direct-btn"
              onClick={() => onEnterApp({
                artisticName: mcName.trim() || 'MC Foco & Flow',
                age: Number(mcAge) || 18,
                trainingType,
                favoriteStyle: selectedStyle,
                focusSkills,
                roles: roleNames,
                selectedCategories: unlockedCategories,
                unlockedChannels: unlockedChannels,
                tagline: roleNames[0] || 'MC Rimador RimaLab',
                totalXP: calculatedStartingXP,
                level: calculatedLevel,
              })}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-6 py-3.5 text-sm font-black text-neutral-950 shadow-xl shadow-amber-500/25 hover:scale-105 transition-all active:scale-95"
            >
              <Mic className="h-4 w-4 text-neutral-950" />
              <span>{customization.ctaButtonText || 'Entrar no Estúdio de Gravação'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {onOpenGmailAuth && (
              <button
                id="hero-gmail-auth-btn"
                onClick={onOpenGmailAuth}
                className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-gradient-to-r from-red-950/40 to-neutral-900 px-5 py-3.5 text-sm font-bold text-red-200 hover:border-red-500/80 hover:text-white transition-all shadow-lg shadow-red-950/30"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-neutral-950 font-black text-xs">
                  G
                </span>
                <span>Entrar com Gmail (14 Dias Grátis)</span>
              </button>
            )}

            {onOpenAdmin && (
              <button
                id="hero-prof-btn"
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors"
                title="Área dos Professores Kowalski MC & Luquita MC"
              >
                <span>🎓</span>
                <span>Prof</span>
              </button>
            )}

            {onOpenStudioConfig && (
              <button
                id="hero-kowalski-studio-btn"
                onClick={onOpenStudioConfig}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3.5 text-xs font-bold text-neutral-300 hover:border-amber-500/40 hover:text-amber-300 transition-colors"
                title="Kowalski Studio - Editor & Chat IA de Modificação do Site"
              >
                <Settings className="h-3.5 w-3.5 text-amber-400" />
                <span>Admin (Kowalski Studio)</span>
              </button>
            )}
          </div>

          {/* Key Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-3xl mx-auto text-xs text-neutral-300 font-medium">
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
              <Headphones className="h-4 w-4 text-indigo-400" />
              <span>Bot Discord de Beats</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>IA Jurado Sem Rodeios</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Evolução a cada 55 XP</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
              <Trophy className="h-4 w-4 text-orange-400" />
              <span>Ranking & Desafios</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Interactive Onboarding & Dashboard Demonstration */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Role Selection & Onboarding Setup */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-6 space-y-5">
              
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="font-display text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-400" />
                  Calibre seu Perfil de MC
                </h3>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                  Passo Rápido
                </span>
              </div>

              <form onSubmit={handleStartWithProfile} className="space-y-4">
                
                {/* 1. Nome / Vulgo */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Vulgo / Nome Artístico de MC:
                  </label>
                  <input
                    type="text"
                    value={mcName}
                    onChange={(e) => setMcName(e.target.value)}
                    placeholder="Ex: MC Foco & Flow, MC Tempestade..."
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                {/* 2. Idade do MC */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    🎂 Idade do MC:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="8"
                      max="99"
                      value={mcAge}
                      onChange={(e) => setMcAge(e.target.value)}
                      placeholder="Ex: 17"
                      className="w-24 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-white font-bold focus:border-amber-500 focus:outline-none"
                    />
                    <div className="flex flex-wrap items-center gap-1">
                      {[14, 16, 18, 21, 25].map((agePreset) => (
                        <button
                          key={agePreset}
                          type="button"
                          onClick={() => setMcAge(agePreset)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                            Number(mcAge) === agePreset
                              ? 'bg-amber-500 text-neutral-950'
                              : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                          }`}
                        >
                          {agePreset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. NEW QUESTION: "Você já rimou alguma vez?" */}
                <div className="p-3 rounded-xl border border-amber-500/30 bg-neutral-950 space-y-2.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                    Você já rimou ou improvisou alguma vez?
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setHasRhymedBefore('sim')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        hasRhymedBefore === 'sim'
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 font-black shadow-md'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Sim, já rimei</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHasRhymedBefore('nao')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        hasRhymedBefore === 'nao'
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 font-black shadow-md'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <span>Não, sou iniciante</span>
                    </button>
                  </div>

                  {/* 4. NEW CONDITIONAL QUESTION: "Há quanto tempo você rima?" */}
                  {hasRhymedBefore === 'sim' ? (
                    <div className="pt-2 border-t border-neutral-800 space-y-1.5 animate-in fade-in">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-neutral-400" />
                        Há quanto tempo você já rima?
                      </label>
                      
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRhymeDuration('menos_6m')}
                          className={`p-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            rhymeDuration === 'menos_6m'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          Menos de 6 meses
                        </button>

                        <button
                          type="button"
                          onClick={() => setRhymeDuration('6m_1ano')}
                          className={`p-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            rhymeDuration === '6m_1ano'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          6 meses a 1 ano
                        </button>

                        <button
                          type="button"
                          onClick={() => setRhymeDuration('1_2anos')}
                          className={`p-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            rhymeDuration === '1_2anos'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          1 a 2 anos
                        </button>

                        <button
                          type="button"
                          onClick={() => setRhymeDuration('mais_2anos')}
                          className={`p-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            rhymeDuration === 'mais_2anos'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          Mais de 2 anos (Experiente)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-neutral-800 text-[11px] text-emerald-400">
                      💡 Perfeito! O sistema iniciará com métricas passo-a-passo e desafios de primeiras rimas para destravar seu improviso.
                    </div>
                  )}

                  {/* 55 XP Evolution Preview Tag */}
                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px]">
                    <span className="text-neutral-400 flex items-center gap-1 font-bold">
                      <TrendingUp className="h-3 w-3 text-amber-400" />
                      Evolução a cada 55 XP:
                    </span>
                    <span className="font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      Iniciando com {calculatedStartingXP} XP (Nível {calculatedLevel})
                    </span>
                  </div>
                </div>

                {/* 5. CARGOS DO DISCORD */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-amber-400">
                      🎭 Escolha seus Cargos de MC (Estilo Discord):
                    </label>
                    <span className="text-[10px] text-neutral-400 font-semibold">
                      {selectedRoleIds.length} selecionado{selectedRoleIds.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                    {DISCORD_ROLES.map((role) => {
                      const isSelected = selectedRoleIds.includes(role.id);
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleToggleRole(role)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl border text-left transition-all relative ${
                            isSelected
                              ? `${role.bgColor} ${role.borderColor} shadow-md`
                              : 'bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700 opacity-75 hover:opacity-100'
                          }`}
                        >
                          <span className="text-base leading-none mt-0.5">{role.badge}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-black truncate ${isSelected ? role.color : 'text-white'}`}>
                                {role.name}
                              </span>
                              {isSelected && (
                                <span className="h-4 w-4 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center text-[10px] font-black shrink-0">
                                  ✓
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                              {role.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Canais Desbloqueados */}
                <div className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-950/90 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-[#5865F2]" />
                      Canais Desbloqueados:
                    </span>
                    <span className="text-[10px] text-[#5865F2] font-bold">
                      {unlockedChannels.length} canais
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {unlockedChannels.map((ch) => (
                      <span key={ch} className="inline-flex items-center gap-1 rounded-md bg-[#2b2d31] px-1.5 py-0.5 text-[10px] font-medium text-neutral-300 border border-neutral-700/50">
                        <span className="text-[#5865F2]">#</span>
                        {ch.replace('#', '')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Beat Inicial */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    🎹 Beat Padrão Inicial:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['Detroit', 'Trap', 'Boom Bap', 'Drill', 'Grime', 'Speed Flow'].map((st) => (
                      <button
                        type="button"
                        key={st}
                        onClick={() => setSelectedStyle(st)}
                        className={`rounded-lg py-1.5 px-2 text-[11px] font-bold border transition-all ${
                          selectedStyle === st
                            ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow font-black'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {st === 'Detroit' ? '🎹 Detroit' : st === 'Trap' ? '🔥 Trap' : st === 'Boom Bap' ? '🎙️ Boombap' : st}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all mt-2"
                >
                  <Zap className="h-4 w-4" />
                  <span>Entrar com Meus Cargos & Rimar</span>
                </button>
              </form>
            </div>

            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
              <span>Sem necessidade de senha</span>
              <button
                onClick={() => onEnterApp()}
                className="text-amber-400 hover:underline font-bold"
              >
                Entrar direto como Convidado ➔
              </button>
            </div>
          </div>

          {/* Right: Interactive How it Works Dashboard */}
          <div id="demo-section" className="lg:col-span-7 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    VISÃO GERAL DO APP
                  </span>
                  <h3 className="font-display text-lg font-bold text-white">
                    Como o RimaLab AI Funciona
                  </h3>
                </div>
                
                {/* Demo Tabs */}
                <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
                  <button
                    onClick={() => setActiveDemoTab('beats')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      activeDemoTab === 'beats' ? 'bg-[#5865F2] text-white' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    🎧 Bot de Beats
                  </button>
                  <button
                    onClick={() => setActiveDemoTab('ai_judge')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      activeDemoTab === 'ai_judge' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    ⚖️ IA Jurado
                  </button>
                  <button
                    onClick={() => setActiveDemoTab('studio')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      activeDemoTab === 'studio' ? 'bg-emerald-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    🎙️ Studio
                  </button>
                </div>
              </div>

              {/* Tab 1: Beats & Discord Bot Demo */}
              {activeDemoTab === 'beats' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-xl border border-[#5865F2]/40 bg-[#1e1f22] text-xs text-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-white">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#5865F2] text-white text-[10px]">🤖</span>
                        <span>RimaBot Beats [BOT]</span>
                      </div>
                      <span className="rounded bg-[#5865F2] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">DISCORD /PLAY</span>
                    </div>
                    <p className="text-[11px] text-neutral-300">
                      Toque qualquer beat digitando <code className="text-amber-400 bg-neutral-900 px-1 py-0.5 rounded font-mono">/play [nome ou link]</code>. O beat toca imediatamente no navegador e vai para o Studio!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                      Beats Prontos para Testar Agora:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PRESET_BEATS.slice(0, 4).map((beat) => (
                        <div
                          key={beat.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-xs text-white block truncate">{beat.title}</span>
                            <span className="text-[10px] text-neutral-400">{beat.bpm} BPM • {beat.style}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handlePreviewBeat(beat)}
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                demoPlayingId === beat.id && isPlayingBeat
                                  ? 'bg-red-500 text-white'
                                  : 'bg-neutral-800 text-neutral-300 hover:text-white'
                              }`}
                              title={demoPlayingId === beat.id && isPlayingBeat ? 'Pausar' : 'Ouvir Beat'}
                            >
                              {demoPlayingId === beat.id && isPlayingBeat ? <Square className="h-3 w-3 fill-white" /> : <Play className="h-3 w-3 fill-white" />}
                            </button>
                            <button
                              onClick={() => onSelectBeatAndStart(beat)}
                              className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[10px] font-black flex items-center gap-1"
                              title="Rimar com este beat no estúdio"
                            >
                              <Mic className="h-2.5 w-2.5" />
                              <span>Rimar</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: AI Judge Demo (Interactive Live Simulator) */}
              {activeDemoTab === 'ai_judge' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-xl border border-amber-500/40 bg-neutral-950 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-amber-400 flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        Feedback Técnico Direto & Rápido
                      </span>
                      <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-black">
                        NOTA: 8.8 / 10
                      </span>
                    </div>
                    <p className="text-neutral-300 leading-relaxed text-[11px]">
                      "Excelente encaixe nos contratempos do compasso 4/4. A rima rica <strong>faca / rima rara / mente para</strong> surpreendeu na punchline final. Mantenha a respiração no 3º verso para atacar com máxima pressão."
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold block">Métrica</span>
                      <strong className="text-amber-400 text-sm">9.4 / 10</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold block">Punchline</span>
                      <strong className="text-orange-400 text-sm">8.9 / 10</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                      <span className="text-[10px] text-neutral-400 uppercase font-bold block">Velocidade</span>
                      <strong className="text-emerald-400 text-sm">138 WPM</strong>
                    </div>
                  </div>

                  {/* Multisyllabic breakdown chip demo */}
                  <div className="p-2 rounded-xl bg-neutral-950 border border-neutral-800/80 text-[10px] space-y-1">
                    <span className="text-neutral-400 font-bold block">🔬 Rimas Multissilábicas Detectadas:</span>
                    <div className="flex flex-wrap gap-1">
                      <span className="bg-amber-500/15 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded">
                        métrica corta a faca ↔ rima rara
                      </span>
                      <span className="bg-purple-500/15 border border-purple-500/40 text-purple-300 px-1.5 py-0.5 rounded">
                        mente para ↔ no compasso dispara
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Studio Demo */}
              {activeDemoTab === 'studio' && (
                <div className="space-y-3 animate-in fade-in duration-200 text-xs">
                  <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-neutral-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <Mic className="h-4 w-4" />
                        Estúdio Completo com Câmera e Dicionário de Rimas
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        HD 1080p
                      </span>
                    </div>
                    <p className="text-neutral-300 leading-relaxed text-[11px]">
                      Grave seus vídeos de batalha com visualização de câmera integrada, sugestão de palavras difíceis em tempo real no metrônomo, geração de cartões virais para Instagram Stories/TikTok e duelos assíncronos 1v1.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Free vs PRO Transparency Card */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  💎 O que é Grátis vs PRO no RimaLab:
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  14 Dias Grátis com Gmail
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1">
                  <span className="font-bold text-white block">🌱 Plano Grátis:</span>
                  <ul className="text-neutral-400 space-y-0.5 text-[10px]">
                    <li>✓ 3 Beats Essenciais de Treino</li>
                    <li>✓ Metrônomo e Gravador de Áudio</li>
                    <li>✓ Análise e Pontuação Básica</li>
                    <li>✓ 14 Dias de Teste Completo</li>
                  </ul>
                </div>

                <div className="p-2 rounded-lg bg-gradient-to-b from-amber-950/30 to-neutral-900 border border-amber-500/30 space-y-1">
                  <span className="font-bold text-amber-400 block">👑 Plano PRO:</span>
                  <ul className="text-amber-200/90 space-y-0.5 text-[10px]">
                    <li>★ Todos os Beats Exclusivos (Detroit, Grime, Drill)</li>
                    <li>★ 3 Personalidades de Jurados IA (Kowalski, BDA)</li>
                    <li>★ Duelos 1v1 Assíncronos & Cards Stories</li>
                    <li>★ 2x XP no Ranking Semanal & Geral</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Join CTA */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-neutral-950 to-orange-950/40 border border-amber-500/30 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-white block">
                  Pronto para começar seu treino diário?
                </span>
                <span className="text-[11px] text-neutral-400">
                  Aulas, rankings e bots prontos no seu navegador.
                </span>
              </div>

              <button
                onClick={() => onEnterApp()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shrink-0 shadow-lg shadow-amber-500/20"
              >
                Abrir RimaLab ➔
              </button>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
};
