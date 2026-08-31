import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_SITUATION_DIGEST_OBSERVATION_SCHEMA,
  HELIX_ENVIRONMENT_SITUATION_DIGEST_SCHEMA,
  helixEnvironmentEventBatchSchema,
  helixEnvironmentEventSchema,
  helixEnvironmentSituationDigestObservationSchema,
  helixEnvironmentSituationDigestSchema,
  type HelixEnvironmentEvent,
  type HelixEnvironmentEventBatch,
  type HelixEnvironmentSituationDigest,
  type HelixEnvironmentSituationDigestObservation,
} from "@shared/helix-environment-event-stream";
import { environmentConnectorSha256 } from "../catalog";
import {
  EnvironmentActionBrokerError,
  type EnvironmentActionConnectorClaim,
} from "../actions/action-broker";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../../helix-ask/realtime-room/room-store/database";
import { readSharedRealtimeRoomMembership } from "../../helix-ask/realtime-room/room-store";
import type { Queryable } from "../../helix-ask/realtime-room/room-store/types";
import type { HelixWorldEvent } from "@shared/helix-world-event";
import type { HelixEnvironmentAdapterAdmissionProjection } from "@shared/helix-environment-adapter-profile";
import type {
  HelixRoomSourceAdmission,
} from "@shared/helix-room-source-ingress";
import type { RoomSourceIngressRequestClaim } from "../../helix-ask/realtime-room/source-link-store";

const DIGEST_EVENT_WINDOW = 512;

export type EnvironmentSituationDigestRecordedEvent = {
  environment_binding_id: string;
  digest: HelixEnvironmentSituationDigest;
};

type EnvironmentSituationDigestRecordedSubscriber = (
  event: EnvironmentSituationDigestRecordedEvent,
) => void;

const environmentSituationDigestRecordedSubscribers = new Set<
  EnvironmentSituationDigestRecordedSubscriber
>();

export const subscribeEnvironmentSituationDigestRecorded = (
  subscriber: EnvironmentSituationDigestRecordedSubscriber,
): (() => void) => {
  environmentSituationDigestRecordedSubscribers.add(subscriber);
  return () => environmentSituationDigestRecordedSubscribers.delete(subscriber);
};

const publishEnvironmentSituationDigestRecorded = (
  event: EnvironmentSituationDigestRecordedEvent,
): void => {
  for (const subscriber of environmentSituationDigestRecordedSubscribers) {
    try {
      subscriber(event);
    } catch {
      // Observation subscribers cannot change the committed event result.
    }
  }
};

export type EnvironmentEventTransactionRunner = <T>(
  handler: (db: Queryable) => Promise<T>,
) => Promise<T>;

type ActionManifestIdentityRow = {
  manifest_id: string;
  producer_epoch_ref: string;
  domain: string;
  domain_adapter: string;
  status: string;
  expires_at: Date | string | null;
};

type StoredEventRow = {
  event_payload: unknown;
};

type StoredDigestRow = {
  digest_payload: unknown;
  digest_hash: string;
  provenance_valid: boolean;
  observed_at: Date | string;
};

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== "string") return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const environmentEventBatchContent = (
  batch: HelixEnvironmentEventBatch,
): Omit<HelixEnvironmentEventBatch, "batch_hash"> => {
  const { batch_hash: _batchHash, ...content } = batch;
  return content;
};

const environmentSituationDigestContent = (
  digest: HelixEnvironmentSituationDigest,
): Omit<HelixEnvironmentSituationDigest, "digest_hash"> => {
  const { digest_hash: _digestHash, ...content } = digest;
  return content;
};

const mergeSection = (
  current: Record<string, unknown> | null,
  value: unknown,
  section: string,
  changed: Set<string>,
): Record<string, unknown> | null => {
  if (!isRecord(value)) return current;
  const next = { ...(current ?? {}), ...value };
  Object.keys(value).forEach((key) => changed.add(`${section}.${key}`));
  return next;
};

const terminalWorkflowEvent = (eventType: string): boolean =>
  [
    "workflow.completed",
    "workflow.succeeded",
    "workflow.failed",
    "workflow.canceled",
    "workflow.timed_out",
    "workflow.emergency_stopped",
  ].includes(eventType);

const identifierPattern = /^[a-zA-Z0-9:._/-]+$/u;
const boundedIdentifier = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 &&
    normalized.length <= 320 &&
    identifierPattern.test(normalized)
    ? normalized
    : null;
};

const evidenceReference = (value: string): string => {
  const admitted = boundedIdentifier(value);
  if (admitted) return admitted;
  return `environment_source_evidence_hash:${crypto
    .createHash("sha256")
    .update(value, "utf8")
    .digest("hex")
    .slice(0, 48)}`;
};

