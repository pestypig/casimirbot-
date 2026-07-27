import {
  CASIMIR_LANYON_ADVECTION_DIFFUSION_CASES_V1,
  type CasimirLanyonAdvectionDiffusionCaseV1,
} from "../contracts/casimir-lanyon-advection-diffusion-adapter.v1";
import { computeCasimirSpecValueSha256V1 } from "../contracts/casimir-spec-scientific-claim-ir.v1";
import {
  THEORY_EXPERIMENT_BADGE_SET_OVERLAP_CODE,
  THEORY_EXPERIMENT_PROCEDURE_HASH_DOMAIN,
  buildTheoryExperimentProcedureV1,
  type TheoryExperimentCapabilityAffordanceV1,
  type TheoryExperimentEvidenceBindingV1,
  type TheoryExperimentLanyonEligibilityV1,
  type TheoryExperimentMissingRequirementV1,
  type TheoryExperimentProcedureStageV1,
  type TheoryExperimentProcedureV1,
  type TheoryExperimentScaleCheckpointV1,
} from "../contracts/theory-experiment-procedure.v1";
import type {
  TheoryBadgeGraphV1,
  TheoryBadgeScaleEnvelopeV1,
} from "../contracts/theory-badge-graph.v1";
import type { TheoryContextReflectionV1 } from "../contracts/theory-context-reflection.v1";
import type { TheoryMasterProblemRequestV1 } from "../contracts/theory-master-problem.v1";
import { compileTheoryDerivationProgram } from "./theory-derivation-program-compiler";
import { buildTheoryBiomeLayoutV1 } from "./theory-biome-layout";
import { compileTheoryMasterProblem } from "./theory-master-problem-compiler";

export type CompileTheoryExperimentProcedureInput = {
  graph: TheoryBadgeGraphV1;
  turnId: string;
  procedureId?: string;
  generatedAt?: string;
  reflection: TheoryContextReflectionV1;
  request: TheoryMasterProblemRequestV1;
  selectedBadgeIds: string[];
  comparisonBadgeIds?: string[];
  evidenceBindings?: TheoryExperimentEvidenceBindingV1[];
  lanyon?: {
    requested: boolean;
    caseId?: string | null;
  };
};

export class TheoryExperimentProcedureCompileError extends Error {
  readonly code: typeof THEORY_EXPERIMENT_BADGE_SET_OVERLAP_CODE;
  readonly overlappingBadgeIds: string[];

  constructor(overlappingBadgeIds: string[]) {
    super(
      `${THEORY_EXPERIMENT_BADGE_SET_OVERLAP_CODE}: ${overlappingBadgeIds.join(", ")}`,
    );
    this.name = "TheoryExperimentProcedureCompileError";
    this.code = THEORY_EXPERIMENT_BADGE_SET_OVERLAP_CODE;
    this.overlappingBadgeIds = [...overlappingBadgeIds];
  }
}

const unique = (values: string[]): string[] =>
  Array.from(new Set(values.filter(Boolean)));

const evidenceRefsFor = (
  bindings: TheoryExperimentEvidenceBindingV1[],
  kinds: TheoryExperimentEvidenceBindingV1["kind"][],
): string[] =>
  bindings
    .filter((binding) => kinds.includes(binding.kind))
    .map((binding) => binding.artifactRef);

const hasEvidence = (
  bindings: TheoryExperimentEvidenceBindingV1[],
  kind: TheoryExperimentEvidenceBindingV1["kind"],
): boolean => bindings.some((binding) => binding.kind === kind);

const hasRegisteredNumericalBackend = (
  lanyon: TheoryExperimentLanyonEligibilityV1,
): boolean =>
  lanyon.status === "eligible" &&
  lanyon.requestedCaseId === "advection_diffusion_full_1d";

const sourceRefId = (
  ref: TheoryBadgeScaleEnvelopeV1["sourceRefs"][number],
): string => ref.path ?? ref.id ?? "";

