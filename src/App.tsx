import { useState, useRef, useEffect, useCallback, Component } from "react";
import type { ReactNode } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { crashed: boolean }> {
  state = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch() { /* swallow */ }
  render() {
    return this.state.crashed
      ? <div style={{ padding: 24, color: "#c00" }}>Something went wrong. Please refresh.</div>
      : this.props.children;
  }
}

function useHoverSelect(onSelect: () => void, delay = 2000) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      if (raf.current)   { cancelAnimationFrame(raf.current); raf.current = null; }
    };
  }, []);

  const onMouseEnter = useCallback(() => {
    try {
      startTime.current = Date.now();
      const tick = () => {
        try {
          if (!mounted.current) return;
          const elapsed = Date.now() - (startTime.current ?? Date.now());
          setProgress(Math.min(elapsed / delay, 1));
          if (elapsed < delay) raf.current = requestAnimationFrame(tick);
        } catch { /* ignore */ }
      };
      raf.current = requestAnimationFrame(tick);
      timer.current = setTimeout(() => {
        try { if (mounted.current) onSelect(); } catch { /* ignore */ }
      }, delay);
    } catch { /* ignore */ }
  }, [onSelect, delay]);

  const onMouseLeave = useCallback(() => {
    try {
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      if (raf.current)   { cancelAnimationFrame(raf.current); raf.current = null; }
      setProgress(0);
      startTime.current = null;
    } catch { /* ignore */ }
  }, []);

  return { onMouseEnter, onMouseLeave, progress };
}

const COLORS = [
  { id: "red",      label: "Red",      hex: "#FF3333", text: "#fff" },
  { id: "orange",   label: "Orange",   hex: "#FF8C00", text: "#fff" },
  { id: "yellow",   label: "Yellow",   hex: "#FFE135", text: "#111" },
  { id: "lime",     label: "Lime",     hex: "#76FF03", text: "#111" },
  { id: "green",    label: "Green",    hex: "#4CAF50", text: "#fff" },
  { id: "cyan",     label: "Cyan",     hex: "#00BCD4", text: "#fff" },
  { id: "blue",     label: "Blue",     hex: "#2196F3", text: "#fff" },
  { id: "indigo",   label: "Indigo",   hex: "#3F51B5", text: "#fff" },
  { id: "violet",   label: "Violet",   hex: "#9C27B0", text: "#fff" },
  { id: "pink",     label: "Pink",     hex: "#FF4081", text: "#fff" },
  { id: "burgundy", label: "Burgundy", hex: "#880E4F", text: "#fff" },
  { id: "brown",    label: "Brown",    hex: "#795548", text: "#fff" },
  { id: "gray",     label: "Gray",     hex: "#9E9E9E", text: "#fff" },
];

function Splatter({ hex, dots }: { hex: string; dots: [number, number, number][] }) {
  return (
    <>
      {dots.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={hex} opacity="0.55" />
      ))}
    </>
  );
}

function ColorIcon({ id, hex }: { id: string; hex: string }) {
  const s = { fill: hex } as React.CSSProperties;
  switch (id) {
    case "red": // apple
      return (
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <Splatter hex={hex} dots={[[4,10,1.2],[6,20,0.8],[25,8,1],[28,18,0.9],[22,26,1.1],[8,27,0.7],[3,15,0.6]]} />
          <path d="M16 7 Q18 3 21 4" stroke={hex} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          <path d="M10 13 Q8 10 11 9 Q14 8 16 10 Q18 8 21 9 Q24 10 22 13 Q22 22 16 24 Q10 22 10 13Z" style={s}/>
          <ellipse cx="13" cy="13" rx="2" ry="3" fill="white" opacity="0.25" transform="rotate(-20 13 13)"/>
        </svg>
      );
    case "orange": // smiley face
      return (
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <Splatter hex={hex} dots={[[3,12,1.1],[5,21,0.8],[27,10,1],[29,20,0.7],[16,2,0.9],[14,30,1],[25,27,0.8],[2,25,0.6]]} />
          <circle cx="16" cy="16" r="10" style={s}/>
          <circle cx="12.5" cy="13.5" r="1.8" fill="white"/>
          <circle cx="19.5" cy="13.5" r="1.8" fill="white"/>
          <path d="M11 19 Q16 24 21 19" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        </svg>
      );
    case "yellow": // star
      return (
        <svg width="64" height="64" viewBox="0 0 32 32">
          <Splatter hex={hex} dots={[[2,8,1],[1,20,0.8],[30,7,1.1],[31,22,0.7],[16,1,0.9],[15,31,1],[28,28,0.8]]} />
          <polygon points="16,4 19.5,12.5 29,13.5 22,20 24,29 16,24.5 8,29 10,20 3,13.5 12.5,12.5" style={s}/>
        </svg>
      );
    case "green": // square
      return (
        <svg width="64" height="64" viewBox="0 0 32 32">
          <Splatter hex={hex} dots={[[2,5,1],[3,27,0.8],[29,4,1],[30,28,0.9],[16,1,0.7],[1,16,0.8],[31,15,0.7],[14,31,0.9]]} />
          <rect x="6" y="6" width="20" height="20" rx="3" style={s}/>
          <rect x="6" y="6" width="8" height="8" rx="2" fill="white" opacity="0.2"/>
        </svg>
      );
    case "blue": // fish
      return (
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <Splatter hex={hex} dots={[[2,8,1],[1,22,0.8],[3,16,0.6],[16,2,1],[14,29,0.9],[28,4,0.8],[30,27,0.7]]} />
          <path d="M24 16 L29 10 L29 22 Z" style={s}/>
          <ellipse cx="14" cy="16" rx="10" ry="7" style={s}/>
          <circle cx="8" cy="14" r="1.5" fill="white"/>
          <circle cx="8" cy="14" r="0.7" fill="#1565C0"/>
          <path d="M12 10 Q16 8 18 12" stroke="white" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4"/>
        </svg>
      );
    case "indigo": // wavy flag
      return (
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <Splatter hex={hex} dots={[[1,8,1],[2,22,0.8],[29,5,1],[30,22,0.9],[15,29,0.8],[28,28,0.7],[3,30,0.6]]} />
          <line x1="7" y1="5" x2="7" y2="28" stroke={hex} strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 7 Q12 5 17 9 Q22 13 27 10 L27 20 Q22 23 17 19 Q12 15 7 17 Z" style={s}/>
        </svg>
      );
    case "violet": // crown
      return (
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <Splatter hex={hex} dots={[[2,6,1],[1,24,0.8],[30,5,1.1],[31,24,0.7],[16,1,0.9],[3,16,0.7],[29,15,0.8],[15,31,0.6]]} />
          <path d="M5 22 L5 13 L10 18 L16 8 L22 18 L27 13 L27 22 Z" style={s}/>
          <rect x="5" y="22" width="22" height="4" rx="1.5" style={s}/>
          <circle cx="16" cy="22" r="1.8" fill="white" opacity="0.6"/>
          <circle cx="9" cy="22" r="1.2" fill="white" opacity="0.4"/>
          <circle cx="23" cy="22" r="1.2" fill="white" opacity="0.4"/>
        </svg>
      );
    case "lime": // lightning bolt
      return (
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <Splatter hex={hex} dots={[[2,6,1],[3,24,0.8],[29,5,1],[30,26,0.9],[16,1,0.8],[1,16,0.7],[31,15,0.7]]} />
          <polygon points="19,4 9,18 16,18 13,28 23,14 16,14" style={s}/>
        </svg>
      );
    case "cyan": // water droplet
      return (
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <Splatter hex={hex} dots={[[2,7,1],[3,23,0.8],[29,6,1],[30,24,0.7],[16,1,0.9],[15,30,0.8],[28,27,0.7]]} />
          <path d="M16 5 Q22 13 22 19 A6 6 0 0 1 10 19 Q10 13 16 5 Z" style={s}/>
          <ellipse cx="14" cy="17" rx="2" ry="3" fill="white" opacity="0.3" transform="rotate(-20 14 17)"/>
        </svg>
      );
    case "pink": // heart
      return (
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <Splatter hex={hex} dots={[[2,8,1],[3,24,0.8],[29,7,1],[30,23,0.7],[16,1,0.9],[14,31,0.8],[26,27,0.7],[4,27,0.6]]} />
          <path d="M16 26 Q6 18 6 12 A5 5 0 0 1 16 10 A5 5 0 0 1 26 12 Q26 18 16 26 Z" style={s}/>
          <ellipse cx="12" cy="13" rx="2" ry="2.5" fill="white" opacity="0.3" transform="rotate(-30 12 13)"/>
        </svg>
      );
    case "burgundy": // wine glass
      return (
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <Splatter hex={hex} dots={[[2,7,1],[4,22,0.8],[28,6,1],[30,22,0.7],[16,1,0.8],[15,31,0.7],[27,28,0.6]]} />
          <path d="M10 5 Q10 16 16 20 Q22 16 22 5 Z" style={s}/>
          <line x1="16" y1="20" x2="16" y2="26" stroke={hex} strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M11 26 Q16 24 21 26" stroke={hex} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <ellipse cx="16" cy="11" rx="3" ry="2" fill="white" opacity="0.25"/>
        </svg>
      );
    case "brown": // mushroom
      return (
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <Splatter hex={hex} dots={[[2,8,1],[3,26,0.8],[29,7,1],[30,25,0.7],[16,1,0.9],[1,16,0.7],[31,17,0.7]]} />
          <path d="M7 17 Q7 8 16 8 Q25 8 25 17 Z" style={s}/>
          <rect x="12" y="17" width="8" height="8" rx="2" style={s}/>
          <circle cx="12" cy="13" r="2" fill="white" opacity="0.3"/>
          <circle cx="20" cy="11" r="1.5" fill="white" opacity="0.25"/>
        </svg>
      );
    case "gray": // cloud
      return (
        <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
          <Splatter hex={hex} dots={[[2,9,1],[3,25,0.8],[29,8,1],[30,24,0.7],[16,2,0.9],[1,17,0.7],[31,18,0.7]]} />
          <path d="M7 22 Q4 22 4 18 Q4 14 8 14 Q8 9 13 9 Q16 9 17 12 Q20 10 22 13 Q26 13 26 17 Q26 22 22 22 Z" style={s}/>
          <ellipse cx="12" cy="14" rx="2.5" ry="2" fill="white" opacity="0.3"/>
        </svg>
      );
    default:
      return <span className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: hex }} />;
  }
}

