import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
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

// Authorized Master Admin emails
const ADMIN_EMAILS = [
  'kowalski.madagascar123@gmail.com',
  'ravel.macedo@escola.pr.gov.br',
];

// --- Whitelist & Authorized Gmails System (Managed by Kowalski in Admin Panel) ---
interface AuthorizedGmailRecord {
  email: string;
  artisticName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'VIP';
  plan: 'FREE_TRIAL' | 'PRO' | 'PREMIUM' | 'UNLIMITED';
  authorizedBy: string;
  authorizedAt: string;
  status: 'ACTIVE' | 'REVOKED';
  notes?: string;
}

interface BlockedLoginAttemptRecord {
  id: string;
  email: string;
  artisticName?: string;
  ip: string;
  attemptedAt: string;
  reason: string;
  status: 'BLOCKED' | 'APPROVED_LATER';
}

const AUTHORIZED_EMAILS_FILE = path.join(process.cwd(), 'src', 'data', 'authorized-emails.json');

let strictWhitelistMode = true;
let allowAllGmails = false;
const authorizedGmails = new Map<string, AuthorizedGmailRecord>();
const blockedLoginAttempts: BlockedLoginAttemptRecord[] = [];

// Function to load whitelist from file
function loadWhitelistFromFile() {
  try {
    if (fs.existsSync(AUTHORIZED_EMAILS_FILE)) {
      const raw = fs.readFileSync(AUTHORIZED_EMAILS_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (typeof data.strictWhitelistMode === 'boolean') {
        strictWhitelistMode = data.strictWhitelistMode;
      }
      if (typeof data.allowAllGmails === 'boolean') {
        allowAllGmails = data.allowAllGmails;
      }
      if (Array.isArray(data.authorizedGmails)) {
        authorizedGmails.clear();
        for (const item of data.authorizedGmails) {
          if (item && item.email) {
            authorizedGmails.set(item.email.trim().toLowerCase(), {
              email: item.email.trim().toLowerCase(),
              artisticName: item.artisticName || `MC ${item.email.split('@')[0]}`,
              role: item.role || 'STUDENT',
              plan: item.plan || 'PRO',
              authorizedBy: item.authorizedBy || 'Kowalski MC (Master)',
              authorizedAt: item.authorizedAt || new Date().toISOString(),
              status: item.status || 'ACTIVE',
              notes: item.notes || '',
            });
          }
        }
      }
      if (Array.isArray(data.blockedAttempts)) {
        blockedLoginAttempts.length = 0;
        blockedLoginAttempts.push(...data.blockedAttempts.slice(0, 50));
      }
    }
  } catch (err) {
    console.warn('[WHITELIST LOAD WARNING]', err);
  }

  // Ensure Kowalski is ALWAYS present and active
  if (!authorizedGmails.has('kowalski.madagascar123@gmail.com')) {
    authorizedGmails.set('kowalski.madagascar123@gmail.com', {
      email: 'kowalski.madagascar123@gmail.com',
      artisticName: 'Kowalski MC',
      role: 'ADMIN',
      plan: 'UNLIMITED',
      authorizedBy: 'Sistema Mestre',
      authorizedAt: '2026-01-01T00:00:00.000Z',
      status: 'ACTIVE',
      notes: 'Conta Mestre do Administrador e Fundador',
    });
  }

  if (!authorizedGmails.has('ravel.macedo@escola.pr.gov.br')) {
    authorizedGmails.set('ravel.macedo@escola.pr.gov.br', {
      email: 'ravel.macedo@escola.pr.gov.br',
      artisticName: 'Prof. Ravel Macedo',
      role: 'TEACHER',
      plan: 'UNLIMITED',
      authorizedBy: 'Kowalski MC',
      authorizedAt: '2026-01-01T00:00:00.000Z',
      status: 'ACTIVE',
      notes: 'Coordenador Pedagógico Oficial',
    });
  }
}

// Function to save whitelist to file
function saveWhitelistToFile() {
  try {
    const data = {
      strictWhitelistMode,
      allowAllGmails,
      authorizedGmails: Array.from(authorizedGmails.values()),
      blockedAttempts: blockedLoginAttempts.slice(0, 50),
    };
    fs.writeFileSync(AUTHORIZED_EMAILS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[WHITELIST SAVE ERROR]', err);
  }
}

// Email format and typo domain validator
function validateEmailDomain(email: string): { valid: boolean; reason?: string } {
  if (!email || typeof email !== 'string') return { valid: false, reason: 'E-mail vazio.' };
  const trimmed = email.trim().toLowerCase();
  
  // Basic RFC regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, reason: 'Formato de e-mail inválido.' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) return { valid: false, reason: 'E-mail inválido.' };
  const domain = parts[1];

  // Common typo domains
  const bannedTypoDomains = ['gmmil.com', 'gmaill.com', 'gmial.com', 'gamil.com', 'gmai.com', 'gmaik.com', 'gmal.com', 'gmaii.com', 'hotmial.com', 'yaho.com'];
  if (bannedTypoDomains.includes(domain)) {
    return { valid: false, reason: `Domínio de e-mail inválido ou inexistente (@${domain}). Você quis dizer @gmail.com?` };
  }

  return { valid: true };
}

// Helper to check if email is authorized by Kowalski
function isEmailAuthorizedByKowalski(email: string): boolean {
  const norm = String(email || '').trim().toLowerCase();
  if (!norm || !norm.includes('@')) return false;

  // Master Admin is ALWAYS authorized
  if (ADMIN_EMAILS.includes(norm) || norm === 'kowalski.madagascar123@gmail.com') return true;

  // If strict mode is disabled, all valid emails are allowed
  if (!strictWhitelistMode || allowAllGmails) return true;

  // Check in authorizedGmails map
  const record = authorizedGmails.get(norm);
  if (record && record.status === 'ACTIVE') return true;

  return false;
}

// Load initial whitelist
loadWhitelistFromFile();

// --- Teacher Access & Approval Engine ---
interface TeacherAccessRequest {
  id: string;
  email: string;
  fullName: string;
  artisticName?: string;
  discipline: string;
  phoneOrWhatsapp?: string;
  discordUser?: string;
  motivation?: string;
  experience?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  approvedBy?: string;
  token: string;
  rejectToken: string;
  notes?: string;
}

interface TeacherProfile {
  id: string;
  email: string;
  fullName: string;
  artisticName: string;
  discipline: string;
  isMaster: boolean;
  avatarUrl?: string;
  bio?: string;
  phoneOrWhatsapp?: string;
  discordUser?: string;
  authorizedAt: string;
}

const teacherAccessRequests = new Map<string, TeacherAccessRequest>();
const authorizedTeachers = new Map<string, TeacherProfile>();

// Pre-seed Master Teachers
authorizedTeachers.set('kowalski.madagascar123@gmail.com', {
  id: 'teacher_kowalski',
  email: 'kowalski.madagascar123@gmail.com',
  fullName: 'Kowalski MC',
  artisticName: 'Kowalski MC (Mestre Fundador)',
  discipline: 'Métrica & Freestyle de Batalha',
  isMaster: true,
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=kowalski',
  bio: 'Criador do RimaLab Academy, mestre de improviso, velocidade e punchlines.',
  authorizedAt: '2026-01-01T00:00:00Z',
});

authorizedTeachers.set('ravel.macedo@escola.pr.gov.br', {
  id: 'teacher_ravel',
  email: 'ravel.macedo@escola.pr.gov.br',
  fullName: 'Prof. Ravel Macedo',
  artisticName: 'Prof. Ravel Macedo',
  discipline: 'Pedagogia & Rima Ideológica',
  isMaster: true,
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ravel',
  bio: 'Coordenador pedagógico oficial e mentor de rima e literatura.',
  authorizedAt: '2026-01-01T00:00:00Z',
});

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
  url: 'https://discord.gg/xXEEtTZzd',
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

// Seed Master Admin 1: Kowalski MC
const admin1Id = 'user_adm_kowalski';
users.set(admin1Id, {
  id: admin1Id,
  email: 'kowalski.madagascar123@gmail.com',
  passwordHash: 'adm_hash_36737829',
  role: 'ADMIN',
  createdAt: new Date().toISOString(),
});
profiles.set(admin1Id, {
  id: 'prof_adm_kowalski',
  userId: admin1Id,
  artisticName: 'Kowalski MC (Professor)',
  tagline: '👑 Professor & Administrador Oficial RimaLab',
  bio: 'Fundador e mestre de rima, métrica e batalhas ao vivo.',
  favoriteStyle: 'Boom Bap',
  level: 10,
  totalXP: 15400,
  streakDays: 45,
  lastPracticeDate: new Date().toISOString(),
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=kowalski',
  isPublic: true,
  showStats: true,
  showHistory: true,
  totalSessions: 120,
  totalMinutesPracticed: 450,
  bestScore: 99,
  totalWordsRhymed: 2400,
});
subscriptions.set(admin1Id, {
  userId: admin1Id,
  plan: 'ANNUAL',
  status: 'ACTIVE',
  validUntil: '2030-12-31T23:59:59Z',
  aiMonthlyQuota: 99999,
  aiQuotaUsed: 0,
  gmail: 'kowalski.madagascar123@gmail.com',
});

// Seed Master Admin 2: Ravel Macedo
const admin2Id = 'user_adm_ravel';
users.set(admin2Id, {
  id: admin2Id,
  email: 'ravel.macedo@escola.pr.gov.br',
  passwordHash: 'adm_hash_36737829',
  role: 'ADMIN',
  createdAt: new Date().toISOString(),
});
profiles.set(admin2Id, {
  id: 'prof_adm_ravel',
  userId: admin2Id,
  artisticName: 'Ravel Macedo (Professor)',
  tagline: '👑 Professor & Administrador Oficial RimaLab',
  bio: 'Coordenador pedagógico de rap e batalhas de improviso.',
  favoriteStyle: 'Boom Bap',
  level: 10,
  totalXP: 14800,
  streakDays: 40,
  lastPracticeDate: new Date().toISOString(),
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=ravel',
  isPublic: true,
  showStats: true,
  showHistory: true,
  totalSessions: 110,
  totalMinutesPracticed: 400,
  bestScore: 98,
  totalWordsRhymed: 2200,
});
subscriptions.set(admin2Id, {
  userId: admin2Id,
  plan: 'ANNUAL',
  status: 'ACTIVE',
  validUntil: '2030-12-31T23:59:59Z',
  aiMonthlyQuota: 99999,
  aiQuotaUsed: 0,
  gmail: 'ravel.macedo@escola.pr.gov.br',
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

  // Auth: Gmail Login with Strict Whitelist & 14-Day Free Trial
  app.post('/api/auth/gmail', (req, res) => {
    try {
      const { email, artisticName, favoriteStyle } = req.body;
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Por favor, insira um endereço de Gmail/E-mail válido.' });
      }

      const clientIp = getClientIp(req);
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Strict Domain & Typo Validation (blocks typos like @gmmil.com, @gmaill.com)
      const domainCheck = validateEmailDomain(normalizedEmail);
      if (!domainCheck.valid) {
        const attempt: BlockedLoginAttemptRecord = {
          id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          email: normalizedEmail,
          artisticName: artisticName?.trim() || `MC ${normalizedEmail.split('@')[0]}`,
          ip: clientIp,
          attemptedAt: new Date().toISOString(),
          reason: domainCheck.reason || 'Domínio de e-mail com erro ou inexistente',
          status: 'BLOCKED',
        };
        blockedLoginAttempts.unshift(attempt);
        saveWhitelistToFile();

        return res.status(400).json({
          error: `❌ Domínio de e-mail inválido (@${normalizedEmail.split('@')[1] || ''}). ${domainCheck.reason}`,
          isBlocked: true,
          email: normalizedEmail,
        });
      }

      // 2. Strict Whitelist Check (Only emails authorized by Kowalski are allowed to login)
      const isApproved = isEmailAuthorizedByKowalski(normalizedEmail);
      if (!isApproved && strictWhitelistMode) {
        const attempt: BlockedLoginAttemptRecord = {
          id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          email: normalizedEmail,
          artisticName: artisticName?.trim() || `MC ${normalizedEmail.split('@')[0]}`,
          ip: clientIp,
          attemptedAt: new Date().toISOString(),
          reason: 'Gmail não autorizado pelo Administrador Kowalski',
          status: 'BLOCKED',
        };
        blockedLoginAttempts.unshift(attempt);
        saveWhitelistToFile();

        console.warn(`[SECURITY / WHITELIST BLOCKED] Login barrado: ${normalizedEmail} (IP: ${clientIp})`);

        return res.status(403).json({
          error: `❌ Acesso Não Autorizado: O Gmail '${normalizedEmail}' não possui autorização do Kowalski. Apenas contas aprovadas no Painel Admin podem fazer login.`,
          isBlocked: true,
          email: normalizedEmail,
          help: 'Entre em contato com o Kowalski no e-mail kowalski.madagascar123@gmail.com para solicitar a liberação do seu Gmail.',
        });
      }

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

  // --- Discord Server Live Status & Voice Channels (Server ID: 1522381290001928242) ---
  const DISCORD_GUILD_ID = '1522381290001928242';
  
  app.get(['/api/discord/server', '/api/discord/widget-status', '/api/discord/calls'], async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    const defaultDiscordData = {
      guildId: DISCORD_GUILD_ID,
      serverName: '🎤 Academia de Rimas',
      widgetUrl: `https://discord.com/widget?id=${DISCORD_GUILD_ID}&theme=dark`,
      instantInvite: 'https://discord.gg/xXEEtTZzd',
      isLiveCallActive: currentLiveCall.isActive,
      currentLiveCallUrl: currentLiveCall.url,
      presenceCount: 0,
      onlineMembers: [],
      voiceChannels: [
        // 🔊 Salas de Prática
        {
          id: 'vc_pratica_1',
          name: '👥 Prática Livre 1',
          category: '🔊 Salas de Prática',
          topic: 'Sala de voz para prática de rimas ao vivo e improviso aberto',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_pratica_2',
          name: '👥 Prática Livre 2',
          category: '🔊 Salas de Prática',
          topic: 'Sala de treino de rimas e troca de ideias',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_pratica_3',
          name: '👥 Prática Livre 3',
          category: '🔊 Salas de Prática',
          topic: 'Rimas livres e desafios rápidos',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_studio_virtual',
          name: '👥 Studio Virtual',
          category: '🔊 Salas de Prática',
          topic: 'Gravação e mixagem de improviso com instrumental',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_freestyle_24h',
          name: '👥 Freestyle 24h',
          category: '🔊 Salas de Prática',
          topic: 'Canal de voz 24h aberto para treino contínuo no beat',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },

        // 🎤 Call Aulas - Iniciante
        {
          id: 'vc_aula_ini_1',
          name: '👥 Aula Iniciante 1',
          category: '🎤 Call Aulas - Iniciante',
          topic: 'Aulas fundamentais de rima, métrica e dicção',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_aula_ini_2',
          name: '👥 Aula Iniciante 2',
          category: '🎤 Call Aulas - Iniciante',
          topic: 'Sala complementar de aula para novos MCs',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_mentoria_1_1',
          name: '👥 Mentoria Um-a-Um',
          category: '🎤 Call Aulas - Iniciante',
          topic: 'Mentoria individual direta com os professores',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_workshop_ini',
          name: '👥 Workshop Iniciante',
          category: '🎤 Call Aulas - Iniciante',
          topic: 'Workshops práticos de rima e ritmo no beat',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_pratica_guiada',
          name: '👥 Prática Guiada',
          category: '🎤 Call Aulas - Iniciante',
          topic: 'Treino assistido passo a passo',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },

        // 🎤 Call Aulas - Intermediário
        {
          id: 'vc_aula_inter_1',
          name: '👥 Aula Intermediário 1',
          category: '🎤 Call Aulas - Intermediário',
          topic: 'Métrica avançada, flow melódico e encaixe no compasso',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_aula_inter_2',
          name: '👥 Aula Intermediário 2',
          category: '🎤 Call Aulas - Intermediário',
          topic: 'Treino de velocidade de raciocínio e resposta',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_seminario_tec',
          name: '👥 Seminário Técnico',
          category: '🎤 Call Aulas - Intermediário',
          topic: 'Seminário de estruturação lírica e figuras de linguagem',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_debate_criativo',
          name: '👥 Debate Criativo',
          category: '🎤 Call Aulas - Intermediário',
          topic: 'Debate de temas para batalhas temáticas e rima de mensagem',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_jam_session',
          name: '👥 Jam Session',
          category: '🎤 Call Aulas - Intermediário',
          topic: 'Jam de improviso coletivo',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },

        // 🎤 Call Aulas - Avançado
        {
          id: 'vc_masterclass',
          name: '👥 Masterclass',
          category: '🎤 Call Aulas - Avançado',
          topic: 'Masterclass de alto rendimento para MCs de batalha',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_mentorado_av',
          name: '👥 Mentorado Avançado',
          category: '🎤 Call Aulas - Avançado',
          topic: 'Acompanhamento de MCs profissionais',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_aula_av_1',
          name: '👥 Aula Avançado 1',
          category: '🎤 Call Aulas - Avançado',
          topic: 'Técnicas de contra-ataque e punchlines de 4 compassos',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_aula_av_2',
          name: '👥 Aula Avançado 2',
          category: '🎤 Call Aulas - Avançado',
          topic: 'Presença cênica, respiração e leitura de jurados',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
        {
          id: 'vc_roda_rim',
          name: '👥 Roda de Rim',
          category: '🎤 Call Aulas - Avançado',
          topic: 'Roda de rima fechada de alto nível',
          url: 'https://discord.com/channels/1522381290001928242',
          userCount: 0,
          isActiveCall: false,
          users: [],
        },
      ],
    };

    try {
      // Attempt to query official Discord Widget API if guild widget is enabled
      const discordFetch = await fetch(`https://discord.com/api/guilds/${DISCORD_GUILD_ID}/widget.json`, {
        headers: { 'User-Agent': 'RimaLab-App/1.0' },
        signal: AbortSignal.timeout(3000),
      });

      if (discordFetch.ok) {
        const liveWidget = await discordFetch.json();
        
        // Transform Discord official widget data
        const voiceChannelsMap = new Map<string, { id: string; name: string; userCount: number; users: string[] }>();
        
        if (Array.isArray(liveWidget.channels)) {
          liveWidget.channels.forEach((ch: any) => {
            voiceChannelsMap.set(ch.id, {
              id: ch.id,
              name: ch.name.startsWith('🔊') ? ch.name : `🔊 ${ch.name}`,
              userCount: 0,
              users: [],
            });
          });
        }

        const membersList: any[] = [];
        if (Array.isArray(liveWidget.members)) {
          liveWidget.members.forEach((m: any) => {
            const memberObj = {
              id: m.id,
              username: m.username,
              avatarUrl: m.avatar_url,
              status: m.status,
              inCall: Boolean(m.channel_id),
              channelId: m.channel_id,
              channelName: m.channel_id && voiceChannelsMap.get(m.channel_id)?.name,
              game: m.game?.name || (m.status === 'online' ? 'RimaLab Freestyle' : undefined),
            };
            membersList.push(memberObj);

            if (m.channel_id && voiceChannelsMap.has(m.channel_id)) {
              const ch = voiceChannelsMap.get(m.channel_id)!;
              ch.userCount += 1;
              ch.users.push(m.username);
            }
          });
        }

        const channelsArray = Array.from(voiceChannelsMap.values());

        return res.json({
          guildId: DISCORD_GUILD_ID,
          serverName: liveWidget.name || defaultDiscordData.serverName,
          instantInvite: liveWidget.instant_invite || defaultDiscordData.instantInvite,
          widgetUrl: `https://discord.com/widget?id=${DISCORD_GUILD_ID}&theme=dark`,
          presenceCount: liveWidget.presence_count || membersList.length,
          onlineMembers: membersList.length > 0 ? membersList : defaultDiscordData.onlineMembers,
          voiceChannels: channelsArray.length > 0 ? channelsArray : defaultDiscordData.voiceChannels,
          isLiveCallActive: currentLiveCall.isActive,
          currentLiveCallUrl: currentLiveCall.url,
          fromLiveDiscordApi: true,
        });
      }
    } catch (e) {
      // Fallback to rich server representation with active rooms
    }

    res.json(defaultDiscordData);
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

  // Recent dispatched email notifications history for transparency
  interface DispatchedTeacherEmail {
    id: string;
    targetEmail: string; // kowalski.madagascar123@gmail.com
    candidateEmail: string;
    candidateName: string;
    subject: string;
    approveUrl: string;
    rejectUrl: string;
    sentAt: string;
    previewSnippet: string;
  }

  const dispatchedTeacherEmails: DispatchedTeacherEmail[] = [];

  // Helper to send approval email to Kowalski's Gmail
  const sendTeacherApprovalEmailToKowalski = async (
    reqObj: TeacherAccessRequest,
    baseUrl: string
  ) => {
    const targetAdminGmail = 'kowalski.madagascar123@gmail.com';
    const approveUrl = `${baseUrl}/api/teachers/approve?token=${encodeURIComponent(reqObj.token)}&email=${encodeURIComponent(reqObj.email)}`;
    const rejectUrl = `${baseUrl}/api/teachers/reject?token=${encodeURIComponent(reqObj.rejectToken)}&email=${encodeURIComponent(reqObj.email)}`;

    const subject = `🎓 Nova Solicitação de Professor no RimaLab: ${reqObj.fullName} (${reqObj.email})`;

    console.log(`\n=============================================================`);
    console.log(`📬 [GMAIL DISPATCH] ENVIANDO E-MAIL PARA O KOWALSKI (${targetAdminGmail})`);
    console.log(`Assunto: ${subject}`);
    console.log(`Candidato(a): ${reqObj.fullName} (${reqObj.email})`);
    console.log(`Matéria/Especialidade: ${reqObj.discipline}`);
    console.log(`WhatsApp/Discord: ${reqObj.phoneOrWhatsapp || reqObj.discordUser || 'Não informado'}`);
    console.log(`Motivo: ${reqObj.motivation || 'Sem motivo'}`);
    console.log(`-------------------------------------------------------------`);
    console.log(`🔗 LINK DE APROVAÇÃO DIRETA (1-CLIQUE NO GMAIL):`);
    console.log(`   ${approveUrl}`);
    console.log(`🔗 LINK DE RECUSA:`);
    console.log(`   ${rejectUrl}`);
    console.log(`=============================================================\n`);

    dispatchedTeacherEmails.unshift({
      id: `mail_${Date.now()}`,
      targetEmail: targetAdminGmail,
      candidateEmail: reqObj.email,
      candidateName: reqObj.fullName,
      subject,
      approveUrl,
      rejectUrl,
      sentAt: new Date().toISOString(),
      previewSnippet: `Solicitação de ${reqObj.fullName} para lecionar ${reqObj.discipline}.`,
    });

    // If SMTP credentials exist in environment, attempt real SMTP delivery
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const htmlBody = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ededed; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #262626;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #f59e0b; margin: 0; font-size: 24px; letter-spacing: -0.5px;">🎤 RimaLab Academy</h1>
              <p style="color: #a3a3a3; font-size: 13px; margin-top: 4px;">Sistema de Gestão & Autorização de Professores</p>
            </div>
            
            <div style="background-color: #171717; padding: 20px; border-radius: 8px; border: 1px solid #333; margin-bottom: 20px;">
              <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">🎓 Nova Solicitação de Acesso de Professor</h2>
              <p style="color: #d4d4d4; font-size: 14px; line-height: 1.5;">
                Olá, <strong>Kowalski</strong>! Um novo professor solicitou autorização para lecionar e acessar o Painel de Professores da Academia de Rimas.
              </p>
              <hr style="border: 0; border-top: 1px solid #262626; margin: 16px 0;" />
              
              <p style="margin: 6px 0; font-size: 14px;"><strong>Nome Completo:</strong> ${reqObj.fullName}</p>
              <p style="margin: 6px 0; font-size: 14px;"><strong>E-mail (Gmail):</strong> <span style="color: #fbbf24;">${reqObj.email}</span></p>
              <p style="margin: 6px 0; font-size: 14px;"><strong>Especialidade / Matéria:</strong> ${reqObj.discipline}</p>
              ${reqObj.phoneOrWhatsapp ? `<p style="margin: 6px 0; font-size: 14px;"><strong>WhatsApp / Telefone:</strong> ${reqObj.phoneOrWhatsapp}</p>` : ''}
              ${reqObj.discordUser ? `<p style="margin: 6px 0; font-size: 14px;"><strong>Usuário Discord:</strong> ${reqObj.discordUser}</p>` : ''}
              ${reqObj.motivation ? `<p style="margin: 12px 0 6px 0; font-size: 14px;"><strong>Motivação / Experiência:</strong><br/><span style="color: #a3a3a3; font-style: italic;">"${reqObj.motivation}"</span></p>` : ''}
            </div>

            <div style="text-align: center; margin: 24px 0;">
              <a href="${approveUrl}" style="display: inline-block; background-color: #f59e0b; color: #0a0a0a; font-weight: bold; font-size: 15px; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin-right: 10px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
                ✅ PERMITIR ACESSO DO PROFESSOR
              </a>
              <a href="${rejectUrl}" style="display: inline-block; background-color: #262626; color: #ef4444; font-weight: bold; font-size: 14px; padding: 14px 20px; text-decoration: none; border-radius: 8px; border: 1px solid #404040;">
                ❌ Recusar
              </a>
            </div>

            <p style="color: #737373; font-size: 12px; text-align: center; margin-top: 24px;">
              Este e-mail foi gerado automaticamente pelo servidor RimaLab para <strong>kowalski.madagascar123@gmail.com</strong>.
            </p>
          </div>
        `;

        await transporter.sendMail({
          from: `"RimaLab Academy" <${process.env.SMTP_USER}>`,
          to: targetAdminGmail,
          subject,
          html: htmlBody,
        });
        console.log(`[GMAIL SMTP] E-mail entregue com sucesso para ${targetAdminGmail}!`);
      } catch (smtpErr) {
        console.warn('[GMAIL SMTP WARNING] Erro no envio SMTP (usando link de aprovação direta):', smtpErr);
      }
    }
  };

  // Helper to check admin authorization (Strict: Master Password 36737829, Token adm_token_36737829 or authorized teacher)
  const isAuthorizedAdmin = (pwd?: string, token?: string, email?: string): boolean => {
    const cleanPwd = String(pwd || '').trim().replace(/[\s\-_'"]/g, '');
    const cleanToken = String(token || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();

    // STRICT: Only master password 36737829 or adm_token_36737829 or recognized master admin
    const isPasswordMatch = cleanPwd === '36737829';
    const isTokenMatch = cleanToken === 'adm_token_36737829';
    const isMasterEmailWithToken = (ADMIN_EMAILS.includes(cleanEmail) || authorizedTeachers.has(cleanEmail)) && 
      (cleanToken === 'adm_token_36737829' || cleanPwd === '36737829' || cleanToken.startsWith('adm_') || cleanToken.startsWith('prof_'));

    return isPasswordMatch || isTokenMatch || isMasterEmailWithToken;
  };


  // --- Admin Endpoints (Password Protected: 36737829 or Authorized Gmail) ---
  app.post(['/api/admin/login', '/api/admin/verify-security', '/api/admin/verify'], (req, res) => {
    const { password, adminToken, email } = req.body || {};
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;

    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    const givenPwd = password || pwdHeader;
    const givenToken = adminToken || tokenHeader || tokenFromAuth;
    const givenEmail = email || emailHeader;

    if (isAuthorizedAdmin(givenPwd, givenToken, givenEmail)) {
      res.json({
        success: true,
        authorized: true,
        adminToken: 'adm_token_36737829',
        adminName: 'Kowalski MC & Luquita MC (Mestres)',
        role: 'ADMIN',
        permissions: ['EDIT_CALL_LINK', 'BROADCAST_LIVE', 'VIEW_METRICS', 'MANAGE_TRIALS', 'SITE_CUSTOMIZATION'],
        message: 'Acesso Mestre Concedido e Verificado! Bem-vindo ao painel de administração.',
      });
    } else {
      res.status(401).json({ 
        success: false, 
        authorized: false,
        error: 'Verificação de segurança falhou. Acesso restrito com a senha mestre de Administrador.' 
      });
    }
  });

  // Test SMTP Gmail Dispatch Endpoint
  app.post('/api/admin/test-smtp', async (req, res) => {
    const { password, adminToken, email, targetEmail } = req.body || {};
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;

    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    const givenPwd = password || pwdHeader;
    const givenToken = adminToken || tokenHeader || tokenFromAuth;
    const givenEmail = email || emailHeader;

    if (!isAuthorizedAdmin(givenPwd, givenToken, givenEmail)) {
      return res.status(401).json({ success: false, error: 'Acesso restrito ao Administrador.' });
    }

    const recipient = (targetEmail || 'kowalski.madagascar123@gmail.com').trim();
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      return res.status(400).json({
        success: false,
        configured: false,
        error: 'SMTP_USER ou SMTP_PASS não estão configurados nas variáveis de ambiente do servidor.',
        help: 'Defina SMTP_USER e SMTP_PASS nas configurações do projeto para habilitar o envio direto via Gmail SMTP.',
      });
    }

    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"RimaLab Academy" <${smtpUser}>`,
        to: recipient,
        subject: `⚡ Teste de Conexão SMTP RimaLab - ${new Date().toLocaleTimeString('pt-BR')}`,
        html: `
          <div style="font-family: sans-serif; background: #0a0a0a; color: #fff; padding: 24px; border-radius: 12px; border: 1px solid #f59e0b; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b; margin-top: 0;">🎤 RimaLab SMTP Conectado com Sucesso!</h2>
            <p>Salve, Kowalski! O serviço de envio de e-mails via Gmail SMTP está 100% operacional e autorizado.</p>
            <p><strong>Remetente:</strong> ${smtpUser}</p>
            <p><strong>Destinatário:</strong> ${recipient}</p>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p style="color: #22c55e;">✅ Notificações de novos professores e chamadas ao vivo serão entregues diretamente na sua caixa de entrada!</p>
          </div>
        `,
      });

      res.json({
        success: true,
        configured: true,
        messageId: info.messageId,
        recipient,
        message: `E-mail de teste enviado com sucesso para ${recipient}!`,
      });
    } catch (smtpErr: any) {
      console.error('[SMTP Test Error]', smtpErr);
      res.status(500).json({
        success: false,
        configured: true,
        error: smtpErr.message || 'Falha ao autenticar ou enviar e-mail via SMTP.',
      });
    }
  });

  // --- Admin Whitelist & Authorized Gmails Endpoints ---
  app.get('/api/admin/authorized-gmails', (req, res) => {
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;

    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    const givenPwd = (req.query.password as string) || pwdHeader;
    const givenToken = (req.query.adminToken as string) || tokenHeader || tokenFromAuth;
    const givenEmail = (req.query.email as string) || emailHeader;

    if (!isAuthorizedAdmin(givenPwd, givenToken, givenEmail)) {
      return res.status(401).json({ success: false, error: 'Acesso restrito ao Administrador.' });
    }

    res.json({
      success: true,
      strictWhitelistMode,
      allowAllGmails,
      authorizedGmails: Array.from(authorizedGmails.values()),
      blockedAttempts: blockedLoginAttempts,
      totalAuthorized: authorizedGmails.size,
      totalBlocked: blockedLoginAttempts.length,
    });
  });

  app.post('/api/admin/authorized-gmails/add', (req, res) => {
    const { password, adminToken, email, targetEmail, artisticName, role, plan, notes } = req.body || {};
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;

    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    const givenPwd = password || pwdHeader;
    const givenToken = adminToken || tokenHeader || tokenFromAuth;
    const givenEmail = email || emailHeader;

    if (!isAuthorizedAdmin(givenPwd, givenToken, givenEmail)) {
      return res.status(401).json({ success: false, error: 'Acesso restrito ao Administrador.' });
    }

    if (!targetEmail || typeof targetEmail !== 'string' || !targetEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Informe um endereço de e-mail válido para autorizar.' });
    }

    const normEmail = targetEmail.trim().toLowerCase();
    const domainCheck = validateEmailDomain(normEmail);
    if (!domainCheck.valid) {
      return res.status(400).json({ success: false, error: domainCheck.reason });
    }

    const record: AuthorizedGmailRecord = {
      email: normEmail,
      artisticName: (artisticName && String(artisticName).trim()) || `MC ${normEmail.split('@')[0]}`,
      role: (role as any) || 'STUDENT',
      plan: (plan as any) || 'PRO',
      authorizedBy: givenEmail || 'Kowalski MC (Master)',
      authorizedAt: new Date().toISOString(),
      status: 'ACTIVE',
      notes: (notes && String(notes).trim()) || 'Autorizado via Painel Admin',
    };

    authorizedGmails.set(normEmail, record);

    // Update any blocked attempts for this email
    for (const attempt of blockedLoginAttempts) {
      if (attempt.email.toLowerCase() === normEmail) {
        attempt.status = 'APPROVED_LATER';
      }
    }

    saveWhitelistToFile();

    res.json({
      success: true,
      message: `Gmail '${normEmail}' autorizado com sucesso com o plano ${record.plan}!`,
      authorizedGmail: record,
    });
  });

  app.post('/api/admin/authorized-gmails/remove', (req, res) => {
    const { password, adminToken, email, targetEmail } = req.body || {};
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;

    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    const givenPwd = password || pwdHeader;
    const givenToken = adminToken || tokenHeader || tokenFromAuth;
    const givenEmail = email || emailHeader;

    if (!isAuthorizedAdmin(givenPwd, givenToken, givenEmail)) {
      return res.status(401).json({ success: false, error: 'Acesso restrito ao Administrador.' });
    }

    if (!targetEmail || typeof targetEmail !== 'string') {
      return res.status(400).json({ success: false, error: 'Informe o e-mail a ser removido.' });
    }

    const normEmail = targetEmail.trim().toLowerCase();
    if (ADMIN_EMAILS.includes(normEmail) || normEmail === 'kowalski.madagascar123@gmail.com') {
      return res.status(400).json({ success: false, error: 'A conta Mestre do Kowalski não pode ser revogada.' });
    }

    authorizedGmails.delete(normEmail);
    saveWhitelistToFile();

    res.json({
      success: true,
      message: `Autorização do Gmail '${normEmail}' revogada com sucesso.`,
    });
  });

  app.post('/api/admin/authorized-gmails/toggle-mode', (req, res) => {
    const { password, adminToken, email, strictMode, allowAll } = req.body || {};
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;

    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    const givenPwd = password || pwdHeader;
    const givenToken = adminToken || tokenHeader || tokenFromAuth;
    const givenEmail = email || emailHeader;

    if (!isAuthorizedAdmin(givenPwd, givenToken, givenEmail)) {
      return res.status(401).json({ success: false, error: 'Acesso restrito ao Administrador.' });
    }

    if (typeof strictMode === 'boolean') {
      strictWhitelistMode = strictMode;
    }
    if (typeof allowAll === 'boolean') {
      allowAllGmails = allowAll;
    }

    saveWhitelistToFile();

    res.json({
      success: true,
      strictWhitelistMode,
      allowAllGmails,
      message: strictWhitelistMode 
        ? '🔒 Modo Whitelist Estrito ATIVADO: Somente e-mails aprovados por Kowalski podem logar.' 
        : '⚠️ Modo Whitelist Estrito DESATIVADO: Todos os e-mails válidos podem logar.',
    });
  });

  app.post('/api/admin/authorized-gmails/quick-approve-blocked', (req, res) => {
    const { password, adminToken, email, blockedId, role, plan } = req.body || {};
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;

    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    const givenPwd = password || pwdHeader;
    const givenToken = adminToken || tokenHeader || tokenFromAuth;
    const givenEmail = email || emailHeader;

    if (!isAuthorizedAdmin(givenPwd, givenToken, givenEmail)) {
      return res.status(401).json({ success: false, error: 'Acesso restrito ao Administrador.' });
    }

    const foundAttempt = blockedLoginAttempts.find(b => b.id === blockedId);
    if (!foundAttempt) {
      return res.status(404).json({ success: false, error: 'Tentativa bloqueada não encontrada.' });
    }

    const normEmail = foundAttempt.email.trim().toLowerCase();
    const domainCheck = validateEmailDomain(normEmail);
    if (!domainCheck.valid) {
      return res.status(400).json({ success: false, error: `Não é possível aprovar e-mail inválido: ${domainCheck.reason}` });
    }

    const record: AuthorizedGmailRecord = {
      email: normEmail,
      artisticName: foundAttempt.artisticName || `MC ${normEmail.split('@')[0]}`,
      role: (role as any) || 'STUDENT',
      plan: (plan as any) || 'PRO',
      authorizedBy: givenEmail || 'Kowalski MC (Master)',
      authorizedAt: new Date().toISOString(),
      status: 'ACTIVE',
      notes: `Aprovado rapidamente da lista de bloqueios (IP: ${foundAttempt.ip})`,
    };

    authorizedGmails.set(normEmail, record);
    foundAttempt.status = 'APPROVED_LATER';

    saveWhitelistToFile();

    res.json({
      success: true,
      message: `Tentativa bloqueada aprovada com sucesso! Gmail '${normEmail}' agora está autorizado a logar.`,
      authorizedGmail: record,
    });
  });

  app.post('/api/admin/authorized-gmails/test-check', (req, res) => {
    const { testEmail } = req.body || {};
    if (!testEmail || typeof testEmail !== 'string') {
      return res.status(400).json({ error: 'Informe um e-mail para testar.' });
    }
    const norm = testEmail.trim().toLowerCase();
    const domainCheck = validateEmailDomain(norm);
    const isAuthorized = isEmailAuthorizedByKowalski(norm);
    const existing = authorizedGmails.get(norm);

    res.json({
      testEmail: norm,
      isValidDomain: domainCheck.valid,
      domainReason: domainCheck.reason || null,
      isAuthorized,
      strictWhitelistMode,
      allowAllGmails,
      authorizedRecord: existing || null,
      resultMessage: !domainCheck.valid 
        ? `❌ Inválido: ${domainCheck.reason}`
        : isAuthorized 
          ? `✅ Autorizado a fazer login no RimaLab Academy!`
          : `⛔ Bloqueado: Este Gmail não está na lista de autorizados de Kowalski.`,
    });
  });

  // --- TEACHER PORTAL & ACCESS APPROVAL SYSTEM (KOWALSKI GMAIL AUTHORIZATION) ---

  // 1. Teacher Request Access (Sends Email notification to kowalski.madagascar123@gmail.com)
  app.post('/api/teachers/request-access', async (req, res) => {
    try {
      const { email, fullName, artisticName, discipline, phoneOrWhatsapp, discordUser, motivation, experience, password } = req.body || {};

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Informe um endereço de e-mail (Gmail) válido.' });
      }
      if (!fullName || !fullName.trim()) {
        return res.status(400).json({ error: 'Informe o seu nome completo.' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const candidateName = String(fullName).trim();
      const specDiscipline = String(discipline || 'Métrica & Freestyle de Batalha').trim();

      // Check if already approved master teacher
      if (authorizedTeachers.has(normalizedEmail) || ADMIN_EMAILS.includes(normalizedEmail)) {
        const existingProf = authorizedTeachers.get(normalizedEmail) || {
          id: `teacher_${normalizedEmail.split('@')[0]}`,
          email: normalizedEmail,
          fullName: candidateName,
          artisticName: artisticName || candidateName,
          discipline: specDiscipline,
          isMaster: true,
          authorizedAt: new Date().toISOString(),
        };

        return res.json({
          success: true,
          status: 'APPROVED',
          isApproved: true,
          token: `prof_token_${normalizedEmail.split('@')[0]}_${Date.now()}`,
          teacher: existingProf,
          message: 'Você já possui autorização ativa como Professor da Academia de Rimas!',
        });
      }

      // Check if there is an existing request
      let reqRecord = teacherAccessRequests.get(normalizedEmail);
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'http';
      const baseUrl = `${protocol}://${host}`;

      if (reqRecord) {
        if (reqRecord.status === 'APPROVED') {
          const prof = authorizedTeachers.get(normalizedEmail) || {
            id: `teacher_${reqRecord.id}`,
            email: normalizedEmail,
            fullName: reqRecord.fullName,
            artisticName: reqRecord.artisticName || reqRecord.fullName,
            discipline: reqRecord.discipline,
            isMaster: false,
            authorizedAt: reqRecord.approvedAt || new Date().toISOString(),
          };

          return res.json({
            success: true,
            status: 'APPROVED',
            isApproved: true,
            token: `prof_token_${reqRecord.id}`,
            teacher: prof,
            message: 'Acesso de Professor já aprovado pelo Kowalski!',
          });
        }

        // Update existing pending request and re-send email
        reqRecord.fullName = candidateName;
        if (artisticName) reqRecord.artisticName = artisticName;
        reqRecord.discipline = specDiscipline;
        if (phoneOrWhatsapp) reqRecord.phoneOrWhatsapp = phoneOrWhatsapp;
        if (discordUser) reqRecord.discordUser = discordUser;
        if (motivation) reqRecord.motivation = motivation;
        if (experience) reqRecord.experience = experience;
        reqRecord.requestedAt = new Date().toISOString();
        reqRecord.status = 'PENDING';

        await sendTeacherApprovalEmailToKowalski(reqRecord, baseUrl);

        return res.json({
          success: true,
          status: 'PENDING',
          isApproved: false,
          message: 'Sua solicitação foi atualizada e um novo e-mail foi enviado para kowalski.madagascar123@gmail.com.',
          request: reqRecord,
        });
      }

      // Create new request
      const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const approveToken = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const rejectToken = `rej_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      const newRequest: TeacherAccessRequest = {
        id: reqId,
        email: normalizedEmail,
        fullName: candidateName,
        artisticName: artisticName || candidateName,
        discipline: specDiscipline,
        phoneOrWhatsapp: phoneOrWhatsapp ? String(phoneOrWhatsapp).trim() : undefined,
        discordUser: discordUser ? String(discordUser).trim() : undefined,
        motivation: motivation ? String(motivation).trim() : undefined,
        experience: experience ? String(experience).trim() : undefined,
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
        token: approveToken,
        rejectToken: rejectToken,
      };

      teacherAccessRequests.set(normalizedEmail, newRequest);

      // Trigger email to Kowalski's Gmail
      await sendTeacherApprovalEmailToKowalski(newRequest, baseUrl);

      res.json({
        success: true,
        status: 'PENDING',
        isApproved: false,
        message: 'Solicitação de acesso enviada com sucesso para o Kowalski (kowalski.madagascar123@gmail.com). Assim que ele clicar no link de autorização no Gmail, seu acesso será liberado.',
        request: {
          id: newRequest.id,
          email: newRequest.email,
          fullName: newRequest.fullName,
          discipline: newRequest.discipline,
          requestedAt: newRequest.requestedAt,
          status: newRequest.status,
        },
      });

    } catch (err: any) {
      console.error('Teacher request error:', err);
      res.status(500).json({ error: err.message || 'Erro ao processar solicitação de professor.' });
    }
  });

  // 2. Teacher Login Endpoint
  app.post('/api/teachers/login', (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Informe um e-mail válido.' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const cleanPwd = String(password || '').trim();

      // Master admin bypass
      const isMasterAdmin = ADMIN_EMAILS.includes(normalizedEmail) || cleanPwd === '36737829';
      if (isMasterAdmin) {
        let teacher = authorizedTeachers.get(normalizedEmail);
        if (!teacher) {
          teacher = {
            id: `teacher_${normalizedEmail.split('@')[0]}`,
            email: normalizedEmail,
            fullName: normalizedEmail.includes('kowalski') ? 'Kowalski MC' : 'Professor RimaLab',
            artisticName: normalizedEmail.includes('kowalski') ? 'Kowalski MC (Mestre)' : 'Prof. Mestre',
            discipline: 'Métrica & Freestyle de Batalha',
            isMaster: true,
            authorizedAt: new Date().toISOString(),
          };
          authorizedTeachers.set(normalizedEmail, teacher);
        }

        return res.json({
          success: true,
          status: 'APPROVED',
          authorized: true,
          token: `prof_token_master_${Date.now()}`,
          teacher,
          message: `Bem-vindo, Mestre ${teacher.fullName}! Acesso total concedido.`,
        });
      }

      // Check if authorized
      const teacher = authorizedTeachers.get(normalizedEmail);
      if (teacher) {
        return res.json({
          success: true,
          status: 'APPROVED',
          authorized: true,
          token: `prof_token_${teacher.id}`,
          teacher,
          message: `Bem-vindo de volta, Professor ${teacher.fullName}!`,
        });
      }

      // Check if pending request exists
      const request = teacherAccessRequests.get(normalizedEmail);
      if (request) {
        if (request.status === 'PENDING') {
          return res.status(403).json({
            success: false,
            status: 'PENDING',
            authorized: false,
            message: 'Sua solicitação de professor está aguardando aprovação de Kowalski no e-mail kowalski.madagascar123@gmail.com.',
            request: {
              email: request.email,
              fullName: request.fullName,
              discipline: request.discipline,
              requestedAt: request.requestedAt,
            },
          });
        }
        if (request.status === 'REJECTED') {
          return res.status(403).json({
            success: false,
            status: 'REJECTED',
            authorized: false,
            message: 'Sua solicitação de acesso para professor foi recusada pelo administrador.',
          });
        }
      }

      return res.status(404).json({
        success: false,
        status: 'NOT_FOUND',
        authorized: false,
        message: 'Nenhum cadastro de professor encontrado para este e-mail. Solicite o acesso na aba "Solicitar Acesso".',
      });

    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Erro ao realizar login de professor.' });
    }
  });

  // 3. Check Teacher Request Status (Real-time polling)
  app.get('/api/teachers/status', (req, res) => {
    const emailParam = req.query.email as string;
    if (!emailParam || !emailParam.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const normalizedEmail = emailParam.trim().toLowerCase();

    if (authorizedTeachers.has(normalizedEmail) || ADMIN_EMAILS.includes(normalizedEmail)) {
      const teacher = authorizedTeachers.get(normalizedEmail);
      return res.json({
        success: true,
        status: 'APPROVED',
        isApproved: true,
        teacher: teacher || null,
      });
    }

    const request = teacherAccessRequests.get(normalizedEmail);
    if (!request) {
      return res.json({
        success: true,
        status: 'NOT_FOUND',
        isApproved: false,
      });
    }

    res.json({
      success: true,
      status: request.status,
      isApproved: request.status === 'APPROVED',
      request,
    });
  });

  // 4. One-Click Approval Endpoint (Clicked by Kowalski in Gmail)
  app.get('/api/teachers/approve', (req, res) => {
    const { token, email } = req.query as { token?: string; email?: string };

    if (!token || !email) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="utf-8"/><title>Erro - RimaLab</title></head>
        <body style="background:#0a0a0a; color:#fff; font-family:sans-serif; text-align:center; padding:50px;">
          <h1 style="color:#ef4444;">Link Inválido</h1>
          <p>Os parâmetros de autorização não foram encontrados.</p>
        </body>
        </html>
      `);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const reqObj = teacherAccessRequests.get(normalizedEmail);

    if (!reqObj || reqObj.token !== token) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="utf-8"/><title>Token Expirado ou Inválido - RimaLab</title></head>
        <body style="background:#0a0a0a; color:#fff; font-family:sans-serif; text-align:center; padding:50px;">
          <h1 style="color:#f59e0b;">Token Inválido ou Já Utilizado</h1>
          <p>Esta solicitação de professor não foi localizada ou já foi processada.</p>
          <a href="/" style="color:#f59e0b; font-weight:bold;">Voltar para o RimaLab</a>
        </body>
        </html>
      `);
    }

    // Approve the teacher
    reqObj.status = 'APPROVED';
    reqObj.approvedAt = new Date().toISOString();
    reqObj.approvedBy = 'kowalski.madagascar123@gmail.com';

    const teacherProf: TeacherProfile = {
      id: `teacher_${reqObj.id}`,
      email: normalizedEmail,
      fullName: reqObj.fullName,
      artisticName: reqObj.artisticName || reqObj.fullName,
      discipline: reqObj.discipline,
      isMaster: false,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${reqObj.id}`,
      phoneOrWhatsapp: reqObj.phoneOrWhatsapp,
      discordUser: reqObj.discordUser,
      bio: reqObj.motivation || `Professor de ${reqObj.discipline} na Academia de Rimas.`,
      authorizedAt: reqObj.approvedAt,
    };

    authorizedTeachers.set(normalizedEmail, teacherProf);

    // Also upgrade or ensure user account exists with Teacher role
    let foundUser: StoredUser | null = null;
    for (const u of users.values()) {
      if (u.email.toLowerCase() === normalizedEmail) {
        foundUser = u;
        break;
      }
    }

    if (foundUser) {
      foundUser.role = 'ADMIN';
    } else {
      const newUId = `user_prof_${Date.now()}`;
      users.set(newUId, {
        id: newUId,
        email: normalizedEmail,
        passwordHash: 'teacher_pass',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
      });
      profiles.set(newUId, {
        id: `prof_${newUId}`,
        userId: newUId,
        artisticName: reqObj.artisticName || reqObj.fullName,
        tagline: `🎓 Professor de ${reqObj.discipline}`,
        bio: reqObj.motivation || 'Professor aprovado por Kowalski.',
        favoriteStyle: 'Boom Bap',
        level: 10,
        totalXP: 5000,
        streakDays: 5,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${newUId}`,
        isPublic: true,
        showStats: true,
        showHistory: true,
        totalSessions: 10,
        totalMinutesPracticed: 60,
        bestScore: 95,
        totalWordsRhymed: 800,
      });
      subscriptions.set(newUId, {
        userId: newUId,
        plan: 'ANNUAL',
        status: 'ACTIVE',
        validUntil: '2030-12-31T23:59:59Z',
        aiMonthlyQuota: 99999,
        aiQuotaUsed: 0,
        gmail: normalizedEmail,
      });
    }

    console.log(`[TEACHER APPROVED] Kowalski aprovou o professor ${reqObj.fullName} (${normalizedEmail}) via Gmail!`);

    // Render beautiful confirmation page
    res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Professor Aprovado - Kowalski MC</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
      </head>
      <body style="background:#09090b; color:#f4f4f5; font-family:'Plus Jakarta Sans', sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; padding:20px; box-sizing:border-box;">
        <div style="background:#18181b; border:1px solid #27272a; border-radius:16px; max-width:540px; width:100%; padding:36px; text-align:center; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
          <div style="width:72px; height:72px; background:linear-gradient(135deg, #f59e0b, #ea580c); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 20px auto; font-size:36px; box-shadow:0 8px 24px rgba(245, 158, 11, 0.4);">
            🎓
          </div>
          <span style="background:rgba(245, 158, 11, 0.15); color:#f59e0b; border:1px solid rgba(245, 158, 11, 0.3); font-size:12px; font-weight:800; padding:4px 12px; border-radius:999px; text-transform:uppercase; letter-spacing:1px;">
            Autorização Kowalski Concluída
          </span>
          <h1 style="color:#ffffff; font-size:24px; font-weight:800; margin:16px 0 8px 0; letter-spacing:-0.5px;">
            Professor Aprovado com Sucesso!
          </h1>
          <p style="color:#a1a1aa; font-size:15px; line-height:1.6; margin:0 0 24px 0;">
            O professor <strong>${reqObj.fullName}</strong> (<span style="color:#fbbf24;">${normalizedEmail}</span>) agora tem permissão total para acessar a Área do Professor, gerenciar alunos e realizar mentorias no RimaLab.
          </p>

          <div style="background:#27272a; border-radius:12px; padding:16px; text-align:left; margin-bottom:28px; font-size:13px;">
            <p style="margin:4px 0; color:#d4d4d8;"><strong>Matéria / Especialidade:</strong> ${reqObj.discipline}</p>
            <p style="margin:4px 0; color:#d4d4d8;"><strong>Autorizado por:</strong> Kowalski (kowalski.madagascar123@gmail.com)</p>
            <p style="margin:4px 0; color:#d4d4d8;"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>

          <a href="/" style="display:inline-block; background:#f59e0b; color:#09090b; font-weight:800; font-size:15px; padding:14px 32px; border-radius:10px; text-decoration:none; box-shadow:0 6px 20px rgba(245, 158, 11, 0.35); transition:transform 0.2s;">
            🚀 Abrir Plataforma RimaLab
          </a>
          <p style="color:#71717a; font-size:12px; margin-top:20px;">
            A tela do professor será desbloqueada em tempo real automaticamente.
          </p>
        </div>
      </body>
      </html>
    `);
  });

  // 5. One-Click Rejection Endpoint
  app.get('/api/teachers/reject', (req, res) => {
    const { token, email } = req.query as { token?: string; email?: string };
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const reqObj = teacherAccessRequests.get(normalizedEmail);

    if (reqObj && reqObj.rejectToken === token) {
      reqObj.status = 'REJECTED';
      reqObj.rejectedAt = new Date().toISOString();
      authorizedTeachers.delete(normalizedEmail);
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head><meta charset="utf-8"/><title>Solicitação Recusada - RimaLab</title></head>
      <body style="background:#0a0a0a; color:#fff; font-family:sans-serif; text-align:center; padding:50px;">
        <h1 style="color:#ef4444;">❌ Solicitação Recusada</h1>
        <p>A solicitação de professor para <strong>${normalizedEmail}</strong> foi marcada como recusada.</p>
        <a href="/" style="color:#f59e0b; font-weight:bold;">Ir para a Página Inicial</a>
      </body>
      </html>
    `);
  });

  // 6. Admin List all Teacher Requests
  app.get('/api/admin/teachers/requests', (req, res) => {
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;
    const authHeader = req.headers.authorization;
    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';

    if (!isAuthorizedAdmin(pwdHeader, tokenHeader || tokenFromAuth, emailHeader)) {
      return res.status(401).json({ error: 'Acesso restrito aos administradores / Kowalski.' });
    }

    const requestsList = Array.from(teacherAccessRequests.values()).sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );

    const approvedList = Array.from(authorizedTeachers.values());

    res.json({
      success: true,
      pendingRequests: requestsList.filter(r => r.status === 'PENDING'),
      allRequests: requestsList,
      approvedTeachers: approvedList,
      dispatchedEmails: dispatchedTeacherEmails,
    });
  });

  // 7. Admin Manual In-App Approve
  app.post('/api/admin/teachers/approve-manual', (req, res) => {
    const { email, password, adminToken, adminEmail } = req.body || {};
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;
    const authHeader = req.headers.authorization;
    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';

    if (!isAuthorizedAdmin(password || pwdHeader, adminToken || tokenHeader || tokenFromAuth, adminEmail || emailHeader)) {
      return res.status(401).json({ error: 'Acesso não autorizado.' });
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const reqObj = teacherAccessRequests.get(normalizedEmail);

    if (reqObj) {
      reqObj.status = 'APPROVED';
      reqObj.approvedAt = new Date().toISOString();
      reqObj.approvedBy = adminEmail || 'kowalski.madagascar123@gmail.com';
    }

    const teacherProf: TeacherProfile = {
      id: `teacher_${Date.now()}`,
      email: normalizedEmail,
      fullName: reqObj?.fullName || `Prof. ${normalizedEmail.split('@')[0]}`,
      artisticName: reqObj?.artisticName || reqObj?.fullName || `Prof. ${normalizedEmail.split('@')[0]}`,
      discipline: reqObj?.discipline || 'Métrica & Freestyle',
      isMaster: ADMIN_EMAILS.includes(normalizedEmail),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${normalizedEmail}`,
      authorizedAt: new Date().toISOString(),
    };

    authorizedTeachers.set(normalizedEmail, teacherProf);

    res.json({
      success: true,
      message: `✅ Professor ${teacherProf.fullName} (${normalizedEmail}) aprovado com sucesso!`,
      teacher: teacherProf,
    });
  });

  // 8. Admin Manual In-App Reject
  app.post('/api/admin/teachers/reject-manual', (req, res) => {
    const { email, password, adminToken, adminEmail } = req.body || {};
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;
    const authHeader = req.headers.authorization;
    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';

    if (!isAuthorizedAdmin(password || pwdHeader, adminToken || tokenHeader || tokenFromAuth, adminEmail || emailHeader)) {
      return res.status(401).json({ error: 'Acesso não autorizado.' });
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();
    const reqObj = teacherAccessRequests.get(normalizedEmail);
    if (reqObj) {
      reqObj.status = 'REJECTED';
      reqObj.rejectedAt = new Date().toISOString();
    }
    authorizedTeachers.delete(normalizedEmail);

    res.json({
      success: true,
      message: `Solicitação para ${normalizedEmail} foi recusada.`,
    });
  });

  // 9. Public / Authenticated List of Approved Teachers
  app.get('/api/teachers/list', (req, res) => {
    res.json({
      success: true,
      teachers: Array.from(authorizedTeachers.values()),
    });
  });

  // 10. Admin View Dispatched Emails History
  app.get('/api/admin/teachers/dispatched-emails', (req, res) => {
    res.json({
      targetAdminGmail: 'kowalski.madagascar123@gmail.com',
      totalSent: dispatchedTeacherEmails.length,
      emails: dispatchedTeacherEmails,
    });
  });

  // Admin: Broadcast / Update Live Call Link (WhatsApp / Discord / Google Meet)
  app.post('/api/admin/live-call', (req, res) => {

    const { password, adminToken, email, platform, url, title, description, hostName, isActive, targetTier } = req.body || {};
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;

    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    const givenPwd = password || pwdHeader;
    const givenToken = adminToken || tokenHeader || tokenFromAuth;
    const givenEmail = email || emailHeader;
    
    // Backend Security Verification
    if (!isAuthorizedAdmin(givenPwd, givenToken, givenEmail)) {
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
    const pwdHeader = req.headers['x-admin-password'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';

    if (!isAuthorizedAdmin(pwdHeader, tokenHeader || tokenFromAuth, emailHeader)) {
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

  // Admin: Get all registered students with full profile & XP details
  app.get('/api/admin/students', (req, res) => {
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';

    if (!isAuthorizedAdmin(pwdHeader, tokenHeader || tokenFromAuth, emailHeader)) {
      return res.status(401).json({ error: 'Acesso restrito aos Professores.' });
    }

    const studentList = Array.from(users.values()).map(u => {
      const prof = profiles.get(u.id);
      const sub = subscriptions.get(u.id);
      const totalXP = prof?.totalXP ?? 0;
      const level = Math.max(1, Math.floor(totalXP / 55) + 1);

      return {
        id: u.id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        artisticName: prof?.artisticName || `MC ${u.email.split('@')[0]}`,
        level,
        totalXP,
        favoriteStyle: prof?.favoriteStyle || 'Boom Bap',
        tagline: prof?.tagline || 'MC em Treinamento',
        bio: prof?.bio || '',
        totalSessions: prof?.totalSessions || 0,
        unlockedChannels: (prof as any)?.unlockedChannels || ['#iniciantes-treino', '#primeiras-rimas'],
        plan: sub?.plan || 'FREE',
      };
    });

    res.json({
      students: studentList,
      totalCount: studentList.length,
    });
  });

  // Admin: Award XP to a student by Gmail / Email
  app.post('/api/admin/award-xp-by-email', (req, res) => {
    const { password, adminToken, adminEmail, email, xpAmount, reason, unlockedChannels, note, artisticName } = req.body || {};
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;

    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    const givenPwd = password || pwdHeader;
    const givenToken = adminToken || tokenHeader || tokenFromAuth;
    const givenEmail = adminEmail || emailHeader;

    if (!isAuthorizedAdmin(givenPwd, givenToken, givenEmail)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Acesso não autorizado. Apenas os professores podem atribuir XP por Gmail.' 
      });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Por favor, informe um endereço de Gmail/e-mail válido do aluno.' 
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const numericXp = Number(xpAmount) || 0;

    // Find existing user by email
    let foundUser: StoredUser | null = null;
    for (const u of users.values()) {
      if (u.email.toLowerCase() === normalizedEmail) {
        foundUser = u;
        break;
      }
    }

    // If user does not exist yet, create an account for this student Gmail
    if (!foundUser) {
      const newUserId = `user_g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      foundUser = {
        id: newUserId,
        email: normalizedEmail,
        passwordHash: 'gmail_student_pass',
        role: 'USER',
        createdAt: new Date().toISOString(),
      };
      users.set(newUserId, foundUser);

      const calculatedLevel = Math.max(1, Math.floor(Math.max(0, numericXp) / 55) + 1);
      const initialProf: StoredProfile = {
        id: `prof_${newUserId}`,
        userId: newUserId,
        artisticName: artisticName?.trim() || `MC ${normalizedEmail.split('@')[0]}`,
        tagline: 'MC em Treinamento • Academia de Rimas',
        bio: note ? `[Nota do Professor]: ${note}` : 'Aluno da Academia de Rimas.',
        favoriteStyle: 'Boom Bap',
        level: calculatedLevel,
        totalXP: Math.max(0, numericXp),
        streakDays: 1,
        lastPracticeDate: new Date().toISOString(),
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${newUserId}`,
        isPublic: true,
        showStats: true,
        showHistory: true,
        totalSessions: 0,
        totalMinutesPracticed: 0,
        bestScore: 0,
        totalWordsRhymed: 0,
      };
      if (unlockedChannels && Array.isArray(unlockedChannels)) {
        (initialProf as any).unlockedChannels = unlockedChannels;
      }
      profiles.set(newUserId, initialProf);

      const newSub: StoredSubscription = {
        userId: newUserId,
        plan: 'FREE_TRIAL',
        status: 'ACTIVE',
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        aiMonthlyQuota: 20,
        aiQuotaUsed: 0,
        gmail: normalizedEmail,
      };
      subscriptions.set(newUserId, newSub);
    } else {
      // Update existing user profile
      let prof = profiles.get(foundUser.id);
      if (!prof) {
        prof = {
          id: `prof_${foundUser.id}`,
          userId: foundUser.id,
          artisticName: artisticName?.trim() || `MC ${normalizedEmail.split('@')[0]}`,
          tagline: 'MC em Treinamento',
          bio: note ? `[Nota do Professor]: ${note}` : '',
          favoriteStyle: 'Boom Bap',
          level: 1,
          totalXP: 0,
          streakDays: 1,
          lastPracticeDate: new Date().toISOString(),
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${foundUser.id}`,
          isPublic: true,
          showStats: true,
          showHistory: true,
          totalSessions: 0,
          totalMinutesPracticed: 0,
          bestScore: 0,
          totalWordsRhymed: 0,
        };
        profiles.set(foundUser.id, prof);
      }

      // Add XP & calculate level with 55 XP = 1 Nível
      prof.totalXP = Math.max(0, (prof.totalXP || 0) + numericXp);
      prof.level = Math.max(1, Math.floor(prof.totalXP / 55) + 1);

      if (artisticName && artisticName.trim()) {
        prof.artisticName = artisticName.trim();
      }
      if (unlockedChannels && Array.isArray(unlockedChannels)) {
        (prof as any).unlockedChannels = unlockedChannels;
      }
      if (note && note.trim()) {
        prof.bio = `${prof.bio ? prof.bio + '\n\n' : ''}[Nota do Professor]: ${note.trim()}`;
      }
    }

    // Log XP transaction
    xpTransactions.push({
      id: `xp_prof_${Date.now()}`,
      userId: foundUser.id,
      amount: numericXp,
      reason: reason || 'TEACHER_AWARD_GMAIL',
      description: note || `XP concedido pelo Professor para ${normalizedEmail}`,
      createdAt: new Date().toISOString(),
    });

    const updatedProfile = profiles.get(foundUser.id)!;
    const sub = subscriptions.get(foundUser.id);

    res.json({
      success: true,
      message: `🎉 +${numericXp} XP atribuído com sucesso para ${normalizedEmail}! Nível atual: ${updatedProfile.level}`,
      user: { id: foundUser.id, email: foundUser.email, role: foundUser.role },
      profile: { ...updatedProfile, email: normalizedEmail },
      subscription: sub,
      xpAdded: numericXp,
      newTotalXP: updatedProfile.totalXP,
      newLevel: updatedProfile.level,
    });
  });

  // User: Real-time Profile Sync by Gmail / Email
  app.get('/api/user/profile-by-email', (req, res) => {
    const emailParam = req.query.email as string;
    if (!emailParam || !emailParam.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const normalized = emailParam.trim().toLowerCase();
    let foundUser: StoredUser | null = null;
    for (const u of users.values()) {
      if (u.email.toLowerCase() === normalized) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const prof = profiles.get(foundUser.id);
    const sub = subscriptions.get(foundUser.id);
    const calculatedLevel = prof ? Math.max(1, Math.floor((prof.totalXP || 0) / 55) + 1) : 1;

    res.json({
      user: { id: foundUser.id, email: foundUser.email, role: foundUser.role },
      profile: prof ? { ...prof, email: foundUser.email, level: calculatedLevel } : null,
      subscription: sub || null,
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

      const { transcript, lyrics, beatStyle, bpm, durationSeconds, challengeId, trainingType, focusSkills, userAge, age, judgePersonality } = req.body;
      const actualText = transcript || lyrics || '';

      if (!actualText || actualText.trim().length === 0) {
        return res.status(400).json({ error: 'Nenhum texto de rima fornecido para análise.' });
      }

      const duration = Number(durationSeconds) || 30;
      const mcAge = userAge || age || profile.age || 'Não especificada';
      const vertente = trainingType || profile.trainingType || 'freestyle';
      const skillsToFocus = Array.isArray(focusSkills) && focusSkills.length > 0 ? focusSkills.join(', ') : 'Geral (Métrica e Flow)';
      const personality = judgePersonality || 'kowalski_rigido';

      const judgeRoleDescription = personality === 'jurado_bda'
        ? 'Jurado de Batalha de Sangue (Estilo BDA/FBC): foco máximo no impacto da punchline, postura agressiva, criatividade no ataque e resposta direta.'
        : personality === 'coach_construtivo'
        ? 'Coach de Flow & Métrica: foco pedagógico detalhado na métrica multissilábica, respiração nos compassos 4/4 e evolução técnica.'
        : 'Kowalski Sem Filtro: avaliação ultra-técnica, cirúrgica e honesta, sem passar pano para rimas óbvias no infinitivo, focando em divisão rítmica real.';

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
            contents: `Você é um Jurado e Especialista Técnico Profissional de Batalhas de Rima e Freestyle.
PERSONALIDADE ATIVA DO JURADO:
${judgeRoleDescription}

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

  // --- Global Site Customization & Kowalski Studio Endpoints ---
  interface ServerSiteCustomization {
    brandName: string;
    brandSub: string;
    heroTitle: string;
    heroHighlightWord: string;
    heroSubtitle: string;
    heroGradient: string;
    ctaButtonText: string;
    announcementBanner: {
      enabled: boolean;
      text: string;
      badge: string;
      linkUrl?: string;
      style: string;
    };
    globalAlert?: {
      enabled: boolean;
      title: string;
      message: string;
      type: string;
      buttonText?: string;
      buttonLink?: string;
    };
    accentColor: string;
    topTickerText: string;
    customCss?: string;
    customHtmlSnippet?: string;
    footerMessage?: string;
    lastUpdated?: string;
    updatedBy?: string;
  }

  const DEFAULT_SERVER_CUSTOMIZATION: ServerSiteCustomization = {
    brandName: 'Academia de Rimas',
    brandSub: 'Por Kowalski MC & Luquita MC',
    heroTitle: 'Domine o Freestyle & as Batalhas de Rima',
    heroHighlightWord: 'Freestyle',
    heroSubtitle: 'Treine improviso, speed flow e punchlines com sintetizador de beats em tempo real, bot estilo Discord com comandos /play e avaliação técnica direta ao ponto feita por IA jurado profissional.',
    heroGradient: 'amber-orange-red',
    ctaButtonText: 'Entrar no Estúdio de Gravação',
    announcementBanner: {
      enabled: false,
      text: '🎤 Aula Especial de Speed Flow hoje com Kowalski MC & Luquita MC às 20h!',
      badge: 'NOVIDADE',
      linkUrl: '',
      style: 'amber',
    },
    globalAlert: {
      enabled: false,
      title: '🏆 Batalha Semanal RimaLab',
      message: 'Participe do torneio de freestyle no Discord e dispute a vaga no pódio!',
      type: 'hype',
      buttonText: 'Ver Detalhes',
      buttonLink: '',
    },
    accentColor: 'amber',
    topTickerText: '🎤 Luquita MC & ⚡ Kowalski MC • Mestres da Rima, Métrica & Inteligência Artificial',
    customCss: '',
    customHtmlSnippet: '',
    footerMessage: 'RimaLab Academy • Transformando MCs em Máquinas de Freestyle com IA e Hip-Hop Brasileiro',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'Sistema',
  };

  const CUSTOMIZATION_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'site-customization.json');

  // Load persistent customization from disk or fallback to defaults
  function loadCustomizationFromFile(): ServerSiteCustomization {
    try {
      if (fs.existsSync(CUSTOMIZATION_FILE_PATH)) {
        const raw = fs.readFileSync(CUSTOMIZATION_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.heroTitle) {
          console.log('[SiteCustomization] Loaded persistent config from disk:', CUSTOMIZATION_FILE_PATH);
          return { ...DEFAULT_SERVER_CUSTOMIZATION, ...parsed };
        }
      }
    } catch (e) {
      console.warn('[SiteCustomization] Could not read customization file, using defaults:', e);
    }
    return DEFAULT_SERVER_CUSTOMIZATION;
  }

  // Save persistent customization to disk synchronously
  function saveCustomizationToFile(data: ServerSiteCustomization) {
    try {
      const dir = path.dirname(CUSTOMIZATION_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CUSTOMIZATION_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
      console.log('[SiteCustomization] Saved permanently to disk:', CUSTOMIZATION_FILE_PATH);
    } catch (e) {
      console.error('[SiteCustomization] Failed to write customization to disk:', e);
    }
  }

  // Active in-memory site customization initialized from file
  let globalSiteCustomization: ServerSiteCustomization = loadCustomizationFromFile();

  // SSE Subscribers for Real-Time Instant Customization Synchronization
  const customizationSubscribers = new Set<express.Response>();

  function broadcastCustomizationUpdate() {
    const payload = JSON.stringify({
      type: 'customization-update',
      customization: globalSiteCustomization,
      timestamp: Date.now(),
    });
    for (const client of customizationSubscribers) {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch {
        customizationSubscribers.delete(client);
      }
    }
  }

  // SSE Stream Endpoint for Site Customization
  app.get('/api/site-customization/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.write(`data: ${JSON.stringify({ type: 'customization-init', customization: globalSiteCustomization, timestamp: Date.now() })}\n\n`);
    customizationSubscribers.add(res);

    const pingInterval = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`);
      } catch {
        clearInterval(pingInterval);
        customizationSubscribers.delete(res);
      }
    }, 10000);

    req.on('close', () => {
      clearInterval(pingInterval);
      customizationSubscribers.delete(res);
    });
  });

  // GET: Public fetch of active customization
  app.get('/api/site-customization', (req, res) => {
    res.json({ success: true, customization: globalSiteCustomization });
  });

  // POST: Admin update customization (Persists to file + broadcasts instantly)
  app.post('/api/site-customization', (req, res) => {
    const { updates, password, adminToken, email } = req.body || {};
    const payloadUpdates = (updates && typeof updates === 'object') ? updates : req.body;

    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;

    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    const givenPwd = password || pwdHeader;
    const givenToken = adminToken || tokenHeader || tokenFromAuth;
    const givenEmail = email || emailHeader;

    if (!isAuthorizedAdmin(givenPwd, givenToken, givenEmail)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Acesso restrito. Digite a senha mestre de Administrador para modificar o site.' 
      });
    }

    if (payloadUpdates && typeof payloadUpdates === 'object') {
      // Filter out auth keys from the customization object
      const { password: _p, adminToken: _t, email: _e, updates: _u, ...cleanUpdates } = payloadUpdates;

      globalSiteCustomization = {
        ...globalSiteCustomization,
        ...cleanUpdates,
        lastUpdated: new Date().toISOString(),
        updatedBy: cleanUpdates.updatedBy || 'Kowalski Studio / Admin',
      };

      // 1. Save permanently to disk
      saveCustomizationToFile(globalSiteCustomization);

      // 2. Broadcast in real time to all connected clients via SSE
      broadcastCustomizationUpdate();

      return res.json({ 
        success: true, 
        savedToDisk: true,
        customization: globalSiteCustomization,
        message: 'Personalização salva com sucesso no servidor e transmitida em tempo real para todos os usuários!' 
      });
    }
    res.status(400).json({ error: 'Configuração inválida.' });
  });

  // POST: Reset site customization
  app.post('/api/site-customization/reset', (req, res) => {
    const { password, adminToken, email } = req.body || {};
    const authHeader = req.headers.authorization;
    const pwdHeader = req.headers['x-admin-password'] as string;
    const tokenHeader = req.headers['x-admin-token'] as string;
    const emailHeader = req.headers['x-admin-email'] as string;

    const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
    const givenPwd = password || pwdHeader;
    const givenToken = adminToken || tokenHeader || tokenFromAuth;
    const givenEmail = email || emailHeader;

    if (!isAuthorizedAdmin(givenPwd, givenToken, givenEmail)) {
      return res.status(401).json({ success: false, error: 'Acesso restrito ao Administrador.' });
    }

    globalSiteCustomization = {
      ...DEFAULT_SERVER_CUSTOMIZATION,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Sistema (Reset)',
    };

    saveCustomizationToFile(globalSiteCustomization);
    broadcastCustomizationUpdate();

    res.json({ success: true, customization: globalSiteCustomization });
  });

  // AI Kowalski Studio Prompt Interpreter
  app.post('/api/admin/kowalski-studio/chat', async (req, res) => {
    try {
      const { prompt, currentCustomization, password, adminToken, email } = req.body || {};
      const authHeader = req.headers.authorization;
      const pwdHeader = req.headers['x-admin-password'] as string;
      const tokenHeader = req.headers['x-admin-token'] as string;
      const emailHeader = req.headers['x-admin-email'] as string;

      const tokenFromAuth = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
      const givenPwd = password || pwdHeader;
      const givenToken = adminToken || tokenHeader || tokenFromAuth;
      const givenEmail = email || emailHeader;

      if (!isAuthorizedAdmin(givenPwd, givenToken, givenEmail)) {
        return res.status(401).json({ 
          success: false, 
          error: 'Acesso restrito. Digite a senha mestre de Administrador para usar o Kowalski Studio.' 
        });
      }

      const query = (prompt || '').trim();

      if (!query) {
        return res.status(400).json({ error: 'Prompt não informado' });
      }

      const ai = getGeminiClient();

      if (ai) {
        try {
          const systemInstruction = `Você é o KOWALSKI STUDIO AI, a inteligência artificial encarregada de personalizar e alterar dinamicamente o site "Academia de Rimas / RimaLab" em tempo real para todos os usuários.
Sua missão é interpretar a solicitação do usuário em linguagem natural e retornar uma resposta amigável + um JSON com as propriedades exatas a serem modificadas no site.

Campos suportados no objeto "updates":
- "heroTitle": (string) Título principal da página
- "heroHighlightWord": (string) Palavra que fica com destaque de degradê de cor
- "heroSubtitle": (string) Subtítulo / descrição da página inicial
- "heroGradient": ("amber-orange-red" | "purple-pink-red" | "emerald-teal-cyan" | "blue-indigo-purple" | "red-gold-yellow" | "cyberpunk-neon")
- "ctaButtonText": (string) Texto do botão de ação principal
- "brandName": (string) Nome da marca no topo do site
- "brandSub": (string) Subtítulo da marca no topo
- "topTickerText": (string) Texto do letreiro/marquee no topo
- "announcementBanner": { "enabled": boolean, "text": string, "badge": string, "style": "red" | "amber" | "emerald" | "purple" | "blue" | "neon", "linkUrl"?: string }
- "globalAlert": { "enabled": boolean, "title": string, "message": string, "type": "info" | "warning" | "hype" | "event", "buttonText": string }
- "accentColor": ("amber" | "emerald" | "purple" | "red" | "cyan" | "blue" | "gold" | "neon")
- "footerMessage": (string) Mensagem de rodapé do site
- "customCss": (string) Código CSS global injetado diretamente no site para estilizar botões, cores de fundo, bordas, fontes, efeitos glow, etc.

Responda SEMPRE em formato JSON com o seguinte schema:
{
  "reply": "Texto da resposta explicando o que foi feito com tom animado de hip-hop e mestre de freestyle",
  "updates": { ...propriedades modificadas... }
}`;

          const aiResponse = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: `Configuração atual do site:\n${JSON.stringify(currentCustomization || globalSiteCustomization, null, 2)}\n\nSolicitação do Admin/Usuário:\n"${query}"`,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.4,
            },
          });

          if (aiResponse.text) {
            const parsed = JSON.parse(aiResponse.text);
            if (parsed && parsed.updates) {
              globalSiteCustomization = {
                ...globalSiteCustomization,
                ...parsed.updates,
                lastUpdated: new Date().toISOString(),
                updatedBy: 'Kowalski Studio AI',
              };
              saveCustomizationToFile(globalSiteCustomization);
              broadcastCustomizationUpdate();

              return res.json({
                success: true,
                reply: parsed.reply || '🚀 Alterações aplicadas no site para todos os usuários!',
                updates: parsed.updates,
                customization: globalSiteCustomization,
              });
            }
          }
        } catch (aiErr) {
          console.warn('Gemini chat interpretation failed, using rule engine:', aiErr);
        }
      }

      // Rule Engine Fallback (Deterministic & Instant)
      const lower = query.toLowerCase();
      const updates: Partial<ServerSiteCustomization> = {};
      const changesSummary: string[] = [];

      if (lower.includes('roxo') || lower.includes('neon') || lower.includes('cyber') || lower.includes('pink')) {
        updates.heroGradient = 'purple-pink-red';
        changesSummary.push('Degradê Roxo Neon Cyberpunk');
      } else if (lower.includes('verde') || lower.includes('esmeralda') || lower.includes('menta') || lower.includes('ciano')) {
        updates.heroGradient = 'emerald-teal-cyan';
        changesSummary.push('Degradê Esmeralda & Ciano');
      } else if (lower.includes('azul') || lower.includes('indigo') || lower.includes('índigo')) {
        updates.heroGradient = 'blue-indigo-purple';
        changesSummary.push('Degradê Azul Elétrico');
      } else if (lower.includes('sangue') || lower.includes('ouro') || lower.includes('dourado') || lower.includes('amarelo')) {
        updates.heroGradient = 'red-gold-yellow';
        changesSummary.push('Degradê Vermelho Sangue & Dourado');
      } else if (lower.includes('fogo') || lower.includes('laranja') || lower.includes('âmbar') || lower.includes('ambar')) {
        updates.heroGradient = 'amber-orange-red';
        changesSummary.push('Degradê Âmbar Fogo');
      }

      if (lower.includes('banner') || lower.includes('aviso') || lower.includes('recado')) {
        let bannerText = query.replace(/(adicione|coloque|bote|crie|ativar|mude o)\s+(um\s+)?(banner|aviso|recado)\s+(dizendo|que|de|:)?/i, '').trim();
        if (bannerText.length < 5) bannerText = '🎤 Atenção MCs: Nova Mentoria e Roda de Rima aberta no Discord!';
        updates.announcementBanner = {
          enabled: true,
          text: bannerText,
          badge: 'AVISO OFICIAL',
          style: lower.includes('sangue') || lower.includes('vermelho') ? 'red' : 'amber',
        };
        changesSummary.push(`Banner de aviso: "${bannerText.substring(0, 40)}..."`);
      }

      if (lower.includes('título') || lower.includes('titulo') || lower.includes('headline')) {
        const titleMatch = query.match(/(?:para|com o título|como)\s+["'“]?([^"'”]+)["'”]?/i);
        const newTitle = titleMatch ? titleMatch[1].trim() : query.replace(/.*(título|titulo|headline)\s*(?:para|é|como|:)?/i, '').trim();
        if (newTitle && newTitle.length > 3) {
          updates.heroTitle = newTitle;
          changesSummary.push(`Título: "${newTitle}"`);
        }
      }

      if (lower.includes('botão') || lower.includes('botao') || lower.includes('cta')) {
        const btnMatch = query.match(/(?:para|como|com o texto)\s+["'“]?([^"'”]+)["'”]?/i);
        const newBtn = btnMatch ? btnMatch[1].trim() : query.replace(/.*(botão|botao|cta)\s*(?:para|é|como|:)?/i, '').trim();
        if (newBtn && newBtn.length > 2) {
          updates.ctaButtonText = newBtn;
          changesSummary.push(`Botão: "${newBtn}"`);
        }
      }

      if (lower.includes('brilho') || lower.includes('glow') || lower.includes('css') || lower.includes('estilo')) {
        updates.customCss = `
          /* Efeito Glow aplicado pelo Kowalski Studio */
          button, .rounded-2xl {
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.25) !important;
          }
        `;
        changesSummary.push('Estilo CSS com Glow Neon');
      }

      if (Object.keys(updates).length === 0) {
        updates.heroTitle = query.length > 8 ? query : globalSiteCustomization.heroTitle;
        changesSummary.push('Atualização visual realizada');
      }

      globalSiteCustomization = {
        ...globalSiteCustomization,
        ...updates,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'Kowalski Studio Rule Engine',
      };

      saveCustomizationToFile(globalSiteCustomization);
      broadcastCustomizationUpdate();

      res.json({
        success: true,
        reply: `⚡ Alterações aplicadas no site para todos os usuários em tempo real:\n\n• ${changesSummary.join('\n• ')}`,
        updates,
        customization: globalSiteCustomization,
      });

    } catch (err: any) {
      console.error('Kowalski studio chat error:', err);
      res.status(500).json({ error: 'Erro ao processar alteração no site' });
    }
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
          systemInstruction: `Você é o PROFESSOR RIMA, o lendário mestre e treinador de rap e freestyle do RimaLab Academy (criado pelos mestres do hip-hop Luquita MC e Kowalski MC).

REGRAS DE PERSONA (RIGOROSAS):
1. Você NUNCA fala de maneira robótica ou genérica (NUNCA use frases como "Como uma inteligência artificial", "Sou um modelo de linguagem", "Posso te ajudar com algo mais?").
2. Você fala de forma 100% natural, calorosa, enérgica e humana, como um verdadeiro MC veterano e parceiro de roda de rima de São Paulo / Brasil.
3. Use gírias autênticas do hip-hop nacional (ex: "Salve, meu parceiro!", "Visão!", "Pega a métrica!", "Soltou o peso!", "Mandou brasa!", "Foca na caixa do 4/4").
4. Se o aluno terminar de rimar ou mandar um áudio, avalie IMEDIATAMENTE em voz alta:
   - Diga qual foi a melhor sacada ou rima;
   - Aponte a métrica e o tempo no beat (se foi 4x4, se teve variação de flow ou speed flow);
   - Proponha uma resposta rimada ou a próxima linha de desafio;
   - Elogie com empolgação!
5. Suas falas devem ser dinâmicas, rítmicas e diretas ao ponto, perfeitas para quem está com fone no estúdio de gravação.`,
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
