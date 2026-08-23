import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Lock, 
  Flame, 
  Zap, 
  BookOpen, 
  Trophy, 
  Mic, 
  Star, 
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Achievement } from '../types';

interface AchievementsViewProps {
  achievements: Achievement[];
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  achievements,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  const categories = ['Todos', 'Prática', 'XP', 'Lições', 'Consistência', 'Desafios'];

  const filteredAchievements = achievements.filter(a => {
    if (activeCategory === 'Todos') return true;
    return a.category === activeCategory;
  });

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  const renderIcon = (iconName: string, isUnlocked: boolean) => {
    const className = `h-6 w-6 ${isUnlocked ? 'text-amber-400' : 'text-neutral-500'}`;
    switch (iconName) {
      case 'Mic': return <Mic className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Trophy': return <Trophy className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Star': return <Star className={className} />;
      case 'TrendingUp': return <TrendingUp className={className} />;
      default: return <Award className={className} />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-5 w-5 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Conquistas & Badges
              </span>
            </div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">
              Quadro de Conquistas do MC
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl mt-1">
              Desbloqueie medalhas exclusivas subindo de nível, mantendo sequências de treino e aperfeiçoando suas rimas no mic.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-neutral-950/80 px-4 py-2.5 rounded-xl border border-neutral-800">
            <Trophy className="h-5 w-5 text-amber-400" />
            <div>
              <span className="text-xs text-neutral-400 font-semibold">Total Desbloqueado</span>
              <p className="text-sm font-black text-white">
                {unlockedCount} de {achievements.length} Badges ({Math.round((unlockedCount / achievements.length) * 100)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-neutral-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeCategory === cat
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAchievements.map((ach) => {
          const unlocked = ach.isUnlocked;
          return (
            <div
              key={ach.key}
              className={`flex items-start gap-4 rounded-2xl p-5 border transition-all ${
                unlocked
                  ? 'bg-gradient-to-br from-neutral-900 to-amber-950/20 border-amber-500/40 shadow-lg'
                  : 'bg-neutral-900/60 border-neutral-800 opacity-70'
              }`}
            >
              {/* Badge Icon */}
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                unlocked
                  ? 'bg-amber-500/20 border border-amber-500/50 shadow-inner'
                  : 'bg-neutral-800/80 border border-neutral-700'
              }`}>
                {renderIcon(ach.icon, !!unlocked)}
              </div>

              {/* Badge Details */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                    {ach.category}
                  </span>
                  {unlocked ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Desbloqueado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-neutral-500">
                      <Lock className="h-3 w-3" />
                      Bloqueado
                    </span>
                  )}
                </div>

                <h3 className={`text-sm font-bold ${unlocked ? 'text-white' : 'text-neutral-300'}`}>
                  {ach.title}
                </h3>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  {ach.description}
                </p>

                <div className="pt-2 text-[11px] text-neutral-500">
                  Requisito: <span className="text-neutral-300 font-medium">{ach.requirement}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
