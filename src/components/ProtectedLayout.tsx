import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Navbar from './Navbar';
import { useEffect, useState } from 'react';

export default function ProtectedLayout() {
  const { isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    // If not yet hydrated, subscribe and wait for it
    if (useAuthStore.persist.hasHydrated()) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    return () => unsub();
  }, []);

  if (!isHydrated) {
    return null; // or a loading spinner
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>
    </div>
  );
}
