import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  cloneNhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1CanonicalWire,
  isNhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1Wire,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_JSON,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_EXPECTED_SEMANTIC_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_LAMPS,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_LITERAL_SEAL_STATUS,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_PLAIN_CANONICAL_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SEMANTIC_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SEMANTIC_SHA256_DOMAIN,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SOURCE_BYTE_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_VALIDATOR_LIMITS,
  nhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1WireViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-accepted-geometry-state-handoff.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-branch-selection-numerics.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-candidate-freeze.v2";
import { NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-metric-demand-program.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-raw-replay-schema.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-run-artifact-wire.v2";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-si-output-normalization.v1";
import { NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-si-output-normalization.v2";
import { NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING } from "../shared/contracts/nhm2-spherical-boson-star-v2-static-ground-state-hadamard-mean-noise-realization.v1";

const CONTRACT =
  NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1;

const recursivelyExpectFrozen = (
  value: unknown,
  seen = new Set<object>(),
): void => {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value as Record<string, unknown>)) {
    recursivelyExpectFrozen(child, seen);
  }
};

const expectAllNullLeaves = (value: unknown): void => {
  if (value === null) return;
  expect(typeof value).toBe("object");
  expect(value).not.toBeNull();
  for (const child of Object.values(value as Record<string, unknown>)) {
    expectAllNullLeaves(child);
  }
};

const expectAllFalseLeaves = (value: unknown): void => {
  if (value === false) return;
  expect(typeof value).toBe("object");
  expect(value).not.toBeNull();
  for (const child of Object.values(value as Record<string, unknown>)) {
    expectAllFalseLeaves(child);
  }
};

