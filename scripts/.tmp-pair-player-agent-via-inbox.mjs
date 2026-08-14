import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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
    display_name: "Minecraft local player-agent pairing operator",
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
  if (!response.ok) throw new Error(`${label}_http_${response.status}`);
  return response.json();
};

await readJson(
  await fetch(`${baseUrl}/api/account/session/experimental-rooms`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ enabled: true }),
  }),
  "experimental_rooms",
);
const sourcePayload = await readJson(
  await fetch(
    `${baseUrl}/api/agi/realtime/rooms/${encodeURIComponent(roomId)}/source-bindings`,
    { headers },
  ),
  "source_bindings",
);
const sourceBinding = (sourcePayload.bindings ?? []).find(
  (candidate) => candidate.source_id === state.source_id,
) ?? (sourcePayload.bindings ?? [])[0];
if (!sourceBinding?.binding_id) throw new Error("source_binding_missing");

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
  "action_authority",
);
const authority = (authorityPayload.authorities ?? [])[0];
if (!authority?.action_authority_id || authority.status !== "active") {
  throw new Error("active_action_authority_missing");
}

const pairingPayload = await readJson(
  await fetch(
    `${baseUrl}/api/agi/realtime/rooms/${encodeURIComponent(roomId)}/connector-pairings`,
    {
      method: "POST",
      headers: {
        ...headers,
        "content-type": "application/json",
        "idempotency-key": `codex-player-action-pairing:${crypto.randomUUID()}`,
      },
      body: JSON.stringify({
        purpose: "rotate",
        binding_id: sourceBinding.binding_id,
        domain_adapter: sourceBinding.domain_adapter,
        source_label: sourceBinding.source_label,
        action_credential_requested: true,
        action_authority_id: authority.action_authority_id,
        credential_ttl_ms: 2 * 60 * 60_000,
      }),
    },
  ),
  "connector_pairing",
);
const pairingCommand = String(pairingPayload.pairing_command ?? "").trim();
if (!/^\/helix-player pair [A-Z0-9-]+$/u.test(pairingCommand)) {
  throw new Error("player_pairing_command_missing");
}

const inbox = path.join(
  os.homedir(),
  "AppData",
  "Roaming",
  ".minecraft",
  "config",
  "helix-fabric-player-agent.pairing-inbox",
);
await fs.mkdir(path.dirname(inbox), { recursive: true });
await fs.writeFile(inbox, `${pairingCommand}\n`, {
  encoding: "utf8",
  flag: "wx",
});

const deadline = Date.now() + 45_000;
let readiness = null;
while (Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, 1_000));
  const payload = await readJson(
    await fetch(authorityUrl, { headers }),
    "action_authority_poll",
  );
  readiness = (payload.connector_readiness ?? [])[0] ?? null;
  if (readiness?.ready_for_actions === true) break;
}
process.stdout.write(`${JSON.stringify({
  paired_via_local_inbox: readiness?.ready_for_actions === true,
  authority_status: authority.status,
  connector_state: readiness?.state ?? null,
  manifest_admitted: readiness?.manifest_admitted ?? false,
  heartbeat_fresh: readiness?.heartbeat_fresh ?? false,
  declared_capability_count: readiness?.declared_capability_count ?? 0,
  available_control_engines: readiness?.available_control_engines ?? [],
  pairing_code_reported: false,
  credential_reported: false,
})}\n`);
if (readiness?.ready_for_actions !== true) process.exitCode = 1;
