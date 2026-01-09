import { randomUUID } from "node:crypto";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { EssenceEnvelope, type TEssenceEnvelope } from "@shared/essence-schema";
import {
  CurvatureMetricsConfig,
  CurvatureUnit,
  CurvatureUnitInput,
  type TCurvatureMetricsConfig,
  type TCurvatureKMetrics,
  type TCurvatureRidgeSpine,
  type TCurvatureRidgeSummary,
  type TCurvatureUnit,
  type TGridFrame2D,
  type TCurvatureUnitInput,
} from "@shared/essence-physics";
import type { TInformationBoundary } from "@shared/information-boundary";
import { C as SPEED_OF_LIGHT, G as GRAVITATIONAL_CONSTANT } from "@shared/physics-const";
import { getBlob, putBlob } from "../storage";
import { putEnvelopeWithPolicy } from "./provenance";
import { integrateEnergyJ } from "../services/physics/invariants";
import { computeCurvatureMetricsAndRidges } from "../services/physics/curvature-metrics";
import { buildInformationBoundaryFromHashes, sha256Hex } from "../utils/information-boundary";
import { stableJsonStringify } from "../utils/stable-json";

const MAX_VECTOR_ROOTS = 64;
const ZERO_GRAD_THRESHOLD = 1e-6;
const POISSON_ITERS = 400;
const DEFAULT_FRAME: TGridFrame2D = { kind: "cartesian" };
type VectorRootRecord = { x: number; y: number; kind: "min" | "max" | "saddle"; grad_mag: number };
type MaskState = { weights: Float32Array; maskOn: Uint8Array; coverage: number };
type NeighborIndices = { left: number; right: number; up: number; down: number };

export const curvatureUnitSpec: ToolSpecShape = {
  name: "physics.curvature.unit",
  desc: "Synthesize EM energy, solve Poisson potential, persist Essence envelope",
  inputSchema: CurvatureUnitInput,
  outputSchema: CurvatureUnit,
  deterministic: true,
  rateLimit: { rpm: 20 },
  safety: { risks: [] },
  risk: { writesFiles: false, touchesNetwork: false, privileged: false },
};

export type CurvatureUnitRunResult = {
  result: TCurvatureUnit;
  envelope_id: string;
  envelope: TEssenceEnvelope;
  information_boundary: TInformationBoundary;
  hashes: {
    input_hash: string;
    energy_hash: string;
    manifest_hash?: string;
    potential_hash: string;
    ridge_hash: string;
    merkle_root_hash: string;
  };
};

export type CurvatureBandSummary = {
  k_metrics: TCurvatureKMetrics;
  ridge_summary: TCurvatureRidgeSummary;
  coverage: number;
};

export type CurvatureBandMetrics = {
  core?: CurvatureBandSummary;
  edge?: CurvatureBandSummary;
  sol?: CurvatureBandSummary;
};

export type CurvatureDiagnosticsSummary = {
  k_metrics: TCurvatureKMetrics;
  ridge_summary: TCurvatureRidgeSummary;
  ridges: TCurvatureRidgeSpine[];
  residual_rms: number;
  band_metrics?: CurvatureBandMetrics;
};

export type CurvatureDiagnosticsInput = {
  grid: TCurvatureUnitInput["grid"];
  frame?: TGridFrame2D;
  boundary?: TCurvatureUnitInput["boundary"];
  u_field: Float32Array;
  mask?: Float32Array | null;
  constants?: Partial<TCurvatureUnitInput["constants"]>;
  metrics?: TCurvatureMetricsConfig;
  banding?: {
    edge_band_m?: number;
    sol_band_m?: number;
  };
};

export type CurvatureFieldMaps = {
  phi: Float32Array;
  gradMag: Float32Array;
  laplacian: Float32Array;
  residual: Float32Array;
  stats: FieldDiagnostics["stats"];
  maskOn?: Uint8Array;
};

type BandMasks = {
  core?: Uint8Array;
  edge?: Uint8Array;
  sol?: Uint8Array;
  coverage: { core: number; edge: number; sol: number };
};

type HeapNode = { idx: number; dist: number };

class MinHeap {
  private data: HeapNode[] = [];

  push(node: HeapNode): void {
    this.data.push(node);
    this.bubbleUp(this.data.length - 1);
  }

  pop(): HeapNode | undefined {
    if (this.data.length === 0) return undefined;
    const root = this.data[0];
    const last = this.data.pop() as HeapNode;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return root;
  }

  get size(): number {
    return this.data.length;
  }

  private bubbleUp(index: number): void {
    let idx = index;
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.data[parent].dist <= this.data[idx].dist) break;
      [this.data[parent], this.data[idx]] = [this.data[idx], this.data[parent]];
      idx = parent;
    }
  }

  private bubbleDown(index: number): void {
    let idx = index;
    const length = this.data.length;
    while (true) {
      const left = idx * 2 + 1;
      const right = left + 1;
      let smallest = idx;
      if (left < length && this.data[left].dist < this.data[smallest].dist) {
        smallest = left;
      }
      if (right < length && this.data[right].dist < this.data[smallest].dist) {
        smallest = right;
      }
      if (smallest === idx) break;
      [this.data[smallest], this.data[idx]] = [this.data[idx], this.data[smallest]];
      idx = smallest;
    }
  }
}

