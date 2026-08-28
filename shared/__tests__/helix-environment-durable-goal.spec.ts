import { describe, expect, it } from "vitest";
import {
  buildHelixEnvironmentDurableGoalEvent,
  helixEnvironmentDurableGoalObjectiveSchema,
  reduceHelixEnvironmentDurableGoalEvents,
  type HelixEnvironmentDurableGoalEvent,
  type HelixEnvironmentDurableGoalEventPayload,
  type HelixEnvironmentDurableGoalIdentity,
} from "../helix-environment-durable-goal";

const identity = (overrides: Partial<HelixEnvironmentDurableGoalIdentity> = {}): HelixEnvironmentDurableGoalIdentity => ({
  owner_profile_id: "profile:owner",
  host_ref: "environment_device:device-one",
  connector_installation_id: "installation:one",
  device_id: "device:one",
  environment_binding_id: "environment:one",
  room_source_binding_id: "source-binding:one",
  room_id: "room:one",
  goal_owner_participant_id: "participant:one",
  participant_id: "participant:one",
  authority_participant_id: "participant:one",
  subject_binding_id: "subject:one",
  subject_native_id: "player:one",
  source_id: "source:one",
  world_id: "minecraft:overworld",
  producer_epoch_ref: "epoch:one",
  action_authority_id: "authority:one",
  authority_policy_version: 1,
  authority_expires_at: "2026-08-23T00:00:00.000Z",
  run_id: "run:one",
  turn_id: "turn:one",
  ...overrides,
});

const objective = {
  objective_text: "Earn the test advancement while remaining in survival.",
  goal_kind: "custom_survival" as const,
  domain: "minecraft" as const,
  game_version: "1.21.8",
  mechanics_collection_ref: "mechanics:minecraft-1.21.8",
  milestones: [{
    milestone_id: "milestone:test-advancement",
    description: "Earn the test advancement.",
    dependency_milestone_ids: [],
    required_postcondition_ids: ["postcondition:advancement-earned", "postcondition:player-viable"],
  }],
};

const append = (
  events: HelixEnvironmentDurableGoalEvent[],
  payload: HelixEnvironmentDurableGoalEventPayload,
  evidenceRefs: string[] = [],
  identityValue = identity({ turn_id: `turn:${events.length + 1}` }),
): HelixEnvironmentDurableGoalEvent[] => {
  const previous = events.at(-1) ?? null;
  return [...events, buildHelixEnvironmentDurableGoalEvent({
    event_id: `goal-event:${events.length + 1}`,
    goal_id: "durable-goal:one",
    sequence: events.length + 1,
    previous_event_hash: previous?.event_hash ?? null,
    identity: identityValue,
    payload,
    evidence_refs: evidenceRefs,
    occurred_at: `2026-08-22T12:${String(events.length).padStart(2, "0")}:00.000Z`,
  })];
};

const genesis = (): HelixEnvironmentDurableGoalEvent[] => append([], {
  kind: "goal_created",
  objective,
});

