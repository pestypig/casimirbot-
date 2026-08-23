import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";
import { buildHelixSharedRealtimeRoomsExperimentPolicy } from "@shared/helix-account-session";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from "@shared/contracts/helix-shared-live-room-agent.v1";
import { HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE } from "@shared/helix-environment-action";
import {
  HELIX_ENVIRONMENT_DURABLE_GOAL_PROJECTION_SCHEMA,
  helixEnvironmentDurableGoalSha256,
  type HelixEnvironmentDurableGoalProjection,
} from "@shared/helix-environment-durable-goal";
import {
  createHelixMcpServer,
  type HelixEnvironmentDurableGoalMcpStore,
} from "../helix-mcp-server";
import type { HelixAgentApiService } from "../../services/helix-agent-api/service";
import type { HelixAgentApiPrincipal } from "../../services/helix-agent-api/types";
import type { SharedLiveRoomBindingStore } from "../../services/shared-live-room-control/binding-store";
import type { SharedLiveRoomControlService } from "../../services/shared-live-room-control/service";

const ROOM_ID = "shared_realtime_room:durable-goal-mcp";
const PARTICIPANT_ID = "shared_realtime_room_participant:durable-goal-mcp";

const principal = (scopes: readonly string[]): HelixAgentApiPrincipal => {
  const policy = buildHelixSharedRealtimeRoomsExperimentPolicy("developer");
  const now = "2026-08-22T12:00:00.000Z";
  return {
    tenantId: "tenant:durable-goal-mcp",
    issuer: "https://issuer.example",
    subjectId: "subject:durable-goal-mcp",
    accountProfileId: "profile:durable-goal-mcp",
    accountType: "developer",
    scopes: new Set(scopes),
    tokenExpiresAt: "2099-01-01T00:00:00.000Z",
    accountContext: {
      session_id: "external-oauth:durable-goal-mcp",
      profile_id: "profile:durable-goal-mcp",
      trusted_account_session: true,
      account_session: {
        schema: "helix.account_session.v1",
        session_id: "external-oauth:durable-goal-mcp",
        profile: {
          profile_id: "profile:durable-goal-mcp",
          display_name: "Durable Goal MCP",
          email: null,
          auth_mode: "web_auth",
          account_type: "developer",
          provider: "external_oauth",
          provider_alias: "test",
          provider_subject: "subject:durable-goal-mcp",
          picture_url: null,
          created_at: now,
          updated_at: now,
        },
        account_policy: policy,
        status: "active",
        memory_scope: "profile",
        created_at: now,
        updated_at: now,
        expires_at: "2099-01-01T00:00:00.000Z",
      },
      account_policy: policy,
    },
  };
};

const objective = {
  objective_text: "Earn one survival advancement and remain viable.",
  goal_kind: "custom_survival" as const,
  domain: "minecraft" as const,
  game_version: "1.21.8",
  mechanics_collection_ref: null,
  milestones: [{
    milestone_id: "milestone:first",
    description: "Earn the first advancement.",
    dependency_milestone_ids: [],
    required_postcondition_ids: ["postcondition:advancement", "postcondition:viable"],
  }],
};

const projection: HelixEnvironmentDurableGoalProjection = {
  schema: HELIX_ENVIRONMENT_DURABLE_GOAL_PROJECTION_SCHEMA,
  goal_id: "environment_durable_goal:mcp",
  revision: 1,
  latest_event_hash: `sha256:${"a".repeat(64)}`,
  status: "active",
  objective,
  identity: {
    owner_profile_id: "profile:durable-goal-mcp",
    host_ref: "environment_device:one",
    connector_installation_id: "installation:one",
    device_id: "device:one",
    environment_binding_id: "environment:one",
    room_source_binding_id: "room_source_binding:one",
    room_id: ROOM_ID,
    goal_owner_participant_id: PARTICIPANT_ID,
    participant_id: PARTICIPANT_ID,
    authority_participant_id: PARTICIPANT_ID,
    subject_binding_id: "subject_binding:one",
    subject_native_id: "player:one",
    source_id: "source:one",
    world_id: "minecraft:overworld",
    producer_epoch_ref: "epoch:one",
    action_authority_id: "authority:one",
    authority_policy_version: 1,
    authority_expires_at: "2099-01-01T00:00:00.000Z",
    run_id: null,
    turn_id: "turn:one",
  },
  active_milestone_id: null,
  milestones: [{
    milestone_id: "milestone:first",
    description: "Earn the first advancement.",
    status: "candidate",
    required_postcondition_ids: ["postcondition:advancement", "postcondition:viable"],
    completed_postcondition_ids: [],
  }],
  recent_attempts: [],
  attempt_count: 0,
  latest_checkpoint: null,
  recovery: { required: false, reason: null, rebound_event_id: null },
  consumed_semantic_wake_refs: [],
  event_refs: ["environment_durable_goal_event:one"],
  content_role: "environment_durable_goal_projection_not_assistant_answer",
  reentry_required: true,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
};

