import {
  buildTheoryCompoundRunV1,
  type TheoryCompoundRunEvidenceRefV1,
  type TheoryCompoundRunRowKind,
  type TheoryCompoundRunRowV1,
  type TheoryCompoundRunSourceKind,
  type TheoryCompoundRunV1,
} from "../contracts/theory-compound-run.v1";
import type {
  TheoryBadgeEdgeV1,
  TheoryBadgeEquationV1,
  TheoryBadgeGraphV1,
  TheoryBadgeSourceRefV1,
  TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";
import type { TheoryRuntimeMathTraceV1 } from "../contracts/theory-runtime-math-trace.v1";
import {
  buildStaticCasimirRuntimeTraceV1,
  buildStaticGrTensorTraceV1,
  buildStaticSolarRuntimeTraceV1,
} from "./runtime-traces";
import {
  getNhm2RuntimeFieldBinding,
  type Nhm2RuntimeFieldBinding,
} from "./nhm2-runtime-field-map";

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

const STATIC_REFERENCE_WARNING = "Static reference trace only; no backend runtime executed.";
const SCALAR_PENDING_WARNING = "Scalar row is loadable by the scientific calculator but has not been solved.";
const GATE_BLOCKED_WARNING = "Gate row blocked until runtime evidence provides a recognized gate status.";
const EVIDENCE_REFERENCE_WARNING = "Evidence reference row only; artifact resolution is not executed in this phase.";
const RUNTIME_BOUND_WARNING =
  "Runtime-bound badge: values must come from a runtime receipt or artifact reader before interpretation.";

type BuildTheoryCompoundRunMode = "selected_badges" | "dependency_path" | "locator_matches";

type RowDraft = Omit<TheoryCompoundRunRowV1, "id" | "index">;

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
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

function sourceRefPath(ref: TheoryBadgeSourceRefV1, fallback: string): string {
  return ref.path ?? ref.id ?? fallback;
}

function evidenceRefsForBadge(graph: TheoryBadgeGraphV1, badge: TheoryBadgeV1): TheoryCompoundRunEvidenceRefV1[] {
  const sourceRefs = badge.sourceRefs.map((ref, index) => ({
    kind: ref.kind,
    path: sourceRefPath(ref, `theory://${graph.graphId}/${badge.id}/source-ref/${index + 1}`),
    id: ref.id ?? null,
    note: ref.note ?? null,
  }));
  const runtimeBinding = getNhm2RuntimeFieldBinding(badge.id);
  if (!runtimeBinding) return sourceRefs;

  return [
    ...sourceRefs,
    {
      kind: "runtime_field_map",
      path: `theory-runtime://${runtimeBinding.runtimeId}/${badge.id}`,
      id: runtimeBinding.runtimeId,
      note: `Runtime fields: ${runtimeBinding.artifactFields.join(", ")}`,
    },
    ...runtimeBinding.gates.map((gate) => ({
      kind: "runtime_gate",
      path: `theory-runtime://${runtimeBinding.runtimeId}/${badge.id}/gate/${gate}`,
      id: gate,
      note: "Gate status must come from runtime evidence; missing status fails closed.",
    })),
    ...runtimeBinding.requiredEvidence.map((evidence) => ({
      kind: "required_evidence",
      path: `theory-runtime://${runtimeBinding.runtimeId}/${badge.id}/required-evidence/${evidence}`,
      id: evidence,
      note: "Required evidence for interpreting this runtime-bound badge.",
    })),
  ];
}

function runtimeBoundWarnings(binding: Nhm2RuntimeFieldBinding | null): string[] {
  if (!binding) return [];
  return [
    RUNTIME_BOUND_WARNING,
    `Runtime owner: ${binding.runtimeId}`,
    `Runtime-bound fields: ${binding.artifactFields.join(", ") || "none"}`,
    `Required evidence: ${binding.requiredEvidence.join(", ") || "none"}`,
  ];
}

function claimBoundaryNotesForRuntimeBinding(binding: Nhm2RuntimeFieldBinding | null): string[] {
  return binding?.claimBoundaryNotes ?? [];
}

function isGrOrNhm2Badge(badge: TheoryBadgeV1): boolean {
  return (
    badge.id.startsWith("physics.gr.") ||
    badge.id.startsWith("nhm2.") ||
    badge.subjects.includes("general_relativity") ||
    badge.subjects.includes("nhm2") ||
    badge.simulationOwners.some((owner) => owner === "NHM2" || owner === "general_relativity")
  );
}

function isCasimirBadge(badge: TheoryBadgeV1): boolean {
  return badge.id.startsWith("casimir.") || badge.subjects.includes("casimir");
}

function isSolarBadge(badge: TheoryBadgeV1): boolean {
  return badge.id.startsWith("solar.") || badge.subjects.includes("solar");
}

function staticTraceForBadge(args: {
  graph: TheoryBadgeGraphV1;
  badge: TheoryBadgeV1;
  rowOrdinal: number;
  generatedAt?: string;
}): TheoryRuntimeMathTraceV1 | null {
  const traceInput = {
    graphId: args.graph.graphId,
    badgeIds: [args.badge.id],
    traceId: `static-reference:${args.badge.id}:${args.rowOrdinal}`,
    generatedAt: args.generatedAt,
  };
  if (isGrOrNhm2Badge(args.badge)) return buildStaticGrTensorTraceV1(traceInput);
  if (isCasimirBadge(args.badge)) return buildStaticCasimirRuntimeTraceV1(traceInput);
  if (isSolarBadge(args.badge)) return buildStaticSolarRuntimeTraceV1(traceInput);
  return null;
}

function rowKindForEquation(equation: TheoryBadgeEquationV1): TheoryCompoundRunRowKind | null {
  switch (equation.operatorKind) {
    case "tensor_component":
    case "field_sample":
    case "region_aggregate":
    case "worldline_integral":
      return "tensor";
    case "gate_status":
      return "gate";
    case "noncomputable_reference":
      return "reference";
    default:
      return null;
  }
}

function rowSolverForKind(kind: TheoryCompoundRunRowKind): TheoryCompoundRunRowV1["solver"] {
  switch (kind) {
    case "tensor":
      return "tensor_runtime";
    case "gate":
      return "gate_evaluator";
    case "evidence":
      return "artifact_resolver";
    default:
      return "none";
  }
}

function buildDependsOn(args: {
  badge: TheoryBadgeV1;
  rowIndexWithinBadge: number;
  firstRowIdByBadgeId: Map<string, string>;
  previousRowIdForBadge: string | null;
  incomingEdgesByBadgeId: Map<string, TheoryBadgeEdgeV1[]>;
}): string[] {
  if (args.rowIndexWithinBadge > 0 && args.previousRowIdForBadge) return [args.previousRowIdForBadge];
  return unique(
    (args.incomingEdgesByBadgeId.get(args.badge.id) ?? [])
      .filter((edge) => EXECUTABLE_RELATIONS.has(edge.relation))
      .map((edge) => args.firstRowIdByBadgeId.get(edge.from) ?? "")
      .filter(Boolean),
  );
}

export function buildTheoryCompoundRun(args: {
  graph: TheoryBadgeGraphV1;
  badgeIds: string[];
  mode?: BuildTheoryCompoundRunMode;
  source?: TheoryCompoundRunSourceKind;
  includeScalar?: boolean;
  includeRuntime?: boolean;
  includeEvidence?: boolean;
  includeBoundaries?: boolean;
  generatedAt?: string;
}): TheoryCompoundRunV1 {
  const mode = args.mode ?? "selected_badges";
  const includeScalar = args.includeScalar ?? true;
  const includeRuntime = args.includeRuntime ?? true;
  const includeEvidence = args.includeEvidence ?? true;
  const includeBoundaries = args.includeBoundaries ?? true;
  const badgesById = new Map(args.graph.badges.map((badge) => [badge.id, badge]));
  const incomingEdgesByBadgeId = incomingEdges(args.graph);
  const orderedBadgeIds =
    mode === "dependency_path"
      ? resolveDependencyOrder(args.graph, args.badgeIds)
      : unique(args.badgeIds).filter((badgeId) => badgesById.has(badgeId));
  const runId = `theory-compound:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 7)}`;
  const rows: TheoryCompoundRunRowV1[] = [];
  const firstRowIdByBadgeId = new Map<string, string>();

  const pushRow = (draft: RowDraft): string => {
    const row: TheoryCompoundRunRowV1 = {
      ...draft,
      id: `${runId}:row:${rows.length + 1}`,
      index: rows.length + 1,
    };
    rows.push(row);
    if (!firstRowIdByBadgeId.has(row.badgeId)) firstRowIdByBadgeId.set(row.badgeId, row.id);
    return row.id;
  };

  for (const badgeId of orderedBadgeIds) {
    const badge = badgesById.get(badgeId);
    if (!badge) continue;
    const runtimeBinding = getNhm2RuntimeFieldBinding(badge.id);
    const claimBoundaryNotes = unique([
      ...claimBoundaryNotesForBadge(badge),
      ...claimBoundaryNotesForRuntimeBinding(runtimeBinding),
    ]);
    const evidenceRefs = includeEvidence ? evidenceRefsForBadge(args.graph, badge) : undefined;
    const bindingWarnings = runtimeBoundWarnings(runtimeBinding);
    let previousRowIdForBadge: string | null = null;
    let rowIndexWithinBadge = 0;

    const dependsOnForNextRow = () =>
      buildDependsOn({
        badge,
        rowIndexWithinBadge,
        firstRowIdByBadgeId,
        previousRowIdForBadge,
        incomingEdgesByBadgeId,
      });

    if (includeScalar) {
      for (const payload of badge.calculatorPayloads) {
        previousRowIdForBadge = pushRow({
          badgeId: badge.id,
          badgeTitle: badge.title,
          title: payload.id,
          kind: "scalar",
          displayLatex: payload.displayLatex,
          expression: payload.expression,
          status: "pending",
          solver: "scientific_calculator",
          sourcePath: `theory://${args.graph.graphId}/${badge.id}/${payload.id}`,
          dependsOn: dependsOnForNextRow(),
          calculatorArtifactV1: null,
          runtimeMathTraceV1: null,
          runtimeReceiptV1: null,
          runtimeRunRequestV1: null,
          sweepRunV1: null,
          evidenceRefs,
          claimBoundaryNotes,
          warnings: [...bindingWarnings, SCALAR_PENDING_WARNING],
        });
        rowIndexWithinBadge += 1;
      }
    }

    if (includeRuntime) {
      for (const equation of badge.equations) {
        const kind = rowKindForEquation(equation);
        if (!kind) continue;
        const runtimeMathTraceV1 =
          kind === "tensor" || kind === "reference"
            ? staticTraceForBadge({
                graph: args.graph,
                badge,
                rowOrdinal: rows.length + 1,
                generatedAt: args.generatedAt,
              })
            : null;
        const gateWarnings = kind === "gate" ? [GATE_BLOCKED_WARNING] : [];
        const staticWarnings = runtimeMathTraceV1 ? [STATIC_REFERENCE_WARNING] : [];

        previousRowIdForBadge = pushRow({
          badgeId: badge.id,
          badgeTitle: badge.title,
          title: equation.id,
          kind,
          displayLatex: equation.displayLatex,
          expression: equation.computableExpression ?? null,
          status: kind === "gate" ? "blocked" : runtimeMathTraceV1 ? "computed" : "skipped",
          solver: rowSolverForKind(kind),
          sourcePath: `theory://${args.graph.graphId}/${badge.id}/${equation.id}`,
          dependsOn: dependsOnForNextRow(),
          calculatorArtifactV1: null,
          runtimeMathTraceV1,
          runtimeReceiptV1: null,
          runtimeRunRequestV1: null,
          sweepRunV1: null,
          evidenceRefs,
          claimBoundaryNotes,
          warnings: [...bindingWarnings, ...staticWarnings, ...gateWarnings],
        });
        rowIndexWithinBadge += 1;
      }
    }

    if (includeEvidence && badge.sourceRefs.length > 0) {
      previousRowIdForBadge = pushRow({
        badgeId: badge.id,
        badgeTitle: badge.title,
        title: `${badge.title} Evidence References`,
        kind: "evidence",
        displayLatex: null,
        expression: null,
        status: "skipped",
        solver: "artifact_resolver",
        sourcePath: `theory://${args.graph.graphId}/${badge.id}/evidence`,
        dependsOn: dependsOnForNextRow(),
        calculatorArtifactV1: null,
        runtimeMathTraceV1: null,
        runtimeReceiptV1: null,
        runtimeRunRequestV1: null,
        sweepRunV1: null,
        evidenceRefs,
        claimBoundaryNotes,
        warnings: [...bindingWarnings, EVIDENCE_REFERENCE_WARNING],
      });
      rowIndexWithinBadge += 1;
    }

    if (includeBoundaries && badge.level === "claim_boundary") {
      previousRowIdForBadge = pushRow({
        badgeId: badge.id,
        badgeTitle: badge.title,
        title: `${badge.title} Boundary`,
        kind: "boundary",
        displayLatex: badge.equations[0]?.displayLatex ?? null,
        expression: badge.equations[0]?.computableExpression ?? null,
        status: "blocked",
        solver: "none",
        sourcePath: `theory://${args.graph.graphId}/${badge.id}/claim-boundary`,
        dependsOn: dependsOnForNextRow(),
        calculatorArtifactV1: null,
        runtimeMathTraceV1: null,
        runtimeReceiptV1: null,
        runtimeRunRequestV1: null,
        sweepRunV1: null,
        evidenceRefs,
        claimBoundaryNotes,
        warnings: [
          ...bindingWarnings,
          "Claim boundary row; promotion is not allowed without a later policy adapter.",
        ],
      });
      rowIndexWithinBadge += 1;
    }
  }

  return buildTheoryCompoundRunV1({
    generatedAt: args.generatedAt,
    runId,
    graphId: args.graph.graphId,
    targetBadgeIds: args.badgeIds,
    source: {
      kind: args.source ?? "theory_badge_graph",
      label: mode,
    },
    rows: rows.map((row, index) => ({ ...row, index: index + 1 })),
  });
}
