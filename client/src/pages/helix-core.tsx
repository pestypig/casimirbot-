// client/src/pages/helix-core.tsx
import React, { useState, useEffect, useRef, useMemo, Suspense, lazy, startTransition, useCallback } from "react";
import { Link, useSearch } from "wouter";
import { Home, Activity, Gauge, Brain, Terminal, Atom, Send, Settings, HelpCircle, AlertTriangle, Target, CheckCircle2, Video, Layers, Cpu, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { C as SPEED_OF_LIGHT } from '@/lib/physics-const';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { apiRequest, getDevMockStatus, HELIX_DEV_MOCK_EVENT } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useEnergyPipeline,
  useSwitchMode,
  useUpdatePipeline,
  MODE_CONFIGS,
  fmtPowerUnitFromW,
  ModeKey,
  useGreens,
  type EnergyPipelineState as PipelineState,
  type HullBrickPayload,
} from "@/hooks/use-energy-pipeline";
import { useHullPreviewPayload } from "@/hooks/use-hull-preview-payload";
import useTimeLapseRecorder from "@/hooks/useTimeLapseRecorder";
import { useVacuumContract } from "@/hooks/useVacuumContract";
import {
  useFractionalCoherence,
  type FractionalGridCellState,
} from "@/hooks/useFractionalCoherence";
import SpectrumTunerPanel from "@/components/SpectrumTunerPanel";
import type { Provenance } from "@/components/SpectrumTunerPanel";
import VacuumGapSweepHUD from "@/components/VacuumGapSweepHUD";
import QiWidget from "@/components/QiWidget";
import SectorLegend from "@/components/SectorLegend";
import SectorRolesHud from "@/components/SectorRolesHud";
import CavityMechanismPanel from "@/components/CavityMechanismPanel";
import { PHASE_STREAK_BASE_HUE_DEG } from "@/constants/phase-streak";
import usePhaseBridge from "@/hooks/use-phase-bridge";
import { useNavPoseDriver } from "@/hooks/use-nav-pose-driver";
import NearZeroWidget from "@/components/NearZeroWidget";
import VacuumGapHeatmap from "@/components/VacuumGapHeatmap";
import SweepReplayControls from "@/components/SweepReplayControls";
import MetricAmplificationPocket from "../components/MetricAmplificationPocket";
import VacuumContractBadge from "@/components/VacuumContractBadge";
import DriveGuardsPanel from "@/components/DriveGuardsPanel";
import PhoenixNeedlePanel from "@/components/PhoenixNeedlePanel";
import WarpProofPanel from "@/components/WarpProofPanel";
import CardProofOverlay from "@/components/CardProofOverlay";
import CollapseBenchmarkHUD from "@/components/CollapseBenchmarkHUD";
import HelixHullCardsPanel from "@/components/HelixHullCardsPanel";
import SpeedCapabilityPanel from "@/components/SpeedCapabilityPanel";
import DirectionPad from "@/components/DirectionPad";
import NavPageSection from "@/components/NavPageSection";
import { SUPPRESS_HASH_SCROLL_KEY, useScrollHashSync } from "@/lib/whispers/useScrollHashSync";
import { FractionalCoherenceRail } from "@/components/FractionalCoherenceRail";
import { FractionalCoherenceGrid } from "@/components/FractionalCoherenceGrid";
import HelixMarkIcon from "@/components/icons/HelixMarkIcon";
import openAiLogo from "@/assets/open-ai-logo.svg";
import githubLogo from "@/assets/git hub symbol.svg";
import { downloadCSV } from "@/utils/csv";
import { computeTidalEij, type V3 } from "@/lib/tidal";
import { defaultOverlayPrefsForProfile, useHull3DSharedStore } from "@/store/useHull3DSharedStore";
import type { CardMeshMetadata, VacuumGapSweepRow, RidgePreset, DynamicConfig, SweepRuntime, WarpFallbackMode, HullPreviewPayload } from "@shared/schema";
import { resolveHullBasis, type HullBasisResolved } from "@shared/hull-basis";
import type { VizIntent } from "@/lib/nav/nav-dynamics";
import { resolveHullDimsEffective } from "@/lib/resolve-hull-dims";
import { VIEWER_WIREFRAME_BUDGETS } from "@/lib/resolve-wireframe-overlay";
import { useStressEnergyBrick } from "@/hooks/useStressEnergyBrick";
import { OBSERVER_ROBUST_SELECTION_CHANNEL, type ObserverConditionKey, type ObserverFrameKey } from "@/lib/stress-energy-brick";
import { buildCardSignatures, ensureCardRecipeSchemaVersion } from "@/lib/card-signatures";
import { buildCardExportSidecar } from "@/lib/card-export-sidecar";
import { buildLatticeTextureExports, extractCardLatticeMetadata } from "@/lib/lattice-export";
import type { HullDistanceGrid } from "@/lib/lattice-sdf";
import type { LatticeFrame } from "@/lib/lattice-frame";
import DeepMixingSolarView from "@/components/DeepMixingSolarView";
import DeepMixSweetSpot from "@/components/deepmix/DeepMixSweetSpot";
const DeepMixGlobePanel = lazy(() => import("@/components/deepmix/DeepMixGlobePanel"));
import {
  DeepMixingAutopilot,
  DEEP_MIXING_AUTOPILOT_STATES,
  DEEP_MIXING_DEFAULT_TELEMETRY,
  DEEP_MIXING_TARGETS,
  controlStep as deepMixingControlStep,
  deltaTIndexFromValue,
  vrSetpointForPreset,
  DeepMixingAutopilotState,
  DeepMixingTelemetry,
  DeepMixingPreset,
} from "@/lib/deepMixingPreset";

type PumpStatus = "idle" | "ok" | "warn" | "hazard";

type PumpStability = {
  status: PumpStatus;
  gapNm?: number;
  phaseDeg?: number;
  modDepthPct?: number;
  pumpFreqGHz?: number;
  detuneMHz?: number;
  detuneOverKappa?: number;
  kappaMHz?: number;
  kappaEffMHz?: number;
  rhoRaw?: number;
  rhoEst?: number;
  issues: string[];
  f0GHz?: number;
  recommendation: {
    gapNm: number;
    phaseDeg: number;
    modDepthPct: number;
    detuneMHz: number;
    pumpFreqGHz?: number;
    rhoTarget: number;
  };
};

const PUMP_PHASE_BIAS_KEY = "helix:pumpPhaseBiasDeg";
const AUTO_APPLY_PREVIEW_KEY = "helix:autoApplyPreview";
const AUTO_APPLY_FALLBACK_KEY = "helix:autoApplyPreviewFallbackMode";

const DEEP_MIXING_STATE_BADGE: Record<DeepMixingAutopilotState, string> = {
  PLAN: "bg-cyan-500/20 text-cyan-200",
  PROXOPS: "bg-amber-500/20 text-amber-200",
  ACTUATE: "bg-emerald-500/20 text-emerald-200",
  FEEDBACK: "bg-blue-500/20 text-blue-200",
  SAFE: "bg-rose-500/20 text-rose-200",
};

const DEEP_MIXING_SECONDS_PER_YEAR = 365.25 * 86400;

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const encodeBytesToBase64 = (bytes: Uint8Array): string => {
  const globalScope = globalThis as {
    btoa?: (value: string) => string;
    Buffer?: {
      from?: (
        input: Uint8Array,
      ) => { toString: (encoding: string) => string };
    };
  };
  if (typeof globalScope.btoa === "function") {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode(...chunk);
    }
    return globalScope.btoa(binary);
  }
  const bufferFactory = globalScope.Buffer;
  if (bufferFactory && typeof bufferFactory.from === "function") {
    return bufferFactory.from(bytes).toString("base64");
  }
  let output = "";
  let i = 0;
  const { length } = bytes;
  for (; i + 2 < length; i += 3) {
    const chunk =
      (bytes[i] << 16) |
      (bytes[i + 1] << 8) |
      bytes[i + 2];
    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output += BASE64_ALPHABET[(chunk >> 6) & 63];
    output += BASE64_ALPHABET[chunk & 63];
  }
  const remaining = length - i;
  if (remaining === 1) {
    const chunk = bytes[i] << 16;
    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output += "==";
  } else if (remaining === 2) {
    const chunk =
      (bytes[i] << 16) |
      (bytes[i + 1] << 8);
    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output += BASE64_ALPHABET[(chunk >> 6) & 63];
    output += "=";
  }
  return output;
};

const encodeFloat32ToBase64 = (values: Float32Array): string => {
  const bytes = new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
  return encodeBytesToBase64(bytes);
};

const densifyHullDistanceGrid = (grid: HullDistanceGrid) => {
  const dims = grid.dims;
  const total = Math.max(1, dims[0] * dims[1] * dims[2]);
  const bandRaw = Number(grid.band);
  const band = Number.isFinite(bandRaw) && bandRaw > 0 ? bandRaw : 1;
  const fillValue = Number.isFinite(grid.stats?.maxAbsDistance)
    ? Math.max(grid.stats.maxAbsDistance, band)
    : band;
  const out = new Float32Array(total);
  out.fill(fillValue);
  let min = fillValue;
  let max = fillValue;
  const indices = grid.indices;
  const distances = grid.distances;
  const len = Math.min(indices.length, distances.length);
  for (let i = 0; i < len; i += 1) {
    const idx = indices[i];
    if (idx >= total) continue;
    const value = distances[i];
    if (!Number.isFinite(value)) continue;
    out[idx] = value;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max)) max = 0;
  return { data: out, min, max };
};

const resolveHullBrickBounds = (grid: HullDistanceGrid, frame: LatticeFrame | null) => {
  const half = frame?.bounds?.halfSize ?? [grid.bounds[0], grid.bounds[1], grid.bounds[2]];
  const min: [number, number, number] = frame?.bounds?.minLattice ?? [-half[0], -half[1], -half[2]];
  const max: [number, number, number] = frame?.bounds?.maxLattice ?? [half[0], half[1], half[2]];
  const center: [number, number, number] = [
    (min[0] + max[0]) * 0.5,
    (min[1] + max[1]) * 0.5,
    (min[2] + max[2]) * 0.5,
  ];
  const extent: [number, number, number] = [
    Math.abs(max[0] - min[0]) * 0.5,
    Math.abs(max[1] - min[1]) * 0.5,
    Math.abs(max[2] - min[2]) * 0.5,
  ];
  const axes: [number, number, number] = [
    Math.max(1e-6, Math.abs(extent[0])),
    Math.max(1e-6, Math.abs(extent[1])),
    Math.max(1e-6, Math.abs(extent[2])),
  ];
  return { min, max, center, extent, axes };
};

const buildHullBrickPayloadFromSdf = (
  grid: HullDistanceGrid,
  frame: LatticeFrame | null,
  meshHashHint?: string | null,
): HullBrickPayload => {
  const { data, min, max } = densifyHullDistanceGrid(grid);
  const bounds = resolveHullBrickBounds(grid, frame);
  const meshHash = grid.meshHash ?? meshHashHint ?? null;
  return {
    dims: grid.dims,
    voxelBytes: 4,
    format: "r32f",
    channels: {
      hullDist: {
        data: encodeFloat32ToBase64(data),
        min,
        max,
      },
    },
    bounds,
    meta: {
      meshHash: meshHash ?? undefined,
      basisSignature: grid.basisSignature ?? undefined,
      band_m: grid.band,
      voxelSize_m: grid.voxelSize,
      source: "lattice-sdf",
    },
  };
};

const PANEL_HASHES = {
  fractionalRail: "fractional-coherence-rail",
  fractionalGrid: "fractional-coherence-grid",
  quickMode: "mode-switch",
  warpShell: "warp-shell",
  lightSpeed: "light-speed-timeline",
  timeLapse: "time-lapse-demo",
  speedCapability: "speed-capability",
  driveGuards: "drive-guards",
  energyControl: "energy-control",
  complianceHud: "compliance-hud",
  vacuumSweep: "vacuum-gap-sweep",
  mainframeTerminal: "mainframe-terminal",
  operationsToolbar: "operations-toolbar",
  missionPlanner: "mission-planner",
  hullCards: "hull-cards",
} as const;

const HASH_ALIASES: Record<string, string> = {
  "ledger-averaging": PANEL_HASHES.driveGuards,
  "ledger-shift": PANEL_HASHES.driveGuards,
  "ledger-step-b": PANEL_HASHES.driveGuards,
  "speed": PANEL_HASHES.speedCapability,
  "speed-capability": PANEL_HASHES.speedCapability,
  "beta-speed": PANEL_HASHES.speedCapability,
};

const clampPhaseBiasDeg = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-10, Math.min(10, value));
};

const normalizePhaseToVizYaw = (phase01: number | undefined): number => {
  if (!Number.isFinite(phase01)) return 0;
  const wrapped = ((((phase01 as number) % 1) + 1) % 1);
  const signed = ((wrapped * 360 + 180) % 360) - 180;
  return signed / 180;
};
// Greens bridge: auto-publish  from pipeline/metrics so the Greens cards populate
const poissonG = (r: number) => 1 / (4 * Math.PI * Math.max(r, 1e-6));
function computePhi(positions: V3[], rho: number[], kernel = poissonG, normalize = true) {
  const N = positions.length, out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const [xi, yi, zi] = positions[i]; let sum = 0;
    for (let j = 0; j < N; j++) {
      const [xj, yj, zj] = positions[j];
      const r = Math.hypot(xi - xj, yi - yj, zi - zj) + 1e-6;
  sum += kernel(r) * rho[j]; 
    }
    out[i] = sum;
  }
  if (normalize && N > 0) {
    let mn = +Infinity, mx = -Infinity;
    for (let i = 0; i < N; i++) { const v = out[i]; if (v < mn) mn = v; if (v > mx) mx = v; }
    const span = mx - mn || 1;
    for (let i = 0; i < N; i++) out[i] = (out[i] - mn) / span;
  }
  return out;
}

/**
 * GreensLivePanel  proves we are rendering *live* values from the pipeline.
 * - Shows kernel, normalization,  stats, data source (CLIENT/SERVER)
 * - Mirrors operational mode, FR duty, tauLC, burst/dwell, sectorization
 * - Flashes a LIVE badge and updates "updated X ms ago" timestamp on changes
 */
