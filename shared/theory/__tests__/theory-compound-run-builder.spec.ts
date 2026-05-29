import { describe, expect, it } from "vitest";
import { isTheoryCompoundRunV1 } from "../../contracts/theory-compound-run.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryCompoundRun } from "../theory-compound-run-builder";

const FORBIDDEN_CLAIM_PATTERNS = [
  /validated propulsion/i,
  /working warp drive/i,
  /certified transport solution/i,
  /closed-loop solved transport result/i,
  /physical mechanism confirmed/i,
  /\bQEI passed\b/i,
];

function expectNoForbiddenClaimText(value: unknown): void {
  const serialized = JSON.stringify(value);
  for (const pattern of FORBIDDEN_CLAIM_PATTERNS) {
    expect(serialized).not.toMatch(pattern);
  }
}

describe("buildTheoryCompoundRun", () => {
  const graph = buildNhm2TheoryBadgeGraphV1();

  it("builds a valid scalar row for a Casimir calculator badge without solving it", () => {
    const run = buildTheoryCompoundRun({
      graph,
      badgeIds: ["casimir.cavity.mass_equivalent_proxy"],
      mode: "selected_badges",
      generatedAt: "2026-05-29T00:00:00.000Z",
    });

    expect(isTheoryCompoundRunV1(run)).toBe(true);
    expect(run.rows.some((row) => row.kind === "scalar")).toBe(true);
    expect(run.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          badgeId: "casimir.cavity.mass_equivalent_proxy",
          kind: "scalar",
          status: "pending",
          solver: "scientific_calculator",
          calculatorArtifactV1: null,
        }),
      ]),
    );
  });

  it("builds NHM2 dependency-path rows for tensors, references, gates, and boundaries", () => {
    const run = buildTheoryCompoundRun({
      graph,
      badgeIds: [
        "physics.gr.einstein_field_equation",
        "nhm2.energy_condition.diagnostic_gate",
        "nhm2.claim_boundary.diagnostic_only",
      ],
      mode: "dependency_path",
      generatedAt: "2026-05-29T00:00:00.000Z",
    });

    expect(isTheoryCompoundRunV1(run)).toBe(true);
    expect(run.rows.some((row) => row.kind === "tensor")).toBe(true);
    expect(run.rows.some((row) => row.kind === "reference")).toBe(true);
    expect(run.rows.some((row) => row.kind === "gate")).toBe(true);
    expect(run.rows.some((row) => row.kind === "boundary")).toBe(true);
    expect(run.rows.some((row) => row.runtimeMathTraceV1?.request.family === "gr_tensor")).toBe(true);
    expect(run.rows.find((row) => row.kind === "gate")?.status).toBe("blocked");
    expect(run.rows.find((row) => row.kind === "boundary")?.status).toBe("blocked");
  });

  it("emits stable 1-based row indexes", () => {
    const run = buildTheoryCompoundRun({
      graph,
      badgeIds: ["nhm2.claim_boundary.diagnostic_only"],
      mode: "dependency_path",
    });

    expect(run.rows.map((row) => row.index)).toEqual(run.rows.map((_row, index) => index + 1));
  });

  it("summary counts match rows", () => {
    const run = buildTheoryCompoundRun({
      graph,
      badgeIds: ["nhm2.claim_boundary.diagnostic_only"],
      mode: "dependency_path",
    });

    expect(run.summary.rowCount).toBe(run.rows.length);
    expect(run.summary.scalarCount).toBe(run.rows.filter((row) => row.kind === "scalar").length);
    expect(run.summary.tensorCount).toBe(run.rows.filter((row) => row.kind === "tensor").length);
    expect(run.summary.runtimeCount).toBe(run.rows.filter((row) => row.kind === "runtime").length);
    expect(run.summary.evidenceCount).toBe(run.rows.filter((row) => row.kind === "evidence").length);
    expect(run.summary.gateCount).toBe(run.rows.filter((row) => row.kind === "gate").length);
    expect(run.summary.boundaryCount).toBe(run.rows.filter((row) => row.kind === "boundary").length);
    expect(run.summary.blockedCount).toBe(run.rows.filter((row) => row.status === "blocked").length);
    expect(run.summary.computedCount).toBe(run.rows.filter((row) => row.status === "computed").length);
    expect(run.summary.failedCount).toBe(0);
  });

  it("preserves diagnostic claim boundary notes on rows", () => {
    const run = buildTheoryCompoundRun({
      graph,
      badgeIds: ["nhm2.claim_boundary.diagnostic_only"],
      mode: "selected_badges",
    });

    expect(run.rows.length).toBeGreaterThan(0);
    for (const row of run.rows) {
      expect(row.claimBoundaryNotes).toEqual(expect.arrayContaining(["nhm2.claim_boundary.diagnostic_only: diagnostic-only badge"]));
      expect(row.claimBoundaryNotes).toEqual(expect.arrayContaining(["nhm2.claim_boundary.diagnostic_only: promotion not allowed"]));
    }
  });

  it("keeps NHM2/warp compound runs diagnostic and free of promotion language", () => {
    const run = buildTheoryCompoundRun({
      graph,
      badgeIds: [
        "physics.gr.einstein_field_equation",
        "nhm2.closure.source_residual",
        "nhm2.energy_condition.diagnostic_gate",
        "nhm2.claim_boundary.diagnostic_only",
      ],
      mode: "dependency_path",
      generatedAt: "2026-05-29T00:00:00.000Z",
    });
    const notes = run.rows.flatMap((row) => row.claimBoundaryNotes);

    expect(isTheoryCompoundRunV1(run)).toBe(true);
    expect(notes.some((note) => /diagnostic-only/i.test(note))).toBe(true);
    expect(notes.some((note) => /promotion not allowed/i.test(note))).toBe(true);
    expect(notes.some((note) => /validation claim not allowed/i.test(note))).toBe(true);
    expect(run.rows.some((row) => row.kind === "gate" && row.status === "blocked")).toBe(true);
    expect(run.rows.some((row) => row.kind === "boundary" && row.status === "blocked")).toBe(true);
    expectNoForbiddenClaimText(run);
  });
});
