import { describe, expect, it } from "vitest";
import {
  buildHelixAccountCapabilityPolicy,
  type HelixAccountType,
} from "@shared/helix-account-session";
import type { HelixWorkstationGatewayAccountContext } from "../../workstation-tool-gateway/account-policy";
import {
  buildRuntimeGoalTrustedAccountBinding,
  buildRuntimeGoalAccountScope,
  fingerprintRuntimeGoalAccountPolicy,
  intersectRuntimeGoalAllowedWorkstationTools,
  runtimeGoalAccountScopeMatchesBinding,
  validateRuntimeGoalAccountBinding,
} from "../runtime-goal-account-binding";

const accountContext = (input: {
  sessionId: string;
  profileId: string;
  accountType?: HelixAccountType;
}): HelixWorkstationGatewayAccountContext => {
  const accountType = input.accountType ?? "developer";
  const policy = buildHelixAccountCapabilityPolicy(accountType);
  const timestamp = "2026-07-19T00:00:00.000Z";
  return {
    session_id: input.sessionId,
    profile_id: input.profileId,
    trusted_account_session: true,
    account_policy: policy,
    account_session: {
      schema: "helix.account_session.v1",
      session_id: input.sessionId,
      profile: {
        profile_id: input.profileId,
        display_name: input.profileId,
        auth_mode: "local_dev_profile",
        account_type: accountType,
        provider: "local",
        created_at: timestamp,
        updated_at: timestamp,
      },
      account_policy: policy,
      status: "active",
      memory_scope: "profile",
      created_at: timestamp,
      updated_at: timestamp,
    },
  };
};

