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
    expect(isNhm2RuntimeBoundBadge("nhm2.qei.sampling_window")).toBe(true);
    expect(isNhm2RuntimeBoundBadge("nhm2.energy_condition.diagnostic_gate")).toBe(true);
  });

  it("finds every binding involved in a runtime gate", () => {
    const sourceClosureBindings = findNhm2RuntimeFieldBindingsForGate("source_closure");
    const badgeIds = sourceClosureBindings.map((binding) => binding.badgeId);

    expect(badgeIds).toEqual(
      expect.arrayContaining([
        "physics.gr.stress_energy_conservation",
        "nhm2.source.energy_density_proxy",
        "nhm2.closure.source_residual",
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
