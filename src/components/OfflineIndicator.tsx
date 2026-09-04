import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (showReconnected) {
    return (
      <aside
        aria-label="Conexão restabelecida"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xl shadow-emerald-950/80 border border-emerald-400/40 animate-in fade-in slide-in-from-bottom-3 duration-300"
      >
        <Wifi className="h-4 w-4 shrink-0 text-white animate-pulse" />
        <div className="flex flex-col">
          <span className="font-extrabold tracking-wide">De volta online!</span>
          <span className="text-[10px] text-emerald-100 font-normal">
            Seu progresso e rimas locais foram sincronizados com a nuvem.
          </span>
        </div>
      </aside>
    );
  }

  if (isOnline) return null;

  return (
    <aside
      aria-label="Aviso de conexão offline"
      className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-950 px-4 py-3 text-xs font-bold text-white shadow-2xl shadow-black/90 border border-amber-500/50 animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          <WifiOff className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="font-black text-amber-400 tracking-wide text-xs">Modo Offline Ativo</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] text-neutral-400 hover:text-amber-300 underline font-mono cursor-pointer"
        >
          {isExpanded ? 'Ocultar detalhes' : 'O que funciona?'}
        </button>
      </div>

      <p className="text-[11px] text-neutral-300 font-normal leading-relaxed">
        100% operacional sem internet! Seus beats, gravações, rimas e XP continuam salvos no seu aparelho.
      </p>

      {isExpanded && (
        <div className="pt-2 border-t border-neutral-800 space-y-1.5 text-[10px] text-neutral-400 font-medium">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>Beats sintetizados Web Audio rodam localmente</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>Analisador determinístico de rimas e métrica</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>Dicionário e gerador de temas com rimas fonéticas</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>Progresso, aulas e conquistas salvos no navegador / APK</span>
          </div>
        </div>
      )}
    </aside>
  );
};
