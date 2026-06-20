import { describe, expect, it } from "vitest";
import { buildHelixTheoryBadgeGraphV1 } from "../helix-theory-badge-graph";
import {
  buildTheoryBadgeCoordinateVectors,
  traceTheoryFrontierVectorField,
} from "../theory-frontier-vector-field";
import {
  isTheoryFrontierVectorFieldTraceV1,
  validateTheoryFrontierVectorFieldTraceV1,
} from "../../contracts/theory-frontier-vector-field.v1";

describe("theory frontier vector field", () => {
  it("builds deterministic badge coordinate vectors over mathematical axes", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const first = buildTheoryBadgeCoordinateVectors({ graph });
    const second = buildTheoryBadgeCoordinateVectors({ graph });

    expect(first).toEqual(second);
    expect(first.length).toBe(graph.badges.length);
    expect(first.every((vector) => vector.scaleEnvelopeLog10M.basis.length > 0)).toBe(true);
    expect(first.every((vector) => Array.isArray(vector.unitDimensionSignatures))).toBe(true);
    expect(first.every((vector) => Array.isArray(vector.equationFamilyCoordinates))).toBe(true);
    expect(first.every((vector) => Array.isArray(vector.domainCoordinates))).toBe(true);
    expect(first.every((vector) => typeof vector.fidelityCoordinate === "string")).toBe(true);
    expect(first.every((vector) => vector.claimPressureCoordinate >= 0 && vector.claimPressureCoordinate <= 1)).toBe(true);
    expect(first.every((vector) => vector.evidenceDensityCoordinate >= 0 && vector.evidenceDensityCoordinate <= 1)).toBe(true);
    expect(first.every((vector) => vector.entropyContributionBits >= 0)).toBe(true);
    expect(
      first.every((vector) =>
        vector.uncertaintyBudget.includes("entropy is placement and boundary uncertainty, not theory truth probability"),
      ),
    ).toBe(true);
  });

  it("traces relation tensors without granting validation or promotion authority", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const trace = traceTheoryFrontierVectorField({
      graph,
      query: "Einstein tensor source residual QEI margin",
      searchSeed: "vector-field-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 6,
    });
    const replay = traceTheoryFrontierVectorField({
      graph,
      query: "Einstein tensor source residual QEI margin",
      searchSeed: "vector-field-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 6,
    });

    expect(trace).toEqual(replay);
    expect(validateTheoryFrontierVectorFieldTraceV1(trace)).toEqual([]);
    expect(isTheoryFrontierVectorFieldTraceV1(trace)).toBe(true);
    expect(trace.vectors.length).toBe(graph.badges.length);
    expect(trace.candidateTraces.length).toBeGreaterThan(0);
    expect(trace.relationTensors.length).toBe(trace.candidateTraces.length);
    expect(trace.candidateTraces.every((candidate) => candidate.relationTensorIds.length > 0)).toBe(true);
    expect(trace.candidateTraces.every((candidate) => candidate.exactVerificationRequirements.length >= 8)).toBe(true);
    expect(trace.candidateTraces.every((candidate) => candidate.placementDiagnostic.fitScore >= 0)).toBe(true);
    expect(trace.candidateTraces.every((candidate) => candidate.placementDiagnostic.fitScore <= 1)).toBe(true);
    expect(trace.candidateTraces.every((candidate) => candidate.placementDiagnostic.blockingSignals.length > 0)).toBe(true);
    expect(trace.traceDiagnostics.strongestCandidateId).toEqual(expect.any(String));
    expect(trace.traceDiagnostics.weakestCandidateId).toEqual(expect.any(String));
    expect(trace.traceDiagnostics.averageFitScore).toBeGreaterThanOrEqual(0);
    expect(trace.traceDiagnostics.averageLocalCongruenceScore).toBeGreaterThanOrEqual(0);
    expect(
      Object.values(trace.traceDiagnostics.candidateFitHistogram).reduce((sum, count) => sum + count, 0),
    ).toBe(trace.candidateTraces.length);
    expect(trace.relationTensors.every((tensor) => tensor.axes.length === 8)).toBe(true);
    expect(
      trace.relationTensors.every(
        (tensor) =>
          tensor.claimBoundary.validatesTheory === false &&
          tensor.claimBoundary.solvesPhysicalMechanism === false &&
          tensor.claimBoundary.promotionAllowed === false,
      ),
    ).toBe(true);
    expect(trace.interpretation.entropyIsPlacementAndBoundaryUncertaintyOnly).toBe(true);
    expect(trace.interpretation.tensorsAreRelationTransformsOnly).toBe(true);
    expect(trace.interpretation.noTheoryValidation).toBe(true);
    expect(trace.methodAnchors.map((anchor) => anchor.id)).toEqual([
      "shannon_entropy",
      "nist_uncertainty",
      "mit_tensor_gr",
      "gourgoulhon_3p1",
      "rasmussen_williams_gp",
      "perlin_image_synthesizer",
      "cubiomes",
      "minecraft_caves_cliffs_ii",
      "red_blob_terrain_noise",
    ]);
  });

  it("labels weak or missing regions for hard cross-domain target concepts", () => {
    const graph = buildHelixTheoryBadgeGraphV1();
    const trace = traceTheoryFrontierVectorField({
      graph,
      query:
        "Holographic entanglement entropy, Ryu Takayanagi minimal surface, AdS CFT, tensor network error correction, boundary bulk mapping.",
      searchSeed: "vector-field-hard-frontier-seed",
      generatedAt: "2026-06-19T00:00:00.000Z",
      limit: 8,
    });

    expect(validateTheoryFrontierVectorFieldTraceV1(trace)).toEqual([]);
    expect(trace.traceDiagnostics.missingStructureHints).toEqual(
      expect.arrayContaining([
        "add boundary-bulk mapping badge",
        "add entropy-area relation badge",
        "add minimal-surface geometry badge",
      ]),
    );
    expect(
      trace.candidateTraces.some((candidate) =>
        candidate.placementDiagnostic.missingStructureHints.includes("add boundary-bulk mapping badge"),
      ),
    ).toBe(true);
    expect(["weak_cross_domain_fit", "missing_region_suspected", "off_manifold"]).toContain(
      trace.traceDiagnostics.overallFitClass,
    );
  });
});
