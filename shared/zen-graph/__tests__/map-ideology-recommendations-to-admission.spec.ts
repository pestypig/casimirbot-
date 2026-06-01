import { describe, expect, it } from "vitest";
import { validateHelixRecommendedActionAdmissionV1 } from "../../contracts/helix-recommended-action-admission.v1";
import { buildIdeologyContextReflectionV1, type IdeologyContextReflectionV1 } from "../../ideology-context-reflection";
import { mapIdeologyReflectionToRecommendedActionAdmission } from "../map-ideology-recommendations-to-admission";

function reflection(overrides: Partial<Parameters<typeof buildIdeologyContextReflectionV1>[0]> = {}): IdeologyContextReflectionV1 {
  return buildIdeologyContextReflectionV1({
    generatedAt: "2026-06-01T00:00:00.000Z",
    reflectionId: "ideology-reflection:phase7",
    graph: {
      graphId: "zen-ideology-graph",
      rootId: "mission-ethos",
      source: "docs/ethos/ideology.json",
    },
    input: {
      kind: "user_prompt",
      summary: "Reflect through right speech and two-key approval.",
      refs: ["turn:test", "doc:selection"],
    },
    matches: {
      exact: [
        {
          nodeId: "right-speech-infrastructure",
          label: "Right Speech Infrastructure",
          score: 0.9,
          reasons: ["exact label match"],
          pathToRoot: ["right-speech-infrastructure", "mission-ethos"],
        },
      ],
      likely: [],
      inferred_lenses: [],
    },
    activated_traits: [],
    claim_boundaries: {
      diagnostic_only: true,
      avoid_character_judgment: true,
      needs_user_confirmation: true,
    },
    recommended_actions: [
      {
        id: "zen-graph.highlight_ideology_lens",
        type: "highlight_ideology_lens",
        label: "Highlight ideology lens",
        reasonCodes: ["activated_lens"],
      },
    ],
    ...overrides,
  });
}

describe("ZenGraph recommendation admission mapping", () => {
  it("maps display-only ZenGraph actions to auto diagnostic evidence without execution", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(reflection());

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(admission.actions[0]).toMatchObject({
      admission: "auto",
      risk: "claim_sensitive",
      display_policy: "diagnostic_only",
      agentExecutable: false,
      reasonCode: "diagnostic_only_not_executable",
    });
    expect(admission.actions[0]?.reasonCodes).toEqual([
      "zen_graph_reflection",
      "diagnostic_overlay_only",
      "evidence_only_authority",
    ]);
    expect(admission.authority.agent_executable).toBe(false);
  });

  it("maps missing evidence to ask_user with evidenceRequirements.missing", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(
      reflection({
        claim_boundaries: {
          diagnostic_only: true,
          avoid_character_judgment: true,
          needs_user_confirmation: true,
          missing_evidence: ["jurisdiction_context", "source_refs"],
        },
        recommended_actions: [
          {
            id: "zen-graph.ask_for_missing_evidence",
            type: "ask_for_missing_evidence",
            label: "Ask for missing evidence",
          },
        ],
      }),
    );

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(admission.actions[0]).toMatchObject({
      admission: "ask_user",
      risk: "claim_sensitive",
      display_policy: "diagnostic_only",
      agentExecutable: false,
      evidenceRequirements: {
        missing: ["jurisdiction_context", "source_refs"],
      },
    });
    expect(admission.evidenceRequirements?.missing).toEqual(["jurisdiction_context", "source_refs"]);
  });

  it("maps mutating ZenGraph actions to ask_user", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(
      reflection({
        recommended_actions: [
          {
            id: "zen-graph.suggest_note_tag",
            type: "suggest_note_tag",
            label: "Suggest note tag",
          },
        ],
      }),
    );

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(admission.actions[0]).toMatchObject({
      admission: "ask_user",
      risk: "mutating",
      display_policy: "actionable",
      agentExecutable: false,
      reasonCode: "workspace_mutation_requires_confirmation",
    });
  });

  it("maps blocked operational actions to blocked and never executable", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(
      reflection({
        recommended_actions: [
          {
            id: "zen-graph.run_command",
            type: "run_command",
            label: "Run command",
          },
        ],
      }),
    );

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(admission.actions[0]).toMatchObject({
      admission: "blocked",
      risk: "unknown",
      display_policy: "hidden",
      agentExecutable: false,
      reasonCode: "unknown_action_not_allowlisted",
    });
  });

  it("links source artifact id back to the ideology reflection and preserves evidence refs", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(reflection());

    expect(admission.source).toMatchObject({
      workstation: "zen-graph",
      tool: "zen-graph-reflection",
      artifact_type: "ideology_context_reflection",
      artifact_id: "ideology-reflection:phase7",
    });
    expect(admission.actions[0]?.source).toMatchObject({
      artifact_id: "ideology-reflection:phase7",
    });
    expect(admission.evidenceRefs).toEqual(["turn:test", "doc:selection"]);
    expect(admission.actions[0]?.evidenceRefs).toEqual(["turn:test", "doc:selection"]);
  });
});
