import type {
  TheoryBiomeBand,
  TheoryBiomeFidelity,
} from "../contracts/theory-biome-layout.v1";
import type { TheoryBadgeLevel, TheoryBadgeStatus, TheoryBadgeV1 } from "../contracts/theory-badge-graph.v1";

export const THEORY_SCALE_BANDS = [
  { band: "planck_quantum", minLog10M: -35, maxLog10M: -18 },
  { band: "nuclear", minLog10M: -18, maxLog10M: -14 },
  { band: "atomic", minLog10M: -14, maxLog10M: -9 },
  { band: "molecular", minLog10M: -9, maxLog10M: -6 },
  { band: "cellular_biophysical", minLog10M: -6, maxLog10M: -3 },
  { band: "device_laboratory", minLog10M: -9, maxLog10M: 1 },
  { band: "human_engineering", minLog10M: 0, maxLog10M: 6 },
  { band: "planetary", minLog10M: 6, maxLog10M: 8 },
  { band: "stellar", minLog10M: 8, maxLog10M: 13 },
  { band: "galactic_cosmic", minLog10M: 13, maxLog10M: 23 },
] as const satisfies ReadonlyArray<{
  band: Exclude<TheoryBiomeBand, "abstract_formal" | "claim_boundary">;
  minLog10M: number;
  maxLog10M: number;
}>;

export const THEORY_BIOME_BAND_ORDER: TheoryBiomeBand[] = [
  "abstract_formal",
  "planck_quantum",
  "nuclear",
  "atomic",
  "molecular",
  "cellular_biophysical",
  "device_laboratory",
  "human_engineering",
  "planetary",
  "stellar",
  "galactic_cosmic",
  "claim_boundary",
];

export const THEORY_BIOME_DOMAIN_ORDER = [
  "foundation",
  "relativity_history",
  "quantum",
  "atomic_spectroscopy",
  "astrochemistry",
  "prebiotic_biophysics",
  "evolutionary_biophysics",
  "solar",
  "stellar",
  "casimir",
  "nhm2",
  "qei_stress_energy",
  "tokamak_plasma",
  "galactic_dynamics",
  "curvature_collapse",
  "claim_boundary",
  "general",
] as const;

const FIDELITY_BY_LEVEL: Record<TheoryBadgeLevel, TheoryBiomeFidelity> = {
  first_principle: "canonical",
  law: "canonical",
  derived_relation: "derived",
  model: "model",
  simulation_specific: "simulation_proxy",
  diagnostic_gate: "diagnostic_gate",
  claim_boundary: "claim_boundary",
};

const RUNTIME_STATUSES = new Set<TheoryBadgeStatus>(["project_derived", "diagnostic"]);

function uniqueTokens(badge: TheoryBadgeV1): Set<string> {
  return new Set(
    [
      badge.id,
      ...badge.subjects,
      ...badge.tags,
      ...badge.simulationOwners,
      ...badge.equationFamilies,
      ...badge.hintKeys.subjects,
      ...badge.hintKeys.equationFamilies,
      ...badge.hintKeys.simulationOwners,
    ].map((token: string) => token.toLowerCase()),
  );
}

function primaryTokens(badge: TheoryBadgeV1): Set<string> {
  return new Set(
    [
      badge.id,
      ...badge.subjects,
      ...badge.tags,
      ...badge.equationFamilies,
      ...badge.hintKeys.subjects,
      ...badge.hintKeys.equationFamilies,
    ].map((token: string) => token.toLowerCase()),
  );
}

function hasAny(tokens: Set<string>, values: string[]): boolean {
  return values.some((value: string) =>
    [...tokens].some((token: string) => token === value || token.includes(value)),
  );
}

