import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  Target, 
  Clock, 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  Sparkles, 
  Award, 
  BookOpen, 
  Flame, 
  Layers, 
  Sliders, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle, 
  RotateCcw, 
  Compass, 
  Smile, 
  Brain, 
  Check, 
  Mic, 
  Radio, 
  Activity,
  ChevronRight,
  Eye,
  Settings,
  Plus,
  Filter,
  Users,
  Music,
  Dumbbell,
  RefreshCw,
  Search,
  CheckCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, SkillFocusType, BattleTrainingType, Beat, Lesson } from '../types';
import { PRESET_BEATS, globalBeatEngine } from '../lib/audio/beatEngine';
import { LESSONS_DATA } from '../data/lessons';

interface SkillTracksViewProps {
  profile: UserProfile | null;
  onUpdateFocusSkills: (skills: SkillFocusType[], trainingType?: BattleTrainingType) => void;
  onSendToStudioWithSetup: (config: {
    beatStyle?: string;
    bpm?: number;
    trainingType?: BattleTrainingType;
    focusSkills?: SkillFocusType[];
    prompt?: string;
  }) => void;
  initialSelectedTab?: string;
}

// Filter Types
type AgeFilterType = 'todas' | 'kids' | 'jovem' | 'adulto';
type ObjectiveFilterType = 'todos' | 'batalha' | 'composicao' | 'velocidade' | 'flow';
type BeatFilterType = 'todos' | 'boombap' | 'trap' | 'detroit' | 'drill';

