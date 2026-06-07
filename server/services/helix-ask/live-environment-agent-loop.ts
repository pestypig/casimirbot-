import crypto from "node:crypto";
import {
  HELIX_LIVE_ENVIRONMENT_AGENT_LOOP_SCHEMA,
  type HelixLiveAgentStepDecision,
  type HelixLiveEnvironmentAgentLoopResult,
  type HelixLiveEnvironmentRuntimePacket,
  type HelixLiveEnvironmentToolName,
  type HelixLiveEnvironmentToolObservation,
} from "@shared/helix-live-agent-step";
import type { HelixVoiceSteeringEventV1 } from "@shared/contracts/helix-voice-steering-event.v1";
import type { AskTurnTranscriptRowDraftV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import { buildLiveEnvironmentRuntimePacket } from "../situation-room/live-environment-runtime-packet-builder";
import {
  buildVoiceSteeringTranscriptRows,
  executeLiveEnvironmentTool,
} from "./live-environment-tool-adapter";
import { drainPendingVoiceSteeringEvents } from "./voice-steering-event-store";

export type LiveEnvironmentStepChooser = (input: {
  packet: HelixLiveEnvironmentRuntimePacket;
  history: HelixLiveEnvironmentAgentLoopResult["iterations"];
  stepIndex: number;
}) => Promise<HelixLiveAgentStepDecision> | HelixLiveAgentStepDecision;

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const toolForDecision = (decision: HelixLiveAgentStepDecision): HelixLiveEnvironmentToolName | null => {
  if (decision.next_step === "spawn_field_worker") return "live_env.spawn_field_worker";
  if (decision.next_step === "record_commentary") return "live_env.record_commentary";
  if (decision.next_step === "call_tool") return decision.selected_tool ?? null;
  return null;
};

const terminalDecisionFor = (decision: HelixLiveAgentStepDecision): HelixLiveEnvironmentAgentLoopResult["terminal_decision"] | null => {
  if (decision.next_step === "answer") return "answer_allowed";
  if (decision.next_step === "ask_user") return "ask_user";
  if (decision.next_step === "fail_closed") return "fail_closed";
  return null;
};

const commentaryRefsFromObservation = (observation: HelixLiveEnvironmentToolObservation | null): string[] => {
  if (!observation) return [];
  const event = observation.observation && typeof observation.observation === "object"
    ? observation.observation as Record<string, unknown>
    : null;
  const eventId = typeof event?.event_id === "string" ? event.event_id : null;
  return uniqueStrings([eventId, ...observation.evidence_refs.filter((ref) => ref.startsWith("interpreted:"))]);
};

const summarizeVoiceSteeringForModel = (
  events: HelixVoiceSteeringEventV1[],
): NonNullable<HelixLiveEnvironmentRuntimePacket["voice_steering_summary"]> | null => {
  if (events.length === 0) return null;
  return {
    count: events.length,
    items: events.map((event) => ({
      steeringEventId: event.steeringEventId,
      classification: event.classification,
      modelVisibleSummary: `User voice steering received: ${event.transcriptText}`,
      confidence: event.confidence,
      evidenceRefs: uniqueStrings([event.steeringEventId, ...event.evidenceRefs]),
      reasonCodes: event.reasonCodes,
    })),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
  };
};

export async function runLiveEnvironmentAgentLoop(input: {
  threadId: string;
  turnId?: string | null;
  environmentId?: string | null;
  roomId?: string | null;
  chooser: LiveEnvironmentStepChooser;
  maxIterations?: number;
  now?: string;
}): Promise<HelixLiveEnvironmentAgentLoopResult> {
  const now = input.now ?? new Date().toISOString();
  const iterations: HelixLiveEnvironmentAgentLoopResult["iterations"] = [];
  const transcriptRows: AskTurnTranscriptRowDraftV1[] = [];
  const maxIterations = Math.max(1, Math.min(8, Math.trunc(input.maxIterations ?? 4)));
  let terminalDecision: HelixLiveEnvironmentAgentLoopResult["terminal_decision"] = "needs_more_observation";
  const currentTurnId = String(input.turnId ?? input.environmentId ?? input.threadId).trim();

  for (let stepIndex = 0; stepIndex < maxIterations; stepIndex += 1) {
    const drainedSteering = currentTurnId
      ? drainPendingVoiceSteeringEvents({
          threadId: input.threadId,
          turnId: currentTurnId,
          boundary: "before_next_model_step",
          limit: 3,
        })
      : { events: [], decisions: [] };
    const pendingSteering = drainedSteering.events;
    for (let index = 0; index < drainedSteering.events.length; index += 1) {
      transcriptRows.push(...buildVoiceSteeringTranscriptRows({
        steeringEvent: drainedSteering.events[index]!,
        decision: drainedSteering.decisions[index] ?? null,
        createdAt: now,
      }));
    }
    const basePacket = buildLiveEnvironmentRuntimePacket({
      threadId: input.threadId,
      environmentId: input.environmentId,
      roomId: input.roomId,
      now,
    });
    const packet: HelixLiveEnvironmentRuntimePacket = {
      ...basePacket,
      pending_voice_steering_refs: pendingSteering.map((event) => event.steeringEventId),
      voice_steering_summary: summarizeVoiceSteeringForModel(pendingSteering),
    };
    const decision = await input.chooser({
      packet,
      history: iterations,
      stepIndex,
    });
    const terminal = terminalDecisionFor(decision);
    if (terminal) {
      terminalDecision = terminal;
      iterations.push({
        step_decision: decision,
        tool_observation: null,
        commentary_refs: [],
      });
      break;
    }

    const toolName = toolForDecision(decision);
    const allowedTools = new Set(packet.available_tools.map((tool) => tool.tool_id));
    const toolObservation = toolName && allowedTools.has(toolName)
      ? executeLiveEnvironmentTool({
          tool_name: toolName,
          args: decision.tool_args ?? {},
          thread_id: input.threadId,
          environment_id: input.environmentId ?? packet.environment_id ?? null,
        })
      : {
          schema: "helix.live_environment_tool_observation.v1" as const,
          observation_id: `live_env_tool_observation:${hashShort([input.threadId, stepIndex, "blocked_tool"])}`,
          thread_id: input.threadId,
          environment_id: input.environmentId ?? packet.environment_id ?? null,
          tool_name: (toolName ?? "live_env.query_event_log") as HelixLiveEnvironmentToolName,
          ok: false,
          summary: "Model-selected live environment tool was missing or not allowed by the runtime packet.",
          observation: null,
          evidence_refs: [],
          instruction_authority: "none" as const,
          ask_instruction_authority: "none" as const,
          context_role: "tool_evidence" as const,
          ask_context_policy: "evidence_only" as const,
          assistant_answer: false as const,
          raw_content_included: false as const,
          created_at: new Date().toISOString(),
        };
    iterations.push({
      step_decision: decision,
      tool_observation: toolObservation,
      commentary_refs: commentaryRefsFromObservation(toolObservation),
    });
  }

  if (iterations.length >= maxIterations && terminalDecision === "needs_more_observation") {
    terminalDecision = "budget_exhausted";
  }

  return {
    schema: HELIX_LIVE_ENVIRONMENT_AGENT_LOOP_SCHEMA,
    loop_id: `live_env_agent_loop:${hashShort([
      input.threadId,
      input.environmentId ?? null,
      iterations.map((iteration) => iteration.step_decision.decision_id),
    ])}`,
    thread_id: input.threadId,
    environment_id: input.environmentId ?? null,
    iterations,
    terminal_decision: terminalDecision,
    evidence_refs: uniqueStrings(iterations.flatMap((iteration) => [
      ...iteration.step_decision.evidence_refs,
      ...(iteration.tool_observation?.evidence_refs ?? []),
      ...iteration.commentary_refs,
    ])),
    transcriptRows,
    assistant_answer: false,
    raw_content_included: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
    created_at: now,
  };
}
