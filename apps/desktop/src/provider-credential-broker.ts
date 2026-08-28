import crypto from "node:crypto";
import http from "node:http";
import type { AddressInfo } from "node:net";
import type { DesktopProviderCredentialKeyring } from
  "./provider-credential-key";

const ALGORITHM = "aes-256-gcm" as const;
const MAX_REQUEST_BYTES = 256 * 1_024;
const BROKER_SCHEMA = "casimir_desktop_provider_credential_broker/1" as const;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

export type DesktopProviderCredentialBroker = Readonly<{
  origin: string;
  token: string;
  activeKeyId: string;
  close: () => Promise<void>;
}>;

type ProviderCredentialEnvelope = Readonly<{
  encryptedValue: string;
  keyId: string;
  algorithm: typeof ALGORITHM;
}>;

const keyBytes = (key: string): Buffer => {
  const decoded = Buffer.from(key, "base64url");
  if (decoded.length !== 32) {
    throw new Error("desktop_provider_credential_broker_key_invalid");
  }
  return decoded;
};

const keyHash = (key: Buffer): string => crypto
  .createHash("sha256")
  .update(key)
  .digest("base64url")
  .slice(0, 12);

const nativeKeyId = (key: Buffer): string => `native:${keyHash(key)}`;
const legacyEnvironmentKeyId = (key: Buffer): string => `env:${keyHash(key)}`;

const encryptWithKey = (
  value: unknown,
  aad: string,
  key: Buffer,
): ProviderCredentialEnvelope => {
  const dataKey = crypto.randomBytes(32);
  const wrapIv = crypto.randomBytes(12);
  const wrapCipher = crypto.createCipheriv(ALGORITHM, key, wrapIv);
  wrapCipher.setAAD(Buffer.from(`${aad}\nprovider-credential-data-key`, "utf8"));
  const wrappedKey = Buffer.concat([
    wrapCipher.update(dataKey),
    wrapCipher.final(),
  ]);
  const payloadIv = crypto.randomBytes(12);
  const payloadCipher = crypto.createCipheriv(ALGORITHM, dataKey, payloadIv);
  payloadCipher.setAAD(Buffer.from(aad, "utf8"));
  const encryptedPayload = Buffer.concat([
    payloadCipher.update(Buffer.from(JSON.stringify(value), "utf8")),
    payloadCipher.final(),
  ]);
  dataKey.fill(0);
  return {
    encryptedValue: [
      "v2",
      wrapIv.toString("base64url"),
      wrapCipher.getAuthTag().toString("base64url"),
      wrappedKey.toString("base64url"),
      payloadIv.toString("base64url"),
      payloadCipher.getAuthTag().toString("base64url"),
      encryptedPayload.toString("base64url"),
    ].join(":"),
    keyId: nativeKeyId(key),
    algorithm: ALGORITHM,
  };
};

const decryptV1 = (
  parts: string[],
  aad: string,
  key: Buffer,
): unknown => {
  if (parts.length !== 4) {
    throw new Error("provider_credential_envelope_invalid");
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(parts[1], "base64url"),
  );
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(parts[3], "base64url")),
    decipher.final(),
  ]).toString("utf8");
  return JSON.parse(plaintext) as unknown;
};

const decryptV2 = (
  parts: string[],
  aad: string,
  key: Buffer,
): unknown => {
  if (parts.length !== 7) {
    throw new Error("provider_credential_envelope_invalid");
  }
  const wrapDecipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(parts[1], "base64url"),
  );
  wrapDecipher.setAAD(
    Buffer.from(`${aad}\nprovider-credential-data-key`, "utf8"),
  );
  wrapDecipher.setAuthTag(Buffer.from(parts[2], "base64url"));
  const dataKey = Buffer.concat([
    wrapDecipher.update(Buffer.from(parts[3], "base64url")),
    wrapDecipher.final(),
  ]);
  try {
    const payloadDecipher = crypto.createDecipheriv(
      ALGORITHM,
      dataKey,
      Buffer.from(parts[4], "base64url"),
    );
    payloadDecipher.setAAD(Buffer.from(aad, "utf8"));
    payloadDecipher.setAuthTag(Buffer.from(parts[5], "base64url"));
    const plaintext = Buffer.concat([
      payloadDecipher.update(Buffer.from(parts[6], "base64url")),
      payloadDecipher.final(),
    ]).toString("utf8");
    return JSON.parse(plaintext) as unknown;
  } finally {
    dataKey.fill(0);
  }
};

