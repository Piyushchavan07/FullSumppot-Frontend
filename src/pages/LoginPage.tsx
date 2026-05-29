import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { api, setAuthToken } from '../services/api';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const loginRes = await api.login(data.email, data.password);
      const token = loginRes.token;

      // Temporarily set token so the dashboard fetch is authenticated
      setAuthToken(token);
      const dashboard = await api.dashboard();

      // login() persists user + token in Zustand and localStorage
      login(
        {
          id: String(dashboard.userId ?? dashboard.id ?? ''),
          username: dashboard.username ?? loginRes.username ?? 'User',
          email: data.email,
          niche: dashboard.contentNiche ?? '',
          contentNiche: dashboard.contentNiche ?? '',
          availablePoints: dashboard.availablePoints ?? 0,
          createdAt: dashboard.createdAt ?? new Date().toISOString(),
          avatarUrl: dashboard.avatarUrl,
        },
        token
      );

      toast.success(`Welcome back, ${dashboard.username || 'User'}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      // Clear any partial token on failure
      setAuthToken(null);
      const message = err instanceof Error ? err.message : 'Invalid credentials';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Full Sumppot"
            className="w-20 h-20 rounded-full object-cover mx-auto mb-3 ring-2 ring-primary/30"
          />
          <h1 className="text-4xl font-black tracking-tight mb-2">
            <span className="text-primary">Full</span>
            <span className="text-textPrimary"> Sumppot</span>
          </h1>
          <p className="text-textSecondary text-sm">
            Your YouTube community growth platform
          </p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-textPrimary mb-6">Sign In</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-primary text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="********"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-3 flex items-center text-textSecondary hover:text-textPrimary transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-primary text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-textSecondary mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
