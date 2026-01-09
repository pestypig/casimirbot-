import micromatch from "micromatch";

const DEFAULT_ALLOW = ["127.0.0.1", "::1", "localhost", "*.hull"] as const;

const toPatterns = (raw: string | undefined): string[] => {
  if (!raw) {
    return [...DEFAULT_ALLOW];
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeHost = (value: string): string => {
  if (!value) {
    return "";
  }
  try {
    return new URL(value).hostname || value;
  } catch {
    const stripped = value.replace(/^https?:\/\//, "");
    const host = stripped.split(/[/?#]/)[0] ?? "";
    return host;
  }
};

export const hullModeEnabled = (): boolean => process.env.HULL_MODE === "1";

export const getHullAllowList = (): string[] => toPatterns(process.env.HULL_ALLOW_HOSTS);

export function isHullAllowed(target: string): boolean {
  if (!hullModeEnabled()) {
    return true;
  }
  const host = normalizeHost(target);
  if (!host) {
    return false;
  }
  const allowList = getHullAllowList();
  return allowList.some((pattern) => micromatch.isMatch(host, pattern));
}

export function assertHullAllowed(target: string): void {
  if (isHullAllowed(target)) {
    return;
  }
  const message = `HULL_MODE: blocked outbound to ${target}`;
  // eslint-disable-next-line no-console
  console.warn(message);
  const error = new Error(message) as NodeJS.ErrnoException & {
    type?: string;
    policy?: {
      reason: string;
      capability?: string;
      risks?: string[];
    };
  };
  error.code = "HULL_BLOCKED";
  error.type = "forbidden";
  error.policy = {
    reason: message,
    capability: "network_access",
    risks: ["network_access"],
  };
  throw error;
}

export function shouldRegisterExternalAdapter(target?: string): { allowed: boolean; reason?: string } {
  if (!target) {
    return { allowed: false, reason: "missing" };
  }
  if (isHullAllowed(target)) {
    return { allowed: true };
  }
  return { allowed: false, reason: "blocked" };
}
