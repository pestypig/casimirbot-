import { describe, expect, it } from "vitest";
import type { HelixWorkstationReasoningTrace } from "../../helix-workstation-reasoning-trace";
import {
  WORKSTATION_TRACE_MEMORY_QUERY_RESULT_SCHEMA,
  validateWorkstationTraceMemoryQueryResultV1,
  type WorkstationTraceMemoryQueryResultV1,
} from "../workstation-trace-memory-query-result.v1";
import {
  WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
  WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
  type AgentGoalSessionV1,
} from "../workstation-goal-context.v1";

const traceFixture = (
  overrides: Partial<HelixWorkstationReasoningTrace> = {},
): HelixWorkstationReasoningTrace => ({
  schema: "helix.workstation_reasoning_trace.v1",
  trace_id: "workstation_trace:frog-classifier",
  thread_id: "helix-ask:desktop",
  turn_id: "turn:frog-classifier",
  source_family: "multimodal",
  user_goal: "Classify the frog image from ImageLens.",
  route_reason_code: "visual_to_microdeck",
  input_item_refs: ["visual_evidence:frog"],
  evidence_refs: ["visual_evidence:frog", "microdeck_run:frog-classifier"],
  tool_receipt_ids: ["tool_receipt:frog-classifier"],
  lifecycle_event_refs: ["tool_lifecycle:frog-classifier"],
  artifacts: {
    visual_extraction_id: "visual_extraction:frog",
    workstation_tool_evaluation_id: "workstation-tool-eval:frog",
  },
  requested_extraction_scope: "scene",
  actual_extraction_scope: "scene",
  scope_match: "exact",
  proof_status: "complete",
  compact_steps: [
    {
      label: "Visual extraction",
      summary: "Captured compact frog morphology observations.",
      artifact_ref: "visual_extraction:frog",
      status: "completed",
    },
  ],
  caveats: [],
  final_answer_snapshot: "Prior final text is compact context, not current answer authority.",
  assistant_answer: false,
  raw_content_included: false,
  context_policy: "compact_context_pack_only",
  created_at: "2026-06-17T15:00:00.000Z",
  ...overrides,
});

const resultFixture = (
  overrides: Partial<WorkstationTraceMemoryQueryResultV1> = {},
): WorkstationTraceMemoryQueryResultV1 => {
  const trace = traceFixture();
  const agentGoalSession: AgentGoalSessionV1 = {
    schemaVersion: WORKSTATION_AGENT_GOAL_SESSION_SCHEMA,
    goalId: "goal:frog",
    threadId: "helix-ask:desktop",
    roomId: "room:desktop",
    objective: "Use trace memory while classifying frog imagery from ImageLens.",
    userVisibleSummary: "Reading trace memory.",
    status: "active",
    sourceRefs: ["visual_evidence:frog", "microdeck_run:frog-classifier"],
    loopRefs: ["workstation_context_feed:trace_memory", "workstation_actuator:query_trace_memory"],
    constructRefs: ["image-lens", "stage-play-badge-graph"],
    contextFeeds: [{
      feedId: "feed:trace-memory",
      sourceKind: "trace_memory",
      freshnessMs: 120_000,
      relevancePolicy: "same-thread-or-turn",
    }],
    allowedActuators: ["query_trace_memory"],
    cadence: { kind: "user_turn_only" },
    stopConditions: ["user stops the goal", "trace memory becomes unavailable"],
    checkpoints: [{
      checkpointId: "goal_checkpoint:trace-memory:1",
      createdAtMs: 1_780_000_000_000,
      summary: "Trace memory queried.",
      evidenceRefs: ["workstation_trace:frog-classifier"],
      actionsTaken: ["query_trace_memory"],
      nextStep: "continue",
    }],
    authority: {
      assistantAnswer: false,
      finalReportsRequireTerminalAuthority: true,
      finalReportRequirements: WORKSTATION_AGENT_GOAL_DEFAULT_FINAL_REPORT_REQUIREMENTS,
    },
  };
  return {
    schema: WORKSTATION_TRACE_MEMORY_QUERY_RESULT_SCHEMA,
    resultId: "helix_workstation_reasoning_trace_query:frog",
    thread_id: "helix-ask:desktop",
    trace_id: trace.trace_id,
    turn_id: null,
    traces: [trace],
    selectedTrace: trace,
    trace_count: 1,
    goalId: "goal:frog",
    status: "read",
    missingRequirements: [],
    policyEvidenceRefs: ["context_feed:trace_memory", "allowed_actuator:query_trace_memory"],
    goalSessionFound: true,
    feedAllowed: true,
    requiredActuator: "query_trace_memory",
    actuatorAllowed: true,
    agentGoalSession,
    goalContextUpdateId: "stage_play_goal_context_update:trace_memory:frog",
    terminalAuthority: {
      status: "not_terminal",
      finalAnswerEligible: false,
      completedSolverPathRequired: true,
      terminalAuthoritySingleWriterRequired: true,
    },
    post_tool_model_step_required: true,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
    ...overrides,
  };
};