function inferDomainKey(tokens: Set<string>, badge: TheoryBadgeV1): string {
  if (badge.level === "claim_boundary") return "claim_boundary";
  if (
    hasAny(tokens, [
      "relativity_history",
      "romer",
      "bradley",
      "fizeau",
      "foucault",
      "michelson_morley",
      "trouton_noble",
      "aether_drift",
      "stellar_aberration",
      "length_contraction",
      "lorentz_transform",
    ])
  ) {
    return "relativity_history";
  }
  if (hasAny(tokens, ["nhm2", "warp"])) return "nhm2";
  if (hasAny(tokens, ["qei", "stress_energy", "energy_conditions"])) return "qei_stress_energy";
  if (hasAny(tokens, ["casimir", "cavity", "tile"])) return "casimir";
  if (hasAny(tokens, ["tokamak", "plasma", "fusion_plasma"])) return "tokamak_plasma";
  if (hasAny(tokens, ["galactic", "rotation_curve", "dark_matter"])) return "galactic_dynamics";
  if (hasAny(tokens, ["curvature", "collapse", "orch_or"])) return "curvature_collapse";
  if (
    hasAny(tokens, [
      "evolutionary_biophysics",
      "common_descent",
      "phylogeny",
      "selection_fitness",
      "kingdom",
      "eukaryote",
      "cytoskeleton",
      "photosynthesis",
      "light_harvesting",
      "plant",
      "animal",
      "comparative_evidence",
      "quantum_biology",
    ])
  ) {
    return "evolutionary_biophysics";
  }
  if (
    hasAny(tokens, [
      "atomic_physics",
      "atomic_spectroscopy",
      "atomic_line",
      "element_identity",
      "ionization_charge_state",
      "electronic_level",
      "transition_gap",
      "level_population",
    ])
  ) {
    return "atomic_spectroscopy";
  }
  if (hasAny(tokens, ["astrochemistry", "fullerene", "pah", "aromatic_carbon"])) return "astrochemistry";
  if (hasAny(tokens, ["prebiotic", "biophysics", "membrane", "rna_world"])) return "prebiotic_biophysics";
  if (hasAny(tokens, ["solar", "helioseismology", "sunquake", "nanoflare"])) return "solar";
  if (hasAny(tokens, ["stellar", "starsim", "nucleosynthesis", "hydrostatic"])) return "stellar";
  if (hasAny(tokens, ["atomic_line", "spectroscopy", "molecular_band"])) return "atomic_spectroscopy";
  if (hasAny(tokens, ["quantum", "planck", "energy_frequency", "photon", "radiation", "radiation_mode", "field_state"])) return "quantum";
  if (hasAny(tokens, ["first_principles", "foundation", "units", "dimensions", "constants"])) return "foundation";
  return "general";
}

function inferFidelity(badge: TheoryBadgeV1): TheoryBiomeFidelity {
  if (badge.level === "claim_boundary") return "claim_boundary";
  if (badge.sourceRefs.some((source) => source.kind === "artifact")) return "runtime_artifact";
  if (RUNTIME_STATUSES.has(badge.status) && badge.level === "simulation_specific") return "runtime_artifact";
  return FIDELITY_BY_LEVEL[badge.level];
}

