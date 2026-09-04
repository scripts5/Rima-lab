import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Flame,
  Volume2,
  VolumeX,
  Check,
  Trash2,
  Sparkles,
  Shield,
  Clock,
  Swords,
  Radio,
  X,
  ChevronRight,
  Award,
  BookOpen,
  AlertTriangle,
  Zap,
  GraduationCap
} from 'lucide-react';
import {
  AppNotification,
  NotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  getStoredNotifications,
  saveStoredNotifications,
  triggerDuolingoNotification,
  requestNativeNotificationPermission,
  playNotificationSound,
  DUOLINGO_NOTIFICATIONS_POOL,
  hasCompletedLessonToday,
  triggerLessonDebtNotification,
  checkAndTriggerDuolingoLessonWatchdog,
} from '../utils/duolingoNotifications';
import { Lesson } from '../types';

interface DuolingoNotificationCenterProps {
  currentStreak?: number;
  lessons?: Lesson[];
  onNavigateToTab?: (tab: string) => void;
}

export const DuolingoNotificationCenter: React.FC<DuolingoNotificationCenterProps> = ({
  currentStreak = 3,
  lessons = [],
  onNavigateToTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveCenterTab] = useState<'notifications' | 'settings'>('notifications');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  // Calculate lesson status
  const pendingLessons = lessons.filter((l) => !l.isCompleted);
  const nextLesson = pendingLessons[0];
  const isLessonDoneToday = hasCompletedLessonToday();

  // Load initial stored notifications
  useEffect(() => {
    const stored = getStoredNotifications();
    if (stored.length === 0) {
      // Seed an initial friendly Duolingo style motivational welcome
      const initial: AppNotification = {
        id: 'initial_duo_welcome',
        title: '🦉 Bem-vindo à Academia de Rimas!',
        body: 'Kowalski MC & Luquita MC ativaram a cobrança de treino. Não pule sua lição diária para evoluir seu flow!',
        category: 'lesson',
        timestamp: Date.now(),
        read: false,
        priority: 'high',
        characterMood: 'encouraging',
        actionLabel: 'Ver Lições de Hoje',
        actionTab: 'lessons',
      };
      saveStoredNotifications([initial]);
      setNotifications([initial]);
    } else {
      setNotifications(stored);
    }
  }, []);

  // Automated Duolingo-style lesson & streak watchdog
  useEffect(() => {
    const runWatchdog = () => {
      // 1. Duolingo Lesson Watchdog ("Cobrança de Lição")
      const nextTitle = nextLesson ? `${nextLesson.title}` : 'Métrica 4/4 e Rimas Ricas';
      checkAndTriggerDuolingoLessonWatchdog(nextTitle, (n) => {
        showInAppToast(n);
      });

      // 2. Streak urgency watchdog
      const lastTrainedRaw = localStorage.getItem('rimalab_last_practice_time');
      const now = new Date();
      const currentHour = now.getHours();
      
      // If evening (after 18h) and no training in last 14h, trigger streak urgency
      const lastTrained = lastTrainedRaw ? parseInt(lastTrainedRaw, 10) : 0;
      const hoursSinceTraining = (Date.now() - lastTrained) / (1000 * 60 * 60);

      if (hoursSinceTraining > 14 && currentHour >= 18) {
        const lastUrgentPrompt = localStorage.getItem('rimalab_last_streak_prompt_date');
        const todayStr = now.toISOString().split('T')[0];
        
        if (lastUrgentPrompt !== todayStr) {
          localStorage.setItem('rimalab_last_streak_prompt_date', todayStr);
          const pool = DUOLINGO_NOTIFICATIONS_POOL.streakThreat;
          const randomPrompt = pool[Math.floor(Math.random() * pool.length)];

          triggerDuolingoNotification(
            {
              title: randomPrompt.title,
              body: randomPrompt.body,
              category: 'streak',
              priority: 'urgent',
              characterMood: randomPrompt.characterMood,
              actionLabel: 'Salvar Ofensiva (+100 XP)',
              actionTab: 'punchlines',
            },
            (n) => showInAppToast(n)
          );
        }
      }
    };

    // Run short initial check after 2 seconds
    const timer = setTimeout(runWatchdog, 2500);
    const interval = setInterval(runWatchdog, 1000 * 60 * 10); // check every 10 min

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [nextLesson, settings]);

  const showInAppToast = (n: AppNotification) => {
    setActiveToast(n);
    setNotifications((prev) => [n, ...prev.filter((item) => item.id !== n.id)]);
    // Auto dismiss toast after 7s
    setTimeout(() => {
      setActiveToast((curr) => (curr?.id === n.id ? null : curr));
    }, 7000);
  };

  const handleRequestPermission = async () => {
    const res = await requestNativeNotificationPermission();
    setPermissionStatus(res);
    setSettings((prev) => ({ ...prev, enabled: res === 'granted' }));

    if (res === 'granted') {
      triggerDuolingoNotification(
        {
          title: '🔔 Cobrança de Lições Ativada!',
          body: 'O mascote Coruja e os MCs mentores vão te lembrar das suas lições para você nunca perder o flow.',
          category: 'lesson',
          priority: 'high',
          actionLabel: 'Fazer Lição Agora 🦉',
          actionTab: 'lessons',
        },
        (n) => showInAppToast(n)
      );
    }
  };

  // Test Duolingo Lesson Nag ("Cobrança de Lição do Duolingo")
  const handleTestDuolingoLessonNag = () => {
    const created = triggerLessonDebtNotification({
      nextLessonTitle: nextLesson ? `${nextLesson.title}` : 'Treino de Métrica 4/4',
      intensity: settings.lessonNagIntensity,
      onInAppToast: (n) => showInAppToast(n),
    });
    setNotifications((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
  };

  // Test Duolingo Streak Warning
  const handleTestDuolingoStreakNotification = () => {
    const randomPool = DUOLINGO_NOTIFICATIONS_POOL.streakThreat;
    const randomMsg = randomPool[Math.floor(Math.random() * randomPool.length)];

    const created = triggerDuolingoNotification(
      {
        title: randomMsg.title,
        body: randomMsg.body,
        category: 'streak',
        priority: 'urgent',
        characterMood: randomMsg.characterMood,
        actionLabel: 'Salvar Ofensiva Agora',
        actionTab: 'punchlines',
      },
      (n) => showInAppToast(n)
    );
    setNotifications((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
  };

  const handleToggleSound = () => {
    const updated = saveNotificationSettings({ soundEnabled: !settings.soundEnabled });
    setSettings(updated);
    if (updated.soundEnabled) {
      playNotificationSound('lesson');
    }
  };

  const handleToggleLessonReminders = () => {
    const updated = saveNotificationSettings({ lessonReminders: !settings.lessonReminders });
    setSettings(updated);
  };

  const handleChangeIntensity = (intensity: 'gentle' | 'duolingo' | 'hardcore') => {
    const updated = saveNotificationSettings({ lessonNagIntensity: intensity });
    setSettings(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    saveStoredNotifications(updated);
  };

  const handleClearHistory = () => {
    setNotifications([]);
    saveStoredNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* 1. Header Trigger Bell with Live Ping */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            handleMarkAllAsRead();
          }
        }}
        className="relative flex items-center justify-center h-9 w-9 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all active:scale-95 shadow-sm"
        title="Cobrança de Lição & Notificações Duolingo"
        aria-label="Notificações"
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="h-4 w-4 text-amber-400 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white shadow-lg animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <Bell className="h-4 w-4 text-neutral-400" />
        )}
      </button>

      {/* 2. Floating Duolingo-style In-App Notification Toast */}
      {activeToast && (
        <aside
          aria-label="Lembrete e cobrança de lição"
          className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 rounded-2xl border-2 border-amber-500/90 bg-neutral-950/95 backdrop-blur-md p-4 shadow-2xl shadow-black/90 text-white animate-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black shadow-lg shrink-0 border ${
              activeToast.category === 'lesson'
                ? 'bg-gradient-to-br from-emerald-500 to-amber-600 border-amber-300/40 shadow-emerald-500/30'
                : 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-300/40 shadow-amber-500/30'
            }`}>
              {activeToast.category === 'lesson' ? (
                <span className="text-xl select-none" role="img" aria-label="owl">🦉</span>
              ) : activeToast.category === 'streak' ? (
                <Flame className="h-6 w-6 text-neutral-950 animate-pulse" />
              ) : activeToast.category === 'battle' ? (
                <Swords className="h-6 w-6 text-neutral-950" />
              ) : (
                <Sparkles className="h-6 w-6 text-neutral-950" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                  <span>🦉</span>
                  <span>{activeToast.category === 'lesson' ? 'Cobrança de Lição' : 'Lembrete do Mentor'}</span>
                </span>
                <span className="text-[10px] text-neutral-500">Agora</span>
              </div>
              <h4 className="font-display font-black text-sm text-white mt-0.5">
                {activeToast.title}
              </h4>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                {activeToast.body}
              </p>

              <div className="flex items-center gap-2 mt-3">
                {activeToast.actionLabel && (
                  <button
                    onClick={() => {
                      if (activeToast.actionTab && onNavigateToTab) {
                        onNavigateToTab(activeToast.actionTab);
                      }
                      setActiveToast(null);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1.5 text-xs font-black text-neutral-950 hover:brightness-110 active:scale-95 transition-all shadow-md"
                  >
                    <span>{activeToast.actionLabel}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setActiveToast(null)}
                  className="rounded-xl bg-neutral-900 hover:bg-neutral-800 px-2.5 py-1.5 text-xs font-bold text-neutral-400 hover:text-white border border-neutral-800 transition-all"
                >
                  Depois
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveToast(null)}
              className="text-neutral-500 hover:text-neutral-300 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </aside>
      )}

      {/* 3. Notification Center Dropdown / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full sm:max-w-md h-full sm:h-auto sm:max-h-[88vh] rounded-none sm:rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl flex flex-col overflow-hidden text-white animate-in slide-in-from-right-4 sm:slide-in-from-top-2 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg">
                  🦉
                </div>
                <div>
                  <h3 className="font-display font-black text-sm text-white flex items-center gap-1.5">
                    <span>Cobrança de Lição & Ofensiva</span>
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1 text-orange-400 font-bold">
                      <Flame className="h-3 w-3 fill-orange-400" />
                      {currentStreak}d ofensiva
                    </span>
                    <span>•</span>
                    <span className={isLessonDoneToday ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                      {isLessonDoneToday ? 'Lição Feita ✅' : 'Lição Pendente ⚠️'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleToggleSound}
                  className={`p-2 rounded-xl border transition-colors ${
                    settings.soundEnabled
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                  }`}
                  title={settings.soundEnabled ? 'Sons Duolingo Ativados' : 'Sons Desativados'}
                >
                  {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-neutral-800/80 bg-neutral-900/30 px-3 pt-2 gap-2 text-xs font-bold">
              <button
                onClick={() => setActiveCenterTab('notifications')}
                className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'notifications'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Notificações ({notifications.length})
              </button>
              <button
                onClick={() => setActiveCenterTab('settings')}
                className={`pb-2 px-3 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Configurar Cobrança 🦉
              </button>
            </div>

            {/* Permission Banner if not granted */}
            {permissionStatus !== 'granted' && (
              <div className="m-3 p-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-neutral-900 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <BellRing className="h-4 w-4 text-amber-400 animate-bounce" />
                  <span>Ativar Notificações Push no Celular</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Permita as notificações push para que o Coruja e os mentores possam te cobrar diariamente e lembrar da sua lição de rima antes de virar o dia!
                </p>
                <button
                  onClick={handleRequestPermission}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2 text-xs font-black text-neutral-950 hover:brightness-110 active:scale-95 transition-all shadow-md"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Permitir Notificações Push</span>
                </button>
              </div>
            )}

            {/* Duolingo Daily Lesson Card Status */}
            <div className="mx-3 mt-3 p-3 rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                    isLessonDoneToday ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-amber-500/20 border border-amber-500/40 animate-pulse'
                  }`}>
                    {isLessonDoneToday ? '🦉✨' : '🦉⚠️'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        isLessonDoneToday ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {isLessonDoneToday ? 'Meta Diária Cumprida' : 'Cobrança do Dia'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white mt-1">
                      {isLessonDoneToday
                        ? 'Você já completou a lição de hoje!'
                        : nextLesson
                        ? `Lição Pendente: "${nextLesson.title}"`
                        : 'Sua lição de rima tá te esperando!'}
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                      {isLessonDoneToday
                        ? 'O Coruja do Rap tá orgulhoso! Seu flow evoluiu e seus pontos de XP foram garantidos.'
                        : 'Kowalski MC & Luquita MC estão de olho! Treine 4 compassos para não enferrujar.'}
                    </p>
                  </div>
                </div>

                {!isLessonDoneToday && (
                  <button
                    onClick={() => {
                      onNavigateToTab?.('lessons');
                      setIsOpen(false);
                    }}
                    className="shrink-0 flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-black text-neutral-950 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-amber-500/20"
                  >
                    <span>Fazer</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Main Tab Content */}
            {activeTab === 'notifications' ? (
              <>
                {/* Duolingo Simulator Buttons */}
                <div className="px-4 py-2.5 bg-neutral-900/30 border-b border-neutral-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={handleTestDuolingoLessonNag}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-black transition-all active:scale-95"
                      title="Dispara a notificação idêntica ao Duolingo cobrando que você faça a lição de rima"
                    >
                      <span>🦉</span>
                      <span>Cobrar Lição (Push)</span>
                    </button>

                    <button
                      onClick={handleTestDuolingoStreakNotification}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/30 text-[11px] font-bold transition-all active:scale-95"
                      title="Dispara aviso de ofensiva quase expirando"
                    >
                      <Flame className="h-3 w-3 text-orange-400" />
                      <span>Ofensiva</span>
                    </button>
                  </div>

                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="text-[11px] text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1"
                      title="Limpar histórico"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center text-neutral-500 space-y-2">
                      <div className="text-3xl">🦉</div>
                      <p className="text-xs font-bold text-neutral-400">Nenhuma cobrança no momento.</p>
                      <p className="text-[11px] text-neutral-500">
                        O Coruja do Rap enviará lembretes e avisos aqui e na barra de notificações do seu celular!
                      </p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          notif.read
                            ? 'bg-neutral-900/40 border-neutral-800 text-neutral-300'
                            : notif.category === 'lesson'
                            ? 'bg-neutral-900/90 border-amber-500/40 text-white shadow-md'
                            : 'bg-neutral-900 border-amber-500/30 text-white shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            notif.category === 'lesson'
                              ? 'bg-amber-500/20 border border-amber-500/40 text-base'
                              : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                          }`}>
                            {notif.category === 'lesson' ? (
                              <span>🦉</span>
                            ) : notif.category === 'streak' ? (
                              <Flame className="h-4 w-4 text-orange-400" />
                            ) : notif.category === 'battle' ? (
                              <Swords className="h-4 w-4" />
                            ) : (
                              <Award className="h-4 w-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs text-white truncate">
                                {notif.title}
                              </h4>
                              <span className="text-[10px] text-neutral-500 shrink-0">
                                {new Date(notif.timestamp).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 leading-relaxed">
                              {notif.body}
                            </p>

                            {notif.actionLabel && (
                              <div className="pt-1">
                                <button
                                  onClick={() => {
                                    if (notif.actionTab && onNavigateToTab) {
                                      onNavigateToTab(notif.actionTab);
                                    }
                                    setIsOpen(false);
                                  }}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
                                >
                                  <span>{notif.actionLabel}</span>
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              /* Settings Tab */
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>🦉</span>
                        <span>Cobrança de Lições (Estilo Duolingo)</span>
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Pedir e cobrar insistentemente que você faça a lição na Academia
                      </p>
                    </div>
                    <button
                      onClick={handleToggleLessonReminders}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        settings.lessonReminders ? 'bg-amber-500' : 'bg-neutral-800'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          settings.lessonReminders ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {settings.lessonReminders && (
                    <div className="pt-2 border-t border-neutral-800 space-y-2">
                      <label className="text-[11px] font-bold text-neutral-300 block">
                        Intensidade da Cobrança:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleChangeIntensity('gentle')}
                          className={`p-2 rounded-xl text-center border text-[11px] font-bold transition-all ${
                            settings.lessonNagIntensity === 'gentle'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <div>Gentil</div>
                          <div className="text-[9px] font-normal text-neutral-500 mt-0.5">1x ao dia</div>
                        </button>

                        <button
                          onClick={() => handleChangeIntensity('duolingo')}
                          className={`p-2 rounded-xl text-center border text-[11px] font-bold transition-all ${
                            settings.lessonNagIntensity === 'duolingo'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <div>🦉 Duolingo</div>
                          <div className="text-[9px] font-normal text-neutral-500 mt-0.5">Insistente</div>
                        </button>

                        <button
                          onClick={() => handleChangeIntensity('hardcore')}
                          className={`p-2 rounded-xl text-center border text-[11px] font-bold transition-all ${
                            settings.lessonNagIntensity === 'hardcore'
                              ? 'bg-red-500/20 text-red-300 border-red-500/60'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <div>🔥 Hardcore</div>
                          <div className="text-[9px] font-normal text-neutral-500 mt-0.5">Sem perdão</div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sound Settings */}
                <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Volume2 className="h-4 w-4 text-amber-400" />
                      <span>Efeitos Sonoros Duolingo</span>
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Tocar fanfarra e alertas melódicos nas notificações
                    </p>
                  </div>
                  <button
                    onClick={handleToggleSound}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      settings.soundEnabled ? 'bg-amber-500' : 'bg-neutral-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Footer Summary with Link to Ofensiva & Metas */}
            <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between text-[11px] text-neutral-400">
              <button
                onClick={() => {
                  onNavigateToTab?.('lessons');
                  setIsOpen(false);
                }}
                className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                <span>Ir para Academia de Rimas</span>
              </button>
              <span className="text-neutral-500 font-medium">OneSignal & Push Ativos</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

