import { describe, expect, it } from "vitest";

import {
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_EXECUTION_PLAN_ROLES,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_PHASE,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_EVIDENCE_ROLES,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_NUMERIC_CHECK_IDS,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NON_NUMERIC_CHECK_POLICY_SHA256_DOMAIN,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_ENTRY_SHA256_DOMAIN,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID,
  NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION,
  buildNhm2ExperimentReadyTheoryCandidateManifest,
  buildNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact,
  computeNhm2ExperimentReadyTheoryCandidateNonNumericCheckPolicySha256,
  computeNhm2ExperimentReadyTheoryCandidateNumericPolicyEntrySha256,
  computeNhm2ExperimentReadyTheoryCandidateNumericPolicySemanticSha256,
  isNhm2ExperimentReadyTheoryCandidateManifest,
  isNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact,
  nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest,
  sha256Nhm2CanonicalText,
  toNhm2ExperimentReadyTheoryCandidateNumericPolicySemanticPayload,
  type BuildNhm2ExperimentReadyTheoryCandidateManifestInput,
  type Nhm2ExperimentReadyTheoryCandidateBindingsV1,
  type Nhm2ExperimentReadyTheoryCandidateEvidenceRole,
  type Nhm2ExperimentReadyTheoryCandidateExecutionPlanRole,
  type Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1,
  type Nhm2ExperimentReadyTheoryCandidateHashedBindingV1,
} from "../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";
import {
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS,
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_FORMAL_V2_CHECK_IDS,
  NHM2_EXPERIMENT_READY_THEORY_CLOSURE_LEGACY_FORMAL_V1_CHECK_IDS,
} from "../shared/contracts/nhm2-experiment-ready-theory-closure.v1";

const GENERATED_AT = "2026-07-19T11:59:00.000Z";
const FROZEN_AT = "2026-07-19T12:00:00.000Z";

const hashFor = (index: number): string => index.toString(16).padStart(64, "0");

const hashedBinding = (
  artifactId: string,
  index: number,
): Nhm2ExperimentReadyTheoryCandidateHashedBindingV1 => ({
  artifactId,
  contractVersion: `${artifactId.replace(/\./g, "_")}/v1`,
  path: `artifacts/nhm2/theory-candidate/inputs/${artifactId}.json`,
  sha256: hashFor(index),
});

const executionPlan = (
  planRole: Nhm2ExperimentReadyTheoryCandidateExecutionPlanRole,
  index: number,
  bindings: Nhm2ExperimentReadyTheoryCandidateBindingsV1,
): Nhm2ExperimentReadyTheoryCandidateExecutionPlanV1 => {
  const requestId = `nhm2-${planRole}-request-v1`;
  const runId = `nhm2-${planRole}-run-v1`;
  const runtimeId = "nhm2.shift_lapse.alpha_sweep";
  const receiptId = nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
    runtimeId,
    requestId,
  );
  const npmScript = "warp:full-solve:nhm2-shift-lapse:alpha-sweep";
  const entrypoint = `npm run ${npmScript}`;
  const outputDirectory = `artifacts/nhm2/theory-candidate/runs/${runId}`;
  return {
    planRole,
    requestId,
    runId,
    receiptId,
    runtimeId,
    sourceCommitSha: (index + 10).toString(16).repeat(40).slice(0, 40),
    deterministicSeedPolicy: `frozen-seed:${planRole}`,
    solver: {
      ...hashedBinding(`nhm2.${planRole}_solver`, index + 10),
      solverId: `nhm2-${planRole}-solver`,
      solverVersion: "1.0.0",
      implementationId: `casimirbot-${planRole}-implementation-v1`,
    },
    environmentLock: {
      ...hashedBinding(`nhm2.${planRole}_environment`, index + 20),
      environmentId: `nhm2-${planRole}-environment-v1`,
    },
    expectedInvocation: {
      entrypoint,
      command: "npm",
      args: ["run", "-s", npmScript],
      cwd: ".",
      environment: [
        {
          name: "NHM2_ATLAS_SHA256",
          valueKind: "literal",
          value: bindings.atlas.sha256,
        },
        {
          name: "NHM2_CANDIDATE_ID",
          valueKind: "literal",
          value: bindings.candidate.candidateId,
        },
        {
          name: "NHM2_CANDIDATE_MANIFEST_SHA256",
          valueKind: "candidate_manifest_raw_sha256",
          value: null,
        },
        {
          name: "NHM2_CHART_ID",
          valueKind: "literal",
          value: bindings.chart.chartId,
        },
        {
          name: "NHM2_NORMALIZATION_SHA256",
          valueKind: "literal",
          value: bindings.normalization.sha256,
        },
        {
          name: "NHM2_OUTPUT_DIR",
          valueKind: "literal",
          value: outputDirectory,
        },
        { name: "NHM2_RUN_ID", valueKind: "literal", value: runId },
        {
          name: "NHM2_SELECTED_PROFILE_ID",
          valueKind: "literal",
          value: bindings.profile.selectedProfileId,
        },
        {
          name: "NHM2_UNITS_SHA256",
          valueKind: "literal",
          value: bindings.units.sha256,
        },
        {
          name: "THEORY_RUNTIME_ID",
          valueKind: "literal",
          value: runtimeId,
        },
        {
          name: "THEORY_RUNTIME_RECEIPT_ID",
          valueKind: "literal",
          value: receiptId,
        },
        {
          name: "THEORY_RUNTIME_REQUEST_ID",
          valueKind: "literal",
          value: requestId,
        },
      ],
      outputDirectory,
    },
  };
};

