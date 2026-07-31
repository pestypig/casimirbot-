import type { HelixAccountType } from "@shared/helix-account-session";
import {
  computeCasimirSpecValueSha256V1,
  validateCasimirSpecScientificClaimIrIntegrityV1,
  type CasimirSpecScientificClaimIrV1,
} from "@shared/contracts/casimir-spec-scientific-claim-ir.v1";
import { validateCasimirFormalVerificationCertificateIntegrityV1 } from "@shared/contracts/casimir-formal-verification-certificate.v1";
import {
  validateCasimirFormalVerificationCertificateV2Integrity,
} from "@shared/contracts/casimir-formal-verification-certificate.v2";
import { validateCasimirIndependentNumericalVerificationCertificateIntegrityV1 } from "@shared/contracts/casimir-independent-numerical-verification.v1";
import { validateCasimirArtifactGenerationReceiptIntegrityV1 } from "@shared/contracts/casimir-artifact-generation.v1";
import {
  THEORY_EXPERIMENT_BADGE_SET_OVERLAP_CODE,
  THEORY_EXPERIMENT_EVIDENCE_KINDS,
  THEORY_EXPERIMENT_PROCEDURE_HASH_DOMAIN,
  validateTheoryExperimentProcedureV1,
  type TheoryExperimentEvidenceBindingV1,
  type TheoryExperimentEvidenceLineageV1,
  type TheoryExperimentEvidenceKindV1,
  type TheoryExperimentProcedureV1,
} from "@shared/contracts/theory-experiment-procedure.v1";
import {
  validateTheoryExperimentExecutionClosureIntegrityV1,
  type TheoryExperimentExecutionClosureEvidenceObservationV1,
} from "@shared/contracts/theory-experiment-execution-closure.v1";
import type { TheoryMasterProblemRequestV1 } from "@shared/contracts/theory-master-problem.v1";
import {
  HELIX_PAPER_EVIDENCE_SIDECAR_SCHEMA,
  type HelixPaperEvidenceSidecarV1,
} from "@shared/helix-paper-evidence-sidecar";
import {
  buildScientificImageEvidenceSidecar,
  SCIENTIFIC_EVIDENCE_PACKET_SCHEMA,
  SCIENTIFIC_IMAGE_EVIDENCE_SIDECAR_SCHEMA,
  type ScientificEvidencePacketV1,
  type ScientificImageEvidenceSidecarV1,
} from "@shared/scientific-evidence-adaptor";
import { buildNhm2TheoryBadgeGraphV1 } from "@shared/theory/nhm2-theory-badges";
import { buildTheoryContextReflection } from "@shared/theory/theory-context-reflector";
import { compileTheoryExperimentProcedureV1 } from "@shared/theory/theory-experiment-procedure-compiler";
import { compileTheoryExperimentExecutionClosureV1 } from "@shared/theory/theory-experiment-execution-closure";

import type { CasimirSpecSemanticAdmissionReceiptV1 } from "../../theory/casimir-spec-semantic-admission";
import { inspectCasimirIndependentNumericalVerifierRuntimeV1 } from "../../theory/casimir-independent-numerical-verifier-job-service";
import { buildWorkstationGatewayObservationArtifactRef } from "./observation-packet";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const THEORY_EXPERIMENT_PROCEDURE_PREPARE_CAPABILITY =
  "theory-experiment-procedure.prepare" as const;
export const THEORY_EXPERIMENT_PROCEDURE_READMIT_CAPABILITY =
  "theory-experiment-procedure.readmit" as const;
export const THEORY_EXPERIMENT_PROCEDURE_EVALUATE_CLOSURE_CAPABILITY =
  "theory-experiment-procedure.evaluate_closure" as const;
export const THEORY_EXPERIMENT_PROCEDURE_CAPABILITIES = [
  THEORY_EXPERIMENT_PROCEDURE_PREPARE_CAPABILITY,
  THEORY_EXPERIMENT_PROCEDURE_READMIT_CAPABILITY,
  THEORY_EXPERIMENT_PROCEDURE_EVALUATE_CLOSURE_CAPABILITY,
] as const;

const THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA =
  "casimir.theory_experiment_procedure.observation.v1" as const;
export const THEORY_EXPERIMENT_EXECUTION_CLOSURE_OBSERVATION_SCHEMA =
  "casimir.theory_experiment_execution_closure.observation.v1" as const;

export const theoryExperimentProcedurePrepareManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_EXPERIMENT_PROCEDURE_PREPARE_CAPABILITY,
    label: "Prepare theory experiment procedure",
    description:
      "Binds explicit Theory Badge selections and current-turn evidence into a seven-stage, dependency-ordered, non-terminal scientific procedure with open-world, scale, bridge, Lanyon, formal, and numerical affordances. It prepares but never executes the procedure.",
    panel_id: "workflow-demo-lab",
    action_id: "prepare_theory_experiment_procedure",
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
      required: ["prompt", "operation", "target", "selected_badge_ids"],
      properties: {
        prompt: { type: "string" },
        operation: {
          type: "string",
          enum: ["compare", "predict", "derive", "explain", "prove", "bound"],
        },
        target: { type: "string" },
        target_observable: { type: "string" },
        selected_badge_ids: { type: "array", items: { type: "string" } },
        comparison_badge_ids: { type: "array", items: { type: "string" } },
        scale_min_log10_m: { type: "number" },
        scale_max_log10_m: { type: "number" },
        coordinate_frame: { type: "string" },
        initial_boundary_conditions: {
          type: "array",
          items: { type: "string" },
        },
        formal_system: { type: "string" },
        requested_precision: { type: "string" },
        evidence_maturity_ceiling: {
          type: "string",
          enum: ["exploratory", "reduced_order", "diagnostic", "certified"],
        },
        evidence_artifacts: { type: "array", items: { type: "object" } },
        lanyon_requested: { type: "boolean" },
        lanyon_case_id: { type: "string" },
        procedure_id: { type: "string" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
    observation_schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_procedure_binding",
      "current_turn_evidence_binding",
      "dependency_dag_order",
      "scale_checkpoint_not_execution_order",
      "open_world",
      "evidence_only",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
      "no_private_planner",
      "does_not_validate_scientific_truth",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theoryExperimentProcedureReadmitManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_EXPERIMENT_PROCEDURE_READMIT_CAPABILITY,
    label: "Readmit theory experiment procedure",
    description:
      "Retrieves an exact server-retained, developer-session-scoped procedure by procedure ID and digest, verifies its original artifact-reference shape and integrity, and emits a fresh current-turn evidence observation. It does not execute the procedure or grant terminal authority.",
    panel_id: "workflow-demo-lab",
    action_id: "readmit_theory_experiment_procedure",
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
      required: ["procedure_artifact_ref", "procedure_id", "procedure_sha256"],
      properties: {
        procedure_artifact_ref: { type: "string" },
        procedure_id: { type: "string" },
        procedure_sha256: { type: "string" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
    observation_schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_procedure_readmission",
      "server_retained_artifact",
      "session_scoped",
      "exact_procedure_hash_binding",
      "evidence_only",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
      "no_private_planner",
      "does_not_validate_scientific_truth",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theoryExperimentProcedureEvaluateClosureManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_EXPERIMENT_PROCEDURE_EVALUATE_CLOSURE_CAPABILITY,
    label: "Evaluate theory execution closure",
    description:
      "Validates an exact current-turn or explicitly readmitted procedure, retains passed and failed bounded evidence separately, and deterministically ranks candidate evidence coverage without executing tools or claiming theory truth.",
    panel_id: "workflow-demo-lab",
    action_id: "evaluate_theory_execution_closure",
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
      required: ["prompt", "procedure_id", "procedure_sha256"],
      properties: {
        prompt: { type: "string" },
        procedure_artifact_ref: { type: "string" },
        procedure_id: { type: "string" },
        procedure_sha256: { type: "string" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema:
      THEORY_EXPERIMENT_EXECUTION_CLOSURE_OBSERVATION_SCHEMA,
    observation_schema: THEORY_EXPERIMENT_EXECUTION_CLOSURE_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_closure_evaluation",
      "exact_procedure_hash_binding",
      "failed_evidence_retained",
      "candidate_preference_not_theory_truth",
      "evidence_only",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
      "no_private_planner",
      "does_not_validate_scientific_truth",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theoryExperimentProcedureManifests = [
  theoryExperimentProcedurePrepareManifest,
  theoryExperimentProcedureReadmitManifest,
  theoryExperimentProcedureEvaluateClosureManifest,
] as const;

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .filter(
              (entry): entry is string =>
                typeof entry === "string" && Boolean(entry.trim()),
            )
            .map((entry) => entry.trim()),
        ),
      )
    : [];
const readFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

type RetainedTheoryExperimentProcedure = {
  ownerKey: string;
  originTurnId: string;
  issuedArtifactRef: string;
  procedure: TheoryExperimentProcedureV1;
  storedAtMs: number;
};

const RETAINED_PROCEDURE_TTL_MS = 24 * 60 * 60 * 1_000;
const RETAINED_PROCEDURE_LIMIT = 256;
const retainedTheoryExperimentProcedures = new Map<
  string,
  RetainedTheoryExperimentProcedure
>();
const procedureGenerationTimes = new Map<
  string,
  { generatedAt: string; storedAtMs: number }
>();

const retainedProcedureOwnerKey = (input: {
  accountType: HelixAccountType;
  profileId?: string | null;
  sessionId?: string | null;
}): string | null => {
  const profileId = readString(input.profileId);
  const sessionId = readString(input.sessionId);
  if (!profileId || !sessionId) return null;
  return JSON.stringify([input.accountType, profileId, sessionId]);
};

const retainedProcedureKey = (input: {
  ownerKey: string;
  procedureId: string;
  procedureSha256: string;
}): string =>
  JSON.stringify([input.ownerKey, input.procedureId, input.procedureSha256]);

const pruneRetainedTheoryExperimentProcedures = (nowMs: number): void => {
  for (const [key, retained] of retainedTheoryExperimentProcedures) {
    if (nowMs - retained.storedAtMs > RETAINED_PROCEDURE_TTL_MS) {
      retainedTheoryExperimentProcedures.delete(key);
    }
  }
  while (retainedTheoryExperimentProcedures.size > RETAINED_PROCEDURE_LIMIT) {
    const oldestKey = retainedTheoryExperimentProcedures.keys().next().value as
      string | undefined;
    if (!oldestKey) break;
    retainedTheoryExperimentProcedures.delete(oldestKey);
  }
  for (const [key, generation] of procedureGenerationTimes) {
    if (nowMs - generation.storedAtMs > RETAINED_PROCEDURE_TTL_MS) {
      procedureGenerationTimes.delete(key);
    }
  }
  while (procedureGenerationTimes.size > RETAINED_PROCEDURE_LIMIT) {
    const oldestKey = procedureGenerationTimes.keys().next().value as
      string | undefined;
    if (!oldestKey) break;
    procedureGenerationTimes.delete(oldestKey);
  }
};

const stableProcedureGeneratedAt = (input: {
  accountType: HelixAccountType;
  profileId?: string | null;
  sessionId?: string | null;
  turnId: string;
  procedureId: string;
}): string => {
  const nowMs = Date.now();
  pruneRetainedTheoryExperimentProcedures(nowMs);
  const key = JSON.stringify([
    input.accountType,
    readString(input.profileId),
    readString(input.sessionId),
    input.turnId,
    input.procedureId,
  ]);
  const retained = procedureGenerationTimes.get(key);
  if (retained) return retained.generatedAt;
  const generatedAt = new Date(nowMs).toISOString();
  procedureGenerationTimes.set(key, { generatedAt, storedAtMs: nowMs });
  pruneRetainedTheoryExperimentProcedures(nowMs);
  return generatedAt;
};

const retainTheoryExperimentProcedure = (input: {
  ownerKey: string;
  issuedArtifactRef: string;
  procedure: TheoryExperimentProcedureV1;
}): void => {
  const nowMs = Date.now();
  pruneRetainedTheoryExperimentProcedures(nowMs);
  const key = retainedProcedureKey({
    ownerKey: input.ownerKey,
    procedureId: input.procedure.procedureId,
    procedureSha256: input.procedure.procedureSha256,
  });
  retainedTheoryExperimentProcedures.delete(key);
  retainedTheoryExperimentProcedures.set(key, {
    ownerKey: input.ownerKey,
    originTurnId: input.procedure.turnId,
    issuedArtifactRef: input.issuedArtifactRef,
    procedure: JSON.parse(
      JSON.stringify(input.procedure),
    ) as TheoryExperimentProcedureV1,
    storedAtMs: nowMs,
  });
  pruneRetainedTheoryExperimentProcedures(nowMs);
};

const readRetainedTheoryExperimentProcedure = (input: {
  accountType: HelixAccountType;
  profileId?: string | null;
  sessionId?: string | null;
  procedureId: string;
  procedureSha256: string;
}): RetainedTheoryExperimentProcedure | null => {
  pruneRetainedTheoryExperimentProcedures(Date.now());
  const ownerKey = retainedProcedureOwnerKey(input);
  if (!ownerKey) return null;
  return (
    retainedTheoryExperimentProcedures.get(
      retainedProcedureKey({
        ownerKey,
        procedureId: input.procedureId,
        procedureSha256: input.procedureSha256,
      }),
    ) ?? null
  );
};

export const resetRetainedTheoryExperimentProceduresForTests = (): void => {
  retainedTheoryExperimentProcedures.clear();
  procedureGenerationTimes.clear();
};

const operation = (
  value: unknown,
): TheoryMasterProblemRequestV1["operation"] | null =>
  ["compare", "predict", "derive", "explain", "prove", "bound"].includes(
    String(value),
  )
    ? (value as TheoryMasterProblemRequestV1["operation"])
    : null;

const maturity = (
  value: unknown,
): TheoryMasterProblemRequestV1["evidenceMaturityCeiling"] =>
  ["exploratory", "reduced_order", "diagnostic", "certified"].includes(
    String(value),
  )
    ? (value as TheoryMasterProblemRequestV1["evidenceMaturityCeiling"])
    : "diagnostic";

const evidenceKind = (value: unknown): TheoryExperimentEvidenceKindV1 | null =>
  typeof value === "string" &&
  (THEORY_EXPERIMENT_EVIDENCE_KINDS as readonly string[]).includes(value)
    ? (value as TheoryExperimentEvidenceKindV1)
    : null;

const artifactSchema = (artifact: Record<string, unknown>): string | null =>
  readString(artifact.schema ?? artifact.schemaVersion);

const artifactIdentity = (artifact: Record<string, unknown>): string | null =>
  readString(
    artifact.sidecar_id ??
      artifact.sidecarId ??
      artifact.reflection_id ??
      artifact.reflectionId ??
      artifact.receipt_id ??
      artifact.receiptId ??
      artifact.certificate_id ??
      artifact.certificateId ??
      artifact.artifact_id ??
      artifact.artifactId ??
      artifact.job_id ??
      artifact.jobId,
  );

async function validateSemanticAdmissionArtifact(
  artifact: Record<string, unknown>,
): Promise<string[]> {
  const issues: string[] = [];
  if (artifact.schema !== "casimir.theory_semantic_admitter.observation.v1") {
    return ["semantic_admission_observation_schema_invalid"];
  }
  if (artifact.status !== "succeeded") {
    issues.push("semantic_admission_not_succeeded");
  }
  const claimIr = readRecord(
    artifact.claim_ir ?? artifact.claimIr,
  ) as CasimirSpecScientificClaimIrV1;
  const receipt = readRecord(
    artifact.semantic_admission_receipt ?? artifact.semanticAdmissionReceipt,
  ) as CasimirSpecSemanticAdmissionReceiptV1;
  issues.push(
    ...(await validateCasimirSpecScientificClaimIrIntegrityV1(claimIr)).map(
      (issue) => `semantic_claim_ir:${issue}`,
    ),
  );
  if (
    receipt.disposition !== "admitted" &&
    receipt.disposition !== "admitted_with_declared_blockers"
  ) {
    issues.push("semantic_admission_receipt_not_admitted");
  }
  if (
    receipt.claimIrSemanticSha256 !== claimIr.semanticSha256 ||
    receipt.claimIrArtifactSha256 !== claimIr.artifactSha256
  ) {
    issues.push("semantic_admission_receipt_claim_ir_identity_mismatch");
  }
  const { receiptSha256: _ignored, ...unsignedReceipt } = receipt;
  const expectedReceiptSha256 =
    await computeCasimirSpecValueSha256V1(unsignedReceipt);
  if (receipt.receiptSha256 !== expectedReceiptSha256) {
    issues.push("semantic_admission_receipt_hash_mismatch");
  }
  return issues;
}

const validIsoTimestamp = (value: unknown): boolean =>
  typeof value === "string" &&
  value.trim().length > 0 &&
  Number.isFinite(Date.parse(value));

async function validateScientificImageSidecarArtifact(
  artifact: Record<string, unknown>,
): Promise<string[]> {
  const issues: string[] = [];
  if (artifact.schema !== SCIENTIFIC_IMAGE_EVIDENCE_SIDECAR_SCHEMA) {
    return ["scientific_image_sidecar_schema_invalid"];
  }
  if (
    artifact.sidecar_kind !== "transient_scientific_image_evidence" ||
    !readString(artifact.sidecar_id) ||
    !readString(artifact.source_ref_hash)
  ) {
    issues.push("scientific_image_sidecar_provenance_invalid");
  }
  if (
    artifact.assistant_answer !== false ||
    artifact.terminal_eligible !== false ||
    artifact.raw_content_included !== false
  ) {
    issues.push("scientific_image_sidecar_authority_invalid");
  }
  if (!Array.isArray(artifact.packets) || artifact.packets.length === 0) {
    issues.push("scientific_image_sidecar_packets_missing");
    return issues;
  }
  if (
    !Number.isInteger(artifact.packet_count) ||
    artifact.packet_count !== artifact.packets.length
  ) {
    issues.push("scientific_image_sidecar_packet_count_mismatch");
  }
  const packets: ScientificEvidencePacketV1[] = [];
  for (const [index, rawPacket] of artifact.packets.entries()) {
    const packet = readRecord(rawPacket);
    const sourceImage = readRecord(packet.source_image);
    const cropRegion = readRecord(packet.crop_region);
    const packetSourceRef = readString(packet.source_ref_hash);
    if (
      packet.schema !== SCIENTIFIC_EVIDENCE_PACKET_SCHEMA ||
      !packetSourceRef ||
      readString(sourceImage.ref_hash) !== packetSourceRef ||
      readString(cropRegion.source_ref_hash) !== packetSourceRef ||
      readString(cropRegion.region_id) !== readString(packet.crop_region_id) ||
      packet.assistant_answer !== false ||
      packet.terminal_eligible !== false ||
      packet.raw_content_included !== false
    ) {
      issues.push(
        `scientific_image_sidecar_packet_${index}_provenance_invalid`,
      );
      continue;
    }
    packets.push(packet as unknown as ScientificEvidencePacketV1);
  }
  if (packets.length !== artifact.packets.length) return issues;

  const rebuilt = buildScientificImageEvidenceSidecar({
    sidecarId: readString(artifact.sidecar_id),
    sourceRefHash: readString(artifact.source_ref_hash),
    packets,
  });
  const [actualSha256, rebuiltSha256] = await Promise.all([
    computeCasimirSpecValueSha256V1(artifact),
    computeCasimirSpecValueSha256V1(rebuilt),
  ]);
  if (actualSha256 !== rebuiltSha256) {
    issues.push("scientific_image_sidecar_integrity_mismatch");
  }
  return issues;
}

function validateResearchPaperSidecarArtifact(
  artifact: Record<string, unknown>,
): string[] {
  const issues: string[] = [];
  if (artifact.schema !== HELIX_PAPER_EVIDENCE_SIDECAR_SCHEMA) {
    return ["research_paper_sidecar_schema_invalid"];
  }
  const sidecar = artifact as unknown as HelixPaperEvidenceSidecarV1;
  const documentId = readString(sidecar.document_id);
  const sourceIntegrityHash = readString(sidecar.source_integrity_hash);
  if (
    sidecar.sidecar_kind !== "paper_evidence" ||
    !documentId ||
    !sourceIntegrityHash ||
    sidecar.sidecar_id !== `${documentId}:paper-evidence:v1`
  ) {
    issues.push("research_paper_sidecar_provenance_invalid");
  }
  if (
    !validIsoTimestamp(sidecar.generated_at) ||
    !validIsoTimestamp(sidecar.updated_at) ||
    Date.parse(sidecar.updated_at) < Date.parse(sidecar.generated_at)
  ) {
    issues.push("research_paper_sidecar_timestamp_invalid");
  }
  if (
    !Number.isInteger(sidecar.revision) ||
    sidecar.revision < 1 ||
    (sidecar.revision === 1 && sidecar.parent_revision !== null) ||
    (sidecar.revision > 1 && sidecar.parent_revision !== sidecar.revision - 1)
  ) {
    issues.push("research_paper_sidecar_revision_invalid");
  }
  if (
    sidecar.authority?.assistant_answer !== false ||
    sidecar.authority?.terminal_eligible !== false ||
    sidecar.authority?.raw_content_included !== true ||
    sidecar.authority?.validates_paper_claims !== false ||
    sidecar.authority?.exact_equation_authority !== false ||
    sidecar.authority?.theory_graph_promotion_allowed !== false
  ) {
    issues.push("research_paper_sidecar_authority_invalid");
  }
  if (
    !Array.isArray(sidecar.equation_candidates) ||
    !Array.isArray(sidecar.context_candidates) ||
    !sidecar.summary ||
    !sidecar.enrichment
  ) {
    issues.push("research_paper_sidecar_content_invalid");
    return issues;
  }
  const equationIds = new Set<string>();
  let paperCandidateInvalid = false;
  for (const candidate of sidecar.equation_candidates) {
    if (
      !readString(candidate.equation_id) ||
      equationIds.has(candidate.equation_id) ||
      !Number.isInteger(candidate.page) ||
      candidate.page < 1 ||
      !readString(candidate.source_text_ref) ||
      candidate.calculator?.auto_run_allowed !== false ||
      candidate.evidence?.exact_equation_authority !== false ||
      candidate.evidence?.claim_boundary !==
        "candidate_not_verified_exact_equation"
    ) {
      paperCandidateInvalid = true;
      break;
    }
    equationIds.add(candidate.equation_id);
  }
  const contextIds = new Set<string>();
  for (const candidate of sidecar.context_candidates) {
    if (
      !readString(candidate.item_id) ||
      contextIds.has(candidate.item_id) ||
      !Number.isInteger(candidate.page) ||
      candidate.page < 1 ||
      !readString(candidate.source_text_ref) ||
      !readString(candidate.text)
    ) {
      paperCandidateInvalid = true;
      break;
    }
    contextIds.add(candidate.item_id);
  }
  if (paperCandidateInvalid) {
    issues.push("research_paper_sidecar_candidate_provenance_invalid");
  }
  const countContext = (kind: "claim" | "limitation" | "value"): number =>
    sidecar.context_candidates.filter((candidate) => candidate.kind === kind)
      .length;
  const prefillReadyCount = sidecar.equation_candidates.filter(
    (candidate) => candidate.calculator.prefill_ready === true,
  ).length;
  const bindingRequiredCount = sidecar.equation_candidates.filter(
    (candidate) => candidate.calculator.binding_status !== "prefill_ready",
  ).length;
  if (
    sidecar.summary.equation_candidate_count !==
      sidecar.equation_candidates.length ||
    sidecar.summary.claim_candidate_count !== countContext("claim") ||
    sidecar.summary.limitation_candidate_count !== countContext("limitation") ||
    sidecar.summary.value_candidate_count !== countContext("value") ||
    sidecar.summary.calculator_prefill_ready_count !== prefillReadyCount ||
    sidecar.summary.calculator_binding_required_count !== bindingRequiredCount
  ) {
    issues.push("research_paper_sidecar_summary_mismatch");
  }
  const history = Array.isArray(sidecar.enrichment.history)
    ? sidecar.enrichment.history
    : [];
  if (
    sidecar.revision > 1 &&
    (history.length === 0 ||
      history.at(-1)?.to_revision !== sidecar.revision ||
      history.at(-1)?.proposal_id !== sidecar.enrichment.last_proposal_id)
  ) {
    issues.push("research_paper_sidecar_enrichment_history_invalid");
  }
  return issues;
}

const TYPED_OBSERVATION_SCHEMAS_BY_EVIDENCE_KIND: Partial<
  Record<TheoryExperimentEvidenceKindV1, readonly string[]>
> = {
  repo_observation: [
    "helix.repo_search_observation.v1",
    "helix.repo_code_evidence_observation.v1",
  ],
  calculator_observation: [
    "helix.calculator_receipt.v1",
    "helix.calculator_solve_observation.v1",
    "helix.calculator_scalar_solve_observation.v1",
    "helix.calculator_expression_classification_observation.v1",
    "helix.calculator_variable_binding_observation.v1",
  ],
  theory_reflection: [
    "helix_theory_context_reflection_tool_receipt/v1",
    "helix.theory_context_reflection_tool_receipt.v1",
    "helix.theory_context_reflection_observation.v1",
    "helix.theory_badge_graph_current_context_observation.v1",
  ],
};

const EXPECTED_SOURCE_CAPABILITY_BY_CLOSURE_EVIDENCE_KIND: Record<
  TheoryExperimentExecutionClosureEvidenceObservationV1["kind"],
  string
> = {
  semantic_admission: "theory-semantic-admitter.normalize",
  artifact_generation_receipt: "theory-artifact-producer.admit_lanyon_snapshot",
  formal_certificate: "theory-formal-verifier.read_result",
  numerical_certificate: "theory-independent-numerical-verifier.read_result",
  empirical_observation: "theory-empirical-observer.read_result",
};

function validateTypedObservationEvidenceArtifact(
  kind: TheoryExperimentEvidenceKindV1,
  artifact: Record<string, unknown>,
): string[] {
  const allowedSchemas = TYPED_OBSERVATION_SCHEMAS_BY_EVIDENCE_KIND[kind];
  if (!allowedSchemas) return [];
  const issues: string[] = [];
  const schema = artifactSchema(artifact);
  if (!schema || !allowedSchemas.includes(schema)) {
    issues.push(`${kind}_schema_invalid`);
  }
  const status = readString(artifact.status)?.toLowerCase();
  if (status && ["blocked", "failed", "error", "rejected"].includes(status)) {
    issues.push(`${kind}_not_succeeded`);
  }
  if (
    artifact.assistant_answer !== false ||
    artifact.terminal_eligible !== false
  ) {
    issues.push(`${kind}_authority_invalid`);
  }
  return issues;
}

async function validateEvidenceArtifact(
  kind: TheoryExperimentEvidenceKindV1,
  artifact: Record<string, unknown>,
): Promise<string[]> {
  if (kind === "scientific_image_sidecar") {
    return validateScientificImageSidecarArtifact(artifact);
  }
  if (kind === "research_paper_sidecar") {
    return validateResearchPaperSidecarArtifact(artifact);
  }
  if (kind === "semantic_admission") {
    return validateSemanticAdmissionArtifact(artifact);
  }
  if (kind === "artifact_generation_receipt") {
    const issues = (
      await validateCasimirArtifactGenerationReceiptIntegrityV1(artifact)
    ).map((issue) => `artifact_generation_receipt:${issue}`);
    if (readString(readRecord(artifact.run).status) !== "succeeded") {
      issues.push("artifact_generation_receipt:not_succeeded");
    }
    return issues;
  }
  if (kind === "formal_certificate") {
    const issues = (
      artifact.schemaVersion ===
      "casimir_formal_verification_certificate/v2"
        ? await validateCasimirFormalVerificationCertificateV2Integrity(
            artifact,
          )
        : await validateCasimirFormalVerificationCertificateIntegrityV1(
            artifact,
          )
    ).map((issue) => `formal_certificate:${issue}`);
    if (artifact.status !== "passed") {
      issues.push("formal_certificate:not_passed");
    }
    return issues;
  }
  if (kind === "numerical_certificate") {
    const issues = (
      await validateCasimirIndependentNumericalVerificationCertificateIntegrityV1(
        artifact,
      )
    ).map((issue) => `numerical_certificate:${issue}`);
    if (artifact.status !== "passed") {
      issues.push("numerical_certificate:not_passed");
    }
    return issues;
  }
  if (kind === "empirical_observation") {
    return ["empirical_observation_schema_unregistered"];
  }
  return validateTypedObservationEvidenceArtifact(kind, artifact);
}

const authoritativeArtifactRefs = (
  envelope: Record<string, unknown>,
): string[] => {
  const payload = readRecord(envelope.payload);
  return Array.from(
    new Set(
      [
        readString(envelope.artifact_id ?? envelope.artifactId),
        readString(envelope.sidecar_id ?? envelope.sidecarId),
        artifactIdentity(payload),
        ...readStringArray(
          envelope.produced_artifact_refs ?? envelope.producedArtifactRefs,
        ),
      ].filter((entry): entry is string => Boolean(entry)),
    ),
  );
};

const retainedSourceTurnId = (
  envelope: Record<string, unknown>,
): string | null => {
  const payload = readRecord(envelope.payload);
  const continuationLookup = readRecord(
    envelope.continuation_lookup ?? envelope.continuationLookup,
  );
  return (
    readString(envelope.source_turn_id ?? envelope.sourceTurnId) ??
    readString(envelope.prior_turn_id ?? envelope.priorTurnId) ??
    readString(payload.prior_turn_id ?? payload.priorTurnId) ??
    readString(
      continuationLookup.cached_turn_id ?? continuationLookup.cachedTurnId,
    )
  );
};

const sortedUniqueStrings = (values: readonly string[]): string[] =>
  Array.from(new Set(values.filter((value) => Boolean(value.trim())))).sort(
    (left, right) => left.localeCompare(right),
  );

const sha256OrNull = (value: unknown): string | null => {
  const candidate = readString(value);
  return candidate && /^[a-f0-9]{64}$/.test(candidate) ? candidate : null;
};

const lineageClaim = (
  claimId: unknown,
  propositionSha256: unknown,
  observableIds: unknown,
): TheoryExperimentEvidenceLineageV1["claims"][number] | null => {
  const id = readString(claimId);
  const proposition = sha256OrNull(propositionSha256);
  if (!id || !proposition) return null;
  return {
    claimId: id,
    propositionSha256: proposition,
    observableIds: sortedUniqueStrings(readStringArray(observableIds)),
  };
};

const lineageClaimsFromSemanticIr = (
  claimIr: Record<string, unknown>,
): TheoryExperimentEvidenceLineageV1["claims"] =>
  (Array.isArray(claimIr.claims) ? claimIr.claims : [])
    .map(readRecord)
    .map((claim) =>
      lineageClaim(claim.claimId, claim.propositionSha256, claim.observableIds),
    )
    .filter(
      (claim): claim is TheoryExperimentEvidenceLineageV1["claims"][number] =>
        Boolean(claim),
    )
    .sort((left, right) => left.claimId.localeCompare(right.claimId));

const nestedOrDirectIdentity = (
  source: Record<string, unknown>,
  nestedField: string,
  idField: string,
  hashField: string,
  directIdFields: string[],
  directHashFields: string[],
): { id: string | null; artifactSha256: string | null } => {
  const nested = readRecord(source[nestedField]);
  return {
    id:
      readString(nested[idField]) ??
      directIdFields
        .map((field) => readString(source[field]))
        .find((value): value is string => Boolean(value)) ??
      null,
    artifactSha256:
      sha256OrNull(nested[hashField]) ??
      directHashFields
        .map((field) => sha256OrNull(source[field]))
        .find((value): value is string => Boolean(value)) ??
      null,
  };
};

function intrinsicEvidenceLineage(input: {
  kind: TheoryExperimentEvidenceKindV1;
  artifact: Record<string, unknown>;
  procedureId: string;
}): TheoryExperimentEvidenceLineageV1 | null {
  if (input.kind === "semantic_admission") {
    const claimIr = readRecord(
      input.artifact.claim_ir ?? input.artifact.claimIr,
    );
    const receipt = readRecord(
      input.artifact.semantic_admission_receipt ??
        input.artifact.semanticAdmissionReceipt,
    );
    const world = readRecord(claimIr.world);
    const semanticSha256 = sha256OrNull(claimIr.semanticSha256);
    const artifactSha256 = sha256OrNull(claimIr.artifactSha256);
    const claims = lineageClaimsFromSemanticIr(claimIr);
    if (!semanticSha256 || !artifactSha256 || claims.length === 0) return null;
    return {
      sourceKind: "semantic_claim_ir",
      procedureId: input.procedureId,
      candidateBadgeIds: sortedUniqueStrings(readStringArray(world.badgeIds)),
      casimirSpecId: readString(claimIr.specId),
      casimirSpecSemanticSha256: semanticSha256,
      casimirSpecArtifactSha256: artifactSha256,
      claims,
      sourceGraphId: readString(world.graphId),
      sourceGraphSnapshotSha256: sha256OrNull(
        receipt.graphSnapshotSha256 ?? receipt.graph_snapshot_sha256,
      ),
      sourceMasterProblemPlanId: null,
      sourceMasterProblemArtifactSha256: null,
      sourceDerivationProgramId: null,
      sourceDerivationProgramArtifactSha256: null,
      requestArtifactSha256: null,
      frozenCase: null,
    };
  }

  if (input.kind === "artifact_generation_receipt") {
    const request = readRecord(input.artifact.request);
    const spec = readRecord(request.casimirSpec);
    const masterProblem = nestedOrDirectIdentity(
      request,
      "masterProblem",
      "planId",
      "artifactSha256",
      ["masterProblemPlanId"],
      ["masterProblemArtifactSha256"],
    );
    const derivationProgram = nestedOrDirectIdentity(
      request,
      "derivationProgram",
      "programId",
      "artifactSha256",
      ["derivationProgramId"],
      ["derivationProgramArtifactSha256"],
    );
    const claim = lineageClaim(request.claimId, request.propositionSha256, []);
    const semanticSha256 =
      sha256OrNull(spec.semanticSha256) ??
      sha256OrNull(request.casimirSpecSemanticSha256);
    const artifactSha256 =
      sha256OrNull(spec.artifactSha256) ??
      sha256OrNull(request.casimirSpecArtifactSha256);
    if (!claim || !semanticSha256 || !artifactSha256) return null;
    return {
      sourceKind: "artifact_generation_request",
      procedureId: input.procedureId,
      candidateBadgeIds: [],
      casimirSpecId: readString(spec.specId),
      casimirSpecSemanticSha256: semanticSha256,
      casimirSpecArtifactSha256: artifactSha256,
      claims: [claim],
      sourceGraphId: null,
      sourceGraphSnapshotSha256: null,
      sourceMasterProblemPlanId: masterProblem.id,
      sourceMasterProblemArtifactSha256: masterProblem.artifactSha256,
      sourceDerivationProgramId: derivationProgram.id,
      sourceDerivationProgramArtifactSha256: derivationProgram.artifactSha256,
      requestArtifactSha256: sha256OrNull(request.artifactSha256),
      frozenCase: null,
    };
  }

  if (input.kind === "formal_certificate") {
    const request = readRecord(input.artifact.request);
    const spec = readRecord(request.casimirSpec);
    const v2 =
      input.artifact.schemaVersion ===
      "casimir_formal_verification_certificate/v2";
    const masterProblem = v2
      ? {
          id: readString(request.masterProblemPlanId),
          artifactSha256: sha256OrNull(
            request.masterProblemArtifactSha256,
          ),
        }
      : nestedOrDirectIdentity(
          request,
          "masterProblem",
          "planId",
          "artifactSha256",
          ["masterProblemPlanId"],
          ["masterProblemArtifactSha256"],
        );
    const derivationProgram = v2
      ? {
          id: readString(request.derivationProgramId),
          artifactSha256: sha256OrNull(
            request.derivationProgramArtifactSha256,
          ),
        }
      : nestedOrDirectIdentity(
          request,
          "derivationProgram",
          "programId",
          "artifactSha256",
          ["derivationProgramId"],
          ["derivationProgramArtifactSha256"],
        );
    const theoryGraph = readRecord(request.theoryGraph);
    const theorem = readRecord(input.artifact.theorem);
    const claim = lineageClaim(
      theorem.claimId,
      request.semanticPropositionSha256 ??
        request.propositionSha256 ??
        theorem.statementSha256,
      [],
    );
    const semanticSha256 =
      sha256OrNull(spec.semanticSha256) ??
      sha256OrNull(request.casimirSpecSemanticSha256);
    const artifactSha256 =
      sha256OrNull(spec.artifactSha256) ??
      sha256OrNull(request.casimirSpecArtifactSha256);
    if (
      !claim ||
      !semanticSha256 ||
      !artifactSha256 ||
      !masterProblem.id ||
      !masterProblem.artifactSha256 ||
      !derivationProgram.id ||
      !derivationProgram.artifactSha256
    )
      return null;
    return {
      sourceKind: "formal_verification_request",
      procedureId: input.procedureId,
      candidateBadgeIds: v2
        ? readStringArray(request.candidateBadgeIds)
        : [],
      casimirSpecId:
        readString(request.casimirSpecId) ??
        readString(spec.specId),
      casimirSpecSemanticSha256: semanticSha256,
      casimirSpecArtifactSha256: artifactSha256,
      claims: [claim],
      sourceGraphId:
        readString(request.graphId) ??
        readString(theoryGraph.graphId) ??
        readString(request.theoryGraphId),
      sourceGraphSnapshotSha256:
        sha256OrNull(request.graphSnapshotSha256) ??
        sha256OrNull(theoryGraph.snapshotSha256) ??
        sha256OrNull(request.theoryGraphSnapshotSha256),
      sourceMasterProblemPlanId: masterProblem.id,
      sourceMasterProblemArtifactSha256: masterProblem.artifactSha256,
      sourceDerivationProgramId: derivationProgram.id,
      sourceDerivationProgramArtifactSha256: derivationProgram.artifactSha256,
      requestArtifactSha256: sha256OrNull(request.artifactSha256),
      frozenCase: null,
    };
  }

  if (input.kind === "numerical_certificate") {
    const request = readRecord(input.artifact.request);
    const spec = readRecord(request.casimirSpec);
    const frozen = readRecord(request.frozenCase);
    const claim = lineageClaim(
      request.claimId,
      request.propositionSha256,
      frozen.observableIds ?? request.observableIds,
    );
    const semanticSha256 =
      sha256OrNull(spec.semanticSha256) ??
      sha256OrNull(request.casimirSpecSemanticSha256);
    const artifactSha256 =
      sha256OrNull(spec.artifactSha256) ??
      sha256OrNull(request.casimirSpecArtifactSha256);
    const caseId =
      readString(frozen.caseId) ?? readString(request.frozenCaseId);
    const inputsSha256 =
      sha256OrNull(frozen.inputsSha256) ??
      sha256OrNull(request.frozenCaseInputsSha256);
    const meshSha256 =
      sha256OrNull(frozen.meshSha256) ??
      sha256OrNull(request.frozenCaseMeshSha256);
    const initialConditionsSha256 =
      sha256OrNull(frozen.initialConditionsSha256) ??
      sha256OrNull(request.frozenCaseInitialConditionsSha256);
    const boundaryConditionsSha256 =
      sha256OrNull(frozen.boundaryConditionsSha256) ??
      sha256OrNull(request.frozenCaseBoundaryConditionsSha256);
    if (
      !claim ||
      !semanticSha256 ||
      !artifactSha256 ||
      !caseId ||
      !inputsSha256 ||
      !meshSha256 ||
      !initialConditionsSha256 ||
      !boundaryConditionsSha256 ||
      claim.observableIds.length === 0
    ) {
      return null;
    }
    return {
      sourceKind: "numerical_verification_request",
      procedureId: input.procedureId,
      candidateBadgeIds: [],
      casimirSpecId: readString(spec.specId),
      casimirSpecSemanticSha256: semanticSha256,
      casimirSpecArtifactSha256: artifactSha256,
      claims: [claim],
      sourceGraphId: null,
      sourceGraphSnapshotSha256: null,
      sourceMasterProblemPlanId: null,
      sourceMasterProblemArtifactSha256: null,
      sourceDerivationProgramId: null,
      sourceDerivationProgramArtifactSha256: null,
      requestArtifactSha256: sha256OrNull(request.artifactSha256),
      frozenCase: {
        caseId,
        inputsSha256,
        meshSha256,
        initialConditionsSha256,
        boundaryConditionsSha256,
        observableIds: claim.observableIds,
      },
    };
  }

  return null;
}

async function bindEvidenceArtifacts(input: {
  raw: unknown;
  turnId: string;
  procedureId: string;
  authoritativeEvidenceArtifacts?: unknown[];
}): Promise<{
  bindings: TheoryExperimentEvidenceBindingV1[];
  issues: string[];
}> {
  if (input.raw === undefined) return { bindings: [], issues: [] };
  if (!Array.isArray(input.raw)) {
    return { bindings: [], issues: ["evidence_artifacts_must_be_array"] };
  }
  if (input.raw.length === 0) return { bindings: [], issues: [] };
  if (!Array.isArray(input.authoritativeEvidenceArtifacts)) {
    return {
      bindings: [],
      issues: ["authoritative_evidence_artifacts_required"],
    };
  }
  const authoritativeEnvelopes =
    input.authoritativeEvidenceArtifacts.map(readRecord);
  const bindings: TheoryExperimentEvidenceBindingV1[] = [];
  const issues: string[] = [];
  for (const [index, rawEntry] of input.raw.entries()) {
    const entry = readRecord(rawEntry);
    const kind = evidenceKind(entry.kind);
    const artifactRef = readString(entry.artifact_ref ?? entry.artifactRef);
    const claimedSourceTurnId = readString(
      entry.source_turn_id ?? entry.sourceTurnId,
    );
    const artifact = readRecord(entry.artifact);
    if (!kind) {
      issues.push(`evidence_artifacts[${index}].kind_invalid`);
      continue;
    }
    if (!artifactRef) {
      issues.push(`evidence_artifacts[${index}].artifact_ref_required`);
      continue;
    }
    if (Object.keys(artifact).length === 0) {
      issues.push(`evidence_artifacts[${index}].artifact_required`);
      continue;
    }
    const schema = artifactSchema(artifact);
    if (!schema) {
      issues.push(`evidence_artifacts[${index}].artifact_schema_required`);
      continue;
    }
    if (
      kind === "scientific_image_sidecar" &&
      schema !== SCIENTIFIC_IMAGE_EVIDENCE_SIDECAR_SCHEMA
    ) {
      issues.push(
        `evidence_artifacts[${index}].scientific_image_sidecar_schema_invalid`,
      );
      continue;
    }
    if (
      kind === "research_paper_sidecar" &&
      schema !== HELIX_PAPER_EVIDENCE_SIDECAR_SCHEMA
    ) {
      issues.push(
        `evidence_artifacts[${index}].research_paper_sidecar_schema_invalid`,
      );
      continue;
    }
    const requestArtifactIdentity = artifactIdentity(artifact);
    if (
      (kind === "scientific_image_sidecar" ||
        kind === "research_paper_sidecar") &&
      requestArtifactIdentity &&
      requestArtifactIdentity !== artifactRef
    ) {
      issues.push(`evidence_artifacts[${index}].artifact_id_alias_mismatch`);
      continue;
    }

    const authoritativeMatches = authoritativeEnvelopes.filter((envelope) =>
      authoritativeArtifactRefs(envelope).includes(artifactRef),
    );
    if (authoritativeMatches.length === 0) {
      issues.push(
        `evidence_artifacts[${index}].authoritative_evidence_artifact_not_admitted`,
      );
      continue;
    }
    if (authoritativeMatches.length > 1) {
      issues.push(
        `evidence_artifacts[${index}].authoritative_evidence_artifact_ambiguous`,
      );
      continue;
    }
    const authoritativeEnvelope = authoritativeMatches[0];
    if (authoritativeEnvelope.schema !== "helix.current_turn_artifact.v1") {
      issues.push(
        `evidence_artifacts[${index}].authoritative_evidence_envelope_schema_invalid`,
      );
      continue;
    }
    if (
      readString(
        authoritativeEnvelope.turn_id ?? authoritativeEnvelope.turnId,
      ) !== input.turnId
    ) {
      issues.push(
        `evidence_artifacts[${index}].authoritative_evidence_admission_turn_mismatch`,
      );
      continue;
    }
    if (
      authoritativeEnvelope.assistant_answer !== false ||
      authoritativeEnvelope.terminal_eligible !== false
    ) {
      issues.push(
        `evidence_artifacts[${index}].authoritative_evidence_authority_invalid`,
      );
      continue;
    }
    const expectedSourceCapability =
      EXPECTED_SOURCE_CAPABILITY_BY_CLOSURE_EVIDENCE_KIND[
        kind as keyof typeof EXPECTED_SOURCE_CAPABILITY_BY_CLOSURE_EVIDENCE_KIND
      ];
    if (expectedSourceCapability) {
      const sourceCapability = readString(
        authoritativeEnvelope.source_capability_id ??
          authoritativeEnvelope.sourceCapabilityId ??
          authoritativeEnvelope.capability_key ??
          authoritativeEnvelope.capabilityKey,
      );
      if (sourceCapability !== expectedSourceCapability) {
        issues.push(
          `evidence_artifacts[${index}].authoritative_evidence_source_capability_invalid`,
        );
        continue;
      }
    }
    const authoritativeArtifact = readRecord(authoritativeEnvelope.payload);
    if (Object.keys(authoritativeArtifact).length === 0) {
      issues.push(
        `evidence_artifacts[${index}].authoritative_evidence_payload_missing`,
      );
      continue;
    }

    const sourceScope =
      readString(
        authoritativeEnvelope.source_scope ?? authoritativeEnvelope.sourceScope,
      ) ?? "current_turn_context";
    const retained =
      sourceScope === "prior_turn_context" ||
      sourceScope === "retained_and_readmitted";
    if (
      !retained &&
      !["current_turn_context", "current_turn", "same_turn"].includes(
        sourceScope,
      )
    ) {
      issues.push(
        `evidence_artifacts[${index}].authoritative_evidence_source_scope_invalid`,
      );
      continue;
    }
    const sourceTurnId = retained
      ? retainedSourceTurnId(authoritativeEnvelope)
      : input.turnId;
    if (!sourceTurnId || (retained && sourceTurnId === input.turnId)) {
      issues.push(
        `evidence_artifacts[${index}].authoritative_evidence_source_turn_invalid`,
      );
      continue;
    }
    const envelopeClaimedSourceTurnId = readString(
      authoritativeEnvelope.source_turn_id ??
        authoritativeEnvelope.sourceTurnId,
    );
    if (
      !retained &&
      envelopeClaimedSourceTurnId &&
      envelopeClaimedSourceTurnId !== input.turnId
    ) {
      issues.push(
        `evidence_artifacts[${index}].authoritative_evidence_source_turn_invalid`,
      );
      continue;
    }
    if (claimedSourceTurnId && claimedSourceTurnId !== sourceTurnId) {
      issues.push(`evidence_artifacts[${index}].source_turn_id_mismatch`);
      continue;
    }
    const admission = retained
      ? "retained_and_readmitted"
      : "current_turn_admitted";
    const claimedAdmission = readString(entry.admission);
    if (claimedAdmission && claimedAdmission !== admission) {
      issues.push(`evidence_artifacts[${index}].admission_mismatch`);
      continue;
    }

    const [requestedArtifactSha256, authoritativeArtifactSha256] =
      await Promise.all([
        computeCasimirSpecValueSha256V1(artifact),
        computeCasimirSpecValueSha256V1(authoritativeArtifact),
      ]);
    if (requestedArtifactSha256 !== authoritativeArtifactSha256) {
      issues.push(
        `evidence_artifacts[${index}].artifact_content_hash_mismatch`,
      );
      continue;
    }
    const envelopeContentSha256 = readString(
      authoritativeEnvelope.content_sha256 ??
        authoritativeEnvelope.contentSha256,
    );
    if (
      envelopeContentSha256 &&
      envelopeContentSha256 !== authoritativeArtifactSha256
    ) {
      issues.push(
        `evidence_artifacts[${index}].authoritative_content_hash_mismatch`,
      );
      continue;
    }
    const requestedContentSha256 = readString(
      entry.content_sha256 ?? entry.contentSha256,
    );
    if (
      requestedContentSha256 &&
      requestedContentSha256 !== authoritativeArtifactSha256
    ) {
      issues.push(
        `evidence_artifacts[${index}].requested_content_hash_mismatch`,
      );
      continue;
    }
    const artifactIssues = await validateEvidenceArtifact(
      kind,
      authoritativeArtifact,
    );
    if (artifactIssues.length > 0) {
      issues.push(
        ...artifactIssues.map(
          (issue) => `evidence_artifacts[${index}].${issue}`,
        ),
      );
      continue;
    }
    const lineage = intrinsicEvidenceLineage({
      kind,
      artifact: authoritativeArtifact,
      procedureId: input.procedureId,
    });
    if (
      [
        "semantic_admission",
        "artifact_generation_receipt",
        "formal_certificate",
        "numerical_certificate",
        "empirical_observation",
      ].includes(kind) &&
      !lineage
    ) {
      issues.push(`evidence_artifacts[${index}].scientific_lineage_incomplete`);
      continue;
    }
    bindings.push({
      artifactRef,
      kind,
      schema,
      sourceTurnId,
      admissionTurnId: input.turnId,
      contentSha256: authoritativeArtifactSha256,
      admission,
      lineage,
      authority: "evidence_only",
      assistantAnswer: false,
      terminalEligible: false,
    });
  }
  return { bindings, issues };
}

async function scopeEvidenceBindingsToProcedure(input: {
  bindings: TheoryExperimentEvidenceBindingV1[];
  procedure: TheoryExperimentProcedureV1;
}): Promise<{
  bindings: TheoryExperimentEvidenceBindingV1[];
  issues: string[];
}> {
  const issues: string[] = [];
  const [masterProblemArtifactSha256, derivationProgramArtifactSha256] =
    await Promise.all([
      computeCasimirSpecValueSha256V1(input.procedure.masterProblem),
      computeCasimirSpecValueSha256V1(input.procedure.derivationProgram),
    ]);
  const candidateIds = new Set([
    ...input.procedure.request.selectedBadgeIds,
    ...input.procedure.request.comparisonBadgeIds,
  ]);
  const semanticBindings = input.bindings
    .filter(
      (
        binding,
      ): binding is TheoryExperimentEvidenceBindingV1 & {
        lineage: TheoryExperimentEvidenceLineageV1;
      } =>
        binding.kind === "semantic_admission" &&
        binding.lineage?.sourceKind === "semantic_claim_ir",
    )
    .map((binding) => {
      const candidateBadgeIds = sortedUniqueStrings(
        binding.lineage.candidateBadgeIds.filter((badgeId) =>
          candidateIds.has(badgeId),
        ),
      );
      const lineage: TheoryExperimentEvidenceLineageV1 = {
        ...binding.lineage,
        candidateBadgeIds,
      };
      if (lineage.sourceGraphId !== input.procedure.graphId) {
        issues.push(`${binding.artifactRef}:semantic_graph_identity_mismatch`);
      }
      if (!lineage.sourceGraphSnapshotSha256) {
        issues.push(`${binding.artifactRef}:semantic_graph_snapshot_required`);
      }
      if (candidateBadgeIds.length === 0) {
        issues.push(`${binding.artifactRef}:semantic_candidate_scope_empty`);
      }
      return { ...binding, lineage };
    });

  const semanticByRef = new Map(
    semanticBindings.map((binding) => [binding.artifactRef, binding]),
  );
  const scoped = input.bindings.map((binding) => {
    if (binding.kind === "semantic_admission") {
      return semanticByRef.get(binding.artifactRef) ?? binding;
    }
    const lineage = binding.lineage;
    if (!lineage) return { ...binding, lineage: null };
    if (lineage.sourceKind === "empirical_observation") {
      issues.push(`${binding.artifactRef}:empirical_lineage_unregistered`);
      return binding;
    }
    const claim = lineage.claims[0];
    const semanticMatches = semanticBindings.filter((semantic) => {
      const semanticLineage = semantic.lineage;
      return (
        semanticLineage.casimirSpecSemanticSha256 ===
          lineage.casimirSpecSemanticSha256 &&
        semanticLineage.casimirSpecArtifactSha256 ===
          lineage.casimirSpecArtifactSha256 &&
        semanticLineage.claims.some(
          (candidate) =>
            candidate.claimId === claim?.claimId &&
            candidate.propositionSha256 === claim?.propositionSha256,
        )
      );
    });
    if (semanticMatches.length === 0) {
      issues.push(`${binding.artifactRef}:semantic_claim_lineage_not_bound`);
      return binding;
    }
    if (semanticMatches.length > 1) {
      issues.push(`${binding.artifactRef}:semantic_claim_lineage_ambiguous`);
      return binding;
    }
    const semantic = semanticMatches[0].lineage;
    const semanticClaim = semantic.claims.find(
      (candidate) =>
        candidate.claimId === claim?.claimId &&
        candidate.propositionSha256 === claim?.propositionSha256,
    );
    if (!semanticClaim) {
      issues.push(`${binding.artifactRef}:semantic_claim_lineage_not_bound`);
      return binding;
    }

    if (
      lineage.sourceKind === "artifact_generation_request" ||
      lineage.sourceKind === "formal_verification_request"
    ) {
      if (
        lineage.sourceMasterProblemPlanId !==
          input.procedure.masterProblem.planId ||
        lineage.sourceMasterProblemArtifactSha256 !==
          masterProblemArtifactSha256
      ) {
        issues.push(`${binding.artifactRef}:master_problem_lineage_mismatch`);
      }
      if (
        lineage.sourceDerivationProgramId !==
          input.procedure.derivationProgram.programId ||
        lineage.sourceDerivationProgramArtifactSha256 !==
          derivationProgramArtifactSha256
      ) {
        issues.push(
          `${binding.artifactRef}:derivation_program_lineage_mismatch`,
        );
      }
    }
    if (lineage.sourceKind === "formal_verification_request") {
      if (
        !lineage.casimirSpecId ||
        lineage.casimirSpecId !== semantic.casimirSpecId
      ) {
        issues.push(
          `${binding.artifactRef}:formal_spec_identity_lineage_mismatch`,
        );
      }
      if (
        JSON.stringify(sortedUniqueStrings(lineage.candidateBadgeIds)) !==
        JSON.stringify(sortedUniqueStrings(semantic.candidateBadgeIds))
      ) {
        issues.push(
          `${binding.artifactRef}:formal_candidate_badge_lineage_mismatch`,
        );
      }
      if (
        lineage.sourceGraphId !== input.procedure.graphId ||
        !semantic.sourceGraphSnapshotSha256 ||
        lineage.sourceGraphSnapshotSha256 !== semantic.sourceGraphSnapshotSha256
      ) {
        issues.push(
          `${binding.artifactRef}:formal_graph_snapshot_lineage_mismatch`,
        );
      }
    }
    if (lineage.sourceKind === "numerical_verification_request") {
      if (
        !lineage.frozenCase ||
        lineage.frozenCase.caseId !==
          input.procedure.lanyonEligibility.requestedCaseId
      ) {
        issues.push(`${binding.artifactRef}:numerical_case_lineage_mismatch`);
      } else {
        const declaredObservableIds = new Set(semanticClaim.observableIds);
        if (
          lineage.frozenCase.observableIds.some(
            (observableId) => !declaredObservableIds.has(observableId),
          )
        ) {
          issues.push(
            `${binding.artifactRef}:numerical_observable_lineage_mismatch`,
          );
        }
        const targetObservable =
          input.procedure.request.targetObservable?.trim() ?? "";
        if (
          targetObservable &&
          !lineage.frozenCase.observableIds.includes(targetObservable)
        ) {
          issues.push(
            `${binding.artifactRef}:target_observable_lineage_mismatch`,
          );
        }
      }
    }

    return {
      ...binding,
      lineage: {
        ...lineage,
        procedureId: input.procedure.procedureId,
        candidateBadgeIds: [...semantic.candidateBadgeIds],
        casimirSpecId: semantic.casimirSpecId,
        claims: [
          {
            claimId: semanticClaim.claimId,
            propositionSha256: semanticClaim.propositionSha256,
            observableIds: [...semanticClaim.observableIds],
          },
        ],
        ...(lineage.frozenCase
          ? {
              frozenCase: {
                ...lineage.frozenCase,
                observableIds: [...lineage.frozenCase.observableIds],
              },
            }
          : {}),
      },
    };
  });

  return {
    bindings: scoped,
    issues: sortedUniqueStrings(issues),
  };
}

const sameSortedStrings = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  JSON.stringify(sortedUniqueStrings(left)) ===
  JSON.stringify(sortedUniqueStrings(right));

const intrinsicLineageMatchesBinding = (
  intrinsic: TheoryExperimentEvidenceLineageV1,
  bound: TheoryExperimentEvidenceLineageV1,
): boolean => {
  if (
    intrinsic.sourceKind !== bound.sourceKind ||
    intrinsic.procedureId !== bound.procedureId ||
    intrinsic.casimirSpecSemanticSha256 !== bound.casimirSpecSemanticSha256 ||
    intrinsic.casimirSpecArtifactSha256 !== bound.casimirSpecArtifactSha256 ||
    intrinsic.sourceGraphId !== bound.sourceGraphId ||
    intrinsic.sourceGraphSnapshotSha256 !== bound.sourceGraphSnapshotSha256 ||
    intrinsic.sourceMasterProblemPlanId !== bound.sourceMasterProblemPlanId ||
    intrinsic.sourceMasterProblemArtifactSha256 !==
      bound.sourceMasterProblemArtifactSha256 ||
    intrinsic.sourceDerivationProgramId !== bound.sourceDerivationProgramId ||
    intrinsic.sourceDerivationProgramArtifactSha256 !==
      bound.sourceDerivationProgramArtifactSha256 ||
    intrinsic.requestArtifactSha256 !== bound.requestArtifactSha256
  ) {
    return false;
  }
  if (
    intrinsic.casimirSpecId &&
    intrinsic.casimirSpecId !== bound.casimirSpecId
  ) {
    return false;
  }
  if (
    !bound.candidateBadgeIds.every((badgeId) =>
      intrinsic.sourceKind === "semantic_claim_ir"
        ? intrinsic.candidateBadgeIds.includes(badgeId)
        : true,
    )
  ) {
    return false;
  }
  if (
    intrinsic.claims.length !== bound.claims.length &&
    intrinsic.sourceKind === "semantic_claim_ir"
  ) {
    return false;
  }
  for (const claim of intrinsic.claims) {
    const boundClaim = bound.claims.find(
      (candidate) =>
        candidate.claimId === claim.claimId &&
        candidate.propositionSha256 === claim.propositionSha256,
    );
    if (!boundClaim) return false;
    if (
      intrinsic.sourceKind === "semantic_claim_ir" &&
      !sameSortedStrings(claim.observableIds, boundClaim.observableIds)
    ) {
      return false;
    }
  }
  if ((intrinsic.frozenCase === null) !== (bound.frozenCase === null)) {
    return false;
  }
  if (intrinsic.frozenCase && bound.frozenCase) {
    if (
      intrinsic.frozenCase.caseId !== bound.frozenCase.caseId ||
      intrinsic.frozenCase.inputsSha256 !== bound.frozenCase.inputsSha256 ||
      intrinsic.frozenCase.meshSha256 !== bound.frozenCase.meshSha256 ||
      intrinsic.frozenCase.initialConditionsSha256 !==
        bound.frozenCase.initialConditionsSha256 ||
      intrinsic.frozenCase.boundaryConditionsSha256 !==
        bound.frozenCase.boundaryConditionsSha256 ||
      !sameSortedStrings(
        intrinsic.frozenCase.observableIds,
        bound.frozenCase.observableIds,
      )
    ) {
      return false;
    }
  }
  return true;
};

const CLOSURE_EVIDENCE_KINDS = new Set<
  TheoryExperimentExecutionClosureEvidenceObservationV1["kind"]
>([
  "semantic_admission",
  "artifact_generation_receipt",
  "formal_certificate",
  "numerical_certificate",
  "empirical_observation",
]);

const isClosureEvidenceKind = (
  value: unknown,
): value is TheoryExperimentExecutionClosureEvidenceObservationV1["kind"] =>
  typeof value === "string" &&
  CLOSURE_EVIDENCE_KINDS.has(
    value as TheoryExperimentExecutionClosureEvidenceObservationV1["kind"],
  );

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

async function resolveAuthoritativeProcedureArtifact(input: {
  artifactRef: string | null;
  procedureId: string;
  procedureSha256: string;
  turnId: string;
  authoritativeEvidenceArtifacts?: unknown[];
}): Promise<{
  artifactRef: string | null;
  procedure: TheoryExperimentProcedureV1 | null;
  issues: string[];
}> {
  if (!Array.isArray(input.authoritativeEvidenceArtifacts)) {
    return {
      artifactRef: null,
      procedure: null,
      issues: ["authoritative_evidence_artifacts_required"],
    };
  }
  const candidates = input.authoritativeEvidenceArtifacts
    .map(readRecord)
    .filter(
      (envelope) =>
        envelope.schema === "helix.current_turn_artifact.v1" &&
        readString(envelope.turn_id ?? envelope.turnId) === input.turnId &&
        envelope.assistant_answer === false &&
        envelope.terminal_eligible === false,
    )
    .map((envelope) => {
      const payload = readRecord(envelope.payload);
      const procedure = readRecord(payload.procedure);
      return {
        envelope,
        payload,
        procedure,
        refs: authoritativeArtifactRefs(envelope),
      };
    })
    .filter(
      (candidate) =>
        candidate.payload.schema ===
          THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA &&
        candidate.payload.status === "succeeded" &&
        candidate.payload.assistant_answer === false &&
        candidate.payload.terminal_eligible === false &&
        candidate.procedure.artifactId === "theory_experiment_procedure" &&
        candidate.procedure.schemaVersion ===
          "theory_experiment_procedure/v1" &&
        candidate.procedure.procedureId === input.procedureId &&
        candidate.procedure.procedureSha256 === input.procedureSha256 &&
        (!input.artifactRef || candidate.refs.includes(input.artifactRef)),
    );
  if (candidates.length === 0) {
    return {
      artifactRef: null,
      procedure: null,
      issues: ["authoritative_procedure_artifact_not_admitted"],
    };
  }
  if (candidates.length > 1) {
    return {
      artifactRef: null,
      procedure: null,
      issues: ["authoritative_procedure_artifact_ambiguous"],
    };
  }
  const candidate = candidates[0];
  const procedure = candidate.procedure as TheoryExperimentProcedureV1;
  const integrityIssues = await validateProcedureIntegrity(procedure);
  if (integrityIssues.length > 0) {
    return {
      artifactRef: null,
      procedure: null,
      issues: integrityIssues.map((issue) => `procedure:${issue}`),
    };
  }
  const artifactRef =
    input.artifactRef ??
    readString(candidate.envelope.artifact_id ?? candidate.envelope.artifactId);
  if (!artifactRef) {
    return {
      artifactRef: null,
      procedure: null,
      issues: ["authoritative_procedure_artifact_ref_missing"],
    };
  }
  return { artifactRef, procedure, issues: [] };
}

async function collectClosureEvidenceObservations(input: {
  procedure: TheoryExperimentProcedureV1;
  turnId: string;
  authoritativeEvidenceArtifacts?: unknown[];
}): Promise<{
  observations: TheoryExperimentExecutionClosureEvidenceObservationV1[];
  issues: string[];
}> {
  const observations = new Map<
    string,
    TheoryExperimentExecutionClosureEvidenceObservationV1
  >();
  const issues: string[] = [];
  const boundBindings = input.procedure.evidenceBindings.filter(
    (
      binding,
    ): binding is TheoryExperimentEvidenceBindingV1 & {
      kind: TheoryExperimentExecutionClosureEvidenceObservationV1["kind"];
      lineage: TheoryExperimentEvidenceLineageV1;
    } => isClosureEvidenceKind(binding.kind) && Boolean(binding.lineage),
  );
  for (const binding of boundBindings) {
    observations.set(`${binding.kind}:${binding.artifactRef}`, {
      artifactRef: binding.artifactRef,
      boundArtifactRef: binding.artifactRef,
      kind: binding.kind,
      schema: binding.schema,
      contentSha256: binding.contentSha256,
      sourceTurnId: binding.sourceTurnId,
      status: "referenced",
      scope: "bound_procedure_reference",
      closureSatisfied: false,
      lineage: binding.lineage,
      authority: "evidence_only",
    });
  }
  if (!Array.isArray(input.authoritativeEvidenceArtifacts)) {
    return {
      observations: Array.from(observations.values()),
      issues: ["authoritative_evidence_artifacts_required"],
    };
  }
  for (const rawEnvelope of input.authoritativeEvidenceArtifacts) {
    const envelope = readRecord(rawEnvelope);
    const kind = readString(envelope.kind ?? envelope.observation_kind);
    if (!isClosureEvidenceKind(kind)) continue;
    if (
      envelope.schema !== "helix.current_turn_artifact.v1" ||
      readString(envelope.turn_id ?? envelope.turnId) !== input.turnId ||
      envelope.assistant_answer !== false ||
      envelope.terminal_eligible !== false
    ) {
      issues.push(`${kind}:authoritative_envelope_invalid`);
      continue;
    }
    const sourceCapability = readString(
      envelope.source_capability_id ??
        envelope.sourceCapabilityId ??
        envelope.capability_key ??
        envelope.capabilityKey,
    );
    if (
      sourceCapability !==
      EXPECTED_SOURCE_CAPABILITY_BY_CLOSURE_EVIDENCE_KIND[kind]
    ) {
      issues.push(`${kind}:authoritative_source_capability_invalid`);
      continue;
    }
    const artifactRef = readString(envelope.artifact_id ?? envelope.artifactId);
    const payload = readRecord(envelope.payload);
    if (!artifactRef || Object.keys(payload).length === 0) {
      issues.push(`${kind}:authoritative_payload_missing`);
      continue;
    }
    const contentSha256 = await computeCasimirSpecValueSha256V1(payload);
    const claimedContentSha256 = readString(
      envelope.content_sha256 ?? envelope.contentSha256,
    );
    if (claimedContentSha256 && claimedContentSha256 !== contentSha256) {
      issues.push(`${kind}:authoritative_content_hash_mismatch`);
      continue;
    }
    let integrityIssues: string[] = [];
    let status: TheoryExperimentExecutionClosureEvidenceObservationV1["status"] =
      "admitted";
    if (kind === "semantic_admission") {
      integrityIssues = await validateSemanticAdmissionArtifact(payload);
    } else if (kind === "artifact_generation_receipt") {
      integrityIssues =
        await validateCasimirArtifactGenerationReceiptIntegrityV1(payload);
      status =
        readString(readRecord(payload.run).status) === "succeeded"
          ? "admitted"
          : "failed";
    } else if (kind === "formal_certificate") {
      integrityIssues =
        payload.schemaVersion ===
        "casimir_formal_verification_certificate/v2"
          ? await validateCasimirFormalVerificationCertificateV2Integrity(
              payload,
            )
          : await validateCasimirFormalVerificationCertificateIntegrityV1(
              payload,
            );
      status =
        payload.status === "passed"
          ? "passed"
          : payload.status === "failed"
            ? "failed"
            : "blocked";
    } else if (kind === "numerical_certificate") {
      integrityIssues =
        await validateCasimirIndependentNumericalVerificationCertificateIntegrityV1(
          payload,
        );
      status =
        payload.status === "passed"
          ? "passed"
          : payload.status === "failed"
            ? "failed"
            : "blocked";
    } else {
      integrityIssues = ["empirical_observation_schema_unregistered"];
      status = "blocked";
    }
    if (integrityIssues.length > 0) {
      issues.push(...integrityIssues.map((issue) => `${kind}:${issue}`));
      continue;
    }
    const envelopeRefs = new Set(authoritativeArtifactRefs(envelope));
    const matchingBindings = boundBindings.filter(
      (binding) =>
        binding.kind === kind && envelopeRefs.has(binding.artifactRef),
    );
    if (matchingBindings.length > 1) {
      issues.push(`${kind}:procedure_evidence_binding_ambiguous`);
      continue;
    }
    const bound = matchingBindings[0] ?? null;
    const intrinsicLineage = intrinsicEvidenceLineage({
      kind,
      artifact: payload,
      procedureId: input.procedure.procedureId,
    });
    if (!intrinsicLineage) {
      issues.push(`${kind}:scientific_lineage_incomplete`);
      continue;
    }
    const lineageMatches =
      Boolean(bound?.lineage) &&
      intrinsicLineageMatchesBinding(
        intrinsicLineage,
        bound?.lineage as TheoryExperimentEvidenceLineageV1,
      );
    if (bound && !lineageMatches) {
      issues.push(`${kind}:procedure_evidence_lineage_mismatch`);
      continue;
    }
    const closureSatisfied =
      Boolean(bound) &&
      bound?.contentSha256 === contentSha256 &&
      lineageMatches &&
      (status === "admitted" || status === "passed");
    const scopedToProcedure =
      Boolean(bound) &&
      bound?.contentSha256 === contentSha256 &&
      lineageMatches;
    if (bound) {
      observations.delete(`${kind}:${bound.artifactRef}`);
    }
    const candidateIds = new Set([
      ...input.procedure.request.selectedBadgeIds,
      ...input.procedure.request.comparisonBadgeIds,
    ]);
    const observationLineage = bound?.lineage
      ? bound.lineage
      : {
          ...intrinsicLineage,
          candidateBadgeIds: intrinsicLineage.candidateBadgeIds.filter(
            (badgeId) => candidateIds.has(badgeId),
          ),
        };
    observations.set(`${kind}:${artifactRef}`, {
      artifactRef,
      boundArtifactRef: bound?.artifactRef ?? artifactRef,
      kind,
      schema:
        readString(envelope.payload_schema ?? envelope.payloadSchema) ??
        artifactSchema(payload) ??
        "unknown",
      contentSha256,
      sourceTurnId:
        retainedSourceTurnId(envelope) ??
        readString(envelope.source_turn_id ?? envelope.sourceTurnId) ??
        input.turnId,
      status,
      scope: scopedToProcedure
        ? "shared_procedure_evidence"
        : "unscoped_current_turn_evidence",
      closureSatisfied,
      lineage: observationLineage,
      authority: "evidence_only",
    });
  }
  return {
    observations: Array.from(observations.values()),
    issues,
  };
}

export type TheoryExperimentProcedureGatewayExecution = {
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

export async function executeTheoryExperimentProcedureGatewayCapability(input: {
  capabilityId: string;
  args: Record<string, unknown>;
  accountType: HelixAccountType;
  profileId?: string | null;
  sessionId?: string | null;
  turnId: string;
  authoritativeEvidenceArtifacts?: unknown[];
}): Promise<TheoryExperimentProcedureGatewayExecution> {
  if (input.accountType !== "developer") {
    const closureEvaluation =
      input.capabilityId ===
      THEORY_EXPERIMENT_PROCEDURE_EVALUATE_CLOSURE_CAPABILITY;
    const procedureReadmission =
      input.capabilityId === THEORY_EXPERIMENT_PROCEDURE_READMIT_CAPABILITY;
    const observation = {
      schema: closureEvaluation
        ? THEORY_EXPERIMENT_EXECUTION_CLOSURE_OBSERVATION_SCHEMA
        : THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
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
      summary: closureEvaluation
        ? "Theory execution-closure evaluation is restricted to developer accounts."
        : procedureReadmission
          ? "Theory experiment procedure readmission is restricted to developer accounts."
          : "Theory experiment procedure preparation is restricted to developer accounts.",
      observation,
      missingRequirements: [
        {
          code: "developer_account_required",
          message: closureEvaluation
            ? "Use a trusted developer account for execution-closure evaluation."
            : procedureReadmission
              ? "Use a trusted developer account to readmit a retained procedure."
              : "Use a trusted developer account for experimental procedure preparation.",
          repair_action: "ask_user",
        },
      ],
      error: "developer_account_required",
    };
  }

  if (input.capabilityId === THEORY_EXPERIMENT_PROCEDURE_READMIT_CAPABILITY) {
    if (!readString(input.profileId) || !readString(input.sessionId)) {
      const code = "procedure_owner_context_required";
      const observation = {
        schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
        status: "blocked",
        issues: [code],
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
        admissionReason: code,
        blockedReason: code,
        summary:
          "Theory experiment procedure readmission requires an exact developer profile and session owner context.",
        observation,
        missingRequirements: [
          {
            code,
            message:
              "Readmit the procedure through an authenticated developer profile and session.",
            repair_action: "repair",
          },
        ],
        error: code,
      };
    }
    const procedureArtifactRef = readString(
      input.args.procedure_artifact_ref ?? input.args.procedureArtifactRef,
    );
    const procedureId = readString(
      input.args.procedure_id ?? input.args.procedureId,
    );
    const procedureSha256 = readString(
      input.args.procedure_sha256 ?? input.args.procedureSha256,
    );
    const missing = [
      ...(!procedureArtifactRef ? ["procedure_artifact_ref_required"] : []),
      ...(!procedureId ? ["procedure_id_required"] : []),
      ...(!procedureSha256 ? ["procedure_sha256_required"] : []),
      ...(procedureSha256 && !/^[a-f0-9]{64}$/.test(procedureSha256)
        ? ["procedure_sha256_invalid"]
        : []),
    ];
    if (missing.length > 0) {
      const observation = {
        schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
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
        admissionReason:
          "theory_experiment_procedure_readmission_input_missing",
        blockedReason: missing[0],
        summary: "Theory experiment procedure readmission is missing input.",
        observation,
        missingRequirements: missing.map((code) => ({
          code,
          message: `Procedure readmission requires repair: ${code}.`,
          repair_action: "repair" as const,
        })),
        error: missing[0],
      };
    }

    const retained = readRetainedTheoryExperimentProcedure({
      accountType: input.accountType,
      profileId: input.profileId,
      sessionId: input.sessionId,
      procedureId: procedureId as string,
      procedureSha256: procedureSha256 as string,
    });
    const readmissionIssues: string[] = [];
    if (!retained) {
      readmissionIssues.push("retained_procedure_not_found");
    } else {
      if (procedureArtifactRef !== retained.issuedArtifactRef) {
        readmissionIssues.push("procedure_artifact_ref_not_original");
      }
      readmissionIssues.push(
        ...(await validateProcedureIntegrity(retained.procedure)).map(
          (issue) => `procedure:${issue}`,
        ),
      );
    }
    if (!retained || readmissionIssues.length > 0) {
      const code = readmissionIssues[0] ?? "retained_procedure_not_found";
      const observation = {
        schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
        status: "blocked",
        issues: readmissionIssues,
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
        admissionReason: "theory_experiment_procedure_readmission_blocked",
        blockedReason: code,
        summary:
          "The exact retained theory experiment procedure could not be readmitted.",
        observation,
        missingRequirements: readmissionIssues.map((issue) => ({
          code: issue,
          message: `Procedure readmission requires repair: ${issue}.`,
          repair_action: "repair" as const,
        })),
        error: code,
      };
    }

    const procedure = retained.procedure;
    const observation = {
      schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
      status: "succeeded",
      procedure,
      readmission: {
        schema: "casimir.theory_experiment_procedure.readmission/v1",
        requested_procedure_artifact_ref: procedureArtifactRef,
        origin_turn_id: retained.originTurnId,
        readmitted_turn_id: input.turnId,
        procedure_id: procedure.procedureId,
        procedure_sha256: procedure.procedureSha256,
        authority: "server_retained_session_scoped_evidence",
      },
      next_affordances: [
        {
          schema: "helix.agent_continuation_affordance.v1",
          affordance_id: `${input.turnId}:readmitted:${procedure.procedureId}:evaluate-closure`,
          capability: THEORY_EXPERIMENT_PROCEDURE_EVALUATE_CLOSURE_CAPABILITY,
          prompt: `Evaluate execution closure for ${procedure.request.target}.`,
          procedure_id: procedure.procedureId,
          procedure_sha256: procedure.procedureSha256,
          reason:
            "The exact server-retained procedure has re-entered this turn and may now be evaluated against authentic current-turn evidence.",
          requires_confirmation: false,
          executes_automatically: false,
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
      ],
      output_role: "evidence_for_synthesis",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: true,
      status: "succeeded",
      admissionStatus: "admitted",
      admissionReason: "theory_experiment_procedure_readmitted",
      summary:
        "Readmitted the exact server-retained theory experiment procedure as current-turn evidence.",
      observation,
      missingRequirements: procedure.missingRequirements.map((requirement) => ({
        code: requirement.code,
        message: requirement.message,
        repair_action:
          requirement.repair === "ask_user" ? "ask_user" : "repair",
      })),
    };
  }

  if (
    input.capabilityId ===
    THEORY_EXPERIMENT_PROCEDURE_EVALUATE_CLOSURE_CAPABILITY
  ) {
    const prompt = readString(input.args.prompt);
    const procedureArtifactRef = readString(
      input.args.procedure_artifact_ref ?? input.args.procedureArtifactRef,
    );
    const procedureId = readString(
      input.args.procedure_id ?? input.args.procedureId,
    );
    const procedureSha256 = readString(
      input.args.procedure_sha256 ?? input.args.procedureSha256,
    );
    const missing = [
      ...(!prompt ? ["prompt_required"] : []),
      ...(!procedureId ? ["procedure_id_required"] : []),
      ...(!procedureSha256 ? ["procedure_sha256_required"] : []),
      ...(procedureSha256 && !/^[a-f0-9]{64}$/.test(procedureSha256)
        ? ["procedure_sha256_invalid"]
        : []),
    ];
    if (missing.length > 0) {
      const observation = {
        schema: THEORY_EXPERIMENT_EXECUTION_CLOSURE_OBSERVATION_SCHEMA,
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
        admissionReason: "theory_execution_closure_input_missing",
        blockedReason: missing[0],
        summary: "Theory execution-closure evaluation is missing input.",
        observation,
        missingRequirements: missing.map((code) => ({
          code,
          message: `Execution-closure evaluation requires repair: ${code}.`,
          repair_action: "repair",
        })),
        error: missing[0],
      };
    }
    const resolved = await resolveAuthoritativeProcedureArtifact({
      artifactRef: procedureArtifactRef,
      procedureId: procedureId as string,
      procedureSha256: procedureSha256 as string,
      turnId: input.turnId,
      authoritativeEvidenceArtifacts: input.authoritativeEvidenceArtifacts,
    });
    if (!resolved.procedure || !resolved.artifactRef) {
      const code =
        resolved.issues[0] ?? "authoritative_procedure_artifact_not_admitted";
      const observation = {
        schema: THEORY_EXPERIMENT_EXECUTION_CLOSURE_OBSERVATION_SCHEMA,
        status: "blocked",
        issues: resolved.issues,
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
        admissionReason: "theory_execution_closure_procedure_binding_blocked",
        blockedReason: code,
        summary:
          "Theory execution-closure evaluation rejected a stale, aliased, ambiguous, or invalid procedure artifact.",
        observation,
        missingRequirements: resolved.issues.map((issue) => ({
          code: issue,
          message: `Procedure binding requires repair: ${issue}.`,
          repair_action: "repair",
        })),
        error: code,
      };
    }
    const collected = await collectClosureEvidenceObservations({
      procedure: resolved.procedure,
      turnId: input.turnId,
      authoritativeEvidenceArtifacts: input.authoritativeEvidenceArtifacts,
    });
    if (collected.issues.length > 0) {
      const code = collected.issues[0];
      const observation = {
        schema: THEORY_EXPERIMENT_EXECUTION_CLOSURE_OBSERVATION_SCHEMA,
        status: "blocked",
        issues: collected.issues,
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
        admissionReason: "theory_execution_closure_evidence_integrity_blocked",
        blockedReason: code,
        summary:
          "Theory execution-closure evaluation rejected malformed or substituted evidence.",
        observation,
        missingRequirements: collected.issues.map((issue) => ({
          code: issue,
          message: `Closure evidence requires repair: ${issue}.`,
          repair_action: "repair",
        })),
        error: code,
      };
    }
    const closure = await compileTheoryExperimentExecutionClosureV1({
      procedure: resolved.procedure,
      procedureArtifactRef: resolved.artifactRef,
      turnId: input.turnId,
      evidenceObservations: collected.observations,
      empiricalObservationSchemaRegistered: false,
      numericalExecutionCatalogConfigured:
        inspectCasimirIndependentNumericalVerifierRuntimeV1()
          .executionCatalogConfigured,
    });
    const contractIssues =
      await validateTheoryExperimentExecutionClosureIntegrityV1(closure);
    if (contractIssues.length > 0) {
      const code = contractIssues[0];
      const observation = {
        schema: THEORY_EXPERIMENT_EXECUTION_CLOSURE_OBSERVATION_SCHEMA,
        status: "blocked",
        issues: contractIssues,
        output_role: "candidate_next_step",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      return {
        ok: false,
        status: "failed",
        admissionStatus: "blocked",
        admissionReason: "theory_execution_closure_integrity_failed",
        blockedReason: code,
        summary:
          "Theory execution-closure artifact integrity validation failed.",
        observation,
        missingRequirements: contractIssues.map((issue) => ({
          code: issue,
          message: `Execution closure requires repair: ${issue}.`,
          repair_action: "repair",
        })),
        error: code,
      };
    }
    const exactNextAffordances: Record<string, unknown>[] = [];
    if (
      !resolved.procedure.evidenceBindings.some(
        (binding) => binding.kind === "theory_reflection",
      )
    ) {
      exactNextAffordances.push({
        schema: "helix.agent_continuation_affordance.v1",
        affordance_id: `${closure.closureId}:reflect-theory-context`,
        capability: "helix_ask.reflect_theory_context",
        prompt,
        reason:
          "Bind current-turn Theory Badge Graph reflection evidence before re-preparing the procedure.",
        requires_confirmation: false,
        executes_automatically: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
    }
    if (
      closure.synthesisReadiness.openRequirementCodes.includes(
        "source_evidence_required",
      )
    ) {
      exactNextAffordances.push({
        schema: "helix.agent_continuation_affordance.v1",
        affordance_id: `${closure.closureId}:retrieve-scholarly-source`,
        capability: "scholarly-research.lookup_papers",
        query: prompt,
        reason:
          "Retrieve source candidates for provenance and later semantic admission; lookup results do not themselves satisfy scientific closure.",
        requires_confirmation: false,
        executes_automatically: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      });
    }
    const observation = {
      schema: THEORY_EXPERIMENT_EXECUTION_CLOSURE_OBSERVATION_SCHEMA,
      status: "succeeded",
      closure,
      next_affordances: exactNextAffordances,
      next_capability_candidates: closure.nextCapabilityCandidates,
      missing_requirements: closure.synthesisReadiness.openRequirementCodes,
      output_role: "evidence_for_bounded_synthesis",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: true,
      status: "succeeded",
      admissionStatus: "admitted",
      admissionReason: "theory_execution_closure_evaluated",
      summary: `Evaluated ${closure.candidates.length} candidate(s): ${closure.ranking.outcome}; claim ceiling ${closure.synthesisReadiness.claimCeiling}.`,
      observation,
      missingRequirements: closure.synthesisReadiness.openRequirementCodes.map(
        (code) => ({
          code,
          message: `Execution closure remains open: ${code}.`,
          repair_action: "repair",
        }),
      ),
    };
  }

  const prompt = readString(input.args.prompt);
  const selectedOperation = operation(input.args.operation);
  const target = readString(input.args.target);
  const selectedBadgeIds = readStringArray(
    input.args.selected_badge_ids ?? input.args.selectedBadgeIds,
  );
  const missing: string[] = [];
  if (!prompt) missing.push("prompt_required");
  if (!selectedOperation) missing.push("operation_required");
  if (!target) missing.push("target_required");
  if (selectedBadgeIds.length === 0) {
    missing.push("selected_badge_ids_required");
  }
  if (missing.length > 0) {
    const observation = {
      schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
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
      admissionReason: "theory_experiment_procedure_input_missing",
      blockedReason: missing[0],
      summary: "Theory experiment procedure preparation is missing input.",
      observation,
      missingRequirements: missing.map((code) => ({
        code,
        message: `Procedure preparation requires repair: ${code}.`,
        repair_action: "repair",
      })),
      error: missing[0],
    };
  }

  const graph = buildNhm2TheoryBadgeGraphV1();
  const registeredBadgeIds = new Set(graph.badges.map((badge) => badge.id));
  const comparisonBadgeIds = readStringArray(
    input.args.comparison_badge_ids ?? input.args.comparisonBadgeIds,
  );
  const comparisonBadgeIdSet = new Set(comparisonBadgeIds);
  const overlappingBadgeIds = selectedBadgeIds.filter((badgeId) =>
    comparisonBadgeIdSet.has(badgeId),
  );
  if (overlappingBadgeIds.length > 0) {
    const code = THEORY_EXPERIMENT_BADGE_SET_OVERLAP_CODE;
    const observation = {
      schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
      status: "blocked",
      issues: [code],
      overlapping_badge_ids: overlappingBadgeIds,
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
      admissionReason: code,
      blockedReason: code,
      summary:
        "Theory experiment procedure preparation requires disjoint selected and comparison Theory Badge sets.",
      observation,
      missingRequirements: [
        {
          code,
          message: `Remove these badges from one set: ${overlappingBadgeIds.join(", ")}.`,
          repair_action: "repair",
        },
      ],
      error: code,
    };
  }
  const unknownBadgeIds = [...selectedBadgeIds, ...comparisonBadgeIds].filter(
    (badgeId) => !registeredBadgeIds.has(badgeId),
  );
  if (unknownBadgeIds.length > 0) {
    const code = "selected_badge_id_not_registered";
    const observation = {
      schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
      status: "blocked",
      unknown_badge_ids: unknownBadgeIds,
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
      admissionReason: code,
      blockedReason: code,
      summary:
        "Theory experiment procedure preparation rejected unregistered Theory Badge IDs.",
      observation,
      missingRequirements: [
        {
          code,
          message: `Select registered badge IDs; unknown: ${unknownBadgeIds.join(", ")}.`,
          repair_action: "repair",
        },
      ],
      error: code,
    };
  }

  const procedureId =
    readString(input.args.procedure_id ?? input.args.procedureId) ??
    `${input.turnId}:theory-experiment-procedure`;
  const boundEvidence = await bindEvidenceArtifacts({
    raw: input.args.evidence_artifacts ?? input.args.evidenceArtifacts,
    turnId: input.turnId,
    procedureId,
    authoritativeEvidenceArtifacts: input.authoritativeEvidenceArtifacts,
  });
  if (boundEvidence.issues.length > 0) {
    const code = boundEvidence.issues[0];
    const observation = {
      schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
      status: "blocked",
      issues: boundEvidence.issues,
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
      admissionReason: "theory_experiment_evidence_binding_blocked",
      blockedReason: code,
      summary:
        "Theory experiment procedure preparation rejected an evidence identity or integrity mismatch.",
      observation,
      missingRequirements: boundEvidence.issues.map((issue) => ({
        code: issue,
        message: `Evidence binding requires repair: ${issue}.`,
        repair_action: "repair",
      })),
      error: code,
    };
  }

  const scaleMin = readFiniteNumber(
    input.args.scale_min_log10_m ?? input.args.scaleMinLog10M,
  );
  const scaleMax = readFiniteNumber(
    input.args.scale_max_log10_m ?? input.args.scaleMaxLog10M,
  );
  const request: TheoryMasterProblemRequestV1 = {
    operation: selectedOperation as TheoryMasterProblemRequestV1["operation"],
    target: target as string,
    targetObservable: readString(
      input.args.target_observable ?? input.args.targetObservable,
    ),
    scaleLog10M:
      scaleMin !== null || scaleMax !== null
        ? { min: scaleMin, max: scaleMax }
        : null,
    coordinateFrame: readString(
      input.args.coordinate_frame ?? input.args.coordinateFrame,
    ),
    initialBoundaryConditions: readStringArray(
      input.args.initial_boundary_conditions ??
        input.args.initialBoundaryConditions,
    ),
    formalSystem: readString(
      input.args.formal_system ?? input.args.formalSystem,
    ),
    requestedPrecision: readString(
      input.args.requested_precision ?? input.args.requestedPrecision,
    ),
    evidenceMaturityCeiling: maturity(
      input.args.evidence_maturity_ceiling ??
        input.args.evidenceMaturityCeiling,
    ),
    normalizationStatus: "explicit",
  };
  const generatedAt = stableProcedureGeneratedAt({
    accountType: input.accountType,
    profileId: input.profileId,
    sessionId: input.sessionId,
    turnId: input.turnId,
    procedureId,
  });
  const reflection = buildTheoryContextReflection({
    graph,
    prompt: prompt as string,
    mentionedDomains: selectedBadgeIds,
    source: "helix_ask",
    confidenceMode: "soft_locator",
    resolutionMode:
      selectedBadgeIds.length > 1 || comparisonBadgeIds.length > 0
        ? "path"
        : "focused",
    generatedAt,
    reflectionId: `${input.turnId}:theory-experiment-reflection`,
    limit: 24,
  });
  const lanyon = {
    requested:
      input.args.lanyon_requested === true ||
      input.args.lanyonRequested === true,
    caseId: readString(input.args.lanyon_case_id ?? input.args.lanyonCaseId),
  };
  const preliminaryProcedure = await compileTheoryExperimentProcedureV1({
    graph,
    turnId: input.turnId,
    procedureId,
    generatedAt,
    reflection,
    request,
    selectedBadgeIds,
    comparisonBadgeIds,
    evidenceBindings: boundEvidence.bindings,
    lanyon,
  });
  const scopedEvidence = await scopeEvidenceBindingsToProcedure({
    bindings: boundEvidence.bindings,
    procedure: preliminaryProcedure,
  });
  if (scopedEvidence.issues.length > 0) {
    const code = scopedEvidence.issues[0];
    const observation = {
      schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
      status: "blocked",
      issues: scopedEvidence.issues,
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
      admissionReason: "theory_experiment_evidence_lineage_blocked",
      blockedReason: code,
      summary:
        "Theory experiment procedure preparation rejected evidence that did not bind the exact graph, claim, procedure, case, or observable scope.",
      observation,
      missingRequirements: scopedEvidence.issues.map((issue) => ({
        code: issue,
        message: `Evidence lineage requires repair: ${issue}.`,
        repair_action: "repair" as const,
      })),
      error: code,
    };
  }
  const procedure = await compileTheoryExperimentProcedureV1({
    graph,
    turnId: input.turnId,
    procedureId,
    generatedAt,
    reflection,
    request,
    selectedBadgeIds,
    comparisonBadgeIds,
    evidenceBindings: scopedEvidence.bindings,
    lanyon,
  });
  const contractIssues = validateTheoryExperimentProcedureV1(procedure);
  const {
    procedureSha256: _ignored,
    artifactId: _artifactId,
    schemaVersion: _schemaVersion,
    ...unsignedProcedure
  } = procedure;
  const expectedProcedureSha256 = await computeCasimirSpecValueSha256V1({
    domain: THEORY_EXPERIMENT_PROCEDURE_HASH_DOMAIN,
    value: unsignedProcedure,
  });
  if (procedure.procedureSha256 !== expectedProcedureSha256) {
    contractIssues.push("procedure_sha256_mismatch");
  }
  if (contractIssues.length > 0) {
    const code = contractIssues[0];
    const observation = {
      schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
      status: "blocked",
      issues: contractIssues,
      output_role: "evidence_for_synthesis",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      status: "failed",
      admissionStatus: "blocked",
      admissionReason: "theory_experiment_procedure_integrity_failed",
      blockedReason: code,
      summary: "Theory experiment procedure integrity validation failed.",
      observation,
      missingRequirements: contractIssues.map((issue) => ({
        code: issue,
        message: `Procedure integrity requires repair: ${issue}.`,
        repair_action: "repair",
      })),
      error: code,
    };
  }

  const retentionOwnerKey = retainedProcedureOwnerKey({
    accountType: input.accountType,
    profileId: input.profileId,
    sessionId: input.sessionId,
  });
  const observation = {
    schema: THEORY_EXPERIMENT_PROCEDURE_OBSERVATION_SCHEMA,
    status: "succeeded",
    procedure,
    ...(retentionOwnerKey
      ? {
          retention: {
            schema: "casimir.theory_experiment_procedure.retention/v1",
            scope: "developer_session",
            procedure_id: procedure.procedureId,
            procedure_sha256: procedure.procedureSha256,
            origin_turn_id: procedure.turnId,
            expires_after_ms: RETAINED_PROCEDURE_TTL_MS,
            readmission_capability:
              THEORY_EXPERIMENT_PROCEDURE_READMIT_CAPABILITY,
            assistant_answer: false,
            terminal_eligible: false,
          },
        }
      : {}),
    next_affordances: [
      {
        schema: "helix.agent_continuation_affordance.v1",
        affordance_id: `${procedure.procedureId}:evaluate-closure`,
        capability: THEORY_EXPERIMENT_PROCEDURE_EVALUATE_CLOSURE_CAPABILITY,
        prompt,
        procedure_id: procedure.procedureId,
        procedure_sha256: procedure.procedureSha256,
        reason:
          "Evaluate exact current-turn evidence coverage and candidate comparability before bounded synthesis or further tool selection.",
        requires_confirmation: false,
        executes_automatically: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    ],
    output_role: "evidence_for_synthesis",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  if (retentionOwnerKey) {
    const issuedArtifactRef = buildWorkstationGatewayObservationArtifactRef({
      turnId: input.turnId,
      capabilityId: THEORY_EXPERIMENT_PROCEDURE_PREPARE_CAPABILITY,
      observation,
    });
    retainTheoryExperimentProcedure({
      ownerKey: retentionOwnerKey,
      issuedArtifactRef,
      procedure,
    });
  }
  return {
    ok: true,
    status: "succeeded",
    admissionStatus: "admitted",
    admissionReason: "theory_experiment_procedure_prepared",
    summary:
      "Prepared a hash-bound, seven-stage, non-terminal theory experiment procedure for agent-runtime execution.",
    observation,
    missingRequirements: procedure.missingRequirements.map((requirement) => ({
      code: requirement.code,
      message: requirement.message,
      repair_action: requirement.repair === "ask_user" ? "ask_user" : "repair",
    })),
  };
}
