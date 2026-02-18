import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { EssenceEnvelope } from "@shared/essence-schema";
import { CurvatureUnitInput, type TCurvatureUnit } from "@shared/essence-physics";
import { RasterEnergyField2D, type TRasterEnergyField2D } from "@shared/raster-energy-field";
import { SolarEnergyCalibration, type TSolarEnergyCalibration } from "@shared/solar-energy-calibration";
import { SI_UNITS } from "@shared/unit-system";
import type { SunpyExportPayload } from "./sunpy-coherence-bridge";
import type { SolarCoherenceResult } from "./solar-video-coherence";
import { putBlob } from "../../storage";
import { putEnvelope } from "./store";
import { curvatureUnitHandler } from "../../skills/physics.curvature";
import { buildInformationBoundaryFromHashes, hashStableJson, sha256Hex, sha256Prefixed } from "../../utils/information-boundary";

type EnergySourceKind = "sunpy-export" | "solar-coherence";

type EnergyBuildOptions = {
  calibrationVersion?: string;
  asOf?: string | null;
  mode?: "observables" | "mixed";
  boundary?: "dirichlet0" | "neumann0" | "periodic";
  personaId?: string;
  persistEnvelope?: boolean;
  leakageSentinel?: boolean;
  skipLeakageTest?: boolean;
  provenanceClass?: unknown;
  claimTier?: unknown;
  strictMeasuredProvenance?: boolean;
};

const calibrationCache = new Map<string, TSolarEnergyCalibration>();
const DEFAULT_CAL_VERSION = process.env.SOLAR_ENERGY_CALIB_VERSION ?? "aia-193-v1";
const R_SUN_M = 696_340_000; // SI radius for unit-disk scaling (meters)


const STAR_MATERIALS_PROVENANCE_NON_MEASURED =
  "STAR_MATERIALS_PROVENANCE_NON_MEASURED" as const;

type StarMaterialsProvenanceClass = "measured" | "proxy" | "inferred";
type StarMaterialsClaimTier = "diagnostic" | "reduced-order" | "certified";

type StarMaterialsProvenanceMeta = {
  provenance_class: StarMaterialsProvenanceClass;
  claim_tier: StarMaterialsClaimTier;
  certifying: boolean;
  fail_reason?: typeof STAR_MATERIALS_PROVENANCE_NON_MEASURED;
};

const normalizeProvenanceClass = (value: unknown): StarMaterialsProvenanceClass => {
  if (value === "measured" || value === "proxy" || value === "inferred") {
    return value;
  }
  return "inferred";
};

const normalizeClaimTier = (value: unknown): StarMaterialsClaimTier => {
  if (value === "diagnostic" || value === "reduced-order" || value === "certified") {
    return value;
  }
  return "diagnostic";
};

const resolveStarMaterialsProvenance = (opts?: {
  provenanceClass?: unknown;
  claimTier?: unknown;
  strictMeasuredProvenance?: boolean;
}): StarMaterialsProvenanceMeta => {
  const provenanceClass = normalizeProvenanceClass(opts?.provenanceClass);
  const requestedClaimTier = normalizeClaimTier(opts?.claimTier);
  const certifying = provenanceClass === "measured" && requestedClaimTier === "certified";
  const claimTier = certifying ? requestedClaimTier : "diagnostic";

  if (opts?.strictMeasuredProvenance && provenanceClass !== "measured") {
    return {
      provenance_class: provenanceClass,
      claim_tier: "diagnostic",
      certifying: false,
      fail_reason: STAR_MATERIALS_PROVENANCE_NON_MEASURED,
    };
  }

  return {
    provenance_class: provenanceClass,
    claim_tier: claimTier,
    certifying,
  };
};

type EnergyFieldMeta = {
  calibration: TSolarEnergyCalibration;
  calibration_version: string;
  grid_size: number;
  instrument?: string | null;
  wavelength_A?: number | null;
  window_start?: string | null;
  window_end?: string | null;
  provenance_class: StarMaterialsProvenanceClass;
  claim_tier: StarMaterialsClaimTier;
  certifying: boolean;
  fail_reason?: typeof STAR_MATERIALS_PROVENANCE_NON_MEASURED;
};

