import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { validatePhysicsEquationBackbone } from "../scripts/validate-physics-equation-backbone";

const tempRoots: string[] = [];

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function makeFixture(mutator?: (manifest: Record<string, unknown>) => void) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "physics-equation-backbone-"));
  tempRoots.push(repoRoot);

  const manifest: Record<string, unknown> = {
    schema_version: "physics_equation_backbone/1",
    manifest_id: "fixture",
    unit_system: "SI",
    claim_tier: "diagnostic",
    equations: [
      {
        id: "efe_baseline",
        expression: "G_mu_nu + Lambda * g_mu_nu = (8 * pi * G / c^4) * T_mu_nu",
        claim_tier: "diagnostic",
        symbols: [
          { symbol: "G_mu_nu", units: "1/m^2" },
          { symbol: "Lambda", units: "1/m^2" },
          { symbol: "g_mu_nu", units: "dimensionless" },
          { symbol: "G", units: "m^3/(kg*s^2)" },
          { symbol: "c", units: "m/s" },
          { symbol: "T_mu_nu", units: "Pa" },
        ],
      },
      {
        id: "semiclassical_coupling",
        expression: "G_mu_nu + Lambda * g_mu_nu = (8 * pi * G / c^4) * <T_mu_nu>",
        claim_tier: "diagnostic",
        symbols: [
          { symbol: "G_mu_nu", units: "1/m^2" },
          { symbol: "Lambda", units: "1/m^2" },
          { symbol: "g_mu_nu", units: "dimensionless" },
          { symbol: "<T_mu_nu>", units: "Pa" },
        ],
      },
      {
        id: "stress_energy_conservation",
        expression: "nabla_mu T_mu_nu = 0",
        claim_tier: "diagnostic",
        symbols: [
          { symbol: "nabla_mu", units: "1/m" },
          { symbol: "T_mu_nu", units: "Pa" },
        ],
      },
      {
        id: "uncertainty_propagation",
        expression: "sigma_f^2 = sum_i ((partial f / partial x_i)^2 * sigma_x_i^2)",
        claim_tier: "diagnostic",
        symbols: [
          { symbol: "sigma_f", units: "output_units" },
          { symbol: "partial f / partial x_i", units: "output_units/input_units" },
          { symbol: "sigma_x_i", units: "input_units" },
        ],
      },
      {
        id: "runtime_safety_gate",
        expression: "abs(delta_T00 / max(abs(T00_ref), eps)) <= rho_delta_max AND qi_bound_ok = true",
        claim_tier: "diagnostic",
        symbols: [
          { symbol: "delta_T00", units: "J/m^3" },
          { symbol: "T00_ref", units: "J/m^3" },
          { symbol: "eps", units: "J/m^3" },
          { symbol: "rho_delta_max", units: "dimensionless" },
          { symbol: "qi_bound_ok", units: "boolean" },
        ],
      },
    ],
  };

  mutator?.(manifest);
  writeJson(path.join(repoRoot, "configs", "physics-equation-backbone.v1.json"), manifest);
  return repoRoot;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("validatePhysicsEquationBackbone", () => {
  it("passes for complete canonical equation manifest", () => {
    const repoRoot = makeFixture();
    const result = validatePhysicsEquationBackbone({ repoRoot });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("fails when required equation entry is missing", () => {
    const repoRoot = makeFixture((manifest) => {
      const equations = manifest.equations as Array<Record<string, unknown>>;
      manifest.equations = equations.filter((entry) => entry.id !== "runtime_safety_gate");
    });

    const result = validatePhysicsEquationBackbone({ repoRoot });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("missing required equation id: runtime_safety_gate");
  });

  it("fails when required symbols or units are absent", () => {
    const repoRoot = makeFixture((manifest) => {
      const equations = manifest.equations as Array<Record<string, unknown>>;
      const target = equations.find((entry) => entry.id === "stress_energy_conservation");
      if (!target) {
        throw new Error("fixture setup failed");
      }
      target.symbols = [{ symbol: "T_mu_nu", units: "Pa" }];
    });

    const result = validatePhysicsEquationBackbone({ repoRoot });
    expect(result.ok).toBe(false);
    const combined = result.errors.join("\n");
    expect(combined).toContain("equation stress_energy_conservation missing required symbol: nabla_mu");
    expect(combined).toContain("equation stress_energy_conservation missing required unit: 1/m");
  });

  it("fails when manifest/equation claim tier is invalid", () => {
    const repoRoot = makeFixture((manifest) => {
      manifest.claim_tier = "exploratory";
      const equations = manifest.equations as Array<Record<string, unknown>>;
      equations[0].claim_tier = "exploratory";
    });

    const result = validatePhysicsEquationBackbone({ repoRoot });
    expect(result.ok).toBe(false);
    const combined = result.errors.join("\n");
    expect(combined).toContain("claim_tier must be one of diagnostic|reduced-order|certified");
    expect(combined).toContain("equations[0].claim_tier must be one of diagnostic|reduced-order|certified");
  });
});
