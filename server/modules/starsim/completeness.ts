import type {
  CanonicalField,
  CanonicalStar,
  ObsClass,
  PhysClass,
  StarSimCompleteness,
  StarSimLaneResult,
} from "./contract";

const isPresent = (field: CanonicalField<unknown>): boolean => field.status !== "missing";

const flattenFields = (star: CanonicalStar): Array<[string, CanonicalField<unknown>]> => {
  const entries: Array<[string, CanonicalField<unknown>]> = [];
  for (const [sectionName, section] of Object.entries(star.fields)) {
    for (const [fieldName, field] of Object.entries(section)) {
      entries.push([`${sectionName}.${fieldName}`, field]);
    }
  }
  return entries;
};

export function assessCompleteness(star: CanonicalStar): StarSimCompleteness {
  const fields = flattenFields(star);
  const observedFieldCount = fields.filter(([, field]) => isPresent(field)).length;
  const missing = fields.filter(([, field]) => !isPresent(field)).map(([id]) => id);
  const presentSections = Object.entries(star.fields)
    .filter(([, section]) => Object.values(section).some((field) => isPresent(field)))
    .map(([sectionName]) => sectionName);

  const reasons: string[] = [];
  if (isPresent(star.fields.spectroscopy.teff_K)) reasons.push("spectroscopic temperature present");
  if (isPresent(star.fields.photometry.time_series_ref)) reasons.push("time-series photometry present");
  if (isPresent(star.fields.asteroseismology.mode_count)) reasons.push("asteroseismic mode data present");
  if (
    isPresent(star.fields.activity.replay_series_id)
    || isPresent(star.fields.activity.flare_replay_series_id)
    || isPresent(star.fields.surface.resolved_surface_ref)
  ) {
    reasons.push("surface or solar-style activity observables present");
  }
  if (isPresent(star.fields.orbital_context.naif_body_id)) reasons.push("orbital context present");

  return {
    observed_field_count: observedFieldCount,
    missing_field_count: missing.length,
    present_sections: presentSections,
    missing_field_ids: missing,
    reasons,
  };
}

export function deriveObsClass(star: CanonicalStar): ObsClass {
  const hasCatalog =
    isPresent(star.fields.astrometry.parallax_mas)
    || isPresent(star.fields.astrometry.proper_motion_ra_masyr)
    || isPresent(star.fields.astrometry.proper_motion_dec_masyr)
    || isPresent(star.fields.astrometry.radial_velocity_kms)
    || isPresent(star.fields.photometry.band_count)
    || star.target.spectral_type !== null;
  const hasSpectroscopy =
    isPresent(star.fields.spectroscopy.teff_K)
    || isPresent(star.fields.spectroscopy.logg_cgs)
    || isPresent(star.fields.spectroscopy.metallicity_feh)
    || isPresent(star.fields.spectroscopy.metallicity_Z)
    || isPresent(star.fields.spectroscopy.spectrum_ref)
    || isPresent(star.fields.spectroscopy.abundance_count);
  const hasTimeSeries = isPresent(star.fields.photometry.time_series_ref);
  const hasSeismology =
    isPresent(star.fields.asteroseismology.numax_uHz)
    || isPresent(star.fields.asteroseismology.deltanu_uHz)
    || isPresent(star.fields.asteroseismology.mode_count);
  const hasMagnetic =
    isPresent(star.fields.activity.magnetic_activity_index)
    || isPresent(star.fields.activity.rotation_period_days)
    || isPresent(star.fields.activity.replay_series_id)
    || isPresent(star.fields.activity.flare_replay_series_id)
    || isPresent(star.fields.activity.sunquake_replay_series_id);
  const hasResolvedSurface =
    isPresent(star.fields.surface.resolved_surface_ref)
    || isPresent(star.fields.surface.granulation_timescale_min)
    || star.target.is_solar_calibrator;

  if (hasResolvedSurface && (hasMagnetic || isPresent(star.fields.orbital_context.naif_body_id))) return "O5";
  if (hasMagnetic) return "O4";
  if (hasSeismology) return "O3";
  if (hasTimeSeries) return "O2";
  if (hasSpectroscopy) return "O1";
  if (hasCatalog) return "O0";
  return "O0";
}

export function derivePhysClass(lanes: StarSimLaneResult[]): PhysClass {
  let level = 0;
  for (const lane of lanes) {
    if (lane.availability !== "available") continue;
    if (lane.requested_lane === "structure_1d") {
      level = Math.max(level, 1);
    }
    if (lane.requested_lane === "activity") {
      level = Math.max(level, 4);
    }
    if (lane.requested_lane === "barycenter" && lane.maturity === "ephemeris_exact") {
      level = Math.max(level, 5);
    }
  }
  return `P${level}` as PhysClass;
}
