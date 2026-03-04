export const REASONING_THEATER_FRONTIER_ACTIONS = [
  "large_gain",
  "small_gain",
  "steady",
  "small_loss",
  "large_loss",
  "hard_drop",
] as const;

export type ReasoningTheaterFrontierAction =
  (typeof REASONING_THEATER_FRONTIER_ACTIONS)[number];

export type ReasoningTheaterFrontierThresholds = {
  hard_drop_delta_pct: number;
  large_gain_delta_pct: number;
  small_gain_delta_pct: number;
  large_loss_delta_pct: number;
  small_loss_delta_pct: number;
};

export type ReasoningTheaterFrontierParticleProfile = {
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

export type ReasoningTheaterFrontierActionConfig = {
  icon_path: string;
  particle_profile: ReasoningTheaterFrontierParticleProfile;
};

export type ReasoningTheaterFrontierActionsConfig = {
  window_ms: number;
  switch_hold_frames: number;
  min_action_ms: number;
  thresholds: ReasoningTheaterFrontierThresholds;
  actions: Record<ReasoningTheaterFrontierAction, ReasoningTheaterFrontierActionConfig>;
};

export type ReasoningTheaterConfigResponse = {
  version: string;
  frontier_actions: ReasoningTheaterFrontierActionsConfig;
};

const DEFAULT_VERSION = "reasoning_theater.v1";

export const DEFAULT_REASONING_THEATER_FRONTIER_CONFIG: ReasoningTheaterFrontierActionsConfig = {
  window_ms: 200,
  switch_hold_frames: 4,
  min_action_ms: 180,
  thresholds: {
    hard_drop_delta_pct: -8.0,
    large_gain_delta_pct: 3.0,
    small_gain_delta_pct: 0.8,
    large_loss_delta_pct: -3.0,
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
};

const DEFAULT_REASONING_THEATER_CONFIG_RESPONSE: ReasoningTheaterConfigResponse = {
  version: DEFAULT_VERSION,
  frontier_actions: DEFAULT_REASONING_THEATER_FRONTIER_CONFIG,
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

function readBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "1") return true;
  if (value === "0") return false;
  return fallback;
}

function readColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

function readPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

function parseParticleProfile(
  value: unknown,
  fallback: ReasoningTheaterFrontierParticleProfile,
): ReasoningTheaterFrontierParticleProfile {
  const raw = readObject(value);
  if (!raw) return fallback;
  const speedMin = readNumber(raw.speed_min_px_s, fallback.speed_min_px_s);
  const speedMax = readNumber(raw.speed_max_px_s, fallback.speed_max_px_s);
  const clampedSpeedMin = Math.max(0, speedMin);
  return {
    color: readColor(raw.color, fallback.color),
    base_direction_deg: readNumber(raw.base_direction_deg, fallback.base_direction_deg),
    spread_deg: Math.max(0, readNumber(raw.spread_deg, fallback.spread_deg)),
    speed_min_px_s: clampedSpeedMin,
    speed_max_px_s: Math.max(clampedSpeedMin, speedMax),
    turbulence: Math.max(0, readNumber(raw.turbulence, fallback.turbulence)),
    emit_rate_hz: Math.max(0, readNumber(raw.emit_rate_hz, fallback.emit_rate_hz)),
    transition_burst: readBool(raw.transition_burst, fallback.transition_burst),
    shock_ring: readBool(raw.shock_ring, fallback.shock_ring),
  };
}

function parseActionConfig(
  value: unknown,
  fallback: ReasoningTheaterFrontierActionConfig,
): ReasoningTheaterFrontierActionConfig {
  const raw = readObject(value);
  if (!raw) return fallback;
  return {
    icon_path: readPath(raw.icon_path, fallback.icon_path),
    particle_profile: parseParticleProfile(raw.particle_profile, fallback.particle_profile),
  };
}

export function parseReasoningTheaterConfigPayload(
  value: unknown,
): ReasoningTheaterConfigResponse {
  const root = readObject(value);
  if (!root) return DEFAULT_REASONING_THEATER_CONFIG_RESPONSE;
  const frontierRaw = readObject(root.frontier_actions);
  if (!frontierRaw) {
    return {
      version:
        typeof root.version === "string" && root.version.trim()
          ? root.version
          : DEFAULT_VERSION,
      frontier_actions: DEFAULT_REASONING_THEATER_FRONTIER_CONFIG,
    };
  }
  const thresholdsRaw = readObject(frontierRaw.thresholds);
  const defaults = DEFAULT_REASONING_THEATER_FRONTIER_CONFIG;
  const thresholds: ReasoningTheaterFrontierThresholds = {
    hard_drop_delta_pct: readNumber(
      thresholdsRaw?.hard_drop_delta_pct,
      defaults.thresholds.hard_drop_delta_pct,
    ),
    large_gain_delta_pct: readNumber(
      thresholdsRaw?.large_gain_delta_pct,
      defaults.thresholds.large_gain_delta_pct,
    ),
    small_gain_delta_pct: readNumber(
      thresholdsRaw?.small_gain_delta_pct,
      defaults.thresholds.small_gain_delta_pct,
    ),
    large_loss_delta_pct: readNumber(
      thresholdsRaw?.large_loss_delta_pct,
      defaults.thresholds.large_loss_delta_pct,
    ),
    small_loss_delta_pct: readNumber(
      thresholdsRaw?.small_loss_delta_pct,
      defaults.thresholds.small_loss_delta_pct,
    ),
  };

  const actionsRaw = readObject(frontierRaw.actions);
  const actions: Record<ReasoningTheaterFrontierAction, ReasoningTheaterFrontierActionConfig> = {
    large_gain: parseActionConfig(actionsRaw?.large_gain, defaults.actions.large_gain),
    small_gain: parseActionConfig(actionsRaw?.small_gain, defaults.actions.small_gain),
    steady: parseActionConfig(actionsRaw?.steady, defaults.actions.steady),
    small_loss: parseActionConfig(actionsRaw?.small_loss, defaults.actions.small_loss),
    large_loss: parseActionConfig(actionsRaw?.large_loss, defaults.actions.large_loss),
    hard_drop: parseActionConfig(actionsRaw?.hard_drop, defaults.actions.hard_drop),
  };

  const frontier_actions: ReasoningTheaterFrontierActionsConfig = {
    window_ms: readPositiveInt(frontierRaw.window_ms, defaults.window_ms),
    switch_hold_frames: readPositiveInt(
      frontierRaw.switch_hold_frames,
      defaults.switch_hold_frames,
    ),
    min_action_ms: readPositiveInt(frontierRaw.min_action_ms, defaults.min_action_ms),
    thresholds,
    actions,
  };

  return {
    version:
      typeof root.version === "string" && root.version.trim()
        ? root.version
        : DEFAULT_VERSION,
    frontier_actions,
  };
}

export function getDefaultReasoningTheaterConfig(): ReasoningTheaterConfigResponse {
  return parseReasoningTheaterConfigPayload(DEFAULT_REASONING_THEATER_CONFIG_RESPONSE);
}
