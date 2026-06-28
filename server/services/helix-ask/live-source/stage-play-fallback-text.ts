import { readAskTurnArtifactPayloadRecord } from "../artifact-text";
import { readAskTurnString } from "../value-readers";
import { formatStagePlayAnswerList } from "./mail-answer-drafts";
import { type AskTurnLiveSourceArtifactLike } from "./mail-observation-readers";

const readLiveEnvironmentToolObservationPayload = (
  artifact: AskTurnLiveSourceArtifactLike,
): Record<string, unknown> | null => {
  if (artifact.kind !== "live_environment_tool_observation") return null;
  return readAskTurnArtifactPayloadRecord(artifact);
};
const stagePlayProjectionReasonLabel = (reason: string | null): string => {
  switch (reason) {
    case "projected":
      return "projected";
    case "no_active_environment":
      return "no active environment";
    case "environment_not_active":
      return "environment not active";
    case "line_schema_mismatch":
      return "line schema mismatch";
    case "no_line_changes":
      return "no line changes";
    case "graph_invalid":
      return "graph invalid";
    default:
      return reason || "unknown";
  }
};

const collectStagePlayMissingEvidenceLabels = (graph: Record<string, unknown> | null): string[] => {
  if (!graph) return [];
  const entries = [
    ...(Array.isArray(graph.badges) ? graph.badges : []),
    ...(Array.isArray(graph.recommendedActions) ? graph.recommendedActions : []),
  ];
  const sourceWindow = graph.sourceWindow && typeof graph.sourceWindow === "object" && !Array.isArray(graph.sourceWindow)
    ? (graph.sourceWindow as Record<string, unknown>)
    : null;
  const sources = Array.isArray(sourceWindow?.sources)
    ? sourceWindow.sources.filter((source): source is Record<string, unknown> =>
        Boolean(source && typeof source === "object" && !Array.isArray(source)),
      )
    : [];
  const hasNarrativeStagePlaySource = sources.some((source) =>
    source.selectedForStagePlay === true &&
    readAskTurnString(source.routeTo) === "narrative_stage_play",
  );
  const hasModelReviewedAnswerSnapshot = entries.some((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    const record = entry as Record<string, unknown>;
    const checkpoint = record.checkpoint && typeof record.checkpoint === "object" && !Array.isArray(record.checkpoint)
      ? (record.checkpoint as Record<string, unknown>)
      : null;
    const output = record.output && typeof record.output === "object" && !Array.isArray(record.output)
      ? (record.output as Record<string, unknown>)
      : null;
    return checkpoint?.modelReviewed === true || readAskTurnString(output?.state) === "model_reviewed";
  });
  const rawMissing = entries.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const record = entry as Record<string, unknown>;
    return Array.isArray(record.missingEvidence)
      ? record.missingEvidence.map(readAskTurnString).filter((value): value is string => Boolean(value))
      : [];
  });
  const joined = rawMissing.join("\n");
  const normalized: string[] = [];
  if (/\b(?:audio|transcript|dialogue|spoken)\b/i.test(joined)) {
    normalized.push("audio/transcript grounding");
  }
  if (/\b(?:user\s+objective|prediction\s+target|narrative\s+question|objective)\b/i.test(joined)) {
    normalized.push("a user objective/prediction target");
  }
  if ((hasNarrativeStagePlaySource || /\b(?:audio|transcript|dialogue|spoken)\b/i.test(joined)) && !hasModelReviewedAnswerSnapshot) {
    normalized.push("a user objective/prediction target");
  }
  if (normalized.length > 0) return normalized;
  return rawMissing.slice(0, 3);
};

const resolveStagePlaySourcePhrase = (graph: Record<string, unknown> | null): string => {
  const sourceWindow = graph?.sourceWindow && typeof graph.sourceWindow === "object" && !Array.isArray(graph.sourceWindow)
    ? (graph.sourceWindow as Record<string, unknown>)
    : null;
  const sources = Array.isArray(sourceWindow?.sources)
    ? sourceWindow.sources.filter((source): source is Record<string, unknown> =>
        Boolean(source && typeof source === "object" && !Array.isArray(source)),
      )
    : [];
  const hasActiveVisual = sources.some((source) =>
    source.selectedForStagePlay === true &&
    readAskTurnString(source.status) === "active" &&
    /(?:visual|screen|frame|tab)/i.test(`${readAskTurnString(source.modality) ?? ""}\n${readAskTurnString(source.sourceId) ?? ""}`),
  );
  if (hasActiveVisual) return "active visual source";
  const hasSelectedSource = sources.some((source) => source.selectedForStagePlay === true);
  return hasSelectedSource ? "selected live source" : "live source";
};

