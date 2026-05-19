import type { HelixEnvironmentStateSnapshot } from "@shared/helix-environment-state-snapshot";

export type EnvironmentStateSnapshotReduction = {
  schema: "helix.environment_state_snapshot_reduction.v1";
  snapshot_id: string;
  situation: string;
  actor_state: string;
  resources: string;
  risk: string;
  unknowns: string;
  evidence_refs: string[];
  assistant_answer: false;
  raw_content_included: false;
};

const label = (value: string): string =>
  value.replace(/minecraft:/g, "").replace(/_/g, " ");

export function reduceEnvironmentStateSnapshot(snapshot: HelixEnvironmentStateSnapshot): EnvironmentStateSnapshotReduction {
  const actor = snapshot.actor_label ?? snapshot.actor_id ?? "Actor";
  const selected = snapshot.inventory_state?.selected_item?.item_type
    ? ` holding ${label(snapshot.inventory_state.selected_item.item_type)}`
    : "";
  const health = typeof snapshot.actor_state?.health === "number" ? `health ${snapshot.actor_state.health}` : null;
  const food = typeof snapshot.actor_state?.food_level === "number" ? `food ${snapshot.actor_state.food_level}` : null;
  const carried = snapshot.inventory_state?.carried_items ?? [];
  const carriedSummary = carried.length
    ? carried.slice(0, 6).map((item) => `${item.count} ${label(item.item_type)}`).join(", ")
    : "No carried items are confirmed.";
  const containers = snapshot.object_state?.nearby_containers ?? [];
  const containerSummary = containers.length
    ? containers.slice(0, 4).map((entry) => {
        const contents = entry.contents_summary?.length
          ? entry.contents_summary.slice(0, 3).map((item) => `${item.count} ${label(item.item_type)}`).join(", ")
          : "contents unknown";
        return `${label(entry.container_type)} (${contents})`;
      }).join("; ")
    : "No known nearby containers.";
  const hazards = snapshot.object_state?.hazards ?? [];
  const risk = hazards.length
    ? hazards.map((hazard) => `${hazard.severity}: ${label(hazard.hazard_type)}`).join("; ")
    : typeof snapshot.actor_state?.health === "number" && snapshot.actor_state.health <= 6
      ? `${actor} has low health.`
      : typeof snapshot.actor_state?.food_level === "number" && snapshot.actor_state.food_level <= 6
        ? `${actor} has low food.`
        : "No risk promoted unless hazards or status thresholds are present.";
  const focus = snapshot.focus?.target_type
    ? `Focus target is ${label(snapshot.focus.target_type)}${snapshot.focus.reachable === true ? " and reachable" : ""}.`
    : "No focus target is confirmed.";
  const changed = snapshot.changed_sections.length
    ? `Changed sections: ${snapshot.changed_sections.join(", ")}.`
    : "No section-level change was declared.";
  return {
    schema: "helix.environment_state_snapshot_reduction.v1",
    snapshot_id: snapshot.snapshot_id,
    situation: `${actor}${selected}; ${focus}`,
    actor_state: [health, food, snapshot.actor_state?.mode ? `mode ${snapshot.actor_state.mode}` : null].filter(Boolean).join(", ") || "Structured actor state updated.",
    resources: `${carriedSummary} Known containers: ${containerSummary}`,
    risk,
    unknowns: `${changed} Raw payloads are excluded; adapter detail is compacted.`,
    evidence_refs: [snapshot.snapshot_id, ...snapshot.evidence_refs],
    assistant_answer: false,
    raw_content_included: false,
  };
}