const clamp = (v: number, min: number, max: number) => {
  if (!Number.isFinite(v)) return min;
  if (v < min) return min;
  if (v > max) return max;
  return v;
};

export const solarEnergyCalibrationPath = (version = DEFAULT_CAL_VERSION): string =>
  process.env.SOLAR_ENERGY_CALIB_PATH ??
  path.resolve(process.cwd(), "configs", `solar-energy-calibration.${version}.json`);

export function loadSolarEnergyCalibration(version = DEFAULT_CAL_VERSION): TSolarEnergyCalibration {
  const cached = calibrationCache.get(version);
  if (cached) return cached;
  const file = solarEnergyCalibrationPath(version);
  const raw = fs.readFileSync(file, "utf8");
  const parsed = SolarEnergyCalibration.parse(JSON.parse(raw));
  calibrationCache.set(version, parsed);
  return parsed;
}

const decodeFloat32 = (b64: string, gridSize: number): Float32Array => {
  const clean = (b64 ?? "").trim().replace(/^data:[^,]+,/, "").replace(/\s+/g, "");
  const buf = Buffer.from(clean, "base64");
  const expected = gridSize * gridSize * 4;
  if (buf.byteLength !== expected) {
    throw new Error(`map_b64 size mismatch: expected ${expected} bytes for ${gridSize}A grid, got ${buf.byteLength}`);
  }
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
};

const applyEnergyCalibration = (map: Float32Array, calib: TSolarEnergyCalibration): Float32Array => {
  const out = new Float32Array(map.length);
  const exp = calib.u_exponent ?? 1;
  const scale = calib.u_total_scale_Jm3;
  const floor = calib.u_floor_Jm3 ?? 0;
  const cap = calib.u_cap_Jm3 ?? Number.POSITIVE_INFINITY;
  for (let i = 0; i < map.length; i++) {
    const v = clamp(map[i], 0, 1);
    const e = Math.pow(v, exp) * scale;
    out[i] = Math.min(cap, Math.max(floor, e));
  }
  return out;
};

const applyCoherenceEnergyCalibration = (map: Float32Array, calib: TSolarEnergyCalibration): Float32Array => {
  const out = new Float32Array(map.length);
  const scale = calib.coherence_energy_scale_Jm3;
  const exp = calib.u_exponent ?? 1;
  for (let i = 0; i < map.length; i++) {
    const v = clamp(map[i], 0, Number.POSITIVE_INFINITY);
    out[i] = Math.pow(v, exp) * scale;
  }
  return out;
};

const pickDataCutoff = (candidate: Array<string | null | undefined>, fallback: string | null): string => {
  for (const iso of candidate) {
    if (iso && Number.isFinite(Date.parse(iso))) {
      return new Date(iso).toISOString();
    }
  }
  return fallback ?? new Date().toISOString();
};

const gridSpacingFromCalibration = (gridSize: number, calib?: TSolarEnergyCalibration): number => {
  const r = calib && Number.isFinite((calib.metadata as any)?.r_sun_m ?? NaN)
    ? Number((calib.metadata as any).r_sun_m)
    : R_SUN_M;
  const diameter = 2 * Math.max(1, r);
  return diameter / Math.max(1, gridSize);
};

const buildEnergyFieldArtifact = (
  energy: Float32Array,
  gridSize: number,
  data_cutoff_iso: string,
  inputs_hash: string,
  features_hash: string,
  information_boundary: ReturnType<typeof buildInformationBoundaryFromHashes>,
  meta: EnergyFieldMeta,
): TRasterEnergyField2D => {
  const gridSpacing = gridSpacingFromCalibration(gridSize, meta.calibration);
  const uBuf = Buffer.from(energy.buffer, energy.byteOffset, energy.byteLength);
  const uB64 = uBuf.toString("base64");
  return RasterEnergyField2D.parse({
    schema_version: "raster_energy_field/1",
    kind: "raster_energy_field",
    data_cutoff_iso,
    inputs_hash,
    features_hash,
    information_boundary,
    units: SI_UNITS,
    grid: { nx: gridSize, ny: gridSize, dx_m: gridSpacing, dy_m: gridSpacing, thickness_m: 1 },
    timestamp_iso: data_cutoff_iso,
    components: {
      u_total_Jm3: {
        encoding: "base64",
        dtype: "float32",
        endian: "little",
        order: "row-major",
        data_b64: uB64,
      },
    },
    meta,
  });
};

