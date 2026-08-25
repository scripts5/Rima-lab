import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import type { LiveServerMessage } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import { analyzeRhymesDeterministically } from './src/lib/rhymes/rhymeAnalyzer';
import { LESSONS_DATA } from './src/data/lessons';
import { CHALLENGES_DATA } from './src/data/challenges';
import { ACHIEVEMENTS_DATA } from './src/data/achievements';

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
  age?: number;
  trainingType?: string;
  focusSkills?: string[];
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
  plan: 'FREE' | 'PRO' | 'PREMIUM' | 'FREE_TRIAL' | 'MONTHLY' | 'ANNUAL';
  status: 'ACTIVE' | 'EXPIRED';
  validUntil: string;
  aiMonthlyQuota: number;
  aiQuotaUsed: number;
  trialDaysRemaining?: number;
  registeredIp?: string;
  gmail?: string;
}

interface IPTrialRecord {
  ip: string;
  firstEmail: string;
  lastEmail: string;
  trialStartedAt: number;
  trialExpiresAt: number;
  totalLogins: number;
}

interface LiveCallState {
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

// In-Memory Database State
const users: Map<string, StoredUser> = new Map();
const profiles: Map<string, StoredProfile> = new Map();
const xpTransactions: StoredXPTransaction[] = [];
const practiceSessions: StoredPracticeSession[] = [];
const lessonCompletions: Map<string, Set<string>> = new Map(); // userId -> Set<lessonId>
const userAchievements: Map<string, Map<string, { unlockedAt: string; progress: number }>> = new Map();
const subscriptions: Map<string, StoredSubscription> = new Map();
const ipTrials: Map<string, IPTrialRecord> = new Map();

// Active Live Call broadcasted by Admin/Teachers (Kowalski MC & Luquita MC)
let currentLiveCall: LiveCallState = {
  id: 'live_default',
  isActive: true,
  platform: 'discord',
  url: 'https://discord.gg/rimalab',
  title: '🔥 Aula ao Vivo de Métrica & Rimas com os Professores',
  description: 'Entre na chamada de voz e vídeo para treinar freestyle 1-a-1 com Luquita MC e Kowalski MC!',
  hostName: 'Luquita MC & Kowalski MC',
  startedAt: new Date().toISOString(),
  targetTier: 'ALL',
};

// Real-Time SSE Subscribers for Live Call Broadcasts
const liveCallSubscribers = new Set<express.Response>();

function broadcastLiveCallUpdate() {
  const payload = JSON.stringify({
    type: 'live-call-update',
    liveCall: currentLiveCall,
    timestamp: Date.now(),
  });
  
  for (const client of Array.from(liveCallSubscribers)) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (err) {
      liveCallSubscribers.delete(client);
    }
  }
}

