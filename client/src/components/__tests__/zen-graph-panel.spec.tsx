// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { buildIdeologyContextReflectionV1 } from "@shared/ideology-context-reflection";
import { mapIdeologyReflectionToRecommendedActionAdmission } from "@shared/zen-graph/map-ideology-recommendations-to-admission";
import { useFruitionCalculatorStore } from "@/store/useFruitionCalculatorStore";
import ZenGraphPanel from "../panels/ZenGraphPanel";

function buildFixture() {
  const reflection = buildIdeologyContextReflectionV1({
    generatedAt: "2026-06-01T00:00:00.000Z",
    reflectionId: "ideology-reflection:panel",
    graph: {
      graphId: "zen-ideology-graph",
      rootId: "wisdom-first-principles",
      source: "docs/ethos/ideology.json",
    },
    input: {
      kind: "user_prompt",
      summary: "Reflect this through right speech, mediation, and two-key approval.",
      refs: ["turn:panel", "doc:ethos"],
    },
    matches: {
      exact: [
        {
          nodeId: "right-speech-infrastructure",
          label: "Right Speech Infrastructure",
          score: 0.9,
          reasons: ["exact label match"],
          tags: ["speech", "posture"],
          pathToRoot: ["right-speech-infrastructure", "mission-ethos", "wisdom-first-principles"],
        },
      ],
      likely: [
        {
          nodeId: "two-key-approval",
          label: "Two-Key Approval",
          score: 0.75,
          reasons: ["nearby safeguard"],
          tags: ["covered-action"],
          pathToRoot: ["two-key-approval", "mission-ethos", "wisdom-first-principles"],
        },
      ],
      inferred_lenses: [
        {
          nodeId: "skillful-mediation",
          label: "Skillful Mediation",
          score: 0.75,
          reasons: ["outer-edge lens activation"],
          tags: ["trait", "outer_edge"],
          pathToRoot: ["skillful-mediation", "right-speech-infrastructure", "mission-ethos", "wisdom-first-principles"],
        },
      ],
    },
    activated_traits: [
      {
        nodeId: "skillful-mediation",
        label: "Skillful Mediation",
        confidence: 0.75,
        pathToRoot: ["skillful-mediation", "right-speech-infrastructure", "mission-ethos", "wisdom-first-principles"],
        tags: ["trait", "outer_edge"],
      },
    ],
    tensions: [
      {
        nodeIds: ["restraint", "ambition-discipline"],
        description: "Capability pressure may outrun restraint.",
        severity: "medium",
      },
    ],
    action_gate_warnings: [
      {
        gateId: "two-key-approval",
        label: "Two-Key Approval",
        warning: "Covered action needs checks.",
        requiredCheck: "legal_key_and_ethos_key",
      },
    ],
    claim_boundaries: {
      diagnostic_only: true,
      avoid_character_judgment: true,
      needs_user_confirmation: true,
      missing_evidence: ["jurisdiction_context"],
    },
    recommended_actions: [
      {
        id: "zen-graph.highlight_ideology_lens",
        type: "highlight_ideology_lens",
        label: "Highlight ideology lens",
      },
      {
        id: "zen-graph.show_nearby_safeguard",
        type: "show_nearby_safeguard",
        label: "Show nearby safeguard",
      },
      {
        id: "zen-graph.ask_for_missing_evidence",
        type: "ask_for_missing_evidence",
        label: "Ask for missing evidence",
      },
      {
        id: "zen-graph.run_command",
        type: "run_command",
        label: "Run command",
      },
    ],
    overlay: {
      title: "ZenGraph reflection",
      summary: "Activated lens: Skillful Mediation.",
      highlightedNodeIds: ["skillful-mediation", "right-speech-infrastructure", "two-key-approval"],
    },
  });
  return {
    reflection,
    admission: mapIdeologyReflectionToRecommendedActionAdmission(reflection),
  };
}

function renderPanel() {
  const { reflection, admission } = buildFixture();
  return render(<ZenGraphPanel reflection={reflection} admission={admission} />);
}

