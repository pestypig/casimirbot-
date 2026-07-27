import { randomUUID } from "node:crypto";

import {
  buildCasimirArtifactGenerationRequestV1,
  validateCasimirArtifactGenerationRequestIntegrityV1,
  type CasimirArtifactGenerationRequestV1,
} from "@shared/contracts/casimir-artifact-generation.v1";
import {
  buildCasimirLanyonAdapterPolicyV1,
  CASIMIR_LANYON_ADAPTER_CONTRACT_ID,
  CASIMIR_LANYON_PRODUCER_ID,
  validateCasimirLanyonAdapterPolicyIntegrityV1,
} from "@shared/contracts/casimir-lanyon-advection-diffusion-adapter.v1";
import {
  computeCasimirSpecValueSha256V1,
  validateCasimirSpecScientificClaimIrIntegrityV1,
  type CasimirSpecScientificClaimIrV1,
} from "@shared/contracts/casimir-spec-scientific-claim-ir.v1";
import {
  THEORY_EXPERIMENT_PROCEDURE_HASH_DOMAIN,
  validateTheoryExperimentProcedureV1,
  type TheoryExperimentProcedureV1,
} from "@shared/contracts/theory-experiment-procedure.v1";
import type { HelixAccountType } from "@shared/helix-account-session";

import { admitCasimirLanyonAdvectionDiffusionSnapshotV1 } from "../../theory/casimir-lanyon-advection-diffusion-adapter";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const THEORY_ARTIFACT_PRODUCER_PREPARE_LANYON_REQUEST_CAPABILITY =
  "theory-artifact-producer.prepare_lanyon_request" as const;
export const THEORY_ARTIFACT_PRODUCER_ADMIT_LANYON_CAPABILITY =
  "theory-artifact-producer.admit_lanyon_snapshot" as const;
export const THEORY_ARTIFACT_PRODUCER_CAPABILITIES = [
  THEORY_ARTIFACT_PRODUCER_PREPARE_LANYON_REQUEST_CAPABILITY,
  THEORY_ARTIFACT_PRODUCER_ADMIT_LANYON_CAPABILITY,
] as const;

const LANYON_REQUEST_OBSERVATION_SCHEMA =
  "casimir.theory_artifact_producer.lanyon_request_observation.v1" as const;
const LANYON_ADMISSION_OBSERVATION_SCHEMA =
  "casimir.theory_artifact_producer.lanyon_admission_observation.v1" as const;
const PROCEDURE_OBSERVATION_SCHEMA =
  "casimir.theory_experiment_procedure.observation.v1" as const;
const SEMANTIC_ADMISSION_OBSERVATION_SCHEMA =
  "casimir.theory_semantic_admitter.observation.v1" as const;
const CURRENT_TURN_ARTIFACT_SCHEMA = "helix.current_turn_artifact.v1" as const;
const SHA256 = /^[a-f0-9]{64}$/;

