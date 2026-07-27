import type { HelixEnvironmentMechanicsCollectionRef } from "@shared/helix-environment-adapter-profile";
import { listEnvironmentAdapterProfiles } from "./environment-adapter-registry";

export type EnvironmentMechanicsCollection = {
  collection: HelixEnvironmentMechanicsCollectionRef;
  adapter_profile_ids: string[];
  content_role: "mechanics_reference_not_live_observation";
  assistant_answer: false;
  terminal_eligible: false;
};

export class EnvironmentMechanicsRegistryError extends Error {
  constructor(
    readonly code:
      | "environment_mechanics_collection_unknown"
      | "environment_mechanics_collection_not_admitted",
    message: string,
  ) {
    super(message);
    this.name = "EnvironmentMechanicsRegistryError";
  }
}

const collectionMap = (
  includeFixtureProfiles = false,
): Map<string, EnvironmentMechanicsCollection> => {
  const collections = new Map<string, EnvironmentMechanicsCollection>();
  for (const record of listEnvironmentAdapterProfiles({
    includeFixtureProfiles,
  })) {
    for (const collection of record.profile.mechanics_collections) {
      const prior = collections.get(collection.collection_id);
      if (prior) {
        const same =
          JSON.stringify(prior.collection) === JSON.stringify(collection);
        if (!same) {
          throw new Error(
            `Mechanics collection ${collection.collection_id} has conflicting registry definitions.`,
          );
        }
        prior.adapter_profile_ids.push(record.profile.profile_id);
        continue;
      }
      collections.set(collection.collection_id, {
        collection: structuredClone(collection),
        adapter_profile_ids: [record.profile.profile_id],
        content_role: "mechanics_reference_not_live_observation",
        assistant_answer: false,
        terminal_eligible: false,
      });
    }
  }
  return collections;
};

export const listEnvironmentMechanicsCollections = (
  options: {
    includeFixtureProfiles?: boolean;
  } = {},
): EnvironmentMechanicsCollection[] =>
  Array.from(
    collectionMap(options.includeFixtureProfiles ?? false).values(),
  ).map((entry) => structuredClone(entry));

export const resolveEnvironmentMechanicsSearchScope = (input: {
  collectionIds: string[];
  admittedCollectionIds?: string[];
  adapterProfileId?: string;
  includeFixtureProfiles?: boolean;
}): {
  collections: EnvironmentMechanicsCollection[];
  documentPaths: string[];
} => {
  const registry = collectionMap(input.includeFixtureProfiles ?? false);
  const requested = Array.from(
    new Set(input.collectionIds.map((entry) => entry.trim()).filter(Boolean)),
  );
  const admitted = input.admittedCollectionIds
    ? new Set(input.admittedCollectionIds)
    : null;
  const collections = requested.map((collectionId) => {
    const collection = registry.get(collectionId);
    if (!collection) {
      throw new EnvironmentMechanicsRegistryError(
        "environment_mechanics_collection_unknown",
        `Mechanics collection ${collectionId} is not registered.`,
      );
    }
    if (admitted && !admitted.has(collectionId)) {
      throw new EnvironmentMechanicsRegistryError(
        "environment_mechanics_collection_not_admitted",
        `Mechanics collection ${collectionId} was not admitted by the current environment adapter.`,
      );
    }
    if (
      input.adapterProfileId &&
      !collection.adapter_profile_ids.includes(input.adapterProfileId)
    ) {
      throw new EnvironmentMechanicsRegistryError(
        "environment_mechanics_collection_not_admitted",
        `Mechanics collection ${collectionId} is not compatible with adapter profile ${input.adapterProfileId}.`,
      );
    }
    return collection;
  });
  return {
    collections: collections.map((entry) => structuredClone(entry)),
    documentPaths: Array.from(
      new Set(collections.flatMap((entry) => entry.collection.document_paths)),
    ),
  };
};
