import crypto from "node:crypto";
import {
  HELIX_VOICE_PARTY_ICE_CONFIGURATION_SCHEMA,
  type HelixVoicePartyIceConfiguration,
} from "@shared/helix-friends-voice-party";
import {
  HelixVoicePartyDomainError,
  readHelixVoiceParty,
} from "./voice-party-store";

const DEFAULT_STUN_URLS = ["stun:stun.l.google.com:19302"];
const MAX_URLS = 8;
const MIN_TTL_SECONDS = 60;
const MAX_TTL_SECONDS = 3_600;
const DEFAULT_TTL_SECONDS = 600;
const URL_PATTERN = /^(?:stun|stuns|turn|turns):[^\s]{1,1000}$/i;

type VoicePartyIceEnvironment = {
  stunUrlsJson?: string;
  turnUrlsJson?: string;
  turnSharedSecret?: string;
  turnTtlSeconds?: string;
};

const readUrlList = (
  raw: string | undefined,
  allowedSchemes: ReadonlySet<string>,
  fallback: string[],
): string[] => {
  if (!raw?.trim()) return [...fallback];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HelixVoicePartyDomainError(
      "voice_party_ice_configuration_invalid",
      409,
      "Voice party ICE URL configuration is invalid.",
    );
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_URLS) {
    throw new HelixVoicePartyDomainError(
      "voice_party_ice_configuration_invalid",
      409,
      "Voice party ICE URL configuration is invalid.",
    );
  }
  const urls = parsed.map((value) => typeof value === "string" ? value.trim() : "");
  if (urls.some((url) => {
    const scheme = url.slice(0, url.indexOf(":"));
    return !URL_PATTERN.test(url) || !allowedSchemes.has(scheme.toLowerCase());
  })) {
    throw new HelixVoicePartyDomainError(
      "voice_party_ice_configuration_invalid",
      409,
      "Voice party ICE URL configuration is invalid.",
    );
  }
  return urls;
};

const readTtlSeconds = (raw: string | undefined): number => {
  if (!raw?.trim()) return DEFAULT_TTL_SECONDS;
  const ttl = Number(raw);
  if (!Number.isInteger(ttl) || ttl < MIN_TTL_SECONDS || ttl > MAX_TTL_SECONDS) {
    throw new HelixVoicePartyDomainError(
      "voice_party_ice_configuration_invalid",
      409,
      "Voice party TURN credential lifetime is invalid.",
    );
  }
  return ttl;
};

const readEnvironment = (): VoicePartyIceEnvironment => ({
  stunUrlsJson: process.env.HELIX_VOICE_PARTY_STUN_URLS_JSON,
  turnUrlsJson: process.env.HELIX_VOICE_PARTY_TURN_URLS_JSON,
  turnSharedSecret: process.env.HELIX_VOICE_PARTY_TURN_SHARED_SECRET,
  turnTtlSeconds: process.env.HELIX_VOICE_PARTY_TURN_TTL_SECONDS,
});

export const issueHelixVoicePartyIceConfiguration = async (input: {
  partyId: string;
  profileId: string;
  transportPolicy: "all" | "relay";
  nowMs?: number;
  environment?: VoicePartyIceEnvironment;
}): Promise<HelixVoicePartyIceConfiguration> => {
  const party = await readHelixVoiceParty({
    partyId: input.partyId,
    viewerProfileId: input.profileId,
  });
  const self = party.members.find((member) =>
    member.profile.profile_id === input.profileId && member.state !== "left");
  if (!self || party.state === "ended" || party.members.filter(
    (member) => member.state !== "left",
  ).length !== 2) {
    throw new HelixVoicePartyDomainError(
      "voice_party_conflict",
      409,
      "Two active party members are required before media admission.",
    );
  }

  const environment = input.environment ?? readEnvironment();
  const stunUrls = readUrlList(
    environment.stunUrlsJson,
    new Set(["stun", "stuns"]),
    DEFAULT_STUN_URLS,
  );
  const hasTurnUrls = Boolean(environment.turnUrlsJson?.trim());
  const hasTurnSecret = Boolean(environment.turnSharedSecret?.trim());
  if (hasTurnUrls !== hasTurnSecret) {
    throw new HelixVoicePartyDomainError(
      "voice_party_ice_configuration_invalid",
      409,
      "Voice party TURN URLs and shared secret must be configured together.",
    );
  }
  if (!hasTurnUrls || !hasTurnSecret) {
    if (input.transportPolicy === "relay") {
      throw new HelixVoicePartyDomainError(
        "voice_party_relay_unavailable",
        409,
        "Relay-only voice requires a configured TURN deployment.",
      );
    }
    const issuedAt = new Date(input.nowMs ?? Date.now()).toISOString();
    return {
      schema: HELIX_VOICE_PARTY_ICE_CONFIGURATION_SCHEMA,
      party_id: party.party_id,
      participant_id: self.participant_id,
      ice_servers: [{ urls: stunUrls }],
      ice_transport_policy: "all",
      relay_available: false,
      issued_at: issuedAt,
      expires_at: null,
      model_visible: false,
      debug_exportable: false,
      persistable: false,
      answer_authority: false,
    };
  }

  const turnUrls = readUrlList(
    environment.turnUrlsJson,
    new Set(["turn", "turns"]),
    [],
  );
  const ttlSeconds = readTtlSeconds(environment.turnTtlSeconds);
  const nowMs = input.nowMs ?? Date.now();
  const expiresAtSeconds = Math.floor(nowMs / 1_000) + ttlSeconds;
  const opaqueSubject = crypto.createHash("sha256")
    .update(`${party.party_id}\0${self.participant_id}\0${expiresAtSeconds}`)
    .digest("base64url")
    .slice(0, 24);
  const username = `${expiresAtSeconds}:${opaqueSubject}`;
  const credential = crypto.createHmac(
    "sha1",
    environment.turnSharedSecret!.trim(),
  ).update(username).digest("base64");

  return {
    schema: HELIX_VOICE_PARTY_ICE_CONFIGURATION_SCHEMA,
    party_id: party.party_id,
    participant_id: self.participant_id,
    ice_servers: [
      { urls: stunUrls },
      { urls: turnUrls, username, credential },
    ],
    ice_transport_policy: input.transportPolicy,
    relay_available: true,
    issued_at: new Date(nowMs).toISOString(),
    expires_at: new Date(expiresAtSeconds * 1_000).toISOString(),
    model_visible: false,
    debug_exportable: false,
    persistable: false,
    answer_authority: false,
  };
};
