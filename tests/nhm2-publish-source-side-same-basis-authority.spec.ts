import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildNhm2ReferenceRunArtifact } from "../shared/contracts/nhm2-reference-run.v1";
import {
  buildNhm2TileEffectiveCounterpartArtifact,
  type Nhm2TileEffectiveCounterpartComparisonRole,
  type Nhm2TileEffectiveCounterpartRegion,
  type Nhm2TileEffectiveCounterpartTensorAuthorityMode,
} from "../shared/contracts/nhm2-tile-effective-counterpart.v1";
import { publishSourceSideSameBasisTensorAuthority } from "../tools/nhm2/publish-source-side-same-basis-authority";

const profile = "stage1_centerline_alpha_0p995_v1";
const regionIds = ["global", "hull", "wall", "exterior_shell"] as const;

const referenceRun = () =>
  buildNhm2ReferenceRunArtifact({
    generatedAt: "2026-06-12T00:00:00.000Z",
    runId: "source-authority-run",
    repo: {
      repositoryFullName: "local/casimirbot",
      branch: "main",
      commitSha: "abc",
      dirtyTreeStatus: "dirty",
    },
    selectedFamily: {
      laneId: "nhm2_shift_lapse",
      selectedProfileId: profile,
      expectedProfileId: profile,
      profileMatch: true,
    },
    claimLock: {
      currentClaimTier: "diagnostic",
      maximumClaimTier: "reduced-order",
      validationMode: "red_team_hardening",
      validationClaimAllowed: false,
      latestAliasForbidden: true,
    },
    commands: [],
    artifactSet: [],
    hashLock: {
      inputManifestSha256: null,
      toleranceManifestSha256: null,
      artifactSetSha256: null,
      literatureClaimMapSha256: null,
    },
    blockerSummary: {
      overallState: "review",
      blockingReasons: [],
      observerConsistencyStatus: "unknown",
      sourceClosureRegionalStatus: "unknown",
      qeiDossierStatus: "missing",
      reproducibilityStatus: "missing",
    },
  });

const tensor = (value: number, mode: Nhm2TileEffectiveCounterpartTensorAuthorityMode) => ({
  T00: -value,
  T11: value,
  T22: value,
  T33: value,
  ...(mode === "diagonal_reduced_order"
    ? {}
    : {
        T01: 0,
        T02: 0,
        T03: 0,
        T10: 0,
        T12: 0,
        T13: 0,
        T20: 0,
        T21: 0,
        T23: 0,
        T30: 0,
        T31: 0,
        T32: 0,
      }),
});

const region = (
  regionId: (typeof regionIds)[number],
  role: Nhm2TileEffectiveCounterpartComparisonRole,
  mode: Nhm2TileEffectiveCounterpartTensorAuthorityMode,
): Nhm2TileEffectiveCounterpartRegion => ({
  regionId,
  status: "pass",
  comparisonRole: role,
  tensorAuthorityMode: mode,
  tensor: tensor(10, mode),
  chartRef: "comoving_cartesian",
  unitsRef: "J/m^3",
  regionMaskRef: `mask.${regionId}`,
  aggregationMode: "mean",
  normalizationBasis: "sample_count",
  sampleCount: 10,
  provenance: {
    producerModule: "tile-model.ts",
    producerFunction: "emit",
    inputRefs: [`tile.${regionId}`],
    sourceModelId: "fixture_source_model",
    sourceModelVersion: "v1",
    derivationMode:
      role === "metric_echo_diagnostic_only"
        ? "metric_echo"
        : mode === "diagonal_reduced_order"
          ? "diagonal_proxy"
          : "tile_model_direct_full_tensor",
    notDerivedFromMetricRequiredTensor: role !== "metric_echo_diagnostic_only",
  },
  blockers: [],
});

