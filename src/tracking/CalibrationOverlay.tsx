// Full-canvas overlay shown during calibration: a backdrop, the target dot the
// user should look at (with a progress ring), a step counter and a Cancel button.
// Purely presentational — driven by useCalibration's view state.
import type { CalibrationView } from "./useCalibration";
import type { ControlMode } from "./pointerMapping";

interface Props {
  view: CalibrationView;
  mode: ControlMode;
  onCancel: () => void;
}

const R = 26;
const CIRC = 2 * Math.PI * R;

export function CalibrationOverlay({ view, mode, onCancel }: Props) {
  if (!view.active) return null;
  const size = (R + 6) * 2;
  const c = size / 2;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-[2px]">
      {/* instructions */}
      <div className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-white/95 px-5 py-2 text-center text-sm font-bold tracking-wide text-slate-700 shadow">
        {mode === "eye" ? "Look at the dot and hold still" : "Look straight at the screen and hold still"}
        <span className="ml-2 text-slate-400">
          {view.step + 1} / {view.total}
        </span>
      </div>

      {/* target dot at the normalized position */}
      <div
        className="absolute"
        style={{ left: `${view.target.x * 100}%`, top: `${view.target.y * 100}%`, transform: "translate(-50%, -50%)" }}
      >
        <svg width={size} height={size} style={{ display: "block" }}>
          <circle cx={c} cy={c} r={R} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={5} />
          <circle
            cx={c}
            cy={c}
            r={R}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - view.progress)}
            transform={`rotate(-90 ${c} ${c})`}
          />
          <circle cx={c} cy={c} r={7} fill="#f59e0b">
            <animate attributeName="r" values="6;9;6" dur="1.2s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      <button
        onClick={onCancel}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/95 px-5 py-2 text-sm font-bold tracking-wide text-slate-600 shadow transition-colors hover:bg-white"
      >
        Cancel
      </button>
    </div>
  );
}
