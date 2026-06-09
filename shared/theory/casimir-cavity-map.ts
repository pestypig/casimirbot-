import type { CasimirCavityObjectBindingInput } from "./casimir-cavity-object-bindings";

export type CasimirCavityGroupId =
  | "casimir.cavity.parallel_plate_tile"
  | "casimir.cavity.tile_budget"
  | "casimir.cavity.mode_frequency"
  | "casimir.cavity.claim_boundary";

export type CasimirCavityGroup = {
  id: CasimirCavityGroupId;
  title: string;
  band: "static" | "budget" | "mode" | "boundary";
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
    input: CasimirCavityObjectBindingInput;
  }>;
};

const CASIMIR_BOUNDARY_BADGES = ["casimir.claim_boundary.diagnostic_source_context"];

export const CASIMIR_CAVITY_GROUPS: CasimirCavityGroup[] = [
  {
    id: "casimir.cavity.parallel_plate_tile",
    title: "Parallel Plate Tile",
    band: "static",
    description: "Static Casimir energy and pressure proxies for one idealized plate pair.",
    theoryBadgeIds: [
      "casimir.cavity.parallel_plate_energy_density",
      "casimir.cavity.parallel_plate_pressure",
      "casimir.cavity.per_tile_energy",
      "casimir.runtime.static_casimir_module",
      ...CASIMIR_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "casimir.cavity.parallel_plate_energy_density", payloadId: "casimir_energy_per_area_payload" },
      { badgeId: "casimir.cavity.parallel_plate_pressure", payloadId: "casimir_pressure_payload" },
      { badgeId: "casimir.cavity.per_tile_energy", payloadId: "casimir_per_tile_energy_payload" },
    ],
    claimBoundaryBadgeIds: CASIMIR_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "ideal-1nm-25cm2-tile",
        label: "1 nm / 25 cm2 tile",
        description: "Idealized 1 nm gap and 25 cm2 footprint from the mechanism note.",
        input: {
          objectId: "casimir-cavity:ideal-1nm-25cm2-tile",
          label: "Ideal 1 nm Casimir tile",
          a: 1e-9,
          A_tile: 2.5e-3,
          E_area: -0.4333,
          E_tile: -0.001083,
          absE_tile: 0.001083,
        },
      },
    ],
  },
  {
    id: "casimir.cavity.tile_budget",
    title: "Tile Budget Chain",
    band: "budget",
    description: "Aggregate static energy, geometry gain, output energy, and mass proxy rows.",
    theoryBadgeIds: [
      "casimir.cavity.parallel_plate_energy_density",
      "casimir.cavity.per_tile_energy",
      "casimir.cavity.static_tile_budget",
      "casimir.tile.duty_budget",
      "casimir.cavity.geometry_gain",
      "casimir.cavity.output_energy_proxy",
      "casimir.cavity.mass_equivalent_proxy",
      "casimir.material_receipts",
      "casimir.material.lifshitz_receipt",
      "casimir.geometry.beyond_pfa_validity",
      "nhm2.source.energy_density_proxy",
      ...CASIMIR_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "casimir.cavity.parallel_plate_energy_density", payloadId: "casimir_energy_per_area_payload" },
      { badgeId: "casimir.cavity.per_tile_energy", payloadId: "casimir_per_tile_energy_payload" },
      { badgeId: "casimir.cavity.static_tile_budget", payloadId: "casimir_static_budget_payload" },
      { badgeId: "casimir.tile.duty_budget", payloadId: "casimir_effective_sector_duty_payload" },
      { badgeId: "casimir.cavity.geometry_gain", payloadId: "casimir_geometry_gain_payload" },
      { badgeId: "casimir.cavity.output_energy_proxy", payloadId: "casimir_output_energy_proxy_payload" },
      { badgeId: "casimir.cavity.mass_equivalent_proxy", payloadId: "casimir_mass_equivalent_proxy_payload" },
      { badgeId: "nhm2.source.energy_density_proxy", payloadId: "rho_equals_E_over_V_payload" },
    ],
    claimBoundaryBadgeIds: CASIMIR_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "mechanism-note-green-zone",
        label: "Mechanism note budget",
        description: "Mechanism-note defaults for static budget and green-zone gain proxy.",
        input: {
          objectId: "casimir-cavity:mechanism-note-green-zone",
          label: "Casimir mechanism-note budget",
          a: 1e-9,
          A_tile: 2.5e-3,
          E_area: -0.4333,
          E_tile: -0.001083,
          absE_tile: 0.001083,
          N_tiles: 1.97e9,
          U_static: -2.13e6,
          absU_static: 2.13e6,
          gammaGeo: 26,
          Q_L: 1e9,
          gamma_VdB: 1.3485e5,
          d_burst: 0.12,
          d_cycle: 0.12,
          N_concurrent: 2,
          N_sector: 80,
          d_eff: 2.5e-5,
          E_out: 1.263e20,
        },
      },
    ],
  },
  {
    id: "casimir.cavity.mode_frequency",
    title: "Cavity Mode",
    band: "mode",
    description: "Simple standing-wave cavity frequency and photon energy rows.",
    theoryBadgeIds: [
      "physics.constants.speed_of_light",
      "physics.quantum.energy_frequency",
      "casimir.cavity.mode_frequency",
      "casimir.cavity.mode_photon_energy",
      ...CASIMIR_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "casimir.cavity.mode_frequency", payloadId: "cavity_mode_frequency_payload" },
      { badgeId: "casimir.cavity.mode_photon_energy", payloadId: "cavity_mode_photon_energy_payload" },
    ],
    claimBoundaryBadgeIds: CASIMIR_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "one-centimeter-fundamental",
        label: "1 cm fundamental",
        description: "n=1 standing-wave proxy in a 1 cm cavity.",
        input: {
          objectId: "casimir-cavity:one-centimeter-fundamental",
          label: "1 cm cavity mode proxy",
          L: 0.01,
          n: 1,
          f_n: 14989622900,
        },
      },
    ],
  },
  {
    id: "casimir.cavity.claim_boundary",
    title: "Claim Boundary",
    band: "boundary",
    description: "Keeps Casimir rows in diagnostic/source-context scope.",
    theoryBadgeIds: [
      "casimir.material_receipts",
      "casimir.material.lifshitz_receipt",
      "casimir.geometry.beyond_pfa_validity",
      ...CASIMIR_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: CASIMIR_BOUNDARY_BADGES,
    objectBindings: [],
  },
];

export function getCasimirCavityGroup(groupId: CasimirCavityGroupId): CasimirCavityGroup | null {
  return CASIMIR_CAVITY_GROUPS.find((group) => group.id === groupId) ?? null;
}
