import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';

export default function GuidelinesPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-textSecondary hover:text-textPrimary transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
          <Users size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-textPrimary">Community Guidelines</h1>
          <p className="text-textSecondary text-sm mt-0.5">Last updated: June 2026</p>
        </div>
      </div>

      <div className="space-y-6">
        <Section title="1. Be Respectful">
          Treat all community members with respect. Constructive criticism is welcome; personal attacks are not. Foster an environment where creators feel safe to share and grow.
        </Section>

        <Section title="2. Authentic Engagement">
          Only verify support for content you have genuinely engaged with. Fake clicks, bot activity, and engagement farming are strictly prohibited and will result in account suspension.
        </Section>

        <Section title="3. Quality Content">
          Share links to genuine, original content. Spam, clickbait, and misleading titles are not allowed. Community administrators may remove content that violates community-specific rules.
        </Section>

        <Section title="4. No Self-Promotion Abuse">
          While the platform encourages cross-promotion, excessive or irrelevant self-promotion outside designated areas is discouraged. Respect each community's rules regarding promotion.
        </Section>

        <Section title="5. Report Violations">
          If you encounter content or behavior that violates these guidelines, please report it through the platform. We review all reports and take appropriate action.
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
