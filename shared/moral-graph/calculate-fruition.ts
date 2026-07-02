import {
  buildFruitionProcedureExpressionV1,
  type FruitionProcedureExpressionV1,
  type FruitionProcedureOperatorV1,
  type FruitionProcedureTermV1,
  type FruitionProceduralOperatorV1,
  type FruitionProceduralRoleV1,
  type FruitionResultPostureV1,
} from "../fruition-procedure-expression";
import type { HelixRecommendedActionAdmissionV1 } from "../contracts/helix-recommended-action-admission.v1";
import type {
  IdeologyContextReflectionActionGateWarningV1,
  IdeologyContextReflectionRecommendedActionV1,
  IdeologyContextReflectionTensionV1,
  IdeologyContextReflectionV1,
  IdeologyNodeMatchV1,
} from "../ideology-context-reflection";
import { mapIdeologyReflectionToRecommendedActionAdmission } from "./map-ideology-recommendations-to-admission";
import { MORAL_WISDOM_PRINCIPLES, MORAL_WISDOM_ROOT_ID } from "./wisdom-principles";

export type CalculateFruitionInput = {
  reflection: IdeologyContextReflectionV1;
  admission?: HelixRecommendedActionAdmissionV1;
  objective?: string;
  generatedAt?: string;
  expressionId?: string;
};

function termId(prefix: string, id: string): string {
  return `fruition.${prefix}.${id.replace(/[^a-z0-9_-]+/gi, "_")}`;
}

function uniqueTerms(terms: FruitionProcedureTermV1[]): FruitionProcedureTermV1[] {
  const seen = new Set<string>();
  const result: FruitionProcedureTermV1[] = [];
  for (const term of terms) {
    if (seen.has(term.id)) continue;
    seen.add(term.id);
    result.push(term);
  }
  return result;
}

function proceduralOperatorForPolarity(polarity: FruitionProcedureTermV1["polarity"]): FruitionProceduralOperatorV1 {
  if (polarity === "blocks") return "blocks";
  if (polarity === "requires") return "requires";
  if (polarity === "constrains") return "constrains";
  return "supports";
}

function roleFromTags(tags: string[] | undefined, fallback: FruitionProceduralRoleV1): FruitionProceduralRoleV1 {
  const lowered = (tags ?? []).map((tag) => tag.toLowerCase());
  if (lowered.some((tag) => tag.includes("covered-action") || tag.includes("safeguard") || tag.includes("gate"))) {
    return "action_gate";
  }
  if (lowered.some((tag) => tag.includes("missing") || tag.includes("evidence"))) return "evidence_requirement";
  if (lowered.some((tag) => tag.includes("repair"))) return "repair_path";
  if (lowered.some((tag) => tag.includes("balance") || tag.includes("yin") || tag.includes("yang"))) return "balancer";
  if (lowered.some((tag) => tag.includes("objective_view") || tag.includes("mission"))) return "objective_view";
  if (lowered.some((tag) => tag.includes("speech") || tag.includes("constraint") || tag.includes("posture"))) return "constraint";
  if (lowered.some((tag) => tag.includes("trait") || tag.includes("outer_edge") || tag.includes("lens"))) return "lens";
  return fallback;
}

function actionEffectForMatch(match: IdeologyNodeMatchV1, role: FruitionProceduralRoleV1): string {
  if (role === "action_gate") return `${match.label} requires a review check before the procedure can advance.`;
  if (role === "constraint") return `${match.label} constrains how the action may be formulated.`;
  if (role === "balancer") return `${match.label} balances competing forces before choosing a next step.`;
  if (role === "repair_path") return `${match.label} routes the procedure toward repair before escalation.`;
  if (role === "objective_view") return `${match.label} expresses the downstream objective view.`;
  return `${match.label} contributes context to the procedural action state.`;
}

function matchTerms(
  matches: IdeologyNodeMatchV1[],
  fallbackRefs: string[],
  kind: "lens" | "trait",
): FruitionProcedureTermV1[] {
  return matches.map((match) => {
    const proceduralRole = roleFromTags(match.tags, kind === "trait" ? "lens" : "lens");
    const polarity = proceduralRole === "action_gate" ? "requires" : proceduralRole === "constraint" ? "constrains" : "supports";
    return {
      id: termId(kind, match.nodeId),
      kind,
      label: match.label,
      polarity,
      confidence: match.score,
      proceduralRole,
      procedureOperator: proceduralOperatorForPolarity(polarity),
      actionEffect: actionEffectForMatch(match, proceduralRole),
      evidenceNeeds: proceduralRole === "action_gate" ? ["required_gate_check"] : undefined,
      refusesAuthority: ["final_answer", "execution_authority"],
      sourceNodeIds: [match.nodeId],
      evidenceRefs: fallbackRefs,
      reasonCodes: match.reasons,
    };
  });
}

