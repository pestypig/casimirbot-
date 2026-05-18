import crypto from "node:crypto";
import {
  HELIX_CONVERSATIONAL_ANSWER_DISTILLATION_SCHEMA,
  type HelixConversationalAnswerDistillation,
  type HelixConversationalAnswerStyle,
} from "@shared/helix-conversational-answer-distillation";
import {
  HELIX_PROCEDURE_REASONING_SNAPSHOT_SCHEMA,
  type HelixProcedureReasoningSnapshot,
} from "@shared/helix-procedure-reasoning-snapshot";
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
import {
  listProcedureReasoningSnapshots,
  recordProcedureReasoningSnapshot,
} from "../situation-room/procedure-reasoning-snapshot-store";
import {
  listConversationalAnswerDistillations,
  recordConversationalAnswerDistillation,
} from "./conversational-answer-distillation-store";
import { chooseLiveAnswerStyle, formatDistilledAnswer } from "./live-answer-style-policy";

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
  reasoning_snapshot?: HelixProcedureReasoningSnapshot | null;
  answer_distillation?: HelixConversationalAnswerDistillation | null;
  comparison_session?: HelixVisualComparisonSession | null;
  voice_live_handoff?: ReturnType<typeof createVoiceLiveHandoff> | null;
  binding_repair?: ReturnType<typeof repairUnboundVisualSituationContext> | null;
};

const line = (label: string, value: string | null | undefined): string =>
  value && value.trim() ? `${label}: ${value.trim()}` : "";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const isProcedureReplayPrompt = (prompt: string): boolean =>
  /\b(?:why\s+did|what\s+changed|last\s+(?:situation\s+)?epoch|confidence\s+change|stay\s+silent|interject|replay\s+the\s+last)\b/i.test(prompt);

const isComparisonPrompt = (prompt: string): boolean =>
  /\b(?:compare\s+this|compare\s+(?:this|the)\s+(?:file|image|picture|screen)|next\s+(?:one|file|image|picture|screen)|remember\s+this\s+as\s+the\s+first)\b/i.test(prompt);

const isEvidenceExpansionPrompt = (prompt: string): boolean =>
  /\b(?:show\s+(?:the\s+)?evidence|why\s+did\s+you\s+say|why\s+that|go\s+to\s+log|replay\s+that|show\s+refs?|what\s+evidence)\b/i.test(prompt);

const selectedEvidenceRefs = (selection: HelixSituationEvidenceSelection): string[] =>
  Array.from(new Set([
    ...selection.selected_observation_refs,
    ...selection.selected_field_evaluation_refs,
    ...selection.selected_probe_result_refs,
    ...selection.selected_epoch_closure_refs,
    ...selection.selected_source_descriptor_refs,
  ])).slice(0, 24);

const getSituationFields = (context: HelixActiveSituationContext) => {
  const evaluations = context.situation_run_id
    ? listLiveFieldEvaluations({
        threadId: context.thread_id,
        environmentId: context.environment_id ?? null,
        situationRunId: context.situation_run_id,
        limit: 20,
      })
    : [];
  const byField = new Map(evaluations.map((entry) => [entry.field_key, entry]));
  return {
    evaluations,
    scene: byField.get("scene") ?? byField.get("place") ?? null,
    activity: byField.get("activity") ?? null,
    objects: byField.get("objects") ?? byField.get("entities") ?? null,
    uncertainty: byField.get("uncertainty") ?? byField.get("missing_evidence") ?? null,
    nextCheck: byField.get("next_check") ?? null,
  };
};

const buildSituationFullReasoning = (input: {
  prompt: string;
  activeContext: HelixActiveSituationContext;
  selection: HelixSituationEvidenceSelection;
}): string => {
  const context = input.activeContext;
  const { scene, activity, objects, uncertainty, nextCheck } = getSituationFields(context);
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
    `Evidence refs: ${selectedEvidenceRefs(input.selection).slice(0, 8).join(", ") || "none selected"}.`,
    context.status === "stale" ? "Freshness caveat: selected evidence is stale." : "",
    "Raw images, audio, and logs were not injected into Ask context.",
  ].filter(Boolean).join("\n");
};

const summarizeVisibleContext = (value: string | null | undefined): string => {
  const trimmed = value?.replace(/\s+/g, " ").trim() ?? "";
  if (!trimmed) return "the active visual workspace";
  const firstSentence = trimmed.split(/(?<=[.!?])\s+/)[0] ?? trimmed;
  return firstSentence.length > 180 ? `${firstSentence.slice(0, 177).trim()}...` : firstSentence;
};

