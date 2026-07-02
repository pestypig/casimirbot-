import {
  buildHelixRecommendedActionAdmissionV1,
  type HelixRecommendedActionAdmissionEntryV1,
  type HelixRecommendedActionAdmissionV1,
} from "../contracts/helix-recommended-action-admission.v1";
import type {
  IdeologyContextReflectionRecommendedActionV1,
  IdeologyContextReflectionV1,
} from "../ideology-context-reflection";
import type { IdeologyGraph } from "./ideology-graph-types";
import { reflectIdeologyContext } from "./reflect-ideology-context";

export type VoiceMoralGraphInput = {
  voiceEventId: string;
  transcriptOrCalloutDraft: string;
};

export type VoiceMoralGraphResult = {
  reflection: IdeologyContextReflectionV1;
  admissions: HelixRecommendedActionAdmissionV1[];
};

const VOICE_ALLOWED_ACTION_TYPES = new Set([
  "suggest_tone_adjustment",
  "show_right_speech_warning",
  "ask_for_clarification",
  "suggest_less_claim_sensitive_wording",
]);

const VOICE_SEND_ACTION_TYPES = new Set([
  "auto_speak",
  "speak_callout",
  "send_voice",
  "send_message",
  "call_external_tool",
]);

function voiceSource(reflection: IdeologyContextReflectionV1) {
  return {
    workstation: "voice",
    panel: "voice",
    tool: "moral-graph-reflection",
    artifact_type: "ideology_context_reflection",
    artifact_id: reflection.reflectionId,
  };
}

