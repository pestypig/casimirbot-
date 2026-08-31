import crypto from "node:crypto";
import http from "node:http";
import type { AddressInfo } from "node:net";
import type { DesktopMcpTunnelScope } from
  "../../../shared/desktop-mcp-tunnel";

const BROKER_SCHEMA = "casimir_desktop_mcp_tunnel_transition_broker/1" as const;
const REQUEST_SCHEMA = "casimir_desktop_mcp_tunnel_transition_request/1" as const;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;
const REF_PATTERN = /^[A-Za-z0-9:._-]{8,180}$/u;
const ACCOUNT_SESSION_PATTERN = /^account_session:[A-Za-z0-9-]{8,128}$/u;
const MAX_REQUEST_BYTES = 16 * 1_024;

export type DesktopMcpTunnelTransitionBrokerRequest = Readonly<{
  schema: typeof REQUEST_SCHEMA;
  transitionRequestRef: string;
  delegationRef: string;
  accountSessionId: string;
  targetScope: DesktopMcpTunnelScope;
  delegationExpiresAt: string;
}>;

export type DesktopMcpTunnelTransitionBroker = Readonly<{
  origin: string;
  token: string;
  close: () => Promise<void>;
}>;

export class DesktopMcpTunnelTransitionBrokerAdmission {
  private readonly entries = new Map<string, {
    fingerprint: string;
    result: Promise<{ nativeReceiptRef: string }>;
  }>();

  constructor(private readonly maxEntries = 256) {
    if (!Number.isInteger(maxEntries) || maxEntries < 8 || maxEntries > 2_048) {
      throw new Error("native_transition_admission_capacity_invalid");
    }
  }

  async admit(input: {
    request: DesktopMcpTunnelTransitionBrokerRequest;
    execute: (
      request: DesktopMcpTunnelTransitionBrokerRequest,
    ) => Promise<{ nativeReceiptRef: string }>;
  }): Promise<{ nativeReceiptRef: string; idempotencyReplayed: boolean }> {
    const fingerprint = crypto.createHash("sha256")
      .update(JSON.stringify(input.request), "utf8")
      .digest("hex");
    const existing = this.entries.get(input.request.transitionRequestRef);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new Error("native_transition_replay_conflict");
      }
      return {
        ...(await existing.result),
        idempotencyReplayed: true,
      };
    }
    if (this.entries.size >= this.maxEntries) {
      throw new Error("native_transition_admission_capacity_reached");
    }
    const result = input.execute(input.request);
    this.entries.set(input.request.transitionRequestRef, {
      fingerprint,
      result,
    });
    try {
      return {
        ...(await result),
        idempotencyReplayed: false,
      };
    } catch (error) {
      this.entries.delete(input.request.transitionRequestRef);
      throw error;
    }
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const parseDesktopMcpTunnelTransitionBrokerRequest = (
  value: unknown,
  nowMs = Date.now(),
): DesktopMcpTunnelTransitionBrokerRequest | null => {
  if (!isRecord(value)) return null;
  const keys = [
    "schema",
    "transitionRequestRef",
    "delegationRef",
    "accountSessionId",
    "targetScope",
    "delegationExpiresAt",
  ];
  if (
    Object.keys(value).length !== keys.length ||
    keys.some((key) => !(key in value)) ||
    value.schema !== REQUEST_SCHEMA ||
    typeof value.transitionRequestRef !== "string" ||
    !REF_PATTERN.test(value.transitionRequestRef) ||
    typeof value.delegationRef !== "string" ||
    !REF_PATTERN.test(value.delegationRef) ||
    typeof value.accountSessionId !== "string" ||
    !ACCOUNT_SESSION_PATTERN.test(value.accountSessionId) ||
    (value.targetScope !== "full_helix_agent" &&
      value.targetScope !== "local_supervisor_coordination_and_device_check") ||
    typeof value.delegationExpiresAt !== "string"
  ) return null;
  const expiresAtMs = Date.parse(value.delegationExpiresAt);
  if (
    !Number.isFinite(expiresAtMs) ||
    expiresAtMs > nowMs + 5 * 60_000 ||
    (value.targetScope === "full_helix_agent" && expiresAtMs <= nowMs)
  ) return null;
  return Object.freeze(value as DesktopMcpTunnelTransitionBrokerRequest);
};

const readBody = async (request: http.IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_REQUEST_BYTES) throw new Error("transition_payload_too_large");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
};

const authorized = (request: http.IncomingMessage, token: string): boolean => {
  const supplied = request.headers.authorization?.replace(/^Bearer /u, "") ?? "";
  if (!TOKEN_PATTERN.test(supplied) || supplied.length !== token.length) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(token));
};

const send = (response: http.ServerResponse, status: number, body: unknown): void => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
};

export const startDesktopMcpTunnelTransitionBroker = async (input: {
  onTransition: (
    request: DesktopMcpTunnelTransitionBrokerRequest,
  ) => Promise<{ nativeReceiptRef: string }>;
  token?: string;
}): Promise<DesktopMcpTunnelTransitionBroker> => {
  const token = input.token ?? crypto.randomBytes(32).toString("base64url");
  if (!TOKEN_PATTERN.test(token) || Buffer.from(token, "base64url").length !== 32) {
    throw new Error("desktop_mcp_transition_broker_token_invalid");
  }
  const admission = new DesktopMcpTunnelTransitionBrokerAdmission();
  const server = http.createServer(async (request, response) => {
    if (request.socket.remoteAddress !== "127.0.0.1") {
      send(response, 403, { ok: false, error: "loopback_required" });
      return;
    }
    if (
      request.method !== "POST" ||
      request.url !== "/v1/transition" ||
      !authorized(request, token)
    ) {
      send(response, 401, { ok: false, error: "broker_unauthorized" });
      return;
    }
    try {
      const parsed = parseDesktopMcpTunnelTransitionBrokerRequest(
        await readBody(request),
      );
      if (!parsed) throw new Error("transition_request_invalid");
      const accepted = await admission.admit({
        request: parsed,
        execute: input.onTransition,
      });
      if (!REF_PATTERN.test(accepted.nativeReceiptRef)) {
        throw new Error("native_transition_receipt_invalid");
      }
      send(response, 202, {
        schema: BROKER_SCHEMA,
        ok: true,
        accepted: true,
        nativeReceiptRef: accepted.nativeReceiptRef,
        idempotency_replayed: accepted.idempotencyReplayed,
        native_transition_resubmitted: !accepted.idempotencyReplayed,
        response_drained_before_transition: true,
        credential_included: false,
        private_endpoint_included: false,
      });
    } catch (error) {
      const code = error instanceof Error
        ? error.message.trim().slice(0, 100)
        : "transition_rejected";
      send(response, 400, { ok: false, error: code || "transition_rejected" });
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
    close: async () => {
      if (closed) return;
      closed = true;
      await new Promise<void>((resolve, reject) =>
        server.close((error) => error ? reject(error) : resolve()),
      );
    },
  });
};
