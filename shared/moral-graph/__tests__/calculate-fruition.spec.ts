import { describe, expect, it } from "vitest";
import { validateFruitionProcedureExpressionV1 } from "../../fruition-procedure-expression";
import type { IdeologyGraphDocument } from "../ideology-graph-types";
import { buildIdeologyGraph } from "../load-ideology-graph";
import { reflectIdeologyContext } from "../reflect-ideology-context";
import { calculateFruitionFromReflection } from "../calculate-fruition";

const graphDocument: IdeologyGraphDocument = {
  version: 1,
  rootId: "mission-ethos",
  actionGatePolicy: {
    version: 1,
    covered_action_tags: ["covered-action"],
    legal_key_tags: ["legal-key"],
    ethos_key_tags: ["ethos-key"],
    jurisdiction_floor_ok_tags: ["jurisdiction-floor-ok"],
    hard_fail_ids: {
      missing_legal_key: "IDEOLOGY_MISSING_LEGAL_KEY",
      missing_ethos_key: "IDEOLOGY_MISSING_ETHOS_KEY",
    },
  },
  nodes: [
    {
      id: "mission-ethos",
      title: "Mission Ethos",
      tags: ["root"],
      children: ["right-speech-infrastructure", "two-key-approval"],
    },
    {
      id: "right-speech-infrastructure",
      title: "Right Speech Infrastructure",
      aliases: ["truthful interface"],
      tags: ["speech", "posture"],
      children: ["skillful-mediation"],
      links: [{ rel: "see-also", to: "two-key-approval" }],
    },
    {
      id: "skillful-mediation",
      title: "Skillful Mediation",
      tags: ["trait", "outer_edge", "conflict"],
    },
    {
      id: "two-key-approval",
      title: "Two-Key Approval",
      tags: ["covered-action", "legal-key"],
      actions: [{ label: "Run gate check", action: { kind: "openPanel" } }],
    },
  ],
};

const graph = buildIdeologyGraph(graphDocument);

function reflect(text: string, refs: string[] = ["turn:test"]) {
  return reflectIdeologyContext(graph, {
    kind: "user_prompt",
    text,
    refs,
    generatedAt: "2026-06-01T00:00:00.000Z",
    reflectionId: "ideology-reflection:fruition",
  });
}

describe("Fruition deterministic procedure calculator", () => {
  it("assembles lenses, gates, missing checks, and boundaries into a traceable expression", () => {
    const reflection = reflect("Use Right Speech Infrastructure and Skillful Mediation before action.");
    const fruition = calculateFruitionFromReflection({
      reflection,
      objective: "Choose the next procedural step.",
      generatedAt: "2026-06-01T00:00:00.000Z",
      expressionId: "fruition:trace",
    });

    expect(validateFruitionProcedureExpressionV1(fruition)).toEqual([]);
    expect(fruition.artifactId).toBe("fruition_procedure_expression");
    expect(fruition.sourceReflectionId).toBe("ideology-reflection:fruition");
    expect(fruition.calculator.modelCalls).toBe(0);
    expect(fruition.terms.map((term) => term.kind)).toEqual(
      expect.arrayContaining(["lens", "trait", "action_gate", "authority_boundary"]),
    );
    expect(fruition.terms.map((term) => term.proceduralRole)).toEqual(
      expect.arrayContaining(["first_principle", "constraint", "action_gate", "authority_boundary", "objective_view"]),
    );
    expect(fruition.terms.map((term) => term.procedureOperator)).toEqual(
      expect.arrayContaining(["supports", "constrains", "requires"]),
    );
    expect(
      fruition.terms.find((term) => term.sourceNodeIds?.includes("right-speech-infrastructure"))?.actionEffect,
    ).toContain("constrains");
    expect(fruition.operators.map((operator) => operator.kind)).toEqual(
      expect.arrayContaining(["supports", "requires", "constrains"]),
    );
    expect(fruition.expression).toContain("=>");
  });

  it("routes missing evidence to clarification without execution", () => {
    const reflection = reflectIdeologyContext(graph, {
      kind: "note",
      text: "No deterministic lens words here.",
      generatedAt: "2026-06-01T00:00:00.000Z",
      reflectionId: "ideology-reflection:missing",
    });
    const fruition = calculateFruitionFromReflection({ reflection });

    expect(validateFruitionProcedureExpressionV1(fruition)).toEqual([]);
    expect(fruition.result.posture).toBe("ask_for_clarification");
    expect(fruition.result.missingEvidence).toEqual(
      expect.arrayContaining(["input_refs", "deterministic_ideology_lens_match"]),
    );
    expect(fruition.result.agentExecutable).toBe(false);
    expect(fruition.result.admission.authority.agent_executable).toBe(false);
  });

  it("preserves admission artifact links and evidence refs", () => {
    const reflection = reflect("Use Right Speech Infrastructure before action.", ["turn:test", "doc:ethos"]);
    const fruition = calculateFruitionFromReflection({ reflection });

    expect(fruition.result.admission.sourceReceiptId).toBe(reflection.reflectionId);
    expect(fruition.result.admission.source?.artifact_id).toBe(reflection.reflectionId);
    expect(fruition.result.admission.evidenceRefs).toEqual(["turn:test", "doc:ethos"]);
    expect(fruition.inputs.refs).toEqual(["turn:test", "doc:ethos"]);
  });

  it("keeps blocked admissions blocked and non-executable", () => {
    const reflection = {
      ...reflect("Use Right Speech Infrastructure."),
      recommended_actions: [
        {
          id: "moral-graph.run_command",
          type: "run_command",
          label: "Run command",
        },
      ],
    };
    const fruition = calculateFruitionFromReflection({ reflection });

    expect(validateFruitionProcedureExpressionV1(fruition)).toEqual([]);
    expect(fruition.result.posture).toBe("blocked");
    expect(fruition.result.admission.actions[0]?.admission).toBe("blocked");
    expect(fruition.result.admission.actions[0]?.agentExecutable).toBe(false);
  });
});
