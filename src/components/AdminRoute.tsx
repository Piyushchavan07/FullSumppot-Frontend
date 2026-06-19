import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Wraps a route so only ADMIN users can access it.
 * Regular users are silently redirected to /dashboard.
 * The backend also enforces this — this is just UX protection.
 */
export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