const planRoleForEvidence = (
  evidenceRole: Nhm2ExperimentReadyTheoryCandidateEvidenceRole,
): Nhm2ExperimentReadyTheoryCandidateExecutionPlanRole => {
  if (evidenceRole === "independent_numerical_replication") {
    return "independent_numerical";
  }
  if (evidenceRole === "formal_manifest_certificate") return "formal_kernel";
  return "primary_numerical";
};

const completeInput =
  (): BuildNhm2ExperimentReadyTheoryCandidateManifestInput => {
    const policyArtifact =
      buildNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact(
        "nhm2-alpha07-authoritative-numeric-policy-v1",
      );
    const bindings: Nhm2ExperimentReadyTheoryCandidateBindingsV1 = {
      candidate: {
        ...hashedBinding("nhm2.candidate_definition", 1),
        candidateId: "nhm2-alpha07-candidate-v1",
      },
      profile: {
        ...hashedBinding("nhm2.selected_profile", 2),
        selectedProfileId: "stage1_centerline_alpha_0p7000_candidate_v1",
      },
      chart: {
        ...hashedBinding("nhm2.chart_definition", 3),
        chartId: "nhm2-asymptotic-cartesian-v1",
      },
      atlas: {
        ...hashedBinding("nhm2.mask_atlas", 4),
        atlasId: "nhm2-alpha07-mask-atlas-v1",
      },
      units: {
        ...hashedBinding("nhm2.units_definition", 5),
        unitsId: "nhm2-si-stress-energy-v1",
      },
      normalization: {
        ...hashedBinding("nhm2.normalization_definition", 6),
        normalizationId: "nhm2-full-apparatus-normalization-v1",
      },
    };
    const executionPlans =
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_EXECUTION_PLAN_ROLES.map(
        (planRole, index) => executionPlan(planRole, index + 1, bindings),
      );
    return {
      generatedAt: GENERATED_AT,
      frozenAt: FROZEN_AT,
      manifestId: "nhm2-alpha07-experiment-ready-theory-candidate-v1",
      bindings,
      executionPlans,
      expectedEvidenceOutputs:
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_EVIDENCE_ROLES.map(
          (evidenceRole) => {
            const plan = executionPlans.find(
              (entry) => entry.planRole === planRoleForEvidence(evidenceRole),
            );
            if (plan == null) throw new Error(`No plan for ${evidenceRole}`);
            return {
              evidenceRole,
              outputPath: `${plan.expectedInvocation.outputDirectory}/evidence/${evidenceRole}.json`,
              contractVersion:
                NHM2_EXPERIMENT_READY_THEORY_CLOSURE_EVIDENCE_CONTRACT_VERSIONS[
                  evidenceRole
                ],
              requestId: plan.requestId,
              runId: plan.runId,
              receiptId: plan.receiptId,
              runtimeId: plan.runtimeId,
            };
          },
        ),
      predictionFreezeCommitment: {
        contractVersion:
          NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION,
        semanticSha256: "e".repeat(64),
        frozenAt: "2026-07-19T11:58:00.000Z",
      },
      numericCheckPolicySet: {
        artifactId:
          NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_ARTIFACT_ID,
        contractVersion:
          NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_SET_CONTRACT_VERSION,
        policySetId: policyArtifact.policySetId,
        artifactPath:
          "configs/nhm2/experiment-ready-authoritative-numeric-policy.v1.json",
        artifactRawSha256: "f".repeat(64),
        semanticSha256: policyArtifact.semanticSha256,
      },
      supersession: {
        policyId: "nhm2-theory-candidate-immutable-supersession-v1",
        policyPath: "configs/nhm2/theory-candidate-supersession.v1.json",
        policyContractVersion: "nhm2_theory_candidate_supersession/v1",
        policySha256: hashFor(60),
        originalManifestImmutable: true,
        inPlaceMutationForbidden: true,
        supersedingManifestRequiresNewManifestId: true,
        supersedingManifestRequiresPredecessorSha256: true,
        predecessorManifestId: null,
        predecessorManifestSha256: null,
      },
    };
  };

