import { describe, expect, it } from "vitest";

import {
  buildNhm2QeiFeasibilityFrontier,
  isNhm2QeiFeasibilityFrontier,
  type BuildNhm2QeiFeasibilityFrontierInputV1,
  type Nhm2QeiFeasibilityArtifactBindingV1,
  type Nhm2QeiFeasibilityCandidateInputV1,
  type Nhm2QeiFeasibilityEvaluationInputV1,
  type Nhm2QeiFeasibilityTheoremV1,
} from "../shared/contracts/nhm2-qei-feasibility-frontier.v1";
import { isNhm2WorldlineQeiCoverage } from "../shared/contracts/nhm2-worldline-qei-coverage.v1";

const RUN_ID = "237";
const EPOCH_ID = "gr-agent-loop:237:0";
const COMMIT_SHA = "5".repeat(40);
const PROFILE_SHA = "1".repeat(64);
const TENSOR_SHA = "2".repeat(64);
const STATE_SHA = "3".repeat(64);
const OBSERVER_SHA = "4".repeat(64);
const WORLDLINE_SHA = "5".repeat(64);
const SAMPLING_SHA = "6".repeat(64);
const THEOREM_SET_SHA = "7".repeat(64);

const runBinding = (
  artifactRef: string,
  sha256: string,
): Nhm2QeiFeasibilityArtifactBindingV1 => ({
  artifactRef,
  sha256,
  runId: RUN_ID,
  epochId: EPOCH_ID,
});

const theorem = (
  samplingFamilyId: string,
  theoremId: string,
  K_Jm3_s4 = 1e-20,
  safetySigma_Jm3 = 10,
): Nhm2QeiFeasibilityTheoremV1 => ({
  theoremId,
  samplingFamilyId,
  fieldType: "em",
  lowerBoundForm: "minus_K_over_tau_four_minus_safety_sigma",
  K_Jm3_s4,
  safetySigma_Jm3,
  tauMinSeconds: 1e-9,
  tauMaxSeconds: 1e-3,
  stationaryTimelikeWorldlinesSupported: true,
  normalizedSamplingRequired: true,
  supported: true,
  provenanceRef: "docs/research/qei/" + theoremId + ".json",
  provenanceSha256:
    samplingFamilyId === "gaussian" ? "8".repeat(64) : "9".repeat(64),
});

const boundFor = (
  tauSeconds: number,
  theoremInput: Nhm2QeiFeasibilityTheoremV1,
): number =>
  -theoremInput.K_Jm3_s4 / Math.pow(tauSeconds, 4) -
  theoremInput.safetySigma_Jm3;

const marginFor = (lhs_Jm3: number, bound_Jm3: number): number =>
  lhs_Jm3 >= 0 ? 0 : Math.abs(lhs_Jm3) / Math.abs(bound_Jm3);

