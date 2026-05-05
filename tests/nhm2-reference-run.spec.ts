import { describe, expect, it } from "vitest";

import {
  buildNhm2ReferenceRunArtifact,
  isNhm2ReferenceRunArtifact,
  type Nhm2ReferenceRunArtifact,
} from "../shared/contracts/nhm2-reference-run.v1";
import { buildNhm2QeiDossierArtifact } from "../shared/contracts/nhm2-qei-dossier.v1";
import { validateNhm2ReferenceRun } from "../tools/nhm2/validate-reference-run";

const makeReferenceRun = (
  artifactSet: Nhm2ReferenceRunArtifact["artifactSet"] = [],
) =>
  buildNhm2ReferenceRunArtifact({
    generatedAt: "2026-04-25T00:00:00.000Z",
    runId: "nhm2-reference-test",
    repo: {
      repositoryFullName: "local/casimirbot",
      branch: "validation-hardening/nhm2-reference-solve-red-team",
      commitSha: "abc123",
      dirtyTreeStatus: "dirty",
    },
    selectedFamily: {
      laneId: "nhm2_shift_lapse",
      selectedProfileId: "stage1_centerline_alpha_0p995_v1",
      expectedProfileId: "stage1_centerline_alpha_0p995_v1",
      profileMatch: true,
    },
    claimLock: {
      currentClaimTier: "diagnostic",
      maximumClaimTier: "reduced-order",
      validationMode: "red_team_hardening",
      validationClaimAllowed: false,
      latestAliasForbidden: true,
    },
    commands: [
      {
        id: "freeze",
        command: "npm run nhm2:freeze-reference-run",
        status: "not_run",
        startedAt: null,
        completedAt: null,
      },
    ],
    artifactSet,
    hashLock: {
      inputManifestSha256: null,
      toleranceManifestSha256: null,
      artifactSetSha256: null,
      literatureClaimMapSha256: null,
    },
    blockerSummary: {
      overallState: "review",
      blockingReasons: ["insufficient_provenance"],
      observerConsistencyStatus: "unknown",
      sourceClosureRegionalStatus: "unknown",
      qeiDossierStatus: "missing",
      reproducibilityStatus: "missing",
    },
  });

const validLiteratureMap = {
  schemaVersion: "nhm2_literature_claim_map/v1",
  claimPolicy: {
    externalTheoryDoesNotValidateNHM2: true,
    webOrPaperCitationRequiredForExternalTheoryClaims: true,
    noPredictiveLanguageFromExperimentalMathOnly: true,
  },
  sources: [
    {
      sourceId: "maldacena_1997_ads_cft",
      title: "The Large N Limit of Superconformal Field Theories and Supergravity",
      url: "https://arxiv.org/abs/hep-th/9711200",
      claimSupport: ["controlled_holographic_context"],
      nonSupport: ["does_not_validate_nhm2_source_mechanism"],
    },
  ],
};

const passFullLoop = {
  overallState: "pass",
  highestPassingClaimTier: "reduced-order",
  sections: {
    observer_audit: {
      state: "pass",
      artifactRefs: [{ artifactId: "nhm2_observer_audit", status: "pass" }],
    },
    uncertainty_perturbation_reproducibility: {
      meshConvergenceOrder: 2,
      boundaryConditionSensitivity: "bounded",
      smoothingKernelSensitivity: "bounded",
      independentReproductionStatus: "pass",
      artifactHashConsistencyStatus: "pass",
    },
    certificate_policy_result: {
      state: "pass",
    },
  },
};

const passObserver = {
  status: "pass",
  reasonCodes: [],
  shiftLapseProfileId: "stage1_centerline_alpha_0p995_v1",
  metric_required: {
    conditions: {
      wec: { status: "pass" },
      nec: { status: "pass" },
      dec: { status: "pass" },
      sec: { status: "pass" },
    },
  },
  tile_effective: {
    conditions: {
      wec: { status: "pass" },
      nec: { status: "pass" },
      dec: { status: "pass" },
      sec: { status: "pass" },
    },
  },
};

const passSourceClosure = {
  regionComparisons: {
    regions: [
      {
        regionId: "hull",
        comparisonBasisStatus: "same_basis",
        counterpartResolutionStatus: "resolved",
        metricExpectedCounterpartRole: "tile_effective_counterpart",
        tileTensorRef: "artifact://tile-effective-counterpart-hull",
        status: "pass",
        tileT00Diagnostics: {
          trace: {
            tensorRef: "tile_effective_counterpart.hull",
            pathFacts: { comparisonRole: "tile_effective_counterpart" },
          },
        },
      },
    ],
  },
  tensors: {
    metricRequired: { T00: 1, T01: 0, T02: 0, T03: 0, T11: 1, T12: 0, T13: 0, T22: 1, T23: 0, T33: 1 },
    tileEffective: { T00: 1, T01: 0, T02: 0, T03: 0, T11: 1, T12: 0, T13: 0, T22: 1, T23: 0, T33: 1 },
  },
};

