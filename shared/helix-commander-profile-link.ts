export const HELIX_COMMANDER_PROFILE_LINK_CODE_SCHEMA =
  "helix.commander_profile_link_code.v1" as const;
export const HELIX_COMMANDER_PROFILE_LINK_RECEIPT_SCHEMA =
  "helix.commander_profile_link_receipt.v1" as const;

export type HelixCommanderProfileLinkCode = {
  schema: typeof HELIX_COMMANDER_PROFILE_LINK_CODE_SCHEMA;
  code: string;
  session_id: string;
  guild_id: string;
  voice_channel_id: string;
  discord_user_id: string;
  display_name?: string | null;
  link_url: string;
  expires_at: string;
  consumed_at?: string | null;
  created_at: string;
  single_use: true;
  credential_collection_allowed: false;
};

export type HelixCommanderProfileLinkReceipt = {
  schema: typeof HELIX_COMMANDER_PROFILE_LINK_RECEIPT_SCHEMA;
  ok: boolean;
  code?: HelixCommanderProfileLinkCode | null;
  session_id?: string | null;
  linked_profile_id?: string | null;
  commander_discord_user_id?: string | null;
  message: string;
  error?: string | null;
  credential_collection_allowed: false;
};
