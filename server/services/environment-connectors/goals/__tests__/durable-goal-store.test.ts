import { newDb } from "pg-mem";
import { describe, expect, it } from "vitest";
import type { Queryable } from "../../../helix-ask/realtime-room/room-store/types";
import { migration059 } from "../../../../db/migrations/059_environment_durable_goals";
import { helixEnvironmentDurableGoalSha256 } from "@shared/helix-environment-durable-goal";
import {
  EnvironmentDurableGoalStore,
  resolveCurrentEnvironmentDurableGoalIdentity,
  resolveEnvironmentDurableGoalEvidence,
  type EnvironmentDurableGoalEvidenceResolution,
} from "../durable-goal-store";

const identity = {
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
  authority_expires_at: "2026-08-24T00:00:00.000Z",
  run_id: "run:one",
  turn_id: "turn:one",
} as const;

const objective = {
  objective_text: "Earn one advancement and remain viable.",
  goal_kind: "custom_survival" as const,
  domain: "minecraft" as const,
  game_version: "1.21.8",
  mechanics_collection_ref: null,
  milestones: [{
    milestone_id: "milestone:one",
    description: "Earn one advancement.",
    dependency_milestone_ids: [],
    required_postcondition_ids: ["postcondition:advancement", "postcondition:viable"],
  }],
};

const checkpointHash = (
  facts: Record<string, unknown>,
  refs: string[],
  observationRevision = 1,
  completedPostconditionIds: string[] = [],
  incompletePostconditionIds: string[] = ["postcondition:advancement"],
) =>
  helixEnvironmentDurableGoalSha256({
    evidence_refs: refs,
    observation_revision: observationRevision,
    verified_facts: facts,
    completed_postcondition_ids: completedPostconditionIds,
    incomplete_postcondition_ids: incompletePostconditionIds,
  });