function actionGateTerms(
  warnings: IdeologyContextReflectionActionGateWarningV1[],
  refs: string[],
): FruitionProcedureTermV1[] {
  return warnings.map((warning) => ({
    id: termId("gate", warning.gateId),
    kind: "action_gate",
    label: warning.label,
    polarity: "requires",
    confidence: 0.9,
    proceduralRole: "action_gate",
    procedureOperator: "requires",
    actionEffect: `${warning.label} requires ${warning.requiredCheck ?? "a required check"} before action readiness.`,
    evidenceNeeds: [warning.requiredCheck ?? "action_gate_check"],
    refusesAuthority: ["execution_authority"],
    sourceNodeIds: [warning.gateId],
    evidenceRefs: refs,
    reasonCodes: [warning.requiredCheck ?? "action_gate_warning"],
  }));
}

function tensionTerms(tensions: IdeologyContextReflectionTensionV1[] | undefined, refs: string[]): FruitionProcedureTermV1[] {
  return (tensions ?? []).map((tension, index) => ({
    id: termId("tension", `${index}_${tension.nodeIds.join("_")}`),
    kind: "tension",
    label: `Possible tension: ${tension.description}`,
    polarity: tension.severity === "high" ? "blocks" : "constrains",
    confidence: tension.severity === "high" ? 0.85 : tension.severity === "medium" ? 0.7 : 0.55,
    proceduralRole: "balancer",
    procedureOperator: tension.severity === "high" ? "blocks" : "balances",
    actionEffect: "A possible tension balances the action posture until tradeoffs are made explicit.",
    evidenceNeeds: ["tradeoff_context"],
    refusesAuthority: ["moral_finality"],
    sourceNodeIds: tension.nodeIds,
    evidenceRefs: refs,
    reasonCodes: [`tension_${tension.severity}`],
  }));
}

function missingEvidenceTerms(missingEvidence: string[], refs: string[]): FruitionProcedureTermV1[] {
  return missingEvidence.map((missing) => ({
    id: termId("missing", missing),
    kind: "missing_check",
    label: `Missing check: ${missing.replace(/_/g, " ")}`,
    polarity: "requires",
    confidence: 1,
    proceduralRole: "evidence_requirement",
    procedureOperator: "asks_for",
    actionEffect: `Ask for ${missing.replace(/_/g, " ")} before treating the action posture as ready.`,
    evidenceNeeds: [missing],
    refusesAuthority: ["claim_certainty", "execution_authority"],
    evidenceRefs: refs,
    reasonCodes: ["missing_evidence"],
  }));
}

function authorityBoundaryTerm(reflection: IdeologyContextReflectionV1): FruitionProcedureTermV1 {
  return {
    id: "fruition.authority.evidence_only",
    kind: "authority_boundary",
    label: "Evidence-only authority",
    polarity: "constrains",
    confidence: 1,
    proceduralRole: "authority_boundary",
    procedureOperator: "constrains",
    actionEffect: "Keep the result diagnostic and prevent it from becoming execution authority.",
    evidenceNeeds: ["assistant_reasoning_context"],
    refusesAuthority: ["assistant_final_authority", "terminal_execution", "document_mutation"],
    evidenceRefs: reflection.input.refs ?? [],
    reasonCodes: ["diagnostic_only", "agent_executable_false"],
  };
}

function actionTerm(action: IdeologyContextReflectionRecommendedActionV1, refs: string[]): FruitionProcedureTermV1 {
  const requiresUser = action.type === "ask_for_missing_evidence" || action.type.startsWith("suggest_");
  return {
    id: termId("action", action.id),
    kind: "safeguard",
    label: action.label,
    polarity: requiresUser ? "requires" : "supports",
    confidence: 0.8,
    proceduralRole: "recommended_action",
    procedureOperator: requiresUser ? "asks_for" : "routes_to",
    actionEffect: `${action.label} is a recommended next step, not execution authority.`,
    evidenceNeeds: requiresUser ? ["user_confirmation"] : undefined,
    refusesAuthority: ["auto_execution"],
    evidenceRefs: refs,
    reasonCodes: action.reasonCodes ?? [action.type],
  };
}

