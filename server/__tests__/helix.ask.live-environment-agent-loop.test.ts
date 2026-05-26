import { beforeEach, describe, expect, it } from "vitest";
import { HELIX_LIVE_AGENT_STEP_DECISION_SCHEMA } from "@shared/helix-live-agent-step";
import { runLiveEnvironmentAgentLoop } from "../services/helix-ask/live-environment-agent-loop";
import { executeLiveEnvironmentTool } from "../services/helix-ask/live-environment-tool-adapter";
import { buildLiveEnvironmentRuntimePacket } from "../services/situation-room/live-environment-runtime-packet-builder";
import {
  createLiveAnswerEnvironment,
  resetLiveAnswerEnvironments,
} from "../services/situation-room/live-answer-environment-store";
import {
  appendInterpretedEvent,
  clearInterpretedEventLogForTest,
  listInterpretedEvents,
} from "../services/situation-room/interpreted-event-log-store";
import { resetSituationSourceCapabilitiesForTest } from "../services/situation-room/situation-source-capability-store";
import { resetLiveSituationRunsForTest } from "../services/situation-room/live-situation-run-store";
import { resetLiveFieldWorkersForTest } from "../services/situation-room/live-field-worker-registry";

const resetAll = () => {
  resetLiveAnswerEnvironments();
  clearInterpretedEventLogForTest();
  resetSituationSourceCapabilitiesForTest();
  resetLiveSituationRunsForTest();
  resetLiveFieldWorkersForTest();
};

const seedEnvironment = () => createLiveAnswerEnvironment({
  thread_id: "thread:live-env-loop",
  created_turn_id: "turn:seed",
  objective: "Use live environment evidence to answer route and source questions.",
  preset: "minecraft_run_monitor",
  room_id: "room:minecraft",
  source_ids: ["source:minecraft"],
  now: "2026-05-26T12:00:00.000Z",
}).environment;

describe("Helix Ask live environment agent loop", () => {
  beforeEach(resetAll);

  it("builds a model-visible runtime packet with live-env tools as evidence only", () => {
    const environment = seedEnvironment();
    appendInterpretedEvent({
      thread_id: environment.thread_id,
      room_id: environment.room_id,
      source_family: "minecraft_events",
      kind: "tool_trace",
      title: "Route watcher",
      summary: "Route drift candidate exists but policy has not approved surfacing.",
      evidence_refs: ["route_drift:event:1"],
      deterministic: true,
      model_invoked: false,
      created_at: "2026-05-26T12:00:02.000Z",
    });

    const packet = buildLiveEnvironmentRuntimePacket({
      threadId: environment.thread_id,
      environmentId: environment.environment_id,
      now: "2026-05-26T12:00:03.000Z",
    });

    expect(packet.assistant_answer).toBe(false);
    expect(packet.raw_content_included).toBe(false);
    expect(packet.context_role).toBe("tool_evidence");
    expect(packet.available_tools.map((tool) => tool.tool_id)).toEqual(expect.arrayContaining([
      "live_env.query_event_log",
      "live_env.query_navigation_state",
      "live_env.request_probe",
    ]));
    expect(packet.policy.may_surface_user_text).toBe(false);
    expect(packet.recent_commentary_refs.length).toBeGreaterThan(0);
  });

  it("runs model-chosen live-env tool steps before terminal answer permission", async () => {
    const environment = seedEnvironment();
    appendInterpretedEvent({
      thread_id: environment.thread_id,
      room_id: environment.room_id,
      source_family: "minecraft_events",
      kind: "tool_trace",
      title: "Navigation state check",
      summary: "Navigation state says route_status=wrong_direction_candidate.",
      evidence_refs: ["navigation_state:1"],
      deterministic: true,
      model_invoked: false,
      created_at: "2026-05-26T12:00:02.000Z",
    });

    const loop = await runLiveEnvironmentAgentLoop({
      threadId: environment.thread_id,
      environmentId: environment.environment_id,
      maxIterations: 3,
      now: "2026-05-26T12:00:05.000Z",
      chooser: ({ stepIndex }) => stepIndex === 0
        ? {
            schema: HELIX_LIVE_AGENT_STEP_DECISION_SCHEMA,
            decision_id: "live_step:query_event_log",
            thread_id: environment.thread_id,
            environment_id: environment.environment_id,
            step_index: stepIndex,
            decision_authority: "model",
            decision_timing: "pre_observation",
            next_step: "call_tool",
            selected_tool: "live_env.query_event_log",
            tool_args: { limit: 10 },
            rationale_summary: "Read the event/commentary feed before answering.",
            expected_evidence_kind: "interpreted_event_log",
            evidence_refs: [],
            assistant_answer: false,
            raw_content_included: false,
          }
        : {
            schema: HELIX_LIVE_AGENT_STEP_DECISION_SCHEMA,
            decision_id: "live_step:answer",
            thread_id: environment.thread_id,
            environment_id: environment.environment_id,
            step_index: stepIndex,
            decision_authority: "model",
            decision_timing: "post_observation",
            next_step: "answer",
            selected_tool: null,
            tool_args: null,
            rationale_summary: "The compact event log has enough evidence for terminal Ask review.",
            expected_evidence_kind: null,
            evidence_refs: ["navigation_state:1"],
            assistant_answer: false,
            raw_content_included: false,
          },
    });

    expect(loop.schema).toBe("helix.live_environment_agent_loop.v1");
    expect(loop.terminal_decision).toBe("answer_allowed");
    expect(loop.assistant_answer).toBe(false);
    expect(loop.raw_content_included).toBe(false);
    expect(loop.iterations).toHaveLength(2);
    expect(loop.iterations[0]?.step_decision.decision_authority).toBe("model");
    expect(loop.iterations[0]?.tool_observation).toMatchObject({
      tool_name: "live_env.query_event_log",
      assistant_answer: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    });
    expect(loop.evidence_refs).toEqual(expect.arrayContaining(["navigation_state:1"]));
  });

  it("records live commentary as interpreted evidence, not an assistant answer", () => {
    const environment = seedEnvironment();

    const observation = executeLiveEnvironmentTool({
      tool_name: "live_env.record_commentary",
      thread_id: environment.thread_id,
      environment_id: environment.environment_id,
      args: {
        kind: "agentic_review",
        title: "Route evidence review",
        summary: "Route watcher needs another world-event sample before surfacing.",
        evidence_refs: ["route_rehearsal:1"],
        confidence: 0.61,
      },
    });

    const events = listInterpretedEvents({
      threadId: environment.thread_id,
      roomId: environment.room_id,
      limit: 10,
    });

    expect(observation.assistant_answer).toBe(false);
    expect(observation.raw_content_included).toBe(false);
    expect(observation.context_role).toBe("tool_evidence");
    expect(observation.evidence_refs.some((ref) => ref.startsWith("interpreted:"))).toBe(true);
    expect(events.at(-1)).toMatchObject({
      kind: "agentic_review",
      assistant_answer: false,
      raw_logs_included: false,
    });
  });
});
