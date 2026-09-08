import { afterEach, expect, it, vi } from "vitest";
import { readEnvironmentSessionReadiness, type EnvironmentSessionReadinessInput } from "../session-readiness";
import { EnvironmentDurableGoalError } from "../../goals/durable-goal-store";

afterEach(() => vi.restoreAllMocks());
const now = Date.parse("2026-09-08T00:00:00Z");
function fixture() {
  vi.spyOn(Date, "now").mockReturnValue(now);
  const input: EnvironmentSessionReadinessInput = {
    context: { profileId: "profile:a", participantId: "participant:a", roomId: "room:a",
      runId: "run:a", goalId: "goal:a", expectedRevision: 1, turnId: "turn:a",
      priorTurnId: "turn:prior", probeRequestId: "probe:a" },
    binding: { profileRef: "profile:a", authenticatedMcpClientRef: "client:a",
      clientSessionRef: "session:a", clientContinuationRef: "task:a", bindingId: "binding:a",
      bindingEpoch: 1, helixConversationId: "chat:a", missionId: null, runId: "run:a" },
    environmentBindingId: "environment:a", sourceId: "source:a", worldId: "world:a",
    subjectBindingId: "subject:a", actionAuthorityId: "authority:a",
  };
  const identity = { room_id: "room:a", run_id: "run:a", environment_binding_id: "environment:a",
    source_id: "source:a", world_id: "world:a", subject_binding_id: "subject:a",
    action_authority_id: "authority:a", participant_id: "participant:a" };
  const environment = { ...identity, connection_status: "active", subject_directory: { freshness: "fresh" },
    self_subject_binding: { ...identity, subject_ref: "subject_ref:a", status: "active", expires_at: null } };
  const authority = { ...identity, status: "active", expires_at: new Date(now + 60_000).toISOString() };
  const controller = { action_authority_id: "authority:a", ready_for_actions: true,
    heartbeat_received_at: new Date(now - 100).toISOString(), heartbeat_max_age_ms: 30_000 };
  const deps = {
    membership: vi.fn().mockResolvedValue({ participantId: "participant:a", roomStatus: "active" }),
    environments: vi.fn().mockResolvedValue([environment]),
    subject: vi.fn().mockResolvedValue(environment.self_subject_binding),
    authorities: vi.fn().mockResolvedValue([authority]),
    controllers: vi.fn().mockResolvedValue([controller]),
    goal: vi.fn().mockResolvedValue({ goal_id: "goal:a", goal_revision: 1, identity }),
    perception: vi.fn().mockResolvedValue({ context: { evidence: { observation: { evidence_ref: "probe:evidence" } } } }),
  };
  const bindingStore = { verifyTaskAssociation: vi.fn().mockReturnValue({
    reasoning_binding_id: "binding:a", service_instance_ref: "service:a" }) };
  const read = () => readEnvironmentSessionReadiness(input, bindingStore, deps);
  return { input, deps, environment, authority, controller, bindingStore, read };
}

it("reports stale subject and goal together despite a ready controller", async () => {
  const f = fixture();
  f.environment.self_subject_binding.status = "stale";
  f.deps.goal.mockRejectedValue(new EnvironmentDurableGoalError("durable_goal_authority_stale", 409, "stale"));
  const result = await f.read();
  expect(result.ready).toBe(false);
  expect(result.next_check).toBe("subject");
  expect(result.blockers.map(check => check.layer)).toEqual(["subject", "goal"]);
  expect(result.checks.find(check => check.layer === "controller")?.state).toBe("verified");
  expect(f.deps.subject).not.toHaveBeenCalled();
});

