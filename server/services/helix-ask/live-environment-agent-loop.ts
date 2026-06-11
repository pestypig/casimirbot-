import crypto from "node:crypto";
import {
  HELIX_LIVE_AGENT_STEP_DECISION_SCHEMA,
  HELIX_LIVE_ENVIRONMENT_AGENT_LOOP_SCHEMA,
  type HelixLiveAgentStepDecision,
  type HelixLiveEnvironmentAgentLoopResult,
  type HelixLiveEnvironmentRuntimePacket,
  type HelixLiveEnvironmentToolName,
  type HelixLiveEnvironmentToolObservation,
} from "@shared/helix-live-agent-step";
import type { LiveSourceTurnPhaseResolutionV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import type { HelixVoiceSteeringEventV1 } from "@shared/contracts/helix-voice-steering-event.v1";
import type { AskTurnTranscriptRowDraftV1 } from "@shared/contracts/stage-play-live-source-mail.v1";
import { buildLiveEnvironmentRuntimePacket } from "../situation-room/live-environment-runtime-packet-builder";
import {
  buildVoiceSteeringTranscriptRows,
  executeLiveEnvironmentTool,
} from "./live-environment-tool-adapter";
import { mandatoryToolForPhase } from "./live-source-turn-phase-resolver";
import { drainPendingVoiceSteeringEvents } from "./voice-steering-event-store";

export type LiveEnvironmentStepChooser = (input: {
  packet: HelixLiveEnvironmentRuntimePacket;
  history: HelixLiveEnvironmentAgentLoopResult["iterations"];
  stepIndex: number;
}) => Promise<HelixLiveAgentStepDecision> | HelixLiveAgentStepDecision;

export type LiveEnvironmentPhaseResolver = (input: {
  packet: HelixLiveEnvironmentRuntimePacket;
  history: HelixLiveEnvironmentAgentLoopResult["iterations"];
  stepIndex: number;
}) => LiveSourceTurnPhaseResolutionV1 | null | undefined;

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? uniqueStrings(value.filter((entry): entry is string => typeof entry === "string"))
    : [];

const refsWithPrefix = (refs: string[], prefix: string): string[] =>
  refs.filter((ref) => ref.startsWith(prefix));

const routeMetadataWakeRequestId = (routeMetadata?: Record<string, unknown> | null): string | null =>
  readString(routeMetadata?.wakeRequestId) ?? readString(routeMetadata?.wake_request_id);

const routeMetadataMailboxThreadId = (routeMetadata?: Record<string, unknown> | null): string | null =>
  readString(routeMetadata?.mailboxThreadId) ?? readString(routeMetadata?.mailbox_thread_id);

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

const forcedToolForLockedPhase = (
  phase: LiveSourceTurnPhaseResolutionV1 | null | undefined,
): HelixLiveEnvironmentToolName | null => {
  return mandatoryToolForPhase(phase) as HelixLiveEnvironmentToolName | null;
};

const hasCurrentTurnObservation = (
  history: HelixLiveEnvironmentAgentLoopResult["iterations"],
  toolName: HelixLiveEnvironmentToolName,
): boolean =>
  history.some((iteration) =>
    iteration.tool_observation?.tool_name === toolName &&
    iteration.tool_observation.ok === true
  );

const readPriorVoiceToolArgs = (
  history: HelixLiveEnvironmentAgentLoopResult["iterations"],
): Record<string, unknown> | null => {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const observation = readRecord(history[index]?.tool_observation?.observation);
    const requestedTool = readRecord(observation?.requestedTool) ?? readRecord(observation?.requested_tool);
    const requestedToolName = readString(requestedTool?.toolName) ?? readString(requestedTool?.tool_name);
    if (requestedToolName !== "live_env.request_interim_voice_callout") continue;
    const args = readRecord(requestedTool?.args);
    if (args) return args;
  }
  return null;
};

