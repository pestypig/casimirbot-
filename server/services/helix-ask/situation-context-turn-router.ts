import type { HelixActiveSituationContext } from "@shared/helix-active-situation-context";
import type {
  HelixDeicticInputModality,
  HelixDeicticReference,
  HelixDeicticResolutionStatus,
} from "@shared/helix-deictic-reference";
import type { HelixSituationEvidenceSelection } from "@shared/helix-situation-evidence-selection";
import type { HelixVisualComparisonSession } from "@shared/helix-visual-comparison-session";
import { detectDeicticReference } from "./deictic-reference-detector";
import { selectSituationEvidence } from "./situation-evidence-selector";
import { resolveActiveSituationContext } from "../situation-room/active-situation-context-resolver";
import { repairUnboundVisualSituationContext } from "../situation-room/live-situation-context-binding-repair";
import { listLiveFieldEvaluations } from "../situation-room/live-field-evaluation-store";
import { listProcedureEpochLedger } from "../situation-room/procedure-epoch-ledger-store";
import { listProcedureEpochClosures } from "../situation-room/procedure-epoch-closure";
import { listLiveProbeResults } from "../situation-room/live-probe-result-store";
import { createVisualComparisonSession } from "../situation-room/visual-comparison-session-store";
import { createVoiceLiveHandoff } from "../situation-room/voice-live-handoff-router";

export type SituationContextTurnRouteKind =
  | "none"
  | "situation_context_question"
  | "procedure_epoch_replay_question"
  | "visual_comparison_setup"
  | "request_user_input";

export type SituationContextTurnRoute = {
  route: SituationContextTurnRouteKind;
  deictic_reference: HelixDeicticReference;
  active_situation_context: HelixActiveSituationContext;
  situation_evidence_selection: HelixSituationEvidenceSelection;
  answer_text: string | null;
  comparison_session?: HelixVisualComparisonSession | null;
  voice_live_handoff?: ReturnType<typeof createVoiceLiveHandoff> | null;
  binding_repair?: ReturnType<typeof repairUnboundVisualSituationContext> | null;
};

const line = (label: string, value: string | null | undefined): string =>
  value && value.trim() ? `${label}: ${value.trim()}` : "";

const isProcedureReplayPrompt = (prompt: string): boolean =>
  /\b(?:why\s+did|what\s+changed|last\s+(?:situation\s+)?epoch|confidence\s+change|stay\s+silent|interject|replay\s+the\s+last)\b/i.test(prompt);

const isComparisonPrompt = (prompt: string): boolean =>
  /\b(?:compare\s+this|compare\s+(?:this|the)\s+(?:file|image|picture|screen)|next\s+(?:one|file|image|picture|screen)|remember\s+this\s+as\s+the\s+first)\b/i.test(prompt);

const buildSituationAnswer = (input: {
  prompt: string;
  activeContext: HelixActiveSituationContext;
  selection: HelixSituationEvidenceSelection;
}): string => {
  const context = input.activeContext;
  const evaluations = context.situation_run_id
    ? listLiveFieldEvaluations({
        threadId: context.thread_id,
        environmentId: context.environment_id ?? null,
        situationRunId: context.situation_run_id,
        limit: 20,
      })
    : [];
  const byField = new Map(evaluations.map((entry) => [entry.field_key, entry]));
  const scene = byField.get("scene") ?? byField.get("place") ?? null;
  const activity = byField.get("activity") ?? null;
  const objects = byField.get("objects") ?? byField.get("entities") ?? null;
  const uncertainty = byField.get("uncertainty") ?? byField.get("missing_evidence") ?? null;
  const nextCheck = byField.get("next_check") ?? null;
  const asksSelection = /\b(?:clicking|clicked|selected|selection|highlighted)\b/i.test(input.prompt);
  const selectionCaveat = asksSelection
    ? "I can use the active visual SituationRun, but I can only confirm the clicked/selected file if the selected state is visible in the latest frame or captured in the next epoch."
    : "I can use the active visual SituationRun; this is grounded in compact procedure evidence, not raw screen pixels.";
  return [
    selectionCaveat,
    line("Scene", scene?.value),
    line("Activity", activity?.value),
    line("Visible objects", objects?.value),
    line("Uncertainty", uncertainty?.value),
    line("Next check", nextCheck?.next_check || nextCheck?.value),
    `Evidence refs: ${[
      ...input.selection.selected_observation_refs,
      ...input.selection.selected_field_evaluation_refs,
      ...input.selection.selected_probe_result_refs,
      ...input.selection.selected_epoch_closure_refs,
    ].slice(0, 8).join(", ") || "none selected"}.`,
    context.status === "stale" ? "Freshness caveat: selected evidence is stale." : "",
    "Raw images, audio, and logs were not injected into Ask context.",
  ].filter(Boolean).join("\n");
};

