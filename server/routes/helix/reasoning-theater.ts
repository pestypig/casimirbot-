import { Router, type Response } from "express";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadCodeLattice } from "../../services/code-lattice/loader";

type FrontierAction =
  | "large_gain"
  | "small_gain"
  | "steady"
  | "small_loss"
  | "large_loss"
  | "hard_drop";

type ReasoningTheaterRetrievalZone = "mapped_connected" | "owned_frontier" | "uncharted";
type ReasoningTheaterPresentationMode =
  | "convergence_strip_v1"
  | "atlas_dag_focus_v1"
  | "congruence_dag_atlas_v1"
  | "congruence_route_focus_v1"
  | "congruence_constellation_v2";

type ReasoningTheaterZoneGraphFocusConfig = {
  enabled: boolean;
  max_visible_nodes: number;
  max_visible_edges: number;
  hop_limit: number;
  neighbor_cap_per_node: number;
  camera_padding_pct: number;
  camera_lerp: number;
  indicator_ms: number;
  objective_reaction_ms: number;
};

type FrontierConfigResponse = {
  version: string;
  frontier_actions: {
    window_ms: number;
    switch_hold_frames: number;
    min_action_ms: number;
    thresholds: {
      hard_drop_delta_pct: number;
      large_gain_delta_pct: number;
      small_gain_delta_pct: number;
      large_loss_delta_pct: number;
      small_loss_delta_pct: number;
    };
    actions: Record<
      FrontierAction,
      {
        icon_path: string;
        particle_profile: {
          color: string;
          base_direction_deg: number;
          spread_deg: number;
          speed_min_px_s: number;
          speed_max_px_s: number;
          turbulence: number;
          emit_rate_hz: number;
          transition_burst: boolean;
          shock_ring: boolean;
        };
      }
    >;
  };
  retrieval_zone_layer: {
    enabled: boolean;
    node_count_dense: number;
    pulse_ms: number;
    hold_ms: number;
    open_world_label: string;
    zones: Record<
      ReasoningTheaterRetrievalZone,
      {
        base_color: string;
        active_color: string;
        edge_opacity: number;
      }
    >;
    motion: {
      enabled: boolean;
      sweep_band_width_pct: number;
      sweep_falloff_pct: number;
      node_frontier_boost: number;
      node_zone_boost: number;
      edge_frontier_boost: number;
      edge_zone_boost: number;
      breath_hz_base: number;
      breath_hz_gain: number;
      dash_px: number;
      dash_gap_px: number;
      sweep_opacity_min: number;
      sweep_opacity_max: number;
    };
    presentation: {
      mode: ReasoningTheaterPresentationMode;
      symbolic_model: "constellation_weave";
      literality: "exact_plus_aura";
      zone_presence: "ambient_only";
      map_text: "none";
      constellation_node_budget: number;
      aura_hop_limit: number;
      aura_opacity_max: number;
      thread_count_per_edge: number;
      trace_scope: "primary_only";
      camera_mode: "fixed";
      path_mode: "full_path_with_event_flow";
      progress_encoding: "leaf_beacon_route_flux";
      no_exact_fallback: "tree_pulse_only";
      show_root_leaf_markers: boolean;
      caption_mode: "one_line";
      causality_encoding: "map_only";
      provenance_mode: "strict_exact_only";
      labels: "none";
      show_open_world_text_chip: boolean;
      core_reaction_ms: number;
      event_pulse_ms: number;
      event_hold_ms: number;
      path_fade_ms: number;
      max_exact_paths_per_event: number;
      show_phase_tick: boolean;
      show_caption: boolean;
      show_reply_snapshot: boolean;
      collapse_pulse_ms: number;
      lane_hold_ms: number;
      unknown_policy: "explicit";
    };
    graph_focus: ReasoningTheaterZoneGraphFocusConfig;
  };
};

type ReasoningTheaterTopologyResponse = {
  version: string;
  generated_at: string;
  baseline: {
    owned_total: number;
    connected_owned: number;
    owned_not_connected: number;
    convergence_ratio: number;
  };
  sources: {
    owned_source: "git_tracked" | "code_lattice_fallback";
    connected_source: "atlas_corpus";
    atlas_unique_files: number;
    atlas_existing_files: number;
    degraded: boolean;
  };
  display: {
    node_density_mode: "dense";
    total_nodes: number;
    connected_nodes: number;
    frontier_nodes: number;
    uncharted_nodes: number;
    seed: number;
  };
};

type ReasoningTheaterAtlasGraphNode = {
  id: string;
  path: string;
  zone: "mapped_connected" | "owned_frontier";
  x: number;
  y: number;
  degree: number;
};

type ReasoningTheaterAtlasGraphEdge = {
  id: string;
  from: string;
  to: string;
  weight: number;
};

type ReasoningTheaterAtlasGraphResponse = {
  version: string;
  generated_at: string;
  seed: number;
  baseline: ReasoningTheaterTopologyResponse["baseline"];
  stats: {
    nodes_total: number;
    edges_total: number;
    mapped_connected_nodes: number;
    owned_frontier_nodes: number;
    uncharted_nodes: number;
    degraded: boolean;
  };
  nodes: ReasoningTheaterAtlasGraphNode[];
  edges: ReasoningTheaterAtlasGraphEdge[];
};

type ReasoningTheaterCongruenceGraphTree = {
  id: string;
  label: string;
  root_id: string | null;
  node_count: number;
};

type ReasoningTheaterCongruenceGraphNode = {
  id: string;
  tree_id: string;
  node_id: string;
  title: string;
  zone: "mapped_connected" | "owned_frontier";
  atlas_linked: boolean;
  x: number;
  y: number;
  degree: number;
  depth: number;
};

type ReasoningTheaterCongruenceGraphEdge = {
  id: string;
  tree_id: string;
  from: string;
  to: string;
  rel: string;
  edge_type: string;
  requires_cl: string | null;
  weight: number;
};

type ReasoningTheaterCongruenceGraphResponse = {
  version: string;
  generated_at: string;
  seed: number;
  baseline: ReasoningTheaterTopologyResponse["baseline"];
  stats: {
    trees_total: number;
    nodes_total: number;
    edges_total: number;
    mapped_connected_nodes: number;
    owned_frontier_nodes: number;
    uncharted_nodes: number;
    degraded: boolean;
  };
  trees: ReasoningTheaterCongruenceGraphTree[];
  nodes: ReasoningTheaterCongruenceGraphNode[];
  edges: ReasoningTheaterCongruenceGraphEdge[];
};

