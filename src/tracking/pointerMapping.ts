// Pure helpers that turn face-tracking features into a screen point, plus the
// jitter smoothing and calibration math. No DOM or camera here, so this file is
// unit-testable on its own.

export type Point = { x: number; y: number };

export type ControlMode = "head" | "eye";

// One frame of features emitted by the face tracker (see useFaceTracker.ts).
export interface FaceFeatures {
  // Head-orientation signals (scale-invariant landmark ratios, not literal radians):
  // yaw = turn left/right, pitch = nod up/down, roll = head tilt (radians).
  head: { yaw: number; pitch: number; roll: number };
  // Gaze proxy: iris position relative to each eye's corners, averaged and
  // head-compensated, roughly in [-1, 1] on each axis. Used for eye mode.
  gaze: Point;
  // Eye-closed estimate, 0 (open) .. 1 (closed). Reserved for a future blink trigger.
  blink: number;
}

// ---------------------------------------------------------------------------
// One Euro filter — low-latency smoothing that follows fast moves but calms
// jitter when still. Reference: Casiez, Roussel & Vogel (2012).
// ---------------------------------------------------------------------------
class LowPass {
  private y: number | null = null;
  filter(value: number, alpha: number): number {
    this.y = this.y === null ? value : alpha * value + (1 - alpha) * this.y;
    return this.y;
  }
  get hasValue(): boolean {
    return this.y !== null;
  }
  get value(): number {
    return this.y ?? 0;
  }
  reset(): void {
    this.y = null;
  }
}

export class OneEuroFilter {
  private xFilter = new LowPass();
  private dxFilter = new LowPass();
  private lastTime: number | null = null;
  // minCutoff: lower = smoother but laggier when slow. beta: higher = snappier on fast moves.
  constructor(private minCutoff = 1.2, private beta = 0.015, private dCutoff = 1) {}

  private alpha(cutoff: number, dt: number): number {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  filter(value: number, timestampMs: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestampMs;
      return this.xFilter.filter(value, 1);
    }
    const dt = Math.max((timestampMs - this.lastTime) / 1000, 1e-3);
    this.lastTime = timestampMs;
    const dxRaw = this.xFilter.hasValue ? (value - this.xFilter.value) / dt : 0;
    const dx = this.dxFilter.filter(dxRaw, this.alpha(this.dCutoff, dt));
    const cutoff = this.minCutoff + this.beta * Math.abs(dx);
    return this.xFilter.filter(value, this.alpha(cutoff, dt));
  }

  reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

// Smooths a 2D point. `smoothing` in [0, 1] scales how aggressive the filter is.
export class PointSmoother {
  private fx: OneEuroFilter;
  private fy: OneEuroFilter;
  constructor(smoothing = 0.5) {
    // Map a friendly 0..1 slider onto One Euro's minCutoff (more smoothing = lower cutoff).
    const minCutoff = 2.5 - 2.2 * clamp01(smoothing);
    this.fx = new OneEuroFilter(minCutoff);
    this.fy = new OneEuroFilter(minCutoff);
  }
  filter(p: Point, timestampMs: number): Point {
    return { x: this.fx.filter(p.x, timestampMs), y: this.fy.filter(p.y, timestampMs) };
  }
  reset(): void {
    this.fx.reset();
    this.fy.reset();
  }
}

// ---------------------------------------------------------------------------
// Affine calibration: fit [sx, sy] = A · [fx, fy, 1] from recorded samples.
// ---------------------------------------------------------------------------
export type Affine = { a: number; b: number; c: number; d: number; e: number; f: number };

// Identity-ish fallback used before any calibration (maps feature -> same point).
export const IDENTITY_AFFINE: Affine = { a: 1, b: 0, c: 0, d: 0, e: 1, f: 0 };

export function applyAffine(t: Affine, p: Point): Point {
  return { x: t.a * p.x + t.b * p.y + t.c, y: t.d * p.x + t.e * p.y + t.f };
}

// Least-squares fit (with tiny ridge regularization for stability with few or
// near-collinear samples). `src` = feature points, `dst` = target screen points.
export function fitAffine(src: Point[], dst: Point[]): Affine {
  if (src.length < 3 || src.length !== dst.length) return IDENTITY_AFFINE;
  // Normal equations: (XᵀX) β = Xᵀ s, where each row of X is [fx, fy, 1].
  const XtX = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const XtSx = [0, 0, 0];
  const XtSy = [0, 0, 0];
  for (let i = 0; i < src.length; i++) {
    const row = [src[i].x, src[i].y, 1];
    for (let r = 0; r < 3; r++) {
      for (let col = 0; col < 3; col++) XtX[r][col] += row[r] * row[col];
      XtSx[r] += row[r] * dst[i].x;
      XtSy[r] += row[r] * dst[i].y;
    }
  }
  const lambda = 1e-6;
  for (let r = 0; r < 3; r++) XtX[r][r] += lambda;
  const bx = solve3x3(XtX, XtSx);
  const by = solve3x3(XtX, XtSy);
  if (!bx || !by) return IDENTITY_AFFINE;
  return { a: bx[0], b: bx[1], c: bx[2], d: by[0], e: by[1], f: by[2] };
}

// Solve a 3x3 linear system via Gaussian elimination with partial pivoting.
function solve3x3(m: number[][], v: number[]): number[] | null {
  const a = m.map((row, i) => [...row, v[i]]);
  for (let col = 0; col < 3; col++) {
    let piv = col;
    for (let r = col + 1; r < 3; r++) if (Math.abs(a[r][col]) > Math.abs(a[piv][col])) piv = r;
    if (Math.abs(a[piv][col]) < 1e-12) return null;
    [a[col], a[piv]] = [a[piv], a[col]];
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const factor = a[r][col] / a[col][col];
      for (let c = col; c < 4; c++) a[r][c] -= factor * a[col][c];
    }
  }
  return [a[0][3] / a[0][0], a[1][3] / a[1][1], a[2][3] / a[2][2]];
}

// ---------------------------------------------------------------------------
// Feature -> screen point.
// ---------------------------------------------------------------------------
export interface HeadMapping {
  neutral: { yaw: number; pitch: number }; // captured "looking straight ahead" pose
  sensitivity: number; // 0..1 slider
}

// All mappers return NORMALIZED region coordinates (0..1 on each axis); the
// caller multiplies by the live canvas size. This keeps calibration independent
// of the exact pixel dimensions.

// Head mode: deflection from the neutral pose drives the pointer around the
// region center. Yaw is negated so turning right moves the pointer right.
export function mapHead(features: FaceFeatures, mapping: HeadMapping): Point {
  const gain = 3 + 9 * clamp01(mapping.sensitivity); // ratio-signal -> fraction-of-region scale
  const dx = -(features.head.yaw - mapping.neutral.yaw) * gain;
  const dy = (features.head.pitch - mapping.neutral.pitch) * gain;
  return { x: 0.5 + dx, y: 0.5 + dy };
}

// Eye mode: run the gaze proxy through the affine fitted during calibration,
// which maps it into normalized region space.
export function mapEye(features: FaceFeatures, affine: Affine): Point {
  return applyAffine(affine, features.gaze);
}

// Clamp a normalized point to [0, 1] on both axes.
export function clamp01Point(p: Point): Point {
  return { x: clamp01(p.x), y: clamp01(p.y) };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
function clamp01(v: number): number {
  return clamp(v, 0, 1);
}