const SIZES = ["XS", "S", "M", "L", "XL"];
const BRUSH_PX: Record<string, number> = { XS: 4, S: 10, M: 18, L: 30, XL: 48 };

const STYLES = [
  { id: "round",  label: "Rounded", desc: "Soft & friendly"  },
  { id: "sharp",  label: "Sharp",   desc: "Clean & direct"   },
  { id: "pill",   label: "Pill",    desc: "Smooth & modern"  },
  { id: "dotted", label: "Dotted",  desc: "Spotted & playful"},
  { id: "paintbrush", label: "Paint Brush", desc: "Real bristle brush" },
  { id: "stars",  label: "Stars",   desc: "Stamp stars along path" },
];

function HoverOption({ onSelect, children, className, style: styleProp, activateOnClick = true }: {
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  activateOnClick?: boolean;
}) {
  const { onMouseEnter, onMouseLeave, progress } = useHoverSelect(onSelect);
  return (
    <button
      onClick={activateOnClick ? onSelect : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`relative overflow-hidden focus:outline-none ${className ?? ""}`}
      style={styleProp}
    >
      {children}
      {progress > 0 && (
        <span
          className="absolute bottom-0 left-0 h-0.5 pointer-events-none transition-none"
          style={{ width: `${progress * 100}%`, background: "currentColor", opacity: 0.4 }}
        />
      )}
    </button>
  );
}

const BRISTLE_COUNT = 12;

function drawBristles(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  hex: string,
  brushPx: number,
  seed: number[],
) {
  const spread = brushPx * 0.55;
  ctx.lineCap  = "round";
  for (let i = 0; i < BRISTLE_COUNT; i++) {
    const t      = i / (BRISTLE_COUNT - 1);
    const offset = (t - 0.5) * 2 * spread;
    const jitter = (seed[i] - 0.5) * brushPx * 0.18;
    const dx = to.y - from.y;
    const dy = from.x - to.x;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx  = (dx / len) * (offset + jitter);
    const ny  = (dy / len) * (offset + jitter);
    const opacity = 0.25 + (1 - Math.abs(t - 0.5) * 1.6) * 0.55;
    const width   = Math.max(0.5, brushPx * 0.12 * (1 - Math.abs(t - 0.5) * 0.9));
    ctx.globalAlpha  = opacity;
    ctx.strokeStyle  = hex;
    ctx.lineWidth    = width;
    ctx.beginPath();
    ctx.moveTo(from.x + nx, from.y + ny);
    ctx.lineTo(to.x   + nx, to.y   + ny);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, angle: number) {
  const points = 5;
  const inner  = r * 0.45;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a   = (i * Math.PI) / points - Math.PI / 2 + angle;
    const rad = i % 2 === 0 ? r : inner;
    const px  = x + rad * Math.cos(a);
    const py  = y + rad * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else         ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

const COLORING_PAGES = [
  { id: "blank", label: "Blank Canvas" },
  { id: "garden", label: "Happy Garden" },
  { id: "ocean", label: "Under the Sea" },
  { id: "space", label: "Space Adventure" },
];

const BACKGROUND_COLORS = [
  { label: "White", hex: "#FFFFFF" },
  { label: "Sky", hex: "#EAF6FF" },
  { label: "Sunshine", hex: "#FFF8D6" },
  { label: "Mint", hex: "#E9FAF0" },
  { label: "Blush", hex: "#FFF0F5" },
  { label: "Lavender", hex: "#F2EEFF" },
];

const DECORATION_OPTIONS = [
  { id: "star", label: "Star", group: "Shapes" },
  { id: "heart", label: "Heart", group: "Shapes" },
  { id: "diamond", label: "Diamond", group: "Shapes" },
  { id: "cat", label: "Cat", group: "Animals" },
  { id: "fish", label: "Fish", group: "Animals" },
  { id: "butterfly", label: "Butterfly", group: "Animals" },
  { id: "dots", label: "Dots", group: "Patterns" },
  { id: "waves", label: "Waves", group: "Patterns" },
  { id: "checks", label: "Checks", group: "Patterns" },
];

const DECORATION_COLORS = ["#FF3333", "#FF8C00", "#FFE135", "#4CAF50", "#2196F3", "#9C27B0", "#FF4081", "#374151"];

type BackgroundDecoration = {
  id: number;
  type: string;
  color: string;
  x: number;
  y: number;
};

function DecorationGraphic({ type, color }: { type: string; color: string }) {
  const line = { stroke: color, strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-sm" aria-hidden="true">
      {type === "star" && <polygon points="50,5 61,36 95,37 68,57 77,91 50,71 23,91 32,57 5,37 39,36" fill={color} />}
      {type === "heart" && <path d="M50 88 14 53C-8 31 20 3 42 23l8 8 8-8C80 3 108 31 86 53Z" fill={color} />}
      {type === "diamond" && <polygon points="50,5 92,50 50,95 8,50" fill={color} />}
      {type === "cat" && (
        <>
          <path d="M20 35 15 8 38 24Q50 18 62 24L85 8 80 35Q91 48 84 68 75 91 50 91T16 68Q9 48 20 35Z" fill={color} />
          <circle cx="35" cy="52" r="4" fill="white" /><circle cx="65" cy="52" r="4" fill="white" />
          <path d="M45 64h10l-5 6Z" fill="white" />
        </>
      )}
      {type === "fish" && (
        <>
          <path d="M12 50Q42 14 78 50 42 86 12 50Z" fill={color} />
          <path d="M75 50 96 27v46Z" fill={color} />
          <circle cx="32" cy="42" r="5" fill="white" />
        </>
      )}
      {type === "butterfly" && (
        <>
          <path d="M47 48Q22 2 6 24-3 50 42 58 8 68 20 91 42 102 49 62Z" fill={color} />
          <path d="M53 48Q78 2 94 24 103 50 58 58 92 68 80 91 58 102 51 62Z" fill={color} opacity="0.8" />
          <ellipse cx="50" cy="57" rx="5" ry="28" fill="#374151" />
        </>
      )}
      {type === "dots" && [18, 50, 82].flatMap(x => [18, 50, 82].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill={color} />))}
      {type === "waves" && [22, 50, 78].map(y => <path key={y} d={`M4 ${y}Q16 ${y-14} 28 ${y}T52 ${y}T76 ${y}T100 ${y}`} fill="none" {...line} />)}
      {type === "checks" && [0, 50].flatMap(x => [0, 50].map(y => <rect key={`${x}-${y}`} x={x} y={y} width="50" height="50" fill={color} opacity={(x + y) % 100 === 0 ? 0.9 : 0.35} />))}
    </svg>
  );
}

function DecorationLayer({ decorations }: { decorations: BackgroundDecoration[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {decorations.map(decoration => (
        <span
          key={decoration.id}
          className="absolute block h-16 w-16 -translate-x-1/2 -translate-y-1/2 opacity-75"
          style={{ left: `${decoration.x}%`, top: `${decoration.y}%` }}
        >
          <DecorationGraphic type={decoration.type} color={decoration.color} />
        </span>
      ))}
    </div>
  );
}

function ColoringTemplate({ id, preview = false }: { id: string; preview?: boolean }) {
  if (id === "blank") {
    return preview ? (
      <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden="true">
        <rect x="3" y="3" width="114" height="74" rx="8" fill="#fff" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="5 4" />
      </svg>
    ) : null;
  }

  const strokeWidth = preview ? 3 : 4;
  const common = {
    fill: "white",
    stroke: "#374151",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 600 420"
      className={preview ? "h-full w-full" : "absolute inset-0 z-20 h-full w-full pointer-events-none"}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {id === "garden" && (
        <>
          <circle cx="500" cy="78" r="42" {...common} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
            const rad = (angle * Math.PI) / 180;
            return <line key={angle} x1={500 + Math.cos(rad) * 54} y1={78 + Math.sin(rad) * 54} x2={500 + Math.cos(rad) * 73} y2={78 + Math.sin(rad) * 73} {...common} />;
          })}
          <path d="M55 105 Q80 68 110 102 Q137 62 168 105 Q154 129 112 127 Q72 130 55 105Z" {...common} />
          <path d="M0 350 Q95 317 190 350 T380 350 T600 350 V420 H0Z" {...common} />
          <path d="M300 350 V220" {...common} />
          {[0, 72, 144, 216, 288].map(angle => (
            <ellipse key={angle} cx="300" cy="185" rx="34" ry="58" transform={`rotate(${angle} 300 220)`} {...common} />
          ))}
          <circle cx="300" cy="220" r="34" {...common} />
          <path d="M300 292 Q250 255 238 306 Q270 323 300 292Z M300 315 Q345 275 365 320 Q335 340 300 315Z" {...common} />
          <path d="M105 250 Q150 205 195 250 Q150 285 105 250Z M150 212 V288" {...common} />
          <circle cx="135" cy="244" r="5" fill="#374151" />
          <circle cx="165" cy="244" r="5" fill="#374151" />
        </>
      )}
      {id === "ocean" && (
        <>
          <path d="M0 80 Q55 45 110 80 T220 80 T330 80 T440 80 T550 80 T660 80" fill="none" stroke="#374151" strokeWidth={strokeWidth} />
          <path d="M0 350 Q75 318 150 350 T300 350 T450 350 T600 350 V420 H0Z" {...common} />
          <path d="M145 215 Q225 142 325 215 Q225 288 145 215Z M145 215 88 165 V265Z" {...common} />
          <circle cx="286" cy="202" r="8" fill="#374151" />
          <path d="M260 230 Q280 245 300 228" fill="none" stroke="#374151" strokeWidth={strokeWidth} />
          <path d="M350 125 Q405 82 460 125 Q405 168 350 125Z M460 125 505 90 V160Z" {...common} />
          <circle cx="375" cy="117" r="6" fill="#374151" />
          {[{x:90,y:120,r:14},{x:115,y:82,r:9},{x:480,y:230,r:16},{x:515,y:195,r:8}].map((bubble, i) => (
            <circle key={i} {...bubble} {...common} />
          ))}
          <path d="M70 365 Q45 295 80 255 Q105 310 90 365 M500 365 Q545 305 520 260 Q480 305 485 365 M545 370 Q570 330 560 290" fill="none" stroke="#374151" strokeWidth={strokeWidth} />
          <path d="M250 365 Q270 320 290 365 M265 365 Q300 320 320 365" fill="none" stroke="#374151" strokeWidth={strokeWidth} />
        </>
      )}
      {id === "space" && (
        <>
          <circle cx="105" cy="105" r="55" {...common} />
          <ellipse cx="105" cy="105" rx="90" ry="24" transform="rotate(-12 105 105)" {...common} />
          <path d="M335 282 Q320 168 390 75 Q460 168 445 282Z" {...common} />
          <path d="M335 250 290 300 342 290 M445 250 490 300 438 290" {...common} />
          <circle cx="390" cy="165" r="34" {...common} />
          <path d="M365 282 Q390 355 415 282Z" {...common} />
          <path d="M370 335 350 382 390 357 430 382 410 335" {...common} />
          {[[210,90],[510,85],[205,260],[530,240],[85,300]].map(([x,y], i) => (
            <polygon key={i} points={`${x},${y-18} ${x+5},${y-5} ${x+19},${y-5} ${x+8},${y+4} ${x+12},${y+18} ${x},${y+10} ${x-12},${y+18} ${x-8},${y+4} ${x-19},${y-5} ${x-5},${y-5}`} {...common} />
          ))}
        </>
      )}
    </svg>
  );
}

