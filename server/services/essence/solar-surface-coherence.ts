import { randomUUID } from "node:crypto";
import { EssenceEnvelope } from "@shared/essence-schema";
import { withDerivedArtifactInformationBoundary } from "@shared/information-boundary-derived";
import {
  CurvatureMetricsConfig,
  type TCurvatureBoundaryCondition2D,
  type TCurvatureMetricsConfig,
  type TUFieldChannelNormalization,
} from "@shared/essence-physics";
import {
  SolarSurfaceCoherenceReport,
  SolarSurfaceEvent,
  SolarSurfaceEventTimeline,
  SolarSurfacePhaseLockReport,
  SolarSurfaceUField,
  type TSolarSurfaceCoherenceReport,
  type TSolarSurfaceEvent,
  type TSolarSurfacePhaseLockReport,
  type TSolarSurfaceUField,
} from "@shared/solar-surface-coherence";
import { SOLAR_R_SUN_M } from "@shared/solar-spectrum-analysis";
import { putBlob } from "../../storage";
import { putEnvelope } from "./store";
import {
  buildInformationBoundaryFromHashes,
  hashStableJson,
  sha256Hex,
  sha256Prefixed,
} from "../../utils/information-boundary";
import { stableJsonStringify } from "../../utils/stable-json";
import { computeCurvatureDiagnosticsFromFields } from "../../skills/physics.curvature";
import {
  trackRidgeSequence,
  type RidgeTrackingConfig,
} from "../physics/curvature-metrics";
import {
  scanK3FrequencyBand,
  type PhaseLockWindow,
} from "../physics/curvature-phase-lock";

export type SolarSurfaceChannelInput = {
  key: string;
  data_b64: string;
  weight?: number;
  normalization?: TUFieldChannelNormalization;
  units?: string;
  notes?: string;
};

export type SolarSurfaceFrameInput = {
  id?: string;
  timestamp_iso: string;
  channels: SolarSurfaceChannelInput[];
  disk_mask_b64?: string;
};

export type SolarSurfaceCoherenceInput = {
  grid_size: number;
  frames: SolarSurfaceFrameInput[];
  radius_m?: number;
  manifest_version?: string;
  data_cutoff_iso?: string;
  boundary?: TCurvatureBoundaryCondition2D;
  metrics?: Partial<TCurvatureMetricsConfig>;
  tracking?: RidgeTrackingConfig;
  phase_lock?: {
    min_hz?: number;
    max_hz?: number;
    grid_size?: number;
    window_s?: number;
    window_cycles?: number;
    min_window_s?: number;
    band_threshold_ratio?: number;
    slip_drop?: number;
    slip_floor?: number;
  };
  event_proxies?: TSolarSurfaceEvent[];
  correlation_window_s?: number;
  persistEnvelope?: boolean;
  personaId?: string;
};

type FrameBuildResult = {
  field: TSolarSurfaceUField;
  u_total: Float32Array;
  mask: Float32Array;
  ridges: NonNullable<ReturnType<typeof computeCurvatureDiagnosticsFromFields>["ridges"]>;
  k_metrics: ReturnType<typeof computeCurvatureDiagnosticsFromFields>["k_metrics"];
  ridge_summary: ReturnType<typeof computeCurvatureDiagnosticsFromFields>["ridge_summary"];
  residual_rms: number;
  t_s?: number;
};

const DEFAULT_PHASE_MIN_HZ = 0.0025;
const DEFAULT_PHASE_MAX_HZ = 0.0045;
const DEFAULT_PHASE_GRID = 16;
const DEFAULT_CORRELATION_WINDOW_S = 300;
const DEFAULT_FRAME: { kind: "cartesian"; x_label: string; y_label: string } = {
  kind: "cartesian",
  x_label: "x",
  y_label: "y",
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const decodeFloat32Raster = (
  b64: string,
  expectedCount: number,
  label: string,
): Float32Array => {
  const clean = (b64 ?? "")
    .trim()
    .replace(/^data:[^,]+,/, "")
    .replace(/\s+/g, "");
  const buf = Buffer.from(clean, "base64");
  const expectedBytes = expectedCount * 4;
  if (buf.byteLength !== expectedBytes) {
    throw new Error(
      `${label}_size_mismatch: expected ${expectedBytes} bytes, got ${buf.byteLength}`,
    );
  }
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
};

const encodeFloat32Raster = (arr: Float32Array): string =>
  Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength).toString("base64");