const decryptWithKeyring = (input: {
  encryptedValue: string;
  aad: string;
  storedKeyId: string;
  keyring: DesktopProviderCredentialKeyring;
}): unknown => {
  const parts = input.encryptedValue.split(":");
  const candidates = [
    input.keyring.activeKey,
    ...input.keyring.retiredKeys,
  ].map(keyBytes);
  try {
    const selected = candidates.find((candidate) => {
      const admittedIds = [
        nativeKeyId(candidate),
        legacyEnvironmentKeyId(candidate),
      ];
      return admittedIds.includes(input.storedKeyId);
    });
    if (!selected) throw new Error("provider_credential_key_id_mismatch");
    if (parts[0] === "v1") return decryptV1(parts, input.aad, selected);
    if (parts[0] === "v2") return decryptV2(parts, input.aad, selected);
    throw new Error("provider_credential_envelope_invalid");
  } finally {
    for (const candidate of candidates) candidate.fill(0);
  }
};

const readJsonBody = async (request: http.IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  let bytes = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_REQUEST_BYTES) {
      throw new Error("provider_credential_broker_payload_too_large");
    }
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
};

const isAuthorized = (
  request: http.IncomingMessage,
  token: string,
): boolean => {
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
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
};

export const startDesktopProviderCredentialBroker = async (input: {
  keyring: DesktopProviderCredentialKeyring;
  token?: string;
}): Promise<DesktopProviderCredentialBroker> => {
  const activeKey = keyBytes(input.keyring.activeKey);
  for (const retired of input.keyring.retiredKeys) keyBytes(retired);
  const token = input.token ?? crypto.randomBytes(32).toString("base64url");
  if (!TOKEN_PATTERN.test(token)) {
    throw new Error("desktop_provider_credential_broker_token_invalid");
  }
  const activeKeyId = nativeKeyId(activeKey);
  const server = http.createServer(async (request, response) => {
    if (request.socket.remoteAddress !== "127.0.0.1") {
      sendJson(response, 403, { ok: false, error: "loopback_required" });
      return;
    }
    if (request.method !== "POST" || !isAuthorized(request, token)) {
      sendJson(response, 401, { ok: false, error: "broker_unauthorized" });
      return;
    }
    try {
      const body = await readJsonBody(request) as Record<string, unknown>;
      if (request.url === "/v1/key-id") {
        sendJson(response, 200, {
          schema: BROKER_SCHEMA,
          ok: true,
          keyId: activeKeyId,
        });
        return;
      }
      const aad = typeof body.aad === "string" ? body.aad.trim() : "";
      if (!aad) throw new Error("provider_credential_aad_required");
      if (request.url === "/v1/encrypt") {
        const envelope = encryptWithKey(body.value, aad, activeKey);
        sendJson(response, 200, {
          schema: BROKER_SCHEMA,
          ok: true,
          envelope,
        });
        return;
      }
      if (request.url === "/v1/decrypt") {
        const encryptedValue = typeof body.encryptedValue === "string"
          ? body.encryptedValue
          : "";
        const storedKeyId = typeof body.storedKeyId === "string"
          ? body.storedKeyId
          : "";
        if (!encryptedValue || !storedKeyId) {
          throw new Error("provider_credential_envelope_invalid");
        }
        const value = decryptWithKeyring({
          encryptedValue,
          aad,
          storedKeyId,
          keyring: input.keyring,
        });
        sendJson(response, 200, {
          schema: BROKER_SCHEMA,
          ok: true,
          value,
        });
        return;
      }
      sendJson(response, 404, { ok: false, error: "broker_route_unknown" });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "broker_failed";
      sendJson(response, 400, { ok: false, error: reason });
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
    activeKeyId,
    close: async () => {
      if (closed) return;
      closed = true;
      try {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => error ? reject(error) : resolve()),
        );
      } finally {
        activeKey.fill(0);
      }
    },
  });
};
