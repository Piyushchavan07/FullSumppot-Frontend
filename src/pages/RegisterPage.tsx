import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

const niches = [
  'Gaming', 'Tech', 'Education', 'Music', 'Comedy',
  'Vlogging', 'Finance', 'Fitness', 'Food', 'Travel', 'Other',
];

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  niche: z.string().min(1, 'Please select a niche'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
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
      await api.register(data);
      toast.success(`Welcome to Full Sumppot, ${data.username}! Please sign in.`);
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Full Sumppot" className="w-20 h-20 rounded-full object-cover mx-auto mb-3 ring-2 ring-primary/30" />
          <h1 className="text-4xl font-black tracking-tight mb-2">
            <span className="text-primary">Full</span>
            <span className="text-textPrimary"> Sumppot</span>
          </h1>
          <p className="text-textSecondary text-sm">
            Join the community and grow your YouTube channel
          </p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-textPrimary mb-6">Create Account</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                id="username"
                className="input-field"
                placeholder="coolcreator"
                {...register('username')}
              />
              {errors.username && (
                <p className="text-primary text-xs mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="label">Email</label>
              <input
                id="reg-email"
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
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="••••••••"
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

            <div>
              <label className="label">Content Niche</label>
              <select id="niche" className="input-field" {...register('niche')}>
                <option value="">Select your niche…</option>
                {niches.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              {errors.niche && (
                <p className="text-primary text-xs mt-1">{errors.niche.message}</p>
              )}
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-textSecondary mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
