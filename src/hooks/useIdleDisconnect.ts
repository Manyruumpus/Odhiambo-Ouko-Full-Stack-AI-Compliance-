// src/hooks/useIdleDisconnect.ts
import { useEffect, useRef } from 'react';
import { rdt } from '../lib/radix';

const FIVE_MIN = 300_000; // 5 minutes

export function useIdleDisconnect(enabled: boolean) {
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled) return;

    function markActivity() {
      lastActivityRef.current = Date.now();
    }

    // Fallback: timer + visibility
    function startFallbackTimer() {
      stopFallbackTimer();
      const tick = () => {
        const idleFor = Date.now() - lastActivityRef.current;
        if (idleFor >= FIVE_MIN) {
          rdt.disconnect(); // reset RDT state (logs out) [web:1]
          stopFallbackTimer();
          return;
        }
        timerRef.current = window.setTimeout(tick, 5_000);
      };
      timerRef.current = window.setTimeout(tick, 5_000);
    }
    function stopFallbackTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    // Try Idle Detection API first
    async function tryIdleAPI() {
      try {
        // Permission must be granted from a user gesture in many browsers [web:89][web:82]
        // If permission was already granted, proceed; otherwise fall back
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (!('IdleDetector' in window)) throw new Error('IdleDetector not available'); // [web:84]
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const perm = await IdleDetector.requestPermission();
        if (perm !== 'granted') throw new Error('IdleDetector permission denied'); // [web:89]
        abortRef.current = new AbortController();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const detector = new IdleDetector(); // [web:86]
        detector.addEventListener('change', () => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (detector.userState === 'idle') {
            rdt.disconnect(); // user idle => disconnect [web:1]
            abortRef.current?.abort();
          }
        });
        await detector.start({ threshold: FIVE_MIN, signal: abortRef.current.signal }); // min 60s per spec [web:82]
      } catch {
        // Fallback path
        document.addEventListener('visibilitychange', markActivity); // focus change counts as activity [web:76]
        window.addEventListener('pointerdown', markActivity);
        window.addEventListener('keydown', markActivity);
        startFallbackTimer();
      }
    }

    tryIdleAPI();

    return () => {
      abortRef.current?.abort();
      document.removeEventListener('visibilitychange', markActivity);
      window.removeEventListener('pointerdown', markActivity);
      window.removeEventListener('keydown', markActivity);
      stopFallbackTimer();
    };
  }, [enabled]);
}
