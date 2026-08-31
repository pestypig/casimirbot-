import {
  HELIX_ENVIRONMENT_CATALOG_SNAPSHOT_SCHEMA,
  helixEnvironmentCatalogSnapshotSchema,
  type HelixEnvironmentCapabilityDescriptor,
} from "@shared/helix-environment-connector";
import {
  readSharedRealtimeRoomDatabase,
} from "../../helix-ask/realtime-room/room-store/database";
import type {
  MaterializedEnvironmentConnectorBinding,
} from "./legacy-source-bridge";
import { installedDeviceRef } from "../../helix-account/installed-security-store";

type ActiveConnectorRow = {
  environment_binding_id: string;
  installation_id: string;
  installed_device_id: string | null;
  package_version_id: string;
  device_id: string;
  catalog_snapshot_id: string;
  catalog_hash: string;
  adapter_profile_id: string;
  adapter_profile_version: number | string;
  adapter_contract_hash: string;
  manifest_hash: string;
  capability_descriptors: unknown;
  frozen_at: Date | string;
  expires_at: Date | string | null;
};

const parseJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export const listActiveEnvironmentConnectorBindings = async (input: {
  ownerProfileId: string;
  roomId: string;
  roomSourceBindingId: string;
  sourceId: string;
  adapterAdmissionId: string;
  adapterContractHash: string;
  manifestHash: string;
  producerEpochRef: string;
  capabilityId: string;
}): Promise<MaterializedEnvironmentConnectorBinding[]> => {
  const db = await readSharedRealtimeRoomDatabase();
  const result = await db.query<ActiveConnectorRow>(
    `
      SELECT
        b.environment_binding_id,
        b.installation_id,
        i.installed_device_id,
        i.package_version_id,
        b.device_id,
        c.catalog_snapshot_id,
        c.catalog_hash,
        c.adapter_profile_id,
        c.adapter_profile_version,
        c.adapter_contract_hash,
        c.manifest_hash,
        c.capability_descriptors,
        c.frozen_at,
        c.expires_at
      FROM helix_environment_connector_bindings b
      JOIN helix_environment_connector_installations i
        ON i.installation_id = b.installation_id
        AND i.status = 'active'
      JOIN helix_environment_connector_devices d
        ON d.device_id = b.device_id
        AND d.status = 'active'
        AND d.producer_epoch_ref = $8
      LEFT JOIN helix_environment_connector_device_credentials dc
        ON dc.device_id = d.device_id
        AND dc.status = 'active'
        AND dc.expires_at > now()
      JOIN helix_environment_capability_catalog_snapshots c
        ON c.environment_binding_id = b.environment_binding_id
        AND c.adapter_contract_hash = $6
        AND c.manifest_hash = $7
        AND (c.expires_at IS NULL OR c.expires_at > now())
      WHERE b.owner_profile_id = $1
        AND b.room_id = $2
        AND b.room_source_binding_id = $3
        AND b.source_id = $4
        AND b.adapter_admission_id = $5
        AND b.status = 'active'
        AND b.consent_capability_ids @> $9::jsonb
        AND (
          d.device_id LIKE 'connector_device:legacy:%'
          OR dc.device_id IS NOT NULL
        )
      ORDER BY c.frozen_at DESC, b.created_at DESC;
    `,
    [
      input.ownerProfileId,
      input.roomId,
      input.roomSourceBindingId,
      input.sourceId,
      input.adapterAdmissionId,
      input.adapterContractHash,
      input.manifestHash,
      input.producerEpochRef,
      JSON.stringify([input.capabilityId]),
    ],
  );
  return result.rows.flatMap((row) => {
    const descriptors = parseJson(row.capability_descriptors);
    const descriptorList = Array.isArray(descriptors)
      ? (descriptors as HelixEnvironmentCapabilityDescriptor[])
      : [];
    if (
      !descriptorList.some(
        (descriptor) => descriptor.capability_id === input.capabilityId,
      )
    ) {
      return [];
    }
    return [{
      packageVersionId: row.package_version_id,
      installationId: row.installation_id,
      installedNodeRef: row.installed_device_id
        ? installedDeviceRef(row.installed_device_id)
        : "installed_node:unbound",
      deviceId: row.device_id,
      environmentBindingId: row.environment_binding_id,
      catalogSnapshot: helixEnvironmentCatalogSnapshotSchema.parse({
        schema: HELIX_ENVIRONMENT_CATALOG_SNAPSHOT_SCHEMA,
        catalog_snapshot_id: row.catalog_snapshot_id,
        catalog_hash: row.catalog_hash,
        environment_binding_ref: row.environment_binding_id,
        connector_installation_ref: row.installation_id,
        device_ref: row.device_id,
        adapter_profile_id: row.adapter_profile_id,
        adapter_profile_version: Number(row.adapter_profile_version),
        adapter_contract_hash: row.adapter_contract_hash,
        manifest_hash: row.manifest_hash,
        capability_descriptors: descriptorList,
        frozen_at: iso(row.frozen_at),
        expires_at: row.expires_at ? iso(row.expires_at) : null,
        content_role: "server_owned_capability_catalog",
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      }),
    }];
  });
};
