export const HELIX_PROFILE_INGRESS_TOKEN_SCHEMA =
  "helix.profile_ingress_token.v1" as const;
export const HELIX_PROFILE_INGRESS_TOKEN_RECEIPT_SCHEMA =
  "helix.profile_ingress_token_receipt.v1" as const;
export const HELIX_PROFILE_INGRESS_EVENT_RECEIPT_SCHEMA =
  "helix.profile_ingress_event_receipt.v1" as const;

export type HelixProfileIngressScope =
  | "source_event"
  | "discord_link"
  | "minecraft_bridge"
  | "live_environment_event";

export type HelixProfileIngressTokenSummary = {
  schema: typeof HELIX_PROFILE_INGRESS_TOKEN_SCHEMA;
  token_id: string;
  profile_id: string;
  label: string;
  scopes: HelixProfileIngressScope[];
  status: "active" | "revoked";
  public_ingress_url: string;
  token_prefix: string;
  created_at: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  last_used_at?: string | null;
  request_count: number;
  secret_stored_raw: false;
};

export type HelixProfileIngressTokenReceipt = {
  schema: typeof HELIX_PROFILE_INGRESS_TOKEN_RECEIPT_SCHEMA;
  ok: boolean;
  token: HelixProfileIngressTokenSummary | null;
  token_value?: string | null;
  message: string;
  error?: string | null;
  token_value_shown_once: boolean;
  secret_stored_raw: false;
};

export type HelixProfileIngressUsageSummary = {
  request_count: number;
  accepted_count: number;
  rejected_count: number;
  estimated_token_count: number;
  last_event_at?: string | null;
};

export type HelixProfileIngressEventReceipt = {
  schema: typeof HELIX_PROFILE_INGRESS_EVENT_RECEIPT_SCHEMA;
  ok: boolean;
  profile_id: string;
  token_id?: string | null;
  event_id?: string | null;
  accepted: boolean;
  message: string;
  error?: string | null;
  estimated_token_count: number;
  raw_secret_included: false;
  context_policy: "compact_context_pack_only";
};
