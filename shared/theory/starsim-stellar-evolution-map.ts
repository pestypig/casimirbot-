export type StarSimStellarEvolutionStageId =
  | "starsim.lifecycle.molecular_cloud"
  | "starsim.lifecycle.protostar"
  | "starsim.lifecycle.main_sequence"
  | "starsim.lifecycle.red_giant"
  | "starsim.lifecycle.red_supergiant"
  | "starsim.lifecycle.white_dwarf"
  | "starsim.lifecycle.supernova"
  | "starsim.lifecycle.neutron_star"
  | "starsim.lifecycle.black_hole"
  | "starsim.lifecycle.black_dwarf";

export type StarSimStellarEvolutionStage = {
  id: StarSimStellarEvolutionStageId;
  title: string;
  phase: "birth" | "main_sequence" | "old_age" | "death" | "remnant";
  compactLabel: string;
  colorClass: "cyan" | "amber" | "rose" | "violet" | "slate" | "emerald";
  query: string;
  objectClass: string;
  theoryBadgeIds: string[];
  calculatorPayloadRefs: Array<{
    badgeId: string;
    payloadId: string;
  }>;
  claimBoundaryBadgeIds: string[];
};

const COMMON_OBSERVABLE_BADGES = [
  "starsim.observable.surface_temperature_proxy",
  "starsim.observable.surface_gravity",
  "starsim.observable.mean_density",
];

const COMMON_STRUCTURE_BADGES = [
  "starsim.structure.mass_continuity",
  "starsim.structure.hydrostatic_balance",
  "starsim.structure.core_temperature_proxy",
  "starsim.structure.core_density_proxy",
];

const COMMON_CALCULATOR_PAYLOADS = [
  {
    badgeId: "starsim.observable.surface_temperature_proxy",
    payloadId: "teff_from_luminosity_radius_payload",
  },
  {
    badgeId: "starsim.observable.surface_gravity",
    payloadId: "surface_gravity_payload",
  },
  {
    badgeId: "starsim.observable.mean_density",
    payloadId: "mean_density_payload",
  },
];

const STARSIM_BOUNDARY_BADGES = ["starsim.claim_boundary.stage1_reduced_order_prior"];

