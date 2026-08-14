import fs from "node:fs/promises";

const state = JSON.parse(
  await fs.readFile(".tmp-helix-minecraft-room-state.json", "utf8"),
);
const baseUrl = String(state.base_url ?? "").replace(/\/$/u, "");
const roomId = String(state.room_id ?? "");
if (!baseUrl || !roomId || !state.profile_id) {
  throw new Error("room_state_incomplete");
}

const signIn = await fetch(`${baseUrl}/api/account/session/sign-in`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin: baseUrl,
    "sec-fetch-site": "same-origin",
  },
  body: JSON.stringify({
    profile_id: state.profile_id,
    display_name: "Minecraft local action-authority renewal operator",
    account_type: "developer",
  }),
});
if (!signIn.ok) throw new Error(`sign_in_http_${signIn.status}`);
const cookie = signIn.headers.get("set-cookie")?.split(";", 1)[0];
if (!cookie) throw new Error("session_cookie_missing");
const headers = {
  cookie,
  origin: baseUrl,
  "sec-fetch-site": "same-origin",
};
const readJson = async (response, label) => {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${label}_http_${response.status}_${payload?.error ?? "unknown"}`);
  }
  return payload;
};

await readJson(
  await fetch(`${baseUrl}/api/account/session/experimental-rooms`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ enabled: true }),
  }),
  "experimental_rooms",
);
const roomPayload = await readJson(
  await fetch(
    `${baseUrl}/api/agi/realtime/rooms/${encodeURIComponent(roomId)}`,
    { headers },
  ),
  "room",
);
const environmentPayload = await readJson(
  await fetch(
    `${baseUrl}/api/agi/realtime/rooms/${encodeURIComponent(roomId)}/environments`,
    { headers },
  ),
  "environments",
);
const environment = (environmentPayload.environments ?? []).find(
  (candidate) => candidate.source_id === state.source_id,
) ?? (environmentPayload.environments ?? [])[0];
if (!environment?.environment_binding_id) {
  throw new Error("environment_binding_missing");
}
const authorityUrl =
  `${baseUrl}/api/agi/realtime/rooms/${encodeURIComponent(roomId)}` +
  `/environments/${encodeURIComponent(environment.environment_binding_id)}` +
  "/action-authorities";
const authorityPayload = await readJson(
  await fetch(authorityUrl, { headers }),
  "action_authorities",
);
const prior = (authorityPayload.authorities ?? [])[0];
if (
  !prior?.domain_adapter ||
  !Array.isArray(prior.allowed_capability_ids) ||
  prior.allowed_capability_ids.length === 0 ||
  !prior.autonomy_mode ||
  !prior.manual_override_policy
) {
  throw new Error("existing_action_authority_scope_missing");
}
const participantId =
  prior.participant_id ?? roomPayload.room?.self_participant_id;
if (!participantId) throw new Error("participant_identity_missing");

const renewedPayload = await readJson(
  await fetch(authorityUrl, {
    method: "PUT",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      participant_id: participantId,
      domain_adapter: prior.domain_adapter,
      allowed_capability_ids: prior.allowed_capability_ids,
      autonomy_mode: prior.autonomy_mode,
      manual_override_policy: prior.manual_override_policy,
      expires_at: new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
    }),
  }),
  "action_authority_renewal",
);
const renewed = renewedPayload.authority;
process.stdout.write(`${JSON.stringify({
  renewed: renewed?.status === "active",
  status: renewed?.status ?? null,
  capability_count: renewed?.allowed_capability_ids?.length ?? 0,
  scope_preserved:
    renewed?.domain_adapter === prior.domain_adapter &&
    renewed?.autonomy_mode === prior.autonomy_mode &&
    renewed?.manual_override_policy === prior.manual_override_policy &&
    JSON.stringify(renewed?.allowed_capability_ids) ===
      JSON.stringify(prior.allowed_capability_ids),
  expires_in_minutes: renewed?.expires_at
    ? Math.round((Date.parse(renewed.expires_at) - Date.now()) / 60_000)
    : null,
  identifiers_reported: false,
  credentials_reported: false,
})}\n`);
