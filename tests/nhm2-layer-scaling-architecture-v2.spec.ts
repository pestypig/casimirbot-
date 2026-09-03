import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  NHM2_LAYER_SCALING_ARCHITECTURE_FAILURE_PRECEDENCE,
  buildNhm2LayerScalingArchitectureV2,
  isNhm2LayerScalingArchitectureV2,
  type Nhm2LayerScalingArchitectureInputV2,
  type Nhm2LayerScalingEvidenceAuthorityModeV2,
  type Nhm2LayerScalingEvidenceRefV2,
} from "../shared/contracts/nhm2-layer-scaling-architecture.v2";

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const PROFILE_SHA256 = sha256("manufactured-et0-profile");
const GEOMETRY_ID = "manufactured_geometry_v2";
const STATE_ID = "manufactured_cycle_average_v2";

const evidenceRef = (
  id: string,
  options: {
    stateId?: string | null;
    producerId?: string;
    authorityMode?: Nhm2LayerScalingEvidenceAuthorityModeV2;
  } = {},
): Nhm2LayerScalingEvidenceRefV2 => {
  const digest = sha256(`manufactured:${id}`);
  return {
    artifactRef: `artifacts/et0/${id}.${digest}.json`,
    sha256: digest,
    producerId: options.producerId ?? `producer:${id}`,
    authenticated: true,
    authorityMode: options.authorityMode ?? "MODEL_DERIVED",
    lineage: {
      profileSha256: PROFILE_SHA256,
      stateId: options.stateId === undefined ? STATE_ID : options.stateId,
      geometryId: GEOMETRY_ID,
    },
  };
};

const layerInterval = (
  id: string,
  minInclusive: number,
  maxInclusive: number,
) => ({
  minInclusive,
  maxInclusive,
  receipt: evidenceRef(id),
});

const completeInput = (): Nhm2LayerScalingArchitectureInputV2 => {
  const frame = {
    profileId: "manufactured_profile_alpha_0p7000_v2",
    profileSha256: PROFILE_SHA256,
    chartId: "chart_areal_radius_v2",
    basisId: "orthonormal_eulerian_v2",
    normalizationId: "si_signed_tensor_v2",
    atlasId: "manufactured_wall_atlas_v2",
    volumeConvention: "fixed_control_volume" as const,
  };

  return {
    generatedAt: "2026-09-01T00:00:00.000Z",
    proposedArchitectureId: "manufactured_architecture_ref_v2",
    comparisonFrame: {
      metricRequired: { ...frame },
      sourceRealized: { ...frame },
    },
    tensorBindings: {
      metricRequired: evidenceRef("metric-required-tensor", {
        stateId: null,
        producerId: "metric-demand-producer-v2",
      }),
      sourceRealized: evidenceRef("source-realized-tensor", {
        producerId: "source-state-producer-v2",
      }),
    },
    sourceState: {
      stateId: STATE_ID,
      stateClass: "cycle_averaged_driven",
      stateDefinitionRef: evidenceRef("source-state-definition"),
      driveModelRef: evidenceRef("drive-model"),
      averagingWindowRef: evidenceRef("averaging-window"),
      stateARef: null,
      stateBRef: null,
      qAsStaticEnergyMultiplier: false,
    },
    geometry: {
      geometryId: GEOMETRY_ID,
      volumeConvention: "fixed_control_volume",
      geometricLayerCount: 447,
    },
    layerIntervals: {
      scalarEquivalentLayerInterval: layerInterval("scalar-interval", 446, 448),
      measuredEffectiveLayerInterval: layerInterval(
        "measured-interval",
        440,
        460,
      ),
      tensorClosureLayerInterval: layerInterval("tensor-interval", 445, 450),
      mechanicallyAdmissibleLayerInterval: layerInterval(
        "mechanical-interval",
        430,
        449,
      ),
      sourceRetentionInterval: layerInterval("retention-interval", 444, 452),
    },
    regionalSampling: {
      regionalTensorSampleCountMin: 96,
      derivedFrom: "convergence_and_uncertainty",
      coupledToGeometricLayerCount: false,
      convergenceReceipt: evidenceRef("regional-convergence"),
    },
    apparatusBindings: {
      materialResponseRef: evidenceRef("material-response"),
      packingOrientationRef: evidenceRef("packing-orientation"),
      couplingRef: evidenceRef("coupling"),
      activeAreaRetentionRef: evidenceRef("active-area-retention"),
      supportControlEnergyRef: evidenceRef("support-control-energy"),
      uncertaintyPolicyRef: evidenceRef("uncertainty-policy"),
    },
    metricDemand: {
      nondegeneracyStatus: "nondegenerate",
      signedProperVolumeIntegralRef: evidenceRef("signed-metric-integral", {
        stateId: null,
        producerId: "metric-integral-producer-v2",
      }),
    },
    massMode: "MODEL_DERIVED",
  };
};

