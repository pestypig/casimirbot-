import { computeProofs } from "../../stellar/evolution";
import { buildTreeDagClaim, collectCanonicalEvidenceRefs } from "../claims";
import type { CanonicalStar, StarSimLaneResult } from "../contract";

const SOLAR_Z = 0.0142;

const clampPositive = (value: number | null | undefined, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;

export function runStructureReducedLane(star: CanonicalStar): StarSimLaneResult {
  const assumptions: string[] = [];
  const observablesUsed: string[] = [];
  const evidenceRefs = collectCanonicalEvidenceRefs(star);

  const massInput = star.fields.structure.mass_Msun.value;
  const fehInput = star.fields.spectroscopy.metallicity_feh.value;
  const zInput = star.fields.spectroscopy.metallicity_Z.value;
  const heliumInput = star.fields.structure.helium_fraction.value;
  const cloudTempInput = star.fields.environment.cloud_temperature_K.value;
  const cloudDensityInput = star.fields.environment.cloud_nH_cm3.value;

  const mass_Msun = clampPositive(massInput, 1);
  if (typeof massInput === "number") {
    observablesUsed.push("structure.mass_Msun");
  } else {
    assumptions.push("Mass defaulted to 1 Msun for the reduced-order structure lane.");
  }

  let metallicity_Z: number;
  if (typeof zInput === "number") {
    metallicity_Z = clampPositive(zInput, SOLAR_Z);
    observablesUsed.push("spectroscopy.metallicity_Z");
  } else if (typeof fehInput === "number") {
    metallicity_Z = clampPositive(SOLAR_Z * Math.pow(10, fehInput), SOLAR_Z);
    observablesUsed.push("spectroscopy.metallicity_feh");
    assumptions.push("Metallicity Z inferred from [Fe/H] using a solar reference Z=0.0142.");
  } else {
    metallicity_Z = SOLAR_Z;
    assumptions.push("Metallicity defaulted to the solar reference value.");
  }

  const helium_fraction = clampPositive(heliumInput, 0.28);
  if (typeof heliumInput === "number") {
    observablesUsed.push("structure.helium_fraction");
  } else {
    assumptions.push("Helium fraction defaulted to Y=0.28.");
  }

  const cloud_temperature_K = clampPositive(cloudTempInput, 10);
  if (typeof cloudTempInput === "number") {
    observablesUsed.push("environment.cloud_temperature_K");
  } else {
    assumptions.push("Protostellar cloud temperature defaulted to 10 K.");
  }

  const cloud_nH_cm3 = clampPositive(cloudDensityInput, 100);
  if (typeof cloudDensityInput === "number") {
    observablesUsed.push("environment.cloud_nH_cm3");
  } else {
    assumptions.push("Protostellar cloud density defaulted to 100 cm^-3.");
  }

  const proofs = computeProofs({
    T_K: cloud_temperature_K,
    nH_cm3: cloud_nH_cm3,
    mass_Msun,
    metallicity_Z,
    Y_He: helium_fraction,
  });

  const observedInputs = [
    typeof massInput === "number",
    typeof zInput === "number" || typeof fehInput === "number",
    typeof heliumInput === "number",
    typeof cloudTempInput === "number",
    typeof cloudDensityInput === "number",
  ].filter(Boolean).length;
  const evidenceFit = Math.min(0.92, 0.4 + observedInputs * 0.1 + (star.target.is_solar_calibrator ? 0.08 : 0));
  const inMassDomain = mass_Msun >= 0.08 && mass_Msun <= 20;
  const domainPenalty = inMassDomain ? 1 : 0;

  return {
    lane_id: "structure_1d",
    requested_lane: "structure_1d",
    solver_id: "stellar.evolution.reduced/1",
    label: "Reduced-order 1D structure",
    availability: inMassDomain ? "available" : "unavailable",
    status: inMassDomain ? "available" : "unavailable",
    status_reason: inMassDomain ? undefined : "out_of_domain",
    execution_kind: "analytic",
    maturity: "reduced_order",
    phys_class: "P1",
    assumptions,
    domain_validity: {
      supported_mass_msun: [0.08, 20],
      current_backbone: "analytic closures",
      exclusions: ["3D magneto-convection", "line-by-line atmosphere synthesis", "relativistic stellar structure"],
    },
    observables_used: observablesUsed,
    inferred_params: {
      effective_temperature_K: proofs.mainSequence.T_eff_K,
      luminosity_Lsun: proofs.mainSequence.L_Lsun,
      radius_Rsun: proofs.mainSequence.R_Rsun,
      main_sequence_lifetime_Gyr: proofs.mainSequence.lifetime_Gyr,
    },
    residuals_sigma: {},
    falsifier_ids: inMassDomain ? [] : ["STAR_SIM_STRUCTURE_REDUCED_DOMAIN_EDGE"],
    tree_dag: buildTreeDagClaim({
      claim_id: "claim:star-sim:structure_reduced",
      parent_claim_ids: ["claim:star-sim:classification"],
      equation_refs: [
        "mass_luminosity_scaling",
        "mass_radius_scaling",
        "kelvin_helmholtz_timescale",
        "jeans_instability_proxy",
      ],
      evidence_refs: evidenceRefs,
    }),
    result: {
      proofs,
      used_defaults: {
        mass_Msun: typeof massInput !== "number",
        metallicity_Z: typeof zInput !== "number" && typeof fehInput !== "number",
        helium_fraction: typeof heliumInput !== "number",
        cloud_temperature_K: typeof cloudTempInput !== "number",
        cloud_nH_cm3: typeof cloudDensityInput !== "number",
      },
    },
    evidence_fit: evidenceFit,
    domain_penalty: domainPenalty,
    note: inMassDomain
      ? "This wraps the existing analytic stellar closures. It is intentionally reduced-order and does not claim atmosphere- or granule-resolved fidelity."
      : "The reduced-order structure lane is outside its declared mass domain for this target and is returned as unavailable.",
  };
}
