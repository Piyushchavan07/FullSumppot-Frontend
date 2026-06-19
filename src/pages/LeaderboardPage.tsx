import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Medal, Loader2, Filter } from 'lucide-react';
import { api } from '../services/api';

const medalColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];
const niches = ['All', 'Gaming', 'Tech', 'Education', 'Music', 'Comedy', 'Vlogging', 'Finance', 'Fitness', 'Food', 'Travel', 'Other'];

import { getAssetUrl } from '../lib/utils';
import type { LeaderboardRow } from '../types';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [selectedNiche, setSelectedNiche] = useState('All');
  const [showFilter, setShowFilter] = useState(false);

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.leaderboard(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-textSecondary animate-pulse">Calculating rankings...</p>
      </div>
    );
  }

  const filtered = selectedNiche === 'All'
    ? leaderboard ?? []
    : (leaderboard ?? []).filter((r: LeaderboardRow) =>
        r.niche?.toLowerCase() === selectedNiche.toLowerCase()
      );

  // Re-rank after filter
  const ranked = filtered.map((r: LeaderboardRow, i: number) => ({ ...r, rank: i + 1 }));
  const topThree = ranked.length >= 3
    ? [ranked[1], ranked[0], ranked[2]].filter(Boolean)
    : ranked.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary flex items-center gap-2">
            <Trophy size={22} className="text-yellow-400" /> Leaderboard
          </h2>
          <p className="text-textSecondary text-sm mt-1">Top creators by points</p>
        </div>

        {/* Niche filter — collapsed by default */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              showFilter || selectedNiche !== 'All'
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-textSecondary hover:text-textPrimary hover:bg-surfaceHover'
            }`}
          >
            <Filter size={14} />
            {selectedNiche !== 'All' ? selectedNiche : 'Filter'}
          </button>
        </div>
      </div>

      {/* Filter pills — only shown when expanded */}
      {showFilter && (
        <div className="flex gap-1.5 flex-wrap">
          {niches.map((n) => (
            <button
              key={n}
              onClick={() => { setSelectedNiche(n); if (n !== 'All') setShowFilter(false); }}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedNiche === n
                  ? 'bg-primary text-white'
                  : 'bg-surfaceHover text-textSecondary hover:text-textPrimary border border-border'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* Top 3 podium */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-3 gap-1 sm:gap-4 max-w-sm sm:max-w-xl mx-auto pt-4 sm:pt-6">
          {topThree.map((user: LeaderboardRow) => {
            const isWinner = user.rank === 1;
            return (
              <div key={user.username} className={`flex flex-col items-center cursor-pointer ${isWinner ? '-mt-4 sm:-mt-6' : 'mt-0'}`} onClick={() => user.userId && navigate(`/user/${user.userId}`)}>
                <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-surfaceHover border-2 flex items-center justify-center mb-1 sm:mb-2 shadow-xl overflow-hidden ${isWinner ? 'border-yellow-400 scale-110' : 'border-border'} hover:ring-2 hover:ring-primary/40 transition-all`}>
                  {user.avatarUrl ? (
                    <img src={getAssetUrl(user.avatarUrl)!} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm sm:text-xl font-bold text-textPrimary">{user.username?.[0] || '?'}</span>
                  )}
                </div>
                <p className="text-[9px] sm:text-xs font-bold text-textPrimary truncate w-full text-center hover:text-primary transition-colors px-1">{user.username || 'Unknown'}</p>
                <p className="text-[9px] sm:text-xs text-textSecondary">{(user.points || 0).toLocaleString()} pts</p>
                <div className={`w-full mt-2 sm:mt-3 rounded-t-xl bg-surfaceHover border-t border-x border-border flex flex-col items-center justify-center gap-1 ${isWinner ? 'h-24 sm:h-32 bg-gradient-to-b from-yellow-400/10 to-surfaceHover' : 'h-16 sm:h-24'}`}>
                  <Medal size={18} className={medalColors[Math.min(user.rank - 1, 2)]} />
                  <span className="text-[10px] sm:text-xs font-bold text-textSecondary">#{user.rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ranked.length === 0 ? (
        <div className="text-center py-16 text-textSecondary border border-dashed border-border rounded-xl">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p>No creators in {selectedNiche} niche yet</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0 border-border/50">
          <div className="overflow-x-auto -mx-0">
            <table className="w-full text-sm min-w-[320px]">
              <thead>
                <tr className="border-b border-border bg-surfaceHover/30">
                  <th className="text-left py-3 px-3 text-textSecondary font-medium text-xs">Rank</th>
                  <th className="text-left py-3 px-3 text-textSecondary font-medium text-xs">Creator</th>
                  <th className="text-left py-3 px-3 text-textSecondary font-medium text-xs hidden sm:table-cell">Niche</th>
                  <th className="text-right py-3 px-3 text-textSecondary font-medium text-xs">Points</th>
                  <th className="text-right py-3 px-3 text-textSecondary font-medium text-xs hidden md:table-cell">Links</th>
                  <th className="text-right py-3 px-3 text-textSecondary font-medium text-xs hidden md:table-cell">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((row: LeaderboardRow) => (
                  <tr key={row.rank} className="border-b border-border/30 hover:bg-surfaceHover/50 transition-colors group cursor-pointer active:bg-surfaceHover" onClick={() => row.userId && navigate(`/user/${row.userId}`)}>
                    <td className="py-3 px-3">
                      {row.rank <= 3 ? (
                        <Medal size={16} className={medalColors[row.rank - 1]} />
                      ) : (
                        <span className="text-textSecondary font-mono text-xs">#{row.rank}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden">
                          {row.avatarUrl ? (
                            <img src={getAssetUrl(row.avatarUrl)!} alt={row.username} className="w-full h-full object-cover" />
                          ) : (
                            row.username?.[0] || '?'
                          )}
                        </div>
                        <span className="font-semibold text-textPrimary text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{row.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 hidden sm:table-cell">
                      {row.niche ? (
                        <span className="px-2 py-0.5 rounded-full bg-surfaceHover text-textSecondary text-[10px] font-medium border border-border/50 uppercase tracking-wider">
                          {row.niche}
                        </span>
                      ) : (
                        <span className="text-textSecondary/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-textPrimary">
                      <span className="flex items-center justify-end gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400/20 shrink-0" />
                        <span className="text-xs sm:text-sm">{(row.points || 0).toLocaleString()}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-textSecondary hidden md:table-cell font-mono text-xs">{row.linksSubmitted}</td>
                    <td className="py-3 px-3 text-right text-textSecondary hidden md:table-cell font-mono text-xs">{row.clicksReceived}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
