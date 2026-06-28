import crypto from "node:crypto";

import type { HelixAskPublicCommentaryEventV1 } from "@shared/helix-agent-commentary";

type HelixAskTurnPlanLaneForTranscript = "workspace" | "reasoning" | "conversation";
type HelixAskTurnPlanStepStatusForTranscript = "planned" | "started" | "completed" | "failed" | "suppressed";
type HelixAskTurnTranscriptEventSource = "live" | "runtime" | "reconstructed";

type HelixAskTurnEventForTranscript =
  | { type: "turn_started"; at_ms: number; turn_id: string; goal: string }
  | { type: "public_commentary"; at_ms: number; event: HelixAskPublicCommentaryEventV1 }
  | {
      type: "plan_delta";
      at_ms: number;
      step: {
        id: string;
        lane: HelixAskTurnPlanLaneForTranscript;
        status: HelixAskTurnPlanStepStatusForTranscript;
        title: string;
      };
      reason: string;
    }
  | { type: "item_started"; at_ms: number; step_id: string; lane: HelixAskTurnPlanLaneForTranscript; title: string }
  | {
      type: "receipt_pending";
      at_ms: number;
      step_id: string;
      lane: HelixAskTurnPlanLaneForTranscript;
      expected_artifacts: string[];
      title: string;
    }
  | {
      type: "model_decision_started";
      at_ms: number;
      step_id: string | null;
      phase: "planner" | "continuation" | "composer";
      prompt: string;
    }
  | {
      type: "model_decision_completed";
      at_ms: number;
      step_id: string | null;
      phase: "planner" | "continuation" | "composer";
      summary: string;
    }
  | {
      type: "tool_result";
      at_ms: number;
      step_id: string;
      lane: HelixAskTurnPlanLaneForTranscript;
      status: HelixAskTurnPlanStepStatusForTranscript;
      actual_artifacts: string[];
      expected_artifacts: string[];
      contract_pass: boolean | null;
      result_artifact?: unknown;
    }
  | {
      type: "receipt_observed";
      at_ms: number;
      step_id: string;
      lane: HelixAskTurnPlanLaneForTranscript;
      expected_artifacts: string[];
      actual_artifacts: string[];
      missing_artifacts: string[];
      status: HelixAskTurnPlanStepStatusForTranscript;
    }
  | {
      type: "observation_recorded";
      at_ms: number;
      observation: {
        step_id: string;
        lane: HelixAskTurnPlanLaneForTranscript;
        status: HelixAskTurnPlanStepStatusForTranscript;
        actual_artifacts?: string[];
        contract_fail_reason?: string | null;
        error_code?: string | null;
      };
    }
  | {
      type: "interim_voice_callout_handoff";
      at_ms: number;
      turn_id: string;
      artifact: unknown;
      artifact_refs: string[];
      assistant_answer: false;
      terminal_eligible: false;
      raw_content_included: false;
    }
  | {
      type: "decision_delta";
      at_ms: number;
      decision:
        | { kind: "continue"; next_step: { title: string }; reason: string }
        | { kind: "request_input"; required_fields: string[]; reason: string }
        | { kind: "final_failure"; text: string; reason: string }
        | { kind: string; reason: string };
    }
  | {
      type: "item_completed";
      at_ms: number;
      step_id: string;
      lane: HelixAskTurnPlanLaneForTranscript;
      status: HelixAskTurnPlanStepStatusForTranscript;
    }
  | { type: "terminal_answer"; at_ms: number; text: string; status: "final_answer" | "final_failure" | "pending_input" }
  | { type: "turn_completed"; at_ms: number; turn_id: string; status: "running" | "pending_input" | "completed" | "failed" };

export type HelixAskTurnTranscriptEventForTranscript = {
  id: string;
  turn_id?: string | null;
  seq?: number;
  at_ms: number;
  role: "user" | "agent" | "tool" | "final" | "system";
  type:
    | "question"
    | "work_delta"
    | "public_commentary"
    | "plan"
    | "model_decision"
    | "step_started"
    | "receipt_pending"
    | "receipt_observed"
    | "tool_result"
    | "observation"
    | "decision"
    | "final_answer"
    | "turn_completed";
  status?: string | null;
  step_id?: string | null;
  lane?: HelixAskTurnPlanLaneForTranscript | null;
  text: string;
  detail?: string | null;
  superseded_by_step_id?: string | null;
  superseded_reason?: string | null;
  source_event_type?: HelixAskTurnEventForTranscript["type"] | "question";
  event_source: HelixAskTurnTranscriptEventSource;
  reconstructed?: boolean;
};

