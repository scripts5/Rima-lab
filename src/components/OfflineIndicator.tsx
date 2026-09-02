import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

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

  if (isOnline) return null;

  return (
    <aside
      aria-label="Aviso de conexão offline"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-2xl shadow-amber-950/80 border border-amber-400/40 animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="h-2 w-2 rounded-full bg-white animate-ping shrink-0" />
      <WifiOff className="h-4 w-4 shrink-0" />
      <div className="flex flex-col">
        <span className="font-extrabold tracking-wide">Modo Offline Ativo</span>
        <span className="text-[10px] text-amber-100 font-normal">
          Seu app está funcionando com cache local. Rimas e rascunhos continuam salvos.
        </span>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="ml-2 flex items-center gap-1 rounded-lg bg-black/30 hover:bg-black/50 px-2 py-1 text-[10px] font-bold text-white border border-white/20 transition-all active:scale-95"
      >
        <RefreshCw className="h-3 w-3" />
        <span>Reconectar</span>
      </button>
    </aside>
  );
};
