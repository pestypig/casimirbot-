import crypto from "node:crypto";
import {
  HELIX_ENVIRONMENT_POSSIBILITY_GRAPH_SCHEMA,
  type HelixPossibilityGraph,
} from "@shared/helix-environment-possibility-graph";
import type { EnvironmentContainerSummary, HelixEnvironmentStateSnapshot } from "@shared/helix-environment-state-snapshot";
import type { HelixEnvironmentAffordanceContext } from "./environment-affordance-reducer";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const foodPattern = /(?:apple|bread|carrot|potato|beef|porkchop|chicken|mutton|rabbit|stew|soup|melon|cookie|fish|cod|salmon|food)/i;

const hasFood = (items: Array<{ item_type: string; count?: number }>): boolean =>
  items.some((item) => foodPattern.test(item.item_type) && (item.count ?? 0) > 0);

const firstFoodContainer = (containers: EnvironmentContainerSummary[]): EnvironmentContainerSummary | null =>
  containers.find((container) => hasFood(container.contents_summary ?? [])) ?? null;

export function buildPossibilityGraph(input: {
  objective: string;
  threadId: string;
  environmentId?: string | null;
  environmentState: HelixEnvironmentStateSnapshot;
  affordanceContext?: HelixEnvironmentAffordanceContext | null;
  memoryLedger?: { known_containers?: EnvironmentContainerSummary[] } | null;
  source?: string | null;
  now?: string;
}): HelixPossibilityGraph | null {
  const snapshot = input.environmentState;
  const carriedItems = snapshot.inventory_state?.carried_items ?? [];
  const knownContainers = input.memoryLedger?.known_containers ?? snapshot.object_state?.nearby_containers ?? [];
  const foodContainer = firstFoodContainer(knownContainers);
  const lowFood = typeof snapshot.actor_state?.food_level === "number" && snapshot.actor_state.food_level <= 8;
  const miningContext = /\b(?:mine|mining|cave|ore|diamond|strip)\b/i.test(input.objective);
  const needsFood = (lowFood || miningContext) && !hasFood(carriedItems) && Boolean(foodContainer);
  if (!needsFood || !foodContainer) return null;
  const foodItem = (foodContainer.contents_summary ?? []).find((item) => foodPattern.test(item.item_type));
  const now = input.now ?? new Date().toISOString();
  const evidenceRefs = Array.from(new Set([
    snapshot.snapshot_id,
    ...snapshot.evidence_refs,
  ]));
  const graphId = `possibility_graph:${hashShort([snapshot.snapshot_id, input.objective, foodContainer.container_ref, foodItem?.item_type])}`;
  return {
    schema: HELIX_ENVIRONMENT_POSSIBILITY_GRAPH_SCHEMA,
    graph_id: graphId,
    domain: snapshot.domain,
    thread_id: input.threadId,
    environment_id: input.environmentId ?? null,
    room_id: snapshot.room_id,
    source_snapshot_refs: [snapshot.snapshot_id],
    objective: input.objective,
    graph_status: "rehearsal_ready",
    nodes: [
      {
        node_id: "start",
        kind: "start",
        label: "Prepare for the current objective",
        description: input.objective,
        evidence_refs: evidenceRefs,
      },
      {
        node_id: "check_food",
        kind: "resource_check",
        label: "Check carried food",
        preconditions: ["inventory_state available"],
        expected_effects: ["confirm whether the actor already carries food"],
        evidence_refs: evidenceRefs,
      },
      {
        node_id: "go_to_container",
        kind: "navigation",
        label: `Go to ${foodContainer.container_type}`,
        preconditions: ["container location known or locally reachable"],
        required_capabilities: ["navigation_readiness"],
        domain_action: {
          adapter: snapshot.domain,
          action_type: "move_to_container",
          args: { container_ref: foodContainer.container_ref },
        },
        evidence_refs: evidenceRefs,
      },
      {
        node_id: "take_food",
        kind: "inventory_action",
        label: `Take ${foodItem?.item_type ?? "food"}`,
        preconditions: ["container contents include food", "container reachable"],
        expected_effects: ["actor inventory contains food"],
        domain_action: {
          adapter: snapshot.domain,
          action_type: "take_item",
          args: {
            container_ref: foodContainer.container_ref,
            item_type: foodItem?.item_type ?? "food",
          },
        },
        evidence_refs: evidenceRefs,
      },
      {
        node_id: "verify_food",
        kind: "verify",
        label: "Verify food in inventory",
        expected_effects: ["inventory contains food before continuing"],
        evidence_refs: evidenceRefs,
      },
    ],
    edges: [
      { edge_id: "edge:start:check_food", from_node_id: "start", to_node_id: "check_food" },
      { edge_id: "edge:check_food:go_to_container", from_node_id: "check_food", to_node_id: "go_to_container", condition: "no carried food" },
      { edge_id: "edge:go_to_container:take_food", from_node_id: "go_to_container", to_node_id: "take_food" },
      { edge_id: "edge:take_food:verify_food", from_node_id: "take_food", to_node_id: "verify_food" },
    ],
    generated_by: "deterministic_template",
    model_invoked: false,
    assistant_answer: false,
    raw_content_included: false,
    context_policy: "compact_context_pack_only",
    created_at: now,
  };
}
