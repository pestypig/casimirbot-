import crypto from "node:crypto";

import {
  HELIX_MCP_EVIDENCE_AUTHORITY,
  HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,
  helixMcpEvidenceJsonValueSchema,
  helixMcpEvidenceObservationSchema,
  type HelixMcpEvidenceCapabilityDescriptor,
  type HelixMcpEvidenceJsonValue,
  type HelixMcpEvidenceObservation,
} from "@shared/contracts/helix-mcp-evidence-capability.v1";

const canonicalize = (value: HelixMcpEvidenceJsonValue): HelixMcpEvidenceJsonValue => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
};

export const helixMcpEvidenceSha256 = (value: HelixMcpEvidenceJsonValue): `sha256:${string}` =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex")}`;

const jsonObject = (value: unknown, label: string): Record<string, HelixMcpEvidenceJsonValue> => {
  const parsed = helixMcpEvidenceJsonValueSchema.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label}_must_be_a_json_object`);
  }
  return parsed;
};

export type BuildHelixMcpEvidenceObservationInput = {
  descriptor: HelixMcpEvidenceCapabilityDescriptor;
  request: unknown;
  payload: unknown;
  toolCallRef?: string;
  producerRef: string;
  subjectRefs?: string[];
  summary: string;
  payloadSchema: string;
  supportRefs?: string[];
  missingOrUncertain?: string[];
  observedAt?: string;
  freshness?: {
    state: "fresh" | "stale" | "not_applicable";
    ageMs: number | null;
    expiresAt: string | null;
  };
  retryability?: {
    state: "not_retryable" | "codex_may_retry" | "requires_user_input" | "requires_new_authority";
    reasonCodes?: string[];
    missingRequirementIds?: string[];
  };
  observationRefFactory?: () => string;
  retainedUntil?: string;
};

export const buildHelixMcpEvidenceObservation = (
  input: BuildHelixMcpEvidenceObservationInput,
): HelixMcpEvidenceObservation => {
  const request = jsonObject(input.request, "mcp_evidence_request");
  const payload = jsonObject(input.payload, "mcp_evidence_payload");
  const observedAt = input.observedAt ?? new Date().toISOString();
  const observationRef = input.observationRefFactory?.() ??
    `mcp_evidence_observation:${input.descriptor.capability_id}:${crypto.randomUUID()}`;
  const toolCallRef = input.toolCallRef ??
    `mcp_tool_call:${input.descriptor.mcp_tool_name}:${crypto.randomUUID()}`;
  const retrievalAllowed = input.descriptor.observation_retention_class !== "current_turn";
  const retainedUntil = retrievalAllowed
    ? input.retainedUntil ?? new Date(Date.now() + 86_400_000).toISOString()
    : null;

  return helixMcpEvidenceObservationSchema.parse({
    schema: HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,
    observation_ref: observationRef,
    capability_id: input.descriptor.capability_id,
    capability_version: input.descriptor.capability_version,
    tool_call_ref: toolCallRef,
    handler_id: input.descriptor.handler_id,
    handler_contract_version: input.descriptor.handler_contract_version,
    producer_ref: input.producerRef,
    subject_refs: input.subjectRefs ?? [],
    request_fingerprint: helixMcpEvidenceSha256(request),
    outcome: "succeeded",
    summary: input.summary,
    payload_schema: input.payloadSchema,
    payload,
    support_refs: input.supportRefs ?? [],
    missing_or_uncertain: input.missingOrUncertain ?? [],
    observed_at: observedAt,
    freshness: {
      state: input.freshness?.state ?? "not_applicable",
      age_ms: input.freshness?.ageMs ?? null,
      expires_at: input.freshness?.expiresAt ?? null,
    },
    provenance: {
      valid: true,
      payload_sha256: helixMcpEvidenceSha256(payload),
      source_refs: input.supportRefs ?? [],
    },
    retryability: {
      state: input.retryability?.state ?? "not_retryable",
      reason_codes: input.retryability?.reasonCodes ?? [],
      missing_requirement_ids: input.retryability?.missingRequirementIds ?? [],
    },
    claim_ceiling: input.descriptor.claim_ceiling,
    retention: {
      class: input.descriptor.observation_retention_class,
      retrieval_allowed: retrievalAllowed,
      retained_until: retainedUntil,
      revocation_ref: null,
    },
    authority: HELIX_MCP_EVIDENCE_AUTHORITY,
  });
};
