/**
 * Native Mobile & System Notification Engine for RimaLab (APK / PWA / Webview)
 * Fires true device system tray notifications with vibration, sound, badge, and actions.
 */

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  category: 'streak' | 'battle' | 'live_call' | 'achievement' | 'challenge' | 'teacher' | 'lesson';
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
  lessonReminders: boolean;
  lessonNagIntensity: 'gentle' | 'duolingo' | 'hardcore';
  liveCallAlerts: boolean;
  battleInvites: boolean;
  soundEnabled: boolean;
  reminderTime: string;
  hasPromptedPermission: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  streakReminders: true,
  lessonReminders: true,
  lessonNagIntensity: 'duolingo',
  liveCallAlerts: true,
  battleInvites: true,
  soundEnabled: true,
  reminderTime: '19:30',
  hasPromptedPermission: false,
};

// Duolingo-style messages repository
export const DUOLINGO_NOTIFICATIONS_POOL = {
  // Duolingo Lesson Demands / "Cobrança de Lição"
  lessonDebt: [
    {
      title: '🦉🚨 CADÊ SUA LIÇÃO DE HOJE?!',
      body: 'O Coruja do Rap tá de olho! Você ainda não fez a lição de hoje na Academia. 5 minutinhos salvam seu flow!',
      characterMood: 'urgent' as const,
    },
    {
      title: '👀 Kowalski MC mandou o papo reto:',
      body: 'Quem não faz a lição passa vergonha na roda de rima! Entra na Academia agora e conclua sua aula do dia!',
      characterMood: 'provocative' as const,
    },
    {
      title: '⚠️ Lição Pendente! Luquita MC tá cobrando',
      body: 'Você prometeu rimar todo dia! Não deixe a preguiça vencer o beat. Conclua sua aula antes da meia-noite!',
      characterMood: 'urgent' as const,
    },
    {
      title: '📚 O Professor Rima não tolera falta!',
      body: 'Sua aula de métrica 4/4 e punchlines tá aberta. Complete a lição para faturar +200 XP e subir no ranking!',
      characterMood: 'encouraging' as const,
    },
    {
      title: '🔥 ÚLTIMA CHANCE: Faça sua lição hoje!',
      body: 'Faltam poucas horas pro dia virar! Rime no beat da lição de hoje pra não perder o ritmo nem a ofensiva.',
      characterMood: 'urgent' as const,
    },
    {
      title: '🦉💔 O Mascote do Rap tá chorando no estúdio...',
      body: 'Você ignorou a lição de ontem? Hoje não tem desculpa! Abre a Academia de Rimas e manda brasa no freestyle!',
      characterMood: 'urgent' as const,
    },
    {
      title: '🥊 Kowalski MC: "Vai pipocar na lição?!"',
      body: 'Os outros MCs tão evoluindo enquanto você tá enrolando. Entra na aula da Academia e solta a rima!',
      characterMood: 'provocative' as const,
    },
    {
      title: '⚡ Desafio Rápido: 3 minutos na Lição!',
      body: 'Treino relâmpago de vocabulário e métrica liberado. Faça a lição agora e garanta seus pontos de MC!',
      characterMood: 'encouraging' as const,
    },
  ],
  lessonCompleted: [
    {
      title: '🦉👑 Lição Concluída! O Coruja tá orgulhoso!',
      body: 'Você honrou a banca hoje! Aula finalizada, XP garantido e mente afiada pro improviso.',
      characterMood: 'proud' as const,
    },
    {
      title: '🔥 Luquita MC & Kowalski MC aprovaram!',
      body: 'Mandou o peso na lição! Seu vocabulário e métrica tão subindo de nível a cada treino.',
      characterMood: 'proud' as const,
    },
  ],
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
export function playNotificationSound(type: 'streak' | 'chime' | 'achievement' | 'alert' | 'lesson' = 'chime') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === 'lesson') {
      // Signature Duolingo-like 4-note ascending fanfare (C5, E5, G5, C6)
      const lessonNotes = [523.25, 659.25, 783.99, 1046.5];
      lessonNotes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.22, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.34);
      });
    } else if (type === 'streak' || type === 'achievement') {
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
        const isLesson = notif.category === 'lesson';
        const swOptions: any = {
          body: notif.body,
          icon: '/pwa-192x192.png',
          badge: '/badge-icon.png',
          tag: isLesson ? 'rimalab-duolingo-lesson' : `rimalab-${notif.category || 'streak'}`,
          renotify: true,
          vibrate: isLesson ? [250, 100, 250, 100, 350] : [200, 100, 200],
          data: {
            url: window.location.origin,
            tab: notif.actionTab || (isLesson ? 'lessons' : 'punchlines'),
          },
          actions: isLesson
            ? [
                { action: 'open_lesson', title: '🦉 Fazer Lição Agora' },
                { action: 'close', title: 'Depois' },
              ]
            : [
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
      const isLesson = notif.category === 'lesson';
      const n = new Notification(notif.title, {
        body: notif.body,
        icon: '/pwa-192x192.png',
        badge: '/badge-icon.png',
        tag: isLesson ? 'rimalab-duolingo-lesson' : `rimalab-${notif.category || 'streak'}`,
        requireInteraction: notif.priority === 'urgent' || isLesson,
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
    if (notif.category === 'lesson') {
      playNotificationSound('lesson');
    } else if (notif.category === 'streak' || notif.category === 'achievement') {
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

/**
 * Check if the user has completed a lesson today
 */
export function hasCompletedLessonToday(): boolean {
  if (typeof window === 'undefined') return false;
  const todayStr = new Date().toISOString().split('T')[0];
  const lastLessonDate = localStorage.getItem('rimalab_last_lesson_date');
  return lastLessonDate === todayStr;
}

/**
 * Mark a lesson as completed today and store timestamp
 */
export function markLessonCompletedToday(lessonTitle?: string) {
  if (typeof window === 'undefined') return;
  const todayStr = new Date().toISOString().split('T')[0];
  localStorage.setItem('rimalab_last_lesson_date', todayStr);
  localStorage.setItem('rimalab_last_lesson_completed_time', Date.now().toString());

  // Trigger celebratory Duolingo notification
  const pool = DUOLINGO_NOTIFICATIONS_POOL.lessonCompleted;
  const item = pool[Math.floor(Math.random() * pool.length)];

  triggerDuolingoNotification({
    title: item.title,
    body: lessonTitle ? `${item.body} Lição concluída: "${lessonTitle}".` : item.body,
    category: 'lesson',
    priority: 'high',
    characterMood: item.characterMood,
    actionLabel: 'Ver Academia',
    actionTab: 'lessons',
  });
}

/**
 * Trigger an explicit Duolingo-style push notification demanding that the user do their lesson
 */
export function triggerLessonDebtNotification(
  options?: {
    nextLessonTitle?: string;
    intensity?: 'gentle' | 'duolingo' | 'hardcore';
    onInAppToast?: (n: AppNotification) => void;
  }
): AppNotification {
  const pool = DUOLINGO_NOTIFICATIONS_POOL.lessonDebt;
  let selected = pool[Math.floor(Math.random() * pool.length)];

  if (options?.intensity === 'hardcore') {
    const urgentOnes = pool.filter((p) => p.characterMood === 'urgent' || p.characterMood === 'provocative');
    if (urgentOnes.length > 0) {
      selected = urgentOnes[Math.floor(Math.random() * urgentOnes.length)];
    }
  }

  let body = selected.body;
  if (options?.nextLessonTitle) {
    body = `${body} Lição recomendada: "${options.nextLessonTitle}".`;
  }

  return triggerDuolingoNotification(
    {
      title: selected.title,
      body,
      category: 'lesson',
      priority: options?.intensity === 'hardcore' ? 'urgent' : 'high',
      characterMood: selected.characterMood,
      actionLabel: 'Fazer Lição Agora 🦉',
      actionTab: 'lessons',
    },
    options?.onInAppToast
  );
}

/**
 * Duolingo watchdog that inspects if the student has done their lesson today.
 * If not, triggers the Duolingo notification according to configured intensity.
 */
export function checkAndTriggerDuolingoLessonWatchdog(
  nextLessonTitle?: string,
  onInAppToast?: (n: AppNotification) => void
): boolean {
  if (typeof window === 'undefined') return false;

  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.lessonReminders) return false;

  // If already done today, don't nag
  if (hasCompletedLessonToday()) return false;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastNagDate = localStorage.getItem('rimalab_last_lesson_nag_date');
  const lastNagTime = localStorage.getItem('rimalab_last_lesson_nag_time');
  const now = Date.now();
  const currentHour = new Date().getHours();

  // Minimum interval based on intensity
  let minIntervalMs = 1000 * 60 * 60 * 6; // default duolingo: 6h
  if (settings.lessonNagIntensity === 'hardcore') {
    minIntervalMs = 1000 * 60 * 60 * 2; // hardcore: every 2h
  } else if (settings.lessonNagIntensity === 'gentle') {
    minIntervalMs = 1000 * 60 * 60 * 12; // gentle: once a day
  }

  const elapsedSinceNag = lastNagTime ? now - parseInt(lastNagTime, 10) : Infinity;

  // Trigger if never nagged today OR interval passed
  if (lastNagDate !== todayStr || elapsedSinceNag >= minIntervalMs) {
    // Only nag between 09:00 and 23:00 unless hardcore
    if ((currentHour >= 9 && currentHour <= 23) || settings.lessonNagIntensity === 'hardcore') {
      localStorage.setItem('rimalab_last_lesson_nag_date', todayStr);
      localStorage.setItem('rimalab_last_lesson_nag_time', now.toString());

      triggerLessonDebtNotification({
        nextLessonTitle,
        intensity: settings.lessonNagIntensity,
        onInAppToast,
      });
      return true;
    }
  }

  return false;
}
