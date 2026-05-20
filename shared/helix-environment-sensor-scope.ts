export type HelixEnvironmentSensorScope =
  | "player_observable"
  | "player_memory"
  | "sensor_observable"
  | "privileged_server_state"
  | "unknown";

export type HelixEnvironmentSensorScopePolicy = {
  sensor_scope: HelixEnvironmentSensorScope;
  explanation: string;
  may_support_recommendation: boolean;
  requires_caveat: boolean;
  should_use_player_language: boolean;
};

export const HELIX_ENVIRONMENT_SENSOR_SCOPE_POLICIES: Record<
  HelixEnvironmentSensorScope,
  HelixEnvironmentSensorScopePolicy
> = {
  player_observable: {
    sensor_scope: "player_observable",
    explanation: "The actor/player could know this from normal play.",
    may_support_recommendation: true,
    requires_caveat: false,
    should_use_player_language: true,
  },
  player_memory: {
    sensor_scope: "player_memory",
    explanation: "The player previously observed this, for example by opening a chest.",
    may_support_recommendation: true,
    requires_caveat: false,
    should_use_player_language: true,
  },
  sensor_observable: {
    sensor_scope: "sensor_observable",
    explanation: "A valid environment sensor can report this, but it may exceed what the player saw.",
    may_support_recommendation: true,
    requires_caveat: true,
    should_use_player_language: false,
  },
  privileged_server_state: {
    sensor_scope: "privileged_server_state",
    explanation: "Server/plugin inspection can establish this, but it is not player-observed knowledge.",
    may_support_recommendation: true,
    requires_caveat: true,
    should_use_player_language: false,
  },
  unknown: {
    sensor_scope: "unknown",
    explanation: "The sensor cannot establish this.",
    may_support_recommendation: false,
    requires_caveat: true,
    should_use_player_language: false,
  },
};

export function isHelixEnvironmentSensorScope(value: unknown): value is HelixEnvironmentSensorScope {
  return (
    value === "player_observable" ||
    value === "player_memory" ||
    value === "sensor_observable" ||
    value === "privileged_server_state" ||
    value === "unknown"
  );
}

export function policyForEnvironmentSensorScope(
  scope: HelixEnvironmentSensorScope | null | undefined,
): HelixEnvironmentSensorScopePolicy {
  return HELIX_ENVIRONMENT_SENSOR_SCOPE_POLICIES[scope ?? "unknown"];
}
