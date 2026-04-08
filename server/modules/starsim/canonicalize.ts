import type { CanonicalField, CanonicalStar, FieldStatus, RequestedLane, StarSimRequest } from "./contract";

type SectionMeta = {
  source?: string;
  provenance_ref?: string;
  uncertainties?: Record<string, number>;
  statuses?: Record<string, FieldStatus>;
};

const missingField = <T>(unit: string | null): CanonicalField<T> => ({
  value: null,
  raw_value: null,
  unit,
  uncertainty: null,
  source: null,
  status: "missing",
  provenance_ref: null,
  normalization: null,
});

const buildField = <T>(
  value: T | null | undefined,
  unit: string | null,
  sectionMeta: SectionMeta | undefined,
  key: string,
  fallbackSource: string,
  options?: {
    rawValue?: unknown;
    normalization?: string | null;
    defaultStatus?: FieldStatus;
  },
): CanonicalField<T> => {
  if (value === null || value === undefined) {
    return missingField<T>(unit);
  }
  return {
    value,
    raw_value: options?.rawValue ?? value,
    unit,
    uncertainty: sectionMeta?.uncertainties?.[key] ?? null,
    source: sectionMeta?.source ?? fallbackSource,
    status: sectionMeta?.statuses?.[key] ?? options?.defaultStatus ?? "observed",
    provenance_ref: sectionMeta?.provenance_ref ?? null,
    normalization: options?.normalization ?? null,
  };
};

const normalizeId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "anonymous-star";

const isSolarTarget = (request: StarSimRequest): boolean => {
  const objectId = request.target?.object_id?.trim().toLowerCase();
  const name = request.target?.name?.trim().toLowerCase();
  const bodyId = request.orbital_context?.naif_body_id;
  return objectId === "sun" || objectId === "sol" || name === "sun" || name === "sol" || bodyId === 10;
};

const defaultRequestedLanes = (request: StarSimRequest, solar: boolean): RequestedLane[] => {
  const lanes: RequestedLane[] = ["classification", "structure_1d"];
  if (solar) {
    lanes.push("activity", "barycenter");
  } else if (request.orbital_context?.naif_body_id !== undefined) {
    lanes.push("barycenter");
  }
  return lanes;
};

