import { describe, expect, it } from "vitest";
import type { HelixSituationSourceCapability } from "../../helix-situation-source-capability";
import {
  WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
  WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
  type AgentGoalSessionV1,
} from "../workstation-goal-context.v1";
import {
  WORKSTATION_SOURCE_HEALTH_QUERY_RESULT_SCHEMA,
  validateWorkstationSourceHealthQueryResultV1,
  type WorkstationSourceHealthQueryResultV1,
} from "../workstation-source-health-query-result.v1";

const capabilityFixture = (
  overrides: Partial<HelixSituationSourceCapability> = {},
): HelixSituationSourceCapability => ({
  schema: "helix.situation_source_capability.v1",
  source_id: "visual_source:image-lens",
  thread_id: "helix-ask:desktop",
  room_id: "room:desktop",
  participant_id: null,
  modality: "visual_frame",
  status: "active",
  contribution: "visual_scene",
  fidelity_score: 1,
  last_event_ts: "2026-06-17T15:00:00.000Z",
  missing_reason: null,
  next_required_action: null,
  raw_content_included: false,
  assistant_answer: false,
  ...overrides,
});

const resultFixture = (
  overrides: Partial<WorkstationSourceHealthQueryResultV1> = {},
): WorkstationSourceHealthQueryResultV1 => {
  const capability = capabilityFixture();
  const agentGoalSession: AgentGoalSessionV1 = {
    schemaVersion: WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
    goalId: "goal:frog",
    threadId: "helix-ask:desktop",
    roomId: "room:desktop",
    objective: "Monitor ImageLens source health for frog classification.",
    userVisibleSummary: "Monitoring source health.",
    status: "active",
    sourceRefs: ["visual_source:image-lens"],
    loopRefs: ["source_health:visual_source:image-lens", "workstation_context_feed:source_health"],
    constructRefs: ["image-lens", "stage-play-badge-graph"],
    contextFeeds: [{
      feedId: "feed:source-health",
      sourceKind: "source_health",
      freshnessMs: 60_000,
      relevancePolicy: "same-source",
    }],
    allowedActuators: ["query_source_health"],
    cadence: { kind: "user_turn_only" },
    stopConditions: ["user stops the goal", "source disconnects"],
    checkpoints: [{
      checkpointId: "goal_checkpoint:source-health:1",
      createdAtMs: 1_780_000_000_000,
      summary: "Source health queried.",
      evidenceRefs: ["stage_play_source_health:frog"],
      actionsTaken: ["query_source_health"],
      nextStep: "continue",
    }],
    authority: {
      assistantAnswer: false,
      finalReportsRequireTerminalAuthority: true,
      finalReportRequirements: WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
    },
  };
  return {
    schema: WORKSTATION_SOURCE_HEALTH_QUERY_RESULT_SCHEMA,
    resultId: "stage_play_source_health:frog",
    thread_id: "helix-ask:desktop",
    room_id: "room:desktop",
    capabilities: [capability],
    capabilityCount: 1,
    goalId: "goal:frog",
    status: "read",
    missingRequirements: [],
    policyEvidenceRefs: ["context_feed:source_health", "allowed_actuator:query_source_health"],
    sourceRefs: ["visual_source:image-lens"],
    loopRefs: [
      "source_health:visual_source:image-lens",
      "workstation_context_feed:source_health",
      "workstation_actuator:query_source_health",
    ],
    evidenceRefs: [
      "stage_play_source_health:frog",
      "visual_source:image-lens",
      "context_feed:source_health",
      "allowed_actuator:query_source_health",
    ],
    freshnessStatus: "fresh",
    goalSessionFound: true,
    feedAllowed: true,
    requiredActuator: "query_source_health",
    actuatorAllowed: true,
    agentGoalSession,
    goalContextUpdateId: "stage_play_goal_context_update:source_health:frog",
    terminalAuthority: {
      status: "not_terminal",
      finalAnswerEligible: false,
      completedSolverPathRequired: true,
      terminalAuthoritySingleWriterRequired: true,
    },
    post_tool_model_step_required: true,
    terminal_eligible: false,
    raw_content_included: false,
    assistant_answer: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
    context_policy: "compact_context_pack_only",
    ...overrides,
  };
};

