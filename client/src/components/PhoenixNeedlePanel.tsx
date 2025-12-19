import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { PhoenixBadge } from "./PhoenixBadge";
import { kappaDrive, lightCrossingAverage, normalizeSeries } from "@/lib/phoenixAveraging";
import { useEnergyPipeline, useUpdatePipeline, type EnergyPipelineState } from "@/hooks/use-energy-pipeline";
import { useHullPreviewPayload } from "@/hooks/use-hull-preview-payload";
import { loadHullMetricsFromGLB, type HullMetrics } from "@/lib/hull-metrics";
import { clampHullArea, clampHullDims, clampHullThickness, HULL_DIM_MAX_M, HULL_DIM_MIN_M } from "@/lib/hull-guardrails";
import { nanoid } from "nanoid";

type Heatmap = {
  image: Uint8ClampedArray;
  width: number;
  height: number;
  min: number;
  max: number;
  timeHorizon_s?: number;
  tauLC_s?: number;
};

type HeatmapConfig = {
  logScale: boolean;
  overlayBand: boolean;
};

const L_X = 1007;
const N_X = 480;
const T_STEPS = 120;
const DT = 0.025;
const WALL_THICKNESS_M = 0.02;
const LIGHT_SPEED = 299_792_458;

type PhoenixInputs = {
  dutyEffective: number;
  geometryGain: number;
  powerDensityBase: number;
  hullLength_m: number;
  wallThickness_m: number;
  sectorCount?: number;
  sectorsConcurrent?: number;
  tauLC_s?: number;
  burst_s?: number;
  dwell_s?: number;
  sectorPeriod_s?: number;
  tsRatio?: number;
  activeTiles?: number;
  totalTiles?: number;
  tileArea_m2?: number;
  hullArea_m2?: number;
  autoscaleGating?: string | null;
};

type PhoenixInputRow = {
  key: string;
  label: string;
  value: number;
  unit: string;
  source: string;
  fallback?: boolean;
};

type PhoenixLiveFlags = {
  tauLC: boolean;
  burst: boolean;
  dwell: boolean;
  sectorPeriod: boolean;
  tsRatio: boolean;
  powerDensity: boolean;
  sectorTiming: boolean;
  autoscaleGating?: string | null;
  shellLive: boolean;
};

type PhoenixInputsBundle = { inputs: PhoenixInputs; rows: PhoenixInputRow[]; live: PhoenixLiveFlags };

type CavitySpectrum = {
  wavelengths: Float64Array;
  transmission: number[];
  excluded: { lo: number; hi: number }[];
  pressure_Pa?: number;
  lc?: { burst_ms?: number; dwell_ms?: number; tauLC_ms?: number; onWindow?: boolean };
};

type ShellField = { values: Float64Array; width: number; height: number; hullRadiusPx?: number };

type HullLibraryEntry = {
  id: string;
  name: string;
  hull: { Lx_m: number; Ly_m: number; Lz_m: number; wallThickness_m?: number };
  hullAreaOverride_m2?: number;
  hullAreaOverride_uncertainty_m2?: number;
  hullAreaPerSector_m2?: number[];
  sectorCount?: number;
  glbUrl?: string;
  note?: string;
  source?: "preset" | "silhouette" | "glb";
};

const NEEDLE_PRESET: HullLibraryEntry = {
  id: "preset-needle-mk1",
  name: "Needle Hull (Mk1)",
  hull: { Lx_m: 1007, Ly_m: 264, Lz_m: 173 },
  source: "preset",
};

const normalizeHullDims = (dims: { Lx_m?: number; Ly_m?: number; Lz_m?: number }) => {
  const clamped = clampHullDims(dims);
  return {
    Lx_m: clamped.Lx_m ?? HULL_DIM_MIN_M,
    Ly_m: clamped.Ly_m ?? HULL_DIM_MIN_M,
    Lz_m: clamped.Lz_m ?? HULL_DIM_MIN_M,
  };
};

const buildHullPayload = (
  dims: { Lx_m?: number; Ly_m?: number; Lz_m?: number },
  wallThickness?: number | null,
  area?: number | null,
  areaUnc?: number | null,
  areaPerSector?: number[] | null,
) => {
  const clampedDims = clampHullDims(dims);
  const safeDims = {
    Lx_m: clampedDims.Lx_m ?? HULL_DIM_MIN_M,
    Ly_m: clampedDims.Ly_m ?? HULL_DIM_MIN_M,
    Lz_m: clampedDims.Lz_m ?? HULL_DIM_MIN_M,
  };
  const clampMessages: string[] = [];
  const noteClamp = (label: string, raw: unknown, clamped?: number, unit = " m", precision = 4) => {
    const rawNum = Number(raw);
    const clampedNum = Number(clamped);
    if (!Number.isFinite(rawNum) || !Number.isFinite(clampedNum)) return;
    if (Math.abs(rawNum - clampedNum) < 1e-12) return;
    clampMessages.push(`${label}->${clampedNum.toFixed(precision)}${unit}`);
  };

  const payload: any = {
    hull: {
      ...safeDims,
      a: safeDims.Lx_m * 0.5,
      b: safeDims.Ly_m * 0.5,
      c: safeDims.Lz_m * 0.5,
    },
  };

  noteClamp("Lx", dims.Lx_m, clampedDims.Lx_m);
  noteClamp("Ly", dims.Ly_m, clampedDims.Ly_m);
  noteClamp("Lz", dims.Lz_m, clampedDims.Lz_m);

  const wallClamped = clampHullThickness(wallThickness);
  if (wallClamped != null) {
    payload.hull.wallThickness_m = wallClamped;
    noteClamp("wallThickness", wallThickness, wallClamped);
  }

  const areaClamped = clampHullArea(area);
  if (areaClamped != null) {
    payload.hullAreaOverride_m2 = areaClamped;
    noteClamp("area", area, areaClamped, " m^2", 2);
  }
  const areaUncClamped = clampHullArea(areaUnc, true);
  if (areaUncClamped != null) {
    payload.hullAreaOverride_uncertainty_m2 = areaUncClamped;
    noteClamp("area_unc", areaUnc, areaUncClamped, " m^2", 2);
  }
  if (Array.isArray(areaPerSector)) {
    const cleaned = areaPerSector
      .map((v) => clampHullArea(v, true))
      .map((v) => (v != null && Number.isFinite(v) && (v as number) >= 0 ? (v as number) : 0));
    const sum = cleaned.reduce((acc, v) => acc + (Number.isFinite(v) ? (v as number) : 0), 0);
    if (sum > 0) {
      payload.hullAreaPerSector_m2 = cleaned;
    }
  }
  return { payload, clampMessages };
};