describe("spherical boson-star v2 accepted geometry/state handoff v1", () => {
  it("directly pins the final freeze, branch policy, SI-v2 and 68-file ABI definitions", () => {
    const pins =
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_BINDING_PINS;
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_V2_BINDING,
    ).toMatchObject(pins.finalCandidateFreezeV2);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_BRANCH_SELECTION_NUMERICS_V1_BINDING,
    ).toMatchObject(pins.finalBranchSelectionNumericsV1);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_V2_BINDING,
    ).toMatchObject({
      sha256: pins.finalSiOutputNormalizationV2.semanticSha256,
      canonicalSizeBytes: pins.finalSiOutputNormalizationV2.canonicalSizeBytes,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RAW_REPLAY_SCHEMA_BINDING,
    ).toMatchObject({
      sha256: pins.rawReplaySchemaV1.semanticSha256,
      canonicalSizeBytes: pins.rawReplaySchemaV1.canonicalSizeBytes,
    });
    expect(
      CONTRACT.exactDefinitionBindings
        .bindingsAndSourceObservationsGrantAuthority,
    ).toBe(false);
  });

  it("observes the exact audited dependency source bytes without elevating them to authority", () => {
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SOURCE_BYTE_PINS.map(
        (entry) => entry.ordinal,
      ),
    ).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    for (const pin of NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SOURCE_BYTE_PINS) {
      const bytes = readFileSync(resolve(process.cwd(), pin.path));
      expect(bytes.byteLength, pin.path).toBe(pin.rawSizeBytes);
      expect(createHash("sha256").update(bytes).digest("hex"), pin.path).toBe(
        pin.rawSha256,
      );
    }
  });

  it("keeps N256 causal only as the seed of one jointly accepted geometry/state fixed point", () => {
    const seed = CONTRACT.terminalBranchSeedInterface;
    const joint = CONTRACT.jointGeometryStateInterface;
    expect(seed).toMatchObject({
      terminalStateId: "L3_N256_A2^-10",
      gridNodeCount: 256,
      amplitude: "2^-10",
      classicalEinsteinKleinGordonStateRole: "joint_iteration_seed_only",
      directMetricDemandFromTerminalClassicalStateAllowed: false,
      oneWayQuantumEvaluationOnUncorrectedClassicalGeometryAllowed: false,
    });
    expect(seed.packedStateOrder).toEqual([
      "F0_nodes_ascending_rho",
      "F1_nodes_ascending_rho",
      "varphi_nodes_ascending_rho",
      "w",
    ]);
    expect(joint).toMatchObject({
      sameEffectiveActionAndStateMustProduceGeometryAndQuantumState: true,
      geometryAndQuantumStateMustBeAcceptedAsOneFixedPoint: true,
      geometryRawHashMustReappearInDerivativeEnvelopeReceipt: true,
    });
    expect(seed.terminalStateReceipt.hashDomain).toBe(
      "nhm2-spherical-boson-star-v2/terminal-branch-state-receipt/v1\n",
    );
    expect(joint.jointWitness.hashDomain).toBe(
      "nhm2-spherical-boson-star-v2/joint-geometry-state-witness/v1\n",
    );
  });

  it("freezes the exact four-radius derivative-enclosure ABI and same-geometry receipt", () => {
    const enclosure = CONTRACT.fourRadiusDerivativeEnclosureInterface;
    expect(enclosure.exactRadiusGroupsInOrder).toEqual([
      { radiusGroup: "r2_3_over_64", radius: "sqrt(3)/8" },
      { radiusGroup: "r2_11_over_64", radius: "sqrt(11)/8" },
      { radiusGroup: "r2_19_over_64", radius: "sqrt(19)/8" },
      { radiusGroup: "r2_27_over_64", radius: "sqrt(27)/8" },
    ]);
    expect(enclosure.exactQuantitiesInOrder).toEqual([
      "F1",
      "F0_prime",
      "F1_prime",
      "F0_double_prime",
      "F1_double_prime",
    ]);
    expect(enclosure.F0ValueConsumed).toBe(false);
    expect(enclosure.exactInputEnvelopeRootKeys).toEqual([
      "contractVersion",
      "radiusGroups",
      "siScale",
    ]);
    expect(enclosure.exactQuantityRecordKeys).toEqual([
      "quantityId",
      "centralF64WordHex",
      "centralMpfr256",
      "lowerMpfr256",
      "upperMpfr256",
    ]);
    expect(enclosure.exactMpfrEndpointKeys).toEqual([
      "sign",
      "mantissaHex",
      "exponent2",
      "precisionBits",
      "direction",
    ]);
    expect(enclosure.endpointRoles).toEqual({
      central: "C_RNDN_precision_256",
      lower: "L_RNDD_precision_256",
      upper: "U_RNDU_precision_256",
      relation: "lower<=central<=upper",
      uniqueOddDyadicNormalizationRequired: true,
    });
    expect(enclosure.acceptedGeometryEvaluationReceipt.hashDomain).toBe(
      "nhm2-spherical-boson-star-v2/accepted-geometry-evaluation-receipt/v1\n",
    );
    expect(
      enclosure.acceptedGeometryEvaluationReceipt.exactRequiredFields,
    ).toContain("acceptedGeometryRawBinding");
    expect(
      enclosure.acceptedGeometryEvaluationReceipt.exactRequiredFields,
    ).toContain("jointGeometryStateWitnessSha256");
  });

  it("fails SI-v2 closed until three genuinely versioned successors exist", () => {
    const boundary = CONTRACT.staleSiIntegrationBoundary;
    const pins =
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_BINDING_PINS;
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_SI_OUTPUT_NORMALIZATION_BINDING,
    ).toMatchObject({
      sha256: pins.staleSiOutputNormalizationV1.semanticSha256,
      canonicalSizeBytes: pins.staleSiOutputNormalizationV1.canonicalSizeBytes,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_STATIC_GROUND_STATE_HADAMARD_MEAN_NOISE_REALIZATION_BINDING,
    ).toMatchObject({
      sha256: pins.staleMeanNoiseRealizationV1.semanticSha256,
      canonicalSizeBytes: pins.staleMeanNoiseRealizationV1.canonicalSizeBytes,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_METRIC_DEMAND_PROGRAM_BINDING,
    ).toMatchObject({
      sha256: pins.staleMetricDemandProgramV1.semanticSha256,
      canonicalSizeBytes: pins.staleMetricDemandProgramV1.canonicalSizeBytes,
    });
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_RUN_ARTIFACT_WIRE_V2_BINDING,
    ).toMatchObject({
      sha256: pins.staleRunArtifactWireV2.semanticSha256,
      canonicalSizeBytes: pins.staleRunArtifactWireV2.canonicalSizeBytes,
    });
    expect(
      boundary.staleConsumers.map(
        (entry) => entry.requiredSuccessorContractVersion,
      ),
    ).toEqual([
      "nhm2_spherical_boson_star_v2_static_ground_state_hadamard_mean_noise_realization/v2",
      "nhm2_spherical_boson_star_v2_metric_demand_program/v2",
      "nhm2_spherical_boson_star_v2_run_artifact_wire/v3",
    ]);
    expect(
      boundary.staleConsumers.every(
        (entry) =>
          entry.integrationRepaired === false &&
          entry.successorBinding === null,
      ),
    ).toBe(true);
    expect(boundary.siV2MayBeClaimedTransitivelyIntegrated).toBe(false);
    expect(
      boundary.allThreeAdditiveSuccessorsRequiredBeforeCandidateAdmission,
    ).toBe(true);
  });

  it("places metric demand outside the 68 outputs but inside replay causality", () => {
    const boundary = CONTRACT.metricDemandAndLaneBoundary;
    expect(
      boundary.metricDemandScientificInputs.map((entry) => entry.inputId),
    ).toEqual([
      "metric_demand_tensor",
      "metric_demand_absolute_error_bound",
      "metric_demand_derivation_receipt",
    ]);
    expect(boundary.metricDemandScientificInputs.slice(0, 2)).toMatchObject([
      { shape: [64, 10], exactSizeBytes: 5_120, unit: "J/m^3" },
      { shape: [64, 10], exactSizeBytes: 5_120, unit: "J/m^3" },
    ]);
    expect(boundary.metricDemandFilesAreAmong68LaneOutputs).toBe(false);
    expect(boundary.exactOutputLanePhysicalFileCount).toBe(68);
    expect(boundary.exactOutputLanePayloadSizeBytes).toBe(6_693_376);
    expect(boundary.exactFuturePairPhysicalFileCount).toBe(136);
    expect(boundary.serverChecksUsingStaticMetricInputsInOrder).toEqual([
      "metricDemandNondegeneracy",
      "meanMetricDemandClosure",
      "metricDemandErrorEnclosure",
    ]);
    expect(boundary.metricDemandDerivationReceiptV2HashDomain).toBe(
      "nhm2-spherical-boson-star-v2/metric-demand-derivation-receipt/v2\n",
    );
  });

  it("freezes the exact fail-closed causal chronology", () => {
    expect(CONTRACT.causalChronology).toHaveLength(11);
    expect(CONTRACT.causalChronology[0]).toContain("before_execution");
    expect(CONTRACT.causalChronology[3]).toContain(
      "terminal_L3_N256_A2^-10_state_as_classical_iteration_seed_only",
    );
    expect(CONTRACT.causalChronology[4]).toContain(
      "joint_geometry_quantum_state_algorithm",
    );
    expect(CONTRACT.causalChronology[5]).toContain("64_probe_families");
    expect(CONTRACT.causalChronology[6]).toContain("same_accepted_geometry");
    expect(CONTRACT.causalChronology[9]).toContain(
      "two_disjoint_68_file_lanes",
    );
    expect(CONTRACT.causalChronology[10]).toContain("pair_agreement");
  });

  it("keeps every evidence binding null and every readiness, lock and lamp false", () => {
    expectAllNullLeaves(CONTRACT.missingEvidenceBindings);
    expectAllFalseLeaves(CONTRACT.readiness);
    expectAllFalseLeaves(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_AUTHORITY_LOCKS,
    );
    expectAllFalseLeaves(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_LAMPS,
    );
    expect(CONTRACT.additiveBoundary).toMatchObject({
      existingContractsMutated: false,
      existingCandidateOrOutputInstanceCreated: false,
      existingRegistryEntryCreated: false,
      existingCasimirVerificationInvoked: false,
      vacuumNoFoldAndBoundaryReceiptsRequiredToFreezeThisSchema: false,
      vacuumNoFoldAndBoundaryReceiptsRequiredBeforeBranchAcceptance: true,
    });
    expect(CONTRACT.missingProducerAndProofInventory).toHaveLength(25);
    recursivelyExpectFrozen(CONTRACT);
  });

  it("seals the independently acknowledged semantic/plain/size checkpoint", () => {
    const semantic = createHash("sha256")
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SEMANTIC_SHA256_DOMAIN,
        "utf8",
      )
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_JSON,
        "utf8",
      )
      .digest("hex");
    const plain = createHash("sha256")
      .update(
        NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_JSON,
        "utf8",
      )
      .digest("hex");
    const size = Buffer.byteLength(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_JSON,
      "utf8",
    );
    expect(semantic).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_SEMANTIC_SHA256,
    );
    expect(plain).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_PLAIN_CANONICAL_SHA256,
    );
    expect(size).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_EXPECTED_SEMANTIC_SHA256,
    ).toBe(semantic);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_EXPECTED_PLAIN_CANONICAL_SHA256,
    ).toBe(plain);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_EXPECTED_CANONICAL_SIZE_BYTES,
    ).toBe(size);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_LITERAL_SEAL_STATUS,
    ).toBe(
      "sealed_after_independent_parent_acknowledgement_before_any_candidate_execution",
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_BINDING,
    ).toMatchObject({
      semanticSha256: semantic,
      plainCanonicalSha256: plain,
      canonicalSizeBytes: size,
      observedRawBinding: null,
      literalSealStatus:
        "sealed_after_independent_parent_acknowledgement_before_any_candidate_execution",
    });
  });

  it("accepts only bounded primitive exact canonical text without observing hostile traps", () => {
    const canonical =
      cloneNhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1CanonicalWire();
    expect(canonical).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_CANONICAL_JSON,
    );
    expect(
      nhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1WireViolations(
        canonical,
      ),
    ).toEqual([]);
    expect(
      isNhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1Wire(canonical),
    ).toBe(true);
    expect(
      nhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1WireViolations(
        `${canonical} `,
      ),
    ).toEqual([
      "spherical_v2_accepted_geometry_state_handoff_v1_canonical_wire_mismatch",
    ]);

    let trapCount = 0;
    const hostile = new Proxy(
      {},
      {
        get: () => {
          trapCount += 1;
          throw new Error("must_not_observe_get_trap");
        },
        ownKeys: () => {
          trapCount += 1;
          throw new Error("must_not_observe_own_keys_trap");
        },
        getPrototypeOf: () => {
          trapCount += 1;
          throw new Error("must_not_observe_prototype_trap");
        },
      },
    );
    expect(
      nhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1WireViolations(
        hostile,
      ),
    ).toEqual([
      "spherical_v2_accepted_geometry_state_handoff_v1_wire_must_be_primitive_string",
    ]);
    expect(trapCount).toBe(0);
    expect(
      nhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1WireViolations(
        new String(canonical),
      ),
    ).toEqual([
      "spherical_v2_accepted_geometry_state_handoff_v1_wire_must_be_primitive_string",
    ]);

    const limits =
      NHM2_SPHERICAL_BOSON_STAR_V2_ACCEPTED_GEOMETRY_STATE_HANDOFF_V1_VALIDATOR_LIMITS;
    expect(
      nhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1WireViolations(
        "x".repeat(limits.maximumWireUtf16CodeUnits + 1),
      ),
    ).toEqual([
      "spherical_v2_accepted_geometry_state_handoff_v1_wire_utf16_limit",
    ]);
    expect(
      nhm2SphericalBosonStarV2AcceptedGeometryStateHandoffV1WireViolations(
        "é".repeat(Math.floor(limits.maximumWireUtf8Bytes / 2) + 1),
      ),
    ).toEqual([
      "spherical_v2_accepted_geometry_state_handoff_v1_wire_utf8_limit",
    ]);
  });
});
