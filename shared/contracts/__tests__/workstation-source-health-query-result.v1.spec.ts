import { describe, expect, it } from "vitest";
import type { HelixSituationSourceCapability } from "../../helix-situation-source-capability";
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
    goalSessionFound: true,
    feedAllowed: true,
    requiredActuator: "query_source_health",
    actuatorAllowed: true,
    agentGoalSession: null,
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
      capabilities: [],
      capabilityCount: 0,
    } as Partial<WorkstationSourceHealthQueryResultV1>))).toEqual([]);
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
