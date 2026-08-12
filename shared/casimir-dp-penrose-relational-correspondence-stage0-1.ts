// math-stage: exploratory

import {
  gaussianDpEnergyAnalytic,
  gaussianDpEnergyFourierCrosscheck,
} from "./casimir-dp-dp-companion";
import type {
  CasimirDpPenroseRelationalCorrespondenceStage01Config,
  PenroseRelationalReferenceFrame,
} from "./contracts/casimir-dp-penrose-relational-correspondence-stage0-1.v1";

type Vec3 = [number, number, number];
type Mat3 = [Vec3, Vec3, Vec3];

export const PENROSE_RELATIONAL_CORRESPONDENCE_FIRST_FAILURE_ORDER = [
  "PRC_AUTHORITY_INTEGRITY_FAILED",
  "PRC_IDENTITY_INVALID",
  "PRC_REFERENCE_RECEIPTS_MISSING",
  "PRC_REFERENCE_SUBSYSTEM_INVALID",
  "PRC_BRANCH_MAPS_MISSING",
  "PRC_DOMAIN_INVALID",
  "PRC_DENSITY_SUPPORT_NOT_COVERED",
  "PRC_JACOBIAN_DEGENERATE",
  "PRC_MAP_NOT_ONE_TO_ONE",
  "PRC_CAUSAL_ORDER_VIOLATION",
  "PRC_IDENTITY_RECOVERY_FAILED",
  "PRC_BRANCH_SWAP_RECOVERY_FAILED",
  "PRC_COORDINATE_RELABELING_FAILED",
  "PRC_PHYSICAL_SENSITIVITY_FAILED",
  "PRC_COMMON_ACCELERATION_NULL_FAILED",
  "PRC_ALTERNATE_REFERENCE_MAPS_MISSING",
  "PRC_REFERENCE_CHOICE_SPREAD_EXCEEDED",
  "PRC_WEAK_FIELD_EG_RECOVERY_FAILED",
  "PRC_OUTPUT_POLICY_VIOLATION",
] as const;

export type PenroseRelationalCorrespondenceFailureCode =
  (typeof PENROSE_RELATIONAL_CORRESPONDENCE_FIRST_FAILURE_ORDER)[number];

export type PenroseRelationalCorrespondenceAuthorityIntegrity = {
  role: string;
  path: string;
  expected_sha256: string;
  actual_sha256: string | null;
  gate: "pass" | "not_ready";
  semantic_candidate_status?: "blocked" | "definition_complete_not_validated";
  semantic_first_failure_code?: string | null;
  semantic_nonpromotion_gate?: "pass" | "not_ready";
};

type Failure = {
  code: PenroseRelationalCorrespondenceFailureCode;
  path: string;
  reason: string;
  class: "authority" | "physical_authority" | "synthetic_benchmark";
};

type Gate = {
  gate_id: string;
  status: "pass" | "not_ready";
  value: number | string | boolean | null;
  tolerance: number | string | null;
  interpretation: string;
};

type DerivedFrame = {
  origin: Vec3;
  basis: Mat3;
  determinant: number;
  orthogonalityResidual: number;
  zAlignmentResidual: number;
  axisLengths: Vec3;
  landmarkGram: Mat3;
};

export type PenroseRelationalCorrespondenceStage01Result = {
  schema_version: "casimir_dp_penrose_relational_correspondence_stage0_1_result/1";
  campaign_id: string;
  benchmark_id: string;
  benchmark_version: string;
  maturity: "stage0_exploratory";
  evidence_class: "synthetic_theory_correspondence_benchmark";
  overall_status: "blocked";
  synthetic_benchmark_status: "pass" | "not_ready";
  scientific_correspondence_status:
    "blocked_pending_same_apparatus_reference_receipts";
  first_failure_code: PenroseRelationalCorrespondenceFailureCode | null;
  synthetic_first_failure_code:
    | PenroseRelationalCorrespondenceFailureCode
    | null;
  failures: Failure[];
  authority_integrity: PenroseRelationalCorrespondenceAuthorityIntegrity[];
  gates: Gate[];
  formal_definition: CasimirDpPenroseRelationalCorrespondenceStage01Config["formal_definition"];
  correspondence: {
    prescription:
      "varphi_corr_A_to_B=X_B_after_X_A_inverse_on_X_A_of_B_lab";
    scope: "static_weak_field_laboratory_domain";
    primary_relational_centers_m: {
      branch_a: Vec3;
      branch_b: Vec3;
    } | null;
    primary_separation_m: number | null;
    primary_map_jacobian_determinant: number | null;
    primary_roundtrip_residual_m: number | null;
    coordinate_relabel_residual_m: number | null;
    alternate_reference_separation_m: number | null;
    reference_choice_energy_relative_spread: number | null;
    complete_density_support_covered: boolean;
  };
  weak_field_recovery: {
    target_model: "gaussian_regularized_newtonian_E_G";
    analytic_target_E_G_J: number | null;
    relational_fourier_E_G_J: number | null;
    relative_error: number | null;
    identity_E_G_J: number | null;
    branch_swap_relative_error: number | null;
  };
  physical_reference_authority: {
    ready_packets: number;
    required_packets: number;
    status: "not_ready";
  };
  stage0_candidate_first_failure_remains:
    "PCT_BRANCH_CORRESPONDENCE_MISSING";
  invariant_functional_status: "not_supplied";
  proposed_collapse_rate_s: null;
  proposed_lifetime_distribution: null;
  proposed_coherence_prediction: null;
  proposed_casimir_modifier: null;
  model_comparison_admission: false;
  empirically_validated: false;
  claim_ceiling: "formal_synthetic_correspondence_recovery_only";
};

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: Vec3, factor: number): Vec3 => [a[0] * factor, a[1] * factor, a[2] * factor];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (value: Vec3): number => Math.sqrt(dot(value, value));
const normalize = (value: Vec3): Vec3 | null => {
  const length = norm(value);
  return length > Number.EPSILON ? scale(value, 1 / length) : null;
};
const maxAbs = (values: number[]): number => Math.max(...values.map(Math.abs));