export const buildEnvironmentSituationDigest = (input: {
  environmentBindingId: string;
  events: HelixEnvironmentEvent[];
}): HelixEnvironmentSituationDigest => {
  if (input.events.length === 0) {
    throw new EnvironmentActionBrokerError(
      "action_event_invalid",
      400,
      "A situation digest requires at least one admitted environment event.",
    );
  }
  const events = [...input.events].sort(
    (left, right) => left.sequence - right.sequence,
  );
  const first = events[0];
  const latest = events[events.length - 1];
  if (
    events.some(
      (event) =>
        event.room_id !== first.room_id ||
        event.source_id !== first.source_id ||
        event.world_id !== first.world_id ||
        event.producer_epoch_ref !== first.producer_epoch_ref ||
        event.producer_plane !== first.producer_plane ||
        event.subject_ref !== first.subject_ref,
    )
  ) {
    throw new EnvironmentActionBrokerError(
      "action_event_invalid",
      400,
      "A situation digest cannot combine different producer or subject identities.",
    );
  }

  const eventCounts: Record<string, number> = {};
  const changed = new Set<string>();
  const snapshotRefs = new Set<string>();
  let actor: Record<string, unknown> | null = null;
  let inventory: Record<string, unknown> | null = null;
  let hazards: Record<string, unknown> | null = null;
  let focus: Record<string, unknown> | null = null;
  let activeWorkflow: Record<string, unknown> | null = null;

  for (const event of events) {
    eventCounts[event.event_type] = (eventCounts[event.event_type] ?? 0) + 1;
    actor = mergeSection(actor, event.attributes.actor, "actor", changed);
    inventory = mergeSection(
      inventory,
      event.attributes.inventory,
      "inventory",
      changed,
    );
    hazards = mergeSection(
      hazards,
      event.attributes.hazards,
      "hazards",
      changed,
    );
    focus = mergeSection(focus, event.attributes.focus, "focus", changed);

    const explicitSnapshotRefs = event.attributes.snapshot_refs;
    if (Array.isArray(explicitSnapshotRefs)) {
      explicitSnapshotRefs
        .filter((entry): entry is string => typeof entry === "string")
        .forEach((entry) => snapshotRefs.add(entry));
    }

    if (event.workflow_ref && terminalWorkflowEvent(event.event_type)) {
      if (
        !activeWorkflow ||
        activeWorkflow.workflow_ref === event.workflow_ref
      ) {
        activeWorkflow = null;
        changed.add("active_workflow");
      }
    } else if (event.workflow_ref && event.event_type.startsWith("workflow.")) {
      const workflowAttributes = isRecord(event.attributes.active_workflow)
        ? event.attributes.active_workflow
        : {};
      activeWorkflow = {
        workflow_ref: event.workflow_ref,
        event_type: event.event_type.trim().slice(0, 160),
        summary: event.summary,
        observed_at: event.observed_at,
        ...workflowAttributes,
      };
      changed.add("active_workflow");
    }
  }

  const digestKey = environmentConnectorSha256({
    environment_binding_id: input.environmentBindingId,
    producer_epoch_ref: first.producer_epoch_ref,
    producer_plane: first.producer_plane,
    subject_ref: first.subject_ref,
    latest_event_sequence: latest.sequence,
    event_refs: events.map((event) => event.event_id),
  }).slice("sha256:".length, "sha256:".length + 48);
  const withoutHash = {
    schema: HELIX_ENVIRONMENT_SITUATION_DIGEST_SCHEMA,
    digest_id: `environment_situation_digest:${digestKey}`,
    room_id: first.room_id,
    source_id: first.source_id,
    world_id: first.world_id,
    producer_epoch_ref: first.producer_epoch_ref,
    producer_plane: first.producer_plane,
    subject_ref: first.subject_ref,
    window_started_at: first.occurred_at,
    window_ended_at: latest.observed_at,
    latest_event_sequence: latest.sequence,
    event_counts: eventCounts,
    latest_event_refs: events.slice(-16).map((event) => event.event_id),
    situation: {
      actor,
      inventory,
      hazards,
      focus,
      active_workflow: activeWorkflow,
    },
    changed_fields: [...changed].sort().slice(0, 256),
    derived_from_event_refs: events.map((event) => event.event_id),
    derived_from_snapshot_refs: [...snapshotRefs].slice(0, 128),
    observed_at: latest.observed_at,
    provenance_valid: true,
    raw_events_included: false,
    content_role: "environment_situation_digest_not_assistant_answer" as const,
    reentry_required: true as const,
    answer_authority: false as const,
    assistant_answer: false as const,
    terminal_eligible: false as const,
    raw_content_included: false as const,
  };
  return helixEnvironmentSituationDigestSchema.parse({
    ...withoutHash,
    digest_hash: environmentConnectorSha256(withoutHash),
  });
};

