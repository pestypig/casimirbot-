import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES } from "../shared/contracts/nhm2-semiclassical-v2-science-derivation-authority.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_AUTHORITY_LOCKS,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING_PINS,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_EXPECTED_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_EXPECTED_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_SHA256,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_VALIDATOR_LIMITS,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY,
  NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY_REQUEST,
  cloneNhm2SphericalBosonStarV2OperatorOrderingDerivationClosure,
  isNhm2SphericalBosonStarV2OperatorOrderingDerivationClosureV1,
  nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureViolations,
} from "../shared/contracts/nhm2-spherical-boson-star-v2-operator-ordering-derivation-closure.v1";

const clone = (): any =>
  cloneNhm2SphericalBosonStarV2OperatorOrderingDerivationClosure();

describe("spherical boson-star v2 operator-ordering derivation closure", () => {
  it("approves exactly the missing candidate-specific dependency overlay", () => {
    const overlay =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE.additiveDerivationDagOverlay;
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY_REQUEST,
    ).toEqual([
      {
        from: "geometry",
        to: "computed_bracket_operands_witness",
        role: "computed_constraint_geometry_and_qbar_star",
      },
      {
        from: "chart",
        to: "computed_bracket_operands_witness",
        role: "computed_constraint_chart_and_probe_coordinates",
      },
      {
        from: "sampling_basis",
        to: "computed_bracket_operands_witness",
        role: "computed_constraint_sample_centers_and_probe_family",
      },
    ]);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY,
    ).toEqual(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY_REQUEST.map(
        ({ from, to, role }) => ({ from, to, relation: role }),
      ),
    );
    expect(overlay.baseDagMutated).toBe(false);
    expect(overlay.overlayOnly).toBe(true);
    expect(overlay.edgeCount).toBe(3);
    expect(overlay.approvalStatus).toContain("approved_as_complete");
    expect(overlay.approvalScope).toContain("dependency_edge_identity");
    expect(overlay.additionalDirectInputEdgesAllowed).toBe(false);
    expect(overlay.unionGraphAcyclic).toBe(true);
    expect(overlay.derivationWitnessPresent).toBe(false);
    expect(overlay.grantsExecutionOrReplayAuthority).toBe(false);
    expect(
      NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES.some((base) =>
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_DAG_OVERLAY.some(
          (edge) =>
            edge.from === base.from &&
            edge.to === base.to &&
            edge.relation === base.relation,
        ),
      ),
    ).toBe(false);
  });

  it("exact-binds but rejects the inapplicable unverified source manifest", () => {
    const packet =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE.inspectedSourcePacket;
    const manifestPath = path.join(process.cwd(), packet.manifestRelativePath);
    const bytes = fs.readFileSync(manifestPath);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      packet.manifestFileSha256,
    );
    expect(bytes.byteLength).toBe(packet.manifestFileSizeBytes);
    expect(packet.manifestFileSha256).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING_PINS.inspectedSourceManifestFileSha256,
    );
    expect(packet.declaredCandidateFamily).toBe("nhm2_conformally_flat_needle");
    expect(packet.requiredCandidateFamily).toBe("nhm2_spherical_boson_star");
    expect(packet.candidateFamilyMatches).toBe(false);
    expect(packet.admittedLocalByteReceipt).toBeNull();
    expect(packet.allDeclaredLocalBytesVerified).toBe(false);
    expect(packet.formulaInterpretationVerified).toBe(false);
    expect(packet.consumerBindingAdmitted).toBe(false);
    expect(packet.exactManifestIdentityIsSourceFormulaProof).toBe(false);
    expect(packet.disposition).toContain("rejected_inspected_evidence");
  });

  it("does not invent the three underdetermined executable choices", () => {
    const unresolved =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE.unresolvedOperatorRealization;
    expect(unresolved.completeEffectiveActionOperatorRealization).toBeNull();
    expect(unresolved.stateInverseSymplecticCoordinateRealization).toBeNull();
    expect(
      unresolved.equalTimeContactAndBoundaryDistributionPrescription,
    ).toBeNull();
    expect(unresolved.spatialQuadratureAndBinary64ReductionOrder).toBeNull();
    expect(unresolved.stateInverseSymplecticMissingFields).toContain(
      "mode_basis_and_truncation",
    );
    expect(unresolved.contactAndBoundaryMissingFields).toContain(
      "coincident_contact_extension",
    );
    expect(unresolved.numericalReductionMissingFields).toContain(
      "quadrature_weights",
    );
    expect(
      unresolved.frozenSamplingCenterOrderMaySubstituteForSpatialQuadrature,
    ).toBe(false);
    expect(unresolved.producerSelectedDefaultsAllowed).toBe(false);
  });

  it("retains exact typed blockers for every unclosed source and operator surface", () => {
    const blockers =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE.blockers;
    const blockerIds = blockers.map(({ blockerId }) => blockerId);
    expect(blockerIds).toEqual([
      "candidate_specific_primary_source_byte_packet_absent",
      "inspected_source_packet_candidate_family_mismatch",
      "inspected_source_packet_local_byte_receipt_absent",
      "operator_ordering_derivation_packet_absent",
      "renormalized_total_effective_action_operator_realization_absent",
      "state_inverse_symplectic_coordinate_chart_and_discretization_absent",
      "equal_time_contact_and_boundary_distribution_prescription_absent",
      "spatial_quadrature_weights_and_binary64_reduction_order_absent",
      "point_split_constraint_insertion_derivation_not_replayed",
      "anomaly_cancellation_or_absence_not_proved",
      "primary_and_independent_implementations_absent",
      "runtime_manifest_and_scientific_preseal_absent",
      "arrays_replay_and_independent_agreement_absent",
    ]);
    expect(
      blockers.every(
        (blocker) =>
          blocker.surface.length > 0 &&
          blocker.upstreamEvidence.length > 0 &&
          blocker.requiredResolution.length > 0 &&
          (blocker.disposition.startsWith("block_") ||
            blocker.disposition.startsWith("reject_")),
      ),
    ).toBe(true);
  });

  it("keeps implementation, runtime, execution, replay, lamps, and physical claims locked", () => {
    const contract =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE;
    expect(
      contract.closedSurface.numericOrScientificDerivationEvidenceCreated,
    ).toBe(false);
    expect(
      contract.closedSurface.implementationOrExecutionAuthorityCreated,
    ).toBe(false);
    expect(Object.values(contract.derivationAndEvidenceBoundary)).not.toContain(
      true,
    );
    expect(
      contract.completion.candidateSpecificComputedWitnessOverlayClosed,
    ).toBe(true);
    expect(contract.completion.sourceAndDerivationClosureComplete).toBe(false);
    expect(contract.completion.executableNumericalOrderingComplete).toBe(false);
    expect(contract.completion.anomalyAnalysisComplete).toBe(false);
    expect(contract.completion.operatorOrderingScientificInputComplete).toBe(
      false,
    );
    expect(contract.completion.candidateExecutionMayStart).toBe(false);
    expect(contract.completion.theoryGraphLampPromotionAllowed).toBe(false);
    expect(contract.completion.physicalClaimUnlockAllowed).toBe(false);
    expect(
      Object.values(
        NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_AUTHORITY_LOCKS,
      ),
    ).not.toContain(true);
  });

  it("is recursively frozen and sealed to literal canonical bytes", () => {
    const contract =
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE;
    expect(Object.isFrozen(contract)).toBe(true);
    expect(Object.isFrozen(contract.blockers)).toBe(true);
    expect(Object.isFrozen(contract.blockers[0])).toBe(true);
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_SHA256,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_EXPECTED_SHA256,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_CANONICAL_SIZE_BYTES,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_EXPECTED_CANONICAL_SIZE_BYTES,
    );
    expect(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_BINDING.sha256,
    ).toBe(
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_SHA256,
    );
  });

  it("accepts only the exact canonical plain-data descriptor", () => {
    expect(
      isNhm2SphericalBosonStarV2OperatorOrderingDerivationClosureV1(clone()),
    ).toBe(true);
    const changed = clone();
    changed.completion.candidateExecutionMayStart = true;
    expect(
      isNhm2SphericalBosonStarV2OperatorOrderingDerivationClosureV1(changed),
    ).toBe(false);
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureViolations(
        changed,
      ),
    ).toEqual(["spherical_v2_operator_derivation_closure_semantic_drift"]);
  });

  it("rejects proxies, accessors, cycles, symbols, hostile arrays, and non-JSON numbers", () => {
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureViolations(
        new Proxy({}, {}),
      )[0],
    ).toContain("proxy_forbidden");

    const accessor = clone();
    Object.defineProperty(accessor, "maturity", {
      enumerable: true,
      get: () => "spoofed",
    });
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureViolations(
        accessor,
      )[0],
    ).toContain("object_entry_surface");

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureViolations(
        cyclic,
      )[0],
    ).toContain("cycle_forbidden");

    const symbolKey = clone();
    symbolKey[Symbol("hidden")] = true;
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureViolations(
        symbolKey,
      )[0],
    ).toContain("object_surface");

    const extraArray = [1];
    Object.defineProperty(extraArray, "extra", {
      value: true,
      enumerable: true,
    });
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureViolations(
        extraArray,
      )[0],
    ).toContain("array_surface");

    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -0, 1n]) {
      expect(
        nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureViolations(
          value,
        ).length,
      ).toBeGreaterThan(0);
    }
  });

  it("rejects bounded-resource attacks", () => {
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureViolations(
        "x".repeat(
          NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_VALIDATOR_LIMITS.maximumStringUtf8Bytes +
            1,
        ),
      )[0],
    ).toContain("string_byte_limit");

    let deep: Record<string, unknown> = {};
    const root = deep;
    for (
      let index = 0;
      index <
      NHM2_SPHERICAL_BOSON_STAR_V2_OPERATOR_ORDERING_DERIVATION_CLOSURE_VALIDATOR_LIMITS.maximumDepth +
        2;
      index += 1
    ) {
      const next: Record<string, unknown> = {};
      deep.next = next;
      deep = next;
    }
    expect(
      nhm2SphericalBosonStarV2OperatorOrderingDerivationClosureViolations(
        root,
      )[0],
    ).toContain("snapshot_depth_limit");
  });
});
