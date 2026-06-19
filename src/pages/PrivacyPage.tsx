import { ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-textSecondary hover:text-textPrimary transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
          <Lock size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Privacy Policy</h1>
          <p className="text-textSecondary text-sm mt-0.5">Last updated: June 2026</p>
        </div>
      </div>

      <div className="space-y-6">
        <Section title="1. Data Collection">
          We collect information you provide directly — username, email, and profile information. We also collect usage data such as pages visited, links clicked, and community interactions to improve the platform experience.
        </Section>

        <Section title="2. Data Usage">
          Your data is used to provide and improve our services, personalize your experience, communicate updates, and ensure platform security. We never sell your personal data to third parties.
        </Section>

        <Section title="3. Data Storage & Security">
          All data is stored securely with industry-standard encryption. Passwords are hashed using PBKDF2 with 100,000 iterations. We implement HTTPS encryption for all data transmission.
        </Section>

        <Section title="4. Cookies & Tokens">
          We use JWT tokens stored in localStorage for authentication. No third-party tracking cookies are used on this platform.
        </Section>

        <Section title="5. Your Rights">
          You have the right to access, modify, or delete your personal data at any time through your profile and account settings. You may request a complete data export by contacting support.
        </Section>

        <div className="pt-4 border-t border-border">
          <p className="text-textSecondary text-xs">
            © {new Date().getFullYear()} Full Summpot — All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-3">
      <h2 className="text-base font-bold text-textPrimary">{title}</h2>
      <p className="text-textSecondary text-sm leading-relaxed">{children}</p>
    </div>
  );
}
