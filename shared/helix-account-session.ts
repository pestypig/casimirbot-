import type {
  HelixProfileIngressTokenSummary,
  HelixProfileIngressUsageSummary,
} from "./helix-profile-ingress";

export const HELIX_ACCOUNT_SESSION_SCHEMA = "helix.account_session.v1" as const;
export const HELIX_ACCOUNT_SESSION_STATUS_SCHEMA =
  "helix.account_session_status.v1" as const;
export const HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA =
  "helix.account_session_receipt.v1" as const;

export type HelixAccountSessionProfile = {
  profile_id: string;
  display_name: string;
  email?: string | null;
  auth_mode: "web_auth" | "local_dev_profile" | "local_password_profile";
  provider?: "google" | "local" | null;
  provider_subject?: string | null;
  picture_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type HelixAccountLinkedAccount = {
  provider: "discord" | "minehut" | "browser" | "local" | "google";
  external_id: string;
  display_name?: string | null;
  status: "linked" | "pending" | "revoked";
  authority?: "owner" | "commander" | "participant" | "viewer" | null;
  linked_at?: string | null;
};

export type HelixAccountUsageSummary = {
  thread_count: number;
  item_count: number;
  answer_count: number;
  tool_observation_count: number;
  validation_count: number;
  estimated_token_count: number;
  window_started_at: string;
  window_ended_at: string;
};

export type HelixAccountSession = {
  schema: typeof HELIX_ACCOUNT_SESSION_SCHEMA;
  session_id: string;
  profile: HelixAccountSessionProfile;
  status: "active" | "signed_out";
  memory_scope: "profile" | "session_only";
  created_at: string;
  updated_at: string;
};

export type HelixAccountSessionStatus = {
  schema: typeof HELIX_ACCOUNT_SESSION_STATUS_SCHEMA;
  ok: boolean;
  session: HelixAccountSession | null;
  linked_accounts: HelixAccountLinkedAccount[];
  profile_ingress_tokens: HelixProfileIngressTokenSummary[];
  profile_ingress_usage: HelixProfileIngressUsageSummary;
  usage: HelixAccountUsageSummary;
  auth_boundary: {
    credential_collection_allowed_in_agents: false;
    raw_password_stored: false;
    discord_bot_password_collection_allowed: false;
    recommended_flow: "web_auth_or_oauth_link" | "dev_local_password_profile";
    local_password_profile_available?: boolean;
    local_password_profile_dev_default?: boolean;
  };
};

export type HelixAccountSessionReceipt = {
  schema: typeof HELIX_ACCOUNT_SESSION_RECEIPT_SCHEMA;
  ok: boolean;
  session: HelixAccountSession | null;
  message: string;
  error?: string | null;
  raw_password_stored: false;
  credential_collection_allowed_in_agents: false;
  auth_method?: "web_auth" | "local_dev_profile" | "local_password_profile" | null;
};