const latestActionManifestIdentity = async (
  db: Queryable,
  claim: EnvironmentActionConnectorClaim,
): Promise<ActionManifestIdentityRow | null> => {
  const selected = await db.query<ActionManifestIdentityRow>(
    `SELECT manifest_id, producer_epoch_ref, domain, domain_adapter,
            status, expires_at
     FROM helix_environment_action_connector_manifests
     WHERE action_authority_id = $1
       AND environment_binding_id = $2
       AND connector_installation_id = $3
       AND status = 'active'
       AND (expires_at IS NULL OR expires_at > now())
     ORDER BY received_at DESC
     LIMIT 1;`,
    [
      claim.authorityId,
      claim.environmentBindingId,
      claim.connectorInstallationId,
    ],
  );
  return selected.rows[0] ?? null;
};

const parseStoredEvents = (rows: StoredEventRow[]): HelixEnvironmentEvent[] =>
  rows.flatMap((row) => {
    const parsed = helixEnvironmentEventSchema.safeParse(
      parseJson(row.event_payload, null),
    );
    return parsed.success ? [parsed.data] : [];
  });

export const recordEnvironmentActionEventBatch = async (input: {
  claim: EnvironmentActionConnectorClaim;
  batch: unknown;
  withTransaction?: EnvironmentEventTransactionRunner;
}): Promise<{
  batch: HelixEnvironmentEventBatch;
  digest: HelixEnvironmentSituationDigest;
  replayed: boolean;
}> => {
  const parsed = helixEnvironmentEventBatchSchema.safeParse(input.batch);
  if (!parsed.success) {
    throw new EnvironmentActionBrokerError(
      "action_event_invalid",
      400,
      "The environment event batch failed its typed contract.",
    );
  }
  const batch = parsed.data;
  if (
    environmentConnectorSha256(environmentEventBatchContent(batch)) !==
    batch.batch_hash
  ) {
    throw new EnvironmentActionBrokerError(
      "action_event_invalid",
      400,
      "The environment event batch content hash is invalid.",
    );
  }

  const transact = input.withTransaction ?? withSharedRealtimeRoomTransaction;
  const recorded = await transact(async (db) => {
    const manifest = await latestActionManifestIdentity(db, input.claim);
    const identityValid =
      manifest &&
      manifest.producer_epoch_ref === batch.producer_epoch_ref &&
      manifest.domain === "minecraft" &&
      manifest.domain_adapter === input.claim.actionDomainAdapter &&
      batch.producer_plane === "player_embodiment" &&
      batch.room_id === input.claim.roomId &&
      batch.source_id === input.claim.sourceId &&
      batch.world_id === input.claim.worldId &&
      batch.events.every(
        (event) =>
          event.domain === "minecraft" &&
          event.domain_adapter === input.claim.actionDomainAdapter &&
          event.subject_ref === input.claim.subjectBindingId,
      );
    if (!identityValid || !manifest) {
      throw new EnvironmentActionBrokerError(
        "action_event_invalid",
        403,
        "The event batch does not match the current player, room, world, connector, or producer epoch.",
      );
    }

    const existing = await db.query<{
      batch_hash: string;
      producer_epoch_ref: string;
      last_sequence: number | string;
    }>(
      `SELECT batch_hash, producer_epoch_ref, last_sequence
       FROM helix_environment_event_batches
       WHERE batch_id = $1
       LIMIT 1;`,
      [batch.batch_id],
    );
    if (existing.rows[0]) {
      if (
        existing.rows[0].batch_hash !== batch.batch_hash ||
        existing.rows[0].producer_epoch_ref !== batch.producer_epoch_ref ||
        Number(existing.rows[0].last_sequence) !== batch.last_sequence
      ) {
        throw new EnvironmentActionBrokerError(
          "action_event_conflict",
          409,
          "The event batch identity was reused with different content.",
        );
      }
      const digest = await db.query<StoredDigestRow>(
        `SELECT digest_payload, digest_hash, provenance_valid, observed_at
         FROM helix_environment_situation_digests
         WHERE environment_binding_id = $1
           AND producer_epoch_ref = $2
           AND subject_ref = $3
           AND latest_event_sequence = $4
         ORDER BY observed_at DESC LIMIT 1;`,
        [
          input.claim.environmentBindingId,
          batch.producer_epoch_ref,
          input.claim.subjectBindingId,
          batch.last_sequence,
        ],
      );
      const stored = helixEnvironmentSituationDigestSchema.safeParse(
        parseJson(digest.rows[0]?.digest_payload, null),
      );
      if (!stored.success) {
        throw new EnvironmentActionBrokerError(
          "action_event_conflict",
          409,
          "The replayed batch no longer has its derived situation digest.",
        );
      }
      return { batch, digest: stored.data, replayed: true };
    }

    const previous = await db.query<{ sequence: number | string }>(
      `SELECT sequence
       FROM helix_environment_events
       WHERE environment_binding_id = $1 AND producer_epoch_ref = $2
       ORDER BY sequence DESC LIMIT 1;`,
      [input.claim.environmentBindingId, batch.producer_epoch_ref],
    );
    const expectedFirst = previous.rows[0]
      ? Number(previous.rows[0].sequence) + 1
      : 0;
    if (batch.first_sequence !== expectedFirst) {
      throw new EnvironmentActionBrokerError(
        "action_event_conflict",
        409,
        `The event stream expected sequence ${expectedFirst}, not ${batch.first_sequence}.`,
      );
    }

    await db.query(
      `INSERT INTO helix_environment_event_batches (
         batch_id, environment_binding_id, connector_manifest_id,
         room_id, source_id, world_id, producer_epoch_ref, producer_plane,
         first_sequence, last_sequence, batch_hash, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`,
      [
        batch.batch_id,
        input.claim.environmentBindingId,
        manifest.manifest_id,
        batch.room_id,
        batch.source_id,
        batch.world_id,
        batch.producer_epoch_ref,
        batch.producer_plane,
        batch.first_sequence,
        batch.last_sequence,
        batch.batch_hash,
        batch.created_at,
      ],
    );
    for (const event of batch.events) {
      await db.query(
        `INSERT INTO helix_environment_events (
           event_id, batch_id, environment_binding_id, producer_epoch_ref,
           producer_plane, sequence, event_type, subject_ref, workflow_ref,
           provenance, event_payload, event_hash, occurred_at, observed_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14
         );`,
        [
          event.event_id,
          batch.batch_id,
          input.claim.environmentBindingId,
          event.producer_epoch_ref,
          event.producer_plane,
          event.sequence,
          event.event_type,
          event.subject_ref,
          event.workflow_ref,
          event.provenance,
          JSON.stringify(event),
          environmentConnectorSha256(event),
          event.occurred_at,
          event.observed_at,
        ],
      );
    }

    const selected = await db.query<StoredEventRow>(
      `SELECT event_payload
       FROM helix_environment_events
       WHERE environment_binding_id = $1
         AND producer_epoch_ref = $2
         AND subject_ref = $3
       ORDER BY sequence DESC
       LIMIT $4;`,
      [
        input.claim.environmentBindingId,
        batch.producer_epoch_ref,
        input.claim.subjectBindingId,
        DIGEST_EVENT_WINDOW,
      ],
    );
    const events = parseStoredEvents(selected.rows).reverse();
    if (events.length === 0) {
      throw new EnvironmentActionBrokerError(
        "action_event_invalid",
        500,
        "The admitted event batch could not be read back for digest construction.",
      );
    }
    const digest = buildEnvironmentSituationDigest({
      environmentBindingId: input.claim.environmentBindingId,
      events,
    });
    await db.query(
      `INSERT INTO helix_environment_situation_digests (
         digest_id, environment_binding_id, room_id, source_id, world_id,
         producer_epoch_ref, producer_plane, subject_ref, window_started_at,
         window_ended_at, latest_event_sequence, digest_payload, digest_hash,
         provenance_valid, observed_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
         $12::jsonb, $13, $14, $15
       ) ON CONFLICT (digest_id) DO NOTHING;`,
      [
        digest.digest_id,
        input.claim.environmentBindingId,
        digest.room_id,
        digest.source_id,
        digest.world_id,
        digest.producer_epoch_ref,
        digest.producer_plane,
        digest.subject_ref,
        digest.window_started_at,
        digest.window_ended_at,
        digest.latest_event_sequence,
        JSON.stringify(digest),
        digest.digest_hash,
        digest.provenance_valid,
        digest.observed_at,
      ],
    );
    return { batch, digest, replayed: false };
  });
  if (!recorded.replayed) {
    publishEnvironmentSituationDigestRecorded({
      environment_binding_id: input.claim.environmentBindingId,
      digest: recorded.digest,
    });
  }
  return recorded;
};

