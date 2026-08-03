import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  HELIX_ENVIRONMENT_ADAPTER_ADMISSION_SCHEMA,
  type HelixEnvironmentAdapterAdmissionProjection,
} from "@shared/helix-environment-adapter-profile";
import { ensureDatabase, getPool } from "../../../../db/client";
import {
  authenticateEnvironmentCommandConnector,
  enqueueEnvironmentCommand,
  leasePendingEnvironmentCommands,
  recordEnvironmentCommandCatalog,
  submitEnvironmentCommandResult,
} from "../../../environment-connectors/commands";
import { materializeLegacyRoomSourceConnector } from
  "../../../environment-connectors/bindings";
import {
  createConnectorBootstrapPairing,
  redeemConnectorBootstrapPairing,
} from "../../../environment-connectors/pairing";
import { listEnvironmentConnectorCapabilityDescriptors } from
  "../../../environment-connectors/catalog";
import { projectEnvironmentAdapterProducerEpoch } from
  "../../../situation-room/environment-adapter-admission-store";
import { resolveEnvironmentAdapterProfile } from
  "../../../situation-room/environment-adapter-registry";
import {
  createReadySharedRealtimeRoom,
  createSharedRealtimeRoomTestApp,
  resetSharedRealtimeRoomRouteTestState,
  signInSharedRealtimeRoomTestAgent,
} from "./route-harness";

const SAME_ORIGIN_HEADERS = {
  Host: "casimirbot.test",
  Origin: "http://casimirbot.test",
  "Sec-Fetch-Site": "same-origin",
};

