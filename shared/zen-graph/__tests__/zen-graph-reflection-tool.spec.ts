import { describe, expect, it } from "vitest";
import {
  validateZenGraphReflectionToolRequestV1,
  validateZenGraphReflectionToolResponseV1,
} from "../../contracts/zen-graph-reflection-tool.v1";
import { loadIdeologyGraphFromFile } from "../load-ideology-graph";
import {
  listZenGraphReflectionToolPresetsV1,
  reflectWithZenGraphToolV1,
} from "../zen-graph-reflection-tool";
import {
  DEFAULT_ZEN_WISDOM_PRESET,
  REINHARD_CHARACTER_PERSPECTIVE_PRESET,
} from "../zen-objective-presets";

const request = {
  reflectionId: "zen-graph-reflection:test-root",
  loopDepth: 0,
  sourceKind: "user_text" as const,
  inputKind: "user_prompt" as const,
  text: "I need to handle a conflict where the evidence is uncertain and the next action could harm trust.",
  refs: ["prompt:conflict-001"],
  requestedPresetIds: [DEFAULT_ZEN_WISDOM_PRESET.presetId],
  comparePresetIds: [REINHARD_CHARACTER_PERSPECTIVE_PRESET.presetId],
  options: {
    includeObjectiveBinding: true,
    includeTrace: true,
    includeRecommendedActions: true,
    includeAdmissions: true,
  },
};

