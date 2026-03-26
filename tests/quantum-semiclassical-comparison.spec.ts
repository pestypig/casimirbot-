import { describe, expect, it } from "vitest";

import { buildQuantumSemiclassicalComparisonResult } from "@shared/quantum-semiclassical-comparison";

describe("quantum semiclassical comparison matrix", () => {
  it("scores close tau overlap and passing time-crystal criteria above weak mismatched inputs", () => {
    const supported = buildQuantumSemiclassicalComparisonResult({
      schema_version: "quantum_semiclassical_comparison/1",
      tau_or_predicted_s: 2.2e-4,
      tau_decoherence_measured_s: 1.8e-4,
      collapse_bound_margin: 2.5,
      microtubule_transport_length_m: 2.1e-8,
      microtubule_transport_lifetime_s: 3.4e-9,
      subharmonic_lock_ratio: 2.02,
      temporal_order_coherence_time_s: 4e-3,
      dissipative_stability_window: 0.42,
      time_crystal_signature_pass: true,
    });

    const unsupported = buildQuantumSemiclassicalComparisonResult({
      schema_version: "quantum_semiclassical_comparison/1",
      tau_or_predicted_s: 1e-1,
      tau_decoherence_measured_s: 1e-8,
      collapse_bound_margin: -0.2,
      subharmonic_lock_ratio: 1.08,
      time_crystal_signature_pass: false,
    });

    expect(supported.tau_or_vs_measurement_overlap_score).toBeGreaterThan(unsupported.tau_or_vs_measurement_overlap_score);
    expect(supported.time_crystal_criteria_score).toBeGreaterThan(unsupported.time_crystal_criteria_score);
    expect(supported.orch_or_measurement_support_score).toBeGreaterThan(unsupported.orch_or_measurement_support_score);
    expect(supported.falsifiers_triggered).not.toContain("no_time_crystal_signature");
    expect(unsupported.falsifiers_triggered).toContain("no_time_crystal_signature");
  });

  it("normalizes dp_bound_margin into the canonical collapse_bound_margin slot", () => {
    const result = buildQuantumSemiclassicalComparisonResult({
      schema_version: "quantum_semiclassical_comparison/1",
      tau_or_predicted_s: 1e-5,
      tau_measurement_proxy_s: 2e-5,
      measurement_timescale_kind: "microtubule_transport_lifetime_proxy",
      dp_bound_margin: 0.8,
      subharmonic_lock_ratio: 2,
      time_crystal_signature_pass: true,
    });

    expect(result.collapse_bound_margin).toBe(0.8);
    expect(result.measurement_timescale_kind).toBe("microtubule_transport_lifetime_proxy");
    expect(result.comparison_contract_ids).toEqual([
      "uncertainty-dp-timescale-comparison-contract",
      "uncertainty-microtubule-observable-measurement-contract",
      "uncertainty-time-crystal-signature-contract",
    ]);
  });

  it("caps support when the time-crystal signature gate fails even if tau overlap is good", () => {
    const result = buildQuantumSemiclassicalComparisonResult({
      schema_version: "quantum_semiclassical_comparison/1",
      tau_or_predicted_s: 8e-5,
      tau_measurement_proxy_s: 1e-4,
      measurement_timescale_kind: "microtubule_transport_lifetime_proxy",
      collapse_bound_margin: 5,
      microtubule_transport_length_m: 3e-8,
      microtubule_transport_lifetime_s: 1e-8,
      subharmonic_lock_ratio: 1.95,
      temporal_order_coherence_time_s: 8e-3,
      dissipative_stability_window: 0.6,
      time_crystal_signature_pass: false,
    });

    expect(result.tau_or_vs_measurement_overlap_score).toBeGreaterThan(0.7);
    expect(result.orch_or_measurement_support_score).toBeLessThanOrEqual(0.45);
    expect(result.falsifiers_triggered).toContain("no_time_crystal_signature");
  });
});
