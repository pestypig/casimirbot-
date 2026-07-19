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
      cacheAccountCapabilityPolicy(HELIX_USER_ACCOUNT_POLICY, "profile:a");
      cacheAccountCapabilityPolicy(HELIX_USER_ACCOUNT_POLICY, "profile:b");
      expect(details.at(-2)).toMatchObject({
        account_profile_id: "profile:a",
        account_profile_changed: false,
      });
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
