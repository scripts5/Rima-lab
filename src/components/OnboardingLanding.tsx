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
  Plus
} from 'lucide-react';
import { UserProfile, Beat, BattleTrainingType, SkillFocusType } from '../types';
import { PRESET_BEATS, globalBeatEngine } from '../lib/audio/beatEngine';

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
    description: 'Velocidade extrema, métrica acelerada, dicção e respiração no beat.',
    unlockedCategories: ['Speed Flow', 'Métrica & Flow', 'Double Time'],
    unlockedChannels: ['#speedflow-treino', '#metronomo-desafios', '#diccao-rapida'],
    suggestedStyle: 'Speed Flow',
    suggestedTrainingType: 'gastacao',
    skills: ['speedflow', 'encaixe_beat', 'contagem_versos'],
  },
  {
    id: 'mc_ideologico',
    name: 'MC Ideológico & Visão',
    badge: '💡',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-950/40',
    borderColor: 'border-cyan-500/50',
    description: 'Mensagem profunda, poesia marginal, reflexão e versos construtivos.',
    unlockedCategories: ['Ideológica', 'Fundamentos', 'Poesia de Rua'],
    unlockedChannels: ['#rimas-ideologicas', '#conhecimento-cultura', '#banco-de-ideias'],
    suggestedStyle: 'Boom Bap',
    suggestedTrainingType: 'ideologica',
    skills: ['flow', 'contagem_versos', 'punchline'],
  },
  {
    id: 'mestre_gastacao',
    name: 'Mestre da Gastação',
    badge: '🟢',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/40',
    borderColor: 'border-emerald-500/50',
    description: 'Humor, trocadilhos cômicos, tiradas irônicas e improviso descontraído.',
    unlockedCategories: ['Gastação', 'Punchlines', 'Humor & Rima'],
    unlockedChannels: ['#gastacao-e-tiradas', '#trocadilhos-comicos', '#freestyle-zoeira'],
    suggestedStyle: 'Detroit',
    suggestedTrainingType: 'gastacao',
    skills: ['punchline', 'flow'],
  },
  {
    id: 'hitmaker_trapstar',
    name: 'Hitmaker / Trapstar',
    badge: '🔥',
    color: 'text-purple-400',
    bgColor: 'bg-purple-950/40',
    borderColor: 'border-purple-500/50',
    description: 'Composição de hits, autotune/melódico, refrões chiclete e trap moderno.',
    unlockedCategories: ['Trap & 808', 'Detroit', 'Composição'],
    unlockedChannels: ['#composicao-trap', '#refroes-virais', '#plug-e-hype'],
    suggestedStyle: 'Trap',
    suggestedTrainingType: 'gastacao',
    skills: ['encaixe_beat', 'flow'],
  },
  {
    id: 'beatmaker_produtor',
    name: 'Beatmaker & Produtor',
    badge: '🎧',
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
  onOpenSubscription,
}) => {
  const [mcName, setMcName] = useState('MC Visitante');
  const [mcAge, setMcAge] = useState<number | string>(18);
  const [trainingType, setTrainingType] = useState<BattleTrainingType>('gastacao');
  const [selectedStyle, setSelectedStyle] = useState('Detroit');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(['mc_batalha_sangue', 'speed_flow_master']);
  const [focusSkills, setFocusSkills] = useState<SkillFocusType[]>(['speedflow', 'punchline', 'encaixe_beat', 'flow', 'contagem_versos']);
  const [experienceLevel, setExperienceLevel] = useState<'iniciante' | 'intermediario' | 'batalhador'>('intermediario');
  const [activeDemoTab, setActiveDemoTab] = useState<'beats' | 'ai_judge' | 'studio' | 'battles'>('beats');
  const [demoPlayingId, setDemoPlayingId] = useState<string | null>(null);

  // Toggle role selection
  const handleToggleRole = (role: DiscordRoleItem) => {
    setSelectedRoleIds(prev => {
      const exists = prev.includes(role.id);
      let next: string[];
      if (exists) {
        // keep at least 1 role
        if (prev.length === 1) return prev;
        next = prev.filter(id => id !== role.id);
      } else {
        next = [...prev, role.id];
      }

      // Auto update suggested training type and style from active roles
      const activeRoles = DISCORD_ROLES.filter(r => next.includes(r.id));
      if (activeRoles.length > 0) {
        const lastRole = activeRoles[activeRoles.length - 1];
        setTrainingType(lastRole.suggestedTrainingType);
        setSelectedStyle(lastRole.suggestedStyle);
        
        // merge skills
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
      level: experienceLevel === 'batalhador' ? 3 : experienceLevel === 'intermediario' ? 2 : 1,
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

  return (
    <div className="min-h-screen bg-[#08080a] text-neutral-100 flex flex-col selection:bg-amber-500 selection:text-neutral-950">
      
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
            <span>A Primeira Plataforma de Treino de Rima com IA do Brasil</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight sm:leading-none">
            Domine o <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500">Freestyle</span> & as Batalhas de Rima
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-neutral-300 font-normal leading-relaxed">
            Treine improviso, speed flow e punchlines com sintetizador de beats em tempo real, bot estilo Discord com comandos <code className="text-amber-400 bg-neutral-900 px-1.5 py-0.5 rounded font-mono text-xs">/play</code> e avaliação técnica direta ao ponto feita por IA jurado profissional.
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
                level: experienceLevel === 'batalhador' ? 3 : experienceLevel === 'intermediario' ? 2 : 1,
              })}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-6 py-3.5 text-sm font-black text-neutral-950 shadow-xl shadow-amber-500/25 hover:scale-105 transition-all active:scale-95"
            >
              <Mic className="h-4 w-4 text-neutral-950" />
              <span>Entrar no Estúdio de Gravação</span>
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

            <button
              id="hero-scroll-demo-btn"
              onClick={() => {
                const el = document.getElementById('demo-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/80 px-5 py-3.5 text-sm font-bold text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800 transition-colors"
            >
              <Radio className="h-4 w-4 text-amber-400" />
              <span>Ver Como Funciona</span>
            </button>

            {onOpenAdmin && (
              <button
                id="hero-admin-btn"
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3.5 text-xs font-bold text-neutral-400 hover:border-red-500/40 hover:text-red-300 transition-colors"
                title="Área restrita para professores (senha 36737829)"
              >
                <span>👑</span>
                <span>Área Admin / Professor</span>
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
              <span>Speed Flow & Câmera</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-neutral-900/60 border border-neutral-800">
              <Trophy className="h-4 w-4 text-orange-400" />
              <span>Ranking & Desafios</span>
            </div>
          </div>

        </div>
      </header>

      {/* Main Interactive Onboarding & Dashboard Demonstration */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-10 space-y-12">
        
        {/* Profile Onboarding & Login Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left: MC Login / Quick Setup Form */}
          <div className="lg:col-span-5 rounded-2xl border border-amber-500/30 bg-neutral-900/90 p-6 shadow-2xl flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-neutral-950 font-black text-sm">
                    🎤
                  </div>
                  <h3 className="font-display text-base font-extrabold text-white">
                    Identificação do MC
                  </h3>
                </div>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300">
                  PASSO 1
                </span>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                Personalize seu apelido de batalha e estilo preferido para calibrar a IA do estúdio.
              </p>

              <form onSubmit={handleStartWithProfile} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Vulgo / Nome Artístico de MC:
                  </label>
                  <input
                    type="text"
                    value={mcName}
                    onChange={(e) => setMcName(e.target.value)}
                    placeholder="Ex: Luquita MC, MC Rima Rara..."
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Idade do MC */}
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

                {/* CARGOS DO DISCORD (Role-Based Onboarding) */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-amber-400">
                      🎭 Escolha seus Cargos de MC (Estilo Discord):
                    </label>
                    <span className="text-[10px] text-neutral-400 font-semibold">
                      {selectedRoleIds.length} selecionado{selectedRoleIds.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mb-2">
                    Clique nos cargos abaixo. Os canais, categorias de treino e desafios se adaptam automaticamente ao que você escolher:
                  </p>

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

                {/* Live Dynamic Discord Channels & Categories Preview */}
                <div className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-950/90 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-[#5865F2]" />
                      Canais Desbloqueados por seus Cargos:
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

                  <div className="pt-1.5 border-t border-neutral-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-amber-400" />
                      Categorias de Aulas & Beats Ativas:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {unlockedCategories.map((cat) => (
                      <span key={cat} className="rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Treinar em Qual Beat */}
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePreviewBeat(beat)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold transition-transform active:scale-95 ${
                                demoPlayingId === beat.id && isPlayingBeat
                                  ? 'bg-red-500 text-white'
                                  : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-neutral-950'
                              }`}
                            >
                              {demoPlayingId === beat.id && isPlayingBeat ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current ml-0.5" />}
                            </button>
                            <div>
                              <strong className="text-xs text-white block">{beat.title}</strong>
                              <span className="text-[10px] text-neutral-400">{beat.bpm} BPM • {beat.style}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => onSelectBeatAndStart(beat)}
                            className="text-[10px] font-bold text-amber-400 hover:underline px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20"
                          >
                            Rimar ➔
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: AI Judge Real Demo */}
              {activeDemoTab === 'ai_judge' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-neutral-950 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-black text-amber-400">
                        <span>⚖️ Jurado Técnico Real (Sem Passar Pano)</span>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                        88/100 PTS [Excelente]
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 italic">
                      "Minha mente é um relógio na contagem do segundo / Rimo pela arte transformando esse meu mundo..."
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center">
                      <div className="p-1.5 rounded bg-neutral-900 border border-neutral-800">
                        <span className="text-neutral-400 block">Métrica 4/4</span>
                        <strong className="text-cyan-400 text-xs font-black">92%</strong>
                      </div>
                      <div className="p-1.5 rounded bg-neutral-900 border border-neutral-800">
                        <span className="text-neutral-400 block">Rimas Ricas</span>
                        <strong className="text-amber-400 text-xs font-black">85%</strong>
                      </div>
                      <div className="p-1.5 rounded bg-neutral-900 border border-neutral-800">
                        <span className="text-neutral-400 block">Punchline</span>
                        <strong className="text-rose-400 text-xs font-black">88%</strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-200 leading-relaxed font-medium">
                      🎯 <strong className="text-amber-300">Visão do Jurado:</strong> "Métrica bem cravada na cabeça do compasso. Boa variedade silábica sem terminar em verbos óbvios. Dica: segure o ar na 3ª barra para a punchline estourar cheia."
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Studio Recording Demo */}
              {activeDemoTab === 'studio' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-neutral-950 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-400">🎙️ Estúdio Completo de Performance</span>
                      <span className="text-[10px] font-bold text-neutral-400">Web Audio + Web Speech</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-neutral-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span><strong>Câmera ao Vivo:</strong> Veja sua postura, expressão e gestos de MC enquanto rima.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span><strong>Detecção de Speed Flow:</strong> Mostrador de Sílabas/Segundo com alerta visual de rajada.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span><strong>Metrônomo 4/4 Visual:</strong> Leds coloridos indicando o tempo 1, 2, 3 e a caixa no 4.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions to Enter */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
              <span className="text-xs text-neutral-400">Pronto para subir no palco?</span>
              <button
                onClick={() => onEnterApp()}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-neutral-950 hover:bg-amber-400 transition-colors"
              >
                <span>Acessar Estúdio Completo</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Creators Prestige Tribute Section */}
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-neutral-900/90 to-orange-950/40 p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-neutral-950 font-black text-2xl shadow-xl shadow-amber-500/20">
                👑
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  RECONHECIMENTO & CRÉDITOS OFICIAIS
                </span>
                <h3 className="font-display text-xl font-black text-white">
                  Criado por Luquita MC & Kowalski MC
                </h3>
                <p className="text-xs text-neutral-300 mt-1 max-w-xl">
                  Desenvolvido e calibrado por quem vive a cultura do freestyle de verdade. A plataforma foi arquitetada com inteligência artificial para elevar o nível das rimas, métricas e respostas em todo o Brasil.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="block text-xs font-black text-amber-400">Luquita MC</span>
                <span className="text-[10px] text-neutral-400">Criador & Flow Designer</span>
              </div>
              <div className="text-center p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="block text-xs font-black text-orange-400">Kowalski MC</span>
                <span className="text-[10px] text-neutral-400">Criador & Engenharia AI</span>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-neutral-300">RimaLab AI</span>
            <span>— Criado por Luquita MC e Kowalski MC</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Treinamento de Freestyle, Métrica e Batalhas de Rima com Inteligência Artificial
          </p>
        </div>
      </footer>

    </div>
  );
};
