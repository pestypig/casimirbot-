import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_ADAPTER_ADMISSION_SCHEMA,
  helixEnvironmentAdapterAdmissionProjectionSchema,
  type HelixEnvironmentAdapterAdmissionProjection,
} from "@shared/helix-environment-adapter-profile";
import type { HelixEnvironmentSourceManifest } from "@shared/helix-environment-source-manifest";
import {
  RoomSourceIngressError,
  type RoomSourceIngressRequestClaim,
} from "../helix-ask/realtime-room/source-link-store";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../helix-ask/realtime-room/room-store/database";
import type { Queryable } from "../helix-ask/realtime-room/room-store/types";
import {
  assertEnvironmentAdapterManifest,
  isEnvironmentAdapterRegistryError,
  readEnvironmentAdapterProfileById,
  resolveEnvironmentAdapterProfile,
} from "./environment-adapter-registry";

export type EnvironmentAdapterAdmissionRow = {
  admission_id: string;
  binding_id: string;
  credential_id: string;
  producer_epoch: string;
  room_id: string;
  source_id: string;
  world_id: string;
  domain_adapter: string;
  adapter_profile_id: string;
  adapter_profile_version: number | string;
  adapter_contract_hash: string;
  manifest_id: string;
  manifest_hash: string;
  source_family: string;
  mechanics_collection_ids: unknown;
  status: string;
  admitted_at: Date | string;
  updated_at: Date | string;
  revoked_at: Date | string | null;
};

const sha256 = (value: string): string =>
  crypto.createHash("sha256").update(value, "utf8").digest("hex");

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const mechanicsCollectionIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .filter(
              (entry: unknown): entry is string => typeof entry === "string",
            )
            .map((entry: string) => entry.trim())
            .filter(Boolean),
        ),
      )
    : [];

export const projectEnvironmentAdapterProducerEpoch = (input: {
  bindingId: string;
  producerEpoch: string;
}): string =>
  `adapter_epoch:${sha256(`${input.bindingId}\n${input.producerEpoch}`).slice(
    0,
    40,
  )}`;

