import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
} from "../shared/contracts/nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-semiclassical-v2-scientific-candidate-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
} from "../shared/contracts/nhm2-semiclassical-v2-scientific-preseal.v1";
import {
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_ARTIFACT_ID,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_CLAIM_LOCKS,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_REQUIRED_BLOCKERS,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_UNCERTAINTY_OUTPUT_ROLES,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_WITNESS_CONTRACT_VERSION,
  buildNhm2SemiclassicalV2ScienceDerivationAuthority,
  computeNhm2SemiclassicalV2ScienceDerivationInputClosureSha256,
  isNhm2SemiclassicalV2ScienceDerivationAuthority,
  nhm2SemiclassicalV2ScienceDerivationAuthorityViolations,
  type BuildNhm2SemiclassicalV2ScienceDerivationAuthorityInput,
  type Nhm2SemiclassicalV2ScienceDerivationSemanticInputBindingV1,
  type Nhm2SemiclassicalV2ScienceDerivationWitnessIdentityV1,
  type Nhm2SemiclassicalV2ScienceEvidenceIdentityV1,
} from "../shared/contracts/nhm2-semiclassical-v2-science-derivation-authority.v1";
import { NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS } from "../shared/contracts/nhm2-semiclassical-state-realizability.v2";

const digest = (label: string): string =>
  createHash("sha256").update(label, "utf8").digest("hex");

const objectIds: Partial<Record<string, string>> = {
  geometry: "geometry.fixed-64/v1",
  quantum_state: "quantum-state.hadamard/v1",
  chart: "chart.comoving-cartesian/v1",
  smearing_definition: "smearing.gaussian-fixed/v1",
  sampling_basis: "sampling.cartesian-4x4x4/v1",
};

const semanticInputs =
  (): Nhm2SemiclassicalV2ScienceDerivationSemanticInputBindingV1[] =>
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS.map(
      (contract, ordinal) => ({
        ordinal,
        inputId: contract.inputId,
        artifactId: contract.artifactId,
        contractVersion: contract.contractVersion,
        scientificObjectId:
          objectIds[contract.inputId] ?? `${contract.inputId}.frozen/v1`,
        sha256: digest(`semantic:${contract.inputId}`),
        sizeBytes: 128 + ordinal,
      }),
    );

const evidence = (
  label: string,
  closure: string,
): Nhm2SemiclassicalV2ScienceEvidenceIdentityV1 => ({
  evidenceId: `${label}.evidence/v1`,
  artifactId: `nhm2.semiclassical_v2.${label}`,
  contractVersion:
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_WITNESS_CONTRACT_VERSION,
  sha256: digest(`evidence:${label}`),
  semanticInputClosureSha256: closure,
});

const witness = (
  label: string,
  closure: string,
  witnessKind: Nhm2SemiclassicalV2ScienceDerivationWitnessIdentityV1["witnessKind"],
  outputRole: string,
): Nhm2SemiclassicalV2ScienceDerivationWitnessIdentityV1 => ({
  ...evidence(label, closure),
  witnessKind,
  outputRole,
});

