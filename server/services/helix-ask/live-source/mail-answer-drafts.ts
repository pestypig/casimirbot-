import { readAskTurnArtifactPayloadRecord } from "../artifact-text";
import { readAskTurnString } from "../value-readers";
import {
  latestStagePlayProcessedMailPacketRecordFromArtifacts,
  readAskTurnLiveEnvironmentObservationRecord,
  readStagePlayProcessedMailPacketRecommendedNext,
  stagePlayProcessedMailPacketHasSatisfyingContent,
  type AskTurnLiveSourceArtifactLike,
} from "./mail-observation-readers";

export type StagePlayMailVoiceCalloutCandidate = {
  shouldRequest: boolean;
  draft: string | null;
  reasonCodes: string[];
  rationale: string;
};

export const stagePlayWatchPolicyWantsTextForEveryMailBatch = (policy: Record<string, unknown> | null): boolean => {
  if (!policy) return false;
  const interpretationMode = readAskTurnString(policy.interpretationMode ?? policy.interpretation_mode);
  if (interpretationMode) return interpretationMode === "latest_scene_answer";
  const objective = readAskTurnString(policy.objectiveText ?? policy.objective_text) ?? "";
  const decisionPolicy = readAskTurnString(policy.decisionPolicyPrompt ?? policy.decision_policy_prompt) ?? "";
  const importanceCriteria = Array.isArray(policy.importanceCriteria ?? policy.importance_criteria)
    ? (policy.importanceCriteria ?? policy.importance_criteria) as unknown[]
    : [];
  const policyText = [
    objective,
    decisionPolicy,
    ...importanceCriteria.map((entry) => String(entry ?? "")),
  ].join("\n");
  return (
    /\beach\s+(?:new\s+)?(?:visual-summary\s+)?mail\s+batch\b/i.test(policyText) ||
    /\bany\s+new\s+visual-summary\s+mail\s+batch\b/i.test(policyText) ||
    /\brecord\s+draft_text_answer\b/i.test(policyText)
  );
};

