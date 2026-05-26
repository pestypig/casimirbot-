import {
  buildTheoryCalculatorLoadoutV1,
  type TheoryCalculatorLoadoutItemKind,
  type TheoryCalculatorLoadoutItemV1,
  type TheoryCalculatorLoadoutSource,
  type TheoryCalculatorLoadoutV1,
  type TheoryCalculatorObjectContextV1,
} from "../contracts/theory-calculator-loadout.v1";
import type { PhysicsAtlasBlockId, PhysicsAtlasBlockV1 } from "../contracts/physics-atlas.v1";
import type {
  TheoryBadgeCalculatorPayloadV1,
  TheoryBadgeEdgeV1,
  TheoryBadgeGraphV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";
import { buildHelixPhysicsAtlasV1 } from "./physics-atlas-blocks";
import { locateTheoryBadges } from "./theory-badge-overlap-locator";

const EXECUTABLE_RELATIONS = new Set([
  "derives",
  "requires",
  "specializes",
  "approximates",
  "bounds",
  "uses_constant",
  "numerically_solves",
  "diagnostic_checks",
]);

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function claimBoundaryNotesForBadge(badge: TheoryBadgeV1): string[] {
  const notes: string[] = [];
  if (badge.claimBoundary.diagnosticOnly) notes.push(`${badge.id}: diagnostic-only badge`);
  if (!badge.claimBoundary.validationClaimAllowed) notes.push(`${badge.id}: validation claim not allowed`);
  if (!badge.claimBoundary.physicalMechanismClaimAllowed) {
    notes.push(`${badge.id}: physical mechanism claim not allowed`);
  }
  if (!badge.claimBoundary.promotionAllowed) notes.push(`${badge.id}: promotion not allowed`);
  return notes;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function bindExpression(
  expression: string,
  bindings: Record<string, string | number>,
): {
  solveExpression: string;
  usedBindings: Record<string, string | number>;
  bindingWarnings: string[];
} {
  const equalsIndex = expression.indexOf("=");
  const lhs = equalsIndex >= 0 ? expression.slice(0, equalsIndex + 1) : "";
  let solveExpression = equalsIndex >= 0 ? expression.slice(equalsIndex + 1) : expression;
  const usedBindings: Record<string, string | number> = {};
  const symbols = Object.keys(bindings).sort((left, right) => right.length - left.length);
  for (const symbol of symbols) {
    const pattern = new RegExp(`(^|[^A-Za-z0-9_])${escapeRegExp(symbol)}(?=$|[^A-Za-z0-9_])`, "g");
    let used = false;
    solveExpression = solveExpression.replace(pattern, (match, prefix: string) => {
      used = true;
      return `${prefix}${bindings[symbol]}`;
    });
    if (used) usedBindings[symbol] = bindings[symbol];
  }
  return {
    solveExpression: `${lhs}${solveExpression}`,
    usedBindings,
    bindingWarnings: [],
  };
}

function incomingEdges(graph: TheoryBadgeGraphV1): Map<string, TheoryBadgeEdgeV1[]> {
  const incoming = new Map<string, TheoryBadgeEdgeV1[]>();
  for (const edge of graph.edges) {
    incoming.set(edge.to, [...(incoming.get(edge.to) ?? []), edge]);
  }
  return incoming;
}

function resolveDependencyOrder(graph: TheoryBadgeGraphV1, targetBadgeIds: string[]): string[] {
  const incoming = incomingEdges(graph);
  const badgeIds = new Set(graph.badges.map((badge) => badge.id));
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const ordered: string[] = [];

  const visit = (badgeId: string) => {
    if (!badgeIds.has(badgeId) || visited.has(badgeId) || visiting.has(badgeId)) return;
    visiting.add(badgeId);
    for (const edge of incoming.get(badgeId) ?? []) {
      if (EXECUTABLE_RELATIONS.has(edge.relation)) visit(edge.from);
    }
    visiting.delete(badgeId);
    visited.add(badgeId);
    ordered.push(badgeId);
  };

  for (const badgeId of targetBadgeIds) visit(badgeId);
  return ordered;
}

const QUERY_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "in",
  "of",
  "the",
  "to",
  "with",
]);

function tokenizeQuery(value: string | undefined): string[] {
  return unique(
    (value ?? "")
      .toLowerCase()
      .split(/[^a-z0-9_./^-]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 2 && !QUERY_STOP_WORDS.has(token)),
  );
}