export function canonicalizeStarSimRequest(request: StarSimRequest): CanonicalStar {
  const solar = isSolarTarget(request);
  const objectId = request.target?.object_id?.trim() || (solar ? "sun" : "anonymous-star");
  const name = request.target?.name?.trim() || (solar ? "Sun" : objectId);
  const targetEpochIso = request.target?.epoch_iso ?? new Date().toISOString();

  const astrometry = request.astrometry;
  const photometry = request.photometry;
  const spectroscopy = request.spectroscopy;
  const asteroseismology = request.asteroseismology;
  const activity = request.activity;
  const surface = request.surface;
  const structure = request.structure;
  const orbital = request.orbital_context;
  const environment = request.environment;

  return {
    schema_version: "star-sim-v1",
    target: {
      object_id: objectId,
      name,
      canonical_target_id: normalizeId(request.target?.object_id || request.target?.name || name),
      epoch_iso: targetEpochIso,
      spectral_type: request.target?.spectral_type ?? (solar ? "G2" : null),
      luminosity_class: request.target?.luminosity_class ?? (solar ? "V" : null),
      is_solar_calibrator: solar,
    },
    fields: {
      astrometry: {
        parallax_mas: buildField(astrometry?.parallax_mas, "mas", astrometry, "parallax_mas", "request.astrometry"),
        proper_motion_ra_masyr: buildField(
          astrometry?.proper_motion_ra_masyr,
          "mas/yr",
          astrometry,
          "proper_motion_ra_masyr",
          "request.astrometry",
        ),
        proper_motion_dec_masyr: buildField(
          astrometry?.proper_motion_dec_masyr,
          "mas/yr",
          astrometry,
          "proper_motion_dec_masyr",
          "request.astrometry",
        ),
        radial_velocity_kms: buildField(
          astrometry?.radial_velocity_kms,
          "km/s",
          astrometry,
          "radial_velocity_kms",
          "request.astrometry",
        ),
      },
      photometry: {
        band_count: buildField(
          photometry?.bands ? Object.keys(photometry.bands).length : undefined,
          "count",
          photometry,
          "band_count",
          "request.photometry",
          {
            rawValue: photometry?.bands ?? null,
            normalization: photometry?.bands ? "count_keys(request.photometry.bands)" : null,
            defaultStatus: photometry?.bands ? "inferred" : "missing",
          },
        ),
        time_series_ref: buildField(
          photometry?.time_series_ref,
          null,
          photometry,
          "time_series_ref",
          "request.photometry",
        ),
      },
      spectroscopy: {
        teff_K: buildField(spectroscopy?.teff_K, "K", spectroscopy, "teff_K", "request.spectroscopy"),
        logg_cgs: buildField(spectroscopy?.logg_cgs, "dex", spectroscopy, "logg_cgs", "request.spectroscopy"),
        metallicity_feh: buildField(
          spectroscopy?.metallicity_feh,
          "dex",
          spectroscopy,
          "metallicity_feh",
          "request.spectroscopy",
        ),
        metallicity_Z: buildField(
          spectroscopy?.metallicity_Z,
          null,
          spectroscopy,
          "metallicity_Z",
          "request.spectroscopy",
        ),
        vsini_kms: buildField(spectroscopy?.vsini_kms, "km/s", spectroscopy, "vsini_kms", "request.spectroscopy"),
        spectrum_ref: buildField(
          spectroscopy?.spectrum_ref,
          null,
          spectroscopy,
          "spectrum_ref",
          "request.spectroscopy",
        ),
        abundance_count: buildField(
          spectroscopy?.abundances ? Object.keys(spectroscopy.abundances).length : undefined,
          "count",
          spectroscopy,
          "abundance_count",
          "request.spectroscopy",
          {
            rawValue: spectroscopy?.abundances ?? null,
            normalization: spectroscopy?.abundances ? "count_keys(request.spectroscopy.abundances)" : null,
            defaultStatus: spectroscopy?.abundances ? "inferred" : "missing",
          },
        ),
      },
      asteroseismology: {
        numax_uHz: buildField(
          asteroseismology?.numax_uHz,
          "uHz",
          asteroseismology,
          "numax_uHz",
          "request.asteroseismology",
        ),
        deltanu_uHz: buildField(
          asteroseismology?.deltanu_uHz,
          "uHz",
          asteroseismology,
          "deltanu_uHz",
          "request.asteroseismology",
        ),
        mode_count: buildField(
          asteroseismology?.mode_frequencies_uHz?.length,
          "count",
          asteroseismology,
          "mode_count",
          "request.asteroseismology",
          {
            rawValue: asteroseismology?.mode_frequencies_uHz ?? null,
            normalization: asteroseismology?.mode_frequencies_uHz
              ? "count_entries(request.asteroseismology.mode_frequencies_uHz)"
              : null,
            defaultStatus: asteroseismology?.mode_frequencies_uHz ? "inferred" : "missing",
          },
        ),
      },
      activity: {
        magnetic_activity_index: buildField(
          activity?.magnetic_activity_index,
          null,
          activity,
          "magnetic_activity_index",
          "request.activity",
        ),
        rotation_period_days: buildField(
          activity?.rotation_period_days,
          "day",
          activity,
          "rotation_period_days",
          "request.activity",
        ),
        cycle_phase: buildField(activity?.cycle_phase, null, activity, "cycle_phase", "request.activity"),
        replay_series_id: buildField(
          activity?.replay_series_id,
          null,
          activity,
          "replay_series_id",
          "request.activity",
        ),
        flare_replay_series_id: buildField(
          activity?.flare_replay_series_id,
          null,
          activity,
          "flare_replay_series_id",
          "request.activity",
        ),
        sunquake_replay_series_id: buildField(
          activity?.sunquake_replay_series_id,
          null,
          activity,
          "sunquake_replay_series_id",
          "request.activity",
        ),
      },
      surface: {
        resolved_surface_ref: buildField(
          surface?.resolved_surface_ref,
          null,
          surface,
          "resolved_surface_ref",
          "request.surface",
        ),
        granulation_timescale_min: buildField(
          surface?.granulation_timescale_min,
          "min",
          surface,
          "granulation_timescale_min",
          "request.surface",
        ),
      },
      structure: {
        mass_Msun: buildField(structure?.mass_Msun, "Msun", structure, "mass_Msun", "request.structure"),
        radius_Rsun: buildField(structure?.radius_Rsun, "Rsun", structure, "radius_Rsun", "request.structure"),
        age_Gyr: buildField(structure?.age_Gyr, "Gyr", structure, "age_Gyr", "request.structure"),
        helium_fraction: buildField(
          structure?.helium_fraction,
          null,
          structure,
          "helium_fraction",
          "request.structure",
        ),
      },
      orbital_context: {
        naif_body_id: buildField(orbital?.naif_body_id, null, orbital, "naif_body_id", "request.orbital_context"),
        ephemeris_source: buildField(
          orbital?.ephemeris_source,
          null,
          orbital,
          "ephemeris_source",
          "request.orbital_context",
        ),
        companion_count: buildField(
          orbital?.companions?.length,
          "count",
          orbital,
          "companion_count",
          "request.orbital_context",
          {
            rawValue: orbital?.companions ?? null,
            normalization: orbital?.companions ? "count_entries(request.orbital_context.companions)" : null,
            defaultStatus: orbital?.companions ? "inferred" : "missing",
          },
        ),
      },
      environment: {
        cloud_temperature_K: buildField(
          environment?.cloud_temperature_K,
          "K",
          environment,
          "cloud_temperature_K",
          "request.environment",
        ),
        cloud_nH_cm3: buildField(
          environment?.cloud_nH_cm3,
          "cm^-3",
          environment,
          "cloud_nH_cm3",
          "request.environment",
        ),
      },
    },
    evidence_refs: Array.from(new Set(request.evidence_refs ?? [])),
    requested_lanes: request.requested_lanes ?? defaultRequestedLanes(request, solar),
    strict_lanes: request.strict_lanes === true,
  };
}
