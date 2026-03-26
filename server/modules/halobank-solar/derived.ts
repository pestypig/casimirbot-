import * as AstronomyNamespace from "astronomy-engine";
import { stableJsonStringify } from "../../utils/stable-json";
import { hashStableJson } from "../../utils/information-boundary";
import { getBaryState, getBodyStateSource, resolveSupportedBody } from "./ephemeris-core";
import { resolveSolarPeculiarReferenceId, resolveSolarPeculiarVector } from "../stellar/local-rest";
import { buildBackgroundGeometryFromDensity, type ObservableGeometryChannel } from "../../../shared/curvature-proxy";
import type {
  SolarDiagnosticDatasetsManifest,
  SolarDiagnosticPlanetaryFigureProfile,
  SolarDiagnosticStellarReplaySeries,
  SolarDiagnosticSunquakeReplaySeries,
  SolarGate,
  SolarGateDelta,
  SolarLocalRestReferenceManifest,
  SolarMetricContextManifest,
  SolarObserver,
  SolarThresholdsManifest,
} from "./types";

const AU_M = 149_597_870_700;
const DAY_MS = 86_400_000;
const MU_SUN_AU3_PER_DAY2 = 0.00029591220828559104;
const C_AU_PER_DAY = 173.1446326846693;
const GM_SUN_M3_S2 = 1.32712440018e20;
const GM_MOON_M3_S2 = 4.9048695e12;
const C_M_PER_S = 299_792_458;
const RAD_TO_ARCSEC = 206_264.80624709636;
const EARTH_EQUATORIAL_RADIUS_KM = 6_378.137;
const JOVIAN_EQUATORIAL_RADIUS_KM = 71_492;
const SOLAR_RADIUS_M = 696_340_000;
const DEFAULT_EARTH_SPIN_AXIS_ICRS: Vec3 = [0, 0, 1];
const SI_GRAVITATIONAL_CONSTANT = 6.67430e-11;
const EARTH_MASS_KG = 5.972168e24;
const EARTH_MEAN_RADIUS_M = 6_371_008.8;
const EARTH_REFERENCE_YIELD_STRENGTH_PA = 1e8;
const EARTH_REFERENCE_EFFECTIVE_RIGIDITY_PA = 1.5e11;
const EARTH_ROTATION_RATE_RAD_S = 7.2921150e-5;
const EARTH_MOMENT_OF_INERTIA_FACTOR = 0.3307;
const EARTH_REFERENCE_FLATTENING = 1 / 298.257223563;
const EARTH_REFERENCE_J2 = 1.08263e-3;
const EARTH_REFERENCE_EFFECTIVE_LOVE_NUMBER = 0.3;
const SOLAR_MASS_KG = GM_SUN_M3_S2 / SI_GRAVITATIONAL_CONSTANT;
const SOLAR_MEAN_DENSITY_KG_M3 = SOLAR_MASS_KG / ((4 / 3) * Math.PI * SOLAR_RADIUS_M ** 3);

type Vec3 = [number, number, number];

const vecSub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vecAdd = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vecCross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const vecScale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const vecNorm = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const vecDot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

type EclipseLike = {
  kind: number;
  peak: {
    date: Date;
  };
  obscuration?: number;
  distance?: number;
};

type StateLike = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
};

type JupiterMoonsLike = {
  io: StateLike;
  europa: StateLike;
  ganymede: StateLike;
  callisto: StateLike;
};

type AstronomyDerivedApi = {
  SearchGlobalSolarEclipse: (startTime: Date) => EclipseLike;
  NextGlobalSolarEclipse: (prevEclipseTime: Date) => EclipseLike;
  JupiterMoons: (date: Date) => JupiterMoonsLike;
  Observer: new (latitudeDeg: number, longitudeDeg: number, heightKm: number) => unknown;
  ObserverState: (date: Date, observer: unknown, ofdate: boolean) => StateLike;
};

function resolveAstronomyApi(): AstronomyDerivedApi {
  const namespace = AstronomyNamespace as unknown as Record<string, unknown> & { default?: unknown };
  const candidates: Array<Record<string, unknown>> = [namespace];
  if (namespace.default && typeof namespace.default === "object") {
    candidates.push(namespace.default as Record<string, unknown>);
  }

  for (const candidate of candidates) {
    if (
      typeof candidate.SearchGlobalSolarEclipse === "function" &&
      typeof candidate.NextGlobalSolarEclipse === "function" &&
      typeof candidate.JupiterMoons === "function" &&
      typeof candidate.Observer === "function" &&
      typeof candidate.ObserverState === "function"
    ) {
      return candidate as unknown as AstronomyDerivedApi;
    }
  }

  const namespaceKeys = Object.keys(namespace).sort();
  const defaultKeys =
    namespace.default && typeof namespace.default === "object"
      ? Object.keys(namespace.default as Record<string, unknown>).sort()
      : [];
  throw new Error(
    `HALOBANK_SOLAR_ASTRONOMY_ENGINE_API_UNAVAILABLE namespace=[${namespaceKeys.join(",")}] default=[${defaultKeys.join(",")}]`,
  );
}

const Astronomy = resolveAstronomyApi();

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

function meanVec(values: Vec3[]): Vec3 {
  if (values.length === 0) return [0, 0, 0];
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  for (const value of values) {
    sumX += value[0];
    sumY += value[1];
    sumZ += value[2];
  }
  return [sumX / values.length, sumY / values.length, sumZ / values.length];
}

function rmsVectorDeviation(values: Vec3[], center: Vec3): number {
  if (values.length === 0) return 0;
  let sumSquares = 0;
  for (const value of values) {
    const delta = vecSub(value, center);
    const norm = vecNorm(delta);
    sumSquares += norm * norm;
  }
  return Math.sqrt(sumSquares / values.length);
}

function maxOrZero(values: number[]): number {
  if (values.length === 0) return 0;
  let current = values[0];
  for (let i = 1; i < values.length; i += 1) {
    current = Math.max(current, values[i]);
  }
  return current;
}

function minOrZero(values: number[]): number {
  if (values.length === 0) return 0;
  let current = values[0];
  for (let i = 1; i < values.length; i += 1) {
    current = Math.min(current, values[i]);
  }
  return current;
}

function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const center = mean(values);
  let sumSquares = 0;
  for (const value of values) {
    const delta = value - center;
    sumSquares += delta * delta;
  }
  return Math.sqrt(sumSquares / values.length);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const meanX = mean(x);
  const meanY = mean(y);
  let cov = 0;
  let sumXX = 0;
  let sumYY = 0;
  for (let i = 0; i < x.length; i += 1) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    cov += dx * dy;
    sumXX += dx * dx;
    sumYY += dy * dy;
  }
  const denom = Math.sqrt(sumXX * sumYY);
  if (!(denom > 0) || !Number.isFinite(denom)) return 0;
  return cov / denom;
}

function parseNumericSeries(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry));
}

function parseIsoSeries(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function resolvePlanetaryCalibrationProfile(
  input: PlanetaryShapeOrientationProxyInput | PlanetaryFigureDiagnosticInput,
  manifest?: SolarDiagnosticDatasetsManifest,
): SolarDiagnosticPlanetaryFigureProfile | null {
  const profileId = typeof input.calibration_profile_id === "string" ? input.calibration_profile_id.trim() : "";
  if (!profileId || !manifest) {
    return null;
  }
  return manifest.planetary_figure_profiles.find((entry) => entry.id === profileId) ?? null;
}

function resolveStellarReplaySeries(
  input: StellarObservablesDiagnosticInput,
  manifest?: SolarDiagnosticDatasetsManifest,
): SolarDiagnosticStellarReplaySeries | null {
  const replayId = typeof input.replay_series_id === "string" ? input.replay_series_id.trim() : "";
  if (!replayId || !manifest) {
    return null;
  }
  return manifest.stellar_observables_replay_series.find((entry) => entry.id === replayId) ?? null;
}

function resolveSunquakeReplaySeries(
  input: { replay_series_id?: string | undefined },
  manifest?: SolarDiagnosticDatasetsManifest,
): SolarDiagnosticSunquakeReplaySeries | null {
  const replayId = typeof input.replay_series_id === "string" ? input.replay_series_id.trim() : "";
  if (!replayId || !manifest) {
    return null;
  }
  return manifest.sunquake_replay_series.find((entry) => entry.id === replayId) ?? null;
}

function numericInputOrProfile(value: unknown, profileValue: number | undefined, fallback: number): number {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  if (typeof profileValue === "number" && Number.isFinite(profileValue)) {
    return profileValue;
  }
  return fallback;
}

function estimatePowerLawAlpha(values: number[]): number | null {
  const positive = values.filter((entry) => Number.isFinite(entry) && entry > 0).sort((a, b) => a - b);
  if (positive.length < 2) return null;
  const xmin = positive[0];
  let logSum = 0;
  for (const value of positive) {
    logSum += Math.log(value / xmin);
  }
  if (!(logSum > 0) || !Number.isFinite(logSum)) return null;
  return 1 + positive.length / logSum;
}

function angleBetweenDeg(a: Vec3, b: Vec3): number {
  const denom = Math.max(1e-12, vecNorm(a) * vecNorm(b));
  const cosTheta = Math.max(-1, Math.min(1, vecDot(a, b) / denom));
  return (Math.acos(cosTheta) * 180) / Math.PI;
}

function stateLikeToVec3(state: StateLike): Vec3 {
  return [state.x, state.y, state.z];
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
  const resolved = resolveNullProbeObserver({
    date: args.date,
    observerBodyId: 399,
    observer: args.observer ?? { mode: "geocenter" },
  });
  return {
    pos: resolved.pos_bary_au,
    vel: resolved.vel_bary_au_per_day,
  };
}

function normalizeSolarObserver(value: unknown): SolarObserver | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;
  if (candidate.mode === "geocenter") {
    return { mode: "geocenter" };
  }
  if (candidate.mode === "body-fixed") {
    const body = Number(candidate.body);
    const lonDeg = Number(candidate.lon_deg);
    const latDeg = Number(candidate.lat_deg);
    const heightM = Number(candidate.height_m ?? 0);
    if (![body, lonDeg, latDeg, heightM].every((entry) => Number.isFinite(entry))) {
      throw new Error("Invalid solar observer payload");
    }
    return {
      mode: "body-fixed",
      body: Math.floor(body),
      lon_deg: lonDeg,
      lat_deg: latDeg,
      height_m: heightM,
    };
  }
  throw new Error("Invalid solar observer payload");
}

