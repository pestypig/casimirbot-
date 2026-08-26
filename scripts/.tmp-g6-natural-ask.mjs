import fs from "node:fs/promises";
import path from "node:path";

const state = JSON.parse(await fs.readFile(".tmp-helix-minecraft-room-state.json", "utf8"));
const baseUrl = String(state.base_url ?? "http://localhost:1522").replace(/\/$/u, "");
const roomId = String(state.room_id ?? "").trim();
const profileId = String(state.profile_id ?? "").trim();
if (!roomId || !profileId) throw new Error("g6_room_state_incomplete");
const goalId = "environment_durable_goal:ef49540b-0bab-4857-837f-c2f449b08585";

const prompt =
  `In this room, inspect the canonical concurrent-reasoning ledger for G6 goal ${goalId}. Report whether stale proposals were rejected before execution, which revised prospective plan was selected, whether exactly one typed player action executed, and whether its measured result re-entered the same principal Runtime Codex turn. Use current canonical evidence and do not execute another game action.`;
const sessionId = `helix-ask:room:${roomId}`;
const turnId = `ask:g6-keyed-natural-${Date.now()}`;

const signIn = await fetch(`${baseUrl}/api/account/session/sign-in`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin: baseUrl,
    "sec-fetch-site": "same-origin",
  },
  body: JSON.stringify({
    profile_id: profileId,
    display_name: "G6 keyed natural Ask acceptance",
    account_type: "developer",
  }),
});
if (!signIn.ok) throw new Error(`g6_sign_in_http_${signIn.status}`);
const cookie = signIn.headers.get("set-cookie")?.split(";", 1)[0];
if (!cookie) throw new Error("g6_session_cookie_missing");

const presence = await fetch(
  `${baseUrl}/api/agi/realtime/rooms/${encodeURIComponent(roomId)}/presence`,
  {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
      origin: baseUrl,
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify({ presence: "present" }),
  },
);
if (!presence.ok) {
  const presenceText = await presence.text();
  throw new Error(`g6_presence_http_${presence.status}:${presenceText.slice(0, 300)}`);
}

const roleInspect = await fetch(`${baseUrl}/api/agi/workstation-tool-gateway/call`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    cookie,
    origin: baseUrl,
    "sec-fetch-site": "same-origin",
  },
  body: JSON.stringify({
    agent_runtime: "codex",
    mode: "read",
    capability_id: "com.casimirbot.environment.reasoning_role.inspect",
    arguments: { goal_id: goalId },
    turn_id: `${turnId}:role-inspect-preflight`,
    tool_call_id: `${turnId}:role-inspect-preflight:call`,
    provider_execution_id: `${turnId}:role-inspect-preflight:execution`,
    conversation_thread_id: sessionId,
    iteration: 0,
  }),
});
const roleInspectPayload = await roleInspect.json();
const goalInspect = await fetch(`${baseUrl}/api/agi/workstation-tool-gateway/call`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    cookie,
    origin: baseUrl,
    "sec-fetch-site": "same-origin",
  },
  body: JSON.stringify({
    agent_runtime: "codex",
    mode: "read",
    capability_id: "com.casimirbot.environment.durable_goal.inspect",
    arguments: { goal_id: goalId },
    turn_id: `${turnId}:goal-inspect-preflight`,
    tool_call_id: `${turnId}:goal-inspect-preflight:call`,
    provider_execution_id: `${turnId}:goal-inspect-preflight:execution`,
    conversation_thread_id: sessionId,
    iteration: 0,
  }),
});
const goalInspectPayload = await goalInspect.json();
const actorStatus = await fetch(`${baseUrl}/api/agi/workstation-tool-gateway/call`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    cookie,
    origin: baseUrl,
    "sec-fetch-site": "same-origin",
  },
  body: JSON.stringify({
    agent_runtime: "codex",
    mode: "read",
    capability_id: "com.casimirbot.minecraft.actor.status.read",
    arguments: { target: "current_actor", freshness_requirement_ms: 10_000 },
    turn_id: `${turnId}:actor-status-preflight`,
    tool_call_id: `${turnId}:actor-status-preflight:call`,
    provider_execution_id: `${turnId}:actor-status-preflight:execution`,
    conversation_thread_id: sessionId,
    iteration: 0,
  }),
});
const actorStatusPayload = await actorStatus.json();
const preflightOnly = process.env.G6_PREFLIGHT_ONLY === "1";
if (preflightOnly) {
  process.stdout.write(`${JSON.stringify({
    goal_inspect_http_status: goalInspect.status,
    goal_ok: goalInspectPayload?.ok ?? null,
    goal_error: goalInspectPayload?.error ?? null,
    goal_status:
      goalInspectPayload?.observation?.result?.goal?.status ??
      goalInspectPayload?.observation?.goal?.status ??
      null,
    goal_revision:
      goalInspectPayload?.observation?.result?.goal?.revision ??
      goalInspectPayload?.observation?.goal?.revision ??
      null,
    actor_status_http_status: actorStatus.status,
    actor_status_ok: actorStatusPayload?.ok ?? null,
    actor_status_error: actorStatusPayload?.error ?? null,
    actor_status_outcome: actorStatusPayload?.observation?.outcome ?? null,
    actor_status_evidence_ref:
      actorStatusPayload?.observation?.evidence_ref ?? null,
    actor_status_observation_revision:
      actorStatusPayload?.observation?.observation_revision ??
      actorStatusPayload?.observation?.result?.observation_revision ??
      actorStatusPayload?.observation?.result?.revision ??
      null,
    role_inspect_http_status: roleInspect.status,
    ok: roleInspectPayload?.ok ?? null,
    error: roleInspectPayload?.error ?? null,
    observation_outcome: roleInspectPayload?.observation?.outcome ?? null,
    observation_summary: roleInspectPayload?.observation?.summary ?? null,
    projection_revision:
      roleInspectPayload?.observation?.result?.projection?.ledger_revision ??
      roleInspectPayload?.observation?.projection?.ledger_revision ??
      null,
  }, null, 2)}\n`);
  process.exitCode = roleInspect.ok && goalInspect.ok && actorStatus.ok ? 0 : 1;
} else {

const ask = await fetch(`${baseUrl}/api/agi/ask/turn`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    cookie,
    origin: baseUrl,
    "sec-fetch-site": "same-origin",
  },
  body: JSON.stringify({
    question: prompt,
    prompt,
    turn_id: turnId,
    sessionId,
    session_id: sessionId,
    thread_id: sessionId,
    agent_runtime: "codex",
    debug: true,
    live_debug_mode: "full",
  }),
});
const askText = await ask.text();
let askPayload;
try {
  askPayload = JSON.parse(askText);
} catch {
  throw new Error(`g6_ask_non_json_${ask.status}:${askText.slice(0, 500)}`);
}

