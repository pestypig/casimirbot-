// @vitest-environment jsdom
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ObservableUniverseAccordionPanel } from "../ObservableUniverseAccordionPanel";
import { buildObservableUniverseAccordionEtaProjection } from "@shared/observable-universe-accordion-projections";
import { OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY } from "@shared/observable-universe-accordion-projections-constants";
import { buildObservableUniverseAccordionEtaSurface } from "@shared/observable-universe-accordion-surfaces";

const readJson = (relativePath: string): unknown =>
  JSON.parse(fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8"));

const buildSurface = () => {
  const projection = buildObservableUniverseAccordionEtaProjection({
    boundaryArtifact: readJson(
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceBoundaryArtifactPath,
    ),
    defaultMissionTimeComparison: readJson(
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceDefaultMissionTimeComparisonArtifactPath,
    ),
    supportedFloorMissionTimeComparison: readJson(
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceSupportedFloorMissionTimeComparisonArtifactPath,
    ),
    supportedBandCeilingReferenceMissionTimeComparison: readJson(
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceSupportedBandCeilingReferenceArtifactPath,
    ),
    evidenceFloorMissionTimeComparison: readJson(
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceEvidenceFloorMissionTimeComparisonArtifactPath,
    ),
  });
  if (!projection) throw new Error("expected observable universe ETA projection");
  return buildObservableUniverseAccordionEtaSurface({
    contract: projection,
    catalog: [{ id: "alpha-cen-a", label: "Alpha Centauri A", position_m: [1, 0, 0] }],
    estimateKind: "proper_time",
  });
};

describe("ObservableUniverseAccordionPanel", () => {
  it("shows the default, supported, and evidence provenance fields", () => {
    render(<ObservableUniverseAccordionPanel surface={buildSurface()} />);

    expect(
      screen.getByText("stage1_centerline_alpha_0p8200_v1"),
    ).toBeDefined();
    expect(
      screen.getByText("stage1_centerline_alpha_0p8000_v1"),
    ).toBeDefined();
    expect(
      screen.getByText("stage1_centerline_alpha_0p7700_v1"),
    ).toBeDefined();
    expect(screen.getByText("0.03")).toBeDefined();
    expect(screen.getByText("manually_reviewed_static_band")).toBeDefined();
    expect(screen.getByText("Mode: proper_time")).toBeDefined();
  });

  it("shows fail-closed deferred state when contract data is missing", () => {
    const surface = buildObservableUniverseAccordionEtaSurface({
      contract: null,
      catalog: [{ id: "alpha-cen-a", position_m: [1, 0, 0] }],
      estimateKind: "proper_time",
    });
    render(<ObservableUniverseAccordionPanel surface={surface} />);

    expect(screen.getByText(/fail-closed \/ deferred/i)).toBeDefined();
    expect(
      screen.getByText(/stays fail-closed instead of substituting SR output/i),
    ).toBeDefined();
  });
});