const computeDistanceToBoundary = (
  maskOn: Uint8Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  region: "inside" | "outside",
  includeEdges = true,
): Float32Array => {
  const dist = new Float32Array(nx * ny);
  dist.fill(Number.POSITIVE_INFINITY);
  const heap = new MinHeap();
  const inRegion = (idx: number): boolean =>
    region === "inside" ? maskOn[idx] === 1 : maskOn[idx] === 0;
  const isBoundary = (x: number, y: number, idx: number): boolean => {
    if (includeEdges && (x === 0 || y === 0 || x === nx - 1 || y === ny - 1)) {
      return true;
    }
    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];
    for (const [nxPos, nyPos] of neighbors) {
      const nidx = nyPos * nx + nxPos;
      if (!inRegion(nidx)) {
        return true;
      }
    }
    return false;
  };

  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      const idx = y * nx + x;
      if (!inRegion(idx)) continue;
      if (!isBoundary(x, y, idx)) continue;
      dist[idx] = 0;
      heap.push({ idx, dist: 0 });
    }
  }

  const neighbors = [
    { dx: -1, dy: 0, cost: dx },
    { dx: 1, dy: 0, cost: dx },
    { dx: 0, dy: -1, cost: dy },
    { dx: 0, dy: 1, cost: dy },
    { dx: -1, dy: -1, cost: Math.hypot(dx, dy) },
    { dx: 1, dy: -1, cost: Math.hypot(dx, dy) },
    { dx: -1, dy: 1, cost: Math.hypot(dx, dy) },
    { dx: 1, dy: 1, cost: Math.hypot(dx, dy) },
  ];

  while (heap.size > 0) {
    const node = heap.pop();
    if (!node) break;
    const { idx, dist: d } = node;
    if (d > dist[idx]) continue;
    const x = idx % nx;
    const y = Math.floor(idx / nx);
    for (const step of neighbors) {
      const xx = x + step.dx;
      const yy = y + step.dy;
      if (xx < 0 || yy < 0 || xx >= nx || yy >= ny) continue;
      const nidx = yy * nx + xx;
      if (!inRegion(nidx)) continue;
      const nd = d + step.cost;
      if (nd < dist[nidx]) {
        dist[nidx] = nd;
        heap.push({ idx: nidx, dist: nd });
      }
    }
  }

  return dist;
};

const buildBandMasks = (
  maskOn: Uint8Array,
  grid: TCurvatureUnitInput["grid"],
  banding?: CurvatureDiagnosticsInput["banding"],
): BandMasks => {
  const { nx, ny, dx_m, dy_m } = grid;
  const baseBand = Math.max(dx_m, dy_m) * 2;
  const edgeBand = Math.max(0, banding?.edge_band_m ?? baseBand);
  const solBand = Math.max(0, banding?.sol_band_m ?? baseBand);

  const insideDist = computeDistanceToBoundary(
    maskOn,
    nx,
    ny,
    dx_m,
    dy_m,
    "inside",
  );
  const outsideDist = computeDistanceToBoundary(
    maskOn,
    nx,
    ny,
    dx_m,
    dy_m,
    "outside",
    false,
  );

  const core = new Uint8Array(nx * ny);
  const edge = new Uint8Array(nx * ny);
  const sol = new Uint8Array(nx * ny);
  let coreCount = 0;
  let edgeCount = 0;
  let solCount = 0;
  for (let i = 0; i < maskOn.length; i++) {
    if (maskOn[i]) {
      const d = insideDist[i];
      if (Number.isFinite(d) && d <= edgeBand) {
        edge[i] = 1;
        edgeCount += 1;
      } else if (Number.isFinite(d)) {
        core[i] = 1;
        coreCount += 1;
      }
    } else {
      const d = outsideDist[i];
      if (Number.isFinite(d) && d <= solBand) {
        sol[i] = 1;
        solCount += 1;
      }
    }
  }

  const total = Math.max(1, nx * ny);
  return {
    core: coreCount > 0 ? core : undefined,
    edge: edgeCount > 0 ? edge : undefined,
    sol: solCount > 0 ? sol : undefined,
    coverage: {
      core: coreCount / total,
      edge: edgeCount / total,
      sol: solCount / total,
    },
  };
};

const toBandSummary = (args: {
  maskOn: Uint8Array;
  coverage: number;
  gradMag: Float32Array;
  laplacian: Float32Array;
  residual: Float32Array;
  grid: TCurvatureUnitInput["grid"];
  frame: TGridFrame2D;
  boundary: TCurvatureUnitInput["boundary"];
  config: TCurvatureMetricsConfig;
}): CurvatureBandSummary => {
  const { k_metrics, ridges } = computeCurvatureMetricsAndRidges({
    gradMag: args.gradMag,
    laplacian: args.laplacian,
    residual: args.residual,
    grid: args.grid,
    frame: args.frame,
    boundary: args.boundary,
    maskOn: args.maskOn,
    config: args.config,
  });
  return { k_metrics, ridge_summary: ridges.summary, coverage: args.coverage };
};

export function computeCurvatureFieldMaps(
  input: CurvatureDiagnosticsInput,
): CurvatureFieldMaps {
  const frame = input.frame ?? DEFAULT_FRAME;
  const boundary = input.boundary ?? "dirichlet0";
  const { grid } = input;
  const expectedCount = grid.nx * grid.ny;
  if (input.u_field.length !== expectedCount) {
    throw new Error(
      `curvature_u_field_size_mismatch: expected ${expectedCount}, got ${input.u_field.length}`,
    );
  }
  if (input.mask && input.mask.length !== expectedCount) {
    throw new Error(
      `curvature_mask_size_mismatch: expected ${expectedCount}, got ${input.mask.length}`,
    );
  }

  const c = input.constants?.c ?? SPEED_OF_LIGHT;
  const G = input.constants?.G ?? GRAVITATIONAL_CONSTANT;
  const thickness_m = grid.thickness_m ?? 1;
  const maskState = input.mask ? normalizeMask(input.mask) : null;

  const u = maskState ? applyMaskToField(input.u_field, maskState.weights) : input.u_field;
  const rhoEff = new Float32Array(u.length);
  const invc2 = 1 / (c * c);
  for (let i = 0; i < u.length; i++) {
    rhoEff[i] = u[i] * invc2 * thickness_m;
  }

  const rhoForSolve =
    boundary === "dirichlet0" ? rhoEff : zeroMean(rhoEff, maskState?.maskOn);
  const fourPiG = 4 * Math.PI * G;
  const phi = solvePoisson2D(
    rhoForSolve,
    grid.nx,
    grid.ny,
    grid.dx_m,
    grid.dy_m,
    fourPiG,
    POISSON_ITERS,
    boundary,
    frame,
    maskState?.maskOn,
  );
  const diagnostics = computeFieldDiagnostics(
    phi,
    rhoForSolve,
    grid.nx,
    grid.ny,
    grid.dx_m,
    grid.dy_m,
    fourPiG,
    boundary,
    frame,
    maskState?.maskOn,
  );

  return {
    phi,
    gradMag: diagnostics.gradMag,
    laplacian: diagnostics.laplacian,
    residual: diagnostics.residual,
    stats: diagnostics.stats,
    maskOn: maskState?.maskOn,
  };
}

