import { z } from "zod";

export const HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA =
  "helix.mcp_evidence_capability_descriptor.v1" as const;
export const HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA =
  "helix.mcp_evidence_observation.v1" as const;
export const HELIX_MCP_EVIDENCE_CONFORMANCE_ROW_SCHEMA =
  "helix.mcp_evidence_conformance_row.v1" as const;
export const HELIX_MCP_EVIDENCE_REENTRY_RECORD_SCHEMA =
  "helix.mcp_evidence_reentry_record.v1" as const;
export const HELIX_MCP_EVIDENCE_TERMINAL_ASSESSMENT_SCHEMA =
  "helix.mcp_evidence_terminal_assessment.v1" as const;

export const HELIX_MCP_EVIDENCE_ACCOUNT_SCOPES = [
  "developer",
  "user",
  "user_feature_gated",
] as const;

export const HELIX_MCP_EVIDENCE_PERMISSION_CLASSES = [
  "read_observe",
  "ui_projection",
  "user_confirmed_side_effect",
  "mutating_control",
] as const;

export const HELIX_MCP_EVIDENCE_INTERACTION_KINDS = [
  "observe",
  "configure",
  "act",
] as const;

export const HELIX_MCP_EVIDENCE_EFFECT_CLASSES = [
  "read_only",
  "reversible_configuration",
  "consequential_action",
] as const;

export const HELIX_MCP_EVIDENCE_CONFIRMATION_POLICIES = [
  "never",
  "conditional",
  "always",
] as const;

export const HELIX_MCP_EVIDENCE_RETENTION_CLASSES = [
  "current_turn",
  "current_session",
  "profile_durable",
  "source_managed",
] as const;

export const HELIX_MCP_EVIDENCE_TERMINAL_SUPPORT_POLICIES = [
  "not_citable",
  "current_turn_only",
  "reusable_while_fresh",
] as const;

export const HELIX_MCP_EVIDENCE_CLAIM_CEILING_CLASSES = [
  "metadata_only",
  "bounded_observation",
  "evidence_support",
] as const;

export const HELIX_MCP_EVIDENCE_OUTCOMES = [
  "succeeded",
  "partial",
  "rejected",
  "failed",
] as const;

export const HELIX_MCP_EVIDENCE_FRESHNESS_STATES = [
  "fresh",
  "stale",
  "not_applicable",
] as const;

export const HELIX_MCP_EVIDENCE_RETRYABILITY_STATES = [
  "not_retryable",
  "codex_may_retry",
  "requires_user_input",
  "requires_new_authority",
] as const;

export const HELIX_MCP_EVIDENCE_CONFORMANCE_DIMENSIONS = [
  "catalog_identity",
  "account_admission",
  "handler_parity",
  "effect_boundary",
  "observation_schema",
  "observation_identity",
  "secret_exclusion",
  "durable_retrieval",
  "reentry",
  "followup_ownership",
  "terminal_grounding",
  "ui_crosswalk",
  "deterministic_evidence",
  "live_convergence",
] as const;

export const HELIX_MCP_EVIDENCE_CONFORMANCE_STATES = [
  "not_assessed",
  "not_applicable",
  "gap",
  "conforms",
] as const;

export const HELIX_MCP_EVIDENCE_FORBIDDEN_PAYLOAD_KEYS = [
  "access_token",
  "refresh_token",
  "authorization",
  "bearer_token",
  "password",
  "client_secret",
  "private_key",
  "pairing_code",
  "pairing_material",
  "private_endpoint",
  "raw_prompt",
  "chain_of_thought",
  "hidden_reasoning",
] as const;

export type HelixMcpEvidenceJsonValue =
  | string
  | number
  | boolean
  | null
  | HelixMcpEvidenceJsonValue[]
  | { [key: string]: HelixMcpEvidenceJsonValue };
export type HelixMcpEvidenceClaimCeilingClass =
  (typeof HELIX_MCP_EVIDENCE_CLAIM_CEILING_CLASSES)[number];
export type HelixMcpEvidenceTerminalFailureCode =
  (typeof HELIX_MCP_EVIDENCE_TERMINAL_FAILURE_CODES)[number];

const boundedIdentifierSchema = z.string().trim().min(1).max(320);
const boundedDescriptionSchema = z.string().trim().min(1).max(4_000);
const boundedRefArraySchema = z
  .array(boundedIdentifierSchema)
  .max(128)
  .default([]);
