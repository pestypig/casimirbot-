import type { LiveJobPolicyObservation } from "@shared/live-job-policy-observation";

export function summarizeLiveJobPolicyForProjection(
  observation: LiveJobPolicyObservation,
): {
  line_key: "route_evidence" | "source_health" | "dottie_commentary" | "live_job_status";
  value: string;
  evidence_refs: string[];
  assistant_answer: false;
} {
  const lineKey =
    observation.event_kind === "route_clean" ||
    observation.event_kind === "route_drift_candidate" ||
    observation.event_kind === "route_drift_confirmed"
      ? "route_evidence"
      : observation.event_kind === "source_missing" || observation.event_kind === "source_stale"
        ? "source_health"
        : observation.job_name.toLowerCase().includes("dottie")
          ? "dottie_commentary"
          : "live_job_status";
  return {
    line_key: lineKey,
    value: observation.summary,
    evidence_refs: [observation.observation_id, ...observation.source_observation_refs],
    assistant_answer: false,
  };
}
