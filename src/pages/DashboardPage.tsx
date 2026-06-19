import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, User, Play, TrendingUp, Star, Zap } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import type { Community } from '../types';
import { getAssetUrl, getCommunityBanner } from '../lib/utils';

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-textPrimary">{value}</p>
        <p className="text-sm text-textSecondary">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: communities } = useQuery({
    queryKey: ['communities'],
    queryFn: () => api.communities(),
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard(),
  });

  const joined = communities?.filter((c: Community) => c.isMember && !c.isCreator) ?? [];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-surface to-surface border border-border p-5 sm:p-8">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <h2 className="text-2xl sm:text-3xl font-black text-textPrimary mb-1">
          Hey, {dashboardData?.username ?? user?.username}
        </h2>
        <p className="text-textSecondary text-sm">
          Ready to grow your channel? Here's your daily overview.
        </p>
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            {dashboardData?.contentNiche ?? user?.contentNiche ?? user?.niche}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Available Points" value={dashboardData?.availablePoints ?? user?.availablePoints ?? 0} icon={Star} color="bg-yellow-500/10 text-yellow-400" />
        <StatCard label="Points Earned Today" value={dashboardData?.pointsEarnedToday ?? 0} icon={Zap} color="bg-primary/10 text-primary" />
        <StatCard label="Views Given Today" value={dashboardData?.viewsGivenToday ?? 0} icon={Play} color="bg-green-500/10 text-green-400" />
        <StatCard label="Communities Joined" value={dashboardData?.communitiesJoined ?? joined.length} icon={Users} color="bg-blue-500/10 text-blue-400" />
      </div>

      {dashboardData?.followingCommunities?.length ? (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" /> Recent From People You Follow
            </h3>
            <Link to="/profile?tab=following" className="text-sm text-textSecondary hover:text-primary transition-colors">Manage</Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {dashboardData.followingCommunities.slice(0, 4).map((c: Community) => {
              const banner = getCommunityBanner(c.bannerUrl, c.latestLinkUrl);
              return (
                <Link key={c.communityId} to={`/communities/${c.communityId}`} className="relative overflow-hidden rounded-2xl border border-border hover:border-border/80 transition-colors group flex flex-col min-h-[160px]">
                  {/* Banner background */}
                  <div className="absolute inset-0">
                    {banner ? (
                      <img
                        src={banner}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-surface" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
                  </div>
                  {/* Content */}
                  <div className="relative z-10 p-3 flex flex-col flex-1 justify-end">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20 shrink-0">
                        {c.creatorAvatar ? (
                          <img
                            src={getAssetUrl(c.creatorAvatar)!}
                            alt={c.creatorName}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <User size={9} className="text-white/70" />
                        )}
                      </div>
                      <span className="text-[10px] text-white/70 truncate max-w-[60px]">@{c.creatorName}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-primary text-white text-[9px] font-bold uppercase tracking-tight shrink-0">{c.niche}</span>
                    </div>
                    <h4 className="font-bold text-white line-clamp-1 text-sm drop-shadow">{c.name}</h4>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[9px] text-white/60 italic">
                        {(() => { try { return formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }); } catch { return 'recently'; } })()}
                      </span>
                      <span className="text-[9px] text-primary font-bold uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">Visit →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {joined.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <Users size={18} className="text-primary" /> Communities I'm In
            </h3>
            <Link to="/communities" className="text-sm text-textSecondary hover:text-primary transition-colors">View all</Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {joined.map((c: Community) => {
              const banner = getCommunityBanner(c.bannerUrl, c.latestLinkUrl);
              return (
                <Link key={c.communityId} to={`/communities/${c.communityId}`} className="relative overflow-hidden rounded-2xl border border-border hover:border-border/80 transition-colors group flex flex-col min-h-[180px]">
                  {/* Banner background */}
                  <div className="absolute inset-0">
                    {banner ? (
                      <img
                        src={banner}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-surface" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
                  </div>
                  {/* Content */}
                  <div className="relative z-10 p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-medium">{c.niche}</span>
                      <span className="text-xs text-white/70 flex items-center gap-1"><Users size={10} /> {c.memberCount}</span>
                    </div>
                    <div className="flex-1" />
                    <h4 className="font-bold text-white line-clamp-1 drop-shadow">{c.name}</h4>
                    <p className="text-xs text-white/65 mt-1 line-clamp-2">{c.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {joined.length === 0 && (!dashboardData?.followingCommunities || dashboardData.followingCommunities.length === 0) && (
        <div className="text-center py-16 text-textSecondary">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No activity yet</p>
          <Link to="/communities" className="btn-primary inline-block mt-4">Browse Communities</Link>
        </div>
      )}
    </div>
  );
}
