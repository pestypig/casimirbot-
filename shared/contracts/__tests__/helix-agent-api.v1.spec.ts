import { describe, expect, it } from "vitest";
import {
  HELIX_AGENT_API_VERSION,
  HELIX_AGENT_EVIDENCE_BUNDLE_SCHEMA,
  HELIX_AGENT_RUN_SCHEMA,
  helixAgentCancelRequestSchema,
  helixAgentContinueRequestSchema,
  helixAgentRunSchema,
  helixAgentStartRequestSchema,
} from "../helix-agent-api.v1";

describe("Helix agent API v1 contracts", () => {
  it("accepts only objective data on start and applies bounded defaults", () => {
    const request = helixAgentStartRequestSchema.parse({
      objective: "Compare the candidate mechanisms against admitted evidence.",
    });

    expect(request).toMatchObject({
      constraints: [],
      database_scope: [],
      completion_contract: {
        min_evidence_refs: 1,
        require_terminal_authority: true,
        required_output_fields: [],
        max_unresolved_requirements: 0,
        allow_conflicts: false,
      },
      budget: {
        max_steps: 12,
        expires_in_seconds: 3_600,
      },
    });

    for (const forbidden of [
      "tenant_id",
      "subject_id",
      "account_type",
      "allowed_tools",
      "provider_thread_id",
      "runtime_policy",
    ]) {
      expect(
        helixAgentStartRequestSchema.safeParse({
          objective: "test",
          [forbidden]: "attacker-controlled",
        }).success,
      ).toBe(false);
    }
  });

  it("requires a bounded continuation instruction or an answer", () => {
    expect(
      helixAgentContinueRequestSchema.safeParse({
        expected_version: 1,
      }).success,
    ).toBe(false);
    expect(
      helixAgentContinueRequestSchema.safeParse({
        expected_version: 1,
        answers: [{ question_id: "scope_choice", value: "include" }],
      }).success,
    ).toBe(true);
    expect(
      helixAgentContinueRequestSchema.safeParse({
        expected_version: 1,
        instruction: "Continue with the admitted archive.",
        database_scope: ["secret"],
      }).success,
    ).toBe(false);
  });

  it("requires optimistic concurrency for cancellation", () => {
    expect(
      helixAgentCancelRequestSchema.safeParse({
        reason: "stop",
      }).success,
    ).toBe(false);
    expect(
      helixAgentCancelRequestSchema.safeParse({
        expected_version: 2,
        reason: "stop",
      }).success,
    ).toBe(true);
  });

  it("keeps every public run and evidence projection non-authoritative", () => {
    const run = helixAgentRunSchema.parse({
      schema: HELIX_AGENT_RUN_SCHEMA,
      api_version: HELIX_AGENT_API_VERSION,
      run_id: "run_public_contract",
      ownership: {
        tenant_ref: "tenant:sha256:a",
        principal_ref: "principal:sha256:b",
        account_profile_ref: "account-profile:sha256:c",
      },
      objective: "test",
      objective_hash: "sha256:objective",
      runtime_provider: "helix-ask",
      lifecycle_status: "waiting",
      completion_status: "needs_more_evidence",
      terminal_authority_status: "not_evaluated",
      version: 1,
      completion_contract: {
        min_evidence_refs: 1,
        require_terminal_authority: true,
        required_output_fields: [],
        max_unresolved_requirements: 0,
        allow_conflicts: false,
      },
      constraints: [],
      database_scope: [],
      budget: {
        max_steps: 2,
        steps_used: 0,
        expires_at: "2026-07-26T20:00:00.000Z",
      },
      summary: null,
      unresolved_requirements: [],
      contradictions: [],
      pending_questions: [],
      evidence: {
        schema: HELIX_AGENT_EVIDENCE_BUNDLE_SCHEMA,
        run_id: "run_public_contract",
        observation_refs: [],
        evidence_refs: [],
        receipt_refs: [],
        provider_terminal_candidate_ref: null,
        claims_supported: [],
        claims_contradicted: [],
        unresolved_requirements: [],
        terminal_authority_status: "not_evaluated",
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      latest_result: null,
      recommended_next_action: {
        operation: "continue",
        reason: "more work",
      },
      created_at: "2026-07-26T19:00:00.000Z",
      updated_at: "2026-07-26T19:00:00.000Z",
      completed_at: null,
      cancelled_at: null,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    });

    expect(run.answer_authority).toBe(false);
    expect(run.assistant_answer).toBe(false);
    expect(run.terminal_eligible).toBe(false);
    expect(run.evidence.answer_authority).toBe(false);
    expect(
      helixAgentRunSchema.safeParse({
        ...run,
        answer_authority: true,
      }).success,
    ).toBe(false);
  });
});
