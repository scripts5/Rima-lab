import React, { useState, useEffect } from 'react';
import { BellRing, Flame, Sparkles, Smartphone, Check, X, ShieldCheck } from 'lucide-react';
import {
  requestNativeNotificationPermission,
  sendNativeDeviceNotification,
  triggerDuolingoNotification,
  getNotificationSettings,
  saveNotificationSettings,
} from '../utils/duolingoNotifications';

interface PhoneNotificationPermissionModalProps {
  currentStreak?: number;
}

export const PhoneNotificationPermissionModal: React.FC<PhoneNotificationPermissionModalProps> = ({
  currentStreak = 3,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if running in browser/device with notification support
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    const settings = getNotificationSettings();
    const permission = Notification.permission;

    // If user has not yet decided (permission === 'default') and has not dismissed in current session
    if (permission === 'default' && !settings.hasPromptedPermission) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500); // Friendly delay after app loads
      return () => clearTimeout(timer);
    }
  }, []);

  const handleGrantPermission = async () => {
    setIsRequesting(true);
    try {
      const permission = await requestNativeNotificationPermission();
      setIsRequesting(false);
      setIsVisible(false);

      if (permission === 'granted') {
        // Immediately fire a confirmation system notification to the phone's status bar!
        await sendNativeDeviceNotification({
          title: '🔥 Notificações do Celular Ativadas!',
          body: `Sua ofensiva de ${currentStreak} dias está protegida. Kowalski MC vai te avisar antes de expirar!`,
          category: 'streak',
          priority: 'high',
          actionTab: 'punchlines',
        });
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
      setIsRequesting(false);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    saveNotificationSettings({ hasPromptedPermission: true });
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-notif-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 p-6 shadow-2xl shadow-amber-950/40 text-white space-y-4 animate-in slide-in-from-bottom-6 duration-300">
        
        {/* Header Icon & Title */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 border border-amber-300/40 flex items-center justify-center text-neutral-950 shadow-lg shadow-amber-500/20 shrink-0">
              <BellRing className="h-6 w-6 text-neutral-950 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Alerta do Celular / APK
              </span>
              <h3 id="phone-notif-title" className="font-display font-black text-base text-white mt-1">
                Ativar Notificações no seu Celular
              </h3>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-neutral-500 hover:text-neutral-300 p-1.5 rounded-xl hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Motivation Body */}
        <p className="text-xs text-neutral-300 leading-relaxed">
          O aplicativo envia avisos diretamente na <strong>barra de notificações do seu celular</strong> (com som e vibração) para:
        </p>

        {/* Feature List */}
        <div className="space-y-2 bg-neutral-900/80 p-3.5 rounded-2xl border border-neutral-800 text-xs">
          <div className="flex items-center gap-2.5 text-neutral-200">
            <Flame className="h-4 w-4 text-orange-400 shrink-0" />
            <span>Avisar antes de apagar sua ofensiva de rimas</span>
          </div>
          <div className="flex items-center gap-2.5 text-neutral-200">
            <Smartphone className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Notificar quando abrir sala de voz ao vivo dos professores</span>
          </div>
          <div className="flex items-center gap-2.5 text-neutral-200">
            <Sparkles className="h-4 w-4 text-yellow-400 shrink-0" />
            <span>Novos desafios diários e conquistas liberadas</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleGrantPermission}
            disabled={isRequesting}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-3 text-sm font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>{isRequesting ? 'Ativando...' : 'Permitir Notificações no Celular'}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="w-full py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Agora não, depois eu ativo
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-500">
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          <span>Você pode alterar ou silenciar as notificações quando quiser</span>
        </div>
      </div>
    </div>
  );
};
