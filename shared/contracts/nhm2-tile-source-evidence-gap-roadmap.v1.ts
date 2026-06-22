import type { Nhm2LayerStackReceiptSurfaceId } from "./nhm2-layer-stack-full-apparatus-receipt-loop.v1";
import type {
  Nhm2TileSourceMaterialEvidenceReceiptsV1,
  Nhm2TileSourceReceiptSurfaceStatusV1,
} from "./nhm2-tile-source-material-evidence-receipts.v1";
import type { Nhm2TileSourcePhysicalValidationPlanV1 } from "./nhm2-tile-source-physical-validation-plan.v1";

export const NHM2_TILE_SOURCE_EVIDENCE_GAP_ROADMAP_CONTRACT_VERSION =
  "nhm2_tile_source_evidence_gap_roadmap/v1";

export type Nhm2TileSourceEvidenceGapRoadmapItemV1 = {
  itemId: Nhm2LayerStackReceiptSurfaceId;
  priorityRank: number;
  status: "open" | "falsifying" | "satisfied";
  evidenceTier: string;
  evidenceRef: string | null;
  firstBlocker: string;
  decisionQuestion: string;
  requiredEvidence: string[];
  goCriteria: string[];
  noGoCriteria: string[];
  numericalMargins: Record<string, number | null>;
  unlocks: string[];
  artifactToProduce: string;
};

