import { describe, expect, it } from "vitest";
import { validateMoralObjectiveBindingV1 } from "../../contracts/moral-objective-binding.v1";
import { loadIdeologyGraphFromFile } from "../load-ideology-graph";
import {
  DEFAULT_MORAL_WISDOM_PRESET,
  REINHARD_CHARACTER_PERSPECTIVE_PRESET,
  resolveMoralGraphObjectivePresetV1,
  validateMoralGraphObjectivePresetV1,
  type MoralGraphObjectivePresetV1,
} from "../moral-objective-presets";

describe("MoralGraph objective preset resolver", () => {
  it("resolves the default wisdom preset into an objective binding", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const binding = resolveMoralGraphObjectivePresetV1(graph, DEFAULT_MORAL_WISDOM_PRESET);

    expect(validateMoralObjectiveBindingV1(binding)).toEqual([]);
    expect(binding.subject.kind).toBe("wisdom_preset");
    expect(binding.subject.label).toBe("Default Moral wisdom");
    expect(binding.bindings.map((entry) => entry.badgeId)).toEqual(
      expect.arrayContaining(["direct-observation-before-claim", "skillful-action-under-uncertainty"]),
    );
    expect(binding.constraints.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(["preset.constraint.non-harm-and-compassionate-constraint"]),
    );
  });

  it("resolves a named character perspective preset without a separate character graph", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const binding = resolveMoralGraphObjectivePresetV1(graph, REINHARD_CHARACTER_PERSPECTIVE_PRESET, {
      situationLabel: "an uncertain succession dispute",
      refs: ["prompt:test-succession"],
    });

    expect(validateMoralObjectiveBindingV1(binding)).toEqual([]);
    expect(binding.subject.kind).toBe("character_preset");
    expect(binding.subject.label).toContain("Reinhard von Lohengramm perspective applied to");
    expect(binding.subject.refs).toEqual(
      expect.arrayContaining(["logh.reinhard_von_lohengramm", "prompt:test-succession"]),
    );
    expect(binding.bindings.every((entry) => entry.source === "preset")).toBe(true);
    expect(binding.bindings.map((entry) => entry.badgeId)).not.toContain("sovereign-ambition");
    expect(binding.trace.map((entry) => entry.reason).join(" ")).toMatch(/badge weights over the Moral graph/i);
  });

  it("fails preset validation when a badge reference is missing from the ideology graph", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const invalid: MoralGraphObjectivePresetV1 = {
      ...DEFAULT_MORAL_WISDOM_PRESET,
      presetId: "moral.preset.invalid",
      badgeWeights: [
        ...DEFAULT_MORAL_WISDOM_PRESET.badgeWeights,
        {
          badgeId: "missing-moral-badge",
          weight: 0.5,
        },
      ],
    };

    expect(validateMoralGraphObjectivePresetV1(graph, invalid)).toEqual(
      expect.arrayContaining(["missing ideology badge reference: missing-moral-badge"]),
    );
    expect(() => resolveMoralGraphObjectivePresetV1(graph, invalid)).toThrow(/missing-moral-badge/);
  });

  it("preserves the evidence-only authority boundary", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const binding = resolveMoralGraphObjectivePresetV1(graph, REINHARD_CHARACTER_PERSPECTIVE_PRESET);

    expect(binding.authorityBoundary).toEqual({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
    });
  });

  it("keeps character perspective presets from implying character judgment", async () => {
    const graph = await loadIdeologyGraphFromFile();
    const binding = resolveMoralGraphObjectivePresetV1(graph, REINHARD_CHARACTER_PERSPECTIVE_PRESET);

    expect(binding.claimBoundaries.avoidCharacterJudgment).toBe(true);
    expect(binding.claimBoundaries.avoidMoralFinality).toBe(true);
    expect(binding.objectiveState.description).toMatch(/without asserting anything about a real person/i);
  });
});
