import {
  ASTRONOMY_ACCORDION_RENDER_TRANSFORM_ID,
  type AstronomyProvenanceClass,
  type AstronomyReferenceFrameId,
} from "../../../../shared/contracts/astronomy-frame.v1";
import type { PropagatedAstronomyCatalogEntry } from "../epoch-propagation";

export type AccordionRenderCatalogEntry = {
  id: string;
  label?: string;
  position_m: [number, number, number];
  canonical_position_m: [number, number, number];
  provenance_class: AstronomyProvenanceClass;
  source_epoch_tcb_jy: number | null;
  render_epoch_tcb_jy: number;
  frame_id: AstronomyReferenceFrameId;
  frame_realization: string | null;
  dynamic_state: PropagatedAstronomyCatalogEntry["dynamic_state"];
  render_transform_id: typeof ASTRONOMY_ACCORDION_RENDER_TRANSFORM_ID;
  propagation_limitations: string[];
};

const norm = (vec: [number, number, number]): number =>
  Math.hypot(vec[0], vec[1], vec[2]);

const scale = (
  vec: [number, number, number],
  factor: number,
): [number, number, number] => [vec[0] * factor, vec[1] * factor, vec[2] * factor];

const directionUnitFor = (vec: [number, number, number]): [number, number, number] => {
  const magnitude = norm(vec);
  if (!(magnitude > 0)) return [0, 0, 0];
  return scale(vec, 1 / magnitude);
};

export const buildAccordionRenderCatalogEntry = (
  entry: PropagatedAstronomyCatalogEntry,
): AccordionRenderCatalogEntry => ({
  id: entry.id,
  label: entry.label,
  position_m: entry.canonical_position_m,
  canonical_position_m: entry.canonical_position_m,
  provenance_class: entry.provenance_class,
  source_epoch_tcb_jy: entry.reference_epoch_tcb_jy,
  render_epoch_tcb_jy: entry.render_epoch_tcb_jy,
  frame_id: entry.frame_id,
  frame_realization: entry.frame_realization,
  dynamic_state: entry.dynamic_state,
  render_transform_id: ASTRONOMY_ACCORDION_RENDER_TRANSFORM_ID,
  propagation_limitations: [...entry.propagation_limitations],
});

export const preserveDirectionAndRemapRadius = (args: {
  canonical_position_m: [number, number, number];
  mapped_radius_m: number;
}): [number, number, number] =>
  scale(directionUnitFor(args.canonical_position_m), args.mapped_radius_m);

