import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { analyzeRhymesDeterministically } from './src/lib/rhymes/rhymeAnalyzer.js';
import { LESSONS_DATA } from './src/data/lessons.js';
import { CHALLENGES_DATA } from './src/data/challenges.js';
import { ACHIEVEMENTS_DATA } from './src/data/achievements.js';

// --- Database In-Memory Store with Seed Data ---

interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

interface StoredProfile {
  id: string;
  userId: string;
  artisticName: string;
  tagline: string;
  bio: string;
  favoriteStyle: string;
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
}

interface StoredXPTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  description: string;
  createdAt: string;
}

interface StoredPracticeSession {
  id: string;
  userId: string;
  beatId: string;
  beatStyle: string;
  bpm: number;
  durationSeconds: number;
  transcript: string;
  analysis: any;
  xpEarned: number;
  createdAt: string;
}

interface StoredSubscription {
  userId: string;
  plan: 'FREE' | 'PRO' | 'PREMIUM';
  status: 'ACTIVE';
  validUntil: string;
  aiMonthlyQuota: number;
  aiQuotaUsed: number;
}

// In-Memory Database State
const users: Map<string, StoredUser> = new Map();
const profiles: Map<string, StoredProfile> = new Map();
const xpTransactions: StoredXPTransaction[] = [];
const practiceSessions: StoredPracticeSession[] = [];
const lessonCompletions: Map<string, Set<string>> = new Map(); // userId -> Set<lessonId>
const userAchievements: Map<string, Map<string, { unlockedAt: string; progress: number }>> = new Map();
const subscriptions: Map<string, StoredSubscription> = new Map();

// Helper to calculate level from XP
function calculateLevelDetails(xp: number) {
  const level = Math.floor(xp / 1000) + 1;
  const currentLevelXP = xp % 1000;
  const nextLevelXP = 1000;
  let title = 'Iniciante';
  if (level >= 10) title = 'Mestre';
  else if (level >= 5) title = 'Avançado';
  else if (level >= 2) title = 'Intermediário';

  return { level, title, currentLevelXP, nextLevelXP, progressPercent: Math.round((currentLevelXP / nextLevelXP) * 100) };
}

// Seed Demo User
const seedUserId = 'user_demo_01';
users.set(seedUserId, {
  id: seedUserId,
  email: 'mc_freestyle@rimalab.com',
  passwordHash: 'hashed_senha123',
  role: 'USER',
  createdAt: new Date().toISOString(),
});

profiles.set(seedUserId, {
  id: 'prof_demo_01',
  userId: seedUserId,
  artisticName: 'MC Foco & Flow',
  tagline: 'Mestre da Métrica & Freestyle Improvisado',
  bio: 'Treinando rimas diárias no RimaLab para dominar as batalhas de freestyle e lapidar métrica e punchlines.',
  favoriteStyle: 'Boom Bap',
  level: 2,
  totalXP: 1450,
  streakDays: 4,
  lastPracticeDate: new Date().toISOString(),
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  isPublic: true,
  showStats: true,
  showHistory: true,
  totalSessions: 6,
  totalMinutesPracticed: 18,
  bestScore: 92,
  totalWordsRhymed: 340,
});

subscriptions.set(seedUserId, {
  userId: seedUserId,
  plan: 'PRO',
  status: 'ACTIVE',
  validUntil: '2027-12-31T23:59:59Z',
  aiMonthlyQuota: 100,
  aiQuotaUsed: 8,
});

xpTransactions.push(
  { id: 'xp_01', userId: seedUserId, amount: 200, reason: 'LESSON_COMPLETE', description: 'Concluiu a lição Anatomia da Rima', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 'xp_02', userId: seedUserId, amount: 150, reason: 'SESSION_COMPLETE', description: 'Prática de Freestyle Boom Bap 90 BPM', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'xp_03', userId: seedUserId, amount: 100, reason: 'STREAK_BONUS', description: 'Bônus de sequência diária (4 dias)', createdAt: new Date().toISOString() }
);

lessonCompletions.set(seedUserId, new Set(['lesson-fund-1']));

