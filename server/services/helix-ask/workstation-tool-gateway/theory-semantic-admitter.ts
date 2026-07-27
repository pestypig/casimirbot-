import { createHash } from "node:crypto";

import type { HelixAccountType } from "@shared/helix-account-session";
import {
  formatCasimirSpecSourcePacketV1,
  parseCasimirSpecSourcePacketV1,
  type CasimirSpecSourcePacketV1,
} from "@shared/contracts/casimir-spec-source-packet.v1";

import { admitCasimirSpecScientificClaimIrV1 } from "../../theory/casimir-spec-semantic-admission";
import { resolveServerOwnedCasimirSpecSemanticSnapshotsV1 } from "../../theory/casimir-spec-semantic-snapshot-store";
import type { HelixWorkstationCapabilityManifest } from "./types";

export const THEORY_SEMANTIC_ADMITTER_NORMALIZE_CAPABILITY =
  "theory-semantic-admitter.normalize" as const;
export const THEORY_SEMANTIC_ADMITTER_CAPABILITIES = [
  THEORY_SEMANTIC_ADMITTER_NORMALIZE_CAPABILITY,
] as const;

const SEMANTIC_ADMISSION_OBSERVATION_SCHEMA =
  "casimir.theory_semantic_admitter.observation.v1" as const;

export const theorySemanticAdmitterNormalizeManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: THEORY_SEMANTIC_ADMITTER_NORMALIZE_CAPABILITY,
    label: "Normalize and admit Casimir Spec",
    description:
      "Binds an exact current-turn authoritative source-evidence reference, deterministically formats its matching thin Casimir Spec source packet into the sole canonical scientific-claim IR, and checks declared identities and bridges only against the server-owned semantic snapshot store. Returns non-terminal evidence; it does not prove or validate scientific truth.",
    panel_id: "theory-badge-graph",
    action_id: "normalize_casimir_spec",
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
        "source_evidence_ref",
        "source_packet",
        "source_path",
        "receipt_id",
      ],
      properties: {
        source_evidence_ref: { type: "string" },
        source_packet: { type: "object" },
        source_path: { type: "string" },
        receipt_id: { type: "string" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: SEMANTIC_ADMISSION_OBSERVATION_SCHEMA,
    observation_schema: SEMANTIC_ADMISSION_OBSERVATION_SCHEMA,
    safety_tags: [
      "developer_only",
      "read_only_source_admission",
      "server_owned_semantic_snapshots",
      "exact_current_turn_source_evidence",
      "source_provenance_bound",
      "canonical_claim_ir",
      "evidence_only",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
      "does_not_validate_scientific_truth",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const theorySemanticAdmitterManifests = [
  theorySemanticAdmitterNormalizeManifest,
] as const;

const readRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const CURRENT_TURN_ARTIFACT_SCHEMA = "helix.current_turn_artifact.v1";
const SOURCE_PACKET_SCHEMA_VERSION = "casimir_spec_source_packet/v1";
const SOURCE_EVIDENCE_BINDING_SCHEMA =
  "casimir.theory_semantic_admitter.source_evidence_binding.v1";
const SHA256 = /^[a-f0-9]{64}$/;

type BoundSemanticSourceEvidence = {
  artifactRef: string;
  turnId: string;
  sourceCapabilityId: string;
  sourceScope: "current_turn_context" | "current_turn" | "same_turn";
  sourcePacketId: string;
  sourcePath: string;
  mediaType: string;
  contentSha256: string;
  sourcePacket: Record<string, unknown>;
};

type SemanticSourceEvidenceResolution =
  | { ok: true; binding: BoundSemanticSourceEvidence }
  | { ok: false; issue: string; detail: string };

const sha256SourceBytes = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

const distinctDeclaredStrings = (values: unknown[]): string[] =>
  Array.from(
    new Set(
      values
        .map(readString)
        .filter((entry): entry is string => Boolean(entry)),
    ),
  );

const resolveBoundSemanticSourceEvidence = (input: {
  sourceEvidenceRef: string;
  sourcePacket: Record<string, unknown>;
  sourcePath: string;
  turnId: string | null | undefined;
  authoritativeEvidenceArtifacts?: unknown[];
}): SemanticSourceEvidenceResolution => {
  const turnId = readString(input.turnId);
  if (!turnId) {
    return {
      ok: false,
      issue: "source_evidence_turn_id_required",
      detail:
        "Semantic admission requires the exact current Ask turn identity.",
    };
  }
  if (!Array.isArray(input.authoritativeEvidenceArtifacts)) {
    return {
      ok: false,
      issue: "authoritative_source_evidence_required",
      detail:
        "Semantic admission requires the current-turn authoritative evidence ledger.",
    };
  }

  const exactMatches = input.authoritativeEvidenceArtifacts
    .map(readRecord)
    .filter(
      (envelope) =>
        readString(envelope.artifact_id ?? envelope.artifactId) ===
        input.sourceEvidenceRef,
    );
  if (exactMatches.length === 0) {
    return {
      ok: false,
      issue: "source_evidence_not_admitted",
      detail:
        "The requested source evidence reference is absent from the authoritative evidence ledger.",
    };
  }
  if (exactMatches.length > 1) {
    return {
      ok: false,
      issue: "source_evidence_ambiguous",
      detail:
        "The requested source evidence reference resolves to more than one authoritative artifact.",
    };
  }

  const envelope = exactMatches[0];
  if (envelope.schema !== CURRENT_TURN_ARTIFACT_SCHEMA) {
    return {
      ok: false,
      issue: "source_evidence_envelope_schema_invalid",
      detail:
        "The selected source evidence is not a current-turn artifact envelope.",
    };
  }
  if (readString(envelope.turn_id ?? envelope.turnId) !== turnId) {
    return {
      ok: false,
      issue: "source_evidence_turn_mismatch",
      detail:
        "The selected source evidence was not admitted in the current Ask turn.",
    };
  }
  if (
    envelope.assistant_answer !== false ||
    envelope.terminal_eligible !== false ||
    envelope.raw_content_included !== false
  ) {
    return {
      ok: false,
      issue: "source_evidence_authority_invalid",
      detail:
        "The selected source evidence must be nonterminal evidence, not an answer or raw-content projection.",
    };
  }

  const sourceScope = readString(
    envelope.source_scope ?? envelope.sourceScope,
  );
  if (
    sourceScope !== "current_turn_context" &&
    sourceScope !== "current_turn" &&
    sourceScope !== "same_turn"
  ) {
    return {
      ok: false,
      issue: "source_evidence_scope_invalid",
      detail:
        "Semantic admission accepts only same-turn source evidence; retained or ambient context must be re-admitted first.",
    };
  }

  const payload = readRecord(envelope.payload);
  const sourceCapabilityIds = distinctDeclaredStrings([
    envelope.source_capability_id,
    envelope.sourceCapabilityId,
    payload.source_capability_id,
    payload.sourceCapabilityId,
  ]);
  const capabilityKeys = distinctDeclaredStrings([
    envelope.capability_key,
    envelope.capabilityKey,
    payload.capability_key,
    payload.capabilityKey,
  ]);
  if (
    sourceCapabilityIds.length !== 1 ||
    capabilityKeys.length !== 1 ||
    sourceCapabilityIds[0] !== capabilityKeys[0]
  ) {
    return {
      ok: false,
      issue: "source_evidence_provenance_mismatch",
      detail:
        "The selected source evidence does not preserve one consistent producer capability identity.",
    };
  }
  const sourceCapabilityId = sourceCapabilityIds[0];
  const claimedSourceTurnIds = distinctDeclaredStrings([
    envelope.source_turn_id,
    envelope.sourceTurnId,
    payload.source_turn_id,
    payload.sourceTurnId,
  ]);
  if (
    claimedSourceTurnIds.length > 1 ||
    (claimedSourceTurnIds.length === 1 &&
      claimedSourceTurnIds[0] !== turnId)
  ) {
    return {
      ok: false,
      issue: "source_evidence_provenance_mismatch",
      detail:
        "The selected source evidence carries a conflicting source-turn provenance claim.",
    };
  }

  const sourcePacket =
    payload.artifactId === "casimir_spec_source_packet"
      ? payload
      : readRecord(payload.source_packet ?? payload.sourcePacket);
  if (Object.keys(sourcePacket).length === 0) {
    return {
      ok: false,
      issue: "source_evidence_packet_missing",
      detail:
        "The selected source evidence does not contain a Casimir Spec source packet.",
    };
  }

  const payloadSchemas = distinctDeclaredStrings([
    envelope.payload_schema,
    envelope.payloadSchema,
    payload.source_packet_schema,
    payload.sourcePacketSchema,
  ]);
  const sourcePacketIds = distinctDeclaredStrings([
    envelope.source_packet_id,
    envelope.sourcePacketId,
    payload.source_packet_id,
    payload.sourcePacketId,
  ]);
  const packetSourcePacketId = readString(sourcePacket.sourcePacketId);
  if (
    payloadSchemas.length !== 1 ||
    payloadSchemas[0] !== SOURCE_PACKET_SCHEMA_VERSION ||
    sourcePacket.schemaVersion !== SOURCE_PACKET_SCHEMA_VERSION ||
    sourcePacket.artifactId !== "casimir_spec_source_packet" ||
    sourcePacketIds.length !== 1 ||
    !packetSourcePacketId ||
    sourcePacketIds[0] !== packetSourcePacketId
  ) {
    return {
      ok: false,
      issue: "source_evidence_packet_identity_mismatch",
      detail:
        "The selected source evidence packet schema or packet identity does not match its authoritative envelope.",
    };
  }
  const sourcePacketId = sourcePacketIds[0];

  const evidenceSourcePaths = distinctDeclaredStrings([
    envelope.source_path,
    envelope.sourcePath,
    payload.source_path,
    payload.sourcePath,
  ]);
  if (
    evidenceSourcePaths.length !== 1 ||
    evidenceSourcePaths[0] !== input.sourcePath
  ) {
    return {
      ok: false,
      issue: "source_evidence_path_mismatch",
      detail:
        "The requested source path does not match the authoritative source evidence path.",
    };
  }
  const evidenceSourcePath = evidenceSourcePaths[0];
  const mediaTypes = distinctDeclaredStrings([
    envelope.media_type,
    envelope.mediaType,
    payload.media_type,
    payload.mediaType,
  ]);
  if (mediaTypes.length !== 1) {
    return {
      ok: false,
      issue: "source_evidence_media_type_required",
      detail:
        "The authoritative source evidence must declare its source-packet media type.",
    };
  }
  const mediaType = mediaTypes[0];

  const declaredContentSha256Values = distinctDeclaredStrings([
    envelope.content_sha256,
    envelope.contentSha256,
    payload.content_sha256,
    payload.contentSha256,
  ]);
  if (
    declaredContentSha256Values.length !== 1 ||
    !SHA256.test(declaredContentSha256Values[0])
  ) {
    return {
      ok: false,
      issue: "source_evidence_content_hash_required",
      detail:
        "The authoritative source evidence must declare a lowercase SHA-256 content digest.",
    };
  }
  const declaredContentSha256 = declaredContentSha256Values[0];

  let authoritativeSourceText: string;
  let requestedSourceText: string;
  try {
    authoritativeSourceText = formatCasimirSpecSourcePacketV1(
      sourcePacket as CasimirSpecSourcePacketV1,
    );
    requestedSourceText = formatCasimirSpecSourcePacketV1(
      input.sourcePacket as CasimirSpecSourcePacketV1,
    );
  } catch {
    return {
      ok: false,
      issue: "source_evidence_packet_serialization_failed",
      detail:
        "The requested or authoritative source packet cannot be deterministically serialized.",
    };
  }
  const computedContentSha256 = sha256SourceBytes(
    authoritativeSourceText,
  );
  if (
    computedContentSha256 !== declaredContentSha256 ||
    requestedSourceText !== authoritativeSourceText
  ) {
    return {
      ok: false,
      issue: "source_evidence_content_hash_mismatch",
      detail:
        "The requested source packet bytes or authoritative content digest do not match the selected source evidence.",
    };
  }

  return {
    ok: true,
    binding: {
      artifactRef: input.sourceEvidenceRef,
      turnId,
      sourceCapabilityId,
      sourceScope,
      sourcePacketId,
      sourcePath: evidenceSourcePath,
      mediaType,
      contentSha256: computedContentSha256,
      sourcePacket,
    },
  };
};

export type TheorySemanticAdmitterGatewayExecution = {
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

export async function executeTheorySemanticAdmitterGatewayCapability(input: {
  capabilityId: string;
  args: Record<string, unknown>;
  accountType: HelixAccountType;
  turnId?: string | null;
  authoritativeEvidenceArtifacts?: unknown[];
}): Promise<TheorySemanticAdmitterGatewayExecution> {
  if (input.accountType !== "developer") {
    const observation = {
      schema: SEMANTIC_ADMISSION_OBSERVATION_SCHEMA,
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
        "Casimir Spec semantic admission is restricted to developer accounts.",
      observation,
      missingRequirements: [
        {
          code: "developer_account_required",
          message:
            "Use a trusted developer account for experimental semantic admission.",
          repair_action: "ask_user",
        },
      ],
      error: "developer_account_required",
    };
  }

  const sourcePacket = readRecord(
    input.args.source_packet ?? input.args.sourcePacket,
  );
  const sourceEvidenceRef = readString(
    input.args.source_evidence_ref ?? input.args.sourceEvidenceRef,
  );
  const sourcePath = readString(
    input.args.source_path ?? input.args.sourcePath,
  );
  const receiptId = readString(input.args.receipt_id ?? input.args.receiptId);
  const missing: string[] = [];
  if (!sourceEvidenceRef) missing.push("source_evidence_ref_required");
  if (Object.keys(sourcePacket).length === 0)
    missing.push("source_packet_required");
  if (!sourcePath) missing.push("source_path_required");
  if (!receiptId) missing.push("receipt_id_required");
  if (missing.length > 0) {
    const observation = {
      schema: SEMANTIC_ADMISSION_OBSERVATION_SCHEMA,
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
      admissionReason: "semantic_admission_input_missing",
      blockedReason: missing[0],
      summary: "Casimir Spec semantic admission is missing required input.",
      observation,
      missingRequirements: missing.map((code) => ({
        code,
        message: `Semantic admission requires repair: ${code}.`,
        repair_action: "repair",
      })),
      error: missing[0],
    };
  }

  const sourceEvidence = resolveBoundSemanticSourceEvidence({
    sourceEvidenceRef: sourceEvidenceRef as string,
    sourcePacket,
    sourcePath: sourcePath as string,
    turnId: input.turnId,
    authoritativeEvidenceArtifacts: input.authoritativeEvidenceArtifacts,
  });
  if (!sourceEvidence.ok) {
    const observation = {
      schema: SEMANTIC_ADMISSION_OBSERVATION_SCHEMA,
      status: "blocked",
      issues: [
        {
          code: sourceEvidence.issue,
          detail: sourceEvidence.detail,
        },
      ],
      requested_source_evidence_ref: sourceEvidenceRef,
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
      admissionReason: "source_evidence_admission_blocked",
      blockedReason: sourceEvidence.issue,
      summary:
        "Casimir Spec semantic admission could not bind exact current-turn source evidence.",
      observation,
      missingRequirements: [
        {
          code: sourceEvidence.issue,
          message: sourceEvidence.detail,
          repair_action: "repair",
        },
      ],
      error: sourceEvidence.issue,
    };
  }

  const generatedAt = new Date().toISOString();
  let parsed: Awaited<ReturnType<typeof parseCasimirSpecSourcePacketV1>>;
  try {
    const sourceText = formatCasimirSpecSourcePacketV1(
      sourcePacket as CasimirSpecSourcePacketV1,
    );
    parsed = await parseCasimirSpecSourcePacketV1({
      sourceText,
      sourcePath: sourcePath as string,
      generatedAt,
    });
  } catch (error) {
    const code = "source_packet_normalization_failed";
    const detail =
      error instanceof Error ? error.message : "source normalization failed";
    const observation = {
      schema: SEMANTIC_ADMISSION_OBSERVATION_SCHEMA,
      status: "blocked",
      issues: [{ code, detail }],
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
      admissionReason: code,
      blockedReason: code,
      summary: "Casimir Spec source normalization failed closed.",
      observation,
      missingRequirements: [{ code, message: detail, repair_action: "repair" }],
      error: code,
    };
  }
  if (parsed.status === "blocked") {
    const observation = {
      schema: SEMANTIC_ADMISSION_OBSERVATION_SCHEMA,
      status: "blocked",
      parse: parsed,
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
      admissionReason: "source_packet_normalization_blocked",
      blockedReason: parsed.issues[0]?.code ?? "source_packet_invalid",
      summary: "Casimir Spec source normalization failed closed.",
      observation,
      missingRequirements: parsed.issues.map((issue) => ({
        code: issue.code,
        message: issue.detail,
        repair_action: "repair",
      })),
      error: parsed.issues[0]?.code ?? "source_packet_invalid",
    };
  }
  if (
    parsed.sourcePacketSha256 !== sourceEvidence.binding.contentSha256 ||
    parsed.claimIr.source.kind !== "parsed_surface" ||
    parsed.claimIr.source.artifact.path !==
      sourceEvidence.binding.sourcePath ||
    parsed.claimIr.source.artifact.sha256 !==
      sourceEvidence.binding.contentSha256
  ) {
    const code = "source_evidence_claim_ir_provenance_mismatch";
    const detail =
      "The normalized claim IR did not preserve the exact bound source evidence path and digest.";
    const observation = {
      schema: SEMANTIC_ADMISSION_OBSERVATION_SCHEMA,
      status: "blocked",
      issues: [{ code, detail }],
      requested_source_evidence_ref: sourceEvidenceRef,
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
      admissionReason: code,
      blockedReason: code,
      summary:
        "Casimir Spec normalization failed to preserve bound source provenance.",
      observation,
      missingRequirements: [
        { code, message: detail, repair_action: "repair" },
      ],
      error: code,
    };
  }

  const snapshots = resolveServerOwnedCasimirSpecSemanticSnapshotsV1(
    parsed.claimIr,
  );
  const receipt = await admitCasimirSpecScientificClaimIrV1({
    claimIr: parsed.claimIr,
    generatedAt,
    receiptId: receiptId as string,
    ...snapshots,
  });
  const ok = receipt.disposition !== "rejected";
  const observation = {
    schema: SEMANTIC_ADMISSION_OBSERVATION_SCHEMA,
    status: ok ? "succeeded" : "blocked",
    source_evidence_ref: sourceEvidence.binding.artifactRef,
    source_evidence_binding: {
      schema: SOURCE_EVIDENCE_BINDING_SCHEMA,
      authority: "current_turn_authoritative_evidence",
      artifact_ref: sourceEvidence.binding.artifactRef,
      turn_id: sourceEvidence.binding.turnId,
      source_capability_id: sourceEvidence.binding.sourceCapabilityId,
      source_scope: sourceEvidence.binding.sourceScope,
      source_packet_id: sourceEvidence.binding.sourcePacketId,
      source_path: sourceEvidence.binding.sourcePath,
      media_type: sourceEvidence.binding.mediaType,
      content_sha256: sourceEvidence.binding.contentSha256,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    },
    source_packet_id: sourceEvidence.binding.sourcePacketId,
    source_path: sourceEvidence.binding.sourcePath,
    source_media_type: sourceEvidence.binding.mediaType,
    source_packet_sha256: parsed.sourcePacketSha256,
    claim_ir: parsed.claimIr,
    semantic_admission_receipt: receipt,
    output_role: "evidence_for_synthesis",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    ok,
    status: ok ? "succeeded" : "blocked",
    admissionStatus: ok ? "admitted" : "blocked",
    admissionReason: ok
      ? "canonical_claim_ir_semantically_admitted"
      : "semantic_snapshot_admission_rejected",
    ...(ok
      ? {}
      : {
          blockedReason:
            receipt.issues[0]?.code ?? "semantic_admission_rejected",
        }),
    summary: ok
      ? "Casimir Spec normalized to the canonical claim IR and produced a non-terminal semantic-admission receipt."
      : "Casimir Spec semantic admission failed against server-owned snapshots.",
    observation,
    missingRequirements: receipt.issues.map((issue) => ({
      code: issue.code,
      message: issue.detail,
      repair_action: "repair",
    })),
    ...(ok
      ? {}
      : { error: receipt.issues[0]?.code ?? "semantic_admission_rejected" }),
  };
}
