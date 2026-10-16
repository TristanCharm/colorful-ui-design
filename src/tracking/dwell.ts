// Dwell detection: "clicking" by holding the pointer still. When the point stays
// within `radius` of where it settled for `dwellMs`, it fires once. It won't fire
// again until the point moves away and settles somewhere new, so a single hold
// produces a single toggle. This generalizes the hover-to-select pattern in the
// app (useHoverSelect in App.tsx) to gaze/head input.
import type { Point } from "./pointerMapping";

export interface DwellConfig {
  radius: number; // px of allowed wander while holding
  dwellMs: number; // how long to hold before it fires
}

export interface DwellTick {
  progress: number; // 0..1 toward firing
  fired: boolean; // true on the single frame the dwell completes
}

export interface DwellController {
  update(point: Point | null, nowMs: number): DwellTick;
  reset(): void;
}

export function createDwellController(cfg: DwellConfig): DwellController {
  let anchor: Point | null = null;
  let startMs = 0;
  let armed = true; // false after firing, until the point moves away again

  return {
    update(point, nowMs) {
      if (!point) {
        anchor = null;
        return { progress: 0, fired: false };
      }
      if (!anchor || dist(point, anchor) > cfg.radius) {
        // Moved: begin a fresh hold and re-arm.
        anchor = point;
        startMs = nowMs;
        armed = true;
        return { progress: 0, fired: false };
      }
      if (!armed) {
        // Already fired here; wait for the user to move away before firing again.
        return { progress: 1, fired: false };
      }
      const progress = Math.min(1, (nowMs - startMs) / cfg.dwellMs);
      if (progress >= 1) {
        armed = false;
        return { progress: 1, fired: true };
      }
      return { progress, fired: false };
    },
    reset() {
      anchor = null;
      armed = true;
    },
  };
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
