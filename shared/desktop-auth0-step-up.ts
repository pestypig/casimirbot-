import { z } from "zod";

export const AUTH0_MFA_ACR =
  "http://schemas.openid.net/pape/policies/2007/06/multi-factor" as const;

export const AUTH0_STEP_UP_DEFAULT_MAX_AGE_SECONDS = 5 * 60;
export const AUTH0_STEP_UP_MINIMUM_MAX_AGE_SECONDS = 60;
export const AUTH0_STEP_UP_MAXIMUM_MAX_AGE_SECONDS = 15 * 60;

export const DESKTOP_AUTH0_STEP_UP_REDIRECT_URI =
  "casimirbot://oauth/callback" as const;

export const DESKTOP_AUTH0_STEP_UP_START_PATH =
  "/api/account/security/step-up/start" as const;
export const DESKTOP_AUTH0_STEP_UP_CALLBACK_PATH =
  "/api/account/security/step-up/callback" as const;
export const DESKTOP_AUTH0_STEP_UP_INSPECT_PATH =
  "/api/account/security/step-up/inspect" as const;
export const DESKTOP_AUTH0_STEP_UP_STATUS_PATH =
  "/api/account/security/status" as const;
export const DESKTOP_AUTH0_STEP_UP_DEVICE_REGISTER_PATH =
  "/api/account/security/devices/register" as const;
export const DESKTOP_AUTH0_STEP_UP_DEVICE_RECOVER_PATH =
  "/api/account/security/devices/recover" as const;
export const DESKTOP_AUTH0_STEP_UP_DEVICE_REVOKE_PATH =
  "/api/account/security/devices/revoke" as const;
export const DESKTOP_AUTH0_STEP_UP_SESSION_REVOKE_PATH =
  "/api/account/security/sessions/revoke" as const;

export const helixStepUpPurposeSchema = z.enum([
  "device_register",
  "device_recover",
  "device_revoke",
  "session_revoke",
  "provider_connection_change",
  "payment_change",
  "usage_ceiling_raise",
  "billable_session_arm",
  "high_scope_agent_bind",
]);

export type HelixStepUpPurpose = z.infer<typeof helixStepUpPurposeSchema>;

export const helixStepUpStartRequestSchema = z.object({
  purpose: helixStepUpPurposeSchema,
  target_ref: z.string().min(1).max(512).nullable().default(null),
}).strict();

export const helixStepUpStartReceiptSchema = z.object({
  schema: z.literal("helix.auth0_step_up_start.v1"),
  ok: z.literal(true),
  authorization_url: z.string().url().max(8_192),
  purpose: helixStepUpPurposeSchema,
  target_ref: z.string().min(1).max(512).nullable(),
  expires_at: z.string().datetime(),
  provider: z.literal("auth0"),
  pkce: z.literal("S256"),
  nonce_bound: z.literal(true),
  mfa_acr_requested: z.literal(AUTH0_MFA_ACR),
  usable_receipt_included: z.literal(false),
  identity_token_included: z.literal(false),
  access_token_included: z.literal(false),
  factor_detail_included: z.literal(false),
}).strict();

export const helixStepUpCompletionProjectionSchema = z.object({
  schema: z.literal("helix.auth0_step_up_completion.v1"),
  ok: z.boolean(),
  error: z.string().min(1).max(80).optional(),
  receipt_ref: z.string().min(1).max(160).optional(),
  purpose: helixStepUpPurposeSchema.optional(),
  target_ref: z.string().min(1).max(512).nullable().optional(),
  expires_at: z.string().datetime().optional(),
  operation_applied: z.boolean().optional(),
  usable_receipt_included: z.literal(false),
  identity_token_included: z.literal(false),
  access_token_included: z.literal(false),
  factor_detail_included: z.literal(false),
}).strict();

export const helixInstalledSecurityStatusSchema = z.object({
  schema: z.literal("helix.installed_security_status.v1"),
  ok: z.literal(true),
  generated_at: z.string().datetime(),
  profile_ref: z.string().min(1).max(512),
  current_session_ref: z.string().min(1).max(160),
  mfa: z.object({
    provider: z.literal("auth0"),
    configured: z.boolean(),
    fresh_step_up_available: z.boolean(),
    required_acr: z.literal(AUTH0_MFA_ACR),
    maximum_age_seconds: z.number().int().min(60).max(900),
    factor_detail_included: z.literal(false),
  }).strict(),
  current_device: z.object({
    device_ref: z.string().min(1).max(160),
    label: z.string().min(1).max(120),
    platform: z.literal("windows"),
    status: z.enum(["unregistered", "active", "revoked", "recovery_required"]),
    registered_at: z.string().datetime().nullable(),
    last_seen_at: z.string().datetime().nullable(),
    revoked_at: z.string().datetime().nullable(),
    recovery_generation: z.number().int().nonnegative(),
  }).strict(),
  sessions: z.array(z.object({
    session_ref: z.string().min(1).max(160),
    status: z.enum(["active", "signed_out"]),
    current: z.boolean(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    expires_at: z.string().datetime().nullable(),
  }).strict()).max(50),
  recent_events: z.array(z.object({
    event_ref: z.string().min(1).max(160),
    event_type: z.enum([
      "installed_device_registered",
      "installed_device_recovered",
      "installed_device_revoked",
      "installed_session_revoked",
    ]),
    target_ref: z.string().min(1).max(160),
    created_at: z.string().datetime(),
  }).strict()).max(25),
  agent_authority: z.object({
    may_inspect_sanitized_status: z.literal(true),
    may_start_step_up: z.literal(false),
    may_complete_mfa: z.literal(false),
    may_receive_usable_receipt: z.literal(false),
    may_register_or_recover_device: z.literal(false),
    may_revoke_session: z.literal(false),
  }).strict(),
  usable_receipt_included: z.literal(false),
  identity_token_included: z.literal(false),
  access_token_included: z.literal(false),
  factor_detail_included: z.literal(false),
}).strict();

export type HelixStepUpStartRequest = z.infer<typeof helixStepUpStartRequestSchema>;
export type HelixStepUpStartReceipt = z.infer<typeof helixStepUpStartReceiptSchema>;
export type HelixStepUpCompletionProjection = z.infer<
  typeof helixStepUpCompletionProjectionSchema
>;
export type HelixInstalledSecurityStatus = z.infer<
  typeof helixInstalledSecurityStatusSchema
>;
