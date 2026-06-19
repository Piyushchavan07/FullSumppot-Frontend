import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import ProtectedLayout from './components/ProtectedLayout';
import AdminRoute from './components/AdminRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityDetailPage from './pages/CommunityDetailPage';
import MyLinksPage from './pages/MyLinksPage';
import LeaderboardPage from './pages/LeaderboardPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminPage from './pages/AdminPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import GuidelinesPage from './pages/GuidelinesPage';
import WeeklySupportPage from './pages/WeeklySupportPage';
import { useSignalR } from './hooks/useSignalR';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  },
});

function SignalRProvider({ children }: { children: React.ReactNode }) {
  useSignalR();
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SignalRProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/communities" element={<CommunitiesPage />} />
              <Route path="/communities/:id" element={<CommunityDetailPage />} />
              <Route path="/my-links" element={<MyLinksPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/user/:id" element={<UserProfilePage />} />
              {/* Admin — only accessible to ADMIN role users */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              } />
              {/* Legal pages */}
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/guidelines" element={<GuidelinesPage />} />
              {/* Support system */}
              <Route path="/weekly-support" element={<WeeklySupportPage />} />
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" theme="dark" richColors />
      </SignalRProvider>
    </QueryClientProvider>
  );
}
