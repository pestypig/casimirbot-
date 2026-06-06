import type { StarSimObjectBindingInput } from "./starsim-object-bindings";

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
  objectBindings: Array<{
    id: string;
    label: string;
    description: string;
    input: StarSimObjectBindingInput;
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

const COMMON_CLASSIFIER_MARGIN_BADGES = [
  "starsim.classifier.compactness_scale",
  "starsim.classifier.brown_dwarf_mass_margin",
  "starsim.classifier.cno_mass_margin",
  "starsim.classifier.cno_temperature_margin",
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

export const STARSIM_RESTORATION_BRANCH_BADGES = [
  "starsim.restoration.deep_mixing_mass_flux",
  "starsim.restoration.tachocline_downflow_setpoint",
  "starsim.restoration.core_hydrogen_balance",
  "starsim.restoration.lifetime_extension_proxy",
  "starsim.restoration.guardrail_constraints",
  "starsim.restoration.transition_hazard_proxy",
  "starsim.restoration.claim_boundary.planning_forecast_only",
] as const;

const STARSIM_RESTORATION_CALCULATOR_PAYLOADS = [
  {
    badgeId: "starsim.restoration.deep_mixing_mass_flux",
    payloadId: "deep_mixing_mass_flux_payload",
  },
  {
    badgeId: "starsim.restoration.tachocline_downflow_setpoint",
    payloadId: "tachocline_downflow_setpoint_payload",
  },
  {
    badgeId: "starsim.restoration.core_hydrogen_balance",
    payloadId: "hydrogen_burning_mass_rate_payload",
  },
  {
    badgeId: "starsim.restoration.core_hydrogen_balance",
    payloadId: "core_hydrogen_balance_payload",
  },
  {
    badgeId: "starsim.restoration.lifetime_extension_proxy",
    payloadId: "lifetime_extension_proxy_payload",
  },
  {
    badgeId: "starsim.restoration.guardrail_constraints",
    payloadId: "luminosity_guardrail_margin_payload",
  },
  {
    badgeId: "starsim.restoration.guardrail_constraints",
    payloadId: "core_temperature_guardrail_margin_payload",
  },
  {
    badgeId: "starsim.restoration.transition_hazard_proxy",
    payloadId: "transition_hazard_proxy_payload",
  },
] as const;

const normalizedSolarG = 1;

const baseChannel = {
  channelTemperature_K: 15000000,
  channelDensity_g_cm3: 150,
  gravitationalConstantNormalized: normalizedSolarG,
};

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
    objectBindings: [
      {
        id: "molecular-cloud-dense-core",
        label: "Dense core proxy",
        description: "Mass/radius proxy for a compact prestellar cloud region.",
        input: {
          objectId: "starsim-object:molecular-cloud-dense-core",
          label: "Dense core proxy",
          objectClass: "prestellar_cloud",
          mass_Msun: 2.5,
          radius_Rsun: 180,
          source: "manual",
        },
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
      "starsim.classifier.compactness_scale",
      ...STARSIM_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      ...COMMON_CALCULATOR_PAYLOADS,
      {
        badgeId: "starsim.structure.core_temperature_proxy",
        payloadId: "core_temperature_proxy_payload",
      },
    ],
    objectBindings: [
      {
        id: "protostar-low-mass",
        label: "Low-mass protostar",
        description: "Young contracting object with inflated radius and weak luminosity.",
        input: {
          objectId: "starsim-object:protostar-low-mass",
          label: "Low-mass protostar",
          objectClass: "protostar",
          spectralType: "protostar",
          luminosity_Lsun: 0.8,
          radius_Rsun: 3.2,
          mass_Msun: 0.7,
          ...baseChannel,
          source: "manual",
        },
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
      ...COMMON_CLASSIFIER_MARGIN_BADGES,
      "starsim.fusion.pp_chain_prior",
      "starsim.fusion.cno_cycle_prior",
      "starsim.fusion_zone.active_volume_fraction",
      "starsim.runtime.evaluate_fusion_microphysics",
      ...STARSIM_RESTORATION_BRANCH_BADGES,
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
      ...STARSIM_RESTORATION_CALCULATOR_PAYLOADS,
    ],
    objectBindings: [
      {
        id: "main-sequence-solar-analog",
        label: "Solar analog",
        description: "G2V-like main-sequence object with solar-normalized observables.",
        input: {
          objectId: "starsim-object:solar-analog",
          label: "Solar analog",
          objectClass: "main_sequence",
          spectralType: "G2V",
          luminosity_Lsun: 1,
          radius_Rsun: 1,
          mass_Msun: 1,
          r90_Rstar: 0.25,
          ...baseChannel,
          source: "manual",
        },
      },
      {
        id: "main-sequence-hot-cno-candidate",
        label: "Hot CNO candidate",
        description: "Hotter, heavier main-sequence proxy for CNO-prior context.",
        input: {
          objectId: "starsim-object:hot-cno-candidate",
          label: "Hot CNO candidate",
          objectClass: "main_sequence",
          spectralType: "A5V",
          luminosity_Lsun: 8,
          radius_Rsun: 1.8,
          mass_Msun: 1.7,
          r90_Rstar: 0.18,
          channelTemperature_K: 21000000,
          channelDensity_g_cm3: 90,
          gravitationalConstantNormalized: normalizedSolarG,
          source: "manual",
        },
      },
    ],
    claimBoundaryBadgeIds: [
      ...STARSIM_BOUNDARY_BADGES,
      "starsim.restoration.claim_boundary.planning_forecast_only",
    ],
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
      ...COMMON_CLASSIFIER_MARGIN_BADGES,
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
    objectBindings: [
      {
        id: "red-giant-k1iii",
        label: "K1III red giant",
        description: "Expanded red giant sample for shell-fusion context.",
        input: {
          objectId: "starsim-object:red-giant-k1iii",
          label: "K1III red giant",
          objectClass: "red_giant",
          spectralType: "K1III",
          luminosity_Lsun: 65,
          radius_Rsun: 12,
          mass_Msun: 1.1,
          r90_Rstar: 0.42,
          channelTemperature_K: 12000000,
          channelDensity_g_cm3: 35,
          gravitationalConstantNormalized: normalizedSolarG,
          source: "manual",
        },
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
      ...COMMON_CLASSIFIER_MARGIN_BADGES,
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
    objectBindings: [
      {
        id: "red-supergiant-massive",
        label: "Massive red supergiant",
        description: "High-luminosity expanded star for late massive-star context.",
        input: {
          objectId: "starsim-object:red-supergiant-massive",
          label: "Massive red supergiant",
          objectClass: "red_supergiant",
          spectralType: "M2I",
          luminosity_Lsun: 90000,
          radius_Rsun: 650,
          mass_Msun: 16,
          r90_Rstar: 0.58,
          channelTemperature_K: 26000000,
          channelDensity_g_cm3: 18,
          gravitationalConstantNormalized: normalizedSolarG,
          source: "manual",
        },
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
    objectBindings: [
      {
        id: "white-dwarf-remnant",
        label: "White dwarf remnant",
        description: "Compact remnant context; calculator rows are intentionally absent.",
        input: {
          objectId: "starsim-object:white-dwarf-remnant",
          label: "White dwarf remnant",
          objectClass: "white_dwarf",
          spectralType: "DA",
          mass_Msun: 0.62,
          radius_Rsun: 0.012,
          source: "manual",
        },
      },
    ],
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
    objectBindings: [
      {
        id: "supernova-context",
        label: "Supernova context",
        description: "Death-stage context that routes to runtime/reference badges.",
        input: {
          objectId: "starsim-object:supernova-context",
          label: "Supernova context",
          objectClass: "supernova_context",
          mass_Msun: 16,
          source: "manual",
        },
      },
    ],
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
    objectBindings: [
      {
        id: "neutron-star-remnant",
        label: "Neutron star remnant",
        description: "Compact quantum-fluid context; not a pp-chain fusion case.",
        input: {
          objectId: "starsim-object:neutron-star-remnant",
          label: "Neutron star remnant",
          objectClass: "neutron_star",
          mass_Msun: 1.4,
          radius_Rsun: 0.000016,
          source: "manual",
        },
      },
    ],
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
    objectBindings: [
      {
        id: "black-hole-remnant-context",
        label: "Black hole context",
        description: "Compact remnant context; no scalar StarSim fusion solve.",
        input: {
          objectId: "starsim-object:black-hole-remnant-context",
          label: "Black hole context",
          objectClass: "black_hole_context",
          mass_Msun: 8,
          source: "manual",
        },
      },
    ],
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
    objectBindings: [
      {
        id: "black-dwarf-context",
        label: "Black dwarf context",
        description: "Hypothetical cold remnant context with inactive fusion.",
        input: {
          objectId: "starsim-object:black-dwarf-context",
          label: "Black dwarf context",
          objectClass: "black_dwarf_context",
          mass_Msun: 0.6,
          radius_Rsun: 0.01,
          source: "manual",
        },
      },
    ],
    claimBoundaryBadgeIds: STARSIM_BOUNDARY_BADGES,
  },
];

export function getStarSimStellarEvolutionStage(
  stageId: StarSimStellarEvolutionStageId,
): StarSimStellarEvolutionStage | null {
  return STARSIM_STELLAR_EVOLUTION_STAGES.find((stage) => stage.id === stageId) ?? null;
}
