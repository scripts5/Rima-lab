import React, { useState, useEffect } from 'react';
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
  DiscordBeatBot 
} from './components/DiscordBeatBot';
import { 
  SubscriptionModal 
} from './components/SubscriptionModal';
import { 
  PromptGeneratorModal 
} from './components/PromptGeneratorModal';
import { 
  UserProfile, 
  Subscription, 
  Lesson, 
  Challenge, 
  Achievement, 
  PracticeSession, 
  XPTransaction, 
  Beat, 
  RhymeAnalysis 
} from './types';
import { PRESET_BEATS, globalBeatEngine } from './lib/audio/beatEngine';
import { LESSONS_DATA } from './data/lessons';
import { CHALLENGES_DATA } from './data/challenges';
import { ACHIEVEMENTS_DATA } from './data/achievements';
import confetti from 'canvas-confetti';

export function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'bot' | 'lessons' | 'challenges' | 'achievements' | 'profile' | 'leaderboard'>('studio');
  
  // Data States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>(LESSONS_DATA);
  const [challenges, setChallenges] = useState<Challenge[]>(CHALLENGES_DATA);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_DATA);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);
  const [xpTransactions, setXpTransactions] = useState<XPTransaction[]>([]);

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

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'xp' | 'ach' | 'info' } | null>(null);

  const showToast = (title: string, desc: string, type: 'xp' | 'ach' | 'info' = 'xp') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Dashboard & Profile on Startup
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) setProfile(data.profile);
          if (data.subscription) setSubscription(data.subscription);
          if (data.recentSessions) setPracticeSessions(data.recentSessions);
          if (data.recentTransactions) setXpTransactions(data.recentTransactions);
          if (data.achievements) setAchievements(data.achievements);
          if (data.lessons) setLessons(data.lessons);
          if (data.challenges) setChallenges(data.challenges);
        }
      } catch (err) {
        console.warn('Using local fallback state:', err);
        // Local Seed Fallback
        setProfile({
          id: 'prof_demo_01',
          userId: 'user_demo_01',
          artisticName: 'MC Foco & Flow',
          tagline: 'Mestre da Métrica & Freestyle',
          bio: 'Treinando rimas diárias no RimaLab para dominar as batalhas e o improviso.',
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

        setSubscription({
          userId: 'user_demo_01',
          plan: 'PRO',
          status: 'ACTIVE',
          validUntil: '2027-12-31T23:59:59Z',
          aiMonthlyQuota: 100,
          aiQuotaUsed: 8,
        });
      }
    };

    fetchUserData();
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
      const res = await fetch('/api/practice/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) setProfile(data.profile);
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
          setProfile({
            ...profile,
            totalXP: newXP,
            totalSessions: profile.totalSessions + 1,
            totalMinutesPracticed: profile.totalMinutesPracticed + Math.round(sessionData.durationSeconds / 60),
            bestScore: Math.max(profile.bestScore, sessionData.analysis.overallScore),
          });
        }
        showToast('⚡ Freestyle Registrado!', `Você ganhou +${sessionData.xpEarned} XP!`, 'xp');
      }
    } catch (e) {
      console.warn('Practice session save fallback:', e);
    }
  };

  // Handler: Complete Lesson
  const handleCompleteLesson = async (lessonId: string, customLyrics: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lyrics: customLyrics }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) setProfile(data.profile);
        setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, isCompleted: true } : l));
        showToast('📖 Lição Concluída!', `Parabéns! +${data.xpEarned || 200} XP creditados.`, 'xp');
        return true;
      }
    } catch (e) {
      console.warn('Lesson complete fallback:', e);
    }

    setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, isCompleted: true } : l));
    if (profile) setProfile({ ...profile, totalXP: profile.totalXP + 200 });
    showToast('📖 Lição Concluída!', '+200 XP creditados.', 'xp');
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
        if (data.profile) setProfile(data.profile);
        showToast('✅ Perfil Atualizado', 'Suas informações de MC foram salvas!', 'info');
        return true;
      }
    } catch (err) {
      console.warn('Profile update fallback:', err);
    }
    if (profile) setProfile({ ...profile, ...updated });
    showToast('✅ Perfil Atualizado', 'Suas informações de MC foram salvas!', 'info');
    return true;
  };

  // Handler: Upgrade Plan
  const handleUpgradePlan = async (plan: 'FREE' | 'PRO' | 'PREMIUM'): Promise<boolean> => {
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subscription) setSubscription(data.subscription);
        showToast('👑 Plano Atualizado!', `Seu plano agora é ${plan}!`, 'ach');
        return true;
      }
    } catch (err) {
      console.warn('Subscription update fallback:', err);
    }
    if (subscription) setSubscription({ ...subscription, plan, aiMonthlyQuota: plan === 'PREMIUM' ? 500 : 100 });
    showToast('👑 Plano Atualizado!', `Seu plano agora é ${plan}!`, 'ach');
    return true;
  };

  return (
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
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
        onOpenPromptGen={() => setIsPromptGenOpen(true)}
        isPlayingBeat={isPlayingBeat}
        onToggleBeat={() => {
          const playing = globalBeatEngine.togglePlay();
          setIsPlayingBeat(playing);
        }}
        currentBeatTitle={currentBeat.title}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-12">
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

        {activeTab === 'lessons' && (
          <RhymeLabAcademy
            lessons={lessons}
            onCompleteLesson={handleCompleteLesson}
            onSendToStudio={(customLyrics) => {
              setActiveTab('studio');
            }}
          />
        )}

        {activeTab === 'challenges' && (
          <DailyChallenges
            challenges={challenges}
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

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-neutral-300">RimaLab AI</span>
            <span>— Plataforma de Treinamento de Freestyle & Rimas</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('lessons')} className="hover:text-neutral-300">Academia</button>
            <button onClick={() => setActiveTab('challenges')} className="hover:text-neutral-300">Desafios</button>
            <button onClick={() => setActiveTab('leaderboard')} className="hover:text-neutral-300">Ranking</button>
            <button onClick={() => setIsSubscriptionOpen(true)} className="text-amber-500 hover:underline">Planos PRO</button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