const collectStagePlayReceiptStringRefs = (value: unknown, prefix?: RegExp): string[] => {
  const refs: string[] = [];
  const seen = new Set<unknown>();
  const visit = (entry: unknown): void => {
    if (typeof entry === "string") {
      const trimmed = entry.trim();
      if (trimmed && (!prefix || prefix.test(trimmed))) refs.push(trimmed);
      return;
    }
    if (!entry || typeof entry !== "object") return;
    if (seen.has(entry)) return;
    seen.add(entry);
    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }
    Object.values(entry as Record<string, unknown>).forEach(visit);
  };
  visit(value);
  return Array.from(new Set(refs));
};

const formatStagePlayReceiptSourceLine = (sources: Record<string, unknown>[]): string => {
  const source = sources[0] ?? null;
  if (!source) return "none";
  const modality = readAskTurnString(source.modality) ?? "visual_frame";
  const status = readAskTurnString(source.status) ?? "unknown";
  const selected = source.selectedForStagePlay === true ? "yes" : "no";
  const routeTo = readAskTurnString(source.routeTo) ?? "unrouted";
  return `${modality} ${status} selected ${selected} ${routeTo}`;
};

const formatStagePlayReceiptReviewed = (
  checkpointFreshness: Record<string, unknown> | null,
  graph: Record<string, unknown> | null,
): boolean => {
  if (checkpointFreshness?.modelReviewed === true || checkpointFreshness?.fresh === true) return true;
  const badges = Array.isArray(graph?.badges)
    ? graph.badges.filter((entry): entry is Record<string, unknown> =>
        Boolean(entry && typeof entry === "object" && !Array.isArray(entry)),
      )
    : [];
  return badges.some((badge) => {
    const checkpoint = badge.checkpoint && typeof badge.checkpoint === "object" && !Array.isArray(badge.checkpoint)
      ? (badge.checkpoint as Record<string, unknown>)
      : null;
    return checkpoint?.modelReviewed === true;
  });
};

