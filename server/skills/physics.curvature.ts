import { randomUUID } from "node:crypto";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { EssenceEnvelope } from "@shared/essence-schema";
import {
  CurvatureUnit,
  CurvatureUnitInput,
  type TCurvatureUnitInput,
} from "@shared/essence-physics";
import { getBlob, putBlob } from "../storage";
import { putEnvelope } from "../services/essence/store";
import { integrateEnergyJ, poissonResidualRMS } from "../services/physics/invariants";
import { buildInformationBoundaryFromHashes, sha256Hex } from "../utils/information-boundary";
import { stableJsonStringify } from "../utils/stable-json";

const MAX_VECTOR_ROOTS = 64;
const ZERO_GRAD_THRESHOLD = 1e-6;
const POISSON_ITERS = 400;
type VectorRootRecord = { x: number; y: number; kind: "min" | "max" | "saddle"; grad_mag: number };

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

export const curvatureUnitHandler: ToolHandler = async (rawInput, ctx) => {
  const parsed = CurvatureUnitInput.parse(rawInput ?? {});
  const { grid, constants, boundary } = parsed;
  const { nx, ny, dx_m, dy_m, thickness_m } = grid;
  const { c, G } = constants;
  const nowIso = new Date().toISOString();
  const dataCutoffIso = typeof ctx?.dataCutoffIso === "string" && ctx.dataCutoffIso.trim()
    ? new Date(ctx.dataCutoffIso).toISOString()
    : nowIso;

  let u: Float32Array;
  if (parsed.sources && parsed.sources.length > 0) {
    u = synthesizeEnergyField(grid, parsed.sources);
  } else if (parsed.u_field) {
    u = await loadUField(parsed.u_field, grid);
  } else {
    throw new Error("invalid_input: expected sources[] or u_field");
  }

  const rhoEff = new Float32Array(u.length);
  const invc2 = 1 / (c * c);
  for (let i = 0; i < u.length; i++) {
    const massDensity = u[i] * invc2; // kg/m^3
    rhoEff[i] = massDensity * thickness_m; // kg/m^2 (plate approximation)
  }

  const rhoForSolve = boundary === "dirichlet0" ? rhoEff : zeroMean(rhoEff);
  const fourPiG = 4 * Math.PI * G;
  const phi = solvePoisson2D(rhoForSolve, nx, ny, dx_m, dy_m, fourPiG, POISSON_ITERS, boundary);
  const residual_rms = poissonResidualRMS(phi, rhoForSolve, nx, ny, dx_m, dy_m, fourPiG);
  const total_energy_J = integrateEnergyJ(u, nx, ny, dx_m, dy_m, thickness_m);
  const mass_equivalent_kg = total_energy_J / (c * c);
  const vectorRoots = findVectorRoots(phi, grid);

  const phiBuf = bufferFromFloat32(phi);
  const uBuf = bufferFromFloat32(u);
  const phiBlob = await putBlob(phiBuf, { contentType: "application/octet-stream" });
  const uBlob = await putBlob(uBuf, { contentType: "application/octet-stream" });

  const envelopeId = randomUUID();
  const creatorId = typeof ctx?.personaId === "string" ? ctx.personaId : "persona:unknown";
  const energyHash = sha256Hex(uBuf);
  const potentialHash = sha256Hex(phiBuf);
  const merkleRootHash = sha256Hex(Buffer.concat([phiBuf, uBuf]));
  const pipelineInputHash = sha256Hex(
    stableJsonStringify(buildDeterministicInputHashPayload(parsed, { u_hash: `sha256:${energyHash}` })),
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
          params: { grid, sourcesCount: parsed.sources.length },
          input_hash: { algo: "sha256", value: pipelineInputHash },
          output_hash: { algo: "sha256", value: energyHash },
          started_at: dataCutoffIso,
          ended_at: dataCutoffIso,
        }
      : {
          name: "u-field-ingest",
          impl_version: "1.0.0",
          lib_hash: { algo: "sha256", value: sha256Hex(Buffer.from("u-field-ingest@1")) },
          params: { grid, dtype: "float32", endian: "little", order: "row-major" },
          input_hash: { algo: "sha256", value: pipelineInputHash },
          output_hash: { algo: "sha256", value: energyHash },
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
          roots_count: vectorRoots.length,
        },
        artifacts: {
          potential_url: phiBlob.uri,
          energy_field_url: uBlob.uri,
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
          params: { fourPiG, iterations: POISSON_ITERS, boundary, rhs_zero_mean: boundary !== "dirichlet0" },
          input_hash: { algo: "sha256", value: energyHash },
          output_hash: { algo: "sha256", value: potentialHash },
          started_at: dataCutoffIso,
          ended_at: dataCutoffIso,
        },
      ],
      merkle_root: { algo: "sha256", value: merkleRootHash },
      previous: null,
      signatures: [],
      information_boundary: informationBoundary,
    },
  });

  await putEnvelope(envelope);

  return CurvatureUnit.parse({
    grid,
    inputs: parsed,
    summary: {
      total_energy_J,
      mass_equivalent_kg,
      residual_rms,
      vector_roots: vectorRoots,
    },
    artifacts: {
      potential_url: phiBlob.uri,
      potential_cid: phiBlob.cid,
      energy_field_url: uBlob.uri,
      energy_field_cid: uBlob.cid,
    },
  });
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