const buildReplayAnswer = (input: {
  activeContext: HelixActiveSituationContext;
  selection: HelixSituationEvidenceSelection;
}): string => {
  const context = input.activeContext;
  if (!context.situation_run_id || context.latest_epoch === null || context.latest_epoch === undefined) {
    return "I do not have a bound situation epoch to replay yet.";
  }
  const closures = listProcedureEpochClosures({
    threadId: context.thread_id,
    environmentId: context.environment_id ?? null,
    situationRunId: context.situation_run_id,
    limit: 2,
  });
  const closure = closures.at(-1) ?? null;
  const epoch = closure?.epoch ?? context.latest_epoch;
  const ledger = listProcedureEpochLedger({
    threadId: context.thread_id,
    environmentId: context.environment_id ?? null,
    situationRunId: context.situation_run_id,
    epoch,
    limit: 20,
  });
  const probes = listLiveProbeResults({
    threadId: context.thread_id,
    environmentId: context.environment_id ?? null,
    situationRunId: context.situation_run_id,
    limit: 5,
  });
  const previousObservation = ledger.find((entry) => entry.item_kind === "observation")?.summary ?? null;
  const latestProbe = probes.at(-1) ?? null;
  return [
    `Epoch ${epoch} closed as ${closure?.status ?? "unknown"}.`,
    line("Observation", previousObservation),
    latestProbe ? `Probe result: ${latestProbe.status}; signals: ${latestProbe.observed_signals.join(", ") || "none"}.` : "Probe result: no probe result was selected for this epoch.",
    closure?.confidence_changes.length ? `Confidence changes: ${closure.confidence_changes.join(", ")}.` : "",
    closure?.pending_actions.length ? `Pending actions: ${closure.pending_actions.join(", ")}.` : "Arbitration did not require an action from this epoch.",
    `Evidence refs: ${[
      ...input.selection.selected_probe_result_refs,
      ...input.selection.selected_epoch_closure_refs,
      ...input.selection.selected_field_evaluation_refs,
    ].slice(0, 8).join(", ") || "none selected"}.`,
    "Raw images, audio, and logs were not injected into Ask context.",
  ].filter(Boolean).join("\n");
};