function multiplyMatrixVector(matrix: Mat3, vector: Vec3): Vec3 {
  return [dot(matrix[0], vector), dot(matrix[1], vector), dot(matrix[2], vector)];
}

function basisToCoordinate(frame: DerivedFrame, relational: Vec3): Vec3 {
  return add(
    frame.origin,
    add(
      scale(frame.basis[0], relational[0]),
      add(
        scale(frame.basis[1], relational[1]),
        scale(frame.basis[2], relational[2]),
      ),
    ),
  );
}

function coordinateToRelational(frame: DerivedFrame, coordinate: Vec3): Vec3 {
  const displacement = subtract(coordinate, frame.origin);
  return [
    dot(displacement, frame.basis[0]),
    dot(displacement, frame.basis[1]),
    dot(displacement, frame.basis[2]),
  ];
}

function deriveFrame(input: PenroseRelationalReferenceFrame): DerivedFrame | null {
  const rawX = subtract(input.x_axis_landmark_m, input.origin_m);
  const rawY = subtract(input.y_axis_landmark_m, input.origin_m);
  const rawZ = subtract(input.z_axis_landmark_m, input.origin_m);
  const e1 = normalize(rawX);
  if (e1 == null) return null;
  const yOrthogonal = subtract(rawY, scale(e1, dot(rawY, e1)));
  const e2 = normalize(yOrthogonal);
  if (e2 == null) return null;
  const e3 = normalize(cross(e1, e2));
  const zDirection = normalize(rawZ);
  if (e3 == null || zDirection == null) return null;
  const determinant = dot(e1, cross(e2, e3));
  const orthogonalityResidual = maxAbs([
    dot(e1, e2),
    dot(e1, e3),
    dot(e2, e3),
    norm(e1) - 1,
    norm(e2) - 1,
    norm(e3) - 1,
  ]);
  return {
    origin: input.origin_m,
    basis: [e1, e2, e3],
    determinant,
    orthogonalityResidual,
    zAlignmentResidual: Math.abs(1 - dot(e3, zDirection)),
    axisLengths: [norm(rawX), norm(rawY), norm(rawZ)],
    landmarkGram: [
      [dot(rawX, rawX), dot(rawX, rawY), dot(rawX, rawZ)],
      [dot(rawY, rawX), dot(rawY, rawY), dot(rawY, rawZ)],
      [dot(rawZ, rawX), dot(rawZ, rawY), dot(rawZ, rawZ)],
    ],
  };
}

function determinantFromRows(matrix: Mat3): number {
  return dot(matrix[0], cross(matrix[1], matrix[2]));
}

function correspondenceJacobian(from: DerivedFrame, to: DerivedFrame): Mat3 {
  return [
    [dot(to.basis[0], from.basis[0]), dot(to.basis[0], from.basis[1]), dot(to.basis[0], from.basis[2])],
    [dot(to.basis[1], from.basis[0]), dot(to.basis[1], from.basis[1]), dot(to.basis[1], from.basis[2])],
    [dot(to.basis[2], from.basis[0]), dot(to.basis[2], from.basis[1]), dot(to.basis[2], from.basis[2])],
  ];
}

function mapCoordinate(point: Vec3, from: DerivedFrame, to: DerivedFrame): Vec3 {
  return basisToCoordinate(to, coordinateToRelational(from, point));
}