describe("nhm2 reference run contract", () => {
  it("rejects latest aliases in validation mode", () => {
    const artifact = makeReferenceRun([
      {
        artifactId: "nhm2_full_loop",
        path: "artifacts/research/full-solve/nhm2-full-loop-audit-latest.json",
        schemaVersion: "nhm2_full_loop_audit/v1",
        status: "review",
        sha256: "hash",
        generatedAt: "2026-04-25T00:00:00.000Z",
        usesLatestAlias: false,
        profileId: "stage1_centerline_alpha_0p995_v1",
        profileMatch: true,
      },
    ]);

    expect(artifact.artifactSet[0]?.usesLatestAlias).toBe(true);
    expect(isNhm2ReferenceRunArtifact(artifact)).toBe(false);
  });

  it("rejects profile mismatch as a hard blocker", () => {
    const artifact = makeReferenceRun([
      {
        artifactId: "nhm2_observer_audit",
        path: "artifacts/research/full-solve/nhm2-observer-audit-2026-04-21.json",
        schemaVersion: "nhm2_observer_audit/v1",
        status: "fail",
        sha256: "hash",
        generatedAt: "2026-04-21T00:00:00.000Z",
        usesLatestAlias: false,
        profileId: "stage1_centerline_alpha_0p7000_v1",
        profileMatch: true,
      },
    ]);

    expect(artifact.artifactSet[0]?.profileMatch).toBe(false);
    expect(isNhm2ReferenceRunArtifact(artifact)).toBe(false);
  });

  it("keeps validationClaimAllowed false even when all local gates pass", () => {
    const validation = validateNhm2ReferenceRun({
      referenceRun: makeReferenceRun(),
      fullLoopAudit: passFullLoop,
      observerAudit: passObserver,
      sourceClosure: passSourceClosure,
      literatureClaimMap: validLiteratureMap,
      qeiDossier: buildNhm2QeiDossierArtifact({
        runId: "nhm2-reference-test",
        profileId: "stage1_centerline_alpha_0p995_v1",
        status: "pass",
        rhoSource: "metric_required",
        qeiApplicabilityStatus: "PASS",
        quantumStateAssumptions: ["bounded sampled reference state"],
        renormalizationConvention: "declared",
        cavityBoundaryModel: "declared",
        samplingWorldlines: [
          {
            id: "worldline-wall-1",
            regionId: "wall",
            properTimeWindow_s: 1,
            qeiMargin: 0.1,
            status: "pass",
          },
        ],
        worstWorldlineId: "worldline-wall-1",
        dutyCyclePass: true,
        lightCrossingConsistencyStatus: "pass",
        cycleAverageClosureStatus: "pass",
        literatureRefs: ["https://arxiv.org/abs/1807.04726"],
      }),
    });

    expect(validation.validationClaimAllowed).toBe(false);
    expect(validation.overallState).toBe("pass");
  });

  it("missing QEI dossier blocks physical-mechanism language", () => {
    const validation = validateNhm2ReferenceRun({
      referenceRun: makeReferenceRun(),
      fullLoopAudit: passFullLoop,
      observerAudit: passObserver,
      sourceClosure: passSourceClosure,
      literatureClaimMap: validLiteratureMap,
      qeiDossier: null,
    });

    const qeiGate = validation.gates.find(
      (entry) => entry.gateId === "GATE_QEI_DOSSIER_PRESENT",
    );
    expect(qeiGate?.state).toBe("review");
    expect(qeiGate?.reasonCodes).toContain("qei_dossier_missing");
  });

  it("certificate policy green cannot override full-loop review", () => {
    const validation = validateNhm2ReferenceRun({
      referenceRun: makeReferenceRun(),
      fullLoopAudit: {
        ...passFullLoop,
        overallState: "review",
        highestPassingClaimTier: "reduced-order",
      },
      observerAudit: passObserver,
      sourceClosure: passSourceClosure,
      literatureClaimMap: validLiteratureMap,
      qeiDossier: null,
    });

    const gate = validation.gates.find(
      (entry) => entry.gateId === "GATE_CERTIFICATE_DOES_NOT_OVERRIDE_REVIEW",
    );
    expect(gate?.state).toBe("fail");
    expect(gate?.reasonCodes).toContain("certificate_policy_green_overrode_review");
  });
});
