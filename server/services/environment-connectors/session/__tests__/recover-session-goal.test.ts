import { expect, it, vi } from "vitest";
import { recoverEnvironmentSessionGoal } from "../recover-session-goal";
import type { EnvironmentSessionReadinessInput } from "../session-readiness";

function fixture(reason = "fabric_restart") {
  const identity = { owner_profile_id: "profile:a", room_id: "room:a", run_id: "run:a",
    environment_binding_id: "environment:a", source_id: "source:a", world_id: "world:a",
    subject_binding_id: "subject:a", subject_native_id: "player:a", producer_epoch_ref: "epoch:old",
    goal_owner_participant_id: "participant:a", authority_participant_id: "participant:a" };
  let goal: any = { goal_id: "goal:a", revision: 2, identity, status: "recovery_required",
    recovery: { required: true, reason, rebound_event_id: null }, latest_checkpoint: null };
  const input = { context: { profileId: "profile:a", roomId: "room:a", participantId: "participant:a",
    runId: "run:a", goalId: "goal:a", expectedRevision: 2, probeRequestId: "probe:a", priorTurnId: "turn:prior", turnId: "turn:a" },
    binding: { profileRef: "profile:a", runId: "run:a" }, environmentBindingId: "environment:a",
    sourceId: "source:a", worldId: "world:a", subjectBindingId: "subject:a", actionAuthorityId: "authority:a" } as EnvironmentSessionReadinessInput;
  const dependencies = {
    goals: {
      inspect: vi.fn().mockImplementation(async () => goal),
      resolveTemporalAdmissionContext: vi.fn().mockResolvedValue({}),
      append: vi.fn().mockImplementation(async (request: any) => {
        expect(request.expectedRevision).toBe(goal.revision);
        goal = { ...goal, revision: goal.revision + 1 };
        if (request.payload.kind === "authority_rebound") goal.recovery = { ...goal.recovery, rebound_event_id: "event:rebound" };
        if (request.payload.kind === "checkpoint_verified") goal.latest_checkpoint = request.payload;
        if (request.payload.kind === "goal_resumed") goal = { ...goal, status: "active", recovery: { required: false } };
        return goal;
      }),
    },
    database: vi.fn().mockResolvedValue({}),
    identity: vi.fn().mockResolvedValue({ ...identity, producer_epoch_ref: "epoch:new" }),
    perception: vi.fn().mockResolvedValue({ evidence: { observation: {
      evidence_ref: "evidence:a", observation_revision: 10, result: { observation_revision: 3 },
    } } }),
  };
  const binding = { verifyTaskAssociation: vi.fn() };
  return { dependencies, binding, input, run: () => recoverEnvironmentSessionGoal(input, binding, dependencies) };
}

it("performs three revision-checked steps once, then becomes a no-op", async () => {
  const f = fixture();
  expect(await f.run()).toMatchObject({ changed: true, goal: { status: "active" }, execution_authority: false });
  await f.run(); await f.run();
  expect(f.dependencies.goals.append.mock.calls.map(([request]) => request.payload.kind))
    .toEqual(["authority_rebound", "checkpoint_verified", "goal_resumed"]);
  expect(f.dependencies.goals.append.mock.calls[1][0].payload).toMatchObject({
    milestone_id: null, completed_postcondition_ids: [], incomplete_postcondition_ids: [],
  });
  expect(f.dependencies.perception).toHaveBeenCalledTimes(4);
});

it.each(["manual_override", "emergency_stop", "authority_revoked", "death"])("does not auto-resume %s", async reason => {
  const f = fixture(reason);
  await expect(f.run()).rejects.toThrow("explicit operator intent");
  expect(f.dependencies.goals.append).not.toHaveBeenCalled();
});

it("does not append when evidence expires before the first write", async () => {
  const f = fixture();
  f.dependencies.perception.mockResolvedValueOnce({ evidence: { observation: { evidence_ref: "evidence:a", observation_revision: 10, result: { observation_revision: 3 } } } })
    .mockRejectedValueOnce(new Error("expired evidence"));
  await expect(f.run()).rejects.toThrow("expired evidence");
  expect(f.dependencies.goals.append).not.toHaveBeenCalled();
});

it("rejects a foreign run before reading the goal", async () => {
  const f = fixture();
  f.input.binding.runId = "run:other";
  await expect(f.run()).rejects.toThrow("exact existing task");
  expect(f.dependencies.goals.inspect).not.toHaveBeenCalled();
});

it("stops on binding revocation before the first append", async () => {
  const f = fixture();
  f.binding.verifyTaskAssociation.mockReturnValueOnce(undefined).mockImplementationOnce(() => { throw new Error("revoked"); });
  await expect(f.run()).rejects.toThrow("revoked");
  expect(f.dependencies.goals.append).not.toHaveBeenCalled();
});

it.each([null, "10", NaN, -1, 1.5])("rejects malformed observation revision %s", async revision => {
  const f = fixture();
  f.dependencies.perception.mockResolvedValue({ evidence: { observation: {
    evidence_ref: "evidence:a", observation_revision: revision, result: { observation_revision: 3 },
  } } });
  await expect(f.run()).rejects.toThrow("exact observation revision");
  expect(f.dependencies.goals.append).not.toHaveBeenCalled();
});
