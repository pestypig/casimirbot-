import type {
  StagePlayLiveSourceImmersionStateV1,
  StagePlayLiveSourceMailItemV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import type { StagePlayLiveSourceInterpreterProfileV1 } from "@shared/contracts/stage-play-live-source-interpreter-profile.v1";

export type StagePlayLiveSourceDeltaExtractionResultV1 = Pick<
  StagePlayLiveSourceImmersionStateV1,
  | "sourceIdentity"
  | "stableFacts"
  | "currentSceneFacts"
  | "changedFacts"
  | "uncertainties"
  | "currentActivity"
  | "salience"
> & {
  watchTargets: string[];
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const normalizeText = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsTerm = (text: string, term: string): boolean => {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return false;
  if (normalizedTerm.includes(" ")) return text.includes(normalizedTerm);
  return new RegExp(`(?:^|\\s)${escapeRegExp(normalizedTerm)}(?:\\s|$)`).test(text);
};

const includesAny = (text: string, terms: string[]): boolean =>
  terms.some((term) => containsTerm(text, term));

const matchingTerms = (text: string, terms: string[]): string[] =>
  uniqueStrings(terms.filter((term) => containsTerm(text, term)));

const previewText = (text: string, limit = 220): string => {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, Math.max(0, limit - 3)).trimEnd()}...` : normalized;
};

const hazardMatchText = (text: string): string =>
  text
    .replace(/\bdecorative fire\b/g, " ")
    .replace(/\bfurnace fire\b/g, " ")
    .replace(/\bactive furnaces?\b/g, " ")
    .replace(/\bfire behind glass\b/g, " ");

const MINECRAFT_TERMS = [
  "minecraft",
  "block",
  "blocks",
  "crafting",
  "chest",
  "pickaxe",
  "creeper",
  "zombie",
  "skeleton",
  "ore",
  "torch",
  "inventory",
  "hotbar",
  "villager",
];

const INVENTORY_TERMS = ["inventory", "chest", "hotbar", "item slot", "items", "stored items"];
const INTERIOR_TERMS = ["interior", "base", "house", "building", "inside", "chest", "crafting table", "furnace", "bed"];
const OUTDOOR_TERMS = ["tree", "trees", "grass", "forest", "outdoor", "outside", "sky", "night", "daylight", "mountain"];
const COMBAT_TERMS = [
  "on fire",
  "fire damage",
  "burning",
  "damage",
  "damaged",
  "low health",
  "hostile",
  "hostile mob",
  "creeper",
  "zombie",
  "skeleton",
  "combat",
  "attack",
  "lava",
];
const CAVE_TERMS = ["cave", "stone", "underground", "mine", "mining", "ore", "rocky"];
const BUILDING_TERMS = ["building", "crafting", "placing blocks", "construction", "structure"];
const TRANSITION_TERMS = ["transition", "changed", "moved", "returns", "returned", "switches", "opens", "closes"];

const factsForText = (text: string): string[] => {
  const facts: string[] = [];
  if (includesAny(text, INVENTORY_TERMS)) facts.push("inventory or storage interface cues are visible");
  if (includesAny(text, INTERIOR_TERMS)) facts.push("interior/base cues are visible");
  if (includesAny(text, OUTDOOR_TERMS)) facts.push("outdoor exploration cues are visible");
  if (includesAny(text, COMBAT_TERMS)) facts.push("combat, fire, damage, or hostile cue is visible");
  if (includesAny(text, CAVE_TERMS)) facts.push("cave, stone, mining, or low-light cue is visible");
  if (includesAny(text, BUILDING_TERMS)) facts.push("building or crafting cue is visible");
  if (includesAny(text, TRANSITION_TERMS)) facts.push("scene transition or action change cue is visible");
  return facts;
};

const inferCurrentActivity = (
  text: string,
): StagePlayLiveSourceImmersionStateV1["currentActivity"] => {
  if (includesAny(text, COMBAT_TERMS)) return "combat_or_damage";
  if (includesAny(text, CAVE_TERMS)) return "mining_or_cave";
  if (includesAny(text, INVENTORY_TERMS)) return "inventory_management";
  if (includesAny(text, BUILDING_TERMS)) return "building_or_crafting";
  if (includesAny(text, INTERIOR_TERMS)) return "interior_base";
  if (includesAny(text, OUTDOOR_TERMS)) return "outdoor_exploration";
  if (includesAny(text, TRANSITION_TERMS)) return "scene_transition";
  return "unknown";
};

const sourceIdentityFor = (input: {
  text: string;
  priorImmersionState?: StagePlayLiveSourceImmersionStateV1 | null;
  activeProfile?: StagePlayLiveSourceInterpreterProfileV1 | null;
}): StagePlayLiveSourceImmersionStateV1["sourceIdentity"] => {
  const prior = input.priorImmersionState?.sourceIdentity;
  const profileMinecraft = input.activeProfile?.domain === "minecraft";
  const textMinecraft = includesAny(input.text, MINECRAFT_TERMS);
  if (textMinecraft || profileMinecraft) {
    return {
      label: "Minecraft visual source",
      confidence: textMinecraft ? 0.86 : Math.max(0.68, prior?.confidence ?? 0),
      stable: Boolean(prior?.stable || textMinecraft),
    };
  }
  if (prior) return prior;
  return {
    label: "unknown live source",
    confidence: 0,
    stable: false,
  };
};

const stableFactsFor = (input: {
  text: string;
  sourceIdentity: StagePlayLiveSourceImmersionStateV1["sourceIdentity"];
  priorImmersionState?: StagePlayLiveSourceImmersionStateV1 | null;
}): string[] => {
  const facts: string[] = [...(input.priorImmersionState?.stableFacts ?? [])];
  if (input.sourceIdentity.label.toLowerCase().includes("minecraft")) {
    facts.push("Minecraft-like visual domain");
  }
  if (includesAny(input.text, ["hotbar", "inventory", "player", "first-person", "pov"])) {
    facts.push("player-view game UI cues");
  }
  if (includesAny(input.text, ["block", "blocks", "minecraft"])) {
    facts.push("block-world visual grammar");
  }
  return uniqueStrings(facts);
};

const salienceFor = (input: {
  text: string;
  activeProfile?: StagePlayLiveSourceInterpreterProfileV1 | null;
}): StagePlayLiveSourceImmersionStateV1["salience"] => {
  const reasons: string[] = [];
  const riskText = hazardMatchText(input.text);
  const riskMatches = matchingTerms(riskText, [
    ...COMBAT_TERMS,
    ...(input.activeProfile?.riskCriteria ?? []),
    ...(input.activeProfile?.voiceCalloutCriteria ?? []),
  ]);
  const salienceMatches = matchingTerms(input.text, input.activeProfile?.salienceCriteria ?? []);
  if (riskMatches.length > 0) reasons.push(`risk/voice criteria matched: ${riskMatches.join(", ")}`);
  if (salienceMatches.length > 0) reasons.push(`profile salience matched: ${salienceMatches.join(", ")}`);
  if (includesAny(input.text, CAVE_TERMS)) reasons.push("cave/mining context may require closer watch");
  if (includesAny(input.text, TRANSITION_TERMS)) reasons.push("scene or action transition cue");
  const urgent = riskMatches.some((term) => includesAny(term, ["creeper", "lava", "fire", "damage", "hostile"]));
  const high = riskMatches.length > 0;
  const medium = reasons.length > 0;
  return {
    level: urgent ? "urgent" : high ? "high" : medium ? "medium" : "low",
    reasons: uniqueStrings(reasons),
    voiceCandidate: urgent || matchingTerms(riskText, input.activeProfile?.voiceCalloutCriteria ?? []).length > 0,
  };
};

const watchTargetsFor = (input: {
  text: string;
  currentActivity: StagePlayLiveSourceImmersionStateV1["currentActivity"];
  activeProfile?: StagePlayLiveSourceInterpreterProfileV1 | null;
}): string[] => {
  const targets: string[] = [];
  if (input.currentActivity === "combat_or_damage") {
    targets.push("damage recovery", "hostile mob position", "weapon use", "health/fire cues");
  }
  if (input.currentActivity === "mining_or_cave") {
    targets.push("low light", "lava", "ore discovery", "hostile mob emergence");
  }
  if (input.currentActivity === "inventory_management" || input.currentActivity === "interior_base") {
    targets.push("inventory or chest contents", "crafting choice", "return to exploration");
  }
  if (input.currentActivity === "outdoor_exploration") {
    targets.push("route change", "terrain transition", "mob or resource appearance");
  }
  if (input.currentActivity === "building_or_crafting") {
    targets.push("placed blocks", "crafted item", "structure completion");
  }
  if (input.currentActivity === "scene_transition") {
    targets.push("new active scene", "opened interface", "replaced visual context");
  }
  if (includesAny(input.text, TRANSITION_TERMS)) {
    targets.push("whether the transition continues or reverses");
  }
  targets.push(...(input.activeProfile?.salienceCriteria ?? []));
  targets.push(...(input.activeProfile?.voiceCalloutCriteria ?? []));
  return uniqueStrings(targets).slice(0, 12);
};

export function extractStagePlayLiveSourceDelta(input: {
  latestMailItems: StagePlayLiveSourceMailItemV1[];
  priorImmersionState?: StagePlayLiveSourceImmersionStateV1 | null;
  activeProfile?: StagePlayLiveSourceInterpreterProfileV1 | null;
}): StagePlayLiveSourceDeltaExtractionResultV1 {
  const summaries = input.latestMailItems.map((item) => item.summary.text || item.summary.preview);
  const joinedSummary = normalizeText(summaries.join("\n"));
  const latestSummary = previewText(input.latestMailItems.at(-1)?.summary.preview ?? summaries.at(-1) ?? "");
  const sourceIdentity = sourceIdentityFor({
    text: joinedSummary,
    priorImmersionState: input.priorImmersionState ?? null,
    activeProfile: input.activeProfile ?? null,
  });
  const currentActivity = inferCurrentActivity(joinedSummary);
  const currentSceneFacts = uniqueStrings([
    ...factsForText(joinedSummary),
    latestSummary ? `latest compact summary: ${latestSummary}` : null,
  ]);
  const priorFacts = new Set([
    ...(input.priorImmersionState?.stableFacts ?? []),
    ...(input.priorImmersionState?.currentSceneFacts ?? []),
  ].map((fact) => fact.toLowerCase()));
  const changedFacts = currentSceneFacts.filter((fact) => !priorFacts.has(fact.toLowerCase()));
  const uncertainties = uniqueStrings([
    ...(input.priorImmersionState?.uncertainties ?? []),
    input.latestMailItems.length === 0 ? "No latest mail items were provided for delta extraction." : null,
    "Delta extraction is heuristic and based only on compact mail summaries.",
  ]);
  const salience = salienceFor({
    text: joinedSummary,
    activeProfile: input.activeProfile ?? null,
  });
  return {
    sourceIdentity,
    stableFacts: stableFactsFor({
      text: joinedSummary,
      sourceIdentity,
      priorImmersionState: input.priorImmersionState ?? null,
    }),
    currentSceneFacts,
    changedFacts,
    uncertainties,
    currentActivity,
    salience,
    watchTargets: watchTargetsFor({
      text: joinedSummary,
      currentActivity,
      activeProfile: input.activeProfile ?? null,
    }),
  };
}
