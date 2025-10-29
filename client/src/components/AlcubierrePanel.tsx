import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEnergyPipeline } from "@/hooks/use-energy-pipeline";
import { useLightCrossingLoop } from "@/hooks/useLightCrossingLoop";
import { useDriveSyncStore } from "@/store/useDriveSyncStore";
import { useHull3DSharedStore } from "@/store/useHull3DSharedStore";
import { shallow } from "zustand/shallow";
import { VolumeModeToggle, type VolumeViz } from "@/components/VolumeModeToggle";
import { subscribe, unsubscribe } from "@/lib/luma-bus";
import { Hull3DRenderer, Hull3DRendererMode, Hull3DQualityPreset, Hull3DQualityOverrides, Hull3DRendererState, Hull3DVolumeViz, Hull3DOverlayState } from "./Hull3DRenderer.ts";
import { CurvatureVoxProvider } from "./CurvatureVoxProvider";
import { smoothSectorWeights } from "@/lib/sector-weights";

interface AlcubierrePanelProps {
  className?: string;
  onCanvasReady?: (
    canvas: HTMLCanvasElement | null,
    overlayCanvas?: HTMLCanvasElement | null,
    overlayDom?: HTMLDivElement | null
  ) => void;
  overlayHudEnabled?: boolean;
  onPlanarVizModeChange?: (mode: number) => void;
}

