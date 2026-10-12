import { useState, useEffect, useRef, useCallback } from "react";

interface UseCountdownTimerOptions {
  /** Total duration in seconds */
  totalSeconds: number;
  /** Whether the timer is actively running */
  running: boolean;
  /** Called once when the timer reaches zero (auto-submit) */
  onExpire: () => void;
}

interface CountdownTimerResult {
  /** Remaining seconds, floored to whole seconds */
  secondsLeft: number;
  /** Total elapsed seconds since the timer started */
  secondsElapsed: number;
}

/**
 * Precision countdown timer using wall-clock timestamps.
 *
 * Instead of blindly decrementing a counter every 1000ms (which drifts
 * when the browser throttles background tabs), we record the real start
 * time with Date.now() and recompute the remaining seconds on each tick.
 * This keeps the displayed time accurate even after the tab was backgrounded.
 *
 * When secondsLeft hits 0, the interval is cleared and onExpire fires once.
 */
export function useCountdownTimer({
  totalSeconds,
  running,
  onExpire,
}: UseCountdownTimerOptions): CountdownTimerResult {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  // Keep the latest onExpire without re-creating the interval
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Reset when totalSeconds changes (e.g. starting a new exam)
  useEffect(() => {
    setSecondsLeft(totalSeconds);
    expiredRef.current = false;
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    startRef.current = Date.now();
    expiredRef.current = false;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);

      setSecondsLeft(remaining);

      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onExpireRef.current();
      }
    }, 250); // tick 4x/sec for smooth display; cost is negligible

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, totalSeconds]);

  const secondsElapsed = totalSeconds - secondsLeft;

  return { secondsLeft, secondsElapsed };
}