const persistSolarEnergyEnvelope = async (
  field: TRasterEnergyField2D,
  energy: Float32Array,
  source: {
    kind: EnergySourceKind;
    start?: string | null;
    end?: string | null;
    instrument?: string | null;
    wavelength_A?: number | null;
  },
  personaId?: string,
): Promise<void> => {
  const buffer = Buffer.from(energy.buffer, energy.byteOffset, energy.byteLength);
  const blob = await putBlob(buffer, { contentType: "application/octet-stream" });
  const energyHash = sha256Hex(buffer);
  const now = new Date().toISOString();
  const envelope = EssenceEnvelope.parse({
    header: {
      id: randomUUID(),
      version: "essence/1.0",
      modality: "multimodal",
      created_at: now,
      source: {
        uri: "compute://solar-energy-proxy",
        original_hash: { algo: "sha256", value: energyHash },
        creator_id: personaId ?? "persona:solar-energy",
        cid: blob.cid,
        license: "CC-BY-4.0",
      },
      rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
      acl: { visibility: "public", groups: [] },
    },
    features: {
      physics: {
        kind: "solar-energy-field",
        summary: {
          calibration_version: (field.meta as any)?.calibration_version ?? null,
          instrument: source.instrument ?? null,
          wavelength_A: source.wavelength_A ?? null,
          window_start: source.start ?? null,
          window_end: source.end ?? null,
        },
        artifacts: { energy_field_url: blob.uri },
      },
    },
    embeddings: [],
    provenance: {
      pipeline: [
        {
          name: "solar-energy-proxy",
          impl_version: "1.0.0",
          lib_hash: { algo: "sha256", value: sha256Hex(Buffer.from("solar-energy-proxy@1", "utf8")) },
          params: {
            source: source.kind,
            calibration_version: (field.meta as any)?.calibration_version,
            grid_size: field.grid.nx,
          },
          input_hash: { algo: "sha256", value: field.inputs_hash.replace(/^sha256:/, "") },
          output_hash: { algo: "sha256", value: energyHash },
          started_at: field.data_cutoff_iso,
          ended_at: field.data_cutoff_iso,
        },
      ],
      merkle_root: { algo: "sha256", value: energyHash },
      previous: null,
      signatures: [],
      information_boundary: field.information_boundary,
    },
  });
  await putEnvelope(envelope);
};

const computeHashes = (
  energy: Float32Array,
  meta: EnergyFieldMeta,
  source: EnergySourceKind,
  mapHash: string,
): { inputs_hash: string; features_hash: string } => {
  const inputs_hash = hashStableJson({
    kind: "solar_energy_proxy/input",
    v: 1,
    source,
    calibration_version: meta.calibration.version,
    grid_size: meta.grid_size,
    instrument: meta.instrument,
    wavelength_A: meta.wavelength_A,
    map_hash: mapHash,
  });

  const energyBuf = Buffer.from(energy.buffer, energy.byteOffset, energy.byteLength);
  const features_hash = sha256Prefixed(
    Buffer.concat([
      Buffer.from(`solar-energy:${meta.calibration.version};grid:${meta.grid_size};source:${source};`, "utf8"),
      energyBuf,
    ]),
  );
  return { inputs_hash, features_hash };
};