const createHarness = async () => {
  const memory = newDb();
  const adapter = memory.adapters.createPg();
  const pool = new adapter.Pool();
  const client = await pool.connect();
  await client.query(`
    CREATE TABLE helix_accounts (profile_id text PRIMARY KEY);
    CREATE TABLE helix_environment_connector_installations (installation_id text PRIMARY KEY);
    CREATE TABLE helix_environment_connector_devices (device_id text PRIMARY KEY);
    CREATE TABLE helix_environment_connector_bindings (environment_binding_id text PRIMARY KEY);
    CREATE TABLE helix_room_source_bindings (binding_id text PRIMARY KEY);
    CREATE TABLE helix_shared_realtime_rooms (room_id text PRIMARY KEY);
    CREATE TABLE helix_shared_realtime_room_members (
      participant_id text PRIMARY KEY,
      room_id text NOT NULL,
      profile_id text NOT NULL,
      presence text NOT NULL
    );
    CREATE TABLE helix_room_environment_subject_bindings (subject_binding_id text PRIMARY KEY);
    INSERT INTO helix_accounts VALUES ('profile:owner'), ('profile:two');
    INSERT INTO helix_environment_connector_installations VALUES ('installation:one'), ('installation:two');
    INSERT INTO helix_environment_connector_devices VALUES ('device:one'), ('device:two');
    INSERT INTO helix_environment_connector_bindings VALUES ('environment:one'), ('environment:two');
    INSERT INTO helix_room_source_bindings VALUES ('source-binding:one');
    INSERT INTO helix_shared_realtime_rooms VALUES ('room:one');
    INSERT INTO helix_shared_realtime_room_members VALUES
      ('participant:one', 'room:one', 'profile:owner', 'active'),
      ('participant:two', 'room:one', 'profile:two', 'active');
    INSERT INTO helix_room_environment_subject_bindings VALUES ('subject:one'), ('subject:two');
  `);
  await migration059.run(client, { enablePgvector: false });
  client.release();
  const transaction = async <T>(handler: (db: Queryable) => Promise<T>): Promise<T> => {
    const connection = await pool.connect();
    try {
      await connection.query("BEGIN");
      const result = await handler(connection as Queryable);
      await connection.query("COMMIT");
      return result;
    } catch (error) {
      await connection.query("ROLLBACK");
      throw error;
    } finally {
      connection.release();
    }
  };
  const read = async (): Promise<Queryable> => pool as unknown as Queryable;
  const evidence = new Map<string, EnvironmentDurableGoalEvidenceResolution>([
    ["probe:world-plane", { ref: "probe:world-plane", found: true, producerPlane: "world_authority", roomId: "room:one", sourceId: "source:one", worldId: "minecraft:overworld", producerEpochRef: "world-epoch:two", subjectNativeId: "player:one", observationRevision: 4 }],
    ["digest:one", { ref: "digest:one", found: true, roomId: "room:one", sourceId: "source:one", worldId: "minecraft:overworld", producerEpochRef: "epoch:one", subjectNativeId: "player:one", observationRevision: 1 }],
    ["digest:two", { ref: "digest:two", found: true, roomId: "room:one", sourceId: "source:one", worldId: "minecraft:overworld", producerEpochRef: "epoch:two", subjectNativeId: "player:one", observationRevision: 2 }],
    ["digest:three", { ref: "digest:three", found: true, roomId: "room:one", sourceId: "source:one", worldId: "minecraft:overworld", producerEpochRef: "epoch:one", subjectNativeId: "player:one", observationRevision: 2 }],
    ["mail:one", { ref: "mail:one", found: true, roomId: "room:one", sourceId: "source:one", worldId: "minecraft:overworld", producerEpochRef: "epoch:one", subjectNativeId: "player:one", observationRevision: 1 }],
    ["mail:two", { ref: "mail:two", found: true, roomId: "room:one", sourceId: "source:one", worldId: "minecraft:overworld", producerEpochRef: "epoch:one", subjectNativeId: "player:one", observationRevision: 2 }],
    ["event:death", { ref: "event:death", found: true, roomId: "room:one", sourceId: "source:one", worldId: "minecraft:overworld", producerEpochRef: "epoch:one", subjectNativeId: "player:one", observationRevision: 3 }],
    ["digest:wrong", { ref: "digest:wrong", found: true, roomId: "room:other", sourceId: "source:one", worldId: "minecraft:overworld", producerEpochRef: "epoch:one", subjectNativeId: "player:one", observationRevision: 1 }],
  ]);
  let currentIdentity = { ...identity };
  let identityAvailable = true;
  const makeStore = () => new EnvironmentDurableGoalStore(
    transaction,
    async (_db, request) => {
      if (!identityAvailable) throw new Error("identity unavailable");
      return { ...currentIdentity, participant_id: request.participantId, run_id: request.runId, turn_id: request.turnId };
    },
    async (_db, refs) => refs.map((ref) => evidence.get(ref) ?? { ref, found: false, roomId: null, sourceId: null, worldId: null, producerEpochRef: null, subjectNativeId: null, observationRevision: null }),
    read,
  );
  return {
    pool,
    makeStore,
    setIdentityAvailable: (value: boolean) => { identityAvailable = value; },
    setCurrentIdentity: (value: typeof currentIdentity) => { currentIdentity = value; },
  };
};

