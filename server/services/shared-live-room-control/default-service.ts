import {
  HELIX_SHARED_LIVE_ROOM_CREDENTIAL_DELIVERY_SCHEMA,
  type HelixSharedLiveRoomCredentialDelivery,
} from "@shared/contracts/helix-shared-live-room-agent.v1";
import type { HelixRoomSourceBinding } from "@shared/helix-room-source-ingress";
import { resolveCasimirPublicBaseUrl } from "../public-base-url";
import {
  createSharedRealtimeRoomSourceBindingWithoutCredential,
  persistSharedRealtimeRoomSourceCredentialForTrustedClaim,
} from "../helix-ask/realtime-room/source-link-store";
import type { HelixWorkstationGatewayAccountContext } from "../helix-ask/workstation-tool-gateway/account-policy";
import {
  SharedLiveRoomBindingStore,
  type SharedLiveRoomCredentialDelivery,
} from "./binding-store";
import { getSharedLiveRoomBindingStore } from "./binding-store-singleton";
import {
  SharedLiveRoomControlError,
  SharedLiveRoomControlService,
  buildSharedLiveRoomControlActorFromAccountContext,
} from "./service";

const credentialClaimUrl = (): string =>
  `${resolveCasimirPublicBaseUrl()}/api/agi/realtime/room-source-credential-deliveries/claim`;

let sharedControlService: SharedLiveRoomControlService | null = null;

export { getSharedLiveRoomBindingStore };

export const issueSharedLiveRoomSourceCredentialDeliveryHandle = async (input: {
  binding: HelixRoomSourceBinding;
  ownerProfileId: string;
  purpose: "create" | "rotate";
  credentialTtlMs: number;
  issuedAt?: string;
  bindingStore?: SharedLiveRoomBindingStore;
}): Promise<HelixSharedLiveRoomCredentialDelivery> => {
  if (input.binding.owner_profile_id !== input.ownerProfileId) {
    throw new SharedLiveRoomControlError(
      404,
      "source_binding_not_found",
      "Room source binding not found.",
    );
  }
  const issued = await (
    input.bindingStore ?? getSharedLiveRoomBindingStore()
  ).createCredentialDeliveryHandle({
    bindingId: input.binding.binding_id,
    ownerProfileId: input.ownerProfileId,
    purpose: input.purpose,
    credentialTtlMs: input.credentialTtlMs,
    now: input.issuedAt,
  });
  return {
    schema: HELIX_SHARED_LIVE_ROOM_CREDENTIAL_DELIVERY_SCHEMA,
    claim_handle: issued.deliveryHandle,
    claim_url: credentialClaimUrl(),
    expires_at: issued.delivery.expiresAt,
    delivery_status: "pending_claim",
    bearer_included: false,
    plugin_config_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

export const createDefaultSharedLiveRoomControlService = (
  bindingStore = getSharedLiveRoomBindingStore(),
): SharedLiveRoomControlService =>
  new SharedLiveRoomControlService({
    deferredSourceBindingStore: {
      createSourceBindingWithoutCredential:
        createSharedRealtimeRoomSourceBindingWithoutCredential,
    },
    credentialDelivery: {
      issue: async (input) =>
        issueSharedLiveRoomSourceCredentialDeliveryHandle({
          binding: input.binding,
          ownerProfileId: input.owner.profile_id,
          purpose: "create",
          credentialTtlMs: input.credentialTtlMs,
          issuedAt: input.issuedAt,
          bindingStore,
        }),
    },
  });

export const getSharedLiveRoomControlService =
  (): SharedLiveRoomControlService => {
    sharedControlService ??= createDefaultSharedLiveRoomControlService();
    return sharedControlService;
  };

export type TrustedSharedLiveRoomCredentialClaim = {
  delivery: SharedLiveRoomCredentialDelivery;
  binding: HelixRoomSourceBinding;
  tokenValue: string;
  pluginConfig: {
    endpoint: string;
    bearer_token: string;
    source_id: string;
    room_id: string;
    world_id: string;
    domain_adapter: string;
    execution_enabled: false;
  };
};

export const claimSharedLiveRoomSourceCredentialForBrowser = async (input: {
  accountContext: HelixWorkstationGatewayAccountContext;
  deliveryHandle: string;
  bindingStore?: SharedLiveRoomBindingStore;
}): Promise<TrustedSharedLiveRoomCredentialClaim> => {
  const actor = buildSharedLiveRoomControlActorFromAccountContext(
    input.accountContext,
  );
  if (
    actor.authKind !== "first_party_session" ||
    actor.accountType !== "developer" ||
    !actor.accountPolicy.feature_flags.includes("shared_realtime_rooms") ||
    actor.accountPolicy.locked_features.includes("shared_realtime_rooms") ||
    !actor.accountPolicy.feature_flags.includes("room_source_ingress") ||
    actor.accountPolicy.locked_features.includes("room_source_ingress")
  ) {
    throw new SharedLiveRoomControlError(
      403,
      "account_policy_blocked",
      "Secure room-source credential delivery is available to the signed-in developer owner only.",
    );
  }

  let issued: {
    binding: HelixRoomSourceBinding;
    tokenValue: string;
  } | null = null;
  const bindingStore = input.bindingStore ?? getSharedLiveRoomBindingStore();
  const delivery = await bindingStore.claimCredentialDeliveryHandle({
    ownerProfileId: actor.profileId,
    deliveryHandle: input.deliveryHandle,
    consume: async (claim, client) => {
      issued = await persistSharedRealtimeRoomSourceCredentialForTrustedClaim(
        {
          bindingId: claim.bindingId,
          roomId: claim.roomId,
          sourceId: claim.sourceId,
          ownerProfileId: claim.ownerProfileId,
          purpose: claim.purpose,
          credentialTtlMs: claim.credentialTtlMs,
        },
        client,
      );
    },
  });
  if (!issued) {
    throw new SharedLiveRoomControlError(
      503,
      "credential_delivery_unavailable",
      "The source credential was not issued.",
      true,
    );
  }
  const claimed = issued as {
    binding: HelixRoomSourceBinding;
    tokenValue: string;
  };
  return {
    delivery,
    binding: claimed.binding,
    tokenValue: claimed.tokenValue,
    pluginConfig: {
      endpoint: claimed.binding.public_ingress_base_url,
      bearer_token: claimed.tokenValue,
      source_id: claimed.binding.source_id,
      room_id: claimed.binding.room_id,
      world_id: claimed.binding.world_id,
      domain_adapter: claimed.binding.domain_adapter,
      execution_enabled: false,
    },
  };
};