export function computeCurvatureDiagnosticsFromFields(
  input: CurvatureDiagnosticsInput,
): CurvatureDiagnosticsSummary {
  const metricsConfig = CurvatureMetricsConfig.parse(input.metrics ?? {});
  const frame = input.frame ?? DEFAULT_FRAME;
  const boundary = input.boundary ?? "dirichlet0";
  const { grid } = input;
  const fieldMaps = computeCurvatureFieldMaps(input);
  const { gradMag, laplacian, residual, stats, maskOn } = fieldMaps;
  const { k_metrics, ridges } = computeCurvatureMetricsAndRidges({
    gradMag,
    laplacian,
    residual,
    grid,
    frame,
    boundary,
    maskOn,
    config: metricsConfig,
  });

  let band_metrics: CurvatureBandMetrics | undefined;
  if (maskOn) {
    const bands = buildBandMasks(maskOn, grid, input.banding);
    const bandArgs = {
      gradMag,
      laplacian,
      residual,
      grid,
      frame,
      boundary,
      config: metricsConfig,
    };
    band_metrics = {
      core: bands.core
        ? toBandSummary({
            ...bandArgs,
            maskOn: bands.core,
            coverage: bands.coverage.core,
          })
        : undefined,
      edge: bands.edge
        ? toBandSummary({
            ...bandArgs,
            maskOn: bands.edge,
            coverage: bands.coverage.edge,
          })
        : undefined,
      sol: bands.sol
        ? toBandSummary({
            ...bandArgs,
            maskOn: bands.sol,
            coverage: bands.coverage.sol,
          })
        : undefined,
    };
  }

  return {
    k_metrics,
    ridge_summary: ridges.summary,
    ridges: ridges.spines,
    residual_rms: stats.residual_rms,
    ...(band_metrics ? { band_metrics } : {}),
  };
}

