import { describe, expect, it } from "vitest";
import { buildCivilizationBoundsScenario } from "../../../client/src/data/civilizationBoundsScenarios";
import { buildCivilizationAtlasViewModel } from "../../civilization/build-civilization-atlas-view-model";
import { buildDefaultCivilizationTraversabilityAtlas } from "../../civilization/civilization-traversability-fixtures";
import { sortRoutesForObjective } from "../../civilization/civilization-route-objectives";
import { validateCivilizationTraversabilityAtlasV1 } from "../civilization-traversability-atlas.v1";

describe("civilization_traversability_atlas/v1", () => {
  it("validates the default planetary traversability atlas fixture", () => {
    const atlas = buildDefaultCivilizationTraversabilityAtlas({
      scenarioId: "test_planetary_traversability",
      generatedAt: "2026-07-01T00:00:00.000Z",
      observedAt: "2026-07-01T00:00:00.000Z",
    });

    expect(validateCivilizationTraversabilityAtlasV1(atlas)).toEqual([]);
    expect(atlas.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      agent_executable: false,
      prediction_finality: false,
      policy_finality: false,
      moral_finality: false,
      execution_permission: false,
    });
    expect(atlas.fieldLayers.map((layer) => layer.fieldLayerId)).toEqual(
      expect.arrayContaining([
        "field:era5:north-atlantic-wind",
        "field:sahara-amazon:dust-phosphorus",
        "field:spun:mycorrhizal-biodiversity",
      ]),
    );
  });

  it("builds a focused context from route and field-layer selections", () => {
    const roadmap = buildCivilizationBoundsScenario("needle_hull_ideal_global_construction");
    const atlas = buildDefaultCivilizationTraversabilityAtlas({
      scenarioId: roadmap.scenarioId,
      generatedAt: roadmap.generatedAt,
      observedAt: "2026-07-01T00:00:00.000Z",
    });
    const viewModel = buildCivilizationAtlasViewModel({
      roadmap,
      atlas,
      selectedRouteIds: ["route:atmospheric:sahara-amazon:dust"],
      selectedFieldLayerIds: ["field:sahara-amazon:dust-phosphorus"],
      routeObjective: "best_observed",
      timeCursor: "2026-07-01T00:00:00.000Z",
    });

    expect(viewModel.traversabilityContext.routeCandidateIds).toEqual([
      "route:atmospheric:sahara-amazon:dust",
    ]);
    expect(viewModel.traversabilityContext.activeFieldLayerIds).toEqual([
      "field:sahara-amazon:dust-phosphorus",
    ]);
    expect(viewModel.traversabilityContext.infrastructureNodeIds).toEqual([
      "node:dust:bodele",
      "node:ecology:amazon-basin",
    ]);
    expect(viewModel.traversabilityContext.zenNodeIds).toContain("interbeing-systems");
    expect(viewModel.traversabilityContext.theoryBadgeIds).toContain(
      "biophysics.membrane.open_system_entropy_flow",
    );
    expect(viewModel.traversabilityContext.missingEvidence).toEqual(
      expect.arrayContaining(["current_year_plume_observation"]),
    );
  });

  it("sorts route candidates by explicit objective before synthesis", () => {
    const atlas = buildDefaultCivilizationTraversabilityAtlas();
    const bySpeed = sortRoutesForObjective(atlas.routeCandidates, "fastest");
    const byOperationalEvidence = sortRoutesForObjective(atlas.routeCandidates, "best_observed");

    expect(bySpeed[0]?.routeId).toBe("route:cable:new-york-uk:transatlantic");
    expect(byOperationalEvidence[0]?.routeId).toBe("route:atmospheric:sahara-amazon:dust");
  });
});

