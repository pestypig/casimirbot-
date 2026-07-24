import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  computeDpCollapse,
  computeDpPotentialEnergyAudit,
  dpDeltaEPointPairPlummer,
  dpSelfEnergyUniformShell,
  dpSelfEnergyUniformSphere,
  sha256DpCanonicalDensityValues,
} from "@shared/dp-collapse";
import { G } from "@shared/physics-const";

const baseGrid = {
  dims: [24, 24, 24] as const,
  voxel_size_m: [1e-9, 1e-9, 1e-9] as const,
  origin_m: [0, 0, 0] as const,
};

const baseMethod = {
  kernel: "plummer" as const,
  max_voxels: 1728,
};

const provenanceGrid = {
  dims: [2, 1, 1] as const,
  voxel_size_m: [1e-9, 1e-9, 1e-9] as const,
  origin_m: [0, 0, 0] as const,
};

const canonicalFloat64Bytes = (values: readonly number[]): Buffer => {
  const bytes = Buffer.alloc(values.length * 8);
  values.forEach((value, index) => bytes.writeDoubleLE(value, index * 8));
  return bytes;
};

const float64Density = (values: readonly number[], trailing?: Uint8Array) => {
  const canonical = canonicalFloat64Bytes(values);
  const bytes = trailing
    ? Buffer.concat([canonical, Buffer.from(trailing)])
    : canonical;
  return {
    encoding: "base64" as const,
    dtype: "float64" as const,
    endian: "little" as const,
    order: "row-major" as const,
    data_b64: bytes.toString("base64"),
  };
};

const gaussian = (mass_kg: number, sigma_m: number, center_m: [number, number, number]) => ({
  kind: "gaussian" as const,
  mass_kg,
  sigma_m,
  center_m,
});

const sphere = (mass_kg: number, radius_m: number) => ({
  kind: "sphere" as const,
  mass_kg,
  radius_m,
  center_m: [0, 0, 0] as const,
});

const shell = (mass_kg: number, inner_radius_m: number, outer_radius_m: number) => ({
  kind: "shell" as const,
  mass_kg,
  inner_radius_m,
  outer_radius_m,
  center_m: [0, 0, 0] as const,
});

