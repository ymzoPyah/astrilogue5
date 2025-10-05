import React, { useMemo } from 'react';
import { CharacterMap, Vote } from '../../../types';
import { tallyVotes, leadingCandidate } from '../../../services/tally';

interface LiveVoteTallyProps {
  revealedVotes: Vote[];
  totalVotes: number;
  characterMap: CharacterMap;
  isFinalVote?: boolean;
  jurySize?: number;
}

export const LiveVoteTally: React.FC<LiveVoteTallyProps> = ({ revealedVotes, totalVotes, characterMap, isFinalVote, jurySize }) => {
  const counts = useMemo(() => tallyVotes(revealedVotes), [revealedVotes]);
  const lead = useMemo(() => leadingCandidate(counts), [counts]);

  const bars = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const remaining = Math.max(0, totalVotes - revealedVotes.length);
  const votesNeededToWin = isFinalVote && jurySize ? Math.floor(jurySize / 2) + 1 : null;

  return (
    <section aria-label="Live vote tally" className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0b18]/70 p-4 shadow-[0_0_40px_rgba(80,120,255,0.15)] backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80">Live Tally</h3>
        <div className="text-xs text-white/50">Remaining: {remaining}</div>
      </div>
      {votesNeededToWin && (
        <div className="mb-3 text-center text-xs font-bold text-yellow-300 bg-yellow-500/10 p-1 rounded">
          {votesNeededToWin} VOTES NEEDED TO WIN
        </div>
      )}
      <div className="space-y-2">
        {bars.map(([id, count]) => {
          const meta = characterMap.get(id);
          const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
          const isLead = lead?.id === id;
          const hasWon = votesNeededToWin && count >= votesNeededToWin;
          return (
            <div key={id} className="grid grid-cols-[1fr_auto] items-center gap-2">
              <div className="truncate text-sm text-white/80">{meta?.name ?? id}</div>
              <div className="text-xs tabular-nums text-white/60">{count}</div>
              <div className="col-span-2 h-2.5 overflow-hidden rounded-full border border-white/10">
                <div className="h-full" style={{ width: `${pct}%`, background: meta?.color ?? '#22d3ee', transition: 'width 420ms ease' }} aria-hidden />
              </div>
              {hasWon && <div className="col-span-2 text-sm font-bold text-yellow-300 animate-[glow_2s_ease-in-out_infinite]">WINNER!</div>}
              {!hasWon && isLead && <div className="col-span-2 text-[11px] text-emerald-300/80">Front-runner</div>}
            </div>
          );
        })}
        {bars.length === 0 && (
          <div className="text-sm text-white/50">No votes revealed yet.</div>
        )}
      </div>
    </section>
  );
};

export default LiveVoteTally;