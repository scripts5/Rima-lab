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
  const [activeLeague, setActiveLeague] = useState<string>('Geral');

  const leagues = ['Geral', 'Mestre', 'Diamante', 'Ouro', 'Prata', 'Bronze'];

  // Seeded Community Leaderboard
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

  const filtered = initialLeaderboard.filter(user => {
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
      
      {/* Header Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Ranking da Comunidade
              </span>
            </div>
            <h1 className="text-2xl font-black text-white sm:text-3xl">
              Liga dos MCs do RimaLab
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl mt-1">
              Os rimadores mais consistentes da temporada. Pratique diariamente, acumule XP e suba nas divisões de elite.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-neutral-950/80 px-4 py-2.5 rounded-xl border border-neutral-800">
            <Shield className="h-5 w-5 text-amber-400" />
            <div>
              <span className="text-xs text-neutral-400 font-semibold">Sua Divisão Atual</span>
              <p className="text-sm font-black text-white">
                Liga Ouro (#4 Geral)
              </p>
            </div>
          </div>
        </div>

        {/* League Selector */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-neutral-800">
          {leagues.map((lg) => (
            <button
              key={lg}
              onClick={() => setActiveLeague(lg)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeLeague === lg
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-neutral-200'
              }`}
            >
              {lg}
            </button>
          ))}
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
                <th className="py-3 px-4">Liga</th>
                <th className="py-3 px-4">Nível</th>
                <th className="py-3 px-4">XP Total</th>
                <th className="py-3 px-4">Sequência</th>
                <th className="py-3 px-4">Estilo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filtered.map((user) => {
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
                            {user.totalSessions} sessões de treino
                          </span>
                        </div>
                      </div>
                    </td>

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
                      {user.totalXP.toLocaleString('pt-BR')} XP
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
