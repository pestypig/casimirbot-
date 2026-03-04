import { describe, expect, it } from "vitest";
import {
  getDefaultReasoningTheaterConfig,
  parseReasoningTheaterConfigPayload,
} from "@/lib/helix/reasoning-theater-config";
import {
  advanceReasoningTheaterFrontierTracker,
  classifyReasoningTheaterFrontierAction,
  clampFrontierMeterPct,
  createReasoningTheaterFrontierTrackerState,
  resolveReasoningTheaterFrontierParticleProfile,
} from "@/lib/helix/reasoning-theater-frontier";

describe("reasoning theater frontier actions", () => {
  it("classifies all six action boundaries deterministically", () => {
    const cfg = getDefaultReasoningTheaterConfig().frontier_actions;
    const classify = (delta: number) =>
      classifyReasoningTheaterFrontierAction({
        windowDeltaPct: delta,
        stance: "contested",
        suppressionReason: null,
        thresholds: cfg.thresholds,
      });

    expect(classify(4)).toBe("large_gain");
    expect(classify(1)).toBe("small_gain");
    expect(classify(0.1)).toBe("steady");
    expect(classify(-1)).toBe("small_loss");
    expect(classify(-4)).toBe("large_loss");
    expect(classify(-9)).toBe("hard_drop");
  });

  it("prioritizes hard_drop over large_loss when suppression/stance requires it", () => {
    const cfg = getDefaultReasoningTheaterConfig().frontier_actions;
    const bySuppression = classifyReasoningTheaterFrontierAction({
      windowDeltaPct: -4,
      stance: "contested",
      suppressionReason: "contract_violation",
      thresholds: cfg.thresholds,
    });
    const byStance = classifyReasoningTheaterFrontierAction({
      windowDeltaPct: -4,
      stance: "fail_closed",
      suppressionReason: null,
      thresholds: cfg.thresholds,
    });
    expect(bySuppression).toBe("hard_drop");
    expect(byStance).toBe("hard_drop");
  });

  it("applies hysteresis so candidate jitter does not flicker committed action", () => {
    const cfg = getDefaultReasoningTheaterConfig().frontier_actions;
    let state = createReasoningTheaterFrontierTrackerState("steady");
    state = { ...state, committedAtMs: -1_000 };
    const series = [
      { nowMs: 0, meterPct: 50 },
      { nowMs: 60, meterPct: 50.6 },
      { nowMs: 120, meterPct: 51.4 },
      { nowMs: 180, meterPct: 50.8 },
      { nowMs: 240, meterPct: 51.6 },
      { nowMs: 300, meterPct: 50.7 },
    ];
    for (const sample of series) {
      state = advanceReasoningTheaterFrontierTracker(state, {
        ...sample,
        stance: "contested",
        suppressionReason: null,
        config: cfg,
      }).state;
    }
    expect(state.committedAction).toBe("steady");
  });

  it("enforces minimum visible hold before non-hard-drop action swap", () => {
    const base = getDefaultReasoningTheaterConfig().frontier_actions;
    const cfg = {
      ...base,
      window_ms: 1,
      switch_hold_frames: 1,
      min_action_ms: 180,
      thresholds: {
        ...base.thresholds,
        hard_drop_delta_pct: -99,
        large_gain_delta_pct: 0.5,
        small_gain_delta_pct: 0.2,
        large_loss_delta_pct: -0.5,
        small_loss_delta_pct: -0.2,
      },
    };
    let state = createReasoningTheaterFrontierTrackerState("steady");
    state = { ...state, committedAtMs: -1_000 };
    state = advanceReasoningTheaterFrontierTracker(state, {
      nowMs: 10,
      meterPct: 50,
      stance: "contested",
      suppressionReason: null,
      config: cfg,
    }).state;
    state = advanceReasoningTheaterFrontierTracker(state, {
      nowMs: 20,
      meterPct: 51.2,
      stance: "contested",
      suppressionReason: null,
      config: cfg,
    }).state;
    expect(state.committedAction).toBe("large_gain");
    state = advanceReasoningTheaterFrontierTracker(state, {
      nowMs: 80,
      meterPct: 50.2,
      stance: "contested",
      suppressionReason: null,
      config: cfg,
    }).state;
    expect(state.committedAction).toBe("large_gain");
  });

  it("clamps cursor position to 0..100", () => {
    expect(clampFrontierMeterPct(-5)).toBe(0);
    expect(clampFrontierMeterPct(42)).toBe(42);
    expect(clampFrontierMeterPct(1000)).toBe(100);
  });

  it("maps each action to a deterministic particle profile", () => {
    const cfg = getDefaultReasoningTheaterConfig().frontier_actions;
    const largeGain = resolveReasoningTheaterFrontierParticleProfile("large_gain", cfg);
    const hardDrop = resolveReasoningTheaterFrontierParticleProfile("hard_drop", cfg);
    expect(largeGain.color).toBe("#34D399");
    expect(largeGain.transition_burst).toBe(true);
    expect(hardDrop.color).toBe("#EF4444");
    expect(hardDrop.shock_ring).toBe(true);
  });

  it("falls back to defaults when frontier config payload is missing or invalid", () => {
    const fallback = parseReasoningTheaterConfigPayload({ version: "x" });
    expect(fallback.frontier_actions.window_ms).toBe(200);
    const partial = parseReasoningTheaterConfigPayload({
      version: "custom",
      frontier_actions: {
        window_ms: "bad",
        actions: { large_gain: { icon_path: "/x.svg" } },
      },
    });
    expect(partial.version).toBe("custom");
    expect(partial.frontier_actions.window_ms).toBe(200);
    expect(partial.frontier_actions.actions.large_gain.icon_path).toBe("/x.svg");
    expect(partial.frontier_actions.actions.hard_drop.icon_path).toBe(
      "/reasoning-theater/frontier-actions/hard_drop.svg",
    );
  });
});