export const runCurvatureUnitWithProvenance = async (
  rawInput: unknown,
  ctx?: Record<string, unknown>,
): Promise<CurvatureUnitRunResult> => {
  const parsed = CurvatureUnitInput.parse(rawInput ?? {});
  const { grid, constants, boundary } = parsed;
  const frame = parsed.frame ?? DEFAULT_FRAME;
  const metricsConfig = CurvatureMetricsConfig.parse(parsed.metrics ?? {});
  const manifestJson = parsed.u_manifest
    ? stableJsonStringify(parsed.u_manifest)
    : null;
  const manifestBuf = manifestJson ? Buffer.from(manifestJson, "utf8") : null;
  const manifestHash = manifestBuf ? sha256Hex(manifestBuf) : null;
  const manifestHashPrefixed = manifestHash ? `sha256:${manifestHash}` : undefined;
  const inputsWithMetrics: TCurvatureUnitInput = {
    ...parsed,
    metrics: metricsConfig,
    u_manifest_hash: manifestHashPrefixed ?? parsed.u_manifest_hash,
  };
  const { nx, ny, dx_m, dy_m, thickness_m } = grid;
  const { c, G } = constants;
  const nowIso = new Date().toISOString();
  const dataCutoffIso = typeof ctx?.dataCutoffIso === "string" && ctx.dataCutoffIso.trim()
    ? new Date(ctx.dataCutoffIso).toISOString()
    : nowIso;

  const maskField = parsed.mask ? await loadFloat32Field(parsed.mask, grid, "mask") : null;
  const maskState = maskField ? normalizeMask(maskField.array) : null;
  const maskBuf = maskState ? bufferFromFloat32(maskState.weights) : null;

  let u: Float32Array;
  let uBuf: Buffer;
  if (parsed.sources && parsed.sources.length > 0) {
    u = synthesizeEnergyField(grid, parsed.sources);
    uBuf = bufferFromFloat32(u);
  } else if (parsed.u_field) {
    const loaded = await loadFloat32Field(parsed.u_field, grid, "u_field");
    u = loaded.array;
    uBuf = loaded.buffer;
  } else {
    throw new Error("invalid_input: expected sources[] or u_field");
  }

  if (maskState) {
    u = applyMaskToField(u, maskState.weights);
    uBuf = bufferFromFloat32(u);
  }

  const rhoEff = new Float32Array(u.length);
  const invc2 = 1 / (c * c);
  for (let i = 0; i < u.length; i++) {
    const massDensity = u[i] * invc2; // kg/m^3
    rhoEff[i] = massDensity * thickness_m; // kg/m^2 (plate approximation)
  }

  const rhoForSolve = boundary === "dirichlet0" ? rhoEff : zeroMean(rhoEff, maskState?.maskOn);
  const fourPiG = 4 * Math.PI * G;
  const phi = solvePoisson2D(
    rhoForSolve,
    nx,
    ny,
    dx_m,
    dy_m,
    fourPiG,
    POISSON_ITERS,
    boundary,
    frame,
    maskState?.maskOn,
  );
  const diagnostics = computeFieldDiagnostics(
    phi,
    rhoForSolve,
    nx,
    ny,
    dx_m,
    dy_m,
    fourPiG,
    boundary,
    frame,
    maskState?.maskOn,
  );
  const { gradMag, laplacian, residual, stats } = diagnostics;
  const residual_rms = stats.residual_rms;
  const total_energy_J = integrateEnergyJ(u, nx, ny, dx_m, dy_m, thickness_m);
  const mass_equivalent_kg = total_energy_J / (c * c);
  const vectorRoots = findVectorRoots(phi, grid, frame, boundary, maskState?.maskOn);
  const { k_metrics, ridges: ridgeFrame } = computeCurvatureMetricsAndRidges({
    gradMag,
    laplacian,
    residual,
    grid,
    frame,
    boundary,
    maskOn: maskState?.maskOn,
    config: metricsConfig,
  });
  const ridgePayload = {
    schema_version: "curvature_ridges/1",
    grid,
    frame,
    boundary,
    metrics_config: metricsConfig,
    k_metrics,
    ridges: ridgeFrame,
  };
  const ridgeBuf = Buffer.from(stableJsonStringify(ridgePayload), "utf8");

  const phiBuf = bufferFromFloat32(phi);
  const gradBuf = bufferFromFloat32(gradMag);
  const laplacianBuf = bufferFromFloat32(laplacian);
  const residualBuf = bufferFromFloat32(residual);
  const phiBlob = await putBlob(phiBuf, { contentType: "application/octet-stream" });
  const uBlob = await putBlob(uBuf, { contentType: "application/octet-stream" });
  const gradBlob = await putBlob(gradBuf, { contentType: "application/octet-stream" });
  const laplacianBlob = await putBlob(laplacianBuf, { contentType: "application/octet-stream" });
  const residualBlob = await putBlob(residualBuf, { contentType: "application/octet-stream" });
  const ridgeBlob = await putBlob(ridgeBuf, { contentType: "application/json" });
  const maskBlob = maskBuf ? await putBlob(maskBuf, { contentType: "application/octet-stream" }) : null;
  const manifestBlob = manifestBuf
    ? await putBlob(manifestBuf, { contentType: "application/json" })
    : null;

  const envelopeId = randomUUID();
  const creatorId = typeof ctx?.personaId === "string" ? ctx.personaId : "persona:unknown";
  const energyHash = sha256Hex(uBuf);
  const maskHash = maskBuf ? sha256Hex(maskBuf) : null;
  const potentialHash = sha256Hex(phiBuf);
  const ridgeHash = sha256Hex(ridgeBuf);
  const merkleRootHash = sha256Hex(
    Buffer.concat([phiBuf, uBuf, gradBuf, laplacianBuf, residualBuf, ridgeBuf]),
  );
  const pipelineInputHash = sha256Hex(
    stableJsonStringify(
      buildDeterministicInputHashPayload(parsed, {
        frame,
        u_hash: `sha256:${energyHash}`,
        mask_hash: maskHash ? `sha256:${maskHash}` : undefined,
        metrics: metricsConfig,
        manifest_hash: manifestHashPrefixed,
      }),
    ),
  );
  const informationBoundary = buildInformationBoundaryFromHashes({
    data_cutoff_iso: dataCutoffIso,
    mode: "observables",
    labels_used_as_features: false,
    event_features_included: false,
    inputs_hash: `sha256:${pipelineInputHash}`,
    features_hash: `sha256:${merkleRootHash}`,
  });

  const energyStage =
    parsed.sources && parsed.sources.length > 0
      ? {
          name: "qed-energy-synthesis",
          impl_version: "1.0.0",
          lib_hash: { algo: "sha256", value: sha256Hex(Buffer.from("qed-energy-synthesis@1")) },
          params: {
            grid,
            sourcesCount: parsed.sources.length,
            frame: frame.kind,
            mask_enabled: Boolean(maskState),
            mask_coverage: maskState?.coverage,
            manifest_hash: manifestHashPrefixed,
          },
          input_hash: { algo: "sha256", value: pipelineInputHash },
          output_hash: { algo: "sha256", value: energyHash },
          started_at: dataCutoffIso,
          ended_at: dataCutoffIso,
        }
      : {
          name: "u-field-ingest",
          impl_version: "1.0.0",
          lib_hash: { algo: "sha256", value: sha256Hex(Buffer.from("u-field-ingest@1")) },
          params: {
            grid,
            dtype: "float32",
            endian: "little",
            order: "row-major",
            frame: frame.kind,
            mask_enabled: Boolean(maskState),
            mask_coverage: maskState?.coverage,
            manifest_hash: manifestHashPrefixed,
          },
          input_hash: { algo: "sha256", value: pipelineInputHash },
          output_hash: { algo: "sha256", value: energyHash },
          started_at: dataCutoffIso,
          ended_at: dataCutoffIso,
        };

  const metricsStage = {
    name: "curvature-metrics",
    impl_version: "1.0.0",
    lib_hash: { algo: "sha256", value: sha256Hex(Buffer.from("curvature-metrics@1")) },
    params: {
      k0_percentile: metricsConfig.k0_percentile,
      ridge_high_percentile: metricsConfig.ridge_high_percentile,
      ridge_low_ratio: metricsConfig.ridge_low_ratio,
      ridge_min_points: metricsConfig.ridge_min_points,
      ridge_max_points: metricsConfig.ridge_max_points,
      ridge_max_count: metricsConfig.ridge_max_count,
    },
    input_hash: { algo: "sha256", value: potentialHash },
    output_hash: { algo: "sha256", value: ridgeHash },
    started_at: dataCutoffIso,
    ended_at: dataCutoffIso,
  };

  const envelope = EssenceEnvelope.parse({
    header: {
      id: envelopeId,
      version: "essence/1.0",
      modality: "multimodal",
      created_at: nowIso,
      source: {
        uri: "compute://physics.curvature.unit",
        original_hash: { algo: "sha256", value: potentialHash },
        creator_id: creatorId,
        license: "CC-BY-4.0",
        cid: phiBlob.cid,
      },
      rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
      acl: { visibility: "public", groups: [] },
    },
    features: {
      physics: {
        kind: "curvature-unit",
        summary: {
          total_energy_J,
          mass_equivalent_kg,
          residual_rms,
          stability: {
            iterations: POISSON_ITERS,
            nan_count: stats.nan_count,
            phi_min: stats.phi_min,
            phi_max: stats.phi_max,
            grad_rms: stats.grad_rms,
            laplacian_rms: stats.laplacian_rms,
            residual_max_abs: stats.residual_max_abs,
            mask_coverage: maskState?.coverage,
          },
          k_metrics,
          ridge_summary: ridgeFrame.summary,
          roots_count: vectorRoots.length,
        },
        artifacts: {
          potential_url: phiBlob.uri,
          potential_cid: phiBlob.cid,
          energy_field_url: uBlob.uri,
          energy_field_cid: uBlob.cid,
          manifest_url: manifestBlob?.uri,
          manifest_cid: manifestBlob?.cid,
          grad_mag_url: gradBlob.uri,
          grad_mag_cid: gradBlob.cid,
          laplacian_url: laplacianBlob.uri,
          laplacian_cid: laplacianBlob.cid,
          residual_url: residualBlob.uri,
          residual_cid: residualBlob.cid,
          mask_url: maskBlob?.uri,
          mask_cid: maskBlob?.cid,
          ridge_spines_url: ridgeBlob.uri,
          ridge_spines_cid: ridgeBlob.cid,
        },
      },
    },
    embeddings: [],
    provenance: {
      pipeline: [
        energyStage,
        {
          name: "poisson-solve",
          impl_version: "1.0.0",
          lib_hash: { algo: "sha256", value: sha256Hex(Buffer.from("poisson2d@2")) },
          params: {
            fourPiG,
            iterations: POISSON_ITERS,
            boundary,
            frame: frame.kind,
            rhs_zero_mean: boundary !== "dirichlet0",
            mask_enabled: Boolean(maskState),
            mask_coverage: maskState?.coverage,
          },
          input_hash: { algo: "sha256", value: energyHash },
          output_hash: { algo: "sha256", value: potentialHash },
          started_at: dataCutoffIso,
          ended_at: dataCutoffIso,
        },
        metricsStage,
      ],
      merkle_root: { algo: "sha256", value: merkleRootHash },
      previous: null,
      signatures: [],
      information_boundary: informationBoundary,
    },
  }); 

  await putEnvelopeWithPolicy(envelope);

  const result = CurvatureUnit.parse({
    grid,
    inputs: inputsWithMetrics,
    summary: {
      total_energy_J,
      mass_equivalent_kg,
      residual_rms,
      stability: {
        iterations: POISSON_ITERS,
        nan_count: stats.nan_count,
        phi_min: stats.phi_min,
        phi_max: stats.phi_max,
        grad_rms: stats.grad_rms,
        laplacian_rms: stats.laplacian_rms,
        residual_max_abs: stats.residual_max_abs,
        mask_coverage: maskState?.coverage,
      },
      k_metrics,
      ridge_summary: ridgeFrame.summary,
      vector_roots: vectorRoots,
    },
    artifacts: {
      potential_url: phiBlob.uri,
      potential_cid: phiBlob.cid,
      energy_field_url: uBlob.uri,
      energy_field_cid: uBlob.cid,
      manifest_url: manifestBlob?.uri,
      manifest_cid: manifestBlob?.cid,
      grad_mag_url: gradBlob.uri,
      grad_mag_cid: gradBlob.cid,
      laplacian_url: laplacianBlob.uri,
      laplacian_cid: laplacianBlob.cid,
      residual_url: residualBlob.uri,
      residual_cid: residualBlob.cid,
      mask_url: maskBlob?.uri,
      mask_cid: maskBlob?.cid,
      ridge_spines_url: ridgeBlob.uri,
      ridge_spines_cid: ridgeBlob.cid,
    },
    ridges: ridgeFrame,
  });

  return {
    result,
    envelope_id: envelopeId,
    envelope,
    information_boundary: informationBoundary,
    hashes: {
      input_hash: `sha256:${pipelineInputHash}`,
      energy_hash: `sha256:${energyHash}`,
      manifest_hash: manifestHashPrefixed,
      potential_hash: `sha256:${potentialHash}`,
      ridge_hash: `sha256:${ridgeHash}`,
      merkle_root_hash: `sha256:${merkleRootHash}`,
    },
  };
};

