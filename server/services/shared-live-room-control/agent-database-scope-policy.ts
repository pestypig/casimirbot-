import { HELIX_SHARED_LIVE_ROOM_READ_SCOPE } from "@shared/contracts/helix-shared-live-room-agent.v1";
import {
  HELIX_AGENT_BOUND_ROOM_EVIDENCE_CAPABILITY,
  HELIX_AGENT_BOUND_ROOM_EVIDENCE_DATABASE_SCOPE,
  HELIX_AGENT_BOUND_ROOM_EVIDENCE_REQUIREMENT,
  HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_CAPABILITIES,
  HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_DATABASE_SCOPE,
  HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_REQUIREMENT,
  HELIX_AGENT_DATABASE_SCOPE_CATALOG,
  configuredHelixAgentDatabaseScopePolicies,
  type HelixAgentDatabaseScopePolicy,
} from "../helix-agent-api/database-scope-policy";

/**
 * Optional Shared Live Room extension for the external-agent database-scope
 * catalog. The public durable-run transport does not import this module.
 */
export const withSharedLiveRoomAgentDatabaseScopePolicy = (
  base: ReadonlyMap<
    string,
    HelixAgentDatabaseScopePolicy
  > = HELIX_AGENT_DATABASE_SCOPE_CATALOG,
): ReadonlyMap<string, HelixAgentDatabaseScopePolicy> => {
  const extended = new Map<string, HelixAgentDatabaseScopePolicy>(base);
  extended.set(HELIX_AGENT_BOUND_ROOM_EVIDENCE_DATABASE_SCOPE, {
    allowedTools: [HELIX_AGENT_BOUND_ROOM_EVIDENCE_CAPABILITY],
    requiredEvidence: [HELIX_AGENT_BOUND_ROOM_EVIDENCE_REQUIREMENT],
    oauthScope: HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  });
  extended.set(HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_DATABASE_SCOPE, {
    allowedTools: HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_CAPABILITIES,
    requiredEvidence: [
      HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_REQUIREMENT,
    ],
    oauthScope: HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
  });
  return extended;
};

/**
 * Selects only deployment-enabled core scopes, then conditionally adds the
 * Shared Live Room extension. An empty deployment set therefore remains
 * empty; importing the extension never enables a data scope by itself.
 */
export const configuredSharedLiveRoomAgentDatabaseScopePolicies = (
  configuredScopeIds: ReadonlySet<string>,
): ReadonlyMap<string, HelixAgentDatabaseScopePolicy> => {
  const selected = new Map(
    configuredHelixAgentDatabaseScopePolicies(configuredScopeIds),
  );
  if (configuredScopeIds.has(HELIX_AGENT_BOUND_ROOM_EVIDENCE_DATABASE_SCOPE)) {
    selected.set(HELIX_AGENT_BOUND_ROOM_EVIDENCE_DATABASE_SCOPE, {
      allowedTools: [HELIX_AGENT_BOUND_ROOM_EVIDENCE_CAPABILITY],
      requiredEvidence: [HELIX_AGENT_BOUND_ROOM_EVIDENCE_REQUIREMENT],
      oauthScope: HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
    });
  }
  if (
    configuredScopeIds.has(
      HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_DATABASE_SCOPE,
    )
  ) {
    selected.set(HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_DATABASE_SCOPE, {
      allowedTools: HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_CAPABILITIES,
      requiredEvidence: [
        HELIX_AGENT_BOUND_ROOM_ENVIRONMENT_PROBE_REQUIREMENT,
      ],
      oauthScope: HELIX_SHARED_LIVE_ROOM_READ_SCOPE,
    });
  }
  return selected;
};
