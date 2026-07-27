import { describe, expect, it } from "vitest";
import {
  EnvironmentMechanicsRegistryError,
  listEnvironmentMechanicsCollections,
  resolveEnvironmentMechanicsSearchScope,
} from "../services/situation-room/environment-mechanics-registry";

describe("environment mechanics registry", () => {
  it("resolves Minecraft mechanics to a bounded docs scope", () => {
    const scope = resolveEnvironmentMechanicsSearchScope({
      collectionIds: ["mechanics.minecraft.java.v1"],
      adapterProfileId: "game.minecraft.readonly.v1",
    });
    expect(scope).toMatchObject({
      documentPaths: ["docs/game-mechanics/minecraft-java-v1.md"],
      collections: [
        {
          collection: {
            collection_id: "mechanics.minecraft.java.v1",
            collection_version: 1,
            retrieval_namespace: "mechanics:minecraft:java",
          },
          adapter_profile_ids: ["game.minecraft.readonly.v1"],
          assistant_answer: false,
          terminal_eligible: false,
        },
      ],
    });
  });

  it("keeps fixture collections out of the production/default catalogue", () => {
    expect(
      listEnvironmentMechanicsCollections().map(
        (entry) => entry.collection.collection_id,
      ),
    ).toEqual(["mechanics.minecraft.java.v1"]);
    expect(
      listEnvironmentMechanicsCollections({
        includeFixtureProfiles: true,
      }).map((entry) => entry.collection.collection_id),
    ).toContain("mechanics.synthetic_game.fixture.v1");
  });

  it("fails closed on an unknown or cross-profile mechanics collection", () => {
    expect(() =>
      resolveEnvironmentMechanicsSearchScope({
        collectionIds: ["mechanics.unknown.v1"],
        adapterProfileId: "game.minecraft.readonly.v1",
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "environment_mechanics_collection_unknown",
      }) as EnvironmentMechanicsRegistryError,
    );
    expect(() =>
      resolveEnvironmentMechanicsSearchScope({
        collectionIds: ["mechanics.synthetic_game.fixture.v1"],
        adapterProfileId: "game.minecraft.readonly.v1",
        includeFixtureProfiles: true,
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "environment_mechanics_collection_not_admitted",
      }) as EnvironmentMechanicsRegistryError,
    );
  });
});
