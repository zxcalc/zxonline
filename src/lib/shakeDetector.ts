// Detects a "shake" gesture: rapid back-and-forth pointer motion.
// Pure logic — feed it pointer samples (screen-space x/y + timestamp); it
// returns true on the sample where a shake is recognised, then auto-resets.

export interface ShakeConfig {
  minSpeed: number;    // px per ms; samples slower than this don't count
  reversals: number;   // direction flips required within the window
  windowMs: number;    // reversals must occur within this many ms
}

export const DEFAULT_SHAKE_CONFIG: ShakeConfig = {
  minSpeed: 1.5,
  reversals: 3,
  windowMs: 600,
};

export interface ShakeDetector {
  sample(x: number, y: number, t: number): boolean;
  reset(): void;
}

export function createShakeDetector(config: ShakeConfig = DEFAULT_SHAKE_CONFIG): ShakeDetector {
  let lastX: number | undefined;
  let lastY: number | undefined;
  let lastT = 0;
  let prevDx = 0;        // previous movement vector
  let prevDy = 0;
  let haveDir = false;   // do we have a previous direction to compare against?
  let reversalTimes: number[] = [];

  function reset(): void {
    lastX = undefined;
    lastY = undefined;
    lastT = 0;
    prevDx = 0;
    prevDy = 0;
    haveDir = false;
    reversalTimes = [];
  }

  function sample(x: number, y: number, t: number): boolean {
    if (lastX === undefined || lastY === undefined) {
      lastX = x; lastY = y; lastT = t;
      return false;
    }

    const dt = t - lastT;
    if (dt <= 0) return false;

    const dx = x - lastX;
    const dy = y - lastY;
    const dist = Math.hypot(dx, dy);
    const speed = dist / dt;

    lastX = x; lastY = y; lastT = t;

    // ignore slow / negligible motion, but keep the previous direction so a
    // brief pause doesn't wipe an in-progress shake
    if (speed < config.minSpeed || dist === 0) {
      return false;
    }

    if (haveDir) {
      // dot product of consecutive unit-ish movement vectors. Negative means
      // the direction reversed; strongly negative means a near-180° flip.
      const dot = dx * prevDx + dy * prevDy;
      const mag = dist * Math.hypot(prevDx, prevDy);
      const cos = mag > 0 ? dot / mag : 0; // cosine of angle between moves
      // cos < -0.5  => angle > 120°, i.e. a genuine back-and-forth reversal
      if (cos < -0.5) {
        reversalTimes.push(t);
      }
    }

    prevDx = dx;
    prevDy = dy;
    haveDir = true;

    reversalTimes = reversalTimes.filter(ts => t - ts <= config.windowMs);

    if (reversalTimes.length >= config.reversals) {
      reset();
      return true;
    }
    return false;
  }

  return { sample, reset };
}