function wisdomPrincipleTerms(rootId: string, refs: string[]): FruitionProcedureTermV1[] {
  if (rootId !== MORAL_WISDOM_ROOT_ID) {
    return [
      {
        id: termId("root", rootId),
        kind: "lens",
        label: rootId.replace(/[_-]/g, " "),
        polarity: "supports",
        confidence: 1,
        proceduralRole: "first_principle",
        procedureOperator: "supports",
        actionEffect: "Anchor the action expression in the graph root before moving toward an objective view.",
        evidenceNeeds: ["observable_context"],
        refusesAuthority: ["objective_without_basis"],
        sourceNodeIds: [rootId],
        evidenceRefs: refs,
        reasonCodes: ["ideology_root"],
      },
    ];
  }

  return MORAL_WISDOM_PRINCIPLES.map((principle) => ({
    id: termId("principle", principle.id),
    kind: "lens" as const,
    label: principle.label,
    polarity:
      principle.procedureOperator === "blocks"
        ? "blocks"
        : principle.procedureOperator === "requires" || principle.procedureOperator === "asks_for"
          ? "requires"
          : principle.procedureOperator === "constrains" || principle.procedureOperator === "balances"
            ? "constrains"
            : "supports",
    confidence: 1,
    proceduralRole: principle.proceduralRole,
    procedureOperator: principle.procedureOperator,
    actionEffect: principle.actionEffect,
    evidenceNeeds: principle.evidenceNeeds,
    refusesAuthority: principle.refusesAuthority,
    sourceNodeIds: [principle.id],
    evidenceRefs: refs,
    reasonCodes: principle.tags,
  }));
}

function buildOperators(params: {
  terms: FruitionProcedureTermV1[];
  resultTermId: string;
  missingTermIds: string[];
  gateTermIds: string[];
  boundaryTermId: string;
  actionTermIds: string[];
}): FruitionProcedureOperatorV1[] {
  const operators: FruitionProcedureOperatorV1[] = [];
  const supportTermIds = params.terms
    .filter((term) => term.kind === "lens" || term.kind === "trait")
    .map((term) => term.id);

  if (supportTermIds.length > 0) {
    operators.push({
      id: "fruition.operator.supports_context",
      kind: "supports",
      fromTermIds: supportTermIds,
      toTermIds: [params.resultTermId],
      label: "Activated lenses support procedural context",
      rationale: "Matched ideology lenses provide context for the procedural posture without deciding the answer.",
    });
  }

  if (params.missingTermIds.length > 0) {
    operators.push({
      id: "fruition.operator.requires_missing_checks",
      kind: "asks_for",
      fromTermIds: params.missingTermIds,
      toTermIds: params.actionTermIds.length > 0 ? params.actionTermIds : [params.resultTermId],
      label: "Missing checks ask for clarification",
      rationale: "A procedure with missing evidence routes toward clarification before action readiness.",
    });
  }

  if (params.gateTermIds.length > 0) {
    operators.push({
      id: "fruition.operator.requires_gate_review",
      kind: "requires",
      fromTermIds: params.gateTermIds,
      toTermIds: [params.resultTermId],
      label: "Action gates require review",
      rationale: "Nearby gate warnings constrain the procedure until required checks are satisfied.",
    });
  }

  operators.push({
    id: "fruition.operator.constrains_execution",
    kind: "constrains",
    fromTermIds: [params.boundaryTermId],
    toTermIds: [params.resultTermId],
    label: "Evidence-only boundary constrains execution",
    rationale: "MoralGraph and Fruition artifacts are diagnostic evidence and cannot unlock terminal execution.",
  });

  return operators;
}

function choosePosture(params: {
  admission: HelixRecommendedActionAdmissionV1;
  missingEvidence: string[];
  gateWarnings: IdeologyContextReflectionActionGateWarningV1[];
}): FruitionResultPostureV1 {
  if (params.admission.actions.some((action) => action.admission === "blocked")) return "blocked";
  if (params.missingEvidence.length > 0) return "ask_for_clarification";
  if (params.gateWarnings.length > 0) return "requires_review";
  if (params.admission.actions.some((action) => action.admission === "ask_user")) return "ready_for_user_decision";
  return "diagnostic_only";
}

