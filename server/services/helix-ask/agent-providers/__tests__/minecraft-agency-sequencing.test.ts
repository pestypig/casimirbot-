import { describe, expect, it } from "vitest";
import {
  buildMinecraftAgencyCompoundCoverageResolutions,
  buildMinecraftPostMutationVerificationRequest,
  evaluateMinecraftAgencySequence,
  requiresCurrentTurnCheckpointBeforeMinecraftMutation,
} from "../minecraft-agency-sequencing";
import { HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY } from "@shared/helix-environment-connector";

const command = (value: string, effect: string) => ({
  capability: "com.casimirbot.minecraft.command",
  arguments: { command: value, effect },
});

const result = (ok: boolean) =>
  ({
    ok,
    capability_id: "com.casimirbot.minecraft.command",
    gateway_admission: {
      requested_capability: "com.casimirbot.minecraft.command",
    },
  }) as any;

const observedResult = (
  capability: string,
  callId: string,
  ok = true,
  observation?: Record<string, unknown>,
) =>
  ({
    ok,
    capability_id: capability,
    artifact_refs: [`artifact:${callId}`],
    gateway_admission: { requested_capability: capability },
    observation_packet: {
      call_id: callId,
      observation_ref: `observation:${callId}`,
      produced_artifact_refs: [`artifact:${callId}`],
    },
    observation,
  }) as any;