export default function App() {
  const [color, setColor]         = useState("red");
  const [colorOpen, setColorOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [sizeOpen,  setSizeOpen]  = useState(false);
  const [size,  setSize]          = useState("M");
  const [style, setStyle]         = useState("round");
  const [dotLength, setDotLength] = useState(2);
  const [erasing, setErasing]     = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [paintEnabled, setPaintEnabled] = useState(false);
  const [coloringPage, setColoringPage] = useState("blank");
  const [bookOpen, setBookOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState("#FFFFFF");
  const [mirrorBackground, setMirrorBackground] = useState("#FFFFFF");
  const [mirrorBackgroundOpen, setMirrorBackgroundOpen] = useState(false);
  const [showBackgroundShapes, setShowBackgroundShapes] = useState(false);
  const [decorationType, setDecorationType] = useState("star");
  const [decorationColor, setDecorationColor] = useState("#FF3333");
  const [decorations, setDecorations] = useState<BackgroundDecoration[]>([]);
  const [selectedDecorationId, setSelectedDecorationId] = useState<number | null>(null);

  const active  = COLORS.find(c => c.id === color) ?? COLORS[0];
  const brushPx = BRUSH_PX[size];
  const radius  = style === "round" ? "12px" : style === "sharp" ? "4px" : "999px";

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const mirrorRef    = useRef<HTMLCanvasElement>(null);
  const painting     = useRef(false);
  const bristleSeed  = useRef<number[]>(Array.from({ length: BRISTLE_COUNT }, Math.random));
  const lastPos    = useRef<{ x: number; y: number } | null>(null);
  const idleTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const decorationId = useRef(0);

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      painting.current = false;
      lastPos.current = null;
      setPaintEnabled(false);
      idleTimer.current = null;
    }, 1500);
  };

  const armPainting = () => {
    if (!hasStarted) return;
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    painting.current = false;
    lastPos.current = null;
    setPaintEnabled(true);
  };

  useEffect(() => {
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  const syncMirror = useCallback(() => {
    try {
      const src = canvasRef.current;
      const dst = mirrorRef.current;
      if (!src || !dst) return;
      const ctx = dst.getContext("2d");
      if (!ctx) return;
      if (dst.width !== src.width || dst.height !== src.height) {
        dst.width  = src.width;
        dst.height = src.height;
      }
      ctx.clearRect(0, 0, dst.width, dst.height);
      ctx.drawImage(src, 0, 0);
    } catch { /* ignore */ }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    if ("touches" in e) {
      if (!e.touches.length) return null;
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    const me = (e as React.MouseEvent).nativeEvent;
    return { x: me.offsetX, y: me.offsetY };
  };

  const draw = useCallback((to: { x: number; y: number }) => {
    try {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !lastPos.current) return;

    if (erasing) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(to.x, to.y, brushPx, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      lastPos.current = to;
      syncMirror();
      return;
    }

    if (style === "paintbrush") {
      drawBristles(ctx, lastPos.current, to, active.hex, brushPx, bristleSeed.current);
    } else {
      ctx.globalAlpha = 0.9;
      ctx.lineWidth   = brushPx;
      ctx.strokeStyle = active.hex;

      if (style === "dotted" || style === "stars") {
        const from = lastPos.current;
        const dx   = to.x - from.x;
        const dy   = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const gap  = style === "stars" ? brushPx * dotLength * 2 : brushPx * dotLength * 1.5;
        const steps = Math.max(1, Math.floor(dist / gap));
        ctx.fillStyle = active.hex;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const px = from.x + dx * t;
          const py = from.y + dy * t;
          if (style === "stars") {
            drawStar(ctx, px, py, brushPx * 0.8, (Math.random() * Math.PI) / 5);
          } else {
            ctx.beginPath();
            ctx.arc(px, py, brushPx / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        ctx.lineCap = style === "sharp" ? "square" : "round";
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    }

    lastPos.current = to;
    syncMirror();
    } catch { /* ignore */ }
  }, [active.hex, brushPx, style, dotLength, syncMirror, erasing]);

  const startPaint = (e: React.MouseEvent | React.TouchEvent) => {
    try {
      if (!hasStarted || !paintEnabled) return;
      const pos = getPos(e);
      if (!pos) return;
      painting.current = true;
      lastPos.current  = pos;
      resetIdleTimer();
      bristleSeed.current = Array.from({ length: BRISTLE_COUNT }, Math.random);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        if (erasing) {
          ctx.globalCompositeOperation = "destination-out";
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(lastPos.current.x, lastPos.current.y, brushPx, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        } else if (style === "paintbrush") {
          const dot = { x: lastPos.current.x + 0.1, y: lastPos.current.y };
          drawBristles(ctx, lastPos.current, dot, active.hex, brushPx, bristleSeed.current);
        } else {
          ctx.fillStyle   = active.hex;
          ctx.globalAlpha = 0.9;
          if (style === "stars") {
            drawStar(ctx, lastPos.current.x, lastPos.current.y, brushPx * 0.8, 0);
          } else {
            ctx.beginPath();
            ctx.arc(lastPos.current.x, lastPos.current.y, brushPx / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        syncMirror();
      }
    } catch { /* ignore */ }
  };

  const movePaint = (e: React.MouseEvent | React.TouchEvent) => {
    try {
      const isTouch = "touches" in e;
      if (!hasStarted || !paintEnabled || (isTouch && !painting.current)) return;
      const to = getPos(e);
      if (!to) return;
      resetIdleTimer();
      if (!lastPos.current) {
        lastPos.current = to;
        painting.current = true;
        bristleSeed.current = Array.from({ length: BRISTLE_COUNT }, Math.random);
        return;
      }
      const dx = to.x - lastPos.current.x;
      const dy = to.y - lastPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) < 8) return;
      draw(to);
    } catch { /* ignore */ }
  };

  const stopPaint = () => {
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
    painting.current = false;
    lastPos.current  = null;
  };


  // Keep canvas pixel dimensions in sync with its CSS size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let resizeFrame: number | null = null;
    const resize = () => {
      if (resizeFrame !== null) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        try {
          const rect = canvas.getBoundingClientRect();
          const w = Math.round(rect.width);
          const h = Math.round(rect.height);
          if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
            canvas.width = w;
            canvas.height = h;
          }
        } catch { /* ignore */ }
      });
    };
    resize();
    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(resize);
      ro.observe(canvas);
    } catch { /* ignore */ }
    return () => {
      try {
        ro?.disconnect();
        if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      } catch { /* ignore */ }
    };
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const mctx = mirrorRef.current?.getContext("2d");
    if (mctx && mirrorRef.current) mctx.clearRect(0, 0, mirrorRef.current.width, mirrorRef.current.height);
    armPainting();
  };

  return (
    <div className="min-h-full bg-white flex flex-col relative overflow-hidden" style={{ padding: "16px 20px" }}>
      {/* Decorative background */}
      {showBackgroundShapes && <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 1200 800">
        {/* ── Stars ── */}
        <polygon className="bg-shape bg-shape-1"  points="40,8 42.4,15.2 50,15.2 44,19.8 46.4,27 40,22.4 33.6,27 36,19.8 30,15.2 37.6,15.2" fill="#FFE135"/>
        <polygon className="bg-shape bg-shape-2"  points="92,55 93.5,59.6 98.4,59.6 94.4,62.4 95.9,67 92,64.2 88.1,67 89.6,62.4 85.6,59.6 90.5,59.6" fill="#FF3333"/>
        <polygon className="bg-shape bg-shape-3"  points="15,200 16.8,205.4 22.5,205.4 17.8,208.6 19.6,214 15,210.8 10.4,214 12.2,208.6 7.5,205.4 13.2,205.4" fill="#3F51B5"/>
        <polygon className="bg-shape bg-shape-4"  points="75,12 76.2,15.7 80.1,15.7 77,18 78.2,21.7 75,19.4 71.8,21.7 73,18 69.9,15.7 73.8,15.7" fill="#9C27B0"/>
        <polygon className="bg-shape bg-shape-5"  points="200,50 203,59 212,59 205,65 208,74 200,68 192,74 195,65 188,59 197,59" fill="#FF3333"/>
        <polygon className="bg-shape bg-shape-6"  points="350,20 352.4,27.2 360,27.2 354,31.8 356.4,39 350,34.4 343.6,39 346,31.8 340,27.2 347.6,27.2" fill="#2196F3"/>
        <polygon className="bg-shape bg-shape-7"  points="500,60 501.5,64.6 506.4,64.6 502.4,67.4 503.9,72 500,69.2 496.1,72 497.6,67.4 493.6,64.6 498.5,64.6" fill="#4CAF50"/>
        <polygon className="bg-shape bg-shape-8"  points="650,10 653,19 662,19 655,25 658,34 650,28 642,34 645,25 638,19 647,19" fill="#FF8C00"/>
        <polygon className="bg-shape bg-shape-9"  points="800,45 801.8,50.4 807.5,50.4 802.8,53.6 804.6,59 800,55.8 795.4,59 797.2,53.6 792.5,50.4 798.2,50.4" fill="#FF3333"/>
        <polygon className="bg-shape bg-shape-10" points="950,25 952.4,32.2 960,32.2 954,36.8 956.4,44 950,39.4 943.6,44 946,36.8 940,32.2 947.6,32.2" fill="#3F51B5"/>
        <polygon className="bg-shape bg-shape-11" points="1100,8 1102.4,15.2 1110,15.2 1104,19.8 1106.4,27 1100,22.4 1093.6,27 1096,19.8 1090,15.2 1097.6,15.2" fill="#FFE135"/>
        <polygon className="bg-shape bg-shape-12" points="1160,55 1161.5,59.6 1166.4,59.6 1162.4,62.4 1163.9,67 1160,64.2 1156.1,67 1157.6,62.4 1153.6,59.6 1158.5,59.6" fill="#9C27B0"/>
        <polygon className="bg-shape bg-shape-13" points="60,350 63,359 72,359 65,365 68,374 60,368 52,374 55,365 48,359 57,359" fill="#2196F3"/>
        <polygon className="bg-shape bg-shape-14" points="1140,350 1142.4,357.2 1150,357.2 1144,361.8 1146.4,369 1140,364.4 1133.6,369 1136,361.8 1130,357.2 1137.6,357.2" fill="#FF3333"/>
        <polygon className="bg-shape bg-shape-15" points="30,500 32.4,507.2 40,507.2 34,511.8 36.4,519 30,514.4 23.6,519 26,511.8 20,507.2 27.6,507.2" fill="#FF8C00"/>
        <polygon className="bg-shape bg-shape-16" points="1170,500 1171.5,504.6 1176.4,504.6 1172.4,507.4 1173.9,512 1170,509.2 1166.1,512 1167.6,507.4 1163.6,504.6 1168.5,504.6" fill="#4CAF50"/>
        <polygon className="bg-shape bg-shape-17" points="600,720 603,729 612,729 605,735 608,744 600,738 592,744 595,735 588,729 597,729" fill="#FF3333"/>
        <polygon className="bg-shape bg-shape-18" points="300,700 302.4,707.2 310,707.2 304,711.8 306.4,719 300,714.4 293.6,719 296,711.8 290,707.2 297.6,707.2" fill="#9C27B0"/>
        <polygon className="bg-shape bg-shape-19" points="900,750 902.4,757.2 910,757.2 904,761.8 906.4,769 900,764.4 893.6,769 896,761.8 890,757.2 897.6,757.2" fill="#FFE135"/>

        {/* ── Circles ── */}
        <circle className="bg-shape bg-shape-2"  cx="88"  cy="30"  r="8"  fill="#FF3333"/>
        <circle className="bg-shape bg-shape-4"  cx="20"  cy="120" r="5"  fill="#2196F3"/>
        <circle className="bg-shape bg-shape-6"  cx="160" cy="70"  r="12" fill="#FF8C00"/>
        <circle className="bg-shape bg-shape-8"  cx="5"   cy="20"  r="4"  fill="#4CAF50"/>
        <circle className="bg-shape bg-shape-10" cx="280" cy="35"  r="9"  fill="#FF3333"/>
        <circle className="bg-shape bg-shape-12" cx="430" cy="15"  r="6"  fill="#9C27B0"/>
        <circle className="bg-shape bg-shape-14" cx="560" cy="55"  r="14" fill="#3F51B5"/>
        <circle className="bg-shape bg-shape-16" cx="710" cy="25"  r="7"  fill="#FF3333"/>
        <circle className="bg-shape bg-shape-18" cx="860" cy="50"  r="5"  fill="#FFE135"/>
        <circle className="bg-shape bg-shape-20" cx="1020" cy="30" r="10" fill="#FF3333"/>
        <circle className="bg-shape bg-shape-1"  cx="1185" cy="20" r="6" fill="#2196F3"/>
        <circle className="bg-shape bg-shape-3"  cx="25"  cy="650" r="10" fill="#FF8C00"/>
        <circle className="bg-shape bg-shape-5"  cx="1185" cy="650" r="8" fill="#9C27B0"/>
        <circle className="bg-shape bg-shape-7"  cx="600" cy="780" r="14" fill="#3F51B5"/>
        <circle className="bg-shape bg-shape-9"  cx="150" cy="400" r="8"  fill="#FF3333"/>
        <circle className="bg-shape bg-shape-11" cx="1050" cy="400" r="10" fill="#FFE135"/>
        <circle className="bg-shape bg-shape-13" cx="400" cy="760" r="7"  fill="#FF3333"/>
        <circle className="bg-shape bg-shape-15" cx="800" cy="780" r="9"  fill="#4CAF50"/>
        <circle className="bg-shape bg-shape-17" cx="100" cy="770" r="6"  fill="#2196F3"/>
        <circle className="bg-shape bg-shape-19" cx="1100" cy="750" r="8" fill="#FF3333"/>

        {/* ── Triangles ── */}
        <polygon className="bg-shape bg-shape-3"  points="130,10 143,32 117,32" fill="#FF3333"/>
        <polygon className="bg-shape bg-shape-5"  points="8,280 18,298 -2,298" fill="#9C27B0"/>
        <polygon className="bg-shape bg-shape-7"  points="240,5 250,20 230,20" fill="#2196F3"/>
        <polygon className="bg-shape bg-shape-9"  points="480,30 492,50 468,50" fill="#4CAF50"/>
        <polygon className="bg-shape bg-shape-11" points="730,8 742,28 718,28" fill="#FF8C00"/>
        <polygon className="bg-shape bg-shape-13" points="1080,15 1092,35 1068,35" fill="#FF3333"/>
        <polygon className="bg-shape bg-shape-15" points="1190,280 1200,298 1180,298" fill="#3F51B5"/>
        <polygon className="bg-shape bg-shape-17" points="10,750 22,770 -2,770" fill="#FFE135"/>
        <polygon className="bg-shape bg-shape-19" points="1190,750 1202,770 1178,770" fill="#FF3333"/>
        <polygon className="bg-shape bg-shape-2"  points="600,5 612,22 588,22" fill="#9C27B0"/>
        <polygon className="bg-shape bg-shape-4"  points="300,780 312,798 288,798" fill="#2196F3"/>
        <polygon className="bg-shape bg-shape-6"  points="900,790 912,808 888,808" fill="#FF8C00"/>

        {/* ── Diamonds ── */}
        <polygon className="bg-shape bg-shape-4"  points="30,160 38,172 30,184 22,172" fill="#FFE135"/>
        <polygon className="bg-shape bg-shape-8"  points="1170,160 1178,172 1170,184 1162,172" fill="#3F51B5"/>
        <polygon className="bg-shape bg-shape-12" points="180,720 188,732 180,744 172,732" fill="#FF3333"/>
        <polygon className="bg-shape bg-shape-16" points="1020,730 1028,742 1020,754 1012,742" fill="#9C27B0"/>
        <polygon className="bg-shape bg-shape-20" points="600,400 610,414 600,428 590,414" fill="#FF8C00"/>
        <polygon className="bg-shape bg-shape-1"  points="420,680 428,692 420,704 412,692" fill="#2196F3"/>
        <polygon className="bg-shape bg-shape-5"  points="780,690 788,702 780,714 772,702" fill="#FF3333"/>
        <polygon className="bg-shape bg-shape-9"  points="100,310 108,322 100,334 92,322" fill="#4CAF50"/>
        <polygon className="bg-shape bg-shape-13" points="1100,310 1108,322 1100,334 1092,322" fill="#FFE135"/>

        {/* ── Small dots scattered ── */}
        <circle className="bg-shape bg-shape-5"  cx="170"  cy="40"  r="3"   fill="#FF3333"/>
        <circle className="bg-shape bg-shape-10" cx="320"  cy="60"  r="2.5" fill="#FF8C00"/>
        <circle className="bg-shape bg-shape-15" cx="460"  cy="40"  r="3.5" fill="#FFE135"/>
        <circle className="bg-shape bg-shape-20" cx="620"  cy="35"  r="2"   fill="#9C27B0"/>
        <circle className="bg-shape bg-shape-3"  cx="760"  cy="55"  r="3"   fill="#2196F3"/>
        <circle className="bg-shape bg-shape-7"  cx="880"  cy="20"  r="2.5" fill="#4CAF50"/>
        <circle className="bg-shape bg-shape-11" cx="1040" cy="55"  r="3"   fill="#FF3333"/>
        <circle className="bg-shape bg-shape-16" cx="1150" cy="35"  r="2"   fill="#3F51B5"/>
        <circle className="bg-shape bg-shape-2"  cx="50"   cy="420" r="3"   fill="#FF8C00"/>
        <circle className="bg-shape bg-shape-6"  cx="1155" cy="420" r="3"   fill="#FF3333"/>
        <circle className="bg-shape bg-shape-14" cx="70"   cy="580" r="2.5" fill="#FFE135"/>
        <circle className="bg-shape bg-shape-18" cx="1130" cy="580" r="2.5" fill="#9C27B0"/>
        <circle className="bg-shape bg-shape-4"  cx="200"  cy="790" r="3"   fill="#FF3333"/>
        <circle className="bg-shape bg-shape-8"  cx="500"  cy="795" r="2.5" fill="#3F51B5"/>
        <circle className="bg-shape bg-shape-12" cx="700"  cy="792" r="3"   fill="#2196F3"/>
        <circle className="bg-shape bg-shape-19" cx="1000" cy="788" r="2"   fill="#FF3333"/>

        {/* ── Squiggles ── */}
        <path className="bg-shape bg-shape-1"  d="M50 90 Q60 80 70 90 Q80 100 90 90" stroke="#FF3333" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path className="bg-shape bg-shape-4"  d="M5 170 Q15 160 25 170 Q35 180 45 170" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path className="bg-shape bg-shape-7"  d="M5 250 Q15 240 25 250 Q35 260 45 250" stroke="#3F51B5" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path className="bg-shape bg-shape-10" d="M1155 90 Q1165 80 1175 90 Q1185 100 1195 90" stroke="#FFE135" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path className="bg-shape bg-shape-13" d="M1155 170 Q1165 160 1175 170 Q1185 180 1195 170" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path className="bg-shape bg-shape-16" d="M1155 250 Q1165 240 1175 250 Q1185 260 1195 250" stroke="#FF3333" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path className="bg-shape bg-shape-19" d="M250 790 Q260 780 270 790 Q280 800 290 790" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path className="bg-shape bg-shape-2"  d="M450 795 Q460 785 470 795 Q480 805 490 795" stroke="#FF3333" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path className="bg-shape bg-shape-6"  d="M710 792 Q720 782 730 792 Q740 802 750 792" stroke="#FF8C00" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path className="bg-shape bg-shape-11" d="M910 788 Q920 778 930 788 Q940 798 950 788" stroke="#3F51B5" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path className="bg-shape bg-shape-14" d="M350 5 Q365 -5 380 5 Q395 15 410 5" stroke="#FF3333" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path className="bg-shape bg-shape-17" d="M790 8 Q805 -2 820 8 Q835 18 850 8" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" fill="none"/>

        {/* ── Plus / cross shapes ── */}
        <path className="bg-shape bg-shape-3"  d="M135 350 h10 M140 345 v10" stroke="#FF3333" strokeWidth="3" strokeLinecap="round"/>
        <path className="bg-shape bg-shape-8"  d="M1065 350 h10 M1070 345 v10" stroke="#3F51B5" strokeWidth="3" strokeLinecap="round"/>
        <path className="bg-shape bg-shape-12" d="M600 100 h10 M605 95 v10" stroke="#FFE135" strokeWidth="3" strokeLinecap="round"/>
        <path className="bg-shape bg-shape-18" d="M600 690 h10 M605 685 v10" stroke="#FF3333" strokeWidth="3" strokeLinecap="round"/>
        <path className="bg-shape bg-shape-5"  d="M270 200 h8 M274 196 v8" stroke="#9C27B0" strokeWidth="2.5" strokeLinecap="round"/>
        <path className="bg-shape bg-shape-9"  d="M930 200 h8 M934 196 v8" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round"/>
        <path className="bg-shape bg-shape-14" d="M270 580 h8 M274 576 v8" stroke="#2196F3" strokeWidth="2.5" strokeLinecap="round"/>
        <path className="bg-shape bg-shape-20" d="M930 580 h8 M934 576 v8" stroke="#FF8C00" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>}
      <div className="relative flex flex-col flex-1" style={{ zIndex: 1 }}>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-3">

        {/* Color dropdown */}
        <div
          className="relative flex-1"
          onWheel={e => {
            const idx = COLORS.findIndex(c => c.id === color);
            const next = (idx + (e.deltaY > 0 ? 1 : -1) + COLORS.length) % COLORS.length;
            setColor(COLORS[next].id);
            armPainting();
          }}
        >
          <HoverOption
            onSelect={() => { setColorOpen(o => !o); setMirrorBackgroundOpen(false); }}
            className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1.5 hover:bg-gray-200 transition-colors w-full"
          >
            <span
              className="relative flex-1 inline-flex items-center justify-center h-12 rounded-md overflow-hidden"
              style={{ background: "linear-gradient(to right, #FF3333, #FF8C00, #FFE135, #4CAF50, #2196F3, #3F51B5, #9C27B0)" }}
            >
              <span className="font-bold text-white text-sm tracking-widest drop-shadow" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.35)" }}>
                PICK YOUR COLOR!
              </span>
              <svg width="24" height="24" viewBox="0 0 36 36" fill="none" className="ml-2 flex-shrink-0 drop-shadow">
                <circle cx="18" cy="18" r="17" fill="white" opacity="0.85"/>
                <circle cx="13" cy="14" r="2.5" fill="#333"/>
                <circle cx="23" cy="14" r="2.5" fill="#333"/>
                <path d="M11 22 Q18 29 25 22" stroke="#333" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
              </svg>
            </span>
            <span className="w-3 h-3 rounded-full border border-white/60 shadow-sm flex-shrink-0" style={{ background: active.hex }} />
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform flex-shrink-0 ${colorOpen ? "rotate-180" : ""}`}>
              <path d="M1 1l4 4 4-4" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </HoverOption>

          {colorOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20 grid grid-cols-2 gap-1 w-[min(420px,calc(100vw-40px))]">
              {COLORS.map(c => (
                <HoverOption
                  key={c.id}
                  onSelect={() => { setColor(c.id); setColorOpen(false); armPainting(); }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-left w-full min-w-0"
                >
                  <span className="flex-shrink-0 [&_svg]:w-10 [&_svg]:h-10"><ColorIcon id={c.id} hex={c.hex} /></span>
                  <span className="text-sm text-gray-600 truncate">{c.label}</span>
                  {color === c.id && (
                    <svg className="ml-auto" width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 4.5" stroke={c.hex} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </HoverOption>
              ))}
            </div>
          )}

        </div>

        {/* Shape, brush size, preview chip, clear */}
          {/* Shape dropdown */}
          <div className="relative flex-1">
            <HoverOption
              onSelect={() => { setStyleOpen(o => !o); setSizeOpen(false); setMirrorBackgroundOpen(false); }}
              className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1.5 hover:bg-gray-200 transition-colors w-full"
            >
              <span className="relative flex-1 inline-flex items-center justify-between h-12 rounded-md overflow-hidden px-3" style={{ background: "#1a1a2e" }}>
                {/* Paint splashes */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 48" preserveAspectRatio="none" aria-hidden="true">
                  <ellipse cx="18" cy="24" rx="16" ry="12" fill="#FF3333" opacity="0.85" transform="rotate(-15 18 24)"/>
                  <ellipse cx="14" cy="30" rx="6" ry="4" fill="#FF3333" opacity="0.6" transform="rotate(20 14 30)"/>
                  <circle cx="30" cy="14" r="4" fill="#FF3333" opacity="0.5"/>
                  <circle cx="6" cy="12" r="3" fill="#FF3333" opacity="0.4"/>

                  <ellipse cx="60" cy="26" rx="14" ry="10" fill="#FF8C00" opacity="0.85" transform="rotate(10 60 26)"/>
                  <ellipse cx="70" cy="38" rx="5" ry="3" fill="#FF8C00" opacity="0.55" transform="rotate(-20 70 38)"/>
                  <circle cx="74" cy="16" r="3.5" fill="#FF8C00" opacity="0.45"/>

                  <ellipse cx="105" cy="22" rx="15" ry="11" fill="#FFE135" opacity="0.9" transform="rotate(-8 105 22)"/>
                  <ellipse cx="95" cy="36" rx="5" ry="3" fill="#FFE135" opacity="0.55"/>
                  <circle cx="118" cy="34" r="3" fill="#FFE135" opacity="0.45"/>

                  <ellipse cx="150" cy="26" rx="14" ry="10" fill="#4CAF50" opacity="0.85" transform="rotate(12 150 26)"/>
                  <ellipse cx="162" cy="38" rx="5" ry="3" fill="#4CAF50" opacity="0.5" transform="rotate(-15 162 38)"/>
                  <circle cx="138" cy="14" r="3.5" fill="#4CAF50" opacity="0.45"/>

                  <ellipse cx="194" cy="23" rx="15" ry="11" fill="#2196F3" opacity="0.85" transform="rotate(-10 194 23)"/>
                  <ellipse cx="183" cy="36" rx="5" ry="3" fill="#2196F3" opacity="0.55"/>
                  <circle cx="206" cy="36" r="3" fill="#2196F3" opacity="0.45"/>

                  <ellipse cx="236" cy="25" rx="13" ry="10" fill="#3F51B5" opacity="0.85" transform="rotate(8 236 25)"/>
                  <ellipse cx="247" cy="37" rx="5" ry="3" fill="#3F51B5" opacity="0.5"/>
                  <circle cx="224" cy="13" r="3" fill="#3F51B5" opacity="0.45"/>

                  <ellipse cx="276" cy="24" rx="14" ry="10" fill="#9C27B0" opacity="0.85" transform="rotate(-12 276 24)"/>
                  <ellipse cx="285" cy="36" rx="5" ry="3.5" fill="#9C27B0" opacity="0.55"/>
                  <circle cx="264" cy="35" r="3" fill="#9C27B0" opacity="0.4"/>
                </svg>

                {/* Style name + dashed line */}
                <span className="relative z-10 flex items-center gap-2 ml-auto">
                  <svg width="48" height="8" viewBox="0 0 48 8" fill="none">
                    {style === "dotted"
                      ? <>{[0,10,20,30,40].map(x => <circle key={x} cx={x+4} cy="4" r="3" fill="white" opacity="0.9"/>)}</>
                      : style === "stars"
                      ? <>{[0,12,24,36].map(x => <polygon key={x} points={`${x+6},1 ${x+7.2},4.5 ${x+11},4.5 ${x+8},6.5 ${x+9},10 ${x+6},8 ${x+3},10 ${x+4},6.5 ${x+1},4.5 ${x+4.8},4.5`} fill="white" opacity="0.9"/>)}</>
                      : style === "paintbrush"
                      ? <>{[0,1,2,3,4,5,6].map(i => <line key={i} x1="0" y1={i+1} x2="48" y2={i+1} stroke="white" strokeWidth="0.7" opacity={0.18 + (1 - Math.abs(i/6-0.5)*2)*0.55} strokeLinecap="round"/>)}</>
                      : <line x1="0" y1="4" x2="48" y2="4" stroke="white" strokeWidth="2.5" strokeDasharray={style === "sharp" ? "none" : "6 3"} strokeLinecap={style === "pill" ? "round" : "square"} opacity="0.9"/>
                    }
                  </svg>
                  <span className="font-bold text-white text-sm tracking-wide drop-shadow" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}>
                    {STYLES.find(s => s.id === style)?.label}
                  </span>
                </span>
              </span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform flex-shrink-0 ${styleOpen ? "rotate-180" : ""}`}>
                <path d="M1 1l4 4 4-4" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </HoverOption>
            {styleOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20 flex flex-col gap-1 min-w-[200px]">
                {STYLES.map(st => (
                  <HoverOption
                    key={st.id}
                    onSelect={() => { setStyle(st.id); setStyleOpen(false); armPainting(); }}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-left w-full text-sm transition-colors ${style === st.id ? "bg-gray-100 text-gray-800" : "hover:bg-gray-50 text-gray-600"}`}
                  >
                    <span>{st.label}</span>
                    {style === st.id && (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5L13 4.5" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </HoverOption>
                ))}
              </div>
            )}
          </div>

          {(style === "dotted" || style === "stars") && (
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <span className="whitespace-nowrap">Spacing</span>
              <input
                type="range"
                min={1}
                max={8}
                step={0.5}
                value={dotLength}
                onChange={e => setDotLength(Number(e.target.value))}
                className="w-20 accent-gray-400 cursor-pointer"
              />
              <span className="w-4 text-right">{dotLength}×</span>
            </label>
          )}

          {/* Size dropdown */}
          <div className="relative flex-1">
            <HoverOption
              onSelect={() => { setSizeOpen(o => !o); setStyleOpen(false); setMirrorBackgroundOpen(false); }}
              className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1.5 hover:bg-gray-200 transition-colors w-full"
            >
              <span className="relative flex-1 inline-flex items-center justify-between h-12 rounded-md overflow-hidden px-3" style={{ background: "#0d1117" }}>
                {/* Mixed paint blobs */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 48" preserveAspectRatio="none" aria-hidden="true">
                  <ellipse cx="20" cy="32" rx="22" ry="16" fill="#FF3333" opacity="0.8" transform="rotate(-20 20 32)"/>
                  <ellipse cx="10" cy="18" rx="10" ry="7" fill="#FF8C00" opacity="0.75" transform="rotate(15 10 18)"/>
                  <ellipse cx="45" cy="28" rx="20" ry="13" fill="#FFE135" opacity="0.7" transform="rotate(10 45 28)"/>
                  <ellipse cx="38" cy="10" rx="8" ry="5" fill="#4CAF50" opacity="0.65" transform="rotate(-10 38 10)"/>
                  <ellipse cx="75" cy="30" rx="18" ry="12" fill="#4CAF50" opacity="0.72" transform="rotate(-15 75 30)"/>
                  <ellipse cx="68" cy="12" rx="9" ry="6" fill="#2196F3" opacity="0.65"/>
                  <ellipse cx="105" cy="26" rx="16" ry="11" fill="#2196F3" opacity="0.75" transform="rotate(12 105 26)"/>
                  <ellipse cx="118" cy="40" rx="7" ry="4" fill="#3F51B5" opacity="0.6"/>
                  <ellipse cx="140" cy="22" rx="18" ry="13" fill="#3F51B5" opacity="0.72" transform="rotate(-8 140 22)"/>
                  <ellipse cx="130" cy="40" rx="8" ry="5" fill="#9C27B0" opacity="0.6"/>
                  <ellipse cx="168" cy="30" rx="16" ry="11" fill="#9C27B0" opacity="0.75" transform="rotate(14 168 30)"/>
                  <ellipse cx="178" cy="12" rx="7" ry="5" fill="#FF3333" opacity="0.55"/>
                  {/* Right half stays lighter for text legibility */}
                  <rect x="190" y="0" width="110" height="48" fill="#0d1117" opacity="0.55"/>
                </svg>

                {/* Size dot + label */}
                <span className="relative z-10 flex items-center gap-3 ml-auto">
                  <span
                    className="rounded-full flex-shrink-0"
                    style={{
                      width:  Math.min(BRUSH_PX[size] * 1.4, 36),
                      height: Math.min(BRUSH_PX[size] * 1.4, 36),
                      background: active.hex,
                      boxShadow: `0 0 8px 2px ${active.hex}88`,
                    }}
                  />
                  <span className="font-bold text-white text-sm tracking-wide drop-shadow" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
                    {size} — {BRUSH_PX[size]}px
                  </span>
                </span>
              </span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform flex-shrink-0 ${sizeOpen ? "rotate-180" : ""}`}>
                <path d="M1 1l4 4 4-4" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </HoverOption>
            {sizeOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-20 flex flex-col gap-1 min-w-[200px]">
                {SIZES.map(s => (
                  <HoverOption
                    key={s}
                    onSelect={() => { setSize(s); setSizeOpen(false); armPainting(); }}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-left w-full text-sm transition-colors ${size === s ? "bg-gray-100 text-gray-800" : "hover:bg-gray-50 text-gray-600"}`}
                  >
                    <span>{s} — {BRUSH_PX[s]}px</span>
                    {size === s && (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5L13 4.5" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </HoverOption>
                ))}
              </div>
            )}
          </div>

          {/* Coloring book */}
          <div className="relative flex-shrink-0">
            <HoverOption
              onSelect={() => {
                setBookOpen(open => !open);
                setColorOpen(false);
                setStyleOpen(false);
                setSizeOpen(false);
                setMirrorBackgroundOpen(false);
              }}
              className="flex h-12 w-[104px] items-center justify-center gap-2 rounded-md border-2 border-violet-200 bg-violet-50 px-2 text-violet-700 transition-colors hover:bg-violet-100"
            >
              <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 3.5h5.2c1 0 1.8.8 1.8 1.8v11.2c0-1-.8-1.8-1.8-1.8H3V3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M17 3.5h-5.2c-1 0-1.8.8-1.8 1.8v11.2c0-1 .8-1.8 1.8-1.8H17V3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] font-bold leading-tight tracking-wide">COLORING<br />BOOK</span>
            </HoverOption>
            {bookOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 grid w-[min(440px,calc(100vw-40px))] grid-cols-2 gap-2 rounded-xl border border-violet-100 bg-white p-3 shadow-xl">
                {COLORING_PAGES.map(page => (
                  <HoverOption
                    key={page.id}
                    onSelect={() => {
                      setColoringPage(page.id);
                      setBookOpen(false);
                      clearCanvas();
                    }}
                    className={`rounded-lg border p-2 text-left transition-colors ${
                      coloringPage === page.id
                        ? "border-violet-400 bg-violet-50"
                        : "border-gray-100 hover:border-violet-200 hover:bg-violet-50/50"
                    }`}
                  >
                    <span className="block h-20 overflow-hidden rounded-md bg-white">
                      <ColoringTemplate id={page.id} preview />
                    </span>
                    <span className="mt-1.5 block text-center text-xs font-semibold text-gray-600">{page.label}</span>
                  </HoverOption>
                ))}
              </div>
            )}
          </div>

          <HoverOption
            onSelect={() => {
              setCustomOpen(true);
              setBookOpen(false);
              setColorOpen(false);
              setStyleOpen(false);
              setSizeOpen(false);
              setMirrorBackgroundOpen(false);
            }}
            className="flex h-12 w-[92px] flex-shrink-0 items-center justify-center gap-2 rounded-md border-2 border-sky-200 bg-sky-50 px-2 text-sky-700 transition-colors hover:bg-sky-100"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 5h12M4 10h12M4 15h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="8" cy="5" r="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="13" cy="10" r="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="7" cy="15" r="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className="text-[10px] font-bold leading-tight tracking-wide">CANVAS<br />BACKGROUND</span>
          </HoverOption>

          <div className="relative flex-shrink-0">
            <HoverOption
              onSelect={() => {
                setMirrorBackgroundOpen(open => !open);
                setBookOpen(false);
                setColorOpen(false);
                setStyleOpen(false);
                setSizeOpen(false);
              }}
              className="flex h-12 w-[104px] items-center justify-center gap-2 rounded-md border-2 border-amber-200 bg-amber-50 px-2 text-amber-700 transition-colors hover:bg-amber-100"
            >
              <span
                className="h-6 w-6 flex-shrink-0 rounded-md border-2 border-white shadow-sm ring-1 ring-amber-300"
                style={{ background: mirrorBackground }}
              />
              <span className="text-[10px] font-bold leading-tight tracking-wide">MIRROR<br />BACKGROUND</span>
            </HoverOption>
            {mirrorBackgroundOpen && (
              <div className="absolute right-0 top-full z-40 mt-1 w-64 rounded-xl border border-amber-100 bg-white p-3 shadow-xl">
                <p className="text-xs font-bold tracking-wide text-slate-700">Mirror background</p>
                <p className="mt-1 text-[11px] text-slate-400">Background color for the mirror (right-hand) canvas.</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {BACKGROUND_COLORS.map(background => (
                    <HoverOption
                      key={background.hex}
                      onSelect={() => {
                        setMirrorBackground(background.hex);
                        setMirrorBackgroundOpen(false);
                      }}
                      className={`rounded-lg border p-1.5 text-center text-[10px] font-semibold text-slate-500 ${
                        mirrorBackground === background.hex ? "border-amber-500 ring-2 ring-amber-100" : "border-slate-100 hover:border-amber-300"
                      }`}
                    >
                      <span className="mx-auto mb-1 block h-8 w-full rounded-md border border-black/5" style={{ background: background.hex }} />
                      {background.label}
                    </HoverOption>
                  ))}
                </div>
                <label className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-600">
                  Custom color
                  <input
                    type="color"
                    value={mirrorBackground}
                    onChange={event => setMirrorBackground(event.target.value.toUpperCase())}
                    className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0"
                    aria-label="Custom mirror background color"
                  />
                </label>
              </div>
            )}
          </div>

          <HoverOption
            onSelect={clearCanvas}
            className="relative flex-shrink-0 h-12 rounded-md overflow-hidden hover:scale-105 transition-transform active:scale-95"
            style={{ width: 80 }}
          >
            {/* Rainbow splatter SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 48" fill="none" aria-hidden="true">
              {/* Base blobs */}
              <ellipse cx="20" cy="28" rx="18" ry="14" fill="#FF3333" opacity="0.9" transform="rotate(-25 20 28)"/>
              <ellipse cx="8"  cy="14" rx="8"  ry="5"  fill="#FF3333" opacity="0.6" transform="rotate(15 8 14)"/>
              <circle  cx="34" cy="8"  r="5"          fill="#FF3333" opacity="0.5"/>

              <ellipse cx="42" cy="32" rx="16" ry="11" fill="#FF8C00" opacity="0.85" transform="rotate(15 42 32)"/>
              <ellipse cx="55" cy="14" rx="7"  ry="5"  fill="#FF8C00" opacity="0.6" transform="rotate(-10 55 14)"/>
              <circle  cx="28" cy="40" r="4"           fill="#FF8C00" opacity="0.5"/>

              <ellipse cx="62" cy="26" rx="15" ry="10" fill="#FFE135" opacity="0.9" transform="rotate(-12 62 26)"/>
              <ellipse cx="72" cy="40" rx="6"  ry="4"  fill="#FFE135" opacity="0.6"/>
              <circle  cx="50" cy="42" r="3.5"         fill="#FFE135" opacity="0.5"/>

              <ellipse cx="30" cy="20" rx="13" ry="9"  fill="#4CAF50" opacity="0.8" transform="rotate(10 30 20)"/>
              <circle  cx="14" cy="40" r="4"           fill="#4CAF50" opacity="0.55"/>

              <ellipse cx="58" cy="38" rx="12" ry="8"  fill="#2196F3" opacity="0.8" transform="rotate(-18 58 38)"/>
              <circle  cx="70" cy="12" r="5"           fill="#2196F3" opacity="0.55"/>

              <ellipse cx="10" cy="34" rx="10" ry="7"  fill="#3F51B5" opacity="0.75" transform="rotate(20 10 34)"/>
              <circle  cx="44" cy="44" r="3"           fill="#3F51B5" opacity="0.5"/>

              <ellipse cx="48" cy="14" rx="12" ry="8"  fill="#9C27B0" opacity="0.8" transform="rotate(-8 48 14)"/>
              <circle  cx="22" cy="6"  r="4"           fill="#9C27B0" opacity="0.55"/>

              {/* Drip drops */}
              <ellipse cx="5"  cy="44" rx="3" ry="4" fill="#FF3333" opacity="0.7"/>
              <ellipse cx="75" cy="6"  rx="2.5" ry="3.5" fill="#9C27B0" opacity="0.65"/>
              <ellipse cx="36" cy="46" rx="2" ry="3" fill="#2196F3" opacity="0.6"/>
            </svg>

            {/* "CLEAR" label on top */}
            <span className="relative z-10 flex items-center justify-center h-full font-bold text-white text-xs tracking-widest drop-shadow" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
              CLEAR
            </span>
          </HoverOption>

          {/* Eraser button */}
          <HoverOption
            onSelect={() => {
              setErasing(e => !e);
              armPainting();
            }}
            className="relative flex-shrink-0 h-12 rounded-md overflow-hidden hover:scale-105 transition-transform active:scale-95"
            style={{ width: 64, background: erasing ? "#e91e8c" : "#fce4ec", border: erasing ? "2px solid #f48fb1" : "2px solid #f8bbd0" }}

          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 48" fill="none" aria-hidden="true">
              {/* Eraser body */}
              <rect x="10" y="16" width="36" height="20" rx="4" fill={erasing ? "#f48fb1" : "#f8bbd0"} opacity="0.95"/>
              <rect x="10" y="16" width="14" height="20" rx="4" fill={erasing ? "#e91e8c" : "#f48fb1"}/>
              {/* Eraser highlight */}
              <rect x="12" y="18" width="10" height="5" rx="2" fill="white" opacity="0.4"/>
              {/* Stroke mark being erased */}
              <path d="M20 30 Q30 26 44 30" stroke={erasing ? "#fff" : "#e91e8c"} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" strokeDasharray="3 3"/>
            </svg>
            <span
              className="relative z-10 flex items-center justify-center h-full font-bold text-xs tracking-widest"
              style={{ color: erasing ? "#fff" : "#c2185b", textShadow: erasing ? "0 1px 4px rgba(0,0,0,0.4)" : "none" }}
            >
              ERASE
            </span>
          </HoverOption>

          {/* Finish drawing button */}
          {hasStarted && (
            <HoverOption
              onSelect={() => {
                stopPaint();
                setPaintEnabled(false);
                setHasStarted(false);
              }}
              className="relative flex-shrink-0 h-12 rounded-md overflow-hidden border-2 border-emerald-600 bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105 transition-all active:scale-95"
              style={{ width: 80 }}
            >
              <span className="relative z-10 flex h-full items-center justify-center gap-1.5 font-bold text-xs tracking-widest drop-shadow">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <rect x="1.5" y="1.5" width="10" height="10" rx="2" fill="currentColor" />
                </svg>
                FINISH
              </span>
            </HoverOption>
          )}
      </div>

      {/* Canvases — main + mirror side by side */}
      <div className="flex-1 flex gap-3 min-h-0" style={{ margin: "0 40px 40px" }}>
        <div className="flex-1 rounded-2xl overflow-hidden border-2 border-gray-300 relative" style={{ background: canvasBackground }}>
          <DecorationLayer decorations={decorations} />
          <canvas
            ref={canvasRef}
            className={`relative z-10 w-full h-full touch-none ${hasStarted ? "" : "pointer-events-none"}`}
            style={{ cursor: hasStarted ? (erasing ? "cell" : "crosshair") : "not-allowed", display: "block" }}
            aria-label="Painting canvas"
            aria-disabled={!hasStarted}
            onMouseDown={startPaint}
            onMouseMove={movePaint}
            onMouseUp={stopPaint}
            onMouseLeave={stopPaint}
            onTouchStart={startPaint}
            onTouchMove={movePaint}
            onTouchEnd={stopPaint}
          />
          <ColoringTemplate id={coloringPage} />
          {hasStarted && !paintEnabled && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-full border border-amber-200 bg-amber-50/95 px-4 py-2 text-xs font-bold tracking-wide text-amber-700 shadow-sm">
              PAUSED — PICK A TOOL TO CONTINUE
            </div>
          )}
          {!hasStarted && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/55 backdrop-blur-[2px]">
              <HoverOption
                onSelect={() => {
                  setHasStarted(true);
                  setPaintEnabled(true);
                }}
                activateOnClick={false}
                className="group relative overflow-hidden rounded-2xl px-8 py-4 font-bold text-white tracking-widest shadow-xl transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                style={{ background: "linear-gradient(100deg, #FF3333, #FF8C00, #4CAF50, #2196F3, #9C27B0)" }}
              >
                <span className="relative z-10 flex flex-col items-center gap-1 drop-shadow">
                  <span className="flex items-center gap-3">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M6.5 4.5 15 10l-8.5 5.5v-11Z" fill="currentColor" />
                    </svg>
                    START PAINTING
                  </span>
                  <span className="text-[10px] font-medium tracking-wider text-white/85">HOVER FOR 2 SECONDS</span>
                </span>
                <span className="absolute inset-0 translate-x-[-110%] skew-x-[-18deg] bg-white/25 transition-transform duration-500 group-hover:translate-x-[110%]" />
              </HoverOption>
            </div>
          )}
        </div>
        <div className="flex-1 rounded-2xl overflow-hidden border-2 border-gray-300 relative" style={{ background: mirrorBackground }}>
          <DecorationLayer decorations={decorations} />
          <canvas
            ref={mirrorRef}
            className="relative z-10 w-full h-full"
            style={{ display: "block" }}
          />
          <ColoringTemplate id={coloringPage} />
          <span className="absolute bottom-2 right-3 z-30 text-xs font-medium text-gray-300 tracking-widest select-none">MIRROR</span>
        </div>
      </div>
      </div>

      {customOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="background-customizer-title"
          onClick={() => setCustomOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/70 bg-white p-6 shadow-2xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-sky-600">CUSTOMIZE</p>
                <h2 id="background-customizer-title" className="mt-1 text-2xl font-bold text-slate-800">
                  How would you like to customize the canvas?
                </h2>
                <p className="mt-2 text-sm text-slate-500">Choose a canvas color and decide whether to show the colorful shapes.</p>
              </div>
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
                aria-label="Close background customizer"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-700">Canvas color</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {BACKGROUND_COLORS.map(background => (
                  <button
                    type="button"
                    key={background.hex}
                    onClick={() => setCanvasBackground(background.hex)}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left text-xs font-medium text-slate-600 transition-all ${
                      canvasBackground === background.hex ? "border-sky-500 ring-2 ring-sky-100" : "border-slate-200 hover:border-sky-300"
                    }`}
                  >
                    <span className="h-7 w-7 flex-shrink-0 rounded-lg border border-black/5" style={{ background: background.hex }} />
                    {background.label}
                  </button>
                ))}
              </div>
              <label className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-600">
                Pick a custom color
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">{canvasBackground.toUpperCase()}</span>
                  <input
                    type="color"
                    value={canvasBackground}
                    onChange={event => setCanvasBackground(event.target.value.toUpperCase())}
                    className="h-9 w-11 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label="Custom canvas background color"
                  />
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => setShowBackgroundShapes(show => !show)}
              className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50"
            >
              <span>
                <span className="block text-sm font-semibold text-slate-700">Colorful background shapes</span>
                <span className="block text-xs text-slate-400">Show the pulsing shapes around the canvases</span>
              </span>
              <span className={`relative h-6 w-11 rounded-full transition-colors ${showBackgroundShapes ? "bg-sky-500" : "bg-slate-200"}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${showBackgroundShapes ? "translate-x-6" : "translate-x-1"}`} />
              </span>
            </button>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Background decorations</p>
                  <p className="text-xs text-slate-400">Choose an item and color, then click the preview to place it.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDecorationId(null)}
                  className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100"
                >
                  Add another
                </button>
              </div>

              <div className="mt-3 grid grid-cols-9 gap-1.5">
                {DECORATION_OPTIONS.map(option => (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => {
                      setDecorationType(option.id);
                      setSelectedDecorationId(null);
                    }}
                    className={`rounded-xl border p-1.5 transition-colors ${
                      decorationType === option.id && selectedDecorationId === null
                        ? "border-sky-500 bg-sky-50"
                        : "border-slate-200 hover:border-sky-300"
                    }`}
                    title={`${option.group}: ${option.label}`}
                  >
                    <span className="mx-auto block h-9 w-9">
                      <DecorationGraphic type={option.id} color={decorationColor} />
                    </span>
                    <span className="mt-1 block truncate text-[9px] font-semibold text-slate-500">{option.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="mr-1 text-xs font-semibold text-slate-500">Color</span>
                {DECORATION_COLORS.map(colorOption => (
                  <button
                    type="button"
                    key={colorOption}
                    onClick={() => {
                      setDecorationColor(colorOption);
                      if (selectedDecorationId !== null) {
                        setDecorations(items => items.map(item => item.id === selectedDecorationId ? { ...item, color: colorOption } : item));
                      }
                    }}
                    className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      decorationColor === colorOption ? "border-slate-700 ring-2 ring-slate-200" : "border-white"
                    }`}
                    style={{ background: colorOption }}
                    aria-label={`Use ${colorOption}`}
                  />
                ))}
              </div>

              <div
                className="relative mt-4 h-44 cursor-crosshair overflow-hidden rounded-2xl border-2 border-dashed border-sky-200"
                style={{ background: canvasBackground }}
                onClick={event => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = Math.max(5, Math.min(95, ((event.clientX - rect.left) / rect.width) * 100));
                  const y = Math.max(8, Math.min(92, ((event.clientY - rect.top) / rect.height) * 100));
                  if (selectedDecorationId !== null) {
                    setDecorations(items => items.map(item => item.id === selectedDecorationId ? { ...item, x, y } : item));
                  } else {
                    decorationId.current += 1;
                    const id = decorationId.current;
                    setDecorations(items => [...items, { id, type: decorationType, color: decorationColor, x, y }]);
                    setSelectedDecorationId(id);
                  }
                }}
              >
                {decorations.length === 0 && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold text-sky-400">
                    Click anywhere to place your first decoration
                  </span>
                )}
                {decorations.map(decoration => (
                  <button
                    type="button"
                    key={decoration.id}
                    onClick={event => {
                      event.stopPropagation();
                      setSelectedDecorationId(decoration.id);
                      setDecorationType(decoration.type);
                      setDecorationColor(decoration.color);
                    }}
                    className={`absolute h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-xl p-1 ${
                      selectedDecorationId === decoration.id ? "ring-2 ring-sky-500 ring-offset-2" : "hover:ring-2 hover:ring-sky-200"
                    }`}
                    style={{ left: `${decoration.x}%`, top: `${decoration.y}%` }}
                    aria-label={`Select ${decoration.type} decoration`}
                  >
                    <DecorationGraphic type={decoration.type} color={decoration.color} />
                  </button>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-[11px] text-slate-400">
                  {selectedDecorationId === null ? "Choose an item, then click to place it." : "Selected item: click the preview to move it."}
                </p>
                <div className="flex gap-2">
                  {selectedDecorationId !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setDecorations(items => items.filter(item => item.id !== selectedDecorationId));
                        setSelectedDecorationId(null);
                      }}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                    >
                      Delete selected
                    </button>
                  )}
                  {decorations.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDecorations([]);
                        setSelectedDecorationId(null);
                      }}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setCanvasBackground("#FFFFFF");
                  setShowBackgroundShapes(false);
                  setDecorations([]);
                  setSelectedDecorationId(null);
                }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="flex-1 rounded-xl bg-sky-500 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-sky-600"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export { ErrorBoundary };
