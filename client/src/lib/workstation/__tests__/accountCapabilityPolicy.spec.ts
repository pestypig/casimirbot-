/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import { HELIX_USER_ACCOUNT_POLICY } from "@shared/helix-account-session";
import {
  HELIX_ACCOUNT_CAPABILITY_POLICY_EVENT,
  HELIX_ACCOUNT_PROFILE_CHANGE_STORAGE_KEY,
  cacheAccountCapabilityPolicy,
  clearCachedAccountCapabilityPolicy,
  readCachedAccountProfileIdentity,
} from "@/lib/workstation/accountCapabilityPolicy";

describe("account capability policy identity events", () => {
  afterEach(() => {
    clearCachedAccountCapabilityPolicy();
  });

  it("marks an account profile switch even when the capability policy is unchanged", () => {
    const details: Array<Record<string, unknown>> = [];
    const listener = ((event: CustomEvent<Record<string, unknown>>) => {
      details.push(event.detail);
    }) as EventListener;
    window.addEventListener(HELIX_ACCOUNT_CAPABILITY_POLICY_EVENT, listener);
    try {
      cacheAccountCapabilityPolicy(HELIX_USER_ACCOUNT_POLICY, "profile:a");
      const eventCountAfterInitialProfile = details.length;
      cacheAccountCapabilityPolicy({
        ...HELIX_USER_ACCOUNT_POLICY,
        allowed_panels: [...HELIX_USER_ACCOUNT_POLICY.allowed_panels],
        locked_panels: [...HELIX_USER_ACCOUNT_POLICY.locked_panels],
        locked_features: [...HELIX_USER_ACCOUNT_POLICY.locked_features],
        allowed_runtime_agents: [...HELIX_USER_ACCOUNT_POLICY.allowed_runtime_agents],
        allowed_workstation_capabilities: [
          ...HELIX_USER_ACCOUNT_POLICY.allowed_workstation_capabilities,
        ],
        locked_workstation_capabilities: [
          ...HELIX_USER_ACCOUNT_POLICY.locked_workstation_capabilities,
        ],
        feature_flags: [...HELIX_USER_ACCOUNT_POLICY.feature_flags],
        quotas: { ...HELIX_USER_ACCOUNT_POLICY.quotas },
      }, "profile:a");
      expect(details).toHaveLength(eventCountAfterInitialProfile);
      cacheAccountCapabilityPolicy(HELIX_USER_ACCOUNT_POLICY, "profile:b");
      expect(details.at(-1)).toMatchObject({
        account_profile_id: "profile:b",
        account_profile_changed: true,
      });
      expect(window.localStorage.getItem(HELIX_ACCOUNT_PROFILE_CHANGE_STORAGE_KEY)).toEqual(expect.any(String));
      expect(readCachedAccountProfileIdentity()).toMatchObject({
        profileId: "profile:b",
        revision: expect.any(Number),
      });

      window.dispatchEvent(new StorageEvent("storage", {
        key: HELIX_ACCOUNT_PROFILE_CHANGE_STORAGE_KEY,
        newValue: "cross-tab-account-change",
      }));
      expect(details.at(-1)).toMatchObject({
        account_profile_changed: true,
        account_profile_cross_tab: true,
        account_profile_identity_known: false,
      });
    } finally {
      window.removeEventListener(HELIX_ACCOUNT_CAPABILITY_POLICY_EVENT, listener);
    }
  });
});