function PhoenixNeedlePanelInner() {
  const [logScale, setLogScale] = useState(true);
  const [overlayBand, setOverlayBand] = useState(true);
  const [hullGlbUrlInput, setHullGlbUrlInput] = useState<string>("/luma/Butler.glb");
  const [hullGlbUrl, setHullGlbUrl] = useState<string>("/luma/Butler.glb");
  const [hullTransform, setHullTransform] = useState<{
    scale: [number, number, number];
    rotQuat: [number, number, number, number];
    offset: [number, number, number];
    unitScale: number;
    areaUncertaintyRatio?: number;
    axisSwap?: { x?: "x" | "y" | "z"; y?: "x" | "y" | "z"; z?: "x" | "y" | "z" };
    axisFlip?: { x?: boolean; y?: boolean; z?: boolean };
  }>({
    scale: [1, 1, 1],
    rotQuat: [0, 0, 0, 1],
    offset: [0, 0, 0],
    unitScale: 1,
    areaUncertaintyRatio: 0.1,
    axisSwap: { x: "x", y: "y", z: "z" },
    axisFlip: { x: false, y: false, z: false },
  });
  const [hullMetrics, setHullMetrics] = useState<HullMetrics | null>(null);
  const [hullMetricsLoading, setHullMetricsLoading] = useState(false);
  const [hullMetricsError, setHullMetricsError] = useState<string | null>(null);
  const [targetDims, setTargetDims] = useState<{ Lx_m: number; Ly_m: number; Lz_m: number } | null>(null);
  const { data: pipeline } = useEnergyPipeline({ refetchInterval: 1000 });
  const updatePipeline = useUpdatePipeline();
  const [applyStatus, setApplyStatus] = useState<string | null>(null);
  const [clampNotice, setClampNotice] = useState<string | null>(null);
  const [hullLibrary, setHullLibrary] = useState<HullLibraryEntry[]>([]);
  const externalPreviewTsRef = useRef<number>(0);
  const clampNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hullPreview = useHullPreviewPayload();
  const previewArea_m2 = useMemo(() => clampHullArea(hullPreview?.area_m2), [hullPreview?.area_m2]);
  const previewAreaUnc_m2 = useMemo(() => clampHullArea(hullPreview?.areaUnc_m2, true), [hullPreview?.areaUnc_m2]);

  const phoenixInputs = useMemo(() => computePhoenixInputs(pipeline), [pipeline]);
  const spectrum = useMemo(() => buildCavityFilter(pipeline), [pipeline]);
  const shell = useMemo(() => buildHullShell(pipeline), [pipeline]);
  const heatmaps = useMemo(
    () => buildHeatmaps({ logScale, overlayBand }, phoenixInputs.inputs),
    [logScale, overlayBand, phoenixInputs.inputs],
  );

  const hullTransformKey = useMemo(() => JSON.stringify(hullTransform), [hullTransform]);

  const pipelineHullArea_m2 = useMemo(
    () => clampHullArea(finiteNumber((pipeline as any)?.hullArea_m2 ?? (pipeline as any)?.tiles?.hullArea_m2)) ?? undefined,
    [pipeline],
  );
  const pipelineHullAreaSource = useMemo(() => {
    const tag = typeof (pipeline as any)?.__hullAreaSource === "string" ? (pipeline as any).__hullAreaSource : undefined;
    if (pipelineHullArea_m2 != null) return tag ?? "pipeline.hullArea_m2";
    return tag ?? undefined;
  }, [pipeline, pipelineHullArea_m2]);

  const showClampNotice = useCallback((messages: string[]) => {
    if (clampNoticeTimerRef.current) {
      clearTimeout(clampNoticeTimerRef.current);
      clampNoticeTimerRef.current = null;
    }
    if (!messages.length) {
      setClampNotice(null);
      return;
    }
    setClampNotice(`Clamped: ${messages.join(", ")}`);
    clampNoticeTimerRef.current = setTimeout(() => setClampNotice(null), 4200);
  }, []);

  const hullApplyClampWarnings = useMemo(() => {
    if (!hullMetrics) return [];
    const wallThickness = finiteNumber((pipeline as any)?.hull?.wallThickness_m);
    const { clampMessages } = buildHullPayload(
      hullMetrics.dims_m,
      wallThickness,
      hullMetrics.area_m2,
      hullMetrics.areaUnc_m2,
      hullMetrics.areaPerSector_m2,
    );
    return clampMessages;
  }, [hullMetrics, pipeline?.hull?.wallThickness_m]);
  const hullAreaReady = hullMetrics != null && Number.isFinite(hullMetrics.area_m2);

  useEffect(() => {
    if (!hullPreview) return;
    const updatedAt = Number(hullPreview.updatedAt ?? 0);
    if (!Number.isFinite(updatedAt) || updatedAt <= externalPreviewTsRef.current) return;
    externalPreviewTsRef.current = updatedAt;
    const previewDims = hullPreview.targetDims ? normalizeHullDims(hullPreview.targetDims) : undefined;
    if (hullPreview.glbUrl) {
      setHullGlbUrlInput(hullPreview.glbUrl);
      setHullGlbUrl(hullPreview.glbUrl);
    }
    if (hullPreview.scale) {
      const nextScale: [number, number, number] = [
        Number(hullPreview.scale[0]) || 1,
        Number(hullPreview.scale[1]) || 1,
        Number(hullPreview.scale[2]) || 1,
      ];
      setHullTransform((prev) => ({ ...prev, scale: nextScale }));
    }
    if (previewDims) {
      setTargetDims(previewDims);
    }
    if (hullPreview.hullMetrics) {
      const dims = normalizeHullDims(hullPreview.hullMetrics.dims_m);
      if (dims) {
        const nextMetrics: HullMetrics = {
          dims_m: dims,
          area_m2: hullPreview.hullMetrics.area_m2,
          areaUnc_m2: hullPreview.hullMetrics.areaUnc_m2 ?? undefined,
          method: "OBB_PCA",
          triangleCount: hullPreview.hullMetrics.triangleCount ?? 0,
          vertexCount: hullPreview.hullMetrics.vertexCount ?? 0,
        };
        setHullMetrics(nextMetrics);
        setHullMetricsError(null);
        setHullMetricsLoading(false);
      }
    } else if (previewDims && previewArea_m2 != null) {
      const fallbackMetrics: HullMetrics = {
        dims_m: previewDims,
        area_m2: previewArea_m2,
        areaUnc_m2: previewAreaUnc_m2 ?? undefined,
        method: "OBB_PCA",
        triangleCount: 0,
        vertexCount: 0,
      };
      setHullMetrics(fallbackMetrics);
      setHullMetricsError(null);
      setHullMetricsLoading(false);
    }
  }, [hullPreview, previewArea_m2, previewAreaUnc_m2]);

  useEffect(() => {
    return () => {
      if (clampNoticeTimerRef.current) {
        clearTimeout(clampNoticeTimerRef.current);
      }
    };
  }, []);

  const addHullLibraryEntry = (entry: Omit<HullLibraryEntry, "id"> & { id?: string }) => {
    setHullLibrary((prev) => {
      const id = entry.id ?? nanoid(10);
      const areaOverride = clampHullArea(entry.hullAreaOverride_m2);
      const areaUnc = clampHullArea(entry.hullAreaOverride_uncertainty_m2, true);
      const sectorAreas = Array.isArray(entry.hullAreaPerSector_m2)
        ? entry.hullAreaPerSector_m2.map((v) => (Number.isFinite(v) && (v as number) >= 0 ? (v as number) : 0))
        : undefined;
      const sectorCount = entry.sectorCount ?? (sectorAreas ? sectorAreas.length : undefined);
      const glbUrl = entry.glbUrl ?? hullPreview?.glbUrl ?? entry.glbUrl;
      const cleaned: HullLibraryEntry = {
        ...entry,
        id,
        hull: normalizeHullDims(entry.hull),
        hullAreaOverride_m2: areaOverride ?? undefined,
        hullAreaOverride_uncertainty_m2: areaUnc ?? undefined,
        hullAreaPerSector_m2: sectorAreas,
        sectorCount,
        glbUrl,
      };
      return [cleaned, ...prev.filter((e) => e.id !== id)];
    });
  };

  const saveFromSilhouette = () => {
    if (!targetDims) return;
    addHullLibraryEntry({
      id: nanoid(10),
      name: `Silhouette hull ${new Date().toISOString()}`,
      hull: normalizeHullDims(targetDims),
      hullAreaOverride_m2: undefined,
      hullAreaOverride_uncertainty_m2: undefined,
      source: "silhouette",
    });
  };

  const saveFromGLB = () => {
    if (!hullMetrics) return;
    addHullLibraryEntry({
      id: nanoid(10),
      name: `GLB hull ${new Date().toISOString()}`,
      hull: normalizeHullDims(hullMetrics.dims_m),
      hullAreaOverride_m2: clampHullArea(hullMetrics.area_m2) ?? undefined,
      hullAreaOverride_uncertainty_m2: clampHullArea(hullMetrics.areaUnc_m2, true) ?? undefined,
      hullAreaPerSector_m2: hullMetrics.areaPerSector_m2,
      sectorCount: hullMetrics.sectorCount,
      glbUrl: hullGlbUrl,
      source: "glb",
    });
  };

  useEffect(() => {
    if (targetDims) return;
    if (hullPreview?.targetDims) {
      const clamped = normalizeHullDims(hullPreview.targetDims);
      if (clamped) {
        setTargetDims(clamped);
        return;
      }
    }
    if (pipeline?.hull) {
      const { Lx_m, Ly_m, Lz_m } = pipeline.hull;
      const clamped = clampHullDims({ Lx_m, Ly_m, Lz_m });
      if (clamped.Lx_m && clamped.Ly_m && clamped.Lz_m) {
        setTargetDims(normalizeHullDims(clamped));
      }
    }
  }, [pipeline?.hull, targetDims, hullPreview?.targetDims]);

  useEffect(() => {
    const url = (hullGlbUrl ?? "").trim();
    if (!url) return;
    const controller = new AbortController();
    let cancelled = false;
    setHullMetricsLoading(true);
    setHullMetricsError(null);
    loadHullMetricsFromGLB(url, {
      previewScale: hullTransform.scale,
      previewRotationQuat: hullTransform.rotQuat,
      previewOffset: hullTransform.offset,
      unitScale: hullTransform.unitScale,
      axisSwap: hullTransform.axisSwap,
      axisFlip: hullTransform.axisFlip,
      areaUncertaintyRatio: hullTransform.areaUncertaintyRatio,
      sectorCount: typeof (pipeline as any)?.sectorCount === "number" ? Math.max(1, Math.floor((pipeline as any).sectorCount)) : 400,
      signal: controller.signal,
    })
      .then((metrics) => {
        if (cancelled) return;
        setHullMetrics(metrics);
        setHullMetricsLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted || cancelled) return;
        setHullMetrics(null);
        const message =
          err instanceof Error
            ? err.message
            : typeof err === "string"
            ? err
            : "Failed to measure hull";
        setHullMetricsError(message);
        setHullMetricsLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [hullGlbUrl, hullTransformKey, (pipeline as any)?.sectorCount]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hullLibrary");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHullLibrary((prev) => {
            const next = (parsed as HullLibraryEntry[]).map((entry) => ({
              ...entry,
              hull: normalizeHullDims(entry.hull),
              hullAreaOverride_m2: clampHullArea(entry.hullAreaOverride_m2) ?? undefined,
              hullAreaOverride_uncertainty_m2: clampHullArea(entry.hullAreaOverride_uncertainty_m2, true) ?? undefined,
            }));
            const hasNeedle = next.some((e) => e.id === NEEDLE_PRESET.id || e.name === NEEDLE_PRESET.name);
            return hasNeedle ? next : [NEEDLE_PRESET, ...next];
          });
          return;
        }
      }
    } catch (err) {
      console.warn("[HullLibrary] failed to load from localStorage", err);
    }
    setHullLibrary([NEEDLE_PRESET]);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("hullLibrary", JSON.stringify(hullLibrary));
    } catch (err) {
      console.warn("[HullLibrary] failed to persist to localStorage", err);
    }
  }, [hullLibrary]);

  return (
    <div className="relative flex h-full w-full flex-col bg-[#050915] text-slate-100">
      <PhoenixBadge className="absolute right-3 top-3 z-10" />
      <header className="flex flex-col gap-1 border-b border-white/10 bg-black/30 px-4 py-3">
        <div className="text-lg font-semibold text-white">Phoenix Averaging - Needle Hull Preview</div>
        <div className="text-sm text-slate-300/80">
          GR-proxy curvature (stand-in for spacetime bending) from Casimir tiles (vacuum-gap plates that squeeze the
          quantum vacuum), averaged over local light-crossing windows (ship frame). No outside observer sees this
          simultaneously; this is a control-friendly foliation.
        </div>
        <details className="group mt-2 space-y-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[12px] text-slate-200/90">
          <summary className="cursor-pointer select-none font-semibold text-white group-open:text-amber-200">
            Reference frame note (ship foliation)
          </summary>
          <div className="text-slate-200/80">
            <div>{`tau_LC(x) = d_hull(x) / c - light-crossing time per tile, applied before display.`}</div>
            <div>{`kappa_drive ~ (8*pi*G/c^5) * (P/A) * d_eff * G_geom - curvature/stress proxy shown in the heatmaps.`}</div>
            <div>{`GR link: G_{mu nu} = 8*pi*G * avg_tauLC(T_{mu nu}); coarse-grained over tau_LC, ship time only.`}</div>
          </div>
        </details>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              className="accent-amber-500"
              checked={logScale}
              onChange={(e) => setLogScale(e.target.checked)}
            />
            Log color scale (safer dynamic range)
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              className="accent-emerald-500"
              checked={overlayBand}
              onChange={(e) => setOverlayBand(e.target.checked)}
            />
            Show Phoenix band hint (light-crossing averaging band)
          </label>
        </div>
        <div className="mt-1">
          <LiveStatusBadge live={phoenixInputs.live} />
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-2">
        <PanelCard
          title="Worldline strip (x vs ship time)"
          subtitle="Each pixel is kappa_drive (curvature proxy) averaged over one local L/c window."
        >
          <HeatmapCanvas
            heatmap={heatmaps.worldline}
            overlayBand={overlayBand}
            overlayDuty={
              phoenixInputs.inputs.burst_s && phoenixInputs.inputs.sectorPeriod_s
                ? phoenixInputs.inputs.burst_s / Math.max(1e-6, phoenixInputs.inputs.sectorPeriod_s)
                : phoenixInputs.inputs.dutyEffective
            }
            coneTau_s={heatmaps.worldline.tauLC_s}
            timeHorizon_s={heatmaps.worldline.timeHorizon_s}
          />
          <Legend min={heatmaps.worldline.min} max={heatmaps.worldline.max} logScale={logScale} />
        </PanelCard>
        <PanelCard
          title="Spacetime slice with tile band"
          subtitle="Activation band shaded; cones imply causal smear (light-cone reach inside the Phoenix window)."
        >
          <HeatmapCanvas
            heatmap={heatmaps.spacetime}
            overlayBand={overlayBand}
            overlayDuty={
              phoenixInputs.inputs.burst_s && phoenixInputs.inputs.sectorPeriod_s
                ? phoenixInputs.inputs.burst_s / Math.max(1e-6, phoenixInputs.inputs.sectorPeriod_s)
                : phoenixInputs.inputs.dutyEffective
            }
            withCones
            coneTau_s={heatmaps.spacetime.tauLC_s}
            timeHorizon_s={heatmaps.spacetime.timeHorizon_s}
          />
          <Legend min={heatmaps.spacetime.min} max={heatmaps.spacetime.max} logScale={logScale} />
        </PanelCard>
      </div>

      <div className="grid gap-3 px-4 pb-3 lg:grid-cols-2">
        <PanelCard
          title="Casimir cavity filter"
          subtitle="Excluded bands reduce allowed modes; pressure label comes from the pipeline when present."
        >
          <div className="flex items-center gap-3 px-3 pb-2 pt-3 text-xs text-slate-200">
            <span className="text-[11px] text-slate-400">LC overlay reads pipeline.lc; transmission is a placeholder until a sweep arrives.</span>
          </div>
          <SpectrumCanvas spectrum={spectrum} />
        </PanelCard>
        <PanelCard
          title="Negative-energy hull shell"
          subtitle="Schematic shell unless a stress-energy grid is emitted."
        >
          <div className="flex items-center gap-2 px-3 pb-2 pt-3 text-[11px] text-slate-300">
            Uses pipeline shellMap when available; otherwise a ring fallback.
          </div>
          <HullShellCanvas shell={shell} highlightGap />
        </PanelCard>
      </div>

      <div className="grid gap-3 px-4 pb-3 md:grid-cols-2">
        <PanelCard
          title="Live inputs feeding the preview"
          subtitle="Values pulled from the energy pipeline (fallbacks labeled)."
        >
          <PhoenixInputsCard rows={phoenixInputs.rows} />
        </PanelCard>
        <PanelCard
          title="Hull asset metrics (preview-only)"
          subtitle="GLB-derived dims and surface area; stays local until applied."
        >
          <div className="space-y-3 px-3 pb-3 pt-2 text-sm text-slate-100">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] uppercase tracking-wide text-slate-400">GLB URL</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
                  value={hullGlbUrlInput}
                  onChange={(e) => setHullGlbUrlInput(e.target.value)}
                  placeholder="/path/to/hull.glb"
                />
                <button
                  className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-60"
                  onClick={() => setHullGlbUrl(hullGlbUrlInput.trim())}
                  disabled={hullMetricsLoading || !hullGlbUrlInput.trim()}
                >
                  {hullMetricsLoading ? "Measuring..." : "Measure"}
                </button>
              </div>
            </div>

            <div className="grid gap-3 rounded border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] uppercase tracking-wide text-slate-400">Preview scale</div>
                  <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
                    {(["x", "y", "z"] as const).map((axis, idx) => (
                      <label key={axis} className="flex items-center gap-1">
                        <span className="w-4 text-right text-slate-300">{axis.toUpperCase()}:</span>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={hullTransform.scale[idx]}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setHullTransform((prev) => {
                              const next = [...prev.scale] as [number, number, number];
                              next[idx] = Number.isFinite(val) && val > 0 ? val : prev.scale[idx];
                              return { ...prev, scale: next };
                            });
                          }}
                          className="w-20 rounded border border-white/10 bg-black/30 px-2 py-1 text-white focus:border-emerald-400"
                        />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  <label className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/30 px-3 py-2">
                    <span className="text-slate-300">Unit scale</span>
                    <input
                      type="number"
                      min="1e-6"
                      step="0.1"
                      value={hullTransform.unitScale}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setHullTransform((prev) => ({
                          ...prev,
                          unitScale: Number.isFinite(val) && val > 0 ? val : prev.unitScale,
                        }));
                      }}
                      className="w-20 rounded border border-white/10 bg-black/30 px-2 py-1 text-right text-white focus:border-emerald-400"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/30 px-3 py-2">
                    <span className="text-slate-300">Area sigma (ratio)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={hullTransform.areaUncertaintyRatio ?? 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setHullTransform((prev) => ({
                          ...prev,
                          areaUncertaintyRatio: Number.isFinite(val) && val >= 0 ? val : prev.areaUncertaintyRatio,
                        }));
                      }}
                      className="w-20 rounded border border-white/10 bg-black/30 px-2 py-1 text-right text-white focus:border-emerald-400"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-slate-200">
                {(["x", "y", "z"] as const).map((axis) => (
                  <label key={`swap-${axis}`} className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/20 px-2 py-1">
                    <span className="text-slate-300">
                      Axis {axis.toUpperCase()} {"->"}
                    </span>
                    <select
                      className="rounded border border-white/10 bg-black/40 px-2 py-1 text-white focus:border-emerald-400"
                      value={hullTransform.axisSwap?.[axis] ?? axis}
                      onChange={(e) =>
                        setHullTransform((prev) => ({
                          ...prev,
                          axisSwap: { ...(prev.axisSwap ?? {}), [axis]: e.target.value as "x" | "y" | "z" },
                        }))
                      }
                    >
                      <option value="x">X</option>
                      <option value="y">Y</option>
                      <option value="z">Z</option>
                    </select>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-slate-200">
                {(["x", "y", "z"] as const).map((axis) => (
                  <label key={axis} className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/20 px-2 py-1">
                    <span className="text-slate-300">Flip {axis.toUpperCase()}</span>
                    <input
                      type="checkbox"
                      className="accent-emerald-500"
                      checked={Boolean(hullTransform.axisFlip?.[axis])}
                      onChange={(e) =>
                        setHullTransform((prev) => ({
                          ...prev,
                          axisFlip: { ...(prev.axisFlip ?? {}), [axis]: e.target.checked },
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded border border-white/10 bg-black/40 p-3 text-sm text-slate-200">
              {hullMetricsLoading ? (
                <div className="text-emerald-200">Measuring hull...</div>
              ) : hullMetricsError ? (
                <div className="text-amber-300">Measurement failed: {hullMetricsError}</div>
              ) : hullMetrics ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>Method: {hullMetrics.method}</span>
                    <span>Triangles: {hullMetrics.triangleCount}</span>
                    <span>Vertices: {hullMetrics.vertexCount}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <MetricBox label="Lx" value={hullMetrics.dims_m.Lx_m} unit="m" />
                    <MetricBox label="Ly" value={hullMetrics.dims_m.Ly_m} unit="m" />
                    <MetricBox label="Lz" value={hullMetrics.dims_m.Lz_m} unit="m" />
                  </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <MetricBox label="Area" value={hullMetrics.area_m2} unit="m^2" />
                <MetricBox label="Area sigma" value={hullMetrics.areaUnc_m2} unit="m^2" />
                <MetricBox label="Area / ellipsoid" value={hullMetrics.areaRatio} unit="x" precision={3} />
              </div>
                  <div className="text-xs text-slate-400">
                    Surface complexity penalty is the area ratio vs. ellipsoid surrogate (same bbox-derived axes).
                  </div>
                </div>
              ) : (
                <div className="text-slate-400">Load a GLB to see measured hull metrics.</div>
              )}
            </div>

            <div className="rounded border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[12px] uppercase tracking-wide text-slate-400">Fit to silhouette</div>
                <button
                  className="rounded bg-sky-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-sky-500 disabled:opacity-60"
                  onClick={() => {
                    if (!hullMetrics || !targetDims) return;
                    const { Lx_m: cx, Ly_m: cy, Lz_m: cz } = hullMetrics.dims_m;
                    const { Lx_m: tx, Ly_m: ty, Lz_m: tz } = targetDims;
                    if (!(cx > 0 && cy > 0 && cz > 0)) return;
                    const sx = tx > 0 ? tx / cx : 1;
                    const sy = ty > 0 ? ty / cy : 1;
                    const sz = tz > 0 ? tz / cz : 1;
                    setHullTransform((prev) => ({
                      ...prev,
                      scale: [
                        prev.scale[0] * sx,
                        prev.scale[1] * sy,
                        prev.scale[2] * sz,
                      ],
                    }));
                  }}
                  disabled={hullMetricsLoading || !hullMetrics || !targetDims}
                >
                  Fit to silhouette
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                {(["Lx_m", "Ly_m", "Lz_m"] as const).map((key) => (
                  <label key={key} className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/20 px-2 py-1 text-xs text-slate-200">
                    <span className="text-slate-300">{key.replace("_m", "").toUpperCase()}</span>
                    <input
                      type="number"
                      min={HULL_DIM_MIN_M}
                      max={HULL_DIM_MAX_M}
                      step="0.01"
                      value={targetDims?.[key] ?? ""}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTargetDims((prev) => {
                          const base = prev ?? { Lx_m: HULL_DIM_MIN_M, Ly_m: HULL_DIM_MIN_M, Lz_m: HULL_DIM_MIN_M };
                          const clamped = clampHullDims({ [key]: val } as any)[key];
                          const nextVal = clamped ?? base[key];
                          return normalizeHullDims({ ...base, [key]: nextVal });
                        });
                      }}
                      className="w-24 rounded border border-white/10 bg-black/30 px-2 py-1 text-right text-white focus:border-sky-400"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Target dims should come from Silhouette Stretch (canonical hull box). Fit only adjusts preview scale; no pipeline push.
              </div>
            </div>

              <div className="rounded border border-white/10 bg-white/5 p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[12px] uppercase tracking-wide text-slate-400">Apply to pipeline (ellipsoid surrogate)</div>
                  <button
                    className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-60"
                  disabled={hullMetricsLoading || !hullMetrics || !hullAreaReady || updatePipeline.isPending}
                  onClick={async () => {
                    if (!hullMetrics) return;
                    const wallThickness = finiteNumber((pipeline as any)?.hull?.wallThickness_m);
                    const { payload, clampMessages } = buildHullPayload(
                      hullMetrics.dims_m,
                      wallThickness,
                      hullMetrics.area_m2,
                      hullMetrics.areaUnc_m2,
                      hullMetrics.areaPerSector_m2,
                    );
                    showClampNotice(clampMessages);
                    setApplyStatus(
                      clampMessages.length
                        ? `Applying hull + area override (clamped: ${clampMessages.join(", ")})...`
                        : "Applying hull + area override...",
                    );
                    try {
                      const res: any = await updatePipeline.mutateAsync(payload);
                      const source = typeof res?.__hullAreaSource === "string" ? res.__hullAreaSource : pipelineHullAreaSource;
                      const areaApplied =
                        clampHullArea(finiteNumber(res?.hullArea_m2)) ??
                        clampHullArea(pipelineHullArea_m2) ??
                        clampHullArea(hullMetrics.area_m2) ??
                        undefined;
                      setApplyStatus(
                        `Applied. hullArea=${areaApplied != null ? areaApplied.toFixed(2) : "n/a"} m^2` +
                          (source ? ` (${source})` : "") +
                          (clampMessages.length ? ` | clamped: ${clampMessages.join(", ")}` : ""),
                      );
                    } catch (err: any) {
                      const msg = err?.message ?? "Failed to apply hull";
                      setApplyStatus(`Apply failed: ${msg}`);
                    }
                  }}
                >
                  {updatePipeline.isPending ? "Applying..." : "Apply to pipeline"}
                </button>
              </div>
              {clampNotice ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                  <span>{clampNotice}</span>
                </div>
              ) : null}
              {hullApplyClampWarnings.length ? (
                <div className="rounded border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  <div className="font-semibold text-amber-200">Inputs will be clamped</div>
                  <div className="mt-1 space-y-0.5">
                    {hullApplyClampWarnings.map((msg) => (
                      <div key={msg}>{msg}</div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <MetricBox label="Pipeline hull area" value={pipelineHullArea_m2} unit="m^2" />
                <div className="rounded border border-white/10 bg-black/30 px-3 py-2">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">Area source</div>
                  <div className="text-sm font-semibold text-white">{pipelineHullAreaSource ?? "n/a"}</div>
                </div>
              </div>
              {applyStatus ? (
                <div className="rounded border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-200">{applyStatus}</div>
              ) : null}
              <div className="text-[11px] text-slate-400">
                Posts bbox dims + surface area override to /api/helix/pipeline/update. Solver/render stays ellipsoid (dims/2).
              </div>
            </div>

            <div className="rounded border border-white/10 bg-white/5 p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[12px] uppercase tracking-wide text-slate-400">Hull library</div>
                <div className="flex gap-2">
                  <button
                    className="rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-60"
                    onClick={saveFromSilhouette}
                    disabled={!targetDims}
                  >
                    Save from silhouette
                  </button>
                  <button
                    className="rounded bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-purple-500 disabled:opacity-60"
                    onClick={saveFromGLB}
                    disabled={!hullMetrics}
                  >
                    Save from GLB
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {hullLibrary.length === 0 ? (
                  <div className="text-sm text-slate-400">No hull entries saved yet.</div>
                ) : (
                  hullLibrary.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-white">{entry.name}</div>
                        <span className="text-[11px] uppercase tracking-wide text-slate-400">
                          {entry.source ?? "custom"}
                        </span>
                      </div>
                      <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-slate-300">
                        <span>Lx {entry.hull.Lx_m.toFixed(2)} m</span>
                        <span>Ly {entry.hull.Ly_m.toFixed(2)} m</span>
                        <span>Lz {entry.hull.Lz_m.toFixed(2)} m</span>
                      </div>
                      <div className="mt-1 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                        <span>Area {entry.hullAreaOverride_m2 ? entry.hullAreaOverride_m2.toFixed(2) : "n/a"} m^2</span>
                        <span>
                          Sigma{" "}
                          {entry.hullAreaOverride_uncertainty_m2
                            ? entry.hullAreaOverride_uncertainty_m2.toFixed(2)
                            : "n/a"}{" "}
                          m^2
                        </span>
                        <span>{entry.glbUrl ? "GLB linked" : "No GLB"}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <button
                          className="rounded border border-white/20 bg-white/5 px-2 py-1 text-white hover:border-emerald-400"
                          onClick={() => {
                            setTargetDims(normalizeHullDims(entry.hull));
                            setHullTransform((prev) => ({
                              ...prev,
                              scale: [1, 1, 1],
                            }));
                          }}
                        >
                          Set as target
                        </button>
                        {entry.glbUrl ? (
                          <button
                            className="rounded border border-white/20 bg-white/5 px-2 py-1 text-white hover:border-sky-400"
                            onClick={() => {
                              setHullGlbUrlInput(entry.glbUrl ?? "");
                              setHullGlbUrl(entry.glbUrl ?? "");
                            }}
                          >
                            Load GLB
                          </button>
                        ) : null}
                        <button
                          className="rounded border border-white/20 bg-white/5 px-2 py-1 text-white hover:border-amber-400"
                          onClick={async () => {
                            const { payload, clampMessages } = buildHullPayload(
                              entry.hull,
                              finiteNumber((pipeline as any)?.hull?.wallThickness_m),
                              entry.hullAreaOverride_m2,
                              entry.hullAreaOverride_uncertainty_m2,
                              entry.hullAreaPerSector_m2,
                            );
                            showClampNotice(clampMessages);
                            setApplyStatus(
                              clampMessages.length
                                ? `Applying hull from library (clamped: ${clampMessages.join(", ")})...`
                                : "Applying hull from library...",
                            );
                            try {
                              const res: any = await updatePipeline.mutateAsync(payload);
                              const source = typeof res?.__hullAreaSource === "string" ? res.__hullAreaSource : pipelineHullAreaSource;
                              const areaApplied =
                                clampHullArea(finiteNumber(res?.hullArea_m2)) ??
                                clampHullArea(entry.hullAreaOverride_m2) ??
                                clampHullArea(hullMetrics?.area_m2) ??
                                undefined;
                              setApplyStatus(
                                `Applied from library. hullArea=${areaApplied != null ? areaApplied.toFixed(2) : "n/a"} m^2` +
                                  (source ? ` (${source})` : "") +
                                  (clampMessages.length ? ` | clamped: ${clampMessages.join(", ")}` : ""),
                              );
                            } catch (err: any) {
                              setApplyStatus(`Apply failed: ${err?.message ?? "unknown error"}`);
                            }
                          }}
                        >
                          Apply to pipeline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </PanelCard>
      </div>

      <div className="grid gap-3 px-4 pb-4 md:grid-cols-2">
        <InfoBlock title="What you are seeing">
          <ul className="list-disc space-y-1 pl-4">
            <li>Worldline strip (left): x vs ship time with kappa_drive (curvature proxy) shaded; brighter = more curvature.</li>
            <li>Spacetime slice (right): same values, plus a tile-activation band and light-cone guides (causal reach).</li>
            <li>Phoenix band overlay: the local light-crossing window (tau_LC) used to average each pixel.</li>
            <li>Needle hull angle: slender hull = smaller cross-section; reduces shear across the bubble edge.</li>
          </ul>
        </InfoBlock>
        <InfoBlock title="Phoenix averaging (why)">
          <ul className="list-disc space-y-1 pl-4">
            <li>Align frames, weight by coherence, average over tau_LC = d_hull/c (light-crossing) so transients/jitter get suppressed.</li>
            <li>Residuals (difference from the average) flag oscillations: band wiggles = boundary instability; hull wiggles = hull/driver coupling.</li>
            <li>Stable Phoenix averages mean a reproducible metric; wandering averages point to control/driver issues.</li>
          </ul>
        </InfoBlock>
        <InfoBlock title="GR and warp-bubble hooks">
          <ul className="list-disc space-y-1 pl-4">
            <li>kappa_drive is a proxy for stress-energy (energy + momentum + pressure) that sources curvature in Einstein's equation.</li>
            <li>Needle hull reduces transverse bubble volume, lowering needed exotic/negative energy and tidal shear.</li>
            <li>Look for a thin, smooth activation shell: steep gradients at the boundary, calm interior.</li>
            <li>Frame-drag/rotation should stay small unless intentional; large twists = unintended coupling.</li>
          </ul>
        </InfoBlock>
        <InfoBlock title="Terms (plain language)">
          <ul className="list-disc space-y-1 pl-4">
            <li>How paths bend (spacetime curvature): shows up as tidal stretch/squeeze on the hull.</li>
            <li>Energy + momentum + pressure (stress-energy): the ingredients that create curvature (what the drive shapes).</li>
            <li>Light-crossing window (Phoenix window): local thickness / light speed; the averaging window before display.</li>
            <li>Boundary shell (bubble boundary): where the engineered metric departs from ambient spacetime.</li>
          </ul>
        </InfoBlock>
      </div>

      <footer className="border-t border-white/10 bg-black/30 px-4 py-3 text-[12px] text-slate-300/80">
        Curvature proxy kappa_drive = (8*pi*G/c^5) * (P/A) * d_eff * G_geom. Colored values are locally Hann-averaged
        over the light-crossing time of the hull thickness. Guardrails: clamps d_eff in [0,1], ignores non-finite
        samples.
      </footer>
    </div>
  );
}

export function PhoenixNeedlePanel() {
  return <PhoenixNeedlePanelInner />;
}

export default PhoenixNeedlePanelInner;

function MetricBox({ label, value, unit, precision = 2 }: { label: string; value: number | undefined; unit?: string; precision?: number }) {
  const display = Number.isFinite(value) ? (value as number).toFixed(precision) : "n/a";
  return (
    <div className="rounded border border-white/10 bg-black/30 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm font-semibold text-white">
        {display}
        {unit ? <span className="ml-1 text-xs text-slate-300">{unit}</span> : null}
      </div>
    </div>
  );
}

function PanelCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1222]">
      <div className="border-b border-white/5 px-4 py-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-[12px] text-slate-300/80">{subtitle}</div>
      </div>
      <div className="relative flex-1 bg-black/40">{children}</div>
    </div>
  );
}

function HeatmapCanvas({
  heatmap,
  overlayBand,
  overlayDuty,
  withCones = false,
  coneTau_s,
  timeHorizon_s,
}: {
  heatmap: Heatmap;
  overlayBand?: boolean;
  overlayDuty?: number;
  withCones?: boolean;
  coneTau_s?: number;
  timeHorizon_s?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { image, width, height } = heatmap;
    const data = new Uint8ClampedArray(image);
    const img = new ImageData(data, width, height);
    ctx.putImageData(img, 0, 0);
    if (overlayBand) {
      ctx.save();
      ctx.globalAlpha = 0.24;
      ctx.fillStyle = "#8dd3ff";
      const frac = overlayDuty != null && Number.isFinite(overlayDuty) ? Math.max(0.01, Math.min(1, overlayDuty)) : 0.02;
      const band = Math.max(2, Math.floor(height * frac));
      const y0 = Math.max(0, Math.floor((height - band) / 2));
      ctx.fillRect(0, y0, width, band);
      ctx.restore();
    }
    if (withCones) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "#9ad1ff";
      ctx.lineWidth = 1;
      const timeSpan = Number.isFinite(timeHorizon_s) ? (timeHorizon_s as number) : 0;
      const tau = Number.isFinite(coneTau_s) ? (coneTau_s as number) : timeSpan > 0 ? timeSpan / 6 : undefined;
      const tauFrac =
        timeSpan > 0 && tau != null ? Math.max(0.02, Math.min(1, tau / Math.max(1e-9, timeSpan))) : 0.18;
      const yReach = Math.max(4, Math.floor(height * tauFrac));
      const halfSpan = width * (0.2 + 0.6 * tauFrac);
      const anchors = [Math.round(width * 0.25), Math.round(width * 0.5), Math.round(width * 0.75)];
      for (const x0 of anchors) {
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.lineTo(Math.max(0, x0 - halfSpan), yReach);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.lineTo(Math.min(width, x0 + halfSpan), yReach);
        ctx.stroke();
      }
      ctx.restore();
    }
  }, [heatmap, overlayBand, overlayDuty, withCones, coneTau_s, timeHorizon_s]);

  return (
    <canvas
      ref={ref}
      width={heatmap.width}
      height={heatmap.height}
      style={{ width: "100%", height: "100%", imageRendering: "pixelated", background: "#050915" }}
      aria-label="Phoenix averaging heatmap"
    />
  );
}

function Legend({ min, max, logScale }: { min: number; max: number; logScale: boolean }) {
  return (
    <div className="absolute bottom-2 right-3 rounded bg-black/60 px-2 py-1 text-[11px] text-slate-200">
      <span className="font-mono">
        {logScale ? `log10 kappa: ${min.toFixed(2)}..${max.toFixed(2)}` : `kappa: ${formatSci(min)}..${formatSci(max)}`}
      </span>
    </div>
  );
}

function buildHeatmaps(cfg: HeatmapConfig, inputs: PhoenixInputs): { worldline: Heatmap; spacetime: Heatmap } {
  const hullLength = inputs.hullLength_m || L_X;
  const xs = new Array(N_X).fill(0).map((_, i) => (i / (N_X - 1)) * hullLength - hullLength / 2);
  const { times, span } = buildTimeline(inputs);
  const dutyEff = inputs.dutyEffective;
  const geometryGain = inputs.geometryGain;

  const rawGrid = new Float64Array(xs.length * times.length);
  let write = 0;
  for (let ix = 0; ix < xs.length; ix++) {
    const x = xs[ix];
    const series = new Float64Array(times.length);
    for (let it = 0; it < times.length; it++) {
      series[it] = kappaDrive({
        powerDensityWPerM2: tileFluxFromPipeline(x, times[it], inputs),
        dutyEffective: dutyEff,
        geometryGain,
      });
    }
    const tau = tauLCForX(x, inputs);
    const averaged = lightCrossingAverage(series, times, tau);
    for (let it = 0; it < averaged.length; it++) {
      rawGrid[write++] = averaged[it];
    }
  }

  const norm = normalizeSeries(rawGrid, cfg.logScale);
  const mask = cfg.overlayBand ? activationMaskLive(xs, times, inputs) : undefined;
  const worldlineImage = toImage(norm.values, xs.length, times.length, mask);
  const spacetimeImage = toImage(norm.values, xs.length, times.length, mask);
  const tauUsed = inputs.tauLC_s ?? tauLCForX(0, inputs);

  return {
    worldline: {
      image: worldlineImage,
      width: xs.length,
      height: times.length,
      min: norm.min,
      max: norm.max,
      timeHorizon_s: span,
      tauLC_s: tauUsed,
    },
    spacetime: {
      image: spacetimeImage,
      width: xs.length,
      height: times.length,
      min: norm.min,
      max: norm.max,
      timeHorizon_s: span,
      tauLC_s: tauUsed,
    },
  };
}

function buildTimeline(inputs: PhoenixInputs): { times: number[]; span: number } {
  const dwell = inputs.sectorPeriod_s ?? inputs.dwell_s ?? DT;
  const tau = inputs.tauLC_s ?? tauLCForX(0, inputs);
  const span = Math.max(dwell * 6, tau * 14, 3);
  const dt = span / Math.max(1, T_STEPS - 1);
  const times = new Array(T_STEPS).fill(0).map((_, i) => i * dt);
  return { times, span };
}

function tileFluxFromPipeline(x: number, t: number, inputs: PhoenixInputs): number {
  const base = Math.max(1e3, inputs.powerDensityBase);
  const sectorCount = Math.max(1, Math.round(inputs.sectorCount ?? 200));
  const sectorsLive = Math.max(1, Math.round(inputs.sectorsConcurrent ?? 1));
  const period = Math.max(1e-6, inputs.sectorPeriod_s ?? inputs.dwell_s ?? 1);
  const burst = Math.max(1e-6, inputs.burst_s ?? period * inputs.dutyEffective);
  const duty = Math.max(0, Math.min(1, burst / period));
  const sweep = (t / period) * sectorCount;
  const sectorHead = ((sweep % sectorCount) + sectorCount) % sectorCount;
  const burstPhase = sweep - Math.floor(sweep);
  const onBurst = burstPhase <= duty;
  const xNorm = clamp01((x + inputs.hullLength_m / 2) / Math.max(1e-9, inputs.hullLength_m));
  const sectorForX = Math.min(sectorCount - 1, Math.floor(xNorm * sectorCount));
  let active = false;
  for (let k = 0; k < sectorsLive; k++) {
    const idx = (Math.floor(sectorHead) + k) % sectorCount;
    if (idx === sectorForX) {
      active = true;
      break;
    }
  }
  const tileFill =
    inputs.activeTiles != null && inputs.totalTiles
      ? clamp01(inputs.activeTiles / Math.max(1, inputs.totalTiles))
      : undefined;
  const tileScale = tileFill != null ? lerp(0.35, 1, tileFill) : 1;
  const tsScale = inputs.tsRatio != null ? clamp01(Math.tanh(inputs.tsRatio / 80)) : 1;
  const envelope = active && onBurst ? 1 : active ? 0.35 : 0.08;
  return base * envelope * tileScale * tsScale;
}

function tauLCForX(x: number, inputs: PhoenixInputs): number {
  if (inputs.tauLC_s != null) return inputs.tauLC_s;
  const wall = inputs.wallThickness_m * (1 + 0.06 * Math.tanh(Math.abs(x) / Math.max(1e-9, inputs.hullLength_m * 0.3)));
  return wall / LIGHT_SPEED;
}

function toImage(values01: Float64Array, width: number, height: number, mask?: Uint8Array): Uint8ClampedArray {
  const img = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < values01.length; i++) {
    const v = Math.max(0, Math.min(1, values01[i]));
    const [r, g, b] = viridisLite(v);
    const alpha = mask ? Math.max(120, mask[i]) : 255;
    const p = i * 4;
    img[p + 0] = r;
    img[p + 1] = g;
    img[p + 2] = b;
    img[p + 3] = alpha;
  }
  return img;
}

function viridisLite(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t));
  const r = Math.round(68 + 180 * x);
  const g = Math.round(1 + 150 * x);
  const b = Math.round(84 + 60 * x);
  return [r, g, b];
}

function activationMaskLive(xs: number[], times: number[], inputs: PhoenixInputs): Uint8Array {
  const width = xs.length;
  const height = times.length;
  const mask = new Uint8Array(width * height);
  const sectorCount = Math.max(1, Math.round(inputs.sectorCount ?? 200));
  const sectorsLive = Math.max(1, Math.round(inputs.sectorsConcurrent ?? 1));
  const period = Math.max(1e-6, inputs.sectorPeriod_s ?? inputs.dwell_s ?? 1);
  const burst = Math.max(1e-6, inputs.burst_s ?? period * inputs.dutyEffective);
  const duty = clamp01(burst / period);
  for (let y = 0; y < height; y++) {
    const t = times[y];
    const sweep = (t / period) * sectorCount;
    const sectorHead = ((sweep % sectorCount) + sectorCount) % sectorCount;
    const burstPhase = sweep - Math.floor(sweep);
    const onBurst = burstPhase <= duty;
    for (let xIdx = 0; xIdx < width; xIdx++) {
      const xNorm = width > 1 ? xIdx / (width - 1) : 0;
      const sectorForX = Math.min(sectorCount - 1, Math.floor(xNorm * sectorCount));
      let active = false;
      for (let k = 0; k < sectorsLive; k++) {
        if (((Math.floor(sectorHead) + k) % sectorCount) === sectorForX) {
          active = true;
          break;
        }
      }
      const alphaBase = active ? 210 : 150;
      mask[y * width + xIdx] = onBurst && active ? 255 : alphaBase;
    }
  }
  return mask;
}

function formatSci(v: number): string {
  if (!Number.isFinite(v)) return "--";
  const abs = Math.abs(v);
  if (abs === 0) return "0";
  if (abs >= 1e-2 && abs < 1e4) return v.toPrecision(4);
  return v.toExponential(2);
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-[12px] text-slate-200">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{title}</div>
      <div className="mt-1 space-y-2">{children}</div>
    </div>
  );
}

function PhoenixInputsCard({ rows }: { rows: PhoenixInputRow[] }) {
  return (
    <div className="flex h-full flex-col bg-black/30 text-[12px] text-slate-200">
      <div className="divide-y divide-white/5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-start justify-between gap-3 px-3 py-2">
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{row.label}</div>
              <div className="text-[11px] text-slate-400/90">
                {row.source} {row.fallback ? "(fallback)" : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs text-white">{formatSci(row.value)}</div>
              <div className="text-[10px] text-slate-400">{row.unit}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveStatusBadge({ live }: { live: PhoenixLiveFlags }) {
  const liveList = [
    live.tauLC && "tauLC",
    (live.burst || live.dwell || live.sectorPeriod) && "burst/dwell",
    live.sectorTiming && "sector sweep",
    live.powerDensity && "power",
    live.tsRatio && "TS_ratio",
  ].filter(Boolean) as string[];
  const fallbackList: string[] = [];
  if (!live.tauLC) fallbackList.push("tauLC");
  if (!live.burst && !live.dwell && !live.sectorPeriod) fallbackList.push("burst/dwell");
  if (!live.sectorTiming) fallbackList.push("sector timing");
  if (!live.powerDensity) fallbackList.push("power density");
  if (!live.tsRatio) fallbackList.push("TS_ratio");
  const badgeTone = liveList.length ? "text-emerald-200" : "text-amber-200";
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-200">
      <span className={`font-semibold ${badgeTone}`}>Live: {liveList.length ? liveList.join(", ") : "none"}</span>
      {fallbackList.length ? <span className="text-slate-400">Fallback: {fallbackList.join(", ")}</span> : null}
      {live.autoscaleGating ? (
        <span className="rounded border border-amber-400/40 bg-amber-400/10 px-1.5 py-[1px] text-amber-100">
          TS autoscale {live.autoscaleGating}
        </span>
      ) : null}
      {live.shellLive ? (
        <span className="rounded border border-sky-500/50 bg-sky-500/10 px-1.5 py-[1px] text-sky-100">shell map</span>
      ) : null}
    </div>
  );
}

function computePhoenixInputs(pipeline?: EnergyPipelineState | null): PhoenixInputsBundle {
  const p: Partial<EnergyPipelineState> = pipeline ?? {};
  const dutyEffective =
    finiteNumber((p as any).dutyEffectiveFR) ??
    finiteNumber((p as any).dutyEff) ??
    (Number.isFinite(p.dutyCycle) && Number.isFinite(p.sectorCount)
      ? (p.dutyCycle as number) / Math.max(1, p.sectorCount as number)
      : undefined) ??
    0.01;
  const dutySource =
    finiteNumber((p as any).dutyEffectiveFR) != null
      ? "dutyEffectiveFR (server Ford-Roman window)"
      : finiteNumber((p as any).dutyEff) != null
        ? "dutyEff (legacy)"
        : Number.isFinite(p.dutyCycle) && Number.isFinite(p.sectorCount)
          ? "dutyCycle / sectorCount"
          : "fallback 1%";

  const geometryGain = finiteNumber((p as any).gammaGeo) ?? 6.5;
  const geometrySource = finiteNumber((p as any).gammaGeo) != null ? "gammaGeo (server)" : "fallback 6.5";

  const wallThickness =
    finiteNumber((p as any).hull?.wallThickness_m) ??
    finiteNumber((p as any).hull?.wallWidth_m) ??
    finiteNumber((p as any).wallThickness_m) ??
    finiteNumber((p as any).wallWidth_m) ??
    WALL_THICKNESS_M;
  const wallSource =
    finiteNumber((p as any).hull?.wallThickness_m) != null
      ? "hull.wallThickness_m"
      : finiteNumber((p as any).hull?.wallWidth_m) != null
        ? "hull.wallWidth_m"
        : finiteNumber((p as any).wallThickness_m) != null
          ? "wallThickness_m"
          : finiteNumber((p as any).wallWidth_m) != null
            ? "wallWidth_m"
            : "fallback 0.02 m";

  const hullLengthRaw = finiteNumber((p as any).hull?.Lx_m ?? (p as any).hull?.a ?? (p as any).Lx_m);
  const hullLength =
    hullLengthRaw != null
      ? hullLengthRaw && (p as any).hull?.Lx_m == null && (p as any).hull?.a != null
        ? hullLengthRaw * 2
        : hullLengthRaw
      : L_X;
  const hullSource =
    finiteNumber((p as any).hull?.Lx_m) != null
      ? "hull.Lx_m"
      : finiteNumber((p as any).hull?.a) != null
        ? "2 x hull.a"
        : finiteNumber((p as any).Lx_m) != null
          ? "Lx_m"
          : "fallback 1007 m";

  const powerAvgW = finiteNumber((p as any).P_avg_W) ?? finiteNumber((p as any).P_avg);
  const powerSource =
    finiteNumber((p as any).P_avg_W) != null
      ? "P_avg_W"
      : finiteNumber((p as any).P_avg) != null
        ? "P_avg"
        : "fallback 5e7 W/m2";
  const powerPerTile =
    finiteNumber((p as any)?.tiles?.power_W_per_tile) ??
    finiteNumber((p as any)?.tiles?.power_per_tile_W) ??
    finiteNumber((p as any)?.tiles?.P_tile_W);

  const lcBlock = (p as any).lightCrossing ?? (p as any).lc ?? (p as any).clocking ?? (p as any).ts;
  const tauLC_ms =
    finiteNumber(lcBlock?.tauLC_ms) ??
    finiteNumber((p as any).tau_LC_ms) ??
    finiteNumber((p as any).tauLC_ms) ??
    (lcBlock?.tauLC_ns != null ? finiteNumber(lcBlock.tauLC_ns / 1e6) : undefined);
  const tauLC_s_live = tauLC_ms != null ? tauLC_ms / 1000 : undefined;
  const burst_ms =
    finiteNumber(lcBlock?.burst_ms) ??
    (lcBlock?.burst_us != null ? finiteNumber(lcBlock.burst_us / 1000) : undefined) ??
    finiteNumber((p as any).burst_ms);
  const dwell_ms =
    finiteNumber(lcBlock?.dwell_ms) ??
    (lcBlock?.dwell_us != null ? finiteNumber(lcBlock.dwell_us / 1000) : undefined) ??
    finiteNumber((p as any).dwell_ms);
  const sectorPeriod_ms = finiteNumber(lcBlock?.sectorPeriod_ms ?? (p as any).sectorPeriod_ms ?? dwell_ms);
  const sectorCount =
    finiteNumber((p as any).sectorCount) ??
    finiteNumber((p as any).sectorsTotal) ??
    finiteNumber((p as any).sectors) ??
    finiteNumber((p as any)?.phaseSchedule?.sectorCount);
  const sectorsConcurrent =
    finiteNumber((p as any).sectorsConcurrent) ??
    finiteNumber((p as any).concurrentSectors) ??
    finiteNumber((p as any)?.phaseSchedule?.sectorsConcurrent) ??
    finiteNumber((p as any)?.phaseSchedule?.sectorsLive);

  const tsBlock = (p as any).ts ?? (p as any).clocking ?? (p as any).lc ?? (p as any).lightCrossing;
  const tsRatio = finiteNumber((p as any).TS_ratio ?? tsBlock?.TS_ratio ?? tsBlock?.TS);
  const autoscaleTelemetry = (tsBlock as any)?.autoscale ?? (p as any)?.tsAutoscale;
  const autoscaleGating = typeof autoscaleTelemetry?.gating === "string" ? autoscaleTelemetry.gating : undefined;
  const tauSource =
    lcBlock?.tauLC_ms != null
      ? "lightCrossing.tauLC_ms"
      : (p as any).tau_LC_ms != null
        ? "tau_LC_ms"
        : (p as any).tauLC_ms != null
          ? "tauLC_ms"
          : lcBlock?.tauLC_ns != null
            ? "lightCrossing.tauLC_ns"
            : "wallThickness/c (fallback)";

  const tileArea_cm2 = finiteNumber((p as any).tileArea_cm2 ?? (p as any).tiles?.tileArea_cm2);
  const tileArea_m2 = tileArea_cm2 != null ? tileArea_cm2 / 1e4 : undefined;
  const activeTiles = finiteNumber((p as any).tiles?.active);
  const totalTiles = finiteNumber((p as any).tiles?.total);
  const tileAreaTotal = tileArea_m2 && activeTiles ? tileArea_m2 * activeTiles : undefined;
  const hullAreaPipeline = finiteNumber((p as any).hullArea_m2);
  const hullAreaEllipsoid = finiteNumber((p as any).__hullAreaEllipsoid_m2);
  const hullAreaTiles = finiteNumber((p as any).tiles?.hullArea_m2);
  const hullWallWidth = finiteNumber((p as any).hull?.wallWidth_m);
  const hullAreaWall = hullWallWidth != null && hullLengthRaw != null ? hullWallWidth * hullLengthRaw : undefined;
  const area =
    hullAreaPipeline ??
    hullAreaEllipsoid ??
    hullAreaTiles ??
    tileAreaTotal ??
    hullAreaWall;
  const hullArea = area;
  const hullAreaSourceTag = typeof (p as any).__hullAreaSource === "string" ? (p as any).__hullAreaSource : undefined;
  const areaSource =
    hullAreaPipeline != null
      ? `pipeline.hullArea_m2${hullAreaSourceTag ? ` (${hullAreaSourceTag})` : ""}`
      : hullAreaEllipsoid != null
        ? "pipeline.__hullAreaEllipsoid_m2"
        : hullAreaTiles != null
          ? "tiles.hullArea_m2"
          : tileAreaTotal != null
            ? "tileArea_cm2 x activeTiles"
            : hullAreaWall != null
              ? "hull.wallWidth_m x hullLength"
              : undefined;

  let powerDensityBase = 5e7;
  let powerDensitySource = "fallback 5e7 W/m2";
  if (powerPerTile != null && tileArea_m2) {
    powerDensityBase = powerPerTile / Math.max(1e-9, tileArea_m2);
    powerDensitySource = "tiles.power_W_per_tile / tileArea";
  } else if (powerAvgW && area) {
    powerDensityBase = powerAvgW / Math.max(1e-6, area);
    powerDensitySource = areaSource ? `${powerSource} / (${areaSource})` : powerSource;
  } else if (powerAvgW) {
    powerDensityBase = powerAvgW;
    powerDensitySource = powerSource;
  }

  const inputs: PhoenixInputs = {
    dutyEffective: Math.max(0, Math.min(1, dutyEffective)),
    geometryGain: Math.max(0, geometryGain),
    powerDensityBase,
    hullLength_m: hullLength,
    wallThickness_m: wallThickness,
    sectorCount,
    sectorsConcurrent,
    tauLC_s: tauLC_s_live,
    burst_s: burst_ms != null ? burst_ms / 1000 : undefined,
    dwell_s: dwell_ms != null ? dwell_ms / 1000 : undefined,
    sectorPeriod_s: sectorPeriod_ms != null ? sectorPeriod_ms / 1000 : undefined,
    tsRatio,
    activeTiles,
    totalTiles,
    tileArea_m2,
    hullArea_m2: hullArea,
    autoscaleGating: autoscaleGating ?? null,
  };

  const rows: PhoenixInputRow[] = [
    {
      key: "tauLC",
      label: "tau_LC (light-crossing)",
      value: inputs.tauLC_s != null ? inputs.tauLC_s : wallThickness / LIGHT_SPEED,
      unit: "s",
      source: tauSource,
      fallback: inputs.tauLC_s == null,
    },
    {
      key: "burst",
      label: "Burst window",
      value: inputs.burst_s != null ? inputs.burst_s : (inputs.dutyEffective || 0) * (inputs.sectorPeriod_s ?? 0),
      unit: "s",
      source: burst_ms != null ? "lightCrossing/sector burst_ms" : "derived from duty",
      fallback: burst_ms == null,
    },
    {
      key: "dwell",
      label: "Dwell / sector period",
      value: inputs.sectorPeriod_s ?? inputs.dwell_s ?? 0,
      unit: "s",
      source: sectorPeriod_ms != null ? "sectorPeriod_ms" : dwell_ms != null ? "dwell_ms" : "fallback",
      fallback: sectorPeriod_ms == null && dwell_ms == null,
    },
    {
      key: "tsRatio",
      label: "TS_ratio",
      value: inputs.tsRatio ?? 0,
      unit: "",
      source: inputs.tsRatio != null ? "pipeline TS_ratio" : "not available",
      fallback: inputs.tsRatio == null,
    },
    {
      key: "duty",
      label: "Duty (effective)",
      value: inputs.dutyEffective,
      unit: "",
      source: dutySource,
      fallback: dutySource.startsWith("fallback"),
    },
    {
      key: "geometryGain",
      label: "Geometry gain",
      value: inputs.geometryGain,
      unit: "x",
      source: geometrySource,
      fallback: geometrySource.startsWith("fallback"),
    },
    {
      key: "wallThickness",
      label: "Wall thickness",
      value: inputs.wallThickness_m,
      unit: "m",
      source: wallSource,
      fallback: wallSource.startsWith("fallback"),
    },
    {
      key: "hullLength",
      label: "Hull length",
      value: inputs.hullLength_m,
      unit: "m",
      source: hullSource,
      fallback: hullSource.startsWith("fallback"),
    },
    {
      key: "powerDensity",
      label: "Base power density",
      value: inputs.powerDensityBase,
      unit: "W/m2",
      source: powerDensitySource,
      fallback: powerDensitySource.startsWith("fallback") || inputs.powerDensityBase === 5e7 || (!area && powerPerTile == null),
    },
  ];

  const live: PhoenixLiveFlags = {
    tauLC: inputs.tauLC_s != null,
    burst: burst_ms != null,
    dwell: dwell_ms != null,
    sectorPeriod: sectorPeriod_ms != null,
    tsRatio: inputs.tsRatio != null,
    powerDensity: !(powerDensitySource.startsWith("fallback") || (!area && powerPerTile == null)),
    sectorTiming: sectorCount != null || sectorsConcurrent != null,
    autoscaleGating: inputs.autoscaleGating ?? undefined,
    shellLive: Boolean((p as any)?.shellMap?.data || (p as any)?.stressEnergy),
  };

  return { inputs, rows, live };
}

function finiteNumber(value: unknown): number | undefined {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function buildCavityFilter(pipeline?: EnergyPipelineState | null): CavitySpectrum {
  const wavelengths = new Float64Array(320);
  const excluded: { lo: number; hi: number }[] = [
    { lo: 40, hi: 80 },
    { lo: 180, hi: 220 },
    { lo: 520, hi: 620 },
  ];
  for (let i = 0; i < wavelengths.length; i++) {
    wavelengths[i] = 10 + (990 * i) / (wavelengths.length - 1);
  }
  const transmission = Array.from(wavelengths, (w) => {
    const blocked = excluded.some((b) => w >= b.lo && w <= b.hi);
    const base = 0.2 + 0.8 * Math.exp(-Math.pow((w - 150) / 180, 2));
    return blocked ? base * 0.12 : base;
  });
  const lcBlock = (pipeline as any)?.lc ?? (pipeline as any)?.lightCrossing;
  const pressure =
    finiteNumber((pipeline as any)?.casimirPressure_Pa) ??
    finiteNumber((pipeline as any)?.mechanical?.casimirPressure_Pa);
  return {
    wavelengths,
    transmission,
    excluded,
    pressure_Pa: pressure,
    lc: lcBlock
      ? {
          burst_ms: finiteNumber(lcBlock.burst_ms ?? (lcBlock.burst_us != null ? lcBlock.burst_us / 1000 : undefined)),
          dwell_ms: finiteNumber(lcBlock.dwell_ms ?? (lcBlock.dwell_us != null ? lcBlock.dwell_us / 1000 : undefined)),
          tauLC_ms: finiteNumber(lcBlock.tauLC_ms ?? lcBlock.tau_ms ?? (lcBlock.tau_us != null ? lcBlock.tau_us / 1000 : undefined)),
          onWindow: Boolean(lcBlock.onWindow),
        }
      : undefined,
  };
}

function buildHullShell(pipeline?: EnergyPipelineState | null): ShellField {
  const shell = (pipeline as any)?.shellMap;
  if (shell?.data && shell?.width && shell?.height) {
    const vals = Float64Array.from(shell.data as number[]);
    return { values: vals, width: shell.width, height: shell.height, hullRadiusPx: Math.floor(Math.min(shell.width, shell.height) * 0.28) };
  }
  const rSteps = 160;
  const thetaSteps = 160;
  const img = new Float64Array(rSteps * thetaSteps);
  for (let r = 0; r < rSteps; r++) {
    const rNorm = r / (rSteps - 1);
    const shellR = Math.exp(-Math.pow((rNorm - 0.25) / 0.08, 2));
    const spill = 0.15 * Math.exp(-rNorm * 6);
    for (let t = 0; t < thetaSteps; t++) {
      const idx = r * thetaSteps + t;
      img[idx] = -(shellR + spill) + 0.05 * Math.cos(t * 0.08);
    }
  }
  return { values: img, width: thetaSteps, height: rSteps, hullRadiusPx: 0 };
}

function SpectrumCanvas({ spectrum }: { spectrum: CavitySpectrum }) {
  const { ref, size } = useCanvasSize();
  const { wavelengths, transmission, excluded, pressure_Pa, lc } = spectrum;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || wavelengths.length === 0) return;
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, W, H);
    const lo = wavelengths[0];
    const hi = wavelengths[wavelengths.length - 1];
    const xOf = (lam: number) => ((W - 80) * (lam - lo)) / Math.max(1e-12, hi - lo) + 40;
    const barTop = 24;
    const barH = Math.max(10, Math.min(22, H * 0.16));
    const barY = barTop;
    const grad = ctx.createLinearGradient(40, 0, W - 40, 0);
    for (let i = 0; i < wavelengths.length; i += Math.max(1, Math.floor(wavelengths.length / 64))) {
      const t = i / (wavelengths.length - 1);
      const trans = clamp01(transmission[i] ?? 0);
      const col = `rgba(${Math.floor(40 + 180 * trans)},${Math.floor(60 + 160 * trans)},${Math.floor(90 + 40 * trans)},1)`;
      grad.addColorStop(t, col);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(40, barY, W - 80, barH);
    ctx.fillStyle = "rgba(255,30,30,0.26)";
    for (const b of excluded) {
      const x0 = xOf(b.lo);
      const x1 = xOf(b.hi);
      ctx.fillRect(Math.min(x0, x1), barY - 3, Math.abs(x1 - x0), barH + 6);
    }
    if (Number.isFinite(pressure_Pa)) {
      const midY = barY + barH + 22;
      ctx.strokeStyle = "#bcd6ff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, midY);
      ctx.lineTo(W - 40, midY);
      ctx.stroke();
      ctx.fillStyle = "#bcd6ff";
      const label = `∫ spectral -> P = ${(pressure_Pa as number).toExponential(2)} Pa`;
      ctx.font = "12px ui-sans-serif, system-ui";
      ctx.fillText(label, 44, midY - 6);
    }
    if (lc && (lc.burst_ms || lc.dwell_ms)) {
      const burst = lc.burst_ms != null ? lc.burst_ms.toFixed(2) : "?";
      const dwell = lc.dwell_ms != null ? lc.dwell_ms.toFixed(2) : "?";
      const label = `LC avg: burst ${burst} ms, dwell ${dwell} ms`;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(40, barY + barH + 32, W - 80, Math.max(8, H * 0.12));
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "12px ui-sans-serif, system-ui";
      ctx.fillText(label, 44, barY + barH + 42);
    }
    ctx.fillStyle = "rgba(240,240,255,0.85)";
    ctx.font = "12px ui-sans-serif, system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`${lo.toFixed(0)} nm`, 40, barY + barH + 62);
    ctx.textAlign = "right";
    ctx.fillText(`${hi.toFixed(0)} nm`, W - 40, barY + barH + 62);
  }, [ref, size, wavelengths, transmission, excluded, pressure_Pa, lc]);

  return (
    <canvas
      ref={ref}
      style={{ width: "100%", height: 160, display: "block", borderRadius: 8 }}
      aria-label="Casimir cavity spectral transmission with excluded bands"
    />
  );
}

function HullShellCanvas({ shell, highlightGap }: { shell: ShellField; highlightGap?: boolean }) {
  const { ref, size } = useCanvasSize();
  const { values, width, height } = shell;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || width * height === 0) return;
    const safeW = Number.isFinite(size.w) ? size.w : 600;
    const safeH = Number.isFinite(size.h) ? size.h : 220;
    const W = Math.max(1, Math.floor(safeW));
    const H = Math.max(1, Math.floor(Math.max(safeH, 220)));
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, W, H);
    const cx = Math.floor(W / 2);
    const cy = Math.floor(H / 2);
    const R = Math.floor(Math.min(W, H) * 0.4);
    let vmax = 0;
    for (let i = 0; i < values.length; i++) vmax = Math.max(vmax, Math.abs(values[i]));
    vmax = vmax || 1;
    const img = ctx.createImageData(W, H);
    const put = (x: number, y: number, col: [number, number, number, number]) => {
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      const idx = (y * W + x) * 4;
      img.data[idx + 0] = col[0];
      img.data[idx + 1] = col[1];
      img.data[idx + 2] = col[2];
      img.data[idx + 3] = col[3];
    };
    for (let r = 0; r < height; r++) {
      const rNorm = r / (height - 1);
      const rr = rNorm * R;
      for (let t = 0; t < width; t++) {
        const th = (t / width) * 2 * Math.PI;
        const x = Math.round(cx + rr * Math.cos(th));
        const y = Math.round(cy + rr * Math.sin(th));
        const v = values[r * width + t];
        const css = negPosColor(v, vmax);
        const m = css.match(/\d+/g);
        if (m) {
          put(x, y, [parseInt(m[0], 10), parseInt(m[1], 10), parseInt(m[2], 10), 200]);
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.25, 0, 2 * Math.PI);
    ctx.stroke();
    if (highlightGap) {
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.265, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "12px ui-sans-serif, system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText("separation gap (metric detachment)", cx + R * 0.28, cy - 6);
    }
  }, [ref, size, values, width, height, highlightGap]);

  return (
    <canvas
      ref={ref}
      style={{ width: "100%", height: 260, display: "block", borderRadius: 8 }}
      aria-label="Negative-energy shell around hull (polar heatmap)"
    />
  );
}

function useCanvasSize() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 600, h: 140 });
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const box = (e as any).contentBoxSize?.[0] || e.contentRect;
        const rawW = box?.width;
        const rawH = box?.height;
        const w = Number.isFinite(rawW) ? Math.max(200, Math.floor(rawW)) : 600;
        const h = Number.isFinite(rawH) ? Math.max(80, Math.floor(Math.min(220, rawH))) : 140;
        setSize({ w, h });
      }
    });
    ro.observe(canvas.parentElement || canvas);
    return () => ro.disconnect();
  }, []);
  return { ref, size };
}

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function negPosColor(v: number, vmax: number) {
  const t = Math.tanh(Math.abs(v) / Math.max(1e-12, vmax || 1));
  if (v < 0) {
    const r = Math.floor(lerp(60, 160, t));
    const g = Math.floor(lerp(70, 60, t));
    const b = Math.floor(lerp(160, 220, t));
    return `rgb(${r},${g},${b})`;
  } else if (v > 0) {
    const r = Math.floor(lerp(220, 120, t));
    const g = Math.floor(lerp(170, 220, t));
    const b = Math.floor(lerp(60, 90, t));
    return `rgb(${r},${g},${b})`;
  }
  return "rgb(120,120,120)";
}
