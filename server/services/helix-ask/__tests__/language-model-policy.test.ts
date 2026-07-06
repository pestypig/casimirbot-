import { describe, expect, it } from "vitest";
import {
  buildHelixLanguageModelDebugSummary,
  resolveHelixLanguageModelPolicy,
} from "@shared/helix-language-model-policy";
import {
  HELIX_DEVELOPER_ACCOUNT_POLICY,
  HELIX_USER_ACCOUNT_POLICY,
} from "@shared/helix-account-session";

describe("Helix language model policy", () => {
  it("resolves public profiles without exposing exact model overrides to user accounts", () => {
    const policy = resolveHelixLanguageModelPolicy({
      requestedProfile: "deep",
      exactModelOverride: "gpt-5.5-pro",
      accountPolicy: HELIX_USER_ACCOUNT_POLICY,
      promptText: "Implement a multi-step runtime agent change.",
    });

    expect(policy.requested_profile).toBe("deep");
    expect(policy.account_policy).toBe("user");
    expect(policy.exact_model_override_requested).toBe(true);
    expect(policy.exact_model_override_allowed).toBe(false);
    expect(policy.exact_model_override_rejected_reason).toBe("exact_model_override_requires_developer_account");
    expect(policy.resolved_model).not.toBe("gpt-5.5-pro");
    expect(policy.assistant_answer).toBe(false);
    expect(policy.terminal_eligible).toBe(false);
  });

  it("allows developer exact-model overrides and records developer tool tier", () => {
    const policy = resolveHelixLanguageModelPolicy({
      requestedProfile: "balanced",
      exactModelOverride: "gpt-5.5-pro",
      accountPolicy: HELIX_DEVELOPER_ACCOUNT_POLICY,
      promptText: "Debug the agent runtime.",
    });

    expect(policy.selection_source).toBe("developer_override");
    expect(policy.resolved_model).toBe("gpt-5.5-pro");
    expect(policy.tool_surface_tier).toBe("developer");
    expect(policy.persistence_scope).toBe("session");
  });

  it("lets Auto choose deep turn-locally for complex work", () => {
    const policy = resolveHelixLanguageModelPolicy({
      requestedProfile: "auto",
      accountPolicy: HELIX_DEVELOPER_ACCOUNT_POLICY,
      promptText: "Research, implement, and verify a tool-heavy agent architecture change.",
    });

    expect(policy.requested_profile).toBe("auto");
    expect(policy.resolved_profile).toBe("deep");
    expect(policy.persistence_scope).toBe("turn");
    expect(policy.escalation_reason).toBe("complex_tool_planning");
    expect(buildHelixLanguageModelDebugSummary(policy)).toContain("AI: Auto -> Deep");
  });

  it("uses persisted user selection when no new request is provided", () => {
    const policy = resolveHelixLanguageModelPolicy({
      persistedProfile: "fast",
      accountPolicy: HELIX_USER_ACCOUNT_POLICY,
      promptText: "What is the current status?",
    });

    expect(policy.requested_profile).toBe("fast");
    expect(policy.resolved_profile).toBe("fast");
    expect(policy.persistence_scope).toBe("session");
  });

  it("downgrades by availability and budget without admitting tools", () => {
    const policy = resolveHelixLanguageModelPolicy({
      requestedProfile: "deep",
      accountPolicy: {
        ...HELIX_USER_ACCOUNT_POLICY,
        quotas: {
          ...HELIX_USER_ACCOUNT_POLICY.quotas,
          model_tokens_per_turn: 4_000,
        },
      },
      modelAccess: { deep: false },
      promptText: "Perform deep reasoning.",
    });

    expect(policy.selection_source).toBe("policy_downgrade");
    expect(policy.resolved_profile).toBe("fast");
    expect(policy.downgrade_reason).toBe("requested_profile_unavailable");
    expect(policy.budget_limits.effective_max_tokens_per_turn).toBeLessThanOrEqual(4_000);
    expect(policy).not.toHaveProperty("admitted_tool_families");
    expect(policy).not.toHaveProperty("admitted_capabilities");
  });
});

