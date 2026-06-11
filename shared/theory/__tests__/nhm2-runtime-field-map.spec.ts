import { describe, expect, it } from "vitest";
import { isTheoryCompoundRunV1 } from "../../contracts/theory-compound-run.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import {
  findNhm2RuntimeFieldBindingsForGate,
  getNhm2RuntimeFieldBinding,
  isNhm2RuntimeBoundBadge,
  NHM2_RUNTIME_FIELD_BINDINGS,
} from "../nhm2-runtime-field-map";
import { buildTheoryCompoundRun } from "../theory-compound-run-builder";

describe("NHM2 runtime field map", () => {
  it("maps source residual to runtime fields, scalar cuts, gates, and required evidence", () => {
    const binding = getNhm2RuntimeFieldBinding("nhm2.closure.source_residual");

    expect(binding?.kind).toBe("runtime_bound_output");
    expect(binding?.runtimeId).toBe("gr_nhm2.artifact_reader");
    expect(binding?.artifactFields).toEqual(
      expect.arrayContaining(["sourceClosureResidualRms", "sourceClosureResidualMax"]),
    );
    expect(binding?.scalarCuts.map((cut) => cut.expression)).toContain(
      "R_source = source_required - source_available",
    );
    expect(binding?.gates).toContain("source_closure");
    expect(binding?.requiredEvidence).toEqual(
      expect.arrayContaining(["source_closure_artifact", "observer_audit"]),
    );
  });

  it("distinguishes universal/model roots from runtime-bound outputs", () => {
    expect(getNhm2RuntimeFieldBinding("physics.gr.einstein_field_equation")?.kind).toBe(
      "model_relation",
    );
    expect(isNhm2RuntimeBoundBadge("physics.gr.einstein_field_equation")).toBe(false);
    expect(isNhm2RuntimeBoundBadge("nhm2.closure.wall_t00_source_residual")).toBe(true);
    expect(isNhm2RuntimeBoundBadge("nhm2.source.wall_t00_trace")).toBe(true);
    expect(isNhm2RuntimeBoundBadge("nhm2.tensor.full_authority_gate")).toBe(true);
    expect(isNhm2RuntimeBoundBadge("nhm2.tensor.same_chart_full_tensor")).toBe(true);
    expect(isNhm2RuntimeBoundBadge("nhm2.source.same_basis_tensor_authority")).toBe(true);
    expect(isNhm2RuntimeBoundBadge("nhm2.qei.sampling_window")).toBe(true);
    expect(isNhm2RuntimeBoundBadge("nhm2.qei.worldline_dossier")).toBe(true);
    expect(isNhm2RuntimeBoundBadge("nhm2.energy_condition.observer_robust_gate")).toBe(true);
    expect(isNhm2RuntimeBoundBadge("nhm2.natario.invariant_audit")).toBe(true);
    expect(isNhm2RuntimeBoundBadge("nhm2.energy_condition.diagnostic_gate")).toBe(true);
  });

  it("maps wall T00 and full tensor authority badges to explicit blocker fields", () => {
    const wallClosure = getNhm2RuntimeFieldBinding("nhm2.closure.wall_t00_source_residual");
    const wall = getNhm2RuntimeFieldBinding("nhm2.source.wall_t00_trace");
    const tensor = getNhm2RuntimeFieldBinding("nhm2.tensor.full_authority_gate");
    const sameChartTensor = getNhm2RuntimeFieldBinding("nhm2.tensor.same_chart_full_tensor");
    const sourceAuthority = getNhm2RuntimeFieldBinding(
      "nhm2.source.same_basis_tensor_authority",
    );

    expect(wallClosure?.artifactFields).toEqual(
      expect.arrayContaining([
        "nhm2WallSourceClosure.required.T00_SI",
        "nhm2WallSourceClosure.available.T00_SI",
        "nhm2WallSourceClosure.residual.pass",
        "sourceClosure.wallSourceClosure.residual.pass",
      ]),
    );
    expect(wallClosure?.scalarCuts.map((cut) => cut.expression)).toContain(
      "R_wall_T00 = T00_wall_required - T00_wall_available",
    );
    expect(wallClosure?.gates).toEqual(
      expect.arrayContaining(["source_closure", "wall_source_closure"]),
    );
    expect(wall?.artifactFields).toEqual(
      expect.arrayContaining(["sourceClosureWallT00RelLInf", "wallT00RelLInf", "t00_mismatch_present"]),
    );
    expect(wall?.gates).toEqual(expect.arrayContaining(["source_closure", "wall_t00_trace"]));
    expect(tensor?.artifactFields).toEqual(
      expect.arrayContaining([
        "observerMetricT0iAdmissionStatus",
        "observerMetricOffDiagonalTijAdmissionStatus",
        "sameChartFullTensor.components[].status",
        "sameChartFullTensor.components[].provenance.source",
        "sameChartFullTensor.completeness.fullTensorComplete",
        "sameChartFullTensor.completeness.missingComponentIds",
      ]),
    );
    expect(tensor?.requiredEvidence).toEqual(
      expect.arrayContaining(["metric_t0i_emission", "metric_off_diagonal_tij_emission"]),
    );
    expect(sameChartTensor?.artifactFields).toEqual(
      expect.arrayContaining([
        "sameChartFullTensor.components[].componentId",
        "sameChartFullTensor.components[].status",
        "sameChartFullTensor.completeness.fullTensorComplete",
        "sameChartFullTensor.completeness.missingComponentIds",
      ]),
    );
    expect(sameChartTensor?.scalarCuts).toEqual([]);
    expect(sameChartTensor?.requiredEvidence).toEqual(
      expect.arrayContaining(["same_chart_full_tensor_artifact", "adm_projection_state"]),
    );
    expect(sourceAuthority?.artifactFields).toEqual(
      expect.arrayContaining([
        "nhm2SourceSideSameBasisTensorAuthority.summary.hasWallAuthority",
        "nhm2SourceSideSameBasisTensorAuthority.summary.allRequiredRegionsAuthoritative",
        "nhm2SourceSideSameBasisTensorAuthority.regions[].status",
        "nhm2WallSourceClosure.available.sourceAuthorityStatus",
      ]),
    );
    expect(sourceAuthority?.scalarCuts).toEqual([]);
    expect(sourceAuthority?.requiredEvidence).toEqual(
      expect.arrayContaining([
        "source_side_same_basis_tensor_authority_artifact",
        "tile_effective_counterpart_artifact",
      ]),
    );
  });

  it("maps observer-robust energy and Natario invariant gates without scalar cuts", () => {
    const observerRobust = getNhm2RuntimeFieldBinding("nhm2.energy_condition.observer_robust_gate");
    const natarioAudit = getNhm2RuntimeFieldBinding("nhm2.natario.invariant_audit");

    expect(observerRobust?.scalarCuts).toEqual([]);
    expect(observerRobust?.artifactFields).toEqual(
      expect.arrayContaining([
        "nhm2ObserverRobustEnergyConditions.summary.eulerianOnly",
        "nhm2ObserverRobustEnergyConditions.summary.robustCheckComplete",
        "nhm2ObserverRobustEnergyConditions.summary.anyViolation",
      ]),
    );
    expect(observerRobust?.requiredEvidence).toEqual(
      expect.arrayContaining(["observer_robust_energy_conditions_artifact", "same_chart_full_tensor_artifact"]),
    );
    expect(natarioAudit?.scalarCuts).toEqual([]);
    expect(natarioAudit?.artifactFields).toEqual(
      expect.arrayContaining([
        "nhm2NatarioInvariantAudit.expansion.thetaFlatnessStatus",
        "nhm2NatarioInvariantAudit.invariants.status",
        "nhm2NatarioInvariantAudit.stability.convergenceStatus",
      ]),
    );
    expect(natarioAudit?.requiredEvidence).toEqual(
      expect.arrayContaining(["natario_invariant_audit_artifact", "stability_diagnostic_report"]),
    );
  });

  it("finds every binding involved in a runtime gate", () => {
    const sourceClosureBindings = findNhm2RuntimeFieldBindingsForGate("source_closure");
    const badgeIds = sourceClosureBindings.map((binding) => binding.badgeId);

    expect(badgeIds).toEqual(
      expect.arrayContaining([
        "physics.gr.stress_energy_conservation",
        "nhm2.source.energy_density_proxy",
        "nhm2.closure.wall_t00_source_residual",
        "nhm2.closure.source_residual",
        "nhm2.source.same_basis_tensor_authority",
        "nhm2.energy_condition.diagnostic_gate",
      ]),
    );
  });

  it("keeps every runtime-bound NHM2 binding claim-bounded", () => {
    const unbounded = NHM2_RUNTIME_FIELD_BINDINGS.filter(
      (binding) =>
        binding.kind !== "model_relation" &&
        (binding.claimBoundaryNotes.length === 0 || binding.requiredEvidence.length === 0),
    );

    expect(unbounded).toEqual([]);
  });

  it("adds runtime-bound field metadata to compound theory runs", () => {
    const run = buildTheoryCompoundRun({
      graph: buildNhm2TheoryBadgeGraphV1(),
      badgeIds: ["nhm2.closure.source_residual"],
      mode: "selected_badges",
      includeScalar: true,
      includeRuntime: true,
      includeEvidence: true,
      includeBoundaries: true,
      generatedAt: "2026-05-30T00:00:00.000Z",
    });
    const sourceRow = run.rows.find((row) => row.badgeId === "nhm2.closure.source_residual");

    expect(isTheoryCompoundRunV1(run)).toBe(true);
    expect(sourceRow?.warnings.join(" ")).toMatch(/Runtime-bound badge/i);
    expect(sourceRow?.evidenceRefs?.some((ref) => ref.kind === "runtime_field_map")).toBe(true);
    expect(sourceRow?.evidenceRefs?.some((ref) => ref.kind === "runtime_gate" && ref.id === "source_closure")).toBe(
      true,
    );
    expect(
      sourceRow?.evidenceRefs?.some(
        (ref) => ref.kind === "required_evidence" && ref.id === "source_closure_artifact",
      ),
    ).toBe(true);
    expect(sourceRow?.claimBoundaryNotes.join(" ")).toMatch(/runtime-bound closure evidence/i);
  });
});
