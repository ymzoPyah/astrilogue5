import { CharacterID, Vote } from '../types';

export function tallyVotes(votes: Vote[]) {
  const counts = new Map<CharacterID, number>();
  for (const v of votes) {
    counts.set(v.targetId, (counts.get(v.targetId) ?? 0) + 1);
  }
  return counts;
}

export function leadingCandidate(counts: Map<CharacterID, number> | undefined) {
  if (!counts || counts.size === 0) return null;
  let lead: { id: CharacterID; count: number } | null = null;
  counts.forEach((count, id) => {
    if (!lead || count > lead.count) lead = { id, count };
  });
  return lead;
}
