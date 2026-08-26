import fs from "node:fs/promises";
import path from "node:path";

const state = JSON.parse(await fs.readFile(".tmp-helix-minecraft-room-state.json", "utf8"));
const baseUrl = String(state.base_url ?? "http://localhost:1522").replace(/\/$/u, "");
const roomId = String(state.room_id ?? "").trim();
const profileId = String(state.profile_id ?? "").trim();
const goalId = "environment_durable_goal:ef49540b-0bab-4857-837f-c2f449b08585";
if (!roomId || !profileId) throw new Error("g6_room_state_incomplete");

const principalTurnId = `g6-live-rebuilt-${Date.now()}-turn-1`;
const sessionId = `helix-ask:room:${roomId}`;
const signIn = await fetch(`${baseUrl}/api/account/session/sign-in`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: baseUrl, "sec-fetch-site": "same-origin" },
  body: JSON.stringify({ profile_id: profileId, display_name: "G6 A1 rebuild", account_type: "developer" }),
});
if (!signIn.ok) throw new Error(`g6_sign_in_http_${signIn.status}`);
const cookie = signIn.headers.get("set-cookie")?.split(";", 1)[0];
if (!cookie) throw new Error("g6_session_cookie_missing");

const roomPresence = await fetch(`${baseUrl}/api/agi/realtime/rooms/${encodeURIComponent(roomId)}/presence`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie, origin: baseUrl, "sec-fetch-site": "same-origin" },
  body: JSON.stringify({ presence: "present" }),
});
if (!roomPresence.ok) throw new Error(`g6_presence_http_${roomPresence.status}`);

let callIndex = 0;
const calls = [];
const gateway = async (capabilityId, mode, args) => {
  callIndex += 1;
  const response = await fetch(`${baseUrl}/api/agi/workstation-tool-gateway/call`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie, origin: baseUrl, "sec-fetch-site": "same-origin" },
    body: JSON.stringify({
      agent_runtime: "codex",
      mode,
      capability_id: capabilityId,
      arguments: args,
      turn_id: principalTurnId,
      tool_call_id: `${principalTurnId}:call:${callIndex}`,
      provider_execution_id: `${principalTurnId}:execution:${callIndex}`,
      conversation_thread_id: sessionId,
      iteration: callIndex - 1,
    }),
  });
  const payload = await response.json();
  calls.push({ capability_id: capabilityId, http_status: response.status, payload });
  if (!response.ok || !payload?.ok) {
    throw new Error(`${capabilityId}:${response.status}:${payload?.error ?? payload?.summary ?? "failed"}`);
  }
  return payload;
};

const projectionOf = (payload) =>
  payload?.observation?.projection ?? payload?.observation?.result?.projection ?? null;
const statusEvidence = (payload) => ({
  revision:
    payload?.observation?.observation_revision ??
    payload?.observation?.result?.observation_revision ??
    payload?.observation?.result?.revision,
  evidenceRef: payload?.observation?.evidence_ref,
});

const goal = await gateway("com.casimirbot.environment.durable_goal.inspect", "read", { goal_id: goalId });
const goalRevision =
  goal?.observation?.result?.goal?.revision ?? goal?.observation?.goal?.revision;
if (!Number.isInteger(goalRevision)) throw new Error("g6_goal_revision_missing");

const statusA = statusEvidence(await gateway(
  "com.casimirbot.minecraft.actor.status.read",
  "read",
  { target: "current_actor", freshness_requirement_ms: 10_000 },
));
if (!Number.isInteger(statusA.revision) || !statusA.evidenceRef) throw new Error("g6_status_a_identity_missing");

const perceptionA = projectionOf(await gateway(
  "com.casimirbot.environment.reasoning_role.record",
  "act",
  {
    goal_id: goalId,
    expected_goal_revision: goalRevision,
    expected_ledger_revision: 0,
    observation_revision: statusA.revision,
    input_evidence_refs: [statusA.evidenceRef],
    payload: {
      role_kind: "perception",
      summary: "Initial player-state revision is viable and suitable for one bounded camera adjustment.",
      changes: [{
        change_id: "g6.initial_state",
        kind: "player_state",
        severity: "informational",
        summary: "The paired actor is present and viable at the initial observation revision.",
        evidence_refs: [statusA.evidenceRef],
      }],
      requested_observation_kinds: ["minecraft.actor.status"],
      uncertainty_notes: ["This output must become stale if a newer observation revision arrives."],
    },
    expires_in_seconds: 300,
  },
));
const perceptionAId = perceptionA?.outputs?.at(-1)?.role_output_id;