describe("helix.workstation_reasoning_trace_query_result.v1", () => {
  it("accepts compact trace memory query results as non-terminal tool evidence", () => {
    expect(validateWorkstationTraceMemoryQueryResultV1(resultFixture())).toEqual([]);
  });

  it("accepts blocked trace memory query results when no traces are exposed", () => {
    expect(validateWorkstationTraceMemoryQueryResultV1(resultFixture({
      status: "blocked",
      missingRequirements: ["allowed_actuator:query_trace_memory"],
      actuatorAllowed: false,
      traces: [],
      selectedTrace: null,
      trace_count: 0,
    } as Partial<WorkstationTraceMemoryQueryResultV1>))).toEqual([]);
  });

  it("rejects trace-memory reads without policy refs or valid goal-session evidence", () => {
    expect(validateWorkstationTraceMemoryQueryResultV1(resultFixture({
      policyEvidenceRefs: ["context_feed:trace_memory"],
      actuatorAllowed: false,
      agentGoalSession: { goalId: "goal:wrong", threadId: "helix-ask:desktop" },
    } as Partial<WorkstationTraceMemoryQueryResultV1>))).toEqual(expect.arrayContaining([
      "policyEvidenceRefs must include actuator policy ref",
      "read trace memory query results must have actuatorAllowed=true",
      "agentGoalSession.schemaVersion must match agent goal session schema",
      "agentGoalSession.goalId must match goalId",
    ]));

    expect(validateWorkstationTraceMemoryQueryResultV1(resultFixture({
      policyEvidenceRefs: ["allowed_actuator:query_trace_memory"],
      feedAllowed: false,
    } as Partial<WorkstationTraceMemoryQueryResultV1>))).toEqual(expect.arrayContaining([
      "policyEvidenceRefs must include context feed policy ref",
      "read trace memory query results must have feedAllowed=true",
    ]));
  });

  it("rejects terminalizing query results and traces", () => {
    const terminalTrace = traceFixture({
      assistant_answer: true as false,
      raw_content_included: true as false,
      context_policy: "raw" as "compact_context_pack_only",
    });

    expect(validateWorkstationTraceMemoryQueryResultV1(resultFixture({
      traces: [terminalTrace],
      selectedTrace: terminalTrace,
      assistant_answer: true,
      terminal_eligible: true,
      raw_content_included: true,
      terminalAuthority: {
        status: "terminal" as "not_terminal",
        finalAnswerEligible: true as false,
        completedSolverPathRequired: false as true,
        terminalAuthoritySingleWriterRequired: false as true,
      },
    } as Partial<WorkstationTraceMemoryQueryResultV1>))).toEqual(expect.arrayContaining([
      "traces[0].assistant_answer must be false",
      "traces[0].raw_content_included must be false",
      "traces[0].context_policy must be compact_context_pack_only",
      "selectedTrace.assistant_answer must be false",
      "selectedTrace.raw_content_included must be false",
      "selectedTrace.context_policy must be compact_context_pack_only",
      "terminalAuthority.status must be not_terminal",
      "terminalAuthority.finalAnswerEligible must be false",
      "terminalAuthority.completedSolverPathRequired must be true",
      "terminalAuthority.terminalAuthoritySingleWriterRequired must be true",
      "assistant_answer must be false",
      "terminal_eligible must be false",
      "raw_content_included must be false",
    ]));
  });
});
