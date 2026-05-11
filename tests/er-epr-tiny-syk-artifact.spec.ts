import { describe, expect, it } from "vitest";
import { tinySykSolverArtifactSchema } from "../shared/er-epr-tiny-syk-artifact";
import { allErEprTinySykClaimIds, citationsForErEprTinySykClaims, sourceRolesForErEprTinySykClaims, uncertaintyNotesForErEprTinySykClaims } from "../shared/er-epr-tiny-syk-claims";

const baseArtifact = {
  schemaVersion: "er-epr-tiny-syk-artifact.v1",
  runId: "run",
  planId: "plan",
  createdAt: "2026-05-11T00:00:00.000Z",
  backend: "two_sided_syk_tiny_exact_diag",
  numerical: { numericalMethod: "matrix_exponential_taylor", numericalTolerance: 1e-8, dimension: 16, nMajoranasPerSide: 4 },
  hashes: { planHash: "p", hamiltonianHash: "h", rawTelemetryHash: "r", normalizedObservablesHash: "n" },
  outputs: { rawTelemetryRef: "raw.json", normalizedObservablesRef: "norm.json", erEprEvaluationRef: "eval.json" },
  verdict: { solverVerdict: "solver_simulated_model_internal_support" },
  evidence: {
    stage: "ER_EPR_TINY_SYK_EXACT_DIAG_V1",
    claimTier: "Stage1_model_internal_toy_solver",
    claimIds: allErEprTinySykClaimIds(),
    citations: citationsForErEprTinySykClaims(),
    sourceRoles: sourceRolesForErEprTinySykClaims(),
    uncertaintyNotes: uncertaintyNotesForErEprTinySykClaims(),
  },
  qstBoundary: { spacetimeCL: "proxy_only", mayPromoteToCL4: false, caveats: ["model-internal only"] },
};

describe("tiny SYK artifact", () => {
  it("accepts solver-simulated telemetry with hashes", () => {
    expect(tinySykSolverArtifactSchema.parse(baseArtifact).hashes.hamiltonianHash).toBe("h");
  });

  it("rejects missing hashes, claim IDs, citations, and CL promotion", () => {
    expect(() => tinySykSolverArtifactSchema.parse({ ...baseArtifact, hashes: { ...baseArtifact.hashes, hamiltonianHash: "" } })).toThrow();
    expect(() => tinySykSolverArtifactSchema.parse({ ...baseArtifact, evidence: { ...baseArtifact.evidence, claimIds: [] } })).toThrow();
    expect(() => tinySykSolverArtifactSchema.parse({ ...baseArtifact, evidence: { ...baseArtifact.evidence, citations: [] } })).toThrow();
    expect(() => tinySykSolverArtifactSchema.parse({ ...baseArtifact, qstBoundary: { ...baseArtifact.qstBoundary, spacetimeCL: "CL4" } })).toThrow();
  });
});