const evaluation = (args: {
  worldlineId: string;
  samplingFamilyId: string;
  tauSeconds: number;
  theoremInput: Nhm2QeiFeasibilityTheoremV1;
  lhs_Jm3?: number;
  evaluationId?: string;
}): Nhm2QeiFeasibilityEvaluationInputV1 => {
  const lhs_Jm3 = args.lhs_Jm3 ?? -100;
  const boundComputed_Jm3 = boundFor(args.tauSeconds, args.theoremInput);
  return {
    evaluationId:
      args.evaluationId ??
      [
        "qei",
        args.worldlineId,
        args.samplingFamilyId,
        String(args.tauSeconds),
      ].join(":"),
    worldlineId: args.worldlineId,
    samplingFamilyId: args.samplingFamilyId,
    theoremId: args.theoremInput.theoremId,
    tauSeconds: args.tauSeconds,
    samplingNormalized: true,
    lhs_Jm3,
    boundComputed_Jm3,
    boundPolicy_Jm3: boundComputed_Jm3,
    marginRawComputed: marginFor(lhs_Jm3, boundComputed_Jm3),
    marginPolicy: marginFor(lhs_Jm3, boundComputed_Jm3),
    applicabilityStatus: "PASS",
    tauConsistency: {
      tauVsDuty: "pass",
      tauVsLightCrossing: "pass",
      tauVsModulation: "pass",
    },
    metricSemanticBinding: {
      rhoSource: "warp.metric.T00.natario_sdf.shift",
      metricT00Ref: "warp.metric.T00.natario_sdf.shift",
      metricT00Si_Jm3: -1e6,
      metricDerived: true,
      metricContractOk: true,
      sameEpoch: true,
      quantitySemanticType: "ren_expectation_timelike_energy_density",
      worldlineClass: "timelike",
      dutyAppliedToMetricT00: false,
    },
    policyEvidence: {
      boundFloorApplied: false,
      policyOrFloorUsedAsIndependentAdmissionAuthority: false,
    },
    evidenceOrigin: "run_bound_evaluation",
    rawEvaluationEvidence: runBinding(
      "artifacts/test/qei/raw/" +
        args.worldlineId +
        "-" +
        args.samplingFamilyId +
        "-" +
        String(args.tauSeconds) +
        ".json",
      "a".repeat(64),
    ),
    quadratureEvidence: runBinding(
      "artifacts/test/qei/quadrature/" +
        args.worldlineId +
        "-" +
        args.samplingFamilyId +
        "-" +
        String(args.tauSeconds) +
        ".json",
      "b".repeat(64),
    ),
    binding: {
      runId: RUN_ID,
      epochId: EPOCH_ID,
      profileSha256: PROFILE_SHA,
      fullTensorSha256: TENSOR_SHA,
      qftStateSha256: STATE_SHA,
      continuousObserverSha256: OBSERVER_SHA,
      worldlineSetSha256: WORLDLINE_SHA,
      samplingFamilySetSha256: SAMPLING_SHA,
      theoremSetSha256: THEOREM_SET_SHA,
    },
  };
};

const candidate = (
  evaluations: Nhm2QeiFeasibilityEvaluationInputV1[],
): Nhm2QeiFeasibilityCandidateInputV1 => ({
  candidateId: "candidate-a",
  profile: {
    ...runBinding("artifacts/test/profile/candidate-a.json", PROFILE_SHA),
    profileId: "profile:candidate-a",
  },
  fullTensor: {
    ...runBinding("artifacts/test/tensor/candidate-a.json", TENSOR_SHA),
    tensorBasis: "same_chart_full_tensor",
  },
  metricConstruction: {
    kind: "recomputed_full_tensor",
    dutyScaledMetricT00: false,
    directT00ScalingApplied: false,
  },
  readiness: {
    fullTensorReady: true,
    covariantConservationReady: true,
    continuousObserverReady: true,
  },
  evaluations,
});

const baseInput = (
  domain: {
    worldlineIds: string[];
    samplingFamilyIds: string[];
    tauSeconds: number[];
  } = {
    worldlineIds: ["wall-a", "transition-a"],
    samplingFamilyIds: ["gaussian", "lorentzian"],
    tauSeconds: [1e-6, 2e-6],
  },
): BuildNhm2QeiFeasibilityFrontierInputV1 => {
  const theorems = domain.samplingFamilyIds.map((familyId) =>
    theorem(familyId, "theorem:" + familyId),
  );
  const byFamily = new Map(
    theorems.map((entry) => [entry.samplingFamilyId, entry]),
  );
  const evaluations = domain.worldlineIds.flatMap((worldlineId) =>
    domain.samplingFamilyIds.flatMap((samplingFamilyId) =>
      domain.tauSeconds.map((tauSeconds) =>
        evaluation({
          worldlineId,
          samplingFamilyId,
          tauSeconds,
          theoremInput: byFamily.get(samplingFamilyId)!,
        }),
      ),
    ),
  );
  return {
    generatedAt: "2026-07-20T01:25:18.252Z",
    provenance: {
      run: {
        runId: RUN_ID,
        commitSha: COMMIT_SHA,
        epochId: EPOCH_ID,
        startedAt: "2026-07-20T01:24:18.252Z",
        completedAt: "2026-07-20T01:25:18.252Z",
      },
      runManifest: runBinding(
        "artifacts/test/run-237/manifest.json",
        "c".repeat(64),
      ),
      runtimeReceipt: runBinding(
        "artifacts/test/run-237/runtime-receipt.json",
        "d".repeat(64),
      ),
      qftState: {
        ...runBinding("artifacts/test/qft-state.json", STATE_SHA),
        stateClass: "hadamard",
        renormalizationScheme: "point_splitting",
        operatorMapping: "t_munu_uu_ren",
      },
      continuousObserver: runBinding(
        "artifacts/test/continuous-observer.json",
        OBSERVER_SHA,
      ),
      worldlineSet: runBinding(
        "artifacts/test/worldlines.json",
        WORLDLINE_SHA,
      ),
      samplingFamilySet: runBinding(
        "artifacts/test/sampling-families.json",
        SAMPLING_SHA,
      ),
      theoremSet: {
        artifactRef: "artifacts/test/qei-theorems.json",
        sha256: THEOREM_SET_SHA,
      },
      historicalOrUnboundDossierUsed: false,
    },
    domain: {
      candidateIds: ["candidate-a"],
      ...domain,
      finiteDomainDeclared: true,
      cartesianCoverageRequired: true,
    },
    theorems,
    candidates: [candidate(evaluations)],
  };
};

