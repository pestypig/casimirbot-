import {
  HELIX_WORKSTATION_TOOL_EVALUATION_SCHEMA,
  type HelixWorkstationActionReceipt,
  type WorkstationToolEvaluation,
} from "../../../shared/helix-workstation-affordance";
import { validateHelixRecommendedActionAdmissionV1 } from "../../../shared/contracts/helix-recommended-action-admission.v1";
import { validateIdeologyContextReflectionV1 } from "../../../shared/ideology-context-reflection";
import { validateMoralBadgeLocatorV1 } from "../../../shared/moral-badge-locator";
import { validateFruitionProcedureExpressionV1 } from "../../../shared/fruition-procedure-expression";
import { validateProceduralMoralClassificationV1 } from "../../../shared/procedural-moral-classification";
import { validateTheoryIdeologyBridgeV1 } from "../../../shared/theory-ideology-bridge";
import { validateCivilizationBoundsRoadmapV1 } from "../../../shared/civilization-bounds-roadmap";
import { validateCivilizationScenarioFrameV1 } from "../../../shared/civilization-scenario-frame";

export type EvaluateWorkstationToolReceiptInput = {
  thread_id: string;
  turn_id?: string | null;
  goal_id?: string | null;
  subgoal_id?: string | null;
  receipt: HelixWorkstationActionReceipt | Record<string, unknown>;
  expected_result_text?: string | null;
};

