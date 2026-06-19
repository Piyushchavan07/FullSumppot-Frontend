import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Loader2, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { useResendCooldown } from '../hooks/useResendCooldown';

export default function AccountContactsCard() {
  const qc = useQueryClient();
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['account-contacts'],
    queryFn: () => api.getAccountContacts(),
  });

  const [addEmailOpen, setAddEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const emailCooldown = useResendCooldown();

  const refresh = () => qc.invalidateQueries({ queryKey: ['account-contacts'] });

  const requestEmailMut = useMutation({
    mutationFn: () => api.addAccountEmail(newEmail.trim()),
    onSuccess: (res) => {
      emailCooldown.start(res.resendCooldownSeconds ?? 60);
      if (res.devOtp) toast.info(`DEV: OTP is ${res.devOtp}`, { duration: 30000 });
      else toast.success('Code sent to your new email');
      setAddEmailOpen(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const verifyEmailMut = useMutation({
    mutationFn: () => api.verifyAccountEmail(newEmail.trim(), emailOtp),
    onSuccess: () => {
      toast.success('Email added!');
      setNewEmail('');
      setEmailOtp('');
      setAddEmailOpen(false);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });



  if (isLoading) {
    return (
      <div className="card flex justify-center py-8">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-primary" />
        <h4 className="text-sm font-semibold text-textPrimary">Account Center</h4>
      </div>
      <p className="text-xs text-textSecondary">{contacts?.recoveryHint}</p>

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-textSecondary font-semibold">Emails</p>
        {contacts?.emails.map((e) => (
          <div key={e.email} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface/50 border border-border/50">
            <div className="flex items-center gap-2 min-w-0">
              <Mail size={14} className="text-primary shrink-0" />
              <span className="text-sm text-textPrimary truncate">{e.masked}</span>
              {e.isPrimary && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Primary</span>
              )}
            </div>
            {e.isVerified ? (
              <CheckCircle size={14} className="text-green-500 shrink-0" />
            ) : (
              <span className="text-[10px] text-textSecondary">Pending</span>
            )}
          </div>
        ))}
      </div>



      {/* Add secondary email */}
      {!addEmailOpen ? (
        <div className="flex gap-2">
          <input
            type="email"
            className="input-field flex-1 text-sm"
            placeholder="Add backup email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button
            type="button"
            disabled={!newEmail.trim() || requestEmailMut.isPending}
            onClick={() => requestEmailMut.mutate()}
            className="btn-secondary text-sm px-3 shrink-0"
          >
            {requestEmailMut.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
          </button>
        </div>
      ) : (
        <div className="space-y-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <p className="text-xs text-textSecondary">Enter the code sent to {newEmail}</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="input-field text-center tracking-[0.4em] font-bold"
            placeholder="000000"
            value={emailOtp}
            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <button
            type="button"
            disabled={emailOtp.length !== 6 || verifyEmailMut.isPending}
            onClick={() => verifyEmailMut.mutate()}
            className="btn-primary w-full text-sm"
          >
            {verifyEmailMut.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Verify email'}
          </button>
        </div>
      )}


    </div>
  );
}
