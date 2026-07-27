import { describe, expect, it } from "vitest";

import { computeCasimirSpecValueSha256V1 } from "../../contracts/casimir-spec-scientific-claim-ir.v1";
import {
  validateTheoryExperimentProcedureV1,
  type TheoryExperimentEvidenceBindingV1,
  type TheoryExperimentEvidenceLineageV1,
} from "../../contracts/theory-experiment-procedure.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryContextReflection } from "../theory-context-reflector";
import { compileTheoryExperimentProcedureV1 } from "../theory-experiment-procedure-compiler";

const TURN_ID = "ask:test:procedure-continuation";
const BADGE_ID = "study.casimir_dp.evidence_map_stage3";
const SHA_A = "a".repeat(64);
const SHA_B = "b".repeat(64);
const SHA_C = "c".repeat(64);
const SHA_D = "d".repeat(64);

const binding = (
  kind: TheoryExperimentEvidenceBindingV1["kind"],
  artifactRef: string,
  lineage?: TheoryExperimentEvidenceLineageV1,
): TheoryExperimentEvidenceBindingV1 => ({
  artifactRef,
  kind,
  schema: `test.${kind}.v1`,
  sourceTurnId: TURN_ID,
  admissionTurnId: TURN_ID,
  contentSha256: artifactRef
    .charCodeAt(0)
    .toString(16)
    .padStart(2, "0")
    .repeat(32),
  admission: "current_turn_admitted",
  ...(lineage ? { lineage } : {}),
  authority: "evidence_only",
  assistantAnswer: false,
  terminalEligible: false,
});

