import { describe, expect, it } from "vitest";

import {
  buildMirekReasoningArtifact,
  type MirekReasoningCanonicalStateV1,
} from "../helix-reasoning-mirek";

const canonical = (
  overrides: Partial<MirekReasoningCanonicalStateV1> = {},
): MirekReasoningCanonicalStateV1 => ({
  contract_version: "reasoning_theater.v1",
  trace_id: "trace:mirek",
  phase: "retrieve",
  archetype: "ambiguity",
  certainty_class: "reasoned",
  suppression_reason: null,
  telemetry: {
    evidence_gate_ok: true,
    coverage_ratio: 0.8,
    evidence_claim_ratio: 0.7,
    belief_unsupported_rate: 0.1,
    belief_contradictions: 0,
    ambiguity_term_count: 1,
    graph_block_ratio: null,
    graph_cross_tree_ratio: null,
    alignment_margin: null,
    alignment_decision: null,
    event_latency_ms_p95: null,
    suppression_active: false,
    proof_verdict: null,
    certificate_integrity_ok: null,
  },
  indices: {
    momentum: 0.68,
    ambiguity_pressure: 0.2,
    battle_index: 0.48,
  },
  stance: "winning",
  scenario_id: "scenario-mirek",
  seed: 12345,
  ts: "2026-05-25T00:00:00.000Z",
  ...overrides,
});

describe("Helix Mirek reasoning artifact", () => {
  it("produces a deterministic final frame hash for the same canonical turn", () => {
    const input = {
      canonicalState: canonical(),
      traceEvents: [{ stage: "Retrieve", detail: "exact", ts: "2026-05-25T00:00:00.000Z" }],
      anchors: [
        {
          id: "evidence:docs/a.md",
          role: "evidence" as const,
          path: "docs/a.md",
          weight: 0.9,
          exact: true,
        },
      ],
      width: 32,
      height: 8,
      ticks: 4,
    };
    const first = buildMirekReasoningArtifact(input);
    const second = buildMirekReasoningArtifact(input);
    expect(second.finalFrameHash).toBe(first.finalFrameHash);
    expect(second.grid.cells).toEqual(first.grid.cells);
  });

  it("does not create evidence cells from non-exact evidence anchors", () => {
    const artifact = buildMirekReasoningArtifact({
      canonicalState: canonical(),
      anchors: [
        {
          id: "evidence:inferred",
          role: "evidence",
          path: "docs/inferred.md",
          weight: 1,
          exact: false,
        },
      ],
      width: 24,
      height: 6,
      ticks: 3,
    });
    expect(artifact.grid.cells.some((cell) => cell.kind === "evidence")).toBe(false);
  });

  it("creates proof cells only when proof passed and certificate integrity is ok", () => {
    const passed = buildMirekReasoningArtifact({
      canonicalState: canonical({
        phase: "verify",
        telemetry: {
          ...canonical().telemetry,
          proof_verdict: "PASS",
          certificate_integrity_ok: true,
        },
      }),
      width: 24,
      height: 6,
      ticks: 2,
    });
    const failedIntegrity = buildMirekReasoningArtifact({
      canonicalState: canonical({
        phase: "verify",
        telemetry: {
          ...canonical().telemetry,
          proof_verdict: "PASS",
          certificate_integrity_ok: false,
        },
      }),
      width: 24,
      height: 6,
      ticks: 2,
    });
    expect(passed.grid.cells.some((cell) => cell.kind === "proof")).toBe(true);
    expect(failedIntegrity.grid.cells.some((cell) => cell.kind === "proof")).toBe(false);
  });

  it("renders fail-closed and contract violations as blocked cells", () => {
    const artifact = buildMirekReasoningArtifact({
      canonicalState: canonical({
        stance: "fail_closed",
        archetype: "missing_evidence",
        suppression_reason: "contract_violation",
        telemetry: {
          ...canonical().telemetry,
          suppression_active: true,
        },
      }),
      width: 24,
      height: 6,
      ticks: 4,
    });
    expect(artifact.grid.cells.some((cell) => cell.kind === "blocked")).toBe(true);
  });

  it("carries over prior context strongly for matching objectives and weakly for pivots", () => {
    const previous = buildMirekReasoningArtifact({
      canonicalState: canonical(),
      objectiveFingerprint: "open docs viewer",
      width: 24,
      height: 6,
      ticks: 2,
    });
    const continued = buildMirekReasoningArtifact({
      canonicalState: canonical({ trace_id: "trace:mirek:continued" }),
      previousArtifact: previous,
      objectiveFingerprint: "open docs viewer",
      previousObjectiveFingerprint: "open docs viewer",
      sharedExactPathRatio: 1,
      capsuleContinuityScore: 1,
      width: 24,
      height: 6,
      ticks: 2,
    });
    const pivot = buildMirekReasoningArtifact({
      canonicalState: canonical({ trace_id: "trace:mirek:pivot" }),
      previousArtifact: previous,
      objectiveFingerprint: "calculate pendulum period",
      previousObjectiveFingerprint: "open docs viewer",
      sharedExactPathRatio: 0,
      capsuleContinuityScore: 0,
      width: 24,
      height: 6,
      ticks: 2,
    });
    expect(continued.continuity.carryoverRatio).toBeGreaterThan(0.9);
    expect(pivot.continuity.carryoverRatio).toBeLessThan(0.2);
    expect(pivot.grid.cells.filter((cell) => cell.kind === "afterglow").length).toBeGreaterThanOrEqual(0);
  });
});