function relativeDifference(left: number, right: number): number {
  if (left === 0 && right === 0) return 0;
  return Math.abs(left - right) /
    Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);
}

function maxGeometryRelativeDifference(left: Vec3, right: Vec3): number {
  return Math.max(
    ...left.map((value, index) => relativeDifference(value, right[index])),
  );
}

function maxMatrixRelativeDifference(left: Mat3, right: Mat3): number {
  const scaleValue = Math.max(
    ...left.flat().map(Math.abs),
    ...right.flat().map(Math.abs),
    Number.MIN_VALUE,
  );
  return Math.max(...left.flatMap((row, rowIndex) =>
    row.map((value, columnIndex) =>
      Math.abs(value - right[rowIndex][columnIndex]) / scaleValue
    )
  ));
}

function uniqueStrings(values: string[]): boolean {
  return new Set(values).size === values.length;
}

function countReadyPhysicalPackets(
  packets: readonly {
    status: string;
    sha256: string | null;
    missing_fields: readonly string[];
  }[],
): number {
  return packets.filter(
    (packet) =>
      packet.status === "ready" &&
      packet.sha256 != null &&
      packet.missing_fields.length === 0,
  ).length;
}

function rotationZ(angle: number): Mat3 {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [
    [cosine, -sine, 0],
    [sine, cosine, 0],
    [0, 0, 1],
  ];
}

function rotationX(angle: number): Mat3 {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [
    [1, 0, 0],
    [0, cosine, -sine],
    [0, sine, cosine],
  ];
}

function transformPoint(point: Vec3, rotation: Mat3, translation: Vec3): Vec3 {
  return add(multiplyMatrixVector(rotation, point), translation);
}

function transformedFrame(
  input: PenroseRelationalReferenceFrame,
  rotation: Mat3,
  translation: Vec3,
): PenroseRelationalReferenceFrame {
  return {
    ...input,
    origin_m: transformPoint(input.origin_m, rotation, translation),
    x_axis_landmark_m: transformPoint(input.x_axis_landmark_m, rotation, translation),
    y_axis_landmark_m: transformPoint(input.y_axis_landmark_m, rotation, translation),
    z_axis_landmark_m: transformPoint(input.z_axis_landmark_m, rotation, translation),
  };
}

function clocksMatchAndAreOrdered(
  left: PenroseRelationalReferenceFrame,
  right: PenroseRelationalReferenceFrame,
): boolean {
  const l = left.clock_labels;
  const r = right.clock_labels;
  const ordered =
    l.preparation_s <= l.hold_start_s &&
    l.hold_start_s < l.hold_end_s &&
    l.hold_end_s <= l.recombination_s &&
    r.preparation_s <= r.hold_start_s &&
    r.hold_start_s < r.hold_end_s &&
    r.hold_end_s <= r.recombination_s;
  return ordered && Object.keys(l).every(
    (key) => l[key as keyof typeof l] === r[key as keyof typeof r],
  );
}