const DEFAULT_FRONTIER_CONFIG: FrontierConfigResponse = {
  version: "reasoning_theater.v1",
  frontier_actions: {
    window_ms: 200,
    switch_hold_frames: 4,
    min_action_ms: 180,
    thresholds: {
      hard_drop_delta_pct: -8,
      large_gain_delta_pct: 3,
      small_gain_delta_pct: 0.8,
      large_loss_delta_pct: -3,
      small_loss_delta_pct: -0.8,
    },
    actions: {
      large_gain: {
        icon_path: "/reasoning-theater/frontier-actions/large_gain.svg",
        particle_profile: {
          color: "#34D399",
          base_direction_deg: 0,
          spread_deg: 12,
          speed_min_px_s: 84,
          speed_max_px_s: 128,
          turbulence: 0.16,
          emit_rate_hz: 24,
          transition_burst: true,
          shock_ring: false,
        },
      },
      small_gain: {
        icon_path: "/reasoning-theater/frontier-actions/small_gain.svg",
        particle_profile: {
          color: "#22D3EE",
          base_direction_deg: 0,
          spread_deg: 18,
          speed_min_px_s: 36,
          speed_max_px_s: 72,
          turbulence: 0.14,
          emit_rate_hz: 12,
          transition_burst: false,
          shock_ring: false,
        },
      },
      steady: {
        icon_path: "/reasoning-theater/frontier-actions/steady.svg",
        particle_profile: {
          color: "#94A3B8",
          base_direction_deg: 0,
          spread_deg: 30,
          speed_min_px_s: 10,
          speed_max_px_s: 24,
          turbulence: 0.08,
          emit_rate_hz: 4,
          transition_burst: false,
          shock_ring: false,
        },
      },
      small_loss: {
        icon_path: "/reasoning-theater/frontier-actions/small_loss.svg",
        particle_profile: {
          color: "#F59E0B",
          base_direction_deg: 180,
          spread_deg: 20,
          speed_min_px_s: 36,
          speed_max_px_s: 72,
          turbulence: 0.34,
          emit_rate_hz: 12,
          transition_burst: false,
          shock_ring: false,
        },
      },
      large_loss: {
        icon_path: "/reasoning-theater/frontier-actions/large_loss.svg",
        particle_profile: {
          color: "#FB7185",
          base_direction_deg: 180,
          spread_deg: 16,
          speed_min_px_s: 72,
          speed_max_px_s: 118,
          turbulence: 0.55,
          emit_rate_hz: 22,
          transition_burst: true,
          shock_ring: false,
        },
      },
      hard_drop: {
        icon_path: "/reasoning-theater/frontier-actions/hard_drop.svg",
        particle_profile: {
          color: "#EF4444",
          base_direction_deg: 205,
          spread_deg: 38,
          speed_min_px_s: 96,
          speed_max_px_s: 150,
          turbulence: 0.82,
          emit_rate_hz: 30,
          transition_burst: true,
          shock_ring: true,
        },
      },
    },
  },
  retrieval_zone_layer: {
    enabled: true,
    node_count_dense: 120,
    pulse_ms: 1200,
    hold_ms: 260,
    open_world_label: "open-world",
    zones: {
      mapped_connected: {
        base_color: "#0F766E",
        active_color: "#22D3EE",
        edge_opacity: 0.44,
      },
      owned_frontier: {
        base_color: "#475569",
        active_color: "#F59E0B",
        edge_opacity: 0.38,
      },
      uncharted: {
        base_color: "#1F2937",
        active_color: "#FB7185",
        edge_opacity: 0.32,
      },
    },
    motion: {
      enabled: true,
      sweep_band_width_pct: 14,
      sweep_falloff_pct: 10,
      node_frontier_boost: 0.52,
      node_zone_boost: 0.48,
      edge_frontier_boost: 0.34,
      edge_zone_boost: 0.22,
      breath_hz_base: 0.45,
      breath_hz_gain: 1.1,
      dash_px: 1.6,
      dash_gap_px: 2.8,
      sweep_opacity_min: 0.08,
      sweep_opacity_max: 0.42,
    },
    presentation: {
      mode: "convergence_strip_v1",
      symbolic_model: "constellation_weave",
      literality: "exact_plus_aura",
      zone_presence: "ambient_only",
      map_text: "none",
      constellation_node_budget: 96,
      aura_hop_limit: 1,
      aura_opacity_max: 0.22,
      thread_count_per_edge: 2,
      trace_scope: "primary_only",
      camera_mode: "fixed",
      path_mode: "full_path_with_event_flow",
      progress_encoding: "leaf_beacon_route_flux",
      no_exact_fallback: "tree_pulse_only",
      show_root_leaf_markers: true,
      caption_mode: "one_line",
      causality_encoding: "map_only",
      provenance_mode: "strict_exact_only",
      labels: "none",
      show_open_world_text_chip: true,
      core_reaction_ms: 480,
      event_pulse_ms: 720,
      event_hold_ms: 180,
      path_fade_ms: 900,
      max_exact_paths_per_event: 12,
      show_phase_tick: true,
      show_caption: true,
      show_reply_snapshot: true,
      collapse_pulse_ms: 520,
      lane_hold_ms: 220,
      unknown_policy: "explicit",
    },
    graph_focus: {
      enabled: true,
      max_visible_nodes: 120,
      max_visible_edges: 280,
      hop_limit: 3,
      neighbor_cap_per_node: 8,
      camera_padding_pct: 0.12,
      camera_lerp: 0.22,
      indicator_ms: 520,
      objective_reaction_ms: 480,
    },
  },
};

const CONFIG_PATH = path.resolve(process.cwd(), "configs", "helix-reasoning-theater.v1.json");
const ATLAS_CORPUS_PATH = (() => {
  const configured = String(
    process.env.HELIX_ASK_ATLAS_CORPUS_PATH ?? "configs/repo-atlas-bench-corpus.v2.json",
  ).trim();
  if (!configured) {
    return path.resolve(process.cwd(), "configs", "repo-atlas-bench-corpus.v2.json");
  }
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(process.cwd(), configured);
})();
const TOPOLOGY_CACHE_MS = clampNumber(
  readPositiveInt(process.env.HELIX_THEATER_TOPOLOGY_CACHE_MS, 60_000),
  5_000,
  10 * 60_000,
);

let atlasCorpusCache: string[] | null = null;
let topologyCache: { expiresAt: number; payload: ReasoningTheaterTopologyResponse } | null = null;
let atlasGraphCache: { expiresAt: number; payload: ReasoningTheaterAtlasGraphResponse } | null = null;
const congruenceGraphCache = new Map<
  string,
  { expiresAt: number; payload: ReasoningTheaterCongruenceGraphResponse }
>();

const GRAPH_CONFIG_PATHS = [
  "configs/graph-resolvers.json",
  "graph-resolvers.json",
  "configs/helix-ask-graphs.json",
  "helix-ask-graphs.json",
] as const;

type CongruenceGraphTreeConfig = {
  id: string;
  label?: string;
  path: string;
};

type CongruenceGraphResolverConfig = {
  trees?: CongruenceGraphTreeConfig[];
};

type CongruenceTreeLink = {
  rel?: string;
  to?: string;
  edgeType?: string;
  requiresCL?: string;
};

type CongruenceTreeEvidence = {
  path?: string;
};

type CongruenceTreeNode = {
  id?: string;
  title?: string;
  children?: string[];
  links?: CongruenceTreeLink[];
  evidence?: CongruenceTreeEvidence[];
};

type CongruenceTreeDoc = {
  rootId?: string;
  nodes?: CongruenceTreeNode[];
};

function readObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readPositiveInt(value: unknown, fallback: number): number {
  const parsed = Math.floor(readNumber(value, fallback));
  return parsed > 0 ? parsed : fallback;
}

function readString(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

function readBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "1") return true;
  if (value === "0") return false;
  return fallback;
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function readOneOf<T extends string>(value: unknown, fallback: T, allowed: readonly T[]): T {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim() as T;
  return allowed.includes(trimmed) ? trimmed : fallback;
}