const readTranscriptString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

export const completeAskTurnIncrementalEvents = <Event extends HelixAskTurnEventForTranscript>(args: {
  turnEvents: Event[];
  turnId: string;
  terminalText: string;
  status: "final_answer" | "final_failure" | "pending_input";
  runtimeStatus: "running" | "pending_input" | "completed" | "failed";
}): Event[] => {
  const withoutTerminal = args.turnEvents.filter(
    (event) => event.type !== "terminal_answer" && event.type !== "turn_completed",
  );
  return [
    ...withoutTerminal,
    {
      type: "terminal_answer",
      at_ms: Date.now(),
      text: args.terminalText,
      status: args.status,
    },
    {
      type: "turn_completed",
      at_ms: Date.now(),
      turn_id: args.turnId,
      status: args.runtimeStatus,
    },
  ] as Event[];
};

const formatAskTurnTranscriptArtifacts = (artifacts: string[]): string =>
  artifacts.map((artifact) => artifact.trim()).filter(Boolean).slice(0, 4).join(", ");

export const buildAskTurnTranscriptEventsForRuntime = (args: {
  turnEvents: HelixAskTurnEventForTranscript[];
  question: string;
  eventSource: HelixAskTurnTranscriptEventSource;
  turnId?: string | null;
  startingSeq?: number;
}): HelixAskTurnTranscriptEventForTranscript[] => {
  const transcriptEvents: HelixAskTurnTranscriptEventForTranscript[] = [];
  const question = args.question.trim();
  let transcriptSeq = Math.max(0, Math.floor(args.startingSeq ?? 0));
  const nextSeq = (): number => transcriptSeq++;
  const turnId = args.turnId?.trim() || null;
  const reconstructed = args.eventSource === "reconstructed";
  if (question) {
    transcriptEvents.push({
      id: "transcript:question",
      turn_id: turnId,
      seq: nextSeq(),
      at_ms: args.turnEvents[0]?.at_ms ?? Date.now(),
      role: "user",
      type: "question",
      text: question,
      source_event_type: "question",
      event_source: args.eventSource,
      ...(reconstructed ? { reconstructed: true } : {}),
    });
  }
  args.turnEvents.forEach((event, index) => {
    const base = {
      id: `transcript:${index}:${event.type}`,
      turn_id: turnId,
      seq: nextSeq(),
      at_ms: event.at_ms,
      source_event_type: event.type,
      event_source: args.eventSource,
      ...(reconstructed ? { reconstructed: true } : {}),
    } as const;
    if (event.type === "turn_started") {
      transcriptEvents.push({
        ...base,
        role: "agent",
        type: "work_delta",
        text: "Understanding the request and preparing a plan.",
        detail: event.goal,
        status: "running",
      });
      return;
    }
    if (event.type === "public_commentary") {
      transcriptEvents.push({
        ...base,
        id: event.event.event_id,
        role: "agent",
        type: "public_commentary",
        step_id: event.event.decision_id ?? null,
        lane: event.event.capability_key && !event.event.capability_key.startsWith("model.")
          ? "workspace"
          : "reasoning",
        status: event.event.status,
        text: event.event.text,
        detail: [
          event.event.timing,
          event.event.certainty_class,
          event.event.expected_artifact,
        ].filter(Boolean).join(" | "),
      });
      return;
    }
    if (event.type === "plan_delta") {
      transcriptEvents.push({
        ...base,
        role: "agent",
        type: "plan",
        step_id: event.step.id,
        lane: event.step.lane,
        status: event.step.status,
        text: `Plan: ${event.step.title}`,
        detail: event.reason,
      });
      return;
    }
    if (event.type === "model_decision_started") {
      transcriptEvents.push({
        ...base,
        role: "agent",
        type: "model_decision",
        step_id: event.step_id,
        status: "running",
        text: `Thinking: ${event.prompt}`,
        detail: event.phase,
      });
      return;
    }
    if (event.type === "model_decision_completed") {
      transcriptEvents.push({
        ...base,
        role: "agent",
        type: "model_decision",
        step_id: event.step_id,
        status: "completed",
        text: `Decision: ${event.summary}`,
        detail: event.phase,
      });
      return;
    }
    if (event.type === "item_started") {
      transcriptEvents.push({
        ...base,
        role: "agent",
        type: "step_started",
        step_id: event.step_id,
        lane: event.lane,
        status: "running",
        text: `Working: ${event.title}`,
      });
      return;
    }
    if (event.type === "receipt_pending") {
      const artifacts = formatAskTurnTranscriptArtifacts(event.expected_artifacts);
      transcriptEvents.push({
        ...base,
        role: "agent",
        type: "receipt_pending",
        step_id: event.step_id,
        lane: event.lane,
        status: "running",
        text: artifacts
          ? `Waiting for required tool receipt: ${artifacts}.`
          : "Waiting for required tool receipt.",
        detail: event.title,
      });
      return;
    }
    if (event.type === "tool_result") {
      const artifacts = formatAskTurnTranscriptArtifacts(event.actual_artifacts);
      transcriptEvents.push({
        ...base,
        role: "tool",
        type: "tool_result",
        step_id: event.step_id,
        lane: event.lane,
        status: event.status,
        text: artifacts ? `Observed artifacts: ${artifacts}` : `Observed ${event.lane} result.`,
        detail:
          event.contract_pass === false
            ? `contract failed: expected ${formatAskTurnTranscriptArtifacts(event.expected_artifacts) || "required artifact"}`
            : event.contract_pass === true
              ? "artifact contract satisfied"
              : null,
      });
      return;
    }
    if (event.type === "receipt_observed") {
      const observed = formatAskTurnTranscriptArtifacts(event.actual_artifacts);
      const missing = formatAskTurnTranscriptArtifacts(event.missing_artifacts);
      transcriptEvents.push({
        ...base,
        role: "tool",
        type: "receipt_observed",
        step_id: event.step_id,
        lane: event.lane,
        status: missing ? "partial" : event.status,
        text: observed
          ? `Tool receipt observed: ${observed}.`
          : "Tool step completed; waiting for receipt correlation.",
        detail: missing ? `Still waiting for: ${missing}` : "required receipt satisfied",
      });
      return;
    }
    if (event.type === "observation_recorded") {
      const artifacts = Array.isArray(event.observation.actual_artifacts)
        ? formatAskTurnTranscriptArtifacts(event.observation.actual_artifacts)
        : "";
      transcriptEvents.push({
        ...base,
        role: "tool",
        type: "observation",
        step_id: event.observation.step_id,
        lane: event.observation.lane,
        status: event.observation.status,
        text: artifacts ? `Recorded observation: ${artifacts}` : `Recorded observation for ${event.observation.step_id}.`,
        detail: event.observation.contract_fail_reason ?? event.observation.error_code ?? null,
      });
      return;
    }
    if (event.type === "decision_delta") {
      const decisionKind = event.decision.kind;
      transcriptEvents.push({
        ...base,
        role: "agent",
        type: "decision",
        status: decisionKind,
        text:
          decisionKind === "continue" && "next_step" in event.decision
            ? `Next step: ${event.decision.next_step.title}`
            : decisionKind === "request_input" && "required_fields" in event.decision
              ? `Need user input: ${event.decision.required_fields.join(", ") || "missing detail"}`
              : decisionKind === "final_failure" && "text" in event.decision
                ? event.decision.text
                : "Ready to answer from the completed observations.",
        detail: event.decision.reason,
      });
      return;
    }
    if (event.type === "item_completed") {
      transcriptEvents.push({
        ...base,
        role: "system",
        type: "turn_completed",
        step_id: event.step_id,
        lane: event.lane,
        status: event.status,
        text: `Completed step ${event.step_id}.`,
      });
      return;
    }
    if (event.type === "terminal_answer") {
      transcriptEvents.push({
        ...base,
        role: "final",
        type: "final_answer",
        status: event.status,
        text: event.text,
      });
      return;
    }
    if (event.type === "turn_completed") {
      transcriptEvents.push({
        ...base,
        role: "system",
        type: "turn_completed",
        status: event.status,
        text: `Turn completed with status: ${event.status}.`,
      });
    }
  });
  return transcriptEvents;
};