function lanyonEligibility(input: {
  requested: boolean;
  requestedCaseId: string | null;
  request: TheoryMasterProblemRequestV1;
  evidenceBindings: TheoryExperimentEvidenceBindingV1[];
}): TheoryExperimentLanyonEligibilityV1 {
  const requestedCase =
    CASIMIR_LANYON_ADVECTION_DIFFUSION_CASES_V1.find(
      (entry) => entry.caseId === input.requestedCaseId,
    ) ?? null;
  const blockers: string[] = [];
  const reasons: string[] = [];
  if (!input.requested) {
    return {
      requested: false,
      status: "not_requested",
      requestedCaseId: null,
      eligibleCaseIds: [],
      dimensions: null,
      caseKind: null,
      semanticIdentityBound: false,
      blockers: [],
      reasons: ["Lanyon was not requested for this procedure."],
      authority: {
        selectsPinnedCandidateOnly: true,
        trustsProducerOutput: false,
        validatesTheory: false,
        validatesGeneratedCode: false,
        validatesNumericalImplementation: false,
      },
    };
  }
  if (!input.requestedCaseId) blockers.push("lanyon_case_id_required");
  if (input.requestedCaseId && !requestedCase) {
    blockers.push("unsupported_lanyon_case");
  }
  const semanticIdentityBound = hasEvidence(
    input.evidenceBindings,
    "semantic_admission",
  );
  if (!semanticIdentityBound) blockers.push("semantic_admission_required");
  if (!input.request.targetObservable)
    blockers.push("target_observable_required");
  if (!input.request.coordinateFrame)
    blockers.push("coordinate_frame_required");
  if (input.request.initialBoundaryConditions.length === 0) {
    blockers.push("initial_boundary_conditions_required");
  }
  if (requestedCase) {
    reasons.push(
      `Selected pinned ${requestedCase.kind} ${requestedCase.dimensions}D candidate ${requestedCase.caseId}.`,
    );
  }
  reasons.push(
    "Final eligibility remains subject to an exact current-turn request prepared by theory-artifact-producer.prepare_lanyon_request and source-packet matching in theory-artifact-producer.admit_lanyon_snapshot.",
  );
  const eligibleCaseIds =
    requestedCase && blockers.length === 0 ? [requestedCase.caseId] : [];
  return {
    requested: true,
    status:
      blockers.length === 0
        ? "eligible"
        : requestedCase
          ? "conditional"
          : "ineligible",
    requestedCaseId: input.requestedCaseId,
    eligibleCaseIds,
    dimensions: requestedCase?.dimensions ?? null,
    caseKind: requestedCase?.kind ?? null,
    semanticIdentityBound,
    blockers,
    reasons,
    authority: {
      selectsPinnedCandidateOnly: true,
      trustsProducerOutput: false,
      validatesTheory: false,
      validatesGeneratedCode: false,
      validatesNumericalImplementation: false,
    },
  };
}

function missingRequirements(input: {
  selectedBadgeIds: string[];
  request: TheoryMasterProblemRequestV1;
  evidenceBindings: TheoryExperimentEvidenceBindingV1[];
  lanyon: TheoryExperimentLanyonEligibilityV1;
  masterStatus: string;
  derivationStatus: string;
}): TheoryExperimentMissingRequirementV1[] {
  const requirements: TheoryExperimentMissingRequirementV1[] = [];
  const add = (
    code: string,
    stageId: TheoryExperimentMissingRequirementV1["stageId"],
    message: string,
    repair: TheoryExperimentMissingRequirementV1["repair"],
    retryable = true,
  ) => requirements.push({ code, stageId, message, repair, retryable });

  if (input.evidenceBindings.length === 0) {
    add(
      "source_evidence_required",
      "question_and_provenance",
      "At least one current-turn admitted or readmitted evidence artifact is required.",
      "retrieve_evidence",
    );
  }
  if (!hasEvidence(input.evidenceBindings, "semantic_admission")) {
    add(
      "semantic_admission_required",
      "semantic_definition",
      "Normalize and admit the canonical Casimir Spec claim IR before provider or verification binding.",
      "retrieve_evidence",
    );
  }
  if (input.selectedBadgeIds.length === 0) {
    add(
      "selected_theory_badges_required",
      "graph_and_scale_localization",
      "Select one or more registered Theory Badge IDs for graph-backed comparison.",
      "select_badges",
    );
  }
  if (
    input.masterStatus === "missing_bridge_relation" ||
    input.derivationStatus === "blocked"
  ) {
    add(
      "registered_bridge_or_derivation_repair_required",
      "congruence_procedure",
      "The selected graph cut lacks an admitted bridge or has a blocked derivation obligation.",
      "register_bridge",
    );
  }
  if (input.request.operation === "prove" && !input.request.formalSystem) {
    add(
      "formal_system_required",
      "artifact_and_formal_closure",
      "Declare the formal system and proof rules before requesting formal replay.",
      "declare_formal_system",
    );
  }
  if (
    input.lanyon.status === "eligible" &&
    !hasEvidence(input.evidenceBindings, "artifact_generation_receipt")
  ) {
    add(
      "artifact_generation_receipt_required",
      "artifact_and_formal_closure",
      "Admit the exact pinned Lanyon snapshot and bind its producer receipt before formal or numerical closure.",
      "retrieve_evidence",
    );
  }
  if (
    (input.request.operation === "prove" ||
      Boolean(input.request.formalSystem)) &&
    !hasEvidence(input.evidenceBindings, "formal_certificate")
  ) {
    add(
      "formal_certificate_required",
      "artifact_and_formal_closure",
      "Plan, explicitly confirm, replay, read, and re-enter the bounded formal certificate.",
      "retrieve_evidence",
    );
  }
  if (
    input.lanyon.status === "eligible" &&
    !hasRegisteredNumericalBackend(input.lanyon)
  ) {
    add(
      "numerical_fixture_unregistered",
      "numerical_and_observational_closure",
      "The pinned Lanyon source case is admissible, but Casimir has no registered independent numerical backend for this case. The current backend is limited to advection_diffusion_full_1d.",
      "choose_supported_case",
    );
  }
  if (
    hasRegisteredNumericalBackend(input.lanyon) &&
    !hasEvidence(input.evidenceBindings, "numerical_certificate")
  ) {
    add(
      "independent_numerical_certificate_required",
      "numerical_and_observational_closure",
      "Plan, explicitly confirm, run, read, and re-enter the independent numerical certificate.",
      "retrieve_evidence",
    );
  }
  if (
    input.request.targetObservable &&
    !hasEvidence(input.evidenceBindings, "empirical_observation")
  ) {
    add(
      "empirical_observation_required",
      "numerical_and_observational_closure",
      "Bind a provenance-checked observation of the declared target observable; source literature or numerical agreement alone is not an empirical measurement.",
      "retrieve_evidence",
    );
  }
  for (const blocker of input.lanyon.blockers) {
    const repair: TheoryExperimentMissingRequirementV1["repair"] =
      blocker === "initial_boundary_conditions_required"
        ? "declare_boundary_conditions"
        : blocker === "target_observable_required" ||
            blocker === "coordinate_frame_required"
          ? "bind_observable"
          : blocker === "unsupported_lanyon_case" ||
              blocker === "lanyon_case_id_required"
            ? "choose_supported_case"
            : "retrieve_evidence";
    add(
      blocker,
      "congruence_procedure",
      `Lanyon compatibility requires repair: ${blocker}.`,
      repair,
    );
  }
  return requirements.filter(
    (entry, index, all) =>
      all.findIndex((candidate) => candidate.code === entry.code) === index,
  );
}