const actionArgs = {
  target_kind: "relative_rotation",
  yaw_delta_degrees: 2,
  pitch_delta_degrees: 0,
  max_turn_degrees_per_tick: 2,
};
const planA = projectionOf(await gateway(
  "com.casimirbot.environment.reasoning_role.record",
  "act",
  {
    goal_id: goalId,
    expected_goal_revision: goalRevision,
    expected_ledger_revision: 1,
    observation_revision: statusA.revision,
    input_evidence_refs: [statusA.evidenceRef],
    payload: {
      role_kind: "prospective_planning",
      proposal_id: "g6.plan.initial",
      objective_summary: "Turn the paired player's camera two degrees right with normal player controls.",
      capability_id: "com.casimirbot.minecraft.player.look",
      capability_arguments: actionArgs,
      predicted_postconditions: [{
        postcondition_id: "g6.yaw.plus_two",
        expected_state: "Measured final yaw is approximately two degrees greater than initial yaw while viability is preserved.",
        verification_capability_ids: ["com.casimirbot.minecraft.actor.status.read"],
      }],
      assumptions: ["The connector remains online and manual override is inactive."],
      resource_keys: ["minecraft.player.camera"],
      confidence: 0.95,
      abstain: false,
    },
    expires_in_seconds: 300,
  },
));
const planAId = planA?.outputs?.at(-1)?.role_output_id;

const statusB = statusEvidence(await gateway(
  "com.casimirbot.minecraft.actor.status.read",
  "read",
  { target: "current_actor", freshness_requirement_ms: 10_000 },
));
if (!Number.isInteger(statusB.revision) || statusB.revision <= statusA.revision || !statusB.evidenceRef) {
  throw new Error("g6_status_revision_did_not_advance");
}

const perceptionB = projectionOf(await gateway(
  "com.casimirbot.environment.reasoning_role.record",
  "act",
  {
    goal_id: goalId,
    expected_goal_revision: goalRevision,
    expected_ledger_revision: 2,
    observation_revision: statusB.revision,
    input_evidence_refs: [statusB.evidenceRef],
    payload: {
      role_kind: "perception",
      summary: "A newer player-state revision supersedes the initial perception without introducing a hazard.",
      changes: [{
        change_id: "g6.observation_revision_advanced",
        kind: "observation_revision",
        severity: "attention",
        summary: "The current observation revision advanced, so earlier supporting outputs must not authorize execution.",
        evidence_refs: [statusB.evidenceRef],
      }],
      requested_observation_kinds: [],
      uncertainty_notes: [],
    },
    expires_in_seconds: 300,
  },
));
const perceptionBId = perceptionB?.outputs?.at(-1)?.role_output_id;

const planB = projectionOf(await gateway(
  "com.casimirbot.environment.reasoning_role.record",
  "act",
  {
    goal_id: goalId,
    expected_goal_revision: goalRevision,
    expected_ledger_revision: 3,
    observation_revision: statusB.revision,
    input_evidence_refs: [statusB.evidenceRef],
    payload: {
      role_kind: "prospective_planning",
      proposal_id: "g6.plan.revised",
      objective_summary: "Use the newest player-state revision to turn the camera two degrees right exactly once.",
      capability_id: "com.casimirbot.minecraft.player.look",
      capability_arguments: actionArgs,
      predicted_postconditions: [{
        postcondition_id: "g6.yaw.plus_two.current",
        expected_state: "The current actor's measured yaw advances approximately two degrees and the action terminates.",
        verification_capability_ids: ["com.casimirbot.minecraft.actor.status.read"],
      }],
      assumptions: ["The newer observation remains current through admission."],
      resource_keys: ["minecraft.player.camera"],
      confidence: 0.98,
      abstain: false,
    },
    expires_in_seconds: 300,
  },
));
const planBId = planB?.outputs?.at(-1)?.role_output_id;
if (![perceptionAId, planAId, perceptionBId, planBId].every(Boolean)) throw new Error("g6_role_output_id_missing");

