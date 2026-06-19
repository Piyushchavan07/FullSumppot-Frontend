import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="hidden md:block border-t border-border bg-surface/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Full Sumppot" className="w-8 h-8 rounded-full object-cover" />
              <span className="font-black tracking-tight">
                <span className="text-primary">Full</span>
                <span className="text-textPrimary"> Summpot</span>
              </span>
            </div>
            <p className="text-textSecondary text-sm leading-relaxed">
              The ultimate creator support platform. Grow your channel through community-powered cross-promotion.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-textPrimary font-semibold text-sm mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/communities', label: 'Communities' },
                { to: '/leaderboard',  label: 'Leaderboard' },
                { to: '/weekly-support', label: 'Support Board' },
                { to: '/my-links',     label: 'My Links' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-textSecondary hover:text-primary text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-textPrimary font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/terms',       label: 'Terms of Service' },
                { to: '/privacy',     label: 'Privacy Policy' },
                { to: '/guidelines',  label: 'Community Guidelines' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-textSecondary hover:text-primary text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-textPrimary font-semibold text-sm mb-4">Account</h4>
            <ul className="space-y-2.5">
              {[
                { to: '/profile',       label: 'Settings' },
                { to: '/notifications', label: 'Notifications' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-textSecondary hover:text-primary text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-textSecondary text-xs">
            © {new Date().getFullYear()} Full Summpot — All rights reserved.
          </p>
          <p className="text-textSecondary text-xs flex items-center gap-1.5">
            Built with <Heart size={11} className="text-primary fill-primary" /> for creators worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