const demoAchMap = new Map();
demoAchMap.set('primeira_rima', { unlockedAt: new Date(Date.now() - 86400000 * 2).toISOString(), progress: 1 });
demoAchMap.set('iniciante', { unlockedAt: new Date(Date.now() - 86400000).toISOString(), progress: 1000 });
demoAchMap.set('aluno_aplicado', { unlockedAt: new Date(Date.now() - 86400000 * 2).toISOString(), progress: 1 });
demoAchMap.set('mestre_das_rimas', { unlockedAt: new Date().toISOString(), progress: 92 });
userAchievements.set(seedUserId, demoAchMap);

// --- Gemini Client Initialization ---
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// --- Check Achievements Helper ---
function checkAndUnlockAchievements(userId: string, profile: StoredProfile, lastScore?: number) {
  let userAchs = userAchievements.get(userId);
  if (!userAchs) {
    userAchs = new Map();
    userAchievements.set(userId, userAchs);
  }

  const newlyUnlocked: string[] = [];

  // Primeira Rima
  if (profile.totalSessions >= 1 && !userAchs.has('primeira_rima')) {
    userAchs.set('primeira_rima', { unlockedAt: new Date().toISOString(), progress: 1 });
    newlyUnlocked.push('primeira_rima');
  }

  // Mestre das Rimas (Score >= 90)
  if (lastScore && lastScore >= 90 && !userAchs.has('mestre_das_rimas')) {
    userAchs.set('mestre_das_rimas', { unlockedAt: new Date().toISOString(), progress: lastScore });
    newlyUnlocked.push('mestre_das_rimas');
  }

  // Iniciante (XP >= 1000)
  if (profile.totalXP >= 1000 && !userAchs.has('iniciante')) {
    userAchs.set('iniciante', { unlockedAt: new Date().toISOString(), progress: profile.totalXP });
    newlyUnlocked.push('iniciante');
  }

  // Dedicado (Streak >= 3)
  if (profile.streakDays >= 3 && !userAchs.has('dedicado')) {
    userAchs.set('dedicado', { unlockedAt: new Date().toISOString(), progress: profile.streakDays });
    newlyUnlocked.push('dedicado');
  }

  // Comprometido (Minutes >= 15)
  if (profile.totalMinutesPracticed >= 15 && !userAchs.has('comprometido')) {
    userAchs.set('comprometido', { unlockedAt: new Date().toISOString(), progress: profile.totalMinutesPracticed });
    newlyUnlocked.push('comprometido');
  }

  // Veterano (Sessions >= 10)
  if (profile.totalSessions >= 10 && !userAchs.has('veterano')) {
    userAchs.set('veterano', { unlockedAt: new Date().toISOString(), progress: profile.totalSessions });
    newlyUnlocked.push('veterano');
  }

  return newlyUnlocked;
}