const timestampSchema = z.string().datetime({ offset: true });
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/);

export const helixMcpEvidenceJsonValueSchema: z.ZodType<HelixMcpEvidenceJsonValue> =
  z.lazy(() =>
    z.union([
      z.string(),
      z.number().finite(),
      z.boolean(),
      z.null(),
      z.array(helixMcpEvidenceJsonValueSchema).max(2_048),
      z.record(z.string(), helixMcpEvidenceJsonValueSchema),
    ]),
  );

const payloadSchema = z
  .record(z.string(), helixMcpEvidenceJsonValueSchema)
  .superRefine((payload, context) => {
    const visit = (value: HelixMcpEvidenceJsonValue, path: (string | number)[]): void => {
      if (Array.isArray(value)) {
        value.forEach((entry, index) => visit(entry, [...path, index]));
        return;
      }
      if (!value || typeof value !== "object") return;
      for (const [key, entry] of Object.entries(value)) {
        if ((HELIX_MCP_EVIDENCE_FORBIDDEN_PAYLOAD_KEYS as readonly string[]).includes(key.toLowerCase())) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [...path, key],
            message: `MCP evidence payloads cannot contain the reserved key ${key}.`,
          });
        }
        visit(entry, [...path, key]);
      }
    };

    visit(payload, []);
    const serialized = JSON.stringify(payload);
    if (serialized.length > 256_000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MCP evidence payloads must serialize to at most 256000 characters.",
      });
    }
  });

export const helixMcpEvidenceAuthoritySchema = z
  .object({
    assistant_answer: z.literal(false),
    answer_authority: z.literal(false),
    agent_executable: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
    reentry_required: z.literal(true),
  })
  .strict();

export const HELIX_MCP_EVIDENCE_AUTHORITY = {
  assistant_answer: false,
  answer_authority: false,
  agent_executable: false,
  terminal_eligible: false,
  raw_content_included: false,
  reentry_required: true,
} as const;

export const helixMcpEvidenceClaimCeilingSchema = z
  .object({
    class: z.enum(HELIX_MCP_EVIDENCE_CLAIM_CEILING_CLASSES),
    description: boundedDescriptionSchema,
  })
  .strict();

export const helixMcpEvidenceAdmissionProfileSchema = z
  .object({
    surface: boundedIdentifierSchema,
    account_scope: z.enum(HELIX_MCP_EVIDENCE_ACCOUNT_SCOPES),
    required_oauth_scopes: z.array(boundedIdentifierSchema).min(1).max(32),
  })
  .strict();

export const helixMcpEvidenceCapabilityDescriptorSchema = z
  .object({
    schema: z.literal(HELIX_MCP_EVIDENCE_CAPABILITY_DESCRIPTOR_SCHEMA),
    capability_id: boundedIdentifierSchema,
    capability_version: z.number().int().positive(),
    mcp_tool_name: boundedIdentifierSchema,
    semantic_family: boundedIdentifierSchema,
    handler_id: boundedIdentifierSchema,
    handler_contract_version: boundedIdentifierSchema,
    admission_profiles: z.array(helixMcpEvidenceAdmissionProfileSchema).min(1).max(8),
    permission_class: z.enum(HELIX_MCP_EVIDENCE_PERMISSION_CLASSES),
    interaction_kind: z.enum(HELIX_MCP_EVIDENCE_INTERACTION_KINDS),
    effect_class: z.enum(HELIX_MCP_EVIDENCE_EFFECT_CLASSES),
    confirmation_policy: z.enum(HELIX_MCP_EVIDENCE_CONFIRMATION_POLICIES),
    observation_schema: boundedIdentifierSchema,
    observation_retention_class: z.enum(HELIX_MCP_EVIDENCE_RETENTION_CLASSES),
    reentry_required: z.literal(true),
    terminal_support_policy: z.enum(HELIX_MCP_EVIDENCE_TERMINAL_SUPPORT_POLICIES),
    claim_ceiling: helixMcpEvidenceClaimCeilingSchema,
  })
  .strict()
  .superRefine((descriptor, context) => {
    const surfaces = descriptor.admission_profiles.map((profile) => profile.surface);
    if (new Set(surfaces).size !== surfaces.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["admission_profiles"],
        message: "MCP evidence admission profile surfaces must be unique.",
      });
    }
    if (descriptor.effect_class === "read_only") {
      if (descriptor.permission_class !== "read_observe") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["permission_class"],
          message: "Read-only evidence capabilities require read_observe permission.",
        });
      }
      if (descriptor.interaction_kind !== "observe") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["interaction_kind"],
          message: "Read-only evidence capabilities require observe interaction kind.",
        });
      }
      if (descriptor.confirmation_policy !== "never") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmation_policy"],
          message: "Read-only evidence capabilities cannot require mutation confirmation.",
        });
      }
    }

    if (
      descriptor.effect_class === "consequential_action" &&
      descriptor.permission_class === "read_observe"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["permission_class"],
        message: "Consequential actions cannot use read_observe permission.",
      });
    }
  });