function normalizeRepoPath(value: string): string {
  const normalized = value.replace(/\\/g, "/").replace(/^\.?\//, "").trim();
  return normalized;
}

function hash32(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createCongruenceNodeKey(treeId: string, nodeId: string): string {
  return `${treeId}::${nodeId}`.toLowerCase();
}

function readJsonFile(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as unknown;
}

function readGraphResolverTreeConfigs(): CongruenceGraphTreeConfig[] {
  for (const candidate of GRAPH_CONFIG_PATHS) {
    const fullPath = path.resolve(process.cwd(), candidate);
    if (!fs.existsSync(fullPath)) continue;
    try {
      const parsed = readJsonFile(fullPath) as CongruenceGraphResolverConfig;
      if (!Array.isArray(parsed?.trees)) continue;
      const trees = parsed.trees
        .filter(
          (entry): entry is CongruenceGraphTreeConfig =>
            Boolean(entry) &&
            typeof entry.id === "string" &&
            typeof entry.path === "string" &&
            entry.id.trim().length > 0 &&
            entry.path.trim().length > 0,
        )
        .map((entry) => ({
          id: entry.id.trim(),
          label: typeof entry.label === "string" ? entry.label.trim() : undefined,
          path: entry.path.trim(),
        }));
      if (trees.length > 0) return trees;
    } catch {
      // Keep scanning fallback config paths.
    }
  }
  return [];
}

function normalizeTreeIdList(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function resolveTreeIdsFromQueryValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    const splitValues = value.flatMap((entry) =>
      typeof entry === "string" ? entry.split(",") : [],
    );
    return normalizeTreeIdList(splitValues);
  }
  if (typeof value === "string") {
    return normalizeTreeIdList(value.split(","));
  }
  return [];
}

function parseAction(
  actionRaw: Record<string, unknown> | null,
  name: FrontierAction,
): FrontierConfigResponse["frontier_actions"]["actions"][FrontierAction] {
  const fallback = DEFAULT_FRONTIER_CONFIG.frontier_actions.actions[name];
  const raw = readObject(actionRaw?.[name]);
  const particleRaw = readObject(raw?.particle_profile);
  const speedMin = Math.max(
    0,
    readNumber(particleRaw?.speed_min_px_s, fallback.particle_profile.speed_min_px_s),
  );
  return {
    icon_path: readString(raw?.icon_path, fallback.icon_path),
    particle_profile: {
      color: readString(particleRaw?.color, fallback.particle_profile.color),
      base_direction_deg: readNumber(
        particleRaw?.base_direction_deg,
        fallback.particle_profile.base_direction_deg,
      ),
      spread_deg: Math.max(0, readNumber(particleRaw?.spread_deg, fallback.particle_profile.spread_deg)),
      speed_min_px_s: speedMin,
      speed_max_px_s: Math.max(
        speedMin,
        readNumber(particleRaw?.speed_max_px_s, fallback.particle_profile.speed_max_px_s),
      ),
      turbulence: Math.max(0, readNumber(particleRaw?.turbulence, fallback.particle_profile.turbulence)),
      emit_rate_hz: Math.max(0, readNumber(particleRaw?.emit_rate_hz, fallback.particle_profile.emit_rate_hz)),
      transition_burst: readBool(
        particleRaw?.transition_burst,
        fallback.particle_profile.transition_burst,
      ),
      shock_ring: readBool(particleRaw?.shock_ring, fallback.particle_profile.shock_ring),
    },
  };
}

function parseZoneStyle(
  zonesRaw: Record<string, unknown> | null,
  zone: ReasoningTheaterRetrievalZone,
): FrontierConfigResponse["retrieval_zone_layer"]["zones"][ReasoningTheaterRetrievalZone] {
  const fallback = DEFAULT_FRONTIER_CONFIG.retrieval_zone_layer.zones[zone];
  const raw = readObject(zonesRaw?.[zone]);
  return {
    base_color: readString(raw?.base_color, fallback.base_color),
    active_color: readString(raw?.active_color, fallback.active_color),
    edge_opacity: clampNumber(readNumber(raw?.edge_opacity, fallback.edge_opacity), 0, 1),
  };
}

function sanitizeConfig(input: unknown): FrontierConfigResponse {
  const root = readObject(input);
  if (!root) return DEFAULT_FRONTIER_CONFIG;
  const frontierRaw = readObject(root.frontier_actions);
  const zoneLayerRaw = readObject(root.retrieval_zone_layer);
  const thresholdRaw = readObject(frontierRaw?.thresholds);
  const actionRaw = readObject(frontierRaw?.actions);
  const defaults = DEFAULT_FRONTIER_CONFIG.frontier_actions;
  const zoneDefaults = DEFAULT_FRONTIER_CONFIG.retrieval_zone_layer;
  const zonesRaw = readObject(zoneLayerRaw?.zones);
  const motionRaw = readObject(zoneLayerRaw?.motion);
  const presentationRaw = readObject(zoneLayerRaw?.presentation);
  const graphFocusRaw = readObject(zoneLayerRaw?.graph_focus);
  const motionDefaults = zoneDefaults.motion;
  const presentationDefaults = zoneDefaults.presentation;
  const graphFocusDefaults = zoneDefaults.graph_focus;

  return {
    version: readString(root.version, DEFAULT_FRONTIER_CONFIG.version),
    frontier_actions: frontierRaw
      ? {
          window_ms: readPositiveInt(frontierRaw.window_ms, defaults.window_ms),
          switch_hold_frames: readPositiveInt(
            frontierRaw.switch_hold_frames,
            defaults.switch_hold_frames,
          ),
          min_action_ms: readPositiveInt(frontierRaw.min_action_ms, defaults.min_action_ms),
          thresholds: {
            hard_drop_delta_pct: readNumber(
              thresholdRaw?.hard_drop_delta_pct,
              defaults.thresholds.hard_drop_delta_pct,
            ),
            large_gain_delta_pct: readNumber(
              thresholdRaw?.large_gain_delta_pct,
              defaults.thresholds.large_gain_delta_pct,
            ),
            small_gain_delta_pct: readNumber(
              thresholdRaw?.small_gain_delta_pct,
              defaults.thresholds.small_gain_delta_pct,
            ),
            large_loss_delta_pct: readNumber(
              thresholdRaw?.large_loss_delta_pct,
              defaults.thresholds.large_loss_delta_pct,
            ),
            small_loss_delta_pct: readNumber(
              thresholdRaw?.small_loss_delta_pct,
              defaults.thresholds.small_loss_delta_pct,
            ),
          },
          actions: {
            large_gain: parseAction(actionRaw, "large_gain"),
            small_gain: parseAction(actionRaw, "small_gain"),
            steady: parseAction(actionRaw, "steady"),
            small_loss: parseAction(actionRaw, "small_loss"),
            large_loss: parseAction(actionRaw, "large_loss"),
            hard_drop: parseAction(actionRaw, "hard_drop"),
          },
        }
      : defaults,
    retrieval_zone_layer: zoneLayerRaw
      ? {
          enabled: readBool(zoneLayerRaw.enabled, zoneDefaults.enabled),
          node_count_dense: clampNumber(
            readPositiveInt(zoneLayerRaw.node_count_dense, zoneDefaults.node_count_dense),
            80,
            140,
          ),
          pulse_ms: readPositiveInt(zoneLayerRaw.pulse_ms, zoneDefaults.pulse_ms),
          hold_ms: readPositiveInt(zoneLayerRaw.hold_ms, zoneDefaults.hold_ms),
          open_world_label: readString(zoneLayerRaw.open_world_label, zoneDefaults.open_world_label),
          zones: {
            mapped_connected: parseZoneStyle(zonesRaw, "mapped_connected"),
            owned_frontier: parseZoneStyle(zonesRaw, "owned_frontier"),
            uncharted: parseZoneStyle(zonesRaw, "uncharted"),
          },
          motion: {
            enabled: readBool(motionRaw?.enabled, motionDefaults.enabled),
            sweep_band_width_pct: clampNumber(
              readNumber(motionRaw?.sweep_band_width_pct, motionDefaults.sweep_band_width_pct),
              6,
              30,
            ),
            sweep_falloff_pct: clampNumber(
              readNumber(motionRaw?.sweep_falloff_pct, motionDefaults.sweep_falloff_pct),
              4,
              24,
            ),
            node_frontier_boost: clampNumber(
              readNumber(motionRaw?.node_frontier_boost, motionDefaults.node_frontier_boost),
              0,
              1.2,
            ),
            node_zone_boost: clampNumber(
              readNumber(motionRaw?.node_zone_boost, motionDefaults.node_zone_boost),
              0,
              1.2,
            ),
            edge_frontier_boost: clampNumber(
              readNumber(motionRaw?.edge_frontier_boost, motionDefaults.edge_frontier_boost),
              0,
              1,
            ),
            edge_zone_boost: clampNumber(
              readNumber(motionRaw?.edge_zone_boost, motionDefaults.edge_zone_boost),
              0,
              1,
            ),
            breath_hz_base: clampNumber(
              readNumber(motionRaw?.breath_hz_base, motionDefaults.breath_hz_base),
              0.1,
              3,
            ),
            breath_hz_gain: clampNumber(
              readNumber(motionRaw?.breath_hz_gain, motionDefaults.breath_hz_gain),
              0,
              4,
            ),
            dash_px: clampNumber(readNumber(motionRaw?.dash_px, motionDefaults.dash_px), 0.5, 6),
            dash_gap_px: clampNumber(
              readNumber(motionRaw?.dash_gap_px, motionDefaults.dash_gap_px),
              1,
              10,
            ),
            sweep_opacity_min: clampNumber(
              readNumber(motionRaw?.sweep_opacity_min, motionDefaults.sweep_opacity_min),
              0,
              1,
            ),
            sweep_opacity_max: clampNumber(
              Math.max(
                readNumber(motionRaw?.sweep_opacity_min, motionDefaults.sweep_opacity_min),
                readNumber(motionRaw?.sweep_opacity_max, motionDefaults.sweep_opacity_max),
              ),
              0,
              1,
            ),
          },
          presentation: (() => {
            const eventHoldMs = clampNumber(
              readPositiveInt(presentationRaw?.event_hold_ms, presentationDefaults.event_hold_ms),
              60,
              1_200,
            );
            const eventPulseMs = Math.max(
              eventHoldMs + 1,
              clampNumber(
                readPositiveInt(presentationRaw?.event_pulse_ms, presentationDefaults.event_pulse_ms),
                240,
                4_000,
              ),
            );
            const pathFadeMs = Math.max(
              eventPulseMs,
              clampNumber(
                readPositiveInt(presentationRaw?.path_fade_ms, presentationDefaults.path_fade_ms),
                240,
                4_000,
              ),
            );
            return {
              mode: readOneOf(
                presentationRaw?.mode,
                presentationDefaults.mode,
                [
                  "convergence_strip_v1",
                  "atlas_dag_focus_v1",
                  "congruence_dag_atlas_v1",
                  "congruence_route_focus_v1",
                  "congruence_constellation_v2",
                ],
              ),
              symbolic_model: readOneOf(
                presentationRaw?.symbolic_model,
                presentationDefaults.symbolic_model,
                ["constellation_weave"],
              ),
              literality: readOneOf(
                presentationRaw?.literality,
                presentationDefaults.literality,
                ["exact_plus_aura"],
              ),
              zone_presence: readOneOf(
                presentationRaw?.zone_presence,
                presentationDefaults.zone_presence,
                ["ambient_only"],
              ),
              map_text: readOneOf(
                presentationRaw?.map_text,
                presentationDefaults.map_text,
                ["none"],
              ),
              constellation_node_budget: clampNumber(
                readPositiveInt(
                  presentationRaw?.constellation_node_budget,
                  presentationDefaults.constellation_node_budget,
                ),
                80,
                120,
              ),
              aura_hop_limit: clampNumber(
                readPositiveInt(presentationRaw?.aura_hop_limit, presentationDefaults.aura_hop_limit),
                0,
                1,
              ),
              aura_opacity_max: clampNumber(
                readNumber(presentationRaw?.aura_opacity_max, presentationDefaults.aura_opacity_max),
                0,
                1,
              ),
              thread_count_per_edge: clampNumber(
                readPositiveInt(
                  presentationRaw?.thread_count_per_edge,
                  presentationDefaults.thread_count_per_edge,
                ),
                1,
                4,
              ),
              trace_scope: readOneOf(
                presentationRaw?.trace_scope,
                presentationDefaults.trace_scope,
                ["primary_only"],
              ),
              camera_mode: readOneOf(
                presentationRaw?.camera_mode,
                presentationDefaults.camera_mode,
                ["fixed"],
              ),
              path_mode: readOneOf(
                presentationRaw?.path_mode,
                presentationDefaults.path_mode,
                ["full_path_with_event_flow"],
              ),
              progress_encoding: readOneOf(
                presentationRaw?.progress_encoding,
                presentationDefaults.progress_encoding,
                ["leaf_beacon_route_flux"],
              ),
              no_exact_fallback: readOneOf(
                presentationRaw?.no_exact_fallback,
                presentationDefaults.no_exact_fallback,
                ["tree_pulse_only"],
              ),
              show_root_leaf_markers: readBool(
                presentationRaw?.show_root_leaf_markers,
                presentationDefaults.show_root_leaf_markers,
              ),
              caption_mode: readOneOf(
                presentationRaw?.caption_mode,
                presentationDefaults.caption_mode,
                ["one_line"],
              ),
              causality_encoding: readOneOf(
                presentationRaw?.causality_encoding,
                presentationDefaults.causality_encoding,
                ["map_only"],
              ),
              provenance_mode: readOneOf(
                presentationRaw?.provenance_mode,
                presentationDefaults.provenance_mode,
                ["strict_exact_only"],
              ),
              labels: readOneOf(presentationRaw?.labels, presentationDefaults.labels, ["none"]),
              show_open_world_text_chip: readBool(
                presentationRaw?.show_open_world_text_chip,
                presentationDefaults.show_open_world_text_chip,
              ),
              core_reaction_ms: clampNumber(
                readPositiveInt(
                  presentationRaw?.core_reaction_ms,
                  presentationDefaults.core_reaction_ms,
                ),
                120,
                2_500,
              ),
              event_pulse_ms: eventPulseMs,
              event_hold_ms: eventHoldMs,
              path_fade_ms: pathFadeMs,
              max_exact_paths_per_event: clampNumber(
                readPositiveInt(
                  presentationRaw?.max_exact_paths_per_event,
                  presentationDefaults.max_exact_paths_per_event,
                ),
                1,
                24,
              ),
              show_phase_tick: readBool(
                presentationRaw?.show_phase_tick,
                presentationDefaults.show_phase_tick,
              ),
              show_caption: readBool(
                presentationRaw?.show_caption,
                presentationDefaults.show_caption,
              ),
              show_reply_snapshot: readBool(
                presentationRaw?.show_reply_snapshot,
                presentationDefaults.show_reply_snapshot,
              ),
              collapse_pulse_ms: clampNumber(
                readPositiveInt(
                  presentationRaw?.collapse_pulse_ms,
                  presentationDefaults.collapse_pulse_ms,
                ),
                120,
                2_500,
              ),
              lane_hold_ms: clampNumber(
                readPositiveInt(
                  presentationRaw?.lane_hold_ms,
                  presentationDefaults.lane_hold_ms,
                ),
                60,
                1_200,
              ),
              unknown_policy: readOneOf(
                presentationRaw?.unknown_policy,
                presentationDefaults.unknown_policy,
                ["explicit"],
              ),
            };
          })(),
          graph_focus: {
            enabled: readBool(graphFocusRaw?.enabled, graphFocusDefaults.enabled),
            max_visible_nodes: clampNumber(
              readPositiveInt(graphFocusRaw?.max_visible_nodes, graphFocusDefaults.max_visible_nodes),
              80,
              160,
            ),
            max_visible_edges: clampNumber(
              readPositiveInt(graphFocusRaw?.max_visible_edges, graphFocusDefaults.max_visible_edges),
              120,
              500,
            ),
            hop_limit: clampNumber(
              readPositiveInt(graphFocusRaw?.hop_limit, graphFocusDefaults.hop_limit),
              1,
              5,
            ),
            neighbor_cap_per_node: clampNumber(
              readPositiveInt(
                graphFocusRaw?.neighbor_cap_per_node,
                graphFocusDefaults.neighbor_cap_per_node,
              ),
              2,
              16,
            ),
            camera_padding_pct: clampNumber(
              readNumber(graphFocusRaw?.camera_padding_pct, graphFocusDefaults.camera_padding_pct),
              0.04,
              0.24,
            ),
            camera_lerp: clampNumber(
              readNumber(graphFocusRaw?.camera_lerp, graphFocusDefaults.camera_lerp),
              0.05,
              0.6,
            ),
            indicator_ms: clampNumber(
              readPositiveInt(graphFocusRaw?.indicator_ms, graphFocusDefaults.indicator_ms),
              120,
              2_000,
            ),
            objective_reaction_ms: clampNumber(
              readPositiveInt(
                graphFocusRaw?.objective_reaction_ms,
                graphFocusDefaults.objective_reaction_ms,
              ),
              120,
              2_500,
            ),
          },
        }
      : zoneDefaults,
  };
}

function readAtlasCorpusFiles(): string[] {
  if (atlasCorpusCache) return atlasCorpusCache;
  try {
    const raw = fs.readFileSync(ATLAS_CORPUS_PATH, "utf8");
    const parsed = JSON.parse(raw) as { tasks?: Array<{ expected_files?: string[] }> };
    const unique = new Set<string>();
    for (const task of parsed.tasks ?? []) {
      for (const filePath of task.expected_files ?? []) {
        const normalized = normalizeRepoPath(String(filePath ?? ""));
        if (normalized) unique.add(normalized.toLowerCase());
      }
    }
    atlasCorpusCache = Array.from(unique);
    return atlasCorpusCache;
  } catch {
    atlasCorpusCache = [];
    return atlasCorpusCache;
  }
}

function readGitTrackedFiles(): Set<string> {
  const stdout = execFileSync("git", ["ls-files", "--recurse-submodules"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  const set = new Set<string>();
  for (const line of stdout.split(/\r?\n/)) {
    const normalized = normalizeRepoPath(line);
    if (normalized) {
      set.add(normalized.toLowerCase());
    }
  }
  return set;
}

async function resolveOwnedBaseline(): Promise<{
  ownedTotal: number;
  source: "git_tracked" | "code_lattice_fallback";
  degraded: boolean;
  gitTrackedFiles: Set<string> | null;
}> {
  try {
    const gitTrackedFiles = readGitTrackedFiles();
    if (gitTrackedFiles.size > 0) {
      return {
        ownedTotal: gitTrackedFiles.size,
        source: "git_tracked",
        degraded: false,
        gitTrackedFiles,
      };
    }
  } catch {
    // Fall through to code-lattice fallback.
  }
  const snapshot = await loadCodeLattice();
  const fallbackCount =
    snapshot && typeof snapshot.filesIndexed === "number" && Number.isFinite(snapshot.filesIndexed)
      ? Math.max(0, Math.floor(snapshot.filesIndexed))
      : 0;
  return {
    ownedTotal: fallbackCount,
    source: "code_lattice_fallback",
    degraded: true,
    gitTrackedFiles: null,
  };
}

async function computeTopology(): Promise<ReasoningTheaterTopologyResponse> {
  const baseline = await resolveOwnedBaseline();
  const atlasFiles = readAtlasCorpusFiles();
  const atlasUniqueFiles = atlasFiles.length;
  let atlasExistingFiles = 0;
  if (baseline.gitTrackedFiles) {
    for (const atlasFile of atlasFiles) {
      if (baseline.gitTrackedFiles.has(atlasFile)) {
        atlasExistingFiles += 1;
      }
    }
  }
  const connectedOwned = atlasExistingFiles;
  const ownedTotal = Math.max(Math.floor(baseline.ownedTotal), connectedOwned, 0);
  const ownedNotConnected = Math.max(0, ownedTotal - connectedOwned);
  const convergenceRatio = ownedTotal > 0 ? connectedOwned / ownedTotal : 0;

  const denseTotalNodes = clampNumber(
    readPositiveInt(process.env.HELIX_THEATER_ZONE_DENSE_NODES, 120),
    80,
    140,
  );
  const unchartedNodes = Math.max(1, Math.round(denseTotalNodes * 0.2));
  const ownedVisualNodes = Math.max(1, denseTotalNodes - unchartedNodes);
  const connectedClampMax = Math.max(6, ownedVisualNodes - 6);
  const connectedClampMin = Math.min(6, connectedClampMax);
  const connectedNodes = Math.round(
    clampNumber(
      Math.round(ownedVisualNodes * convergenceRatio),
      connectedClampMin,
      connectedClampMax,
    ),
  );
  const frontierNodes = Math.max(0, ownedVisualNodes - connectedNodes);
  const seed = hash32(
    `${DEFAULT_FRONTIER_CONFIG.version}:${ownedTotal}:${connectedOwned}:${atlasUniqueFiles}:${denseTotalNodes}`,
  );

  return {
    version: DEFAULT_FRONTIER_CONFIG.version,
    generated_at: new Date().toISOString(),
    baseline: {
      owned_total: ownedTotal,
      connected_owned: connectedOwned,
      owned_not_connected: ownedNotConnected,
      convergence_ratio: Number(convergenceRatio.toFixed(6)),
    },
    sources: {
      owned_source: baseline.source,
      connected_source: "atlas_corpus",
      atlas_unique_files: atlasUniqueFiles,
      atlas_existing_files: atlasExistingFiles,
      degraded: baseline.degraded,
    },
    display: {
      node_density_mode: "dense",
      total_nodes: denseTotalNodes,
      connected_nodes: connectedNodes,
      frontier_nodes: frontierNodes,
      uncharted_nodes: unchartedNodes,
      seed,
    },
  };
}

function buildAtlasGraphFallback(
  baseline?: ReasoningTheaterTopologyResponse["baseline"],
  degraded = true,
): ReasoningTheaterAtlasGraphResponse {
  const baselineSafe =
    baseline ??
    ({
      owned_total: 0,
      connected_owned: 0,
      owned_not_connected: 0,
      convergence_ratio: 0,
    } satisfies ReasoningTheaterTopologyResponse["baseline"]);
  return {
    version: DEFAULT_FRONTIER_CONFIG.version,
    generated_at: new Date().toISOString(),
    seed: hash32("reasoning-theater-atlas-graph-fallback"),
    baseline: baselineSafe,
    stats: {
      nodes_total: 0,
      edges_total: 0,
      mapped_connected_nodes: 0,
      owned_frontier_nodes: 0,
      uncharted_nodes: 0,
      degraded,
    },
    nodes: [],
    edges: [],
  };
}

function getInitialZoneAnchor(zone: "mapped_connected" | "owned_frontier"): { x: number; y: number } {
  if (zone === "mapped_connected") {
    return { x: 0.34, y: 0.42 };
  }
  return { x: 0.68, y: 0.42 };
}

function getDeterministicJitter(seed: number, key: string): { x: number; y: number } {
  const xHash = hash32(`${seed}:${key}:x`);
  const yHash = hash32(`${seed}:${key}:y`);
  const x = ((xHash % 2000) / 1000 - 1) * 0.11;
  const y = ((yHash % 2000) / 1000 - 1) * 0.11;
  return { x, y };
}

function clampCoord(value: number): number {
  return clampNumber(value, 0.02, 0.98);
}

async function computeAtlasGraph(): Promise<ReasoningTheaterAtlasGraphResponse> {
  const topology = await computeTopology();
  const snapshot = await loadCodeLattice();
  if (!snapshot || !Array.isArray(snapshot.nodes) || !Array.isArray(snapshot.edges)) {
    return buildAtlasGraphFallback(topology.baseline, true);
  }

  const atlasSet = new Set(readAtlasCorpusFiles());
  const ownedBaseline = await resolveOwnedBaseline();
  const ownedSet = ownedBaseline.gitTrackedFiles;
  const degraded = topology.sources.degraded || ownedSet === null;

  const nodeIdToPath = new Map<string, string>();
  const filePathByLower = new Map<string, string>();
  for (const node of snapshot.nodes) {
    const rawPath = normalizeRepoPath(String(node.filePath ?? ""));
    if (!rawPath) continue;
    const lower = rawPath.toLowerCase();
    if (ownedSet && !ownedSet.has(lower)) continue;
    nodeIdToPath.set(String(node.nodeId ?? ""), lower);
    if (!filePathByLower.has(lower)) {
      filePathByLower.set(lower, rawPath);
    }
  }

  const graphNodes = Array.from(filePathByLower.entries()).map(([id, pathValue]) => {
    const mapped = atlasSet.has(id);
    return {
      id,
      path: pathValue,
      zone: (mapped ? "mapped_connected" : "owned_frontier") as "mapped_connected" | "owned_frontier",
    };
  });

  if (!graphNodes.length) {
    return buildAtlasGraphFallback(topology.baseline, true);
  }

  const allowedNodeIds = new Set(graphNodes.map((node) => node.id));
  const edgeCounts = new Map<string, { from: string; to: string; count: number }>();
  for (const edge of snapshot.edges) {
    const fromPath = nodeIdToPath.get(String(edge.from ?? ""));
    const toPath = nodeIdToPath.get(String(edge.to ?? ""));
    if (!fromPath || !toPath || fromPath === toPath) continue;
    if (!allowedNodeIds.has(fromPath) || !allowedNodeIds.has(toPath)) continue;
    const left = fromPath < toPath ? fromPath : toPath;
    const right = fromPath < toPath ? toPath : fromPath;
    const key = `${left}|${right}`;
    const prev = edgeCounts.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      edgeCounts.set(key, { from: left, to: right, count: 1 });
    }
  }

  const degreeByNode = new Map<string, number>();
  for (const node of graphNodes) {
    degreeByNode.set(node.id, 0);
  }
  let maxCount = 1;
  for (const entry of edgeCounts.values()) {
    maxCount = Math.max(maxCount, entry.count);
    degreeByNode.set(entry.from, (degreeByNode.get(entry.from) ?? 0) + 1);
    degreeByNode.set(entry.to, (degreeByNode.get(entry.to) ?? 0) + 1);
  }

  const seed = hash32(
    [
      DEFAULT_FRONTIER_CONFIG.version,
      topology.baseline.owned_total,
      topology.baseline.connected_owned,
      snapshot.latticeVersion ?? 0,
      graphNodes.length,
      edgeCounts.size,
    ].join(":"),
  );

  const positions = new Map<string, { x: number; y: number; zone: "mapped_connected" | "owned_frontier" }>();
  for (const node of graphNodes) {
    const anchor = getInitialZoneAnchor(node.zone);
    const jitter = getDeterministicJitter(seed, node.id);
    positions.set(node.id, {
      x: clampCoord(anchor.x + jitter.x),
      y: clampCoord(anchor.y + jitter.y),
      zone: node.zone,
    });
  }

  const adjacency = new Map<string, string[]>();
  for (const node of graphNodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edgeCounts.values()) {
    adjacency.get(edge.from)?.push(edge.to);
    adjacency.get(edge.to)?.push(edge.from);
  }

  for (let iter = 0; iter < 18; iter += 1) {
    const next = new Map<string, { x: number; y: number; zone: "mapped_connected" | "owned_frontier" }>();
    for (const node of graphNodes) {
      const current = positions.get(node.id);
      if (!current) continue;
      const neighbors = adjacency.get(node.id) ?? [];
      const anchor = getInitialZoneAnchor(current.zone);
      let nx = current.x * 0.82 + anchor.x * 0.18;
      let ny = current.y * 0.82 + anchor.y * 0.18;
      if (neighbors.length > 0) {
        let sx = 0;
        let sy = 0;
        for (const neighborId of neighbors) {
          const neighbor = positions.get(neighborId);
          if (!neighbor) continue;
          sx += neighbor.x;
          sy += neighbor.y;
        }
        const inv = 1 / neighbors.length;
        nx = nx * 0.74 + sx * inv * 0.26;
        ny = ny * 0.74 + sy * inv * 0.26;
      }
      next.set(node.id, {
        x: clampCoord(nx),
        y: clampCoord(ny),
        zone: current.zone,
      });
    }
    if (next.size === positions.size) {
      positions.clear();
      for (const [key, value] of next) {
        positions.set(key, value);
      }
    }
  }

  const nodes: ReasoningTheaterAtlasGraphNode[] = graphNodes.map((node) => {
    const pos = positions.get(node.id);
    return {
      id: node.id,
      path: node.path,
      zone: node.zone,
      x: Number((pos?.x ?? 0.5).toFixed(6)),
      y: Number((pos?.y ?? 0.5).toFixed(6)),
      degree: Math.max(0, Math.floor(degreeByNode.get(node.id) ?? 0)),
    };
  });

  const edges: ReasoningTheaterAtlasGraphEdge[] = Array.from(edgeCounts.values()).map((edge) => ({
    id: `${edge.from}|${edge.to}`,
    from: edge.from,
    to: edge.to,
    weight: Number((edge.count / maxCount).toFixed(6)),
  }));

  const mappedCount = nodes.filter((node) => node.zone === "mapped_connected").length;
  const frontierCount = nodes.length - mappedCount;
  return {
    version: DEFAULT_FRONTIER_CONFIG.version,
    generated_at: new Date().toISOString(),
    seed,
    baseline: topology.baseline,
    stats: {
      nodes_total: nodes.length,
      edges_total: edges.length,
      mapped_connected_nodes: mappedCount,
      owned_frontier_nodes: frontierCount,
      uncharted_nodes: 0,
      degraded,
    },
    nodes,
    edges,
  };
}

function buildCongruenceGraphFallback(
  baseline?: ReasoningTheaterTopologyResponse["baseline"],
  degraded = true,
): ReasoningTheaterCongruenceGraphResponse {
  const baselineSafe =
    baseline ??
    ({
      owned_total: 0,
      connected_owned: 0,
      owned_not_connected: 0,
      convergence_ratio: 0,
    } satisfies ReasoningTheaterTopologyResponse["baseline"]);
  return {
    version: DEFAULT_FRONTIER_CONFIG.version,
    generated_at: new Date().toISOString(),
    seed: hash32("reasoning-theater-congruence-graph-fallback"),
    baseline: baselineSafe,
    stats: {
      trees_total: 0,
      nodes_total: 0,
      edges_total: 0,
      mapped_connected_nodes: 0,
      owned_frontier_nodes: 0,
      uncharted_nodes: 0,
      degraded,
    },
    trees: [],
    nodes: [],
    edges: [],
  };
}

function resolveClusterCenterX(index: number, total: number): number {
  if (total <= 1) return 0.5;
  if (total === 2) return index === 0 ? 0.32 : 0.68;
  const t = index / Math.max(1, total - 1);
  return clampNumber(0.16 + t * 0.68, 0.12, 0.88);
}

function resolveClusterWidth(total: number): number {
  if (total <= 1) return 0.62;
  if (total === 2) return 0.36;
  if (total === 3) return 0.28;
  return 0.2;
}

function resolveEdgeWeight(rel: string, edgeType: string): number {
  const normalizedRel = rel.trim().toLowerCase();
  const normalizedType = edgeType.trim().toLowerCase();
  if (normalizedType === "child" || normalizedRel === "child") return 1;
  if (normalizedRel === "verifies") return 0.96;
  if (normalizedRel === "constrains") return 0.92;
  if (normalizedRel === "enables") return 0.88;
  if (normalizedRel === "rollback_to") return 0.84;
  if (normalizedRel === "escalates_to") return 0.82;
  if (normalizedRel === "optimizes") return 0.8;
  if (normalizedRel === "see-also") return 0.64;
  return 0.74;
}

async function computeCongruenceGraph(args: {
  treeIds: string[];
  primaryTreeId?: string | null;
}): Promise<ReasoningTheaterCongruenceGraphResponse> {
  const topology = await computeTopology();
  const treeConfigs = readGraphResolverTreeConfigs();
  if (!treeConfigs.length) {
    return buildCongruenceGraphFallback(topology.baseline, true);
  }

  const requestedTreeIds = normalizeTreeIdList(args.treeIds);
  const requestedTreeIdSet = new Set(requestedTreeIds.map((entry) => entry.toLowerCase()));
  const selectedConfigs = (
    requestedTreeIds.length > 0
      ? treeConfigs.filter((tree) => requestedTreeIdSet.has(tree.id.toLowerCase()))
      : treeConfigs.slice(0, 3)
  ).slice(0, 6);

  if (!selectedConfigs.length) {
    return buildCongruenceGraphFallback(topology.baseline, true);
  }

  const selectedTreeIds = selectedConfigs.map((tree) => tree.id);
  const selectedTreeIdSet = new Set(selectedTreeIds.map((entry) => entry.toLowerCase()));
  const primaryTreeId =
    typeof args.primaryTreeId === "string" &&
    selectedTreeIdSet.has(args.primaryTreeId.trim().toLowerCase())
      ? selectedConfigs.find(
          (tree) => tree.id.toLowerCase() === args.primaryTreeId?.trim().toLowerCase(),
        )?.id ?? selectedConfigs[0].id
      : selectedConfigs[0].id;

  const treeOrder = selectedConfigs.slice().sort((a, b) => {
    if (a.id === primaryTreeId && b.id !== primaryTreeId) return -1;
    if (b.id === primaryTreeId && a.id !== primaryTreeId) return 1;
    return a.id.localeCompare(b.id);
  });
  const treeIndexById = new Map(treeOrder.map((tree, index) => [tree.id, index]));

  const atlasSet = new Set(readAtlasCorpusFiles());
  const nodes: ReasoningTheaterCongruenceGraphNode[] = [];
  const edges: ReasoningTheaterCongruenceGraphEdge[] = [];
  const nodeSeen = new Set<string>();
  const edgeSeen = new Set<string>();
  const degreeByKey = new Map<string, number>();
  const trees: ReasoningTheaterCongruenceGraphTree[] = [];
  let degraded = requestedTreeIds.length > selectedConfigs.length;

  const seed = hash32(
    [
      DEFAULT_FRONTIER_CONFIG.version,
      topology.baseline.owned_total,
      topology.baseline.connected_owned,
      treeOrder.map((tree) => tree.id).join(","),
      primaryTreeId,
    ].join(":"),
  );

  for (const treeConfig of treeOrder) {
    const treeFilePath = path.isAbsolute(treeConfig.path)
      ? treeConfig.path
      : path.resolve(process.cwd(), treeConfig.path);
    if (!fs.existsSync(treeFilePath)) {
      degraded = true;
      continue;
    }
    let treeDoc: CongruenceTreeDoc;
    try {
      treeDoc = readJsonFile(treeFilePath) as CongruenceTreeDoc;
    } catch {
      degraded = true;
      continue;
    }
    const rawNodes = Array.isArray(treeDoc.nodes) ? treeDoc.nodes : [];
    const normalizedNodes = rawNodes
      .map((node) => ({
        id: typeof node.id === "string" ? node.id.trim() : "",
        title: typeof node.title === "string" ? node.title.trim() : "",
        children: Array.isArray(node.children)
          ? node.children.filter((child): child is string => typeof child === "string")
          : [],
        links: Array.isArray(node.links) ? node.links : [],
        evidence: Array.isArray(node.evidence) ? node.evidence : [],
      }))
      .filter((node) => node.id.length > 0);
    if (!normalizedNodes.length) {
      degraded = true;
      continue;
    }

    const rootId =
      typeof treeDoc.rootId === "string" && treeDoc.rootId.trim().length > 0
        ? treeDoc.rootId.trim()
        : normalizedNodes[0].id;
    const byNodeId = new Map(normalizedNodes.map((node) => [node.id, node]));
    const inbound = new Map<string, number>();
    for (const node of normalizedNodes) {
      inbound.set(node.id, 0);
    }
    for (const node of normalizedNodes) {
      for (const child of node.children) {
        if (!byNodeId.has(child)) continue;
        inbound.set(child, (inbound.get(child) ?? 0) + 1);
      }
    }

    const effectiveRootId = byNodeId.has(rootId)
      ? rootId
      : normalizedNodes.find((node) => (inbound.get(node.id) ?? 0) === 0)?.id ?? normalizedNodes[0].id;
    const depthByNode = new Map<string, number>([[effectiveRootId, 0]]);
    const bfsQueue = [effectiveRootId];
    for (let cursor = 0; cursor < bfsQueue.length; cursor += 1) {
      const currentId = bfsQueue[cursor];
      const currentNode = byNodeId.get(currentId);
      if (!currentNode) continue;
      const currentDepth = depthByNode.get(currentId) ?? 0;
      for (const child of currentNode.children) {
        if (!byNodeId.has(child)) continue;
        if (!depthByNode.has(child)) {
          depthByNode.set(child, currentDepth + 1);
          bfsQueue.push(child);
        }
      }
    }

    const maxKnownDepth = Math.max(0, ...Array.from(depthByNode.values()));
    const unresolved = normalizedNodes
      .filter((node) => !depthByNode.has(node.id))
      .sort((a, b) => a.id.localeCompare(b.id));
    unresolved.forEach((node, index) => {
      depthByNode.set(node.id, maxKnownDepth + 1 + index);
    });
    const maxDepth = Math.max(1, ...Array.from(depthByNode.values()));
    const layerBuckets = new Map<number, string[]>();
    for (const node of normalizedNodes) {
      const depth = depthByNode.get(node.id) ?? maxDepth;
      const existing = layerBuckets.get(depth);
      if (existing) {
        existing.push(node.id);
      } else {
        layerBuckets.set(depth, [node.id]);
      }
    }
    for (const nodeIds of layerBuckets.values()) {
      nodeIds.sort((a, b) => a.localeCompare(b));
    }

    const treeIndex = treeIndexById.get(treeConfig.id) ?? 0;
    const clusterCenterX = resolveClusterCenterX(treeIndex, treeOrder.length);
    const clusterWidth = resolveClusterWidth(treeOrder.length);
    const baseYMin = 0.12;
    const baseYMax = 0.88;

    for (const node of normalizedNodes) {
      const depth = depthByNode.get(node.id) ?? maxDepth;
      const layer = layerBuckets.get(depth) ?? [node.id];
      const layerIndex = Math.max(0, layer.indexOf(node.id));
      const layerCount = Math.max(1, layer.length);
      const centerOffset =
        layerCount <= 1 ? 0 : (layerIndex / Math.max(1, layerCount - 1) - 0.5) * clusterWidth;
      const baseX = clusterCenterX + centerOffset;
      const depthRatio = maxDepth <= 0 ? 0 : depth / maxDepth;
      const baseY = baseYMin + depthRatio * (baseYMax - baseYMin);
      const jitterX = ((hash32(`${seed}:${treeConfig.id}:${node.id}:x`) % 2000) / 1000 - 1) * 0.015;
      const jitterY = ((hash32(`${seed}:${treeConfig.id}:${node.id}:y`) % 2000) / 1000 - 1) * 0.013;
      const evidencePaths = node.evidence
        .map((entry) => normalizeRepoPath(String(entry?.path ?? "")))
        .filter(Boolean);
      const atlasLinked = evidencePaths.some((entry) => atlasSet.has(entry.toLowerCase()));
      const zone = atlasLinked ? "mapped_connected" : "owned_frontier";
      const key = createCongruenceNodeKey(treeConfig.id, node.id);
      if (nodeSeen.has(key)) continue;
      nodeSeen.add(key);
      degreeByKey.set(key, 0);
      nodes.push({
        id: key,
        tree_id: treeConfig.id,
        node_id: node.id,
        title: node.title || node.id,
        zone,
        atlas_linked: atlasLinked,
        x: Number(clampCoord(baseX + jitterX).toFixed(6)),
        y: Number(clampCoord(baseY + jitterY).toFixed(6)),
        degree: 0,
        depth,
      });
    }

    for (const node of normalizedNodes) {
      const from = createCongruenceNodeKey(treeConfig.id, node.id);
      if (!nodeSeen.has(from)) continue;
      for (const childId of node.children) {
        if (!byNodeId.has(childId)) continue;
        const to = createCongruenceNodeKey(treeConfig.id, childId);
        if (!nodeSeen.has(to)) continue;
        const rel = "child";
        const edgeType = "child";
        const edgeKey = `${from}|${to}|${rel}|${edgeType}|`;
        if (edgeSeen.has(edgeKey)) continue;
        edgeSeen.add(edgeKey);
        degreeByKey.set(from, (degreeByKey.get(from) ?? 0) + 1);
        degreeByKey.set(to, (degreeByKey.get(to) ?? 0) + 1);
        edges.push({
          id: `${treeConfig.id}:${from}->${to}:${edgeType}`,
          tree_id: treeConfig.id,
          from,
          to,
          rel,
          edge_type: edgeType,
          requires_cl: null,
          weight: resolveEdgeWeight(rel, edgeType),
        });
      }
      for (const link of node.links) {
        const targetId = typeof link?.to === "string" ? link.to.trim() : "";
        if (!targetId || !byNodeId.has(targetId)) continue;
        const to = createCongruenceNodeKey(treeConfig.id, targetId);
        if (!nodeSeen.has(to)) continue;
        const rel = typeof link.rel === "string" && link.rel.trim() ? link.rel.trim() : "link";
        const edgeType =
          typeof link.edgeType === "string" && link.edgeType.trim()
            ? link.edgeType.trim()
            : rel;
        const requiresCl =
          typeof link.requiresCL === "string" && link.requiresCL.trim()
            ? link.requiresCL.trim()
            : null;
        const edgeKey = `${from}|${to}|${rel}|${edgeType}|${requiresCl ?? ""}`;
        if (edgeSeen.has(edgeKey)) continue;
        edgeSeen.add(edgeKey);
        degreeByKey.set(from, (degreeByKey.get(from) ?? 0) + 1);
        degreeByKey.set(to, (degreeByKey.get(to) ?? 0) + 1);
        edges.push({
          id: `${treeConfig.id}:${from}->${to}:${edgeType}:${rel}:${requiresCl ?? "none"}`,
          tree_id: treeConfig.id,
          from,
          to,
          rel,
          edge_type: edgeType,
          requires_cl: requiresCl,
          weight: resolveEdgeWeight(rel, edgeType),
        });
      }
    }

    trees.push({
      id: treeConfig.id,
      label: treeConfig.label?.trim() || treeConfig.id,
      root_id: effectiveRootId || null,
      node_count: normalizedNodes.length,
    });
  }

  if (!nodes.length) {
    return buildCongruenceGraphFallback(topology.baseline, true);
  }

  const sortedNodes = nodes
    .map((node) => ({
      ...node,
      degree: Math.max(0, Math.floor(degreeByKey.get(node.id) ?? 0)),
    }))
    .sort((a, b) => {
      if (a.tree_id !== b.tree_id) return a.tree_id.localeCompare(b.tree_id);
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.node_id.localeCompare(b.node_id);
    });
  const sortedEdges = edges.sort((a, b) => a.id.localeCompare(b.id));
  const mappedCount = sortedNodes.filter((node) => node.zone === "mapped_connected").length;
  const frontierCount = sortedNodes.length - mappedCount;

  return {
    version: DEFAULT_FRONTIER_CONFIG.version,
    generated_at: new Date().toISOString(),
    seed,
    baseline: topology.baseline,
    stats: {
      trees_total: trees.length,
      nodes_total: sortedNodes.length,
      edges_total: sortedEdges.length,
      mapped_connected_nodes: mappedCount,
      owned_frontier_nodes: frontierCount,
      uncharted_nodes: 0,
      degraded,
    },
    trees: trees.sort((a, b) => {
      if (a.id === primaryTreeId && b.id !== primaryTreeId) return -1;
      if (b.id === primaryTreeId && a.id !== primaryTreeId) return 1;
      return a.id.localeCompare(b.id);
    }),
    nodes: sortedNodes,
    edges: sortedEdges,
  };
}

async function getTopologyCached(): Promise<ReasoningTheaterTopologyResponse> {
  const now = Date.now();
  if (topologyCache && topologyCache.expiresAt > now) {
    return topologyCache.payload;
  }
  const payload = await computeTopology();
  topologyCache = {
    expiresAt: now + TOPOLOGY_CACHE_MS,
    payload,
  };
  return payload;
}

async function getAtlasGraphCached(): Promise<ReasoningTheaterAtlasGraphResponse> {
  const now = Date.now();
  if (atlasGraphCache && atlasGraphCache.expiresAt > now) {
    return atlasGraphCache.payload;
  }
  const payload = await computeAtlasGraph();
  atlasGraphCache = {
    expiresAt: now + TOPOLOGY_CACHE_MS,
    payload,
  };
  return payload;
}

async function getCongruenceGraphCached(args: {
  treeIds: string[];
  primaryTreeId?: string | null;
}): Promise<ReasoningTheaterCongruenceGraphResponse> {
  const normalizedTreeIds = normalizeTreeIdList(args.treeIds).slice(0, 6);
  const primaryTreeId =
    typeof args.primaryTreeId === "string" && args.primaryTreeId.trim().length > 0
      ? args.primaryTreeId.trim()
      : null;
  const cacheKey = `${normalizedTreeIds.join(",")}|${primaryTreeId ?? ""}`;
  const now = Date.now();
  const cached = congruenceGraphCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.payload;
  }
  const payload = await computeCongruenceGraph({
    treeIds: normalizedTreeIds,
    primaryTreeId,
  });
  congruenceGraphCache.set(cacheKey, {
    expiresAt: now + TOPOLOGY_CACHE_MS,
    payload,
  });
  return payload;
}

const sendNoCache = (res: Response) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
};

