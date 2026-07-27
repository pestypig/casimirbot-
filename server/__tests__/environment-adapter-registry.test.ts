import { afterEach, describe, expect, it, vi } from "vitest";
import minecraftManifestFixture from "../../fixtures/environment-source/minecraft/plugin-manifest.mvp.json";
import {
  HELIX_MINECRAFT_ADAPTER_PROFILE_ID,
  HELIX_SYNTHETIC_GAME_ADAPTER_PROFILE_ID,
  helixEnvironmentAdapterProfileSchema,
} from "@shared/helix-environment-adapter-profile";
import {
  EnvironmentAdapterRegistryError,
  assertEnvironmentAdapterManifest,
  environmentAdapterContractHash,
  listEnvironmentAdapterProfiles,
  resolveEnvironmentAdapterProfile,
  validateEnvironmentAdapterManifest,
} from "../services/situation-room/environment-adapter-registry";
import type { HelixEnvironmentSourceManifest } from "@shared/helix-environment-source-manifest";

const minecraftManifest = (): HelixEnvironmentSourceManifest =>
  structuredClone(minecraftManifestFixture) as HelixEnvironmentSourceManifest;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("environment adapter registry", () => {
  it("resolves the frozen Minecraft profile with deterministic integrity", () => {
    const first = resolveEnvironmentAdapterProfile({
      domainAdapter: "minecraft.paper_plugin.v1",
      worldId: "minecraft:minehut:survival",
    });
    const second = resolveEnvironmentAdapterProfile({
      domainAdapter: "minecraft.paper_plugin.v1",
      worldId: "minecraft:minehut:survival",
    });

    expect(first.profile.profile_id).toBe(HELIX_MINECRAFT_ADAPTER_PROFILE_ID);
    expect(first.profile.domain).toBe("minecraft");
    expect(first.profile.execution_policy).toEqual({
      may_execute_live_actions: false,
      may_perform_read_only_probes: true,
      action_credential_reused: false,
    });
    expect(first.profile.mechanics_collections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          collection_id: "mechanics.minecraft.java.v1",
          retrieval_namespace: "mechanics:minecraft:java",
        }),
      ]),
    );
    expect(first.contract_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(second.contract_hash).toBe(first.contract_hash);
    expect(environmentAdapterContractHash(first.profile)).toBe(
      first.contract_hash,
    );
    expect(helixEnvironmentAdapterProfileSchema.parse(first.profile)).toEqual(
      first.profile,
    );
  });

  it("fails closed for unknown and cross-domain world identities", () => {
    expect(() =>
      resolveEnvironmentAdapterProfile({
        domainAdapter: "unknown.game.v1",
        worldId: "unknown:world",
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "environment_adapter_unknown",
      }),
    );
    expect(() =>
      resolveEnvironmentAdapterProfile({
        domainAdapter: "minecraft.paper_plugin.v1",
        worldId: "synthetic-game:wrong-domain",
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "environment_adapter_identity_mismatch",
      }),
    );
  });

  it("keeps the synthetic adapter fixture-only unless explicitly enabled", () => {
    expect(() =>
      resolveEnvironmentAdapterProfile({
        domainAdapter: "synthetic_game.fixture.v1",
        worldId: "synthetic-game:arena",
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "environment_adapter_disabled",
      }),
    );

    const fixture = resolveEnvironmentAdapterProfile({
      domainAdapter: "synthetic_game.fixture.v1",
      worldId: "synthetic-game:arena",
      includeFixtureProfiles: true,
    });
    expect(fixture.profile.profile_id).toBe(
      HELIX_SYNTHETIC_GAME_ADAPTER_PROFILE_ID,
    );
    expect(fixture.profile.domain).toBe("game");
    expect(fixture.profile.source_family).toBe("synthetic_game");
    expect(fixture.profile.normalizer.producer_code_loaded).toBe(false);
    expect(
      listEnvironmentAdapterProfiles({ includeFixtureProfiles: true }),
    ).toHaveLength(2);
    expect(listEnvironmentAdapterProfiles()).toHaveLength(1);
  });

  it("admits the existing Minecraft manifest and rejects incompatible claims", () => {
    const accepted = assertEnvironmentAdapterManifest({
      manifest: minecraftManifest(),
      worldId: "minecraft:minehut:survival",
    });
    expect(accepted.ok).toBe(true);
    expect(accepted.manifest_hash).toMatch(/^sha256:[a-f0-9]{64}$/);

    const wrongProtocol = minecraftManifest();
    wrongProtocol.protocol_version = "untrusted.protocol.v9";
    const protocolValidation = validateEnvironmentAdapterManifest({
      manifest: wrongProtocol,
      worldId: "minecraft:minehut:survival",
    });
    expect(protocolValidation.ok).toBe(false);
    expect(protocolValidation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "environment_adapter_protocol_unsupported",
        }),
      ]),
    );

    const missingSection = minecraftManifest();
    missingSection.supported_snapshot_sections =
      missingSection.supported_snapshot_sections.filter(
        (section) => section !== "inventory_state",
      );
    expect(() =>
      assertEnvironmentAdapterManifest({
        manifest: missingSection,
        worldId: "minecraft:minehut:survival",
      }),
    ).toThrowError(EnvironmentAdapterRegistryError);
  });

  it("does not allow a manifest to cross adapter profiles", () => {
    const manifest = minecraftManifest();
    manifest.domain = "game";
    manifest.domain_adapter = "synthetic_game.fixture.v1";
    manifest.protocol_version = "helix.environment.v1";
    manifest.supported_snapshot_sections = ["actor_state"];
    manifest.supported_probe_types = ["reachability"];
    manifest.snapshot_policy.max_payload_bytes = 32_000;

    const validation = validateEnvironmentAdapterManifest({
      manifest,
      worldId: "synthetic-game:arena",
      includeFixtureProfiles: true,
    });
    expect(validation.ok).toBe(true);

    expect(() =>
      assertEnvironmentAdapterManifest({
        manifest,
        worldId: "minecraft:minehut:survival",
        includeFixtureProfiles: true,
      }),
    ).toThrowError(
      expect.objectContaining({
        code: "environment_adapter_identity_mismatch",
      }),
    );
  });
});
