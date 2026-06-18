import { describe, expect, it } from "vitest";
import type { WorkstationGoalContextUpdateV1 } from "../workstation-goal-context.v1";
import {
  WORKSTATION_CONTEXT_FEED_QUERY_RESULT_SCHEMA,
  validateWorkstationContextFeedQueryResultV1,
  type WorkstationContextFeedQueryResultV1,
} from "../workstation-context-feed-query-result.v1";

const updateFixture = (
  overrides: Partial<WorkstationGoalContextUpdateV1> = {},
): WorkstationGoalContextUpdateV1 => ({
  schemaVersion: "helix.workstation_goal_context_update.v1",
  updateId: "stage_play_goal_context_update:visual:1",
  createdAtMs: 1_780_000_000_000,
  sourceRefs: ["visual_source:image-lens"],
  loopRefs: ["thread:helix-ask:desktop", "stage_play_mail_loop:helix-ask:desktop"],
  producerKind: "visual_capture",
  updateKind: "visual_observation",
  contentRef: "stage_play_live_source_mail:frog",
  preview: "ImageLens shows a frog image.",
  evidenceRefs: ["stage_play_live_source_mail:frog"],
  receiptRefs: ["stage_play_live_source_mail:frog"],
  freshness: {
    observedAtMs: 1_780_000_000_000,
    staleAfterMs: 30_000,
    status: "fresh",
  },
  goalRelevance: {
    goalId: "goal:frog",
    relevance: 0.8,
    reason: "Frog visual source is relevant.",
  },
  suggestedDispatch: [
    { kind: "log_receipt", receiptRef: "stage_play_live_source_mail:frog" },
    { kind: "append_goal_context", goalId: "goal:frog" },
    { kind: "update_panel", panelId: "stage-play-badge-graph" },
  ],
  authority: {
    assistantAnswer: false,
    terminalEligible: false,
    rawContentIncluded: false,
    postToolModelStepRequired: true,
  },
  ...overrides,
});

const resultFixture = (
  overrides: Partial<WorkstationContextFeedQueryResultV1> = {},
): WorkstationContextFeedQueryResultV1 => {
  const update = updateFixture();
  return {
    schema: WORKSTATION_CONTEXT_FEED_QUERY_RESULT_SCHEMA,
    resultId: "stage_play_context_feed_query:visual_summaries:frog",
    feedKind: "visual_summaries",
    label: "visual summaries",
    mailboxThreadId: "helix-ask:desktop",
    mailboxThreadResolution: { mailboxThreadId: "helix-ask:desktop" },
    sourceRef: "visual_source:image-lens",
    goalId: "goal:frog",
    status: "read",
    missingRequirements: [],
    policyEvidenceRefs: ["context_feed:visual_summaries", "allowed_actuator:query_visual_summaries"],
    goalSessionFound: true,
    feedAllowed: true,
    requiredActuator: "query_visual_summaries",
    actuatorAllowed: true,
    agentGoalSession: null,
    agentGoalSessions: [],
    goalContextUpdates: [update],
    authoritySummary: {
      answerAuthority: "completed_solver_path_required",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      post_tool_model_step_required: true,
    },
    updateCount: 1,
    syncedWindow: {
      mailItemCount: 1,
      processedPacketCount: 0,
      microReasonerRunCount: 0,
    },
    goalContextUpdateId: "stage_play_goal_context_update:route_watch:feed-query",
    post_tool_model_step_required: true,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
    ...overrides,
  };
};

describe("stage_play_workstation_context_feed_query_result/v1", () => {
  it("accepts feed query results as non-terminal tool evidence", () => {
    expect(validateWorkstationContextFeedQueryResultV1(resultFixture())).toEqual([]);
  });

  it("accepts blocked feed query results when no updates are returned", () => {
    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      status: "blocked",
      missingRequirements: ["context_feed:visual_summaries"],
      feedAllowed: false,
      goalContextUpdates: [],
      updateCount: 0,
      syncedWindow: {
        mailItemCount: 0,
        processedPacketCount: 0,
        microReasonerRunCount: 0,
      },
    } as Partial<WorkstationContextFeedQueryResultV1>))).toEqual([]);
  });

  it("rejects feed query results that carry terminalizing updates", () => {
    const invalidUpdate = updateFixture({
      authority: {
        assistantAnswer: true as false,
        terminalEligible: true as false,
        rawContentIncluded: true as false,
        postToolModelStepRequired: false as true,
      },
    });

    expect(validateWorkstationContextFeedQueryResultV1(resultFixture({
      goalContextUpdates: [invalidUpdate],
      assistant_answer: true,
      terminal_eligible: true,
      raw_content_included: true,
      authoritySummary: {
        answerAuthority: "panel_projection",
        assistant_answer: true,
        terminal_eligible: true,
        raw_content_included: true,
        post_tool_model_step_required: false,
      },
    } as Partial<WorkstationContextFeedQueryResultV1>))).toEqual(expect.arrayContaining([
      "goalContextUpdates[0].goal context updates must not be assistant answers",
      "goalContextUpdates[0].goal context updates must not be terminal eligible",
      "goalContextUpdates[0].goal context updates must not include raw content",
      "goalContextUpdates[0].goal context updates require a post-tool model step before answers",
      "authoritySummary.assistant_answer must be false",
      "authoritySummary.terminal_eligible must be false",
      "authoritySummary.raw_content_included must be false",
      "authoritySummary.post_tool_model_step_required must be true",
      "authoritySummary.answerAuthority must require completed solver path",
      "assistant_answer must be false",
      "terminal_eligible must be false",
      "raw_content_included must be false",
    ]));
  });
});