const debugResponse = await fetch(
  `${baseUrl}/api/agi/ask/turn/${encodeURIComponent(turnId)}/debug-export`,
  { headers: { cookie } },
);
const debugPayload = debugResponse.ok ? await debugResponse.json() : null;
const artifact = {
  schema: "helix.environment_harness.g6_keyed_natural_ask.v1",
  captured_at: new Date().toISOString(),
  prompt,
  room_id: roomId,
  turn_id: turnId,
  ask_http_status: ask.status,
  ask_response: askPayload,
  debug_http_status: debugResponse.status,
  debug_export: debugPayload,
  credentials_included: false,
  hidden_reasoning_included: false,
};
const serialized = JSON.stringify(artifact);
if (
  /helix_room_src_[A-Za-z0-9_-]+/u.test(serialized) ||
  /"bearer_token"\s*:\s*"(?!\[?REDACTED)/iu.test(serialized) ||
  /"claim_handle"\s*:/iu.test(serialized)
) {
  throw new Error("g6_artifact_secret_material_detected");
}
const outputDirectory = path.resolve("artifacts/g6-concurrent-environment-reasoning");
await fs.mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(
  outputDirectory,
  `keyed-natural-ask-${turnId.replace(/[^A-Za-z0-9._-]+/gu, "_")}.json`,
);
await fs.writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
await fs.writeFile(
  path.join(outputDirectory, "keyed-natural-ask.json"),
  `${JSON.stringify(artifact, null, 2)}\n`,
);

const debugRoot = debugPayload?.payload ?? debugPayload ?? {};
const trace = askPayload?.ask_turn_solver_trace ?? debugRoot?.ask_turn_solver_trace ?? null;
const differential = askPayload?.turn_lifecycle_differential_audit ?? debugRoot?.turn_lifecycle_differential_audit ?? null;
const singleWriter = askPayload?.terminal_authority_single_writer ?? debugRoot?.terminal_authority_single_writer ?? null;
process.stdout.write(`${JSON.stringify({
  output_path: outputPath,
  ask_http_status: ask.status,
  debug_http_status: debugResponse.status,
  turn_id: turnId,
  ok: askPayload?.ok ?? null,
  status: askPayload?.status ?? null,
  final_status: askPayload?.final_status ?? null,
  response_type: askPayload?.response_type ?? null,
  text: askPayload?.text ?? askPayload?.answer ?? null,
  fail_reason: askPayload?.fail_reason ?? askPayload?.terminal_error_code ?? null,
  completed_solver_path: trace?.completed_solver_path ?? null,
  evidence_reentered: trace?.evidence_reentry_gate?.evidence_reentered ?? null,
  differential_status: differential?.status ?? differential?.verdict ?? null,
  single_writer_status: singleWriter?.status ?? singleWriter?.verdict ?? null,
  support_refs: askPayload?.selected_terminal_support_refs ?? [],
}, null, 2)}\n`);
}