describe("helix.situation_source_capability_read.v1", () => {
  it("accepts source-health query results as non-terminal tool evidence", () => {
    expect(validateWorkstationSourceHealthQueryResultV1(resultFixture())).toEqual([]);
  });

  it("accepts blocked source-health query results with no exposed capabilities", () => {
    expect(validateWorkstationSourceHealthQueryResultV1(resultFixture({
      status: "blocked",
      missingRequirements: ["context_feed:source_health"],
      feedAllowed: false,
      sourceRefs: ["helix-ask:desktop"],
      evidenceRefs: [
        "stage_play_source_health:frog",
        "helix-ask:desktop",
        "context_feed:source_health",
        "allowed_actuator:query_source_health",
      ],
      freshnessStatus: "blocked",
      capabilities: [],
      capabilityCount: 0,
    } as Partial<WorkstationSourceHealthQueryResultV1>))).toEqual([]);
  });

  it("rejects source-health reads without policy refs or valid goal-session evidence", () => {
    expect(validateWorkstationSourceHealthQueryResultV1(resultFixture({
      policyEvidenceRefs: ["context_feed:source_health"],
      actuatorAllowed: false,
      agentGoalSession: {
        goalId: "goal:wrong",
        threadId: "helix-ask:desktop",
      },
    }))).toEqual(expect.arrayContaining([
      "policyEvidenceRefs must include actuator policy ref",
      "read source health query results must have actuatorAllowed=true",
      "agentGoalSession.schemaVersion must match agent goal session schema",
      "agentGoalSession.goalId must match goalId",
    ]));

    expect(validateWorkstationSourceHealthQueryResultV1(resultFixture({
      policyEvidenceRefs: ["allowed_actuator:query_source_health"],
      feedAllowed: false,
    }))).toEqual(expect.arrayContaining([
      "policyEvidenceRefs must include context feed policy ref",
      "read source health query results must have feedAllowed=true",
    ]));
  });

  it("rejects source-health reads without compact source, loop, evidence, or freshness proof", () => {
    expect(validateWorkstationSourceHealthQueryResultV1(resultFixture({
      sourceRefs: [],
      loopRefs: ["source_health:visual_source:image-lens"],
      evidenceRefs: ["stage_play_source_health:frog"],
      freshnessStatus: "invalid" as "fresh",
    }))).toEqual(expect.arrayContaining([
      "sourceRefs must include at least one reference",
      "loopRefs must include source-health context feed loop ref",
      "loopRefs must include source-health actuator loop ref",
      "evidenceRefs must include every policyEvidenceRefs entry",
      "freshnessStatus is invalid",
    ]));
  });

  it("rejects terminalizing source-health query results and capabilities", () => {
    const terminalCapability = capabilityFixture({
      raw_content_included: true as false,
      assistant_answer: true as false,
    });

    expect(validateWorkstationSourceHealthQueryResultV1(resultFixture({
      capabilities: [terminalCapability],
      terminal_eligible: true,
      raw_content_included: true,
      assistant_answer: true,
      terminalAuthority: {
        status: "terminal" as "not_terminal",
        finalAnswerEligible: true as false,
        completedSolverPathRequired: false as true,
        terminalAuthoritySingleWriterRequired: false as true,
      },
    } as Partial<WorkstationSourceHealthQueryResultV1>))).toEqual(expect.arrayContaining([
      "capabilities[0].raw_content_included must be false",
      "capabilities[0].assistant_answer must be false",
      "terminalAuthority.status must be not_terminal",
      "terminalAuthority.finalAnswerEligible must be false",
      "terminalAuthority.completedSolverPathRequired must be true",
      "terminalAuthority.terminalAuthoritySingleWriterRequired must be true",
      "terminal_eligible must be false",
      "raw_content_included must be false",
      "assistant_answer must be false",
    ]));
  });
});