const ensureNoLeakageMutation = (
  mode: "observables" | "mixed",
  baseline: TRasterEnergyField2D,
  mutated: TRasterEnergyField2D,
): void => {
  if (mode !== "observables") return;
  if (baseline.inputs_hash !== mutated.inputs_hash || baseline.features_hash !== mutated.features_hash) {
    throw new Error(
      "solar_energy_leakage_sentinel_failed: mutated HEK events changed inputs_hash/features_hash in observables mode",
    );
  }
};

export function buildEnergyFieldFromSunpy(
  payload: SunpyExportPayload,
  opts?: EnergyBuildOptions,
): TRasterEnergyField2D {
  if (!payload || !Array.isArray(payload.frames) || payload.frames.length === 0) {
    throw new Error("sunpy_energy_proxy_missing_frames");
  }
  const calibration = loadSolarEnergyCalibration(opts?.calibrationVersion);
  const mode = opts?.mode ?? "observables";
  const lastFrame = [...payload.frames].reverse().find((f) => typeof (f as any)?.map_b64 === "string");
  if (!lastFrame || typeof lastFrame.map_b64 !== "string") {
    throw new Error("sunpy_energy_proxy_missing_map_b64");
  }
  const gridSize = Number.isFinite((lastFrame as any).grid_size ?? NaN) ? (lastFrame as any).grid_size : 0;
  if (!gridSize || gridSize <= 0) {
    throw new Error("sunpy_energy_proxy_missing_grid_size");
  }

  const map = decodeFloat32(lastFrame.map_b64, gridSize);
  const mapHash = sha256Prefixed(Buffer.from(map.buffer, map.byteOffset, map.byteLength));
  const data_cutoff_iso = pickDataCutoff(
    [opts?.asOf, payload.meta?.end, lastFrame.obstime, payload.meta?.requested_end],
    null,
  );
  const asOfMs = opts?.asOf ? Date.parse(opts.asOf) : null;
  const frameMs = Number.isFinite(Date.parse(lastFrame.obstime ?? "")) ? Date.parse(lastFrame.obstime) : null;
  if (asOfMs !== null && frameMs !== null && frameMs > asOfMs) {
    throw new Error("sunpy_energy_proxy_leakage_guard:end_gt_asOf");
  }

  const energy = applyEnergyCalibration(map, calibration);
  const provenance = resolveStarMaterialsProvenance(opts);
  const meta = {
    calibration_version: calibration.version,
    calibration,
    grid_size: gridSize,
    instrument: payload.instrument,
    wavelength_A: payload.wavelength_A ?? payload.meta?.wavelength ?? null,
    window_start: payload.meta?.start ?? payload.meta?.requested_start ?? null,
    window_end: payload.meta?.end ?? payload.meta?.requested_end ?? null,
    provenance_class: provenance.provenance_class,
    claim_tier: provenance.claim_tier,
    certifying: provenance.certifying,
    ...(provenance.fail_reason ? { fail_reason: provenance.fail_reason } : {}),
  };
  const { inputs_hash, features_hash } = computeHashes(energy, meta, "sunpy-export", mapHash);
  const information_boundary = buildInformationBoundaryFromHashes({
    data_cutoff_iso,
    mode,
    labels_used_as_features: mode !== "observables",
    event_features_included: false,
    inputs_hash,
    features_hash,
  });
  const field = buildEnergyFieldArtifact(energy, gridSize, data_cutoff_iso, inputs_hash, features_hash, information_boundary, meta);

  if (opts?.leakageSentinel && !opts?.skipLeakageTest) {
    const mutated: SunpyExportPayload = { ...payload, events: [...(payload.events ?? []), { event_type: "FL", start_time: data_cutoff_iso, end_time: data_cutoff_iso, goes_class: "X9.3" }] } as any;
    const mutatedField = buildEnergyFieldFromSunpy(mutated, {
      ...opts,
      skipLeakageTest: true,
      leakageSentinel: false,
    });
    ensureNoLeakageMutation(mode, field, mutatedField);
  }

  if (opts?.persistEnvelope) {
    void persistSolarEnergyEnvelope(field, energy, {
      kind: "sunpy-export",
      start: payload.meta?.start ?? payload.meta?.requested_start,
      end: payload.meta?.end ?? payload.meta?.requested_end,
      instrument: payload.instrument ?? null,
      wavelength_A: payload.wavelength_A ?? payload.meta?.wavelength ?? null,
    }, opts?.personaId).catch((err) => {
      console.warn("[solar-energy] failed to persist envelope", err);
    });
  }

  return field;
}

