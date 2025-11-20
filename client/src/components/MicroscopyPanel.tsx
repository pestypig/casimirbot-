import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Scan, Target, ZoomIn, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMicroscopy } from "@/hooks/useMicroscopy";
import { useEnergyPipeline, type SystemMetrics, type TileDatum } from "@/hooks/use-energy-pipeline";

type LensState = {
  density: boolean;
  granules: boolean;
  flux: boolean;
  qi: boolean;
};

type MicroscopySample = {
  x: number;
  y: number;
  density: number;
  divergence: number;
  fluxMag: number;
};

type TileOverlayPoint = {
  px: number;
  py: number;
  severity: number;
};

const VIRIDIS: [number, number, number][] = [
  [68, 1, 84],
  [59, 82, 139],
  [33, 145, 140],
  [94, 201, 97],
  [253, 231, 37],
];

const DIVERGENCE_GRADIENT: [number, number, number][] = [
  [220, 38, 127],
  [49, 130, 206],
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const sampleGradient = (stops: [number, number, number][], t: number) => {
  const clamped = clamp(t, 0, 1);
  const scaled = clamped * (stops.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const nextIdx = Math.min(stops.length - 1, idx + 1);
  const start = stops[idx];
  const end = stops[nextIdx];
  return [
    Math.round(lerp(start[0], end[0], frac)),
    Math.round(lerp(start[1], end[1], frac)),
    Math.round(lerp(start[2], end[2], frac)),
  ];
};

const rasterizeDensity = (frame: ReturnType<typeof useMicroscopy>["frame"]) => {
  if (!frame) return null;
  const { density, dims } = frame;
  const image = new ImageData(dims.nx, dims.ny);
  const epsilon = 1e-9;
  const logMin = Math.log10(Math.max(epsilon, Math.abs(density.min)));
  const logMax = Math.log10(Math.max(epsilon, Math.abs(density.max)));
  const denom = Math.max(epsilon, logMax - logMin);
  for (let i = 0; i < density.data.length; i += 1) {
    const v = Math.abs(density.data[i]) + epsilon;
    const normalized = (Math.log10(v) - logMin) / denom;
    const [r, g, b] = sampleGradient(VIRIDIS, normalized);
    const ptr = i * 4;
    image.data[ptr + 0] = r;
    image.data[ptr + 1] = g;
    image.data[ptr + 2] = b;
    image.data[ptr + 3] = 255;
  }
  return image;
};

const rasterizeGranules = (frame: ReturnType<typeof useMicroscopy>["frame"]) => {
  if (!frame) return null;
  const { divergence, dims } = frame;
  const image = new ImageData(dims.nx, dims.ny);
  const maxAbs = Math.max(Math.abs(divergence.min), Math.abs(divergence.max), 1e-9);
  for (let i = 0; i < divergence.data.length; i += 1) {
    const normalized = clamp(0.5 + 0.5 * (divergence.data[i] / maxAbs), 0, 1);
    const [rLow, gLow, bLow] = DIVERGENCE_GRADIENT[0];
    const [rHigh, gHigh, bHigh] = DIVERGENCE_GRADIENT[1];
    const r = Math.round(lerp(rLow, rHigh, normalized));
    const g = Math.round(lerp(gLow, gHigh, normalized));
    const b = Math.round(lerp(bLow, bHigh, normalized));
    const ptr = i * 4;
    const alpha = Math.round(120 + 80 * Math.abs(normalized - 0.5));
    image.data[ptr + 0] = r;
    image.data[ptr + 1] = g;
    image.data[ptr + 2] = b;
    image.data[ptr + 3] = alpha;
  }
  return image;
};

const drawFluxVectors = (
  ctx: CanvasRenderingContext2D,
  frame: NonNullable<ReturnType<typeof useMicroscopy>["frame"]>,
) => {
  const stepX = Math.max(4, Math.floor(frame.dims.nx / 20));
  const stepY = Math.max(4, Math.floor(frame.dims.ny / 20));
  ctx.save();
  ctx.lineWidth = 0.8;
  for (let y = stepY / 2; y < frame.dims.ny; y += stepY) {
    for (let x = stepX / 2; x < frame.dims.nx; x += stepX) {
      const idx = Math.floor(y) * frame.dims.nx + Math.floor(x);
      const fx = frame.flux.vx[idx];
      const fy = frame.flux.vy[idx];
      const magnitude = frame.flux.mag[idx];
      if (!Number.isFinite(magnitude) || magnitude <= 0) continue;
      const norm = magnitude / Math.max(frame.flux.maxMag, 1e-9);
      const len = 4 + norm * 10;
      ctx.strokeStyle = `rgba(255,255,255,${0.15 + 0.45 * norm})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (fx / magnitude) * len, y - (fy / magnitude) * len);
      ctx.stroke();
    }
  }
  ctx.restore();
};

const drawTileOverlay = (ctx: CanvasRenderingContext2D, points: TileOverlayPoint[]) => {
  ctx.save();
  for (const point of points) {
    const severity = clamp(point.severity, 0, 1);
    const color =
      severity < 0.6
        ? [24, 210, 140]
        : severity < 0.85
          ? [255, 189, 68]
          : [255, 76, 76];
    const alpha = 0.18 + 0.35 * severity;
    ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
    ctx.beginPath();
    ctx.arc(point.px, point.py, 2 + severity * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

const useHelixMetrics = () =>
  useQuery<SystemMetrics>({
    queryKey: ["/api/helix/metrics"],
    refetchInterval: 5000,
    staleTime: 4500,
  });

export function MicroscopyPanel() {
  const { frame, isLoading, isFetching } = useMicroscopy({ quality: "medium", refetchMs: 2400 });
  const { data: pipeline } = useEnergyPipeline();
  const { data: systemMetrics } = useHelixMetrics();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lens, setLens] = useState<LensState>({
    density: true,
    granules: true,
    flux: false,
    qi: true,
  });
  const [view, setView] = useState({ zoom: 1.6, offsetX: 0, offsetY: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [probe, setProbe] = useState<MicroscopySample | null>(null);

  const densityImage = useMemo(() => rasterizeDensity(frame), [frame]);
  const granuleImage = useMemo(() => rasterizeGranules(frame), [frame]);

  const tileOverlay = useMemo<TileOverlayPoint[] | null>(() => {
    if (!frame || !systemMetrics?.tileData?.length) return null;
    const axesMeters = systemMetrics?.axes_m;
    const hullMeters = systemMetrics?.hull;
    const ax = ((axesMeters?.[0] ?? hullMeters?.Lx_m ?? 1000) as number) / 2;
    const ay = ((axesMeters?.[1] ?? hullMeters?.Ly_m ?? 260) as number) / 2;
    if (!Number.isFinite(ax) || !Number.isFinite(ay) || ax <= 0 || ay <= 0) return null;
    const qiBound = Math.abs(pipeline?.qi?.bound ?? 0) || null;
    const maxAbs = systemMetrics.tileData.reduce(
      (acc, tile) => Math.max(acc, Math.abs((tile as TileDatum).t00 ?? 0)),
      1e-9,
    );
    const points: TileOverlayPoint[] = [];
    for (const tile of systemMetrics.tileData) {
      const datum = tile as TileDatum;
      if (!datum?.pos) continue;
      const [x, y] = datum.pos;
      const normX = (x + ax) / Math.max(1e-6, ax * 2);
      const normY = 1 - (y + ay) / Math.max(1e-6, ay * 2);
      const px = clamp(normX, 0, 1) * (frame.dims.nx - 1);
      const py = clamp(normY, 0, 1) * (frame.dims.ny - 1);
      const reference = qiBound ?? maxAbs;
      const severity = clamp(Math.abs(datum.t00) / Math.max(reference, 1e-9), 0, 1.5);
      points.push({ px, py, severity });
    }
    return points;
  }, [frame, systemMetrics, pipeline?.qi?.bound]);

  const redraw = useCallback(() => {
    if (!frame || !canvasRef.current || !densityImage) return;
    const canvas = canvasRef.current;
    canvas.width = frame.dims.nx;
    canvas.height = frame.dims.ny;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(densityImage, 0, 0);
    if (lens.granules && granuleImage) {
      ctx.putImageData(granuleImage, 0, 0);
    }
    if (lens.flux) {
      drawFluxVectors(ctx, frame);
    }
    if (lens.qi && tileOverlay?.length) {
      drawTileOverlay(ctx, tileOverlay);
    }
  }, [frame, densityImage, granuleImage, lens, tileOverlay]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    setView((prev) => ({
      ...prev,
      zoom: clamp(prev.zoom * factor, 0.6, 8),
    }));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY, offsetX: view.offsetX, offsetY: view.offsetY };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragging && dragStart.current) {
      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;
      setView((prev) => ({
        ...prev,
        offsetX: dragStart.current!.offsetX + dx,
        offsetY: dragStart.current!.offsetY + dy,
      }));
    }
    if (canvasRef.current && frame) {
      const rect = canvasRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        setProbe(null);
        return;
      }
      const x = ((event.clientX - rect.left) / rect.width) * canvasRef.current.width;
      const y = ((event.clientY - rect.top) / rect.height) * canvasRef.current.height;
      if (Number.isNaN(x) || Number.isNaN(y)) {
        setProbe(null);
        return;
      }
      const ix = clamp(Math.floor(x), 0, frame.dims.nx - 1);
      const iy = clamp(Math.floor(y), 0, frame.dims.ny - 1);
      const idx = iy * frame.dims.nx + ix;
      setProbe({
        x: ix,
        y: iy,
        density: frame.density.data[idx],
        divergence: frame.divergence.data[idx],
        fluxMag: frame.flux.mag[idx],
      });
    }
  };

  const handlePointerUp = () => {
    setDragging(false);
    dragStart.current = null;
  };

  const handleLeave = () => {
    setDragging(false);
    dragStart.current = null;
    setProbe(null);
  };

  const zoomLabel = `${view.zoom.toFixed(1)}x`;
  const statusText = frame
    ? `${frame.dims.nx}x${frame.dims.ny} tiles | plane z=${frame.planeZ}`
    : "Fetching stress-energy slice...";

  return (
    <Card className="h-full border border-slate-800 bg-slate-950/70 text-slate-100">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold text-white">Microscopy Mode</CardTitle>
          <p className="text-xs text-slate-400">
            {statusText} {isFetching && <span className="ml-2 text-emerald-400">syncing...</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ZoomIn className="h-4 w-4" />
          <span>{zoomLabel}</span>
        </div>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap gap-3 text-xs">
          {(["density", "granules", "flux", "qi"] as (keyof LensState)[]).map((key) => (
            <label key={key} className="inline-flex items-center gap-1 capitalize text-slate-300">
              <input
                type="checkbox"
                className="rounded border-slate-600 bg-slate-900 text-emerald-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
                checked={lens[key]}
                onChange={() => setLens((state) => ({ ...state, [key]: !state[key] }))}
              />
              {key === "granules" ? "divPi" : key}
            </label>
          ))}
          {isLoading && (
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              acquiring...
            </span>
          )}
        </div>
        <div
          ref={containerRef}
          className={cn(
            "relative flex-1 overflow-hidden rounded-xl border border-slate-800 bg-black/40",
            dragging && "cursor-grabbing",
          )}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handleLeave}
        >
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0"
            style={{
              transformOrigin: "0 0",
              transform: `translate(${view.offsetX}px, ${view.offsetY}px) scale(${view.zoom})`,
            }}
          />
          {probe && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                left: 0,
                top: 0,
              }}
            >
              <div
                className="absolute h-px w-full bg-white/20"
                style={{ transform: `translateY(${probe.y * view.zoom + view.offsetY}px)` }}
              />
              <div
                className="absolute w-px bg-white/20"
                style={{ height: "100%", transform: `translateX(${probe.x * view.zoom + view.offsetX}px)` }}
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-4 rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Scan className="h-4 w-4 text-cyan-300" />
            <div>
              <div className="text-slate-400">|T00|</div>
              <div className="font-mono text-sm text-white">{probe ? probe.density.toExponential(3) : "--"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-300" />
            <div>
              <div className="text-slate-400">divPi</div>
              <div className="font-mono text-sm text-white">{probe ? probe.divergence.toExponential(3) : "--"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-300" />
            <div>
              <div className="text-slate-400">|S|</div>
              <div className="font-mono text-sm text-white">{probe ? probe.fluxMag.toExponential(3) : "--"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">QI margin</span>
            <span className="font-mono text-sm text-white">
              {pipeline?.qi?.margin != null ? pipeline.qi.margin.toExponential(3) : "--"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MicroscopyPanel;
