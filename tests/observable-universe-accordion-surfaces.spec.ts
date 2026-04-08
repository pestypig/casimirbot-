import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SPEED_OF_LIGHT_MPS } from "../shared/contracts/warp-catalog-eta-projection.v1";
import { buildObservableUniverseAccordionEtaProjection } from "../shared/observable-universe-accordion-projections";
import { OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY } from "../shared/observable-universe-accordion-projections-constants";
import { buildObservableUniverseAccordionEtaSurface } from "../shared/observable-universe-accordion-surfaces";

const readJson = (relativePath: string): unknown =>
  JSON.parse(fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8"));

const loadProjection = () => {
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
  return projection;
};

describe("observable universe accordion ETA surfaces", () => {
  it("projects the explicit contract-backed proper-time radius and preserves direction", () => {
    const projection = loadProjection();
    const surface = buildObservableUniverseAccordionEtaSurface({
      contract: projection,
      catalog: [{ id: "alpha-cen-a", position_m: [3, 4, 0] }],
      estimateKind: "proper_time",
    });

    expect(surface.status).toBe("computed");
    if (surface.status !== "computed") return;

    const [entry] = surface.entries;
    expect(entry.drivingProfileId).toBe("stage1_centerline_alpha_0p8200_v1");
    expect(entry.withinSupportedBand).toBe(true);
    expect(entry.mappedRadius_m).toBeCloseTo(
      entry.estimateSeconds * SPEED_OF_LIGHT_MPS,
      6,
    );
    expect(entry.inputDirectionUnit[0]).toBeCloseTo(0.6, 10);
    expect(entry.inputDirectionUnit[1]).toBeCloseTo(0.8, 10);
    expect(entry.outputPosition_m[0] / entry.mappedRadius_m).toBeCloseTo(0.6, 10);
    expect(entry.outputPosition_m[1] / entry.mappedRadius_m).toBeCloseTo(0.8, 10);
    expect(surface.sourceEvidenceFloorMissionTimeComparisonArtifactPath).toBe(
      OBSERVABLE_UNIVERSE_NHM2_ETA_POLICY.sourceEvidenceFloorMissionTimeComparisonArtifactPath,
    );
  });

  it("can switch to the explicit coordinate-time view without changing the driving profile", () => {
    const projection = loadProjection();
    const surface = buildObservableUniverseAccordionEtaSurface({
      contract: projection,
      catalog: [{ id: "alpha-cen-a", position_m: [1, 0, 0] }],
      estimateKind: "coordinate_time",
    });

    expect(surface.status).toBe("computed");
    if (surface.status !== "computed") return;
    expect(surface.estimateKind).toBe("coordinate_time");
    expect(surface.entries[0].drivingProfileId).toBe(
      "stage1_centerline_alpha_0p8200_v1",
    );
  });

  it("remains fail-closed when the explicit contract is absent", () => {
    const surface = buildObservableUniverseAccordionEtaSurface({
      contract: null,
      catalog: [{ id: "alpha-cen-a", position_m: [1, 0, 0] }],
      estimateKind: "proper_time",
    });

    expect(surface.status).toBe("unavailable");
    if (surface.status !== "unavailable") return;
    expect(surface.fail_id).toBe("NHM2_EXPLICIT_CONTRACT_MISSING");
  });

  it("refuses targets outside the explicit contract instead of falling back to SR", () => {
    const projection = loadProjection();
    const surface = buildObservableUniverseAccordionEtaSurface({
      contract: projection,
      catalog: [{ id: "tau-ceti", position_m: [12, 0, 0] }],
      estimateKind: "proper_time",
    });

    expect(surface.status).toBe("unavailable");
    if (surface.status !== "unavailable") return;
    expect(surface.fail_id).toBe("NHM2_TARGET_NOT_IN_EXPLICIT_CONTRACT");
    expect(
      surface.nonClaims.some((entry) => entry.includes("route_map_eta_surface")),
    ).toBe(true);
  });
});
