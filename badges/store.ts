import { BadgeId, BadgeState, BadgeStore } from "../types";
const KEY = "astrilogue.badges.v1";

const DEFAULT_STORE: BadgeStore = { version: 1, earned: [], seenToastFor: [] };

export function loadBadgeStore(): BadgeStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STORE;
    const parsed = JSON.parse(raw) as BadgeStore;
    return { ...DEFAULT_STORE, ...parsed };
  } catch {
    return DEFAULT_STORE;
  }
}

export function saveBadgeStore(s: BadgeStore) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function hasBadge(id: BadgeId, s = loadBadgeStore()) {
  return s.earned.some(b => b.id === id);
}

export function addBadge(state: BadgeState) {
  const s = loadBadgeStore();
  if (hasBadge(state.id, s)) return s; // idempotent
  const next: BadgeStore = { ...s, earned: [...s.earned, state] };
  saveBadgeStore(next);
  return next;
}

export function markToastSeen(id: BadgeId) {
  const s = loadBadgeStore();
  if (s.seenToastFor.includes(id)) return s;
  s.seenToastFor.push(id);
  saveBadgeStore(s);
  return s;
}