export const curvatureUnitHandler: ToolHandler = async (rawInput, ctx) => {
  const output = await runCurvatureUnitWithProvenance(rawInput, ctx);
  return output.result;
};

function synthesizeEnergyField(
  grid: TCurvatureUnitInput["grid"],
  sources: NonNullable<TCurvatureUnitInput["sources"]>,
): Float32Array {
  const { nx, ny, dx_m, dy_m } = grid;
  const u = new Float32Array(nx * ny);
  const cx = (nx - 1) / 2;
  const cy = (ny - 1) / 2;
  for (let j = 0; j < ny; j++) {
    const y_m = (j - cy) * dy_m;
    for (let i = 0; i < nx; i++) {
      const x_m = (i - cx) * dx_m;
      let val = 0;
      for (const s of sources) {
        const dx = x_m - s.x_m;
        const dy = y_m - s.y_m;
        const r2 = dx * dx + dy * dy;
        val += s.peak_u_Jm3 * Math.exp(-0.5 * r2 / (s.sigma_m * s.sigma_m));
      }
      u[j * nx + i] = val;
    }
  }
  return u;
}

async function loadFloat32Field(
  field: NonNullable<TCurvatureUnitInput["u_field"]>,
  grid: TCurvatureUnitInput["grid"],
  label: string,
): Promise<{ array: Float32Array; buffer: Buffer }> {
  const expectedBytes = grid.nx * grid.ny * 4;
  let buffer: Buffer;
  if (field.encoding === "base64") {
    buffer = Buffer.from(field.data_b64, "base64");
  } else {
    const stream = await getBlob(field.uri);
    buffer = await readStreamToBuffer(stream);
  }

  if (buffer.byteLength !== expectedBytes) {
    throw new Error(`${label} size mismatch: got ${buffer.byteLength} bytes, expected ${expectedBytes} bytes`);
  }

  if (buffer.byteLength % 4 !== 0) {
    throw new Error(`${label} byteLength must be divisible by 4 (float32), got ${buffer.byteLength}`);
  }

  return {
    array: new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4),
    buffer,
  };
}

async function readStreamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<unknown>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any));
  }
  return Buffer.concat(chunks);
}

function normalizeMask(mask: Float32Array): MaskState {
  const weights = new Float32Array(mask.length);
  const maskOn = new Uint8Array(mask.length);
  let sum = 0;
  for (let i = 0; i < mask.length; i++) {
    let v = mask[i];
    if (!Number.isFinite(v) || v <= 0) {
      weights[i] = 0;
      continue;
    }
    if (v > 1) v = 1;
    weights[i] = v;
    maskOn[i] = 1;
    sum += v;
  }
  const coverage = mask.length > 0 ? sum / mask.length : 0;
  return { weights, maskOn, coverage };
}

function applyMaskToField(field: Float32Array, weights: Float32Array): Float32Array {
  const out = new Float32Array(field.length);
  for (let i = 0; i < field.length; i++) {
    out[i] = field[i] * weights[i];
  }
  return out;
}