function badgeSearchText(badge: TheoryBadgeV1): string {
  return [
    badge.id,
    badge.title,
    badge.plainMeaning,
    badge.whyItMatters,
    ...badge.subjects,
    ...badge.tags,
    ...badge.simulationOwners,
    ...badge.equationFamilies,
    ...badge.hintKeys.subjects,
    ...badge.hintKeys.symbols,
    ...badge.hintKeys.equationFamilies,
    ...badge.hintKeys.simulationOwners,
    ...badge.equations.flatMap((equation) => [
      equation.id,
      equation.displayLatex,
      equation.computableExpression ?? "",
      equation.operatorKind ?? "",
      ...equation.inputSymbols,
      ...equation.outputSymbols,
    ]),
    ...badge.calculatorPayloads.flatMap((payload) => [
      payload.id,
      payload.expression,
      payload.displayLatex,
      payload.targetVariable ?? "",
    ]),
  ]
    .join(" ")
    .toLowerCase();
}

function matchesQueryTokens(badge: TheoryBadgeV1, queryTokens: string[]): boolean {
  if (queryTokens.length === 0) return true;
  const text = badgeSearchText(badge);
  return queryTokens.some((token) => text.includes(token));
}

function resolveLocatorMatchedBadgeIds(args: {
  graph: TheoryBadgeGraphV1;
  query?: string;
  atlasBlockId?: PhysicsAtlasBlockId;
  seedBadgeIds: string[];
}): string[] {
  const badgesById = new Map(args.graph.badges.map((badge) => [badge.id, badge]));
  const atlas = buildHelixPhysicsAtlasV1({ graph: args.graph });
  const atlasBlock = args.atlasBlockId
    ? atlas.blocks.find((block: PhysicsAtlasBlockV1) => block.id === args.atlasBlockId)
    : null;
  const queryTokens = tokenizeQuery(args.query);
  const locatedBadgeIds = locateTheoryBadges({
    graph: args.graph,
    input: {
      query: args.query,
      atlasBlockIds: args.atlasBlockId ? [args.atlasBlockId] : undefined,
      limit: 24,
    },
  }).map((match) => match.badgeId);
  const seedBadgeIds = unique([
    ...args.seedBadgeIds,
    ...(atlasBlock?.primaryBadgeIds ?? []),
    ...locatedBadgeIds,
  ]).filter((badgeId) => badgesById.has(badgeId));
  const atlasOrder = new Map((atlasBlock?.primaryBadgeIds ?? []).map((badgeId, index) => [badgeId, index]));

  return seedBadgeIds
    .filter((badgeId) => {
      const badge = badgesById.get(badgeId);
      return Boolean(badge?.calculatorPayloads.length) && (!badge || matchesQueryTokens(badge, queryTokens));
    })
    .sort((left, right) => {
      const leftOrder = atlasOrder.get(left) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = atlasOrder.get(right) ?? Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return seedBadgeIds.indexOf(left) - seedBadgeIds.indexOf(right);
    });
}

function contextKindForBadge(badge: TheoryBadgeV1): TheoryCalculatorLoadoutItemKind {
  if (badge.level === "claim_boundary") return "claim_boundary";
  if (badge.subjects.includes("runtime") || badge.tags.includes("runtime_reference")) return "runtime_context";
  if (badge.equations.some((equation) => equation.operatorKind === "gate_status")) return "runtime_context";
  return "reference_context";
}

function withSetupBindings(
  payload: TheoryBadgeCalculatorPayloadV1,
  usedBindings: Record<string, string | number>,
  objectContext: TheoryCalculatorObjectContextV1 | null,
) {
  if (!payload.setupContext) return null;
  const bindingVariables = Object.entries(usedBindings).map(([symbol, value]) => ({
    symbol,
    value: String(value),
    unit: objectContext?.units[symbol] ?? null,
    meaning: "object-bound value",
    dimension_signature: null,
  }));
  return {
    ...payload.setupContext,
    variables: bindingVariables.length > 0 ? bindingVariables : payload.setupContext.variables,
    assumptions: [
      ...(payload.setupContext.assumptions ?? []),
      ...(objectContext?.assumptions ?? []),
    ],
  };
}

