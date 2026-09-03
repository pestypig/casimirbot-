import crypto from "node:crypto";
import http from "node:http";
import type { AddressInfo } from "node:net";
import type { DesktopProviderCredentialKeyring } from
  "./provider-credential-key";
import { buildHelixRealtimeProviderSession } from
  "../../../shared/helix-realtime-session";

const ALGORITHM = "aes-256-gcm" as const;
const MAX_REQUEST_BYTES = 256 * 1_024;
const BROKER_SCHEMA = "casimir_desktop_provider_credential_broker/1" as const;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/u;
const OPENAI_REALTIME_CLIENT_SECRETS_URL =
  "https://api.openai.com/v1/realtime/client_secrets" as const;
const OPENAI_REALTIME_CALLS_URL =
  "https://api.openai.com/v1/realtime/calls" as const;
const OPENAI_REALTIME_TIMEOUT_MS = 10_000;

export type DesktopProviderCredentialBroker = Readonly<{
  origin: string;
  token: string;
  activeKeyId: string;
  openAiRealtimeAvailable: boolean;
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
  openAiApiKey?: string;
  fetchImpl?: typeof fetch;
}): Promise<DesktopProviderCredentialBroker> => {
  const activeKey = keyBytes(input.keyring.activeKey);
  for (const retired of input.keyring.retiredKeys) keyBytes(retired);
  const token = input.token ?? crypto.randomBytes(32).toString("base64url");
  if (!TOKEN_PATTERN.test(token)) {
    throw new Error("desktop_provider_credential_broker_token_invalid");
  }
  const activeKeyId = nativeKeyId(activeKey);
  const openAiApiKey = input.openAiApiKey?.trim() ?? "";
  const fetchImpl = input.fetchImpl ?? globalThis.fetch;
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
      if (request.url === "/v1/encrypt") {
        const aad = typeof body.aad === "string" ? body.aad.trim() : "";
        if (!aad) throw new Error("provider_credential_aad_required");
        const envelope = encryptWithKey(body.value, aad, activeKey);
        sendJson(response, 200, {
          schema: BROKER_SCHEMA,
          ok: true,
          envelope,
        });
        return;
      }
      if (request.url === "/v1/decrypt") {
        const aad = typeof body.aad === "string" ? body.aad.trim() : "";
        if (!aad) throw new Error("provider_credential_aad_required");
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
      if (request.url === "/v1/openai/realtime/client-secret") {
        if (!openAiApiKey || typeof fetchImpl !== "function") {
          sendJson(response, 409, {
            schema: BROKER_SCHEMA,
            ok: false,
            error: "openai_realtime_provider_unavailable",
          });
          return;
        }
        const model = typeof body.model === "string" ? body.model.trim() : "";
        const voice = typeof body.voice === "string" ? body.voice.trim() : "";
        const safetyIdentifier = typeof body.safetyIdentifier === "string"
          ? body.safetyIdentifier.trim()
          : "";
        if (!/^gpt-realtime(?:-[A-Za-z0-9._-]+)?$/u.test(model)) {
          throw new Error("openai_realtime_model_invalid");
        }
        if (voice && !/^[A-Za-z0-9._-]{1,64}$/u.test(voice)) {
          throw new Error("openai_realtime_voice_invalid");
        }
        if (
          safetyIdentifier &&
          !/^[A-Za-z0-9._:-]{8,128}$/u.test(safetyIdentifier)
        ) {
          throw new Error("openai_realtime_safety_identifier_invalid");
        }
        const session: Record<string, unknown> = { type: "realtime", model };
        if (voice) session.audio = { output: { voice } };
        const headers: Record<string, string> = {
          Authorization: `Bearer ${openAiApiKey}`,
          "Content-Type": "application/json",
        };
        if (safetyIdentifier) {
          headers["OpenAI-Safety-Identifier"] = safetyIdentifier;
        }
        let providerResponse: Response;
        try {
          providerResponse = await fetchImpl(OPENAI_REALTIME_CLIENT_SECRETS_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({ session }),
            signal: AbortSignal.timeout(OPENAI_REALTIME_TIMEOUT_MS),
          });
        } catch {
          sendJson(response, 502, {
            schema: BROKER_SCHEMA,
            ok: false,
            error: "openai_realtime_provider_network_error",
          });
          return;
        }
        if (!providerResponse.ok) {
          sendJson(response, 502, {
            schema: BROKER_SCHEMA,
            ok: false,
            error: `openai_realtime_provider_http_${providerResponse.status}`,
          });
          return;
        }
        const providerPayload = await providerResponse.json().catch(() => null) as
          | Record<string, unknown>
          | null;
        const clientSecretRecord = providerPayload?.client_secret &&
          typeof providerPayload.client_secret === "object"
          ? providerPayload.client_secret as Record<string, unknown>
          : {};
        const ephemeralClientSecret = [
          providerPayload?.value,
          providerPayload?.secret,
          clientSecretRecord.value,
          clientSecretRecord.secret,
        ].find((value): value is string =>
          typeof value === "string" && Boolean(value.trim())
        )?.trim() ?? "";
        if (!ephemeralClientSecret) {
          sendJson(response, 502, {
            schema: BROKER_SCHEMA,
            ok: false,
            error: "openai_realtime_client_secret_missing",
          });
          return;
        }
        const providerSessionRef = [
          providerPayload?.id,
          providerPayload?.session_id,
          providerPayload?.provider_session_ref,
        ].find((value): value is string =>
          typeof value === "string" && Boolean(value.trim())
        )?.trim() ?? null;
        const expiresAtMsValue = providerPayload?.expires_at_ms ??
          clientSecretRecord.expires_at_ms;
        const expiresAtSecondsValue = providerPayload?.expires_at ??
          clientSecretRecord.expires_at;
        const expiresAtMs = typeof expiresAtMsValue === "number" &&
          Number.isFinite(expiresAtMsValue)
          ? Math.trunc(expiresAtMsValue)
          : typeof expiresAtSecondsValue === "number" &&
              Number.isFinite(expiresAtSecondsValue)
            ? Math.trunc(expiresAtSecondsValue * 1_000)
            : null;
        sendJson(response, 200, {
          schema: BROKER_SCHEMA,
          ok: true,
          providerSessionRef,
          ephemeralClientSecret,
          ephemeralClientSecretExpiresAtMs: expiresAtMs,
        });
        return;
      }
      if (request.url === "/v1/openai/realtime/sdp") {
        if (!openAiApiKey || typeof fetchImpl !== "function") {
          sendJson(response, 409, {
            schema: BROKER_SCHEMA,
            ok: false,
            error: "openai_realtime_provider_unavailable",
          });
          return;
        }
        const offerSdp = typeof body.offerSdp === "string" ? body.offerSdp : "";
        const model = typeof body.model === "string" ? body.model.trim() : "";
        const voice = typeof body.voice === "string" ? body.voice.trim() : "";
        const safetyIdentifier = typeof body.safetyIdentifier === "string"
          ? body.safetyIdentifier.trim()
          : "";
        if (!/^v=0(?:\r?\n)/u.test(offerSdp) || offerSdp.length > 256_000) {
          throw new Error("realtime_sdp_offer_invalid");
        }
        if (!/^gpt-realtime(?:-[A-Za-z0-9._-]+)?$/u.test(model)) {
          throw new Error("openai_realtime_model_invalid");
        }
        if (!/^[A-Za-z0-9._-]{1,64}$/u.test(voice)) {
          throw new Error("openai_realtime_voice_invalid");
        }
        if (
          safetyIdentifier &&
          !/^[A-Za-z0-9._:-]{8,128}$/u.test(safetyIdentifier)
        ) {
          throw new Error("openai_realtime_safety_identifier_invalid");
        }
        const form = new FormData();
        form.set("sdp", offerSdp);
        form.set(
          "session",
          JSON.stringify(buildHelixRealtimeProviderSession(model, voice)),
        );
        const headers: Record<string, string> = {
          Authorization: `Bearer ${openAiApiKey}`,
        };
        if (safetyIdentifier) {
          headers["OpenAI-Safety-Identifier"] = safetyIdentifier;
        }
        let providerResponse: Response;
        try {
          providerResponse = await fetchImpl(OPENAI_REALTIME_CALLS_URL, {
            method: "POST",
            headers,
            body: form,
            signal: AbortSignal.timeout(15_000),
          });
        } catch {
          sendJson(response, 502, {
            schema: BROKER_SCHEMA,
            ok: false,
            error: "openai_realtime_provider_network_error",
          });
          return;
        }
        const answerSdp = await providerResponse.text().catch(() => "");
        if (!providerResponse.ok) {
          sendJson(response, 502, {
            schema: BROKER_SCHEMA,
            ok: false,
            error: `openai_realtime_provider_http_${providerResponse.status}`,
          });
          return;
        }
        if (!/^v=0(?:\r?\n)/u.test(answerSdp) || answerSdp.length > 256_000) {
          sendJson(response, 502, {
            schema: BROKER_SCHEMA,
            ok: false,
            error: "openai_realtime_answer_sdp_invalid",
          });
          return;
        }
        const location = providerResponse.headers.get("location");
        const providerCallId = location?.match(
          /(?:^|\/)(rtc_[A-Za-z0-9_-]{6,160})(?:[/?#]|$)/u,
        )?.[1] ?? null;
        sendJson(response, 200, {
          schema: BROKER_SCHEMA,
          ok: true,
          answerSdp,
          providerCallId,
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
    openAiRealtimeAvailable: Boolean(openAiApiKey),
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
