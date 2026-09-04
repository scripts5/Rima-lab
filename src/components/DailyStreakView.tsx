import React, { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  Award,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2,
  Mic,
  BookOpen,
  Trophy,
  Smartphone,
  ChevronRight,
  Radio,
  Sliders,
  Send,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  AppNotification,
  getNotificationSettings,
  saveNotificationSettings,
  getStoredNotifications,
  saveStoredNotifications,
  sendNativeDeviceNotification,
  playNotificationSound,
  DUOLINGO_NOTIFICATIONS_POOL
} from '../utils/duolingoNotifications';
import confetti from 'canvas-confetti';

interface DailyStreakViewProps {
  profile: UserProfile | null;
  onNavigateToTab: (tab: string) => void;
  onShowToast: (title: string, desc: string, type?: 'xp' | 'ach' | 'info') => void;
  onOpenPermissions: () => void;
  onAddXP?: (amount: number, reason: string) => void;
}

interface DailyQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number;
  maxProgress: number;
  targetTab: string;
  isCompleted: boolean;
  icon: string;
}

export const DailyStreakView: React.FC<DailyStreakViewProps> = ({
  profile,
  onNavigateToTab,
  onShowToast,
  onOpenPermissions,
  onAddXP,
}) => {
  const currentStreak = profile?.streakDays || 1;
  const [settings, setSettings] = useState(getNotificationSettings());
  const [notifications, setNotifications] = useState<AppNotification[]>(getStoredNotifications());
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(() => {
    const lastCheckin = localStorage.getItem('rimalab_daily_checkin_date');
    const today = new Date().toISOString().split('T')[0];
    return lastCheckin === today;
  });

  const [hasStreakFreeze, setHasStreakFreeze] = useState<boolean>(() => {
    return localStorage.getItem('rimalab_has_streak_freeze') === 'true';
  });

  // Daily Quests State
  const [quests, setQuests] = useState<DailyQuest[]>([
    {
      id: 'quest_freestyle',
      title: '🎙️ Mandar um Freestyle no Studio',
      description: 'Rime pelo menos 1 minuto no beat selecionado',
      xpReward: 150,
      progress: profile && profile.totalSessions > 0 ? 1 : 0,
      maxProgress: 1,
      targetTab: 'studio',
      isCompleted: profile ? profile.totalSessions > 0 : false,
      icon: '🎙️',
    },
    {
      id: 'quest_academy',
      title: '📖 Concluir 1 Lição da Academia',
      description: 'Pratique métrica 4/4, speed flow ou punchlines',
      xpReward: 200,
      progress: profile && profile.totalXP > 300 ? 1 : 0,
      maxProgress: 1,
      targetTab: 'lessons',
      isCompleted: profile ? profile.totalXP > 300 : false,
      icon: '📖',
    },
    {
      id: 'quest_challenge',
      title: '⚡ Desafio Diário de Rimas',
      description: 'Participe do desafio com palavras obrigatórias',
      xpReward: 250,
      progress: 0,
      maxProgress: 1,
      targetTab: 'challenges',
      isCompleted: false,
      icon: '⚡',
    },
    {
      id: 'quest_streak',
      title: '🔥 Manter a Chama Acesa',
      description: 'Faça o check-in diário de treino no app',
      xpReward: 100,
      progress: hasCheckedInToday ? 1 : 0,
      maxProgress: 1,
      targetTab: 'ofensiva',
      isCompleted: hasCheckedInToday,
      icon: '🔥',
    },
  ]);

  // Handler: Daily Check-in
  const handleDailyCheckIn = () => {
    if (hasCheckedInToday) {
      onShowToast('🔥 Ofensiva já Registrada!', 'Você já fez seu check-in hoje. Volte amanhã para continuar!', 'info');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('rimalab_daily_checkin_date', today);
    setHasCheckedInToday(true);

    // Update quest
    setQuests(prev => prev.map(q => q.id === 'quest_streak' ? { ...q, progress: 1, isCompleted: true } : q));

    // Play chime sound
    playNotificationSound('streak');

    // Confetti
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#ef4444', '#10b981'],
    });

    onAddXP?.(100, 'Check-in diário de ofensiva');
    onShowToast('🔥 Ofensiva Salva!', 'Sua sequência de rimas foi mantida com sucesso! (+100 XP)', 'ach');

    // Send native system notification confirmation
    sendNativeDeviceNotification({
      title: '🔥 Ofensiva Protegida!',
      body: `Parabéns! Sua sequência agora é de ${currentStreak} dias ativos no RimaLab.`,
      category: 'streak',
      priority: 'high',
      actionTab: 'ofensiva',
    });
  };

  // Handler: Buy / Activate Streak Freeze
  const handleToggleStreakFreeze = () => {
    if (hasStreakFreeze) {
      onShowToast('🛡️ Escudo Já Ativo', 'Você já possui um Escudo de Ofensiva protegendo sua sequência.', 'info');
      return;
    }

    setHasStreakFreeze(true);
    localStorage.setItem('rimalab_has_streak_freeze', 'true');
    playNotificationSound('achievement');
    onShowToast('🛡️ Escudo de Ofensiva Ativado!', 'Se você esquecer de treinar um dia, sua chama não apagará.', 'ach');
  };

  // Handler: Send Test Device Push Notification
  const handleSendTestNotification = async () => {
    try {
      const randomThreat = DUOLINGO_NOTIFICATIONS_POOL.streakThreat[
        Math.floor(Math.random() * DUOLINGO_NOTIFICATIONS_POOL.streakThreat.length)
      ];

      playNotificationSound('alert');
      const sent = await sendNativeDeviceNotification({
        title: randomThreat.title,
        body: randomThreat.body,
        category: 'streak',
        priority: 'urgent',
        actionTab: 'studio',
      });

      if (sent) {
        onShowToast('📲 Notificação Disparada!', 'Verifique a barra de status do seu celular.', 'ach');
      } else {
        onShowToast('Aviso', 'Clique em "Permissões do Celular" para autorizar notificações.', 'info');
      }
    } catch (e) {
      console.warn('Test notif error:', e);
    }
  };

  // Handler: Toggle Settings
  const handleToggleSetting = (key: keyof typeof settings) => {
    const currentValue = settings[key];
    const updated = {
      ...settings,
      [key]: typeof currentValue === 'boolean' ? !currentValue : currentValue,
    };
    setSettings(updated);
    saveNotificationSettings(updated);
    onShowToast('Configurações Salvas', 'Suas preferências de alerta foram atualizadas.', 'info');
  };

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-6 space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Banner: Chama da Ofensiva */}
      <div className="relative overflow-hidden rounded-3xl border border-orange-500/40 bg-gradient-to-br from-orange-950/60 via-neutral-950 to-neutral-950 p-6 sm:p-8 shadow-2xl shadow-orange-950/40">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-orange-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-amber-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Flame Icon & Streak Counter */}
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-5">
            <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-red-600 p-1 shadow-2xl shadow-orange-500/30">
              <div className="h-full w-full rounded-[22px] bg-neutral-950 flex flex-col items-center justify-center">
                <Flame className="h-10 w-10 sm:h-12 sm:w-12 fill-orange-500 text-orange-500 animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 mt-1">
                  Chama Ativa
                </span>
              </div>
              <span className="absolute -bottom-2 bg-gradient-to-r from-red-600 to-orange-500 px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow">
                {currentStreak} DIAS
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="rounded bg-orange-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-orange-300 border border-orange-500/40">
                  Ofensiva & Metas Diárias
                </span>
                {hasCheckedInToday ? (
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Ofensiva Salva Hoje
                  </span>
                ) : (
                  <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-red-300 border border-red-500/40 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Treino Pendente Hoje
                  </span>
                )}
              </div>

              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                Sua Chama do Freestyle ({currentStreak} Dias)
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-xl">
                Rime todo dia para não perder sua sequência. O algoritmo da Arena recompensa quem mantém a disciplina no microfone!
              </p>
            </div>
          </div>

          {/* Quick Action: Check-in / Shield */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full sm:w-auto shrink-0">
            <button
              onClick={handleDailyCheckIn}
              disabled={hasCheckedInToday}
              className={`flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black transition-all shadow-lg ${
                hasCheckedInToday
                  ? 'bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-default'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-neutral-950 hover:brightness-110 active:scale-95 shadow-amber-500/25 cursor-pointer'
              }`}
            >
              <Flame className="h-4 w-4 fill-current" />
              <span>{hasCheckedInToday ? 'Ofensiva de Hoje Garantida ✅' : 'Fazer Check-in (+100 XP)'}</span>
            </button>

            <button
              onClick={handleToggleStreakFreeze}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-colors ${
                hasStreakFreeze
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-300'
                  : 'border-neutral-700 bg-neutral-900 text-neutral-200 hover:border-amber-500/40'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-blue-400" />
              <span>{hasStreakFreeze ? 'Escudo Protetor Ativo 🛡️' : 'Ativar Escudo de Ofensiva'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Grid: Missões Diárias vs Notificações & Celular */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Missões Diárias (Quests) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="font-display font-black text-lg text-white">
                Missões do MC Hoje
              </h3>
            </div>
            <span className="text-xs text-neutral-400">
              {quests.filter(q => q.isCompleted).length}/{quests.length} Concluídas
            </span>
          </div>

          <div className="space-y-3">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className={`flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                  quest.isCompleted
                    ? 'border-emerald-500/30 bg-neutral-900/60'
                    : 'border-neutral-800 bg-neutral-900/90 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${
                    quest.isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {quest.isCompleted ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : quest.icon}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold truncate ${quest.isCompleted ? 'text-neutral-300 line-through' : 'text-white'}`}>
                        {quest.title}
                      </h4>
                      <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
                        +{quest.xpReward} XP
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 truncate">
                      {quest.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToTab(quest.targetTab)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    quest.isCompleted
                      ? 'bg-neutral-800 text-neutral-400 cursor-default'
                      : 'bg-amber-500 text-neutral-950 hover:bg-amber-400 font-black shadow cursor-pointer'
                  }`}
                >
                  <span>{quest.isCompleted ? 'Feito' : 'Iniciar'}</span>
                  {!quest.isCompleted && <ChevronRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
          </div>

          {/* Dica de Treino dos Professores */}
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              🎤
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-300">
                Conselho de Kowalski MC & Luquita MC:
              </h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                "Não adianta treinar 3 horas num único dia e ficar 1 semana sem rimar. 5 a 10 minutos diários no beat desenvolvem seu reflexo de métrica 10x mais rápido."
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Alertas, Notificações & Permissões do Celular */}
        <div className="space-y-4">
          
          {/* Card: Notificações do Celular (APK / Dispositivo) */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-orange-400" />
                <h3 className="font-display font-black text-sm text-white">
                  Notificações do Celular
                </h3>
              </div>
              <button
                onClick={onOpenPermissions}
                className="text-[10px] font-bold text-amber-400 hover:underline"
              >
                Permissões
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              Configure os avisos que aparecem na barra de notificações do seu celular:
            </p>

            {/* Toggle Toggles */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-neutral-200">Alerta de Ofensiva</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.streakReminders}
                  onChange={() => handleToggleSetting('streakReminders')}
                  className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-red-400" />
                  <span className="text-neutral-200">Aulas ao Vivo (Discord)</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.liveCallAlerts}
                  onChange={() => handleToggleSetting('liveCallAlerts')}
                  className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-neutral-200">Sons & Metrônomo</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={() => handleToggleSetting('soundEnabled')}
                  className="rounded border-neutral-700 bg-neutral-800 text-amber-500 focus:ring-0"
                />
              </div>
            </div>

            {/* Test Notification Button */}
            <button
              onClick={handleSendTestNotification}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/80 py-2.5 text-xs font-bold text-neutral-200 hover:bg-neutral-700 transition-colors"
            >
              <Send className="h-3.5 w-3.5 text-amber-400" />
              <span>Testar Notificação no Celular</span>
            </button>
          </div>

          {/* Card: Central de Permissões do Dispositivo */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-amber-400" />
              <h3 className="font-display font-black text-sm text-white">
                Permissões do Dispositivo
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-300">🎙️ Microfone</span>
                <span className="font-bold text-emerald-400 text-[11px]">Pronto</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-300">🔔 Notificações</span>
                <span className="font-bold text-amber-400 text-[11px]">Configurado</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800">
                <span className="text-neutral-300">🔊 Áudio & Beats</span>
                <span className="font-bold text-emerald-400 text-[11px]">Ativo</span>
              </div>
            </div>

            <button
              onClick={onOpenPermissions}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Gerenciar Permissões</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