describe("EnvironmentDurableGoalStore", () => {
  it("resolves a public subject reference to the server-owned native identity", async () => {
    const memory = newDb();
    const { Pool } = memory.adapters.createPg();
    const pool = new Pool();
    try {
      await pool.query(`
        CREATE TABLE helix_environment_connector_bindings (
          environment_binding_id text PRIMARY KEY, owner_profile_id text,
          installation_id text, device_id text, room_source_binding_id text,
          room_id text, source_id text, world_id text, status text
        );
        CREATE TABLE helix_room_environment_subject_bindings (
          subject_binding_id text PRIMARY KEY, environment_binding_id text,
          participant_id text, subject_native_id text, subject_ref text,
          status text, updated_at timestamptz
        );
        CREATE TABLE helix_environment_action_authorities (
          action_authority_id text PRIMARY KEY, environment_binding_id text,
          participant_id text, subject_binding_id text, status text,
          policy_version integer, expires_at timestamptz
        );
        CREATE TABLE helix_environment_action_connector_manifests (
          manifest_id text PRIMARY KEY, action_authority_id text,
          producer_epoch_ref text, status text, received_at timestamptz,
          expires_at timestamptz
        );
        INSERT INTO helix_environment_connector_bindings VALUES
          ('environment:one', 'profile:owner', 'installation:one', 'device:one',
           'source-binding:one', 'room:one', 'source:one', 'world:one', 'active');
        INSERT INTO helix_room_environment_subject_bindings VALUES
          ('subject:one', 'environment:one', 'participant:one', 'native:private',
           'environment_subject_binding:public', 'active', now());
        INSERT INTO helix_environment_action_authorities VALUES
          ('authority:one', 'environment:one', 'participant:one', 'subject:one',
           'active', 7, '2099-01-01T00:00:00.000Z');
        INSERT INTO helix_environment_action_connector_manifests VALUES
          ('manifest:one', 'authority:one', 'epoch:one', 'active', now(), NULL);
      `);
      await expect(resolveCurrentEnvironmentDurableGoalIdentity(
        pool as unknown as Queryable,
        {
          ownerProfileId: "profile:owner",
          roomId: "room:one",
          participantId: "participant:one",
          environmentBindingId: "environment:one",
          subjectNativeId: "environment_subject_binding:public",
          actionAuthorityId: "authority:one",
          runId: "run:one",
          turnId: "turn:one",
        },
      )).resolves.toMatchObject({
        subject_binding_id: "subject:one",
        subject_native_id: "native:private",
        action_authority_id: "authority:one",
        producer_epoch_ref: "epoch:one",
      });
    } finally {
      await pool.end();
    }
  });

  it("resolves a complete digest evidence set without touching unrelated legacy action-result tables", async () => {
    const memory = newDb();
    const { Pool } = memory.adapters.createPg();
    const pool = new Pool();
    try {
      await pool.query(`
        CREATE TABLE helix_environment_event_batches (
          batch_id text PRIMARY KEY, room_id text, source_id text, world_id text
        );
        CREATE TABLE helix_environment_events (
          event_id text PRIMARY KEY, batch_id text, producer_epoch_ref text,
          subject_ref text, sequence integer
        );
        CREATE TABLE helix_environment_connector_bindings (
          environment_binding_id text PRIMARY KEY, room_id text,
          source_id text, world_id text
        );
        CREATE TABLE helix_room_environment_subject_bindings (
          subject_binding_id text PRIMARY KEY, subject_native_id text
        );
        CREATE TABLE helix_environment_situation_digests (
          digest_id text PRIMARY KEY, environment_binding_id text,
          producer_epoch_ref text, subject_ref text,
          latest_event_sequence integer
        );
        CREATE TABLE helix_environment_action_results (
          legacy_result_id text PRIMARY KEY
        );
        INSERT INTO helix_environment_connector_bindings VALUES
          ('environment:successor', 'room:one', 'source:one', 'minecraft:overworld');
        INSERT INTO helix_room_environment_subject_bindings VALUES
          ('subject:successor', 'player:one');
        INSERT INTO helix_environment_situation_digests VALUES
          ('digest:successor', 'environment:successor', 'epoch:two',
           'subject:successor', 7);
      `);
      await expect(resolveEnvironmentDurableGoalEvidence(
        pool as unknown as Queryable,
        ["digest:successor"],
      )).resolves.toEqual([{
        ref: "digest:successor",
        found: true,
        producerPlane: "world_authority",
        roomId: "room:one",
        sourceId: "source:one",
        worldId: "minecraft:overworld",
        producerEpochRef: "epoch:two",
        subjectNativeId: "player:one",
        observationRevision: 7,
      }]);
    } finally {
      await pool.end();
    }
  });

  it("resolves the canonical action evidence hash returned by the action broker", async () => {
    const memory = newDb();
    const { Pool } = memory.adapters.createPg();
    const pool = new Pool();
    const resultHash = `sha256:${"a".repeat(64)}`;
    const evidenceRef = `environment_action_evidence:${resultHash.slice("sha256:".length, 48)}`;
    try {
      await pool.query(`
        CREATE TABLE helix_environment_event_batches (
          batch_id text PRIMARY KEY, room_id text, source_id text, world_id text
        );
        CREATE TABLE helix_environment_events (
          event_id text PRIMARY KEY, batch_id text, producer_epoch_ref text,
          subject_ref text, sequence integer
        );
        CREATE TABLE helix_environment_connector_bindings (
          environment_binding_id text PRIMARY KEY, room_id text,
          source_id text, world_id text
        );
        CREATE TABLE helix_room_environment_subject_bindings (
          subject_binding_id text PRIMARY KEY, subject_native_id text
        );
        CREATE TABLE helix_environment_situation_digests (
          digest_id text PRIMARY KEY, environment_binding_id text,
          producer_epoch_ref text, subject_ref text,
          latest_event_sequence integer
        );
        CREATE TABLE helix_environment_action_connector_manifests (
          manifest_id text PRIMARY KEY, producer_epoch_ref text
        );
        CREATE TABLE helix_environment_action_requests (
          action_request_id text PRIMARY KEY, room_id text, source_id text,
          world_id text, subject_native_id text, connector_manifest_id text
        );
        CREATE TABLE helix_environment_action_results (
          action_result_id text PRIMARY KEY, action_execution_id text,
          workflow_id text, action_request_id text, result_hash text
        );
        INSERT INTO helix_environment_action_connector_manifests VALUES
          ('manifest:one', 'epoch:current');
        INSERT INTO helix_environment_action_requests VALUES
          ('request:one', 'room:one', 'source:one', 'minecraft:overworld',
           'player:one', 'manifest:one');
        INSERT INTO helix_environment_action_results VALUES
          ('result:one', 'execution:one', 'workflow:one', 'request:one', '${resultHash}');
      `);
      await expect(resolveEnvironmentDurableGoalEvidence(
        pool as unknown as Queryable,
        [evidenceRef],
      )).resolves.toEqual([{
        ref: evidenceRef,
        found: true,
        producerPlane: "player_embodiment",
        roomId: "room:one",
        sourceId: "source:one",
        worldId: "minecraft:overworld",
        producerEpochRef: "epoch:current",
        subjectNativeId: "player:one",
        observationRevision: null,
      }]);
    } finally {
      await pool.end();
    }
  });

  it("admits exact world-authority evidence without conflating its epoch with the player-embodiment epoch", async () => {
    const harness = await createHarness();
    try {
      const store = harness.makeStore();
      const created = await store.create({
        ownerProfileId: "profile:owner", roomId: "room:one",
        participantId: "participant:one", environmentBindingId: "environment:one",
        subjectNativeId: "player:one", actionAuthorityId: "authority:one",
        runId: "run:one", turnId: "turn:create", objective,
      });
      const facts = { health: 20, alive: true };
      const checkpoint = await store.append({
        ownerProfileId: "profile:owner", roomId: "room:one",
        participantId: "participant:one", environmentBindingId: "environment:one",
        subjectNativeId: "player:one", actionAuthorityId: "authority:one",
        runId: "run:one", turnId: "turn:checkpoint", goalId: created.goal_id,
        expectedRevision: 1,
        payload: {
          kind: "checkpoint_verified", checkpoint_id: "checkpoint:world-plane",
          milestone_id: null, observation_revision: 4, verified_facts: facts,
          completed_postcondition_ids: [],
          incomplete_postcondition_ids: ["postcondition:advancement"],
          checkpoint_evidence_hash: checkpointHash(
            facts, ["probe:world-plane"], 4,
          ),
        },
        evidenceRefs: ["probe:world-plane"],
      });
      expect(checkpoint.latest_checkpoint?.observation_revision).toBe(4);
      expect(checkpoint.identity.producer_epoch_ref).toBe("epoch:one");
    } finally {
      await harness.pool.end();
    }
  });

  it("reconstructs the canonical projection from the database after a process-like store restart", async () => {
    const harness = await createHarness();
    try {
      const created = await harness.makeStore().create({
        ownerProfileId: "profile:owner", roomId: "room:one",
        participantId: "participant:one", environmentBindingId: "environment:one",
        subjectNativeId: "player:one", actionAuthorityId: "authority:one",
        runId: "run:one", turnId: "turn:one", objective,
      });
      await harness.makeStore().append({
        ownerProfileId: "profile:owner", roomId: "room:one",
        participantId: "participant:one", environmentBindingId: "environment:one",
        subjectNativeId: "player:one", actionAuthorityId: "authority:one",
        runId: "run:one", turnId: "turn:two", goalId: created.goal_id,
        expectedRevision: 1,
        payload: { kind: "checkpoint_verified", checkpoint_id: "checkpoint:one", milestone_id: null, observation_revision: 1, verified_facts: { health: 20 }, completed_postcondition_ids: [], incomplete_postcondition_ids: ["postcondition:advancement"], checkpoint_evidence_hash: checkpointHash({ health: 20 }, ["digest:one"]) },
        evidenceRefs: ["digest:one"],
      });
      const reconstructed = await harness.makeStore().inspect({ goalId: created.goal_id, profileId: "profile:owner", participantId: "participant:one" });
      expect(reconstructed.revision).toBe(2);
      expect(reconstructed.latest_checkpoint?.verified_facts).toEqual({ health: 20 });
      expect(reconstructed.event_refs).toHaveLength(2);
    } finally {
      await harness.pool.end();
    }
  });

  it("continues two evidence-backed milestones through semantic wakes and a process-like restart", async () => {
    const harness = await createHarness();
    const milestoneObjective = {
      ...objective,
      objective_text: "Prepare safely, then earn an advancement while remaining viable.",
      milestones: [
        {
          milestone_id: "milestone:prepare",
          description: "Confirm the player is viable.",
          dependency_milestone_ids: [],
          required_postcondition_ids: ["postcondition:viable"],
        },
        {
          milestone_id: "milestone:advance",
          description: "Earn an advancement while remaining viable.",
          dependency_milestone_ids: ["milestone:prepare"],
          required_postcondition_ids: ["postcondition:advancement", "postcondition:viable"],
        },
      ],
    };
    try {
      const store = harness.makeStore();
      let projection = await store.create({
        ownerProfileId: "profile:owner", roomId: "room:one",
        participantId: "participant:one", environmentBindingId: "environment:one",
        subjectNativeId: "player:one", actionAuthorityId: "authority:one",
        runId: "run:durable", turnId: "turn:create", objective: milestoneObjective,
      });
      projection = await store.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:durable", turnId: "turn:prepare-activate", goalId: projection.goal_id, expectedRevision: projection.revision, payload: { kind: "milestone_activated", milestone_id: "milestone:prepare", rationale: "Establish a viable starting checkpoint." } });
      projection = await store.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:durable", turnId: "turn:prepare-attempt", goalId: projection.goal_id, expectedRevision: projection.revision, payload: { kind: "attempt_started", attempt_id: "attempt:prepare", milestone_id: "milestone:prepare", plan_summary: "Read the current player state.", capability_ids: ["com.casimirbot.minecraft.actor.status.read"] } });
      projection = await store.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:durable", turnId: "turn:prepare-wake", goalId: projection.goal_id, expectedRevision: projection.revision, payload: { kind: "semantic_wake_consumed", mail_refs: ["mail:one"], digest_refs: ["digest:one"], observation_revision: 1, material_change_summary: "The player joined alive with full health." }, evidenceRefs: ["mail:one", "digest:one"] });
      projection = await store.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:durable", turnId: "turn:prepare-settle", goalId: projection.goal_id, expectedRevision: projection.revision, payload: { kind: "attempt_settled", attempt_id: "attempt:prepare", milestone_id: "milestone:prepare", outcome: "succeeded", postconditions: [{ postcondition_id: "postcondition:viable", status: "satisfied", evidence_refs: ["digest:one"] }], failure_code: null }, evidenceRefs: ["digest:one"] });
      const prepareFacts = { alive: true, health: 20, air: 300 };
      projection = await store.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:durable", turnId: "turn:prepare-checkpoint", goalId: projection.goal_id, expectedRevision: projection.revision, payload: { kind: "checkpoint_verified", checkpoint_id: "checkpoint:prepare", milestone_id: "milestone:prepare", observation_revision: 1, verified_facts: prepareFacts, completed_postcondition_ids: ["postcondition:viable"], incomplete_postcondition_ids: [], checkpoint_evidence_hash: checkpointHash(prepareFacts, ["digest:one"], 1, ["postcondition:viable"], []) }, evidenceRefs: ["digest:one"] });
      projection = await store.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:durable", turnId: "turn:prepare-complete", goalId: projection.goal_id, expectedRevision: projection.revision, payload: { kind: "milestone_completed", milestone_id: "milestone:prepare", completed_postcondition_ids: ["postcondition:viable"] }, evidenceRefs: ["digest:one"] });

      const restartedStore = harness.makeStore();
      projection = await restartedStore.inspect({ goalId: projection.goal_id, profileId: "profile:owner", participantId: "participant:one" });
      expect(projection.milestones.find((entry) => entry.milestone_id === "milestone:prepare")?.status).toBe("completed");

      projection = await restartedStore.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:durable", turnId: "turn:advance-activate", goalId: projection.goal_id, expectedRevision: projection.revision, payload: { kind: "milestone_activated", milestone_id: "milestone:advance", rationale: "The preparation dependency is verified." } });
      projection = await restartedStore.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:durable", turnId: "turn:advance-attempt", goalId: projection.goal_id, expectedRevision: projection.revision, payload: { kind: "attempt_started", attempt_id: "attempt:advance", milestone_id: "milestone:advance", plan_summary: "Earn and verify one advancement.", capability_ids: ["com.casimirbot.minecraft.actor.status.read"] } });
      projection = await restartedStore.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:durable", turnId: "turn:advance-wake", goalId: projection.goal_id, expectedRevision: projection.revision, payload: { kind: "semantic_wake_consumed", mail_refs: ["mail:two"], digest_refs: ["digest:three"], observation_revision: 2, material_change_summary: "A new advancement was earned and viability remained stable." }, evidenceRefs: ["mail:two", "digest:three"] });
      projection = await restartedStore.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:durable", turnId: "turn:advance-settle", goalId: projection.goal_id, expectedRevision: projection.revision, payload: { kind: "attempt_settled", attempt_id: "attempt:advance", milestone_id: "milestone:advance", outcome: "succeeded", postconditions: [{ postcondition_id: "postcondition:advancement", status: "satisfied", evidence_refs: ["digest:three"] }, { postcondition_id: "postcondition:viable", status: "satisfied", evidence_refs: ["digest:three"] }], failure_code: null }, evidenceRefs: ["digest:three"] });
      const advanceFacts = { alive: true, health: 20, advancement: "minecraft:story/mine_stone" };
      projection = await restartedStore.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:durable", turnId: "turn:advance-checkpoint", goalId: projection.goal_id, expectedRevision: projection.revision, payload: { kind: "checkpoint_verified", checkpoint_id: "checkpoint:advance", milestone_id: "milestone:advance", observation_revision: 2, verified_facts: advanceFacts, completed_postcondition_ids: ["postcondition:advancement", "postcondition:viable"], incomplete_postcondition_ids: [], checkpoint_evidence_hash: checkpointHash(advanceFacts, ["digest:three"], 2, ["postcondition:advancement", "postcondition:viable"], []) }, evidenceRefs: ["digest:three"] });
      projection = await restartedStore.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:durable", turnId: "turn:advance-complete", goalId: projection.goal_id, expectedRevision: projection.revision, payload: { kind: "milestone_completed", milestone_id: "milestone:advance", completed_postcondition_ids: ["postcondition:advancement", "postcondition:viable"] }, evidenceRefs: ["digest:three"] });
      projection = await restartedStore.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:durable", turnId: "turn:goal-complete", goalId: projection.goal_id, expectedRevision: projection.revision, payload: { kind: "goal_completed", completed_milestone_ids: ["milestone:prepare", "milestone:advance"] }, evidenceRefs: ["digest:three"] });

      expect(projection).toMatchObject({ status: "completed", revision: 14, attempt_count: 2, active_milestone_id: null });
      expect(projection.milestones.map((entry) => entry.status)).toEqual(["completed", "completed"]);
      expect(projection.consumed_semantic_wake_refs).toEqual(["mail:one", "digest:one", "mail:two", "digest:three"]);
      expect(projection.event_refs).toHaveLength(14);
    } finally {
      await harness.pool.end();
    }
  });

  it("rejects stale revisions and evidence from another room", async () => {
    const harness = await createHarness();
    try {
      const store = harness.makeStore();
      const created = await store.create({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: null, turnId: "turn:one", objective });
      const request = { ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: null, turnId: "turn:two", goalId: created.goal_id, expectedRevision: 0, payload: { kind: "checkpoint_verified" as const, checkpoint_id: "checkpoint:one", milestone_id: null, observation_revision: 1, verified_facts: {}, completed_postcondition_ids: [], incomplete_postcondition_ids: ["postcondition:advancement"], checkpoint_evidence_hash: checkpointHash({}, ["digest:one"]) }, evidenceRefs: ["digest:one"] };
      await expect(store.append(request)).rejects.toMatchObject({ code: "durable_goal_revision_conflict" });
      await expect(store.append({ ...request, expectedRevision: 1, evidenceRefs: ["digest:wrong"] })).rejects.toMatchObject({ code: "durable_goal_evidence_identity_mismatch" });
    } finally {
      await harness.pool.end();
    }
  });

  it("returns an actionable typed event failure when a lifecycle invariant rejects an append", async () => {
    const harness = await createHarness();
    try {
      const store = harness.makeStore();
      const created = await store.create({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: null, turnId: "turn:create", objective });

      await expect(store.append({
        ownerProfileId: "profile:owner", roomId: "room:one",
        participantId: "participant:one", environmentBindingId: "environment:one",
        subjectNativeId: "player:one", actionAuthorityId: "authority:one",
        runId: null, turnId: "turn:invalid-completion", goalId: created.goal_id,
        expectedRevision: created.revision,
        payload: {
          kind: "milestone_completed",
          milestone_id: "milestone:one",
          completed_postcondition_ids: ["postcondition:advancement", "postcondition:viable"],
        },
        evidenceRefs: ["digest:one"],
      })).rejects.toMatchObject({
        code: "durable_goal_event_invalid",
        statusCode: 409,
        mismatchReasons: ["durable_goal_milestone_evidence_incomplete"],
      });
    } finally {
      await harness.pool.end();
    }
  });

  it("allows an explicitly granted room participant to inspect and steer without changing player authority identity", async () => {
    const harness = await createHarness();
    try {
      const store = harness.makeStore();
      const created = await store.create({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: null, turnId: "turn:one", objective });
      await store.grantParticipant({ goalId: created.goal_id, ownerProfileId: "profile:owner", participantId: "participant:two", scopes: ["read", "steer"] });
      const visible = await store.inspect({ goalId: created.goal_id, profileId: "profile:two", participantId: "participant:two" });
      expect(visible.goal_id).toBe(created.goal_id);
      await expect(store.listForRoom({
        roomId: "room:one",
        profileId: "profile:two",
        participantId: "participant:two",
        sourceId: "source:one",
        worldId: "minecraft:overworld",
        roomSourceBindingId: "source-binding:one",
      })).resolves.toMatchObject([{ goal_id: created.goal_id }]);
      const steered = await store.append({ ownerProfileId: "profile:two", roomId: "room:one", participantId: "participant:two", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: "run:two", turnId: "turn:two", goalId: created.goal_id, expectedRevision: 1, payload: { kind: "strategy_revised", strategy_summary: "Use a safer route after the room handoff.", candidate_milestone_ids: ["milestone:one"], supersedes_strategy_event_id: null } });
      expect(steered.identity.participant_id).toBe("participant:two");
      expect(steered.identity.authority_participant_id).toBe("participant:one");
      expect(steered.identity.subject_native_id).toBe("player:one");
      await store.revokeParticipant({ goalId: created.goal_id, ownerProfileId: "profile:owner", participantId: "participant:two" });
      await expect(store.inspect({ goalId: created.goal_id, profileId: "profile:two", participantId: "participant:two" })).rejects.toMatchObject({ code: "durable_goal_not_found" });
      await expect(store.listForRoom({
        roomId: "room:one",
        profileId: "profile:two",
        participantId: "participant:two",
        sourceId: "source:one",
        worldId: "minecraft:overworld",
        roomSourceBindingId: "source-binding:one",
      })).resolves.toEqual([]);
      const audit = await harness.pool.query(
        `SELECT event_kind, participant_id FROM helix_environment_durable_goal_participant_events
          WHERE goal_id=$1 ORDER BY sequence;`,
        [created.goal_id],
      );
      expect(audit.rows).toEqual([
        { event_kind: "granted", participant_id: "participant:one" },
        { event_kind: "granted", participant_id: "participant:two" },
        { event_kind: "revoked", participant_id: "participant:two" },
      ]);
    } finally {
      await harness.pool.end();
    }
  });

  it("records recovery while authority is unavailable and requires evidence-backed rebound before resuming", async () => {
    const harness = await createHarness();
    try {
      const store = harness.makeStore();
      const created = await store.create({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: null, turnId: "turn:one", objective });

      harness.setIdentityAvailable(false);
      const recovering = await store.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: null, turnId: "turn:recovery", goalId: created.goal_id, expectedRevision: 1, payload: { kind: "recovery_required", reason: "fabric_restart", last_recoverable_checkpoint_id: null } });
      expect(recovering.status).toBe("recovery_required");
      expect(recovering.identity.producer_epoch_ref).toBe("epoch:one");

      harness.setIdentityAvailable(true);
      harness.setCurrentIdentity({ ...identity,
        connector_installation_id: "installation:two",
        device_id: "device:two",
        environment_binding_id: "environment:two",
        subject_binding_id: "subject:two",
        producer_epoch_ref: "epoch:two",
        action_authority_id: "authority:two",
        authority_policy_version: 2,
      });
      await expect(store.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:two", runId: null, turnId: "turn:blocked", goalId: created.goal_id, expectedRevision: 2, payload: { kind: "strategy_revised", strategy_summary: "Continue immediately.", candidate_milestone_ids: ["milestone:one"], supersedes_strategy_event_id: null } })).rejects.toMatchObject({ code: "durable_goal_authority_stale" });

      const rebound = await store.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:two", runId: null, turnId: "turn:rebound", goalId: created.goal_id, expectedRevision: 2, payload: { kind: "authority_rebound", superseded_producer_epoch_ref: "epoch:one", fresh_observation_revision: 2 }, evidenceRefs: ["digest:two"] });
      expect(rebound.recovery.rebound_event_id).toBeTruthy();
      expect(rebound.identity.producer_epoch_ref).toBe("epoch:two");
      expect(rebound.identity.environment_binding_id).toBe("environment:two");
      expect(rebound.identity.subject_binding_id).toBe("subject:two");
      const durableRoot = await harness.pool.query(
        `SELECT connector_installation_id, device_id, environment_binding_id,
                subject_binding_id
           FROM helix_environment_durable_goals WHERE goal_id=$1;`,
        [created.goal_id],
      );
      expect(durableRoot.rows[0]).toMatchObject({
        connector_installation_id: "installation:two",
        device_id: "device:two",
        environment_binding_id: "environment:two",
        subject_binding_id: "subject:two",
      });

      const checkpoint = await store.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:two", runId: null, turnId: "turn:checkpoint", goalId: created.goal_id, expectedRevision: 3, payload: { kind: "checkpoint_verified", checkpoint_id: "checkpoint:two", milestone_id: null, observation_revision: 2, verified_facts: { health: 20, alive: true }, completed_postcondition_ids: [], incomplete_postcondition_ids: ["postcondition:advancement"], checkpoint_evidence_hash: checkpointHash({ health: 20, alive: true }, ["digest:two"], 2) }, evidenceRefs: ["digest:two"] });
      const resumed = await store.append({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:two", runId: null, turnId: "turn:resume", goalId: created.goal_id, expectedRevision: 4, payload: { kind: "goal_resumed", recovery_checkpoint_id: checkpoint.latest_checkpoint!.checkpoint_id } });
      expect(resumed.status).toBe("active");
      expect(resumed.recovery.required).toBe(false);
    } finally {
      await harness.pool.end();
    }
  });

  it("automatically suspends a matching active goal from a measured death event", async () => {
    const harness = await createHarness();
    try {
      const store = harness.makeStore();
      const created = await store.create({ ownerProfileId: "profile:owner", roomId: "room:one", participantId: "participant:one", environmentBindingId: "environment:one", subjectNativeId: "player:one", actionAuthorityId: "authority:one", runId: null, turnId: "turn:one", objective });
      const recoveries = await store.recordRecoveryFromEnvironmentEvent({ roomId: "room:one", sourceId: "source:one", worldId: "minecraft:overworld", producerEpochRef: "epoch:one", subjectBindingId: "subject:one", eventRef: "event:death", reason: "death" });
      expect(recoveries).toHaveLength(1);
      expect(recoveries[0]).toMatchObject({ goal_id: created.goal_id, status: "recovery_required", recovery: { required: true, reason: "death" } });
      expect(recoveries[0]?.event_refs.at(-1)).toMatch(/^environment_durable_goal_event:/);
      expect(await store.recordRecoveryFromEnvironmentEvent({ roomId: "room:one", sourceId: "source:one", worldId: "minecraft:overworld", producerEpochRef: "epoch:one", subjectBindingId: "subject:one", eventRef: "event:death", reason: "death" })).toEqual([]);
    } finally {
      await harness.pool.end();
    }
  });
});
