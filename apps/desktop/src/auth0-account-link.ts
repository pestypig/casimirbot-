import {
  DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI,
} from "../../../shared/desktop-auth0-account-link";
import {
  AUTH0_MFA_ACR,
  AUTH0_STEP_UP_MAXIMUM_MAX_AGE_SECONDS,
  AUTH0_STEP_UP_MINIMUM_MAX_AGE_SECONDS,
} from "../../../shared/desktop-auth0-step-up";

const CALLBACK_PREFIX = `${DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI}?`;

export const shouldRegisterDesktopProtocol = (
  hasIsolatedUserDataSwitch: boolean,
): boolean => !hasIsolatedUserDataSwitch;

const exactIssuerAuthorizeUrl = (issuer: string): URL | null => {
  try {
    const parsed = new URL(issuer);
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    parsed.pathname = "/authorize";
    return parsed;
  } catch {
    return null;
  }
};

export const extractDesktopAuth0Callback = (
  commandLine: readonly string[],
): string | null => {
  for (const argument of commandLine) {
    if (!argument.startsWith(CALLBACK_PREFIX) || argument.length > 8_192) {
      continue;
    }
    try {
      const parsed = new URL(argument);
      if (
        parsed.protocol === "casimirbot:" &&
        parsed.hostname === "oauth" &&
        parsed.pathname === "/callback" &&
        !parsed.username &&
        !parsed.password &&
        !parsed.hash
      ) {
        return parsed.toString();
      }
    } catch {
      // Ignore unrelated or malformed process arguments.
    }
  }
  return null;
};

export const isAllowedDesktopAuth0AuthorizationUrl = (
  candidate: unknown,
  input: {
    issuer: string | undefined;
    clientId: string | undefined;
  },
): candidate is string => {
  if (typeof candidate !== "string" || candidate.length > 8_192) return false;
  const expected = exactIssuerAuthorizeUrl(input.issuer?.trim() ?? "");
  const clientId = input.clientId?.trim() ?? "";
  if (!expected || !clientId) return false;
  try {
    const parsed = new URL(candidate);
    const required = [
      "response_type",
      "client_id",
      "redirect_uri",
      "scope",
      "audience",
      "state",
      "code_challenge",
      "code_challenge_method",
    ] as const;
    const names = [...parsed.searchParams.keys()];
    if (
      parsed.protocol !== "https:" ||
      parsed.origin !== expected.origin ||
      parsed.pathname !== expected.pathname ||
      parsed.username ||
      parsed.password ||
      parsed.hash ||
      parsed.searchParams.get("response_type") !== "code" ||
      parsed.searchParams.get("client_id") !== clientId ||
      parsed.searchParams.get("redirect_uri") !==
        DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI ||
      parsed.searchParams.get("code_challenge_method") !== "S256" ||
      required.some((name) => parsed.searchParams.getAll(name).length !== 1) ||
      names.some((name) => !required.includes(name as (typeof required)[number])) ||
      !/^[A-Za-z0-9_-]{32,512}$/u.test(
        parsed.searchParams.get("state") ?? "",
      ) ||
      !/^[A-Za-z0-9_-]{43,128}$/u.test(
        parsed.searchParams.get("code_challenge") ?? "",
      )
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const isAllowedDesktopAuth0StepUpAuthorizationUrl = (
  candidate: unknown,
  input: {
    issuer: string | undefined;
    clientId: string | undefined;
  },
): candidate is string => {
  if (typeof candidate !== "string" || candidate.length > 8_192) return false;
  const expected = exactIssuerAuthorizeUrl(input.issuer?.trim() ?? "");
  const clientId = input.clientId?.trim() ?? "";
  if (!expected || !clientId) return false;
  try {
    const parsed = new URL(candidate);
    const required = [
      "response_type",
      "client_id",
      "redirect_uri",
      "scope",
      "audience",
      "state",
      "code_challenge",
      "code_challenge_method",
      "nonce",
      "acr_values",
      "max_age",
    ] as const;
    const names = [...parsed.searchParams.keys()];
    const maxAgeText = parsed.searchParams.get("max_age") ?? "";
    const maxAge = Number.parseInt(maxAgeText, 10);
    return Boolean(
      parsed.protocol === "https:" &&
      parsed.origin === expected.origin &&
      parsed.pathname === expected.pathname &&
      !parsed.username &&
      !parsed.password &&
      !parsed.hash &&
      parsed.searchParams.get("response_type") === "code" &&
      parsed.searchParams.get("client_id") === clientId &&
      parsed.searchParams.get("redirect_uri") ===
        DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI &&
      parsed.searchParams.get("code_challenge_method") === "S256" &&
      parsed.searchParams.get("acr_values") === AUTH0_MFA_ACR &&
      String(maxAge) === maxAgeText &&
      maxAge >= AUTH0_STEP_UP_MINIMUM_MAX_AGE_SECONDS &&
      maxAge <= AUTH0_STEP_UP_MAXIMUM_MAX_AGE_SECONDS &&
      required.every((name) => parsed.searchParams.getAll(name).length === 1) &&
      names.every((name) => required.includes(name as (typeof required)[number])) &&
      /^[A-Za-z0-9_-]{32,512}$/u.test(parsed.searchParams.get("state") ?? "") &&
      /^[A-Za-z0-9_-]{43,128}$/u.test(parsed.searchParams.get("code_challenge") ?? "") &&
      /^[A-Za-z0-9_-]{43}$/u.test(parsed.searchParams.get("nonce") ?? "")
    );
  } catch {
    return false;
  }
};
