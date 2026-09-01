import crypto from "node:crypto";
import http from "node:http";
import type { AddressInfo } from "node:net";

const BROKER_SCHEMA = "casimir_desktop_friends_parties_coordination_broker/1" as const;
const SESSION_SCHEMA = "helix.friends_parties.coordination_session.v1";
const MAX_REQUEST_BYTES = 384 * 1_024;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const API_PREFIX = "/api/agi/friends-parties";

type CoordinationGrant = {
  localProfileId: string;
  localSessionId: string;
  remoteCookie: string;
  remoteProfileRef: string;
  expiresAtMs: number;
};

export type DesktopFriendsPartiesCoordinationBroker = Readonly<{
  origin: string;
  token: string;
  remoteOrigin: string;
  close: () => Promise<void>;
}>;

const exactRemoteOrigin = (
  value: string,
  allowInsecureLoopback: boolean,
): string => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("friends_parties_coordination_origin_invalid");
  }
  const loopback = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  if (
    (parsed.protocol !== "https:" && !(allowInsecureLoopback && loopback && parsed.protocol === "http:")) ||
    parsed.username || parsed.password || parsed.pathname !== "/" ||
    parsed.search || parsed.hash
  ) {
    throw new Error("friends_parties_coordination_origin_invalid");
  }
  return parsed.origin;
};

const readJsonBody = async (request: http.IncomingMessage): Promise<Record<string, unknown>> => {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_REQUEST_BYTES) {
      throw new Error("coordination_broker_payload_too_large");
    }
    chunks.push(buffer);
  }
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("coordination_broker_payload_invalid");
  }
  return parsed as Record<string, unknown>;
};

const isAuthorized = (request: http.IncomingMessage, token: string): boolean => {
  const supplied = request.headers.authorization?.replace(/^Bearer /u, "") ?? "";
  if (!TOKEN_PATTERN.test(supplied)) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(token));
};

const sendJson = (
  response: http.ServerResponse,
  status: number,
  body: unknown,
): void => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  response.end(JSON.stringify(body));
};

const cleanIdentity = (value: unknown, code: string): string => {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized || normalized.length > 512 || /[\x00-\x1f\x7f]/u.test(normalized)) {
    throw new Error(code);
  }
  return normalized;
};

const coordinationPath = (value: unknown): string => {
  if (typeof value !== "string" || value.length > 4_096) {
    throw new Error("coordination_path_invalid");
  }
  const parsed = new URL(value, "https://coordination.invalid");
  if (
    parsed.origin !== "https://coordination.invalid" ||
    !parsed.pathname.startsWith(API_PREFIX) ||
    (parsed.pathname.length > API_PREFIX.length && parsed.pathname[API_PREFIX.length] !== "/") ||
    parsed.hash
  ) {
    throw new Error("coordination_path_invalid");
  }
  return `${parsed.pathname}${parsed.search}`;
};

const sessionCookie = (header: string | null): string | null => {
  const match = header?.match(/(?:^|[,;]\s*)helix_session=([^;,\s]+)/u);
  return match ? `helix_session=${match[1]}` : null;
};