await gateway(
  "com.casimirbot.environment.reasoning_role.disposition",
  "act",
  {
    goal_id: goalId,
    expected_ledger_revision: 4,
    role_output_id: planBId,
    disposition: "adopted",
    adopted_capability_id: "com.casimirbot.minecraft.player.look",
    adopted_capability_arguments: actionArgs,
    rationale_summary: "The revised plan is bound to the newest observation and preserves one typed execution path.",
  },
);

const arbitration = projectionOf(await gateway(
  "com.casimirbot.environment.reasoning_role.arbitrate",
  "act",
  {
    goal_id: goalId,
    expected_goal_revision: goalRevision,
    expected_ledger_revision: 5,
    observation_revision: statusB.revision,
    considered_role_output_ids: [perceptionAId, planAId, perceptionBId, planBId],
    selected_role_output_id: planBId,
    reason: "Reject every output bound to the superseded observation and select only the current principal-adopted plan.",
  },
));

const action = await gateway(
  "com.casimirbot.minecraft.player.look",
  "act",
  actionArgs,
);
const statusC = await gateway(
  "com.casimirbot.minecraft.actor.status.read",
  "read",
  { target: "current_actor", freshness_requirement_ms: 10_000 },
);
const finalProjection = projectionOf(await gateway(
  "com.casimirbot.environment.reasoning_role.inspect",
  "read",
  { goal_id: goalId },
));

const artifact = {
  schema: "helix.environment_harness.g6_a1_rebuilt_live.v1",
  captured_at: new Date().toISOString(),
  room_id: roomId,
  goal_id: goalId,
  principal_turn_id: principalTurnId,
  initial_observation: statusA,
  revised_observation: statusB,
  role_output_ids: { perception_initial: perceptionAId, plan_initial: planAId, perception_revised: perceptionBId, plan_revised: planBId },
  arbitration: arbitration?.arbitrations?.at(-1) ?? null,
  action_observation: action?.observation ?? null,
  verification_observation: statusC?.observation ?? null,
  final_projection: finalProjection,
  calls,
  credentials_included: false,
  hidden_reasoning_included: false,
};
const serialized = JSON.stringify(artifact);
if (/helix_(?:room_src|live)_[A-Za-z0-9_-]+/u.test(serialized) || /"bearer_token"\s*:/iu.test(serialized)) {
  throw new Error("g6_artifact_secret_material_detected");
}
const outputDirectory = path.resolve("artifacts/g6-concurrent-environment-reasoning");
await fs.mkdir(outputDirectory, { recursive: true });
const outputPath = path.join(outputDirectory, `a1-rebuilt-${principalTurnId}.json`);
await fs.writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
await fs.writeFile(path.join(outputDirectory, "a1-live-latest.json"), `${JSON.stringify(artifact, null, 2)}\n`);

process.stdout.write(`${JSON.stringify({
  output_path: outputPath,
  principal_turn_id: principalTurnId,
  initial_observation_revision: statusA.revision,
  revised_observation_revision: statusB.revision,
  projection_revision: finalProjection?.revision ?? null,
  stale_output_ids: finalProjection?.invalidations?.map((entry) => entry.role_output_id) ?? [],
  selected_role_output_id: finalProjection?.arbitrations?.at(-1)?.selected_role_output_id ?? null,
  action_request_ref: action?.observation?.action_request_ref ?? null,
  action_execution_ref: action?.observation?.action_execution_ref ?? null,
  action_evidence_ref: action?.observation?.evidence_ref ?? null,
  execution_link_count: finalProjection?.execution_links?.length ?? null,
  measured_result_link_count: finalProjection?.measured_result_links?.length ?? null,
  continuity_audit: finalProjection?.continuity_audit ?? null,
}, null, 2)}\n`);
