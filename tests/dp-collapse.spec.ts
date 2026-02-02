import { describe, expect, it } from "vitest";
import {
  computeDpCollapse,
  dpDeltaEPointPairPlummer,
  dpSelfEnergyUniformShell,
  dpSelfEnergyUniformSphere,
} from "@shared/dp-collapse";

const baseGrid = {
  dims: [24, 24, 24] as const,
  voxel_size_m: [1e-9, 1e-9, 1e-9] as const,
  origin_m: [0, 0, 0] as const,
};

const baseMethod = {
  kernel: "plummer" as const,
  max_voxels: 1728,
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

  it("point-pair Plummer baseline is finite and monotonic", () => {
    const mass = 3e-16;
    const ell = 2e-10;
    const near = dpDeltaEPointPairPlummer(mass, 1e-9, ell);
    const far = dpDeltaEPointPairPlummer(mass, 6e-9, ell);
    expect(near).toBeGreaterThan(0);
    expect(far).toBeGreaterThan(near);
  });
});
