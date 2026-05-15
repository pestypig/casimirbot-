import type { HelixLiveSourceAnalysisJob } from "@shared/helix-live-source-analysis-job";
import type { HelixLiveSourceChunk } from "@shared/helix-live-source-chunk";
import { getVisionProviderHealth } from "../vision/provider";
import { analyzeVisualFrame, getVisualFrame, listVisualFrameEvidence } from "./visual-snapshot-store";

export type LiveSourceAnalyzerResult = {
  status: "completed" | "failed" | "suppressed";
  summary: string;
  output_refs: string[];
  next_required_action?: string | null;
  model_invoked?: boolean;
  line_values?: Record<string, {
    value: string;
    confidence?: number | null;
  }>;
};

const genericVisualCaptureSummaries = new Set([
  "visual frame captured as live-source chunk.",
  "visual frame captured.",
]);

const isGenericCaptureSummary = (summary: string | null | undefined): boolean =>
  !summary || genericVisualCaptureSummaries.has(summary.trim().toLowerCase());

const analyzeVisualChunk = (job: HelixLiveSourceAnalysisJob, chunk: HelixLiveSourceChunk): LiveSourceAnalyzerResult => {
  const existingEvidence = chunk.evidence_refs.find((ref) => ref.startsWith("visual_evidence:")) ??
    listVisualFrameEvidence({ threadId: chunk.thread_id, limit: 100 })
      .find((entry) => entry.frame_id === chunk.payload_ref || chunk.evidence_refs.includes(entry.frame_id))
      ?.evidence_id;
  if (existingEvidence) {
    return {
      status: "completed",
      summary: "Latest visual frame already has compact visual evidence.",
      output_refs: [existingEvidence],
      model_invoked: true,
    };
  }
  const frameId = typeof chunk.payload_ref === "string" && chunk.payload_ref.startsWith("visual_frame:")
    ? chunk.payload_ref
    : chunk.evidence_refs.find((ref) => ref.startsWith("visual_frame:")) ?? null;
  const frame = frameId ? getVisualFrame({ threadId: chunk.thread_id, frameId }) : null;
  if (!frame) {
    return {
      status: "failed",
      summary: "Frame payload is unavailable; capture a fresh frame before analysis can run.",
      output_refs: [chunk.chunk_id, "capture_frame_now"],
      next_required_action: "capture_frame_now",
      model_invoked: false,
    };
  }
  const provider = getVisionProviderHealth();
  if (!provider.configured || !provider.can_analyze_inline_image) {
    return {
      status: "failed",
      summary: "Vision provider is missing; the visual chunk cannot be described yet.",
      output_refs: [chunk.chunk_id, "configure_vision_provider"],
      next_required_action: "configure_vision_provider",
      model_invoked: false,
    };
  }
  if (isGenericCaptureSummary(chunk.compact_summary)) {
    return {
      status: "failed",
      summary: "Frame payload is unavailable to the server; capture and analyze a fresh frame from the browser client.",
      output_refs: [chunk.chunk_id, frame.frame_id, "capture_frame_now"],
      next_required_action: "capture_frame_now",
      model_invoked: false,
    };
  }
  const evidence = analyzeVisualFrame({
    thread_id: chunk.thread_id,
    frame_id: frame.frame_id,
    image_model: provider.model ?? "live-source-analysis",
    summary: chunk.compact_summary,
    uncertainty: ["Derived from compact live-source chunk summary; raw image bytes are not stored in Ask context."],
  });
  return {
    status: "completed",
    summary: evidence.summary,
    output_refs: [evidence.evidence_id],
    model_invoked: true,
    line_values: {
      scene: { value: evidence.summary, confidence: 0.72 },
      place: { value: evidence.summary, confidence: 0.68 },
      activity: { value: evidence.summary, confidence: 0.62 },
      evidence: { value: "Visual frame analysis completed from the live-source chunk.", confidence: 0.72 },
      next_check: { value: "Align this visual evidence with fresh world events if a world source becomes active.", confidence: 0.55 },
    },
  };
};