// --- Start Express Application ---
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- API Endpoints ---

  // Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), service: 'RimaLab Core SaaS API' });
  });

  // Auth: Register
  app.post('/api/auth/register', (req, res) => {
    try {
      const { email, password, artisticName, favoriteStyle } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
      }

      // Check existing user
      for (const u of users.values()) {
        if (u.email.toLowerCase() === email.toLowerCase()) {
          return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
        }
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const newUser: StoredUser = {
        id: userId,
        email: email.toLowerCase(),
        passwordHash: `hash_${password}`,
        role: 'USER',
        createdAt: new Date().toISOString(),
      };
      users.set(userId, newUser);

      const newProfile: StoredProfile = {
        id: `prof_${userId}`,
        userId: userId,
        artisticName: artisticName?.trim() || `MC_${email.split('@')[0]}`,
        tagline: 'Freestyler em Treinamento',
        bio: 'Iniciando minha jornada no RimaLab para dominar métrica, rimas e flow.',
        favoriteStyle: favoriteStyle || 'Boom Bap',
        level: 1,
        totalXP: 100,
        streakDays: 1,
        lastPracticeDate: new Date().toISOString(),
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
        isPublic: true,
        showStats: true,
        showHistory: true,
        totalSessions: 0,
        totalMinutesPracticed: 0,
        bestScore: 0,
        totalWordsRhymed: 0,
      };
      profiles.set(userId, newProfile);

      const newSub: StoredSubscription = {
        userId,
        plan: 'FREE',
        status: 'ACTIVE',
        validUntil: '2099-12-31T23:59:59Z',
        aiMonthlyQuota: 15,
        aiQuotaUsed: 0,
      };
      subscriptions.set(userId, newSub);

      xpTransactions.push({
        id: `xp_${Date.now()}`,
        userId,
        amount: 100,
        reason: 'WELCOME_BONUS',
        description: 'Bônus de boas-vindas ao RimaLab',
        createdAt: new Date().toISOString(),
      });

      const token = `jwt_token_${userId}`;
      const levelDetails = calculateLevelDetails(newProfile.totalXP);

      res.json({
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
        profile: { ...newProfile, levelDetails },
        subscription: newSub,
        token,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao registrar usuário.' });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório.' });
      }

      let foundUser: StoredUser | null = null;
      for (const u of users.values()) {
        if (u.email.toLowerCase() === email.toLowerCase()) {
          foundUser = u;
          break;
        }
      }

      // If user not found, auto-create a persistent session for demo convenience
      if (!foundUser) {
        const userId = `user_${Date.now()}`;
        foundUser = {
          id: userId,
          email: email.toLowerCase(),
          passwordHash: 'hash_auto',
          role: 'USER',
          createdAt: new Date().toISOString(),
        };
        users.set(userId, foundUser);

        profiles.set(userId, {
          id: `prof_${userId}`,
          userId: userId,
          artisticName: `MC ${email.split('@')[0]}`,
          tagline: 'Improvisador RimaLab',
          bio: 'Praticando rimas diárias.',
          favoriteStyle: 'Boom Bap',
          level: 1,
          totalXP: 250,
          streakDays: 1,
          lastPracticeDate: new Date().toISOString(),
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
          isPublic: true,
          showStats: true,
          showHistory: true,
          totalSessions: 1,
          totalMinutesPracticed: 3,
          bestScore: 78,
          totalWordsRhymed: 45,
        });

        subscriptions.set(userId, {
          userId,
          plan: 'FREE',
          status: 'ACTIVE',
          validUntil: '2099-12-31T23:59:59Z',
          aiMonthlyQuota: 15,
          aiQuotaUsed: 1,
        });
      }

      const profile = profiles.get(foundUser.id)!;
      const sub = subscriptions.get(foundUser.id)!;
      const token = `jwt_token_${foundUser.id}`;
      const levelDetails = calculateLevelDetails(profile.totalXP);

      res.json({
        user: { id: foundUser.id, email: foundUser.email, role: foundUser.role },
        profile: { ...profile, levelDetails },
        subscription: sub,
        token,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao realizar login.' });
    }
  });

  // Auth: Me / Get Current User
  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    let userId = seedUserId;
    if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
      userId = authHeader.replace('Bearer jwt_token_', '');
    }

    const user = users.get(userId) || users.get(seedUserId)!;
    const profile = profiles.get(user.id) || profiles.get(seedUserId)!;
    const subscription = subscriptions.get(user.id) || subscriptions.get(seedUserId)!;
    const levelDetails = calculateLevelDetails(profile.totalXP);

    res.json({
      user: { id: user.id, email: user.email, role: user.role },
      profile: { ...profile, levelDetails },
      subscription,
    });
  });

  // Profile: Update
  app.put('/api/profile', (req, res) => {
    const authHeader = req.headers.authorization;
    let userId = seedUserId;
    if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
      userId = authHeader.replace('Bearer jwt_token_', '');
    }

    const profile = profiles.get(userId);
    if (!profile) return res.status(404).json({ error: 'Perfil não encontrado.' });

    const { artisticName, tagline, bio, favoriteStyle, avatarUrl, isPublic, showStats, showHistory } = req.body;

    if (artisticName) profile.artisticName = artisticName.trim();
    if (tagline !== undefined) profile.tagline = tagline.trim();
    if (bio !== undefined) profile.bio = bio.trim();
    if (favoriteStyle) profile.favoriteStyle = favoriteStyle;
    if (avatarUrl) profile.avatarUrl = avatarUrl;
    if (isPublic !== undefined) profile.isPublic = Boolean(isPublic);
    if (showStats !== undefined) profile.showStats = Boolean(showStats);
    if (showHistory !== undefined) profile.showHistory = Boolean(showHistory);

    const levelDetails = calculateLevelDetails(profile.totalXP);
    res.json({ profile: { ...profile, levelDetails }, success: true });
  });

  // Dashboard Overview
  app.get('/api/dashboard', (req, res) => {
    const authHeader = req.headers.authorization;
    let userId = seedUserId;
    if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
      userId = authHeader.replace('Bearer jwt_token_', '');
    }

    const profile = profiles.get(userId) || profiles.get(seedUserId)!;
    const levelDetails = calculateLevelDetails(profile.totalXP);
    const sub = subscriptions.get(userId) || subscriptions.get(seedUserId)!;

    // Filter user's recent sessions
    const userSessions = practiceSessions.filter(s => s.userId === userId).slice(-5).reverse();
    const userLedger = xpTransactions.filter(x => x.userId === userId).slice(-8).reverse();

    // User achievements progress
    const userAchs = userAchievements.get(userId) || new Map();
    const achievementsStatus = ACHIEVEMENTS_DATA.map(ach => {
      const uAch = userAchs.get(ach.key);
      return {
        ...ach,
        isUnlocked: Boolean(uAch),
        unlockedAt: uAch?.unlockedAt || null,
        progress: uAch?.progress || 0,
      };
    });

    // Lessons progress
    const completedSet = lessonCompletions.get(userId) || new Set();
    const totalLessons = LESSONS_DATA.length;
    const completedCount = completedSet.size;

    res.json({
      profile: { ...profile, levelDetails },
      subscription: sub,
      recentSessions: userSessions,
      xpLedger: userLedger,
      achievements: achievementsStatus,
      lessonsSummary: {
        total: totalLessons,
        completed: completedCount,
        percent: Math.round((completedCount / totalLessons) * 100),
      },
      dailyChallenge: CHALLENGES_DATA[0],
    });
  });

  // Practice: Hybrid Rhyme Analysis (Deterministic + Gemini 3.7 Flash)
  app.post('/api/practice/analyze', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let userId = seedUserId;
      if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
        userId = authHeader.replace('Bearer jwt_token_', '');
      }

      const profile = profiles.get(userId) || profiles.get(seedUserId)!;
      const sub = subscriptions.get(userId) || subscriptions.get(seedUserId)!;

      const { transcript, beatStyle, bpm, durationSeconds, challengeId } = req.body;

      if (!transcript || transcript.trim().length === 0) {
        return res.status(400).json({ error: 'Nenhum texto de rima fornecido para análise.' });
      }

      const duration = Number(durationSeconds) || 30;

      // 1. Run Deterministic Heuristics
      const deterministicResult = analyzeRhymesDeterministically(transcript, duration);

      let finalAnalysis = { ...deterministicResult };
      let aiCalled = false;

      // 2. Call Gemini AI if API Key exists and quota allows
      const ai = getGeminiClient();
      if (ai && (sub.plan !== 'FREE' || sub.aiQuotaUsed < sub.aiMonthlyQuota)) {
        try {
          const aiResponse = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: `Você é um juiz e mestre experiente de batalhas de rap e freestyle (estilo Batalha da Aldeia / Red Bull FrancaMente).
Analise a seguinte letra/transcrição de freestyle gravada pelo MC:

ESTILO DO BEAT: ${beatStyle || 'Boom Bap'}
BPM: ${bpm || 90}
DURAÇÃO DA PRÁTICA: ${duration} segundos
TRANSCRIÇÃO DO MC:
"""
${transcript}
"""

ANÁLISE HEURÍSTICA PRÉVIA:
- Palavras totais: ${deterministicResult.wordsCount}
- Rimas identificadas: ${deterministicResult.rhymesCount}
- Diversidade lexical: ${Math.round(deterministicResult.uniqueWordsRatio * 100)}%

Avalie com critério técnico em português do Brasil, fornecendo notas de 0 a 100, pontos fortes reais, melhorias práticas e sugestão do próximo exercício.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  aiScore: { type: Type.INTEGER, description: 'Nota geral do freestyle de 0 a 100' },
                  rhymeQuality: { type: Type.INTEGER, description: 'Qualidade técnica das rimas de 0 a 100' },
                  flowScore: { type: Type.INTEGER, description: 'Cadência, ritmo e divisão métrica de 0 a 100' },
                  creativityScore: { type: Type.INTEGER, description: 'Criatividade, vocabulário e metáforas de 0 a 100' },
                  coherenceScore: { type: Type.INTEGER, description: 'Coerência do tema e storytelling de 0 a 100' },
                  strengths: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '2 a 3 pontos fortes destacados na rima'
                  },
                  improvements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '2 a 3 pontos de melhoria com dicas práticas'
                  },
                  suggestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '1 a 2 técnicas específicas para treinar agora'
                  },
                  punchlineFeedback: { type: Type.STRING, description: 'Comentário sobre o impacto das punchlines' },
                  nextExercise: { type: Type.STRING, description: 'Próximo exercício recomendado' },
                  aiCommentary: { type: Type.STRING, description: 'Comentário personalizado motivador de um mestre de rap' }
                },
                required: [
                  'aiScore', 'rhymeQuality', 'flowScore', 'creativityScore', 'coherenceScore',
                  'strengths', 'improvements', 'suggestions', 'nextExercise', 'aiCommentary'
                ]
              }
            }
          });

          if (aiResponse.text) {
            const aiData = JSON.parse(aiResponse.text);
            
            // Weighted hybrid score: 40% deterministic + 60% AI evaluation
            const hybridOverallScore = Math.round(
              deterministicResult.heuristicScore * 0.4 + aiData.aiScore * 0.6
            );

            finalAnalysis = {
              ...deterministicResult,
              overallScore: Math.min(100, Math.max(20, hybridOverallScore)),
              aiScore: aiData.aiScore,
              rhymeQuality: aiData.rhymeQuality || deterministicResult.rhymeQuality,
              flowScore: aiData.flowScore || deterministicResult.flowScore,
              creativityScore: aiData.creativityScore || deterministicResult.creativityScore,
              coherenceScore: aiData.coherenceScore || deterministicResult.coherenceScore,
              strengths: aiData.strengths && aiData.strengths.length > 0 ? aiData.strengths : deterministicResult.strengths,
              improvements: aiData.improvements && aiData.improvements.length > 0 ? aiData.improvements : deterministicResult.improvements,
              suggestions: aiData.suggestions && aiData.suggestions.length > 0 ? aiData.suggestions : deterministicResult.suggestions,
              punchlineFeedback: aiData.punchlineFeedback,
              nextExercise: aiData.nextExercise || deterministicResult.nextExercise,
              aiCommentary: aiData.aiCommentary,
            };

            sub.aiQuotaUsed += 1;
            aiCalled = true;
          }
        } catch (aiErr) {
          console.warn('Gemini AI fallback to deterministic analysis:', aiErr);
        }
      }

      // 3. XP Calculation & Gamification Ledger
      // Base: +50 XP for rhyme attempt, +100 for session, +10 XP per minute
      const timeBonus = Math.round((duration / 60) * 10);
      const scoreBonus = Math.round(finalAnalysis.overallScore * 0.5);
      const totalEarnedXP = 50 + 100 + timeBonus + scoreBonus;

      // Update Profile Metrics
      profile.totalXP += totalEarnedXP;
      profile.totalSessions += 1;
      profile.totalMinutesPracticed += Math.round(duration / 60) || 1;
      profile.totalWordsRhymed += deterministicResult.wordsCount;
      if (finalAnalysis.overallScore > profile.bestScore) {
        profile.bestScore = finalAnalysis.overallScore;
      }
      profile.lastPracticeDate = new Date().toISOString();

      // Record XP Transactions
      xpTransactions.push(
        {
          id: `xp_rhyme_${Date.now()}`,
          userId,
          amount: 50,
          reason: 'PRACTICE_RHYME',
          description: `Rima gravada com ${deterministicResult.rhymesCount} conexões de rima`,
          createdAt: new Date().toISOString(),
        },
        {
          id: `xp_sess_${Date.now()}`,
          userId,
          amount: 100 + timeBonus + scoreBonus,
          reason: 'SESSION_COMPLETE',
          description: `Sessão concluída (${duration}s) no estilo ${beatStyle} — Score: ${finalAnalysis.overallScore}`,
          createdAt: new Date().toISOString(),
        }
      );

      // Record Practice Session
      const sessionRecord: StoredPracticeSession = {
        id: `sess_${Date.now()}`,
        userId,
        beatId: req.body.beatId || 'beat-custom',
        beatStyle: beatStyle || 'Boom Bap',
        bpm: bpm || 90,
        durationSeconds: duration,
        transcript,
        analysis: finalAnalysis,
        xpEarned: totalEarnedXP,
        createdAt: new Date().toISOString(),
      };
      practiceSessions.push(sessionRecord);

      // Check and unlock achievements
      const newlyUnlocked = checkAndUnlockAchievements(userId, profile, finalAnalysis.overallScore);

      const levelDetails = calculateLevelDetails(profile.totalXP);

      res.json({
        analysis: finalAnalysis,
        xpEarned: totalEarnedXP,
        newlyUnlockedAchievements: newlyUnlocked,
        aiUsed: aiCalled,
        profile: { ...profile, levelDetails },
        subscription: sub,
        session: sessionRecord,
      });
    } catch (err: any) {
      console.error('Error analyzing practice session:', err);
      res.status(500).json({ error: err.message || 'Erro ao processar análise da rima.' });
    }
  });

  // Lessons: Get All
  app.get('/api/lessons', (req, res) => {
    const authHeader = req.headers.authorization;
    let userId = seedUserId;
    if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
      userId = authHeader.replace('Bearer jwt_token_', '');
    }

    const completedSet = lessonCompletions.get(userId) || new Set();

    const lessonsWithProgress = LESSONS_DATA.map(lesson => ({
      ...lesson,
      isCompleted: completedSet.has(lesson.id),
    }));

    res.json({ lessons: lessonsWithProgress });
  });

  // Lessons: Complete
  app.post('/api/lessons/complete', (req, res) => {
    const authHeader = req.headers.authorization;
    let userId = seedUserId;
    if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
      userId = authHeader.replace('Bearer jwt_token_', '');
    }

    const { lessonId } = req.body;
    const lesson = LESSONS_DATA.find(l => l.id === lessonId);
    if (!lesson) return res.status(404).json({ error: 'Lição não encontrada.' });

    let completedSet = lessonCompletions.get(userId);
    if (!completedSet) {
      completedSet = new Set();
      lessonCompletions.set(userId, completedSet);
    }

    const isFirstTime = !completedSet.has(lessonId);
    completedSet.add(lessonId);

    const profile = profiles.get(userId) || profiles.get(seedUserId)!;

    if (isFirstTime) {
      profile.totalXP += lesson.xpReward;
      xpTransactions.push({
        id: `xp_les_${Date.now()}`,
        userId,
        amount: lesson.xpReward,
        reason: 'LESSON_COMPLETE',
        description: `Concluiu a lição: ${lesson.title}`,
        createdAt: new Date().toISOString(),
      });

      // Check lesson achievements
      let userAchs = userAchievements.get(userId);
      if (!userAchs) {
        userAchs = new Map();
        userAchievements.set(userId, userAchs);
      }
      if (!userAchs.has('aluno_aplicado')) {
        userAchs.set('aluno_aplicado', { unlockedAt: new Date().toISOString(), progress: 1 });
      }

      // Check if all Fundamentos are done
      const fundLessons = LESSONS_DATA.filter(l => l.category === 'Fundamentos');
      const allFundDone = fundLessons.every(l => completedSet!.has(l.id));
      if (allFundDone && !userAchs.has('graduado')) {
        userAchs.set('graduado', { unlockedAt: new Date().toISOString(), progress: fundLessons.length });
      }
    }

    const levelDetails = calculateLevelDetails(profile.totalXP);
    res.json({
      success: true,
      xpEarned: isFirstTime ? lesson.xpReward : 0,
      profile: { ...profile, levelDetails },
    });
  });

  // Challenges: Get All
  app.get('/api/challenges', (req, res) => {
    res.json({ challenges: CHALLENGES_DATA });
  });

  // Challenges: Attempt / Complete
  app.post('/api/challenges/attempt', (req, res) => {
    const authHeader = req.headers.authorization;
    let userId = seedUserId;
    if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
      userId = authHeader.replace('Bearer jwt_token_', '');
    }

    const { challengeId } = req.body;
    const chal = CHALLENGES_DATA.find(c => c.id === challengeId);
    if (!chal) return res.status(404).json({ error: 'Desafio não encontrado.' });

    const profile = profiles.get(userId) || profiles.get(seedUserId)!;
    profile.totalXP += chal.xpReward;

    xpTransactions.push({
      id: `xp_chal_${Date.now()}`,
      userId,
      amount: chal.xpReward,
      reason: 'CHALLENGE_COMPLETE',
      description: `Completou o desafio: ${chal.title}`,
      createdAt: new Date().toISOString(),
    });

    const levelDetails = calculateLevelDetails(profile.totalXP);
    res.json({ success: true, xpEarned: chal.xpReward, profile: { ...profile, levelDetails } });
  });

  // Subscription: Get & Upgrade
  app.get('/api/subscription', (req, res) => {
    const authHeader = req.headers.authorization;
    let userId = seedUserId;
    if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
      userId = authHeader.replace('Bearer jwt_token_', '');
    }

    const sub = subscriptions.get(userId) || subscriptions.get(seedUserId)!;
    res.json({ subscription: sub });
  });

  app.post('/api/subscription/upgrade', (req, res) => {
    const authHeader = req.headers.authorization;
    let userId = seedUserId;
    if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
      userId = authHeader.replace('Bearer jwt_token_', '');
    }

    const { targetPlan } = req.body; // 'PRO' | 'PREMIUM'
    const plan = targetPlan === 'PREMIUM' ? 'PREMIUM' : 'PRO';

    const sub = subscriptions.get(userId) || subscriptions.get(seedUserId)!;
    sub.plan = plan;
    sub.aiMonthlyQuota = plan === 'PREMIUM' ? 500 : 100;
    sub.validUntil = '2027-12-31T23:59:59Z';

    res.json({ success: true, subscription: sub, message: `Plano atualizado com sucesso para ${plan}!` });
  });

  // LGPD Compliance: Export and Delete Data
  app.post('/api/data/export', (req, res) => {
    const authHeader = req.headers.authorization;
    let userId = seedUserId;
    if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
      userId = authHeader.replace('Bearer jwt_token_', '');
    }

    const user = users.get(userId);
    const profile = profiles.get(userId);
    const sessions = practiceSessions.filter(s => s.userId === userId);
    const ledger = xpTransactions.filter(x => x.userId === userId);

    res.json({
      exportDate: new Date().toISOString(),
      user: { id: user?.id, email: user?.email, createdAt: user?.createdAt },
      profile,
      practiceSessions: sessions,
      xpTransactions: ledger,
      gdprCompliance: 'Todos os seus dados estão seguros e sob seu controle no RimaLab.',
    });
  });

  app.post('/api/data/delete', (req, res) => {
    const authHeader = req.headers.authorization;
    let userId = seedUserId;
    if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
      userId = authHeader.replace('Bearer jwt_token_', '');
    }

    // Reset profile stats
    const profile = profiles.get(userId);
    if (profile) {
      profile.totalXP = 100;
      profile.totalSessions = 0;
      profile.totalMinutesPracticed = 0;
      profile.totalWordsRhymed = 0;
      profile.bestScore = 0;
      profile.streakDays = 1;
    }

    res.json({ success: true, message: 'Seu histórico e estatísticas foram resetados com sucesso conforme LGPD.' });
  });

  // --- Vite Middleware / Static Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RimaLab Server rodando em http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Falha ao iniciar servidor RimaLab:', err);
});
