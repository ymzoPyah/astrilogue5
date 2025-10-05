import React, { useEffect, useState } from "react";
import { BADGE_CATALOG } from "../../badges/catalog";
import { markToastSeen, loadBadgeStore } from "../../badges/store";
import { BadgeId } from "../../types";

export const BadgeToast: React.FC = () => {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const onAward = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const badgeId = detail?.id as BadgeId;
      if (!badgeId) return;

      const seen = loadBadgeStore().seenToastFor.includes(badgeId);
      if (!seen) setId(badgeId);
    };
    document.addEventListener("BADGE_AWARDED", onAward);
    return () => document.removeEventListener("BADGE_AWARDED", onAward);
  }, []);

  const handleClose = () => {
      if(id) {
          markToastSeen(id as BadgeId);
      }
      setId(null);
  }

  if (!id) return null;
  const meta = BADGE_CATALOG.find(b => b.id === id);
  if (!meta) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-zinc-900/90 border border-zinc-700/60 rounded-2xl p-3 pr-4 shadow-lg backdrop-blur flex items-center gap-3 z-[200] animate-[slideIn_0.5s_ease-out]">
      <img src={meta.iconUrl} alt={meta.title} className="w-12 h-12 rounded-xl" />
      <div className="text-sm">
        <div className="font-semibold text-white">Badge Unlocked!</div>
        <div className="text-zinc-400">{meta.title}</div>
      </div>
      <button
        onClick={handleClose}
        className="ml-3 text-xs px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white"
        aria-label="Close notification"
      >Close</button>
    </div>
  );
}

export default BadgeToast;