import type {
  IdeologyActionGatePolicy,
  IdeologyGraphDocument,
  IdeologyGraphNode,
  IdeologyGraphValidationIssue,
} from "./ideology-graph-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function isIdeologyGraphDocument(value: unknown): value is IdeologyGraphDocument {
  if (!isRecord(value)) return false;
  return typeof value.rootId === "string" && Array.isArray(value.nodes);
}

export function validateIdeologyGraphDocument(value: unknown): IdeologyGraphValidationIssue[] {
  const issues: IdeologyGraphValidationIssue[] = [];
  if (!isRecord(value)) {
    return [{ code: "invalid_document", message: "Ideology graph must be an object." }];
  }

  const rootId = value.rootId;
  if (typeof rootId !== "string" || rootId.trim().length === 0) {
    issues.push({ code: "invalid_root", message: "Ideology graph rootId must be a non-empty string." });
  }

  if (!Array.isArray(value.nodes)) {
    issues.push({ code: "invalid_nodes", message: "Ideology graph nodes must be an array." });
    return issues;
  }

  const nodeIds = new Set<string>();
  const nodes = value.nodes as unknown[];
  for (const rawNode of nodes) {
    if (!isRecord(rawNode)) {
      issues.push({ code: "invalid_node", message: "Each ideology graph node must be an object." });
      continue;
    }

    const node = rawNode as Partial<IdeologyGraphNode>;
    if (typeof node.id !== "string" || node.id.trim().length === 0) {
      issues.push({ code: "invalid_node", message: "Each ideology graph node must have a non-empty id." });
      continue;
    }
    if (typeof node.title !== "string" || node.title.trim().length === 0) {
      issues.push({
        code: "invalid_node",
        message: "Each ideology graph node must have a non-empty title.",
        nodeId: node.id,
      });
    }
    if (nodeIds.has(node.id)) {
      issues.push({ code: "duplicate_node", message: `Duplicate ideology graph node id: ${node.id}.`, nodeId: node.id });
    }
    nodeIds.add(node.id);

    if (node.tags !== undefined && !isStringArray(node.tags)) {
      issues.push({ code: "invalid_node", message: "Node tags must be strings.", nodeId: node.id });
    }
    if (node.children !== undefined && !isStringArray(node.children)) {
      issues.push({ code: "invalid_node", message: "Node children must be string ids.", nodeId: node.id });
    }
    if (node.links !== undefined && !Array.isArray(node.links)) {
      issues.push({ code: "invalid_node", message: "Node links must be an array.", nodeId: node.id });
    }
    if (node.references !== undefined && !Array.isArray(node.references)) {
      issues.push({ code: "invalid_node", message: "Node references must be an array.", nodeId: node.id });
    }
    if (node.actions !== undefined && !Array.isArray(node.actions)) {
      issues.push({ code: "invalid_node", message: "Node actions must be an array.", nodeId: node.id });
    }
  }

  if (typeof rootId === "string" && rootId.trim().length > 0 && !nodeIds.has(rootId)) {
    issues.push({ code: "invalid_root", message: `Ideology graph rootId does not exist: ${rootId}.`, targetId: rootId });
  }

  for (const rawNode of nodes) {
    if (!isRecord(rawNode) || typeof rawNode.id !== "string") continue;
    const node = rawNode as Partial<IdeologyGraphNode>;
    for (const childId of Array.isArray(node.children) ? node.children : []) {
      if (!nodeIds.has(childId)) {
        issues.push({
          code: "invalid_child_endpoint",
          message: `Node ${node.id} has missing child endpoint: ${childId}.`,
          nodeId: node.id,
          targetId: childId,
        });
      }
    }
    for (const link of Array.isArray(node.links) ? node.links : []) {
      if (!isRecord(link) || typeof link.to !== "string" || link.to.trim().length === 0) {
        issues.push({ code: "invalid_link_endpoint", message: "Node link must have a non-empty to id.", nodeId: node.id });
        continue;
      }
      if (!nodeIds.has(link.to)) {
        issues.push({
          code: "invalid_link_endpoint",
          message: `Node ${node.id} has missing link endpoint: ${link.to}.`,
          nodeId: node.id,
          targetId: link.to,
        });
      }
    }
  }

  if (value.actionGatePolicy !== undefined && !isRecord(value.actionGatePolicy)) {
    issues.push({ code: "invalid_action_gate_policy", message: "actionGatePolicy must be an object when present." });
  } else if (isRecord(value.actionGatePolicy)) {
    const policy = value.actionGatePolicy as Partial<IdeologyActionGatePolicy>;
    for (const key of ["covered_action_tags", "legal_key_tags", "ethos_key_tags", "jurisdiction_floor_ok_tags"] as const) {
      if (policy[key] !== undefined && !isStringArray(policy[key])) {
        issues.push({ code: "invalid_action_gate_policy", message: `actionGatePolicy.${key} must be a string array.` });
      }
    }
  }

  return issues;
}

export function assertValidIdeologyGraphDocument(value: unknown): asserts value is IdeologyGraphDocument {
  const issues = validateIdeologyGraphDocument(value);
  if (issues.length > 0) {
    throw new Error(`Invalid ideology graph: ${issues.map((issue) => issue.message).join(" ")}`);
  }
}
