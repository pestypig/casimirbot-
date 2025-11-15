import React, { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Loader2, Zap, Waves } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { useStressEnergyBrick } from "@/hooks/useStressEnergyBrick";
import { subscribe, unsubscribe } from "@/lib/luma-bus";
import type { StressEnergyBrickDecoded } from "@/lib/stress-energy-brick";
import HardwareConnectButton from "@/components/HardwareConnectButton";
import { useHardwareFeeds, type HardwareConnectHelp } from "@/hooks/useHardwareFeeds";
import { DEFAULT_T00_CHANNEL, DEFAULT_FLUX_CHANNEL } from "@/components/CurvatureVoxProvider";

const EPS = 1e-9;
const HIST_BINS = 36;

const ENERGY_FLUX_HELP: HardwareConnectHelp = {
  instruments: ["Flux probe array", "Casimir gap sensors", "DAQ / LabBridge"],
  feeds: [
    "GET /api/helix/stress-energy-brick (t00, S, div S) - canonical stress-energy volume feed",
    "Bus overlays: hull3d:t00-volume, hull3d:flux (publish Float32 textures directly to renderer)",
  ],
  notes: [
    "Panel now renders slices from the server-built stress-energy brick. Lab tools can push overrides over the same endpoint.",
    "When hardware feed is live, badges flip to 'Live' and overlays use your instrument or simulation data.",
  ],
  fileTypes: [".json"],
};

type StressBusBase = {
  dims: [number, number, number];
  stats?: StressEnergyBrickDecoded["stats"];
};

type StressBusT00Payload = StressBusBase & {
  t00: StressEnergyBrickDecoded["t00"];
};

type StressBusFluxPayload = StressBusBase & {
  flux: StressEnergyBrickDecoded["flux"];
};

type SliceStats = {
  dims: { nx: number; ny: number };
  density: { data: Float32Array; min: number; max: number };
  divergence: { data: Float32Array; min: number; max: number };
  ratio: {
    hist: number[];
    stableFraction: number;
    rms: number;
    maxAbs: number;
    total: number;
  };
};

