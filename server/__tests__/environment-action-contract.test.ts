import { describe, expect, it } from "vitest";
import {
  HELIX_ENVIRONMENT_ACTION_CONTROL_REQUEST_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_CONNECTOR_HEARTBEAT_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_CONNECTOR_MANIFEST_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_REQUEST_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_RESULT_SCHEMA,
  HELIX_ENVIRONMENT_ACTION_WORKFLOW_EVENT_SCHEMA,
  helixEnvironmentActionControlRequestSchema,
  helixEnvironmentActionConnectorHeartbeatSchema,
  helixEnvironmentActionConnectorManifestSchema,
  helixEnvironmentActionRequestSchema,
  helixEnvironmentActionResultSchema,
  helixEnvironmentActionWorkflowEventSchema,
} from "@shared/helix-environment-action";
import {
  HELIX_ENVIRONMENT_EVENT_BATCH_SCHEMA,
  HELIX_ENVIRONMENT_EVENT_SCHEMA,
  HELIX_ENVIRONMENT_SITUATION_DIGEST_SCHEMA,
  helixEnvironmentEventBatchSchema,
  helixEnvironmentSituationDigestSchema,
} from "@shared/helix-environment-event-stream";
import {
  HELIX_MINECRAFT_PLAYER_CAPABILITY_IDS,
  HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
  helixMinecraftPlayerActionArgumentsSchema,
  minecraftPlayerCapabilityForActionKind,
} from "@shared/helix-minecraft-player-capabilities";
import {
  hashEnvironmentActionIdempotencyContent,
  storedEnvironmentActionMatchesIdempotencyContent,
} from "../services/environment-connectors/actions/action-broker";

const now = "2026-08-05T12:00:00.000Z";
const later = "2026-08-05T12:01:00.000Z";
const hash = `sha256:${"a".repeat(64)}`;

const baseActionRequest = () => ({
  schema: HELIX_ENVIRONMENT_ACTION_REQUEST_SCHEMA,
  action_request_id: "environment_action_request:test",
  workflow_id: "environment_action_workflow:test",
  action_authority_id: "environment_action_authority:test",
  environment_binding_id: "environment_binding:test",
  room_id: "shared_realtime_room:test",
  source_id: "source:room-ingress:test",
  world_id: "minecraft:local:test",
  participant_id: "room_participant:test",
  subject_binding_id: "environment_subject_binding:test",
  subject_native_id: "minecraft-player-uuid",
  run_id: "helix_agent_run:test",
  turn_id: "ask:test",
  provider_execution_id: "provider_execution:test",
  tool_call_id: "tool_call:test",
  catalog_snapshot_id: "environment_catalog:test",
  capability_id: HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
  capability_version: 1,
  action_kind: "navigate_to",
  effect_class: "continuous_control" as const,
  workflow_mode: "long_running" as const,
  requested_control_engine: "adapter_selected" as const,
  arguments: {
    action_kind: "navigate_to",
    destination: { x: 10, y: 64, z: 12 },
    arrival_radius: 1,
    allow_sprint: true,
    allow_dig: false,
    allow_place: false,
    engine_preference: "adapter_selected",
  },
  preconditions: [],
  postconditions: [
    {
      condition_id: "postcondition:destination",
      condition_kind: "position_within",
      required: true,
      parameters: { x: 10, y: 64, z: 12, radius: 1 },
    },
  ],
  idempotency_key: "environment-action-idempotency-test",
  confirmation_state: "approved" as const,
  approval_ref: "environment_action_approval:test",
  created_at: now,
  deadline_at: later,
  constraints: {
    max_duration_ms: 60_000,
    max_distance_blocks: 128,
    max_block_mutations: 0,
    max_inventory_transfers: 0,
    manual_override_policy: "cancel" as const,
    require_postcondition_verification: true as const,
    world_mutation_allowed: false,
    combat_allowed: false,
    host_access_allowed: false as const,
    automatic_replay_allowed: false as const,
  },
  answer_authority: false as const,
  assistant_answer: false as const,
  terminal_eligible: false as const,
  raw_content_included: false as const,
});

const settledResult = () => ({
  schema: HELIX_ENVIRONMENT_ACTION_RESULT_SCHEMA,
  action_request_id: "environment_action_request:test",
  workflow_id: "environment_action_workflow:test",
  action_execution_id: "environment_action_execution:test",
  capability_id: HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
  capability_version: 1,
  action_kind: "navigate_to",
  outcome: "succeeded" as const,
  summary: "The selected player reached the admitted destination.",
  control_engine: "native_fabric" as const,
  started_at: now,
  completed_at: later,
  progress_event_refs: ["environment_action_event:progress"],
  postconditions: [
    {
      condition_id: "postcondition:destination",
      condition_kind: "position_within",
      required: true,
      status: "satisfied" as const,
      summary: "The measured position is inside the admitted arrival radius.",
      evidence_refs: ["evidence:position-after"],
      checked_at: later,
    },
  ],
  evidence_refs: ["evidence:position-before", "evidence:position-after"],
  side_effects_performed: true,
  player_motion_performed: true,
  player_interaction_performed: false,
  inventory_mutation_performed: false,
  world_mutation_performed: false,
  manual_override_detected: false,
  controls_released: true,
  host_access_performed: false as const,
  automatic_replay_performed: false as const,
  model_invoked: false as const,
  assistant_answer: false as const,
  raw_content_included: false as const,
});