const stripSceneLeadIn = (value: string): string => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned
    .replace(/^(?:the\s+)?(?:visible\s+scene|current\s+live\s+frame|live\s+frame|current\s+frame|image|screen)\s+(?:showcases|shows|depicts|displays|features|contains)\s+/i, "")
    .replace(/^(?:the\s+)?(?:active\s+context|ui)\s+(?:appears\s+to\s+be|suggests)\s+/i, "")
    .trim();
};

const extractLabeledContainer = (value: string): { kind: string; label: string } | null => {
  const text = value.replace(/\s+/g, " ").trim();
  const match = text.match(/\b(file\s+directory|directory|folder|interface|window)\s+(?:labeled|named|titled)\s+"([^"]+)"/i);
  if (!match?.[1] || !match[2]) return null;
  const rawKind = match[1].toLowerCase();
  const kind = rawKind === "file directory" ? "folder" : rawKind;
  return { kind, label: match[2].replace(/[.,;\s]+$/, "") };
};

const inferVisibleContentPhrase = (input: {
  scene: string | null | undefined;
  objects: string | null | undefined;
}): string => {
  const text = `${input.scene ?? ""} ${input.objects ?? ""}`.toLowerCase();
  const content: string[] = [];
  if (/\bsolar|sdo|sun|flare|magnetic|dynamics|observator/.test(text)) {
    content.push("solar-observation");
  }
  if (/\bvideo|\.mp4|\.mov\b/.test(text)) {
    content.push("video");
  }
  if (/\bimage|\.png|\.jpg|diagram|graph|chart/.test(text)) {
    content.push("image");
  }
  if (/\bpdf|document/.test(text)) {
    content.push("document");
  }
  if (content.length === 0) return "visible file entries";
  const unique = Array.from(new Set(content));
  if (unique.length === 1) return `${unique[0]} files`;
  if (unique[0] === "solar-observation") {
    return `solar-observation ${unique.slice(1).join(" and ")} files`;
  }
  return `${unique.join(" and ")} files`;
};

const summarizeVisibleWorkspace = (input: {
  prompt: string;
  scene: string | null | undefined;
  objects: string | null | undefined;
}): string => {
  const source = input.scene ?? input.objects ?? null;
  const sceneSummary = summarizeVisibleContext(source);
  const stripped = stripSceneLeadIn(sceneSummary);
  const labeled = extractLabeledContainer(source ?? "");
  const contentPhrase = inferVisibleContentPhrase({ scene: input.scene, objects: input.objects });
  if (labeled) {
    return `a ${labeled.kind} labeled "${labeled.label}" with ${contentPhrase}`;
  }
  if (!stripped || stripped === "the active visual workspace") {
    return "the active visual workspace";
  }
  return stripped.replace(/\.$/, "");
};

const buildConciseSituationAnswer = (input: {
  prompt: string;
  activeContext: HelixActiveSituationContext;
  style: HelixConversationalAnswerStyle;
}): { concise: string; caveat: string | null } => {
  const { scene, activity, objects, uncertainty } = getSituationFields(input.activeContext);
  const prompt = input.prompt;
  const visible = summarizeVisibleWorkspace({
    prompt,
    scene: scene?.value,
    objects: objects?.value,
  });
  const asksAboutSpecificFile = /\b(?:what|which|describe|see)\b[\s\S]{0,80}\bfile\b|\bfile\s+(?:i'm|i am|am i|that i'm|that i am)\s+(?:looking|clicking|viewing)\b/i.test(prompt);
  if (/\b(?:equation|formula)\b/i.test(prompt)) {
    return {
      concise: `You're viewing ${visible}, but I can't identify a specific equation until a readable formula or opened file is visible.`,
      caveat: null,
    };
  }
  if (/\b(?:clicking|clicked|selected|selection|highlighted)\b/i.test(prompt)) {
    return {
      concise: "I can see the active folder or screen view, but I can't confirm the clicked file unless the selection is visible or the next frame captures the change.",
      caveat: null,
    };
  }
  if (asksAboutSpecificFile) {
    return {
      concise: `You're viewing ${visible}, but I can't confirm a specific selected file from the current evidence.`,
      caveat: null,
    };
  }
  if (/\b(?:file|folder|looking at|screen|this|now)\b/i.test(prompt)) {
    const action = activity?.value ? ` ${activity.value}` : "";
    return {
      concise: `You're viewing ${visible}.${action ? ` ${action}` : ""}`,
      caveat: uncertainty?.value ? `Caveat: ${uncertainty.value}` : null,
    };
  }
  return {
    concise: summarizeVisibleContext(scene?.value ?? activity?.value ?? objects?.value),
    caveat: uncertainty?.value ? `Caveat: ${uncertainty.value}` : null,
  };
};