export const projectEnvironmentAdapterAdmission = (
  row: EnvironmentAdapterAdmissionRow,
): HelixEnvironmentAdapterAdmissionProjection =>
  helixEnvironmentAdapterAdmissionProjectionSchema.parse({
    schema: HELIX_ENVIRONMENT_ADAPTER_ADMISSION_SCHEMA,
    admission_id: row.admission_id,
    adapter_profile_id: row.adapter_profile_id,
    adapter_profile_version: Number(row.adapter_profile_version),
    adapter_contract_hash: row.adapter_contract_hash,
    manifest_id: row.manifest_id,
    manifest_hash: row.manifest_hash,
    producer_epoch_ref: projectEnvironmentAdapterProducerEpoch({
      bindingId: row.binding_id,
      producerEpoch: row.producer_epoch,
    }),
    source_family: row.source_family,
    mechanics_collection_ids: mechanicsCollectionIds(
      row.mechanics_collection_ids,
    ),
    admitted_at: iso(row.admitted_at),
    content_role: "adapter_admission_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });

const registryError = (error: unknown): RoomSourceIngressError => {
  if (isEnvironmentAdapterRegistryError(error)) {
    return new RoomSourceIngressError(
      error.code,
      error.code === "environment_adapter_disabled" ||
        error.code === "environment_adapter_contract_changed"
        ? 409
        : 400,
      error.message,
    );
  }
  return new RoomSourceIngressError(
    "room_source_unavailable",
    503,
    "The environment adapter registry is unavailable.",
  );
};

const readExactAdmission = async (
  db: Queryable,
  input: {
    bindingId: string;
    credentialId: string;
    producerEpoch: string;
  },
): Promise<EnvironmentAdapterAdmissionRow | null> => {
  const { rows } = await db.query<EnvironmentAdapterAdmissionRow>(
    `
      SELECT a.*
      FROM helix_environment_adapter_admissions a
      JOIN helix_room_source_bindings b
        ON b.binding_id = a.binding_id
        AND b.status = 'active'
      JOIN helix_room_source_credentials c
        ON c.credential_id = a.credential_id
        AND c.binding_id = a.binding_id
        AND c.status = 'active'
        AND c.expires_at > now()
      WHERE a.binding_id = $1
        AND a.credential_id = $2
        AND a.producer_epoch = $3
        AND a.status = 'active'
      ORDER BY a.admitted_at DESC
      LIMIT 1;
    `,
    [input.bindingId, input.credentialId, input.producerEpoch],
  );
  return rows[0] ?? null;
};

const assertAdmissionRegistryCurrent = (
  row: EnvironmentAdapterAdmissionRow,
): void => {
  let record;
  try {
    record = resolveEnvironmentAdapterProfile({
      domainAdapter: row.domain_adapter,
      worldId: row.world_id,
    });
  } catch (error) {
    throw registryError(error);
  }
  if (
    record.profile.profile_id !== row.adapter_profile_id ||
    record.profile.profile_version !== Number(row.adapter_profile_version) ||
    record.contract_hash !== row.adapter_contract_hash
  ) {
    throw new RoomSourceIngressError(
      "environment_adapter_contract_changed",
      409,
      "The adapter profile changed after this producer was admitted; submit a new manifest admission.",
    );
  }
};

export const recordEnvironmentAdapterAdmission = async (input: {
  claim: RoomSourceIngressRequestClaim;
  manifest: HelixEnvironmentSourceManifest;
}): Promise<HelixEnvironmentAdapterAdmissionProjection> => {
  let validation;
  try {
    validation = assertEnvironmentAdapterManifest({
      manifest: input.manifest,
      worldId: input.claim.binding.world_id,
    });
  } catch (error) {
    throw registryError(error);
  }
  const mechanicsIds = validation.record.profile.mechanics_collections.map(
    (collection: { collection_id: string }) => collection.collection_id,
  );
  const row = await withSharedRealtimeRoomTransaction(
    async (db: Queryable): Promise<EnvironmentAdapterAdmissionRow> => {
      const { rows: identityRows } = await db.query<{
        binding_id: string;
      }>(
        `
          SELECT b.binding_id
          FROM helix_room_source_bindings b
          JOIN helix_room_source_credentials c
            ON c.binding_id = b.binding_id
            AND c.credential_id = $2
            AND c.status = 'active'
            AND c.expires_at > now()
          WHERE b.binding_id = $1
            AND b.status = 'active'
            AND b.room_id = $3
            AND b.source_id = $4
            AND b.world_id = $5
            AND b.domain_adapter = $6
          FOR UPDATE;
        `,
        [
          input.claim.binding.binding_id,
          input.claim.credentialId,
          input.claim.binding.room_id,
          input.claim.binding.source_id,
          input.claim.binding.world_id,
          input.claim.binding.domain_adapter,
        ],
      );
      if (!identityRows[0]) {
        throw new RoomSourceIngressError(
          "environment_adapter_identity_mismatch",
          409,
          "The manifest admission no longer matches an active source binding and credential.",
        );
      }

      const existing = await readExactAdmission(db, {
        bindingId: input.claim.binding.binding_id,
        credentialId: input.claim.credentialId,
        producerEpoch: input.claim.producerEpoch,
      });
      if (
        existing &&
        existing.manifest_hash === validation.manifest_hash &&
        existing.adapter_contract_hash === validation.record.contract_hash
      ) {
        return existing;
      }

      await db.query(
        `
          UPDATE helix_environment_adapter_admissions
          SET status = 'superseded', updated_at = now(), revoked_at = now()
          WHERE binding_id = $1
            AND credential_id = $2
            AND status = 'active';
        `,
        [input.claim.binding.binding_id, input.claim.credentialId],
      );
      const admissionId = `environment_adapter_admission:${crypto.randomUUID()}`;
      const { rows } = await db.query<EnvironmentAdapterAdmissionRow>(
        `
          INSERT INTO helix_environment_adapter_admissions (
            admission_id,
            binding_id,
            credential_id,
            producer_epoch,
            room_id,
            source_id,
            world_id,
            domain_adapter,
            adapter_profile_id,
            adapter_profile_version,
            adapter_contract_hash,
            manifest_id,
            manifest_hash,
            source_family,
            mechanics_collection_ids
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
            $15::jsonb
          )
          RETURNING *;
        `,
        [
          admissionId,
          input.claim.binding.binding_id,
          input.claim.credentialId,
          input.claim.producerEpoch,
          input.claim.binding.room_id,
          input.claim.binding.source_id,
          input.claim.binding.world_id,
          input.claim.binding.domain_adapter,
          validation.record.profile.profile_id,
          validation.record.profile.profile_version,
          validation.record.contract_hash,
          input.manifest.manifest_id,
          validation.manifest_hash,
          validation.record.profile.source_family,
          JSON.stringify(mechanicsIds),
        ],
      );
      if (!rows[0]) {
        throw new RoomSourceIngressError(
          "room_source_unavailable",
          503,
          "The environment adapter admission could not be persisted.",
        );
      }
      return rows[0];
    },
  );
  return projectEnvironmentAdapterAdmission(row);
};

export const requireEnvironmentAdapterAdmission = async (input: {
  claim: RoomSourceIngressRequestClaim;
}): Promise<HelixEnvironmentAdapterAdmissionProjection> => {
  const db = await readSharedRealtimeRoomDatabase();
  const row = await readExactAdmission(db, {
    bindingId: input.claim.binding.binding_id,
    credentialId: input.claim.credentialId,
    producerEpoch: input.claim.producerEpoch,
  });
  if (!row) {
    throw new RoomSourceIngressError(
      "environment_adapter_admission_required",
      409,
      "Submit and admit a compatible source manifest for this credential and producer epoch before using this ingress lane.",
    );
  }
  assertAdmissionRegistryCurrent(row);
  return projectEnvironmentAdapterAdmission(row);
};

export const revokeEnvironmentAdapterAdmissions = async (input: {
  bindingId: string;
  credentialId?: string | null;
}): Promise<number> => {
  const db = await readSharedRealtimeRoomDatabase();
  const values: unknown[] = [input.bindingId];
  const credentialClause = input.credentialId
    ? (() => {
        values.push(input.credentialId);
        return `AND credential_id = $${values.length}`;
      })()
    : "";
  const { rows } = await db.query<{ admission_id: string }>(
    `
      UPDATE helix_environment_adapter_admissions
      SET status = 'revoked', updated_at = now(), revoked_at = now()
      WHERE binding_id = $1
        ${credentialClause}
        AND status = 'active'
      RETURNING admission_id;
    `,
    values,
  );
  return rows.length;
};

export const validatePersistedEnvironmentAdapterAdmission = (
  projection: HelixEnvironmentAdapterAdmissionProjection,
): boolean => {
  const parsed =
    helixEnvironmentAdapterAdmissionProjectionSchema.safeParse(projection);
  if (!parsed.success) return false;
  const record = readEnvironmentAdapterProfileById(
    projection.adapter_profile_id,
    { includeFixtureProfiles: true },
  );
  return Boolean(
    record &&
    record.profile.profile_version === projection.adapter_profile_version &&
    record.contract_hash === projection.adapter_contract_hash &&
    record.profile.source_family === projection.source_family &&
    projection.mechanics_collection_ids.every((collectionId: string) =>
      record.profile.mechanics_collections.some(
        (collection: { collection_id: string }) =>
          collection.collection_id === collectionId,
      ),
    ),
  );
};
