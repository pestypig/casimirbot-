import type {
  LaneBundleV1,
  ObservableContractV1,
  ObservableResponseModelRefV1,
  SharedObservableTimeMode,
} from "./observable-contract.v1";

export const FUSION_LANE_CONTRACT_SCHEMA_VERSION = "fusion_lane_contract/v1";

export const FUSION_CONFINEMENT_MODE_VALUES = ["magnetic", "inertial"] as const;
export const FUSION_DEVICE_CLASS_VALUES = [
  "tokamak",
  "stellarator",
  "laser_implosion",
  "z_pinch",
  "other",
] as const;
export const FUSION_DIAGNOSTIC_KIND_VALUES = [
  "interferometer",
  "bolometer",
  "reflectometer",
  "spectroscopy",
  "neutron",
  "xray",
  "profile_reconstruction",
] as const;

export type FusionConfinementMode = (typeof FUSION_CONFINEMENT_MODE_VALUES)[number];
export type FusionDeviceClass = (typeof FUSION_DEVICE_CLASS_VALUES)[number];
export type FusionDiagnosticKind = (typeof FUSION_DIAGNOSTIC_KIND_VALUES)[number];

export interface FusionGeometryStateV1 {
  confinement_mode: FusionConfinementMode;
  device_class: FusionDeviceClass;
  equilibrium_ref?: string;
  vessel_geometry_ref?: string;
  diagnostic_sightline_refs?: string[];
}

export interface FusionForcingStateV1 {
  heating_refs?: string[];
  fueling_refs?: string[];
  actuator_refs?: string[];
  external_circuit_refs?: string[];
}

export interface FusionPlasmaStateV1 {
  profile_ref: string;
  profile_ids?: string[];
  species_refs?: string[];
}

export interface FusionClosureStateV1 {
  reactivity_ref?: string;
  transport_model_ref?: string;
  emissivity_model_refs?: string[];
  synthetic_response_refs?: string[];
}

export interface FusionImasBindingV1 {
  ids_roots?: string[];
  time_mode?: SharedObservableTimeMode;
  coordinate_notes?: string;
  errorbar_ref?: string;
}

export interface FusionObservableContractV1 extends ObservableContractV1 {
  lane_id: "fusion_plasma_diagnostics";
  diagnostic_kind: FusionDiagnosticKind;
  channel_ids?: string[];
  response_model?: ObservableResponseModelRefV1 | null;
  imas_binding?: FusionImasBindingV1;
}

export interface FusionLaneBundleV1
  extends LaneBundleV1<
    FusionGeometryStateV1,
    FusionForcingStateV1,
    FusionPlasmaStateV1,
    FusionClosureStateV1,
    FusionObservableContractV1[]
  > {
  schema_version: typeof FUSION_LANE_CONTRACT_SCHEMA_VERSION;
}