export const compactStagePlayMailSummarySentence = (text: string): string => {
  const clean = text
    .replace(/\*\*/g, "")
    .replace(/[`#*_>~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "the latest visual summary contains a compact observation";
  const firstSentence = clean.match(/^(.+?[.!?])(?:\s|$)/)?.[1]?.trim() ?? clean;
  return firstSentence.length > 220 ? `${firstSentence.slice(0, 217).trim()}...` : firstSentence;
};

export const collectStagePlayMailBatchSummaries = (items: Record<string, unknown>[]): string[] =>
  items
    .map((item) => {
      const summary = item.summary && typeof item.summary === "object" && !Array.isArray(item.summary)
        ? item.summary as Record<string, unknown>
        : null;
      return readAskTurnString(summary?.text) ?? readAskTurnString(summary?.preview);
    })
    .filter((entry): entry is string => Boolean(entry));

export const buildStagePlayMailBatchTextAnswerDraft = (items: Record<string, unknown>[]): string => {
  const summaries = collectStagePlayMailBatchSummaries(items);
  const summary = compactStagePlayMailSummarySentence(summaries.at(-1) ?? summaries[0] ?? "");
  return `The latest visual-summary mail reports ${summary.replace(/[.!?]+$/, "")}.`;
};

export const buildStagePlayMailVoiceCalloutCandidate = (
  items: Record<string, unknown>[],
): StagePlayMailVoiceCalloutCandidate => {
  const summaries = collectStagePlayMailBatchSummaries(items);
  const joined = summaries.join(" ");
  const reasonCodes: string[] = [];
  const hasDanger =
    /\b(?:danger|hostile|mob|creeper|zombie|skeleton|spider|enemy|attacking|attack|combat|fight|fighting|damage|damaged|taking\s+damage|low\s+health|lava|falling|drowning)\b/i.test(joined);
  const hasHostileMob =
    /\b(?:hostile\s+mob|creeper|zombie|skeleton|spider|enemy)\b/i.test(joined);
  const hasFire =
    /\b(?:on\s+fire|burning|fire|flames?|ablaze)\b/i.test(joined);
  const hasRareResource =
    /\b(?:diamond|diamonds|emerald|ancient\s+debris|netherite|rare\s+resource|valuable\s+item|ore)\b/i.test(joined);
  const hasMajorTransition =
    /\b(?:moves?\s+(?:outside|indoors|underground)|returns?\s+to\s+(?:base|inventory|chest)|scene\s+changes?|major\s+transition|switches?\s+(?:scene|window|area)|enters?\s+(?:cave|nether|village|stronghold)|leaves?\s+(?:base|cave|building))\b/i.test(joined);
  const routineOnly =
    !hasDanger &&
    !hasFire &&
    !hasRareResource &&
    !hasMajorTransition &&
    /\b(?:inventory|chest|base|interior|stable|same|routine\s+walking|walking)\b/i.test(joined);
  if (hasFire) reasonCodes.push("minecraft_fire_or_damage_cue");
  if (hasDanger) reasonCodes.push("minecraft_visible_danger_cue");
  if (hasRareResource) reasonCodes.push("minecraft_rare_resource_cue");
  if (hasMajorTransition) reasonCodes.push("major_scene_transition_cue");
  if (routineOnly) reasonCodes.push("routine_or_stable_scene_suppressed");
  if (hasFire) {
    return {
      shouldRequest: true,
      draft: "The player appears to be on fire or taking damage; watch for recovery or combat.",
      reasonCodes,
      rationale: "The visual-summary mail contains fire/damage cues, so the commentary policy should request a short provisional voice callout.",
    };
  }
  if (hasHostileMob) {
    return {
      shouldRequest: true,
      draft: "Hostile mob appeared near the player.",
      reasonCodes,
      rationale: "The visual-summary mail contains hostile-mob cues, so the commentary policy should request a short provisional voice callout.",
    };
  }
  if (hasDanger) {
    return {
      shouldRequest: true,
      draft: "A visible danger or combat cue appeared; watch for recovery, avoidance, or combat.",
      reasonCodes,
      rationale: "The visual-summary mail contains danger/combat cues, so the commentary policy should request a short provisional voice callout.",
    };
  }
  if (hasRareResource) {
    return {
      shouldRequest: true,
      draft: "A valuable resource appears to be visible; watch whether the player collects or uses it.",
      reasonCodes,
      rationale: "The visual-summary mail contains rare-resource cues, so the commentary policy should request a short provisional voice callout.",
    };
  }
  if (hasMajorTransition) {
    return {
      shouldRequest: true,
      draft: "The scene appears to shift to a new activity or area; watch what the player does next.",
      reasonCodes,
      rationale: "The visual-summary mail contains a major scene-transition cue, so the commentary policy should request a short provisional voice callout.",
    };
  }
  return {
    shouldRequest: false,
    draft: null,
    reasonCodes,
    rationale: routineOnly
      ? "The visual-summary mail looks routine or stable, so voice should be suppressed."
    : "No configured voice-callout salience cue was detected in the visual-summary mail.",
  };
};

export const formatStagePlayMailUserRelevantMeaning = (summary: string): string => {
  const clean = summary.replace(/\s+/g, " ").trim();
  if (!clean) return "The latest live-source mail contains a compact visual observation.";
  const sentence = clean.replace(/[.!?]+$/, "");
  if (
    /^(?:the\s+)?(?:live\s+)?(?:frame|scene|source|visual|screen|interface)\b/i.test(sentence) ||
    /^(?:the\s+)?(?:displayed|current)\s+(?:live\s+)?(?:frame|scene|source|visual|screen|interface)\b/i.test(sentence)
  ) {
    return `${sentence}.`;
  }
  const object = /^(?:a|an|the)\s+/i.test(sentence)
    ? sentence.charAt(0).toLowerCase() + sentence.slice(1)
    : sentence;
  return `The visual source shows ${object}.`;
};

export const buildStagePlayMailBatchInterpretationPayload = (
  items: Record<string, unknown>[],
): Record<string, unknown> => {
  const mailIds = items
    .map((item) => readAskTurnString(item.mailId ?? item.mail_id))
    .filter((entry): entry is string => Boolean(entry));
  const summaries = collectStagePlayMailBatchSummaries(items);
  const currentSceneSummary = compactStagePlayMailSummarySentence(summaries.at(-1) ?? summaries[0] ?? "");
  const joined = summaries.join(" ");
  const watchTargets = Array.from(new Set(
    Array.from(joined.matchAll(/\b(?:window|screen|tab|menu|button|icon|app|grid|player|mob|cat|book|table|mountain|waterfall|scene|source|content)\b/gi))
      .map((match) => match[0].toLowerCase())
  )).slice(0, 5);
  const activeWindowOrScene =
    /\b(?:app|icon|grid|launcher|browser|window|screen|desktop)\b/i.test(joined)
      ? "app or screen navigation scene"
      : /\b(?:minecraft|player|mob|cat|mountain|waterfall|book)\b/i.test(joined)
        ? "game-like visual scene"
        : "live-source visual scene";
  return {
    currentSceneSummary,
    runningStorySummary: `Latest visual mail interpretation: ${currentSceneSummary}`,
    setting: "visual live source",
    activeWindowOrScene,
    entities: [],
    objects: watchTargets,
    activities: ["compact visual mail interpretation"],
    userRelevantMeaning: formatStagePlayMailUserRelevantMeaning(currentSceneSummary),
    meaningfulChanges: summaries.map((summary) => compactStagePlayMailSummarySentence(summary)).slice(-12),
    uncertainties: ["This interpretation is based on compact visual-summary mail, not raw image data."],
    watchNextTargets: watchTargets.length > 0 ? watchTargets : ["next compact source summary"],
    watchNextReason: "Watch for a change in active window, opened app, visible scene, or new content replacing the current view.",
    predictionText: "The next mail batch should clarify whether the visible source remains stable or changes to a new active scene.",
    predictionHorizon: "next_mail",
    predictionConfidence: 0.45,
    validationSignals: ["next mail summary reports same visual state", "next mail summary reports opened app, window change, or new content"],
    mailCoverage: {
      readMailIds: mailIds,
      interpretedMailIds: mailIds,
      compressedMailIds: mailIds.length > 1 ? mailIds : [],
      skippedMailIds: [],
      mode:
        mailIds.length <= 1
          ? "latest_only"
          : mailIds.length <= 5
            ? "chronological_batch"
            : "micro_batch",
      reason:
        mailIds.length <= 1
          ? "Single mail item interpreted as the latest observation."
          : "Multiple unread mail items interpreted as a time-ordered observation batch.",
    },
  };
};

const readHelixRuntimeStringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((entry) => String(entry ?? "").trim()).filter(Boolean)
    : [];

const readHelixRuntimeRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const readLiveEnvironmentToolObservationPayload = (
  artifact: AskTurnLiveSourceArtifactLike,
): Record<string, unknown> | null => {
  if (artifact.kind !== "live_environment_tool_observation") return null;
  return readAskTurnArtifactPayloadRecord(artifact);
};

export const formatHelixRuntimeProcessedMailList = (
  values: string[],
  fallback: string,
  max = 4,
): string => {
  const unique = Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
  if (unique.length === 0) return `- ${fallback}`;
  const visible = unique.slice(0, max).map((value) => `- ${value}`);
  if (unique.length > max) {
    visible.push(`- ${unique.length - max} more item(s) preserved in processed-mail packet evidence.`);
  }
  return visible.join("\n");
};

export const formatHelixRuntimeProcessedMailPrediction = (
  packet: Record<string, unknown>,
  narrativeState: Record<string, unknown> | null,
): string => {
  const predictionValidation = readHelixRuntimeRecord(packet.predictionValidation ?? packet.prediction_validation);
  if (predictionValidation) {
    const result = readAskTurnString(predictionValidation.result) ?? "unresolved";
    const supportedSignals = readHelixRuntimeStringList(predictionValidation.supportedSignals ?? predictionValidation.supported_signals);
    const contradictedSignals = readHelixRuntimeStringList(predictionValidation.contradictedSignals ?? predictionValidation.contradicted_signals);
    const newSignals = readHelixRuntimeStringList(predictionValidation.newSignals ?? predictionValidation.new_signals);
    return [
      `- Prior prediction validation: ${result.replace(/_/g, " ")}.`,
      supportedSignals.length > 0 ? `- Supported by: ${supportedSignals.slice(0, 3).join("; ")}.` : "",
      contradictedSignals.length > 0 ? `- Contradicted by: ${contradictedSignals.slice(0, 3).join("; ")}.` : "",
      newSignals.length > 0 ? `- New signals: ${newSignals.slice(0, 3).join("; ")}.` : "",
    ].filter(Boolean).join("\n");
  }

  const narrativePrediction = readHelixRuntimeRecord(narrativeState?.prediction);
  const predictionText = readAskTurnString(narrativePrediction?.text);
  if (predictionText) return `- ${predictionText}`;

  const priorPredictionRef = readAskTurnString(packet.priorPredictionRef ?? packet.prior_prediction_ref);
  return priorPredictionRef
    ? `- Prior prediction ${priorPredictionRef} was not resolved by this processed packet.`
    : "- No prior prediction was validated in this processed packet.";
};

export const latestHelixRuntimeLiveEnvironmentToolObservation = (
  artifacts: AskTurnLiveSourceArtifactLike[],
  toolName: string,
): Record<string, unknown> | null => {
  const artifact = [...artifacts].reverse().find((entry) => {
    if (entry.kind !== "live_environment_tool_observation") return false;
    const payload = readLiveEnvironmentToolObservationPayload(entry);
    return readAskTurnString(payload?.tool_name) === toolName;
  }) ?? null;
  return artifact ? readAskTurnLiveEnvironmentObservationRecord(artifact) : null;
};

export const formatHelixRuntimeProcessedMailLoop = (
  artifacts: AskTurnLiveSourceArtifactLike[],
): string => {
  const continuationArtifact = [...artifacts].reverse().find((artifact) => artifact.kind === "stage_play_mail_loop_checkpoint_continuation");
  const payload = continuationArtifact ? readAskTurnArtifactPayloadRecord(continuationArtifact) : null;
  const continuationPayload = readHelixRuntimeRecord(payload?.stage_play_mail_loop_checkpoint_continuation ?? payload);
  const continuation = readHelixRuntimeRecord(continuationPayload?.continuation);
  const loopState =
    readAskTurnString(continuationPayload?.loop_state ?? continuationPayload?.loopState) ??
    readAskTurnString(continuation?.next_loop_state ?? continuation?.nextLoopState) ??
    "armed_for_next_summary";
  const continuationState =
    readAskTurnString(continuation?.state) ??
    readAskTurnString(continuationPayload?.continuation_state ?? continuationPayload?.continuationState);
  const continuationReason =
    readAskTurnString(continuation?.reason) ??
    readAskTurnString(continuationPayload?.continuation_reason ?? continuationPayload?.continuationReason);
  const unreadRetained =
    Number.isFinite(Number(continuationPayload?.unread_retained))
      ? Number(continuationPayload?.unread_retained)
      : Number.isFinite(Number(continuationPayload?.unreadRetained))
        ? Number(continuationPayload?.unreadRetained)
        : null;
  const lines = [
    loopState === "armed_for_next_summary" || /\barmed\b/i.test(loopState)
      ? "Armed for next update."
      : `Loop state: ${loopState.replace(/_/g, " ")}.`,
  ];
  if (continuationState) {
    lines.push(`Continuation ${continuationState.replace(/_/g, " ")}${continuationReason ? ` (${continuationReason.replace(/_/g, " ")})` : ""}.`);
  }
  if (unreadRetained !== null && unreadRetained > 0) {
    lines.push(`Unread retained: ${unreadRetained}.`);
  }
  return lines.join(" ");
};

export const formatHelixRuntimeCriteriaSummary = (
  profile: Record<string, unknown> | null,
): string => {
  const salienceCriteria = readHelixRuntimeStringList(profile?.salienceCriteria ?? profile?.salience_criteria);
  const suppressCriteria = readHelixRuntimeStringList(profile?.suppressCriteria ?? profile?.suppress_criteria);
  const riskCriteria = readHelixRuntimeStringList(profile?.riskCriteria ?? profile?.risk_criteria);
  const opportunityCriteria = readHelixRuntimeStringList(profile?.opportunityCriteria ?? profile?.opportunity_criteria);
  const voiceCriteria = readHelixRuntimeStringList(profile?.voiceCalloutCriteria ?? profile?.voice_callout_criteria);
  const lines = [
    salienceCriteria.length > 0 ? `Salience: ${salienceCriteria.slice(0, 3).join("; ")}` : "",
    suppressCriteria.length > 0 ? `Suppress: ${suppressCriteria.slice(0, 3).join("; ")}` : "",
    riskCriteria.length > 0 ? `Risk: ${riskCriteria.slice(0, 3).join("; ")}` : "",
    opportunityCriteria.length > 0 ? `Opportunity: ${opportunityCriteria.slice(0, 3).join("; ")}` : "",
    voiceCriteria.length > 0 ? `Voice: ${voiceCriteria.slice(0, 3).join("; ")}` : "",
  ].filter(Boolean);
  return lines.length > 0 ? lines.join("\n") : "No explicit criteria were configured.";
};

export const formatStagePlayAnswerList = (values: string[]): string => {
  const unique = Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
  if (unique.length === 0) return "";
  if (unique.length === 1) return unique[0] ?? "";
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
};

const stripTerminalPunctuation = (value: string): string =>
  value.trim().replace(/[.!?]+$/g, "");

const normalizeStagePlayNarrativeTerminalMeaning = (value: string): string =>
  value
    .replace(/\bThe visual source appears to show\s+(the\s+)?(live\s+frame|displayed\s+live\s+frame|current\s+live\s+frame|scene|screen|interface)\b/i, (_match, article, noun) =>
      `The ${String(noun ?? "").toLowerCase()}`
    )
    .replace(/\s+/g, " ")
    .trim();

export const formatStagePlayNarrativeTerminalAnswer = (input: {
  narrativeState: Record<string, unknown> | null;
  rationale?: string | null;
}): string => {
  const narrativeState = input.narrativeState;
  const interpretedSituation =
    narrativeState?.interpretedSituation && typeof narrativeState.interpretedSituation === "object" && !Array.isArray(narrativeState.interpretedSituation)
      ? (narrativeState.interpretedSituation as Record<string, unknown>)
      : null;
  const watchNext =
    narrativeState?.watchNext && typeof narrativeState.watchNext === "object" && !Array.isArray(narrativeState.watchNext)
      ? (narrativeState.watchNext as Record<string, unknown>)
      : null;
  const prediction =
    narrativeState?.prediction && typeof narrativeState.prediction === "object" && !Array.isArray(narrativeState.prediction)
      ? (narrativeState.prediction as Record<string, unknown>)
      : null;
  const mailCoverage =
    narrativeState?.mailCoverage && typeof narrativeState.mailCoverage === "object" && !Array.isArray(narrativeState.mailCoverage)
      ? (narrativeState.mailCoverage as Record<string, unknown>)
      : narrativeState?.mail_coverage && typeof narrativeState.mail_coverage === "object" && !Array.isArray(narrativeState.mail_coverage)
        ? (narrativeState.mail_coverage as Record<string, unknown>)
        : null;
  const userRelevantMeaning =
    readAskTurnString(interpretedSituation?.userRelevantMeaning) ??
    input.rationale ??
    readAskTurnString(narrativeState?.currentSceneSummary) ??
    "Interpretation recorded for the latest live-source mail batch.";
  const terminalMeaning = normalizeStagePlayNarrativeTerminalMeaning(userRelevantMeaning);
  const watchReason = readAskTurnString(watchNext?.reason);
  const predictionText = readAskTurnString(prediction?.text);
  const currentSceneSummary = readAskTurnString(narrativeState?.currentSceneSummary);
  const coverageMode = readAskTurnString(mailCoverage?.mode);
  const interpretedMailIds = Array.isArray(mailCoverage?.interpretedMailIds)
    ? mailCoverage.interpretedMailIds.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
    : [];
  const checkpointLead = coverageMode && interpretedMailIds.length > 1
    ? `I interpreted the current ${coverageMode.replace(/_/g, " ")} mail batch`
    : "I interpreted the current live-source mail checkpoint";
  const sceneClause = currentSceneSummary
    ? ` as ${stripTerminalPunctuation(currentSceneSummary)}`
    : ` as ${stripTerminalPunctuation(terminalMeaning)}`;
  const interpretationClause = terminalMeaning && currentSceneSummary && terminalMeaning !== currentSceneSummary
    ? ` The checkpoint meaning is: ${stripTerminalPunctuation(terminalMeaning)}.`
    : "";
  const predictionClause = predictionText
    ? ` Prediction: ${stripTerminalPunctuation(predictionText)}.`
    : "";
  const watchClause = watchReason
    ? ` Watch next for ${stripTerminalPunctuation(watchReason).replace(/^watch\s+(?:next\s+)?for\s+/i, "")}.`
    : "";
  return `${checkpointLead}${sceneClause}.${interpretationClause}${predictionClause}${watchClause}`.replace(/\s+/g, " ").trim();
};

export const buildHelixRuntimeProcessedMailTerminalText = (args: {
  packet: Record<string, unknown>;
  decision?: Record<string, unknown> | null;
  narrativeState?: Record<string, unknown> | null;
  artifacts?: AskTurnLiveSourceArtifactLike[];
}): string => {
  const packet = args.packet;
  const decision = args.decision ?? null;
  const narrativeState = args.narrativeState ?? null;
  const recommendedNext =
    readStagePlayProcessedMailPacketRecommendedNext(packet) ??
    readAskTurnString(decision?.decision)?.toLowerCase() ??
    "record_interpretation";
  const salience = readHelixRuntimeRecord(packet.salience);
  const salienceLevel = readAskTurnString(salience?.level) ?? "unknown";
  const salienceReasons = readHelixRuntimeStringList(salience?.reasons);
  const observedFacts = readHelixRuntimeStringList(packet.observedFacts ?? packet.observed_facts);
  const inferredFacts = readHelixRuntimeStringList(packet.inferredFacts ?? packet.inferred_facts);
  const changedFacts = readHelixRuntimeStringList(packet.changedFacts ?? packet.changed_facts);
  const uncertainties = readHelixRuntimeStringList(packet.uncertainties);
  const watchNext = readHelixRuntimeStringList(packet.watchNext ?? packet.watch_next);
  const interpretedSituation = readHelixRuntimeRecord(narrativeState?.interpretedSituation ?? narrativeState?.interpreted_situation);
  const narrativeMeaning = readAskTurnString(interpretedSituation?.userRelevantMeaning ?? interpretedSituation?.user_relevant_meaning);
  const rationale = readAskTurnString(decision?.rationalePreview ?? decision?.rationale_preview);
  const voiceCalloutDraft = readHelixRuntimeRecord(decision?.voiceCalloutDraft ?? decision?.voice_callout_draft);
  const decisionId = readAskTurnString(decision?.decisionId ?? decision?.decision_id);
  const packetId = readAskTurnString(packet.packetId ?? packet.packet_id);
  const voiceDraft =
    readAskTurnString(salience?.calloutDraft ?? salience?.callout_draft) ??
    readAskTurnString(voiceCalloutDraft?.text);
  const voiceEligible = voiceCalloutDraft && typeof voiceCalloutDraft.voiceEligible === "boolean"
    ? voiceCalloutDraft.voiceEligible
    : null;
  const requiresConfirmation = voiceCalloutDraft && typeof voiceCalloutDraft.requiresConfirmation === "boolean"
    ? voiceCalloutDraft.requiresConfirmation
    : null;
  const voiceObservation = latestHelixRuntimeLiveEnvironmentToolObservation(
    args.artifacts ?? [],
    "live_env.request_interim_voice_callout",
  );
  const voiceReceipt = readHelixRuntimeRecord(voiceObservation?.receipt);
  const voiceReceiptStatus = readAskTurnString(voiceReceipt?.status);
  const voicePolicyReason =
    readAskTurnString(decision?.voicePolicyReason ?? decision?.voice_policy_reason) ??
    readAskTurnString(voiceCalloutDraft?.reason);
  const loopText = formatHelixRuntimeProcessedMailLoop(args.artifacts ?? []);

  if (recommendedNext === "request_voice_callout") {
    const voiceStatus = voiceReceiptStatus
      ? (
          voiceReceiptStatus === "delivered"
            ? "voice requested and delivered"
            : voiceReceiptStatus === "awaiting_client_playback" || voiceReceiptStatus === "queued" || voiceReceiptStatus === "queued_for_retry"
              ? "voice requested"
              : `voice blocked: ${voiceReceiptStatus.replace(/_/g, " ")}`
        )
      : readAskTurnString(decision?.decision) === "request_voice_callout"
        ? requiresConfirmation
          ? "voice held: confirmation required"
          : voiceEligible === false
            ? "voice blocked by policy"
            : "voice held: voice tool not called yet"
        : "voice skipped: deferred pending Ask decision";
    return [
      "Processed mail identified a high-salience voice candidate:",
      `"${voiceDraft ?? "No callout draft was recorded in the processed packet."}"`,
      packetId ? `Packet: ${packetId}` : "",
      decisionId ? `Decision: ${decisionId}` : "",
      "",
      "Voice status:",
      voiceStatus,
      voicePolicyReason ? `Policy: ${voicePolicyReason}.` : "",
      salienceReasons.length > 0 ? `Reason: ${salienceReasons.slice(0, 3).join("; ")}` : "",
      "",
      "Loop:",
      loopText,
    ].filter((line) => line !== "").join("\n");
  }

  if (recommendedNext === "wait_for_next_summary") {
    const predictionValidation = readHelixRuntimeRecord(packet.predictionValidation ?? packet.prediction_validation);
    const validationResult = readAskTurnString(predictionValidation?.result);
    const reason =
      salienceReasons.at(0) ??
      (validationResult === "supported" ? "prediction supported" : null) ??
      (salienceLevel === "low" ? "salience low / stable scene" : null) ??
      rationale ??
      "no user-facing change was selected";
    return [
      "Processed mail did not require a user-facing update.",
      packetId ? `Packet: ${packetId}` : "",
      decisionId ? `Decision: ${decisionId}` : "",
      `Reason: ${reason}.`,
      "",
      "Loop remains armed.",
      loopText,
    ].join("\n");
  }

  const cautiousInterpretation = [
    ...(narrativeMeaning ? [narrativeMeaning] : []),
    ...inferredFacts,
    ...(changedFacts.length > 0 ? [`Changed: ${changedFacts.slice(0, 3).join("; ")}`] : []),
    ...(salienceReasons.length > 0 ? [`Salience ${salienceLevel}: ${salienceReasons.slice(0, 3).join("; ")}`] : []),
    ...(rationale ? [rationale] : []),
  ];
  return [
    "Checkpoint:",
    [
      packetId ? `- Packet: ${packetId}` : "",
      decisionId ? `- Decision: ${decisionId}` : "- Decision: clear packet checkpoint / no decision required.",
    ].filter(Boolean).join("\n"),
    "",
    "Observed:",
    formatHelixRuntimeProcessedMailList(observedFacts, "No observed facts were recorded in the processed packet."),
    "",
    "Cautious interpretation:",
    formatHelixRuntimeProcessedMailList(cautiousInterpretation, "No interpretation was recorded beyond the processed-mail receipt."),
    uncertainties.length > 0
      ? [
          "",
          "Uncertainties:",
          formatHelixRuntimeProcessedMailList(uncertainties, "none recorded"),
        ].join("\n")
      : "",
    "",
    "Prediction:",
    formatHelixRuntimeProcessedMailPrediction(packet, narrativeState),
    "",
    "Watch next:",
    formatHelixRuntimeProcessedMailList(watchNext, "No watch-next target was recorded in the processed packet."),
    "",
    "Loop:",
    loopText,
  ].filter((line) => line !== "").join("\n");
};

export const buildHelixRuntimeLiveSourceMailFallbackText = (args: {
  prompt?: string | null;
  artifacts: AskTurnLiveSourceArtifactLike[];
}): string => {
  const latestProcessedPacket = latestStagePlayProcessedMailPacketRecordFromArtifacts(args.artifacts);
  const liveToolArtifacts = [...args.artifacts]
    .reverse()
    .filter((artifact) => artifact.kind === "live_environment_tool_observation");
  const decisionToolArtifact = liveToolArtifacts.find((artifact) => {
    const payload = readLiveEnvironmentToolObservationPayload(artifact);
    if (readAskTurnString(payload?.tool_name) !== "live_env.record_live_source_mail_decision") return false;
    const record = readAskTurnLiveEnvironmentObservationRecord(artifact);
    if (!record) return false;
    return (
      readAskTurnString(record.artifactId) === "stage_play_live_source_mail_decision" ||
      readAskTurnString(record.schemaVersion) === "stage_play_live_source_mail_decision/v1" ||
      Boolean(readAskTurnString(record.decisionId))
    );
  }) ?? null;
  if (decisionToolArtifact) {
    const payload = readLiveEnvironmentToolObservationPayload(decisionToolArtifact);
    const observation = readAskTurnLiveEnvironmentObservationRecord(decisionToolArtifact);
    if (!observation) return "";
    const decision = readAskTurnString(observation.decision) ?? "record_interpretation";
    const rationale = readAskTurnString(observation.rationalePreview) ?? readAskTurnString(payload?.summary);
    const nextLoopState = readAskTurnString(observation.nextLoopState) ?? "unknown";
    const mailIds = Array.isArray(observation.mailIds)
      ? observation.mailIds.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
      : [];
    const textAnswerDraft =
      observation.textAnswerDraft && typeof observation.textAnswerDraft === "object" && !Array.isArray(observation.textAnswerDraft)
        ? (observation.textAnswerDraft as Record<string, unknown>)
        : null;
    const narrativeState =
      observation.narrativeState && typeof observation.narrativeState === "object" && !Array.isArray(observation.narrativeState)
        ? (observation.narrativeState as Record<string, unknown>)
        : observation.narrative_state && typeof observation.narrative_state === "object" && !Array.isArray(observation.narrative_state)
          ? (observation.narrative_state as Record<string, unknown>)
          : null;
    const voiceCalloutDraft =
      observation.voiceCalloutDraft && typeof observation.voiceCalloutDraft === "object" && !Array.isArray(observation.voiceCalloutDraft)
        ? (observation.voiceCalloutDraft as Record<string, unknown>)
        : null;
    const textDraft = readAskTurnString(textAnswerDraft?.text);
    const voiceDraft = readAskTurnString(voiceCalloutDraft?.text);
    if (latestProcessedPacket && stagePlayProcessedMailPacketHasSatisfyingContent(latestProcessedPacket)) {
      return buildHelixRuntimeProcessedMailTerminalText({
        packet: latestProcessedPacket,
        decision: observation,
        narrativeState,
        artifacts: args.artifacts,
      });
    }
    if (decision === "draft_text_answer" && textDraft) {
      return textDraft;
    }
    if (decision === "record_interpretation") {
      return formatStagePlayNarrativeTerminalAnswer({
        narrativeState,
        rationale,
      });
    }
    if (decision === "request_voice_callout") {
      return voiceDraft
        ? voiceDraft
        : "Voice callout requested; voice delivery is waiting on policy confirmation or a voice receipt.";
    }
    if (decision === "request_stage_play_checkpoint") {
      const requestedTool =
        observation.requestedTool && typeof observation.requestedTool === "object" && !Array.isArray(observation.requestedTool)
          ? (observation.requestedTool as Record<string, unknown>)
          : observation.requested_tool && typeof observation.requested_tool === "object" && !Array.isArray(observation.requested_tool)
            ? (observation.requested_tool as Record<string, unknown>)
            : null;
      const requestedToolName = readAskTurnString(requestedTool?.toolName ?? requestedTool?.tool_name);
      return requestedToolName
        ? `Stage Play checkpoint requested via ${requestedToolName}; loop state ${nextLoopState}.`
        : `Stage Play checkpoint requested; loop state ${nextLoopState}.`;
    }
    const promptWantsStatus = /\b(?:status|state|waiting|stand(?:ing)?\s+by|armed|queued|pending|loop|mailbox|check|read|latest|unread)\b/i.test(args.prompt ?? "");
    if (decision === "wait_for_next_summary" && !promptWantsStatus) {
      return rationale || "No user-facing live-source update was selected for this mail check.";
    }
    if (decision === "wait_for_next_summary") {
      return mailIds.length === 0
        ? "No unread live-source updates were available at this check. The live-source mailbox is still armed for the next source update."
        : "Waiting for next summary. The live-source mailbox remains armed for the next source update.";
    }
    const lines = [
      `Live-source mail decision recorded: ${decision}.`,
      rationale ? `Reason: ${rationale}` : "",
      mailIds.length > 0 ? `Mail read: ${formatStagePlayAnswerList(mailIds.slice(0, 3))}.` : "No unread live-source updates were available at this check. The live-source mailbox is still armed for the next source update.",
      `Loop state: ${nextLoopState}.`,
    ];
    if (decision === "wait_for_next_summary") {
      lines.push("No user-facing callout was selected; standing by for the next source update.");
    } else if (decision === "draft_text_answer" && textDraft) {
      lines.push(`Text draft: ${textDraft}`);
    } else if (decision === "request_voice_callout" && voiceDraft) {
      lines.push(`Voice callout draft: ${voiceDraft}`);
    } else if (decision === "request_more_evidence") {
      lines.push("More compact live-source evidence is needed before an answer or callout should be produced.");
    } else if (decision === "request_stage_play_checkpoint") {
      lines.push("A Stage Play checkpoint should consume this decision before a reviewed answer snapshot is produced.");
    } else if (decision === "fail_closed") {
      lines.push("The live-source mail loop failed closed for this turn.");
    }
    return lines.filter(Boolean).join("\n");
  }

  const interpreterProfileToolArtifact = liveToolArtifacts.find((artifact) => {
    const payload = readLiveEnvironmentToolObservationPayload(artifact);
    if (readAskTurnString(payload?.tool_name) !== "live_env.configure_interpreter_profile") return false;
    const observation = payload?.observation;
    if (!observation || typeof observation !== "object" || Array.isArray(observation)) return false;
    const record = observation as Record<string, unknown>;
    const profile =
      record.profile && typeof record.profile === "object" && !Array.isArray(record.profile)
        ? (record.profile as Record<string, unknown>)
        : null;
    return (
      readAskTurnString(record.artifactId) === "stage_play_interpreter_profile_config_result" ||
      readAskTurnString(record.schema) === "stage_play_interpreter_profile_config_result/v1" ||
      readAskTurnString(record.schema) === "stage_play_interpreter_profile_action_result/v1" ||
      Boolean(readAskTurnString(profile?.profileId) ?? readAskTurnString(record.interpreterProfileRef))
    );
  }) ?? null;
  if (interpreterProfileToolArtifact) {
    const payload = readLiveEnvironmentToolObservationPayload(interpreterProfileToolArtifact);
    const observation = payload?.observation && typeof payload.observation === "object" && !Array.isArray(payload.observation)
      ? (payload.observation as Record<string, unknown>)
      : null;
    const profile =
      observation?.profile && typeof observation.profile === "object" && !Array.isArray(observation.profile)
        ? (observation.profile as Record<string, unknown>)
        : null;
    const note =
      observation?.note && typeof observation.note === "object" && !Array.isArray(observation.note)
        ? (observation.note as Record<string, unknown>)
        : null;
    const profileAction = readAskTurnString(observation?.profileAction) ?? readAskTurnString(observation?.profile_action);
    const title = readAskTurnString(profile?.title) ?? "Interpreter profile";
    const status = readAskTurnString(profile?.status) ?? "active";
    const profileId = readAskTurnString(profile?.profileId) ?? readAskTurnString(observation?.interpreterProfileRef);
    const objective = readAskTurnString(profile?.objectiveText);
    const noteId = readAskTurnString(note?.noteId);
    const summary = readAskTurnString(payload?.summary);
    const criteriaSummary = formatHelixRuntimeCriteriaSummary(profile);
    if (profileAction === "pause") {
      return [
        `Interpreter profile paused: ${title}.`,
        profileId ? `Profile: ${profileId}` : "",
      ].filter(Boolean).join("\n");
    }
    if (profileAction === "archive") {
      return [
        `Interpreter profile archived: ${title}.`,
        profileId ? `Profile: ${profileId}` : "",
      ].filter(Boolean).join("\n");
    }
    if (profileAction === "open_note") {
      return [
        `Interpreter profile note opened for ${title}.`,
        noteId ? `Note: ${noteId}` : "",
        profileId ? `Profile: ${profileId}` : "",
      ].filter(Boolean).join("\n");
    }
    if (profileAction === "compile_note") {
      const ok = observation?.ok !== false;
      return ok
        ? [
            `Interpreter profile note compiled for ${title}.`,
            profileId ? `Profile: ${profileId}` : "",
          ].filter(Boolean).join("\n")
        : summary || "Interpreter profile note compile was blocked.";
    }
    if (profileAction === "select" || profileAction === "apply" || profileAction === "activate") {
      return [
        `Interpreter profile applied: ${title}.`,
        status ? `Status: ${status}.` : "",
        profileId ? `Profile: ${profileId}` : "",
      ].filter(Boolean).join("\n");
    }
    return [
      `Profile configured: ${title}.`,
      profileId ? `Profile: ${profileId}` : "",
      `Status: ${status}.`,
      objective ? `Objective: ${objective}` : "",
      "Criteria:",
      criteriaSummary,
      "No live-source mail was interpreted in this setup turn.",
    ].filter(Boolean).join("\n");
  }

  const configureToolArtifact = liveToolArtifacts.find((artifact) => {
    const payload = readLiveEnvironmentToolObservationPayload(artifact);
    if (readAskTurnString(payload?.tool_name) !== "live_env.configure_live_source_watch_job") return false;
    const observation = payload?.observation;
    if (!observation || typeof observation !== "object" || Array.isArray(observation)) return false;
    const record = observation as Record<string, unknown>;
    return (
      readAskTurnString(record.artifactId) === "stage_play_live_source_watch_job_policy_config_result" ||
      readAskTurnString(record.schema) === "stage_play_live_source_watch_job_policy_config_result/v1" ||
      Boolean(readAskTurnString(record.watchJobPolicyRef) ?? readAskTurnString(record.watch_job_policy_ref))
    );
  }) ?? null;
  if (configureToolArtifact) {
    const payload = readLiveEnvironmentToolObservationPayload(configureToolArtifact);
    const observation = payload?.observation && typeof payload.observation === "object" && !Array.isArray(payload.observation)
      ? (payload.observation as Record<string, unknown>)
      : null;
    const policy =
      observation?.policy && typeof observation.policy === "object" && !Array.isArray(observation.policy)
        ? (observation.policy as Record<string, unknown>)
        : null;
    const jobState =
      observation?.jobState && typeof observation.jobState === "object" && !Array.isArray(observation.jobState)
        ? (observation.jobState as Record<string, unknown>)
        : observation?.job_state && typeof observation.job_state === "object" && !Array.isArray(observation.job_state)
          ? (observation.job_state as Record<string, unknown>)
          : null;
    const objective = readAskTurnString(policy?.objectiveText);
    const policyRef =
      readAskTurnString(observation?.watchJobPolicyRef) ??
      readAskTurnString(observation?.watch_job_policy_ref) ??
      readAskTurnString(policy?.policyId);
    const nextLoopState =
      readAskTurnString(jobState?.nextLoopState ?? jobState?.next_loop_state) ??
      readAskTurnString(policy?.status) ??
      "armed";
    return [
      "Watch job configured and armed.",
      policyRef ? `Policy: ${policyRef}` : "",
      objective ? `Objective: ${objective}` : "",
      `Loop state: ${nextLoopState.replace(/_/g, " ")}.`,
      "No live-source mail was interpreted in this setup turn.",
    ].filter(Boolean).join("\n");
  }

  const readToolArtifact = liveToolArtifacts.find((artifact) => {
    const payload = readLiveEnvironmentToolObservationPayload(artifact);
    return (
      readAskTurnString(payload?.tool_name) === "live_env.read_live_source_mail" ||
      readAskTurnString(payload?.tool_name) === "live_env.read_processed_live_source_mail" ||
      readAskTurnString(payload?.tool_name) === "live_env.process_live_source_mail" ||
      readAskTurnString(payload?.tool_name) === "live_env.check_live_source_mail"
    );
  }) ?? null;
  const readPayload = readToolArtifact ? readLiveEnvironmentToolObservationPayload(readToolArtifact) : null;
  const readObservation =
    readPayload?.observation && typeof readPayload.observation === "object" && !Array.isArray(readPayload.observation)
      ? (readPayload.observation as Record<string, unknown>)
      : null;
  if (!readObservation) return "";
  const packets = Array.isArray(readObservation.packets)
    ? readObservation.packets.filter((entry): entry is Record<string, unknown> =>
        Boolean(entry && typeof entry === "object" && !Array.isArray(entry)),
      )
    : [];
  if (packets.length > 0) {
    const packet = packets.at(-1);
    if (packet) {
      return buildHelixRuntimeProcessedMailTerminalText({
        packet,
        artifacts: args.artifacts,
      });
    }
  }
  const items = Array.isArray(readObservation.items)
    ? readObservation.items.filter((entry): entry is Record<string, unknown> =>
        Boolean(entry && typeof entry === "object" && !Array.isArray(entry)),
      )
    : [];
  if (items.length === 0) {
    return "No unread live-source updates were available at this check. The live-source mailbox is still armed for the next source update.";
  }
  const preview =
    items
      .map((item) => {
        const summary = item.summary && typeof item.summary === "object" && !Array.isArray(item.summary)
          ? (item.summary as Record<string, unknown>)
          : null;
        return readAskTurnString(summary?.preview) ?? readAskTurnString(summary?.text);
      })
      .find((entry): entry is string => Boolean(entry)) ?? null;
  return [
    `${items.length} unread live-source mail item(s) were read and require a recorded agent decision.`,
    preview ? `Latest preview: ${preview}` : "",
  ].filter(Boolean).join("\n");
};

export const latestHelixRuntimeLiveSourceMailTextAnswerDraft = (
  artifacts: AskTurnLiveSourceArtifactLike[],
): string | null => {
  const liveToolArtifacts = [...artifacts]
    .reverse()
    .filter((artifact) => artifact.kind === "live_environment_tool_observation");
  for (const artifact of liveToolArtifacts) {
    const payload = readLiveEnvironmentToolObservationPayload(artifact);
    if (readAskTurnString(payload?.tool_name) !== "live_env.record_live_source_mail_decision") continue;
    const observation = payload?.observation;
    if (!observation || typeof observation !== "object" || Array.isArray(observation)) continue;
    const record = observation as Record<string, unknown>;
    const isMailDecision =
      readAskTurnString(record.artifactId) === "stage_play_live_source_mail_decision" ||
      readAskTurnString(record.schemaVersion) === "stage_play_live_source_mail_decision/v1" ||
      Boolean(readAskTurnString(record.decisionId));
    if (!isMailDecision) continue;
    if (readAskTurnString(record.decision) !== "draft_text_answer") continue;
    const textAnswerDraft =
      record.textAnswerDraft && typeof record.textAnswerDraft === "object" && !Array.isArray(record.textAnswerDraft)
        ? (record.textAnswerDraft as Record<string, unknown>)
        : null;
    const textDraft =
      readAskTurnString(textAnswerDraft?.text) ??
      readAskTurnString(record.text_answer_draft) ??
      readAskTurnString(record.textAnswerDraft);
    if (textDraft) return textDraft;
  }
  return null;
};

export const latestHelixRuntimeLiveSourceMailInterpretationText = (
  artifacts: AskTurnLiveSourceArtifactLike[],
): string | null => {
  const liveToolArtifacts = [...artifacts]
    .reverse()
    .filter((artifact) => artifact.kind === "live_environment_tool_observation");
  for (const artifact of liveToolArtifacts) {
    const payload = readLiveEnvironmentToolObservationPayload(artifact);
    if (readAskTurnString(payload?.tool_name) !== "live_env.record_live_source_mail_decision") continue;
    const observation = payload?.observation;
    if (!observation || typeof observation !== "object" || Array.isArray(observation)) continue;
    const record = observation as Record<string, unknown>;
    const isMailDecision =
      readAskTurnString(record.artifactId) === "stage_play_live_source_mail_decision" ||
      readAskTurnString(record.schemaVersion) === "stage_play_live_source_mail_decision/v1" ||
      Boolean(readAskTurnString(record.decisionId));
    if (!isMailDecision || readAskTurnString(record.decision) !== "record_interpretation") continue;
    const narrativeState =
      record.narrativeState && typeof record.narrativeState === "object" && !Array.isArray(record.narrativeState)
        ? (record.narrativeState as Record<string, unknown>)
        : record.narrative_state && typeof record.narrative_state === "object" && !Array.isArray(record.narrative_state)
          ? (record.narrative_state as Record<string, unknown>)
          : null;
    const interpretedSituation =
      narrativeState?.interpretedSituation && typeof narrativeState.interpretedSituation === "object" && !Array.isArray(narrativeState.interpretedSituation)
        ? (narrativeState.interpretedSituation as Record<string, unknown>)
        : null;
    const userRelevantMeaning =
      readAskTurnString(interpretedSituation?.userRelevantMeaning) ??
      readAskTurnString(record.rationalePreview) ??
      readAskTurnString(narrativeState?.currentSceneSummary);
    if (!userRelevantMeaning) continue;
    return formatStagePlayNarrativeTerminalAnswer({
      narrativeState,
      rationale: readAskTurnString(record.rationalePreview),
    });
  }
  return null;
};

export const normalizeLiveSourceMailWaitWording = (modelText: string, fallbackText: string): string => {
  if (!modelText || !/^Live-source mail decision recorded:/i.test(fallbackText.trim())) return modelText;
  if (!/\bsource update\b/i.test(fallbackText)) return modelText;
  return modelText
    .replace(/\bnext\s+visual\s+summary\b/gi, "next source update")
    .replace(/\bvisual\s+summaries\b/gi, "live-source updates")
    .replace(/\bvisual\s+summary\s+mail\b/gi, "live-source update")
    .replace(/\bnext\s+summary\b/gi, "next source update")
    .replace(/\blive-source\s+mails\b/gi, "live-source updates")
    .replace(/\blive-source\s+updates\s+or\s+live-source\s+updates\b/gi, "live-source updates");
};

export const liveSourceMailModelAnswerConflictsWithDecision = (
  modelText: string,
  fallbackText: string,
): boolean => {
  const fallback = fallbackText.trim();
  if (/^Interpreter profile\b/i.test(fallback)) {
    return (
      /^Live-source mail decision recorded:/i.test(modelText.trim()) ||
      /\b(?:mailbox|mail|live-source update|source update)\b[\s\S]{0,80}\b(?:checked|read|reviewed|processed|unavailable|no unread)\b/i.test(modelText) ||
      /\bvisual (?:evidence|capture) (?:is|was) unavailable\b/i.test(modelText)
    );
  }
  if (/^Watch job configured and armed; no mail read yet\./i.test(fallback)) {
    return (
      /\b(?:live-source\s+)?mailbox\s+(?:has\s+been|was|is)\s+(?:checked|read|reviewed|processed)\b/i.test(modelText) ||
      /\b(?:no|not any|zero)\s+(?:new\s+)?(?:mail\s+batches?|mail\s+items?|live-source\s+updates?|source\s+updates?)\b/i.test(modelText) ||
      /\b(?:currently|right now)\s+(?:there\s+(?:are|is)\s+)?no\s+(?:new\s+)?(?:mail\s+batches?|mail\s+items?|live-source\s+updates?|source\s+updates?)\b/i.test(modelText) ||
      /\b(?:mail\s+batches?|live-source\s+updates?|source\s+updates?)\s+(?:to\s+describe|available\s+to\s+describe|available\s+for\s+review)\b/i.test(modelText) ||
      /\b(?:mail|live-source\s+updates?)\s+(?:was|were)\s+unavailable\b/i.test(modelText) ||
      /\bunread\s+(?:mail|updates?)\s+(?:was|were)\s+(?:reviewed|processed|read|checked)\b/i.test(modelText)
    );
  }
  if (
    /^Observed:\s*\n/i.test(fallback) ||
    /^Processed mail identified a high-salience voice candidate:/i.test(fallback) ||
    /^Processed mail did not require a user-facing update\./i.test(fallback)
  ) {
    return (
      /\bvisual (?:evidence|capture) (?:is|was) unavailable\b/i.test(modelText) ||
      /\bprocessed live-source packet\(s\) were read and require a recorded agent decision\b/i.test(modelText) ||
      /\braw mailbox receipt\b/i.test(modelText) ||
      /\b(?:workstation process graph overview|situation context pack|focused doc answer|doc summary)\b/i.test(modelText)
    );
  }
  if (!/^Live-source mail decision recorded:/i.test(fallback)) return false;
  const fallbackDecision = fallback.match(/^Live-source mail decision recorded:\s*([a-z_]+)/i)?.[1]?.toLowerCase() ?? null;
  const modelDecision = modelText.match(/Live-source mail decision recorded:\s*([a-z_]+)/i)?.[1]?.toLowerCase() ?? null;
  if (fallbackDecision && modelDecision && fallbackDecision !== modelDecision) return true;
  const textDraft = fallback.match(/\bText draft:\s*([\s\S]+?)(?:\n(?:Voice callout draft|Loop state|Mail read|Reason):|$)/i)?.[1]?.trim() ?? "";
  if (fallbackDecision === "draft_text_answer") {
    if (/\bwait_for_next_summary\b/i.test(modelText)) return true;
    if (/\bNo unread live-source updates were available\b/i.test(modelText)) return true;
    if (/\bvisual (?:evidence|capture) (?:is|was) unavailable\b/i.test(modelText)) return true;
    const normalizedModel = modelText.replace(/\s+/g, " ").toLowerCase();
    const normalizedDraft = textDraft.replace(/\s+/g, " ").toLowerCase();
    if (normalizedDraft && !normalizedModel.includes(normalizedDraft)) return true;
  }
  const noUnreadReceipt =
    /\bNo unread live-source updates were available at this check\b/i.test(fallback) ||
    /\bMail read:\s*no unread live-source updates were available\b/i.test(fallback);
  if (noUnreadReceipt) {
    return /\b(?:latest|newest|current)\s+unread\b[\s\S]{0,80}\b(?:reviewed|processed|read|checked)\b/i.test(modelText) ||
      /\bunread\s+(?:source\s+update|live-source\s+update|live-source\s+mail|mail\s+item)\b[\s\S]{0,80}\b(?:reviewed|processed|read|checked)\b/i.test(modelText);
  }
  if (!/\b(?:unread\s+live-source\s+mail|mail\s+item\s+requiring\s+a\s+decision|decision\s+required)\b/i.test(modelText)) {
    return false;
  }
  return /\b(?:wait_for_next_summary|decision\s+recorded|loop\s+state:\s*armed_for_next_summary|armed\s+for\s+the\s+next\s+(?:summary|source\s+update))\b/i.test(
    fallbackText,
  );
};