describe("ZenGraph reflection tool contract", () => {
  it("validates request shape", () => {
    expect(validateZenGraphReflectionToolRequestV1(request)).toEqual([]);
    expect(
      validateZenGraphReflectionToolRequestV1({
        inputKind: "bad_kind",
        text: "",
      }),
    ).toEqual(
      expect.arrayContaining([
        "loopDepth must be an integer",
        "sourceKind is invalid",
        "inputKind is invalid",
        "text must be a non-empty string",
      ]),
    );
  });

  it("returns reflection evidence, objective binding, preset overlays, actions, and admissions", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const response = reflectWithZenGraphToolV1(graph, request);

    expect(validateZenGraphReflectionToolResponseV1(response)).toEqual([]);
    expect(response.provenance).toMatchObject({
      reflectionId: "zen-graph-reflection:test-root",
      loopDepth: 0,
      sourceKind: "user_text",
      sourceTrust: "primary",
      confirmationEligible: true,
    });
    expect(response.reflection.artifactId).toBe("ideology_context_reflection");
    expect(response.locator?.artifactId).toBe("zen_badge_locator");
    expect(response.locator?.probabilityTerrain?.graphKind).toBe("zen_badge_graph");
    expect(response.locator?.probabilityTerrain?.normalizedMass).toBeCloseTo(1, 5);
    expect(response.objectiveBinding.artifact).toBe("zen_objective_binding");
    expect(response.presetOverlays?.map((overlay) => overlay.subject.kind)).toEqual([
      "wisdom_preset",
      "character_preset",
    ]);
    expect(response.recommendedActions.length).toBeGreaterThan(0);
    expect(response.admissions.length).toBe(1);
  });

  it("preserves evidence-only authority across all outputs", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const response = reflectWithZenGraphToolV1(graph, request);

    expect(response.reflection.authority).toEqual({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
    });
    expect(response.objectiveBinding.authorityBoundary.agent_executable).toBe(false);
    expect(response.presetOverlays?.every((overlay) => overlay.authorityBoundary.terminal_eligible === false)).toBe(true);
    expect(response.admissions.every((admission) => admission.authority.ask_context_policy === "evidence_only")).toBe(true);
    expect(response.admissions.flatMap((admission) => admission.actions).every((action) => action.agentExecutable === false)).toBe(
      true,
    );
  });

  it("honors trace and admission output options without making the tool terminal", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const response = reflectWithZenGraphToolV1(graph, {
      ...request,
      options: {
        includeTrace: false,
        includeRecommendedActions: false,
        includeAdmissions: false,
      },
    });

    expect(validateZenGraphReflectionToolResponseV1(response)).toEqual([]);
    expect(response.objectiveBinding.trace).toEqual([]);
    expect(response.presetOverlays?.every((overlay) => overlay.trace.length === 0)).toBe(true);
    expect(response.recommendedActions).toEqual([]);
    expect(response.admissions).toEqual([]);
    expect(response.objectiveBinding.authorityBoundary.assistant_answer).toBe(false);
  });

  it("accepts user text as primary evidence", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const response = reflectWithZenGraphToolV1(graph, request);

    expect(response.provenance.sourceKind).toBe("user_text");
    expect(response.provenance.sourceTrust).toBe("primary");
    expect(response.objectiveBinding.bindings.every((binding) => binding.confidence <= 1)).toBe(true);
    expect(response.objectiveBinding.missingEvidence.map((entry) => entry.id)).not.toContain(
      "primary_user_or_workstation_evidence",
    );
  });

  it("marks assistant summaries as lower-trust derived evidence", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const response = reflectWithZenGraphToolV1(graph, {
      ...request,
      reflectionId: "zen-graph-reflection:assistant-summary",
      sourceKind: "assistant_summary",
      loopDepth: 1,
      text: "Assistant summary: the user might have a values conflict about trust.",
    });

    expect(validateZenGraphReflectionToolResponseV1(response)).toEqual([]);
    expect(response.provenance.sourceTrust).toBe("low_trust");
    expect(response.provenance.confirmationEligible).toBe(false);
    expect(Math.max(...response.objectiveBinding.bindings.map((binding) => binding.confidence))).toBeLessThanOrEqual(0.55);
    expect(response.objectiveBinding.missingEvidence.map((entry) => entry.id)).toContain(
      "primary_user_or_workstation_evidence",
    );
  });

  it("prevents prior reflections from becoming primary evidence", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const response = reflectWithZenGraphToolV1(graph, {
      ...request,
      reflectionId: "zen-graph-reflection:continuity",
      parentReflectionId: "zen-graph-reflection:test-root",
      sourceKind: "prior_reflection",
      loopDepth: 1,
      text: "Prior ZenGraph conclusion said uncertainty and non-harm were active.",
    });

    expect(validateZenGraphReflectionToolResponseV1(response)).toEqual([]);
    expect(response.provenance.sourceTrust).toBe("derived");
    expect(response.provenance.continuityOnly).toBe(true);
    expect(response.provenance.confirmationEligible).toBe(false);
    expect(response.recommendedActions).toEqual([]);
    expect(response.admissions).toEqual([]);
    expect(response.objectiveBinding.missingEvidence.map((entry) => entry.id)).toContain("fresh_non_recursive_evidence");
  });

  it("caps recursive loop depth", async () => {
    const graph = await loadIdeologyGraphFromFile();

    expect(
      validateZenGraphReflectionToolRequestV1({
        ...request,
        parentReflectionId: "zen-graph-reflection:test-root",
        sourceKind: "prior_reflection",
        loopDepth: 3,
      }),
    ).toContain("loopDepth must be between 0 and 2");
    expect(() =>
      reflectWithZenGraphToolV1(graph, {
        ...request,
        parentReflectionId: "zen-graph-reflection:test-root",
        sourceKind: "prior_reflection",
        loopDepth: 3,
      }),
    ).toThrow(/loopDepth must be between 0 and 2/);
  });

  it("does not increase confidence through repeated prior reflection calls", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const priorRequest = {
      ...request,
      parentReflectionId: "zen-graph-reflection:test-root",
      sourceKind: "prior_reflection" as const,
      loopDepth: 1,
      text: "Prior ZenGraph output repeated uncertainty and non-harm.",
    };
    const first = reflectWithZenGraphToolV1(graph, {
      ...priorRequest,
      reflectionId: "zen-graph-reflection:prior-1",
    });
    const second = reflectWithZenGraphToolV1(graph, {
      ...priorRequest,
      reflectionId: "zen-graph-reflection:prior-2",
    });
    const firstMax = Math.max(...first.objectiveBinding.bindings.map((binding) => binding.confidence));
    const secondMax = Math.max(...second.objectiveBinding.bindings.map((binding) => binding.confidence));

    expect(firstMax).toBeLessThanOrEqual(0.35);
    expect(secondMax).toBeLessThanOrEqual(firstMax);
    expect(second.provenance.confirmationEligible).toBe(false);
  });

  it("rejects unknown preset ids", async () => {
    const graph = await loadIdeologyGraphFromFile();

    expect(() =>
      reflectWithZenGraphToolV1(graph, {
        ...request,
        requestedPresetIds: ["missing-preset"],
        comparePresetIds: [],
      }),
    ).toThrow(/Unknown ZenGraph preset id: missing-preset/);
  });

  it("exposes known callable preset ids", () => {
    expect(listZenGraphReflectionToolPresetsV1().map((preset) => preset.presetId)).toEqual(
      expect.arrayContaining([
        DEFAULT_ZEN_WISDOM_PRESET.presetId,
        REINHARD_CHARACTER_PERSPECTIVE_PRESET.presetId,
      ]),
    );
  });
});
