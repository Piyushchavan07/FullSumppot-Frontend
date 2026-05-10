import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User, Home, Users, Play, Trophy, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { clsx } from 'clsx';

const navItems = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/communities', label: 'Communities', icon: Users },
  { to: '/my-links', label: 'My Links', icon: Play },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="Full Sumppot" className="h-10 w-10 rounded-full object-cover" />
          <span className="text-xl font-black tracking-tight hidden sm:block">
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
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                location.pathname.startsWith(to)
                  ? 'bg-surfaceHover text-textPrimary'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceHover'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <Link
            to="/notifications"
            className="relative p-2 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surfaceHover transition-colors"
          >
            <Bell size={18} />
          </Link>

          <Link
            to="/profile"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surfaceHover transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User size={14} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-textPrimary">{user?.username}</span>
          </Link>

          <button
            onClick={handleLogout}
            className="hidden md:flex p-2 rounded-lg text-textSecondary hover:text-primary hover:bg-surfaceHover transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-textSecondary hover:bg-surfaceHover transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-3 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname.startsWith(to)
                  ? 'bg-surfaceHover text-textPrimary'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-surfaceHover'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-textSecondary hover:text-primary hover:bg-surfaceHover transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
