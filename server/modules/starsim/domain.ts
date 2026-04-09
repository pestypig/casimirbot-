import type {
  CanonicalStar,
  PhysicsFlagValue,
  StarSimSupportedDomain,
  StarSimSupportedDomainReason,
} from "./contract";

export const STAR_SIM_SUPPORTED_DOMAIN_ID = "solar_like_main_sequence_live";
export const STAR_SIM_SUPPORTED_DOMAIN_VERSION = "star-sim-domain/1";

type SupportedLiveLane = "structure_mesa" | "oscillation_gyre";

const DEFAULT_FIT_PROFILES: Record<SupportedLiveLane, string> = {
  structure_mesa: "solar_like_observable_fit_v1",
  oscillation_gyre: "solar_like_seismic_compare_v1",
};

const DEFAULT_FIT_CONSTRAINTS: Record<SupportedLiveLane, Record<string, PhysicsFlagValue>> = {
  structure_mesa: {
    helium_prior: "solar_scaled",
    mixing_length_alpha_min: 1.6,
    mixing_length_alpha_max: 2.2,
    age_max_gyr: 12.5,
  },
  oscillation_gyre: {
    mode_matching: "solar_like_global",
    max_mode_degree_l: 3,
    frequency_window_uHz: 250,
  },
};

const DEFAULT_BENCHMARK_PACKS: Record<SupportedLiveLane, string> = {
  structure_mesa: "solar_like_structure_fit_pack_v1",
  oscillation_gyre: "solar_like_seismic_compare_pack_v1",
};

const hasNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const mergeConstraints = (
  lane: SupportedLiveLane,
  star: CanonicalStar,
): Record<string, PhysicsFlagValue> => ({
  ...DEFAULT_FIT_CONSTRAINTS[lane],
  ...star.fit_constraints,
});

const inRange = (value: number | null, min: number, max: number): boolean =>
  value !== null && value >= min && value <= max;

const collectBaseReasons = (star: CanonicalStar): StarSimSupportedDomainReason[] => {
  const reasons = new Set<StarSimSupportedDomainReason>();
  const teff = hasNumber(star.fields.spectroscopy.teff_K.value) ? star.fields.spectroscopy.teff_K.value : null;
  const logg = hasNumber(star.fields.spectroscopy.logg_cgs.value) ? star.fields.spectroscopy.logg_cgs.value : null;
  const feh = hasNumber(star.fields.spectroscopy.metallicity_feh.value)
    ? star.fields.spectroscopy.metallicity_feh.value
    : null;
  const vsini = hasNumber(star.fields.spectroscopy.vsini_kms.value) ? star.fields.spectroscopy.vsini_kms.value : null;
  const radius = hasNumber(star.fields.structure.radius_Rsun.value) ? star.fields.structure.radius_Rsun.value : null;
  const mass = hasNumber(star.fields.structure.mass_Msun.value) ? star.fields.structure.mass_Msun.value : null;
  const luminosityClass = star.target.luminosity_class?.trim().toUpperCase() ?? null;
  const spectralType = star.target.spectral_type?.trim().toUpperCase() ?? null;

  if (luminosityClass && luminosityClass !== "V") {
    reasons.add("unsupported_evolutionary_state");
  }
  if (logg !== null && logg < 4.0) {
    reasons.add("unsupported_evolutionary_state");
  }
  if (radius !== null && radius > 1.7) {
    reasons.add("unsupported_evolutionary_state");
  }

  const solarLikeBySpectralType = spectralType?.startsWith("G") || spectralType?.startsWith("F9") || spectralType?.startsWith("K0");
  const solarLikeByTeff = teff !== null && teff >= 5_300 && teff <= 6_200;
  if (!solarLikeBySpectralType && !solarLikeByTeff) {
    reasons.add("out_of_supported_domain");
  }
  if (feh !== null && (feh < -0.6 || feh > 0.5)) {
    reasons.add("out_of_supported_domain");
  }
  if (vsini !== null && vsini > 30) {
    reasons.add("out_of_supported_domain");
  }
  if (mass !== null && (mass < 0.8 || mass > 1.25)) {
    reasons.add("out_of_supported_domain");
  }

  return [...reasons];
};

const hasStructureObservables = (star: CanonicalStar): boolean => {
  const teff = hasNumber(star.fields.spectroscopy.teff_K.value);
  const feh = hasNumber(star.fields.spectroscopy.metallicity_feh.value);
  const logg = hasNumber(star.fields.spectroscopy.logg_cgs.value);
  const radius = hasNumber(star.fields.structure.radius_Rsun.value);
  return teff && feh && (logg || radius);
};

const hasSeismicObservables = (star: CanonicalStar): boolean =>
  hasNumber(star.fields.asteroseismology.numax_uHz.value)
  || hasNumber(star.fields.asteroseismology.deltanu_uHz.value)
  || hasNumber(star.fields.asteroseismology.mode_count.value);

export const evaluateStarSimSupportedDomain = (
  star: CanonicalStar,
  lane: SupportedLiveLane,
): StarSimSupportedDomain => {
  const reasons = new Set<StarSimSupportedDomainReason>(collectBaseReasons(star));
  const notes: string[] = [
    "Live fitting is currently limited to solar-like main-sequence stars with constrained observable-driven inference.",
  ];
  const requiredObservables =
    lane === "structure_mesa"
      ? ["spectroscopy.teff_K", "spectroscopy.metallicity_feh", "spectroscopy.logg_cgs|structure.radius_Rsun"]
      : ["asteroseismology.numax_uHz|asteroseismology.deltanu_uHz|asteroseismology.mode_count"];
  const optionalObservables =
    lane === "structure_mesa"
      ? ["structure.mass_Msun", "structure.age_Gyr", "asteroseismology.numax_uHz", "asteroseismology.deltanu_uHz"]
      : ["asteroseismology.mode_frequencies_uHz", "spectroscopy.teff_K", "spectroscopy.logg_cgs"];

  if (lane === "structure_mesa" && !hasStructureObservables(star)) {
    reasons.add("insufficient_observables");
  }
  if (lane === "oscillation_gyre" && !hasSeismicObservables(star)) {
    reasons.add("seismology_required");
  }

  if (reasons.has("unsupported_evolutionary_state")) {
    notes.push("The declared live fitting domain excludes giants and low-gravity/subgiant-like cases.");
  }
  if (reasons.has("out_of_supported_domain")) {
    notes.push("The target sits outside the current near-solar temperature, metallicity, rotation, or mass envelope.");
  }
  if (reasons.has("insufficient_observables")) {
    notes.push("The current constrained fit requires Teff, [Fe/H], and either log g or radius.");
  }
  if (reasons.has("seismology_required")) {
    notes.push("The oscillation comparison lane requires asteroseismic summary inputs.");
  }

  return {
    id: STAR_SIM_SUPPORTED_DOMAIN_ID,
    version: STAR_SIM_SUPPORTED_DOMAIN_VERSION,
    lane_id: lane,
    passed: reasons.size === 0,
    reasons: [...reasons],
    required_observables: requiredObservables,
    optional_observables: optionalObservables,
    fit_profile_id: star.fit_profile_id ?? DEFAULT_FIT_PROFILES[lane],
    fit_constraints_applied: mergeConstraints(lane, star),
    benchmark_pack_id: DEFAULT_BENCHMARK_PACKS[lane],
    notes,
  };
};
