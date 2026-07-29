import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_CATALOG_SNAPSHOT_SCHEMA,
  helixEnvironmentCatalogSnapshotSchema,
  type HelixEnvironmentCapabilityDescriptor,
  type HelixEnvironmentCatalogSnapshot,
} from "@shared/helix-environment-connector";
import type { HelixEnvironmentAdapterAdmissionProjection } from "@shared/helix-environment-adapter-profile";
import { withSharedRealtimeRoomTransaction } from "../../helix-ask/realtime-room/room-store/database";
import type { Queryable } from "../../helix-ask/realtime-room/room-store/types";
import { environmentConnectorSha256 } from "../catalog";

const shortHash = (value: unknown, size = 40): string =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify(value), "utf8")
    .digest("hex")
    .slice(0, size);

export type MaterializedEnvironmentConnectorBinding = {
  packageVersionId: string;
  installationId: string;
  deviceId: string;
  environmentBindingId: string;
  catalogSnapshot: HelixEnvironmentCatalogSnapshot;
};

/**
 * Compatibility bridge for already-paired room-source connectors.
 *
 * The existing source credential remains the transport authority. It is never
 * returned here. This function derives stable inventory identities from
 * server-owned IDs so the legacy Minecraft ingress can enter the generic
 * connector persistence model without pretending it completed the new
 * public-key pairing flow.
 */
