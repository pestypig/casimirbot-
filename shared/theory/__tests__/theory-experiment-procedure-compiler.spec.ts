import { describe, expect, it } from "vitest";

import {
  validateTheoryExperimentProcedureV1,
  type TheoryExperimentEvidenceBindingV1,
} from "../../contracts/theory-experiment-procedure.v1";
import { buildNhm2TheoryBadgeGraphV1 } from "../nhm2-theory-badges";
import { buildTheoryContextReflection } from "../theory-context-reflector";
import {
  compileTheoryExperimentProcedureV1,
  TheoryExperimentProcedureCompileError,
} from "../theory-experiment-procedure-compiler";

const BADGE_ID = "study.casimir_dp.evidence_map_stage3";

const binding = (
  kind: TheoryExperimentEvidenceBindingV1["kind"],
  artifactRef: string,
): TheoryExperimentEvidenceBindingV1 => ({
  artifactRef,
  kind,
  schema: `test.${kind}.v1`,
  sourceTurnId: "ask:test:source",
  admissionTurnId: "ask:test:procedure",
  contentSha256: "a".repeat(64),
  admission: "retained_and_readmitted",
  authority: "evidence_only",
  assistantAnswer: false,
  terminalEligible: false,
});

describe("theory experiment procedure compiler", () => {
  it("keeps dependency order separate from scale checkpoints", async () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const reflection = buildTheoryContextReflection({
      graph,
      prompt: "Explain the Stage 3 evidence map from first principles.",
      mentionedDomains: [BADGE_ID],
      generatedAt: "2026-07-25T00:00:00.000Z",
      reflectionId: "reflection:test:procedure",
    });
    const procedure = await compileTheoryExperimentProcedureV1({
      graph,
      turnId: "ask:test:procedure",
      procedureId: "procedure:test:dependency-order",
      generatedAt: "2026-07-25T00:00:00.000Z",
      reflection,
      request: {
        operation: "explain",
        target: "Stage 3 evidence map",
        targetObservable: null,
        scaleLog10M: null,
        coordinateFrame: null,
        initialBoundaryConditions: [],
        formalSystem: null,
        requestedPrecision: null,
        evidenceMaturityCeiling: "diagnostic",
        normalizationStatus: "explicit",
      },
      selectedBadgeIds: [BADGE_ID],
      evidenceBindings: [
        binding("research_paper_sidecar", "paper-sidecar:test"),
      ],
    });

    expect(validateTheoryExperimentProcedureV1(procedure)).toEqual([]);
    expect(procedure.stages).toHaveLength(7);
    expect(procedure.dependencyOrder).toMatchObject({
      source: "theory_derivation_program/v1",
      physicalScaleDefinesOrder: false,
    });
    expect(
      procedure.scaleCheckpoints.every(
        (checkpoint) =>
          checkpoint.orderAuthority === "dependency_dag" &&
          checkpoint.interpretation ===
            "scale_checkpoint_not_execution_order",
      ),
    ).toBe(true);
    expect(procedure.authority).toMatchObject({
      executorOwner: "agent_runtime",
      preparesProcedureOnly: true,
      executesTools: false,
      terminalEligible: false,
    });
  });

  it("exposes an eligible pinned Lanyon candidate only after semantic identity and explicit PDE bindings", async () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const reflection = buildTheoryContextReflection({
      graph,
      prompt:
        "Compare the selected diagnostic badge with a one-dimensional advection diffusion candidate.",
      mentionedDomains: [BADGE_ID],
      generatedAt: "2026-07-25T00:00:00.000Z",
      reflectionId: "reflection:test:lanyon",
    });
    const procedure = await compileTheoryExperimentProcedureV1({
      graph,
      turnId: "ask:test:procedure",
      procedureId: "procedure:test:lanyon",
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
      evidenceBindings: [
        binding("semantic_admission", "semantic-admission:test"),
      ],
      lanyon: {
        requested: true,
        caseId: "advection_diffusion_full_1d",
      },
    });

    expect(procedure.lanyonEligibility).toMatchObject({
      status: "eligible",
      requestedCaseId: "advection_diffusion_full_1d",
      dimensions: 1,
      caseKind: "advection_diffusion_full",
      semanticIdentityBound: true,
      blockers: [],
      authority: {
        trustsProducerOutput: false,
        validatesTheory: false,
        validatesGeneratedCode: false,
        validatesNumericalImplementation: false,
      },
    });
    expect(
      procedure.capabilityAffordances.find(
        (entry) =>
          entry.capabilityId ===
          "theory-artifact-producer.prepare_lanyon_request",
      ),
    ).toMatchObject({
      status: "admitted",
      executesAutomatically: false,
    });
    expect(procedure.capabilityAffordances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          capabilityId: "theory-semantic-admitter.normalize",
          status: "not_applicable",
          executesAutomatically: false,
        }),
        expect.objectContaining({
          capabilityId:
            "theory-artifact-producer.admit_lanyon_snapshot",
          status: "conditional",
          requiredInputKeys: [
            "request_artifact_ref",
            "case_id",
          ],
          executesAutomatically: false,
        }),
        expect.objectContaining({
          capabilityId: "theory-formal-verifier.prepare_request",
          status: "conditional",
          requiresConfirmation: false,
          requiredInputKeys: expect.arrayContaining([
            "procedure_id",
            "procedure_sha256",
            "semantic_admission_artifact_ref",
            "artifact_generation_artifact_ref",
            "formal_source_admission_artifact_ref",
          ]),
          producesEvidenceKind: null,
          executesAutomatically: false,
        }),
        expect.objectContaining({
          capabilityId: "theory-formal-verifier.plan",
          status: "conditional",
          requiresConfirmation: false,
          requiredInputKeys: ["prepared_request_id"],
          producesEvidenceKind: null,
          executesAutomatically: false,
        }),
        expect.objectContaining({
          capabilityId: "theory-formal-verifier.start",
          status: "conditional",
          requiresConfirmation: true,
          requiredInputKeys: [
            "prepared_request_id",
            "plan_id",
          ],
          executesAutomatically: false,
        }),
        expect.objectContaining({
          capabilityId: "theory-formal-verifier.read_result",
          status: "conditional",
          requiresConfirmation: false,
          requiredInputKeys: ["job_id"],
          producesEvidenceKind: "formal_certificate",
          executesAutomatically: false,
        }),
        expect.objectContaining({
          capabilityId:
            "theory-independent-numerical-verifier.prepare_request",
          status: "conditional",
          requiresConfirmation: false,
          requiredInputKeys: [
            "catalog_entry_id",
            "procedure_id",
            "procedure_sha256",
          ],
          producesEvidenceKind: null,
          executesAutomatically: false,
        }),
        expect.objectContaining({
          capabilityId: "theory-independent-numerical-verifier.plan",
          status: "conditional",
          requiresConfirmation: false,
          requiredInputKeys: ["prepared_request_id"],
          producesEvidenceKind: null,
          executesAutomatically: false,
        }),
        expect.objectContaining({
          capabilityId: "theory-independent-numerical-verifier.start",
          status: "conditional",
          requiresConfirmation: true,
          requiredInputKeys: ["plan_id"],
          executesAutomatically: false,
        }),
        expect.objectContaining({
          capabilityId:
            "theory-independent-numerical-verifier.read_result",
          status: "conditional",
          requiresConfirmation: false,
          requiredInputKeys: ["job_id"],
          producesEvidenceKind: "numerical_certificate",
          executesAutomatically: false,
        }),
      ]),
    );
    const formalPlan = procedure.capabilityAffordances.find(
      (entry) =>
        entry.capabilityId === "theory-formal-verifier.plan",
    );
    expect(formalPlan?.status).not.toBe("admitted");
    expect(formalPlan?.requiredInputKeys).not.toEqual(
      expect.arrayContaining([
        "request",
        "policy",
        "theorem_source_path",
        "import_source_paths",
      ]),
    );
  });

  it("preserves unsupported Lanyon and formal-system limits as typed blockers", async () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const reflection = buildTheoryContextReflection({
      graph,
      prompt: "Prove the selected theory with a future solver.",
      mentionedDomains: [BADGE_ID],
      generatedAt: "2026-07-25T00:00:00.000Z",
      reflectionId: "reflection:test:blocked",
    });
    const procedure = await compileTheoryExperimentProcedureV1({
      graph,
      turnId: "ask:test:procedure",
      generatedAt: "2026-07-25T00:00:00.000Z",
      reflection,
      request: {
        operation: "prove",
        target: "unsupported PDE",
        targetObservable: null,
        scaleLog10M: null,
        coordinateFrame: null,
        initialBoundaryConditions: [],
        formalSystem: null,
        requestedPrecision: null,
        evidenceMaturityCeiling: "diagnostic",
        normalizationStatus: "explicit",
      },
      selectedBadgeIds: [BADGE_ID],
      lanyon: {
        requested: true,
        caseId: "not_a_pinned_case",
      },
    });

    expect(procedure.lanyonEligibility.status).toBe("ineligible");
    expect(procedure.lanyonEligibility.blockers).toEqual(
      expect.arrayContaining([
        "unsupported_lanyon_case",
        "semantic_admission_required",
        "target_observable_required",
        "coordinate_frame_required",
        "initial_boundary_conditions_required",
      ]),
    );
    expect(procedure.incompletenessBoundary).toMatchObject({
      formalStatus: "formal_system_required",
      outOfGraphMassPreserved: true,
      missingRelationsRemainOpenWorld: true,
      noIndependenceClaimWithoutCertificate: true,
    });
  });

  it("rejects selected and comparison badge overlap before compilation", async () => {
    const graph = buildNhm2TheoryBadgeGraphV1();
    const reflection = buildTheoryContextReflection({
      graph,
      prompt: "Compare the Stage 3 evidence map without duplicating roles.",
      mentionedDomains: [BADGE_ID],
      generatedAt: "2026-07-25T00:00:00.000Z",
      reflectionId: "reflection:test:overlapping-badge-roles",
    });

    await expect(
      compileTheoryExperimentProcedureV1({
        graph,
        turnId: "ask:test:procedure-overlap",
        generatedAt: "2026-07-25T00:00:00.000Z",
        reflection,
        request: {
          operation: "compare",
          target: "Stage 3 evidence map",
          targetObservable: null,
          scaleLog10M: null,
          coordinateFrame: null,
          initialBoundaryConditions: [],
          formalSystem: null,
          requestedPrecision: null,
          evidenceMaturityCeiling: "diagnostic",
          normalizationStatus: "explicit",
        },
        selectedBadgeIds: [BADGE_ID],
        comparisonBadgeIds: [BADGE_ID],
      }),
    ).rejects.toMatchObject<TheoryExperimentProcedureCompileError>({
      name: "TheoryExperimentProcedureCompileError",
      code: "selected_comparison_badge_id_overlap",
      overlappingBadgeIds: [BADGE_ID],
    });
  });
});
