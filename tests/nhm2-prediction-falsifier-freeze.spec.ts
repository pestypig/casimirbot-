import { describe, expect, it } from "vitest";

import { buildNhm2ExperimentFacingTheoryRoadmap } from "../shared/contracts/nhm2-experiment-facing-theory-roadmap.v1";
import {
  NHM2_PREDICTION_FREEZE_REQUIRED_FALSIFIER_IDS,
  NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS,
  NHM2_PREDICTION_FREEZE_REQUIRED_RECEIPT_IDS,
  type BuildNhm2PredictionFalsifierFreezeInput,
  type Nhm2PredictionFreezeHashedArtifactRefV1,
  buildNhm2PredictionFalsifierFreeze,
  computeNhm2PredictionFreezeScientificSemanticSha256,
  isNhm2PredictionFalsifierFreeze,
  toNhm2PredictionFreezeScientificPayload,
} from "../shared/contracts/nhm2-prediction-falsifier-freeze.v1";
import { nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest } from "../shared/contracts/nhm2-experiment-ready-theory-candidate-manifest.v1";

const hashedRef = (
  artifactId: string,
  hashCharacter = "a",
): Nhm2PredictionFreezeHashedArtifactRefV1 => ({
  artifactId,
  path: `artifacts/research/full-solve/prediction-freeze/freeze-001/${artifactId}.json`,
  schemaVersion: `${artifactId}/v1`,
  sha256: hashCharacter.repeat(64),
});

