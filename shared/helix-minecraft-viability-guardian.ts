import { z } from "zod";

export const HELIX_MINECRAFT_PLAYER_ARM_VIABILITY_GUARDIAN_CAPABILITY =
  "com.casimirbot.minecraft.player.viability_guardian.arm" as const;
export const HELIX_MINECRAFT_VIABILITY_GUARDIAN_PROFILE_ID =
  "resident.minecraft.fabric-guardian.v1" as const;

export const helixMinecraftDisarmViabilityGuardianArgumentsSchema = z
  .object({
    action_kind: z.literal("disarm_viability_guardian"),
    profile_id: z.literal(HELIX_MINECRAFT_VIABILITY_GUARDIAN_PROFILE_ID),
  })
  .strict();

export type HelixMinecraftDisarmViabilityGuardianArguments = z.infer<
  typeof helixMinecraftDisarmViabilityGuardianArgumentsSchema
>;

export const helixMinecraftArmViabilityGuardianArgumentsSchema = z
  .object({
    action_kind: z.literal("arm_viability_guardian"),
    profile_id: z.literal(HELIX_MINECRAFT_VIABILITY_GUARDIAN_PROFILE_ID),
    duration_ticks: z.number().int().min(200).max(36_000),
    minimum_air: z.number().int().min(1).max(300),
    dangerous_vertical_velocity: z.number().finite().min(-16).max(-0.01),
    maximum_swim_ticks: z.number().int().min(1).max(1_200),
    maximum_observation_age_ticks: z.number().int().min(0).max(20),
    response_repertoire: z
      .array(
        z.enum([
          "swim_up",
          "release_controls",
          "request_semantic_replan",
        ]),
      )
      .length(3)
      .refine((values) => new Set(values).size === 3, {
        message: "The baseline guardian requires its exact bounded repertoire.",
      }),
  })
  .strict();

export type HelixMinecraftArmViabilityGuardianArguments = z.infer<
  typeof helixMinecraftArmViabilityGuardianArgumentsSchema
>;
