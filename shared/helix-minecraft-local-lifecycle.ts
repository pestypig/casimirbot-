import { z } from "zod";

export const HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_CAPABILITY =
  "environment.minecraft.fabric_loopback.launch_and_join" as const;

export const HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_RECEIPT_SCHEMA =
  "helix.minecraft.workstation_launch_receipt.v1" as const;

export const HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_OBSERVATION_SCHEMA =
  "helix.minecraft.local_lifecycle_observation.v1" as const;

export const helixMinecraftLoopbackAddressSchema = z
  .string()
  .trim()
  .regex(/^(localhost|127\.0\.0\.1|\[::1\])(?::[0-9]{1,5})?$/i)
  .transform((value, context) => {
    const match = /^(localhost|127\.0\.0\.1|\[::1\])(?::([0-9]{1,5}))?$/i.exec(
      value,
    );
    if (!match) throw new Error("minecraft_loopback_address_required");
    const port = match[2] ? Number(match[2]) : 25565;
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "minecraft_loopback_port_invalid" });
      return z.NEVER;
    }
    return `${match[1].toLowerCase()}:${port}`;
  });

export const helixMinecraftLocalLifecycleRequestSchema = z
  .object({
    address: helixMinecraftLoopbackAddressSchema.default("localhost:25565"),
    restart_client: z.boolean().default(false),
  })
  .strict();

export const helixMinecraftLocalLifecycleOperatorRequestSchema =
  helixMinecraftLocalLifecycleRequestSchema.extend({
    operator_confirmation: z.literal(true),
  });

export const helixMinecraftLocalServerLifecycleSchema = z.object({
  schema: z.literal("helix.minecraft.local_server_lifecycle.v1"),
  status: z.enum(["starting", "listening", "stopped"]),
  server_process_id: z.number().int().positive(),
  process_started_at: z.string().datetime(),
  observed_at: z.string().datetime(),
  server_address: helixMinecraftLoopbackAddressSchema,
  launcher_action: z.enum(["launched_server", "reused_server"]),
  profile_digest: z.string().regex(/^[a-f0-9]{64}$/),
  credentials_exposed: z.literal(false),
  authority_widened: z.literal(false),
}).strict();

export type HelixMinecraftLocalServerLifecycle = z.infer<typeof helixMinecraftLocalServerLifecycleSchema>;

export const helixMinecraftLocalLifecycleReceiptSchema = z
  .object({
    schema: z.literal(
      HELIX_MINECRAFT_FABRIC_LOOPBACK_LIFECYCLE_RECEIPT_SCHEMA,
    ),
    status: z.literal("connected"),
    profile_id: z.string().trim().min(1).max(200),
    profile_version: z.string().trim().min(1).max(200),
    isolated_game_directory: z.boolean(),
    client_process_id: z.number().int().positive(),
    server_address: helixMinecraftLoopbackAddressSchema,
    launcher_action: z.enum(["launched_client", "reused_client"]),
    connection_action: z.enum(["autojoin_staged", "already_connected"]),
    play_control_point: z.string().trim().min(1).max(80),
    mod_loaded: z.literal(true),
    memory_used_percent: z.number().finite().min(0).max(100),
    credentials_exposed: z.literal(false),
    server_lifecycle: helixMinecraftLocalServerLifecycleSchema.optional(),
  })
  .strict();

export type HelixMinecraftLocalLifecycleRequest = z.infer<
  typeof helixMinecraftLocalLifecycleRequestSchema
>;

export type HelixMinecraftLocalLifecycleReceipt = z.infer<
  typeof helixMinecraftLocalLifecycleReceiptSchema
>;