it("three independent reads retain the same context and exact selectors", async () => {
  const f = fixture();
  const results = await Promise.all([f.read(), f.read(), f.read()]);
  expect(new Set(results.map(result => result.context_ref)).size).toBe(1);
  for (const result of results) expect(result).toMatchObject({ ready: true, execution_authority: false, answer_authority: false });
  expect(f.deps.authorities).toHaveBeenCalledTimes(3);
  expect(f.deps.subject).toHaveBeenCalledTimes(3);
  expect(f.deps.authorities).toHaveBeenLastCalledWith({ roomId: "room:a", profileId: "profile:a", environmentBindingId: "environment:a" });
});

it.each(["profile", "run", "participant", "closed"])("rejects %s before reading environment data", async kind => {
  const f = fixture();
  if (kind === "profile") f.input.context.profileId = "profile:b";
  if (kind === "run") f.input.binding.runId = null;
  if (kind === "participant") f.input.context.participantId = "participant:b";
  if (kind === "closed") f.deps.membership.mockResolvedValue({ participantId: "participant:a", roomStatus: "closed" });
  await expect(f.read()).rejects.toThrow("Session readiness requires");
  expect(f.deps.environments).not.toHaveBeenCalled();
});

it.each(["revoked", "expired", "unbounded", "wrong_subject"])("does not bless %s authority", async kind => {
  const f = fixture();
  if (kind === "revoked") f.authority.status = "revoked";
  if (kind === "expired") f.authority.expires_at = new Date(now).toISOString();
  if (kind === "unbounded") f.deps.authorities.mockResolvedValue([{ ...f.authority, expires_at: null }]);
  if (kind === "wrong_subject") f.authority.subject_binding_id = "subject:b";
  const result = await f.read();
  expect(result.ready).toBe(false);
  expect(result.next_check).toBe("authority");
  expect(result.blockers[0].human_approval_required).toBe(false);
});

it("does not trust a future controller heartbeat", async () => {
  const f = fixture();
  f.controller.heartbeat_received_at = new Date(now + 1_000).toISOString();
  expect((await f.read()).next_check).toBe("controller");
});

it("sanitizes unknown failures and still collects later independent checks", async () => {
  const f = fixture();
  f.deps.environments.mockRejectedValue(new Error("secret internal exception"));
  const result = await f.read();
  expect(JSON.stringify(result)).not.toContain("secret");
  expect(result.blockers.map(check => check.layer)).toEqual(["source", "subject"]);
  expect(f.deps.goal).toHaveBeenCalledOnce();
});

it("does not return a snapshot after binding revocation during reads", async () => {
  const f = fixture();
  f.bindingStore.verifyTaskAssociation.mockImplementationOnce(() => ({ reasoning_binding_id: "binding:a", service_instance_ref: "service:a" }))
    .mockImplementationOnce(() => { throw new Error("revoked"); });
  await expect(f.read()).rejects.toThrow("revoked");
});

it.each(["source", "subject", "goal"])("rejects a foreign %s identity without selecting a replacement", async layer => {
  const f = fixture();
  if (layer === "source") f.environment.source_id = "source:other";
  if (layer === "subject") f.environment.self_subject_binding.environment_binding_id = "environment:other";
  if (layer === "goal") f.deps.goal.mockResolvedValue({ goal_id: "goal:other", goal_revision: 1,
    identity: { ...f.authority, run_id: "run:a" } });
  expect((await f.read()).next_check).toBe(layer);
});

it("fails closed before environment reads when exact task verification fails", async () => {
  const f = fixture();
  f.bindingStore.verifyTaskAssociation.mockImplementation(() => { throw new Error("wrong task"); });
  await expect(f.read()).rejects.toThrow("wrong task");
  expect(f.deps.environments).not.toHaveBeenCalled();
});

it("keeps a mid-read subject change as a subject blocker only", async () => {
  const f = fixture();
  f.deps.subject.mockResolvedValue({ ...f.environment.self_subject_binding, subject_binding_id: "subject:replacement" });
  const result = await f.read();
  expect(result.blockers.map(check => check.layer)).toEqual(["subject"]);
  expect(result.blockers[0].reason_codes).toContain("session_subject_changed_during_read");
});