const worldEventSnapshot = (
  event: HelixWorldEvent,
): Record<string, unknown> | null => {
  const snapshot = event.meta?.snapshot ?? event.meta?.environment_state_snapshot;
  return isRecord(snapshot) ? snapshot : null;
};

export const resolveWorldAuthoritySubjectNativeId = (
  event: HelixWorldEvent,
): string | null =>
  boundedIdentifier(worldEventSnapshot(event)?.stable_actor_id) ??
  boundedIdentifier(event.actor_id);

export const normalizeWorldAuthorityEventAttributes = (
  event: HelixWorldEvent,
): Record<string, unknown> => {
  const attributes: Record<string, unknown> = {};
  const snapshot = worldEventSnapshot(event);
  const snapshotActor = isRecord(snapshot?.actor_state)
    ? snapshot.actor_state
    : {};
  const actor: Record<string, unknown> = { ...snapshotActor };
  if (event.actor_label?.trim()) actor.label = event.actor_label.trim();
  if (isRecord(event.location)) actor.position = event.location;
  if (isRecord(event.health_delta)) actor.health_delta = event.health_delta;
  if (Object.keys(actor).length > 0) attributes.actor = actor;
  const snapshotInventory = isRecord(snapshot?.inventory_state)
    ? snapshot.inventory_state
    : null;
  if (snapshotInventory) attributes.inventory = { ...snapshotInventory };
  if (isRecord(event.inventory_delta)) {
    attributes.inventory = {
      ...(isRecord(attributes.inventory) ? attributes.inventory : {}),
      delta: event.inventory_delta,
    };
  }
  const snapshotObjectState = isRecord(snapshot?.object_state)
    ? snapshot.object_state
    : null;
  if (Array.isArray(snapshotObjectState?.hazards)) {
    attributes.hazards = { observed: snapshotObjectState.hazards };
  } else if (isRecord(event.meta?.hazards)) {
    attributes.hazards = event.meta.hazards;
  }
  if (isRecord(snapshot?.focus)) attributes.focus = snapshot.focus;
  else if (isRecord(event.meta?.focus)) attributes.focus = event.meta.focus;
  if (isRecord(event.meta?.active_workflow)) {
    attributes.active_workflow = event.meta.active_workflow;
  }
  const snapshotId = boundedIdentifier(snapshot?.snapshot_id);
  if (snapshotId) attributes.snapshot_refs = [snapshotId];
  if (isRecord(event.objective_delta)) {
    attributes.objective_delta = event.objective_delta;
  }
  if (Array.isArray(event.entities)) {
    attributes.entity_count = event.entities.length;
  }
  return attributes;
};