export const buildAskTurnTranscriptEvents = (args: {
  turnEvents: HelixAskTurnEventForTranscript[];
  question: string;
  eventSource: HelixAskTurnTranscriptEventSource;
  turnId?: string | null;
  startingSeq?: number;
}): HelixAskTurnTranscriptEventForTranscript[] =>
  buildAskTurnTranscriptEventsForRuntime(args);

export const buildAskTurnTranscriptEventsForRuntimeEvent = (args: {
  event: HelixAskTurnEventForTranscript;
  eventIndex: number;
  question: string;
  eventSource: HelixAskTurnTranscriptEventSource;
  turnId?: string | null;
}): HelixAskTurnTranscriptEventForTranscript[] =>
  buildAskTurnTranscriptEvents({
    turnEvents: [args.event],
    question: args.eventIndex === 0 ? args.question : "",
    eventSource: args.eventSource,
    turnId: args.turnId,
    startingSeq: args.eventIndex,
  }).map((event) => ({
    ...event,
    id: `transcript:${args.eventIndex}:${event.source_event_type ?? event.type}`,
  }));

export const hasMeaningfulAskTurnTranscriptRows = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.some((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    const record = entry as Record<string, unknown>;
    const type = readTranscriptString(record.type);
    const sourceEventType = readTranscriptString(record.source_event_type);
    if (!type || type === "question" || type === "final_answer" || type === "turn_completed") return false;
    if (sourceEventType === "terminal_answer" || sourceEventType === "turn_completed") return false;
    return Boolean(readTranscriptString(record.text));
  });

