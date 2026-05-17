import type { HelixGoalCardType } from "@shared/helix-goal-card";
import type { HelixInterpretationCard } from "@shared/helix-interpretation-card";
import type { HelixLiveSourceChunk } from "@shared/helix-live-source-chunk";
import { appendGoalCard } from "./goal-finder-store";

const looksBlocked = (summary: string): boolean =>
  /\b(?:missing|failed|unavailable|blocked|waiting|stale|no\s+chunk|provider)\b/i.test(summary);

const goalTypeFor = (chunk: HelixLiveSourceChunk, summary: string): HelixGoalCardType => {
  if (chunk.modality === "visual_frame") {
    return looksBlocked(summary) ? "resolve_missing_visual_evidence" : "identify_current_activity";
  }
  if (chunk.modality === "world_event") {
    return /\b(?:risk|damage|hostile|danger|health|death|attack)\b/i.test(summary)
      ? "track_risk"
      : "identify_current_activity";
  }
  if (chunk.modality === "audio_transcript" || chunk.modality === "text_chat") {
    return "monitor_user_direct_address";
  }
  if (chunk.modality === "calculator_stream" || chunk.modality === "simulation_stream") {
    return "verify_equation_or_calculation";
  }
  if (chunk.modality === "document_context") {
    return "compare_live_transcript_to_reference";
  }
  return "preserve_context_in_notes";
};

const nextEvidenceFor = (chunk: HelixLiveSourceChunk, goalType: HelixGoalCardType): string[] => {
  if (goalType === "resolve_missing_visual_evidence") return ["fresh visual frame analysis", "client capture heartbeat"];
  if (goalType === "track_risk") return ["fresh world-event window", "visual corroboration if available"];
  if (goalType === "monitor_user_direct_address") return ["next transcript chunk", "speaker identity if available"];
  if (goalType === "verify_equation_or_calculation") return ["next stream tick", "residual or stability window"];
  if (chunk.modality === "visual_frame") return ["next visual frame", "world/audio corroboration if available"];
  return ["next source chunk"];
};

const candidateGoalFor = (goalType: HelixGoalCardType): string => {
  if (goalType === "resolve_missing_visual_evidence") return "Resolve missing or stale visual evidence.";
  if (goalType === "track_risk") return "Track whether current world events indicate user-relevant risk.";
  if (goalType === "monitor_user_direct_address") return "Monitor whether transcript evidence is direct user steering.";
  if (goalType === "verify_equation_or_calculation") return "Verify stream stability and detect anomalies.";
  if (goalType === "compare_live_transcript_to_reference") return "Compare incoming context with the selected reference.";
  if (goalType === "preserve_context_in_notes") return "Preserve useful live context in notes when policy allows.";
  return "Identify the current live activity from fresh evidence.";
};

export function generateGoalCardFromInterpretation(input: {
  interpretation: HelixInterpretationCard;
  chunk: HelixLiveSourceChunk;
  summary: string;
}) {
  const goalType = goalTypeFor(input.chunk, input.summary);
  const expiresAfterMs = input.chunk.modality === "visual_frame" ? 45_000 : 90_000;
  return appendGoalCard({
    thread_id: input.chunk.thread_id,
    room_id: input.chunk.environment_id ?? null,
    goal_type: goalType,
    candidate_goal: candidateGoalFor(goalType),
    rationale: `Candidate goal derived from ${input.chunk.modality} interpretation.`,
    evidence_refs: [input.interpretation.interpretation_id, ...input.interpretation.evidence_refs],
    next_evidence_needed: nextEvidenceFor(input.chunk, goalType),
    status: looksBlocked(input.summary) ? "blocked" : "candidate",
    priority: goalType === "track_risk" ? 0.85 : 0.55,
    confidence: input.interpretation.confidence,
    may_request_helix_ask: true,
    may_execute_tool: false,
    expires_after_ms: expiresAfterMs,
    expires_at: new Date(Date.now() + expiresAfterMs).toISOString(),
  });
}