const counterpart = (
  role: Nhm2TileEffectiveCounterpartComparisonRole,
  mode: Nhm2TileEffectiveCounterpartTensorAuthorityMode,
) =>
  buildNhm2TileEffectiveCounterpartArtifact({
    generatedAt: "2026-06-12T00:00:00.000Z",
    runId: "source-authority-run",
    selectedProfileId: profile,
    expectedProfileId: profile,
    laneId: "nhm2_shift_lapse",
    sourceAuthorityMode: "unknown",
    sourceTensorArtifactRef: "source-tensor.json",
    sourceTensorAuthorityMode: mode,
    conservationRef: null,
    conservationStatus: "unknown",
    qeiDossierRef: "qei.json",
    qeiApplicabilityStatus: "PASS",
    quantumStateAssumptions: ["declared"],
    renormalizationConvention: "declared",
    cavityBoundaryModel: "declared",
    cycleAverageClosureStatus: "pass",
    dutyCycleStatus: "pass",
    lightCrossingConsistencyStatus: "pass",
    conservationDiagnostics: {
      divTStatus: "pass",
      divTResidualLInf: 0,
      continuityResidualLInf: 0,
      momentumResidualLInf: 0,
    },
    regions: regionIds.map((regionId) => region(regionId, role, mode)),
    literatureRefs: ["fixture"],
  });

const withTemp = (fn: (root: string) => void) => {
  const root = mkdtempSync(join(tmpdir(), "nhm2-source-authority-"));
  try {
    writeFileSync(join(root, "reference.json"), JSON.stringify(referenceRun()), "utf8");
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

describe("publish source-side same-basis tensor authority", () => {
  it("marks current observation-channel counterparts as counterpart_missing", () =>
    withTemp((root) => {
      writeFileSync(
        join(root, "tile.json"),
        JSON.stringify(counterpart("gr_matter_channel_observation", "full_tensor")),
        "utf8",
      );
      const artifact = publishSourceSideSameBasisTensorAuthority({
        repoRoot: root,
        referenceRunPath: "reference.json",
        tileEffectiveCounterpartPath: "tile.json",
        outPath: "authority.json",
      });

      expect(artifact.summary.hasWallAuthority).toBe(false);
      expect(artifact.regions.find((entry) => entry.regionId === "wall")?.status).toBe(
        "counterpart_missing",
      );
    }));

  it("keeps diagonal source-side tensors proxy-limited, not authoritative", () =>
    withTemp((root) => {
      writeFileSync(
        join(root, "tile.json"),
        JSON.stringify(counterpart("tile_effective_counterpart", "diagonal_reduced_order")),
        "utf8",
      );
      const artifact = publishSourceSideSameBasisTensorAuthority({
        repoRoot: root,
        referenceRunPath: "reference.json",
        tileEffectiveCounterpartPath: "tile.json",
        outPath: "authority.json",
      });

      expect(artifact.summary.anyProxy).toBe(true);
      expect(artifact.regions.find((entry) => entry.regionId === "wall")?.status).toBe(
        "proxy_limited",
      );
    }));

  it("forbids metric echoes as source-side authority", () =>
    withTemp((root) => {
      writeFileSync(
        join(root, "tile.json"),
        JSON.stringify(counterpart("metric_echo_diagnostic_only", "full_tensor")),
        "utf8",
      );
      const artifact = publishSourceSideSameBasisTensorAuthority({
        repoRoot: root,
        referenceRunPath: "reference.json",
        tileEffectiveCounterpartPath: "tile.json",
        outPath: "authority.json",
      });

      expect(artifact.summary.anyMetricEcho).toBe(true);
      expect(artifact.regions.find((entry) => entry.regionId === "wall")?.status).toBe(
        "metric_echo_forbidden",
      );
    }));

  it("marks all required regions authoritative only for non-metric full tensor counterparts", () =>
    withTemp((root) => {
      writeFileSync(
        join(root, "tile.json"),
        JSON.stringify(counterpart("tile_effective_counterpart", "full_tensor")),
        "utf8",
      );
      const artifact = publishSourceSideSameBasisTensorAuthority({
        repoRoot: root,
        referenceRunPath: "reference.json",
        tileEffectiveCounterpartPath: "tile.json",
        outPath: "authority.json",
      });

      expect(artifact.summary.hasWallAuthority).toBe(true);
      expect(artifact.summary.allRequiredRegionsAuthoritative).toBe(true);
      expect(artifact.claimBoundary.doesNotValidatePhysicalSource).toBe(true);
    }));
});