function GreensLivePanel() {
  const qc = useQueryClient();
  // 1) Live pipeline (mode, timing knobs, derived duty, tauLC)  refetch 1s in hook
  const { data: live } = useEnergyPipeline({ refetchInterval: 1000 });
  // 2) System metrics (for LC/timing fallbacks)  refetch 1s
  const { data: metrics } = useQuery({ queryKey: ["/api/helix/metrics"], refetchInterval: 1000 });
  // 3) Green's potential payload (cache+event live feed)
  const greens = useGreens();

  // 4) Derived snapshot (single source of truth other panels share)
  const derived = qc.getQueryData(["helix:pipeline:derived"]) as any | undefined;
  const tidal = qc.getQueryData<{ norm: number; eigenvalues: [number, number, number]; source?: string }>(["helix:pipeline:tidal"]);

  // ---- helpers ----
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  type Prov<T> = { val?: T; from?: Provenance };
  function prov<T>(val?: T, from?: Provenance): Prov<T> {
    return { val, from };
  }
  const isNum = (x: any): x is number => typeof x === "number" && Number.isFinite(x);
  const toMs = (v?: number, unit: "ms" | "s" | "us" = "ms") =>
    isNum(v) ? (unit === "s" ? v * 1000 : unit === "us" ? v / 1000 : v) : undefined;
  const saneMs = (v?: number) => (isNum(v) && v > 0 ? v : undefined);

  // Returns timing with explicit priority and unit coercion
  function pickTiming(): {
    tauLC: Prov<number | undefined>;
    burst: Prov<number | undefined>;
    dwell: Prov<number | undefined>;
    sectorsTotal: Prov<number | undefined>;
    sectorsConcurrent: Prov<number | undefined>;
  } {
    const lcMetrics = (metrics as any)?.lightCrossing ?? {};
    const lcLive = (live as any)?.lightCrossing ?? {};

    function prefer<T>(...values: (T | undefined)[]): T | undefined {
      for (const value of values) {
        if (value !== undefined) return value;
      }
      return undefined;
    }

    const toNumber = (value: unknown) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : undefined;
    };

    const tauFromMetrics = saneMs(prefer(
      toMs(toNumber(lcMetrics.tauLC_ms), "ms"),
      toMs(toNumber(lcMetrics.tau_ms), "ms"),
      toMs(toNumber(lcMetrics.tauLC_s), "s"),
    ));

    const tauFromDerived = saneMs(prefer(
      toNumber(derived?.tauLC_ms),
      toNumber(derived?.tautauLC_ms),
    ));

    const tauFromLive = saneMs(prefer(
      toMs(toNumber((live as any)?.tautauLC_ms), "ms"),
      toMs(toNumber((live as any)?.tauLC_ms), "ms"),
      toMs(toNumber(lcLive.tauLC_ms), "ms"),
      toMs(toNumber(lcLive.tau_ms), "ms"),
      toMs(toNumber(lcLive.tauLC_s), "s"),
    ));

    const tauLC =
      tauFromMetrics !== undefined ? prov(tauFromMetrics, "metrics") :
      tauFromDerived !== undefined ? prov(tauFromDerived, "derived") :
      tauFromLive !== undefined ? prov(tauFromLive, "live") :
      prov<number | undefined>(undefined);

    const burstMetrics = saneMs(toMs(toNumber(lcMetrics.burst_ms), "ms"));
    const burstDerived = saneMs(toNumber(derived?.burst_ms));
    const burstLive = saneMs(prefer(
      toMs(toNumber((live as any)?.burst_ms), "ms"),
      toMs(toNumber(lcLive.burst_ms), "ms"),
    ));

    const burst =
      burstMetrics !== undefined ? prov(burstMetrics, "metrics") :
      burstDerived !== undefined ? prov(burstDerived, "derived") :
      burstLive !== undefined ? prov(burstLive, "live") :
      prov<number | undefined>(undefined);

    const dwellMetrics = saneMs(prefer(
      toMs(toNumber(lcMetrics.dwell_ms), "ms"),
      toMs(toNumber(lcMetrics.sectorPeriod_ms), "ms"),
    ));

    const dwellDerived = saneMs(prefer(
      toNumber(derived?.dwell_ms),
      toNumber(derived?.sectorPeriod_ms),
    ));

    const dwellLive = saneMs(prefer(
      toMs(toNumber((live as any)?.dwell_ms), "ms"),
      toMs(toNumber((live as any)?.sectorPeriod_ms), "ms"),
      toMs(toNumber(lcLive.dwell_ms), "ms"),
      toMs(toNumber(lcLive.sectorPeriod_ms), "ms"),
    ));

    const dwell =
      dwellMetrics !== undefined ? prov(dwellMetrics, "metrics") :
      dwellDerived !== undefined ? prov(dwellDerived, "derived") :
      dwellLive !== undefined ? prov(dwellLive, "live") :
      prov<number | undefined>(undefined);

    const sectorsTotalMetrics = toNumber((metrics as any)?.totalSectors);
    const sectorsTotalDerived = toNumber(derived?.sectorsTotal);
    const sectorsTotalLive = toNumber((live as any)?.sectorsTotal ?? (live as any)?.sectorCount);

    const sectorsTotal =
      sectorsTotalMetrics !== undefined ? prov(sectorsTotalMetrics, "metrics") :
      sectorsTotalDerived !== undefined ? prov(sectorsTotalDerived, "derived") :
      sectorsTotalLive !== undefined ? prov(sectorsTotalLive, "live") :
      prov<number | undefined>(undefined);

    const sectorsConcurrentMetrics = toNumber((metrics as any)?.activeSectors);
    const sectorsConcurrentDerived = toNumber(derived?.sectorsConcurrent);
    const sectorsConcurrentLive = toNumber((live as any)?.sectorsConcurrent ?? (live as any)?.concurrentSectors);

    const sectorsConcurrent =
      sectorsConcurrentMetrics !== undefined ? prov(sectorsConcurrentMetrics, "metrics") :
      sectorsConcurrentDerived !== undefined ? prov(sectorsConcurrentDerived, "derived") :
      sectorsConcurrentLive !== undefined ? prov(sectorsConcurrentLive, "live") :
      prov<number | undefined>(undefined);

    return { tauLC, burst, dwell, sectorsTotal, sectorsConcurrent };
  }

  const toF32 = (values: Float32Array | number[] | undefined) =>
    !values ? undefined : (values instanceof Float32Array ? values : new Float32Array(values));

  const fmtPct = (value: number) => `${(value * 100).toFixed(3)}%`;

  const fmtExpLocal = (value: number) =>
    Math.abs(value) < 1e-3 || Math.abs(value) > 1e3
      ? value.toExponential(3)
      : value.toFixed(6);

  const fmtSI = (ms?: number) => {
    if (!Number.isFinite(ms)) return "-";
    const value = ms as number;
    if (value < 1) return `${(value * 1000).toFixed(1)} us`;
    if (value < 1000) return `${value.toFixed(2)} ms`;
    return `${(value / 1000).toFixed(2)} s`;
  };

  const stat = (array: Float32Array) => {
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let sumSq = 0;
    const length = array.length;
    for (let i = 0; i < length; i++) {
      const value = array[i];
      if (value < min) min = value;
      if (value > max) max = value;
      sum += value;
      sumSq += value * value;
    }
    const mean = sum / Math.max(1, length);
    const variance = Math.max(0, (sumSq / Math.max(1, length)) - mean * mean);
    return { N: length, min, max, mean, std: Math.sqrt(variance) };
  };
  // ---- stable, physics-grounded reads ----
  const source = greens?.source ?? "none";
  const kind = greens?.kind ?? "poisson";
  const normalized = !!greens?.normalize;
  const mHelm = Number(greens?.m ?? 0);
  const phi = toF32(greens?.phi);
  const phiStat = phi ? stat(phi) : undefined;
  const tidalNorm = tidal?.norm;
  const tidalLeadEigen = tidal?.eigenvalues?.[0];

  const mode = (derived?.mode ?? (live as any)?.currentMode ?? (metrics as any)?.currentMode ?? "hover") as string;
  const dutyFR =
    Number.isFinite(derived?.dutyEffectiveFR) ? derived.dutyEffectiveFR :
    Number.isFinite((live as any)?.dutyEffectiveFR) ? (live as any).dutyEffectiveFR :
    undefined;

  // unified, normalized timing and sectorization (with provenance)
  const T = pickTiming();
  const tauLC_ms = T.tauLC.val;
  const burst_ms = T.burst.val;
  const dwell_ms = T.dwell.val;
  // Panel-local duty from timing & sectorization (metrics-first, physics-grounded)
  const dutyFR_calc =
    (isNum(burst_ms) && isNum(dwell_ms) && dwell_ms! > 0 &&
     isNum(T.sectorsTotal.val) && T.sectorsTotal.val! > 0 &&
     isNum(T.sectorsConcurrent.val))
      ? clamp01((burst_ms! / dwell_ms!) * (T.sectorsConcurrent.val! / T.sectorsTotal.val!))
      : undefined;
  // Fallback to derived/live if timing is incomplete
  const dutyFR_fallback =
    Number.isFinite(derived?.dutyEffectiveFR) ? derived.dutyEffectiveFR :
    Number.isFinite((live as any)?.dutyEffectiveFR) ? (live as any).dutyEffectiveFR :
    undefined;
  const dutyFR_display = (isNum(dutyFR_calc) ? dutyFR_calc : dutyFR_fallback);
  const dutyDelta = (isNum(dutyFR_calc) && Number.isFinite(dutyFR_fallback))
    ? Math.abs(dutyFR_calc - (dutyFR_fallback as number))
    : undefined;
  const dutyConsistent = !isNum(dutyDelta) || dutyDelta < 5e-4; 
  const r_b_over_tau = (isNum(burst_ms) && isNum(tauLC_ms) && tauLC_ms! > 0) ? (burst_ms! / tauLC_ms!) : undefined;
  const sectorsTotal = T.sectorsTotal.val;
  const sectorsConcurrent = T.sectorsConcurrent.val;

  // Reciprocity computed on normalized ms values, but prefer derived if present
  const reciprocity = derived?.reciprocity ?? (() => {
    if (isNum(burst_ms) && isNum(tauLC_ms)) {
      return burst_ms < tauLC_ms
        ? { status: "BROKEN_INSTANT", message: "burst < tauLC (instant non-reciprocal)" }
        : { status: "PASS_AVG", message: "burst >= tauLC (average reciprocal)" };
    }
    return { status: "UNKNOWN", message: "missing burst/tauLC" };
  })();

  const dutyFrom = isNum(dutyFR_calc) ? "calc" : (Number.isFinite(dutyFR_fallback) ? "derived" : "");
  // Development-only diagnostic: log duty components and compare to pipeline-provided values
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV) {
    React.useEffect(() => {
      try {
        // Keep this debug tidy and scoped to dev only
        console.debug('[GreensLivePanel duty-debug]', {
          burst_ms, dwell_ms, sectorsTotal, sectorsConcurrent,
          dutyFR_calc, dutyFR_fallback, dutyFR_display,
          derivedDuty: derived?.dutyEffectiveFR,
          liveDuty: (live as any)?.dutyEffectiveFR,
        });
      } catch (e) {}
    }, [burst_ms, dwell_ms, sectorsTotal, sectorsConcurrent, dutyFR_calc, dutyFR_fallback, derived?.dutyEffectiveFR, (live as any)?.dutyEffectiveFR]);
  }

  // ---- undeniable liveness: flash + age counter ----
  const [sig, setSig] = React.useState<string>("");
  const [lastAt, setLastAt] = React.useState<number>(0);
  const [flash, setFlash] = React.useState<boolean>(false);
  React.useEffect(() => {
    const N = phiStat?.N ?? 0;
    const mean = phiStat?.mean ?? NaN;
    const min = phiStat?.min ?? NaN;
    const max = phiStat?.max ?? NaN;
    const src = source ?? "none";
    const k = kind ?? "poisson";
    const newSig = `${src}|${k}|${normalized?'1':'0'}|N=${N}|=${mean.toFixed(6)}|${min.toFixed(6)}..${max.toFixed(6)}`;
    if (newSig && newSig !== sig) {
      setSig(newSig);
      setLastAt(Date.now());
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 350);
      return () => clearTimeout(t);
    }
  }, [source, kind, normalized, phiStat?.N, phiStat?.mean, phiStat?.min, phiStat?.max]);
  const ageMs = Math.max(0, Date.now() - (lastAt || Date.now()));

  if (!phi || (phi.length ?? 0) === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-slate-400">
        No Green's data available
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${flash ? "bg-emerald-400 shadow-[0_0_0_3px] shadow-emerald-400/40" : "bg-emerald-600/70"}`} />
          <span className="text-xs font-semibold tracking-wide uppercase text-emerald-300/90">
            LIVE  {source === "server" ? "SERVER" : source === "client" ? "CLIENT" : "UNKNOWN"} SOURCE
          </span>
        </div>
        <div className="text-xs tabular-nums text-slate-400">
          updated {ageMs.toFixed(0)} ms ago
        </div>
      </div>

      {/* provenance row  makes it undeniable which path feeds the panel */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
        <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-slate-300">Duty: {dutyFrom}</span>
        <span className={`rounded-full px-2 py-0.5 ${dutyConsistent ? "bg-emerald-600/30 text-emerald-200" : "bg-amber-600/30 text-amber-200"}`}>
          consistency: {isNum(dutyDelta) ? `${(dutyDelta*100).toFixed(3)}%` : "n/a"}
        </span>
        <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-slate-300">tauLC: {T.tauLC.from ?? ""}</span>
        <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-slate-300">burst: {T.burst.from ?? ""}</span>
        <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-slate-300">dwell: {T.dwell.from ?? ""}</span>
        <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-slate-300">S_total: {T.sectorsTotal.from ?? ""}</span>
        <span className="rounded-full bg-slate-800/70 px-2 py-0.5 text-slate-300">S_live: {T.sectorsConcurrent.from ?? ""}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Physics + kernel */}
        <div className="rounded-xl bg-slate-800/40 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Kernel</div>
          <div className="font-mono text-sm">
            {kind === "helmholtz" ? `Helmholtz (m=${mHelm})` : "Poisson"}
            {normalized ? "  norm" : ""}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <div className="text-slate-400">N (tiles)</div>
            <div className="font-mono">{phiStat?.N ?? 0}</div>
            <div className="text-slate-400">_min</div>
            <div className="font-mono">{fmtExpLocal(phiStat!.min)}</div>
            <div className="text-slate-400">_max</div>
            <div className="font-mono">{fmtExpLocal(phiStat!.max)}</div>
            <div className="text-slate-400">_mean</div>
            <div className="font-mono">{fmtExpLocal(phiStat!.mean)}</div>
            <div className="text-slate-400">_std</div>
            <div className="font-mono">{fmtExpLocal(phiStat!.std)}</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <div className="text-slate-400">?E? (Weyl)</div>
            <div className="font-mono">
              {Number.isFinite(tidalNorm) ? (tidalNorm as number).toExponential(3) : "-"}
            </div>
            <div className="text-slate-400">eig (|?|max)</div>
            <div className="font-mono">
              {Number.isFinite(tidalLeadEigen) ? (tidalLeadEigen as number).toExponential(2) : "-"}
            </div>
          </div>
        </div>

        {/* Operational mode + duty */}
        <div className="rounded-xl bg-slate-800/40 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Operational</div>
          <div className="flex items-center justify-between">
            <div className="font-mono text-sm">{mode}</div>
            <div className="text-xs text-slate-400">sectors</div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <div className="text-slate-400">Duty (FR)</div>
            <div className="font-mono" title={
              isNum(burst_ms)&&isNum(dwell_ms)&&isNum(sectorsTotal)&&isNum(sectorsConcurrent)
                ? `(burst/dwell)*(S_live/S_total) = (${burst_ms!.toFixed(3)}ms/${dwell_ms!.toFixed(3)}ms)*(${sectorsConcurrent}/${sectorsTotal})`
                : "missing timing/sectors"
            }>
              {Number.isFinite(dutyFR_display) ? fmtPct(dutyFR_display!) : ""}
            </div>
            <div className="text-slate-400">S_total</div>
            <div className="font-mono">{sectorsTotal ?? ""}</div>
            <div className="text-slate-400">S_live</div>
            <div className="font-mono">{sectorsConcurrent ?? ""}</div>
          </div>
          {/* duty bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
            <div
              className="h-full bg-emerald-500/80 transition-[width] duration-300"
              style={{ width: `${Math.max(0, Math.min(100, (Number.isFinite(dutyFR_display) ? dutyFR_display! : 0) * 100))}%` }}
            />
          </div>
        </div>

        {/* Light-crossing & reciprocity */}
        <div className="rounded-xl bg-slate-800/40 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Light-Crossing</div>
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
            <div className="text-slate-400">tauLC</div>
            <div className="font-mono">{fmtSI(tauLC_ms)}</div>
            <div className="text-slate-400">burst</div>
            <div className="font-mono">{fmtSI(burst_ms)}</div>
            <div className="text-slate-400">dwell</div>
            <div className="font-mono">{fmtSI(dwell_ms)}</div>
            <div className="text-slate-400">reciprocity</div>
            <div className={`font-mono ${reciprocity?.status === "PASS_AVG" ? "text-emerald-300" : reciprocity?.status === "BROKEN_INSTANT" ? "text-amber-300" : "text-slate-300"}`}>
              {reciprocity?.status ?? "UNKNOWN"}
            </div>
          </div>
          {isNum(burst_ms) && isNum(tauLC_ms) && (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
                <div
                  className={`h-full ${burst_ms! < tauLC_ms! ? "bg-amber-400/80" : "bg-emerald-500/80"}`}
                  style={{ width: `${Math.max(0, Math.min(100, (burst_ms! / Math.max(1, tauLC_ms!)) * 100))}%` }}
                  title={`burst / tauLC = ${r_b_over_tau?.toFixed(3) ?? ""}`}
                />
              </div>
              <div className="mt-1 text-xs text-slate-400">
                burst / tauLC = {r_b_over_tau ? `${r_b_over_tau.toFixed(1)}` : ""} ({mode})
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function useGreensBridge() {
  const qc = useQueryClient();
  const { data: pipelineState } = useEnergyPipeline();
  const { data: systemMetrics } = useQuery({
    queryKey: ["/api/helix/metrics"],
    refetchInterval: 5000,
  });

  useEffect(() => {
    // 1) Server already provided ?
    const srv = pipelineState?.greens as (GreensPayload | Record<string, unknown> | null | undefined);
    const tiles =
      ((systemMetrics as any)?.tileData ??
        (systemMetrics as any)?.tiles) as { pos: V3; t00: number }[] | undefined;
    if (srv && typeof srv === "object" && "phi" in srv) {
      const phiRaw = (srv as { phi?: unknown }).phi;
      const phiArray =
        phiRaw instanceof Float32Array
          ? phiRaw
          : Array.isArray(phiRaw)
            ? new Float32Array(phiRaw)
            : (phiRaw && typeof (phiRaw as ArrayBufferLike).byteLength === "number"
                ? new Float32Array(phiRaw as ArrayBufferLike)
                : null);
      if (phiArray instanceof Float32Array && phiArray.length > 0) {
        const payload: GreensPayload = {
          kind: (srv as GreensPayload).kind ?? "poisson",
          m: (srv as GreensPayload).m ?? 0,
          normalize: (srv as GreensPayload).normalize !== false,
          phi: phiArray,
          size: phiArray.length,
          source: "server",
        };
        qc.setQueryData(["helix:pipeline:greens"], payload);
        try { window.dispatchEvent(new CustomEvent("helix:greens", { detail: payload })); } catch {}
        if (Array.isArray(tiles) && tiles.length === payload.size) {
          const positions = tiles.map((t) => t.pos as V3);
          const tidal = computeTidalEij(phiArray, positions);
          const tidalPayload = { ...tidal, source: "server" as const };
          qc.setQueryData(["helix:pipeline:tidal"], tidalPayload);
          try { window.dispatchEvent(new CustomEvent("helix:tidal", { detail: tidalPayload })); } catch {}
        }
        return;
      }
    }

    // 2) Otherwise derive on the client from metrics tile data (prefer tileData; fallback to tiles)
    if (Array.isArray(tiles) && tiles.length > 0) {
      const positions = tiles.map((t) => t.pos as V3);
      const rho = tiles.map(t => t.t00);
      const phi = computePhi(positions, rho, poissonG, true);
      const payload = { kind: "poisson" as const, m: 0, normalize: true, phi, size: phi.length, source: "client" as const };
      qc.setQueryData(["helix:pipeline:greens"], payload);
      try { window.dispatchEvent(new CustomEvent("helix:greens", { detail: payload })); } catch {}
      const tidal = computeTidalEij(phi, positions);
      const tidalPayload = { ...tidal, source: "client" as const };
      qc.setQueryData(["helix:pipeline:tidal"], tidalPayload);
      try { window.dispatchEvent(new CustomEvent("helix:tidal", { detail: tidalPayload })); } catch {}
    }
  }, [qc, pipelineState?.greens, (systemMetrics as any)?.tileData, (systemMetrics as any)?.tiles]);
}

// Utils for live mode descriptions

const buildLiveDesc = (
  snap?: { P_avg_MW?: number; P_avg_W?: number; M_exotic_kg?: number; zeta?: number },
  cfg?: { powerTarget_W?: number },
  pipelineTargetW?: number
) => {
  // Use canonical formatter from the shared hook for consistent units
  const watts = Number.isFinite(snap?.P_avg_W)
    ? snap!.P_avg_W!
    : Number.isFinite(snap?.P_avg_MW)
      ? snap!.P_avg_MW! * 1e6
      : undefined;
  const P = fmtPowerUnitFromW(watts);
  const M = Number.isFinite(snap?.M_exotic_kg) ? `${snap!.M_exotic_kg!.toFixed(0)} kg` : " kg";
  const Z = Number.isFinite(snap?.zeta) ? `=${snap!.zeta!.toFixed(3)}` : "=";
  return `${P}  ${M}  ${Z}`;
};

// Mode select items built outside component to prevent re-renders
const buildModeSelectItems = (pipeline: any) => {
  return Object.entries(MODE_CONFIGS).map(([key, cfg]) => {
    const k = key as ModeKey;
    // For current mode, use live values; for others, use config fallback
    const isCurrentMode = k === pipeline?.currentMode;
    const snap = isCurrentMode
      ? { P_avg_MW: pipeline?.P_avg, M_exotic_kg: pipeline?.M_exotic, zeta: pipeline?.zeta }
      : undefined;
    return { key, cfg, snap, k };
  });
};

import { useMetrics } from "@/hooks/use-metrics";
import AlcubierrePanel from "@/components/AlcubierrePanel";
import { FuelGauge, computeEffectiveLyPerHour } from "@/components/FuelGauge";

import { TripPlayer } from "@/components/TripPlayer";
import { GalaxyMapPanZoom } from "@/components/GalaxyMapPanZoom";
import { GalaxyDeepZoom } from "@/components/GalaxyDeepZoom";
import { GalaxyOverlays } from "@/components/GalaxyOverlays";
import { SolarMap } from "@/components/SolarMap";
import { RouteSteps } from "@/components/RouteSteps";
import { BODIES } from "@/lib/galaxy-catalog";
import { HelixPerf } from "@/lib/galaxy-schema";
// draw-lines background helper (ensure this exists on your side)
import { computeSolarXY, solarToBodies, getSolarBodiesAsPc, computeBarycenterPolylineAU } from "@/lib/solar-adapter";
import { Switch } from "@/components/ui/switch";
import { calibrateToImage, SVG_CALIB } from "@/lib/galaxy-calibration";

import { publish, subscribe, unsubscribe } from "@/lib/luma-bus";

// Optional: local fallback counter if seq is missing
let __busSeq = 0;

const toNumber = (x: any, d = 0) => (Number.isFinite(+x) ? +x : d);

// strip purely-meta/bump fields so signature is stable
const stableWU = (x:any) => {
  const { __version, __src, thetaScaleExpected, ...rest } = x || {};
  return rest;
};

function sanitizeServerUniforms(raw: any, version: number) {
  const gammaVdB_vis = toNumber(raw.gammaVanDenBroeck_vis ?? raw.gammaVanDenBroeck ?? raw.gammaVdB, 1.4e5);
  const gammaVdB_mass = toNumber(raw.gammaVanDenBroeck_mass ?? raw.gammaVanDenBroeck ?? raw.gammaVdB, gammaVdB_vis);
  const gammaGeo = Math.max(1, toNumber(raw.gammaGeo, 26));
  const q = Math.max(1e-12, toNumber(raw.qSpoilingFactor ?? raw.deltaAOverA, 1));
  const dFR_raw = toNumber(raw.dutyEffectiveFR, 0.01 / Math.max(1, toNumber(raw.sectorCount, 400)));
  const dFR_phys = Math.max(1e-12, dFR_raw);
  const viewAvg = (raw.viewAvg ?? true) ? true : false;
  const rawView = (raw && typeof raw === "object") ? raw.view : undefined;
  const floors = {
    dFR_view_min: 1e-4,
    vizFloorThetaGR: 1e-9,
    vizFloorRhoGR: 1e-18,
    vizFloorThetaDrive: 1e-6,
  };

  // Canonical expected  (renderer flavor: uses _VdB_vis and d_FR when viewAvg=true)
  const thetaScaleExpected = Math.pow(gammaGeo, 3) * q * gammaVdB_vis * (viewAvg ? Math.sqrt(dFR_phys) : 1);

  // Keep only physics + scheduling + geometry + timing
  const out = {
    // physics
    gammaGeo,
    qSpoilingFactor: q,
    gammaVanDenBroeck_vis: gammaVdB_vis,
    gammaVanDenBroeck_mass: gammaVdB_mass,
    gammaVdB: gammaVdB_vis, // alias for consumers

    // scheduling
    sectorCount: Math.max(1, toNumber(raw.sectorCount, 400)),
    sectors: Math.max(1, toNumber(raw.sectors, 1)),
    dutyCycle: Math.max(0, toNumber(raw.dutyCycle, 0.01)),
    dutyEffectiveFR: dFR_phys,
    currentMode: String(raw.currentMode ?? "hover").toLowerCase() as "hover" | "cruise" | "emergency" | "standby",

    // timing (for FR derivations / panels)
    lightCrossing:
      raw.lightCrossing && {
        burst_ms: toNumber(raw.lightCrossing.burst_ms, 0.01),
        dwell_ms: toNumber(raw.lightCrossing.dwell_ms, 1.0),
      },

    // geometry passthrough (if present)
    hull: raw.hull,

    // averaging flag the renderer actually honors
    viewAvg,

    // helpful derived for checkpoint UIs
    thetaScaleExpected,

    view: {
      ...(rawView ?? {}),
      dFR_view_min: Number.isFinite(rawView?.dFR_view_min)
        ? Math.max(0, Number(rawView?.dFR_view_min))
        : floors.dFR_view_min,
      vizFloorThetaGR: Number.isFinite(rawView?.vizFloorThetaGR)
        ? Math.max(0, Number(rawView?.vizFloorThetaGR))
        : floors.vizFloorThetaGR,
      vizFloorRhoGR: Number.isFinite(rawView?.vizFloorRhoGR)
        ? Math.max(0, Number(rawView?.vizFloorRhoGR))
        : floors.vizFloorRhoGR,
      vizFloorThetaDrive: Number.isFinite(rawView?.vizFloorThetaDrive)
        ? Math.max(0, Number(rawView?.vizFloorThetaDrive))
        : floors.vizFloorThetaDrive,
      autoNormalize: rawView?.autoNormalize ?? true,
    },

    // bus meta
    __src: "server" as const,
    __version: version,
  };

  return out;
}

import { CasimirTileGridPanel } from "@/components/CasimirTileGridPanel";
import { SectorGridRing } from "@/components/SectorGridRing";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { checkpoint } from "@/lib/checkpoints";
import { thetaScaleExpected, thetaScaleUsed } from "@/lib/expectations";
import { ShiftVectorPanel } from "@/components/ShiftVectorPanel";
import { ShellOutlineVisualizer } from "@/components/ShellOutlineVisualizer";
import LightSpeedStrobeScale from "@/components/LightSpeedStrobeScale";
import HelixCasimirAmplifier from "@/components/HelixCasimirAmplifier";
import GrAgentLoopAuditPanel from "@/components/GrAgentLoopAuditPanel";
import { useResonatorAutoDuty } from "@/hooks/useResonatorAutoDuty";
import ResonanceSchedulerTile from "@/components/ResonanceSchedulerTile";
import { useLightCrossingLoop } from "@/hooks/useLightCrossingLoop";
import { useActiveTiles } from "@/hooks/use-active-tiles";
import { useDriveSyncStore } from "@/store/useDriveSyncStore";
import { useFlightDirectorStore } from "@/store/useFlightDirectorStore";

// Mode-specific RF burst fractions now sourced from MODE_CONFIGS

const DEV = process.env.NODE_ENV !== "production";

declare global {
  interface Window {
    setStrobingState?: (args: { sectorCount: number; currentSector: number; split?: number }) => void;
  }
}

// Install a safe wrapper once so any internal visualizer bug can't crash the page
if (typeof window !== "undefined") {
  const w = window as any;
  if (!w.__strobePatched) {
    const orig = w.setStrobingState;
    if (typeof orig !== "function") {
      w.setStrobingState = () => {}; // no-op until a visualizer mounts
    } else {
      w.setStrobingState = (args: any) => {
        try {
          orig(args);
        } catch (err) {
          console.warn("[HELIX] setStrobingState wrapper swallowed error:", err);
        }
      };
    }
    w.__strobePatched = true;
  }
}

// --- Safe numeric formatters ---
const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const fmt = (v: unknown, digits = 3, fallback = "") => (isFiniteNumber(v) ? v.toFixed(digits) : fallback);

const fexp = (v: unknown, digits = 1, fallback = "") => (isFiniteNumber(v) ? v.toExponential(digits) : fallback);

const fint = (v: unknown, fallback = "0") => (isFiniteNumber(v) ? Math.round(v).toLocaleString() : fallback);

const fmtPowerUnit = (mw?: number) => {
  const x = Number(mw);
  if (!Number.isFinite(x)) return "";
  if (x >= 1) return `${x.toFixed(1)} MW`;
  if (x >= 1e-3) return `${(x * 1e3).toFixed(1)} kW`;
  return `${(x * 1e6).toFixed(1)} W`;
};

// add with your other small utils
const npos = (x: unknown, d = 0) => {
  const v = Number(x);
  return Number.isFinite(v) && v > 0 ? v : d;
};
const nnonneg = (x: unknown, d = 0) => {
  const v = Number(x);
  return Number.isFinite(v) && v >= 0 ? v : d;
};

// ---------- Green's function cache helpers ----------
type GreensPayload = {
  kind: "poisson" | "helmholtz";
  m?: number;
  normalize?: boolean;
  phi: Float32Array | number[];
  size?: number;
  source?: "server" | "client" | "none";
};

const fmtExp = (v: unknown, digits = 3) =>
  (typeof v === "number" && Number.isFinite(v)) ? v.toExponential(digits) : "";

function stats(arr: ArrayLike<number>) {
  let min = Infinity, max = -Infinity, sum = 0;
  const N = arr.length;
  for (let i = 0; i < N; i++) {
    const v = Number(arr[i]);
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  return { min, max, mean: N ? sum / N : NaN, N };
}

// Mainframe zones configuration
const SHOW_LOG_TERMINAL = false;

const MAINFRAME_ZONES = {
  TILE_GRID: "Casimir Tile Grid",
  ENERGY_PANEL: "Energy Control Panel",
  COMPLIANCE_HUD: "Metric Compliance HUD",
  PHASE_DIAGRAM: "Phase Diagram AI",
  RESONANCE_SCHEDULER: "Resonance Scheduler",
  LOG_TERMINAL: "Log + Document Terminal",
  WARP_VISUALIZER: "Natrio Warp Bubble",
};

interface SystemMetrics {
  activeSectors: number; // NEW: active sectors (1, 400, etc.)
  totalSectors: number; // NEW: total sectors (400)
  activeTiles: number; // Updated: actual tile count
  totalTiles: number;
  tilesPerSector: number; // NEW: tiles per sector
  sectorStrobing: number; // Added for strobing display
  currentSector: number; // NEW: physics-timed sweep index
  strobeHz: number; // NEW: sector sweep frequency
  sectorPeriod_ms: number; // NEW: time per sector
  energyOutput: number;
  exoticMass: number;
  fordRoman: {
    value: number;
    limit: number;
    status: string;
  };
  natario: {
    value: number;
    status: string;
  };
  curvatureMax: number;
  timeScaleRatio: number;
  overallStatus: string;
  shiftVector?: {
    epsilonTilt: number;
    betaTiltVec: [number, number, number];
  };
  // Optional nested timing structure from backend metrics
  lightCrossing?: {
    tauLC_ms?: number;
    tau_ms?: number;
    tauLC_s?: number;
    sectorPeriod_ms?: number;
    burst_ms?: number;
    dwell_ms?: number;
    sectorsTotal?: number;
    activeSectors?: number;
  };
  // Optional environment snapshot
  env?: {
    atmDensity_kg_m3?: number | null;
    altitude_m?: number | null;
  };
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date | string;
  functionCall?: {
    name: string;
    result: any;
  };
}

// Safe formatter for chat timestamps (some messages come back as strings)
const formatMsgTime = (ts?: Date | string) => {
  if (!ts) return "";
  try {
    return typeof ts === "string" ? new Date(ts).toLocaleTimeString() : ts.toLocaleTimeString();
  } catch {
    return "";
  }
};

export default function HelixCore() {
  useScrollHashSync();
  // Auto-publish  from server pipeline/metrics into the shared cache/event bus
  useGreensBridge();
  // Publish a single authoritative phase (warp:phase) for the renderer + overlays
  usePhaseBridge({ publishHz: 60, damp: 0.15 });
  const vacuumContract = useVacuumContract({
    id: "helix-core",
    label: "Helix Vacuum Stack",
  });

  // Bridge: external helix:greens  publish via luma-bus (no direct engine calls)
  useEffect(() => {
    const handler = (ev: CustomEvent) => {
      const detail: any = (ev && (ev as any).detail) || {};
      const { phi, kind, m } = detail || {};
      try {
        publish("warp:greens", { phi, kind, m });
      } catch (e) {
        if (import.meta.env?.DEV) console.warn("[helix-core] publish warp:greens failed:", e);
      }
    };
    window.addEventListener("helix:greens", handler as EventListener);
    return () => window.removeEventListener("helix:greens", handler as EventListener);
  }, []);

  // (Optional) Idle-time preloads were here. To simplify and avoid redundancy with lazy() below, they are removed.

  // Generate logical sector list (no physics here)
  const SECTORS = useMemo(() => Array.from({ length: 400 }, (_, i) => ({ id: `S${i + 1}` })), []);

  const queryClient = useQueryClient();
  const search = useSearch();
  const helixPanelParam = useMemo(() => {
    try {
      return new URLSearchParams(search).get("panel")?.trim() ?? "";
    } catch {
      return "";
    }
  }, [search]);

  useEffect(() => {
    if (!helixPanelParam) return;
    if (typeof window === "undefined") return;

    const slug = helixPanelParam.toLowerCase();
    if (!slug) return;

    const currentHash = (window.location.hash ?? "").replace(/^#/, "");
    if (currentHash !== slug) {
      window.location.hash = slug;
    } else {
      const hashEvent =
        typeof HashChangeEvent === "function"
          ? new HashChangeEvent("hashchange")
          : new Event("hashchange");
      window.dispatchEvent(hashEvent);
    }

    const params = new URLSearchParams(window.location.search);
    params.delete("panel");
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${
      slug ? `#${slug}` : ""
    }`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [helixPanelParam]);

  const [devMockStatus, setDevMockStatus] = useState(getDevMockStatus());
  const [observerCondition, setObserverCondition] = useState<ObserverConditionKey>("nec");
  const [observerFrame, setObserverFrame] = useState<ObserverFrameKey>("Eulerian");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onMockUsed = (event: Event) => {
      const detail = (event as CustomEvent).detail as ReturnType<typeof getDevMockStatus> | undefined;
      setDevMockStatus(detail ?? getDevMockStatus());
    };
    window.addEventListener(HELIX_DEV_MOCK_EVENT, onMockUsed as EventListener);
    return () => window.removeEventListener(HELIX_DEV_MOCK_EVENT, onMockUsed as EventListener);
  }, []);

const [selectedSector, setSelectedSector] = useState<string | null>(null);
const [tileHoverSector, setTileHoverSector] = useState<number | null>(null);
  const [mainframeLog, setMainframeLog] = useState<string[]>([
    "[HELIX-CORE] System initialized",
    "[HELIX-CORE] Needle Hull mainframe ready",
    "[HELIX-CORE] Awaiting commands...",
  ]);
  const [commandInput, setCommandInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      content: "HELIX-CORE mainframe initialized. Ready for commands.",
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
const [timeLapseCanvas, setTimeLapseCanvas] = useState<HTMLCanvasElement | null>(null);
const [timeLapseOverlayCanvas, setTimeLapseOverlayCanvas] = useState<HTMLCanvasElement | null>(null);
const [timeLapseOverlayDom, setTimeLapseOverlayDom] = useState<HTMLDivElement | null>(null);
const [showSweepHud, setShowSweepHud] = useState(false);
const [includeSweepSidecar, setIncludeSweepSidecar] = useState(true);
const [isExportingCard, setIsExportingCard] = useState(false);
const [isThetaHullMode, setIsThetaHullMode] = useState(false);
const [vizIntent, setVizIntent] = useState<VizIntent>({ rise: 0, planar: 0, yaw: 0 });
const meshOverlayMeta = useHull3DSharedStore((state) => state.meshOverlay);
const viewerState = useHull3DSharedStore((state) => state.viewer);
const viewerPalette = useHull3DSharedStore((state) => state.palette);
const overlayPrefs = useHull3DSharedStore((state) => state.overlayPrefs);       
const sharedLatticeState = useHull3DSharedStore((state) => state.lattice);
const setSharedLattice = useHull3DSharedStore((state) => state.setLattice);     
const setHullViewer = useHull3DSharedStore((state) => state.setViewer);
const handleDirectionPadIntent = useCallback(
  ({ rise, planar }: { rise: number; planar: number }) => {
    setVizIntent((prev) =>
      Math.abs(prev.rise - rise) > 1e-3 || Math.abs(prev.planar - planar) > 1e-3 ? { ...prev, rise, planar } : prev
    );
  },
  []
);
useEffect(() => {
  const updateYaw = (phase: number | undefined) => {
    const yaw = normalizePhaseToVizYaw(phase);
    setVizIntent((prev) => (Math.abs((prev.yaw ?? 0) - yaw) > 1e-3 ? { ...prev, yaw } : prev));
  };
  updateYaw(useDriveSyncStore.getState().phase01);
  const unsubscribe = useDriveSyncStore.subscribe((state) => updateYaw(state.phase01));
  return unsubscribe;
}, [setVizIntent]);
useNavPoseDriver({ vizIntent });
const handlePlanarVizModeChange = useCallback((mode: number) => {
  setIsThetaHullMode(mode === 3);
}, []);
const timeLapseOptions = useMemo(
  () => ({
    canvas: timeLapseCanvas,
    overlayCanvas: timeLapseOverlayCanvas,
    overlayDom: timeLapseOverlayDom,
    overlayEnabled: showSweepHud,
    sidecar: { includeSweep: includeSweepSidecar },
  }),
  [timeLapseCanvas, timeLapseOverlayCanvas, timeLapseOverlayDom, showSweepHud, includeSweepSidecar],
);
const timeLapseRecorder = useTimeLapseRecorder(timeLapseOptions);
const timeLapseUnlocked =
  isThetaHullMode ||
  timeLapseRecorder.isRecording ||
  timeLapseRecorder.isProcessing ||
  timeLapseRecorder.status === "error" ||
  Boolean(timeLapseRecorder.result);
useEffect(() => {
  if (timeLapseRecorder.status === "complete" && showSweepHud) {
    setShowSweepHud(false);
  }
}, [showSweepHud, timeLapseRecorder.status]);

  // Pipeline + hull data (shared across overlays/exports)
  const { data: hullMetrics } = useMetrics(20000); // 20s vs 2s default
  const hullPreview = useHullPreviewPayload();
  const { data: pipelineState } = useEnergyPipeline({
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
  const switchMode = useSwitchMode();
  const stressBrickQuery = useStressEnergyBrick({ quality: "medium", refetchMs: 400 });
  const observerRobustStats = stressBrickQuery.data?.stats?.observerRobust;
  const updatePipeline = useUpdatePipeline();
  const [autoApplyPreview, setAutoApplyPreview] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(AUTO_APPLY_PREVIEW_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
    return true;
  });
  const [autoApplyFallbackMode, setAutoApplyFallbackMode] = useState<WarpFallbackMode>(() => {
    if (typeof window === "undefined") return "warn";
    const raw = window.localStorage.getItem(AUTO_APPLY_FALLBACK_KEY);
    return raw === "warn" || raw === "block" || raw === "allow" ? (raw as WarpFallbackMode) : "warn";
  });
  const lastAutoApplySigRef = useRef<string | null>(null);
  const autoApplyBusyRef = useRef(false);
  const pendingAutoPreviewRef = useRef<HullPreviewPayload | null>(null);        
  const hullBrickUploadRef = useRef<string | null>(null);
  const hullBrickSentRef = useRef<string | null>(null);
  const alcubierreRef = useRef<HTMLDivElement | null>(null);

  const pipeline = pipelineState as PipelineState;
  const hullDimsEffective = useMemo(
    () => resolveHullDimsEffective({ previewPayload: hullPreview, pipelineSnapshot: pipeline as any }),
    [hullPreview, pipeline],
  );
  const geometryFallbackState = (pipeline as any)?.geometryFallback ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AUTO_APPLY_PREVIEW_KEY, autoApplyPreview ? "1" : "0");
  }, [autoApplyPreview]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(AUTO_APPLY_FALLBACK_KEY, autoApplyFallbackMode);
  }, [autoApplyFallbackMode]);

  // Optional: expose for quick console checks
  useEffect(() => {
    (window as any).__energyLive = pipeline;
  }, [pipeline]);

  useEffect(() => {
    publish(OBSERVER_ROBUST_SELECTION_CHANNEL, {
      condition: observerCondition,
      frame: observerFrame,
    });
  }, [observerCondition, observerFrame]);

  const focusAlcubierrePanel = useCallback(() => {
    const node = alcubierreRef.current;
    if (!node) return;
    try {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      node.scrollIntoView();
    }
  }, []);

  const observerConditionSummary = observerRobustStats
    ? observerCondition === "nec"
      ? observerRobustStats.nec
      : observerCondition === "wec"
        ? observerRobustStats.wec
        : observerCondition === "sec"
          ? observerRobustStats.sec
          : observerRobustStats.dec
    : null;

  const dispatchAutoViewEvent = useCallback((detail: any) => {
    if (typeof window === "undefined") return;
    try {
      window.dispatchEvent(new CustomEvent("helix:auto-view-preview" as any, { detail }));
    } catch {
      /* noop */
    }
  }, []);

  const resolveHullBrickCandidate = useCallback(
    (requirePipelineMatch: boolean) => {
      const sdf = sharedLatticeState?.sdf ?? null;
      if (!sdf) return null;
      const previewMeshHash =
        hullPreview?.meshHash ?? hullPreview?.mesh?.meshHash ?? null;
      const pipelineMeshHash =
        (pipeline as any)?.geometryPreview?.mesh?.meshHash ??
        (pipeline as any)?.geometryPreview?.preview?.meshHash ??
        null;
      if (requirePipelineMatch) {
        if (!pipelineMeshHash) return null;
        if (previewMeshHash && pipelineMeshHash !== previewMeshHash) return null;
        if (sdf.meshHash && pipelineMeshHash !== sdf.meshHash) return null;
      }
      if (previewMeshHash && sdf.meshHash && previewMeshHash !== sdf.meshHash) return null;
      const meshHash = previewMeshHash ?? sdf.meshHash ?? pipelineMeshHash ?? null;
      const key = `${sdf.key}|${meshHash ?? "mesh:none"}`;
      if (hullBrickSentRef.current === key || hullBrickUploadRef.current === key) return null;
      const payload = buildHullBrickPayloadFromSdf(sdf, sharedLatticeState?.frame ?? null, meshHash);
      return { key, payload };
    },
    [sharedLatticeState?.sdf, sharedLatticeState?.frame, hullPreview, pipeline],
  );

  const buildPreviewUpdatePayload = useCallback(
    (preview: HullPreviewPayload | null) => {
      if (!preview) return null;
      const meshHash = preview.mesh?.meshHash ?? preview.meshHash ?? undefined;
      const precomputed = preview.precomputed ?? null;
      const previewMesh =
        preview.mesh ??
        (meshHash
          ? {
              meshHash,
              glbUrl: preview.glbUrl,
              basis: preview.basis,
              obb: preview.obb,
              lods: preview.lods,
              coarseLod: preview.lodCoarse,
              fullLod: preview.lodFull,
              provenance: preview.provenance,
              clampReasons: preview.clampReasons,
            }
          : undefined);
      const latticeHashes =
        precomputed?.meta?.hashes ??
        (precomputed?.frame as any)?.hashes ??
        (precomputed as any)?.hashes ??
        undefined;
      const sdfHash =
        latticeHashes?.sdf ??
        (precomputed as any)?.sdf?.key ??
        (precomputed as any)?.sdf?.hash ??
        null;
      const previewSdf =
        sdfHash || precomputed?.frame
          ? {
              key: sdfHash ?? undefined,
              hash: sdfHash ?? undefined,
              clampReasons:
                precomputed?.frame?.clampReasons ??
                precomputed?.meta?.frame?.clampReasons ??
                (precomputed as any)?.clampReasons,
              stats: precomputed?.meta?.stats,
            }
          : undefined;
      const previewLattice =
        precomputed?.meta || precomputed?.frame
          ? {
              enabled: precomputed?.meta?.enabled ?? true,
              frame: precomputed?.frame ?? precomputed?.meta?.frame,
              hashes: latticeHashes,
              band_m: precomputed?.meta?.band_m,
              stats: precomputed?.meta?.stats,
              driveLadder: precomputed?.meta?.driveLadder,
              clampReasons:
                precomputed?.frame?.clampReasons ??
                precomputed?.meta?.frame?.clampReasons ??
                (precomputed as any)?.clampReasons,
            }
          : undefined;
      const hull =
        hullDimsEffective && hullDimsEffective.Lx_m && hullDimsEffective.Ly_m && hullDimsEffective.Lz_m
          ? { Lx_m: hullDimsEffective.Lx_m, Ly_m: hullDimsEffective.Ly_m, Lz_m: hullDimsEffective.Lz_m }
          : preview.targetDims;
      return {
        preview,
        previewMesh,
        previewSdf,
        previewLattice,
        hull,
        warpGeometryKind: "sdf" as const,
        fallbackMode: autoApplyFallbackMode,
      };
    },
    [autoApplyFallbackMode, hullDimsEffective],
  );

  const applyPreviewToPipeline = useCallback(
    async (preview: HullPreviewPayload) => {
      const payload = buildPreviewUpdatePayload(preview);
      if (!payload) return;
      const hullBrickCandidate = resolveHullBrickCandidate(false);
      if (hullBrickCandidate) {
        (payload as any).hullBrick = hullBrickCandidate.payload;
        hullBrickUploadRef.current = hullBrickCandidate.key;
      }
      autoApplyBusyRef.current = true;
      try {
        const response = await updatePipeline.mutateAsync(payload as any);
        if (hullBrickCandidate) {
          hullBrickSentRef.current = hullBrickCandidate.key;
          if (hullBrickUploadRef.current === hullBrickCandidate.key) {
            hullBrickUploadRef.current = null;
          }
        }
        lastAutoApplySigRef.current = `${preview.meshHash ?? preview.mesh?.meshHash ?? "none"}|${preview.updatedAt ?? Date.now()}`;
        const fallback = (response as any)?.geometryFallback;
        const fallbackReasons = Array.isArray(fallback?.reasons) ? fallback.reasons.join(", ") : undefined;
        const fallbackMode = (fallback?.mode as WarpFallbackMode | undefined) ?? autoApplyFallbackMode;
        const fallbackApplied = Boolean(fallback?.applied);
        const warnOnly = fallbackMode === "warn" && !fallbackApplied;
        toast({
          title: fallbackApplied ? "GLB preview applied with fallback" : warnOnly ? "GLB preview warning" : "GLB preview applied",
          description: fallbackApplied
            ? fallbackReasons ?? "Fallback to analytic geometry applied."
            : warnOnly
              ? fallbackReasons ?? "Fallback conditions present."
              : "Warp geometry switched to lattice path.",
          ...(fallbackApplied ? { variant: "destructive" } : warnOnly ? { variant: "default" } : {}),
        });
        const basisResolved =
          hullDimsEffective?.basis ?? (preview.basis ? resolveHullBasis(preview.basis, preview.scale) : null);
        const hullDimsPayload = payload.hull ?? null;
        if (basisResolved || hullDimsPayload) {
          setHullViewer({
            bounds: {
              ...(viewerState?.bounds ?? {}),
              basis: basisResolved ?? viewerState?.bounds?.basis,
            },
          });
        }
        setSharedLattice(null);
        focusAlcubierrePanel();
        dispatchAutoViewEvent({
          basis: basisResolved ?? null,
          hullDims: hullDimsPayload ?? null,
          fallback,
          meshHash: payload.previewMesh?.meshHash ?? preview.meshHash ?? null,
          volumeHash:
            (response as any)?.geometryPreview?.lattice?.hashes?.volume ??
            payload.previewLattice?.hashes?.volume ??
            null,
          sdfKey:
            (response as any)?.geometryPreview?.lattice?.hashes?.sdf ??
            payload.previewSdf?.key ??
            null,
          requireSdf: Boolean(payload.previewSdf),
        });
      } catch (err: any) {
        if (hullBrickCandidate && hullBrickUploadRef.current === hullBrickCandidate.key) {
          hullBrickUploadRef.current = null;
        }
        const fallback = err?.payload?.geometryFallback;
        const fallbackReasons = Array.isArray(fallback?.reasons) ? fallback.reasons.join(", ") : undefined;
        toast({
          title: "Auto-apply preview failed",
          description: fallbackReasons ?? (err instanceof Error ? err.message : "Pipeline update failed"),
          variant: "destructive",
        });
      } finally {
        autoApplyBusyRef.current = false;
        const queued = pendingAutoPreviewRef.current;
        pendingAutoPreviewRef.current = null;
        if (queued) {
          const queuedGlb = queued.glbUrl ?? queued.mesh?.glbUrl ?? "glb:none";
          const queuedSig = `${queuedGlb}|${queued.meshHash ?? queued.mesh?.meshHash ?? "none"}|${queued.updatedAt ?? 0}`;
          if (queuedSig !== lastAutoApplySigRef.current) {
            applyPreviewToPipeline(queued);
          }
        }
      }
    },
    [
      buildPreviewUpdatePayload,
      resolveHullBrickCandidate,
      updatePipeline,
      focusAlcubierrePanel,
      dispatchAutoViewEvent,
      hullDimsEffective?.basis,
      autoApplyFallbackMode,
      setHullViewer,
      viewerState?.bounds,
      setSharedLattice,
    ],
  );

  useEffect(() => {
    if (autoApplyBusyRef.current) return;
    const candidate = resolveHullBrickCandidate(true);
    if (!candidate) return;
    hullBrickUploadRef.current = candidate.key;
    updatePipeline
      .mutateAsync({ hullBrick: candidate.payload } as any)
      .then(() => {
        hullBrickSentRef.current = candidate.key;
      })
      .catch((err) => {
        console.warn("[Helix] hull brick upload failed", err);
      })
      .finally(() => {
        if (hullBrickUploadRef.current === candidate.key) {
          hullBrickUploadRef.current = null;
        }
      });
  }, [resolveHullBrickCandidate, updatePipeline]);

  useEffect(() => {
    if (!autoApplyPreview || !hullPreview) return;
    const glbSig = hullPreview.glbUrl ?? hullPreview.mesh?.glbUrl ?? "glb:none";
    const meshSig = hullPreview.meshHash ?? hullPreview.mesh?.meshHash ?? "mesh:none";
    const sig = `${glbSig}|${meshSig}|${hullPreview.updatedAt ?? 0}`;
    if (autoApplyBusyRef.current) {
      pendingAutoPreviewRef.current = hullPreview;
      return;
    }
    if (sig === lastAutoApplySigRef.current) return;
    pendingAutoPreviewRef.current = null;
    applyPreviewToPipeline(hullPreview);
  }, [autoApplyPreview, hullPreview, applyPreviewToPipeline]);

 const handleExportCard = useCallback(async () => {
   if (isExportingCard) return;
  if (typeof document === "undefined" || typeof window === "undefined") {
    toast({
      title: "Export unavailable",
      description: "Card export is only available in the browser.",
      variant: "destructive",
    });
    return;
  }
  if (!timeLapseCanvas) {
    toast({
      title: "Hull view not ready",
      description: "Open the Alcubierre viewer first so the renderer canvas is available.",
      variant: "destructive",
    });
    return;
  }

   const requestCardProfile = async (mode: "apply" | "restore", requestId: string) => {
    const eventName =
      mode === "apply" ? ("helix:card-export-profile:applied" as const) : ("helix:card-export-profile:restored" as const);
    return await new Promise<boolean>((resolve) => {
      let timeoutId: number | undefined;
      const cleanup = () => {
        window.removeEventListener(eventName as any, onDone as any);
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
      };
      const onDone = (event: Event) => {
        const detail = (event as CustomEvent<{ requestId?: string }>).detail;
        if (detail?.requestId && detail.requestId !== requestId) return;
        cleanup();
        resolve(true);
      };
      timeoutId = window.setTimeout(() => {
        cleanup();
        resolve(false);
      }, mode === "apply" ? 800 : 400);
      window.addEventListener(eventName as any, onDone as any);
      window.dispatchEvent(
        new CustomEvent("helix:card-export-profile" as any, {
          detail: { mode, requestId },
        }),
      );
    });
   };

   const requestLatticeReady = async (params: {
     volumeHash: string | null;
     sdfKey: string | null;
     requireSdf?: boolean;
     timeoutMs?: number;
   }) => {
     const requestId = `lattice-ready-${Date.now()}`;
     const timeoutMs = Number.isFinite(params.timeoutMs) ? Math.max(0, Number(params.timeoutMs)) : 4500;
     const requireSdf = Boolean(params.requireSdf);
     const eventName = "helix:await-lattice-ready:result" as const;
     return await new Promise<{
       ready: boolean;
       volumeHash: string | null;
       sdfKey: string | null;
       volumeReady: boolean;
       sdfReady: boolean;
       volumeFailed: boolean;
       sdfFailed: boolean;
       reason?: string;
     }>((resolve) => {
       let timeoutId: number | undefined;
       const cleanup = () => {
         window.removeEventListener(eventName as any, onDone as any);
         if (timeoutId !== undefined) {
           window.clearTimeout(timeoutId);
         }
       };
       const onDone = (event: Event) => {
         const detail = (event as CustomEvent<any>).detail;
         if (detail?.requestId !== requestId) return;
         cleanup();
         resolve({
           ready: Boolean(detail?.ready),
           volumeHash: (typeof detail?.volumeHash === "string" ? detail.volumeHash : null) as string | null,
           sdfKey: (typeof detail?.sdfKey === "string" ? detail.sdfKey : null) as string | null,
           volumeReady: Boolean(detail?.volumeReady),
           sdfReady: Boolean(detail?.sdfReady),
           volumeFailed: Boolean(detail?.volumeFailed),
           sdfFailed: Boolean(detail?.sdfFailed),
           reason: typeof detail?.reason === "string" ? detail.reason : undefined,
         });
       };
       timeoutId = window.setTimeout(() => {
         cleanup();
         resolve({
           ready: false,
           volumeHash: params.volumeHash,
           sdfKey: params.sdfKey,
           volumeReady: false,
           sdfReady: false,
           volumeFailed: false,
           sdfFailed: false,
           reason: "timeout",
         });
       }, timeoutMs);
       window.addEventListener(eventName as any, onDone as any);
       window.dispatchEvent(
         new CustomEvent("helix:await-lattice-ready" as any, {
           detail: {
             requestId,
             volumeHash: params.volumeHash,
             sdfKey: params.sdfKey,
             requireSdf,
             timeoutMs,
           },
         }),
       );
     });
   };

   const profileRequestId = `card-profile-${Date.now()}`;
   setIsExportingCard(true);
   try {
    const profileApplied = await requestCardProfile("apply", profileRequestId);
    if (profileApplied) {
      await new Promise<void>((resolve) =>
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())),
      );
    }
     const preSnapshot = typeof useHull3DSharedStore.getState === "function" ? useHull3DSharedStore.getState() : null;
     const latticeReady = await requestLatticeReady({
       volumeHash: preSnapshot?.lattice?.volume?.hash ?? null,
       sdfKey: preSnapshot?.lattice?.sdf?.key ?? null,
       requireSdf: Boolean(preSnapshot?.lattice?.sdf?.key),
     });
     if (latticeReady.ready) {
       await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
     } else if (latticeReady.volumeHash || latticeReady.sdfKey) {
       console.warn("[Helix] Proceeding with export before lattice upload completed", latticeReady);
     }
     const storeSnapshot = typeof useHull3DSharedStore.getState === "function" ? useHull3DSharedStore.getState() : null;
     const meshOverlaySnapshot = storeSnapshot?.meshOverlay ?? meshOverlayMeta;
     const viewerPaletteSnapshot = storeSnapshot?.palette ?? viewerPalette;
     const viewerStateSnapshot = storeSnapshot?.viewer ?? viewerState ?? {};
     const fileStem = `helix-card-${Date.now()}`;

    let latticeTextures: Awaited<ReturnType<typeof buildLatticeTextureExports>> = null;
    let latticeMeta = extractCardLatticeMetadata(storeSnapshot?.lattice ?? null);
    try {
      latticeTextures = await buildLatticeTextureExports({
        fileStem,
        lattice: storeSnapshot?.lattice ?? null,
      });
      latticeMeta = latticeTextures?.meta ?? latticeMeta;
    } catch (err) {
      console.warn("[Helix] Failed to serialize lattice textures for export", err);
      latticeTextures = latticeMeta ? { meta: latticeMeta, assets: null, blobs: [] } : null;
    }

    const dpr = Number.isFinite(window.devicePixelRatio) ? window.devicePixelRatio : 1;
    const targetWidth =
      timeLapseCanvas.width ||
      Math.max(
        1,
        Math.round((timeLapseCanvas.clientWidth || timeLapseCanvas.offsetWidth || 0) * dpr) || 1920
      );
    const targetHeight =
      timeLapseCanvas.height ||
      Math.max(
        1,
        Math.round((timeLapseCanvas.clientHeight || timeLapseCanvas.offsetHeight || 0) * dpr) || 1080
      );

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = targetWidth;
    exportCanvas.height = targetHeight;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to acquire 2D context for export.");
    }

    const overlayLayerEnabled = Boolean(
      timeLapseOverlayCanvas && (showSweepHud || meshOverlaySnapshot?.wireframeEnabled)
    );
    ctx.clearRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(timeLapseCanvas, 0, 0, targetWidth, targetHeight);
    if (overlayLayerEnabled && timeLapseOverlayCanvas) {
      ctx.drawImage(timeLapseOverlayCanvas, 0, 0, targetWidth, targetHeight);
    }

    const asFinite = (value: unknown): number | null => {
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const overlayFrame = timeLapseRecorder.currentFrame;
    const pipelineAny = pipeline as any;
    const pickLodMeta = (pref?: "preview" | "high" | null) => {
      const lodPref = pref ?? "preview";
      if (!hullPreview) return null;
      const lods =
        lodPref === "high"
          ? [
              hullPreview?.lodFull,
              hullPreview?.mesh?.fullLod,
              ...(hullPreview?.lods ?? []).filter((lod: any) => lod?.tag === "full"),
              ...(hullPreview?.mesh?.lods ?? []).filter((lod: any) => lod?.tag === "full"),
            ]
          : [
              hullPreview?.lodCoarse,
              hullPreview?.mesh?.coarseLod,
              ...(hullPreview?.lods ?? []).filter((lod: any) => lod?.tag === "coarse"),
              ...(hullPreview?.mesh?.lods ?? []).filter((lod: any) => lod?.tag === "coarse"),
            ];
      return (lods.find((lod) => !!lod) as any) ?? null;
    };
    const meshBudgets = meshOverlaySnapshot?.budgets ?? VIEWER_WIREFRAME_BUDGETS;
    const lodMeta = pickLodMeta(meshOverlaySnapshot?.lod ?? null);
    const meshBasis =
      meshOverlaySnapshot?.basis ??
      meshOverlaySnapshot?.basisTags ??
      hullPreview?.mesh?.basis ??
      hullPreview?.basis ??
      null;
    const meshBasisResolved: HullBasisResolved | null =
      meshOverlaySnapshot?.basisResolved ??
      (meshBasis ? resolveHullBasis(meshBasis, hullPreview?.scale) : null);
    const meshClampReasons = meshOverlaySnapshot?.clampReasons?.length ? meshOverlaySnapshot.clampReasons : undefined;
    const meshGeometrySource =
      meshOverlaySnapshot?.geometrySource ??
      (meshClampReasons?.length
        ? "geometric"
        : (meshOverlaySnapshot?.provenance as CardMeshMetadata["provenance"]) ??
          (hullPreview?.provenance as CardMeshMetadata["provenance"]) ??
          (hullDimsEffective?.source as CardMeshMetadata["geometrySource"] | undefined));
    const meshMeta: CardMeshMetadata | null =
      meshOverlaySnapshot || hullPreview || meshClampReasons
        ? {
            meshHash:
              meshOverlaySnapshot?.meshHash ?? hullPreview?.meshHash ?? hullPreview?.mesh?.meshHash ?? undefined,
            provenance:
              meshOverlaySnapshot?.provenance ?? (hullPreview?.provenance as CardMeshMetadata["provenance"]),
            geometrySource: meshGeometrySource,
            lod: meshOverlaySnapshot?.lod ?? (lodMeta ? meshOverlaySnapshot?.lod ?? "preview" : undefined),
            lodTag: meshOverlaySnapshot?.lodTag ?? lodMeta?.tag,
            triangleCount: meshOverlaySnapshot?.triangleCount ?? lodMeta?.triangleCount,
            vertexCount: meshOverlaySnapshot?.vertexCount ?? lodMeta?.vertexCount,
            decimation: meshOverlaySnapshot?.decimation ?? lodMeta?.decimation,
            budgets: meshBudgets,
            basis: meshBasis ?? undefined,
            basisTags: meshOverlaySnapshot?.basisTags ?? (meshBasis ?? undefined),
            basisResolved: meshBasisResolved ?? undefined,
            clampReasons: meshClampReasons,
            wireframeEnabled: meshOverlaySnapshot?.wireframeEnabled,
            updatedAt: meshOverlaySnapshot?.updatedAt ?? undefined,
          }
        : null;
    const hullAreaPreview = asFinite((hullPreview as any)?.hullMetrics?.area_m2 ?? (hullPreview as any)?.area_m2);
    const hullAreaPipeline = asFinite(
      (hullMetrics as any)?.tiles?.hullArea_m2 ??
        pipelineAny?.tiles?.hullArea_m2 ??
        pipelineAny?.hullArea_m2 ??
        (hullMetrics as any)?.hull?.area_m2,
    );
    const hullAreaSource = hullAreaPreview != null ? "preview" : hullAreaPipeline != null ? "pipeline" : null;
    const hullArea_m2 = hullAreaPreview ?? hullAreaPipeline ?? null;
    const hullSummary = hullDimsEffective
      ? {
          Lx_m: hullDimsEffective.Lx_m,
          Ly_m: hullDimsEffective.Ly_m,
          Lz_m: hullDimsEffective.Lz_m,
          a_m: hullDimsEffective.Lx_m / 2,
          b_m: hullDimsEffective.Ly_m / 2,
          c_m: hullDimsEffective.Lz_m / 2,
          area_m2: hullArea_m2,
          areaSource: hullAreaSource,
          source: hullDimsEffective.source,
        }
      : hullMetrics?.hull
        ? {
            Lx_m: asFinite((hullMetrics as any)?.hull?.Lx_m),
            Ly_m: asFinite((hullMetrics as any)?.hull?.Ly_m),
            Lz_m: asFinite((hullMetrics as any)?.hull?.Lz_m),
            a_m: asFinite(
              (hullMetrics as any)?.hull?.a ??
                ((hullMetrics as any)?.hull?.Lx_m ? (hullMetrics as any).hull.Lx_m / 2 : null),
            ),
            b_m: asFinite(
              (hullMetrics as any)?.hull?.b ??
                ((hullMetrics as any)?.hull?.Ly_m ? (hullMetrics as any).hull.Ly_m / 2 : null),
            ),
            c_m: asFinite(
              (hullMetrics as any)?.hull?.c ??
                ((hullMetrics as any)?.hull?.Lz_m ? (hullMetrics as any).hull.Lz_m / 2 : null),
            ),
            area_m2: hullArea_m2,
            areaSource: hullAreaSource,
            source: "pipeline",
          }
        : null;
    const pipelineSummary = pipeline
      ? {
          mode: (pipeline as any)?.currentMode ?? (pipeline as any)?.mode ?? null,
          dutyCycle: asFinite(pipeline.dutyCycle),
          beta: asFinite(pipelineAny?.shipBeta ?? pipelineAny?.beta ?? pipelineAny?.vShip),
          modulationFreq_GHz: asFinite(pipeline.modulationFreq_GHz),
          tauLC_ms: asFinite(pipelineAny?.lightCrossing?.tauLC_ms ?? pipelineAny?.tauLC_ms),
          burst_ms: asFinite(pipelineAny?.lightCrossing?.burst_ms ?? pipelineAny?.burst_ms),
          dwell_ms: asFinite(pipelineAny?.lightCrossing?.dwell_ms ?? pipelineAny?.dwell_ms),
          sectors: {
            total: asFinite(
              pipeline.sectorsTotal ??
                pipeline.sectorCount ??
                pipelineAny?.lightCrossing?.sectorCount ??
                pipelineAny?.totalSectors
            ),
            concurrent: asFinite(
              pipeline.sectorsConcurrent ??
                pipeline.sectorStrobing ??
                pipelineAny?.lightCrossing?.activeSectors ??
                pipelineAny?.activeSectors
            ),
          },
          mesh: meshMeta,
        }
      : null;

    const overlaySummary = overlayFrame
      ? {
          segment: overlayFrame.segment,
          overlayText: overlayFrame.overlayText,
          TS: overlayFrame.TS,
          tauLC_ms: overlayFrame.tauLC_ms,
          burst_ms: overlayFrame.burst_ms,
          dwell_ms: overlayFrame.dwell_ms,
          rho: overlayFrame.rho,
          QL: overlayFrame.QL,
          d_eff: overlayFrame.d_eff,
          gr: overlayFrame.gr,
          sectors: overlayFrame.sectors,
          sweep: overlayFrame.sweep,
        }
      : null;
    const warpGeometryKindResolved =
      pipeline?.warpGeometryKind ?? (pipelineAny?.warpGeometry as any)?.geometryKind ?? pipelineAny?.warpGeometryKind;
    const renderedGeometryKind =
      (storeSnapshot?.lattice?.volume ? "sdf" : null) ?? warpGeometryKindResolved;
    const geometryUpdatePayload = (() => {
      const payload: Record<string, unknown> = {};
      if (hullDimsEffective) {
        payload.hull = {
          Lx_m: hullDimsEffective.Lx_m,
          Ly_m: hullDimsEffective.Ly_m,
          Lz_m: hullDimsEffective.Lz_m,
        };
      }
      const areaOverride = asFinite(pipelineAny?.hullAreaOverride_m2);
      const areaOverrideUncertainty = asFinite(pipelineAny?.hullAreaOverride_uncertainty_m2);
      if (areaOverride != null) payload.hullAreaOverride_m2 = areaOverride;
      if (areaOverrideUncertainty != null) {
        payload.hullAreaOverride_uncertainty_m2 = Math.max(0, areaOverrideUncertainty);
      }
      const perSectorRaw = pipelineAny?.hullAreaPerSector_m2;
      if (Array.isArray(perSectorRaw)) {
        const cleaned = perSectorRaw
          .map((value: unknown) => asFinite(value))
          .filter((v: number | null): v is number => v != null);
        if (cleaned.length) payload.hullAreaPerSector_m2 = cleaned;
      }
      if (pipeline?.warpFieldType) payload.warpFieldType = pipeline.warpFieldType;
      if (pipeline?.warpGeometryKind || renderedGeometryKind) {
        payload.warpGeometryKind = renderedGeometryKind ?? pipeline?.warpGeometryKind;
      }
      if (pipeline?.warpGeometryAssetId) payload.warpGeometryAssetId = pipeline.warpGeometryAssetId;
      if (pipeline?.warpGeometry) payload.warpGeometry = pipeline.warpGeometry;
      return Object.keys(payload).length ? payload : null;
    })();
    const viewerConfig = viewerStateSnapshot ?? {};
    const cardCamera = viewerConfig.camera ?? (pipelineAny?.cardRecipe as any)?.camera ?? null;
    const cardRecipeGeometryBase =
      (pipelineAny?.cardRecipe as any)?.geometry ??
      (pipelineAny?.cardRecipe as any)?.geometry ??
      {};
    const cardRecipeGeometryResolved = {
      ...cardRecipeGeometryBase,
      warpGeometryKind: renderedGeometryKind ?? cardRecipeGeometryBase?.warpGeometryKind,
      warpGeometryAssetId:
        pipeline?.warpGeometryAssetId ??
        (pipelineAny?.warpGeometry as any)?.assetId ??
        cardRecipeGeometryBase?.warpGeometryAssetId,
      warpGeometry: pipeline?.warpGeometry ?? cardRecipeGeometryBase?.warpGeometry ?? (pipelineAny?.warpGeometry as any),
    };
    const overlayProfileKey =
      viewerState?.profileTag === "card"
        ? "card"
        : (viewerState?.qualityPreset ?? "auto");
    const overlayPrefsResolved =
      overlayPrefs?.[overlayProfileKey] ?? defaultOverlayPrefsForProfile(overlayProfileKey);
    const spacetimeGridPrefs = overlayPrefsResolved.spacetimeGrid;
    const volumeSource =
      viewerConfig.volumeSource ?? (pipelineAny?.cardRecipe as any)?.viz?.volumeSource ?? null;
    const cardRecipeViz =
      spacetimeGridPrefs || pipelineAny?.cardRecipe?.viz || volumeSource != null
        ? {
            ...(pipelineAny?.cardRecipe?.viz ?? {}),
            ...(volumeSource != null ? { volumeSource } : {}),
            ...(spacetimeGridPrefs ? { spacetimeGrid: spacetimeGridPrefs } : {}),
          }
        : undefined;
    const cardRecipeWithMesh = pipelineAny?.cardRecipe
      ? {
          ...pipelineAny.cardRecipe,
          geometry: cardRecipeGeometryResolved,
          ...(cardRecipeViz ? { viz: cardRecipeViz } : {}),
          ...(cardCamera ? { camera: cardCamera } : {}),
          mesh: meshMeta ?? pipelineAny.cardRecipe?.mesh,
          ...(latticeMeta ? { lattice: latticeMeta } : {}),
        }
      : meshMeta || latticeMeta || cardRecipeViz
        ? {
            ...(cardRecipeViz ? { viz: cardRecipeViz } : {}),
            ...(cardCamera ? { camera: cardCamera } : {}),
            geometry: cardRecipeGeometryResolved,
            ...(meshMeta ? { mesh: meshMeta } : {}),
            ...(latticeMeta ? { lattice: latticeMeta } : {}),
          }
        : null;
    const replayViewer = {
      camera: cardCamera,
      planarVizMode: viewerConfig.planarVizMode ?? null,
      volumeViz: viewerConfig.volumeViz ?? (pipelineAny?.cardRecipe as any)?.viz?.volumeViz ?? null,
      volumeDomain:
        viewerConfig.volumeDomain ?? (pipelineAny?.cardRecipe as any)?.viz?.volumeDomain ?? null,
      volumeSource,
      vizFloors: viewerConfig.vizFloors ?? null,
      gate: {
        source: viewerConfig.gateSource ?? (pipelineAny?.cardRecipe as any)?.viz?.gateSource ?? null,
        viewEnabled: viewerConfig.gateView ?? (pipelineAny?.cardRecipe as any)?.viz?.gateView ?? null,
        forceFlat: viewerConfig.forceFlatGate ?? (pipelineAny?.cardRecipe as any)?.viz?.forceFlatGate ?? null,
      },
      opacityWindow:
        viewerConfig.opacityWindow ?? (pipelineAny?.cardRecipe as any)?.viz?.opacityWindow ?? null,
      boundsProfile: viewerConfig.boundsProfile ?? null,
      palette: viewerConfig.palette ?? viewerPaletteSnapshot ?? null,
      bounds:
        viewerConfig.bounds ??
        (hullDimsEffective
          ? {
              axes: [
                hullDimsEffective.Lx_m / 2,
                hullDimsEffective.Ly_m / 2,
                hullDimsEffective.Lz_m / 2,
              ],
              basis: hullDimsEffective.basis,
            }
          : null),
      overlays: spacetimeGridPrefs ? { spacetimeGrid: spacetimeGridPrefs } : undefined,
    };
    const meshSignatureInput =
      meshMeta || hullPreview?.meshHash || hullPreview?.mesh?.meshHash
        ? {
            meshHash:
              meshMeta?.meshHash ?? hullPreview?.meshHash ?? hullPreview?.mesh?.meshHash ?? undefined,
            decimation: meshMeta?.decimation ?? lodMeta?.decimation,
            fitBounds: lodMeta?.fitBounds,
            triangleCount: meshMeta?.triangleCount ?? lodMeta?.triangleCount,
            vertexCount: meshMeta?.vertexCount ?? lodMeta?.vertexCount,
            lod: meshMeta?.lod ?? meshMeta?.lodTag ?? lodMeta?.tag,
            lodTag: meshMeta?.lodTag,
          }
        : null;
    const hullSignatureInput =
      hullSummary && hullSummary.Lx_m != null && hullSummary.Ly_m != null && hullSummary.Lz_m != null
        ? {
            dims_m: { Lx_m: hullSummary.Lx_m, Ly_m: hullSummary.Ly_m, Lz_m: hullSummary.Lz_m },
            area_m2: hullSummary.area_m2,
            areaSource: hullSummary.areaSource,
            source: hullSummary.source,
          }
        : null;
    const geometrySignatureInput = {
      warpGeometryKind: renderedGeometryKind,
      warpGeometryAssetId: pipeline?.warpGeometryAssetId ?? (pipelineAny?.warpGeometry as any)?.assetId,
      meshHash: meshSignatureInput?.meshHash ?? undefined,
      geometrySource: meshGeometrySource,
      fallback: geometryFallbackState ?? (pipelineAny as any)?.geometryFallback ?? null,
      lattice: latticeMeta
        ? renderedGeometryKind === "sdf"
          ? {
            enabled: latticeMeta.enabled,
            preset: latticeMeta.frame?.preset,
            profileTag: latticeMeta.frame?.profileTag,
            volumeHash: latticeMeta.hashes?.volume,
            sdfHash: latticeMeta.hashes?.sdf,
            strobeHash: latticeMeta.hashes?.strobe,
            weightsHash: latticeMeta.hashes?.weights,
            clampReasons: latticeMeta.frame?.clampReasons,
            updatedAt: latticeMeta.updatedAt,
          }
          : null
        : null,
    };
    const signaturesComputed = await buildCardSignatures({
      mesh: meshSignatureInput,
      basis: meshBasisResolved ?? meshBasis ?? undefined,
      basisScale: meshBasisResolved ? undefined : hullPreview?.scale,
      hull: hullSignatureInput,
      blanketTiles: pipelineAny?.tilesPerSectorVector,
      viz: {
        volumeViz: replayViewer.volumeViz,
        volumeDomain: replayViewer.volumeDomain,
        volumeSource: replayViewer.volumeSource,
        planarVizMode: replayViewer.planarVizMode,
        vizFloors: replayViewer.vizFloors,
        gate: replayViewer.gate,
        opacityWindow: replayViewer.opacityWindow,
        bounds: replayViewer.bounds ? { domainScale: replayViewer.bounds.domainScale } : undefined,
        boundsProfile: replayViewer.boundsProfile,
        palette: replayViewer.palette,
      },
      profile: {
        profileTag: viewerStateSnapshot?.profileTag ?? (profileApplied ? "card" : undefined),
        qualityPreset: viewerStateSnapshot?.qualityPreset ?? null,
        qualityOverrides: viewerStateSnapshot?.qualityOverrides ?? null,
        volumeDomain: replayViewer.volumeDomain,
      },
      geometry: geometrySignatureInput,
    });
    const signatures = {
      ...(cardRecipeWithMesh as any)?.signatures,
      ...signaturesComputed,
    };
    const cardRecipeEnriched = cardRecipeWithMesh
      ? ensureCardRecipeSchemaVersion({
          ...cardRecipeWithMesh,
          signatures,
        })
      : null;

    const replayPayload = {
      pipelineUpdate: geometryUpdatePayload,
      viewer: replayViewer,
      signatures,
      cardRecipe: cardRecipeEnriched ?? cardRecipeWithMesh ?? undefined,
    };
    const cardProfileMeta =
      viewerStateSnapshot?.profileTag || profileApplied
        ? {
            tag: viewerStateSnapshot?.profileTag ?? (profileApplied ? "card" : undefined),
            qualityPreset: viewerStateSnapshot?.qualityPreset ?? null,
            qualityOverrides: viewerStateSnapshot?.qualityOverrides ?? null,
            volumeDomain: replayViewer.volumeDomain ?? null,
          }
        : null;

    const timestampIso = new Date().toISOString();
    const cardPayload = buildCardExportSidecar({
      timestampIso,
      canvas: { width: targetWidth, height: targetHeight, devicePixelRatio: dpr },
      overlayEnabled: overlayLayerEnabled,
      pipeline: pipelineSummary,
      hull: hullSummary,
      overlayFrame: overlaySummary,
      geometryUpdatePayload,
      mesh: meshMeta,
      lattice: latticeTextures ? { meta: latticeTextures.meta, assets: latticeTextures.assets } : undefined,
      renderedPath: {
        warpGeometryKind: renderedGeometryKind ?? undefined,
        warpGeometryAssetId: pipeline?.warpGeometryAssetId ?? (pipelineAny?.warpGeometry as any)?.assetId ?? null,
        meshHash: meshMeta?.meshHash ?? null,
        meshSignature: signatures.meshSignature ?? null,
        basisSignature: signatures.basisSignature ?? null,
        latticeHashes: renderedGeometryKind === "sdf" ? latticeMeta?.hashes : undefined,
        latticeEnabled: renderedGeometryKind === "sdf" ? latticeMeta?.enabled ?? null : false,
        geometrySource: meshGeometrySource,
        fallback:
          (geometryFallbackState as any) ??
          ((pipelineAny as any)?.geometryFallback
            ? {
                mode: (pipelineAny as any)?.geometryFallback?.mode ?? null,
                resolvedKind: (pipelineAny as any)?.geometryFallback?.resolvedKind ?? null,
                requestedKind: (pipelineAny as any)?.geometryFallback?.requestedKind ?? null,
                applied: (pipelineAny as any)?.geometryFallback?.applied ?? null,
                blocked: (pipelineAny as any)?.geometryFallback?.blocked ?? null,
                reasons: (pipelineAny as any)?.geometryFallback?.reasons ?? null,
              }
            : null),
      },
      replayPayload,
      cardRecipe: cardRecipeEnriched ?? cardRecipeWithMesh,
      cardProfile: cardProfileMeta ?? undefined,
      signatures,
    });

    const formatMaybe = (value: number | null | undefined, suffix = "", digits = 2) => {
      if (value == null || !Number.isFinite(value)) return "n/a";
      return `${value.toFixed(digits)}${suffix}`;
    };
    const percent = (value: number | null | undefined) =>
      value == null || !Number.isFinite(value) ? "n/a" : `${(value * 100).toFixed(1)}%`;

    const textLines = [
      "HELIX CARD SNAPSHOT",
      `Captured: ${timestampIso}`,
      pipelineSummary
        ? `Mode ${pipelineSummary.mode ?? "n/a"} | Duty ${percent(pipelineSummary.dutyCycle)}`
        : null,
      pipelineSummary
        ? `Sectors ${pipelineSummary.sectors.total ?? "?"}/${pipelineSummary.sectors.concurrent ?? "?"}`
        : null,
      hullSummary
        ? `Hull a/b/c ${formatMaybe(hullSummary.a_m, " m", 2)} / ${formatMaybe(
            hullSummary.b_m,
            " m",
            2
          )} / ${formatMaybe(hullSummary.c_m, " m", 2)}`
        : null,
      meshMeta
        ? `Mesh ${meshMeta.meshHash ? meshMeta.meshHash.slice(0, 8) : "n/a"} | ${meshMeta.geometrySource ?? "n/a"}${
            meshMeta.lod ? ` (${meshMeta.lod})` : ""
          }${meshMeta.triangleCount ? ` · ${meshMeta.triangleCount} tris` : ""}${
            meshMeta.clampReasons?.length ? ` clamp: ${meshMeta.clampReasons.join(",")}` : ""
          }`
        : null,
      overlaySummary
        ? `TS ${formatMaybe(overlaySummary.TS)} | rho ${formatMaybe(overlaySummary.rho)} | QL ${formatMaybe(
            overlaySummary.QL,
            "",
            0
          )}`
        : null,
    ].filter((line): line is string => Boolean(line));

    if (textLines.length) {
      const padding = 10;
      const lineHeight = 16;
      ctx.save();
      ctx.font =
        '12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
      ctx.textBaseline = "top";
      const maxTextWidth = textLines.reduce((max, line) => Math.max(max, ctx.measureText(line).width), 0);
      const blockWidth = maxTextWidth + padding * 2;
      const blockHeight = lineHeight * textLines.length + padding * 2;
      const blockX = 12;
      const blockY = 12;
      ctx.fillStyle = "rgba(8, 15, 30, 0.8)";
      ctx.strokeStyle = "rgba(34, 211, 238, 0.35)";
      ctx.lineWidth = 1;
      ctx.fillRect(blockX, blockY, blockWidth, blockHeight);
      ctx.strokeRect(blockX, blockY, blockWidth, blockHeight);
      ctx.fillStyle = "#e2e8f0";
      textLines.forEach((line, idx) => {
        ctx.fillText(line, blockX + padding, blockY + padding + idx * lineHeight);
      });
      ctx.restore();
    }

    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      exportCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to encode PNG export."));
        }
      }, "image/png");
    });

    const downloadBlob = (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    };

    downloadBlob(pngBlob, `${fileStem}.png`);

    const metricsBlob = new Blob([JSON.stringify(cardPayload, null, 2)], {
      type: "application/json",
    });
    downloadBlob(metricsBlob, `${fileStem}.json`);

    const latticeBlobCount = latticeTextures?.blobs?.length ?? 0;
    if (latticeBlobCount > 0) {
      for (const item of latticeTextures?.blobs ?? []) {
        downloadBlob(item.blob, item.filename);
      }
    }

    toast({
      title: "Card export ready",
      description:
        latticeBlobCount > 0
          ? `Downloaded PNG + JSON + ${latticeBlobCount} lattice asset${latticeBlobCount === 1 ? "" : "s"}.`
          : "Downloaded PNG + JSON snapshot from the current hull view.",
    });
  } catch (err) {
    console.error("[Helix] Card export failed", err);
    toast({
      title: "Export failed",
      description: err instanceof Error ? err.message : "Unable to export the current view.",
      variant: "destructive",
    });
  } finally {
    try {
      await requestCardProfile("restore", profileRequestId);
    } catch (err) {
      console.warn("[Helix] Failed to restore card export profile", err);
    }
    setIsExportingCard(false);
  }
}, [
  hullMetrics,
  hullPreview,
  hullDimsEffective,
  isExportingCard,
  meshOverlayMeta,
  pipeline,
  showSweepHud,
  viewerPalette,
  viewerState,
  timeLapseCanvas,
  timeLapseOverlayCanvas,
  timeLapseRecorder,
]);
  const handleDriveCardPreset = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.dispatchEvent(new CustomEvent("helix:drive-card-preset"));
      toast({
        title: "Drive Card Preset",
        description: "Applied θ_drive + gate overlays for card export.",
      });
    } catch (err) {
      console.warn("[Helix] Failed to broadcast drive card preset", err);
    }
  }, []);
  const commandAbortRef = useRef<AbortController | null>(null);
  const [activeMode, setActiveMode] = useState<"auto" | "manual" | "diagnostics" | "theory">("auto");
  const [modulationFrequency, setModulationFrequency] = useState(15); // Default 15 GHz
  const [pumpPhaseBiasDeg, setPumpPhaseBiasDeg] = useState<number>(() => {
    const stored = localStorage.getItem(PUMP_PHASE_BIAS_KEY);
    return stored !== null ? clampPhaseBiasDeg(Number(stored)) : 0;
  });
  useEffect(() => {
    localStorage.setItem(PUMP_PHASE_BIAS_KEY, pumpPhaseBiasDeg.toString());
  }, [pumpPhaseBiasDeg]);
  const openParametricSweepStub = useCallback(() => {
    console.info("[helix-core] Gap x Phase x Omega sweep stub pending implementation");
  }, []);
  const [visualizersInitialized, setVisualizersInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const pending = new Set<number>();
    const MAX_ATTEMPTS = 20;
    const RETRY_DELAY_MS = 100;

    const clearPending = () => {
      pending.forEach((id) => window.clearTimeout(id));
      pending.clear();
    };

    const scrollToHash = (rawHash: string) => {
      if (!rawHash) return;
      if ((window as any)[SUPPRESS_HASH_SCROLL_KEY]) {
        return;
      }
      const normalized = (rawHash ?? "").replace(/^#/, "").trim().toLowerCase();
      if (!normalized) {
        return;
      }

      clearPending();

      const targetSlug = HASH_ALIASES[normalized] ?? normalized;

      let attempts = 0;
      const findAndScroll = () => {
        const target =
          document.querySelector<HTMLElement>(`[data-panel-hash="${targetSlug}"]`) ??
          document.getElementById(targetSlug);

        if (target) {
          target.scrollIntoView({ block: "start", behavior: "smooth" });
          return;
        }

        if (attempts >= MAX_ATTEMPTS) {
          return;
        }

        attempts += 1;
        const timeoutId = window.setTimeout(() => {
          pending.delete(timeoutId);
          findAndScroll();
        }, RETRY_DELAY_MS);

        pending.add(timeoutId);
      };

      findAndScroll();
    };

    if (window.location.hash) {
      scrollToHash(window.location.hash);
    }

    const handleHashChange = () => {
      scrollToHash(window.location.hash);
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      clearPending();
    };
  }, []);

  // Mode change signal system
  const [renderNonce, setRenderNonce] = useState(0);
  const [modeNonce, setModeNonce] = useState(0 as number);

  // Re-mount viz engines whenever the server says "reload"
  useEffect(() => {
    const off = subscribe("warp:reload", () => setRenderNonce((n) => n + 1));
    return () => {
      if (off) unsubscribe(off);
      // explicit void return
      return undefined as void;
    };
  }, []);

  const [optimisticMode, setOptimisticMode] = useState<ModeKey | null>(null);
  const [route, setRoute] = useState<string[]>(["SOL", "ORI_OB1", "VEL_OB2", "SOL"]);
  const [deepMixingPlan, setDeepMixingPlan] = useState<DeepMixingPreset>(() => DeepMixingAutopilot);
  const [deepMixingTargetIndex, setDeepMixingTargetIndex] = useState(() => deltaTIndexFromValue(DeepMixingAutopilot.targetDeltaT_Myr));
  const [deepMixingState, setDeepMixingState] = useState<DeepMixingAutopilotState>("PLAN");
  const [deepMixingTelemetry, setDeepMixingTelemetry] = useState<DeepMixingTelemetry>(DEEP_MIXING_DEFAULT_TELEMETRY);
  const [enforceLuminosityGuard, setEnforceLuminosityGuard] = useState(true);
  const [enforceHeAshGuard, setEnforceHeAshGuard] = useState(true);
  const [deepMixingDocOpen, setDeepMixingDocOpen] = useState(false);
  const deepMixingSequence = useMemo(() => DEEP_MIXING_AUTOPILOT_STATES.filter((state) => state !== "SAFE"), []);
  const deepMixingControlPreview = useMemo(
    () => deepMixingControlStep(deepMixingPlan, deepMixingTelemetry),
    [deepMixingPlan, deepMixingTelemetry]
  );
  const deepMixingVrSetpoint = useMemo(() => vrSetpointForPreset(deepMixingPlan), [deepMixingPlan]);
  const deepMixingMmPerYear = useMemo(
    () => deepMixingVrSetpoint * DEEP_MIXING_SECONDS_PER_YEAR * 1000,
    [deepMixingVrSetpoint]
  );
  const deepMixingFleetTotals = useMemo(() => {
    const total = deepMixingPlan.fleet.actuators + deepMixingPlan.fleet.diagnostics;
    if (total <= 0) {
      return { total: 0, actuatorsPct: 0, diagnosticsPct: 0, idlePct: 100 };
    }
    const actuatorsPct = (deepMixingPlan.fleet.actuators / total) * 100;
    const diagnosticsPct = (deepMixingPlan.fleet.diagnostics / total) * 100;
    const idlePct = Math.max(0, 100 - actuatorsPct - diagnosticsPct);
    return { total, actuatorsPct, diagnosticsPct, idlePct };
  }, [deepMixingPlan.fleet.actuators, deepMixingPlan.fleet.diagnostics]);
  const deepMixingLumFraction = useMemo(() => {
    const guard = deepMixingPlan.guardrails.dLogL_per_Myr_max;
    if (!Number.isFinite(guard) || guard <= 0) return null;
    return deepMixingTelemetry.dLogL_per_Myr / guard;
  }, [deepMixingPlan.guardrails.dLogL_per_Myr_max, deepMixingTelemetry.dLogL_per_Myr]);
  const deepMixingTcFraction = useMemo(() => {
    const guard = deepMixingPlan.guardrails.dLogTc_per_Myr_max;
    if (!Number.isFinite(guard) || guard <= 0) return null;
    return deepMixingTelemetry.dLogTc_per_Myr / guard;
  }, [deepMixingPlan.guardrails.dLogTc_per_Myr_max, deepMixingTelemetry.dLogTc_per_Myr]);
  const deepMixingProjectedDeltaTLabel = useMemo(() => {
    if (deepMixingPlan.targetDeltaT_Myr >= 1000) {
      return `${(deepMixingPlan.targetDeltaT_Myr / 1000).toFixed(2)} Gyr`;
    }
    if (deepMixingPlan.targetDeltaT_Myr >= 100) {
      return `${(deepMixingPlan.targetDeltaT_Myr / 1000).toFixed(2)} Gyr`;
    }
    return `${deepMixingPlan.targetDeltaT_Myr.toFixed(0)} Myr`;
  }, [deepMixingPlan.targetDeltaT_Myr]);
  const updateDeepMixingGuardrails = useCallback(
    (luminosity: boolean, heAsh: boolean) => {
      setDeepMixingPlan((prev) => ({
        ...prev,
        guardrails: {
          ...prev.guardrails,
          dLogL_per_Myr_max: luminosity ? DeepMixingAutopilot.guardrails.dLogL_per_Myr_max : Number.POSITIVE_INFINITY,
          dLogTc_per_Myr_max: heAsh ? DeepMixingAutopilot.guardrails.dLogTc_per_Myr_max : Number.POSITIVE_INFINITY,
        },
      }));
    },
    []
  );
  const handleDeepMixingTargetChange = useCallback((index: number) => {
    const safeIndex = Math.max(0, Math.min(DEEP_MIXING_TARGETS.length - 1, Math.round(index)));
    const option = DEEP_MIXING_TARGETS[safeIndex];
    setDeepMixingTargetIndex(option.index);
    setDeepMixingPlan((prev) => ({
      ...prev,
      targetDeltaT_Myr: option.deltaT_Myr,
      epsilon: option.epsilon,
    }));
  }, []);
  const advanceDeepMixingState = useCallback(() => {
    setDeepMixingState((current) => {
      if (!deepMixingSequence.length) return current;
      if (current === "SAFE") return deepMixingSequence[0];
      const idx = deepMixingSequence.indexOf(current);
      if (idx === -1) return deepMixingSequence[0];
      const next = deepMixingSequence[(idx + 1) % deepMixingSequence.length];
      return next;
    });
  }, [deepMixingSequence]);
  const handleApplyDeepMixingTrim = useCallback(() => {
    setDeepMixingPlan((prev) => ({
      ...prev,
      duty: Number(deepMixingControlPreview.duty.toFixed(3)),
      cadenceDays: Number(deepMixingControlPreview.cadenceDays.toFixed(2)),
    }));
    if (deepMixingControlPreview.enteredSafe) {
      setDeepMixingState("SAFE");
    } else if (deepMixingState === "PLAN") {
      setDeepMixingState("PROXOPS");
    }
  }, [deepMixingControlPreview, deepMixingState]);
  const deepMixingTelemetryScenarios = useMemo(() => {
    const guardLum =
      Number.isFinite(deepMixingPlan.guardrails.dLogL_per_Myr_max) && deepMixingPlan.guardrails.dLogL_per_Myr_max > 0
        ? deepMixingPlan.guardrails.dLogL_per_Myr_max
        : 1e-3;
    const guardTc =
      Number.isFinite(deepMixingPlan.guardrails.dLogTc_per_Myr_max) && deepMixingPlan.guardrails.dLogTc_per_Myr_max > 0
        ? deepMixingPlan.guardrails.dLogTc_per_Myr_max
        : 1e-3;
    return {
      nominal: {
        dLogL_per_Myr: guardLum * 0.2,
        dLogTc_per_Myr: guardTc * 0.18,
        seismicGrowth: -0.02,
        neutrinoDelta: -2e-4,
        achievedEpsilon: deepMixingPlan.epsilon * 0.95,
      },
      guardrail: {
        dLogL_per_Myr: guardLum * 1.4,
        dLogTc_per_Myr: guardTc * 1.35,
        seismicGrowth: 0.05,
        neutrinoDelta: 0.0025,
        achievedEpsilon: deepMixingPlan.epsilon * 0.98,
      },
      boost: {
        dLogL_per_Myr: guardLum * 0.7,
        dLogTc_per_Myr: guardTc * 0.65,
        seismicGrowth: -0.01,
        neutrinoDelta: -6e-4,
        achievedEpsilon: deepMixingPlan.epsilon * 0.72,
      },
    };
  }, [deepMixingPlan.epsilon, deepMixingPlan.guardrails.dLogL_per_Myr_max, deepMixingPlan.guardrails.dLogTc_per_Myr_max]);

  // Fade memory for trailing glow (per-sector intensity 0..1)
  const [trail, setTrail] = useState<number[]>(() => Array(400).fill(0));
  const [useDeepZoom, setUseDeepZoom] = useState(false);
  const [cosmeticLevel, setCosmeticLevel] = useState(10); // 1..10 (10 = current look)
  const [mapMode, setMapMode] = useState<"galactic" | "solar">(() => {
    const stored = localStorage.getItem("helix-mapMode");
    return stored === "galactic" ? "galactic" : "solar";
  });
  const [solarBodies, setSolarBodies] = useState(() => solarToBodies(computeSolarXY()));

  // Live solar positions for route planning (updates every 5 seconds)
  const [solarTick, setSolarTick] = useState(0);
  const solarBodiesForRoutes = useMemo(() => getSolarBodiesAsPc(), [solarTick]);

  //  NEW: compute barycenter wobble path once (AU polyline with per-vertex alpha)
  const baryPath = React.useMemo(
    () => computeBarycenterPolylineAU({ daysPast: 3650, daysFuture: 3650, stepDays: 20, fade: true }),
    []
  );

  const [deepZoomViewer, setDeepZoomViewer] = useState<any>(null);
  const [galaxyCalibration, setGalaxyCalibration] = useState<{ originPx: { x: number; y: number }; pxPerPc: number } | null>(
    null
  );
  const fractional = useFractionalCoherence();
  const setSectorGrid3D = useHull3DSharedStore((state) => state.setSectorGrid3D);
  useEffect(() => {
    const cp = fractional.EMA.CP ?? fractional.CP ?? 0;
    const alpha = Math.min(1, Math.max(0.1, Math.tanh(cp / 800)));
    setSectorGrid3D((current) => ({
      ...current,
      alpha,
    }));
  }, [fractional.CP, fractional.EMA.CP, setSectorGrid3D]);

  // Load galaxy map and compute calibration
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const { originPx, pxPerPc } = calibrateToImage(img.naturalWidth, img.naturalHeight, SVG_CALIB);
      setGalaxyCalibration({ originPx, pxPerPc });
      if (DEV)
        console.log(" Galaxy calibration:", {
          imageSize: { w: img.naturalWidth, h: img.naturalHeight },
          sunPixel: originPx,
          scale: `${pxPerPc.toFixed(4)} px/pc`,
        });
    };
    img.src = "/galaxymap.png";
  }, []);

  // Update solar system positions periodically
  useEffect(() => {
    if (mapMode === "solar") {
      const updateSolarPositions = () => {
        setSolarBodies(solarToBodies(computeSolarXY()));
      };

      const interval = setInterval(updateSolarPositions, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [mapMode]);

  // Update route calculation positions every 5 seconds and test Luma whisper
  useEffect(() => {
    const interval = setInterval(() => setSolarTick((t) => t + 1), 5000);

    // Test Luma whisper on first load
    const timer = setTimeout(() => {
      publish("luma:whisper", { text: "HELIX-CORE initialized. Welcome to the cosmic bridge." });
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  // Listen for debug events from hardLockUniforms and push into debug panel
  useEffect(() => {
    function onDebug(ev: Event) {
      const e = ev as CustomEvent<{
        level: "info" | "warn" | "error";
        tag: string;
        msg: string;
        data?: any;
        ts: number;
      }>;
      const d = e.detail || { level: "info", tag: "DEBUG", msg: "unknown", ts: Date.now() };
      const from = d.data?.from ? `  ${String(d.data.from).replace(/^at\s+/, "")}` : "";
      const val = d.data?.value !== undefined ? ` value=${JSON.stringify(d.data.value)}` : "";
      const line = `[LOCK] ${d.tag}: ${d.msg}${val}${from}`;
      // keep last 200 lines
      setMainframeLog((prev) => [...prev, line].slice(-200));
    }
    window.addEventListener("helix:debug", onDebug as any);
    return () => window.removeEventListener("helix:debug", onDebug as any);
  }, []);

  // Fetch system metrics
  const { data: systemMetrics, refetch: refetchMetrics } = useQuery<SystemMetrics>({
    queryKey: ["/api/helix/metrics"],
    refetchInterval: 5000,
    staleTime: 4_500,
    refetchOnWindowFocus: false,
  });

  // Show theta audit in logs
  useEffect(() => {
    const a = (systemMetrics as any)?.thetaAudit;
    if (!a) return;
    const pct = a.expected ? ((a.used / a.expected) * 100).toFixed(1) : "";
    setMainframeLog((prev) =>
      [...prev, `[AUDIT] -scale expected=${a.expected.toExponential(2)} used=${a.used.toExponential(2)} (${pct}%)`].slice(
        -200
      )
    );
  }, [(systemMetrics as any)?.thetaAudit]);

  // Publish canonical uniforms from server metrics
  const lastWUHashRef = useRef<string>(""); // Use a ref to store the hash of the last published uniforms
  useEffect(() => {
    const wu = (systemMetrics as any)?.warpUniforms;
    if (!wu) return;

    const seq = Number((systemMetrics as any)?.seq);
    const version = Number.isFinite(seq) ? seq : ++__busSeq;

    const sanitized = sanitizeServerUniforms(wu, version);
    const sig = JSON.stringify(stableWU(sanitized));
    if (sig === lastWUHashRef.current) return;   //  nothing meaningful changed

    lastWUHashRef.current = sig; // Update the stored hash
    publish("warp:uniforms", sanitized);
  }, [systemMetrics]);

  // Auto-duty controller - automatically runs resonance scheduler on mode changes
  useResonatorAutoDuty({
    mode: (pipeline?.currentMode ?? "hover") as "standby" | "hover" | "taxi" | "nearzero" | "cruise" | "emergency",
    duty: pipeline?.dutyCycle ?? 0.14,
    sectors: systemMetrics?.activeSectors ?? 1,
    freqGHz: pipeline?.modulationFreq_GHz ?? 15,
    onLog: (line) => {
      setMainframeLog((prev) => [...prev, line].slice(-50)); // Keep last 50 lines
    },
    onAfterRun: () => {
      refetchMetrics(); // Refresh metrics after auto-duty run
    },
    enabled: true, // Enable auto-duty controller
  });

  // Unified, defensive mode fallback for the whole page
  const serverMode = (pipeline?.currentMode ?? (systemMetrics as any)?.currentMode ?? "hover") as ModeKey;
  const effectiveMode = (optimisticMode ?? serverMode) as ModeKey;

  // Watch for server mode actually changing; bump nonce so children can re-init
  const prevServerModeRef = useRef<string>(serverMode);
  useEffect(() => {
    if (prevServerModeRef.current !== serverMode) {
      prevServerModeRef.current = serverMode;
      setModeNonce((n) => n + 1);
      setOptimisticMode(null); // clear optimism once server confirms
    }
  }, [serverMode]);

  // --- Derived mode knobs for UI (always reflect the selected mode)
  const modeCfg = MODE_CONFIGS[((pipeline?.currentMode ?? effectiveMode) as ModeKey)] || MODE_CONFIGS.hover;
  const powerFillLive = Number.isFinite((pipeline as any)?.powerFillCmd)
    ? Math.max(0, Math.min(1, Number((pipeline as any).powerFillCmd)))
    : 1;
  const [manualPowerOpen, setManualPowerOpen] = useState(false);
  const [powerFillLocal, setPowerFillLocal] = useState<number>(() => powerFillLive);
  const powerFillDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPowerFillLocal((prev) => (Math.abs(prev - powerFillLive) > 1e-3 ? powerFillLive : prev));
  }, [powerFillLive]);

  useEffect(() => () => {
    if (powerFillDebounceRef.current) {
      clearTimeout(powerFillDebounceRef.current);
    }
  }, []);

  const handlePowerFillChange = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    setPowerFillLocal(clamped);
    if (powerFillDebounceRef.current) {
      clearTimeout(powerFillDebounceRef.current);
    }
    powerFillDebounceRef.current = setTimeout(() => {
      updatePipeline.mutate({ powerFillCmd: clamped });
    }, 140);
  }, [updatePipeline]);
  const P_target_nominal_W = Number.isFinite((pipeline as any)?.P_target_W)
    ? Number((pipeline as any).P_target_W)
    : modeCfg?.powerTarget_W ?? 0;
  const P_target_cmd_display_W = Number.isFinite((pipeline as any)?.P_target_cmd_W)
    ? Number((pipeline as any).P_target_cmd_W)
    : P_target_nominal_W * powerFillLocal;
  const modelModeLabel = String((pipeline as any)?.modelMode ?? "calibrated");

  // Prefer live pipeline values if present; otherwise fall back to the mode config
  const dutyUI = isFiniteNumber(pipeline?.dutyCycle) ? pipeline!.dutyCycle! : modeCfg.dutyCycle ?? 0.14;

  // Split sector handling: total sectors (400) for averaging vs concurrent sectors (1-2) for strobing
  const totalSectors = useMemo(() => {
    const fromMetrics = Number(systemMetrics?.totalSectors);
    if (Number.isFinite(fromMetrics) && fromMetrics! > 0) return Math.floor(fromMetrics!);
    const fromPipeline = Number((pipeline as any)?.sectorsTotal);
    if (Number.isFinite(fromPipeline) && fromPipeline! > 0) return Math.floor(fromPipeline!);
    return modeCfg.sectorsTotal;
  }, [systemMetrics?.totalSectors, (pipeline as any)?.sectorsTotal, modeCfg.sectorsTotal]);

  const concurrentSectors = useMemo(() => {
    const fromMetrics = Number(systemMetrics?.sectorStrobing);
    if (Number.isFinite(fromMetrics) && fromMetrics! > 0) return Math.floor(fromMetrics!);
    const fromPipeline = Number((pipeline as any)?.sectorsConcurrent ?? pipeline?.sectorStrobing);
    if (Number.isFinite(fromPipeline) && fromPipeline! > 0) return Math.floor(fromPipeline!);
    return modeCfg.sectorsConcurrent;
  }, [systemMetrics?.sectorStrobing, (pipeline as any)?.sectorsConcurrent, pipeline?.sectorStrobing, modeCfg.sectorsConcurrent]);

  // keep for legacy display text if needed
  const sectorsUI = concurrentSectors;

  // Keep the trail array sized to totalSectors
  useEffect(() => {
    setTrail((prev) => (prev.length === totalSectors ? prev : Array(totalSectors).fill(0)));
  }, [totalSectors]);

  // Calculate hull geometry before using it
  const hull =
    hullDimsEffective
      ? {
          ...(hullMetrics?.hull ?? {}),
          Lx_m: hullDimsEffective.Lx_m,
          Ly_m: hullDimsEffective.Ly_m,
          Lz_m: hullDimsEffective.Lz_m,
          a: hullDimsEffective.Lx_m / 2,
          b: hullDimsEffective.Ly_m / 2,
          c: hullDimsEffective.Lz_m / 2,
        }
      : hullMetrics && hullMetrics.hull
        ? {
            ...hullMetrics.hull,
            // preserve explicit zeros from pipeline; only fallback when undefined/null
            a: Number.isFinite(hullMetrics.hull.a) ? Number(hullMetrics.hull.a) : (Number.isFinite(hullMetrics.hull.Lx_m) ? hullMetrics.hull.Lx_m / 2 : 503.5),
            b: Number.isFinite(hullMetrics.hull.b) ? Number(hullMetrics.hull.b) : (Number.isFinite(hullMetrics.hull.Ly_m) ? hullMetrics.hull.Ly_m / 2 : 132.0),
            c: Number.isFinite(hullMetrics.hull.c) ? Number(hullMetrics.hull.c) : (Number.isFinite(hullMetrics.hull.Lz_m) ? hullMetrics.hull.Lz_m / 2 : 86.5),
          }
        : { Lx_m: 1007, Ly_m: 264, Lz_m: 173, a: 503.5, b: 132, c: 86.5 };

  // Shared light-crossing loop for synchronized strobing across all visual components
  const lc = useLightCrossingLoop({
    // NOTE: passes TOTAL sectors (averaging), not live/concurrent.
    sectorStrobing: totalSectors,
    currentSector: systemMetrics?.currentSector ?? 0,
    sectorPeriod_ms: systemMetrics?.sectorPeriod_ms ?? 1.0,
    duty: dutyUI,
    freqGHz: pipeline?.modulationFreq_GHz ?? 15,
    hull: { a: hull.a, b: hull.b, c: hull.c }, // use live hull geometry
    wallWidth_m: 6.0,
    localBurstFrac: MODE_CONFIGS[effectiveMode as ModeKey]?.localBurstFrac ?? 0.01, // mode-aware burst duty
  });

  // Drive Sync Store: bridge scheduler phase and mode presets
  const ds = useDriveSyncStore();
  const ridgePresets = ds.ridgePresets ?? [];
  const setRidgePresets = ds.setRidgePresets;

  const { data: pipelineSnapshot, sweepResults = [], publishSweepControls } = useEnergyPipeline();
  const sweepRuntime = (pipelineSnapshot as any)?.sweep as SweepRuntime | undefined;
  const hasSweepTelemetry = Boolean(
    (sweepResults?.length ?? 0) > 0 ||
      (sweepRuntime?.iter ?? 0) > 0 ||
      sweepRuntime?.completedAt ||
      sweepRuntime?.active ||
      (sweepRuntime?.top?.length ?? 0) > 0 ||
      sweepRuntime?.last,
  );
  const sweepButtonsLocked = !hasSweepTelemetry;
  const startTimeLapseDisabled =
    timeLapseRecorder.isProcessing ||
    (!timeLapseRecorder.isRecording && sweepButtonsLocked);
  const sweepActive = !!sweepRuntime?.active;
  const handleFractionalPump = useCallback(
    async (cells: FractionalGridCellState[], _meta: { f0: number; fs: number }) => {
      if (!cells.length) return;
      const freqGHz = cells
        .map((cell) => cell.fHz / 1e9)
        .filter((value) => Number.isFinite(value) && value > 0) as number[];
      if (!freqGHz.length) {
        toast({
          title: "No pump targets selected",
          description: "Fractional coherence candidates are outside the supported band.",
          variant: "destructive",
        });
        return;
      }
      const normalized = freqGHz.map((value) => Number(value.toFixed(6)));
      const payload: Partial<DynamicConfig> = {
        pump_freq_GHz: normalized.length === 1 ? normalized[0] : normalized,
      };
      try {
        await publishSweepControls(payload);
        const descriptor =
          normalized.length === 1
            ? `${normalized[0].toFixed(4)} GHz`
            : normalized.map((value) => `${value.toFixed(4)} GHz`).join(", ");
        toast({
          title: "Pump targets updated",
          description: descriptor,
        });
      } catch (err) {
        console.error("[Helix] Failed to publish fractional pump targets", err);
        toast({
          title: "Pump update failed",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      }
    },
    [publishSweepControls],
  );
  const sweepCancelRequested = !!sweepRuntime?.cancelRequested;
  const [sweepTopN, setSweepTopN] = useState<number>(8);
  const [selectedSweep, setSelectedSweep] = useState<VacuumGapSweepRow | null>(null);

  const pumpStability = useMemo<PumpStability | null>(() => {
    const liveRow =
      sweepRuntime?.last ??
      (sweepResults.length ? (sweepResults[sweepResults.length - 1] as Partial<VacuumGapSweepRow>) : null);
    if (!liveRow) return null;

    const pick = (value: unknown): number | undefined => {
      const num = Number(value);
      return Number.isFinite(num) ? num : undefined;
    };

    const gapNm = pick(liveRow.d_nm);
    const mFrac = pick((liveRow as any).m);
    const phaseDeg = pick((liveRow as any).phi_deg);
    const pumpFreqGHz = pick((liveRow as any).Omega_GHz);
    const detuneMHz = pick((liveRow as any).detune_MHz);
    const kappaMHz = pick((liveRow as any).kappa_MHz);
    const kappaEffMHz = pick((liveRow as any).kappaEff_MHz);
    const rhoRaw = pick((liveRow as any).pumpRatio);

    const modDepthPct = mFrac != null ? mFrac * 100 : undefined;
    const phiRad = phaseDeg != null ? (phaseDeg * Math.PI) / 180 : undefined;
    const cosPhi = phiRad != null ? Math.cos(phiRad) : undefined;

    const rhoEst =
      cosPhi != null &&
      kappaMHz != null &&
      kappaEffMHz != null &&
      Math.abs(cosPhi) > 1e-3 &&
      kappaMHz !== 0
        ? (1 - kappaEffMHz / kappaMHz) / cosPhi
        : rhoRaw;

    const detuneOverKappa =
      detuneMHz != null && kappaMHz != null && kappaMHz !== 0 ? detuneMHz / kappaMHz : undefined;

    const issues: string[] = [];
    let status: PumpStatus = "ok";

    if (kappaMHz == null || kappaMHz <= 0) {
      status = "idle";
      issues.push(" unavailable");
    } else {
      if (kappaEffMHz == null) {
        issues.push("_eff unknown");
      } else if (kappaEffMHz <= 0) {
        status = "hazard";
        issues.push("_eff  0 (threshold)");
      }

      const rhoAbs = rhoEst != null ? Math.abs(rhoEst) : undefined;
      if (rhoAbs != null) {
        if (rhoAbs >= 0.95) {
          status = "hazard";
          issues.push("  0.95");
        } else if (rhoAbs >= 0.9 && status !== "hazard") {
          status = "warn";
          issues.push(" approaching threshold");
        } else if (rhoAbs >= 0.8 && status === "ok") {
          status = "warn";
        }
      }

      if (detuneOverKappa != null && Math.abs(detuneOverKappa) < 0.2 && status !== "hazard") {
        status = "warn";
        issues.push("|| < 0.2 ");
      }
    }

    const uniqueIssues = Array.from(new Set(issues));

    const kappaAbs = kappaMHz != null ? Math.abs(kappaMHz) : undefined;
    const detuneTargetMHz =
      kappaAbs != null ? Number((kappaAbs * 0.65).toFixed(3)) : 9;
    const f0GHz =
      pumpFreqGHz != null
        ? detuneMHz != null
          ? (pumpFreqGHz - detuneMHz / 1000) / 2
          : pumpFreqGHz / 2
        : undefined;
    const pumpTargetGHz =
      f0GHz != null ? Number((2 * f0GHz + detuneTargetMHz / 1000).toFixed(6)) : undefined;

    return {
      status,
      gapNm,
      phaseDeg,
      modDepthPct,
      pumpFreqGHz,
      detuneMHz,
      detuneOverKappa,
      kappaMHz,
      kappaEffMHz,
      rhoRaw,
      rhoEst,
      issues: uniqueIssues,
      f0GHz,
      recommendation: {
        gapNm: 20,
        phaseDeg: -10,
        modDepthPct: 0.8,
        detuneMHz: detuneTargetMHz,
        pumpFreqGHz: pumpTargetGHz,
        rhoTarget: 0.85,
      },
    } as PumpStability;
  }, [sweepRuntime?.last, sweepResults]);

  const fmtRatio = (value?: number) =>
    Number.isFinite(value ?? NaN) ? Number(value).toFixed(3) : "--";
  const fmtMHz = (value?: number) =>
    Number.isFinite(value ?? NaN) ? `${Number(value).toFixed(3)} MHz` : "--";
  const fmtGHz = (value?: number) =>
    Number.isFinite(value ?? NaN) ? `${Number(value).toFixed(3)} GHz` : "--";
  const fmtPct = (value?: number) =>
    Number.isFinite(value ?? NaN) ? `${Number(value).toFixed(2)} %` : "--";

  const applyWorkingPoint = useCallback(async () => {
    if (!pumpStability) return;
    const { recommendation } = pumpStability;
    try {
      const sweepCfg: DynamicConfig["sweep"] = {
        gaps_nm: [recommendation.gapNm],
        mod_depth_pct: [recommendation.modDepthPct],
        phase_deg: [recommendation.phaseDeg],
      };
      if (recommendation.pumpFreqGHz != null) {
        sweepCfg.pump_freq_GHz = [recommendation.pumpFreqGHz];
      }
      const payload: Partial<DynamicConfig> = {
        gap_nm: recommendation.gapNm,
        mod_depth_pct: recommendation.modDepthPct,
        phase_deg: recommendation.phaseDeg,
        sweep: sweepCfg,
      };
      if (recommendation.pumpFreqGHz != null) {
        payload.pump_freq_GHz = recommendation.pumpFreqGHz;
      }
      await publishSweepControls(payload);
      toast({
        title: "Safe working point applied",
        description: `gap ${recommendation.gapNm} nm | phi ${recommendation.phaseDeg.toFixed(1)} deg | m ${recommendation.modDepthPct.toFixed(2)}%`,
      });
    } catch (err) {
      console.error("[HELIX] Failed to apply SWP-A:", err);
      toast({
        title: "Failed to apply SWP",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [pumpStability, publishSweepControls]);

  const nudgeDetune = useCallback(async () => {
    if (!pumpStability || !pumpStability.recommendation.pumpFreqGHz) return;
    const targetGHz = pumpStability.recommendation.pumpFreqGHz;
    try {
      const payload: Partial<DynamicConfig> = {
        pump_freq_GHz: targetGHz,
      };
      if (pumpStability.recommendation.phaseDeg != null) {
        payload.phase_deg = pumpStability.recommendation.phaseDeg;
      }
      await publishSweepControls(payload);
      toast({
        title: "Detune nudged",
        description: `Delta set to ${pumpStability.recommendation.detuneMHz.toFixed(2)} MHz (~0.65 kappa)`,
      });
    } catch (err) {
      console.error("[HELIX] Failed to nudge detune:", err);
      toast({
        title: "Failed to adjust detune",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [pumpStability, publishSweepControls]);

  const trimDepth = useCallback(async () => {
    if (!pumpStability) return;
    const current = pumpStability.modDepthPct ?? pumpStability.recommendation.modDepthPct;
    const targetDepth = Number(
      Math.max(0.1, Math.min(current, pumpStability.recommendation.modDepthPct)).toFixed(3),
    );
    try {
      const payload: Partial<DynamicConfig> = {
        mod_depth_pct: targetDepth,
      };
      await publishSweepControls(payload);
      toast({
        title: "Modulation depth trimmed",
        description: `m -> ${targetDepth.toFixed(2)}%`,
      });
    } catch (err) {
      console.error("[HELIX] Failed to trim depth:", err);
      toast({
        title: "Failed to trim depth",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [pumpStability, publishSweepControls]);

  const pumpStatusMeta = pumpStability
    ? pumpStability.status === "hazard"
      ? { label: "limit", className: "bg-rose-500/20 text-rose-200", icon: <AlertTriangle className="h-3 w-3" /> }
      : pumpStability.status === "warn"
      ? { label: "guard", className: "bg-amber-500/20 text-amber-200", icon: <AlertTriangle className="h-3 w-3" /> }
      : pumpStability.status === "ok"
      ? { label: "stable", className: "bg-emerald-500/20 text-emerald-300", icon: <CheckCircle2 className="h-3 w-3" /> }
      : { label: "idle", className: "bg-slate-700/60 text-slate-300", icon: <Gauge className="h-3 w-3" /> }
    : null;

  const bestPerGap = useMemo(() => {
    const map = new Map<number, VacuumGapSweepRow>();
    for (const row of sweepResults) {
      const prev = map.get(row.d_nm);
      if (!prev || row.G > prev.G) {
        map.set(row.d_nm, row);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.d_nm - b.d_nm);
  }, [sweepResults]);

  const topByGain = useMemo(() => {
    if (!sweepResults.length) return [];
    return [...sweepResults]
      .sort((a, b) => b.G - a.G)
      .slice(0, Math.max(1, sweepTopN));
  }, [sweepResults, sweepTopN]);

  const runSweepWithHardware = useCallback(() => {
    const payload = { sweep: { activeSlew: true, twoPhase: true } } as Partial<DynamicConfig>;
    publishSweepControls(payload);
  }, [publishSweepControls]);

  const cancelSweep = useCallback(async () => {
    try {
      await apiRequest("POST", "/api/helix/pipeline/cancel-sweep", {});
    } catch (err) {
      console.error("[HELIX] Failed to cancel sweep:", err);
    }
  }, []);

  const exportSweepCSV = useCallback(() => {
    if (!sweepResults.length) return;
    downloadCSV(sweepResults);
  }, [sweepResults]);

  const captureRidge = useCallback(() => {
    if (!sweepResults.length) {
      setRidgePresets([]);
      return;
    }
    const base = bestPerGap.length ? bestPerGap : topByGain;
    const chosen = base.slice(0, Math.max(1, sweepTopN));
    const presets: RidgePreset[] = chosen.map((row) => {
      const qlLabel = Number.isFinite(row.QL)
        ? (row.QL as number).toExponential(2)
        : Number.isFinite(row.QL_base)
        ? (row.QL_base as number).toExponential(2)
        : '--';

      return {
        d_nm: row.d_nm,
        Omega_GHz: row.Omega_GHz,
        phi_deg: row.phi_deg,
        m_pct: row.m * 100,
        note: `G=${row.G.toFixed(2)} dB, QL=${qlLabel}`,
      };
    });
    setRidgePresets(presets);
  }, [bestPerGap, topByGain, sweepResults, sweepTopN, setRidgePresets]);

  useEffect(() => {
    if (!sweepResults.length) {
      setSelectedSweep(null);
      return;
    }
    if (!selectedSweep) {
      setSelectedSweep(sweepResults[0]);
      return;
    }
    const stillPresent = sweepResults.find(
      (row) =>
        row.d_nm === selectedSweep.d_nm &&
        row.m === selectedSweep.m &&
        row.Omega_GHz === selectedSweep.Omega_GHz &&
        row.phi_deg === selectedSweep.phi_deg,
    );
    if (!stillPresent) {
      setSelectedSweep(sweepResults[0]);
    }
  }, [sweepResults, selectedSweep]);

  // Follow scheduler phase  drive sync phase (only when phaseMode="scheduler")
  useEffect(() => {
    const ingestWedge = useFlightDirectorStore.getState().ingestSchedulerWedge;
    const total = Math.max(1, Math.floor(totalSectors || 400));
    const nowTs =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    const idxSrc = Number.isFinite(systemMetrics?.currentSector)
      ? Number(systemMetrics!.currentSector)
      : Number.isFinite(lc?.sectorIdx)
        ? Number(lc!.sectorIdx)
        : 0;
    const wrapped = ((idxSrc % total) + total) % total;
    const basePhase = wrapped / total;

    if (typeof ingestWedge === "function") {
      try {
        ingestWedge(basePhase, nowTs);
      } catch {
        // non-fatal: flight director store may not be initialised yet
      }
    }

    const biasFraction = clampPhaseBiasDeg(pumpPhaseBiasDeg) / 360;
    let phase01 = basePhase + biasFraction;
    phase01 = phase01 - Math.floor(phase01);
    if (phase01 < 0) {
      phase01 += 1;
    }

    if (ds.phaseMode !== "scheduler") return;

    if (typeof ds.setPhase === "function") {
      ds.setPhase(phase01);
    }
    if (typeof ds.setPumpPhaseDeg === "function") {
      ds.setPumpPhaseDeg(phase01 * 360);
    }
  }, [ds.phaseMode, ds.setPumpPhaseDeg, pumpPhaseBiasDeg, systemMetrics?.currentSector, lc?.sectorIdx, totalSectors]);

  // Apply per-mode presets into drive sync (when followMode lock is enabled)
  useEffect(() => {
    if (!ds.locks?.followMode) return;
    const mode = String(effectiveMode).toLowerCase();
    switch (mode) {
      case "nearzero":
        // Zero- hover-climb: dual lobes 180 apart, slightly tighter and higher floor for stability
        if (typeof ds.setSplit === "function") ds.setSplit(true, 0.5);
        if (typeof ds.setSigma === "function") ds.setSigma(0.20);
        if (typeof ds.setFloor === "function") ds.setFloor(0.18);
        break;
      case "hover":
        // Gentle bulge: single lobe, a bit broader with modest floor
        if (typeof ds.setSplit === "function") ds.setSplit(false);
        if (typeof ds.setSigma === "function") ds.setSigma(0.30);
        if (typeof ds.setFloor === "function") ds.setFloor(0.12);
        break;
      case "cruise":
        // Coherent sweep: single lobe, medium width and a low floor
        if (typeof ds.setSplit === "function") ds.setSplit(false);
        if (typeof ds.setSigma === "function") ds.setSigma(0.25);
        if (typeof ds.setFloor === "function") ds.setFloor(0.10);
        break;
      default:
        // leave user settings as-is for other modes (standby/emergency/etc.)
        break;
    }
  }, [effectiveMode, ds.locks?.followMode]);

  // Push q and  (zeta) into drive sync store when available
  useEffect(() => {
    const qLive = isFiniteNumber(pipeline?.qSpoilingFactor)
      ? pipeline!.qSpoilingFactor!
      : (isFiniteNumber((systemMetrics as any)?.qSpoilingFactor) ? Number((systemMetrics as any).qSpoilingFactor) : undefined);
    if (typeof qLive === "number" && typeof ds.setQ === "function") ds.setQ(qLive);

    const zLive = isFiniteNumber(systemMetrics?.fordRoman?.value)
      ? Number(systemMetrics!.fordRoman!.value)
      : (isFiniteNumber((pipeline as any)?.zeta) ? Number((pipeline as any).zeta) : undefined);
    if (typeof zLive === "number" && typeof ds.setZeta === "function") ds.setZeta(zLive);
  }, [pipeline?.qSpoilingFactor, (systemMetrics as any)?.qSpoilingFactor, systemMetrics?.fordRoman?.value, (pipeline as any)?.zeta]);

  const qSpoilUI = isFiniteNumber(pipeline?.qSpoilingFactor) ? pipeline!.qSpoilingFactor! : modeCfg.qSpoilingFactor ?? 1;

  const dutyEffectiveFR = useMemo(() => {
    const frFromPipeline =
      (pipelineState as any)?.dutyEffectiveFR ?? (pipelineState as any)?.dutyShip ?? (pipelineState as any)?.dutyEff;

    if (isFiniteNumber(frFromPipeline)) return clamp01(frFromPipeline);

    const burst = Number(lc?.burst_ms);
    const dwell = Number(lc?.dwell_ms);
    const burstLocal = Number.isFinite(burst) && Number.isFinite(dwell) && dwell > 0 ? burst / dwell : 0.01;

    const S_live = Math.max(0, Math.floor(concurrentSectors ?? 1));
    const S_total = Math.max(1, Math.floor(totalSectors ?? 400));

    return clamp01(burstLocal * (S_live / S_total));
  }, [pipelineState, lc?.burst_ms, lc?.dwell_ms, concurrentSectors, totalSectors]);

  const isStandby = String(effectiveMode).toLowerCase() === "standby";
  const dutyEffectiveFR_safe = isStandby ? 0 : dutyEffectiveFR;
  const dutyUI_safe = isStandby ? 0 : dutyUI;
  // Canonical FR duty for child panels: prefer Energy panel's displayed value; fallback to computed safe
  const frDutyForPanels = dutyEffectiveFR_safe;
  const rawLocalBurstFrac = isFiniteNumber((pipeline as any)?.localBurstFrac)
    ? Number((pipeline as any).localBurstFrac)
    : modeCfg.localBurstFrac ?? 0.01;
  const localBurstFrac = clamp01(rawLocalBurstFrac);
  const nearZeroGuards = useMemo(
    () => ({
      q: isFiniteNumber(pipeline?.qSpoilingFactor) ? pipeline!.qSpoilingFactor! : NaN,
      zeta: isFiniteNumber(systemMetrics?.fordRoman?.value)
        ? Number(systemMetrics!.fordRoman.value)
        : isFiniteNumber(pipeline?.zeta)
        ? pipeline!.zeta!
        : NaN,
      stroke_pm: isFiniteNumber((pipeline as any)?.stroke_pm)
        ? Number((pipeline as any).stroke_pm)
        : isFiniteNumber((systemMetrics as any)?.stroke_pm)
        ? Number((systemMetrics as any).stroke_pm)
        : NaN,
      // Treat non-positive TS ratios as missing to avoid false red-limit trips
      TS:
        isFiniteNumber(pipeline?.TS_ratio) && Number(pipeline!.TS_ratio!) > 0
          ? Number(pipeline!.TS_ratio!)
          : isFiniteNumber((systemMetrics as any)?.timeScaleRatio) && Number((systemMetrics as any).timeScaleRatio) > 0
          ? Number((systemMetrics as any).timeScaleRatio)
          : NaN,
    }),
    [
      pipeline?.qSpoilingFactor,
      pipeline?.zeta,
      (pipeline as any)?.stroke_pm,
      pipeline?.TS_ratio,
      systemMetrics?.fordRoman?.value,
      (systemMetrics as any)?.stroke_pm,
      (systemMetrics as any)?.timeScaleRatio,
    ]
  );
  const nearZeroThermal = useMemo(() => {
    const P_diss =
      isFiniteNumber(pipeline?.P_loss_raw) && isFiniteNumber(pipeline?.N_tiles)
        ? pipeline!.P_loss_raw! * pipeline!.N_tiles!
        : undefined;
    const Q_reject = isFiniteNumber((systemMetrics as any)?.energyOutput)
      ? Number((systemMetrics as any).energyOutput)
      : isFiniteNumber(pipeline?.P_avg)
      ? pipeline!.P_avg! * 1e6
      : undefined;
    const headroom = isFiniteNumber((pipeline as any)?.E_headroom_J)
      ? Number((pipeline as any).E_headroom_J)
      : undefined;
    if (P_diss == null && Q_reject == null && headroom == null) return undefined;
    return {
      P_diss_W: P_diss,
      Q_reject_W: Q_reject,
      E_headroom_J: headroom,
    };
  }, [pipeline?.P_loss_raw, pipeline?.N_tiles, (systemMetrics as any)?.energyOutput, pipeline?.P_avg, (pipeline as any)?.E_headroom_J]);
  const tauLCSeconds = isFiniteNumber(lc?.tauLC_ms) ? (lc!.tauLC_ms! / 1000) : undefined;
  const nearZeroBurst = useMemo(() => {
    const dwellMs = isFiniteNumber(lc?.dwell_ms) ? Number(lc!.dwell_ms!) : undefined;
    const burstMs = isFiniteNumber((lc as any)?.burst_ms) ? Number((lc as any).burst_ms) : undefined;
    const fracLive = (Number.isFinite(dwellMs) && Number.isFinite(burstMs) && (dwellMs as number) > 0)
      ? Math.max(0, Math.min(1, (burstMs as number) / (dwellMs as number)))
      : undefined;
    return {
      dwell_s: Number.isFinite(dwellMs) ? (dwellMs as number) / 1000 : undefined,
      // Prefer live burst fraction from metrics when present; fallback to mode/pipeline localBurstFrac
      frac: Number.isFinite(fracLive) ? (fracLive as number) : localBurstFrac,
    };
  }, [lc?.dwell_ms, (lc as any)?.burst_ms, localBurstFrac]);
  const dutyForEase = isFiniteNumber(pipeline?.dutyCycle) ? pipeline!.dutyCycle! : modeCfg.dutyCycle ?? 0.12;
  const burstForDwell = localBurstFrac;
  const postPipelineUpdate = useCallback(
    async (payload: Record<string, unknown>, opts?: { fallbackMode?: "allow" | "warn" | "block" }) => {
      const res = await apiRequest("POST", "/api/helix/pipeline/update", {
        ...payload,
        fallbackMode: opts?.fallbackMode ?? "warn",
      });
      const json = await res.json().catch(() => null);
      if (res.status === 422) {
        const reasons = Array.isArray((json as any)?.geometryFallback?.reasons)
          ? (json as any).geometryFallback.reasons.join(", ")
          : "";
        const message = (json as any)?.error ?? "Pipeline update blocked";
        throw new Error(reasons ? `${message}: ${reasons}` : message);
      }
      if (!res.ok) {
        const message = (json as any)?.error ?? res.statusText;
        throw new Error(message);
      }
      const fallback = (json as any)?.geometryFallback;
      if (fallback?.applied || (fallback && fallback.mode === "warn")) {
        const reasons = Array.isArray(fallback.reasons) ? fallback.reasons.join(", ") : "unknown";
        const applied = Boolean(fallback?.applied);
        const warnOnly = !applied && fallback?.mode === "warn";
        toast({
          title: "Geometry fallback",
          description: `Mode=${fallback.mode} ${reasons ? `· ${reasons}` : ""}`,
          ...(applied ? { variant: "destructive" } : warnOnly ? { variant: "default" } : {}),
        });
      }
      return json;
    },
    [],
  );
  const handleNearZeroAction = useCallback(
    async (action: "ease" | "dwell" | "drop") => {
      if (effectiveMode !== "nearzero") {
        setMainframeLog((prev) => [...prev, `[NEARZERO] Ignored ${action} (mode inactive)`].slice(-200));
        return;
      }
      try {
        if (action === "drop") {
          setMainframeLog((prev) => [...prev, "[NEARZERO] Advisory -> switching to Hover"].slice(-200));
          console.info("[HELIX] Near-Zero advisory requested mode drop to hover");
          switchMode.mutate("hover");
          return;
        }
        if (action === "ease") {
          const nextDuty = Math.max(0, dutyForEase * 0.92);
          await postPipelineUpdate({ dutyCycle: nextDuty }, { fallbackMode: "warn" });
          setMainframeLog((prev) => [...prev, `[NEARZERO] Duty eased to ${(nextDuty * 100).toFixed(2)}%`].slice(-200));
        } else if (action === "dwell") {
          const nextFrac = Math.max(0.0005, burstForDwell * 0.9);
          await postPipelineUpdate({ localBurstFrac: nextFrac }, { fallbackMode: "warn" });
          setMainframeLog((prev) => [...prev, `[NEARZERO] Burst fraction trimmed to ${(nextFrac * 100).toFixed(2)}%`].slice(-200));
        }
        refetchMetrics();
      } catch (error) {
        console.error("[NEARZERO] control action failed:", error);
        toast({
          title: "Near-Zero control failed",
          description: error instanceof Error ? error.message : String(error),
          variant: "destructive",
        });
      }
    },
    [effectiveMode, dutyForEase, burstForDwell, switchMode, refetchMetrics, toast, setMainframeLog]
  );
  const tauLcMs = lc?.tauLC_ms;
  const tauLcUs = isFiniteNumber(tauLcMs) ? tauLcMs * 1000 : undefined;
  const hasMetricsTau =
    isFiniteNumber(systemMetrics?.lightCrossing?.tauLC_ms) ||
    isFiniteNumber(systemMetrics?.lightCrossing?.tau_ms) ||
    isFiniteNumber(systemMetrics?.lightCrossing?.tauLC_s);
  const sectorsProv =
    Number.isFinite(systemMetrics?.totalSectors) && Number(systemMetrics?.totalSectors) > 0
      ? ("metrics" as const)
      : Number.isFinite((pipeline as any)?.sectorsTotal) && Number((pipeline as any)?.sectorsTotal) > 0
      ? ("live" as const)
      : ("derived" as const);
  const qSpoilLive = isFiniteNumber(pipeline?.qSpoilingFactor) ? pipeline!.qSpoilingFactor! : undefined;
  const spectrumInputs = useMemo(
    () => ({
      a_nm: isFiniteNumber(pipeline?.gap_nm) ? pipeline!.gap_nm! : undefined,
      sagDepth_nm: isFiniteNumber(pipeline?.sag_nm) ? pipeline!.sag_nm! : undefined,
      gammaGeo: isFiniteNumber(pipeline?.gammaGeo) ? pipeline!.gammaGeo! : undefined,
      Q0: isFiniteNumber(pipeline?.qMechanical) ? pipeline!.qMechanical! : undefined,
      qCavity: isFiniteNumber(pipeline?.qCavity) ? pipeline!.qCavity! : undefined,
      qSpoilingFactor: qSpoilLive ?? qSpoilUI,
      modulationFreq_GHz: isFiniteNumber(pipeline?.modulationFreq_GHz) ? pipeline!.modulationFreq_GHz! : undefined,
      duty: localBurstFrac,
      sectors: totalSectors,
      lightCrossing_us: tauLcUs,
      prov: {
        a_nm: pipeline?.gap_nm !== undefined ? ("live" as const) : undefined,
        sagDepth_nm: pipeline?.sag_nm !== undefined ? ("live" as const) : undefined,
        gammaGeo: pipeline?.gammaGeo !== undefined ? ("live" as const) : undefined,
        Q0: pipeline?.qMechanical !== undefined ? ("live" as const) : undefined,
        qCavity: pipeline?.qCavity !== undefined ? ("live" as const) : undefined,
        qSpoilingFactor: qSpoilLive !== undefined ? ("live" as const) : ("derived" as const),
        modulationFreq_GHz: pipeline?.modulationFreq_GHz !== undefined ? ("live" as const) : undefined,
        duty: (pipeline as any)?.localBurstFrac !== undefined ? ("live" as const) : ("derived" as const),
        sectors: sectorsProv,
        lightCrossing_us: tauLcUs !== undefined ? (hasMetricsTau ? ("metrics" as const) : ("derived" as const)) : undefined,
      },
    }),
    [pipeline, qSpoilLive, qSpoilUI, localBurstFrac, totalSectors, tauLcUs, hasMetricsTau, sectorsProv]
  );

  // Resolve authoritative light-crossing for Shell Outline: prefer server/derived/live timing, fallback to local loop
  const lcForOutline = useMemo(() => {
    // Prefer the strobing timeline (loop) for LC, then fallback to metrics/live
    const m = (systemMetrics as any)?.lightCrossing || {};
    const tauFromLoop = Number.isFinite(lc?.tauLC_ms) ? Number(lc!.tauLC_ms) : undefined;
    const tauFromMetrics = Number.isFinite(m.tauLC_ms) ? Number(m.tauLC_ms)
                        : (Number.isFinite(m.tau_ms) ? Number(m.tau_ms)
                        : (Number.isFinite(m.tauLC_s) ? Number(m.tauLC_s) * 1000 : undefined));
    const tau = tauFromLoop ?? tauFromMetrics;

    const dwell = Number.isFinite(m.dwell_ms) ? Number(m.dwell_ms)
                : (Number.isFinite((systemMetrics as any)?.sectorPeriod_ms) ? Number((systemMetrics as any).sectorPeriod_ms)
                : (Number.isFinite(lc?.dwell_ms) ? Number(lc!.dwell_ms) : undefined));
    const burst = Number.isFinite(m.burst_ms) ? Number(m.burst_ms)
                : (Number.isFinite((lc as any)?.burst_ms) ? Number((lc as any).burst_ms) : undefined);
    return {
      tauLC_ms: tau,
      dwell_ms: dwell,
      burst_ms: burst,
    } as { tauLC_ms?: number; dwell_ms?: number; burst_ms?: number };
  }, [systemMetrics, lc?.tauLC_ms, lc?.dwell_ms, (lc as any)?.burst_ms]);

  if (import.meta.env?.DEV) {
    console.table({
      mode: effectiveMode,
      totalSectors,
      concurrentSectors,
      dwell_ms: lc.dwell_ms,
      burst_ms: lc.burst_ms,
      localBurstFrac: MODE_CONFIGS[effectiveMode as ModeKey]?.localBurstFrac,
      dutyFR: dutyEffectiveFR_safe,
    });
  }

  // --- Active tiles: robust fallback calc
  const TOTAL_SECTORS_FALLBACK = 400;
  const TOTAL_TILES_FALLBACK = 2_800_000;
  const LOCAL_BURST_DEFAULT = 0.01;

  const totalSectorsSafe = Number.isFinite(totalSectors) ? Math.max(1, Number(totalSectors)) : TOTAL_SECTORS_FALLBACK;

  const concurrentSectorsSafe = isStandby ? 0 : Math.max(1, Number(concurrentSectors) || 1);

  const totalTilesSafe = (() => {
    const a = Number(systemMetrics?.totalTiles);
    const b = Number(pipeline?.N_tiles);
    if (Number.isFinite(a) && a > 0) return Math.floor(a);
    if (Number.isFinite(b) && b > 0) return Math.floor(b);
    return TOTAL_TILES_FALLBACK;
  })();

  const tilesPerSectorSafe = (() => {
    const tps = Number(systemMetrics?.tilesPerSector);
    if (Number.isFinite(tps) && tps > 0) return Math.floor(tps);
    return Math.max(1, Math.floor(totalTilesSafe / totalSectorsSafe));
  })();

  // Calculate view mass fraction for REAL renderer (one sector's worth vs full hull)
  const viewMassFracReal = tilesPerSectorSafe / totalTilesSafe; //  1/400 for single sector

  const burstLocal = (() => {
    const b = Number(lc?.burst_ms),
      d = Number(lc?.dwell_ms);
    if (Number.isFinite(b) && Number.isFinite(d) && d > 0) {
      return Math.max(0, Math.min(1, b / d));
    }
    return LOCAL_BURST_DEFAULT;
  })();

  const dutyFRSafe = (() => {
    if (isStandby) return 0;
    const fr = Number((pipelineState as any)?.dutyEffectiveFR) ?? Number((pipelineState as any)?.dutyEff) ?? NaN;
    if (Number.isFinite(fr)) return Math.max(0, Math.min(1, fr));
    return Math.max(0, Math.min(1, burstLocal * (concurrentSectorsSafe / totalSectorsSafe)));
  })();

  const computedAvgTiles = Math.round(totalTilesSafe * dutyFRSafe);
  const computedInstantTiles = Math.round(tilesPerSectorSafe * concurrentSectorsSafe * burstLocal);

  // If server emitted 0 but we're not in Standby, prefer computed
  const serverAvgTiles = Number(systemMetrics?.activeTiles);
  const activeFraction = totalSectorsSafe > 0 ? concurrentSectorsSafe / totalSectorsSafe : 0;
  const ringCurrentSector = Number.isFinite(systemMetrics?.currentSector)
    ? Number(systemMetrics!.currentSector)
    : (Number.isFinite(lc?.sectorIdx) ? Number(lc!.sectorIdx) : 0);
  const ringBurstMs = Number.isFinite(lcForOutline.burst_ms)
    ? (lcForOutline.burst_ms as number)
    : (Number.isFinite(lc?.burst_ms) ? Number(lc!.burst_ms) : undefined);
  const ringDwellMs = Number.isFinite(lcForOutline.dwell_ms)
    ? (lcForOutline.dwell_ms as number)
    : (Number.isFinite(lc?.dwell_ms) ? Number(lc!.dwell_ms) : undefined);
  const ringTauMs = Number.isFinite(lcForOutline.tauLC_ms)
    ? (lcForOutline.tauLC_ms as number)
    : (Number.isFinite(lc?.tauLC_ms) ? Number(lc!.tauLC_ms) : undefined);
  const avgTilesSafe =
    !isStandby && Number.isFinite(serverAvgTiles) && serverAvgTiles > 0 ? Math.floor(serverAvgTiles) : computedAvgTiles;

  const activeTiles = {
    avgTiles: avgTilesSafe,
    instantTilesSmooth: isStandby ? 0 : computedInstantTiles,
    burstLocal,
  };

  const modulationGHzCommanded = isFiniteNumber(modulationFrequency) ? modulationFrequency : undefined;
  const strobeHzLive = isFiniteNumber(systemMetrics?.strobeHz) ? Number(systemMetrics!.strobeHz) : undefined;
  const strobeGHzLive = strobeHzLive != null ? strobeHzLive / 1e9 : undefined;
  const strobeDeltaPct =
    strobeGHzLive != null && modulationGHzCommanded != null && modulationGHzCommanded > 0
      ? ((strobeGHzLive - modulationGHzCommanded) / modulationGHzCommanded) * 100
      : undefined;

  const metricsLC = (systemMetrics?.lightCrossing ?? {}) as Partial<{
    tauLC_ms: number;
    tau_ms: number;
    tauLC_s: number;
    dwell_ms: number;
    burst_ms: number;
    sectorPeriod_ms: number;
  }>;
  const pipelineLC = ((pipelineState as any)?.lightCrossing ?? {}) as Partial<{
    tauLC_ms: number;
    tau_ms: number;
    tauLC_s: number;
    dwell_ms: number;
    burst_ms: number;
    sectorPeriod_ms: number;
  }>;
  const burstMsTelemetry =
    isFiniteNumber(metricsLC.burst_ms)
      ? metricsLC.burst_ms!
      : isFiniteNumber(pipelineLC.burst_ms)
      ? pipelineLC.burst_ms!
      : isFiniteNumber((lc as any)?.burst_ms)
      ? Number((lc as any).burst_ms)
      : undefined;
  const dwellMsTelemetry =
    isFiniteNumber(metricsLC.dwell_ms)
      ? metricsLC.dwell_ms!
      : isFiniteNumber(pipelineLC.dwell_ms)
      ? pipelineLC.dwell_ms!
      : isFiniteNumber(lc?.dwell_ms)
      ? Number(lc!.dwell_ms)
      : undefined;
  const tauLcMsTelemetry =
    isFiniteNumber(metricsLC.tauLC_ms)
      ? metricsLC.tauLC_ms!
      : isFiniteNumber(metricsLC.tau_ms)
      ? metricsLC.tau_ms!
      : isFiniteNumber(metricsLC.tauLC_s)
      ? metricsLC.tauLC_s! * 1000
      : isFiniteNumber(pipelineLC.tauLC_ms)
      ? pipelineLC.tauLC_ms!
      : isFiniteNumber(lc?.tauLC_ms)
      ? Number(lc!.tauLC_ms)
      : undefined;
  const sectorPeriodMsLive =
    isFiniteNumber(systemMetrics?.sectorPeriod_ms)
      ? Number(systemMetrics!.sectorPeriod_ms)
      : isFiniteNumber(metricsLC.sectorPeriod_ms)
      ? metricsLC.sectorPeriod_ms!
      : isFiniteNumber(lc?.dwell_ms)
      ? Number(lc!.dwell_ms)
      : undefined;
  const currentSectorLive = Number.isFinite(systemMetrics?.currentSector)
    ? Number(systemMetrics!.currentSector)
    : Number.isFinite(lc?.sectorIdx)
    ? Number(lc!.sectorIdx)
    : undefined;
  const sectorStrobingLive = Number.isFinite(systemMetrics?.sectorStrobing)
    ? Math.max(0, Math.floor(Number(systemMetrics!.sectorStrobing)))
    : isFiniteNumber((pipeline as any)?.sectorsConcurrent)
    ? Math.max(0, Math.floor(Number((pipeline as any).sectorsConcurrent)))
    : isFiniteNumber(pipeline?.sectorStrobing)
    ? Math.max(0, Math.floor(Number(pipeline!.sectorStrobing!)))
    : Math.max(0, Math.floor(concurrentSectors));
  const totalSectorsLive = Number.isFinite(systemMetrics?.totalSectors)
    ? Math.max(0, Math.floor(Number(systemMetrics!.totalSectors)))
    : totalSectors;
  const showLegacyModulationControls = false;

  //  RAF gating for smooth transitions
  const rafGateRef = useRef<number | null>(null);

  // ===== Green's Potential ( = G * )  live hookup =====
  const [greens, setGreens] = useState<GreensPayload | null>(() => {
    const cached = queryClient.getQueryData<GreensPayload>(["helix:pipeline:greens"]);
    return cached ?? null;
  });

  const updateGreensFromCache = useCallback(() => {
    const cached = queryClient.getQueryData<GreensPayload>(["helix:pipeline:greens"]);
    if (cached) setGreens(cached);
  }, [queryClient]);

  useEffect(() => {
    // keep in sync if something populates cache without firing an event
    const id = setInterval(updateGreensFromCache, 1500);
    return () => clearInterval(id);
  }, [updateGreensFromCache]);

  useEffect(() => {
    function onGreens(ev: Event) {
      const e = ev as CustomEvent<GreensPayload>;
      const payload = e.detail;
      if (!payload) return;
      try {
        // normalize to Float32Array for consistent stats
        const phi =
          payload.phi instanceof Float32Array ? payload.phi : new Float32Array(payload.phi || []);
        const normalizedPayload: GreensPayload = {
          ...payload,
          phi,
          size: phi.length,
        };
        queryClient.setQueryData(["helix:pipeline:greens"], normalizedPayload);
        setGreens(normalizedPayload);
      } catch {
        // no-op
      }
    }
    window.addEventListener("helix:greens", onGreens as any);
    return () => window.removeEventListener("helix:greens", onGreens as any);
  }, [queryClient]);



  // Calculate epsilonTilt and normalized beta-tilt vector (Purple shift)
  const G = 9.80665, c = SPEED_OF_LIGHT;

  const gTargets: Record<string, number> = {
    hover: 0.1 * G,
    cruise: 0.05 * G,
    emergency: 0.3 * G,
    standby: 0,
  };

  const currentMode = effectiveMode.toLowerCase();
  const gTarget = gTargets[currentMode] ?? 0;
  const R_geom = Math.cbrt(hull.a * hull.b * hull.c);

  //  (dimensionless) used by shaders + viz overlays
  const epsilonTilt = Math.min(5e-7, Math.max(0, (gTarget * R_geom) / (c * c)));

  //  direction (Purple arrow)  prefer live metrics, fallback to canonical "nose down"
  const betaTiltVecRaw = systemMetrics?.shiftVector?.betaTiltVec ?? [0, -1, 0];
  const betaNorm = Math.hypot(betaTiltVecRaw[0], betaTiltVecRaw[1], betaTiltVecRaw[2]) || 1;
  const betaTiltVecN: [number, number, number] = [
    betaTiltVecRaw[0] / betaNorm,
    betaTiltVecRaw[1] / betaNorm,
    betaTiltVecRaw[2] / betaNorm,
  ];



  // --- Derived physics uniforms for AlcubierrePanel
  const realPhys = {
    gammaGeo: pipeline?.gammaGeo ?? 26,
    q: qSpoilUI,
    gammaVdB: isStandby ? 1 : Number(pipeline?.gammaVanDenBroeck_vis ?? pipeline?.gammaVanDenBroeck ?? 1),
    dFR: dutyEffectiveFR_safe,
  };

  const expREAL = thetaScaleExpected(realPhys);
  const usedREAL = thetaScaleUsed(expREAL, {
    concurrent: 1,
    total: 400,
    dutyLocal: 0.01,
    viewFraction: 0.0025,
    viewAveraging: true,
  });

  // Defer checkpoint calls to avoid render-time state updates
  React.useEffect(() => {
    checkpoint({
      id: "-expected",
      side: "REAL",
      stage: "expect",
      pass: true,
      msg: `_expected=${expREAL.toExponential()}`,
      expect: expREAL,
    });

    checkpoint({
      id: "-used",
      side: "REAL",
      stage: "expect",
      pass: true,
      msg: `_used=${usedREAL.toExponential()}`,
      expect: usedREAL,
    });
  }, [expREAL, usedREAL]);

  const showPhys = {
    gammaGeo: pipeline?.gammaGeo ?? 26,
    qSpoilingFactor: qSpoilUI,
    gammaVanDenBroeck_vis: isStandby ? 1 : Number(pipeline?.gammaVanDenBroeck_vis ?? pipeline?.gammaVanDenBroeck ?? 1),
    dutyEffectiveFR: dutyEffectiveFR_safe,
    dutyCycle: dutyUI_safe,
    viewMassFraction: 1.0,
  }

  // DEBUG: broadcast current physics bundle every second so detached panels (AlcubierrePanel)
  // can compare what they computed from the raw pipeline vs our canonical derivation here.
  React.useEffect(() => {
    let raf: number; let lastSig = ""; let lastEmit = 0;
    const tick = () => {
      const now = performance.now();
      if (now - lastEmit > 1000) { // throttle to ~1 Hz
        const payload = { showPhys, realPhys, ts: Date.now() };
        const sig = JSON.stringify([
          showPhys.gammaGeo,
          showPhys.qSpoilingFactor,
          showPhys.gammaVanDenBroeck_vis,
          showPhys.dutyEffectiveFR,
          realPhys.gammaGeo,
          realPhys.q,
          realPhys.gammaVdB,
          realPhys.dFR
        ]);
        if (sig !== lastSig) {
          lastSig = sig; lastEmit = now;
          try { window.dispatchEvent(new CustomEvent('helix:phys:bundle', { detail: payload })); } catch {}
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showPhys, realPhys]);

  const baseShared = {
    hull:
      hullMetrics && hullMetrics.hull
        ? {
            a: Number.isFinite(hullMetrics.hull.a) ? Number(hullMetrics.hull.a) : (Number.isFinite(hullMetrics.hull.Lx_m) ? hullMetrics.hull.Lx_m / 2 : 503.5),
            b: Number.isFinite(hullMetrics.hull.b) ? Number(hullMetrics.hull.b) : (Number.isFinite(hullMetrics.hull.Ly_m) ? hullMetrics.hull.Ly_m / 2 : 132.0),
            c: Number.isFinite(hullMetrics.hull.c) ? Number(hullMetrics.hull.c) : (Number.isFinite(hullMetrics.hull.Lz_m) ? hullMetrics.hull.Lz_m / 2 : 86.5),
          }
        : {
            a: 503.5,
            b: 132.0,
            c: 86.5,
          },
    wallWidth_m: 6.0,
    driveDir: [1, 0, 0],
    vShip: 0,
    sectorCount: totalSectors,
    sectors: concurrentSectors,

    //  attach Purple shift vector + curvature knobs to BOTH renderers
    epsilonTilt,
    betaTiltVec: betaTiltVecN,
    curvatureGainDec: 0.0,
    curvatureBoostMax: 20,

    colorMode: "theta",
    lockFraming: true,
    currentMode: effectiveMode,
  } as any;


  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Send command to HELIX-CORE
  const sendCommand = React.useCallback(async () => {
    if (!commandInput.trim() || isProcessing) return;

    // Abort any previous command
    if (commandAbortRef.current) {
      commandAbortRef.current.abort();
    }
    commandAbortRef.current = new AbortController();

    const userMessage: ChatMessage = {
      role: "user",
      content: commandInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setCommandInput("");
    setIsProcessing(true);

    try {
      const response = await apiRequest(
        "POST",
        "/api/helix/command",
        {
          messages: chatMessages.map((msg) => ({ role: msg.role, content: msg.content })).concat([{ role: "user" as const, content: commandInput }]),
        },
        commandAbortRef.current.signal
      );

      const responseData = await response.json();

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: responseData.message.content,
        timestamp: new Date(),
      };

      if (responseData.functionResult) {
        assistantMessage.functionCall = {
          name: responseData.message.function_call.name,
          result: responseData.functionResult,
        };

        // Log function calls
        setMainframeLog((prev) =>
          [
            ...prev,
            (() => {
              let args = responseData.message.function_call.arguments;
              try {
                args = JSON.stringify(JSON.parse(args));
              } catch {
                /* already a string or malformed */
              }
              return `[FUNCTION] ${responseData.message.function_call.name}(${args})`;
            })(),
            `[RESULT] ${JSON.stringify(responseData.functionResult)}`,
          ].slice(-200)
        );

        // Refresh metrics if a pulse was executed
        if (responseData.message.function_call.name === "pulse_sector") {
          refetchMetrics();
        }
      }

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Command Error",
        description: error instanceof Error ? error.message : "Failed to process command",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandInput, isProcessing, chatMessages, refetchMetrics]);

  // Physics-timed sector sweep for UI animation
  useEffect(() => {
    if (!systemMetrics && !Number.isFinite(lc?.sectorIdx)) return;

    const total = totalSectors; // e.g., 400
    const live = Math.max(1, Math.min(total, Math.floor(concurrentSectors ?? 1))); // Safe clamp
    const baseIdxSrc = Number.isFinite(systemMetrics?.currentSector)
      ? Number(systemMetrics!.currentSector)
      : Number(lc?.sectorIdx ?? 0); // fallback to physics loop
    const base = Math.max(0, Math.floor(baseIdxSrc)) % total;

    setTrail((prev) => {
      // decay
      const next = (prev.length === total ? prev : Array(total).fill(0)).map((v) => Math.max(0, v * 0.9));
      // energize `live` consecutive sectors
      for (let k = 0; k < live; k++) next[(base + k) % total] = 1;
      return next;
    });
  }, [totalSectors, concurrentSectors, systemMetrics?.currentSector, systemMetrics?.sectorStrobing, lc?.sectorIdx]);

  // Sync 3D engine with strobing state (defensive + sanitized)
  useEffect(() => {
    const total = Number.isFinite(totalSectors) ? Math.max(1, Math.floor(totalSectors)) : undefined;
    const cs = Number.isFinite(systemMetrics?.currentSector)
      ? Number(systemMetrics!.currentSector)
      : Number(lc?.sectorIdx ?? NaN);
    const fn = (window as any).setStrobingState;

    if (!total || !Number.isFinite(cs)) return;
    if (typeof fn !== "function") return;

    try {
      const cur = Math.max(0, Math.floor(cs)) % total;
      const splitPayload = effectiveMode === "nearzero" ? 0.5 : cur;
      fn({ sectorCount: total, currentSector: cur, split: splitPayload });
    } catch (err) {
      console.warn("setStrobingState threw; skipped this tick:", err);
    }
  }, [totalSectors, systemMetrics?.currentSector, lc?.sectorIdx, effectiveMode]);

  // Color mapper (blueactive; red if  breach)
  const sectorColor = React.useCallback(
    (i: number) => {
      const fordRomanValue = systemMetrics?.fordRoman?.value ?? 0.0;
      const limitBreach = fordRomanValue >= 1.0;
      const v = trail[i] ?? 0;
      if (limitBreach) {
        return `rgba(239, 68, 68, ${0.2 + 0.8 * v})`; // red
      }
      return `rgba(34, 197, 94, ${0.2 + 0.8 * v})`; // green
    },
    [systemMetrics?.fordRoman?.value, trail]
  );

  // Handle tile click
  const handleTileClick = React.useCallback(
    async (sectorId: string) => {
      setSelectedSector(sectorId);
      const sectorIndex = parseInt(sectorId.replace("S", "")) - 1;

      setMainframeLog((prev) =>
        [...prev, `[TILE] Selected ${sectorId}`, `[DATA] Sector Index: ${sectorIndex}, Fade: ${trail[sectorIndex]?.toFixed(3) || "0.000"}`].slice(-200)
      );

      // In manual mode, pulse the sector
      if (activeMode === "manual") {
        setIsProcessing(true);
        try {
          const command = `Pulse sector ${sectorId} with 1 nm gap`;
          const userMessage: ChatMessage = {
            role: "user",
            content: command,
            timestamp: new Date(),
          };
          setChatMessages((prev) => [...prev, userMessage]);

          // Abort any previous command
          if (commandAbortRef.current) {
            commandAbortRef.current.abort();
          }
          commandAbortRef.current = new AbortController();

          const response = await apiRequest(
            "POST",
            "/api/helix/command",
            {
              messages: chatMessages.concat({ role: "user", content: command }),
            },
            commandAbortRef.current.signal
          );

          const responseData = await response.json();
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: responseData.message.content,
            timestamp: new Date(),
          };

          if (responseData.functionResult) {
            assistantMessage.functionCall = {
              name: responseData.message.function_call.name,
              result: responseData.functionResult,
            };
            setMainframeLog((prev) => [...prev, `[MANUAL] ${sectorId} pulsed: Energy=${responseData.functionResult.energy?.toExponential(2)} J`].slice(-200));
            refetchMetrics();
          }

          setChatMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
          toast({
            title: "Manual Pulse Error",
            description: error instanceof Error ? error.message : "Failed to pulse sector",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [activeMode, chatMessages, refetchMetrics, trail]
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 relative z-10">
        {devMockStatus.used && (
          <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
            <div className="select-none text-center">
              <div className="text-5xl md:text-8xl font-black tracking-[0.35em] uppercase text-rose-500/15 rotate-[-18deg] drop-shadow-[0_0_25px_rgba(248,113,113,0.25)]">
                MOCKED
              </div>
              {devMockStatus.last && (
                <div className="mt-2 text-[11px] md:text-xs font-semibold uppercase tracking-wide text-rose-200/70">
                  {devMockStatus.last.method} {devMockStatus.last.url} (#{devMockStatus.count})
                  {devMockStatus.last.reason ? ` - ${devMockStatus.last.reason}` : ""}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="container mx-auto p-4 text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <HelixMarkIcon className="w-8 h-8 text-cyan-400" strokeWidth={36} />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">HELIX-CORE</h1>
                <p className="text-sm text-slate-400">Needle Hull Mainframe System</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                asChild
                variant="outline"
                size="icon"
                className="border-[#22d3ee] bg-slate-950 text-[#22d3ee] hover:bg-[#22d3ee]/10"
              >
                <a
                  href="https://github.com/pestypig/casimirbot-"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open CasimirBot GitHub repository"
                >
                  <img src={githubLogo} alt="" className="h-5 w-5" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="icon"
                className="border-[#22d3ee] bg-slate-950 text-[#22d3ee] hover:bg-[#22d3ee]/10"
              >
                <a
                  href="https://chatgpt.com/g/g-68e7078db5948191b77f265d4e25eacf-needle-hull-mk-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Needle Hull MK-1 Custom GPT"
                >
                  <img src={openAiLogo} alt="" className="h-5 w-5" />
                </a>
              </Button>
              <Link href="/why">
                <Badge
                  variant="outline"
                  className="cursor-pointer border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  Why
                </Badge>
              </Link>
              <Link href="/bridge">
                <Button variant="outline" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Bridge
                </Button>
              </Link>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-cyan-500 text-cyan-200 hover:bg-cyan-500/10"
              >
                <a href={`#${PANEL_HASHES.speedCapability}`}>Speed Capability</a>
              </Button>
            </div>
          </div>

          {/* === Quick Operational Mode Switch (global) === */}
          <div id={PANEL_HASHES.quickMode} data-panel-hash={PANEL_HASHES.quickMode} className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {([
                { key: "standby", label: "Standby", hint: "Field idle" },
                { key: "hover", label: "Hover", hint: "Gentle bulge" },
                { key: "nearzero", label: "Near-Zero", hint: "Zero-beta hover-climb" },
                { key: "cruise", label: "Cruise", hint: "Coherent 400-sector sweep" },
                { key: "emergency", label: "Emergency", hint: "Max response" },
              ] as const).map((m) => {
                const isActive = effectiveMode === m.key;
                return (
                  <Button
                    key={m.key}
                    variant={isActive ? "default" : "outline"}
                    className={`font-mono ${isActive ? "bg-cyan-600 text-white" : "bg-slate-900"}`}
                    onClick={() => {
                      if (!isActive) {
                        startTransition(() => {
                          setOptimisticMode(m.key as ModeKey);
                          setModeNonce((n) => n + 1);
                          switchMode.mutate(m.key as any, {
                            onSuccess: () => {
                              // make both sides refresh
                              queryClient.invalidateQueries({
                                predicate: (q) =>
                                  Array.isArray(q.queryKey) &&
                                  (q.queryKey[0] === "/api/helix/pipeline" || q.queryKey[0] === "/api/helix/metrics"),
                              });
                            },
                          });
                        });
                        refetchMetrics();
                        setMainframeLog((prev) => [...prev, `[MODE] Quick switch -> ${m.key}`]);
                        if (m.key === "nearzero") {
                          console.info("[HELIX] Quick switch requested Near-Zero mode");
                        }
                      }
                    }}
                  >
                    {m.label}
                    <span className="ml-2 text-xs opacity-70">{m.hint}</span>
                  </Button>
                );
              })}
            </div>
          </div>
          <VacuumContractBadge contract={vacuumContract} className="mb-4" />

          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2 lg:col-span-2 xl:col-span-2">
              {/* Alcubierre Viewer (single engine; toggle view between york|bubble) */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Alcubierre Metric Viewer</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="auto-apply-preview"
                      checked={autoApplyPreview}
                      onCheckedChange={setAutoApplyPreview}
                    />
                    <Label htmlFor="auto-apply-preview" className="text-xs text-slate-200">
                      Auto-apply GLB preview
                    </Label>
                  </div>
                  <Select
                    value={autoApplyFallbackMode}
                    onValueChange={(value) => setAutoApplyFallbackMode(value as WarpFallbackMode)}
                  >
                    <SelectTrigger className="w-[150px] border-slate-700 bg-slate-900/70 text-slate-100">
                      <SelectValue placeholder="Fallback mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 text-slate-100">
                      <SelectItem value="warn">Fallback: warn</SelectItem>
                      <SelectItem value="allow">Fallback: allow</SelectItem>
                      <SelectItem value="block">Fallback: block</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div ref={alcubierreRef} className="relative">
                <AlcubierrePanel
                  onCanvasReady={(canvas, overlay, overlayDom) => {
                    setTimeLapseCanvas(canvas ?? null);
                    setTimeLapseOverlayCanvas(overlay ?? null);
                    setTimeLapseOverlayDom(overlayDom ?? null);
                  }}
                  overlayHudEnabled={showSweepHud}
                  onPlanarVizModeChange={handlePlanarVizModeChange}
                  vizIntent={vizIntent}
                />
                <CardProofOverlay
                  pipeline={pipeline}
                  className="pointer-events-auto absolute left-4 top-4 z-10 max-w-sm"
                />
                {showSweepHud && (
                  <CollapseBenchmarkHUD
                    pipeline={pipeline}
                    className="pointer-events-auto absolute left-4 top-44 z-10 max-w-sm"
                  />
                )}
                {(timeLapseRecorder.isRecording || timeLapseRecorder.isProcessing) && (
                  <div className="pointer-events-none absolute top-4 right-4 max-w-xs rounded-md border border-cyan-500/40 bg-slate-950/80 px-3 py-2 shadow-lg">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                      {timeLapseRecorder.currentFrame?.segment ?? "Time-Lapse"}
                    </div>
                    <div className="mt-1 whitespace-pre-line font-mono text-[11px] leading-tight text-slate-200">
                      {(timeLapseRecorder.currentFrame?.overlayText ?? "Preparing telemetry...")
                        .split(" | ")
                        .join("\n")}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">
                      {timeLapseRecorder.isProcessing
                        ? "Finalizing video…"
                        : `Capturing ${Math.round(timeLapseRecorder.progress * 100)}%`}
                    </div>
                  </div>
                )}
                {timeLapseRecorder.status === "error" && timeLapseRecorder.error && (
                  <div className="pointer-events-none absolute top-4 right-4 max-w-xs rounded-md border border-rose-500/40 bg-slate-950/80 px-3 py-2 text-[11px] text-rose-200">
                    {timeLapseRecorder.error}
                  </div>
                )}
              </div>
            </div>
            <PhoenixNeedlePanel />
            <WarpProofPanel />
            <div id={PANEL_HASHES.hullCards}>
              <HelixHullCardsPanel pipeline={pipeline} />
            </div>
            <SpeedCapabilityPanel panelHash={PANEL_HASHES.speedCapability} />
          </div>

          <Card className="mt-4 border border-slate-800 bg-slate-900/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Direction Pad</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Guide the hull visualization off-axis with rise and planar intents.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <DirectionPad className="w-full" onVizIntent={handleDirectionPadIntent} />
            </CardContent>
          </Card>

          <Card className="mt-4 border border-slate-800 bg-slate-900/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Solar System Navigation</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Visualize nav pose on the layered spacetime grid with belts and planets.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <NavPageSection />
            </CardContent>
          </Card>

          <div className="mb-4 space-y-3">
            <div
              id={PANEL_HASHES.fractionalRail}
              data-panel-hash={PANEL_HASHES.fractionalRail}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
            >
              <FractionalCoherenceRail state={fractional} compact />
            </div>
            <div id={PANEL_HASHES.fractionalGrid} data-panel-hash={PANEL_HASHES.fractionalGrid}>
              <FractionalCoherenceGrid
                state={fractional}
                onSendToPump={handleFractionalPump}
              />
            </div>
          </div>
          <NearZeroWidget
            className="mb-6"
            mode={effectiveMode}
            env={systemMetrics?.env}
            guards={nearZeroGuards}
            thermal={nearZeroThermal}
            frDuty={frDutyForPanels}
            QL={isFiniteNumber(pipeline?.qCavity) ? pipeline!.qCavity! : undefined}
            burst={nearZeroBurst}
            tauLC_s={tauLCSeconds}
            sectorsTotal={totalSectors}
            onAction={handleNearZeroAction}
          />

          {/* ====== SHELL OUTLINE VIEWER (wireframe surfaces) ====== */}
          <Card
            id={PANEL_HASHES.warpShell}
            data-panel-hash={PANEL_HASHES.warpShell}
            className="bg-slate-900/50 border-slate-800 mb-4"
          >
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Warp Bubble  Shell Outline (=1)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <div className="font-medium text-yellow-300 mb-1"> Theory</div>
                    <p className="mb-2">
                      Three -surfaces (inner/center/outer) bound the wall thickness set by the Natrio bell. Inner curves skew
                      toward compression (orange), outer toward expansion (blue). Violet denotes interior tilt direction.
                    </p>
                    <div className="font-medium text-cyan-300 mb-1"> Zen</div>
                    <p className="text-xs italic">Contours show where space would leanenough to guide, never to tear.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>Wireframe of inner/center/outer Natrio wall (ellipsoidal), with interior shift vector.</CardDescription>
            </CardHeader>
            <CardContent>
              <ShellOutlineVisualizer
                debugTag="HelixCore/ShellOutlineVisualizer"
                parameters={{
                  hull:
                    hullMetrics && hullMetrics.hull
                      ? {
                          a: Number.isFinite(hullMetrics.hull.a) ? hullMetrics.hull.a : (Number.isFinite(hullMetrics.hull.Lx_m) ? hullMetrics.hull.Lx_m / 2 : 0.42),
                          b: Number.isFinite(hullMetrics.hull.b) ? hullMetrics.hull.b : (Number.isFinite(hullMetrics.hull.Ly_m) ? hullMetrics.hull.Ly_m / 2 : 0.11),
                          c: Number.isFinite(hullMetrics.hull.c) ? hullMetrics.hull.c : (Number.isFinite(hullMetrics.hull.Lz_m) ? hullMetrics.hull.Lz_m / 2 : 0.09),
                        }
                      : {
                          a: 0.42,
                          b: 0.11,
                          c: 0.09, // normalized scene units
                        },
                  wallWidth: 0.06,
                  epsilonTilt: systemMetrics?.shiftVector?.epsilonTilt ?? epsilonTilt,
                  betaTiltVec: systemMetrics?.shiftVector?.betaTiltVec ?? [0, -1, 0],
                  // Mode coupling from live pipeline data
                  mode: effectiveMode,
                  dutyCycle: dutyUI_safe,
                  sectors: totalSectors,
                  sectorCount: totalSectors,
                  gammaGeo: pipeline?.gammaGeo ?? 26,
                  qSpoil: qSpoilUI,
                  qCavity: pipeline?.qCavity ?? 1e9,
                  //  NEW: mechanical chain
                  qMechanical: pipeline?.qMechanical ?? 1,
                  modulationHz: (pipeline?.modulationFreq_GHz ?? 15) * 1e9,
                  mech: {
                    mechResonance_Hz: undefined, // default = modulation (centered)
                    mechZeta: undefined, // infer from qMechanical if omitted
                    mechCoupling: 0.65, // tweak visual strength 0..1
                  },
                  //  Ford-Roman window + light-crossing data
                  dutyEffectiveFR: (Number.isFinite(frDutyForPanels as any) ? clamp01(frDutyForPanels as number) : 0),
                  lightCrossing: {
                    tauLC_ms: Number.isFinite((lcForOutline as any)?.tauLC_ms) ? Number((lcForOutline as any).tauLC_ms) : undefined,
                    dwell_ms: Number.isFinite((lcForOutline as any)?.dwell_ms) ? Number((lcForOutline as any).dwell_ms) : undefined,
                    burst_ms: Number.isFinite((lcForOutline as any)?.burst_ms) ? Number((lcForOutline as any).burst_ms) : undefined,
                  },
                  zeta: pipeline?.zeta,
                }}
              />

              {/* Mechanical Physics HUD */}
              {(() => {
                const qMech = pipeline?.qMechanical ?? 1;
                const zeta = 1 / (2 * qMech);
                const f_mod = (pipeline?.modulationFreq_GHz ?? 15) * 1e9;
                const f0 = f_mod;
                const omega = f_mod / f0;
                const denomSq = (1 - omega * omega) ** 2 + (2 * zeta * omega) ** 2;
                const Arel = 1 / Math.sqrt(denomSq);

                return (
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-300 font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700">Q_mech = {qMech.toFixed(3)}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700">  {zeta.toExponential(2)}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700">f = {(f0 / 1e9).toFixed(2)} GHz</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700">A_rel = {Arel.toFixed(2)}</span>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* ====== Light Speed vs Strobing Scale ====== */}
          <Card
            id={PANEL_HASHES.lightSpeed}
            data-panel-hash={PANEL_HASHES.lightSpeed}
            className="bg-slate-900/50 border-slate-800 mb-4"
          >
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                c vs Strobing Timeline
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <div className="font-medium text-yellow-300 mb-1">Theory</div>
                    <p className="mb-2">
                      The sweep rate across sectors is chosen so no disturbance outruns the grid's tauLC. This timeline compares
                      modulation (Hz), sector period, and light-crossing to ensure the average shell stays GR-valid.
                    </p>
                    <div className="font-medium text-cyan-300 mb-1">Zen</div>
                    <p className="text-xs italic">Go slowly enough to remain whole; move steadily enough to arrive.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>Visual comparison of light-crossing time vs modulation frequencies and sector dwell times.</CardDescription>
            </CardHeader>
            <CardContent>
              <LightSpeedStrobeScale
                dwellMs={Number.isFinite(lc.dwell_ms) ? lc.dwell_ms : 0}
                tauLcMs={Number.isFinite(lc.tauLC_ms) ? lc.tauLC_ms : 0}
                sectorIdx={lc.sectorIdx}
                sectorCount={lc.sectorCount}
                phase={lc.phase}
                burstMs={Number.isFinite(lc.burst_ms) ? lc.burst_ms : 0}
              />
            </CardContent>
          </Card>

          {/* ====== Time-Lapse Demo ====== */}
          <Card
            id={PANEL_HASHES.timeLapse}
            data-panel-hash={PANEL_HASHES.timeLapse}
            className="bg-slate-900/50 border-slate-800 mb-4"
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-cyan-400" />
                Time-Lapse Demo
              </CardTitle>
              <CardDescription>
                Capture a scripted 10&nbsp;s pass of the current warp bubble view at 30&nbsp;fps (saves as WebM/MP4 depending on browser support).
                The script walks the hull through three segments (stable &rarr; edge push &rarr; recovery) with curvature overlay enabled; during the edge push
                the drive amps the field, the solver flags large positive/negative residuals, and those spikes show up as cyan/yellow over the underlying
                I<sub>GR</sub> oranges and blues&mdash;letting you see expansion and contraction zones light up in real time.
              </CardDescription>
            </CardHeader>
            <CardContent className={timeLapseUnlocked ? "space-y-4" : "space-y-4 py-6"}>
              {!hasSweepTelemetry && (
                <div className="flex items-start gap-3 rounded border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100">
                  <Gauge className="mt-0.5 h-4 w-4 text-cyan-300" />
                  <div className="space-y-1">
                    <p className="font-semibold text-cyan-200">Run Sweep (HW Slew) before capturing.</p>
                    <p className="text-slate-200">
                      Kick off the vacuum-gap sweep to seed the SWEEP HUD telemetry that the time-lapse capture overlays frame by frame.
                    </p>
                  </div>
                </div>
              )}
              {timeLapseUnlocked ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant={
                        timeLapseRecorder.isRecording
                          ? "destructive"
                          : timeLapseRecorder.isProcessing
                            ? "default"
                            : "secondary"
                      }
                      onClick={() => {
                        if (!timeLapseRecorder.isRecording && sweepButtonsLocked) return;
                        if (timeLapseRecorder.isRecording) {
                          void timeLapseRecorder.stop();
                        } else if (!timeLapseRecorder.isProcessing) {
                          void timeLapseRecorder.start();
                        }
                      }}
                      className="flex items-center gap-2 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 disabled:shadow-none"
                      disabled={startTimeLapseDisabled}
                    >
                      <Video className="w-4 h-4" />
                      {timeLapseRecorder.isRecording
                        ? "Stop capture"
                        : timeLapseRecorder.isProcessing
                          ? "Finalizing video..."
                          : "Start capture"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleDriveCardPreset}
                      className="flex items-center gap-2"
                    >
                      <Gauge className="w-4 h-4" />
                      Drive Card Preset
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportCard}
                      disabled={isExportingCard || !timeLapseCanvas || timeLapseRecorder.isProcessing}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isExportingCard ? "Exporting..." : "Export Card (PNG + JSON)"}
                    </Button>
                    <Button
                      variant={showSweepHud ? "default" : "outline"}
                      onClick={() => {
                        if (sweepButtonsLocked) return;
                        setShowSweepHud((prev) => !prev);
                      }}
                      className="flex items-center gap-2 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 disabled:shadow-none"
                      aria-pressed={showSweepHud}
                      disabled={sweepButtonsLocked}
                    >
                      <Layers className="w-4 h-4" />
                      {showSweepHud ? "SWEEP HUD On" : "SWEEP HUD"}
                    </Button>
                    <div className="text-xs text-slate-400 basis-full">
                      Opens the viewer, scripts the baseline sweep, and records frames plus metrics; use Export Card to save the current canvas + overlay as a PNG with a JSON sidecar.
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <Switch
                      id="attach-sweep-sidecar"
                      checked={includeSweepSidecar}
                      onCheckedChange={setIncludeSweepSidecar}
                      disabled={timeLapseRecorder.isRecording || timeLapseRecorder.isProcessing}
                    />
                    <Label htmlFor="attach-sweep-sidecar" className="text-xs text-slate-300">
                      Attach sweep sidecar
                    </Label>
                    <span className="text-slate-500">
                      Include sweep telemetry with the metrics download
                    </span>
                  </div>

                  {(timeLapseRecorder.isRecording ||
                    timeLapseRecorder.isProcessing ||
                    timeLapseRecorder.status === "error") && (
                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span>
                          {timeLapseRecorder.status === "recording"
                            ? "Capturing sequence"
                            : timeLapseRecorder.status === "processing"
                              ? "Finalizing video..."
                              : "Time-lapse unavailable"}
                        </span>
                        <span>{Math.round(timeLapseRecorder.progress * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded bg-slate-800">
                        <div
                          className="h-full bg-cyan-400 transition-all duration-200"
                          style={{ width: `${Math.round(timeLapseRecorder.progress * 100)}%` }}
                        />
                      </div>
                      {timeLapseRecorder.error ? (
                        <div className="text-rose-400">{timeLapseRecorder.error}</div>
                      ) : null}
                    </div>
                  )}

                  {timeLapseRecorder.result &&
                    (() => {
                      const result = timeLapseRecorder.result;
                      const downloadLabel = result.videoMimeType.includes("mp4") ? "Download MP4" : "Download WebM";
                      return (
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                          <span>
                            Complete: {result.frameCount} frames @ {result.fps} fps ({(result.durationMs / 1000).toFixed(1)}&nbsp;s)
                          </span>
                          <Button asChild size="sm" variant="outline">
                            <a href={result.videoUrl} download={result.videoFileName}>
                              {downloadLabel}
                            </a>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <a href={result.metricsUrl} download="helix-time-lapse-metrics.json">
                              Metrics JSON
                            </a>
                          </Button>
                        </div>
                      );
                    })()}
                </>
              ) : (
                <div className="flex items-start gap-3 rounded border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-300">
                  <Video className="mt-0.5 h-4 w-4 text-cyan-400" />
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-200">Time-lapse capture is available in {"\u03B8"} (Hull 3D) mode.</p>
                    <p className="text-slate-400">
                      Switch the metric viewer above to {"\u03B8"} (Hull 3D) and run <span className="text-slate-200 font-semibold">Run Sweep (HW Slew)</span> in the
                      Vacuum-Gap panel before starting the scripted capture so the SWEEP HUD feeds real telemetry during the demo.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ====== Cycle-Averaged Drive Budget ====== */}
          <div
            id={PANEL_HASHES.driveGuards}
            data-panel-hash={PANEL_HASHES.driveGuards}
            className="mb-4"
          >
            <DriveGuardsPanel panelHash={PANEL_HASHES.driveGuards} />
          </div>

          {/* ====== OPERATIONAL MODES / ENERGY CONTROL (below hero) ====== */}
          <Card
            id={PANEL_HASHES.energyControl}
            data-panel-hash={PANEL_HASHES.energyControl}
            className="bg-slate-900/50 border-slate-800 mb-4"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-yellow-400" />
                {MAINFRAME_ZONES.ENERGY_PANEL}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <div className="font-medium text-yellow-300 mb-1"> Theory</div>
                    <p className="mb-2">
                      Core operational mode controls power output, exotic matter generation, and sector strobing patterns. Each mode
                      balances performance with Ford-Roman compliance and energy efficiency.
                    </p>
                    <div className="font-medium text-cyan-300 mb-1"> Zen</div>
                    <p className="text-xs italic">Power serves purpose. Choose the mode that serves the moment.</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
              <CardDescription>Live mode switch + power, mass & status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Operational Mode Selector */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-slate-200">Operational Mode</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-sm">
                        <div className="font-medium text-yellow-300 mb-1"> Theory</div>
                        <p className="mb-2">
                          Each mode represents a different balance of power output, sector strobing frequency, and exotic matter
                          requirements based on mission requirements.
                        </p>
                        <div className="font-medium text-cyan-300 mb-1"> Zen</div>
                        <p className="text-xs italic">The wise captain chooses not the fastest path, but the path that arrives intact.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select
                    value={pipeline?.currentMode || "hover"}
                    onValueChange={(mode) => {
                      startTransition(() => {
                        setOptimisticMode(mode as ModeKey);
                        setModeNonce((n) => n + 1);
                        switchMode.mutate(mode as any, {
                          onSuccess: () => {
                            queryClient.invalidateQueries({
                              predicate: (q) =>
                                Array.isArray(q.queryKey) &&
                                (q.queryKey[0] === "/api/helix/pipeline" || q.queryKey[0] === "/api/helix/metrics"),
                            });
                          },
                        });
                      });
                      setMainframeLog((prev) => [
                        ...prev,
                        `[MODE] Switching to ${mode} (duty=${(MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS].dutyCycle * 100).toFixed(
                          1
                        )}%, live=${MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS].sectorsConcurrent})...`,
                      ]);
                    }}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-700">
                      <SelectValue placeholder="Select mode">
                        {(() => {
                          const currentModeKey: ModeKey = (pipeline?.currentMode as ModeKey) || "hover";
                          const currentCfg = MODE_CONFIGS[currentModeKey];
                          const currentSnap = {
                            P_avg_MW: pipeline?.P_avg,
                            M_exotic_kg: pipeline?.M_exotic,
                            zeta: pipeline?.zeta,
                          };
                          const currentTitle = buildLiveDesc(currentSnap, currentCfg, undefined);
                          return (
                            <div className="flex flex-col">
                              <span className="font-medium">{currentCfg?.name ?? currentModeKey}</span>
                              <span className="text-xs text-muted-foreground">{currentTitle}</span>
                            </div>
                          );
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {buildModeSelectItems(pipeline).map(({ key, cfg, snap }) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span className={`font-medium ${cfg.color}`}>{cfg?.name ?? key}</span>
                            <span className="text-xs text-muted-foreground">{buildLiveDesc(snap, cfg, undefined)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pipeline && pipeline.currentMode && <p className="text-xs text-slate-400">{MODE_CONFIGS[pipeline.currentMode as ModeKey]?.description}</p>}                                                            
                </div>

                {/* Active Tiles Panel with helper strings */}
                {(() => {
                  const frPctLabel = Number.isFinite(dutyEffectiveFR_safe) ? ` (${(dutyEffectiveFR_safe * 100).toFixed(3)}%)` : "";
                  const localOnLabel = Number.isFinite(activeTiles?.burstLocal) ? `${(activeTiles.burstLocal * 100).toFixed(2)}%` : "";

                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-950 rounded-lg">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-slate-400">Active Tiles (Energized)</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <div className="font-medium text-yellow-300 mb-1"> Basis</div>
                              <p className="mb-2">
                                <strong>FR-avg</strong> uses ship-wide FordRoman duty across {totalSectors} sectors;{" "}
                                <strong>Instant</strong> shows tiles energized in the current live sector window (
                                {Math.max(1, Math.floor(concurrentSectors))} / {totalSectors}, local ON {localOnLabel}).
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {/* FR-averaged count */}
                        <p className="text-lg font-mono text-cyan-400">
                          {Number.isFinite(activeTiles?.avgTiles) ? Math.round(activeTiles!.avgTiles!).toLocaleString() : "2,800,000"}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-2 text-xs text-slate-400 underline decoration-dotted cursor-help">FR-avg{frPctLabel}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">Ship-averaged (FordRoman) duty used by the energy pipeline.</TooltipContent>
                          </Tooltip>
                        </p>

                        {/* Instantaneous energized tiles */}
                        <p className="text-sm font-mono text-emerald-400 mt-1">
                          {Number.isFinite(activeTiles?.instantTilesSmooth) ? Math.round(activeTiles!.instantTilesSmooth!).toLocaleString() : ""}
                          <span className="ml-2 text-xs text-slate-400">instant</span>
                        </p>

                        <p className="text-xs text-slate-500">
                          {`${Math.max(1, Math.floor(concurrentSectors))} live  ${totalSectors} total  ${localOnLabel} local ON`}
                        </p>
                      </div>

                      {/* Energy Output */}
                      <div className="p-3 bg-slate-950 rounded-lg">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-slate-400">Energy Output</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="font-medium text-yellow-300 mb-1"> Theory</div>
                              <p className="mb-2">Average electrical power (ship-wide) from pipeline FR duty.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-lg font-mono text-yellow-400">{fmtPowerUnit(pipeline?.P_avg ?? systemMetrics?.energyOutput)}</p>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-950 rounded-lg">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-400">Exotic Mass</p>     
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm">
                          <div className="font-medium text-yellow-300 mb-1"> Theory</div>
                          <p className="mb-2">
                            Negative energy density required to curve spacetime according to the Alcubierre metric. Lower values
                            indicate more feasible warp drives.
                          </p>
                          <div className="font-medium text-cyan-300 mb-1"> Zen</div>
                          <p className="text-xs italic">The mountain that appears impossible to move requires only the gentlest persistent pressure.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-mono text-purple-400">{fmt(pipeline?.M_exotic ?? systemMetrics?.exoticMass, 0, "1405")} kg</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg">
                    <p className="text-xs text-slate-400">System Status</p>     
                    <p className="text-lg font-mono text-green-400">{pipeline?.overallStatus || systemMetrics?.overallStatus || "NOMINAL"}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/60">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">Manual power fill (advanced)</div>
                      <div className="text-[11px] text-slate-400">
                        Scales the calibrated power target. Uses nominal P_target for beta_trans_power clamps.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Manual</span>
                      <Switch checked={manualPowerOpen} onCheckedChange={setManualPowerOpen} />
                    </div>
                  </div>
                  {manualPowerOpen && (
                    <div className="mt-3 space-y-2">
                      <Slider
                        value={[powerFillLocal]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={(vals) => handlePowerFillChange(vals?.[0] ?? 0)}
                        aria-label="Power fill command"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
                        <span>
                          powerFillCmd <span className="font-mono text-slate-200">{(powerFillLocal * 100).toFixed(1)}%</span>
                        </span>
                        <span className="font-mono text-slate-200">
                          target={fmtPowerUnitFromW(P_target_cmd_display_W)} (nominal {fmtPowerUnitFromW(P_target_nominal_W)})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Use in raw/manual power only (modelMode={modelModeLabel}); calibrated modes still report fill vs nominal detent.
                      </div>
                    </div>
                  )}
                </div>

                {/* Show current pipeline parameters */}
                {pipeline && (
                  <div className="p-3 bg-slate-950 rounded-lg text-xs font-mono">
                    <p className="text-slate-400 mb-1">Pipeline Parameters:</p>
                    <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                      <div>Duty (UI): {fmt(dutyUI_safe * 100, 1, "0")}%</div>
                      <div>Duty (FR): {fmt(dutyEffectiveFR_safe * 100, 3, "0.0025")}%</div>
                      <div>
                        Sectors: {fint(totalSectors, "0")} ({fint(concurrentSectors, "0")} live)
                      </div>
                      <div>Q-Spoil: {fmt(qSpoilUI, 3, "1.000")}</div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted">
                            <sub>VdB</sub>:{" "}
                            {fexp(
                              (pipelineState as any)?.gammaVanDenBroeck_vis ??
                                pipeline?.gammaVanDenBroeck_vis ??
                                (pipelineState as any)?.gammaVanDenBroeck ??
                                pipeline?.gammaVanDenBroeck,
                              1,
                              "1.00e+11"
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm">
                          <div className="space-y-1">
                            <div className="font-semibold">
                              <sub>VdB</sub> (Van den Broeck pocket amplification)
                            </div>
                            <p>
                              From Alcubierre's metric modified by Van den Broeck  the "folded pocket" lets a meter-scale cabin sit
                              inside a kilometer-scale effective bubble without paying the bubble's full energy cost.
                            </p>
                            <p className="opacity-80">
                              This is a geometry selection, not an operational setting. It doesn't vary with duty cycle or strobing
                              sectors.
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}

                {showLegacyModulationControls && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="modulation" className="text-slate-200">
                          Modulation Frequency
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-sm">
                            <div className="font-medium text-yellow-300 mb-1"> Theory</div>
                            <p className="mb-2">
                              The fundamental frequency at which Casimir tiles oscillate. Higher frequencies increase power output but
                              require more precise timing control.
                            </p>
                            <div className="font-medium text-cyan-300 mb-1"> Zen</div>
                            <p className="text-xs italic">Resonance is not about powerit's about timing.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex min-w-[10rem] flex-1 items-center gap-2">
                          <Input
                            id="modulation"
                            type="number"
                            value={modulationFrequency}
                            onChange={(e) => setModulationFrequency(Number(e.target.value))}
                            className="bg-slate-950 border-slate-700 text-slate-100 flex-1"
                          />
                          <span className="flex items-center text-sm text-slate-400">GHz</span>
                        </div>
                        <Button
                          variant="outline"
                          className="text-xs"
                          onClick={openParametricSweepStub}
                          disabled
                          aria-disabled
                          title="Gap x Phase x Omega sweep launcher (coming soon)"
                        >
                          GapPhase sweep
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="pump-phase-bias" className="text-slate-200">
                          Pump phase bias
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-slate-400 hover:text-cyan-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-sm">
                            <p className="text-xs">
                              Applies a constant offset before scheduler-followed phases are published to the drive.
                            </p>
                            <p className="text-xs text-slate-300">
                              Useful for +/-10 deg dithers during pump alignment and stored locally per browser.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          id="pump-phase-bias"
                          type="number"
                          min={-10}
                          max={10}
                          step={0.1}
                          value={pumpPhaseBiasDeg}
                          onChange={(e) => setPumpPhaseBiasDeg(clampPhaseBiasDeg(Number(e.target.value)))}
                          className="bg-slate-950 border-slate-700 text-slate-100 w-28"
                        />
                        <span className="flex items-center text-sm text-slate-400">deg</span>
                      </div>
                      <p className="text-xs text-slate-500">Clamped to +/-10 deg and persisted locally.</p>
                    </div>
                  </>
                )}

                <div className="rounded-lg border border-slate-800/60 bg-slate-950 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Commanded Modulation</p>
                      <p className="font-mono text-sm text-slate-100">
                        {modulationGHzCommanded != null ? `${modulationGHzCommanded.toFixed(3)} GHz` : "n/a"}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Measured Sweep</p>
                      <p className="font-mono text-sm text-cyan-300">
                        {strobeGHzLive != null ? `${strobeGHzLive.toFixed(6)} GHz` : "n/a"}
                      </p>
                      {strobeDeltaPct != null && (
                        <p className={`text-[10px] ${Math.abs(strobeDeltaPct) < 0.05 ? "text-emerald-400" : "text-amber-400"}`}>
                          {"\u0394"} {strobeDeltaPct >= 0 ? "+" : ""}
                          {strobeDeltaPct.toFixed(3)}%
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-slate-300 sm:grid-cols-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Burst</div>
                      <div className="font-mono text-sm text-slate-100">
                        {burstMsTelemetry != null ? `${burstMsTelemetry.toFixed(3)} ms` : "n/a"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Dwell</div>
                      <div className="font-mono text-sm text-slate-100">
                        {dwellMsTelemetry != null ? `${dwellMsTelemetry.toFixed(3)} ms` : "n/a"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">
                        {"\u03C4"}LC
                      </div>
                      <div className="font-mono text-sm text-slate-100">
                        {tauLcMsTelemetry != null ? `${tauLcMsTelemetry.toFixed(3)} ms` : "n/a"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-slate-300 sm:grid-cols-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Current Sector</div>
                      <div className="font-mono text-sm text-slate-100">
                        {currentSectorLive != null && totalSectorsLive != null
                          ? `${Math.max(0, currentSectorLive + 1)}/${totalSectorsLive}`
                          : totalSectorsLive != null
                          ? `n/a/${totalSectorsLive}`
                          : currentSectorLive != null
                          ? `${Math.max(0, currentSectorLive + 1)}/n/a`
                          : "n/a"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Window</div>
                      <div className="font-mono text-sm text-slate-100">
                        {sectorStrobingLive != null ? `${sectorStrobingLive} live` : "n/a"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">Period</div>
                      <div className="font-mono text-sm text-slate-100">
                        {sectorPeriodMsLive != null ? `${sectorPeriodMsLive.toFixed(3)} ms` : "n/a"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ====== SECONDARY GRID (rest of the panels) ====== */}
          <div className="grid grid-cols-1 gap-4">
            {observerRobustStats && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-sm">Observer-Robust Diagnostics</CardTitle>
                  <CardDescription>Condition/frame overlays for stress-energy diagnostics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs text-slate-300">Condition</Label>
                      <Select value={observerCondition.toUpperCase()} onValueChange={(value) => setObserverCondition(value.toLowerCase() as ObserverConditionKey)}>
                        <SelectTrigger className="mt-1 border-slate-700 bg-slate-900/70 text-slate-100">
                          <SelectValue placeholder="Condition" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 text-slate-100">
                          <SelectItem value="NEC">NEC</SelectItem>
                          <SelectItem value="WEC">WEC</SelectItem>
                          <SelectItem value="SEC">SEC</SelectItem>
                          <SelectItem value="DEC">DEC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-300">Frame</Label>
                      <Select value={observerFrame} onValueChange={(value) => setObserverFrame(value as ObserverFrameKey)}>
                        <SelectTrigger className="mt-1 border-slate-700 bg-slate-900/70 text-slate-100">
                          <SelectValue placeholder="Frame" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 text-slate-100">
                          <SelectItem value="Eulerian">Eulerian</SelectItem>
                          <SelectItem value="Robust">Robust</SelectItem>
                          <SelectItem value="Delta">Delta</SelectItem>
                          <SelectItem value="Missed">Missed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-slate-600 text-slate-200">rapidity cap: {observerRobustStats.rapidityCap.toFixed(3)}</Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-200">Type-I: {(observerRobustStats.typeI.fraction * 100).toFixed(2)}%</Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-200">source mix: alg {(observerConditionSummary ? (observerConditionSummary.worstCase.source === "algebraic_type_i" ? "active" : "mixed") : "n/a")}</Badge>
                    <Badge className={observerRobustStats.consistency.robustNotGreaterThanEulerian ? "bg-green-500/20 text-green-300" : "bg-amber-500/20 text-amber-300"}>
                      robust≤eulerian: {observerRobustStats.consistency.robustNotGreaterThanEulerian ? "true" : "false"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Left column: Compliance, Quantum Inequality, Shift Vector */}
            <div className="space-y-4">
              {/* Metric Compliance HUD */}
              <Card
                id={PANEL_HASHES.complianceHud}
                data-panel-hash={PANEL_HASHES.complianceHud}
                className="bg-slate-900/50 border-slate-800"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-green-400" />
                    {MAINFRAME_ZONES.COMPLIANCE_HUD}
                  </CardTitle>
                  <CardDescription>GR condition monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                      <span className="text-sm">Ford-Roman Inequality</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm"> = {fmt(pipelineState?.zeta ?? systemMetrics?.fordRoman?.value, 3, "0.032")}</span>
                        <Badge
                          className={`${
                            pipelineState?.fordRomanCompliance ?? (systemMetrics?.fordRoman?.status === "PASS")
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {pipelineState?.fordRomanCompliance ?? (systemMetrics?.fordRoman?.status === "PASS") ? "PASS" : "FAIL"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                      <span className="text-sm">Natrio Zero-Expansion</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm"> = {fmt(systemMetrics?.natario?.value, 3, "0")}</span>
                        <Badge
                          className={`${
                            pipelineState?.natarioConstraint ?? (systemMetrics?.natario?.status === "VALID")
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {pipelineState?.natarioConstraint ?? (systemMetrics?.natario?.status === "VALID") ? "VALID" : "INVALID"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                      <span className="text-sm">Curvature Threshold</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          R {"<"}{" "}
                          {(() => {
                            const R_est = isFiniteNumber(pipelineState?.U_cycle)
                              ? Math.abs(pipelineState.U_cycle) / 9e16
                              : systemMetrics?.curvatureMax;
                            return fexp(R_est, 0, "1e-21");
                          })()}
                        </span>
                        <Badge className={`${pipelineState?.curvatureLimit ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                          {pipelineState?.curvatureLimit ? "SAFE" : "WARN"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                      <span className="text-sm">Time-Scale Separation</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">TS = {fmt(pipelineState?.TS_ratio ?? systemMetrics?.timeScaleRatio, 1, "5.03e4")}</span>
                        <Badge
                          className={`${
                            (pipelineState?.TS_ratio ?? systemMetrics?.timeScaleRatio ?? 0) > 1
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {(pipelineState?.TS_ratio ?? systemMetrics?.timeScaleRatio ?? 0) > 1 ? "SAFE" : "CHECK"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Show pipeline calculation details */}
                  {pipelineState && (
                    <div className="mt-4 p-3 bg-slate-950 rounded-lg">
                      <p className="text-xs text-slate-400 mb-2">Energy Pipeline Values:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                        <div>U_static: {fexp(pipelineState?.U_static, 2, "")} J</div>
                        <div>U_geo: {fexp(pipelineState?.U_geo, 2, "")} J</div>
                        <div>U_Q: {fexp(pipelineState?.U_Q, 2, "")} J</div>
                        <div>U_cycle: {fexp(pipelineState?.U_cycle, 2, "")} J</div>
                        <div>P_loss: {fmt(pipelineState?.P_loss_raw, 3, "")} W/tile</div>
                        <div>N_tiles: {fexp(pipelineState?.N_tiles, 2, "")}</div>
                        <div className="col-span-2 text-yellow-300 border-t border-slate-700 pt-2 mt-1">
                          _VdB (visual): {fexp(pipelineState?.gammaVanDenBroeck_vis ?? pipelineState?.gammaVanDenBroeck, 2, "")} (Van den
                          Broeck)
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quantum Inequality panel and visual */}
              <div className="space-y-3">
                <QiWidget />
                <div className="flex flex-col items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                  <SectorLegend />
                  <SectorRolesHud size={360} ringWidth={32} showQiWindow />
                </div>
              </div>


              {/* Shift Vector  Interior Gravity */}
              <ShiftVectorPanel
                mode={pipelineState?.currentMode || "hover"}
                shift={systemMetrics?.shiftVector as any}
              />
            </div>

            {/* Middle Column - Casimir Tile Grid & Physics Field */}
            <div className="space-y-4">
              {systemMetrics && (
                <div className="rounded-lg border border-white/10 bg-black/40 p-3">
                  <div className="flex items-center justify-between px-1 pb-2">
                    <div className="text-[12px] font-medium text-white/90">Sector Ring HUD</div>
                    <div className="text-[11px] text-white/60">
                      {Math.max(1, Math.floor(concurrentSectorsSafe))}/{Math.max(1, Math.floor(totalSectorsSafe))} sectors
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="h-48 w-48">
                      <SectorGridRing
                        sectorsTotal={Math.max(1, Math.floor(totalSectorsSafe))}
                        sectorsConcurrent={Math.max(1, Math.floor(concurrentSectorsSafe))}
                        currentSector={ringCurrentSector}
                        thicknessRx={0.018}
                        alpha={0.78}
                        gain={1.1}
                        hueDeg={PHASE_STREAK_BASE_HUE_DEG}
                        showPhaseStreaks
                        streakLen={2}
                        emaAlpha={0.45}
                        floorLevel={0.04}
                        pulseSector={tileHoverSector ?? null}
                      />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 px-1 text-[11px] text-white/60">
                    <div>Active fraction: {(activeFraction * 100).toFixed(5)}%</div>
                    <div>
                      Sweep:{" "}
                      {Number.isFinite(systemMetrics?.strobeHz)
                        ? Number(systemMetrics!.strobeHz).toLocaleString()
                        : ""}{" "}
                      Hz
                    </div>
                  </div>
                </div>
              )}
              {/* Casimir Tile Grid - Canvas Component */}
              {systemMetrics && (
                <CasimirTileGridPanel
                  metrics={{
                    totalTiles: systemMetrics.totalTiles,
                    sectorStrobing: systemMetrics.sectorStrobing,
                    totalSectors: systemMetrics.totalSectors,
                    tilesPerSector: systemMetrics.tilesPerSector,
                    currentSector: systemMetrics.currentSector,
                    strobeHz: systemMetrics.strobeHz,
                    sectorPeriod_ms: systemMetrics.sectorPeriod_ms,
                    overallStatus: systemMetrics.overallStatus as any,
                  }}
                  width={320}
                  height={170}
                  onSectorFocus={setTileHoverSector}
                  pulseSector={ringCurrentSector}
                />
              )}

              {/* Resonance Scheduler (auto, mode-coupled) */}
              <ResonanceSchedulerTile
                mode={effectiveMode}
                duty={dutyUI_safe}
                sectors={concurrentSectors}
                freqGHz={pipeline?.modulationFreq_GHz ?? 15}
                sectorPeriod_ms={systemMetrics?.sectorPeriod_ms}
                currentSector={systemMetrics?.currentSector}
                hull={hull}
                wallWidth_m={6.0}
              />
            </div>

            {/* Right Column - Terminal & Inspector */}
            <div className="space-y-4">
              {/* ===== Green's Potential ( = G * )  Live Panel ===== */}
              <GreensLivePanel />
              <section id="spectrum" data-panel-hash="spectrum">
                <SpectrumTunerPanel inputs={spectrumInputs} />
              </section>
              {/* Vacuum-gap Sweep card */}
              <Card
                id={PANEL_HASHES.vacuumSweep}
                data-panel-hash={PANEL_HASHES.vacuumSweep}
                className="bg-slate-900/50 border-slate-800"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    Vacuum-gap Sweep (Nb3Sn / DCE)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <div className="font-medium text-yellow-300 mb-1">What you are seeing</div>
                        <p className="mb-2">
                          Heatmap shows maximum parametric gain (dB) per cell over phase and depth for each pair (gap d, pump Omega).
                          Use Top-N to capture a ridge of best setpoints as presets. CSV lets you export full rows for offline analysis.
                        </p>
                        <div className="font-medium text-cyan-300 mb-1">Safety</div>
                        <p className="text-xs">
                          Backend guards against runaway with thresholds on gain (about 15 dB) and QL windows. Hardware slewing is a
                          no-op unless your pump driver is wired.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <CardDescription>Gain(d, Omega) heatmap / Ridge capture / CSV / Replay / Optional HW slewing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={sweepActive ? cancelSweep : runSweepWithHardware}
                      variant="default"
                      className={sweepActive ? "bg-rose-600 hover:bg-rose-700" : "bg-cyan-600 hover:bg-cyan-700"}
                      disabled={sweepCancelRequested}
                    >
                      {sweepActive
                        ? sweepCancelRequested
                          ? "Stopping..."
                          : "Stop Sweep"
                        : "Run Sweep (HW Slew)"}
                    </Button>
                    <Button onClick={exportSweepCSV} variant="outline" disabled={!sweepResults.length}>
                      Export CSV
                    </Button>
                    <div className="ml-auto flex items-center gap-2">
                      <Label className="text-xs text-slate-300">Top-N</Label>
                      <Input
                        type="number"
                        min={1}
                        max={64}
                        value={sweepTopN}
                        onChange={(event) =>
                          setSweepTopN(Math.max(1, Math.min(64, Number(event.target.value) || 1)))
                        }
                        className="h-8 w-20 bg-slate-950 border-slate-700 text-slate-100"
                      />
                      <Button onClick={captureRidge} variant="outline" disabled={!sweepResults.length}>
                        Capture Ridge
                      </Button>
                      {ridgePresets.length ? (
                        <span className="text-xs text-slate-400">{ridgePresets.length} preset(s)</span>
                      ) : null}
                    </div>
                  </div>
                  {pumpStability ? (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                          <Gauge className="h-4 w-4 text-cyan-300" />
                          Pump Guardrails
                        </div>
                        {pumpStatusMeta ? (
                          <span
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${pumpStatusMeta.className}`}
                          >
                            {pumpStatusMeta.icon}
                            <span>{pumpStatusMeta.label.toUpperCase()}</span>
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 md:grid-cols-4">
                        <div>
                          <div className="text-slate-500">rho_est</div>
                          <div>{fmtRatio(pumpStability.rhoEst)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">rho_raw</div>
                          <div>{fmtRatio(pumpStability.rhoRaw)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">kappa_eff</div>
                          <div>
                            {pumpStability.kappaEffMHz != null && pumpStability.kappaEffMHz > 0
                              ? fmtMHz(pumpStability.kappaEffMHz)
                              : "THRESHOLD"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Delta / kappa</div>
                          <div>{fmtRatio(pumpStability.detuneOverKappa)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Delta live</div>
                          <div>{fmtMHz(pumpStability.detuneMHz)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">m live</div>
                          <div>{fmtPct(pumpStability.modDepthPct)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">phi live</div>
                          <div>
                            {Number.isFinite(pumpStability.phaseDeg ?? NaN)
                              ? `${Number(pumpStability.phaseDeg).toFixed(1)} deg`
                              : "--"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">gap live</div>
                          <div>
                            {Number.isFinite(pumpStability.gapNm ?? NaN)
                              ? `${Number(pumpStability.gapNm).toFixed(0)} nm`
                              : "--"}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">pump live</div>
                          <div>{fmtGHz(pumpStability.pumpFreqGHz)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Delta target</div>
                          <div>{fmtMHz(pumpStability.recommendation.detuneMHz)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">m target</div>
                          <div>{fmtPct(pumpStability.recommendation.modDepthPct)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">phi target</div>
                          <div>{`${pumpStability.recommendation.phaseDeg.toFixed(1)} deg`}</div>
                        </div>
                      </div>
                      {pumpStability.issues.length ? (
                        <div className="mt-2 space-y-1 text-[11px] text-amber-300">
                          {pumpStability.issues.map((issue) => (
                            <div key={issue} className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Within guard band</span>
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          onClick={applyWorkingPoint}
                          className="bg-cyan-600 hover:bg-cyan-700"
                        >
                          Apply SWP-A
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={nudgeDetune}
                          disabled={!pumpStability.recommendation.pumpFreqGHz}
                          className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
                        >
                          Delta -&gt; +0.6 kappa
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={trimDepth}
                          className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                        >
                          Reduce depth
                        </Button>
                        <div className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
                          <Target className="h-3 w-3" />
                          rho_target ~ {pumpStability.recommendation.rhoTarget.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <CavityMechanismPanel className="mt-3" />
                  <VacuumGapSweepHUD className="mt-2" />
                  <ScrollArea className="w-full">
                    <div className="min-w-[680px]">
                      <VacuumGapHeatmap
                        rows={sweepResults}
                        onCellClick={(cell) => {
                          const match = sweepResults
                            .filter((row) => row.d_nm === cell.d_nm && row.Omega_GHz === cell.Omega_GHz)
                            .sort((a, b) => b.G - a.G)[0];
                          setSelectedSweep(match ?? null);
                        }}
                      />
                    </div>
                  </ScrollArea>
                  {selectedSweep ? (
                    <div className="mt-1 p-3 rounded-lg border border-slate-800 bg-slate-950 text-xs font-mono">
                      d={selectedSweep.d_nm.toFixed(1)} nm; Omega={selectedSweep.Omega_GHz.toFixed(3)} GHz; phi=
                      {selectedSweep.phi_deg.toFixed(2)} deg; m={(selectedSweep.m * 100).toFixed(2)}%; G=
                      {selectedSweep.G.toFixed(2)} dB; QL={
                        Number.isFinite(selectedSweep.QL)
                          ? (selectedSweep.QL as number).toExponential(2)
                          : Number.isFinite(selectedSweep.QL_base)
                          ? (selectedSweep.QL_base as number).toExponential(2)
                          : "--"
                      }{" "}
                      {selectedSweep.stable ? "stable" : "unstable"}
                      {selectedSweep.notes?.length ? (
                        <div className="mt-1 text-slate-400">Notes: {selectedSweep.notes.join("; ")}</div>
                      ) : null}
                    </div>
                  ) : null}
                  <SweepReplayControls rows={sweepResults} onStep={(row) => setSelectedSweep(row)} />
              </CardContent>
            </Card>
            {/* ====== CASIMIR AMPLIFIER: Complete Physics Pipeline Visualization ====== */}
            <div className="mt-8">
              <HelixCasimirAmplifier
                readOnly
                cohesive={false}
                showDisplacementField={false}
                metricsEndpoint="/api/helix/metrics"
                stateEndpoint="/api/helix/pipeline"
                fieldEndpoint="/api/helix/displacement"
                modeEndpoint="/api/helix/mode"
                lightCrossing={lc}
              />
            </div>
            {SHOW_LOG_TERMINAL && (
              <>
                {/* Log + Document Terminal */}
                <Card
                  id={PANEL_HASHES.mainframeTerminal}
                  data-panel-hash={PANEL_HASHES.mainframeTerminal}
                  className="bg-slate-900/50 border-slate-800"
                >
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-orange-400" />
                        {MAINFRAME_ZONES.LOG_TERMINAL}
                      </CardTitle>
                      <CardDescription>Mainframe command interface</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="chat" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="chat">AI Chat</TabsTrigger>
                          <TabsTrigger value="logs">System Logs</TabsTrigger>
                          <TabsTrigger value="gr-audit">GR Audit</TabsTrigger>
                        </TabsList>

                        <TabsContent value="chat" className="space-y-3">
                          <ScrollArea className="h-64 bg-slate-950 rounded-lg p-3" ref={scrollRef}>
                            <div className="space-y-3">
                              {chatMessages.map((msg, i) => (
                                <div key={i} className={`space-y-1 ${msg.role === "user" ? "text-right" : ""}`}>
                                  <div
                                    className={`inline-block max-w-[80%] p-3 rounded-lg text-sm ${
                                      msg.role === "user"
                                        ? "bg-cyan-600/20 text-cyan-100"
                                        : msg.role === "system"
                                        ? "bg-purple-600/20 text-purple-100"
                                        : "bg-slate-800 text-slate-100"
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                    {msg.functionCall && (
                                      <div className="mt-2 pt-2 border-t border-slate-700 text-xs">
                                        <p className="text-yellow-400">Function: {msg.functionCall.name}</p>
                                        <pre className="mt-1 text-slate-300">{JSON.stringify(msg.functionCall.result, null, 2)}</pre>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500">{formatMsgTime(msg.timestamp)}</div>
                                </div>
                              ))}
                              {isProcessing && (
                                <div className="text-center">
                                  <Badge variant="outline" className="animate-pulse">
                                    <Cpu className="w-3 h-3 mr-1" />
                                    Processing...
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </ScrollArea>

                          <div className="flex gap-2">
                            <Input
                              value={commandInput}
                              onChange={(e) => setCommandInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && sendCommand()}
                              placeholder="Ask HELIX-CORE..."
                              className="bg-slate-950 border-slate-700 text-slate-100"
                              disabled={isProcessing}
                            />
                            <Button onClick={sendCommand} disabled={isProcessing || !commandInput.trim()} className="bg-cyan-600 hover:bg-cyan-700">
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="logs" className="space-y-3">
                          <ScrollArea className="h-64 bg-slate-950 rounded-lg p-3">
                            <div className="font-mono text-xs space-y-1">
                              {mainframeLog.map((log, i) => (
                                <div
                                  key={i}
                                  className={
                                    log.includes("[FUNCTION]")
                                      ? "text-yellow-400"
                                      : log.includes("[RESULT]")
                                      ? "text-purple-400"
                                      : log.includes("[TILE]")
                                      ? "text-cyan-400"
                                      : log.includes("[DATA]")
                                      ? "text-blue-400"
                                      : log.includes("[LOCK]")
                                      ? "text-rose-400"
                                      : log.includes("[ENGINE]")
                                      ? "text-amber-400"
                                      : "text-green-400"
                                  }
                                >
                                  {log}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </TabsContent>

                        <TabsContent value="gr-audit" className="space-y-3">
                          <div className="rounded-lg border border-slate-800/70 bg-slate-950/60 p-3">
                            <GrAgentLoopAuditPanel variant="embedded" />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Operations Toolbar (hidden) */}
              {false && (
              <Card
                id={PANEL_HASHES.operationsToolbar}
                data-panel-hash={PANEL_HASHES.operationsToolbar}
                className="bg-slate-900/50 border-slate-800"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-cyan-400" />
                    Operations Toolbar
                  </CardTitle>
                  <CardDescription>Quick actions: auto-duty sequence, diagnostics sweep, and theory playback.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {/* Auto-Duty Mode */}
                    <Button
                      variant={activeMode === "auto" ? "default" : "outline"}
                      onClick={async () => {
                        setActiveMode("auto");
                        setIsProcessing(true);
                        try {
                          const command = "Execute auto-duty pulse sequence across all 400 sectors";
                          const userMessage: ChatMessage = {
                            role: "user",
                            content: command,
                            timestamp: new Date(),
                          };
                          setChatMessages((prev) => [...prev, userMessage]);

                          if (commandAbortRef.current) {
                            commandAbortRef.current.abort();
                          }
                          commandAbortRef.current = new AbortController();

                          const response = await apiRequest(
                            "POST",
                            "/api/helix/command",
                            {
                              messages: chatMessages.concat({ role: "user", content: command }),
                            },
                            commandAbortRef.current.signal
                          );
                          const responseData = await response.json();

                          const assistantMessage: ChatMessage = {
                            role: "assistant",
                            content: responseData.message.content,
                            timestamp: new Date(),
                          };

                          if (responseData.functionResult) {
                            assistantMessage.functionCall = {
                              name: responseData.message.function_call?.name ?? "auto_duty",
                              result: responseData.functionResult,
                            };
                            setMainframeLog((prev) => [...prev, `[AUTO-DUTY] ${responseData.functionResult.log || "Sequence initiated"}`].slice(-200));
                            refetchMetrics();
                          }

                          setChatMessages((prev) => [...prev, assistantMessage]);
                        } catch (error) {
                          toast({
                            title: "Auto-Duty Error",
                            description: error instanceof Error ? error.message : "Failed to execute",
                            variant: "destructive",
                          });
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      className="flex items-center gap-2"
                      disabled={isProcessing}
                    >
                      <Brain className="w-4 h-4" />
                      Auto-Duty Mode
                    </Button>

                    {/* Diagnostics Mode */}
                    <Button
                      variant={activeMode === "diagnostics" ? "default" : "outline"}
                      onClick={async () => {
                        setActiveMode("diagnostics");
                        setIsProcessing(true);
                        try {
                          const command = "Run comprehensive diagnostics scan on all tile sectors";
                          const userMessage: ChatMessage = {
                            role: "user",
                            content: command,
                            timestamp: new Date(),
                          };
                          setChatMessages((prev) => [...prev, userMessage]);

                          if (commandAbortRef.current) {
                            commandAbortRef.current.abort();
                          }
                          commandAbortRef.current = new AbortController();

                          const response = await apiRequest(
                            "POST",
                            "/api/helix/command",
                            {
                              messages: chatMessages.concat({ role: "user", content: command }),
                            },
                            commandAbortRef.current.signal
                          );
                          const responseData = await response.json();

                          const assistantMessage: ChatMessage = {
                            role: "assistant",
                            content: responseData.message.content,
                            timestamp: new Date(),
                          };

                          if (responseData.functionResult) {
                            assistantMessage.functionCall = {
                              name: responseData.message.function_call?.name ?? "diagnostics",
                              result: responseData.functionResult,
                            };
                            setMainframeLog((prev) => [...prev, `[DIAGNOSTICS] System Health: ${responseData.functionResult.systemHealth ?? "OK"}`].slice(-200));
                            refetchMetrics();
                          }

                          setChatMessages((prev) => [...prev, assistantMessage]);
                        } catch (error) {
                          toast({
                            title: "Diagnostics Error",
                            description: error instanceof Error ? error.message : "Failed to run scan",
                            variant: "destructive",
                          });
                        } finally {
                          setIsProcessing(false);
                        }
                      }}
                      className="flex items-center gap-2"
                      disabled={isProcessing}
                    >
                      <Gauge className="w-4 h-4" />
                      Diagnostics
                    </Button>

                    {/* Theory Playback */}
                    <Button
                      variant={activeMode === "theory" ? "default" : "outline"}
                      onClick={() => {
                        setActiveMode("theory");
                        setMainframeLog((prev) => [...prev, "[THEORY] Loading Needle Hull Mark 1 documentation..."]);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Atom className="w-4 h-4" />
                      Theory Playback
                    </Button>

                  </div>
                </CardContent>
              </Card>
              )}

              {/* Mission Fuel / Range Gauge */}
              <FuelGauge
                mode={String(pipelineState?.currentMode || "hover").replace(/^./, (c: string) => c.toUpperCase())}
                powerMW={pipelineState?.P_avg ?? 83.3}
                zeta={pipelineState?.zeta ?? 0}
                tsRatio={pipelineState?.TS_ratio ?? 5.03e4}
                frOk={pipelineState?.fordRomanCompliance ?? true}
                natarioOk={pipelineState?.natarioConstraint ?? true}
                curvatureOk={pipelineState?.curvatureLimit ?? true}
                freqGHz={15.0}
                duty={frDutyForPanels}
                gammaGeo={pipelineState?.gammaGeo ?? 26}
                qFactor={pipelineState?.qCavity ?? 1e9}
                pMaxMW={120}
              />

              {/* Trip Player */}
              <TripPlayer
                plan={{ distanceLy: 0.5, cruiseDuty: 0.14, cruiseMode: "Cruise", hoverMode: "Hover", stationKeepHours: 2 }}
                getState={() => ({
                  zeta: pipelineState?.zeta ?? 0,
                  tsRatio: pipelineState?.TS_ratio ?? 5.03e4,
                  powerMW: pipelineState?.P_avg ?? 83.3,
                  freqGHz: 15.0,
                })}
                setMode={(mode) => {
                  if (switchMode) {
                    startTransition(() => {
                      setOptimisticMode(mode as ModeKey);
                      setModeNonce((n) => n + 1);
                      switchMode.mutate(mode as any, {
                        onSuccess: () => {
                          queryClient.invalidateQueries({
                            predicate: (q) =>
                              Array.isArray(q.queryKey) &&
                              (q.queryKey[0] === "/api/helix/pipeline" || q.queryKey[0] === "/api/helix/metrics"),
                          });
                        },
                      });
                    });
                    const whispers = {
                      Hover: "Form first. Speed follows.",
                      Cruise: "Timing matched. Take the interval; apply thrust.",
                      Emergency: "Breathe once. Choose the useful distance.",
                      Standby: "Meet change with correct posture. The rest aligns.",
                    } as const;
                    publish("luma:whisper", { text: (whispers as any)[mode] || "Configuration updated." });
                  }
                }}
                setDuty={(duty) => {
                  console.log("Setting duty:", duty);
                }}
                onTick={(phase, t) => {
                  if (DEV) console.log(`Trip phase: ${phase}, time: ${t}s`);
                }}
              />

              {/* Mission Planner - Galactic Maps */}
              <Card id={PANEL_HASHES.missionPlanner} data-panel-hash={PANEL_HASHES.missionPlanner}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-semibold">Mission Planner</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-slate-400 hover:text-cyan-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <div className="font-medium text-yellow-300 mb-1"> Theory</div>
                        <p className="mb-2">
                          Interactive navigation system supporting both galactic-scale (parsec) and solar system (AU) mission planning.
                          Routes calculate energy requirements and travel time based on current warp bubble parameters.
                        </p>
                        <div className="font-medium text-cyan-300 mb-1"> Zen</div>
                        <p className="text-xs italic">The path reveals itself to those who take the first step.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Select
                      value={mapMode}
                      onValueChange={(v: "galactic" | "solar") => {
                        setMapMode(v);
                        localStorage.setItem("helix-mapMode", v); // Persist preference
                        // Reset route when switching modes
                        if (v === "solar") {
                          setRoute(["EARTH", "SATURN", "SUN"]);
                          publish("luma:whisper", { text: "Solar navigation initialized. Near-space trajectory computed." });
                        } else {
                          setRoute(["SOL", "ORI_OB1", "VEL_OB2", "SOL"]);
                          publish("luma:whisper", { text: "Galactic coordinates engaged. Interstellar passage mapped." });
                        }
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="View" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="galactic">Galactic (pc)</SelectItem>
                        <SelectItem value="solar">Solar (AU)</SelectItem>
                      </SelectContent>
                    </Select>
                    {mapMode === "galactic" && (
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="deep-zoom-toggle" className="text-xs">
                          High-Res
                        </Label>
                        <Switch
                          id="deep-zoom-toggle"
                          checked={useDeepZoom}
                          onCheckedChange={(checked) => {
                            startTransition(() => {
                              setUseDeepZoom(checked);
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mapMode === "solar" ? (
                    <div className="w-full overflow-hidden rounded-md bg-slate-950 border border-slate-800">
                      <div className="mx-auto max-w-[720px]">
                        <SolarMap
                          key={`solar-${720}x${360}`}
                          width={720}
                          height={360}
                          routeIds={route}
                          fitToIds={["EARTH", "SATURN"]}
                          fitMarginPx={28}
                          centerOnId={undefined}
                          centerBetweenIds={undefined}
                          onPickBody={(id) => {
                            setRoute((r) => (r.length ? [...r.slice(0, -1), id, r[r.length - 1]] : [id]));
                            publish("luma:whisper", { text: "Waypoint selected. Route updated." });
                          }}
                          /* NEW: barycenter wobble background */
                          backgroundPolylineAU={baryPath}
                          backgroundPolylineStyle={{
                            stroke: "rgba(137,180,255,0.25)",
                            width: 1.25,
                            dash: [2, 3],
                            composite: "screen",
                          }}
                          backgroundPolylineGain={50} // ~0.005 AU wobble  ~0.25 AU visual; visible even when zoomed out
                        />
                      </div>
                    </div>
                  ) : !galaxyCalibration ? (
                    <div className="h-40 grid place-items-center text-xs text-slate-400">Loading galactic coordinate system</div>
                  ) : useDeepZoom ? (
                    <div className="relative">
                      <GalaxyDeepZoom dziUrl="/galaxy_tiles.dzi" width={800} height={400} onViewerReady={setDeepZoomViewer} />
                      {deepZoomViewer && (
                        <GalaxyOverlays
                          viewer={deepZoomViewer}
                          labels={[]}
                          bodies={BODIES}
                          routeIds={route}
                          originPx={galaxyCalibration.originPx}
                          pxPerPc={galaxyCalibration.pxPerPc}
                          onBodyClick={(id) => {
                            setRoute((r) => (r.length ? [...r.slice(0, -1), id, r[r.length - 1]] : [id]));
                            publish("luma:whisper", { text: "Stellar target acquired. Course adjusted." });
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <GalaxyMapPanZoom
                      imageUrl="/galaxymap.png"
                      bodies={BODIES}
                      routeIds={route}
                      onPickBody={(id) => {
                        setRoute((r) => (r.length ? [...r.slice(0, -1), id, r[r.length - 1]] : [id]));
                        publish("luma:whisper", { text: "Galactic destination set. Navigation computed." });
                      }}
                      originPx={{ x: 10123.142, y: 9480.491 }}
                      scalePxPerPc={1.6666667}
                      debug
                      width={800}
                      height={400}
                    />
                  )}

                  {/* Removable route chips */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {route.map((id, idx) => (
                      <span key={`${id}-${idx}`} className="inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-800 text-slate-100 text-xs">
                        {id}
                        <button
                          className="ml-1 rounded px-1 text-slate-300 hover:text-red-300 hover:bg-slate-700"
                          onClick={() => {
                            setRoute((r) => {
                              const copy = r.slice();
                              copy.splice(idx, 1);
                              if (copy.length === 0) return ["SUN"];
                              return copy;
                            });
                            publish("luma:whisper", { text: `Removed waypoint: ${id}` });
                          }}
                          aria-label={`Remove ${id}`}
                          title={`Remove ${id}`}
                        >
                          
                        </button>
                      </span>
                    ))}
                    {route.length === 0 && <span className="text-xs text-slate-500">No waypoints yet  tap bodies on the map to add them.</span>}
                  </div>

                  <RouteSteps
                    bodies={mapMode === "solar" ? solarBodiesForRoutes : BODIES}
                    plan={{ waypoints: route }}
                    mode={mapMode}
                    perf={
                      {
                        mode: String(pipelineState?.currentMode || "hover").replace(/^./, (c: string) => c.toUpperCase()),
                        powerMW: pipelineState?.P_avg || 83.3,
                        duty: (Number.isFinite(pipelineState?.dutyCycle) ? pipelineState!.dutyCycle! : 0.14),
                        gammaGeo: pipelineState?.gammaGeo || 26,
                        qFactor: pipelineState?.qCavity || 1e9,
                        zeta: pipelineState?.zeta,
                        tsRatio: pipelineState?.TS_ratio || 5.03e4,
                        freqGHz: 15.0,
                        energyPerLyMWh: (() => {
                          const vModelLyPerHour = computeEffectiveLyPerHour(
                            pipelineState?.currentMode || "Hover",
                            (Number.isFinite(pipelineState?.dutyCycle) ? pipelineState!.dutyCycle! : 0.14),
                            pipelineState?.gammaGeo || 26,
                            pipelineState?.qCavity || 1e9,
                            pipelineState?.zeta,
                            pipelineState?.TS_ratio || 5.03e4
                          );
                          const betaCfg = Number.isFinite(pipelineState?.beta_trans)
                            ? Math.max(0, Math.min(1, pipelineState!.beta_trans!))
                            : 1;
                          const currentMode = String(pipelineState?.currentMode ?? "").toLowerCase();
                          const isTaxi = currentMode === "taxi";
                          const targetMps = Number.isFinite(pipelineState?.taxi_target_mps)
                            ? (pipelineState!.taxi_target_mps as number)
                            : 1.4;
                          const LY_TO_M = 9.4607e15;
                          const SECONDS_PER_HOUR = 3600;
                          let betaTarget = 1;
                          if (isTaxi && vModelLyPerHour > 0) {
                            const vModelMps = (vModelLyPerHour * LY_TO_M) / SECONDS_PER_HOUR;
                            betaTarget = Math.min(1, Math.max(0, targetMps / Math.max(vModelMps, 1e-9)));
                          }
                          const vLyPerHour = vModelLyPerHour * Math.min(betaCfg, betaTarget);
                          const hoursPerLy = vLyPerHour > 0 ? 1 / vLyPerHour : Infinity;
                          return isFinite(hoursPerLy) ? (pipelineState?.P_avg || 83.3) * hoursPerLy : Infinity;
                        })(),
                        energyPerCycleJ: (() => {
                          const cyclesPerSec = 15.0 * 1e9;
                          return cyclesPerSec > 0 ? ((pipelineState?.P_avg || 83.3) * 1e6) / cyclesPerSec : Infinity;
                        })(),
                        vEffLyPerHour: (mode, duty) => {
                          const vModelLyPerHour = computeEffectiveLyPerHour(
                            mode,
                            duty,
                            pipelineState?.gammaGeo || 26,
                            pipelineState?.qCavity || 1e9,
                            pipelineState?.zeta,
                            pipelineState?.TS_ratio || 5.03e4
                          );
                          const betaCfg = Number.isFinite(pipelineState?.beta_trans)
                            ? Math.max(0, Math.min(1, pipelineState!.beta_trans!))
                            : 1;
                          const currentMode = String(pipelineState?.currentMode ?? "").toLowerCase();
                          const isTaxi = currentMode === "taxi";
                          const targetMps = Number.isFinite(pipelineState?.taxi_target_mps)
                            ? (pipelineState!.taxi_target_mps as number)
                            : 1.4;
                          const LY_TO_M = 9.4607e15;
                          const SECONDS_PER_HOUR = 3600;
                          let betaTarget = 1;
                          if (isTaxi && vModelLyPerHour > 0) {
                            const vModelMps = (vModelLyPerHour * LY_TO_M) / SECONDS_PER_HOUR;
                            betaTarget = Math.min(1, Math.max(0, targetMps / Math.max(vModelMps, 1e-9)));
                          }
                          return vModelLyPerHour * Math.min(betaCfg, betaTarget);
                        },
                      } as HelixPerf
                    }
                  />
                  {mapMode === "solar" && (
                    <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-cyan-200">Deep Mixing (Sun) â€” Autopilot</div>
                          <p className="mt-1 text-xs text-slate-400">
                            Slow, distributed wave-driven circulation at the tachocline. Fleet ships act as timed actuators and diagnostics.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[11px] font-semibold ${DEEP_MIXING_STATE_BADGE[deepMixingState]}`}>
                            {deepMixingState}
                          </Badge>
                          <Dialog open={deepMixingDocOpen} onOpenChange={setDeepMixingDocOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-cyan-300 hover:text-cyan-100"
                                title="Learn the physics"
                              >
                                <HelpCircle className="h-4 w-4" />
                                <span className="sr-only">Learn the physics</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>Deep Mixing (Sun) â€” Autopilot</DialogTitle>
                                <DialogDescription>
                                  Mission deck and guardrails for the tachocline circulation preset.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="h-[65vh] overflow-hidden rounded border border-slate-800">
                                <iframe
                                  title="Deep Mixing plan"
                                  src="/deep-mixing-plan"
                                  className="h-full w-full bg-black"
                                  loading="lazy"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      <div>
                        <Label className="text-[11px] font-semibold uppercase text-slate-400">
                          Lifetime Gain Target
                        </Label>
                        <Slider
                          value={[deepMixingTargetIndex]}
                          min={0}
                          max={DEEP_MIXING_TARGETS.length - 1}
                          step={1}
                          onValueChange={(value) => handleDeepMixingTargetChange(value[0] ?? deepMixingTargetIndex)}
                          className="mt-3"
                          aria-label="Lifetime gain target"
                        />
                        <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                          {DEEP_MIXING_TARGETS.map((option) => (
                            <span
                              key={option.index}
                              className={option.index === deepMixingTargetIndex ? "text-cyan-300 font-medium" : undefined}
                            >
                              {option.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center justify-between rounded border border-slate-800/70 bg-slate-900/40 px-3 py-2">
                          <div>
                            <div className="text-[11px] font-medium text-slate-200">Luminosity guardrail</div>
                            <div className="text-[10px] text-slate-400">â‰¤0.1% per Myr</div>
                          </div>
                          <Switch
                            checked={enforceLuminosityGuard}
                            onCheckedChange={(checked) => {
                              setEnforceLuminosityGuard(checked);
                              updateDeepMixingGuardrails(checked, enforceHeAshGuard);
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between rounded border border-slate-800/70 bg-slate-900/40 px-3 py-2">
                          <div>
                            <div className="text-[11px] font-medium text-slate-200">He-ash export cap</div>
                            <div className="text-[10px] text-slate-400">Hold delta T / T within guard</div>
                          </div>
                          <Switch
                            checked={enforceHeAshGuard}
                            onCheckedChange={(checked) => {
                              setEnforceHeAshGuard(checked);
                              updateDeepMixingGuardrails(enforceLuminosityGuard, checked);
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                        <div className="overflow-hidden rounded-md border border-slate-800/70 bg-black/40">
                          <DeepMixingSolarView ringSegments={720} phasingMarkers={16} routeIds={["SUN"]} />
                        </div>
                        <div className="space-y-3 text-[11px] text-slate-300">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
                            <span>Îµ target</span>
                            <span>{deepMixingPlan.epsilon.toExponential(2)}</span>
                            <span>Îµ achieved</span>
                            <span>
                              {deepMixingTelemetry.achievedEpsilon > 0
                                ? deepMixingTelemetry.achievedEpsilon.toExponential(2)
                                : "â€”"}
                            </span>
                            <span>vr setpoint</span>
                            <span>
                              {Number.isFinite(deepMixingMmPerYear)
                                ? `${deepMixingMmPerYear.toFixed(2)} mm/yr`
                                : "â€”"}
                            </span>
                            <span>pulse cadence</span>
                            <span>{deepMixingPlan.cadenceDays.toFixed(2)} d</span>
                            <span>duty phase</span>
                            <span>{(deepMixingPlan.duty * 100).toFixed(1)} %</span>
                            <span>delta L guard</span>
                            <span>
                              {deepMixingLumFraction != null
                                ? `${Math.max(0, deepMixingLumFraction * 100).toFixed(1)} % cap`
                                : "off"}
                            </span>
                            <span>delta Tc guard</span>
                            <span>
                              {deepMixingTcFraction != null
                                ? `${Math.max(0, deepMixingTcFraction * 100).toFixed(1)} % cap`
                                : "off"}
                            </span>
                            <span>Fleet split</span>
                            <span>
                              {deepMixingFleetTotals.total > 0
                                ? `${deepMixingFleetTotals.actuatorsPct.toFixed(0)}% act / ${deepMixingFleetTotals.diagnosticsPct.toFixed(
                                    0
                                  )}% diag / ${deepMixingFleetTotals.idlePct.toFixed(0)}% idle`
                                : "configure"}
                            </span>
                            <span>Projected delta t</span>
                            <span>{deepMixingProjectedDeltaTLabel}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeepMixingTelemetry({ ...deepMixingTelemetryScenarios.nominal })}
                            >
                              Nominal telemetry
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeepMixingTelemetry({ ...deepMixingTelemetryScenarios.guardrail })}
                            >
                              Guardrail breach
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDeepMixingTelemetry({ ...deepMixingTelemetryScenarios.boost })}
                            >
                              Build epsilon
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={advanceDeepMixingState}>
                              Advance state
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setDeepMixingState("SAFE")}>
                              Stand down
                            </Button>
                            <Button size="sm" variant="secondary" onClick={handleApplyDeepMixingTrim}>
                              Apply control trim
                            </Button>
                          </div>
                          <div className="rounded border border-slate-800/60 bg-slate-900/40 px-3 py-2 text-[10px] text-slate-400">
                            Next trim -&gt; duty {(deepMixingControlPreview.duty * 100).toFixed(1)} %, cadence{" "}
                            {deepMixingControlPreview.cadenceDays.toFixed(2)} d{" "}
                            {deepMixingControlPreview.enteredSafe ? "(SAFE posture recommended)" : ""}
                          </div>
                          <div className="text-[10px] uppercase tracking-wide text-slate-500">
                            sequence: {deepMixingSequence.join(" -> ")} -&gt; SAFE
                          </div>
                        </div>
                      </div>
                      <section id="deep-mix-globe">
                        <Suspense fallback={null}>
                          <DeepMixGlobePanel />
                        </Suspense>
                      </section>
                      <section id="deep-mix-sweet-spot">
                        <DeepMixSweetSpot />
                      </section>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