describe("Minecraft agency sequencing", () => {
  const prompt =
    "Inspect the site. Capture a rollback checkpoint before changing blocks. Build the wall, then verify it.";

  it("recognizes affirmative and fail-closed checkpoint ordering", () => {
    expect(
      requiresCurrentTurnCheckpointBeforeMinecraftMutation(prompt),
    ).toBe(true);
    expect(
      requiresCurrentTurnCheckpointBeforeMinecraftMutation(
        "Never build the wall without a checkpoint.",
      ),
    ).toBe(true);
    expect(
      requiresCurrentTurnCheckpointBeforeMinecraftMutation(
        "Build a wall and report its endpoints.",
      ),
    ).toBe(false);
  });

  it("blocks a mutation until a successful checkpoint observation exists", () => {
    const decision = evaluateMinecraftAgencySequence({
      prompt,
      candidate: command(
        "fill 1 64 1 5 66 1 minecraft:stone_bricks",
        "world_mutation",
      ),
      priorRequests: [],
      gatewayCallResults: [],
    });

    expect(decision.admitted).toBe(false);
    expect(decision.reason).toContain("checkpoint capture observation");
    expect(decision.reason).toContain("save-all");
    expect(decision.recovery_lane_request).toEqual({
      capability: "com.casimirbot.minecraft.command.catalog",
      arguments: {
        path_prefix: "helixgame checkpoint",
        limit: 64,
      },
    });
  });

  it("allows checkpoint capture and then admits the ordered mutation", () => {
    const checkpoint = command(
      "execute as @s at @s run helixgame checkpoint capture agency_build 12 8",
      "server_administration",
    );
    expect(
      evaluateMinecraftAgencySequence({
        prompt,
        candidate: checkpoint,
        priorRequests: [],
        gatewayCallResults: [],
      }).admitted,
    ).toBe(true);
    expect(
      evaluateMinecraftAgencySequence({
        prompt,
        candidate: command(
          "fill 1 64 1 5 66 1 minecraft:stone_bricks",
          "world_mutation",
        ),
        priorRequests: [checkpoint],
        gatewayCallResults: [result(true)],
      }).admitted,
    ).toBe(true);
  });

  it("does not treat a failed checkpoint or a read-only command as mutation authority", () => {
    const checkpoint = command(
      "helixgame checkpoint capture agency_build 12 8",
      "server_administration",
    );
    expect(
      evaluateMinecraftAgencySequence({
        prompt,
        candidate: command(
          "fill 1 64 1 5 66 1 minecraft:stone_bricks",
          "world_mutation",
        ),
        priorRequests: [checkpoint],
        gatewayCallResults: [result(false)],
      }).admitted,
    ).toBe(false);
    expect(
      evaluateMinecraftAgencySequence({
        prompt,
        candidate: command("data get entity @s Pos", "read_only"),
        priorRequests: [],
        gatewayCallResults: [],
      }).admitted,
    ).toBe(true);
  });

  it("proves inspect-first and checkpoint-before-mutation from ordered observations", () => {
    const inspect = {
      capability: HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
      arguments: { purpose: "build_planning" },
    };
    const checkpoint = command(
      "helixgame checkpoint capture wall_rollback 12 8",
      "server_administration",
    );
    const mutation = command(
      "fill 1 64 1 5 66 1 minecraft:stone_bricks",
      "world_mutation",
    );
    const resolutions = buildMinecraftAgencyCompoundCoverageResolutions({
      compoundContract: {
        requirements: [
          { id: "R2", text: "Inspect first." },
          { id: "R4", text: "Capture a rollback checkpoint before changes." },
          { id: "R5", text: "Re-inspect the same footprint after changing it." },
        ],
      },
      priorRequests: [inspect, checkpoint, mutation],
      gatewayCallResults: [
        observedResult(HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY, "inspect"),
        observedResult("com.casimirbot.minecraft.command", "checkpoint"),
        observedResult("com.casimirbot.minecraft.command", "mutation"),
      ],
    });

    expect(resolutions.map((entry) => entry.requirement_id)).toEqual([
      "R2",
      "R4",
    ]);
    expect(resolutions[0].evidence_refs).toEqual(
      expect.arrayContaining(["artifact:inspect", "artifact:mutation"]),
    );
    expect(resolutions).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ requirement_id: "R5" })]),
    );
  });

  it("does not claim inspect-first when the inspection occurs after mutation", () => {
    const mutation = command(
      "fill 1 64 1 5 66 1 minecraft:stone_bricks",
      "world_mutation",
    );
    const inspect = {
      capability: HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
      arguments: { purpose: "build_planning" },
    };
    const resolutions = buildMinecraftAgencyCompoundCoverageResolutions({
      compoundContract: {
        requirements: [{ id: "R2", text: "Inspect first." }],
      },
      priorRequests: [mutation, inspect],
      gatewayCallResults: [
        observedResult("com.casimirbot.minecraft.command", "mutation"),
        observedResult(HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY, "inspect"),
      ],
    });

    expect(resolutions).toEqual([]);
  });

  it("derives a bounded exact-footprint verification request from an absolute fill", () => {
    expect(
      buildMinecraftPostMutationVerificationRequest(
        command(
          "fill -46 69 -16 -42 71 -16 minecraft:stone_bricks",
          "world_mutation",
        ),
      ),
    ).toEqual({
      capability: HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
      arguments: {
        target: "current_actor",
        horizontal_radius: 7,
        vertical_radius: 8,
        purpose: "structure_verification",
        verification_from: { x: -46, y: 69, z: -16 },
        verification_to: { x: -42, y: 71, z: -16 },
        expected_block: "minecraft:stone_bricks",
        freshness_requirement_ms: 5_000,
      },
    });
    expect(
      buildMinecraftPostMutationVerificationRequest(
        command("fill ~ ~ ~ ~4 ~2 ~ minecraft:stone_bricks", "world_mutation"),
      ),
    ).toBeNull();
    expect(
      buildMinecraftPostMutationVerificationRequest(
        command(
          "fill 1 64 1 5 66 1 minecraft:stone_bricks hollow",
          "world_mutation",
        ),
      ),
    ).toBeNull();
    expect(
      buildMinecraftPostMutationVerificationRequest(
        command(
          "setblock -40 69 -12 minecraft:fire[age=0] replace",
          "world_mutation",
        ),
      ),
    ).toEqual({
      capability: HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
      arguments: {
        target: "current_actor",
        horizontal_radius: 7,
        vertical_radius: 8,
        purpose: "structure_verification",
        verification_from: { x: -40, y: 69, z: -12 },
        verification_to: { x: -40, y: 69, z: -12 },
        expected_block: "minecraft:fire",
        freshness_requirement_ms: 5_000,
      },
    });
  });

  it("redirects a post-mutation planning survey to exact structure verification", () => {
    const mutation = command(
      "fill -46 69 -16 -42 71 -16 minecraft:stone_bricks",
      "world_mutation",
    );
    const decision = evaluateMinecraftAgencySequence({
      prompt: "Build the wall, then inspect the finished wall and verify it.",
      candidate: {
        capability: HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
        arguments: {
          target: "current_actor",
          purpose: "build_planning",
          requested_length: 5,
          requested_height: 3,
        },
      },
      priorRequests: [mutation],
      gatewayCallResults: [
        observedResult("com.casimirbot.minecraft.command", "mutation"),
      ],
    });

    expect(decision.admitted).toBe(false);
    expect(decision.reason).toContain("searches for empty space");
    expect(decision.recovery_lane_request).toEqual(
      buildMinecraftPostMutationVerificationRequest(mutation),
    );
  });

  it("admits only the exact fresh post-mutation verification footprint", () => {
    const mutation = command(
      "fill -46 69 -16 -42 71 -16 minecraft:stone_bricks",
      "world_mutation",
    );
    const exact = buildMinecraftPostMutationVerificationRequest(mutation)!;
    expect(
      evaluateMinecraftAgencySequence({
        prompt: "Build the wall, then verify the finished result.",
        candidate: exact,
        priorRequests: [mutation],
        gatewayCallResults: [
          observedResult("com.casimirbot.minecraft.command", "mutation"),
        ],
      }).admitted,
    ).toBe(true);
    expect(
      evaluateMinecraftAgencySequence({
        prompt: "Build the wall, then verify the finished result.",
        candidate: {
          ...exact,
          arguments: {
            ...(exact.arguments as Record<string, unknown>),
            freshness_requirement_ms: 30_000,
          },
        },
        priorRequests: [mutation],
        gatewayCallResults: [
          observedResult("com.casimirbot.minecraft.command", "mutation"),
        ],
      }).admitted,
    ).toBe(false);
  });

  it("proves finished-footprint coverage only from a complete all-match observation", () => {
    const inspect = {
      capability: HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
      arguments: { purpose: "build_planning" },
    };
    const mutation = command(
      "fill 1 64 1 5 66 1 minecraft:stone_bricks",
      "world_mutation",
    );
    const verification = buildMinecraftPostMutationVerificationRequest(mutation)!;
    const requirements = {
      requirements: [
        { id: "R2", text: "Inspect first." },
        { id: "R5", text: "Re-inspect the same footprint after changing it." },
      ],
    };
    const gatewayResults = (allMatch: boolean) => [
      observedResult(HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY, "inspect"),
      observedResult("com.casimirbot.minecraft.command", "mutation"),
      observedResult(
        HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
        "verification",
        true,
        {
          result: {
            target_geometry_verification: {
              complete: true,
              all_match: allMatch,
            },
          },
        },
      ),
    ];

    expect(
      buildMinecraftAgencyCompoundCoverageResolutions({
        compoundContract: requirements,
        priorRequests: [inspect, mutation, verification],
        gatewayCallResults: gatewayResults(true),
      }).map((entry) => entry.requirement_id),
    ).toEqual(["R2", "R5"]);
    expect(
      buildMinecraftAgencyCompoundCoverageResolutions({
        compoundContract: requirements,
        priorRequests: [inspect, mutation, verification],
        gatewayCallResults: gatewayResults(false),
      }).map((entry) => entry.requirement_id),
    ).toEqual(["R2"]);
  });

  it("requires exact evidence for every mutation in a bounded command program", () => {
    const wall = command(
      "fill -46 69 -16 -42 71 -16 minecraft:stone_bricks",
      "world_mutation",
    );
    const fire = command(
      "setblock -40 69 -12 minecraft:fire",
      "world_mutation",
    );
    const fireVerification = buildMinecraftPostMutationVerificationRequest(fire)!;
    const decision = evaluateMinecraftAgencySequence({
      prompt: "Build the hearth, ignite it, then verify the finished result.",
      candidate: {
        capability: HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
        arguments: { target: "current_actor", purpose: "fire_safety" },
      },
      priorRequests: [wall, fire, fireVerification],
      gatewayCallResults: [
        observedResult("com.casimirbot.minecraft.command", "wall"),
        observedResult("com.casimirbot.minecraft.command", "fire"),
        observedResult(
          HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
          "fire-verification",
          true,
          {
            result: {
              target_geometry_verification: {
                complete: true,
                all_match: true,
              },
            },
          },
        ),
      ],
    });

    expect(decision.admitted).toBe(false);
    expect(decision.recovery_lane_request).toEqual(
      buildMinecraftPostMutationVerificationRequest(wall),
    );
  });

  it("resolves finished-result coverage only after every mutation matches", () => {
    const wall = command(
      "fill -46 69 -16 -42 71 -16 minecraft:stone_bricks",
      "world_mutation",
    );
    const fire = command(
      "setblock -40 69 -12 minecraft:fire",
      "world_mutation",
    );
    const wallVerification = buildMinecraftPostMutationVerificationRequest(wall)!;
    const fireVerification = buildMinecraftPostMutationVerificationRequest(fire)!;
    const requirements = {
      requirements: [
        { id: "R5", text: "Verify the finished result after changing it." },
      ],
    };
    const verificationResult = (callId: string, allMatch: boolean) =>
      observedResult(
        HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
        callId,
        true,
        {
          result: {
            target_geometry_verification: {
              complete: true,
              all_match: allMatch,
            },
          },
        },
      );
    const requests = [wall, fire, wallVerification, fireVerification];

    expect(
      buildMinecraftAgencyCompoundCoverageResolutions({
        compoundContract: requirements,
        priorRequests: requests,
        gatewayCallResults: [
          observedResult("com.casimirbot.minecraft.command", "wall"),
          observedResult("com.casimirbot.minecraft.command", "fire"),
          verificationResult("wall-verification", true),
          verificationResult("fire-verification", true),
        ],
      }).map((entry) => entry.requirement_id),
    ).toEqual(["R5"]);
    expect(
      buildMinecraftAgencyCompoundCoverageResolutions({
        compoundContract: requirements,
        priorRequests: requests,
        gatewayCallResults: [
          observedResult("com.casimirbot.minecraft.command", "wall"),
          observedResult("com.casimirbot.minecraft.command", "fire"),
          verificationResult("wall-verification", true),
          verificationResult("fire-verification", false),
        ],
      }),
    ).toEqual([]);
  });
});
