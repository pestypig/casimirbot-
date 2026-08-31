import { describe, expect, it } from "vitest";

import {
  HELIX_MCP_EVIDENCE_AUTHORITY,
  HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA,
  HELIX_MCP_EVIDENCE_CONFORMANCE_DIMENSIONS,
  HELIX_MCP_EVIDENCE_CONFORMANCE_ROW_SCHEMA,
  HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,
  helixMcpEvidenceCapabilityDescriptorSchema,
  helixMcpEvidenceConformanceRowSchema,
  helixMcpEvidenceObservationSchema,
} from "../helix-mcp-evidence-capability.v1";

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`;

const descriptor = {
  schema: HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA,
  capability_id: "helix.public_ui.catalog.inspect",
  capability_version: 1,
  mcp_tool_name: "helix_public_ui_catalog",
  semantic_family: "public_ui.catalog",
  handler_id: "helix.public_ui.catalog.handler",
  handler_contract_version: "helix.public_ui_agent_catalog.v1",
  admission_profiles: [
    {
      surface: "full_helix_mcp",
      account_scope: "user" as const,
      required_oauth_scopes: ["helix.agent_runs.read"],
    },
    {
      surface: "device_check_mcp",
      account_scope: "user" as const,
      required_oauth_scopes: ["helix.shared_live_rooms.read"],
    },
  ],
  permission_class: "read_observe" as const,
  interaction_kind: "observe" as const,
  effect_class: "read_only" as const,
  confirmation_policy: "never" as const,
  observation_schema: "helix.public_ui_agent_catalog.v1",
  observation_retention_class: "current_session" as const,
  reentry_required: true as const,
  terminal_support_policy: "reusable_while_fresh" as const,
  claim_ceiling: {
    class: "metadata_only" as const,
    description: "Supports claims about the admitted public capability catalog only.",
  },
};

const observation = {
  schema: HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA,
  observation_ref: "mcp_evidence_observation:public-ui:1",
  capability_id: descriptor.capability_id,
  capability_version: 1,
  tool_call_ref: "mcp_tool_call:public-ui:1",
  handler_id: descriptor.handler_id,
  handler_contract_version: descriptor.handler_contract_version,
  producer_ref: "casimirbot-node:test",
  subject_refs: ["account-profile:test"],
  request_fingerprint: hash("a"),
  outcome: "succeeded" as const,
  summary: "The bounded public UI capability catalog was observed.",
  payload_schema: descriptor.observation_schema,
  payload: {
    public_control_count: 398,
    public_capability_count: 40,
    filters: ["surface_id", "interaction_kind", "authority_state"],
  },
  support_refs: ["public-ui-catalog:revision:1"],
  missing_or_uncertain: [],
  observed_at: "2026-08-29T12:00:00.000Z",
  freshness: {
    state: "fresh" as const,
    age_ms: 0,
    expires_at: "2026-08-29T12:05:00.000Z",
  },
  provenance: {
    valid: true,
    payload_sha256: hash("b"),
    source_refs: ["public-ui-catalog:revision:1"],
  },
  retryability: {
    state: "not_retryable" as const,
    reason_codes: [],
    missing_requirement_ids: [],
  },
  claim_ceiling: descriptor.claim_ceiling,
  retention: {
    class: "current_session" as const,
    retrieval_allowed: true,
    retained_until: "2026-08-29T13:00:00.000Z",
    revocation_ref: null,
  },
  authority: HELIX_MCP_EVIDENCE_AUTHORITY,
};

const allDimensions = Object.fromEntries(
  HELIX_MCP_EVIDENCE_CONFORMANCE_DIMENSIONS.map((dimension) => [
    dimension,
    dimension === "live_convergence" ? "not_assessed" : "conforms",
  ]),
);

describe("Helix MCP evidence capability v1", () => {
  it("accepts a provider-neutral read-only descriptor", () => {
    expect(helixMcpEvidenceCapabilityDescriptorSchema.parse(descriptor)).toEqual(descriptor);
  });

  it("rejects contradictory read-only admission metadata", () => {
    for (const override of [
      { permission_class: "mutating_control" },
      { interaction_kind: "act" },
      { confirmation_policy: "always" },
    ]) {
      expect(
        helixMcpEvidenceCapabilityDescriptorSchema.safeParse({
          ...descriptor,
          ...override,
        }).success,
      ).toBe(false);
    }
  });

  it("requires unique explicit admission profiles for multi-surface tools", () => {
    expect(
      helixMcpEvidenceCapabilityDescriptorSchema.safeParse({
        ...descriptor,
        admission_profiles: [
          descriptor.admission_profiles[0],
          descriptor.admission_profiles[0],
        ],
      }).success,
    ).toBe(false);
  });

  it("accepts a bounded JSON observation with immutable authority negatives", () => {
    expect(helixMcpEvidenceObservationSchema.parse(observation)).toEqual(observation);

    for (const field of [
      "assistant_answer",
      "answer_authority",
      "agent_executable",
      "terminal_eligible",
      "raw_content_included",
    ] as const) {
      expect(
        helixMcpEvidenceObservationSchema.safeParse({
          ...observation,
          authority: { ...observation.authority, [field]: true },
        }).success,
      ).toBe(false);
    }
    expect(
      helixMcpEvidenceObservationSchema.safeParse({
        ...observation,
        authority: { ...observation.authority, reentry_required: false },
      }).success,
    ).toBe(false);
  });

  it("rejects reserved secret and hidden-reasoning payload keys at any depth", () => {
    for (const payload of [
      { access_token: "redacted-but-forbidden" },
      { nested: { pairing_material: "forbidden" } },
      { rows: [{ hidden_reasoning: "forbidden" }] },
    ]) {
      expect(
        helixMcpEvidenceObservationSchema.safeParse({
          ...observation,
          payload,
        }).success,
      ).toBe(false);
    }
  });

  it("enforces provenance, freshness, and retrieval invariants", () => {
    expect(
      helixMcpEvidenceObservationSchema.safeParse({
        ...observation,
        provenance: { ...observation.provenance, valid: false },
      }).success,
    ).toBe(false);
    expect(
      helixMcpEvidenceObservationSchema.safeParse({
        ...observation,
        freshness: { state: "fresh", age_ms: null, expires_at: null },
      }).success,
    ).toBe(false);
    expect(
      helixMcpEvidenceObservationSchema.safeParse({
        ...observation,
        retention: {
          class: "current_turn",
          retrieval_allowed: true,
          retained_until: null,
          revocation_ref: null,
        },
      }).success,
    ).toBe(false);
  });

  it("requires evidence for conforms and stable reasons for gaps", () => {
    const validRow = {
      schema: HELIX_MCP_EVIDENCE_CONFORMANCE_ROW_SCHEMA,
      capability_id: descriptor.capability_id,
      mcp_tool_name: descriptor.mcp_tool_name,
      dimensions: allDimensions,
      evidence_refs: ["test:helix-mcp-evidence-capability:v1"],
      gap_reason_codes: [],
      evaluated_at: "2026-08-29T12:00:00.000Z",
    };
    expect(helixMcpEvidenceConformanceRowSchema.safeParse(validRow).success).toBe(true);
    expect(
      helixMcpEvidenceConformanceRowSchema.safeParse({
        ...validRow,
        evidence_refs: [],
      }).success,
    ).toBe(false);
    expect(
      helixMcpEvidenceConformanceRowSchema.safeParse({
        ...validRow,
        dimensions: { ...allDimensions, durable_retrieval: "gap" },
        gap_reason_codes: [],
      }).success,
    ).toBe(false);
    expect(
      helixMcpEvidenceConformanceRowSchema.safeParse({
        ...validRow,
        dimensions: { ...allDimensions, durable_retrieval: "gap" },
        gap_reason_codes: ["mcp_evidence_durable_retrieval_missing"],
      }).success,
    ).toBe(true);
  });
});
