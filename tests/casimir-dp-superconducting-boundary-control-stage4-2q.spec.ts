import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateCasimirDpSuperconductingBoundaryControlStage4_2Q } from "../shared/casimir-dp-superconducting-boundary-control-stage4-2q";
import {
  CasimirDpSuperconductingBoundaryControlStage4_2QConfig,
  CasimirDpSuperconductingBoundaryFixtureStage4_2Q,
} from "../shared/contracts/casimir-dp-superconducting-boundary-control-stage4-2q.v1";

const config = CasimirDpSuperconductingBoundaryControlStage4_2QConfig.parse(JSON.parse(
  readFileSync("configs/research/casimir-dp-superconducting-boundary-control-stage4-2q.v1.json", "utf8"),
));
const fixture = CasimirDpSuperconductingBoundaryFixtureStage4_2Q.parse(JSON.parse(
  readFileSync(config.fixture_path, "utf8"),
));

describe("Casimir-DP Stage-4.2Q superconducting-boundary control", () => {
  it("recovers London screening while preserving finite-frequency impedance", () => {
    const result = evaluateCasimirDpSuperconductingBoundaryControlStage4_2Q(config, fixture);
    expect(result.recoveries.software_pipeline).toBe("pass");
    expect(result.gauge_condensate_recovery.london_relative_error).toBeLessThan(config.gates.london_relative_tolerance);
    expect(result.gauge_condensate_recovery.finite_frequency_impedance_nonzero).toBe(true);
    expect(result.gauge_condensate_recovery.zero_dc_resistance_ohm).toBe(0);
    expect(result.synthetic_green_transfer.gate).toBe("pass");
    expect(result.synthetic_green_transfer.maximum_absolute_error).toBeLessThanOrEqual(
      config.gates.maximum_green_transfer_absolute_error,
    );
    expect(result.synthetic_green_transfer.measured_full_maxwell_green_authority).toBe("not_ready");
  });

  it("proves that the standard Diósi factor cancels from the boundary ratio", () => {
    const result = evaluateCasimirDpSuperconductingBoundaryControlStage4_2Q(config, fixture);
    expect(result.frozen_diosi_cancellation.gate).toBe("pass");
    expect(result.frozen_diosi_cancellation.maximum_error).toBeLessThanOrEqual(config.gates.maximum_dp_cancellation_error);
    expect(result.graph_policy.frozen_diosi_law_modified).toBe(false);
  });

  it("rejects the collinear thermal toggle and finds only a bounded synthetic magnetic candidate", () => {
    const result = evaluateCasimirDpSuperconductingBoundaryControlStage4_2Q(config, fixture);
    const byId = Object.fromEntries(result.strategy_assessment.strategies.map((row) => [row.strategy_id, row]));
    expect(byId.temperature_crossing.gate).toBe("no_go");
    expect(byId.matched_static_pair.gate).toBe("no_go");
    expect(byId.magnetic_field_toggle.gate).toBe("pass");
    expect(result.strategy_assessment.selected_synthetic_strategy).toBe("magnetic_field_toggle");
    expect(result.strategy_assessment.physical_control_authority).toBe("not_ready");
  });

  it("keeps Higgs, condensate, BEC and collapse claim boundaries explicit", () => {
    const result = evaluateCasimirDpSuperconductingBoundaryControlStage4_2Q(config, fixture);
    expect(result.bridge_map.standard_model_higgs_to_diosi).toBe("nonbridge");
    expect(result.bridge_map.anderson_higgs_to_standard_model_higgs).toBe("structural_analogy_only");
    expect(result.bridge_map.superconducting_impedance_to_green_tensor).toBe("ordinary_observable_bridge");
    expect(result.bridge_map.bec_many_body_coherence_to_platform_replication).toBe("conditional_platform_bridge");
    expect(result.graph_policy.collapse_bridge_edges_added).toBe(0);
    expect(result.standing.measured_evidence).toBe("not_ready");
    expect(result.standing.collapse_identification).toBe("blocked");
  });

  it("fails finite-impedance semantics if the superconducting response is erased", () => {
    const altered = structuredClone(fixture);
    altered.boundary_specimen.superconducting_impedance = altered.boundary_specimen.superconducting_impedance.map((point) => ({
      ...point, resistance_ohm: 0, reactance_ohm: 0,
    }));
    const result = evaluateCasimirDpSuperconductingBoundaryControlStage4_2Q(config, altered);
    expect(result.recoveries.software_pipeline).toBe("not_ready");
    expect(result.recoveries.finite_impedance_semantics).toBe("not_ready");
  });
});