const buildInput = (
  disposition: BuildNhm2SemiclassicalV2ScienceDerivationAuthorityInput["anomalyAssessment"]["declaredDisposition"] = "undetermined_pending_replay",
): BuildNhm2SemiclassicalV2ScienceDerivationAuthorityInput => {
  const inputs = semanticInputs();
  const closure =
    computeNhm2SemiclassicalV2ScienceDerivationInputClosureSha256(inputs);
  const counterterms = inputs.find(
    (entry) => entry.inputId === "renormalization_counterterms",
  )!;
  return {
    generatedAt: "2026-08-10T15:00:00.000Z",
    candidateBinding: {
      candidateManifestArtifactId:
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_ARTIFACT_ID,
      candidateManifestContractVersion:
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_CANDIDATE_MANIFEST_CONTRACT_VERSION,
      candidateId: "nhm2.semiclassical-v2.candidate-001",
      candidateManifestId: "nhm2.semiclassical-v2.candidate-manifest-001",
      selectedProfileId: "stage1_centerline_alpha_0p995_v1",
      geometryId: objectIds.geometry!,
      quantumStateId: objectIds.quantum_state!,
      chartId: objectIds.chart!,
      normalizationId: "normalization.smeared-rset-frobenius/v1",
      smearingFunctionId: objectIds.smearing_definition!,
      samplingBasisId: objectIds.sampling_basis!,
      metricDemandInputId: "metric_demand_tensor",
      metricDemandErrorBoundInputId: "metric_demand_absolute_error_bound",
      metricDemandDerivationWitnessInputId: "metric_demand_derivation_receipt",
      candidateFrozenAt: "2026-08-10T14:00:00.000Z",
      candidateManifestSha256: digest("candidate-manifest"),
    },
    presealBinding: {
      artifactId: NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_ARTIFACT_ID,
      contractVersion:
        NHM2_SEMICLASSICAL_V2_SCIENTIFIC_PRESEAL_CONTRACT_VERSION,
      sealKey: digest("seal-key"),
      presealArtifactSha256: digest("preseal-artifact"),
      candidateManifestSha256: digest("candidate-manifest"),
      scientificContentSha256: digest("scientific-content"),
      sealedInventorySha256: digest("sealed-inventory"),
      sealedAt: "2026-08-10T14:30:00.000Z",
      serverPersistenceReceiptSha256: digest("preseal-persistence-receipt"),
    },
    frozenControlBindings: {
      normalization: {
        inputId: "normalization",
        artifactId: "nhm2.semiclassical_v2.normalization",
        contractVersion: "nhm2_semiclassical_v2_normalization/v1",
        scientificObjectId: "normalization.smeared-rset-frobenius/v1",
        sha256: digest("normalization"),
        sizeBytes: 256,
      },
      tolerancePolicy: {
        inputId: "tolerance_policy",
        artifactId: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ARTIFACT_ID,
        contractVersion:
          NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_CONTRACT_VERSION,
        policyId: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_ID,
        sha256: NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sha256,
        sizeBytes:
          NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING.sizeBytes,
      },
    },
    semanticInputBindings: inputs,
    stateAdmissibilityEvidence: evidence("state_admissibility", closure),
    derivationWitnesses: {
      meanRset: witness(
        "mean_rset_derivation_witness",
        closure,
        "renormalized_state_expectation_derivation",
        "mean_rset",
      ),
      noiseKernel: witness(
        "noise_kernel_derivation_witness",
        closure,
        "connected_symmetrized_noise_derivation",
        "noise_kernel",
      ),
      uncertaintyBudget: {
        ...evidence("uncertainty_budget_derivation_witness", closure),
        witnessKind: "pointwise_absolute_uncertainty95_derivation",
        outputRoles: [
          ...NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_UNCERTAINTY_OUTPUT_ROLES,
        ],
      },
      metricDemandErrorBound: {
        ...witness(
          "metric_demand_error_bound_derivation_witness",
          closure,
          "metric_demand_deterministic_error_bound_derivation",
          "metric_demand_absolute_error_bound",
        ),
        sha256: inputs.find(
          (entry) => entry.inputId === "metric_demand_derivation_receipt",
        )!.sha256,
      },
      bracketOperands: NHM2_SEMICLASSICAL_CONSTRAINT_BRACKET_IDS.map(
        (bracketId) => ({
          bracketId,
          computed: witness(
            `constraint_${bracketId}_computed_witness`,
            closure,
            "computed_constraint_bracket_operand_derivation",
            `constraint_bracket.${bracketId}.computed`,
          ),
          classicalTarget: witness(
            `constraint_${bracketId}_target_witness`,
            closure,
            "classical_structure_function_operand_derivation",
            `constraint_bracket.${bracketId}.target`,
          ),
        }),
      ),
    },
    anomalyAssessment: {
      declaredDisposition: disposition,
      evidence: evidence("constraint_anomaly", closure),
      countertermBinding: {
        inputId: "renormalization_counterterms",
        inputSha256: counterterms.sha256,
        evidence: evidence("constraint_counterterm_binding", closure),
      },
    },
  };
};

const artifact = () =>
  buildNhm2SemiclassicalV2ScienceDerivationAuthority(buildInput());