export default function EnergyFluxPanel() {
  const { data: pipeline } = useEnergyPipeline();
  const stressQuery = useStressEnergyBrick({ quality: "low", refetchMs: 1500 });
  const { isLoading, isFetching, error: brickError } = stressQuery;
  const hardwareController = useHardwareFeeds({
    panelId: "energy-flux",
    panelTitle: "Energy Flux Stability",
    help: ENERGY_FLUX_HELP,
  });
  const [busT00, setBusT00] = useState<StressBusT00Payload | null>(null);
  const [busFlux, setBusFlux] = useState<StressBusFluxPayload | null>(null);

  useEffect(() => {
    const id = subscribe(DEFAULT_T00_CHANNEL, (payload: any) => {
      if (!payload || typeof payload !== "object") return;
      if (!payload.dims || !payload.t00) return;
      setBusT00(payload as StressBusT00Payload);
    });
    return () => unsubscribe(id);
  }, []);

  useEffect(() => {
    const id = subscribe(DEFAULT_FLUX_CHANNEL, (payload: any) => {
      if (!payload || typeof payload !== "object") return;
      if (!payload.dims || !payload.flux) return;
      setBusFlux(payload as StressBusFluxPayload);
    });
    return () => unsubscribe(id);
  }, []);

  const busSample = useMemo<StressEnergyBrickDecoded | null>(() => {
    if (!busT00 || !busFlux) return null;
    if (busT00.dims[0] !== busFlux.dims[0] || busT00.dims[1] !== busFlux.dims[1] || busT00.dims[2] !== busFlux.dims[2]) {
      return null;
    }
    const stats = busFlux.stats ?? busT00.stats ?? stressQuery.data?.stats;
    if (!stats) return null;
    return {
      dims: busT00.dims,
      t00: busT00.t00,
      flux: busFlux.flux,
      stats,
    };
  }, [busT00, busFlux, stressQuery.data]);

  const activeSample = busSample ?? stressQuery.data ?? null;
  const feedSource = busSample
    ? "bus"
    : stressQuery.data
      ? "query"
      : null;
  const slice = useMemo(() => computeSlice(activeSample), [activeSample]);

  const densityMagnitude = activeSample?.stats?.avgT00 ?? null;
  const fluxProxy = activeSample?.stats?.avgFluxMagnitude ?? null;
  const tsRatio = pipeline?.TS_ratio ?? null;
  const mode = pipeline?.currentMode ?? "unknown";
  const duty = pipeline?.dutyEffectiveFR ?? pipeline?.dutyCycle ?? 0;

  const panelStatus = useMemo(() => {
    const stablePct = slice ? Math.round((slice.ratio.stableFraction || 0) * 100) : null;
    return {
      stablePct,
      rms: slice ? slice.ratio.rms : null,
      maxAbs: slice ? slice.ratio.maxAbs : null,
      divergencePeak: slice ? Math.max(Math.abs(slice.divergence.min), Math.abs(slice.divergence.max)) : null,
    };
  }, [slice]);

  return (
    <Card className="h-full border-slate-800 bg-slate-950/70 text-slate-100">
      <CardHeader className="space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Activity className="h-5 w-5 text-cyan-300" />
              Energy Flux Stability
            </CardTitle>
            <CardDescription className="text-slate-400">
              Equatorial |T00| vs div S slices and the ratio R = (div S)/(epsilon + |T00|). Currently driven by the
              stress-energy brick feed.
            </CardDescription>
          </div>
          <HardwareConnectButton
            controller={hardwareController}
            buttonClassName="pointer-events-auto bg-emerald-500/20 text-emerald-100 border border-emerald-400/50 hover:bg-emerald-500/30"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <MetricTile
            icon={<Zap className="h-4 w-4 text-amber-400" />}
            label="|T00| (avg)"
            value={formatScientific(densityMagnitude)}
            hint="Cycle-averaged energy density from stress-energy tensor."
          />
          <MetricTile
            icon={<Waves className="h-4 w-4 text-sky-400" />}
            label="div S proxy"
            value={formatScientific(fluxProxy)}
            hint="Momentum-flux divergence derived from Natario stress proxy."
          />
          <MetricTile
            icon={<Activity className="h-4 w-4 text-emerald-400" />}
            label="TS ratio"
            value={tsRatio ? tsRatio.toFixed(2) : "-"}
            hint="Time-scale separation (TS) guardrail."
          />
        </section>

        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-xs">
          <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
            Mode: {mode}
          </Badge>
          <Badge variant="outline" className="border-slate-400/40 bg-slate-400/10 text-slate-100">
            Duty: {(duty * 100).toFixed(3)}%
          </Badge>
          <Badge
            variant="outline"
            className={
              hardwareController.isLive
                ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                : "border-slate-500/40 bg-slate-500/10 text-slate-200"
            }
          >
            {hardwareController.isLive ? "Live hardware feed" : "Simulated stress-energy feed"}
          </Badge>
          {feedSource && (
            <Badge
              variant="outline"
              className={
                feedSource === "bus"
                  ? "border-sky-400/60 bg-sky-400/10 text-sky-100"
                  : "border-slate-400/50 bg-slate-400/15 text-slate-100"
              }
            >
              Stress-energy source: {feedSource === "bus" ? "Hull3D bus" : "local query"}
            </Badge>
          )}
          {panelStatus.stablePct != null && (
            <Badge variant="outline" className="border-emerald-400/50 bg-emerald-400/10 text-emerald-200">
              Stable voxels: {panelStatus.stablePct}%
            </Badge>
          )}
          {panelStatus.rms != null && (
            <span className="text-slate-300/80">
              RMS(R): {panelStatus.rms.toFixed(3)} - |R|max: {panelStatus.maxAbs?.toFixed(2) ?? "-"}
            </span>
          )}
          {brickError && (
            <span className="text-rose-300">
              Slice unavailable: {brickError instanceof Error ? brickError.message : String(brickError)}
            </span>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <SliceCanvas
            label="Equatorial |T00| slice"
            subtitle="Heat compresses automatically"
            payload={slice?.density}
            dims={slice?.dims}
            palette="heat"
            loading={!slice && (isLoading || isFetching)}
          />
          <SliceCanvas
            label="Proxy div S slice"
            subtitle="Blue = inflow, Red = outflow"
            payload={slice?.divergence}
            dims={slice?.dims}
            palette="diverge"
            loading={!slice && (isLoading || isFetching)}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              <span>R histogram (div S / (epsilon + |T00|))</span>
              <span>
                Stable window &lt; 0.1 =&gt;{" "}
                {panelStatus.stablePct != null ? `${panelStatus.stablePct}%` : "-"}
              </span>
            </div>
            <RatioHistogram hist={slice?.ratio.hist} />
          </div>
          <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4 text-xs text-slate-300">
            <p className="font-semibold text-slate-100">Why watch R?</p>
            <p className="mt-1 leading-relaxed">
              R measures how quickly energy accumulates relative to |T00|. Near-zero regions indicate
              steady curvature pockets; sustained |R| &gt;&gt; 0.1 highlights pumping or bleeding sectors that
              deserve strobe or duty adjustments.
            </p>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function computeSlice(sample?: StressEnergyBrickDecoded | null): SliceStats | null {
  if (!sample?.t00?.data?.length) return null;
  const [nx, ny, nz] = sample.dims;
  if (!nx || !ny || !nz) return null;
  const sliceK = Math.floor(nz / 2);
  const planeSize = nx * ny;
  const baseOffset = sliceK * ny * nx;
  const densityData = new Float32Array(planeSize);
  const divergenceData = new Float32Array(planeSize);
  const ratioHist = new Array(HIST_BINS).fill(0);

  let densityMin = Number.POSITIVE_INFINITY;
  let densityMax = Number.NEGATIVE_INFINITY;
  let divMin = Number.POSITIVE_INFINITY;
  let divMax = Number.NEGATIVE_INFINITY;
  let stableCount = 0;
  let sampleCount = 0;
  let sumRatioSq = 0;
  let maxAbs = 0;

  const sampleValue = (x: number, y: number) => {
    const clampedX = Math.max(0, Math.min(nx - 1, x));
    const clampedY = Math.max(0, Math.min(ny - 1, y));
    const idx = baseOffset + clampedY * nx + clampedX;
    return sample.t00.data[idx] ?? 0;
  };

  const divergenceValue = (x: number, y: number) => {
    const clampedX = Math.max(0, Math.min(nx - 1, x));
    const clampedY = Math.max(0, Math.min(ny - 1, y));
    const idx = baseOffset + clampedY * nx + clampedX;
    return sample.flux.divS.data[idx] ?? 0;
  };

  let idx2d = 0;
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      const value = sampleValue(x, y);
      const absValue = Math.abs(value);
      densityData[idx2d] = absValue;
      densityMin = Math.min(densityMin, absValue);
      densityMax = Math.max(densityMax, absValue);

      const divergence = divergenceValue(x, y);
      divergenceData[idx2d] = divergence;
      divMin = Math.min(divMin, divergence);
      divMax = Math.max(divMax, divergence);

      const ratio = divergence / (absValue + EPS);
      const ratioClamped = Math.max(-1, Math.min(1, ratio));
      const bin = Math.min(
        HIST_BINS - 1,
        Math.max(0, Math.floor(((ratioClamped + 1) / 2) * HIST_BINS))
      );
      ratioHist[bin] += 1;
      if (Math.abs(ratio) < 0.1) stableCount += 1;
      sampleCount += 1;
      sumRatioSq += ratio * ratio;
      maxAbs = Math.max(maxAbs, Math.abs(ratio));

      idx2d += 1;
    }
  }

  if (!Number.isFinite(densityMin)) densityMin = 0;
  if (!Number.isFinite(densityMax)) densityMax = 0;
  if (!Number.isFinite(divMin)) divMin = 0;
  if (!Number.isFinite(divMax)) divMax = 0;

  return {
    dims: { nx, ny },
    density: { data: densityData, min: densityMin, max: densityMax },
    divergence: { data: divergenceData, min: divMin, max: divMax },
    ratio: {
      hist: ratioHist,
      stableFraction: sampleCount ? stableCount / sampleCount : 0,
      rms: sampleCount ? Math.sqrt(sumRatioSq / sampleCount) : 0,
      maxAbs,
      total: sampleCount,
    },
  };
}

type MetricTileProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
};

function MetricTile({ icon, label, value, hint }: MetricTileProps) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.04] p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
      <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
    </div>
  );
}