export function evaluateCasimirDpPenroseRelationalCorrespondenceStage01(args: {
  config: CasimirDpPenroseRelationalCorrespondenceStage01Config;
  authorityIntegrity: PenroseRelationalCorrespondenceAuthorityIntegrity[];
}): PenroseRelationalCorrespondenceStage01Result {
  const { config } = args;
  const failures: Failure[] = [];
  const gates: Gate[] = [];
  const fail = (
    code: PenroseRelationalCorrespondenceFailureCode,
    path: string,
    reason: string,
    failureClass: Failure["class"] = "synthetic_benchmark",
  ) => failures.push({ code, path, reason, class: failureClass });
  const gate = (
    gate_id: string,
    passed: boolean,
    value: Gate["value"],
    tolerance: Gate["tolerance"],
    interpretation: string,
  ) => gates.push({
    gate_id,
    status: passed ? "pass" : "not_ready",
    value,
    tolerance,
    interpretation,
  });

  const authorityFailure = config.upstream_authorities
    .map((expected) => {
      const actual = args.authorityIntegrity.find(
        (entry) =>
          entry.role === expected.role && entry.path === expected.path,
      );
      if (
        actual == null ||
        actual.expected_sha256 !== expected.sha256 ||
        actual.actual_sha256 !== expected.sha256 ||
        actual.gate !== "pass"
      ) {
        return actual ?? {
          role: expected.role,
          path: expected.path,
          expected_sha256: expected.sha256,
          actual_sha256: null,
          gate: "not_ready" as const,
        };
      }
      return null;
    })
    .find((entry) => entry != null) ??
    (args.authorityIntegrity.length === config.upstream_authorities.length
      ? null
      : {
        role: "authority_set",
        path: "upstream_authorities",
        expected_sha256: "",
        actual_sha256: null,
        gate: "not_ready" as const,
      });
  if (authorityFailure != null) {
    fail(
      "PRC_AUTHORITY_INTEGRITY_FAILED",
      authorityFailure.path,
      `Upstream authority ${authorityFailure.role} is missing or hash-mismatched.`,
      "authority",
    );
  }

  const parentAuthority = args.authorityIntegrity.find(
    (entry) => entry.role === "stage0_candidate_receipt_authority",
  );
  if (parentAuthority != null) {
    if (
      parentAuthority.semantic_candidate_status !== "blocked" ||
      parentAuthority.semantic_first_failure_code !==
        "PCT_BRANCH_CORRESPONDENCE_MISSING" ||
      parentAuthority.semantic_nonpromotion_gate !== "pass"
    ) {
      fail(
        "PRC_AUTHORITY_INTEGRITY_FAILED",
        parentAuthority.path,
        "The Stage-0 parent receipt does not preserve the frozen branch-correspondence blocker and nonpromotion policy.",
        "authority",
      );
    }
  }

  if (
    config.benchmark_id !== "operational_relational_landmarks_weak_field_v0" ||
    config.benchmark_version !== "0.1.0" ||
    config.maturity !== "stage0_exploratory"
  ) {
    fail(
      "PRC_IDENTITY_INVALID",
      "benchmark_id",
      "The frozen Stage-0.1 benchmark identity or maturity is invalid.",
      "authority",
    );
  }

  const registeredSourceIds = new Set(
    config.sources.map((source) => source.source_id),
  );
  if (
    config.formal_definition.source_ids.some(
      (sourceId) => !registeredSourceIds.has(sourceId),
    )
  ) {
    fail(
      "PRC_REFERENCE_SUBSYSTEM_INVALID",
      "formal_definition.source_ids",
      "The relational definition references a source outside the frozen source register.",
    );
  }

  const readyPackets = countReadyPhysicalPackets(
    config.reference_contract.physical_authority_packets,
  );
  if (readyPackets !== config.reference_contract.physical_authority_packets.length) {
    fail(
      "PRC_REFERENCE_RECEIPTS_MISSING",
      "reference_contract.physical_authority_packets",
      "Same-apparatus worldline, clock, landmark, source-density, and covariance receipts are absent.",
      "physical_authority",
    );
  }

  const primary = config.primary_fixture;
  const alternate = config.alternate_reference_fixture;
  const primaryA = deriveFrame(primary.branch_a);
  const primaryB = deriveFrame(primary.branch_b);
  const alternateA = deriveFrame(alternate.branch_a);
  const alternateB = deriveFrame(alternate.branch_b);
  const allFrames = [primaryA, primaryB, alternateA, alternateB];
  const frameResidual = allFrames.some((frame) => frame == null)
    ? Number.POSITIVE_INFINITY
    : Math.max(...allFrames.flatMap((frame) => [
      frame!.orthogonalityResidual,
      frame!.zAlignmentResidual,
      Math.abs(frame!.determinant - 1),
    ]));
  const frameGate = frameResidual <= config.thresholds.frame_orthogonality_max;
  gate(
    "reference_subsystem",
    frameGate,
    frameResidual,
    config.thresholds.frame_orthogonality_max,
    "The four landmark frames must be nondegenerate, right handed, and orthonormal within tolerance.",
  );
  if (!frameGate) {
    fail(
      "PRC_REFERENCE_SUBSYSTEM_INVALID",
      "primary_fixture",
      "At least one apparatus-landmark reference frame is degenerate or inconsistent.",
    );
  }

  let primaryRelA: Vec3 | null = null;
  let primaryRelB: Vec3 | null = null;
  let primarySeparation: number | null = null;
  let jacobianDeterminant: number | null = null;
  let roundtripResidual: number | null = null;
  let coordinateRelabelResidual: number | null = null;
  let alternateSeparation: number | null = null;
  let referenceChoiceEnergySpread: number | null = null;
  let analyticEnergy: number | null = null;
  let fourierEnergy: number | null = null;
  let weakFieldRecoveryError: number | null = null;
  let branchSwapError: number | null = null;
  let identityEnergy: number | null = null;
  let densitySupportCovered = false;

  if (primaryA != null && primaryB != null && alternateA != null && alternateB != null) {
    const geometryResidual = Math.max(
      maxGeometryRelativeDifference(primaryA.axisLengths, primaryB.axisLengths),
      maxGeometryRelativeDifference(alternateA.axisLengths, alternateB.axisLengths),
      maxMatrixRelativeDifference(primaryA.landmarkGram, primaryB.landmarkGram),
      maxMatrixRelativeDifference(alternateA.landmarkGram, alternateB.landmarkGram),
    );
    const geometryGate =
      geometryResidual <= config.thresholds.landmark_geometry_relative_max &&
      primary.branch_a.reference_system_id === primary.branch_b.reference_system_id &&
      alternate.branch_a.reference_system_id === alternate.branch_b.reference_system_id &&
      uniqueStrings(primary.branch_a.anchor_ids) &&
      uniqueStrings(primary.branch_b.anchor_ids) &&
      uniqueStrings(alternate.branch_a.anchor_ids) &&
      uniqueStrings(alternate.branch_b.anchor_ids) &&
      primary.branch_a.anchor_ids.join("|") === primary.branch_b.anchor_ids.join("|") &&
      alternate.branch_a.anchor_ids.join("|") === alternate.branch_b.anchor_ids.join("|");
    gate(
      "branch_maps",
      geometryGate,
      geometryResidual,
      config.thresholds.landmark_geometry_relative_max,
      "Paired branches must use the same physical landmark identities and compatible fiducial geometry.",
    );
    if (!geometryGate) {
      fail(
        "PRC_BRANCH_MAPS_MISSING",
        "primary_fixture",
        "The branch frames do not define the same physical apparatus reference subsystem.",
      );
    }

    primaryRelA = coordinateToRelational(
      primaryA,
      primary.branch_a_probe_center_coordinate_m,
    );
    primaryRelB = coordinateToRelational(
      primaryB,
      primary.branch_b_probe_center_coordinate_m,
    );
    primarySeparation = norm(subtract(primaryRelB, primaryRelA));
    const supportRadius =
      config.reference_contract.density_support_sigma *
      config.weak_field_target.R0_m;
    const alternateRelAForSupport = coordinateToRelational(
      alternateA,
      alternate.branch_a_probe_center_coordinate_m,
    );
    const alternateRelBForSupport = coordinateToRelational(
      alternateB,
      alternate.branch_b_probe_center_coordinate_m,
    );
    densitySupportCovered =
      norm(primaryRelA) + supportRadius <= primary.branch_a.domain_radius_m &&
      norm(primaryRelB) + supportRadius <= primary.branch_b.domain_radius_m &&
      norm(alternateRelAForSupport) + supportRadius <=
        alternate.branch_a.domain_radius_m &&
      norm(alternateRelBForSupport) + supportRadius <=
        alternate.branch_b.domain_radius_m;
    gate(
      "density_support_coverage",
      densitySupportCovered,
      densitySupportCovered,
      true,
      "The declared 6R0 Gaussian finite-support proxy must remain inside every primary and alternate chart domain.",
    );
    if (!(
      primary.branch_a.domain_radius_m > 0 &&
      primary.branch_b.domain_radius_m > 0 &&
      alternate.branch_a.domain_radius_m > 0 &&
      alternate.branch_b.domain_radius_m > 0
    )) {
      fail(
        "PRC_DOMAIN_INVALID",
        "primary_fixture",
        "The correspondence domain is invalid.",
      );
    } else if (!densitySupportCovered) {
      fail(
        "PRC_DENSITY_SUPPORT_NOT_COVERED",
        "primary_fixture_and_alternate_reference_fixture",
        "The proposed local maps do not cover the declared 6R0 finite-support proxy in every branch chart.",
      );
    }

    const jacobian = correspondenceJacobian(primaryA, primaryB);
    jacobianDeterminant = determinantFromRows(jacobian);
    const jacobianError = Math.abs(Math.abs(jacobianDeterminant) - 1);
    const jacobianGate =
      Math.abs(jacobianDeterminant) > Number.EPSILON &&
      jacobianError <= config.thresholds.jacobian_determinant_error_max;
    gate(
      "jacobian",
      jacobianGate,
      jacobianError,
      config.thresholds.jacobian_determinant_error_max,
      "The reported value is ||det J|-1|; the local affine correspondence must be invertible and volume preserving for the rigid-frame fixture.",
    );
    if (!jacobianGate) {
      fail(
        "PRC_JACOBIAN_DEGENERATE",
        "primary_fixture",
        "The local branch correspondence has a degenerate or inconsistent Jacobian.",
      );
    }

    const roundtripPoints: Vec3[] = [
      primary.branch_a.origin_m,
      primary.branch_a.x_axis_landmark_m,
      primary.branch_a.y_axis_landmark_m,
      primary.branch_a.z_axis_landmark_m,
      primary.branch_a_probe_center_coordinate_m,
    ];
    roundtripResidual = Math.max(...roundtripPoints.map((point) => {
      const mapped = mapCoordinate(point, primaryA, primaryB);
      const returned = mapCoordinate(mapped, primaryB, primaryA);
      return norm(subtract(returned, point));
    }));
    const oneToOneGate =
      roundtripResidual <= config.thresholds.map_roundtrip_m_max;
    gate(
      "map_inverse",
      oneToOneGate,
      roundtripResidual,
      config.thresholds.map_roundtrip_m_max,
      "The branch map and its inverse must return registered sample points within tolerance.",
    );
    if (!oneToOneGate) {
      fail(
        "PRC_MAP_NOT_ONE_TO_ONE",
        "primary_fixture",
        "The proposed branch map fails the inverse-composition fixture.",
      );
    }

    const causalGate =
      clocksMatchAndAreOrdered(primary.branch_a, primary.branch_b) &&
      clocksMatchAndAreOrdered(alternate.branch_a, alternate.branch_b);
    gate(
      "causal_order",
      causalGate,
      causalGate,
      true,
      "Preparation, hold, and recombination labels must match and preserve causal order in both reference pairs.",
    );
    if (!causalGate) {
      fail(
        "PRC_CAUSAL_ORDER_VIOLATION",
        "primary_fixture.branch_a.clock_labels",
        "The relational clock labels do not define a common ordered experimental interval.",
      );
    }

    identityEnergy = gaussianDpEnergyAnalytic(
      config.weak_field_target.mass_kg,
      0,
      config.weak_field_target.R0_m,
    );
    const identityGate = identityEnergy === 0;
    gate(
      "identity_recovery",
      identityGate,
      identityEnergy,
      0,
      "Identical relational source centers must return zero Newtonian incompatibility target.",
    );
    if (!identityGate) {
      fail(
        "PRC_IDENTITY_RECOVERY_FAILED",
        "weak_field_target",
        "The identity branch fixture returned a nonzero target energy.",
      );
    }

    analyticEnergy = gaussianDpEnergyAnalytic(
      config.weak_field_target.mass_kg,
      primarySeparation,
      config.weak_field_target.R0_m,
    );
    const swappedEnergy = gaussianDpEnergyAnalytic(
      config.weak_field_target.mass_kg,
      norm(subtract(primaryRelA, primaryRelB)),
      config.weak_field_target.R0_m,
    );
    branchSwapError = relativeDifference(analyticEnergy, swappedEnergy);
    const branchSwapGate =
      branchSwapError <= config.thresholds.separation_relative_error_max;
    gate(
      "branch_swap",
      branchSwapGate,
      branchSwapError,
      config.thresholds.separation_relative_error_max,
      "Exchanging branch labels must leave the recovery target unchanged.",
    );
    if (!branchSwapGate) {
      fail(
        "PRC_BRANCH_SWAP_RECOVERY_FAILED",
        "primary_fixture",
        "The branch-swap fixture changed the weak-field recovery target.",
      );
    }

    const rotationA = rotationZ(0.371);
    const rotationB = rotationX(-0.293);
    const translationA: Vec3 = [2.1e-6, -0.8e-6, 0.4e-6];
    const translationB: Vec3 = [-1.4e-6, 1.9e-6, -0.7e-6];
    const transformedAInput = transformedFrame(
      primary.branch_a,
      rotationA,
      translationA,
    );
    const transformedBInput = transformedFrame(
      primary.branch_b,
      rotationB,
      translationB,
    );
    const transformedA = deriveFrame(transformedAInput);
    const transformedB = deriveFrame(transformedBInput);
    if (transformedA == null || transformedB == null) {
      coordinateRelabelResidual = Number.POSITIVE_INFINITY;
    } else {
      const transformedRelA = coordinateToRelational(
        transformedA,
        transformPoint(
          primary.branch_a_probe_center_coordinate_m,
          rotationA,
          translationA,
        ),
      );
      const transformedRelB = coordinateToRelational(
        transformedB,
        transformPoint(
          primary.branch_b_probe_center_coordinate_m,
          rotationB,
          translationB,
        ),
      );
      coordinateRelabelResidual = Math.max(
        norm(subtract(transformedRelA, primaryRelA)),
        norm(subtract(transformedRelB, primaryRelB)),
      );
    }
    const coordinateGate =
      coordinateRelabelResidual <=
      config.thresholds.coordinate_relabel_residual_m_max;
    gate(
      "independent_coordinate_relabel",
      coordinateGate,
      coordinateRelabelResidual,
      config.thresholds.coordinate_relabel_residual_m_max,
      "Independent rigid coordinate redescriptions of each branch must not move the pulled-back probe centers.",
    );
    if (!coordinateGate) {
      fail(
        "PRC_COORDINATE_RELABELING_FAILED",
        "primary_fixture",
        "The relational centers depend on an independent branch coordinate redescription.",
      );
    }

    const separationError = relativeDifference(
      primarySeparation,
      primary.expected_relational_separation_m,
    );
    const sensitivityGate =
      primarySeparation > 0 &&
      separationError <= config.thresholds.separation_relative_error_max;
    gate(
      "physical_sensitivity",
      sensitivityGate,
      separationError,
      config.thresholds.separation_relative_error_max,
      "The branch-blind anchors must preserve, not align away, the registered source displacement.",
    );
    if (!sensitivityGate) {
      fail(
        "PRC_PHYSICAL_SENSITIVITY_FAILED",
        "primary_fixture.expected_relational_separation_m",
        "The proposed correspondence erased or distorted the known branch-source displacement.",
      );
    }

    const context = config.common_context;
    const accelerationDifference = norm(subtract(
      context.branch_a_uniform_acceleration_m_s2,
      context.branch_b_uniform_acceleration_m_s2,
    ));
    const potentialDifference = Math.abs(
      context.branch_a_potential_offset_m2_s2 -
      context.branch_b_potential_offset_m2_s2,
    );
    const commonAccelerationGate = accelerationDifference <=
      config.thresholds.common_acceleration_null_max_m_s2;
    const commonPotentialGate = potentialDifference <=
      config.thresholds.common_potential_null_max_m2_s2;
    gate(
      "common_acceleration_input_equality",
      commonAccelerationGate,
      accelerationDifference,
      `${config.thresholds.common_acceleration_null_max_m_s2} m/s^2`,
      "The frozen fixture supplies the same uniform-acceleration input to both branches; it does not yet replay full equivalence-principle recovery.",
    );
    gate(
      "common_potential_input_equality",
      commonPotentialGate,
      potentialDifference,
      `${config.thresholds.common_potential_null_max_m2_s2} m^2/s^2`,
      "The frozen fixture supplies the same potential-offset input to both branches; it does not yet replay full equivalence-principle recovery.",
    );
    if (!commonAccelerationGate || !commonPotentialGate) {
      fail(
        "PRC_COMMON_ACCELERATION_NULL_FAILED",
        "common_context",
        "The fixture inputs do not represent a common acceleration and potential offset.",
      );
    }

    const alternateRelA = coordinateToRelational(
      alternateA,
      alternate.branch_a_probe_center_coordinate_m,
    );
    const alternateRelB = coordinateToRelational(
      alternateB,
      alternate.branch_b_probe_center_coordinate_m,
    );
    alternateSeparation = norm(subtract(alternateRelB, alternateRelA));
    const alternateEnergy = gaussianDpEnergyAnalytic(
      config.weak_field_target.mass_kg,
      alternateSeparation,
      config.weak_field_target.R0_m,
    );
    referenceChoiceEnergySpread = relativeDifference(
      analyticEnergy,
      alternateEnergy,
    );
    const alternateMapsGate =
      alternate.branch_a.anchor_ids.join("|") !==
        primary.branch_a.anchor_ids.join("|") &&
      alternate.branch_b.anchor_ids.join("|") !==
        primary.branch_b.anchor_ids.join("|");
    gate(
      "alternate_reference_maps",
      alternateMapsGate,
      alternateMapsGate,
      true,
      "A second independently named apparatus-fiducial set must be supplied.",
    );
    if (!alternateMapsGate) {
      fail(
        "PRC_ALTERNATE_REFERENCE_MAPS_MISSING",
        "alternate_reference_fixture",
        "The alternate reference fixture reuses the primary anchor identities.",
      );
    }
    const referenceChoiceGate =
      referenceChoiceEnergySpread <=
      config.thresholds.reference_choice_energy_relative_max;
    gate(
      "reference_choice_spread",
      referenceChoiceGate,
      referenceChoiceEnergySpread,
      config.thresholds.reference_choice_energy_relative_max,
      "Two admissible synthetic landmark choices must recover the same weak-field target within tolerance.",
    );
    if (!referenceChoiceGate) {
      fail(
        "PRC_REFERENCE_CHOICE_SPREAD_EXCEEDED",
        "alternate_reference_fixture",
        "The recovered weak-field target depends materially on the chosen synthetic landmarks.",
      );
    }

    fourierEnergy = gaussianDpEnergyFourierCrosscheck({
      mass_kg: config.weak_field_target.mass_kg,
      separation_m: primarySeparation,
      R0_m: config.weak_field_target.R0_m,
      integration_upper_u: config.weak_field_target.integration_upper_u,
      even_intervals: config.weak_field_target.even_intervals,
    });
    weakFieldRecoveryError = relativeDifference(analyticEnergy, fourierEnergy);
    const weakFieldGate =
      weakFieldRecoveryError <= config.thresholds.weak_field_E_G_relative_max;
    gate(
      "weak_field_E_G_recovery",
      weakFieldGate,
      weakFieldRecoveryError,
      config.thresholds.weak_field_E_G_relative_max,
      "The pulled-back source separation must recover the registered Gaussian Newtonian target through an independent Fourier integral.",
    );
    if (!weakFieldGate) {
      fail(
        "PRC_WEAK_FIELD_EG_RECOVERY_FAILED",
        "weak_field_target",
        "The correspondence fixture does not recover the registered weak-field Gaussian E_G target.",
      );
    }
  }

  const outputPolicyGate =
    config.output_policy.collapse_rate === null &&
    config.output_policy.lifetime_distribution === null &&
    config.output_policy.coherence_prediction === null &&
    config.output_policy.casimir_modifier === null &&
    config.physical_prediction_allowed === false &&
    config.collapse_dynamics_allowed === false &&
    config.model_comparison_admission === false;
  gate(
    "output_policy",
    outputPolicyGate,
    outputPolicyGate,
    true,
    "A correspondence benchmark may emit diagnostic residuals but no collapse, coherence, or Casimir prediction.",
  );
  if (!outputPolicyGate) {
    fail(
      "PRC_OUTPUT_POLICY_VIOLATION",
      "output_policy",
      "The Stage-0.1 output policy attempted to promote a diagnostic into a physical prediction.",
    );
  }

  const failureOrder = new Map(
    PENROSE_RELATIONAL_CORRESPONDENCE_FIRST_FAILURE_ORDER.map(
      (code, index) => [code, index],
    ),
  );
  failures.sort(
    (left, right) =>
      (failureOrder.get(left.code) ?? Number.MAX_SAFE_INTEGER) -
      (failureOrder.get(right.code) ?? Number.MAX_SAFE_INTEGER),
  );
  const syntheticFailures = failures.filter(
    (failure) => failure.class !== "physical_authority",
  );
  return {
    schema_version:
      "casimir_dp_penrose_relational_correspondence_stage0_1_result/1",
    campaign_id: config.campaign_id,
    benchmark_id: config.benchmark_id,
    benchmark_version: config.benchmark_version,
    maturity: "stage0_exploratory",
    evidence_class: "synthetic_theory_correspondence_benchmark",
    overall_status: "blocked",
    synthetic_benchmark_status:
      syntheticFailures.length === 0 ? "pass" : "not_ready",
    scientific_correspondence_status:
      "blocked_pending_same_apparatus_reference_receipts",
    first_failure_code: failures[0]?.code ?? null,
    synthetic_first_failure_code: syntheticFailures[0]?.code ?? null,
    failures,
    authority_integrity: args.authorityIntegrity,
    gates,
    formal_definition: config.formal_definition,
    correspondence: {
      prescription:
        "varphi_corr_A_to_B=X_B_after_X_A_inverse_on_X_A_of_B_lab",
      scope: "static_weak_field_laboratory_domain",
      primary_relational_centers_m:
        primaryRelA != null && primaryRelB != null
          ? { branch_a: primaryRelA, branch_b: primaryRelB }
          : null,
      primary_separation_m: primarySeparation,
      primary_map_jacobian_determinant: jacobianDeterminant,
      primary_roundtrip_residual_m: roundtripResidual,
      coordinate_relabel_residual_m: coordinateRelabelResidual,
      alternate_reference_separation_m: alternateSeparation,
      reference_choice_energy_relative_spread: referenceChoiceEnergySpread,
      complete_density_support_covered: densitySupportCovered,
    },
    weak_field_recovery: {
      target_model: "gaussian_regularized_newtonian_E_G",
      analytic_target_E_G_J: analyticEnergy,
      relational_fourier_E_G_J: fourierEnergy,
      relative_error: weakFieldRecoveryError,
      identity_E_G_J: identityEnergy,
      branch_swap_relative_error: branchSwapError,
    },
    physical_reference_authority: {
      ready_packets: readyPackets,
      required_packets:
        config.reference_contract.physical_authority_packets.length,
      status: "not_ready",
    },
    stage0_candidate_first_failure_remains:
      "PCT_BRANCH_CORRESPONDENCE_MISSING",
    invariant_functional_status: "not_supplied",
    proposed_collapse_rate_s: null,
    proposed_lifetime_distribution: null,
    proposed_coherence_prediction: null,
    proposed_casimir_modifier: null,
    model_comparison_admission: false,
    empirically_validated: false,
    claim_ceiling: "formal_synthetic_correspondence_recovery_only",
  };
}
