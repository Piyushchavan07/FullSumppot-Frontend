import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { api, setAuthToken } from '../services/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const loginRes = await api.login(data.email, data.password);

      // Backend returns needsVerification if account not yet verified
      if (loginRes.needsVerification) {
        toast.info('Please verify your email first.');
        navigate('/register', {
          state: {
            email: loginRes.email || data.email,
            phoneNumber: loginRes.phoneNumber || null,
            maskedContact: loginRes.maskedContact,
            step: 'verify',
          },
        });
        return;
      }

      const token = loginRes.token;
      setAuthToken(token);
      const dashboard = await api.dashboard();
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
          role: (dashboard.role as 'USER' | 'ADMIN') ?? 'USER',
        },
        token
      );
      toast.success(`Welcome back, ${dashboard.username || 'User'}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      setAuthToken(null);
      const message = err instanceof Error ? err.message : 'Invalid credentials';

      // Detect unverified account from error message
      if (message.toLowerCase().includes('not verified') || message.toLowerCase().includes('verify')) {
        toast.info('Please verify your account first.');
        navigate('/register', { state: { email: data.email, step: 'verify_choice' } });
        return;
      }

      // Detect unregistered account
      if (message.toLowerCase().includes('does not exist')) {
        toast.error('Account does not exist. Redirecting to registration...');
        setTimeout(() => {
          navigate('/register', { state: { email: data.email } });
        }, 1500);
        return;
      }

      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <img src="/logo.png" alt="Full Sumppot" className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mx-auto mb-3 ring-2 ring-primary/30" />
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            <span className="text-primary">Full</span>
            <span className="text-textPrimary"> Sumppot</span>
          </h1>
          <p className="text-textSecondary text-sm">Your YouTube community growth platform</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-textPrimary mb-5">Sign In</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-primary text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-primary text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-textSecondary hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
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
            <Link to="/register" className="text-primary hover:underline font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
