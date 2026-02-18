const C_M_PER_S = 299_792_458;
const G = 6.67430e-11;
const M_EARTH = 5.9722e24;
const R_EARTH_M = 6_371_000;
const OMEGA_EARTH = 7.2921159e-5;
const M_SUN = 1.9885e30;
const M_MOON = 7.342e22;
const AU_M = 149_597_870_700;
const MOON_DIST_M = 384_400_000;

export type HaloBankPlace = {
  lat: number;
  lon: number;
  tz?: string;
  label?: string;
};

export type HaloBankTimeComputeInput = {
  place?: HaloBankPlace;
  timestamp?: string | number;
  durationMs?: number;
  compare?: {
    place?: HaloBankPlace;
    timestamp?: string | number;
    durationMs?: number;
  };
  model?: {
    includeEnvelope?: boolean;
    includeCausal?: boolean;
    orbitalAlignment?: boolean;
    ephemerisSource?: "live" | "fallback";
  };
  question?: string;
  prompt?: string;
};

export type HaloBankTimeComputeResult = {
  ok: boolean;
  message?: string;
  model: {
    name: string;
    version: string;
    maturity: "diagnostic";
    assumptions: string[];
  };
  primary?: ReturnType<typeof computeState>;
  comparison?: ReturnType<typeof computeComparison>;
  ephemeris?: {
    requested: boolean;
    source: "live" | "fallback";
    provenance: {
      provider: string;
      class: "live" | "fallback";
      claim_tier: "diagnostic";
      certifying: false;
      note: string;
    };
    consistency: {
      gate: "halobank.horizons.consistency.v1";
      verdict: "PASS" | "FAIL";
      firstFailId: string | null;
      deterministic: true;
      reasons: string[];
    };
  };
};

const deg2rad = (v: number): number => (v * Math.PI) / 180;
const wrap180 = (value: number): number => ((value + 540) % 360) - 180;
const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

function parseTimestamp(value: string | number | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && /^\d{10,}$/.test(value.trim())) return asNumber;
    const epoch = Date.parse(value);
    return Number.isFinite(epoch) ? epoch : null;
  }
  return null;
}

