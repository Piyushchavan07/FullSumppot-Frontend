import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Mail, CheckCircle } from 'lucide-react';
import { api, setAuthToken } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useResendCooldown } from '../hooks/useResendCooldown';
import { toast } from 'sonner';

const niches = [
  'Gaming', 'Tech', 'Education', 'Music', 'Comedy',
  'Vlogging', 'Finance', 'Fitness', 'Food', 'Travel', 'Other',
];

const schema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  niche: z.string().min(1, 'Please select a niche'),
});

type FormData = z.infer<typeof schema>;
type Step = 'register' | 'verify';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<Step>('register');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const resendCooldown = useResendCooldown();
  const [maskedContact, setMaskedContact] = useState('');

  const locationState = location.state as { email?: string; step?: string; maskedContact?: string } | null;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: locationState?.email || '',
    }
  });

  // Handle redirect from login (unverified user) — show verify
  useEffect(() => {
    const state = location.state as { email?: string; step?: string; maskedContact?: string } | null;
    if (state?.email && (state?.step === 'verify' || state?.step === 'verify_choice' || state?.step === 'verify_legacy')) {
      setPendingEmail(state.email);
      if (state.maskedContact) setMaskedContact(state.maskedContact as string);
      setStep('verify');
    }
  }, [location.state]);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.register({
        username: data.username,
        email: data.email,
        password: data.password,
        niche: data.niche,
      });
      setPendingEmail(data.email);
      setMaskedContact(res.maskedContact || data.email);
      resendCooldown.start(res.resendCooldownSeconds ?? 60);
      setStep('verify');
      toast.success('Check your email for the verification code.');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  };

  // Masking helpers
  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const show = Math.min(2, local.length);
    return `${local.slice(0, show)}${'•'.repeat(Math.max(0, local.length - show))}@${domain}`;
  };

  // --- Email verify ---
  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit code from your email');
      return;
    }
    setVerifying(true);
    try {
      const res = await api.verifyEmail(pendingEmail, otp);
      setAuthToken(res.token);
      const dashboard = await api.dashboard();

      const userObj = {
        id: String(dashboard.userId ?? dashboard.id ?? ''),
        username: dashboard.username ?? res.username ?? 'User',
        email: pendingEmail,
        niche: dashboard.contentNiche ?? '',
        contentNiche: dashboard.contentNiche ?? '',
        availablePoints: dashboard.availablePoints ?? 0,
        createdAt: dashboard.createdAt ?? new Date().toISOString(),
        avatarUrl: dashboard.avatarUrl,
        role: (dashboard.role as 'USER' | 'ADMIN') ?? 'USER',
      };

      login(userObj, res.token);
      toast.success('Email verified successfully! 🎉');
      navigate('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid or expired code');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!resendCooldown.canResend) return;
    setResending(true);
    try {
      const res = await api.resendVerificationOtp(pendingEmail);
      resendCooldown.start(res.resendCooldownSeconds ?? 60);
      if (res.devOtp) toast.info(`DEV: OTP is ${res.devOtp}`, { duration: 30000 });
      else toast.success('New code sent to your email!');
      setOtp('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not resend code.');
    } finally {
      setResending(false);
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
          <p className="text-textSecondary text-sm">
            Join the community and grow your YouTube channel
          </p>
        </div>

        <div className="card">
          {step === 'register' && (
            <>
              <h2 className="text-xl font-bold text-textPrimary mb-5">Create Account</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Username</label>
                  <input
                    className="input-field"
                    placeholder="coolcreator"
                    autoComplete="username"
                    {...register('username')}
                  />
                  {errors.username && <p className="text-primary text-xs mt-1">{errors.username.message}</p>}
                </div>

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
                      autoComplete="new-password"
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

                <div>
                  <label className="label">Content Niche</label>
                  <select className="input-field" {...register('niche')}>
                    <option value="">Select your niche…</option>
                    {niches.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  {errors.niche && <p className="text-primary text-xs mt-1">{errors.niche.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-sm text-textSecondary mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </>
          )}

          {/* ——— Email OTP ——— */}
          {step === 'verify' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <Mail size={24} className="text-primary" />
                </div>
                <h2 className="text-xl font-bold text-textPrimary">We sent a code to your email</h2>
                <p className="text-textSecondary text-sm mt-1">
                  Enter the verification code sent to
                </p>
                <p className="text-primary font-semibold text-sm">{maskedContact || maskEmail(pendingEmail)}</p>
              </div>

              <div>
                <label className="label">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                />
                <p className="text-[11px] text-textSecondary mt-1.5 text-center">Code expires in 15 minutes</p>
              </div>

              <button
                onClick={handleVerify}
                disabled={verifying || otp.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {verifying ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Verify Email
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setStep('register')}
                  className="text-sm text-textSecondary hover:text-textPrimary transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleResend}
                  disabled={resending || !resendCooldown.canResend}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {resending ? 'Sending…' : resendCooldown.canResend ? 'Resend Code' : `Resend in ${resendCooldown.seconds}s`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