function capabilityAffordances(input: {
  evidenceBindings: TheoryExperimentEvidenceBindingV1[];
  lanyon: TheoryExperimentLanyonEligibilityV1;
  request: TheoryMasterProblemRequestV1;
  selectedBadgeIds: string[];
}): TheoryExperimentCapabilityAffordanceV1[] {
  const refs = input.evidenceBindings.map((binding) => binding.artifactRef);
  const sourceEvidencePresent = input.evidenceBindings.some((binding) =>
    [
      "research_paper_sidecar",
      "scientific_image_sidecar",
      "repo_observation",
    ].includes(binding.kind),
  );
  const formalPreparationInputKeys = [
    "procedure_artifact_ref",
    "procedure_id",
    "procedure_sha256",
    "semantic_admission_artifact_ref",
    "artifact_generation_artifact_ref",
  ];
  const numericalBackendRegistered = hasRegisteredNumericalBackend(
    input.lanyon,
  );
  const affordances: TheoryExperimentCapabilityAffordanceV1[] = [
    {
      capabilityId: "docs.search",
      phase: "retrieve",
      status: sourceEvidencePresent ? "not_applicable" : "admitted",
      requiresConfirmation: false,
      requiredInputKeys: ["query", "paths"],
      dependsOnArtifactRefs: refs,
      producesEvidenceKind: null,
      reason:
        "Local document retrieval can locate a source packet candidate, but its text is not scientific admission until provenance and semantic normalization complete.",
      executesAutomatically: false,
    },
    {
      capabilityId: "scholarly-research.lookup_papers",
      phase: "retrieve",
      status: sourceEvidencePresent ? "not_applicable" : "conditional",
      requiresConfirmation: false,
      requiredInputKeys: ["query"],
      dependsOnArtifactRefs: refs,
      producesEvidenceKind: null,
      reason:
        "Scholarly lookup is conditional on provider availability and returns source candidates, not an empirical observation or scientific conclusion.",
      executesAutomatically: false,
    },
    {
      capabilityId: "helix_ask.reflect_theory_context",
      phase: "reflect",
      status: input.selectedBadgeIds.length > 0 ? "admitted" : "conditional",
      requiresConfirmation: false,
      requiredInputKeys: ["prompt"],
      dependsOnArtifactRefs: refs,
      producesEvidenceKind: "theory_reflection",
      reason:
        "Reflection locates registered badges, open-world uncertainty, claim boundaries, and scale-biome context.",
      executesAutomatically: false,
    },
    {
      capabilityId: "theory-semantic-admitter.normalize",
      phase: "normalize",
      status: hasEvidence(input.evidenceBindings, "semantic_admission")
        ? "not_applicable"
        : "admitted",
      requiresConfirmation: false,
      requiredInputKeys: ["source_packet", "source_path", "receipt_id"],
      dependsOnArtifactRefs: refs,
      producesEvidenceKind: "semantic_admission",
      reason:
        "The canonical scientific-claim IR must be admitted before provider artifacts inherit its identity.",
      executesAutomatically: false,
    },
  ];

  affordances.push({
    capabilityId: "theory-artifact-producer.prepare_lanyon_request",
    phase: "admit_artifact",
    status:
      input.lanyon.status === "eligible"
        ? hasEvidence(input.evidenceBindings, "artifact_generation_receipt")
          ? "not_applicable"
          : "admitted"
        : input.lanyon.status === "conditional"
          ? "conditional"
          : "not_applicable",
    requiresConfirmation: false,
    requiredInputKeys: [
      "procedure_artifact_ref",
      "procedure_id",
      "procedure_sha256",
      "semantic_admission_artifact_ref",
      "case_id",
    ],
    dependsOnArtifactRefs: evidenceRefsFor(input.evidenceBindings, [
      "semantic_admission",
    ]),
    producesEvidenceKind: null,
    reason:
      "This compiles a hash-bound request from exact current-turn procedure and semantic evidence; it does not read or execute Lanyon source.",
    executesAutomatically: false,
  });

  affordances.push({
    capabilityId: "theory-artifact-producer.admit_lanyon_snapshot",
    phase: "admit_artifact",
    status:
      input.lanyon.status === "eligible"
        ? hasEvidence(input.evidenceBindings, "artifact_generation_receipt")
          ? "not_applicable"
          : "conditional"
        : input.lanyon.status === "conditional"
          ? "conditional"
          : "not_applicable",
    requiresConfirmation: false,
    requiredInputKeys: ["request_artifact_ref", "case_id"],
    dependsOnArtifactRefs: evidenceRefsFor(input.evidenceBindings, [
      "semantic_admission",
    ]),
    producesEvidenceKind: "artifact_generation_receipt",
    reason:
      "This consumes the exact prepared request artifact and admits a pinned Lanyon snapshot only; it does not run or trust generated artifacts.",
    executesAutomatically: false,
  });

  const formalApplicable =
    input.request.operation === "prove" ||
    Boolean(input.request.formalSystem) ||
    input.lanyon.status === "eligible";
  affordances.push({
    capabilityId: "theory-formal-verifier.prepare_request",
    phase: "verify_formal",
    status: formalApplicable
      ? hasEvidence(input.evidenceBindings, "formal_certificate")
        ? "not_applicable"
        : input.request.formalSystem &&
            hasEvidence(input.evidenceBindings, "semantic_admission") &&
            hasEvidence(input.evidenceBindings, "artifact_generation_receipt")
          ? "admitted"
          : "conditional"
      : "not_applicable",
    requiresConfirmation: false,
    requiredInputKeys: formalPreparationInputKeys,
    dependsOnArtifactRefs: evidenceRefsFor(input.evidenceBindings, [
      "semantic_admission",
      "artifact_generation_receipt",
    ]),
    producesEvidenceKind: null,
    reason:
      "Formal preparation must bind authoritative semantic and producer evidence to server-owned theorem, graph-snapshot, import-closure, and Lean-environment catalogs before preflight is admissible.",
    executesAutomatically: false,
  });

  affordances.push({
    capabilityId: "theory-formal-verifier.plan",
    phase: "verify_formal",
    status: formalApplicable
      ? hasEvidence(input.evidenceBindings, "formal_certificate")
        ? "not_applicable"
        : "conditional"
      : "not_applicable",
    requiresConfirmation: false,
    requiredInputKeys: ["prepared_request_id"],
    dependsOnArtifactRefs: evidenceRefsFor(input.evidenceBindings, [
      "semantic_admission",
      "artifact_generation_receipt",
    ]),
    producesEvidenceKind: null,
    reason:
      "Formal replay preflight is unavailable until prepare_request returns a ready server-owned receipt; raw requests, policies, and paths are not plan authority.",
    executesAutomatically: false,
  });

  affordances.push({
    capabilityId: "theory-formal-verifier.start",
    phase: "verify_formal",
    status: formalApplicable
      ? hasEvidence(input.evidenceBindings, "formal_certificate")
        ? "not_applicable"
        : "conditional"
      : "not_applicable",
    requiresConfirmation: true,
    requiredInputKeys: ["prepared_request_id", "plan_id"],
    dependsOnArtifactRefs: evidenceRefsFor(input.evidenceBindings, [
      "semantic_admission",
      "artifact_generation_receipt",
    ]),
    producesEvidenceKind: null,
    reason:
      "Starting formal replay remains conditional on an exact preflight plan and runtime confirmation; preparation never starts it.",
    executesAutomatically: false,
  });

  affordances.push({
    capabilityId: "theory-formal-verifier.read_result",
    phase: "verify_formal",
    status: formalApplicable
      ? hasEvidence(input.evidenceBindings, "formal_certificate")
        ? "not_applicable"
        : "conditional"
      : "not_applicable",
    requiresConfirmation: false,
    requiredInputKeys: ["job_id"],
    dependsOnArtifactRefs: evidenceRefsFor(input.evidenceBindings, [
      "semantic_admission",
      "artifact_generation_receipt",
    ]),
    producesEvidenceKind: "formal_certificate",
    reason:
      "Reading or polling a formal replay remains conditional on a developer-scoped job id and returns evidence for model re-entry.",
    executesAutomatically: false,
  });

  affordances.push({
    capabilityId: "theory-independent-numerical-verifier.prepare_request",
    phase: "verify_numerical",
    status: numericalBackendRegistered
      ? hasEvidence(input.evidenceBindings, "numerical_certificate")
        ? "not_applicable"
        : hasEvidence(input.evidenceBindings, "artifact_generation_receipt")
          ? "admitted"
          : "conditional"
      : input.lanyon.status === "eligible"
        ? "blocked"
        : "not_applicable",
    requiresConfirmation: false,
    requiredInputKeys: [
      "catalog_entry_id",
      "procedure_id",
      "procedure_sha256",
    ],
    dependsOnArtifactRefs: evidenceRefsFor(input.evidenceBindings, [
      "artifact_generation_receipt",
      "formal_certificate",
    ]),
    producesEvidenceKind: null,
    reason: numericalBackendRegistered
      ? "A trusted server-owned numerical execution catalog must select and seal the replay policy, implementation identities, and executable paths before preflight."
      : input.lanyon.status === "eligible"
        ? "This Lanyon case has source admission but no registered Casimir independent numerical backend."
        : "Independent numerical replay is not applicable.",
    executesAutomatically: false,
  });

  affordances.push({
    capabilityId: "theory-independent-numerical-verifier.plan",
    phase: "verify_numerical",
    status: numericalBackendRegistered
      ? hasEvidence(input.evidenceBindings, "numerical_certificate")
        ? "not_applicable"
        : hasEvidence(input.evidenceBindings, "artifact_generation_receipt")
          ? "conditional"
          : "conditional"
      : input.lanyon.status === "eligible"
        ? "blocked"
        : "not_applicable",
    requiresConfirmation: false,
    requiredInputKeys: ["prepared_request_id"],
    dependsOnArtifactRefs: evidenceRefsFor(input.evidenceBindings, [
      "artifact_generation_receipt",
      "formal_certificate",
    ]),
    producesEvidenceKind: null,
    reason: numericalBackendRegistered
      ? "Numerical preflight consumes only an owner-bound prepared request issued by the trusted server-owned execution catalog."
      : input.lanyon.status === "eligible"
        ? "This Lanyon case has source admission but no registered Casimir independent numerical backend."
        : "Independent numerical replay is not applicable.",
    executesAutomatically: false,
  });

  const numericalApplicable = numericalBackendRegistered;
  affordances.push({
    capabilityId: "theory-independent-numerical-verifier.start",
    phase: "verify_numerical",
    status: numericalApplicable
      ? hasEvidence(input.evidenceBindings, "numerical_certificate")
        ? "not_applicable"
        : "conditional"
      : input.lanyon.status === "eligible"
        ? "blocked"
        : "not_applicable",
    requiresConfirmation: true,
    requiredInputKeys: ["plan_id"],
    dependsOnArtifactRefs: evidenceRefsFor(input.evidenceBindings, [
      "artifact_generation_receipt",
      "formal_certificate",
    ]),
    producesEvidenceKind: null,
    reason:
      "Starting independent numerical replay remains conditional on an exact preflight plan and runtime confirmation; preparation never starts it.",
    executesAutomatically: false,
  });

  affordances.push({
    capabilityId: "theory-independent-numerical-verifier.read_result",
    phase: "verify_numerical",
    status: numericalApplicable
      ? hasEvidence(input.evidenceBindings, "numerical_certificate")
        ? "not_applicable"
        : "conditional"
      : input.lanyon.status === "eligible"
        ? "blocked"
        : "not_applicable",
    requiresConfirmation: false,
    requiredInputKeys: ["job_id"],
    dependsOnArtifactRefs: evidenceRefsFor(input.evidenceBindings, [
      "artifact_generation_receipt",
      "formal_certificate",
    ]),
    producesEvidenceKind: "numerical_certificate",
    reason:
      "Reading or polling a numerical replay remains conditional on a developer-scoped job id and returns evidence for model re-entry.",
    executesAutomatically: false,
  });

  affordances.push({
    capabilityId: "theory-experiment-procedure.evaluate_closure",
    phase: "synthesize",
    status: "admitted",
    requiresConfirmation: false,
    requiredInputKeys: ["prompt", "procedure_id", "procedure_sha256"],
    dependsOnArtifactRefs: refs,
    producesEvidenceKind: null,
    reason:
      "The read-only closure evaluator reports evidence coverage, candidate ties or preferences, claim ceiling, and open requirements; it does not answer or execute any downstream tool.",
    executesAutomatically: false,
  });

  return affordances;
}

