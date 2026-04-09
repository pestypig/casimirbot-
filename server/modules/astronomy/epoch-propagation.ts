import type {
  AstronomyAstrometricState,
  AstronomyCatalogFrameState,
  AstronomyDynamicState,
  AstronomyFrameRealizationId,
  AstronomyProvenanceClass,
  AstronomyReferenceFrameId,
  AstronomyTimeScale,
} from "../../../shared/contracts/astronomy-frame.v1";

const PARSEC_M = 3.085_677_581_491_367e16;
const JULIAN_YEAR_S = 31_557_600;

export type AstronomyCatalogInput = {
  id: string;
  label?: string;
  position_m?: [number, number, number];
  frame_id?: AstronomyReferenceFrameId;
  frame_realization?: AstronomyFrameRealizationId | null;
  reference_epoch_tcb_jy?: number | null;
  time_scale?: AstronomyTimeScale;
  provenance_class?: AstronomyProvenanceClass;
  astrometry?: AstronomyAstrometricState;
};

export type PropagatedAstronomyCatalogEntry = AstronomyCatalogFrameState & {
  canonical_position_m: [number, number, number];
  render_epoch_tcb_jy: number;
  propagation_applied: boolean;
  propagation_limitations: string[];
  dynamic_state: AstronomyDynamicState;
};

const norm = (vec: [number, number, number]): number =>
  Math.hypot(vec[0], vec[1], vec[2]);

const scale = (
  vec: [number, number, number],
  factor: number,
): [number, number, number] => [vec[0] * factor, vec[1] * factor, vec[2] * factor];

const raDecToUnitVector = (ra_deg: number, dec_deg: number): [number, number, number] => {
  const ra = (ra_deg * Math.PI) / 180;
  const dec = (dec_deg * Math.PI) / 180;
  const cosDec = Math.cos(dec);
  return [
    Math.cos(ra) * cosDec,
    Math.sin(ra) * cosDec,
    Math.sin(dec),
  ];
};

const unitVectorToRaDec = (vec: [number, number, number]): { ra_deg: number; dec_deg: number } => {
  const magnitude = norm(vec);
  if (!(magnitude > 0)) {
    return { ra_deg: 0, dec_deg: 0 };
  }
  const [x, y, z] = scale(vec, 1 / magnitude);
  const ra = Math.atan2(y, x);
  const dec = Math.asin(z);
  return {
    ra_deg: ((ra * 180) / Math.PI + 360) % 360,
    dec_deg: (dec * 180) / Math.PI,
  };
};

const asFinite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const defaultFrameIdFor = (input: AstronomyCatalogInput): AstronomyReferenceFrameId =>
  input.frame_id ?? "ICRS";

const defaultFrameRealizationFor = (input: AstronomyCatalogInput): AstronomyFrameRealizationId | null =>
  input.frame_realization
  ?? (input.astrometry ? "Gaia_CRF3" : null);

const provenanceFor = (input: AstronomyCatalogInput): AstronomyProvenanceClass =>
  input.provenance_class ?? "observed";

const dynamicStateFor = (args: {
  provenance: AstronomyProvenanceClass;
  astrometry?: AstronomyAstrometricState;
  hiddenAnchor?: boolean;
  hasLegacyPosition: boolean;
}): AstronomyDynamicState => {
  if (args.hiddenAnchor) {
    return "static_anchor";
  }
  if (args.provenance === "synthetic_truth" || args.provenance === "synthetic_observed") {
    return "synthetic";
  }
  if (args.astrometry) {
    return "propagated_star";
  }
  return args.hasLegacyPosition ? "legacy_render_seed" : "propagated_star";
};

const distanceFromInput = (input: AstronomyCatalogInput): number | null => {
  const parallax = asFinite(input.astrometry?.parallax_mas);
  if (parallax !== null && parallax > 0) {
    return (1000 / parallax) * PARSEC_M;
  }
  if (input.position_m) {
    const magnitude = norm(input.position_m);
    return magnitude > 0 ? magnitude : null;
  }
  return null;
};

const canonicalPositionFromInput = (input: AstronomyCatalogInput): [number, number, number] => {
  if (input.astrometry) {
    const distance = distanceFromInput(input) ?? 0;
    return scale(
      raDecToUnitVector(input.astrometry.ra_deg, input.astrometry.dec_deg),
      distance,
    );
  }
  return input.position_m ?? [0, 0, 0];
};

