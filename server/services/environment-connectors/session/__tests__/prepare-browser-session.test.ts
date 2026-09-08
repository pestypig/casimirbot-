import { expect, it, vi } from "vitest";
import { HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY } from "@shared/helix-environment-connector";
import { prepareBrowserEnvironmentSession } from "../prepare-browser-session";
import { readEnvironmentConnectorCapabilityDescriptor } from "../../catalog";
import { validateEnvironmentConnectorSchemaValue } from "../../conformance";

function fixture() {
  const input = { sessionId: "session:a", profileRef: "profile:a", bindingId: "binding:a", bindingEpoch: 1,
    helixConversationId: "chat:a", missionId: null, runId: "run:a", requestId: "request:a" };
  const target = { ...input, authenticatedMcpClientRef: "client:a", clientSessionRef: "client-session:a",
    clientContinuationRef: "task:a" };
  const store = { resolveOwnedPreparationTarget: vi.fn(() => target), verifyTaskAssociation: vi.fn() };
  const presence = [{ authenticated_profile_ref: input.profileRef, client_session_ref: target.clientSessionRef,
    authenticated_mcp_client_ref: target.authenticatedMcpClientRef, conversation_thread_ref: target.clientContinuationRef }];
  const identity = { environment_binding_id: "environment:a", source_id: "source:a", world_id: "world:a",
    subject_binding_id: "subject:a", subject_native_id: "player:a", action_authority_id: "authority:a" };
  const observation = { schema: "helix.environment_connector.probe_observation.v1",
    probe_request_ref: "probe:a", probe_attempt_ref: "attempt:a",
    capability_id: HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY, capability_version: 1,
    outcome: "succeeded", summary: "Observed", result: {}, evidence_ref: "evidence:a",
    observed_at: new Date().toISOString(), freshness_age_ms: 0, provenance_valid: true,
    eligible_for_current_turn_reentry: true, late_result_disposition: null,
    content_role: "environment_probe_observation_not_assistant_answer", reentry_required: true,
    answer_authority: false, assistant_answer: false, terminal_eligible: false, raw_content_included: false };
  const deps = {
    account: vi.fn().mockResolvedValue({ trusted_account_session: true, profile_id: input.profileRef, session_id: input.sessionId }),
    association: vi.fn().mockResolvedValue({ room_id: "room:a", run_id: input.runId }),
    membership: vi.fn().mockResolvedValue({ participantId: "participant:a", roomStatus: "active" }),
    goal: vi.fn().mockResolvedValue({ goal_id: "goal:a", revision: 5, identity }),
    environments: vi.fn().mockResolvedValue([{ ...identity, room_id: "room:a",
      self_subject_binding: { subject_binding_id: "subject:a", participant_id: "participant:a", status: "active" } }]),
    refreshSubject: vi.fn(), observe: vi.fn().mockResolvedValue({ ok: true, observation }),
    prepare: vi.fn().mockResolvedValue({ readiness: { ready: true }, execution_authority: false }),
  };
  return { input, store, deps, observation, presence, target,
    run: () => prepareBrowserEnvironmentSession(input, store as never, presence as never, deps as never) };
}

it("uses the authenticated MCP account and rejects a different task before observation", async () => {
  const f = fixture();
  const accountContext = { trusted_account_session: true, profile_id: f.input.profileRef, session_id: f.input.sessionId };
  const run = (target: typeof f.target) => prepareBrowserEnvironmentSession(f.input, f.store as never,
    f.presence as never, f.deps as never, { accountContext: accountContext as never, target });
  await run(f.target);
  expect(f.deps.account).not.toHaveBeenCalled();
  expect(f.deps.observe.mock.calls[0][0].accountContext).toBe(accountContext);
  await expect(run({ ...f.target, clientContinuationRef: "task:foreign" })).rejects.toThrow("reasoning_binding_identity_mismatch");
  expect(f.deps.observe).toHaveBeenCalledOnce();
  expect(f.deps.prepare).toHaveBeenCalledOnce();
});

it("automatically acquires a first-party snapshot and passes exact evidence to shared preparation", async () => {
  const f = fixture();
  expect(await f.run()).toMatchObject({ readiness: { ready: true }, execution_authority: false });
  const args = f.deps.observe.mock.calls[0][0];
  expect(args).toMatchObject({ policy: null, conversationThreadId: "helix-ask:room:room:a",
    capabilityId: HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY,
    expectedEnvironmentIdentity: { subjectBindingId: "subject:a", subjectNativeId: "player:a" } });
  expect(args.providerExecutionId).toMatch(/^environment_session_preparation:/);
  expect(validateEnvironmentConnectorSchemaValue(
    readEnvironmentConnectorCapabilityDescriptor(HELIX_MINECRAFT_PERCEPTION_SNAPSHOT_READ_CAPABILITY)!.input_schema,
    args.arguments)).toEqual([]);
  expect(f.deps.prepare.mock.calls[0][0].context).toMatchObject({ goalId: "goal:a", expectedRevision: 5,
    runId: "run:a", probeRequestId: "probe:a", priorTurnId: args.turnId });
  await f.run();
  expect(f.deps.observe.mock.calls[1][0].toolCallId).toBe(args.toolCallId);
});

it.each(["account", "run", "goal", "subject", "observation", "capability"])("stops before preparation on %s mismatch", async stage => {
  const f = fixture();
  if (stage === "account") f.deps.account.mockResolvedValue({ trusted_account_session: false });
  if (stage === "run") f.deps.association.mockResolvedValue({ run_id: "other", room_id: "room:a" });
  if (stage === "goal") f.deps.goal.mockResolvedValue(null);
  if (stage === "subject") f.deps.environments.mockResolvedValue([]);
  if (stage === "observation") f.deps.observe.mockResolvedValue({ ok: true,
    observation: { ...f.observation, eligible_for_current_turn_reentry: false } });
  if (stage === "capability") f.deps.observe.mockResolvedValue({ ok: true,
    observation: { ...f.observation, capability_id: "com.casimirbot.minecraft.inventory.check" } });
  await expect(f.run()).rejects.toThrow();
  expect(f.deps.prepare).not.toHaveBeenCalled();
  if (!["observation", "capability"].includes(stage)) expect(f.deps.observe).not.toHaveBeenCalled();
});
