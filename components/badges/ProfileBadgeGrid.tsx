import React, { useState } from 'react';
import { BADGE_CATALOG } from '../../badges/catalog';
import { loadBadgeStore } from '../../badges/store';
import { BadgeMeta } from '../../types';

const ProfileBadgeGrid: React.FC = () => {
  const [hoveredBadge, setHoveredBadge] = useState<BadgeMeta | null>(null);
  const earned = loadBadgeStore().earned.map(e => e.id);
  
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {BADGE_CATALOG.map(b => {
          const got = earned.includes(b.id);
          const glowColor = b.palette?.glow || b.palette?.primary || '#a27bff';
          return (
            <div 
              key={b.id} 
              className={`relative overflow-hidden border rounded-lg transition-all duration-300 group ${got ? 'border-emerald-400/40 bg-white/5' : 'border-zinc-800 bg-black/20'}`}
              style={got ? {boxShadow: `0 0 24px rgba(162,123,255,0.2), 0 0 10px ${glowColor}33`} : {}}
              onMouseEnter={() => got && setHoveredBadge(b)}
              onMouseLeave={() => setHoveredBadge(null)}
            >
              {got && <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 transition-opacity"></div>}
              <div className="p-4 flex flex-col items-center">
                <div className={`aspect-square w-full rounded-xl bg-black/30 grid place-items-center`}>
                  <img src={b.iconUrl} alt={b.title}
                       className={`w-3/4 h-3/4 object-contain transition-all duration-300 ${got ? 'group-hover:scale-110' : 'opacity-25 grayscale'}`} />
                </div>
                <div className="mt-3 text-center">
                  <div className="text-sm font-semibold">{b.title}</div>
                  <div className="text-xs text-zinc-400">{b.description}</div>
                </div>
              </div>

              {hoveredBadge?.id === b.id && b.sceneUrl && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-900/90 border border-purple-400/30 rounded-lg shadow-2xl z-20 pointer-events-none animate-[fadeIn_0.2s]">
                    <img src={b.sceneUrl} alt={`${b.title} scene`} className="w-full rounded" />
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <p className="absolute bottom-2 left-2 right-2 text-xs font-bold text-white text-shadow">{b.title} Landscape</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
        }
        .shimmer-effect {
            background: linear-gradient(to right, transparent 20%, rgba(255,255,255,0.1) 50%, transparent 80%);
            background-size: 2000px 100%;
            animation: shimmer 3s infinite linear;
        }
        .text-shadow {
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }
      `}</style>
    </>
  );
}

export default ProfileBadgeGrid;