export const HELIX_DISCORD_INTERACTION_RECEIPT_SCHEMA =
  "helix.discord_interaction_receipt.v1" as const;

export type HelixDiscordInteractionCommandName =
  | "start"
  | "link"
  | "status"
  | "attach-minecraft"
  | "companion-mode"
  | "ask"
  | "visual";

export type HelixDiscordInteractionReceipt = {
  schema: typeof HELIX_DISCORD_INTERACTION_RECEIPT_SCHEMA;
  ok: boolean;
  interaction_id?: string | null;
  application_id?: string | null;
  guild_id?: string | null;
  channel_id?: string | null;
  discord_user_id?: string | null;
  command?: HelixDiscordInteractionCommandName | string | null;
  subcommand?: string | null;
  session_id?: string | null;
  thread_id?: string | null;
  terminal_answer_source?: string | null;
  terminal_artifact_kind?: string | null;
  terminal_hash?: string | null;
  poison_audit_ok?: boolean | null;
  deferred: boolean;
  answer_created: boolean;
  credential_collection_allowed: false;
  context_policy: "compact_context_pack_only";
  error?: string | null;
  created_at: string;
};

export type HelixDiscordSlashCommandDefinition = {
  name: "helix";
  description: string;
  type: 1;
  options: Array<Record<string, unknown>>;
};
