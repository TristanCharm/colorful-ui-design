// Runs MediaPipe Face Landmarker on the webcam and emits per-frame features.
// Everything here stays on the device: frames go straight from the camera into
// the in-browser WASM model and are never uploaded anywhere.
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  FaceLandmarker,
  FaceLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import type { FaceFeatures } from "./pointerMapping";

export type TrackerStatus = "idle" | "loading" | "running" | "error";

export interface TrackerError {
  kind: "permission" | "no-camera" | "load" | "unknown";
  message: string;
}

interface Options {
  // Called once per processed frame with the latest features.
  onFrame?: (features: FaceFeatures, timestampMs: number) => void;
}

// MediaPipe asset locations (prepared by config/scripts/setup-mediapipe.mjs).
const WASM_PATH = "/mediapipe/wasm";
const MODEL_PATH = "/mediapipe/face_landmarker.task";

export function useFaceTracker(options: Options = {}) {
  const [status, setStatus] = useState<TrackerStatus>("idle");
  const [error, setError] = useState<TrackerError | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const onFrameRef = useRef(options.onFrame);
  onFrameRef.current = options.onFrame;

  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const runningRef = useRef(false);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus((s) => (s === "error" ? s : "idle"));
  }, []);

  const loop = useCallback(() => {
    const v = videoRef.current;
    const lm = landmarkerRef.current;
    if (!runningRef.current || !v || !lm) return;
    if (v.readyState >= 2 && v.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = v.currentTime;
      const ts = performance.now();
      try {
        const features = extractFeatures(lm.detectForVideo(v, ts));
        if (features) onFrameRef.current?.(features, ts);
      } catch {
        /* a dropped frame shouldn't kill the loop */
      }
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    setError(null);
    setStatus("loading");
    try {
      if (!landmarkerRef.current) {
        landmarkerRef.current = await createLandmarker();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (!v) throw new Error("Video element not mounted");
      v.srcObject = stream;
      await v.play();
      runningRef.current = true;
      lastVideoTimeRef.current = -1;
      setStatus("running");
      loop();
    } catch (e) {
      setError(classifyError(e));
      setStatus("error");
      stop();
    }
  }, [loop, stop]);

  // Tear down on unmount: stop the camera and free the model.
  useEffect(() => {
    return () => {
      stop();
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [stop]);

  return { status, error, videoRef, start, stop };
}

async function createLandmarker(): Promise<FaceLandmarker> {
  const vision = await import("@mediapipe/tasks-vision");
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM_PATH);
  const build = (delegate: "GPU" | "CPU") =>
    vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATH, delegate },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: false,
    });
  try {
    return await build("GPU");
  } catch {
    // Some machines/browsers lack a usable GPU delegate; fall back to CPU.
    return await build("CPU");
  }
}

function classifyError(e: unknown): TrackerError {
  const name = (e as { name?: string })?.name;
  const message = (e as { message?: string })?.message || String(e);
  if (name === "NotAllowedError" || name === "SecurityError")
    return { kind: "permission", message };
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError")
    return { kind: "no-camera", message };
  if (/wasm|fetch|model|fileset|network/i.test(message)) return { kind: "load", message };
  return { kind: "unknown", message };
}

// --- Feature extraction from MediaPipe landmarks ---------------------------
// Canonical FaceMesh indices we rely on.
const NOSE_TIP = 1;
const L_EYE_OUTER = 33;
const L_EYE_INNER = 133;
const L_EYE_TOP = 159;
const L_EYE_BOTTOM = 145;
const R_EYE_OUTER = 263;
const R_EYE_INNER = 362;
const R_EYE_TOP = 386;
const R_EYE_BOTTOM = 374;
const L_IRIS = 468;
const R_IRIS = 473;

function extractFeatures(res: FaceLandmarkerResult): FaceFeatures | null {
  const lms = res.faceLandmarks?.[0];
  if (!lms || lms.length <= R_IRIS) return null;

  const nose = lms[NOSE_TIP];
  const leOut = lms[L_EYE_OUTER];
  const reOut = lms[R_EYE_OUTER];
  const eyeMidX = (leOut.x + reOut.x) / 2;
  const eyeMidY = (leOut.y + reOut.y) / 2;
  // Divide by the eye-to-eye distance so the signal is the same near or far.
  const faceW = Math.hypot(reOut.x - leOut.x, reOut.y - leOut.y) || 1e-3;

  const head = {
    yaw: (nose.x - eyeMidX) / faceW,
    pitch: (nose.y - eyeMidY) / faceW,
    roll: Math.atan2(reOut.y - leOut.y, reOut.x - leOut.x),
  };

  // Iris position relative to each eye's corners/lids, averaged — this isolates
  // eye-in-socket movement from head motion. Calibration maps it to the screen.
  const left = eyeGaze(lms[L_IRIS], lms[L_EYE_OUTER], lms[L_EYE_INNER], lms[L_EYE_TOP], lms[L_EYE_BOTTOM]);
  const right = eyeGaze(lms[R_IRIS], lms[R_EYE_OUTER], lms[R_EYE_INNER], lms[R_EYE_TOP], lms[R_EYE_BOTTOM]);
  const gaze = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };

  return { head, gaze, blink: computeBlink(res) };
}

function eyeGaze(
  iris: NormalizedLandmark,
  outer: NormalizedLandmark,
  inner: NormalizedLandmark,
  top: NormalizedLandmark,
  bottom: NormalizedLandmark,
) {
  const cx = (outer.x + inner.x) / 2;
  const cy = (top.y + bottom.y) / 2;
  const w = Math.hypot(outer.x - inner.x, outer.y - inner.y) || 1e-3;
  const h = Math.abs(bottom.y - top.y) || 1e-3;
  return { x: (iris.x - cx) / w, y: (iris.y - cy) / h };
}

function computeBlink(res: FaceLandmarkerResult): number {
  const cats = res.faceBlendshapes?.[0]?.categories;
  if (!cats) return 0;
  let l = 0;
  let r = 0;
  for (const c of cats) {
    if (c.categoryName === "eyeBlinkLeft") l = c.score;
    else if (c.categoryName === "eyeBlinkRight") r = c.score;
  }
  return (l + r) / 2;
}