async function loadUField(
  uField: NonNullable<TCurvatureUnitInput["u_field"]>,
  grid: TCurvatureUnitInput["grid"],
): Promise<Float32Array> {
  const expectedBytes = grid.nx * grid.ny * 4;
  let buffer: Buffer;
  if (uField.encoding === "base64") {
    buffer = Buffer.from(uField.data_b64, "base64");
  } else {
    const stream = await getBlob(uField.uri);
    buffer = await readStreamToBuffer(stream);
  }

  if (buffer.byteLength !== expectedBytes) {
    throw new Error(`u_field size mismatch: got ${buffer.byteLength} bytes, expected ${expectedBytes} bytes`);
  }

  if (buffer.byteLength % 4 !== 0) {
    throw new Error(`u_field byteLength must be divisible by 4 (float32), got ${buffer.byteLength}`);
  }

  return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
}

async function readStreamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<unknown>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as any));
  }
  return Buffer.concat(chunks);
}

function zeroMean(arr: Float32Array): Float32Array {
  if (arr.length === 0) return new Float32Array();
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i];
  const mean = sum / arr.length;
  const out = new Float32Array(arr.length);
  for (let i = 0; i < arr.length; i++) out[i] = arr[i] - mean;
  return out;
}

function buildDeterministicInputHashPayload(
  input: TCurvatureUnitInput,
  u: { u_hash: `sha256:${string}` } | null,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    kind: "curvature_unit_input",
    v: 2,
    units: input.units,
    grid: input.grid,
    boundary: input.boundary,
    constants: input.constants,
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
        u_hash: u?.u_hash ?? null,
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
): Float32Array {
  const phi = new Float32Array(nx * ny);
  const next = new Float32Array(nx * ny);
  const ax = 1 / (dx * dx);
  const ay = 1 / (dy * dy);
  const denom = 2 * (ax + ay);

  const gaugeFix = (arr: Float32Array) => {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i];
    const mean = sum / arr.length;
    for (let i = 0; i < arr.length; i++) arr[i] -= mean;
  };

  if (boundary === "dirichlet0") {
    for (let k = 0; k < iters; k++) {
      for (let y = 1; y < ny - 1; y++) {
        for (let x = 1; x < nx - 1; x++) {
          const i = y * nx + x;
          const rhs = fourPiG * rho[i];
          const sum = ax * (phi[i - 1] + phi[i + 1]) + ay * (phi[i - nx] + phi[i + nx]) - rhs;
          next[i] = sum / denom;
        }
      }
      phi.set(next);
    }
    return phi;
  }

  if (boundary === "neumann0") {
    for (let k = 0; k < iters; k++) {
      for (let y = 0; y < ny; y++) {
        const yUp = y === 0 ? 1 : y - 1;
        const yDown = y === ny - 1 ? ny - 2 : y + 1;
        const row = y * nx;
        const rowUp = yUp * nx;
        const rowDown = yDown * nx;
        for (let x = 0; x < nx; x++) {
          const xLeft = x === 0 ? 1 : x - 1;
          const xRight = x === nx - 1 ? nx - 2 : x + 1;
          const i = row + x;
          const rhs = fourPiG * rho[i];
          const sum =
            ax * (phi[row + xLeft] + phi[row + xRight]) +
            ay * (phi[rowUp + x] + phi[rowDown + x]) -
            rhs;
          next[i] = sum / denom;
        }
      }
      gaugeFix(next);
      phi.set(next);
    }
    return phi;
  }

  // periodic
  for (let k = 0; k < iters; k++) {
    for (let y = 0; y < ny; y++) {
      const yUp = y === 0 ? ny - 1 : y - 1;
      const yDown = y === ny - 1 ? 0 : y + 1;
      const row = y * nx;
      const rowUp = yUp * nx;
      const rowDown = yDown * nx;
      for (let x = 0; x < nx; x++) {
        const xLeft = x === 0 ? nx - 1 : x - 1;
        const xRight = x === nx - 1 ? 0 : x + 1;
        const i = row + x;
        const rhs = fourPiG * rho[i];
        const sum =
          ax * (phi[row + xLeft] + phi[row + xRight]) + ay * (phi[rowUp + x] + phi[rowDown + x]) - rhs;
        next[i] = sum / denom;
      }
    }
    gaugeFix(next);
    phi.set(next);
  }
  return phi;
}

function findVectorRoots(phi: Float32Array, grid: TCurvatureUnitInput["grid"]): VectorRootRecord[] {
  const { nx, ny, dx_m, dy_m } = grid;
  const roots: VectorRootRecord[] = [];
  const cx = (nx - 1) / 2;
  const cy = (ny - 1) / 2;
  for (let y = 1; y < ny - 1; y++) {
    for (let x = 1; x < nx - 1; x++) {
      const i = y * nx + x;
      const grad = gradientMagnitude(phi, i, nx, dx_m, dy_m);
      if (grad > ZERO_GRAD_THRESHOLD) {
        continue;
      }
      const val = phi[i];
      const neighbors = [phi[i - 1], phi[i + 1], phi[i - nx], phi[i + nx]];
      const isMin = neighbors.every((v) => val <= v);
      const isMax = neighbors.every((v) => val >= v);
      const kind: "min" | "max" | "saddle" = isMin ? "min" : isMax ? "max" : "saddle";
      roots.push({
        x: (x - cx) * dx_m,
        y: (y - cy) * dy_m,
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

function gradientMagnitude(phi: Float32Array, index: number, nx: number, dx: number, dy: number): number {
  const dphidx = (phi[index + 1] - phi[index - 1]) / (2 * dx);
  const dphidy = (phi[index + nx] - phi[index - nx]) / (2 * dy);
  return Math.hypot(dphidx, dphidy);
}

function bufferFromFloat32(array: Float32Array): Buffer {
  return Buffer.from(array.buffer, array.byteOffset, array.byteLength);
}