type SliceCanvasProps = {
  label: string;
  subtitle: string;
  payload?: { data: Float32Array; min: number; max: number } | null;
  dims?: { nx: number; ny: number };
  palette: "heat" | "diverge";
  loading?: boolean;
};

function SliceCanvas({ label, subtitle, payload, dims, palette, loading }: SliceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const width = dims?.nx ?? 128;
  const height = dims?.ny ?? 128;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload?.data?.length || !dims) return;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const image = ctx.createImageData(width, height);
    const [min, max] = [payload.min, payload.max];
    const span = Math.max(EPS, max - min);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx2d = y * width + x;
        const raw = payload.data[idx2d] ?? 0;
        const norm = Math.max(0, Math.min(1, (raw - min) / span));
        const [r, g, b] = palette === "heat" ? heatPalette(norm) : divergePalette(norm);
        const px = idx2d * 4;
        image.data[px] = r;
        image.data[px + 1] = g;
        image.data[px + 2] = b;
        image.data[px + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }, [payload, dims, palette, width, height]);

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-4">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>{label}</span>
        <span>{subtitle}</span>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="h-64 w-full rounded-lg border border-white/10 bg-slate-950"
        />
        {loading && (
          <div className="absolute inset-0 grid place-items-center rounded-lg bg-slate-950/70">
            <Loader2 className="h-6 w-6 animate-spin text-slate-200" />
          </div>
        )}
      </div>
    </div>
  );
}

