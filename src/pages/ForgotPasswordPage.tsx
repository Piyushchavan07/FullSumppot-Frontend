import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useResendCooldown } from '../hooks/useResendCooldown';

type Step = 'contact' | 'otp' | 'reset';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('contact');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [maskedContact, setMaskedContact] = useState('');
  const resendCooldown = useResendCooldown();

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!contact.trim()) {
      toast.error('Enter your registered email');
      return;
    }
    setLoading(true);
    try {
      const res = await api.forgotPassword(contact.trim());
      if (res.devOtp) toast.info(`DEV: OTP is ${res.devOtp}`, { duration: 30000 });
      toast.success('If that email is registered, a reset code has been sent.');
      resendCooldown.start(60);
      setMaskedContact(contact.trim());
      setStep('otp');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    setStep('reset');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(contact.trim(), otp, newPassword);
      toast.success('Password reset successfully! Please log in.');
      navigate('/login');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
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
          <p className="text-textSecondary text-sm">Reset your account password</p>
        </div>

        <div className="card">
          {/* ——— Step 1: Enter Email ——— */}
          {step === 'contact' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <KeyRound size={24} className="text-primary" />
                </div>
                <h2 className="text-xl font-bold text-textPrimary">Reset Password</h2>
                <p className="text-textSecondary text-sm mt-1">Enter your registered email to receive a reset code</p>
              </div>

              <div>
                <label className="label">Registered Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {loading ? 'Sending Code…' : 'Send Reset Code'}
              </button>

              <Link
                to="/login"
                className="block text-center text-sm text-textSecondary hover:text-textPrimary transition-colors"
              >
                ← Back to sign in
              </Link>
            </form>
          )}

          {/* ——— Step 2: Enter OTP ——— */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <Mail size={24} className="text-primary" />
                </div>
                <h2 className="text-xl font-bold text-textPrimary">Enter reset code</h2>
                <p className="text-textSecondary text-sm mt-1">We sent a 6-digit code to</p>
                <p className="text-primary font-semibold text-sm">{maskedContact || contact}</p>
              </div>

              <div>
                <label className="label">Reset Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                />
                <p className="text-[11px] text-textSecondary mt-1.5 text-center">Code expires in 15 minutes</p>
              </div>

              <button
                type="submit"
                disabled={otp.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                Continue
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => { setStep('contact'); setOtp(''); }}
                  className="text-sm text-textSecondary hover:text-textPrimary transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading || !resendCooldown.canResend}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  {loading ? 'Sending…' : resendCooldown.canResend ? 'Resend code' : `Resend in ${resendCooldown.seconds}s`}
                </button>
              </div>
            </form>
          )}

          {/* ——— Step 3: New Password ——— */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <KeyRound size={24} className="text-primary" />
                </div>
                <h2 className="text-xl font-bold text-textPrimary">Choose New Password</h2>
                <p className="text-textSecondary text-sm mt-1">Choose a strong password</p>
              </div>

              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field pr-12"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    className="input-field pr-12"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors"
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