export const materializeLegacyRoomSourceConnector = async (input: {
  ownerProfileId: string;
  roomSourceBindingId: string;
  credentialId: string;
  roomId: string;
  sourceId: string;
  worldId: string;
  producerEpochRef: string;
  adapterAdmission: HelixEnvironmentAdapterAdmissionProjection;
  capabilityDescriptors: HelixEnvironmentCapabilityDescriptor[];
}): Promise<MaterializedEnvironmentConnectorBinding> => {
  if (input.capabilityDescriptors.length === 0) {
    throw new Error("environment_connector_capability_catalog_empty");
  }
  const packageVersionId =
    `connector_package_version:legacy:${shortHash([
      input.adapterAdmission.adapter_profile_id,
      input.adapterAdmission.adapter_profile_version,
      input.adapterAdmission.adapter_contract_hash,
    ])}`;
  const packageId =
    `com.casimirbot.legacy.${input.adapterAdmission.source_family}`;
  const installationId =
    `connector_installation:legacy:${shortHash([
      input.ownerProfileId,
      packageVersionId,
    ])}`;
  const deviceId =
    `connector_device:legacy:${shortHash([
      installationId,
      input.roomSourceBindingId,
      input.credentialId,
    ])}`;
  const environmentBindingId =
    `environment_binding:legacy:${shortHash([
      deviceId,
      input.roomSourceBindingId,
      input.adapterAdmission.admission_id,
    ])}`;
  const catalogHash = environmentConnectorSha256({
    environment_binding_id: environmentBindingId,
    adapter_profile_id: input.adapterAdmission.adapter_profile_id,
    adapter_profile_version: input.adapterAdmission.adapter_profile_version,
    adapter_contract_hash: input.adapterAdmission.adapter_contract_hash,
    manifest_hash: input.adapterAdmission.manifest_hash,
    capability_descriptors: input.capabilityDescriptors,
  });
  const catalogSnapshotId =
    `environment_catalog_snapshot:${shortHash([
      environmentBindingId,
      catalogHash,
    ])}`;
  const frozenAt = new Date().toISOString();

  await withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    await db.query(
      `
        INSERT INTO helix_environment_connector_packages (
          package_version_id,
          publisher_id,
          package_id,
          package_version,
          content_hash,
          capability_descriptors,
          trust_classification,
          security_review_state
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'first_party', 'approved')
        ON CONFLICT (package_version_id) DO NOTHING;
      `,
      [
        packageVersionId,
        "publisher:casimirbot",
        packageId,
        `adapter-${input.adapterAdmission.adapter_profile_version}`,
        input.adapterAdmission.adapter_contract_hash,
        JSON.stringify(input.capabilityDescriptors),
      ],
    );
    await db.query(
      `
        INSERT INTO helix_environment_connector_installations (
          installation_id,
          owner_profile_id,
          package_version_id,
          granted_capability_ids
        ) VALUES ($1, $2, $3, $4::jsonb)
        ON CONFLICT (installation_id) DO NOTHING;
      `,
      [
        installationId,
        input.ownerProfileId,
        packageVersionId,
        JSON.stringify(
          input.capabilityDescriptors.map(
            (descriptor) => descriptor.capability_id,
          ),
        ),
      ],
    );
    await db.query(
      `
        INSERT INTO helix_environment_connector_devices (
          device_id,
          installation_id,
          device_public_key_hash,
          credential_ref,
          producer_epoch_ref,
          health_status,
          last_contact_at
        ) VALUES ($1, $2, $3, $4, $5, 'online', now())
        ON CONFLICT (device_id) DO UPDATE
        SET producer_epoch_ref = EXCLUDED.producer_epoch_ref,
            health_status = 'online',
            last_contact_at = now(),
            updated_at = now();
      `,
      [
        deviceId,
        installationId,
        environmentConnectorSha256({
          compatibility_identity: "legacy_room_source_credential",
          credential_id: input.credentialId,
        }),
        input.credentialId,
        input.producerEpochRef,
      ],
    );
    await db.query(
      `
        INSERT INTO helix_environment_connector_bindings (
          environment_binding_id,
          installation_id,
          device_id,
          room_source_binding_id,
          adapter_admission_id,
          owner_profile_id,
          room_id,
          source_id,
          world_id,
          consent_capability_ids
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
        ON CONFLICT (environment_binding_id) DO NOTHING;
      `,
      [
        environmentBindingId,
        installationId,
        deviceId,
        input.roomSourceBindingId,
        input.adapterAdmission.admission_id,
        input.ownerProfileId,
        input.roomId,
        input.sourceId,
        input.worldId,
        JSON.stringify(
          input.capabilityDescriptors.map(
            (descriptor) => descriptor.capability_id,
          ),
        ),
      ],
    );
    await db.query(
      `
        INSERT INTO helix_environment_capability_catalog_snapshots (
          catalog_snapshot_id,
          environment_binding_id,
          catalog_hash,
          adapter_profile_id,
          adapter_profile_version,
          adapter_contract_hash,
          manifest_hash,
          capability_descriptors,
          frozen_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
        ON CONFLICT (catalog_snapshot_id) DO NOTHING;
      `,
      [
        catalogSnapshotId,
        environmentBindingId,
        catalogHash,
        input.adapterAdmission.adapter_profile_id,
        input.adapterAdmission.adapter_profile_version,
        input.adapterAdmission.adapter_contract_hash,
        input.adapterAdmission.manifest_hash,
        JSON.stringify(input.capabilityDescriptors),
        frozenAt,
      ],
    );
  });

  return {
    packageVersionId,
    installationId,
    deviceId,
    environmentBindingId,
    catalogSnapshot: helixEnvironmentCatalogSnapshotSchema.parse({
      schema: HELIX_ENVIRONMENT_CATALOG_SNAPSHOT_SCHEMA,
      catalog_snapshot_id: catalogSnapshotId,
      catalog_hash: catalogHash,
      environment_binding_ref: environmentBindingId,
      connector_installation_ref: installationId,
      device_ref: deviceId,
      adapter_profile_id: input.adapterAdmission.adapter_profile_id,
      adapter_profile_version:
        input.adapterAdmission.adapter_profile_version,
      adapter_contract_hash:
        input.adapterAdmission.adapter_contract_hash,
      manifest_hash: input.adapterAdmission.manifest_hash,
      capability_descriptors: input.capabilityDescriptors,
      frozen_at: frozenAt,
      expires_at: null,
      content_role: "server_owned_capability_catalog",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    }),
  };
};

