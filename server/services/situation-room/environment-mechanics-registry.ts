import type { HelixEnvironmentMechanicsCollectionRef } from "@shared/helix-environment-adapter-profile";
import { listEnvironmentAdapterProfiles } from "./environment-adapter-registry";

export type EnvironmentMechanicsCollection = {
  collection: HelixEnvironmentMechanicsCollectionRef;
  adapter_profile_ids: string[];
  content_role: "mechanics_reference_not_live_observation";
  assistant_answer: false;
  terminal_eligible: false;
};

export type EnvironmentMechanicsRetrievalTopic = {
  collection_id: string;
  topic_id: string;
  match_terms: string[];
  section_headings: string[];
  default_for_collection: boolean;
};

export type EnvironmentMechanicsRetrievalPlan = {
  schema: "helix.environment_mechanics_retrieval_plan.v1";
  collection_ids: string[];
  topic_ids: string[];
  section_headings: string[];
  retrieval_role: "mechanics_reference_selection_not_execution_admission";
  assistant_answer: false;
  terminal_eligible: false;
};

/**
 * Section routing is deliberately separate from adapter admission. These
 * declarative topics only select bounded passages inside collections that the
 * trusted room environment has already admitted; a term match here can never
 * admit a tool or a mutation.
 */
const retrievalTopics: EnvironmentMechanicsRetrievalTopic[] = [
  {
    collection_id: "mechanics.minecraft.commands.v1",
    topic_id: "minecraft.command_foundation.v1",
    match_terms: [],
    section_headings: ["Command construction", "Composition ladder"],
    default_for_collection: true,
  },
  {
    collection_id: "mechanics.minecraft.commands.v1",
    topic_id: "minecraft.spatial_agency.v1",
    match_terms: [
      "wall",
      "house",
      "base",
      "build",
      "construct",
      "structure",
      "fire",
      "fireplace",
      "hearth",
      "ignite",
      "fall",
      "landing",
      "rescue",
    ],
    section_headings: [
      "Spatial agency, rollback, fire, and fall rescue",
      "Common action commands",
    ],
    default_for_collection: false,
  },
];

const normalizedQueryTerms = (query: string): Set<string> =>
  new Set(
    query
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, " ")
      .split(/\s+/)
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

export const resolveEnvironmentMechanicsRetrievalPlan = (input: {
  collections: EnvironmentMechanicsCollection[];
  query: string;
}): EnvironmentMechanicsRetrievalPlan => {
  const collectionIds = Array.from(
    new Set(input.collections.map((entry) => entry.collection.collection_id)),
  );
  const queryTerms = normalizedQueryTerms(input.query);
  const selectedTopics = retrievalTopics.filter(
    (topic) =>
      collectionIds.includes(topic.collection_id) &&
      (topic.default_for_collection ||
        topic.match_terms.some((term) => queryTerms.has(term))),
  );
  return {
    schema: "helix.environment_mechanics_retrieval_plan.v1",
    collection_ids: collectionIds,
    topic_ids: selectedTopics.map((topic) => topic.topic_id),
    section_headings: Array.from(
      new Set(selectedTopics.flatMap((topic) => topic.section_headings)),
    ).slice(0, 6),
    retrieval_role: "mechanics_reference_selection_not_execution_admission",
    assistant_answer: false,
    terminal_eligible: false,
  };
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
