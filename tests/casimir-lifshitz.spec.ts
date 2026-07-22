import { describe, expect, it } from "vitest";
import {
  LifshitzSolverInput,
  computeLifshitzEquilibrium,
} from "../shared/casimir-lifshitz";

const numerics = {
  max_matsubara_terms: 1024,
  integration_subdivisions: 240,
  integration_tail_y: 40,
  relative_term_tolerance: 1e-8,
  consecutive_small_terms: 6,
};

const ideal = {
  kind: "ideal_conductor" as const,
  label: "ideal reference",
  evidence_class: "literature_anchored" as const,
  source_ref: "Casimir/Lifshitz reference",
  artifact_sha256: null,
};

describe("reduced-order equilibrium Lifshitz solver", () => {
  it("recovers the ideal 100 nm pressure reference within the registered tolerance", () => {
    const result = computeLifshitzEquilibrium({
      schema_version: "casimir_lifshitz/1",
      gap_m: 1e-7,
      temperature_K: 300,
      material_1: ideal,
      material_2: ideal,
      geometry: { kind: "parallel_plates", area_m2: 1e-8 },
      numerics,
    });

    expect(result.convergence.status).toBe("pass");
    expect(result.ideal_zero_temperature_reference.pressure_ratio).toBeCloseTo(1, 4);
    expect(result.pressure_Pa).toBeLessThan(0);
    expect(result.publication_grade_gate).toBe("not_ready");
  });

  it("keeps a Drude PFA row below ideal authority", () => {
    const drude = {
      kind: "drude" as const,
      label: "gold-like Drude model",
      evidence_class: "literature_anchored" as const,
      source_ref: "https://doi.org/10.1103/RevModPhys.81.1827",
      artifact_sha256: null,
      plasma_frequency_rad_s: 1.367e16,
      damping_rad_s: 5.317e13,
    };
    const result = computeLifshitzEquilibrium({
      schema_version: "casimir_lifshitz/1",
      gap_m: 1e-7,
      temperature_K: 300,
      material_1: drude,
      material_2: drude,
      geometry: { kind: "sphere_plate_pfa", sphere_radius_m: 5e-5 },
      numerics,
    });

    expect(result.zero_mode.material_1).toBe("drude_te_zero");
    expect(result.ideal_zero_temperature_reference.pressure_ratio).toBeGreaterThan(0);
    expect(result.ideal_zero_temperature_reference.pressure_ratio).toBeLessThan(1);
    expect(result.geometry.authority).toBe("pfa_reference_only");
    expect(result.material_gate).toBe("literature_or_assumption_only");
  });

  it("requires hashes for measured dielectric evidence", () => {
    const parsed = LifshitzSolverInput.safeParse({
      schema_version: "casimir_lifshitz/1",
      gap_m: 1e-7,
      temperature_K: 300,
      material_1: { ...ideal, evidence_class: "measured" },
      material_2: ideal,
      geometry: { kind: "parallel_plates", area_m2: 1e-8 },
      numerics,
    });

    expect(parsed.success).toBe(false);
  });
});
