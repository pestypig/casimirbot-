import crypto from "node:crypto";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import {
  HELIX_MINECRAFT_SEED_MAP_CLAIM_SCHEMA,
  HELIX_MINECRAFT_SEED_MAP_QUERY_SCHEMA,
  HELIX_MINECRAFT_SEED_MAP_RESULT_SCHEMA,
  type HelixMinecraftEdition,
  type HelixMinecraftSeedMapClaim,
  type HelixMinecraftSeedMapClaimKind,
  type HelixMinecraftSeedMapQuery,
  type HelixMinecraftSeedMapResult,
} from "@shared/helix-minecraft-seed-map";
import type { HelixMinecraftSpatialEvent } from "@shared/helix-minecraft-spatial-event";

export interface MinecraftSeedMapProvider {
  readonly provider_id: string;
  readonly provider_kind: HelixMinecraftSeedMapResult["provider_kind"];
  querySeedMap(query: HelixMinecraftSeedMapQuery): HelixMinecraftSeedMapResult;
}

type FixtureClaimTemplate = {
  kind: HelixMinecraftSeedMapClaimKind;
  label: string;
  dx: number;
  dz: number;
  y?: number | null;
  confidence: number;
  limitations: string[];
};

const FIXTURE_TEMPLATES: FixtureClaimTemplate[] = [
  {
    kind: "structure_candidate",
    label: "village candidate",
    dx: 620,
    dz: -180,
    y: null,
    confidence: 0.66,
    limitations: ["target_y_unknown", "structure position is chunk-level approximate"],
  },
  {
    kind: "structure_candidate",
    label: "ruined portal candidate",
    dx: -420,
    dz: 340,
    y: null,
    confidence: 0.58,
    limitations: ["target_y_unknown", "structure false-positive possible"],
  },
  {
    kind: "biome",
    label: "plains/forest biome band",
    dx: 320,
    dz: -96,
    y: null,
    confidence: 0.7,
    limitations: ["biome boundary approximate"],
  },
  {
    kind: "slime_chunk",
    label: "slime chunk candidate",
    dx: 96,
    dz: 96,
    y: null,
    confidence: 0.55,
    limitations: ["chunk-level claim only", "requires in-world confirmation"],
  },
];

const SEED_FORECAST_LIMITATIONS = [
  "not player-observed",
  "seed/version mismatch possible",
  "Y coordinate may be unknown",
  "structure candidate may be approximate",
  "mods/datapacks may invalidate forecast",
  "generated baseline may differ from current player-modified world",
] as const;

const stableJson = (value: unknown): string => JSON.stringify(value);
const hashShort = (value: unknown, size = 12): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
};

const readString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "bigint") return value.toString();
  }
  return null;
};

const readStringArray = (...values: unknown[]): string[] => {
  for (const value of values) {
    if (Array.isArray(value)) return value.map((entry) => String(entry ?? "").trim()).filter(Boolean);
    if (typeof value === "string" && value.trim()) {
      return value.split(",").map((entry) => entry.trim()).filter(Boolean);
    }
  }
  return [];
};

const normalizeEdition = (value: string | null): HelixMinecraftEdition =>
  value?.toLowerCase() === "bedrock" ? "bedrock" : "java";

const chunkFor = (position: { x: number; z: number }): { x: number; z: number } => ({
  x: Math.floor(position.x / 16),
  z: Math.floor(position.z / 16),
});

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

const seedNudge = (query: HelixMinecraftSeedMapQuery, axis: "x" | "z"): number => {
  const hash = parseInt(hashShort([query.seed, query.minecraft_version, axis], 6), 16);
  return (hash % 9) - 4;
};

export class FixtureMinecraftSeedMapProvider implements MinecraftSeedMapProvider {
  readonly provider_id = "minecraft_seed_map_provider:fixture:v1";
  readonly provider_kind = "fixture" as const;

