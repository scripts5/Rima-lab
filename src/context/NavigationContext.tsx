import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { UserProfile } from '../types';

export type NavTabId = 
  | 'onboarding' 
  | 'tracks' 
  | 'studio' 
  | 'bot' 
  | 'calls' 
  | 'lessons' 
  | 'challenges' 
  | 'achievements' 
  | 'leaderboard' 
  | 'suggestions' 
  | 'profile';

export type ChannelType = 'text' | 'voice' | 'stage' | 'forum';

export interface DiscordChannel {
  id: string;
  name: string; // e.g. "🎯-trilha-punchline"
  tabId: NavTabId;
  skillTrackId?: string; // e.g. "punchline", "speedflow", "flow", "gastacao"
  description: string;
  type: ChannelType;
  badge?: string;
  isLive?: boolean;
}

export interface DiscordCategory {
  id: string;
  name: string; // e.g. "🥊 PUNCHLINES & ATAQUE"
  shortName: string;
  emoji: string;
  keywords: string[]; // matched against user's selectedCategories from onboarding
  channels: DiscordChannel[];
  description: string;
  accentColor: string; // Tailwind color classes
}

// Master Discord Server Categories Definition for RimaLab
export const ALL_DISCORD_CATEGORIES: DiscordCategory[] = [
  {
    id: 'cat_punchlines',
    name: '🥊 PUNCHLINES & ATAQUE',
    shortName: 'Punchlines',
    emoji: '🥊',
    accentColor: 'border-red-500/40 text-red-400 bg-red-500/10',
    keywords: ['punchlines', 'punchline', 'sangue', 'batalha', 'ataque', 'resposta'],
    description: 'Técnicas de impacto, rimas de sangue, contra-ataque e estruturação de 4 compassos',
    channels: [
      {
        id: 'ch_punch_track',
        name: '🎯-trilha-punchlines',
        tabId: 'tracks',
        skillTrackId: 'punchline',
        description: 'Trilha completa de Punchline, estruturação de rima e impacto',
        type: 'text',
        badge: 'Treino',
      },
      {
        id: 'ch_punch_studio',
        name: '🎙️-estúdio-de-ataque',
        tabId: 'studio',
        skillTrackId: 'punchline',
        description: 'Grave e analise a força das suas punchlines com IA',
        type: 'text',
      },
      {
        id: 'ch_punch_challenges',
        name: '⚡-desafios-4-compassos',
        tabId: 'challenges',
        skillTrackId: 'punchline',
        description: 'Desafios de improviso de sangue e finalizações',
        type: 'text',
      },
      {
        id: 'ch_punch_arena',
        name: '⚔️-arena-batalha-sangue',
        tabId: 'tracks',
        skillTrackId: 'punchline',
        description: 'Simulações de rounds de batalha 1x1 e 2x2',
        type: 'text',
      },
    ],
  },
  {
    id: 'cat_speedflow',
    name: '⚡ SPEED FLOW & DOUBLE TIME',
    shortName: 'Speed Flow',
    emoji: '⚡',
    accentColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    keywords: ['speed flow', 'speedflow', 'double time', 'velocidade', 'dicção', 'metrônomo'],
    description: 'Velocidade de dicção, métricas rápidas, subdivisões e articulação vocal',
    channels: [
      {
        id: 'ch_speed_track',
        name: '🎯-trilha-speedflow',
        tabId: 'tracks',
        skillTrackId: 'speedflow',
        description: 'Exercícios de dicção, aceleração progressiva e double time',
        type: 'text',
        badge: 'Popular',
      },
      {
        id: 'ch_speed_challenges',
        name: '⚡-desafios-contra-o-tempo',
        tabId: 'challenges',
        skillTrackId: 'speedflow',
        description: 'Desafios cronometrados com aumento gradual de BPM',
        type: 'text',
      },
      {
        id: 'ch_speed_bot',
        name: '🎧-metrônomo-e-beats-rápidos',
        tabId: 'bot',
        skillTrackId: 'speedflow',
        description: 'Bot de beats com BPM acelerado para treino de velocidade',
        type: 'text',
      },
    ],
  },
  {
    id: 'cat_metrica_flow',
    name: '📐 MÉTRICA, FLOW & ENCAIXE',
    shortName: 'Métrica & Flow',
    emoji: '📐',
    accentColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    keywords: ['métrica & flow', 'metrica', 'flow', 'encaixe no beat', 'contagem de versos', 'beats & métrica', '4/4'],
    description: 'Encaixe no compasso 4/4, variações rítmicas, síncopas e contagem de sílabas poéticas',
    channels: [
      {
        id: 'ch_metrica_track',
        name: '🎯-trilha-encaixe-no-beat',
        tabId: 'tracks',
        skillTrackId: 'encaixe_beat',
        description: 'Aprenda a cair sempre no tempo 1 e 3 do compasso',
        type: 'text',
      },
      {
        id: 'ch_contagem_track',
        name: '📐-trilha-contagem-de-versos',
        tabId: 'tracks',
        skillTrackId: 'contagem_versos',
        description: 'Controle exato de 4 compassos para nunca perder a rima',
        type: 'text',
      },
      {
        id: 'ch_flow_track',
        name: '🌊-trilha-flow-e-estilos',
        tabId: 'tracks',
        skillTrackId: 'flow',
        description: 'Variações melódicas, pausas dramáticas e cadência',
        type: 'text',
      },
      {
        id: 'ch_beats_bot',
        name: '🎧-bot-de-beats-4-4',
        tabId: 'bot',
        description: 'Simulador musical de BPM com marcação visual de compasso',
        type: 'text',
      },
    ],
  },
  {
    id: 'cat_batalhas_arena',
    name: '⚔️ BATALHAS & IMPROVISO',
    shortName: 'Batalhas',
    emoji: '⚔️',
    accentColor: 'border-orange-500/40 text-orange-400 bg-orange-500/10',
    keywords: ['batalhas & improviso', 'batalha', 'improviso', 'arena', 'duelo', 'conhecimento', 'sangue'],
    description: 'Dinâmicas de batalha de rima, ataque, resposta, presença de palco e postura',
    channels: [
      {
        id: 'ch_arena_studio',
        name: '🎙️-arena-de-improviso',
        tabId: 'studio',
        description: 'Grave rounds completos de batalha com contagem regressiva',
        type: 'text',
      },
      {
        id: 'ch_arena_calls',
        name: '📹-calls-ao-vivo-professores',
        tabId: 'calls',
        description: 'Participe das rodas de rima ao vivo com Kowalski e Luquita',
        type: 'voice',
        isLive: true,
      },
      {
        id: 'ch_arena_leaderboard',
        name: '🥇-ranking-de-batalhas',
        tabId: 'leaderboard',
        description: 'Tabela de classificação dos MCs mais ativos do servidor',
        type: 'text',
      },
    ],
  },
  {
    id: 'cat_estilos_trap_drill',
    name: '🔥 DRILL, TRAP & DETROIT',
    shortName: 'Drill & Trap',
    emoji: '🔥',
    accentColor: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    keywords: ['drill', 'trap & 808', 'trap', 'detroit', '808', 'boom bap', 'grime'],
    description: 'Estilos modernos da cena: métricas fora do grid de Detroit, 808 slides e agressividade de Drill',
    channels: [
      {
        id: 'ch_trap_studio',
        name: '🎙️-studio-drill-e-trap',
        tabId: 'studio',
        description: 'Grave com beats pesados de Drill UK e Detroit Michigan',
        type: 'text',
      },
      {
        id: 'ch_trap_beats',
        name: '🎧-beats-trap-e-detroit',
        tabId: 'bot',
        description: 'Carregue beats com 808 afinados e hi-hats acelerados',
        type: 'text',
      },
      {
        id: 'ch_trap_tracks',
        name: '🎯-trilha-flow-moderno',
        tabId: 'tracks',
        skillTrackId: 'flow',
        description: 'Técnicas de métricas quebradas e flows contemporâneos',
        type: 'text',
      },
    ],
  },
  {
    id: 'cat_ideologica_poesia',
    name: '💡 IDEOLÓGICA & POESIA DE RUA',
    shortName: 'Ideológica',
    emoji: '💡',
    accentColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    keywords: ['ideológica', 'ideologica', 'poesia de rua', 'poesia', 'conhecimento', 'consciente', 'visão'],
    description: 'Mensagem consciente, rimas de conhecimento, metáforas profundas e história da cultura Hip-Hop',
    channels: [
      {
        id: 'ch_ideol_track',
        name: '🎯-trilha-rima-ideológica',
        tabId: 'tracks',
        skillTrackId: 'ideologica',
        description: 'Construção de argumento, storytelling e metáforas ricas',
        type: 'text',
      },
      {
        id: 'ch_ideol_lessons',
        name: '📚-academia-historia-hiphop',
        tabId: 'lessons',
        description: 'Aulas sobre a cultura Hip Hop, 5 elementos e filosofia',
        type: 'text',
      },
      {
        id: 'ch_ideol_suggestions',
        name: '💡-sugestoes-e-debates',
        tabId: 'suggestions',
        description: 'Sugira novos temas e debates para a comunidade',
        type: 'forum',
      },
    ],
  },
  {
    id: 'cat_gastacao_humor',
    name: '🟢 GASTAÇÃO & HUMOR',
    shortName: 'Gastação',
    emoji: '🟢',
    accentColor: 'border-lime-500/40 text-lime-400 bg-lime-500/10',
    keywords: ['gastação', 'gastacao', 'humor & rima', 'humor', 'tirada', 'trocadilho', 'deboche'],
    description: 'Trocadilhos inteligentes, rimas de humor, ironia e punchlines descontraídas',
    channels: [
      {
        id: 'ch_gasta_track',
        name: '🎯-trilha-gastação-e-humor',
        tabId: 'tracks',
        skillTrackId: 'gastacao',
        description: 'Técnicas de sarcasmo, ritmo cômico e trocadilhos sonoros',
        type: 'text',
      },
      {
        id: 'ch_gasta_studio',
        name: '🎙️-estúdio-de-trocadilhos',
        tabId: 'studio',
        skillTrackId: 'gastacao',
        description: 'Pratique punchlines bem-humoradas no microfone',
        type: 'text',
      },
      {
        id: 'ch_gasta_challenges',
        name: '⚡-desafios-de-gastação',
        tabId: 'challenges',
        skillTrackId: 'gastacao',
        description: 'Rime com objetos inusitados em tempo recorde',
        type: 'text',
      },
    ],
  },
  {
    id: 'cat_fundamentos_iniciante',
    name: '📜 FUNDAMENTOS & PRIMEIRAS RIMAS',
    shortName: 'Fundamentos',
    emoji: '📜',
    accentColor: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
    keywords: ['fundamentos', 'primeiras rimas', 'iniciante', 'composição', 'básico'],
    description: 'O início de tudo: fonemas, rimas perfeitas, esquema AABB e perda do medo de improvisar',
    channels: [
      {
        id: 'ch_fund_lessons',
        name: '📚-academia-fundamentos',
        tabId: 'lessons',
        description: 'Videoaulas e lições interativas passo a passo',
        type: 'text',
      },
      {
        id: 'ch_fund_tracks',
        name: '🎯-trilha-primeiras-rimas',
        tabId: 'tracks',
        skillTrackId: 'contagem_versos',
        description: 'Exercícios guiados para destravar a fala no beat',
        type: 'text',
      },
      {
        id: 'ch_fund_onboarding',
        name: '🏠-painel-inicial-cargos',
        tabId: 'onboarding',
        description: 'Configuração do seu perfil de MC e seleção de estilo',
        type: 'text',
      },
    ],
  },
  {
    id: 'cat_comunidade_geral',
    name: '🏆 COMUNIDADE & EVOLUÇÃO',
    shortName: 'Geral',
    emoji: '🏆',
    accentColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
    keywords: ['comunidade', 'geral', 'ranking', 'conquistas', 'perfil', 'sugestões', 'inicio'],
    description: 'Acompanhe seu nível, medalhas desbloqueadas, ranking e sugira ideias para o RimaLab',
    channels: [
      {
        id: 'ch_geral_profile',
        name: '📊-meu-perfil-de-mc',
        tabId: 'profile',
        description: 'Estatísticas de treino, nível de XP e bio',
        type: 'text',
      },
      {
        id: 'ch_geral_achievements',
        name: '🏆-conquistas-e-medalhas',
        tabId: 'achievements',
        description: 'Badges e troféus conquistados nas sessões',
        type: 'text',
      },
      {
        id: 'ch_geral_leaderboard',
        name: '🥇-ranking-geral-mcs',
        tabId: 'leaderboard',
        description: 'Top MCs do RimaLab por pontuação',
        type: 'text',
      },
      {
        id: 'ch_geral_suggestions',
        name: '💡-sugestões-da-comunidade',
        tabId: 'suggestions',
        description: 'Painel para sugerir melhorias, beats e temas',
        type: 'forum',
      },
    ],
  },
];

