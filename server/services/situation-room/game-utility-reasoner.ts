import crypto from "node:crypto";
import {
  HELIX_GAME_UTILITY_HYPOTHESIS_SCHEMA,
  type GameUtilityHypothesis,
} from "@shared/helix-game-utility-hypothesis";
import type { GameSemanticEntry } from "@shared/helix-game-semantic-dictionary";
import type { HelixMinecraftEntitySenseSummary } from "@shared/helix-minecraft-world-sense";

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((entry: unknown) => String(entry ?? "").trim()).filter(Boolean)));

const normalizeId = (value: string): string => value.trim().toLowerCase();

const hasRelevantItemFlow = (cluster: HelixMinecraftEntitySenseSummary, entries: GameSemanticEntry[]): boolean => {
  const resources = new Set(entries.flatMap((entry: GameSemanticEntry) =>
    (entry.resources ?? []).map((resource: NonNullable<GameSemanticEntry["resources"]>[number]) => normalizeId(resource.item_id)),
  ));
  return (cluster.item_flow ?? []).some((flow: NonNullable<HelixMinecraftEntitySenseSummary["item_flow"]>[number]) =>
    resources.has(normalizeId(flow.item_type)),
  );
};

const hasContainerFlow = (cluster: HelixMinecraftEntitySenseSummary): boolean =>
  (cluster.item_flow ?? []).some((flow: NonNullable<HelixMinecraftEntitySenseSummary["item_flow"]>[number]) =>
    flow.nearby_container === true || flow.nearby_hopper === true,
  );

const hasBreedingFlow = (cluster: HelixMinecraftEntitySenseSummary): boolean =>
  (cluster.item_flow ?? []).some((flow: NonNullable<HelixMinecraftEntitySenseSummary["item_flow"]>[number]) =>
    /seed|wheat|carrot|potato/.test(flow.item_type),
  );

const statusForConfidence = (confidence: number): GameUtilityHypothesis["status"] =>
  confidence >= 0.85 ? "confirmed" : confidence >= 0.74 ? "likely" : confidence >= 0.45 ? "possible" : "unknown";

const chooseUtilityLabel = (cluster: HelixMinecraftEntitySenseSummary, entries: GameSemanticEntry[], confidence: number): string => {
  const entityLabel = entries[0]?.label ?? cluster.entity_type.replace(/^minecraft:/, "");
  const affordance = entries.flatMap((entry: GameSemanticEntry) => entry.affordances ?? [])[0] ?? null;
  if (affordance?.affordance_id === "egg_source_farm") {
    return confidence >= 0.85
      ? "confirmed egg-source farm"
      : confidence >= 0.74
        ? "likely egg-source / chicken farm"
        : confidence >= 0.6
          ? "possible contained chicken cluster"
          : confidence >= 0.45
            ? "dense chicken cluster"
            : "Chicken utility context";
  }
  if (affordance?.affordance_id === "food_leather_breeding_pen") {
    return confidence >= 0.74 ? "likely food/leather breeding pen" : "possible cow resource pen";
  }
  if (affordance?.affordance_id === "mob_grinder_drop_collection") {
    return confidence >= 0.74 ? "likely mob grinder / drop collection setup" : "possible mob grinder / drop collection setup";
  }
  return `${entityLabel} utility context`;
};

const confidenceForCluster = (input: {
  contained: boolean;
  relevantFlow: boolean;
  containerFlow: boolean;
  breedingFlow: boolean;
  dense: boolean;
  hostile: boolean;
}): number => {
  if (input.hostile) {
    return input.contained && input.relevantFlow && input.containerFlow
      ? 0.62
      : input.dense
        ? 0.5
        : 0.35;
  }
  return input.contained && input.relevantFlow && input.containerFlow
    ? 0.85
    : input.contained && (input.relevantFlow || input.breedingFlow)
      ? 0.76
      : input.contained && input.dense
        ? 0.62
        : input.dense
          ? 0.5
          : 0.35;
};

export function reasonGameUtilityFromEntityCluster(input: {
  threadId: string;
  roomId: string;
  gameId: "minecraft" | string;
  cluster: HelixMinecraftEntitySenseSummary;
  semanticEntries: GameSemanticEntry[];
  semanticLookupId: string;
  now?: string;
}): GameUtilityHypothesis | null {
  if (input.semanticEntries.length === 0) return null;
  const dense = input.cluster.density === "high" || (input.cluster.density_score ?? 0) >= 0.7 || input.cluster.count >= 6;
  const contained = Boolean(input.cluster.containment);
  const relevantFlow = hasRelevantItemFlow(input.cluster, input.semanticEntries);
  const containerFlow = hasContainerFlow(input.cluster);
  const breedingFlow = hasBreedingFlow(input.cluster);
  const hostile = input.semanticEntries.some((entry: GameSemanticEntry) => entry.categories.includes("hostile_mob"));
  const confidence = confidenceForCluster({
    contained,
    relevantFlow,
    containerFlow,
    breedingFlow,
    dense,
    hostile,
  });
  const resourceItems = new Set(input.semanticEntries.flatMap((entry: GameSemanticEntry) =>
    (entry.resources ?? []).map((resource: NonNullable<GameSemanticEntry["resources"]>[number]) => resource.item_id),
  ));
  const missingEvidence = uniqueStrings([
    contained ? "" : "Containment context is not established.",
    relevantFlow ? "" : `No observed item flow for known resources (${Array.from(resourceItems).join(", ") || "unknown resources"}).`,
    containerFlow ? "" : "No hopper/chest/container routing evidence is attached.",
    breedingFlow || relevantFlow ? "" : "No repeated breeding/feed/use loop is attached.",
    hostile ? "Need spawner, kill chamber, drop shaft, or repeated drop routing to distinguish a mob grinder from ordinary danger." : "",
  ]);
  const supportingEvidence = uniqueStrings([
    ...input.cluster.evidence_refs,
    input.semanticLookupId,
  ]);
  return {
    schema: HELIX_GAME_UTILITY_HYPOTHESIS_SCHEMA,
    hypothesis_id: `game_utility:${hashShort([input.threadId, input.cluster.entity_type, supportingEvidence, confidence], 18)}`,
    thread_id: input.threadId,
    room_id: input.roomId,
    game_id: input.gameId,
    subject_ref: input.cluster.entity_type,
    utility_label: chooseUtilityLabel(input.cluster, input.semanticEntries, confidence),
    status: statusForConfidence(confidence),
    confidence,
    supporting_evidence_refs: supportingEvidence,
    missing_evidence: missingEvidence,
    semantic_entry_refs: input.semanticEntries.map((entry: GameSemanticEntry) => entry.entry_id),
    raw_logs_included: false,
    assistant_answer: false,
    model_invoked: false,
    deterministic: true,
    ts: input.now ?? new Date().toISOString(),
  };
}
