import {
  HELIX_VISUAL_EVIDENCE_HEALTH_SCHEMA,
  type HelixVisualEvidenceHealth,
  type HelixVisualProviderStatus,
} from "@shared/helix-visual-evidence-health";
import { getVisionProviderHealth } from "../vision/provider";
import {
  listVisualFrameEvidence,
  listVisualFrames,
  listVisualSnapshotSources,
} from "./visual-snapshot-store";
import { buildSituationSourceCapabilities } from "./situation-source-capability-store";

const isAnalysisFailureSummary = (summary: string): boolean =>
  /\b(?:no configured vision provider|provider returned|vision provider|analysis failed|timed out|timeout|unavailable)\b/i.test(summary);

const providerStatus = (): HelixVisualProviderStatus => {
  const health = getVisionProviderHealth();
  if (!health.configured) return "missing";
  if (health.last_error) return "failed";
  if (!health.can_analyze_inline_image) return "failed";
  return "configured";
};

const nextActionFor = (input: {
  status: HelixVisualEvidenceHealth["status"];
  provider: HelixVisualProviderStatus;
}): string | null => {
  if (input.status === "waiting_for_first_frame") return "capture_first_frame";
  if (input.status === "stale") return "capture_frame_now";
  if (input.status === "frame_captured") {
    if (input.provider === "missing" || input.provider === "failed") return "configure_vision_provider";
    return "capture_frame_now";
  }
  if (input.status === "analysis_failed") {
    if (input.provider === "missing" || input.provider === "failed") return "configure_vision_provider";
    return "capture_frame_now";
  }
  return null;
};

export function getVisualEvidenceHealth(input: {
  threadId: string;
  sourceId?: string | null;
  roomId?: string | null;
  now?: string;
}): HelixVisualEvidenceHealth {
  const sources = listVisualSnapshotSources({ threadId: input.threadId })
    .filter((source) => !input.sourceId || source.source_id === input.sourceId)
    .filter((source) => !input.roomId || !source.room_id || source.room_id === input.roomId);
  const source = sources.at(-1) ?? null;
  const provider = providerStatus();
  if (!source) {
    const latestFrame = listVisualFrames({ threadId: input.threadId, limit: 100 })
      .filter((frame) => !input.sourceId || frame.source_id === input.sourceId)
      .at(-1) ?? null;
    const latestEvidence = listVisualFrameEvidence({ threadId: input.threadId, limit: 100 })
      .filter((evidence) => !input.sourceId || evidence.source_id === input.sourceId)
      .at(-1) ?? null;
    if (latestFrame || latestEvidence) {
      const summary = latestEvidence?.summary ?? null;
      const failed = summary ? isAnalysisFailureSummary(summary) : false;
      const status: HelixVisualEvidenceHealth["status"] = !latestEvidence
        ? "frame_captured"
        : failed
          ? "analysis_failed"
          : "analysis_ready";
      return {
        schema: HELIX_VISUAL_EVIDENCE_HEALTH_SCHEMA,
        source_id: latestEvidence?.source_id ?? latestFrame?.source_id ?? input.sourceId ?? null,
        thread_id: input.threadId,
        status,
        latest_frame_id: latestFrame?.frame_id ?? latestEvidence?.frame_id ?? null,
        latest_evidence_id: latestEvidence?.evidence_id ?? null,
        latest_summary: summary,
        provider_status: provider,
        next_required_action: nextActionFor({ status, provider }),
        assistant_answer: false,
        raw_image_included: false,
      };
    }
    return {
      schema: HELIX_VISUAL_EVIDENCE_HEALTH_SCHEMA,
      source_id: null,
      thread_id: input.threadId,
      status: "no_source",
      latest_frame_id: null,
      latest_evidence_id: null,
      latest_summary: null,
      provider_status: provider,
      next_required_action: "grant_visual_capture_permission",
      assistant_answer: false,
      raw_image_included: false,
    };
  }
  if (source.status === "permission_required") {
    return {
      schema: HELIX_VISUAL_EVIDENCE_HEALTH_SCHEMA,
      source_id: source.source_id,
      thread_id: source.thread_id,
      status: "permission_required",
      latest_frame_id: null,
      latest_evidence_id: null,
      latest_summary: null,
      provider_status: provider,
      next_required_action: "grant_visual_capture_permission",
      assistant_answer: false,
      raw_image_included: false,
    };
  }

  const capability = buildSituationSourceCapabilities({
    threadId: source.thread_id,
    roomId: source.room_id ?? null,
    now: input.now,
  }).find((entry) => entry.source_id === source.source_id);
  const latestFrame = listVisualFrames({ threadId: source.thread_id, limit: 100 })
    .filter((frame) => frame.source_id === source.source_id)
    .at(-1) ?? null;
  const latestEvidence = listVisualFrameEvidence({ threadId: source.thread_id, limit: 100 })
    .filter((evidence) => evidence.source_id === source.source_id)
    .at(-1) ?? null;
  const summary = latestEvidence?.summary ?? null;
  const failed = summary ? isAnalysisFailureSummary(summary) : false;
  const status = capability?.status === "stale"
    ? "stale"
    : !latestFrame
      ? "waiting_for_first_frame"
      : !latestEvidence
        ? "frame_captured"
        : failed
          ? "analysis_failed"
          : "analysis_ready";
  return {
    schema: HELIX_VISUAL_EVIDENCE_HEALTH_SCHEMA,
    source_id: source.source_id,
    thread_id: source.thread_id,
    status,
    latest_frame_id: latestFrame?.frame_id ?? null,
    latest_evidence_id: latestEvidence?.evidence_id ?? null,
    latest_summary: summary,
    provider_status: provider,
    next_required_action: nextActionFor({ status, provider }),
    assistant_answer: false,
    raw_image_included: false,
  };
}
