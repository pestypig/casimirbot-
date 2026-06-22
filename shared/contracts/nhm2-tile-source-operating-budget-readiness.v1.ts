import type {
  Nhm2TileSourceActiveControlOperatingBudgetV1,
} from "./nhm2-tile-source-active-control-operating-budget.v1";
import type {
  Nhm2TileSourceFatigueLayerScalingOperatingBudgetV1,
} from "./nhm2-tile-source-fatigue-layer-scaling-operating-budget.v1";
import type {
  Nhm2TileSourceForceGapLoadBudgetV1,
} from "./nhm2-tile-source-force-gap-load-budget.v1";
import type {
  Nhm2TileSourceFullApparatusTensorOperatingBudgetV1,
} from "./nhm2-tile-source-full-apparatus-tensor-operating-budget.v1";
import type {
  Nhm2TileSourceMaterialCouponOperatingBudgetV1,
} from "./nhm2-tile-source-material-coupon-operating-budget.v1";
import type {
  Nhm2TileSourceRoughnessPatchOperatingBudgetV1,
} from "./nhm2-tile-source-roughness-patch-operating-budget.v1";

export const NHM2_TILE_SOURCE_OPERATING_BUDGET_READINESS_CONTRACT_VERSION =
  "nhm2_tile_source_operating_budget_readiness/v1";

export type Nhm2TileSourceOperatingBudgetSurfaceIdV1 =
  | "material_coupon"
  | "force_gap_load"
  | "roughness_patch"
  | "active_control"
  | "fatigue_layer_scaling"
  | "full_apparatus_tensor";

export type Nhm2TileSourceOperatingBudgetStatusV1 = {
  surfaceId: Nhm2TileSourceOperatingBudgetSurfaceIdV1;
  contractVersion: string | null;
  artifactRef: string | null;
  ready: boolean;
  falsifiesCurrentCandidate: boolean;
  firstBlocker: string;
  blockerCount: number;
  blockers: string[];
  numericalMargins: Record<string, number | boolean | null>;
};