function canonicalStages(input: {
  evidenceBindings: TheoryExperimentEvidenceBindingV1[];
  selectedBadgeIds: string[];
  derivationStatus: string;
  lanyon: TheoryExperimentLanyonEligibilityV1;
  affordances: TheoryExperimentCapabilityAffordanceV1[];
  requirements: TheoryExperimentMissingRequirementV1[];
}): TheoryExperimentProcedureStageV1[] {
  const statusFor = (
    stageId: TheoryExperimentProcedureStageV1["id"],
    complete: boolean,
    applicable = true,
  ): TheoryExperimentProcedureStageV1["status"] => {
    if (!applicable) return "not_applicable";
    if (input.requirements.some((entry) => entry.stageId === stageId)) {
      return "blocked";
    }
    return complete ? "complete" : "ready";
  };
  const build = (
    id: TheoryExperimentProcedureStageV1["id"],
    ordinal: TheoryExperimentProcedureStageV1["ordinal"],
    complete: boolean,
    evidenceKinds: TheoryExperimentEvidenceBindingV1["kind"][],
    applicable = true,
  ): TheoryExperimentProcedureStageV1 => ({
    id,
    ordinal,
    status: statusFor(id, complete, applicable),
    evidenceRefs: evidenceRefsFor(input.evidenceBindings, evidenceKinds),
    missingRequirementCodes: input.requirements
      .filter((entry) => entry.stageId === id)
      .map((entry) => entry.code),
    capabilityIds: input.affordances
      .filter((entry) => {
        const phaseByStage: Record<
          TheoryExperimentProcedureStageV1["id"],
          TheoryExperimentCapabilityAffordanceV1["phase"][]
        > = {
          question_and_provenance: ["retrieve"],
          semantic_definition: ["normalize"],
          graph_and_scale_localization: ["reflect"],
          congruence_procedure: ["reflect", "admit_artifact"],
          artifact_and_formal_closure: ["admit_artifact", "verify_formal"],
          numerical_and_observational_closure: [
            "verify_numerical",
            "observe_empirical",
          ],
          evidence_reentry_and_synthesis: ["synthesize"],
        };
        return phaseByStage[id].includes(entry.phase);
      })
      .map((entry) => entry.capabilityId),
  });
  return [
    build("question_and_provenance", 1, input.evidenceBindings.length > 0, [
      "research_paper_sidecar",
      "scientific_image_sidecar",
      "repo_observation",
    ]),
    build(
      "semantic_definition",
      2,
      hasEvidence(input.evidenceBindings, "semantic_admission"),
      ["semantic_admission"],
    ),
    build(
      "graph_and_scale_localization",
      3,
      input.selectedBadgeIds.length > 0,
      ["theory_reflection"],
    ),
    build("congruence_procedure", 4, input.derivationStatus === "ready", [
      "theory_reflection",
      "semantic_admission",
    ]),
    build(
      "artifact_and_formal_closure",
      5,
      hasEvidence(input.evidenceBindings, "formal_certificate") ||
        (!input.lanyon.requested &&
          !input.affordances.some(
            (entry) =>
              entry.phase === "verify_formal" &&
              entry.status !== "not_applicable",
          )),
      ["artifact_generation_receipt", "formal_certificate"],
    ),
    build(
      "numerical_and_observational_closure",
      6,
      hasEvidence(input.evidenceBindings, "numerical_certificate") ||
        hasEvidence(input.evidenceBindings, "empirical_observation"),
      ["numerical_certificate", "empirical_observation"],
      input.lanyon.requested ||
        hasEvidence(input.evidenceBindings, "empirical_observation"),
    ),
    build("evidence_reentry_and_synthesis", 7, false, [
      "formal_certificate",
      "numerical_certificate",
      "empirical_observation",
    ]),
  ];
}

