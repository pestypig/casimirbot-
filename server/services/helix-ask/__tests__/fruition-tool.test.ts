import { describe, expect, it } from "vitest";
import { validateFruitionProcedureExpressionV1 } from "../../../../shared/fruition-procedure-expression";
import { validateHelixRecommendedActionAdmissionV1 } from "../../../../shared/contracts/helix-recommended-action-admission.v1";
import {
  fruitionHandler,
  fruitionSpec,
  HELIX_ASK_FRUITION_TOOL_NAME,
  runHelixAskFruitionTool,
} from "../../../skills/helix-ask.fruition";

describe("Helix Ask Fruition tool", () => {
  it("returns a deterministic procedure expression with admission artifacts", async () => {
    const output = await runHelixAskFruitionTool({
      inputKind: "user_prompt",
      text: "Use right-speech-infrastructure and two-key approval to decide the next procedural question.",
      refs: ["turn:fruition", "doc:ethos"],
      objective: "Assemble a traceable procedure.",
    });

    expect(output.reflection?.artifactId).toBe("ideology_context_reflection");
    expect(validateFruitionProcedureExpressionV1(output.fruition)).toEqual([]);
    expect(output.fruition.artifactId).toBe("fruition_procedure_expression");
    expect(output.fruition.calculator).toMatchObject({
      name: "fruition",
      mode: "deterministic_procedure",
      modelCalls: 0,
    });
    expect(output.admissions.length).toBe(1);
    expect(validateHelixRecommendedActionAdmissionV1(output.admissions[0])).toEqual([]);
  });

  it("preserves evidence-only authority and never unlocks execution", async () => {
    const output = await fruitionHandler({
      inputKind: "note",
      text: "Reflect Skillful Mediation, missing checks, and restraint.",
      refs: ["note:fruition"],
    }, {});
    const result = output as Awaited<ReturnType<typeof runHelixAskFruitionTool>>;

    expect(result.fruition.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
    });
    expect(result.fruition.result.agentExecutable).toBe(false);
    expect(result.fruition.result.admission.authority.agent_executable).toBe(false);
    expect(result.fruition.result.admission.actions.every((action) => action.agentExecutable === false)).toBe(true);
  });

  it("can omit reflection and admissions while preserving the Fruition expression", async () => {
    const output = await runHelixAskFruitionTool({
      inputKind: "voice_event",
      text: "Right speech warning with a missing check.",
      refs: ["voice:fruition"],
      options: {
        includeReflection: false,
        includeAdmissionArtifacts: false,
      },
    });

    expect(output.reflection).toBeUndefined();
    expect(output.admissions).toEqual([]);
    expect(validateFruitionProcedureExpressionV1(output.fruition)).toEqual([]);
    expect(output.fruition.result.admission.artifactId).toBe("helix_recommended_action_admission");
  });

  it("registers as a deterministic non-privileged diagnostic calculator tool", () => {
    expect(fruitionSpec.name).toBe(HELIX_ASK_FRUITION_TOOL_NAME);
    expect(fruitionSpec.deterministic).toBe(true);
    expect(fruitionSpec.risk).toMatchObject({
      writesFiles: false,
      touchesNetwork: false,
      privileged: false,
    });
    expect(fruitionSpec.provenance).toMatchObject({
      maturity: "diagnostic",
      certifying: false,
    });
  });
});
