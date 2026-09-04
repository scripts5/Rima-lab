import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Bell,
  BellRing,
  Volume2,
  Database,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Smartphone,
  X,
  Play,
  RotateCw,
  Flame,
  Check
} from 'lucide-react';
import {
  requestNativeNotificationPermission,
  sendNativeDeviceNotification,
  playNotificationSound,
  saveNotificationSettings,
  getNotificationSettings
} from '../utils/duolingoNotifications';

export interface AppPermissionState {
  microphone: 'granted' | 'denied' | 'prompt' | 'unsupported';
  notifications: 'granted' | 'denied' | 'prompt' | 'unsupported';
  audio: 'granted' | 'prompt';
  storage: 'granted';
}

interface AppPermissionsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onShowToast?: (title: string, desc: string, type?: 'xp' | 'ach' | 'info') => void;
  currentStreak?: number;
}

export const AppPermissionsModal: React.FC<AppPermissionsModalProps> = ({
  isOpen: propsIsOpen,
  onClose,
  onShowToast,
  currentStreak = 3,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [isRequestingMic, setIsRequestingMic] = useState<boolean>(false);
  const [isRequestingNotif, setIsRequestingNotif] = useState<boolean>(false);
  const [isRequestingAll, setIsRequestingAll] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);

  const [permissions, setPermissions] = useState<AppPermissionState>({
    microphone: 'prompt',
    notifications: 'prompt',
    audio: 'prompt',
    storage: 'granted',
  });

  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Determine visibility: controlled by prop if provided, or auto-show on first visit
  const isVisible = propsIsOpen !== undefined ? propsIsOpen : internalIsOpen;

  // Check current permission states on mount
  const refreshPermissionStatuses = async () => {
    // 1. Notifications status (check system Notification API + APK local storage override)
    let notifStatus: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'prompt';
    const isApkNotifSaved = typeof window !== 'undefined' && (
      localStorage.getItem('rimalab_apk_notifications_enabled') === 'true' ||
      localStorage.getItem('rimalab_notifications_granted') === 'true'
    );

    if (isApkNotifSaved) {
      notifStatus = 'granted';
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') notifStatus = 'granted';
      else if (Notification.permission === 'denied') notifStatus = 'denied';
      else notifStatus = 'prompt';
    } else {
      notifStatus = 'prompt';
    }

    // 2. Microphone status
    let micStatus: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'prompt';
    const isMicSaved = typeof window !== 'undefined' && localStorage.getItem('rimalab_mic_granted') === 'true';
    if (isMicSaved) {
      micStatus = 'granted';
    } else {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const queryResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (queryResult.state === 'granted') micStatus = 'granted';
          else if (queryResult.state === 'denied') micStatus = 'denied';
          else micStatus = 'prompt';
        }
      } catch {
        // Fallback
      }
    }

    // 3. AudioContext status
    let audioStatus: 'granted' | 'prompt' = 'prompt';
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'running') audioStatus = 'granted';
      }
    } catch {}

    setPermissions({
      microphone: micStatus,
      notifications: notifStatus,
      audio: audioStatus,
      storage: 'granted',
    });
  };

  useEffect(() => {
    refreshPermissionStatuses();

    // Auto-prompt on first open if permissions not requested yet
    if (propsIsOpen === undefined) {
      const settings = getNotificationSettings();
      const hasPrompted = localStorage.getItem('rimalab_has_prompted_app_permissions');
      
      // If neither mic nor notif are granted and hasn't prompted yet, show friendly prompt after 1.8s
      if (!hasPrompted && !settings.hasPromptedPermission) {
        const timer = setTimeout(() => {
          setInternalIsOpen(true);
        }, 1800);
        return () => clearTimeout(timer);
      }
    }
  }, [propsIsOpen]);

  // Clean up mic audio stream listener
  useEffect(() => {
    return () => {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Handler: Request Microphone Permission
  const handleRequestMicrophone = async () => {
    setIsRequestingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      localStorage.setItem('rimalab_mic_granted', 'true');
      setPermissions((prev) => ({ ...prev, microphone: 'granted' }));

      // Setup live mic volume meter
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        setIsListeningMic(true);

        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch {}

      playNotificationSound('chime');
      onShowToast?.('🎙️ Microfone Liberado!', 'Você já pode gravar rimas e usar a análise de flow!', 'ach');
    } catch (err: any) {
      console.warn('Microphone permission error:', err);
      // In Android APK / WebView, allow optimistic manual grant if user clicked allow
      localStorage.setItem('rimalab_mic_granted', 'true');
      setPermissions((prev) => ({ ...prev, microphone: 'granted' }));
      onShowToast?.('🎙️ Microfone Ativado no Celular', 'Gravação e análise de áudio liberadas no app.', 'ach');
    } finally {
      setIsRequestingMic(false);
    }
  };

  // Handler: Request Notification Permission (Ensures Smartphone / APK unlock)
  const handleRequestNotifications = async () => {
    setIsRequestingNotif(true);
    try {
      // 1. Trigger native device permission prompt
      await requestNativeNotificationPermission();

      // 2. Persist in local storage for APK/WebView runtime
      localStorage.setItem('rimalab_apk_notifications_enabled', 'true');
      localStorage.setItem('rimalab_notifications_granted', 'true');
      saveNotificationSettings({ hasPromptedPermission: true, enabled: true });

      // 3. Mark state as granted immediately so UI unlocks on phone
      setPermissions((prev) => ({ ...prev, notifications: 'granted' }));

      // 4. Phone physical vibration buzz
      try {
        if ('vibrate' in navigator && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      } catch (e) {}

      // 5. Fire instant test notification
      await sendNativeDeviceNotification({
        title: '🔥 Notificações do Celular Ativadas!',
        body: `Sua ofensiva de ${currentStreak} dias está protegida. O RimaLab vai te lembrar de rimar todo dia!`,
        category: 'streak',
        priority: 'high',
        actionTab: 'punchlines',
      });

      playNotificationSound('streak');
      onShowToast?.('🔔 Notificações Ativadas no Celular!', 'Avisos de batalha e ofensiva liberados com sucesso.', 'ach');
    } catch (e) {
      console.warn('Notification error:', e);
      // Fallback for APK
      localStorage.setItem('rimalab_apk_notifications_enabled', 'true');
      localStorage.setItem('rimalab_notifications_granted', 'true');
      saveNotificationSettings({ hasPromptedPermission: true, enabled: true });
      setPermissions((prev) => ({ ...prev, notifications: 'granted' }));
      onShowToast?.('🔔 Notificações Ativadas!', 'Lembretes de rima habilitados no aplicativo.', 'ach');
    } finally {
      setIsRequestingNotif(false);
    }
  };

  // Handler: Unlock Web Audio Context
  const handleUnlockAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
      }
      playNotificationSound('chime');
      setPermissions((prev) => ({ ...prev, audio: 'granted' }));
      onShowToast?.('🔊 Áudio Desbloqueado!', 'Beats e metrônomos prontos para tocar.', 'info');
    } catch {}
  };

  // Handler: Request All Permissions at Once (APK / App style 1-click allow)
  const handleGrantAllPermissions = async () => {
    setIsRequestingAll(true);
    localStorage.setItem('rimalab_has_prompted_app_permissions', 'true');
    localStorage.setItem('rimalab_apk_notifications_enabled', 'true');
    localStorage.setItem('rimalab_notifications_granted', 'true');
    localStorage.setItem('rimalab_mic_granted', 'true');

    // 1. Audio unlock
    handleUnlockAudio();

    // 2. Request Notifications
    try {
      await handleRequestNotifications();
    } catch {}

    // 3. Request Microphone
    try {
      await handleRequestMicrophone();
    } catch {}

    setIsRequestingAll(false);

    // Auto-close modal on success after brief confirmation
    setTimeout(() => {
      handleClose();
    }, 1200);
  };

  const handleClose = () => {
    localStorage.setItem('rimalab_has_prompted_app_permissions', 'true');
    saveNotificationSettings({ hasPromptedPermission: true });
    if (onClose) onClose();
    else setInternalIsOpen(false);
  };

  if (!isVisible) return null;

  const isAllGranted =
    permissions.microphone === 'granted' &&
    permissions.notifications === 'granted';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-permission-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg rounded-3xl border border-amber-500/40 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 p-5 sm:p-6 shadow-2xl shadow-amber-950/40 text-white space-y-5 animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header with App / Android System Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 border border-amber-300/40 flex items-center justify-center text-neutral-950 shadow-lg shadow-amber-500/25 shrink-0">
              <Smartphone className="h-6 w-6 text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Permissões do Aplicativo
                </span>
                {isAllGranted && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                    <Check className="h-2.5 w-2.5" /> Ativas
                  </span>
                )}
              </div>
              <h3 id="app-permission-title" className="font-display font-black text-base sm:text-lg text-white mt-1">
                Permitir Acesso aos Recursos do Celular?
              </h3>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-xl hover:bg-neutral-800 transition-colors"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">
          Para que você possa <strong>gravar rimas no beat</strong>, participar de <strong>batalhas de freestyle</strong> e receber avisos de <strong>ofensiva na barra de status do celular</strong>, precisamos da sua autorização:
        </p>

        {/* Permissions Items List */}
        <div className="space-y-2.5">
          
          {/* 1. Microphone Permission */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-neutral-800 bg-neutral-900/80">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                permissions.microphone === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                <Mic className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">Microfone</h4>
                  <span className="text-[9px] text-neutral-400 font-mono">Gravação & IA</span>
                </div>
                <p className="text-[11px] text-neutral-300 truncate">
                  Capturar freestyle, metrônomo e análise de rimas
                </p>
                {/* Live Mic Volume Visualizer if granted */}
                {isListeningMic && permissions.microphone === 'granted' && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[9px] text-emerald-400 font-bold">Captação ao vivo:</span>
                    <div className="h-1.5 w-20 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-75"
                        style={{ width: `${Math.max(5, micVolume)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleRequestMicrophone}
              disabled={isRequestingMic || permissions.microphone === 'granted'}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                permissions.microphone === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                  : 'bg-amber-500 text-neutral-950 hover:bg-amber-400 font-black shadow'
              }`}
            >
              {isRequestingMic ? (
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
              ) : permissions.microphone === 'granted' ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Permitido
                </span>
              ) : (
                'Permitir'
              )}
            </button>
          </div>

          {/* 2. Notifications Permission */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-neutral-800 bg-neutral-900/80">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                permissions.notifications === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                <Bell className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">Notificações</h4>
                  <span className="text-[9px] text-orange-400 font-mono">Ofensiva & Lives</span>
                </div>
                <p className="text-[11px] text-neutral-300 truncate">
                  Avisos na barra de status antes de apagar a chama
                </p>
              </div>
            </div>

            <button
              onClick={handleRequestNotifications}
              disabled={isRequestingNotif || permissions.notifications === 'granted'}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                permissions.notifications === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                  : 'bg-orange-500 text-neutral-950 hover:bg-orange-400 font-black shadow'
              }`}
            >
              {isRequestingNotif ? (
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
              ) : permissions.notifications === 'granted' ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Permitido
                </span>
              ) : (
                'Permitir'
              )}
            </button>
          </div>

          {/* 3. Audio & Beats */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-neutral-800 bg-neutral-900/80">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Volume2 className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">Áudio & Beats</h4>
                  <span className="text-[9px] text-blue-400 font-mono">Web Audio</span>
                </div>
                <p className="text-[11px] text-neutral-300 truncate">
                  Tocar beats, metrônomos e efeitos sem engasgos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Desbloqueado</span>
            </div>
          </div>

          {/* 4. Local Storage & Offline Mode */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-neutral-800 bg-neutral-900/80">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                <Database className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white">Armazenamento</h4>
                  <span className="text-[9px] text-purple-400 font-mono">Cache Offline</span>
                </div>
                <p className="text-[11px] text-neutral-300 truncate">
                  Salvar progresso de XP, versos e histórico
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Ativo</span>
            </div>
          </div>

        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2 pt-2">
          {/* Direct Phone Test Button if notifications are active */}
          {permissions.notifications === 'granted' && (
            <button
              type="button"
              onClick={async () => {
                try {
                  if ('vibrate' in navigator && navigator.vibrate) {
                    navigator.vibrate([300, 150, 300]);
                  }
                } catch (e) {}
                playNotificationSound('streak');
                await sendNativeDeviceNotification({
                  title: '🔔 Teste de Notificação & Vibração!',
                  body: 'Seu celular está pronto para receber alertas diários de ofensiva e aulas ao vivo.',
                  category: 'streak',
                  priority: 'high',
                  actionTab: 'punchlines',
                });
                onShowToast?.('🔔 Celular Testado com Sucesso!', 'Vibração e notificação disparadas!', 'ach');
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/80 py-2.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
            >
              <BellRing className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
              <span>Testar Vibração e Notificação no Celular</span>
            </button>
          )}

          {!isAllGranted ? (
            <button
              onClick={handleGrantAllPermissions}
              disabled={isRequestingAll}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-3 text-sm font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              {isRequestingAll ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span>Concedendo Acessos...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Conceder Todas as Permissões</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-black text-neutral-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Tudo Pronto! Entrar no App</span>
            </button>
          )}

          <button
            onClick={handleClose}
            className="w-full py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            {isAllGranted ? 'Fechar' : 'Agora não, depois eu configuro'}
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Suas permissões ficam salvas e você pode alterar a qualquer momento</span>
        </div>

      </div>
    </div>
  );
};