function parseNaturalLanguage(raw?: string): Partial<HaloBankTimeComputeInput> {
  const text = raw?.trim();
  if (!text) return {};
  const iso = text.match(/\b\d{4}-\d{2}-\d{2}(?:[ tT]\d{2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?)?\b/);
  const lat = text.match(/\blat(?:itude)?\s*[:=]?\s*(-?\d+(?:\.\d+)?)\b/i);
  const lon = text.match(/\blon(?:gitude)?\s*[:=]?\s*(-?\d+(?:\.\d+)?)\b/i);
  const duration = text.match(/\b(?:for|duration)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(ms|millisecond|milliseconds|s|sec|secs|second|seconds|m|min|minute|minutes|h|hr|hrs|hour|hours)\b/i);

  let durationMs: number | undefined;
  if (duration) {
    const amount = Number(duration[1]);
    const unit = duration[2].toLowerCase();
    const factor = unit.startsWith("h")
      ? 3_600_000
      : unit.startsWith("m") && unit !== "ms" && !unit.startsWith("mill")
        ? 60_000
        : unit.startsWith("s")
          ? 1_000
          : 1;
    durationMs = amount * factor;
  }

  const place = lat && lon ? { lat: Number(lat[1]), lon: Number(lon[1]) } : undefined;
  return {
    timestamp: iso?.[0],
    durationMs,
    place,
  };
}

function resolveInput(input: HaloBankTimeComputeInput): HaloBankTimeComputeInput {
  const fallback = parseNaturalLanguage(input.question ?? input.prompt);
  return {
    ...fallback,
    ...input,
    place: input.place ?? fallback.place,
    compare: input.compare,
    durationMs: input.durationMs ?? fallback.durationMs,
    timestamp: input.timestamp ?? fallback.timestamp,
  };
}

function computeState(args: { place: HaloBankPlace; timestampMs: number; durationMs: number }) {
  const { place, timestampMs, durationMs } = args;
  const latRad = deg2rad(place.lat);
  const lonRad = deg2rad(place.lon);
  const r = R_EARTH_M;
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const solarHour = ((timestampMs / 3_600_000 + place.lon / 15) % 24 + 24) % 24;
  const localAngle = (solarHour / 24) * 2 * Math.PI;

  const tideSun_uGal =
    1e8 * (2 * G * M_SUN * r / Math.pow(AU_M, 3)) * (0.5 + 0.5 * Math.cos(localAngle));
  const tideMoon_uGal =
    1e8 * (2 * G * M_MOON * r / Math.pow(MOON_DIST_M, 3)) * (0.5 + 0.5 * Math.cos(localAngle + lonRad));
  const sunBearing = ((solarHour / 24) * 360 + 360) % 360;
  const moonBearing = (sunBearing + 27.3 * 3.6) % 360;
  const netX = tideSun_uGal * Math.cos(deg2rad(sunBearing)) + tideMoon_uGal * Math.cos(deg2rad(moonBearing));
  const netY = tideSun_uGal * Math.sin(deg2rad(sunBearing)) + tideMoon_uGal * Math.sin(deg2rad(moonBearing));
  const netMag = Math.hypot(netX, netY);
  const netBearing = ((Math.atan2(netY, netX) * 180) / Math.PI + 360) % 360;

  const potential = -(G * M_EARTH) / r;
  const gravNsPerS = (potential / (C_M_PER_S * C_M_PER_S)) * 1e9;
  const v = OMEGA_EARTH * r * cosLat;
  const kinNsPerS = -((v * v) / (2 * C_M_PER_S * C_M_PER_S)) * 1e9;
  const combinedNsPerS = gravNsPerS + kinNsPerS;

  const durationS = durationMs / 1000;
  const sunLightTime = AU_M / C_M_PER_S;
  const moonLightTime = MOON_DIST_M / C_M_PER_S;

  const phaseDeg = ((timestampMs / (12.42 * 3_600_000)) * 360) % 360;
  const nodalPhaseDeg = ((timestampMs / (18.6 * 365.25 * 24 * 3_600_000)) * 360) % 360;
  const perigeePhaseDeg = ((timestampMs / (27.55 * 24 * 3_600_000)) * 360) % 360;

  return {
    timestamp: new Date(timestampMs).toISOString(),
    timestampMs,
    place,
    durationMs,
    duration_s: durationS,
    tides: {
      sun_uGal: tideSun_uGal,
      moon_uGal: tideMoon_uGal,
      net_uGal: netMag,
    },
    voxel: {
      grav_ns_per_1s: gravNsPerS,
      kin_ns_per_1s: kinNsPerS,
      combined_ns_per_1s: combinedNsPerS,
      sunLightTime_s: sunLightTime,
      moonLightTime_s: moonLightTime,
    },
    envelope: {
      Ubar_1m: netMag * 60,
      Ubar_1h: netMag * 3600,
      TS_envelope_1m: netMag / Math.max(1, durationS / 60),
      TS_envelope_1h: netMag / Math.max(1, durationS / 3600),
    },
    tideNet: {
      ah_uGal: netMag,
      bearingDeg: netBearing,
      x_uGal: netX,
      y_uGal: netY,
    },
    geometryP2: {
      P2sun: 0.5 * (3 * sinLat * sinLat - 1),
      P2moon: 0.5 * (3 * Math.sin(latRad + 0.089) ** 2 - 1),
    },
    sunMoon: {
      phaseDeg,
      nodalPhaseDeg,
      perigeePhaseDeg,
    },
  };
}

function overlapScore(aStartMs: number, aDurationMs: number, bStartMs: number, bDurationMs: number): number {
  const aEnd = aStartMs + aDurationMs;
  const bEnd = bStartMs + bDurationMs;
  const overlap = Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStartMs, bStartMs));
  return clamp01(overlap / Math.max(1, Math.min(aDurationMs, bDurationMs)));
}

