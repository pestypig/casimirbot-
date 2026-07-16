import { describe, expect, it } from "vitest";

import {
  buildActiveTheoryBadgeGraphContextWorkstationGatewayCallRequests,
  readWorkstationGatewayCallRequestsForTurn,
} from "../explicit-workstation-gateway";
import { arbitrateAskSourceTarget } from "../../ask-source-target-arbitrator";
import { buildCodexTheoryReflectionReceiptAnswer } from "../codex-provider";

const currentContext = {
  schema: "helix.theory_badge_graph_current_context.v1",
  panel_id: "theory-badge-graph",
  graph_id: "helix-theory-badge-graph/v1",
  selected_badge_ids: ["element.h.origin", "physics.quantum.energy_frequency"],
  active_badge_id: "physics.quantum.energy_frequency",
  combination_reader: {
    schema: "theory_badge_graph_combination_reader/v1",
    selectedBadges: [
      { id: "element.h.origin", title: "Hydrogen" },
      { id: "physics.quantum.energy_frequency", title: "Quantum Energy-Frequency Relation" },
    ],
    tracePathBadges: [{ id: "physics.atomic.transition_gap_frequency_context", title: "Transition Gap" }],
    intermediateBadges: [{ id: "physics.atomic.transition_gap_frequency_context", title: "Transition Gap" }],
    availableNextBadges: [{ id: "physics.radiation.mode_context", title: "Radiation Mode" }],
  },
  panel_open: true,
  active_panel: true,
  answer_authority: false,
  terminal_eligible: false,
};

const bodyFor = (question: string): Record<string, unknown> => ({
  question,
  workspace_context_snapshot: {
    activePanel: "theory-badge-graph",
    openPanels: ["theory-badge-graph"],
    activeTheoryBadgeGraphContext: currentContext,
  },
});