export const SkillTracksView: React.FC<SkillTracksViewProps> = ({
  profile,
  onUpdateFocusSkills,
  onSendToStudioWithSetup,
  initialSelectedTab,
}) => {
  // Current user preferences
  const activeFocusSkills = profile?.focusSkills || ['speedflow', 'encaixe_beat', 'contagem_versos'];
  const activeTrainingType = profile?.trainingType || 'gastacao';

  // Available skills catalogue
  const ALL_SKILL_DEFINITIONS: {
    id: SkillFocusType | 'gastacao' | 'ideologica' | 'all';
    name: string;
    icon: string;
    category: 'skill' | 'vertente' | 'all';
    badgeColor: string;
    tagline: string;
    description: string;
  }[] = [
    {
      id: 'speedflow',
      name: 'Speed Flow & Dobra',
      icon: '⚡',
      category: 'skill',
      badgeColor: 'from-amber-500 to-yellow-600',
      tagline: 'Velocidade, Dicção & Articulação Extrema',
      description: 'Dobre a quantidade de sílabas por compasso com dicção cristalina e controle de fôlego.',
    },
    {
      id: 'punchline',
      name: 'Fábrica de Punchline',
      icon: '🥊',
      category: 'skill',
      badgeColor: 'from-red-500 to-rose-600',
      tagline: 'Setup, Conexão & Quebra de Expectativa',
      description: 'Construa desfechos destruidores com metáforas ricas, analogias de impacto e respostas rápidas.',
    },
    {
      id: 'encaixe_beat',
      name: 'Encaixe no Beat',
      icon: '🎯',
      category: 'skill',
      badgeColor: 'from-emerald-500 to-teal-600',
      tagline: 'Sincronização Rítmica & Kicks/Snares',
      description: 'Domine a cabeça do tempo, contratempo e faça as rimas caírem com precisão cirúrgica na caixa.',
    },
    {
      id: 'contagem_versos',
      name: 'Contagem de Versos',
      icon: '📐',
      category: 'skill',
      badgeColor: 'from-blue-500 to-indigo-600',
      tagline: 'Régua de 4 Compassos & Estrutura 1-2-3-PUNCH',
      description: 'Nunca se perca nos 16 tempos da quadra de batalha e prepare a entrada exata da punchline.',
    },
    {
      id: 'flow',
      name: 'Variação de Flow',
      icon: '🌊',
      category: 'skill',
      badgeColor: 'from-purple-500 to-violet-600',
      tagline: 'Levadas, Tercinas (Triplet) & Sincopado',
      description: 'Alterne levadas sem soar monótono e explore as cadências de Detroit, Drill, Trap e Boombap.',
    },
    {
      id: 'gastacao',
      name: 'Batalha de Gastação',
      icon: '🟢',
      category: 'vertente',
      badgeColor: 'from-lime-500 to-emerald-600',
      tagline: 'Humor, Ironia & Tiradas Cômicas',
      description: 'Ataque com tiradas inteligentes e sarcasmo elegante sem apelação pesada.',
    },
    {
      id: 'ideologica',
      name: 'Rima Ideológica',
      icon: '⚪️',
      category: 'vertente',
      badgeColor: 'from-sky-400 to-cyan-600',
      tagline: 'Filosofia, Visão Crítica & Cultura',
      description: 'Eleve a mensagem com metáforas sociais, argumentos de rua e vocabulário consciente.',
    },
    {
      id: 'all',
      name: 'Todas as Lições',
      icon: '🌐',
      category: 'all',
      badgeColor: 'from-neutral-600 to-neutral-800',
      tagline: 'Visão Geral & Catálogo Completo',
      description: 'Explore todo o currículo de rimas, métrica e improviso do RimaLab.',
    },
  ];

  // Active Subject Tab
  const [activeTabId, setActiveTabId] = useState<string>(
    initialSelectedTab || (activeFocusSkills.includes('speedflow') ? 'speedflow' : activeFocusSkills[0] || 'speedflow')
  );

  // Filter States (Idade, Objetivo, Beat)
  const [ageFilter, setAgeFilter] = useState<AgeFilterType>('todas');
  const [objectiveFilter, setObjectiveFilter] = useState<ObjectiveFilterType>('todos');
  const [beatFilter, setBeatFilter] = useState<BeatFilterType>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal to customize focus skills
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // Lesson Detail Modal
  const [selectedLessonModal, setSelectedLessonModal] = useState<Lesson | null>(null);

  // -------------------------------------------------------------
  // Interactive Tools State for Each Skill Tab
  // -------------------------------------------------------------

  // Speed Flow Lab State
  const [speedBpm, setSpeedBpm] = useState<number>(100);
  const [isSpeedMetronomePlaying, setIsSpeedMetronomePlaying] = useState<boolean>(false);
  const [speedTestSPS, setSpeedTestSPS] = useState<number>(5.2);
  const [selectedTongueTwisterIndex, setSelectedTongueTwisterIndex] = useState<number>(0);

  // Encaixe no Beat State
  const [beatSnapBpm, setBeatSnapBpm] = useState<number>(90);
  const [activeBeatStep, setActiveBeatStep] = useState<number>(1);
  const [isBeatPulseActive, setIsBeatPulseActive] = useState<boolean>(false);
  const [snapScoreFeedback, setSnapScoreFeedback] = useState<string | null>(null);

  // Contagem de Versos State
  const [verseBarIndex, setVerseBarIndex] = useState<number>(1);
  const [isVerseTimerRunning, setIsVerseTimerRunning] = useState<boolean>(false);
  const [quadraType, setQuadraType] = useState<'4x4' | '8x8' | 'sextilha'>('4x4');

  // Punchline Factory State
  const [punchCategory, setPunchCategory] = useState<'cultura_pop' | 'esportes' | 'ciencia' | 'rua'>('cultura_pop');
  const [generatedPunchSetup, setGeneratedPunchSetup] = useState<{
    setup1: string;
    setup2: string;
    setup3: string;
    punchline: string;
    explanation: string;
  }>({
    setup1: 'Ele se acha invencível no centro do octógono',
    setup2: 'Mas na primeira rima já entra em modo pânico',
    setup3: 'Pensa que é campeão ostentando esse cinturão',
    punchline: 'Mas eu sou o golpe de nocaute que te joga pelo chão!',
    explanation: 'A rima emparelhada quebra a soberba do adversário com metáfora de MMA.',
  });

  // Metronome Sound Generator via Web Audio API
  useEffect(() => {
    let interval: any = null;
    if (isSpeedMetronomePlaying) {
      const ms = (60 / speedBpm) * 1000;
      interval = setInterval(() => {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
          }
        } catch {}
      }, ms);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpeedMetronomePlaying, speedBpm]);

  // Beat Snap Loop Timer
  useEffect(() => {
    let interval: any = null;
    if (isBeatPulseActive) {
      const ms = (60 / beatSnapBpm) * 1000;
      interval = setInterval(() => {
        setActiveBeatStep((prev) => (prev % 4) + 1);
      }, ms);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBeatPulseActive, beatSnapBpm]);

  // Verse Counter Loop Timer (1 bar = 4 beats)
  useEffect(() => {
    let interval: any = null;
    if (isVerseTimerRunning) {
      interval = setInterval(() => {
        setVerseBarIndex((prev) => (prev % 4) + 1);
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVerseTimerRunning]);

  // Data: Tongue Twisters & Speedflow Drills
  const TONGUE_TWISTERS = [
    {
      level: 'Iniciante (4 síl/s)',
      title: 'Aceleração de Articulação Labial',
      text: 'O rato roeu a roupa do rei de Roma no ritmo reto do rap repentino.',
      targetBpm: 90,
      tip: 'Mantenha a ponta da língua firme nos dentes superiores e respire no final da frase.',
      ageMatch: ['kids', 'jovem', 'adulto', 'todas'],
      objectiveMatch: ['velocidade', 'flow', 'composicao', 'todos'],
    },
    {
      level: 'Intermediário (6 síl/s)',
      title: 'Dobra de Consoantes Oclusivas (P, T, K)',
      text: 'Três pratos de trigo para três tigres tristes rimando no tempo do trap com toque tático.',
      targetBpm: 120,
      tip: 'Use o diafragma para impulsionar o ar sem tensionar a garganta.',
      ageMatch: ['jovem', 'adulto', 'todas'],
      objectiveMatch: ['velocidade', 'batalha', 'flow', 'todos'],
    },
    {
      level: 'Avançado (8+ síl/s - Speed Monster)',
      title: 'Double Time Profissional de Batalha',
      text: 'Rapidamente disparo palavras pesadas no mic mantendo a levada no topo do verso sem nunca perder a passada!',
      targetBpm: 145,
      tip: 'Pronuncie cada sílaba como se fosse uma baqueta batendo no chimbal.',
      ageMatch: ['jovem', 'adulto', 'todas'],
      objectiveMatch: ['velocidade', 'batalha', 'todos'],
    },
  ];

  // Data: Punchline Examples Database
  const PUNCHLINE_DATABASE: Record<string, { setup1: string; setup2: string; setup3: string; punchline: string; explanation: string; ageGroup: string; objective: string }[]> = {
    cultura_pop: [
      {
        setup1: 'Você se acha o Thanos com a Manopla do Infinito',
        setup2: 'Falando que meu verso é fraco e esquisito',
        setup3: 'Mas esqueceu que o ego cega todo vilão',
        punchline: 'E com um estalar dos meus dedos desfaço sua reputação!',
        explanation: 'Analogia com os Vingadores: quebra o argumento arrogante de força absoluta.',
        ageGroup: 'todas',
        objective: 'batalha',
      },
      {
        setup1: 'Entrou na arena achando que era o Batman na cidade',
        setup2: 'Cheio de tecnologia mas sem criatividade',
        setup3: 'Na escuridão da noite você tenta se esconder',
        punchline: 'Mas eu sou o Coringa que faz o seu império arder!',
        explanation: 'Troca de papéis clássica com confronto de personagens icônicos.',
        ageGroup: 'todas',
        objective: 'batalha',
      },
    ],
    esportes: [
      {
        setup1: 'Você diz que tá na frente e joga como artilheiro',
        setup2: 'Mas na primeira dividida tropeça no terreiro',
        setup3: 'No minuto noventa o meu ataque é decisivo',
        punchline: 'Você pede falta pro juiz enquanto eu celebro o gol ao vivo!',
        explanation: 'Punchline de futebol com dinamismo e quebra de expectativa esportiva.',
        ageGroup: 'todas',
        objective: 'batalha',
      },
      {
        setup1: 'Fala de nocaute como se fosse o Tyson no ringue',
        setup2: 'Mas na hora da verdade sua rima só finge',
        setup3: 'Guardo a minha guarda e calculo cada passo',
        punchline: 'E quando eu solto o cruzado você cai no mesmo espaço!',
        explanation: 'Analogia de boxe: contra-ataque milimétrico.',
        ageGroup: 'adulto',
        objective: 'batalha',
      },
    ],
    ciencia: [
      {
        setup1: 'Diz que a sua lírica atrai como gravidade',
        setup2: 'Mas é só poeira espacial vagando sem claridade',
        setup3: 'Eu sou o buraco negro que distorce o seu tempo',
        punchline: 'E sugo toda a sua rima no primeiro movimento!',
        explanation: 'Punchline cósmica rica em vocabulário astronômico e duplo sentido.',
        ageGroup: 'jovem',
        objective: 'composicao',
      },
    ],
    rua: [
      {
        setup1: 'Veio de terno engravatado falar de favela e chão',
        setup2: 'Mas nunca sentiu na pele o peso de uma opressão',
        setup3: 'Minha rima não é produto de vitrine ou de cartaz',
        punchline: 'É o grito de quem resiste e não dá um passo pra trás!',
        explanation: 'Punchline ideológica de vivência de rua com forte peso moral.',
        ageGroup: 'adulto',
        objective: 'batalha',
      },
    ],
  };

  const handleGeneratePunch = (catKey: string) => {
    const list = PUNCHLINE_DATABASE[catKey] || PUNCHLINE_DATABASE.cultura_pop;
    const random = list[Math.floor(Math.random() * list.length)];
    setGeneratedPunchSetup(random);
    setPunchCategory(catKey as any);
  };

  // Toggle Skill Modal Handler
  const handleToggleSkill = (skillId: SkillFocusType) => {
    let updated: SkillFocusType[];
    if (activeFocusSkills.includes(skillId)) {
      if (activeFocusSkills.length <= 1) return;
      updated = activeFocusSkills.filter((s) => s !== skillId);
    } else {
      updated = [...activeFocusSkills, skillId];
    }
    onUpdateFocusSkills(updated, activeTrainingType);
  };

  // -------------------------------------------------------------
  // DYNAMIC FILTERING LOGIC: LESSONS & EXERCISES
  // -------------------------------------------------------------
  const filteredLessons = useMemo(() => {
    return LESSONS_DATA.filter((lesson) => {
      // 1. Filter by Skill Tab
      if (activeTabId !== 'all') {
        const skillMatchesCategory: Record<string, string[]> = {
          speedflow: ['Speed Flow', 'Métrica & Flow'],
          punchline: ['Punchlines', 'Batalhas & Improviso'],
          encaixe_beat: ['Encaixe no Beat', 'Fundamentos'],
          contagem_versos: ['Contagem de Versos', 'Métrica & Flow', 'Fundamentos'],
          flow: ['Métrica & Flow', 'Speed Flow'],
          gastacao: ['Gastação'],
          ideologica: ['Ideológica'],
        };

        const matchingCategories = skillMatchesCategory[activeTabId] || [];
        const isCategoryMatch = matchingCategories.includes(lesson.category);
        const isDirectSkillMatch = lesson.targetSkill === activeTabId;

        if (!isCategoryMatch && !isDirectSkillMatch) {
          return false;
        }
      }

      // 2. Filter by Age Group
      if (ageFilter !== 'todas') {
        if (lesson.targetAge && !lesson.targetAge.includes(ageFilter) && !lesson.targetAge.includes('todas')) {
          return false;
        }
      }

      // 3. Filter by Objective
      if (objectiveFilter !== 'todos') {
        if (lesson.targetObjective && !lesson.targetObjective.includes(objectiveFilter) && !lesson.targetObjective.includes('geral')) {
          return false;
        }
      }

      // 4. Filter by Beat Style
      if (beatFilter !== 'todos') {
        const beatKeywords: Record<BeatFilterType, string[]> = {
          todos: [],
          boombap: ['Boom Bap', '90s', 'Old School'],
          trap: ['Trap', '808', 'Atlanta'],
          detroit: ['Detroit', 'Michigan', 'Fast'],
          drill: ['Drill', 'UK Drill', 'Chicago'],
        };

        const targets = beatKeywords[beatFilter];
        const hasBeatMatch = lesson.recommendedBeatStyle?.some((b) =>
          b === 'Todos' || targets.some((t) => b.toLowerCase().includes(t.toLowerCase()))
        );
        if (lesson.recommendedBeatStyle && !hasBeatMatch) {
          return false;
        }
      }

      // 5. Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = lesson.title.toLowerCase().includes(q);
        const inDesc = lesson.description.toLowerCase().includes(q);
        const inTheory = lesson.theory.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inTheory) return false;
      }

      return true;
    });
  }, [activeTabId, ageFilter, objectiveFilter, beatFilter, searchQuery]);

  // Filtered Recommended Beats
  const filteredBeats = useMemo(() => {
    return PRESET_BEATS.filter((b) => {
      if (beatFilter === 'todos') return true;
      if (beatFilter === 'boombap') return b.style.toLowerCase().includes('boom') || b.bpm <= 95;
      if (beatFilter === 'trap') return b.style.toLowerCase().includes('trap') || b.bpm >= 125;
      if (beatFilter === 'detroit') return b.style.toLowerCase().includes('detroit') || (b.bpm >= 95 && b.bpm <= 105);
      if (beatFilter === 'drill') return b.style.toLowerCase().includes('drill') || b.bpm === 140;
      return true;
    });
  }, [beatFilter]);

  // Check if any filter is active
  const isAnyFilterActive = ageFilter !== 'todas' || objectiveFilter !== 'todos' || beatFilter !== 'todos' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setAgeFilter('todas');
    setObjectiveFilter('todos');
    setBeatFilter('todos');
    setSearchQuery('');
  };

  const activeSkillObj = ALL_SKILL_DEFINITIONS.find((s) => s.id === activeTabId) || ALL_SKILL_DEFINITIONS[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      
      {/* ========================================================================= */}
      {/* HEADER BANNER & SKILL PROFILE INTRO                                       */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900/90 via-neutral-950 to-neutral-900/70 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-400">
              <Zap className="h-3.5 w-3.5" />
              <span>LABORATÓRIO DE TRILHAS & HABILIDADES ESPECÍFICAS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Treinamento Direcionado por Assunto
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl">
              Filtre lições teóricas, metrônomos dinâmicos e exercícios práticos focados exatamente nas técnicas que você quer dominar no freestyle.
            </p>
          </div>

          {/* Quick Profile Summary & Customize Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCustomizeOpen(true)}
              className="flex items-center gap-2 rounded-2xl border border-neutral-700 bg-neutral-900/90 px-4 py-2.5 text-xs font-bold text-neutral-200 hover:border-amber-500/50 hover:bg-neutral-800 transition-all shadow-md"
            >
              <Sliders className="h-4 w-4 text-amber-400" />
              <span>Personalizar Meus Assuntos</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-black text-amber-400">
                {activeFocusSkills.length}
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOP SUBJECT SELECTOR PILLS (Speed Flow, Punchline, Encaixe, etc.)         */}
        {/* ========================================================================= */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>Selecione a Trilha / Assunto</span>
            </span>
            <span className="text-[11px] text-neutral-500 font-mono">
              Foco Atual: <strong className="text-amber-400">{activeSkillObj.name}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {ALL_SKILL_DEFINITIONS.map((skill) => {
              const isSelected = activeTabId === skill.id;
              const isUserEnrolled = skill.id === 'all' || activeFocusSkills.includes(skill.id as SkillFocusType) || activeTrainingType === skill.id;

              return (
                <button
                  key={skill.id}
                  onClick={() => setActiveTabId(skill.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 shadow-lg shadow-amber-500/20 scale-[1.03] z-10'
                      : isUserEnrolled
                      ? 'bg-neutral-900 text-neutral-200 border border-neutral-700 hover:border-amber-500/40 hover:bg-neutral-800'
                      : 'bg-neutral-950/60 text-neutral-400 border border-neutral-800/80 hover:text-neutral-200'
                  }`}
                >
                  <span className="text-sm">{skill.icon}</span>
                  <span>{skill.name}</span>
                  {isUserEnrolled && skill.id !== 'all' && (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-neutral-950' : 'bg-amber-400'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER CONTROLS BAR: IDADE, OBJETIVO, BEAT, BUSCA                         */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 text-xs font-black text-amber-400">
            <Filter className="h-4 w-4" />
            <span className="uppercase tracking-wider">Filtros de Personalização de Conteúdo</span>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar em lições e rimas..."
              className="w-full rounded-xl bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Selectors Grid: Idade, Objetivo, Beat */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-neutral-800/60">
          
          {/* 1. Idade / Faixa Etária */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-amber-400" />
              <span>Faixa Etária / Nível</span>
            </label>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value as AgeFilterType)}
              className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 font-semibold focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="todas">👥 Todas as Idades</option>
              <option value="kids">👶 Iniciante / Kids (Sub-16)</option>
              <option value="jovem">🔥 Jovem (16 a 24 anos)</option>
              <option value="adulto">🏆 Adulto / Avançado (25+)</option>
            </select>
          </div>

          {/* 2. Objetivo */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-red-400" />
              <span>Objetivo Principal</span>
            </label>
            <select
              value={objectiveFilter}
              onChange={(e) => setObjectiveFilter(e.target.value as ObjectiveFilterType)}
              className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 font-semibold focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="todos">🎯 Todos os Objetivos</option>
              <option value="batalha">🥊 Batalhas de MCs & Duelo</option>
              <option value="composicao">✍️ Composição de Rap / Letras</option>
              <option value="velocidade">⚡ Velocidade & Articulação</option>
              <option value="flow">🌊 Flow, Métrica & Levadas</option>
            </select>
          </div>

          {/* 3. Beat / Estilo Musical */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-neutral-400 flex items-center gap-1.5">
              <Music className="h-3.5 w-3.5 text-emerald-400" />
              <span>Estilo de Beat</span>
            </label>
            <select
              value={beatFilter}
              onChange={(e) => setBeatFilter(e.target.value as BeatFilterType)}
              className="w-full rounded-xl bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 font-semibold focus:border-amber-500 focus:outline-none cursor-pointer"
            >
              <option value="todos">🥁 Todos os Beats</option>
              <option value="boombap">📻 Boom Bap Clássico (85-95 BPM)</option>
              <option value="trap">🔥 Trap & 808 Pesado (120-140 BPM)</option>
              <option value="detroit">⚡ Detroit Fast Bounce (98-110 BPM)</option>
              <option value="drill">🌪️ Drill Sincopado (140 BPM)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Status / Summary Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/60 text-xs">
          <div className="flex items-center gap-2 flex-wrap text-neutral-400">
            <span>Mostrando:</span>
            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-md font-bold border border-amber-500/30">
              {activeSkillObj.icon} {activeSkillObj.name}
            </span>
            {ageFilter !== 'todas' && (
              <span className="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md font-semibold border border-neutral-700">
                Idade: {ageFilter}
              </span>
            )}
            {objectiveFilter !== 'todos' && (
              <span className="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md font-semibold border border-neutral-700">
                Objetivo: {objectiveFilter}
              </span>
            )}
            {beatFilter !== 'todos' && (
              <span className="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md font-semibold border border-neutral-700">
                Beat: {beatFilter}
              </span>
            )}
            <span className="text-neutral-500 font-mono">
              ({filteredLessons.length} {filteredLessons.length === 1 ? 'lição' : 'lições'} encontradas)
            </span>
          </div>

          {isAnyFilterActive && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 hover:underline font-bold"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SPECIALIZED INTERACTIVE DRILLS & TOOLS BY CHOSEN SUBJECT                   */}
      {/* ========================================================================= */}

      {/* 1. SPEED FLOW & DOBRA LAB */}
      {(activeTabId === 'speedflow' || activeTabId === 'all') && (
        <div className="rounded-3xl border border-amber-500/30 bg-neutral-900/90 p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-2xl shadow-lg">
                ⚡
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Laboratório de Speed Flow & Aceleração</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase">
                    Interativo
                  </span>
                </h2>
                <p className="text-xs text-neutral-400">
                  Dobre a velocidade de sílabas por compasso com metrônomo progressivo e trava-línguas adaptados.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSendToStudioWithSetup({
                beatStyle: 'Trap',
                bpm: speedBpm,
                prompt: `Treino de Speed Flow: "${TONGUE_TWISTERS[selectedTongueTwisterIndex].text}" em ${speedBpm} BPM`,
              })}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-black text-neutral-950 hover:brightness-110 shadow-lg shadow-amber-500/20"
            >
              <Mic className="h-4 w-4" />
              <span>Abrir Treino de Speed no Studio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Metrônomo Acelerador (7 cols) */}
            <div className="lg:col-span-7 rounded-2xl bg-neutral-950 p-5 border border-neutral-800 space-y-5">
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-neutral-400 font-semibold">Velocidade Atual do Metrônomo</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-amber-400 font-mono">{speedBpm}</span>
                    <span className="text-xs text-neutral-500 font-bold">BPM (Batidas por Minuto)</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsSpeedMetronomePlaying(!isSpeedMetronomePlaying)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                    isSpeedMetronomePlaying
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                      : 'bg-amber-500 text-neutral-950 hover:brightness-110 shadow-md'
                  }`}
                >
                  {isSpeedMetronomePlaying ? (
                    <>
                      <VolumeX className="h-4 w-4" />
                      <span>Pausar Click</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      <span>Iniciar Click</span>
                    </>
                  )}
                </button>
              </div>

              {/* Slider de BPM */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={80}
                  max={165}
                  step={5}
                  value={speedBpm}
                  onChange={(e) => setSpeedBpm(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span>80 BPM (Boom Bap Lento)</span>
                  <span>110 BPM (Dobra)</span>
                  <span>135 BPM (Trap Speed)</span>
                  <span>165 BPM (Monster Speed)</span>
                </div>
              </div>

              {/* Trava-línguas Dinâmicos */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <span className="text-xs font-bold text-neutral-300">Exercício de Articulação Selecionado:</span>
                
                <div className="flex gap-2">
                  {TONGUE_TWISTERS.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedTongueTwisterIndex(idx);
                        setSpeedBpm(t.targetBpm);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition-all ${
                        selectedTongueTwisterIndex === idx
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                      }`}
                    >
                      {t.level.split(' ')[0]}
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-2">
                  <p className="text-sm font-bold text-amber-200 leading-relaxed italic">
                    "{TONGUE_TWISTERS[selectedTongueTwisterIndex].text}"
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    💡 <strong className="text-neutral-300">Dica:</strong> {TONGUE_TWISTERS[selectedTongueTwisterIndex].tip}
                  </p>
                </div>
              </div>
            </div>

            {/* Medidor de Sílabas por Segundo & Dicas (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl bg-neutral-950 p-5 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-300">Diagnóstico de SPS (Sílabas/s)</span>
                  <span className="text-xs font-black text-amber-400 font-mono">{speedTestSPS.toFixed(1)} síl/s</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (speedTestSPS / 9) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Profissionais de batalha como <strong className="text-neutral-200">Guri, Kant e Krawk</strong> atingem entre <strong className="text-amber-400">6.5 e 8.8 sílabas/s</strong> mantendo a dicção 100% legível para os jurados.
                </p>
              </div>

              <div className="rounded-2xl bg-neutral-950 p-5 border border-neutral-800 space-y-2 text-xs text-neutral-300">
                <strong className="text-amber-400 font-bold block">3 Regras de Ouro do Speed Flow:</strong>
                <ul className="space-y-1.5 text-[11px] text-neutral-400 list-disc list-inside">
                  <li>Puxe ar no contratempo do 4º tempo antes de acelerar.</li>
                  <li>Exagere na articulação das consoantes labiais (P, B, M).</li>
                  <li>Nunca sacrifique a rima final para falar mais rápido.</li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. PUNCHLINE FACTORY LAB */}
      {(activeTabId === 'punchline' || activeTabId === 'all') && (
        <div className="rounded-3xl border border-red-500/30 bg-neutral-900/90 p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 text-2xl shadow-lg">
                🥊
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Fábrica de Punchline & Setup 1-2-3-PUNCH</span>
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase">
                    Estratégia de Batalha
                  </span>
                </h2>
                <p className="text-xs text-neutral-400">
                  Aprenda a construir a preparação perfeita nos 3 primeiros versos e desferir o golpe devastador no 4º verso.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSendToStudioWithSetup({
                beatStyle: 'Detroit',
                bpm: 98,
                prompt: `Treino de Punchline: Setup [${generatedPunchSetup.setup1}] + Punch [${generatedPunchSetup.punchline}]`,
              })}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-black text-white hover:brightness-110 shadow-lg shadow-red-500/20"
            >
              <Flame className="h-4 w-4" />
              <span>Rimar Esta Punchline no Studio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Gerador de Setup + Punchline (7 cols) */}
            <div className="lg:col-span-7 rounded-2xl bg-neutral-950 p-5 border border-neutral-800 space-y-4">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300">Escolha o Universo da Metáfora:</span>
                <div className="flex gap-1.5">
                  {[
                    { key: 'cultura_pop', label: '🎬 Pop & Filmes' },
                    { key: 'esportes', label: '⚽ Esportes' },
                    { key: 'ciencia', label: '🔬 Ciência' },
                    { key: 'rua', label: '🏙️ Vivência' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => handleGeneratePunch(cat.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        punchCategory === cat.key
                          ? 'bg-red-500 text-white shadow-md'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Breakdown of Quadra */}
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-[11px]">
                  <span className="text-neutral-400">Estrutura Clássica: 3 Versos de Setup + 1 Punchline</span>
                  <button
                    onClick={() => handleGeneratePunch(punchCategory)}
                    className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-bold"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Gerar Outra</span>
                  </button>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <p className="text-neutral-400"><strong className="text-neutral-500">1º Verso (Conexão):</strong> {generatedPunchSetup.setup1}</p>
                  <p className="text-neutral-400"><strong className="text-neutral-500">2º Verso (Expansão):</strong> {generatedPunchSetup.setup2}</p>
                  <p className="text-neutral-400"><strong className="text-neutral-500">3º Verso (Gancho):</strong> {generatedPunchSetup.setup3}</p>
                  <p className="text-red-400 font-bold text-sm pt-1.5 border-t border-neutral-800">
                    💥 4º Verso (PUNCHLINE): {generatedPunchSetup.punchline}
                  </p>
                </div>

                <div className="pt-2 text-[11px] text-neutral-400 border-t border-neutral-800/60">
                  <strong className="text-amber-400">Por que funciona:</strong> {generatedPunchSetup.explanation}
                </div>
              </div>

            </div>

            {/* Dicas dos Professores e Buffer Mental (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl bg-neutral-950 p-5 border border-neutral-800 space-y-4">
              <h3 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider text-red-400">
                <Brain className="h-4 w-4" />
                <span>O Segredo do "Buffer Mental"</span>
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Mestres de batalha nunca começam o 1º verso sem ter a palavra final do 4º verso cravada na mente.
              </p>
              
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                  <strong className="text-amber-400 block text-[11px]">Passo 1: Fixar o Golpe</strong>
                  <span>Escolha a palavra e a imagem de impacto (ex: "Castelo").</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                  <strong className="text-amber-400 block text-[11px]">Passo 2: Achar o Gancho</strong>
                  <span>Encontre a rima sonora rica (ex: "Singelo", "Martelo").</span>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
                  <strong className="text-amber-400 block text-[11px]">Passo 3: Construir de Trás pra Frente</strong>
                  <span>Fale os versos 1, 2 e 3 enquanto o cérebro prepara a caixa do verso 4!</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. ENCAIXE NO BEAT LAB */}
      {(activeTabId === 'encaixe_beat' || activeTabId === 'all') && (
        <div className="rounded-3xl border border-emerald-500/30 bg-neutral-900/90 p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-2xl shadow-lg">
                🎯
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Encaixe no Beat: O Casamento do Kick com a Caixa</span>
                </h2>
                <p className="text-xs text-neutral-400">
                  Aprenda a cravar a rima final exatamente na caixa (tempos 2 e 4) sem adiantar nem atrasar.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSendToStudioWithSetup({
                beatStyle: 'Boom Bap',
                bpm: 90,
                prompt: 'Treino de Encaixe no Beat: Bumbo no tempo 1/3 e Caixa cravada no 2/4',
              })}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-black text-neutral-950 hover:brightness-110 shadow-lg shadow-emerald-500/20"
            >
              <Target className="h-4 w-4" />
              <span>Praticar Encaixe no Studio</span>
            </button>
          </div>

          {/* Grid 4 Tempos Interativo */}
          <div className="rounded-2xl bg-neutral-950 p-6 border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300">Grid de Compasso 4/4 em Tempo Real:</span>
              <button
                onClick={() => setIsBeatPulseActive(!isBeatPulseActive)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  isBeatPulseActive ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500 text-neutral-950'
                }`}
              >
                {isBeatPulseActive ? 'Parar Pulso' : 'Ativar Pulso Visual'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { step: 1, name: 'BUMBO (Kick)', role: 'Entrada da Frase', isSnare: false },
                { step: 2, name: 'CAIXA (Snare)', role: 'Conexão / Respiração', isSnare: true },
                { step: 3, name: 'BUMBO (Kick)', role: 'Desenvolvimento', isSnare: false },
                { step: 4, name: 'CAIXA (Snare)', role: '💥 RIMA OU PUNCHLINE', isSnare: true },
              ].map((beat) => {
                const isActive = activeBeatStep === beat.step;
                return (
                  <div
                    key={beat.step}
                    className={`p-4 rounded-2xl border text-center transition-all duration-100 ${
                      isActive
                        ? beat.isSnare
                          ? 'bg-emerald-500 text-neutral-950 border-emerald-400 scale-105 shadow-lg shadow-emerald-500/30'
                          : 'bg-amber-500 text-neutral-950 border-amber-400 scale-105 shadow-lg shadow-amber-500/30'
                        : 'bg-neutral-900/80 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <span className="text-xs font-black font-mono block">TEMPO {beat.step}</span>
                    <strong className="text-sm font-black block mt-1">{beat.name}</strong>
                    <span className="text-[10px] opacity-80 mt-1 block">{beat.role}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FILTERED LESSONS & COURSES CATALOGUE                                      */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-400" />
              <span>Lições Teóricas & Exercícios Filtrados</span>
            </h2>
            <p className="text-xs text-neutral-400">
              Aulas selecionadas de acordo com a trilha ({activeSkillObj.name}) e filtros aplicados.
            </p>
          </div>

          <span className="text-xs font-bold text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-800">
            {filteredLessons.length} {filteredLessons.length === 1 ? 'Lição Disponível' : 'Lições Disponíveis'}
          </span>
        </div>

        {filteredLessons.length === 0 ? (
          <div className="p-12 text-center rounded-3xl border border-dashed border-neutral-800 bg-neutral-900/50 space-y-3">
            <Sparkles className="h-8 w-8 text-amber-400 mx-auto opacity-50" />
            <h3 className="text-base font-bold text-white">Nenhuma lição encontrada para esses filtros</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Tente redefinir os filtros de idade, objetivo ou beat para visualizar o catálogo completo.
            </p>
            <button
              onClick={handleResetFilters}
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-neutral-950 hover:brightness-110"
            >
              Restaurar Todos os Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex flex-col justify-between rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 sm:p-6 hover:border-neutral-700 transition-all shadow-xl group hover:shadow-2xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                      {lesson.category}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{lesson.durationMinutes} min</span>
                      <span className="text-amber-400 font-bold font-mono">+{lesson.xpReward} XP</span>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                    {lesson.title}
                  </h3>

                  <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">
                    {lesson.description}
                  </p>

                  {/* Words / Focus Tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {lesson.exerciseWords.map((w, i) => (
                      <span key={i} className="text-[10px] bg-neutral-950 text-neutral-300 px-2 py-0.5 rounded-md border border-neutral-800 font-mono">
                        #{w}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-neutral-800/80 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedLessonModal(lesson)}
                    className="flex-1 rounded-xl bg-neutral-800 py-2.5 text-xs font-bold text-neutral-200 hover:bg-neutral-700 hover:text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                    <span>Estudar Aula</span>
                  </button>

                  <button
                    onClick={() => onSendToStudioWithSetup({
                      prompt: `Exercício da Lição [${lesson.title}]: ${lesson.exercisePrompt}`,
                      beatStyle: lesson.recommendedBeatStyle?.[0] || 'Boom Bap',
                    })}
                    className="flex items-center justify-center rounded-xl bg-amber-500 p-2.5 text-neutral-950 hover:brightness-110 shadow-md"
                    title="Praticar no Studio"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* RECOMMENDED BEATS FOR CHOSEN TRACK & FILTER                               */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Music className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Beats Recomendados para o Treino</h3>
              <p className="text-xs text-neutral-400">Instrumentais compatíveis com a velocidade e estilo selecionado</p>
            </div>
          </div>

          <span className="text-xs text-neutral-500 font-mono">
            {filteredBeats.length} beats disponíveis
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {filteredBeats.slice(0, 4).map((beat) => (
            <div
              key={beat.id}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between space-y-3 hover:border-amber-500/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="font-bold text-amber-400">{beat.style}</span>
                  <span className="font-mono">{beat.bpm} BPM</span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">{beat.title}</h4>
                <p className="text-[11px] text-neutral-500">Por {beat.producer}</p>
              </div>

              <button
                onClick={() => onSendToStudioWithSetup({
                  beatStyle: beat.style,
                  bpm: beat.bpm,
                  prompt: `Treino de Rima Livre com o Beat ${beat.title} (${beat.bpm} BPM)`,
                })}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2 text-xs font-bold text-neutral-300 hover:bg-amber-500 hover:text-neutral-950 transition-all border border-neutral-800"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Rimar com este Beat</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CUSTOMIZAR ASSUNTOS E HABILIDADES ATIVAS                           */}
      {/* ========================================================================= */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Personalizar Meus Assuntos</h3>
                <p className="text-xs text-neutral-400">
                  Marque o que deseja aprender para personalizar sua experiência
                </p>
              </div>
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {[
                { id: 'speedflow' as SkillFocusType, label: '⚡ Speed Flow & Dobra de Sílabas', desc: 'Aulas de dicção, velocímetro e double time' },
                { id: 'punchline' as SkillFocusType, label: '🥊 Fábrica de Punchlines', desc: 'Metáforas, quebra de expectativa e golpe final' },
                { id: 'encaixe_beat' as SkillFocusType, label: '🎯 Encaixar no Beat & Timing', desc: 'Sincronização com bumbos, caixas e contratempo' },
                { id: 'contagem_versos' as SkillFocusType, label: '📐 Contagem de Versos (4 Compassos)', desc: 'Régua de 16 tempos e entrada da punchline' },
                { id: 'flow' as SkillFocusType, label: '🌊 Variações de Flow & Levadas', desc: 'Triplet, Detroit sincopado e troca de marcha' },
              ].map((skill) => {
                const isChecked = activeFocusSkills.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => handleToggleSkill(skill.id)}
                    className={`w-full flex items-start justify-between p-3.5 rounded-2xl border text-left transition-all ${
                      isChecked
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-sm'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <div>
                      <strong className={`text-xs block ${isChecked ? 'text-amber-300' : 'text-neutral-300'}`}>
                        {skill.label}
                      </strong>
                      <span className="text-[11px] text-neutral-500">{skill.desc}</span>
                    </div>

                    <span className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs font-bold ${
                      isChecked ? 'bg-amber-500 text-neutral-950 border-amber-500' : 'border-neutral-700 text-transparent'
                    }`}>
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setIsCustomizeOpen(false);
                confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
              }}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-black text-neutral-950 hover:brightness-110 shadow-lg shadow-amber-500/20"
            >
              Salvar Assuntos & Atualizar Conteúdo
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISUALIZAR LIÇÃO COMPLETA                                          */}
      {/* ========================================================================= */}
      {selectedLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-neutral-800 bg-neutral-900 p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-400">
                  {selectedLessonModal.category} • {selectedLessonModal.difficulty}
                </span>
                <h3 className="text-xl font-black text-white mt-2">
                  {selectedLessonModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLessonModal(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Theory */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
              <strong className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                📖 Teoria & Fundamento:
              </strong>
              <p className="text-xs text-neutral-300 whitespace-pre-line leading-relaxed">
                {selectedLessonModal.theory}
              </p>
            </div>

            {/* Example Lyrics */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
              <strong className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                🎙️ Exemplo Prático:
              </strong>
              <div className="space-y-1 font-mono text-xs text-neutral-300">
                {selectedLessonModal.exampleLyrics.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>

            {/* Teacher Tips */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
              <strong className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                💡 Dicas dos Professores:
              </strong>
              <ul className="list-disc list-inside space-y-1 text-xs text-neutral-300">
                {selectedLessonModal.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>

            {/* Exercise Action */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <strong className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                🎯 Desafio Prático da Aula:
              </strong>
              <p className="text-xs text-neutral-200 font-semibold">
                {selectedLessonModal.exercisePrompt}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedLessonModal.exerciseWords.map((w, idx) => (
                  <span key={idx} className="text-xs bg-neutral-950 text-amber-300 px-2.5 py-1 rounded-lg border border-neutral-800 font-mono font-bold">
                    {w}
                  </span>
                ))}
              </div>

              <button
                onClick={() => {
                  onSendToStudioWithSetup({
                    prompt: `Exercício da Aula [${selectedLessonModal.title}]: ${selectedLessonModal.exercisePrompt}`,
                    beatStyle: selectedLessonModal.recommendedBeatStyle?.[0] || 'Boom Bap',
                  });
                  setSelectedLessonModal(null);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-black text-neutral-950 hover:brightness-110 shadow-lg shadow-amber-500/20"
              >
                <Play className="h-4 w-4" />
                <span>Praticar Este Exercício no Studio com Beat</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
