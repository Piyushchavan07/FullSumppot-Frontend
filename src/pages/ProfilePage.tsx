import { useQuery } from '@tanstack/react-query';
import { User, Star, Zap, Play } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const { user } = useAuthStore();

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard(),
  });

  const displayUser = dashboardData ?? user;

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-2xl font-bold text-textPrimary">Profile</h2>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <User size={32} className="text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-textPrimary">{displayUser?.username}</h3>
            <p className="text-textSecondary text-sm">{displayUser?.email}</p>
            <span className="mt-1 inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {displayUser?.contentNiche || displayUser?.niche}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1"><Star size={16} /></div>
            <p className="text-xl font-bold text-textPrimary">{dashboardData?.availablePoints ?? displayUser?.availablePoints ?? 0}</p>
            <p className="text-xs text-textSecondary">Available Points</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1"><Zap size={16} /></div>
            <p className="text-xl font-bold text-textPrimary">0</p>
            <p className="text-xs text-textSecondary">Earned Today</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-400 mb-1"><Play size={16} /></div>
            <p className="text-xl font-bold text-textPrimary">0</p>
            <p className="text-xs text-textSecondary">Views Given Today</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h4 className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-3">Account Info</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-textSecondary text-sm">Username</span>
            <span className="text-textPrimary font-medium">{displayUser?.username}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-textSecondary text-sm">Email</span>
            <span className="text-textPrimary font-medium">{displayUser?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-textSecondary text-sm">Niche</span>
            <span className="text-textPrimary font-medium">{displayUser?.contentNiche || displayUser?.niche}</span>
          </div>
          {displayUser?.createdAt && (
            <div className="flex items-center justify-between">
              <span className="text-textSecondary text-sm">Joined</span>
              <span className="text-textPrimary font-medium">{new Date(displayUser.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