export const inferHelixAskTranscriptPrompt = (
  payload: Record<string, unknown>,
  fallbackPrompt?: string | null,
): string => {
  const prompt =
    readTranscriptString(fallbackPrompt) ??
    readTranscriptString(payload.active_prompt) ??
    readTranscriptString(payload.question) ??
    readTranscriptString(payload.prompt) ??
    readTranscriptString(payload.raw_user_prompt) ??
    readTranscriptString(payload.transcript);
  return prompt ?? "";
};

export const inferHelixAskTranscriptTurnId = (
  payload: Record<string, unknown>,
  fallbackTurnId?: string | null,
): string => {
  const turnId =
    readTranscriptString(fallbackTurnId) ??
    readTranscriptString(payload.turn_id) ??
    readTranscriptString(payload.turnId) ??
    readTranscriptString(payload.active_turn_id) ??
    readTranscriptString(payload.trace_id) ??
    readTranscriptString(payload.traceId);
  return turnId ?? `ask:${crypto.randomUUID()}`;
};

export const inferHelixAskTranscriptTraceId = (
  payload: Record<string, unknown>,
  turnId: string,
  fallbackTraceId?: string | null,
): string =>
  readTranscriptString(fallbackTraceId) ??
  readTranscriptString(payload.trace_id) ??
  readTranscriptString(payload.traceId) ??
  readTranscriptString(payload.active_trace_id) ??
  turnId;

export const normalizeAskTurnTranscriptSupersessionsForRuntime = (
  events: HelixAskTurnTranscriptEventForTranscript[],
): HelixAskTurnTranscriptEventForTranscript[] => {
  const satisfyingArtifactStep = new Map<string, string>();
  for (const event of events) {
    if (event.type !== "tool_result" && event.type !== "observation") continue;
    if (event.status && event.status !== "completed") continue;
    const text = `${event.text ?? ""} ${event.detail ?? ""}`.toLowerCase();
    const stepId = event.step_id ?? null;
    if (!stepId) continue;
    if (text.includes("doc_location_matches")) satisfyingArtifactStep.set("doc_location_matches", stepId);
    if (text.includes("note_update_receipt")) satisfyingArtifactStep.set("note_update_receipt", stepId);
  }
  if (satisfyingArtifactStep.size === 0) return events;
  return events.map((event) => {
    if (event.type !== "model_decision") return event;
    if (event.status === "running" || event.status === "superseded") return event;
    const text = String(event.text ?? "").toLowerCase();
    const noLocationClaim =
      /\b(?:no mentions?|not found|could not find|could not locate|no matches?|missing)\b/.test(text) &&
      /\b(?:mention|location|locate|find|centerline|alpha|document|doc)\b/.test(text);
    if (noLocationClaim && satisfyingArtifactStep.has("doc_location_matches")) {
      return {
        ...event,
        status: "superseded",
        superseded_by_step_id: satisfyingArtifactStep.get("doc_location_matches") ?? null,
        superseded_reason: "later_tool_observation_produced_doc_location_matches",
      };
    }
    const noNoteClaim =
      /\b(?:no note|not saved|could not save|could not append|missing note|note missing)\b/.test(text) &&
      satisfyingArtifactStep.has("note_update_receipt");
    if (noNoteClaim) {
      return {
        ...event,
        status: "superseded",
        superseded_by_step_id: satisfyingArtifactStep.get("note_update_receipt") ?? null,
        superseded_reason: "later_tool_observation_produced_note_update_receipt",
      };
    }
    return event;
  });
};
