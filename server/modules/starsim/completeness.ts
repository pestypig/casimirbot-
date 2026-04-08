import type {
  CanonicalField,
  CanonicalStar,
  ObsClass,
  PhysClass,
  StarSimCompleteness,
  StarSimLaneResult,
} from "./contract";

const isPresent = (field: CanonicalField<unknown>): boolean => field.status !== "missing";
const PHYS_ORDER: Record<PhysClass, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
  P5: 5,
};

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
  const hasOrbitalContext =
    isPresent(star.fields.orbital_context.naif_body_id)
    || isPresent(star.fields.orbital_context.ephemeris_source)
    || isPresent(star.fields.orbital_context.companion_count);

  if (hasResolvedSurface && hasMagnetic && hasOrbitalContext) return "O5";
  if (hasMagnetic) return "O4";
  if (hasSeismology) return "O3";
  if (hasTimeSeries) return "O2";
  if (hasSpectroscopy) return "O1";
  if (hasCatalog) return "O0";
  return "O0";
}

export function maxPhysClass(classes: Array<PhysClass | null | undefined>): PhysClass {
  return classes.reduce<PhysClass>((best, candidate) => {
    if (!candidate) return best;
    return PHYS_ORDER[candidate] > PHYS_ORDER[best] ? candidate : best;
  }, "P0");
}

export function minPhysClass(classes: Array<PhysClass | null | undefined>): PhysClass | null {
  const filtered = classes.filter((candidate): candidate is PhysClass => Boolean(candidate));
  if (filtered.length === 0) return null;
  return filtered.reduce<PhysClass>((best, candidate) =>
    PHYS_ORDER[candidate] < PHYS_ORDER[best] ? candidate : best,
  );
}

export function derivePhysDepthSummary(lanes: StarSimLaneResult[]): {
  max_lane_depth: PhysClass;
  requested_lane_depth: PhysClass | null;
  requested_lane_status: "complete" | "partial" | "blocked";
} {
  const available = lanes.filter((lane) => lane.status === "available");
  const availablePhysics = available.filter((lane) => lane.phys_class !== "P0");
  const blockers = lanes.some((lane) => lane.status === "unavailable" || lane.status === "failed");
  const partial = !blockers && lanes.some((lane) => lane.status === "not_applicable");

  return {
    max_lane_depth: maxPhysClass(available.map((lane) => lane.phys_class)),
    requested_lane_depth: blockers ? null : minPhysClass(availablePhysics.map((lane) => lane.phys_class)),
    requested_lane_status: blockers ? "blocked" : partial ? "partial" : "complete",
  };
}
