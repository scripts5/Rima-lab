import React from 'react';
import { 
  Zap, 
  Clock, 
  Award, 
  Play, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Sliders, 
  Check,
  Target
} from 'lucide-react';
import { Challenge, UserProfile } from '../types';

interface DailyChallengesProps {
  challenges: Challenge[];
  profile?: UserProfile | null;
  onStartChallengeInStudio: (challenge: Challenge) => void;
}

export const DailyChallenges: React.FC<DailyChallengesProps> = ({
  challenges,
  profile,
  onStartChallengeInStudio,
}) => {
  const [filterCategory, setFilterCategory] = React.useState<string>('Minha Trilha');

  const userSkills = profile?.focusSkills || ['speedflow', 'encaixe_beat', 'contagem_versos'];

  const filteredChallenges = challenges.filter(c => {
    if (filterCategory === 'Todos') return true;
    if (filterCategory === 'Minha Trilha') {
      if (userSkills.includes('speedflow') && c.category === 'Speed') return true;
      if (userSkills.includes('punchline') && c.category === 'Punchline') return true;
      if (userSkills.includes('flow') && c.category === 'Daily') return true;
      return c.category === 'Daily' || c.category === 'Speed' || c.category === 'Punchline';
    }
    return c.category === filterCategory;
  });
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-orange-950/30 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-orange-500 fill-orange-500/20" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Desafios em Tempo Real
              </span>
            </div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">
              Desafios Diários de Freestyle
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl mt-1">
              Coloque seu vocabulário, raciocínio rápido e métrica à prova com restrições criativas de palavras e tempo limite.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-neutral-950/80 px-4 py-2.5 rounded-xl border border-neutral-800">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <span className="text-xs text-neutral-400 font-semibold">Desafios Hoje</span>
              <p className="text-sm font-black text-white">
                {challenges.filter(c => c.completed).length} de {challenges.length} Feitos
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-neutral-800">
          {['Minha Trilha', 'Todos', 'Speed', 'Punchline', 'Daily', 'Vocabulary', 'Storytelling'].map((cat) => {
            const isTrilha = cat === 'Minha Trilha';
            const isSelected = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? isTrilha
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 font-black shadow-md'
                      : 'bg-amber-500 text-neutral-950 shadow-md'
                    : isTrilha
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
                }`}
              >
                {isTrilha && <Sparkles className="h-3 w-3" />}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredChallenges.map((challenge) => {
          const isDone = challenge.completed;
          return (
            <div
              key={challenge.id}
              className={`flex flex-col justify-between rounded-2xl p-5 border transition-all ${
                isDone
                  ? 'bg-neutral-900/60 border-emerald-500/40 opacity-90'
                  : 'bg-neutral-900/90 border-neutral-800 hover:border-amber-500/40 shadow-xl'
              }`}
            >
              <div className="space-y-4">
                
                {/* Top Badge Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs font-bold text-neutral-300">
                      {challenge.category}
                    </span>
                    <span className={`text-[11px] font-bold ${
                      challenge.difficulty === 'Fácil' ? 'text-emerald-400' : challenge.difficulty === 'Médio' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {challenge.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-black text-amber-400">
                    <Award className="h-3.5 w-3.5" />
                    <span>+{challenge.xpReward} XP</span>
                  </div>
                </div>

                {/* Challenge Title & Description */}
                <div>
                  <h3 className="text-base font-black text-white">
                    {challenge.title}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {challenge.description}
                  </p>
                </div>

                {/* Theme & Recommended Beat */}
                <div className="rounded-xl bg-neutral-950 p-3 border border-neutral-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 font-medium">Tema:</span>
                    <strong className="text-neutral-200">{challenge.theme}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 font-medium">Beat Recomendado:</span>
                    <strong className="text-amber-400">{challenge.recommendedBeat} ({challenge.recommendedBpm} BPM)</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 font-medium">Tempo Limite:</span>
                    <strong className="text-neutral-200 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3 text-neutral-400" />
                      {challenge.timeLimitSeconds}s
                    </strong>
                  </div>
                </div>

                {/* Required Words Chips */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Palavras Obrigatórias no Flow:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {challenge.requiredWords.map((word, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-neutral-800 border border-neutral-700 px-2 py-1 text-xs font-bold text-amber-300"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-neutral-800">
                <button
                  id={`start-challenge-${challenge.id}-btn`}
                  onClick={() => onStartChallengeInStudio(challenge)}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 text-neutral-950 hover:brightness-110 shadow-md shadow-orange-500/20'
                  }`}
                >
                  {isDone ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Desafio Concluído (Praticar de Novo)</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      <span>Iniciar Desafio no Studio</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