export function inferTheoryBiomeCoordinateSeed(badge: TheoryBadgeV1): {
  scaleLog10M: number | null;
  scaleBand: TheoryBiomeBand;
  domainKey: string;
  fidelity: TheoryBiomeFidelity;
  reasons: string[];
} {
  const tokens = uniqueTokens(badge);
  const coreTokens = primaryTokens(badge);
  const primaryDomainKey = inferDomainKey(coreTokens, badge);
  const domainKey = primaryDomainKey === "general" ? inferDomainKey(tokens, badge) : primaryDomainKey;
  const fidelity = inferFidelity(badge);
  const reasons: string[] = [`domain:${domainKey}`, `fidelity:${fidelity}`];

  if (badge.level === "claim_boundary") {
    return {
      scaleLog10M: null,
      scaleBand: "claim_boundary",
      domainKey,
      fidelity: "claim_boundary",
      reasons: [...reasons, "claim-boundary ridge"],
    };
  }

  if (
    badge.id === "physics.radiation.massless_photon_kinematics_context" ||
    badge.id === "physics.radiation.mode_context" ||
    badge.id === "physics.radiation.quantum_field_state_context" ||
    badge.id === "physics.energy.amount_to_density_context"
  ) {
    return {
      scaleLog10M: null,
      scaleBand: "abstract_formal",
      domainKey,
      fidelity,
      reasons: [...reasons, "scale-free formal relation"],
    };
  }

  if (
    domainKey === "atomic_spectroscopy" ||
    hasAny(coreTokens, [
      "atomic_physics",
      "atomic_line",
      "element_identity",
      "ionization_charge_state",
      "electronic_level",
      "transition_gap",
      "level_population",
    ])
  ) {
    return {
      scaleLog10M: -10,
      scaleBand: "atomic",
      domainKey,
      fidelity,
      reasons: [...reasons, "atomic-state or spectroscopy metadata"],
    };
  }

  if (
    (domainKey === "stellar" || domainKey === "solar") &&
    hasAny(coreTokens, ["stellar", "starsim", "nucleosynthesis", "hydrostatic", "solar", "helioseismology"])
  ) {
    return {
      scaleLog10M: hasAny(coreTokens, ["solar", "helioseismology", "sunquake", "nanoflare"]) ? 9 : 10,
      scaleBand: "stellar",
      domainKey,
      fidelity,
      reasons: [...reasons, "strong stellar/solar scale metadata"],
    };
  }

  if (
    badge.level === "first_principle" ||
    hasAny(tokens, [
      "first_principles",
      "foundation",
      "units",
      "dimensions",
      "constants",
      "einstein_field_equation",
      "adm_decomposition",
      "stress_energy_conservation",
    ])
  ) {
    return {
      scaleLog10M: null,
      scaleBand: "abstract_formal",
      domainKey,
      fidelity,
      reasons: [...reasons, "formal anchor"],
    };
  }

  if (hasAny(tokens, ["lorentz_transform", "length_contraction", "relativity_history_claim_boundary"])) {
    return {
      scaleLog10M: null,
      scaleBand: "abstract_formal",
      domainKey,
      fidelity,
      reasons: [...reasons, "formal relativity-history endpoint"],
    };
  }

  if (hasAny(tokens, ["galactic", "cosmic_distance", "hubble_law", "rotation_curve", "dark_matter"])) {
    return {
      scaleLog10M: 20,
      scaleBand: "galactic_cosmic",
      domainKey,
      fidelity,
      reasons: [...reasons, "galactic/cosmic metadata"],
    };
  }

  if (hasAny(tokens, ["romer", "io_eclipse", "jupiter", "bradley", "stellar_aberration", "earth_orbit"])) {
    return {
      scaleLog10M: 7,
      scaleBand: "planetary",
      domainKey,
      fidelity,
      reasons: [...reasons, "astronomical relativity-history metadata"],
    };
  }

  if (
    hasAny(tokens, [
      "fizeau",
      "foucault",
      "toothed_wheel",
      "rotating_mirror",
      "flowing_water",
      "michelson_morley",
      "trouton_noble",
      "interferometer",
      "aether_drift",
    ])
  ) {
    return {
      scaleLog10M: -1,
      scaleBand: "device_laboratory",
      domainKey,
      fidelity,
      reasons: [...reasons, "laboratory relativity-history metadata"],
    };
  }

  if (hasAny(tokens, ["molecular_band", "aromatic_ring", "fullerene", "pah", "prebiotic", "rna_world", "molecule"])) {
    return {
      scaleLog10M: -8,
      scaleBand: "molecular",
      domainKey,
      fidelity,
      reasons: [...reasons, "molecular metadata"],
    };
  }

  if (hasAny(tokens, ["photosynthesis", "light_harvesting", "exciton", "pigment", "quantum_biology"])) {
    return {
      scaleLog10M: -8,
      scaleBand: "molecular",
      domainKey,
      fidelity,
      reasons: [...reasons, "photosynthetic molecular-biophysics metadata"],
    };
  }

  if (hasAny(tokens, ["microtubule", "cellular", "membrane", "biophysics"])) {
    return {
      scaleLog10M: -5,
      scaleBand: "cellular_biophysical",
      domainKey,
      fidelity,
      reasons: [...reasons, "cellular/biophysical metadata"],
    };
  }

  if (hasAny(tokens, ["common_descent", "phylogeny", "selection_fitness", "kingdom", "eukaryote", "plant", "animal"])) {
    return {
      scaleLog10M: -5,
      scaleBand: "cellular_biophysical",
      domainKey,
      fidelity,
      reasons: [...reasons, "evolutionary/cellular-biophysical metadata"],
    };
  }

  if (hasAny(tokens, ["stellar", "starsim", "nucleosynthesis", "hydrostatic", "solar", "helioseismology"])) {
    return {
      scaleLog10M: hasAny(tokens, ["solar", "helioseismology", "sunquake", "nanoflare"]) ? 9 : 10,
      scaleBand: "stellar",
      domainKey,
      fidelity,
      reasons: [...reasons, "stellar/solar metadata"],
    };
  }

  if (hasAny(tokens, ["planetary", "orbital", "earth", "moon"])) {
    return {
      scaleLog10M: 7,
      scaleBand: "planetary",
      domainKey,
      fidelity,
      reasons: [...reasons, "planetary metadata"],
    };
  }

  if (hasAny(tokens, ["nhm2", "warp", "hull", "route", "ship"])) {
    return {
      scaleLog10M: 2,
      scaleBand: "human_engineering",
      domainKey,
      fidelity,
      reasons: [...reasons, "NHM2/human-engineering metadata"],
    };
  }

  if (hasAny(tokens, ["casimir", "cavity", "tile", "qei", "tokamak", "plasma", "laboratory"])) {
    return {
      scaleLog10M: -3,
      scaleBand: "device_laboratory",
      domainKey,
      fidelity,
      reasons: [...reasons, "device/laboratory metadata"],
    };
  }

  if (hasAny(tokens, ["atomic_line", "atom", "zeeman"])) {
    return {
      scaleLog10M: -10,
      scaleBand: "atomic",
      domainKey,
      fidelity,
      reasons: [...reasons, "atomic metadata"],
    };
  }

  if (hasAny(tokens, ["nuclear", "fusion"])) {
    return {
      scaleLog10M: -15,
      scaleBand: "nuclear",
      domainKey,
      fidelity,
      reasons: [...reasons, "nuclear metadata"],
    };
  }

  if (hasAny(tokens, ["quantum", "planck", "collapse", "objective_collapse", "energy_frequency"])) {
    return {
      scaleLog10M: -18,
      scaleBand: "planck_quantum",
      domainKey,
      fidelity,
      reasons: [...reasons, "quantum metadata"],
    };
  }

  return {
    scaleLog10M: null,
    scaleBand: "abstract_formal",
    domainKey,
    fidelity,
    reasons: [...reasons, "fallback formal context"],
  };
}
