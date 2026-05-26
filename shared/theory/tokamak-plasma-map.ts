import type { TokamakPlasmaObjectBindingInput } from "./tokamak-plasma-object-bindings";

export type TokamakPlasmaGroupId =
  | "tokamak.plasma.pressure_beta"
  | "tokamak.plasma.power_confinement"
  | "tokamak.plasma.precursor_margin"
  | "tokamak.plasma.flux_bands"
  | "tokamak.plasma.claim_boundary";

export type TokamakPlasmaGroup = {
  id: TokamakPlasmaGroupId;
  title: string;
  band: "pressure" | "power" | "precursor" | "flux" | "boundary";
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
    input: TokamakPlasmaObjectBindingInput;
  }>;
};

const TOKAMAK_BOUNDARY_BADGES = ["tokamak.claim_boundary.diagnostic_proxy"];

export const TOKAMAK_PLASMA_GROUPS: TokamakPlasmaGroup[] = [
  {
    id: "tokamak.plasma.pressure_beta",
    title: "Pressure / Beta",
    band: "pressure",
    description: "Magnetic pressure, thermal pressure, and plasma beta proxy rows.",
    theoryBadgeIds: [
      "tokamak.plasma.magnetic_pressure",
      "tokamak.plasma.thermal_pressure_proxy",
      "tokamak.plasma.beta_proxy",
      "tokamak.runtime.energy_field",
      ...TOKAMAK_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "tokamak.plasma.magnetic_pressure", payloadId: "tokamak_magnetic_pressure_payload" },
      { badgeId: "tokamak.plasma.thermal_pressure_proxy", payloadId: "tokamak_thermal_pressure_payload" },
      { badgeId: "tokamak.plasma.beta_proxy", payloadId: "tokamak_beta_proxy_payload" },
    ],
    claimBoundaryBadgeIds: TOKAMAK_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-hmode-beta",
        label: "Sample H-mode beta",
        description: "B=5.3 T, n=1e20 m^-3, T=10 keV, and pressure proxy.",
        input: {
          objectId: "tokamak:sample-hmode-beta",
          label: "Sample H-mode beta proxy",
          B_T: 5.3,
          p_B: 11176683.7,
          n_m3: 1e20,
          T_eV: 10000,
          p_Pa: 160217.6634,
        },
      },
    ],
  },
  {
    id: "tokamak.plasma.power_confinement",
    title: "Power / Confinement",
    band: "power",
    description: "Net power and thermal-energy confinement proxy rows.",
    theoryBadgeIds: [
      "physics.energy.power_rate",
      "tokamak.energy.power_balance",
      "tokamak.energy.confinement_time_proxy",
      "tokamak.runtime.energy_field",
      ...TOKAMAK_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "tokamak.energy.power_balance", payloadId: "tokamak_power_balance_payload" },
      { badgeId: "tokamak.energy.confinement_time_proxy", payloadId: "tokamak_confinement_energy_payload" },
    ],
    claimBoundaryBadgeIds: TOKAMAK_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-power-balance",
        label: "Sample power balance",
        description: "Input 50 MW, loss 42 MW, and tau_E=0.8 s.",
        input: {
          objectId: "tokamak:sample-power-balance",
          label: "Sample tokamak power balance",
          P_in: 5e7,
          P_loss: 4.2e7,
          tau_E: 0.8,
        },
      },
    ],
  },
  {
    id: "tokamak.plasma.precursor_margin",
    title: "Precursor Margin",
    band: "precursor",
    description: "A scalar score-threshold margin around precursor detection reports.",
    theoryBadgeIds: [
      "tokamak.precursor.score_margin",
      "tokamak.runtime.synthetic_diagnostics",
      "tokamak.runtime.precursor_report",
      ...TOKAMAK_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "tokamak.precursor.score_margin", payloadId: "tokamak_precursor_margin_payload" },
    ],
    claimBoundaryBadgeIds: TOKAMAK_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-precursor-margin",
        label: "Sample precursor margin",
        description: "Score 0.74 against a 0.65 diagnostic threshold.",
        input: {
          objectId: "tokamak:sample-precursor-margin",
          label: "Sample tokamak precursor margin",
          score: 0.74,
          threshold: 0.65,
        },
      },
    ],
  },
  {
    id: "tokamak.plasma.flux_bands",
    title: "Flux Bands",
    band: "flux",
    description: "Core, edge, and scrape-off-layer fraction helper rows.",
    theoryBadgeIds: [
      "tokamak.flux.core_fraction",
      "tokamak.flux.edge_fraction",
      "tokamak.runtime.energy_field",
      ...TOKAMAK_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "tokamak.flux.core_fraction", payloadId: "tokamak_core_fraction_payload" },
      { badgeId: "tokamak.flux.edge_fraction", payloadId: "tokamak_edge_fraction_payload" },
    ],
    claimBoundaryBadgeIds: TOKAMAK_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-flux-bands",
        label: "Sample flux bands",
        description: "Core 640 and edge 210 cells out of 1000 valid cells.",
        input: {
          objectId: "tokamak:sample-flux-bands",
          label: "Sample tokamak flux bands",
          core_count: 640,
          edge_count: 210,
          sol_count: 150,
          total_count: 1000,
        },
      },
    ],
  },
  {
    id: "tokamak.plasma.claim_boundary",
    title: "Claim Boundary",
    band: "boundary",
    description: "Keeps tokamak scalar rows separate from runtime stability claims.",
    theoryBadgeIds: [...TOKAMAK_BOUNDARY_BADGES],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: TOKAMAK_BOUNDARY_BADGES,
    objectBindings: [],
  },
];

export function getTokamakPlasmaGroup(groupId: TokamakPlasmaGroupId): TokamakPlasmaGroup | null {
  return TOKAMAK_PLASMA_GROUPS.find((group) => group.id === groupId) ?? null;
}