type RatioHistogramProps = {
  hist?: number[] | null;
};

function RatioHistogram({ hist }: RatioHistogramProps) {
  if (!hist || !hist.length) {
    return (
      <div className="grid h-32 place-items-center text-slate-400">
        Histogram unavailable
      </div>
    );
  }
  const maxCount = hist.reduce((m, v) => Math.max(m, v), 0) || 1;
  return (
    <svg viewBox={`0 0 ${hist.length * 4} 100`} className="h-32 w-full">
      {hist.map((count, idx) => {
        const height = (count / maxCount) * 95;
        const x = idx * 4;
        const y = 100 - height;
        const ratio = (idx / hist.length) * 2 - 1;
        const color = Math.abs(ratio) < 0.1 ? "#34d399" : ratio > 0 ? "#f87171" : "#60a5fa";
        return <rect key={idx} x={x} y={y} width={3} height={height} fill={color} rx={0.4} />;
      })}
      <line
        x1={(hist.length / 2) * 4}
        x2={(hist.length / 2) * 4}
        y1={0}
        y2={100}
        stroke="rgba(255,255,255,0.2)"
        strokeDasharray="4 2"
      />
    </svg>
  );
}

function formatScientific(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "-";
  const abs = Math.abs(value);
  if (abs >= 1e3 || abs <= 1e-2) {
    return value.toExponential(2);
  }
  return value.toFixed(2);
}

function heatPalette(t: number): [number, number, number] {
  const clamp = Math.max(0, Math.min(1, t));
  const r = Math.round(255 * clamp);
  const g = Math.round(255 * Math.pow(clamp, 0.5));
  const b = Math.round(255 * Math.pow(clamp, 0.2) * 0.2);
  return [r, g, b];
}

function divergePalette(t: number): [number, number, number] {
  const clamp = Math.max(0, Math.min(1, t));
  const cold: [number, number, number] = [33, 82, 214];
  const mid: [number, number, number] = [250, 250, 250];
  const hot: [number, number, number] = [255, 92, 52];
  if (clamp < 0.5) {
    const u = clamp / 0.5;
    return [
      Math.round(cold[0] * (1 - u) + mid[0] * u),
      Math.round(cold[1] * (1 - u) + mid[1] * u),
      Math.round(cold[2] * (1 - u) + mid[2] * u),
    ];
  }
  const u = (clamp - 0.5) / 0.5;
  return [
    Math.round(mid[0] * (1 - u) + hot[0] * u),
    Math.round(mid[1] * (1 - u) + hot[1] * u),
    Math.round(mid[2] * (1 - u) + hot[2] * u),
  ];
}
