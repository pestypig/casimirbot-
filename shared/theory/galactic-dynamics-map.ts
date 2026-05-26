import type { GalacticDynamicsObjectBindingInput } from "./galactic-dynamics-object-bindings";

export type GalacticDynamicsGroupId =
  | "galactic.map.geometry"
  | "galactic.map.velocity"
  | "galactic.rotation.controls"
  | "galactic.accordion.null_model"
  | "galactic.claim_boundary";

export type GalacticDynamicsGroup = {
  id: GalacticDynamicsGroupId;
  title: string;
  band: "map" | "velocity" | "rotation" | "null_model" | "boundary";
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
    input: GalacticDynamicsObjectBindingInput;
  }>;
};

const GALACTIC_BOUNDARY_BADGES = ["galactic.claim_boundary.null_model_only"];

export const GALACTIC_DYNAMICS_GROUPS: GalacticDynamicsGroup[] = [
  {
    id: "galactic.map.geometry",
    title: "Map Geometry",
    band: "map",
    description: "3D star-map separation and inverse-distance structure weight rows.",
    theoryBadgeIds: [
      "galactic.map.distance_3d",
      "galactic.map.structure_weight_proxy",
      "starsim.runtime.build_star_map_fusion_graph",
      ...GALACTIC_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "galactic.map.distance_3d", payloadId: "galactic_distance_3d_payload" },
      { badgeId: "galactic.map.structure_weight_proxy", payloadId: "galactic_structure_weight_payload" },
    ],
    claimBoundaryBadgeIds: GALACTIC_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-local-stream",
        label: "Sample local stream",
        description: "Separation vector (3,4,12) pc with a precomputed 13 pc distance.",
        input: {
          objectId: "galactic:sample-local-stream",
          label: "Sample local stream",
          dx_pc: 3,
          dy_pc: 4,
          dz_pc: 12,
          distance_pc: 13,
        },
      },
    ],
  },
  {
    id: "galactic.map.velocity",
    title: "Relative Velocity",
    band: "velocity",
    description: "3D relative velocity and structure-prior context between star-map nodes.",
    theoryBadgeIds: [
      "galactic.map.relative_velocity",
      "starsim.runtime.build_star_map_fusion_graph",
      ...GALACTIC_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "galactic.map.relative_velocity", payloadId: "galactic_relative_velocity_payload" },
    ],
    claimBoundaryBadgeIds: GALACTIC_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-velocity-stream",
        label: "Sample velocity stream",
        description: "Velocity delta (8,-6,3) km/s between two map nodes.",
        input: {
          objectId: "galactic:sample-velocity-stream",
          label: "Sample velocity stream",
          dvx_kms: 8,
          dvy_kms: -6,
          dvz_kms: 3,
        },
      },
    ],
  },
  {
    id: "galactic.rotation.controls",
    title: "Rotation Controls",
    band: "rotation",
    description: "Newtonian circular velocity, acceleration, and rotation residual helper rows.",
    theoryBadgeIds: [
      "galactic.rotation.circular_velocity_newtonian",
      "galactic.rotation.centripetal_acceleration",
      "galactic.rotation.velocity_residual",
      "galactic.rotation.rms_residual_proxy",
      "galactic.runtime.rotation_controls",
      ...GALACTIC_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [
      { badgeId: "galactic.rotation.circular_velocity_newtonian", payloadId: "galactic_circular_velocity_payload" },
      { badgeId: "galactic.rotation.velocity_residual", payloadId: "galactic_velocity_residual_payload" },
      { badgeId: "galactic.rotation.rms_residual_proxy", payloadId: "galactic_rms_residual_payload" },
    ],
    claimBoundaryBadgeIds: GALACTIC_BOUNDARY_BADGES,
    objectBindings: [
      {
        id: "sample-rotation-control",
        label: "Sample rotation control",
        description: "Enclosed mass 5e10 Msun at 8 kpc, observed 220 km/s, model 190 km/s.",
        input: {
          objectId: "galactic:sample-rotation-control",
          label: "Sample rotation control",
          M_enc: 5e10,
          r_kpc: 8,
          v_obs: 220,
          v_model: 190,
          residual_sum_sq: 900,
          N_points: 1,
        },
      },
    ],
  },
  {
    id: "galactic.accordion.null_model",
    title: "Accordion Null Model",
    band: "null_model",
    description: "Accordion cosmology context and galactic null-model runtime boundary.",
    theoryBadgeIds: [
      "cosmic.low_z.hubble_distance",
      "galactic.runtime.accordion_null_model",
      "galactic.runtime.rotation_controls",
      ...GALACTIC_BOUNDARY_BADGES,
    ],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: GALACTIC_BOUNDARY_BADGES,
    objectBindings: [],
  },
  {
    id: "galactic.claim_boundary",
    title: "Claim Boundary",
    band: "boundary",
    description: "Keeps galactic dynamics rows in null-model and population-prior scope.",
    theoryBadgeIds: [...GALACTIC_BOUNDARY_BADGES],
    calculatorPayloadRefs: [],
    claimBoundaryBadgeIds: GALACTIC_BOUNDARY_BADGES,
    objectBindings: [],
  },
];

export function getGalacticDynamicsGroup(groupId: GalacticDynamicsGroupId): GalacticDynamicsGroup | null {
  return GALACTIC_DYNAMICS_GROUPS.find((group) => group.id === groupId) ?? null;
}