const makeInput = (): BuildNhm2PredictionFalsifierFreezeInput => {
  const observableIds = [...NHM2_PREDICTION_FREEZE_REQUIRED_OBSERVABLE_IDS];
  const modelId = "nhm2-alpha-0p7-apparatus-model-v1";
  const uncertaintyBudgetRef = hashedRef("nhm2-uncertainty-budget", "a");
  const nullControlPlanRef = hashedRef("nhm2-null-control-plan", "c");
  const freezeManifestRef = hashedRef("nhm2-prediction-freeze-manifest", "6");
  const runtimeId = "nhm2.shift_lapse.alpha_sweep";
  const requestId = "nhm2-prediction-freeze-request-001";
  return {
    generatedAt: "2026-07-19T12:00:00.000Z",
    frozenAt: "2026-07-19T11:59:00.000Z",
    dataCollectionOpensAt: "2026-07-19T13:00:00.000Z",
    selectedProfileId:
      "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1",
    freezeId: "nhm2-prediction-freeze-001",
    registrationBinding: {
      candidateId: "nhm2-alpha07-candidate-v1",
      candidateManifestPath:
        "artifacts/nhm2/theory-candidate/candidate-manifest.v1.json",
      candidateManifestSha256: "7".repeat(64),
      runId: "nhm2-primary-numerical-run-v1",
      requestId,
      receiptId: nhm2ExperimentReadyTheoryCandidateReceiptIdForRequest(
        runtimeId,
        requestId,
      ),
      runtimeId,
      plannedOutputDirectory:
        "artifacts/nhm2/theory-candidate/runs/nhm2-primary-numerical-run-v1",
    },
    model: {
      modelId,
      modelVersion: "1.0.0",
      solverId: "nhm2-coupled-apparatus-solver",
      solverVersion: "2026.07.19",
      sourceCommitSha: "1".repeat(40),
      definitionRef: hashedRef("nhm2-model-definition", "1"),
      inputManifestRef: hashedRef("nhm2-model-input-manifest", "2"),
    },
    parameterSet: {
      parameterSetId: "nhm2-apparatus-parameter-set-001",
      parameterCount: 48,
      manifestRef: hashedRef("nhm2-parameter-manifest", "3"),
    },
    observables: observableIds.map((observableId, index) => ({
      observableId,
      definition: `Frozen operational definition for ${observableId}`,
      unit: observableId === "delta_F" ? "N" : "SI",
      expectedSignOrPhase: `frozen sign and phase rule ${index + 1}`,
      analysisWindow: "pre-registered acquisition window 0",
      uncertaintyBudgetId: "nhm2-uncertainty-budget-001",
      predictionRef: hashedRef(
        `prediction-${observableId}`,
        String((index + 4) % 10),
      ),
    })),
    uncertaintyBudget: {
      uncertaintyBudgetId: "nhm2-uncertainty-budget-001",
      method: "joint covariance propagation with frozen nuisance priors",
      coverageProbability: 0.95,
      sourceIds: [
        "material_response",
        "geometry",
        "readout_noise",
        "thermal_drift",
      ],
      observableIds,
      budgetRef: uncertaintyBudgetRef,
      covarianceRef: hashedRef("nhm2-uncertainty-covariance", "b"),
    },
    nullControlPlan: {
      controls: [
        {
          controlId: "dummy-and-phase-scramble-control",
          targetObservableIds: observableIds,
          intervention:
            "replace active stack with matched dummy and scramble drive phase",
          expectedOutcome:
            "all registered responses remain within the frozen null distribution",
          rejectionRule:
            "reject the candidate if the dummy reproduces the active response",
        },
      ],
      planRef: nullControlPlanRef,
    },
    blindingPlan: {
      blindedFieldIds: ["sample_identity", "drive_phase", "active_dummy_label"],
      unblindingTrigger:
        "analysis artifact hash and decision ledger are locked",
      keyCustodianRole: "independent-key-custodian",
      analysisRole: "blind-analysis-team",
      experimentRole: "apparatus-operations-team",
      planRef: hashedRef("nhm2-blinding-plan", "d"),
    },
    decisionPlan: {
      multiplicityMethod: "Holm familywise-error correction",
      familywiseAlpha: 0.05,
      rules: [
        {
          ruleId: "tensor-and-phase-rule",
          targetObservableIds: ["DeltaTmunu_xt", "delta_phi_f"],
          statistic: "joint signed phase likelihood ratio",
          comparator: "gte",
          thresholdLower: 5,
          thresholdUpper: null,
          unit: "sigma-equivalent",
          falsifierId: "observable_sign_or_phase_not_pre_registered",
          nullDisposition: "retain null bound",
          signalDisposition: "evaluate frozen sign and phase prediction",
        },
        {
          ruleId: "clock-and-force-rule",
          targetObservableIds: ["delta_tau", "delta_F"],
          statistic: "joint clock-force likelihood ratio",
          comparator: "gte",
          thresholdLower: 5,
          thresholdUpper: null,
          unit: "sigma-equivalent",
          falsifierId: "null_controls_missing",
          nullDisposition: "retain null bound",
          signalDisposition: "evaluate active-versus-dummy separation",
        },
        {
          ruleId: "metric-and-curvature-rule",
          targetObservableIds: ["h00_proxy", "R_0i0j"],
          statistic: "invariant multi-probe likelihood ratio",
          comparator: "gte",
          thresholdLower: 5,
          thresholdUpper: null,
          unit: "sigma-equivalent",
          falsifierId: "prediction_changed_after_data_collection",
          nullDisposition: "retain null bound",
          signalDisposition: "evaluate frozen invariant response model",
        },
      ],
      planRef: hashedRef("nhm2-decision-plan", "e"),
    },
    falsifierRegistry: {
      falsifiers: [
        {
          falsifierId: "prediction_changed_after_data_collection",
          frozenModelId: modelId,
          targetObservableIds: ["h00_proxy", "R_0i0j"],
          trigger:
            "a prediction or analysis rule changes after the data boundary",
          consequence:
            "the changed analysis is exploratory and this freeze cannot support it",
        },
        {
          falsifierId: "observable_sign_or_phase_not_pre_registered",
          frozenModelId: modelId,
          targetObservableIds: ["DeltaTmunu_xt", "delta_phi_f"],
          trigger:
            "the observed sign or phase falls outside the frozen prediction",
          consequence: "falsify the frozen sign-or-phase realization",
        },
        {
          falsifierId: "null_controls_missing",
          frozenModelId: modelId,
          targetObservableIds: ["delta_tau", "delta_F"],
          trigger:
            "a required null control is absent or reproduces the active response",
          consequence: "block interpretation and retain only the null bound",
        },
      ],
      registryRef: hashedRef("nhm2-falsifier-registry", "f"),
    },
    registrationReceipts: [
      {
        receiptId: "pre_registered_prediction_receipt",
        freezeId: "nhm2-prediction-freeze-001",
        selectedProfileId:
          "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1",
        modelId,
        registeredAt: "2026-07-19T12:00:00.000Z",
        issuerId: "independent-preregistration-officer",
        appendOnlyRegistryId: "nhm2-preregistry-v1",
        dataBoundary: "pre_data",
        subjectRef: freezeManifestRef,
        registryEntryRef: hashedRef("preregistry-prediction-entry", "7"),
        signatureRef: hashedRef("preregistry-prediction-signature", "8"),
        timestampAuthorityRef: hashedRef(
          "preregistry-prediction-timestamp",
          "9",
        ),
      },
      {
        receiptId: "uncertainty_budget_receipt",
        freezeId: "nhm2-prediction-freeze-001",
        selectedProfileId:
          "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1",
        modelId,
        registeredAt: "2026-07-19T12:00:00.000Z",
        issuerId: "independent-preregistration-officer",
        appendOnlyRegistryId: "nhm2-preregistry-v1",
        dataBoundary: "pre_data",
        subjectRef: uncertaintyBudgetRef,
        registryEntryRef: hashedRef("preregistry-uncertainty-entry", "1"),
        signatureRef: hashedRef("preregistry-uncertainty-signature", "2"),
        timestampAuthorityRef: hashedRef(
          "preregistry-uncertainty-timestamp",
          "3",
        ),
      },
      {
        receiptId: "null_control_plan_receipt",
        freezeId: "nhm2-prediction-freeze-001",
        selectedProfileId:
          "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1",
        modelId,
        registeredAt: "2026-07-19T12:00:00.000Z",
        issuerId: "independent-preregistration-officer",
        appendOnlyRegistryId: "nhm2-preregistry-v1",
        dataBoundary: "pre_data",
        subjectRef: nullControlPlanRef,
        registryEntryRef: hashedRef("preregistry-null-entry", "4"),
        signatureRef: hashedRef("preregistry-null-signature", "5"),
        timestampAuthorityRef: hashedRef("preregistry-null-timestamp", "6"),
      },
    ],
    analysisCode: {
      repository: "casimirbot/NHM2",
      sourceCommitSha: "2".repeat(40),
      entrypoint: "tools/nhm2/analyze-frozen-experiment.ts",
      deterministicSeedPolicy:
        "seed is derived from the sealed freeze manifest hash",
      sourceTreeRef: hashedRef("nhm2-analysis-source-tree", "1"),
      dependencyLockRef: hashedRef("nhm2-analysis-dependency-lock", "2"),
      environmentRef: hashedRef("nhm2-analysis-environment", "3"),
      protocolRef: hashedRef("nhm2-analysis-protocol", "4"),
    },
    supersessionPolicy: {
      policyId: "nhm2-freeze-supersession-policy-v1",
      policyRef: hashedRef("nhm2-freeze-supersession-policy", "5"),
    },
    freezeManifestRef,
  };
};