describe("nhm2_qei_feasibility_frontier/v1", () => {
  it("finds a diagnostic candidate only after complete worst-case Cartesian evaluation", () => {
    const frontier = buildNhm2QeiFeasibilityFrontier(baseInput());

    expect(frontier.verdict).toBe("candidate_found");
    expect(frontier.summary).toMatchObject({
      candidateCount: 1,
      passingCandidateIds: ["candidate-a"],
      selectedCandidateId: "candidate-a",
      expectedEvaluationCountPerCandidate: 8,
      cartesianCoverageComplete: true,
      provenanceBindingsComplete: true,
      frontierComplete: true,
      closestCandidateId: "candidate-a",
    });
    expect(frontier.candidates[0].coverage).toMatchObject({
      expectedEvaluationCount: 8,
      observedEvaluationCount: 8,
      complete: true,
    });
    expect(frontier.candidates[0].allEvaluationsPass).toBe(true);
    expect(frontier.candidates[0].worstCase?.worstMargin).toBeLessThan(1);
    expect(frontier.summary.closestCandidateWorstMargin).toBeLessThan(1);
    expect(frontier.summary.closestStrictMarginGap).toBeLessThan(0);
    expect(frontier.admissionPolicy.policyMayVetoButCannotPromote).toBe(true);
    expect(frontier.claimBoundary).toMatchObject({
      cannotSatisfyWorldlineQeiClosure: true,
      filesystemVerificationRequired: true,
      sensitivityDoesNotAuthorizeParameterScaling: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      certifiedSpeedClaimAllowed: false,
    });
    expect(isNhm2QeiFeasibilityFrontier(frontier)).toBe(true);
    expect(isNhm2WorldlineQeiCoverage(frontier)).toBe(false);
  });

  it("uses the worst row and rejects a cherry-picked pass when another tau is exactly margin 1", () => {
    const input = baseInput({
      worldlineIds: ["wall-a"],
      samplingFamilyIds: ["gaussian"],
      tauSeconds: [1e-6, 2e-6],
    });
    const failing = input.candidates[0].evaluations[1];
    failing.lhs_Jm3 = failing.boundComputed_Jm3;
    failing.boundPolicy_Jm3 = failing.boundComputed_Jm3;
    failing.marginRawComputed = 1;
    failing.marginPolicy = 1;
    failing.evaluationId = "strict-boundary";

    const frontier = buildNhm2QeiFeasibilityFrontier(input);

    expect(frontier.verdict).toBe("no_candidate_within_declared_domain");
    expect(frontier.evaluationStatus).toBe("complete");
    expect(frontier.candidates[0].evaluations[0].pass).toBe(true);
    expect(frontier.candidates[0].worstCase).toMatchObject({
      evaluationId: "strict-boundary",
      worstMargin: 1,
      pass: false,
    });
    expect(frontier.candidates[0].blockers).toContain(
      "strict-boundary:raw_computed_margin_not_strict_lt_1",
    );
    expect(frontier.candidates[0].blockers).toContain(
      "strict-boundary:policy_margin_not_strict_lt_1",
    );
  });

  it("replays run 237 as no candidate with the unrelaxed computed and policy margins", () => {
    const input = baseInput({
      worldlineIds: ["wall:run-237"],
      samplingFamilyIds: ["gaussian"],
      tauSeconds: [0.00002],
    });
    input.theorems = [theorem("gaussian", "ford-roman:gaussian", 2.9e-30, 18)];
    const row = evaluation({
      worldlineId: "wall:run-237",
      samplingFamilyId: "gaussian",
      tauSeconds: 0.00002,
      theoremInput: input.theorems[0],
      lhs_Jm3: -1325953.0516447346,
      evaluationId: "run-237",
    });
    row.boundComputed_Jm3 = -18.000000000018126;
    row.boundPolicy_Jm3 = -1325953.0516447346;
    row.marginRawComputed = 73664.0584246333;
    row.marginPolicy = 1;
    row.metricSemanticBinding.metricT00Si_Jm3 = -13010317570.083035;
    row.policyEvidence.boundFloorApplied = true;
    row.policyEvidence.policyOrFloorUsedAsIndependentAdmissionAuthority = false;
    input.candidates = [candidate([row])];

    const frontier = buildNhm2QeiFeasibilityFrontier(input);

    expect(frontier.verdict).toBe("no_candidate_within_declared_domain");
    expect(frontier.candidates[0].worstCase).toMatchObject({
      evaluationId: "run-237",
      marginRawComputed: 73664.0584246333,
      marginPolicy: 1,
      worstMargin: 73664.0584246333,
      pass: false,
    });
    expect(frontier.candidates[0].evaluations[0].sensitivity).toMatchObject({
      rawMarginGapToStrictLimit: 73663.0584246333,
      crossoverWithinTheoremSupport: true,
    });
    const crossoverTau =
      frontier.candidates[0].evaluations[0].sensitivity
        .theoremCrossoverTauSeconds;
    expect(crossoverTau).toBeGreaterThan(1.21609e-9);
    expect(crossoverTau).toBeLessThan(1.21611e-9);
    expect(
      frontier.candidates[0].evaluations[0].sensitivity
        .currentTauToCrossoverRatio,
    ).toBeGreaterThan(16_000);
    expect(frontier.summary).toMatchObject({
      closestCandidateId: "candidate-a",
      closestCandidateWorstMargin: 73664.0584246333,
      closestStrictMarginGap: 73663.0584246333,
    });
    expect(frontier.candidates[0].blockers).toEqual(
      expect.arrayContaining([
        "run-237:raw_computed_margin_not_strict_lt_1",
        "run-237:policy_margin_not_strict_lt_1",
      ]),
    );
    expect(frontier.candidates[0].evaluationStatus).toBe("complete");
    expect(frontier.claimBoundary.physicalViabilityClaimAllowed).toBe(false);
  });

  it("fails closed when even one Cartesian worldline-family-tau row is absent", () => {
    const input = baseInput();
    input.candidates[0].evaluations.pop();

    const frontier = buildNhm2QeiFeasibilityFrontier(input);

    expect(frontier.verdict).toBe("frontier_not_evaluable");
    expect(frontier.summary.cartesianCoverageComplete).toBe(false);
    expect(frontier.candidates[0].coverage.complete).toBe(false);
    expect(frontier.candidates[0].coverage.missingCartesianKeys).toHaveLength(
      1,
    );
    expect(frontier.candidates[0].blockers).toContain(
      "cartesian_coverage_incomplete",
    );
  });

  it.each([
    {
      name: "candidate duty scaling",
      mutate: (input: BuildNhm2QeiFeasibilityFrontierInputV1) => {
        input.candidates[0].metricConstruction.dutyScaledMetricT00 = true;
      },
      blocker: "duty_scaled_metric_t00_forbidden",
    },
    {
      name: "direct T00 scaling",
      mutate: (input: BuildNhm2QeiFeasibilityFrontierInputV1) => {
        input.candidates[0].metricConstruction.directT00ScalingApplied = true;
      },
      blocker: "direct_metric_t00_scaling_forbidden",
    },
    {
      name: "row-level duty scaling",
      mutate: (input: BuildNhm2QeiFeasibilityFrontierInputV1) => {
        input.candidates[0].evaluations[0].metricSemanticBinding.dutyAppliedToMetricT00 = true;
      },
      blocker: "duty_scaled_metric_t00_forbidden",
    },
    {
      name: "bound-floor admission authority",
      mutate: (input: BuildNhm2QeiFeasibilityFrontierInputV1) => {
        input.candidates[0].evaluations[0].policyEvidence.policyOrFloorUsedAsIndependentAdmissionAuthority =
          true;
      },
      blocker: "policy_or_floor_independent_admission_authority_forbidden",
    },
    {
      name: "historical dossier row",
      mutate: (input: BuildNhm2QeiFeasibilityFrontierInputV1) => {
        input.candidates[0].evaluations[0].evidenceOrigin =
          "historical_dossier";
      },
      blocker: "historical_or_unbound_evaluation_forbidden",
    },
  ])("rejects forbidden authority: $name", ({ mutate, blocker }) => {
    const input = baseInput({
      worldlineIds: ["wall-a"],
      samplingFamilyIds: ["gaussian"],
      tauSeconds: [1e-6],
    });
    mutate(input);

    const frontier = buildNhm2QeiFeasibilityFrontier(input);

    expect(frontier.verdict).toBe("frontier_not_evaluable");
    expect(
      frontier.candidates[0].blockers.some((entry) => entry.endsWith(blocker)),
    ).toBe(true);
  });

  it("rejects unsupported or nonpositive theorem data and tau outside theorem support", () => {
    const input = baseInput({
      worldlineIds: ["wall-a"],
      samplingFamilyIds: ["gaussian"],
      tauSeconds: [1e-6],
    });
    input.theorems[0].K_Jm3_s4 = 0;
    input.theorems[0].supported = false;
    input.theorems[0].tauMinSeconds = 2e-6;

    const frontier = buildNhm2QeiFeasibilityFrontier(input);

    expect(frontier.verdict).toBe("frontier_not_evaluable");
    expect(frontier.summary.blockers).toEqual(
      expect.arrayContaining([
        "theorem:gaussian:theorem_K_nonpositive_or_invalid",
        "theorem:gaussian:theorem_not_supported",
      ]),
    );
    expect(
      frontier.candidates[0].blockers.some((entry) =>
        entry.endsWith("tau_outside_theorem_support"),
      ),
    ).toBe(true);
  });

  it("rejects unbound epochs, historical dossier admission, and missing closure readiness", () => {
    const input = baseInput({
      worldlineIds: ["wall-a"],
      samplingFamilyIds: ["gaussian"],
      tauSeconds: [1e-6],
    });
    input.provenance.historicalOrUnboundDossierUsed = true;
    input.candidates[0].evaluations[0].binding.epochId = "stale-epoch";
    input.candidates[0].readiness = {
      fullTensorReady: false,
      covariantConservationReady: false,
      continuousObserverReady: false,
    };

    const frontier = buildNhm2QeiFeasibilityFrontier(input);

    expect(frontier.verdict).toBe("frontier_not_evaluable");
    expect(frontier.candidates[0].blockers).toEqual(
      expect.arrayContaining([
        "historical_or_unbound_qei_dossier_forbidden",
        "full_tensor_not_ready",
        "covariant_conservation_not_ready",
        "continuous_observer_not_ready",
      ]),
    );
    expect(
      frontier.candidates[0].blockers.some((entry) =>
        entry.endsWith("evaluation_epoch_id_mismatch"),
      ),
    ).toBe(true);
    expect(frontier.summary.provenanceBindingsComplete).toBe(false);
  });

  it("records an observed policy floor without granting it QEI authority", () => {
    const input = baseInput({
      worldlineIds: ["wall-a"],
      samplingFamilyIds: ["gaussian"],
      tauSeconds: [1e-6],
    });
    input.candidates[0].evaluations[0].policyEvidence.boundFloorApplied = true;

    const frontier = buildNhm2QeiFeasibilityFrontier(input);

    expect(frontier.verdict).toBe("candidate_found");
    expect(frontier.candidates[0].blockers).not.toContain(
      expect.stringContaining("bound_floor"),
    );
  });

  it("recomputes the theorem bound and strict margin instead of trusting a near-boundary caller value", () => {
    const input = baseInput({
      worldlineIds: ["wall-a"],
      samplingFamilyIds: ["gaussian"],
      tauSeconds: [1e-6],
    });
    const row = input.candidates[0].evaluations[0];
    const theoremBound = boundFor(1e-6, input.theorems[0]);
    row.lhs_Jm3 = theoremBound;
    row.boundComputed_Jm3 = theoremBound * (1 + 5e-10);
    row.boundPolicy_Jm3 = theoremBound;
    row.marginRawComputed = marginFor(row.lhs_Jm3, row.boundComputed_Jm3);
    row.marginPolicy = 1;

    const frontier = buildNhm2QeiFeasibilityFrontier(input);
    const result = frontier.candidates[0].evaluations[0];

    expect(frontier.verdict).toBe("no_candidate_within_declared_domain");
    expect(result.boundComputed_Jm3).toBe(theoremBound);
    expect(result.boundComputedAuditInput.matchesTheorem).toBe(true);
    expect(result.marginRawComputed).toBe(1);
    expect(result.pass).toBe(false);
  });

  it("fails closed when submitted margins disagree with recomputed values", () => {
    const input = baseInput({
      worldlineIds: ["wall-a"],
      samplingFamilyIds: ["gaussian"],
      tauSeconds: [1e-6],
    });
    input.candidates[0].evaluations[0].marginRawComputed = 0;
    input.candidates[0].evaluations[0].marginPolicy = 0;

    const frontier = buildNhm2QeiFeasibilityFrontier(input);

    expect(frontier.verdict).toBe("frontier_not_evaluable");
    expect(frontier.candidates[0].blockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining("raw_computed_margin_input_mismatch"),
        expect.stringContaining("policy_margin_input_mismatch"),
      ]),
    );
  });

  it.each([
    "dutyAppliedToMetricT00",
    "boundFloorApplied",
    "policyOrFloorUsedAsIndependentAdmissionAuthority",
  ] as const)("rejects malformed non-boolean lock field %s", (field) => {
    const input = baseInput({
      worldlineIds: ["wall-a"],
      samplingFamilyIds: ["gaussian"],
      tauSeconds: [1e-6],
    });
    const row = input.candidates[0].evaluations[0] as unknown as Record<
      string,
      unknown
    >;
    if (field === "dutyAppliedToMetricT00") {
      (row.metricSemanticBinding as Record<string, unknown>)[field] = null;
    } else {
      (row.policyEvidence as Record<string, unknown>)[field] = "false";
    }

    const frontier = buildNhm2QeiFeasibilityFrontier(input);

    expect(frontier.verdict).toBe("frontier_not_evaluable");
  });

  it("requires run-bound raw and quadrature evidence hashes", () => {
    const input = baseInput({
      worldlineIds: ["wall-a"],
      samplingFamilyIds: ["gaussian"],
      tauSeconds: [1e-6],
    });
    input.candidates[0].evaluations[0].rawEvaluationEvidence.sha256 = "bad";
    input.candidates[0].evaluations[0].quadratureEvidence.epochId =
      "stale-epoch";

    const frontier = buildNhm2QeiFeasibilityFrontier(input);

    expect(frontier.verdict).toBe("frontier_not_evaluable");
    expect(frontier.candidates[0].blockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining("raw_evaluation_evidence_sha256_invalid"),
        expect.stringContaining("quadrature_evidence_epoch_id_mismatch"),
      ]),
    );
  });

  it("keeps the public validator total on malformed nested values", () => {
    const malformed = {
      contractVersion: "nhm2_qei_feasibility_frontier/v1",
      generatedAt: "2026-07-20T01:25:18.252Z",
      provenance: null,
      domain: null,
      theorems: [],
      candidates: [],
    };

    expect(() => isNhm2QeiFeasibilityFrontier(malformed)).not.toThrow();
    expect(isNhm2QeiFeasibilityFrontier(malformed)).toBe(false);
  });

  it("rejects tampered derived verdicts during contract validation", () => {
    const frontier = buildNhm2QeiFeasibilityFrontier(baseInput());
    const tampered = structuredClone(frontier);
    tampered.verdict = "no_candidate_within_declared_domain";

    expect(isNhm2QeiFeasibilityFrontier(tampered)).toBe(false);
  });
});