describe("theory experiment procedure continuation contract", () => {
  it("advances only as distinct source, artifact, formal, numerical, and empirical evidence re-enters", async () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const reflection = buildTheoryContextReflection({
      graph,
      prompt:
        "Compare the Stage 3 evidence map with the pinned one-dimensional advection-diffusion case.",
      mentionedDomains: [BADGE_ID],
      generatedAt: "2026-07-25T00:00:00.000Z",
      reflectionId: "reflection:test:procedure-continuation",
    });
    const compile = (evidenceBindings: TheoryExperimentEvidenceBindingV1[]) =>
      compileTheoryExperimentProcedureV1({
        graph,
        turnId: TURN_ID,
        procedureId: "procedure:test:continuation",
        generatedAt: "2026-07-25T00:00:00.000Z",
        reflection,
        request: {
          operation: "compare",
          target: "one-dimensional periodic advection diffusion",
          targetObservable: "concentration_field",
          scaleLog10M: { min: -3, max: 0 },
          coordinateFrame: "laboratory",
          initialBoundaryConditions: [
            "periodic domain",
            "sinusoidal initial concentration",
          ],
          formalSystem: "Lean 4",
          requestedPrecision: "1e-3",
          evidenceMaturityCeiling: "diagnostic",
          normalizationStatus: "explicit",
        },
        selectedBadgeIds: [BADGE_ID],
        evidenceBindings,
        lanyon: {
          requested: true,
          caseId: "advection_diffusion_full_1d",
        },
      });

    const procedureSkeleton = await compile([]);
    const [masterProblemArtifactSha256, derivationProgramArtifactSha256] =
      await Promise.all([
        computeCasimirSpecValueSha256V1(procedureSkeleton.masterProblem),
        computeCasimirSpecValueSha256V1(procedureSkeleton.derivationProgram),
      ]);
    const lineage = (
      sourceKind: TheoryExperimentEvidenceLineageV1["sourceKind"],
    ): TheoryExperimentEvidenceLineageV1 => {
      const bindsFormalProgram =
        sourceKind === "artifact_generation_request" ||
        sourceKind === "formal_verification_request";
      const bindsVerifierRequest =
        sourceKind !== "semantic_claim_ir" &&
        sourceKind !== "empirical_observation";
      return {
        sourceKind,
        procedureId: procedureSkeleton.procedureId,
        candidateBadgeIds: [BADGE_ID],
        casimirSpecId: "casimir-spec:test:procedure-continuation",
        casimirSpecSemanticSha256: SHA_A,
        casimirSpecArtifactSha256: SHA_B,
        claims: [
          {
            claimId: "claim:test:concentration-field",
            propositionSha256: SHA_C,
            observableIds: ["concentration_field"],
          },
        ],
        sourceGraphId:
          sourceKind === "formal_verification_request" ? graph.graphId : null,
        sourceGraphSnapshotSha256:
          sourceKind === "formal_verification_request" ? SHA_D : null,
        sourceMasterProblemPlanId: bindsFormalProgram
          ? procedureSkeleton.masterProblem.planId
          : null,
        sourceMasterProblemArtifactSha256: bindsFormalProgram
          ? masterProblemArtifactSha256
          : null,
        sourceDerivationProgramId: bindsFormalProgram
          ? procedureSkeleton.derivationProgram.programId
          : null,
        sourceDerivationProgramArtifactSha256: bindsFormalProgram
          ? derivationProgramArtifactSha256
          : null,
        requestArtifactSha256: bindsVerifierRequest ? SHA_D : null,
        frozenCase:
          sourceKind === "numerical_verification_request"
            ? {
                caseId: "advection_diffusion_full_1d",
                inputsSha256: SHA_A,
                meshSha256: SHA_B,
                initialConditionsSha256: SHA_C,
                boundaryConditionsSha256: SHA_D,
                observableIds: ["concentration_field"],
              }
            : null,
      };
    };

    const semantic = binding(
      "semantic_admission",
      "semantic-admission:continuation",
      lineage("semantic_claim_ir"),
    );
    const semanticOnly = await compile([semantic]);
    expect(validateTheoryExperimentProcedureV1(semanticOnly)).toEqual([]);
    expect(semanticOnly.missingRequirements.map((entry) => entry.code)).toEqual(
      expect.arrayContaining([
        "artifact_generation_receipt_required",
        "formal_certificate_required",
        "independent_numerical_certificate_required",
        "empirical_observation_required",
      ]),
    );
    expect(semanticOnly.capabilityAffordances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          capabilityId: "docs.search",
          status: "admitted",
          executesAutomatically: false,
        }),
        expect.objectContaining({
          capabilityId: "scholarly-research.lookup_papers",
          status: "conditional",
          executesAutomatically: false,
        }),
        expect.objectContaining({
          capabilityId: "theory-artifact-producer.prepare_lanyon_request",
          status: "admitted",
          executesAutomatically: false,
        }),
        expect.objectContaining({
          capabilityId: "theory-artifact-producer.admit_lanyon_snapshot",
          status: "conditional",
          executesAutomatically: false,
        }),
      ]),
    );

    const source = binding(
      "research_paper_sidecar",
      "research-sidecar:continuation",
    );
    const artifact = binding(
      "artifact_generation_receipt",
      "artifact-receipt:continuation",
      lineage("artifact_generation_request"),
    );
    const artifactAdmitted = await compile([source, semantic, artifact]);
    expect(validateTheoryExperimentProcedureV1(artifactAdmitted)).toEqual([]);
    expect(artifactAdmitted.capabilityAffordances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          capabilityId: "docs.search",
          status: "not_applicable",
        }),
        expect.objectContaining({
          capabilityId: "theory-artifact-producer.prepare_lanyon_request",
          status: "not_applicable",
        }),
        expect.objectContaining({
          capabilityId: "theory-artifact-producer.admit_lanyon_snapshot",
          status: "not_applicable",
        }),
        expect.objectContaining({
          capabilityId: "theory-formal-verifier.prepare_request",
          status: "admitted",
        }),
        expect.objectContaining({
          capabilityId: "theory-independent-numerical-verifier.prepare_request",
          status: "admitted",
        }),
        expect.objectContaining({
          capabilityId: "theory-independent-numerical-verifier.plan",
          status: "conditional",
        }),
      ]),
    );

    const formal = binding(
      "formal_certificate",
      "formal-certificate:continuation",
      lineage("formal_verification_request"),
    );
    const formallyClosed = await compile([source, semantic, artifact, formal]);
    expect(
      formallyClosed.missingRequirements.map((entry) => entry.code),
    ).not.toContain("formal_certificate_required");
    for (const capabilityId of [
      "theory-formal-verifier.plan",
      "theory-formal-verifier.start",
      "theory-formal-verifier.read_result",
    ]) {
      expect(
        formallyClosed.capabilityAffordances.find(
          (entry) => entry.capabilityId === capabilityId,
        )?.status,
      ).toBe("not_applicable");
    }

    const numerical = binding(
      "numerical_certificate",
      "numerical-certificate:continuation",
      lineage("numerical_verification_request"),
    );
    const numericallyClosed = await compile([
      source,
      semantic,
      artifact,
      formal,
      numerical,
    ]);
    expect(
      numericallyClosed.missingRequirements.map((entry) => entry.code),
    ).not.toContain("independent_numerical_certificate_required");
    expect(
      numericallyClosed.stages.find(
        (stage) => stage.id === "numerical_and_observational_closure",
      ),
    ).toMatchObject({
      status: "blocked",
      missingRequirementCodes: ["empirical_observation_required"],
    });

    const empirical = binding(
      "empirical_observation",
      "empirical-observation:continuation",
      lineage("empirical_observation"),
    );
    const closure = await compile([
      source,
      semantic,
      artifact,
      formal,
      numerical,
      empirical,
    ]);
    expect(validateTheoryExperimentProcedureV1(closure)).toEqual([]);
    expect(closure.missingRequirements.map((entry) => entry.code)).not.toEqual(
      expect.arrayContaining([
        "artifact_generation_receipt_required",
        "formal_certificate_required",
        "independent_numerical_certificate_required",
        "empirical_observation_required",
      ]),
    );
    expect(
      closure.stages.find((stage) => stage.id === "artifact_and_formal_closure")
        ?.status,
    ).toBe("complete");
    expect(
      closure.stages.find(
        (stage) => stage.id === "numerical_and_observational_closure",
      )?.status,
    ).toBe("complete");
    expect(
      closure.stages.find(
        (stage) => stage.id === "evidence_reentry_and_synthesis",
      )?.status,
    ).toBe("ready");
    expect(closure.readiness.terminalSynthesisAllowed).toBe(false);
    expect(closure.authority).toMatchObject({
      preparesProcedureOnly: true,
      executesTools: false,
      terminalEligible: false,
    });
  });
});
