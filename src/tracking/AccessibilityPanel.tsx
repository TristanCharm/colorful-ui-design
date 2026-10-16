// Toolbar control for webcam eye/head painting: a button that opens a panel to
// turn the camera on, pick eye vs head mode, calibrate, and tune
// sensitivity / smoothing / dwell time. Styled to sit with the other toolbar
// buttons.
import { useState } from "react";
import type { ControlMode } from "./pointerMapping";
import type { TrackerError, TrackerStatus } from "./useFaceTracker";

export interface AccessibilityPanelProps {
  enabled: boolean;
  onToggleEnabled: () => void;
  status: TrackerStatus;
  error: TrackerError | null;
  mode: ControlMode;
  onModeChange: (m: ControlMode) => void;
  sensitivity: number;
  onSensitivity: (n: number) => void;
  smoothing: number;
  onSmoothing: (n: number) => void;
  dwellMs: number;
  onDwellMs: (n: number) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  onCalibrate: () => void;
  calibrated: boolean;
}

export function AccessibilityPanel(props: AccessibilityPanelProps) {
  const [open, setOpen] = useState(false);
  const running = props.status === "running";

  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex h-12 items-center gap-2 rounded-md border-2 px-3 text-xs font-bold tracking-widest transition-colors ${
          props.enabled
            ? "border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-600"
            : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
        }`}
        aria-expanded={open}
        aria-label="Webcam eye and head control settings"
      >
        <EyeIcon />
        WEBCAM
        {running && <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-14 z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-1 text-sm font-bold text-slate-800">Paint with your eyes or head</div>
            <p className="mb-3 text-[11px] leading-snug text-slate-500">
              Uses your webcam on this device only. Video never leaves your computer.
            </p>

            {/* Enable toggle */}
            <button
              onClick={props.onToggleEnabled}
              className={`mb-3 w-full rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
                props.enabled
                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {props.enabled ? "Turn off webcam control" : "Turn on webcam control"}
            </button>

            <StatusLine status={props.status} error={props.error} />

            {/* Mode */}
            <div className="mb-3 mt-3">
              <div className="mb-1.5 text-xs font-semibold text-slate-600">Control with</div>
              <div className="grid grid-cols-2 gap-2">
                {(["head", "eye"] as ControlMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => props.onModeChange(m)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition-colors ${
                      props.mode === m
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {m === "head" ? "Head" : "Eyes"}
                  </button>
                ))}
              </div>
            </div>

            {/* Calibrate */}
            <button
              onClick={props.onCalibrate}
              disabled={!running}
              className="mb-3 w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {props.calibrated ? "Re-calibrate" : "Calibrate"}
              {props.mode === "eye" && <span className="ml-1 font-normal">(recommended)</span>}
            </button>

            {/* Sliders */}
            <Slider
              label={props.mode === "head" ? "Head sensitivity" : "Sensitivity (head mode)"}
              min={0}
              max={1}
              step={0.05}
              value={props.sensitivity}
              onChange={props.onSensitivity}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <Slider
              label="Smoothing"
              min={0}
              max={1}
              step={0.05}
              value={props.smoothing}
              onChange={props.onSmoothing}
              format={(v) => `${Math.round(v * 100)}%`}
            />
            <Slider
              label="Hold time to draw"
              min={400}
              max={2500}
              step={100}
              value={props.dwellMs}
              onChange={props.onDwellMs}
              format={(v) => `${(v / 1000).toFixed(1)}s`}
            />

            {/* Preview toggle */}
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={props.showPreview} onChange={props.onTogglePreview} className="h-4 w-4 accent-indigo-600" />
              Show camera preview
            </label>
          </div>
        </>
      )}
    </div>
  );
}

function StatusLine({ status, error }: { status: TrackerStatus; error: TrackerError | null }) {
  if (status === "error" && error) {
    return <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium leading-snug text-rose-600">{errorText(error)}</div>;
  }
  const text =
    status === "loading" ? "Starting camera…" : status === "running" ? "On — tracking your movement" : "Off";
  const tone = status === "running" ? "text-emerald-600" : "text-slate-500";
  return <div className={`text-xs font-medium ${tone}`}>{text}</div>;
}

function errorText(error: TrackerError): string {
  switch (error.kind) {
    case "permission":
      return "Camera access was blocked. Allow the camera for this site in your browser, then turn it on again.";
    case "no-camera":
      return "No camera found. Connect a webcam and try again.";
    case "load":
      return "Couldn't load the tracking model. In the config folder run: npm run setup:mediapipe — then reload.";
    default:
      return error.message || "Something went wrong starting the camera.";
  }
}

function Slider(props: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div className="mb-2">
      <div className="mb-0.5 flex items-center justify-between text-xs text-slate-600">
        <span>{props.label}</span>
        <span className="font-semibold text-slate-800">{props.format(props.value)}</span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="w-full accent-indigo-600"
      />
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
