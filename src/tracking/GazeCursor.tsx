// The on-canvas cursor for webcam control: a ring that fills as you dwell, with
// a dot in the middle. It's updated imperatively (setCursor) from the tracking
// loop so the app doesn't re-render every frame. pointer-events: none so it
// never blocks the canvas underneath.
import { forwardRef, useImperativeHandle, useRef } from "react";

export interface CursorState {
  x: number; // px within the canvas container
  y: number;
  progress: number; // 0..1 dwell fill
  penDown: boolean; // currently drawing?
  visible: boolean;
}

export interface GazeCursorHandle {
  setCursor(state: CursorState): void;
}

const R = 20; // ring radius
const CIRC = 2 * Math.PI * R;

export const GazeCursor = forwardRef<GazeCursorHandle>(function GazeCursor(_props, ref) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);

  useImperativeHandle(ref, () => ({
    setCursor({ x, y, progress, penDown, visible }) {
      const wrap = wrapRef.current;
      if (!wrap) return;
      wrap.style.opacity = visible ? "1" : "0";
      wrap.style.transform = `translate(${x}px, ${y}px)`;
      wrap.style.color = penDown ? "#10b981" /* emerald */ : "#7c3aed" /* violet */;
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(CIRC * (1 - Math.max(0, Math.min(1, progress))));
      }
    },
  }), []);

  const size = (R + 5) * 2;
  const c = size / 2;
  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 40,
        pointerEvents: "none",
        opacity: 0,
        transform: "translate(-200px, -200px)",
        transition: "opacity 120ms ease",
        color: "#7c3aed",
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: "translate(-50%, -50%)", display: "block", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))" }}
      >
        {/* track */}
        <circle cx={c} cy={c} r={R} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth={4} />
        {/* dwell progress */}
        <circle
          ref={ringRef}
          cx={c}
          cy={c}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC}
          transform={`rotate(-90 ${c} ${c})`}
        />
        {/* center dot */}
        <circle cx={c} cy={c} r={5} fill="currentColor" />
      </svg>
    </div>
  );
});