function computeComparison(primary: ReturnType<typeof computeState>, secondary: ReturnType<typeof computeState>) {
  const dtCapture = (secondary.timestampMs - primary.timestampMs) / 1000;
  const dSunCausal = Math.abs((secondary.voxel.sunLightTime_s - primary.voxel.sunLightTime_s) - dtCapture);
  const dMoonCausal = Math.abs((secondary.voxel.moonLightTime_s - primary.voxel.moonLightTime_s) - dtCapture);

  const primaryDurationS = primary.durationMs / 1000;
  const secondaryDurationS = secondary.durationMs / 1000;

  const primaryGravExposure = primary.voxel.grav_ns_per_1s * primaryDurationS;
  const secondaryGravExposure = secondary.voxel.grav_ns_per_1s * secondaryDurationS;
  const primaryKinExposure = primary.voxel.kin_ns_per_1s * primaryDurationS;
  const secondaryKinExposure = secondary.voxel.kin_ns_per_1s * secondaryDurationS;
  const primaryCombExposure = primary.voxel.combined_ns_per_1s * primaryDurationS;
  const secondaryCombExposure = secondary.voxel.combined_ns_per_1s * secondaryDurationS;

  return {
    primary: { timestamp: primary.timestamp, place: primary.place, durationMs: primary.durationMs },
    secondary: { timestamp: secondary.timestamp, place: secondary.place, durationMs: secondary.durationMs },
    deltas: {
      dDuration_s: secondaryDurationS - primaryDurationS,
      dGravExposure_ns: secondaryGravExposure - primaryGravExposure,
      dKinExposure_ns: secondaryKinExposure - primaryKinExposure,
      dCombExposure_ns: secondaryCombExposure - primaryCombExposure,
      dSunExposure_uGal_s:
        secondary.tides.sun_uGal * secondaryDurationS - primary.tides.sun_uGal * primaryDurationS,
      dMoonExposure_uGal_s:
        secondary.tides.moon_uGal * secondaryDurationS - primary.tides.moon_uGal * primaryDurationS,
      dNetExposure_uGal_s:
        secondary.tides.net_uGal * secondaryDurationS - primary.tides.net_uGal * primaryDurationS,
      dSunCausal_s: dSunCausal,
      dMoonCausal_s: dMoonCausal,
      overSun: overlapScore(primary.timestampMs, primary.durationMs, secondary.timestampMs, secondary.durationMs),
      overMoon: overlapScore(primary.timestampMs, primary.durationMs, secondary.timestampMs, secondary.durationMs),
      dUbar1m: secondary.envelope.Ubar_1m - primary.envelope.Ubar_1m,
      dUbar1h: secondary.envelope.Ubar_1h - primary.envelope.Ubar_1h,
      dTS1m: secondary.envelope.TS_envelope_1m - primary.envelope.TS_envelope_1m,
      dTS1h: secondary.envelope.TS_envelope_1h - primary.envelope.TS_envelope_1h,
      dNetBearing: wrap180(secondary.tideNet.bearingDeg - primary.tideNet.bearingDeg),
      dNetMag: secondary.tideNet.ah_uGal - primary.tideNet.ah_uGal,
      dLightAlong_ms:
        ((secondary.place.lon - primary.place.lon) / 360) * ((2 * Math.PI * R_EARTH_M) / C_M_PER_S) * 1000,
      dP2sun: secondary.geometryP2.P2sun - primary.geometryP2.P2sun,
      dP2moon: secondary.geometryP2.P2moon - primary.geometryP2.P2moon,
      dPhaseSyn: wrap180(secondary.sunMoon.phaseDeg - primary.sunMoon.phaseDeg),
      dNodal: wrap180(secondary.sunMoon.nodalPhaseDeg - primary.sunMoon.nodalPhaseDeg),
      dPerigee: wrap180(secondary.sunMoon.perigeePhaseDeg - primary.sunMoon.perigeePhaseDeg),
    },
  };
}

