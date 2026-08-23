import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  RefreshCw, 
  Play, 
  Layers, 
  Zap, 
  Compass, 
  Check 
} from 'lucide-react';

interface PromptGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToStudio: (themeData: {
    title: string;
    theme: string;
    requiredWords: string[];
    timeLimitSeconds?: number;
  }) => void;
}

export const PromptGeneratorModal: React.FC<PromptGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyToStudio,
}) => {
  const [themeCategory, setThemeCategory] = useState<string>('Batalha de Rima');
  const [difficulty, setDifficulty] = useState<string>('Médio');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<{
    topic: string;
    punchlineTip: string;
    words: string[];
  } | null>({
    topic: 'Superação no Asfalto e Foco na Missão',
    punchlineTip: 'Feche a quarta barra contrastando sua persistência com o barulho dos críticos.',
    words: ['visão', 'criação', 'direção', 'evolução'],
  });

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeCategory, difficulty }),
      });
      const data = await res.json();
      if (data.prompt) {
        setGeneratedResult({
          topic: data.prompt.topic,
          punchlineTip: data.prompt.punchlineTip || 'Conecte as rimas mantendo o flow no tempo 4.',
          words: data.prompt.words || ['mente', 'frente', 'presente', 'quente'],
        });
      }
    } catch (err) {
      console.error('Error generating prompt:', err);
      // Fallback
      setGeneratedResult({
        topic: `${themeCategory}: Improviso Espontâneo`,
        punchlineTip: 'Construa uma rima alternada ABAB antes de soltar a punchline final.',
        words: ['resiliência', 'consciência', 'potência', 'experiência'],
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedResult) return;
    onApplyToStudio({
      title: `Treino IA: ${themeCategory}`,
      theme: generatedResult.topic,
      requiredWords: generatedResult.words,
      timeLimitSeconds: 60,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-neutral-800 bg-neutral-950 p-6 sm:p-7 shadow-2xl space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-400">
            <Sparkles className="h-4 w-4" />
            <span>Gerador Inteligente de Treino</span>
          </div>
          <h2 className="text-xl font-black text-white">
            Sorteador de Temas & Palavras-Chave
          </h2>
          <p className="text-xs text-neutral-400">
            A IA gera temas inéditos, dicas de punchline e palavras obrigatórias para forçar sua criatividade e agilidade mental.
          </p>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 pt-2">
          
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1.5">
              Tema / Estilo do Freestyle:
            </label>
            <select
              value={themeCategory}
              onChange={(e) => setThemeCategory(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="Batalha de Rima">Batalha de Rima (Ataque & Resposta)</option>
              <option value="Consciência Social & Vivência">Consciência Social & Vivência Urbana</option>
              <option value="Filosofia & Poesia">Filosofia, Conhecimento & Poesia</option>
              <option value="Love Song & Sentimento">Love Song, Sentimento & Relações</option>
              <option value="Speed Flow & Métrica Rápida">Speed Flow & Métrica Rápida</option>
              <option value="Histórias & Storytelling">Histórias & Storytelling</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1.5">
              Nível de Dificuldade do Vocabulário:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Fácil', 'Médio', 'Difícil'].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    difficulty === diff
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 py-2.5 text-xs font-bold text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Gerando com IA...' : 'Sortear Novo Tema com IA'}</span>
          </button>
        </div>

        {/* Generated Result Box */}
        {generatedResult && (
          <div className="rounded-2xl border border-purple-500/40 bg-purple-950/20 p-4 space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Tema Sorteado:
              </span>
              <p className="text-sm font-black text-white mt-0.5">
                {generatedResult.topic}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Palavras Obrigatórias no Flow:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {generatedResult.words.map((w, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-neutral-900 border border-purple-500/30 px-2.5 py-1 text-xs font-bold text-amber-300"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-xs text-neutral-300 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/60">
              💡 <strong className="text-purple-300">Dica de Punchline:</strong> {generatedResult.punchlineTip}
            </div>

            <button
              onClick={handleApply}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-neutral-950 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Aplicar no Studio & Iniciar Beat</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
