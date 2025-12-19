import { afterAll, beforeAll, describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { CurvatureUnitInput } from "../shared/essence-physics";
import { SI_UNITS } from "../shared/unit-system";
import { curvatureUnitHandler } from "../server/skills/physics.curvature";
import { putBlob } from "../server/storage";
import { resetDbClient } from "../server/db/client";
import { findEnvelopeByOriginalHash, resetEnvelopeStore } from "../server/services/essence/store";

type GaussianSource = { x_m: number; y_m: number; sigma_m: number; peak_u_Jm3: number };

const sha256Hex = (buffer: Buffer): string => crypto.createHash("sha256").update(buffer).digest("hex");

function synthesizeGaussianField(grid: { nx: number; ny: number; dx_m: number; dy_m: number }, sources: GaussianSource[]) {
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

function float32ToBase64(arr: Float32Array): string {
  return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength).toString("base64");
}

let tmpDir = "";

beforeAll(async () => {
  tmpDir = mkdtempSync(path.join(os.tmpdir(), "curvature-unit-v2-"));
  const dataDir = path.join(tmpDir, "data");
  mkdirSync(dataDir, { recursive: true });
  process.env.DATA_DIR = dataDir;
  process.env.DATABASE_URL = "pg-mem://curvature-unit-v2";
  await resetDbClient();
  await resetEnvelopeStore();
});

afterAll(() => {
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {}
  delete process.env.DATA_DIR;
  delete process.env.DATABASE_URL;
});

describe("CurvatureUnit v2: schema + u_field handling", () => {
  it("accepts u_field (base64) and normalizes data URLs / whitespace", () => {
    const nx = 2;
    const ny = 2;
    const u = new Float32Array([1, 2, 3, 4]);
    const b64 = float32ToBase64(u);
    const withNoise = `data:application/octet-stream;base64,${b64.slice(0, 6)}\n${b64.slice(6)}  `;

    const parsed = CurvatureUnitInput.parse({
      grid: { nx, ny, dx_m: 1, dy_m: 1, thickness_m: 1 },
      u_field: {
        encoding: "base64",
        dtype: "float32",
        endian: "little",
        order: "row-major",
        data_b64: withNoise,
      },
    });

    expect(parsed.boundary).toBe("dirichlet0");
    expect(parsed.units).toEqual(SI_UNITS);
    expect(parsed.u_field?.encoding).toBe("base64");
    expect((parsed.u_field as any).data_b64).toBe(b64);
  });

  it("rejects ambiguous inputs (both sources and u_field)", () => {
    expect(() =>
      CurvatureUnitInput.parse({
        grid: { nx: 4, ny: 4, dx_m: 1, dy_m: 1, thickness_m: 1 },
        sources: [{ x_m: 0, y_m: 0, sigma_m: 0.5, peak_u_Jm3: 1 }],
        u_field: {
          encoding: "base64",
          dtype: "float32",
          endian: "little",
          order: "row-major",
          data_b64: "AAAA",
        },
      }),
    ).toThrow();
  });
});

describe("CurvatureUnit v2: determinism + hashing", () => {
  it("produces deterministic artifacts/hashes for a 256×256 raster u_field (base64 vs blob)", async () => {
    const grid = { nx: 256, ny: 256, dx_m: 0.02, dy_m: 0.02, thickness_m: 1 };
    const sources: GaussianSource[] = [
      { x_m: -0.2, y_m: 0, sigma_m: 0.05, peak_u_Jm3: 1_000 },
      { x_m: 0.2, y_m: 0, sigma_m: 0.05, peak_u_Jm3: 1_000 },
    ];
    const u = synthesizeGaussianField(grid, sources);
    const uBuf = Buffer.from(u.buffer, u.byteOffset, u.byteLength);
    const uB64 = uBuf.toString("base64");
    const uBlob = await putBlob(uBuf, { contentType: "application/octet-stream" });
    const expectedEnergyCid = uBlob.cid;
    const expectedEnergyHash = sha256Hex(uBuf);
    expect(expectedEnergyCid).toBe(`cid:${expectedEnergyHash}`);

    const base64Input: any = {
      units: SI_UNITS,
      grid,
      u_field: {
        encoding: "base64",
        dtype: "float32",
        endian: "little",
        order: "row-major",
        data_b64: uB64,
      },
      constants: { c: 299_792_458, G: 6.6743e-11 },
    };
    const blobInput: any = {
      units: SI_UNITS,
      grid,
      u_field: {
        encoding: "blob",
        dtype: "float32",
        endian: "little",
        order: "row-major",
        uri: uBlob.uri,
        cid: uBlob.cid,
      },
      constants: { c: 299_792_458, G: 6.6743e-11 },
    };

    const a = (await curvatureUnitHandler(base64Input, { personaId: "persona:curvature-v2-base64" })) as any;
    const b = (await curvatureUnitHandler(blobInput, { personaId: "persona:curvature-v2-blob" })) as any;

    expect(a.artifacts.energy_field_cid).toBe(expectedEnergyCid);
    expect(b.artifacts.energy_field_cid).toBe(expectedEnergyCid);
    expect(a.artifacts.potential_cid).toBe(b.artifacts.potential_cid);
    expect(a.summary.residual_rms).toBeLessThan(1e-4);
    expect(b.summary.residual_rms).toBeLessThan(1e-4);

    const potentialHash = String(a.artifacts.potential_cid ?? "").replace(/^cid:/, "");
    const envA = await findEnvelopeByOriginalHash("sha256", potentialHash, "persona:curvature-v2-base64");
    const envB = await findEnvelopeByOriginalHash("sha256", potentialHash, "persona:curvature-v2-blob");
    expect(envA).toBeTruthy();
    expect(envB).toBeTruthy();

    expect(envA?.provenance?.information_boundary?.inputs_hash).toBe(envB?.provenance?.information_boundary?.inputs_hash);
    expect(envA?.provenance?.information_boundary?.features_hash).toBe(envB?.provenance?.information_boundary?.features_hash);
    expect(envA?.provenance?.information_boundary?.inputs_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(envA?.provenance?.information_boundary?.features_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("changes hashes when boundary conditions change (Dirichlet vs Neumann vs periodic)", async () => {
    const grid = { nx: 64, ny: 64, dx_m: 0.02, dy_m: 0.02, thickness_m: 1 };
    const sources: GaussianSource[] = [
      { x_m: -0.2, y_m: 0, sigma_m: 0.05, peak_u_Jm3: 1_000 },
      { x_m: 0.2, y_m: 0, sigma_m: 0.05, peak_u_Jm3: 1_000 },
    ];
    const u = synthesizeGaussianField(grid, sources);
    const uB64 = float32ToBase64(u);

    const mkInput = (boundary: "dirichlet0" | "neumann0" | "periodic") => ({
      units: SI_UNITS,
      grid,
      boundary,
      u_field: { encoding: "base64", dtype: "float32", endian: "little", order: "row-major", data_b64: uB64 },
      constants: { c: 299_792_458, G: 6.6743e-11 },
    });

    const dir = (await curvatureUnitHandler(mkInput("dirichlet0"), { personaId: "persona:curv-bc-dir" })) as any;
    const neu = (await curvatureUnitHandler(mkInput("neumann0"), { personaId: "persona:curv-bc-neu" })) as any;
    const per = (await curvatureUnitHandler(mkInput("periodic"), { personaId: "persona:curv-bc-per" })) as any;

    expect(dir.artifacts.potential_cid).not.toBe(neu.artifacts.potential_cid);
    expect(dir.artifacts.potential_cid).not.toBe(per.artifacts.potential_cid);
    expect(neu.artifacts.potential_cid).not.toBe(per.artifacts.potential_cid);
    expect(dir.summary.residual_rms).toBeLessThan(1e-5);
    expect(neu.summary.residual_rms).toBeLessThan(1e-5);
    expect(per.summary.residual_rms).toBeLessThan(1e-5);

    const potDir = String(dir.artifacts.potential_cid ?? "").replace(/^cid:/, "");
    const potNeu = String(neu.artifacts.potential_cid ?? "").replace(/^cid:/, "");
    const envDir = await findEnvelopeByOriginalHash("sha256", potDir, "persona:curv-bc-dir");
    const envNeu = await findEnvelopeByOriginalHash("sha256", potNeu, "persona:curv-bc-neu");
    expect(envDir?.provenance?.information_boundary?.inputs_hash).not.toBe(envNeu?.provenance?.information_boundary?.inputs_hash);
  });
});