export function routeSituationContextTurn(input: {
  threadId: string;
  promptText: string;
  inputModality?: HelixDeicticInputModality;
}): SituationContextTurnRoute {
  const activeContext = resolveActiveSituationContext({ threadId: input.threadId });
  const initialReference = detectDeicticReference({
    threadId: input.threadId,
    promptText: input.promptText,
    inputModality: input.inputModality ?? "typed",
  });
  if (!initialReference.candidate_signal) {
    const selection = selectSituationEvidence({
      threadId: input.threadId,
      activeContext,
      deicticReference: initialReference,
    });
    return {
      route: "none",
      deictic_reference: initialReference,
      active_situation_context: activeContext,
      situation_evidence_selection: selection,
      answer_text: null,
      comparison_session: null,
      voice_live_handoff: null,
      binding_repair: null,
    };
  }
  const bindingRepair = repairUnboundVisualSituationContext({
    activeContext,
    promptText: input.promptText,
  });
  const resolvedActiveContext = bindingRepair?.status === "applied"
    ? resolveActiveSituationContext({
        threadId: bindingRepair.thread_id,
        environmentId: bindingRepair.environment_id,
      })
    : activeContext;
  const resolutionStatus: HelixDeicticResolutionStatus = resolvedActiveContext.status === "active"
      ? "resolved"
    : resolvedActiveContext.status === "stale"
      ? "stale"
      : resolvedActiveContext.status === "unbound"
        ? "unbound_source"
        : "missing_context";
  const deicticReference = {
    ...initialReference,
    resolved_context_refs: [
      resolvedActiveContext.context_id,
      resolvedActiveContext.situation_run_id ?? "",
      ...resolvedActiveContext.latest_observation_refs,
      ...resolvedActiveContext.latest_field_evaluation_refs,
      ...resolvedActiveContext.latest_probe_result_refs,
      ...resolvedActiveContext.latest_closure_refs,
    ].filter(Boolean),
    resolution_status: resolutionStatus,
  };
  const selection = selectSituationEvidence({
    threadId: input.threadId,
    activeContext: resolvedActiveContext,
    deicticReference,
    askingHistory: isProcedureReplayPrompt(input.promptText),
  });
  const voiceLiveHandoff = input.inputModality === "voice"
    ? createVoiceLiveHandoff({
        threadId: input.threadId,
        transcript: input.promptText,
        deicticReference,
        situationEvidenceSelection: selection,
      })
    : null;
  if (!selection.answerable) {
    return {
      route: "situation_context_question",
      deictic_reference: deicticReference,
      active_situation_context: activeContext,
      situation_evidence_selection: selection,
      answer_text: [
        "I resolved this as a live situation-context question, but there is no server-bound active SituationRun evidence to answer from yet.",
        bindingRepair?.status === "failed"
          ? "I attempted to bind the live visual source into a SituationRun, but the repair failed."
          : selection.answerability_reason,
        `Next required action: ${activeContext.next_required_action ?? "start or bind a live source"}.`,
      ].join(" "),
      comparison_session: null,
      voice_live_handoff: voiceLiveHandoff,
      binding_repair: bindingRepair,
    };
  }
  if (isComparisonPrompt(input.promptText) && resolvedActiveContext.situation_run_id && resolvedActiveContext.latest_observation_refs[0]) {
    const comparisonSession = createVisualComparisonSession({
      threadId: input.threadId,
      situationRunId: resolvedActiveContext.situation_run_id,
      baselineEpoch: resolvedActiveContext.latest_epoch ?? 0,
      baselineObservationRef: resolvedActiveContext.latest_observation_refs.at(-1) ?? resolvedActiveContext.latest_observation_refs[0],
    });
    return {
      route: "visual_comparison_setup",
      deictic_reference: deicticReference,
      active_situation_context: resolvedActiveContext,
      situation_evidence_selection: selection,
      answer_text: [
        "I saved the current visual SituationRun observation as the comparison baseline.",
        `Baseline: ${comparisonSession.baseline_observation_ref} at epoch ${comparisonSession.baseline_epoch}.`,
        "Show the next file/image and let the next visual epoch arrive; comparison will be grounded in the procedure evidence, not raw image injection.",
      ].join("\n"),
      comparison_session: comparisonSession,
      voice_live_handoff: voiceLiveHandoff,
      binding_repair: bindingRepair,
    };
  }
  if (isProcedureReplayPrompt(input.promptText) || deicticReference.reference_type === "latest_epoch_change") {
    return {
      route: "procedure_epoch_replay_question",
      deictic_reference: deicticReference,
      active_situation_context: resolvedActiveContext,
      situation_evidence_selection: selection,
      answer_text: buildReplayAnswer({ activeContext: resolvedActiveContext, selection }),
      comparison_session: null,
      voice_live_handoff: voiceLiveHandoff,
      binding_repair: bindingRepair,
    };
  }
  return {
    route: "situation_context_question",
    deictic_reference: deicticReference,
    active_situation_context: resolvedActiveContext,
    situation_evidence_selection: selection,
    answer_text: buildSituationAnswer({
      prompt: input.promptText,
      activeContext: resolvedActiveContext,
      selection,
    }),
    comparison_session: null,
    voice_live_handoff: voiceLiveHandoff,
    binding_repair: bindingRepair,
  };
}
