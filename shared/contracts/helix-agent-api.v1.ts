import { z } from "zod";

export const HELIX_AGENT_API_VERSION = "v1" as const;
export const HELIX_AGENT_RUN_SCHEMA = "helix.agent_run.v1" as const;
export const HELIX_AGENT_RUN_EVENT_SCHEMA = "helix.agent_run.event.v1" as const;
export const HELIX_AGENT_EVIDENCE_BUNDLE_SCHEMA =
  "helix.agent_run.evidence_bundle.v1" as const;
export const HELIX_AGENT_API_ERROR_SCHEMA = "helix.agent_api.error.v1" as const;

export const HELIX_AGENT_RUN_READ_SCOPE = "helix.agent_runs.read" as const;
export const HELIX_AGENT_RUN_WRITE_SCOPE = "helix.agent_runs.write" as const;
export const HELIX_AGENT_RUN_DEVELOPER_SCOPE =
  "helix.agent_runs.developer" as const;

export const helixAgentLifecycleStatusSchema = z.enum([
  "queued",
  "running",
  "waiting",
  "completed",
  "failed",
  "cancelled",
]);

export const helixAgentCompletionStatusSchema = z.enum([
  "pending",
  "completed",
  "needs_more_evidence",
  "needs_input",
  "conflict_detected",
  "blocked",
  "failed",
  "budget_exhausted",
  "cancelled",
]);

export const helixAgentTerminalAuthorityStatusSchema = z.enum([
  "not_evaluated",
  "pending_helix_terminal_authority",
  "authorized",
  "blocked",
  "not_terminal_authority",
]);

export const helixAgentRuntimeProviderSchema = z.literal("helix-ask");

export const helixAgentCompletionContractSchema = z
  .object({
    min_evidence_refs: z.number().int().min(0).max(128).default(1),
    require_terminal_authority: z.boolean().default(true),
    required_output_fields: z
      .array(z.string().trim().min(1).max(120))
      .max(32)
      .default([]),
    max_unresolved_requirements: z.number().int().min(0).max(128).default(0),
    allow_conflicts: z.boolean().default(false),
  })
  .strict();

export const DEFAULT_HELIX_AGENT_COMPLETION_CONTRACT = {
  min_evidence_refs: 1,
  require_terminal_authority: true,
  required_output_fields: [],
  max_unresolved_requirements: 0,
  allow_conflicts: false,
} satisfies z.input<typeof helixAgentCompletionContractSchema>;

export const helixAgentBudgetSchema = z
  .object({
    max_steps: z.number().int().min(1).max(64).default(12),
    expires_in_seconds: z
      .number()
      .int()
      .min(60)
      .max(7 * 24 * 60 * 60)
      .default(60 * 60),
  })
  .strict();

export const DEFAULT_HELIX_AGENT_BUDGET = {
  max_steps: 12,
  expires_in_seconds: 60 * 60,
} satisfies z.input<typeof helixAgentBudgetSchema>;

const boundedStringArray = (maxItems: number, maxLength: number) =>
  z.array(z.string().trim().min(1).max(maxLength)).max(maxItems);

export const helixAgentStartRequestSchema = z
  .object({
    objective: z.string().trim().min(1).max(20_000),
    constraints: boundedStringArray(64, 2_000).default([]),
    database_scope: boundedStringArray(64, 240).default([]),
    completion_contract: helixAgentCompletionContractSchema.default(
      DEFAULT_HELIX_AGENT_COMPLETION_CONTRACT,
    ),
    budget: helixAgentBudgetSchema.default(DEFAULT_HELIX_AGENT_BUDGET),
  })
  .strict();

export const helixAgentContinueRequestSchema = z
  .object({
    expected_version: z.number().int().positive(),
    instruction: z.string().trim().min(1).max(20_000).optional(),
    answers: z
      .array(
        z
          .object({
            question_id: z.string().trim().min(1).max(240),
            value: z.unknown(),
          })
          .strict(),
      )
      .max(64)
      .default([]),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.instruction || value.answers.length > 0) {
      return;
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "A continuation must contain an instruction or a question answer.",
    });
  });

export const helixAgentCancelRequestSchema = z
  .object({
    expected_version: z.number().int().positive(),
    reason: z.string().trim().min(1).max(1_000).default("cancelled_by_client"),
  })
  .strict();

export const helixAgentEventsQuerySchema = z
  .object({
    after_seq: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(200).default(100),
  })
  .strict();

