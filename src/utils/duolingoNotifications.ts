/**
 * Native Mobile & System Notification Engine for RimaLab (APK / PWA / Webview)
 * Fires true device system tray notifications with vibration, sound, badge, and actions.
 */

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: 'streak' | 'battle' | 'live_call' | 'achievement' | 'challenge' | 'teacher';
  icon?: string;
  actionLabel?: string;
  actionTab?: string;
  timestamp: number;
  read: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  characterMood?: 'encouraging' | 'urgent' | 'proud' | 'provocative';
}

export interface NotificationSettings {
  enabled: boolean;
  streakReminders: boolean;
  liveCallAlerts: boolean;
  battleInvites: boolean;
  soundEnabled: boolean;
  reminderTime: string;
  hasPromptedPermission: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  streakReminders: true,
  liveCallAlerts: true,
  battleInvites: true,
  soundEnabled: true,
  reminderTime: '19:30',
  hasPromptedPermission: false,
};

// Duolingo-style messages repository
export const DUOLINGO_NOTIFICATIONS_POOL = {
  streakThreat: [
    {
      title: '🔥 Sua ofensiva de rimas tá em perigo!',
      body: 'Kowalski MC tá de olho! Rime pelo menos 4 compassos hoje no beat pra não perder sua sequência.',
      characterMood: 'urgent' as const,
    },
    {
      title: '👀 Faltam poucas horas pro dia acabar...',
      body: 'Não deixe seu flow enferrujar! 3 minutinhos no beat salvam seu streak e garantem +100 XP.',
      characterMood: 'provocative' as const,
    },
    {
      title: '⚠️ Sua chama tá quase apagando!',
      body: 'O algoritmo da Arena não perdoa quem dorme no beat. Mande uma rima agora pra manter o topo!',
      characterMood: 'urgent' as const,
    },
  ],
  dailyChallenge: [
    {
      title: '🎯 Desafio Diário de Freestyle Liberado!',
      body: 'Hoje o foco é Métrica 4/4 e Troca de Flow. Complete o treino e ganhe Badge de Agilidade.',
      characterMood: 'encouraging' as const,
    },
    {
      title: '⚡ Treino Relâmpago de Speed Flow!',
      body: 'Os beats mais rápidos de 120 BPM tão esperando seu improviso. Bora rimar?',
      characterMood: 'encouraging' as const,
    },
  ],
  liveMentorship: [
    {
      title: '🎤 Sala de Voz ao Vivo Aberta!',
      body: 'Os professores e a comunidade tão na chamada de voz do Discord. Entra pra mandar rima!',
      characterMood: 'proud' as const,
    },
  ],
  proudStreak: [
    {
      title: '👑 Você é uma máquina de rimas!',
      body: 'Parabéns pela dedicação! Seu vocabulário e métrica tão evoluindo a cada sessão.',
      characterMood: 'proud' as const,
    },
  ],
};

// Web Audio synthesizer for pristine sound
export function playNotificationSound(type: 'streak' | 'chime' | 'achievement' | 'alert' = 'chime') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === 'streak' || type === 'achievement') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.36);
      });
    } else if (type === 'alert') {
      [880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.2);
      });
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.46);
    }
  } catch (err) {
    console.debug('Audio trigger ignored:', err);
  }
}

// Local Storage Helper
export function getNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem('rimalab_notif_settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings {
  const current = getNotificationSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('rimalab_notif_settings', JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

export function getStoredNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('rimalab_notifications_history');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveStoredNotifications(notifs: AppNotification[]) {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = notifs.slice(0, 40);
    localStorage.setItem('rimalab_notifications_history', JSON.stringify(trimmed));
  } catch {}
}

/**
 * Dispatch a NATIVE SYSTEM NOTIFICATION directly to the phone / Android OS system tray
 * (Supports Service Worker, Capacitor, Cordova, and standard Notification API)
 */
export async function sendNativeDeviceNotification(notif: {
  title: string;
  body: string;
  category?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionTab?: string;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // 1. Phone physical vibration buzz
  try {
    if ('vibrate' in navigator && navigator.vibrate) {
      if (notif.priority === 'urgent') {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } else {
        navigator.vibrate([150, 80, 150]);
      }
    }
  } catch (e) {
    console.debug('Device vibration error:', e);
  }

  // 2. Check for Capacitor / Cordova Native Mobile APK Plugins
  try {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { LocalNotifications?: { schedule: (opts: any) => Promise<any> } } } }).Capacitor;
    if (cap?.Plugins?.LocalNotifications) {
      await cap.Plugins.LocalNotifications.schedule({
        notifications: [
          {
            title: notif.title,
            body: notif.body,
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 200) },
            sound: 'beep.wav',
            smallIcon: 'ic_stat_rimalab',
            iconColor: '#f59e0b',
            extra: { tab: notif.actionTab || 'punchlines' },
          },
        ],
      });
      return true;
    }
  } catch (err) {
    console.debug('Capacitor local notification call fallback:', err);
  }

  // 3. Android APK / PWA Service Worker System Notification (This shows in Android top status bar)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && typeof registration.showNotification === 'function') {
        const swOptions: any = {
          body: notif.body,
          icon: '/pwa-192x192.png',
          badge: '/badge-icon.png',
          tag: `rimalab-${notif.category || 'streak'}`,
          renotify: true,
          vibrate: [200, 100, 200],
          data: {
            url: window.location.origin,
            tab: notif.actionTab || 'punchlines',
          },
          actions: [
            { action: 'open_app', title: '🎤 Treinar Agora' },
            { action: 'close', title: 'Depois' },
          ],
        };
        await registration.showNotification(notif.title, swOptions);
        return true;
      }
    } catch (err) {
      console.debug('Service worker showNotification fallback:', err);
    }
  }

  // 4. Fallback: Standard window Notification constructor
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(notif.title, {
        body: notif.body,
        icon: '/pwa-192x192.png',
        badge: '/badge-icon.png',
        tag: `rimalab-${notif.category || 'streak'}`,
        requireInteraction: notif.priority === 'urgent',
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
      return true;
    } catch (err) {
      console.debug('Direct Notification constructor failed:', err);
    }
  }

  return false;
}

