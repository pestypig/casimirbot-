import { describe, expect, it } from "vitest";
import { __testHelixAskStage0Debug } from "../server/routes/agi.plan";

describe("helix ask stage0 debug propagation", () => {
  it("writes soft must-include telemetry into global and scoped debug payloads", () => {
    const debugPayload: Record<string, unknown> = {};
    __testHelixAskStage0Debug.applyStage0DebugFields(
      debugPayload,
      {
        used: false,
        shadow_only: true,
        candidate_count: 8,
        hit_rate: 0.25,
        fallback_reason: "stage0_shadow_mode",
        build_age_ms: 1250,
        commit: "abc123",
        rollout_mode: "shadow",
        canary_hit: true,
        soft_must_include_applied: true,
        policy_decision: "stage0_shadow_mode",
        fail_open_reason: "stage0_shadow_mode",
      },
      "retrieval",
    );

    expect(debugPayload.stage0_soft_must_include_applied).toBe(true);
    expect(debugPayload.retrieval_stage0_soft_must_include_applied).toBe(true);
  });

  it("merges soft must-include telemetry deterministically", () => {
    const merged = __testHelixAskStage0Debug.mergeRepoSearchStage0Telemetry(
      {
        used: false,
        shadow_only: true,
        candidate_count: 1,
        hit_rate: 0,
        fallback_reason: "stage0_shadow_mode",
        build_age_ms: null,
        commit: null,
        soft_must_include_applied: false,
      },
      {
        used: true,
        shadow_only: false,
        candidate_count: 3,
        hit_rate: 0.5,
        fallback_reason: null,
        build_age_ms: null,
        commit: "def456",
        soft_must_include_applied: true,
      },
    );

    expect(merged?.soft_must_include_applied).toBe(true);
    expect(merged?.used).toBe(true);
    expect(merged?.candidate_count).toBe(3);
  });

  it("keeps effective stage0 state consistent when later pass is bypassed", () => {
    const debugPayload: Record<string, unknown> = {};

    __testHelixAskStage0Debug.applyStage0DebugFields(debugPayload, {
      used: true,
      shadow_only: false,
      candidate_count: 12,
      hit_rate: 0.5,
      fallback_reason: null,
      build_age_ms: 500,
      commit: "abc123",
      rollout_mode: "full",
      canary_hit: true,
      policy_decision: "stage0_active",
      fail_open_reason: null,
      soft_must_include_applied: true,
    });

    __testHelixAskStage0Debug.applyStage0DebugFields(debugPayload, {
      used: false,
      shadow_only: false,
      candidate_count: 0,
      hit_rate: 0,
      fallback_reason: "explicit_path_query",
      build_age_ms: 700,
      commit: "abc123",
      rollout_mode: "full",
      canary_hit: true,
      policy_decision: "explicit_path_query",
      fail_open_reason: "explicit_path_query",
      soft_must_include_applied: true,
    });

    expect(debugPayload.stage0_used).toBe(true);
    expect(debugPayload.stage0_policy_decision).toBe("stage0_active");
    expect(debugPayload.stage0_fallback_reason).toBeNull();
    expect(debugPayload.stage0_fail_open_reason).toBeNull();
  });

  it("prefers active policy when merging telemetry across passes", () => {
    const merged = __testHelixAskStage0Debug.mergeRepoSearchStage0Telemetry(
      {
        used: true,
        shadow_only: false,
        candidate_count: 10,
        hit_rate: 0.2,
        fallback_reason: null,
        build_age_ms: 100,
        commit: "abc123",
        policy_decision: "stage0_active",
        fail_open_reason: null,
      },
      {
        used: false,
        shadow_only: false,
        candidate_count: 0,
        hit_rate: 0,
        fallback_reason: "explicit_path_query",
        build_age_ms: 120,
        commit: "abc123",
        policy_decision: "explicit_path_query",
        fail_open_reason: "explicit_path_query",
      },
    );

    expect(merged?.used).toBe(true);
    expect(merged?.policy_decision).toBe("stage0_active");
    expect(merged?.fallback_reason).toBeNull();
    expect(merged?.fail_open_reason).toBeNull();
  });
});