  querySeedMap(query: HelixMinecraftSeedMapQuery): HelixMinecraftSeedMapResult {
    const selected = query.selected_target_label?.toLowerCase() ?? null;
    const claims = FIXTURE_TEMPLATES
      .filter((template) => {
        if (!selected) return true;
        return template.label.toLowerCase().includes(selected) || selected.includes(template.label.toLowerCase());
      })
      .map((template) => {
        const position = {
          x: Math.round(query.center.x + template.dx + seedNudge(query, "x")),
          z: Math.round(query.center.z + template.dz + seedNudge(query, "z")),
          y: template.y ?? null,
        };
        const claim: HelixMinecraftSeedMapClaim = {
          schema: HELIX_MINECRAFT_SEED_MAP_CLAIM_SCHEMA,
          claim_id: `minecraft_seed_map_claim:${hashShort([query.query_id, template.kind, template.label, position], 18)}`,
          query_id: query.query_id,
          room_id: query.room_id,
          world_id: query.world_id,
          evidence_layer: "seed_forecast",
          evidence_trust: "seed_forecast",
          instruction_authority: "none",
          ask_context_policy: "evidence_only",
          kind: template.kind,
          dimension: query.dimension,
          position,
          chunk: chunkFor(position),
          label: template.label,
          confidence: clamp(template.confidence),
          seed: query.seed,
          minecraft_version: query.minecraft_version,
          edition: query.edition,
          source: "seed_worldgen",
          sensor_scope: "sensor_observable",
          limitations: Array.from(new Set([
            "version-sensitive",
            ...SEED_FORECAST_LIMITATIONS,
            ...template.limitations,
          ])),
          may_support_recommendation: false,
          evidence_refs: query.evidence_refs.length > 0 ? query.evidence_refs : [`seed_map:${query.world_id}:${query.query_id}`],
          raw_user_text_included: false,
          derived_by_deterministic_reducer: true,
          creates_ask_turn: false,
          turn_triggered: false,
          ask_instruction_authority: "none",
          context_role: "tool_evidence",
          ts: query.ts,
          deterministic: true,
          model_invoked: false,
          context_policy: "compact_context_pack_only",
          raw_logs_included: false,
        };
        return claim;
      });

    return {
      schema: HELIX_MINECRAFT_SEED_MAP_RESULT_SCHEMA,
      result_id: `minecraft_seed_map_result:${hashShort([query.query_id, claims.map((claim) => claim.claim_id)], 18)}`,
      query,
      claims,
      provider_id: this.provider_id,
      provider_kind: this.provider_kind,
      limitations: [
        "Fixture provider only; no native Cubiomes/worldgen adapter invoked.",
        "Claims are deterministic cartography hints, not player-observed knowledge.",
        "Structure candidates may lack Y coordinates and require in-world confirmation.",
      ],
      evidence_trust: "seed_forecast",
      instruction_authority: "none",
      ask_context_policy: "evidence_only",
      evidence_layer: "seed_forecast",
      raw_user_text_included: false,
      derived_by_deterministic_reducer: true,
      creates_ask_turn: false,
      turn_triggered: false,
      ask_instruction_authority: "none",
      context_role: "tool_evidence",
      deterministic: true,
      model_invoked: false,
      context_policy: "compact_context_pack_only",
      raw_logs_included: false,
    };
  }
}

let activeProvider: MinecraftSeedMapProvider = new FixtureMinecraftSeedMapProvider();

export const getMinecraftSeedMapProvider = (): MinecraftSeedMapProvider => activeProvider;

export const setMinecraftSeedMapProviderForTest = (provider: MinecraftSeedMapProvider): void => {
  activeProvider = provider;
};

export const resetMinecraftSeedMapProviderForTest = (): void => {
  activeProvider = new FixtureMinecraftSeedMapProvider();
};

export function buildMinecraftSeedMapQueryFromWorldEvent(input: {
  event: HelixWorldEvent;
  spatialEvent?: HelixMinecraftSpatialEvent | null;
}): HelixMinecraftSeedMapQuery | null {
  const meta = readRecord(input.event.meta);
  const location = readRecord(input.event.location);
  const seedMap = readRecord(meta?.seed_map) ?? readRecord(meta?.worldgen) ?? meta;
  const seed = readString(seedMap?.seed, meta?.seed, meta?.minecraft_seed, meta?.world_seed);
  const minecraftVersion = readString(
    seedMap?.minecraft_version,
    seedMap?.version,
    meta?.minecraft_version,
    meta?.version,
  );
  if (!seed || !minecraftVersion) return null;

  const selectedWaypoint = readRecord(seedMap?.selected_waypoint) ?? readRecord(meta?.selected_waypoint);
  const centerX = readNumber(
    readRecord(seedMap?.center)?.x,
    seedMap?.center_x,
    input.spatialEvent?.location.x,
    location?.x,
    location?.block_x,
  );
  const centerZ = readNumber(
    readRecord(seedMap?.center)?.z,
    seedMap?.center_z,
    input.spatialEvent?.location.z,
    location?.z,
    location?.block_z,
  );
  if (centerX === null || centerZ === null) return null;

  const radiusChunks = readNumber(seedMap?.radius_chunks, meta?.seed_map_radius_chunks) ?? 48;
  const dimension = readString(
    seedMap?.dimension,
    input.spatialEvent?.dimension,
    location?.dimension,
    meta?.dimension,
  ) ?? "minecraft:overworld";
  const evidenceRefs = input.event.evidence_refs.length > 0
    ? input.event.evidence_refs
    : [`minecraft:${input.event.world_id}:${input.event.ts}:${input.event.event_type}`];

  return {
    schema: HELIX_MINECRAFT_SEED_MAP_QUERY_SCHEMA,
    query_id: `minecraft_seed_map_query:${hashShort([
      input.event.room_id,
      input.event.world_id,
      seed,
      minecraftVersion,
      dimension,
      centerX,
      centerZ,
      radiusChunks,
    ], 18)}`,
    room_id: input.event.room_id,
    world_id: input.event.world_id,
    seed,
    minecraft_version: minecraftVersion,
    edition: normalizeEdition(readString(seedMap?.edition, meta?.edition)),
    dimension,
    center: { x: centerX, z: centerZ },
    radius_chunks: Math.max(1, Math.floor(radiusChunks)),
    worldgen_flags: readStringArray(seedMap?.worldgen_flags, meta?.worldgen_flags),
    selected_target_label: readString(
      selectedWaypoint?.label,
      seedMap?.selected_target_label,
      seedMap?.target_label,
      meta?.seed_map_target_label,
    ),
    evidence_refs: evidenceRefs,
    evidence_trust: "seed_forecast",
    instruction_authority: "none",
    ask_context_policy: "evidence_only",
    raw_user_text_included: false,
    derived_by_deterministic_reducer: true,
    creates_ask_turn: false,
    turn_triggered: false,
    ask_instruction_authority: "none",
    context_role: "tool_evidence",
    ts: input.event.ts,
    deterministic: true,
    model_invoked: false,
    context_policy: "compact_context_pack_only",
    raw_logs_included: false,
  };
}
