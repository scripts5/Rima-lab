import React, { useState, useEffect } from 'react';
import { Radio, ExternalLink, Video, X } from 'lucide-react';
import { 
  Header 
} from './components/Header';
import { 
  FreestyleStudio 
} from './components/FreestyleStudio';
import { 
  RhymeLabAcademy 
} from './components/RhymeLabAcademy';
import { 
  DailyChallenges 
} from './components/DailyChallenges';
import { 
  AchievementsView 
} from './components/AchievementsView';
import { 
  ProfileView 
} from './components/ProfileView';
import { 
  LeaderboardView 
} from './components/LeaderboardView';
import { 
  SuggestionsTab 
} from './components/SuggestionsTab';
import {
  SkillTracksView
} from './components/SkillTracksView';
import { 
  DiscordBeatBot 
} from './components/DiscordBeatBot';
import { 
  LiveCallRoom 
} from './components/LiveCallRoom';
import { 
  OnboardingLanding 
} from './components/OnboardingLanding';
import { 
  SubscriptionModal 
} from './components/SubscriptionModal';
import { 
  PromptGeneratorModal 
} from './components/PromptGeneratorModal';
import { 
  AdminPanelModal 
} from './components/AdminPanelModal';
import { 
  GmailAuthModal 
} from './components/GmailAuthModal';
import { 
  AIVoiceProfessorModal 
} from './components/AIVoiceProfessorModal';
import { 
  UserProfile, 
  Subscription, 
  Lesson, 
  Challenge, 
  Achievement, 
  PracticeSession, 
  XPTransaction, 
  Beat, 
  RhymeAnalysis,
  LiveCallSession,
  TrialStatus,
  SkillFocusType,
  BattleTrainingType
} from './types';
import { NavigationProvider, NavTabId } from './context/NavigationContext';
import { PRESET_BEATS, globalBeatEngine } from './lib/audio/beatEngine';
import { LESSONS_DATA } from './data/lessons';
import { CHALLENGES_DATA } from './data/challenges';
import { ACHIEVEMENTS_DATA } from './data/achievements';
import confetti from 'canvas-confetti';
import { 
  ensureFirebaseAuth, 
  saveUserProfileToFirestore, 
  loadUserProfileFromFirestore, 
  saveLessonCompletionToFirestore, 
  loadCompletedLessonsFromFirestore, 
  savePracticeSessionToFirestore, 
  subscribeLiveCallFromFirestore 
} from './lib/firestoreService';

