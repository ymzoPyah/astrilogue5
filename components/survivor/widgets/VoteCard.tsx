import React from 'react';
import { CharacterMap, Vote } from '../../../types';

interface VoteCardProps {
  vote: Vote;
  characterMap: CharacterMap;
  delayMs?: number;
}

export const VoteCard: React.FC<VoteCardProps> = ({ vote, characterMap, delayMs = 0 }) => {
  const voter = characterMap.get(vote.voterId);
  const target = characterMap.get(vote.targetId);

  return (
    <div
      className="vote-card group/card relative w-full max-w-sm origin-center rounded-2xl border border-white/10 bg-[#0f1022]/70 p-4 shadow-[0_0_40px_rgba(120,80,255,0.15)] backdrop-blur-md will-change-transform"
      style={{ animation: `cardFlip 720ms ease both`, animationDelay: `${delayMs}ms` }}
      aria-label={`Vote from ${voter?.name ?? 'Unknown'} for ${target?.name ?? 'Unknown'}`}
    >
      <div className="flex items-center gap-3">
        <img src={voter?.avatarUrl} alt="" loading="lazy" decoding="async" className="h-10 w-10 rounded-xl object-cover" />
        <div className="min-w-0">
          <div className="text-sm text-white/70">{voter?.name ?? vote.voterId}</div>
          <div className="text-xs text-white/40">casts a vote for</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg" style={{ background: target?.color ?? '#8b5cf6' }} aria-hidden />
        <div className="truncate text-lg font-semibold text-white">{target?.name ?? vote.targetId}</div>
      </div>
      {vote.reasoning && (
        <details className="mt-3 group/details">
          <summary className="cursor-pointer text-xs text-white/60 list-none flex items-center gap-1 group-hover/details:text-white transition-colors">
            <span>View Reasoning</span>
            <svg className="w-3 h-3 transition-transform group-open/details:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </summary>
          <blockquote className="mt-2 text-sm italic border-l-2 border-purple-400/50 pl-3 py-1 bg-black/20 rounded-r-md text-white/80">
            "{vote.reasoning}"
          </blockquote>
        </details>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover/card:opacity-100" style={{
        background: 'radial-gradient(60% 40% at 50% 0%, rgba(160,120,255,0.18), transparent 70%)',
        transition: 'opacity 180ms ease'
      }} />
    </div>
  );
};

export default VoteCard;