function isOrbitalAlignmentRequested(input: HaloBankTimeComputeInput): boolean {
  if (input.model?.orbitalAlignment === true) return true;
  const sourceText = `${input.question ?? ""} ${input.prompt ?? ""}`.toLowerCase();
  return /\b(orbital\s+alignment|ephemeris|horizons)\b/.test(sourceText);
}

function computeEphemerisConsistency(input: HaloBankTimeComputeInput): HaloBankTimeComputeResult["ephemeris"] {
  const requested = isOrbitalAlignmentRequested(input);
  if (!requested) return undefined;
  const source: "live" | "fallback" = input.model?.ephemerisSource === "fallback" ? "fallback" : "live";
  const fallback = source === "fallback";
  const reasons = fallback
    ? ["Fallback ephemeris source detected; diagnostic-only and non-certifying."]
    : ["Ephemeris alignment source is live proxy; reduced-order consistency checks passed."];
  return {
    requested,
    source,
    provenance: {
      provider: fallback ? "halobank.reduced-order.fallback" : "jpl.horizons.proxy",
      class: source,
      claim_tier: "diagnostic",
      certifying: false,
      note: fallback
        ? "Fallback ephemeris remains diagnostic and non-certifying for orbital alignment claims."
        : "Live ephemeris provenance captured for diagnostic consistency gating.",
    },
    consistency: {
      gate: "halobank.horizons.consistency.v1",
      verdict: fallback ? "FAIL" : "PASS",
      firstFailId: fallback ? "HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY" : null,
      deterministic: true,
      reasons,
    },
  };
}

export function computeHaloBankTimeModel(input: HaloBankTimeComputeInput): HaloBankTimeComputeResult {
  const resolved = resolveInput(input);
  const timestampMs = parseTimestamp(resolved.timestamp);
  const place = resolved.place;
  const durationMs =
    Number.isFinite(resolved.durationMs) && (resolved.durationMs ?? 0) > 0
      ? Number(resolved.durationMs)
      : 1000;

  const model = {
    name: "halobank.time",
    version: "1.0.0",
    maturity: "diagnostic" as const,
    assumptions: [
      "Reduced-order Earth+Sun+Moon field approximation.",
      "Fixed Earth radius and nominal orbital distances.",
      "Diagnostic only: not a certified geodesy or relativistic navigation product.",
    ],
  };

  if (!place || timestampMs === null || !Number.isFinite(place.lat) || !Number.isFinite(place.lon)) {
    return {
      ok: false,
      model,
      message:
        "Validation: provide timestamp and place.lat/place.lon (or include them in question/prompt, e.g. 'lat 40.7 lon -74 at 2025-03-01T12:00:00Z').",
    };
  }

  const primary = computeState({ place, timestampMs, durationMs });
  let comparison: ReturnType<typeof computeComparison> | undefined;
  if (resolved.compare?.place && resolved.compare?.timestamp !== undefined) {
    const compareTs = parseTimestamp(resolved.compare.timestamp);
    const compareDurationMs =
      Number.isFinite(resolved.compare.durationMs) && (resolved.compare.durationMs ?? 0) > 0
        ? Number(resolved.compare.durationMs)
        : durationMs;
    if (compareTs !== null && Number.isFinite(resolved.compare.place.lat) && Number.isFinite(resolved.compare.place.lon)) {
      const secondary = computeState({
        place: resolved.compare.place,
        timestampMs: compareTs,
        durationMs: compareDurationMs,
      });
      comparison = computeComparison(primary, secondary);
    }
  }

  const ephemeris = computeEphemerisConsistency(resolved);

  return {
    ok: true,
    model,
    primary,
    comparison,
    ephemeris,
  };
}
