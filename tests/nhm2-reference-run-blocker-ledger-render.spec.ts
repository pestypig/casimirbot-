import { describe, expect, it } from "vitest";

import { buildNhm2BlockerLedgerArtifact } from "../shared/contracts/nhm2-blocker-ledger.v1";
import { renderReferenceRunBlockerLedger } from "../tools/nhm2/render-reference-run-blocker-ledger";

const ledger = () =>
  buildNhm2BlockerLedgerArtifact({
    generatedAt: "2026-05-05T00:00:00.000Z",
    runId: "render-run",
    selectedProfileId: "stage1_centerline_alpha_0p995_v1",
    expectedProfileId: "stage1_centerline_alpha_0p995_v1",
    laneId: "nhm2_shift_lapse",
    claimLock: {
      validationClaimAllowed: false,
      physicalMechanismClaimAllowed: false,
      promotionAllowed: false,
      allowedClaimTier: null,
      claimEffect: "blocker_ledger_only",
    },
    artifactRefs: {
      referenceRun: "reference.json",
      fullLoopAudit: "full-loop.json",
      qeiDossier: null,
      tileEffectiveCounterpart: "tile.json",
      regionalSourceClosureEvidence: "regional.json",
      sourceToGeometryDivergenceReport: "divergence.md",
      tileCounterpartProvenanceAudit: "provenance.md",
      sourceTensorArtifact: "source-tensor.json",
      conservationArtifact: null,
      referenceRunValidation: "validation.json",
    },
    tileCounterpartSource: {
      sourceTensorArtifactRef: "source-tensor.json",
      sourceTensorAuthorityMode: "reconstituted_from_source_channels",
      conservationStatus: "unknown",
      qeiLinkageStatus: "UNKNOWN",
    },
    gateSummary: [
      {
        gateId: "GATE_QEI_DOSSIER_PRESENT",
        state: "review",
        reasonCodes: ["qei_dossier_missing"],
        blockerClass: "qei",
      },
    ],
    regionalBlockers: ["global", "hull", "wall", "exterior_shell"].map((regionId) => ({
      regionId: regionId as "global" | "hull" | "wall" | "exterior_shell",
      firstDivergenceBoundary: regionId === "global" ? "none" : "counterpart_missing",
      metricTensorAuthorityMode: "full_tensor",
      tileTensorAuthorityMode: regionId === "global" ? "full_tensor" : "unknown",
      comparisonRole: regionId === "global" ? "tile_effective_counterpart" : "unknown",
      relLInf: regionId === "global" ? 0 : null,
      absLInf: regionId === "global" ? 0 : null,
      status: regionId === "global" ? "pass" : "review",
      nextRequiredEvidence:
        regionId === "global" ? "none" : "emit tile_effective_counterpart tensor",
    })),
    observerBlockers: { summaryVsDetailedStatus: "unknown", reasonCodes: [] },
    qeiBlockers: {
      status: "missing",
      qeiApplicabilityStatus: null,
      missingFields: ["qei_dossier_missing"],
    },
    reproducibilityBlockers: {
      status: "review",
      missingFields: ["meshConvergenceOrder"],
    },
    certificatePolicy: {
      certificateStatus: "GREEN",
      certificateIntegrity: "true",
      greenButNonPromotional: true,
      reason: "certificate green is non-promotional because reference validation remains non-pass",
    },
    adapterVerification: { status: "not_run", physicsImpact: "none_claimed" },
    literatureClaimBoundary: {
      externalTheoryDoesNotValidateNHM2: true,
      noPredictiveLanguageFromExperimentalMathOnly: true,
      sourcesChecked: ["maldacena_1997_ads_cft"],
    },
    primaryBlockerClass: "qei",
    nextPatchRecommendation: "publish QEI dossier",
  });

describe("render reference-run blocker ledger", () => {
  it("renders the claim boundary", () => {
    expect(renderReferenceRunBlockerLedger(ledger())).toMatch(/without promoting validation claims/);
  });

  it("renders all required regions", () => {
    const report = renderReferenceRunBlockerLedger(ledger());
    expect(report).toMatch(/\| global \|/);
    expect(report).toMatch(/\| hull \|/);
    expect(report).toMatch(/\| wall \|/);
    expect(report).toMatch(/\| exterior_shell \|/);
  });

  it("renders next required evidence", () => {
    expect(renderReferenceRunBlockerLedger(ledger())).toMatch(/emit tile_effective_counterpart tensor/);
  });

  it("renders literature non-validation boundary", () => {
    expect(renderReferenceRunBlockerLedger(ledger())).toMatch(/External theory does not validate NHM2/);
  });

  it("does not render validation or full-warp solved claims", () => {
    const report = renderReferenceRunBlockerLedger(ledger()).toLowerCase();
    expect(report).not.toContain("nhm2 validated");
    expect(report).not.toContain("full warp solved");
  });
});