function zeroMean(arr: Float32Array, maskOn?: Uint8Array): Float32Array {
  if (arr.length === 0) return new Float32Array();
  if (!maskOn) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i];
    const mean = sum / arr.length;
    const out = new Float32Array(arr.length);
    for (let i = 0; i < arr.length; i++) out[i] = arr[i] - mean;
    return out;
  }
  let sum = 0;
  let n = 0;
  for (let i = 0; i < arr.length; i++) {
    if (!maskOn[i]) continue;
    sum += arr[i];
    n += 1;
  }
  const mean = n > 0 ? sum / n : 0;
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    out[i] = maskOn[i] ? arr[i] - mean : 0;
  }
  return out;
}

function gaugeFix(arr: Float32Array, maskOn?: Uint8Array): void {
  if (arr.length === 0) return;
  if (!maskOn) {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i];
    const mean = sum / arr.length;
    for (let i = 0; i < arr.length; i++) arr[i] -= mean;
    return;
  }
  let sum = 0;
  let n = 0;
  for (let i = 0; i < arr.length; i++) {
    if (!maskOn[i]) continue;
    sum += arr[i];
    n += 1;
  }
  const mean = n > 0 ? sum / n : 0;
  for (let i = 0; i < arr.length; i++) {
    if (!maskOn[i]) {
      arr[i] = 0;
      continue;
    }
    arr[i] -= mean;
  }
}

function neighborIndices(
  x: number,
  y: number,
  nx: number,
  ny: number,
  boundary: TCurvatureUnitInput["boundary"],
): NeighborIndices {
  if (boundary === "periodic") {
    const xLeft = x === 0 ? nx - 1 : x - 1;
    const xRight = x === nx - 1 ? 0 : x + 1;
    const yUp = y === 0 ? ny - 1 : y - 1;
    const yDown = y === ny - 1 ? 0 : y + 1;
    return {
      left: y * nx + xLeft,
      right: y * nx + xRight,
      up: yUp * nx + x,
      down: yDown * nx + x,
    };
  }
  if (boundary === "neumann0") {
    const xLeft = x === 0 ? 1 : x - 1;
    const xRight = x === nx - 1 ? nx - 2 : x + 1;
    const yUp = y === 0 ? 1 : y - 1;
    const yDown = y === ny - 1 ? ny - 2 : y + 1;
    return {
      left: y * nx + xLeft,
      right: y * nx + xRight,
      up: yUp * nx + x,
      down: yDown * nx + x,
    };
  }
  return {
    left: y * nx + (x - 1),
    right: y * nx + (x + 1),
    up: (y - 1) * nx + x,
    down: (y + 1) * nx + x,
  };
}

function phiAt(
  phi: Float32Array,
  idx: number,
  maskOn: Uint8Array | undefined,
  boundary: TCurvatureUnitInput["boundary"],
  centerIdx?: number,
): number {
  if (!maskOn || maskOn[idx]) return phi[idx];
  if ((boundary === "neumann0" || boundary === "periodic") && centerIdx !== undefined) {
    return phi[centerIdx];
  }
  return 0;
}

function buildDeterministicInputHashPayload(
  input: TCurvatureUnitInput,
  opts: {
    frame: TGridFrame2D;
    u_hash?: `sha256:${string}` | null;
    mask_hash?: `sha256:${string}`;
    metrics?: TCurvatureMetricsConfig;
    manifest_hash?: string;
  } | null,
): Record<string, unknown> {
  const frame = opts?.frame ?? DEFAULT_FRAME;
  const base: Record<string, unknown> = {
    kind: "curvature_unit_input",
    v: 4,
    units: input.units,
    grid: input.grid,
    frame,
    boundary: input.boundary,
    constants: input.constants,
    metrics: opts?.metrics,
    mask: opts?.mask_hash
      ? { dtype: "float32", endian: "little", order: "row-major", mask_hash: opts.mask_hash }
      : undefined,
  };

  if (Array.isArray(input.sources) && input.sources.length > 0) {
    return { ...base, energy: { kind: "gaussian_sources", sources: input.sources } };
  }

  if (input.u_field) {
    return {
      ...base,
      energy: {
        kind: "u_field",
        dtype: input.u_field.dtype,
        endian: input.u_field.endian,
        order: input.u_field.order,
        u_hash: opts?.u_hash ?? null,
        manifest_hash: opts?.manifest_hash,
      },
    };
  }

  return { ...base, energy: { kind: "unknown" } };
}

function solvePoisson2D(
  rho: Float32Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  fourPiG: number,
  iters: number,
  boundary: TCurvatureUnitInput["boundary"],
  frame: TGridFrame2D,
  maskOn?: Uint8Array,
): Float32Array {
  if (frame.kind === "rz-plane") {
    return solvePoissonRz(rho, nx, ny, dx, dy, fourPiG, iters, boundary, frame, maskOn);
  }
  return solvePoissonCartesian(rho, nx, ny, dx, dy, fourPiG, iters, boundary, maskOn);
}

function solvePoissonCartesian(
  rho: Float32Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  fourPiG: number,
  iters: number,
  boundary: TCurvatureUnitInput["boundary"],
  maskOn?: Uint8Array,
): Float32Array {
  const phi = new Float32Array(nx * ny);
  const next = new Float32Array(nx * ny);
  const ax = 1 / (dx * dx);
  const ay = 1 / (dy * dy);
  const denom = 2 * (ax + ay);
  const isDirichlet = boundary === "dirichlet0";

  for (let k = 0; k < iters; k++) {
    next.fill(0);
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        if (isDirichlet && (x === 0 || x === nx - 1 || y === 0 || y === ny - 1)) {
          continue;
        }
        const i = y * nx + x;
        if (maskOn && !maskOn[i]) {
          continue;
        }
        const { left, right, up, down } = neighborIndices(x, y, nx, ny, boundary);
        const rhs = fourPiG * rho[i];
        const sum =
          ax * (phiAt(phi, left, maskOn, boundary, i) + phiAt(phi, right, maskOn, boundary, i)) +
          ay * (phiAt(phi, up, maskOn, boundary, i) + phiAt(phi, down, maskOn, boundary, i)) -
          rhs;
        next[i] = sum / denom;
      }
    }
    if (!isDirichlet) {
      gaugeFix(next, maskOn);
    }
    phi.set(next);
  }
  return phi;
}