export const buildHelixRuntimeStagePlayFallbackText = (args: {
  artifacts: AskTurnLiveSourceArtifactLike[];
}): string => {
  const liveToolArtifact = [...args.artifacts]
    .reverse()
    .find((artifact) => artifact.kind === "live_environment_tool_observation") ?? null;
  const toolPayload = liveToolArtifact ? readLiveEnvironmentToolObservationPayload(liveToolArtifact) : null;
  if (readAskTurnString(toolPayload?.tool_name) === "live_env.request_stage_play_checkpoint") {
    const result =
      toolPayload?.observation && typeof toolPayload.observation === "object" && !Array.isArray(toolPayload.observation)
        ? (toolPayload.observation as Record<string, unknown>)
        : null;
    if (!result || readAskTurnString(result.schema) !== "stage_play_checkpoint_request_result/v1") {
      return readAskTurnString(toolPayload?.summary) ?? "";
    }
    const checkpointRequest =
      result.checkpointRequest && typeof result.checkpointRequest === "object" && !Array.isArray(result.checkpointRequest)
        ? (result.checkpointRequest as Record<string, unknown>)
        : null;
    const reason = readAskTurnString(result.reason) ?? "queued";
    const readyToRun = result.readyToRun === true;
    const status = readAskTurnString(checkpointRequest?.status) ?? "queued";
    const missingEvidence = Array.isArray(checkpointRequest?.missingEvidence)
      ? checkpointRequest.missingEvidence.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
      : [];
    const requestId = readAskTurnString(checkpointRequest?.checkpointRequestId) ?? "checkpoint request";
    const headline = status === "running"
      ? `Stage Play checkpoint request running: ${requestId}.`
      : status === "completed"
        ? `Stage Play checkpoint request completed: ${requestId}.`
        : `Stage Play checkpoint request queued: ${requestId}.`;
    const lines = [
      headline,
      status === "running" || status === "completed"
        ? `Status: ${status}. Helix Ask can consume this as a visible checkpoint turn.`
        : readyToRun
        ? "Ready to run: yes. Helix Ask can consume this as a visible checkpoint turn."
        : `Ready to run: no. Reason: ${reason.replace(/_/g, " ")}.`,
      missingEvidence.length > 0
        ? `Missing evidence: ${formatStagePlayAnswerList(missingEvidence.slice(0, 3))}.`
        : "Missing evidence: none reported by the checkpoint request.",
      "The checkpoint request is tool evidence only; it did not produce the final answer snapshot.",
    ];
    return lines.filter(Boolean).join("\n");
  }
  if (readAskTurnString(toolPayload?.tool_name) === "live_env.plan_stage_play_job") {
    const plan =
      toolPayload?.observation && typeof toolPayload.observation === "object" && !Array.isArray(toolPayload.observation)
        ? (toolPayload.observation as Record<string, unknown>)
        : null;
    if (!plan || readAskTurnString(plan.schemaVersion) !== "stage_play_job_plan/v1") {
      return readAskTurnString(toolPayload?.summary) ?? "";
    }
    const domain = readAskTurnString(plan.domain) ?? "custom";
    const requiredSources = Array.isArray(plan.requiredSources)
      ? plan.requiredSources.filter((source): source is Record<string, unknown> =>
          Boolean(source && typeof source === "object" && !Array.isArray(source)),
        )
      : [];
    const needed = requiredSources
      .filter((source) => source.required === true)
      .map((source) => readAskTurnString(source.label))
      .filter((entry): entry is string => Boolean(entry));
    const optional = requiredSources
      .filter((source) => source.required !== true)
      .map((source) => readAskTurnString(source.label))
      .filter((entry): entry is string => Boolean(entry));
    const missing = Array.isArray(plan.missingSetup)
      ? plan.missingSetup.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
      : [];
    const readinessChecks = Array.isArray(plan.readinessChecks)
      ? plan.readinessChecks.filter((check): check is Record<string, unknown> =>
          Boolean(check && typeof check === "object" && !Array.isArray(check)),
        )
      : [];
    const nextAction =
      readinessChecks
        .map((check) => readAskTurnString(check.nextAction))
        .find((entry): entry is string => Boolean(entry)) ??
      "Attach the needed source, then run Stage Play reflection.";
    const nodeCount = Array.isArray(plan.nodeChain) ? plan.nodeChain.length : 0;
    const lines = [
      `Stage Play job planned for ${domain.replace(/_/g, " ")} with ${nodeCount} node(s).`,
      needed.length > 0
        ? `Needed: ${formatStagePlayAnswerList(needed)}.`
        : "Needed: no required source class was reported missing by the plan.",
      optional.length > 0
        ? `Optional: ${formatStagePlayAnswerList(optional)}.`
        : "",
      missing.length > 0
        ? `Setup gap: ${missing[0]}`
        : "Setup gap: none reported.",
      `Next: ${nextAction}`,
      "The job plan is tool evidence only; it did not start capture and did not create an answer snapshot.",
    ];
    return lines.filter(Boolean).join("\n");
  }
  if (readAskTurnString(toolPayload?.tool_name) !== "live_env.reflect_stage_play_context") return "";
  const observation =
    toolPayload?.observation && typeof toolPayload.observation === "object" && !Array.isArray(toolPayload.observation)
      ? (toolPayload.observation as Record<string, unknown>)
      : null;
  if (!observation || readAskTurnString(observation.schema) !== "stage_play_reflection_result/v1") {
    return readAskTurnString(toolPayload?.summary) ?? "";
  }
  const graph =
    observation.graph && typeof observation.graph === "object" && !Array.isArray(observation.graph)
      ? (observation.graph as Record<string, unknown>)
      : null;
  const liveAnswerProjection =
    observation.liveAnswerProjection && typeof observation.liveAnswerProjection === "object" && !Array.isArray(observation.liveAnswerProjection)
      ? (observation.liveAnswerProjection as Record<string, unknown>)
      : null;
  const changedLineKeys = Array.isArray(liveAnswerProjection?.changedLineKeys)
    ? liveAnswerProjection.changedLineKeys.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
    : [];
  const projectedLineKeys = Array.isArray(liveAnswerProjection?.projectedLineKeys)
    ? liveAnswerProjection.projectedLineKeys.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
    : changedLineKeys;
  const skippedLineKeys = Array.isArray(liveAnswerProjection?.skippedLineKeys)
    ? liveAnswerProjection.skippedLineKeys.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
    : [];
  const debugReceipt =
    observation.debugReceipt && typeof observation.debugReceipt === "object" && !Array.isArray(observation.debugReceipt)
      ? (observation.debugReceipt as Record<string, unknown>)
      : null;
  const graphId = readAskTurnString(debugReceipt?.graphId) ?? readAskTurnString(graph?.graphId);
  const sourceRefs = Array.isArray(debugReceipt?.sourceRefs)
    ? debugReceipt.sourceRefs.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
    : [];
  const checkpointOnlySkipped = Array.isArray(liveAnswerProjection?.checkpointOnlySkipped)
    ? liveAnswerProjection.checkpointOnlySkipped.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
    : Array.isArray(debugReceipt?.checkpointOnlySkipped)
      ? debugReceipt.checkpointOnlySkipped.map(readAskTurnString).filter((entry): entry is string => Boolean(entry))
      : [];
  const visualSourceStatusFromReceipt = Array.isArray(debugReceipt?.visualSourceStatus)
    ? debugReceipt.visualSourceStatus.filter((entry): entry is Record<string, unknown> =>
        Boolean(entry && typeof entry === "object" && !Array.isArray(entry)),
      )
    : [];
  const graphSourceWindow =
    graph?.sourceWindow && typeof graph.sourceWindow === "object" && !Array.isArray(graph.sourceWindow)
      ? (graph.sourceWindow as Record<string, unknown>)
      : null;
  const visualSourceStatusFromGraph = Array.isArray(graphSourceWindow?.sources)
    ? graphSourceWindow.sources.filter((entry): entry is Record<string, unknown> => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
        const sourceId = readAskTurnString(entry.sourceId);
        const modality = readAskTurnString(entry.modality);
        return /(?:visual|screen|frame)/i.test(`${sourceId ?? ""} ${modality ?? ""}`);
      })
    : [];
  const visualSourceStatus =
    visualSourceStatusFromReceipt.length > 0 ? visualSourceStatusFromReceipt : visualSourceStatusFromGraph;
  const checkpointFreshness =
    debugReceipt?.checkpointFreshness &&
    typeof debugReceipt.checkpointFreshness === "object" &&
    !Array.isArray(debugReceipt.checkpointFreshness)
      ? (debugReceipt.checkpointFreshness as Record<string, unknown>)
      : null;
  const checkpointRequestId =
    readAskTurnString(debugReceipt?.checkpointRequestId) ??
    (Array.isArray(graph?.checkpointRequests)
      ? graph.checkpointRequests
          .map((entry) => entry && typeof entry === "object" && !Array.isArray(entry)
            ? readAskTurnString((entry as Record<string, unknown>).checkpointRequestId)
            : null)
          .find((entry): entry is string => Boolean(entry))
      : null);
  const reason = readAskTurnString(liveAnswerProjection?.reason);
  const reasonLabel = stagePlayProjectionReasonLabel(reason);
  const projected = liveAnswerProjection?.projected === true;
  const sourcePhrase = resolveStagePlaySourcePhrase(graph);
  const preferredProjectedKeys = ["risk", "possibilities", "unknowns", "next_check"];
  const projectedKeys = preferredProjectedKeys.filter((key) => projectedLineKeys.includes(key));
  const projectedLineText = formatStagePlayAnswerList(projectedKeys.length > 0 ? projectedKeys : projectedLineKeys);
  const missingEvidence = collectStagePlayMissingEvidenceLabels(graph);
  const missingEvidenceText = formatStagePlayAnswerList(missingEvidence);
  const visualEvidenceRefs = Array.from(new Set([
    ...sourceRefs.filter((ref) => /^visual_evidence:/i.test(ref)),
    ...collectStagePlayReceiptStringRefs(observation, /^visual_evidence:/i),
  ]));
  const sourceLine = formatStagePlayReceiptSourceLine(visualSourceStatus);
  const checkpointReviewed = formatStagePlayReceiptReviewed(checkpointFreshness, graph);
  const receiptLines = [
    checkpointReviewed
      ? "Stage Play reflection succeeded and a model-reviewed checkpoint exists."
      : "Stage Play reflection succeeded, but checkpoint answer synthesis did not complete.",
    "",
    "Stage Play debug receipt",
    "Tool: live_env.reflect_stage_play_context",
    `Graph: ${graphId ?? "unknown"}`,
    `Source: ${sourceLine}`,
    `Visual evidence: ${visualEvidenceRefs.join(", ") || "none"}`,
    `Projected live interpretation: ${projectedLineText || "none"}`,
    `Checkpoint-only skipped: ${formatStagePlayAnswerList(checkpointOnlySkipped) || "none"}`,
    `Queued checkpoint: ${checkpointRequestId ?? "none"}`,
    `Checkpoint reviewed: ${checkpointReviewed ? "true" : "false"}`,
  ];
  const lines = [
    ...receiptLines,
    projected && projectedLineText
      ? `Stage Play reflected the ${sourcePhrase} and projected ${projectedLineText} as Live Interpretation.`
      : `Stage Play reflected the ${sourcePhrase} but did not project Live Interpretation lanes: ${reasonLabel}.`,
    missingEvidenceText
      ? `The missing evidence before a model-reviewed answer snapshot is ${missingEvidenceText}.`
      : "No additional missing evidence was reported before the model-reviewed answer snapshot.",
    skippedLineKeys.length > 0
      ? `Skipped line(s): ${skippedLineKeys.join(", ")}.`
      : "",
    !projected && reason
      ? `Projection reason code: ${reason}.`
      : "",
    "The Stage Play graph and projection remain tool evidence; this receipt is not a model-synthesized answer.",
  ];
  return lines.filter(Boolean).join("\n");
};

