import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Play, TrendingUp, Star, Zap } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
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

  const joined = communities?.filter((c) => c.isMember) ?? [];
  const suggested = communities?.filter((c) => !c.isMember).slice(0, 4) ?? [];

  return (
    <div className="space-y-8">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-surface to-surface border border-border p-8">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <h2 className="text-3xl font-black text-textPrimary mb-1">
          Hey, {user?.username} 👋
        </h2>
        <p className="text-textSecondary">
          Ready to grow your channel? Here&apos;s your daily overview.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
            {user?.contentNiche || user?.niche}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Available Points" value={dashboardData?.availablePoints ?? user?.availablePoints ?? 0} icon={Star} color="bg-yellow-500/10 text-yellow-400" />
        <StatCard label="Points Earned Today" value={0} icon={Zap} color="bg-primary/10 text-primary" />
        <StatCard label="Views Given Today" value={0} icon={Play} color="bg-green-500/10 text-green-400" />
        <StatCard label="Communities Joined" value={joined.length} icon={Users} color="bg-blue-500/10 text-blue-400" />
      </div>

      {/* My communities */}
      {joined.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <Users size={18} className="text-primary" /> My Communities
            </h3>
            <Link to="/communities" className="text-sm text-textSecondary hover:text-primary transition-colors">View all →</Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {joined.map((c) => (
              <Link key={c.communityId} to={`/communities/${c.communityId}`} className="card hover:border-primary/40 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{c.niche}</span>
                  <span className="text-xs text-textSecondary flex items-center gap-1"><Users size={12} /> {c.memberCount}</span>
                </div>
                <h4 className="font-semibold text-textPrimary group-hover:text-primary transition-colors">{c.name}</h4>
                <p className="text-xs text-textSecondary mt-1 line-clamp-2">{c.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Discover */}
      {suggested.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-textPrimary flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" /> Discover Communities
            </h3>
            <Link to="/communities" className="text-sm text-textSecondary hover:text-primary transition-colors">Browse all →</Link>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {suggested.map((c) => (
              <Link key={c.communityId} to={`/communities/${c.communityId}`} className="card hover:border-primary/40 transition-colors group">
                <span className="px-2 py-0.5 rounded-full bg-surfaceHover text-textSecondary text-xs font-medium">{c.niche}</span>
                <h4 className="font-semibold text-textPrimary mt-2 group-hover:text-primary transition-colors">{c.name}</h4>
                <p className="text-xs text-textSecondary mt-1 line-clamp-2">{c.description}</p>
                <div className="flex items-center gap-1 mt-3 text-xs text-textSecondary"><Users size={12} /> {c.memberCount} members</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {joined.length === 0 && suggested.length === 0 && (
        <div className="text-center py-16 text-textSecondary">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No communities yet</p>
          <Link to="/communities" className="btn-primary inline-block mt-4">Browse Communities</Link>
        </div>
      )}
    </div>
  );
}