function solvePoissonRz(
  rho: Float32Array,
  nx: number,
  ny: number,
  dr: number,
  dz: number,
  fourPiG: number,
  iters: number,
  boundary: TCurvatureUnitInput["boundary"],
  frame: Extract<TGridFrame2D, { kind: "rz-plane" }>,
  maskOn?: Uint8Array,
): Float32Array {
  const phi = new Float32Array(nx * ny);
  const next = new Float32Array(nx * ny);
  const ax = 1 / (dr * dr);
  const ay = 1 / (dz * dz);
  const denom = 2 * (ax + ay);
  const rAxis = new Float64Array(nx);
  for (let x = 0; x < nx; x++) {
    rAxis[x] = frame.r_min_m + x * dr;
  }
  const isDirichlet = boundary === "dirichlet0";

  for (let k = 0; k < iters; k++) {
    next.fill(0);
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        if (isDirichlet && (x === 0 || x === nx - 1 || y === 0 || y === ny - 1)) {
          continue;
        }
        const i = y * nx + x;
        if (maskOn && !maskOn[i]) {
          continue;
        }
        const r = rAxis[x];
        const br = r > 0 ? 1 / (2 * dr * r) : 0;
        const { left, right, up, down } = neighborIndices(x, y, nx, ny, boundary);
        const rhs = fourPiG * rho[i];
        const sum =
          (ax - br) * phiAt(phi, left, maskOn, boundary, i) +
          (ax + br) * phiAt(phi, right, maskOn, boundary, i) +
          ay * (phiAt(phi, up, maskOn, boundary, i) + phiAt(phi, down, maskOn, boundary, i)) -
          rhs;
        next[i] = sum / denom;
      }
    }
    if (!isDirichlet) {
      gaugeFix(next, maskOn);
    }
    phi.set(next);
  }
  return phi;
}

type FieldDiagnostics = {
  gradMag: Float32Array;
  laplacian: Float32Array;
  residual: Float32Array;
  stats: {
    grad_rms: number;
    laplacian_rms: number;
    residual_rms: number;
    residual_max_abs: number;
    phi_min: number;
    phi_max: number;
    nan_count: number;
  };
};

function computeFieldDiagnostics(
  phi: Float32Array,
  rho: Float32Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  fourPiG: number,
  boundary: TCurvatureUnitInput["boundary"],
  frame: TGridFrame2D,
  maskOn?: Uint8Array,
): FieldDiagnostics {
  if (frame.kind === "rz-plane") {
    return computeRzDiagnostics(phi, rho, nx, ny, dx, dy, fourPiG, boundary, frame, maskOn);
  }
  return computeCartesianDiagnostics(phi, rho, nx, ny, dx, dy, fourPiG, boundary, maskOn);
}

function computeCartesianDiagnostics(
  phi: Float32Array,
  rho: Float32Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  fourPiG: number,
  boundary: TCurvatureUnitInput["boundary"],
  maskOn?: Uint8Array,
): FieldDiagnostics {
  const gradMag = new Float32Array(nx * ny);
  const laplacian = new Float32Array(nx * ny);
  const residual = new Float32Array(nx * ny);
  const inv2dx = 1 / (2 * dx);
  const inv2dy = 1 / (2 * dy);
  const invdx2 = 1 / (dx * dx);
  const invdy2 = 1 / (dy * dy);
  const isDirichlet = boundary === "dirichlet0";

  let gradSse = 0;
  let lapSse = 0;
  let resSse = 0;
  let resMax = 0;
  let phiMin = Number.POSITIVE_INFINITY;
  let phiMax = Number.NEGATIVE_INFINITY;
  let nanCount = 0;
  let n = 0;

  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      if (isDirichlet && (x === 0 || x === nx - 1 || y === 0 || y === ny - 1)) {
        continue;
      }
      const i = y * nx + x;
      if (maskOn && !maskOn[i]) {
        continue;
      }
      const phiCenter = phi[i];
      if (!Number.isFinite(phiCenter)) {
        nanCount += 1;
        continue;
      }
      phiMin = Math.min(phiMin, phiCenter);
      phiMax = Math.max(phiMax, phiCenter);

      const { left, right, up, down } = neighborIndices(x, y, nx, ny, boundary);
      const phiLeft = phiAt(phi, left, maskOn, boundary, i);
      const phiRight = phiAt(phi, right, maskOn, boundary, i);
      const phiUp = phiAt(phi, up, maskOn, boundary, i);
      const phiDown = phiAt(phi, down, maskOn, boundary, i);

      const dphidx = (phiRight - phiLeft) * inv2dx;
      const dphidy = (phiDown - phiUp) * inv2dy;
      const grad = Math.hypot(dphidx, dphidy);
      const lap =
        (phiLeft - 2 * phiCenter + phiRight) * invdx2 +
        (phiUp - 2 * phiCenter + phiDown) * invdy2;
      const res = lap - fourPiG * rho[i];

      if (!Number.isFinite(grad) || !Number.isFinite(lap) || !Number.isFinite(res)) {
        nanCount += 1;
        continue;
      }

      gradMag[i] = grad;
      laplacian[i] = lap;
      residual[i] = res;

      gradSse += grad * grad;
      lapSse += lap * lap;
      resSse += res * res;
      const absRes = Math.abs(res);
      if (absRes > resMax) resMax = absRes;
      n += 1;
    }
  }

  if (n === 0) {
    phiMin = 0;
    phiMax = 0;
  }

  const denom = n > 0 ? n : 1;
  return {
    gradMag,
    laplacian,
    residual,
    stats: {
      grad_rms: Math.sqrt(gradSse / denom),
      laplacian_rms: Math.sqrt(lapSse / denom),
      residual_rms: Math.sqrt(resSse / denom),
      residual_max_abs: resMax,
      phi_min: phiMin,
      phi_max: phiMax,
      nan_count: nanCount,
    },
  };
}

