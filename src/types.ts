export interface StoredUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt?: string;
}

export interface LevelDetails {
  level: number;
  title: string;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
}

export type BattleTrainingType = 'gastacao' | 'ideologica' | 'sangue' | 'conhecimento';
export type BeatStyleType = 'Boom Bap' | 'Trap' | 'Detroit' | 'Drill' | 'Lo-Fi' | 'Grime' | 'Speed Flow' | 'Custom';
export type SkillFocusType = 'speedflow' | 'punchline' | 'encaixe_beat' | 'flow' | 'contagem_versos';

export interface TrainingPreferences {
  age?: number | string;
  trainingType: BattleTrainingType;
  beatStyle: BeatStyleType;
  focusSkills: SkillFocusType[];
}

export interface CommunitySuggestion {
  id: string;
  authorName: string;
  authorAge?: number | string;
  category: 'beats' | 'vertente_rima' | 'recurso_site' | 'aulas_professores' | 'melhoria_ia';
  title: string;
  description: string;
  upvotes: number;
  hasUpvoted?: boolean;
  tags: string[];
  status: 'ANALISANDO' | 'EM_DESENVOLVIMENTO' | 'APROVADO_PROFESSORES' | 'IMPLEMENTADO';
  createdAt: string;
  teacherComment?: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  artisticName: string;
  tagline: string;
  bio: string;
  favoriteStyle: string;
  age?: number | string;
  trainingType?: BattleTrainingType;
  focusSkills?: SkillFocusType[];
  level: number;
  totalXP: number;
  streakDays: number;
  lastPracticeDate?: string;
  avatarUrl: string;
  isPublic: boolean;
  showStats: boolean;
  showHistory: boolean;
  totalSessions: number;
  totalMinutesPracticed: number;
  bestScore: number;
  totalWordsRhymed: number;
  levelDetails?: LevelDetails;
}

export interface Subscription {
  userId: string;
  plan: 'FREE' | 'PRO' | 'PREMIUM' | 'FREE_TRIAL' | 'MONTHLY' | 'ANNUAL';
  status: 'ACTIVE' | 'EXPIRED';
  validUntil: string;
  aiMonthlyQuota: number;
  aiQuotaUsed: number;
  trialDaysRemaining?: number;
  registeredIp?: string;
  gmail?: string;
}

export interface TrialStatus {
  ip: string;
  email: string;
  trialStartedAt: string;
  trialExpiresAt: string;
  daysRemaining: number;
  isExpired: boolean;
  hasActiveSubscription: boolean;
  totalDays: number;
}

export interface LiveCallSession {
  id: string;
  isActive: boolean;
  platform: 'whatsapp' | 'discord' | 'meet' | 'zoom' | 'custom';
  url: string;
  title: string;
  description: string;
  hostName: string;
  startedAt: string;
  targetTier?: 'ALL' | 'MONTHLY' | 'ANNUAL';
}

export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  description: string;
  createdAt: string;
}

export interface RhymePair {
  word1: string;
  word2: string;
  type: 'perfeita' | 'toante' | 'aliteracao' | 'assonancia';
  similarity: number;
}

export interface RhymeAnalysis {
  wordsCount: number;
  rhymesCount: number;
  uniqueWordsRatio: number;
  rhymeQuality: number;
  flowScore: number;
  creativityScore: number;
  coherenceScore: number;
  overallScore: number;
  aiScore?: number;
  heuristicScore: number;
  metricScore?: number;
  punchlineImpact?: number;
  evaluationVerdict?: 'Lendário' | 'Excelente' | 'Sólido' | 'Em Evolução' | 'Precisa de Ajustes';
  rhymePairs: RhymePair[];
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  corrections?: string[];
  punchlineFeedback?: string;
  nextExercise: string;
  aiCommentary?: string;
  directFeedback?: string;
  flowTips?: string;
}

export interface PracticeSession {
  id: string;
  userId: string;
  beatId: string;
  beatStyle: string;
  bpm: number;
  durationSeconds: number;
  transcript: string;
  analysis: RhymeAnalysis;
  xpEarned: number;
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: 'Fundamentos' | 'Métrica & Flow' | 'Punchlines' | 'Batalhas & Improviso' | 'Vocabulário';
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  xpReward: number;
  durationMinutes: number;
  description: string;
  theory: string;
  audioExampleUrl?: string;
  exampleLyrics: string[];
  tips: string[];
  exercisePrompt: string;
  exerciseWords: string[];
  isCompleted?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  category: 'Daily' | 'Speed' | 'Punchline' | 'Vocabulary' | 'Storytelling';
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  xpReward: number;
  timeLimitSeconds: number;
  description: string;
  theme: string;
  requiredWords: string[];
  recommendedBeat: string;
  recommendedBpm: number;
  completed?: boolean;
}

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
  category: 'Prática' | 'XP' | 'Lições' | 'Consistência' | 'Desafios';
  requirement: string;
  isUnlocked?: boolean;
  unlockedAt?: string | null;
  progress?: number;
}

export interface Beat {
  id: string;
  title: string;
  style: 'Boom Bap' | 'Trap' | 'Detroit' | 'Drill' | 'Lo-Fi' | 'Grime' | 'Speed Flow' | 'Custom';
  bpm: number;
  key: string;
  producer: string;
  energy: 'Chill' | 'Médio' | 'Agressivo' | 'Épico';
  description: string;
  audioUrl?: string;
  source?: 'synth' | 'custom' | 'youtube' | 'stream';
  thumbnailUrl?: string;
  durationFormatted?: string;
}
