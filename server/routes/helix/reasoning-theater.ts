import { Router, type Response } from "express";
import fs from "node:fs";
import path from "node:path";

type FrontierAction =
  | "large_gain"
  | "small_gain"
  | "steady"
  | "small_loss"
  | "large_loss"
  | "hard_drop";

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
};

const CONFIG_PATH = path.resolve(process.cwd(), "configs", "helix-reasoning-theater.v1.json");

const readObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const readNumber = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Math.floor(readNumber(value, fallback));
  return parsed > 0 ? parsed : fallback;
};

const readString = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
};

const readBool = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") return value;
  if (value === "1") return true;
  if (value === "0") return false;
  return fallback;
};

const sanitizeConfig = (input: unknown): FrontierConfigResponse => {
  const root = readObject(input);
  if (!root) return DEFAULT_FRONTIER_CONFIG;
  const frontierRaw = readObject(root.frontier_actions);
  if (!frontierRaw) {
    return {
      version: readString(root.version, DEFAULT_FRONTIER_CONFIG.version),
      frontier_actions: DEFAULT_FRONTIER_CONFIG.frontier_actions,
    };
  }
  const thresholdRaw = readObject(frontierRaw.thresholds);
  const actionRaw = readObject(frontierRaw.actions);
  const defaults = DEFAULT_FRONTIER_CONFIG.frontier_actions;

  const parseAction = (name: FrontierAction) => {
    const fallback = defaults.actions[name];
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
        spread_deg: Math.max(
          0,
          readNumber(particleRaw?.spread_deg, fallback.particle_profile.spread_deg),
        ),
        speed_min_px_s: speedMin,
        speed_max_px_s: Math.max(
          speedMin,
          readNumber(particleRaw?.speed_max_px_s, fallback.particle_profile.speed_max_px_s),
        ),
        turbulence: Math.max(
          0,
          readNumber(particleRaw?.turbulence, fallback.particle_profile.turbulence),
        ),
        emit_rate_hz: Math.max(
          0,
          readNumber(particleRaw?.emit_rate_hz, fallback.particle_profile.emit_rate_hz),
        ),
        transition_burst: readBool(
          particleRaw?.transition_burst,
          fallback.particle_profile.transition_burst,
        ),
        shock_ring: readBool(particleRaw?.shock_ring, fallback.particle_profile.shock_ring),
      },
    };
  };

  return {
    version: readString(root.version, DEFAULT_FRONTIER_CONFIG.version),
    frontier_actions: {
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
        large_gain: parseAction("large_gain"),
        small_gain: parseAction("small_gain"),
        steady: parseAction("steady"),
        small_loss: parseAction("small_loss"),
        large_loss: parseAction("large_loss"),
        hard_drop: parseAction("hard_drop"),
      },
    },
  };
};

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