export const helixAgentEvidenceBundleSchema = z
  .object({
    schema: z.literal(HELIX_AGENT_EVIDENCE_BUNDLE_SCHEMA),
    run_id: z.string(),
    observation_refs: z.array(z.string()),
    evidence_refs: z.array(z.string()),
    receipt_refs: z.array(z.string()),
    provider_terminal_candidate_ref: z.string().nullable(),
    claims_supported: z.array(z.string()),
    claims_contradicted: z.array(z.string()),
    unresolved_requirements: z.array(z.string()),
    terminal_authority_status: helixAgentTerminalAuthorityStatusSchema,
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export const helixAgentPendingQuestionSchema = z
  .object({
    question_id: z.string().trim().min(1).max(240),
    prompt: z.string().trim().min(1).max(2_000),
    required_fields: boundedStringArray(32, 120),
    options: z
      .array(
        z
          .object({
            value: z.string().max(500),
            label: z.string().trim().min(1).max(500),
          })
          .strict(),
      )
      .max(32),
  })
  .strict();

export const helixAgentRunRecommendedActionSchema = z
  .object({
    operation: z.enum([
      "continue",
      "inspect",
      "fetch_evidence",
      "cancel",
      "none",
    ]),
    reason: z.string(),
  })
  .strict();

export const helixAgentRunSchema = z
  .object({
    schema: z.literal(HELIX_AGENT_RUN_SCHEMA),
    api_version: z.literal(HELIX_AGENT_API_VERSION),
    run_id: z.string(),
    ownership: z
      .object({
        tenant_ref: z.string(),
        principal_ref: z.string(),
        account_profile_ref: z.string(),
      })
      .strict(),
    objective: z.string(),
    objective_hash: z.string(),
    runtime_provider: helixAgentRuntimeProviderSchema,
    lifecycle_status: helixAgentLifecycleStatusSchema,
    completion_status: helixAgentCompletionStatusSchema,
    terminal_authority_status: helixAgentTerminalAuthorityStatusSchema,
    version: z.number().int().positive(),
    completion_contract: helixAgentCompletionContractSchema,
    constraints: z.array(z.string()),
    database_scope: z.array(z.string()),
    budget: z
      .object({
        max_steps: z.number().int().positive(),
        steps_used: z.number().int().min(0),
        expires_at: z.string(),
      })
      .strict(),
    summary: z.string().nullable(),
    unresolved_requirements: z.array(z.string()),
    contradictions: z.array(z.string()),
    pending_questions: z.array(helixAgentPendingQuestionSchema),
    evidence: helixAgentEvidenceBundleSchema,
    latest_result: z.record(z.unknown()).nullable(),
    recommended_next_action: helixAgentRunRecommendedActionSchema,
    created_at: z.string(),
    updated_at: z.string(),
    completed_at: z.string().nullable(),
    cancelled_at: z.string().nullable(),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export const helixAgentRunEventTypeSchema = z.enum([
  "run_started",
  "runtime_recovered",
  "continuation_received",
  "evidence_reentered",
  "issues_resolved",
  "input_requested",
  "terminal_authority_evaluated",
  "run_waiting",
  "run_completed",
  "run_blocked",
  "run_failed",
  "run_cancelled",
  "budget_exhausted",
]);

export const helixAgentRunEventSchema = z
  .object({
    schema: z.literal(HELIX_AGENT_RUN_EVENT_SCHEMA),
    event_id: z.string(),
    run_id: z.string(),
    seq: z.number().int().positive(),
    event_type: helixAgentRunEventTypeSchema,
    payload: z.record(z.unknown()),
    created_at: z.string(),
    answer_authority: z.literal(false),
    assistant_answer: z.literal(false),
    terminal_eligible: z.literal(false),
    raw_content_included: z.literal(false),
  })
  .strict();

export const helixAgentApiErrorCodeSchema = z.enum([
  "invalid_request",
  "unauthorized",
  "insufficient_scope",
  "tenant_required",
  "tenant_mismatch",
  "account_not_linked",
  "account_policy_blocked",
  "not_found",
  "version_conflict",
  "idempotency_conflict",
  "idempotency_in_progress",
  "outcome_unknown",
  "run_not_resumable",
  "run_busy",
  "budget_exhausted",
  "auth_not_configured",
  "origin_not_allowed",
  "host_not_allowed",
  "https_required",
  "scope_policy_not_configured",
  "internal_error",
]);

export const helixAgentApiErrorSchema = z
  .object({
    schema: z.literal(HELIX_AGENT_API_ERROR_SCHEMA),
    error: helixAgentApiErrorCodeSchema,
    message: z.string(),
    request_id: z.string().nullable(),
    retryable: z.boolean(),
    details: z.record(z.unknown()).optional(),
  })
  .strict();

export type HelixAgentLifecycleStatus = z.infer<
  typeof helixAgentLifecycleStatusSchema
>;
export type HelixAgentCompletionStatus = z.infer<
  typeof helixAgentCompletionStatusSchema
>;
export type HelixAgentTerminalAuthorityStatus = z.infer<
  typeof helixAgentTerminalAuthorityStatusSchema
>;
export type HelixAgentRuntimeProvider = z.infer<
  typeof helixAgentRuntimeProviderSchema
>;
export type HelixAgentCompletionContract = z.infer<
  typeof helixAgentCompletionContractSchema
>;
export type HelixAgentBudget = z.infer<typeof helixAgentBudgetSchema>;
export type HelixAgentStartRequest = z.infer<
  typeof helixAgentStartRequestSchema
>;
export type HelixAgentContinueRequest = z.infer<
  typeof helixAgentContinueRequestSchema
>;
export type HelixAgentCancelRequest = z.infer<
  typeof helixAgentCancelRequestSchema
>;
export type HelixAgentEvidenceBundle = z.infer<
  typeof helixAgentEvidenceBundleSchema
>;
export type HelixAgentPendingQuestion = z.infer<
  typeof helixAgentPendingQuestionSchema
>;
export type HelixAgentRun = z.infer<typeof helixAgentRunSchema>;
export type HelixAgentRunEventType = z.infer<
  typeof helixAgentRunEventTypeSchema
>;
export type HelixAgentRunEvent = z.infer<typeof helixAgentRunEventSchema>;
export type HelixAgentApiErrorCode = z.infer<
  typeof helixAgentApiErrorCodeSchema
>;
export type HelixAgentApiError = z.infer<typeof helixAgentApiErrorSchema>;
