import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Crown, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Mic, 
  Video,
  Flame,
  Phone,
  MessageSquare,
  Award,
  Lock,
  Minus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subscription } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onUpgradePlan: (plan: 'FREE_TRIAL' | 'MONTHLY' | 'ANNUAL' | 'PRO' | 'PREMIUM') => Promise<boolean>;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onUpgradePlan,
}) => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectPlan = async (plan: 'FREE_TRIAL' | 'MONTHLY' | 'ANNUAL') => {
    setIsUpdating(true);
    try {
      const ok = await onUpgradePlan(plan);
      if (ok) {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#f97316', '#ef4444', '#10b981'],
        });
        onClose();
      }
    } catch (err) {
      console.error('Error updating plan:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const isCurrentPlan = (planId: string) => {
    if (!subscription) return false;
    if (planId === 'FREE_TRIAL' && (subscription.plan === 'FREE_TRIAL' || subscription.plan === 'FREE')) return true;
    if (planId === 'MONTHLY' && (subscription.plan === 'MONTHLY' || subscription.plan === 'PRO')) return true;
    if (planId === 'ANNUAL' && (subscription.plan === 'ANNUAL' || subscription.plan === 'PREMIUM')) return true;
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          id="close-sub-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-400">
            <Crown className="h-3.5 w-3.5 fill-amber-400" />
            <span>Benefícios & Planos Oficiais RimaLab</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Evolua seu Freestyle do Básico ao Nível Profissional
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Veja exatamente o que cada plano oferece e o que você desbloqueia ao assinar o mensal ou o anual exclusivo.
          </p>
        </div>

        {/* Trial Days Status Banner (If in trial) */}
        {subscription && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-amber-950/30 border border-amber-500/20 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    Status Atual: <strong className="text-amber-400">{subscription.plan === 'ANNUAL' ? 'Plano Anual VIP' : subscription.plan === 'MONTHLY' ? 'Plano Mensal' : 'Teste Grátis (14 Dias)'}</strong>
                  </span>
                  {subscription.trialDaysRemaining !== undefined && (
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                      {subscription.trialDaysRemaining} dias restantes
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Análises de IA utilizadas: {subscription.aiQuotaUsed} de {subscription.aiMonthlyQuota} disponíveis
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <span className="text-neutral-400">IP Seguro & Vinculado:</span>
              <div className="font-mono text-amber-300 text-[11px]">{subscription.registeredIp || 'Dispositivo Verificado'}</div>
            </div>
          </div>
        )}

        {/* 3 Tier Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Card 1: Grátis (14 Dias de Teste) */}
          <div className={`flex flex-col justify-between rounded-2xl p-5 border bg-neutral-900/70 ${
            isCurrentPlan('FREE_TRIAL') ? 'border-neutral-700 ring-1 ring-neutral-700' : 'border-neutral-800'
          }`}>
            <div className="space-y-4">
              <div>
                <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] font-black uppercase text-neutral-400">
                  ENTRADA
                </span>
                <h3 className="text-lg font-black text-white mt-1">Teste Grátis (14 Dias)</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Período de experiência para conhecer o app.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">R$ 0</span>
                <span className="text-xs text-neutral-400 font-semibold">/14 dias por IP</span>
              </div>

              {/* Included vs Not Included */}
              <div className="space-y-3 pt-3 border-t border-neutral-800 text-xs">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">O que inclui:</span>
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>20 análises de rima com IA</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Beats padrão do sintetizador</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Ouvinte nas aulas ao vivo</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">O que NÃO tem:</span>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Minus className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                    <span>IA Jurado Ilimitada</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Minus className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                    <span>Gravação e download HD</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Minus className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                    <span>Mentoria 1-a-1 com professores</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800">
              <button
                disabled={isCurrentPlan('FREE_TRIAL')}
                onClick={() => handleSelectPlan('FREE_TRIAL')}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-default"
              >
                {isCurrentPlan('FREE_TRIAL') ? 'Plano Ativo (Trial)' : '14 Dias Grátis'}
              </button>
            </div>
          </div>

          {/* Card 2: Plano Mensal */}
          <div className={`flex flex-col justify-between rounded-2xl p-5 border transition-all ${
            isCurrentPlan('MONTHLY')
              ? 'bg-neutral-900 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-neutral-900/90 border-neutral-700 hover:border-neutral-600'
          }`}>
            <div className="space-y-4">
              <div>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300">
                  PLANO MENSAL
                </span>
                <h3 className="text-lg font-black text-white mt-1">RimaLab Mensal</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Para rimadores focados em evolução constante.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-amber-400">R$ 19,90</span>
                <span className="text-xs text-neutral-400 font-semibold">/mês</span>
              </div>

              {/* Included vs Not Included */}
              <div className="space-y-3 pt-3 border-t border-neutral-800 text-xs">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">O que inclui:</span>
                  <div className="flex items-center gap-2 text-neutral-200">
                    <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span><strong>IA Jurado Ilimitada</strong> (200 análises/mês)</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-200">
                    <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span><strong>Todos os 6 Beats & Estilos</strong> em alta fidelidade</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-200">
                    <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span><strong>Gravação & Download</strong> de áudio WAV</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-200">
                    <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span><strong>Speed Flow & Câmera de MC</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-200">
                    <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Acesso a todas as salas de mentoria em grupo</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">O que o Mensal NÃO tem:</span>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Minus className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                    <span>Mentoria 1-a-1 Privada (exclusiva do Anual)</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Minus className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                    <span>Beats Exclusivos de Produtores</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Minus className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
                    <span>Certificado Oficial de MC</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800">
              <button
                id="select-plan-monthly-btn"
                disabled={isUpdating || isCurrentPlan('MONTHLY')}
                onClick={() => handleSelectPlan('MONTHLY')}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isCurrentPlan('MONTHLY')
                    ? 'bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-default'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 hover:brightness-110 shadow-lg shadow-amber-500/20'
                }`}
              >
                {isCurrentPlan('MONTHLY') ? 'Seu Plano Atual' : 'Assinar Plano Mensal'}
              </button>
            </div>
          </div>

          {/* Card 3: Plano Anual VIP (Mais Completo) */}
          <div className="relative flex flex-col justify-between rounded-2xl p-5 border border-amber-500/60 bg-gradient-to-b from-amber-950/40 via-neutral-900 to-neutral-950 shadow-2xl shadow-amber-500/15">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-3.5 py-0.5 text-[10px] font-black uppercase text-neutral-950 shadow-lg flex items-center gap-1">
              <Crown className="h-3 w-3 fill-neutral-950" />
              <span>Mais Completo • Economize 37%</span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="rounded bg-gradient-to-r from-amber-500/30 to-orange-500/30 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300 border border-amber-500/40">
                  👑 VIP ANUAL
                </span>
                <h3 className="text-lg font-black text-white mt-1">RimaLab Anual Mestre</h3>
                <p className="text-xs text-neutral-300 mt-0.5">Mentoria individual e acesso VIP total.</p>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">
                    R$ 149,90
                  </span>
                  <span className="text-xs text-neutral-400 font-semibold">/ano</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold block mt-0.5">
                  Equivalente a apenas R$ 12,49/mês
                </span>
              </div>

              {/* Exclusive VIP features that Monthly doesn't have */}
              <div className="space-y-3 pt-3 border-t border-neutral-800 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Tudo do Mensal + Benefícios Exclusivos:
                </span>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200">
                    <Phone className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Mentoria 1-a-1 Privada</strong> com Luquita MC & Kowalski MC no WhatsApp/Discord</span>
                  </div>

                  <div className="flex items-start gap-2 text-neutral-200">
                    <Crown className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Pacote Exclusivo de Beats VIP</strong> de produtores parceiros com stems</span>
                  </div>

                  <div className="flex items-start gap-2 text-neutral-200">
                    <Video className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Análise de Presença de Palco & Câmera</strong> por IA Mestre</span>
                  </div>

                  <div className="flex items-start gap-2 text-neutral-200">
                    <Award className="h-3.5 w-3.5 text-orange-400 shrink-0 mt-0.5" />
                    <span><strong>Certificado Oficial de MC</strong> assinado pelos fundadores</span>
                  </div>

                  <div className="flex items-start gap-2 text-neutral-200">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Selo Dourado VIP no Ranking & Prioridade na fila</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800">
              <button
                id="select-plan-annual-btn"
                disabled={isUpdating || isCurrentPlan('ANNUAL')}
                onClick={() => handleSelectPlan('ANNUAL')}
                className={`w-full py-3 rounded-xl text-xs font-black transition-all ${
                  isCurrentPlan('ANNUAL')
                    ? 'bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-default'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-neutral-950 hover:brightness-110 shadow-xl shadow-amber-500/25 active:scale-95'
                }`}
              >
                {isCurrentPlan('ANNUAL') ? '👑 Seu Plano Ativo VIP' : 'Desbloquear Acesso Anual VIP (R$ 149,90)'}
              </button>
            </div>
          </div>

        </div>

        {/* Guarantee */}
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 pt-2 text-center">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Garantia de 7 dias ou seu dinheiro de volta • Pagamento seguro via PIX ou Cartão • Suporte direto com os professores.</span>
        </div>

      </div>
    </div>
  );
};
