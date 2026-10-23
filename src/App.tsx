import { useCallback, useEffect, useRef, useState } from "react";

const COLORS = [
  { id: "red", label: "Red", hex: "#FF3333" },
  { id: "orange", label: "Orange", hex: "#FF8C00" },
  { id: "yellow", label: "Yellow", hex: "#FFE135" },
  { id: "green", label: "Green", hex: "#4CAF50" },
  { id: "blue", label: "Blue", hex: "#2196F3" },
  { id: "purple", label: "Purple", hex: "#9C27B0" },
  { id: "pink", label: "Pink", hex: "#FF4081" },
  { id: "black", label: "Black", hex: "#111827" },
];

const SIZES = {
  S: 8,
  M: 14,
  L: 22,
  XL: 32,
} as const;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState(COLORS[0].hex);
  const [size, setSize] = useState<keyof typeof SIZES>("M");
  const [painting, setPainting] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }, []);

  useEffect(() => {
    syncCanvasSize();

    const canvas = canvasRef.current;
    if (!canvas) return;

    let frame = 0;
    const resize = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(syncCanvasSize);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [syncCanvasSize]);

  const drawLine = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = SIZES[size];
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    },
    [color, size],
  );

  const getPointerPosition = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
    };
  }, []);

  const startPaint = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getPointerPosition(event);
    if (!pos) return;

    lastPos.current = pos;
    setPainting(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, SIZES[size] / 2, 0, Math.PI * 2);
    ctx.fill();
  }, [color, getPointerPosition, size]);

  const movePaint = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!painting) return;
    const pos = getPointerPosition(event);
    if (!pos || !lastPos.current) return;

    drawLine(lastPos.current, pos);
    lastPos.current = pos;
  }, [drawLine, getPointerPosition, painting]);

  const stopPaint = useCallback(() => {
    setPainting(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 p-4 text-slate-800">
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Color</span>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Choose ${item.label}`}
                onClick={() => setColor(item.hex)}
                className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 ${color === item.hex ? "border-slate-800" : "border-white"}`}
                style={{ background: item.hex }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Size</span>
          <div className="flex gap-2">
            {(Object.keys(SIZES) as Array<keyof typeof SIZES>).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSize(key)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${size === key ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGrid((current) => !current)}
          className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
        >
          {showGrid ? "Hide grid" : "Show grid"}
        </button>

        <button
          type="button"
          onClick={clearCanvas}
          className="ml-auto rounded-full bg-rose-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-600"
        >
          Clear
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-inner">
        {showGrid && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        )}

        <canvas
          ref={canvasRef}
          onPointerDown={startPaint}
          onPointerMove={movePaint}
          onPointerUp={stopPaint}
          onPointerLeave={stopPaint}
          onPointerCancel={stopPaint}
          className="relative z-10 h-full w-full cursor-crosshair touch-none"
          style={{ display: "block" }}
        />
      </div>
    </div>
  );
}