export const helixReasoningTheaterRouter = Router();

helixReasoningTheaterRouter.get("/reasoning-theater/config", (_req, res) => {
  sendNoCache(res);
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    res.status(200).json(sanitizeConfig(JSON.parse(raw)));
    return;
  } catch (error) {
    console.warn("[helix][reasoning-theater] config fallback:", error);
  }
  res.status(200).json(DEFAULT_FRONTIER_CONFIG);
});

helixReasoningTheaterRouter.get("/reasoning-theater/topology", async (_req, res) => {
  sendNoCache(res);
  try {
    const payload = await getTopologyCached();
    res.status(200).json(payload);
    return;
  } catch (error) {
    console.warn("[helix][reasoning-theater] topology fallback:", error);
  }
  res.status(200).json({
    version: DEFAULT_FRONTIER_CONFIG.version,
    generated_at: new Date().toISOString(),
    baseline: {
      owned_total: 0,
      connected_owned: 0,
      owned_not_connected: 0,
      convergence_ratio: 0,
    },
    sources: {
      owned_source: "code_lattice_fallback",
      connected_source: "atlas_corpus",
      atlas_unique_files: 0,
      atlas_existing_files: 0,
      degraded: true,
    },
    display: {
      node_density_mode: "dense",
      total_nodes: 120,
      connected_nodes: 6,
      frontier_nodes: 90,
      uncharted_nodes: 24,
      seed: hash32("reasoning-theater-topology-fallback"),
    },
  } satisfies ReasoningTheaterTopologyResponse);
});

helixReasoningTheaterRouter.get("/reasoning-theater/congruence-graph", async (req, res) => {
  sendNoCache(res);
  try {
    const treeIds = resolveTreeIdsFromQueryValue(req.query.treeIds);
    const primaryTreeId =
      typeof req.query.primaryTreeId === "string" ? req.query.primaryTreeId : undefined;
    const payload = await getCongruenceGraphCached({
      treeIds,
      primaryTreeId,
    });
    res.status(200).json(payload);
    return;
  } catch (error) {
    console.warn("[helix][reasoning-theater] congruence-graph fallback:", error);
  }
  res.status(200).json(buildCongruenceGraphFallback(undefined, true));
});

helixReasoningTheaterRouter.get("/reasoning-theater/atlas-graph", async (_req, res) => {
  sendNoCache(res);
  try {
    const payload = await getAtlasGraphCached();
    res.status(200).json(payload);
    return;
  } catch (error) {
    console.warn("[helix][reasoning-theater] atlas-graph fallback:", error);
  }
  res.status(200).json(buildAtlasGraphFallback(undefined, true));
});
