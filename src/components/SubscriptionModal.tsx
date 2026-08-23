import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Crown, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Mic, 
  Layers 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Subscription } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onUpgradePlan: (plan: 'FREE' | 'PRO' | 'PREMIUM') => Promise<boolean>;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onUpgradePlan,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PRO' | 'PREMIUM'>(subscription?.plan || 'PRO');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectPlan = async (plan: 'FREE' | 'PRO' | 'PREMIUM') => {
    setIsUpdating(true);
    try {
      const ok = await onUpgradePlan(plan);
      if (ok) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ec4899', '#8b5cf6'],
        });
        onClose();
      }
    } catch (err) {
      console.error('Error updating plan:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const plans = [
    {
      id: 'FREE' as const,
      name: 'Plano Gratuito',
      price: 'R$ 0',
      period: 'para sempre',
      tagline: 'Ideal para rimadores iniciantes que querem treinar diariamente.',
      features: [
        'Acesso aos beats clássicos Web Audio',
        'Reconhecimento de voz em tempo real',
        '15 Análises de Rima com IA por mês',
        'Acesso ao Curso de Fundamentos',
        'Quadro de Conquistas e XP',
      ],
      cta: 'Plano Básico',
      highlighted: false,
    },
    {
      id: 'PRO' as const,
      name: 'RimaLab PRO',
      price: 'R$ 19,90',
      period: '/mês',
      tagline: 'Para MCs focados em evoluir métrica, ritmo e vencer batalhas.',
      features: [
        'Todos os 6 Beats & Estilos Sintetizados',
        '100 Análises Detalhadas de IA por mês',
        'Detecção de Punchlines & Feedback de Flow',
        'Acesso completo a todas as Lições & Desafios',
        'Exportação de áudio e dados ilimitada',
        'Badge exclusivo PRO no Ranking',
      ],
      cta: 'Evoluir para PRO',
      highlighted: true,
    },
    {
      id: 'PREMIUM' as const,
      name: 'RimaLab Mestre',
      price: 'R$ 39,90',
      period: '/mês',
      tagline: 'Treinamento profissional ilimitado com mentoria IA avançada.',
      features: [
        'Análises de IA sem limites (500/mês)',
        'Gerador de Punchlines e Temas IA prioritário',
        'Gravações de sessões ilimitadas',
        'Suporte prioritário e novidades antecipadas',
        'Badge Mestre Dourado no perfil',
      ],
      cta: 'Tornar-se Mestre',
      highlighted: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Title */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-400">
            <Crown className="h-3.5 w-3.5" />
            <span>Planos RimaLab</span>
          </div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">
            Escolha o Plano Ideal para o Seu Flow
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Desbloqueie todo o poder da inteligência artificial aplicada ao freestyle, métrica e batalhas de rap.
          </p>
        </div>

        {/* Current Plan Quota Indicator */}
        {subscription && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white">
                  Seu Plano Atual: <strong className="text-amber-400">{subscription.plan}</strong>
                </span>
                <p className="text-xs text-neutral-400">
                  Uso de IA neste mês: {subscription.aiQuotaUsed} de {subscription.aiMonthlyQuota} análises
                </p>
              </div>
            </div>

            <div className="h-2 w-32 rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.min(100, (subscription.aiQuotaUsed / subscription.aiMonthlyQuota) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Plans 3-Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p) => {
            const isCurrent = subscription?.plan === p.id;
            return (
              <div
                key={p.id}
                className={`flex flex-col justify-between rounded-2xl p-6 border transition-all ${
                  p.highlighted
                    ? 'bg-gradient-to-b from-amber-950/40 via-neutral-900 to-neutral-950 border-amber-500/60 shadow-xl shadow-amber-500/10 relative'
                    : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {p.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-0.5 text-[10px] font-black uppercase text-neutral-950 shadow-md">
                    Mais Popular
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-white">{p.name}</h3>
                    <p className="text-xs text-neutral-400 mt-1">{p.tagline}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{p.price}</span>
                    <span className="text-xs text-neutral-400 font-semibold">{p.period}</span>
                  </div>

                  <ul className="space-y-2.5 pt-2 border-t border-neutral-800">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                        <Check className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800">
                  <button
                    id={`select-plan-${p.id}-btn`}
                    disabled={isUpdating || isCurrent}
                    onClick={() => handleSelectPlan(p.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-default'
                        : p.highlighted
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 hover:brightness-110 shadow-lg shadow-amber-500/20'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                    }`}
                  >
                    {isCurrent ? 'Plano Ativo' : p.cta}
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Security & Satisfaction Guarantee Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 pt-2 text-center">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Cancelamento simples a qualquer momento. Seus dados e treinos protegidos.</span>
        </div>

      </div>
    </div>
  );
};