const recordReasoningAndDistillation = (input: {
  turnId: string;
  threadId: string;
  prompt: string;
  activeContext: HelixActiveSituationContext;
  selection: HelixSituationEvidenceSelection;
  sourceAnswerKind: "situation_context_question" | "procedure_epoch_replay";
  fullReasoningSummary: string;
  conciseAnswer: string;
  caveat?: string | null;
  style: HelixConversationalAnswerStyle;
}): {
  snapshot: HelixProcedureReasoningSnapshot;
  distillation: HelixConversationalAnswerDistillation;
  terminalText: string;
} => {
  const evidenceRefs = selectedEvidenceRefs(input.selection);
  const snapshot: HelixProcedureReasoningSnapshot = recordProcedureReasoningSnapshot({
    schema: HELIX_PROCEDURE_REASONING_SNAPSHOT_SCHEMA,
    snapshot_id: `procedure_reasoning_snapshot:${hashShort([
      input.turnId,
      input.activeContext.situation_run_id,
      input.selection.selection_id,
      input.fullReasoningSummary,
    ])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    situation_run_id: input.activeContext.situation_run_id ?? null,
    epoch: input.activeContext.latest_epoch ?? null,
    user_question: input.prompt,
    full_reasoning_summary: input.fullReasoningSummary,
    observation_refs: input.selection.selected_observation_refs,
    field_evaluation_refs: input.selection.selected_field_evaluation_refs,
    prediction_refs: [],
    probe_result_refs: input.selection.selected_probe_result_refs,
    confidence_update_refs: [],
    epoch_closure_refs: input.selection.selected_epoch_closure_refs,
    selected_evidence_pack_ref: input.selection.selection_id,
    assistant_answer: false,
    raw_content_included: false,
  });
  const distillation: HelixConversationalAnswerDistillation = recordConversationalAnswerDistillation({
    schema: HELIX_CONVERSATIONAL_ANSWER_DISTILLATION_SCHEMA,
    distillation_id: `conversational_answer_distillation:${hashShort([
      input.turnId,
      snapshot.snapshot_id,
      input.conciseAnswer,
      input.style,
    ])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    situation_run_id: input.activeContext.situation_run_id ?? null,
    source_answer_kind: input.sourceAnswerKind,
    full_reasoning_refs: [snapshot.snapshot_id, input.selection.selection_id],
    selected_evidence_refs: evidenceRefs,
    concise_answer: input.conciseAnswer,
    caveat: input.caveat ?? null,
    expansion_available: true,
    expansion_ref: snapshot.snapshot_id,
    style: input.style,
    assistant_answer: false,
    raw_content_included: false,
  });
  return {
    snapshot,
    distillation,
    terminalText: formatDistilledAnswer({
      conciseAnswer: distillation.concise_answer,
      caveat: distillation.caveat,
      style: distillation.style,
      expansionAvailable: distillation.expansion_available,
    }),
  };
};

const buildSnapshotExpansionAnswer = (input: {
  snapshot: HelixProcedureReasoningSnapshot | null;
  distillation: HelixConversationalAnswerDistillation | null;
}): string => {
  if (!input.snapshot && !input.distillation) {
    return "I do not have a saved situation reasoning snapshot to expand yet.";
  }
  const snapshot = input.snapshot;
  const distillation = input.distillation;
  return [
    distillation?.concise_answer ? `Short answer: ${distillation.concise_answer}` : "",
    snapshot?.full_reasoning_summary ? `Reasoning snapshot: ${snapshot.full_reasoning_summary}` : "",
    snapshot ? `Evidence refs: ${[
      ...snapshot.observation_refs,
      ...snapshot.field_evaluation_refs,
      ...snapshot.probe_result_refs,
      ...snapshot.epoch_closure_refs,
    ].slice(0, 12).join(", ") || "none"}.` : "",
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
  turnId?: string | null;
}): SituationContextTurnRoute {
  const turnId = input.turnId ?? `situation_context_turn:${hashShort([
    input.threadId,
    input.promptText,
    input.inputModality ?? "typed",
    Date.now(),
  ])}`;
  const activeContext = resolveActiveSituationContext({ threadId: input.threadId });
  const initialReference = detectDeicticReference({
    threadId: input.threadId,
    promptText: input.promptText,
    inputModality: input.inputModality ?? "typed",
  });
  if (!initialReference.candidate_signal && isEvidenceExpansionPrompt(input.promptText)) {
    const latestDistillation = listConversationalAnswerDistillations({
      threadId: input.threadId,
      limit: 1,
    }).at(-1) ?? null;
    const latestSnapshot = latestDistillation?.expansion_ref
      ? (listProcedureReasoningSnapshots({ threadId: input.threadId, limit: 20 })
          .find((entry) => entry.snapshot_id === latestDistillation.expansion_ref) ?? null)
      : (listProcedureReasoningSnapshots({ threadId: input.threadId, limit: 1 }).at(-1) ?? null);
    const selection = selectSituationEvidence({
      threadId: input.threadId,
      activeContext,
      deicticReference: initialReference,
      askingHistory: true,
    });
    return {
      route: "procedure_epoch_replay_question",
      deictic_reference: {
        ...initialReference,
        reference_type: "latest_epoch_change",
        candidate_signal: true,
        resolution_status: latestSnapshot || latestDistillation ? "resolved" : "missing_context",
        resolved_context_refs: [
          activeContext.context_id,
          latestSnapshot?.snapshot_id ?? "",
          latestDistillation?.distillation_id ?? "",
        ].filter(Boolean),
      },
      active_situation_context: activeContext,
      situation_evidence_selection: selection,
      answer_text: buildSnapshotExpansionAnswer({
        snapshot: latestSnapshot,
        distillation: latestDistillation,
      }),
      reasoning_snapshot: latestSnapshot,
      answer_distillation: latestDistillation,
      comparison_session: null,
      voice_live_handoff: null,
      binding_repair: null,
    };
  }
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
      reasoning_snapshot: null,
      answer_distillation: null,
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
      reasoning_snapshot: null,
      answer_distillation: null,
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
      reasoning_snapshot: null,
      answer_distillation: null,
      comparison_session: comparisonSession,
      voice_live_handoff: voiceLiveHandoff,
      binding_repair: bindingRepair,
    };
  }
  if (isProcedureReplayPrompt(input.promptText) || deicticReference.reference_type === "latest_epoch_change") {
    const fullReasoning = buildReplayAnswer({ activeContext: resolvedActiveContext, selection });
    const distillationBundle = recordReasoningAndDistillation({
      turnId,
      threadId: input.threadId,
      prompt: input.promptText,
      activeContext: resolvedActiveContext,
      selection,
      sourceAnswerKind: "procedure_epoch_replay",
      fullReasoningSummary: fullReasoning,
      conciseAnswer: fullReasoning.split("\n").slice(0, 3).join(" "),
      caveat: null,
      style: chooseLiveAnswerStyle({
        promptText: input.promptText,
        inputModality: input.inputModality,
      }),
    });
    return {
      route: "procedure_epoch_replay_question",
      deictic_reference: deicticReference,
      active_situation_context: resolvedActiveContext,
      situation_evidence_selection: selection,
      answer_text: distillationBundle.terminalText,
      reasoning_snapshot: distillationBundle.snapshot,
      answer_distillation: distillationBundle.distillation,
      comparison_session: null,
      voice_live_handoff: voiceLiveHandoff,
      binding_repair: bindingRepair,
    };
  }
  const style = chooseLiveAnswerStyle({
    promptText: input.promptText,
    inputModality: input.inputModality,
  });
  const fullReasoning = buildSituationFullReasoning({
    prompt: input.promptText,
    activeContext: resolvedActiveContext,
    selection,
  });
  const concise = buildConciseSituationAnswer({
    prompt: input.promptText,
    activeContext: resolvedActiveContext,
    style,
  });
  const distillationBundle = recordReasoningAndDistillation({
    turnId,
    threadId: input.threadId,
    prompt: input.promptText,
    activeContext: resolvedActiveContext,
    selection,
    sourceAnswerKind: "situation_context_question",
    fullReasoningSummary: fullReasoning,
    conciseAnswer: concise.concise,
    caveat: concise.caveat,
    style,
  });
  return {
    route: "situation_context_question",
    deictic_reference: deicticReference,
    active_situation_context: resolvedActiveContext,
    situation_evidence_selection: selection,
    answer_text: distillationBundle.terminalText,
    reasoning_snapshot: distillationBundle.snapshot,
    answer_distillation: distillationBundle.distillation,
    comparison_session: null,
    voice_live_handoff: voiceLiveHandoff,
    binding_repair: bindingRepair,
  };
}
