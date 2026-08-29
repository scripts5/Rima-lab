import React, { useState } from 'react';
import { 
  Trophy, 
  Flame, 
  Award, 
  Crown, 
  Sparkles, 
  Medal, 
  Mic, 
  Shield 
} from 'lucide-react';
import { UserProfile } from '../types';

interface LeaderboardUser {
  rank: number;
  id: string;
  artisticName: string;
  avatarUrl: string;
  level: number;
  totalXP: number;
  streakDays: number;
  totalSessions: number;
  favoriteStyle: string;
  league: 'Mestre' | 'Diamante' | 'Ouro' | 'Prata' | 'Bronze';
}

interface LeaderboardViewProps {
  currentProfile: UserProfile | null;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  currentProfile,
}) => {
  const [rankingMode, setRankingMode] = useState<'weekly' | 'all_time'>('weekly');
  const [activeLeague, setActiveLeague] = useState<string>('Geral');

  const leagues = ['Geral', 'Mestre', 'Diamante', 'Ouro', 'Prata', 'Bronze'];

  // Seeded Weekly Leaderboard
  const weeklyLeaderboard = [
    {
      rank: 1,
      id: 'mc_weekly_01',
      artisticName: 'MC Verso Letal',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      level: 8,
      weeklyXP: 1485,
      totalXP: 7850,
      streakDays: 14,
      weeklyBattles: 18,
      favoriteStyle: 'Grime',
      league: 'Mestre' as const,
      rankChange: 2, // Up 2
    },
    {
      rank: 2,
      id: currentProfile?.userId || 'user_demo_01',
      artisticName: currentProfile?.artisticName || 'MC Foco & Flow (Você)',
      avatarUrl: currentProfile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      level: currentProfile?.level || 2,
      weeklyXP: 1120,
      totalXP: currentProfile?.totalXP || 1450,
      streakDays: currentProfile?.streakDays || 4,
      weeklyBattles: 14,
      favoriteStyle: currentProfile?.favoriteStyle || 'Boom Bap',
      league: 'Ouro' as const,
      rankChange: 3, // Up 3
    },
    {
      rank: 3,
      id: 'mc_weekly_02',
      artisticName: 'Lírica Suprema',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      level: 10,
      weeklyXP: 990,
      totalXP: 9600,
      streakDays: 21,
      weeklyBattles: 12,
      favoriteStyle: 'Boom Bap',
      league: 'Mestre' as const,
      rankChange: -1, // Down 1
    },
    {
      rank: 4,
      id: 'mc_weekly_03',
      artisticName: 'Speed Métrica',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      level: 3,
      weeklyXP: 770,
      totalXP: 2300,
      streakDays: 5,
      weeklyBattles: 9,
      favoriteStyle: 'Speed Flow',
      league: 'Ouro' as const,
      rankChange: 1,
    },
    {
      rank: 5,
      id: 'mc_01',
      artisticName: 'MC Kronos Flow',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      level: 12,
      weeklyXP: 660,
      totalXP: 11850,
      streakDays: 28,
      weeklyBattles: 8,
      favoriteStyle: 'Drill',
      league: 'Mestre' as const,
      rankChange: -4,
    },
    {
      rank: 6,
      id: 'mc_06',
      artisticName: 'Poeta da Quebrada',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      level: 2,
      weeklyXP: 440,
      totalXP: 1200,
      streakDays: 3,
      weeklyBattles: 5,
      favoriteStyle: 'Lo-Fi',
      league: 'Prata' as const,
      rankChange: 0,
    },
  ];

  // Seeded Community Leaderboard (All-Time)
  const initialLeaderboard: LeaderboardUser[] = [
    {
      rank: 1,
      id: 'mc_01',
      artisticName: 'MC Kronos Flow',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      level: 12,
      totalXP: 11850,
      streakDays: 28,
      totalSessions: 142,
      favoriteStyle: 'Drill',
      league: 'Mestre',
    },
    {
      rank: 2,
      id: 'mc_02',
      artisticName: 'Lírica Suprema',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      level: 10,
      totalXP: 9600,
      streakDays: 21,
      totalSessions: 118,
      favoriteStyle: 'Boom Bap',
      league: 'Mestre',
    },
    {
      rank: 3,
      id: 'mc_03',
      artisticName: 'MC Verso Letal',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      level: 8,
      totalXP: 7850,
      streakDays: 14,
      totalSessions: 89,
      favoriteStyle: 'Grime',
      league: 'Diamante',
    },
    {
      rank: 4,
      id: currentProfile?.userId || 'user_demo_01',
      artisticName: currentProfile?.artisticName || 'MC Foco & Flow (Você)',
      avatarUrl: currentProfile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      level: currentProfile?.level || 2,
      totalXP: currentProfile?.totalXP || 1450,
      streakDays: currentProfile?.streakDays || 4,
      totalSessions: currentProfile?.totalSessions || 6,
      favoriteStyle: currentProfile?.favoriteStyle || 'Boom Bap',
      league: 'Ouro',
    },
    {
      rank: 5,
      id: 'mc_05',
      artisticName: 'Speed Métrica',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      level: 3,
      totalXP: 2300,
      streakDays: 5,
      totalSessions: 22,
      favoriteStyle: 'Speed Flow',
      league: 'Ouro',
    },
    {
      rank: 6,
      id: 'mc_06',
      artisticName: 'Poeta da Quebrada',
      avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      level: 2,
      totalXP: 1200,
      streakDays: 3,
      totalSessions: 14,
      favoriteStyle: 'Lo-Fi',
      league: 'Prata',
    },
    {
      rank: 7,
      id: 'mc_07',
      artisticName: 'MC Novato do Mic',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      level: 1,
      totalXP: 450,
      streakDays: 1,
      totalSessions: 4,
      favoriteStyle: 'Trap',
      league: 'Bronze',
    },
  ];

  const filteredAllTime = initialLeaderboard.filter(user => {
    if (activeLeague === 'Geral') return true;
    return user.league === activeLeague;
  });

  const filteredWeekly = weeklyLeaderboard.filter(user => {
    if (activeLeague === 'Geral') return true;
    return user.league === activeLeague;
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 font-black shadow-md shadow-amber-500/30">
          <Crown className="h-4 w-4 fill-current" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-300 text-neutral-950 font-black">
          <Medal className="h-4 w-4 fill-current" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-700 text-white font-black">
          <Medal className="h-4 w-4 fill-current" />
        </div>
      );
    }
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400 font-bold text-xs">
        #{rank}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      
      {/* Header Banner with Ranking Mode Switcher */}
      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Ranking Oficial da Comunidade
              </span>
            </div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">
              Liga dos MCs do RimaLab
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl mt-1">
              {rankingMode === 'weekly' 
                ? '🏆 Ranking Semanal ativo: O Top 3 da semana ganha Bônus de +330 XP e Badge Dourada na Segunda-feira!' 
                : 'Hall da Fama Geral: Os MCs com maior pontuação acumulada desde o lançamento.'}
            </p>
          </div>

          {/* Ranking Mode Switcher Buttons */}
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800">
            <button
              onClick={() => setRankingMode('weekly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                rankingMode === 'weekly'
                  ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Flame className="h-4 w-4 fill-current" />
              <span>Ranking Semanal ⚡</span>
            </button>
            <button
              onClick={() => setRankingMode('all_time')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                rankingMode === 'all_time'
                  ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Crown className="h-4 w-4 fill-current" />
              <span>Hall da Fama Geral 🏆</span>
            </button>
          </div>
        </div>

        {/* Weekly Countdown Banner */}
        {rankingMode === 'weekly' && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Temporada Semanal em Andamento • Reset em <strong>3 dias e 14 horas</strong></span>
            </div>
            <div className="flex items-center gap-3 text-neutral-300 text-[11px]">
              <span>🥇 1º: +330 XP + Badge Mestre</span>
              <span>🥈 2º: +220 XP</span>
              <span>🥉 3º: +110 XP</span>
            </div>
          </div>
        )}

        {/* League Selector */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-800">
          {leagues.map((lg) => (
            <button
              key={lg}
              onClick={() => setActiveLeague(lg)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeLeague === lg
                  ? 'bg-neutral-800 text-amber-400 border border-amber-500/50 shadow'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
              }`}
            >
              {lg}
            </button>
          ))}
        </div>
      </div>

      {/* Creators Hall of Fame Tribute Card */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-neutral-900 to-orange-950/30 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 font-black text-lg shadow-md shadow-amber-500/20">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Hall da Fama dos Criadores
                </span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-black text-amber-300">
                  FUNDADORES
                </span>
              </div>
              <h3 className="font-display text-sm font-bold text-white">
                Luquita MC & Kowalski MC
              </h3>
              <p className="text-xs text-neutral-400">
                Pioneiros do RimaLab AI • Mestres da métrica, flow avançado e engenharia de rima.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-lg bg-neutral-950 px-3 py-1.5 border border-amber-500/30 text-amber-300 font-bold">
              🎤 Luquita MC [Honorário]
            </span>
            <span className="rounded-lg bg-neutral-950 px-3 py-1.5 border border-orange-500/30 text-orange-300 font-bold">
              ⚡ Kowalski MC [Honorário]
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Posição</th>
                <th className="py-3 px-4">MC / Vulgo</th>
                {rankingMode === 'weekly' && <th className="py-3 px-4">Evolução</th>}
                <th className="py-3 px-4">Liga</th>
                <th className="py-3 px-4">Nível</th>
                <th className="py-3 px-4">{rankingMode === 'weekly' ? 'XP da Semana' : 'XP Total'}</th>
                <th className="py-3 px-4">Sequência</th>
                <th className="py-3 px-4">Estilo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {(rankingMode === 'weekly' ? filteredWeekly : filteredAllTime).map((user: any) => {
                const isMe = user.id === (currentProfile?.userId || 'user_demo_01');
                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${
                      isMe
                        ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-amber-500 font-semibold'
                        : 'hover:bg-neutral-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      {getRankBadge(user.rank)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatarUrl}
                          alt={user.artisticName}
                          referrerPolicy="no-referrer"
                          className="h-9 w-9 rounded-xl border border-neutral-700 bg-neutral-950 object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">
                              {user.artisticName}
                            </span>
                            {isMe && (
                              <span className="rounded bg-amber-500 px-1 py-0.2 text-[9px] font-black text-neutral-950">
                                VOCÊ
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-500">
                            {rankingMode === 'weekly' ? `${user.weeklyBattles || 8} batalhas esta semana` : `${user.totalSessions || 12} sessões de treino`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Rank Climb Indicator */}
                    {rankingMode === 'weekly' && (
                      <td className="py-3.5 px-4">
                        {user.rankChange > 0 ? (
                          <span className="flex items-center gap-0.5 text-emerald-400 font-black text-xs">
                            ▲ +{user.rankChange}
                          </span>
                        ) : user.rankChange < 0 ? (
                          <span className="flex items-center gap-0.5 text-rose-400 font-black text-xs">
                            ▼ {user.rankChange}
                          </span>
                        ) : (
                          <span className="text-neutral-500 font-bold text-xs">
                            ― 0
                          </span>
                        )}
                      </td>
                    )}

                    <td className="py-3.5 px-4">
                      <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        user.league === 'Mestre'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : user.league === 'Diamante'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : user.league === 'Ouro'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}>
                        {user.league}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-neutral-200">
                      Nível {user.level}
                    </td>

                    <td className="py-3.5 px-4 font-black text-amber-400 text-sm">
                      {(rankingMode === 'weekly' ? user.weeklyXP : user.totalXP).toLocaleString('pt-BR')} XP
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-orange-400 font-bold">
                        <Flame className="h-3.5 w-3.5 fill-current" />
                        <span>{user.streakDays} dias</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-neutral-400">
                      {user.favoriteStyle}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