export function buildEnergyFieldFromSolarCoherence(
  coherence: SolarCoherenceResult,
  opts?: EnergyBuildOptions,
): TRasterEnergyField2D {
  if (!coherence?.map) {
    throw new Error("solar_coherence_energy_missing_map");
  }
  const calibration = loadSolarEnergyCalibration(opts?.calibrationVersion);
  const mode = opts?.mode ?? "observables";
  const gridSize = coherence.map.gridSize;
  const energyArr =
    coherence.map.energy instanceof Float32Array
      ? coherence.map.energy
      : decodeFloat32((coherence.map as any).energy_b64, gridSize);
  const energyProxy = applyCoherenceEnergyCalibration(energyArr, calibration);
  const provenance = resolveStarMaterialsProvenance(opts);
  const mapHash = sha256Prefixed(Buffer.from(energyArr.buffer, energyArr.byteOffset, energyArr.byteLength));
  const data_cutoff_iso = pickDataCutoff([opts?.asOf, coherence.frames?.[coherence.frames.length - 1]?.t ? new Date(coherence.frames[coherence.frames.length - 1].t).toISOString() : null], new Date().toISOString());

  const meta = {
    calibration_version: calibration.version,
    calibration,
    grid_size: gridSize,
    instrument: coherence.global ? "coherence" : null,
    wavelength_A: null,
    window_start: coherence.frames?.[0]?.t ? new Date(coherence.frames[0].t).toISOString() : null,
    window_end: coherence.frames?.[coherence.frames.length - 1]?.t
      ? new Date(coherence.frames[coherence.frames.length - 1].t).toISOString()
      : null,
    provenance_class: provenance.provenance_class,
    claim_tier: provenance.claim_tier,
    certifying: provenance.certifying,
    ...(provenance.fail_reason ? { fail_reason: provenance.fail_reason } : {}),
  };
  const { inputs_hash, features_hash } = computeHashes(energyProxy, meta, "solar-coherence", mapHash);
  const information_boundary = buildInformationBoundaryFromHashes({
    data_cutoff_iso,
    mode,
    labels_used_as_features: mode !== "observables",
    event_features_included: false,
    inputs_hash,
    features_hash,
  });
  const field = buildEnergyFieldArtifact(
    energyProxy,
    gridSize,
    data_cutoff_iso,
    inputs_hash,
    features_hash,
    information_boundary,
    meta,
  );

  if (opts?.persistEnvelope) {
    void persistSolarEnergyEnvelope(field, energyProxy, { kind: "solar-coherence" }, opts?.personaId).catch((err) => {
      console.warn("[solar-energy] failed to persist envelope", err);
    });
  }

  return field;
}

export { STAR_MATERIALS_PROVENANCE_NON_MEASURED };

export async function runSolarCurvatureFromSunpy(
  payload: SunpyExportPayload,
  opts?: EnergyBuildOptions,
): Promise<{ energyField: TRasterEnergyField2D; curvature: TCurvatureUnit }> {
  const energyField = buildEnergyFieldFromSunpy(payload, opts);
  const curvatureInput = CurvatureUnitInput.parse({
    units: energyField.units ?? SI_UNITS,
    grid: energyField.grid,
    boundary: opts?.boundary ?? "dirichlet0",
    u_field: {
      encoding: "base64",
      dtype: "float32",
      endian: "little",
      order: "row-major",
      data_b64: energyField.components.u_total_Jm3.data_b64,
    },
  });
  const curvature = (await curvatureUnitHandler(curvatureInput, {
    personaId: opts?.personaId ?? "persona:solar-curvature",
    dataCutoffIso: energyField.data_cutoff_iso,
  })) as TCurvatureUnit;
  return { energyField, curvature };
}
