import type { HelixPossibilityGraph } from "@shared/helix-environment-possibility-graph";

export type HelixPossibilityGraphValidation = {
  schema: "helix.environment_possibility_graph_validation.v1";
  graph_id: string;
  ok: boolean;
  issues: Array<{
    code: "missing_start" | "unreachable_node" | "missing_domain_action_args" | "empty_graph";
    severity: "warn" | "error";
    summary: string;
  }>;
  assistant_answer: false;
  raw_content_included: false;
};

export function validatePossibilityGraph(graph: HelixPossibilityGraph): HelixPossibilityGraphValidation {
  const issues: HelixPossibilityGraphValidation["issues"] = [];
  if (graph.nodes.length === 0) {
    issues.push({ code: "empty_graph", severity: "error", summary: "Possibility graph has no nodes." });
  }
  if (!graph.nodes.some((node) => node.kind === "start")) {
    issues.push({ code: "missing_start", severity: "error", summary: "Possibility graph has no start node." });
  }
  const reachable = new Set<string>(graph.nodes.filter((node) => node.kind === "start").map((node) => node.node_id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of graph.edges) {
      if (reachable.has(edge.from_node_id) && !reachable.has(edge.to_node_id)) {
        reachable.add(edge.to_node_id);
        changed = true;
      }
    }
  }
  for (const node of graph.nodes) {
    if (!reachable.has(node.node_id)) {
      issues.push({ code: "unreachable_node", severity: "warn", summary: `${node.node_id} is not reachable from a start node.` });
    }
    if (node.domain_action && !node.domain_action.args) {
      issues.push({ code: "missing_domain_action_args", severity: "error", summary: `${node.node_id} has a domain action without args.` });
    }
  }
  return {
    schema: "helix.environment_possibility_graph_validation.v1",
    graph_id: graph.graph_id,
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
    assistant_answer: false,
    raw_content_included: false,
  };
}

