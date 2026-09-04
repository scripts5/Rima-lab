import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { UserProfile } from '../types';

export type NavTabId = 
  | 'onboarding' 
  | 'tracks' 
  | 'studio' 
  | 'ofensiva'
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
  isCallActive?: boolean;
  userCount?: number;
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

// Master Discord Server Categories Definition for 🎤 Academia de Rimas
export const ALL_DISCORD_CATEGORIES: DiscordCategory[] = [
  {
    id: 'cat_salas_pratica',
    name: '🔊 Salas de Prática',
    shortName: 'Salas de Prática',
    emoji: '🔊',
    accentColor: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
    keywords: ['prática', 'pratica', 'freestyle', 'estúdio', 'studio', 'beat', 'vocal', 'livre'],
    description: 'Canais de prática de rimas ao vivo, estúdio virtual e trocas de áudio',
    channels: [
      {
        id: 'ch_pratica_livre_1',
        name: '👥 Prática Livre 1',
        tabId: 'calls',
        description: 'Sala de voz de prática livre e improviso aberto entre MCs',
        type: 'voice',
        badge: 'Ao Vivo',
      },
      {
        id: 'ch_pratica_livre_2',
        name: '👥 Prática Livre 2',
        tabId: 'calls',
        description: 'Sala de voz secundária para rimas livres',
        type: 'voice',
      },
      {
        id: 'ch_pratica_livre_3',
        name: '👥 Prática Livre 3',
        tabId: 'calls',
        description: 'Sala de voz para treino livre em grupos',
        type: 'voice',
      },
      {
        id: 'ch_studio_virtual',
        name: '👥 Studio Virtual',
        tabId: 'studio',
        description: 'Gravação e mixagem de improviso com instrumental',
        type: 'voice',
      },
      {
        id: 'ch_freestyle_24h',
        name: '👥 Freestyle 24h',
        tabId: 'calls',
        description: 'Canal de voz aberto 24 horas para treinar rima a qualquer momento',
        type: 'voice',
        badge: '24h',
      },
      {
        id: 'ch_dicas_pratica',
        name: '🎤 dicas-prática',
        tabId: 'lessons',
        description: 'Dicas práticas de improviso, dicção e postura',
        type: 'text',
      },
      {
        id: 'ch_beat_discussion',
        name: '🎵 beat-discussion',
        tabId: 'bot',
        description: 'Discussão e escolha de instrumentais para treinar',
        type: 'text',
      },
      {
        id: 'ch_composicao',
        name: '📝 composição',
        tabId: 'tracks',
        description: 'Estruturação de versos, compassos e temas de rima',
        type: 'text',
      },
      {
        id: 'ch_audio_feedback',
        name: '🔊 áudio-feedback',
        tabId: 'studio',
        description: 'Envie suas rimas gravadas para análise da IA e dos professores',
        type: 'text',
      },
      {
        id: 'ch_tecnica_vocal',
        name: '🎚️ técnica-vocal',
        tabId: 'lessons',
        description: 'Aquecimento vocal, respiração e projeção de voz',
        type: 'text',
      },
    ],
  },
  {
    id: 'cat_call_iniciante',
    name: '🎤 Call Aulas - Iniciante',
    shortName: 'Iniciante',
    emoji: '🎤',
    accentColor: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',
    keywords: ['iniciante', 'fundamentos', 'primeiras rimas', 'básico', 'aula iniciante', 'workshop'],
    description: 'Aulas fundamentais, tira-dúvidas e mentorias para quem está começando',
    channels: [
      {
        id: 'ch_aula_ini_1',
        name: '👥 Aula Iniciante 1',
        tabId: 'calls',
        description: 'Transmissão ao vivo de aula básica com os professores',
        type: 'voice',
        badge: 'Aula',
      },
      {
        id: 'ch_aula_ini_2',
        name: '👥 Aula Iniciante 2',
        tabId: 'calls',
        description: 'Sala complementar de aula para iniciantes',
        type: 'voice',
      },
      {
        id: 'ch_mentoria_1_1',
        name: '👥 Mentoria Um-a-Um',
        tabId: 'calls',
        description: 'Atendimento individual de mentoria com os professores',
        type: 'voice',
        badge: 'VIP',
      },
      {
        id: 'ch_workshop_ini',
        name: '👥 Workshop Iniciante',
        tabId: 'lessons',
        description: 'Workshops práticos de rima e ritmo',
        type: 'voice',
      },
      {
        id: 'ch_pratica_guiada',
        name: '👥 Prática Guiada',
        tabId: 'tracks',
        description: 'Treino assistido passo a passo no beat',
        type: 'voice',
      },
      {
        id: 'ch_duvidas_ini',
        name: '💬 dúvidas-iniciante',
        tabId: 'suggestions',
        description: 'Canal de texto para tirar dúvidas com a equipe',
        type: 'text',
      },
      {
        id: 'ch_tarefas_ini',
        name: '📝 tarefas-iniciante',
        tabId: 'challenges',
        description: 'Exercícios práticos de rimas diárias',
        type: 'text',
      },
      {
        id: 'ch_objetivos_ini',
        name: '🎯 objetivos',
        tabId: 'tracks',
        description: 'Metas e marcos de aprendizado do MC iniciante',
        type: 'text',
      },
      {
        id: 'ch_progresso_ini',
        name: '🏆 progresso',
        tabId: 'profile',
        description: 'Acompanhe seus níveis de XP e evolução',
        type: 'text',
      },
      {
        id: 'ch_desempenho_ini',
        name: '📊 desempenho',
        tabId: 'profile',
        description: 'Estatísticas e pontuação das suas gravações',
        type: 'text',
      },
    ],
  },
  {
    id: 'cat_call_intermediario',
    name: '🎤 Call Aulas - Intermediário',
    shortName: 'Intermediário',
    emoji: '🎤',
    accentColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    keywords: ['intermediário', 'intermediario', 'flow', 'métrica', 'speed flow', 'seminário', 'jam'],
    description: 'Aprofundamento em flow, métrica, variações de BPM e debates criativos',
    channels: [
      {
        id: 'ch_aula_inter_1',
        name: '👥 Aula Intermediário 1',
        tabId: 'calls',
        description: 'Aula ao vivo de métrica, flow e encaixe rítmico',
        type: 'voice',
        badge: 'Aula',
      },
      {
        id: 'ch_aula_inter_2',
        name: '👥 Aula Intermediário 2',
        tabId: 'calls',
        description: 'Turma avançada de desenvolvimento de flow',
        type: 'voice',
      },
      {
        id: 'ch_seminario_tec',
        name: '👥 Seminário Técnico',
        tabId: 'lessons',
        description: 'Aulas teóricas sobre subdivisão e esquemas de rima',
        type: 'voice',
      },
      {
        id: 'ch_debate_criativo',
        name: '👥 Debate Criativo',
        tabId: 'suggestions',
        description: 'Discussão de temas e construção de narrativas',
        type: 'voice',
      },
      {
        id: 'ch_jam_session',
        name: '👥 Jam Session',
        tabId: 'studio',
        description: 'Roda de improviso contínuo com beats variados',
        type: 'voice',
      },
      {
        id: 'ch_duvidas_inter',
        name: '💬 dúvidas-intermediário',
        tabId: 'suggestions',
        description: 'Espaço de dúvidas para o nível intermediário',
        type: 'text',
      },
      {
        id: 'ch_projetos_inter',
        name: '📝 projetos',
        tabId: 'studio',
        description: 'Projetos e gravações dos alunos',
        type: 'text',
      },
      {
        id: 'ch_desafios_inter',
        name: '🎯 desafios',
        tabId: 'challenges',
        description: 'Desafios cronometrados de 4 compassos',
        type: 'text',
      },
      {
        id: 'ch_inspiracao_inter',
        name: '🌟 inspiração',
        tabId: 'lessons',
        description: 'Referências de batalhas históricas e MCs lendários',
        type: 'text',
      },
      {
        id: 'ch_evolucao_inter',
        name: '📊 evolução',
        tabId: 'profile',
        description: 'Métricas de evolução e consistência',
        type: 'text',
      },
    ],
  },
  {
    id: 'cat_call_avancado',
    name: '🎤 Call Aulas - Avançado',
    shortName: 'Avançado',
    emoji: '🎤',
    accentColor: 'border-red-500/40 text-red-400 bg-red-500/10',
    keywords: ['avançado', 'avancado', 'masterclass', 'mentorado', 'roda de rim', 'punchline', 'sangue', 'batalha'],
    description: 'Masterclasses de alto rendimento, punchlines de impacto e preparação para batalhas',
    channels: [
      {
        id: 'ch_masterclass',
        name: '👥 Masterclass',
        tabId: 'calls',
        description: 'Aulas magnas exclusivas com MCs convidados e professores',
        type: 'voice',
        badge: 'VIP',
      },
      {
        id: 'ch_mentorado_avancado',
        name: '👥 Mentorado Avançado',
        tabId: 'calls',
        description: 'Sala de acompanhamento de MCs de alto nível',
        type: 'voice',
      },
      {
        id: 'ch_aula_avancado_1',
        name: '👥 Aula Avançado 1',
        tabId: 'calls',
        description: 'Treinamento intensivo de resposta rápida e presença de palco',
        type: 'voice',
      },
      {
        id: 'ch_aula_avancado_2',
        name: '👥 Aula Avançado 2',
        tabId: 'calls',
        description: 'Estratégia de round e técnicas de contra-ataque',
        type: 'voice',
      },
      {
        id: 'ch_roda_de_rim',
        name: '👥 Roda de Rim',
        tabId: 'calls',
        description: 'Roda de rima fechada de alto nível entre os melhores MCs',
        type: 'voice',
        badge: 'Roda',
      },
      {
        id: 'ch_estrategia_av',
        name: '💬 estratégia',
        tabId: 'lessons',
        description: 'Táticas de arena, leitura de adversário e jurados',
        type: 'text',
      },
      {
        id: 'ch_obras_finais_av',
        name: '📝 obras-finais',
        tabId: 'studio',
        description: 'Gravações definitivas e faixas autorais',
        type: 'text',
      },
      {
        id: 'ch_competicao_av',
        name: '🏆 competição',
        tabId: 'challenges',
        description: 'Chaves de torneios e batalhas ranqueadas',
        type: 'text',
      },
      {
        id: 'ch_networking_av',
        name: '🌐 networking',
        tabId: 'suggestions',
        description: 'Conexões com produtores, organizadores de batalhas e MCs',
        type: 'text',
      },
      {
        id: 'ch_especializacao_av',
        name: '🎓 especialização',
        tabId: 'tracks',
        description: 'Módulos avançados de especialidade lírica',
        type: 'text',
      },
    ],
  },
  {
    id: 'cat_informacao',
    name: '📌 Informação & Ranks',
    shortName: 'Informação',
    emoji: '📌',
    accentColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    keywords: ['informação', 'anúncios', 'anuncios', 'ranks', 'verificar', 'geral', 'comunidade'],
    description: 'Avisos oficiais, ranking da comunidade e verificação de MC',
    channels: [
      {
        id: 'ch_anuncios',
        name: '📢 anúncios',
        tabId: 'onboarding',
        description: 'Comunicados oficiais sobre aulas ao vivo e novidades',
        type: 'text',
        badge: 'Importante',
      },
      {
        id: 'ch_ranks',
        name: '🏆 -ranks',
        tabId: 'leaderboard',
        description: 'Quadro de líderes de XP e posições no servidor',
        type: 'text',
      },
      {
        id: 'ch_verificar',
        name: '✅ verificar',
        tabId: 'onboarding',
        description: 'Verificação de conta e atribuição de cargos de MC',
        type: 'text',
      },
      {
        id: 'ch_welcome_vip',
        name: '💎 welcome-vip',
        tabId: 'onboarding',
        description: 'Acesso às áreas exclusivas de membros premium e VIP',
        type: 'text',
        badge: 'VIP',
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