export type Nhm2TileSourceEvidenceGapRoadmapV1 = {
  contractVersion: typeof NHM2_TILE_SOURCE_EVIDENCE_GAP_ROADMAP_CONTRACT_VERSION;
  generatedAt: string;
  laneId: "nhm2_shift_lapse";
  selectedProfileId: string;
  frozenCandidateId: "nhm2_447_layer_topology_optimized_lattice_tin_v1";
  sourceRefs: {
    materialEvidenceReceiptsRef: string | null;
    physicalValidationPlanRef: string | null;
  };
  roadmapItems: Nhm2TileSourceEvidenceGapRoadmapItemV1[];
  summary: {
    currentDisposition: "receipt_ready" | "review" | "falsified";
    nextBestItemId: Nhm2LayerStackReceiptSurfaceId | "none";
    openItemCount: number;
    falsifyingItemCount: number;
    satisfiedItemCount: number;
    materialEvidenceReady: boolean;
    fullApparatusTensorReady: boolean;
    downstreamGatesPass: boolean | null;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
  claimBoundary: {
    diagnosticOnly: true;
    roadmapOnly: true;
    roadmapDoesNotSupplyEvidence: true;
    idealScalarCasimirIsNotMaterialEvidence: true;
    fullApparatusTensorRequired: true;
    physicalViabilityClaimAllowed: false;
    transportClaimAllowed: false;
    propulsionClaimAllowed: false;
  };
};

export type BuildNhm2TileSourceEvidenceGapRoadmapInput = {
  materialEvidenceReceipts: Nhm2TileSourceMaterialEvidenceReceiptsV1;
  physicalValidationPlan?: Nhm2TileSourcePhysicalValidationPlanV1 | null;
  materialEvidenceReceiptsRef?: string | null;
  physicalValidationPlanRef?: string | null;
};

const ROADMAP_POLICY: Record<
  Nhm2LayerStackReceiptSurfaceId,
  {
    priorityRank: number;
    decisionQuestion: string;
    requiredEvidence: string[];
    goCriteria: string[];
    noGoCriteria: string[];
    unlocks: string[];
    artifactToProduce: string;
  }
> = {
  material_coupon: {
    priorityRank: 1,
    decisionQuestion:
      "Can the ultra-high-stress TiN candidate stack carry the 447-layer support stress at cryogenic operating conditions?",
    requiredEvidence: [
      "cryogenic tensile/fracture coupon curve",
      "dielectric-response receipt",
      "conductivity receipt",
      "roughness and fabrication-tolerance coupon metrology",
    ],
    goCriteria: [
      "measured or validated evidence tier",
      "fracture/yield margin at least 2x support stress",
      "4 K coupon state supplied",
      "dielectric and conductivity references supplied",
    ],
    noGoCriteria: [
      "fracture/yield margin below 1",
      "candidate material mismatch",
      "roughness or fabrication tolerance cannot support the 8 nm stack",
    ],
    unlocks: ["material_credibility", "full_apparatus_tensor"],
    artifactToProduce: "receipt://material_coupon/tin_447_layer_cryogenic_v1",
  },
  force_gap_pull_in: {
    priorityRank: 2,
    decisionQuestion:
      "Can the 8 nm gap operate without pull-in, stiction, or insufficient active gap-control authority?",
    requiredEvidence: [
      "F(g) force-gap curve",
      "dF/dg force-gradient curve",
      "effective spring constant",
      "stiction margin",
      "active gap-control authority",
    ],
    goCriteria: [
      "pull-in margin at least 1",
      "stiction margin at least 1",
      "active authority at least 1.2x absolute Casimir force",
    ],
    noGoCriteria: [
      "pull-in margin below 1",
      "stiction margin below 1",
      "active authority below 1.2x absolute Casimir force",
    ],
    unlocks: ["active_control_energy", "covariant_conservation"],
    artifactToProduce: "receipt://force_gap_pull_in/8nm_447_layer_v1",
  },
  roughness_patch_metrology: {
    priorityRank: 3,
    decisionQuestion:
      "Do roughness tails, asperities, and patch potentials remain below the 8 nm operating-gap contamination budget?",
    requiredEvidence: [
      "RMS roughness metrology",
      "asperity p99 and max-tail map",
      "patch-voltage map",
      "residual electrostatic correction",
    ],
    goCriteria: [
      "roughness RMS no greater than 0.1 nm",
      "max asperity below half the 8 nm gap",
      "patch RMS no greater than 10 mV",
      "residual electrostatic force correction no greater than 5%",
    ],
    noGoCriteria: [
      "asperity tail exceeds half gap",
      "patch/electrostatic correction dominates the Casimir row",
      "roughness correction cannot be bounded",
    ],
    unlocks: ["force_gap_pull_in", "full_apparatus_tensor"],
    artifactToProduce: "receipt://roughness_patch_metrology/8nm_surface_map_v1",
  },
  active_control_energy: {
    priorityRank: 4,
    decisionQuestion:
      "Can the active control layer hold the gap, timing, noise, and heat budget without becoming the dominant source tensor term?",
    requiredEvidence: [
      "energy per control cycle",
      "control bandwidth",
      "gap-noise spectrum",
      "heat-load receipt",
      "timing jitter receipt",
      "failure-mode receipt",
    ],
    goCriteria: [
      "bandwidth at least 2x switching rate",
      "gap noise no greater than 1% of 8 nm",
      "timing jitter no greater than 0.1 cycle",
      "finite heat-load and cycle-energy receipts",
    ],
    noGoCriteria: [
      "gap-lock bandwidth below target",
      "gap noise exceeds 1% gap",
      "timing jitter exceeds 0.1 cycle",
      "control heat or field energy overwhelms source tensor",
    ],
    unlocks: ["full_apparatus_tensor", "covariant_conservation"],
    artifactToProduce: "receipt://active_control/gap_lock_energy_noise_heat_v1",
  },
  fatigue_lifetime: {
    priorityRank: 5,
    decisionQuestion:
      "Does the 447-layer device survive the required cycling without fatigue, creep, drift, or thermal cycling failure?",
    requiredEvidence: [
      "cycle count to failure",
      "required cycle count",
      "creep/drift bound",
      "thermal cycling receipt",
    ],
    goCriteria: ["cycle-count margin at least 1", "support-coupled fatigue path remains bounded"],
    noGoCriteria: ["cycle-count margin below 1", "drift changes the 8 nm operating gap"],
    unlocks: ["layer_scaling", "material_credibility"],
    artifactToProduce: "receipt://fatigue_lifetime/447_layer_cycle_life_v1",
  },
  layer_scaling: {
    priorityRank: 6,
    decisionQuestion:
      "Do 447 layers preserve enough active area and near-additive source behavior after support coupling is included?",
    requiredEvidence: [
      "layer scaling efficiency",
      "nonadditivity bound",
      "active-area retention",
      "support-coupling status",
    ],
    goCriteria: [
      "layer scaling efficiency at least 0.9",
      "nonadditivity fraction no greater than 0.1",
      "active-area retention at least 0.6",
      "support coupling passes",
    ],
    noGoCriteria: [
      "active area retention below target",
      "nonadditivity exceeds 10%",
      "support coupling fails",
    ],
    unlocks: ["regional_residual_closure", "full_apparatus_tensor"],
    artifactToProduce: "receipt://layer_scaling/447_layer_nonadditivity_v1",
  },
  full_apparatus_tensor: {
    priorityRank: 7,
    decisionQuestion:
      "Can the complete apparatus emit source-side T00, T0i, diagonal Tij, and off-diagonal Tij without metric-target echo?",
    requiredEvidence: [
      "same-chart tensor authority",
      "same-basis and same-unit metadata",
      "T00/T0i/diagonal Tij/off-diagonal Tij component coverage",
      "support, spacer, control, thermal, electrostatic, fatigue, scaling, Casimir, and material-strain terms",
      "wall/hull/exterior regional coverage",
    ],
    goCriteria: [
      "all components present",
      "all apparatus terms present",
      "regional wall/hull/exterior coverage present",
      "no metric-target echo",
    ],
    noGoCriteria: [
      "missing T0i or off-diagonal Tij",
      "support/control/electrostatic/thermal terms hidden",
      "metric-target echo detected or not checked",
    ],
    unlocks: [
      "source_side_same_basis_authority",
      "covariant_conservation",
      "qei_worldline_dossier",
      "observer_family_energy_conditions",
      "coupled_closure",
    ],
    artifactToProduce: "receipt://full_apparatus_tensor/source_side_Tmunu_v1",
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const itemStatus = (surface: Nhm2TileSourceReceiptSurfaceStatusV1): "open" | "falsifying" | "satisfied" => {
  if (surface.status === "pass") return "satisfied";
  if (surface.status === "fail") return "falsifying";
  return "open";
};

export const buildNhm2TileSourceEvidenceGapRoadmap = (
  input: BuildNhm2TileSourceEvidenceGapRoadmapInput,
): Nhm2TileSourceEvidenceGapRoadmapV1 => {
  const materialEvidence = input.materialEvidenceReceipts;
  const roadmapItems = materialEvidence.receiptSurfaces
    .map((surface) => {
      const policy = ROADMAP_POLICY[surface.surfaceId];
      return {
        itemId: surface.surfaceId,
        priorityRank: policy.priorityRank,
        status: itemStatus(surface),
        evidenceTier: surface.evidenceTier,
        evidenceRef: surface.evidenceRef,
        firstBlocker: surface.blockers[0] ?? "none",
        decisionQuestion: policy.decisionQuestion,
        requiredEvidence: policy.requiredEvidence,
        goCriteria: policy.goCriteria,
        noGoCriteria: policy.noGoCriteria,
        numericalMargins: surface.numericalMargins,
        unlocks: policy.unlocks,
        artifactToProduce: policy.artifactToProduce,
      };
    })
    .sort((a, b) => a.priorityRank - b.priorityRank);
  const openItems = roadmapItems.filter((item) => item.status === "open");
  const falsifyingItems = roadmapItems.filter((item) => item.status === "falsifying");
  const satisfiedItems = roadmapItems.filter((item) => item.status === "satisfied");
  const nextItem = falsifyingItems[0] ?? openItems[0] ?? null;
  return {
    contractVersion: NHM2_TILE_SOURCE_EVIDENCE_GAP_ROADMAP_CONTRACT_VERSION,
    generatedAt: materialEvidence.generatedAt,
    laneId: "nhm2_shift_lapse",
    selectedProfileId: materialEvidence.selectedProfileId,
    frozenCandidateId: materialEvidence.frozenCandidateId,
    sourceRefs: {
      materialEvidenceReceiptsRef: input.materialEvidenceReceiptsRef ?? null,
      physicalValidationPlanRef: input.physicalValidationPlanRef ?? null,
    },
    roadmapItems,
    summary: {
      currentDisposition: materialEvidence.summary.candidateDisposition,
      nextBestItemId: nextItem?.itemId ?? "none",
      openItemCount: openItems.length,
      falsifyingItemCount: falsifyingItems.length,
      satisfiedItemCount: satisfiedItems.length,
      materialEvidenceReady: materialEvidence.summary.materialEvidenceReady,
      fullApparatusTensorReady: materialEvidence.summary.fullApparatusTensorReady,
      downstreamGatesPass: input.physicalValidationPlan?.summary.downstreamGatesPass ?? null,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
    claimBoundary: {
      diagnosticOnly: true,
      roadmapOnly: true,
      roadmapDoesNotSupplyEvidence: true,
      idealScalarCasimirIsNotMaterialEvidence: true,
      fullApparatusTensorRequired: true,
      physicalViabilityClaimAllowed: false,
      transportClaimAllowed: false,
      propulsionClaimAllowed: false,
    },
  };
};

export const isNhm2TileSourceEvidenceGapRoadmap = (
  value: unknown,
): value is Nhm2TileSourceEvidenceGapRoadmapV1 => {
  if (!isRecord(value)) return false;
  const summary = isRecord(value.summary) ? value.summary : null;
  const boundary = isRecord(value.claimBoundary) ? value.claimBoundary : null;
  return (
    value.contractVersion === NHM2_TILE_SOURCE_EVIDENCE_GAP_ROADMAP_CONTRACT_VERSION &&
    typeof value.generatedAt === "string" &&
    value.laneId === "nhm2_shift_lapse" &&
    typeof value.selectedProfileId === "string" &&
    value.frozenCandidateId === "nhm2_447_layer_topology_optimized_lattice_tin_v1" &&
    isRecord(value.sourceRefs) &&
    Array.isArray(value.roadmapItems) &&
    value.roadmapItems.length === 7 &&
    value.roadmapItems.every(
      (item) =>
        isRecord(item) &&
        typeof item.itemId === "string" &&
        typeof item.priorityRank === "number" &&
        ["open", "falsifying", "satisfied"].includes(String(item.status)) &&
        typeof item.evidenceTier === "string" &&
        (item.evidenceRef === null || typeof item.evidenceRef === "string") &&
        typeof item.firstBlocker === "string" &&
        typeof item.decisionQuestion === "string" &&
        Array.isArray(item.requiredEvidence) &&
        Array.isArray(item.goCriteria) &&
        Array.isArray(item.noGoCriteria) &&
        isRecord(item.numericalMargins) &&
        Array.isArray(item.unlocks) &&
        typeof item.artifactToProduce === "string",
    ) &&
    summary != null &&
    typeof summary.currentDisposition === "string" &&
    typeof summary.nextBestItemId === "string" &&
    typeof summary.openItemCount === "number" &&
    typeof summary.falsifyingItemCount === "number" &&
    typeof summary.satisfiedItemCount === "number" &&
    typeof summary.materialEvidenceReady === "boolean" &&
    typeof summary.fullApparatusTensorReady === "boolean" &&
    (summary.downstreamGatesPass === null || typeof summary.downstreamGatesPass === "boolean") &&
    summary.physicalViabilityClaimAllowed === false &&
    summary.transportClaimAllowed === false &&
    summary.propulsionClaimAllowed === false &&
    boundary != null &&
    boundary.diagnosticOnly === true &&
    boundary.roadmapOnly === true &&
    boundary.roadmapDoesNotSupplyEvidence === true &&
    boundary.idealScalarCasimirIsNotMaterialEvidence === true &&
    boundary.fullApparatusTensorRequired === true &&
    boundary.physicalViabilityClaimAllowed === false &&
    boundary.transportClaimAllowed === false &&
    boundary.propulsionClaimAllowed === false
  );
};
