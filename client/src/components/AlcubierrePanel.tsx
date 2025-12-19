import React, {useCallback, useEffect, useMemo, useReducer, useRef, useState} from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { BufferGeometry, Mesh } from "three";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { useHullPreviewPayload } from "@/hooks/use-hull-preview-payload";
import { useLightCrossingLoop } from "@/hooks/useLightCrossingLoop";
import { useDriveSyncStore } from "@/store/useDriveSyncStore";
import { useFlightDirectorStore } from "@/store/useFlightDirectorStore";
import {
  useHull3DSharedStore,
  defaultOverlayPrefsForProfile,
  type HullOverlayPrefProfile,
  type HullOverlayPrefs,
  type HullSpacetimeGridPrefs,
  type HullSpacetimeGridMode,
  type HullSpacetimeGridColorBy,
  type HullSpacetimeGridStrengthMode,
  type HullVoxelSliceAxis,
} from "@/store/useHull3DSharedStore";
import { useDesktopStore } from "@/store/useDesktopStore";
import { shallow } from "zustand/shallow";
import { VolumeModeToggle, type VolumeViz } from "@/components/VolumeModeToggle";
import { publish, subscribe, unsubscribe } from "@/lib/luma-bus";
import { Hull3DRenderer, Hull3DRendererMode, Hull3DQualityPreset, Hull3DQualityOverrides, Hull3DRendererState, Hull3DVolumeViz, Hull3DOverlayState, HullGeometryMode, HullGateSource, Hull3DVolumeDomain, type HullPreviewMeshPayload } from "./Hull3DRenderer.ts";
import { CurvatureVoxProvider } from "./CurvatureVoxProvider";
import { smoothSectorWeights } from "@/lib/sector-weights";
import { TheoryBadge } from "./common/TheoryBadge";
import { normalizeCurvaturePalette, type CurvaturePalette } from "@/lib/curvature-directive";
import StressOverlay from "@/components/HullViewer/StressOverlay";
import { resolveHullDimsEffective } from "@/lib/resolve-hull-dims";
import {
  colorizeFieldProbe,
  colorizeWireframeOverlay,
  resolveHullSurfaceMesh,
  resolveWireframeOverlay,
  VIEWER_WIREFRAME_BUDGETS,
  type WireframeContactPatch,
  type WireframeOverlayResult,
} from "@/lib/resolve-wireframe-overlay";
import {
  applySchedulerWeights,
  buildHullSurfaceStrobe,
  clearLatticeSurfaceCaches,
  voxelizeHullSurfaceStrobe,
} from "@/lib/lattice-surface";
import { useFieldProbe } from "@/hooks/use-field-probe";
import { applyHullBasisToPositions, resolveHullBasis, HULL_BASIS_IDENTITY, type HullBasisResolved } from "@shared/hull-basis";
import { formatTriplet, remapXYZToFrontRightUp } from "@/lib/hull-hud";
import { frameCardCameraToObb } from "@shared/card-camera";
import type { CardCameraPreset } from "@shared/schema";
import { buildLatticeFrame } from "@/lib/lattice-frame";
import { buildHullDistanceGrid, clearLatticeSdfCache } from "@/lib/lattice-sdf";
import { hashLatticeSdfDeterminism, hashLatticeVolumeDeterminism } from "@/lib/lattice-health";
import { LATTICE_PROFILE_PERF, LatticeRebuildWatchdog, estimateLatticeUploadBytes } from "@/lib/lattice-perf";
/**
 * TheoryRefs:
 *  - vanden-broeck-1999: UI exposes gamma_VdB with provenance
 */


interface AlcubierrePanelProps {
  className?: string;
  onCanvasReady?: (
    canvas: HTMLCanvasElement | null,
    overlayCanvas?: HTMLCanvasElement | null,
    overlayDom?: HTMLDivElement | null
  ) => void;
  overlayHudEnabled?: boolean;
  onPlanarVizModeChange?: (mode: number) => void;
  vizIntent?: {
    rise: number;
    planar: number;
    yaw?: number;
  };
}

type TiltDirective = {
  enabled: boolean;
  dir: [number, number];
  magnitude: number;
  alpha?: number;
  source?: string;
  gain?: number; // [tilt-gain]
  gainMode?: "manual" | "curvature"; // [tilt-gain]
};

function FlightDirectorStatusRow() {
  const { enabled, mode, coupling } = useFlightDirectorStore(
    (state) => ({
      enabled: state.enabled,
      mode: state.mode,
      coupling: state.coupling,
    }),
    shallow
  );
  const yawRate = useFlightDirectorStore((state) => state.yawRate_dps);
  const setEnabled = useFlightDirectorStore((state) => state.setEnabled);

  return (
    <div className="flex items-center gap-2 text-[0.65rem] text-slate-200">
      <label className="inline-flex items-center gap-1">
        <input
          type="checkbox"
          className="accent-emerald-500"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        Flight Director
      </label>
      <span className="text-[0.65rem] text-slate-400">
        {mode} | {coupling} | {Math.round(yawRate)} deg/s
      </span>
    </div>
  );
}

// === helpers: math & smoothing =================================================
const clamp = (x: number, a = -Infinity, b = Infinity) => Math.max(a, Math.min(b, x));

type SpacetimeGridPreset = {
  id: string;
  label: string;
  hint: string;
  prefs: HullSpacetimeGridPrefs;
};

const SPACETIME_GRID_PRESETS: SpacetimeGridPreset[] = [
  {
    id: "warp-bubble",
    label: "Warp bubble",
    hint: "Surface shell with thicker falloff to show the warp wall.",
    prefs: {
      enabled: true,
      mode: "surface",
      spacing_m: 0.28,
      warpStrength: 1.4,
      falloff_m: 1.1,
      colorBy: "thetaSign",
      useSdf: true,
      warpStrengthMode: "autoThetaPk",
    },
  },
  {
    id: "warp-volume",
    label: "Warp volume",
    hint: "3D cage around the hull to show expansion/contraction in space.",
    prefs: {
      enabled: true,
      mode: "volume",
      spacing_m: 0.85,
      warpStrength: 1.1,
      falloff_m: 1.2,
      colorBy: "thetaSign",
      useSdf: true,
      warpStrengthMode: "autoThetaPk",
    },
  },
  {
    id: "slice-debug",
    label: "Slice debug",
    hint: "Planar slice for debugging field strength and polarity.",
    prefs: {
      enabled: true,
      mode: "slice",
      spacing_m: 0.18,
      warpStrength: 1.6,
      falloff_m: 0.7,
      colorBy: "thetaSign",
      useSdf: true,
      warpStrengthMode: "autoThetaPk",
    },
  },
];
const SPACETIME_GRID_DEFAULT_PRESET_ID = "warp-volume";
const sech2  = (x: number) => {
  const c = Math.cosh(x);
  return 1 / (c * c);
};
/**
 * Alcubierre top-hat radial derivative df/dr_s (closed form, Ïƒ and R dimensionless)
 */
// JS helper matching the GLSL d_topHat_dr behavior
function dTopHatDr(r: number, sigma: number, R: number) {
  const den = Math.max(1e-8, 2 * Math.tanh(sigma * R));
  return sigma * (sech2(sigma * (r + R)) - sech2(sigma * (r - R))) / den;
}

// Mirrors lattice-surface.ts so panel can detect stale hashes without allocating weight buffers.
const fnv1a32 = (str: string) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash >>> 0) * 0x01000193;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const latticeBasisSignature = (basis?: HullBasisResolved | null) => {
  if (!basis) return "basis:none";
  const swap = `${basis.swap.x}${basis.swap.y}${basis.swap.z}`;
  const flip = `${basis.flip.x ? 1 : 0}${basis.flip.y ? 1 : 0}${basis.flip.z ? 1 : 0}`;
  const scale = basis.scale.map((v) => Math.round((v ?? 0) * 1e6) / 1e6).join(",");
  const forward = basis.forward.map((v) => Math.round((v ?? 0) * 1e4) / 1e4).join(",");
  const up = basis.up.map((v) => Math.round((v ?? 0) * 1e4) / 1e4).join(",");
  const right = basis.right.map((v) => Math.round((v ?? 0) * 1e4) / 1e4).join(",");
  return `basis:${swap}|${flip}|${scale}|${forward}|${up}|${right}`;
};

type LatticeStrobeWeightParams = {
  totalSectors: number;
  liveSectors: number;
  sectorCenter01: number;
  gaussianSigma: number;
  sectorFloor: number;
  splitEnabled?: boolean;
  splitFrac?: number;
  syncMode?: number;
};

const quantizeSectorCenter01 = (center01: number, totalSectors: number) => {
  const total = Math.max(1, Math.floor(totalSectors));
  const center = ((center01 % 1) + 1) % 1;
  const idx = Math.min(total - 1, Math.max(0, Math.floor(center * total)));
  return (idx + 0.5) / total;
};

const latticeParamsSignature = (params: LatticeStrobeWeightParams) => {
  const center01 = quantizeSectorCenter01(params.sectorCenter01, params.totalSectors);
  const parts = [
    `total=${Math.floor(params.totalSectors)}`,
    `live=${Math.floor(params.liveSectors)}`,
    `center=${Math.round(center01 * 1e6) / 1e6}`,
    `sigma=${Math.round(params.gaussianSigma * 1e6) / 1e6}`,
    `floor=${Math.round(params.sectorFloor * 1e6) / 1e6}`,
    `split=${params.splitEnabled ? 1 : 0}`,
    `frac=${Math.round((params.splitFrac ?? 0) * 1e6) / 1e6}`,
    `mode=${params.syncMode ?? 1}`,
  ];
  return parts.join("|");
};

// Robust tail peak estimator
function tailPeakAbs(arr: Float32Array | number[], tail = 0.01) {
  if (!arr || arr.length === 0) return 0;
  const v = Array.from(arr, (x) => Math.abs(x)).filter((x) => x > 0);
  if (v.length === 0) return 0;
  v.sort((a, b) => a - b);
  const n = v.length;
  const start = Math.max(0, Math.floor((1 - Math.max(1e-4, tail)) * (n - 1)));
  const slice = v.slice(start);
  const m = Math.floor(slice.length / 2);
  return slice.length ? slice[m] : v[n - 1];
}

// Quantile estimator using downsampled sort (robust against outliers, cheap)
function quantileSample(arr: Float32Array, q: number, targetSamples = 4096): number {
  const n = arr.length;
  if (!n) return 0;
  const step = Math.max(1, Math.floor(n / targetSamples));
  const sample: number[] = [];
  for (let i = 0; i < n; i += step) sample.push(arr[i]);
  sample.sort((a, b) => a - b);
  if (sample.length === 0) return 0;
  const qi = Math.max(0, Math.min(sample.length - 1, Math.floor(q * (sample.length - 1))));
  return sample[qi];
}

const GREEK_THETA = "\u03B8";
const GREEK_RHO = "\u03C1";
const firstFinite = (...values: Array<unknown>) => {
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

const fmtTimeSmartMs = (ms?: number | null) => {
  if (!Number.isFinite(ms as number) || (ms as number) <= 0) return "--";
  const value = ms as number;
  if (value >= 1) return `${value.toFixed(2)} ms`;
  if (value >= 1e-3) return `${(value * 1e3).toFixed(2)} us`;
  return `${(value * 1e6).toFixed(2)} ns`;
};

const volumeModeFromHull = (mode: Hull3DVolumeViz): VolumeViz => {
  switch (mode) {
    case "theta_gr":
      return 0;
    case "rho_gr":
      return 1;
    default:
      return 2;
  }
};

const hullVizFromVolumeMode = (mode: VolumeViz): Hull3DVolumeViz => {
  switch (mode) {
    case 0:
      return "theta_gr";
    case 1:
      return "rho_gr";
    default:
      return "theta_drive";
  }
};

// Resolve beta from live pipeline or reasonable mode defaults
function resolveBeta(live: any): number {
  const cands = [Number(live?.shipBeta), Number(live?.beta_avg), Number(live?.vShip), Number(live?.beta)];
  for (const v of cands) {
    if (Number.isFinite(v) && Math.abs(v as number) > 1e-6) {
      const b = Math.max(0, Math.min(0.99, v as number));
      return b;
    }
  }
  const m = String(live?.currentMode ?? "").toLowerCase();
  const betaTrans = Number.isFinite(Number(live?.beta_trans)) ? Math.max(0, Math.min(1, Number(live?.beta_trans))) : 1;
  let base: 0.0 | 0.02 | 0.1 | 0.6 | 0.95 | 0.3;
  switch (m) {
    case "standby":   base = 0.0;  break;
    case "taxi":      base = 0.0;  break;
    case "nearzero":  base = 0.02; break;
    case "hover":     base = 0.1;  break;
    case "cruise":    base = 0.6;  break;
    case "emergency": base = 0.95; break;
    default:           base = 0.3;  break;
  }
  const beta = base * betaTrans;
  return Math.max(0, Math.min(0.99, beta));
}

// Mode-aware local RF burst fraction (fraction of dwell ON within a sector)
function resolveBurstFrac(live: any): number {
  // Allow server override if provided
  const override = Number((live as any)?.localBurstFrac ?? (live as any)?.burstFrac);
  if (Number.isFinite(override) && override > 0 && override <= 1) return override;
  const m = String(live?.currentMode ?? "").toLowerCase();
  // Conservative defaults per operational mode
  switch (m) {
    case "standby":
    case "taxi":
    case "nearzero": return 0.01; // minimal RF window
    case "hover":               return 0.02;
    case "cruise":              return 0.05;
    case "emergency":           return 0.10; // aggressive window for response
    default:                      return 0.03;
  }
}

const wrap01 = (value: number) => ((value % 1) + 1) % 1;

const smallestPhaseDelta = (a: number, b: number) => {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  let delta = ((a - b) % 1 + 1) % 1;
  if (delta > 0.5) delta -= 1;
  return delta;
};

const BUS_PHASE_DIFF_THRESHOLD = 0.05;
const MAX_PHASE_HISTORY = 240;
const PHASE_HISTORY_SAMPLE_MS = 120;

// Mode-aware sector width in sectors (Ïƒ_sector). Server override if provided.
function resolveSigmaSectors(live: any): number {
  // Accept broad override keys from server/view
  const overrides = [
    (live as any)?.sigmaSectors,
    (live as any)?.sectorSigmaSectors,
    (live as any)?.sigma_sector,
    (live as any)?.view?.sigmaSectors,
  ];
  for (const cand of overrides) {
    const v = Number(cand);
    if (Number.isFinite(v) && v > 0) return v;
  }
  const m = String(live?.currentMode ?? "").toLowerCase();
  // Conservative defaults per operational mode (in SECTORS)
  switch (m) {
    case "standby":   return 0.20;
    case "taxi":      return 0.28;
    case "nearzero":  return 0.32;
    case "hover":     return 0.45;
    case "cruise":    return 0.70;
    case "emergency": return 1.10;
    default:           return 0.35;
  }
}

type VizMode = 0 | 1 | 2 | 3; // 0=thetaGR, 1=rhoGR, 2=thetaDrive, 3=thetaHull3D
type ShaderMode = "main" | "safe";

function fnum(x: any, d=0) { const n = Number(x); return Number.isFinite(n) ? n : d; }

const VERT = `#version 300 es
layout(location=0) in vec2 a_pos;      // unit grid on x-z plane in [-1,1]^2
uniform vec3  u_axes;                   // hull axes scale (a,b,c) -> x,y,z
uniform float u_sigma;                  // wall thickness sigma
uniform float u_R;                      // bubble radius R
uniform float u_beta;                   // ship beta along +x
uniform int   u_viz;                    // 0 theta_GR, 1 rho_GR, 2 theta_Drive
uniform float u_ampChain;               // gamma_geo^3 * q * gamma_VdB
uniform float u_gate;                   // sqrt(d_FR) * (sector visibility)
uniform float u_gate_view;
uniform float u_duty;                   // Ford-Roman duty factor
uniform float u_yGain;                  // height scale (viewer)
uniform float u_yBias;                  // baseline shift (viewer)
uniform float u_kColor;                 // color scale (viewer)
uniform mat4  u_mvp;
uniform int   u_totalSectors;           // total sectors around bubble
uniform int   u_liveSectors;            // concurrently active sectors
uniform float u_lumpExp;                // contrast exponent for sector gating
uniform float u_sectorCenter;           // scheduler-driven azimuth center (0..1)
uniform float u_sectorSigma;            // Gaussian sigma in normalized azimuth units
uniform float u_sectorFloor;            // baseline fraction to keep shell visible
uniform int   u_syncMode;               // 1=scheduler sync, 0=fallback contiguous
uniform float u_phase01;                // additional phase offset in [0,1) to rotate sector gating
uniform int   u_splitEnabled;           // 1 to enable secondary lobe at +0.5
uniform float u_splitFrac;              // weight of primary lobe (0..1)
uniform float u_vizFloorThetaGR;
uniform float u_vizFloorRhoGR;
uniform float u_vizFloorThetaDrive;

out vec3 v_color;

const float TWO_PI = 6.283185307179586;

float cosh_exp(float x){
  float ex = exp(x);
  float ex_inv = exp(-x);
  return 0.5 * (ex + ex_inv);
}

float tanh_exp(float x){
  float ex = exp(x);
  float ex_inv = exp(-x);
  float denom = max(ex + ex_inv, 1e-6);
  return (ex - ex_inv) / denom;
}

float sech2(float x){
  float c = cosh_exp(x);
  return 1.0 / max(c * c, 1e-6);
}

float d_topHat_dr(float r, float sigma, float R) {
  float den = max(1e-6, 2.0 * tanh_exp(sigma * R));
  return sigma * (sech2(sigma*(r+R)) - sech2(sigma*(r-R))) / den;
}

vec3 diverge(float x) {
  vec3 c1 = vec3(0.06,0.25,0.98);
  vec3 c2 = vec3(0.94,0.94,0.95);
  vec3 c3 = vec3(0.95,0.30,0.08);
  float t = clamp(0.5 + 0.5*x, 0.0, 1.0);
  return (t < 0.5) ? mix(c1,c2,t/0.5) : mix(c2,c3,(t-0.5)/0.5);
}

vec3 purpleMap(float s){
  float t = clamp(-s, 0.0, 1.0);
  vec3 base = vec3(0.92,0.92,0.98);
  vec3 purp = vec3(0.58,0.25,0.93);
  return mix(base, purp, t);
}

void main(){
  float domainScale = u_R * 1.3;
  vec2 grid = a_pos;
  vec3 pView = vec3(grid.x * u_axes.x * domainScale, 0.0, grid.y * u_axes.z * domainScale);
  vec3 pMetric = vec3(
    pView.x / max(u_axes.x, 1e-6),
    0.0,
    pView.z / max(u_axes.z, 1e-6)
  );
  float rs = max(length(pMetric), 1e-6);

  float dfdr = d_topHat_dr(rs, u_sigma, u_R);
  vec3 dir = pMetric / rs;
  float dfx = dfdr * dir.x;
  float dfy = dfdr * dir.y;
  float dfz = dfdr * dir.z;

  float theta_gr = u_beta * dfx;

  float Kxx = -u_beta * dfx;
  float Kxy = -0.5 * u_beta * dfy;
  float Kxz = -0.5 * u_beta * dfz;
  float K2 = Kxx*Kxx;
  float KijKij = Kxx*Kxx + 2.0*Kxy*Kxy + 2.0*Kxz*Kxz;
  const float INV16PI = 0.019894367886486918;
  float rho_gr = (K2 - KijKij) * INV16PI;

  float gateWF = 1.0;
  if (u_viz == 2) {
    float ang = atan(pView.z, pView.x);
    float a01 = (ang < 0.0 ? ang + TWO_PI : ang) / TWO_PI;
    // Apply viewer-controlled phase offset to rotate lobe between contraction (blue) and expansion (red)
    a01 = fract(a01 + u_phase01);
    int total = max(1, u_totalSectors);
    int live  = max(1, min(u_liveSectors, total));
    // Effective active fraction acknowledges both scheduler concurrency and FR duty
    float fActive = max(max(1.0/float(total), float(live) / float(total)), max(0.0, u_duty));
    float floorFrac = clamp(u_sectorFloor, 0.0, 0.99);
    float peakFrac  = 1.0 - floorFrac;
    float wNorm = 1.0;
    if (u_syncMode == 1) {
      // Gaussian lobe centered at u_sectorCenter with sigma in 0..1 azimuth units (wrapped)
      float center = u_sectorCenter - floor(u_sectorCenter);
      float sigma01 = max(1e-4, u_sectorSigma);
      float dist = abs(a01 - center);
      dist = min(dist, 1.0 - dist);
      float g1 = exp(-0.5 * (dist * dist) / (sigma01 * sigma01));
      float g = g1;
      if (u_splitEnabled == 1) {
        float center2 = fract(center + 0.5);
        float dist2 = abs(a01 - center2);
        dist2 = min(dist2, 1.0 - dist2);
        float g2 = exp(-0.5 * (dist2 * dist2) / (sigma01 * sigma01));
        float wA = clamp(u_splitFrac, 0.0, 1.0);
        g = g1 * wA + g2 * (1.0 - wA);
      }
      // Average Gaussian over the ring (approx) to keep total power consistent
      float avgG = min(1.0, sigma01 * 2.5066283);
      float gNorm = min(g / max(avgG, 1e-4), 12.0);
      wNorm = floorFrac + peakFrac * gNorm;
    } else {
      // Contiguous sector block fallback (stable on all drivers)
      int sIdx = int(floor(a01 * float(total)));
      float on = (sIdx < live) ? 1.0 : 0.0;
      float frac = max(1.0/float(total), float(live) / float(total));
      float norm = (frac > 1e-9) ? min(on / frac, 12.0) : on;
      wNorm = floorFrac + peakFrac * norm;
    }
    // Sector visibility boost (reverted): remove normalization by fActive to restore prior gain behavior
    gateWF = pow(sqrt(max(0.0, wNorm)), max(0.5, u_lumpExp));
  }
  float theta_drive = theta_gr * u_ampChain * u_gate_view * gateWF;

  float s_raw = (u_viz == 0) ? theta_gr : ((u_viz == 1) ? rho_gr : theta_drive);
  float floorV = (u_viz == 0) ? u_vizFloorThetaGR : ((u_viz == 1) ? u_vizFloorRhoGR : u_vizFloorThetaDrive);
  float s = s_raw;
  if (floorV > 0.0) {
    float mag = abs(s_raw);
    if (mag < floorV) {
      s = (s_raw < 0.0) ? -floorV : floorV;
    }
  }

  float y = (s - u_yBias) * u_yGain;
  vec4 pos = vec4(pView.x, y, pView.z, 1.0);
  gl_Position = u_mvp * pos;

  float c = s * u_kColor;
  if (u_viz == 1){
    v_color = purpleMap(c);
  } else {
    v_color = diverge(clamp(c, -1.0, 1.0));
  }
}
`;

const FRAG = `#version 300 es
precision highp float;
in vec3 v_color;
out vec4 outColor;
void main(){
  outColor = vec4(v_color, 1.0);
}
`;

const SAFE_VERT = `#version 300 es
layout(location=0) in vec2 a_pos;
uniform mat4 u_mvp;
out vec3 v_color;
void main(){
  vec3 pos = vec3(a_pos.x, 0.0, a_pos.y);
  gl_Position = u_mvp * vec4(pos, 1.0);
  float shade = 0.35 + 0.35 * (a_pos.x * 0.5 + 0.5);
  float accent = 0.35 + 0.35 * (a_pos.y * 0.5 + 0.5);
  v_color = vec3(shade, accent, 0.7 + 0.2 * a_pos.y);
}
`;

const SAFE_FRAG = `#version 300 es
precision highp float;
in vec3 v_color;
out vec4 outColor;
void main(){
  outColor = vec4(v_color, 1.0);
}
`;

type MetricTooltipBadgeProps = {
  label: string;
  value: string;
  description: React.ReactNode;
  className?: string;
};

function MetricTooltipBadge({ label, value, description, className }: MetricTooltipBadgeProps) {
  const [manualOpen, setManualOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setManualOpen((prev) => {
      const next = !prev;
      if (!next) {
        setAutoOpen(false);
      }
      return next;
    });
  };

  const handleOpenChange = (next: boolean) => {
    setAutoOpen(next);
    if (!next) {
      setManualOpen(false);
    }
  };

  const open = manualOpen || autoOpen;

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange} disableHoverableContent>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className={cn(
            "px-2 py-1 rounded text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
            "flex items-center gap-1",
            className
          )}
          aria-label={`${label} details`}
        >
          <span className="font-medium text-slate-300">{label}:</span>
          <span className="font-mono text-[0.75rem] font-semibold leading-none">{value}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs text-left bg-slate-950/95 text-slate-100 border border-slate-800 shadow-lg"
      >
        <p className="text-sm font-semibold text-slate-50">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-200">{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Lightweight Hull3D debug toggles (Off / Metric ring / Grayscale volume)
function Hull3DDebugToggles({
  surfaceOn,
  setSurfaceOn,
  gateSource,
  setGateSource,
  gateViewEnabled,
  setGateViewEnabled,
  forceFlatGate,
  setForceFlatGate,
  onGatePreset,
}: {
  surfaceOn: boolean;
  setSurfaceOn: React.Dispatch<React.SetStateAction<boolean>>;
  gateSource: HullGateSource;
  setGateSource: React.Dispatch<React.SetStateAction<HullGateSource>>;
  gateViewEnabled: boolean;
  setGateViewEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  forceFlatGate: boolean;
  setForceFlatGate: React.Dispatch<React.SetStateAction<boolean>>;
  onGatePreset?: () => void;
}) {
  const [ringOn, setRingOn] = useState<boolean>(() => {
    const w: any = (typeof window !== "undefined") ? window : {};
    if (w.__hullShowRingOverlay === undefined) return true;
    return !!w.__hullShowRingOverlay;
  });
  const [grayOn, setGrayOn] = useState<boolean>(() => {
    const w: any = (typeof window !== "undefined") ? window : {};
    return !!w.__hullDebugGrayscale || w.__hullDebugMode === 3;
  });
  const [ringMode, setRingMode] = useState<number>(() => {
    const w: any = (typeof window !== "undefined") ? window : {};
    return Number.isInteger(w.__hullRingOverlayMode) ? (w.__hullRingOverlayMode | 0) : 0;
  });
  const [ringBlend, setRingBlend] = useState<number>(() => {
    const w: any = (typeof window !== "undefined") ? window : {};
    const v = +w.__hullRingOverlayBlend;
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.25;
  });
  const [ringAlpha, setRingAlpha] = useState<number>(() => {
    const w: any = (typeof window !== "undefined") ? window : {};
    const v = +w.__hullRingOverlayAlpha;
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.6;
  });
  const [ringWidth, setRingWidth] = useState<number>(() => {
    const w: any = (typeof window !== "undefined") ? window : {};
    const v = +w.__hullRingOverlayWidth;
    return Number.isFinite(v) ? Math.max(0.002, Math.min(0.12, v)) : 0.03;
  });
  const [ringField, setRingField] = useState<number>(() => {
    const w: any = (typeof window !== "undefined") ? window : {};
    return Number.isInteger(w.__hullRingOverlayField) ? (w.__hullRingOverlayField | 0) : -1;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      setSurfaceOn(true);
      setRingOn(true);
    };
    window.addEventListener("helix:drive-card-preset" as any, handler as any);
    return () => window.removeEventListener("helix:drive-card-preset" as any, handler as any);
  }, [setSurfaceOn, setRingOn]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__hullShowRingOverlay = ringOn;
    }
  }, [ringOn]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__hullDebugGrayscale = grayOn;
      // Maintain backward compatibility with existing u_debugMode==3
      (window as any).__hullDebugMode = grayOn ? 3 : 0;
    }
  }, [grayOn]);
  useEffect(() => {
    if (typeof window !== "undefined") (window as any).__hullRingOverlayMode = ringMode;
  }, [ringMode]);
  useEffect(() => {
    if (typeof window !== "undefined") (window as any).__hullRingOverlayBlend = ringBlend;
  }, [ringBlend]);
  useEffect(() => {
    if (typeof window !== "undefined") (window as any).__hullRingOverlayAlpha = ringAlpha;
  }, [ringAlpha]);
  useEffect(() => {
    if (typeof window !== "undefined") (window as any).__hullRingOverlayWidth = ringWidth;
  }, [ringWidth]);
  useEffect(() => {
    if (typeof window !== "undefined") (window as any).__hullRingOverlayField = ringField;
  }, [ringField]);
  return (
    <CurvatureVoxProvider quality="medium" refetchMs={80}>
      <div className="flex items-center gap-1 text-[0.65rem] text-slate-200">
      <span className="uppercase tracking-wide text-slate-400">Debug</span>
      <button
        type="button"
        className={cn("rounded px-2 py-1", ringOn ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-200")}
        onClick={() => setRingOn((v) => !v)}
        title="Toggle thin metric ring overlay around r˜R"
      >Ring Overlay</button>
      <button
        type="button"
        className={cn("rounded px-2 py-1", surfaceOn ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-200")}
        onClick={() => setSurfaceOn(!surfaceOn)}
        title="Toggle the hull surface sheet overlay in the 3D viewer"
      >Surface</button>
      <button
        type="button"
        className={cn("rounded px-2 py-1", grayOn ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-200")}
        onClick={() => setGrayOn((v) => !v)}
        title="Toggle grayscale rendering of |?_drive| to highlight the 3D ellipse"
      >Grayscale</button>
      <button
        type="button"
        className={cn("rounded px-2 py-1", (!ringOn && !grayOn && !surfaceOn) ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-200")}
        onClick={() => { setRingOn(false); setGrayOn(false); setSurfaceOn(false); }}
        title="Clear all debug overlays"
      >Clear</button>
      {ringOn && (
        <div className="ml-2 flex items-center gap-2 rounded bg-slate-800/50 px-2 py-1">
          <label className="flex items-center gap-1">
            <span className="text-slate-400">Ring</span>
            <select
              className="rounded bg-slate-900 px-1 py-0.5"
              value={ringMode}
              onChange={(e) => setRingMode(parseInt(e.target.value, 10))}
              title="Locator = thin shell; Weighted = instant/EMA weights; Field = color by selected field"
            >
              <option value={0}>Locator</option>
              <option value={1}>Weighted</option>
              <option value={2}>Field coded</option>
            </select>
          </label>
          {ringMode === 1 && (
            <label className="flex items-center gap-1">
              <span className="text-slate-400">Blend</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={ringBlend}
                onChange={(e) => setRingBlend(parseFloat(e.target.value))}
                className="w-24 accent-emerald-500"
              />
              <span className="font-mono text-slate-300">{Math.round(ringBlend * 100)}%</span>
            </label>
          )}
          <label className="flex items-center gap-1">
            <span className="text-slate-400">Alpha</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={ringAlpha}
              onChange={(e) => setRingAlpha(parseFloat(e.target.value))}
              className="w-20 accent-emerald-500"
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-slate-400">Width</span>
            <input
              type="range"
              min={0.005}
              max={0.1}
              step={0.005}
              value={ringWidth}
              onChange={(e) => setRingWidth(parseFloat(e.target.value))}
              className="w-20 accent-emerald-500"
            />
          </label>
          {ringMode === 2 && (
            <label className="flex items-center gap-1">
              <span className="text-slate-400">Field</span>
              <select
                className="rounded bg-slate-900 px-1 py-0.5"
                value={ringField}
                onChange={(e) => setRingField(parseInt(e.target.value, 10))}
                title="Auto follows the active volume field selection"
              >
                <option value={-1}>Auto</option>
                <option value={0}>Theta GR</option>
                <option value={1}>Rho GR</option>
                <option value={2}>Theta Drive</option>
              </select>
            </label>
          )}
        </div>
      )}
      <div className="ml-2 flex flex-wrap items-center gap-2 rounded bg-slate-800/50 px-2 py-1">
        <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
          <span className="text-slate-400">Gate source</span>
          <select
            className="rounded bg-slate-900 px-1 py-0.5"
            value={gateSource}
            onChange={(e) => setGateSource(e.target.value as HullGateSource)}
            title="Choose schedule-only, blanket-only, or their product"
          >
            <option value="schedule">Schedule</option>
            <option value="blanket">Blanket</option>
            <option value="combined">Schedule × Blanket</option>
          </select>
        </label>
        <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
          <span className="text-slate-400">Gate view</span>
          <input
            type="checkbox"
            checked={gateViewEnabled}
            onChange={(e) => setGateViewEnabled(e.target.checked)}
            className="accent-emerald-500"
            title="Keep gate visualization active even when duty is tiny"
          />
        </label>
        <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
          <span className="text-slate-400">Flat gate</span>
          <input
            type="checkbox"
            checked={forceFlatGate}
            onChange={(e) => setForceFlatGate(e.target.checked)}
            className="accent-amber-500"
            title="Force a uniform gate for A/B against scheduler/blanket"
          />
        </label>
        <button
          type="button"
          className="rounded bg-slate-700 px-2 py-1 text-[0.65rem] text-slate-100 hover:bg-slate-600"
          onClick={() => {
            setSurfaceOn(true);
            setRingOn(true);
            onGatePreset?.();
          }}
          title="Set θ_drive viz, enable gate view, and blend schedule×blanket"
        >
          Drive preset
        </button>
      </div>
    </div>
  </CurvatureVoxProvider>
  );
}

function makeGrid(res: number) {
  // Degenerate triangle strips per row in [-1,1]^2
  const verts: number[] = [];
  for (let j=0; j<res-1; j++){
    for (let i=0; i<res; i++){
      const x = -1 + 2*(i/(res-1));
      const z0 = -1 + 2*(j/(res-1));
      const z1 = -1 + 2*((j+1)/(res-1));
      verts.push(x, z0,  x, z1);
    }
  }
  return new Float32Array(verts);
}

export default function AlcubierrePanel({
  className,
  onCanvasReady,
  overlayHudEnabled = false,
  onPlanarVizModeChange,
  vizIntent,
}: AlcubierrePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext|null>(null);
  const hullRendererRef = useRef<Hull3DRenderer | null>(null);
  const hullStateRef = useRef<Hull3DRendererState | null>(null);
  const hullConfigRef = useRef<{ mode: Hull3DRendererMode; blend: number }>({ mode: "instant", blend: 0 });
  // Hull 3D health + diagnostics UI state
  const [hullHealth, setHullHealth] = useState<null | { pass: number; fail: number; results: Record<string, { pass: boolean; luma: number; alpha: number }> }>(null);
  const [hullDiagMsg, setHullDiagMsg] = useState<string | null>(null);
  const hullQualityOverridesRef = useRef<Hull3DQualityOverrides>({});
  const hullRafRef = useRef<number>(0);
  const progRef = useRef<WebGLProgram|null>(null);
  const vboRef  = useRef<WebGLBuffer|null>(null);
  const vcountRef = useRef<number>(0); // DEBUG: track vertex count

  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayDomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onCanvasReady) return;
    onCanvasReady(canvasRef.current ?? null, overlayCanvasRef.current ?? null, overlayDomRef.current ?? null);
    return () => {
      onCanvasReady(null, null, null);
    };
  }, [onCanvasReady]);
  const lastDriveLogRef = useRef(0);

const [planarVizMode, setPlanarVizMode] = useState<VizMode>(3); // 0 theta_GR, 1 rho_GR, 2 theta_Drive, 3 theta_Hull3D
  useEffect(() => {
    onPlanarVizModeChange?.(planarVizMode);
  }, [planarVizMode, onPlanarVizModeChange]);
  const [shaderMode, setShaderMode] = useState<ShaderMode>("main");
  const [glError, setGlError] = useState<string | null>(null);
  // Track if the user has manually selected a planarVizMode so we don't override later
  const [userVizLocked, setUserVizLocked] = useState(false);
  const [syncScheduler, setSyncScheduler] = useState(true);
  const [vizIntentEnabled, setVizIntentEnabled] = useState(true);
  const [vizRise, setVizRise] = useState(0);
  const [vizPlanar, setVizPlanar] = useState(0);
const externalVizRise = vizIntent?.rise;
const externalVizPlanar = vizIntent?.planar;
const isStressWindowOpen = useDesktopStore((s) => Boolean(s.windows["stress-map"]?.isOpen));
const openDesktopPanel = useDesktopStore((s) => s.open);
const closeDesktopPanel = useDesktopStore((s) => s.close);

  useEffect(() => {
    if (typeof externalVizRise === "number") {
      setVizRise((prev) =>
        Math.abs(prev - externalVizRise) > 1e-3 ? externalVizRise : prev
      );
    }
    if (typeof externalVizPlanar === "number") {
      setVizPlanar((prev) =>
        Math.abs(prev - externalVizPlanar) > 1e-3 ? externalVizPlanar : prev
      );
    }
  }, [externalVizRise, externalVizPlanar]);

const [hullMode, setHullMode] = useState<Hull3DRendererMode>("instant");
const [hullBlend, setHullBlend] = useState(0);
const [hullVolumeVizLive, setHullVolumeVizLive] = useState<Hull3DVolumeViz>("theta_drive");
const [hullVolumeDomain, setHullVolumeDomain] = useState<Hull3DVolumeDomain>("wallBand");
const [bubbleBoundsMode, setBubbleBoundsMode] = useState<"tight" | "wide">("tight");
const [bubbleOpacityHi, setBubbleOpacityHi] = useState(0.35);
const bubbleOpacityWindow = useMemo<[number, number]>(() => {
  const hi = clamp(bubbleOpacityHi, 0.05, 1.2);
  const lo = Math.max(0.02, Math.min(hi * 0.55, hi));
  return [lo, hi];
}, [bubbleOpacityHi]);
const [hullGeometry, setHullGeometry] = useState<HullGeometryMode>("ellipsoid");
const [autoHullGeometryReason, setAutoHullGeometryReason] = useState<string | null>(null);
const [gateSource, setGateSource] = useState<HullGateSource>(() => {
  const w: any = typeof window !== "undefined" ? window : {};
  const raw = w.__hullGateSource;
  return raw === "schedule" || raw === "blanket" || raw === "combined" ? raw : "combined";
});
const [gateViewEnabled, setGateViewEnabled] = useState<boolean>(() => {
  const w: any = typeof window !== "undefined" ? window : {};
  if (typeof w.__hullGateViewEnabled === "boolean") return !!w.__hullGateViewEnabled;
  return true;
});
const [forceFlatGate, setForceFlatGate] = useState<boolean>(() => {
  const w: any = typeof window !== "undefined" ? window : {};
  return !!w.__hullForceFlatGate;
});
useEffect(() => {
  if (hullVolumeDomain === "bubbleBox" && hullVolumeVizLive !== "theta_drive") {
    setHullVolumeVizLive("theta_drive");
  }
}, [hullVolumeDomain, hullVolumeVizLive]);
const geometryUserOverrideRef = useRef(false);
const [showHullSectorRing, setShowHullSectorRing] = useState(false);
const [showHullSurfaceOverlay, setShowHullSurfaceOverlay] = useState<boolean>(() => {
  if (typeof window === "undefined") return false;
  const w: any = window;
  if (typeof w.__hullShowSurfaceOverlay === "boolean") return !!w.__hullShowSurfaceOverlay;
  return false;
});
const [showWireframeOverlay, setShowWireframeOverlay] = useState(true);
const [wireframeLod, setWireframeLod] = useState<"preview" | "high">("preview");
const [wireframePatches, setWireframePatches] = useState<WireframeContactPatch[]>([]);
const [useFieldProbeOverlay, setUseFieldProbeOverlay] = useState(false);
const [latticeModeEnabled, setLatticeModeEnabled] = useState<boolean>(() => {
  if (typeof window === "undefined") return true;
  const w: any = window;
  if (typeof w.__hullLatticeModeEnabled === "boolean") return !!w.__hullLatticeModeEnabled;
  return true;
});
const [latticeRequireSdf, setLatticeRequireSdf] = useState<boolean>(() => {
  if (typeof window === "undefined") return false;
  const w: any = window;
  if (typeof w.__hullLatticeRequireSdf === "boolean") return !!w.__hullLatticeRequireSdf;
  return false;
});
const [showLatticeDiagnostics, setShowLatticeDiagnostics] = useState(false);
const [followHullPhase, setFollowHullPhase] = useState(true);
const [cardCameraPreset, setCardCameraPreset] = useState<CardCameraPreset>("threeQuarterFront");
const ONE_G_MS2 = 9.80665;
const [betaOverlayEnabled, setBetaOverlayEnabled] = useState(false);
const [betaTargetMs2, setBetaTargetMs2] = useState(ONE_G_MS2);
const [betaComfortMs2, setBetaComfortMs2] = useState(0.4 * ONE_G_MS2);
const [showKHeatOverlay, setShowKHeatOverlay] = useState(true);
const [showThetaIsoOverlay, setShowThetaIsoOverlay] = useState(true);
const [showFordRomanBar, setShowFordRomanBar] = useState(true);
const [showSectorArcOverlay, setShowSectorArcOverlay] = useState(true);
const [showTiltOverlay, setShowTiltOverlay] = useState<boolean>(() => {
  if (typeof window === "undefined") return true;
  const w: any = window;
  if (typeof w.__hullShowTiltOverlay === "boolean") return !!w.__hullShowTiltOverlay;
  return true;
});
const [showGreensOverlay, setShowGreensOverlay] = useState(false);
const tiltFromBusRef = useRef<TiltDirective | null>(null);
const [tiltBusVersion, bumpTiltVersion] = useReducer((x: number) => x + 1, 0);
const wireframePatchTick = useRef(0);
const wireframeBudgets = VIEWER_WIREFRAME_BUDGETS;
const [curvatureOverlay, setCurvatureOverlay] = useState<{
  enabled: boolean;
  gain: number;
  alpha: number;
  palette: CurvaturePalette;
  showQIMargin: boolean;
}>({
  enabled: false,
  gain: 1.0,
  alpha: 0.45,
  palette: "diverging",
  showQIMargin: false,
});
useEffect(() => {
  const id = subscribe("hull3d:overlay:curvature", (payload: any) => {
    if (!payload || typeof payload !== "object") return;
    setCurvatureOverlay((prev) => {
      const enabled = Boolean((payload as any).enabled);
      const gainRaw = Number((payload as any).gain);
      const alphaRaw = Number((payload as any).alpha);
      const paletteRaw = (payload as any).palette;
      const showMarginRaw = (payload as any).showQIMargin;
      return {
        enabled,
        gain: Number.isFinite(gainRaw) ? gainRaw : prev.gain,
        alpha: Number.isFinite(alphaRaw) ? Math.max(0, Math.min(1, alphaRaw)) : prev.alpha,
        palette: normalizeCurvaturePalette(paletteRaw, prev.palette),
        showQIMargin: Boolean(showMarginRaw),
      };
    });
  });
  return () => {
    unsubscribe(id);
  };
}, []);

useEffect(() => {
  const handlerId = subscribe("hull3d:tilt", (payload: any) => {
    let nextDirective: TiltDirective | null = null;
    if (payload && typeof payload === "object" && payload.enabled) {
      const dirRaw = (payload as any).dir;
      if (Array.isArray(dirRaw) && dirRaw.length >= 2) {
        const dx = Number(dirRaw[0]);
        const dy = Number(dirRaw[1]);
        if (Number.isFinite(dx) && Number.isFinite(dy)) {
          const magnitudeRaw = Number((payload as any).magnitude);
          const alphaRaw = Number((payload as any).alpha);
          const gainRaw = Number((payload as any).gain); // [tilt-gain]
          const gainModeRaw = (payload as any).gainMode; // [tilt-gain]
          nextDirective = {
            enabled: true,
            dir: [dx, dy],
            magnitude: clamp(Number.isFinite(magnitudeRaw) ? magnitudeRaw : 0, 0, 1),
            alpha: Number.isFinite(alphaRaw) ? clamp(alphaRaw, 0, 1) : undefined,
            source: typeof (payload as any).source === "string" ? (payload as any).source : undefined,
            ...(Number.isFinite(gainRaw) ? { gain: gainRaw } : {}), // [tilt-gain]
            ...(gainModeRaw === "manual" || gainModeRaw === "curvature"
              ? { gainMode: gainModeRaw as "manual" | "curvature" }
              : {}), // [tilt-gain]
          };
        }
      }
    }

    const prev = tiltFromBusRef.current;
    const prevGain = typeof prev?.gain === "number" ? prev.gain : undefined; // [tilt-gain]
    const nextGain = typeof nextDirective?.gain === "number" ? nextDirective.gain : undefined; // [tilt-gain]
    const gainClose = // [tilt-gain]
      (prevGain === undefined && nextGain === undefined) ||
      (prevGain !== undefined && nextGain !== undefined && Math.abs(prevGain - nextGain) < 1e-4); // [tilt-gain]
    const prevGainMode = prev?.gainMode ?? "__none__"; // [tilt-gain]
    const nextGainMode = nextDirective?.gainMode ?? "__none__"; // [tilt-gain]
    const same =
      (prev === null && nextDirective === null) ||
      (prev !== null &&
        nextDirective !== null &&
        Math.abs(prev.dir[0] - nextDirective.dir[0]) < 1e-4 &&
        Math.abs(prev.dir[1] - nextDirective.dir[1]) < 1e-4 &&
        Math.abs(prev.magnitude - nextDirective.magnitude) < 1e-4 &&
        Math.abs((prev.alpha ?? 0.85) - (nextDirective.alpha ?? 0.85)) < 1e-4 &&
        gainClose && // [tilt-gain]
        prevGainMode === nextGainMode); // [tilt-gain]

    if (!same) {
      tiltFromBusRef.current = nextDirective;
      if (typeof window !== "undefined") {
        (window as any).__tiltBusLast = nextDirective;
      }
      bumpTiltVersion();
    }
  });

  return () => {
    unsubscribe(handlerId);
  };
}, []);

const busTiltDirective = useMemo<TiltDirective | null>(() => tiltFromBusRef.current, [tiltBusVersion]);

const liveVolumeMode = useMemo(() => volumeModeFromHull(hullVolumeVizLive), [hullVolumeVizLive]);
const setLiveVolumeMode = useCallback((mode: VolumeViz) => {
  const nextHull = hullVizFromVolumeMode(mode);
  setHullVolumeVizLive((prev) => (prev === nextHull ? prev : nextHull));
}, []);
const handleVolumeModeChange = useCallback((mode: VolumeViz) => {
  setLiveVolumeMode(mode);
}, [setLiveVolumeMode]);
const handleHullGeometryChange = useCallback((mode: HullGeometryMode) => {
  geometryUserOverrideRef.current = true;
  setHullGeometry(mode);
  setAutoHullGeometryReason(null);
}, []);
const setSharedPhase = useHull3DSharedStore((s) => s.setPhase);
const setSharedSampling = useHull3DSharedStore((s) => s.setSampling);
const setSharedPhysics = useHull3DSharedStore((s) => s.setPhysics);
const setSharedCompliance = useHull3DSharedStore((s) => s.setCompliance);
const setSharedSector = useHull3DSharedStore((s) => s.setSector);
const setSharedPalette = useHull3DSharedStore((s) => s.setPalette);
const setSharedMeshOverlay = useHull3DSharedStore((s) => s.setMeshOverlay);
const setSharedLattice = useHull3DSharedStore((s) => s.setLattice);
const setViewer = useHull3DSharedStore((s) => s.setViewer);
const overlayPrefs = useHull3DSharedStore((s) => s.overlayPrefs, shallow);
const setOverlayPrefs = useHull3DSharedStore((s) => s.setOverlayPrefs);
const sharedHullState = useHull3DSharedStore(
  (s) => ({
    phase: s.phase,
    sampling: s.sampling,
    physics: s.physics,
    compliance: s.compliance,
    sector: s.sector,
    palette: s.palette,
    lattice: s.lattice,
  }),
  shallow
);
const sharedPhase = sharedHullState.phase;
const sharedSampling = sharedHullState.sampling;
const sharedPhysicsState = sharedHullState.physics;
const sharedComplianceState = sharedHullState.compliance;
const sharedSectorState = sharedHullState.sector;
const sharedPaletteState = sharedHullState.palette;
const sharedLatticeState = sharedHullState.lattice;

useEffect(() => {
  if (typeof window === "undefined") return;
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<any>).detail ?? {};
    if (!detail || typeof detail !== "object") return;
    setLatticeModeEnabled(true);
    if ((detail as any).requireSdf) setLatticeRequireSdf(true);
    const basis = (detail as any).basis as HullBasisResolved | undefined;
    const dims = (detail as any).hullDims as { Lx_m: number; Ly_m: number; Lz_m: number } | undefined;
    setViewer({
      bounds: {
        ...(basis ? { basis } : {}),
        ...(dims
          ? {
              axes: [dims.Lx_m / 2, dims.Ly_m / 2, dims.Lz_m / 2] as [number, number, number],
            }
          : {}),
      },
    });
  };
  window.addEventListener("helix:auto-view-preview" as any, handler as any);
  return () => window.removeEventListener("helix:auto-view-preview" as any, handler as any);
}, [setViewer]);
const latticeSdfStats = useMemo(() => {
  const sdf = sharedLatticeState?.sdf;
  if (!sdf?.stats) return null;
  const voxPct = Math.max(0, Math.min(1, sdf.stats.voxelCoverage)) * 100;
  const triPct = Math.max(0, Math.min(1, sdf.stats.triangleCoverage)) * 100;
  const maxD = sdf.stats.maxAbsDistance;
  const band = sdf.band;
  return {
    voxPct,
    triPct,
    maxD,
    band,
    cacheHit: !!sdf.cacheHit,
    label: `SDF ${voxPct.toFixed(1)}% vox · ${triPct.toFixed(1)}% tris · |d|max ${maxD.toFixed(3)} m${band ? ` / band ${band.toFixed(3)} m` : ""}${sdf.cacheHit ? " (cache)" : ""}`,
  };
}, [sharedLatticeState?.sdf]);
const latticeVolumeStats = useMemo(() => {
  const vol = sharedLatticeState?.volume;
  if (!vol?.stats) return null;
  const covPct = Math.max(0, Math.min(1, vol.stats.coverage)) * 100;
  const maxGate = vol.stats.maxGate ?? 0;
  const maxDrive = vol.stats.maxDrive ?? 0;
  return {
    covPct,
    maxGate,
    maxDrive,
    budgetHit: !!vol.stats.budgetHit,
    cacheHit: !!vol.cacheHit,
    hashShort: typeof vol.hash === "string" ? vol.hash.slice(0, 8) : null,
    label: `VOL ${covPct.toFixed(1)}% cov · gate ${maxGate.toFixed(3)} · drive ${maxDrive.toFixed(3)}${vol.stats.budgetHit ? " (budget)" : ""}${vol.cacheHit ? " (cache)" : ""}`,
  };
}, [sharedLatticeState?.volume]);
const latticeFrameStats = useMemo(() => {
  const frame = sharedLatticeState?.frame;
  if (!frame) return null;
  const voxels = Math.max(1, frame.voxelCount);
  const budget = frame.budget?.maxVoxels ?? 0;
  const pct = budget > 0 ? (voxels / budget) * 100 : null;
  return {
    dims: frame.dims,
    voxelSize_m: frame.voxelSize_m,
    voxelCount: voxels,
    budgetMaxVoxels: budget,
    budgetPct: pct,
    clampReasons: frame.clampReasons ?? [],
  };
}, [sharedLatticeState?.frame]);

  type LatticeGpuStatus = ReturnType<(typeof Hull3DRenderer)["prototype"]["getLatticeGpuStatus"]>;

  const [latticeVolumeDeterminismHash, setLatticeVolumeDeterminismHash] = useState<string | null>(null);
  const [latticeSdfDeterminismHash, setLatticeSdfDeterminismHash] = useState<string | null>(null);
  const [latticeGpuStatus, setLatticeGpuStatus] = useState<LatticeGpuStatus | null>(null);
  const latticeHealthKeyRef = useRef<string>("");
  const latticeFallbackReasonRef = useRef<string | null>(null);
  const overlayTelemetryKeyRef = useRef<string>("");
  const latticeAutoTuneRef = useRef<{
    lastFrameKey?: string | null;
    lastSdfKey?: string | null;
    capsApplied?: boolean;
  }>({});
  const latticeUploadTelemetry = (latticeGpuStatus as any)?.runtime?.telemetry ?? null;

  useEffect(() => {
    let cancelled = false;
    const volume = sharedLatticeState?.volume ?? null;
    const volumeHash = typeof volume?.hash === "string" ? volume.hash : null;
    if (!latticeModeEnabled || !volume || !volumeHash) {
      setLatticeVolumeDeterminismHash((prev) => (prev ? null : prev));
      return;
    }
    hashLatticeVolumeDeterminism(volume)
      .then((digest) => {
        if (cancelled) return;
        setLatticeVolumeDeterminismHash((prev) => (prev === digest ? prev : digest));
      })
      .catch((error) => {
        console.warn("[Hull3D][lattice] Failed to hash volume determinism probe", error);
        if (!cancelled) setLatticeVolumeDeterminismHash(null);
      });
    return () => {
      cancelled = true;
    };
  }, [latticeModeEnabled, sharedLatticeState?.volume?.hash]);

  useEffect(() => {
    let cancelled = false;
    const sdf = sharedLatticeState?.sdf ?? null;
    const sdfKey = typeof sdf?.key === "string" ? sdf.key : null;
    if (!latticeModeEnabled || !sdf || !sdfKey) {
      setLatticeSdfDeterminismHash((prev) => (prev ? null : prev));
      return;
    }
    hashLatticeSdfDeterminism(sdf)
      .then((digest) => {
        if (cancelled) return;
        setLatticeSdfDeterminismHash((prev) => (prev === digest ? prev : digest));
      })
      .catch((error) => {
        console.warn("[Hull3D][lattice] Failed to hash SDF determinism probe", error);
        if (!cancelled) setLatticeSdfDeterminismHash(null);
      });
    return () => {
      cancelled = true;
    };
  }, [latticeModeEnabled, sharedLatticeState?.sdf?.key]);

  useEffect(() => {
    if (!latticeModeEnabled || typeof window === "undefined") {
      setLatticeGpuStatus((prev) => (prev ? null : prev));
      return;
    }

    const volumeHash = sharedLatticeState?.volume?.hash ?? null;
    const sdfKey = latticeRequireSdf ? sharedLatticeState?.sdf?.key ?? null : null;
    let timer: number | null = null;

    const tick = () => {
      const renderer = hullRendererRef.current;
      if (!renderer) {
        setLatticeGpuStatus((prev) => (prev ? null : prev));
        return;
      }
      const status = renderer.getLatticeGpuStatus({ volumeHash, sdfKey });
      setLatticeGpuStatus((prev) => {
        if (!prev) return status;
        const capsPrev = (prev as any).caps;
        const capsNext = (status as any).caps;
        const sameCaps =
          !!capsPrev &&
          !!capsNext &&
          capsPrev.maxTextureSize === capsNext.maxTextureSize &&
          capsPrev.max3DTextureSize === capsNext.max3DTextureSize &&
          capsPrev.supportsColorFloat === capsNext.supportsColorFloat &&
          capsPrev.supportsFloatLinear === capsNext.supportsFloatLinear &&
          capsPrev.supportsHalfFloatLinear === capsNext.supportsHalfFloatLinear;
        const runtimePrev = (prev as any).runtime;
        const runtimeNext = (status as any).runtime;
        const sameRuntime =
          !!runtimePrev &&
          !!runtimeNext &&
          runtimePrev.hasLatticeVolume === runtimeNext.hasLatticeVolume &&
          runtimePrev.backend === runtimeNext.backend &&
          runtimePrev.formatLabel === runtimeNext.formatLabel &&
          (runtimePrev as any).formatReason === (runtimeNext as any).formatReason &&
          ((runtimePrev as any).telemetry?.downgradeReason ?? null) ===
            ((runtimeNext as any).telemetry?.downgradeReason ?? null) &&
          runtimePrev.packedRG === runtimeNext.packedRG &&
          runtimePrev.useAtlas === runtimeNext.useAtlas &&
          runtimePrev.hasLatticeSdf === runtimeNext.hasLatticeSdf;
        if (
          prev.expectedVolumeHash === status.expectedVolumeHash &&
          prev.expectedSdfKey === status.expectedSdfKey &&
          prev.volumeReady === status.volumeReady &&
          prev.volumeFailed === status.volumeFailed &&
          (prev as any).volumeFailedReason === (status as any).volumeFailedReason &&
          prev.sdfReady === status.sdfReady &&
          prev.sdfFailed === status.sdfFailed &&
          (prev as any).sdfFailedReason === (status as any).sdfFailedReason &&
          sameCaps &&
          sameRuntime
        ) {
          return prev;
        }
        return status;
      });
    };

    tick();
    timer = window.setInterval(tick, 650);
    return () => {
      if (timer != null) window.clearInterval(timer);
    };
  }, [latticeModeEnabled, latticeRequireSdf, sharedLatticeState?.volume?.hash, sharedLatticeState?.sdf?.key]);

  const latticeFallbackReasonLegacy = useMemo(() => {
    if (!latticeModeEnabled) return "disabled";
    const frame = sharedLatticeState?.frame ?? null;
    if (!frame) return "frame-missing";
    const volume = sharedLatticeState?.volume ?? null;
    if (!volume) return "volume-missing";
    if (volume.stats?.budgetHit || volume.clampReasons?.includes("voxel:budgetHit")) return "volume-over-budget";
    if (latticeRequireSdf && !sharedLatticeState?.sdf) return "sdf-missing-required";
    if (latticeGpuStatus?.volumeFailed) return "gpu-volume-upload-failed";
    if (latticeRequireSdf && latticeGpuStatus?.sdfFailed) return "gpu-sdf-upload-failed";
    if (latticeGpuStatus && !latticeGpuStatus.volumeReady) return "gpu-volume-upload-pending";
    if (latticeRequireSdf && latticeGpuStatus && !latticeGpuStatus.sdfReady) return "gpu-sdf-upload-pending";
    return null;
  }, [
    latticeModeEnabled,
    latticeRequireSdf,
    sharedLatticeState?.frame,
    sharedLatticeState?.volume,
    sharedLatticeState?.sdf,
    latticeGpuStatus,
  ]);

  useEffect(() => {
    // NOTE: Lattice telemetry/observability publishing is centralized near the
  // component return so it can include hash-stale guardrails + WebGL caps/runtime.
  }, []);
const [busPhasePayload, setBusPhasePayload] = useState<{
  phase01: number;
  phaseCont?: number;
  tsec_ms?: number;
  pumpPhase_deg?: number;
  tauLC_ms?: number;
  sectorIndex?: number;
  source?: string;
  timestamp?: number;
} | null>(null);
const busPhaseHistoryRef = useRef<number[]>([]);
const loopPhaseHistoryRef = useRef<number[]>([]);
const lastPhaseSampleTimeRef = useRef<number>(0);
const lastBusPhaseSampleRef = useRef<number | null>(null);
const lastLoopPhaseSampleRef = useRef<number | null>(null);
const [phaseHistoryTick, setPhaseHistoryTick] = useState(0);
const sharedPhysicsLock = useHull3DSharedStore((s) => s.physics.locked);
const toggleSharedPhysicsLock = useHull3DSharedStore((s) => s.togglePhysicsLock);
const trimSharedPhysicsDb = useHull3DSharedStore((s) => s.trimPhysicsDb);
const showSectorGridOverlay = useHull3DSharedStore(
  (s) => s.overlays.sectorGrid3D.enabled
);

useEffect(() => {
  if (typeof window !== "undefined") {
    (window as any).__hullShowSurfaceOverlay = showHullSurfaceOverlay;
    (window as any).__surfaceDebugEcho = showHullSurfaceOverlay;
  }
}, [showHullSurfaceOverlay]);
useEffect(() => {
  if (typeof window !== "undefined") {
    (window as any).__hullGateSource = gateSource;
  }
}, [gateSource]);
useEffect(() => {
  if (typeof window !== "undefined") {
    (window as any).__hullGateViewEnabled = gateViewEnabled;
  }
}, [gateViewEnabled]);
useEffect(() => {
  if (typeof window !== "undefined") {
    (window as any).__hullForceFlatGate = forceFlatGate;
  }
}, [forceFlatGate]);
useEffect(() => {
  if (typeof window !== "undefined") {
    (window as any).__hullShowTiltOverlay = showTiltOverlay;
  }
}, [showTiltOverlay]);
useEffect(() => {
  if (typeof window !== "undefined") {
    (window as any).__hullLatticeModeEnabled = latticeModeEnabled;
  }
}, [latticeModeEnabled]);
useEffect(() => {
  if (typeof window !== "undefined") {
    (window as any).__hullLatticeRequireSdf = latticeRequireSdf;
  }
}, [latticeRequireSdf]);
useEffect(() => {
  const handlerId = subscribe("warp:viz", (payload: any) => {
    const v = Number(payload?.volumeViz);
    if (v === 0 || v === 1 || v === 2) {
      setLiveVolumeMode(v as VolumeViz);
    }
  });
  return () => {
    if (handlerId) unsubscribe(handlerId);
  };
  }, [setLiveVolumeMode]);
  const [hullQuality, setHullQuality] = useState<Hull3DQualityPreset>("low");
  const [hullVoxelDensity, setHullVoxelDensity] = useState<"low" | "medium" | "high">("medium");
  const [hullRayStepsMax, setHullRayStepsMax] = useState<number | null>(null);
  const [hullStepBias, setHullStepBias] = useState<number | null>(null);
  const [hullQualityAdvanced, setHullQualityAdvanced] = useState(false);
  const [viewerProfileTag, setViewerProfileTag] = useState<string | undefined>(undefined);
  const overlayProfileKey = useMemo<HullOverlayPrefProfile>(
    () => (viewerProfileTag === "card" ? "card" : hullQuality),
    [viewerProfileTag, hullQuality],
  );
  const latticeQualityLocked = useMemo(
    () =>
      viewerProfileTag === "card" ||
      hullQuality !== "auto" ||
      hullVoxelDensity !== "medium" ||
      hullRayStepsMax !== null ||
      hullStepBias !== null,
    [viewerProfileTag, hullQuality, hullVoxelDensity, hullRayStepsMax, hullStepBias],
  );
  const [voxelSlicesEnabled, setVoxelSlicesEnabled] = useState<boolean>(
    () => defaultOverlayPrefsForProfile("auto").slicesEnabled
  );
  const [voxelSliceAxis, setVoxelSliceAxis] = useState<HullVoxelSliceAxis>(
    () => defaultOverlayPrefsForProfile("auto").sliceAxis
  );
  const [voxelSliceMin, setVoxelSliceMin] = useState<number>(
    () => defaultOverlayPrefsForProfile("auto").sliceMin
  );
  const [voxelSliceMax, setVoxelSliceMax] = useState<number>(
    () => defaultOverlayPrefsForProfile("auto").sliceMax
  );
  const [coverageHeatmapEnabled, setCoverageHeatmapEnabled] = useState<boolean>(
    () => defaultOverlayPrefsForProfile("auto").coverageHeatmap
  );
  const [spacetimeGridEnabled, setSpacetimeGridEnabled] = useState<boolean>(
    () => defaultOverlayPrefsForProfile("auto").spacetimeGrid.enabled
  );
  const [spacetimeGridMode, setSpacetimeGridMode] = useState<HullSpacetimeGridMode>(
    () => defaultOverlayPrefsForProfile("auto").spacetimeGrid.mode
  );
  const [spacetimeGridSpacing, setSpacetimeGridSpacing] = useState<number>(
    () => defaultOverlayPrefsForProfile("auto").spacetimeGrid.spacing_m
  );
  const [spacetimeGridWarpStrength, setSpacetimeGridWarpStrength] = useState<number>(
    () => defaultOverlayPrefsForProfile("auto").spacetimeGrid.warpStrength
  );
  const [spacetimeGridFalloff, setSpacetimeGridFalloff] = useState<number>(
    () => defaultOverlayPrefsForProfile("auto").spacetimeGrid.falloff_m
  );
  const [spacetimeGridColorBy, setSpacetimeGridColorBy] = useState<HullSpacetimeGridColorBy>(
    () => defaultOverlayPrefsForProfile("auto").spacetimeGrid.colorBy
  );
  const [spacetimeGridUseSdf, setSpacetimeGridUseSdf] = useState<boolean>(
    () => defaultOverlayPrefsForProfile("auto").spacetimeGrid.useSdf
  );
  const [spacetimeGridStrengthMode, setSpacetimeGridStrengthMode] =
    useState<HullSpacetimeGridStrengthMode>(
      () => defaultOverlayPrefsForProfile("auto").spacetimeGrid.warpStrengthMode
    );
  const [spacetimeGridDbg, setSpacetimeGridDbg] = useState<any | null>(null);
  const cardProfileStateRef = useRef<{
    active: boolean;
    requestId?: string;
    snapshot: {
      volumeDomain: Hull3DVolumeDomain;
      quality: Hull3DQualityPreset;
      voxelDensity: "low" | "medium" | "high";
      rayStepsMax: number | null;
      stepBias: number | null;
      boundsProfile: "tight" | "wide";
    } | null;
  }>({ active: false, snapshot: null, requestId: undefined });
  const cardProfileLatestRef = useRef({
    volumeDomain: hullVolumeDomain,
    quality: hullQuality,
    voxelDensity: hullVoxelDensity,
    rayStepsMax: hullRayStepsMax,
    stepBias: hullStepBias,
    boundsProfile: bubbleBoundsMode,
  });
  const CARD_PROFILE_OVERRIDES = useMemo<Hull3DQualityOverrides>(
    () => ({
      voxelDensity: "high",
      raySteps: 128,
      stepBias: 0.42,
    }),
    [],
  );
  useEffect(() => {
    cardProfileLatestRef.current = {
      volumeDomain: hullVolumeDomain,
      quality: hullQuality,
      voxelDensity: hullVoxelDensity,
      rayStepsMax: hullRayStepsMax,
      stepBias: hullStepBias,
      boundsProfile: bubbleBoundsMode,
    };
  }, [hullVolumeDomain, hullQuality, hullVoxelDensity, hullRayStepsMax, hullStepBias, bubbleBoundsMode]);
  useEffect(() => {
    if (!overlayPrefs[overlayProfileKey]) {
      setOverlayPrefs(overlayProfileKey, defaultOverlayPrefsForProfile(overlayProfileKey));
    }
    if (overlayPrefs[overlayProfileKey] && !overlayPrefs[overlayProfileKey]?.spacetimeGrid) {
      setOverlayPrefs(overlayProfileKey, (current) => ({
        ...current,
        spacetimeGrid:
          current.spacetimeGrid ?? defaultOverlayPrefsForProfile(overlayProfileKey).spacetimeGrid,
      }));
    }
    const prefs = overlayPrefs[overlayProfileKey] ?? defaultOverlayPrefsForProfile(overlayProfileKey);
    const spacetimeGrid = prefs.spacetimeGrid ?? defaultOverlayPrefsForProfile(overlayProfileKey).spacetimeGrid;
    setVoxelSlicesEnabled(prefs.slicesEnabled);
    setVoxelSliceAxis(prefs.sliceAxis);
    setVoxelSliceMin(prefs.sliceMin);
    setVoxelSliceMax(prefs.sliceMax);
    setCoverageHeatmapEnabled(prefs.coverageHeatmap);
    setSpacetimeGridEnabled(spacetimeGrid.enabled);
    setSpacetimeGridMode(spacetimeGrid.mode);
    setSpacetimeGridSpacing(spacetimeGrid.spacing_m);
    setSpacetimeGridWarpStrength(spacetimeGrid.warpStrength);
    setSpacetimeGridFalloff(spacetimeGrid.falloff_m);
    setSpacetimeGridColorBy(spacetimeGrid.colorBy);
    setSpacetimeGridUseSdf(spacetimeGrid.useSdf);
    setSpacetimeGridStrengthMode(spacetimeGrid.warpStrengthMode);
  }, [overlayPrefs, overlayProfileKey, setOverlayPrefs]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let timer: number | null = null;
    let lastKey = "";
    const tick = () => {
      const dbg = (window as any).__spacetimeGridDbg;
      if (dbg && typeof dbg === "object") {
        const reasons = Array.isArray(dbg.degraded?.reasons) ? dbg.degraded.reasons : [];
        const key = [
          dbg.enabled ? 1 : 0,
          dbg.postEnabled ? 1 : 0,
          dbg.postMode ?? "none",
          dbg.mode ?? "none",
          Math.round((dbg.degraded?.spacingUsed_m ?? 0) * 1000),
          Math.round((dbg.bounds?.expandedBy_m ?? 0) * 1000),
          reasons.join(","),
        ].join("|");
        if (key !== lastKey) {
          lastKey = key;
          setSpacetimeGridDbg(dbg);
        }
      }
      timer = window.setTimeout(tick, 750);
    };
    tick();
    return () => {
      if (timer != null) window.clearTimeout(timer);
    };
  }, []);
  const syncOverlayPrefs = useCallback(
    (next: Partial<HullOverlayPrefs> | ((current: HullOverlayPrefs) => HullOverlayPrefs)) => {
      setOverlayPrefs(overlayProfileKey, next);
    },
    [overlayProfileKey, setOverlayPrefs],
  );
  const updateSpacetimeGridPrefs = useCallback(
    (partial: Partial<HullOverlayPrefs["spacetimeGrid"]>) => {
      setOverlayPrefs(overlayProfileKey, (current) => {
        const base =
          current.spacetimeGrid ?? defaultOverlayPrefsForProfile(overlayProfileKey).spacetimeGrid;
        return {
          ...current,
          spacetimeGrid: { ...base, ...partial },
        };
      });
    },
    [overlayProfileKey, setOverlayPrefs],
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldForce = !spacetimeGridEnabled;
    if (!shouldForce) return;
    try {
      const key = "hullSpacetimeGridAutoEnabled:v3";
      if (window.localStorage.getItem(key) === "1") return;
      const preset =
        SPACETIME_GRID_PRESETS.find((entry) => entry.id === SPACETIME_GRID_DEFAULT_PRESET_ID) ??
        SPACETIME_GRID_PRESETS[0];
      if (preset) {
        updateSpacetimeGridPrefs(preset.prefs);
      } else {
        updateSpacetimeGridPrefs({ enabled: true });
      }
      window.localStorage.setItem(key, "1");
    } catch {
      const fallback =
        SPACETIME_GRID_PRESETS.find((entry) => entry.id === SPACETIME_GRID_DEFAULT_PRESET_ID) ??
        SPACETIME_GRID_PRESETS[0];
      if (fallback) {
        updateSpacetimeGridPrefs(fallback.prefs);
      } else {
        updateSpacetimeGridPrefs({ enabled: true });
      }
    }
  }, [spacetimeGridEnabled, updateSpacetimeGridPrefs]);
  const applySliceBounds = useCallback(
    (min: number, max: number) => {
      const lo = Math.max(0, Math.min(1, min));
      const hiRaw = Math.max(0, Math.min(1, max));
      const loFixed = Math.max(0, Math.min(lo, hiRaw - 0.01));
      const hi = Math.min(1, Math.max(loFixed + 0.01, hiRaw));
      setVoxelSliceMin(loFixed);
      setVoxelSliceMax(hi);
      syncOverlayPrefs({ sliceMin: loFixed, sliceMax: hi });
    },
    [syncOverlayPrefs],
  );
  const handleSliceToggle = useCallback(
    (enabled: boolean) => {
      setVoxelSlicesEnabled(enabled);
      syncOverlayPrefs({ slicesEnabled: enabled });
    },
    [syncOverlayPrefs],
  );
  const handleSliceAxisChange = useCallback(
    (axis: HullVoxelSliceAxis) => {
      setVoxelSliceAxis(axis);
      syncOverlayPrefs({ sliceAxis: axis });
    },
    [syncOverlayPrefs],
  );
  const handleHeatmapToggle = useCallback(
    (enabled: boolean) => {
      setCoverageHeatmapEnabled(enabled);
      syncOverlayPrefs({ coverageHeatmap: enabled });
    },
    [syncOverlayPrefs],
  );
  const handleSpacetimeGridToggle = useCallback(
    (enabled: boolean) => {
      setSpacetimeGridEnabled(enabled);
      updateSpacetimeGridPrefs({ enabled });
    },
    [updateSpacetimeGridPrefs],
  );
  const handleSpacetimeGridModeChange = useCallback(
    (mode: HullSpacetimeGridMode) => {
      setSpacetimeGridMode(mode);
      updateSpacetimeGridPrefs({ mode });
    },
    [updateSpacetimeGridPrefs],
  );
  const handleSpacetimeGridSpacingChange = useCallback(
    (value: number) => {
      const clampedVal = clamp(value, 0.05, 5);
      setSpacetimeGridSpacing(clampedVal);
      updateSpacetimeGridPrefs({ spacing_m: clampedVal });
    },
    [updateSpacetimeGridPrefs],
  );
  const handleSpacetimeGridWarpStrengthChange = useCallback(
    (value: number) => {
      const clampedVal = clamp(value, 0, 5);
      setSpacetimeGridWarpStrength(clampedVal);
      updateSpacetimeGridPrefs({ warpStrength: clampedVal });
    },
    [updateSpacetimeGridPrefs],
  );
  const handleSpacetimeGridFalloffChange = useCallback(
    (value: number) => {
      const clampedVal = clamp(value, 0.05, 6);
      setSpacetimeGridFalloff(clampedVal);
      updateSpacetimeGridPrefs({ falloff_m: clampedVal });
    },
    [updateSpacetimeGridPrefs],
  );
  const handleSpacetimeGridColorByChange = useCallback(
    (colorBy: HullSpacetimeGridColorBy) => {
      setSpacetimeGridColorBy(colorBy);
      updateSpacetimeGridPrefs({ colorBy });
    },
    [updateSpacetimeGridPrefs],
  );
  const handleSpacetimeGridUseSdfChange = useCallback(
    (useSdf: boolean) => {
      setSpacetimeGridUseSdf(useSdf);
      updateSpacetimeGridPrefs({ useSdf });
    },
    [updateSpacetimeGridPrefs],
  );
  const handleSpacetimeGridStrengthModeChange = useCallback(
    (mode: HullSpacetimeGridStrengthMode) => {
      setSpacetimeGridStrengthMode(mode);
      updateSpacetimeGridPrefs({ warpStrengthMode: mode });
    },
    [updateSpacetimeGridPrefs],
  );
  const applySpacetimeGridPreset = useCallback(
    (preset: SpacetimeGridPreset) => {
      const next = preset.prefs;
      setSpacetimeGridEnabled(next.enabled);
      setSpacetimeGridMode(next.mode);
      setSpacetimeGridSpacing(next.spacing_m);
      setSpacetimeGridWarpStrength(next.warpStrength);
      setSpacetimeGridFalloff(next.falloff_m);
      setSpacetimeGridColorBy(next.colorBy);
      setSpacetimeGridUseSdf(next.useSdf);
      setSpacetimeGridStrengthMode(next.warpStrengthMode);
      updateSpacetimeGridPrefs(next);
    },
    [updateSpacetimeGridPrefs],
  );
  const applyCardExportProfile = useCallback(
    (requestId?: string) => {
      if (!cardProfileStateRef.current.active) {
        cardProfileStateRef.current = {
          active: true,
          requestId,
          snapshot: {
            ...cardProfileLatestRef.current,
          },
        };
      } else {
        cardProfileStateRef.current.requestId = requestId ?? cardProfileStateRef.current.requestId;
      }
      setViewerProfileTag("card");
      if (hullVolumeDomain !== "bubbleBox") {
        setHullVolumeDomain("bubbleBox");
      }
      setHullQuality("high");
      setHullVoxelDensity(CARD_PROFILE_OVERRIDES.voxelDensity ?? "high");
      setHullRayStepsMax(CARD_PROFILE_OVERRIDES.raySteps ?? null);
      setHullStepBias(CARD_PROFILE_OVERRIDES.stepBias ?? null);
      window.dispatchEvent(
        new CustomEvent("helix:card-export-profile:applied" as any, {
          detail: { requestId, profile: "card" },
        }),
      );
    },
    [
      CARD_PROFILE_OVERRIDES,
      hullVolumeDomain,
      setHullQuality,
      setHullRayStepsMax,
      setHullStepBias,
      setHullVoxelDensity,
      setHullVolumeDomain,
      setViewerProfileTag,
    ],
  );
  const restoreCardExportProfile = useCallback(
    (requestId?: string) => {
      const snapshot = cardProfileStateRef.current.snapshot;
      if (snapshot) {
        setHullVolumeDomain(snapshot.volumeDomain);
        setHullQuality(snapshot.quality);
        setHullVoxelDensity(snapshot.voxelDensity);
        setHullRayStepsMax(snapshot.rayStepsMax);
        setHullStepBias(snapshot.stepBias);
        setBubbleBoundsMode(snapshot.boundsProfile);
      }
      cardProfileStateRef.current = { active: false, snapshot: null, requestId: undefined };
      setViewerProfileTag(undefined);
      window.dispatchEvent(
        new CustomEvent("helix:card-export-profile:restored" as any, {
          detail: { requestId },
        }),
      );
    },
    [
      setBubbleBoundsMode,
      setHullQuality,
      setHullRayStepsMax,
      setHullStepBias,
      setHullVoxelDensity,
      setHullVolumeDomain,
      setViewerProfileTag,
    ],
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: "apply" | "restore"; requestId?: string }>).detail;
      if (!detail?.mode) return;
      if (detail.mode === "apply") {
        applyCardExportProfile(detail.requestId);
      } else if (detail.mode === "restore") {
        restoreCardExportProfile(detail.requestId);
      }
    };
    window.addEventListener("helix:card-export-profile" as any, handler as any);
    return () => window.removeEventListener("helix:card-export-profile" as any, handler as any);
  }, [applyCardExportProfile, restoreCardExportProfile]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{
        requestId?: string;
        volumeHash?: string | null;
        sdfKey?: string | null;
        requireSdf?: boolean;
        timeoutMs?: number;
      }>).detail;
      const requestId = detail?.requestId;
      if (!requestId) return;
      const volumeHash = typeof detail.volumeHash === "string" ? detail.volumeHash : null;
      const sdfKey = typeof detail.sdfKey === "string" ? detail.sdfKey : null;
      const requireSdf = Boolean(detail.requireSdf);
      const timeoutMs = Number.isFinite(detail.timeoutMs) ? Math.max(0, Number(detail.timeoutMs)) : 4500;

      const start = typeof performance !== "undefined" ? performance.now() : Date.now();
      let rafId: number | null = null;

      const respond = (payload: Record<string, unknown>) => {
        if (rafId != null) {
          try {
            cancelAnimationFrame(rafId);
          } catch {}
          rafId = null;
        }
        window.dispatchEvent(
          new CustomEvent("helix:await-lattice-ready:result" as any, {
            detail: { requestId, ...payload },
          }),
        );
      };

      const tick = () => {
        const now = typeof performance !== "undefined" ? performance.now() : Date.now();
        const elapsed = now - start;
        const renderer = hullRendererRef.current;
        if (!renderer) {
          if (!volumeHash && !sdfKey) {
            respond({
              ready: true,
              volumeHash,
              sdfKey,
              volumeReady: true,
              sdfReady: true,
              volumeFailed: false,
              sdfFailed: false,
              reason: "no-lattice",
            });
            return;
          }
          if (elapsed >= timeoutMs) {
            respond({
              ready: false,
              volumeHash,
              sdfKey,
              volumeReady: false,
              sdfReady: false,
              volumeFailed: false,
              sdfFailed: false,
              reason: "renderer-missing",
            });
            return;
          }
          rafId = requestAnimationFrame(tick);
          return;
        }

        const status = renderer.getLatticeGpuStatus({
          volumeHash,
          sdfKey: requireSdf ? sdfKey : null,
        });
        const ready = status.volumeReady && status.sdfReady && !status.volumeFailed && !status.sdfFailed;
        if (ready) {
          respond({
            ready: true,
            volumeHash: status.expectedVolumeHash,
            sdfKey: status.expectedSdfKey,
            volumeReady: status.volumeReady,
            sdfReady: status.sdfReady,
            volumeFailed: status.volumeFailed,
            sdfFailed: status.sdfFailed,
            reason: "ready",
          });
          return;
        }
        if (status.volumeFailed || status.sdfFailed) {
          respond({
            ready: false,
            volumeHash: status.expectedVolumeHash,
            sdfKey: status.expectedSdfKey,
            volumeReady: status.volumeReady,
            sdfReady: status.sdfReady,
            volumeFailed: status.volumeFailed,
            sdfFailed: status.sdfFailed,
            reason: status.volumeFailed ? "volume-upload-failed" : "sdf-upload-failed",
          });
          return;
        }
        if (elapsed >= timeoutMs) {
          respond({
            ready: false,
            volumeHash: status.expectedVolumeHash,
            sdfKey: status.expectedSdfKey,
            volumeReady: status.volumeReady,
            sdfReady: status.sdfReady,
            volumeFailed: status.volumeFailed,
            sdfFailed: status.sdfFailed,
            reason: "timeout",
          });
          return;
        }
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener("helix:await-lattice-ready" as any, handler as any);
    return () => window.removeEventListener("helix:await-lattice-ready" as any, handler as any);
  }, []);
  // Exposure (log slider mapped to 0.01x .. 100x; 0.5 -> 1x)
  const [hullExposure01, setHullExposure01] = useState(0.5);
  // Parity diagnostics: CPU peak vs shader sector center
  const [centerDeltaDeg, setCenterDeltaDeg] = useState<number | null>(null);
  const lastCenterCheckRef = useRef<number>(0);
  // DriveSync store bindings (shared across panels)
  const ds = useDriveSyncStore();
const res = 256;
  const FORCE_SHOW = false; // DEBUG: set true to ignore gate while debugging

  const { data: live } = useEnergyPipeline({
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });
  const hullPreview = useHullPreviewPayload();
  const [rawPreviewMesh, setRawPreviewMesh] = useState<{
    key: string;
    positions: Float32Array;
    indices: Uint32Array | Uint16Array | null;
    uvs?: Float32Array | null;
    texture?: TexImageSource | null;
    color?: [number, number, number, number];
  } | null>(null);

  const view = useMemo(() => ((live as any)?.view ?? {}), [live]);

  const bubbleStatus = useMemo(() => {
    const raw = (live as any)?.overallStatus;
    if (raw === "CRITICAL" || raw === "WARNING" || raw === "NOMINAL") {
      return raw as "CRITICAL" | "WARNING" | "NOMINAL";
    }
    return undefined;
  }, [live]);
  const hullDimsResolved = useMemo(
    () => resolveHullDimsEffective({ previewPayload: hullPreview, pipelineSnapshot: live as any }),
    [hullPreview, live],
  );
  const previewTargetDims = useMemo(
    () =>
      hullDimsResolved
        ? { Lx_m: hullDimsResolved.Lx_m, Ly_m: hullDimsResolved.Ly_m, Lz_m: hullDimsResolved.Lz_m }
        : hullPreview?.targetDims,
    [hullDimsResolved, hullPreview?.targetDims],
  );
  const lastHullDimsSourceRef = useRef<"preview" | "pipeline" | null>(null);
  useEffect(() => {
    const nextSource = hullDimsResolved?.source ?? null;
    const prevSource = lastHullDimsSourceRef.current;
    if (prevSource && nextSource && prevSource !== nextSource) {
      clearLatticeSurfaceCaches();
      clearLatticeSdfCache();
      setSharedLattice(null);
    }
    lastHullDimsSourceRef.current = nextSource;
  }, [hullDimsResolved?.source, setSharedLattice]);
  const wireframeOverlay = useMemo<WireframeOverlayResult>(() => {
    const targetDims = hullDimsResolved
      ? { Lx_m: hullDimsResolved.Lx_m, Ly_m: hullDimsResolved.Ly_m, Lz_m: hullDimsResolved.Lz_m }
      : null;
    return resolveWireframeOverlay(hullPreview, {
      lod: wireframeLod,
      targetDims,
      ...wireframeBudgets,
    });
  }, [hullPreview, wireframeLod, hullDimsResolved, wireframeBudgets]);
  const activeWireframeLod = useMemo(() => {
    if (!hullPreview) return null;
    const lods =
      wireframeLod === "high"
        ? [
            hullPreview.lodFull,
            hullPreview.mesh?.fullLod,
            ...(hullPreview.lods ?? []).filter((lod) => lod?.tag === "full"),
            ...(hullPreview.mesh?.lods ?? []).filter((lod) => lod?.tag === "full"),
          ]
        : [
            hullPreview.lodCoarse,
            hullPreview.mesh?.coarseLod,
            ...(hullPreview.lods ?? []).filter((lod) => lod?.tag === "coarse"),
            ...(hullPreview.mesh?.lods ?? []).filter((lod) => lod?.tag === "coarse"),
          ];
    return (lods.find((lod) => !!lod) as typeof hullPreview.lodFull | typeof hullPreview.lodCoarse | null) ?? null;
  }, [hullPreview, wireframeLod]);
  useEffect(() => {
    const url = hullPreview?.glbUrl;
    if (!url) {
      setRawPreviewMesh(null);
      return;
    }
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (cancelled) return;
        let mesh: Mesh | null = null;
        gltf.scene.traverse((child) => {
          if (!mesh && (child as any).isMesh) {
            mesh = child as Mesh;
          }
        });
        if (!mesh) {
          setRawPreviewMesh(null);
          return;
        }
        const meshObj = mesh as Mesh;
        meshObj.updateMatrixWorld(true);
        const geom = (meshObj.geometry as BufferGeometry).clone();
        geom.applyMatrix4(meshObj.matrixWorld);
        const posAttr = geom.getAttribute("position");
        if (!posAttr || !posAttr.array || posAttr.count === 0) {
          setRawPreviewMesh(null);
          geom.dispose();
          return;
        }
        const positions = new Float32Array(posAttr.array as ArrayLike<number>);
        const indexAttr = geom.getIndex();
        const indices = indexAttr
          ? new (indexAttr.array instanceof Uint32Array ? Uint32Array : Uint16Array)(indexAttr.array as any)
          : null;
        const uvAttr = geom.getAttribute("uv");
        const uvs = uvAttr ? new Float32Array(uvAttr.array as ArrayLike<number>) : null;
        const material = Array.isArray(meshObj.material) ? meshObj.material[0] : meshObj.material;
        const mapImage = (material as any)?.map?.image as TexImageSource | undefined;
        const color: [number, number, number, number] | undefined = (material as any)?.color
          ? [
              (material as any).color.r,
              (material as any).color.g,
              (material as any).color.b,
              (material as any).opacity ?? 1,
            ]
          : undefined;
        setRawPreviewMesh({
          key: `glb:${url}`,
          positions,
          indices,
          uvs,
          texture: mapImage ?? null,
          color,
        });
        geom.dispose();
      },
      undefined,
      (err) => {
        if (cancelled) return;
        console.warn("[AlcubierrePanel] GLB preview load failed", err);
        setRawPreviewMesh(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [hullPreview?.glbUrl]);
  const wireframeClampLabel = useMemo(() => {
    if (!wireframeOverlay.clampReasons.length) return null;
    const labels = wireframeOverlay.clampReasons.map((reason) => {
      if (reason === "overlay:missingMesh") return "Preview mesh missing";
      if (reason === "overlay:missingLod") return "LOD unavailable";
      if (reason === "overlay:missingGeometry") return "Indexed geometry missing";
      if (reason === "overlay:overBudget") return "LOD over budget";
      if (reason === "overlay:decimationOverBudget") return "Decimation over budget";
      if (reason === "overlay:payloadTooLarge") return "Upload size clamped";
      if (reason === "overlay:lineWidthClamped") return "Line width capped";
      if (reason === "overlay:indicesMissing") return "No indices (fallback to rings)";
      return reason;
    });
    return labels.join(", ");
  }, [wireframeOverlay.clampReasons]);
  const { result: fieldProbe, loading: fieldProbeLoading } = useFieldProbe({
    overlay: wireframeOverlay.overlay,
    preview: hullPreview,
    pipeline: live,
    enabled: showWireframeOverlay && useFieldProbeOverlay && !!wireframeOverlay.overlay,
  });
  useEffect(() => {
    const basisRaw = hullPreview?.mesh?.basis ?? hullPreview?.basis;
    const basisResolved =
      wireframeOverlay.overlay?.basis ?? resolveHullBasis(basisRaw, hullPreview?.scale);
    const meshHash = wireframeOverlay.overlay?.meshHash ?? hullPreview?.meshHash ?? hullPreview?.mesh?.meshHash;
    const triangleCount = wireframeOverlay.overlay?.triangleCount ?? activeWireframeLod?.triangleCount;
    const vertexCount = wireframeOverlay.overlay?.vertexCount ?? activeWireframeLod?.vertexCount;
    const clampReasons = wireframeOverlay.clampReasons.length ? wireframeOverlay.clampReasons : undefined;
    const geometrySource = (
      wireframeOverlay.source === "fallback"
        ? "geometric"
        : (hullPreview?.provenance as "preview" | "pipeline" | undefined) ?? "preview"
    );

    setSharedMeshOverlay({
      meshHash,
      provenance: hullPreview?.provenance as "preview" | "pipeline" | undefined,
      geometrySource,
      lod: wireframeLod,
      lodTag: activeWireframeLod?.tag,
      triangleCount,
      vertexCount,
      decimation: activeWireframeLod?.decimation,
      budgets: wireframeBudgets,
      basis: basisRaw ?? undefined,
      basisResolved,
      basisTags: basisRaw,
      clampReasons,
      wireframeEnabled: showWireframeOverlay,
      updatedAt: Date.now(),
    });
  }, [
    activeWireframeLod?.decimation,
    activeWireframeLod?.tag,
    activeWireframeLod?.triangleCount,
    activeWireframeLod?.vertexCount,
    hullPreview?.basis,
    hullPreview?.mesh?.basis,
    hullPreview?.scale,
    hullPreview?.mesh?.meshHash,
    hullPreview?.meshHash,
    hullPreview?.provenance,
    setSharedMeshOverlay,
    showWireframeOverlay,
    wireframeBudgets,
    wireframeLod,
    wireframeOverlay.clampReasons,
    wireframeOverlay.overlay,
    wireframeOverlay.source,
  ]);
  // Lattice frame/volume/SDF building now happens after `syncMode` so the panel can
  // debounce rebuilds and surface guardrails without TDZ dependency hazards.

  // Auto-fill Ïƒ_sector per operational mode, with server override, when following mode
  useEffect(() => {
    if (!live) return;
    if (!ds.locks?.followMode) return;
    const sigmaS = resolveSigmaSectors(live);
    if (
      Number.isFinite(sigmaS) &&
      Math.abs(sigmaS - ds.sigmaSectors) > 1e-6 &&
      typeof ds.setSigma === "function"
    ) {
      ds.setSigma(sigmaS);
    }
  }, [live, ds.locks?.followMode, ds.sigmaSectors, ds.setSigma]);

  const shaderSources = useMemo(() => (
    shaderMode === "main"
      ? { vert: VERT, frag: FRAG, label: "main" as const }
      : { vert: SAFE_VERT, frag: SAFE_FRAG, label: "safe" as const }
  ), [shaderMode]);

  useEffect(() => {
    hullConfigRef.current = { mode: hullMode, blend: hullBlend };
    if (hullRendererRef.current) {
      hullRendererRef.current.setMode(hullMode, hullBlend);
    }
  }, [hullMode, hullBlend]);

  useEffect(() => {
    if (hullRendererRef.current) {
      hullRendererRef.current.setVolumeViz(hullVolumeVizLive);
    }
  }, [hullVolumeVizLive]);

  useEffect(() => {
    const renderer = hullRendererRef.current;
    if (!renderer) return;
    const splitEnabled = Boolean(ds.splitEnabled);
    const splitFrac =
      typeof ds.splitFrac === "number" && Number.isFinite(ds.splitFrac) ? ds.splitFrac : 0.5;
    const bias = splitEnabled ? Math.abs(splitFrac - 0.5) : 0;
    const biasMag = Math.min(1, bias / 0.49);
    const planarMag = vizIntentEnabled ? Math.max(0, Math.min(1, vizPlanar)) : 0;
    const mag01 = planarMag > 1e-4 ? planarMag : biasMag;
    const rise01 = vizIntentEnabled ? vizRise : 0;
    const enabled = vizIntentEnabled && (mag01 > 1e-4 || Math.abs(rise01) > 1e-4);
    renderer.setVizIntent({
      enabled,
      mag01,
      rise01: Math.max(-1, Math.min(1, rise01)),
    });
  }, [vizIntentEnabled, vizRise, vizPlanar, ds.splitEnabled, ds.splitFrac]);

  const handleHullBlendChange = useCallback((value: number) => {
    const clamped = Math.min(Math.max(value, 0), 1);
    setHullBlend(clamped);
    if (clamped <= 0.02) {
      setHullMode("instant");
    } else if (clamped >= 0.98) {
      setHullMode("average");
    } else {
      setHullMode("blend");
    }
  }, [setHullMode]);

  useEffect(() => {
    const overrides: Hull3DQualityOverrides = {
      voxelDensity: hullVoxelDensity,
      raySteps: hullRayStepsMax ?? undefined,
      stepBias: hullStepBias ?? undefined,
    };
    hullQualityOverridesRef.current = overrides;
    if (hullRendererRef.current) {
      hullRendererRef.current.setQuality(hullQuality, overrides);
    }
  }, [hullQuality, hullVoxelDensity, hullRayStepsMax, hullStepBias]);

  // Live parameters (safe defaults)
  const beta  = useMemo(() => resolveBeta(live), [live]);
  const sigma = useMemo(() => Math.max(1e-6, fnum(live?.sigma ?? 6.0, 6.0)), [live]);
  const R     = useMemo(() => {
    if (hullDimsResolved) {
      const maxDim = Math.max(hullDimsResolved.Lx_m, hullDimsResolved.Ly_m, hullDimsResolved.Lz_m);
      return Math.max(1e-3, maxDim * 0.5);
    }
    const a = Math.max(1e-3, fnum(live?.hull?.a, 1));
    const b = Math.max(1e-3, fnum(live?.hull?.b, 1));
    const c = Math.max(1e-3, fnum(live?.hull?.c, 1));
    return Math.max(a, b, c);
  }, [hullDimsResolved, live]);
  const hullDomainScale = useMemo(() => {
    const base = hullVolumeDomain === "bubbleBox"
      ? (bubbleBoundsMode === "tight" ? 1.08 : 1.65)
      : 1.3;
    const scaled = base * R;
    return clamp(scaled, 0.85 * R, 2.2 * R);
  }, [bubbleBoundsMode, hullVolumeDomain, R]);

  // Engineering â€œamplitude chainâ€ used only in Drive mode
  const ampChain = useMemo(() => {
    // Broaden gamma fallback chain (visual -> mass -> legacy keys)
    const g = Math.max(1, fnum(live?.gammaGeo, 26));
    const q = Math.max(1e-9, fnum(live?.qSpoilingFactor ?? live?.q ?? live?.qSpoil ?? live?.qCavity, 1));
    const gammaV = Math.max(1,
      fnum(
        live?.gammaVanDenBroeck_vis ??
        live?.gammaVdB_vis ??
        live?.gammaVdB ??
        live?.gammaVanDenBroeck_mass ??
        live?.gammaVanDenBroeck ??
        live?.gamma_vdb,
        // Use a sane default when ?_VdB is absent to avoid runaway estimates
        1
      )
    );
    return Math.pow(g,3) * q * gammaV;
  }, [live]);

  const dutyFRRaw = useMemo(() => {
    const dRaw = fnum(
      live?.dutyEffectiveFR ??
      live?.dutyEffective_FR ??
      live?.dutyShip ??
      live?.dutyFR ??
      live?.dutyCycle,
      0
    );
    return Math.max(0, dRaw);
  }, [live]);

  const dFRViewMin = useMemo(() => {
    const cand = Number((view as any)?.dFR_view_min);
    return Number.isFinite(cand) && cand >= 0 ? cand : 1e-4;
  }, [view]);

  const vizFloorDefaults = useMemo(() => {
    const safe = (val: any, fallback: number) => {
      const n = Number(val);
      return Number.isFinite(n) && n > 0 ? n : fallback;
    };
    return {
      thetaGR: safe((view as any)?.vizFloorThetaGR, 1e-9),
      rhoGR: safe((view as any)?.vizFloorRhoGR, 1e-18),
      thetaDrive: safe((view as any)?.vizFloorThetaDrive, 1e-6),
    };
  }, [view]);

  const [vizFloors, setVizFloors] = useState(() => vizFloorDefaults);

  useEffect(() => {
    setVizFloors((prev) => ({
      thetaGR: Number.isFinite(prev.thetaGR) && prev.thetaGR > 0 ? prev.thetaGR : vizFloorDefaults.thetaGR,
      rhoGR: Number.isFinite(prev.rhoGR) && prev.rhoGR > 0 ? prev.rhoGR : vizFloorDefaults.rhoGR,
      thetaDrive: Number.isFinite(prev.thetaDrive) && prev.thetaDrive > 0 ? prev.thetaDrive : vizFloorDefaults.thetaDrive,
    }));
  }, [vizFloorDefaults]);
  const applyDriveCardPreset = useCallback(() => {
    setHullVolumeVizLive("theta_drive");
    setPlanarVizMode(3);
    setGateViewEnabled(true);
    setGateSource("combined");
    setForceFlatGate(false);
    setSharedPalette({ id: "diverging", encodeBetaSign: true, legend: true });
    setVizFloors({
      thetaGR: 1e-9,
      rhoGR: 1e-18,
      thetaDrive: 1e-6,
    });
  }, [
    setForceFlatGate,
    setGateSource,
    setGateViewEnabled,
    setHullVolumeVizLive,
    setPlanarVizMode,
    setSharedPalette,
    setShowHullSectorRing,
    setShowHullSurfaceOverlay,
  ]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => applyDriveCardPreset();
    window.addEventListener("helix:drive-card-preset" as any, handler as any);
    return () => window.removeEventListener("helix:drive-card-preset" as any, handler as any);
  }, [applyDriveCardPreset]);

  const gateRaw = useMemo(() => {
    if (FORCE_SHOW) return 1;
    const g = Math.sqrt(dutyFRRaw);
    return Number.isFinite(g) ? g : 0;
  }, [dutyFRRaw]);

  const gate = useMemo(() => {
    if (FORCE_SHOW) return 1;
    const g = Math.sqrt(Math.max(dutyFRRaw, dFRViewMin));
    return Number.isFinite(g) ? g : 0;
  }, [dutyFRRaw, dFRViewMin]);

  const gateView = useMemo(() => {
    if (FORCE_SHOW) return 1;
    if (!gateViewEnabled) return 0;
    return gate;
  }, [gateViewEnabled, gate]);

  const dutyFR = useMemo(() => {
    const d = Math.max(0, Math.min(1, dutyFRRaw));
    return Number.isFinite(d) ? d : 0;
  }, [dutyFRRaw]);

  // ---- sector gating (f and w) ------------------------------------------------
  // Canonical sectorization from pipeline: total = sectorCount|sectorsTotal, live = sectors|sectorsConcurrent
  const totalSectors = useMemo(() => Math.max(1, fnum(
    (live as any)?.sectorsTotal ?? (live as any)?.sectorCount ?? (live as any)?.totalSectors, 400
  )), [live]);
  const liveSectors = useMemo(() => Math.max(1, fnum(
    // include common API aliases
    (live as any)?.sectors ??
    (live as any)?.sectorsConcurrent ??
    (live as any)?.concurrentSectors ??
    (live as any)?.activeSectors ??
    (live as any)?.S_live ??
    (live as any)?.liveSectors, 1
  )), [live]);
  const fActive = useMemo(() => {
    const activeFracRaw = fnum(
      (live as any)?.activeFraction ??
      (live as any)?.tiles?.activeFraction ??
      (live as any)?.tiles?.fActive,
      Number.NaN
    );
    if (Number.isFinite(activeFracRaw) && activeFracRaw > 0) {
      return Math.max(1e-6, Math.min(1, activeFracRaw));
    }
    const activeTiles = fnum(
      (live as any)?.activeTiles ??
      (live as any)?.tiles?.active ??
      (live as any)?.tiles?.activeTiles,
      Number.NaN
    );
    const totalTiles = fnum(
      (live as any)?.tiles?.total ??
      (live as any)?.N_tiles ??
      (live as any)?.tiles?.tiles ??
      (live as any)?.tiles?.totalTiles,
      Number.NaN
    );
    if (Number.isFinite(activeTiles) && Number.isFinite(totalTiles) && totalTiles > 0) {
      return Math.max(1e-6, Math.min(1, activeTiles / Math.max(1, totalTiles)));
    }
    const activeSectorsRaw = fnum(
      (live as any)?.activeSectors ??
      (live as any)?.sectorsConcurrent ??
      (live as any)?.concurrentSectors,
      Number.NaN
    );
    if (Number.isFinite(activeSectorsRaw) && totalSectors > 0) {
      const frac = Math.max(1 / totalSectors, activeSectorsRaw / totalSectors);
      return Math.max(frac, Math.max(0, Math.min(1, dutyFR)));
    }
    const base = Math.max(1 / totalSectors, liveSectors / totalSectors);
    return Math.max(base, dutyFR);
  }, [live, dutyFR, liveSectors, totalSectors]);
  const hullSurfaceMesh = useMemo(
    () =>
      resolveHullSurfaceMesh(hullPreview, {
        lod: wireframeLod,
        targetDims: previewTargetDims ?? null,
        totalSectors,
      }),
    [hullPreview, wireframeLod, previewTargetDims, totalSectors],
  );
  const previewMeshFallback = useMemo<HullPreviewMeshPayload | null>(() => {
    if (!hullSurfaceMesh.surface) return null;
    return {
      key: `surface:${hullSurfaceMesh.surface.key}`,
      positions: hullSurfaceMesh.surface.positions,
      indices: hullSurfaceMesh.surface.indices ?? null,
      uvs: null,
      texture: null,
      color: [0.67, 0.81, 0.95, 0.6],
    };
  }, [hullSurfaceMesh.surface]);
  const previewMeshFromGlb = useMemo<HullPreviewMeshPayload | null>(() => {
    if (!rawPreviewMesh) return null;
    const targetDims = previewTargetDims ?? undefined;
    const transformed = applyHullBasisToPositions(rawPreviewMesh.positions, {
      basis: hullPreview?.mesh?.basis ?? hullPreview?.basis,
      extraScale: hullPreview?.scale,
      targetDims: targetDims ?? undefined,
    });
    const dimsSig = targetDims
      ? `${targetDims.Lx_m.toFixed(4)}|${targetDims.Ly_m.toFixed(4)}|${targetDims.Lz_m.toFixed(4)}`
      : "dims:none";
    const basisSig = latticeBasisSignature(transformed.basis);
    return {
      key: [rawPreviewMesh.key, basisSig, dimsSig].join("|"),
      positions: transformed.positions,
      indices: rawPreviewMesh.indices ?? null,
      uvs: rawPreviewMesh.uvs ?? null,
      texture: rawPreviewMesh.texture ?? null,
      color: rawPreviewMesh.color ?? [0.88, 0.92, 0.96, 0.95],
    };
  }, [rawPreviewMesh, hullPreview?.mesh?.basis, hullPreview?.basis, hullPreview?.scale, previewTargetDims]);
  const previewMeshForRenderer = useMemo<HullPreviewMeshPayload | null>(
    () => previewMeshFromGlb ?? previewMeshFallback,
    [previewMeshFromGlb, previewMeshFallback],
  );

  // sector "boost" term (visibility of a single active arc): âˆš(w/f)
  const tilesPerSectorVector = useMemo(() => {
    const raw =
      (live as any)?.tilesPerSectorVector ??
      (live as any)?.tilesPerSector ??
      (live as any)?.tiles?.perSector;
    let vec: number[] | undefined;
    if (Array.isArray(raw)) {
      vec = raw as number[];
    } else if (raw && ArrayBuffer.isView(raw as ArrayBufferView)) {
      vec = Array.from(raw as ArrayLike<number>);
    }
    if (!vec || vec.length === 0) return undefined;
    const filtered = vec
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v >= 0);
    return filtered.length ? filtered : undefined;
  }, [live]);

  const boostWF = useMemo(() => Math.sqrt(Math.max(1e-12, 1 / fActive)), [fActive]);

  // --- track canvas aspect so camera fits accurately
  const [aspect, setAspect] = useState(16 / 9);

  // Viewer axes (hull aspect)
  const axes = useMemo<[number, number, number]>(() => {
    if (hullDimsResolved) {
      return [
        Math.max(1e-3, hullDimsResolved.Lx_m * 0.5),
        Math.max(1e-3, hullDimsResolved.Ly_m * 0.5),
        Math.max(1e-3, hullDimsResolved.Lz_m * 0.5),
      ];
    }
    return [fnum(live?.hull?.a, 1), fnum(live?.hull?.b, 1), fnum(live?.hull?.c, 1)] as [number, number, number];
  }, [hullDimsResolved, live]);
  const hullObb = useMemo(() => {
    const previewObb = hullPreview?.mesh?.obb ?? hullPreview?.obb;
    if (previewObb) return previewObb;
    const basis = hullDimsResolved?.basis;
    return {
      center: [0, 0, 0] as [number, number, number],
      halfSize: axes,
      axes: basis
        ? ([basis.right, basis.up, basis.forward] as [
            [number, number, number],
            [number, number, number],
            [number, number, number],
          ])
        : undefined,
    };
  }, [axes, hullDimsResolved, hullPreview]);
  const cardCameraFrame = useMemo(
    () =>
      frameCardCameraToObb({
        preset: cardCameraPreset,
        obb: hullObb,
        halfSize: axes,
        domainScale: hullDomainScale,
        basis: hullDimsResolved?.basis ?? null,
        fov_deg: 45,
        minRadius: Math.max(R * 4.2, 12),
        yawOffset_rad: followHullPhase ? (ds.phase01 ?? 0) * Math.PI * 2 : 0,
      }),
    [R, axes, cardCameraPreset, ds.phase01, followHullPhase, hullDimsResolved?.basis, hullDomainScale, hullObb],
  );

  useEffect(() => {
    setViewer({
      planarVizMode,
      volumeViz: hullVolumeVizLive,
      volumeDomain: hullVolumeDomain,
      opacityWindow: bubbleOpacityWindow,
      boundsProfile: bubbleBoundsMode,
      vizFloors,
      gateSource,
      gateView: gateViewEnabled,
      forceFlatGate,
      qualityPreset: hullQuality,
      qualityOverrides: hullQualityOverridesRef.current,
      profileTag: viewerProfileTag,
      bounds: { axes, aspect, domainScale: hullDomainScale, basis: hullDimsResolved?.basis },
      palette: sharedPaletteState,
      camera: cardCameraFrame,
    });
  }, [
    cardCameraFrame,
    setViewer,
    planarVizMode,
    hullVolumeVizLive,
    vizFloors,
    gateSource,
    gateViewEnabled,
    forceFlatGate,
    hullQuality,
    hullRayStepsMax,
    hullStepBias,
    hullVoxelDensity,
    viewerProfileTag,
    axes,
    aspect,
    sharedPaletteState,
    R,
    hullDomainScale,
    hullVolumeDomain,
    bubbleOpacityWindow,
    bubbleBoundsMode,
  ]);

  const hullRadiusLUT = useMemo(() => {
    const radial = (live as any)?.hull?.radialLUT ?? (live as any)?.hull?.radialLut;
    if (!radial) return null;
    const sizeRaw = (radial as any).size ?? (radial as any).dims ?? (radial as any).dim;
    const width = Number((radial as any).width ?? (radial as any).w ?? sizeRaw?.[0]);
    const height = Number((radial as any).height ?? (radial as any).h ?? sizeRaw?.[1]);
    const dataRaw = (radial as any).data ?? (radial as any).values ?? null;
    if (!(width > 0 && height > 0 && dataRaw)) return null;
    const len = width * height;
    let data: Float32Array | null = null;
    if (dataRaw instanceof Float32Array && dataRaw.length >= len) {
      data = dataRaw;
    } else if (Array.isArray(dataRaw) && dataRaw.length >= len) {
      data = new Float32Array((dataRaw as number[]).slice(0, len));
    }
    if (!data) return null;
    const maxRRaw = (radial as any).maxR ?? (radial as any).hullMaxR;
    const maxR = Number.isFinite(maxRRaw) ? (maxRRaw as number) : undefined;
    return { data, size: [width, height] as [number, number], maxR };
  }, [live]);

  const hullSdf = useMemo(() => {
    const parseSdf = (sdf: any) => {
      if (!sdf) return null;
      const sizeRaw = (sdf as any).size ?? (sdf as any).dims ?? (sdf as any).dim ?? (sdf as any).shape;
      const nx = Number((sdf as any).nx ?? sizeRaw?.[0]);
      const ny = Number((sdf as any).ny ?? sizeRaw?.[1]);
      const nz = Number((sdf as any).nz ?? sizeRaw?.[2]);
      if (!(nx > 0 && ny > 0 && nz > 0)) return null;
      const len = nx * ny * nz;
      const dataRaw = (sdf as any).data ?? (sdf as any).values ?? (sdf as any).grid;
      let data: Float32Array | Uint8Array | null = null;
      let format: "float" | "byte" = "float";
      if (dataRaw instanceof Float32Array && dataRaw.length >= len) {
        data = dataRaw;
        format = "float";
      } else if (dataRaw instanceof Uint8Array && dataRaw.length >= len) {
        data = dataRaw;
        format = "byte";
      } else if (Array.isArray(dataRaw) && dataRaw.length >= len) {
        data = new Float32Array((dataRaw as number[]).slice(0, len));
        format = "float";
      }
      if (!data) return null;
      const boundsRaw = (sdf as any).bounds ?? (sdf as any).extents ?? (sdf as any).radius ?? null;
      const bounds: [number, number, number] | undefined =
        Array.isArray(boundsRaw) && boundsRaw.length >= 3
          ? [Math.abs(boundsRaw[0] ?? 0), Math.abs(boundsRaw[1] ?? 0), Math.abs(boundsRaw[2] ?? 0)] as [number, number, number]
          : undefined;
      const bandRaw =
        (sdf as any).band ?? (sdf as any).shellWidth ?? (sdf as any).wallWidth ??
        (sdf as any).band_m ?? (sdf as any).bandMeters;
      const band = Number.isFinite(bandRaw as number) ? (bandRaw as number) : undefined;
      return { data, dims: [nx, ny, nz] as [number, number, number], bounds, band, format };
    };

    const liveSdf = parseSdf((live as any)?.hull?.sdf ?? (live as any)?.hull?.SDF);
    if (liveSdf) return liveSdf;

    const latticeSdf = sharedLatticeState?.sdf ?? null;
    if (latticeSdf && latticeSdf.dims?.length === 3) {
      const [nx, ny, nz] = latticeSdf.dims;
      if (nx > 0 && ny > 0 && nz > 0 && latticeSdf.distances?.length) {
        return {
          data: latticeSdf.distances,
          dims: [nx, ny, nz] as [number, number, number],
          bounds: latticeSdf.bounds,
          band: latticeSdf.band,
          format: "float" as const,
        };
      }
    }

    return null;
  }, [live, sharedLatticeState?.sdf]);

  const hullRadiusMax = useMemo(() => {
    const sdfBound = hullSdf?.bounds
      ? Math.max(Math.abs(hullSdf.bounds[0] ?? 0), Math.abs(hullSdf.bounds[1] ?? 0), Math.abs(hullSdf.bounds[2] ?? 0))
      : null;
    const dimsRadius = hullDimsResolved
      ? Math.max(hullDimsResolved.Lx_m, hullDimsResolved.Ly_m, hullDimsResolved.Lz_m) * 0.5
      : null;
    const liveRadius = (() => {
      const a = Math.max(1e-3, fnum(live?.hull?.a, 1));
      const b = Math.max(1e-3, fnum(live?.hull?.b, 1));
      const c = Math.max(1e-3, fnum(live?.hull?.c, 1));
      return Math.max(a, b, c);
    })();
    const candidates = [sdfBound, dimsRadius, liveRadius, R].filter((v) => Number.isFinite(v as number) && (v as number) > 0) as number[];
    return candidates.length ? Math.max(...candidates) : 1.0;
  }, [hullSdf?.bounds, hullDimsResolved, live, R]);

  const fieldProbeColors = useMemo(() => {
    if (!useFieldProbeOverlay || !fieldProbe?.values?.length) return null;
    const { colors } = colorizeFieldProbe(fieldProbe.values, { absMax: fieldProbe.stats?.absMax });
    return colors;
  }, [fieldProbe?.stats?.absMax, fieldProbe?.values, useFieldProbeOverlay]);

  useEffect(() => {
    if (geometryUserOverrideRef.current) return;
    let next: HullGeometryMode | null = null;
    let reason: string | null = null;
    if (hullSdf) {
      next = "sdf";
      const dims = hullSdf.dims ? `${hullSdf.dims[0]}x${hullSdf.dims[1]}x${hullSdf.dims[2]}` : null;
      reason = `Auto: hull SDF${dims ? ` (${dims})` : ""}`;
    } else if (hullRadiusLUT) {
      next = "radial";
      const size = hullRadiusLUT.size ? `${hullRadiusLUT.size[0]}x${hullRadiusLUT.size[1]}` : null;
      reason = `Auto: radial LUT${size ? ` (${size})` : ""}`;
    } else {
      next = "ellipsoid";
    }
    if (next && next !== hullGeometry) {
      setHullGeometry(next);
      setAutoHullGeometryReason(reason);
    } else if (next === hullGeometry) {
      setAutoHullGeometryReason(reason);
    }
  }, [hullSdf, hullRadiusLUT, hullGeometry, live]);

  const hullDimsEffective = useMemo<[number, number, number]>(() => {
    const base: [number, number, number] = hullDimsResolved
      ? [
          Math.max(Math.abs(hullDimsResolved.Lx_m), 1e-3),
          Math.max(Math.abs(hullDimsResolved.Ly_m), 1e-3),
          Math.max(Math.abs(hullDimsResolved.Lz_m), 1e-3),
        ]
      : [
          Math.max(Math.abs(axes[0]) * R * 2, 1e-3),
          Math.max(Math.abs(axes[1]) * R * 2, 1e-3),
          Math.max(Math.abs(axes[2]) * R * 2, 1e-3),
        ];
    if (hullGeometry !== "ellipsoid") {
      const candidates = [...base];
      const maxR = hullRadiusLUT?.maxR;
      const maxSdfBound = hullSdf?.bounds
        ? Math.max(Math.abs(hullSdf.bounds[0]), Math.max(Math.abs(hullSdf.bounds[1]), Math.abs(hullSdf.bounds[2])))
        : undefined;
      if (Number.isFinite(maxSdfBound)) candidates.push((maxSdfBound as number) * 2);
      if (Number.isFinite(maxR)) candidates.push((maxR as number) * 2);
      const diameter = candidates.length ? Math.max(...candidates) : Math.max(...base);
      return [diameter, diameter, diameter];
    }
    return base;
  }, [axes, R, hullGeometry, hullRadiusLUT, hullSdf, hullDimsResolved]);

  const wireframeOverlayForRenderer = useMemo(() => {
    if (!showWireframeOverlay) return null;
    if (!wireframeOverlay.overlay) return null;
    if (useFieldProbeOverlay && fieldProbeColors) {
      return {
        ...wireframeOverlay.overlay,
        colors: fieldProbeColors,
        colorMode: "field" as const,
        colorSignature: fieldProbe?.meta?.cache?.key ?? `${wireframeOverlay.overlay.key}|field`,
        patches: fieldProbe?.patches ?? wireframeOverlay.overlay.patches,
        fieldThreshold: fieldProbe?.fieldThreshold ?? wireframeOverlay.overlay.fieldThreshold,
        gradientThreshold: fieldProbe?.gradientThreshold ?? wireframeOverlay.overlay.gradientThreshold,
        fieldStats: fieldProbe?.stats,
      };
    }
    return wireframeOverlay.overlay;
  }, [
    fieldProbe?.fieldThreshold,
    fieldProbe?.gradientThreshold,
    fieldProbe?.meta?.cache?.key,
    fieldProbe?.patches,
    fieldProbe?.stats,
    fieldProbeColors,
    showWireframeOverlay,
    useFieldProbeOverlay,
    wireframeOverlay.overlay,
  ]);

  const sectorPeriodMs = useMemo(() => {
    const cand = (live as any) ?? {};
    const v = fnum(
      cand?.sectorPeriod_ms ??
      cand?.sectorPeriodMs ??
      cand?.sectorPeriod ??
      (Number.isFinite(cand?.dwell_ms) ? cand?.dwell_ms : undefined),
      12.0
    );
    return Math.max(1e-3, v);
  }, [live]);

  const freqGHz = useMemo(() => {
    const cand = (live as any) ?? {};
    const v = fnum(
      cand?.freqGHz ??
      cand?.frequency_GHz ??
      cand?.modulationFreq_GHz ??
      cand?.tileFreq_GHz,
      15
    );
    return Math.max(0.01, v);
  }, [live]);

  const currentSector = useMemo(() => {
    const candidates = [
      (live as any)?.sectorIdx,
      (live as any)?.sectorIndex,
      (live as any)?.sectorPointer,
      (live as any)?.currentSector,
    ];
    const total = Math.max(1, totalSectors);
    for (const cand of candidates) {
      const n = Number(cand);
      if (Number.isFinite(n)) {
        const wrap = ((n % total) + total) % total;
        return wrap;
      }
    }
    return 0;
  }, [live, totalSectors]);

  const wallWidth_m = useMemo(() => {
    const candidates = [
      (live as any)?.wallWidth_m,
      (live as any)?.hull?.wallWidth_m,
      (live as any)?.wallWidth,
    ];
    for (const cand of candidates) {
      const n = Number(cand);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return 1.0;
  }, [live]);

  const lightLoop = useLightCrossingLoop({
    sectorStrobing: totalSectors,
    currentSector,
    sectorPeriod_ms: sectorPeriodMs,
    duty: dutyFR,
    freqGHz,
    hull: { a: axes[0], b: axes[1], c: axes[2] },
    wallWidth_m,
    localBurstFrac: resolveBurstFrac(live),
  });

  const loopSectorCount = Math.max(1, lightLoop.sectorCount || totalSectors);
  const loopSectorIdx = Number.isFinite(lightLoop.sectorIdx) ? lightLoop.sectorIdx : 0;
  const loopPhase = Number.isFinite(lightLoop.phase) ? lightLoop.phase : 0;
  const loopPhaseTotal = Math.max(1, loopSectorCount);
  const loopPhaseCycle = loopSectorIdx + loopPhase;
  const loopPhase01 = wrap01(loopPhaseCycle / loopPhaseTotal);

  useEffect(() => {
    const handlePhase = (payload: any) => {
      const phaseRaw = Number(payload?.phase01);
      if (!Number.isFinite(phaseRaw)) return;
      const wrapped = wrap01(phaseRaw);
      const contRaw = Number(payload?.phaseCont);
      const phaseCont = Number.isFinite(contRaw) ? contRaw : wrapped;
      const signRaw = Number(payload?.phaseSign);
      const sectorsRaw = Number(payload?.sectorsTotal);
      const total = Number.isFinite(sectorsRaw) && sectorsRaw > 0
        ? Math.max(1, Math.floor(sectorsRaw))
        : totalSectors;
      const wedgeIndex = Math.min(total - 1, Math.max(0, Math.floor(wrapped * total) % total));
      const nextIndex = total > 0 ? (wedgeIndex + 1) % total : wedgeIndex;
      const sourceRaw = typeof payload?.source === "string" ? payload.source.toLowerCase() : "";
      const mappedSource =
        sourceRaw === "scroll" ? "scroll"
        : sourceRaw === "metrics" ? "metrics"
        : sourceRaw === "server" ? "server"
        : "bus";
      setSharedPhase({
        mode: "auto",
        source: mappedSource,
        phase01: wrapped,
        phaseCont,
        sign: signRaw === -1 ? -1 : 1,
        wedgeIndex,
        nextWedgeIndex: nextIndex,
      });
      const tsecRaw = Number(payload?.Tsec_ms ?? payload?.tSec_ms ?? payload?.tsec_ms);
      const pumpPhaseRaw = Number(payload?.pumpPhase_deg ?? payload?.pumpPhaseDeg ?? payload?.pumpPhase);
      const tauLcRaw = Number(
        payload?.tauLC_ms ??
        payload?.tauLc_ms ??
        payload?.tau_lc_ms
      );
      const sectorIdxRaw = Number(
        payload?.sectorIdx ??
        payload?.sectorIndex ??
        payload?.sector ??
        wedgeIndex
      );
      const timestampRaw = Number(payload?.timestamp ?? payload?.ts ?? payload?.t);
      setBusPhasePayload((prev) => {
        const next = {
          phase01: wrapped,
          phaseCont,
          tsec_ms: Number.isFinite(tsecRaw) ? tsecRaw : undefined,
          pumpPhase_deg: Number.isFinite(pumpPhaseRaw) ? pumpPhaseRaw : undefined,
          tauLC_ms: Number.isFinite(tauLcRaw) ? Math.max(0, tauLcRaw) : undefined,
          sectorIndex: Number.isFinite(sectorIdxRaw) ? Math.max(0, Math.floor(sectorIdxRaw)) : undefined,
          source: mappedSource,
          timestamp: Number.isFinite(timestampRaw) ? timestampRaw : Date.now(),
        };
        if (
          prev &&
          prev.phase01 === next.phase01 &&
          prev.phaseCont === next.phaseCont &&
          prev.tsec_ms === next.tsec_ms &&
          prev.pumpPhase_deg === next.pumpPhase_deg &&
          prev.tauLC_ms === next.tauLC_ms &&
          prev.sectorIndex === next.sectorIndex &&
          prev.source === next.source
        ) {
          return prev;
        }
        return next;
      });
    };
    const stableId = subscribe("warp:phase:stable", handlePhase);
    const legacyId = subscribe("warp:phase", handlePhase);
    return () => {
      if (stableId) unsubscribe(stableId);
      if (legacyId) unsubscribe(legacyId);
    };
  }, [setSharedPhase, setBusPhasePayload, totalSectors]);

  useEffect(() => {
    if (followHullPhase) return;
    const dwellMsRaw = Number(lightLoop.dwell_ms);
    const dwell = Number.isFinite(dwellMsRaw) && dwellMsRaw > 0 ? dwellMsRaw : 1;
    const burstMsRaw = Number(lightLoop.burst_ms);
    const burst = Number.isFinite(burstMsRaw) ? Math.max(0, burstMsRaw) : 0;
    const burstFrac = Math.min(1, Math.max(0, burst / dwell));
    const half = burstFrac * 0.5;
    const windowStart = Math.max(0, 0.5 - half);
    const windowEnd = Math.min(1, 0.5 + half);
    setSharedPhase({
      mode: "auto",
      source: "time",
      phase01: loopPhase01,
      phaseCont: loopPhaseCycle,
      sign: 1,
      wedgeIndex: ((loopSectorIdx % loopPhaseTotal) + loopPhaseTotal) % loopPhaseTotal,
      nextWedgeIndex: ((loopSectorIdx + 1) % loopPhaseTotal + loopPhaseTotal) % loopPhaseTotal,
      dutyWindow: [windowStart, windowEnd],
      damp: 0.15,
    });
  }, [
    setSharedPhase,
    loopPhase01,
    loopPhaseCycle,
    loopPhaseTotal,
    loopSectorIdx,
    lightLoop.dwell_ms,
    lightLoop.burst_ms,
    followHullPhase,
  ]);

  const busPhase01 = Number.isFinite(sharedPhase?.phase01) ? sharedPhase.phase01 : null;
  const busPhaseCont = Number.isFinite(sharedPhase?.phaseCont) ? sharedPhase.phaseCont : null;
  const busPhaseSource = sharedPhase?.source ?? "time";
  const busPhaseUpdatedAt = Number.isFinite(sharedPhase?.updatedAt ?? NaN)
    ? sharedPhase?.updatedAt
    : undefined;

  useEffect(() => {
    if (busPhaseCont == null || !Number.isFinite(loopPhaseCycle)) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - lastPhaseSampleTimeRef.current < PHASE_HISTORY_SAMPLE_MS) {
      if (
        lastBusPhaseSampleRef.current !== null &&
        lastLoopPhaseSampleRef.current !== null &&
        Math.abs(busPhaseCont - lastBusPhaseSampleRef.current) < 1e-6 &&
        Math.abs(loopPhaseCycle - lastLoopPhaseSampleRef.current) < 1e-6
      ) {
        return;
      }
    } else {
      lastPhaseSampleTimeRef.current = now;
    }
    const pushHistory = (ref: React.MutableRefObject<number[]>, value: number) => {
      const history = ref.current;
      history.push(value);
      if (history.length > MAX_PHASE_HISTORY) {
        history.splice(0, history.length - MAX_PHASE_HISTORY);
      }
    };
    pushHistory(busPhaseHistoryRef, busPhaseCont);
    pushHistory(loopPhaseHistoryRef, loopPhaseCycle);
    lastBusPhaseSampleRef.current = busPhaseCont;
    lastLoopPhaseSampleRef.current = loopPhaseCycle;
    setPhaseHistoryTick((tick) => (tick + 1) % 1_000_000);
  }, [busPhaseCont, loopPhaseCycle]);

  const phaseSparkline = useMemo(() => {
    const loopHistory = loopPhaseHistoryRef.current;
    const busHistory = busPhaseHistoryRef.current;
    const len = Math.min(loopHistory.length, busHistory.length);
    if (len < 2) return null;
    const loopSlice = loopHistory.slice(-len);
    const busSlice = busHistory.slice(-len);
    const minVal = Math.min(...loopSlice, ...busSlice);
    const maxVal = Math.max(...loopSlice, ...busSlice);
    const range = Math.max(maxVal - minVal, 1e-6);
    const width = 120;
    const height = 28;
    const buildPath = (series: number[]) =>
      series
        .map((value, idx) => {
          const x = (idx / (len - 1)) * width;
          const norm = (value - minVal) / range;
          const y = height - norm * height;
          return `${idx === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ");
    return {
      width,
      height,
      loopPath: buildPath(loopSlice),
      busPath: buildPath(busSlice),
    };
  }, [phaseHistoryTick]);

  const busPhaseSummary = useMemo(() => {
    const loopText = `Loop φ=${loopPhase01.toFixed(3)} cyc`;
    if (busPhase01 == null) {
      return {
        text: `${loopText} | Bus φ=--`,
        busText: "Bus φ=--",
        loopText,
        deltaText: "--",
        diffCycles: null as number | null,
        title: "Bus phase not yet received",
      };
    }
    const diffCycles = smallestPhaseDelta(busPhase01, loopPhase01);
    const diffText =
      diffCycles == null
        ? "--"
        : `${diffCycles >= 0 ? "+" : "-"}${Math.abs(diffCycles).toFixed(2)} cyc`;
    const busText = `Bus φ=${busPhase01.toFixed(3)} cyc${
      busPhaseCont != null ? ` (cont ${busPhaseCont.toFixed(2)})` : ""
    }`;
    return {
      text: `${busText} | Δφ=${diffText} | ${loopText}`,
      busText,
      loopText,
      deltaText: diffText,
      diffCycles,
      title: `Bus φ=${(busPhase01 * 360).toFixed(1)}°, Loop φ=${(loopPhase01 * 360).toFixed(
        1
      )}°, Bus cont=${busPhaseCont != null ? busPhaseCont.toFixed(3) : "--"} cyc`,
    };
  }, [busPhase01, busPhaseCont, loopPhase01]);

  const phaseDiffIndicator = useMemo(() => {
    if (busPhaseSummary.diffCycles == null) return null;
    const diffCycles = busPhaseSummary.diffCycles;
    const diffAbs = Math.abs(diffCycles);
    const relation =
      diffAbs < 0.005 ? "aligned" : diffCycles > 0 ? "ahead" : "behind";
    const text =
      relation === "aligned"
        ? "Bus aligned ±0.01 cycles"
        : `Bus ${relation} by ${diffAbs.toFixed(2)} cycles`;
    const highlight = diffAbs >= BUS_PHASE_DIFF_THRESHOLD;
    const className = highlight
      ? "bg-amber-900/70 text-amber-200 ring-1 ring-amber-400/60"
      : "bg-emerald-900/50 text-emerald-200/90";
    const title = `Loop φ=${loopPhase01.toFixed(4)} cyc · Bus φ=${
      busPhase01 != null ? busPhase01.toFixed(4) : "--"
    } cyc`;
    return {
      text,
      className,
      title,
    };
  }, [busPhaseSummary.diffCycles, busPhase01, loopPhase01]);

  const busPayloadSummary = useMemo(() => {
    if (!busPhasePayload) return null;
    const tsec =
      busPhasePayload.tsec_ms != null
        ? `${busPhasePayload.tsec_ms.toFixed(2)} ms`
        : "--";
    const tauLC =
      busPhasePayload.tauLC_ms != null
        ? fmtTimeSmartMs(busPhasePayload.tauLC_ms)
        : "--";
    const pump =
      busPhasePayload.pumpPhase_deg != null
        ? `${busPhasePayload.pumpPhase_deg.toFixed(1)}°`
        : "--";
    const sector =
      busPhasePayload.sectorIndex != null
        ? `sector ${busPhasePayload.sectorIndex}`
        : "sector --";
    const sourceLabel = busPhasePayload.source ?? busPhaseSource;
    const updatedAt =
      busPhasePayload.timestamp != null
        ? new Date(busPhasePayload.timestamp).toISOString()
        : busPhaseUpdatedAt != null
          ? new Date(busPhaseUpdatedAt).toISOString()
          : null;
    const titleParts = [
      `Tsec_ms=${busPhasePayload.tsec_ms ?? "--"}`,
      `pumpPhase_deg=${busPhasePayload.pumpPhase_deg ?? "--"}`,
      `sector=${busPhasePayload.sectorIndex ?? "--"}`,
      `source=${sourceLabel}`,
    ];
    if (updatedAt) titleParts.push(`timestamp=${updatedAt}`);
    titleParts.push(`tauLC_ms=${busPhasePayload.tauLC_ms ?? "--"}`);
    return {
      text: `Bus payload Tsec ${tsec} | \u03C4LC ${tauLC} | pump \u03B8 ${pump} | ${sector}`,
      title: titleParts.join(", "),
    };
  }, [busPhasePayload, busPhaseSource, busPhaseUpdatedAt]);

  useEffect(() => {
    const tauLCmsRaw = Number(lightLoop.tauLC_ms);
    const burstMsRaw = Number(lightLoop.burst_ms);
    const dwellMsRaw = Number(lightLoop.dwell_ms);
    const tauLCms = Number.isFinite(tauLCmsRaw) ? tauLCmsRaw : undefined;
    const burstMs = Number.isFinite(burstMsRaw) ? burstMsRaw : undefined;
    const dwellMs = Number.isFinite(dwellMsRaw) ? dwellMsRaw : undefined;
    const ratio =
      tauLCms != null && tauLCms > 1e-9 && burstMs != null
        ? burstMs / tauLCms
        : undefined;
    const reciprocityStatus =
      ratio == null ? "unknown" : ratio >= 1 ? "pass" : "warn";
    const zetaRaw = Number(
      (live as any)?.zeta ??
        (live as any)?.zetaFordRoman ??
        (live as any)?.fordRomanZeta ??
        (live as any)?.warp?.zeta ??
        (live as any)?.energy?.zeta
    );
    const zetaLimitRaw = Number(
      (live as any)?.zetaLimit ??
        (live as any)?.zetaCeiling ??
        (live as any)?.warp?.zetaLimit ??
        1
    );
    const zetaValue = Number.isFinite(zetaRaw) ? zetaRaw : undefined;
    const zetaLimit = Number.isFinite(zetaLimitRaw) ? zetaLimitRaw : undefined;
    let zetaStatus: "pass" | "warn" | "limit" | "unknown" = "unknown";
    if (zetaValue != null && zetaLimit != null && zetaLimit > 0) {
      const frac = zetaValue / zetaLimit;
      if (frac >= 1) zetaStatus = "limit";
      else if (frac >= 0.9) zetaStatus = "warn";
      else zetaStatus = "pass";
    }
    setSharedCompliance({
      reciprocity: {
        tauLC_ms: tauLCms,
        burst_ms: burstMs,
        dwell_ms: dwellMs,
        ratio,
        status: reciprocityStatus,
      },
      zeta: {
        value: zetaValue,
        limit: zetaLimit,
        status: zetaStatus,
      },
    });
  }, [setSharedCompliance, lightLoop.tauLC_ms, lightLoop.burst_ms, lightLoop.dwell_ms, live]);

  useEffect(() => {
    const tauLCms = Number.isFinite(lightLoop.tauLC_ms ?? NaN) ? lightLoop.tauLC_ms : undefined;
    const burstMs = Number.isFinite(lightLoop.burst_ms ?? NaN) ? lightLoop.burst_ms : undefined;
    const dwellMs = Number.isFinite(lightLoop.dwell_ms ?? NaN) ? lightLoop.dwell_ms : undefined;
    const blend = Number.isFinite(hullBlend ?? NaN) ? hullBlend : 0;
    let key: "instant" | "tauLC" | "burst" | "sector" = "instant";
    if (hullMode === "instant" && blend <= 0.02) {
      key = "instant";
    } else if (blend >= 0.82) {
      key = "sector";
    } else if (blend >= 0.48) {
      key = "burst";
    } else {
      key = "tauLC";
    }
    const label =
      key === "instant"
        ? "Instant"
        : key === "tauLC"
          ? "τLC-window"
          : key === "burst"
            ? "Burst-window"
            : "One-sector";
    const duration =
      key === "instant"
        ? 0
        : key === "tauLC"
          ? tauLCms
          : key === "burst"
            ? burstMs
            : dwellMs;
    const provenance =
      key === "instant"
        ? "Instantaneous sample"
        : key === "tauLC"
          ? "Wall τLC (light-crossing)"
          : key === "burst"
            ? "Local RF burst window"
            : "Scheduler dwell period";
    setSharedSampling({
      key,
      label,
      durationMs: Number.isFinite(duration ?? NaN) ? duration : undefined,
      provenance,
    });
  }, [setSharedSampling, hullMode, hullBlend, lightLoop.tauLC_ms, lightLoop.burst_ms, lightLoop.dwell_ms]);

  const schedulerCenter = useMemo(() => {
    if (!syncScheduler) return null;
    const count = Math.max(1, loopSectorCount);
    const idx = ((loopSectorIdx % count) + count) % count;
    const center = (idx + loopPhase) / count;
    const frac = center - Math.floor(center);
    return frac < 0 ? frac + 1 : frac;
  }, [syncScheduler, loopSectorCount, loopSectorIdx, loopPhase]);

  const fallbackCenter = useMemo(() => {
    const total = Math.max(1, totalSectors);
    const candidates = [
      (live as any)?.sectorIdx,
      (live as any)?.sectorIndex,
      (live as any)?.sectorPointer,
      (live as any)?.currentSector,
    ];
    let idx = 0;
    for (const cand of candidates) {
      const n = Number(cand);
      if (Number.isFinite(n)) {
        idx = ((n % total) + total) % total;
        break;
      }
    }
    const center = (idx + Math.max(1, liveSectors) * 0.5) / total;
    const frac = center - Math.floor(center);
    return frac < 0 ? frac + 1 : frac;
  }, [live, totalSectors, liveSectors]);

  const sectorCenter = useMemo(() => {
    if (syncScheduler && schedulerCenter !== null) return schedulerCenter;
    return fallbackCenter;
  }, [syncScheduler, schedulerCenter, fallbackCenter]);

  const sectorCenter01 = useMemo(() => {
    const v = Number(sectorCenter);
    if (!Number.isFinite(v)) return 0;
    const frac = v - Math.floor(v);
    return frac < 0 ? frac + 1 : frac;
  }, [sectorCenter]);

  const gaussianSigma = useMemo(() => {
    const total = Math.max(1, totalSectors);
    const sigmaFromStore =
      typeof ds.effectiveSigma01 === "function"
        ? ds.effectiveSigma01(total)
        : Math.max(1e-6, ds.sigmaSectors) / total;
    const sliderSigma = Math.max(1e-4, sigmaFromStore);
    const liveSigma = Math.max(1, liveSectors) / total;
    return Math.max(sliderSigma, liveSigma * 0.35);
  }, [ds, totalSectors, liveSectors]);

  const overlayConfig = useMemo<Hull3DOverlayState>(() => {
    const isGRMode = planarVizMode === 0 || planarVizMode === 1;
    const phase = Number.isFinite(loopPhase) ? loopPhase : ds.phase01 ?? 0;
    const tauLCms = firstFinite(
      lightLoop.tauLC_ms,
      (live as any)?.tau_LC_ms,
      (live as any)?.lightCrossing?.tauLC_ms,
      (live as any)?.lightCrossing?.tau_ms
    );
    const burstMs = firstFinite(
      lightLoop.burst_ms,
      (live as any)?.burst_ms,
      (live as any)?.lightCrossing?.burst_ms,
      tauLCms
    );
    const dwellMs = firstFinite(
      lightLoop.dwell_ms,
      sectorPeriodMs,
      (live as any)?.dwell_ms,
      (live as any)?.sectorPeriod_ms,
      (live as any)?.lightCrossing?.dwell_ms
    );
    const thetaFloor = Math.max(1e-9, vizFloors.thetaGR ?? 1e-9);
    const rhoFloor = Math.max(1e-18, vizFloors.rhoGR ?? 1e-18);
    const isoStep = isGRMode ? (planarVizMode === 1 ? rhoFloor * 1.6 : thetaFloor * 1.4) : thetaFloor;
    const spacetimeGridPrefs = {
      enabled: spacetimeGridEnabled,
      mode: spacetimeGridMode,
      spacing_m: spacetimeGridSpacing,
      warpStrength: spacetimeGridWarpStrength,
      falloff_m: spacetimeGridFalloff,
      colorBy: spacetimeGridColorBy,
      useSdf: spacetimeGridUseSdf,
      warpStrengthMode: spacetimeGridStrengthMode,
    };

    const overlays: Hull3DOverlayState = {
      phase,
      kInvariants: {
        enabled: isGRMode && showKHeatOverlay,
        mode: planarVizMode === 1 ? 2 : 0,
        gain: planarVizMode === 1 ? 4.0 : 6.0,
        alpha: showKHeatOverlay ? 0.65 : 0,
      },
      thetaIso: {
        enabled: isGRMode && showThetaIsoOverlay,
        step: isoStep,
        width: 0.08,
        opacity: showThetaIsoOverlay ? 0.75 : 0,
      },
      fordRoman: {
        enabled: showFordRomanBar,
        tauLC: tauLCms,
        burst: burstMs,
        dwell: dwellMs,
        alpha: showFordRomanBar ? 0.85 : 0,
      },
      sectorArc: {
        enabled: showSectorArcOverlay,
        radiusPx: 74,
        widthPx: 8,
        gapPx: 11,
        instantAlpha: showSectorArcOverlay ? 0.72 : 0,
        emaAlpha: showSectorArcOverlay ? 0.58 : 0,
      },
      curvature: {
        enabled: curvatureOverlay.enabled,
        gain: curvatureOverlay.gain,
        alpha: curvatureOverlay.alpha,
        palette: curvatureOverlay.palette,
        showQIMargin: curvatureOverlay.showQIMargin,
      },
      spacetimeGrid: spacetimeGridPrefs,
    };

    const epsilonTilt = firstFinite(
      (live as any)?.epsilonTilt,
      (live as any)?.shiftVector?.epsilonTilt,
      (live as any)?.warp?.epsilonTilt
    );
    const rawTilt = ((live as any)?.betaTiltVec
      ?? (live as any)?.shiftVector?.betaTiltVec
      ?? (live as any)?.warp?.betaTiltVec) as number[] | undefined;

    let derivedTilt: TiltDirective | null = null;
    if (Number.isFinite(epsilonTilt) && rawTilt && rawTilt.length === 3) {
      const dir2: [number, number] = [rawTilt[0] || 0, rawTilt[1] || 0];
      const len = Math.hypot(dir2[0], dir2[1]) || 1;
      derivedTilt = {
        enabled: true,
        dir: [dir2[0] / len, dir2[1] / len],
        magnitude: Math.min(1, Math.abs(epsilonTilt) / 5e-7),
        alpha: 0.85,
      };
    }

    const tiltSource = busTiltDirective?.enabled ? busTiltDirective : derivedTilt;
    if (showTiltOverlay && tiltSource) {
      const norm = Math.hypot(tiltSource.dir[0], tiltSource.dir[1]) || 1;
      overlays.tilt = {
        enabled: true,
        dir: [tiltSource.dir[0] / norm, tiltSource.dir[1] / norm],
        magnitude: clamp(tiltSource.magnitude ?? 0, 0, 1),
        alpha: tiltSource.alpha !== undefined ? clamp(tiltSource.alpha, 0, 1) : 0.85,
        ...(typeof tiltSource.gain === "number" ? { gain: tiltSource.gain } : {}), // [tilt-gain]
        ...(tiltSource.gainMode === "manual" || tiltSource.gainMode === "curvature"
          ? { gainMode: tiltSource.gainMode }
          : {}), // [tilt-gain]
      };
    }

    return overlays;
  }, [
    planarVizMode,
    showKHeatOverlay,
    showThetaIsoOverlay,
    showFordRomanBar,
    showSectorArcOverlay,
    showTiltOverlay,
    loopPhase,
    ds.phase01,
    lightLoop.tauLC_ms,
    lightLoop.burst_ms,
    lightLoop.dwell_ms,
    sectorPeriodMs,
    vizFloors.thetaGR,
    vizFloors.rhoGR,
    live,
    curvatureOverlay,
    busTiltDirective,
    spacetimeGridEnabled,
    spacetimeGridMode,
    spacetimeGridSpacing,
    spacetimeGridWarpStrength,
    spacetimeGridFalloff,
    spacetimeGridColorBy,
    spacetimeGridUseSdf,
    spacetimeGridStrengthMode,
  ]);

  const syncMode = useMemo(() => (syncScheduler && schedulerCenter !== null ? 1 : 0), [syncScheduler, schedulerCenter]);
  const latticeProfileTag = viewerProfileTag === "card" ? "card" : "preview";
  const latticeAvailable = hullDimsResolved?.source === "preview" && !!hullPreview;
  const latticeEnabled = latticeModeEnabled && latticeAvailable;

  const latticeFrame = useMemo(() => {
    if (!latticeEnabled || !hullDimsResolved) return null;
    return buildLatticeFrame({
      hullDims: {
        Lx_m: hullDimsResolved.Lx_m,
        Ly_m: hullDimsResolved.Ly_m,
        Lz_m: hullDimsResolved.Lz_m,
      },
      basis: hullDimsResolved.basis ?? HULL_BASIS_IDENTITY,
      boundsProfile: bubbleBoundsMode ?? "tight",
      preset: hullQuality,
      profileTag: latticeProfileTag,
    });
  }, [
    latticeEnabled,
    hullDimsResolved,
    bubbleBoundsMode,
    hullQuality,
    latticeProfileTag,
  ]);

  const latticeSdfFrame = useMemo(() => {
    if (latticeFrame) return latticeFrame;
    if (!hullPreview || !hullDimsResolved) return null;
    return buildLatticeFrame({
      hullDims: {
        Lx_m: hullDimsResolved.Lx_m,
        Ly_m: hullDimsResolved.Ly_m,
        Lz_m: hullDimsResolved.Lz_m,
      },
      basis: hullDimsResolved.basis ?? HULL_BASIS_IDENTITY,
      boundsProfile: bubbleBoundsMode ?? "tight",
      preset: hullQuality,
      profileTag: latticeProfileTag,
    });
  }, [latticeFrame, hullPreview, hullDimsResolved, bubbleBoundsMode, hullQuality, latticeProfileTag]);

  const latticeStrobeBuild = useMemo(() => {
    if (!latticeEnabled || !hullDimsResolved || !hullPreview) return null;
    const strobe = buildHullSurfaceStrobe(hullPreview, {
      surface: {
        lod: wireframeLod,
        targetDims: {
          Lx_m: hullDimsResolved.Lx_m,
          Ly_m: hullDimsResolved.Ly_m,
          Lz_m: hullDimsResolved.Lz_m,
        },
        totalSectors,
        ...wireframeBudgets,
      },
    });
    const basisSig = strobe.surface?.basis ? latticeBasisSignature(strobe.surface.basis) : undefined;
    return { strobe, basisSig };
  }, [latticeEnabled, hullDimsResolved, hullPreview, wireframeLod, totalSectors, wireframeBudgets]);

  const latticeDesiredWeightHash = useMemo(() => {
    const strobe = latticeStrobeBuild?.strobe;
    const hist = strobe?.histogram;
    if (!latticeEnabled || !strobe || !hist) return null;
    const params: LatticeStrobeWeightParams = {
      totalSectors: strobe.surface?.sectorCount ?? totalSectors,
      liveSectors,
      sectorCenter01,
      gaussianSigma,
      sectorFloor: ds.sectorFloor,
      splitEnabled: ds.splitEnabled,
      splitFrac: ds.splitFrac,
      syncMode,
    };
    const basisSig = latticeStrobeBuild?.basisSig ?? "basis:none";
    const cacheKeyRaw = [
      strobe.hash ?? "surface:none",
      basisSig,
      latticeParamsSignature(params),
      hist.sectorCount,
      hist.triangleAreaTotal ?? 0,
    ].join("|");
    return fnv1a32(cacheKeyRaw);
  }, [
    latticeEnabled,
    latticeStrobeBuild,
    totalSectors,
    liveSectors,
    sectorCenter01,
    gaussianSigma,
    ds.sectorFloor,
    ds.splitEnabled,
    ds.splitFrac,
    syncMode,
  ]);

  const latticeDesiredDfdrSignature = useMemo(
    () => `${sigma.toFixed(6)}|${beta.toFixed(6)}|${R.toFixed(3)}`,
    [sigma, beta, R],
  );
  const latticeDesiredDriveLadderSignature = useMemo(() => {
    return [
      latticeDesiredDfdrSignature,
      `g${Math.round(gate * 1e6)}`,
      `d${Math.round(ampChain * 1e6)}`,
    ].join("|");
  }, [latticeDesiredDfdrSignature, gate, ampChain]);
  // Apply sector weights in-shader for continuous phase; keep voxel volume weights uniform.
  const latticeUseDynamicWeights = true;

  const latticeGuardrails = useMemo(() => {
    const messages: Array<{ level: "warn" | "error"; label: string }> = [];
    if (!latticeModeEnabled) {
      return {
        messages,
        staleHash: false,
        desiredWeightHash: null as string | null,
        builtWeightHash: null as string | null,
      };
    }
    const vol = sharedLatticeState?.volume;
    const hasVolume = !!vol;
    if (hasVolume && (vol?.stats?.budgetHit || vol?.clampReasons?.includes("voxel:budgetHit"))) {
      messages.push({ level: "error", label: "Over budget" });
    }
    if (latticeRequireSdf && hasVolume && !sharedLatticeState?.sdf) {
      messages.push({ level: "warn", label: "Missing SDF (required)" });
    } else if (!latticeRequireSdf && hasVolume && !sharedLatticeState?.sdf) {
      messages.push({ level: "warn", label: "Missing SDF" });
    }

    const desired = latticeUseDynamicWeights ? null : latticeDesiredWeightHash;
    const built = latticeUseDynamicWeights ? null : (sharedLatticeState?.strobe?.weightHash ?? null);
    const staleHash = !latticeUseDynamicWeights && !!(desired && built && desired !== built);
    if (!latticeUseDynamicWeights) {
      if (desired && !built) {
        messages.push({ level: "warn", label: "Weights pending" });
      } else if (staleHash) {
        messages.push({ level: "warn", label: "Stale hash" });
      }
    }

    return { messages, staleHash, desiredWeightHash: desired, builtWeightHash: built };
  }, [
    latticeModeEnabled,
    latticeRequireSdf,
    sharedLatticeState?.volume,
    sharedLatticeState?.sdf,
    sharedLatticeState?.strobe?.weightHash,
    latticeDesiredWeightHash,
    latticeUseDynamicWeights,
  ]);

  const latticeVolumeForRenderer = useMemo(() => {
    if (!latticeModeEnabled) return null;
    const vol = sharedLatticeState?.volume ?? null;
    if (!vol) return null;
    if (vol.stats?.budgetHit || vol.clampReasons?.includes("voxel:budgetHit")) return null;
    if (latticeRequireSdf && !sharedLatticeState?.sdf) return null;
    const desiredWeightHash = latticeDesiredWeightHash;
    const builtWeightHash = sharedLatticeState?.strobe?.weightHash ?? null;
    if (!latticeUseDynamicWeights && desiredWeightHash && builtWeightHash !== desiredWeightHash) return null;
    const desiredDriveSig = latticeDesiredDriveLadderSignature;
    const builtDriveSig = vol.metadata?.driveLadder?.signature ?? null;
    if (desiredDriveSig && builtDriveSig && builtDriveSig !== desiredDriveSig) return null;
    return vol;
  }, [
    latticeModeEnabled,
    latticeRequireSdf,
    sharedLatticeState?.volume,
    sharedLatticeState?.sdf,
    sharedLatticeState?.strobe?.weightHash,
    latticeDesiredWeightHash,
    latticeDesiredDriveLadderSignature,
    latticeUseDynamicWeights,
  ]);
  const latticeSdfForRenderer = useMemo(() => {
    if (!latticeVolumeForRenderer) return null;
    return sharedLatticeState?.sdf ?? null;
  }, [latticeVolumeForRenderer, sharedLatticeState?.sdf]);

  type LatticeFallbackStatusLevel = "info" | "warn" | "error";
  type LatticeFallbackStatus = {
    reason: string;
    level: LatticeFallbackStatusLevel;
    label: string;
    hint?: string;
    detail?: string;
  };

  const latticeFallbackStatus = useMemo<LatticeFallbackStatus | null>(() => {
    const volumeFailedReason =
      typeof (latticeGpuStatus as any)?.volumeFailedReason === "string"
        ? String((latticeGpuStatus as any).volumeFailedReason)
        : null;
    const formatReason =
      typeof (latticeGpuStatus as any)?.runtime?.formatReason === "string"
        ? String((latticeGpuStatus as any).runtime.formatReason)
        : typeof (latticeGpuStatus as any)?.runtime?.telemetry?.downgradeReason === "string"
          ? String((latticeGpuStatus as any).runtime.telemetry.downgradeReason)
          : null;
    const caps = (latticeGpuStatus as any)?.caps ?? null;

    if (!latticeModeEnabled) {
      return { reason: "disabled", level: "info", label: "Disabled", hint: "Lattice sampling disabled." };
    }
    if (!latticeAvailable) {
      return {
        reason: "preview-missing",
        level: "warn",
        label: "Preview missing",
        hint: "Load a preview hull (GLB) via Model Silhouette before enabling lattice sampling; using analytic ellipsoid instead.",
      };
    }

    const frame = sharedLatticeState?.frame ?? null;
    const frameClampReasons = frame?.clampReasons ?? [];
    if (!frame) {
      return {
        reason: "frame-missing",
        level: "warn",
        label: "Frame missing",
        hint: "Waiting for lattice frame build.",
      };
    }
    // Keep running with a clamped frame; diagnostics panel surfaces clamp reasons.

    const volume = sharedLatticeState?.volume ?? null;
    const volumeClampReasons = volume?.clampReasons ?? [];
    if (!volume) {
      return {
        reason: "volume-missing",
        level: "warn",
        label: "Volume missing",
        hint: "Waiting for lattice voxelization.",
      };
    }

    const volumeBudgetHit =
      volume.stats?.budgetHit || volumeClampReasons.some((reason) => reason.includes("budget"));
    if (volumeBudgetHit) {
      return {
        reason: "volume-over-budget",
        level: "error",
        label: "Volume over budget",
        hint: "Lower lattice preset / quality or increase voxel size; lattice auto-falls back to analytic.",
        detail: volumeClampReasons.length ? volumeClampReasons.join(", ") : "voxel:budgetHit",
      };
    }

    const desiredWeightHash = latticeDesiredWeightHash;
    const builtWeightHash = sharedLatticeState?.strobe?.weightHash ?? null;
    if (!latticeUseDynamicWeights && desiredWeightHash && builtWeightHash !== desiredWeightHash) {
      return {
        reason: "hash-stale",
        level: "warn",
        label: "Rebuilding weights",
        hint: `Scheduler params changed; using analytic until lattice rebuild completes (want ${desiredWeightHash} vs built ${builtWeightHash ?? "n/a"}).`,
        detail: `want=${desiredWeightHash} built=${builtWeightHash ?? "n/a"}`,
      };
    }

    const desiredDriveSig = latticeDesiredDriveLadderSignature;
    const builtDriveSig = volume.metadata?.driveLadder?.signature ?? null;
    if (desiredDriveSig && builtDriveSig && builtDriveSig !== desiredDriveSig) {
      return {
        reason: "drive-ladder-mismatch",
        level: "warn",
        label: "Drive ladder changed",
        hint: "Drive ladder scalars changed; using analytic until volume rebuild completes.",
      };
    }

    if (latticeRequireSdf && !sharedLatticeState?.sdf) {
      return {
        reason: "sdf-missing-required",
        level: "warn",
        label: "Missing SDF (required)",
        hint: "Wait for SDF build or disable Require SDF to re-enable lattice sampling.",
      };
    }

    if (caps) {
      if (!caps.max3DTextureSize || caps.max3DTextureSize <= 0) {
        return {
          reason: "caps:texture3d-unsupported",
          level: "warn",
          label: "3D textures unavailable",
          hint: "Browser lacks 3D textures; reverting to analytic ellipsoid.",
          detail: "caps:texture3d-unsupported",
        };
      }
      if (!caps.supportsFloatLinear && !caps.supportsHalfFloatLinear) {
        return {
          reason: "caps:no-linear-filter",
          level: "warn",
          label: "No linear filtering",
          hint: "GPU lacks float/half-float linear filtering; using analytic ellipsoid.",
          detail: "caps:float-linear",
        };
      }
      if (!caps.supportsColorFloat) {
        return {
          reason: "caps:no-float-texture",
          level: "warn",
          label: "Float targets unavailable",
          hint: "GPU float targets unavailable for lattice volume; reverting to analytic ellipsoid.",
          detail: "caps:color-buffer-float",
        };
      }
    }

    if (latticeGpuStatus?.volumeFailed) {
      const capsHint =
        volumeFailedReason === "caps:max3dTextureSize"
          ? "MAX_3D_TEXTURE_SIZE too small for lattice dims; lower lattice preset."
          : volumeFailedReason === "caps:maxTextureSize"
            ? "MAX_TEXTURE_SIZE too small for atlas fallback; lower lattice preset."
            : null;
      const budgetFail = volumeFailedReason?.startsWith("budget:");
      const capsFail = volumeFailedReason?.startsWith("caps:");
      return {
        reason: budgetFail ? "gpu-volume-budget" : capsFail ? "gpu-volume-caps" : "gpu-volume-upload-failed",
        level: budgetFail ? "warn" : "error",
        label: budgetFail ? "GPU budget hit" : capsHint ? "GPU caps insufficient" : "GPU upload failed",
        hint:
          budgetFail && volumeFailedReason === "budget:bytes"
            ? "Volume upload exceeded GPU byte budget; lower preset or voxel density."
            : budgetFail
              ? "Volume upload exceeded GPU voxel budget; lower preset or voxel density."
              : capsHint ?? "Volume upload failed; try lowering lattice preset or reload the viewer.",
        ...(volumeFailedReason ? { detail: volumeFailedReason } : {}),
      };
    }

    if (latticeRequireSdf && latticeGpuStatus?.sdfFailed) {
      const detail =
        typeof (latticeGpuStatus as any)?.sdfFailedReason === "string"
          ? String((latticeGpuStatus as any).sdfFailedReason)
          : null;
      return {
        reason: "gpu-sdf-upload-failed",
        level: "warn",
        label: "SDF upload failed",
        hint: "Hull SDF band upload failed; analytic blending will be used instead.",
        ...(detail ? { detail } : {}),
      };
    }

    if (latticeGpuStatus && !latticeGpuStatus.volumeReady) {
      return {
        reason: "gpu-volume-upload-pending",
        level: "info",
        label: "Uploading volume",
        hint: "Uploading lattice volume to GPU.",
      };
    }

    if (latticeRequireSdf && latticeGpuStatus && !latticeGpuStatus.sdfReady) {
      return {
        reason: "gpu-sdf-upload-pending",
        level: "info",
        label: "Uploading SDF",
        hint: "Uploading hull SDF band to GPU.",
      };
    }

    if (formatReason && formatReason.startsWith("caps:")) {
      return {
        reason: formatReason,
        level: "warn",
        label: "GPU downgraded lattice",
        hint: "Viewer downgraded lattice format due to GPU caps; using analytic ellipsoid instead.",
        detail: formatReason,
      };
    }

    const runtime = (latticeGpuStatus as any)?.runtime;
    if (runtime && !runtime.hasLatticeVolume && !latticeVolumeForRenderer) {
      return {
        reason: "analytic-fallback",
        level: "warn",
        label: "Analytic fallback",
        hint: "Lattice not active; using analytic volume.",
        detail: runtime.formatReason ?? formatReason ?? undefined,
      };
    }

    return null;
  }, [
    latticeModeEnabled,
    latticeAvailable,
    latticeRequireSdf,
    latticeDesiredWeightHash,
    latticeDesiredDriveLadderSignature,
    latticeVolumeForRenderer,
    sharedLatticeState?.frame,
    sharedLatticeState?.volume,
    sharedLatticeState?.sdf,
    sharedLatticeState?.strobe?.weightHash,
    latticeGpuStatus,
    latticeUseDynamicWeights,
  ]);

  const latticeRuntime = useMemo(() => (latticeGpuStatus as any)?.runtime ?? null, [latticeGpuStatus]);
  const frameClampSignature = useMemo(
    () => (sharedLatticeState?.frame?.clampReasons ?? []).join("|"),
    [sharedLatticeState?.frame?.clampReasons]
  );
  const sdfClampSignature = useMemo(() => {
    const sdf: any = sharedLatticeState?.sdf ?? null;
    const parts: string[] = [];
    if (Array.isArray(sdf?.clampReasons)) {
      parts.push(...sdf.clampReasons.filter(Boolean));
    }
    const stats = sdf?.stats ?? null;
    if (stats) {
      if (Array.isArray(stats.clampReasons)) {
        parts.push(...stats.clampReasons.filter(Boolean));
      }
      if (stats.fallbackReason) parts.push(String(stats.fallbackReason));
      if (stats.budgetHit) parts.push("budget:hit");
    }
    const sdfFailedReason =
      typeof (latticeGpuStatus as any)?.sdfFailedReason === "string"
        ? String((latticeGpuStatus as any).sdfFailedReason)
        : null;
    if (sdfFailedReason) parts.push(sdfFailedReason);
    return parts.join("|");
  }, [sharedLatticeState?.sdf, latticeGpuStatus]);
  const latticePathActive = latticeRuntime?.hasLatticeVolume && !latticeFallbackStatus;
  const latticeOverlayVolumeReady = latticePathActive && !!latticeVolumeForRenderer;
  const latticeRebuildPending =
    latticePathActive && !latticeOverlayVolumeReady && !!sharedLatticeState?.volume;
  const overlayLockedReason = useMemo(() => {
    if (!latticeModeEnabled) return "Lattice disabled";
    if (!latticeAvailable) return "Preview mesh required";
    if (latticeFallbackStatus) return latticeFallbackStatus.hint ?? latticeFallbackStatus.label;
    if (latticeGuardrails.staleHash) return "Rebuilding lattice weights";
    if (latticeRebuildPending) return "Rebuilding lattice";
    if (!latticeOverlayVolumeReady) return "Lattice not ready";
    return null;
  }, [
    latticeAvailable,
    latticeFallbackStatus,
    latticeGuardrails.staleHash,
    latticeModeEnabled,
    latticeOverlayVolumeReady,
    latticeRebuildPending,
  ]);
  const voxelSlicesSuppressed = latticeOverlayVolumeReady; // hide 2D slice overlays when 3D volume is live
  const voxelOverlayActive =
    latticeOverlayVolumeReady &&
    !overlayLockedReason &&
    (coverageHeatmapEnabled || (voxelSlicesEnabled && !voxelSlicesSuppressed));
  const voxelSliceActive = voxelOverlayActive && voxelSlicesEnabled && !voxelSlicesSuppressed;
  const surfaceOverlaySuppressed = latticeOverlayVolumeReady; // hide surface debug when 3D volume is live
  const overlayCanvasVisible = overlayHudEnabled || voxelOverlayActive;
  const overlayControlsDisabled = !!overlayLockedReason || !latticeOverlayVolumeReady;
  const sliceControlsDisabled = overlayControlsDisabled || !voxelSlicesEnabled;
  const spacetimeGridBadges = useMemo(() => {
    if (!spacetimeGridEnabled) return [] as Array<{ label: string; title?: string; level: "info" | "warn" }>;
    const degraded = spacetimeGridDbg?.degraded ?? null;
    const reasons = Array.isArray(degraded?.reasons) ? degraded.reasons : [];
    const spacingUsedRaw = Number(degraded?.spacingUsed_m ?? spacetimeGridSpacing);
    const spacingReqRaw = Number(degraded?.spacingRequested_m ?? spacetimeGridSpacing);
    const spacingUsed = Number.isFinite(spacingUsedRaw) ? spacingUsedRaw : spacetimeGridSpacing;
    const spacingReq = Number.isFinite(spacingReqRaw) ? spacingReqRaw : spacetimeGridSpacing;
    const postEnabled = spacetimeGridDbg?.postEnabled ?? spacetimeGridDbg?.enabled;
    const postMode = spacetimeGridDbg?.postMode ?? null;
    const volumeActive = Boolean(spacetimeGridDbg?.volumeEnabled ?? spacetimeGridMode === "volume");
    const boundsExpanded = Number(spacetimeGridDbg?.bounds?.expandedBy_m ?? 0);
    const gpuReason = typeof spacetimeGridDbg?.gpu?.formatReason === "string"
      ? spacetimeGridDbg.gpu.formatReason
      : null;
    const badges: Array<{ label: string; title?: string; level: "info" | "warn" }> = [];
    if (postEnabled === false) {
      badges.push({
        label: "Post shader off",
        level: "warn",
        title: "Surface/slice overlay disabled; try toggling Spacetime grid or reloading the viewer.",
      });
    }
    if (volumeActive && postEnabled) {
      badges.push({
        label: "Surface + Volume",
        level: "info",
        title: `Rendering shell overlay with volume cage (${postMode ?? "surface"}).`,
      });
    }
    if (gpuReason) {
      badges.push({
        label: "GPU fallback",
        level: "warn",
        title: `GPU format fallback: ${gpuReason}`,
      });
    }
    const sdfMissing = Boolean(degraded?.sdfMissing || reasons.includes("sdf-missing"));
    const analyticOnly = Boolean(degraded?.analyticOnly || reasons.includes("analytic-only"));
    if (sdfMissing) {
      badges.push({
        label: "SDF missing",
        level: "warn",
        title: "Lattice SDF unavailable; using analytic distance fallback.",
      });
    } else if (analyticOnly) {
      badges.push({
        label: "Analytic only",
        level: "info",
        title: "SDF sampling disabled; using analytic distance fallback.",
      });
    }
    if (reasons.includes("coarse-spacing")) {
      const detail = spacingReq !== spacingUsed
        ? `Requested ${spacingReq.toFixed(2)} m, using ${spacingUsed.toFixed(2)} m`
        : `Spacing ${spacingUsed.toFixed(2)} m`;
      badges.push({
        label: "Coarse spacing",
        level: "warn",
        title: reasons.includes("line-cap") ? `${detail} (line cap)` : detail,
      });
    }
    if (reasons.includes("line-cap")) {
      badges.push({
        label: "Line cap",
        level: "warn",
        title: "Line budget hit; spacing increased to keep GPU budget in bounds.",
      });
    }
    if (Number.isFinite(boundsExpanded) && boundsExpanded > 1e-3) {
      badges.push({
        label: "Expanded bounds",
        level: "info",
        title: `Grid bounds expanded by ${boundsExpanded.toFixed(2)} m to show the waveform.`,
      });
    }
    return badges;
  }, [spacetimeGridDbg, spacetimeGridEnabled, spacetimeGridMode, spacetimeGridSpacing]);
  const latticeDowngradeLabel = latticeRuntime?.useAtlas
    ? "2D atlas"
    : latticeRuntime?.formatLabel?.replace(/^3D\s+/i, "") ?? (latticePathActive ? "R32F" : "analytic");
  const latticeDowngradeReason =
    (latticeRuntime as any)?.formatReason ??
    ((latticeRuntime as any)?.telemetry?.downgradeReason ?? null);

  const latticeBaseKeyRef = useRef<string>("");
  useEffect(() => {
    const key = latticeEnabled && latticeFrame && latticeStrobeBuild?.strobe
      ? [
          latticeFrame.profileTag,
          latticeFrame.preset,
          latticeFrame.dims.join("x"),
          latticeFrame.voxelSize_m.toFixed(6),
          latticeFrame.boundsProfile,
          latticeStrobeBuild.strobe.hash,
          latticeStrobeBuild.strobe.lod,
          latticeStrobeBuild.strobe.source,
          latticeStrobeBuild.strobe.surface?.meshHash ?? "mesh:none",
        ].join("|")
      : `off|${latticeProfileTag}|${latticeModeEnabled ? 1 : 0}|${latticeAvailable ? 1 : 0}`;

    if (key === latticeBaseKeyRef.current) return;
    latticeBaseKeyRef.current = key;

    if (!latticeEnabled || !latticeFrame || !latticeStrobeBuild?.strobe) {
      setSharedLattice({
        frame: null,
        preset: "auto",
        profileTag: latticeProfileTag,
        strobe: null,
        sdf: null,
        volume: null,
      });
      return;
    }

    const strobe = latticeStrobeBuild.strobe;
    setSharedLattice({
      frame: latticeFrame,
      preset: latticeFrame.preset,
      profileTag: latticeFrame.profileTag,
      strobe: {
        hash: strobe.hash,
        source: strobe.source,
        lod: strobe.lod,
        meshHash: strobe.surface?.meshHash,
        basisSignature: latticeStrobeBuild.basisSig,
        handedness: strobe.surface?.handedness,
        sectorCount: strobe.surface?.sectorCount,
        triangleCount: strobe.surface?.triangleCount,
        vertexCount: strobe.surface?.vertexCount,
        clampReasons: strobe.clampReasons,
        weightHash: undefined,
        weightCacheHit: false,
        hist: strobe.histogram,
        weights: null,
        coverage: null,
      },
      sdf: null,
      volume: null,
    });
  }, [latticeEnabled, latticeFrame, latticeStrobeBuild, latticeModeEnabled, latticeAvailable, latticeProfileTag, setSharedLattice]);

  const latticeVolumeTimerRef = useRef<number | null>(null);
  const latticeVolumePendingSinceRef = useRef<number | null>(null);
  const latticeVolumeWantedKeyRef = useRef<string | null>(null);
  const latticeVolumeBuildingRef = useRef(false);
  const latticeRebuildWatchdogs = useRef({
    preview: new LatticeRebuildWatchdog(LATTICE_PROFILE_PERF.preview.rebuildMinMs),
    card: new LatticeRebuildWatchdog(LATTICE_PROFILE_PERF.card.rebuildMinMs),
  });
  const [latticeWatchdogStats, setLatticeWatchdogStats] = useState({ blocked: 0, lastBlockedAt: 0 });

  useEffect(() => {
    if (!latticeEnabled) {
      if (latticeVolumeTimerRef.current != null) {
        window.clearTimeout(latticeVolumeTimerRef.current);
        latticeVolumeTimerRef.current = null;
      }
      latticeVolumePendingSinceRef.current = null;
      latticeVolumeWantedKeyRef.current = null;
      latticeVolumeBuildingRef.current = false;
      setLatticeWatchdogStats({ blocked: 0, lastBlockedAt: 0 });
      return;
    }

    const strobe = latticeStrobeBuild?.strobe;
    const frame = latticeFrame;
    if (!frame || !strobe?.surface || !strobe.histogram) {
      setSharedLattice({ volume: null });
      return;
    }

    const rails = LATTICE_PROFILE_PERF[latticeProfileTag] ?? LATTICE_PROFILE_PERF.preview;
    const frameVoxels = Math.max(1, frame.voxelCount ?? frame.dims[0] * frame.dims[1] * frame.dims[2]);
    const estBytes = estimateLatticeUploadBytes(frame.dims, { packedRG: true, bytesPerComponent: 4 });
    const perfClampReasons: string[] = [];
    if (frameVoxels > rails.maxVoxels) perfClampReasons.push("budget:maxVoxels");
    if (estBytes > rails.maxBytes) perfClampReasons.push("budget:maxBytes");
    if (perfClampReasons.length) {
      const clampedFrame = {
        ...frame,
        clampReasons: Array.from(new Set([...(frame.clampReasons ?? []), ...perfClampReasons])),
      };
      setSharedLattice({
        frame: clampedFrame,
        volume: null,
        updatedAt: Date.now(),
      });
      publish("hull3d:lattice:fallback", {
        ts: Date.now(),
        enabled: latticeModeEnabled,
        reason: perfClampReasons[0],
        label: "Perf clamp",
        detail: perfClampReasons.join(", "),
        path: "analytic",
        caps: null,
        runtime: null,
        frameClampReasons: clampedFrame.clampReasons,
        volumeClampReasons: perfClampReasons,
      });
      return;
    }

    const desiredWeightHash = latticeDesiredWeightHash;
    if (!desiredWeightHash && !latticeUseDynamicWeights) return;

    const currentWeightHash = sharedLatticeState?.strobe?.weightHash ?? null;
    const currentDriveSig = sharedLatticeState?.volume?.metadata?.driveLadder?.signature ?? null;
    const desiredDriveSig = latticeDesiredDriveLadderSignature;
    const surfaceHash = strobe.hash;
    const currentSurfaceHash = sharedLatticeState?.strobe?.hash ?? null;

    const needsRebuild =
      !sharedLatticeState?.volume ||
      currentSurfaceHash !== surfaceHash ||
      (!latticeUseDynamicWeights && currentWeightHash !== desiredWeightHash) ||
      currentDriveSig !== desiredDriveSig;

    if (!needsRebuild) {
      if (latticeVolumeTimerRef.current != null) {
        window.clearTimeout(latticeVolumeTimerRef.current);
        latticeVolumeTimerRef.current = null;
      }
      latticeVolumePendingSinceRef.current = null;
      latticeVolumeWantedKeyRef.current = null;
      return;
    }

    const frameKey = `${frame.dims.join("x")}@${frame.voxelSize_m.toFixed(6)}|${frame.profileTag}`;
    const weightKey = latticeUseDynamicWeights ? "weights:dynamic" : desiredWeightHash ?? "weights:none";
    const wantedKey = `${frameKey}|${surfaceHash}|${weightKey}|${desiredDriveSig}`;

    latticeVolumeWantedKeyRef.current = wantedKey;
    if (latticeVolumeBuildingRef.current) {
      return;
    }

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const major =
      !sharedLatticeState?.volume ||
      currentSurfaceHash !== surfaceHash ||
      currentDriveSig !== desiredDriveSig ||
      (!latticeUseDynamicWeights && currentWeightHash !== desiredWeightHash) ||
      latticeProfileTag === "card";

    if (major) {
      latticeVolumePendingSinceRef.current = now;
    } else if (latticeVolumePendingSinceRef.current == null) {
      latticeVolumePendingSinceRef.current = now;
    }

    const pendingSince = latticeVolumePendingSinceRef.current ?? now;
    const elapsed = now - pendingSince;
    const debounceMs = latticeProfileTag === "card" ? 0 : 160;
    const maxWaitMs = latticeProfileTag === "card" ? 0 : 650;
    const delay = major || elapsed >= maxWaitMs ? 0 : debounceMs;

    if (latticeVolumeTimerRef.current != null) {
      window.clearTimeout(latticeVolumeTimerRef.current);
      latticeVolumeTimerRef.current = null;
    }

    const watchdog = latticeRebuildWatchdogs.current[latticeProfileTag] ?? latticeRebuildWatchdogs.current.preview;
    latticeVolumeTimerRef.current = window.setTimeout(() => {
      const latestKey = latticeVolumeWantedKeyRef.current;
      if (!latestKey || latestKey !== wantedKey) return;
      if (!latticeModeEnabled) return;
      const guardNow = typeof performance !== "undefined" ? performance.now() : Date.now();
      const guard = watchdog.shouldThrottle(guardNow);
      if (guard.blocked) {
        setLatticeWatchdogStats((prev) => ({
          blocked: prev.blocked + 1,
          lastBlockedAt: guardNow,
        }));
        return;
      }
      latticeVolumeBuildingRef.current = true;
      try {
        const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
        const surface = strobe.surface;
        const histogram = strobe.histogram;
        if (!surface || !histogram) return;

        const strobeWeights = applySchedulerWeights(
          histogram,
          {
            totalSectors: surface.sectorCount ?? totalSectors,
            liveSectors,
            sectorCenter01,
            gaussianSigma,
            sectorFloor: ds.sectorFloor,
            splitEnabled: ds.splitEnabled,
            splitFrac: ds.splitFrac,
            syncMode,
          },
          { surfaceHash: strobe.hash, basis: surface.basis },
        );
        const tWeights = typeof performance !== "undefined" ? performance.now() : Date.now();
        const sectorWeights = latticeUseDynamicWeights ? null : strobeWeights?.weights ?? null;
        const weightsHash = latticeUseDynamicWeights ? "dynamic" : strobeWeights?.hash;

        const perVertexDfdr =
          surface.positions.length >= (surface.vertexCount ?? 0) * 3
            ? (() => {
                const count = surface.vertexCount ?? Math.floor(surface.positions.length / 3);
                const arr = new Float32Array(count);
                const ax = Math.max(1e-6, axes[0]);
                const ay = Math.max(1e-6, axes[1]);
                const az = Math.max(1e-6, axes[2]);
                for (let i = 0; i < count; i++) {
                  const base = i * 3;
                  const x = surface.positions[base] ?? 0;
                  const y = surface.positions[base + 1] ?? 0;
                  const z = surface.positions[base + 2] ?? 0;
                  const mx = x / ax;
                  const my = y / ay;
                  const mz = z / az;
                  const r = Math.sqrt(mx * mx + my * my + mz * mz);
                  const cosX = r > 1e-6 ? mx / r : 0;
                  const df = dTopHatDr(r, sigma, R) * cosX * beta;
                  arr[i] = Number.isFinite(df) ? df : 0;
                }
                return arr;
              })()
            : null;
        const tDfdr = typeof performance !== "undefined" ? performance.now() : Date.now();

        const volume = voxelizeHullSurfaceStrobe({
          frame,
          surface,
          sectorWeights,
          perVertexDfdr,
          gateScale: gate,
          driveScale: ampChain,
          driveLadder: { R, sigma, beta, gate, ampChain },
          shellThickness: frame.voxelSize_m * 1.25,
          sampleBudget: Math.floor(frame.voxelCount * 6),
          surfaceHash: strobe.hash,
          weightsHash,
          dfdrSignature: latticeDesiredDfdrSignature,
        });
        const tVoxel = typeof performance !== "undefined" ? performance.now() : Date.now();

        setSharedLattice({
          frame,
          preset: frame.preset,
          profileTag: frame.profileTag,
          strobe: {
            hash: strobe.hash,
            source: strobe.source,
            lod: strobe.lod,
            meshHash: surface.meshHash,
            basisSignature: latticeStrobeBuild?.basisSig,
            handedness: surface.handedness,
            sectorCount: surface.sectorCount,
            triangleCount: surface.triangleCount,
            vertexCount: surface.vertexCount,
            clampReasons: strobe.clampReasons,
            weightHash: strobeWeights?.hash,
            weightCacheHit: strobeWeights?.cacheHit ?? false,
            hist: histogram,
            weights: strobeWeights?.weights ?? null,
            coverage: strobeWeights
              ? {
                  area: strobeWeights.areaWeighted,
                  area01: strobeWeights.areaWeighted01,
                  vertices: strobeWeights.vertexWeighted,
                  vertices01: strobeWeights.vertexWeighted01,
                  triangles: strobeWeights.triangleWeighted,
                  triangles01: strobeWeights.triangleWeighted01,
                }
              : null,
          },
          volume: volume.volume ?? null,
        });

        if (volume.volume) {
          const msTotal = tVoxel - t0;
          const msWeights = tWeights - t0;
          const msDfdr = tDfdr - tWeights;
          const msVoxel = tVoxel - tDfdr;
          console.info("[Hull3D][lattice] volume build", {
            volumeHash: volume.volume.hash.slice(0, 16),
            cacheHit: volume.volume.cacheHit,
            dims: volume.volume.dims,
            voxelSize_m: volume.volume.voxelSize,
            voxelCount: volume.volume.dims[0] * volume.volume.dims[1] * volume.volume.dims[2],
            coveragePct: Math.round((volume.volume.stats.coverage ?? 0) * 1000) / 10,
            maxGate: volume.volume.stats.maxGate,
            weightsHash: strobeWeights?.hash ?? null,
            driveSig: volume.volume.metadata.driveLadder.signature,
            ms: {
              total: Math.round(msTotal * 10) / 10,
              weights: Math.round(msWeights * 10) / 10,
              dfdr: Math.round(msDfdr * 10) / 10,
              voxelize: Math.round(msVoxel * 10) / 10,
            },
          });
        }

        if (frame.clampReasons.length) {
          console.debug("[Hull3D][lattice] frame clamped", {
            preset: frame.preset,
            profileTag: frame.profileTag,
            clampReasons: frame.clampReasons,
            dims: frame.dims,
            voxelSize_m: frame.voxelSize_m,
            voxelCount: frame.voxelCount,
          });
        }
        if (strobe.clampReasons.length) {
          console.debug("[Hull3D][lattice] surface strobe clamp", {
            clampReasons: strobe.clampReasons,
            meshHash: strobe.surface?.meshHash,
            lod: strobe.lod,
          });
        }
        if (volume.clampReasons.length) {
          console.debug("[Hull3D][lattice] lattice volume clamp", {
            clampReasons: volume.clampReasons,
            volumeHash: volume.volume?.hash,
          });
        }
      } finally {
        latticeVolumeBuildingRef.current = false;
        latticeVolumePendingSinceRef.current = null;
        latticeVolumeTimerRef.current = null;
      }
    }, delay);

    return () => {
      if (latticeVolumeTimerRef.current != null) {
        window.clearTimeout(latticeVolumeTimerRef.current);
        latticeVolumeTimerRef.current = null;
      }
    };
  }, [
    latticeEnabled,
    latticeFrame,
    latticeStrobeBuild,
    latticeDesiredWeightHash,
    latticeDesiredDriveLadderSignature,
    latticeDesiredDfdrSignature,
    latticeUseDynamicWeights,
    latticeProfileTag,
    latticeModeEnabled,
    gate,
    ampChain,
    sigma,
    beta,
    R,
    axes,
    totalSectors,
    liveSectors,
    sectorCenter01,
    gaussianSigma,
    ds.sectorFloor,
    ds.splitEnabled,
    ds.splitFrac,
    syncMode,
    sharedLatticeState?.strobe?.hash,
    sharedLatticeState?.strobe?.weightHash,
    sharedLatticeState?.volume,
    setSharedLattice,
  ]);

  const latticeSdfTimerRef = useRef<number | null>(null);
  const latticeSdfSeqRef = useRef(0);
  useEffect(() => {
    const frame = latticeSdfFrame;
    if (!frame || !hullPreview || !hullDimsResolved) {
      if (latticeSdfTimerRef.current != null) {
        window.clearTimeout(latticeSdfTimerRef.current);
        latticeSdfTimerRef.current = null;
      }
      latticeSdfSeqRef.current += 1;
      setSharedLattice({ sdf: null });
      return;
    }

    const delay = latticeRequireSdf || latticeProfileTag === "card" ? 0 : 350;
    if (latticeSdfTimerRef.current != null) {
      window.clearTimeout(latticeSdfTimerRef.current);
      latticeSdfTimerRef.current = null;
    }

    const seq = ++latticeSdfSeqRef.current;
    latticeSdfTimerRef.current = window.setTimeout(() => {
      const run = async () => {
        const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
        const result = await buildHullDistanceGrid({
          payload: hullPreview,
          frame,
          band: frame.voxelSize_m * 2.5,
          surface: {
            lod: wireframeLod,
            targetDims: {
              Lx_m: hullDimsResolved.Lx_m,
              Ly_m: hullDimsResolved.Ly_m,
              Lz_m: hullDimsResolved.Lz_m,
            },
            totalSectors,
            ...wireframeBudgets,
          },
          maxSamples: Math.floor(frame.voxelCount * 0.5),
        });
        const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
        if (seq !== latticeSdfSeqRef.current) return;
        setSharedLattice({ sdf: result.grid ?? null });
        if (result.grid) {
          console.info("[Hull3D][lattice] hull SDF build", {
            sdfKey: result.grid.key.slice(0, 16),
            cacheHit: result.grid.cacheHit,
            dims: result.grid.dims,
            voxelSize_m: result.grid.voxelSize,
            band_m: result.grid.band,
            voxelCoveragePct: Math.round((result.grid.stats?.voxelCoverage ?? 0) * 1000) / 10,
            triangleCoveragePct: Math.round((result.grid.stats?.triangleCoverage ?? 0) * 1000) / 10,
            maxAbsDistance_m: result.grid.stats?.maxAbsDistance,
            ms: Math.round((t1 - t0) * 10) / 10,
          });
        }
        if (result.clampReasons.length) {
          console.debug("[Hull3D][lattice] hull SDF clamp", {
            reasons: result.clampReasons,
            meshHash: result.grid?.meshHash ?? hullPreview.meshHash ?? hullPreview.mesh?.meshHash,
            cacheKey: result.key,
          });
        }
      };

      run().catch((error) => {
        console.error("[Hull3D][lattice] hull SDF build failed", error);
        if (seq === latticeSdfSeqRef.current) {
          setSharedLattice({ sdf: null });
        }
      });
    }, delay);

    return () => {
      if (latticeSdfTimerRef.current != null) {
        window.clearTimeout(latticeSdfTimerRef.current);
        latticeSdfTimerRef.current = null;
      }
    };
  }, [
    latticeSdfFrame,
    hullPreview,
    hullDimsResolved,
    wireframeLod,
    totalSectors,
    wireframeBudgets,
    latticeRequireSdf,
    latticeProfileTag,
    setSharedLattice,
  ]);

  const driveWeightAt = useCallback((angle01: number) => {
    // Apply global phase offset before any scheduler math (wrap to [0,1))
    const angle = angle01 - Math.floor(angle01);
    const phasedAngle = angle + (ds.phase01 - Math.floor(ds.phase01));
    const safeAngle = phasedAngle - Math.floor(phasedAngle);
    const total = Math.max(1, totalSectors);
    const live = Math.max(1, Math.min(liveSectors, total));
    const floorFrac = Math.min(0.99, Math.max(0, ds.sectorFloor));
    const peakFrac = Math.max(0, 1 - floorFrac);
    const activeFrac = fActive;
    if (peakFrac <= 1e-6) {
      return activeFrac * floorFrac;
    }
    if (syncMode > 0) {
      const center = sectorCenter01;
      const sigma = Math.max(1e-4, gaussianSigma);
      const avgGaussian = Math.min(1.0, sigma * 2.5066282746310002);
      const dist1 = Math.min(Math.abs(safeAngle - center), 1.0 - Math.abs(safeAngle - center));
      const g1 = Math.exp(-0.5 * (dist1 * dist1) / (sigma * sigma));
      let g = g1;
      if (ds.splitEnabled) {
        const center2 = (center + 0.5) - Math.floor(center + 0.5);
        const d2raw = Math.abs(safeAngle - center2);
        const dist2 = Math.min(d2raw, 1.0 - d2raw);
        const g2 = Math.exp(-0.5 * (dist2 * dist2) / (sigma * sigma));
        const wA = Math.max(0, Math.min(1, ds.splitFrac));
        g = g1 * wA + g2 * (1 - wA);
      }
      const normalized = Math.min(g / Math.max(avgGaussian, 1e-4), 12.0);
      const weight = activeFrac * (floorFrac + peakFrac * normalized);
      return Math.min(weight, activeFrac * (floorFrac + peakFrac * 12.0));
    }
  const frac = live / total;
  const idx = Math.floor(safeAngle * total);
    const on = idx < live ? 1.0 : 0.0;
    const normalized = frac > 1e-9 ? Math.min(on / frac, 12.0) : on;
    const weight = activeFrac * (floorFrac + peakFrac * normalized);
    return Math.min(weight, activeFrac * (floorFrac + peakFrac * 12.0));
  }, [totalSectors, liveSectors, ds.splitEnabled, ds.splitFrac, ds.sectorFloor, ds.phase01, fActive, syncMode, sectorCenter01, gaussianSigma]);

  useEffect(() => {
    const total = Math.max(1, totalSectors);
    const instant = new Float32Array(total);
    const baseWeights = new Array(total).fill(0);
    for (let i = 0; i < total; i++) {
      const a01 = (i + 0.5) / total;
      const w = driveWeightAt(a01);
      const value = Number.isFinite(w) ? w : 0;
      instant[i] = value;
      baseWeights[i] = value;
    }
    const averageArray = showSectorGridOverlay
      ? baseWeights.slice()
      : smoothSectorWeights(baseWeights, Math.max(0.1, ds.sigmaSectors * 0.4));
    const average = new Float32Array(averageArray);
    const sqrtBoost = new Float32Array(total);
    for (let i = 0; i < total; i++) {
      const norm = Math.max(1e-9, fActive);
      sqrtBoost[i] = Math.sqrt(Math.max(0, instant[i]) / norm);
    }
    const dwellMsRaw = Number(lightLoop.dwell_ms);
    const burstMsRaw = Number(lightLoop.burst_ms);
    const dwell = Number.isFinite(dwellMsRaw) && dwellMsRaw > 0 ? dwellMsRaw : 1;
    const burst = Number.isFinite(burstMsRaw) ? Math.max(0, burstMsRaw) : 0;
    const burstFrac = Math.min(1, Math.max(0, burst / dwell));
    const half = burstFrac * 0.5;
    const windowStart = Math.max(0, 0.5 - half);
    const windowEnd = Math.min(1, 0.5 + half);
    setSharedSector({
      weightsInstant: instant,
      weightsAverage: average,
      sqrtBoost,
      betaSign: beta >= 0 ? 1 : -1,
      activeIndex: ((loopSectorIdx % total) + total) % total,
      nextIndex: ((loopSectorIdx + 1) % total + total) % total,
      dutyWindow: [windowStart, windowEnd],
    });
  }, [
    setSharedSector,
    totalSectors,
    ds.sigmaSectors,
    driveWeightAt,
    fActive,
    beta,
    loopSectorIdx,
    lightLoop.dwell_ms,
    lightLoop.burst_ms,
    showSectorGridOverlay,
  ]);

  // --- Parity check: sample CPU gating peak vs shader sector center (sync mode only)
  useEffect(() => {
    if (planarVizMode !== 2) return; // drive-only
    if (syncMode !== 1) { // only meaningful in Gaussian sync mode (fallback has flat tops)
      setCenterDeltaDeg(null);
      return;
    }
    const now = performance.now();
    if (now - lastCenterCheckRef.current < 800) return; // throttle ~1.25 Hz
    lastCenterCheckRef.current = now;
    // Sample driveWeightAt on a uniform azimuth grid to find argmax
    const N = 512;
    let maxW = -Infinity;
    let maxIdx = 0;
    for (let i = 0; i < N; i++) {
      const a01 = i / N;
      const w = driveWeightAt(a01);
      if (w > maxW) { maxW = w; maxIdx = i; }
    }
    // Proper circular distance with explicit wrapping to [0,1)
    const wrap01 = (t: number) => t - Math.floor(t);
    const angDist01 = (x: number, y: number) => {
      const xw = wrap01(x);
      const yw = wrap01(y);
      const d = Math.abs(xw - yw);
      return Math.min(d, 1 - d); // in [0, 0.5]
    };

    const aStar = wrap01(maxIdx / N);
    // Compare to nearest of center and (center + 0.5) when split is enabled
    const c0 = wrap01(sectorCenter01);
    const c1 = wrap01(c0 + 0.5);

    const d1 = angDist01(aStar, c0);
    const d2 = ds.splitEnabled ? angDist01(aStar, c1) : Number.POSITIVE_INFINITY;
    const d01 = Math.min(d1, d2);
    const deg = Math.max(0, Math.min(180, d01 * 360));
    setCenterDeltaDeg(deg);
  }, [planarVizMode, syncMode, sectorCenter01, ds.splitEnabled, ds.splitFrac, totalSectors, liveSectors, gaussianSigma, fActive, ds.phase01, driveWeightAt]);

  // === NEW: Split peak calculation per planarVizMode mode ==================================
  const thetaField_GR = useMemo(() => {
    if (planarVizMode !== 0) return null;
    const nx = res, ny = res;
    const field = new Float32Array(nx * ny);
    const domainScale = hullDomainScale;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const gx = -1 + 2 * (i / (nx - 1));
        const gz = -1 + 2 * (j / (ny - 1));
        const ax = Math.max(1e-6, axes[0]);
        const az = Math.max(1e-6, axes[2]);
        const xView = gx * domainScale * axes[0];
        const zView = gz * domainScale * axes[2];
        const mx = xView / ax;
        const mz = zView / az;
        const r = Math.sqrt(mx * mx + mz * mz);
        const cos = mx / Math.max(r, 1e-6);
        const dfdr = dTopHatDr(r, sigma, R);
        field[j * nx + i] = beta * cos * dfdr;
      }
    }
    return field;
  }, [planarVizMode, beta, sigma, R, axes, res, hullDomainScale]);

  const rhoField_GR = useMemo(() => {
    if (planarVizMode !== 1) return null;
    const nx = res, ny = res;
    const field = new Float32Array(nx * ny);
    const domainScale = hullDomainScale;
    const INV16PI = 0.019894367886486918;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const gx = -1 + 2 * (i / (nx - 1));
        const gz = -1 + 2 * (j / (ny - 1));
        const ax = Math.max(1e-6, axes[0]);
        const az = Math.max(1e-6, axes[2]);
        const xView = gx * domainScale * axes[0];
        const zView = gz * domainScale * axes[2];
        const mx = xView / ax;
        const mz = zView / az;
        const r = Math.max(1e-6, Math.sqrt(mx * mx + mz * mz));
        const cosX = mx / r;
        const cosZ = mz / r;
        const dfdr = dTopHatDr(r, sigma, R);
        const dfx = dfdr * cosX / ax;
        const dfz = dfdr * cosZ / az;
        const Kxx = -beta * dfx;
        const Kxy = 0;                   // y=0 slice
        const Kxz = -0.5 * beta * dfz;
        const K2 = Kxx * Kxx;
        const KijKij = Kxx * Kxx + 2 * Kxy * Kxy + 2 * Kxz * Kxz;
        field[j * nx + i] = (K2 - KijKij) * INV16PI; // â‰¤ 0 in shell
      }
    }
    return field;
  }, [planarVizMode, beta, sigma, R, axes, res, hullDomainScale]);

  // Optional contrast boost for sector visibility; >1 exaggerates lumps a bit
  const lumpBoostExp = useMemo(() => {
    const v = Number((live as any)?.view?.lumpBoostExp);
    return Number.isFinite(v) && v > 0 ? v : 1.25;
  }, [live]);

  useEffect(() => {
    if (!wireframeOverlay.overlay || !showWireframeOverlay) {
      setWireframePatches([]);
      return;
    }
    if (useFieldProbeOverlay && fieldProbe?.patches) {
      setWireframePatches(fieldProbe.patches.slice(0, 6));
      return;
    }
    const now = performance.now();
    if (now - wireframePatchTick.current < 90) return;
    wireframePatchTick.current = now;
    const { patches } = colorizeWireframeOverlay(wireframeOverlay.overlay, {
      phase01: ds.phase01 ?? 0,
      sectorCenter01,
      gaussianSigma,
      totalSectors,
      liveSectors,
      sectorFloor: ds.sectorFloor,
      lumpExp: lumpBoostExp,
      duty: dutyFR,
      gateView,
      splitEnabled: ds.splitEnabled,
      splitFrac: ds.splitFrac,
      syncMode,
      tilesPerSectorVector,
      fieldThreshold: 0.4,
      gradientThreshold: 0.2,
    });
    setWireframePatches((patches ?? []).slice(0, 6));
  }, [
    fieldProbe?.patches,
    useFieldProbeOverlay,
    wireframeOverlay.overlay,
    showWireframeOverlay,
    ds.phase01,
    sectorCenter01,
    gaussianSigma,
    totalSectors,
    liveSectors,
    ds.sectorFloor,
    lumpBoostExp,
    dutyFR,
    gateView,
    ds.splitEnabled,
    ds.splitFrac,
    syncMode,
    tilesPerSectorVector,
  ]);

  const thetaField_Drive = useMemo(() => {
    if (planarVizMode !== 2) return null;
    const nx = res, ny = res;
    const field = new Float32Array(nx * ny);
    const twoPi = 2 * Math.PI;
    const domainScale = hullDomainScale;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const gx = -1 + 2 * (i / (nx - 1));
        const gz = -1 + 2 * (j / (ny - 1));
        const ax = Math.max(1e-6, axes[0]);
        const az = Math.max(1e-6, axes[2]);
        const xView = gx * domainScale * axes[0];
        const zView = gz * domainScale * axes[2];
        const mx = xView / ax;
        const mz = zView / az;
        const r = Math.sqrt(mx * mx + mz * mz);
        const cos = mx / Math.max(r, 1e-6);
        const dfdr = dTopHatDr(r, sigma, R);

  const ang = Math.atan2(zView, xView);
  let a01 = (ang < 0 ? ang + twoPi : ang) / twoPi;
  a01 = a01 + (ds.phase01 - Math.floor(ds.phase01));
  a01 = a01 - Math.floor(a01);
        const w = driveWeightAt(a01);
        const gateWF = Math.pow(
          Math.sqrt(Math.max(0, w) / Math.max(fActive, 1e-9)),
          lumpBoostExp
        );

        field[j * nx + i] = ampChain * beta * cos * dfdr * gate * gateWF;
      }
    }
    return field;
  }, [planarVizMode, beta, sigma, R, ampChain, gate, fActive, axes, res, lumpBoostExp, driveWeightAt, ds.phase01, hullDomainScale]);

  const [thetaPkAbs, thetaPkPos, thetaMin, thetaMax] = useMemo(() => {
    const field = planarVizMode === 0 ? thetaField_GR : planarVizMode === 1 ? rhoField_GR : thetaField_Drive;
    if (!field) return [1e-9, 1e-9, 0, 0] as const;
    let minVal = Number.POSITIVE_INFINITY;
    let maxVal = Number.NEGATIVE_INFINITY;
    const posSamples: number[] = [];
    for (let i = 0; i < field.length; i++) {
      const sample = field[i];
      if (sample < minVal) minVal = sample;
      if (sample > maxVal) maxVal = sample;
      if (sample > 0) posSamples.push(sample);
    }
  const tailFrac = planarVizMode === 2 ? 0.1 : 0.4;
  const tailPkAbs = Math.max(1e-9, tailPeakAbs(field, tailFrac));
  const tailPkPos = posSamples.length ? Math.max(1e-9, tailPeakAbs(posSamples, tailFrac)) : tailPkAbs;
    // For Drive mode, stabilize span by trimming to 5â€“95% quantiles (robust Î”Î¸)
    if (planarVizMode === 2) {
      // Only compute quantiles when needed; use downsampled estimator for perf
      const q05 = quantileSample(field, 0.05);
      const q95 = quantileSample(field, 0.95);
      // Ensure ordering in degenerate cases
      if (Number.isFinite(q05) && Number.isFinite(q95) && q95 >= q05) {
        minVal = q05;
        maxVal = q95;
      }
    }
    if (!Number.isFinite(minVal)) minVal = 0;
    if (!Number.isFinite(maxVal)) maxVal = 0;
    return [tailPkAbs, tailPkPos, minVal, maxVal] as const;
  }, [planarVizMode, thetaField_GR, rhoField_GR, thetaField_Drive]);
  const thetaPk = thetaPkAbs;
  // Raw baseline from the sampled minimum
  const rawYBias = useMemo(() => (Number.isFinite(thetaMin) ? thetaMin : 0), [thetaMin]);
  // Mid-bias to center the surface vertically (average of min/max)
  const rawYMid = useMemo(() => {
    if (Number.isFinite(thetaMin) && Number.isFinite(thetaMax)) return (thetaMin + thetaMax) * 0.5;
    return rawYBias;
  }, [thetaMin, thetaMax, rawYBias]);
  const mapT = (theta: number) => Math.tanh((1.4 * theta) / thetaPk);

  // World-space target half-height (meters) shared by yGain and camera
  const targetHalf = useMemo(() => {
    const targetFrac = Number((live as any)?.view?.yTargetFrac);
    const minFrac    = Number((live as any)?.view?.yMinFrac);
    const maxFrac    = Number((live as any)?.view?.yMaxFrac);
    const tf = Number.isFinite(targetFrac) ? targetFrac : 3.00;  // 300% of R
    const mf = Number.isFinite(minFrac)    ? minFrac    : 0.0;        // allow micro heights
    const xf = Number.isFinite(maxFrac)    ? maxFrac    : 3.00;  // cap at 300%
    // IMPORTANT: match pre-change visuals â€” do NOT scale by hull axes here.
    // Previously we multiplied by axScale = max(axes.x, axes.z), which suppressed
    // apparent height for very wide hulls. Revert to pure R scaling for yGain.
    return clamp(tf, mf, xf) * R;
  }, [live, R, axes]);

  // Camera fit bias (already added earlier)
  const heightFitBias = useMemo(() => {
    const v = Number((live as any)?.view?.heightFitBias);
    return Number.isFinite(v) ? clamp(v, 0.1, 1.0) : 0.55;
  }, [live]);

  // NEW: simple knobs to center the plane vertically by lowering the camera.
  // You can override live.view.eyeYScale / eyeYBase at runtime.
  const eyeYScale = useMemo(() => {
    const v = Number((live as any)?.view?.eyeYScale);
    return Number.isFinite(v) ? v : 0.65; // was 1.10
  }, [live]);
  const eyeYBase = useMemo(() => {
    const v = Number((live as any)?.view?.eyeYBase);
    return Number.isFinite(v) ? v : 0.06; // was 0.12
  }, [live]);

  // ---- Analytic peak estimate: df/dr peak at the wall ----
  const dfdr_peak_est = useMemo(() => {
    const t = Math.tanh(Math.max(1e-6, sigma * R));
    return sigma / (2 * Math.max(1e-6, t)); // analytic peak estimate
  }, [sigma, R]);

  // Analytic reference amplitude per planarVizMode (peak at the wall)
  const ampRef = useMemo(() => {
    const INV16PI = 0.019894367886486918;
    if (planarVizMode === 0) return Math.abs(beta * dfdr_peak_est);                       // Î¸_GR
    if (planarVizMode === 1) return Math.abs(beta * beta * dfdr_peak_est * dfdr_peak_est * INV16PI); // Ï_GR
    return Math.abs(ampChain * beta * dfdr_peak_est * gate);                    // Î¸_Drive
  }, [planarVizMode, beta, dfdr_peak_est, ampChain, gate]);

  const yGain = useMemo(() => {
    const usr = Number((live as any)?.view?.yGain);
    if (Number.isFinite(usr) && usr > 0) return usr;
    // Use the sampled peak to keep curvature legible, with analytic fallback when needed.
    const sampleAmp = Number.isFinite(thetaPkPos) ? thetaPkPos : 0;
    const fallbackAmp = Number.isFinite(ampRef) ? Math.abs(ampRef) : 0;
    const span = (Number.isFinite(thetaMax) && Number.isFinite(thetaMin))
      ? Math.max(1e-9, thetaMax - thetaMin)
      : 1e-9;
    const baseDenom = Math.max(span, sampleAmp, fallbackAmp, 1e-9);
    let gain = targetHalf / baseDenom;
    // Ensure the rendered curvature occupies a healthy fraction of the viewport.
    const projected = gain * span;
    const minFillFrac = planarVizMode === 1 ? 0.12 : 0.35;
    const minFill = targetHalf * minFillFrac;
    if (projected < minFill) {
      gain *= minFill / Math.max(projected, 1e-12);
    }
    // Apply per-mode boosts so higher-energy regimes remain legible.
    const mode = String(live?.currentMode || "").toLowerCase();
    const modeProfile = (() => {
      switch (mode) {
        case "standby":   return { boost: 31.2,   betaRef: 0.02 };
        case "taxi":      return { boost: 42.4,   betaRef: 0.05 };
        case "nearzero":  return { boost: 56.0,   betaRef: 0.08 };
        case "hover":     return { boost: 76.8,   betaRef: 0.18 };
        case "cruise":    return { boost: 102.4,  betaRef: 0.60 };
        case "emergency": return { boost: 121.6,  betaRef: 0.90 };
        default:          return { boost: 59.2,   betaRef: 0.30 };
      }
    })();
    const betaRef = Number.isFinite(modeProfile.betaRef) ? modeProfile.betaRef : 0.3;
    const betaClamped = clamp(beta, 1e-4, 0.99);
    const betaAdjust = betaRef > 0 ? clamp(betaRef / betaClamped, 0.45, 2.8) : 1;
    const betaScale = planarVizMode === 1 ? 1 : betaAdjust;
    const modeBoost = planarVizMode === 1 ? 6.0 : modeProfile.boost;
  const planarVizModeGain = planarVizMode === 0 ? 0.34 : planarVizMode === 1 ? 0.009 : 1; // tailor per-planarVizMode scaling so GR modes stay within view
    return gain * modeBoost * betaScale * planarVizModeGain;
  }, [targetHalf, thetaPkPos, ampRef, thetaMax, thetaMin, live, planarVizMode]);

  // Build a key that changes when "non-phase" parameters change (so we refresh locks),
  // but stays constant when only phase/scheduler rotates the lobe.
  const baselineResetKey = useMemo(
    () => JSON.stringify([
      planarVizMode,
      // geometry/physics shaping
      beta, sigma, R, axes,
      ampChain, gate, dutyFR,
      totalSectors, liveSectors,
      gaussianSigma, fActive,
      ds.splitEnabled, ds.splitFrac, ds.sectorFloor,
      lumpBoostExp,
    ]),
    [planarVizMode, beta, sigma, R, axes, ampChain, gate, dutyFR, totalSectors, liveSectors, gaussianSigma, fActive, ds.splitEnabled, ds.splitFrac, ds.sectorFloor, lumpBoostExp]
  );

  // Lock vertical scale against phase-only jitter in Î¸ (Drive)
  const [lockScale, setLockScale] = useState<boolean>(false);
  const [lockedYGain, setLockedYGain] = useState<number>(() => yGain);
  // Refresh locked gain on non-phase changes
  useEffect(() => {
    if (planarVizMode !== 2) return;
    if (!lockScale) return;
    setLockedYGain(yGain);
  // reuse baselineResetKey so phase-only movement doesnâ€™t refresh
  }, [planarVizMode, lockScale, yGain, baselineResetKey]);
  // Follow live gain when unlocked
  useEffect(() => {
    if (planarVizMode !== 2) return;
    if (lockScale) return;
    setLockedYGain(yGain);
  }, [planarVizMode, lockScale, yGain]);
  // GR modes: always mirror live gain
  useEffect(() => {
    if (planarVizMode === 2) return;
    setLockedYGain(yGain);
  }, [planarVizMode, yGain]);
  const yGainFinal = useMemo(() => (planarVizMode === 2 && lockScale ? lockedYGain : yGain), [planarVizMode, lockScale, lockedYGain, yGain]);

  const kColor = useMemo(() => {
    const usr = Number((live as any)?.view?.kColor);
    if (Number.isFinite(usr) && usr > 0) return usr;
    return 0.85 / Math.max(1e-18, thetaPk);
  }, [live, thetaPk]);

  // Floor baseline lock: keep yBias stable when only phase moves (Î¸ Drive)
  const [lockBaseline, setLockBaseline] = useState<boolean>(true);
  // Center plane option: use mid (min/max average) for y-bias and lock camera framing
  const [centerPlane, setCenterPlane] = useState<boolean>(true);
  const driveBiasRef = useRef<number>(0);
  const [lockedBias, setLockedBias] = useState<number>(0);
  // Initialize or refresh locked baseline when significant (non-phase) inputs change
  // 1) Locked baseline (Drive mode): update only when non-phase inputs change
  useEffect(() => {
    if (planarVizMode !== 2) return;
    if (!lockBaseline) return;
    const base = centerPlane ? rawYMid : rawYBias;
    driveBiasRef.current = base;
    setLockedBias(base);
  }, [baselineResetKey, planarVizMode, lockBaseline, centerPlane]);

  // 2) Follow baseline when unlocked (Drive mode): update continuously with raw values
  useEffect(() => {
    if (planarVizMode !== 2) return;
    if (lockBaseline) return;
    const base = centerPlane ? rawYMid : rawYBias;
    driveBiasRef.current = base;
    setLockedBias(base);
  }, [planarVizMode, lockBaseline, centerPlane, rawYBias, rawYMid]);

  // 3) GR modes: always mirror centered baseline
  useEffect(() => {
    if (planarVizMode === 2) return;
    driveBiasRef.current = rawYMid;
    setLockedBias(rawYMid);
  }, [planarVizMode, rawYMid]);
  // Final yBias used by renderer
  const yBias = useMemo(() => {
    if (planarVizMode === 2) {
      // In Drive mode, prefer lockedBias if lock is on; otherwise follow center/floor choice live
      return lockBaseline ? lockedBias : (centerPlane ? rawYMid : rawYBias);
    }
    // In GR modes, center by default
    return rawYMid;
  }, [planarVizMode, lockBaseline, lockedBias, centerPlane, rawYMid, rawYBias]);

  // Compute MVP to fit both horizontal (domain) and vertical (curvature) extents
  const mvp = useMemo(() => {
    const fovy = 40 * Math.PI/180;
    const tanY = Math.tan(fovy * 0.5);
    const tanX = tanY * Math.max(0.2, aspect);

  // Horizontal half-extent with axes scaling (geometry scaled by domain*axes)
  const halfX = hullDomainScale * (axes[0] || 1);
  const halfZ = hullDomainScale * (axes[2] || 1);
  const halfW = Math.max(halfX, halfZ);

    // Vertical half-extent (world space). Let the camera auto-expand to cover the
    // rendered curvature (sampled max) with a small headroom margin.
    const span = (Number.isFinite(thetaMax) && Number.isFinite(thetaMin)) ? Math.max(thetaMax - thetaMin, 1e-9) : 1e-9;
    const renderHalf = Math.abs(yGain) * span;
    // When centering the plane, hold framing to targetHalf so phase changes don't shift distance
    const desiredHalf = centerPlane ? targetHalf : Math.max(targetHalf, renderHalf);
    const clampedHalf = centerPlane ? targetHalf : Math.min(desiredHalf, targetHalf * 2.6);
    const halfH = Math.max(1e-6, (centerPlane ? targetHalf : clampedHalf) * 1.05);
    const fitH  = halfH * heightFitBias;

    // Distance to fit width/height
    const dByW = halfW / Math.max(1e-6, tanX);
    const dByH = fitH  / Math.max(1e-6, tanY);
    const dist = Math.max(dByW, dByH) * 1.35 + Math.max(5, 0.15 * R); // keep bubble filling the frame

    const near = Math.max(0.05, dist - (halfW + fitH) - 5);
    const far  = dist + (halfW + fitH) + 50;

    // Build perspective * lookAt; slight tilt for readability
    const f = 1/Math.tan(fovy/2);
    const P = [
      f/aspect,0,0,0,
      0,f,0,0,
      0,0,(far+near)/(near-far),-1,
      0,0,(2*far*near)/(near-far),0,
    ];
    // eye above +z looking at origin
    const eyeY = fitH * eyeYScale + R * eyeYBase;
    const V = [
      1,0,0,0,
      0,0.96,-0.28,0,
      0,0.28, 0.96,0,
      0,-eyeY,-dist,1,
    ];
    const M = new Float32Array(16);
    for (let r=0;r<4;r++){
      for (let c=0;c<4;c++){
        let s=0; for (let k=0;k<4;k++) s += P[k*4+r]*V[c*4+k];
        M[c*4+r]=s;
      }
    }
    return M;
  }, [aspect, R, targetHalf, heightFitBias, eyeYScale, eyeYBase, axes, yGain, thetaMax, thetaMin, centerPlane, hullDomainScale]);

  // === Dynamic param refs (decouple GL init from frequent pipeline changes) ===
  const dynRef = useRef({
    axes: [1,1,1] as [number,number,number],
    sigma: 6,
    R: 1,
    domainScale: 1,
    beta: 0,
    planarVizMode: 0 as VizMode,
    volumeViz: "theta_drive" as Hull3DVolumeViz,
    ampChain: 1,
    gate: 0,
    gateView: 0,
    duty: 0,
    yGain: 1,
    yBias: 0,
    kColor: 1,
    mvp: new Float32Array(16),
    totalSectors: 1,
    liveSectors: 1,
    lumpBoostExp: 1.25,
    sectorCenter: 0,
    sectorSigma: 0.1,
    sectorFloor: 0.1,
    syncMode: 1,
    phase01: 0,
    showSurfaceOverlay: true,
    betaOverlayEnabled: false,
    betaTarget_ms2: ONE_G_MS2,
    comfort_ms2: 0.4 * ONE_G_MS2,
    vizFloorThetaGR: vizFloorDefaults.thetaGR,
    vizFloorRhoGR: vizFloorDefaults.rhoGR,
    vizFloorThetaDrive: vizFloorDefaults.thetaDrive,
    betaUniform_ms2: ONE_G_MS2,
    hullDims: [1, 1, 1] as [number, number, number],
    betaTexture: null,
    betaSampler: null,
    previewMesh: null as HullPreviewMeshPayload | null,
  });

  // Immediate priming (so first frame doesn't see zeroed MVP/uniforms)
  dynRef.current.axes = axes;
  dynRef.current.sigma = sigma;
  dynRef.current.R = R;
  dynRef.current.domainScale = hullDomainScale;
  dynRef.current.beta = beta;
  dynRef.current.planarVizMode = planarVizMode;
  dynRef.current.volumeViz = hullVolumeVizLive;
  (dynRef.current as any).volumeDomain = hullVolumeDomain;
  (dynRef.current as any).opacityWindow = bubbleOpacityWindow;
  dynRef.current.ampChain = ampChain;
  dynRef.current.gate = gateRaw;
  dynRef.current.gateView = gateView;
  dynRef.current.duty = dutyFR;
  dynRef.current.yGain = yGainFinal;
  dynRef.current.yBias = yBias;
  dynRef.current.kColor = kColor;
  dynRef.current.vizFloorThetaGR = vizFloors.thetaGR;
  dynRef.current.vizFloorRhoGR = vizFloors.rhoGR;
  dynRef.current.vizFloorThetaDrive = vizFloors.thetaDrive;
  dynRef.current.mvp = mvp;
  dynRef.current.totalSectors = totalSectors;
  dynRef.current.liveSectors = liveSectors;
  dynRef.current.lumpBoostExp = lumpBoostExp;
  dynRef.current.sectorCenter = sectorCenter01;
  dynRef.current.sectorSigma = gaussianSigma;
  dynRef.current.sectorFloor = ds.sectorFloor;
  dynRef.current.syncMode = syncMode;
  // Pass split to dynRef for uniform updates
  (dynRef.current as any).splitEnabled = ds.splitEnabled ? 1 : 0;
  (dynRef.current as any).splitFrac = ds.splitFrac;
  dynRef.current.phase01 = ds.phase01;
  dynRef.current.showSurfaceOverlay = showHullSurfaceOverlay;
  const hullDimsInit: [number, number, number] = [
    Math.max(Math.abs(axes[0]) * R * 2, 1e-3),
    Math.max(Math.abs(axes[1]) * R * 2, 1e-3),
    Math.max(Math.abs(axes[2]) * R * 2, 1e-3),
  ];
  dynRef.current.hullDims = hullDimsInit;
  dynRef.current.betaOverlayEnabled = betaOverlayEnabled;
  dynRef.current.betaTarget_ms2 = betaTargetMs2;
  dynRef.current.comfort_ms2 = betaComfortMs2;
  dynRef.current.betaUniform_ms2 = betaTargetMs2;
  dynRef.current.betaTexture = null;
  dynRef.current.betaSampler = null;
  dynRef.current.previewMesh = previewMeshForRenderer;

  useEffect(()=>{
    dynRef.current.axes = axes;
    dynRef.current.sigma = sigma;
    dynRef.current.R = R;
    dynRef.current.beta = beta;
    dynRef.current.planarVizMode = planarVizMode;
    dynRef.current.volumeViz = hullVolumeVizLive;
    dynRef.current.ampChain = ampChain;
    dynRef.current.gate = gateRaw;
    dynRef.current.gateView = gateView;
    dynRef.current.duty = dutyFR;
  dynRef.current.yGain = yGainFinal;
    dynRef.current.yBias = yBias;
    dynRef.current.kColor = kColor;
    dynRef.current.vizFloorThetaGR = vizFloors.thetaGR;
    dynRef.current.vizFloorRhoGR = vizFloors.rhoGR;
    dynRef.current.vizFloorThetaDrive = vizFloors.thetaDrive;
    dynRef.current.mvp = mvp;
    dynRef.current.totalSectors = totalSectors;
    dynRef.current.liveSectors = liveSectors;
    dynRef.current.lumpBoostExp = lumpBoostExp;
  dynRef.current.sectorCenter = sectorCenter01;
  dynRef.current.sectorSigma = gaussianSigma;
  dynRef.current.sectorFloor = ds.sectorFloor;
  dynRef.current.syncMode = syncMode;
  dynRef.current.phase01 = ds.phase01;
  dynRef.current.showSurfaceOverlay = showHullSurfaceOverlay;
  dynRef.current.hullDims = hullDimsEffective;
  dynRef.current.betaOverlayEnabled = betaOverlayEnabled;
  dynRef.current.betaTarget_ms2 = betaTargetMs2;
  dynRef.current.comfort_ms2 = betaComfortMs2;
  dynRef.current.betaUniform_ms2 = betaTargetMs2;
  dynRef.current.betaTexture = null;
  dynRef.current.betaSampler = null;
  dynRef.current.previewMesh = previewMeshForRenderer;
  (dynRef.current as any).splitEnabled = ds.splitEnabled ? 1 : 0;
  (dynRef.current as any).splitFrac = ds.splitFrac;
  }, [axes, sigma, R, beta, planarVizMode, hullVolumeVizLive, ampChain, gateRaw, gateView, dutyFR, yGainFinal, yBias, kColor, mvp, totalSectors, liveSectors, lumpBoostExp, sectorCenter01, gaussianSigma, ds.sectorFloor, syncMode, ds.phase01, showHullSurfaceOverlay, betaOverlayEnabled, betaTargetMs2, betaComfortMs2, ds.splitEnabled, ds.splitFrac, hullGeometry, hullRadiusLUT, hullSdf, hullDimsEffective, previewMeshForRenderer]);

  useEffect(() => {
    const fActiveRenderer = gateSource === "blanket" ? 1 : fActive;
    const base: Hull3DRendererState = {
      axes,
      domainScale: hullDomainScale,
      boundsProfile: bubbleBoundsMode,
      geometry: hullGeometry,
      hullRadiusLUT: hullRadiusLUT?.data,
      hullRadiusLUTSize: hullRadiusLUT?.size,
      hullRadiusMax: hullRadiusLUT?.maxR ?? hullRadiusMax,
      hullSDF: hullSdf?.data,
      hullSDFDims: hullSdf?.dims,
      hullSDFBounds: hullSdf?.bounds,
      hullSDFBand: hullSdf?.band,
      hullSDFFormat: hullSdf?.format,
      R,
      sigma,
      beta,
      ampChain,
      gate: gateRaw,
      gateView,
      gateSource,
      tilesPerSectorVector,
      vizFloorThetaGR: vizFloors.thetaGR,
      vizFloorRhoGR: vizFloors.rhoGR,
      vizFloorThetaDrive: vizFloors.thetaDrive,
      fActive: fActiveRenderer,
      duty: dutyFR,
      exposure: (() => {
        // Map [0,1] -> [1e-2, 1e+2] with center 0.5 = 1x using 10^(4*(x-0.5))
        const x = Math.max(0, Math.min(1, hullExposure01));
        const exp = Math.pow(10, 4 * (x - 0.5));
        return Number.isFinite(exp) ? exp : 1.0;
      })(),
      gaussianSigma,
      sectorCenter01,
      totalSectors,
      liveSectors,
      sectorFloor: ds.sectorFloor,
      lumpExp: lumpBoostExp,
      splitEnabled: Boolean(ds.splitEnabled),
      splitFrac: ds.splitFrac,
      syncMode,
      phase01: ds.phase01,
      showSectorRing: showHullSectorRing,
      showGhostSlice: voxelSliceActive,
      showSurfaceOverlay: showHullSurfaceOverlay && !surfaceOverlaySuppressed,
      betaOverlayEnabled,
      betaTarget_ms2: betaTargetMs2,
      comfort_ms2: betaComfortMs2,
      betaUniform_ms2: betaTargetMs2,
      hullDims: hullDimsEffective,
      betaTexture: null,
      betaSampler: null,
      followPhase: followHullPhase,
      volumeViz: hullVolumeVizLive,
      volumeDomain: hullVolumeDomain,
      opacityWindow: bubbleOpacityWindow,
      camera: cardCameraFrame,
      blendFactor: hullBlend,
      freeze: bubbleStatus === "CRITICAL",
      timeSec: 0,
      bubbleStatus,
      aspect,
      previewMesh: previewMeshForRenderer,
      wireframeOverlay: wireframeOverlayForRenderer,
      overlays: overlayConfig,
      latticeFrame: latticeModeEnabled ? sharedLatticeState?.frame ?? null : null,
      latticePreset: latticeModeEnabled ? sharedLatticeState?.preset ?? "auto" : "auto",
      latticeProfileTag: latticeModeEnabled ? sharedLatticeState?.profileTag ?? "preview" : "preview",
      latticeClampReasons: latticeModeEnabled ? sharedLatticeState?.frame?.clampReasons ?? [] : [],
      latticeStrobe: latticeModeEnabled ? sharedLatticeState?.strobe ?? null : null,
      latticeSdf: latticeModeEnabled ? latticeSdfForRenderer : null,
      latticeVolume: latticeModeEnabled ? latticeVolumeForRenderer : null,
      latticeWeightMode: latticeUseDynamicWeights ? "dynamic" : "baked",
      latticeWorldToLattice: latticeModeEnabled ? sharedLatticeState?.frame?.worldToLattice ?? null : null,
      latticeMin: latticeModeEnabled ? sharedLatticeState?.frame?.bounds.minLattice ?? null : null,
      latticeSize: latticeModeEnabled ? sharedLatticeState?.frame?.bounds.size ?? null : null,
    };
    hullStateRef.current = base;
  }, [axes, hullDomainScale, bubbleBoundsMode, hullGeometry, hullRadiusMax, hullRadiusLUT, hullSdf, R, sigma, beta, ampChain, gateView, gateRaw, gateSource, tilesPerSectorVector, fActive, dutyFR, gaussianSigma, sectorCenter01, totalSectors, liveSectors, ds.sectorFloor, lumpBoostExp, ds.splitEnabled, ds.splitFrac, syncMode, ds.phase01, showHullSectorRing, voxelSliceActive, showHullSurfaceOverlay, betaOverlayEnabled, betaTargetMs2, betaComfortMs2, followHullPhase, hullVolumeVizLive, hullVolumeDomain, bubbleOpacityWindow, cardCameraFrame, hullBlend, bubbleStatus, aspect, vizFloors.thetaGR, vizFloors.rhoGR, vizFloors.thetaDrive, overlayConfig, sharedPhase, sharedSampling, sharedPhysicsState, sharedComplianceState, sharedSectorState, sharedPaletteState, wireframeOverlayForRenderer, latticeModeEnabled, latticeSdfForRenderer, latticeVolumeForRenderer, sharedLatticeState?.frame, sharedLatticeState?.preset, sharedLatticeState?.profileTag, sharedLatticeState?.strobe, previewMeshForRenderer, latticeUseDynamicWeights]);

  // When an operational mode that implies drive activity is set, default to theta(Drive)
  // once, unless the user has already picked a planarVizMode explicitly. Only override planar GR modes.
  useEffect(() => {
    if (userVizLocked) return;
    const m = String((live as any)?.currentMode || '').toLowerCase();
    const drivey = m === 'hover' || m === 'cruise' || m === 'emergency' || m === 'nearzero';
    if (drivey && (planarVizMode === 0 || planarVizMode === 1)) {
      setPlanarVizMode(2);
    }
  }, [live, userVizLocked, planarVizMode]);

  // === WebGL init effect (runs once unless resolution changes) ===
  useEffect(() => {
    if (planarVizMode === 3) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const gl = cv.getContext("webgl2", { antialias: true, preserveDrawingBuffer: true });
    if (!gl) {
      console.error("[Alcubierre] WebGL2 unavailable â€“ cannot render Alcubierre panel");
      setGlError("WebGL2 unavailable in this browser.");
      return;
    }

    glRef.current = gl;
    let disposed = false;
    // Poll renderer diagnostic message exposed on window by Hull3DRenderer
    let diagTimer: number | null = null;
    const startDiagPoll = () => {
      if (diagTimer) return;
      diagTimer = window.setInterval(() => {
        try {
          const msgObj = (window as any).__hullDiagMessage as null | { message?: string };
          setHullDiagMsg(msgObj?.message ?? null);
        } catch {
          /* noop */
        }
      }, 500);
    };
    const stopDiagPoll = () => {
      if (diagTimer) {
        clearInterval(diagTimer);
        diagTimer = null;
      }
    };
    let raf = 0;
    let ro: ResizeObserver | null = null;
  let vbo: WebGLBuffer | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let fallbackBuf: WebGLBuffer | null = null;
  let fallbackVAO: WebGLVertexArrayObject | null = null;
    let prog: WebGLProgram | null = null;

    const markError = (message: string | null) => {
      if (!disposed) {
        setGlError(message);
      }
    };

    const glErrorToString = (err: number) => {
      switch (err) {
        case gl.INVALID_ENUM: return "INVALID_ENUM";
        case gl.INVALID_VALUE: return "INVALID_VALUE";
        case gl.INVALID_OPERATION: return "INVALID_OPERATION";
        case gl.INVALID_FRAMEBUFFER_OPERATION: return "INVALID_FRAMEBUFFER_OPERATION";
        case gl.OUT_OF_MEMORY: return "OUT_OF_MEMORY";
        case gl.CONTEXT_LOST_WEBGL: return "CONTEXT_LOST_WEBGL";
        default: return `0x${err.toString(16)}`;
      }
    };

    const checkError = (stage: string) => {
      const err = gl.getError();
      if (err !== gl.NO_ERROR) {
        console.error(`[Alcubierre][GL] ${stage} â†’ ${glErrorToString(err)}`, err);
      }
    };

    const withLineNumbers = (src: string) =>
      src
        .split("\n")
        .map((line, idx) => `${String(idx + 1).padStart(4, "0")}: ${line}`)
        .join("\n");

    const shaderStageLabel = (type: number) => (type === gl.VERTEX_SHADER ? "vertex" : "fragment");

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) {
        console.error("[Alcubierre][GL] Unable to create shader object");
        markError("Failed to allocate shader object.");
        return null;
      }
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      checkError(`compile ${shaderStageLabel(type)} shader`);
      const info = (gl.getShaderInfoLog(shader) || "").trim();
      if (info.length) {
        console.warn(`[Alcubierre][GLSL][${shaderSources.label}] ${shaderStageLabel(type).toUpperCase()} log:\n${info}`);
      }
      const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!ok) {
        const message = `${shaderSources.label} ${shaderStageLabel(type)} shader failed to compile`;
        console.error(`[Alcubierre][GLSL][${shaderSources.label}] ${message}\n${info || "(No info log)"}`);
        console.groupCollapsed(`[Alcubierre][GLSL][${shaderSources.label}] ${shaderStageLabel(type)} source`);
        console.error(withLineNumbers(src));
        console.groupEnd();
        markError(message);
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const lost = (event: Event) => {
      console.warn("[Alcubierre] WebGL context lost", event);
      markError("WebGL context lost â€“ reload recommended.");
    };
    const restored = () => {
      console.warn("[Alcubierre] WebGL context restored");
    };
    cv.addEventListener("webglcontextlost", lost);
    cv.addEventListener("webglcontextrestored", restored);

    console.log(`[Alcubierre] WebGL2 context OK (shader: ${shaderSources.label})`);

    const vs = compile(gl.VERTEX_SHADER, shaderSources.vert);
    const fs = vs ? compile(gl.FRAGMENT_SHADER, shaderSources.frag) : null;

    if (!vs || !fs) {
      progRef.current = null;
      vboRef.current = null;
      vcountRef.current = 0;
      return () => {
        disposed = true;
        cv.removeEventListener("webglcontextlost", lost);
        cv.removeEventListener("webglcontextrestored", restored);
      };
    }

    prog = gl.createProgram();
    if (!prog) {
      console.error("[Alcubierre][GL] Unable to create program");
      markError("Failed to allocate shader program.");
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return () => {
        disposed = true;
        cv.removeEventListener("webglcontextlost", lost);
        cv.removeEventListener("webglcontextrestored", restored);
      };
    }

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    checkError("link program");
    const programInfo = (gl.getProgramInfoLog(prog) || "").trim();
    if (programInfo.length) {
      console.warn(`[Alcubierre][GLSL][${shaderSources.label}] LINK log:\n${programInfo}`);
    }
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const message = `${shaderSources.label} program link failed`;
      console.error(`[Alcubierre][GLSL][${shaderSources.label}] ${message}\n${programInfo || "(No info log)"}`);
      markError(message);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      progRef.current = null;
      return () => {
        disposed = true;
        cv.removeEventListener("webglcontextlost", lost);
        cv.removeEventListener("webglcontextrestored", restored);
      };
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    progRef.current = prog;

    vbo = gl.createBuffer();
    if (!vbo) {
      markError("Failed to allocate vertex buffer.");
      gl.deleteProgram(prog);
      progRef.current = null;
      return () => {
        disposed = true;
        cv.removeEventListener("webglcontextlost", lost);
        cv.removeEventListener("webglcontextrestored", restored);
      };
    }
    vboRef.current = vbo;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const grid = makeGrid(res);
    gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
    checkError("bufferData grid");
    vcountRef.current = grid.length / 2;
    if (!vcountRef.current) {
      console.warn("[Alcubierre] VBO appears empty");
    }
    // Create VAO for grid
    vao = gl.createVertexArray();
    if (vao) {
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
    }

    const onResize = () => {
      const rect = cv.getBoundingClientRect();
      const w = Math.max(640, Math.floor(rect.width * devicePixelRatio));
      const h = Math.max(360, Math.floor(rect.height * devicePixelRatio));
      cv.width = w; cv.height = h;
      gl.viewport(0, 0, w, h);
      setAspect(w / Math.max(1, h));
      if (!w || !h) {
        console.warn("[Alcubierre] Canvas size is zero", w, h);
      }
    };

    onResize();
    ro = new ResizeObserver(onResize);
    ro.observe(cv);

    const loc = {
      a_pos: 0,
      u_axes: gl.getUniformLocation(prog, "u_axes"),
      u_sigma: gl.getUniformLocation(prog, "u_sigma"),
      u_R: gl.getUniformLocation(prog, "u_R"),
      u_beta: gl.getUniformLocation(prog, "u_beta"),
      u_viz: gl.getUniformLocation(prog, "u_viz"),
      u_ampChain: gl.getUniformLocation(prog, "u_ampChain"),
      u_gate: gl.getUniformLocation(prog, "u_gate"),
      u_gate_view: gl.getUniformLocation(prog, "u_gate_view"),
      u_duty: gl.getUniformLocation(prog, "u_duty"),
      u_yGain: gl.getUniformLocation(prog, "u_yGain"),
      u_yBias: gl.getUniformLocation(prog, "u_yBias"),
      u_kColor: gl.getUniformLocation(prog, "u_kColor"),
      u_mvp: gl.getUniformLocation(prog, "u_mvp"),
      u_totalSectors: gl.getUniformLocation(prog, "u_totalSectors"),
      u_liveSectors: gl.getUniformLocation(prog, "u_liveSectors"),
      u_lumpExp: gl.getUniformLocation(prog, "u_lumpExp"),
      u_sectorCenter: gl.getUniformLocation(prog, "u_sectorCenter"),
      u_sectorSigma: gl.getUniformLocation(prog, "u_sectorSigma"),
      u_sectorFloor: gl.getUniformLocation(prog, "u_sectorFloor"),
      u_syncMode: gl.getUniformLocation(prog, "u_syncMode"),
        u_phase01: gl.getUniformLocation(prog, "u_phase01"),
        u_splitEnabled: gl.getUniformLocation(prog, "u_splitEnabled"),
        u_splitFrac: gl.getUniformLocation(prog, "u_splitFrac"),
      u_vizFloorThetaGR: gl.getUniformLocation(prog, "u_vizFloorThetaGR"),
      u_vizFloorRhoGR: gl.getUniformLocation(prog, "u_vizFloorRhoGR"),
      u_vizFloorThetaDrive: gl.getUniformLocation(prog, "u_vizFloorThetaDrive"),
    } as const;

    markError(null);

    let frame = 0;
    const draw = () => {
      if (disposed || !prog || !vbo) return;
      gl.clearColor(0.02, 0.03, 0.06, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);

      gl.useProgram(prog);
      checkError("useProgram");
      if (vao) {
        gl.bindVertexArray(vao);
      } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      }

      const s = (x: number, d = 0) => (Number.isFinite(x) ? x : d);
      const d = dynRef.current;
      const gateView = Math.max(0, s((d as any).gateView ?? d.gate, 0));
      const floorThetaGR = Math.max(0, s((d as any).vizFloorThetaGR, 1e-9));
      const floorRhoGR = Math.max(0, s((d as any).vizFloorRhoGR, 1e-18));
      const floorThetaDrive = Math.max(0, s((d as any).vizFloorThetaDrive, 1e-6));
  if (loc.u_axes) gl.uniform3f(loc.u_axes, s(d.axes[0], 1), s(d.axes[1], 1), s(d.axes[2], 1));
  if (loc.u_sigma) gl.uniform1f(loc.u_sigma, s(d.sigma, 6));
  if (loc.u_R) gl.uniform1f(loc.u_R, Math.max(0.1, s(d.R, 1)));
  if (loc.u_beta) gl.uniform1f(loc.u_beta, s(d.beta, 0));
  if (loc.u_viz) gl.uniform1i(loc.u_viz, d.planarVizMode);
  if (loc.u_ampChain) gl.uniform1f(loc.u_ampChain, s(d.ampChain, 1));
  if (loc.u_gate) gl.uniform1f(loc.u_gate, Math.max(0, s(d.gate, 0)));
  if (loc.u_gate_view) gl.uniform1f(loc.u_gate_view, gateView);
  if (loc.u_duty) gl.uniform1f(loc.u_duty, Math.max(0, Math.min(1, s(d.duty, 0))));
  if (loc.u_yGain) gl.uniform1f(loc.u_yGain, s(d.yGain, 1e-8));
  if (loc.u_yBias) gl.uniform1f(loc.u_yBias, s(d.yBias, 0));
  if (loc.u_kColor) gl.uniform1f(loc.u_kColor, s(d.kColor, 1e-6));
  if (loc.u_mvp) gl.uniformMatrix4fv(loc.u_mvp, false, d.mvp);
  if (loc.u_totalSectors) gl.uniform1i(loc.u_totalSectors, d.totalSectors | 0);
  if (loc.u_liveSectors) gl.uniform1i(loc.u_liveSectors, d.liveSectors | 0);
  if (loc.u_lumpExp) gl.uniform1f(loc.u_lumpExp, s(d.lumpBoostExp, 1.25));
  if (loc.u_sectorCenter) gl.uniform1f(loc.u_sectorCenter, s(d.sectorCenter, 0));
  if (loc.u_sectorSigma) gl.uniform1f(loc.u_sectorSigma, Math.max(1e-4, s(d.sectorSigma, 0.01)));
  if (loc.u_sectorFloor) gl.uniform1f(loc.u_sectorFloor, Math.min(0.99, Math.max(0, s(d.sectorFloor, 0))));
  if (loc.u_syncMode) gl.uniform1i(loc.u_syncMode, d.syncMode | 0);
  if (loc.u_phase01) gl.uniform1f(loc.u_phase01, s(d.phase01, 0));
  if (loc.u_splitEnabled) gl.uniform1i(loc.u_splitEnabled, (d as any).splitEnabled | 0);
  if (loc.u_splitFrac) gl.uniform1f(loc.u_splitFrac, s((d as any).splitFrac ?? 0.5, 0.5));
  if (loc.u_vizFloorThetaGR) gl.uniform1f(loc.u_vizFloorThetaGR, floorThetaGR);
  if (loc.u_vizFloorRhoGR) gl.uniform1f(loc.u_vizFloorRhoGR, floorRhoGR);
  if (loc.u_vizFloorThetaDrive) gl.uniform1f(loc.u_vizFloorThetaDrive, floorThetaDrive);

      const rows = res - 1;
      const vertsPerRow = res * 2;
      const expectedVCount = rows * vertsPerRow;
      if (!vcountRef.current) {
        gl.disableVertexAttribArray(0);
          if (!fallbackBuf) {
            fallbackBuf = gl.createBuffer();
            if (fallbackBuf) {
              gl.bindBuffer(gl.ARRAY_BUFFER, fallbackBuf);
              gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 0, -1, 0.01, 1, 0, 1, 0.01]), gl.STREAM_DRAW);
              if (!fallbackVAO) {
                fallbackVAO = gl.createVertexArray();
                if (fallbackVAO) {
                  gl.bindVertexArray(fallbackVAO);
                  gl.bindBuffer(gl.ARRAY_BUFFER, fallbackBuf);
                  gl.enableVertexAttribArray(0);
                  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                  gl.bindVertexArray(null);
                }
              }
            }
          }
          if (fallbackVAO) {
            gl.bindVertexArray(fallbackVAO);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          }
      } else {
        if (vcountRef.current !== expectedVCount) {
          console.warn(`[Alcubierre] Unexpected vertex count: got ${vcountRef.current}, expected ${expectedVCount} (res=${res}). Rendering may be degraded.`);
        }
        const collapsed = (!Number.isFinite(d.yGain) || Math.abs(d.yGain) < 1e-12) || (d.gate <= 0 && d.planarVizMode === 2);
        if (collapsed) {
          if (!fallbackBuf) {
            fallbackBuf = gl.createBuffer();
            if (fallbackBuf) {
              gl.bindBuffer(gl.ARRAY_BUFFER, fallbackBuf);
              gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, 0, 1, 0,
                0, -1, 0, 1,
              ]), gl.STREAM_DRAW);
              if (!fallbackVAO) {
                fallbackVAO = gl.createVertexArray();
                if (fallbackVAO) {
                  gl.bindVertexArray(fallbackVAO);
                  gl.bindBuffer(gl.ARRAY_BUFFER, fallbackBuf);
                  gl.enableVertexAttribArray(0);
                  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                  gl.bindVertexArray(null);
                }
              }
            }
          }
          if (fallbackVAO) {
            gl.bindVertexArray(fallbackVAO);
            gl.drawArrays(gl.LINES, 0, 4);
          }
        } else {
          for (let row = 0; row < rows; row++) {
            const off = row * vertsPerRow;
            gl.drawArrays(gl.TRIANGLE_STRIP, off, vertsPerRow);
          }
        }
      }

      checkError("drawArrays");

      if ((frame++ % 120) === 0) {
        console.debug('[Alcubierre uniforms]', {
          planarVizMode: d.planarVizMode,
          sigma: d.sigma,
          R: d.R,
          beta: d.beta,
          ampChain: d.ampChain,
          gate: d.gate,
          yGain: d.yGain,
          yBias: d.yBias,
          kColor: d.kColor,
          totalSectors: d.totalSectors,
          liveSectors: d.liveSectors,
          lumpBoostExp: d.lumpBoostExp,
        });
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (fallbackVAO) gl.deleteVertexArray(fallbackVAO);
      if (fallbackBuf) gl.deleteBuffer(fallbackBuf);
      if (vao) gl.deleteVertexArray(vao);
      if (vbo) gl.deleteBuffer(vbo);
      if (prog) gl.deleteProgram(prog);
      cv.removeEventListener("webglcontextlost", lost);
      cv.removeEventListener("webglcontextrestored", restored);
    };
  }, [planarVizMode, res, shaderSources]);

  useEffect(() => {
    if (planarVizMode !== 3) {
      if (hullRafRef.current) {
        cancelAnimationFrame(hullRafRef.current);
        hullRafRef.current = 0;
      }
      if (hullRendererRef.current) {
        hullRendererRef.current.dispose();
        hullRendererRef.current = null;
      }
      return;
    }
    const cv = canvasRef.current;
    if (!cv) return;
    const gl = cv.getContext("webgl2", { antialias: true, preserveDrawingBuffer: true });
    if (!gl) {
      setGlError("WebGL2 unavailable in this browser.");
      return;
    }
    glRef.current = gl;
    setGlError(null);

    const onLost = (event: Event) => {
      try {
        (event as any).preventDefault?.();
      } catch {}
      console.warn("[Alcubierre][Hull3D] WebGL context lost", event);
      setGlError("WebGL context lost – attempting restore.");
      try {
        hullRendererRef.current?.dispose();
      } catch {}
      hullRendererRef.current = null;
    };

    const recreateRenderer = () => {
      try {
        hullRendererRef.current?.dispose();
      } catch {}
      const next = new Hull3DRenderer(gl, cv, {
        quality: hullQuality,
        qualityOverrides: hullQualityOverridesRef.current,
        emaAlpha: 0.12,
      });
      const config = hullConfigRef.current;
      next.setMode(config.mode, config.blend);
      next.setQuality(hullQuality, hullQualityOverridesRef.current);
      hullRendererRef.current = next;
    };

    const onRestored = () => {
      console.warn("[Alcubierre][Hull3D] WebGL context restored – recreating renderer");
      try {
        setGlError(null);
        recreateRenderer();
      } catch (err) {
        console.error("[Alcubierre][Hull3D] Failed to recreate renderer after context restore", err);
        setGlError("WebGL context restored but Hull3D renderer failed to reinitialize.");
      }
    };

    cv.addEventListener("webglcontextlost", onLost as any, { passive: false } as any);
    cv.addEventListener("webglcontextrestored", onRestored as any);

    recreateRenderer();

    if (!hullRendererRef.current) {
      setGlError("Failed to initialize Hull3D renderer.");
      return () => {
        cv.removeEventListener("webglcontextlost", onLost as any);
        cv.removeEventListener("webglcontextrestored", onRestored as any);
      };
    }

    const resize = () => {
      const rect = cv.getBoundingClientRect();
      const w = Math.max(640, Math.floor(rect.width * devicePixelRatio));
      const h = Math.max(360, Math.floor(rect.height * devicePixelRatio));
      cv.width = w;
      cv.height = h;
      const overlayCanvas = overlayCanvasRef.current;
      if (overlayCanvas) {
        overlayCanvas.width = w;
        overlayCanvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      setAspect(w / Math.max(1, h));
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    // Local diagnostic polling helpers for Hull 3D renderer
    let diagTimer: number | null = null;
    const startDiagPoll = () => {
      if (diagTimer) return;
      diagTimer = window.setInterval(() => {
        try {
          const msgObj = (window as any).__hullDiagMessage as null | { message?: string };
          setHullDiagMsg(msgObj?.message ?? null);
        } catch {
          /* noop */
        }
      }, 500);
    };
    const stopDiagPoll = () => {
      if (diagTimer) {
        clearInterval(diagTimer);
        diagTimer = null;
      }
    };

    let disposed = false;
    const loop = () => {
      if (disposed || planarVizMode !== 3) return;
      const base = hullStateRef.current;
      const active = hullRendererRef.current;
      if (base && active) {
        const config = hullConfigRef.current;
        active.setMode(config.mode, config.blend);
        active.update({
          ...base,
          blendFactor: config.blend,
          timeSec: performance.now() / 1000,
        });
        active.draw();
        // Begin polling diagnostics once renderer has drawn at least one frame
        startDiagPoll();
      }
      hullRafRef.current = requestAnimationFrame(loop);
    };

    hullRafRef.current = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      if (hullRafRef.current) {
        cancelAnimationFrame(hullRafRef.current);
        hullRafRef.current = 0;
      }
      ro.disconnect();
      stopDiagPoll();
      cv.removeEventListener("webglcontextlost", onLost as any);
      cv.removeEventListener("webglcontextrestored", onRestored as any);
      try {
        hullRendererRef.current?.dispose();
      } catch {}
      hullRendererRef.current = null;
    };
  }, [planarVizMode]);

  // Runtime diagnostics: warn if pipeline data absent for extended time
  useEffect(()=>{
    if (live) return; // only arm timer if missing
    const t = setTimeout(()=>{
      if (!live) console.warn('[AlcubierrePanel] No pipeline data after 5s â€“ using defaults (check energy pipeline query).');
    }, 5000);
    return ()=>clearTimeout(t);
  }, [live]);

  // ---- HUD (expected, peak (Ã—âˆšw/f), Î¸95) --------------------------------------
  const thetaDrive_est = useMemo(() => {
    return ampChain * beta * dfdr_peak_est * gateRaw;
  }, [ampChain, beta, dfdr_peak_est, gateRaw]);

  const thetaScaleExpected = useMemo(() => {
    const candidates = [
      (live as any)?.thetaScaleExpected,
      (live as any)?.theta_scale_expected,
      (live as any)?.thetaExpected,
    ];
    for (const cand of candidates) {
      const v = Number(cand);
      if (Number.isFinite(v) && Math.abs(v) > 1e-12) {
        return v;
      }
    }
    return null;
  }, [live]);

  const thetaAudit = useMemo(() => {
    const expected = typeof thetaScaleExpected === "number" ? thetaScaleExpected : null;
    if (expected === null) return null;
    // Use pipeline-calibrated gammaVdB_mass and Ford-Roman duty for audit parity
    const ggeo = Number((live as any)?.gammaGeo);
    const q = Number((live as any)?.qSpoilingFactor ?? (live as any)?.q ?? 1);
    const gammaV_mass = Number((live as any)?.gammaVanDenBroeck_mass ?? (live as any)?.gammaVanDenBroeck ?? (live as any)?.gammaVanDenBroeck_vis);
    const d_eff = Number((live as any)?.dutyEffectiveFR ?? (live as any)?.dutyEffective_FR);
    if (![ggeo, q, gammaV_mass, d_eff].every(Number.isFinite)) return null;
    const est = Math.pow(ggeo, 3) * q * gammaV_mass * d_eff;
    const exp = expected;
    const estAbs = Math.abs(est);
    const expAbs = Math.abs(exp);
    const maxMag = Math.max(estAbs, expAbs);
    // When both values are extremely small, noise dominates â€“ suppress the audit readout.
    if (maxMag < 1e-9) return null;
    const denom = Math.max((estAbs + expAbs) * 0.5, 1e-9);
    const diff = est - exp;
    const diffPct = (diff / denom) * 100;
    const deviation = Math.abs(diffPct);
    const ratio = expAbs >= 1e-9 ? est / exp : null;
    const sign = Math.sign(est) === Math.sign(exp) ? 1 : -1;
    return { expected: exp, ratio, diffPct, deviation, sign, estimate: est, denom };
  }, [thetaScaleExpected, live]);

  const theta_expected = useMemo(() => {
    if (planarVizMode === 0) return beta * dfdr_peak_est;
    if (planarVizMode === 1) return beta * beta * dfdr_peak_est * dfdr_peak_est * 0.019894367886486918;
    return thetaDrive_est; // no âˆš(w/f)
  }, [planarVizMode, beta, dfdr_peak_est, thetaDrive_est]);
  
  const theta_peak = useMemo(() => theta_expected * boostWF, [theta_expected, boostWF]);

  const driveDiag = useMemo(() => {
    if (planarVizMode !== 2) return null;
    const span = (Number.isFinite(thetaMax) && Number.isFinite(thetaMin)) ? thetaMax - thetaMin : null;
    return {
      ampChain,
      gate: gateRaw,
      gateView,
      thetaPkPos,
      span,
      sectorFloor: ds.sectorFloor,
      sigmaSectors: ds.sigmaSectors,
      syncScheduler,
      centerDeltaDeg,
    };
  }, [planarVizMode, ampChain, gateRaw, gateView, thetaPkPos, thetaMax, thetaMin, ds.sectorFloor, ds.sigmaSectors, syncScheduler, centerDeltaDeg, ds]);

  useEffect(() => {
    const expected =
      typeof thetaScaleExpected === "number" && Number.isFinite(thetaScaleExpected)
        ? thetaScaleExpected
        : undefined;
    const thetaUsed =
      Number.isFinite(thetaDrive_est ?? NaN) ? thetaDrive_est : undefined;
    const ratio =
      expected != null && Math.abs(expected) > 1e-18 && thetaUsed != null
        ? thetaUsed / expected
        : undefined;
    const payload: any = {
      locked: lockScale,
      thetaExpected: expected,
      thetaUsed,
      ratio,
      analyticPeak: Number.isFinite(ampRef ?? NaN) ? ampRef : undefined,
      tailPeak: Number.isFinite(thetaPk ?? NaN) ? thetaPk : undefined,
    };
    // Only push yGain/kColor into shared store when lock is enabled,
    // so Viz HUD can control display-only knobs when unlocked.
    if (sharedPhysicsLock || lockScale) {
      payload.yGain = yGainFinal;
      payload.kColor = kColor;
    }
    setSharedPhysics(payload);
  }, [setSharedPhysics, lockScale, sharedPhysicsLock, yGainFinal, kColor, thetaScaleExpected, thetaDrive_est, ampRef, thetaPk]);

  useEffect(() => {
    if (planarVizMode !== 2) return;
    const now = performance.now();
    if (now - lastDriveLogRef.current < 1000) return;
    lastDriveLogRef.current = now;
    const span = Number.isFinite(thetaMax) && Number.isFinite(thetaMin) ? thetaMax - thetaMin : null;
    console.debug("[Alcubierre Î¸Drive]", {
      beta,
      ampChain,
      gate_raw: gateRaw,
      gate_view: gate,
      dutyFR,
      yGain,
      theta_expected,
      theta_drive_est: thetaDrive_est,
      theta_scale_expected: thetaScaleExpected,
      theta_peak,
      thetaPkPos,
      thetaSpan: span,
      span,
      audit: thetaAudit,
      sectorFloor: ds.sectorFloor,
      sigmaSectors: ds.sigmaSectors,
      syncScheduler,
      sectorCenter: sectorCenter01,
      gaussianSigma,
    });
    if (thetaAudit && thetaAudit.deviation > 10) {
      console.warn("[Alcubierre Î¸Driveâˆ†] Server Î¸ mismatch", {
        deviationPct: thetaAudit.deviation,
        diffPct: thetaAudit.diffPct,
        ratio: thetaAudit.ratio,
        signAlign: thetaAudit.sign,
        denom: thetaAudit.denom,
        theta_scale_expected: thetaScaleExpected,
        theta_drive_est: thetaDrive_est,
      });
    }
  }, [planarVizMode, beta, ampChain, gate, gateRaw, dutyFR, yGain, theta_expected, theta_peak, thetaPkPos, thetaMax, thetaMin, thetaDrive_est, thetaScaleExpected, thetaAudit, ds.sectorFloor, ds.sigmaSectors, syncScheduler, sectorCenter01, gaussianSigma, ds]);

  // --- DEBUG comparative logging: listen for helix:phys:bundle events broadcast from helix-core
  useEffect(() => {
    const handler = (e: any) => {
      const detail = e?.detail;
      if (!detail) return;
      const { showPhys, realPhys, ts } = detail;
      // Compute signatures to highlight mismatches
      const panelSig = {
        ampChain_panel: ampChain,
        gate_panel: gateRaw,
        gate_view_panel: gate,
        gammaGeo_panel: live?.gammaGeo,
        gammaVdB_panel: live?.gammaVanDenBroeck_vis ?? live?.gammaVanDenBroeck,
        duty_panel: live?.dutyEffectiveFR ?? live?.dutyEffective_FR ?? live?.dutyCycle,
      };
      const coreSig = {
        gammaGeo_show: showPhys?.gammaGeo,
        q_show: showPhys?.qSpoilingFactor,
        gammaVdB_show: showPhys?.gammaVanDenBroeck_vis,
        duty_show: showPhys?.dutyEffectiveFR,
        gammaGeo_real: realPhys?.gammaGeo,
        q_real: realPhys?.q,
        gammaVdB_real: realPhys?.gammaVdB,
        duty_real: realPhys?.dFR,
      };
      // Only log if something is plausibly divergent (e.g., panel gate ~0 but core duty nonzero)
      const dutyPanel = Number(panelSig.duty_panel);
      const dutyCore = Number(coreSig.duty_show ?? coreSig.duty_real);
      const gammaPanel = Number(panelSig.gammaVdB_panel);
      const gammaCore = Number(coreSig.gammaVdB_show ?? coreSig.gammaVdB_real);
      if ((dutyPanel < 1e-6 && dutyCore > 1e-4) || (gammaPanel < 2 && gammaCore > 10)) {
        console.warn('[AlcubierrePanelâ†”helix-core mismatch]', { ts, panelSig, coreSig });
      }
    };
    window.addEventListener('helix:phys:bundle' as any, handler as any);
    return () => window.removeEventListener('helix:phys:bundle' as any, handler as any);
  }, [ampChain, gateRaw, gate, live]);

  const sectorUtilSummary = useMemo(() => {
    const totalRaw = Number(totalSectors);
    const liveRaw = Number(liveSectors);
    const activeRaw = Number(fActive);
    const floorRaw = Number(ds?.sectorFloor);
    const total = Number.isFinite(totalRaw) ? Math.max(1, Math.round(totalRaw)) : null;
    const live = Number.isFinite(liveRaw) ? Math.max(0, Math.round(liveRaw)) : null;
    const active = Number.isFinite(activeRaw) ? Math.max(0, activeRaw) : null;
    const floor = Number.isFinite(floorRaw) ? Math.min(0.99, Math.max(0, floorRaw)) : null;
    if (total === null) {
      return {
        text: "Sector util --",
        className: undefined,
        title: "Live sector utilisation data unavailable",
      };
    }
    const liveText = live !== null ? `${live}/${total}` : `--/${total}`;
    const activePct = active !== null ? (active * 100) : null;
    const floorPct = floor !== null ? (floor * 100) : null;
    const activeText = activePct !== null ? `${activePct.toFixed(activePct < 1 ? 2 : 1)}%` : "--";
    const floorText = floorPct !== null ? `${floorPct.toFixed(0)}%` : "--";
    const floorDominates = floor !== null && active !== null && floor > active * 1.1;
    return {
      text: `Sector util ${liveText} | fActive ${activeText} | floor clamp ${floorText}${floorDominates ? " (floor dominated)" : ""}`,
      className: floorDominates ? "ring-1 ring-amber-500/60" : undefined,
      title: `Live sectors: ${live ?? "--"} / ${total}, fActive: ${activePct !== null ? `${activePct.toFixed(3)}%` : "--"}, floor clamp: ${floorText}${floorDominates ? " (floor dominates)" : ""}`,
    };
  }, [totalSectors, liveSectors, fActive, ds.sectorFloor]);

  const lightCrossSummary = useMemo(() => {

    const tauRaw = Number(lightLoop?.tauLC_ms);

    const burstRaw = Number(lightLoop?.burst_ms);

    const dwellRaw = Number(lightLoop?.dwell_ms);

    const tau = Number.isFinite(tauRaw) ? tauRaw : null;

    const burst = Number.isFinite(burstRaw) ? burstRaw : null;

    const dwell = Number.isFinite(dwellRaw) ? dwellRaw : null;



    if (tau === null && burst === null && dwell === null) {

      return {

        text: "Light-cross --",

        className: "bg-indigo-900/60 text-indigo-100",

        title: "Light-crossing metrics unavailable",

      };

    }



    const burstDwellText =

      burst !== null && dwell !== null ? `${fmtTimeSmartMs(burst)}/${fmtTimeSmartMs(dwell)}` : "--";

    const dutyPct =

      burst !== null && dwell !== null && burst + dwell > 0

        ? (burst / (burst + dwell)) * 100

        : null;

    const burstTau =

      burst !== null && tau !== null && tau > 0

        ? `${(burst / tau).toFixed(1)}x`

        : "--";

    const tauText = fmtTimeSmartMs(tau);

    const summaryText = `Light-cross tauLC ${tauText} | burst/dwell ${burstDwellText} | duty ${

      dutyPct !== null ? `${dutyPct.toFixed(1)}%` : "--"

    } | b/tau ${burstTau}`;

    const title = `tauLC=${tau !== null ? `${tau} ms` : "--"}, burst=${burst !== null ? `${burst} ms` : "--"}, dwell=${dwell !== null ? `${dwell} ms` : "--"}, duty=${dutyPct !== null ? `${dutyPct.toFixed(2)}%` : "--"}, b/tau=${burstTau}`;

    return {

      text: summaryText,

      className: "bg-indigo-900/60 text-indigo-100",

      title,

    };

  }, [lightLoop.tauLC_ms, lightLoop.burst_ms, lightLoop.dwell_ms]);

  const lastZetaBadgeRef = useRef<{ value: number; limit: number } | null>(null);
  const zetaBadgeData = useMemo(() => {
    const rawValue = Number((sharedComplianceState as any)?.zeta?.value);
    const rawLimit = Number((sharedComplianceState as any)?.zeta?.limit);
    const nextValue = Number.isFinite(rawValue) ? rawValue : null;
    const nextLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : null;

    if (nextValue !== null && nextLimit !== null) {
      lastZetaBadgeRef.current = { value: nextValue, limit: nextLimit };
    }

    const current = lastZetaBadgeRef.current;

    if (!current) {
      return {
        text: "zeta value/limit --",
        className: "bg-slate-800/70 text-slate-200",
        title: "Ford-Roman zeta compliance unavailable",
      };
    }

    const ratio = current.value / current.limit;
    const text = `zeta ${current.value.toPrecision(3)}/${current.limit.toPrecision(3)} | ${ratio.toFixed(2)}x`;
    let className = "bg-emerald-800/70 text-emerald-100";
    if (ratio >= 1) className = "bg-rose-800/80 text-rose-100";
    else if (ratio >= 0.9) className = "bg-amber-800/80 text-amber-100";
    return {
      text,
      className,
      title: `zeta=${current.value}, limit=${current.limit}, ratio=${ratio.toFixed(3)}`,
    };
  }, [(sharedComplianceState as any)?.zeta?.value, (sharedComplianceState as any)?.zeta?.limit]);

  const driveChainSummary = useMemo(() => {
    const liveAny = live as any;
    const gammaGeoNum = Number(liveAny?.gammaGeo);
    const qValue = [
      liveAny?.qSpoilingFactor,
      liveAny?.q,
      liveAny?.qSpoil,
      liveAny?.qCavity,
    ]
      .map((candidate) => Number(candidate))
      .find((candidate) => Number.isFinite(candidate) && candidate > 0);
    const gammaValue = [
      liveAny?.gammaVanDenBroeck_vis,
      liveAny?.gammaVanDenBroeck,
      liveAny?.gammaVanDenBroeck_mass,
      liveAny?.gammaVdB_vis,
      liveAny?.gammaVdB,
      liveAny?.gamma_vdb,
    ]
      .map((candidate) => Number(candidate))
      .find((candidate) => Number.isFinite(candidate) && candidate > 0);
    const chain = Number.isFinite(ampChain ?? NaN) ? ampChain : null;
    if (!Number.isFinite(gammaGeoNum) || qValue == null || gammaValue == null || chain == null) {
      return {
        text: "Drive chain gamma_geo^3 * q * gamma_VdB = --",
        className: undefined,
        title: "Drive chain factors unavailable",
      };
    }
    const gammaCube = Math.pow(gammaGeoNum, 3);
    return {
      text: `Drive chain gamma_geo^3 * q * gamma_VdB = ${chain.toExponential(2)} (${gammaCube.toExponential(2)} * ${qValue.toPrecision(3)} * ${gammaValue.toPrecision(3)})`,
      className: undefined,
      title: `gamma_geo=${gammaGeoNum}, q=${qValue}, gamma_VdB=${gammaValue}, ampChain=${chain}`,
    };
  }, [ampChain, live]);

  const cadenceSummary = useMemo(() => {
    const freqNum = Number(freqGHz);
    const periodNum = Number(sectorPeriodMs);
    const freqValid = Number.isFinite(freqNum);
    const periodValid = Number.isFinite(periodNum);
    if (!freqValid && !periodValid) {
      return {
        text: "Cadence --",
        className: undefined,
        title: "Cadence data unavailable",
      };
    }
    const text = `Cadence ${freqValid ? `${freqNum.toFixed(3)} GHz` : "--"} | ${
      periodValid ? `${periodNum.toFixed(2)} ms` : "--"
    }`;
    return {
      text,
      className: undefined,
      title: `freqGHz=${freqValid ? freqNum : "--"}, sectorPeriodMs=${periodValid ? periodNum : "--"}`,
    };
  }, [freqGHz, sectorPeriodMs]);

  const hullSummary = useMemo(() => {

    const axesValid =
      Array.isArray(axes) &&
      axes.length >= 3 &&
      axes.slice(0, 3).every((value: number) => Number.isFinite(Number(value)));
    const basisResolved = hullDimsResolved?.basis ?? HULL_BASIS_IDENTITY;

    const wallNum = Number(wallWidth_m);
    const wallValid = Number.isFinite(wallNum);

    if (!axesValid && !wallValid) {
      return {
        text: "Hull --",
        className: undefined,
        title: "Hull dimensions unavailable",
      };
    }

    const axesHalfXYZ = axesValid
      ? ([Number(axes[0]), Number(axes[1]), Number(axes[2])] as [number, number, number])
      : null;
    const dimsXYZ = axesHalfXYZ
      ? ([axesHalfXYZ[0] * 2, axesHalfXYZ[1] * 2, axesHalfXYZ[2] * 2] as [number, number, number])
      : null;

    const dimsFRU = dimsXYZ ? remapXYZToFrontRightUp(dimsXYZ, basisResolved) : null;
    const axesFRU = axesHalfXYZ ? remapXYZToFrontRightUp(axesHalfXYZ, basisResolved) : null;

    const wallText = wallValid ? `${wallNum.toFixed(3)} m` : "--";
    const basisLabel = dimsFRU ? `basis F/R/U=${dimsFRU.labels.front}/${dimsFRU.labels.right}/${dimsFRU.labels.up}` : "basis --";

    return {
      text: `Hull F/R/U ${dimsFRU ? `${formatTriplet(dimsFRU.values, 1)} m` : "--"} | t_w ${wallText}`,
      className: undefined,
      title: `${basisLabel}${
        axesHalfXYZ
          ? ` | axes (x,y,z half)=${axesHalfXYZ.map((v) => v.toFixed(3)).join(",")} | axes (F/R/U half)=${axesFRU ? formatTriplet(axesFRU.values, 3) : "--"}`
          : ""
      }${
        dimsXYZ
          ? ` | dims (x,y,z)=${dimsXYZ.map((v) => v.toFixed(3)).join(",")} | dims (F/R/U)=${dimsFRU ? formatTriplet(dimsFRU.values, 3) : "--"}`
          : ""
      } | wallWidth=${wallValid ? wallNum : "--"}`,
    };
  }, [axes, hullDimsResolved?.basis, wallWidth_m]);

  const bubbleBoxSummary = useMemo(() => {
    if (hullVolumeDomain !== "bubbleBox") return null;
    const axesValid =
      Array.isArray(axes) &&
      axes.length >= 3 &&
      axes.slice(0, 3).every((value: number) => Number.isFinite(Number(value)));
    if (!axesValid) {
      return {
        text: `bubbleBox ${bubbleBoundsMode} --`,
        title: "bubbleBox bounds unavailable (missing hull axes)",
      };
    }
    const basisResolved = hullDimsResolved?.basis ?? HULL_BASIS_IDENTITY;
    const dimsXYZ: [number, number, number] = [Number(axes[0]) * 2, Number(axes[1]) * 2, Number(axes[2]) * 2];
    const scale = Number.isFinite(hullDomainScale) ? hullDomainScale : 1;
    const boundsXYZ: [number, number, number] = [dimsXYZ[0] * scale, dimsXYZ[1] * scale, dimsXYZ[2] * scale];
    const boundsFRU = remapXYZToFrontRightUp(boundsXYZ, basisResolved);
    const titleParts = [
      `bubbleBox bounds (x,y,z)=${boundsXYZ.map((v) => v.toFixed(3)).join(",")}`,
      `bubbleBox bounds (F/R/U)=${formatTriplet(boundsFRU.values, 3)}`,
      `domainScale=${scale}`,
      `basis F/R/U=${boundsFRU.labels.front}/${boundsFRU.labels.right}/${boundsFRU.labels.up}`,
    ];
    return {
      text: `bubbleBox ${bubbleBoundsMode} F/R/U ${formatTriplet(boundsFRU.values, 1)} m`,
      title: titleParts.join(" | "),
    };
  }, [axes, bubbleBoundsMode, hullDomainScale, hullDimsResolved?.basis, hullVolumeDomain]);

  const thetaScaleBadge = useMemo(() => {
    const expected = Number.isFinite(Number(thetaScaleExpected)) ? Number(thetaScaleExpected) : null;
    const audit = thetaAudit;
    const estimate = audit && Number.isFinite(Number(audit.estimate)) ? Number(audit.estimate) : null;
    const delta = audit && Number.isFinite(Number(audit.diffPct)) ? Number(audit.diffPct) : null;
    if (expected === null || audit == null || estimate === null) {
      return {
        text: "theta scale --",
        className: "bg-slate-900/70 text-slate-200",
        title: "Theta scale parity unavailable",
      };
    }
    const deltaText = delta !== null ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%` : "--";
    const className =
      delta !== null && Math.abs(delta) > 10
        ? "bg-slate-900/70 text-slate-200 ring-1 ring-amber-500/60"
        : "bg-slate-900/70 text-slate-200";
    return {
      text: `theta scale ${expected.toExponential(2)} / est ${estimate.toExponential(2)} | delta ${deltaText}`,
      className,
      title: `expected=${expected}, est=${estimate}, diffPct=${delta ?? "--"}, deviation=${audit.deviation ?? "--"}`,
    };
  }, [thetaScaleExpected, thetaAudit]);
  const latticeCoverageBadge = useMemo(() => {
    if (!latticeModeEnabled) {
      return {
        text: "Coverage --",
        className: "bg-slate-900/70 text-slate-300",
        title: "Enable lattice to view volume coverage.",
      };
    }
    if (!latticeOverlayVolumeReady || !latticeVolumeStats) {
      return {
        text: "Coverage pending",
        className: "bg-amber-900/60 text-amber-100",
        title: overlayLockedReason ?? "Lattice path not active; using analytic volume.",
      };
    }
    const covText = `${latticeVolumeStats.covPct.toFixed(1)}%`;
    const gateText = latticeVolumeStats.maxGate.toFixed(3);
    const clampBits: string[] = [];
    if (sharedLatticeState?.volume?.clampReasons?.length) {
      clampBits.push(`volume clamp: ${sharedLatticeState.volume.clampReasons.join(", ")}`);
    }
    if (latticeFrameStats?.clampReasons?.length) {
      clampBits.push(`frame clamp: ${latticeFrameStats.clampReasons.join(", ")}`);
    }
    const titleParts = [
      `Coverage ${covText} | max gate ${gateText}${latticeVolumeStats.cacheHit ? " (cache)" : ""}`,
      clampBits.length ? clampBits.join(" | ") : null,
    ].filter(Boolean);
    return {
      text: `Coverage ${covText} | gate ${gateText}`,
      className: "bg-sky-900/60 text-sky-100",
      title: titleParts.join(" | "),
    };
  }, [
    latticeModeEnabled,
    latticeOverlayVolumeReady,
    latticeVolumeStats,
    overlayLockedReason,
    sharedLatticeState?.volume?.clampReasons,
    latticeFrameStats?.clampReasons,
  ]);
  const perfProfileBadge = useMemo(
    () => ({
      text: `Profile ${overlayProfileKey}${latticeProfileTag === "card" ? "/card" : ""}`,
      className: "bg-slate-900/70 text-slate-200",
      title: `Quality preset ${hullQuality} | lattice profile ${latticeProfileTag}`,
    }),
    [hullQuality, latticeProfileTag, overlayProfileKey],
  );
  const latticePathBadge = useMemo(() => {
    const pathText = latticePathActive ? "Lattice" : "Analytic";
    const className = latticePathActive
      ? "bg-emerald-900/70 text-emerald-100"
      : "bg-amber-900/70 text-amber-100";
    const titleParts = [
      `Path=${pathText}`,
      latticeDowngradeLabel ? `Format=${latticeDowngradeLabel}` : null,
      latticeDowngradeReason ? `Reason=${latticeDowngradeReason}` : null,
      latticeFallbackStatus?.hint ?? latticeFallbackStatus?.label ?? overlayLockedReason,
    ].filter(Boolean);
    return {
      text: `${pathText} | ${latticeDowngradeLabel}`,
      className,
      title: titleParts.join(" | "),
    };
  }, [
    latticeDowngradeLabel,
    latticeDowngradeReason,
    latticeFallbackStatus?.hint,
    latticeFallbackStatus?.label,
    latticePathActive,
    overlayLockedReason,
  ]);

  const latticeDowngradeBadge = useMemo(() => {
    const reason =
      latticeDowngradeReason ??
      ((latticeRuntime as any)?.telemetry?.downgradeReason as string | undefined) ??
      ((latticeRuntime as any)?.formatReason as string | undefined) ??
      null;
    const frameClamp = latticeFrameStats?.clampReasons?.length ? latticeFrameStats.clampReasons.join(", ") : null;
    const volumeClamp = sharedLatticeState?.volume?.clampReasons?.length
      ? sharedLatticeState.volume.clampReasons.join(", ")
      : null;
    if (!reason && !frameClamp && !volumeClamp) return null;
    const titleParts = [
      reason ? `downgrade: ${reason}` : null,
      latticeRuntime?.formatLabel ? `format: ${latticeRuntime.formatLabel}` : null,
      frameClamp ? `frame clamp: ${frameClamp}` : null,
      volumeClamp ? `volume clamp: ${volumeClamp}` : null,
    ].filter(Boolean);
    return {
      text: reason ? `Downgrade ${reason}` : "Clamp active",
      className: "bg-amber-900/70 text-amber-100",
      title: titleParts.join(" | "),
    };
  }, [
    latticeDowngradeReason,
    latticeRuntime,
    latticeFrameStats?.clampReasons,
    sharedLatticeState?.volume?.clampReasons,
  ]);
  const latticeRetryable =
    latticeModeEnabled &&
    latticeAvailable &&
    Boolean(latticeFallbackStatus || latticeGpuStatus?.volumeFailed || latticeGpuStatus?.sdfFailed);

  const handleRetryLattice = useCallback(() => {
    latticeVolumeWantedKeyRef.current = null;
    latticeVolumePendingSinceRef.current = null;
    latticeVolumeBuildingRef.current = false;
    setLatticeGpuStatus(null);
    setSharedLattice({
      volume: null,
      sdf: latticeRequireSdf ? null : undefined,
      updatedAt: Date.now(),
    });
    publish("hull3d:lattice:retry", {
      ts: Date.now(),
      reason: latticeFallbackStatus?.reason ?? null,
      modeEnabled: latticeModeEnabled,
    });
  }, [latticeFallbackStatus?.reason, latticeModeEnabled, latticeRequireSdf, setSharedLattice]);

  useEffect(() => {
    if (!latticeModeEnabled || !frameClampSignature) return;
    if (latticeQualityLocked) return;
    if (latticeAutoTuneRef.current.lastFrameKey === frameClampSignature) return;
    const frameClampReasons = sharedLatticeState?.frame?.clampReasons ?? [];
    const hitPaddingOrDims = frameClampReasons.some(
      (reason) => reason.startsWith("padding:") || reason.startsWith("dims:")
    );
    if (!hitPaddingOrDims) return;

    let changed = false;
    const actions: string[] = [];
    if (hullVolumeDomain !== "wallBand") {
      setHullVolumeDomain("wallBand");
      actions.push("volumeDomain=wallBand");
      changed = true;
    }
    if (bubbleBoundsMode !== "tight") {
      setBubbleBoundsMode("tight");
      actions.push("padding=tight");
      changed = true;
    }
    if (hullVoxelDensity === "high") {
      setHullVoxelDensity("medium");
      actions.push("voxelDensity=medium");
      changed = true;
    } else if (hullVoxelDensity === "medium") {
      setHullVoxelDensity("low");
      actions.push("voxelDensity=low");
      changed = true;
    }
    if (hullQuality !== "low") {
      setHullQuality("low");
      actions.push("quality=low");
      changed = true;
    }

    latticeAutoTuneRef.current.lastFrameKey = frameClampSignature;
    if (changed) {
      console.info("[Hull3D] Auto-tuned lattice after frame clamp", { actions, frameClampReasons });
      handleRetryLattice();
    }
  }, [
    bubbleBoundsMode,
    frameClampSignature,
    handleRetryLattice,
    hullQuality,
    hullVoxelDensity,
    hullVolumeDomain,
    latticeModeEnabled,
    latticeQualityLocked,
    sharedLatticeState?.frame?.clampReasons,
  ]);

  useEffect(() => {
    if (!latticeModeEnabled || !latticeRequireSdf) return;
    if (!sdfClampSignature) return;
    if (latticeAutoTuneRef.current.lastSdfKey === sdfClampSignature) return;

    const signature = sdfClampSignature.toLowerCase();
    const hasDegenerate = signature.includes("degenerate");
    const budgetHit = signature.includes("budget");
    const sampleHit = signature.includes("sample");
    if (hasDegenerate || budgetHit || sampleHit) {
      latticeAutoTuneRef.current.lastSdfKey = sdfClampSignature;
      setLatticeRequireSdf(false);
      console.warn("[Hull3D] Auto-disabled Require SDF after SDF clamp", { reasons: sdfClampSignature });
    }
  }, [latticeModeEnabled, latticeRequireSdf, sdfClampSignature]);

  useEffect(() => {
    const caps = (latticeGpuStatus as any)?.caps ?? null;
    if (!latticeModeEnabled || !caps) return;
    if (latticeAutoTuneRef.current.capsApplied) return;

    const actions: string[] = [];
    if (!caps.supportsHalfFloatLinear && !caps.supportsFloatLinear && hullVoxelDensity !== "low") {
      setHullVoxelDensity("low");
      actions.push("voxelDensity=low");
    }
    if (caps.max3DTextureSize && caps.max3DTextureSize < 1024) {
      if (hullVolumeDomain !== "wallBand") {
        setHullVolumeDomain("wallBand");
        actions.push("volumeDomain=wallBand");
      }
      if (bubbleBoundsMode !== "tight") {
        setBubbleBoundsMode("tight");
        actions.push("padding=tight");
      }
    }

    latticeAutoTuneRef.current.capsApplied = true;
    if (actions.length) {
      console.info("[Hull3D] Auto-tuned lattice for GPU caps", { actions, caps });
    }
  }, [bubbleBoundsMode, hullVoxelDensity, hullVolumeDomain, latticeGpuStatus, latticeModeEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const frame = sharedLatticeState?.frame ?? null;
    const volume = sharedLatticeState?.volume ?? null;
    const sdf = sharedLatticeState?.sdf ?? null;
    const strobe = sharedLatticeState?.strobe ?? null;

    const voxels = frame?.voxelCount ?? 0;
    const budgetMax = frame?.budget?.maxVoxels ?? null;
    const budgetPct = budgetMax && budgetMax > 0 ? (voxels / budgetMax) * 100 : null;

    const caps = (latticeGpuStatus as any)?.caps ?? null;
    const runtime = (latticeGpuStatus as any)?.runtime ?? null;
    const volumeFailedReason =
      typeof (latticeGpuStatus as any)?.volumeFailedReason === "string"
        ? String((latticeGpuStatus as any).volumeFailedReason)
        : null;
    const sdfFailedReason =
      typeof (latticeGpuStatus as any)?.sdfFailedReason === "string"
        ? String((latticeGpuStatus as any).sdfFailedReason)
        : null;
    const watchdogStats = latticeWatchdogStats;
    const uploadTelemetry = (runtime as any)?.telemetry ?? null;
    const formatReason =
      ((runtime as any)?.formatReason as string | undefined) ??
      (uploadTelemetry?.downgradeReason as string | undefined) ??
      null;
    const frameClampReasons = frame?.clampReasons?.length ? frame.clampReasons : null;
    const volumeClampReasons = volume?.clampReasons?.length ? volume.clampReasons : null;

    const health = {
      ts: Date.now(),
      enabled: latticeModeEnabled,
      path: runtime?.hasLatticeVolume ? "lattice" : "analytic",
      fallbackReason: latticeFallbackStatus?.reason ?? null,
      fallbackLabel: latticeFallbackStatus?.label ?? null,
      fallbackLevel: latticeFallbackStatus?.level ?? null,
      hashes: {
        strobe: strobe?.hash ?? null,
        weights: strobe?.weightHash ?? null,
        volume: volume?.hash ?? null,
        volumeDeterminism: latticeVolumeDeterminismHash,
        sdf: sdf?.key ?? null,
        sdfDeterminism: latticeSdfDeterminismHash,
      },
      metrics: {
        voxelCount: voxels,
        voxelBudgetMax: budgetMax,
        voxelBudgetPct: budgetPct,
        coveragePct: volume?.stats?.coverage != null ? volume.stats.coverage * 100 : null,
        maxGate: volume?.stats?.maxGate ?? null,
        formatLabel: runtime?.formatLabel ?? null,
        formatReason: formatReason,
        uploadBytes: uploadTelemetry?.bytes ?? null,
        uploadBudgetBytes: uploadTelemetry?.budgetBytes ?? null,
        uploadBudgetVoxels: uploadTelemetry?.budgetVoxels ?? null,
        uploadSkippedReason: uploadTelemetry?.skippedReason ?? null,
        uploadDowngradeReason: uploadTelemetry?.downgradeReason ?? null,
        frameClampReasons,
        volumeClampReasons,
        watchdogBlocked: watchdogStats?.blocked ?? 0,
        watchdogLastBlockedAt: watchdogStats?.lastBlockedAt ?? null,
      },
      gpu: latticeGpuStatus
        ? {
            volumeReady: latticeGpuStatus.volumeReady,
            volumeFailed: latticeGpuStatus.volumeFailed,
            volumeFailedReason,
            sdfReady: latticeGpuStatus.sdfReady,
            sdfFailed: latticeGpuStatus.sdfFailed,
            sdfFailedReason,
            caps,
            runtime,
          }
        : null,
    };

    const healthKey = [
      latticeModeEnabled ? 1 : 0,
      runtime?.hasLatticeVolume ? "lattice" : "analytic",
      latticeFallbackStatus?.reason ?? "ok",
      volumeFailedReason ?? "volFail:none",
      sdfFailedReason ?? "sdfFail:none",
      runtime?.backend ?? "backend:none",
      runtime?.formatLabel ?? "fmt:none",
      runtime?.formatReason ?? "fmtReason:none",
      caps?.max3DTextureSize ?? 0,
      caps?.maxTextureSize ?? 0,
      caps?.supportsFloatLinear ? 1 : 0,
      caps?.supportsHalfFloatLinear ? 1 : 0,
      strobe?.hash ?? "strobe:none",
      strobe?.weightHash ?? "weights:none",
      volume?.hash ?? "volume:none",
      latticeVolumeDeterminismHash ?? "volumeDet:none",
      sdf?.key ?? "sdf:none",
      latticeSdfDeterminismHash ?? "sdfDet:none",
      voxels,
      budgetMax ?? 0,
      Math.round((budgetPct ?? 0) * 10) / 10,
      latticeGpuStatus?.volumeReady ? 1 : 0,
      latticeGpuStatus?.volumeFailed ? 1 : 0,
      latticeGpuStatus?.sdfReady ? 1 : 0,
      latticeGpuStatus?.sdfFailed ? 1 : 0,
      Math.round(((volume?.stats?.coverage ?? 0) * 1000)) / 10,
      Math.round(((volume?.stats?.maxGate ?? 0) * 1e6)) / 1e6,
      uploadTelemetry?.bytes ?? "upload:none",
      uploadTelemetry?.skippedReason ?? "upload:ok",
      uploadTelemetry?.downgradeReason ?? "upload:downgrade:none",
      watchdogStats?.blocked ?? 0,
    ].join("|");

    if (healthKey !== latticeHealthKeyRef.current) {
      latticeHealthKeyRef.current = healthKey;
      (window as any).__hullLatticeHealth = health;
      (window as any).__hullWebGLCaps = caps;
      publish("hull3d:lattice:health", health);
    }

    const prevFallback = latticeFallbackReasonRef.current;
    const nextFallback = latticeFallbackStatus?.reason ?? null;
    if (nextFallback !== prevFallback) {
      latticeFallbackReasonRef.current = nextFallback;
      publish("hull3d:lattice:fallback", {
        ts: health.ts,
        enabled: latticeModeEnabled,
        reason: nextFallback,
        label: latticeFallbackStatus?.label ?? null,
        level: latticeFallbackStatus?.level ?? null,
        hint: latticeFallbackStatus?.hint ?? null,
        detail: latticeFallbackStatus?.detail ?? null,
        volumeHash: volume?.hash ?? null,
        sdfKey: sdf?.key ?? null,
        path: health.path,
        runtime,
        caps,
        formatReason,
        frameClampReasons,
        volumeClampReasons,
      });

      if (nextFallback) {
        const debug =
          typeof window !== "undefined" && Boolean((window as any).__latticeFallbackDebug);
        if (nextFallback !== "preview-missing" || debug) {
          const log = latticeFallbackStatus?.level === "info" ? console.info : console.warn;
          log("[Hull3D][lattice] fallback", {
            reason: nextFallback,
            label: latticeFallbackStatus?.label,
            hint: latticeFallbackStatus?.hint,
            detail: latticeFallbackStatus?.detail,
            path: health.path,
            volumeHash: volume?.hash?.slice(0, 16) ?? null,
            sdfKey: sdf?.key?.slice(0, 16) ?? null,
            caps,
            runtime,
          });
        }
      }
    }
  }, [
    latticeModeEnabled,
    latticeFallbackStatus,
    latticeGpuStatus,
    sharedLatticeState?.frame,
    sharedLatticeState?.strobe,
    sharedLatticeState?.volume,
    sharedLatticeState?.sdf,
    latticeVolumeDeterminismHash,
    latticeSdfDeterminismHash,
    latticeProfileTag,
    latticeWatchdogStats,
  ]);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const volume = latticeOverlayVolumeReady ? latticeVolumeForRenderer : null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!voxelOverlayActive || !volume) {
      ctx.restore();
      return;
    }

    ctx.scale(dpr, dpr);
    ctx.font = "11px Inter, system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "rgba(15,23,42,0.55)";
    ctx.strokeStyle = "rgba(148,163,184,0.65)";

    const dims = volume.dims;
    const gate = volume.gate3D;
    const axisIndex = voxelSliceAxis === "x" ? 0 : voxelSliceAxis === "y" ? 1 : 2;
    const sliceCount = Math.max(1, dims[axisIndex] || 1);
    const sliceMinIdx = Math.max(0, Math.min(sliceCount - 1, Math.round(voxelSliceMin * (sliceCount - 1))));
    const sliceMaxIdx = Math.max(sliceMinIdx, Math.min(sliceCount - 1, Math.round(voxelSliceMax * (sliceCount - 1))));
    const maxGate = Math.max(1e-6, latticeVolumeStats?.maxGate ?? volume.stats?.maxGate ?? 1);

    const dimsA = axisIndex === 0 ? dims[1] : axisIndex === 1 ? dims[0] : dims[1];
    const dimsB = axisIndex === 0 ? dims[2] : axisIndex === 1 ? dims[2] : dims[0];
    const indexFor = (a: number, b: number, slice: number) => {
      if (axisIndex === 0) {
        const x = slice;
        const y = a;
        const z = b;
        return x + dims[0] * (y + dims[1] * z);
      }
      if (axisIndex === 1) {
        const x = a;
        const y = slice;
        const z = b;
        return x + dims[0] * (y + dims[1] * z);
      }
      const x = b;
      const y = a;
      const z = slice;
      return x + dims[0] * (y + dims[1] * z);
    };

    const sampleValue = (a: number, b: number, slice: number) => {
      const idx = indexFor(a, b, slice);
      return gate[idx] ?? 0;
    };

    const size = Math.floor(Math.max(64, Math.min(180, Math.min(cssW, cssH) * 0.26)));
    const pad = 12;
    const boxW = size;
    const boxH = size;
    const sliceYTop = pad;
    const sliceYBottom = sliceYTop + boxH + 14;
    const sliceX = cssW - boxW - pad;

    const renderSlice = (label: string, sliceIndex: number, ox: number, oy: number) => {
      ctx.fillStyle = "rgba(15,23,42,0.55)";
      ctx.fillRect(ox - 4, oy - 4, boxW + 8, boxH + 20);
      const img = ctx.createImageData(boxW, boxH);
      const data = img.data;
      for (let y = 0; y < boxH; y++) {
        const aIdx = Math.min(dimsA - 1, Math.round((y / Math.max(1, boxH - 1)) * (dimsA - 1)));
        for (let x = 0; x < boxW; x++) {
          const bIdx = Math.min(dimsB - 1, Math.round((x / Math.max(1, boxW - 1)) * (dimsB - 1)));
          const val = sampleValue(aIdx, bIdx, sliceIndex);
          const norm = Math.max(0, Math.min(1, val / maxGate));
          const tone = Math.pow(norm, 0.4);
          const r = Math.round(40 + 170 * tone);
          const g = Math.round(110 + 130 * tone);
          const b = Math.round(160 + 70 * tone);
          const a = Math.round(220 * tone);
          const base = (y * boxW + x) * 4;
          data[base] = r;
          data[base + 1] = g;
          data[base + 2] = b;
          data[base + 3] = a;
        }
      }
      ctx.putImageData(img, ox, oy);
      ctx.strokeStyle = "rgba(148,163,184,0.7)";
      ctx.strokeRect(ox - 1, oy - 1, boxW + 2, boxH + 2);
      ctx.fillStyle = "rgba(226,232,240,0.85)";
      ctx.fillText(`${label} ${voxelSliceAxis.toUpperCase()} slice #${sliceIndex + 1}/${sliceCount}`, ox, oy + boxH + 12);
    };

    if (voxelSlicesEnabled) {
      renderSlice("Min", sliceMinIdx, sliceX, sliceYTop);
      renderSlice("Max", sliceMaxIdx, sliceX, sliceYBottom);
    }

    if (coverageHeatmapEnabled) {
      const strideA = Math.max(1, Math.floor(dimsA / 64));
      const strideB = Math.max(1, Math.floor(dimsB / 64));
      const profile = new Float32Array(sliceCount);
      let profileMax = 0;
      for (let s = 0; s < sliceCount; s++) {
        let peak = 0;
        for (let a = 0; a < dimsA; a += strideA) {
          for (let bIdx = 0; bIdx < dimsB; bIdx += strideB) {
            const v = sampleValue(a, bIdx, s);
            if (v > peak) peak = v;
          }
        }
        profile[s] = peak;
        if (peak > profileMax) profileMax = peak;
      }
      const chartW = Math.max(180, cssW * 0.42);
      const chartH = 48;
      const chartX = pad;
      const chartY = cssH - chartH - pad;
      ctx.fillStyle = "rgba(15,23,42,0.6)";
      ctx.fillRect(chartX - 4, chartY - 4, chartW + 8, chartH + 8);
      ctx.fillStyle = "rgba(148,163,184,0.35)";
      ctx.fillRect(chartX, chartY, chartW, chartH);
      if (profileMax > 0) {
        const bucketCount = Math.min(220, sliceCount);
        const bucketW = chartW / Math.max(1, bucketCount);
        for (let i = 0; i < bucketCount; i++) {
          const start = Math.floor((i / bucketCount) * sliceCount);
          const end = Math.min(sliceCount, Math.floor(((i + 1) / bucketCount) * sliceCount));
          let bucketPeak = 0;
          for (let s = start; s < end; s++) {
            if (profile[s] > bucketPeak) bucketPeak = profile[s];
          }
          const norm = Math.max(0, Math.min(1, bucketPeak / profileMax));
          const barH = norm * (chartH - 10);
          ctx.fillStyle = `rgba(16,185,129,${0.25 + 0.55 * norm})`;
          ctx.fillRect(chartX + i * bucketW, chartY + chartH - barH - 4, Math.max(1, bucketW - 0.5), barH);
        }
        const minLine = chartX + (sliceMinIdx / Math.max(1, sliceCount - 1)) * chartW;
        const maxLine = chartX + (sliceMaxIdx / Math.max(1, sliceCount - 1)) * chartW;
        ctx.strokeStyle = "rgba(94,234,212,0.9)";
        ctx.beginPath();
        ctx.moveTo(minLine, chartY - 2);
        ctx.lineTo(minLine, chartY + chartH + 2);
        ctx.moveTo(maxLine, chartY - 2);
        ctx.lineTo(maxLine, chartY + chartH + 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(226,232,240,0.85)";
        ctx.fillText(`Coverage by slice (axis ${voxelSliceAxis.toUpperCase()})`, chartX, chartY - 6);
      }
    }

    ctx.restore();
  }, [
    coverageHeatmapEnabled,
    latticeOverlayVolumeReady,
    latticeVolumeForRenderer,
    latticeVolumeStats?.maxGate,
    voxelOverlayActive,
    voxelSliceAxis,
    voxelSliceMax,
    voxelSliceMin,
    voxelSlicesEnabled,
  ]);

  useEffect(() => {
    const payload = {
      ts: Date.now(),
      profile: overlayProfileKey,
      latticeProfile: latticeProfileTag,
      overlays: {
        slices: {
          enabled: voxelSlicesEnabled,
          axis: voxelSliceAxis,
          min: voxelSliceMin,
          max: voxelSliceMax,
        },
        coverageHeatmap: coverageHeatmapEnabled,
      },
      path: latticePathActive ? "lattice" : "analytic",
      fallback: latticeFallbackStatus?.reason ?? null,
      coveragePct: latticeVolumeStats?.covPct ?? null,
      maxGate: latticeVolumeStats?.maxGate ?? null,
      downgrade: latticeDowngradeLabel,
      downgradeReason: latticeDowngradeReason,
      backend: (latticeRuntime as any)?.backend ?? null,
    };
    const key = JSON.stringify({
      profile: payload.profile,
      latticeProfile: payload.latticeProfile,
      overlays: payload.overlays,
      path: payload.path,
      fallback: payload.fallback,
      coveragePct: payload.coveragePct,
      maxGate: payload.maxGate,
      downgrade: payload.downgrade,
      downgradeReason: payload.downgradeReason,
      backend: payload.backend,
    });
    if (overlayTelemetryKeyRef.current !== key) {
      overlayTelemetryKeyRef.current = key;
      (window as any).__hullVoxelOverlay = payload;
      (window as any).__hullLatticePath = {
        path: payload.path,
        fallback: payload.fallback,
        coveragePct: payload.coveragePct,
        maxGate: payload.maxGate,
        downgrade: payload.downgrade,
        downgradeReason: payload.downgradeReason,
        profile: payload.profile,
        latticeProfile: payload.latticeProfile,
        backend: payload.backend,
      };
      publish("hull3d:voxel-overlays", payload);
    }
  }, [
    coverageHeatmapEnabled,
    latticeDowngradeLabel,
    latticeDowngradeReason,
    latticeFallbackStatus?.reason,
    latticePathActive,
    latticeProfileTag,
    latticeVolumeStats?.covPct,
    latticeVolumeStats?.maxGate,
    overlayProfileKey,
    voxelSliceAxis,
    voxelSliceMax,
    voxelSliceMin,
    voxelSlicesEnabled,
    (latticeRuntime as any)?.backend,
  ]);

  return (
    <CurvatureVoxProvider quality="medium" refetchMs={80}>
      <div className={cn("w-full", className)}>      {/* Fixed-height wrapper so the panel does not resize during live updates */}
      <div className="flex flex-col h-[560px] md:h-[620px] lg:h-[680px]">
        <TooltipProvider delayDuration={120} skipDelayDuration={250}>
          {/* Keep readings area from changing overall panel height; allow it to scroll if it grows */}
          <div className="flex flex-wrap gap-2 text-xs mb-2 opacity-85 shrink-0 overflow-y-auto pr-1 max-h-28 md:max-h-32">
          <span className="px-2 py-1 rounded bg-slate-800">Mode: <b>{String(live?.currentMode||"â€”")}</b></span>
          <MetricTooltipBadge
            label="Î¸_expected"
            value={theta_expected.toExponential(3)}
            description="Analytic York-time amplitude at the bubble wall before sector boosts (Î²Â·âˆ‚f/âˆ‚r evaluated at r = R)."
            className="bg-slate-800 hover:bg-slate-700/90"
          />
          <MetricTooltipBadge
            label="Î¸_peak (Ã—âˆšw/f)"
            value={theta_peak.toExponential(3)}
            description="Peak York-time amplitude after applying the âˆš(w/f_active) duty boost so active sectors stay visible."
            className="bg-slate-800 hover:bg-slate-700/90"
          />
          <MetricTooltipBadge
            label="Î¸â‚šâ‚– (tail)"
            value={thetaPk.toExponential(3)}
            description="Tail-median of the sampled field â€” a robust peak estimate that resists transient spikes and noise."
            className="bg-slate-800 hover:bg-slate-700/90"
          />
          <MetricTooltipBadge
            label="Ïƒ"
            value={sigma.toFixed(2)}
            description="Bubble wall steepness parameter. Larger Ïƒ squeezes the shell and sharpens gradients across the hull."
            className="bg-slate-800 hover:bg-slate-700/90"
          />
          <MetricTooltipBadge
            label="R"
            value={R.toFixed(2)}
            description="Nominal Alcubierre bubble radius used to scale sampling and camera framing."
            className="bg-slate-800 hover:bg-slate-700/90"
          />
          <MetricTooltipBadge
            label="Î²"
            value={beta.toFixed(2)}
            description="Ship velocity expressed as Î² = v/c. Drives the extrinsic curvature magnitude across the shell."
            className="bg-slate-800 hover:bg-slate-700/90"
          />
          {thetaAudit && (
            <MetricTooltipBadge
              label="Î¸_server Î”"
              value={`${thetaAudit.diffPct.toFixed(1)}%`}
              description="Symmetric percent gap between the panel estimate and the server-provided Î¸ scale. Positive values mean the panel is reporting a stronger drive field."
              className={cn(
                "hover:bg-slate-600/80",
                thetaAudit.deviation > 10
                  ? "bg-amber-800/80 text-amber-100 hover:bg-amber-700/80"
                  : "bg-slate-700/80 text-slate-200"
              )}
            />
          )}
          {driveDiag && (
            <>
              <div className="flex items-center gap-2">
                <MetricTooltipBadge
                  label="ampChain"
                  value={driveDiag.ampChain.toExponential(2)}
                  description="Product of I3_geoA3, q, and I3_VdB that scales the drive-mode York time response."
                  className="bg-emerald-800/70 hover:bg-emerald-700/80"
                />
                <TheoryBadge
                  refs={["vanden-broeck-1999"]}
                  categoryAnchor="Geometry-Amplifiers"
                />
              </div>
              <MetricTooltipBadge
                label="âˆšd_FR"
                value={driveDiag.gate.toFixed(3)}
                description="Square-root of the duty factor (d_FR) indicating how much of the drive field is active right now."
                className="bg-emerald-800/70 hover:bg-emerald-700/80"
              />
              <MetricTooltipBadge
                label="Î¸â‚šâ‚–âº"
                value={driveDiag.thetaPkPos.toExponential(2)}
                description="Positive tail peak of the drive field after sector weighting, highlighting the strongest active arc."
                className="bg-emerald-800/70 hover:bg-emerald-700/80"
              />
              <MetricTooltipBadge
                label="Î”Î¸"
                value={driveDiag.span !== null ? driveDiag.span.toExponential(2) : "â€”"}
                description="Robust span of Î¸ (Drive) using the 5â€“95% clipped range to avoid transient spikes. Indicates how much curvature variation the sector pattern induces."
                className="bg-emerald-800/70 hover:bg-emerald-700/80"
              />
              <MetricTooltipBadge
                label="Ïƒ_sector"
                value={`${driveDiag.sigmaSectors.toFixed(2)}s`}
                description="Gaussian sector width (Ïƒ) in scheduler sectors. Larger values broaden the active lobe across the ellipsoid."
                className="bg-emerald-800/70 hover:bg-emerald-700/80"
              />
              <MetricTooltipBadge
                label="floor"
                value={`${(driveDiag.sectorFloor * 100).toFixed(0)}%`}
                description="Baseline fraction of duty applied across all sectors to keep the full shell visible."
                className="bg-emerald-800/70 hover:bg-emerald-700/80"
              />
              <MetricTooltipBadge
                label="sync"
                value={driveDiag.syncScheduler ? "scheduler" : "fallback"}
                description="Indicates whether the drive gating is currently following the shared light-crossing scheduler or fallback contiguous sectors."
                className="bg-emerald-800/70 hover:bg-emerald-700/80"
              />
              {Number.isFinite(driveDiag.centerDeltaDeg ?? NaN) && (
                <MetricTooltipBadge
                  label="centerÎ”"
                  value={`${(driveDiag.centerDeltaDeg ?? 0).toFixed(1)}Â°`}
                  description="Angular difference between CPU-sampled peak weight and shader's sector center. Values near 0Â° indicate correct anchoring."
                  className={cn(
                    "bg-emerald-800/70 hover:bg-emerald-700/80",
                    (driveDiag.centerDeltaDeg ?? 0) > 12 ? "ring-2 ring-amber-500/70" : undefined
                  )}
                />
              )}
              <MetricTooltipBadge
                  label="phase"
                  value={`${(ds.phase01*360).toFixed(0)}Â°`}
                  description="Viewer phase offset applied to rotate the active lobe around the hull. Set 180Â° to flip contraction/expansion sides."
                  className="bg-emerald-800/70 hover:bg-emerald-700/80"
                />
            </>
          )}

          <div className="ml-auto flex flex-wrap justify-end gap-1 text-[0.65rem]">
            <span
              className={cn("rounded px-2 py-1 bg-slate-900/70 text-slate-200", sectorUtilSummary.className)}
              title={sectorUtilSummary.title}
            >
              {sectorUtilSummary.text}
            </span>
            <span
              className={cn("rounded px-2 py-1 flex flex-col gap-1", lightCrossSummary.className)}
              title={lightCrossSummary.title}
            >
              <span>{lightCrossSummary.text}</span>
              <span
                className="flex flex-wrap items-center gap-1 font-mono text-emerald-100"
                title={busPhaseSummary.title}
              >
                <span>{busPhaseSummary.busText}</span>
                <span className="text-emerald-400/70">|</span>
                <span>Δφ {busPhaseSummary.deltaText}</span>
                <span className="text-emerald-400/70">|</span>
                <span>{busPhaseSummary.loopText}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="ml-1 rounded bg-emerald-900/60 px-1 py-0.5 text-[0.55rem] uppercase tracking-wide text-emerald-200">
                      Source: usePhaseBridge
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="center"
                    className="max-w-xs text-xs text-slate-200"
                  >
                    Source: usePhaseBridge (server + metrics blend). Live channel:
                    {" "}
                    {busPhaseSource}
                  </TooltipContent>
                </Tooltip>
              </span>
              {phaseSparkline && (
                <div className="mt-1 flex flex-col gap-0.5">
                  <svg
                    viewBox={`0 0 ${phaseSparkline.width} ${phaseSparkline.height}`}
                    width={phaseSparkline.width}
                    height={phaseSparkline.height}
                    className="h-7 w-28"
                    role="img"
                    aria-label="Loop vs bus phase sparkline"
                  >
                    <title>Loop vs bus phase history</title>
                    <path
                      d={phaseSparkline.loopPath}
                      fill="none"
                      stroke="rgba(56,189,248,0.75)"
                      strokeWidth={1.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={phaseSparkline.busPath}
                      fill="none"
                      stroke="rgba(251,191,36,0.9)"
                      strokeWidth={1.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="flex items-center gap-3 text-[0.55rem] uppercase tracking-wide text-emerald-200/70">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-1 w-3 rounded bg-sky-300" />
                      Loop
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-1 w-3 rounded bg-amber-300" />
                      Bus
                    </span>
                  </span>
                </div>
              )}
            </span>
            {phaseDiffIndicator && (
              <span
                className={cn("rounded px-2 py-1 text-slate-200", phaseDiffIndicator.className)}
                title={phaseDiffIndicator.title}
              >
                {phaseDiffIndicator.text}
              </span>
            )}
            {busPayloadSummary && (
              <span
                className="rounded px-2 py-1 bg-slate-900/70 text-slate-200"
                title={busPayloadSummary.title}
              >
                {busPayloadSummary.text}
              </span>
            )}
            <span
              className={cn("rounded px-2 py-1", zetaBadgeData.className)}
              title={zetaBadgeData.title}
            >
              {zetaBadgeData.text}
            </span>
            <span
              className={cn("rounded px-2 py-1 bg-emerald-900/60 text-emerald-100", driveChainSummary.className)}
              title={driveChainSummary.title}
            >
              {driveChainSummary.text}
            </span>
            <span
              className={cn("rounded px-2 py-1 bg-slate-900/70 text-slate-200", cadenceSummary.className)}
              title={cadenceSummary.title}
            >
              {cadenceSummary.text}
            </span>
            <span
              className={cn("rounded px-2 py-1 bg-slate-900/70 text-slate-200", hullSummary.className)}
              title={hullSummary.title}
            >
              {hullSummary.text}
            </span>
            {bubbleBoxSummary ? (
              <span
                className="rounded px-2 py-1 bg-slate-900/70 text-slate-200"
                title={bubbleBoxSummary.title}
              >
                {bubbleBoxSummary.text}
              </span>
            ) : null}
            <span
              className={cn("rounded px-2 py-1", thetaScaleBadge.className)}
              title={thetaScaleBadge.title}
            >
              {thetaScaleBadge.text}
            </span>
            <span
              className={cn("rounded px-2 py-1", latticeCoverageBadge.className)}
              title={latticeCoverageBadge.title}
            >
              {latticeCoverageBadge.text}
            </span>
            <span
              className={cn("rounded px-2 py-1", perfProfileBadge.className)}
              title={perfProfileBadge.title}
            >
              {perfProfileBadge.text}
            </span>
            <span
              className={cn("rounded px-2 py-1", latticePathBadge.className)}
              title={latticePathBadge.title}
            >
              {latticePathBadge.text}
            </span>
            {latticeDowngradeBadge ? (
              <span
                className={cn("rounded px-2 py-1", latticeDowngradeBadge.className)}
                title={latticeDowngradeBadge.title}
              >
                {latticeDowngradeBadge.text}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded bg-slate-800/60 px-2 py-1">
            <label className="flex items-center gap-1 text-[0.7rem] font-medium text-slate-300">
              <input
                type="checkbox"
                className="accent-emerald-500"
                checked={shaderMode === "safe"}
                onChange={(event) => setShaderMode(event.target.checked ? "safe" : "main")}
              />
              Safe shader
            </label>
            <label className="flex items-center gap-1 text-[0.7rem] font-medium text-slate-300">
              <input
                type="checkbox"
                className="accent-emerald-500"
                checked={syncScheduler}
                onChange={(event) => setSyncScheduler(event.target.checked)}
              />
              Sync scheduler
            </label>
            <label className="flex items-center gap-1 text-[0.7rem] font-medium text-slate-300">
              <input
                type="checkbox"
                className="accent-emerald-500"
                checked={centerPlane}
                onChange={(event) => setCenterPlane(event.target.checked)}
              />
              Center plane
            </label>
            <label className="flex items-center gap-1 text-[0.7rem] font-medium text-slate-300">
              <input
                type="checkbox"
                className="accent-emerald-500"
                checked={lockBaseline}
                onChange={(event) => setLockBaseline(event.target.checked)}
              />
              Lock floor (Î¸Â·Drive)
            </label>
            <label className="flex items-center gap-1 text-[0.7rem] font-medium text-slate-300">
              <input
                type="checkbox"
                className="accent-emerald-500"
                checked={Math.abs((((ds.phase01*2)%2+2)%2) - 1) < 1e-3}
                onChange={(e) => {
                  if (typeof ds.setPhaseMode === "function") ds.setPhaseMode("manual");
                  if (typeof ds.setPhase === "function") ds.setPhase(e.target.checked ? 0.5 : 0);
                }}
              />
              Flip 180Â°
            </label>
            <div className="flex items-center gap-1">
              <span className="text-[0.65rem] text-slate-400">Ïƒ<sub>sector</sub></span>
              <input
                type="range"
                min={0.25}
                max={8}
                step={0.25}
                value={ds.sigmaSectors}
                onChange={(event) => {
                  if (typeof ds.setSigma === "function") {
                    ds.setSigma(Number(event.target.value));
                  }
                }}
                className="w-24 accent-emerald-500"
              />
              <span className="font-mono text-[0.65rem] text-slate-300">{ds.sigmaSectors.toFixed(2)}s</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[0.65rem] text-slate-400">phase</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={ds.phase01}
                onChange={(event) => { /* disabled: no-op */ }}
                disabled
                aria-disabled="true"
                className="w-24 accent-emerald-500 opacity-60 cursor-not-allowed"
              />
              <span className="font-mono text-[0.65rem] text-slate-300">{(ds.phase01*360).toFixed(0)}Â°</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[0.65rem] text-slate-400">floor</span>
              <input
                type="range"
                min={0}
                max={0.6}
                step={0.02}
                value={ds.sectorFloor}
                onChange={(event) => {
                  if (typeof ds.setFloor === "function") {
                    ds.setFloor(Number(event.target.value));
                  }
                }}
                className="w-20 accent-emerald-500"
              />
              <span className="font-mono text-[0.65rem] text-slate-300">{(ds.sectorFloor * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="ml-auto flex gap-1">
            <button
              title="${GREEK_THETA} (GR) - York time (trace of extrinsic curvature) in General Relativity"
              aria-label="York time ${GREEK_THETA} (GR)"
              onClick={() => {
                setPlanarVizMode(0);
                setUserVizLocked(true);
              }}
            >
              ${GREEK_THETA} (GR)
            </button>
            <button
              title="${GREEK_THETA} (GR) - Energy density from the Hamiltonian constraint (approx 0 in shell), General Relativity"
              aria-label="Energy density ${GREEK_THETA} (GR)"
              onClick={() => {
                setPlanarVizMode(1);
                setUserVizLocked(true);
              }}
            >
              ${GREEK_THETA} (GR)
            </button>
            <button
              title="${GREEK_THETA} (Drive) - York time scaled by drive chain (gamma_geo^3 * q * gamma_VdB * sqrt(d_FR)) and sector gating"
              aria-label="Drive-scaled York time ${GREEK_THETA} (Drive)"
              onClick={() => {
                setPlanarVizMode(2);
                setUserVizLocked(true);
              }}
            >
              ${GREEK_THETA} (Drive)
            </button>
            <button
              title="${GREEK_THETA} (Hull 3D) - live ellipsoidal hull volume with scheduler gating"
              aria-label="Theta Hull 3D"
              onClick={() => {
                setPlanarVizMode(3);
                setUserVizLocked(true);
              }}
              className={cn("px-2 py-1 rounded", planarVizMode === 3 ? "bg-amber-700 text-white" : "bg-slate-800")}
            >
              ${GREEK_THETA} (Hull 3D)
            </button>
          </div>
          {(planarVizMode === 0 || planarVizMode === 1) && (
            <div className="mt-3 grid grid-cols-1 gap-2 rounded bg-slate-800/40 px-3 py-2 text-[0.65rem] text-slate-200 sm:grid-cols-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-emerald-500"
                  checked={showKHeatOverlay}
                  onChange={(event) => setShowKHeatOverlay(event.target.checked)}
                />
                <span>K-invariant heatmap</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-emerald-500"
                  checked={showThetaIsoOverlay}
                  onChange={(event) => setShowThetaIsoOverlay(event.target.checked)}
                />
                <span>?<sub>GR</sub> isolines</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-emerald-500"
                  checked={showFordRomanBar}
                  onChange={(event) => setShowFordRomanBar(event.target.checked)}
                />
                <span>Ford–Roman bar</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-emerald-500"
                  checked={showSectorArcOverlay}
                  onChange={(event) => setShowSectorArcOverlay(event.target.checked)}
                />
                <span>Sector-weight arc</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-emerald-500"
                  checked={showTiltOverlay}
                  onChange={(event) => setShowTiltOverlay(event.target.checked)}
                />
                <span>ß-tilt arrow</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  checked={showGreensOverlay}
                  disabled
                  onChange={(event) => setShowGreensOverlay(event.target.checked)}
                />
                <span title="Publish f slices from Energy Pipeline to enable">Green's f slice</span>
              </label>
            </div>
          )}
          {planarVizMode === 3 && (
            <div className="mt-3 flex w-full flex-wrap items-center gap-3 rounded bg-slate-800/50 px-2 py-2">
              {/* Hull 3D debug tools */}
              <Hull3DDebugToggles
                surfaceOn={showHullSurfaceOverlay}
                setSurfaceOn={setShowHullSurfaceOverlay}
                gateSource={gateSource}
                setGateSource={setGateSource}
                gateViewEnabled={gateViewEnabled}
                setGateViewEnabled={setGateViewEnabled}
                forceFlatGate={forceFlatGate}
                setForceFlatGate={setForceFlatGate}
                onGatePreset={applyDriveCardPreset}
              />
              <div className="flex flex-col gap-2 rounded bg-slate-900/60 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.7rem] font-semibold text-slate-200">ß-gradient overlay</span>
                  <label className="flex items-center gap-2 text-[0.65rem] uppercase tracking-wide text-slate-400">
                    <span>Enable</span>
                    <input
                      type="checkbox"
                      checked={betaOverlayEnabled}
                      onChange={(event) => setBetaOverlayEnabled(event.target.checked)}
                      className="accent-emerald-500"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-3 text-[0.65rem] text-slate-300 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400 uppercase tracking-wide">ß target (m/s²)</span>
                    <input
                      type="range"
                      min={0.5}
                      max={20}
                      step={0.05}
                      value={betaTargetMs2}
                      onChange={(event) => setBetaTargetMs2(parseFloat(event.target.value))}
                      className="accent-emerald-500"
                    />
                    <span className="font-mono">{betaTargetMs2.toFixed(2)}</span>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400 uppercase tracking-wide">Comfort limit (m/s²)</span>
                    <input
                      type="range"
                      min={0.05}
                      max={10}
                      step={0.05}
                      value={betaComfortMs2}
                      onChange={(event) => setBetaComfortMs2(parseFloat(event.target.value))}
                      className="accent-emerald-500"
                    />
                    <span className="font-mono">{betaComfortMs2.toFixed(2)}</span>
                  </label>
                </div>
                <p className="text-[0.6rem] text-slate-400">
                  Hue encodes bow/stern sign, saturation tracks |?ß| against comfort, and value reflects ß vs target. White contours mark 0.05 g steps; a red band flags 0.4 g lateral gradients.
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded bg-slate-900/60 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.7rem] font-semibold text-slate-200">Stress map (CSI)</span>
                  <label className="flex items-center gap-2 text-[0.65rem] uppercase tracking-wide text-slate-400">
                    <span>Overlay</span>
                    <input
                      type="checkbox"
                      checked={isStressWindowOpen}
                      onChange={(event) => {
                        const next = event.target.checked;
                        if (next) {
                          openDesktopPanel("stress-map");
                        } else {
                          closeDesktopPanel("stress-map");
                        }
                      }}
                      className="accent-emerald-500"
                    />
                  </label>
                </div>
                <p className="text-[0.6rem] text-slate-400">
                  Uses /api/helix/qi/diagnostics to blend grad_phi, Var[rho_C], and pi_FR with live zeta/FR duty. Toggle on to display the CSI heat overlay on the hull view.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">Wireframe</span>
                <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={showWireframeOverlay}
                    onChange={(event) => setShowWireframeOverlay(event.target.checked)}
                  />
                  <span>Enable</span>
                </label>
                <button
                  type="button"
                  onClick={() => setWireframeLod("preview")}
                  className={cn(
                    "rounded px-2 py-1 text-[0.65rem]",
                    wireframeLod === "preview" ? "bg-emerald-700 text-white" : "bg-slate-700 text-slate-200"
                  )}
                  title="Coarse LOD; caps line width for speed"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setWireframeLod("high")}
                  className={cn(
                    "rounded px-2 py-1 text-[0.65rem]",
                    wireframeLod === "high" ? "bg-emerald-700 text-white" : "bg-slate-700 text-slate-200"
                  )}
                  title="Higher detail wireframe (clamped thickness)"
                >
                  High
                </button>
                <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={useFieldProbeOverlay}
                    disabled={!wireframeOverlay.overlay}
                    onChange={(event) => setUseFieldProbeOverlay(event.target.checked)}
                  />
                  <span>Field probe</span>
                </label>
                {useFieldProbeOverlay && fieldProbeLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-300" />
                ) : null}
                {wireframeOverlay.overlay?.meshHash ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[0.65rem] text-emerald-100">
                    Mesh {wireframeOverlay.overlay.meshHash.slice(0, 8)}
                  </span>
                ) : null}
                {wireframeClampLabel ? (
                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[0.65rem] text-amber-100">
                    {wireframeClampLabel}
                  </span>
                ) : null}
                {useFieldProbeOverlay && fieldProbe?.stats ? (
                  <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[0.65rem] text-sky-100">
                    |theta| max {fieldProbe.stats.absMax.toFixed(2)}
                  </span>
                ) : null}
                {!wireframeOverlay.overlay && showWireframeOverlay ? (
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-[0.65rem] text-slate-200">
                    Fallback: geometric rings
                  </span>
                ) : null}
                {wireframePatches.length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {wireframePatches.map((patch) => (
                      <span
                        key={patch.sector}
                        className="rounded-full bg-emerald-500/10 px-2 py-1 text-[0.6rem] text-emerald-100"
                      >
                        S{patch.sector}: {patch.gateAvg.toFixed(2)} ({patch.gateMin.toFixed(2)}–{patch.gateMax.toFixed(2)})
                        {patch.blanketAvg !== undefined
                          ? ` • blanket ${patch.blanketAvg.toFixed(2)}`
                          : ""}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">Lattice</span>
                <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={latticeModeEnabled}
                    disabled={!latticeModeEnabled && (!hullPreview || hullDimsResolved?.source !== "preview")}
                    onChange={(event) => setLatticeModeEnabled(event.target.checked)}
                  />
                  <span>Enable</span>
                </label>
                <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={latticeRequireSdf}
                    disabled={!latticeRequireSdf && (!latticeModeEnabled || !hullPreview || hullDimsResolved?.source !== "preview")}
                    onChange={(event) => setLatticeRequireSdf(event.target.checked)}
                  />
                  <span>Require SDF</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowLatticeDiagnostics((prev) => !prev)}
                  className="rounded border border-slate-600 px-2 py-1 text-[0.65rem] text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
                >
                  {showLatticeDiagnostics ? "Hide diag" : "Diag"}
                </button>
                {!hullPreview || hullDimsResolved?.source !== "preview" ? (
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-[0.65rem] text-slate-200">
                    Preview mesh required
                  </span>
                ) : null}
                {latticeModeEnabled && latticeVolumeStats?.hashShort ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[0.65rem] text-emerald-100">
                    Vol {latticeVolumeStats.hashShort}
                  </span>
                ) : null}
                {latticeModeEnabled && sharedLatticeState?.sdf?.key ? (
                  <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[0.65rem] text-sky-100">
                    SDF {sharedLatticeState.sdf.key.slice(0, 8)}
                  </span>
                ) : null}
                {latticeModeEnabled && latticeGuardrails.messages.length
                  ? latticeGuardrails.messages.map((msg) => (
                      <span
                        key={msg.label}
                        title={(() => {
                          if (msg.label === "Stale hash" || msg.label === "Weights pending") {
                            const desired = latticeGuardrails.desiredWeightHash ?? "n/a";
                            const built = latticeGuardrails.builtWeightHash ?? "n/a";
                            return `want ${desired} vs built ${built}`;
                          }
                          if (msg.label.startsWith("Missing SDF")) {
                            return latticeRequireSdf
                              ? "Hull SDF required before enabling lattice sampling."
                              : "Hull SDF not ready; analytic shell blend disabled.";
                          }
                          if (msg.label === "Over budget") {
                            const reasons = sharedLatticeState?.volume?.clampReasons?.join(", ");
                            return reasons ? `volume clamp: ${reasons}` : "Voxel sample budget exceeded.";
                          }
                          return msg.label;
                        })()}
                        className={cn(
                          "rounded-full px-2 py-1 text-[0.65rem]",
                          msg.level === "error"
                            ? "bg-red-500/10 text-red-100"
                            : "bg-amber-500/10 text-amber-100",
                        )}
                      >
                        {msg.label}
                      </span>
                    ))
                  : null}
                {latticeModeEnabled &&
                latticeFallbackStatus &&
                latticeFallbackStatus.reason !== "disabled" &&
                latticeFallbackStatus.reason !== "preview-required" &&
                latticeFallbackStatus.reason !== "preview-missing" ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-[0.65rem]",
                      latticeFallbackStatus.level === "error"
                        ? "bg-red-500/10 text-red-100"
                        : latticeFallbackStatus.level === "warn"
                          ? "bg-amber-500/10 text-amber-100"
                          : "bg-slate-800 px-2 py-1 text-slate-200",
                    )}
                    title={[
                      latticeFallbackStatus.reason,
                      latticeFallbackStatus.hint,
                      latticeFallbackStatus.detail ? `detail: ${latticeFallbackStatus.detail}` : null,
                    ]
                      .filter(Boolean)
                      .join(" | ")}
                  >
                    {latticeFallbackStatus.label}
                  </span>
                ) : null}
                {latticeModeEnabled && !latticeFallbackStatus && latticeGpuStatus?.runtime?.hasLatticeVolume ? (
                  <span
                    className="rounded-full bg-sky-500/10 px-2 py-1 text-[0.65rem] text-sky-100"
                    title={`GPU path: ${latticeGpuStatus.runtime.formatLabel ?? latticeGpuStatus.runtime.backend ?? "lattice"}${
                      latticeGpuStatus.runtime.useAtlas ? " (atlas)" : ""
                    }${
                      latticeGpuStatus.runtime.formatReason
                        ? ` | ${latticeGpuStatus.runtime.formatReason}`
                        : (latticeGpuStatus.runtime as any)?.telemetry?.downgradeReason
                          ? ` | ${(latticeGpuStatus.runtime as any).telemetry.downgradeReason}`
                          : ""
                    }`}
                  >
                      GPU {latticeGpuStatus.runtime.formatLabel ?? "lattice"}
                  </span>
                ) : null}
                {latticeModeEnabled && latticeRetryable ? (
                  <button
                    type="button"
                    onClick={handleRetryLattice}
                    disabled={latticeRebuildPending}
                    className={cn(
                      "rounded border px-2 py-1 text-[0.65rem]",
                      latticeRebuildPending
                        ? "cursor-not-allowed border-slate-700 text-slate-400"
                        : "border-emerald-500/60 text-emerald-100 hover:border-emerald-300 hover:text-emerald-50",
                    )}
                    title="Retry lattice rebuild/upload with current profile"
                  >
                    Retry lattice
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">Voxel overlays</span>
                <label
                  className="flex items-center gap-1 text-[0.65rem] text-slate-200"
                  title={overlayControlsDisabled ? overlayLockedReason ?? undefined : undefined}
                >
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={voxelSlicesEnabled}
                    disabled={overlayControlsDisabled}
                    onChange={(event) => handleSliceToggle(event.target.checked)}
                  />
                  <span>Slices</span>
                </label>
                <select
                  value={voxelSliceAxis}
                  onChange={(event) => handleSliceAxisChange(event.target.value as HullVoxelSliceAxis)}
                  disabled={sliceControlsDisabled}
                  className="rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100 disabled:opacity-50"
                >
                  <option value="x">Axis X</option>
                  <option value="y">Axis Y</option>
                  <option value="z">Axis Z</option>
                </select>
                <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                  <span>Min</span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={voxelSliceMin.toFixed(2)}
                    disabled={sliceControlsDisabled}
                    onChange={(event) => {
                      const next = parseFloat(event.target.value);
                      applySliceBounds(Number.isFinite(next) ? next : voxelSliceMin, voxelSliceMax);
                    }}
                    className="w-16 rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100 disabled:opacity-50"
                  />
                </label>
                <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                  <span>Max</span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={voxelSliceMax.toFixed(2)}
                    disabled={sliceControlsDisabled}
                    onChange={(event) => {
                      const next = parseFloat(event.target.value);
                      applySliceBounds(voxelSliceMin, Number.isFinite(next) ? next : voxelSliceMax);
                    }}
                    className="w-16 rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100 disabled:opacity-50"
                  />
                </label>
                <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={coverageHeatmapEnabled}
                    disabled={overlayControlsDisabled}
                    onChange={(event) => handleHeatmapToggle(event.target.checked)}
                  />
                  <span>Coverage heatmap</span>
                </label>
                {overlayLockedReason ? (
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-[0.65rem] text-slate-200">
                    {overlayLockedReason}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">Spacetime grid</span>
                <span className="text-[0.6rem] uppercase tracking-wide text-slate-500">Presets</span>
                <div className="flex flex-wrap items-center gap-1">
                  {SPACETIME_GRID_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applySpacetimeGridPreset(preset)}
                      title={preset.hint}
                      className="rounded-full border border-slate-700/70 bg-slate-900/70 px-2 py-1 text-[0.6rem] text-slate-200 hover:border-slate-500/70 hover:bg-slate-800"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={spacetimeGridEnabled}
                    onChange={(event) => handleSpacetimeGridToggle(event.target.checked)}
                  />
                  <span>Enabled</span>
                </label>
                <select
                  value={spacetimeGridMode}
                  onChange={(event) =>
                    handleSpacetimeGridModeChange(event.target.value as HullSpacetimeGridMode)
                  }
                  className="rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100"
                >
                  <option value="slice">Slice</option>
                  <option value="surface">Surface</option>
                  <option value="volume">Volume</option>
                </select>
                <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                  <span>Spacing (m)</span>
                  <input
                    type="number"
                    min={0.05}
                    max={5}
                    step={0.05}
                    value={spacetimeGridSpacing.toFixed(2)}
                    onChange={(event) => {
                      const next = parseFloat(event.target.value);
                      handleSpacetimeGridSpacingChange(Number.isFinite(next) ? next : spacetimeGridSpacing);
                    }}
                    className="w-20 rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100"
                  />
                </label>
                <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                  <span>Warp</span>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.05}
                    value={spacetimeGridWarpStrength.toFixed(2)}
                    onChange={(event) => {
                      const next = parseFloat(event.target.value);
                      handleSpacetimeGridWarpStrengthChange(
                        Number.isFinite(next) ? next : spacetimeGridWarpStrength
                      );
                    }}
                    className="w-20 rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100"
                  />
                </label>
                <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                  <span>Falloff (m)</span>
                  <input
                    type="number"
                    min={0.05}
                    max={6}
                    step={0.05}
                    value={spacetimeGridFalloff.toFixed(2)}
                    onChange={(event) => {
                      const next = parseFloat(event.target.value);
                      handleSpacetimeGridFalloffChange(Number.isFinite(next) ? next : spacetimeGridFalloff);
                    }}
                    className="w-20 rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100"
                  />
                </label>
                <select
                  value={spacetimeGridColorBy}
                  onChange={(event) =>
                    handleSpacetimeGridColorByChange(event.target.value as HullSpacetimeGridColorBy)
                  }
                  className="rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100"
                >
                  <option value="thetaSign">Color by theta sign</option>
                  <option value="thetaMagnitude">Color by |theta|</option>
                  <option value="warpStrength">Color by warp strength</option>
                </select>
                <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                  <input
                    type="checkbox"
                    className="accent-emerald-500"
                    checked={spacetimeGridUseSdf}
                    onChange={(event) => handleSpacetimeGridUseSdfChange(event.target.checked)}
                    title="Prefer lattice SDF for offsets; falls back to analytic distance when missing."
                  />
                  <span>Use SDF</span>
                </label>
                <select
                  value={spacetimeGridStrengthMode}
                  onChange={(event) =>
                    handleSpacetimeGridStrengthModeChange(
                      event.target.value as HullSpacetimeGridStrengthMode
                    )
                  }
                  className="rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100"
                  title="Manual uses entered warp; auto scales to theta peaks or expected scale."
                >
                  <option value="manual">Manual</option>
                  <option value="autoThetaPk">Auto theta peak</option>
                  <option value="autoThetaScaleExpected">Auto theta expected</option>
                </select>
                {spacetimeGridBadges.length
                  ? spacetimeGridBadges.map((badge) => (
                      <span
                        key={badge.label}
                        title={badge.title}
                        className={cn(
                          "rounded-full px-2 py-1 text-[0.65rem]",
                          badge.level === "warn"
                            ? "bg-amber-500/10 text-amber-100"
                            : "bg-slate-800 text-slate-200",
                        )}
                      >
                        {badge.label}
                      </span>
                    ))
                  : null}
              </div>
              {showLatticeDiagnostics && (
                <div className="w-full rounded bg-slate-900/60 px-3 py-2 text-[0.65rem] text-slate-200">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-1 font-mono sm:grid-cols-2">
                    <span>mode</span>
                    <span>{latticeModeEnabled ? "enabled" : "off"}</span>
                    <span>profile</span>
                    <span>{sharedLatticeState?.profileTag ?? "preview"}</span>
                    <span>preset</span>
                    <span>{sharedLatticeState?.preset ?? "auto"}</span>
                    <span>frame</span>
                    <span>
                      {latticeFrameStats
                        ? `${latticeFrameStats.dims.join("x")} @ ${latticeFrameStats.voxelSize_m.toFixed(3)} m`
                        : "—"}
                    </span>
                    <span>voxels</span>
                    <span>
                      {latticeFrameStats
                        ? `${latticeFrameStats.voxelCount.toLocaleString()}${
                            latticeFrameStats.budgetMaxVoxels
                              ? ` / ${latticeFrameStats.budgetMaxVoxels.toLocaleString()}`
                              : ""
                          }${latticeFrameStats.budgetPct != null ? ` (${latticeFrameStats.budgetPct.toFixed(1)}%)` : ""}`
                        : "—"}
                    </span>
                    <span>frame clamp</span>
                    <span>
                      {latticeFrameStats?.clampReasons?.length ? latticeFrameStats.clampReasons.join(", ") : "—"}
                    </span>
                    <span>volume</span>
                    <span>{latticeVolumeStats ? latticeVolumeStats.label : "—"}</span>
                    <span>volume clamp</span>
                    <span>
                      {sharedLatticeState?.volume?.clampReasons?.length
                        ? sharedLatticeState.volume.clampReasons.join(", ")
                        : "—"}
                    </span>
                    <span>upload bytes</span>
                    <span>
                      {latticeUploadTelemetry
                        ? `${(latticeUploadTelemetry.bytes / (1024 * 1024)).toFixed(1)} MB / ${(
                            latticeUploadTelemetry.budgetBytes / (1024 * 1024)
                          ).toFixed(0)} MB`
                        : "—"}
                    </span>
                    <span>watchdog</span>
                    <span>{`${latticeWatchdogStats.blocked} block${latticeWatchdogStats.blocked === 1 ? "" : "s"}`}</span>
                    <span>sdf</span>
                    <span>{latticeSdfStats ? latticeSdfStats.label : "—"}</span>
                    <span>sdf clamp</span>
                    <span>
                      {sharedLatticeState?.sdf?.clampReasons?.length ? sharedLatticeState.sdf.clampReasons.join(", ") : "—"}
                    </span>
                    <span>strobe</span>
                    <span>
                      {sharedLatticeState?.strobe?.hash ? sharedLatticeState.strobe.hash.slice(0, 16) : "—"}
                    </span>
                    <span>weights hash</span>
                    <span>
                      {sharedLatticeState?.strobe?.weightHash ? sharedLatticeState.strobe.weightHash : "—"}
                    </span>
                    <span>volume hash</span>
                    <span>{sharedLatticeState?.volume?.hash ? sharedLatticeState.volume.hash.slice(0, 16) : "—"}</span>
                    <span>volume det</span>
                    <span>{latticeVolumeDeterminismHash ?? "—"}</span>
                    <span>sdf det</span>
                    <span>{latticeSdfDeterminismHash ?? "—"}</span>
                    <span>fallback</span>
                    <span>{latticeFallbackStatus?.reason ?? "ok"}</span>
                    <span>path</span>
                    <span>
                      {latticeGpuStatus?.runtime
                        ? latticeGpuStatus.runtime.hasLatticeVolume
                          ? `lattice ${latticeGpuStatus.runtime.formatLabel ?? latticeGpuStatus.runtime.backend ?? ""}${
                              latticeGpuStatus.runtime.useAtlas ? " (atlas)" : ""
                            }`
                          : "analytic"
                        : "—"}
                    </span>
                    <span>gl caps</span>
                    <span>
                      {latticeGpuStatus?.caps
                        ? `3D ${latticeGpuStatus.caps.max3DTextureSize} | 2D ${latticeGpuStatus.caps.maxTextureSize} | f32lin ${
                            latticeGpuStatus.caps.supportsFloatLinear ? "y" : "n"
                          } | f16lin ${latticeGpuStatus.caps.supportsHalfFloatLinear ? "y" : "n"}`
                        : "—"}
                    </span>
                    <span>gpu reason</span>
                    <span>
                      {latticeGpuStatus?.volumeFailedReason || latticeGpuStatus?.sdfFailedReason
                        ? `${latticeGpuStatus.volumeFailedReason ?? ""}${
                            latticeGpuStatus.sdfFailedReason ? ` / ${latticeGpuStatus.sdfFailedReason}` : ""
                          }`
                        : latticeGpuStatus?.runtime?.formatReason ||
                            ((latticeGpuStatus as any)?.runtime?.telemetry?.downgradeReason ?? "—")}
                    </span>
                    <span>gpu</span>
                    <span>
                      {latticeGpuStatus
                        ? `${latticeGpuStatus.volumeFailed ? "VOL fail" : latticeGpuStatus.volumeReady ? "VOL ok" : "VOL pending"}${
                            latticeRequireSdf
                              ? ` / ${latticeGpuStatus.sdfFailed ? "SDF fail" : latticeGpuStatus.sdfReady ? "SDF ok" : "SDF pending"}`
                              : ""
                          }`
                        : "—"}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">Volume field</span>
                <VolumeModeToggle value={liveVolumeMode} onChange={handleVolumeModeChange} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">Domain</span>
                <button
                  type="button"
                  onClick={() => setHullVolumeDomain("wallBand")}
                  className={cn(
                    "rounded px-2 py-1 text-[0.65rem]",
                    hullVolumeDomain === "wallBand" ? "bg-emerald-700 text-white" : "bg-slate-700 text-slate-200"
                  )}
                  title="Current wall band transfer function with adaptive step near the shell"
                >
                  Wall band
                </button>
                <button
                  type="button"
                  onClick={() => setHullVolumeDomain("bubbleBox")}
                  className={cn(
                    "rounded px-2 py-1 text-[0.65rem]",
                    hullVolumeDomain === "bubbleBox" ? "bg-emerald-700 text-white" : "bg-slate-700 text-slate-200"
                  )}
                  title="Full bubble box using analytic theta_drive with OBB padding"
                >
                  Bubble box
                </button>
                {hullVolumeDomain === "bubbleBox" && (
                  <>
                    <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                      <span>Bounds</span>
                      <select
                        value={bubbleBoundsMode}
                        onChange={(event) => setBubbleBoundsMode(event.target.value as "tight" | "wide")}
                        className="rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100"
                      >
                        <option value="tight">Tight OBB</option>
                        <option value="wide">Wide OBB</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                      <span>Opacity</span>
                      <input
                        type="range"
                        min={0.08}
                        max={1.0}
                        step={0.01}
                        value={bubbleOpacityHi}
                        onChange={(event) => setBubbleOpacityHi(Number(event.target.value))}
                        className="w-28 accent-amber-500"
                      />
                      <span className="font-mono text-[0.65rem] text-slate-300">
                        [{bubbleOpacityWindow[0].toFixed(2)}…{bubbleOpacityWindow[1].toFixed(2)}]
                      </span>
                    </label>
                    <span className="text-[0.6rem] text-slate-400">
                      Slices stay available as a bailout if volume perf dips.
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">Card camera</span>
                <button
                  type="button"
                  onClick={() => setCardCameraPreset("threeQuarterFront")}
                  className={cn(
                    "rounded px-2 py-1 text-[0.65rem]",
                    cardCameraPreset === "threeQuarterFront" ? "bg-emerald-700 text-white" : "bg-slate-700 text-slate-200"
                  )}
                  title="Three-quarter front orbit anchored to the hull OBB (card default)"
                >
                  3/4 front
                </button>
                <button
                  type="button"
                  onClick={() => setCardCameraPreset("broadside")}
                  className={cn(
                    "rounded px-2 py-1 text-[0.65rem]",
                    cardCameraPreset === "broadside" ? "bg-emerald-700 text-white" : "bg-slate-700 text-slate-200"
                  )}
                  title="Profile view aligned to the hull right axis"
                >
                  Broadside
                </button>
                <button
                  type="button"
                  onClick={() => setCardCameraPreset("topDown")}
                  className={cn(
                    "rounded px-2 py-1 text-[0.65rem]",
                    cardCameraPreset === "topDown" ? "bg-emerald-700 text-white" : "bg-slate-700 text-slate-200"
                  )}
                  title="Top-down orbit over the hull OBB"
                >
                  Top-down
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">Geometry</span>
                <select
                  className="rounded bg-slate-900 px-2 py-1 text-[0.7rem] text-slate-100"
                  value={hullGeometry}
                  onChange={(e) => handleHullGeometryChange(e.target.value as HullGeometryMode)}
                  title="Switch between analytic ellipsoid, radial LUT, or uploaded SDF."
                >
                  <option value="ellipsoid">Ellipsoid</option>
                  <option value="radial">Hull (radial)</option>
                  <option value="sdf">Hull (SDF)</option>
                </select>
                {autoHullGeometryReason ? (
                  <span className="rounded-full border border-emerald-300/40 bg-emerald-400/10 px-2 py-1 text-[0.65rem] text-emerald-100">
                    {autoHullGeometryReason}
                  </span>
                ) : null}
                {!hullRadiusLUT && hullGeometry === "radial" && (
                  <span className="text-[0.6rem] text-amber-300">No hull LUT found — falling back to ellipsoid</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">Mode</span>
                <button
                  type="button"
                  onClick={() => handleHullBlendChange(0)}
                  className={cn(
                    "rounded px-2 py-1 text-[0.65rem]",
                    hullMode === "instant" ? "bg-amber-600 text-white" : "bg-slate-700 text-slate-200"
                  )}
                >
                  Instant
                </button>
                <button
                  type="button"
                  onClick={() => handleHullBlendChange(1)}
                  className={cn(
                    "rounded px-2 py-1 text-[0.65rem]",
                    hullMode === "average" ? "bg-amber-600 text-white" : "bg-slate-700 text-slate-200"
                  )}
                >
                  Average
                </button>
                <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                  <span>Blend</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={Number.isFinite(hullBlend) ? hullBlend : 0}
                    onChange={(event) => handleHullBlendChange(Number(event.target.value))}
                    className="w-28 accent-amber-500"
                  />
                  <span className="font-mono text-[0.65rem] text-slate-300">{Math.round(hullBlend * 100)}%</span>
                </label>
              </div>
              <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                <span>Exposure</span>
                <input
                  title="Multiply volumetric density (0.01×..100×). Useful to quickly brighten the Hull 3D volume for debugging."
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={hullExposure01}
                  onChange={(e)=> setHullExposure01(Number(e.target.value))}
                  className="w-28 accent-amber-500"
                />
                <span className="font-mono text-[0.65rem] text-slate-300">{(() => {
                  const x = Math.max(0, Math.min(1, hullExposure01));
                  const mult = Math.pow(10, 4 * (x - 0.5));
                  const label = mult >= 1 ? `×${mult.toFixed(mult >= 10 ? 0 : 1)}` : `×${mult.toFixed(mult >= 0.1 ? 2 : 3)}`;
                  return label;
                })()}</span>
              </label>
              <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                <input
                  type="checkbox"
                  className="accent-amber-500"
                  checked={showHullSectorRing}
                  onChange={(event) => setShowHullSectorRing(event.target.checked)}
                />
                Sector ring
              </label>
              <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                <input
                  type="checkbox"
                  className="accent-amber-500"
                  checked={followHullPhase}
                  onChange={(event) => setFollowHullPhase(event.target.checked)}
                />
                Follow phase
              </label>
              <FlightDirectorStatusRow />
              <label className="flex items-center gap-1 text-[0.65rem] text-slate-200">
                <input
                  type="checkbox"
                  className="accent-emerald-500"
                  checked={vizIntentEnabled}
                  onChange={(event) => setVizIntentEnabled(event.target.checked)}
                />
                Show off-axis intent
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Run Hull 3D self-test"
                  onClick={() => {
                    try {
                      const r = hullRendererRef.current?.runHull3DHealthCheck?.();
                      if (!r) {
                        setHullHealth(null);
                        return;
                      }
                      let pass = 0, fail = 0;
                      for (const k of Object.keys(r)) {
                        if (r[k]?.pass) pass++; else fail++;
                      }
                      setHullHealth({ pass, fail, results: r as any });
                    } catch (e) {
                      console.warn('[AlcubierrePanel] Hull3D health check failed:', e);
                      setHullHealth(null);
                    }
                  }}
                  className="rounded bg-slate-700 px-2 py-1 text-[0.65rem] text-slate-100 hover:bg-slate-600"
                >
                  Self-test
                </button>
                {hullHealth && (
                  <span className={cn(
                    "rounded px-2 py-1 text-[0.65rem]",
                    hullHealth.fail > 0 ? "bg-amber-800/70 text-amber-100" : "bg-emerald-800/70 text-emerald-100"
                  )}>
                    {hullHealth.pass} pass · {hullHealth.fail} fail
                  </span>
                )}
                {latticeModeEnabled && latticeFrameStats && (
                  <span className="rounded bg-slate-800/70 px-2 py-1 text-[0.65rem] text-slate-200">
                    Lattice {latticeFrameStats.dims.join("x")} Aú {latticeFrameStats.voxelSize_m.toFixed(3)} m
                  </span>
                )}
                {latticeModeEnabled && latticeVolumeStats && (
                  <span className="rounded bg-slate-800/70 px-2 py-1 text-[0.65rem] text-slate-200">
                    {latticeVolumeStats.label}
                  </span>
                )}
                {latticeModeEnabled && latticeSdfStats && (
                  <span className="rounded bg-slate-800/70 px-2 py-1 text-[0.65rem] text-slate-200">
                    {latticeSdfStats.label}
                  </span>
                )}
                {hullDiagMsg && (
                  <span className="rounded bg-amber-900/60 px-2 py-1 text-[0.65rem] text-amber-200">
                    {hullDiagMsg}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">Quality</span>
                <select
                  value={hullQuality}
                  onChange={(event) => setHullQuality(event.target.value as Hull3DQualityPreset)}
                  className="rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100"
                >
                  <option value="auto">Auto</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button
                  type="button"
                  onClick={() => setHullQualityAdvanced((prev) => !prev)}
                  className="rounded border border-slate-600 px-2 py-1 text-[0.65rem] text-slate-200 hover:border-amber-400 hover:text-amber-200"
                >
                  {hullQualityAdvanced ? "Hide advanced" : "Advanced"}
                </button>
              </div>
              {hullQualityAdvanced && (
                <div className="flex w-full flex-wrap items-center gap-3 text-[0.65rem] text-slate-200">
                  <label className="flex items-center gap-1">
                    <span>Voxel density</span>
                    <select
                      value={hullVoxelDensity}
                      onChange={(event) => setHullVoxelDensity(event.target.value as "low" | "medium" | "high")}
                      className="rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-1">
                    <span>Ray steps max</span>
                    <input
                      type="number"
                      min={16}
                      step={4}
                      value={hullRayStepsMax ?? ""}
                      placeholder="auto"
                      onChange={(event) => {
                        const raw = event.target.value.trim();
                        if (!raw.length) {
                          setHullRayStepsMax(null);
                          return;
                        }
                        const next = Number(raw);
                        setHullRayStepsMax(Number.isFinite(next) && next > 0 ? next : null);
                      }}
                      className="w-20 rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100"
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    <span>Step bias</span>
                    <input
                      type="number"
                      step={0.01}
                      value={hullStepBias ?? ""}
                      placeholder="auto"
                      onChange={(event) => {
                        const raw = event.target.value.trim();
                        if (!raw.length) {
                          setHullStepBias(null);
                          return;
                        }
                        const next = Number(raw);
                        setHullStepBias(Number.isFinite(next) ? next : null);
                      }}
                      className="w-20 rounded bg-slate-900 px-2 py-1 text-[0.65rem] text-slate-100"
                    />
                  </label>
                </div>
              )}
            </div>
          )}
          </div>
        </TooltipProvider>

        {/* Viewer fills the remaining fixed-height space and remains stable */}
        <div className="relative w-full flex-1 min-h-0 rounded-lg overflow-hidden border border-slate-800 bg-black/70">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0"
            style={{
              opacity: overlayCanvasVisible ? 1 : 0,
              pointerEvents: overlayHudEnabled ? "auto" : "none",
            }}
          />
          <div
            ref={overlayDomRef}
            className="absolute inset-0"
            style={{
              pointerEvents: overlayHudEnabled ? "auto" : "none",
              userSelect: overlayHudEnabled ? "text" : "none",
            }}
            aria-hidden="true"
          />
          {latticeModeEnabled ? (
            <div className="pointer-events-none absolute right-2 top-2 flex flex-col items-end gap-1 text-[0.65rem]">
              <div className="flex flex-wrap items-center gap-1">
                <span
                  className={cn("rounded px-2 py-1 shadow-md shadow-black/40", latticePathBadge.className)}
                  title={latticePathBadge.title}
                >
                  {latticePathBadge.text}
                </span>
                {latticeDowngradeBadge ? (
                  <span
                    className={cn("rounded px-2 py-1 shadow-md shadow-black/40", latticeDowngradeBadge.className)}
                    title={latticeDowngradeBadge.title}
                  >
                    {latticeDowngradeBadge.text}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <span
                  className={cn("rounded px-2 py-1 shadow-md shadow-black/40", latticeCoverageBadge.className)}
                  title={latticeCoverageBadge.title}
                >
                  {latticeCoverageBadge.text}
                </span>
                {latticeFallbackStatus && latticeFallbackStatus.reason !== "disabled" ? (
                  <span
                    className={cn(
                      "rounded px-2 py-1 shadow-md shadow-black/40",
                      latticeFallbackStatus.level === "error"
                        ? "bg-red-500/80 text-red-50"
                        : latticeFallbackStatus.level === "warn"
                          ? "bg-amber-500/80 text-amber-50"
                          : "bg-slate-800/80 text-slate-100",
                    )}
                    title={[latticeFallbackStatus.reason, latticeFallbackStatus.hint, latticeFallbackStatus.detail]
                      .filter(Boolean)
                      .join(" | ")}
                  >
                    {latticeFallbackStatus.label}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        {planarVizMode === 2 && (
          <div className="pointer-events-none absolute top-2 left-2 w-14 h-14 rounded-full border border-emerald-700/60 bg-slate-900/30">
            <div
              className="absolute left-1/2 top-1/2 w-[2px] h-6 bg-emerald-400 origin-bottom"
              style={{ transform: `translate(-50%, -100%) rotate(${(sectorCenter01*360).toFixed(3)}deg)` }}
              title="Sector center"
            />
            {ds.splitEnabled && (
              <div
                className="absolute left-1/2 top-1/2 w-[2px] h-4 bg-emerald-300/70 origin-bottom"
                style={{ transform: `translate(-50%, -100%) rotate(${(((sectorCenter01+0.5)%1)*360).toFixed(3)}deg)` }}
                title="Secondary lobe"
              />
            )}
          </div>
        )}
        {glError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 px-6 text-center">
            <div className="max-w-sm space-y-2">
              <p className="text-sm font-semibold text-red-200">Shader pipeline offline</p>
              <p className="text-xs text-slate-200">
                {glError}
              </p>
              <p className="text-[0.65rem] text-slate-400">
                Check the console for detailed GLSL compile/link logs. Toggle â€œSafe shaderâ€ to keep the viewer responsive while investigating.
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  </CurvatureVoxProvider>
  );
}

