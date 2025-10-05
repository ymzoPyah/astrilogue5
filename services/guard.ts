export interface Usage { requests: number; tokens: number; cost: number; }
export interface Limits { maxRequests: number; maxTokens: number; maxCost: number; }
export type SkipReason = "kill_switch"|"dry_run"|"max_requests"|"max_tokens"|"max_cost";

export interface GuardOpts<T> {
  fn: () => Promise<T>;
  usage: Usage;
  limits: Limits;
  dryRun?: boolean;
  killSwitch?: boolean;
  onUsage: (u: Usage) => void;
  tokenEstimator?: () => number; // optional per-call token estimate
  priceEstimator?: () => number; // optional per-call $ estimate
}

export async function guardedCall<T>(opts: GuardOpts<T>):
  Promise<T | { skipped: true; reason: SkipReason }> {

  const { fn, usage, limits, dryRun=false, killSwitch=false, onUsage,
          tokenEstimator, priceEstimator } = opts;

  if (killSwitch) return { skipped:true, reason:"kill_switch" };
  if (dryRun)     return { skipped:true, reason:"dry_run" };
  if (usage.requests >= limits.maxRequests) return { skipped:true, reason:"max_requests" };
  if (usage.tokens   >= limits.maxTokens)   return { skipped:true, reason:"max_tokens" };
  if (usage.cost     >= limits.maxCost)     return { skipped:true, reason:"max_cost" };

  const res = await fn();

  const estTokens = Math.max(0, Math.floor(tokenEstimator?.() ?? 100));
  const estPrice  = +(priceEstimator?.() ?? 0.002);

  onUsage({
    requests: usage.requests + 1,
    tokens:   usage.tokens   + estTokens,
    cost:     +(usage.cost   + estPrice).toFixed(6)
  });

  return res;
}