const buildDiskMask = (gridSize: number): Float32Array => {
  const mask = new Float32Array(gridSize * gridSize);
  const half = (gridSize - 1) / 2;
  for (let y = 0; y < gridSize; y += 1) {
    const v = (y - half) / half;
    for (let x = 0; x < gridSize; x += 1) {
      const u = (x - half) / half;
      mask[y * gridSize + x] = u * u + v * v <= 1 ? 1 : 0;
    }
  }
  return mask;
};

const applyNormalization = (
  source: Float32Array,
  normalization?: TUFieldChannelNormalization,
): Float32Array => {
  if (!normalization || normalization.method === "none") {
    return new Float32Array(source);
  }
  const scale = Number.isFinite(normalization.scale ?? NaN)
    ? (normalization.scale as number)
    : 1;
  const offset = Number.isFinite(normalization.offset ?? NaN)
    ? (normalization.offset as number)
    : 0;
  const clamp = normalization.clamp;
  const out = new Float32Array(source.length);
  for (let i = 0; i < source.length; i += 1) {
    let value = (source[i] + offset) * scale;
    if (clamp) {
      value = Math.max(clamp[0], Math.min(clamp[1], value));
    }
    out[i] = value;
  }
  return out;
};

const buildManifest = (
  channels: SolarSurfaceChannelInput[],
  version: string,
) => {
  return {
    schema_version: "u_field_manifest/1",
    version,
    channels: channels.map((channel) => ({
      key: channel.key,
      weight: channel.weight ?? 1,
      normalization: channel.normalization ?? { method: "none" },
      units: channel.units,
      notes: channel.notes,
    })),
    total_policy: { method: "weighted-sum", normalize_weights: false },
  };
};

const normalizeWeights = (weights: number[], normalize: boolean): number[] => {
  if (!normalize) return weights;
  const sum = weights.reduce((acc, value) => acc + value, 0);
  if (sum <= 0) return weights;
  return weights.map((value) => value / sum);
};

const buildPhaseGrid = (minHz: number, maxHz: number, steps: number): number[] => {
  if (!Number.isFinite(minHz) || !Number.isFinite(maxHz) || steps <= 1) {
    return [];
  }
  const grid: number[] = [];
  for (let i = 0; i < steps; i += 1) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    grid.push(minHz + (maxHz - minHz) * t);
  }
  return grid;
};

const toEpochSeconds = (iso: string): number | null => {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms / 1000 : null;
};

const toRelativeSeconds = (
  t_s?: number,
  baseTimeS?: number | null,
): number | undefined => {
  if (!Number.isFinite(t_s ?? NaN)) return undefined;
  if (!Number.isFinite(baseTimeS ?? NaN)) return t_s as number;
  return (t_s as number) - (baseTimeS as number);
};

