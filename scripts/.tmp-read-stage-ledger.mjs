import fs from "node:fs/promises";

const turnId = process.argv[2];
if (!turnId) throw new Error("turn_id_required");
const state = JSON.parse(
  await fs.readFile(".tmp-helix-minecraft-room-state.json", "utf8"),
);
const signIn = await fetch(`${state.base_url}/api/account/session/sign-in`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin: state.base_url,
    "sec-fetch-site": "same-origin",
  },
  body: JSON.stringify({
    profile_id: state.profile_id,
    display_name: "Minecraft situation-awareness local test",
    account_type: "developer",
  }),
});
if (!signIn.ok) throw new Error(`sign_in_http_${signIn.status}`);
const cookie = signIn.headers.get("set-cookie")?.split(";", 1)[0];
if (!cookie) throw new Error("session_cookie_missing");
if (turnId === "--authority" || turnId === "--renew-authority") {
  const experimentalResponse = await fetch(
    `${state.base_url}/api/account/session/experimental-rooms`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
        origin: state.base_url,
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify({ enabled: true }),
    },
  );
  if (!experimentalResponse.ok) {
    throw new Error(`experimental_rooms_http_${experimentalResponse.status}`);
  }
  const environmentsResponse = await fetch(
    `${state.base_url}/api/agi/realtime/rooms/${encodeURIComponent(state.room_id)}/environments`,
    { headers: { cookie } },
  );
  if (!environmentsResponse.ok) {
    throw new Error(`environments_http_${environmentsResponse.status}`);
  }
  const environmentsPayload = await environmentsResponse.json();
  const environment = (environmentsPayload.environments ?? []).find(
    (candidate) => candidate.source_id === state.source_id,
  ) ?? (environmentsPayload.environments ?? [])[0];
  if (!environment?.environment_binding_id) {
    throw new Error("environment_binding_missing");
  }
  const authorityResponse = await fetch(
    `${state.base_url}/api/agi/realtime/rooms/${encodeURIComponent(state.room_id)}/environments/${encodeURIComponent(environment.environment_binding_id)}/action-authorities`,
    { headers: { cookie } },
  );
  if (!authorityResponse.ok) {
    throw new Error(`authority_http_${authorityResponse.status}`);
  }
  const authorityPayload = await authorityResponse.json();
  if (turnId === "--renew-authority") {
    const current = (authorityPayload.authorities ?? [])[0];
    if (!current) throw new Error("action_authority_missing");
    const renewalResponse = await fetch(
      `${state.base_url}/api/agi/realtime/rooms/${encodeURIComponent(state.room_id)}/environments/${encodeURIComponent(environment.environment_binding_id)}/action-authorities`,
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          cookie,
          origin: state.base_url,
          "sec-fetch-site": "same-origin",
        },
        body: JSON.stringify({
          participant_id: current.participant_id,
          domain_adapter: current.domain_adapter,
          allowed_capability_ids: current.allowed_capability_ids,
          autonomy_mode: current.autonomy_mode,
          manual_override_policy: current.manual_override_policy,
          expires_at: new Date(Date.now() + 2 * 60 * 60_000).toISOString(),
        }),
      },
    );
    if (!renewalResponse.ok) {
      throw new Error(`authority_renew_http_${renewalResponse.status}`);
    }
    const renewedPayload = await renewalResponse.json();
    const renewed = renewedPayload.authority;
    process.stdout.write(`${JSON.stringify({
      ok: renewedPayload.ok,
      error: renewedPayload.error,
      status: renewed?.status,
      action_authority_id: renewed?.action_authority_id,
      autonomy_mode: renewed?.autonomy_mode,
      allowed_capability_count: renewed?.allowed_capability_ids?.length ?? 0,
      expires_at: renewed?.expires_at,
    })}\n`);
    process.exit(0);
  }
  const authorities = (authorityPayload.authorities ?? []).map((authority) => ({
    action_authority_id: authority.action_authority_id,
    status: authority.status,
    participant_id: authority.participant_id,
    autonomy_mode: authority.autonomy_mode,
    allowed_capability_ids: authority.allowed_capability_ids,
    expires_at: authority.expires_at,
    connector_status: authority.connector_status,
  }));
  process.stdout.write(`${JSON.stringify({
    ok: authorityPayload.ok,
    error: authorityPayload.error,
    authorities,
    environment: {
      environment_binding_id: environment.environment_binding_id,
      source_id: environment.source_id,
      domain_adapter: environment.domain_adapter,
      status: environment.status,
    },
    connector_readiness: authorityPayload.connector_readiness,
  })}\n`);
  process.exit(0);
}
const response = await fetch(
  `${state.base_url}/api/agi/agent-providers/codex/turn-stage/${encodeURIComponent(turnId)}`,
  { headers: { cookie } },
);
if (!response.ok) throw new Error(`stage_ledger_http_${response.status}`);
const payload = await response.json();
const ledger = payload.ledger ?? payload.stage_ledger ?? payload.data ?? payload;
process.stdout.write(`${JSON.stringify({
  response_keys: Object.keys(payload),
  status: ledger.status,
  total_elapsed_ms: ledger.total_elapsed_ms,
  compatibility_model_attempt_count: ledger.compatibility_model_attempt_count,
  events: (ledger.events ?? []).map((event) => ({
    stage: event.stage,
    status: event.status,
    attempt: event.attempt,
    elapsed_ms: event.elapsed_ms,
    prompt_char_count: event.prompt_char_count,
    output_char_count: event.output_char_count,
    fail_reason: event.fail_reason,
    capability_request_parsed: event.capability_request_parsed,
  })),
})}\n`);
