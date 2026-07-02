import type { MoralBadgeLocationV1 } from "../moral-badge-locator";

export type MoralProbabilityChunkNode = {
  id: string;
  tone: string;
  procedureOperator?: string;
  proceduralRole?: string;
  tags?: string[];
};

export function moralPostureForLocation(location: MoralBadgeLocationV1): string {
  const expression = location.proceduralExpression.toLowerCase();
  const tags = (location.tags ?? []).map((tag) => tag.toLowerCase());
  if (expression.includes("blocks")) return "blocked_or_missing_check";
  if (
    expression.includes("requires") ||
    location.matchType === "gate_term" ||
    tags.some((tag) => tag === "covered-action" || tag === "legal-key" || tag === "ethos-key")
  ) {
    return "requires_check";
  }
  if (expression.includes("constrains") || expression.includes("balances")) {
    return "constrained_action_posture";
  }
  return "supported_action_posture";
}

export function moralProceduralBucketForLocation(location: MoralBadgeLocationV1): string {
  const tags = (location.tags ?? []).map((tag) => tag.toLowerCase());
  if (tags.some((tag) => tag === "first_principle" || tag === "objective_binding")) return "first_principle";
  if (tags.some((tag) => tag === "covered-action" || tag === "legal-key" || tag === "ethos-key")) return "safeguard";
  if (tags.some((tag) => tag === "trait" || tag === "outer_edge")) return "outer_edge";
  if (location.matchType === "gate_term") return "safeguard";
  return "lens";
}

export function moralRenderChunkForLocation(args: {
  rootId: string;
  location: MoralBadgeLocationV1;
}): string {
  const rootId = args.location.pathToBinding[args.location.pathToBinding.length - 1] ?? args.rootId;
  const depthBucket = args.location.pathToBinding.length <= 2 ? "root_near" : "path_deep";
  return `moral:${rootId}:${depthBucket}:${args.location.matchType}`;
}

export function moralSemanticChunkForLocation(location: MoralBadgeLocationV1): string {
  return `moral:${moralProceduralBucketForLocation(location)}:${moralPostureForLocation(location)}:${location.matchType}`;
}

export function moralSemanticChunkForNode(node: MoralProbabilityChunkNode): string {
  const posture =
    node.procedureOperator === "blocks"
      ? "blocked_or_missing_check"
      : node.procedureOperator === "requires" || node.procedureOperator === "asks_for"
        ? "requires_check"
        : node.procedureOperator === "constrains" || node.procedureOperator === "balances"
          ? "constrained_action_posture"
          : "supported_action_posture";
  const bucket =
    node.tone === "principle" || node.tone === "objective"
      ? "first_principle"
      : node.tone === "safeguard" || node.tone === "boundary"
        ? "safeguard"
        : node.tone === "trait"
          ? "outer_edge"
          : "lens";
  return `moral:${bucket}:${posture}:node`;
}

export function moralRenderChunkForNode(args: {
  rootId: string;
  node: MoralProbabilityChunkNode;
}): string {
  const nearRoot =
    args.node.id === args.rootId ||
    args.node.tone === "principle" ||
    args.node.tone === "objective";
  const depthBucket = nearRoot ? "root_near" : "path_deep";
  return `moral:${args.rootId}:${depthBucket}:node`;
}
