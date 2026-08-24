import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Sparkles, 
  ShieldCheck, 
  Globe, 
  Clock, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  AlertCircle, 
  Crown,
  Lock
} from 'lucide-react';
import { UserProfile, Subscription, TrialStatus } from '../types';

interface GmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, profile: UserProfile, subscription: Subscription, trialStatus: TrialStatus) => void;
  onShowToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'xp') => void;
}

export const GmailAuthModal: React.FC<GmailAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onShowToast,
}) => {
  const [gmailInput, setGmailInput] = useState('');
  const [artisticName, setArtisticName] = useState('');
  const [favoriteStyle, setFavoriteStyle] = useState('Boom Bap');
  const [isLoading, setIsLoading] = useState(false);
  const [ipInfo, setIpInfo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch client IP trial status upon opening
  useEffect(() => {
    if (isOpen) {
      fetch('/api/auth/trial-status')
        .then((res) => res.json())
        .then((data) => setIpInfo(data))
        .catch((err) => console.error('Error fetching IP trial status:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmailInput.includes('@')) {
      setErrorMsg('Por favor, informe um endereço de Gmail/e-mail válido.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: gmailInput.trim(),
          artisticName: artisticName.trim() || undefined,
          favoriteStyle,
        }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        onLoginSuccess(data.user, data.profile, data.subscription, data.trialStatus);
        onShowToast(
          '🎉 Acesso Liberado com 14 Dias Grátis!',
          `Bem-vindo(a), ${data.profile.artisticName}! Seu teste de 2 semanas foi ativado.`
        );
        onClose();
      } else {
        setErrorMsg(data.error || 'Não foi possível realizar o login com Gmail.');
      }
    } catch (err: any) {
      setErrorMsg('Erro de conexão com o servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 max-w-md mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>2 Semanas de Teste Grátis (14 Dias)</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Login com seu Gmail
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Cadastre seu Gmail e comece a treinar rimas imediatamente com IA Jurado, beats de alta qualidade e mentoria com Luquita MC e Kowalski MC.
          </p>
        </div>

        {/* IP Recognition Banner */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-neutral-200">
              <Globe className="h-4 w-4 text-cyan-400" />
              <span>IP do Dispositivo: <code className="text-neutral-400 font-mono">{ipInfo?.ip || 'Detectando...'}</code></span>
            </div>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-400 border border-emerald-500/30">
              {ipInfo?.isExpired ? 'Trial Expirado' : '14 Dias Grátis'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 flex items-start gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Sistema Anti-Fraude de IP:</strong> Seu teste gratuito de 14 dias fica vinculado ao seu dispositivo para garantir que seu progresso e histórico fiquem seguros.
            </span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
              Seu Endereço de Gmail:
            </label>
            <div className="relative">
              <input
                id="gmail-auth-email-input"
                type="email"
                value={gmailInput}
                onChange={(e) => setGmailInput(e.target.value)}
                placeholder="exemplo@gmail.com"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-3 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none pl-9"
                required
                autoFocus
              />
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-neutral-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                Vulgo / Nome de MC (Opcional):
              </label>
              <input
                type="text"
                value={artisticName}
                onChange={(e) => setArtisticName(e.target.value)}
                placeholder="Ex: MC Falcão, MC Rima..."
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                Estilo Preferido:
              </label>
              <select
                value={favoriteStyle}
                onChange={(e) => setFavoriteStyle(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Boom Bap">Boom Bap (90 BPM)</option>
                <option value="Trap">Trap (140 BPM)</option>
                <option value="Speed Flow">Speed Flow (120 BPM)</option>
                <option value="Grime">Grime (140 BPM)</option>
                <option value="Drill">Drill (142 BPM)</option>
                <option value="Detroit">Detroit (100 BPM)</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            id="gmail-auth-submit-btn"
            type="submit"
            disabled={isLoading || !gmailInput}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 py-3.5 text-xs font-black text-neutral-950 shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            <span>{isLoading ? 'Ativando 14 Dias Grátis...' : 'Entrar com Gmail & Ativar 14 Dias Grátis'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-neutral-900 text-center text-[11px] text-neutral-500">
          Sem cobrança automática • Cancele quando quiser • Acesso imediato ao Estúdio
        </div>

      </div>
    </div>
  );
};
