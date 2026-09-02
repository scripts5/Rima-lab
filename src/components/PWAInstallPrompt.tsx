import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share2, PlusSquare, Check, X, Sparkles, ShieldCheck, Flame } from 'lucide-react';

interface PWAInstallPromptProps {
  variant?: 'button' | 'banner' | 'card' | 'navbar';
  onInstalled?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  variant = 'button',
  onInstalled,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // If already installed in standalone mode, do not render
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    if (isInstallable) {
      setIsInstalling(true);
      const success = await install();
      setIsInstalling(false);
      if (success && onInstalled) {
        onInstalled();
      }
    } else {
      // Fallback for browsers that haven't fired beforeinstallprompt yet
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* 1. Navbar Compact Button */}
      {variant === 'navbar' && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 px-2.5 py-1.5 text-xs font-bold text-amber-300 transition-all active:scale-95 shadow-sm"
          title="Instalar App RimaLab"
        >
          <Download className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden sm:inline">Baixar App</span>
          <span className="sm:hidden">App</span>
        </button>
      )}

      {/* 2. Standard Button */}
      {variant === 'button' && (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-4 py-2.5 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all"
        >
          <Smartphone className="h-4 w-4" />
          <span>{isInstalling ? 'Instalando...' : 'Instalar App no Celular'}</span>
        </button>
      )}

      {/* 3. Floating Bottom Banner */}
      {variant === 'banner' && !bannerDismissed && (
        <div className="fixed bottom-3 right-3 left-3 sm:left-auto sm:max-w-md z-40 rounded-2xl border border-amber-500/40 bg-neutral-900/95 backdrop-blur-md p-4 shadow-2xl shadow-black/80 text-white animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-neutral-950 font-black shadow-md shrink-0">
              <Flame className="h-5 w-5 text-neutral-950" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-display font-black text-sm text-white">RimaLab no seu Celular</h4>
                <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-black uppercase">App</span>
              </div>
              <p className="text-[11px] text-neutral-300 mt-0.5 leading-relaxed">
                Instale agora para treinar offline, receber lembretes de ofensiva diária e ter acesso rápido aos beats!
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1.5 text-xs font-black text-neutral-950 hover:brightness-110 active:scale-95 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Instalar Agora</span>
                </button>
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="rounded-xl bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1.5 text-xs font-bold text-neutral-400 hover:text-white transition-all"
                >
                  Depois
                </button>
              </div>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-neutral-500 hover:text-neutral-300 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* iOS & Manual Installation Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm text-white">Como Instalar no seu Aparelho</h3>
                  <span className="text-[11px] text-neutral-400">Transforme em aplicativo em 10 segundos</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs bg-neutral-950/80 p-3.5 rounded-2xl border border-neutral-800">
              <div className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-amber-500 text-neutral-950 font-black flex items-center justify-center shrink-0 text-[10px]">1</div>
                <p className="text-neutral-300">
                  Toque no botão de <strong>Compartilhar</strong> (<Share2 className="inline h-3.5 w-3.5 text-amber-400" />) na barra do seu navegador (Safari / Chrome).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-amber-500 text-neutral-950 font-black flex items-center justify-center shrink-0 text-[10px]">2</div>
                <p className="text-neutral-300">
                  Role a lista e selecione <strong className="text-white">"Adicionar à Tela de Início"</strong> (<PlusSquare className="inline h-3.5 w-3.5 text-amber-400" />).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-amber-500 text-neutral-950 font-black flex items-center justify-center shrink-0 text-[10px]">3</div>
                <p className="text-neutral-300">
                  Toque em <strong className="text-white">"Adicionar"</strong> no canto superior. Pronto! O RimaLab abrirá em tela cheia como app nativo.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-center gap-2 text-[11px] text-amber-300">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Sem ocupar espaço pesado da memória e com atualizações automáticas!</span>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full rounded-xl bg-neutral-800 hover:bg-neutral-700 py-2.5 text-xs font-bold text-white transition-all"
            >
              Entendi, vou adicionar!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
