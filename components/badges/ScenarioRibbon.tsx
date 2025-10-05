import React from 'react';
import { hasBadge } from '../../badges/store';
import { BadgeId } from '../../types';

interface ScenarioRibbonProps {
    badgeId: BadgeId;
}

export const ScenarioRibbon: React.FC<ScenarioRibbonProps> = ({ badgeId }) => {
  const owned = hasBadge(badgeId);
  if (!owned) return null;
  
  return (
    <div className="absolute top-2 right-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 text-xs font-medium text-emerald-200 backdrop-blur z-10">
      ✓ Earned
    </div>
  );
};

export default ScenarioRibbon;