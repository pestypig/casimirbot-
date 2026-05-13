import crypto from "node:crypto";
import {
  HELIX_MINECRAFT_PATTERN_HYPOTHESIS_SCHEMA,
  type HelixMinecraftPatternHypothesis,
  type HelixMinecraftStructureType,
} from "@shared/helix-minecraft-pattern-hypothesis";
import type { HelixMinecraftSpatialEvent } from "@shared/helix-minecraft-spatial-event";

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((entry) => String(entry ?? "").trim()).filter(Boolean)));

const isEditEvent = (event: HelixMinecraftSpatialEvent): boolean =>
  event.event_type === "block_broken" ||
  event.event_type === "block_placed" ||
  event.event_type === "bucket_empty" ||
  event.event_type === "bucket_fill" ||
  event.event_type === "fluid_changed";

const isBrokenEdit = (event: HelixMinecraftSpatialEvent): boolean =>
  event.event_type === "block_broken" || event.event_type === "fluid_changed";

const includesMinecraftName = (value: unknown, needle: string): boolean =>
  typeof value === "string" && value.toLowerCase().includes(needle);

const blockText = (event: HelixMinecraftSpatialEvent): string =>
  [event.block?.before, event.block?.after, event.block?.target, event.inventory_delta?.item, event.inventory_delta?.item_id]
    .map((entry) => String(entry ?? "").toLowerCase())
    .join(" ");

const buildHypothesis = (input: {
  type: HelixMinecraftStructureType;
  intent: string;
  confidence: number;
  evidence_refs: string[];
  missing_evidence?: string[];
}): HelixMinecraftPatternHypothesis => ({
  schema: HELIX_MINECRAFT_PATTERN_HYPOTHESIS_SCHEMA,
  hypothesis_id: `minecraft_pattern:${input.type}:${hashShort([input.type, input.evidence_refs], 14)}`,
  structure_type: input.type,
  intent_hypothesis: input.intent,
  confidence: clamp(input.confidence),
  evidence_refs: uniqueStrings(input.evidence_refs).slice(-32),
  missing_evidence: uniqueStrings(input.missing_evidence ?? []),
});

export type MinecraftPatternRecognitionInput = {
  events: HelixMinecraftSpatialEvent[];
  boundingBox: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  verticalChange: number | null;
  dominantDirection: string | null;
};