/**
 * Normalizes the existing protected room-source world-event lane into the
 * same immutable evidence ledger used by the player companion. The source
 * never chooses ledger sequence numbers, environment binding ids, subject
 * bindings, digest identity or answer authority.
 */
export const recordWorldAuthorityEventBatch = async (input: {
  claim: RoomSourceIngressRequestClaim;
  adapterAdmission: HelixEnvironmentAdapterAdmissionProjection;
  sourceAdmission: HelixRoomSourceAdmission;
  events: HelixWorldEvent[];
  withTransaction?: EnvironmentEventTransactionRunner;
}): Promise<{
  batch: HelixEnvironmentEventBatch;
  digests: HelixEnvironmentSituationDigest[];
  replayed: boolean;
}> => {
  if (input.events.length < 1 || input.events.length > 512) {
    throw new EnvironmentActionBrokerError(
      "action_event_invalid",
      400,
      "A world-authority event batch must contain between 1 and 512 events.",
    );
  }
  const transact = input.withTransaction ?? withSharedRealtimeRoomTransaction;
  let committedEnvironmentBindingId: string | null = null;
  const recorded = await transact(async (db) => {
    const binding = await db.query<{ environment_binding_id: string }>(
      `SELECT environment_binding_id
       FROM helix_environment_connector_bindings
       WHERE room_source_binding_id = $1 AND adapter_admission_id = $2
         AND room_id = $3 AND source_id = $4 AND world_id = $5
         AND status = 'active'
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 1;`,
      [
        input.claim.binding.binding_id,
        input.adapterAdmission.admission_id,
        input.claim.binding.room_id,
        input.claim.binding.source_id,
        input.claim.binding.world_id,
      ],
    );
    const environmentBindingId = binding.rows[0]?.environment_binding_id;
    if (!environmentBindingId) {
      throw new EnvironmentActionBrokerError(
        "action_event_invalid",
        409,
        "The admitted room source has no active environment connector binding.",
      );
    }
    committedEnvironmentBindingId = environmentBindingId;

    const priorBatchId = `environment_event_batch:world:${crypto
      .createHash("sha256")
      .update(
        `${input.claim.binding.binding_id}\n${input.claim.requestProjectionId}`,
        "utf8",
      )
      .digest("hex")
      .slice(0, 48)}`;
    const existing = await db.query<{ batch_hash: string }>(
      `SELECT batch_hash FROM helix_environment_event_batches
       WHERE batch_id = $1 LIMIT 1;`,
      [priorBatchId],
    );
    if (existing.rows[0]) {
      const stored = await db.query<StoredDigestRow>(
        `SELECT digest_payload, digest_hash, provenance_valid, observed_at
         FROM helix_environment_situation_digests
         WHERE environment_binding_id = $1
           AND producer_epoch_ref = $2
           AND producer_plane = 'world_authority'
         ORDER BY observed_at DESC
         LIMIT 32;`,
        [environmentBindingId, input.adapterAdmission.producer_epoch_ref],
      );
      const digests = stored.rows.flatMap((row) => {
        const parsed = helixEnvironmentSituationDigestSchema.safeParse(
          parseJson(row.digest_payload, null),
        );
        return parsed.success ? [parsed.data] : [];
      });
      if (digests.length === 0) {
        throw new EnvironmentActionBrokerError(
          "action_event_conflict",
          409,
          "The replayed world-event batch no longer has a derived digest.",
        );
      }
      const rows = await db.query<StoredEventRow>(
        `SELECT event_payload FROM helix_environment_events
         WHERE batch_id = $1 ORDER BY sequence;`,
        [priorBatchId],
      );
      const events = parseStoredEvents(rows.rows);
      const replayBatch = helixEnvironmentEventBatchSchema.parse({
        schema: "helix.environment_event_batch.v1",
        batch_id: priorBatchId,
        room_id: input.claim.binding.room_id,
        source_id: input.claim.binding.source_id,
        world_id: input.claim.binding.world_id,
        producer_epoch_ref: input.adapterAdmission.producer_epoch_ref,
        producer_plane: "world_authority",
        first_sequence: events[0].sequence,
        last_sequence: events[events.length - 1].sequence,
        events,
        batch_hash: existing.rows[0].batch_hash,
        created_at: events[0].observed_at,
        content_role: "environment_event_batch_not_assistant_answer",
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      });
      return { batch: replayBatch, digests, replayed: true };
    }

    const previous = await db.query<{ sequence: number | string }>(
      `SELECT sequence FROM helix_environment_events
       WHERE environment_binding_id = $1 AND producer_epoch_ref = $2
       ORDER BY sequence DESC LIMIT 1;`,
      [environmentBindingId, input.adapterAdmission.producer_epoch_ref],
    );
    const firstSequence = previous.rows[0]
      ? Number(previous.rows[0].sequence) + 1
      : 0;
    const subjects = await db.query<{
      subject_binding_id: string;
      subject_native_id: string;
    }>(
      `SELECT subject_binding_id, subject_native_id
       FROM helix_room_environment_subject_bindings
       WHERE environment_binding_id = $1 AND room_id = $2
         AND source_id = $3 AND world_id = $4 AND status = 'active'
         AND producer_epoch_ref = $5;`,
      [
        environmentBindingId,
        input.claim.binding.room_id,
        input.claim.binding.source_id,
        input.claim.binding.world_id,
        input.adapterAdmission.producer_epoch_ref,
      ],
    );
    const subjectByNativeId = new Map(
      subjects.rows.map((row) => [
        row.subject_native_id.trim().toLowerCase(),
        row.subject_binding_id,
      ]),
    );
    const observedAt = new Date().toISOString();
    const events = input.events.map((event, index): HelixEnvironmentEvent => {
      const sequence = firstSequence + index;
      const eventKey = crypto
        .createHash("sha256")
        .update(
          `${input.claim.binding.binding_id}\n${input.claim.requestProjectionId}\n${index}`,
          "utf8",
        )
        .digest("hex")
        .slice(0, 48);
      const subjectNativeId = resolveWorldAuthoritySubjectNativeId(event);
      const subjectRef = subjectNativeId
        ? subjectByNativeId.get(subjectNativeId.toLowerCase()) ?? null
        : null;
      const workflowRef = boundedIdentifier(event.meta?.workflow_ref);
      return helixEnvironmentEventSchema.parse({
        schema: "helix.environment_event.v1",
        event_id: `environment_event:world:${eventKey}`,
        sequence,
        event_type: event.event_type,
        producer_plane: "world_authority",
        domain: "minecraft",
        domain_adapter: input.claim.binding.domain_adapter,
        room_id: input.claim.binding.room_id,
        source_id: input.claim.binding.source_id,
        world_id: input.claim.binding.world_id,
        producer_epoch_ref: input.adapterAdmission.producer_epoch_ref,
        subject_ref: subjectRef,
        workflow_ref: workflowRef,
        summary: (
          event.text?.trim() || `Minecraft world event: ${event.event_type}`
        ).slice(0, 2_000),
        attributes: normalizeWorldAuthorityEventAttributes(event),
        evidence_refs: [
          ...new Set(
            [
              ...event.evidence_refs,
              ...input.sourceAdmission.evidence_refs,
            ].map(evidenceReference),
          ),
        ].slice(0, 128),
        occurred_at: new Date(event.ts).toISOString(),
        observed_at: observedAt,
        provenance: "reported",
        raw_event_included: false,
        content_role: "environment_event_not_assistant_answer",
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      });
    });
    const content = {
      schema: "helix.environment_event_batch.v1" as const,
      batch_id: priorBatchId,
      room_id: input.claim.binding.room_id,
      source_id: input.claim.binding.source_id,
      world_id: input.claim.binding.world_id,
      producer_epoch_ref: input.adapterAdmission.producer_epoch_ref,
      producer_plane: "world_authority" as const,
      first_sequence: firstSequence,
      last_sequence: firstSequence + events.length - 1,
      events,
      created_at: observedAt,
      content_role: "environment_event_batch_not_assistant_answer" as const,
      answer_authority: false as const,
      assistant_answer: false as const,
      terminal_eligible: false as const,
      raw_content_included: false as const,
    };
    const batch = helixEnvironmentEventBatchSchema.parse({
      ...content,
      batch_hash: environmentConnectorSha256(content),
    });
    await db.query(
      `INSERT INTO helix_environment_event_batches (
         batch_id, environment_binding_id, connector_manifest_id, room_id,
         source_id, world_id, producer_epoch_ref, producer_plane,
         first_sequence, last_sequence, batch_hash, created_at
       ) VALUES ($1, $2, NULL, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
      [
        batch.batch_id,
        environmentBindingId,
        batch.room_id,
        batch.source_id,
        batch.world_id,
        batch.producer_epoch_ref,
        batch.producer_plane,
        batch.first_sequence,
        batch.last_sequence,
        batch.batch_hash,
        batch.created_at,
      ],
    );
    for (const event of batch.events) {
      await db.query(
        `INSERT INTO helix_environment_events (
           event_id, batch_id, environment_binding_id, producer_epoch_ref,
           producer_plane, sequence, event_type, subject_ref, workflow_ref,
           provenance, event_payload, event_hash, occurred_at, observed_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14
         );`,
        [
          event.event_id,
          batch.batch_id,
          environmentBindingId,
          event.producer_epoch_ref,
          event.producer_plane,
          event.sequence,
          event.event_type,
          event.subject_ref,
          event.workflow_ref,
          event.provenance,
          JSON.stringify(event),
          environmentConnectorSha256(event),
          event.occurred_at,
          event.observed_at,
        ],
      );
    }

    const subjectRefs = [
      ...new Set(batch.events.map((event) => event.subject_ref)),
    ];
    const digests: HelixEnvironmentSituationDigest[] = [];
    for (const subjectRef of subjectRefs) {
      const selected = await db.query<StoredEventRow>(
        `SELECT event_payload FROM helix_environment_events
         WHERE environment_binding_id = $1 AND producer_epoch_ref = $2
           AND (($3::text IS NULL AND subject_ref IS NULL) OR subject_ref = $3)
         ORDER BY sequence DESC LIMIT $4;`,
        [
          environmentBindingId,
          batch.producer_epoch_ref,
          subjectRef,
          DIGEST_EVENT_WINDOW,
        ],
      );
      const digestEvents = parseStoredEvents(selected.rows).reverse();
      if (digestEvents.length === 0) continue;
      const digest = buildEnvironmentSituationDigest({
        environmentBindingId,
        events: digestEvents,
      });
      await db.query(
        `INSERT INTO helix_environment_situation_digests (
           digest_id, environment_binding_id, room_id, source_id, world_id,
           producer_epoch_ref, producer_plane, subject_ref, window_started_at,
           window_ended_at, latest_event_sequence, digest_payload, digest_hash,
           provenance_valid, observed_at
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
           $12::jsonb, $13, $14, $15
         ) ON CONFLICT (digest_id) DO NOTHING;`,
        [
          digest.digest_id,
          environmentBindingId,
          digest.room_id,
          digest.source_id,
          digest.world_id,
          digest.producer_epoch_ref,
          digest.producer_plane,
          digest.subject_ref,
          digest.window_started_at,
          digest.window_ended_at,
          digest.latest_event_sequence,
          JSON.stringify(digest),
          digest.digest_hash,
          digest.provenance_valid,
          digest.observed_at,
        ],
      );
      digests.push(digest);
    }
    return { batch, digests, replayed: false };
  });
  if (!recorded.replayed) {
    for (const digest of recorded.digests) {
      publishEnvironmentSituationDigestRecorded({
        environment_binding_id: committedEnvironmentBindingId!,
        digest,
      });
    }
  }
  return recorded;
};

export type EnvironmentSituationDigestReadContext = {
  environmentBindingId: string;
  roomId: string;
  sourceId: string;
  worldId: string;
  participantId: string;
  subjectBindingId: string;
};

export const resolveEnvironmentSituationDigestReadContext = async (input: {
  roomId: string;
  profileId: string;
  environmentBindingId: string;
  participantId: string;
}): Promise<EnvironmentSituationDigestReadContext> => {
  const membership = await readSharedRealtimeRoomMembership({
    roomId: input.roomId,
    profileId: input.profileId,
  });
  if (
    !membership ||
    membership.roomStatus === "closed" ||
    (membership.role !== "owner" &&
      membership.participantId !== input.participantId)
  ) {
    throw new EnvironmentActionBrokerError(
      "action_policy_denied",
      403,
      "The current room member cannot read this participant's environment digest.",
    );
  }
  const db = await readSharedRealtimeRoomDatabase();
  const selected = await db.query<{
    environment_binding_id: string;
    room_id: string;
    source_id: string;
    world_id: string;
    participant_id: string;
    subject_binding_id: string;
  }>(
    `SELECT environment_binding_id, room_id, source_id, world_id,
            participant_id, subject_binding_id
     FROM helix_environment_action_authorities
     WHERE room_id = $1 AND environment_binding_id = $2
       AND participant_id = $3 AND status = 'active'
       AND (expires_at IS NULL OR expires_at > now())
     ORDER BY policy_version DESC, created_at DESC
     LIMIT 1;`,
    [input.roomId, input.environmentBindingId, input.participantId],
  );
  const row = selected.rows[0];
  if (!row) {
    throw new EnvironmentActionBrokerError(
      "action_authority_not_found",
      404,
      "The current participant has no active player embodiment binding for this environment.",
    );
  }
  return {
    environmentBindingId: row.environment_binding_id,
    roomId: row.room_id,
    sourceId: row.source_id,
    worldId: row.world_id,
    participantId: row.participant_id,
    subjectBindingId: row.subject_binding_id,
  };
};

const digestObservation = (input: {
  outcome: HelixEnvironmentSituationDigestObservation["outcome"];
  summary: string;
  digest: HelixEnvironmentSituationDigest | null;
  evidenceRef: string;
}): HelixEnvironmentSituationDigestObservation =>
  helixEnvironmentSituationDigestObservationSchema.parse({
    schema: HELIX_ENVIRONMENT_SITUATION_DIGEST_OBSERVATION_SCHEMA,
    outcome: input.outcome,
    summary: input.summary,
    digest: input.outcome === "fresh" ? input.digest : null,
    evidence_ref: input.evidenceRef,
    observed_at: new Date().toISOString(),
    provenance_valid: input.outcome === "fresh",
    eligible_for_current_turn_reentry: input.outcome === "fresh",
    content_role:
      "environment_situation_digest_observation_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });

export const readLatestEnvironmentSituationDigest = async (input: {
  context: EnvironmentSituationDigestReadContext;
  maxAgeMs: number;
  producerPlane?: "world_authority" | "player_embodiment";
  readDatabase?: () => Promise<Queryable>;
  now?: () => number;
}): Promise<HelixEnvironmentSituationDigestObservation> => {
  const maxAgeMs = Math.max(1_000, Math.min(120_000, input.maxAgeMs));
  const producerPlane = input.producerPlane ?? "player_embodiment";
  const db = await (input.readDatabase ?? readSharedRealtimeRoomDatabase)();
  const selected = await db.query<StoredDigestRow>(
    `SELECT digest_payload, digest_hash, provenance_valid, observed_at
     FROM helix_environment_situation_digests
     WHERE environment_binding_id = $1 AND room_id = $2
       AND source_id = $3 AND world_id = $4
       AND subject_ref = $5 AND producer_plane = $6
     ORDER BY observed_at DESC
     LIMIT 1;`,
    [
      input.context.environmentBindingId,
      input.context.roomId,
      input.context.sourceId,
      input.context.worldId,
      input.context.subjectBindingId,
      producerPlane,
    ],
  );
  const row = selected.rows[0];
  const evidenceRef = row
    ? `environment_situation_digest_evidence:${row.digest_hash.slice("sha256:".length, "sha256:".length + 48)}`
    : `environment_situation_digest_evidence:${crypto.randomUUID()}`;
  if (!row) {
    return digestObservation({
      outcome: "unavailable",
      summary:
        `No typed ${producerPlane.replace("_", "-")} situation digest has been recorded for this room player yet.`,
      digest: null,
      evidenceRef,
    });
  }
  const parsed = helixEnvironmentSituationDigestSchema.safeParse(
    parseJson(row.digest_payload, null),
  );
  if (!parsed.success) {
    return digestObservation({
      outcome: "integrity_failed",
      summary:
        "The latest situation digest failed its stored schema, provenance, or content-hash check.",
      digest: null,
      evidenceRef,
    });
  }
  const digest = parsed.data;
  if (
    !row.provenance_valid ||
    digest.digest_hash !== row.digest_hash ||
    environmentConnectorSha256(environmentSituationDigestContent(digest)) !==
      row.digest_hash
  ) {
    return digestObservation({
      outcome: "integrity_failed",
      summary:
        "The latest situation digest failed its stored schema, provenance, or content-hash check.",
      digest: null,
      evidenceRef,
    });
  }
  if ((input.now?.() ?? Date.now()) - Date.parse(iso(row.observed_at)) > maxAgeMs) {
    return digestObservation({
      outcome: "stale",
      summary:
        `The latest ${producerPlane.replace("_", "-")} situation digest is older than the current turn's freshness requirement.`,
      digest: null,
      evidenceRef,
    });
  }
  return digestObservation({
    outcome: "fresh",
    summary:
      `A fresh provenance-preserving Minecraft ${producerPlane.replace("_", "-")} situation digest is available for Codex reasoning.`,
    digest,
    evidenceRef,
  });
};
