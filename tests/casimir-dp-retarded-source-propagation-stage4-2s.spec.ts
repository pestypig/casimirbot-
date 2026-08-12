import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateCasimirDpRetardedSourcePropagationStage4_2S } from "../shared/casimir-dp-retarded-source-propagation-stage4-2s";
import { CasimirDpRetardedSourcePropagationStage4_2SConfig } from "../shared/contracts/casimir-dp-retarded-source-propagation-stage4-2s.v1";

const config = CasimirDpRetardedSourcePropagationStage4_2SConfig.parse(JSON.parse(
  readFileSync("configs/research/casimir-dp-retarded-source-propagation-stage4-2s.v1.json", "utf8"),
));

describe("Casimir-DP Stage-4.2S retarded-source propagation", () => {
  it("recovers retarded transverse radiation, Larmor power, and standard limits", () => {
    const result = evaluateCasimirDpRetardedSourcePropagationStage4_2S(config);
    expect(result.retarded_radiation_recovery.gate).toBe("pass");
    expect(result.retarded_radiation_recovery.larmor_relative_error).toBeLessThan(1e-7);
    expect(result.retarded_radiation_recovery.doubled_distance_amplitude_V_m).toBeCloseTo(
      result.retarded_radiation_recovery.field_amplitude_V_m / 2, 15,
    );
    expect(result.retarded_radiation_recovery.zero_acceleration_amplitude_V_m).toBe(0);
    expect(result.retarded_radiation_recovery.transversality_error).toBe(0);
  });

  it("recovers current conservation and circular-polarization completeness", () => {
    const result = evaluateCasimirDpRetardedSourcePropagationStage4_2S(config);
    expect(result.retarded_radiation_recovery.current_conservation_residual).toBeLessThanOrEqual(1e-15);
    expect(result.retarded_radiation_recovery.circular_polarization_projector_error).toBeLessThanOrEqual(1e-15);
  });

  it("distinguishes the slow boundary label from optical wave propagation", () => {
    const result = evaluateCasimirDpRetardedSourcePropagationStage4_2S(config);
    expect(result.source_scale_classification.boundary_fundamental_kL).toBeCloseTo(8.38338e-13, 5);
    expect(result.source_scale_classification.optical_benchmark_kL).toBeCloseTo(324.293, 3);
    expect(result.source_scale_classification.rows[0].propagation_regime).toBe("quasistatic_candidate");
    expect(result.source_scale_classification.rows[3].propagation_regime).toBe("retarded_wave");
    expect(result.source_scale_classification.quasistatic_modulation_authority).toBe("not_ready");
  });

  it("maps a polarization-retaining Green transfer into ordinary phase, loss, recoil, and heating", () => {
    const result = evaluateCasimirDpRetardedSourcePropagationStage4_2S(config);
    const recovery = result.synthetic_branch_green_recovery;
    expect(recovery.scope).toContain("synthetic_algebraic_recovery");
    expect(recovery.polarization_retained).toBe(true);
    expect(Number.isFinite(recovery.ordinary_phase_rad)).toBe(true);
    expect(recovery.ordinary_chi).toBeGreaterThanOrEqual(0);
    expect(recovery.absorbed_power_W).toBeGreaterThanOrEqual(0);
    expect(recovery.recoil_momentum_diffusion_kg2_m2_s3).toBeGreaterThanOrEqual(0);
    expect(recovery.complex_coherence_nuisance_vector.log_magnitude).toBe(-recovery.ordinary_chi);
  });

  it("fails closed while measured same-apparatus propagation authorities are absent", () => {
    const result = evaluateCasimirDpRetardedSourcePropagationStage4_2S(config);
    expect(result.decision.software_contract).toBe("pass");
    expect(result.authority_audit.ready_count).toBe(0);
    expect(result.authority_audit.missing_count).toBe(7);
    expect(result.authority_audit.empirical_ordinary_null_input).toBe("no_go");
    expect(result.decision.ordinary_null_integration).toBe("not_authorized");
    expect(result.standing.collapse_identification).toBe("blocked");
  });

  it("preserves the frozen Diósi model and adds no collapse bridge", () => {
    const result = evaluateCasimirDpRetardedSourcePropagationStage4_2S(config);
    expect(result.hypothesis_separation.frozen_diosi_law_modified).toBe(false);
    expect(result.hypothesis_separation.speculative_bridge_lane).toBe("not_registered");
    expect(result.hypothesis_separation.collapse_bridge_edges_added).toBe(0);
  });
});
