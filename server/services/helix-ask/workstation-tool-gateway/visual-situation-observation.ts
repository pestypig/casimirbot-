import type { HelixWorkstationCapabilityManifest } from "./types";
import { routeSituationContextTurn } from "../situation-context-turn-router";
import { buildSituationContextPack } from "../../situation-room/situation-context-pack";

export const VISUAL_SITUATION_OBSERVATION_CAPABILITY =
  "situation-room.describe_visual_capture" as const;
export const VISUAL_SITUATION_OBSERVATION_SCHEMA =
  "helix.visual_situation_observation.v1" as const;

type VisualSituationGatewayExecution = {
  ok: boolean;
  status: "completed" | "failed";
  summary: string;
  observation: Record<string, unknown>;
  error?: string;
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean),
    ),
  );

export const visualSituationObservationManifest: HelixWorkstationCapabilityManifest =
  {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: VISUAL_SITUATION_OBSERVATION_CAPABILITY,
    label: "Describe the current visual capture",
    description:
      "Reads the active SituationRun for the admitted conversation thread and returns bounded visual evidence for Codex follow-up reasoning.",
    panel_id: "image-lens",
    action_id: "describe_visual_capture",
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: true,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        thread_id: { type: "string" },
        prompt: { type: "string" },
        source_target_intent: {
          type: "object",
          additionalProperties: true,
        },
      },
    },
    output_observation_schema: VISUAL_SITUATION_OBSERVATION_SCHEMA,
    observation_schema: VISUAL_SITUATION_OBSERVATION_SCHEMA,
    safety_tags: [
      "read_only",
      "bounded_situation_context",
      "current_turn_reentry_required",
      "no_raw_image",
      "no_shell",
      "no_code_mutation",
      "non_terminal",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };

export const executeVisualSituationObservationCapability = (input: {
  turnId: string;
  args: Record<string, unknown>;
}): VisualSituationGatewayExecution => {
  const sourceTargetIntent = readRecord(input.args.source_target_intent);
  const threadId =
    readString(input.args.thread_id) ??
    readString(sourceTargetIntent?.thread_id) ??
    "helix-ask:desktop";
  const promptText =
    readString(input.args.prompt) ??
    "Describe what is happening right now in the active visual capture.";
  const now = new Date().toISOString();
  const route = routeSituationContextTurn({
    threadId,
    promptText,
    inputModality: "typed",
    turnId: input.turnId,
    submittedAt: now,
    serverReceivedAt: now,
    answerStartedAt: now,
  });
  const observationRefs = uniqueStrings([
    ...route.active_situation_context.latest_observation_refs,
    ...route.active_situation_context.latest_field_evaluation_refs,
    ...route.active_situation_context.latest_interpretation_run_refs,
  ]);
  if (
    route.route !== "situation_context_question" ||
    !route.answer_text ||
    !route.situation_evidence_selection.answerable ||
    observationRefs.length === 0
  ) {
    const error = "active_visual_situation_evidence_unavailable";
    return {
      ok: false,
      status: "failed",
      summary:
        "No answerable current visual SituationRun evidence was available for this conversation thread.",
      error,
      observation: {
        schema: VISUAL_SITUATION_OBSERVATION_SCHEMA,
        capability_key: VISUAL_SITUATION_OBSERVATION_CAPABILITY,
        status: "unavailable",
        error,
        thread_id: threadId,
        situation_run_id:
          route.active_situation_context.situation_run_id ?? null,
        selected_observation_refs: observationRefs,
        reentry_required: true,
        answer_authority: false,
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  }

  const contextPack = buildSituationContextPack({ threadId });
  const frameEvidence = {
    schema: "helix.visual_frame_evidence.v1",
    turn_id: input.turnId,
    thread_id: threadId,
    situation_run_id: route.active_situation_context.situation_run_id,
    answerable: route.situation_evidence_selection.answerable,
    selected_observation_refs:
      route.situation_evidence_selection.selected_observation_refs,
    selected_field_evaluation_refs:
      route.situation_evidence_selection.selected_field_evaluation_refs,
    answer_text: route.answer_text,
    assistant_answer: false,
    raw_content_included: false,
  };
  const situationContextPack = {
    ...contextPack,
    schema: "helix.situation_context_pack.v1",
    turn_id: input.turnId,
    answer_text: route.answer_text,
    source_observation_refs: observationRefs,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const coverage = {
    schema: "helix.visual_capture_coverage.v1",
    turn_id: input.turnId,
    thread_id: threadId,
    situation_run_id: route.active_situation_context.situation_run_id,
    selected_observation_refs: observationRefs,
    selection_status: route.active_situation_context.status,
    freshness_summary: route.active_situation_context.freshness_summary,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    ok: true,
    status: "completed",
    summary: "Current visual SituationRun evidence is ready for Codex reasoning.",
    observation: {
      schema: VISUAL_SITUATION_OBSERVATION_SCHEMA,
      capability_key: VISUAL_SITUATION_OBSERVATION_CAPABILITY,
      status: "completed",
      thread_id: threadId,
      situation_run_id: route.active_situation_context.situation_run_id,
      visual_frame_evidence: frameEvidence,
      situation_context_pack: situationContextPack,
      visual_capture_coverage: coverage,
      source_observation_refs: observationRefs,
      answer_text: route.answer_text,
      observation_role: "evidence_not_assistant_answer",
      reentry_required: true,
      answer_authority: false,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};
