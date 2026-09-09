import { afterEach, expect, it, vi } from "vitest";
import * as preflightModule from "../temporal-plan-preflight";
import * as broker from "../../actions/action-broker";
import { admitTemporalPlan } from "../temporal-plan-admission";

afterEach(() => { vi.restoreAllMocks(); });

it("awaits asynchronous task rejection before calling the action broker", async () => {
  vi.spyOn(preflightModule, "preflightTemporalPlan").mockResolvedValue({ plan: {}, compilation: { arguments: {} } } as never);
  const enqueue = vi.spyOn(broker, "enqueueEnvironmentAction");
  const verifyTaskAssociation = vi.fn().mockRejectedValue(new Error("pairing_revoked"));
  await expect(admitTemporalPlan(input() as never, { verifyTaskAssociation })).rejects.toThrow("pairing_revoked");
  expect(enqueue).not.toHaveBeenCalled();
});
const input = () => ({ preflight: { context: { profileId: "owner", participantId: "player" },
  binding: { runId: "run", bindingId: "binding", bindingEpoch: 1, clientContinuationRef: "exact-task" },
  compilation: { target: "serial" } }, request: { run_id: "run", participant_id: "player", action_kind: "execute_sequence" } });

it("hands compiler output and retained identity to the existing broker with live task revalidation", async () => {
  const prepared = { plan: { plan_id: "plan" }, compilation: { arguments: { sequence_id: "compiled" } } };
  vi.spyOn(preflightModule, "preflightTemporalPlan").mockResolvedValue(prepared as never);
  const enqueue = vi.spyOn(broker, "enqueueEnvironmentAction").mockResolvedValue({ action_request_id: "admitted" } as never);
  const store = { verifyTaskAssociation: vi.fn() };
  expect(await admitTemporalPlan(input() as never, store as never)).toEqual({ action_request_id: "admitted" });
  expect(enqueue.mock.calls[0][0]).toMatchObject({ profileId: "owner", requestingParticipantId: "player",
    request: { arguments: prepared.compilation.arguments, temporal_plan: prepared.plan } });
  const retention = enqueue.mock.calls[0][1]!;
  expect(retention.retention).toMatchObject({ bindingId: "binding", bindingEpoch: 1, continuationRef: "exact-task", runId: "run" });
  store.verifyTaskAssociation.mockImplementation(() => { throw new Error("revoked"); });
  await expect(retention.revalidateTask()).rejects.toThrow("revoked");
});

it.each(["run_id", "participant_id", "action_kind"])("rejects mismatched %s before preflight", async key => {
  const value = input();
  (value.request as Record<string, string>)[key] = "wrong";
  const preflight = vi.spyOn(preflightModule, "preflightTemporalPlan");
  const enqueue = vi.spyOn(broker, "enqueueEnvironmentAction");
  await expect(admitTemporalPlan(value as never, { verifyTaskAssociation: vi.fn() } as never)).rejects.toThrow("temporal_admission_request_context_mismatch");
  expect(preflight).not.toHaveBeenCalled();
  expect(enqueue).not.toHaveBeenCalled();
});

it("does not enqueue after failed preflight", async () => {
  vi.spyOn(preflightModule, "preflightTemporalPlan").mockRejectedValue(new Error("stale"));
  const enqueue = vi.spyOn(broker, "enqueueEnvironmentAction");
  await expect(admitTemporalPlan(input() as never, { verifyTaskAssociation: vi.fn() } as never)).rejects.toThrow("stale");
  expect(enqueue).not.toHaveBeenCalled();
});
