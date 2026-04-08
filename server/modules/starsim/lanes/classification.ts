import { buildTreeDagClaim, collectCanonicalEvidenceRefs } from "../claims";
import type { CanonicalStar, StarSimLaneResult } from "../contract";

const spectralBands = [
  { cls: "O", min: 30_000, max: 60_000 },
  { cls: "B", min: 10_000, max: 30_000 },
  { cls: "A", min: 7_500, max: 10_000 },
  { cls: "F", min: 6_000, max: 7_500 },
  { cls: "G", min: 5_200, max: 6_000 },
  { cls: "K", min: 3_700, max: 5_200 },
  { cls: "M", min: 2_400, max: 3_700 },
] as const;

const inferSpectralSubtype = (teffK: number): string => {
  const band = spectralBands.find((entry) => teffK >= entry.min && teffK < entry.max) ?? spectralBands[spectralBands.length - 1];
  const span = Math.max(1, band.max - band.min);
  const subtype = Math.max(0, Math.min(9, Math.round(((band.max - teffK) / span) * 9)));
  return `${band.cls}${subtype}`;
};

const inferLuminosityClass = (loggCgs: number): string => {
  if (loggCgs >= 4) return "V";
  if (loggCgs >= 3.2) return "IV";
  if (loggCgs >= 1.8) return "III";
  return "I";
};

export function runClassificationLane(star: CanonicalStar): StarSimLaneResult {
  const assumptions: string[] = [];
  const observablesUsed: string[] = [];
  const evidenceRefs = collectCanonicalEvidenceRefs(star);

  let spectralType = star.target.spectral_type;
  let luminosityClass = star.target.luminosity_class;

  if (star.target.spectral_type) {
    observablesUsed.push("target.spectral_type");
  } else if (typeof star.fields.spectroscopy.teff_K.value === "number") {
    spectralType = inferSpectralSubtype(star.fields.spectroscopy.teff_K.value);
    observablesUsed.push("spectroscopy.teff_K");
    assumptions.push("Spectral subtype inferred from effective-temperature bins.");
  } else if (star.target.is_solar_calibrator) {
    spectralType = "G2";
    assumptions.push("Solar target defaults to the canonical G2 calibration label.");
  } else {
    assumptions.push("No direct spectral observable was provided; classification remains unresolved.");
  }

  if (star.target.luminosity_class) {
    observablesUsed.push("target.luminosity_class");
  } else if (typeof star.fields.spectroscopy.logg_cgs.value === "number") {
    luminosityClass = inferLuminosityClass(star.fields.spectroscopy.logg_cgs.value);
    observablesUsed.push("spectroscopy.logg_cgs");
    assumptions.push("Luminosity class inferred from log g bins.");
  } else if (star.target.is_solar_calibrator) {
    luminosityClass = "V";
  }

  const fullType = spectralType ? `${spectralType}${luminosityClass ?? ""}` : "unresolved";
  const evidenceFit =
    star.target.spectral_type !== null
      ? 0.95
      : typeof star.fields.spectroscopy.teff_K.value === "number"
        ? 0.8
        : star.target.is_solar_calibrator
          ? 0.72
          : 0.35;

  return {
    lane_id: "classification",
    requested_lane: "classification",
    solver_id: "star-sim.classification/1",
    label: "Stellar classification",
    availability: "available",
    status: "available",
    execution_kind: "fit",
    maturity: "obs_fit",
    phys_class: "P0",
    assumptions,
    domain_validity: {
      supported_inputs: ["target.spectral_type", "spectroscopy.teff_K", "spectroscopy.logg_cgs"],
      output_scope: "broad spectral and luminosity classification",
    },
    observables_used: observablesUsed,
    inferred_params: {
      spectral_type: fullType,
      spectral_subtype: spectralType,
      luminosity_class: luminosityClass,
    },
    residuals_sigma: {},
    falsifier_ids: spectralType ? [] : ["STAR_SIM_CLASSIFICATION_SPARSE_INPUT"],
    tree_dag: buildTreeDagClaim({
      claim_id: "claim:star-sim:classification",
      equation_refs: ["stellar_teff_spectral_partition", "surface_gravity_luminosity_class_bins"],
      evidence_refs: evidenceRefs,
    }),
    result: {
      target_name: star.target.name,
      spectral_type: fullType,
      spectral_subtype: spectralType,
      luminosity_class: luminosityClass,
    },
    evidence_fit: evidenceFit,
    domain_penalty: 1,
    note: spectralType
      ? "Broad stellar typing only; this lane does not certify atmosphere, convection, or magnetic topology."
      : "Sparse classification input; returned type is an orchestration hint, not a measured label.",
  };
}
