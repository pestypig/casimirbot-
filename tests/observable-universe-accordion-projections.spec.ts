import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isWarpCatalogEtaProjectionV1 } from "../shared/contracts/warp-catalog-eta-projection.v1";
import { buildObservableUniverseAccordionEtaProjection } from "../shared/observable-universe-accordion-projections";
import { OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY } from "../shared/observable-universe-accordion-projections-constants";

const readJson = (relativePath: string): unknown =>
  JSON.parse(fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8"));

const loadBundle = () => ({
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

describe("observable universe accordion ETA projections", () => {
  it("encodes the manual conservative band and keeps the default profile distinct from the evidence floor", () => {
    const projection = buildObservableUniverseAccordionEtaProjection(loadBundle());

    expect(isWarpCatalogEtaProjectionV1(projection)).toBe(true);
    expect(projection).not.toBeNull();
    if (!projection) return;

    expect(projection.defaultOperatingProfileId).toBe(
      "stage1_centerline_alpha_0p8200_v1",
    );
    expect(projection.supportedBandFloorProfileId).toBe(
      "stage1_centerline_alpha_0p8000_v1",
    );
    expect(projection.supportedBandCeilingProfileId).toBe(
      "stage1_centerline_alpha_0p995_v1",
    );
    expect(projection.evidenceFloorProfileId).toBe(
      "stage1_centerline_alpha_0p7700_v1",
    );
    expect(projection.evidenceFloorCenterlineAlpha).toBe(0.77);
    expect(projection.supportBufferDeltaCenterlineAlpha).toBe(0.03);
    expect(projection.supportedBandStatus).toBe("manually_reviewed_static_band");
    expect(projection.autoTracksEvidenceFloor).toBe(false);
    expect(projection.sourceEvidenceFloorMissionTimeComparisonArtifactPath).toBe(
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceEvidenceFloorMissionTimeComparisonArtifactPath,
    );
    expect(projection.entries).toHaveLength(2);
    expect(
      projection.entries.every(
        (entry) => entry.drivingProfileId === "stage1_centerline_alpha_0p8200_v1",
      ),
    ).toBe(true);
    expect(
      projection.entries.every((entry) => entry.withinSupportedBand === true),
    ).toBe(true);
    expect(
      projection.nonClaims.some((entry) => entry.includes("route_map_eta_surface")),
    ).toBe(true);
  });

  it("fails closed if the default comparison no longer matches the explicit manual profile", () => {
    const bundle = loadBundle();
    const mutated = structuredClone(bundle) as any;
    mutated.defaultMissionTimeComparison.sourceSurface.shiftLapseProfileId =
      "stage1_centerline_alpha_0p7700_v1";

    expect(buildObservableUniverseAccordionEtaProjection(mutated)).toBeNull();
  });

  it("keeps canonical baseline latest aliases unchanged in the boundary source", () => {
    const bundle = loadBundle() as any;

    expect(bundle.boundaryArtifact.canonicalBaselineLatestAliasesChanged).toBe(false);
  });
});
