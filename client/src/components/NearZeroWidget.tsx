import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MODE_CONFIGS, type ModeKey } from "@/hooks/use-energy-pipeline";
import { publish } from "@/lib/luma-bus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Activity, AlertTriangle, Gauge, Timer } from "lucide-react";

const SAMPLE_WINDOW_SEC = 30;
const SMOOTH_TAU_SEC = 5;
const HYSTERESIS_SEC = 5;
const MAX_CLOCK_SEC = 24 * 3600;
const EPSILON = 1e-6;
const GUARD_EPS = 1e-3;

const nearZeroConfig = MODE_CONFIGS.nearzero;

export interface HelixEnvMetrics {
  atmDensity_kg_m3?: number | null;
  altitude_m?: number | null;
}

export interface ThermalMetrics {
  P_diss_W?: number;
  Q_reject_W?: number;
  E_headroom_J?: number;
}

export interface NearZeroBusGuards {
  q: number;
  zeta: number;
  stroke_pm: number;
  TS: number;
}

export interface NearZeroBusClocks {
  TTA_s: number | null;
  TTR_s: number | null;
  TTA_bounded: boolean;
  TTR_bounded: boolean;
  TTA_reason: BoundReason;
  TTR_reason: BoundReason;
  limiter: "thermal" | "q" | "zeta" | "stroke" | "TS" | "none";
}

export type NearZeroAdvice = "ok" | "ease" | "dwell" | "drop";

export interface NearZeroEvent {
  mode: "nearzero";
  env: { rho?: number; vCap?: number; band: "pad" | "strat" | "vac" | "unknown" };
  split: number;
  guards: NearZeroBusGuards;
  clocks: NearZeroBusClocks;
  advice: NearZeroAdvice;
}

export type BoundReason = "telemetry" | "stable" | "improving" | "trend" | "limit";

type ChannelKey = "thermal" | "q" | "zeta" | "stroke" | "TS";

type GuardOrientation = "up" | "down";

type GuardThreshold = { amber: number; red: number };
type GuardsConfig = { q?: GuardThreshold; zeta?: GuardThreshold; stroke_pm?: GuardThreshold; TS?: GuardThreshold };

type Sample = {
  ts: number;
  guards: Partial<NearZeroBusGuards>;
};

type ChannelAssessment = {
  key: ChannelKey;
  amber: number;
  red: number;
  boundedAmber: boolean;
  boundedRed: boolean;
  reason: BoundReason;
  nearAmber: boolean;
};

type ClockState = {
  TTA: number;
  TTR: number;
  boundedTTA: boolean;
  boundedTTR: boolean;
  reasonTTA: BoundReason;
  reasonTTR: BoundReason;
  monitorTTA: boolean;
  monitorTTR: boolean;
  limiter: NearZeroBusClocks["limiter"];
  advice: NearZeroAdvice;
};

type AdvicePalette = Record<NearZeroAdvice, string>;

const DEFAULT_CLOCK_STATE: ClockState = {
  TTA: Infinity,
  TTR: Infinity,
  boundedTTA: false,
  boundedTTR: false,
  reasonTTA: "telemetry",
  reasonTTR: "telemetry",
  monitorTTA: false,
  monitorTTR: false,
  limiter: "none",
  advice: "ok",
};

const ADVICE_COLORS: AdvicePalette = {
  ok: "bg-emerald-500/10 text-emerald-300 border-emerald-400/30",
  ease: "bg-amber-500/10 text-amber-300 border-amber-400/30",
  dwell: "bg-amber-500/10 text-amber-300 border-amber-400/30",
  drop: "bg-rose-500/10 text-rose-300 border-rose-400/30",
};

const BADGE_COLORS = {
  green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/10 text-amber-300 border-amber-400/40",
  red: "bg-rose-500/10 text-rose-300 border-rose-500/30",
};

const CLOCK_COLORS = {
  green: "bg-emerald-500/10 text-emerald-200 border border-emerald-400/30",
  amber: "bg-amber-500/10 text-amber-200 border border-amber-400/40",
  red: "bg-rose-500/10 text-rose-200 border border-rose-500/30",
};

const REASON_LABEL: Record<BoundReason, string> = {
  telemetry: "telemetry",
  stable: "stable",
  improving: "improving",
  trend: "trending",
  limit: "limit",
};

type AggregatedDisplay = {
  value: number;
  bounded: boolean;
  reason: BoundReason;
  monitor: boolean;
  limiter: NearZeroBusClocks["limiter"];
};

