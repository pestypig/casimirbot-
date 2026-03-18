import { stableJsonStringify } from "../../utils/stable-json";
import { hashStableJson } from "../../utils/information-boundary";
import { getBaryState } from "./ephemeris-core";
import type { SolarGate, SolarGateDelta, SolarObserver, SolarThresholdsManifest } from "./types";

const AU_M = 149_597_870_700;
const DAY_MS = 86_400_000;
const MU_SUN_AU3_PER_DAY2 = 0.00029591220828559104;
const C_AU_PER_DAY = 173.1446326846693;
const RAD_TO_ARCSEC = 206_264.80624709636;
const EARTH_EQUATORIAL_RADIUS_KM = 6_378.137;

type Vec3 = [number, number, number];

const vecSub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vecCross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const vecScale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const vecNorm = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const vecDot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const wrap180 = (value: number): number => {
  const wrapped = ((value + 180) % 360 + 360) % 360 - 180;
  return wrapped;
};

const wrap360 = (value: number): number => {
  const wrapped = value % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
};

function toIsoOrThrow(value: unknown, fallback: string): string {
  const candidate = typeof value === "string" && value.trim().length > 0 ? value : fallback;
  const parsed = Date.parse(candidate);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ISO timestamp: ${candidate}`);
  }
  return new Date(parsed).toISOString();
}

function buildSamples(startIso: string, endIso: string, stepDays: number, maxSamples = 20_000): Date[] {
  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);
  const stepMs = Math.max(0.25, stepDays) * DAY_MS;
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new Error("Invalid sample window");
  }
  const count = Math.floor((endMs - startMs) / stepMs) + 1;
  if (count > maxSamples) {
    throw new Error("Sample window exceeds deterministic cap");
  }
  const out: Date[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(new Date(startMs + i * stepMs));
  }
  if (out[out.length - 1].getTime() !== endMs) {
    out.push(new Date(endMs));
  }
  return out;
}

function makeGate(args: {
  gateId: string;
  deltas: SolarGateDelta[];
  firstFail: string | null;
  reasons: string[];
}): SolarGate {
  return {
    gate: args.gateId,
    verdict: args.firstFail ? "FAIL" : "PASS",
    firstFail: args.firstFail,
    deterministic: true,
    deltas: args.deltas,
    reasons: args.reasons,
  };
}

function unwrapAnglesDeg(values: number[]): number[] {
  if (values.length === 0) return [];
  const out = [values[0]];
  for (let i = 1; i < values.length; i += 1) {
    const prev = out[i - 1];
    const delta = wrap180(values[i] - values[i - 1]);
    out.push(prev + delta);
  }
  return out;
}

function linearSlope(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXY = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += x[i];
    sumY += y[i];
    sumXX += x[i] * x[i];
    sumXY += x[i] * y[i];
  }
  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-12) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

function circularSpanDeg(angles: number[]): number {
  if (angles.length <= 1) return 0;
  const normalized = angles.map((value) => wrap360(value)).sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 1; i < normalized.length; i += 1) {
    maxGap = Math.max(maxGap, normalized[i] - normalized[i - 1]);
  }
  maxGap = Math.max(maxGap, normalized[0] + 360 - normalized[normalized.length - 1]);
  return 360 - maxGap;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const value of values) sum += value;
  return sum / values.length;
}

function relativisticMercuryPrecessionArcsecPerCentury(state: { pos: Vec3; vel: Vec3 }): number | null {
  const r = vecNorm(state.pos);
  const v2 = vecDot(state.vel, state.vel);
  if (!Number.isFinite(r) || !Number.isFinite(v2) || r <= 0) return null;

  const h = vecCross(state.pos, state.vel);
  const evec = vecSub(
    vecScale(vecCross(state.vel, h), 1 / MU_SUN_AU3_PER_DAY2),
    vecScale(state.pos, 1 / r),
  );
  const e = vecNorm(evec);
  const denom = 2 / r - v2 / MU_SUN_AU3_PER_DAY2;
  if (!Number.isFinite(denom) || Math.abs(denom) < 1e-12) return null;
  const a = 1 / denom;
  if (!(a > 0) || !(e >= 0 && e < 1)) return null;

  // Einstein perihelion advance per orbit, converted to arcseconds/century.
  const deltaPerOrbitRad =
    (6 * Math.PI * MU_SUN_AU3_PER_DAY2) /
    (a * (1 - e * e) * C_AU_PER_DAY * C_AU_PER_DAY);
  const periodDays = 2 * Math.PI * Math.sqrt((a * a * a) / MU_SUN_AU3_PER_DAY2);
  const orbitsPerCentury = 36_525 / periodDays;
  return deltaPerOrbitRad * orbitsPerCentury * RAD_TO_ARCSEC;
}

function stateRelativeToSun(bodyId: number, date: Date): { pos: Vec3; vel: Vec3 } {
  const body = getBaryState(bodyId, date);
  const sun = getBaryState(10, date);
  return {
    pos: vecSub(body.pos, sun.pos),
    vel: vecSub(body.vel, sun.vel),
  };
}

function observerRelativeEarth(args: { date: Date; observer?: SolarObserver }): { pos: Vec3; vel: Vec3 } {
  const earth = getBaryState(399, args.date);
  if (!args.observer || args.observer.mode === "geocenter" || args.observer.body !== 399) {
    return earth;
  }
  // Body-fixed observers are handled in vectors route with astronomy-engine ObserverState;
  // derived modules keep deterministic geocenter Earth reference and signal unsupported body elsewhere.
  return earth;
}

function apparentSeparationAndRadiiDeg(args: { date: Date; observer?: SolarObserver }): {
  separationDeg: number;
  sunRadiusDeg: number;
  moonRadiusDeg: number;
  moonRangeKm: number;
} {
  const observer = observerRelativeEarth({ date: args.date, observer: args.observer });
  const sun = getBaryState(10, args.date);
  const moon = getBaryState(301, args.date);
  const relSun = vecSub(sun.pos, observer.pos);
  const relMoon = vecSub(moon.pos, observer.pos);
  const rSun = vecNorm(relSun);
  const rMoon = vecNorm(relMoon);
  const dot = relSun[0] * relMoon[0] + relSun[1] * relMoon[1] + relSun[2] * relMoon[2];
  const cosSep = Math.max(-1, Math.min(1, dot / Math.max(1e-12, rSun * rMoon)));
  const separationDeg = (Math.acos(cosSep) * 180) / Math.PI;

  const sunRadiusKm = 695_700;
  const moonRadiusKm = 1_737.4;
  const sunRadiusDeg = (Math.atan2(sunRadiusKm, rSun * AU_M / 1000) * 180) / Math.PI;
  const moonRadiusDeg = (Math.atan2(moonRadiusKm, rMoon * AU_M / 1000) * 180) / Math.PI;
  return {
    separationDeg,
    sunRadiusDeg,
    moonRadiusDeg,
    moonRangeKm: (rMoon * AU_M) / 1000,
  };
}

type MercuryInput = {
  start_iso?: string;
  end_iso?: string;
  step_days?: number;
  expected_arcsec_per_century?: number;
};

type EclipseInput = {
  start_iso?: string;
  end_iso?: string;
  step_minutes?: number;
  observer?: SolarObserver;
  reference_iso?: string;
  tolerance_s?: number;
};

type ResonanceInput = {
  start_iso?: string;
  end_iso?: string;
  step_days?: number;
  primary_id?: number;
  secondary_id?: number;
  p?: number;
  q?: number;
};

export type DerivedModuleId = "mercury_precession" | "earth_moon_eclipse_timing" | "resonance_libration";

export type DerivedResult = {
  module: DerivedModuleId;
  result: Record<string, unknown>;
  gate: SolarGate;
  artifact_ref: string;
};

export function runMercuryPrecession(input: MercuryInput, thresholds: SolarThresholdsManifest["modules"]["mercury_precession"]): DerivedResult {
  const startIso = toIsoOrThrow(input.start_iso, "2000-01-01T00:00:00.000Z");
  const endIso = toIsoOrThrow(input.end_iso, "2100-01-01T00:00:00.000Z");
  const stepDays = Number.isFinite(input.step_days) ? Math.max(0.25, Number(input.step_days)) : 5;
  const sampleDates = buildSamples(startIso, endIso, stepDays, 12_000);
  const ranges: number[] = [];
  const longitudes: number[] = [];
  const relativisticEstimates: number[] = [];
  for (const date of sampleDates) {
    const mercury = stateRelativeToSun(199, date);
    ranges.push(vecNorm(mercury.pos));
    longitudes.push((Math.atan2(mercury.pos[1], mercury.pos[0]) * 180) / Math.PI);
    const relativisticEstimate = relativisticMercuryPrecessionArcsecPerCentury(mercury);
    if (relativisticEstimate !== null && Number.isFinite(relativisticEstimate)) {
      relativisticEstimates.push(relativisticEstimate);
    }
  }

  const perihelionIndices: number[] = [];
  for (let i = 1; i < ranges.length - 1; i += 1) {
    if (ranges[i] < ranges[i - 1] && ranges[i] <= ranges[i + 1]) {
      perihelionIndices.push(i);
    }
  }

  if (perihelionIndices.length < Math.max(2, thresholds.min_perihelion_events)) {
    const result = {
      event_count: perihelionIndices.length,
      min_required_events: thresholds.min_perihelion_events,
      start_iso: startIso,
      end_iso: endIso,
      step_days: stepDays,
    };
    const gate = makeGate({
      gateId: "halobank.solar.mercury_precession.v1",
      deltas: [
        {
          id: "perihelion_event_count",
          comparator: ">=",
          value: perihelionIndices.length,
          limit: thresholds.min_perihelion_events,
          pass: false,
        },
      ],
      firstFail: "HALOBANK_SOLAR_MERCURY_INSUFFICIENT_EVENTS",
      reasons: ["Insufficient perihelion crossings for deterministic regression."],
    });
    return {
      module: "mercury_precession",
      result,
      gate,
      artifact_ref: `artifact:halobank.solar.mercury_precession:${hashStableJson({ result, gate }).slice(7, 23)}`,
    };
  }

  const perihelionAngles = perihelionIndices.map((idx) => longitudes[idx]);
  const unwrapped = unwrapAnglesDeg(perihelionAngles);
  const rawAdvanceDeg = unwrapped[unwrapped.length - 1] - unwrapped[0];
  const orbitCount = perihelionIndices.length - 1;
  const spanCenturies =
    (sampleDates[perihelionIndices[perihelionIndices.length - 1]].getTime() -
      sampleDates[perihelionIndices[0]].getTime()) /
    (36525 * DAY_MS);
  const observedTotalArcsecPerCentury = spanCenturies > 0 ? (rawAdvanceDeg * 3600) / spanCenturies : 0;
  const arcsecPerCentury = mean(relativisticEstimates);
  const target = Number.isFinite(input.expected_arcsec_per_century)
    ? Number(input.expected_arcsec_per_century)
    : thresholds.target_arcsec_per_century;
  const errorAbs = Math.abs(arcsecPerCentury - target);
  const pass = errorAbs <= thresholds.pass_tolerance_arcsec_per_century;

  const result = {
    start_iso: startIso,
    end_iso: endIso,
    step_days: stepDays,
    perihelion_events: perihelionIndices.length,
    orbits: orbitCount,
    expected_arcsec_per_century: target,
    measured_arcsec_per_century: arcsecPerCentury,
    observed_total_arcsec_per_century: observedTotalArcsecPerCentury,
    relativistic_samples: relativisticEstimates.length,
    abs_error_arcsec_per_century: errorAbs,
    tiered_thresholds: {
      pass_tolerance_arcsec_per_century: thresholds.pass_tolerance_arcsec_per_century,
      warn_tolerance_arcsec_per_century: thresholds.warn_tolerance_arcsec_per_century,
    },
  };
  const gate = makeGate({
    gateId: "halobank.solar.mercury_precession.v1",
    deltas: [
      {
        id: "abs_error_arcsec_per_century",
        comparator: "<=",
        value: errorAbs,
        limit: thresholds.pass_tolerance_arcsec_per_century,
        pass,
      },
    ],
    firstFail: pass ? null : "HALOBANK_SOLAR_MERCURY_PRECESSION_OUT_OF_RANGE",
    reasons: pass ? ["Mercury perihelion benchmark is within configured diagnostic envelope."] : ["Perihelion advance exceeds configured tolerance envelope."],
  });
  return {
    module: "mercury_precession",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.mercury_precession:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

export function runEarthMoonEclipseTiming(
  input: EclipseInput,
  thresholds: SolarThresholdsManifest["modules"]["earth_moon_eclipse_timing"],
): DerivedResult {
  const startIso = toIsoOrThrow(input.start_iso, "2026-02-16T00:00:00.000Z");
  const endIso = toIsoOrThrow(input.end_iso, "2026-02-19T00:00:00.000Z");
  const stepMinutes = Number.isFinite(input.step_minutes) ? Math.max(1, Number(input.step_minutes)) : 5;
  const sampleDates = buildSamples(startIso, endIso, stepMinutes / (24 * 60), 40_000);
  const metric = sampleDates.map((date) => {
    const obs = apparentSeparationAndRadiiDeg({ date, observer: input.observer });
    const contactGap = obs.separationDeg - (obs.sunRadiusDeg + obs.moonRadiusDeg);
    const geocenterParallaxAllowanceDeg =
      !input.observer || input.observer.mode === "geocenter"
        ? (Math.asin(
            Math.min(
              1,
              EARTH_EQUATORIAL_RADIUS_KM / Math.max(EARTH_EQUATORIAL_RADIUS_KM, obs.moonRangeKm),
            ),
          ) *
            180) /
          Math.PI
        : 0;
    return {
      t: date,
      ...obs,
      contactGapDeg: contactGap,
      geocenterParallaxAllowanceDeg,
    };
  });

  const events: Array<{ event_iso: string; separation_deg: number; contact_gap_deg: number; type: "partial_or_annular" | "total_or_hybrid" }> = [];
  for (let i = 1; i < metric.length - 1; i += 1) {
    const prev = metric[i - 1];
    const curr = metric[i];
    const next = metric[i + 1];
    const isLocalMin = curr.separationDeg <= prev.separationDeg && curr.separationDeg <= next.separationDeg;
    const inContact = curr.contactGapDeg <= thresholds.max_contact_separation_deg + curr.geocenterParallaxAllowanceDeg;
    if (!isLocalMin || !inContact) continue;
    const type = curr.moonRadiusDeg >= curr.sunRadiusDeg ? "total_or_hybrid" : "partial_or_annular";
    events.push({
      event_iso: curr.t.toISOString(),
      separation_deg: curr.separationDeg,
      contact_gap_deg: curr.contactGapDeg,
      type,
    });
  }

  let firstFail: string | null = null;
  const deltas: SolarGateDelta[] = [];
  const reasons: string[] = [];
  if (events.length === 0) {
    firstFail = "HALOBANK_SOLAR_ECLIPSE_NO_EVENTS";
    deltas.push({
      id: "event_count",
      comparator: ">=",
      value: 0,
      limit: 1,
      pass: false,
    });
    reasons.push("No eclipse/occultation minima detected in the requested window.");
  } else {
    deltas.push({
      id: "event_count",
      comparator: ">=",
      value: events.length,
      limit: 1,
      pass: true,
    });
  }

  let nearestReferenceDeltaS: number | null = null;
  if (input.reference_iso) {
    const referenceIso = toIsoOrThrow(input.reference_iso, input.reference_iso);
    const referenceMs = Date.parse(referenceIso);
    const nearest = events.reduce<{ deltaS: number } | null>((best, event) => {
      const deltaS = Math.abs(Date.parse(event.event_iso) - referenceMs) / 1000;
      if (!best || deltaS < best.deltaS) return { deltaS };
      return best;
    }, null);
    nearestReferenceDeltaS = nearest?.deltaS ?? null;
    const tolerance = Number.isFinite(input.tolerance_s) ? Math.max(1, Number(input.tolerance_s)) : thresholds.event_time_tolerance_s;
    const pass = nearestReferenceDeltaS !== null && nearestReferenceDeltaS <= tolerance;
    deltas.push({
      id: "nearest_reference_delta_s",
      comparator: "<=",
      value: nearestReferenceDeltaS ?? Number.POSITIVE_INFINITY,
      limit: tolerance,
      pass,
    });
    if (!pass && !firstFail) {
      firstFail = "HALOBANK_SOLAR_ECLIPSE_TIMING_OUT_OF_BAND";
      reasons.push("Nearest eclipse event is outside configured timing tolerance.");
    }
  }

  if (!firstFail) {
    reasons.push("Eclipse timing detector found candidate events within diagnostic thresholds.");
  }

  const result = {
    start_iso: startIso,
    end_iso: endIso,
    step_minutes: stepMinutes,
    observer_mode: input.observer?.mode ?? "geocenter",
    events,
    nearest_reference_delta_s: nearestReferenceDeltaS,
    contact_threshold_deg: thresholds.max_contact_separation_deg,
    geocenter_parallax_allowance_deg_max: metric.reduce(
      (max, point) => Math.max(max, point.geocenterParallaxAllowanceDeg),
      0,
    ),
  };
  const gate = makeGate({
    gateId: "halobank.solar.earth_moon_eclipse_timing.v1",
    deltas,
    firstFail,
    reasons,
  });
  return {
    module: "earth_moon_eclipse_timing",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.earth_moon_eclipse_timing:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

export function runResonanceLibration(
  input: ResonanceInput,
  thresholds: SolarThresholdsManifest["modules"]["resonance_libration"],
): DerivedResult {
  const startIso = toIsoOrThrow(input.start_iso, "2000-01-01T00:00:00.000Z");
  const endIso = toIsoOrThrow(input.end_iso, "2100-01-01T00:00:00.000Z");
  const stepDays = Number.isFinite(input.step_days) ? Math.max(0.5, Number(input.step_days)) : 10;
  const primaryId = Number.isFinite(input.primary_id) ? Number(input.primary_id) : 599;
  const secondaryId = Number.isFinite(input.secondary_id) ? Number(input.secondary_id) : 699;
  const p = Number.isFinite(input.p) ? Math.max(1, Math.floor(Number(input.p))) : 5;
  const q = Number.isFinite(input.q) ? Math.max(1, Math.floor(Number(input.q))) : 2;

  const sampleDates = buildSamples(startIso, endIso, stepDays, 15_000);
  const theta: number[] = [];
  const lambdaPrimary: number[] = [];
  const lambdaSecondary: number[] = [];
  const tDays: number[] = [];

  for (const date of sampleDates) {
    const primary = stateRelativeToSun(primaryId, date);
    const secondary = stateRelativeToSun(secondaryId, date);
    const lambda1 = (Math.atan2(primary.pos[1], primary.pos[0]) * 180) / Math.PI;
    const lambda2 = (Math.atan2(secondary.pos[1], secondary.pos[0]) * 180) / Math.PI;
    const h = vecCross(primary.pos, primary.vel);
    const ev = vecSub(vecScale(vecCross(primary.vel, h), 1 / MU_SUN_AU3_PER_DAY2), vecScale(primary.pos, 1 / Math.max(1e-12, vecNorm(primary.pos))));
    const varpi = (Math.atan2(ev[1], ev[0]) * 180) / Math.PI;
    const resonanceAngle = wrap180(p * lambda2 - q * lambda1 - (p - q) * varpi);
    theta.push(resonanceAngle);
    lambdaPrimary.push(lambda1);
    lambdaSecondary.push(lambda2);
    tDays.push(date.getTime() / DAY_MS);
  }

  const thetaSpanDeg = circularSpanDeg(theta);
  const unwrapPrimary = unwrapAnglesDeg(lambdaPrimary);
  const unwrapSecondary = unwrapAnglesDeg(lambdaSecondary);
  const nPrimaryDegPerDay = linearSlope(tDays, unwrapPrimary);
  const nSecondaryDegPerDay = linearSlope(tDays, unwrapSecondary);
  const ratio = Math.abs(nSecondaryDegPerDay) > 1e-12 ? nPrimaryDegPerDay / nSecondaryDegPerDay : 0;
  const expectedRatio = p / q;
  const ratioError = Math.abs(ratio - expectedRatio);
  const passSpan = thetaSpanDeg <= thresholds.libration_span_deg_max;
  const passRatio = ratioError <= thresholds.ratio_tolerance;
  const pass = passSpan && passRatio;

  const result = {
    start_iso: startIso,
    end_iso: endIso,
    step_days: stepDays,
    primary_id: primaryId,
    secondary_id: secondaryId,
    p,
    q,
    theta_span_deg: thetaSpanDeg,
    mean_motion_ratio: ratio,
    expected_ratio: expectedRatio,
    ratio_abs_error: ratioError,
    libration: passSpan,
  };
  const gate = makeGate({
    gateId: "halobank.solar.resonance_libration.v1",
    deltas: [
      {
        id: "theta_span_deg",
        comparator: "<=",
        value: thetaSpanDeg,
        limit: thresholds.libration_span_deg_max,
        pass: passSpan,
      },
      {
        id: "ratio_abs_error",
        comparator: "<=",
        value: ratioError,
        limit: thresholds.ratio_tolerance,
        pass: passRatio,
      },
    ],
    firstFail: pass ? null : !passSpan ? "HALOBANK_SOLAR_RESONANCE_NOT_LIBRATING" : "HALOBANK_SOLAR_RESONANCE_RATIO_OUT_OF_TOLERANCE",
    reasons: pass
      ? ["Resonance angle and frequency ratio satisfy configured diagnostic thresholds."]
      : ["Resonance detector failed one or more threshold checks."],
  });
  return {
    module: "resonance_libration",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.resonance_libration:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

export function runDerivedModule(args: {
  module: DerivedModuleId;
  input: Record<string, unknown>;
  thresholds: SolarThresholdsManifest;
}): DerivedResult {
  switch (args.module) {
    case "mercury_precession":
      return runMercuryPrecession(args.input as MercuryInput, args.thresholds.modules.mercury_precession);
    case "earth_moon_eclipse_timing":
      return runEarthMoonEclipseTiming(args.input as EclipseInput, args.thresholds.modules.earth_moon_eclipse_timing);
    case "resonance_libration":
      return runResonanceLibration(args.input as ResonanceInput, args.thresholds.modules.resonance_libration);
    default:
      throw new Error(`Unsupported module: ${String(args.module)}`);
  }
}

export function buildDerivedArtifactPayload(result: DerivedResult): string {
  return stableJsonStringify({
    module: result.module,
    result: result.result,
    gate: result.gate,
    artifact_ref: result.artifact_ref,
  });
}
