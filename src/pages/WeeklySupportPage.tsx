import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flame, Loader2, Trophy, MousePointerClick, Link2, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import { getAssetUrl } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import type { WeeklySupportRow } from '../types';

const tierColors = [
  'text-yellow-400 border-yellow-700/60 bg-yellow-950/30',
  'text-slate-300 border-slate-600/50 bg-slate-900/30',
  'text-amber-600 border-amber-800/50 bg-amber-950/30',
];

const rankEmoji = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

export default function WeeklySupportPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: supporters, isLoading } = useQuery({
    queryKey: ['weeklySupporters'],
    queryFn: () => api.getWeeklySupporters(),
  });

  // Find current user's row
  const myRow = supporters?.find(
    (r: WeeklySupportRow) => r.username?.toLowerCase() === user?.username?.toLowerCase()
  );
  const topLinks = supporters?.[0]?.linksSupported ?? 1;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-surface to-surface p-6">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Flame size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-textPrimary">Weekly Support Board</h1>
              <p className="text-textSecondary text-sm">Most supportive creators this week — ranked by unique links clicked</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">🔄 Resets every Monday at midnight</span>
            <span className="px-3 py-1 rounded-full bg-surfaceHover text-textSecondary text-xs border border-border">Click links to earn your spot</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-textSecondary animate-pulse">Loading this week's champions...</p>
        </div>
      ) : !supporters?.length ? (
        <div className="text-center py-16 text-textSecondary border border-dashed border-border rounded-xl">
          <Flame size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No support activity this week yet</p>
          <p className="text-sm mt-1">Click links in communities to appear here!</p>
        </div>
      ) : (
        <>
          {/* Your rank card — shown if you're on the board */}
          {myRow ? (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                <TrendingUp size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-textPrimary">Your position this week</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {/* Progress bar toward #1 */}
                  <div className="flex-1 h-1.5 rounded-full bg-surfaceHover overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.min(100, (myRow.linksSupported / topLinks) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-textSecondary shrink-0">
                    {myRow.linksSupported}/{topLinks} links
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-primary">{rankEmoji(myRow.rank)}</p>
                <p className="text-[10px] text-textSecondary">rank</p>
              </div>
            </div>
          ) : (
            // Not on board yet — motivational nudge
            <div className="rounded-2xl border border-dashed border-border p-4 flex items-center gap-3 bg-surfaceHover/30">
              <Flame size={18} className="text-primary/50 shrink-0" />
              <p className="text-sm text-textSecondary">
                You're not on the board yet this week. Click links in communities to climb the ranks!
              </p>
            </div>
          )}

          {/* Top 3 podium */}
          {supporters.length >= 1 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-sm sm:max-w-xl mx-auto">
              {(() => {
                const top3 = supporters.slice(0, 3);
                const ordered = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
                return ordered.map((u: WeeklySupportRow) => {
                  const isWinner = u.rank === 1;
                  const isMe = u.username?.toLowerCase() === user?.username?.toLowerCase();
                  const colorClass = tierColors[Math.min(u.rank - 1, 2)];
                  return (
                    <div
                      key={u.userId}
                      className={`flex flex-col items-center cursor-pointer ${isWinner ? '-mt-4 sm:-mt-6' : 'mt-0'}`}
                      onClick={() => navigate(`/user/${u.userId}`)}
                    >
                      <div className={`relative w-10 h-10 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center mb-1 sm:mb-2 shadow-xl overflow-hidden transition-all hover:scale-105 ${isMe ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface' : ''} ${colorClass}`}>
                        {u.avatarUrl ? (
                          <img src={getAssetUrl(u.avatarUrl)!} alt={u.username} className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <span className="text-sm sm:text-xl font-bold">{u.username?.[0] || '?'}</span>
                        )}
                        {isMe && (
                          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 px-1 py-0 bg-primary rounded-full">
                            <span className="text-[7px] text-white font-bold">YOU</span>
                          </div>
                        )}
                      </div>
                      <p className={`text-[9px] sm:text-xs font-bold truncate w-full text-center px-1 ${isMe ? 'text-primary' : 'text-textPrimary'}`}>{u.username}</p>
                      <p className="text-[9px] sm:text-xs text-primary font-semibold">{u.linksSupported} links</p>
                      <div className={`w-full mt-2 sm:mt-3 rounded-t-xl border-t border-x border-border flex flex-col items-center justify-center gap-1 bg-surfaceHover ${isWinner ? 'h-24 sm:h-32 bg-gradient-to-b from-primary/10 to-surfaceHover' : 'h-16 sm:h-24'}`}>
                        {isWinner ? <Flame size={20} className="text-primary" /> : <Trophy size={16} className={tierColors[u.rank - 1]?.split(' ')[0]} />}
                        <span className="text-[10px] sm:text-xs font-bold text-textSecondary">#{u.rank}</span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}

          {/* Full table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[320px]">
                <thead>
                  <tr className="border-b border-border bg-surfaceHover/30">
                    <th className="text-left py-3 px-4 text-textSecondary font-medium text-xs">Rank</th>
                    <th className="text-left py-3 px-4 text-textSecondary font-medium text-xs">Creator</th>
                    <th className="text-right py-3 px-4 text-textSecondary font-medium text-xs">Links Supported</th>
                    <th className="text-right py-3 px-4 text-textSecondary font-medium text-xs hidden sm:table-cell">Total Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {supporters.map((row: WeeklySupportRow) => {
                    const isMe = row.username?.toLowerCase() === user?.username?.toLowerCase();
                    return (
                      <tr
                        key={row.rank}
                        className={`border-b border-border/30 transition-colors cursor-pointer ${
                          isMe
                            ? 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                            : 'hover:bg-surfaceHover/50 active:bg-surfaceHover'
                        }`}
                        onClick={() => navigate(`/user/${row.userId}`)}
                      >
                        <td className="py-3 px-4 font-mono">
                          {row.rank <= 3 ? (
                            <span className="text-base">{rankEmoji(row.rank)}</span>
                          ) : (
                            <span className="text-textSecondary text-xs">#{row.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden border ${isMe ? 'border-primary bg-primary/20 text-primary' : 'border-primary/20 bg-primary/10 text-primary'}`}>
                              {row.avatarUrl ? (
                                <img src={getAssetUrl(row.avatarUrl)!} alt={row.username} className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : (
                                row.username?.[0] || '?'
                              )}
                            </div>
                            <span className={`font-semibold text-xs sm:text-sm truncate ${isMe ? 'text-primary' : 'text-textPrimary'}`}>
                              {row.username}
                              {isMe && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">YOU</span>}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Mini progress bar */}
                            <div className="hidden sm:block w-16 h-1 rounded-full bg-surfaceHover overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${Math.min(100, (row.linksSupported / topLinks) * 100)}%` }}
                              />
                            </div>
                            <span className="flex items-center gap-1 text-primary font-bold text-xs sm:text-sm">
                              <Link2 size={12} className="shrink-0" />
                              {row.linksSupported}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-textSecondary hidden sm:table-cell">
                          <span className="flex items-center justify-end gap-1 text-xs">
                            <MousePointerClick size={11} className="shrink-0" />
                            {row.totalClicks}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
