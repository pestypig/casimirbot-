import { describe, expect, it } from "vitest";

import {
  appendHelixAgentContinuationStateToPayload,
  appendHelixTerminalRejectionObservationToPayload,
  buildHelixAgentContinuationState,
  buildHelixTerminalRejectionObservation,
  resolveHelixContinuationBudgetExtension,
} from "../agent-continuation-state";

const artifact = (args: {
  id: string;
  kind: string;
  payload?: Record<string, unknown>;
}): Record<string, unknown> => ({
  artifact_id: args.id,
  turn_id: "ask:continuation",
  kind: args.kind,
  source_scope: "current_turn",
  payload: args.payload ?? {},
});

const budget = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  schema: "helix.agent_loop_budget.v1",
  max_iterations: 3,
  max_tool_calls: 2,
  max_llm_decisions: 3,
  hard_max_iterations: 8,
  hard_max_tool_calls: 6,
  hard_max_llm_decisions: 8,
  consumed_iterations: 3,
  consumed_tool_calls: 1,
  consumed_llm_decisions: 3,
  budget_extension_count: 0,
  max_extensions: 3,
  ...overrides,
});

describe("agent continuation state", () => {
  it("publishes a non-terminal initial state and preserves it in the current-turn ledger", () => {
    const payload: Record<string, unknown> = {
      debug: {},
      goal_satisfaction_evaluation: {
        satisfaction: "unsatisfied",
        missing_requirement_ids: ["doc_evidence"],
      },
      agent_loop_budget: budget({ consumed_iterations: 0, consumed_llm_decisions: 0 }),
      current_turn_artifact_ledger: [],
      runtime_continuation_hints: [
        {
          schema: "helix.runtime_continuation_hint.v1",
          turn_id: "ask:continuation",
          hint_id: "ask:continuation:hint:docs",
          suggested_capability: "docs.read_current",
          suggested_args: { path: "docs/current.md" },
          reason: "The current document is required.",
        },
      ],
    };

    const state = buildHelixAgentContinuationState({
      payload,
      turnId: "ask:continuation",
      trigger: "initial",
    });
    appendHelixAgentContinuationStateToPayload({ payload, state });

    expect(state).toMatchObject({
      schema: "helix.agent_continuation_state.v1",
      sequence: 1,
      trigger: "initial",
      goal: { status: "in_progress", satisfied: false },
      missing_requirement_ids: ["doc_evidence"],
      allowed_decisions: ["act", "answer"],
      authority: "runtime_agent_decides_within_admitted_boundaries",
      terminal_eligible: false,
      assistant_answer: false,
    });
    expect(state.next_admissible_affordances[0]).toMatchObject({
      capability_id: "docs.read_current",
      tried: false,
      admissible: true,
    });
    expect(payload.agent_continuation_state).toBe(state);
    expect((payload.current_turn_artifact_ledger as Array<Record<string, unknown>>).at(-1)).toMatchObject({
      kind: "agent_continuation_state",
      payload: { terminal_eligible: false, assistant_answer: false },
    });
  });

  it("marks new observations and resolved requirements as progress after an attempt", () => {
    const firstPayload: Record<string, unknown> = {
      goal_satisfaction_evaluation: {
        satisfaction: "unsatisfied",
        missing_requirement_ids: ["doc_evidence", "terminal_answer"],
      },
      agent_loop_budget: budget(),
      current_turn_artifact_ledger: [],
    };
    const first = buildHelixAgentContinuationState({
      payload: firstPayload,
      turnId: "ask:continuation",
      trigger: "pre_decision",
    });
    const secondPayload: Record<string, unknown> = {
      goal_satisfaction_evaluation: {
        satisfaction: "unsatisfied",
        missing_requirement_ids: ["terminal_answer"],
      },
      agent_loop_budget: budget(),
      current_turn_artifact_ledger: [
        artifact({
          id: "ask:continuation:doc_evidence:1",
          kind: "doc_evidence_observation",
          payload: { ok: true },
        }),
      ],
    };

    const second = buildHelixAgentContinuationState({
      payload: secondPayload,
      turnId: "ask:continuation",
      trigger: "post_attempt",
      previousState: first,
      lastAttempt: {
        attempt_id: "attempt:docs",
        capability_id: "docs.read_current",
        status: "succeeded",
        observation_refs: ["ask:continuation:doc_evidence:1"],
      },
    });

    expect(second.observation_refs.new).toEqual(["ask:continuation:doc_evidence:1"]);
    expect(second.progress).toMatchObject({
      made_progress: true,
      new_observation_count: 1,
      resolved_requirement_ids: ["doc_evidence"],
      no_progress_repeat_count: 0,
    });
  });

  it.each([
    "docs.read_current",
    "visual_analysis.inspect_image_region",
    "scientific-calculator.solve_expression",
    "moral-graph.reflect_context",
    "scholarly-research.lookup_papers",
    "workstation-notes.create_note",
  ])("uses the same retry and budget rule for %s", (capabilityId) => {
    const payload: Record<string, unknown> = {
      goal_satisfaction_evaluation: {
        satisfaction: "unsatisfied",
        missing_requirement_ids: ["evidence"],
      },
      agent_loop_budget: budget(),
      current_turn_artifact_ledger: [],
      runtime_continuation_hints: [
        {
          schema: "helix.runtime_continuation_hint.v1",
          turn_id: "ask:continuation",
          hint_id: `hint:${capabilityId}`,
          suggested_capability: capabilityId,
          suggested_args: { target: "current" },
          reason: "An admitted attempt remains available.",
        },
      ],
    };
    const state = buildHelixAgentContinuationState({
      payload,
      turnId: "ask:continuation",
      trigger: "post_attempt",
      lastAttempt: {
        attempt_id: `attempt:${capabilityId}`,
        capability_id: capabilityId,
        status: "failed",
        failure_code: "temporary_backend_unavailable",
        retryability: "retryable",
      },
    });
    const extension = resolveHelixContinuationBudgetExtension({
      state,
      current: { iterations: 3, tool_calls: 2, model_decisions: 3 },
      hard: { iterations: 8, tool_calls: 6, model_decisions: 8 },
    });

    expect(state.allowed_decisions).toEqual(expect.arrayContaining(["act", "retry", "answer"]));
    expect(extension).toEqual({
      extend: true,
      reason: "progress_under_soft_budget_pressure",
      increments: { iterations: 2, tool_calls: 1, model_decisions: 2 },
    });
  });

  it("stops extending after repeated attempts make no progress", () => {
    const payload: Record<string, unknown> = {
      goal_satisfaction_evaluation: {
        satisfaction: "unsatisfied",
        missing_requirement_ids: ["evidence"],
      },
      agent_loop_budget: budget(),
      current_turn_artifact_ledger: [],
    };
    const first = buildHelixAgentContinuationState({
      payload,
      turnId: "ask:continuation",
      trigger: "post_attempt",
      lastAttempt: {
        attempt_id: "attempt:1",
        capability_id: "docs.read_current",
        action_fingerprint: "same-action",
        status: "failed",
        failure_code: "temporary_backend_unavailable",
        retryability: "retryable",
      },
    });
    const second = buildHelixAgentContinuationState({
      payload,
      turnId: "ask:continuation",
      trigger: "post_attempt",
      previousState: first,
      lastAttempt: {
        attempt_id: "attempt:2",
        capability_id: "docs.read_current",
        action_fingerprint: "same-action",
        status: "failed",
        failure_code: "temporary_backend_unavailable",
        retryability: "retryable",
      },
    });
    const third = buildHelixAgentContinuationState({
      payload,
      turnId: "ask:continuation",
      trigger: "post_attempt",
      previousState: second,
      lastAttempt: {
        attempt_id: "attempt:3",
        capability_id: "docs.read_current",
        action_fingerprint: "same-action",
        status: "failed",
        failure_code: "temporary_backend_unavailable",
        retryability: "retryable",
      },
    });

    expect(third.progress.no_progress_repeat_count).toBe(2);
    expect(resolveHelixContinuationBudgetExtension({
      state: third,
      current: { iterations: 3, tool_calls: 2, model_decisions: 3 },
      hard: { iterations: 8, tool_calls: 6, model_decisions: 8 },
    })).toMatchObject({
      extend: false,
      reason: "repeated_no_progress_boundary_reached",
    });
  });

  it("tracks compound observations and remaining subgoals without privileging a tool order", () => {
    const firstPayload: Record<string, unknown> = {
      goal_satisfaction_evaluation: {
        satisfaction: "unsatisfied",
        missing_requirement_ids: ["docs_observation", "calculator_observation", "synthesis"],
      },
      agent_loop_budget: budget({ consumed_iterations: 1, consumed_llm_decisions: 1 }),
      current_turn_artifact_ledger: [
        artifact({ id: "ask:continuation:docs:1", kind: "doc_evidence_observation" }),
      ],
    };
    const first = buildHelixAgentContinuationState({
      payload: firstPayload,
      turnId: "ask:continuation",
      trigger: "post_attempt",
    });
    const secondPayload: Record<string, unknown> = {
      goal_satisfaction_evaluation: {
        satisfaction: "unsatisfied",
        missing_requirement_ids: ["synthesis"],
      },
      agent_loop_budget: budget({ consumed_iterations: 2, consumed_tool_calls: 2, consumed_llm_decisions: 2 }),
      current_turn_artifact_ledger: [
        artifact({ id: "ask:continuation:docs:1", kind: "doc_evidence_observation" }),
        artifact({ id: "ask:continuation:calculator:1", kind: "calculator_receipt" }),
      ],
      runtime_continuation_hints: [
        {
          hint_id: "ask:continuation:hint:synthesis",
          suggested_capability: "model.synthesize_current_evidence",
          suggested_args: {},
          reason: "All required tool observations are present; synthesize them.",
        },
      ],
    };
    const second = buildHelixAgentContinuationState({
      payload: secondPayload,
      turnId: "ask:continuation",
      trigger: "post_attempt",
      previousState: first,
    });

    expect(second.observation_refs.existing).toEqual(["ask:continuation:docs:1"]);
    expect(second.observation_refs.new).toEqual(["ask:continuation:calculator:1"]);
    expect(second.progress.resolved_requirement_ids).toEqual(["docs_observation", "calculator_observation"]);
    expect(second.missing_requirement_ids).toEqual(["synthesis"]);
    expect(second.next_admissible_affordances).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ capability_id: "model.synthesize_current_evidence", tried: false }),
      ]),
    );
    expect(second.allowed_decisions).toEqual(expect.arrayContaining(["act", "answer"]));
  });

  it("exposes permission failures for user input or grounded failure instead of blind retry", () => {
    const payload: Record<string, unknown> = {
      goal_satisfaction_evaluation: {
        satisfaction: "blocked",
        missing_requirement_ids: ["user_authorization"],
      },
      agent_loop_budget: budget(),
      current_turn_artifact_ledger: [],
    };
    const state = buildHelixAgentContinuationState({
      payload,
      turnId: "ask:continuation",
      trigger: "post_attempt",
      lastAttempt: {
        capability_id: "workstation-notes.create_note",
        status: "blocked",
        failure_code: "permission_required",
      },
    });

    expect(state.last_attempt).toMatchObject({
      failure_class: "permission",
      retryability: "requires_user_input",
    });
    expect(state.allowed_decisions).toEqual(expect.arrayContaining(["ask_user", "answer", "fail"]));
    expect(state.allowed_decisions).not.toContain("retry");
  });

  it("turns a recoverable terminal rejection into another non-terminal observation", () => {
    const payload: Record<string, unknown> = {
      debug: {},
      goal_satisfaction_evaluation: {
        satisfaction: "unsatisfied",
        missing_requirement_ids: ["agent_authored_terminal_answer"],
      },
      agent_loop_budget: budget(),
      current_turn_artifact_ledger: [],
    };
    const observation = buildHelixTerminalRejectionObservation({
      turnId: "ask:continuation",
      candidateKind: "tool_observation",
      candidateRef: "ask:continuation:tool_observation:1",
      reason: "missing_post_tool_model_step",
    });
    appendHelixTerminalRejectionObservationToPayload({ payload, observation });
    const state = buildHelixAgentContinuationState({
      payload,
      turnId: "ask:continuation",
      trigger: "terminal_rejection",
      lastAttempt: observation,
    });

    expect(observation).toMatchObject({
      recoverable: true,
      retryability: "retryable",
      terminal_eligible: false,
      assistant_answer: false,
    });
    expect(state.observation_refs.new).toContain(observation.observation_id);
    expect(state.last_attempt).toMatchObject({
      failure_class: "terminal_authority",
      failure_code: "missing_post_tool_model_step",
      retryability: "retryable",
    });
    expect(state.allowed_decisions).toEqual(expect.arrayContaining(["retry", "answer"]));
  });

  it("treats the hard boundary as a resource stop while retaining answer authority", () => {
    const payload: Record<string, unknown> = {
      goal_satisfaction_evaluation: {
        satisfaction: "unsatisfied",
        missing_requirement_ids: ["more_evidence"],
      },
      agent_loop_budget: budget({
        hard_max_iterations: 3,
        hard_max_tool_calls: 1,
        hard_max_llm_decisions: 3,
        consumed_iterations: 3,
        consumed_tool_calls: 1,
        consumed_llm_decisions: 3,
      }),
      current_turn_artifact_ledger: [],
    };
    const state = buildHelixAgentContinuationState({
      payload,
      turnId: "ask:continuation",
      trigger: "final_review",
    });

    expect(state.budget.hard.exhausted).toBe(true);
    expect(state.allowed_decisions).toEqual(expect.arrayContaining(["answer", "fail"]));
    expect(resolveHelixContinuationBudgetExtension({
      state,
      current: { iterations: 3, tool_calls: 1, model_decisions: 3 },
      hard: { iterations: 3, tool_calls: 1, model_decisions: 3 },
    })).toMatchObject({
      extend: false,
      reason: "hard_resource_boundary_exhausted",
    });
  });

  it("mirrors an authorized provider route product as terminal-product allowed", () => {
    const state = buildHelixAgentContinuationState({
      payload: {
        final_status: "final_answer",
        route_evidence_authority: {
          terminal_product_allowed: false,
        },
        provider_terminal_authority_bridge: {
          schema: "helix.provider_terminal_authority_bridge.v1",
          terminal_authority_granted: true,
          final_visible_answer_authorized: true,
        },
        current_turn_artifact_ledger: [],
      },
      turnId: "ask:continuation",
      trigger: "final_review",
    });

    expect(state.goal).toEqual({
      status: "satisfied",
      satisfied: true,
      terminal_product_allowed: true,
    });
  });

  it("bounds continuation and rejection histories without dropping domain observations", () => {
    const payload: Record<string, unknown> = {
      debug: {},
      goal_satisfaction_evaluation: { satisfaction: "unsatisfied", missing_requirement_ids: ["answer"] },
      agent_loop_budget: budget(),
      current_turn_artifact_ledger: [
        artifact({ id: "ask:continuation:domain:1", kind: "doc_evidence_observation" }),
      ],
    };
    const seed = buildHelixAgentContinuationState({
      payload,
      turnId: "ask:continuation",
      trigger: "initial",
    });

    for (let index = 0; index < 30; index += 1) {
      appendHelixAgentContinuationStateToPayload({
        payload,
        state: {
          ...seed,
          state_id: `ask:continuation:agent_continuation_state:${index + 1}`,
          sequence: index + 1,
        },
      });
    }
    for (let index = 0; index < 15; index += 1) {
      appendHelixTerminalRejectionObservationToPayload({
        payload,
        observation: buildHelixTerminalRejectionObservation({
          turnId: "ask:continuation",
          candidateKind: "provider_terminal_candidate",
          candidateRef: `candidate:${index + 1}`,
          reason: "missing_post_tool_model_step",
        }),
      });
    }

    const states = payload.agent_continuation_states as Array<Record<string, unknown>>;
    const rejections = payload.terminal_rejection_observations as Array<Record<string, unknown>>;
    const ledger = payload.current_turn_artifact_ledger as Array<Record<string, unknown>>;
    expect(states).toHaveLength(24);
    expect(states[0]?.sequence).toBe(7);
    expect(rejections).toHaveLength(12);
    expect(ledger.filter((entry) => entry.kind === "agent_continuation_state")).toHaveLength(24);
    expect(ledger.filter((entry) => entry.kind === "terminal_rejection_observation")).toHaveLength(12);
    expect(ledger).toEqual(expect.arrayContaining([expect.objectContaining({ artifact_id: "ask:continuation:domain:1" })]));
  });
});