const synthesizeMandatoryToolArgs = (input: {
  phase: LiveSourceTurnPhaseResolutionV1;
  toolName: HelixLiveEnvironmentToolName;
  routeMetadata?: Record<string, unknown> | null;
  history: HelixLiveEnvironmentAgentLoopResult["iterations"];
  turnId: string;
}): Record<string, unknown> => {
  const routeEvidenceRefs = readStringArray(input.routeMetadata?.evidenceRefs ?? input.routeMetadata?.evidence_refs);
  const evidenceRefs = uniqueStrings([...input.phase.evidenceRefs, ...routeEvidenceRefs]);
  const mailIds = refsWithPrefix(evidenceRefs, "stage_play_live_source_mail:");
  const processedPacketIds = refsWithPrefix(evidenceRefs, "stage_play_processed_mail_packet:");
  const wakeRequestId = routeMetadataWakeRequestId(input.routeMetadata);
  const mailboxThreadId = routeMetadataMailboxThreadId(input.routeMetadata);
  const baseArgs: Record<string, unknown> = {
    evidence_refs: evidenceRefs,
    route_metadata: input.routeMetadata ?? null,
    routeMetadata: input.routeMetadata ?? null,
    ask_turn_id: input.turnId,
    askTurnId: input.turnId,
  };
  if (wakeRequestId) {
    baseArgs.wake_request_id = wakeRequestId;
    baseArgs.wakeRequestId = wakeRequestId;
  }
  if (mailboxThreadId) {
    baseArgs.mailbox_thread_id = mailboxThreadId;
    baseArgs.mailboxThreadId = mailboxThreadId;
  }
  if (mailIds.length > 0) {
    baseArgs.mail_ids = mailIds;
    baseArgs.mailIds = mailIds;
  }
  if (processedPacketIds.length > 0) {
    baseArgs.processed_packet_ids = processedPacketIds;
    baseArgs.processedPacketIds = processedPacketIds;
  }
  if (input.toolName === "live_env.record_live_source_mail_decision") {
    baseArgs.live_source_mail_output_intent = {
      wantsInterpretation: true,
      wantsVoiceCallout:
        input.phase.canonicalGoal === "processed_mail_voice_decision" ||
        input.phase.nextPhase === "request_voice_after_decision",
      wantsTextAnswer: input.phase.canonicalGoal === "processed_mail_interpretation",
    };
    return baseArgs;
  }
  if (input.toolName === "live_env.request_interim_voice_callout") {
    const priorArgs = readPriorVoiceToolArgs(input.history);
    const priorEvidenceRefs = readStringArray(priorArgs?.evidence_refs ?? priorArgs?.evidenceRefs);
    return {
      ...baseArgs,
      ...priorArgs,
      kind: readString(priorArgs?.kind) ?? "tool_result",
      max_chars: typeof priorArgs?.max_chars === "number" ? priorArgs.max_chars : 140,
      evidence_refs: uniqueStrings([...evidenceRefs, ...priorEvidenceRefs]),
      route_metadata: input.routeMetadata ?? priorArgs?.route_metadata ?? priorArgs?.routeMetadata ?? null,
      routeMetadata: input.routeMetadata ?? priorArgs?.routeMetadata ?? priorArgs?.route_metadata ?? null,
      wake_request_id: wakeRequestId ?? readString(priorArgs?.wake_request_id) ?? readString(priorArgs?.wakeRequestId) ?? undefined,
      wakeRequestId: wakeRequestId ?? readString(priorArgs?.wakeRequestId) ?? readString(priorArgs?.wake_request_id) ?? undefined,
      ask_turn_id: input.turnId,
      askTurnId: input.turnId,
    };
  }
  return baseArgs;
};

const forceDecisionForPhase = (input: {
  phase: LiveSourceTurnPhaseResolutionV1;
  toolName: HelixLiveEnvironmentToolName;
  threadId: string;
  environmentId?: string | null;
  stepIndex: number;
  toolArgs?: Record<string, unknown> | null;
}): HelixLiveAgentStepDecision => ({
  schema: HELIX_LIVE_AGENT_STEP_DECISION_SCHEMA,
  decision_id: `live_step:phase_force:${hashShort([
    input.threadId,
    input.environmentId ?? null,
    input.stepIndex,
    input.phase.phase,
    input.toolName,
  ])}`,
  thread_id: input.threadId,
  environment_id: input.environmentId ?? null,
  step_index: input.stepIndex,
  decision_authority: "deterministic_policy_fallback",
  decision_timing: "pre_observation",
  next_step: "call_tool",
  selected_tool: input.toolName,
  tool_args: input.toolArgs ?? {},
  rationale_summary:
    input.phase.phaseLock.reason ??
    input.phase.reason ??
    `Live-source phase ${input.phase.phase} is locked to ${input.toolName}.`,
  expected_evidence_kind: input.phase.completionEvidence.join(", ") || null,
  evidence_refs: uniqueStrings([
    "live_source_turn_phase_resolution",
    ...input.phase.evidenceRefs,
  ]),
  assistant_answer: false,
  raw_content_included: false,
});