type HysteresisSlot = {
  bounded: boolean;
  lastSwitch: number;
  display: AggregatedDisplay;
};

const DEFAULT_DISPLAY: AggregatedDisplay = {
  value: Infinity,
  bounded: false,
  reason: "telemetry",
  monitor: false,
  limiter: "none",
};

const createHysteresisSlot = (): HysteresisSlot => ({
  bounded: DEFAULT_DISPLAY.bounded,
  lastSwitch: 0,
  display: { ...DEFAULT_DISPLAY },
});

const NEAR_AMBER_THRESHOLDS = {
  q: 0.88,
  stroke: 44,
  TS: 110,
} as const;

export interface NearZeroWidgetProps {
  mode: ModeKey | string;
  env?: HelixEnvMetrics;
  nav?: { speed_mps?: number };
  guards: NearZeroBusGuards;
  thermal?: ThermalMetrics;
  frDuty?: number;
  QL?: number;
  burst?: { dwell_s?: number; frac?: number };
  tauLC_s?: number;
  split?: number;
  sectorsTotal?: number;
  onAction?: (action: "ease" | "dwell" | "drop") => void;
  className?: string;
}

function safeNumber(value: number | null | undefined): number | undefined {
  if (value == null) return undefined;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function clampClock(seconds: number): number {
  if (!Number.isFinite(seconds)) return Infinity;
  return Math.max(0, Math.min(MAX_CLOCK_SEC, seconds));
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "∞";
  const clamped = clampClock(seconds);
  if (clamped >= 3600) {
    const hours = Math.floor(clamped / 3600);
    const minutes = Math.floor((clamped % 3600) / 60);
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Format very small ON-times with adaptive units to avoid 0.0000 s rendering
function formatOnTime(seconds?: number): string {
  if (!Number.isFinite(seconds) || (seconds as number) < 0) return "—";
  const s = seconds as number;
  if (s >= 1) return `${s.toFixed(3)} s ON`;
  if (s >= 1e-3) return `${(s * 1e3).toFixed(3)} ms ON`;
  return `${(s * 1e6).toFixed(1)} µs ON`;
}

function formatTauLC(seconds?: number): string {
  if (!Number.isFinite(seconds) || (seconds as number) <= 0) return "—";
  const s = seconds as number;
  if (s >= 1) return `${s.toFixed(3)} s`;
  if (s >= 1e-3) return `${(s * 1e3).toFixed(3)} ms`;
  if (s >= 1e-6) return `${(s * 1e6).toFixed(1)} µs`;
  return `${(s * 1e9).toFixed(0)} ns`;
}

function formatPercentSmall(frac?: number): string {
  if (!Number.isFinite(frac)) return "—";
  const pct = (frac as number) * 100;
  if (pct >= 1) return `${pct.toFixed(2)}%`;
  if (pct >= 0.1) return `${pct.toFixed(3)}%`;
  if (pct >= 0.01) return `${pct.toFixed(3)}%`;
  if (pct >= 0.001) return `${pct.toFixed(4)}%`;
  return `${pct.toFixed(5)}%`;
}

const ISA_TABLE: Array<{ altitude: number; rho: number }> = [
  { altitude: 0, rho: 1.225 },
  { altitude: 11000, rho: 0.3639 },
  { altitude: 20000, rho: 0.088 },
  { altitude: 32000, rho: 0.0133 },
  { altitude: 47000, rho: 0.00143 },
  { altitude: 51000, rho: 0.00086 },
  { altitude: 71000, rho: 0.000064 },
  { altitude: 85000, rho: 0.00001 },
  { altitude: 100000, rho: 5e-7 },
  { altitude: 150000, rho: 1e-9 },
];

function estimateDensityFromAltitude(altitude_m?: number | null): number | undefined {
  if (!Number.isFinite(altitude_m)) return undefined;
  const alt = Math.max(0, altitude_m as number);
  if (alt <= ISA_TABLE[0].altitude) return ISA_TABLE[0].rho;
  for (let i = 0; i < ISA_TABLE.length - 1; i++) {
    const lower = ISA_TABLE[i];
    const upper = ISA_TABLE[i + 1];
    if (alt <= upper.altitude) {
      const span = upper.altitude - lower.altitude || 1;
      const t = (alt - lower.altitude) / span;
      if (lower.rho <= 0 || upper.rho <= 0) {
        return Math.max(1e-12, lower.rho + t * (upper.rho - lower.rho));
      }
      const logInterp = Math.log(upper.rho / lower.rho);
      return lower.rho * Math.exp(logInterp * t);
    }
  }
  const last = ISA_TABLE[ISA_TABLE.length - 1];
  const scaleHeight = 50000;
  return last.rho * Math.exp(-(alt - last.altitude) / scaleHeight);
}

function computeBandAndCap(
  rho?: number,
  cfg = nearZeroConfig.envCaps
): { band: "pad" | "strat" | "vac" | "unknown"; vCap: number | undefined } {
  if (!cfg || rho == null || !Number.isFinite(rho)) {
    return { band: "unknown", vCap: undefined };
  }
  if (rho >= cfg.rho_pad) return { band: "pad", vCap: cfg.v_pad };
  if (rho >= cfg.rho_strat) return { band: "strat", vCap: cfg.v_strat };
  return { band: "vac", vCap: Infinity };
}

function exceedsUp(value: number | undefined, threshold: number | undefined): boolean {
  if (!Number.isFinite(value) || !Number.isFinite(threshold)) return false;
  return (value as number) > (threshold as number) + GUARD_EPS;
}

function exceedsDown(value: number | undefined, threshold: number | undefined): boolean {
  if (!Number.isFinite(value) || !Number.isFinite(threshold)) return false;
  return (value as number) < (threshold as number) - GUARD_EPS;
}

function computeTimeToThreshold(
  value: number | undefined,
  slope: number,
  target: number,
  orientation: GuardOrientation
): number {
  if (!Number.isFinite(value) || !Number.isFinite(target)) return Infinity;
  const v = value as number;
  const diff = v - target;
  if (Math.abs(diff) <= GUARD_EPS) {
    if (orientation === "up") {
      return slope > EPSILON ? GUARD_EPS / Math.max(slope, EPSILON) : Infinity;
    }
    return slope < -EPSILON ? GUARD_EPS / Math.max(Math.abs(slope), EPSILON) : Infinity;
  }
  if (orientation === "up") {
    if (exceedsUp(v, target)) return 0;
    if (slope <= EPSILON) return Infinity;
    return Math.max(0, (target - v) / slope);
  }
  // orientation === "down"
  if (exceedsDown(v, target)) return 0;
  if (slope >= -EPSILON) return Infinity;
  return Math.max(0, (v - target) / -slope);
}

function computeThresholdTimes(
  value: number | undefined,
  slope: number,
  guard: GuardThreshold | undefined,
  orientation: GuardOrientation
): { amber: number; red: number } {
  if (!guard) return { amber: Infinity, red: Infinity };
  return {
    amber: computeTimeToThreshold(value, slope, guard.amber, orientation),
    red: computeTimeToThreshold(value, slope, guard.red, orientation),
  };
}

function computeSlope(samples: Sample[], key: keyof NearZeroBusGuards): number {
  const points = samples
    .map((sample) => {
      const value = sample.guards[key];
      return Number.isFinite(value) ? { t: sample.ts, v: value as number } : null;
    })
    .filter(Boolean) as Array<{ t: number; v: number }>;

  if (points.length < 2) return 0;
  const t0 = points[0].t;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const { t, v } of points) {
    const x = t - t0;
    sumX += x;
    sumY += v;
    sumXY += x * v;
    sumXX += x * x;
  }

  const n = points.length;
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < EPSILON) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

function guardStatus(
  value: number | undefined,
  guard: GuardThreshold | undefined,
  orientation: GuardOrientation
): keyof typeof BADGE_COLORS {
  if (!guard || !Number.isFinite(value)) return "amber";
  if (orientation === "up") {
    if (exceedsUp(value, guard.red)) return "red";
    if (exceedsUp(value, guard.amber)) return "amber";
    return "green";
  }
  if (exceedsDown(value, guard.red)) return "red";
  if (exceedsDown(value, guard.amber)) return "amber";
  return "green";
}

function isNearAmber(key: ChannelKey, value: number | undefined): boolean {
  if (!Number.isFinite(value)) return false;
  switch (key) {
    case "q":
      return (value as number) >= NEAR_AMBER_THRESHOLDS.q;
    case "stroke":
      return (value as number) >= NEAR_AMBER_THRESHOLDS.stroke;
    case "TS":
      return (value as number) <= NEAR_AMBER_THRESHOLDS.TS;
    case "zeta":
      return (value as number) >= ((nearZeroConfig.guards?.zeta?.amber ?? 0.95) - 0.02);
    default:
      return false;
  }
}

function assessScalar(
  key: ChannelKey,
  value: number | undefined,
  slope: number,
  guard: GuardThreshold | undefined,
  orientation: GuardOrientation
): ChannelAssessment {
  const nearAmber = isNearAmber(key, value);
  if (!guard || !Number.isFinite(value)) {
    const baseReason: BoundReason = !Number.isFinite(value) ? "telemetry" : Math.abs(slope) <= EPSILON ? "stable" : slope < 0 ? "improving" : "trend";
    return {
      key,
      amber: Infinity,
      red: Infinity,
      boundedAmber: false,
      boundedRed: false,
      reason: baseReason,
      nearAmber,
    };
  }

  const val = value as number;
  const amberHit = orientation === "up"
    ? exceedsUp(val, guard.amber)
    : exceedsDown(val, guard.amber);
  const redHit = orientation === "up"
    ? exceedsUp(val, guard.red)
    : exceedsDown(val, guard.red);

  if (redHit) {
    return {
      key,
      amber: 0,
      red: 0,
      boundedAmber: true,
      boundedRed: true,
      reason: "limit",
      nearAmber: true,
    };
  }

  const amber = computeTimeToThreshold(val, slope, guard.amber, orientation);
  const red = computeTimeToThreshold(val, slope, guard.red, orientation);
  const boundedAmber = Number.isFinite(amber) && amber < Infinity;
  const boundedRed = Number.isFinite(red) && red < Infinity;

  let reason: BoundReason = "trend";
  const slopeImproving = orientation === "up" ? slope < -EPSILON : slope > EPSILON;
  if (!boundedAmber && !boundedRed) {
    if (slopeImproving) {
      reason = "improving";
    } else if (Math.abs(slope) <= EPSILON) {
      reason = "stable";
    }
  } else if (slopeImproving) {
    reason = "improving";
  }

  return {
    key,
    amber,
    red,
    boundedAmber,
    boundedRed,
    reason,
    nearAmber: nearAmber || amberHit,
  };
}

function assessThermal(thermal?: ThermalMetrics): ChannelAssessment {
  const headroom = safeNumber(thermal?.E_headroom_J);
  const P_diss = safeNumber(thermal?.P_diss_W);
  const Q_reject = safeNumber(thermal?.Q_reject_W);
  if (!Number.isFinite(headroom) || !Number.isFinite(P_diss) || !Number.isFinite(Q_reject) || (headroom as number) <= 0) {
    return {
      key: "thermal",
      amber: Infinity,
      red: Infinity,
      boundedAmber: false,
      boundedRed: false,
      reason: "telemetry",
      nearAmber: false,
    };
  }
  const net = (P_diss as number) - (Q_reject as number);
  if (net <= EPSILON) {
    return {
      key: "thermal",
      amber: Infinity,
      red: Infinity,
      boundedAmber: false,
      boundedRed: false,
      reason: "improving",
      nearAmber: false,
    };
  }
  const time = clampClock((headroom as number) / Math.max(net, EPSILON));
  return {
    key: "thermal",
    amber: time,
    red: time,
    boundedAmber: true,
    boundedRed: true,
    reason: "trend",
    nearAmber: time <= (nearZeroConfig.actionGuards?.T_guard_amber_s ?? 120) * 1.5,
  };
}

function summarizeReason(results: ChannelAssessment[]): BoundReason {
  if (results.some((r) => r.reason === "telemetry")) return "telemetry";
  if (results.some((r) => r.reason === "trend")) return "trend";
  if (results.some((r) => r.reason === "stable")) return "stable";
  if (results.some((r) => r.reason === "improving")) return "improving";
  return "stable";
}

function applyHysteresis(
  key: "TTA" | "TTR",
  raw: AggregatedDisplay,
  now: number,
  ref: React.MutableRefObject<{ TTA: HysteresisSlot; TTR: HysteresisSlot }>
): AggregatedDisplay {
  const slot = ref.current[key];
  if (!slot) {
    const display = { ...raw };
    ref.current[key] = { bounded: raw.bounded, lastSwitch: now, display } as HysteresisSlot;
    return display;
  }
  if (slot.bounded !== raw.bounded) {
    if (now - slot.lastSwitch < HYSTERESIS_SEC) {
      return slot.display;
    }
    slot.bounded = raw.bounded;
    slot.lastSwitch = now;
  }
  slot.display = { ...raw };
  return slot.display;
}


function bandStatus(
  band: ReturnType<typeof computeBandAndCap>,
  speed?: number
): keyof typeof BADGE_COLORS {
  if (band.band === "unknown" || band.vCap === undefined) return "amber";
  if (Number.isFinite(band.vCap) && Number.isFinite(speed)) {
    if ((speed as number) > (band.vCap as number)) return "red";
    if ((speed as number) > 0.8 * (band.vCap as number)) return "amber";
  }
  return "green";
}

function smoothValue(prev: number, next: number, alpha: number): number {
  if (!Number.isFinite(next)) return next;
  if (!Number.isFinite(prev)) return next;
  return prev + (next - prev) * alpha;
}

function limiterLabel(limiter: NearZeroBusClocks["limiter"]): string {
  switch (limiter) {
    case "thermal":
      return "Thermal";
    case "q":
      return "q";
    case "zeta":
      return "ζ";
    case "stroke":
      return "Stroke";
    case "TS":
      return "TS";
    default:
      return "Stable";
  }
}

function formatSpeed(speed?: number): string {
  if (!Number.isFinite(speed)) return "—";
  return `${(speed as number).toFixed(1)} m/s`;
}

export function NearZeroWidget({
  mode,
  env,
  nav,
  guards,
  thermal,
  frDuty,
  QL,
  burst,
  tauLC_s,
  split,
  sectorsTotal,
  onAction,
  className,
}: NearZeroWidgetProps) {
  const [clockState, setClockState] = useState<ClockState>(DEFAULT_CLOCK_STATE);
  const samplesRef = useRef<Sample[]>([]);
  const latestRef = useRef<{
    guards: NearZeroBusGuards;
    thermal?: ThermalMetrics;
    env?: HelixEnvMetrics;
    navSpeed?: number;
    split?: number;
  }>({
    guards,
    thermal,
    env,
    navSpeed: nav?.speed_mps,
    split,
  });
  const smoothRef = useRef<ClockState>(DEFAULT_CLOCK_STATE);
  const hysteresisRef = useRef<{ TTA: HysteresisSlot; TTR: HysteresisSlot }>({
    TTA: createHysteresisSlot(),
    TTR: createHysteresisSlot(),
  });
  const lastTickRef = useRef<number | null>(null);

  useEffect(() => {
    latestRef.current = {
      guards,
      thermal,
      env,
      navSpeed: nav?.speed_mps,
      split,
    };
  }, [guards, thermal, env, nav?.speed_mps, split]);

  useEffect(() => {
    if (mode !== "nearzero") {
      samplesRef.current = [];
      smoothRef.current = DEFAULT_CLOCK_STATE;
      hysteresisRef.current = {
        TTA: createHysteresisSlot(),
        TTR: createHysteresisSlot(),
      };
      setClockState(DEFAULT_CLOCK_STATE);
      return;
    }

    const tick = () => {
      const now = Date.now() / 1000;
      const latest = latestRef.current;
      const sample: Sample = {
        ts: now,
        guards: {
          q: safeNumber(latest.guards.q),
          zeta: safeNumber(latest.guards.zeta),
          stroke_pm: safeNumber(latest.guards.stroke_pm),
          TS: safeNumber(latest.guards.TS),
        },
      };

      samplesRef.current = [
        ...samplesRef.current.filter((s) => now - s.ts <= SAMPLE_WINDOW_SEC),
        sample,
      ];

      const slopes = {
        q: computeSlope(samplesRef.current, "q"),
        zeta: computeSlope(samplesRef.current, "zeta"),
        stroke_pm: computeSlope(samplesRef.current, "stroke_pm"),
        TS: computeSlope(samplesRef.current, "TS"),
      };

  const guardCfg: GuardsConfig = nearZeroConfig.guards ?? {};
      const actionGuards = nearZeroConfig.actionGuards ?? { T_guard_amber_s: 120, T_guard_red_s: 30 };

      const channelResults: ChannelAssessment[] = [
        assessThermal(latest.thermal),
        assessScalar("q", sample.guards.q, slopes.q, guardCfg.q, "up"),
        assessScalar("zeta", sample.guards.zeta, slopes.zeta, guardCfg.zeta, "up"),
        assessScalar("stroke", sample.guards.stroke_pm, slopes.stroke_pm, guardCfg.stroke_pm, "up"),
        assessScalar("TS", sample.guards.TS, slopes.TS, guardCfg.TS, "down"),
      ];

      const amberCandidates = channelResults.filter((c) => c.boundedAmber);
      const redCandidates = channelResults.filter((c) => c.boundedRed);
      const amberMonitor = channelResults.some((c) => !c.boundedAmber && c.nearAmber);
      const redMonitor = channelResults.some((c) => !c.boundedRed && c.nearAmber);

      const amberDisplay: AggregatedDisplay = amberCandidates.length > 0
        ? (() => {
            const min = amberCandidates.reduce((prev, curr) => (curr.amber < prev.amber ? curr : prev));
            return {
              value: clampClock(min.amber),
              bounded: true,
              reason: min.reason,
              monitor: false,
              limiter: min.key,
            };
          })()
        : {
            value: Infinity,
            bounded: false,
            reason: summarizeReason(channelResults.filter((c) => !c.boundedAmber)),
            monitor: amberMonitor,
            limiter: "none",
          };

      const redDisplay: AggregatedDisplay = redCandidates.length > 0
        ? (() => {
            const min = redCandidates.reduce((prev, curr) => (curr.red < prev.red ? curr : prev));
            return {
              value: clampClock(min.red),
              bounded: true,
              reason: min.reason,
              monitor: false,
              limiter: min.key,
            };
          })()
        : {
            value: Infinity,
            bounded: false,
            reason: summarizeReason(channelResults.filter((c) => !c.boundedRed)),
            monitor: redMonitor,
            limiter: "none",
          };

      const displayAmber = applyHysteresis("TTA", amberDisplay, now, hysteresisRef);
      const displayRed = applyHysteresis("TTR", redDisplay, now, hysteresisRef);

      const hardTrips = channelResults.some((c) => c.reason === "limit");

      const lastTick = lastTickRef.current ?? now;
      const delta = Math.max(now - lastTick, 1);
      lastTickRef.current = now;
      const alpha = 1 - Math.exp(-delta / SMOOTH_TAU_SEC);

      const prev = smoothRef.current;
      const targetTTA = displayAmber.bounded ? displayAmber.value : Infinity;
      const targetTTR = displayRed.bounded ? displayRed.value : Infinity;

      const smoothedTTA = displayAmber.bounded
        ? smoothValue(Number.isFinite(prev.TTA) ? prev.TTA : targetTTA, targetTTA, alpha)
        : Infinity;
      const smoothedTTR = displayRed.bounded
        ? smoothValue(Number.isFinite(prev.TTR) ? prev.TTR : targetTTR, targetTTR, alpha)
        : Infinity;

      const limiter = displayRed.bounded
        ? displayRed.limiter
        : displayAmber.bounded
        ? displayAmber.limiter
        : "none";

      let advice: NearZeroAdvice = "ok";
      if (hardTrips || (displayRed.bounded && smoothedTTR <= actionGuards.T_guard_red_s)) {
        advice = "drop";
      } else if (displayAmber.bounded && smoothedTTA <= actionGuards.T_guard_amber_s) {
        advice = displayAmber.limiter === "thermal" || displayAmber.limiter === "TS" ? "dwell" : "ease";
      }

      const nextState: ClockState = {
        TTA: smoothedTTA,
        TTR: smoothedTTR,
        boundedTTA: displayAmber.bounded,
        boundedTTR: displayRed.bounded,
        reasonTTA: displayAmber.reason,
        reasonTTR: displayRed.reason,
        monitorTTA: !displayAmber.bounded ? displayAmber.monitor : false,
        monitorTTR: !displayRed.bounded ? displayRed.monitor : false,
        limiter,
        advice,
      };

      if (import.meta.env?.DEV) {
        const empty = {
          q: !Number.isFinite(sample.guards.q),
          zeta: !Number.isFinite(sample.guards.zeta),
          stroke_pm: !Number.isFinite(sample.guards.stroke_pm),
          TS: !Number.isFinite(sample.guards.TS),
        };
        const whyDrop = advice === "drop" ? {
          hardTrips,
          smoothedTTR,
          redBounded: displayRed.bounded,
          redReason: displayRed.reason,
          limiter,
          thresholds: nearZeroConfig.actionGuards,
        } : undefined;
        // Compact debug line
        // eslint-disable-next-line no-console
        console.debug("[NearZeroWidget] tick", { advice, empty, clocks: { TTA: smoothedTTA, TTR: smoothedTTR }, limiter, whyDrop });
      }

      smoothRef.current = nextState;
      setClockState(nextState);

      const rho = safeNumber(latest.env?.atmDensity_kg_m3);
      const altitude = safeNumber(latest.env?.altitude_m);
      const rhoEstimate = rho ?? estimateDensityFromAltitude(altitude);
      const band = computeBandAndCap(rhoEstimate);
      const total = Math.max(1, sectorsTotal ?? nearZeroConfig.sectorsTotal ?? 400);
      const normalizedSplit = (() => {
        const raw = safeNumber(latest.split);
        if (raw == null) return 0.5;
        if (raw <= 1) return Math.max(0, Math.min(1, raw));
        return Math.max(0, Math.min(1, raw / total));
      })();

      const event: NearZeroEvent = {
        mode: "nearzero",
        env: {
          rho: rhoEstimate,
          vCap: band.vCap,
          band: band.band,
        },
        split: normalizedSplit,
        guards: {
          q: sample.guards.q ?? NaN,
          zeta: sample.guards.zeta ?? NaN,
          stroke_pm: sample.guards.stroke_pm ?? NaN,
          TS: sample.guards.TS ?? NaN,
        },
        clocks: {
          TTA_s: displayAmber.bounded ? smoothedTTA : null,
          TTR_s: displayRed.bounded ? smoothedTTR : null,
          TTA_bounded: displayAmber.bounded,
          TTR_bounded: displayRed.bounded,
          TTA_reason: displayAmber.reason,
          TTR_reason: displayRed.reason,
          limiter,
        },
        advice,
      };

      publish("warp:nearzero", event);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(id);
      lastTickRef.current = null;
    };
  }, [mode, sectorsTotal]);

  const isActive = mode === "nearzero";
  const rho = safeNumber(env?.atmDensity_kg_m3);
  const band = computeBandAndCap(rho);
  const speed = safeNumber(nav?.speed_mps);
  const bandColor = bandStatus(band, speed);

  const guardCfg = nearZeroConfig.guards;
  const guardStatuses = useMemo(
    () => ({
      q: guardStatus(guards.q, guardCfg?.q, "up"),
      zeta: guardStatus(guards.zeta, guardCfg?.zeta, "up"),
      stroke_pm: guardStatus(guards.stroke_pm, guardCfg?.stroke_pm, "up"),
      TS: guardStatus(guards.TS, guardCfg?.TS, "down"),
    }),
    [guards, guardCfg]
  );

  const total = Math.max(1, sectorsTotal ?? nearZeroConfig.sectorsTotal ?? 400);
  const normalizedSplit = (() => {
    const raw = safeNumber(split);
    if (raw == null) return 0.5;
    if (raw <= 1) return Math.max(0, Math.min(1, raw));
    return Math.max(0, Math.min(1, raw / total));
  })();

  const splitPercent = Math.round(normalizedSplit * 100);
  const splitDeviation = Math.abs(normalizedSplit - 0.5);

  const handleResplit = useCallback(() => {
    const count = total;
    const splitIndex = count * 0.5;
    try {
      (window as any)?.setStrobingState?.({
        sectorCount: count,
        currentSector: Math.floor(splitIndex),
        split: 0.5,
      });
    } catch (error) {
      console.warn("[NearZeroWidget] setStrobingState failed:", error);
    }
  }, [total]);

  const clockTintTTA =
    clockState.TTA <= (nearZeroConfig.actionGuards?.T_guard_amber_s ?? 120)
      ? clockState.TTA <= (nearZeroConfig.actionGuards?.T_guard_red_s ?? 30)
        ? "red"
        : "amber"
      : "green";
  const clockTintTTR =
    clockState.TTR <= (nearZeroConfig.actionGuards?.T_guard_red_s ?? 30) ? "red" : "green";

  const limiterText = limiterLabel(clockState.limiter);
  const adviceColor = ADVICE_COLORS[clockState.advice];

  return (
    <Card
      className={cn(
        "bg-slate-900/60 border-slate-800 backdrop-blur",
        !isActive && "opacity-70",
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-200">
          <span className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-amber-300" />
            Near-Zero Flight Deck
          </span>
          <Badge className={cn("uppercase tracking-wide text-xs", adviceColor)}>
            {clockState.advice === "ok" ? "Stable" : clockState.advice}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-slate-800 text-slate-200 border border-slate-700 uppercase tracking-tight">
            Zero-beta Split
          </Badge>
          <span className="text-slate-400">Split {splitPercent}%</span>
          {splitDeviation > 0.02 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResplit}
              className="border-amber-400/40 text-amber-200 hover:bg-amber-500/10"
            >
              Re-split
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge className={BADGE_COLORS[bandColor]}>
            Band: {band.band === "pad" ? "Pad" : band.band === "strat" ? "Strat" : band.band === "vac" ? "Vac" : "Unknown"}
          </Badge>
          <Badge className={BADGE_COLORS[bandColor]}>
            Cap:{" "}
            {band.vCap === undefined
              ? "—"
              : Number.isFinite(band.vCap)
              ? `${(band.vCap as number).toFixed(0)} m/s`
              : "∞"}
          </Badge>
          <Badge
            className={BADGE_COLORS[bandColor]}
          >
            Speed: {formatSpeed(speed)}
          </Badge>
          <Badge className="bg-slate-800 text-slate-200 border border-slate-700">
            {env?.altitude_m != null && Number.isFinite(env.altitude_m)
              ? `Altitude ${(env.altitude_m as number).toFixed(0)} m`
              : "Altitude —"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={BADGE_COLORS[guardStatuses.q]}>q {Number.isFinite(guards.q) ? guards.q.toFixed(2) : "—"}</Badge>
          <Badge className={BADGE_COLORS[guardStatuses.zeta]}>
            ζ {Number.isFinite(guards.zeta) ? guards.zeta.toFixed(2) : "—"}
          </Badge>
          <Badge className={BADGE_COLORS[guardStatuses.stroke_pm]}>
            Stroke {Number.isFinite(guards.stroke_pm) ? `${guards.stroke_pm.toFixed(1)} pm` : "—"}
          </Badge>
          <Badge className={BADGE_COLORS[guardStatuses.TS]}>
            TS {Number.isFinite(guards.TS) ? guards.TS.toFixed(0) : "—"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            className={cn(
              "rounded-md px-3 py-2 flex items-center gap-2",
              CLOCK_COLORS[clockTintTTA as keyof typeof CLOCK_COLORS],
              clockState.TTA < 60 && Number.isFinite(clockState.TTA) ? "animate-pulse" : ""
            )}
          >
            <Timer className="h-4 w-4" />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Time to Amber</div>
              <div className="text-sm font-semibold">{formatDuration(clockState.TTA)}</div>
            </div>
          </div>

          <div
            className={cn(
              "rounded-md px-3 py-2 flex items-center gap-2",
              CLOCK_COLORS[clockTintTTR as keyof typeof CLOCK_COLORS],
              clockState.TTR < 60 && Number.isFinite(clockState.TTR) ? "animate-pulse" : ""
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Time to Red</div>
              <div className="text-sm font-semibold">{formatDuration(clockState.TTR)}</div>
            </div>
          </div>

          <div className="rounded-md border border-slate-700/60 bg-slate-900/80 px-3 py-2 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-300" />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Limiter</div>
              <div className="text-sm font-semibold text-slate-200">{limiterText}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-slate-400">
          <span>
            FR Duty:{" "}
            {formatPercentSmall(frDuty)}
          </span>
          <span>QL: {Number.isFinite(QL) ? (QL as number).toFixed(0) : "—"}</span>
          <span>
            Burst:{" "}
            {(() => {
              const dwell = Number.isFinite(burst?.dwell_s) ? (burst!.dwell_s as number) : undefined;
              const frac = Number.isFinite(burst?.frac) ? (burst!.frac as number) : undefined;
              const on_s = (dwell != null && frac != null) ? dwell * frac : undefined;
              return formatOnTime(on_s);
            })()}
          </span>
          <span>
            τ<sub>LC</sub>: {formatTauLC(tauLC_s)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={clockState.advice === "ease" ? "default" : "outline"}
            onClick={() => onAction?.("ease")}
            disabled={!isActive || !onAction}
          >
            Ease duty
          </Button>
          <Button
            size="sm"
            variant={clockState.advice === "dwell" ? "default" : "outline"}
            onClick={() => onAction?.("dwell")}
            disabled={!isActive || !onAction}
          >
            Widen spacing
          </Button>
          <Button
            size="sm"
            variant={clockState.advice === "drop" ? "destructive" : "outline"}
            onClick={() => onAction?.("drop")}
            disabled={!isActive || !onAction}
          >
            Mode drop
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default NearZeroWidget;