const buildFieldFrame = async (
  input: SolarSurfaceFrameInput,
  gridSize: number,
  gridSpacing: number,
  manifest: ReturnType<typeof buildManifest>,
  manifestHash: string,
  dataCutoffIso: string,
  boundary: TCurvatureBoundaryCondition2D,
  metrics: TCurvatureMetricsConfig,
  persistEnvelope: boolean,
  personaId?: string,
): Promise<FrameBuildResult> => {
  const expectedCount = gridSize * gridSize;
  const channelMap = new Map<string, Float32Array>();
  const normalizedMap = new Map<string, Float32Array>();
  for (const channel of input.channels) {
    const data = decodeFloat32Raster(channel.data_b64, expectedCount, channel.key);
    channelMap.set(channel.key, data);
    normalizedMap.set(
      channel.key,
      applyNormalization(data, channel.normalization),
    );
  }
  for (const channel of manifest.channels) {
    if (!channelMap.has(channel.key)) {
      throw new Error(`solar_surface_missing_channel:${channel.key}`);
    }
  }
  const weights = normalizeWeights(
    manifest.channels.map((entry: { weight: number }) => entry.weight),
    Boolean(manifest.total_policy?.normalize_weights),
  );
  const uTotal = new Float32Array(expectedCount);
  for (let i = 0; i < manifest.channels.length; i += 1) {
    const channel = manifest.channels[i];
    const data = normalizedMap.get(channel.key);
    if (!data) continue;
    const weight = weights[i] ?? 0;
    for (let idx = 0; idx < expectedCount; idx += 1) {
      uTotal[idx] += data[idx] * weight;
    }
  }
  const mask = input.disk_mask_b64
    ? decodeFloat32Raster(input.disk_mask_b64, expectedCount, "disk_mask")
    : buildDiskMask(gridSize);
  const channelHashes = manifest.channels.map((channel) => {
    const data = channelMap.get(channel.key);
    const buffer = data
      ? Buffer.from(data.buffer, data.byteOffset, data.byteLength)
      : Buffer.alloc(0);
    return { key: channel.key, hash: sha256Prefixed(buffer) };
  });
  const inputs_hash = hashStableJson({
    kind: "solar_surface_u_field/input",
    v: 1,
    grid: { nx: gridSize, ny: gridSize, dx_m: gridSpacing, dy_m: gridSpacing, thickness_m: 1 },
    frame: DEFAULT_FRAME,
    timestamp_iso: input.timestamp_iso,
    manifest_hash: manifestHash,
    channels: channelHashes,
  });
  const featureBuffers = [
    Buffer.from(uTotal.buffer, uTotal.byteOffset, uTotal.byteLength),
    ...Array.from(normalizedMap.keys())
      .sort()
      .map((key) => {
        const data = normalizedMap.get(key);
        return data
          ? Buffer.from(data.buffer, data.byteOffset, data.byteLength)
          : Buffer.alloc(0);
      }),
  ];
  const features_hash = sha256Prefixed(Buffer.concat(featureBuffers));
  const information_boundary = buildInformationBoundaryFromHashes({
    data_cutoff_iso: dataCutoffIso,
    mode: "observables",
    labels_used_as_features: false,
    event_features_included: false,
    inputs_hash,
    features_hash,
  });
  const components: Record<string, unknown> = {
    u_total_Jm3: {
      encoding: "base64",
      dtype: "float32",
      endian: "little",
      order: "row-major",
      data_b64: encodeFloat32Raster(uTotal),
    },
  };
  for (const channel of manifest.channels) {
    const data = normalizedMap.get(channel.key);
    if (!data) continue;
    components[channel.key] = {
      encoding: "base64",
      dtype: "float32",
      endian: "little",
      order: "row-major",
      data_b64: encodeFloat32Raster(data),
    };
  }
  const diskMask = {
    encoding: "base64",
    dtype: "float32",
    endian: "little",
    order: "row-major",
    data_b64: encodeFloat32Raster(mask),
  };
  const uField = SolarSurfaceUField.parse(
    withDerivedArtifactInformationBoundary(
      {
        schema_version: "solar_surface_u_field/1",
        kind: "solar_surface_u_field",
        grid: { nx: gridSize, ny: gridSize, dx_m: gridSpacing, dy_m: gridSpacing, thickness_m: 1 },
        frame: DEFAULT_FRAME,
        timestamp_iso: input.timestamp_iso,
        manifest,
        manifest_hash: manifestHash,
        components,
        disk_mask: diskMask,
      },
      information_boundary,
    ),
  );

  if (persistEnvelope) {
    const fieldJson = stableJsonStringify(uField);
    const fieldBuf = Buffer.from(fieldJson, "utf8");
    const fieldHash = sha256Hex(fieldBuf);
    const fieldBlob = await putBlob(fieldBuf, { contentType: "application/json" });
    const now = new Date().toISOString();
    const envelope = EssenceEnvelope.parse({
      header: {
        id: randomUUID(),
        version: "essence/1.0",
        modality: "multimodal",
        created_at: now,
        source: {
          uri: "compute://solar-surface-u-field",
          original_hash: { algo: "sha256", value: fieldHash },
          creator_id: personaId ?? "persona:solar-surface",
          cid: fieldBlob.cid,
          license: "CC-BY-4.0",
        },
        rights: {
          allow_mix: true,
          allow_remix: true,
          allow_commercial: false,
          attribution: true,
        },
        acl: { visibility: "public", groups: [] },
      },
      features: {
        physics: {
          kind: "solar-surface-u-field",
          summary: {
            grid_size: gridSize,
            timestamp_iso: input.timestamp_iso,
          },
          artifacts: {
            u_field_url: fieldBlob.uri,
            u_field_cid: fieldBlob.cid,
          },
        },
      },
      embeddings: [],
      provenance: {
        pipeline: [
          {
            name: "solar-surface-u-field",
            impl_version: "1.0.0",
            lib_hash: {
              algo: "sha256",
              value: sha256Hex(Buffer.from("solar-surface-u-field@1", "utf8")),
            },
            params: {
              grid_size: gridSize,
              channel_keys: manifest.channels.map((channel) => channel.key),
            },
            input_hash: { algo: "sha256", value: uField.inputs_hash.replace(/^sha256:/, "") },
            output_hash: { algo: "sha256", value: fieldHash },
            started_at: dataCutoffIso,
            ended_at: dataCutoffIso,
          },
        ],
        merkle_root: { algo: "sha256", value: fieldHash },
        previous: null,
        signatures: [],
        information_boundary: uField.information_boundary,
      },
    });
    await putEnvelope(envelope);
  }

  const diagnostics = computeCurvatureDiagnosticsFromFields({
    grid: uField.grid,
    frame: uField.frame,
    boundary,
    u_field: uTotal,
    mask,
    metrics,
  });
  return {
    field: uField,
    u_total: uTotal,
    mask,
    ridges: diagnostics.ridges,
    k_metrics: diagnostics.k_metrics,
    ridge_summary: diagnostics.ridge_summary,
    residual_rms: diagnostics.residual_rms,
    t_s: toEpochSeconds(input.timestamp_iso) ?? undefined,
  };
};