export function buildTheoryCalculatorLoadout(args: {
  graph: TheoryBadgeGraphV1;
  badgeIds: string[];
  mode?: "selected_badges" | "dependency_path" | "locator_matches";
  source?: TheoryCalculatorLoadoutSource;
  objectContext?: TheoryCalculatorObjectContextV1 | null;
  variableBindings?: Record<string, string | number>;
  query?: string;
  atlasBlockId?: PhysicsAtlasBlockId;
  includeContextItems?: boolean;
  payloadIdsByBadgeId?: Record<string, string[]>;
}): TheoryCalculatorLoadoutV1 {
  const mode = args.mode ?? "selected_badges";
  const source = args.source ?? "achievement_map";
  const badgesById = new Map(args.graph.badges.map((badge) => [badge.id, badge]));
  const orderedBadgeIds =
    mode === "dependency_path"
      ? resolveDependencyOrder(args.graph, args.badgeIds)
      : mode === "locator_matches"
        ? resolveLocatorMatchedBadgeIds({
            graph: args.graph,
            query: args.query,
            atlasBlockId: args.atlasBlockId,
            seedBadgeIds: args.badgeIds,
          })
      : unique(args.badgeIds).filter((badgeId) => badgesById.has(badgeId));
  const items: TheoryCalculatorLoadoutItemV1[] = [];
  const claimBoundaryNotes: string[] = [];
  const objectContext = args.objectContext ?? null;
  const bindings = {
    ...(objectContext?.variableBindings ?? {}),
    ...(args.variableBindings ?? {}),
  };
  const loadoutId = `theory-loadout:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 7)}`;

  for (const badgeId of orderedBadgeIds) {
    const badge = badgesById.get(badgeId);
    if (!badge) continue;
    claimBoundaryNotes.push(...claimBoundaryNotesForBadge(badge));
    const requestedPayloadIds = args.payloadIdsByBadgeId?.[badge.id] ?? [];
    const payloads =
      requestedPayloadIds.length > 0
        ? badge.calculatorPayloads.filter((payload) => requestedPayloadIds.includes(payload.id))
        : badge.calculatorPayloads;
    for (const payload of payloads) {
      const binding = bindExpression(payload.expression, bindings);
      const itemId = `${loadoutId}:item:${items.length + 1}`;
      items.push({
        id: itemId,
        index: items.length + 1,
        kind: "calculator_payload",
        badgeId: badge.id,
        badgeTitle: badge.title,
        payloadId: payload.id,
        sourcePath: `theory://${args.graph.graphId}/${badge.id}/${payload.id}`,
        expression: payload.expression,
        displayLatex: payload.displayLatex,
        solveExpression: binding.solveExpression,
        usedBindings: binding.usedBindings,
        bindingWarnings: binding.bindingWarnings,
        setupContext: withSetupBindings(payload, binding.usedBindings, objectContext),
        resultText: null,
        resultLatex: null,
        resultKind: null,
        confidence: null,
        fallbackReason: null,
        calculatorArtifactV1: null,
        warnings: [],
      });
    }
    if ((args.includeContextItems ?? true) && payloads.length === 0) {
      items.push({
        id: `${loadoutId}:item:${items.length + 1}`,
        index: items.length + 1,
        kind: contextKindForBadge(badge),
        badgeId: badge.id,
        badgeTitle: badge.title,
        payloadId: null,
        sourcePath: `theory://${args.graph.graphId}/${badge.id}/context`,
        expression: badge.equations[0]?.displayLatex ?? null,
        displayLatex: badge.equations[0]?.displayLatex ?? null,
        solveExpression: null,
        usedBindings: {},
        bindingWarnings: [],
        setupContext: null,
        resultText: null,
        resultLatex: null,
        resultKind: null,
        confidence: null,
        fallbackReason: null,
        calculatorArtifactV1: null,
        warnings: ["Context row; not solved by the scalar calculator."],
      });
    }
  }

  return buildTheoryCalculatorLoadoutV1({
    loadoutId,
    graphId: args.graph.graphId,
    source,
    mode,
    targetBadgeIds: mode === "locator_matches" ? orderedBadgeIds : args.badgeIds,
    objectContext,
    items: items.map((item, index) => ({ ...item, index: index + 1 })),
    claimBoundaryNotes: [
      ...claimBoundaryNotes,
      ...(objectContext?.claimBoundaryNotes ?? []),
    ],
  });
}