/**
 * Dispatch a notification across both mobile system push and internal state
 */
export function triggerDuolingoNotification(
  notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>,
  onInAppToast?: (n: AppNotification) => void
): AppNotification {
  const fullNotif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    read: false,
    ...notif,
  };

  const settings = getNotificationSettings();

  // 1. Play audio chime if enabled
  if (settings.soundEnabled) {
    if (notif.category === 'streak' || notif.category === 'achievement') {
      playNotificationSound('streak');
    } else if (notif.priority === 'urgent') {
      playNotificationSound('alert');
    } else {
      playNotificationSound('chime');
    }
  }

  // 2. Persist in storage history
  const history = getStoredNotifications();
  saveStoredNotifications([fullNotif, ...history]);

  // 3. Dispatch NATIVE SYSTEM NOTIFICATION TO PHONE
  sendNativeDeviceNotification({
    title: fullNotif.title,
    body: fullNotif.body,
    category: fullNotif.category,
    priority: fullNotif.priority,
    actionTab: fullNotif.actionTab,
  });

  // 4. Optional In-App callback
  if (onInAppToast) {
    onInAppToast(fullNotif);
  }

  return fullNotif;
}

/**
 * Request native system notification permission on mobile device / Android APK / browser
 */
export async function requestNativeNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (typeof window === 'undefined') {
    return 'denied';
  }

  // 1. Capacitor / Cordova / Native Plugin Permission Check
  try {
    const cap = (window as unknown as { Capacitor?: { Plugins?: { LocalNotifications?: { requestPermissions: () => Promise<{ display: string }> } } } }).Capacitor;
    if (cap?.Plugins?.LocalNotifications) {
      const res = await cap.Plugins.LocalNotifications.requestPermissions();
      const granted = res.display === 'granted';
      if (granted) {
        localStorage.setItem('rimalab_apk_notifications_enabled', 'true');
        localStorage.setItem('rimalab_notifications_granted', 'true');
      }
      saveNotificationSettings({
        hasPromptedPermission: true,
        enabled: granted,
      });
      return granted ? 'granted' : 'denied';
    }
  } catch (e) {
    console.debug('Capacitor request permission fallback:', e);
  }

  // 2. Check if already allowed in APK wrapper
  if (
    localStorage.getItem('rimalab_apk_notifications_enabled') === 'true' ||
    localStorage.getItem('rimalab_notifications_granted') === 'true'
  ) {
    saveNotificationSettings({
      hasPromptedPermission: true,
      enabled: true,
    });
  }

  // 3. Standard Web & PWA / APK Notification API
  if (!('Notification' in window)) {
    // If browser lacks Notification object (e.g. basic WebViews), enable APK mode and vibration fallback
    localStorage.setItem('rimalab_apk_notifications_enabled', 'true');
    localStorage.setItem('rimalab_notifications_granted', 'true');
    saveNotificationSettings({
      hasPromptedPermission: true,
      enabled: true,
    });
    return 'granted';
  }

  try {
    let permission: NotificationPermission;
    
    // Support promise & callback style for older Android WebViews
    if (typeof Notification.requestPermission === 'function') {
      const permPromise = Notification.requestPermission();
      if (permPromise && typeof permPromise.then === 'function') {
        permission = await permPromise;
      } else {
        permission = await new Promise((resolve) => {
          Notification.requestPermission((p) => resolve(p));
        });
      }
    } else {
      permission = Notification.permission;
    }

    if (permission === 'granted' || permission === 'default') {
      // For APK apps that convert site to APK, mark as granted on user gesture
      localStorage.setItem('rimalab_apk_notifications_enabled', 'true');
      localStorage.setItem('rimalab_notifications_granted', 'true');
    }

    saveNotificationSettings({
      hasPromptedPermission: true,
      enabled: permission === 'granted' || localStorage.getItem('rimalab_apk_notifications_enabled') === 'true',
    });

    return permission === 'denied' ? 'denied' : 'granted';
  } catch (err) {
    console.debug('Error requesting notification permission (fallback to APK grant):', err);
    localStorage.setItem('rimalab_apk_notifications_enabled', 'true');
    localStorage.setItem('rimalab_notifications_granted', 'true');
    saveNotificationSettings({
      hasPromptedPermission: true,
      enabled: true,
    });
    return 'granted';
  }
}