function newId(prefix: string): string {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function includesExpected(value: string | null, expected: string | null | undefined): boolean {
  if (!value || !expected) return false;
  return value.toLowerCase().includes(expected.toLowerCase());
}

const THEORY_REFLECTION_FORBIDDEN_PATTERNS = [
  /validated propulsion/i,
  /working warp drive/i,
  /physical mechanism confirmed/i,
  /QEI passed/i,
  /proven warp/i,
  /certified transport solution/i,
] as const;

function containsForbiddenTheoryReflectionClaim(value: unknown): boolean {
  const text = JSON.stringify(value ?? "");
  return THEORY_REFLECTION_FORBIDDEN_PATTERNS.some((pattern: RegExp) => pattern.test(text));
}

function theoryReflectionAuthorityIssues(artifact: Record<string, unknown>): string[] {
  const artifactV1 = asRecord(artifact.artifact_v1);
  const authority = asRecord(artifact.authority);
  const reflectionV1 = asRecord(artifact.reflectionV1);
  const explanationPlanV1 = asRecord(artifact.explanationPlanV1);
  const authoritySources = [artifact, artifactV1, authority, reflectionV1, explanationPlanV1].filter(Boolean) as Record<string, unknown>[];
  const issues: string[] = [];
  for (const source of authoritySources) {
    if (getBoolean(source.assistant_answer) !== false) issues.push("assistant_answer_not_false");
    if (getBoolean(source.raw_content_included) !== false) issues.push("raw_content_included_not_false");
    if (getBoolean(source.terminal_eligible) !== false) issues.push("terminal_eligible_not_false");
  }
  if (containsForbiddenTheoryReflectionClaim(artifact)) issues.push("forbidden_claim_phrase");
  return Array.from(new Set(issues));
}

function extractTheoryReflectionEvidence(receipt: Record<string, unknown>): {
  reflection: Record<string, unknown> | null;
  explanationPlan: Record<string, unknown> | null;
  authoritySources: Record<string, unknown>[];
  summary: string | null;
  artifact: Record<string, unknown> | null;
} {
  const artifact = asRecord(receipt.artifact) ?? receipt;
  const artifactV1 = asRecord(artifact.artifact_v1);
  const reflection =
    asRecord(artifact.reflectionV1) ??
    asRecord(artifactV1?.reflectionV1) ??
    artifactV1 ??
    null;
  const explanationPlan =
    asRecord(artifact.explanationPlanV1) ??
    asRecord(artifactV1?.explanationPlanV1) ??
    null;
  const authoritySources = [
    artifact,
    asRecord(artifact.authority),
    artifactV1,
    reflection,
    explanationPlan,
  ].filter(Boolean) as Record<string, unknown>[];
  const evidenceForAsk =
    asRecord(artifact.evidence_for_ask) ??
    asRecord(reflection?.evidenceForAsk) ??
    asRecord(reflection?.evidence_for_ask);
  return {
    reflection,
    explanationPlan,
    authoritySources,
    summary: getString(evidenceForAsk?.summary),
    artifact,
  };
}

function isTheoryReflectionReceiptKind(kind: string | null, artifact: Record<string, unknown> | null): boolean {
  return (
    kind === "theory_context_reflection" ||
    kind === "helix_theory_context_reflection_tool_receipt" ||
    artifact?.artifactId === "helix_theory_context_reflection_tool_receipt" ||
    artifact?.schemaVersion === "helix_theory_context_reflection_tool_receipt/v1"
  );
}

function isRecommendedActionAdmissionKind(kind: string | null, artifact: Record<string, unknown> | null): boolean {
  return (
    kind === "helix_recommended_action_admission" ||
    artifact?.artifactId === "helix_recommended_action_admission" ||
    artifact?.schemaVersion === "helix_recommended_action_admission/v1"
  );
}

function isMoralGraphReflectionToolKind(kind: string | null, artifact: Record<string, unknown> | null): boolean {
  const reflection = asRecord(artifact?.reflection);
  const proceduralClassification = asRecord(artifact?.proceduralClassification);
  const locator = asRecord(artifact?.locator);
  const fruition = asRecord(artifact?.fruition);
  return (
    kind === "helix_moral_graph_reflection_tool_result" ||
    kind === "ideology_context_reflection" ||
    artifact?.tool_id === "helix_ask.reflect_ideology_context" ||
    artifact?.tool_id === "helix_ask.calculate_fruition" ||
    reflection?.artifactId === "ideology_context_reflection" ||
    reflection?.schemaVersion === "ideology_context_reflection/v1" ||
    proceduralClassification?.artifactId === "procedural_moral_classification" ||
    proceduralClassification?.schemaVersion === "procedural_moral_classification/v1" ||
    locator?.artifactId === "moral_badge_locator" ||
    locator?.schemaVersion === "moral_badge_locator/v1" ||
    fruition?.artifactId === "fruition_procedure_expression" ||
    fruition?.schemaVersion === "fruition_procedure_expression/v1"
  );
}

function isTheoryIdeologyBridgeToolKind(kind: string | null, artifact: Record<string, unknown> | null): boolean {
  const bridge = asRecord(artifact?.bridge);
  return (
    kind === "helix_theory_ideology_bridge_tool_result" ||
    kind === "theory_ideology_bridge" ||
    artifact?.tool_id === "helix_ask.bridge_theory_ideology_context" ||
    bridge?.artifactId === "theory_ideology_bridge" ||
    bridge?.schemaVersion === "theory_ideology_bridge/v1" ||
    artifact?.artifactId === "theory_ideology_bridge" ||
    artifact?.schemaVersion === "theory_ideology_bridge/v1"
  );
}

function isCivilizationScenarioFrameToolKind(kind: string | null, artifact: Record<string, unknown> | null): boolean {
  const frame = asRecord(artifact?.frame);
  return (
    kind === "helix_civilization_scenario_frame_tool_result" ||
    kind === "civilization_scenario_frame" ||
    artifact?.tool_id === "helix_ask.build_civilization_scenario_frame" ||
    frame?.artifactId === "civilization_scenario_frame" ||
    frame?.schemaVersion === "civilization_scenario_frame/v1" ||
    artifact?.artifactId === "civilization_scenario_frame" ||
    artifact?.schemaVersion === "civilization_scenario_frame/v1"
  );
}

function isCivilizationBoundsToolKind(kind: string | null, artifact: Record<string, unknown> | null): boolean {
  const roadmap = asRecord(artifact?.roadmap);
  return (
    kind === "helix_civilization_bounds_tool_result" ||
    kind === "civilization_bounds_roadmap" ||
    kind === "civilization_bounds.locate_context" ||
    kind === "civilization_bounds.reflect_system_bounds" ||
    kind === "civilization_bounds.compare_collaboration_bounds" ||
    kind === "civilization_bounds.export_bridge_context" ||
    artifact?.tool_id === "helix_ask.reflect_civilization_bounds" ||
    roadmap?.artifactId === "civilization_bounds_roadmap" ||
    roadmap?.schemaVersion === "civilization_bounds_roadmap/v1" ||
    artifact?.artifactId === "civilization_bounds_roadmap" ||
    artifact?.schemaVersion === "civilization_bounds_roadmap/v1"
  );
}

function validateMoralGraphReflectionToolResult(artifact: Record<string, unknown>): string[] {
  const issues: string[] = [];
  const reflection = asRecord(artifact.reflection) ?? artifact;
  issues.push(...validateIdeologyContextReflectionV1(reflection));
  const proceduralClassification = asRecord(artifact.proceduralClassification);
  if (proceduralClassification) {
    issues.push(
      ...validateProceduralMoralClassificationV1(proceduralClassification).map(
        (issue) => `proceduralClassification.${issue}`,
      ),
    );
  }
  const locator = asRecord(artifact.locator);
  if (locator) {
    issues.push(...validateMoralBadgeLocatorV1(locator).map((issue) => `locator.${issue}`));
  }
  const fruition = asRecord(artifact.fruition);
  if (fruition) {
    issues.push(...validateFruitionProcedureExpressionV1(fruition).map((issue) => `fruition.${issue}`));
  }
  const admissions = Array.isArray(artifact.admissions) ? artifact.admissions : [];
  for (const [index, admission] of admissions.entries()) {
    const admissionIssues = validateHelixRecommendedActionAdmissionV1(admission);
    issues.push(...admissionIssues.map((issue) => `admissions[${index}].${issue}`));
  }
  if (admissions.some((entry) => asRecord(entry)?.authority && getBoolean(asRecord(asRecord(entry)?.authority)?.agent_executable) !== false)) {
    issues.push("admission_authority_agent_executable_not_false");
  }
  return issues;
}

function validateTheoryIdeologyBridgeToolResult(artifact: Record<string, unknown>): string[] {
  const bridge = asRecord(artifact.bridge) ?? artifact;
  return validateTheoryIdeologyBridgeV1(bridge);
}

function validateCivilizationScenarioFrameToolResult(artifact: Record<string, unknown>): string[] {
  const frame = asRecord(artifact.frame) ?? artifact;
  const issues = validateCivilizationScenarioFrameV1(frame);
  const authority = asRecord(frame.authority);
  if (authority) {
    for (const field of [
      "terminal_eligible",
      "agent_executable",
      "scenario_finality",
      "prediction_finality",
      "policy_finality",
      "moral_finality",
    ] as const) {
      if (authority[field] !== false) issues.push(`authority.${field}_not_false`);
    }
  }
  return issues;
}

function validateCivilizationBoundsToolResult(artifact: Record<string, unknown>): string[] {
  const roadmap = asRecord(artifact.roadmap) ?? artifact;
  const issues = validateCivilizationBoundsRoadmapV1(roadmap);
  const authority = asRecord(roadmap.authority);
  if (authority) {
    for (const field of [
      "terminal_eligible",
      "agent_executable",
      "prediction_finality",
      "policy_finality",
      "moral_finality",
    ] as const) {
      if (authority[field] !== false) issues.push(`authority.${field}_not_false`);
    }
  }
  return issues;
}

export function evaluateWorkstationToolReceipt(input: EvaluateWorkstationToolReceiptInput): WorkstationToolEvaluation {
  const receipt = input.receipt as Record<string, unknown>;
  const artifact = asRecord(receipt.artifact);
  const panelId = getString(receipt.panel_id) ?? getString(artifact?.panel_id) ?? "unknown";
  const actionId = getString(receipt.action_id) ?? getString(artifact?.action_id) ?? "unknown";
  const ok = receipt.ok === true;
  const topLevelKind = getString(artifact?.kind) ?? getString(receipt.kind) ?? getString(artifact?.artifactId) ?? getString(receipt.artifactId);
  const evidenceRefs = Array.isArray(receipt.evidence_refs)
    ? receipt.evidence_refs.filter((entry: unknown): entry is string => typeof entry === "string")
    : [`workstation:${panelId}.${actionId}`];

  let result: WorkstationToolEvaluation["result"] = ok ? "supports_subgoal" : "insufficient";
  let summary = ok
    ? `${panelId}.${actionId} completed with a receipt.`
    : `${panelId}.${actionId} did not produce a successful receipt.`;

  if (panelId === "scientific-calculator") {
    const resultText = getString(artifact?.result_text);
    if (!ok) {
      result = "insufficient";
      summary = getString(receipt.message) ?? "Calculator did not produce a usable result.";
    } else if (input.expected_result_text && !includesExpected(resultText, input.expected_result_text)) {
      result = "contradicts_subgoal";
      summary = `Calculator result ${resultText ?? "unknown"} does not match expected result ${input.expected_result_text}.`;
    } else {
      result = "supports_subgoal";
      summary = `Calculator verified ${getString(artifact?.normalized_expression) ?? "the expression"} with result ${resultText ?? "available in receipt"}.`;
    }
  } else if (isTheoryReflectionReceiptKind(topLevelKind, artifact ?? receipt)) {
    const evidence = extractTheoryReflectionEvidence(receipt);
    const theoryArtifact = {
      ...(evidence.artifact ?? {}),
      ...asRecord((evidence.artifact ?? {}).authority),
      artifact_v1: evidence.reflection,
    };
    const issues = theoryReflectionAuthorityIssues(theoryArtifact);
    if (!ok) {
      result = "insufficient";
      summary = getString(receipt.message) ?? "Theory context reflection did not produce a usable receipt.";
    } else if (issues.length > 0) {
      result = "insufficient";
      summary = `Theory context reflection rejected as terminal evidence: ${issues.join(", ")}.`;
    } else {
      result = "supports_subgoal";
      summary = evidence.summary
        ? `Theory reflection located discussion context as evidence only: ${evidence.summary}`
        : "Theory reflection located discussion context as evidence only.";
    }
  } else if (isRecommendedActionAdmissionKind(topLevelKind, artifact ?? receipt)) {
    const admission = artifact ?? receipt;
    const issues = validateHelixRecommendedActionAdmissionV1(admission);
    if (!ok) {
      result = "insufficient";
      summary = getString(receipt.message) ?? "Recommended action admission did not produce a usable policy receipt.";
    } else if (issues.length > 0) {
      result = "insufficient";
      summary = `Recommended action admission rejected as policy evidence: ${issues.join(", ")}.`;
    } else {
      result = "supports_subgoal";
      summary = "Recommended action admission classified candidate actions as evidence-only tool policy.";
    }
  } else if (isMoralGraphReflectionToolKind(topLevelKind, artifact ?? receipt)) {
    const moralArtifact = artifact ?? receipt;
    const issues = validateMoralGraphReflectionToolResult(moralArtifact);
    if (!ok) {
      result = "insufficient";
      summary = getString(receipt.message) ?? "MoralGraph reflection tool did not produce a usable receipt.";
    } else if (issues.length > 0) {
      result = "insufficient";
      summary = `MoralGraph reflection rejected as policy evidence: ${issues.join(", ")}.`;
    } else {
      result = "supports_subgoal";
      summary = [
        "MoralGraph reflection produced evidence-only ideology lenses",
        asRecord(moralArtifact.proceduralClassification) ? "procedural next-move classification" : null,
        asRecord(moralArtifact.locator) ? "badge locator paths" : null,
        asRecord(moralArtifact.fruition) ? "Fruition procedure expression" : null,
        "missing checks, and admissions.",
      ].filter(Boolean).join(", ");
    }
  } else if (isTheoryIdeologyBridgeToolKind(topLevelKind, artifact ?? receipt)) {
    const bridgeArtifact = artifact ?? receipt;
    const issues = validateTheoryIdeologyBridgeToolResult(bridgeArtifact);
    if (!ok) {
      result = "insufficient";
      summary = getString(receipt.message) ?? "Theory/Moral bridge did not produce a usable receipt.";
    } else if (issues.length > 0) {
      result = "insufficient";
      summary = `Theory/Moral bridge rejected as policy evidence: ${issues.join(", ")}.`;
    } else {
      result = "supports_subgoal";
      summary =
        "Theory/Moral bridge produced evidence-only procedural constraints, analogy boundaries, missing checks, and overclaim guards.";
    }
  } else if (isCivilizationScenarioFrameToolKind(topLevelKind, artifact ?? receipt)) {
    const frameArtifact = artifact ?? receipt;
    const issues = validateCivilizationScenarioFrameToolResult(frameArtifact);
    if (!ok) {
      result = "insufficient";
      summary = getString(receipt.message) ?? "Civilization Scenario Frame did not produce a usable receipt.";
    } else if (issues.length > 0) {
      result = "insufficient";
      summary = `Civilization Scenario Frame rejected as scenario/prediction evidence: ${issues.join(", ")}.`;
    } else {
      result = "supports_subgoal";
      summary =
        "Civilization Scenario Frame produced evidence-only bounded-system grammar, claim tier, missing-evidence hooks, and roadmap inputs.";
    }
  } else if (isCivilizationBoundsToolKind(topLevelKind, artifact ?? receipt)) {
    const civilizationArtifact = artifact ?? receipt;
    const issues = validateCivilizationBoundsToolResult(civilizationArtifact);
    if (!ok) {
      result = "insufficient";
      summary = getString(receipt.message) ?? "Civilization Bounds Roadmap did not produce a usable receipt.";
    } else if (issues.length > 0) {
      result = "insufficient";
      summary = `Civilization Bounds Roadmap rejected as policy/prediction evidence: ${issues.join(", ")}.`;
    } else {
      result = "supports_subgoal";
      summary =
        "Civilization Bounds Roadmap produced evidence-only system bounds, capability/dependency badges, collaboration constraints, and missing-evidence hooks.";
    }
  } else if (panelId === "workstation-notes") {
    result = ok ? "stored_for_reference" : "insufficient";
    summary = ok
      ? `Note action stored reference material without injecting raw text into Ask.`
      : `Note action failed or did not return a receipt.`;
  } else if (panelId === "theory-badge-graph") {
    const kind = getString(artifact?.kind);
    if (!ok) {
      result = "insufficient";
      summary = getString(receipt.message) ?? "Theory badge graph action did not produce a usable receipt.";
    } else if (kind === "helix_physics_calculation_context_plan") {
      const nextActions = Array.isArray(artifact?.next_actions) ? artifact.next_actions.length : 0;
      result = nextActions > 0 ? "needs_followup_tool" : "supports_subgoal";
      summary =
        nextActions > 0
          ? "Physics context plan located theory badges and proposed follow-up workstation actions."
          : "Physics context plan located theory badges and claim boundaries.";
    } else if (kind === "theory_context_reflection") {
      const evidence = extractTheoryReflectionEvidence(receipt);
      const theoryArtifact = artifact ?? {};
      const issues = theoryReflectionAuthorityIssues({
        ...theoryArtifact,
        artifact_v1: evidence.reflection ?? asRecord(theoryArtifact.artifact_v1),
      });
      if (issues.length > 0) {
        result = "insufficient";
        summary = `Theory context reflection rejected as terminal evidence: ${issues.join(", ")}.`;
      } else {
        const reflectionSummary = evidence.summary;
        result = "supports_subgoal";
        summary = reflectionSummary
          ? `Theory reflection located discussion context as evidence only: ${reflectionSummary}`
          : "Theory reflection located discussion context as evidence only.";
      }
    } else if (kind === "theory_context_explanation_plan") {
      const theoryArtifact = artifact ?? {};
      const issues = theoryReflectionAuthorityIssues(theoryArtifact);
      if (issues.length > 0) {
        result = "insufficient";
        summary = `Theory context explanation rejected as terminal evidence: ${issues.join(", ")}.`;
      } else {
        const plan = asRecord(theoryArtifact.artifact_v1);
        const planSummary = asRecord(plan?.summary);
        const stepCount = Array.isArray(plan?.explanationSteps) ? plan.explanationSteps.length : 0;
        const scalarCount = typeof planSummary?.scalarCutCount === "number" ? planSummary.scalarCutCount : 0;
        const runtimeCount = typeof planSummary?.runtimeCount === "number" ? planSummary.runtimeCount : 0;
        result = "supports_subgoal";
        summary = `Theory explanation plan traced reflected context from first-principle roots through branch, runtime/evidence, and boundary rows as evidence only (${stepCount} steps, ${scalarCount} scalar cuts, ${runtimeCount} runtime/evidence rows).`;
      }
    } else if (kind === "theory_badge_locator") {
      result = "supports_subgoal";
      summary = "Theory locator matched relevant badges and claim boundaries.";
    } else if (kind === "theory_calculator_loadout_loaded") {
      result = "needs_followup_tool";
      summary = "Theory calculator loadout was loaded but not solved.";
    } else if (kind === "theory_calculator_loadout_solve" || kind === "theory_calculator_loadout_solved") {
      result = "supports_subgoal";
      summary = "Theory calculator loadout returned scalar traces and context rows.";
    } else if (kind === "starsim_runtime_receipt") {
      result = "supports_subgoal";
      summary = "StarSim runtime receipt returned classification context and claim boundaries.";
    }
  } else if (String(receipt.receipt_kind ?? "").includes("live_source")) {
    const status = getString(artifact?.status);
    result = status === "active" || artifact?.latest_tick ? "supports_subgoal" : "needs_followup_tool";
    summary =
      result === "supports_subgoal"
        ? `Live source is active and has observable state.`
        : `Live source receipt exists but needs a first tick or active status before the subgoal is satisfied.`;
  }

  return {
    schema: HELIX_WORKSTATION_TOOL_EVALUATION_SCHEMA,
    evaluation_id: newId("workstation-tool-eval"),
    thread_id: input.thread_id,
    turn_id: input.turn_id ?? null,
    goal_id: input.goal_id ?? null,
    subgoal_id: input.subgoal_id ?? null,
    tool_receipt_id: getString(receipt.receipt_id) ?? "receipt:unknown",
    result,
    summary,
    evidence_refs: evidenceRefs,
    model_invoked: false,
    deterministic_gate: true,
    created_at: new Date().toISOString(),
  };
}