export const helixMcpEvidenceObservationSchema = z
  .object({
    schema: z.literal(HELIX_MCP_EVIDENCE_OBSERVATION_SCHEMA),
    observation_ref: boundedIdentifierSchema,
    capability_id: boundedIdentifierSchema,
    capability_version: z.number().int().positive(),
    tool_call_ref: boundedIdentifierSchema,
    handler_id: boundedIdentifierSchema,
    handler_contract_version: boundedIdentifierSchema,
    producer_ref: boundedIdentifierSchema,
    subject_refs: boundedRefArraySchema,
    request_fingerprint: sha256Schema,
    outcome: z.enum(HELIX_MCP_EVIDENCE_OUTCOMES),
    summary: boundedDescriptionSchema,
    payload_schema: boundedIdentifierSchema,
    payload: payloadSchema,
    support_refs: boundedRefArraySchema,
    missing_or_uncertain: z.array(z.string().trim().min(1).max(1_000)).max(128).default([]),
    observed_at: timestampSchema,
    freshness: z
      .object({
        state: z.enum(HELIX_MCP_EVIDENCE_FRESHNESS_STATES),
        age_ms: z.number().int().nonnegative().nullable(),
        expires_at: timestampSchema.nullable(),
      })
      .strict(),
    provenance: z
      .object({
        valid: z.boolean(),
        payload_sha256: sha256Schema,
        source_refs: boundedRefArraySchema,
      })
      .strict(),
    retryability: z
      .object({
        state: z.enum(HELIX_MCP_EVIDENCE_RETRYABILITY_STATES),
        reason_codes: z.array(boundedIdentifierSchema).max(64).default([]),
        missing_requirement_ids: z.array(boundedIdentifierSchema).max(64).default([]),
      })
      .strict(),
    claim_ceiling: helixMcpEvidenceClaimCeilingSchema,
    retention: z
      .object({
        class: z.enum(HELIX_MCP_EVIDENCE_RETENTION_CLASSES),
        retrieval_allowed: z.boolean(),
        retained_until: timestampSchema.nullable(),
        revocation_ref: boundedIdentifierSchema.nullable(),
      })
      .strict(),
    authority: helixMcpEvidenceAuthoritySchema,
  })
  .strict()
  .superRefine((observation, context) => {
    if (observation.outcome === "succeeded" && !observation.provenance.valid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["provenance", "valid"],
        message: "A succeeded MCP evidence observation requires valid provenance.",
      });
    }
    if (observation.freshness.state === "fresh" && observation.freshness.age_ms === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["freshness", "age_ms"],
        message: "Fresh MCP evidence requires a measured non-negative age.",
      });
    }
    if (observation.freshness.state === "not_applicable" && observation.freshness.age_ms !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["freshness", "age_ms"],
        message: "Evidence without freshness semantics cannot claim a measured age.",
      });
    }
    if (observation.retention.retrieval_allowed && observation.retention.class === "current_turn") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["retention", "retrieval_allowed"],
        message: "Current-turn-only evidence cannot advertise durable retrieval.",
      });
    }
  });

const conformanceStateSchema = z.enum(HELIX_MCP_EVIDENCE_CONFORMANCE_STATES);

export const helixMcpEvidenceConformanceDimensionsSchema = z
  .object({
    catalog_identity: conformanceStateSchema,
    account_admission: conformanceStateSchema,
    handler_parity: conformanceStateSchema,
    effect_boundary: conformanceStateSchema,
    observation_schema: conformanceStateSchema,
    observation_identity: conformanceStateSchema,
    secret_exclusion: conformanceStateSchema,
    durable_retrieval: conformanceStateSchema,
    reentry: conformanceStateSchema,
    followup_ownership: conformanceStateSchema,
    terminal_grounding: conformanceStateSchema,
    ui_crosswalk: conformanceStateSchema,
    deterministic_evidence: conformanceStateSchema,
    live_convergence: conformanceStateSchema,
  })
  .strict();

