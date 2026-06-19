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
    policyEvidenceRefs: [
      "context_feed:trace_memory",
      "allowed_actuator:query_trace_memory",
      "agent_goal_context_feed:feed:trace-memory",
      "agent_goal_allowed_actuator:query_trace_memory",
    ],
    sourceRefs: ["helix-ask:desktop", "multimodal", trace.trace_id],
    loopRefs: [
      "helix_workstation_reasoning_trace_query:frog",
      "workstation_context_feed:trace_memory",
      "workstation_actuator:query_trace_memory",
      trace.turn_id,
      "tool_lifecycle:frog-classifier",
    ],
    evidenceRefs: [
      "helix_workstation_reasoning_trace_query:frog",
      "context_feed:trace_memory",
      "allowed_actuator:query_trace_memory",
      "feed:trace-memory",
      "agent_goal_context_feed:feed:trace-memory",
      "agent_goal_allowed_actuator:query_trace_memory",
      "helix-ask:desktop",
      "multimodal",
      trace.trace_id,
      "workstation_context_feed:trace_memory",
      "workstation_actuator:query_trace_memory",
      trace.turn_id,
      "visual_evidence:frog",
      "microdeck_run:frog-classifier",
      "tool_receipt:frog-classifier",
      "tool_lifecycle:frog-classifier",
    ],
    freshnessStatus: "fresh",
    goalSessionFound: true,
    feedAllowed: true,
    requiredActuator: "query_trace_memory",
    actuatorAllowed: true,
    matchedContextFeeds: agentGoalSession.contextFeeds,
    matchedContextFeedRefs: ["feed:trace-memory"],
    matchedAllowedActuators: ["query_trace_memory"],
    matchedAllowedActuatorRefs: ["agent_goal_allowed_actuator:query_trace_memory"],
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
      policyEvidenceRefs: [
        "context_feed:trace_memory",
        "allowed_actuator:query_trace_memory",
        "agent_goal_context_feed:feed:trace-memory",
      ],
      matchedAllowedActuators: [],
      matchedAllowedActuatorRefs: [],
      traces: [],
      selectedTrace: null,
      trace_count: 0,
      freshnessStatus: "blocked",
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
      matchedContextFeeds: [],
      matchedContextFeedRefs: [],
    } as Partial<WorkstationTraceMemoryQueryResultV1>))).toEqual(expect.arrayContaining([
      "policyEvidenceRefs must include context feed policy ref",
      "read trace memory query results must have feedAllowed=true",
    ]));
  });

  it("rejects trace-memory reads without source, loop, evidence, or freshness proof refs", () => {
    expect(validateWorkstationTraceMemoryQueryResultV1(resultFixture({
      loopRefs: ["trace_loop:outside-policy"],
      evidenceRefs: [
        "helix_workstation_reasoning_trace_query:frog",
        "context_feed:trace_memory",
        "allowed_actuator:query_trace_memory",
      ],
    } as Partial<WorkstationTraceMemoryQueryResultV1>))).toEqual(expect.arrayContaining([
      "loopRefs must include trace-memory context feed loop ref",
      "loopRefs must include trace-memory actuator loop ref",
      "evidenceRefs must include every sourceRefs entry",
      "evidenceRefs must include every loopRefs entry",
    ]));

    expect(validateWorkstationTraceMemoryQueryResultV1(resultFixture({
      evidenceRefs: [
        "context_feed:trace_memory",
        "allowed_actuator:query_trace_memory",
        "helix-ask:desktop",
        "multimodal",
        "workstation_trace:frog-classifier",
        "workstation_context_feed:trace_memory",
        "workstation_actuator:query_trace_memory",
      ],
    } as Partial<WorkstationTraceMemoryQueryResultV1>))).toEqual(expect.arrayContaining([
      "evidenceRefs must include resultId",
    ]));

    expect(validateWorkstationTraceMemoryQueryResultV1(resultFixture({
      freshnessStatus: "blocked",
    } as Partial<WorkstationTraceMemoryQueryResultV1>))).toEqual(expect.arrayContaining([
      "read trace memory query results must not have blocked freshnessStatus",
    ]));
  });

  it("requires blocked trace-memory reads to report blocked freshness", () => {
    expect(validateWorkstationTraceMemoryQueryResultV1(resultFixture({
      status: "blocked",
      missingRequirements: ["context_feed:trace_memory"],
      feedAllowed: false,
      matchedContextFeeds: [],
      matchedContextFeedRefs: [],
      policyEvidenceRefs: ["context_feed:trace_memory", "allowed_actuator:query_trace_memory"],
      freshnessStatus: "fresh",
    } as Partial<WorkstationTraceMemoryQueryResultV1>))).toEqual(expect.arrayContaining([
      "blocked trace memory query results must have blocked freshnessStatus",
    ]));
  });

  it("requires exact matched actuator refs for goal-authorized trace-memory reads", () => {
    expect(validateWorkstationTraceMemoryQueryResultV1(resultFixture({
      matchedAllowedActuators: [],
      matchedAllowedActuatorRefs: [],
    } as Partial<WorkstationTraceMemoryQueryResultV1>))).toEqual(expect.arrayContaining([
      "actuatorAllowed=true for a goal session requires matchedAllowedActuators",
    ]));

    expect(validateWorkstationTraceMemoryQueryResultV1(resultFixture({
      matchedAllowedActuatorRefs: [],
    } as Partial<WorkstationTraceMemoryQueryResultV1>))).toEqual(expect.arrayContaining([
      "matchedAllowedActuatorRefs must include every matchedAllowedActuators policy ref",
    ]));

    expect(validateWorkstationTraceMemoryQueryResultV1(resultFixture({
      policyEvidenceRefs: [
        "context_feed:trace_memory",
        "allowed_actuator:query_trace_memory",
        "agent_goal_context_feed:feed:trace-memory",
      ],
    } as Partial<WorkstationTraceMemoryQueryResultV1>))).toEqual(expect.arrayContaining([
      "policyEvidenceRefs must include every matched allowed actuator policy ref",
    ]));

    expect(validateWorkstationTraceMemoryQueryResultV1(resultFixture({
      actuatorAllowed: false,
      matchedAllowedActuators: ["query_trace_memory"],
    } as Partial<WorkstationTraceMemoryQueryResultV1>))).toEqual(expect.arrayContaining([
      "actuatorAllowed=false must not expose matchedAllowedActuators",
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
