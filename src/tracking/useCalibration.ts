// Calibration: show the user a few targets, record the face features while they
// look/aim at each, then fit the mapping. Eye mode fits an affine over the gaze
// proxy (needs several points); head mode just captures the neutral "straight
// ahead" pose (one point). Feed it frames from the tracking loop while active.
import { useCallback, useRef, useState } from "react";
import { fitAffine } from "./pointerMapping";
import type { Affine, ControlMode, FaceFeatures, Point } from "./pointerMapping";

export interface CalibrationResult {
  mode: ControlMode;
  affine?: Affine; // eye mode
  neutral?: { yaw: number; pitch: number }; // head mode
}

const CAPTURE_MS = 1600; // total time on each target
const SETTLE_MS = 500; // ignore the first moments while the eyes/head arrive

// Normalized target positions within the canvas region.
const EYE_TARGETS: Point[] = [
  { x: 0.5, y: 0.5 },
  { x: 0.12, y: 0.12 },
  { x: 0.88, y: 0.12 },
  { x: 0.12, y: 0.88 },
  { x: 0.88, y: 0.88 },
  { x: 0.5, y: 0.12 },
  { x: 0.5, y: 0.88 },
  { x: 0.12, y: 0.5 },
  { x: 0.88, y: 0.5 },
];
const HEAD_TARGETS: Point[] = [{ x: 0.5, y: 0.5 }];

export interface CalibrationView {
  active: boolean;
  step: number;
  total: number;
  target: Point; // normalized
  progress: number; // 0..1 on the current target
}

export function useCalibration(onComplete: (r: CalibrationResult) => void) {
  const [view, setView] = useState<CalibrationView>({
    active: false,
    step: 0,
    total: 0,
    target: { x: 0.5, y: 0.5 },
    progress: 0,
  });

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const modeRef = useRef<ControlMode>("head");
  const targetsRef = useRef<Point[]>([]);
  const stepRef = useRef(0);
  const stepStartRef = useRef(0);
  const samplesRef = useRef<FaceFeatures[]>([]);
  const resultsRef = useRef<Point[]>([]); // averaged gaze per target (eye mode)
  const lastProgressRef = useRef(0);

  const start = useCallback((mode: ControlMode) => {
    modeRef.current = mode;
    targetsRef.current = mode === "eye" ? EYE_TARGETS : HEAD_TARGETS;
    stepRef.current = 0;
    stepStartRef.current = 0;
    samplesRef.current = [];
    resultsRef.current = [];
    lastProgressRef.current = 0;
    setView({ active: true, step: 0, total: targetsRef.current.length, target: targetsRef.current[0], progress: 0 });
  }, []);

  const cancel = useCallback(() => {
    stepStartRef.current = 0;
    setView((v) => ({ ...v, active: false }));
  }, []);

  const finish = useCallback(() => {
    if (modeRef.current === "eye") {
      onCompleteRef.current({ mode: "eye", affine: fitAffine(resultsRef.current, targetsRef.current) });
    } else {
      const h = averageHead(samplesRef.current);
      onCompleteRef.current({ mode: "head", neutral: h });
    }
    stepStartRef.current = 0;
    setView((v) => ({ ...v, active: false }));
  }, []);

  // Call every frame while calibrating.
  const feed = useCallback(
    (features: FaceFeatures, nowMs: number) => {
      if (stepStartRef.current === 0) stepStartRef.current = nowMs;
      const elapsed = nowMs - stepStartRef.current;
      if (elapsed > SETTLE_MS) samplesRef.current.push(features);

      const progress = Math.min(1, elapsed / CAPTURE_MS);
      if (Math.abs(progress - lastProgressRef.current) > 0.03 || progress >= 1) {
        lastProgressRef.current = progress;
        setView((v) => ({ ...v, progress }));
      }

      if (elapsed >= CAPTURE_MS) {
        if (modeRef.current === "eye") resultsRef.current.push(averageGaze(samplesRef.current));
        const next = stepRef.current + 1;
        samplesRef.current = [];
        stepStartRef.current = 0;
        lastProgressRef.current = 0;
        if (next >= targetsRef.current.length) {
          finish();
        } else {
          stepRef.current = next;
          setView((v) => ({ ...v, step: next, target: targetsRef.current[next], progress: 0 }));
        }
      }
    },
    [finish],
  );

  return { view, start, cancel, feed };
}

function averageGaze(samples: FaceFeatures[]): Point {
  if (!samples.length) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const s of samples) {
    x += s.gaze.x;
    y += s.gaze.y;
  }
  return { x: x / samples.length, y: y / samples.length };
}

function averageHead(samples: FaceFeatures[]): { yaw: number; pitch: number } {
  if (!samples.length) return { yaw: 0, pitch: 0 };
  let yaw = 0;
  let pitch = 0;
  for (const s of samples) {
    yaw += s.head.yaw;
    pitch += s.head.pitch;
  }
  return { yaw: yaw / samples.length, pitch: pitch / samples.length };
}