describe("dp-collapse: core behavior", () => {
  it("returns zero DeltaE for identical branches", () => {
    const input = {
      schema_version: "dp_collapse/1" as const,
      ell_m: 2e-10,
      grid: baseGrid,
      method: baseMethod,
      branch_a: {
        kind: "analytic" as const,
        primitives: [gaussian(1e-15, 2e-9, [0, 0, 0])],
      },
      branch_b: {
        kind: "analytic" as const,
        primitives: [gaussian(1e-15, 2e-9, [0, 0, 0])],
      },
    };

    const result = computeDpCollapse(input);
    expect(result.deltaE_J).toBe(0);
    expect(result.tau_infinite).toBe(true);
  });

  it("DeltaE grows with branch separation", () => {
    const mass = 5e-16;
    const sigma = 1.6e-9;
    const inputNear = {
      schema_version: "dp_collapse/1" as const,
      ell_m: 2e-10,
      grid: baseGrid,
      method: baseMethod,
      branch_a: {
        kind: "analytic" as const,
        primitives: [gaussian(mass, sigma, [-1e-9, 0, 0])],
      },
      branch_b: {
        kind: "analytic" as const,
        primitives: [gaussian(mass, sigma, [1e-9, 0, 0])],
      },
    };
    const inputFar = {
      ...inputNear,
      branch_a: {
        kind: "analytic" as const,
        primitives: [gaussian(mass, sigma, [-4e-9, 0, 0])],
      },
      branch_b: {
        kind: "analytic" as const,
        primitives: [gaussian(mass, sigma, [4e-9, 0, 0])],
      },
    };

    const near = computeDpCollapse(inputNear);
    const far = computeDpCollapse(inputFar);
    expect(far.deltaE_J).toBeGreaterThan(near.deltaE_J);
  });

  it("keeps the symmetric self/cross component ledger equal to DeltaE for asymmetric branches", () => {
    const result = computeDpCollapse({
      schema_version: "dp_collapse/1",
      ell_m: 2e-10,
      grid: baseGrid,
      method: baseMethod,
      branch_a: {
        kind: "analytic",
        primitives: [
          gaussian(7e-16, 1.4e-9, [-3e-9, 0, 0]),
          gaussian(2e-16, 1.1e-9, [2e-9, 1e-9, 0]),
        ],
      },
      branch_b: {
        kind: "analytic",
        primitives: [
          gaussian(5e-16, 1.8e-9, [1e-9, -2e-9, 0]),
        ],
      },
    });

    const reconstructed =
      result.components.self_a_J +
      result.components.self_b_J -
      2 * result.components.cross_J;
    const relativeError =
      Math.abs(reconstructed - result.deltaE_J) /
      Math.max(result.deltaE_J, Number.MIN_VALUE);
    expect(relativeError).toBeLessThan(1e-12);
  });

  it("replays the softened pairwise energy through the source-potential identity", () => {
    const input = {
      schema_version: "dp_collapse/1" as const,
      ell_m: 2e-10,
      grid: baseGrid,
      method: baseMethod,
      branch_a: {
        kind: "analytic" as const,
        primitives: [gaussian(6e-16, 1.5e-9, [-2e-9, 0, 0])],
      },
      branch_b: {
        kind: "analytic" as const,
        primitives: [gaussian(6e-16, 1.5e-9, [2e-9, 0, 0])],
      },
    };

    const audit = computeDpPotentialEnergyAudit(input);
    expect(audit.gate).toBe("pass");
    expect(audit.relative_error).toBeLessThan(1e-12);
    expect(audit.claim_tier).toBe("diagnostic");
    expect(audit.certifying).toBe(false);
  });

  it("matches uniform sphere self-energy within coarse tolerance", () => {
    const mass = 1e-15;
    const radius = 4e-9;
    const input = {
      schema_version: "dp_collapse/1" as const,
      ell_m: 1e-10,
      grid: baseGrid,
      method: baseMethod,
      branch_a: {
        kind: "analytic" as const,
        primitives: [sphere(mass, radius)],
      },
      branch_b: {
        kind: "analytic" as const,
        primitives: [],
      },
    };

    const result = computeDpCollapse(input);
    const analytic = dpSelfEnergyUniformSphere(mass, radius);
    const relErr = Math.abs(result.deltaE_J - analytic) / analytic;
    expect(relErr).toBeLessThan(0.8);
  });

  it("matches thin-shell self-energy within coarse tolerance", () => {
    const mass = 9e-16;
    const outer = 4.5e-9;
    const inner = 2.2e-9;
    const input = {
      schema_version: "dp_collapse/1" as const,
      ell_m: 1e-10,
      grid: baseGrid,
      method: baseMethod,
      branch_a: {
        kind: "analytic" as const,
        primitives: [shell(mass, inner, outer)],
      },
      branch_b: {
        kind: "analytic" as const,
        primitives: [],
      },
    };

    const result = computeDpCollapse(input);
    const analytic = dpSelfEnergyUniformShell(mass, inner, outer);
    const relErr = Math.abs(result.deltaE_J - analytic) / analytic;
    expect(relErr).toBeLessThan(0.8);
  });



  it("adds provenance contract fields for analytic paths with deterministic non-admissible fail_reason", () => {
    const result = computeDpCollapse({
      schema_version: "dp_collapse/1",
      ell_m: 2e-10,
      grid: baseGrid,
      method: baseMethod,
      branch_a: {
        kind: "analytic",
        primitives: [gaussian(1e-15, 2e-9, [0, 0, 0])],
      },
      branch_b: {
        kind: "analytic",
        primitives: [gaussian(1e-15, 2e-9, [0, 0, 0])],
      },
    });

    expect(result.provenance_class).toBe("inferred");
    expect(result.claim_tier).toBe("diagnostic");
    expect(result.certifying).toBe(false);
    expect(result.fail_reason).toBe("DP_COLLAPSE_PROVENANCE_NON_ADMISSIBLE");
  });

  it("returns deterministic unknown fail_reason for density-grid paths missing provenance hashes", () => {
    const density = {
      encoding: "base64" as const,
      dtype: "float32" as const,
      endian: "little" as const,
      order: "row-major" as const,
      data_b64: Buffer.alloc(24 * 24 * 24 * 4).toString("base64"),
    };

    const result = computeDpCollapse({
      schema_version: "dp_collapse/1",
      ell_m: 2e-10,
      grid: baseGrid,
      method: baseMethod,
      branch_a: { kind: "density_grid", rho_kg_m3: density },
      branch_b: { kind: "density_grid", rho_kg_m3: density },
    });

    expect(result.provenance_class).toBe("proxy");
    expect(result.claim_tier).toBe("reduced-order");
    expect(result.certifying).toBe(false);
    expect(result.fail_reason).toBe("DP_COLLAPSE_PROVENANCE_UNKNOWN");
  });

  it("certifies density grids only when both hashes bind the canonical Float64 payload bytes", () => {
    const branchAValues = [1, 2];
    const branchBValues = [2, 1];
    const branchAHash = createHash("sha256")
      .update(canonicalFloat64Bytes(branchAValues))
      .digest("hex");
    const branchBHash = createHash("sha256")
      .update(canonicalFloat64Bytes(branchBValues))
      .digest("hex");
    const multiBlockValues = Array.from({ length: 17 }, (_, index) => index / 3);
    const multiBlockHash = createHash("sha256")
      .update(canonicalFloat64Bytes(multiBlockValues))
      .digest("hex");

    expect(sha256DpCanonicalDensityValues(branchAValues)).toBe(branchAHash);
    expect(sha256DpCanonicalDensityValues(multiBlockValues)).toBe(multiBlockHash);
    const result = computeDpCollapse({
      schema_version: "dp_collapse/1",
      ell_m: 2e-10,
      grid: provenanceGrid,
      method: { kernel: "plummer", max_voxels: 2 },
      branch_a: {
        kind: "density_grid",
        rho_kg_m3: float64Density(branchAValues),
        lattice_generation_hash: branchAHash,
      },
      branch_b: {
        kind: "density_grid",
        rho_kg_m3: float64Density(branchBValues),
        lattice_generation_hash: branchBHash,
      },
    });

    expect(result.provenance_class).toBe("measured");
    expect(result.claim_tier).toBe("certified");
    expect(result.certifying).toBe(true);
    expect(result.fail_reason).toBeUndefined();
  });

  it("fails closed on a forged but well-formed density payload hash", () => {
    const values = [1, 2];
    expect(() =>
      computeDpCollapse({
        schema_version: "dp_collapse/1",
        ell_m: 2e-10,
        grid: provenanceGrid,
        method: { kernel: "plummer", max_voxels: 2 },
        branch_a: {
          kind: "density_grid",
          rho_kg_m3: float64Density(values),
          lattice_generation_hash: "0".repeat(64),
        },
        branch_b: {
          kind: "density_grid",
          rho_kg_m3: float64Density(values),
        },
      }),
    ).toThrow("density_grid_hash_mismatch");
  });

  it("rejects malformed or uppercase density provenance hashes", () => {
    const values = [1, 2];
    const validHash = createHash("sha256")
      .update(canonicalFloat64Bytes(values))
      .digest("hex");
    const makeInput = (hash: string) => ({
      schema_version: "dp_collapse/1" as const,
      ell_m: 2e-10,
      grid: provenanceGrid,
      method: { kernel: "plummer" as const, max_voxels: 2 },
      branch_a: {
        kind: "density_grid" as const,
        rho_kg_m3: float64Density(values),
        lattice_generation_hash: hash,
      },
      branch_b: {
        kind: "density_grid" as const,
        rho_kg_m3: float64Density(values),
      },
    });

    expect(() => computeDpCollapse(makeInput("not-a-sha256"))).toThrow();
    expect(() => computeDpCollapse(makeInput(validHash.toUpperCase()))).toThrow();
  });

  it("rejects trailing and short Float64 density payload bytes", () => {
    const values = [1, 2];
    const baseInput = {
      schema_version: "dp_collapse/1" as const,
      ell_m: 2e-10,
      grid: provenanceGrid,
      method: { kernel: "plummer" as const, max_voxels: 2 },
      branch_b: {
        kind: "density_grid" as const,
        rho_kg_m3: float64Density(values),
      },
    };
    expect(() =>
      computeDpCollapse({
        ...baseInput,
        branch_a: {
          kind: "density_grid",
          rho_kg_m3: float64Density(values, new Uint8Array([0])),
        },
      }),
    ).toThrow("density_field_byte_length_mismatch");
    expect(() =>
      computeDpCollapse({
        ...baseInput,
        branch_a: {
          kind: "density_grid",
          rho_kg_m3: {
            ...float64Density(values),
            data_b64: canonicalFloat64Bytes(values)
              .subarray(0, values.length * 8 - 1)
              .toString("base64"),
          },
        },
      }),
    ).toThrow("density_field_byte_length_mismatch");
  });

  it.each([
    { name: "negative", values: [1, -1] },
    { name: "NaN", values: [1, Number.NaN] },
  ])("rejects $name density samples before DP evaluation", ({ values }) => {
    expect(() =>
      computeDpCollapse({
        schema_version: "dp_collapse/1",
        ell_m: 2e-10,
        grid: provenanceGrid,
        method: { kernel: "plummer", max_voxels: 2 },
        branch_a: {
          kind: "density_grid",
          rho_kg_m3: float64Density(values),
        },
        branch_b: {
          kind: "density_grid",
          rho_kg_m3: float64Density([1, 1]),
        },
      }),
    ).toThrow("density_field_invalid_value");
  });

  it("rejects density grids whose coordinate origin differs from the shared DP grid", () => {
    const density = {
      encoding: "base64" as const,
      dtype: "float32" as const,
      endian: "little" as const,
      order: "row-major" as const,
      data_b64: Buffer.alloc(24 * 24 * 24 * 4).toString("base64"),
    };

    expect(() => computeDpCollapse({
      schema_version: "dp_collapse/1",
      ell_m: 2e-10,
      grid: baseGrid,
      method: baseMethod,
      branch_a: {
        kind: "density_grid",
        rho_kg_m3: density,
        grid: { ...baseGrid, origin_m: [1e-9, 0, 0] },
      },
      branch_b: { kind: "density_grid", rho_kg_m3: density },
    })).toThrow("density_grid_mismatch");
  });

  it("point-pair Plummer baseline matches the registered half-double-integral convention", () => {
    const mass = 3e-16;
    const ell = 2e-10;
    const near = dpDeltaEPointPairPlummer(mass, 1e-9, ell);
    const far = dpDeltaEPointPairPlummer(mass, 6e-9, ell);
    const expectedNear =
      G * mass ** 2 * (1 / ell - 1 / Math.hypot(1e-9, ell));
    expect(near).toBeGreaterThan(0);
    expect(far).toBeGreaterThan(near);
    expect(Math.abs(near - expectedNear) / expectedNear).toBeLessThan(1e-15);
  });
});