function computeRzDiagnostics(
  phi: Float32Array,
  rho: Float32Array,
  nx: number,
  ny: number,
  dr: number,
  dz: number,
  fourPiG: number,
  boundary: TCurvatureUnitInput["boundary"],
  frame: Extract<TGridFrame2D, { kind: "rz-plane" }>,
  maskOn?: Uint8Array,
): FieldDiagnostics {
  const gradMag = new Float32Array(nx * ny);
  const laplacian = new Float32Array(nx * ny);
  const residual = new Float32Array(nx * ny);
  const inv2dr = 1 / (2 * dr);
  const inv2dz = 1 / (2 * dz);
  const invdr2 = 1 / (dr * dr);
  const invdz2 = 1 / (dz * dz);
  const rAxis = new Float64Array(nx);
  for (let x = 0; x < nx; x++) {
    rAxis[x] = frame.r_min_m + x * dr;
  }
  const isDirichlet = boundary === "dirichlet0";

  let gradSse = 0;
  let lapSse = 0;
  let resSse = 0;
  let resMax = 0;
  let phiMin = Number.POSITIVE_INFINITY;
  let phiMax = Number.NEGATIVE_INFINITY;
  let nanCount = 0;
  let n = 0;

  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      if (isDirichlet && (x === 0 || x === nx - 1 || y === 0 || y === ny - 1)) {
        continue;
      }
      const i = y * nx + x;
      if (maskOn && !maskOn[i]) {
        continue;
      }
      const phiCenter = phi[i];
      if (!Number.isFinite(phiCenter)) {
        nanCount += 1;
        continue;
      }
      phiMin = Math.min(phiMin, phiCenter);
      phiMax = Math.max(phiMax, phiCenter);

      const { left, right, up, down } = neighborIndices(x, y, nx, ny, boundary);
      const phiLeft = phiAt(phi, left, maskOn, boundary, i);
      const phiRight = phiAt(phi, right, maskOn, boundary, i);
      const phiUp = phiAt(phi, up, maskOn, boundary, i);
      const phiDown = phiAt(phi, down, maskOn, boundary, i);
      const r = rAxis[x];
      const br = r > 0 ? 1 / (2 * dr * r) : 0;

      const dphidr = (phiRight - phiLeft) * inv2dr;
      const dphidz = (phiDown - phiUp) * inv2dz;
      const grad = Math.hypot(dphidr, dphidz);
      const lap =
        (phiLeft - 2 * phiCenter + phiRight) * invdr2 +
        (phiUp - 2 * phiCenter + phiDown) * invdz2 +
        br * (phiRight - phiLeft);
      const res = lap - fourPiG * rho[i];

      if (!Number.isFinite(grad) || !Number.isFinite(lap) || !Number.isFinite(res)) {
        nanCount += 1;
        continue;
      }

      gradMag[i] = grad;
      laplacian[i] = lap;
      residual[i] = res;

      gradSse += grad * grad;
      lapSse += lap * lap;
      resSse += res * res;
      const absRes = Math.abs(res);
      if (absRes > resMax) resMax = absRes;
      n += 1;
    }
  }

  if (n === 0) {
    phiMin = 0;
    phiMax = 0;
  }

  const denom = n > 0 ? n : 1;
  return {
    gradMag,
    laplacian,
    residual,
    stats: {
      grad_rms: Math.sqrt(gradSse / denom),
      laplacian_rms: Math.sqrt(lapSse / denom),
      residual_rms: Math.sqrt(resSse / denom),
      residual_max_abs: resMax,
      phi_min: phiMin,
      phi_max: phiMax,
      nan_count: nanCount,
    },
  };
}

function findVectorRoots(
  phi: Float32Array,
  grid: TCurvatureUnitInput["grid"],
  frame: TGridFrame2D,
  boundary: TCurvatureUnitInput["boundary"],
  maskOn?: Uint8Array,
): VectorRootRecord[] {
  const { nx, ny, dx_m, dy_m } = grid;
  const roots: VectorRootRecord[] = [];
  const cx = (nx - 1) / 2;
  const cy = (ny - 1) / 2;
  const isRz = frame.kind === "rz-plane";
  const rMin = isRz ? frame.r_min_m : 0;
  const zMin = isRz ? frame.z_min_m : 0;

  for (let y = 1; y < ny - 1; y++) {
    for (let x = 1; x < nx - 1; x++) {
      const i = y * nx + x;
      if (maskOn && !maskOn[i]) {
        continue;
      }
      const grad = gradientMagnitude(phi, i, nx, dx_m, dy_m, boundary, maskOn);
      if (grad > ZERO_GRAD_THRESHOLD) {
        continue;
      }
      const val = phi[i];
      const neighbors = [
        phiAt(phi, i - 1, maskOn, boundary, i),
        phiAt(phi, i + 1, maskOn, boundary, i),
        phiAt(phi, i - nx, maskOn, boundary, i),
        phiAt(phi, i + nx, maskOn, boundary, i),
      ];
      const isMin = neighbors.every((v) => val <= v);
      const isMax = neighbors.every((v) => val >= v);
      const kind: "min" | "max" | "saddle" = isMin ? "min" : isMax ? "max" : "saddle";
      roots.push({
        x: isRz ? rMin + x * dx_m : (x - cx) * dx_m,
        y: isRz ? zMin + y * dy_m : (y - cy) * dy_m,
        kind,
        grad_mag: grad,
      });
      if (roots.length >= MAX_VECTOR_ROOTS) {
        return roots;
      }
    }
  }
  return roots;
}

function gradientMagnitude(
  phi: Float32Array,
  index: number,
  nx: number,
  dx: number,
  dy: number,
  boundary: TCurvatureUnitInput["boundary"],
  maskOn?: Uint8Array,
): number {
  const left = phiAt(phi, index - 1, maskOn, boundary, index);
  const right = phiAt(phi, index + 1, maskOn, boundary, index);
  const up = phiAt(phi, index - nx, maskOn, boundary, index);
  const down = phiAt(phi, index + nx, maskOn, boundary, index);
  const dphidx = (right - left) / (2 * dx);
  const dphidy = (down - up) / (2 * dy);
  return Math.hypot(dphidx, dphidy);
}

function bufferFromFloat32(array: Float32Array): Buffer {
  return Buffer.from(array.buffer, array.byteOffset, array.byteLength);
}
