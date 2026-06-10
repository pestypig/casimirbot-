import { describe, expect, it } from "vitest";
import { validateHelixRecommendedActionAdmissionV1 } from "../../../../shared/contracts/helix-recommended-action-admission.v1";
import { validateIdeologyContextReflectionV1 } from "../../../../shared/ideology-context-reflection";
import { validateZenBadgeLocatorV1 } from "../../../../shared/zen-badge-locator";
import { validateFruitionProcedureExpressionV1 } from "../../../../shared/fruition-procedure-expression";
import { validateProceduralZenClassificationV1 } from "../../../../shared/procedural-zen-classification";
import { evaluateWorkstationToolReceipt } from "../workstation-tool-evaluator";
import {
  HELIX_ASK_ZEN_GRAPH_REFLECTION_TOOL_NAME,
  runHelixAskZenGraphReflectionTool,
  zenGraphReflectionHandler,
  zenGraphReflectionSpec,
} from "../../../skills/helix-ask.zen-graph-reflection";

describe("Helix Ask ZenGraph reflection tool", () => {
  it("returns reflection and admissions as evidence-only tool output", async () => {
    const output = await runHelixAskZenGraphReflectionTool({
      inputKind: "user_prompt",
      text: "Reflect right-speech-infrastructure and two-key approval as activated lenses with missing checks.",
      refs: ["turn:zen-graph", "doc:ethos"],
    });

    expect(validateIdeologyContextReflectionV1(output.reflection)).toEqual([]);
    expect(output.proceduralClassification).toBeDefined();
    expect(validateProceduralZenClassificationV1(output.proceduralClassification!)).toEqual([]);
    expect(output.locator).toBeDefined();
    expect(validateZenBadgeLocatorV1(output.locator!)).toEqual([]);
    expect(output.fruition).toBeUndefined();
    expect(output.reflection.artifactId).toBe("ideology_context_reflection");
    expect(output.reflection.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
    });
    expect(output.admissions.length).toBe(1);
    expect(validateHelixRecommendedActionAdmissionV1(output.admissions[0])).toEqual([]);
  });

  it("classifies inner-practice prompts into procedural next moves", async () => {
    const output = await runHelixAskZenGraphReflectionTool({
      inputKind: "user_prompt",
      text: [
        "I feel behind and stuck in rumination.",
        "Too much information dysregulates my lens.",
        "No reflection matters without falsifiable experimentation.",
        "Our private language can become an identity loop.",
      ].join(" "),
      refs: ["turn:inner-practice"],
    });

    expect(validateProceduralZenClassificationV1(output.proceduralClassification!)).toEqual([]);
    expect(output.proceduralClassification?.classifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          observedPattern: "comparison_pressure",
          proceduralMove: "separate_observation_from_story",
        }),
        expect.objectContaining({
          observedPattern: "rumination_loop",
          proceduralMove: "convert_reflection_to_experiment",
        }),
        expect.objectContaining({
          observedPattern: "information_overload",
          proceduralMove: "reduce_input_noise",
        }),
        expect.objectContaining({
          observedPattern: "practice_commitment",
          proceduralMove: "ask_for_concrete_evidence",
        }),
      ]),
    );
    expect(output.proceduralClassification?.authority).toMatchObject({
      assistant_answer: false,
      terminal_eligible: false,
      agent_executable: false,
      character_verdict: false,
      moral_finality: false,
    });
  });

  it("classifies moral guilt prompts as missing-consideration inquiry without verdict authority", async () => {
    const output = await runHelixAskZenGraphReflectionTool({
      inputKind: "user_prompt",
      text: [
        "Reflect the saying ignorance is bliss through moral guilt.",
        "If someone does not see what is wrong, what missing consideration affects well-being?",
        "Use this to research affected parties and what was reasonably knowable before judging.",
      ].join(" "),
      refs: ["turn:guilt-consideration"],
    });

    expect(validateProceduralZenClassificationV1(output.proceduralClassification!)).toEqual([]);
    expect(output.proceduralClassification?.classifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          observedPattern: "ignorance_boundary",
          proceduralMove: "ask_what_was_reasonably_knowable",
        }),
        expect.objectContaining({
          observedPattern: "unconsidered_harm",
          proceduralMove: "research_missing_considerations",
        }),
        expect.objectContaining({
          observedPattern: "guilt_signal",
          proceduralMove: "separate_guilt_from_repair",
        }),
      ]),
    );
    expect(output.proceduralClassification?.recommendedNextMoves).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "procedural-zen-action:research-missing-considerations",
          reasonCodes: expect.arrayContaining(["model_may_choose_research_tool"]),
        }),
      ]),
    );
    expect(output.proceduralClassification?.authority).toMatchObject({
      assistant_answer: false,
      terminal_eligible: false,
      agent_executable: false,
      character_verdict: false,
      moral_finality: false,
    });
  });

  it("can include the Fruition procedure expression in the same evidence receipt", async () => {
    const output = await runHelixAskZenGraphReflectionTool({
      inputKind: "user_prompt",
      text: "Plot direct observation, right speech, and two-key review, then show what Fruition would solve.",
      refs: ["turn:fruition"],
      options: {
        includeFruition: true,
        includeLocator: true,
      },
    });

    expect(output.locator).toBeDefined();
    expect(output.fruition).toBeDefined();
    expect(validateZenBadgeLocatorV1(output.locator!)).toEqual([]);
    expect(validateFruitionProcedureExpressionV1(output.fruition!)).toEqual([]);
    expect(output.fruition?.sourceReflectionId).toBe(output.reflection.reflectionId);
  });

  it("preserves admission source metadata and evidence-only authority", async () => {
    const output = await zenGraphReflectionHandler({
      inputKind: "note",
      text: "Use Skillful Mediation as an activated lens.",
      refs: ["note:123"],
    }, {});
    const result = output as Awaited<ReturnType<typeof runHelixAskZenGraphReflectionTool>>;
    const admission = result.admissions[0]!;

    expect(admission.source).toMatchObject({
      workstation: "zen-graph",
      tool: "zen-graph-reflection",
      artifact_type: "ideology_context_reflection",
      artifact_id: result.reflection.reflectionId,
    });
    expect(admission.evidenceRefs).toEqual(["note:123"]);
    expect(admission.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
    });
    expect(admission.actions.every((action) => action.agentExecutable === false)).toBe(true);
  });

  it("does not unlock execution for blocked or diagnostic-only admissions", async () => {
    const output = await runHelixAskZenGraphReflectionTool({
      inputKind: "workstation_event",
      text: "Highlight right speech, ask for missing evidence, and keep terminal execution locked.",
      refs: ["event:zen"],
    });
    const admission = output.admissions[0]!;

    for (const action of admission.actions) {
      if (action.display_policy === "diagnostic_only" || action.admission === "blocked") {
        expect(action.agentExecutable).toBe(false);
      }
    }
    expect(admission.authority.agent_executable).toBe(false);
  });

  it("can be evaluated as cited tool evidence, not assistant final authority", async () => {
    const output = await runHelixAskZenGraphReflectionTool({
      inputKind: "voice_event",
      text: "Voice event needs right speech and missing check review.",
      refs: ["voice:event"],
    });
    const evaluation = evaluateWorkstationToolReceipt({
      thread_id: "thread:zen",
      turn_id: "turn:zen",
      receipt: {
        ok: true,
        receipt_id: "receipt:zen-graph",
        kind: "helix_zen_graph_reflection_tool_result",
        artifact: {
          kind: "helix_zen_graph_reflection_tool_result",
          tool_id: HELIX_ASK_ZEN_GRAPH_REFLECTION_TOOL_NAME,
          ...output,
        },
        evidence_refs: ["voice:event", output.reflection.reflectionId],
      },
    });

    expect(evaluation.result).toBe("supports_subgoal");
    expect(evaluation.summary).toContain("evidence-only ideology lenses");
    expect(evaluation.summary).toContain("procedural next-move classification");
    expect(evaluation.summary).toContain("badge locator paths");
    expect(evaluation.model_invoked).toBe(false);
    expect(evaluation.deterministic_gate).toBe(true);
  });

  it("registers as a deterministic non-privileged diagnostic agent tool", () => {
    expect(zenGraphReflectionSpec.name).toBe(HELIX_ASK_ZEN_GRAPH_REFLECTION_TOOL_NAME);
    expect(zenGraphReflectionSpec.deterministic).toBe(true);
    expect(zenGraphReflectionSpec.risk).toMatchObject({
      writesFiles: false,
      touchesNetwork: false,
      privileged: false,
    });
    expect(zenGraphReflectionSpec.provenance).toMatchObject({
      maturity: "diagnostic",
      certifying: false,
    });
  });
});