const analyzeTranscriptChunk = (_job: HelixLiveSourceAnalysisJob, chunk: HelixLiveSourceChunk): LiveSourceAnalyzerResult => {
  const text = chunk.compact_summary?.trim() || "Transcript chunk recorded.";
  const direct = /\b(?:helix|casimir|cortana|dot)\b[,:\s]/i.test(text) || /\b(?:can you|please|look|watch|setup|set up)\b/i.test(text);
  const corrective = /\b(?:actually|correction|i mean|that's wrong|not that)\b/i.test(text);
  return {
    status: "completed",
    summary: direct
      ? `Direct-address transcript context: ${text}`
      : corrective
        ? `Possible user-steering transcript context: ${text}`
        : `Ambient transcript context: ${text}`,
    output_refs: [chunk.chunk_id, direct ? "direct_address" : corrective ? "user_steering_candidate" : "ambient_transcript"],
    model_invoked: false,
    line_values: {
      dialogue: { value: direct ? `Direct address: ${text}` : text, confidence: direct ? 0.76 : 0.55 },
      activity: { value: "Dialogue source is active; use it as context, not an assistant answer.", confidence: 0.45 },
      evidence: { value: "Transcript chunk was classified as compact dialogue evidence.", confidence: 0.66 },
    },
  };
};

const analyzeWorldEventChunk = (_job: HelixLiveSourceAnalysisJob, chunk: HelixLiveSourceChunk): LiveSourceAnalyzerResult => {
  const summary = chunk.compact_summary?.trim() || "World event chunk recorded.";
  const risk = /\b(?:damage|hostile|attack|creeper|zombie|skeleton|lava|fall|danger)\b/i.test(summary);
  return {
    status: "completed",
    summary: risk ? `World-event risk evidence: ${summary}` : `World-event activity evidence: ${summary}`,
    output_refs: [chunk.chunk_id, risk ? "world_salience:risk" : "world_salience:activity"],
    model_invoked: false,
    line_values: {
      activity: { value: summary, confidence: 0.66 },
      risk: { value: risk ? summary : "No risk signal was detected in this world-event chunk.", confidence: risk ? 0.7 : 0.45 },
      progress: { value: "World-event source produced compact evidence.", confidence: 0.6 },
    },
  };
};

const analyzeStreamChunk = (_job: HelixLiveSourceAnalysisJob, chunk: HelixLiveSourceChunk): LiveSourceAnalyzerResult => {
  const summary = chunk.compact_summary?.trim() || `${chunk.modality} tick recorded.`;
  const anomaly = /\b(?:nan|inf|overflow|unstable|diverged|error|anomaly)\b/i.test(summary);
  return {
    status: "completed",
    summary: anomaly ? `Stream anomaly evidence: ${summary}` : `Stream tick evidence: ${summary}`,
    output_refs: [chunk.chunk_id, anomaly ? "stream_status:anomaly" : "stream_status:stable_tick"],
    model_invoked: false,
    line_values: {
      progress: { value: summary, confidence: 0.66 },
      evidence: { value: anomaly ? `Anomaly detected: ${summary}` : summary, confidence: anomaly ? 0.72 : 0.6 },
      next_check: { value: anomaly ? "Reduce source cadence or inspect stream backpressure." : "Continue stream cadence.", confidence: 0.52 },
    },
  };
};

export function dispatchLiveSourceAnalysisJob(input: {
  job: HelixLiveSourceAnalysisJob;
  chunk: HelixLiveSourceChunk;
}): LiveSourceAnalyzerResult {
  if (input.chunk.modality === "visual_frame" || input.job.analyzer_id === "visual_analysis") {
    return analyzeVisualChunk(input.job, input.chunk);
  }
  if (input.chunk.modality === "audio_transcript") return analyzeTranscriptChunk(input.job, input.chunk);
  if (input.chunk.modality === "world_event") return analyzeWorldEventChunk(input.job, input.chunk);
  if (input.chunk.modality === "calculator_stream" || input.chunk.modality === "simulation_stream") {
    return analyzeStreamChunk(input.job, input.chunk);
  }
  return {
    status: "completed",
    summary: input.chunk.compact_summary ?? `${input.chunk.modality} chunk recorded.`,
    output_refs: [input.chunk.chunk_id],
    model_invoked: false,
  };
}