describe("NHM2 immutable prediction/falsifier freeze v1", () => {
  it("derives a canonical scientific digest that excludes the run-registration envelope", () => {
    const artifact = buildNhm2PredictionFalsifierFreeze(makeInput());
    const payload = toNhm2PredictionFreezeScientificPayload(artifact);
    const changedEnvelope = makeInput();
    changedEnvelope.registrationBinding.candidateManifestSha256 = "8".repeat(
      64,
    );
    changedEnvelope.registrationBinding.runId = "a-different-preallocated-run";
    const rebound = buildNhm2PredictionFalsifierFreeze(changedEnvelope);
    const changedScience = makeInput();
    changedScience.observables[0].expectedSignOrPhase = "opposite frozen sign";
    const scientificallyChanged =
      buildNhm2PredictionFalsifierFreeze(changedScience);

    expect("semanticSha256" in payload).toBe(false);
    expect("registrationBinding" in payload).toBe(false);
    expect("registrationReceipts" in payload).toBe(false);
    expect("freezeManifestRef" in payload).toBe(false);
    expect(computeNhm2PredictionFreezeScientificSemanticSha256(payload)).toBe(
      artifact.semanticSha256,
    );
    expect(rebound.semanticSha256).toBe(artifact.semanticSha256);
    expect(scientificallyChanged.semanticSha256).not.toBe(
      artifact.semanticSha256,
    );
  });

  it("derives readiness from a complete immutable freeze and matches the roadmap", () => {
    const artifact = buildNhm2PredictionFalsifierFreeze(makeInput());
    const roadmapStage = buildNhm2ExperimentFacingTheoryRoadmap({
      generatedAt: "2026-07-19T12:00:00.000Z",
    }).stages.find((stage) => stage.stageId === "prediction_freeze");

    expect(isNhm2PredictionFalsifierFreeze(artifact)).toBe(true);
    expect(artifact.readiness).toEqual({
      predictionFreezeReady: true,
      blockerCount: 0,
      firstBlocker: "none",
      blockers: [],
    });
    expect(artifact.roadmapBinding.requiredObservableIds).toEqual(
      roadmapStage?.requiredObservables,
    );
    expect(artifact.roadmapBinding.requiredReceiptIds).toEqual(
      roadmapStage?.requiredReceipts,
    );
    expect(artifact.roadmapBinding.requiredFalsifierIds).toEqual(
      roadmapStage?.falsifiers,
    );
    expect(artifact.roadmapBinding.requiredReceiptIds).toEqual([
      ...NHM2_PREDICTION_FREEZE_REQUIRED_RECEIPT_IDS,
    ]);
    expect(artifact.roadmapBinding.requiredFalsifierIds).toEqual([
      ...NHM2_PREDICTION_FREEZE_REQUIRED_FALSIFIER_IDS,
    ]);
    expect(artifact.supersessionPolicy).toMatchObject({
      originalFreezeImmutable: true,
      supersedingFreezeRequiresNewFreezeId: true,
      postDataChangesExploratoryOnly: true,
    });
    expect(artifact.claimBoundary).toMatchObject({
      diagnosticOnly: true,
      predictionFreezeOnly: true,
      predictionFreezeCannotAloneEstablishTheoryClosure: true,
      predictionFreezeCannotSubstituteForExperimentalEvidence: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
      routeEtaClaimAllowed: false,
      speedAuthorityClaimAllowed: false,
    });
  });

  it.each([
    [
      "model definition",
      (input: BuildNhm2PredictionFalsifierFreezeInput) => {
        input.model.definitionRef = null;
      },
      "model_definition_unhashed_or_mutable",
    ],
    [
      "parameter manifest",
      (input: BuildNhm2PredictionFalsifierFreezeInput) => {
        input.parameterSet.manifestRef = null;
      },
      "parameter_manifest_unhashed_or_mutable",
    ],
    [
      "observable prediction",
      (input: BuildNhm2PredictionFalsifierFreezeInput) => {
        input.observables[0].predictionRef = null;
      },
      "observable_prediction_unhashed_or_mutable:DeltaTmunu_xt",
    ],
    [
      "uncertainty covariance",
      (input: BuildNhm2PredictionFalsifierFreezeInput) => {
        input.uncertaintyBudget.covarianceRef = null;
      },
      "uncertainty_covariance_unhashed_or_mutable",
    ],
    [
      "null-control plan",
      (input: BuildNhm2PredictionFalsifierFreezeInput) => {
        input.nullControlPlan.planRef = null;
      },
      "null_control_plan_unhashed_or_mutable",
    ],
    [
      "blinding plan",
      (input: BuildNhm2PredictionFalsifierFreezeInput) => {
        input.blindingPlan.planRef = null;
      },
      "blinding_plan_unhashed_or_mutable",
    ],
    [
      "decision plan",
      (input: BuildNhm2PredictionFalsifierFreezeInput) => {
        input.decisionPlan.planRef = null;
      },
      "decision_plan_unhashed_or_mutable",
    ],
    [
      "falsifier registry",
      (input: BuildNhm2PredictionFalsifierFreezeInput) => {
        input.falsifierRegistry.registryRef = null;
      },
      "falsifier_registry_unhashed_or_mutable",
    ],
    [
      "analysis environment",
      (input: BuildNhm2PredictionFalsifierFreezeInput) => {
        input.analysisCode.environmentRef = null;
      },
      "analysis_environment_unhashed_or_mutable",
    ],
    [
      "supersession policy",
      (input: BuildNhm2PredictionFalsifierFreezeInput) => {
        input.supersessionPolicy.policyRef = null;
      },
      "supersession_policy_unhashed_or_mutable",
    ],
    [
      "freeze manifest",
      (input: BuildNhm2PredictionFalsifierFreezeInput) => {
        input.freezeManifestRef = null;
      },
      "freeze_manifest_unhashed_or_mutable",
    ],
  ] as const)(
    "blocks readiness when the %s is not hash-bound",
    (_label, mutate, blocker) => {
      const input = makeInput();
      mutate(input);
      const artifact = buildNhm2PredictionFalsifierFreeze(input);

      expect(isNhm2PredictionFalsifierFreeze(artifact)).toBe(true);
      expect(artifact.readiness.predictionFreezeReady).toBe(false);
      expect(artifact.readiness.blockers).toContain(blocker);
    },
  );

  it("requires complete observable, null-control, decision, uncertainty, and falsifier coverage", () => {
    const input = makeInput();
    input.observables = input.observables.slice(1);
    input.uncertaintyBudget.observableIds =
      input.uncertaintyBudget.observableIds.slice(1);
    input.nullControlPlan.controls[0].targetObservableIds = ["delta_phi_f"];
    input.decisionPlan.rules = input.decisionPlan.rules.slice(1);
    input.falsifierRegistry.falsifiers =
      input.falsifierRegistry.falsifiers.slice(1);

    const artifact = buildNhm2PredictionFalsifierFreeze(input);

    expect(artifact.readiness.predictionFreezeReady).toBe(false);
    expect(artifact.readiness.blockers).toEqual(
      expect.arrayContaining([
        "required_observable_set_incomplete_or_duplicated",
        "uncertainty_budget_observable_coverage_incomplete",
        "null_control_observable_coverage_incomplete",
        "decision_rule_observable_coverage_incomplete",
        "roadmap_falsifier_missing:prediction_changed_after_data_collection",
        "falsifier_observable_coverage_incomplete",
      ]),
    );
  });

  it("requires independently registered pre-data receipts bound to the frozen subjects", () => {
    const input = makeInput();
    input.registrationReceipts = input.registrationReceipts.slice(1);
    const missing = buildNhm2PredictionFalsifierFreeze(input);

    expect(missing.readiness.predictionFreezeReady).toBe(false);
    expect(missing.readiness.blockers).toContain(
      "required_registration_receipts_missing_or_duplicated",
    );

    const mismatchedInput = makeInput();
    mismatchedInput.registrationReceipts[0].subjectRef = hashedRef(
      "wrong-subject",
      "0",
    );
    const mismatched = buildNhm2PredictionFalsifierFreeze(mismatchedInput);
    expect(mismatched.readiness.blockers).toContain(
      "registration_receipt_subject_mismatch:pre_registered_prediction_receipt",
    );
  });

  it("requires comparator-appropriate interval thresholds and exact falsifier coverage", () => {
    const input = makeInput();
    input.decisionPlan.rules[0].thresholdUpper = 6;
    input.decisionPlan.rules[1].targetObservableIds = ["delta_tau"];
    const artifact = buildNhm2PredictionFalsifierFreeze(input);

    expect(artifact.readiness.blockers).toEqual(
      expect.arrayContaining([
        "decision_rule_threshold_invalid:tensor-and-phase-rule",
        "decision_rule_falsifier_observable_mismatch:clock-and-force-rule",
      ]),
    );
  });

  it("ignores caller authority spoofing and rejects tampered serialized readiness", () => {
    const input = makeInput();
    input.freezeManifestRef = null;
    const spoofedInput = {
      ...input,
      status: "pass",
      pass: true,
      ready: true,
      predictionFreezeReady: true,
      readiness: { predictionFreezeReady: true, blockers: [] },
    } as BuildNhm2PredictionFalsifierFreezeInput;

    const artifact = buildNhm2PredictionFalsifierFreeze(spoofedInput);
    expect(artifact.readiness.predictionFreezeReady).toBe(false);
    expect(artifact.readiness.blockers).toContain(
      "freeze_manifest_unhashed_or_mutable",
    );
    expect("status" in artifact).toBe(false);
    expect("pass" in artifact).toBe(false);
    expect("ready" in artifact).toBe(false);
    expect(isNhm2PredictionFalsifierFreeze(artifact)).toBe(true);

    const readinessTamper = {
      ...artifact,
      readiness: {
        predictionFreezeReady: true,
        blockerCount: 0,
        firstBlocker: "none",
        blockers: [],
      },
    };
    expect(isNhm2PredictionFalsifierFreeze(readinessTamper)).toBe(false);
    expect(
      isNhm2PredictionFalsifierFreeze({ ...artifact, status: "pass" }),
    ).toBe(false);
  });

  it("blocks mutable aliases, malformed hashes, and post-data freezes", () => {
    const input = makeInput();
    input.model.definitionRef = {
      ...input.model.definitionRef!,
      path: "artifacts/research/full-solve/prediction-freeze/latest/model.json",
    };
    input.analysisCode.sourceTreeRef = {
      ...input.analysisCode.sourceTreeRef!,
      sha256: "not-a-sha256",
    };
    input.generatedAt = "2026-07-19T13:01:00.000Z";

    const artifact = buildNhm2PredictionFalsifierFreeze(input);

    expect(artifact.readiness.predictionFreezeReady).toBe(false);
    expect(artifact.readiness.blockers).toEqual(
      expect.arrayContaining([
        "freeze_artifact_generated_after_data_collection_opened",
        "model_definition_unhashed_or_mutable",
        "analysis_source_tree_unhashed_or_mutable",
      ]),
    );
  });

  it("rejects semantic-digest tampering and forward receipt/output shadows", () => {
    const artifact = buildNhm2PredictionFalsifierFreeze(makeInput());
    const semanticTamper = structuredClone(artifact);
    semanticTamper.semanticSha256 = "0".repeat(64);
    expect(isNhm2PredictionFalsifierFreeze(semanticTamper)).toBe(false);

    const shadow = structuredClone(artifact) as unknown as {
      registrationBinding: Record<string, unknown>;
    };
    shadow.registrationBinding.receiptPath = "receipts/post-run.json";
    shadow.registrationBinding.receiptSha256 = "1".repeat(64);
    shadow.registrationBinding.outputManifestPath =
      "artifacts/post-run-output-manifest.json";
    shadow.registrationBinding.outputManifestSha256 = "2".repeat(64);
    expect(isNhm2PredictionFalsifierFreeze(shadow)).toBe(false);
  });

  it("rejects any attempt to open a claim lock in serialized evidence", () => {
    const artifact = buildNhm2PredictionFalsifierFreeze(makeInput());

    expect(
      isNhm2PredictionFalsifierFreeze({
        ...artifact,
        claimBoundary: {
          ...artifact.claimBoundary,
          physicalViabilityClaimAllowed: true,
        },
      }),
    ).toBe(false);
    expect(
      isNhm2PredictionFalsifierFreeze({
        ...artifact,
        physicalViabilityClaimAllowed: true,
      }),
    ).toBe(false);
  });
});
