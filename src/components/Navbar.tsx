import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User, Home, Users, Play, Trophy, MessageCircle, Shield, Flame } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { clsx } from 'clsx';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getAssetUrl } from '../lib/utils';
import type { Notification } from '../types';

const navItems = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/communities', label: 'Communities', icon: Users },
  { to: '/my-links', label: 'My Links', icon: Play },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/weekly-support', label: 'Support', icon: Flame },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    refetchInterval: 30000, // 30s fallback (SignalR pushes live updates)
    enabled: !!user,
  });

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getUserProfile(),
    enabled: !!user,
  });

  const { data: unreadData } = useQuery({
    queryKey: ['unreadMessages'],
    queryFn: () => api.getUnreadMessageCount(),
    refetchInterval: 30000, // 30s fallback (SignalR pushes live updates)
    enabled: !!user,
  });

  const displayUser = profileData ?? user;
  const avatar = getAssetUrl(displayUser?.avatarUrl);
  const unreadCount = notifications?.filter((n: Notification) => !n.isRead).length ?? 0;
  const isAdmin = user?.role === 'ADMIN';

  const handleLogoutConfirm = () => {
    logout();
    qc.clear();
    setShowLogoutModal(false);
    navigate('/login', { replace: true });
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Full Sumppot" className="h-10 w-10 rounded-full object-cover" />
            <span className="text-lg sm:text-xl font-black tracking-tight">
              <span className="text-primary">Full</span>
              <span className="text-textPrimary"> Sumppot</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname.startsWith(to)
                    ? 'bg-surfaceHover text-textPrimary'
                    : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceHover'
                )}
              >
                <Icon size={16} />
                {label}
                {to === '/messages' && (unreadData?.total ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                    {unreadData!.total > 9 ? '9+' : unreadData!.total}
                  </span>
                )}
              </Link>
            ))}
            {/* Admin tab — only visible to admins */}
            {isAdmin && (
              <Link
                to="/admin"
                className={clsx(
                  'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname.startsWith('/admin')
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'text-primary/70 hover:text-primary hover:bg-primary/10'
                )}
              >
                <Shield size={16} />
                Admin
              </Link>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              className="relative p-2 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surfaceHover transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-surface">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surfaceHover transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt={displayUser?.username} className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-primary" />
                )}
              </div>
              <span className="text-sm font-medium text-textPrimary hidden sm:block">{displayUser?.username}</span>
            </Link>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="flex p-2 rounded-lg text-textSecondary hover:text-primary hover:bg-surfaceHover transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur border-t border-border flex justify-around items-center h-16 px-1 shadow-2xl bottom-nav-safe">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={clsx(
                'relative flex flex-col items-center justify-center flex-1 py-2 text-[10px] font-semibold transition-colors min-h-[44px] touch-manipulation',
                location.pathname.startsWith(to)
                  ? 'text-primary font-bold'
                  : 'text-textSecondary hover:text-textPrimary'
              )}
            >
              <Icon size={20} className="mb-0.5" />
              <span className="leading-none">{label}</span>
              {to === '/messages' && (unreadData?.total ?? 0) > 0 && (
                <span className="absolute top-1 right-[20%] w-4 h-4 bg-primary text-white text-[8px] font-bold flex items-center justify-center rounded-full">
                  {unreadData!.total > 9 ? '9+' : unreadData!.total}
                </span>
              )}
            </Link>
          ))}
          {/* Profile tab */}
          <Link
            to="/profile"
            className={clsx(
              'relative flex flex-col items-center justify-center flex-1 py-2 text-[10px] font-semibold transition-colors min-h-[44px] touch-manipulation',
              location.pathname.startsWith('/profile')
                ? 'text-primary font-bold'
                : 'text-textSecondary hover:text-textPrimary'
            )}
          >
            <div className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center overflow-hidden mb-0.5 border',
              location.pathname.startsWith('/profile')
                ? 'border-primary'
                : 'border-border'
            )}>
              {avatar ? (
                <img src={avatar} alt={displayUser?.username} className="w-full h-full object-cover" />
              ) : (
                <User size={14} className={location.pathname.startsWith('/profile') ? 'text-primary' : 'text-textSecondary'} />
              )}
            </div>
            <span className="leading-none">Profile</span>
          </Link>
          {/* Admin tab — mobile, only for admins */}
          {isAdmin && (
            <Link
              to="/admin"
              className={clsx(
                'relative flex flex-col items-center justify-center flex-1 py-2 text-[10px] font-semibold transition-colors min-h-[44px] touch-manipulation',
                location.pathname.startsWith('/admin')
                  ? 'text-primary font-bold'
                  : 'text-primary/60 hover:text-primary'
              )}
            >
              <Shield size={20} className="mb-0.5" />
              <span className="leading-none">Admin</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
              <LogOut size={22} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold text-textPrimary text-center mb-1">
              Logout
            </h3>
            <p className="text-textSecondary text-sm text-center mb-6">
              Are you sure you want to logout from your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-textSecondary hover:text-textPrimary hover:bg-surfaceHover transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
