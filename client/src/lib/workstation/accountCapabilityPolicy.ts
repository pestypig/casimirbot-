import type { HelixAccountCapabilityPolicy } from "@shared/helix-account-session";
import { HELIX_USER_ACCOUNT_POLICY } from "@shared/helix-account-session";

export const HELIX_ACCOUNT_CAPABILITY_POLICY_EVENT =
  "helix-account-capability-policy-changed";

let cachedPolicy: HelixAccountCapabilityPolicy | null = null;

export function readCachedAccountCapabilityPolicy(): HelixAccountCapabilityPolicy | null {
  return cachedPolicy;
}

export function cacheAccountCapabilityPolicy(
  policy: HelixAccountCapabilityPolicy | null,
): HelixAccountCapabilityPolicy | null {
  cachedPolicy = policy;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(HELIX_ACCOUNT_CAPABILITY_POLICY_EVENT, {
      detail: { account_policy: policy },
    }));
  }
  return cachedPolicy;
}

export function clearCachedAccountCapabilityPolicy(): void {
  cacheAccountCapabilityPolicy(null);
}

export async function fetchAccountCapabilityPolicy(): Promise<HelixAccountCapabilityPolicy> {
  if (typeof fetch !== "function") return HELIX_USER_ACCOUNT_POLICY;
  const response = await fetch("/api/account/session", {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) return cachedPolicy ?? HELIX_USER_ACCOUNT_POLICY;
  const payload = await response.json();
  const policy =
    payload?.account_policy ??
    payload?.session?.account_policy ??
    HELIX_USER_ACCOUNT_POLICY;
  cacheAccountCapabilityPolicy(policy);
  return policy;
}