describe("Theory Badge Graph current-context admission", () => {
  it("admits a bounded read for a deictic current-selection question", () => {
    const requests = buildActiveTheoryBadgeGraphContextWorkstationGatewayCallRequests(
      bodyFor("What do these selected badges imply, and which branches are possible next?"),
    );

    expect(requests).toEqual([
      expect.objectContaining({
        capability_id: "theory-badge-graph.current_context",
        mode: "read",
        arguments: expect.objectContaining({
          current_context: currentContext,
          source_target_intent: expect.objectContaining({
            target_kind: "theory_badge_graph_current_context",
            deictic_prompt: true,
            terminal_eligible: false,
            assistant_answer: false,
          }),
        }),
      }),
    ]);
  });

  it("recognizes the workstation-visibility phrasing used for the current graph state", () => {
    const question =
      "Is the current state of the theory badge graph visible to the workstation tool so it can refer to the badges the user selected and their possibilities?";
    const requests = buildActiveTheoryBadgeGraphContextWorkstationGatewayCallRequests(bodyFor(question));

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ capability_id: "theory-badge-graph.current_context" });
  });

  it("arbitrates the deictic selection as a hard Theory source target", () => {
    const intent = arbitrateAskSourceTarget({
      turnId: "ask:test:theory-current-context",
      threadId: "thread:test",
      promptText: "What do these selected badges imply, and which branches are possible next?",
    });

    expect(intent).toMatchObject({
      target_source: "theory_locator",
      target_kind: "theory_locator",
      strength: "hard",
      precedence_reason: "theory_badge_graph_current_context_source_target",
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
    });
    expect(intent.explicit_cues).toContain("current_theory_badge_graph_selection");
    expect(intent.suppressed_routes).toEqual(expect.arrayContaining([
      "model_only_concept",
      "no_tool_direct",
      "panel_generated_answer",
    ]));
  });

  it("keeps an affirmative read-only mixed intent admitted without treating the no-change clause as negation", () => {
    const requests = buildActiveTheoryBadgeGraphContextWorkstationGatewayCallRequests(bodyFor(
      "Explain what these selected badges imply, but do not change the selection.",
    ));
    expect(requests).toHaveLength(1);
  });

  it.each([
    "Do not inspect these selected badges or explain their possible branches.",
    "If I select these badges later, explain which branch would be possible.",
    "Previously these selected badges implied a different branch; what happened then?",
    "The screen says ‘these selected badges’; explain that phrase only.",
    "The label \"What do these selected badges imply?\" is visible on the page.",
  ])("does not admit contextual, negated, future, historical, or quoted text: %s", (question) => {
    expect(buildActiveTheoryBadgeGraphContextWorkstationGatewayCallRequests(bodyFor(question))).toEqual([]);
  });

  it("keeps the exact current selection beside the required Theory reflection on a structured route", () => {
    const body = {
      ...bodyFor("What do these selected badges imply, and which branches are possible next?"),
      source_target_intent: {
        selected_capability: "helix_ask.reflect_theory_context",
        query: "What do these selected badges imply, and which branches are possible next?",
        target_kind: "theory_locator",
      },
    };
    const requests = readWorkstationGatewayCallRequestsForTurn({
      body,
      includePlannerDerived: true,
    });
    const capabilities = requests.map((request) => request.capability_id);

    expect(capabilities).toContain("theory-badge-graph.reflect_discussion_context");
    expect(capabilities).toContain("theory-badge-graph.current_context");
  });

  it("does not add a web-search edge for the live current-graph prompt", () => {
    const question =
      "Looking at the current Theory Badge Graph arrangement I set up, what do these selected badges imply together? Identify the selected badges, their connection trace and intermediate badges, and the possibilities currently available next. Distinguish my chosen arrangement from what established physics actually supports.";
    const requests = readWorkstationGatewayCallRequestsForTurn({
      body: {
        ...bodyFor(question),
        source_target_intent: {
          selected_capability: "helix_ask.reflect_theory_context",
          query: question,
          target_source: "theory_locator",
          target_kind: "theory_locator",
        },
      },
      includePlannerDerived: true,
    });
    const capabilities = requests.map((request) => request.capability_id);

    expect(capabilities).toContain("theory-badge-graph.current_context");
    expect(capabilities).toContain("theory-badge-graph.reflect_discussion_context");
    expect(capabilities).not.toContain("internet-search.search_web");
  });

  it("keeps the required Theory reflection when the runtime explicitly requests only current graph context", () => {
    const question = [
      "Looking at the current Theory Badge Graph arrangement I set up, what do these selected badges imply together?",
      "Identify the selected badges, their connection trace and intermediate badges, and the possibilities currently available next.",
      "Distinguish my chosen arrangement from what established physics actually supports.",
    ].join(" ");
    const body = {
      ...bodyFor(question),
      workstation_gateway_calls: [{
        capability_id: "theory-badge-graph.current_context",
        mode: "read",
        arguments: { current_context: currentContext },
      }],
    };

    const requests = readWorkstationGatewayCallRequestsForTurn({
      body,
      includePlannerDerived: true,
    });

    expect(requests.map((request) => request.capability_id)).toEqual([
      "theory-badge-graph.current_context",
      "theory-badge-graph.reflect_discussion_context",
    ]);
  });

  it("re-enters exact manual graph context into the Theory receipt answer without promoting it to proof", () => {
    const result = buildCodexTheoryReflectionReceiptAnswer({
      turnId: "ask:test:theory-current-context-answer",
      threadId: "thread:test",
      promptText: "What do these selected badges imply and what is possible next?",
      normalizedArtifacts: [
        {
          artifact_id: "artifact:current-context",
          kind: "theory_badge_graph_current_context",
          capability_key: "theory-badge-graph.current_context",
          payload: {
            combination_reader: {
              selected_badges: [
                { id: "element.h.origin", title: "Hydrogen" },
                { id: "physics.quantum.energy_frequency", title: "Quantum Energy-Frequency Relation" },
              ],
              trace_path_badges: [
                { id: "element.h.origin", title: "Hydrogen" },
                { id: "physics.atomic.transition_gap_frequency_context", title: "Transition Gap" },
                { id: "physics.quantum.energy_frequency", title: "Quantum Energy-Frequency Relation" },
              ],
              intermediate_badges: [
                { id: "physics.atomic.transition_gap_frequency_context", title: "Transition Gap" },
              ],
              available_next_badges: [
                { id: "physics.radiation.mode_context", title: "Radiation Mode" },
              ],
              implication_summary: ["The path requires a declared atomic transition gap."],
              boundary_context: {
                notes: ["Element identity alone does not choose a frequency."],
              },
            },
          },
        },
        {
          artifact_id: "artifact:reflection",
          kind: "helix_theory_context_reflection_tool_receipt",
          capability_key: "theory-badge-graph.reflect_discussion_context",
          payload: {
            summary: "The reflection locates the selection in atomic-radiation context.",
            exact_badge_ids: ["physics.atomic.transition_gap_frequency_context"],
            claim_boundary_notes: ["A compatible path is not an observed transition."],
          },
        },
      ],
    });

    expect(result).not.toBeNull();
    expect(result?.answer).toMatchObject({
      selected_observation_refs: ["artifact:current-context", "artifact:reflection"],
      support_refs: ["artifact:current-context", "artifact:reflection"],
      terminal_eligible: true,
      assistant_answer: false,
    });
    const text = String(result?.answer.text);
    expect(text).toContain("Current user-configured graph state:");
    expect(text).toContain("Hydrogen (`element.h.origin`)");
    expect(text).toContain("Intermediate bridge badges");
    expect(text).toContain("Available next badges");
    expect(text).toContain("Manual badge selection records the operator's chosen arrangement; it is not proof");
    expect(text).toContain("Element identity alone does not choose a frequency.");
  });

});