export const theoryArtifactProducerPrepareLanyonRequestManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id:
      THEORY_ARTIFACT_PRODUCER_PREPARE_LANYON_REQUEST_CAPABILITY,
    label: "Prepare pinned Lanyon request",
    description:
      "Compiles an exact, hash-bound Lanyon artifact-generation request from a current-turn admitted Theory Experiment Procedure and semantic-admission artifact. It selects only a registered pinned case and does not read source bytes, execute code, check Lean or numerics, or establish scientific truth.",
    panel_id: "theory-badge-graph",
    action_id: "prepare_lanyon_request",
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "procedure_artifact_ref",
        "procedure_id",
        "procedure_sha256",
        "semantic_admission_artifact_ref",
        "case_id",
      ],
      properties: {
        procedure_artifact_ref: { type: "string" },
        procedure_id: { type: "string" },
        procedure_sha256: { type: "string" },
        semantic_admission_artifact_ref: { type: "string" },
        case_id: { type: "string" },
        claim_id: { type: "string" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: LANYON_REQUEST_OBSERVATION_SCHEMA,
    observation_schema: LANYON_REQUEST_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_request_preparation",
      "current_turn_evidence_binding",
      "pinned_upstream_policy",
      "artifact_generation_request",
      "non_terminal",
      "no_source_byte_read",
      "no_network_execution",
      "no_shell",
      "no_code_mutation",
      "does_not_validate_scientific_truth",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theoryArtifactProducerAdmitLanyonManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_ARTIFACT_PRODUCER_ADMIT_LANYON_CAPABILITY,
    label: "Admit pinned Lanyon artifacts",
    description:
      "Reads the server-configured exact local checkout of the pinned Lanyon AdvectionDiffusion snapshot, hash-checks and admits all 27 selected source artifacts, and returns a hash-bound generation receipt. The source root is not caller-selectable. It does not clone, execute code, check Lean, validate numerics, or establish scientific truth.",
    panel_id: "theory-badge-graph",
    action_id: "admit_lanyon_snapshot",
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["request_artifact_ref", "case_id"],
      properties: {
        request_artifact_ref: { type: "string" },
        case_id: { type: "string" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: LANYON_ADMISSION_OBSERVATION_SCHEMA,
    observation_schema: LANYON_ADMISSION_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_source_admission",
      "pinned_upstream_snapshot",
      "artifact_generation_receipt",
      "non_terminal",
      "no_network_execution",
      "no_shell",
      "no_code_mutation",
      "does_not_validate_scientific_truth",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theoryArtifactProducerManifests = [
  theoryArtifactProducerPrepareLanyonRequestManifest,
  theoryArtifactProducerAdmitLanyonManifest,
] as const;

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .filter(
          (entry): entry is string =>
            typeof entry === "string" && Boolean(entry.trim()),
        )
        .map((entry) => entry.trim())
    : [];

const artifactIdentity = (payload: Record<string, unknown>): string | null =>
  readString(
    payload.artifact_id ??
      payload.artifactId ??
      payload.receipt_id ??
      payload.receiptId ??
      payload.procedure_id ??
      payload.procedureId ??
      payload.request_id ??
      payload.requestId,
  );

const authoritativeArtifactRefs = (
  envelope: Record<string, unknown>,
): string[] => {
  const payload = readRecord(envelope.payload);
  const procedure = readRecord(payload.procedure);
  const request = readRecord(payload.request);
  const semanticReceipt = readRecord(
    payload.semantic_admission_receipt ??
      payload.semanticAdmissionReceipt,
  );
  return Array.from(
    new Set(
      [
        readString(envelope.artifact_id ?? envelope.artifactId),
        ...readStringArray(
          envelope.produced_artifact_refs ??
            envelope.producedArtifactRefs,
        ),
        artifactIdentity(payload),
        readString(procedure.procedureId ?? procedure.procedure_id),
        readString(request.requestId ?? request.request_id),
        readString(
          semanticReceipt.receiptId ?? semanticReceipt.receipt_id,
        ),
      ].filter((entry): entry is string => Boolean(entry)),
    ),
  );
};

type CurrentTurnCandidate = {
  envelope: Record<string, unknown>;
  payload: Record<string, unknown>;
  refs: string[];
  contentSha256: string;
};

async function currentTurnCandidates(input: {
  turnId: string;
  authoritativeEvidenceArtifacts?: unknown[];
  payloadSchema: string;
  artifactRef: string | null;
}): Promise<CurrentTurnCandidate[]> {
  if (!Array.isArray(input.authoritativeEvidenceArtifacts)) return [];
  const candidates = await Promise.all(
    input.authoritativeEvidenceArtifacts
      .map(readRecord)
      .filter(
        (envelope) =>
          envelope.schema === CURRENT_TURN_ARTIFACT_SCHEMA &&
          readString(envelope.turn_id ?? envelope.turnId) === input.turnId &&
          envelope.assistant_answer === false &&
          envelope.terminal_eligible === false,
      )
      .map(async (envelope) => {
        const payload = readRecord(envelope.payload);
        return {
          envelope,
          payload,
          refs: authoritativeArtifactRefs(envelope),
          contentSha256: await computeCasimirSpecValueSha256V1(payload),
        };
      }),
  );
  return candidates.filter((candidate) => {
    const declaredContentSha256 = readString(
      candidate.envelope.content_sha256 ??
        candidate.envelope.contentSha256,
    );
    return (
      candidate.payload.schema === input.payloadSchema &&
      candidate.payload.status === "succeeded" &&
      candidate.payload.assistant_answer === false &&
      candidate.payload.terminal_eligible === false &&
      (!input.artifactRef || candidate.refs.includes(input.artifactRef)) &&
      (!declaredContentSha256 ||
        declaredContentSha256 === candidate.contentSha256)
    );
  });
}

async function validateProcedureIntegrity(
  procedure: TheoryExperimentProcedureV1,
): Promise<string[]> {
  const issues = validateTheoryExperimentProcedureV1(procedure);
  const {
    procedureSha256,
    artifactId: _artifactId,
    schemaVersion: _schemaVersion,
    ...unsigned
  } = procedure;
  const expected = await computeCasimirSpecValueSha256V1({
    domain: THEORY_EXPERIMENT_PROCEDURE_HASH_DOMAIN,
    value: unsigned,
  });
  if (procedureSha256 !== expected) issues.push("procedure_sha256_mismatch");
  return issues;
}

async function validateSemanticAdmission(input: {
  payload: Record<string, unknown>;
}): Promise<{
  claimIr: CasimirSpecScientificClaimIrV1 | null;
  issues: string[];
}> {
  const claimIr = readRecord(
    input.payload.claim_ir ?? input.payload.claimIr,
  ) as CasimirSpecScientificClaimIrV1;
  const receipt = readRecord(
    input.payload.semantic_admission_receipt ??
      input.payload.semanticAdmissionReceipt,
  );
  const issues = (
    await validateCasimirSpecScientificClaimIrIntegrityV1(claimIr)
  ).map((issue) => `claim_ir:${issue}`);
  const { receiptSha256: _receiptSha256, ...unsignedReceipt } = receipt;
  const expectedReceiptSha256 =
    Object.keys(receipt).length > 0
      ? await computeCasimirSpecValueSha256V1(unsignedReceipt)
      : null;
  if (
    !["admitted", "admitted_with_declared_blockers"].includes(
      String(receipt.disposition),
    )
  ) {
    issues.push("semantic_admission_not_admitted");
  }
  if (
    receipt.claimIrSemanticSha256 !== claimIr.semanticSha256 ||
    receipt.claimIrArtifactSha256 !== claimIr.artifactSha256
  ) {
    issues.push("semantic_admission_claim_ir_identity_mismatch");
  }
  if (
    !expectedReceiptSha256 ||
    receipt.receiptSha256 !== expectedReceiptSha256
  ) {
    issues.push("semantic_admission_receipt_sha256_mismatch");
  }
  return {
    claimIr: issues.length === 0 ? claimIr : null,
    issues,
  };
}

const missingRequirement = (code: string) => ({
  code,
  message: `Lanyon artifact preparation requires repair: ${code}.`,
  repair_action: "repair" as const,
});

function blockedPreparation(input: {
  issues: string[];
  status?: TheoryArtifactProducerGatewayExecution["status"];
  admissionReason?: string;
}): TheoryArtifactProducerGatewayExecution {
  const issues = Array.from(new Set(input.issues));
  const observation = {
    schema: LANYON_REQUEST_OBSERVATION_SCHEMA,
    status: "blocked",
    issues,
    output_role: "candidate_next_step",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    ok: false,
    status: input.status ?? "blocked",
    admissionStatus: "blocked",
    admissionReason:
      input.admissionReason ?? "lanyon_request_preparation_blocked",
    blockedReason: issues[0],
    summary: "Pinned Lanyon request preparation failed closed.",
    observation,
    missingRequirements: issues.map(missingRequirement),
    error: issues[0],
  };
}

export type TheoryArtifactProducerGatewayExecution = {
  ok: boolean;
  status: "succeeded" | "blocked" | "missing_input" | "failed";
  admissionStatus: "admitted" | "blocked";
  admissionReason: string;
  blockedReason?: string;
  summary: string;
  observation: unknown;
  missingRequirements: Array<{
    code: string;
    message: string;
    repair_action: "ask_user" | "repair";
  }>;
  error?: string;
};

async function prepareLanyonRequest(input: {
  args: Record<string, unknown>;
  turnId: string;
  authoritativeEvidenceArtifacts?: unknown[];
}): Promise<TheoryArtifactProducerGatewayExecution> {
  const procedureArtifactRef = readString(
    input.args.procedure_artifact_ref ??
      input.args.procedureArtifactRef,
  );
  const procedureId = readString(
    input.args.procedure_id ?? input.args.procedureId,
  );
  const procedureSha256 = readString(
    input.args.procedure_sha256 ?? input.args.procedureSha256,
  );
  const semanticAdmissionArtifactRef = readString(
    input.args.semantic_admission_artifact_ref ??
      input.args.semanticAdmissionArtifactRef,
  );
  const caseId = readString(input.args.case_id ?? input.args.caseId);
  const requestedClaimId = readString(
    input.args.claim_id ?? input.args.claimId,
  );
  const missing = [
    ...(!Array.isArray(input.authoritativeEvidenceArtifacts)
      ? ["authoritative_evidence_artifacts_required"]
      : []),
    ...(!procedureArtifactRef
      ? ["procedure_artifact_ref_required"]
      : []),
    ...(!procedureId ? ["procedure_id_required"] : []),
    ...(!procedureSha256 || !SHA256.test(procedureSha256)
      ? ["procedure_sha256_required"]
      : []),
    ...(!semanticAdmissionArtifactRef
      ? ["semantic_admission_artifact_ref_required"]
      : []),
    ...(!caseId ? ["lanyon_case_id_required"] : []),
  ];
  if (missing.length > 0) {
    return blockedPreparation({
      issues: missing,
      status: "missing_input",
      admissionReason: "lanyon_request_preparation_input_missing",
    });
  }

  const procedureCandidates = (
    await currentTurnCandidates({
      turnId: input.turnId,
      authoritativeEvidenceArtifacts:
        input.authoritativeEvidenceArtifacts,
      payloadSchema: PROCEDURE_OBSERVATION_SCHEMA,
      artifactRef: procedureArtifactRef,
    })
  ).filter((candidate) => {
    const procedure = readRecord(candidate.payload.procedure);
    return (
      procedure.procedureId === procedureId &&
      procedure.procedureSha256 === procedureSha256
    );
  });
  if (procedureCandidates.length === 0) {
    return blockedPreparation({
      issues: ["authoritative_procedure_artifact_not_admitted"],
    });
  }
  if (procedureCandidates.length > 1) {
    return blockedPreparation({
      issues: ["authoritative_procedure_artifact_ambiguous"],
    });
  }
  const procedure = readRecord(
    procedureCandidates[0].payload.procedure,
  ) as TheoryExperimentProcedureV1;
  const procedureIssues = await validateProcedureIntegrity(procedure);
  if (procedureIssues.length > 0) {
    return blockedPreparation({
      issues: procedureIssues.map(
        (issue) => `procedure_integrity_invalid:${issue}`,
      ),
    });
  }

  const semanticCandidates = await currentTurnCandidates({
    turnId: input.turnId,
    authoritativeEvidenceArtifacts: input.authoritativeEvidenceArtifacts,
    payloadSchema: SEMANTIC_ADMISSION_OBSERVATION_SCHEMA,
    artifactRef: semanticAdmissionArtifactRef,
  });
  if (semanticCandidates.length === 0) {
    return blockedPreparation({
      issues: ["semantic_admission_artifact_not_admitted"],
    });
  }
  if (semanticCandidates.length > 1) {
    return blockedPreparation({
      issues: ["semantic_admission_artifact_ambiguous"],
    });
  }
  const semanticCandidate = semanticCandidates[0];
  const semantic = await validateSemanticAdmission({
    payload: semanticCandidate.payload,
  });
  if (!semantic.claimIr) {
    return blockedPreparation({
      issues: semantic.issues.map(
        (issue) => `semantic_admission_integrity_invalid:${issue}`,
      ),
    });
  }
  const claimIr = semantic.claimIr;

  const semanticBindings = procedure.evidenceBindings.filter(
    (binding) =>
      binding.kind === "semantic_admission" &&
      binding.contentSha256 === semanticCandidate.contentSha256 &&
      (binding.artifactRef === semanticAdmissionArtifactRef ||
        semanticCandidate.refs.includes(binding.artifactRef)),
  );
  if (semanticBindings.length === 0) {
    return blockedPreparation({
      issues: ["procedure_semantic_admission_binding_missing"],
    });
  }
  if (semanticBindings.length > 1) {
    return blockedPreparation({
      issues: ["procedure_semantic_admission_binding_ambiguous"],
    });
  }
  const lineage = semanticBindings[0].lineage;
  if (
    lineage &&
    (lineage.casimirSpecId !== claimIr.specId ||
      lineage.casimirSpecSemanticSha256 !== claimIr.semanticSha256 ||
      lineage.casimirSpecArtifactSha256 !== claimIr.artifactSha256)
  ) {
    return blockedPreparation({
      issues: ["procedure_semantic_identity_mismatch"],
    });
  }

  const eligibility = procedure.lanyonEligibility;
  if (
    eligibility.status !== "eligible" ||
    eligibility.requestedCaseId !== caseId ||
    !eligibility.eligibleCaseIds.includes(caseId as string) ||
    eligibility.semanticIdentityBound !== true
  ) {
    return blockedPreparation({
      issues: [
        eligibility.blockers[0] ?? "lanyon_case_not_eligible_for_procedure",
      ],
    });
  }

  const selectedClaim = requestedClaimId
    ? claimIr.claims.find((claim) => claim.claimId === requestedClaimId)
    : claimIr.claims.length === 1
      ? claimIr.claims[0]
      : null;
  if (!selectedClaim) {
    return blockedPreparation({
      issues: [
        requestedClaimId
          ? "lanyon_claim_selection_invalid"
          : "lanyon_claim_selection_required",
      ],
    });
  }
  if (
    lineage &&
    !lineage.claims.some(
      (claim) =>
        claim.claimId === selectedClaim.claimId &&
        claim.propositionSha256 === selectedClaim.propositionSha256,
    )
  ) {
    return blockedPreparation({
      issues: ["procedure_claim_identity_mismatch"],
    });
  }

  const policy = await buildCasimirLanyonAdapterPolicyV1();
  const policyIssues =
    await validateCasimirLanyonAdapterPolicyIntegrityV1(policy);
  if (policyIssues.length > 0) {
    return blockedPreparation({
      issues: policyIssues.map(
        (issue) => `lanyon_adapter_policy_integrity_invalid:${issue}`,
      ),
    });
  }
  const selectedCase =
    policy.cases.find((entry) => entry.caseId === caseId) ?? null;
  if (!selectedCase) {
    return blockedPreparation({
      issues: ["lanyon_case_not_in_pinned_policy"],
    });
  }
  if (
    selectedCase.dimensions !== eligibility.dimensions ||
    selectedCase.kind !== eligibility.caseKind
  ) {
    return blockedPreparation({
      issues: ["lanyon_case_procedure_identity_mismatch"],
    });
  }

  const [masterProblemArtifactSha256, derivationProgramArtifactSha256] =
    await Promise.all([
      computeCasimirSpecValueSha256V1(procedure.masterProblem),
      computeCasimirSpecValueSha256V1(procedure.derivationProgram),
    ]);
  const request = await buildCasimirArtifactGenerationRequestV1({
    requestId: `lanyon-request:${randomUUID()}`,
    casimirSpec: {
      specId: claimIr.specId,
      schemaVersion: claimIr.schemaVersion,
      semanticSha256: claimIr.semanticSha256,
      artifactSha256: claimIr.artifactSha256,
    },
    claim: {
      claimId: selectedClaim.claimId,
      propositionSha256: selectedClaim.propositionSha256,
    },
    sourcePacket: {
      packetId: `lanyon:${selectedCase.caseId}:specification`,
      mediaType: "text/x-racket",
      artifactSha256: selectedCase.specification.sha256,
    },
    masterProblem: {
      schemaVersion: procedure.masterProblem.schemaVersion,
      planId: procedure.masterProblem.planId,
      artifactSha256: masterProblemArtifactSha256,
    },
    derivationProgram: {
      schemaVersion: procedure.derivationProgram.schemaVersion,
      programId: procedure.derivationProgram.programId,
      sourceMasterProblemPlanId:
        procedure.derivationProgram.sourceMasterProblemPlanId,
      artifactSha256: derivationProgramArtifactSha256,
    },
    producerPolicy: {
      adapterContractId: CASIMIR_LANYON_ADAPTER_CONTRACT_ID,
      adapterContractSha256: policy.artifactSha256,
      allowedProducerIds: [CASIMIR_LANYON_PRODUCER_ID],
      immutableRepositoryPinRequired: true,
      outputHashRequired: true,
      providerOutputTrusted: false,
    },
    requestedArtifacts: [
      {
        artifactId: `casimir:lanyon:${selectedCase.caseId}:build_manifest`,
        role: "build_manifest",
        mediaType: "application/json",
      },
      {
        artifactId: `casimir:lanyon:${selectedCase.caseId}:formal_source`,
        role: "formal_source",
        mediaType: "text/x-lean",
      },
      {
        artifactId: `casimir:lanyon:${selectedCase.caseId}:implementation_source`,
        role: "implementation_source",
        mediaType: "text/x-c",
      },
      {
        artifactId: `casimir:lanyon:${selectedCase.caseId}:numerical_case`,
        role: "numerical_case",
        mediaType: "text/x-racket",
      },
    ],
  });
  const requestIssues =
    await validateCasimirArtifactGenerationRequestIntegrityV1(request);
  if (requestIssues.length > 0) {
    return blockedPreparation({
      issues: requestIssues.map(
        (issue) => `artifact_generation_request_integrity_invalid:${issue}`,
      ),
    });
  }

  const observation = {
    schema: LANYON_REQUEST_OBSERVATION_SCHEMA,
    status: "succeeded",
    request,
    bindings: {
      source_turn_id: input.turnId,
      procedure_artifact_ref: procedureArtifactRef,
      procedure_id: procedure.procedureId,
      procedure_sha256: procedure.procedureSha256,
      semantic_admission_artifact_ref: semanticAdmissionArtifactRef,
      semantic_admission_content_sha256:
        semanticCandidate.contentSha256,
      lanyon_case_id: selectedCase.caseId,
      lanyon_adapter_policy_sha256: policy.artifactSha256,
      casimir_spec_id: claimIr.specId,
      casimir_spec_semantic_sha256: claimIr.semanticSha256,
      casimir_spec_artifact_sha256: claimIr.artifactSha256,
      claim_id: selectedClaim.claimId,
      proposition_sha256: selectedClaim.propositionSha256,
      master_problem_artifact_sha256:
        masterProblemArtifactSha256,
      derivation_program_artifact_sha256:
        derivationProgramArtifactSha256,
    },
    selected_case: {
      case_id: selectedCase.caseId,
      kind: selectedCase.kind,
      dimensions: selectedCase.dimensions,
      specification_path: selectedCase.specification.logicalPath,
      specification_sha256: selectedCase.specification.sha256,
    },
    next_admissible_capability_ids: [
      THEORY_ARTIFACT_PRODUCER_ADMIT_LANYON_CAPABILITY,
    ],
    authority: {
      evidence_only: true,
      prepares_request_only: true,
      executes_tools: false,
      reads_source_bytes: false,
      validates_semantic_intent: false,
      validates_formal_proposition: false,
      validates_numerical_implementation: false,
      validates_empirical_claim: false,
      validates_physical_truth: false,
    },
    output_role: "candidate_next_step",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    ok: true,
    status: "succeeded",
    admissionStatus: "admitted",
    admissionReason: "pinned_lanyon_request_prepared",
    summary:
      "A hash-bound, non-terminal Lanyon artifact-generation request was prepared from exact current-turn scientific evidence.",
    observation,
    missingRequirements: [],
  };
}

async function resolvePreparedRequest(input: {
  requestArtifactRef: string;
  caseId: string;
  turnId: string;
  authoritativeEvidenceArtifacts?: unknown[];
}): Promise<
  | { ok: true; request: CasimirArtifactGenerationRequestV1 }
  | { ok: false; issues: string[] }
> {
  if (!Array.isArray(input.authoritativeEvidenceArtifacts)) {
    return { ok: false, issues: ["authoritative_evidence_artifacts_required"] };
  }
  const candidates = await currentTurnCandidates({
    turnId: input.turnId,
    authoritativeEvidenceArtifacts: input.authoritativeEvidenceArtifacts,
    payloadSchema: LANYON_REQUEST_OBSERVATION_SCHEMA,
    artifactRef: input.requestArtifactRef,
  });
  if (candidates.length === 0) {
    return {
      ok: false,
      issues: ["lanyon_request_artifact_not_admitted"],
    };
  }
  if (candidates.length > 1) {
    return {
      ok: false,
      issues: ["lanyon_request_artifact_ambiguous"],
    };
  }
  const candidate = candidates[0];
  const request = readRecord(
    candidate.payload.request,
  ) as CasimirArtifactGenerationRequestV1;
  const bindings = readRecord(candidate.payload.bindings);
  const authority = readRecord(candidate.payload.authority);
  const issues =
    await validateCasimirArtifactGenerationRequestIntegrityV1(request);
  if (
    bindings.source_turn_id !== input.turnId ||
    bindings.lanyon_case_id !== input.caseId ||
    bindings.lanyon_adapter_policy_sha256 !==
      request.producerPolicy?.adapterContractSha256 ||
    bindings.casimir_spec_semantic_sha256 !==
      request.casimirSpec?.semanticSha256 ||
    bindings.casimir_spec_artifact_sha256 !==
      request.casimirSpec?.artifactSha256 ||
    bindings.claim_id !== request.claim?.claimId ||
    bindings.proposition_sha256 !==
      request.claim?.propositionSha256
  ) {
    issues.push("lanyon_request_binding_mismatch");
  }
  if (
    authority.evidence_only !== true ||
    authority.prepares_request_only !== true ||
    authority.executes_tools !== false ||
    candidate.payload.assistant_answer !== false ||
    candidate.payload.terminal_eligible !== false
  ) {
    issues.push("lanyon_request_authority_invalid");
  }
  return issues.length > 0
    ? {
        ok: false,
        issues: issues.map(
          (issue) => `lanyon_request_integrity_invalid:${issue}`,
        ),
      }
    : { ok: true, request };
}

export async function executeTheoryArtifactProducerGatewayCapability(input: {
  capabilityId: string;
  args: Record<string, unknown>;
  accountType: HelixAccountType;
  profileId?: string | null;
  turnId?: string | null;
  authoritativeEvidenceArtifacts?: unknown[];
}): Promise<TheoryArtifactProducerGatewayExecution> {
  const observationSchema =
    input.capabilityId ===
    THEORY_ARTIFACT_PRODUCER_PREPARE_LANYON_REQUEST_CAPABILITY
      ? LANYON_REQUEST_OBSERVATION_SCHEMA
      : LANYON_ADMISSION_OBSERVATION_SCHEMA;
  if (input.accountType !== "developer") {
    const observation = {
      schema: observationSchema,
      status: "blocked",
      blocked_reason: "developer_account_required",
      output_role: "evidence_for_synthesis",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      status: "blocked",
      admissionStatus: "blocked",
      admissionReason: "developer_account_required",
      blockedReason: "developer_account_required",
      summary:
        "Pinned Lanyon artifact admission is restricted to developer accounts.",
      observation,
      missingRequirements: [
        {
          code: "developer_account_required",
          message:
            "Use a trusted developer account for experimental artifact admission.",
          repair_action: "ask_user",
        },
      ],
      error: "developer_account_required",
    };
  }

  const turnId = readString(input.turnId);
  if (
    input.capabilityId ===
    THEORY_ARTIFACT_PRODUCER_PREPARE_LANYON_REQUEST_CAPABILITY
  ) {
    if (!turnId) {
      return blockedPreparation({
        issues: ["turn_id_required"],
        status: "missing_input",
        admissionReason: "lanyon_request_preparation_input_missing",
      });
    }
    return prepareLanyonRequest({
      args: input.args,
      turnId,
      authoritativeEvidenceArtifacts:
        input.authoritativeEvidenceArtifacts,
    });
  }
  if (
    input.capabilityId !== THEORY_ARTIFACT_PRODUCER_ADMIT_LANYON_CAPABILITY
  ) {
    const code = "theory_artifact_producer_capability_unsupported";
    return {
      ok: false,
      status: "blocked",
      admissionStatus: "blocked",
      admissionReason: code,
      blockedReason: code,
      summary: "The requested theory artifact-producer capability is not supported.",
      observation: {
        schema: observationSchema,
        status: "blocked",
        issues: [code],
        output_role: "candidate_next_step",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      missingRequirements: [missingRequirement(code)],
      error: code,
    };
  }

  const caseId = readString(input.args.case_id ?? input.args.caseId);
  const requestArtifactRef = readString(
    input.args.request_artifact_ref ?? input.args.requestArtifactRef,
  );
  // This path is a server trust boundary. Tool callers may select a registered
  // case and bind an exact current-turn prepared request, but they cannot
  // redirect source admission to an arbitrary filesystem root.
  const sourceRoot =
    process.env.CASIMIR_LANYON_SOURCE_ROOT?.trim() || null;
  const missing: string[] = [];
  if (!turnId) missing.push("turn_id_required");
  if (!caseId) missing.push("lanyon_case_id_required");
  if (!sourceRoot) missing.push("lanyon_source_root_not_configured");
  if (!requestArtifactRef)
    missing.push("lanyon_request_artifact_ref_required");
  if (!Array.isArray(input.authoritativeEvidenceArtifacts)) {
    missing.push("authoritative_evidence_artifacts_required");
  }
  if (missing.length > 0) {
    const observation = {
      schema: LANYON_ADMISSION_OBSERVATION_SCHEMA,
      status: "blocked",
      issues: missing,
      output_role: "candidate_next_step",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      status: "missing_input",
      admissionStatus: "blocked",
      admissionReason: "lanyon_adapter_input_missing",
      blockedReason: missing[0],
      summary: "Pinned Lanyon artifact admission is missing required input.",
      observation,
      missingRequirements: missing.map((code) => ({
        code,
        message: `Lanyon artifact admission requires repair: ${code}.`,
        repair_action: "repair",
      })),
      error: missing[0],
    };
  }
  const admittedCaseId = caseId as string;
  const admittedSourceRoot = sourceRoot as string;
  const resolvedRequest = await resolvePreparedRequest({
    requestArtifactRef: requestArtifactRef as string,
    caseId: admittedCaseId,
    turnId: turnId as string,
    authoritativeEvidenceArtifacts:
      input.authoritativeEvidenceArtifacts,
  });
  if (!resolvedRequest.ok) {
    const issues = resolvedRequest.issues;
    const observation = {
      schema: LANYON_ADMISSION_OBSERVATION_SCHEMA,
      status: "blocked",
      issues,
      requested_request_artifact_ref: requestArtifactRef,
      output_role: "candidate_next_step",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      status: "blocked",
      admissionStatus: "blocked",
      admissionReason: "lanyon_request_artifact_invalid",
      blockedReason: issues[0],
      summary:
        "Pinned Lanyon source admission rejected the prepared request artifact.",
      observation,
      missingRequirements: issues.map((code) => ({
        code,
        message: `Lanyon artifact admission requires repair: ${code}.`,
        repair_action: "repair",
      })),
      error: issues[0],
    };
  }
  const request = resolvedRequest.request;

  const result = await admitCasimirLanyonAdvectionDiffusionSnapshotV1({
    accountType: input.accountType,
    profileId: input.profileId,
    sourceRoot: admittedSourceRoot,
    caseId: admittedCaseId,
    request,
  });
  const bindings = result.artifactBindings
    ? {
        specification_path: result.artifactBindings.specificationPath,
        formal_source_path: result.artifactBindings.formalSourcePath,
        implementation_source_path:
          result.artifactBindings.implementationSourcePath,
        build_manifest: {
          media_type: result.artifactBindings.buildManifest.mediaType,
          logical_path: result.artifactBindings.buildManifest.logicalPath,
          artifact_sha256: result.artifactBindings.buildManifest.artifactSha256,
          size_bytes: result.artifactBindings.buildManifest.sizeBytes,
        },
      }
    : null;
  const observation = {
    ...result,
    schema: LANYON_ADMISSION_OBSERVATION_SCHEMA,
    request_artifact_ref: requestArtifactRef,
    artifactBindings: bindings,
    output_role: "evidence_for_synthesis",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    ok: result.ok,
    status: result.ok ? "succeeded" : "blocked",
    admissionStatus: result.ok ? "admitted" : "blocked",
    admissionReason: result.ok
      ? "pinned_lanyon_snapshot_admitted"
      : "pinned_lanyon_snapshot_blocked",
    ...(result.ok ? {} : { blockedReason: result.issues[0] }),
    summary: result.ok
      ? "The exact pinned Lanyon source snapshot was admitted and produced a non-terminal artifact receipt."
      : "The pinned Lanyon source snapshot failed admission.",
    observation,
    missingRequirements: result.issues.map((code) => ({
      code,
      message: `Lanyon artifact admission requires repair: ${code}.`,
      repair_action: "repair",
    })),
    ...(result.ok ? {} : { error: result.issues[0] }),
  };
}
