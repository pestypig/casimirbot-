import crypto from "node:crypto";
import type {
  HelixProfileIngressEventReceipt,
  HelixProfileIngressScope,
  HelixProfileIngressTokenReceipt,
  HelixProfileIngressTokenSummary,
  HelixProfileIngressUsageSummary,
} from "@shared/helix-profile-ingress";
import {
  HELIX_PROFILE_INGRESS_EVENT_RECEIPT_SCHEMA,
  HELIX_PROFILE_INGRESS_TOKEN_RECEIPT_SCHEMA,
  HELIX_PROFILE_INGRESS_TOKEN_SCHEMA,
} from "@shared/helix-profile-ingress";
import { appendHelixThreadEvent } from "../helix-thread/ledger";

type StoredProfileIngressToken = HelixProfileIngressTokenSummary & {
  token_hash: string;
};

type ProfileIngressUsageEvent = {
  profile_id: string;
  token_id?: string | null;
  accepted: boolean;
  estimated_token_count: number;
  ts: string;
};

const tokensById = new Map<string, StoredProfileIngressToken>();
const tokenIdByHash = new Map<string, string>();
const usageEvents: ProfileIngressUsageEvent[] = [];

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const nowIso = (): string => new Date().toISOString();

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");

const estimateTokens = (value: unknown): number =>
  Math.max(1, Math.ceil(JSON.stringify(value ?? {}).length / 4));

const publicBaseUrl = (): string =>
  normalize(process.env.PUBLIC_BASE_URL) || "https://casimirbot.com";

const isIngressScope = (value: unknown): value is HelixProfileIngressScope =>
  value === "source_event" ||
  value === "discord_link" ||
  value === "minecraft_bridge" ||
  value === "live_environment_event";

function sanitizeProfileId(profileId: string): string {
  return profileId.replace(/[^a-zA-Z0-9:_-]/g, "-").slice(0, 96) || "profile";
}

function toSummary(token: StoredProfileIngressToken): HelixProfileIngressTokenSummary {
  const { token_hash: _tokenHash, ...summary } = token;
  return summary;
}

export function createProfileIngressToken(input: {
  profile_id: string;
  label?: string | null;
  scopes?: HelixProfileIngressScope[] | null;
  ttl_ms?: number | null;
}): HelixProfileIngressTokenReceipt {
  const profileId = sanitizeProfileId(normalize(input.profile_id));
  if (!profileId) {
    return {
      schema: HELIX_PROFILE_INGRESS_TOKEN_RECEIPT_SCHEMA,
      ok: false,
      token: null,
      token_value: null,
      message: "Profile ingress token requires a profile ID.",
      error: "missing_profile_id",
      token_value_shown_once: false,
      secret_stored_raw: false,
    };
  }
  const now = nowIso();
  const tokenId = `profile_ingress:${crypto.randomUUID()}`;
  const secret = `prof_live_${crypto.randomBytes(32).toString("base64url")}`;
  const scopes: HelixProfileIngressScope[] = input.scopes?.length
    ? input.scopes.filter(isIngressScope)
    : ["source_event"];
  const expiresAt =
    input.ttl_ms && input.ttl_ms > 0
      ? new Date(Date.parse(now) + Math.min(input.ttl_ms, 90 * 24 * 60 * 60 * 1000)).toISOString()
      : null;
  const summary: StoredProfileIngressToken = {
    schema: HELIX_PROFILE_INGRESS_TOKEN_SCHEMA,
    token_id: tokenId,
    profile_id: profileId,
    label: normalize(input.label) || "Profile ingress",
    scopes: Array.from(new Set(scopes.length ? scopes : ["source_event"])),
    status: "active",
    public_ingress_url: `${publicBaseUrl().replace(/\/$/, "")}/api/profile-ingress/${encodeURIComponent(profileId)}/events`,
    token_prefix: secret.slice(0, 16),
    created_at: now,
    expires_at: expiresAt,
    revoked_at: null,
    last_used_at: null,
    request_count: 0,
    secret_stored_raw: false,
    token_hash: sha256(secret),
  };
  tokensById.set(tokenId, summary);
  tokenIdByHash.set(summary.token_hash, tokenId);
  return {
    schema: HELIX_PROFILE_INGRESS_TOKEN_RECEIPT_SCHEMA,
    ok: true,
    token: toSummary(summary),
    token_value: secret,
    message: "Profile ingress token created. Store the token now; only its hash is retained.",
    error: null,
    token_value_shown_once: true,
    secret_stored_raw: false,
  };
}

export function revokeProfileIngressToken(tokenId: string): HelixProfileIngressTokenReceipt {
  const existing = tokensById.get(normalize(tokenId));
  if (!existing) {
    return {
      schema: HELIX_PROFILE_INGRESS_TOKEN_RECEIPT_SCHEMA,
      ok: false,
      token: null,
      token_value: null,
      message: "Profile ingress token not found.",
      error: "missing_token",
      token_value_shown_once: false,
      secret_stored_raw: false,
    };
  }
  const revoked: StoredProfileIngressToken = {
    ...existing,
    status: "revoked",
    revoked_at: nowIso(),
  };
  tokensById.set(existing.token_id, revoked);
  return {
    schema: HELIX_PROFILE_INGRESS_TOKEN_RECEIPT_SCHEMA,
    ok: true,
    token: toSummary(revoked),
    token_value: null,
    message: "Profile ingress token revoked.",
    error: null,
    token_value_shown_once: false,
    secret_stored_raw: false,
  };
}

