import { describe, expect, it } from "vitest";
import {
  HELIX_THEORY_FRONTIER_VECTOR_FIELD_CAPABILITY,
  HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_ARTIFACT_ID,
  HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_SCHEMA_VERSION,
  isHelixTheoryFrontierVectorFieldToolReceiptV1,
  validateHelixTheoryFrontierVectorFieldToolReceiptV1,
} from "../helix-theory-frontier-vector-field-tool-receipt.v1";
import { buildHelixTheoryBadgeGraphV1 } from "../../theory/helix-theory-badge-graph";
import { runHelixTheoryFrontierVectorFieldTool } from "../../theory/theory-frontier-vector-field-tool";

describe("helix theory frontier vector-field tool receipt v1", () => {
  it("builds a valid evidence-only Ask receipt with replayable debug keys", () => {
    const receipt = runHelixTheoryFrontierVectorFieldTool({
      graph: buildHelixTheoryBadgeGraphV1(),
      query: "Trace relation tensors between QEI margins and source residual badges.",
      searchSeed: "seed:test:frontier-vector",
      turnId: "turn:test",
      threadId: "thread:test",
      generatedAt: "2026-06-20T00:00:00.000Z",
    });

    expect(receipt.artifactId).toBe(HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_ARTIFACT_ID);
    expect(receipt.schemaVersion).toBe(HELIX_THEORY_FRONTIER_VECTOR_FIELD_TOOL_RECEIPT_SCHEMA_VERSION);
    expect(receipt.capability).toBe(HELIX_THEORY_FRONTIER_VECTOR_FIELD_CAPABILITY);
    expect(receipt.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(receipt.vectorFieldTrace?.interpretation).toMatchObject({
      entropyIsPlacementAndBoundaryUncertaintyOnly: true,
      tensorsAreRelationTransformsOnly: true,
      noTheoryValidation: true,
      noAutomaticEdgePromotion: true,
    });
    expect(receipt.debugReceipt.replayKeys).toMatchObject({
      graphHash: receipt.debugReceipt.graphHash,
      query: receipt.query,
      searchSeed: "seed:test:frontier-vector",
      basisVersion: receipt.debugReceipt.basisVersion,
      scoringVersion: receipt.debugReceipt.scoringVersion,
    });
    expect(receipt.candidateTraces.length).toBeGreaterThan(0);
    expect(receipt.relationTensors.length).toBeGreaterThan(0);
    expect(receipt.typedFailures).toEqual(expect.arrayContaining(["claim_boundary_blocked", "exact_verification_required"]));
    expect(validateHelixTheoryFrontierVectorFieldToolReceiptV1(receipt)).toEqual([]);
    expect(isHelixTheoryFrontierVectorFieldToolReceiptV1(receipt)).toBe(true);
  });

  it("rejects overclaiming receipt text", () => {
    const receipt = runHelixTheoryFrontierVectorFieldTool({
      graph: buildHelixTheoryBadgeGraphV1(),
      query: "Trace relation tensors between QEI margins and source residual badges.",
      searchSeed: "seed:test:frontier-vector",
      turnId: "turn:test",
      generatedAt: "2026-06-20T00:00:00.000Z",
    });

    const invalid = {
      ...receipt,
      evidenceGaps: ["validates theory"],
    };

    expect(validateHelixTheoryFrontierVectorFieldToolReceiptV1(invalid)).toEqual(
      expect.arrayContaining([expect.stringContaining("forbidden overclaiming text")]),
    );
  });
});
