import type { Nhm2DiagnosticObjectBindingInput } from "./nhm2-diagnostic-object-bindings";

export type QeiStressEnergyGroupId =
  | "qei.stress_energy.unit_bridge"
  | "qei.stress_energy.source_residual"
  | "qei.stress_energy.qei_margin"
  | "qei.stress_energy.energy_condition_gate"
  | "qei.stress_energy.claim_boundary";

export type QeiStressEnergyGroup = {
  id: QeiStressEnergyGroupId;
  title: string;
  band: "units" | "source" | "qei" | "gate" | "boundary";
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
    input: Nhm2DiagnosticObjectBindingInput;
  }>;
};

const NHM2_BOUNDARY_BADGES = ["nhm2.claim_boundary.diagnostic_only"];

export const QEI_STRESS_ENERGY_GROUPS: QeiStressEnergyGroup[] = [
  {
    id: "qei.stress_energy.unit_bridge",
    title: "Stress-Energy Units",
    band: "units",
    description: "Energy-density unit bridge into stress-energy tensor context.",
    theoryBadgeIds: [
      "physics.energy.energy_density",
      "physics.fields.stress_energy_tensor",
      "physics.gr.stress_energy_conservation",
      "nhm2.source.energy_density_proxy",
      ...NHM2_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "physics.energy.energy_density", payloadId: "energy_density_payload" },
      { badgeId: "nhm2.source.energy_density_proxy", payloadId: "rho_equals_E_over_V_payload" },
    ],
    claimBoundaryBadgeIds: NHM2_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-energy-density",
        label: "Sample energy density",
        description: "One joule over one cubic meter for unit-path checks.",
        input: {
          objectId: "qei-stress:sample-energy-density",
          label: "QEI/stress sample energy density",
          E: 1,
          V: 1,
        },
      },
    ],
  },
  {
    id: "qei.stress_energy.source_residual",
    title: "Source Residual",
    band: "source",
    description: "Compares required and available sampled source density.",
    theoryBadgeIds: [
      "nhm2.source.energy_density_proxy",
      "nhm2.closure.wall_t00_source_residual",
      "nhm2.closure.source_residual",
      "nhm2.source.wall_t00_trace",
      "nhm2.source.same_basis_tensor_authority",
      "nhm2.energy_condition.diagnostic_gate",
      ...NHM2_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "nhm2.source.energy_density_proxy", payloadId: "rho_equals_E_over_V_payload" },
      { badgeId: "nhm2.closure.wall_t00_source_residual", payloadId: "wall_t00_source_residual_payload" },
      { badgeId: "nhm2.closure.source_residual", payloadId: "source_residual_difference_payload" },
    ],
    claimBoundaryBadgeIds: NHM2_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-source-margin",
        label: "Sample source margin",
        description: "Required density 1 and available density 0.8.",
        input: {
          objectId: "qei-stress:sample-source-margin",
          label: "QEI/stress sample source residual",
          E: 1,
          V: 1,
          T00_wall_required: 1,
          T00_wall_available: 0.8,
          source_required: 1,
          source_available: 0.8,
        },
      },
    ],
  },
  {
    id: "qei.stress_energy.qei_margin",
    title: "QEI Badge Replay Margin",
    band: "qei",
    description: "Computes the scalar badge replay margin; the worldline dossier remains the runtime QEI evidence surface.",
    theoryBadgeIds: [
      "physics.energy.energy_density",
      "nhm2.source.energy_density_proxy",
      "nhm2.qei.sampling_window",
      "nhm2.qei.worldline_dossier",
      ...NHM2_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "nhm2.qei.sampling_window", payloadId: "qei_margin_difference_payload" },
    ],
    claimBoundaryBadgeIds: NHM2_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-qei-margin",
        label: "Sample QEI badge replay margin",
        description: "Bound 1 minus sample 0.9 in energy-density units.",
        input: {
          objectId: "qei-stress:sample-qei-margin",
          label: "QEI/stress sample badge replay margin",
          qei_bound: 1,
          qei_sample: 0.9,
        },
      },
    ],
  },
  {
    id: "qei.stress_energy.energy_condition_gate",
    title: "Energy-Condition Gate",
    band: "gate",
    description: "Shows source residual and QEI badge replay margin feeding a diagnostic gate context.",
    theoryBadgeIds: [
      "nhm2.closure.wall_t00_source_residual",
      "nhm2.closure.source_residual",
      "nhm2.source.wall_t00_trace",
      "nhm2.source.same_basis_tensor_authority",
      "nhm2.qei.sampling_window",
      "nhm2.qei.worldline_dossier",
      "nhm2.energy_condition.diagnostic_gate",
      ...NHM2_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "nhm2.closure.wall_t00_source_residual", payloadId: "wall_t00_source_residual_payload" },
      { badgeId: "nhm2.closure.source_residual", payloadId: "source_residual_difference_payload" },
      { badgeId: "nhm2.qei.sampling_window", payloadId: "qei_margin_difference_payload" },
    ],
    claimBoundaryBadgeIds: NHM2_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-gate-margins",
        label: "Sample gate margins",
        description: "Source and QEI scalar rows for a gate-context check.",
        input: {
          objectId: "qei-stress:sample-gate-margins",
          label: "QEI/stress sample gate margins",
          T00_wall_required: 1,
          T00_wall_available: 0.8,
          source_required: 1,
          source_available: 0.8,
          qei_bound: 1,
          qei_sample: 0.9,
        },
      },
    ],
  },
  {
    id: "qei.stress_energy.claim_boundary",
    title: "Claim Boundary",
    band: "boundary",
    description: "Keeps QEI and stress-energy rows diagnostic-only.",
    theoryBadgeIds: ["nhm2.qei.worldline_dossier", ...NHM2_BOUNDARY_BADGES],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: NHM2_BOUNDARY_BADGES,
    objectBindings: [],
  },
];

export function getQeiStressEnergyGroup(groupId: QeiStressEnergyGroupId): QeiStressEnergyGroup | null {
  return QEI_STRESS_ENERGY_GROUPS.find((group) => group.id === groupId) ?? null;
}
