import * as React from "react";
import { gaussianSectorMask, smoothSectorWeights } from "@/lib/sector-weights";

export type SectorGridRingProps = {
  sectorsTotal: number;
  sectorsConcurrent?: number;
  currentSector?: number;
  weights?: number[];
  radiusPx?: number;
  thicknessRx?: number;
  alpha?: number;
  gain?: number;
  hueDeg?: number;
  showPhaseStreaks?: boolean;
  streakLen?: number;
  emaAlpha?: number;
  betaGradientVec?: [number, number, number] | undefined;
  floorLevel?: number;
  pulseSector?: number | null;
  onResolvedIndex?: (idx: number) => void;
  className?: string;
};

const TWO_PI = Math.PI * 2;
const DEFAULT_THICKNESS_RX = 0.015;
const DEFAULT_ALPHA = 0.85;
const DEFAULT_GAIN = 1;
const DEFAULT_HUE = 200;
const DEFAULT_STREAK_LEN = 2;
const DEFAULT_FLOOR = 0;
const nowMs = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const clampPositive = (value: number, fallback: number) => (Number.isFinite(value) && value > 0 ? value : fallback);
const clampInt = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  const n = Math.floor(value);
  return Math.max(min, Math.min(max, n));
};

function SectorGridRing(props: SectorGridRingProps): JSX.Element {
  const {
    sectorsTotal,
    sectorsConcurrent = 1,
    currentSector,
    weights,
    radiusPx,
    thicknessRx = DEFAULT_THICKNESS_RX,
    alpha = DEFAULT_ALPHA,
    gain = DEFAULT_GAIN,
    hueDeg = DEFAULT_HUE,
    showPhaseStreaks = false,
    streakLen = DEFAULT_STREAK_LEN,
    emaAlpha = 1,
    betaGradientVec,
    floorLevel = DEFAULT_FLOOR,
    pulseSector,
    onResolvedIndex,
    className,
  } = props;

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const emaRef = React.useRef<number[] | null>(null);
  const pulseLevelsRef = React.useRef<number[]>([]);
  const pulseTimestampRef = React.useRef<number>(nowMs());
  const [size, setSize] = React.useState<{ width: number; height: number }>({ width: 220, height: 220 });
  const [tick, setTick] = React.useState<number>(() => nowMs());

  React.useEffect(() => {
    if (Number.isFinite(currentSector)) return;
    if (typeof window === "undefined") return;
    let frame = 0;
    const step = () => {
      setTick(nowMs());
      frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [currentSector]);

  React.useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const applySize = () => {
      const rect = node.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    };
    applySize();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(applySize);
      observer.observe(node);
      return () => observer.disconnect();
    }
    const id = window.setInterval(applySize, 500);
    return () => window.clearInterval(id);
  }, []);

  const total = Math.max(1, Math.floor(sectorsTotal || 1));
  const concurrent = Math.max(1, Math.min(total, Math.floor(sectorsConcurrent || 1)));

  React.useEffect(() => {
    if (!emaRef.current || emaRef.current.length !== total) {
      emaRef.current = null;
    }
  }, [total]);

  React.useEffect(() => {
    if (pulseSector == null || !Number.isFinite(pulseSector)) return;
    const totalSectors = total;
    if (!pulseLevelsRef.current.length || pulseLevelsRef.current.length !== totalSectors) {
      pulseLevelsRef.current = new Array(totalSectors).fill(0);
    }
    const normalized = ((Number(pulseSector) % totalSectors) + totalSectors) % totalSectors;
    pulseLevelsRef.current[normalized] = 1;
    pulseTimestampRef.current = nowMs();
  }, [pulseSector, total]);

  const autoIdx = React.useMemo(() => {
    const dwellMsFromWindow =
      typeof window !== "undefined" && window?.helix && typeof window.helix === "object"
        ? Number((window as any).helix?.timing?.dwell_ms)
        : undefined;
    const dwellMs = clampPositive(dwellMsFromWindow ?? 1000, 250);
    const t = tick % dwellMs;
    const phase = t / dwellMs;
    const idx = Math.floor(phase * total) % total;
    return idx < 0 ? idx + total : idx;
  }, [tick, total]);

  const resolvedIndex = Number.isFinite(currentSector)
    ? clampInt(currentSector as number, 0, Math.max(0, total - 1))
    : autoIdx;

  React.useEffect(() => {
    if (typeof onResolvedIndex === "function") {
      onResolvedIndex(resolvedIndex);
    }
  }, [resolvedIndex, onResolvedIndex]);

  const betaScales = React.useMemo(() => {
    if (!betaGradientVec) return null;
    const [bx, by, bz] = betaGradientVec;
    const norm = Math.hypot(bx, by, bz) || 1;
    const nx = bx / norm;
    const ny = by / norm;
    const nz = bz / norm;
    const result: number[] = [];
    for (let i = 0; i < total; i++) {
      const angleMid = -Math.PI / 2 + (i + 0.5) * (TWO_PI / total);
      const dirX = Math.cos(angleMid);
      const dirY = Math.sin(angleMid);
      const dirZ = 0;
      const dot = dirX * nx + dirY * ny + dirZ * nz;
      const scale = 1 + 0.1 * Math.max(-1, Math.min(1, dot));
      result.push(scale);
    }
    return result;
  }, [betaGradientVec, total]);

  const visualWeights = React.useMemo(() => {
    if (!pulseLevelsRef.current.length || pulseLevelsRef.current.length !== total) {
      pulseLevelsRef.current = new Array(total).fill(0);
    }
    const now = nowMs();
    const dtPulse = Math.max(0, (now - pulseTimestampRef.current) / 1000);
    pulseTimestampRef.current = now;
    const pulseDecay = Math.exp(-dtPulse * 4);
    const pulses = pulseLevelsRef.current;
    for (let i = 0; i < total; i++) {
      pulses[i] *= pulseDecay;
    }
    let base: number[];
    if (Array.isArray(weights) && weights.length === total) {
      base = new Array(total);
      for (let i = 0; i < total; i++) {
        const v = Number(weights[i]);
        base[i] = Number.isFinite(v) && v > 0 ? v : 0;
      }
    } else {
      const sigmaForConcurrent = Math.max(0.45, concurrent * 0.55);
      base = gaussianSectorMask(total, resolvedIndex, concurrent, sigmaForConcurrent);
    }
    let normalizedSum = base.reduce((sum, value) => sum + value, 0);
    if (normalizedSum <= 0) {
      base[resolvedIndex] = 1;
      normalizedSum = 1;
    }
    const smoothed = smoothSectorWeights(base, 1.25);
    const streakReady = smoothed.slice();

    if (showPhaseStreaks && streakLen > 0) {
      const activeValue = streakReady[resolvedIndex] ?? 0;
      const length = Math.max(1, streakLen);
      for (let offset = 1; offset <= length; offset++) {
        const factor = Math.max(0, 1 - offset / (length + 1));
        const ahead = (resolvedIndex + offset) % total;
        const behind = (resolvedIndex - offset + total) % total;
        streakReady[ahead] = Math.max(streakReady[ahead], activeValue * factor);
        streakReady[behind] = Math.max(streakReady[behind], activeValue * factor);
      }
    }

    const emaBlend = clamp01(emaAlpha ?? 1);
    const prev = emaRef.current;
    const withPulses = streakReady.map((value, idx) => Math.max(value, pulses[idx] ?? 0));
    const blended: number[] = new Array(total);
    for (let i = 0; i < total; i++) {
      const target = withPulses[i] ?? 0;
      const prevValue = prev?.[i] ?? target;
      blended[i] = prevValue + (target - prevValue) * emaBlend;
    }
    emaRef.current = blended;
    return blended;
  }, [weights, total, concurrent, resolvedIndex, showPhaseStreaks, streakLen, emaAlpha]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const { width, height } = size;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    if (typeof (context as any).resetTransform === "function") {
      (context as any).resetTransform();
    } else {
      context.setTransform(1, 0, 0, 1, 0, 0);
    }
    context.scale(dpr, dpr);
    context.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.max(10, Math.min(width, height) * 0.5 - 6);
    const baseRadius = radiusPx ? Math.min(radiusPx, maxRadius) : maxRadius;
    const thicknessPx = Math.max(1.5, baseRadius * (thicknessRx ?? DEFAULT_THICKNESS_RX));
    const halfThickness = thicknessPx * 0.5;
    const innerR = Math.max(4, baseRadius - halfThickness);
    const outerR = Math.min(maxRadius, baseRadius + halfThickness);

    // Background ring
    context.beginPath();
    context.arc(cx, cy, outerR + 1, 0, TWO_PI);
    context.arc(cx, cy, innerR - 1, 0, TWO_PI, true);
    context.closePath();
    context.fillStyle = `hsla(${hueDeg}, 30%, 8%, ${alpha * 0.25})`;
    context.fill();

    // Sector wedges
    const maxWeight = visualWeights.reduce((max, value) => (value > max ? value : max), 0) || 1;
    const baseFloor = clamp01(floorLevel ?? DEFAULT_FLOOR);
    const gainEff = gain ?? DEFAULT_GAIN;

    for (let i = 0; i < total; i++) {
      const frac = total > 0 ? (visualWeights[i] ?? 0) / maxWeight : 0;
      const scaled = clamp01(baseFloor + gainEff * frac);
      if (scaled <= 1e-3) continue;
      const betaScale = betaScales ? betaScales[i] ?? 1 : 1;
      const intensity = clamp01(scaled * betaScale);

      const startAngle = -Math.PI / 2 + i * (TWO_PI / total);
      const endAngle = startAngle + TWO_PI / total;
      context.beginPath();
      context.arc(cx, cy, outerR, startAngle, endAngle, false);
      context.arc(cx, cy, innerR, endAngle, startAngle, true);
      context.closePath();

      const saturation = Math.round(30 + 55 * intensity);
      const lightness = Math.round(18 + 52 * intensity);
      context.fillStyle = `hsla(${hueDeg}, ${saturation}%, ${lightness}%, ${alpha * intensity})`;
      context.fill();

      context.lineWidth = Math.max(0.75, thicknessPx * 0.05);
      context.strokeStyle = `hsla(${hueDeg}, 90%, ${Math.round(65 + 20 * intensity)}%, ${0.45 * intensity})`;
      context.stroke();
    }

    // Sector dividers
    context.save();
    context.strokeStyle = `hsla(${hueDeg}, 35%, 25%, ${alpha * 0.35})`;
    context.lineWidth = Math.max(0.5, thicknessPx * 0.04);
    for (let i = 0; i < total; i++) {
      const angle = -Math.PI / 2 + i * (TWO_PI / total);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      context.beginPath();
      context.moveTo(cx + innerR * cos, cy + innerR * sin);
      context.lineTo(cx + outerR * cos, cy + outerR * sin);
      context.stroke();
    }
    context.restore();

    // Active wedge marker
    const activeMid = -Math.PI / 2 + (resolvedIndex + 0.5) * (TWO_PI / total);
    const markerRadius = outerR + Math.max(4, thicknessPx * 0.4);
    context.beginPath();
    context.moveTo(cx, cy);
    context.lineTo(cx + markerRadius * Math.cos(activeMid), cy + markerRadius * Math.sin(activeMid));
    context.strokeStyle = `hsla(${hueDeg}, 95%, 85%, ${alpha * 0.6})`;
    context.lineWidth = Math.max(1, thicknessPx * 0.2);
    context.stroke();
  }, [
    alpha,
    betaScales,
    gain,
    hueDeg,
    radiusPx,
    thicknessRx,
    resolvedIndex,
    size,
    total,
    visualWeights,
    floorLevel,
  ]);

  return (
    <div ref={containerRef} className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

export { SectorGridRing };
export default SectorGridRing;