export const STARSIM_STELLAR_EVOLUTION_STAGES: StarSimStellarEvolutionStage[] = [
  {
    id: "starsim.lifecycle.molecular_cloud",
    title: "Molecular Cloud",
    phase: "birth",
    compactLabel: "Cloud",
    colorClass: "slate",
    query: "molecular cloud stellar birth density gravity starsim",
    objectClass: "prestellar_cloud",
    theoryBadgeIds: [
      "physics.units.dimension_consistency",
      "starsim.observable.mean_density",
      "starsim.structure.mass_continuity",
      "starsim.structure.hydrostatic_balance",
      ...STARSIM_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      {
        badgeId: "starsim.observable.mean_density",
        payloadId: "mean_density_payload",
      },
    ],
    claimBoundaryBadgeIds: STARSIM_BOUNDARY_BADGES,
  },
  {
    id: "starsim.lifecycle.protostar",
    title: "Protostar",
    phase: "birth",
    compactLabel: "Proto",
    colorClass: "amber",
    query: "protostar contraction temperature surface gravity starsim",
    objectClass: "protostar",
    theoryBadgeIds: [
      ...COMMON_OBSERVABLE_BADGES,
      "starsim.structure.hydrostatic_balance",
      "starsim.structure.core_temperature_proxy",
      ...STARSIM_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      ...COMMON_CALCULATOR_PAYLOADS,
      {
        badgeId: "starsim.structure.core_temperature_proxy",
        payloadId: "core_temperature_proxy_payload",
      },
    ],
    claimBoundaryBadgeIds: STARSIM_BOUNDARY_BADGES,
  },
  {
    id: "starsim.lifecycle.main_sequence",
    title: "Main Sequence",
    phase: "main_sequence",
    compactLabel: "Main",
    colorClass: "cyan",
    query: "main sequence stellar luminosity radius temperature pp chain cno starsim",
    objectClass: "main_sequence",
    theoryBadgeIds: [
      ...COMMON_OBSERVABLE_BADGES,
      ...COMMON_STRUCTURE_BADGES,
      "starsim.fusion.pp_chain_prior",
      "starsim.fusion.cno_cycle_prior",
      "starsim.fusion_zone.active_volume_fraction",
      "starsim.runtime.evaluate_fusion_microphysics",
      ...STARSIM_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      ...COMMON_CALCULATOR_PAYLOADS,
      {
        badgeId: "starsim.structure.core_temperature_proxy",
        payloadId: "core_temperature_proxy_payload",
      },
      {
        badgeId: "starsim.structure.core_density_proxy",
        payloadId: "core_density_proxy_payload",
      },
      {
        badgeId: "starsim.fusion_zone.active_volume_fraction",
        payloadId: "active_volume_fraction_payload",
      },
    ],
    claimBoundaryBadgeIds: STARSIM_BOUNDARY_BADGES,
  },
  {
    id: "starsim.lifecycle.red_giant",
    title: "Red Giant",
    phase: "old_age",
    compactLabel: "Giant",
    colorClass: "rose",
    query: "red giant shell fusion luminosity radius fusion zone starsim",
    objectClass: "red_giant",
    theoryBadgeIds: [
      ...COMMON_OBSERVABLE_BADGES,
      ...COMMON_STRUCTURE_BADGES,
      "starsim.fusion.pp_chain_prior",
      "starsim.fusion_zone.active_volume_fraction",
      "starsim.runtime.evaluate_fusion_microphysics",
      ...STARSIM_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      ...COMMON_CALCULATOR_PAYLOADS,
      {
        badgeId: "starsim.structure.core_temperature_proxy",
        payloadId: "core_temperature_proxy_payload",
      },
      {
        badgeId: "starsim.fusion_zone.active_volume_fraction",
        payloadId: "active_volume_fraction_payload",
      },
    ],
    claimBoundaryBadgeIds: STARSIM_BOUNDARY_BADGES,
  },
  {
    id: "starsim.lifecycle.red_supergiant",
    title: "Red Supergiant",
    phase: "old_age",
    compactLabel: "Super",
    colorClass: "rose",
    query: "red supergiant high mass cno shell fusion starsim",
    objectClass: "red_supergiant",
    theoryBadgeIds: [
      ...COMMON_OBSERVABLE_BADGES,
      ...COMMON_STRUCTURE_BADGES,
      "starsim.fusion.cno_cycle_prior",
      "starsim.fusion_zone.active_volume_fraction",
      "starsim.runtime.evaluate_fusion_microphysics",
      ...STARSIM_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      ...COMMON_CALCULATOR_PAYLOADS,
      {
        badgeId: "starsim.structure.core_temperature_proxy",
        payloadId: "core_temperature_proxy_payload",
      },
      {
        badgeId: "starsim.structure.core_density_proxy",
        payloadId: "core_density_proxy_payload",
      },
      {
        badgeId: "starsim.fusion_zone.active_volume_fraction",
        payloadId: "active_volume_fraction_payload",
      },
    ],
    claimBoundaryBadgeIds: STARSIM_BOUNDARY_BADGES,
  },
  {
    id: "starsim.lifecycle.white_dwarf",
    title: "White Dwarf",
    phase: "remnant",
    compactLabel: "White",
    colorClass: "slate",
    query: "white dwarf compact object not fusing starsim",
    objectClass: "white_dwarf",
    theoryBadgeIds: [
      "starsim.fusion.compact_object_not_fusing",
      "starsim.runtime.evaluate_fusion_microphysics",
      ...STARSIM_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: STARSIM_BOUNDARY_BADGES,
  },
  {
    id: "starsim.lifecycle.supernova",
    title: "Supernova",
    phase: "death",
    compactLabel: "SN",
    colorClass: "violet",
    query: "supernova death remnant compact object starsim",
    objectClass: "supernova_context",
    theoryBadgeIds: [
      "starsim.fusion.cno_cycle_prior",
      "starsim.fusion.compact_object_not_fusing",
      "starsim.runtime.evaluate_fusion_microphysics",
      ...STARSIM_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: STARSIM_BOUNDARY_BADGES,
  },
  {
    id: "starsim.lifecycle.neutron_star",
    title: "Neutron Star",
    phase: "remnant",
    compactLabel: "NS",
    colorClass: "violet",
    query: "neutron star compact object not fusing starsim",
    objectClass: "neutron_star",
    theoryBadgeIds: [
      "starsim.fusion.compact_object_not_fusing",
      "starsim.runtime.evaluate_fusion_microphysics",
      ...STARSIM_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: STARSIM_BOUNDARY_BADGES,
  },
  {
    id: "starsim.lifecycle.black_hole",
    title: "Black Hole",
    phase: "remnant",
    compactLabel: "BH",
    colorClass: "slate",
    query: "black hole compact remnant not ordinary stellar fusion starsim",
    objectClass: "black_hole_context",
    theoryBadgeIds: [
      "starsim.fusion.compact_object_not_fusing",
      "starsim.runtime.evaluate_fusion_microphysics",
      ...STARSIM_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: STARSIM_BOUNDARY_BADGES,
  },
  {
    id: "starsim.lifecycle.black_dwarf",
    title: "Black Dwarf",
    phase: "remnant",
    compactLabel: "Dark",
    colorClass: "slate",
    query: "black dwarf inactive fusion remnant starsim",
    objectClass: "black_dwarf_context",
    theoryBadgeIds: [
      "starsim.fusion.compact_object_not_fusing",
      "starsim.runtime.evaluate_fusion_microphysics",
      ...STARSIM_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: STARSIM_BOUNDARY_BADGES,
  },
];

export function getStarSimStellarEvolutionStage(
  stageId: StarSimStellarEvolutionStageId,
): StarSimStellarEvolutionStage | null {
  return STARSIM_STELLAR_EVOLUTION_STAGES.find((stage) => stage.id === stageId) ?? null;
}
