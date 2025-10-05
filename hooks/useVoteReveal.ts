import { useCallback, useEffect, useMemo, useRef } from 'react';
import { SurvivorSpeed } from '../types';

interface UseVoteRevealOpts {
  total: number;
  index: number;
  onAdvance: (nextIndex: number) => void;
  onComplete?: () => void;
  isPaused?: boolean;
  speed: SurvivorSpeed;
  revealIntervalMs?: number; // @1x baseline
  autoPlay?: boolean;
}

/**
 * Controls progression of vote reveal over time and keyboard.
 * Hotkeys: Right Arrow/Enter – advance; Left Arrow – back; Space – toggle pause; S – skip.
 */
export function useVoteReveal({
  total,
  index,
  onAdvance,
  onComplete,
  isPaused = false,
  speed,
  revealIntervalMs = 2000,
  autoPlay = true,
}: UseVoteRevealOpts) {
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(isPaused);
  pausedRef.current = isPaused;

  // derive effective interval by speed
  const interval = useMemo(() => {
    if (speed === Infinity) return 50; // super fast drip at ∞
    const base = revealIntervalMs;
    return Math.max(150, base / (speed as number));
  }, [revealIntervalMs, speed]);

  const step = useCallback((ts: number) => {
    if (pausedRef.current || !autoPlay) return;
    if (index >= total - 1) return;
    if (!lastTsRef.current) lastTsRef.current = ts;
    const elapsed = ts - lastTsRef.current;
    if (elapsed >= interval) {
      lastTsRef.current = ts;
      onAdvance(index + 1);
    }
    rafRef.current = requestAnimationFrame(step);
  }, [index, total, interval, onAdvance, autoPlay]);

  // timer loop
  useEffect(() => {
    if (pausedRef.current || !autoPlay) return;
    if (index >= total - 1) return;
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [index, total, step, autoPlay]);

  // completion callback
  useEffect(() => {
    if (index === total - 1 && total > 0) onComplete?.();
  }, [index, total, onComplete]);

  // keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (index < total - 1) onAdvance(index + 1);
      } else if (e.key === 'ArrowLeft') {
        if (index > 0) onAdvance(index - 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        // toggle pause via custom event; parent should wire this to season pause flag
        document.dispatchEvent(new CustomEvent('astrilogue:toggle-pause'));
      } else if (e.key.toLowerCase() === 's') {
        onAdvance(total - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, total, onAdvance]);
}
