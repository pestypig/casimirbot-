import { describe, expect, it } from "vitest";
import {
  buildScientificCalculatorStepTraceArtifactV1,
  type ScientificCalculatorStepTraceArtifactV1,
} from "../scientific-calculator-step-schema.v1";
import {
  buildTheoryBadgePlaybackArtifactV1,
  isTheoryBadgePlaybackArtifactV1,
  validateTheoryBadgePlaybackArtifactV1,
} from "../theory-badge-playback.v1";

function calculatorArtifact(): ScientificCalculatorStepTraceArtifactV1 {
  return buildScientificCalculatorStepTraceArtifactV1({
    panelId: "scientific-calculator",
    generatedAt: "2026-05-25T00:00:00.000Z",
    request: {
      mode: "solve_equation",
      inputLatex: "rho = E / V",
      targetVariable: null,
      assumptions: { domain: "unspecified", angleMode: "radian" },
    },
    normalization: {
      parseStatus: "ok",
      canonicalText: "rho = E / V",
      canonicalLatex: "\\rho = \\frac{E}{V}",
      issues: [],
    },
    steps: [
      {
        id: "input",
        index: 1,
        stage: "input",
        title: "Input",
        text: "rho = E / V",
        latex: "\\rho = \\frac{E}{V}",
        operation: { kind: "note", rule: "capture_user_input" },
        warnings: [],
      },
    ],
    result: {
      kind: "symbolic_relation",
      text: "rho = E / V",
      latex: "\\rho = \\frac{E}{V}",
      solutions: [],
      verification: { status: "not_run", text: "Symbolic relation retained." },
    },
    quality: {
      confidence: 0.82,
      fallbackReason: null,
      engine: "nerdamer",
    },
  });
}

describe("theory_badge_playback/v1", () => {
  it("validates a solved and skipped playback artifact", () => {
    const run = buildTheoryBadgePlaybackArtifactV1({
      runId: "theory-playback:test",
      graphId: "nhm2-theory-badge-graph",
      targetBadgeId: "nhm2.source.energy_density_proxy",
      targetBadgeTitle: "Energy density proxy",
      plan: {
        mode: "dependency_closure",
        orderedBadgeIds: ["physics.gr.einstein_field_equation", "nhm2.source.energy_density_proxy"],
        executableRelationTypes: ["requires"],
        skippedRelationTypes: [],
      },
      steps: [
        {
          id: "step-1",
          index: 1,
          badgeId: "physics.gr.einstein_field_equation",
          badgeTitle: "Einstein field equation",
          payloadId: null,
          expression: null,
          displayLatex: null,
          sourcePath: "theory://nhm2-theory-badge-graph/physics.gr.einstein_field_equation/badge",
          status: "skipped",
          skipReason: "no_calculator_payload",
          startedAt: "2026-05-25T00:00:00.000Z",
          completedAt: "2026-05-25T00:00:00.000Z",
          resultText: null,
          resultLatex: null,
          resultKind: null,
          confidence: null,
          fallbackReason: null,
          calculatorArtifactV1: null,
          warnings: [],
        },
        {
          id: "step-2",
          index: 2,
          badgeId: "nhm2.source.energy_density_proxy",
          badgeTitle: "Energy density proxy",
          payloadId: "rho_equals_E_over_V_payload",
          expression: "rho = E / V",
          displayLatex: "\\rho = \\frac{E}{V}",
          sourcePath: "theory://nhm2-theory-badge-graph/nhm2.source.energy_density_proxy/rho_equals_E_over_V_payload",
          status: "solved",
          skipReason: null,
          startedAt: "2026-05-25T00:00:00.000Z",
          completedAt: "2026-05-25T00:00:00.000Z",
          resultText: "rho = E / V",
          resultLatex: "\\rho = \\frac{E}{V}",
          resultKind: "symbolic_relation",
          confidence: 0.82,
          fallbackReason: null,
          calculatorArtifactV1: calculatorArtifact(),
          warnings: [],
        },
      ],
    });

    expect(validateTheoryBadgePlaybackArtifactV1(run)).toEqual([]);
    expect(isTheoryBadgePlaybackArtifactV1(run)).toBe(true);
    expect(run.summary.calculatorArtifactCount).toBe(
      run.steps.filter((step) => step.calculatorArtifactV1).length,
    );
  });

  it("rejects failed steps without warnings", () => {
    const run = buildTheoryBadgePlaybackArtifactV1({
      runId: "theory-playback:test",
      graphId: "nhm2-theory-badge-graph",
      targetBadgeId: "nhm2.source.energy_density_proxy",
      targetBadgeTitle: "Energy density proxy",
      plan: {
        mode: "dependency_closure",
        orderedBadgeIds: ["nhm2.source.energy_density_proxy"],
        executableRelationTypes: [],
        skippedRelationTypes: [],
      },
      steps: [
        {
          id: "step-1",
          index: 1,
          badgeId: "nhm2.source.energy_density_proxy",
          badgeTitle: "Energy density proxy",
          payloadId: "rho_equals_E_over_V_payload",
          expression: "rho = E / V",
          displayLatex: "\\rho = \\frac{E}{V}",
          sourcePath: "theory://nhm2-theory-badge-graph/nhm2.source.energy_density_proxy/rho_equals_E_over_V_payload",
          status: "failed",
          skipReason: null,
          startedAt: "2026-05-25T00:00:00.000Z",
          completedAt: "2026-05-25T00:00:00.000Z",
          resultText: null,
          resultLatex: null,
          resultKind: null,
          confidence: null,
          fallbackReason: null,
          calculatorArtifactV1: null,
          warnings: [],
        },
      ],
    });

    expect(validateTheoryBadgePlaybackArtifactV1(run)).toContain("steps[0].warnings is required for failed steps");
  });
});