interface NavigationContextType {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  selectedCategories: string[];
  activeRoles: string[];
  
  // Discord-style Category Architecture
  discordCategories: DiscordCategory[];
  activeDiscordCategory: DiscordCategory | null;
  activeDiscordCategoryIndex: number;
  setActiveDiscordCategoryId: (categoryId: string) => void;
  openChannel: (channel: DiscordChannel) => void;
  activeChannelId: string | null;
  
  // Collapsed categories state (like Discord: collapse/expand)
  collapsedCategories: Record<string, boolean>;
  toggleCategoryCollapse: (categoryId: string) => void;
  
  // Filter stats
  filterStats: {
    totalCategories: number;
    unlockedCategoriesCount: number;
    totalChannels: number;
    unlockedChannelsCount: number;
  };

  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onSelectSkillTrack?: (skillId: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: React.ReactNode;
  profile: UserProfile | null;
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onSelectSkillTrack?: (skillId: string) => void;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  profile,
  activeTab,
  setActiveTab,
  selectedCategory,
  setSelectedCategory,
  onSelectSkillTrack,
}) => {
  // Extract user's selected categories from profile or fallback to defaults
  const userSelectedCategories = useMemo<string[]>(() => {
    if (profile?.selectedCategories && profile.selectedCategories.length > 0) {
      return profile.selectedCategories;
    }
    return ['Punchlines', 'Speed Flow', 'Batalhas & Improviso', 'Métrica & Flow', 'Drill'];
  }, [profile?.selectedCategories]);

  // Extract roles
  const activeRoles = useMemo<string[]>(() => {
    if (profile?.roles && profile.roles.length > 0) {
      return profile.roles;
    }
    return ['⚔️ MC de Batalha (Sangue)', '⚡ Speed Flow Master'];
  }, [profile?.roles]);

  // Filter Discord Categories dynamically based strictly on user's selectedCategories from onboarding
  const discordCategories = useMemo<DiscordCategory[]>(() => {
    const normalizedUserCats = userSelectedCategories.map(c => c.toLowerCase().trim());

    return ALL_DISCORD_CATEGORIES.filter(cat => {
      // Community & Evolution is always available as general utility
      if (cat.id === 'cat_comunidade_geral') return true;

      // Match category keywords against user's chosen categories
      return cat.keywords.some(kw => {
        const kwLower = kw.toLowerCase().trim();
        return normalizedUserCats.some(userCat => {
          return userCat.includes(kwLower) || kwLower.includes(userCat);
        });
      });
    });
  }, [userSelectedCategories]);

  // Collapsed state for categories (like Discord)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Active Discord Category
  const [activeCategoryId, setActiveCategoryId] = useState<string>(() => {
    return discordCategories[0]?.id || 'cat_punchlines';
  });

  // Ensure active category is always valid
  useEffect(() => {
    if (discordCategories.length > 0 && !discordCategories.some(c => c.id === activeCategoryId)) {
      setActiveCategoryId(discordCategories[0].id);
    }
  }, [discordCategories, activeCategoryId]);

  const activeDiscordCategory = useMemo(() => {
    return discordCategories.find(c => c.id === activeCategoryId) || discordCategories[0] || null;
  }, [discordCategories, activeCategoryId]);

  const activeDiscordCategoryIndex = useMemo(() => {
    return discordCategories.findIndex(c => c.id === activeCategoryId);
  }, [discordCategories, activeCategoryId]);

  // Track currently active channel
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  // Function to open a channel inside a Discord category
  const openChannel = (channel: DiscordChannel) => {
    setActiveChannelId(channel.id);
    setActiveTab(channel.tabId);
    if (channel.skillTrackId && onSelectSkillTrack) {
      onSelectSkillTrack(channel.skillTrackId);
    }
    // Update active category
    const parentCategory = discordCategories.find(cat => 
      cat.channels.some(ch => ch.id === channel.id)
    );
    if (parentCategory) {
      setActiveCategoryId(parentCategory.id);
      setSelectedCategory(parentCategory.shortName);
    }
  };

  const totalChannelsCount = useMemo(() => {
    return ALL_DISCORD_CATEGORIES.reduce((acc, cat) => acc + cat.channels.length, 0);
  }, []);

  const unlockedChannelsCount = useMemo(() => {
    return discordCategories.reduce((acc, cat) => acc + cat.channels.length, 0);
  }, [discordCategories]);

  const value: NavigationContextType = {
    activeTab,
    setActiveTab,
    selectedCategories: userSelectedCategories,
    activeRoles,
    discordCategories,
    activeDiscordCategory,
    activeDiscordCategoryIndex,
    setActiveDiscordCategoryId: setActiveCategoryId,
    openChannel,
    activeChannelId,
    collapsedCategories,
    toggleCategoryCollapse,
    filterStats: {
      totalCategories: ALL_DISCORD_CATEGORIES.length,
      unlockedCategoriesCount: discordCategories.length,
      totalChannels: totalChannelsCount,
      unlockedChannelsCount: unlockedChannelsCount,
    },
    selectedCategory,
    setSelectedCategory,
    onSelectSkillTrack,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