describe("NHM2 semiclassical-v2 science derivation authority", () => {
  it("rejects the superseded v1 science-derivation authority identity", () => {
    const oldAuthority = structuredClone(artifact()) as unknown as {
      contractVersion: string;
    };
    oldAuthority.contractVersion =
      "nhm2_semiclassical_v2_science_derivation_authority/v1";
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(oldAuthority),
    ).toContain("authority_identity_or_time_invalid");
  });

  it("rejects the superseded v1 dependency-edge ordering identity", () => {
    const oldOrdering = structuredClone(artifact()) as Record<string, any>;
    oldOrdering.dependencyDag.ordering =
      "frozen_science_derivation_edge_order_v1";

    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(oldOrdering),
    ).toContain("dependency_dag_binding_invalid");
  });

  it("binds all twenty semantic inputs and remains a blocked preflight", () => {
    const value = artifact();

    expect(value.artifactId).toBe(
      NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_AUTHORITY_ARTIFACT_ID,
    );
    expect(value.semanticInputBindings).toHaveLength(20);
    expect(value.dependencyDag.edges).toEqual(
      NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES,
    );
    expect(value.authorityState).toEqual({
      status: "blocked",
      firstBlocker: "server_science_derivation_replay_missing",
      blockers: [...NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_REQUIRED_BLOCKERS],
    });
    expect(value.meanDemandClosure).toMatchObject({
      requirement: "mandatory_before_diagnostic_lamp_authority",
      replayStatus: "not_replayed",
      residualEvidence: null,
      authorityStatus: "blocked",
    });
    expect(Object.values(value.claimLocks)).toEqual(
      Object.values(NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_CLAIM_LOCKS),
    );
    expect(
      Object.values(value.claimLocks).every((entry) => entry === false),
    ).toBe(true);
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(value),
    ).toEqual([]);
    expect(isNhm2SemiclassicalV2ScienceDerivationAuthority(value)).toBe(true);
  });

  it("rejects a boolean-only state-admissibility assertion", () => {
    const value = structuredClone(artifact()) as Record<string, any>;
    value.stateAdmissibility.stateAdmissible = true;

    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(value),
    ).toEqual(
      expect.arrayContaining([
        "boolean_only_true_proof_assertion_forbidden",
        "state_admissibility_preflight_invalid",
      ]),
    );
  });

  it("rejects missing, reordered, or contract-drifted semantic inputs", () => {
    const missing = structuredClone(artifact()) as Record<string, any>;
    missing.semanticInputBindings.pop();
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(missing),
    ).toEqual(
      expect.arrayContaining([
        "semantic_input_count_invalid",
        "semantic_input_closure_sha256_invalid",
      ]),
    );

    const reordered = structuredClone(artifact()) as Record<string, any>;
    [reordered.semanticInputBindings[0], reordered.semanticInputBindings[1]] = [
      reordered.semanticInputBindings[1],
      reordered.semanticInputBindings[0],
    ];
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(reordered),
    ).toEqual(
      expect.arrayContaining([
        "semantic_input_binding_invalid:0",
        "semantic_input_binding_invalid:1",
        "semantic_input_closure_sha256_invalid",
      ]),
    );

    const drifted = structuredClone(artifact()) as Record<string, any>;
    drifted.semanticInputBindings[5].contractVersion =
      "nhm2_semiclassical_v2_field_model/v2";
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(drifted),
    ).toContain("semantic_input_binding_invalid:5");
  });

  it("rejects candidate/preseal and candidate/scientific cross-binding drift", () => {
    const preseal = structuredClone(artifact()) as Record<string, any>;
    preseal.presealBinding.candidateManifestSha256 = digest("other-candidate");
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(preseal),
    ).toContain("preseal_binding_invalid");

    const geometry = structuredClone(artifact()) as Record<string, any>;
    geometry.candidateBinding.geometryId = "geometry.other/v1";
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(geometry),
    ).toContain("candidate_semantic_object_binding_mismatch");
  });

  it("enforces candidate freeze, preseal, and preflight chronology", () => {
    const beforeFreeze = structuredClone(artifact()) as Record<string, any>;
    beforeFreeze.presealBinding.sealedAt = "2026-08-10T13:59:59.000Z";
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(beforeFreeze),
    ).toContain("freeze_preseal_authority_chronology_invalid");

    const beforeSeal = structuredClone(artifact()) as Record<string, any>;
    beforeSeal.generatedAt = "2026-08-10T14:29:59.000Z";
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(beforeSeal),
    ).toContain("freeze_preseal_authority_chronology_invalid");
  });

  it("recomputes exact DAG identity and rejects cycles", () => {
    const value = structuredClone(artifact()) as Record<string, any>;
    value.dependencyDag.edges.push({
      from: "mean_metric_demand_closure",
      to: "geometry",
      relation: "forbidden_reverse_dependency",
    });
    value.dependencyDag.edgeCount += 1;

    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(value),
    ).toEqual(
      expect.arrayContaining([
        "dependency_dag_binding_invalid",
        "dependency_dag_cycle_detected",
      ]),
    );
  });

  it("rejects unbound witnesses and computed-target witness echoes", () => {
    const unbound = structuredClone(artifact()) as Record<string, any>;
    unbound.derivationWitnesses.meanRset.semanticInputClosureSha256 = digest(
      "other-input-closure",
    );
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(unbound),
    ).toContain("mean_rset_witness_invalid");

    const echo = structuredClone(artifact()) as Record<string, any>;
    echo.derivationWitnesses.bracketOperands[0].classicalTarget.sha256 =
      echo.derivationWitnesses.bracketOperands[0].computed.sha256;
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(echo),
    ).toContain("bracket_operand_witness_invalid:0");
  });

  it("requires every uncertainty role in exact frozen order", () => {
    const omitted = structuredClone(artifact()) as Record<string, any>;
    omitted.derivationWitnesses.uncertaintyBudget.outputRoles.splice(4, 1);
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(omitted),
    ).toContain("uncertainty_budget_witness_invalid");

    const swapped = structuredClone(artifact()) as Record<string, any>;
    [
      swapped.derivationWitnesses.uncertaintyBudget.outputRoles[0],
      swapped.derivationWitnesses.uncertaintyBudget.outputRoles[1],
    ] = [
      swapped.derivationWitnesses.uncertaintyBudget.outputRoles[1],
      swapped.derivationWitnesses.uncertaintyBudget.outputRoles[0],
    ];
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(swapped),
    ).toContain("uncertainty_budget_witness_invalid");
  });

  it("requires anomaly evidence and an exact counterterm-input binding", () => {
    const value = structuredClone(artifact()) as Record<string, any>;
    value.anomalyAssessment.countertermBinding.inputSha256 = digest(
      "unbound-counterterms",
    );

    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(value),
    ).toContain("anomaly_assessment_or_counterterm_binding_invalid");
  });

  it("records a declared anomaly as an additional blocker, never authority", () => {
    const value = buildNhm2SemiclassicalV2ScienceDerivationAuthority(
      buildInput("anomaly_detected"),
    );

    expect(value.authorityState.blockers).toContain(
      "declared_constraint_anomaly_detected",
    );
    expect(value.authorityState.status).toBe("blocked");
    expect(
      Object.values(value.claimLocks).every((entry) => entry === false),
    ).toBe(true);
    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(value),
    ).toEqual([]);
  });

  it("rejects self-declared replay, mean-demand closure, or lamp authority", () => {
    const value = structuredClone(artifact()) as Record<string, any>;
    value.authorityState.status = "pass";
    value.stateAdmissibility.serverReplayStatus = "replayed";
    value.meanDemandClosure.replayStatus = "pass";
    value.meanDemandClosure.residualEvidence = evidence(
      "self_declared_residual",
      value.semanticInputClosureSha256,
    );
    value.claimLocks.semiclassicalStressNoiseLamp = true;

    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(value),
    ).toEqual(
      expect.arrayContaining([
        "state_admissibility_preflight_invalid",
        "mean_metric_demand_closure_preflight_invalid",
        "authority_state_not_fail_closed",
        "claim_locks_not_all_false",
      ]),
    );
  });

  it("forbids the declared lever identity anywhere in the preflight", () => {
    const value = structuredClone(artifact()) as Record<string, any>;
    value.derivationWitnesses.noiseKernel.evidenceId =
      "candidate_declared_tile_effective_tensor_lever_model";

    expect(
      nhm2SemiclassicalV2ScienceDerivationAuthorityViolations(value),
    ).toContain("declared_lever_identity_forbidden");
  });
});