export const helixMcpEvidenceConformanceRowSchema = z
  .object({
    schema: z.literal(HELIX_MCP_EVIDENCE_CONFORMANCE_ROW_SCHEMA),
    capability_id: boundedIdentifierSchema,
    mcp_tool_name: boundedIdentifierSchema,
    dimensions: helixMcpEvidenceConformanceDimensionsSchema,
    evidence_refs: boundedRefArraySchema,
    gap_reason_codes: z.array(boundedIdentifierSchema).max(64).default([]),
    evaluated_at: timestampSchema,
  })
  .strict()
  .superRefine((row, context) => {
    const states = Object.values(row.dimensions);
    if (states.includes("conforms") && row.evidence_refs.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["evidence_refs"],
        message: "A conforming dimension requires at least one evidence reference.",
      });
    }
    if (states.includes("gap") && row.gap_reason_codes.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gap_reason_codes"],
        message: "A gap dimension requires at least one stable gap reason code.",
      });
    }
  });

export const helixMcpEvidenceReentryRecordSchema = z.object({
  schema: z.literal(HELIX_MCP_EVIDENCE_REENTRY_RECORD_SCHEMA),
  observation_ref: boundedIdentifierSchema,
  tool_call_ref: boundedIdentifierSchema,
  tool_result_published_at: timestampSchema,
  reentered_turn_id: boundedIdentifierSchema.nullable(),
  reentered_at: timestampSchema.nullable(),
  selected_for_reasoning: z.boolean(),
  selected_for_terminal_support: z.boolean(),
}).strict().superRefine((record, context) => {
  if ((record.reentered_turn_id === null) !== (record.reentered_at === null)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["reentered_turn_id"],
      message: "Re-entry turn and timestamp must be recorded together.",
    });
  }
  if (record.reentered_at === null &&
      (record.selected_for_reasoning || record.selected_for_terminal_support)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["selected_for_reasoning"],
      message: "An observation cannot be selected before exact re-entry.",
    });
  }
});

export const HELIX_MCP_EVIDENCE_TERMINAL_FAILURE_CODES = [
  "mcp_evidence_observation_ref_missing",
  "mcp_evidence_observation_not_found",
  "mcp_evidence_observation_not_reentered",
  "mcp_evidence_observation_not_selected",
  "mcp_evidence_observation_stale",
  "mcp_evidence_observation_scope_mismatch",
  "mcp_evidence_observation_integrity_failed",
  "mcp_evidence_claim_ceiling_exceeded",
  "mcp_evidence_unresolved_evidence_unacknowledged",
  "mcp_evidence_terminal_citation_missing",
] as const;

export const helixMcpEvidenceTerminalAssessmentSchema = z.object({
  schema: z.literal(HELIX_MCP_EVIDENCE_TERMINAL_ASSESSMENT_SCHEMA),
  terminal_eligible: z.boolean(),
  selected_support_refs: boundedRefArraySchema,
  failure_codes: z.array(z.enum(HELIX_MCP_EVIDENCE_TERMINAL_FAILURE_CODES)).max(128),
  assistant_answer: z.literal(false),
  answer_authored: z.literal(false),
}).strict().superRefine((assessment, context) => {
  if (assessment.terminal_eligible === (assessment.failure_codes.length > 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["terminal_eligible"],
      message: "Terminal eligibility must be false exactly when failures exist.",
    });
  }
});

export type HelixMcpEvidenceCapabilityDescriptor = z.infer<
  typeof helixMcpEvidenceCapabilityDescriptorSchema
>;
export type HelixMcpEvidenceObservation = z.infer<
  typeof helixMcpEvidenceObservationSchema
>;
export type HelixMcpEvidenceConformanceDimensions = z.infer<
  typeof helixMcpEvidenceConformanceDimensionsSchema
>;
export type HelixMcpEvidenceConformanceRow = z.infer<
  typeof helixMcpEvidenceConformanceRowSchema
>;
export type HelixMcpEvidenceReentryRecord = z.infer<
  typeof helixMcpEvidenceReentryRecordSchema
>;
export type HelixMcpEvidenceTerminalAssessment = z.infer<
  typeof helixMcpEvidenceTerminalAssessmentSchema
>;