export type Nhm2TileSourceOperatingBudgetReadinessV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_OPERATING_BUDGET_READINESS_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: Record<Nhm2TileSourceOperatingBudgetSurfaceIdV1, string | null>;
  budgetStatuses: Nhm2TileSourceOperatingBudgetStatusV1[];
  summary: {
    allOperatingBudgetsReady: boolean;
    anyOperatingBudgetFalsifies: boolean;
    firstBlocker: string;
    blockerCount: number;
    falsifyingBudgetCount: number;
    reviewBudgetCount: number;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  blockers: string[];
  claimBoundary: {
    diagnosticOnly: true;
    operatingBudgetReadinessOnly: true;
    budgetsDoNotSupplyExperimentalReceipts: true;
    budgetsDoNotSupplyFullTensorValues: true;
    fullSolveRequiresDownstreamGateClosure: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceOperatingBudgetReadinessInput = {
  generatedAt?: string | null;
  selectedProfileId?: string | null;
  materialCouponOperatingBudget?: Nhm2TileSourceMaterialCouponOperatingBudgetV1 | null;
  materialCouponOperatingBudgetRef?: string | null;
  forceGapLoadBudget?: Nhm2TileSourceForceGapLoadBudgetV1 | null;
  forceGapLoadBudgetRef?: string | null;
  roughnessPatchOperatingBudget?: Nhm2TileSourceRoughnessPatchOperatingBudgetV1 | null;
  roughnessPatchOperatingBudgetRef?: string | null;
  activeControlOperatingBudget?: Nhm2TileSourceActiveControlOperatingBudgetV1 | null;
  activeControlOperatingBudgetRef?: string | null;
  fatigueLayerScalingOperatingBudget?: Nhm2TileSourceFatigueLayerScalingOperatingBudgetV1 | null;
  fatigueLayerScalingOperatingBudgetRef?: string | null;
  fullApparatusTensorOperatingBudget?: Nhm2TileSourceFullApparatusTensorOperatingBudgetV1 | null;
  fullApparatusTensorOperatingBudgetRef?: string | null;
};

const DEFAULT_SELECTED_PROFILE_ID =
  "stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const marginRecord = (
  value: unknown,
): Record<string, number | boolean | null> => {
  const record = isRecord(value) ? value : {};
  return Object.fromEntries(
    Object.entries(record).filter(
      ([, entry]) => entry === null || typeof entry === "boolean" || isFiniteNumber(entry),
    ),
  ) as Record<string, number | boolean | null>;
};

const statusFromBudget = (
  surfaceId: Nhm2TileSourceOperatingBudgetSurfaceIdV1,
  budget:
    | Nhm2TileSourceMaterialCouponOperatingBudgetV1
    | Nhm2TileSourceForceGapLoadBudgetV1
    | Nhm2TileSourceRoughnessPatchOperatingBudgetV1
    | Nhm2TileSourceActiveControlOperatingBudgetV1
    | Nhm2TileSourceFatigueLayerScalingOperatingBudgetV1
    | Nhm2TileSourceFullApparatusTensorOperatingBudgetV1
    | null
    | undefined,
  artifactRef: string | null,
  readyKey:
    | "materialCouponEvidenceReady"
    | "forceGapEvidenceReady"
    | "roughnessPatchEvidenceReady"
    | "activeControlEvidenceReady"
    | "fatigueLayerScalingEvidenceReady"
    | "fullApparatusTensorEvidenceReady",
): Nhm2TileSourceOperatingBudgetStatusV1 => {
  if (budget == null) {
    const blocker = `${surfaceId}_operating_budget_missing`;
    return {
      surfaceId,
      contractVersion: null,
      artifactRef,
      ready: false,
      falsifiesCurrentCandidate: false,
      firstBlocker: blocker,
      blockerCount: 1,
      blockers: [blocker],
      numericalMargins: {},
    };
  }
  const ready = budget.summary[readyKey] === true;
  const blockers = budget.blockers.filter((blocker) => blocker !== "none");
  return {
    surfaceId,
    contractVersion: budget.contractVersion,
    artifactRef,
    ready,
    falsifiesCurrentCandidate: budget.summary.falsifiesCurrentCandidate,
    firstBlocker: budget.summary.firstBlocker,
    blockerCount: blockers.length,
    blockers,
    numericalMargins: marginRecord(
      "margins" in budget ? budget.margins : budget.derivedOperatingBudget,
    ),
  };
};

export const buildNhm2TileSourceOperatingBudgetReadiness = (
  input: BuildNhm2TileSourceOperatingBudgetReadinessInput = {},
): Nhm2TileSourceOperatingBudgetReadinessV1 => {
  const budgetStatuses: Nhm2TileSourceOperatingBudgetStatusV1[] = [
    statusFromBudget(
      "material_coupon",
      input.materialCouponOperatingBudget,
      input.materialCouponOperatingBudgetRef ?? null,
      "materialCouponEvidenceReady",
    ),
    statusFromBudget(
      "force_gap_load",
      input.forceGapLoadBudget,
      input.forceGapLoadBudgetRef ?? null,
      "forceGapEvidenceReady",
    ),
    statusFromBudget(
      "roughness_patch",
      input.roughnessPatchOperatingBudget,
      input.roughnessPatchOperatingBudgetRef ?? null,
      "roughnessPatchEvidenceReady",
    ),
    statusFromBudget(
      "active_control",
      input.activeControlOperatingBudget,
      input.activeControlOperatingBudgetRef ?? null,
      "activeControlEvidenceReady",
    ),
    statusFromBudget(
      "fatigue_layer_scaling",
      input.fatigueLayerScalingOperatingBudget,
      input.fatigueLayerScalingOperatingBudgetRef ?? null,
      "fatigueLayerScalingEvidenceReady",
    ),
    statusFromBudget(
      "full_apparatus_tensor",
      input.fullApparatusTensorOperatingBudget,
      input.fullApparatusTensorOperatingBudgetRef ?? null,
      "fullApparatusTensorEvidenceReady",
    ),
  ];
  const blockers = budgetStatuses.flatMap((status) =>
    status.blockers.map((blocker) => `${status.surfaceId}:${blocker}`),
  );
  const falsifyingBudgetCount = budgetStatuses.filter(
    (status) => status.falsifiesCurrentCandidate,
  ).length;
  const reviewBudgetCount = budgetStatuses.filter(
    (status) => !status.ready && !status.falsifiesCurrentCandidate,
  ).length;
  const allOperatingBudgetsReady = budgetStatuses.every((status) => status.ready);
  const selectedProfileId =
    input.selectedProfileId ??
    input.materialCouponOperatingBudget?.selectedProfileId ??
    input.forceGapLoadBudget?.selectedProfileId ??
    input.roughnessPatchOperatingBudget?.selectedProfileId ??
    input.activeControlOperatingBudget?.selectedProfileId ??
    input.fatigueLayerScalingOperatingBudget?.selectedProfileId ??
    input.fullApparatusTensorOperatingBudget?.selectedProfileId ??
    DEFAULT_SELECTED_PROFILE_ID;
  return {
    contractVersion: NHM2_TILE_SOURCE_OPERATING_BUDGET_READINESS_CONTRACT_VERSION,
    generatedAt:
      input.generatedAt ??
      input.materialCouponOperatingBudget?.generatedAt ??
      input.forceGapLoadBudget?.generatedAt ??
      input.roughnessPatchOperatingBudget?.generatedAt ??
      input.activeControlOperatingBudget?.generatedAt ??
      input.fatigueLayerScalingOperatingBudget?.generatedAt ??
      input.fullApparatusTensorOperatingBudget?.generatedAt ??
      new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId,
    frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1",
    sourceRefs: {
      material_coupon: input.materialCouponOperatingBudgetRef ?? null,
      force_gap_load: input.forceGapLoadBudgetRef ?? null,
      roughness_patch: input.roughnessPatchOperatingBudgetRef ?? null,
      active_control: input.activeControlOperatingBudgetRef ?? null,
      fatigue_layer_scaling: input.fatigueLayerScalingOperatingBudgetRef ?? null,
      full_apparatus_tensor: input.fullApparatusTensorOperatingBudgetRef ?? null,
    },
    budgetStatuses,
    summary: {
      allOperatingBudgetsReady,
      anyOperatingBudgetFalsifies: falsifyingBudgetCount > 0,
      firstBlocker: blockers[0] ?? "none",
      blockerCount: blockers.length,
      falsifyingBudgetCount,
      reviewBudgetCount,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    blockers,
    claimBoundary: {
      diagnosticOnly: true,
      operatingBudgetReadinessOnly: true,
      budgetsDoNotSupplyExperimentalReceipts: true,
      budgetsDoNotSupplyFullTensorValues: true,
      fullSolveRequiresDownstreamGateClosure: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceOperatingBudgetReadiness = (
  value: unknown,
): value is Nhm2TileSourceOperatingBudgetReadinessV1 => {
  const record = isRecord(value) ? value : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const boundary = isRecord(record?.claimBoundary) ? record.claimBoundary : null;
  return (
    record != null &&
    record.contractVersion === NHM2_TILE_SOURCE_OPERATING_BUDGET_READINESS_CONTRACT_VERSION &&
    typeof record.generatedAt === "string" &&
    record.laneId === "nhm2_shift_lapse" &&
    typeof record.selectedProfileId === "string" &&
    record.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(record.sourceRefs) &&
    Array.isArray(record.budgetStatuses) &&
    record.budgetStatuses.length === 6 &&
    record.budgetStatuses.every((entry) => {
      const status = isRecord(entry) ? entry : null;
      return (
        status != null &&
        typeof status.surfaceId === "string" &&
        typeof status.contractVersion !== "undefined" &&
        (typeof status.artifactRef === "string" || status.artifactRef === null) &&
        typeof status.ready === "boolean" &&
        typeof status.falsifiesCurrentCandidate === "boolean" &&
        typeof status.firstBlocker === "string" &&
        typeof status.blockerCount === "number" &&
        Array.isArray(status.blockers) &&
        status.blockers.every((blocker) => typeof blocker === "string") &&
        isRecord(status.numericalMargins)
      );
    }) &&
    summary != null &&
    typeof summary.allOperatingBudgetsReady === "boolean" &&
    typeof summary.anyOperatingBudgetFalsifies === "boolean" &&
    typeof summary.firstBlocker === "string" &&
    typeof summary.blockerCount === "number" &&
    typeof summary.falsifyingBudgetCount === "number" &&
    typeof summary.reviewBudgetCount === "number" &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    Array.isArray(record.blockers) &&
    record.blockers.every((entry) => typeof entry === "string") &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.operatingBudgetReadinessOnly === true &&
    boundary.budgetsDoNotSupplyExperimentalReceipts === true &&
    boundary.budgetsDoNotSupplyFullTensorValues === true &&
    boundary.fullSolveRequiresDownstreamGateClosure === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
