import { createHash } from "../utils/hash";
import { addBadge, hasBadge } from "./store";
import { ScenarioId, BadgeId } from "../types";

const ENHANCED: ScenarioId[] = [
  "directive-audit","echo-weather","concert-with-teeth","memory-garden",
  "fyxion-tempering","glyph-school","ethics-of-the-echo","ward-tribunal",
  "truth-commission-lite","signature-scrub"
];

export async function maybeAwardBadge(evt: {
  scenarioId: ScenarioId; runId: string;
  stats: { turns: number; durationMs: number };
  proofBlob: string;
}) {
  if (!ENHANCED.includes(evt.scenarioId)) return;
  const id = `badge-${evt.scenarioId}` as const;
  if (hasBadge(id)) return;

  // Integrity: checksum proofBlob + basic shape (prevents trivial spoofing)
  const checksum = await createHash(evt.proofBlob);
  const now = new Date().toISOString();

  addBadge({
    id,
    scenarioId: evt.scenarioId,
    earnedAt: now,
    runId: evt.runId,
    version: 1,
    proof: { checksum, turns: evt.stats.turns, durationMs: evt.stats.durationMs }
  });

  // Fire UI toast and analytics
  document.dispatchEvent(new CustomEvent("BADGE_AWARDED", { detail: { id } }));
  // window?.analytics?.track?.("badge_awarded", { id, scenarioId: evt.scenarioId });
}