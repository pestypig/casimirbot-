import type { EnvironmentContainerSummary } from "@shared/helix-environment-state-snapshot";
import type { HelixEnvironmentSensorScope } from "@shared/helix-environment-sensor-scope";
import { policyForEnvironmentSensorScope } from "@shared/helix-environment-sensor-scope";

const label = (value: string): string =>
  value.replace(/minecraft:/g, "").replace(/_/g, " ");

export function environmentSensorScopePrefix(scope: HelixEnvironmentSensorScope | null | undefined): string {
  if (scope === "player_observable") return "You can see";
  if (scope === "player_memory") return "You previously observed";
  if (scope === "sensor_observable") return "The environment sensor reports";
  if (scope === "privileged_server_state") return "The server sensor reports";
  return "Not enough evidence confirms";
}

export function environmentSensorScopeCaveat(scope: HelixEnvironmentSensorScope | null | undefined): string | null {
  if (scope === "privileged_server_state") {
    return "This is privileged sensor state, not player-observed memory.";
  }
  if (scope === "sensor_observable") {
    return "This is sensor-observed state, not necessarily player knowledge.";
  }
  if (scope === "unknown") {
    return "Not enough evidence supports a recommendation.";
  }
  return null;
}

export function phraseContainerKnowledge(container: EnvironmentContainerSummary): string {
  const scope = container.sensor_scope ?? "unknown";
  const prefix = environmentSensorScopePrefix(scope);
  const contents = container.contents_summary?.length
    ? container.contents_summary.slice(0, 3).map((item) => `${item.count} ${label(item.item_type)}`).join(", ")
    : "contents unknown";
  const caveat = environmentSensorScopeCaveat(scope);
  const sentence = `${prefix} ${label(container.container_type)} (${contents}).`;
  return caveat ? `${sentence} ${caveat}` : sentence;
}

export function scopeAllowsPlayerKnowledgeLanguage(
  scope: HelixEnvironmentSensorScope | null | undefined,
): boolean {
  return policyForEnvironmentSensorScope(scope).should_use_player_language;
}