export const startDesktopFriendsPartiesCoordinationBroker = async (input: {
  remoteOrigin: string;
  token?: string;
  allowInsecureLoopback?: boolean;
  fetch?: typeof fetch;
  now?: () => number;
}): Promise<DesktopFriendsPartiesCoordinationBroker> => {
  const remoteOrigin = exactRemoteOrigin(
    input.remoteOrigin,
    input.allowInsecureLoopback === true,
  );
  const token = input.token ?? crypto.randomBytes(32).toString("base64url");
  if (!TOKEN_PATTERN.test(token)) {
    throw new Error("friends_parties_coordination_broker_token_invalid");
  }
  const requestFetch = input.fetch ?? fetch;
  const now = input.now ?? Date.now;
  let grant: CoordinationGrant | null = null;

  const server = http.createServer(async (request, response) => {
    if (request.socket.remoteAddress !== "127.0.0.1") {
      sendJson(response, 403, { schema: BROKER_SCHEMA, ok: false, error: "loopback_required" });
      return;
    }
    if (request.method !== "POST" || !isAuthorized(request, token)) {
      sendJson(response, 401, { schema: BROKER_SCHEMA, ok: false, error: "broker_unauthorized" });
      return;
    }
    try {
      const body = await readJsonBody(request);
      if (request.url === "/v1/bootstrap") {
        const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
        if (accessToken.length < 16 || accessToken.length > 32_768 || /\s/u.test(accessToken)) {
          throw new Error("coordination_access_token_invalid");
        }
        const localProfileId = cleanIdentity(
          body.localProfileId,
          "coordination_local_profile_invalid",
        );
        const localSessionId = cleanIdentity(
          body.localSessionId,
          "coordination_local_session_invalid",
        );
        const upstream = await requestFetch(
          `${remoteOrigin}/api/account/session/friends-parties-coordination/exchange`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: "{}",
            signal: AbortSignal.timeout(15_000),
          },
        );
        const payload = await upstream.json().catch(() => null) as
          | Record<string, unknown> | null;
        const cookie = sessionCookie(upstream.headers.get("set-cookie"));
        const expiresAtMs = Date.parse(String(payload?.expires_at ?? ""));
        const remoteProfileRef = typeof payload?.profile_ref === "string"
          ? payload.profile_ref
          : "";
        if (
          !upstream.ok || payload?.schema !== SESSION_SCHEMA || payload.ok !== true ||
          !cookie || !Number.isFinite(expiresAtMs) || expiresAtMs <= now() ||
          !/^social_profile:sha256:[a-f0-9]{24}$/u.test(remoteProfileRef)
        ) {
          grant = null;
          sendJson(response, upstream.status >= 400 ? upstream.status : 502, {
            schema: BROKER_SCHEMA,
            ok: false,
            error: typeof payload?.error === "string"
              ? payload.error
              : "coordination_bootstrap_failed",
          });
          return;
        }
        grant = {
          localProfileId,
          localSessionId,
          remoteCookie: cookie,
          remoteProfileRef,
          expiresAtMs,
        };
        sendJson(response, 200, {
          schema: BROKER_SCHEMA,
          ok: true,
          ready: true,
          expires_at: new Date(expiresAtMs).toISOString(),
          profile_ref: remoteProfileRef,
          bearer_included: false,
          session_cookie_included: false,
        });
        return;
      }
      if (request.url === "/v1/status") {
        const localProfileId = cleanIdentity(
          body.localProfileId,
          "coordination_local_profile_invalid",
        );
        const localSessionId = cleanIdentity(
          body.localSessionId,
          "coordination_local_session_invalid",
        );
        const ready = Boolean(
          grant && grant.expiresAtMs > now() &&
          grant.localProfileId === localProfileId &&
          grant.localSessionId === localSessionId,
        );
        sendJson(response, 200, {
          schema: BROKER_SCHEMA,
          ok: true,
          ready,
          expires_at: ready ? new Date(grant!.expiresAtMs).toISOString() : null,
          profile_ref: ready ? grant!.remoteProfileRef : null,
          bearer_included: false,
          session_cookie_included: false,
        });
        return;
      }
      if (request.url === "/v1/proxy") {
        const localProfileId = cleanIdentity(
          body.localProfileId,
          "coordination_local_profile_invalid",
        );
        const localSessionId = cleanIdentity(
          body.localSessionId,
          "coordination_local_session_invalid",
        );
        if (
          !grant || grant.expiresAtMs <= now() ||
          grant.localProfileId !== localProfileId ||
          grant.localSessionId !== localSessionId
        ) {
          grant = null;
          sendJson(response, 401, {
            schema: BROKER_SCHEMA,
            ok: false,
            error: "coordination_session_unavailable",
          });
          return;
        }
        const method = typeof body.method === "string" ? body.method.toUpperCase() : "";
        if (!ALLOWED_METHODS.has(method)) throw new Error("coordination_method_invalid");
        const path = coordinationPath(body.path);
        const upstream = await requestFetch(`${remoteOrigin}${path}`, {
          method,
          headers: {
            Accept: "application/json",
            Cookie: grant.remoteCookie,
            ...(body.body === null || body.body === undefined
              ? {}
              : { "Content-Type": "application/json" }),
          },
          body: body.body === null || body.body === undefined
            ? undefined
            : JSON.stringify(body.body),
          signal: AbortSignal.timeout(20_000),
        });
        const text = await upstream.text();
        let upstreamBody: unknown = null;
        try {
          upstreamBody = text ? JSON.parse(text) : null;
        } catch {
          upstreamBody = null;
        }
        if (upstream.status === 401) grant = null;
        sendJson(response, 200, {
          schema: BROKER_SCHEMA,
          ok: true,
          upstream_status: upstream.status,
          upstream_headers: {
            cache_control: upstream.headers.get("cache-control"),
            pragma: upstream.headers.get("pragma"),
            referrer_policy: upstream.headers.get("referrer-policy"),
          },
          upstream_body: upstreamBody,
        });
        return;
      }
      sendJson(response, 404, { schema: BROKER_SCHEMA, ok: false, error: "broker_route_unknown" });
    } catch (error) {
      const reason = error instanceof Error && /^[a-z][a-z0-9_]{0,63}$/u.test(error.message)
        ? error.message
        : "coordination_broker_failed";
      sendJson(response, 400, { schema: BROKER_SCHEMA, ok: false, error: reason });
    }
  });
  server.on("clientError", (_error, socket) => socket.destroy());
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address() as AddressInfo;
  let closed = false;
  return Object.freeze({
    origin: `http://127.0.0.1:${address.port}`,
    token,
    remoteOrigin,
    close: async () => {
      if (closed) return;
      closed = true;
      grant = null;
      await new Promise<void>((resolve, reject) =>
        server.close((error) => error ? reject(error) : resolve()),
      );
    },
  });
};