describe("provider-neutral environment player-action contract", () => {
  it("treats bounded delivery retries as the same semantic action", () => {
    const original = helixEnvironmentActionRequestSchema.parse(baseActionRequest());
    const retry = helixEnvironmentActionRequestSchema.parse({
      ...baseActionRequest(),
      action_request_id: "environment_action_request:retry",
      workflow_id: "environment_action_workflow:retry",
      provider_execution_id: "provider_execution:retry",
      tool_call_id: "tool_call:retry",
      preconditions: original.preconditions.map((condition) => ({
        ...condition,
        condition_id: `${condition.condition_id}:retry`,
      })),
      postconditions: original.postconditions.map((condition) => ({
        ...condition,
        condition_id: `${condition.condition_id}:retry`,
      })),
      created_at: "2026-08-05T12:00:02.000Z",
      deadline_at: "2026-08-05T12:01:02.000Z",
    });

    expect(hashEnvironmentActionIdempotencyContent(retry)).toBe(
      hashEnvironmentActionIdempotencyContent(original),
    );
    expect(storedEnvironmentActionMatchesIdempotencyContent({
      storedPayload: JSON.stringify(original),
      storedRequestHash: "sha256:legacy-full-request-hash",
      request: retry,
    })).toBe(true);
  });

  it("rejects semantic changes hidden behind the same idempotency key", () => {
    const original = helixEnvironmentActionRequestSchema.parse(baseActionRequest());
    const changed = helixEnvironmentActionRequestSchema.parse({
      ...baseActionRequest(),
      arguments: {
        ...baseActionRequest().arguments,
        destination: { x: 11, y: 64, z: 12 },
      },
    });

    expect(hashEnvironmentActionIdempotencyContent(changed)).not.toBe(
      hashEnvironmentActionIdempotencyContent(original),
    );
  });

  it("declares the initial and reusable Minecraft player capability families", () => {
    expect(HELIX_MINECRAFT_PLAYER_CAPABILITY_IDS).toContain(
      HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
    );
    expect(HELIX_MINECRAFT_PLAYER_CAPABILITY_IDS).toContain(
      HELIX_MINECRAFT_PLAYER_EMERGENCY_STOP_CAPABILITY,
    );
    expect(minecraftPlayerCapabilityForActionKind("craft")).toBe(
      "com.casimirbot.minecraft.player.craft",
    );
  });

  it("accepts bounded navigation and forbids hidden dig/place escalation", () => {
    expect(
      helixMinecraftPlayerActionArgumentsSchema.safeParse(
        baseActionRequest().arguments,
      ).success,
    ).toBe(true);
    expect(
      helixMinecraftPlayerActionArgumentsSchema.safeParse({
        ...baseActionRequest().arguments,
        allow_dig: true,
      }).success,
    ).toBe(false);
  });

  it("requires exact identities, postconditions, no host access, and no replay", () => {
    expect(helixEnvironmentActionRequestSchema.parse(baseActionRequest())).toMatchObject({
      effect_class: "continuous_control",
      terminal_eligible: false,
      constraints: {
        require_postcondition_verification: true,
        host_access_allowed: false,
        automatic_replay_allowed: false,
      },
    });
  });

  it("rejects world mutation without an admitted mutation scope", () => {
    expect(
      helixEnvironmentActionRequestSchema.safeParse({
        ...baseActionRequest(),
        effect_class: "world_mutation",
      }).success,
    ).toBe(false);
  });

  it("requires every settled workflow to release client controls", () => {
    expect(helixEnvironmentActionResultSchema.parse(settledResult()).outcome).toBe(
      "succeeded",
    );
    expect(
      helixEnvironmentActionResultSchema.safeParse({
        ...settledResult(),
        controls_released: false,
      }).success,
    ).toBe(false);
  });

  it("does not permit success with an unverified required postcondition", () => {
    const result = settledResult();
    expect(
      helixEnvironmentActionResultSchema.safeParse({
        ...result,
        postconditions: [
          {
            ...result.postconditions[0],
            status: "not_satisfied",
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("requires terminal workflow events and manual override to be explicit", () => {
    const terminalEvent = {
      schema: HELIX_ENVIRONMENT_ACTION_WORKFLOW_EVENT_SCHEMA,
      event_id: "environment_action_event:complete",
      action_request_id: "environment_action_request:test",
      workflow_id: "environment_action_workflow:test",
      sequence: 4,
      event_type: "workflow.succeeded",
      workflow_state: "succeeded",
      progress_fraction: 1,
      summary: "Workflow completed and controls were released.",
      control_engine: "native_fabric",
      evidence_refs: ["evidence:position-after"],
      manual_override_detected: false,
      controls_released: true,
      created_at: later,
      content_role: "environment_action_event_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    expect(helixEnvironmentActionWorkflowEventSchema.parse(terminalEvent)).toBeTruthy();
    expect(
      helixEnvironmentActionWorkflowEventSchema.safeParse({
        ...terminalEvent,
        event_type: "workflow.manual_override_detected",
        workflow_state: "paused_manual_override",
      }).success,
    ).toBe(false);
  });

  it("makes cancellation and emergency stop release all controls", () => {
    const controlRequest = {
      schema: HELIX_ENVIRONMENT_ACTION_CONTROL_REQUEST_SCHEMA,
      control_request_id: "environment_action_control:test",
      control_kind: "emergency_stop",
      action_authority_id: "environment_action_authority:test",
      environment_binding_id: "environment_binding:test",
      room_id: "shared_realtime_room:test",
      source_id: "source:room-ingress:test",
      world_id: "minecraft:local:test",
      participant_id: "room_participant:test",
      subject_binding_id: "environment_subject_binding:test",
      workflow_id: null,
      reason: "The room owner requested an immediate stop.",
      release_all_controls: true,
      created_at: now,
      deadline_at: later,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    expect(helixEnvironmentActionControlRequestSchema.parse(controlRequest)).toBeTruthy();
    expect(
      helixEnvironmentActionControlRequestSchema.safeParse({
        ...controlRequest,
        release_all_controls: false,
      }).success,
    ).toBe(false);
  });

  it("keeps the separately paired client manifest capability-scoped and host-blind", () => {
    const manifest = {
      schema: HELIX_ENVIRONMENT_ACTION_CONNECTOR_MANIFEST_SCHEMA,
      manifest_id: "environment_action_manifest:test",
      connector_installation_id: "connector_installation:test",
      producer_epoch_ref: "producer_epoch:test",
      action_authority_id: "environment_action_authority:test",
      environment_binding_id: "environment_binding:test",
      room_id: "shared_realtime_room:test",
      source_id: "source:room-ingress:test",
      world_id: "minecraft:local:test",
      participant_id: "room_participant:test",
      subject_binding_id: "environment_subject_binding:test",
      subject_native_id: "minecraft-player-uuid",
      domain: "minecraft",
      domain_adapter: "minecraft.fabric_client.v1",
      adapter_profile_id: "game.minecraft.player.fabric.v1",
      adapter_version: "0.1.0",
      protocol_version: "helix.environment_action.v1",
      capabilities: [
        {
          capability_id: HELIX_MINECRAFT_PLAYER_NAVIGATE_CAPABILITY,
          capability_version: 1,
          action_kind: "navigate_to",
          effect_class: "continuous_control",
          workflow_modes: ["long_running"],
          control_engines: ["native_fabric"],
          requires_world_mutation_scope: false,
          requires_confirmation: true,
        },
      ],
      available_control_engines: [
        {
          control_engine: "native_fabric",
          available: true,
          version: "1.21.8",
        },
        {
          control_engine: "baritone",
          available: false,
          version: null,
        },
      ],
      safety_policy: {
        manual_override_supported: true,
        manual_override_policy: "cancel",
        progress_observations_supported: true,
        postcondition_verification_supported: true,
        emergency_stop_supported: true,
        release_controls_on_disconnect: true,
        host_access_supported: false,
        automatic_replay_supported: false,
        model_execution_supported: false,
      },
      created_at: now,
      credential_included: false,
      content_role: "environment_action_connector_manifest_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    } as const;

    expect(helixEnvironmentActionConnectorManifestSchema.parse(manifest)).toBeTruthy();
    expect(
      helixEnvironmentActionConnectorManifestSchema.safeParse({
        ...manifest,
        bearer_token: "must-not-appear-in-a-manifest",
      }).success,
    ).toBe(false);
    expect(
      helixEnvironmentActionConnectorManifestSchema.safeParse({
        ...manifest,
        capabilities: [
          {
            ...manifest.capabilities[0],
            control_engines: ["baritone"],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("does not let a heartbeat assert controls without an exact workflow", () => {
    const heartbeat = {
      schema: HELIX_ENVIRONMENT_ACTION_CONNECTOR_HEARTBEAT_SCHEMA,
      heartbeat_id: "environment_action_heartbeat:test",
      manifest_id: "environment_action_manifest:test",
      connector_installation_id: "connector_installation:test",
      producer_epoch_ref: "producer_epoch:test",
      action_authority_id: "environment_action_authority:test",
      environment_binding_id: "environment_binding:test",
      room_id: "shared_realtime_room:test",
      source_id: "source:room-ingress:test",
      world_id: "minecraft:local:test",
      participant_id: "room_participant:test",
      subject_binding_id: "environment_subject_binding:test",
      status: "active",
      active_workflow_ids: ["environment_action_workflow:test"],
      controls_asserted: true,
      manual_input_detected: false,
      emergency_stop_latched: false,
      control_engines: [
        {
          control_engine: "native_fabric",
          status: "busy",
          last_error: null,
        },
      ],
      latest_event_sequence: 4,
      evidence_refs: ["evidence:heartbeat"],
      created_at: now,
      credential_included: false,
      content_role: "environment_action_connector_heartbeat_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    } as const;

    expect(helixEnvironmentActionConnectorHeartbeatSchema.parse(heartbeat)).toBeTruthy();
    expect(
      helixEnvironmentActionConnectorHeartbeatSchema.safeParse({
        ...heartbeat,
        active_workflow_ids: [],
      }).success,
    ).toBe(false);
    expect(
      helixEnvironmentActionConnectorHeartbeatSchema.safeParse({
        ...heartbeat,
        emergency_stop_latched: true,
      }).success,
    ).toBe(false);
  });
});

describe("typed environment event stream and situation digest", () => {
  const event = (sequence: number, eventId: string) => ({
    schema: HELIX_ENVIRONMENT_EVENT_SCHEMA,
    event_id: eventId,
    sequence,
    event_type: "workflow.progress",
    producer_plane: "player_embodiment",
    domain: "minecraft",
    domain_adapter: "minecraft.fabric_client.v1",
    room_id: "shared_realtime_room:test",
    source_id: "source:room-ingress:test",
    world_id: "minecraft:local:test",
    producer_epoch_ref: "producer_epoch_ref:test",
    subject_ref: "environment_subject:test",
    workflow_ref: "environment_action_workflow:test",
    summary: "The workflow advanced.",
    attributes: { progress_fraction: sequence / 10 },
    evidence_refs: [`evidence:event-${sequence}`],
    occurred_at: now,
    observed_at: now,
    provenance: "measured",
    raw_event_included: false,
    content_role: "environment_event_not_assistant_answer",
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });

  it("requires strictly ordered event batches", () => {
    const first = event(1, "environment_event:first");
    const second = event(2, "environment_event:second");
    const batch = {
      schema: HELIX_ENVIRONMENT_EVENT_BATCH_SCHEMA,
      batch_id: "environment_event_batch:test",
      room_id: first.room_id,
      source_id: first.source_id,
      world_id: first.world_id,
      producer_epoch_ref: first.producer_epoch_ref,
      producer_plane: "player_embodiment",
      first_sequence: 1,
      last_sequence: 2,
      events: [first, second],
      batch_hash: hash,
      created_at: now,
      content_role: "environment_event_batch_not_assistant_answer",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    expect(helixEnvironmentEventBatchSchema.parse(batch)).toBeTruthy();
    expect(
      helixEnvironmentEventBatchSchema.safeParse({
        ...batch,
        events: [second, first],
      }).success,
    ).toBe(false);
  });

  it("keeps digest event references inside its provenance set", () => {
    const digest = {
      schema: HELIX_ENVIRONMENT_SITUATION_DIGEST_SCHEMA,
      digest_id: "environment_situation_digest:test",
      room_id: "shared_realtime_room:test",
      source_id: "source:room-ingress:test",
      world_id: "minecraft:local:test",
      producer_epoch_ref: "producer_epoch_ref:test",
      producer_plane: "player_embodiment",
      subject_ref: "environment_subject:test",
      window_started_at: now,
      window_ended_at: later,
      latest_event_sequence: 2,
      event_counts: { "workflow.progress": 2 },
      latest_event_refs: ["environment_event:second"],
      situation: {
        actor: { health: 20 },
        inventory: null,
        hazards: null,
        focus: null,
        active_workflow: { workflow_id: "environment_action_workflow:test" },
      },
      changed_fields: ["active_workflow"],
      derived_from_event_refs: [
        "environment_event:first",
        "environment_event:second",
      ],
      derived_from_snapshot_refs: [],
      digest_hash: hash,
      observed_at: later,
      provenance_valid: true,
      raw_events_included: false,
      content_role: "environment_situation_digest_not_assistant_answer",
      reentry_required: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    expect(helixEnvironmentSituationDigestSchema.parse(digest)).toBeTruthy();
    expect(
      helixEnvironmentSituationDigestSchema.safeParse({
        ...digest,
        latest_event_refs: ["environment_event:missing"],
      }).success,
    ).toBe(false);
  });
});