export function listProfileIngressTokens(profileId?: string | null): HelixProfileIngressTokenSummary[] {
  const normalizedProfileId = normalize(profileId);
  return Array.from(tokensById.values())
    .filter((token) => !normalizedProfileId || token.profile_id === normalizedProfileId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(toSummary);
}

function recordUsage(event: ProfileIngressUsageEvent): void {
  usageEvents.push(event);
  if (usageEvents.length > 5000) {
    usageEvents.splice(0, usageEvents.length - 5000);
  }
}

export function getProfileIngressUsage(profileId?: string | null): HelixProfileIngressUsageSummary {
  const normalizedProfileId = normalize(profileId);
  const events = usageEvents.filter((event) => !normalizedProfileId || event.profile_id === normalizedProfileId);
  return {
    request_count: events.length,
    accepted_count: events.filter((event) => event.accepted).length,
    rejected_count: events.filter((event) => !event.accepted).length,
    estimated_token_count: events.reduce((sum, event) => sum + event.estimated_token_count, 0),
    last_event_at: events.at(-1)?.ts ?? null,
  };
}

function resolveBearerToken(authorizationHeader?: string | null): string {
  const header = normalize(authorizationHeader);
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() ?? "";
}

export function ingestProfileIngressEvent(input: {
  profile_id: string;
  authorization?: string | null;
  payload?: Record<string, unknown> | null;
  source_id?: string | null;
  thread_id?: string | null;
}): HelixProfileIngressEventReceipt {
  const profileId = sanitizeProfileId(normalize(input.profile_id));
  const now = nowIso();
  const estimated = estimateTokens(input.payload);
  const secret = resolveBearerToken(input.authorization);
  const tokenId = secret ? tokenIdByHash.get(sha256(secret)) : null;
  const token = tokenId ? tokensById.get(tokenId) : null;
  const reject = (error: string, message: string): HelixProfileIngressEventReceipt => {
    recordUsage({
      profile_id: profileId || "unknown",
      token_id: token?.token_id ?? null,
      accepted: false,
      estimated_token_count: estimated,
      ts: now,
    });
    return {
      schema: HELIX_PROFILE_INGRESS_EVENT_RECEIPT_SCHEMA,
      ok: false,
      profile_id: profileId,
      token_id: token?.token_id ?? null,
      event_id: null,
      accepted: false,
      message,
      error,
      estimated_token_count: estimated,
      raw_secret_included: false,
      context_policy: "compact_context_pack_only",
    };
  };
  if (!profileId || !token) return reject("invalid_token", "Missing or invalid profile ingress token.");
  if (token.profile_id !== profileId) return reject("profile_mismatch", "Token is not scoped to this profile.");
  if (token.status !== "active") return reject("token_revoked", "Profile ingress token is not active.");
  if (token.expires_at && Date.parse(token.expires_at) <= Date.now()) {
    return reject("token_expired", "Profile ingress token expired.");
  }
  if (!token.scopes.includes("source_event") && !token.scopes.includes("live_environment_event")) {
    return reject("scope_denied", "Profile ingress token does not allow source events.");
  }
  const nextToken: StoredProfileIngressToken = {
    ...token,
    last_used_at: now,
    request_count: token.request_count + 1,
  };
  tokensById.set(token.token_id, nextToken);
  const eventId = `profile_ingress_event:${crypto.randomUUID()}`;
  recordUsage({
    profile_id: profileId,
    token_id: token.token_id,
    accepted: true,
    estimated_token_count: estimated,
    ts: now,
  });
  appendHelixThreadEvent({
    route: "/ask",
    thread_id: normalize(input.thread_id) || `helix-ask:profile:${profileId}`,
    turn_id: `profile_ingress_turn:${crypto.randomUUID()}`,
    event_type: "item_completed",
    item_id: eventId,
    item_type: "toolObservation",
    item_stream: "observation",
    item_status: "completed",
    observation_ref: {
      schema: "helix.profile_ingress_observation.v1",
      event_id: eventId,
      profile_id: profileId,
      token_id: token.token_id,
      source_id: normalize(input.source_id) || "profile_ingress",
      payload: input.payload ?? {},
      estimated_token_count: estimated,
      raw_secret_included: false,
      context_policy: "compact_context_pack_only",
    },
    meta: {
      kind: "profile_ingress_observation",
      primary_user_visible: false,
      model_invoked: false,
      context_policy: "compact_context_pack_only",
      raw_secret_included: false,
    },
    ts: now,
  });
  return {
    schema: HELIX_PROFILE_INGRESS_EVENT_RECEIPT_SCHEMA,
    ok: true,
    profile_id: profileId,
    token_id: token.token_id,
    event_id: eventId,
    accepted: true,
    message: "Profile ingress event accepted as a tool observation.",
    error: null,
    estimated_token_count: estimated,
    raw_secret_included: false,
    context_policy: "compact_context_pack_only",
  };
}

export function resetProfileIngressStore(): void {
  tokensById.clear();
  tokenIdByHash.clear();
  usageEvents.splice(0, usageEvents.length);
}
