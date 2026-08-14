import fs from "node:fs/promises";

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
    display_name: "Minecraft reactive perturbation watcher",
    account_type: "developer",
  }),
});
if (!signIn.ok) throw new Error(`sign_in_http_${signIn.status}`);
const cookie = signIn.headers.get("set-cookie")?.split(";", 1)[0];
if (!cookie) throw new Error("session_cookie_missing");
const commonHeaders = {
  cookie,
  origin: state.base_url,
  "sec-fetch-site": "same-origin",
};
const experimental = await fetch(
  `${state.base_url}/api/account/session/experimental-rooms`,
  {
    method: "POST",
    headers: { ...commonHeaders, "content-type": "application/json" },
    body: JSON.stringify({ enabled: true }),
  },
);
if (!experimental.ok) throw new Error(`experimental_http_${experimental.status}`);
const environmentsResponse = await fetch(
  `${state.base_url}/api/agi/realtime/rooms/${encodeURIComponent(state.room_id)}/environments`,
  { headers: commonHeaders },
);
if (!environmentsResponse.ok) {
  throw new Error(`environments_http_${environmentsResponse.status}`);
}
const environments = (await environmentsResponse.json()).environments ?? [];
const environment = environments.find(
  (candidate) => candidate.source_id === state.source_id,
) ?? environments[0];
if (!environment?.environment_binding_id) {
  throw new Error("environment_binding_missing");
}
const authorityUrl =
  `${state.base_url}/api/agi/realtime/rooms/${encodeURIComponent(state.room_id)}` +
  `/environments/${encodeURIComponent(environment.environment_binding_id)}` +
  "/action-authorities";
const deadline = Date.now() + Number(process.env.HELIX_WORKFLOW_WATCH_TIMEOUT_MS ?? 180_000);
const minimumActiveMs = Math.max(
  0,
  Number(process.env.HELIX_WORKFLOW_MIN_ACTIVE_MS ?? 0),
);
const maximumEvents = Math.max(
  1,
  Number(process.env.HELIX_WORKFLOW_EVENT_COUNT ?? 1),
);
const idleExitMs = Math.max(
  0,
  Number(process.env.HELIX_WORKFLOW_IDLE_EXIT_MS ?? 0),
);
let activeSinceMs = null;
let emittedForCurrentWorkflow = false;
let emittedEventCount = 0;
let lastEventAtMs = null;
while (Date.now() < deadline) {
  const response = await fetch(authorityUrl, { headers: commonHeaders });
  if (response.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    continue;
  }
  if (!response.ok) throw new Error(`authority_http_${response.status}`);
  const payload = await response.json();
  const ready = (payload.connector_readiness ?? []).find(
    (entry) => Number(entry.active_workflow_count ?? 0) > 0,
  );
  if (ready) {
    activeSinceMs ??= Date.now();
    if (
      !emittedForCurrentWorkflow &&
      Date.now() - activeSinceMs >= minimumActiveMs
    ) {
      emittedForCurrentWorkflow = true;
      emittedEventCount += 1;
      lastEventAtMs = Date.now();
      process.stdout.write(`${JSON.stringify({
        event: "persistent_workflow_active",
        event_index: emittedEventCount,
        detected_at_ms: Date.now(),
        active_since_ms: activeSinceMs,
        active_duration_ms: Date.now() - activeSinceMs,
        minimum_active_ms: minimumActiveMs,
        active_workflow_count: ready.active_workflow_count,
        controls_asserted: ready.controls_asserted,
        heartbeat_fresh: ready.heartbeat_fresh,
      })}\n`);
      if (emittedEventCount >= maximumEvents) process.exit(0);
    }
  } else {
    if (emittedForCurrentWorkflow) {
      process.stdout.write(`${JSON.stringify({
        event: "workflow_inactive",
        event_index: emittedEventCount,
        detected_at_ms: Date.now(),
      })}\n`);
    }
    activeSinceMs = null;
    emittedForCurrentWorkflow = false;
    if (
      emittedEventCount > 0 &&
      idleExitMs > 0 &&
      lastEventAtMs !== null &&
      Date.now() - lastEventAtMs >= idleExitMs
    ) {
      process.exit(0);
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 1_000));
}
throw new Error("active_workflow_watch_timeout");