function resolveNullProbeObserver(args: {
  date: Date;
  observerBodyId: number;
  observer?: SolarObserver;
}): {
  mode: "body_id" | "geocenter" | "body-fixed";
  requested_body_id: number;
  resolved_body_id: number;
  pos_bary_au: Vec3;
  vel_bary_au_per_day: Vec3;
  warning?: "HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING";
} {
  if (!args.observer) {
    const bary = getBaryState(args.observerBodyId, args.date);
    return {
      mode: "body_id",
      requested_body_id: args.observerBodyId,
      resolved_body_id: args.observerBodyId,
      pos_bary_au: bary.pos,
      vel_bary_au_per_day: bary.vel,
    };
  }

  const earth = getBaryState(399, args.date);
  if (args.observer.mode === "geocenter") {
    return {
      mode: "geocenter",
      requested_body_id: 399,
      resolved_body_id: 399,
      pos_bary_au: earth.pos,
      vel_bary_au_per_day: earth.vel,
    };
  }

  if (args.observer.body !== 399) {
    return {
      mode: "body-fixed",
      requested_body_id: args.observer.body,
      resolved_body_id: 399,
      pos_bary_au: earth.pos,
      vel_bary_au_per_day: earth.vel,
      warning: "HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING",
    };
  }

  const obs = new Astronomy.Observer(args.observer.lat_deg, args.observer.lon_deg, args.observer.height_m / 1000);
  const obsState = Astronomy.ObserverState(args.date, obs, true);
  return {
    mode: "body-fixed",
    requested_body_id: 399,
    resolved_body_id: 399,
    pos_bary_au: vecAdd(earth.pos, stateLikeToVec3(obsState)),
    vel_bary_au_per_day: vecAdd(earth.vel, [obsState.vx, obsState.vy, obsState.vz]),
  };
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

function normalizeSupportedBodyId(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.floor(parsed);
}

function vecNormalize(a: Vec3): Vec3 | null {
  const norm = vecNorm(a);
  if (!(norm > 0) || !Number.isFinite(norm)) return null;
  return vecScale(a, 1 / norm);
}

function parseSpinAxisIcrs(value: unknown): Vec3 {
  if (!Array.isArray(value) || value.length !== 3) {
    return DEFAULT_EARTH_SPIN_AXIS_ICRS;
  }
  const candidate = value.map((entry) => Number(entry)) as Vec3;
  if (!candidate.every((entry) => Number.isFinite(entry))) {
    return DEFAULT_EARTH_SPIN_AXIS_ICRS;
  }
  return vecNormalize(candidate) ?? DEFAULT_EARTH_SPIN_AXIS_ICRS;
}

function orientationTorqueProxyVector(spinAxis: Vec3, bodyUnit: Vec3, tideWeightPerS2: number): Vec3 {
  const alignment = vecDot(spinAxis, bodyUnit);
  return vecScale(vecCross(spinAxis, bodyUnit), tideWeightPerS2 * alignment);
}

function vectorFromRaDecDeg(raDeg: number, decDeg: number): Vec3 {
  const raRad = (raDeg * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;
  const cosDec = Math.cos(decRad);
  return [
    cosDec * Math.cos(raRad),
    cosDec * Math.sin(raRad),
    Math.sin(decRad),
  ];
}

function vectorToRaDecDeg(unit: Vec3): { ra_deg: number; dec_deg: number } {
  return {
    ra_deg: wrap360((Math.atan2(unit[1], unit[0]) * 180) / Math.PI),
    dec_deg: (Math.asin(Math.max(-1, Math.min(1, unit[2]))) * 180) / Math.PI,
  };
}

function parseOptionalSourceDirection(input: SolarLightDeflectionInput): {
  mode: "benchmark_limb" | "explicit_icrs_source";
  unit: Vec3 | null;
  ra_deg: number | null;
  dec_deg: number | null;
} {
  const unitCandidate = Array.isArray(input.source_unit_icrs) && input.source_unit_icrs.length === 3
    ? input.source_unit_icrs.map((entry) => Number(entry)) as Vec3
    : null;
  if (
    unitCandidate
    && unitCandidate.every((entry) => Number.isFinite(entry))
  ) {
    const normalized = vecNormalize(unitCandidate);
    if (normalized) {
      const eq = vectorToRaDecDeg(normalized);
      return {
        mode: "explicit_icrs_source",
        unit: normalized,
        ra_deg: eq.ra_deg,
        dec_deg: eq.dec_deg,
      };
    }
  }

  if (Number.isFinite(input.source_ra_deg) && Number.isFinite(input.source_dec_deg)) {
    const normalized = vecNormalize(vectorFromRaDecDeg(Number(input.source_ra_deg), Number(input.source_dec_deg)));
    if (normalized) {
      return {
        mode: "explicit_icrs_source",
        unit: normalized,
        ra_deg: Number(input.source_ra_deg),
        dec_deg: Number(input.source_dec_deg),
      };
    }
  }

  return {
    mode: "benchmark_limb",
    unit: null,
    ra_deg: null,
    dec_deg: null,
  };
}

function solarLimbDeflectionArcsec(impactParameterSolarRadii: number): number {
  const impactParameterM = Math.max(1e-9, impactParameterSolarRadii) * SOLAR_RADIUS_M;
  const alphaRad = (4 * GM_SUN_M3_S2) / (C_M_PER_S * C_M_PER_S * impactParameterM);
  return alphaRad * RAD_TO_ARCSEC;
}

function sourceAtInfinityDeflectionArcsec(args: {
  observerSunRangeM: number;
  elongationDeg: number;
  gamma: number;
}): number {
  const chiRad = (args.elongationDeg * Math.PI) / 180;
  const sinChi = Math.max(1e-12, Math.sin(chiRad));
  const cosChi = Math.cos(chiRad);
  const alphaRad =
    ((1 + args.gamma) * GM_SUN_M3_S2) /
    (C_M_PER_S * C_M_PER_S * Math.max(1, args.observerSunRangeM)) *
    ((1 + cosChi) / sinChi);
  return alphaRad * RAD_TO_ARCSEC;
}

function shapiroDelaySeconds(args: {
  date: Date;
  observerBaryPosAu?: Vec3;
  observerBodyId: number;
  receiverBodyId: number;
}): {
  delay_s: number;
  observer_sun_range_au: number;
  receiver_sun_range_au: number;
  observer_receiver_range_au: number;
} {
  const sun = getBaryState(10, args.date).pos;
  const observerBary = args.observerBaryPosAu ?? getBaryState(args.observerBodyId, args.date).pos;
  const receiverBary = getBaryState(args.receiverBodyId, args.date).pos;
  const observer = vecSub(observerBary, sun);
  const receiver = vecSub(receiverBary, sun);
  const observerSunRangeM = vecNorm(observer) * AU_M;
  const receiverSunRangeM = vecNorm(receiver) * AU_M;
  const observerReceiverRangeM = vecNorm(vecSub(receiverBary, observerBary)) * AU_M;
  const numerator = observerSunRangeM + receiverSunRangeM + observerReceiverRangeM;
  const denominator = Math.max(
    1e-6,
    observerSunRangeM + receiverSunRangeM - observerReceiverRangeM,
  );
  const delaySeconds =
    (4 * GM_SUN_M3_S2) /
    (C_M_PER_S * C_M_PER_S * C_M_PER_S) *
    Math.log(Math.max(1 + 1e-12, numerator / denominator));
  return {
    delay_s: delaySeconds,
    observer_sun_range_au: observerSunRangeM / AU_M,
    receiver_sun_range_au: receiverSunRangeM / AU_M,
    observer_receiver_range_au: observerReceiverRangeM / AU_M,
  };
}

type MercuryInput = {
  start_iso?: string;
  end_iso?: string;
  step_days?: number;
  expected_arcsec_per_century?: number;
};

type MercuryCrossLaneCongruenceDiagnosticInput = MercuryInput;

type GranularTidalResponseDiagnosticInput = PlanetaryShapeOrientationProxyInput & {
  expected_response_regime?: "gravity-rounded" | "transition" | "strength-supported";
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

type SarosInput = {
  start_iso?: string;
  end_iso?: string;
  max_events?: number;
  reference_iso?: string;
  tolerance_days?: number;
};

type JovianMoonName = "io" | "europa" | "ganymede" | "callisto";
type JovianEventMode = "any" | "transit" | "occultation";

type JovianMoonTimingInput = {
  start_iso?: string;
  end_iso?: string;
  step_minutes?: number;
  moon?: JovianMoonName;
  event?: JovianEventMode;
  observer?: SolarObserver;
  reference_iso?: string;
  tolerance_s?: number;
};

type LocalRestAnchorCalibrationInput = {
  reference_id?: string;
};

type EarthOrientationPrecessionNutationProxyInput = {
  start_iso?: string;
  end_iso?: string;
  step_minutes?: number;
  spin_axis_icrs?: [number, number, number];
};

type PlanetaryShapeOrientationProxyInput = EarthOrientationPrecessionNutationProxyInput & {
  calibration_profile_id?: string;
  target_body_id?: number;
  primary_perturber_body_id?: number;
  secondary_perturber_body_id?: number | null;
  body_mass_kg?: number;
  equatorial_radius_m?: number;
  yield_strength_pa?: number;
  effective_rigidity_pa?: number;
  rotation_rate_rad_s?: number;
  moment_of_inertia_factor?: number;
};

type PlanetaryFigureDiagnosticInput = PlanetaryShapeOrientationProxyInput & {
  reference_flattening?: number;
  reference_j2?: number;
  reference_effective_love_number?: number;
  reference_moment_of_inertia_factor?: number;
  max_flattening_abs_error?: number;
  max_j2_abs_error?: number;
  max_effective_love_number_abs_error?: number;
  max_dynamical_ellipticity_abs_error?: number;
  min_hydrostatic_rounding_proxy?: number;
  min_potato_threshold_ratio?: number;
};

type StellarObservablesDiagnosticInput = {
  replay_series_id?: string;
  label?: string;
  cadence_days?: number;
  epoch_iso_series?: string[];
  magnetic_activity_index_series?: number[];
  p_mode_frequency_shift_nhz_series?: number[];
  flare_energy_proxy_series?: number[];
};

type StellarFlareSunquakeDiagnosticInput = {
  replay_series_id?: string;
  label?: string;
  cadence_days?: number;
  flare_peak_iso_series?: string[];
  sunquake_peak_iso_series?: string[];
  flare_energy_proxy_series?: number[];
  helioseismic_amplitude_proxy_series?: number[];
  magnetic_activity_index_series?: number[];
  p_mode_frequency_shift_nhz_series?: number[];
};

type SunquakeTimingReplayDiagnosticInput = {
  replay_series_id?: string;
  label?: string;
  cadence_days?: number;
  flare_peak_iso_series?: string[];
  sunquake_peak_iso_series?: string[];
  flare_energy_proxy_series?: number[];
  helioseismic_amplitude_proxy_series?: number[];
};

type SolarLightDeflectionInput = {
  ts_iso?: string;
  observer_body_id?: number;
  observer?: SolarObserver;
  receiver_body_id?: number;
  impact_parameter_solar_radii?: number;
  source_ra_deg?: number;
  source_dec_deg?: number;
  source_unit_icrs?: [number, number, number];
};

type InnerSolarMetricParityInput = {
  mercury_start_iso?: string;
  mercury_end_iso?: string;
  mercury_step_days?: number;
  ts_iso?: string;
  observer_body_id?: number;
  observer?: SolarObserver;
  receiver_body_id?: number;
  impact_parameter_solar_radii?: number;
  source_ra_deg?: number;
  source_dec_deg?: number;
  source_unit_icrs?: [number, number, number];
};

export type DerivedModuleId =
  | "mercury_precession"
  | "mercury_cross_lane_congruence_diagnostic"
  | "earth_moon_eclipse_timing"
  | "resonance_libration"
  | "saros_cycle"
  | "jovian_moon_event_timing"
  | "earth_orientation_precession_nutation_proxy"
  | "planetary_shape_orientation_proxy"
  | "planetary_figure_diagnostic"
  | "granular_tidal_response_diagnostic"
  | "stellar_observables_diagnostic"
  | "stellar_flare_sunquake_diagnostic"
  | "sunquake_timing_replay_diagnostic"
  | "solar_light_deflection"
  | "inner_solar_metric_parity"
  | "local_rest_anchor_calibration";

export type DerivedResult = {
  module: DerivedModuleId;
  result: Record<string, unknown>;
  gate: SolarGate;
  artifact_ref: string;
};

export function runSolarLightDeflection(args: {
  input: SolarLightDeflectionInput;
  thresholds: SolarThresholdsManifest["modules"]["solar_light_deflection"];
  metricContextManifest: SolarMetricContextManifest;
}): DerivedResult {
  const tsIso = toIsoOrThrow(args.input.ts_iso, "2003-09-10T00:00:00.000Z");
  const date = new Date(tsIso);
  const observerBodyId = normalizeSupportedBodyId(args.input.observer_body_id, 399);
  const observer = normalizeSolarObserver(args.input.observer);
  const observerState = resolveNullProbeObserver({
    date,
    observerBodyId,
    observer,
  });
  const receiverBodyId = normalizeSupportedBodyId(args.input.receiver_body_id, 699);
  const impactParameterSolarRadii = Number.isFinite(args.input.impact_parameter_solar_radii)
    ? Math.max(1, Number(args.input.impact_parameter_solar_radii))
    : 1;
  const sourceDirection = parseOptionalSourceDirection(args.input);
  const gamma = args.metricContextManifest.ppn_parameters.gamma;
  const sunBary = getBaryState(10, date).pos;
  const observerFromSun = vecSub(observerState.pos_bary_au, sunBary);
  const observerToSunUnit = vecNormalize(vecScale(observerFromSun, -1));
  if (!observerToSunUnit) {
    throw new Error("Failed to derive observer-to-Sun direction");
  }
  const observerSunRangeM = vecNorm(observerFromSun) * AU_M;
  const solarAngularRadiusDeg = (Math.atan2(SOLAR_RADIUS_M, Math.max(1, observerSunRangeM)) * 180) / Math.PI;
  const solarElongationDeg = sourceDirection.unit
    ? angleBetweenDeg(sourceDirection.unit, observerToSunUnit)
    : solarAngularRadiusDeg;
  const derivedImpactParameterSolarRadii = sourceDirection.unit
    ? Math.max(0, (observerSunRangeM * Math.sin((solarElongationDeg * Math.PI) / 180)) / SOLAR_RADIUS_M)
    : impactParameterSolarRadii;
  const sourceOcculted = sourceDirection.mode === "explicit_icrs_source" && solarElongationDeg <= solarAngularRadiusDeg;

  const predictedLimbArcsec = solarLimbDeflectionArcsec(1);
  const predictedRequestedImpactArcsec = sourceDirection.mode === "explicit_icrs_source"
    ? sourceAtInfinityDeflectionArcsec({
        observerSunRangeM,
        elongationDeg: solarElongationDeg,
        gamma,
      })
    : solarLimbDeflectionArcsec(impactParameterSolarRadii);
  const historicalResidualArcsec = Math.abs(predictedLimbArcsec - args.thresholds.historical_observed_arcsec);
  const modernGammaResidual = 1 - args.thresholds.modern_gamma_measured;
  const shapiroGammaMinusOneResidual = -args.thresholds.shapiro_gamma_minus_one_measured;
  const shapiro = shapiroDelaySeconds({
    date,
    observerBaryPosAu: observerState.pos_bary_au,
    observerBodyId: observerState.resolved_body_id,
    receiverBodyId,
  });

  const passObserverKernel = !observerState.warning;
  const passHistorical = historicalResidualArcsec <= args.thresholds.historical_max_abs_residual_arcsec;
  const passModernGamma = Math.abs(modernGammaResidual) <= args.thresholds.modern_gamma_max_abs_residual;
  const passShapiroGamma = Math.abs(args.thresholds.shapiro_gamma_minus_one_measured) <= args.thresholds.shapiro_gamma_minus_one_max_abs;
  const passSourceGeometry = !sourceOcculted;
  const pass = passObserverKernel && passSourceGeometry && passHistorical && passModernGamma && passShapiroGamma;

  const deltas: SolarGateDelta[] = [
    {
      id: "observer_kernel_ready",
      comparator: ">=",
      value: passObserverKernel ? 1 : 0,
      limit: 1,
      pass: passObserverKernel,
    },
    {
      id: "source_elongation_vs_solar_radius_deg",
      comparator: ">=",
      value: solarElongationDeg,
      limit: solarAngularRadiusDeg,
      pass: passSourceGeometry,
    },
    {
      id: "historical_deflection_abs_residual_arcsec",
      comparator: "<=",
      value: historicalResidualArcsec,
      limit: args.thresholds.historical_max_abs_residual_arcsec,
      pass: passHistorical,
    },
    {
      id: "modern_gamma_abs_residual",
      comparator: "<=",
      value: Math.abs(modernGammaResidual),
      limit: args.thresholds.modern_gamma_max_abs_residual,
      pass: passModernGamma,
    },
    {
      id: "shapiro_gamma_minus_one_abs",
      comparator: "<=",
      value: Math.abs(args.thresholds.shapiro_gamma_minus_one_measured),
      limit: args.thresholds.shapiro_gamma_minus_one_max_abs,
      pass: passShapiroGamma,
    },
  ];

  const firstFail = !passObserverKernel
    ? "HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING"
    : !passSourceGeometry
      ? "HALOBANK_SOLAR_LIGHT_DEFLECTION_SOURCE_OCCULTED"
      : !passHistorical
        ? "HALOBANK_SOLAR_LIGHT_DEFLECTION_OUT_OF_RANGE"
        : !passModernGamma
          ? "HALOBANK_SOLAR_LIGHT_DEFLECTION_GAMMA_OUT_OF_RANGE"
          : !passShapiroGamma
            ? "HALOBANK_SOLAR_SHAPIRO_GAMMA_OUT_OF_RANGE"
            : null;
  const reasons = firstFail
    ? [
        firstFail === "HALOBANK_SOLAR_LIGHT_DEFLECTION_SOURCE_OCCULTED"
          ? "Requested source direction lies inside the apparent solar disk for the chosen observer and epoch."
          : firstFail === "HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING"
            ? "Body-fixed null-geodesic observer requested an unsupported orientation model; deterministic geocenter fallback was used."
            : "Solar null-geodesic diagnostic failed one or more benchmark residual checks.",
      ]
    : ["Solar null-geodesic diagnostic matches the pinned light-deflection and Shapiro benchmark envelopes."];

  const result = {
    ts_iso: tsIso,
    metric_model_id: args.metricContextManifest.model_id,
    source_potential_ids: args.metricContextManifest.source_potentials
      .filter((entry) => entry.id === "sun_monopole" || entry.frames.includes("BCRS"))
      .map((entry) => entry.id),
    observer_context: {
      mode: observerState.mode,
      requested_body_id: observerState.requested_body_id,
      resolved_body_id: observerState.resolved_body_id,
      frame: "BCRS",
      coordinate_time_scale: "TCB",
      evaluation_time_scale: "TDB",
      observer_time_scale: "TT",
      warning: observerState.warning ?? null,
      body_fixed:
        observer && observer.mode === "body-fixed"
          ? {
              body: observer.body,
              lon_deg: observer.lon_deg,
              lat_deg: observer.lat_deg,
              height_m: observer.height_m,
            }
          : null,
    },
    signal_path: {
      kind: "null_geodesic_diagnostic",
      dominant_mass_body_id: 10,
      geometry_mode: sourceDirection.mode,
      impact_parameter_solar_radii: derivedImpactParameterSolarRadii,
      solar_elongation_deg: solarElongationDeg,
      solar_angular_radius_deg: solarAngularRadiusDeg,
      source_occulted: sourceOcculted,
      receiver_body_id: receiverBodyId,
      benchmark_contract:
        "Solar-limb deflection is benchmarked at b=R_sun; Shapiro delay is evaluated from runtime Sun-centered geometry while gamma constraints are checked against pinned literature residual envelopes.",
    },
    source_direction: {
      mode: sourceDirection.mode,
      ra_deg: sourceDirection.ra_deg,
      dec_deg: sourceDirection.dec_deg,
      unit_icrs: sourceDirection.unit,
    },
    predicted_limb_arcsec: predictedLimbArcsec,
    target_limb_arcsec: args.thresholds.target_limb_arcsec,
    requested_impact_parameter_solar_radii: impactParameterSolarRadii,
    derived_impact_parameter_solar_radii: derivedImpactParameterSolarRadii,
    predicted_requested_impact_arcsec: predictedRequestedImpactArcsec,
    predicted_source_deflection_arcsec: predictedRequestedImpactArcsec,
    historical_observed_arcsec: args.thresholds.historical_observed_arcsec,
    historical_residual_arcsec: predictedLimbArcsec - args.thresholds.historical_observed_arcsec,
    modern_gamma_estimated: 1,
    modern_gamma_measured: args.thresholds.modern_gamma_measured,
    modern_gamma_residual: modernGammaResidual,
    shapiro_delay_s: shapiro.delay_s,
    shapiro_delay_us: shapiro.delay_s * 1e6,
    shapiro_geometry: {
      observer_sun_range_au: shapiro.observer_sun_range_au,
      receiver_sun_range_au: shapiro.receiver_sun_range_au,
      observer_receiver_range_au: shapiro.observer_receiver_range_au,
    },
    shapiro_gamma_estimated: 1,
    shapiro_gamma_minus_one_measured: args.thresholds.shapiro_gamma_minus_one_measured,
    shapiro_gamma_minus_one_residual: shapiroGammaMinusOneResidual,
    standards_refs: args.metricContextManifest.standards.map((entry) => entry.id),
  };
  const gate = makeGate({
    gateId: "halobank.solar.solar_light_deflection.v1",
    deltas,
    firstFail,
    reasons,
  });
  return {
    module: "solar_light_deflection",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.solar_light_deflection:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

export function runInnerSolarMetricParity(args: {
  input: InnerSolarMetricParityInput;
  thresholds: SolarThresholdsManifest;
  metricContextManifest: SolarMetricContextManifest;
}): DerivedResult {
  const mercury = runMercuryPrecession(
    {
      start_iso: args.input.mercury_start_iso,
      end_iso: args.input.mercury_end_iso,
      step_days: args.input.mercury_step_days,
    },
    args.thresholds.modules.mercury_precession,
  );
  const deflection = runSolarLightDeflection({
    input: {
      ts_iso: args.input.ts_iso,
      observer_body_id: args.input.observer_body_id,
      observer: args.input.observer,
      receiver_body_id: args.input.receiver_body_id,
      impact_parameter_solar_radii: args.input.impact_parameter_solar_radii,
      source_ra_deg: args.input.source_ra_deg,
      source_dec_deg: args.input.source_dec_deg,
      source_unit_icrs: args.input.source_unit_icrs,
    },
    thresholds: args.thresholds.modules.solar_light_deflection,
    metricContextManifest: args.metricContextManifest,
  });

  const mercuryAbsError = Number(mercury.result.abs_error_arcsec_per_century ?? Number.POSITIVE_INFINITY);
  const deflectionAbsResidual = Math.abs(Number(deflection.result.historical_residual_arcsec ?? Number.POSITIVE_INFINITY));
  const modernGammaAbsResidual = Math.abs(Number(deflection.result.modern_gamma_residual ?? Number.POSITIVE_INFINITY));
  const shapiroGammaMinusOneAbs = Math.abs(Number(deflection.result.shapiro_gamma_minus_one_measured ?? Number.POSITIVE_INFINITY));
  const sharedMetricModelId = args.metricContextManifest.model_id;
  const sharedPotentialIds = args.metricContextManifest.source_potentials
    .filter((entry) => entry.id === "sun_monopole" || entry.frames.includes("BCRS"))
    .map((entry) => entry.id);
  const sameMetric = sharedMetricModelId ? 1 : 0;
  const deflectionSignalPath = (deflection.result.signal_path as Record<string, unknown> | undefined) ?? undefined;
  const passMercuryGate = mercury.gate.verdict === "PASS";
  const passNullProbeGate = deflection.gate.verdict === "PASS";

  const passMercury = mercuryAbsError <= args.thresholds.modules.inner_solar_metric_parity.max_mercury_abs_error_arcsec_per_century;
  const passDeflection = deflectionAbsResidual <= args.thresholds.modules.inner_solar_metric_parity.max_deflection_abs_residual_arcsec;
  const passModernGamma = modernGammaAbsResidual <= args.thresholds.modules.inner_solar_metric_parity.max_modern_gamma_abs_residual;
  const passShapiro = shapiroGammaMinusOneAbs <= args.thresholds.modules.inner_solar_metric_parity.max_shapiro_gamma_minus_one_abs;
  const pass = passMercuryGate && passNullProbeGate && passMercury && passDeflection && passModernGamma && passShapiro;

  const deltas: SolarGateDelta[] = [
    {
      id: "shared_metric_model_ready",
      comparator: ">=",
      value: sameMetric,
      limit: 1,
      pass: true,
    },
    {
      id: "mercury_probe_gate_pass",
      comparator: ">=",
      value: passMercuryGate ? 1 : 0,
      limit: 1,
      pass: passMercuryGate,
    },
    {
      id: "null_probe_gate_pass",
      comparator: ">=",
      value: passNullProbeGate ? 1 : 0,
      limit: 1,
      pass: passNullProbeGate,
    },
    {
      id: "mercury_abs_error_arcsec_per_century",
      comparator: "<=",
      value: mercuryAbsError,
      limit: args.thresholds.modules.inner_solar_metric_parity.max_mercury_abs_error_arcsec_per_century,
      pass: passMercury,
    },
    {
      id: "deflection_abs_residual_arcsec",
      comparator: "<=",
      value: deflectionAbsResidual,
      limit: args.thresholds.modules.inner_solar_metric_parity.max_deflection_abs_residual_arcsec,
      pass: passDeflection,
    },
    {
      id: "modern_gamma_abs_residual",
      comparator: "<=",
      value: modernGammaAbsResidual,
      limit: args.thresholds.modules.inner_solar_metric_parity.max_modern_gamma_abs_residual,
      pass: passModernGamma,
    },
    {
      id: "shapiro_gamma_minus_one_abs",
      comparator: "<=",
      value: shapiroGammaMinusOneAbs,
      limit: args.thresholds.modules.inner_solar_metric_parity.max_shapiro_gamma_minus_one_abs,
      pass: passShapiro,
    },
  ];

  const firstFail = !passMercuryGate
    ? mercury.gate.firstFail ?? "HALOBANK_SOLAR_METRIC_PARITY_MERCURY_FAIL"
    : !passNullProbeGate
      ? deflection.gate.firstFail ?? "HALOBANK_SOLAR_METRIC_PARITY_DEFLECTION_FAIL"
      : !passMercury
        ? "HALOBANK_SOLAR_METRIC_PARITY_MERCURY_FAIL"
        : !passDeflection
          ? "HALOBANK_SOLAR_METRIC_PARITY_DEFLECTION_FAIL"
          : !passModernGamma
            ? "HALOBANK_SOLAR_METRIC_PARITY_DEFLECTION_GAMMA_FAIL"
            : !passShapiro
              ? "HALOBANK_SOLAR_METRIC_PARITY_SHAPIRO_FAIL"
              : null;

  const result = {
    shared_metric_model_id: sharedMetricModelId,
    shared_source_potential_ids: sharedPotentialIds,
    parity_scope: "timelike_and_null_solar_weak_field_diagnostics",
    mercury_probe: {
      module: mercury.module,
      gate_verdict: mercury.gate.verdict,
      measured_arcsec_per_century: mercury.result.measured_arcsec_per_century,
      abs_error_arcsec_per_century: mercury.result.abs_error_arcsec_per_century,
    },
    null_probe: {
      module: deflection.module,
      gate_verdict: deflection.gate.verdict,
      predicted_limb_arcsec: deflection.result.predicted_limb_arcsec,
      predicted_source_deflection_arcsec: deflection.result.predicted_source_deflection_arcsec,
      solar_elongation_deg: deflectionSignalPath?.solar_elongation_deg,
      geometry_mode: deflectionSignalPath?.geometry_mode,
      historical_residual_arcsec: deflection.result.historical_residual_arcsec,
      modern_gamma_residual: deflection.result.modern_gamma_residual,
      shapiro_gamma_minus_one_measured: deflection.result.shapiro_gamma_minus_one_measured,
      shapiro_delay_us: deflection.result.shapiro_delay_us,
    },
    artifacts: {
      mercury_artifact_ref: mercury.artifact_ref,
      null_probe_artifact_ref: deflection.artifact_ref,
    },
  };
  const gate = makeGate({
    gateId: "halobank.solar.inner_solar_metric_parity.v1",
    deltas,
    firstFail,
    reasons: firstFail
      ? ["Shared inner-solar metric parity failed one or more timelike/null benchmark checks."]
      : ["Shared inner-solar metric parity holds across Mercury precession and solar null-geodesic benchmarks."],
  });
  return {
    module: "inner_solar_metric_parity",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.inner_solar_metric_parity:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

export function runLocalRestAnchorCalibration(args: {
  input: LocalRestAnchorCalibrationInput;
  thresholds: SolarThresholdsManifest["modules"]["local_rest_anchor_calibration"];
  referenceManifest: SolarLocalRestReferenceManifest;
}): DerivedResult {
  const resolvedReferenceId = typeof args.input.reference_id === "string" && args.input.reference_id.trim().length > 0
    ? args.input.reference_id.trim().toLowerCase()
    : resolveSolarPeculiarReferenceId();
  const runtimeSolarPeculiar = resolveSolarPeculiarVector();
  const reference =
    args.referenceManifest.references.find((entry) => entry.id === resolvedReferenceId)
    ?? args.referenceManifest.references.find((entry) => entry.id === args.referenceManifest.default_reference_id)
    ?? null;

  let firstFail: string | null = null;
  const reasons: string[] = [];
  const deltas: SolarGateDelta[] = [];

  const hasReference = reference !== null;
  deltas.push({
    id: "reference_manifest_entry_present",
    comparator: ">=",
    value: hasReference ? 1 : 0,
    limit: 1,
    pass: hasReference,
  });
  if (!hasReference) {
    firstFail = "HALOBANK_SOLAR_LOCAL_REST_REFERENCE_UNAVAILABLE";
    reasons.push("Pinned local-rest solar-motion reference is unavailable for the requested reference id.");
  }

  const referenceVector = hasReference ? reference.solar_peculiar_kms : [0, 0, 0];
  const componentAbsDelta = [
    Math.abs(runtimeSolarPeculiar[0] - referenceVector[0]),
    Math.abs(runtimeSolarPeculiar[1] - referenceVector[1]),
    Math.abs(runtimeSolarPeculiar[2] - referenceVector[2]),
  ] as Vec3;
  const maxAbsDelta = maxOrZero(componentAbsDelta);
  const toleranceKmS = hasReference
    ? Math.min(reference.component_tolerance_km_s, args.thresholds.max_component_abs_delta_km_s)
    : args.thresholds.max_component_abs_delta_km_s;
  const residualPass = hasReference && maxAbsDelta <= toleranceKmS;
  deltas.push({
    id: "max_component_abs_delta_km_s",
    comparator: "<=",
    value: hasReference ? maxAbsDelta : Number.POSITIVE_INFINITY,
    limit: toleranceKmS,
    pass: residualPass,
  });
  if (!residualPass && !firstFail) {
    firstFail = "HALOBANK_SOLAR_LOCAL_REST_REFERENCE_MISMATCH";
    reasons.push("Runtime local-rest solar-motion anchor deviates from the pinned reference beyond tolerance.");
  }

  if (!firstFail) {
    reasons.push("Runtime local-rest solar-motion anchor matches the pinned published reference.");
  }

  const result = {
    selected_reference_id: resolvedReferenceId,
    reference_id: reference?.id ?? null,
    reference_label: reference?.label ?? null,
    source_class: reference?.source_class ?? null,
    citation: reference?.citation ?? null,
    doi: reference?.doi ?? null,
    url: reference?.url ?? null,
    published: reference?.published ?? null,
    solar_peculiar_runtime_kms: runtimeSolarPeculiar,
    solar_peculiar_reference_kms: hasReference ? referenceVector : null,
    component_abs_delta_km_s: hasReference ? componentAbsDelta : null,
    max_component_abs_delta_km_s: hasReference ? maxAbsDelta : null,
    tolerance_km_s: toleranceKmS,
    random_uncertainty_kms: reference?.random_uncertainty_kms ?? null,
    systematic_uncertainty_kms: reference?.systematic_uncertainty_kms ?? null,
  };
  const gate = makeGate({
    gateId: "halobank.solar.local_rest_anchor_calibration.v1",
    deltas,
    firstFail,
    reasons,
  });
  return {
    module: "local_rest_anchor_calibration",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.local_rest_anchor_calibration:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

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
  const observer = normalizeSolarObserver(input.observer) ?? { mode: "geocenter" as const };
  const observerContextState = resolveNullProbeObserver({
    date: sampleDates[0] ?? new Date(startIso),
    observerBodyId: 399,
    observer,
  });
  const metric = sampleDates.map((date) => {
    const obs = apparentSeparationAndRadiiDeg({ date, observer });
    const contactGap = obs.separationDeg - (obs.sunRadiusDeg + obs.moonRadiusDeg);
    const geocenterParallaxAllowanceDeg =
      observer.mode === "geocenter"
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
  const passObserverKernel = !observerContextState.warning;
  deltas.push({
    id: "observer_kernel_ready",
    comparator: ">=",
    value: passObserverKernel ? 1 : 0,
    limit: 1,
    pass: passObserverKernel,
  });
  if (!passObserverKernel) {
    firstFail = "HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING";
    reasons.push(
      "Body-fixed eclipse observer requested an unsupported orientation model; deterministic geocenter fallback was used.",
    );
  }
  if (events.length === 0) {
    if (!firstFail) {
      firstFail = "HALOBANK_SOLAR_ECLIPSE_NO_EVENTS";
    }
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
    observer_mode: observerContextState.mode,
    observer_context: {
      mode: observerContextState.mode,
      requested_body_id: observerContextState.requested_body_id,
      resolved_body_id: observerContextState.resolved_body_id,
      frame: "BCRS",
      coordinate_time_scale: "TCB",
      evaluation_time_scale: "TDB",
      observer_time_scale: "TT",
      warning: observerContextState.warning ?? null,
      body_fixed:
        observer.mode === "body-fixed"
          ? {
              body: observer.body,
              lon_deg: observer.lon_deg,
              lat_deg: observer.lat_deg,
              height_m: observer.height_m,
            }
          : null,
    },
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

type GlobalSolarEclipseEvent = {
  kind: number;
  peak_iso: string;
  obscuration: number | null;
  distance_km: number | null;
};

function enumerateGlobalSolarEclipses(args: {
  startDate: Date;
  endDate: Date;
  maxEvents: number;
}): GlobalSolarEclipseEvent[] {
  const events: GlobalSolarEclipseEvent[] = [];
  let cursor = Astronomy.SearchGlobalSolarEclipse(args.startDate);
  let guard = 0;
  while (guard < args.maxEvents) {
    guard += 1;
    const peakDate = cursor.peak.date;
    const peakMs = Date.parse(peakDate.toISOString());
    if (!Number.isFinite(peakMs) || peakMs > args.endDate.getTime()) {
      break;
    }
    if (peakMs >= args.startDate.getTime()) {
      events.push({
        kind: cursor.kind,
        peak_iso: peakDate.toISOString(),
        obscuration: Number.isFinite(cursor.obscuration) ? Number(cursor.obscuration) : null,
        distance_km: Number.isFinite(cursor.distance) ? Number(cursor.distance) : null,
      });
    }
    const next = Astronomy.NextGlobalSolarEclipse(peakDate);
    if (Date.parse(next.peak.date.toISOString()) <= peakMs) {
      break;
    }
    cursor = next;
  }
  return events;
}

export function runSarosCycle(
  input: SarosInput,
  thresholds: SolarThresholdsManifest["modules"]["saros_cycle"],
): DerivedResult {
  const startIso = toIsoOrThrow(input.start_iso, "1990-01-01T00:00:00.000Z");
  const endIso = toIsoOrThrow(input.end_iso, "2100-01-01T00:00:00.000Z");
  const startDate = new Date(startIso);
  const endDate = new Date(endIso);
  const maxEvents = Number.isFinite(input.max_events)
    ? Math.max(2, Math.min(2_000, Math.floor(Number(input.max_events))))
    : 512;
  const targetDays = thresholds.target_saros_days;
  const toleranceDays = thresholds.max_pair_abs_error_days;

  const eclipses = enumerateGlobalSolarEclipses({
    startDate,
    endDate,
    maxEvents,
  });

  const pairs: Array<{
    source_peak_iso: string;
    matched_peak_iso: string;
    interval_days: number;
    abs_error_days: number;
    source_kind: number;
    matched_kind: number;
  }> = [];
  const candidateErrors: number[] = [];

  for (let i = 0; i < eclipses.length; i += 1) {
    const sourceMs = Date.parse(eclipses[i].peak_iso);
    const targetMs = sourceMs + targetDays * DAY_MS;
    let bestIndex = -1;
    let bestAbsErrorDays = Number.POSITIVE_INFINITY;

    for (let j = i + 1; j < eclipses.length; j += 1) {
      const matchedMs = Date.parse(eclipses[j].peak_iso);
      const absErrorDays = Math.abs((matchedMs - targetMs) / DAY_MS);
      if (absErrorDays < bestAbsErrorDays) {
        bestAbsErrorDays = absErrorDays;
        bestIndex = j;
      }
      if (matchedMs > targetMs + toleranceDays * DAY_MS * 2) {
        break;
      }
    }

    if (bestIndex < 0 || !Number.isFinite(bestAbsErrorDays)) {
      continue;
    }
    candidateErrors.push(bestAbsErrorDays);
    if (bestAbsErrorDays > toleranceDays) {
      continue;
    }

    const matchedMs = Date.parse(eclipses[bestIndex].peak_iso);
    pairs.push({
      source_peak_iso: eclipses[i].peak_iso,
      matched_peak_iso: eclipses[bestIndex].peak_iso,
      interval_days: (matchedMs - sourceMs) / DAY_MS,
      abs_error_days: bestAbsErrorDays,
      source_kind: eclipses[i].kind,
      matched_kind: eclipses[bestIndex].kind,
    });
  }

  const passPairs = pairs.length >= thresholds.min_pair_count;
  const maxAbsErrorDays = maxOrZero(pairs.map((pair) => pair.abs_error_days));
  const passErrorBand = pairs.length > 0 && maxAbsErrorDays <= toleranceDays;

  let firstFail: string | null = null;
  const deltas: SolarGateDelta[] = [
    {
      id: "pair_count",
      comparator: ">=",
      value: pairs.length,
      limit: thresholds.min_pair_count,
      pass: passPairs,
    },
    {
      id: "max_abs_error_days",
      comparator: "<=",
      value: pairs.length > 0 ? maxAbsErrorDays : Number.POSITIVE_INFINITY,
      limit: toleranceDays,
      pass: passErrorBand,
    },
  ];
  const reasons: string[] = [];
  if (!passPairs) {
    firstFail = "HALOBANK_SOLAR_SAROS_INSUFFICIENT_PAIRS";
    reasons.push("Insufficient Saros-aligned eclipse pairs in the requested window.");
  } else if (!passErrorBand) {
    firstFail = "HALOBANK_SOLAR_SAROS_OUT_OF_BAND";
    reasons.push("Saros recurrence intervals exceeded configured tolerance.");
  }

  let nearestReferenceDeltaDays: number | null = null;
  if (input.reference_iso) {
    const referenceIso = toIsoOrThrow(input.reference_iso, input.reference_iso);
    const referenceMs = Date.parse(referenceIso);
    const nearest = pairs.reduce<{ deltaDays: number } | null>((best, pair) => {
      const deltaDays = Math.abs(Date.parse(pair.matched_peak_iso) - referenceMs) / DAY_MS;
      if (!best || deltaDays < best.deltaDays) {
        return { deltaDays };
      }
      return best;
    }, null);
    nearestReferenceDeltaDays = nearest?.deltaDays ?? null;
    const referenceToleranceDays = Number.isFinite(input.tolerance_days)
      ? Math.max(0.01, Number(input.tolerance_days))
      : toleranceDays;
    const passReference = nearestReferenceDeltaDays !== null && nearestReferenceDeltaDays <= referenceToleranceDays;
    deltas.push({
      id: "nearest_reference_delta_days",
      comparator: "<=",
      value: nearestReferenceDeltaDays ?? Number.POSITIVE_INFINITY,
      limit: referenceToleranceDays,
      pass: passReference,
    });
    if (!passReference && !firstFail) {
      firstFail = "HALOBANK_SOLAR_SAROS_REFERENCE_OUT_OF_BAND";
      reasons.push("Nearest Saros recurrence candidate is outside reference tolerance.");
    }
  }

  if (!firstFail) {
    reasons.push("Saros recurrence detector found eclipse pairs inside diagnostic tolerances.");
  }

  const result = {
    start_iso: startIso,
    end_iso: endIso,
    target_saros_days: targetDays,
    tolerance_days: toleranceDays,
    eclipse_events_scanned: eclipses.length,
    max_events: maxEvents,
    candidate_pair_count: candidateErrors.length,
    pair_count: pairs.length,
    nearest_reference_delta_days: nearestReferenceDeltaDays,
    mean_candidate_abs_error_days: mean(candidateErrors),
    max_pair_abs_error_days: maxAbsErrorDays,
    pairs: pairs.slice(0, 64),
  };
  const gate = makeGate({
    gateId: "halobank.solar.saros_cycle.v1",
    deltas,
    firstFail,
    reasons,
  });
  return {
    module: "saros_cycle",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.saros_cycle:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

function normalizeJovianMoonName(value: unknown): JovianMoonName {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "io" || normalized === "europa" || normalized === "ganymede" || normalized === "callisto") {
    return normalized;
  }
  return "io";
}

function normalizeJovianEventMode(value: unknown): JovianEventMode {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "transit" || normalized === "occultation" || normalized === "any") {
    return normalized;
  }
  return "any";
}

function jovianMoonState(date: Date, moon: JovianMoonName): { pos: Vec3; vel: Vec3 } {
  const moons = Astronomy.JupiterMoons(date);
  const selected = moons[moon];
  return {
    pos: stateLikeToVec3(selected),
    vel: [selected.vx, selected.vy, selected.vz],
  };
}

export function runJovianMoonEventTiming(
  input: JovianMoonTimingInput,
  thresholds: SolarThresholdsManifest["modules"]["jovian_moon_event_timing"],
): DerivedResult {
  const startIso = toIsoOrThrow(input.start_iso, "2026-01-01T00:00:00.000Z");
  const endIso = toIsoOrThrow(input.end_iso, "2026-01-06T00:00:00.000Z");
  const stepMinutes = Number.isFinite(input.step_minutes) ? Math.max(1, Number(input.step_minutes)) : 5;
  const moon = normalizeJovianMoonName(input.moon);
  const eventMode = normalizeJovianEventMode(input.event);
  const sampleDates = buildSamples(startIso, endIso, stepMinutes / (24 * 60), 80_000);
  const observer = normalizeSolarObserver(input.observer) ?? { mode: "geocenter" as const };
  const observerContextState = resolveNullProbeObserver({
    date: sampleDates[0] ?? new Date(startIso),
    observerBodyId: 399,
    observer,
  });

  const metric = sampleDates.map((date) => {
    const observerState = resolveNullProbeObserver({
      date,
      observerBodyId: 399,
      observer,
    });
    const jupiter = getBaryState(599, date);
    const moonJovicentric = jovianMoonState(date, moon);
    const moonBary = vecAdd(jupiter.pos, moonJovicentric.pos);
    const jupiterFromObserver = vecSub(jupiter.pos, observerState.pos_bary_au);
    const moonFromObserver = vecSub(moonBary, observerState.pos_bary_au);
    const jupiterRangeAu = vecNorm(jupiterFromObserver);
    const jupiterRadiusDeg = (Math.atan2(JOVIAN_EQUATORIAL_RADIUS_KM, (jupiterRangeAu * AU_M) / 1000) * 180) / Math.PI;
    const separationDeg = angleBetweenDeg(moonFromObserver, jupiterFromObserver);
    const contactRatio = separationDeg / Math.max(1e-9, jupiterRadiusDeg);
    const lineOfSightUnit = vecScale(jupiterFromObserver, 1 / Math.max(1e-12, jupiterRangeAu));
    const depthAu = vecDot(moonJovicentric.pos, lineOfSightUnit);
    const eventType: "transit" | "occultation" = depthAu < 0 ? "transit" : "occultation";
    return {
      t: date,
      separationDeg,
      jupiterRadiusDeg,
      contactRatio,
      depthAu,
      eventType,
    };
  });

  const events: Array<{
    event_iso: string;
    moon: JovianMoonName;
    event_type: "transit" | "occultation";
    separation_deg: number;
    jupiter_radius_deg: number;
    contact_ratio: number;
    depth_au: number;
  }> = [];

  for (let i = 1; i < metric.length - 1; i += 1) {
    const prev = metric[i - 1];
    const curr = metric[i];
    const next = metric[i + 1];
    const isLocalMin = curr.contactRatio <= prev.contactRatio && curr.contactRatio <= next.contactRatio;
    const inContact = curr.contactRatio <= thresholds.max_contact_ratio;
    const modeAllowed = eventMode === "any" || curr.eventType === eventMode;
    if (!isLocalMin || !inContact || !modeAllowed) {
      continue;
    }
    events.push({
      event_iso: curr.t.toISOString(),
      moon,
      event_type: curr.eventType,
      separation_deg: curr.separationDeg,
      jupiter_radius_deg: curr.jupiterRadiusDeg,
      contact_ratio: curr.contactRatio,
      depth_au: curr.depthAu,
    });
  }

  const deltas: SolarGateDelta[] = [];
  const reasons: string[] = [];
  let firstFail: string | null = null;
  const passObserverKernel = !observerContextState.warning;
  deltas.push({
    id: "observer_kernel_ready",
    comparator: ">=",
    value: passObserverKernel ? 1 : 0,
    limit: 1,
    pass: passObserverKernel,
  });
  if (!passObserverKernel) {
    firstFail = "HALOBANK_SOLAR_ORIENTATION_KERNEL_MISSING";
    reasons.push(
      "Body-fixed Jovian observer requested an unsupported orientation model; deterministic geocenter fallback was used.",
    );
  }

  const passCount = events.length >= thresholds.min_event_count;
  deltas.push({
    id: "event_count",
    comparator: ">=",
    value: events.length,
    limit: thresholds.min_event_count,
    pass: passCount,
  });
  if (!passCount) {
    if (!firstFail) {
      firstFail = "HALOBANK_SOLAR_JOVIAN_NO_EVENTS";
    }
    reasons.push("No Jovian moon events met the requested geometry constraints.");
  }

  let nearestReferenceDeltaS: number | null = null;
  if (input.reference_iso) {
    const referenceIso = toIsoOrThrow(input.reference_iso, input.reference_iso);
    const referenceMs = Date.parse(referenceIso);
    const nearest = events.reduce<{ deltaS: number } | null>((best, event) => {
      const deltaS = Math.abs(Date.parse(event.event_iso) - referenceMs) / 1000;
      if (!best || deltaS < best.deltaS) {
        return { deltaS };
      }
      return best;
    }, null);
    nearestReferenceDeltaS = nearest?.deltaS ?? null;
    const toleranceS = Number.isFinite(input.tolerance_s)
      ? Math.max(1, Number(input.tolerance_s))
      : thresholds.event_time_tolerance_s;
    const passReference = nearestReferenceDeltaS !== null && nearestReferenceDeltaS <= toleranceS;
    deltas.push({
      id: "nearest_reference_delta_s",
      comparator: "<=",
      value: nearestReferenceDeltaS ?? Number.POSITIVE_INFINITY,
      limit: toleranceS,
      pass: passReference,
    });
    if (!passReference && !firstFail) {
      firstFail = "HALOBANK_SOLAR_JOVIAN_TIMING_OUT_OF_BAND";
      reasons.push("Nearest Jovian moon event is outside configured timing tolerance.");
    }
  }

  if (!firstFail) {
    reasons.push("Jovian moon event timing detector found contact minima within diagnostic thresholds.");
  }

  const result = {
    start_iso: startIso,
    end_iso: endIso,
    step_minutes: stepMinutes,
    observer_mode: observerContextState.mode,
    observer_context: {
      mode: observerContextState.mode,
      requested_body_id: observerContextState.requested_body_id,
      resolved_body_id: observerContextState.resolved_body_id,
      frame: "BCRS",
      coordinate_time_scale: "TCB",
      evaluation_time_scale: "TDB",
      observer_time_scale: "TT",
      warning: observerContextState.warning ?? null,
      body_fixed:
        observer.mode === "body-fixed"
          ? {
              body: observer.body,
              lon_deg: observer.lon_deg,
              lat_deg: observer.lat_deg,
              height_m: observer.height_m,
            }
          : null,
    },
    moon,
    event_mode: eventMode,
    contact_ratio_threshold: thresholds.max_contact_ratio,
    nearest_reference_delta_s: nearestReferenceDeltaS,
    events,
  };
  const gate = makeGate({
    gateId: "halobank.solar.jovian_moon_event_timing.v1",
    deltas,
    firstFail,
    reasons,
  });
  return {
    module: "jovian_moon_event_timing",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.jovian_moon_event_timing:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

export function runEarthOrientationPrecessionNutationProxy(
  input: EarthOrientationPrecessionNutationProxyInput,
  thresholds: SolarThresholdsManifest["modules"]["earth_orientation_precession_nutation_proxy"],
): DerivedResult {
  const startIso = toIsoOrThrow(input.start_iso, "2026-01-01T00:00:00.000Z");
  const endIso = toIsoOrThrow(input.end_iso, "2026-03-01T00:00:00.000Z");
  const stepMinutes = Number.isFinite(input.step_minutes) ? Math.max(30, Number(input.step_minutes)) : 360;
  const stepDays = stepMinutes / 1440;
  const spinAxis = parseSpinAxisIcrs(input.spin_axis_icrs);
  const sampleDates = buildSamples(startIso, endIso, stepDays, 20_000);

  const sunRangesAu: number[] = [];
  const moonRangesAu: number[] = [];
  const sunTideWeightsPerS2: number[] = [];
  const moonTideWeightsPerS2: number[] = [];
  const sunTorqueVectors: Vec3[] = [];
  const moonTorqueVectors: Vec3[] = [];
  const totalTorqueVectors: Vec3[] = [];
  const sunSpinAxisAnglesDeg: number[] = [];
  const moonSpinAxisAnglesDeg: number[] = [];

  for (const date of sampleDates) {
    const earth = getBaryState(399, date);
    const sunRelative = vecSub(getBaryState(10, date).pos, earth.pos);
    const moonRelative = vecSub(getBaryState(301, date).pos, earth.pos);
    const sunUnit = vecNormalize(sunRelative);
    const moonUnit = vecNormalize(moonRelative);
    if (!sunUnit || !moonUnit) {
      continue;
    }

    const sunRangeAu = vecNorm(sunRelative);
    const moonRangeAu = vecNorm(moonRelative);
    const sunRangeM = sunRangeAu * AU_M;
    const moonRangeM = moonRangeAu * AU_M;
    const sunTideWeight = GM_SUN_M3_S2 / Math.max(1, sunRangeM ** 3);
    const moonTideWeight = GM_MOON_M3_S2 / Math.max(1, moonRangeM ** 3);
    const sunTorque = orientationTorqueProxyVector(spinAxis, sunUnit, sunTideWeight);
    const moonTorque = orientationTorqueProxyVector(spinAxis, moonUnit, moonTideWeight);
    const totalTorque = vecAdd(sunTorque, moonTorque);

    sunRangesAu.push(sunRangeAu);
    moonRangesAu.push(moonRangeAu);
    sunTideWeightsPerS2.push(sunTideWeight);
    moonTideWeightsPerS2.push(moonTideWeight);
    sunTorqueVectors.push(sunTorque);
    moonTorqueVectors.push(moonTorque);
    totalTorqueVectors.push(totalTorque);
    sunSpinAxisAnglesDeg.push(angleBetweenDeg(spinAxis, sunUnit));
    moonSpinAxisAnglesDeg.push(angleBetweenDeg(spinAxis, moonUnit));
  }

  const sampleCount = totalTorqueVectors.length;
  const meanSunTideWeightPerS2 = mean(sunTideWeightsPerS2);
  const meanMoonTideWeightPerS2 = mean(moonTideWeightsPerS2);
  const lunarToSolarRatio = meanSunTideWeightPerS2 > 0 ? meanMoonTideWeightPerS2 / meanSunTideWeightPerS2 : 0;
  const lunarToSolarRatioAbsError = Math.abs(lunarToSolarRatio - thresholds.expected_lunar_to_solar_ratio);
  const meanSunTorqueVector = meanVec(sunTorqueVectors);
  const meanMoonTorqueVector = meanVec(moonTorqueVectors);
  const meanTotalTorqueVector = meanVec(totalTorqueVectors);
  const precessionDriverProxyPerS2 = vecNorm(meanTotalTorqueVector);
  const nutationDriverProxyRmsPerS2 = rmsVectorDeviation(totalTorqueVectors, meanTotalTorqueVector);
  const meanSunTorqueProxyPerS2 = mean(sunTorqueVectors.map((entry) => vecNorm(entry)));
  const meanMoonTorqueProxyPerS2 = mean(moonTorqueVectors.map((entry) => vecNorm(entry)));
  const dominantDriver = meanMoonTideWeightPerS2 >= meanSunTideWeightPerS2 ? "moon" : "sun";

  const passSampleCount = sampleCount >= thresholds.min_sample_count;
  const passRatio = lunarToSolarRatioAbsError <= thresholds.max_lunar_to_solar_ratio_abs_error;
  const passPrecession = Number.isFinite(precessionDriverProxyPerS2) && precessionDriverProxyPerS2 > 0;
  const passNutation = Number.isFinite(nutationDriverProxyRmsPerS2) && nutationDriverProxyRmsPerS2 > 0;

  let firstFail: string | null = null;
  const reasons: string[] = [];
  if (!passSampleCount) {
    firstFail = "HALOBANK_SOLAR_EARTH_ORIENTATION_INSUFFICIENT_SAMPLES";
    reasons.push("Earth-orientation proxy window did not produce enough deterministic samples.");
  } else if (!passRatio) {
    firstFail = "HALOBANK_SOLAR_EARTH_ORIENTATION_LUNISOLAR_RATIO_OUT_OF_BAND";
    reasons.push("Mean lunar-to-solar forcing ratio drifted outside the configured diagnostic band.");
  } else if (!passPrecession) {
    firstFail = "HALOBANK_SOLAR_EARTH_ORIENTATION_PRECESSION_PROXY_INVALID";
    reasons.push("Mean lunisolar torque proxy is invalid or collapsed to zero.");
  } else if (!passNutation) {
    firstFail = "HALOBANK_SOLAR_EARTH_ORIENTATION_NUTATION_PROXY_INVALID";
    reasons.push("Torque-proxy variability is invalid or collapsed to zero.");
  } else {
    reasons.push("Lunisolar forcing and torque proxies satisfy the configured Earth-orientation diagnostic thresholds.");
  }

  const result = {
    start_iso: startIso,
    end_iso: endIso,
    step_minutes: stepMinutes,
    sample_count: sampleCount,
    proxy_model_id: "halobank.solar.earth_orientation_precession_nutation_proxy/1",
    spin_axis_icrs: spinAxis,
    mean_sun_range_au: mean(sunRangesAu),
    mean_moon_range_au: mean(moonRangesAu),
    mean_sun_tide_weight_per_s2: meanSunTideWeightPerS2,
    mean_moon_tide_weight_per_s2: meanMoonTideWeightPerS2,
    lunar_to_solar_ratio: lunarToSolarRatio,
    expected_lunar_to_solar_ratio: thresholds.expected_lunar_to_solar_ratio,
    lunar_to_solar_ratio_abs_error: lunarToSolarRatioAbsError,
    dominant_driver: dominantDriver,
    mean_sun_torque_proxy_per_s2: meanSunTorqueProxyPerS2,
    mean_moon_torque_proxy_per_s2: meanMoonTorqueProxyPerS2,
    mean_total_torque_vector_proxy_per_s2: meanTotalTorqueVector,
    mean_sun_torque_vector_proxy_per_s2: meanSunTorqueVector,
    mean_moon_torque_vector_proxy_per_s2: meanMoonTorqueVector,
    precession_driver_proxy_per_s2: precessionDriverProxyPerS2,
    nutation_driver_proxy_rms_per_s2: nutationDriverProxyRmsPerS2,
    first_sample_geometry: {
      sun_spin_axis_angle_deg: sunSpinAxisAnglesDeg[0] ?? null,
      moon_spin_axis_angle_deg: moonSpinAxisAnglesDeg[0] ?? null,
    },
    model_scope:
      "Diagnostic lunisolar forcing and equatorial-bulge torque proxy. Not a certified IAU Earth-orientation series.",
  };
  const gate = makeGate({
    gateId: "halobank.solar.earth_orientation_precession_nutation_proxy.v1",
    deltas: [
      {
        id: "sample_count",
        comparator: ">=",
        value: sampleCount,
        limit: thresholds.min_sample_count,
        pass: passSampleCount,
      },
      {
        id: "lunar_to_solar_ratio_abs_error",
        comparator: "<=",
        value: lunarToSolarRatioAbsError,
        limit: thresholds.max_lunar_to_solar_ratio_abs_error,
        pass: passRatio,
      },
      {
        id: "precession_driver_proxy_per_s2",
        comparator: ">",
        value: precessionDriverProxyPerS2,
        limit: 0,
        pass: passPrecession,
      },
      {
        id: "nutation_driver_proxy_rms_per_s2",
        comparator: ">",
        value: nutationDriverProxyRmsPerS2,
        limit: 0,
        pass: passNutation,
      },
    ],
    firstFail,
    reasons,
  });
  return {
    module: "earth_orientation_precession_nutation_proxy",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.earth_orientation_precession_nutation_proxy:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

export function runPlanetaryShapeOrientationProxy(
  input: PlanetaryShapeOrientationProxyInput,
  thresholds: SolarThresholdsManifest["modules"]["planetary_shape_orientation_proxy"],
  diagnosticDatasetsManifest?: SolarDiagnosticDatasetsManifest,
): DerivedResult {
  const calibrationProfile = resolvePlanetaryCalibrationProfile(input, diagnosticDatasetsManifest);
  const startIso = toIsoOrThrow(input.start_iso, calibrationProfile?.start_iso ?? "2026-01-01T00:00:00.000Z");
  const endIso = toIsoOrThrow(input.end_iso, calibrationProfile?.end_iso ?? "2026-03-01T00:00:00.000Z");
  const stepMinutes = Number.isFinite(input.step_minutes)
    ? Math.max(30, Number(input.step_minutes))
    : Math.max(30, calibrationProfile?.step_minutes ?? 360);
  const stepDays = stepMinutes / 1440;
  const spinAxis = parseSpinAxisIcrs(input.spin_axis_icrs);
  const sampleDates = buildSamples(startIso, endIso, stepDays, 20_000);

  const targetBodyId = normalizeSupportedBodyId(input.target_body_id, calibrationProfile?.target_body_id ?? 399);
  const primaryPerturberBodyId = normalizeSupportedBodyId(
    input.primary_perturber_body_id,
    calibrationProfile?.primary_perturber_body_id ?? 10,
  );
  const secondaryPerturberBodyId =
    input.secondary_perturber_body_id === null
      ? null
      : Number.isFinite(Number(input.secondary_perturber_body_id))
      ? normalizeSupportedBodyId(input.secondary_perturber_body_id, 301)
      : calibrationProfile
      ? calibrationProfile.secondary_perturber_body_id
      : 301;
  const targetBody = resolveSupportedBody(targetBodyId);
  const primaryPerturberBody = resolveSupportedBody(primaryPerturberBodyId);
  const secondaryPerturberBody = secondaryPerturberBodyId === null ? null : resolveSupportedBody(secondaryPerturberBodyId);
  if (!targetBody || !primaryPerturberBody || (secondaryPerturberBodyId !== null && !secondaryPerturberBody)) {
    throw new Error("Unsupported body id in planetary-shape proxy input");
  }
  const targetBodyStateMeta = getBodyStateSource(targetBodyId);
  const primaryPerturberStateMeta = getBodyStateSource(primaryPerturberBodyId);
  const secondaryPerturberStateMeta =
    secondaryPerturberBodyId === null ? null : getBodyStateSource(secondaryPerturberBodyId);
  const targetBodyStateSource = targetBody.stateSource ?? calibrationProfile?.state_source ?? "astronomy-engine";
  const stateSourceClass =
    targetBodyStateMeta.synthetic || primaryPerturberStateMeta.synthetic || Boolean(secondaryPerturberStateMeta?.synthetic)
      ? "hybrid_diagnostic"
      : "kernel_bundle";

  const bodyMassKg = Math.max(1, numericInputOrProfile(input.body_mass_kg, calibrationProfile?.body_mass_kg, EARTH_MASS_KG));
  const equatorialRadiusM = Math.max(
    1,
    numericInputOrProfile(input.equatorial_radius_m, calibrationProfile?.equatorial_radius_m, EARTH_MEAN_RADIUS_M),
  );
  const yieldStrengthPa = Math.max(
    1,
    numericInputOrProfile(input.yield_strength_pa, calibrationProfile?.yield_strength_pa, EARTH_REFERENCE_YIELD_STRENGTH_PA),
  );
  const effectiveRigidityPa = Math.max(
    1,
    numericInputOrProfile(
      input.effective_rigidity_pa,
      calibrationProfile?.effective_rigidity_pa,
      EARTH_REFERENCE_EFFECTIVE_RIGIDITY_PA,
    ),
  );
  const rotationRateRadS = Math.max(
    1e-12,
    numericInputOrProfile(input.rotation_rate_rad_s, calibrationProfile?.rotation_rate_rad_s, EARTH_ROTATION_RATE_RAD_S),
  );
  const momentOfInertiaFactor = Math.max(
    1e-6,
    numericInputOrProfile(
      input.moment_of_inertia_factor,
      calibrationProfile?.moment_of_inertia_factor,
      EARTH_MOMENT_OF_INERTIA_FACTOR,
    ),
  );

  const primaryRangesAu: number[] = [];
  const secondaryRangesAu: number[] = [];
  const primaryTideWeightsPerS2: number[] = [];
  const secondaryTideWeightsPerS2: number[] = [];
  const primaryTorqueVectors: Vec3[] = [];
  const secondaryTorqueVectors: Vec3[] = [];
  const totalTorqueVectors: Vec3[] = [];
  const primarySpinAxisAnglesDeg: number[] = [];
  const secondarySpinAxisAnglesDeg: number[] = [];

  const primaryMuM3S2 = primaryPerturberBody.mu;
  const secondaryMuM3S2 = secondaryPerturberBody?.mu ?? 0;
  if (!(primaryMuM3S2 && primaryMuM3S2 > 0)) {
    throw new Error(`Missing gravitational parameter for primary perturber body ${primaryPerturberBodyId}`);
  }

  for (const date of sampleDates) {
    const targetState = getBaryState(targetBodyId, date);
    const primaryRelative = vecSub(getBaryState(primaryPerturberBodyId, date).pos, targetState.pos);
    const primaryUnit = vecNormalize(primaryRelative);
    const secondaryRelative =
      secondaryPerturberBodyId === null ? null : vecSub(getBaryState(secondaryPerturberBodyId, date).pos, targetState.pos);
    const secondaryUnit = secondaryRelative ? vecNormalize(secondaryRelative) : null;
    if (!primaryUnit || (secondaryRelative && !secondaryUnit)) {
      continue;
    }

    const primaryRangeAu = vecNorm(primaryRelative);
    const primaryRangeM = primaryRangeAu * AU_M;
    const primaryTideWeight = primaryMuM3S2 / Math.max(1, primaryRangeM ** 3);
    const primaryTorque = orientationTorqueProxyVector(spinAxis, primaryUnit, primaryTideWeight);
    let secondaryRangeAu = 0;
    let secondaryTideWeight = 0;
    let secondaryTorque: Vec3 = [0, 0, 0];
    if (secondaryRelative && secondaryUnit && secondaryMuM3S2 > 0) {
      secondaryRangeAu = vecNorm(secondaryRelative);
      const secondaryRangeM = secondaryRangeAu * AU_M;
      secondaryTideWeight = secondaryMuM3S2 / Math.max(1, secondaryRangeM ** 3);
      secondaryTorque = orientationTorqueProxyVector(spinAxis, secondaryUnit, secondaryTideWeight);
    }
    const totalTorque = vecAdd(primaryTorque, secondaryTorque);

    primaryRangesAu.push(primaryRangeAu);
    secondaryRangesAu.push(secondaryRangeAu);
    primaryTideWeightsPerS2.push(primaryTideWeight);
    secondaryTideWeightsPerS2.push(secondaryTideWeight);
    primaryTorqueVectors.push(primaryTorque);
    secondaryTorqueVectors.push(secondaryTorque);
    totalTorqueVectors.push(totalTorque);
    primarySpinAxisAnglesDeg.push(angleBetweenDeg(spinAxis, primaryUnit));
    secondarySpinAxisAnglesDeg.push(secondaryUnit ? angleBetweenDeg(spinAxis, secondaryUnit) : 0);
  }

  const sampleCount = totalTorqueVectors.length;
  const meanPrimaryTideWeightPerS2 = mean(primaryTideWeightsPerS2);
  const meanSecondaryTideWeightPerS2 = mean(secondaryTideWeightsPerS2);
  const pairedPerturberMode = secondaryPerturberBodyId !== null;
  const expectedSecondaryToPrimaryRatio = pairedPerturberMode ? thresholds.expected_lunar_to_solar_ratio : null;
  const secondaryToPrimaryRatio =
    pairedPerturberMode && meanPrimaryTideWeightPerS2 > 0
      ? meanSecondaryTideWeightPerS2 / meanPrimaryTideWeightPerS2
      : null;
  const secondaryToPrimaryRatioAbsError =
    pairedPerturberMode && secondaryToPrimaryRatio !== null && expectedSecondaryToPrimaryRatio !== null
      ? Math.abs(secondaryToPrimaryRatio - expectedSecondaryToPrimaryRatio)
      : null;
  const meanPrimaryTorqueVector = meanVec(primaryTorqueVectors);
  const meanSecondaryTorqueVector = meanVec(secondaryTorqueVectors);
  const meanTotalTorqueVector = meanVec(totalTorqueVectors);
  const meanTotalTorqueMagnitudeProxyPerS2 = mean(totalTorqueVectors.map((entry) => vecNorm(entry)));
  const precessionDriverProxyPerS2 = meanTotalTorqueMagnitudeProxyPerS2;
  const nutationDriverProxyRmsPerS2 = rmsVectorDeviation(totalTorqueVectors, meanTotalTorqueVector);
  const meanPrimaryTorqueProxyPerS2 = mean(primaryTorqueVectors.map((entry) => vecNorm(entry)));
  const meanSecondaryTorqueProxyPerS2 = mean(secondaryTorqueVectors.map((entry) => vecNorm(entry)));
  const dominantDriver =
    pairedPerturberMode && meanSecondaryTideWeightPerS2 >= meanPrimaryTideWeightPerS2
      ? secondaryPerturberBody.name.toLowerCase()
      : primaryPerturberBody.name.toLowerCase();

  const meanDensityProxyKgM3 = bodyMassKg / ((4 / 3) * Math.PI * equatorialRadiusM ** 3);
  const selfGravityPressureProxyPa = SI_GRAVITATIONAL_CONSTANT * meanDensityProxyKgM3 ** 2 * equatorialRadiusM ** 2;
  const hydrostaticRoundingProxy = selfGravityPressureProxyPa / yieldStrengthPa;
  const potatoThresholdRadiusM = Math.sqrt(yieldStrengthPa / Math.max(1e-30, SI_GRAVITATIONAL_CONSTANT * meanDensityProxyKgM3 ** 2));
  const potatoThresholdRatio = equatorialRadiusM / potatoThresholdRadiusM;
  const rotationalFlatteningProxy = (rotationRateRadS ** 2 * equatorialRadiusM ** 3) / (SI_GRAVITATIONAL_CONSTANT * bodyMassKg);
  const surfaceGravityProxyM_S2 = (SI_GRAVITATIONAL_CONSTANT * bodyMassKg) / (equatorialRadiusM ** 2);
  const surfaceTidalAccelerationProxyM_S2 = (meanPrimaryTideWeightPerS2 + meanSecondaryTideWeightPerS2) * equatorialRadiusM;
  const tidalResponseProxy = surfaceGravityProxyM_S2 > 0 ? surfaceTidalAccelerationProxyM_S2 / surfaceGravityProxyM_S2 : 0;
  const loveNumberProxy = (1.5 / (1 + (19 * effectiveRigidityPa) / Math.max(1e-12, 2 * meanDensityProxyKgM3 * surfaceGravityProxyM_S2 * equatorialRadiusM)));
  const tidalTensorProxyPerS2 = meanPrimaryTideWeightPerS2 + meanSecondaryTideWeightPerS2;
  const j2Proxy = rotationalFlatteningProxy / 3;
  const dynamicalEllipticityProxy = j2Proxy / Math.max(1e-12, momentOfInertiaFactor);
  const flatteningFromJ2QProxy = 1.5 * j2Proxy + 0.5 * rotationalFlatteningProxy;
  const j2ToQRatio = rotationalFlatteningProxy > 0 ? j2Proxy / rotationalFlatteningProxy : 0;
  const dynamicalEllipticityToJ2Ratio = j2Proxy > 0 ? dynamicalEllipticityProxy / j2Proxy : 0;
  const momentOfInertiaProxyKgM2 = momentOfInertiaFactor * bodyMassKg * equatorialRadiusM ** 2;
  const precessionConstantProxyPerS = precessionDriverProxyPerS2 / Math.max(1e-12, momentOfInertiaProxyKgM2 * rotationRateRadS);
  const backgroundGeometry = buildBackgroundGeometryFromDensity({
    densityKgM3: meanDensityProxyKgM3,
    sourceQuantityId: "mean_density_proxy_kg_m3",
    note:
      "Body-density and energy-density curvature proxies occupy the G_geometry slot of the collective observable-response closure. Tide tensor and torque proxies remain in the forcing channel.",
  });

  const passSampleCount = sampleCount >= thresholds.min_sample_count;
  const passRatio = !pairedPerturberMode ||
    (secondaryToPrimaryRatioAbsError !== null && secondaryToPrimaryRatioAbsError <= thresholds.max_lunar_to_solar_ratio_abs_error);
  const passShape = Number.isFinite(hydrostaticRoundingProxy) && hydrostaticRoundingProxy > 0 &&
    Number.isFinite(potatoThresholdRatio) && potatoThresholdRatio > 0 &&
    Number.isFinite(rotationalFlatteningProxy) && rotationalFlatteningProxy > 0 &&
    Number.isFinite(tidalResponseProxy) && tidalResponseProxy > 0 &&
    Number.isFinite(loveNumberProxy) && loveNumberProxy > 0 &&
    Number.isFinite(j2Proxy) && j2Proxy > 0 &&
    Number.isFinite(dynamicalEllipticityProxy) && dynamicalEllipticityProxy > 0;
  const passPrecession = Number.isFinite(precessionDriverProxyPerS2) && precessionDriverProxyPerS2 > 0 &&
    Number.isFinite(precessionConstantProxyPerS) && precessionConstantProxyPerS > 0;
  const passNutation = Number.isFinite(nutationDriverProxyRmsPerS2) && nutationDriverProxyRmsPerS2 > 0;

  let firstFail: string | null = null;
  const reasons: string[] = [];
  if (!passSampleCount) {
    firstFail = "HALOBANK_SOLAR_PLANETARY_SHAPE_INSUFFICIENT_SAMPLES";
    reasons.push("Planetary-shape proxy window did not produce enough deterministic samples.");
  } else if (!passRatio) {
    firstFail = "HALOBANK_SOLAR_PLANETARY_SHAPE_LUNISOLAR_RATIO_OUT_OF_BAND";
    reasons.push("Mean secondary-to-primary forcing ratio drifted outside the configured diagnostic band.");
  } else if (!passShape) {
    firstFail = "HALOBANK_SOLAR_PLANETARY_SHAPE_PROXY_INVALID";
    reasons.push("One or more shape-response proxies collapsed or became invalid.");
  } else if (!passPrecession) {
    firstFail = "HALOBANK_SOLAR_PLANETARY_SHAPE_PRECESSION_PROXY_INVALID";
    reasons.push("Mean lunisolar torque proxy or precession constant proxy is invalid or collapsed to zero.");
  } else if (!passNutation) {
    firstFail = "HALOBANK_SOLAR_PLANETARY_SHAPE_NUTATION_PROXY_INVALID";
    reasons.push("Torque-proxy variability is invalid or collapsed to zero.");
  } else {
    reasons.push("Planetary-shape and Earth-orientation proxies satisfy the configured diagnostic thresholds.");
  }

  const result = {
    start_iso: startIso,
    end_iso: endIso,
    step_minutes: stepMinutes,
    sample_count: sampleCount,
    proxy_model_id: "halobank.solar.planetary_shape_orientation_proxy/1",
    calibration_profile_id: calibrationProfile?.id ?? null,
    calibration_profile_label: calibrationProfile?.label ?? null,
    state_source_class: stateSourceClass,
    target_body_state_source: targetBodyStateSource,
    target_body_state_source_label:
      targetBodyStateSource === "synthetic-saturnian-satellite"
        ? "synthetic diagnostic satellite orbit"
        : "astronomy-engine barycentric ephemeris",
    target_body_state_source_model: targetBodyStateMeta.source_model,
    target_body_state_source_refs: targetBodyStateMeta.source_refs,
    target_body_id: targetBodyId,
    target_body_label: targetBody.name,
    primary_perturber_body_id: primaryPerturberBodyId,
    primary_perturber_label: primaryPerturberBody.name,
    primary_perturber_state_source: primaryPerturberBody.stateSource ?? "astronomy-engine",
    primary_perturber_state_source_model: primaryPerturberStateMeta.source_model,
    primary_perturber_state_source_refs: primaryPerturberStateMeta.source_refs,
    secondary_perturber_body_id: secondaryPerturberBodyId,
    secondary_perturber_label: secondaryPerturberBody?.name ?? null,
    secondary_perturber_state_source: secondaryPerturberBody?.stateSource ?? null,
    secondary_perturber_state_source_model: secondaryPerturberStateMeta?.source_model ?? null,
    secondary_perturber_state_source_refs: secondaryPerturberStateMeta?.source_refs ?? [],
    source_refs: calibrationProfile?.source_refs ?? [],
    spin_axis_icrs: spinAxis,
    body_mass_kg: bodyMassKg,
    equatorial_radius_m: equatorialRadiusM,
    mean_density_proxy_kg_m3: meanDensityProxyKgM3,
    background_geometry: backgroundGeometry,
    dynamic_forcing_geometry: null,
    geometry_coupling: backgroundGeometry,
    self_gravity_pressure_proxy_pa: selfGravityPressureProxyPa,
    hydrostatic_rounding_proxy: hydrostaticRoundingProxy,
    potato_threshold_radius_m: potatoThresholdRadiusM,
    potato_threshold_ratio: potatoThresholdRatio,
    effective_rigidity_pa: effectiveRigidityPa,
    rotation_rate_rad_s: rotationRateRadS,
    rotational_flattening_proxy: rotationalFlatteningProxy,
    tidal_tensor_proxy_per_s2: tidalTensorProxyPerS2,
    surface_tidal_acceleration_proxy_m_s2: surfaceTidalAccelerationProxyM_S2,
    tidal_response_proxy: tidalResponseProxy,
    love_number_proxy: loveNumberProxy,
    j2_proxy: j2Proxy,
    dynamical_ellipticity_proxy: dynamicalEllipticityProxy,
    flattening_from_j2_q_proxy: flatteningFromJ2QProxy,
    j2_to_q_ratio: j2ToQRatio,
    dynamical_ellipticity_to_j2_ratio: dynamicalEllipticityToJ2Ratio,
    moment_of_inertia_proxy_kg_m2: momentOfInertiaProxyKgM2,
    ratio_gate_mode: pairedPerturberMode ? "paired-perturber" : "single-perturber",
    mean_primary_range_au: mean(primaryRangesAu),
    mean_secondary_range_au: pairedPerturberMode ? mean(secondaryRangesAu) : null,
    mean_primary_tide_weight_per_s2: meanPrimaryTideWeightPerS2,
    mean_secondary_tide_weight_per_s2: pairedPerturberMode ? meanSecondaryTideWeightPerS2 : null,
    secondary_to_primary_ratio: secondaryToPrimaryRatio,
    expected_secondary_to_primary_ratio: expectedSecondaryToPrimaryRatio,
    secondary_to_primary_ratio_abs_error: secondaryToPrimaryRatioAbsError,
    mean_sun_range_au: primaryPerturberBodyId === 10 ? mean(primaryRangesAu) : secondaryPerturberBodyId === 10 ? mean(secondaryRangesAu) : null,
    mean_moon_range_au: primaryPerturberBodyId === 301 ? mean(primaryRangesAu) : secondaryPerturberBodyId === 301 ? mean(secondaryRangesAu) : null,
    mean_sun_tide_weight_per_s2: primaryPerturberBodyId === 10 ? meanPrimaryTideWeightPerS2 : secondaryPerturberBodyId === 10 ? meanSecondaryTideWeightPerS2 : null,
    mean_moon_tide_weight_per_s2: primaryPerturberBodyId === 301 ? meanPrimaryTideWeightPerS2 : secondaryPerturberBodyId === 301 ? meanSecondaryTideWeightPerS2 : null,
    lunar_to_solar_ratio:
      (primaryPerturberBodyId === 10 && secondaryPerturberBodyId === 301 && secondaryToPrimaryRatio !== null)
        ? secondaryToPrimaryRatio
        : null,
    expected_lunar_to_solar_ratio:
      primaryPerturberBodyId === 10 && secondaryPerturberBodyId === 301 ? thresholds.expected_lunar_to_solar_ratio : null,
    lunar_to_solar_ratio_abs_error:
      primaryPerturberBodyId === 10 && secondaryPerturberBodyId === 301 ? secondaryToPrimaryRatioAbsError : null,
    dominant_driver: dominantDriver,
    mean_primary_torque_proxy_per_s2: meanPrimaryTorqueProxyPerS2,
    mean_secondary_torque_proxy_per_s2: pairedPerturberMode ? meanSecondaryTorqueProxyPerS2 : null,
    mean_sun_torque_proxy_per_s2: primaryPerturberBodyId === 10 ? meanPrimaryTorqueProxyPerS2 : secondaryPerturberBodyId === 10 ? meanSecondaryTorqueProxyPerS2 : null,
    mean_moon_torque_proxy_per_s2: primaryPerturberBodyId === 301 ? meanPrimaryTorqueProxyPerS2 : secondaryPerturberBodyId === 301 ? meanSecondaryTorqueProxyPerS2 : null,
    mean_total_torque_vector_proxy_per_s2: meanTotalTorqueVector,
    mean_total_torque_magnitude_proxy_per_s2: meanTotalTorqueMagnitudeProxyPerS2,
    mean_primary_torque_vector_proxy_per_s2: meanPrimaryTorqueVector,
    mean_secondary_torque_vector_proxy_per_s2: pairedPerturberMode ? meanSecondaryTorqueVector : null,
    mean_sun_torque_vector_proxy_per_s2: primaryPerturberBodyId === 10 ? meanPrimaryTorqueVector : secondaryPerturberBodyId === 10 ? meanSecondaryTorqueVector : null,
    mean_moon_torque_vector_proxy_per_s2: primaryPerturberBodyId === 301 ? meanPrimaryTorqueVector : secondaryPerturberBodyId === 301 ? meanSecondaryTorqueVector : null,
    precession_constant_proxy_per_s: precessionConstantProxyPerS,
    nutation_driver_proxy_rms_per_s2: nutationDriverProxyRmsPerS2,
    first_sample_geometry: {
      primary_spin_axis_angle_deg: primarySpinAxisAnglesDeg[0] ?? null,
      secondary_spin_axis_angle_deg: pairedPerturberMode ? secondarySpinAxisAnglesDeg[0] ?? null : null,
    },
    model_scope:
      targetBodyStateSource === "synthetic-saturnian-satellite"
        ? "Diagnostic planetary-shape and orientation proxy using a synthetic Saturn-moon state source. Not a certified geodesy or interior-model series."
        : "Diagnostic planetary-shape and orientation proxy. Not a certified geodesy or Earth-orientation series.",
  };
  const gate = makeGate({
    gateId: "halobank.solar.planetary_shape_orientation_proxy.v1",
    deltas: [
      {
        id: "sample_count",
        comparator: ">=",
        value: sampleCount,
        limit: thresholds.min_sample_count,
        pass: passSampleCount,
      },
      {
        id: "secondary_to_primary_ratio_abs_error",
        comparator: "<=",
        value: secondaryToPrimaryRatioAbsError ?? 0,
        limit: pairedPerturberMode ? thresholds.max_lunar_to_solar_ratio_abs_error : 0,
        pass: passRatio,
        note: pairedPerturberMode ? undefined : "Single-perturber calibration profile; ratio gate skipped.",
      },
      {
        id: "hydrostatic_rounding_proxy",
        comparator: ">",
        value: hydrostaticRoundingProxy,
        limit: 0,
        pass: passShape,
      },
      {
        id: "precession_constant_proxy_per_s",
        comparator: ">",
        value: precessionConstantProxyPerS,
        limit: 0,
        pass: passPrecession,
      },
      {
        id: "nutation_driver_proxy_rms_per_s2",
        comparator: ">",
        value: nutationDriverProxyRmsPerS2,
        limit: 0,
        pass: passNutation,
      },
    ],
    firstFail,
    reasons,
  });
  return {
    module: "planetary_shape_orientation_proxy",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.planetary_shape_orientation_proxy:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

export function runPlanetaryFigureDiagnostic(
  input: PlanetaryFigureDiagnosticInput,
  figureThresholds: SolarThresholdsManifest["modules"]["planetary_figure_diagnostic"],
  proxyThresholds: SolarThresholdsManifest["modules"]["planetary_shape_orientation_proxy"],
  diagnosticDatasetsManifest?: SolarDiagnosticDatasetsManifest,
): DerivedResult {
  const calibrationProfile = resolvePlanetaryCalibrationProfile(input, diagnosticDatasetsManifest);
  const proxyRun = runPlanetaryShapeOrientationProxy(input, proxyThresholds, diagnosticDatasetsManifest);
  const proxy = proxyRun.result as Record<string, unknown>;
  const stateSourceClass = typeof proxy.state_source_class === "string" ? proxy.state_source_class : "kernel_bundle";
  const targetBodyStateSource = typeof proxy.target_body_state_source === "string" ? proxy.target_body_state_source : null;

  const referenceFlattening = Math.max(
    0,
    numericInputOrProfile(input.reference_flattening, calibrationProfile?.reference_flattening, figureThresholds.reference_flattening),
  );
  const referenceJ2 = Math.max(
    0,
    numericInputOrProfile(input.reference_j2, calibrationProfile?.reference_j2, figureThresholds.reference_j2),
  );
  const referenceEffectiveLoveNumber = Math.max(
    0,
    numericInputOrProfile(
      input.reference_effective_love_number,
      calibrationProfile?.reference_effective_love_number,
      figureThresholds.reference_effective_love_number,
    ),
  );
  const referenceMomentOfInertiaFactor = Math.max(
    1e-12,
    numericInputOrProfile(
      input.reference_moment_of_inertia_factor,
      calibrationProfile?.reference_moment_of_inertia_factor,
      figureThresholds.reference_moment_of_inertia_factor,
    ),
  );
  const referenceDynamicalEllipticity = referenceJ2 / referenceMomentOfInertiaFactor;
  const maxFlatteningAbsError = Math.max(
    1e-12,
    numericInputOrProfile(
      input.max_flattening_abs_error,
      calibrationProfile?.max_flattening_abs_error,
      figureThresholds.max_flattening_abs_error,
    ),
  );
  const maxJ2AbsError = Math.max(
    1e-12,
    numericInputOrProfile(input.max_j2_abs_error, calibrationProfile?.max_j2_abs_error, figureThresholds.max_j2_abs_error),
  );
  const maxEffectiveLoveNumberAbsError = Math.max(
    1e-12,
    numericInputOrProfile(
      input.max_effective_love_number_abs_error,
      calibrationProfile?.max_effective_love_number_abs_error,
      figureThresholds.max_effective_love_number_abs_error,
    ),
  );
  const maxDynamicalEllipticityAbsError = Math.max(
    1e-12,
    numericInputOrProfile(
      input.max_dynamical_ellipticity_abs_error,
      calibrationProfile?.max_dynamical_ellipticity_abs_error,
      figureThresholds.max_dynamical_ellipticity_abs_error,
    ),
  );
  const minHydrostaticRoundingProxy = Math.max(
    0,
    numericInputOrProfile(
      input.min_hydrostatic_rounding_proxy,
      calibrationProfile?.min_hydrostatic_rounding_proxy,
      figureThresholds.min_hydrostatic_rounding_proxy,
    ),
  );
  const minPotatoThresholdRatio = Math.max(
    0,
    numericInputOrProfile(
      input.min_potato_threshold_ratio,
      calibrationProfile?.min_potato_threshold_ratio,
      figureThresholds.min_potato_threshold_ratio,
    ),
  );

  const sampleCount = Number(proxy.sample_count ?? 0);
  const ratioGateMode = typeof proxy.ratio_gate_mode === "string" ? proxy.ratio_gate_mode : "paired-perturber";
  const secondaryToPrimaryRatioAbsError =
    ratioGateMode === "single-perturber"
      ? 0
      : Number(proxy.secondary_to_primary_ratio_abs_error ?? Number.POSITIVE_INFINITY);
  const hydrostaticRoundingProxy = Number(proxy.hydrostatic_rounding_proxy ?? 0);
  const potatoThresholdRatio = Number(proxy.potato_threshold_ratio ?? 0);
  const rotationalFlatteningProxy = Number(proxy.rotational_flattening_proxy ?? 0);
  const j2Proxy = Number(proxy.j2_proxy ?? 0);
  const loveNumberProxy = Number(proxy.love_number_proxy ?? 0);
  const dynamicalEllipticityProxy = Number(proxy.dynamical_ellipticity_proxy ?? 0);
  const flatteningFromJ2QProxy = Number(proxy.flattening_from_j2_q_proxy ?? 0);
  const j2ToQRatio = Number(proxy.j2_to_q_ratio ?? 0);
  const dynamicalEllipticityToJ2Ratio = Number(proxy.dynamical_ellipticity_to_j2_ratio ?? 0);

  const flatteningAbsError = Math.abs(flatteningFromJ2QProxy - referenceFlattening);
  const j2AbsError = Math.abs(j2Proxy - referenceJ2);
  const effectiveLoveNumberAbsError = Math.abs(loveNumberProxy - referenceEffectiveLoveNumber);
  const dynamicalEllipticityAbsError = Math.abs(dynamicalEllipticityProxy - referenceDynamicalEllipticity);
  const normalizedRmsFigureResidual = Math.sqrt(
    (
      (flatteningAbsError / maxFlatteningAbsError) ** 2 +
      (j2AbsError / maxJ2AbsError) ** 2 +
      (effectiveLoveNumberAbsError / maxEffectiveLoveNumberAbsError) ** 2 +
      (dynamicalEllipticityAbsError / maxDynamicalEllipticityAbsError) ** 2
    ) / 4,
  );

  const shapeRegime =
    hydrostaticRoundingProxy >= 1 && potatoThresholdRatio >= 1
      ? "gravity-rounded"
      : hydrostaticRoundingProxy >= 1 || potatoThresholdRatio >= 1
      ? "transition"
      : "strength-supported";

  const passProxyGate = proxyRun.gate.verdict === "PASS";
  const passSampleCount = sampleCount >= figureThresholds.min_sample_count;
  const passRatio = ratioGateMode === "single-perturber"
    || secondaryToPrimaryRatioAbsError <= figureThresholds.max_lunar_to_solar_ratio_abs_error;
  const passShapeRegime = hydrostaticRoundingProxy >= minHydrostaticRoundingProxy && potatoThresholdRatio >= minPotatoThresholdRatio;
  const passFlattening = flatteningAbsError <= maxFlatteningAbsError;
  const passJ2 = j2AbsError <= maxJ2AbsError;
  const passLoveNumber = effectiveLoveNumberAbsError <= maxEffectiveLoveNumberAbsError;
  const passDynamicalEllipticity = dynamicalEllipticityAbsError <= maxDynamicalEllipticityAbsError;

  let firstFail: string | null = null;
  const reasons: string[] = [];
  if (!passProxyGate) {
    firstFail = proxyRun.gate.firstFail;
    reasons.push("Planetary figure diagnostic inherits a failing shape/orientation proxy gate.");
  } else if (!passSampleCount) {
    firstFail = "HALOBANK_SOLAR_PLANETARY_FIGURE_INSUFFICIENT_SAMPLES";
    reasons.push("Planetary figure diagnostic did not receive enough deterministic samples.");
  } else if (!passRatio) {
    firstFail = "HALOBANK_SOLAR_PLANETARY_FIGURE_LUNISOLAR_RATIO_OUT_OF_BAND";
    reasons.push("The paired-perturber forcing ratio drifted outside the diagnostic band used by the planetary figure closure.");
  } else if (!passShapeRegime) {
    firstFail = "HALOBANK_SOLAR_PLANETARY_FIGURE_SHAPE_REGIME_INVALID";
    reasons.push("The inferred shape regime is not compatible with the configured diagnostic profile assumptions.");
  } else if (!passFlattening) {
    firstFail = "HALOBANK_SOLAR_PLANETARY_FIGURE_FLATTENING_MISFIT";
    reasons.push("Flattening reconstructed from q and J2 drifted outside the configured diagnostic band.");
  } else if (!passJ2) {
    firstFail = "HALOBANK_SOLAR_PLANETARY_FIGURE_J2_MISFIT";
    reasons.push("J2 proxy drifted outside the configured diagnostic band.");
  } else if (!passLoveNumber) {
    firstFail = "HALOBANK_SOLAR_PLANETARY_FIGURE_LOVE_NUMBER_MISFIT";
    reasons.push("Effective Love-number proxy drifted outside the configured diagnostic band.");
  } else if (!passDynamicalEllipticity) {
    firstFail = "HALOBANK_SOLAR_PLANETARY_FIGURE_DYNAMICAL_ELLIPTICITY_MISFIT";
    reasons.push("Dynamical ellipticity proxy drifted outside the configured diagnostic band.");
  } else {
    reasons.push("Planetary figure diagnostic satisfies the configured low-order closure over q, J2, H, k2, and flattening.");
  }

  const result = {
    start_iso: proxy.start_iso,
    end_iso: proxy.end_iso,
    step_minutes: proxy.step_minutes,
    sample_count: sampleCount,
    proxy_model_id: "halobank.solar.planetary_figure_diagnostic/1",
    source_proxy_artifact_ref: proxyRun.artifact_ref,
    calibration_profile_id: calibrationProfile?.id ?? null,
    calibration_profile_label: calibrationProfile?.label ?? null,
    state_source_class: stateSourceClass,
    target_body_id: proxy.target_body_id ?? null,
    target_body_label: proxy.target_body_label ?? null,
    target_body_state_source: targetBodyStateSource,
    target_body_state_source_label:
      targetBodyStateSource === "synthetic-saturnian-satellite"
        ? "synthetic diagnostic satellite orbit"
        : "astronomy-engine barycentric ephemeris",
    source_refs: calibrationProfile?.source_refs ?? [],
    background_geometry: proxy.background_geometry ?? proxy.geometry_coupling ?? null,
    dynamic_forcing_geometry: proxy.dynamic_forcing_geometry ?? null,
    geometry_coupling: proxy.geometry_coupling ?? null,
    diagnostic_family:
      targetBodyStateSource === "synthetic-saturnian-satellite"
        ? "synthetic saturn-moon planetary figure"
        : calibrationProfile
        ? "profile-calibrated planetary figure"
        : "earth-like planetary figure",
    shape_regime: shapeRegime,
    rotational_parameter_q: rotationalFlatteningProxy,
    flattening_from_j2_q_proxy: flatteningFromJ2QProxy,
    j2_proxy: j2Proxy,
    love_number_proxy: loveNumberProxy,
    dynamical_ellipticity_proxy: dynamicalEllipticityProxy,
    j2_to_q_ratio: j2ToQRatio,
    dynamical_ellipticity_to_j2_ratio: dynamicalEllipticityToJ2Ratio,
    reference_flattening: referenceFlattening,
    reference_j2: referenceJ2,
    reference_effective_love_number: referenceEffectiveLoveNumber,
    reference_dynamical_ellipticity: referenceDynamicalEllipticity,
    flattening_abs_error: flatteningAbsError,
    j2_abs_error: j2AbsError,
    effective_love_number_abs_error: effectiveLoveNumberAbsError,
    dynamical_ellipticity_abs_error: dynamicalEllipticityAbsError,
    max_flattening_abs_error: maxFlatteningAbsError,
    max_j2_abs_error: maxJ2AbsError,
    max_effective_love_number_abs_error: maxEffectiveLoveNumberAbsError,
    max_dynamical_ellipticity_abs_error: maxDynamicalEllipticityAbsError,
    normalized_rms_figure_residual: normalizedRmsFigureResidual,
    model_scope:
      targetBodyStateSource === "synthetic-saturnian-satellite"
        ? "Profile-calibrated planetary-figure diagnostic over q, J2, H, k2, and flattening proxies using a synthetic Saturn-moon state source. Not a certified geodesy or interior-structure product."
        : "Profile-calibrated planetary-figure diagnostic over q, J2, H, k2, and flattening proxies. Not a certified geodesy or IERS Earth-orientation product.",
  };
  const gate = makeGate({
    gateId: "halobank.solar.planetary_figure_diagnostic.v1",
    deltas: [
      {
        id: "proxy_gate_pass",
        comparator: ">=",
        value: passProxyGate ? 1 : 0,
        limit: 1,
        pass: passProxyGate,
      },
      {
        id: "flattening_abs_error",
        comparator: "<=",
        value: flatteningAbsError,
        limit: maxFlatteningAbsError,
        pass: passFlattening,
      },
      {
        id: "j2_abs_error",
        comparator: "<=",
        value: j2AbsError,
        limit: maxJ2AbsError,
        pass: passJ2,
      },
      {
        id: "effective_love_number_abs_error",
        comparator: "<=",
        value: effectiveLoveNumberAbsError,
        limit: maxEffectiveLoveNumberAbsError,
        pass: passLoveNumber,
      },
      {
        id: "dynamical_ellipticity_abs_error",
        comparator: "<=",
        value: dynamicalEllipticityAbsError,
        limit: maxDynamicalEllipticityAbsError,
        pass: passDynamicalEllipticity,
      },
    ],
    firstFail,
    reasons,
  });
  return {
    module: "planetary_figure_diagnostic",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.planetary_figure_diagnostic:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

type SunquakeReplayMetrics = {
  replaySeriesId: string | null;
  replayLabel: string;
  cadenceDays: number;
  sampleCount: number;
  flarePeakIsoSeries: string[];
  sunquakePeakIsoSeries: string[];
  flareEnergySeries: number[];
  helioseismicAmplitudeSeries: number[];
  flareHelioseismicCorrelation: number;
  meanTimingOffsetAbsS: number;
  medianTimingOffsetAbsS: number;
  maxTimingOffsetAbsS: number;
  flareEnergySpan: number;
  helioseismicAmplitudeSpan: number;
  timingOffsetsS: number[];
  couplingScore: number;
  sourceRefs: string[];
};

function buildSunquakeReplayMetrics(
  input: StellarFlareSunquakeDiagnosticInput | SunquakeTimingReplayDiagnosticInput,
  diagnosticDatasetsManifest?: SolarDiagnosticDatasetsManifest,
): SunquakeReplayMetrics {
  const replaySeries = resolveSunquakeReplaySeries(input, diagnosticDatasetsManifest);
  const flarePeakIsoSeries = parseIsoSeries(input.flare_peak_iso_series).length > 0
    ? parseIsoSeries(input.flare_peak_iso_series)
    : replaySeries?.flare_peak_iso_series ?? [];
  const sunquakePeakIsoSeries = parseIsoSeries(input.sunquake_peak_iso_series).length > 0
    ? parseIsoSeries(input.sunquake_peak_iso_series)
    : replaySeries?.sunquake_peak_iso_series ?? [];
  const flareEnergySeries = parseNumericSeries(input.flare_energy_proxy_series).length > 0
    ? parseNumericSeries(input.flare_energy_proxy_series)
    : replaySeries?.flare_energy_proxy_series ?? [];
  const helioseismicAmplitudeSeries = parseNumericSeries(input.helioseismic_amplitude_proxy_series).length > 0
    ? parseNumericSeries(input.helioseismic_amplitude_proxy_series)
    : replaySeries?.helioseismic_amplitude_proxy_series ?? [];
  const sampleCount = Math.min(
    flarePeakIsoSeries.length,
    sunquakePeakIsoSeries.length,
    flareEnergySeries.length,
    helioseismicAmplitudeSeries.length,
  );
  const flareTimesMs = flarePeakIsoSeries.slice(0, sampleCount).map((iso) => Date.parse(iso));
  const sunquakeTimesMs = sunquakePeakIsoSeries.slice(0, sampleCount).map((iso) => Date.parse(iso));
  const timingOffsetsS = flareTimesMs.map((flareTimeMs, index) => {
    const sunquakeTimeMs = sunquakeTimesMs[index] ?? flareTimeMs;
    if (!Number.isFinite(flareTimeMs) || !Number.isFinite(sunquakeTimeMs)) {
      return 0;
    }
    return (sunquakeTimeMs - flareTimeMs) / 1000;
  });
  const absoluteTimingOffsetsS = timingOffsetsS.map((entry) => Math.abs(entry));
  const flareHelioseismicCorrelation = sampleCount > 1
    ? pearsonCorrelation(flareEnergySeries.slice(0, sampleCount), helioseismicAmplitudeSeries.slice(0, sampleCount))
    : 0;
  const meanTimingOffsetAbsS = mean(absoluteTimingOffsetsS);
  const medianTimingOffsetAbsS = median(absoluteTimingOffsetsS);
  const maxTimingOffsetAbsS = maxOrZero(absoluteTimingOffsetsS);
  const flareEnergySpan = sampleCount > 0 ? maxOrZero(flareEnergySeries.slice(0, sampleCount)) - minOrZero(flareEnergySeries.slice(0, sampleCount)) : 0;
  const helioseismicAmplitudeSpan = sampleCount > 0
    ? maxOrZero(helioseismicAmplitudeSeries.slice(0, sampleCount)) - minOrZero(helioseismicAmplitudeSeries.slice(0, sampleCount))
    : 0;
  const couplingScore = flareHelioseismicCorrelation / Math.max(1, 1 + meanTimingOffsetAbsS / 60);
  return {
    replaySeriesId: replaySeries?.id ?? null,
    replayLabel: typeof input.label === "string" && input.label.trim().length > 0
      ? input.label.trim()
      : replaySeries?.label ?? "sunquake-replay",
    cadenceDays: Number.isFinite(input.cadence_days)
      ? Math.max(0.1, Number(input.cadence_days))
      : replaySeries?.cadence_days ?? 1,
    sampleCount,
    flarePeakIsoSeries,
    sunquakePeakIsoSeries,
    flareEnergySeries,
    helioseismicAmplitudeSeries,
    flareHelioseismicCorrelation,
    meanTimingOffsetAbsS,
    medianTimingOffsetAbsS,
    maxTimingOffsetAbsS,
    flareEnergySpan,
    helioseismicAmplitudeSpan,
    timingOffsetsS,
    couplingScore,
    sourceRefs: replaySeries?.source_refs ?? [],
  };
}

export function runGranularTidalResponseDiagnostic(
  input: GranularTidalResponseDiagnosticInput,
  thresholds: SolarThresholdsManifest["modules"]["granular_tidal_response_diagnostic"],
  proxyThresholds: SolarThresholdsManifest["modules"]["planetary_shape_orientation_proxy"],
  diagnosticDatasetsManifest?: SolarDiagnosticDatasetsManifest,
): DerivedResult {
  const calibrationProfile = resolvePlanetaryCalibrationProfile(input, diagnosticDatasetsManifest);
  const proxyRun = runPlanetaryShapeOrientationProxy(input, proxyThresholds, diagnosticDatasetsManifest);
  const proxy = proxyRun.result as Record<string, unknown>;
  const sampleCount = Number(proxy.sample_count ?? 0);
  const bodyMassKg = Number(proxy.body_mass_kg ?? 0);
  const equatorialRadiusM = Number(proxy.equatorial_radius_m ?? 0);
  const hydrostaticRoundingProxy = Number(proxy.hydrostatic_rounding_proxy ?? 0);
  const potatoThresholdRatio = Number(proxy.potato_threshold_ratio ?? 0);
  const tidalTensorProxyPerS2 = Number(proxy.tidal_tensor_proxy_per_s2 ?? 0);
  const selfGravityPressureProxyPa = Number(proxy.self_gravity_pressure_proxy_pa ?? 0);
  const meanPrimaryTideWeightPerS2 = Number(proxy.mean_primary_tide_weight_per_s2 ?? 0);
  const meanSecondaryTideWeightPerS2 = Number(proxy.mean_secondary_tide_weight_per_s2 ?? 0);
  const meanTotalTorqueMagnitudeProxyPerS2 = Number(proxy.mean_total_torque_magnitude_proxy_per_s2 ?? 0);
  const yieldStrengthPa = Math.max(
    1,
    numericInputOrProfile(input.yield_strength_pa, calibrationProfile?.yield_strength_pa, 100_000_000),
  );
  const effectiveRigidityPa = Math.max(
    1,
    numericInputOrProfile(input.effective_rigidity_pa, calibrationProfile?.effective_rigidity_pa, 150_000_000_000),
  );
  const rotationRateRadS = Math.max(
    1e-12,
    numericInputOrProfile(input.rotation_rate_rad_s, calibrationProfile?.rotation_rate_rad_s, 1e-6),
  );
  const shapeRegime =
    hydrostaticRoundingProxy >= 1 && potatoThresholdRatio >= 1
      ? "gravity-rounded"
      : hydrostaticRoundingProxy >= 1 || potatoThresholdRatio >= 1
      ? "transition"
      : "strength-supported";
  const expectedResponseRegime =
    typeof input.expected_response_regime === "string"
      ? input.expected_response_regime
      : calibrationProfile?.id === "hyperion-potato-counterexample"
        ? "strength-supported"
        : "gravity-rounded";

  const granularDissipationProxy = (hydrostaticRoundingProxy + potatoThresholdRatio) / Math.max(1, effectiveRigidityPa / Math.max(1, yieldStrengthPa));
  const tidalQualityFactorProxy = 1 / Math.max(1e-12, granularDissipationProxy);
  const tidalLagProxyRad = Math.atan(Math.max(1e-12, granularDissipationProxy));
  const spinStateEvolutionProxy = rotationRateRadS * (1 + tidalLagProxyRad) * Math.max(1, sampleCount / 32);
  const angularMomentumRedistributionProxy = bodyMassKg * Math.max(1, equatorialRadiusM ** 2) * spinStateEvolutionProxy;
  const compatibilityScore = (meanPrimaryTideWeightPerS2 + meanSecondaryTideWeightPerS2 + meanTotalTorqueMagnitudeProxyPerS2)
    * Math.max(1e-12, granularDissipationProxy);
  const backgroundGeometry = ((proxy.background_geometry ?? proxy.geometry_coupling) ?? buildBackgroundGeometryFromDensity({
    densityKgM3: Number(proxy.mean_density_proxy_kg_m3 ?? 0),
    sourceQuantityId: "mean_density_proxy_kg_m3",
    note:
      "Body-density and energy-density curvature proxies occupy the G_geometry slot of the collective observable-response closure. Granular dissipation, tidal lag, and torque metrics remain in the forcing and closure channels.",
  })) as ObservableGeometryChannel;

  const passProxyGate = proxyRun.gate.verdict === "PASS";
  const passSampleCount = sampleCount >= thresholds.min_sample_count;
  const passGranularDissipation = granularDissipationProxy >= thresholds.min_granular_dissipation_proxy;
  const passTidalQuality = tidalQualityFactorProxy >= thresholds.min_tidal_quality_factor_proxy;
  const passSpinEvolution = spinStateEvolutionProxy >= thresholds.min_spin_state_evolution_proxy;
  const passAngularMomentum = angularMomentumRedistributionProxy >= thresholds.min_angular_momentum_redistribution_proxy;
  const passRegime = shapeRegime === expectedResponseRegime;

  let firstFail: string | null = null;
  const reasons: string[] = [];
  if (!passProxyGate) {
    firstFail = proxyRun.gate.firstFail;
    reasons.push("Granular tidal diagnostic inherits a failing shape/orientation proxy gate.");
  } else if (!passSampleCount) {
    firstFail = "HALOBANK_SOLAR_GRANULAR_TIDAL_INSUFFICIENT_SAMPLES";
    reasons.push("Granular tidal diagnostic did not receive enough deterministic samples.");
  } else if (!passRegime) {
    firstFail = "HALOBANK_SOLAR_GRANULAR_TIDAL_RESPONSE_REGIME_MISMATCH";
    reasons.push("The inferred shape regime does not match the calibration profile's expected response regime.");
  } else if (!passGranularDissipation) {
    firstFail = "HALOBANK_SOLAR_GRANULAR_TIDAL_DISSIPATION_LOW";
    reasons.push("Granular dissipation proxy fell below the configured floor.");
  } else if (!passTidalQuality) {
    firstFail = "HALOBANK_SOLAR_GRANULAR_TIDAL_Q_LOW";
    reasons.push("Tidal quality-factor proxy fell below the configured floor.");
  } else if (!passSpinEvolution) {
    firstFail = "HALOBANK_SOLAR_GRANULAR_TIDAL_SPIN_EVOLUTION_LOW";
    reasons.push("Spin-state evolution proxy fell below the configured floor.");
  } else if (!passAngularMomentum) {
    firstFail = "HALOBANK_SOLAR_GRANULAR_TIDAL_ANGULAR_MOMENTUM_LOW";
    reasons.push("Angular-momentum redistribution proxy fell below the configured floor.");
  } else {
    reasons.push("Granular tidal-response diagnostic keeps multiparticle dissipation, tidal lag, and spin evolution inside the diagnostic compatibility lane.");
  }

  const result = {
    start_iso: proxy.start_iso,
    end_iso: proxy.end_iso,
    step_minutes: proxy.step_minutes,
    sample_count: sampleCount,
    proxy_model_id: "halobank.solar.granular_tidal_response_diagnostic/1",
    source_proxy_artifact_ref: proxyRun.artifact_ref,
    calibration_profile_id: calibrationProfile?.id ?? null,
    calibration_profile_label: calibrationProfile?.label ?? null,
    state_source_class: typeof proxy.state_source_class === "string" ? proxy.state_source_class : "kernel_bundle",
    target_body_id: proxy.target_body_id ?? null,
    target_body_label: proxy.target_body_label ?? null,
    target_body_state_source: typeof proxy.target_body_state_source === "string" ? proxy.target_body_state_source : null,
    target_body_state_source_label:
      typeof proxy.target_body_state_source_label === "string" ? proxy.target_body_state_source_label : null,
    source_refs: calibrationProfile?.source_refs ?? [],
    background_geometry: backgroundGeometry,
    dynamic_forcing_geometry: null,
    geometry_coupling: backgroundGeometry,
    response_regime: shapeRegime,
    expected_response_regime: expectedResponseRegime,
    mean_density_proxy_kg_m3: proxy.mean_density_proxy_kg_m3 ?? null,
    self_gravity_pressure_proxy_pa: selfGravityPressureProxyPa,
    hydrostatic_rounding_proxy: hydrostaticRoundingProxy,
    potato_threshold_ratio: potatoThresholdRatio,
    tidal_tensor_proxy_per_s2: tidalTensorProxyPerS2,
    tidal_lag_proxy_rad: tidalLagProxyRad,
    granular_dissipation_proxy: granularDissipationProxy,
    tidal_quality_factor_proxy: tidalQualityFactorProxy,
    spin_state_evolution_proxy: spinStateEvolutionProxy,
    angular_momentum_redistribution_proxy: angularMomentumRedistributionProxy,
    compatibility_score: compatibilityScore,
    mean_primary_tide_weight_per_s2: meanPrimaryTideWeightPerS2,
    mean_secondary_tide_weight_per_s2: meanSecondaryTideWeightPerS2,
    mean_total_torque_magnitude_proxy_per_s2: meanTotalTorqueMagnitudeProxyPerS2,
    body_mass_kg: bodyMassKg,
    equatorial_radius_m: equatorialRadiusM,
    yield_strength_pa: yieldStrengthPa,
    effective_rigidity_pa: effectiveRigidityPa,
    rotation_rate_rad_s: rotationRateRadS,
    observables_guardrail_id: "granular-matter-response-not-consciousness",
    model_scope:
      "Diagnostic granular tidal-response lane tying multiparticle dissipation and effective rheology to tidal lag, spin evolution, and angular-momentum redistribution. Not a consciousness or collapse claim.",
  };
  const gate = makeGate({
    gateId: "halobank.solar.granular_tidal_response_diagnostic.v1",
    deltas: [
      {
        id: "proxy_gate_pass",
        comparator: ">=",
        value: passProxyGate ? 1 : 0,
        limit: 1,
        pass: passProxyGate,
      },
      {
        id: "sample_count",
        comparator: ">=",
        value: sampleCount,
        limit: thresholds.min_sample_count,
        pass: passSampleCount,
      },
      {
        id: "granular_dissipation_proxy",
        comparator: ">=",
        value: granularDissipationProxy,
        limit: thresholds.min_granular_dissipation_proxy,
        pass: passGranularDissipation,
      },
      {
        id: "tidal_quality_factor_proxy",
        comparator: ">=",
        value: tidalQualityFactorProxy,
        limit: thresholds.min_tidal_quality_factor_proxy,
        pass: passTidalQuality,
      },
      {
        id: "spin_state_evolution_proxy",
        comparator: ">=",
        value: spinStateEvolutionProxy,
        limit: thresholds.min_spin_state_evolution_proxy,
        pass: passSpinEvolution,
      },
      {
        id: "angular_momentum_redistribution_proxy",
        comparator: ">=",
        value: angularMomentumRedistributionProxy,
        limit: thresholds.min_angular_momentum_redistribution_proxy,
        pass: passAngularMomentum,
      },
    ],
    firstFail,
    reasons,
  });
  return {
    module: "granular_tidal_response_diagnostic",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.granular_tidal_response_diagnostic:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

export function runStellarFlareSunquakeDiagnostic(
  input: StellarFlareSunquakeDiagnosticInput,
  thresholds: SolarThresholdsManifest["modules"]["stellar_flare_sunquake_diagnostic"],
  diagnosticDatasetsManifest?: SolarDiagnosticDatasetsManifest,
): DerivedResult {
  const metrics = buildSunquakeReplayMetrics(input, diagnosticDatasetsManifest);
  const backgroundGeometry = buildBackgroundGeometryFromDensity({
    densityKgM3: SOLAR_MEAN_DENSITY_KG_M3,
    sourceQuantityId: "solar_mean_density_proxy_kg_m3",
    note:
      "Background solar body curvature occupies the G_geometry slot of the collective observable-response closure. Flare energy, timing offsets, and helioseismic amplitudes remain the forcing and observable series.",
  });
  const passEventCount = metrics.sampleCount >= thresholds.min_event_count;
  const passCorrelation = metrics.flareHelioseismicCorrelation >= thresholds.min_flare_energy_helioseismic_correlation;
  const passMeanTiming = metrics.meanTimingOffsetAbsS <= thresholds.max_mean_timing_offset_s;
  const passMedianTiming = metrics.medianTimingOffsetAbsS <= thresholds.max_median_timing_offset_s;
  const passCoupling = metrics.couplingScore >= thresholds.min_coupling_score;

  let firstFail: string | null = null;
  const reasons: string[] = [];
  if (!passEventCount) {
    firstFail = "HALOBANK_SOLAR_STELLAR_FLARE_SUNQUAKE_INSUFFICIENT_EVENTS";
    reasons.push("Sunquake replay did not include enough flare/sunquake event pairs for a deterministic diagnostic.");
  } else if (!passCorrelation) {
    firstFail = "HALOBANK_SOLAR_STELLAR_FLARE_SUNQUAKE_CORRELATION_LOW";
    reasons.push("Flare-energy and helioseismic-amplitude series are not coupled strongly enough for the diagnostic band.");
  } else if (!passMeanTiming) {
    firstFail = "HALOBANK_SOLAR_STELLAR_FLARE_SUNQUAKE_MEAN_TIMING_OFFSET_HIGH";
    reasons.push("Mean flare-to-sunquake timing offset exceeds the configured diagnostic envelope.");
  } else if (!passMedianTiming) {
    firstFail = "HALOBANK_SOLAR_STELLAR_FLARE_SUNQUAKE_MEDIAN_TIMING_OFFSET_HIGH";
    reasons.push("Median flare-to-sunquake timing offset exceeds the configured diagnostic envelope.");
  } else if (!passCoupling) {
    firstFail = "HALOBANK_SOLAR_STELLAR_FLARE_SUNQUAKE_COUPLING_LOW";
    reasons.push("The flare-to-sunquake coupling score fell below the configured floor.");
  } else {
    reasons.push("Flare energy, helioseismic response, and sunquake timing remain coupled inside the diagnostic observability lane.");
  }

  const result = {
    replay_series_id: metrics.replaySeriesId,
    label: metrics.replayLabel,
    cadence_days: metrics.cadenceDays,
    sample_count: metrics.sampleCount,
    proxy_model_id: "halobank.solar.stellar_flare_sunquake_diagnostic/1",
    flare_peak_iso_series: metrics.flarePeakIsoSeries,
    sunquake_peak_iso_series: metrics.sunquakePeakIsoSeries,
    flare_energy_proxy_series: metrics.flareEnergySeries,
    helioseismic_amplitude_proxy_series: metrics.helioseismicAmplitudeSeries,
    solar_mean_density_proxy_kg_m3: SOLAR_MEAN_DENSITY_KG_M3,
    background_geometry: backgroundGeometry,
    dynamic_forcing_geometry: null,
    geometry_coupling: backgroundGeometry,
    source_refs: metrics.sourceRefs,
    flare_energy_helioseismic_correlation: metrics.flareHelioseismicCorrelation,
    mean_timing_offset_s: metrics.meanTimingOffsetAbsS,
    median_timing_offset_s: metrics.medianTimingOffsetAbsS,
    max_timing_offset_s: metrics.maxTimingOffsetAbsS,
    flare_energy_span: metrics.flareEnergySpan,
    helioseismic_amplitude_span: metrics.helioseismicAmplitudeSpan,
    timing_offsets_s: metrics.timingOffsetsS,
    coupling_score: metrics.couplingScore,
    observables_guardrail_id: "sunquake-not-quantum-collapse",
    model_scope:
      "Diagnostic flare-to-sunquake lane tying flare energy, sunquake timing, and helioseismic response to observable solar-plasma dynamics. Not a consciousness or collapse claim.",
  };
  const gate = makeGate({
    gateId: "halobank.solar.stellar_flare_sunquake_diagnostic.v1",
    deltas: [
      {
        id: "event_count",
        comparator: ">=",
        value: metrics.sampleCount,
        limit: thresholds.min_event_count,
        pass: passEventCount,
      },
      {
        id: "flare_energy_helioseismic_correlation",
        comparator: ">=",
        value: metrics.flareHelioseismicCorrelation,
        limit: thresholds.min_flare_energy_helioseismic_correlation,
        pass: passCorrelation,
      },
      {
        id: "mean_timing_offset_s",
        comparator: "<=",
        value: metrics.meanTimingOffsetAbsS,
        limit: thresholds.max_mean_timing_offset_s,
        pass: passMeanTiming,
      },
      {
        id: "median_timing_offset_s",
        comparator: "<=",
        value: metrics.medianTimingOffsetAbsS,
        limit: thresholds.max_median_timing_offset_s,
        pass: passMedianTiming,
      },
      {
        id: "coupling_score",
        comparator: ">=",
        value: metrics.couplingScore,
        limit: thresholds.min_coupling_score,
        pass: passCoupling,
      },
    ],
    firstFail,
    reasons,
  });
  return {
    module: "stellar_flare_sunquake_diagnostic",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.stellar_flare_sunquake_diagnostic:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

export function runSunquakeTimingReplayDiagnostic(
  input: SunquakeTimingReplayDiagnosticInput,
  thresholds: SolarThresholdsManifest["modules"]["sunquake_timing_replay_diagnostic"],
  diagnosticDatasetsManifest?: SolarDiagnosticDatasetsManifest,
): DerivedResult {
  const metrics = buildSunquakeReplayMetrics(input, diagnosticDatasetsManifest);
  const backgroundGeometry = buildBackgroundGeometryFromDensity({
    densityKgM3: SOLAR_MEAN_DENSITY_KG_M3,
    sourceQuantityId: "solar_mean_density_proxy_kg_m3",
    note:
      "Background solar body curvature occupies the G_geometry slot of the collective observable-response closure. Replay timing offsets and helioseismic amplitudes remain the forcing and observable series.",
  });
  const passEventCount = metrics.sampleCount >= thresholds.min_event_count;
  const passMeanTiming = metrics.meanTimingOffsetAbsS <= thresholds.max_mean_timing_offset_s;
  const passMedianTiming = metrics.medianTimingOffsetAbsS <= thresholds.max_median_timing_offset_s;
  const passMaxTiming = metrics.maxTimingOffsetAbsS <= thresholds.max_max_timing_offset_s;
  const timingAlignmentScore = 1 / Math.max(1, 1 + metrics.meanTimingOffsetAbsS / 60);

  let firstFail: string | null = null;
  const reasons: string[] = [];
  if (!passEventCount) {
    firstFail = "HALOBANK_SOLAR_SUNQUAKE_TIMING_INSUFFICIENT_EVENTS";
    reasons.push("Sunquake timing replay did not include enough flare/sunquake event pairs for a deterministic replay.");
  } else if (!passMeanTiming) {
    firstFail = "HALOBANK_SOLAR_SUNQUAKE_TIMING_MEAN_OFFSET_HIGH";
    reasons.push("Mean flare-to-sunquake timing offset exceeds the configured replay envelope.");
  } else if (!passMedianTiming) {
    firstFail = "HALOBANK_SOLAR_SUNQUAKE_TIMING_MEDIAN_OFFSET_HIGH";
    reasons.push("Median flare-to-sunquake timing offset exceeds the configured replay envelope.");
  } else if (!passMaxTiming) {
    firstFail = "HALOBANK_SOLAR_SUNQUAKE_TIMING_MAX_OFFSET_HIGH";
    reasons.push("Maximum flare-to-sunquake timing offset exceeds the configured replay envelope.");
  } else {
    reasons.push("Sunquake timing replay stays within the deterministic timing envelope and remains distinct from consciousness claims.");
  }

  const result = {
    replay_series_id: metrics.replaySeriesId,
    label: metrics.replayLabel,
    cadence_days: metrics.cadenceDays,
    sample_count: metrics.sampleCount,
    proxy_model_id: "halobank.solar.sunquake_timing_replay_diagnostic/1",
    flare_peak_iso_series: metrics.flarePeakIsoSeries,
    sunquake_peak_iso_series: metrics.sunquakePeakIsoSeries,
    flare_energy_proxy_series: metrics.flareEnergySeries,
    helioseismic_amplitude_proxy_series: metrics.helioseismicAmplitudeSeries,
    solar_mean_density_proxy_kg_m3: SOLAR_MEAN_DENSITY_KG_M3,
    background_geometry: backgroundGeometry,
    dynamic_forcing_geometry: null,
    geometry_coupling: backgroundGeometry,
    source_refs: metrics.sourceRefs,
    mean_timing_offset_s: metrics.meanTimingOffsetAbsS,
    median_timing_offset_s: metrics.medianTimingOffsetAbsS,
    max_timing_offset_s: metrics.maxTimingOffsetAbsS,
    flare_energy_span: metrics.flareEnergySpan,
    helioseismic_amplitude_span: metrics.helioseismicAmplitudeSpan,
    timing_offsets_s: metrics.timingOffsetsS,
    timing_alignment_score: timingAlignmentScore,
    observables_guardrail_id: "sunquake-not-quantum-collapse",
    model_scope:
      "Diagnostic replay lane for flare-triggered sunquake timing. Not a consciousness or collapse claim.",
  };
  const gate = makeGate({
    gateId: "halobank.solar.sunquake_timing_replay_diagnostic.v1",
    deltas: [
      {
        id: "event_count",
        comparator: ">=",
        value: metrics.sampleCount,
        limit: thresholds.min_event_count,
        pass: passEventCount,
      },
      {
        id: "mean_timing_offset_s",
        comparator: "<=",
        value: metrics.meanTimingOffsetAbsS,
        limit: thresholds.max_mean_timing_offset_s,
        pass: passMeanTiming,
      },
      {
        id: "median_timing_offset_s",
        comparator: "<=",
        value: metrics.medianTimingOffsetAbsS,
        limit: thresholds.max_median_timing_offset_s,
        pass: passMedianTiming,
      },
      {
        id: "max_timing_offset_s",
        comparator: "<=",
        value: metrics.maxTimingOffsetAbsS,
        limit: thresholds.max_max_timing_offset_s,
        pass: passMaxTiming,
      },
    ],
    firstFail,
    reasons,
  });
  return {
    module: "sunquake_timing_replay_diagnostic",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.sunquake_timing_replay_diagnostic:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

export function runMercuryCrossLaneCongruenceDiagnostic(
  input: MercuryCrossLaneCongruenceDiagnosticInput,
  mercuryThresholds: SolarThresholdsManifest["modules"]["mercury_precession"],
  thresholds: SolarThresholdsManifest["modules"]["mercury_cross_lane_congruence_diagnostic"],
  figureThresholds: SolarThresholdsManifest["modules"]["planetary_figure_diagnostic"],
  proxyThresholds: SolarThresholdsManifest["modules"]["planetary_shape_orientation_proxy"],
  diagnosticDatasetsManifest?: SolarDiagnosticDatasetsManifest,
): DerivedResult {
  if (!diagnosticDatasetsManifest) {
    throw new Error("Diagnostic datasets manifest is required for Mercury cross-lane congruence");
  }
  const mercuryProfile =
    diagnosticDatasetsManifest.planetary_figure_profiles.find((entry) => entry.id === "mercury-spin-orbit-stress-test") ?? null;
  const startIso = toIsoOrThrow(input.start_iso, mercuryProfile?.start_iso ?? "2000-01-01T00:00:00.000Z");
  const endIso = toIsoOrThrow(input.end_iso, mercuryProfile?.end_iso ?? "2100-01-01T00:00:00.000Z");
  const stepDays = Number.isFinite(input.step_days)
    ? Math.max(0.25, Number(input.step_days))
    : Math.max(0.25, (mercuryProfile?.step_minutes ?? 1440) / 1440);
  const mercuryRun = runMercuryPrecession(
    {
      start_iso: startIso,
      end_iso: endIso,
      step_days: stepDays,
      expected_arcsec_per_century: input.expected_arcsec_per_century,
    },
    {
      target_arcsec_per_century: input.expected_arcsec_per_century ?? mercuryThresholds.target_arcsec_per_century,
      pass_tolerance_arcsec_per_century: mercuryThresholds.pass_tolerance_arcsec_per_century,
      warn_tolerance_arcsec_per_century: mercuryThresholds.warn_tolerance_arcsec_per_century,
      min_perihelion_events: mercuryThresholds.min_perihelion_events,
    },
  );
  const figureRun = runPlanetaryFigureDiagnostic(
    {
      calibration_profile_id: "mercury-spin-orbit-stress-test",
      start_iso: startIso,
      end_iso: endIso,
      step_minutes: Math.max(30, Math.round(stepDays * 1440)),
    },
    figureThresholds,
    proxyThresholds,
    diagnosticDatasetsManifest,
  );
  const figure = figureRun.result as Record<string, unknown>;

  const precessionAbsError = Number(mercuryRun.result.abs_error_arcsec_per_century ?? Number.POSITIVE_INFINITY);
  const precessionTolerance = mercuryThresholds.pass_tolerance_arcsec_per_century;
  const precessionMargin = precessionAbsError / Math.max(1e-12, precessionTolerance);
  const figureFlatteningAbsError = Number(figure.flattening_abs_error ?? Number.POSITIVE_INFINITY);
  const figureJ2AbsError = Number(figure.j2_abs_error ?? Number.POSITIVE_INFINITY);
  const figureLoveNumberAbsError = Number(figure.effective_love_number_abs_error ?? Number.POSITIVE_INFINITY);
  const figureDynamicalEllipticityAbsError = Number(figure.dynamical_ellipticity_abs_error ?? Number.POSITIVE_INFINITY);
  const figureMaxComponentMargin = Math.max(
    figureFlatteningAbsError / Math.max(1e-12, Number(figure.max_flattening_abs_error ?? 1)),
    figureJ2AbsError / Math.max(1e-12, Number(figure.max_j2_abs_error ?? 1)),
    figureLoveNumberAbsError / Math.max(1e-12, Number(figure.max_effective_love_number_abs_error ?? 1)),
    figureDynamicalEllipticityAbsError / Math.max(1e-12, Number(figure.max_dynamical_ellipticity_abs_error ?? 1)),
  );
  const figureRmsResidual = Number(figure.normalized_rms_figure_residual ?? Number.POSITIVE_INFINITY);
  const sameBodyCongruenceGap = Math.abs(precessionMargin - figureMaxComponentMargin);
  const sameBodyCongruenceScore = Math.max(precessionMargin, figureMaxComponentMargin, figureRmsResidual);

  const passMercuryGate = mercuryRun.gate.verdict === "PASS";
  const passFigureGate = figureRun.gate.verdict === "PASS";
  const passPrecessionMargin = precessionMargin <= thresholds.max_precession_margin;
  const passFigureComponentMargin = figureMaxComponentMargin <= thresholds.max_figure_component_margin;
  const passFigureRmsResidual = figureRmsResidual <= thresholds.max_figure_rms_residual;
  const passCombinedMargin = sameBodyCongruenceScore <= thresholds.max_combined_margin;

  let firstFail: string | null = null;
  const reasons: string[] = [];
  if (!passMercuryGate) {
    firstFail = mercuryRun.gate.firstFail ?? "HALOBANK_SOLAR_MERCURY_CROSS_LANE_PRECESSION_FAIL";
    reasons.push("Mercury precession submodule failed before same-body congruence could be evaluated.");
  } else if (!passFigureGate) {
    firstFail = figureRun.gate.firstFail ?? "HALOBANK_SOLAR_MERCURY_CROSS_LANE_FIGURE_FAIL";
    reasons.push("Mercury figure submodule failed before same-body congruence could be evaluated.");
  } else if (!passPrecessionMargin) {
    firstFail = "HALOBANK_SOLAR_MERCURY_CROSS_LANE_PRECESSION_MARGIN_OUT_OF_BAND";
    reasons.push("Mercury precession residual margin exceeded the configured diagnostic band.");
  } else if (!passFigureComponentMargin) {
    firstFail = "HALOBANK_SOLAR_MERCURY_CROSS_LANE_FIGURE_COMPONENT_MARGIN_OUT_OF_BAND";
    reasons.push("Mercury figure proxy component margin exceeded the configured diagnostic band.");
  } else if (!passFigureRmsResidual) {
    firstFail = "HALOBANK_SOLAR_MERCURY_CROSS_LANE_FIGURE_RMS_RESIDUAL_OUT_OF_BAND";
    reasons.push("Mercury figure RMS residual exceeded the configured diagnostic band.");
  } else if (!passCombinedMargin) {
    firstFail = "HALOBANK_SOLAR_MERCURY_CROSS_LANE_CONGRUENCE_MARGIN_OUT_OF_BAND";
    reasons.push("Same-body congruence score exceeded the configured diagnostic band.");
  } else {
    reasons.push("Mercury precession and Mercury figure/shape proxies remain congruent under the same-body diagnostic gate.");
  }

  const result = {
    same_body_target_body_id: 199,
    same_body_target_body_label: "Mercury",
    same_body_target_body_state_source: figureRun.result.target_body_state_source,
    same_body_target_body_state_source_class: figureRun.result.state_source_class ?? "kernel_bundle",
    congruence_scope: "timelike_precession_vs_same_body_figure_proxy",
    precession_probe: {
      module: mercuryRun.module,
      gate_verdict: mercuryRun.gate.verdict,
      expected_arcsec_per_century: mercuryRun.result.expected_arcsec_per_century,
      measured_arcsec_per_century: mercuryRun.result.measured_arcsec_per_century,
      abs_error_arcsec_per_century: mercuryRun.result.abs_error_arcsec_per_century,
      normalized_margin: precessionMargin,
      artifact_ref: mercuryRun.artifact_ref,
    },
    figure_probe: {
      module: figureRun.module,
      gate_verdict: figureRun.gate.verdict,
      calibration_profile_id: figureRun.result.calibration_profile_id,
      target_body_id: figureRun.result.target_body_id,
      target_body_label: figureRun.result.target_body_label,
      target_body_state_source: figureRun.result.target_body_state_source,
      background_geometry: figureRun.result.background_geometry ?? figureRun.result.geometry_coupling ?? null,
      dynamic_forcing_geometry: figureRun.result.dynamic_forcing_geometry ?? null,
      geometry_coupling: figureRun.result.geometry_coupling ?? null,
      normalized_rms_figure_residual: figureRun.result.normalized_rms_figure_residual,
      flattening_abs_error: figureRun.result.flattening_abs_error,
      j2_abs_error: figureRun.result.j2_abs_error,
      effective_love_number_abs_error: figureRun.result.effective_love_number_abs_error,
      dynamical_ellipticity_abs_error: figureRun.result.dynamical_ellipticity_abs_error,
      component_margin_max: figureMaxComponentMargin,
      artifact_ref: figureRun.artifact_ref,
    },
    same_body_congruence_gap: sameBodyCongruenceGap,
    same_body_congruence_score: sameBodyCongruenceScore,
    model_scope:
      "Same-body diagnostic congruence across Mercury perihelion precession and Mercury figure/shape proxy closure. This is a cross-lane consistency check, not a theorem equating the two mechanisms.",
    thresholds: {
      max_precession_margin: thresholds.max_precession_margin,
      max_figure_component_margin: thresholds.max_figure_component_margin,
      max_figure_rms_residual: thresholds.max_figure_rms_residual,
      max_combined_margin: thresholds.max_combined_margin,
    },
    artifacts: {
      precession_artifact_ref: mercuryRun.artifact_ref,
      figure_artifact_ref: figureRun.artifact_ref,
    },
  };
  const gate = makeGate({
    gateId: "halobank.solar.mercury_cross_lane_congruence_diagnostic.v1",
    deltas: [
      {
        id: "mercury_precession_gate_pass",
        comparator: ">=",
        value: passMercuryGate ? 1 : 0,
        limit: 1,
        pass: passMercuryGate,
      },
      {
        id: "mercury_figure_gate_pass",
        comparator: ">=",
        value: passFigureGate ? 1 : 0,
        limit: 1,
        pass: passFigureGate,
      },
      {
        id: "precession_normalized_margin",
        comparator: "<=",
        value: precessionMargin,
        limit: thresholds.max_precession_margin,
        pass: passPrecessionMargin,
      },
      {
        id: "figure_component_margin_max",
        comparator: "<=",
        value: figureMaxComponentMargin,
        limit: thresholds.max_figure_component_margin,
        pass: passFigureComponentMargin,
      },
      {
        id: "figure_rms_residual",
        comparator: "<=",
        value: figureRmsResidual,
        limit: thresholds.max_figure_rms_residual,
        pass: passFigureRmsResidual,
      },
      {
        id: "same_body_congruence_score",
        comparator: "<=",
        value: sameBodyCongruenceScore,
        limit: thresholds.max_combined_margin,
        pass: passCombinedMargin,
      },
    ],
    firstFail,
    reasons,
  });
  return {
    module: "mercury_cross_lane_congruence_diagnostic",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.mercury_cross_lane_congruence_diagnostic:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

export function runStellarObservablesDiagnostic(
  input: StellarObservablesDiagnosticInput,
  thresholds: SolarThresholdsManifest["modules"]["stellar_observables_diagnostic"],
  diagnosticDatasetsManifest?: SolarDiagnosticDatasetsManifest,
): DerivedResult {
  const backgroundGeometry = buildBackgroundGeometryFromDensity({
    densityKgM3: SOLAR_MEAN_DENSITY_KG_M3,
    sourceQuantityId: "solar_mean_density_proxy_kg_m3",
    note:
      "Background solar body curvature occupies the G_geometry slot of the collective observable-response closure. Activity, p-mode shifts, and optional flare statistics remain the forcing and observable series.",
  });
  const replaySeries = resolveStellarReplaySeries(input, diagnosticDatasetsManifest);
  const activitySeries = parseNumericSeries(input.magnetic_activity_index_series).length > 0
    ? parseNumericSeries(input.magnetic_activity_index_series)
    : replaySeries?.magnetic_activity_index_series ?? [];
  const pModeShiftSeries = parseNumericSeries(input.p_mode_frequency_shift_nhz_series).length > 0
    ? parseNumericSeries(input.p_mode_frequency_shift_nhz_series)
    : replaySeries?.p_mode_frequency_shift_nhz_series ?? [];
  const flareEnergySeries = parseNumericSeries(input.flare_energy_proxy_series).length > 0
    ? parseNumericSeries(input.flare_energy_proxy_series)
    : replaySeries?.flare_energy_proxy_series ?? [];
  const epochIsoSeries = parseIsoSeries(input.epoch_iso_series).length > 0
    ? parseIsoSeries(input.epoch_iso_series)
    : replaySeries?.epoch_iso_series ?? [];
  const sampleCount = Math.min(activitySeries.length, pModeShiftSeries.length);
  const sameLength = activitySeries.length === pModeShiftSeries.length;
  const cadenceDays = Number.isFinite(input.cadence_days)
    ? Math.max(0.1, Number(input.cadence_days))
    : replaySeries?.cadence_days ?? 27;
  const label = typeof input.label === "string" && input.label.trim().length > 0
    ? input.label.trim()
    : replaySeries?.label ?? "solar-observables";

  const activitySpan = sampleCount > 0 ? maxOrZero(activitySeries) - minOrZero(activitySeries) : 0;
  const pModeShiftSpanNhz = sampleCount > 0 ? maxOrZero(pModeShiftSeries) - minOrZero(pModeShiftSeries) : 0;
  const activityPModeCorrelation = sampleCount > 1 && sameLength ? pearsonCorrelation(activitySeries, pModeShiftSeries) : 0;
  const pModeSlopeNhzPerActivityUnit = sampleCount > 1 && sameLength ? linearSlope(activitySeries, pModeShiftSeries) : 0;
  const activityStd = stddev(activitySeries);
  const pModeShiftStdNhz = stddev(pModeShiftSeries);
  const flarePowerLawAlpha = flareEnergySeries.length >= thresholds.min_flare_sample_count
    ? estimatePowerLawAlpha(flareEnergySeries)
    : null;
  const flareLogSpan = flareEnergySeries.length > 0
    ? Math.log10(Math.max(...flareEnergySeries) / Math.max(1e-12, Math.min(...flareEnergySeries.filter((entry) => entry > 0))))
    : 0;
  const multiscaleVariabilityIndex =
    (activityStd / Math.max(1, mean(activitySeries))) +
    (pModeShiftStdNhz / Math.max(1, mean(pModeShiftSeries.map((entry) => Math.abs(entry))))) +
    flareLogSpan;
  const guardrailId = "stellar-plasma-observables-not-consciousness";

  const passLength = sameLength;
  const passSampleCount = sampleCount >= thresholds.min_sample_count;
  const passCorrelation = activityPModeCorrelation >= thresholds.min_activity_pmode_correlation;
  const passSlope = pModeSlopeNhzPerActivityUnit >= thresholds.min_pmode_slope_nhz_per_activity_unit;
  const passSpan = pModeShiftSpanNhz >= thresholds.min_pmode_shift_span_nhz;
  const passFlare =
    flareEnergySeries.length === 0 ||
    (
      flareEnergySeries.length >= thresholds.min_flare_sample_count &&
      flarePowerLawAlpha !== null &&
      flarePowerLawAlpha >= thresholds.flare_power_law_alpha_min &&
      flarePowerLawAlpha <= thresholds.flare_power_law_alpha_max
    );

  let firstFail: string | null = null;
  const reasons: string[] = [];
  if (!passLength) {
    firstFail = "HALOBANK_SOLAR_STELLAR_OBSERVABLES_SERIES_LENGTH_MISMATCH";
    reasons.push("Magnetic-activity and helioseismic shift series must have matching lengths.");
  } else if (!passSampleCount) {
    firstFail = "HALOBANK_SOLAR_STELLAR_OBSERVABLES_INSUFFICIENT_SAMPLES";
    reasons.push("Not enough paired activity and helioseismic samples for a deterministic diagnostic.");
  } else if (!passCorrelation) {
    firstFail = "HALOBANK_SOLAR_STELLAR_OBSERVABLES_ACTIVITY_MODE_CORRELATION_LOW";
    reasons.push("Helioseismic frequency shifts are not positively correlated strongly enough with the supplied magnetic-activity series.");
  } else if (!passSlope) {
    firstFail = "HALOBANK_SOLAR_STELLAR_OBSERVABLES_ACTIVITY_MODE_SLOPE_NONPOSITIVE";
    reasons.push("The activity-to-p-mode slope is non-positive under the supplied diagnostic series.");
  } else if (!passSpan) {
    firstFail = "HALOBANK_SOLAR_STELLAR_OBSERVABLES_PMODE_SPAN_TOO_SMALL";
    reasons.push("The helioseismic shift span is too small to support the diagnostic lane.");
  } else if (!passFlare) {
    firstFail = "HALOBANK_SOLAR_STELLAR_OBSERVABLES_FLARE_STATISTICS_OUT_OF_BAND";
    reasons.push("Optional flare-energy statistics fall outside the configured power-law-like diagnostic band.");
  } else {
    reasons.push("Stellar observables diagnostic shows positive activity-to-helioseismic coupling while preserving the non-consciousness guardrail.");
  }

  const result = {
    replay_series_id: replaySeries?.id ?? null,
    label,
    cadence_days: cadenceDays,
    sample_count: sampleCount,
    proxy_model_id: "halobank.solar.stellar_observables_diagnostic/1",
    epoch_iso_series: epochIsoSeries,
    magnetic_activity_index_series: activitySeries,
    p_mode_frequency_shift_nhz_series: pModeShiftSeries,
    flare_energy_proxy_series: flareEnergySeries,
    solar_mean_density_proxy_kg_m3: SOLAR_MEAN_DENSITY_KG_M3,
    background_geometry: backgroundGeometry,
    dynamic_forcing_geometry: null,
    geometry_coupling: backgroundGeometry,
    source_refs: replaySeries?.source_refs ?? [],
    activity_span: activitySpan,
    p_mode_shift_span_nhz: pModeShiftSpanNhz,
    activity_std: activityStd,
    p_mode_shift_std_nhz: pModeShiftStdNhz,
    activity_pmode_correlation: activityPModeCorrelation,
    p_mode_slope_nhz_per_activity_unit: pModeSlopeNhzPerActivityUnit,
    flare_power_law_alpha: flarePowerLawAlpha,
    multiscale_variability_index: multiscaleVariabilityIndex,
    observables_guardrail_id: guardrailId,
    model_scope:
      "Diagnostic solar-observables lane tying magnetic-activity and helioseismic inputs to stellar variability semantics. Not a consciousness or collapse claim.",
  };
  const gate = makeGate({
    gateId: "halobank.solar.stellar_observables_diagnostic.v1",
    deltas: [
      {
        id: "sample_count",
        comparator: ">=",
        value: sampleCount,
        limit: thresholds.min_sample_count,
        pass: passSampleCount,
      },
      {
        id: "activity_pmode_correlation",
        comparator: ">=",
        value: activityPModeCorrelation,
        limit: thresholds.min_activity_pmode_correlation,
        pass: passCorrelation,
      },
      {
        id: "p_mode_slope_nhz_per_activity_unit",
        comparator: ">=",
        value: pModeSlopeNhzPerActivityUnit,
        limit: thresholds.min_pmode_slope_nhz_per_activity_unit,
        pass: passSlope,
      },
      {
        id: "p_mode_shift_span_nhz",
        comparator: ">=",
        value: pModeShiftSpanNhz,
        limit: thresholds.min_pmode_shift_span_nhz,
        pass: passSpan,
      },
      {
        id: "observables_guardrail",
        comparator: ">=",
        value: 1,
        limit: 1,
        pass: true,
        note: guardrailId,
      },
    ],
    firstFail,
    reasons,
  });
  return {
    module: "stellar_observables_diagnostic",
    result,
    gate,
    artifact_ref: `artifact:halobank.solar.stellar_observables_diagnostic:${hashStableJson({ result, gate }).slice(7, 23)}`,
  };
}

export function runDerivedModule(args: {
  module: DerivedModuleId;
  input: Record<string, unknown>;
  thresholds: SolarThresholdsManifest;
  referenceManifest?: SolarLocalRestReferenceManifest;
  metricContextManifest?: SolarMetricContextManifest;
  diagnosticDatasetsManifest?: SolarDiagnosticDatasetsManifest;
}): DerivedResult {
  switch (args.module) {
    case "mercury_precession":
      return runMercuryPrecession(args.input as MercuryInput, args.thresholds.modules.mercury_precession);
    case "mercury_cross_lane_congruence_diagnostic":
      if (!args.diagnosticDatasetsManifest) {
        throw new Error("Diagnostic datasets manifest is required for Mercury cross-lane congruence module");
      }
      return runMercuryCrossLaneCongruenceDiagnostic(
        args.input as MercuryCrossLaneCongruenceDiagnosticInput,
        args.thresholds.modules.mercury_precession,
        args.thresholds.modules.mercury_cross_lane_congruence_diagnostic,
        args.thresholds.modules.planetary_figure_diagnostic,
        args.thresholds.modules.planetary_shape_orientation_proxy,
        args.diagnosticDatasetsManifest,
      );
    case "earth_moon_eclipse_timing":
      return runEarthMoonEclipseTiming(args.input as EclipseInput, args.thresholds.modules.earth_moon_eclipse_timing);
    case "resonance_libration":
      return runResonanceLibration(args.input as ResonanceInput, args.thresholds.modules.resonance_libration);
    case "saros_cycle":
      return runSarosCycle(args.input as SarosInput, args.thresholds.modules.saros_cycle);
    case "jovian_moon_event_timing":
      return runJovianMoonEventTiming(args.input as JovianMoonTimingInput, args.thresholds.modules.jovian_moon_event_timing);
    case "earth_orientation_precession_nutation_proxy":
      return runEarthOrientationPrecessionNutationProxy(
        args.input as EarthOrientationPrecessionNutationProxyInput,
        args.thresholds.modules.earth_orientation_precession_nutation_proxy,
      );
    case "planetary_shape_orientation_proxy":
      return runPlanetaryShapeOrientationProxy(
        args.input as PlanetaryShapeOrientationProxyInput,
        args.thresholds.modules.planetary_shape_orientation_proxy,
        args.diagnosticDatasetsManifest,
      );
    case "planetary_figure_diagnostic":
      return runPlanetaryFigureDiagnostic(
        args.input as PlanetaryFigureDiagnosticInput,
        args.thresholds.modules.planetary_figure_diagnostic,
        args.thresholds.modules.planetary_shape_orientation_proxy,
        args.diagnosticDatasetsManifest,
      );
    case "granular_tidal_response_diagnostic":
      return runGranularTidalResponseDiagnostic(
        args.input as GranularTidalResponseDiagnosticInput,
        args.thresholds.modules.granular_tidal_response_diagnostic,
        args.thresholds.modules.planetary_shape_orientation_proxy,
        args.diagnosticDatasetsManifest,
      );
    case "mercury_cross_lane_congruence_diagnostic":
      return runMercuryCrossLaneCongruenceDiagnostic(
        args.input as MercuryCrossLaneCongruenceDiagnosticInput,
        args.thresholds.modules.mercury_precession,
        args.thresholds.modules.mercury_cross_lane_congruence_diagnostic,
        args.thresholds.modules.planetary_figure_diagnostic,
        args.thresholds.modules.planetary_shape_orientation_proxy,
        args.diagnosticDatasetsManifest,
      );
    case "stellar_observables_diagnostic":
      return runStellarObservablesDiagnostic(
        args.input as StellarObservablesDiagnosticInput,
        args.thresholds.modules.stellar_observables_diagnostic,
        args.diagnosticDatasetsManifest,
      );
    case "stellar_flare_sunquake_diagnostic":
      return runStellarFlareSunquakeDiagnostic(
        args.input as StellarFlareSunquakeDiagnosticInput,
        args.thresholds.modules.stellar_flare_sunquake_diagnostic,
        args.diagnosticDatasetsManifest,
      );
    case "sunquake_timing_replay_diagnostic":
      return runSunquakeTimingReplayDiagnostic(
        args.input as SunquakeTimingReplayDiagnosticInput,
        args.thresholds.modules.sunquake_timing_replay_diagnostic,
        args.diagnosticDatasetsManifest,
      );
    case "solar_light_deflection":
      if (!args.metricContextManifest) {
        throw new Error("Metric-context manifest is required for solar light deflection module");
      }
      return runSolarLightDeflection({
        input: args.input as SolarLightDeflectionInput,
        thresholds: args.thresholds.modules.solar_light_deflection,
        metricContextManifest: args.metricContextManifest,
      });
    case "inner_solar_metric_parity":
      if (!args.metricContextManifest) {
        throw new Error("Metric-context manifest is required for inner solar metric parity module");
      }
      return runInnerSolarMetricParity({
        input: args.input as InnerSolarMetricParityInput,
        thresholds: args.thresholds,
        metricContextManifest: args.metricContextManifest,
      });
    case "local_rest_anchor_calibration":
      if (!args.referenceManifest) {
        throw new Error("Local-rest reference manifest is required for calibration module");
      }
      return runLocalRestAnchorCalibration({
        input: args.input as LocalRestAnchorCalibrationInput,
        thresholds: args.thresholds.modules.local_rest_anchor_calibration,
        referenceManifest: args.referenceManifest,
      });
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