const missingMailboxExecutionCode = (input: {
  toolName: HelixLiveEnvironmentToolName;
  phase?: LiveSourceTurnPhaseResolutionV1 | null;
  toolArgs?: Record<string, unknown> | null;
  observation?: HelixLiveEnvironmentToolObservation | null;
  toolUnavailable?: boolean;
}):
  | "missing_required_mailbox_tool_execution"
  | "missing_processed_packet"
  | "missing_wake_request_id"
  | "missing_mail_ids"
  | "missing_voice_callout_draft" => {
  if (input.toolUnavailable) return "missing_required_mailbox_tool_execution";
  const args = input.toolArgs ?? {};
  if (input.toolName === "live_env.record_live_source_mail_decision") {
    const processedPacketIds = readStringArray(args.processed_packet_ids ?? args.processedPacketIds);
    const mailIds = readStringArray(args.mail_ids ?? args.mailIds);
    if (
      input.phase?.requiredEvidence.includes("stage_play_processed_mail_packet") &&
      processedPacketIds.length === 0 &&
      !input.observation?.artifactRefs?.processedPacketIds?.length
    ) {
      return "missing_processed_packet";
    }
    if (mailIds.length === 0 && !input.observation?.artifactRefs?.processedPacketIds?.length) {
      return "missing_mail_ids";
    }
  }
  if (input.toolName === "live_env.request_interim_voice_callout") {
    if (!readString(args.text) && !readString(args.message) && !readString(args.callout_text) && !readString(args.calloutText)) {
      return "missing_voice_callout_draft";
    }
  }
  return "missing_required_mailbox_tool_execution";
};