const buildPhaseLockReport = (
  frames: Array<{ id: string; timestamp_iso: string; t_s?: number; k1: number }>,
  options?: SolarSurfaceCoherenceInput["phase_lock"],
): TSolarSurfacePhaseLockReport | undefined => {
  if (frames.length < 2) return undefined;
  const minHz = options?.min_hz ?? DEFAULT_PHASE_MIN_HZ;
  const maxHz = options?.max_hz ?? DEFAULT_PHASE_MAX_HZ;
  const steps = options?.grid_size ?? DEFAULT_PHASE_GRID;
  const grid = buildPhaseGrid(minHz, maxHz, steps);
  if (!grid.length) return undefined;
  const samples = frames.map((frame, index) => ({
    t_s: frame.t_s ?? index,
    k1: frame.k1,
    frame_id: frame.id,
    timestamp_iso: frame.timestamp_iso,
  }));
  const window: PhaseLockWindow = {
    window_s: options?.window_s,
    window_cycles: options?.window_cycles,
    min_window_s: options?.min_window_s,
    band_threshold_ratio: options?.band_threshold_ratio,
    slip_drop: options?.slip_drop,
    slip_floor: options?.slip_floor,
  };
  const scan = scanK3FrequencyBand(samples, grid, window);
  const scanPoints = scan.k3ByF.map((entry) => ({
    frequency_hz: entry.frequency_hz,
    k3: entry.k3,
  }));
  const fStar = scan.fStar;
  const k3Star = fStar
    ? scan.k3ByF.find((entry) => entry.frequency_hz === fStar)?.k3
    : undefined;
  const phaseSlips = scan.phaseSlipEvents.map((event, idx) => ({
    id: `slip-${idx + 1}`,
    frame_id: event.frame_id,
    timestamp_iso: event.timestamp_iso ?? frames[0].timestamp_iso,
    t_s: event.t_s,
    coherence: event.coherence,
    delta: event.delta,
  }));
  return SolarSurfacePhaseLockReport.parse({
    scan: scanPoints,
    f_star_hz: fStar,
    k3_star: k3Star,
    bandwidth_hz: scan.bandwidth,
    phase_slips: phaseSlips,
  });
};