function labelForPosture(posture: FruitionResultPostureV1): string {
  if (posture === "blocked") return "Procedure blocked by policy or unknown action";
  if (posture === "ask_for_clarification") return "Procedure needs missing checks";
  if (posture === "requires_review") return "Procedure requires review gate";
  if (posture === "ready_for_user_decision") return "Procedure ready for user decision";
  return "Diagnostic procedure only";
}

function renderExpression(operators: FruitionProcedureOperatorV1[], posture: FruitionResultPostureV1): string {
  const clauses = operators.map((operator) => {
    const from = operator.fromTermIds.map((id) => id.replace(/^fruition\./, "")).join(" + ");
    const to = operator.toTermIds.map((id) => id.replace(/^fruition\./, "")).join(" + ");
    return `${from} ${operator.kind} ${to}`;
  });
  return `${clauses.join(" ; ")} => ${posture}`;
}

export function calculateFruitionFromReflection(input: CalculateFruitionInput): FruitionProcedureExpressionV1 {
  const reflection = input.reflection;
  const refs = reflection.input.refs ?? [];
  const admission = input.admission ?? mapIdeologyReflectionToRecommendedActionAdmission(reflection);
  const missingEvidence = reflection.claim_boundaries.missing_evidence ?? [];
  const gateWarnings = reflection.action_gate_warnings ?? [];

  const resultTermId = "fruition.result.procedural_posture";
  const terms = uniqueTerms([
    ...wisdomPrincipleTerms(reflection.graph.rootId, refs),
    ...matchTerms(reflection.matches.exact, refs, "lens"),
    ...matchTerms(reflection.matches.likely, refs, "lens"),
    ...matchTerms(reflection.matches.inferred_lenses, refs, "trait"),
    ...reflection.activated_traits.map((trait) => ({
      id: termId("trait", trait.nodeId),
      kind: "trait" as const,
      label: trait.label,
      polarity: "supports" as const,
      confidence: trait.confidence,
      proceduralRole: roleFromTags(trait.tags, "lens"),
      procedureOperator: "supports" as const,
      actionEffect: `${trait.label} contributes an outer-edge lens to the action posture.`,
      evidenceNeeds: ["scenario_context"],
      refusesAuthority: ["character_verdict"],
      sourceNodeIds: [trait.nodeId],
      evidenceRefs: refs,
      reasonCodes: trait.tags,
    })),
    ...actionGateTerms(gateWarnings, refs),
    ...tensionTerms(reflection.tensions, refs),
    ...missingEvidenceTerms(missingEvidence, refs),
    ...reflection.recommended_actions.map((action) => actionTerm(action, refs)),
    authorityBoundaryTerm(reflection),
    {
      id: resultTermId,
      kind: "authority_boundary",
      label: "Procedural posture result",
      polarity: "constrains",
      confidence: 1,
      proceduralRole: "objective_view",
      procedureOperator: "routes_to",
      actionEffect: "Express the assembled action posture for user review.",
      evidenceNeeds: missingEvidence.length > 0 ? missingEvidence : undefined,
      refusesAuthority: ["execution_authority"],
      evidenceRefs: refs,
      reasonCodes: ["fruition_result"],
    },
  ]);

  const actionTermIds = reflection.recommended_actions.map((action) => termId("action", action.id));
  const operators = buildOperators({
    terms,
    resultTermId,
    missingTermIds: missingEvidence.map((missing) => termId("missing", missing)),
    gateTermIds: gateWarnings.map((warning) => termId("gate", warning.gateId)),
    boundaryTermId: "fruition.authority.evidence_only",
    actionTermIds,
  });
  const posture = choosePosture({ admission, missingEvidence, gateWarnings });

  return buildFruitionProcedureExpressionV1({
    generatedAt: input.generatedAt,
    expressionId: input.expressionId,
    sourceReflectionId: reflection.reflectionId,
    inputs: {
      ...(input.objective ? { objective: input.objective } : {}),
      inputKind: reflection.input.kind,
      summary: reflection.input.summary,
      ...(refs.length > 0 ? { refs } : {}),
    },
    terms,
    operators,
    expression: renderExpression(operators, posture),
    result: {
      posture,
      label: labelForPosture(posture),
      recommendedActionIds: reflection.recommended_actions.map((action) => action.id),
      missingEvidence,
      admission,
      agentExecutable: false,
    },
  });
}