export function recognizeMinecraftBuildPatterns(
  input: MinecraftPatternRecognitionInput,
): HelixMinecraftPatternHypothesis[] {
  const events = input.events.slice().sort((a, b) => a.ts.localeCompare(b.ts) || a.event_id.localeCompare(b.event_id));
  const editEvents = events.filter(isEditEvent);
  const brokenEdits = events.filter(isBrokenEdit);
  if (editEvents.length < 4) return [];

  const spanX = input.boundingBox.max.x - input.boundingBox.min.x;
  const spanY = input.boundingBox.max.y - input.boundingBox.min.y;
  const spanZ = input.boundingBox.max.z - input.boundingBox.min.z;
  const primaryAxis: "x" | "z" = spanX >= spanZ ? "x" : "z";
  const perpAxis: "x" | "z" = primaryAxis === "x" ? "z" : "x";
  const primarySpan = Math.max(spanX, spanZ);
  const perpSpan = Math.min(spanX, spanZ);
  const evidenceRefs = editEvents.flatMap((event) => event.evidence_refs);
  const hypotheses: HelixMinecraftPatternHypothesis[] = [];

  let descendingScore = 0;
  for (let index = 1; index < brokenEdits.length; index += 1) {
    const previous = brokenEdits[index - 1];
    const current = brokenEdits[index];
    const primaryDelta = Math.abs(current.location[primaryAxis] - previous.location[primaryAxis]);
    const yDelta = current.location.y - previous.location.y;
    if (primaryDelta <= 2 && primaryDelta >= 0 && yDelta <= 0 && yDelta >= -2) {
      descendingScore += 1;
    }
  }
  const descendingLikely =
    brokenEdits.length >= 6 &&
    primarySpan >= 3 &&
    (input.verticalChange ?? 0) <= -2 &&
    descendingScore >= Math.max(3, Math.floor(brokenEdits.length * 0.45));
  if (descendingLikely) {
    hypotheses.push(
      buildHypothesis({
        type: "descending_stair",
        intent: "The player appears to be carving a descending mine stair or stepped access path.",
        confidence: 0.58 + Math.min(0.28, descendingScore / Math.max(1, brokenEdits.length) * 0.3),
        evidence_refs: evidenceRefs,
        missing_evidence: ["Stair intent is inferred from edit geometry; no explicit sign or user statement was observed."],
      }),
    );
  }

  const linesByPerp = new Map<number, HelixMinecraftSpatialEvent[]>();
  for (const event of brokenEdits) {
    const key = Math.round(event.location[perpAxis]);
    const group = linesByPerp.get(key) ?? [];
    group.push(event);
    linesByPerp.set(key, group);
  }
  const candidateLines = Array.from(linesByPerp.entries())
    .filter(([, group]) => group.length >= 3)
    .sort((a, b) => b[1].length - a[1].length);
  let parallelLineEvidence: HelixMinecraftSpatialEvent[] = [];
  for (let left = 0; left < candidateLines.length; left += 1) {
    for (let right = left + 1; right < candidateLines.length; right += 1) {
      const gap = Math.abs(candidateLines[left][0] - candidateLines[right][0]);
      if (gap >= 1 && gap <= 2) {
        parallelLineEvidence = [...candidateLines[left][1], ...candidateLines[right][1]];
        break;
      }
    }
    if (parallelLineEvidence.length > 0) break;
  }
  const parallelTrenchLikely = primarySpan >= 3 && parallelLineEvidence.length >= 6;
  if (parallelTrenchLikely) {
    hypotheses.push(
      buildHypothesis({
        type: "parallel_trench",
        intent: "The player appears to be cutting a side trench parallel to the main path.",
        confidence: 0.56 + Math.min(0.24, parallelLineEvidence.length / Math.max(1, brokenEdits.length) * 0.25),
        evidence_refs: parallelLineEvidence.flatMap((event) => event.evidence_refs),
        missing_evidence: ["The trench purpose is not proven until fluid, lighting, or an explicit objective is observed."],
      }),
    );
  }

  const lavaEvents = events.filter((event) =>
    event.event_type === "bucket_empty" ||
    event.event_type === "fluid_changed" ||
    event.environment?.nearby_fluids?.some((fluid) => fluid.type === "lava") ||
    includesMinecraftName(blockText(event), "lava"),
  );
  const lightSamples = events
    .map((event) => event.environment?.light_level)
    .filter((level): level is number => typeof level === "number" && Number.isFinite(level));
  const lightIncrease =
    lightSamples.length >= 2 ? lightSamples.at(-1)! - lightSamples[0] : 0;
  if (parallelTrenchLikely && lavaEvents.length > 0) {
    hypotheses.push(
      buildHypothesis({
        type: "lava_lighting_channel",
        intent: "The side trench may be intended as a lava-lit channel beside the path.",
        confidence: 0.72 + Math.min(0.16, lavaEvents.length * 0.04) + (lightIncrease > 2 ? 0.08 : 0),
        evidence_refs: [...parallelLineEvidence, ...lavaEvents].flatMap((event) => event.evidence_refs),
        missing_evidence: lightIncrease > 2 ? [] : ["Light increase was not clearly sampled after lava evidence."],
      }),
    );
  } else if (parallelTrenchLikely && descendingLikely) {
    const existing = hypotheses.find((hypothesis) => hypothesis.structure_type === "parallel_trench");
    if (existing) {
      existing.intent_hypothesis = "The player appears to be carving a descending mine stair with a side trench, possibly preparing a channel beside the stairs.";
      existing.missing_evidence = uniqueStrings([
        ...existing.missing_evidence,
        "No lava placement or bucket-empty event has been observed yet.",
      ]);
    }
  }

  const lowVerticalRange = spanY <= 1;
  if (brokenEdits.length >= 8 && primarySpan >= 8 && lowVerticalRange && perpSpan <= 2) {
    hypotheses.push(
      buildHypothesis({
        type: "strip_mine",
        intent: "The player appears to be cutting a long, mostly level mining tunnel.",
        confidence: 0.68,
        evidence_refs: evidenceRefs,
        missing_evidence: [],
      }),
    );
  }

  if (brokenEdits.length >= 6 && spanY >= 5 && spanX <= 2 && spanZ <= 2) {
    hypotheses.push(
      buildHypothesis({
        type: "vertical_shaft",
        intent: "The player appears to be opening a mostly vertical shaft.",
        confidence: 0.72,
        evidence_refs: evidenceRefs,
        missing_evidence: ["Shaft safety context depends on ladder, water, or escape-path evidence."],
      }),
    );
  }

  const oreEdits = brokenEdits.filter((event) => /\b(?:ore|copper|iron|coal|diamond|redstone|gold|lapis|emerald)\b/.test(blockText(event)));
  if (oreEdits.length >= 3 && primarySpan <= 5 && spanY <= 4 && spanZ <= 5) {
    hypotheses.push(
      buildHypothesis({
        type: "resource_vein_following",
        intent: "The player appears to be following a compact ore/resource cluster.",
        confidence: 0.7,
        evidence_refs: oreEdits.flatMap((event) => event.evidence_refs),
        missing_evidence: [],
      }),
    );
  }

  return hypotheses.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}