const buildEventTimeline = (
  phaseLock: TSolarSurfacePhaseLockReport | undefined,
  eventProxies: TSolarSurfaceEvent[] | undefined,
  correlationWindowS: number,
  baseTimeIso: string,
) => {
  if (!phaseLock || !eventProxies?.length) return undefined;
  const events = eventProxies.map((event) => SolarSurfaceEvent.parse(event));
  const correlations: Array<{ phase_slip_id: string; event_id: string; delta_s: number }> = [];
  const baseMs = Date.parse(baseTimeIso);
  for (const slip of phaseLock.phase_slips) {
    const slipMs = Number.isFinite(Date.parse(slip.timestamp_iso))
      ? Date.parse(slip.timestamp_iso)
      : Number.isFinite(baseMs) && Number.isFinite(slip.t_s ?? NaN)
        ? baseMs + (slip.t_s as number) * 1000
        : null;
    if (!slipMs) continue;
    for (const event of events) {
      const refIso = event.peak_iso ?? event.start_iso;
      const eventMs = Date.parse(refIso);
      if (!Number.isFinite(eventMs)) continue;
      const deltaS = (slipMs - eventMs) / 1000;
      if (Math.abs(deltaS) <= correlationWindowS) {
        correlations.push({
          phase_slip_id: slip.id,
          event_id: event.id,
          delta_s: deltaS,
        });
      }
    }
  }
  return SolarSurfaceEventTimeline.parse({
    events,
    phase_slips: phaseLock.phase_slips,
    correlations,
    notes: "Temporal coincidence only; no causal attribution.",
  });
};

