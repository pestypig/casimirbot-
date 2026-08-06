import { describe, expect, it } from "vitest";
import { HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID } from "@shared/helix-environment-action-adapter-profile";
import {
  HELIX_MINECRAFT_PLAYER_ACTION_KINDS,
  minecraftPlayerCapabilityForActionKind,
} from "@shared/helix-minecraft-player-capabilities";
import {
  listEnvironmentConnectorCapabilityDescriptors,
  readBuiltinEnvironmentConnectorPackage,
} from "../services/environment-connectors/catalog";
import {
  listEnvironmentActionAdapterProfiles,
} from "../services/situation-room/environment-action-adapter-registry";

const expectedCapabilityIds = [...HELIX_MINECRAFT_PLAYER_ACTION_KINDS]
  .map(minecraftPlayerCapabilityForActionKind)
  .sort();

describe("Fabric player action profile/catalog parity", () => {
  it("publishes the same 13 action identities in policy, catalog, and package", () => {
    const profile = listEnvironmentActionAdapterProfiles().find(
      (record) =>
        record.profile.profile_id ===
          HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID,
    )?.profile;
    const descriptors = listEnvironmentConnectorCapabilityDescriptors({
      adapterProfileId: HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID,
    });
    const connectorPackage = readBuiltinEnvironmentConnectorPackage(
      "connector_package_version:com.casimirbot.minecraft.fabric-player:0.2.0",
    );

    expect(profile?.capabilities.map((entry) => entry.capability_id).sort())
      .toEqual(expectedCapabilityIds);
    expect(descriptors.map((entry) => entry.capability_id).sort())
      .toEqual(expectedCapabilityIds);
    expect(
      connectorPackage?.capabilityDescriptors
        .map((entry) => entry.capability_id)
        .sort(),
    ).toEqual(expectedCapabilityIds);
    expect(connectorPackage?.packageVersion).toBe("0.2.0");
  });

  it("keeps trusted action metadata aligned and native player identity hidden", () => {
    const profile = listEnvironmentActionAdapterProfiles().find(
      (record) =>
        record.profile.profile_id ===
          HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID,
    )?.profile;
    const descriptors = listEnvironmentConnectorCapabilityDescriptors({
      adapterProfileId: HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID,
    });
    expect(profile).toBeDefined();

    for (const descriptor of descriptors) {
      const policyCapability = profile?.capabilities.find(
        (entry) => entry.capability_id === descriptor.capability_id,
      );
      expect(policyCapability).toBeDefined();
      expect(descriptor.capability_class).toBe("act");
      expect(descriptor.read_only).toBe(false);
      expect(descriptor.side_effects_allowed).toBe(true);
      expect(descriptor.requires_current_turn_reentry).toBe(true);
      expect(descriptor.input_schema.properties).not.toHaveProperty(
        "target_subject_native_id",
      );
      expect(descriptor.input_schema.properties).not.toHaveProperty(
        "target_subject_label",
      );
      expect(descriptor.input_schema.properties?.action_kind?.enum).toEqual([
        policyCapability?.action_kind,
      ]);
      expect(policyCapability?.world_mutation_scope_required).toBe(
        policyCapability?.effect_class === "world_mutation",
      );
    }
  });

  it("declares Baritone only as an optional navigation engine", () => {
    const profile = listEnvironmentActionAdapterProfiles().find(
      (record) =>
        record.profile.profile_id ===
          HELIX_MINECRAFT_FABRIC_PLAYER_ACTION_PROFILE_ID,
    )?.profile;
    const baritoneCapabilities = profile?.capabilities.filter((entry) =>
      entry.allowed_control_engines.includes("baritone"),
    );
    expect(baritoneCapabilities).toEqual([
      expect.objectContaining({
        action_kind: "navigate_to",
        allowed_control_engines: ["native_fabric", "baritone"],
      }),
    ]);
  });
});
