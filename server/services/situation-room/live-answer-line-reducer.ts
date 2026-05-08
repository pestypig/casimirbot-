import type {
  LiveAnswerEnvironment,
  LiveAnswerEnvironmentDelta,
} from "@shared/helix-live-answer-environment";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import type {
  SituationEventSignal,
  SituationGoalHypothesis,
  SituationSalienceReceipt,
} from "@shared/helix-situation-standby";
import type { SituationEpisode } from "@shared/helix-situation-episode";
import { updateLiveAnswerEnvironment } from "./live-answer-environment-store";

const eventLabel = (event: HelixWorldEvent): string =>
  event.actor_label || event.actor_id || "The source";

const healthValue = (event: HelixWorldEvent): number | null => {
  const health = event.health_delta?.current_health;
  return typeof health === "number" && Number.isFinite(health) ? health : null;
};

const latestEpisodeSummary = (episodes: SituationEpisode[]): string | null =>
  episodes.at(-1)?.summary_seed?.trim() || null;

const latestGoalLabel = (goals: SituationGoalHypothesis[]): string | null =>
  goals.at(-1)?.goal_label?.trim() || null;

export function reduceLiveAnswerEnvironmentFromWorldEvent(input: {
  environment: LiveAnswerEnvironment | null;
  event: HelixWorldEvent;
  signal: SituationEventSignal;
  salienceReceipt?: SituationSalienceReceipt | null;
  episodes?: SituationEpisode[];
  goalHypotheses?: SituationGoalHypothesis[];
  now?: string;
}): { environment: LiveAnswerEnvironment; delta: LiveAnswerEnvironmentDelta } | null {
  const environment = input.environment;
  if (!environment || environment.status !== "active") return null;
  const now = input.now ?? input.signal.ts;
  const episodes = input.episodes ?? [];
  const goals = input.goalHypotheses ?? [];
  const salience = input.salienceReceipt ?? null;
  const evidenceRefs = Array.from(
    new Set([
      ...input.signal.evidence_refs,
      ...(salience?.evidence_refs ?? []),
      ...episodes.flatMap((episode) => episode.evidence_refs),
    ]),
  ).slice(-24);
  const actor = eventLabel(input.event);
  const episodeSummary = latestEpisodeSummary(episodes);
  const goalLabel = latestGoalLabel(goals);
  const health = healthValue(input.event);
  const riskSummary =
    salience?.reason === "risk_detected"
      ? salience.summary
      : health !== null && health <= 6
        ? `${actor} is in danger at ${health} health.`
        : null;
  const progressSummary =
    salience?.reason === "goal_progress"
      ? salience.summary
      : input.event.event_type === "item_acquired" && input.event.inventory_delta?.item_id
        ? `${actor} acquired ${input.event.inventory_delta.item_id}.`
        : null;
  const nowSummary =
    riskSummary ??
    progressSummary ??
    episodeSummary ??
    input.event.text?.trim() ??
    `${input.event.event_type} observed.`;
  const lineValues: Parameters<typeof updateLiveAnswerEnvironment>[0]["line_values"] = {};
  const setLine = (key: string, value: string, confidence = 0.72) => {
    if (!environment.lines.some((line) => line.key === key)) return;
    lineValues[key] = {
      value,
      confidence,
      evidence_refs: evidenceRefs,
      source: "deterministic_reducer",
      model_invoked: false,
    };
  };

  setLine("now", nowSummary, salience?.should_notify_helix ? 0.86 : 0.68);
  if (goalLabel) setLine("goal", goalLabel, goals.at(-1)?.confidence ?? 0.68);
  if (riskSummary) setLine("risk", riskSummary, 0.86);
  if (progressSummary) setLine("progress", progressSummary, 0.76);
  if (episodeSummary && !progressSummary && environment.lines.some((line) => line.key === "progress")) {
    setLine("progress", episodeSummary, 0.64);
  }
  if (salience) {
    setLine(
      "last_decision",
      salience.should_request_user_input
        ? "request_user_input"
        : salience.should_notify_helix
          ? "show_text"
          : "silent_keep_in_context",
      0.82,
    );
  }
  if (environment.lines.some((line) => line.key === "next_check")) {
    setLine(
      "next_check",
      riskSummary
        ? "Watch health recovery and hostile proximity."
        : progressSummary
          ? "Watch whether this progress advances the current objective."
          : "Watch for source events that affect the requested categories.",
      0.65,
    );
  }
  if (environment.lines.some((line) => line.key === "unknowns")) {
    setLine("unknowns", "Raw logs are compacted; source-specific gaps remain explicit in Situation Room Debug.", 0.62);
  }
  if (environment.lines.some((line) => line.key === "claim")) setLine("claim", nowSummary, 0.6);
  if (environment.lines.some((line) => line.key === "evidence")) setLine("evidence", evidenceRefs[0] ?? input.signal.signal_id, 0.65);
  if (environment.lines.some((line) => line.key === "hypothesis")) setLine("hypothesis", goalLabel ?? environment.objective, 0.62);

  if (Object.keys(lineValues).length === 0) return null;
  const reason =
    salience?.reason === "risk_detected" || salience?.reason === "goal_progress" || salience?.reason === "goal_blocked"
      ? "salience_update"
      : episodes.length > 0
        ? "episode_update"
        : "source_event";
  return updateLiveAnswerEnvironment({
    environment_id: environment.environment_id,
    reason,
    line_values: lineValues,
    latest_summary: nowSummary,
    evidence_refs: evidenceRefs,
    now,
  });
}
