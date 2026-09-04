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
  Award
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
} from '../utils/duolingoNotifications';

interface DuolingoNotificationCenterProps {
  currentStreak?: number;
  onNavigateToTab?: (tab: string) => void;
}

export const DuolingoNotificationCenter: React.FC<DuolingoNotificationCenterProps> = ({
  currentStreak = 3,
  onNavigateToTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  // Load initial stored notifications
  useEffect(() => {
    const stored = getStoredNotifications();
    if (stored.length === 0) {
      // Seed an initial friendly Duolingo style motivational welcome
      const initial: AppNotification = {
        id: 'initial_duo_welcome',
        title: '🔥 Bem-vindo à Academia de Rimas!',
        body: 'Kowalski MC & Luquita MC ativaram seu medidor de ofensiva. Rime todo dia para manter a chama acesa!',
        category: 'streak',
        timestamp: Date.now(),
        read: false,
        priority: 'high',
        characterMood: 'encouraging',
        actionLabel: 'Treinar Agora',
        actionTab: 'punchlines',
      };
      saveStoredNotifications([initial]);
      setNotifications([initial]);
    } else {
      setNotifications(stored);
    }
  }, []);

  // Automated Duolingo-style streak watchdog
  useEffect(() => {
    // Check if user has trained today; if not and evening has arrived, fire streak alert
    const checkStreakHealth = () => {
      const lastTrainedRaw = localStorage.getItem('rimalab_last_practice_time');
      const now = new Date();
      const currentHour = now.getHours();
      
      // If evening (after 18h) and no training in last 12h, trigger streak urgency
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

    const interval = setInterval(checkStreakHealth, 1000 * 60 * 15); // check every 15 min
    return () => clearInterval(interval);
  }, []);

  const showInAppToast = (n: AppNotification) => {
    setActiveToast(n);
    setNotifications((prev) => [n, ...prev.filter((item) => item.id !== n.id)]);
    // Auto dismiss toast after 6.5s
    setTimeout(() => {
      setActiveToast((curr) => (curr?.id === n.id ? null : curr));
    }, 6500);
  };

  const handleRequestPermission = async () => {
    const res = await requestNativeNotificationPermission();
    setPermissionStatus(res);
    setSettings((prev) => ({ ...prev, enabled: res === 'granted' }));

    if (res === 'granted') {
      triggerDuolingoNotification(
        {
          title: '🔔 Notificações Ativadas com Sucesso!',
          body: 'Você receberá avisos da sua ofensiva, mentorias ao vivo dos professores e novas batalhas.',
          category: 'achievement',
          priority: 'high',
          actionLabel: 'Ver Treinos',
          actionTab: 'punchlines',
        },
        (n) => showInAppToast(n)
      );
    }
  };

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
      playNotificationSound('chime');
    }
  };

  const handleToggleStreakReminders = () => {
    const updated = saveNotificationSettings({ streakReminders: !settings.streakReminders });
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
        title="Central de Notificações & Ofensiva"
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
          aria-label="Lembrete de treino"
          className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 rounded-2xl border-2 border-amber-500/80 bg-neutral-950/95 backdrop-blur-md p-4 shadow-2xl shadow-black/90 text-white animate-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-300/40 flex items-center justify-center font-black shadow-lg shadow-amber-500/30 shrink-0">
              {activeToast.category === 'streak' ? (
                <Flame className="h-6 w-6 text-neutral-950 animate-pulse" />
              ) : activeToast.category === 'battle' ? (
                <Swords className="h-6 w-6 text-neutral-950" />
              ) : (
                <Sparkles className="h-6 w-6 text-neutral-950" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Lembrete do Mentor
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
                  Fechar
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
            className="w-full sm:max-w-md h-full sm:h-auto sm:max-h-[85vh] rounded-none sm:rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl flex flex-col overflow-hidden text-white animate-in slide-in-from-right-4 sm:slide-in-from-top-2 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-800/80 bg-neutral-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Flame className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm text-white">
                    Notificações & Ofensiva
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <span>Ofensiva Atual:</span>
                    <strong className="text-amber-400 font-black">{currentStreak} Dias 🔥</strong>
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
                  title={settings.soundEnabled ? 'Sons Ativados' : 'Sons Desativados'}
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

            {/* Permission Banner if not granted */}
            {permissionStatus !== 'granted' && (
              <div className="m-3 p-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-neutral-900 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <BellRing className="h-4 w-4 text-amber-400 animate-bounce" />
                  <span>Ativar Lembretes no seu Dispositivo</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Receba avisos no celular antes de sua ofensiva de rimas expirar e quando os professores abrirem salas de voz ao vivo.
                </p>
                <button
                  onClick={handleRequestPermission}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2 text-xs font-black text-neutral-950 hover:brightness-110 active:scale-95 transition-all shadow-md"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Permitir Notificações</span>
                </button>
              </div>
            )}

            {/* Duolingo Simulator & Controls Bar */}
            <div className="px-4 py-2.5 bg-neutral-900/30 border-b border-neutral-800 flex items-center justify-between gap-2">
              <button
                onClick={handleTestDuolingoStreakNotification}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black transition-all active:scale-95"
              >
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>Testar Alerta Duolingo</span>
              </button>

              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-[11px] text-neutral-500 hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Limpar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 space-y-2">
                  <Bell className="h-8 w-8 mx-auto text-neutral-600" />
                  <p className="text-xs">Nenhuma notificação recente.</p>
                  <p className="text-[11px] text-neutral-600">
                    Treine diariamente para manter sua ofensiva ativa!
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      notif.read
                        ? 'bg-neutral-900/40 border-neutral-800 text-neutral-300'
                        : 'bg-neutral-900 border-amber-500/30 text-white shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                        {notif.category === 'streak' ? (
                          <Flame className="h-4 w-4" />
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

            {/* Footer Summary with Link to Ofensiva & Metas */}
            <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between text-[11px] text-neutral-400">
              <button
                onClick={() => {
                  onNavigateToTab?.('ofensiva');
                  setIsOpen(false);
                }}
                className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
              >
                <Flame className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
                <span>Ver Ofensiva & Metas Diárias</span>
              </button>
              <span className="text-neutral-500 font-medium">APK / Webview</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
