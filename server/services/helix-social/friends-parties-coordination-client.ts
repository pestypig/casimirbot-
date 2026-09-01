const BROKER_SCHEMA = "casimir_desktop_friends_parties_coordination_broker/1";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

type BrokerConfig = { origin: string; token: string };

export class HelixFriendsPartiesCoordinationError extends Error {
  constructor(
    readonly code: "friends_parties_coordination_unavailable",
    message = "Friends & Parties domain coordination is unavailable.",
  ) {
    super(message);
    this.name = "HelixFriendsPartiesCoordinationError";
  }
}

const resolveConfig = (env: NodeJS.ProcessEnv = process.env): BrokerConfig | null => {
  const origin = env.HELIX_FRIENDS_PARTIES_COORDINATION_BROKER_ORIGIN?.trim() ?? "";
  const token = env.HELIX_FRIENDS_PARTIES_COORDINATION_BROKER_TOKEN?.trim() ?? "";
  if (!origin && !token) return null;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    throw new HelixFriendsPartiesCoordinationError(
      "friends_parties_coordination_unavailable",
    );
  }
  if (
    parsed.protocol !== "http:" || parsed.hostname !== "127.0.0.1" ||
    !parsed.port || parsed.pathname !== "/" || parsed.search || parsed.hash ||
    !TOKEN_PATTERN.test(token)
  ) {
    throw new HelixFriendsPartiesCoordinationError(
      "friends_parties_coordination_unavailable",
    );
  }
  return { origin: parsed.origin, token };
};

const brokerRequest = async (
  path: "/v1/bootstrap" | "/v1/status" | "/v1/proxy",
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const config = resolveConfig();
  if (!config) {
    throw new HelixFriendsPartiesCoordinationError(
      "friends_parties_coordination_unavailable",
    );
  }
  try {
    const result = await fetch(`${config.origin}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    });
    const payload = await result.json().catch(() => null) as
      | Record<string, unknown> | null;
    if (!result.ok || payload?.schema !== BROKER_SCHEMA || payload.ok !== true) {
      throw new HelixFriendsPartiesCoordinationError(
        "friends_parties_coordination_unavailable",
      );
    }
    return payload;
  } catch (error) {
    if (error instanceof HelixFriendsPartiesCoordinationError) throw error;
    throw new HelixFriendsPartiesCoordinationError(
      "friends_parties_coordination_unavailable",
    );
  }
};

export const isDesktopFriendsPartiesCoordinationRequired = (
  env: NodeJS.ProcessEnv = process.env,
): boolean =>
  env.CASIMIR_DESKTOP_HOST?.trim() === "1" ||
  env.HELIX_FRIENDS_PARTIES_COORDINATION_REQUIRED?.trim() === "1";

export const bootstrapDesktopFriendsPartiesCoordination = async (input: {
  accessToken: string;
  localProfileId: string;
  localSessionId: string;
}): Promise<void> => {
  const config = resolveConfig();
  if (!config) return;
  await brokerRequest("/v1/bootstrap", input);
};

export const proxyDesktopFriendsPartiesRequest = async (input: {
  localProfileId: string;
  localSessionId: string;
  method: string;
  path: string;
  body: unknown;
}): Promise<{
  status: number;
  headers: { cacheControl: string | null; pragma: string | null; referrerPolicy: string | null };
  body: unknown;
}> => {
  const payload = await brokerRequest("/v1/proxy", input);
  const status = Number(payload.upstream_status);
  const headers = payload.upstream_headers && typeof payload.upstream_headers === "object"
    ? payload.upstream_headers as Record<string, unknown>
    : {};
  if (!Number.isInteger(status) || status < 100 || status > 599) {
    throw new HelixFriendsPartiesCoordinationError(
      "friends_parties_coordination_unavailable",
    );
  }
  return {
    status,
    headers: {
      cacheControl: typeof headers.cache_control === "string" ? headers.cache_control : null,
      pragma: typeof headers.pragma === "string" ? headers.pragma : null,
      referrerPolicy: typeof headers.referrer_policy === "string" ? headers.referrer_policy : null,
    },
    body: payload.upstream_body ?? null,
  };
};
