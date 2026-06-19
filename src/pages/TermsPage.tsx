import { ArrowLeft, ScrollText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-textSecondary hover:text-textPrimary transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
          <ScrollText size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Terms of Service</h1>
          <p className="text-textSecondary text-sm mt-0.5">Last updated: June 2026</p>
        </div>
      </div>

      <div className="space-y-6">
        <Section title="1. Acceptance of Terms">
          By accessing or using Full Summpot, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you disagree with any part of these terms, you may not use our platform.
        </Section>

        <Section title="2. User Accounts">
          You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete information during registration. You must not create multiple accounts for deceptive purposes.
        </Section>

        <Section title="3. Community Guidelines">
          Users must respect other community members. Harassment, spam, hate speech, and illegal content are strictly prohibited. Community administrators have the right to moderate content within their communities.
        </Section>

        <Section title="4. Content Ownership">
          You retain ownership of content you post. By submitting content, you grant Full Summpot a non-exclusive, worldwide license to display, distribute, and promote your content on the platform.
        </Section>

        <Section title="5. Link Sharing & Support">
          Links shared must be legitimate and not contain malware, phishing, or illegal content. The support verification system tracks genuine engagement. Artificial inflation of clicks or support metrics is prohibited.
        </Section>

        <Section title="6. Account Termination">
          We reserve the right to suspend or terminate accounts that violate these terms. Users may delete their accounts at any time through the account settings page.
        </Section>

        <div className="pt-4 border-t border-border">
          <p className="text-textSecondary text-xs">
            © {new Date().getFullYear()} Full Summpot — All Rights Reserved. Full Summpot is a registered trademark. All content, design, and intellectual property on this platform are protected under applicable copyright and trademark laws. Unauthorized reproduction or distribution is prohibited.
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
