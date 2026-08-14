import { HELIX_ROBINHOOD_TRADING_MCP_RESOURCE } from
  "../../../shared/helix-brokerage-environment";

const ROBINHOOD_AUTHORIZATION_ORIGIN = "https://robinhood.com";
const ROBINHOOD_AUTHORIZATION_PATH = "/oauth";
const ROBINHOOD_CALLBACK_PATH =
  "/api/agi/brokerage-connections/robinhood/oauth/callback";

const validLoopbackCallback = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" &&
      parsed.hostname === "127.0.0.1" &&
      Boolean(parsed.port) &&
      parsed.pathname === ROBINHOOD_CALLBACK_PATH &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash;
  } catch {
    return false;
  }
};

export const isAllowedDesktopRobinhoodAuthorizationUrl = (
  candidate: unknown,
): candidate is string => {
  if (typeof candidate !== "string" || candidate.length > 8_192) return false;
  try {
    const parsed = new URL(candidate);
    const required = [
      "response_type",
      "client_id",
      "redirect_uri",
      "code_challenge",
      "code_challenge_method",
      "resource",
      "state",
    ] as const;
    const optional = new Set(["scope"]);
    const names = [...parsed.searchParams.keys()];
    if (
      parsed.origin !== ROBINHOOD_AUTHORIZATION_ORIGIN ||
      parsed.pathname !== ROBINHOOD_AUTHORIZATION_PATH ||
      parsed.username ||
      parsed.password ||
      parsed.hash ||
      parsed.searchParams.get("response_type") !== "code" ||
      parsed.searchParams.get("code_challenge_method") !== "S256" ||
      parsed.searchParams.get("resource") !==
        HELIX_ROBINHOOD_TRADING_MCP_RESOURCE ||
      required.some((name) => parsed.searchParams.getAll(name).length !== 1) ||
      names.some((name) =>
        !required.includes(name as (typeof required)[number]) &&
        !optional.has(name)
      ) ||
      parsed.searchParams.getAll("scope").length > 1 ||
      !/^[A-Za-z0-9_-]{8,256}$/u.test(
        parsed.searchParams.get("client_id") ?? "",
      ) ||
      !/^[A-Za-z0-9_-]{43,128}$/u.test(
        parsed.searchParams.get("code_challenge") ?? "",
      ) ||
      !/^[A-Za-z0-9_-]{32,512}$/u.test(
        parsed.searchParams.get("state") ?? "",
      ) ||
      !validLoopbackCallback(parsed.searchParams.get("redirect_uri") ?? "")
    ) {
      return false;
    }
    const scope = parsed.searchParams.get("scope");
    return scope === null || (
      scope.length > 0 &&
      scope.length <= 2_048 &&
      scope.split(/\s+/u).every((entry) =>
        /^[A-Za-z0-9:._/-]{1,128}$/u.test(entry)
      )
    );
  } catch {
    return false;
  }
};
