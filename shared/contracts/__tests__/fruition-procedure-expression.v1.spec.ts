import { describe, expect, it } from "vitest";
import { buildHelixRecommendedActionAdmissionV1 } from "../helix-recommended-action-admission.v1";
import {
  buildFruitionProcedureExpressionV1,
  isFruitionProcedureExpressionV1,
  validateFruitionProcedureExpressionV1,
} from "../fruition-procedure-expression.v1";

const admission = () =>
  buildHelixRecommendedActionAdmissionV1({
    prompt: "Reflect right speech before action.",
    sourceReceiptId: "ideology-reflection:test",
    source: {
      workstation: "moral-graph",
      tool: "fruition",
      artifact_type: "ideology_context_reflection",
      artifact_id: "ideology-reflection:test",
    },
    actions: [
      {
        actionId: "moral-graph.ask_for_missing_evidence",
        panelId: "moral-graph",
        label: "Ask for missing evidence",
        mutatesCalculator: false,
        solves: false,
        objectiveFit: "high",
        risk: "claim_sensitive",
        admission: "ask_user",
        requiresConfirmation: true,
        agentExecutable: false,
        reason: "Missing evidence requires confirmation.",
        reasonCode: "missing_evidence",
        display_policy: "diagnostic_only",
        evidenceRefs: ["turn:test"],
        evidenceRequirements: { missing: ["source_refs"] },
        reasonCodes: ["fruition", "missing_evidence", "evidence_only_authority"],
      },
    ],
    evidenceRefs: ["turn:test"],
    evidenceRequirements: { missing: ["source_refs"] },
    reasonCodes: ["fruition", "evidence_only_authority"],
  });

const expression = () =>
  buildFruitionProcedureExpressionV1({
    generatedAt: "2026-06-01T00:00:00.000Z",
    expressionId: "fruition:test",
    sourceReflectionId: "ideology-reflection:test",
    inputs: {
      objective: "Decide the next procedural question.",
      inputKind: "user_prompt",
      summary: "Use Right Speech Infrastructure and ask for missing evidence.",
      refs: ["turn:test"],
    },
    terms: [
      {
        id: "fruition.lens.right-speech-infrastructure",
        kind: "lens",
        label: "Right Speech Infrastructure",
        polarity: "supports",
        confidence: 0.9,
        proceduralRole: "constraint",
        procedureOperator: "constrains",
        actionEffect: "Constrain wording before action.",
        evidenceNeeds: ["source_refs"],
        refusesAuthority: ["execution_authority"],
        sourceNodeIds: ["right-speech-infrastructure"],
        evidenceRefs: ["turn:test"],
        reasonCodes: ["exact label match"],
      },
      {
        id: "fruition.missing.source_refs",
        kind: "missing_check",
        label: "Missing check: source refs",
        polarity: "requires",
        confidence: 1,
        evidenceRefs: ["turn:test"],
        reasonCodes: ["missing_evidence"],
      },
      {
        id: "fruition.authority.evidence_only",
        kind: "authority_boundary",
        label: "Evidence-only authority",
        polarity: "constrains",
        confidence: 1,
        evidenceRefs: ["turn:test"],
        reasonCodes: ["diagnostic_only"],
      },
    ],
    operators: [
      {
        id: "fruition.operator.requires_missing_checks",
        kind: "asks_for",
        fromTermIds: ["fruition.missing.source_refs"],
        toTermIds: ["fruition.result.procedural_posture"],
        label: "Missing checks ask for clarification",
        rationale: "A procedure with missing evidence routes toward clarification before action readiness.",
      },
    ],
    expression: "missing.source_refs asks_for result.procedural_posture => ask_for_clarification",
    result: {
      posture: "ask_for_clarification",
      label: "Procedure needs missing checks",
      recommendedActionIds: ["moral-graph.ask_for_missing_evidence"],
      missingEvidence: ["source_refs"],
      admission: admission(),
      agentExecutable: false,
    },
  });

describe("fruition procedure expression v1", () => {
  it("builds a valid deterministic Fruition expression artifact", () => {
    const artifact = expression();

    expect(validateFruitionProcedureExpressionV1(artifact)).toEqual([]);
    expect(isFruitionProcedureExpressionV1(artifact)).toBe(true);
    expect(artifact.artifactId).toBe("fruition_procedure_expression");
    expect(artifact.schemaVersion).toBe("fruition_procedure_expression/v1");
    expect(artifact.calculator).toEqual({
      name: "fruition",
      mode: "deterministic_procedure",
      modelCalls: 0,
    });
  });

  it("preserves evidence-only non-executable authority", () => {
    const artifact = expression();

    expect(artifact.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
    });
    expect(artifact.result.agentExecutable).toBe(false);
    expect(artifact.result.admission.authority.agent_executable).toBe(false);
  });

  it("preserves procedural badge grammar on terms", () => {
    const artifact = expression();
    const term = artifact.terms.find((candidate) => candidate.id === "fruition.lens.right-speech-infrastructure");

    expect(term).toMatchObject({
      proceduralRole: "constraint",
      procedureOperator: "constrains",
      actionEffect: "Constrain wording before action.",
      evidenceNeeds: ["source_refs"],
      refusesAuthority: ["execution_authority"],
    });
  });

  it("rejects invalid procedural term grammar", () => {
    const artifact = expression();
    const issues = validateFruitionProcedureExpressionV1({
      ...artifact,
      terms: [
        {
          ...artifact.terms[0],
          proceduralRole: "oracle",
          procedureOperator: "declares",
        },
      ],
    });

    expect(issues).toContain("terms[0].proceduralRole is invalid");
    expect(issues).toContain("terms[0].procedureOperator is invalid");
  });

  it("rejects model calls and executable results", () => {
    const artifact = expression();
    const issues = validateFruitionProcedureExpressionV1({
      ...artifact,
      calculator: { ...artifact.calculator, modelCalls: 1 },
      result: { ...artifact.result, agentExecutable: true },
    });

    expect(issues).toContain("calculator.modelCalls must be 0");
    expect(issues).toContain("result.agentExecutable must be false");
  });

  it("rejects finality language", () => {
    const issues = validateFruitionProcedureExpressionV1({
      ...expression(),
      result: {
        ...expression().result,
        label: "morally approved",
      },
    });

    expect(issues.some((issue) => issue.includes("forbidden fruition finality text"))).toBe(true);
  });
});
