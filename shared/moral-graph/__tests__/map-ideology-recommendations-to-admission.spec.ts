import { describe, expect, it } from "vitest";
import { validateHelixRecommendedActionAdmissionV1 } from "../../contracts/helix-recommended-action-admission.v1";
import { buildIdeologyContextReflectionV1, type IdeologyContextReflectionV1 } from "../../ideology-context-reflection";
import { mapIdeologyReflectionToRecommendedActionAdmission } from "../map-ideology-recommendations-to-admission";

function reflection(overrides: Partial<Parameters<typeof buildIdeologyContextReflectionV1>[0]> = {}): IdeologyContextReflectionV1 {
  return buildIdeologyContextReflectionV1({
    generatedAt: "2026-06-01T00:00:00.000Z",
    reflectionId: "ideology-reflection:phase7",
    graph: {
      graphId: "moral-ideology-graph",
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
        id: "moral-graph.highlight_ideology_lens",
        type: "highlight_ideology_lens",
        label: "Highlight ideology lens",
        reasonCodes: ["activated_lens"],
      },
    ],
    ...overrides,
  });
}

describe("MoralGraph recommendation admission mapping", () => {
  it("maps display-only MoralGraph actions to auto diagnostic evidence without execution", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(
      reflection({
        recommended_actions: [
          {
            id: "moral-graph.show_activated_lens",
            type: "show_activated_lens",
            label: "Show activated lens",
          },
          {
            id: "moral-graph.show_path_to_root",
            type: "show_path_to_root",
            label: "Show path to root",
          },
          {
            id: "moral-graph.compare_character_perspectives",
            type: "compare_character_perspectives",
            label: "Compare character perspectives",
          },
          {
            id: "moral-graph.show_action_gate_warning",
            type: "show_action_gate_warning",
            label: "Show action gate warning",
          },
          {
            id: "moral-graph.link_ethos_node",
            type: "link_ethos_node",
            label: "Link ethos node",
          },
        ],
      }),
    );

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(admission.summary).toMatchObject({
      actionCount: 5,
      autoCount: 5,
      askUserCount: 0,
      blockedCount: 0,
    });
    for (const action of admission.actions) {
      expect(action).toMatchObject({
        admission: "auto",
        risk: "claim_sensitive",
        display_policy: "diagnostic_only",
        agentExecutable: false,
        reasonCode: "diagnostic_only_not_executable",
      });
      expect(action.reasonCodes).toEqual([
        "moral_graph_reflection",
        "diagnostic_overlay_only",
        "evidence_only_authority",
      ]);
    }
    expect(admission.authority.agent_executable).toBe(false);
  });

  it("proves auto admission does not mean executable for MoralGraph recommendations", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(reflection());

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(admission.actions[0]).toMatchObject({
      admission: "auto",
      agentExecutable: false,
    });
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
            id: "moral-graph.ask_for_missing_evidence",
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
      display_policy: "actionable",
      agentExecutable: false,
      evidenceRequirements: {
        missing: ["jurisdiction_context", "source_refs"],
      },
    });
    expect(admission.evidenceRequirements?.missing).toEqual(["jurisdiction_context", "source_refs"]);
  });

  it("maps claim-sensitive MoralGraph suggestions to ask_user without execution", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(
      reflection({
        recommended_actions: [
          {
            id: "moral-graph.suggest_wise_next_question",
            type: "suggest_wise_next_question",
            label: "Suggest wise next question",
          },
        ],
      }),
    );

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(admission.actions[0]).toMatchObject({
      admission: "ask_user",
      risk: "claim_sensitive",
      display_policy: "actionable",
      agentExecutable: false,
      reasonCode: "claim_sensitive_language",
    });
  });

  it("maps mutating MoralGraph actions to ask_user", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(
      reflection({
        recommended_actions: [
          {
            id: "moral-graph.suggest_note_tag",
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
            id: "moral-graph.execute_action",
            type: "execute_action",
            label: "Execute action",
          },
          {
            id: "moral-graph.send_message",
            type: "send_message",
            label: "Send message",
          },
          {
            id: "moral-graph.edit_document_without_confirmation",
            type: "edit_document_without_confirmation",
            label: "Edit document without confirmation",
          },
          {
            id: "moral-graph.run_command",
            type: "run_command",
            label: "Run command",
          },
          {
            id: "moral-graph.commit_code",
            type: "commit_code",
            label: "Commit code",
          },
          {
            id: "moral-graph.make_legal_medical_financial_claim",
            type: "make_legal_medical_financial_claim",
            label: "Make legal medical financial claim",
          },
        ],
      }),
    );

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(admission.summary.blockedCount).toBe(6);
    for (const action of admission.actions) {
      expect(action).toMatchObject({
        admission: "blocked",
        risk: "unknown",
        display_policy: "hidden",
        agentExecutable: false,
        reasonCode: "unknown_action_not_allowlisted",
      });
    }
  });

  it("proves diagnostic_only admissions cannot be executable", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(reflection());

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(admission.actions[0]).toMatchObject({
      display_policy: "diagnostic_only",
      agentExecutable: false,
    });
  });

  it("proves missing evidence prevents execution", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(
      reflection({
        claim_boundaries: {
          diagnostic_only: true,
          avoid_character_judgment: true,
          needs_user_confirmation: true,
          missing_evidence: ["first_party_account"],
        },
      }),
    );

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(admission.evidenceRequirements?.missing).toEqual(["first_party_account"]);
    expect(admission.actions[0]).toMatchObject({
      admission: "ask_user",
      agentExecutable: false,
      evidenceRequirements: {
        missing: ["first_party_account"],
      },
    });
  });

  it("blocks character label actions for real people", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(
      reflection({
        recommended_actions: [
          {
            id: "moral-graph.label_real_person_character",
            type: "label_real_person_character",
            label: "Label real person character",
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
    });
    expect(admission.actions[0]?.reasonCodes).toContain("blocked_operational_action");
  });

  it("preserves evidence-only authority for every MoralGraph admission", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(
      reflection({
        recommended_actions: [
          {
            id: "moral-graph.show_activated_lens",
            type: "show_activated_lens",
            label: "Show activated lens",
          },
          {
            id: "moral-graph.suggest_note_tag",
            type: "suggest_note_tag",
            label: "Suggest note tag",
          },
          {
            id: "moral-graph.label_real_person_character",
            type: "label_real_person_character",
            label: "Label real person character",
          },
        ],
      }),
    );

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(admission.authority).toEqual({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
    });
    expect(admission.actions.every((action) => action.agentExecutable === false)).toBe(true);
    expect(admission.actions.every((action) => action.reasonCodes?.includes("evidence_only_authority"))).toBe(true);
  });

  it("links source artifact id back to the ideology reflection and preserves evidence refs", () => {
    const admission = mapIdeologyReflectionToRecommendedActionAdmission(reflection());

    expect(admission.source).toMatchObject({
      workstation: "moral-graph",
      tool: "moral-graph-reflection",
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
