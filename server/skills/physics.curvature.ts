import { createHash, randomUUID } from "node:crypto";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { EssenceEnvelope } from "@shared/essence-schema";
import {
  CurvatureUnit,
  CurvatureUnitInput,
  type TCurvatureUnitInput,
} from "@shared/essence-physics";
import { putBlob } from "../storage";
import { putEnvelope } from "../services/essence/store";
import { integrateEnergyJ, poissonResidualRMS } from "../services/physics/invariants";

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
  const { grid, sources, constants } = parsed;
  const { nx, ny, dx, dy, thickness_m } = grid;
  const { c, G } = constants;
  const u = synthesizeEnergyField(parsed);
  const rhoEff = new Float32Array(u.length);
  const invc2 = 1 / (c * c);
  for (let i = 0; i < u.length; i++) {
    const massDensity = u[i] * invc2; // kg/m^3
    rhoEff[i] = massDensity * thickness_m; // kg/m^2 (plate approximation)
  }
  const fourPiG = 4 * Math.PI * G;
  const phi = solvePoisson2D(rhoEff, nx, ny, dx, dy, fourPiG, POISSON_ITERS);
  const residual_rms = poissonResidualRMS(phi, rhoEff, nx, ny, dx, dy, fourPiG);
  const total_energy_J = integrateEnergyJ(u, nx, ny, dx, dy, thickness_m);
  const mass_equivalent_kg = total_energy_J / (c * c);
  const vectorRoots = findVectorRoots(phi, grid);

  const phiBuf = bufferFromFloat32(phi);
  const uBuf = bufferFromFloat32(u);
  const phiBlob = await putBlob(phiBuf, { contentType: "application/octet-stream" });
  const uBlob = await putBlob(uBuf, { contentType: "application/octet-stream" });

  const now = new Date().toISOString();
  const envelopeId = randomUUID();
  const creatorId = typeof ctx?.personaId === "string" ? ctx.personaId : "persona:unknown";
  const pipelineInputHash = hashBytes(Buffer.from(JSON.stringify(parsed)));
  const energyHash = hashBytes(uBuf);
  const potentialHash = hashBytes(phiBuf);

  const envelope = EssenceEnvelope.parse({
    header: {
      id: envelopeId,
      version: "essence/1.0",
      modality: "multimodal",
      created_at: now,
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
        {
          name: "qed-energy-synthesis",
          impl_version: "1.0.0",
          lib_hash: { algo: "sha256", value: hashBytes(Buffer.from("qed-energy-synthesis@1")) },
          params: { grid, sourcesCount: sources.length },
          input_hash: { algo: "sha256", value: pipelineInputHash },
          output_hash: { algo: "sha256", value: energyHash },
          started_at: now,
          ended_at: now,
        },
        {
          name: "poisson-solve",
          impl_version: "1.0.0",
          lib_hash: { algo: "sha256", value: hashBytes(Buffer.from("poisson2d@1")) },
          params: { fourPiG, iterations: POISSON_ITERS },
          input_hash: { algo: "sha256", value: energyHash },
          output_hash: { algo: "sha256", value: potentialHash },
          started_at: now,
          ended_at: now,
        },
      ],
      merkle_root: { algo: "sha256", value: hashBytes(Buffer.concat([phiBuf, uBuf])) },
      previous: null,
      signatures: [],
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

function synthesizeEnergyField(input: TCurvatureUnitInput): Float32Array {
  const {
    grid: { nx, ny, dx, dy },
    sources,
  } = input;
  const u = new Float32Array(nx * ny);
  const cx = (nx - 1) / 2;
  const cy = (ny - 1) / 2;
  for (let j = 0; j < ny; j++) {
    const y = (j - cy) * dy;
    for (let i = 0; i < nx; i++) {
      const x = (i - cx) * dx;
      let val = 0;
      for (const s of sources) {
        const dxm = x - s.x;
        const dym = y - s.y;
        const r2 = dxm * dxm + dym * dym;
        const norm = 1 / (2 * Math.PI * s.sigma * s.sigma);
        val += s.peak_u * Math.exp(-0.5 * r2 / (s.sigma * s.sigma)) * norm;
      }
      u[j * nx + i] = val;
    }
  }
  return u;
}

function solvePoisson2D(
  rho: Float32Array,
  nx: number,
  ny: number,
  dx: number,
  dy: number,
  fourPiG: number,
  iters: number,
): Float32Array {
  const phi = new Float32Array(nx * ny);
  const next = new Float32Array(nx * ny);
  const ax = 1 / (dx * dx);
  const ay = 1 / (dy * dy);
  const denom = 2 * (ax + ay);
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

function findVectorRoots(phi: Float32Array, grid: TCurvatureUnitInput["grid"]): VectorRootRecord[] {
  const { nx, ny, dx, dy } = grid;
  const roots: VectorRootRecord[] = [];
  const cx = (nx - 1) / 2;
  const cy = (ny - 1) / 2;
  for (let y = 1; y < ny - 1; y++) {
    for (let x = 1; x < nx - 1; x++) {
      const i = y * nx + x;
      const grad = gradientMagnitude(phi, i, nx, dx, dy);
      if (grad > ZERO_GRAD_THRESHOLD) {
        continue;
      }
      const val = phi[i];
      const neighbors = [phi[i - 1], phi[i + 1], phi[i - nx], phi[i + nx]];
      const isMin = neighbors.every((v) => val <= v);
      const isMax = neighbors.every((v) => val >= v);
      const kind: "min" | "max" | "saddle" = isMin ? "min" : isMax ? "max" : "saddle";
      roots.push({
        x: (x - cx) * dx,
        y: (y - cy) * dy,
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

function hashBytes(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
