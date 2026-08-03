import type { HelixWorkstationGatewayAccountContext } from "./types";
import { listRoomEnvironmentProjections } from "../../environment-connectors/subjects";
import { resolveEnvironmentAdapterProfile } from "../../situation-room/environment-adapter-registry";
import {
  resolveEnvironmentMechanicsSearchScope,
  type EnvironmentMechanicsCollection,
} from "../../situation-room/environment-mechanics-registry";

export class RoomEnvironmentMechanicsSearchError extends Error {
  constructor(
    readonly code:
      | "environment_mechanics_scope_unavailable"
      | "wrong_environment"
      | "permission_revoked",
    message: string,
  ) {
    super(message);
    this.name = "RoomEnvironmentMechanicsSearchError";
  }
}

type RoomEnvironmentMechanicsSearchDependencies = {
  listRoomEnvironments: typeof listRoomEnvironmentProjections;
};

const roomIdFromThread = (threadId: string | null | undefined): string | null => {
  const prefix = "helix-ask:room:";
  const normalized = threadId?.trim() ?? "";
  return normalized.startsWith(prefix)
    ? normalized.slice(prefix.length).trim()
    : null;
};

const uniqueStrings = (values: string[]): string[] =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

export type RoomEnvironmentMechanicsSearchScope = {
  collections: EnvironmentMechanicsCollection[];
  documentPaths: string[];
  environment: {
    environment_binding_id: string;
    source_label: string;
    world_id: string;
    domain_adapter: string;
    adapter_profile_id: string;
    mechanics_collection_ids: string[];
  };
};

/**
 * Resolves docs guidance from the server-owned shared-room environment identity.
 * Model-authored arguments may narrow the active environment, but may not name
 * a different adapter profile or mechanics collection than that environment
 * admits.
 */
export const resolveRoomEnvironmentMechanicsSearchScope = async (input: {
  accountContext?: HelixWorkstationGatewayAccountContext | null;
  conversationThreadId?: string | null;
  environmentLabel?: string | null;
  requestedCollectionIds?: string[];
  requestedAdapterProfileId?: string | null;
  includeFixtureProfiles?: boolean;
  dependencies?: Partial<RoomEnvironmentMechanicsSearchDependencies>;
}): Promise<RoomEnvironmentMechanicsSearchScope> => {
  const account = input.accountContext;
  const profileId = account?.profile_id?.trim() ?? "";
  const roomId = roomIdFromThread(input.conversationThreadId);
  if (
    !account?.trusted_account_session ||
    !account.account_session ||
    account.account_session.status !== "active" ||
    account.account_session.profile.profile_id !== profileId ||
    !profileId ||
    !roomId
  ) {
    throw new RoomEnvironmentMechanicsSearchError(
      "permission_revoked",
      "Room-scoped mechanics search requires an exact signed-in shared-room turn.",
    );
  }

  const listRoomEnvironments =
    input.dependencies?.listRoomEnvironments ?? listRoomEnvironmentProjections;
  let environments;
  try {
    environments = await listRoomEnvironments({ roomId, profileId });
  } catch (error) {
    throw new RoomEnvironmentMechanicsSearchError(
      "permission_revoked",
      error instanceof Error
        ? error.message
        : "The room environment is unavailable to this account.",
    );
  }

  const requestedLabel = input.environmentLabel?.trim().toLowerCase() ?? "";
  const active = environments.filter(
    (environment) => environment.connection_status === "active",
  );
  const labelMatches = requestedLabel
    ? active.filter(
        (environment) =>
          environment.source_label.trim().toLowerCase() === requestedLabel,
      )
    : active;
  if (labelMatches.length === 0) {
    throw new RoomEnvironmentMechanicsSearchError(
      requestedLabel ? "wrong_environment" : "environment_mechanics_scope_unavailable",
      requestedLabel
        ? "The requested environment label does not match an active room source."
        : "This room has no active environment available for mechanics search.",
    );
  }

  const compatible = labelMatches.flatMap((environment) => {
    try {
      const record = resolveEnvironmentAdapterProfile({
        domainAdapter: environment.domain_adapter,
        worldId: environment.world_id,
        includeFixtureProfiles: input.includeFixtureProfiles,
      });
      return record.profile.mechanics_collections.length > 0
        ? [{ environment, record }]
        : [];
    } catch {
      return [];
    }
  });
  if (compatible.length === 0) {
    throw new RoomEnvironmentMechanicsSearchError(
      "environment_mechanics_scope_unavailable",
      "The selected active environment has no registered mechanics collection.",
    );
  }
  if (compatible.length > 1) {
    throw new RoomEnvironmentMechanicsSearchError(
      "wrong_environment",
      "More than one active room environment has mechanics guidance; select the exact environment_label.",
    );
  }

  const selected = compatible[0];
  const admittedCollectionIds = uniqueStrings(
    selected.record.profile.mechanics_collections.map(
      (collection) => collection.collection_id,
    ),
  );
  const requestedCollectionIds = uniqueStrings(
    input.requestedCollectionIds ?? [],
  );
  if (
    input.requestedAdapterProfileId?.trim() &&
    input.requestedAdapterProfileId.trim() !== selected.record.profile.profile_id
  ) {
    throw new RoomEnvironmentMechanicsSearchError(
      "wrong_environment",
      "The requested adapter_profile_id does not match the selected room environment.",
    );
  }
  if (
    requestedCollectionIds.some(
      (collectionId) => !admittedCollectionIds.includes(collectionId),
    )
  ) {
    throw new RoomEnvironmentMechanicsSearchError(
      "wrong_environment",
      "A requested mechanics collection was not admitted by the selected room environment.",
    );
  }

  const collectionIds =
    requestedCollectionIds.length > 0
      ? requestedCollectionIds
      : admittedCollectionIds;
  const scope = resolveEnvironmentMechanicsSearchScope({
    collectionIds,
    admittedCollectionIds,
    adapterProfileId: selected.record.profile.profile_id,
    includeFixtureProfiles: input.includeFixtureProfiles,
  });
  return {
    ...scope,
    environment: {
      environment_binding_id: selected.environment.environment_binding_id,
      source_label: selected.environment.source_label,
      world_id: selected.environment.world_id,
      domain_adapter: selected.environment.domain_adapter,
      adapter_profile_id: selected.record.profile.profile_id,
      mechanics_collection_ids: collectionIds,
    },
  };
};