describe("Helix environment durable goal reducer", () => {
  it("admits a brokerage-native monitor-only objective without Minecraft fields", () => {
    const parsed = helixEnvironmentDurableGoalObjectiveSchema.parse({
      objective_text: "Prove the read-only Robinhood paper observer lifecycle.",
      goal_kind: "robinhood_shadow_observation",
      domain: "brokerage",
      provider: "robinhood",
      controller_profile_id: "resident.brokerage.market_observer.v1",
      reaction_requirement: "monitor_only",
      milestones: [{
        milestone_id: "brokerage_observer:identity_bound",
        description: "Bind the exact profile-owned observer identity.",
        dependency_milestone_ids: [],
        required_postcondition_ids: ["brokerage_observer:identity_verified"],
      }],
    });
    expect(parsed.domain).toBe("brokerage");
    expect(parsed).not.toHaveProperty("game_version");
    expect(parsed).not.toHaveProperty("mechanics_collection_ref");
  });

  it("retains failed attempts while later verified evidence completes the same milestone", () => {
    let events = genesis();
    events = append(events, {
      kind: "milestone_activated",
      milestone_id: "milestone:test-advancement",
      rationale: "This is the next dependency-free milestone.",
    });
    events = append(events, {
      kind: "attempt_started",
      attempt_id: "attempt:one",
      milestone_id: "milestone:test-advancement",
      plan_summary: "Try the admitted interaction.",
      capability_ids: ["com.casimirbot.minecraft.player.interact"],
    });
    events = append(events, {
      kind: "attempt_settled",
      attempt_id: "attempt:one",
      milestone_id: "milestone:test-advancement",
      outcome: "failed",
      postconditions: [],
      failure_code: "target_unavailable",
    }, ["action-result:failed-one"]);
    events = append(events, {
      kind: "attempt_started",
      attempt_id: "attempt:two",
      milestone_id: "milestone:test-advancement",
      plan_summary: "Retry after a fresh target observation.",
      capability_ids: ["com.casimirbot.minecraft.player.interact"],
    });
    events = append(events, {
      kind: "attempt_settled",
      attempt_id: "attempt:two",
      milestone_id: "milestone:test-advancement",
      outcome: "succeeded",
      postconditions: [
        { postcondition_id: "postcondition:advancement-earned", status: "satisfied", evidence_refs: ["environment-event:advancement"] },
        { postcondition_id: "postcondition:player-viable", status: "satisfied", evidence_refs: ["digest:viable"] },
      ],
      failure_code: null,
    }, ["action-result:succeeded-two", "environment-event:advancement", "digest:viable"]);
    events = append(events, {
      kind: "checkpoint_verified",
      checkpoint_id: "checkpoint:one",
      milestone_id: "milestone:test-advancement",
      observation_revision: 19,
      verified_facts: { advancement: "test", health: 20 },
      completed_postcondition_ids: ["postcondition:advancement-earned", "postcondition:player-viable"],
      incomplete_postcondition_ids: [],
      checkpoint_evidence_hash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    }, ["environment-event:advancement", "digest:viable"]);
    events = append(events, {
      kind: "milestone_completed",
      milestone_id: "milestone:test-advancement",
      completed_postcondition_ids: ["postcondition:advancement-earned", "postcondition:player-viable"],
    }, ["goal-event:7"]);

    const projection = reduceHelixEnvironmentDurableGoalEvents(events);
    expect(projection.milestones[0]?.status).toBe("completed");
    expect(projection.attempt_count).toBe(2);
    expect(projection.recent_attempts.map((entry) => entry.status)).toEqual(["failed", "succeeded"]);
    expect(projection.latest_checkpoint?.checkpoint_id).toBe("checkpoint:one");
    expect(projection.assistant_answer).toBe(false);
    expect(projection.terminal_eligible).toBe(false);
  });

  it("requires recovery, a fresh rebound, and a verified checkpoint before resuming after an epoch change", () => {
    let events = genesis();
    events = append(events, {
      kind: "checkpoint_verified",
      checkpoint_id: "checkpoint:pre-restart",
      milestone_id: null,
      observation_revision: 4,
      verified_facts: { health: 20, dimension: "minecraft:overworld" },
      completed_postcondition_ids: [],
      incomplete_postcondition_ids: ["postcondition:advancement-earned"],
      checkpoint_evidence_hash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    }, ["digest:pre-restart"]);
    events = append(events, {
      kind: "recovery_required",
      reason: "fabric_restart",
      last_recoverable_checkpoint_id: "checkpoint:pre-restart",
    });
    const reboundIdentity = identity({
      connector_installation_id: "installation:two",
      device_id: "device:two",
      environment_binding_id: "environment:two",
      subject_binding_id: "subject:two",
      producer_epoch_ref: "epoch:two",
      action_authority_id: "authority:two",
      authority_policy_version: 2,
      turn_id: "turn:four",
    });
    events = append(events, {
      kind: "authority_rebound",
      superseded_producer_epoch_ref: "epoch:one",
      fresh_observation_revision: 1,
    }, ["digest:post-restart"], reboundIdentity);
    events = append(events, {
      kind: "checkpoint_verified",
      checkpoint_id: "checkpoint:post-restart",
      milestone_id: null,
      observation_revision: 5,
      verified_facts: { health: 20, dimension: "minecraft:overworld" },
      completed_postcondition_ids: [],
      incomplete_postcondition_ids: ["postcondition:advancement-earned"],
      checkpoint_evidence_hash: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    }, ["digest:post-restart"], { ...reboundIdentity, turn_id: "turn:five" });
    events = append(events, {
      kind: "goal_resumed",
      recovery_checkpoint_id: "checkpoint:post-restart",
    }, ["goal-event:five"], { ...reboundIdentity, turn_id: "turn:six" });

    const projection = reduceHelixEnvironmentDurableGoalEvents(events);
    expect(projection.status).toBe("active");
    expect(projection.identity.producer_epoch_ref).toBe("epoch:two");
    expect(projection.identity.environment_binding_id).toBe("environment:two");
    expect(projection.identity.subject_binding_id).toBe("subject:two");
    expect(projection.recovery.required).toBe(false);
    expect(projection.recovery.rebound_event_id).toBe("goal-event:4");
  });

  it("rejects a poisoned event hash and progress on a changed player identity", () => {
    const events = genesis();
    const poisoned = structuredClone(events);
    poisoned[0]!.identity.world_id = "minecraft:the_nether";
    expect(() => reduceHelixEnvironmentDurableGoalEvents(poisoned)).toThrow(/content hash/i);

    const changedPlayer = append(events, {
      kind: "strategy_revised",
      strategy_summary: "Continue.",
      candidate_milestone_ids: ["milestone:test-advancement"],
      supersedes_strategy_event_id: null,
    }, [], identity({ subject_native_id: "player:other", turn_id: "turn:two" }));
    expect(() => reduceHelixEnvironmentDurableGoalEvents(changedPlayer)).toThrow(/stable goal identity/i);
  });

  it("keeps G4 mail evidence nonterminal while retaining its exact refs", () => {
    let events = genesis();
    events = append(events, {
      kind: "semantic_wake_consumed",
      mail_refs: ["stage_play_live_source_mail:one"],
      digest_refs: ["environment_situation_digest:one"],
      observation_revision: 8,
      material_change_summary: "An advancement event changed the next milestone evidence.",
    }, ["stage_play_live_source_mail:one", "environment_situation_digest:one"]);
    const projection = reduceHelixEnvironmentDurableGoalEvents(events);
    expect(projection.consumed_semantic_wake_refs).toEqual([
      "stage_play_live_source_mail:one",
      "environment_situation_digest:one",
    ]);
    expect(projection.content_role).toContain("not_assistant_answer");
  });

  it("rejects duplicate or substituted semantic-wake consumption", () => {
    let events = genesis();
    events = append(events, {
      kind: "semantic_wake_consumed",
      mail_refs: ["stage_play_live_source_mail:one"],
      digest_refs: ["environment_situation_digest:one"],
      observation_revision: 8,
      material_change_summary: "The environment changed.",
    }, ["stage_play_live_source_mail:one", "environment_situation_digest:substituted"]);
    expect(() => reduceHelixEnvironmentDurableGoalEvents(events)).toThrow(/exact, previously unconsumed/i);

    let duplicated = genesis();
    const payload: HelixEnvironmentDurableGoalEventPayload = {
      kind: "semantic_wake_consumed",
      mail_refs: ["stage_play_live_source_mail:one"],
      digest_refs: ["environment_situation_digest:one"],
      observation_revision: 8,
      material_change_summary: "The environment changed.",
    };
    duplicated = append(duplicated, payload, ["stage_play_live_source_mail:one", "environment_situation_digest:one"]);
    duplicated = append(duplicated, payload, ["stage_play_live_source_mail:one", "environment_situation_digest:one"]);
    expect(() => reduceHelixEnvironmentDurableGoalEvents(duplicated)).toThrow(/previously unconsumed/i);
  });

  it("does not let milestone completion invent postconditions absent from a verified checkpoint", () => {
    let events = genesis();
    events = append(events, {
      kind: "milestone_activated",
      milestone_id: "milestone:test-advancement",
      rationale: "Start the milestone.",
    });
    events = append(events, {
      kind: "milestone_completed",
      milestone_id: "milestone:test-advancement",
      completed_postcondition_ids: ["postcondition:advancement-earned", "postcondition:player-viable"],
    }, ["environment-event:unrelated"]);
    expect(() => reduceHelixEnvironmentDurableGoalEvents(events)).toThrow(/verified evidence/i);
  });
});