const buildAfter = (
  mutate: (input: Nhm2LayerScalingArchitectureInputV2) => void,
) => {
  const input = completeInput();
  mutate(input);
  return buildNhm2LayerScalingArchitectureV2(input);
};

describe("NHM2 layer-scaling architecture v2", () => {
  it("freezes deterministic failure precedence and fails missing evidence first", () => {
    expect(NHM2_LAYER_SCALING_ARCHITECTURE_FAILURE_PRECEDENCE).toEqual([
      "blocked_missing_receipt",
      "blocked_mutable_alias",
      "blocked_fallback_authority",
      "blocked_target_calibrated_authority",
      "blocked_metric_echo",
      "blocked_profile_stale",
      "blocked_state_stale",
      "blocked_geometry_stale",
      "blocked_degenerate_metric_demand",
      "blocked_sample_count_unbound",
      "no_compatible_interval",
    ]);

    const artifact = buildAfter((input) => {
      input.apparatusBindings.materialResponseRef = null;
      input.apparatusBindings.couplingRef!.artifactRef =
        "artifacts/et0/latest/coupling.json";
      input.apparatusBindings.packingOrientationRef!.authorityMode =
        "WHITEPAPER_FALLBACK";
    });

    expect(artifact.decision.firstFailure).toBe("blocked_missing_receipt");
    expect(artifact.decision.blockers.slice(0, 3)).toEqual([
      "blocked_missing_receipt",
      "blocked_mutable_alias",
      "blocked_fallback_authority",
    ]);
    expect(artifact.decision.selectedArchitectureId).toBeNull();
  });

  it("rejects mutable aliases, fallback authority and target calibration", () => {
    expect(
      buildAfter((input) => {
        input.sourceState.driveModelRef!.artifactRef =
          "artifacts/et0/latest/drive-model.json";
      }).decision.firstFailure,
    ).toBe("blocked_mutable_alias");

    expect(
      buildAfter((input) => {
        input.sourceState.stateARef = evidenceRef("optional-state-a", {
          authorityMode: "WHITEPAPER_FALLBACK",
        });
      }).decision.firstFailure,
    ).toBe("blocked_fallback_authority");

    expect(
      buildAfter((input) => {
        input.massMode = "TARGET_CALIBRATED";
      }).decision.firstFailure,
    ).toBe("blocked_target_calibrated_authority");
  });

  it("rejects tensor identity, hash or producer reuse as a metric echo", () => {
    const cases = ["artifactRef", "sha256", "producerId"] as const;
    for (const field of cases) {
      const artifact = buildAfter((input) => {
        input.tensorBindings.sourceRealized![field] =
          input.tensorBindings.metricRequired![field];
      });
      expect(artifact.decision.firstFailure, field).toBe("blocked_metric_echo");
      expect(artifact.decision.selectedArchitectureId, field).toBeNull();
    }
  });

  it("rejects every comparison-frame mismatch and stale profile lineage", () => {
    const fields = [
      "profileId",
      "profileSha256",
      "chartId",
      "basisId",
      "normalizationId",
      "atlasId",
      "volumeConvention",
    ] as const;

    for (const field of fields) {
      const artifact = buildAfter((input) => {
        if (field === "profileSha256") {
          input.comparisonFrame.sourceRealized.profileSha256 =
            sha256("stale-profile");
        } else if (field === "volumeConvention") {
          input.comparisonFrame.sourceRealized.volumeConvention =
            "expanded_wall_volume";
        } else {
          input.comparisonFrame.sourceRealized[field] = `mismatched-${field}`;
        }
      });
      expect(artifact.decision.firstFailure, field).toBe(
        "blocked_profile_stale",
      );
    }

    expect(
      buildAfter((input) => {
        input.apparatusBindings.materialResponseRef!.lineage.profileSha256 =
          sha256("stale-lineage");
      }).decision.firstFailure,
    ).toBe("blocked_profile_stale");
  });

  it("fails under-specified and stale state bindings without using Q as static energy", () => {
    expect(
      buildAfter((input) => {
        input.sourceState.driveModelRef = null;
      }).decision.firstFailure,
    ).toBe("blocked_missing_receipt");

    expect(
      buildAfter((input) => {
        input.apparatusBindings.couplingRef!.lineage.stateId = "wrong-state";
      }).decision.firstFailure,
    ).toBe("blocked_state_stale");

    expect(
      buildAfter((input) => {
        input.sourceState.qAsStaticEnergyMultiplier = true;
      }).decision.firstFailure,
    ).toBe("blocked_state_stale");
  });

  it("rejects geometry/volume staleness and degenerate metric demand", () => {
    expect(
      buildAfter((input) => {
        input.layerIntervals.sourceRetentionInterval!.receipt.lineage.geometryId =
          "stale-geometry";
      }).decision.firstFailure,
    ).toBe("blocked_geometry_stale");

    expect(
      buildAfter((input) => {
        input.geometry.volumeConvention = "expanded_wall_volume";
      }).decision.firstFailure,
    ).toBe("blocked_geometry_stale");

    expect(
      buildAfter((input) => {
        input.metricDemand.signedProperVolumeIntegralRef = null;
      }).decision.firstFailure,
    ).toBe("blocked_missing_receipt");

    expect(
      buildAfter((input) => {
        input.metricDemand.nondegeneracyStatus = "degenerate";
      }).decision.firstFailure,
    ).toBe("blocked_degenerate_metric_demand");
  });

  it("keeps regional sampling independent and fails disjoint architecture intervals", () => {
    expect(
      buildAfter((input) => {
        input.regionalSampling.derivedFrom = "geometric_layer_count";
        input.regionalSampling.coupledToGeometricLayerCount = true;
      }).decision.firstFailure,
    ).toBe("blocked_sample_count_unbound");

    expect(
      buildAfter((input) => {
        input.layerIntervals.sourceRetentionInterval = layerInterval(
          "disjoint-retention",
          500,
          510,
        );
      }).decision.firstFailure,
    ).toBe("no_compatible_interval");
  });

  it("binds only a predeclared manufactured architecture reference", () => {
    const artifact = buildNhm2LayerScalingArchitectureV2(completeInput());

    expect(artifact.decision).toEqual({
      status: "architecture_reference_bound",
      firstFailure: null,
      blockers: [],
      compatibleLayerInterval: { minInclusive: 446, maxInclusive: 448 },
      selectedArchitectureId: "manufactured_architecture_ref_v2",
    });
    expect(artifact.regionalSampling.regionalTensorSampleCountMin).toBe(96);
    expect(artifact.geometry.geometricLayerCount).toBe(447);
    expect(artifact.claimBoundary).toEqual({
      diagnosticOnly: true,
      contractBindingIsNotPhysicalValidation: true,
      architectureSelectionAuthority: false,
      proposalReady: false,
      experimentAuthority: false,
      bmrIEligible: false,
      g3Eligible: false,
      physicalViabilityClaimAllowed: false,
      propulsionClaimAllowed: false,
      transportClaimAllowed: false,
    });
    expect(isNhm2LayerScalingArchitectureV2(artifact)).toBe(true);

    artifact.decision.selectedArchitectureId = "tampered-architecture";
    expect(isNhm2LayerScalingArchitectureV2(artifact)).toBe(false);
  });
});
