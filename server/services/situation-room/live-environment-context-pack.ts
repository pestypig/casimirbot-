import type { LiveAnswerEnvironment } from "@shared/helix-live-answer-environment";

export function buildLiveEnvironmentContextPack(environment: LiveAnswerEnvironment | null) {
  if (!environment) return null;
  return {
    environment_id: environment.environment_id,
    objective: environment.objective,
    preset: environment.preset ?? null,
    status: environment.status,
    mode: environment.mode,
    lines: environment.lines.filter((line) => line.visibility !== "debug_only"),
    subgoals: environment.subgoals,
    latest_summary: environment.latest_summary,
    evidence_refs: environment.evidence_refs,
    updated_at: environment.updated_at,
    raw_transcript_included: false,
    raw_audio_included: false,
    deterministic_content_role: "observation_not_assistant_answer",
  };
}
