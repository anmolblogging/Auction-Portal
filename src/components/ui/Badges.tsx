import { ROLE_COLORS } from '@/lib/data';

interface RBadgeProps { role: string }
interface TBadgeProps { tier: string }

const TIER_COLORS: Record<string, string> = {
  Elite: '#F59E0B', Platinum: '#8B8FA8', Gold: '#EAB308', Silver: '#6B7280',
  'Tier 1': '#F59E0B', 'Tier 2': '#4F8EF7', 'Tier 3': '#00DC72', 'Tier 4': '#8B8FA8', 'Tier 5': '#6B7280',
};

export function RBadge({ role }: RBadgeProps) {
  const c = ROLE_COLORS[role] || '#888';
  return (
    <span className="tag" style={{ background: c + '22', color: c, border: `1px solid ${c}44` }}>
      {role}
    </span>
  );
}

export function TBadge({ tier }: TBadgeProps) {
  const c = TIER_COLORS[tier] || '#888';
  return (
    <span className="tag" style={{ background: c + '22', color: c, border: `1px solid ${c}44`, fontSize: 10 }}>
      {tier}
    </span>
  );
}