describe("Shared Realtime room environment command authority", () => {
  beforeEach(async () => {
    vi.stubEnv("HELIX_PUBLIC_ROOMS_EXPERIMENT", "1");
    await resetSharedRealtimeRoomRouteTestState();
  });

  it("lets the owner configure full autonomous authority and a narrower member grant", async () => {
    const app = createSharedRealtimeRoomTestApp();
    const owner = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:command-owner",
      displayName: "Command Owner",
      accountType: "developer",
    });
    const guest = await signInSharedRealtimeRoomTestAgent({
      app,
      profileId: "profile:command-guest",
      displayName: "Command Guest",
      accountType: "developer",
    });
    const roomId = await createReadySharedRealtimeRoom({
      owner,
      guest,
      title: "Minecraft command authority",
    });
    const ownerRoom = await owner.agent
      .get(`/api/agi/realtime/rooms/${encodeURIComponent(roomId)}`)
      .expect(200);
    const guestRoom = await guest.agent
      .get(`/api/agi/realtime/rooms/${encodeURIComponent(roomId)}`)
      .expect(200);
    const ownerParticipantId = ownerRoom.body.room.self_participant_id as string;
    const guestParticipantId = guestRoom.body.room.self_participant_id as string;

    await ensureDatabase();
    const bindingId = "room_source_binding:command-authority-route";
    const credentialId = "room_source_credential:command-authority-route";
    const sourceId = "source:room-ingress:command-authority-route";
    const worldId = "minecraft:local:command-authority-route";
    const domainAdapter = "minecraft.fabric_mod.v1";
    const producerEpoch = "command-authority-route-epoch";
    const producerEpochRef = projectEnvironmentAdapterProducerEpoch({
      bindingId,
      producerEpoch,
    });
    const adapter = resolveEnvironmentAdapterProfile({
      domainAdapter,
      worldId,
    });
    const admission: HelixEnvironmentAdapterAdmissionProjection = {
      schema: HELIX_ENVIRONMENT_ADAPTER_ADMISSION_SCHEMA,
      admission_id: "environment_adapter_admission:command-authority-route",
      adapter_profile_id: adapter.profile.profile_id,
      adapter_profile_version: adapter.profile.profile_version,
      adapter_contract_hash: adapter.contract_hash,
      manifest_id: "manifest:command-authority-route",
      manifest_hash: `sha256:${"a".repeat(64)}`,
      producer_epoch_ref: producerEpochRef,
      source_family: adapter.profile.source_family,
      mechanics_collection_ids: adapter.profile.mechanics_collections.map(
        (entry) => entry.collection_id,
      ),
      admitted_at: new Date().toISOString(),
      content_role: "adapter_admission_not_assistant_answer",
      reentry_required: true,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    const db = getPool();
    await db.query(
      `
        INSERT INTO helix_room_source_bindings (
          binding_id, room_id, owner_profile_id, source_id, world_id,
          domain_adapter, source_label, scopes
        ) VALUES ($1, $2, $3, $4, $5, $6, 'Local Fabric', '[]'::jsonb);
      `,
      [bindingId, roomId, owner.profileId, sourceId, worldId, domainAdapter],
    );
    await db.query(
      `
        INSERT INTO helix_room_source_credentials (
          credential_id, binding_id, token_hash, token_prefix, expires_at
        ) VALUES ($1, $2, $3, 'test-only', $4);
      `,
      [
        credentialId,
        bindingId,
        crypto.createHash("sha256").update("test-only").digest("hex"),
        new Date(Date.now() + 60_000).toISOString(),
      ],
    );
    await db.query(
      `
        INSERT INTO helix_environment_adapter_admissions (
          admission_id, binding_id, credential_id, producer_epoch, room_id,
          source_id, world_id, domain_adapter, adapter_profile_id,
          adapter_profile_version, adapter_contract_hash, manifest_id,
          manifest_hash, source_family, mechanics_collection_ids, admitted_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15::jsonb, $16
        );
      `,
      [
        admission.admission_id,
        bindingId,
        credentialId,
        producerEpoch,
        roomId,
        sourceId,
        worldId,
        domainAdapter,
        admission.adapter_profile_id,
        admission.adapter_profile_version,
        admission.adapter_contract_hash,
        admission.manifest_id,
        admission.manifest_hash,
        admission.source_family,
        JSON.stringify(admission.mechanics_collection_ids),
        admission.admitted_at,
      ],
    );
    const connector = await materializeLegacyRoomSourceConnector({
      ownerProfileId: owner.profileId,
      roomSourceBindingId: bindingId,
      credentialId,
      roomId,
      sourceId,
      worldId,
      producerEpochRef,
      adapterAdmission: admission,
      capabilityDescriptors: listEnvironmentConnectorCapabilityDescriptors({
        adapterProfileId: admission.adapter_profile_id,
      }),
    });
    const restartedProducerEpoch = `${producerEpoch}-restarted`;
    const restartedProducerEpochRef = projectEnvironmentAdapterProducerEpoch({
      bindingId,
      producerEpoch: restartedProducerEpoch,
    });
    const restartedAdmission: HelixEnvironmentAdapterAdmissionProjection = {
      ...admission,
      admission_id: `${admission.admission_id}-restarted`,
      manifest_id: `${admission.manifest_id}-restarted`,
      manifest_hash: `sha256:${"c".repeat(64)}`,
      producer_epoch_ref: restartedProducerEpochRef,
      admitted_at: new Date().toISOString(),
    };
    await db.query(
      `
        INSERT INTO helix_environment_adapter_admissions (
          admission_id, binding_id, credential_id, producer_epoch, room_id,
          source_id, world_id, domain_adapter, adapter_profile_id,
          adapter_profile_version, adapter_contract_hash, manifest_id,
          manifest_hash, source_family, mechanics_collection_ids, admitted_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15::jsonb, $16
        );
      `,
      [
        restartedAdmission.admission_id,
        bindingId,
        credentialId,
        restartedProducerEpoch,
        roomId,
        sourceId,
        worldId,
        domainAdapter,
        restartedAdmission.adapter_profile_id,
        restartedAdmission.adapter_profile_version,
        restartedAdmission.adapter_contract_hash,
        restartedAdmission.manifest_id,
        restartedAdmission.manifest_hash,
        restartedAdmission.source_family,
        JSON.stringify(restartedAdmission.mechanics_collection_ids),
        restartedAdmission.admitted_at,
      ],
    );
    const restartedConnector = await materializeLegacyRoomSourceConnector({
      ownerProfileId: owner.profileId,
      roomSourceBindingId: bindingId,
      credentialId,
      roomId,
      sourceId,
      worldId,
      producerEpochRef: restartedProducerEpochRef,
      adapterAdmission: restartedAdmission,
      capabilityDescriptors: listEnvironmentConnectorCapabilityDescriptors({
        adapterProfileId: restartedAdmission.adapter_profile_id,
      }),
    });
    expect(restartedConnector.environmentBindingId).toBe(
      connector.environmentBindingId,
    );
    const authorityPath =
      `/api/agi/realtime/rooms/${encodeURIComponent(roomId)}` +
      `/environments/${encodeURIComponent(connector.environmentBindingId)}` +
      "/command-authority";

    const absent = await guest.agent
      .get(authorityPath)
      .set(SAME_ORIGIN_HEADERS)
      .expect(200);
    expect(absent.body).toMatchObject({
      ok: true,
      authority: null,
      member_grant: null,
      command_credential_included: false,
    });

    await guest.agent
      .put(authorityPath)
      .set(SAME_ORIGIN_HEADERS)
      .send({
        authority_profile: "server_administrator",
        autonomy_mode: "autonomous",
        approved_categories: [],
        expires_at: null,
      })
      .expect(404);

    const configured = await owner.agent
      .put(authorityPath)
      .set(SAME_ORIGIN_HEADERS)
      .send({
        authority_profile: "server_administrator",
        autonomy_mode: "autonomous",
        approved_categories: [],
        expires_at: null,
      })
      .expect(200);
    expect(configured.body).toMatchObject({
      ok: true,
      authority: {
        authority_profile: "server_administrator",
        autonomy_mode: "autonomous",
        credential_included: false,
      },
      member_grant: {
        participant_id: ownerParticipantId,
        max_authority_profile: "server_administrator",
      },
      command_credential_included: false,
    });

    const credential = await owner.agent
      .post(
        authorityPath.replace(
          "/command-authority",
          "/command-credential",
        ),
      )
      .set(SAME_ORIGIN_HEADERS)
      .send({})
      .expect(200);
    expect(credential.body).toMatchObject({
      ok: true,
      token_value_shown_once: true,
      secret_stored_raw: false,
      command_config: {
        command_execution_enabled: true,
        host_access_enabled: false,
        automatic_retry_enabled: false,
        command_authority_id:
          configured.body.authority.command_authority_id,
      },
    });
    const commandSecret = credential.body.command_config.bearer_token as string;
    expect(commandSecret).toMatch(/^helix_env_cmd_/);
    await expect(
      authenticateEnvironmentCommandConnector({
        authorityId: configured.body.authority.command_authority_id,
        authorization: "Bearer test-only",
        requiredScope: "command.poll",
      }),
    ).rejects.toMatchObject({ code: "command_credential_invalid" });
    const connectorClaim = await authenticateEnvironmentCommandConnector({
      authorityId: configured.body.authority.command_authority_id,
      authorization: `Bearer ${commandSecret}`,
      requiredScope: "command.catalog.write",
    });
    const catalogPage = {
        schema: "helix.environment_command.catalog_page.v1",
        command_catalog_id: "command_catalog:route-test",
        command_tree_hash: `sha256:${"b".repeat(64)}`,
        environment_binding_id: connector.environmentBindingId,
        source_id: sourceId,
        world_id: worldId,
        adapter_profile_id: admission.adapter_profile_id,
        domain_adapter: domainAdapter,
        game_version: "1.21.8",
        producer_epoch_ref: producerEpoch,
        root_command_count: 1,
        path_prefix: "",
        nodes: [
          {
            path: "time",
            node_kind: "literal",
            executable: false,
            argument_type: null,
            suggestion_provider: null,
            redirects_to: null,
            child_count: 2,
          },
        ],
        next_cursor: null,
        generated_at: new Date().toISOString(),
        expires_at: null,
        raw_dispatcher_tree_included: false,
        content_role: "environment_command_catalog_not_assistant_answer",
        answer_authority: false,
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      } as const;
    const catalog = await recordEnvironmentCommandCatalog({
      claim: connectorClaim,
      page: catalogPage,
    });
    expect(catalog.replayed).toBe(false);
    const storedCatalogEpoch = await db.query<{ producer_epoch_ref: string }>(
      `SELECT producer_epoch_ref
       FROM helix_environment_command_catalog_snapshots
       WHERE command_catalog_id = $1;`,
      [catalog.commandCatalogId],
    );
    expect(storedCatalogEpoch.rows[0]?.producer_epoch_ref).toBe(
      producerEpochRef,
    );
    const replayedCatalog = await recordEnvironmentCommandCatalog({
      claim: connectorClaim,
      page: {
        ...catalogPage,
        command_catalog_id: "command_catalog:route-test-after-restart",
        generated_at: new Date(Date.now() + 1_000).toISOString(),
      },
    });
    expect(replayedCatalog).toMatchObject({
      commandCatalogId: catalog.commandCatalogId,
      commandTreeHash: catalog.commandTreeHash,
      replayed: true,
    });
    const commandRequest = await enqueueEnvironmentCommand({
      roomId,
      profileId: owner.profileId,
      environmentBindingId: connector.environmentBindingId,
      runId: "first_party_shared_room:command-route",
      turnId: "turn:command-route",
      providerExecutionId: "provider_execution:command-route",
      toolCallId: "tool_call:command-route",
      commandText: "/time set day",
      requestedCategory: "world_time_weather",
      expectedEffect: "world_mutation",
      idempotencyKey: "command-route-time-set-day",
      confirmationState: "not_required",
    });
    const pollClaim = await authenticateEnvironmentCommandConnector({
      authorityId: configured.body.authority.command_authority_id,
      authorization: `Bearer ${commandSecret}`,
      requiredScope: "command.poll",
    });
    const leased = await leasePendingEnvironmentCommands({
      claim: pollClaim,
      limit: 4,
    });
    expect(leased).toHaveLength(1);
    expect(leased[0]).toMatchObject({
      command_request_id: commandRequest.command_request_id,
      command_text: "time set day",
      constraints: {
        automatic_retry_allowed: false,
        host_access_allowed: false,
      },
    });
    expect(
      await leasePendingEnvironmentCommands({ claim: pollClaim, limit: 4 }),
    ).toEqual([]);
    const resultClaim = await authenticateEnvironmentCommandConnector({
      authorityId: configured.body.authority.command_authority_id,
      authorization: `Bearer ${commandSecret}`,
      requiredScope: "command.result.write",
    });
    const recorded = await submitEnvironmentCommandResult({
      claim: resultClaim,
      result: {
        schema: "helix.environment_command.result.v1",
        command_request_id: commandRequest.command_request_id,
        command_execution_id: "command_execution:route-test",
        command_hash: commandRequest.command_hash,
        command_root: "time",
        parsed_category: "world_time_weather",
        effect_class: "world_mutation",
        outcome: "succeeded",
        result_code: 1,
        summary: "Set the time to day.",
        output_lines: ["Set the time to 1000"],
        output_truncated: false,
        affected_count: 1,
        side_effects_performed: true,
        environment_mutation_performed: true,
        server_administration_performed: false,
        parsed_by_live_dispatcher: true,
        host_access_performed: false,
        automatic_retry_performed: false,
        model_invoked: false,
        created_at: new Date().toISOString(),
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(recorded.observation).toMatchObject({
      outcome: "succeeded",
      provenance_valid: true,
      eligible_for_current_turn_reentry: true,
      reentry_required: true,
      terminal_eligible: false,
    });

    const grant = await owner.agent
      .put(
        authorityPath.replace(
          "/command-authority",
          `/participants/${encodeURIComponent(guestParticipantId)}/command-grant`,
        ),
      )
      .set(SAME_ORIGIN_HEADERS)
      .send({
        max_authority_profile: "world_operator",
        autonomy_override: "approve_each",
        expires_at: null,
      })
      .expect(200);
    expect(grant.body.member_grant).toMatchObject({
      participant_id: guestParticipantId,
      max_authority_profile: "world_operator",
      autonomy_override: "approve_each",
    });

    const guestProjection = await guest.agent
      .get(authorityPath)
      .set(SAME_ORIGIN_HEADERS)
      .expect(200);
    expect(guestProjection.body).toMatchObject({
      authority: { authority_profile: "server_administrator" },
      member_grant: {
        participant_id: guestParticipantId,
        max_authority_profile: "world_operator",
      },
      command_credential_included: false,
    });

    const commandPairing = await createConnectorBootstrapPairing({
      roomId,
      ownerProfileId: owner.profileId,
      purpose: "rotate",
      bindingId,
      domainAdapter,
      sourceLabel: "Local Fabric",
      commandCredentialRequested: true,
      idempotencyKey: "command-route-direct-connector-pairing",
    });
    expect(commandPairing.pairing).toMatchObject({
      command_credential_requested: true,
      credential_included: false,
    });
    const redemptionNonce = crypto.randomBytes(32).toString("base64url");
    const commandRedemption = await redeemConnectorBootstrapPairing({
      pairingCode: commandPairing.pairingCode,
      redemptionNonce,
      domainAdapter,
      connectorKind: domainAdapter,
      connectorVersion: "0.1.0",
      pairingEndpoint:
        "http://localhost:1522/api/environment-connectors/v1/pairing/redeem",
    });
    expect(commandRedemption.pluginConfig.command).toMatchObject({
      command_execution_enabled: true,
      host_access_enabled: false,
      automatic_retry_enabled: false,
      command_authority_id: configured.body.authority.command_authority_id,
    });
    const replayedCommandRedemption = await redeemConnectorBootstrapPairing({
      pairingCode: commandPairing.pairingCode,
      redemptionNonce,
      domainAdapter,
      connectorKind: domainAdapter,
      connectorVersion: "0.1.0",
      pairingEndpoint:
        "http://localhost:1522/api/environment-connectors/v1/pairing/redeem",
    });
    expect(replayedCommandRedemption.replayed).toBe(true);
    expect(replayedCommandRedemption.pluginConfig.command?.bearer_token).toBe(
      commandRedemption.pluginConfig.command?.bearer_token,
    );

    const pairedCredentialId = commandRedemption.binding.credential_id!;
    const pairedProducerEpoch = `${producerEpoch}-command-paired`;
    const pairedProducerEpochRef = projectEnvironmentAdapterProducerEpoch({
      bindingId,
      producerEpoch: pairedProducerEpoch,
    });
    const pairedAdmission: HelixEnvironmentAdapterAdmissionProjection = {
      ...restartedAdmission,
      admission_id: `${admission.admission_id}-command-paired`,
      manifest_id: `${admission.manifest_id}-command-paired`,
      manifest_hash: `sha256:${"d".repeat(64)}`,
      producer_epoch_ref: pairedProducerEpochRef,
      admitted_at: new Date().toISOString(),
    };
    await db.query(
      `
        INSERT INTO helix_environment_adapter_admissions (
          admission_id, binding_id, credential_id, producer_epoch, room_id,
          source_id, world_id, domain_adapter, adapter_profile_id,
          adapter_profile_version, adapter_contract_hash, manifest_id,
          manifest_hash, source_family, mechanics_collection_ids, admitted_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15::jsonb, $16
        );
      `,
      [
        pairedAdmission.admission_id,
        bindingId,
        pairedCredentialId,
        pairedProducerEpoch,
        roomId,
        sourceId,
        worldId,
        domainAdapter,
        pairedAdmission.adapter_profile_id,
        pairedAdmission.adapter_profile_version,
        pairedAdmission.adapter_contract_hash,
        pairedAdmission.manifest_id,
        pairedAdmission.manifest_hash,
        pairedAdmission.source_family,
        JSON.stringify(pairedAdmission.mechanics_collection_ids),
        pairedAdmission.admitted_at,
      ],
    );
    await materializeLegacyRoomSourceConnector({
      ownerProfileId: owner.profileId,
      roomSourceBindingId: bindingId,
      credentialId: pairedCredentialId,
      roomId,
      sourceId,
      worldId,
      producerEpochRef: pairedProducerEpochRef,
      adapterAdmission: pairedAdmission,
      capabilityDescriptors: listEnvironmentConnectorCapabilityDescriptors({
        adapterProfileId: pairedAdmission.adapter_profile_id,
      }),
    });

    const stopped = await owner.agent
      .delete(authorityPath)
      .set(SAME_ORIGIN_HEADERS)
      .expect(200);
    expect(stopped.body).toMatchObject({
      ok: true,
      authority: { status: "suspended" },
      member_grant: null,
      command_credential_included: false,
    });

    const persisted = await db.query<{
      authority_count: string;
      active_grant_count: string;
      command_credential_count: string;
    }>(`
      SELECT
        (SELECT count(*) FROM helix_environment_command_authorities) AS authority_count,
        (SELECT count(*) FROM helix_environment_command_member_grants WHERE status = 'active') AS active_grant_count,
        (SELECT count(*) FROM helix_environment_command_connector_credentials) AS command_credential_count;
    `);
    expect(Number(persisted.rows[0].authority_count)).toBe(1);
    expect(Number(persisted.rows[0].active_grant_count)).toBe(0);
    expect(Number(persisted.rows[0].command_credential_count)).toBe(2);
  }, 30_000);
});