const connect = async (scopes: readonly string[]) => {
  const goalStore = {
    create: vi.fn(async () => projection),
    inspect: vi.fn(async () => projection),
    append: vi.fn(async () => ({ ...projection, revision: 2 })),
  } satisfies HelixEnvironmentDurableGoalMcpStore;
  const inspectRoom = vi.fn(async () => ({ room: { self_participant_id: PARTICIPANT_ID } }));
  const server = createHelixMcpServer({
    principal: principal(scopes),
    service: {} as HelixAgentApiService,
    roomControlService: { inspectRoom } as unknown as SharedLiveRoomControlService,
    roomBindingStore: {} as Pick<SharedLiveRoomBindingStore, "bindRunToRoom" | "claimPendingChatBinding" | "revokeRunRoomBindingForOwner" | "revokeClaimedRunChatBindingForOwner">,
    deviceCheckService: vi.fn(),
    environmentDurableGoalService: goalStore,
  });
  const client = new Client({ name: "durable-goal-mcp-test", version: "1.0.0" }, { capabilities: {} });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, goalStore, inspectRoom, close: async () => { await client.close(); await server.close(); } };
};

describe("Helix MCP durable environment goal", () => {
  it("creates, inspects, and appends through current room identity as nonterminal re-entry context", async () => {
    const connection = await connect([HELIX_SHARED_LIVE_ROOM_READ_SCOPE, HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE]);
    try {
      const catalog = await connection.client.listTools();
      expect(catalog.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining([
        "helix_environment_goal_create",
        "helix_environment_goal_inspect",
        "helix_environment_goal_append",
        "helix_environment_goal_checkpoint_hash",
      ]));
      const checkpointHashInput = {
        evidence_refs: ["environment_probe_evidence:checkpoint"],
        observation_revision: 42,
        verified_facts: { viable: true, controls_released: true },
        completed_postcondition_ids: ["postcondition:viable"],
        incomplete_postcondition_ids: ["postcondition:advancement"],
      };
      const checkpointHash = await connection.client.callTool({
        name: "helix_environment_goal_checkpoint_hash",
        arguments: checkpointHashInput,
      });
      expect(checkpointHash.isError, JSON.stringify(checkpointHash)).not.toBe(true);
      expect(checkpointHash.structuredContent).toMatchObject({
        operation: "environment.durable_goal.checkpoint_hash",
        checkpoint_evidence_hash: helixEnvironmentDurableGoalSha256(checkpointHashInput),
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
      });
      const created = await connection.client.callTool({
        name: "helix_environment_goal_create",
        arguments: {
          room_id: ROOM_ID,
          environment_binding_id: "environment:one",
          action_authority_id: "authority:one",
          subject_native_id: "player:one",
          turn_id: "turn:create",
          objective,
        },
      });
      expect(created.isError, JSON.stringify(created)).not.toBe(true);
      expect(created.structuredContent).toMatchObject({
        operation: "com.casimirbot.environment.durable_goal.create",
        room_id: ROOM_ID,
        goal: { goal_id: projection.goal_id, reentry_required: true, terminal_eligible: false },
        reentry_required: true,
        answer_authority: false,
        terminal_eligible: false,
      });
      expect(connection.goalStore.create).toHaveBeenCalledWith(expect.objectContaining({
        ownerProfileId: "profile:durable-goal-mcp",
        participantId: PARTICIPANT_ID,
      }));

      await connection.client.callTool({ name: "helix_environment_goal_inspect", arguments: { room_id: ROOM_ID, goal_id: projection.goal_id } });
      expect(connection.goalStore.inspect).toHaveBeenCalledWith({ goalId: projection.goal_id, profileId: "profile:durable-goal-mcp", participantId: PARTICIPANT_ID });

      await connection.client.callTool({
        name: "helix_environment_goal_append",
        arguments: {
          room_id: ROOM_ID,
          environment_binding_id: "environment:one",
          goal_id: projection.goal_id,
          action_authority_id: "authority:one",
          subject_native_id: "player:one",
          turn_id: "turn:append",
          expected_revision: 1,
          payload: { kind: "strategy_revised", strategy_summary: "Try a safer route.", candidate_milestone_ids: ["milestone:first"], supersedes_strategy_event_id: null },
          evidence_refs: [],
        },
      });
      expect(connection.goalStore.append).toHaveBeenCalledWith(expect.objectContaining({ participantId: PARTICIPANT_ID, expectedRevision: 1 }));
      expect(connection.inspectRoom).toHaveBeenCalledTimes(3);
    } finally {
      await connection.close();
    }
  });

  it("rejects mutation before store access when action-write scope is absent", async () => {
    const connection = await connect([HELIX_SHARED_LIVE_ROOM_READ_SCOPE]);
    try {
      const result = await connection.client.callTool({
        name: "helix_environment_goal_create",
        arguments: {
          room_id: ROOM_ID,
          environment_binding_id: "environment:one",
          action_authority_id: "authority:one",
          subject_native_id: "player:one",
          turn_id: "turn:create",
          objective,
        },
      });
      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({ error: "insufficient_scope" });
      expect(connection.goalStore.create).not.toHaveBeenCalled();
      expect(connection.inspectRoom).not.toHaveBeenCalled();
    } finally {
      await connection.close();
    }
  });
});
