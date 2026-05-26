import type { CurvatureCollapseObjectBindingInput } from "./curvature-collapse-object-bindings";

export type CurvatureCollapseGroupId =
  | "curvature.proxy.kappa"
  | "collapse.benchmark.cadence"
  | "curvature.uncertainty.margin"
  | "collapse.runtime.benchmark"
  | "curvature.claim_boundary";

export type CurvatureCollapseGroup = {
  id: CurvatureCollapseGroupId;
  title: string;
  band: "curvature" | "collapse" | "uncertainty" | "runtime" | "boundary";
  description: string;
  theoryBadgeIds: string[];
  calculatorPayloadRefs: Array<{
    badgeId: string;
    payloadId: string;
  }>;
  claimBoundaryBadgeIds: string[];
  objectBindings: Array<{
    id: string;
    label: string;
    description: string;
    input: CurvatureCollapseObjectBindingInput;
  }>;
};

const CURVATURE_BOUNDARY_BADGES = ["curvature.claim_boundary.benchmark_only"];

export const CURVATURE_COLLAPSE_GROUPS: CurvatureCollapseGroup[] = [
  {
    id: "curvature.proxy.kappa",
    title: "Curvature Proxy",
    band: "curvature",
    description: "Mass-density and drive-power curvature proxy rows.",
    theoryBadgeIds: [
      "curvature.proxy.body_density",
      "curvature.proxy.drive_power_flux",
      "curvature.proxy.drive_body_ratio",
      ...CURVATURE_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "curvature.proxy.body_density", payloadId: "curvature_kappa_body_payload" },
      { badgeId: "curvature.proxy.drive_power_flux", payloadId: "curvature_kappa_drive_payload" },
      { badgeId: "curvature.proxy.drive_body_ratio", payloadId: "curvature_drive_body_ratio_payload" },
    ],
    claimBoundaryBadgeIds: CURVATURE_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-curvature-proxy",
        label: "Sample curvature proxy",
        description: "Density and drive-power proxy values with explicit area, duty, and gain.",
        input: {
          objectId: "curvature:sample-proxy",
          label: "Sample curvature proxy",
          rho_kg_m3: 1000,
          power_W: 1000000,
          area_m2: 10,
          d_eff: 0.5,
          gain: 1,
          kappa_body: 1.866e-23,
        },
      },
    ],
  },
  {
    id: "collapse.benchmark.cadence",
    title: "Collapse Benchmark",
    band: "collapse",
    description: "Hazard, causal footprint, and curvature-unit benchmark rows.",
    theoryBadgeIds: [
      "collapse.benchmark.hazard_probability",
      "collapse.benchmark.present_length",
      "collapse.benchmark.kappa_present",
      ...CURVATURE_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "collapse.benchmark.hazard_probability", payloadId: "collapse_hazard_probability_payload" },
      { badgeId: "collapse.benchmark.present_length", payloadId: "collapse_present_length_payload" },
      { badgeId: "collapse.benchmark.kappa_present", payloadId: "collapse_kappa_present_payload" },
    ],
    claimBoundaryBadgeIds: CURVATURE_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-collapse-cadence",
        label: "Sample collapse cadence",
        description: "dt=50 ms, tau=1000 ms, r_c=0.25 m benchmark example.",
        input: {
          objectId: "collapse:sample-cadence",
          label: "Sample collapse cadence",
          dt_ms: 50,
          tau_ms: 1000,
          r_c_m: 0.25,
          L_present: 0.25,
        },
      },
    ],
  },
  {
    id: "curvature.uncertainty.margin",
    title: "Uncertainty Margin",
    band: "uncertainty",
    description: "Scalar margin and normalized uncertainty rows for benchmark decisions.",
    theoryBadgeIds: [
      "curvature.uncertainty.margin",
      "curvature.uncertainty.z_score",
      ...CURVATURE_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "curvature.uncertainty.margin", payloadId: "curvature_uncertainty_margin_payload" },
      { badgeId: "curvature.uncertainty.z_score", payloadId: "curvature_uncertainty_z_score_payload" },
    ],
    claimBoundaryBadgeIds: CURVATURE_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-uncertainty-margin",
        label: "Sample uncertainty margin",
        description: "Observed 0.82 against bound 1 with sigma 0.04.",
        input: {
          objectId: "curvature:sample-margin",
          label: "Sample uncertainty margin",
          observed: 0.82,
          bound: 1,
          sigma: 0.04,
        },
      },
    ],
  },
  {
    id: "collapse.runtime.benchmark",
    title: "Runtime Benchmark",
    band: "runtime",
    description: "Collapse benchmark route and curvature leverage benchmark script context.",
    theoryBadgeIds: [
      "collapse.runtime.benchmark_route",
      "curvature.runtime.leverage_benchmark",
      ...CURVATURE_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: CURVATURE_BOUNDARY_BADGES,
    objectBindings: [],
  },
  {
    id: "curvature.claim_boundary",
    title: "Claim Boundary",
    band: "boundary",
    description: "Keeps curvature/collapse rows in diagnostic and benchmark scope.",
    theoryBadgeIds: [...CURVATURE_BOUNDARY_BADGES],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: CURVATURE_BOUNDARY_BADGES,
    objectBindings: [],
  },
];

export function getCurvatureCollapseGroup(groupId: CurvatureCollapseGroupId): CurvatureCollapseGroup | null {
  return CURVATURE_COLLAPSE_GROUPS.find((group) => group.id === groupId) ?? null;
}
