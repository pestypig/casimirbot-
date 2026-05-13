import type { HelixMinecraftSpatialEpisode } from "@shared/helix-minecraft-spatial-episode";
import type { HelixCategorizationEvent } from "@shared/helix-categorization-event";
import type { HelixSyntheticEvidence } from "@shared/helix-synthetic-evidence";
import { recordCategorizationEvent } from "./categorization-bus";
import { recordSyntheticEvidence } from "./synthetic-evidence-ledger";

export type MinecraftSpatialIntentReduction = {
  summary: string;
  structure_line: string;
  hazard_line: string;
  missing_evidence_line: string;
  categorization_events: HelixCategorizationEvent[];
  synthetic_evidence: HelixSyntheticEvidence[];
};

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((entry) => String(entry ?? "").trim()).filter(Boolean)));

export function summarizeMinecraftSpatialEpisode(episode: HelixMinecraftSpatialEpisode): Omit<
  MinecraftSpatialIntentReduction,
  "categorization_events" | "synthetic_evidence"
> {
  const actor = episode.actor_label ?? "The player";
  const topHypothesis = episode.structure_hypotheses[0] ?? null;
  const structures = episode.structure_hypotheses.map((hypothesis) => hypothesis.structure_type);
  const descending = structures.includes("descending_stair");
  const trench = structures.includes("parallel_trench");
  const lavaChannel = structures.includes("lava_lighting_channel");
  const structureLine =
    lavaChannel
      ? `${actor} appears to be building a lava-lit side channel beside a mining path.`
      : descending && trench
        ? `${actor} appears to be carving a descending mine stair with a parallel side trench.`
        : topHypothesis
          ? `${actor}: ${topHypothesis.intent_hypothesis}`
          : `${actor} has an active spatial mining episode, but no stable structure hypothesis has crossed threshold.`;
  const confidence = topHypothesis ? `Confidence ${topHypothesis.confidence.toFixed(2)}.` : "Confidence low.";
  const vertical =
    typeof episode.vertical_change === "number"
      ? `vertical change ${episode.vertical_change}`
      : "vertical change unknown";
  const summary = `${structureLine} ${confidence} Window: ${episode.edit_count} edits, ${vertical}.`;
  const missingEvidence = uniqueStrings([
    ...episode.known_unknowns,
    ...episode.structure_hypotheses.flatMap((hypothesis) => hypothesis.missing_evidence),
  ]);
  return {
    summary,
    structure_line: structureLine,
    hazard_line: episode.risk_notes.length > 0 ? episode.risk_notes.join(" ") : "No spatial hazard threshold has crossed yet.",
    missing_evidence_line:
      missingEvidence.length > 0
        ? missingEvidence.join(" ")
        : "No major missing evidence for the current spatial hypothesis.",
  };
}

export function reduceMinecraftSpatialIntent(input: {
  threadId: string;
  episode: HelixMinecraftSpatialEpisode;
}): MinecraftSpatialIntentReduction {
  const compact = summarizeMinecraftSpatialEpisode(input.episode);
  const categorizationEvents = input.episode.structure_hypotheses.length > 0
    ? [
        recordCategorizationEvent({
          thread_id: input.threadId,
          source_event_id: input.episode.episode_id,
          source_family: "minecraft",
          category: "minecraft_spatial_pattern",
          summary: compact.summary,
          confidence: input.episode.structure_hypotheses[0]?.confidence ?? 0.5,
          evidence_refs: input.episode.evidence_refs,
          deterministic: true,
          model_invoked: false,
        }),
        ...(input.episode.risk_notes.length > 0
          ? [
              recordCategorizationEvent({
                thread_id: input.threadId,
                source_event_id: input.episode.episode_id,
                source_family: "minecraft",
                category: "hazard_context",
                summary: compact.hazard_line,
                confidence: 0.72,
                evidence_refs: input.episode.evidence_refs,
                deterministic: true,
                model_invoked: false,
              }),
            ]
          : []),
      ]
    : [];
  const syntheticEvidence = input.episode.structure_hypotheses.map((hypothesis) =>
    recordSyntheticEvidence({
      thread_id: input.threadId,
      produced_by: "minecraft_spatial_reducer",
      claim: `${hypothesis.structure_type}: ${hypothesis.intent_hypothesis}`,
      support_status: hypothesis.confidence >= 0.75 ? "supports" : "partial",
      source_refs: hypothesis.evidence_refs,
      reusable_context_ref: input.episode.episode_id,
      deterministic: true,
      model_invoked: false,
    }),
  );
  return {
    ...compact,
    categorization_events: categorizationEvents,
    synthetic_evidence: syntheticEvidence,
  };
}