describe("NHM2 pre-run experiment-ready theory candidate manifest", () => {
  it("freezes v2 formal evidence and rejects legacy check-policy authority", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateManifest(completeInput());
    const formalOutput = artifact.expectedEvidenceOutputs.find(
      (entry) => entry.evidenceRole === "formal_manifest_certificate",
    );

    expect(formalOutput?.contractVersion).toBe(
      "nhm2_formal_manifest_certificate/v2",
    );
    for (const checkId of NHM2_EXPERIMENT_READY_THEORY_CLOSURE_FORMAL_V2_CHECK_IDS) {
      expect(
        computeNhm2ExperimentReadyTheoryCandidateNonNumericCheckPolicySha256({
          evidenceRole: "formal_manifest_certificate",
          checkId,
        }),
      ).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(() =>
      computeNhm2ExperimentReadyTheoryCandidateNonNumericCheckPolicySha256({
        evidenceRole: "formal_manifest_certificate",
        checkId:
          NHM2_EXPERIMENT_READY_THEORY_CLOSURE_LEGACY_FORMAL_V1_CHECK_IDS[0],
      }),
    ).toThrow(/Expected a non-numeric required check/);
  });

  it("builds and validates the detached authoritative numeric policy artifact", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact(
        "nhm2-alpha07-policy-v1",
      );

    expect(
      isNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact(artifact),
    ).toBe(true);
    expect(artifact.policies).toHaveLength(
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_REQUIRED_NUMERIC_CHECK_IDS.length,
    );
    expect(
      artifact.policies.find(
        (entry) => entry.checkId === "support_retention_overlap_lower95_gt_one",
      ),
    ).toMatchObject({ comparator: "gt", threshold: 1, unit: "1" });
    expect(
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_AUTHORITATIVE_NUMERIC_POLICIES.support_retention_overlap_lower95_gt_one,
    ).toEqual({ comparator: "gt", threshold: 1, unit: "1" });
  });

  it("computes the semantic digest from a detached payload that excludes the digest field", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact(
        "nhm2-alpha07-policy-v1",
      );
    const payload =
      toNhm2ExperimentReadyTheoryCandidateNumericPolicySemanticPayload(
        artifact,
      );

    expect("semanticSha256" in payload).toBe(false);
    expect(
      computeNhm2ExperimentReadyTheoryCandidateNumericPolicySemanticSha256(
        payload,
      ),
    ).toBe(artifact.semanticSha256);
  });

  it("domain-separates and canonically orders each exact numeric policy-entry digest", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact(
        "nhm2-alpha07-policy-v1",
      );
    const supportPolicy = artifact.policies.find(
      (entry) => entry.checkId === "support_retention_overlap_lower95_gt_one",
    )!;
    const pullInPolicy = artifact.policies.find(
      (entry) =>
        entry.checkId === "pull_in_buckling_contact_stiction_margins_positive",
    )!;
    const expected = sha256Nhm2CanonicalText(
      `${NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NUMERIC_POLICY_ENTRY_SHA256_DOMAIN}\0${JSON.stringify(
        [
          supportPolicy.checkId,
          supportPolicy.evidenceRole,
          supportPolicy.comparator,
          "1",
          supportPolicy.unit,
        ],
      )}`,
    );

    expect(
      computeNhm2ExperimentReadyTheoryCandidateNumericPolicyEntrySha256(
        supportPolicy,
      ),
    ).toBe(expected);
    expect(
      computeNhm2ExperimentReadyTheoryCandidateNumericPolicyEntrySha256(
        pullInPolicy,
      ),
    ).not.toBe(expected);
    expect(expected).not.toBe(artifact.semanticSha256);
  });

  it("gives every non-numeric required check a deterministic qualitative-policy digest", () => {
    const expected = sha256Nhm2CanonicalText(
      `${NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_NON_NUMERIC_CHECK_POLICY_SHA256_DOMAIN}\0${JSON.stringify(
        [
          "full_apparatus_source_tensor",
          "nhm2_full_apparatus_source_tensor/v1",
          "all_ten_components_computed",
          "required_boolean_pass",
        ],
      )}`,
    );

    expect(
      computeNhm2ExperimentReadyTheoryCandidateNonNumericCheckPolicySha256({
        evidenceRole: "full_apparatus_source_tensor",
        checkId: "all_ten_components_computed",
      }),
    ).toBe(expected);
    expect(() =>
      computeNhm2ExperimentReadyTheoryCandidateNonNumericCheckPolicySha256({
        evidenceRole: "full_apparatus_source_tensor",
        checkId: "nondegenerate_metric_signal_above_numerical_floor",
      }),
    ).toThrow("Expected a non-numeric required check");
  });

  it("accepts a complete frozen pre-run hash DAG without post-run data", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateManifest(completeInput());

    expect(artifact.phase).toBe(
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_MANIFEST_PHASE,
    );
    expect(artifact.readiness).toMatchObject({
      status: "pre_run_manifest_ready",
      preRunManifestReady: true,
      blockerCount: 0,
      policySemanticDigestBound: true,
      predictionFreezeSemanticDigestBound: true,
      diagnosticSufficiencyPolicyFrozen: true,
    });
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(artifact)).toBe(true);
  });

  it("freezes diagnostic sampling and horizon sufficiency without granting physical authority", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateManifest(completeInput());

    expect(artifact.diagnosticSufficiencyPreregistration).toEqual(
      NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_DIAGNOSTIC_SUFFICIENCY_POLICY,
    );
    expect(artifact.diagnosticSufficiencyPreregistration).toMatchObject({
      frozenInCandidateManifest: true,
      diagnosticOnly: true,
      physicalProofAuthority: false,
      continuousObserver: {
        minimumSpatialSamples: 64,
        minimumNullDirectionsPerSpatialSample: 128,
        minimumResolutionLevels: 3,
        minimumObservedConvergenceOrder: 1,
      },
      worldlineQei: {
        minimumSamplingFunctionFamilies: 2,
        minimumWorldlinesPerRegionAndFamily: 4,
        minimumSamplesPerWorldline: 64,
        minimumRefinementLevels: 3,
        minimumObservedConvergenceOrder: 1,
      },
      dynamics: {
        minimumEvolutionSamples: 16,
        minimumSwitchingPeriods: 3,
        minimumLightCrossingTimes: 3,
        minimumControlCycles: 3,
      },
    });

    const tampered = structuredClone(artifact) as unknown as Record<
      string,
      unknown
    >;
    const policy = tampered.diagnosticSufficiencyPreregistration as Record<
      string,
      unknown
    >;
    const observer = policy.continuousObserver as Record<string, unknown>;
    observer.minimumSpatialSamples = 1;
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(tampered)).toBe(false);
  });

  it("requires an exact pre-run prediction semantic commitment", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateManifest(completeInput());
    expect(artifact.predictionFreezeCommitment).toEqual({
      contractVersion:
        NHM2_EXPERIMENT_READY_THEORY_CANDIDATE_PREDICTION_FREEZE_CONTRACT_VERSION,
      semanticSha256: "e".repeat(64),
      frozenAt: "2026-07-19T11:58:00.000Z",
    });

    const invalidInput = completeInput();
    invalidInput.predictionFreezeCommitment.semanticSha256 = "not-a-digest";
    const invalid =
      buildNhm2ExperimentReadyTheoryCandidateManifest(invalidInput);
    expect(invalid.readiness.blockers).toContain(
      "prediction_freeze_semantic_sha256_invalid",
    );
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(invalid)).toBe(false);

    const postdatedInput = completeInput();
    postdatedInput.predictionFreezeCommitment.frozenAt =
      "2026-07-19T12:00:01.000Z";
    const postdated =
      buildNhm2ExperimentReadyTheoryCandidateManifest(postdatedInput);
    expect(postdated.readiness.blockers).toContain(
      "prediction_freeze_postdates_candidate_manifest_freeze",
    );
  });

  it("rejects forward receipt/output hashes shadowing the prediction commitment", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateManifest(completeInput());
    const shadow = artifact.predictionFreezeCommitment as unknown as Record<
      string,
      unknown
    >;
    shadow.receiptSha256 = "1".repeat(64);
    shadow.outputManifestSha256 = "2".repeat(64);

    expect(isNhm2ExperimentReadyTheoryCandidateManifest(artifact)).toBe(false);
  });

  it("contains preallocated identities and exact invocation bindings for every run", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateManifest(completeInput());

    expect(artifact.executionPlans).toHaveLength(3);
    for (const plan of artifact.executionPlans) {
      expect(plan.expectedInvocation.entrypoint).toBe(
        "npm run warp:full-solve:nhm2-shift-lapse:alpha-sweep",
      );
      expect(plan.expectedInvocation).toMatchObject({
        command: "npm",
        args: ["run", "-s", "warp:full-solve:nhm2-shift-lapse:alpha-sweep"],
        cwd: ".",
      });
      expect(plan.expectedInvocation.args).not.toContain(
        plan.expectedInvocation.entrypoint,
      );
      const environment = Object.fromEntries(
        plan.expectedInvocation.environment.map((entry) => [entry.name, entry]),
      );
      expect(environment.THEORY_RUNTIME_REQUEST_ID.value).toBe(plan.requestId);
      expect(environment.THEORY_RUNTIME_RECEIPT_ID.value).toBe(plan.receiptId);
      expect(environment.THEORY_RUNTIME_ID.value).toBe(plan.runtimeId);
      expect(environment.NHM2_RUN_ID.value).toBe(plan.runId);
      expect(environment.NHM2_OUTPUT_DIR.value).toBe(
        plan.expectedInvocation.outputDirectory,
      );
      expect(environment.NHM2_CANDIDATE_MANIFEST_SHA256).toEqual({
        name: "NHM2_CANDIDATE_MANIFEST_SHA256",
        valueKind: "candidate_manifest_raw_sha256",
        value: null,
      });
    }
  });

  it("does not place receipt hashes, receipt paths, output hashes, or completion timing in the pre-run manifest", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateManifest(completeInput());
    const firstPlan = artifact.executionPlans[0] as unknown as Record<
      string,
      unknown
    >;
    const firstOutput = artifact
      .expectedEvidenceOutputs[0] as unknown as Record<string, unknown>;

    expect(firstPlan).not.toHaveProperty("receiptPath");
    expect(firstPlan).not.toHaveProperty("receiptSha256");
    expect(firstPlan).not.toHaveProperty("startedAt");
    expect(firstPlan).not.toHaveProperty("completedAt");
    expect(firstOutput).not.toHaveProperty("sha256");
    expect(firstOutput).not.toHaveProperty("receiptPath");
    expect(firstOutput).not.toHaveProperty("receiptSha256");
  });

  it("stores distinct raw-artifact and semantic policy hashes", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateManifest(completeInput());

    expect(artifact.numericCheckPolicySet.artifactRawSha256).not.toBe(
      artifact.numericCheckPolicySet.semanticSha256,
    );
  });

  it("rejects a missing execution plan", () => {
    const input = completeInput();
    input.executionPlans = input.executionPlans?.slice(1);
    const artifact = buildNhm2ExperimentReadyTheoryCandidateManifest(input);

    expect(artifact.readiness.blockers).toContain(
      "execution_plan_missing:primary_numerical",
    );
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(artifact)).toBe(false);
  });

  it("rejects a missing or duplicate expected evidence role", () => {
    const missingInput = completeInput();
    missingInput.expectedEvidenceOutputs =
      missingInput.expectedEvidenceOutputs?.slice(1);
    const missing =
      buildNhm2ExperimentReadyTheoryCandidateManifest(missingInput);
    expect(
      missing.readiness.blockers.some((entry) =>
        entry.startsWith("evidence_output_missing:"),
      ),
    ).toBe(true);
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(missing)).toBe(false);

    const duplicateInput = completeInput();
    duplicateInput.expectedEvidenceOutputs = [
      ...(duplicateInput.expectedEvidenceOutputs ?? []),
      { ...(duplicateInput.expectedEvidenceOutputs ?? [])[0] },
    ];
    const duplicate =
      buildNhm2ExperimentReadyTheoryCandidateManifest(duplicateInput);
    expect(duplicate.readiness.blockers).toContain(
      "evidence_output_roles_duplicated",
    );
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(duplicate)).toBe(false);
  });

  it("rejects duplicate expected output paths", () => {
    const input = completeInput();
    const outputs = input.expectedEvidenceOutputs ?? [];
    outputs[1].outputPath = outputs[0].outputPath;
    const artifact = buildNhm2ExperimentReadyTheoryCandidateManifest(input);

    expect(artifact.readiness.blockers).toContain(
      "evidence_output_paths_duplicated",
    );
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(artifact)).toBe(false);
  });

  it("rejects output-side SHA or receipt-path fields as unknown post-run shadows", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateManifest(completeInput());
    const output = artifact.expectedEvidenceOutputs[0] as unknown as Record<
      string,
      unknown
    >;
    output.sha256 = "a".repeat(64);
    output.receiptPath = "artifacts/receipt.json";

    expect(isNhm2ExperimentReadyTheoryCandidateManifest(artifact)).toBe(false);
  });

  it("rejects an invocation that does not bind its preallocated run identity", () => {
    const input = completeInput();
    const plan = (input.executionPlans ?? [])[0];
    plan.expectedInvocation.environment =
      plan.expectedInvocation.environment.filter(
        (entry) => entry.name !== "NHM2_RUN_ID",
      );
    const artifact = buildNhm2ExperimentReadyTheoryCandidateManifest(input);

    expect(artifact.readiness.blockers).toContain(
      "execution:primary_numerical:invocation_nhm2_run_id_unbound",
    );
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(artifact)).toBe(false);
  });

  it("rejects evidence output identities that do not match their execution plan", () => {
    const input = completeInput();
    const output = (input.expectedEvidenceOutputs ?? [])[0];
    output.receiptId = "wrong-receipt-id";
    const artifact = buildNhm2ExperimentReadyTheoryCandidateManifest(input);

    expect(artifact.readiness.blockers).toContain(
      `evidence_output:${output.evidenceRole}:receiptId_mismatch`,
    );
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(artifact)).toBe(false);
  });

  it("rejects post-freeze manifest generation and defers actual start-time comparison to the evaluator", () => {
    const input = completeInput();
    input.generatedAt = "2026-07-19T12:00:01.000Z";
    const artifact = buildNhm2ExperimentReadyTheoryCandidateManifest(input);

    expect(artifact.readiness.blockers).toContain(
      "manifest_generated_after_freeze",
    );
    expect(
      artifact.claimBoundary.evaluatorMustVerifyFrozenAtBeforeExecutionStart,
    ).toBe(true);
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(artifact)).toBe(false);
  });

  it("rejects a changed authoritative policy even when its semantic digest is recomputed", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact(
        "nhm2-alpha07-policy-v1",
      );
    const support = artifact.policies.find(
      (entry) => entry.checkId === "support_retention_overlap_lower95_gt_one",
    );
    if (support == null) throw new Error("support-retention policy missing");
    support.threshold = 0.459;
    artifact.semanticSha256 =
      computeNhm2ExperimentReadyTheoryCandidateNumericPolicySemanticSha256(
        toNhm2ExperimentReadyTheoryCandidateNumericPolicySemanticPayload(
          artifact,
        ),
      );

    expect(
      isNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact(artifact),
    ).toBe(false);
  });

  it("rejects a policy artifact with a missing numeric check", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact(
        "nhm2-alpha07-policy-v1",
      );
    artifact.policies = artifact.policies.slice(1);
    artifact.semanticSha256 =
      computeNhm2ExperimentReadyTheoryCandidateNumericPolicySemanticSha256(
        toNhm2ExperimentReadyTheoryCandidateNumericPolicySemanticPayload(
          artifact,
        ),
      );

    expect(
      isNhm2ExperimentReadyTheoryCandidateNumericPolicySetArtifact(artifact),
    ).toBe(false);
  });

  it("rejects caller authority spoofing and nested unknown fields", () => {
    const artifact = buildNhm2ExperimentReadyTheoryCandidateManifest(
      completeInput(),
    ) as unknown as Record<string, unknown>;
    artifact.pass = true;
    artifact.status = "experiment_ready_theory_closed";
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(artifact)).toBe(false);

    const nested =
      buildNhm2ExperimentReadyTheoryCandidateManifest(completeInput());
    const plan = nested.executionPlans[0] as unknown as Record<string, unknown>;
    plan.physicalViabilityClaimAllowed = true;
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(nested)).toBe(false);
  });

  it("rejects derived-readiness and claim-lock tampering", () => {
    const readinessTamper =
      buildNhm2ExperimentReadyTheoryCandidateManifest(completeInput());
    readinessTamper.readiness.blockerCount = 1;
    readinessTamper.readiness.blockers = ["caller_override"];
    readinessTamper.readiness.firstBlocker = "caller_override";
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(readinessTamper)).toBe(
      false,
    );

    const claimTamper =
      buildNhm2ExperimentReadyTheoryCandidateManifest(completeInput());
    claimTamper.claimBoundary.physicalViabilityClaimAllowed = false as never;
    const claims = claimTamper.claimBoundary as unknown as Record<
      string,
      unknown
    >;
    claims.physicalViabilityClaimAllowed = true;
    claims.transportClaimAllowed = true;
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(claimTamper)).toBe(
      false,
    );
  });

  it("keeps all physical and operational claims hard-false", () => {
    const artifact =
      buildNhm2ExperimentReadyTheoryCandidateManifest(completeInput());

    expect(artifact.claimBoundary).toMatchObject({
      preRunManifestOnly: true,
      postRunTimingAndArtifactHashesForbiddenHere: true,
      experimentReadyTheoryClosureClaimAllowed: false,
      physicalViabilityStatus: "blocked_pending_empirical_receipts",
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    });
  });

  it("rejects mutable paths and non-split policy digests", () => {
    const mutableInput = completeInput();
    mutableInput.bindings.atlas.path = "artifacts/nhm2/latest/atlas.json";
    const mutable =
      buildNhm2ExperimentReadyTheoryCandidateManifest(mutableInput);
    expect(mutable.readiness.blockers).toContain("atlas_path_not_pinned");
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(mutable)).toBe(false);

    const digestInput = completeInput();
    digestInput.numericCheckPolicySet.artifactRawSha256 =
      digestInput.numericCheckPolicySet.semanticSha256;
    const digest = buildNhm2ExperimentReadyTheoryCandidateManifest(digestInput);
    expect(digest.readiness.blockers).toContain(
      "numeric_policy_raw_and_semantic_sha256_not_split",
    );
    expect(isNhm2ExperimentReadyTheoryCandidateManifest(digest)).toBe(false);
  });
});
