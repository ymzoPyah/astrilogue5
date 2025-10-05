import React, { useMemo } from 'react';
import { VoteRevealProps, Vote, CharacterMap } from '../../types';
import { useVoteReveal } from '../../hooks/useVoteReveal';
import VoteCard from './widgets/VoteCard';
import LiveVoteTally from './widgets/LiveVoteTally';
import { tallyVotes, leadingCandidate } from '../../services/tally';

const VoteReveal: React.FC<VoteRevealProps> = (props) => {
  const {
    votes,
    index,
    characterMap,
    speed,
    isPaused,
    onAdvance,
    onComplete,
    revealIntervalMs = 2000,
    autoPlay = true,
  } = props;

  useVoteReveal({ total: votes.length, index, onAdvance, onComplete, isPaused, speed, revealIntervalMs, autoPlay });

  const revealed: Vote[] = useMemo(() => votes.slice(0, Math.max(0, index + 1)), [votes, index]);
  const counts = useMemo(() => tallyVotes(revealed), [revealed]);
  const lead = useMemo(() => leadingCandidate(counts), [counts]);
  const isFinal = index >= votes.length - 1 && votes.length > 0;
  
  const eliminatedCharacter = isFinal && lead ? characterMap.get(lead.id) : null;

  return (
    <section aria-label="Vote reveal" className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 p-4 md:grid-cols-[1.7fr_.9fr]">
      {/* Card stack */}
      <div>
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white/90">Vote Reveal</h2>
          <div className="text-xs text-white/60">
            {Math.min(index + 1, votes.length)}/{votes.length}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {revealed.map((vote, i) => (
            <VoteCard key={`${vote.voterId}-${i}`} vote={vote} characterMap={characterMap} delayMs={i * 120} />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => onAdvance(Math.max(0, index - 1))}
            aria-label="Reveal previous vote"
            disabled={index <= 0}
          >Prev</button>
          <button
            className="btn btn-primary"
            onClick={() => onAdvance(Math.min(votes.length - 1, index + 1))}
            aria-label="Reveal next vote"
            disabled={index >= votes.length - 1}
          >Reveal Next</button>
          <button
            className="btn-ghost"
            onClick={() => onAdvance(votes.length - 1)}
            aria-label="Skip to final reveal"
            disabled={isFinal}
          >Skip</button>
          <div className="ml-auto text-xs text-white/50">Hotkeys: ←/→, Enter, Space (pause), S (skip)</div>
        </div>

        {eliminatedCharacter && (
          <div role="status" className="mt-4 rounded-xl border border-white/10 bg-[#0c0d20]/80 p-4 text-white/80">
            <div className="text-sm">Eliminated:</div>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg" style={{ background: eliminatedCharacter.color ?? '#f43f5e' }} aria-hidden />
              <div className="text-lg font-semibold">{eliminatedCharacter.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tally side */}
      <aside>
        <LiveVoteTally revealedVotes={revealed} totalVotes={votes.length} characterMap={characterMap} />
        <div className="mt-4 rounded-xl border border-white/10 bg-[#090a18]/70 p-3 text-xs text-white/50">
          <div className="font-medium text-white/70">Hints</div>
          <ul className="mt-2 list-disc pl-4">
            <li>Use <kbd className="rounded bg-white/10 px-1">→</kbd> to step reveals.</li>
            <li><kbd className="rounded bg-white/10 px-1">Space</kbd> toggles pause.</li>
            <li><kbd className="rounded bg-white/10 px-1">S</kbd> jumps to the final tally.</li>
          </ul>
        </div>
      </aside>
    </section>
  );
};

export default VoteReveal;
