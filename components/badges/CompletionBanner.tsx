import React from 'react';
import { BADGE_CATALOG } from '../../badges/catalog';
import { BadgeId } from '../../types';

interface CompletionBannerProps {
    badgeId: BadgeId;
}

export const CompletionBanner: React.FC<CompletionBannerProps> = ({ badgeId }) => {
  const meta = BADGE_CATALOG.find(b => b.id === badgeId);
  if (!meta) return null;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/25 p-4 bg-emerald-500/10 animate-[fadeIn_0.5s_ease-out]">
      <img src={meta.iconUrl} className="w-16 h-16 rounded-xl" alt={meta.title} />
      <div className="flex-1">
        <div className="text-lg font-semibold text-white">Badge Unlocked — {meta.title}</div>
        <div className="text-sm text-zinc-400">{meta.description}</div>
      </div>
    </div>
  );
};

export default CompletionBanner;