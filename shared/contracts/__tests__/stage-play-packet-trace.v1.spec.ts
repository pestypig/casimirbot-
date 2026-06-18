import { describe, expect, it } from "vitest";
import {
  STAGE_PLAY_PACKET_TRACE_QUERY_RESULT_SCHEMA,
  STAGE_PLAY_PACKET_TRACE_SCHEMA,
  validateStagePlayPacketTraceQueryResultV1,
  validateStagePlayPacketTraceV1,
} from "../stage-play-packet-trace.v1";

const packetTraceFixture = () => ({
  schema: STAGE_PLAY_PACKET_TRACE_SCHEMA,
  packetId: "stage_play_processed_mail_packet:frog",
  sourceId: "visual_source:image-lens",
  jobId: "stage_play_live_source_job:frog",
  mailIds: ["stage_play_live_source_mail:frog"],
  microReasonerRunRefs: ["stage_play_micro_reasoner_run:frog"],
  recommendedNext: "record_interpretation",
  resolutionState: "processed_packet_ready",
  salienceLevel: "medium",
  causalTrace: {
    schemaVersion: "live_source_causal_trace/v1",
    traceId: "live_source_trace:frog",
    producedRefs: ["stage_play_processed_mail_packet:frog"],
  },
  decisionRefs: [],
  wakeRequestRefs: [],
  wakeResultRefs: [],
  goalContextUpdateRefs: ["stage_play_goal_context_update:frog"],
  evidenceRefs: ["stage_play_processed_mail_packet:frog", "stage_play_micro_reasoner_run:frog"],
  terminalAuthority: {
    status: "not_terminal",
    finalAnswerEligible: false,
    completedSolverPathRequired: true,
    terminalAuthoritySingleWriterRequired: true,
  },
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const queryResultFixture = () => ({
  schema: STAGE_PLAY_PACKET_TRACE_QUERY_RESULT_SCHEMA,
  resultId: "stage_play_packet_trace_query:frog",
  mailboxThreadId: "helix-ask:desktop",
  sourceRef: "visual_source:image-lens",
  goalId: "goal:frog",
  packetId: "stage_play_processed_mail_packet:frog",
  status: "read",
  missingRequirements: [],
  policyEvidenceRefs: ["context_feed:packet_traces", "allowed_actuator:query_packet_traces"],
  goalSessionFound: true,
  feedAllowed: true,
  requiredFeed: "packet_traces",
  requiredActuator: "query_packet_traces",
  actuatorAllowed: true,
  agentGoalSession: null,
  packetTraces: [packetTraceFixture()],
  goalContextUpdates: [],
  authoritySummary: {
    answerAuthority: "completed_solver_path_required",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  },
  traceCount: 1,
  syncedWindow: {
    mailItemCount: 1,
    processedPacketCount: 1,
    microReasonerRunCount: 1,
  },
  goalContextUpdateId: "stage_play_goal_context_update:route:frog",
  post_tool_model_step_required: true,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
});

describe("stage play packet trace contracts", () => {
  it("accepts packet traces as per-packet debugging evidence, not answer authority", () => {
    expect(validateStagePlayPacketTraceV1(packetTraceFixture())).toEqual([]);
    expect(validateStagePlayPacketTraceQueryResultV1(queryResultFixture())).toEqual([]);
  });

  it("rejects packet traces that try to bypass terminal authority", () => {
    const invalidTrace = {
      ...packetTraceFixture(),
      terminalAuthority: {
        status: "terminal",
        finalAnswerEligible: true,
        completedSolverPathRequired: false,
        terminalAuthoritySingleWriterRequired: false,
      },
      assistant_answer: true,
      terminal_eligible: true,
      raw_content_included: true,
    };

    expect(validateStagePlayPacketTraceV1(invalidTrace)).toEqual(expect.arrayContaining([
      "terminalAuthority.status must be not_terminal",
      "terminalAuthority.finalAnswerEligible must be false",
      "terminalAuthority.completedSolverPathRequired must be true",
      "terminalAuthority.terminalAuthoritySingleWriterRequired must be true",
      "assistant_answer must be false",
      "terminal_eligible must be false",
      "raw_content_included must be false",
    ]));
  });

  it("rejects query results with inconsistent trace counts or terminal payloads", () => {
    const invalidResult = {
      ...queryResultFixture(),
      traceCount: 2,
      assistant_answer: true,
      packetTraces: [
        {
          ...packetTraceFixture(),
          terminalAuthority: {
            ...packetTraceFixture().terminalAuthority,
            finalAnswerEligible: true,
          },
        },
      ],
    };

    expect(validateStagePlayPacketTraceQueryResultV1(invalidResult)).toEqual(expect.arrayContaining([
      "packetTraces[0].terminalAuthority.finalAnswerEligible must be false",
      "traceCount must match packetTraces length",
      "assistant_answer must be false",
    ]));
  });
});
