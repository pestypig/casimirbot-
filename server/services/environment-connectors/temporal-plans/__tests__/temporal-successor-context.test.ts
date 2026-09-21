import { readFileSync } from "node:fs";
import { newDb } from "pg-mem";
import { afterEach, expect, it, vi } from "vitest";
import * as database from "../../../helix-ask/realtime-room/room-store/database";
import * as checkpoint from "../temporal-checkpoint-evidence";
import { TemporalPlanError } from "../temporal-plan-error";
import { readTemporalSuccessorContext } from "../temporal-successor-context";

afterEach(() => { vi.restoreAllMocks(); });
it("executes scoped lookup SQL against the local database column contract", async () => {
  const { Pool } = newDb().adapters.createPg();
  const db = new Pool();
  try {
    await db.query(`CREATE TABLE helix_environment_events (
      event_id text, event_payload jsonb, environment_binding_id text, producer_epoch_ref text,
      subject_ref text, producer_plane text, workflow_ref text, observed_at timestamptz, sequence integer);
      CREATE TABLE helix_environment_action_requests(action_request_id text, run_id text, workflow_id text);
      CREATE TABLE helix_environment_temporal_plan_admissions(source_plan jsonb, compilation_artifact jsonb,
        action_request_id text, resident_action_request_id text, goal_id text, admitted_at timestamptz);`);
    await db.query(`INSERT INTO helix_environment_events VALUES ('event', $1, 'env', 'epoch', 'subject',
      'player_embodiment', 'workflow', now(), 1)`, [JSON.stringify({ source_id: "source", room_id: "room", world_id: "world",
        workflow_ref: "workflow", attributes: { workflow_measurements: { sequence_id: "sequence" } } })]);
    const query = vi.spyOn(db, "query");
    vi.spyOn(database, "readSharedRealtimeRoomDatabase").mockResolvedValue(db as any);
    const result = await readTemporalSuccessorContext({ goal: { goal_id: "goal", identity: { run_id: "run",
      environment_binding_id: "env", producer_epoch_ref: "epoch", source_id: "source", subject_binding_id: "subject",
      room_id: "room", world_id: "world" } } } as any);
    expect(result.available).toBe(false);
    expect(query).toHaveBeenCalledTimes(2);
    for (const call of query.mock.results) expect(await call.value).toHaveProperty("rows");
  } finally { await db.end(); }
});
it.each(["valid", "no_event", "no_plan", "wrong_authority", "unverified", "unexpected_verifier_failure", "older_perception", "newer_progress_same_checkpoint", "invalid_time", "invalid_tick", "no_checkpoint"])(
  "publishes only a scoped verified successor locator (%s)", async scenario => {
    const fixture = JSON.parse(readFileSync("minecraft/helix-fabric-player-agent/src/test/resources/compiled-rolling-walk.json", "utf8"));
    const p = fixture.source;
    const event = { workflow_ref: "workflow:test", attributes: { workflow_measurements: {
      sequence_id: fixture.artifact.arguments.sequence_id,
      checkpoint_settlements: scenario === "no_checkpoint" ? [] : [{ checkpoint_id: "checkpoint:compiled-walk" }],
    } } };
    const query = vi.fn().mockResolvedValueOnce({ rows: scenario === "no_event" ? [] : [{ event_id: "event:test", event_payload: event }] })
      .mockResolvedValueOnce({ rows: scenario === "no_plan" ? [] : [{ source_plan: p,
        compilation_artifact: fixture.artifact, action_request_id: "action:test" }] });
    vi.spyOn(database, "readSharedRealtimeRoomDatabase").mockResolvedValue({ query } as any);
    const verify = vi.spyOn(checkpoint, "readTemporalCheckpointEvidence");
    if (scenario === "unverified") verify.mockRejectedValue(new TemporalPlanError("temporal_checkpoint_event_hash_mismatch"));
    else if (scenario === "unexpected_verifier_failure") verify.mockRejectedValue(new Error("private diagnostic must not escape"));
    else verify.mockResolvedValue({ event_id: "event:test", checkpoint_id: "checkpoint:compiled-walk",
      workflow_id: "workflow:test", observed_at: scenario === "newer_progress_same_checkpoint"
        ? "2026-09-06T00:00:02Z" : "2026-09-06T00:00:00Z", world_tick_index: 100,
      checkpoint_anchor: { observed_at: "2026-09-06T00:00:00Z", world_tick_index: 100, event_id: "event:anchor" } } as any);
    const result = await readTemporalSuccessorContext({ goal: { goal_id: p.identity.goal_id,
      goal_revision: p.identity.goal_revision, identity: { run_id: "run:test", room_id: "room:test", world_id: "world:test",
        environment_binding_id: p.identity.environment_id, producer_epoch_ref: p.identity.producer_epoch,
        source_id: p.identity.source_id, subject_binding_id: p.identity.subject_id,
        action_authority_id: scenario === "wrong_authority" ? "other" : p.identity.authority_id,
        authority_policy_version: p.identity.authority_revision } },
      evidence: { observation: { observed_at: scenario === "invalid_time" ? "invalid"
        : scenario === "older_perception" ? "2026-09-05T00:00:00Z" : "2026-09-06T00:00:01Z",
        result: { game_tick: scenario === "invalid_tick" ? "invalid" : 101 } } } } as any);
    expect(result.available).toBe(["valid", "newer_progress_same_checkpoint"].includes(scenario));
    expect(result.execution_authority).toBe(false);
    expect(result.terminal_eligible).toBe(false);
    const absentDiagnostics: Record<string, string> = {
      no_event: "no_recent_player_workflow_event",
      no_plan: "no_matching_temporal_admission",
      wrong_authority: "temporal_plan_identity_mismatch",
      unverified: "temporal_checkpoint_event_hash_mismatch",
      unexpected_verifier_failure: "checkpoint_verification_unclassified",
      no_checkpoint: "recent_workflow_has_no_source_checkpoint",
    };
    if (absentDiagnostics[scenario]) {
      expect(result).toMatchObject({ reason_code: "no_current_verified_checkpoint",
        diagnostic_code: absentDiagnostics[scenario] });
    }
    if (scenario === "unexpected_verifier_failure") {
      expect(JSON.stringify(result)).not.toContain("private diagnostic");
    }
    if (scenario === "older_perception") {
      expect(result).toMatchObject({ reason_code: "perception_precedes_verified_checkpoint" });
      expect(verify).toHaveBeenCalled();
    }
    if (["invalid_time", "invalid_tick"].includes(scenario)) {
      expect(result).toMatchObject({ reason_code: "checkpoint_perception_clock_invalid",
        diagnostic_code: "checkpoint_perception_clock_invalid" });
    }
    if (scenario === "valid") {
      expect(result).toMatchObject({ previous_plan_id: p.plan_id, previous_plan_hash: p.plan_hash,
        checkpoint: { event_id: "event:test", checkpoint_id: "checkpoint:compiled-walk" }, revalidation_required: true });
      expect(verify).toHaveBeenCalledWith({ query }, expect.objectContaining({ runId: "run:test", actionRequestId: "action:test" }));
      expect(Object.keys(result)).not.toContain("source_plan");
      expect(query.mock.calls[0][1]).toEqual([p.identity.environment_id, p.identity.producer_epoch,
        p.identity.source_id, p.identity.subject_id, "room:test", "world:test"]);
      expect(query.mock.calls[1][1]).toEqual([p.identity.goal_id, "run:test", "workflow:test", fixture.artifact.arguments.sequence_id]);
    }
    if (["wrong_authority", "no_event", "no_plan", "no_checkpoint"].includes(scenario)) expect(verify).not.toHaveBeenCalled();
  },
);