export async function runSolarSurfaceCoherence(
  input: SolarSurfaceCoherenceInput,
): Promise<{
  report: TSolarSurfaceCoherenceReport;
  frames: TSolarSurfaceUField[];
  reportUrl?: string;
  reportEnvelopeId?: string;
}> {
  if (!input.frames.length) {
    throw new Error("solar_surface_coherence_missing_frames");
  }
  const gridSize = input.grid_size;
  const radius = input.radius_m ?? SOLAR_R_SUN_M;
  const spacing = (2 * radius) / Math.max(1, gridSize - 1);
  const manifest = buildManifest(
    input.frames[0].channels,
    input.manifest_version ?? "solar-surface-v1",
  );
  const manifestHash = sha256Prefixed(
    Buffer.from(stableJsonStringify(manifest), "utf8"),
  );
  const boundary = input.boundary ?? "dirichlet0";
  const metrics = CurvatureMetricsConfig.parse(input.metrics ?? {});
  const dataCutoffIso =
    input.data_cutoff_iso ??
    input.frames
      .map((frame) => frame.timestamp_iso)
      .sort()
      .slice(-1)[0];
  const frameBuilds: FrameBuildResult[] = [];
  for (const frame of input.frames) {
    frameBuilds.push(
      await buildFieldFrame(
        frame,
        gridSize,
        spacing,
        manifest,
        manifestHash,
        dataCutoffIso,
        boundary,
        metrics,
        Boolean(input.persistEnvelope),
        input.personaId,
      ),
    );
  }
  const baseTimeS = toEpochSeconds(input.frames[0].timestamp_iso);
  const relativeFrameBuilds = frameBuilds.map((frame) => ({
    ...frame,
    t_s: toRelativeSeconds(frame.t_s, baseTimeS),
  }));

  const tracking = trackRidgeSequence(
    relativeFrameBuilds.map((frame) => ({
      t_s: frame.t_s,
      ridges: frame.ridges,
      k1: frame.k_metrics.k1,
    })),
    input.tracking,
  );
  const frames = relativeFrameBuilds.map((frame, index) => {
    const fragmentation = tracking.frames[index]?.fragmentation_rate;
    const hazard = clamp01(
      0.6 * frame.k_metrics.k2 + 0.4 * frame.ridge_summary.fragmentation_index,
    );
    return {
      id: input.frames[index].id ?? `frame-${index + 1}`,
      timestamp_iso: input.frames[index].timestamp_iso,
      t_s: frame.t_s,
      metrics: {
        k_metrics: frame.k_metrics,
        ridge_summary: frame.ridge_summary,
        residual_rms: frame.residual_rms,
        ridge_hazard: hazard,
        ...(Number.isFinite(fragmentation ?? NaN)
          ? { fragmentation_rate: fragmentation }
          : {}),
      },
    };
  });

  const phaseLock = buildPhaseLockReport(
    frames.map((frame) => ({
      id: frame.id,
      timestamp_iso: frame.timestamp_iso,
      t_s: frame.t_s,
      k1: frame.metrics.k_metrics.k1,
    })),
    input.phase_lock,
  );
  const eventTimeline = buildEventTimeline(
    phaseLock,
    input.event_proxies,
    input.correlation_window_s ?? DEFAULT_CORRELATION_WINDOW_S,
    frames[0].timestamp_iso,
  );

  const inputs_hash = hashStableJson({
    kind: "solar_surface_coherence/input",
    v: 1,
    grid_size: gridSize,
    u_field_inputs: frameBuilds.map((frame, index) => ({
      id: frames[index].id,
      inputs_hash: frame.field.inputs_hash,
    })),
    phase_lock: input.phase_lock ?? null,
    event_ids: (input.event_proxies ?? []).map((event) => ({
      id: event.id,
      source: event.source,
      event_type: event.event_type,
      start_iso: event.start_iso,
    })),
  });
  const includeEvents = Boolean(input.event_proxies?.length);
  const features_hash = hashStableJson({
    frames: frames.map((frame) => ({
      id: frame.id,
      timestamp_iso: frame.timestamp_iso,
      metrics: frame.metrics,
    })),
    phase_lock: phaseLock ?? null,
    correlations: eventTimeline?.correlations ?? [],
  });
  const information_boundary = buildInformationBoundaryFromHashes({
    data_cutoff_iso: dataCutoffIso,
    mode: includeEvents ? "mixed" : "observables",
    labels_used_as_features: false,
    event_features_included: false,
    inputs_hash,
    features_hash,
  });
  const uFieldInputsHash = hashStableJson(
    frameBuilds.map((frame) => frame.field.inputs_hash),
  );
  const reportBase = {
    schema_version: "solar_surface_coherence/1",
    kind: "solar_surface_coherence",
    generated_at_iso: new Date().toISOString(),
    frames,
    phase_lock: phaseLock,
    event_timeline: eventTimeline,
    u_field_inputs_hash: uFieldInputsHash,
  };
  const report = SolarSurfaceCoherenceReport.parse(
    withDerivedArtifactInformationBoundary(reportBase, information_boundary),
  );

  let reportUrl: string | undefined;
  let reportEnvelopeId: string | undefined;
  if (input.persistEnvelope) {
    const reportJson = stableJsonStringify(report);
    const reportBuf = Buffer.from(reportJson, "utf8");
    const reportHash = sha256Hex(reportBuf);
    const reportBlob = await putBlob(reportBuf, { contentType: "application/json" });
    const now = new Date().toISOString();
    const envelope = EssenceEnvelope.parse({
      header: {
        id: randomUUID(),
        version: "essence/1.0",
        modality: "multimodal",
        created_at: now,
        source: {
          uri: "compute://solar-surface-coherence",
          original_hash: { algo: "sha256", value: reportHash },
          creator_id: input.personaId ?? "persona:solar-surface",
          cid: reportBlob.cid,
          license: "CC-BY-4.0",
        },
        rights: {
          allow_mix: true,
          allow_remix: true,
          allow_commercial: false,
          attribution: true,
        },
        acl: { visibility: "public", groups: [] },
      },
      features: {
        physics: {
          kind: "solar-surface-coherence",
          summary: {
            frame_count: frames.length,
            grid_size: gridSize,
            phase_lock_f_star: report.phase_lock?.f_star_hz ?? null,
          },
          artifacts: {
            report_url: reportBlob.uri,
            report_cid: reportBlob.cid,
          },
        },
      },
      embeddings: [],
      provenance: {
        pipeline: [
          {
            name: "solar-surface-coherence",
            impl_version: "1.0.0",
            lib_hash: {
              algo: "sha256",
              value: sha256Hex(Buffer.from("solar-surface-coherence@1", "utf8")),
            },
            params: {
              grid_size: gridSize,
              frame_count: frames.length,
            },
            input_hash: { algo: "sha256", value: report.inputs_hash.replace(/^sha256:/, "") },
            output_hash: { algo: "sha256", value: reportHash },
            started_at: report.data_cutoff_iso,
            ended_at: report.data_cutoff_iso,
          },
        ],
        merkle_root: { algo: "sha256", value: reportHash },
        previous: null,
        signatures: [],
        information_boundary: report.information_boundary,
      },
    });
    await putEnvelope(envelope);
    reportUrl = reportBlob.uri;
    reportEnvelopeId = envelope.header.id;
  }

  return {
    report,
    frames: frameBuilds.map((frame) => frame.field),
    reportUrl,
    reportEnvelopeId,
  };
}
