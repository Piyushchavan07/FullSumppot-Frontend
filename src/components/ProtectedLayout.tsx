import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Navbar from './Navbar';
import Footer from './Footer';
import { useEffect, useState } from 'react';

export default function ProtectedLayout() {
  const { isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    return () => unsub();
  }, []);

  if (!isHydrated) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 pb-24 md:pb-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
