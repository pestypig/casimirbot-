import {
  QI_AUTOTHROTTLE_ALPHA,
  QI_AUTOTHROTTLE_COOLDOWN_MS,
  QI_AUTOTHROTTLE_ENABLE,
  QI_AUTOTHROTTLE_HYST,
  QI_AUTOTHROTTLE_MIN,
  QI_AUTOTHROTTLE_TARGET,
} from "../config/env.js";
import type { GatePulse, PumpCommand, PumpTone } from "../../shared/schema.js";
import type { QiAutoscaleClampReason } from "./qi-autoscale.js";

export type QiAutothrottleState = {
  scale: number; // EMA scale in [QI_AUTOTHROTTLE_MIN, 1]
  lastUpdateMs: number;
  reason?: string;
  enabled: boolean;
  target: number;
  hysteresis: number;
};

export function initQiAutothrottle(): QiAutothrottleState {
  return {
    scale: 1,
    lastUpdateMs: 0,
    enabled: QI_AUTOTHROTTLE_ENABLE,
    target: QI_AUTOTHROTTLE_TARGET,
    hysteresis: QI_AUTOTHROTTLE_HYST,
  };
}

export function computeScaleFromZetaRaw(zetaRaw: number, target: number): number {
  if (!Number.isFinite(zetaRaw) || zetaRaw <= 0) return 1;
  const s = target / zetaRaw;
  return Math.max(QI_AUTOTHROTTLE_MIN, Math.min(1, s));
}

export function applyQiAutothrottleStep(
  at: QiAutothrottleState,
  zetaRaw: number | null | undefined,
  nowMs: number = Date.now(),
): QiAutothrottleState {
  if (!at.enabled || !Number.isFinite(zetaRaw)) return at;

  const above = (zetaRaw as number) > at.target + at.hysteresis;
  const below = (zetaRaw as number) < at.target - at.hysteresis;
  if (!above && !below) return at;

  if (nowMs - at.lastUpdateMs < QI_AUTOTHROTTLE_COOLDOWN_MS) return at;

  const nextTargetScale = computeScaleFromZetaRaw(zetaRaw as number, at.target);
  const ema = QI_AUTOTHROTTLE_ALPHA * nextTargetScale + (1 - QI_AUTOTHROTTLE_ALPHA) * at.scale;

  return {
    ...at,
    scale: ema,
    lastUpdateMs: nowMs,
    reason: `zetaRaw=${(zetaRaw as number).toFixed(3)} -> target=${at.target}, scale=${nextTargetScale.toFixed(3)} ema=${ema.toFixed(3)}`,
  };
}

export function applyScaleToPumpCommand(
  cmd: PumpCommand | null | undefined,
  scale: number,
  clamps?: QiAutoscaleClampReason[],
) {
  if (!cmd || !Number.isFinite(scale) || scale <= 0) return cmd;
  if (scale === 1) return cmd;
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const tones: PumpTone[] = Array.isArray(cmd.tones)
    ? cmd.tones.map((tone) => {
        if (!Number.isFinite(tone.depth)) return tone;
        const scaled = (tone.depth as number) * scale;
        const clamped = clamp01(scaled);
        if (clamped !== scaled) {
          const kind: QiAutoscaleClampReason["kind"] =
            scaled < 0 ? "depth_floor" : "depth_ceiling";
          clamps?.push({
            kind,
            before: scaled,
            after: clamped,
            floor: kind === "depth_floor" ? 0 : undefined,
            ceiling: kind === "depth_ceiling" ? 1 : undefined,
            toneOmegaHz: tone.omega_hz,
          });
        }
        return {
          ...tone,
          depth: clamped,
        };
      })
    : [];
  const next: PumpCommand & { strokeAmplitudePm?: number } = { ...cmd, tones };
  if (Number.isFinite((cmd as any).strokeAmplitudePm)) {
    const stroke = Math.max(0, Number((cmd as any).strokeAmplitudePm));
    next.strokeAmplitudePm = stroke * scale;
  }
  return next;
}

export function applyScaleToGatePulses(
  pulses: GatePulse[] | null | undefined,
  scale: number,
): GatePulse[] | null | undefined {
  if (!Array.isArray(pulses) || !Number.isFinite(scale) || scale <= 0) return pulses;
  if (scale === 1) return pulses;
  return pulses.map((pulse) => {
    const scaledRho = Number.isFinite(pulse.rho) ? (pulse.rho as number) * scale : pulse.rho;
    const tones = Array.isArray(pulse.tones)
      ? pulse.tones.map((tone) => ({
          ...tone,
          depth: Number.isFinite(tone.depth) ? (tone.depth as number) * scale : tone.depth,
        }))
      : undefined;
    return { ...pulse, rho: scaledRho, tones };
  });
}