function uniqueRecommendations(
  recommendations: IdeologyContextReflectionRecommendedActionV1[],
): IdeologyContextReflectionRecommendedActionV1[] {
  const seen = new Set<string>();
  const unique: IdeologyContextReflectionRecommendedActionV1[] = [];
  for (const recommendation of recommendations) {
    const key = `${recommendation.id}:${recommendation.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(recommendation);
  }
  return unique;
}

function hasLens(reflection: IdeologyContextReflectionV1, pattern: RegExp): boolean {
  const matches = [
    ...reflection.matches.exact,
    ...reflection.matches.likely,
    ...reflection.matches.inferred_lenses,
    ...reflection.activated_traits,
  ];
  return matches.some((match) => {
    const tags = "tags" in match ? match.tags ?? [] : [];
    return pattern.test(match.nodeId) || pattern.test(match.label) || tags.some((tag) => pattern.test(tag));
  });
}

function isClaimSensitive(text: string): boolean {
  return /\b(always|never|certain|guaranteed|proven|approved|failed|must|obviously|definitely)\b/i.test(text);
}

function needsClarification(text: string, reflection: IdeologyContextReflectionV1): boolean {
  return /\b(maybe|unclear|unknown|not sure|possibly|could be)\b/i.test(text) || (reflection.claim_boundaries.missing_evidence ?? []).length > 0;
}

function buildVoiceRecommendations(reflection: IdeologyContextReflectionV1): IdeologyContextReflectionRecommendedActionV1[] {
  const recommendations: IdeologyContextReflectionRecommendedActionV1[] = [];
  const summary = reflection.input.summary;
  const matchedNode = reflection.matches.exact[0] ?? reflection.matches.likely[0] ?? reflection.matches.inferred_lenses[0];
  const rightSpeech = hasLens(reflection, /right.?speech|speech|non.?harm|restraint/i);

  if (matchedNode || rightSpeech || isClaimSensitive(summary)) {
    recommendations.push({
      id: "moral-graph.suggest_tone_adjustment",
      type: "suggest_tone_adjustment",
      label: "Suggest tone adjustment",
      description: "Suggest a voice tone adjustment that preserves evidence-only authority.",
      reasonCodes: ["voice_event", "tone_adjustment"],
    });
  }

  if (rightSpeech) {
    recommendations.push({
      id: "moral-graph.show_right_speech_warning",
      type: "show_right_speech_warning",
      label: "Show right speech warning",
      description: "Show a diagnostic warning for restraint, non-harm, and right-speech posture.",
      reasonCodes: ["voice_event", "right_speech_warning"],
    });
  }

  if (needsClarification(summary, reflection)) {
    recommendations.push({
      id: "moral-graph.ask_for_clarification",
      type: "ask_for_clarification",
      label: "Ask for clarification",
      description: "Ask for clarification before strengthening the callout.",
      reasonCodes: reflection.claim_boundaries.missing_evidence ?? ["uncertainty"],
    });
  }

  if (isClaimSensitive(summary)) {
    recommendations.push({
      id: "moral-graph.suggest_less_claim_sensitive_wording",
      type: "suggest_less_claim_sensitive_wording",
      label: "Suggest less claim-sensitive wording",
      description: "Suggest wording that lowers certainty and avoids overclaiming.",
      reasonCodes: ["voice_event", "claim_sensitive_wording"],
    });
  }

  return uniqueRecommendations(recommendations).filter((action) => VOICE_ALLOWED_ACTION_TYPES.has(action.type));
}

function baseEntry(
  reflection: IdeologyContextReflectionV1,
  recommendation: IdeologyContextReflectionRecommendedActionV1,
): Pick<
  HelixRecommendedActionAdmissionEntryV1,
  "actionId" | "panelId" | "label" | "mutatesCalculator" | "solves" | "objectiveFit" | "source" | "evidenceRefs"
> {
  return {
    actionId: recommendation.id.startsWith("moral-graph.") ? recommendation.id : `moral-graph.${recommendation.type}`,
    panelId: "voice",
    label: recommendation.label,
    mutatesCalculator: false,
    solves: false,
    objectiveFit: "high",
    source: voiceSource(reflection),
    evidenceRefs: reflection.input.refs ?? [],
  };
}

function mapVoiceRecommendation(
  reflection: IdeologyContextReflectionV1,
  recommendation: IdeologyContextReflectionRecommendedActionV1,
): HelixRecommendedActionAdmissionEntryV1 {
  const base = baseEntry(reflection, recommendation);
  const missing = reflection.claim_boundaries.missing_evidence ?? [];

  if (VOICE_SEND_ACTION_TYPES.has(recommendation.type)) {
    return {
      ...base,
      objectiveFit: "low",
      risk: "unknown",
      admission: "blocked",
      requiresConfirmation: true,
      agentExecutable: false,
      reason: "Voice MoralGraph cannot auto-speak, auto-send, or call external voice tools.",
      reasonCode: "unknown_action_not_allowlisted",
      display_policy: "hidden",
      reasonCodes: ["moral_graph_reflection", "voice_send_blocked", "evidence_only_authority"],
    };
  }

  if (
    recommendation.type === "suggest_tone_adjustment" ||
    recommendation.type === "suggest_less_claim_sensitive_wording" ||
    recommendation.type === "ask_for_clarification"
  ) {
    return {
      ...base,
      risk: "claim_sensitive",
      admission: "ask_user",
      requiresConfirmation: true,
      agentExecutable: false,
      reason: "Voice MoralGraph suggestion is claim-sensitive and requires user confirmation before any voice action.",
      reasonCode: "claim_sensitive_language",
      display_policy: "actionable",
      ...(recommendation.type === "ask_for_clarification" && missing.length > 0
        ? { evidenceRequirements: { missing } }
        : {}),
      reasonCodes: ["moral_graph_reflection", "voice_suggestion_requires_confirmation", "evidence_only_authority"],
    };
  }

  if (recommendation.type === "show_right_speech_warning") {
    return {
      ...base,
      risk: "claim_sensitive",
      admission: "auto",
      requiresConfirmation: false,
      agentExecutable: false,
      reason: "Right-speech warning is diagnostic-only and cannot speak or send the callout.",
      reasonCode: "diagnostic_only_not_executable",
      display_policy: "diagnostic_only",
      reasonCodes: ["moral_graph_reflection", "right_speech_warning", "diagnostic_overlay_only", "evidence_only_authority"],
    };
  }

  return {
    ...base,
    objectiveFit: "low",
    risk: "unknown",
    admission: "blocked",
    requiresConfirmation: true,
    agentExecutable: false,
    reason: "Voice MoralGraph recommendation type is not allowlisted.",
    reasonCode: "unknown_action_not_allowlisted",
    display_policy: "hidden",
    reasonCodes: ["moral_graph_reflection", "unknown_voice_moral_graph_action", "evidence_only_authority"],
  };
}

function buildVoiceAdmission(reflection: IdeologyContextReflectionV1): HelixRecommendedActionAdmissionV1 {
  const recommendations = buildVoiceRecommendations(reflection);
  const missing = reflection.claim_boundaries.missing_evidence ?? [];
  return buildHelixRecommendedActionAdmissionV1({
    prompt: reflection.input.summary,
    sourceReceiptId: reflection.reflectionId,
    source: voiceSource(reflection),
    evidenceRefs: reflection.input.refs ?? [],
    ...(missing.length > 0 ? { evidenceRequirements: { missing } } : {}),
    reasonCodes: ["moral_graph_reflection", "voice_adapter", "evidence_only_authority"],
    actions: recommendations.map((recommendation) => mapVoiceRecommendation(reflection, recommendation)),
  });
}

export function reflectVoiceEventWithMoralGraph(
  graph: IdeologyGraph,
  input: VoiceMoralGraphInput,
): VoiceMoralGraphResult {
  const reflection = reflectIdeologyContext(graph, {
    kind: "voice_event",
    text: input.transcriptOrCalloutDraft,
    refs: [input.voiceEventId],
  });

  return {
    reflection,
    admissions: [buildVoiceAdmission(reflection)],
  };
}