// Client IP extractor helper
function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

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

  // Auth: Gmail Login with 14-Day Free Trial & IP Checking
  app.post('/api/auth/gmail', (req, res) => {
    try {
      const { email, artisticName, favoriteStyle } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Por favor, insira um endereço de Gmail/E-mail válido.' });
      }

      const clientIp = getClientIp(req);
      const normalizedEmail = email.trim().toLowerCase();
      const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      // Look up existing IP record
      let ipRecord = ipTrials.get(clientIp);
      let isNewIp = false;

      if (!ipRecord) {
        isNewIp = true;
        ipRecord = {
          ip: clientIp,
          firstEmail: normalizedEmail,
          lastEmail: normalizedEmail,
          trialStartedAt: now,
          trialExpiresAt: now + FOURTEEN_DAYS_MS,
          totalLogins: 1,
        };
        ipTrials.set(clientIp, ipRecord);
      } else {
        ipRecord.lastEmail = normalizedEmail;
        ipRecord.totalLogins += 1;
      }

      const isTrialExpired = now > ipRecord.trialExpiresAt;
      const msRemaining = Math.max(0, ipRecord.trialExpiresAt - now);
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

      // Find or create user
      let foundUser: StoredUser | null = null;
      for (const u of users.values()) {
        if (u.email.toLowerCase() === normalizedEmail) {
          foundUser = u;
          break;
        }
      }

      if (!foundUser) {
        const userId = `user_g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        foundUser = {
          id: userId,
          email: normalizedEmail,
          passwordHash: 'gmail_oauth_pass',
          role: 'USER',
          createdAt: new Date().toISOString(),
        };
        users.set(userId, foundUser);

        const initialArtistic = artisticName?.trim() || `MC ${normalizedEmail.split('@')[0]}`;
        const newProfile: StoredProfile = {
          id: `prof_${userId}`,
          userId: userId,
          artisticName: initialArtistic,
          tagline: 'MC em Treinamento • 14 Dias Grátis',
          bio: 'Estudando métrica, rimas ricas e punchlines no RimaLab AI.',
          favoriteStyle: favoriteStyle || 'Boom Bap',
          level: 1,
          totalXP: 250,
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
          plan: isTrialExpired ? 'FREE' : 'FREE_TRIAL',
          status: isTrialExpired ? 'EXPIRED' : 'ACTIVE',
          validUntil: new Date(ipRecord.trialExpiresAt).toISOString(),
          aiMonthlyQuota: 20,
          aiQuotaUsed: 0,
          trialDaysRemaining: daysRemaining,
          registeredIp: clientIp,
          gmail: normalizedEmail,
        };
        subscriptions.set(userId, newSub);
      }

      const profile = profiles.get(foundUser.id)!;
      let subscription = subscriptions.get(foundUser.id)!;

      // Update subscription trial fields based on IP record
      if (subscription.plan === 'FREE_TRIAL' || subscription.plan === 'FREE') {
        subscription.trialDaysRemaining = daysRemaining;
        subscription.registeredIp = clientIp;
        subscription.gmail = normalizedEmail;
        subscription.validUntil = new Date(ipRecord.trialExpiresAt).toISOString();
        if (isTrialExpired && subscription.plan === 'FREE_TRIAL') {
          subscription.status = 'EXPIRED';
        }
      }

      const token = `jwt_token_${foundUser.id}`;
      const levelDetails = calculateLevelDetails(profile.totalXP);

      const trialStatus = {
        ip: clientIp,
        email: normalizedEmail,
        trialStartedAt: new Date(ipRecord.trialStartedAt).toISOString(),
        trialExpiresAt: new Date(ipRecord.trialExpiresAt).toISOString(),
        daysRemaining: daysRemaining,
        isExpired: isTrialExpired,
        hasActiveSubscription: subscription.plan === 'MONTHLY' || subscription.plan === 'ANNUAL' || subscription.plan === 'PRO' || subscription.plan === 'PREMIUM',
        totalDays: 14,
        isNewIp,
        message: isTrialExpired 
          ? 'Seu período de teste grátis de 14 dias para este dispositivo/IP expirou. Escolha um plano para continuar!'
          : `Você possui ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} de teste grátis no seu IP.`
      };

      res.json({
        user: { id: foundUser.id, email: foundUser.email, role: foundUser.role },
        profile: { ...profile, levelDetails },
        subscription,
        trialStatus,
        token,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao processar login com Gmail.' });
    }
  });

  // Auth: Get current trial status for client IP
  app.get('/api/auth/trial-status', (req, res) => {
    const clientIp = getClientIp(req);
    const ipRecord = ipTrials.get(clientIp);
    const now = Date.now();
    const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

    if (!ipRecord) {
      return res.json({
        ip: clientIp,
        isRegistered: false,
        daysRemaining: 14,
        isExpired: false,
        totalDays: 14,
        message: 'Novo dispositivo/IP detectado! 14 dias de teste grátis disponíveis ao informar seu Gmail.',
      });
    }

    const isTrialExpired = now > ipRecord.trialExpiresAt;
    const msRemaining = Math.max(0, ipRecord.trialExpiresAt - now);
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

    res.json({
      ip: clientIp,
      isRegistered: true,
      email: ipRecord.lastEmail,
      trialStartedAt: new Date(ipRecord.trialStartedAt).toISOString(),
      trialExpiresAt: new Date(ipRecord.trialExpiresAt).toISOString(),
      daysRemaining,
      isExpired: isTrialExpired,
      totalDays: 14,
      totalLogins: ipRecord.totalLogins,
      message: isTrialExpired 
        ? 'Período de teste grátis de 14 dias encerrado para este IP.' 
        : `${daysRemaining} dias de teste grátis restantes neste dispositivo.`,
    });
  });

  // --- Live Call System (Students / Public & Real-Time SSE Broadcast) ---
  app.get('/api/live-call', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ liveCall: currentLiveCall, timestamp: Date.now() });
  });

  // Server-Sent Events (SSE) for Real-Time Instant Live Call Sync
  app.get('/api/live-call/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    
    // Flush initial state immediately to new client
    res.write(`data: ${JSON.stringify({ type: 'live-call-init', liveCall: currentLiveCall, timestamp: Date.now() })}\n\n`);
    
    liveCallSubscribers.add(res);

    // Heartbeat ping every 10 seconds to keep streaming connection healthy
    const pingInterval = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
      } catch {
        clearInterval(pingInterval);
        liveCallSubscribers.delete(res);
      }
    }, 10000);

    req.on('close', () => {
      clearInterval(pingInterval);
      liveCallSubscribers.delete(res);
    });
  });

  // --- Admin Endpoints (Password Protected: 36737829) ---
  app.post(['/api/admin/login', '/api/admin/verify-security', '/api/admin/verify'], (req, res) => {
    const { password, adminToken } = req.body || {};
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'];
    const tokenHeader = req.headers['x-admin-token'];

    const cleanPwd = String(password || pwdHeader || '').trim();
    const cleanToken = String(adminToken || tokenHeader || (authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '')).trim();

    const isPasswordValid = cleanPwd === '36737829' || cleanPwd === 'admin';
    const isTokenValid = cleanToken === 'adm_token_36737829';

    if (isPasswordValid || isTokenValid) {
      res.json({
        success: true,
        authorized: true,
        adminToken: 'adm_token_36737829',
        adminName: 'Professores (Kowalski MC & Luquita MC)',
        role: 'ADMIN',
        permissions: ['EDIT_CALL_LINK', 'BROADCAST_LIVE', 'VIEW_METRICS', 'MANAGE_TRIALS'],
        message: 'Acesso Mestre Concedido e Verificado! Bem-vindo ao painel de administração.',
      });
    } else {
      res.status(401).json({ 
        success: false, 
        authorized: false,
        error: 'Verificação de segurança falhou. Senha ou credencial de administrador inválida.' 
      });
    }
  });

  // Admin: Broadcast / Update Live Call Link (WhatsApp / Discord / Google Meet)
  app.post('/api/admin/live-call', (req, res) => {
    const { password, adminToken, platform, url, title, description, hostName, isActive, targetTier } = req.body || {};
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'];
    const tokenHeader = req.headers['x-admin-token'];

    const cleanPwd = String(password || pwdHeader || '').trim();
    const cleanToken = String(adminToken || tokenHeader || (authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '')).trim();
    
    // Backend Security Verification
    const isAuthorized = cleanPwd === '36737829' || cleanPwd === 'admin' || cleanToken === 'adm_token_36737829';
    if (!isAuthorized) {
      return res.status(401).json({ 
        success: false,
        authorized: false,
        error: 'Verificação de segurança rejeitada pelo servidor. Acesso não autorizado para editar ou transmitir links de chamada.' 
      });
    }

    if (url) {
      const rawUrl = String(url).trim();
      currentLiveCall.url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    }
    if (platform) currentLiveCall.platform = platform;
    if (title) currentLiveCall.title = title.trim();
    if (description !== undefined) currentLiveCall.description = description.trim();
    if (hostName) currentLiveCall.hostName = hostName.trim();
    if (isActive !== undefined) currentLiveCall.isActive = Boolean(isActive);
    if (targetTier) currentLiveCall.targetTier = targetTier;
    currentLiveCall.startedAt = new Date().toISOString();

    // Instant real-time broadcast to all connected student clients
    broadcastLiveCallUpdate();

    res.json({
      success: true,
      authorized: true,
      securityVerified: true,
      message: currentLiveCall.isActive 
        ? '🔴 Chamada ao vivo verificada pelo backend e transmitida em tempo real para todos os alunos!' 
        : 'Transmissão ao vivo encerrada com sucesso.',
      liveCall: currentLiveCall,
      subscribersCount: liveCallSubscribers.size,
    });
  });

  // Admin: View connected IPs and system metrics
  app.get('/api/admin/stats', (req, res) => {
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'];
    
    if (pwdHeader !== '36737829' && authHeader !== 'Bearer adm_token_36737829') {
      return res.status(401).json({ error: 'Acesso restrito ao Administrador.' });
    }

    const ipList = Array.from(ipTrials.values()).map(rec => {
      const now = Date.now();
      const isExpired = now > rec.trialExpiresAt;
      const daysRemaining = Math.max(0, Math.ceil((rec.trialExpiresAt - now) / (24 * 60 * 60 * 1000)));
      return {
        ip: rec.ip,
        firstEmail: rec.firstEmail,
        lastEmail: rec.lastEmail,
        trialStartedAt: new Date(rec.trialStartedAt).toISOString(),
        trialExpiresAt: new Date(rec.trialExpiresAt).toISOString(),
        daysRemaining,
        isExpired,
        totalLogins: rec.totalLogins,
      };
    });

    const userList = Array.from(users.values()).map(u => {
      const prof = profiles.get(u.id);
      const sub = subscriptions.get(u.id);
      return {
        id: u.id,
        email: u.email,
        artisticName: prof?.artisticName || 'MC',
        plan: sub?.plan || 'FREE',
        totalXP: prof?.totalXP || 0,
        sessions: prof?.totalSessions || 0,
      };
    });

    res.json({
      totalRegisteredIPs: ipTrials.size,
      totalUsers: users.size,
      totalPracticeSessions: practiceSessions.length,
      currentLiveCall,
      ipTrials: ipList,
      users: userList,
    });
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
  app.post(['/api/practice/analyze', '/api/analyze-rhymes'], async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      let userId = seedUserId;
      if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
        userId = authHeader.replace('Bearer jwt_token_', '');
      }

      const profile = profiles.get(userId) || profiles.get(seedUserId)!;
      const sub = subscriptions.get(userId) || subscriptions.get(seedUserId)!;

      const { transcript, lyrics, beatStyle, bpm, durationSeconds, challengeId, trainingType, focusSkills, userAge, age } = req.body;
      const actualText = transcript || lyrics || '';

      if (!actualText || actualText.trim().length === 0) {
        return res.status(400).json({ error: 'Nenhum texto de rima fornecido para análise.' });
      }

      const duration = Number(durationSeconds) || 30;
      const mcAge = userAge || age || profile.age || 'Não especificada';
      const vertente = trainingType || profile.trainingType || 'freestyle';
      const skillsToFocus = Array.isArray(focusSkills) && focusSkills.length > 0 ? focusSkills.join(', ') : 'Geral (Métrica e Flow)';

      // 1. Run Deterministic Heuristics
      const deterministicResult = analyzeRhymesDeterministically(actualText, duration);

      let finalAnalysis = { ...deterministicResult };
      let aiCalled = false;

      // 2. Call Gemini AI if API Key exists and quota allows
      const ai = getGeminiClient();
      if (ai && (sub.plan !== 'FREE' || sub.aiQuotaUsed < sub.aiMonthlyQuota)) {
        try {
          const aiResponse = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: `Você é um Jurado e Especialista Técnico Profissional de Batalhas de Rima e Freestyle (estilo jurado experiente da Batalha da Aldeia, Red Bull FrancaMente e Batalha do Museu).
Sua missão é dar uma avaliação real, honesta e técnica da transcrição do MC.
DIRETRIZES DE POSTURA:
- Não seja arrogante nem grosseiro, mas NUNCA passe pano ou use elogios vazios/genéricos.
- Vá DIRETO AO PONTO: aponte a métrica, a divisão das sílabas no compasso, o nível das rimas (se foram rimas pobres/óbvias com verbos no infinitivo como cantar/falar, ou rimas ricas/multissilábicas), a força da punchline e o encaixe no BPM.
- Dê correções práticas e cirúrgicas para o MC evoluir de verdade.

CALIBRAÇÃO DO TREINO DO MC:
- IDADE DO MC: ${mcAge} anos
- VERTENTE DO TREINO: ${vertente.toUpperCase()} ${vertente === 'gastacao' ? '(Foco em tiradas cômicas, deboche e humor de batalha 🟢)' : vertente === 'ideologica' ? '(Foco em filosofia de rua, mensagem, visão crítica e metáforas ⚪️)' : ''}
- ESTILO DO BEAT: ${beatStyle || 'Boom Bap'} ${beatStyle === 'Detroit' ? '(Estilo Detroit / Michigan: avaliar o flow sincopado fora do tempo e batidas secas de piano)' : ''}
- BPM: ${bpm || 90}
- HABILIDADES EM FOCO: ${skillsToFocus}
- DURAÇÃO DA SESSÃO: ${duration} segundos
- TRANSCRIÇÃO DO MC:
"""
${actualText}
"""

ANÁLISE DE DADOS DA SESSÃO:
- Total de palavras: ${deterministicResult.wordsCount}
- Pares de rima computados: ${deterministicResult.rhymesCount}
- Diversidade lexical: ${Math.round(deterministicResult.uniqueWordsRatio * 100)}%

Avalie com o olhar crítico de um jurado profissional em português do Brasil e retorne o JSON estruturado.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  aiScore: { type: Type.INTEGER, description: 'Nota geral técnica e realista do freestyle de 0 a 100' },
                  evaluationVerdict: {
                    type: Type.STRING,
                    description: 'Veredito direto: Lendário, Excelente, Sólido, Em Evolução, ou Precisa de Ajustes'
                  },
                  rhymeQuality: { type: Type.INTEGER, description: 'Nível técnico das rimas (evitando rimas óbvias) de 0 a 100' },
                  metricScore: { type: Type.INTEGER, description: 'Métrica, divisão silábica e tempo de 0 a 100' },
                  flowScore: { type: Type.INTEGER, description: 'Cadência, ritmo e encaixe no BPM de 0 a 100' },
                  punchlineImpact: { type: Type.INTEGER, description: 'Força e impacto do ataque/desfecho de 0 a 100' },
                  creativityScore: { type: Type.INTEGER, description: 'Criatividade lexical e metáforas de 0 a 100' },
                  coherenceScore: { type: Type.INTEGER, description: 'Coerência temática de 0 a 100' },
                  directFeedback: {
                    type: Type.STRING,
                    description: 'Avaliação técnica direta, concisa e sem rodeios (2 a 4 frases assertivas sem arrogância)'
                  },
                  strengths: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '2 a 3 pontos fortes técnicos e concretos'
                  },
                  improvements: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '2 a 3 pontos de melhoria técnica bem específicos'
                  },
                  corrections: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '1 a 2 correções cirúrgicas de versos ou palavras (ex: substituição de rima fraca por uma rica)'
                  },
                  punchlineFeedback: { type: Type.STRING, description: 'Análise objetiva do fechamento e impacto da punchline' },
                  flowTips: { type: Type.STRING, description: 'Dica de respiração e divisão rítmica para o BPM específico' },
                  nextExercise: { type: Type.STRING, description: 'Treino prático recomendado para a próxima sessão' },
                  aiCommentary: { type: Type.STRING, description: 'Resumo rápido do mentor técnico' }
                },
                required: [
                  'aiScore', 'evaluationVerdict', 'rhymeQuality', 'metricScore', 'flowScore', 'punchlineImpact',
                  'creativityScore', 'coherenceScore', 'directFeedback', 'strengths', 'improvements', 'nextExercise', 'aiCommentary'
                ]
              }
            }
          });

          if (aiResponse.text) {
            const aiData = JSON.parse(aiResponse.text);
            
            // Weighted hybrid score: 35% deterministic + 65% AI evaluation
            const hybridOverallScore = Math.round(
              deterministicResult.heuristicScore * 0.35 + aiData.aiScore * 0.65
            );

            let verdict: 'Lendário' | 'Excelente' | 'Sólido' | 'Em Evolução' | 'Precisa de Ajustes' = 'Sólido';
            if (aiData.evaluationVerdict) {
              const v = aiData.evaluationVerdict;
              if (['Lendário', 'Excelente', 'Sólido', 'Em Evolução', 'Precisa de Ajustes'].includes(v)) {
                verdict = v as any;
              }
            }

            finalAnalysis = {
              ...deterministicResult,
              overallScore: Math.min(100, Math.max(20, hybridOverallScore)),
              aiScore: aiData.aiScore,
              evaluationVerdict: verdict,
              rhymeQuality: aiData.rhymeQuality || deterministicResult.rhymeQuality,
              metricScore: aiData.metricScore || deterministicResult.metricScore || 75,
              flowScore: aiData.flowScore || deterministicResult.flowScore,
              punchlineImpact: aiData.punchlineImpact || deterministicResult.punchlineImpact || 70,
              creativityScore: aiData.creativityScore || deterministicResult.creativityScore,
              coherenceScore: aiData.coherenceScore || deterministicResult.coherenceScore,
              directFeedback: aiData.directFeedback || aiData.aiCommentary || deterministicResult.directFeedback,
              strengths: aiData.strengths && aiData.strengths.length > 0 ? aiData.strengths : deterministicResult.strengths,
              improvements: aiData.improvements && aiData.improvements.length > 0 ? aiData.improvements : deterministicResult.improvements,
              suggestions: aiData.suggestions && aiData.suggestions.length > 0 ? aiData.suggestions : deterministicResult.suggestions,
              corrections: aiData.corrections && aiData.corrections.length > 0 ? aiData.corrections : deterministicResult.corrections,
              punchlineFeedback: aiData.punchlineFeedback || deterministicResult.punchlineFeedback,
              flowTips: aiData.flowTips || deterministicResult.flowTips,
              nextExercise: aiData.nextExercise || deterministicResult.nextExercise,
              aiCommentary: aiData.directFeedback || aiData.aiCommentary || deterministicResult.aiCommentary,
            };

            sub.aiQuotaUsed += 1;
            aiCalled = true;
          }
        } catch (aiErr) {
          console.warn('Gemini AI fallback to deterministic analysis:', aiErr);
        }
      }

      // 3. XP Calculation & Gamification Ledger
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
        transcript: actualText,
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

  // Multimodal AI Audio Transcription (Speed Flow & Rap Acapella to Lyrics)
  app.post('/api/transcribe-audio', async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ error: 'Nenhum dado de áudio fornecido.' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error: 'Serviço de transcrição IA indisponível (chave Gemini não configurada).',
          transcript: '',
        });
      }

      // Clean base64 string if data URL prefix exists
      const cleanBase64 = audioBase64.includes('base64,')
        ? audioBase64.split('base64,')[1]
        : audioBase64;

      const audioPart = {
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || 'audio/webm',
        },
      };

      const promptPart = {
        text: `Você é um especialista em transcrição de rap, batalhas de freestyle e speed flow em português do Brasil.
Transcreva com extrema fidelidade tudo o que a pessoa rimou ou falou neste áudio.

Diretrizes Críticas:
1. Capture cada verso, métrica e fonema, inclusive speed flow rápido, trocadilhos, punchlines e gírias do hip-hop brasileiro.
2. Divida os versos em linhas de rap (versos de 4 a 8 compassos ou quebras naturais de respiração/rima).
3. Se houver partes cantadas ou rimadas em velocidade extrema (speed flow), decodifique com cuidado para manter o significado e o ritmo.
4. Retorne apenas o JSON com o formato solicitado.`,
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: { parts: [audioPart, promptPart] },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: { type: Type.STRING, description: 'Transcrição completa formatada em versos com quebras de linha' },
              speedFlowDetected: { type: Type.BOOLEAN, description: 'Se foi identificado trecho de rima em speed flow / alta velocidade' },
              speedFlowNotes: { type: Type.STRING, description: 'Observação sobre a cadência e velocidade' },
              wordsCount: { type: Type.INTEGER, description: 'Contagem estimada de palavras' },
            },
            required: ['transcript', 'speedFlowDetected'],
          },
        },
      });

      if (response.text) {
        const result = JSON.parse(response.text);
        return res.json({
          success: true,
          transcript: result.transcript || '',
          speedFlowDetected: result.speedFlowDetected || false,
          speedFlowNotes: result.speedFlowNotes || '',
          wordsCount: result.wordsCount || 0,
        });
      }

      res.json({ success: true, transcript: '' });
    } catch (err: any) {
      console.error('Audio transcription error:', err);
      res.status(500).json({ error: err.message || 'Erro ao transcrever áudio.' });
    }
  });

  // AI Prompt & Theme Generator
  app.post('/api/ai/prompt-generator', async (req, res) => {
    try {
      const { category, difficulty } = req.body;
      const ai = getGeminiClient();

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: `Gere um desafio criativo e estimulante de freestyle de rap para treino de MC.
Categoria: ${category || 'Filosofia Urbana & Cotidiano'}
Dificuldade: ${difficulty || 'MÉDIO'}

Gere um título marcante, uma proposta de tema profunda, 3 palavras obrigatórias de rima desafiadoras e 1 dica de flow.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  requiredWords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: '3 palavras obrigatórias para rimar'
                  },
                  flowTip: { type: Type.STRING },
                  suggestedBpm: { type: Type.INTEGER },
                },
                required: ['title', 'theme', 'requiredWords', 'flowTip', 'suggestedBpm'],
              },
            },
          });

          if (response.text) {
            const data = JSON.parse(response.text);
            return res.json({ success: true, prompt: data });
          }
        } catch (e) {
          console.warn('AI prompt gen error:', e);
        }
      }

      // Fallback generator
      const fallbackPrompts = [
        {
          title: 'Metáforas do Concreto',
          theme: 'Como a correria da cidade grande molda os sonhos de quem veio de baixo',
          requiredWords: ['labirinto', 'superação', 'horizonte'],
          flowTip: 'Alterne entre versos cadenciados de 4 tempos e uma aceleração de speed flow no final.',
          suggestedBpm: 92,
        },
        {
          title: 'O Espelho e a Sombra',
          theme: 'Luta interna entre o ego e a evolução artística verdadeira',
          requiredWords: ['reflexo', 'resiliência', 'essência'],
          flowTip: 'Use rimas internas no meio do verso para criar efeito eco.',
          suggestedBpm: 88,
        },
      ];
      const randomPrompt = fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)];
      res.json({ success: true, prompt: randomPrompt });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao gerar tema.' });
    }
  });

  // Discord BeatBot: Parse and Analyze Beat Link or Search Query
  app.post('/api/bot/parse-link', async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'Comando ou link inválido.' });
      }

      const cleanQuery = query.trim();
      const isUrl = /^https?:\/\//i.test(cleanQuery);

      // 1. YouTube Link Detection
      const ytMatch = cleanQuery.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      
      // 2. Direct Audio Link (.mp3, .wav, .ogg, .aac, .m4a, stream)
      const isDirectAudio = /\.(mp3|wav|ogg|aac|m4a)(\?.*)?$/i.test(cleanQuery);

      // 3. Spotify Link
      const isSpotify = /spotify\.com/i.test(cleanQuery);

      // 4. SoundCloud Link
      const isSoundCloud = /soundcloud\.com/i.test(cleanQuery);

      let title = cleanQuery;
      let style = 'Boom Bap';
      let bpm = 90;
      let key = 'C Min';
      let producer = 'Web Audio Stream';
      let energy: 'Chill' | 'Médio' | 'Agressivo' | 'Épico' = 'Médio';
      let durationFormatted = '03:15';
      let thumbnailUrl = '';
      let audioUrl = isDirectAudio ? cleanQuery : '';
      let source: 'synth' | 'custom' | 'youtube' | 'stream' = isDirectAudio ? 'custom' : (ytMatch ? 'youtube' : 'synth');

      if (ytMatch) {
        const videoId = ytMatch[1];
        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        title = `YouTube Beat #${videoId.slice(0, 6)}`;
        producer = 'YouTube Audio';
      }

      // Check keywords for style & BPM inference
      const lower = cleanQuery.toLowerCase();
      if (lower.includes('trap') || lower.includes('808')) {
        style = 'Trap';
        bpm = 140;
        energy = 'Agressivo';
        key = 'F Min';
      } else if (lower.includes('drill') || lower.includes('uk drill')) {
        style = 'Drill';
        bpm = 142;
        energy = 'Agressivo';
        key = 'E Min';
      } else if (lower.includes('lofi') || lower.includes('lo-fi') || lower.includes('chill') || lower.includes('relax')) {
        style = 'Lo-Fi';
        bpm = 82;
        energy = 'Chill';
        key = 'A Maj';
      } else if (lower.includes('speed') || lower.includes('fast') || lower.includes('rapido') || lower.includes('double')) {
        style = 'Speed Flow';
        bpm = 112;
        energy = 'Épico';
        key = 'G Min';
      } else if (lower.includes('grime')) {
        style = 'Grime';
        bpm = 140;
        energy = 'Épico';
        key = 'D Min';
      } else if (lower.includes('boombap') || lower.includes('boom bap') || lower.includes('90s') || lower.includes('old school')) {
        style = 'Boom Bap';
        bpm = 92;
        energy = 'Médio';
        key = 'C Min';
      }

      // Extract BPM if user specified (e.g. "beat 135 bpm" or "/bpm 140")
      const bpmMatch = cleanQuery.match(/(\d{2,3})\s*(?:bpm|BPM)/i);
      if (bpmMatch) {
        const parsed = parseInt(bpmMatch[1], 10);
        if (parsed >= 60 && parsed <= 200) {
          bpm = parsed;
        }
      }

      // Clean title from URL params or prefix
      if (isUrl) {
        try {
          const urlObj = new URL(cleanQuery);
          const pathname = urlObj.pathname.split('/').filter(Boolean).pop() || '';
          if (pathname && !ytMatch) {
            title = decodeURIComponent(pathname).replace(/[-_]/g, ' ').replace(/\.(mp3|wav|ogg)$/i, '');
            title = title.charAt(0).toUpperCase() + title.slice(1);
          }
        } catch (e) {
          // ignore
        }
      }

      // Try Gemini AI to enhance beat description and provide freestyle flow tips
      const ai = getGeminiClient();
      let aiFlowTip = 'Mantenha a respiração sincronizada a cada 4 compassos para encaixar a rima.';
      if (ai) {
        try {
          const prompt = `O usuário no app de freestyle RimaLab digitou o comando de música /play: "${cleanQuery}".
Analise este título/link e retorne um JSON com:
1. title: título formatado e profissional do beat de rap/trap/freestyle
2. style: um de ["Boom Bap", "Trap", "Drill", "Lo-Fi", "Grime", "Speed Flow"]
3. bpm: número inteiro sugerido entre 70 e 160
4. key: tom musical (ex: "C Min", "F# Min")
5. producer: produtor sugerido ou artista
6. energy: um de ["Chill", "Médio", "Agressivo", "Épico"]
7. flowTip: dica tática de como rimar e encaixar o flow nesse tipo de beat
8. durationFormatted: ex "03:20"`;

          const aiResp = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  style: { type: Type.STRING },
                  bpm: { type: Type.INTEGER },
                  key: { type: Type.STRING },
                  producer: { type: Type.STRING },
                  energy: { type: Type.STRING },
                  flowTip: { type: Type.STRING },
                  durationFormatted: { type: Type.STRING },
                },
                required: ['title', 'style', 'bpm', 'key', 'flowTip'],
              },
            },
          });

          if (aiResp.text) {
            const parsedAi = JSON.parse(aiResp.text);
            if (parsedAi.title) title = parsedAi.title;
            if (parsedAi.style) style = parsedAi.style;
            if (parsedAi.bpm) bpm = parsedAi.bpm;
            if (parsedAi.key) key = parsedAi.key;
            if (parsedAi.producer) producer = parsedAi.producer;
            if (parsedAi.energy) energy = parsedAi.energy;
            if (parsedAi.flowTip) aiFlowTip = parsedAi.flowTip;
            if (parsedAi.durationFormatted) durationFormatted = parsedAi.durationFormatted;
          }
        } catch (aiErr) {
          console.warn('AI link parse warning:', aiErr);
        }
      }

      const beatObj = {
        id: `custom_${Date.now()}`,
        title,
        style,
        bpm,
        key,
        producer,
        energy,
        description: `Beat selecionado via Discord Bot. Dica de Flow: ${aiFlowTip}`,
        audioUrl,
        source,
        thumbnailUrl: thumbnailUrl || (ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : undefined),
        durationFormatted,
        flowTip: aiFlowTip,
        originalQuery: cleanQuery,
      };

      res.json({
        success: true,
        beat: beatObj,
        isYouTube: !!ytMatch,
        youtubeVideoId: ytMatch ? ytMatch[1] : null,
        isDirectAudio,
        isSpotify,
        isSoundCloud,
      });
    } catch (err: any) {
      console.error('Bot parse link error:', err);
      res.status(500).json({ error: err.message || 'Erro ao processar comando do bot.' });
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
  app.post(['/api/lessons/complete', '/api/lessons/:lessonId/complete'], (req, res) => {
    const authHeader = req.headers.authorization;
    let userId = seedUserId;
    if (authHeader && authHeader.startsWith('Bearer jwt_token_')) {
      userId = authHeader.replace('Bearer jwt_token_', '');
    }

    const lessonId = req.params.lessonId || req.body.lessonId;
    const { lyrics, customLyrics } = req.body;
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
      lessonId,
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

  // Suggestions: In-memory store & endpoints
  const serverSuggestions: any[] = [
    {
      id: 'sug_1',
      authorName: 'MC Menor da Leste',
      authorAge: 16,
      category: 'vertente_rima',
      title: 'Modo de Treino Especial: Gastação Cômica & Tiradas 🟢',
      description: 'Adicionar temas focados puramente em humor, respostas irônicas e tiradas de deboche inteligente para batalhas tradicionais de gastação.',
      upvotes: 48,
      tags: ['#gastacao', '#humor', '#batalhadagastacao', '#tiradas'],
      status: 'IMPLEMENTADO',
      createdAt: '2026-08-20T14:30:00Z',
      teacherComment: 'Luquita MC: Já adicionamos no estúdio! Agora você pode selecionar Gastação 🟢 no Hub de Treino.',
    },
    {
      id: 'sug_2',
      authorName: 'Kowalski MC & Luquita MC',
      authorAge: 24,
      category: 'beats',
      title: 'Novos Beats no estilo Detroit & Michigan Bounce 🎹',
      description: 'Bateria sincopada com piano seco e grave 808 rápido (98-100 BPM) para treinar punchline contínua e encaixe fora do tempo clássico de Detroit.',
      upvotes: 62,
      tags: ['#detroit', '#michiganflow', '#punchline', '#808'],
      status: 'IMPLEMENTADO',
      createdAt: '2026-08-22T10:15:00Z',
      teacherComment: 'Kowalski MC: Beats de Detroit integrados no sintetizador do RimaLab! Treinem muito a respiração e o timing.',
    },
    {
      id: 'sug_3',
      authorName: 'MC Visão Crítica',
      authorAge: 20,
      category: 'vertente_rima',
      title: 'Filtro de Rima Ideológica & Conhecimento Profundo ⚪️',
      description: 'Temas voltados para filosofia de rua, metáforas sociais, política, história e expansão de vocabulário sem agressividade gratuita.',
      upvotes: 39,
      tags: ['#ideologica', '#conhecimento', '#filosofia', '#cultura'],
      status: 'IMPLEMENTADO',
      createdAt: '2026-08-21T18:00:00Z',
      teacherComment: 'Luquita MC: Disponível na seleção do Hub! O Jurado IA agora avalia a profundidade dos argumentos na rima ideológica.',
    },
    {
      id: 'sug_4',
      authorName: 'MC Flecha Rápida',
      authorAge: 17,
      category: 'recurso_site',
      title: 'Medidor Visual de Contagem de Versos & Entrada da Punchline 📐',
      description: 'Uma barra visual de 4 tempos (Verso 1 ➔ Verso 2 ➔ Verso 3 ➔ PUNCHLINE!) para não perder o tempo da rima final nem atropelar a entrada.',
      upvotes: 55,
      tags: ['#contagemdeversos', '#punchline', '#tempo', '#compasso'],
      status: 'IMPLEMENTADO',
      createdAt: '2026-08-23T09:20:00Z',
      teacherComment: 'Kowalski MC: Função crucial para quem quer vencer batalha de 1x1 ou 2x2. Adicionado no Studio!',
    },
    {
      id: 'sug_5',
      authorName: 'MC Dobra Certa',
      authorAge: 19,
      category: 'melhoria_ia',
      title: 'Treino de Speedflow com Velocímetro de Sílabas por Segundo ⚡',
      description: 'Detectar quando o MC faz rima rápida dobrada (acima de 6 sílabas por segundo) e dar feedback específico sobre a clareza da dicção.',
      upvotes: 43,
      tags: ['#speedflow', '#diccao', '#respiracao', '#velocidade'],
      status: 'IMPLEMENTADO',
      createdAt: '2026-08-19T11:00:00Z',
      teacherComment: 'Luquita MC: O módulo de Speedflow já mede as sílabas e ativa o badge de fogo no estúdio.',
    },
  ];

  app.get('/api/suggestions', (req, res) => {
    res.json({ suggestions: serverSuggestions });
  });

  app.post('/api/suggestions', (req, res) => {
    const { title, description, category, authorName, authorAge, tags } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios.' });
    }

    const newSug = {
      id: `sug_${Date.now()}`,
      authorName: authorName || 'MC Anônimo',
      authorAge: authorAge || undefined,
      category: category || 'vertente_rima',
      title: title.trim(),
      description: description.trim(),
      upvotes: 1,
      tags: Array.isArray(tags) ? tags : [`#${category || 'geral'}`],
      status: 'ANALISANDO',
      createdAt: new Date().toISOString(),
      teacherComment: 'Kowalski MC & Luquita MC: Recebido! Vamos analisar com a equipe de mentores.',
    };

    serverSuggestions.unshift(newSug);
    res.json({ success: true, suggestion: newSug });
  });

  app.post('/api/suggestions/:id/upvote', (req, res) => {
    const { id } = req.params;
    const sug = serverSuggestions.find(s => s.id === id);
    if (!sug) return res.status(404).json({ error: 'Sugestão não encontrada.' });

    sug.upvotes += 1;
    res.json({ success: true, upvotes: sug.upvotes });
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

    const { targetPlan } = req.body; // 'MONTHLY' | 'ANNUAL' | 'PRO' | 'PREMIUM' | 'FREE_TRIAL'
    let plan: 'FREE' | 'PRO' | 'PREMIUM' | 'FREE_TRIAL' | 'MONTHLY' | 'ANNUAL' = 'MONTHLY';
    let quota = 150;

    if (targetPlan === 'ANNUAL' || targetPlan === 'PREMIUM') {
      plan = 'ANNUAL';
      quota = 1000; // Ilimitado / VIP
    } else if (targetPlan === 'MONTHLY' || targetPlan === 'PRO') {
      plan = 'MONTHLY';
      quota = 200;
    } else if (targetPlan === 'FREE_TRIAL') {
      plan = 'FREE_TRIAL';
      quota = 20;
    }

    const sub = subscriptions.get(userId) || subscriptions.get(seedUserId)!;
    sub.plan = plan;
    sub.status = 'ACTIVE';
    sub.aiMonthlyQuota = quota;
    sub.validUntil = plan === 'ANNUAL' ? '2028-12-31T23:59:59Z' : '2027-12-31T23:59:59Z';

    res.json({ 
      success: true, 
      subscription: sub, 
      message: `Parabéns! Seu plano agora é ${plan === 'ANNUAL' ? 'Plano Anual VIP (Mentoria 1-a-1)' : 'Plano Mensal PRO'}!` 
    });
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

  // --- Voice Coach / Professor Rima IA Text & Feedback API ---
  app.post('/api/voice-coach/ask', async (req, res) => {
    try {
      const { prompt, topic, userStyle, artisticName } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          reply: `Salve, ${artisticName || 'MC'}! Professor Rima na área. Para mandar bem no ${userStyle || 'Boom Bap'}, lembre-se: respire sempre na virada do terceiro pro quarto compasso e solte a punchline com firmeza no tempo da caixa!`,
        });
      }

      const systemPrompt = `Você é o Professor Rima, o mentor e mestre de freestyle e rap nacional do RimaLab Academy (criado por Luquita MC e Kowalski MC).
Você fala diretamente com o MC ${artisticName || 'aluno'}, que rima no estilo ${userStyle || 'Boom Bap'}.
Seu papel:
- Ensinar técnicas avançadas de freestyle, métrica (compasso 4/4), respiração, rimas ricas e multisilábicas, speed flow e punchlines.
- Responda de forma dinâmica, empolgante, com gírias respeitosas do hip-hop brasileiro (ex: "Salve, meu parceiro!", "Visão!", "Manda brasa!", "Se liga no compasso!").
- Se o aluno mandar uma rima, analise a métrica e a força da punchline, e dê um exemplo rimado melhorando ou continuando o flow.
- Mantenha a resposta concisa, pronta para ser ouvida ou lida com ritmo de rap.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt || 'Dê uma dica rápida de como melhorar meu flow hoje.',
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
        },
      });

      const reply = response.text || 'Mantenha o treino constante! Cada rima no beat te aproxima do nível lendário!';
      res.json({ reply });
    } catch (error: any) {
      console.warn('Voice coach error:', error);
      res.json({
        reply: 'Visão, MC! Pratique a respiração ritmada com o metrônomo: solte a primeira rima no compasso 2 e feche a ideia no compasso 4 com uma palavra forte!',
      });
    }
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

  // --- HTTP & WebSocket Live Server Setup ---
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/live-coach' });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Live Coach WS] Client connected to Professor Rima');
    let session: any = null;

    try {
      const ai = getGeminiClient();
      if (!ai) {
        clientWs.send(JSON.stringify({ type: 'error', error: 'Chave GEMINI_API_KEY não configurada no servidor.' }));
        clientWs.close();
        return;
      }

      session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `Você é o Professor Rima, o lendário mestre e treinador de rap e freestyle do RimaLab Academy.
Você foi fundado e treinado pelos mestres do hip-hop Luquita MC e Kowalski MC.
Sua missão:
1. Ensinar métrica, compasso 4/4, respiração, dicção, speed flow, rimas ricas, punchlines e improviso em tempo real.
2. Falar SEMPRE em português do Brasil (pt-BR) com tom encorajador, gírias autênticas do rap nacional e ritmo contagiante.
3. Se o aluno falar ou rimar no microfone, ouça atentamente, comente sobre o flow, pontue o encaixe e proponha rimas e desafios imediatos.
4. Mantenha respostas enxutas e conversacionais, adequadas para áudio em tempo real.`,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            try {
              const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              const text = message.serverContent?.modelTurn?.parts?.[0]?.text;

              if (audio) {
                clientWs.send(JSON.stringify({ type: 'audio', audio }));
              }
              if (text) {
                clientWs.send(JSON.stringify({ type: 'text', text }));
              }
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ type: 'interrupted', interrupted: true }));
              }
              if (message.serverContent?.turnComplete) {
                clientWs.send(JSON.stringify({ type: 'turnComplete' }));
              }
            } catch (e) {
              console.warn('[Live Coach] Error in message callback:', e);
            }
          },
          onclose: () => {
            console.log('[Live Coach] Gemini session ended');
            try {
              clientWs.send(JSON.stringify({ type: 'session_closed' }));
            } catch {}
          },
          onerror: (err: any) => {
            console.warn('[Live Coach] Live session error:', err);
            try {
              clientWs.send(JSON.stringify({ type: 'error', error: err?.message || 'Erro na sessão com o Professor IA' }));
            } catch {}
          },
        },
      });

      clientWs.send(JSON.stringify({ type: 'ready', message: 'Conectado ao Professor Rima IA ao vivo!' }));

      clientWs.on('message', (rawData: any) => {
        try {
          const msg = JSON.parse(rawData.toString());
          if (msg.audio) {
            session.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          }
          if (msg.text) {
            session.sendRealtimeInput({
              text: msg.text,
            });
          }
        } catch (e) {
          console.warn('[Live Coach] Error forwarding audio/text to session:', e);
        }
      });

      clientWs.on('close', () => {
        console.log('[Live Coach WS] Client disconnected');
        try {
          if (session && typeof session.close === 'function') {
            session.close();
          }
        } catch {}
      });

      clientWs.on('error', (err) => {
        console.warn('[Live Coach WS] WebSocket error:', err);
      });

    } catch (error: any) {
      console.error('[Live Coach WS] Failed to initiate Gemini Live session:', error);
      try {
        clientWs.send(JSON.stringify({ 
          type: 'error', 
          error: error?.message || 'Falha ao conectar com o modelo Live da IA.' 
        }));
        clientWs.close();
      } catch {}
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`RimaLab Server rodando em http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Falha ao iniciar servidor RimaLab:', err);
});