export function App() {
  const [activeTab, setActiveTab] = useState<'onboarding' | 'studio' | 'bot' | 'calls' | 'lessons' | 'challenges' | 'achievements' | 'profile' | 'leaderboard' | 'suggestions' | 'tracks'>('onboarding');
  const [initialSkillTab, setInitialSkillTab] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>('Punchlines');
  
  // Data States
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('rimalab_user_profile') : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'user_default',
      userId: 'user_default',
      artisticName: 'MC Visitante',
      tagline: '⚔️ MC de Batalha (Sangue)',
      bio: 'Treinando freestyle e speed flow no RimaLab.',
      favoriteStyle: 'Detroit',
      age: 18,
      trainingType: 'gastacao',
      focusSkills: ['speedflow', 'punchline', 'encaixe_beat', 'flow', 'contagem_versos'],
      roles: ['⚔️ MC de Batalha (Sangue)', '⚡ Speed Flow Master'],
      selectedCategories: ['Punchlines', 'Speed Flow', 'Batalhas & Improviso', 'Métrica & Flow', 'Drill'],
      unlockedChannels: ['#batalha-sangue', '#speedflow-treino', '#arena-versus', '#cypher-ao-vivo'],
      level: 1,
      totalXP: 150,
      streakDays: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      isPublic: true,
    };
  });
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>(LESSONS_DATA);
  const [challenges, setChallenges] = useState<Challenge[]>(CHALLENGES_DATA);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_DATA);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);
  const [xpTransactions, setXpTransactions] = useState<XPTransaction[]>([]);
  const [liveCall, setLiveCall] = useState<LiveCallSession | null>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('rimalab_live_call') : null;
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'live_default',
      isActive: true,
      platform: 'discord',
      url: 'https://discord.gg/rimalab',
      title: 'Aula ao Vivo de Métrica & Freestyle',
      description: 'Entre para rimar no beat e receber feedback com Kowalski MC & Luquita MC!',
      hostName: 'Luquita MC & Kowalski MC',
      startedAt: new Date().toISOString(),
      targetTier: 'ALL',
    };
  });

  // Beat State
  const [isPlayingBeat, setIsPlayingBeat] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<Beat>(PRESET_BEATS[0]);

  // Challenge Active Context
  const [activeChallengeTheme, setActiveChallengeTheme] = useState<{
    title: string;
    theme: string;
    requiredWords: string[];
    timeLimitSeconds?: number;
  } | null>(null);

  // Modals
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState<boolean>(false);
  const [isPromptGenOpen, setIsPromptGenOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isGmailAuthOpen, setIsGmailAuthOpen] = useState<boolean>(false);
  const [isVoiceCoachOpen, setIsVoiceCoachOpen] = useState<boolean>(false);
  const [isLiveBannerDismissed, setIsLiveBannerDismissed] = useState<boolean>(false);

  // Auto show banner again if URL or active status changes
  useEffect(() => {
    if (liveCall?.isActive && liveCall?.url) {
      setIsLiveBannerDismissed(false);
    }
  }, [liveCall?.url, liveCall?.isActive]);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'xp' | 'ach' | 'info' } | null>(null);

  const showToast = (title: string, desc: string, type: 'xp' | 'ach' | 'info' = 'xp') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sound notification chime when Professor sends Live Call link
  const playLiveCallAlertSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: A5 (880 Hz) with slight delay
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch {
      // Audio autoplay policy catch
    }
  };

  // Fetch Live Call Broadcast (HTTP Fallback)
  const fetchLiveCall = async (showNotificationOnNew = false) => {
    try {
      const res = await fetch('/api/live-call', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.liveCall) {
          setLiveCall((prev) => {
            const hasChanged = !prev || prev.url !== data.liveCall.url || prev.isActive !== data.liveCall.isActive;
            if (hasChanged && data.liveCall.isActive && showNotificationOnNew) {
              playLiveCallAlertSound();
              showToast(
                '🔴 AULA AO VIVO TRANSMITIDA NO DISCORD!',
                `${data.liveCall.hostName || 'Os Professores'} atualizaram a sala de chamada. Clique no topo para entrar!`,
                'ach'
              );
            }
            return data.liveCall;
          });
          try {
            localStorage.setItem('rimalab_live_call', JSON.stringify(data.liveCall));
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Live call fetch fallback:', e);
    }
  };

  // Real-Time SSE Stream for Instant Live Call Broadcast
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const setupSSE = () => {
      try {
        eventSource = new EventSource('/api/live-call/stream');
        
        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'live-call-update' || payload.type === 'live-call-init') {
              if (payload.liveCall) {
                setLiveCall((prev) => {
                  const isNewUpdate = payload.type === 'live-call-update';
                  const hasChanged = !prev || prev.url !== payload.liveCall.url || prev.isActive !== payload.liveCall.isActive;
                  
                  if (payload.liveCall.isActive && (isNewUpdate || hasChanged)) {
                    playLiveCallAlertSound();
                    showToast(
                      '🔴 AULA AO VIVO NO DISCORD DISPONÍVEL!',
                      `${payload.liveCall.hostName || 'Os Professores'} enviaram o link da sala. Clique para entrar!`,
                      'ach'
                    );
                  }
                  return payload.liveCall;
                });
                try {
                  localStorage.setItem('rimalab_live_call', JSON.stringify(payload.liveCall));
                } catch {}
              }
            }
          } catch (parseErr) {
            console.warn('SSE Parse error:', parseErr);
          }
        };

        eventSource.onerror = () => {
          // In case of disconnection, close and let fallback polling handle it
          eventSource?.close();
          eventSource = null;
        };
      } catch (sseErr) {
        console.warn('SSE not supported, using fast polling fallback:', sseErr);
      }
    };

    setupSSE();

    // Fast polling fallback (every 4 seconds + on window focus)
    const interval = setInterval(() => {
      fetchLiveCall(true);
    }, 4000);

    const onFocus = () => fetchLiveCall(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchLiveCall(true);
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Fetch Dashboard & Profile on Startup with Firestore Persistence
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Initialize Firebase Auth session
        const authUid = await ensureFirebaseAuth();

        // Load Firestore lesson progress
        const firestoreCompletedLessons = await loadCompletedLessonsFromFirestore(authUid);
        if (Object.keys(firestoreCompletedLessons).length > 0) {
          setLessons(prev => prev.map(l => ({
            ...l,
            isCompleted: l.isCompleted || Boolean(firestoreCompletedLessons[l.id]),
          })));
        }

        // Load Firestore user profile
        const firestoreProfile = await loadUserProfileFromFirestore(authUid);
        if (firestoreProfile) {
          setProfile(firestoreProfile);
        }

        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile(prev => prev ? { ...data.profile, ...prev } : data.profile);
          }
          if (data.subscription) setSubscription(data.subscription);
          if (data.recentSessions) setPracticeSessions(data.recentSessions);
          if (data.recentTransactions) setXpTransactions(data.recentTransactions);
          if (data.achievements) setAchievements(data.achievements);
          if (data.lessons) {
            setLessons(prev => {
              const completedSet = new Set(Object.keys(firestoreCompletedLessons));
              return data.lessons.map((l: Lesson) => ({
                ...l,
                isCompleted: l.isCompleted || completedSet.has(l.id),
              }));
            });
          }
          if (data.challenges) setChallenges(data.challenges);
        }
      } catch (err) {
        console.warn('Using Firestore/local fallback state:', err);
      }
    };

    fetchUserData();
    fetchLiveCall(false);

    // Subscribe to Firestore Live Call updates
    const unsubscribeLiveCall = subscribeLiveCallFromFirestore((firestoreCall) => {
      if (firestoreCall?.url) {
        setLiveCall(firestoreCall);
      }
    });

    return () => {
      unsubscribeLiveCall();
    };
  }, []);

  // Handler: Save Freestyle Practice Session
  const handleSessionComplete = async (sessionData: {
    beatId: string;
    beatStyle: string;
    bpm: number;
    durationSeconds: number;
    transcript: string;
    analysis: RhymeAnalysis;
    xpEarned: number;
  }) => {
    try {
      // Persist to Firestore
      const sessionDoc: PracticeSession = {
        id: `sess_${Date.now()}`,
        userId: profile?.userId || 'current_user',
        beatId: sessionData.beatId,
        beatStyle: sessionData.beatStyle,
        bpm: sessionData.bpm,
        durationSeconds: sessionData.durationSeconds,
        transcript: sessionData.transcript,
        analysis: sessionData.analysis,
        xpEarned: sessionData.xpEarned,
        createdAt: new Date().toISOString(),
      };
      savePracticeSessionToFirestore(sessionDoc).catch(e => console.warn('Firestore session save error:', e));

      const res = await fetch('/api/practice/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          saveUserProfileToFirestore(data.profile).catch(e => console.warn('Firestore profile sync error:', e));
        }
        if (data.session) {
          setPracticeSessions(prev => [data.session, ...prev]);
        }
        if (data.newAchievements && data.newAchievements.length > 0) {
          showToast(
            '🏆 Nova Conquista Desbloqueada!',
            `Você desbloqueou: ${data.newAchievements.join(', ')}`,
            'ach'
          );
        } else {
          showToast(
            '⚡ Freestyle Registrado!',
            `Você ganhou +${sessionData.xpEarned} XP!`,
            'xp'
          );
        }
      } else {
        // Optimistic update
        if (profile) {
          const newXP = profile.totalXP + sessionData.xpEarned;
          const updatedProf = {
            ...profile,
            totalXP: newXP,
            totalSessions: profile.totalSessions + 1,
            totalMinutesPracticed: profile.totalMinutesPracticed + Math.round(sessionData.durationSeconds / 60),
            bestScore: Math.max(profile.bestScore, sessionData.analysis.overallScore),
          };
          setProfile(updatedProf);
          saveUserProfileToFirestore(updatedProf).catch(e => console.warn('Firestore profile sync error:', e));
        }
        showToast('⚡ Freestyle Registrado!', `Você ganhou +${sessionData.xpEarned} XP!`, 'xp');
      }
    } catch (e) {
      console.warn('Practice session save fallback:', e);
    }
  };

  // Handler: Complete Lesson
  const handleCompleteLesson = async (lessonId: string, customLyrics: string): Promise<boolean> => {
    const lesson = lessons.find(l => l.id === lessonId);
    const xpReward = lesson?.xpReward || 200;

    // Persist lesson completion directly to Firestore
    saveLessonCompletionToFirestore(lessonId, customLyrics, xpReward, lesson).catch(e => {
      console.warn('Firestore lesson completion sync error:', e);
    });

    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics: customLyrics }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          saveUserProfileToFirestore(data.profile).catch(e => console.warn('Firestore profile sync error:', e));
        }
        setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, isCompleted: true } : l));
        showToast('📖 Lição Concluída!', `Parabéns! +${data.xpEarned || xpReward} XP creditados.`, 'xp');
        return true;
      }
    } catch (e) {
      console.warn('Lesson complete fallback:', e);
    }

    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, isCompleted: true } : l));
    if (profile) {
      const updatedProf = { ...profile, totalXP: profile.totalXP + xpReward };
      setProfile(updatedProf);
      saveUserProfileToFirestore(updatedProf).catch(e => console.warn('Firestore profile sync error:', e));
    }
    showToast('📖 Lição Concluída!', `+${xpReward} XP creditados.`, 'xp');
    return true;
  };

  // Handler: Start Challenge in Studio
  const handleStartChallengeInStudio = (challenge: Challenge) => {
    setActiveChallengeTheme({
      title: challenge.title,
      theme: challenge.theme,
      requiredWords: challenge.requiredWords,
      timeLimitSeconds: challenge.timeLimitSeconds,
    });

    // Match recommended beat
    const matchingBeat = PRESET_BEATS.find(b => b.title.toLowerCase().includes(challenge.recommendedBeat.toLowerCase()) || b.style.toLowerCase() === challenge.recommendedBeat.toLowerCase());
    if (matchingBeat) {
      setCurrentBeat(matchingBeat);
      globalBeatEngine.setBeat(matchingBeat);
    }

    setActiveTab('studio');
  };

  // Handler: Update Profile
  const handleUpdateProfile = async (updated: Partial<UserProfile>): Promise<boolean> => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          saveUserProfileToFirestore(data.profile).catch(e => console.warn('Firestore profile sync error:', e));
        }
        showToast('✅ Perfil Atualizado', 'Suas informações de MC foram salvas!', 'info');
        return true;
      }
    } catch (err) {
      console.warn('Profile update fallback:', err);
    }
    if (profile) {
      const updatedProf = { ...profile, ...updated };
      setProfile(updatedProf);
      saveUserProfileToFirestore(updatedProf).catch(e => console.warn('Firestore profile sync error:', e));
    }
    showToast('✅ Perfil Atualizado', 'Suas informações de MC foram salvas!', 'info');
    return true;
  };

  // Handler: Upgrade Plan
  const handleUpgradePlan = async (plan: 'FREE_TRIAL' | 'MONTHLY' | 'ANNUAL' | 'PRO' | 'PREMIUM'): Promise<boolean> => {
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPlan: plan }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subscription) setSubscription(data.subscription);
        showToast(
          '👑 Plano Atualizado!',
          plan === 'ANNUAL' ? 'Plano Anual VIP ativado!' : plan === 'MONTHLY' ? 'Plano Mensal ativado!' : 'Plano atualizado!',
          'ach'
        );
        return true;
      }
    } catch (err) {
      console.warn('Subscription update fallback:', err);
    }
    if (subscription) setSubscription({ ...subscription, plan: plan as any });
    showToast('👑 Plano Atualizado!', 'Acesso aos novos recursos liberado!', 'ach');
    return true;
  };

  // Handler: Update Live Call from Admin
  const handleUpdateLiveCall = async (callData: Partial<LiveCallSession>): Promise<boolean> => {
    const rawUrl = (callData.url || liveCall?.url || 'https://discord.gg/rimalab').trim();
    const cleanUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

    const updated: LiveCallSession = {
      id: callData.id || liveCall?.id || `live_${Date.now()}`,
      isActive: callData.isActive !== undefined ? callData.isActive : true,
      platform: callData.platform || liveCall?.platform || 'discord',
      url: cleanUrl,
      title: (callData.title || liveCall?.title || 'Mentoria ao Vivo de Freestyle').trim(),
      description: (callData.description || liveCall?.description || 'Entre na sala de voz/vídeo para treino 1-a-1 com Luquita MC & Kowalski MC.').trim(),
      hostName: (callData.hostName || liveCall?.hostName || 'Luquita MC & Kowalski MC').trim(),
      startedAt: callData.startedAt || new Date().toISOString(),
      targetTier: callData.targetTier || liveCall?.targetTier || 'ALL',
    };

    setLiveCall(updated);
    try {
      localStorage.setItem('rimalab_live_call', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage save fallback', e);
    }
    return true;
  };

  // Handler: Login with Gmail Success
  const handleGmailLoginSuccess = (user: any, userProfile: UserProfile, userSub: Subscription, trialStatus: TrialStatus) => {
    setProfile(userProfile);
    setSubscription(userSub);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#10b981', '#3b82f6'],
    });
  };

  // Handler: Update Focus Skills / Trilha Customizada
  const handleUpdateFocusSkills = (skills: SkillFocusType[], trainingType?: BattleTrainingType) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      focusSkills: skills,
      ...(trainingType ? { trainingType } : {}),
    };
    setProfile(updated);
    try {
      localStorage.setItem('rimalab_user_profile', JSON.stringify(updated));
    } catch {}
    showToast('🎯 Assuntos Atualizados!', `Sua trilha agora foca em ${skills.length} assuntos selecionados.`, 'xp');
  };

  // Handler: Select Category from Top Header Bar
  const handleSelectCategory = (catName: string) => {
    setSelectedCategory(catName);
    const lower = catName.toLowerCase();
    
    // Map category to skill track ID
    let mappedSkill: string = 'punchline';
    if (lower.includes('speed') || lower.includes('double')) mappedSkill = 'speedflow';
    else if (lower.includes('punchline') || lower.includes('batalha') || lower.includes('sangue')) mappedSkill = 'punchline';
    else if (lower.includes('encaixe') || lower.includes('beat')) mappedSkill = 'encaixe_beat';
    else if (lower.includes('contagem') || lower.includes('métrica') || lower.includes('4/4')) mappedSkill = 'contagem_versos';
    else if (lower.includes('flow') || lower.includes('trap') || lower.includes('detroit')) mappedSkill = 'flow';
    else if (lower.includes('gasta') || lower.includes('humor')) mappedSkill = 'gastacao';
    else if (lower.includes('ideol') || lower.includes('poesia') || lower.includes('fundamento')) mappedSkill = 'ideologica';

    setInitialSkillTab(mappedSkill);
    setActiveTab('tracks');
    showToast(
      `🎯 Categoria: ${catName}`,
      `Trilha do seu cargo carregada com sucesso.`,
      'xp'
    );
  };

  return (
    <NavigationProvider
      profile={profile}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      onSelectSkillTrack={(skillId) => {
        setInitialSkillTab(skillId);
      }}
    >
      <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 font-sans selection:bg-amber-500 selection:text-neutral-950 flex flex-col">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-neutral-900/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 font-black">
              {toastMessage.type === 'ach' ? '🏆' : '⚡'}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">{toastMessage.title}</h4>
              <p className="text-xs text-neutral-300">{toastMessage.desc}</p>
            </div>
          </div>
        )}

        {/* Main Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          profile={profile}
          subscription={subscription}
          liveCall={liveCall}
          onOpenSubscription={() => setIsSubscriptionOpen(true)}
          onOpenPromptGen={() => setIsPromptGenOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenGmailAuth={() => setIsGmailAuthOpen(true)}
          onOpenVoiceCoach={() => setIsVoiceCoachOpen(true)}
          onSelectCategory={handleSelectCategory}
          selectedCategory={selectedCategory}
          isPlayingBeat={isPlayingBeat}
          onToggleBeat={() => {
            const playing = globalBeatEngine.togglePlay();
            setIsPlayingBeat(playing);
          }}
          currentBeatTitle={currentBeat.title}
        />

      {/* Global Real-Time Live Call Broadcast Banner (When Teacher is Live on Discord / Meet) */}
      {liveCall?.isActive && liveCall.url && !isLiveBannerDismissed && (
        <div className="relative z-30 border-b border-red-500/50 bg-gradient-to-r from-red-950/90 via-neutral-900/95 to-red-950/90 px-4 py-2.5 shadow-lg shadow-red-950/30 backdrop-blur-md animate-in slide-in-from-top-2 duration-300">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center md:text-left">
              <span className="flex h-3 w-3 shrink-0 rounded-full bg-red-500 animate-ping" />
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-black uppercase text-white tracking-wider shadow-sm shadow-red-600/50">
                  🔴 AO VIVO NO DISCORD / CALL
                </span>
                <span className="text-xs font-bold text-white">
                  {liveCall.title || 'Aulas & Mentoria com os Professores'}
                </span>
                <span className="hidden sm:inline text-xs text-neutral-400">
                  • por <strong className="text-amber-400">{liveCall.hostName || 'Kowalski MC & Luquita MC'}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={/^https?:\/\//i.test(liveCall.url) ? liveCall.url : `https://${liveCall.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 px-3.5 py-1.5 text-xs font-black text-white hover:from-red-500 hover:to-amber-500 shadow-md shadow-red-600/40 transition-all hover:scale-105 active:scale-95"
              >
                <span>Entrar no Discord Agora</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                onClick={() => setActiveTab('calls')}
                className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800/90 px-3 py-1.5 text-xs font-bold text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
                title="Abrir Sala de Calls no RimaLab"
              >
                <Video className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Sala de Calls</span>
              </button>

              <button
                onClick={() => setIsLiveBannerDismissed(true)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                title="Minimizar aviso temporariamente"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1 pb-12">
        {activeTab === 'onboarding' && (
          <OnboardingLanding
            onEnterApp={(customProfile) => {
              if (customProfile) {
                const updated: UserProfile = profile 
                  ? { ...profile, ...customProfile } 
                  : {
                      id: 'user_default',
                      userId: 'user_default',
                      bio: 'Treinando freestyle no RimaLab.',
                      level: 1,
                      totalXP: 150,
                      streakDays: 1,
                      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                      isPublic: true,
                      ...(customProfile as UserProfile)
                    };
                setProfile(updated);
                if (customProfile.selectedCategories && customProfile.selectedCategories.length > 0) {
                  setSelectedCategory(customProfile.selectedCategories[0]);
                }
                try {
                  localStorage.setItem('rimalab_user_profile', JSON.stringify(updated));
                } catch {}
                saveUserProfileToFirestore(updated);
              }
              setActiveTab('tracks');
              showToast('🎭 Cargo e Categorias Atualizados!', 'A barra superior agora reflete suas escolhas de treino.', 'ach');
            }}
            onSelectBeatAndStart={(selectedBeat) => {
              setCurrentBeat(selectedBeat);
              globalBeatEngine.setBeat(selectedBeat);
              globalBeatEngine.start();
              setIsPlayingBeat(true);
              setActiveTab('studio');
              showToast('🎙️ Beat Carregado no Studio!', `Você está rimando com "${selectedBeat.title}".`, 'xp');
            }}
            isPlayingBeat={isPlayingBeat}
            onToggleBeat={() => {
              const playing = globalBeatEngine.togglePlay();
              setIsPlayingBeat(playing);
            }}
            currentBeat={currentBeat}
            onOpenGmailAuth={() => setIsGmailAuthOpen(true)}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenSubscription={() => setIsSubscriptionOpen(true)}
          />
        )}

        {activeTab === 'studio' && (
          <FreestyleStudio
            profile={profile}
            onSessionComplete={handleSessionComplete}
            activeChallengeTheme={activeChallengeTheme}
            onClearChallengeTheme={() => setActiveChallengeTheme(null)}
            onOpenPromptGen={() => setIsPromptGenOpen(true)}
            isPlayingBeat={isPlayingBeat}
            setIsPlayingBeat={setIsPlayingBeat}
            currentBeat={currentBeat}
            setCurrentBeat={setCurrentBeat}
          />
        )}

        {activeTab === 'bot' && (
          <DiscordBeatBot
            profile={profile}
            currentBeat={currentBeat}
            setCurrentBeat={setCurrentBeat}
            isPlayingBeat={isPlayingBeat}
            setIsPlayingBeat={setIsPlayingBeat}
            onSendToStudio={(selectedBeat) => {
              setCurrentBeat(selectedBeat);
              globalBeatEngine.setBeat(selectedBeat);
              if (!isPlayingBeat) {
                globalBeatEngine.start();
                setIsPlayingBeat(true);
              }
              setActiveTab('studio');
              showToast('🎙️ Beat Carregado no Studio!', `Você está rimando com "${selectedBeat.title}".`, 'xp');
            }}
          />
        )}

        {activeTab === 'calls' && (
          <LiveCallRoom
            liveCall={liveCall}
            profile={profile}
            subscription={subscription}
            onOpenAdmin={() => setIsAdminOpen(true)}
            onOpenSubscription={() => setIsSubscriptionOpen(true)}
            onOpenStudio={() => setActiveTab('studio')}
            onOpenVoiceCoach={() => setIsVoiceCoachOpen(true)}
            isPlayingBeat={isPlayingBeat}
            onToggleBeat={() => {
              const playing = globalBeatEngine.togglePlay();
              setIsPlayingBeat(playing);
            }}
            currentBeat={currentBeat}
            onSelectBeat={(selectedBeat) => {
              setCurrentBeat(selectedBeat);
              globalBeatEngine.setBeat(selectedBeat);
            }}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'tracks' && (
          <SkillTracksView
            profile={profile}
            initialSelectedTab={initialSkillTab}
            onUpdateFocusSkills={(skills, trainingType) => {
              handleUpdateFocusSkills(skills, trainingType);
            }}
            onSendToStudioWithSetup={(config) => {
              if (config.beatStyle) {
                const match = PRESET_BEATS.find(b => b.style.toLowerCase().includes(config.beatStyle!.toLowerCase())) || PRESET_BEATS[0];
                setCurrentBeat(match);
                globalBeatEngine.setBeat(match);
                if (config.bpm) {
                  globalBeatEngine.setBpm(config.bpm);
                }
              }
              if (config.prompt) {
                setActiveChallengeTheme({
                  title: 'Treino de Trilha Personalizada',
                  theme: config.prompt,
                  requiredWords: [],
                });
              }
              if (!isPlayingBeat) {
                globalBeatEngine.start();
                setIsPlayingBeat(true);
              }
              setActiveTab('studio');
              showToast('🎙️ Studio Carregado com Sua Trilha!', 'Ferramentas do seu assunto foram ativadas no estúdio.', 'xp');
            }}
          />
        )}

        {activeTab === 'lessons' && (
          <RhymeLabAcademy
            lessons={lessons}
            profile={profile}
            onCompleteLesson={handleCompleteLesson}
            onOpenSkillTracks={(skillId) => {
              setInitialSkillTab(skillId);
              setActiveTab('tracks');
            }}
            onSendToStudio={(customLyrics) => {
              setActiveTab('studio');
            }}
          />
        )}

        {activeTab === 'challenges' && (
          <DailyChallenges
            challenges={challenges}
            profile={profile}
            onStartChallengeInStudio={handleStartChallengeInStudio}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsView
            achievements={achievements}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            currentProfile={profile}
          />
        )}

        {activeTab === 'suggestions' && (
          <SuggestionsTab
            profile={profile}
            onOpenStudio={() => setActiveTab('studio')}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            practiceSessions={practiceSessions}
            xpTransactions={xpTransactions}
          />
        )}
      </main>

      {/* Modals */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        subscription={subscription}
        onUpgradePlan={handleUpgradePlan}
      />

      <PromptGeneratorModal
        isOpen={isPromptGenOpen}
        onClose={() => setIsPromptGenOpen(false)}
        onApplyToStudio={(themeData) => {
          setActiveChallengeTheme(themeData);
          setActiveTab('studio');
          if (!isPlayingBeat) {
            globalBeatEngine.start();
            setIsPlayingBeat(true);
          }
        }}
      />

      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        profile={profile}
        currentLiveCall={liveCall}
        onUpdateLiveCall={handleUpdateLiveCall}
        onShowToast={showToast}
        onNavigateToCalls={() => setActiveTab('calls')}
      />

      <GmailAuthModal
        isOpen={isGmailAuthOpen}
        onClose={() => setIsGmailAuthOpen(false)}
        onLoginSuccess={handleGmailLoginSuccess}
        onShowToast={showToast}
      />

      <AIVoiceProfessorModal
        isOpen={isVoiceCoachOpen}
        onClose={() => setIsVoiceCoachOpen(false)}
        profile={profile}
        subscription={subscription}
        onShowToast={showToast}
        onGainXP={(amount, reason) => {
          if (profile) {
            const updatedProf = { ...profile, totalXP: profile.totalXP + amount };
            setProfile(updatedProf);
            saveUserProfileToFirestore(updatedProf).catch(e => console.warn('Firestore profile sync error:', e));
          }
          showToast(`⚡ +${amount} XP`, reason, 'xp');
        }}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-neutral-200">RimaLab AI</span>
              <span className="text-neutral-500">•</span>
              <span className="text-amber-400 font-semibold">Criado por Luquita MC & Kowalski MC</span>
            </div>
            <span className="hidden md:inline text-neutral-600">— Plataforma de Treinamento de Freestyle & Rimas</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('onboarding')} className="hover:text-amber-400 font-medium">🏠 Início</button>
            <button onClick={() => setActiveTab('studio')} className="hover:text-neutral-300">Studio</button>
            <button onClick={() => setActiveTab('bot')} className="hover:text-neutral-300">Bot Beats</button>
            <button onClick={() => setActiveTab('lessons')} className="hover:text-neutral-300">Academia</button>
            <button onClick={() => setActiveTab('leaderboard')} className="hover:text-neutral-300">Ranking</button>
            <button onClick={() => setIsSubscriptionOpen(true)} className="text-amber-500 hover:underline font-bold">Planos PRO</button>
          </div>
        </div>
      </footer>

      </div>
    </NavigationProvider>
  );
}

export default App;