// === helpers: math & smoothing =================================================
const clamp = (x: number, a = -Infinity, b = Infinity) => Math.max(a, Math.min(b, x));
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
  const cands = [Number(live?.shipBeta), Number(live?.vShip), Number(live?.beta)];
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
}: {
  surfaceOn: boolean;
  setSurfaceOn: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [ringOn, setRingOn] = useState<boolean>(() => {
    const w: any = (typeof window !== "undefined") ? window : {};
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

  const [planarVizMode, setPlanarVizMode] = useState<VizMode>(0); // 0 Î¸_GR, 1 Ï_GR, 2 Î¸_Drive
  useEffect(() => {
    onPlanarVizModeChange?.(planarVizMode);
  }, [planarVizMode, onPlanarVizModeChange]);
  const [shaderMode, setShaderMode] = useState<ShaderMode>("main");
  const [glError, setGlError] = useState<string | null>(null);
  // Track if the user has manually selected a planarVizMode so we don't override later
  const [userVizLocked, setUserVizLocked] = useState(false);
  const [syncScheduler, setSyncScheduler] = useState(true);
const [hullMode, setHullMode] = useState<Hull3DRendererMode>("instant");
const [hullBlend, setHullBlend] = useState(0);
const [hullVolumeVizLive, setHullVolumeVizLive] = useState<Hull3DVolumeViz>("theta_drive");
const [showHullSectorRing, setShowHullSectorRing] = useState(true);
const [showHullSurfaceOverlay, setShowHullSurfaceOverlay] = useState<boolean>(() => {
  if (typeof window === "undefined") return true;
  const w: any = window;
  if (typeof w.__hullShowSurfaceOverlay === "boolean") return !!w.__hullShowSurfaceOverlay;
  return true;
});
const [showHullGhostSlice, setShowHullGhostSlice] = useState(false);
const [followHullPhase, setFollowHullPhase] = useState(true);
const ONE_G_MS2 = 9.80665;
const [betaOverlayEnabled, setBetaOverlayEnabled] = useState(false);
const [betaTargetMs2, setBetaTargetMs2] = useState(ONE_G_MS2);
const [betaComfortMs2, setBetaComfortMs2] = useState(0.4 * ONE_G_MS2);
const [showKHeatOverlay, setShowKHeatOverlay] = useState(true);
const [showThetaIsoOverlay, setShowThetaIsoOverlay] = useState(true);
const [showFordRomanBar, setShowFordRomanBar] = useState(true);
const [showSectorArcOverlay, setShowSectorArcOverlay] = useState(true);
const [showTiltOverlay, setShowTiltOverlay] = useState(false);
const [showGreensOverlay, setShowGreensOverlay] = useState(false);
const [curvatureOverlay, setCurvatureOverlay] = useState({
  enabled: false,
  gain: 1.0,
  alpha: 0.45,
  palette: 0,
  showQIMargin: false,
});
useEffect(() => {
  const id = subscribe("hull3d:overlay:curvature", (payload: any) => {
    if (!payload || typeof payload !== "object") return;
    setCurvatureOverlay((prev) => {
      const enabled = Boolean((payload as any).enabled);
      const gainRaw = Number((payload as any).gain);
      const alphaRaw = Number((payload as any).alpha);
      const paletteRaw = Number((payload as any).palette);
      const showMarginRaw = (payload as any).showQIMargin;
      return {
        enabled,
        gain: Number.isFinite(gainRaw) ? gainRaw : prev.gain,
        alpha: Number.isFinite(alphaRaw) ? Math.max(0, Math.min(1, alphaRaw)) : prev.alpha,
        palette: Number.isFinite(paletteRaw) ? Math.max(0, Math.floor(paletteRaw)) : prev.palette,
        showQIMargin: Boolean(showMarginRaw),
      };
    });
  });
  return () => {
    unsubscribe(id);
  };
}, []);

const liveVolumeMode = useMemo(() => volumeModeFromHull(hullVolumeVizLive), [hullVolumeVizLive]);
const setLiveVolumeMode = useCallback((mode: VolumeViz) => {
  const nextHull = hullVizFromVolumeMode(mode);
  setHullVolumeVizLive((prev) => (prev === nextHull ? prev : nextHull));
}, []);
const handleVolumeModeChange = useCallback((mode: VolumeViz) => {
  setLiveVolumeMode(mode);
}, [setLiveVolumeMode]);
const setSharedPhase = useHull3DSharedStore((s) => s.setPhase);
const setSharedSampling = useHull3DSharedStore((s) => s.setSampling);
const setSharedPhysics = useHull3DSharedStore((s) => s.setPhysics);
const setSharedCompliance = useHull3DSharedStore((s) => s.setCompliance);
const setSharedSector = useHull3DSharedStore((s) => s.setSector);
const setSharedPalette = useHull3DSharedStore((s) => s.setPalette);
const sharedHullState = useHull3DSharedStore(
  (s) => ({
    phase: s.phase,
    sampling: s.sampling,
    physics: s.physics,
    compliance: s.compliance,
    sector: s.sector,
    palette: s.palette,
  }),
  shallow
);
const sharedPhase = sharedHullState.phase;
const sharedSampling = sharedHullState.sampling;
const sharedPhysicsState = sharedHullState.physics;
const sharedComplianceState = sharedHullState.compliance;
const sharedSectorState = sharedHullState.sector;
const sharedPaletteState = sharedHullState.palette;
const sharedPhysicsLock = useHull3DSharedStore((s) => s.physics.locked);
const toggleSharedPhysicsLock = useHull3DSharedStore((s) => s.togglePhysicsLock);
const trimSharedPhysicsDb = useHull3DSharedStore((s) => s.trimPhysicsDb);
const showSectorGridOverlay = useHull3DSharedStore(
  (s) => s.overlays.sectorGrid3D.enabled
);

useEffect(() => {
  if (typeof window !== "undefined") {
    (window as any).__hullShowSurfaceOverlay = showHullSurfaceOverlay;
  }
}, [showHullSurfaceOverlay]);
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
  const [hullQuality, setHullQuality] = useState<Hull3DQualityPreset>("auto");
  const [hullVoxelDensity, setHullVoxelDensity] = useState<"low" | "medium" | "high">("high");
  const [hullRayStepsMax, setHullRayStepsMax] = useState<number | null>(null);
  const [hullStepBias, setHullStepBias] = useState<number | null>(null);
  const [hullQualityAdvanced, setHullQualityAdvanced] = useState(false);
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

  const view = useMemo(() => ((live as any)?.view ?? {}), [live]);

  const bubbleStatus = useMemo(() => {
    const raw = (live as any)?.overallStatus;
    if (raw === "CRITICAL" || raw === "WARNING" || raw === "NOMINAL") {
      return raw as "CRITICAL" | "WARNING" | "NOMINAL";
    }
    return undefined;
  }, [live]);

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
  const R     = useMemo(() => 1.0, []);

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
    const base = Math.max(1 / totalSectors, liveSectors / totalSectors);
    return Math.max(base, dutyFR);
  }, [totalSectors, liveSectors, dutyFR]);

  // sector "boost" term (visibility of a single active arc): âˆš(w/f)
  const boostWF = useMemo(() => Math.sqrt(Math.max(1e-12, 1 / fActive)), [fActive]);

  // Viewer axes (hull aspect)
  const axes = useMemo(
    () => [fnum(live?.hull?.a, 1), fnum(live?.hull?.b, 1), fnum(live?.hull?.c, 1)] as [number,number,number],
    [live]
  );

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

  useEffect(() => {
    const handlePhase = (payload: any) => {
      const phaseRaw = Number(payload?.phase01);
      if (!Number.isFinite(phaseRaw)) return;
      const wrapped = ((phaseRaw % 1) + 1) % 1;
      const cont = Number(payload?.phaseCont);
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
        phaseCont: Number.isFinite(cont) ? cont : wrapped,
        sign: signRaw === -1 ? -1 : 1,
        wedgeIndex,
        nextWedgeIndex: nextIndex,
      });
    };
    const stableId = subscribe("warp:phase:stable", handlePhase);
    const legacyId = subscribe("warp:phase", handlePhase);
    return () => {
      if (stableId) unsubscribe(stableId);
      if (legacyId) unsubscribe(legacyId);
    };
  }, [setSharedPhase, totalSectors]);

  useEffect(() => {
    if (followHullPhase) return;
    const total = Math.max(1, loopSectorCount);
    const phaseCycle = loopSectorIdx + loopPhase;
    const phase01 = ((phaseCycle / total) % 1 + 1) % 1;
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
      phase01,
      phaseCont: phaseCycle,
      sign: 1,
      wedgeIndex: ((loopSectorIdx % total) + total) % total,
      nextWedgeIndex: ((loopSectorIdx + 1) % total + total) % total,
      dutyWindow: [windowStart, windowEnd],
      damp: 0.15,
    });
  }, [setSharedPhase, loopSectorCount, loopSectorIdx, loopPhase, lightLoop.dwell_ms, lightLoop.burst_ms, followHullPhase]);

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
    };

    const epsilonTilt = firstFinite(
      (live as any)?.epsilonTilt,
      (live as any)?.shiftVector?.epsilonTilt,
      (live as any)?.warp?.epsilonTilt
    );
    const rawTilt = ((live as any)?.betaTiltVec
      ?? (live as any)?.shiftVector?.betaTiltVec
      ?? (live as any)?.warp?.betaTiltVec) as number[] | undefined;
    if (showTiltOverlay && Number.isFinite(epsilonTilt) && rawTilt && rawTilt.length === 3) {
      const dir2: [number, number] = [rawTilt[0] || 0, rawTilt[1] || 0];
      const len = Math.hypot(dir2[0], dir2[1]) || 1;
      overlays.tilt = {
        enabled: true,
        dir: [dir2[0] / len, dir2[1] / len],
        magnitude: Math.min(1, Math.abs(epsilonTilt) / 5e-7),
        alpha: 0.85,
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
  ]);

  const syncMode = useMemo(() => (syncScheduler && schedulerCenter !== null ? 1 : 0), [syncScheduler, schedulerCenter]);

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


  // --- track canvas aspect so camera fits accurately
  const [aspect, setAspect] = useState(16/9);

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
    const domainScale = R * 1.3;
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
  }, [planarVizMode, beta, sigma, R, axes, res]);

  const rhoField_GR = useMemo(() => {
    if (planarVizMode !== 1) return null;
    const nx = res, ny = res;
    const field = new Float32Array(nx * ny);
    const domainScale = R * 1.3;
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
  }, [planarVizMode, beta, sigma, R, axes, res]);

  // Optional contrast boost for sector visibility; >1 exaggerates lumps a bit
  const lumpBoostExp = useMemo(() => {
    const v = Number((live as any)?.view?.lumpBoostExp);
    return Number.isFinite(v) && v > 0 ? v : 1.25;
  }, [live]);

  const thetaField_Drive = useMemo(() => {
    if (planarVizMode !== 2) return null;
    const nx = res, ny = res;
    const field = new Float32Array(nx * ny);
    const twoPi = 2 * Math.PI;
    const domainScale = R * 1.3;
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
  }, [planarVizMode, beta, sigma, R, ampChain, gate, fActive, axes, res, lumpBoostExp, driveWeightAt, ds.phase01]);

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
  const [lockScale, setLockScale] = useState<boolean>(true);
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

  // Horizontal half-extent with axes scaling (geometry scaled by R*1.3*axes)
  const halfX = R * 1.3 * (axes[0] || 1);
  const halfZ = R * 1.3 * (axes[2] || 1);
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
  }, [aspect, R, targetHalf, heightFitBias, eyeYScale, eyeYBase, axes, yGain, thetaMax, thetaMin, centerPlane]);

  // === Dynamic param refs (decouple GL init from frequent pipeline changes) ===
  const dynRef = useRef({
    axes: [1,1,1] as [number,number,number],
    sigma: 6,
  R: 1,
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
  });

  // Immediate priming (so first frame doesn't see zeroed MVP/uniforms)
  dynRef.current.axes = axes;
  dynRef.current.sigma = sigma;
  dynRef.current.R = R;
  dynRef.current.beta = beta;
  dynRef.current.planarVizMode = planarVizMode;
  dynRef.current.volumeViz = hullVolumeVizLive;
  dynRef.current.ampChain = ampChain;
  dynRef.current.gate = gateRaw;
  dynRef.current.gateView = gate;
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

  useEffect(()=>{
    dynRef.current.axes = axes;
    dynRef.current.sigma = sigma;
    dynRef.current.R = R;
    dynRef.current.beta = beta;
    dynRef.current.planarVizMode = planarVizMode;
    dynRef.current.volumeViz = hullVolumeVizLive;
    dynRef.current.ampChain = ampChain;
    dynRef.current.gate = gateRaw;
    dynRef.current.gateView = gate;
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
  const hullDimsEffect: [number, number, number] = [
    Math.max(Math.abs(axes[0]) * R * 2, 1e-3),
    Math.max(Math.abs(axes[1]) * R * 2, 1e-3),
    Math.max(Math.abs(axes[2]) * R * 2, 1e-3),
  ];
  dynRef.current.hullDims = hullDimsEffect;
  dynRef.current.betaOverlayEnabled = betaOverlayEnabled;
  dynRef.current.betaTarget_ms2 = betaTargetMs2;
  dynRef.current.comfort_ms2 = betaComfortMs2;
  dynRef.current.betaUniform_ms2 = betaTargetMs2;
  dynRef.current.betaTexture = null;
  dynRef.current.betaSampler = null;
  (dynRef.current as any).splitEnabled = ds.splitEnabled ? 1 : 0;
  (dynRef.current as any).splitFrac = ds.splitFrac;
  }, [axes, sigma, R, beta, planarVizMode, hullVolumeVizLive, ampChain, gate, dutyFR, yGainFinal, yBias, kColor, mvp, totalSectors, liveSectors, lumpBoostExp, sectorCenter01, gaussianSigma, ds.sectorFloor, syncMode, ds.phase01, showHullSurfaceOverlay, betaOverlayEnabled, betaTargetMs2, betaComfortMs2, ds.splitEnabled, ds.splitFrac]);

  useEffect(() => {
    const hullDimsBase: [number, number, number] = [
      Math.max(Math.abs(axes[0]) * R * 2, 1e-3),
      Math.max(Math.abs(axes[1]) * R * 2, 1e-3),
      Math.max(Math.abs(axes[2]) * R * 2, 1e-3),
    ];
    const base: Hull3DRendererState = {
      axes,
      R,
      sigma,
      beta,
      ampChain,
      gate: gateRaw,
      gateView: gate,
      vizFloorThetaGR: vizFloors.thetaGR,
      vizFloorRhoGR: vizFloors.rhoGR,
      vizFloorThetaDrive: vizFloors.thetaDrive,
      fActive,
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
      showGhostSlice: showHullGhostSlice,
      showSurfaceOverlay: showHullSurfaceOverlay,
      betaOverlayEnabled,
      betaTarget_ms2: betaTargetMs2,
      comfort_ms2: betaComfortMs2,
      betaUniform_ms2: betaTargetMs2,
      hullDims: hullDimsBase,
      betaTexture: null,
      betaSampler: null,
      followPhase: followHullPhase,
      volumeViz: hullVolumeVizLive,
      blendFactor: hullBlend,
      freeze: bubbleStatus === "CRITICAL",
      timeSec: 0,
      bubbleStatus,
      aspect,
      overlays: overlayConfig,
    };
    hullStateRef.current = base;
  }, [axes, R, sigma, beta, ampChain, gate, gateRaw, dutyFR, gaussianSigma, sectorCenter01, totalSectors, liveSectors, ds.sectorFloor, lumpBoostExp, ds.splitEnabled, ds.splitFrac, syncMode, ds.phase01, showHullSectorRing, showHullGhostSlice, showHullSurfaceOverlay, betaOverlayEnabled, betaTargetMs2, betaComfortMs2, followHullPhase, hullVolumeVizLive, hullBlend, bubbleStatus, aspect, vizFloors.thetaGR, vizFloors.rhoGR, vizFloors.thetaDrive, overlayConfig, sharedPhase, sharedSampling, sharedPhysicsState, sharedComplianceState, sharedSectorState, sharedPaletteState]);

  // When an operational mode that implies drive activity is set, default to Î¸(Drive)
  // once, unless the user has already picked a planarVizMode explicitly.
  useEffect(() => {
    if (userVizLocked) return;
    const m = String((live as any)?.currentMode || '').toLowerCase();
    const drivey = m === 'hover' || m === 'cruise' || m === 'emergency' || m === 'nearzero';
    if (drivey && planarVizMode !== 2) setPlanarVizMode(2);
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

    const renderer = new Hull3DRenderer(gl, cv, {
      quality: hullQuality,
      qualityOverrides: hullQualityOverridesRef.current,
      emaAlpha: 0.12,
    });
    renderer.setMode(hullConfigRef.current.mode, hullConfigRef.current.blend);
    renderer.setQuality(hullQuality, hullQualityOverridesRef.current);
    hullRendererRef.current = renderer;

    const resize = () => {
      const rect = cv.getBoundingClientRect();
      const w = Math.max(640, Math.floor(rect.width * devicePixelRatio));
      const h = Math.max(360, Math.floor(rect.height * devicePixelRatio));
      cv.width = w;
      cv.height = h;
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
      if (base) {
        const config = hullConfigRef.current;
        renderer.setMode(config.mode, config.blend);
        renderer.update({
          ...base,
          blendFactor: config.blend,
          timeSec: performance.now() / 1000,
        });
        renderer.draw();
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
      renderer.dispose();
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
      gateView: gate,
      thetaPkPos,
      span,
      sectorFloor: ds.sectorFloor,
      sigmaSectors: ds.sigmaSectors,
      syncScheduler,
      centerDeltaDeg,
    };
  }, [planarVizMode, ampChain, gateRaw, gate, thetaPkPos, thetaMax, thetaMin, ds.sectorFloor, ds.sigmaSectors, syncScheduler, centerDeltaDeg, ds]);

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
    setSharedPhysics({
      locked: lockScale,
      thetaExpected: expected,
      thetaUsed,
      ratio,
      yGain: yGainFinal,
      kColor,
      analyticPeak: Number.isFinite(ampRef ?? NaN) ? ampRef : undefined,
      tailPeak: Number.isFinite(thetaPk ?? NaN) ? thetaPk : undefined,
    });
  }, [setSharedPhysics, lockScale, yGainFinal, kColor, thetaScaleExpected, thetaDrive_est, ampRef, thetaPk]);

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

  const zetaBadgeData = useMemo(() => {
    const rawValue = Number((sharedComplianceState as any)?.zeta?.value);
    const rawLimit = Number((sharedComplianceState as any)?.zeta?.limit);
    const value = Number.isFinite(rawValue) ? rawValue : null;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : null;
    if (value === null || limit === null) {
      return {
        text: "zeta value/limit --",
        className: "bg-slate-800/70 text-slate-200",
        title: "Ford-Roman zeta compliance unavailable",
      };
    }
    const ratio = value / limit;
    const text = `zeta ${value.toPrecision(3)}/${limit.toPrecision(3)} | ${ratio.toFixed(2)}x`;
    let className = "bg-emerald-800/70 text-emerald-100";
    if (ratio >= 1) className = "bg-rose-800/80 text-rose-100";
    else if (ratio >= 0.9) className = "bg-amber-800/80 text-amber-100";
    return {
      text,
      className,
      title: `zeta=${value}, limit=${limit}, ratio=${ratio.toFixed(3)}`,
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

    const dimsValid =

      Array.isArray(axes) &&

      axes.length >= 3 &&

      axes.slice(0, 3).every((value: number) => Number.isFinite(Number(value)));

    const wallNum = Number(wallWidth_m);

    const wallValid = Number.isFinite(wallNum);

    if (!dimsValid && !wallValid) {

      return {

        text: "Hull --",

        className: undefined,

        title: "Hull dimensions unavailable",

      };

    }

    const dimsText = dimsValid

      ? `${Number(axes[0]).toFixed(1)}x${Number(axes[1]).toFixed(1)}x${Number(axes[2]).toFixed(1)} m`

      : "--";

    const wallText = wallValid ? `${wallNum.toFixed(3)} m` : "--";

    return {

      text: `Hull ${dimsText} | t_w ${wallText}`,

      className: undefined,

      title: `axes=${

        dimsValid ? `${Number(axes[0])}, ${Number(axes[1])}, ${Number(axes[2])}` : "--"

      }, wallWidth=${wallValid ? wallNum : "--"}`,

    };

  }, [axes, wallWidth_m]);

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
              <MetricTooltipBadge
                label="ampChain"
                value={driveDiag.ampChain.toExponential(2)}
                description="Product of Î³_geoÂ³, q, and Î³_VdB that scales the drive-mode York time response."
                className="bg-emerald-800/70 hover:bg-emerald-700/80"
              />
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
              className={cn("rounded px-2 py-1", lightCrossSummary.className)}
              title={lightCrossSummary.title}
            >
              {lightCrossSummary.text}
            </span>
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
            <span
              className={cn("rounded px-2 py-1", thetaScaleBadge.className)}
              title={thetaScaleBadge.title}
            >
              {thetaScaleBadge.text}
            </span>
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
            <div className="mt-3 grid grid-cols-2 gap-2 rounded bg-slate-800/40 px-3 py-2 text-[0.65rem] text-slate-200">
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
                  className="accent-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  checked={showTiltOverlay}
                  disabled={!betaOverlayEnabled}
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
                <div className="grid grid-cols-2 gap-3 text-[0.65rem] text-slate-300">
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
              <div className="flex items-center gap-2">
                <span className="text-[0.65rem] uppercase tracking-wide text-slate-400">Volume field</span>
                <VolumeModeToggle value={liveVolumeMode} onChange={handleVolumeModeChange} />
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
                  checked={showHullGhostSlice}
                  onChange={(event) => setShowHullGhostSlice(event.target.checked)}
                />
                Ghost slice
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
              opacity: overlayHudEnabled ? 1 : 0,
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










