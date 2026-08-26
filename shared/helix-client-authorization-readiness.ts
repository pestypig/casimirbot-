import { z } from "zod";
import { HELIX_AGENT_RUN_WRITE_SCOPE } from "./contracts/helix-agent-api.v1";
import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from
  "./contracts/helix-shared-live-room-agent.v1";
import {
  HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
  HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
} from "./helix-environment-action";

export const HELIX_CLIENT_AUTHORIZATION_READINESS_SCHEMA =
  "helix.client_authorization_readiness.v1" as const;

export const HELIX_CLIENT_AUTHORIZATION_CAPABILITY_PROFILES = [
  "g2-action",
  "g8-monitor",
] as const;

export const helixClientAuthorizationCapabilityProfileSchema = z.enum(
  HELIX_CLIENT_AUTHORIZATION_CAPABILITY_PROFILES,
);

export type HelixClientAuthorizationCapabilityProfile = z.infer<
  typeof helixClientAuthorizationCapabilityProfileSchema
>;

const G2_ACTION_SCOPES = [
  HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  HELIX_ENVIRONMENT_ACTION_READ_SCOPE,
  HELIX_ENVIRONMENT_ACTION_WRITE_SCOPE,
] as const;

const G8_MONITOR_SCOPES = [
  ...G2_ACTION_SCOPES,
  HELIX_AGENT_RUN_WRITE_SCOPE,
] as const;

export const requiredHelixClientAuthorizationScopes = (
  profile: HelixClientAuthorizationCapabilityProfile,
): readonly string[] => profile === "g8-monitor"
  ? G8_MONITOR_SCOPES
  : G2_ACTION_SCOPES;

export const helixClientAuthorizationReadinessSchema = z.object({
  schema: z.literal(HELIX_CLIENT_AUTHORIZATION_READINESS_SCHEMA),
  capability_profile: helixClientAuthorizationCapabilityProfileSchema,
  ready: z.boolean(),
  required_scopes: z.array(z.string().trim().min(1).max(240)).min(1).max(16),
  granted_required_scopes: z.array(z.string().trim().min(1).max(240)).max(16),
  missing_scopes: z.array(z.string().trim().min(1).max(240)).max(16),
  authorization_expires_at: z.string().datetime({ offset: true }),
  recovery_action: z.enum(["none", "authorize_missing_scopes"]),
  credential_included: z.literal(false),
  bearer_included: z.literal(false),
  subject_included: z.literal(false),
  client_identity_included: z.literal(false),
  raw_claims_included: z.literal(false),
  content_role: z.literal("client_authorization_readiness_not_assistant_answer"),
  reentry_required: z.literal(true),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
  raw_content_included: z.literal(false),
}).strict();

export type HelixClientAuthorizationReadiness = z.infer<
  typeof helixClientAuthorizationReadinessSchema
>;

export const buildHelixClientAuthorizationReadiness = (input: {
  capabilityProfile: HelixClientAuthorizationCapabilityProfile;
  grantedScopes: ReadonlySet<string>;
  authorizationExpiresAt: string;
}): HelixClientAuthorizationReadiness => {
  const requiredScopes = [...requiredHelixClientAuthorizationScopes(
    input.capabilityProfile,
  )];
  const grantedRequiredScopes = requiredScopes.filter((scope) =>
    input.grantedScopes.has(scope),
  );
  const missingScopes = requiredScopes.filter((scope) =>
    !input.grantedScopes.has(scope),
  );
  return helixClientAuthorizationReadinessSchema.parse({
    schema: HELIX_CLIENT_AUTHORIZATION_READINESS_SCHEMA,
    capability_profile: input.capabilityProfile,
    ready: missingScopes.length === 0,
    required_scopes: requiredScopes,
    granted_required_scopes: grantedRequiredScopes,
    missing_scopes: missingScopes,
    authorization_expires_at: input.authorizationExpiresAt,
    recovery_action: missingScopes.length === 0
      ? "none"
      : "authorize_missing_scopes",
    credential_included: false,
    bearer_included: false,
    subject_included: false,
    client_identity_included: false,
    raw_claims_included: false,
    content_role: "client_authorization_readiness_not_assistant_answer",
    reentry_required: true,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  });
};