afterEach(() => {
  useFruitionCalculatorStore.getState().clear();
  cleanup();
});

describe("ZenGraphPanel", () => {
  it("renders active lenses and path to root", () => {
    renderPanel();

    expect(screen.getByTestId("zen-graph-map-scrollport")).toBeTruthy();
    expect(screen.getByText("Zen Badge Graph")).toBeTruthy();
    expect(screen.getByText("Objective Bindings")).toBeTruthy();
    expect(screen.getByTestId("zen-graph-objective-binding-overlay")).toBeTruthy();
    expect(screen.getByText("ZenGraph Fruition Path")).toBeTruthy();
    expect(screen.getByText("First principle")).toBeTruthy();
    expect(screen.getByText("Preset path stack")).toBeTruthy();
    expect(screen.getByText("Fruition procedure")).toBeTruthy();
    expect(screen.getByText("Badge procedure")).toBeTruthy();
    expect(screen.getByText("Outer objective view")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Skillful Mediation" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "wisdom first principles" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "mission ethos" })).toBeTruthy();
    expect(screen.getAllByTestId("zen-graph-badge-node").length).toBeGreaterThan(4);
  });

  it("shows how a selected Zen badge contributes to the action procedure", () => {
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Right Speech Infrastructure" }));

    expect(screen.getAllByText(/constraint/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/constrains/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Right Speech Infrastructure constrains how the action may be formulated.").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/execution authority/i).length).toBeGreaterThan(0);
  });

  it("renders safeguards, action gate warnings, tensions, and claim boundaries", () => {
    renderPanel();

    expect(screen.getByRole("button", { name: "Two-Key Approval" })).toBeTruthy();
    expect(screen.getByText("legal_key_and_ethos_key")).toBeTruthy();
    expect(screen.getByText("Possible tensions")).toBeTruthy();
    expect(screen.getByText("Capability pressure may outrun restraint.")).toBeTruthy();
    expect(screen.getByText("Missing check: jurisdiction context")).toBeTruthy();
    expect(screen.getByText("Claim boundaries")).toBeTruthy();
    expect(screen.getAllByText(/evidence only/i).length).toBeGreaterThan(0);
  });

  it("renders admission state, risk, display policy, and evidence refs", () => {
    renderPanel();

    expect(screen.getByText(/Admission state:/)).toBeTruthy();
    expect(screen.getAllByText(/Risk: claim sensitive/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Display policy: diagnostic only/).length).toBeGreaterThan(0);
    expect(screen.getByText("Evidence refs: turn:panel, doc:ethos")).toBeTruthy();
    expect(screen.getAllByText("Ask user").length).toBeGreaterThan(0);
    expect(screen.getByText("Blocked")).toBeTruthy();
  });

  it("does not render execution affordances for evidence-only or blocked admissions", () => {
    renderPanel();

    expect(screen.queryByRole("button", { name: /execute/i })).toBeNull();
  });

  it("toggles the objective binding overlay from the Fruition lens block", () => {
    renderPanel();

    expect(screen.getByTestId("zen-graph-objective-binding-overlay")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Toggle Fruition objective binding lens" }));
    expect(screen.queryByTestId("zen-graph-objective-binding-overlay")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Toggle Fruition objective binding lens" }));
    expect(screen.getByTestId("zen-graph-objective-binding-overlay")).toBeTruthy();
  });

  it("loads the current graph expression into the Fruition Calculator panel", () => {
    const openedPanels: string[] = [];
    const listener = (event: Event) => {
      openedPanels.push((event as CustomEvent<{ id: string }>).detail.id);
    };
    window.addEventListener("open-helix-panel", listener);
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Load to Fruition Calculator" }));

    expect(useFruitionCalculatorStore.getState().currentExpression?.artifactId).toBe("fruition_procedure_expression");
    expect(openedPanels).toContain("fruition-calculator");
    window.removeEventListener("open-helix-panel", listener);
  });
});