const makeMandatoryMailboxFailureObservation = (input: {
  threadId: string;
  environmentId?: string | null;
  toolName: HelixLiveEnvironmentToolName;
  stepIndex: number;
  code: string;
  summary?: string | null;
  evidenceRefs?: string[];
}): HelixLiveEnvironmentToolObservation => ({
  schema: "helix.live_environment_tool_observation.v1",
  observation_id: `live_env_tool_observation:${hashShort([input.threadId, input.stepIndex, input.toolName, input.code])}`,
  thread_id: input.threadId,
  environment_id: input.environmentId ?? null,
  tool_name: input.toolName,
  ok: false,
  summary: input.summary ?? `Mandatory live-source mailbox tool execution failed: ${input.code}.`,
  observation: {
    schema: "helix.live_source_mandatory_tool_failure.v1",
    failure_code: input.code,
    post_tool_model_step_required: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
  },
  evidence_refs: uniqueStrings([input.code, ...(input.evidenceRefs ?? [])]),
  instruction_authority: "none",
  ask_instruction_authority: "none",
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
  assistant_answer: false,
  raw_content_included: false,
  created_at: new Date().toISOString(),
});

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
  phaseResolution?: LiveSourceTurnPhaseResolutionV1 | null;
  phaseResolver?: LiveEnvironmentPhaseResolver;
  routeMetadata?: Record<string, unknown> | null;
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
    const modelDecision = await input.chooser({
      packet,
      history: iterations,
      stepIndex,
    });
    const phase = input.phaseResolver
      ? input.phaseResolver({ packet, history: iterations, stepIndex })
      : input.phaseResolution;
    const forcedPhaseTool = forcedToolForLockedPhase(phase);
    const forcedToolAlreadyObserved =
      forcedPhaseTool ? hasCurrentTurnObservation(iterations, forcedPhaseTool) : false;
    const forcedToolArgs = forcedPhaseTool && phase && !forcedToolAlreadyObserved
      ? synthesizeMandatoryToolArgs({
          phase,
          toolName: forcedPhaseTool,
          routeMetadata: input.routeMetadata ?? null,
          history: iterations,
          turnId: currentTurnId,
        })
      : null;
    const decision = forcedPhaseTool && phase && !forcedToolAlreadyObserved
      ? forceDecisionForPhase({
          phase,
          toolName: forcedPhaseTool,
          threadId: input.threadId,
          environmentId: input.environmentId ?? packet.environment_id ?? null,
          stepIndex,
          toolArgs: forcedToolArgs,
        })
      : modelDecision;
    const terminal = terminalDecisionFor(decision);
    if (terminal) {
      if (forcedPhaseTool && phase && phase.forbiddenTools.includes("final_answer")) {
        const failureObservation = makeMandatoryMailboxFailureObservation({
          threadId: input.threadId,
          environmentId: input.environmentId ?? packet.environment_id ?? null,
          toolName: forcedPhaseTool,
          stepIndex,
          code: "missing_required_mailbox_tool_execution",
          summary: `Live-source phase ${phase.phase} still forbids terminal output before ${forcedPhaseTool} completes.`,
          evidenceRefs: phase.evidenceRefs,
        });
        iterations.push({
          step_decision: forceDecisionForPhase({
            phase,
            toolName: forcedPhaseTool,
            threadId: input.threadId,
            environmentId: input.environmentId ?? packet.environment_id ?? null,
            stepIndex,
            toolArgs: forcedToolArgs,
          }),
          tool_observation: failureObservation,
          commentary_refs: [],
        });
        terminalDecision = "fail_closed";
        break;
      }
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
    const forcedMandatoryToolUnavailable = Boolean(forcedPhaseTool && toolName === forcedPhaseTool && !allowedTools.has(toolName));
    const toolObservation = toolName && allowedTools.has(toolName)
      ? executeLiveEnvironmentTool({
          tool_name: toolName,
          args: decision.tool_args ?? {},
          thread_id: input.threadId,
          environment_id: input.environmentId ?? packet.environment_id ?? null,
        })
      : forcedMandatoryToolUnavailable && toolName
      ? makeMandatoryMailboxFailureObservation({
          threadId: input.threadId,
          environmentId: input.environmentId ?? packet.environment_id ?? null,
          toolName,
          stepIndex,
          code: "missing_required_mailbox_tool_execution",
          summary: `Mandatory live-source phase tool ${toolName} was not available in the runtime packet.`,
          evidenceRefs: phase?.evidenceRefs ?? [],
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
    const mandatoryToolFailed =
      forcedPhaseTool &&
      toolName === forcedPhaseTool &&
      toolObservation.ok !== true;
    const normalizedToolObservation = mandatoryToolFailed
      ? {
          ...toolObservation,
          summary: `Mandatory live-source mailbox tool did not complete: ${missingMailboxExecutionCode({
            toolName: forcedPhaseTool,
            phase,
            toolArgs: decision.tool_args,
            observation: toolObservation,
            toolUnavailable: forcedMandatoryToolUnavailable,
          })}. ${toolObservation.summary}`,
          observation: {
            ...(readRecord(toolObservation.observation) ?? {}),
            failure_code: missingMailboxExecutionCode({
              toolName: forcedPhaseTool,
              phase,
              toolArgs: decision.tool_args,
              observation: toolObservation,
              toolUnavailable: forcedMandatoryToolUnavailable,
            }),
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          evidence_refs: uniqueStrings([
            ...toolObservation.evidence_refs,
            missingMailboxExecutionCode({
              toolName: forcedPhaseTool,
              phase,
              toolArgs: decision.tool_args,
              observation: toolObservation,
              toolUnavailable: forcedMandatoryToolUnavailable,
            }),
          ]),
        }
      : toolObservation;
    iterations.push({
      step_decision: decision,
      tool_observation: normalizedToolObservation,
      commentary_refs: commentaryRefsFromObservation(normalizedToolObservation),
    });
    if (mandatoryToolFailed) {
      terminalDecision = "fail_closed";
      break;
    }
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