export const propagateAstronomyCatalogEntry = (
  input: AstronomyCatalogInput,
  renderEpoch_tcb_jy: number,
  options?: { hiddenAnchor?: boolean },
): PropagatedAstronomyCatalogEntry => {
  const referenceEpoch = input.reference_epoch_tcb_jy ?? (input.astrometry ? 2016.0 : renderEpoch_tcb_jy);
  const provenance = provenanceFor(input);
  const propagation_limitations: string[] = [];
  const hiddenAnchor = options?.hiddenAnchor === true;

  if (hiddenAnchor) {
    const canonical_position_m = canonicalPositionFromInput(input);
    return {
      id: input.id,
      label: input.label,
      frame_id: defaultFrameIdFor(input),
      frame_realization: defaultFrameRealizationFor(input),
      reference_epoch_tcb_jy: referenceEpoch,
      time_scale: input.time_scale ?? "TCB",
      provenance_class: provenance,
      position_m: input.position_m,
      astrometry: input.astrometry,
      canonical_position_m,
      render_epoch_tcb_jy: renderEpoch_tcb_jy,
      propagation_applied: false,
      propagation_limitations,
      dynamic_state: "static_anchor",
    };
  }

  if (!input.astrometry) {
    propagation_limitations.push("legacy_cartesian_seed_assumed_heliocentric_icrs");
    return {
      id: input.id,
      label: input.label,
      frame_id: defaultFrameIdFor(input),
      frame_realization: defaultFrameRealizationFor(input),
      reference_epoch_tcb_jy: referenceEpoch,
      time_scale: input.time_scale ?? "TCB",
      provenance_class: provenance,
      position_m: input.position_m,
      astrometry: undefined,
      canonical_position_m: canonicalPositionFromInput(input),
      render_epoch_tcb_jy: renderEpoch_tcb_jy,
      propagation_applied: false,
      propagation_limitations,
      dynamic_state: dynamicStateFor({
        provenance,
        hasLegacyPosition: Boolean(input.position_m),
      }),
    };
  }

  const dtYears = renderEpoch_tcb_jy - referenceEpoch;
  const originalRa = input.astrometry.ra_deg;
  const originalDec = input.astrometry.dec_deg;
  const pmRa = asFinite(input.astrometry.proper_motion_ra_masyr) ?? 0;
  const pmDec = asFinite(input.astrometry.proper_motion_dec_masyr) ?? 0;
  const radialVelocity_kms = asFinite(input.astrometry.radial_velocity_kms);
  const decRad = (originalDec * Math.PI) / 180;
  const cosDec = Math.max(Math.abs(Math.cos(decRad)), 1e-6);
  const ra_deg =
    originalRa + (pmRa * dtYears) / (3_600_000 * cosDec);
  const dec_deg =
    originalDec + (pmDec * dtYears) / 3_600_000;
  const baseDistance = distanceFromInput(input);
  let distance_m = baseDistance ?? 0;
  if (radialVelocity_kms !== null && baseDistance !== null) {
    distance_m += radialVelocity_kms * 1000 * dtYears * JULIAN_YEAR_S;
  } else if (baseDistance !== null && dtYears !== 0) {
    propagation_limitations.push("radial_velocity_missing_perspective_acceleration_ignored");
  }
  if (baseDistance === null) {
    propagation_limitations.push("distance_missing_parallax_or_position_seed");
  }

  const canonical_position_m = scale(raDecToUnitVector(ra_deg, dec_deg), distance_m);
  const propagation_applied = dtYears !== 0 && (pmRa !== 0 || pmDec !== 0 || radialVelocity_kms !== null);
  const propagatedAstrometry: AstronomyAstrometricState = {
    ...input.astrometry,
    ra_deg,
    dec_deg,
  };

  return {
    id: input.id,
    label: input.label,
    frame_id: defaultFrameIdFor(input),
    frame_realization: defaultFrameRealizationFor(input),
    reference_epoch_tcb_jy: referenceEpoch,
    time_scale: input.time_scale ?? "TCB",
    provenance_class: provenance,
    position_m: input.position_m,
    astrometry: propagatedAstrometry,
    canonical_position_m,
    render_epoch_tcb_jy: renderEpoch_tcb_jy,
    propagation_applied,
    propagation_limitations,
    dynamic_state: dynamicStateFor({
      provenance,
      astrometry: input.astrometry,
      hasLegacyPosition: Boolean(input.position_m),
    }),
  };
};

export const buildLegacyAstrometryFromPosition = (
  position_m: [number, number, number],
): AstronomyAstrometricState => {
  const { ra_deg, dec_deg } = unitVectorToRaDec(position_m);
  return {
    ra_deg,
    dec_deg,
  };
};

