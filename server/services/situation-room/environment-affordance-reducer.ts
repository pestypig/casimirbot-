import type { HelixEnvironmentStateSnapshot } from "@shared/helix-environment-state-snapshot";

export type HelixEnvironmentAffordanceContext = {
  schema: "helix.environment_affordance_context.v1";
  context_id: string;
  snapshot_id: string;
  domain: HelixEnvironmentStateSnapshot["domain"];
  room_id: string;
  visible: string[];
  reachable: string[];
  usable: string[];
  traversable: string[];
  hazards: string[];
  evidence_refs: string[];
  deterministic: true;
  model_invoked: false;
  assistant_answer: false;
  raw_content_included: false;
};

export function reduceEnvironmentAffordances(snapshot: HelixEnvironmentStateSnapshot): HelixEnvironmentAffordanceContext {
  const focusReachable = snapshot.focus?.reachable === true && snapshot.focus.target_type
    ? [snapshot.focus.target_type]
    : [];
  const visible = [
    ...(snapshot.object_state?.nearby_entities ?? []).map((entry) => entry.object_type),
    ...(snapshot.object_state?.nearby_containers ?? []).map((entry) => entry.container_type),
    ...(snapshot.object_state?.resources ?? []).map((entry) => entry.resource_type),
    ...(snapshot.focus?.target_type ? [snapshot.focus.target_type] : []),
  ];
  const usable = [
    ...(snapshot.inventory_state?.selected_item?.item_type ? [snapshot.inventory_state.selected_item.item_type] : []),
    ...(snapshot.object_state?.nearby_containers ?? []).filter((entry) => entry.contents_known).map((entry) => entry.container_type),
  ];
  return {
    schema: "helix.environment_affordance_context.v1",
    context_id: `environment_affordance:${snapshot.snapshot_id}`,
    snapshot_id: snapshot.snapshot_id,
    domain: snapshot.domain,
    room_id: snapshot.room_id,
    visible: Array.from(new Set(visible)).slice(0, 16),
    reachable: Array.from(new Set(focusReachable)).slice(0, 12),
    usable: Array.from(new Set(usable)).slice(0, 12),
    traversable: snapshot.local_map?.salient_cells?.filter((cell) => cell.tags?.includes("traversable")).map((cell) => cell.cell_type).slice(0, 12) ?? [],
    hazards: (snapshot.object_state?.hazards ?? []).map((entry) => `${entry.severity}:${entry.hazard_type}`).slice(0, 12),
    evidence_refs: snapshot.evidence_refs,
    deterministic: true,
    model_invoked: false,
    assistant_answer: false,
    raw_content_included: false,
  };
}