function dependencyBadgeOrder(input: {
  masterProblem: ReturnType<typeof compileTheoryMasterProblem>;
  derivationProgram: ReturnType<typeof compileTheoryDerivationProgram>;
}): string[] {
  const nodeById = new Map(
    input.masterProblem.nodes.map((node) => [node.id, node]),
  );
  return unique(
    input.derivationProgram.steps.flatMap((step) =>
      step.sourceNodeIds
        .map((nodeId) => nodeById.get(nodeId)?.badgeId ?? "")
        .filter(Boolean),
    ),
  );
}

export async function compileTheoryExperimentProcedureV1(
  input: CompileTheoryExperimentProcedureInput,
): Promise<TheoryExperimentProcedureV1> {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const selectedBadgeIds = unique(input.selectedBadgeIds);
  const comparisonBadgeIds = unique(input.comparisonBadgeIds ?? []);
  const comparisonBadgeIdSet = new Set(comparisonBadgeIds);
  const overlappingBadgeIds = selectedBadgeIds.filter((badgeId) =>
    comparisonBadgeIdSet.has(badgeId),
  );
  if (overlappingBadgeIds.length > 0) {
    throw new TheoryExperimentProcedureCompileError(overlappingBadgeIds);
  }
  const validBadgeIds = new Set(input.graph.badges.map((badge) => badge.id));
  const registeredBadgeIds = selectedBadgeIds.filter((id) =>
    validBadgeIds.has(id),
  );
  const evidenceBindings = input.evidenceBindings ?? [];
  const masterProblem = compileTheoryMasterProblem({
    graph: input.graph,
    badgeIds: registeredBadgeIds,
    comparisonBadgeIds:
      input.request.operation === "compare"
        ? unique([...registeredBadgeIds, ...comparisonBadgeIds]).filter((id) =>
            validBadgeIds.has(id),
          )
        : undefined,
    request: input.request,
    uncertainty: {
      placementEntropyBits:
        input.reflection.overlay.uncertainty?.posteriorEntropyBits ?? 0,
      openWorldEntropyBits:
        input.reflection.overlay.uncertainty?.openWorldEntropyBits ?? 0,
      outOfGraphProbability:
        input.reflection.overlay.uncertainty?.outOfGraphProbability ?? 0,
    },
    generatedAt,
    planId: `${input.procedureId ?? input.turnId}:master-problem`,
  });
  const derivationProgram = compileTheoryDerivationProgram({
    masterProblem,
    generatedAt,
  });
  const lanyon = lanyonEligibility({
    requested: input.lanyon?.requested ?? false,
    requestedCaseId: input.lanyon?.caseId ?? null,
    request: input.request,
    evidenceBindings,
  });
  const requirements = missingRequirements({
    selectedBadgeIds: registeredBadgeIds,
    request: input.request,
    evidenceBindings,
    lanyon,
    masterStatus: masterProblem.compile.status,
    derivationStatus: derivationProgram.status,
  });
  const affordances = capabilityAffordances({
    evidenceBindings,
    lanyon,
    request: input.request,
    selectedBadgeIds: registeredBadgeIds,
  });
  const badgeOrder = dependencyBadgeOrder({
    masterProblem,
    derivationProgram,
  });
  const biomeLayout = buildTheoryBiomeLayoutV1(input.graph);
  const coordinateByBadgeId = new Map(
    biomeLayout.coordinates.map((coordinate) => [
      coordinate.badgeId,
      coordinate,
    ]),
  );
  const badgeById = new Map(
    input.graph.badges.map((badge) => [badge.id, badge]),
  );
  const scaleCheckpoints: TheoryExperimentScaleCheckpointV1[] = badgeOrder
    .map(
      (
        badgeId,
        dependencyOrdinal,
      ): TheoryExperimentScaleCheckpointV1 | null => {
        const badge = badgeById.get(badgeId);
        const coordinate = coordinateByBadgeId.get(badgeId);
        if (!badge || !coordinate) return null;
        const scaleEnvelope = badge.scaleEnvelope ?? coordinate.scaleEnvelope;
        return {
          badgeId,
          scaleBand: coordinate.scaleBand,
          scaleLog10M: coordinate.scaleLog10M,
          scaleEnvelope: {
            minLog10M: scaleEnvelope.minLog10M,
            maxLog10M: scaleEnvelope.maxLog10M,
            characteristicLog10M: scaleEnvelope.characteristicLog10M,
            basis: scaleEnvelope.basis,
          },
          coordinateFrame:
            badge.observables?.find((observable) => observable.coordinateFrame)
              ?.coordinateFrame ??
            input.request.coordinateFrame ??
            null,
          validityDomainRefs: unique([
            ...scaleEnvelope.sourceRefs.map(sourceRefId),
            ...(badge.observables ?? []).map(
              (observable) => observable.operationalDefinitionRef,
            ),
          ]),
          dependencyOrdinal,
          orderAuthority: "dependency_dag" as const,
          interpretation: "scale_checkpoint_not_execution_order" as const,
        };
      },
    )
    .filter(
      (checkpoint): checkpoint is TheoryExperimentScaleCheckpointV1 =>
        checkpoint !== null,
    );
  const nextAdmissibleCapabilityIds = affordances
    .filter((entry) => entry.status === "admitted")
    .map((entry) => entry.capabilityId);
  const readinessStatus: TheoryExperimentProcedureV1["readiness"]["status"] =
    requirements.some((entry) => !entry.retryable) ||
    masterProblem.compile.runtimeAdmission === "blocked"
      ? "blocked"
      : requirements.length > 0
        ? "conditional"
        : "ready_for_agent_runtime";
  const stages = canonicalStages({
    evidenceBindings,
    selectedBadgeIds: registeredBadgeIds,
    derivationStatus: derivationProgram.status,
    lanyon,
    affordances,
    requirements,
  });
  const formalStatus: TheoryExperimentProcedureV1["incompletenessBoundary"]["formalStatus"] =
    input.request.operation === "prove" && !input.request.formalSystem
      ? "formal_system_required"
      : masterProblem.uncertaintyLedger.formalStatus;
  const unsigned = {
    generatedAt,
    procedureId:
      input.procedureId ??
      `theory-experiment-procedure:${input.turnId}:${generatedAt}`,
    turnId: input.turnId,
    graphId: input.graph.graphId,
    request: {
      operation: input.request.operation,
      target: input.request.target,
      targetObservable: input.request.targetObservable,
      selectedBadgeIds: registeredBadgeIds,
      comparisonBadgeIds,
      coordinateFrame: input.request.coordinateFrame,
      scaleLog10M: input.request.scaleLog10M,
      initialBoundaryConditions: input.request.initialBoundaryConditions,
      formalSystem: input.request.formalSystem,
      requestedPrecision: input.request.requestedPrecision,
      evidenceMaturityCeiling: input.request.evidenceMaturityCeiling,
    },
    evidenceBindings,
    reflection: {
      reflectionId: input.reflection.reflectionId,
      representedProbabilityMass:
        input.reflection.overlay.uncertainty?.representedProbabilityMass ?? 0,
      outOfGraphProbability:
        input.reflection.overlay.uncertainty?.outOfGraphProbability ?? 0,
      openWorldEntropyBits:
        input.reflection.overlay.uncertainty?.openWorldEntropyBits ?? 0,
      suggestedBiomeChunkIds:
        input.reflection.overlay.suggestedBiomeChunkIds ?? [],
      suggestedSemanticChunkIds:
        input.reflection.overlay.suggestedSemanticChunkIds ?? [],
      suggestedScaleBands: input.reflection.overlay.suggestedScaleBands ?? [],
      claimBoundaries: input.reflection.evidenceForAsk.claimBoundaries,
    },
    dependencyOrder: {
      source: "theory_derivation_program/v1" as const,
      stepIds: derivationProgram.steps.map((step) => step.id),
      badgeIds: badgeOrder,
      physicalScaleDefinesOrder: false as const,
    },
    scaleCheckpoints,
    masterProblem,
    derivationProgram,
    lanyonEligibility: lanyon,
    capabilityAffordances: affordances,
    missingRequirements: requirements,
    stages,
    readiness: {
      status: readinessStatus,
      nextAdmissibleCapabilityIds,
      terminalSynthesisAllowed: false as const,
      reason:
        readinessStatus === "ready_for_agent_runtime"
          ? "The typed procedure is ready for Codex to choose an admitted next capability."
          : readinessStatus === "conditional"
            ? "The typed procedure preserves repairable missing requirements for Codex continuation."
            : "A hard graph, observable, or derivation boundary blocks execution.",
    },
    incompletenessBoundary: {
      formalSystem: input.request.formalSystem,
      formalStatus,
      outOfGraphMassPreserved: true as const,
      missingRelationsRemainOpenWorld: true as const,
      noIndependenceClaimWithoutCertificate: true as const,
    },
    authority: {
      executorOwner: "agent_runtime" as const,
      preparesProcedureOnly: true as const,
      executesTools: false as const,
      semanticIntentAuthority: false as const,
      proofAuthority: false as const,
      numericalAuthority: false as const,
      empiricalAuthority: false as const,
      physicalTruthAuthority: false as const,
      assistantAnswer: false as const,
      terminalEligible: false as const,
      postToolModelStepRequired: true as const,
    },
  };
  const procedureSha256 = await computeCasimirSpecValueSha256V1({
    domain: THEORY_EXPERIMENT_PROCEDURE_HASH_DOMAIN,
    value: unsigned,
  });
  return buildTheoryExperimentProcedureV1({
    ...unsigned,
    procedureSha256,
  });
}

export function lanyonCaseByIdV1(
  caseId: string,
): CasimirLanyonAdvectionDiffusionCaseV1 | null {
  return (
    CASIMIR_LANYON_ADVECTION_DIFFUSION_CASES_V1.find(
      (entry) => entry.caseId === caseId,
    ) ?? null
  );
}
