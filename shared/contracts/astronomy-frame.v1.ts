export const ASTRONOMY_FRAME_LAYER_CONTRACT_VERSION = "astronomy_frame_layer/v1";
export const ASTRONOMY_ACCORDION_RENDER_TRANSFORM_ID =
  "accordion_direction_preserving_radius_remap_v1";

export type AstronomyReferenceFrameId =
  | "ICRS"
  | "ICRF3_radio"
  | "Gaia_CRF3_optical"
  | "BCRS_TCB_epoch"
  | "sol_centered_accordion_render";

export type AstronomyFrameRealizationId =
  | "ICRF3_S/X"
  | "Gaia_CRF3"
  | "BCRS_TCB_epoch_2016p0"
  | "NHM2_sun_centered_accessibility";

export type AstronomyTimeScale = "TCB";

export type AstronomyProvenanceClass =
  | "observed"
  | "synthetic_truth"
  | "synthetic_observed"
  | "inferred";

export type AstronomyDynamicState =
  | "static_anchor"
  | "propagated_star"
  | "synthetic"
  | "legacy_render_seed";

export type AstronomyFrameEdgeType =
  | "realizes_frame"
  | "epoch_propagates_to"
  | "transforms_to_render"
  | "anchored_by";

export type AstronomyAstrometricState = {
  ra_deg: number;
  dec_deg: number;
  parallax_mas?: number | null;
  proper_motion_ra_masyr?: number | null;
  proper_motion_dec_masyr?: number | null;
  radial_velocity_kms?: number | null;
  covariance?: Record<string, number> | null;
};

export type AstronomyCatalogFrameState = {
  id: string;
  label?: string;
  frame_id: AstronomyReferenceFrameId;
  frame_realization: AstronomyFrameRealizationId | null;
  reference_epoch_tcb_jy: number | null;
  time_scale: AstronomyTimeScale;
  provenance_class: AstronomyProvenanceClass;
  position_m?: [number, number, number];
  astrometry?: AstronomyAstrometricState;
};

export type AstronomyFrameNode = {
  id: string;
  kind: "frame" | "anchor" | "epoch" | "catalog_object" | "render_view";
  label: string;
  frame_id?: AstronomyReferenceFrameId;
  frame_realization?: AstronomyFrameRealizationId | null;
  provenance_class?: AstronomyProvenanceClass;
  hidden?: boolean;
};

export type AstronomyFrameEdge = {
  id: string;
  type: AstronomyFrameEdgeType;
  from: string;
  to: string;
};

export type AstronomyFrameLayerV1 = {
  contractVersion: typeof ASTRONOMY_FRAME_LAYER_CONTRACT_VERSION;
  canonical_frame_id: AstronomyReferenceFrameId;
  render_frame_id: AstronomyReferenceFrameId;
  hidden_anchor_count: number;
  nodes: AstronomyFrameNode[];
  edges: AstronomyFrameEdge[];
};