describe("runtime goal trusted account binding", () => {
  it("binds an active server account without exposing raw identity in its projection", () => {
    const context = accountContext({
      sessionId: "session:goal-owner",
      profileId: "profile:goal-owner",
    });
    const binding = buildRuntimeGoalTrustedAccountBinding({
      accountContext: context,
      allowedWorkstationTools: ["repo.search"],
      nowMs: 100,
    });
    const validation = validateRuntimeGoalAccountBinding({
      binding,
      accountContext: context,
      sessionAllowedWorkstationTools: ["repo.search"],
      runtimeAgentProvider: "codex",
    });

    expect(binding).toMatchObject({
      schema: "helix.runtime_goal.account_binding.v1",
      session_id: "session:goal-owner",
      profile_id: "profile:goal-owner",
      account_type: "developer",
    });
    expect(validation).toMatchObject({
      admitted: true,
      status: "trusted",
      effectiveAllowedWorkstationTools: ["repo.search"],
      projection: {
        trusted: true,
        validation_status: "trusted",
        raw_session_id_included: false,
        raw_profile_id_included: false,
      },
    });
    expect(JSON.stringify(validation.projection)).not.toContain("session:goal-owner");
    expect(JSON.stringify(validation.projection)).not.toContain("profile:goal-owner");
  });

  it("rejects a different active session even when it belongs to the same account type", () => {
    const owner = accountContext({
      sessionId: "session:owner",
      profileId: "profile:owner",
    });
    const binding = buildRuntimeGoalTrustedAccountBinding({
      accountContext: owner,
      allowedWorkstationTools: ["repo.search"],
    });
    const validation = validateRuntimeGoalAccountBinding({
      binding,
      accountContext: accountContext({
        sessionId: "session:other",
        profileId: "profile:other",
      }),
      sessionAllowedWorkstationTools: ["repo.search"],
      runtimeAgentProvider: "codex",
    });

    expect(validation).toMatchObject({
      admitted: false,
      status: "session_mismatch",
      blockedReason: "runtime_goal_account_session_mismatch",
      effectiveAllowedWorkstationTools: [],
    });
  });

  it("projects only opaque account scope and matches the owning binding", () => {
    const owner = accountContext({
      sessionId: "session:scope-owner",
      profileId: "profile:scope-owner",
    });
    const binding = buildRuntimeGoalTrustedAccountBinding({
      accountContext: owner,
      allowedWorkstationTools: ["repo.search"],
    });
    const ownerScope = buildRuntimeGoalAccountScope(owner);
    const otherScope = buildRuntimeGoalAccountScope(accountContext({
      sessionId: "session:scope-other",
      profileId: "profile:scope-other",
    }));

    expect(ownerScope).toMatchObject({
      schema: "helix.runtime_goal.account_scope.v1",
      trusted: true,
      raw_session_id_included: false,
      raw_profile_id_included: false,
    });
    expect(JSON.stringify(ownerScope)).not.toContain("session:scope-owner");
    expect(JSON.stringify(ownerScope)).not.toContain("profile:scope-owner");
    expect(runtimeGoalAccountScopeMatchesBinding({ scope: ownerScope, binding })).toBe(true);
    expect(runtimeGoalAccountScopeMatchesBinding({ scope: otherScope, binding })).toBe(false);
    expect(runtimeGoalAccountScopeMatchesBinding({ scope: null, binding })).toBe(false);
  });

  it("fails closed when the bound policy changes", () => {
    const owner = accountContext({
      sessionId: "session:policy",
      profileId: "profile:policy",
    });
    const binding = buildRuntimeGoalTrustedAccountBinding({
      accountContext: owner,
      allowedWorkstationTools: ["repo.search"],
    });
    const changed = accountContext({
      sessionId: "session:policy",
      profileId: "profile:policy",
    });
    changed.account_policy = {
      ...changed.account_policy,
      allowed_workstation_capabilities: ["repo.search"],
    };
    changed.account_session = changed.account_session
      ? { ...changed.account_session, account_policy: changed.account_policy }
      : null;

    expect(fingerprintRuntimeGoalAccountPolicy(changed.account_policy)).not.toBe(
      binding?.policy_fingerprint,
    );
    expect(validateRuntimeGoalAccountBinding({
      binding,
      accountContext: changed,
      sessionAllowedWorkstationTools: ["repo.search"],
      runtimeAgentProvider: "codex",
    })).toMatchObject({
      admitted: false,
      status: "policy_mismatch",
      blockedReason: "runtime_goal_account_policy_changed",
    });
  });

  it("intersects adapter, goal, and public-account capability policy", () => {
    const user = accountContext({
      sessionId: "session:user",
      profileId: "profile:user",
      accountType: "user",
    });
    const allowed = intersectRuntimeGoalAllowedWorkstationTools({
      adapterAllowedWorkstationTools: [
        "repo.search",
        "live_env.request_interim_voice_callout",
        "scientific-calculator.solve_expression",
      ],
      requestedAllowedWorkstationTools: [
        "repo.search",
        "live_env.request_interim_voice_callout",
        "not-a-real-capability",
      ],
      accountContext: user,
      runtimeAgentProvider: "codex",
    });

    expect(allowed).toEqual(["repo.search"]);
  });

  it("keeps an explicitly empty goal tool set as a hard deny", () => {
    const user = accountContext({
      sessionId: "session:empty-tool-set",
      profileId: "profile:empty-tool-set",
      accountType: "user",
    });

    expect(intersectRuntimeGoalAllowedWorkstationTools({
      adapterAllowedWorkstationTools: [
        "repo.search",
        "scientific-calculator.solve_expression",
      ],
      requestedAllowedWorkstationTools: [],
      accountContext: user,
      runtimeAgentProvider: "codex",
    })).toEqual([]);

    expect(intersectRuntimeGoalAllowedWorkstationTools({
      adapterAllowedWorkstationTools: [
        "repo.search",
        "scientific-calculator.solve_expression",
      ],
      requestedAllowedWorkstationTools: null,
      accountContext: user,
      runtimeAgentProvider: "codex",
    })).toEqual(["repo.search", "scientific-calculator.solve_expression"]);
  });
});
