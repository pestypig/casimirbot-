import {
  type TheoryBadgeClaimBoundaryV1,
  type TheoryBadgeEdgeV1,
  type TheoryBadgeSourceRefV1,
  type TheoryBadgeV1,
} from "../contracts/theory-badge-graph.v1";
import {
  ELEMENT_ORIGIN_REGISTRY,
  type ElementOriginEntry,
  type ElementOriginFamily,
  type ElementOriginSourceKey,
} from "../periodic-table";
import { NUCLEOSYNTHESIS_ORIGIN_BADGE_BY_FAMILY } from "./nucleosynthesis-origin-theory-badges";

const ELEMENT_ORIGIN_BOUNDARY: TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: true,
  doesValidateNHM2: false,
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
};

const SOURCE_REFS_BY_KEY: Record<ElementOriginSourceKey, TheoryBadgeSourceRefV1> = {
  bethe_1939: {
    kind: "literature_ref",
    id: "doi:10.1103/PhysRev.55.434",
    note: "Bethe stellar energy-production reference.",
  },
  hoyle_1954: {
    kind: "literature_ref",
    id: "1954ApJS....1..121H",
    note: "Hoyle carbon-to-nickel stellar synthesis reference.",
  },
  b2fh_1957: {
    kind: "literature_ref",
    id: "doi:10.1103/RevModPhys.29.547",
    note: "B2FH stellar nucleosynthesis review.",
  },
  cameron_1957: {
    kind: "literature_ref",
    id: "AECL-CRL-41",
    note: "Cameron stellar evolution, nuclear astrophysics, and nucleogenesis reference.",
  },
  wagoner_fowler_hoyle_1967: {
    kind: "literature_ref",
    id: "doi:10.1086/149126",
    note: "Very-high-temperature synthesis and Big Bang nucleosynthesis reference.",
  },
  viola_mathews_1985: {
    kind: "literature_ref",
    id: "OSTI:6532243",
    note: "Cosmic synthesis of lithium, beryllium, and boron.",
  },
  kappeler_2011: {
    kind: "literature_ref",
    id: "doi:10.1103/RevModPhys.83.157",
    note: "s-process nuclear physics, stellar models, and observations review.",
  },
  kobayashi_2020: {
    kind: "literature_ref",
    id: "2020ApJ...900..179K",
    note: "Modern element-origin and galactic chemical-evolution context.",
  },
  cowan_2021: {
    kind: "literature_ref",
    id: "doi:10.1103/RevModPhys.93.015002",
    note: "r-process origin of the heaviest elements review.",
  },
  van_dishoeck_2013: {
    kind: "literature_ref",
    id: "doi:10.1021/cr4003177",
    note: "Interstellar water chemistry review.",
  },
  nist_asd: {
    kind: "literature_ref",
    id: "doi:10.18434/T4W30F",
    note: "NIST Atomic Spectra Database.",
  },
  oganessian_2019: {
    kind: "literature_ref",
    id: "doi:10.1103/RevModPhys.91.011001",
    note: "Superheavy elements review.",
  },
};

const ORIGIN_FAMILY_LABELS: Record<ElementOriginFamily, string> = {
  big_bang_nucleosynthesis: "Big Bang nucleosynthesis",
  hydrogen_burning: "hydrogen burning",
  helium_burning_triple_alpha: "triple-alpha helium burning",
  alpha_capture: "alpha-capture stellar nucleosynthesis",
  advanced_stellar_burning: "advanced stellar burning",
  explosive_nucleosynthesis: "explosive nucleosynthesis",
  cosmic_ray_spallation: "cosmic-ray spallation",
  s_process: "slow neutron capture",
  r_process: "rapid neutron capture",
  p_process_or_photodisintegration: "p-process or photodisintegration",
  radioactive_decay_chain: "radioactive decay-chain inheritance",
  synthetic_lab: "laboratory synthesis",
};

function elementBadgeId(entry: Pick<ElementOriginEntry, "symbol">): string {
  return `element.${entry.symbol.toLowerCase()}.origin`;
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function sourceRefsForEntry(entry: ElementOriginEntry): TheoryBadgeSourceRefV1[] {
  return unique(entry.sourceKeys).map((key) => SOURCE_REFS_BY_KEY[key]);
}

function elementBadge(entry: ElementOriginEntry): TheoryBadgeV1 {
  const symbol = entry.symbol;
  const originLabels = entry.originFamilies.map((family) => ORIGIN_FAMILY_LABELS[family]);
  const sourceRefs = sourceRefsForEntry(entry);
  return {
    id: elementBadgeId(entry),
    title: `${symbol} ${entry.name} Element-Origin Context`,
    plainMeaning: `Represents ${entry.name} (${symbol}, Z=${entry.Z}) as a periodic-table element with bounded origin-family context.`,
    whyItMatters:
      `It lets Helix connect ${entry.name} to nucleosynthesis, observable spectral or abundance routes, and downstream chemistry without overclaiming.`,
    subjects: ["periodic_table", "element_origin", entry.name, symbol.toLowerCase(), ...entry.originFamilies],
    level: entry.originFamilies.includes("synthetic_lab") ? "diagnostic_gate" : "model",
    status: entry.originFamilies.includes("synthetic_lab") ? "diagnostic" : "canonical_reference",
    simulationOwners: ["stellar_reference", "astrochemistry_prebiotic"],
    equationFamilies: ["element_origin_context", ...entry.originFamilies],
    tags: [
      "periodic_element",
      "element_origin",
      "atomic_line_observable",
      `Z_${entry.Z}`,
      ...entry.observableRoutes,
    ],
    equations: [
      {
        id: `${symbol.toLowerCase()}_element_origin_context`,
        role: "noncomputable_reference",
        displayLatex: `\\mathrm{origin}_{${symbol}}=\\mathrm{context}(Z=${entry.Z},\\mathrm{origin\\ family},\\mathrm{observable})`,
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: [`Z_${symbol}`, `${symbol}_origin_family`, `${symbol}_observable_route`],
        outputSymbols: [`${symbol}_element_origin_context`],
      },
    ],
    units: [
      { symbol: `Z_${symbol}`, unit: null, quantity: "atomic_number", dimensionSignature: "1" },
      { symbol, unit: null, quantity: "chemical_symbol", dimensionSignature: "1" },
    ],
    assumptions: [
      `${entry.name} origin families: ${originLabels.join(", ")}.`,
      `${entry.name} origin summary: ${entry.originSummary}`,
      ...entry.evidenceNotes,
      ...entry.claimBoundaryNotes,
      "Element presence is a prerequisite for downstream chemistry, not proof that a molecule or biological pathway formed.",
    ],
    calculatorPayloads: [],
    sourceRefs,
    hintKeys: {
      subjects: ["periodic_table", "element_origin", entry.name, symbol.toLowerCase(), ...entry.originFamilies],
      symbols: [symbol, `Z_${symbol}`, `${symbol}_element_origin_context`],
      unitSignatures: ["1"],
      repoPaths: sourceRefs.map((ref) => ref.path).filter((path): path is string => Boolean(path)),
      equationFamilies: ["element_origin_context", ...entry.originFamilies],
      simulationOwners: ["stellar_reference", "astrochemistry_prebiotic"],
    },
    claimBoundary: ELEMENT_ORIGIN_BOUNDARY,
  };
}

const molecularCloudBadge = (badge: Omit<TheoryBadgeV1, "claimBoundary">): TheoryBadgeV1 => ({
  ...badge,
  claimBoundary: ELEMENT_ORIGIN_BOUNDARY,
});

export const MOLECULAR_CLOUD_ELEMENT_THEORY_BADGES: TheoryBadgeV1[] = [
  molecularCloudBadge({
    id: "astrochemistry.molecular_cloud.elemental_inheritance_context",
    title: "Molecular Cloud Elemental Inheritance Context",
    plainMeaning:
      "Represents molecular clouds as inheriting element and isotope inventories from prior stellar and galactic chemical evolution.",
    whyItMatters:
      "It separates inherited elemental possibility space from the local chemistry needed to form molecules.",
    subjects: ["astrochemistry", "molecular_cloud", "elemental_inheritance", "galactic_chemical_evolution"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["astrochemistry_prebiotic", "stellar_reference"],
    equationFamilies: ["molecular_cloud_inventory", "elemental_inheritance_context"],
    tags: ["molecular_cloud", "elemental_inventory", "diagnostic_context"],
    equations: [
      {
        id: "molecular_cloud_inheritance_context",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{cloud\\ inventory}=\\mathrm{mix}(Y_i,\\rho,T,\\mathrm{radiation},\\mathrm{dust})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["Y_i", "rho", "T", "radiation", "dust"],
        outputSymbols: ["cloud_inventory"],
      },
    ],
    units: [
      { symbol: "Y_i", quantity: "element_abundance", dimensionSignature: "1" },
      { symbol: "rho", quantity: "density", dimensionSignature: "M L^-3" },
      { symbol: "T", unit: "K", quantity: "temperature", dimensionSignature: "Theta" },
    ],
    assumptions: [
      "Molecular clouds inherit element inventories from prior stellar and interstellar processing.",
      "Inherited elements do not guarantee any specific molecule without local density, temperature, radiation, dust, and ionization context.",
    ],
    calculatorPayloads: [],
    sourceRefs: [
      SOURCE_REFS_BY_KEY.kobayashi_2020,
      SOURCE_REFS_BY_KEY.van_dishoeck_2013,
    ],
    hintKeys: {
      subjects: ["astrochemistry", "molecular_cloud", "elemental_inheritance"],
      symbols: ["Y_i", "rho", "T", "cloud_inventory"],
      unitSignatures: ["1", "M L^-3", "Theta"],
      repoPaths: [],
      equationFamilies: ["molecular_cloud_inventory", "elemental_inheritance_context"],
      simulationOwners: ["astrochemistry_prebiotic", "stellar_reference"],
    },
  }),
  molecularCloudBadge({
    id: "astrochemistry.dust_grain.surface_reaction_context",
    title: "Dust-Grain Surface Reaction Context",
    plainMeaning:
      "Represents dust-grain and ice-surface chemistry as local context for molecular formation in cold interstellar environments.",
    whyItMatters:
      "It keeps element availability separate from the surface chemistry and desorption routes that affect molecular inventories.",
    subjects: ["astrochemistry", "dust_grain", "surface_reaction", "ice_chemistry", "molecular_cloud"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["astrochemistry_prebiotic"],
    equationFamilies: ["surface_reaction_context", "gas_ice_chemistry"],
    tags: ["dust_grain", "ice_chemistry", "water_context"],
    equations: [
      {
        id: "dust_grain_surface_context",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{surface\\ route}=\\mathrm{context}(\\mathrm{dust},\\mathrm{ice},T,\\mathrm{UV})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["dust", "ice", "T", "UV"],
        outputSymbols: ["surface_route"],
      },
    ],
    units: [{ symbol: "T", unit: "K", quantity: "temperature", dimensionSignature: "Theta" }],
    assumptions: [
      "Dust-grain chemistry is local environmental context.",
      "Surface reaction context does not prove delivery to planets or prebiotic success.",
    ],
    calculatorPayloads: [],
    sourceRefs: [SOURCE_REFS_BY_KEY.van_dishoeck_2013],
    hintKeys: {
      subjects: ["astrochemistry", "dust_grain", "surface_reaction", "ice_chemistry"],
      symbols: ["dust", "ice", "T", "UV", "surface_route"],
      unitSignatures: ["Theta"],
      repoPaths: [],
      equationFamilies: ["surface_reaction_context", "gas_ice_chemistry"],
      simulationOwners: ["astrochemistry_prebiotic"],
    },
  }),
  molecularCloudBadge({
    id: "astrochemistry.water.h_o_binding_context",
    title: "Water H-O Binding Context",
    plainMeaning:
      "Represents water as a molecular-cloud chemistry context requiring hydrogen, oxygen, and local formation/destruction routes.",
    whyItMatters:
      "It makes water explainable from element inheritance and chemistry conditions without saying H and O alone are sufficient.",
    subjects: ["astrochemistry", "water", "hydrogen", "oxygen", "molecular_cloud", "gas_ice_chemistry"],
    level: "model",
    status: "diagnostic",
    simulationOwners: ["astrochemistry_prebiotic", "stellar_reference"],
    equationFamilies: ["water_chemistry_context", "gas_ice_chemistry"],
    tags: ["water", "molecular_cloud", "h_o_context", "claim_boundary"],
    equations: [
      {
        id: "water_formation_context",
        role: "noncomputable_reference",
        displayLatex: "\\mathrm{H_2O}=\\mathrm{context}(\\mathrm{H},\\mathrm{O},\\rho,T,\\mathrm{ionization},\\mathrm{dust})",
        computableExpression: null,
        operatorKind: "noncomputable_reference",
        inputSymbols: ["H", "O", "rho", "T", "ionization", "dust"],
        outputSymbols: ["H2O_context"],
      },
    ],
    units: [
      { symbol: "rho", quantity: "density", dimensionSignature: "M L^-3" },
      { symbol: "T", unit: "K", quantity: "temperature", dimensionSignature: "Theta" },
    ],
    assumptions: [
      "Water formation has multiple interstellar routes, including ion-molecule, neutral-neutral, and gas-ice chemistry.",
      "Hydrogen and oxygen are required element context, but local physical chemistry determines whether water forms or survives.",
      "Water context is not a claim of habitability, life, or prebiotic success.",
    ],
    calculatorPayloads: [],
    sourceRefs: [SOURCE_REFS_BY_KEY.van_dishoeck_2013],
    hintKeys: {
      subjects: ["astrochemistry", "water", "hydrogen", "oxygen", "molecular_cloud"],
      symbols: ["H", "O", "H2O_context", "rho", "T"],
      unitSignatures: ["M L^-3", "Theta"],
      repoPaths: [],
      equationFamilies: ["water_chemistry_context", "gas_ice_chemistry"],
      simulationOwners: ["astrochemistry_prebiotic", "stellar_reference"],
    },
  }),
];

export const PERIODIC_ELEMENT_ORIGIN_THEORY_BADGES: TheoryBadgeV1[] =
  ELEMENT_ORIGIN_REGISTRY.map((entry) => elementBadge(entry));

const ELEMENT_BADGE_ID_BY_SYMBOL = Object.fromEntries(
  ELEMENT_ORIGIN_REGISTRY.map((entry) => [entry.symbol, elementBadgeId(entry)]),
) as Record<string, string>;

function originEdgesForEntry(entry: ElementOriginEntry): TheoryBadgeEdgeV1[] {
  return entry.originFamilies.map((originFamily) => ({
    id: `${originFamily}_derives_element_${entry.symbol.toLowerCase()}`,
    from: NUCLEOSYNTHESIS_ORIGIN_BADGE_BY_FAMILY[originFamily],
    to: elementBadgeId(entry),
    relation: "derives",
    label: `${ORIGIN_FAMILY_LABELS[originFamily]} provides bounded origin context for ${entry.name}.`,
    claimBoundaryNote: "Element-origin derivation is diagnostic and may be isotope- or environment-dependent.",
  }));
}

function observableEdgesForEntry(entry: ElementOriginEntry): TheoryBadgeEdgeV1[] {
  const id = elementBadgeId(entry);
  return [
    {
      id: `element_${entry.symbol.toLowerCase()}_requires_atomic_line_context`,
      from: id,
      to: "stellar.spectroscopy.atomic_line_identification_context",
      relation: "requires",
      label: `${entry.name} explanations require atomic or ionic observable context before identification claims.`,
      claimBoundaryNote: "Atomic-line context identifies candidates; it does not prove a formation route.",
    },
    {
      id: `element_${entry.symbol.toLowerCase()}_documents_yield_prior`,
      from: id,
      to: "starsim.nucleosynthesis.element_yield_prior",
      relation: "documents",
      label: `${entry.name} can document reduced-order element-yield prior context.`,
      claimBoundaryNote: "Yield-prior context remains diagnostic unless a runtime yield table or receipt is attached.",
    },
  ];
}

const PREBIOTIC_DOCUMENT_SYMBOLS = ["C", "N", "O", "P", "S"] as const;

const prebioticInventoryEdges: TheoryBadgeEdgeV1[] = PREBIOTIC_DOCUMENT_SYMBOLS.map((symbol) => ({
  id: `element_${symbol.toLowerCase()}_documents_prebiotic_inventory_context`,
  from: ELEMENT_BADGE_ID_BY_SYMBOL[symbol],
  to: "prebiotic.inventory.meteoritic_organics_context",
  relation: "documents",
  label: `${symbol} element-origin context can document prebiotic inventory discussions.`,
  claimBoundaryNote: "Element availability is ingredient context only and does not derive prebiotic success.",
}));

const waterContextEdges: TheoryBadgeEdgeV1[] = [
  {
    id: "element_h_requires_water_binding_context",
    from: ELEMENT_BADGE_ID_BY_SYMBOL.H,
    to: "astrochemistry.water.h_o_binding_context",
    relation: "requires",
    label: "Hydrogen element context is required for water chemistry discussions.",
    claimBoundaryNote: "Hydrogen availability does not guarantee water formation.",
  },
  {
    id: "element_o_requires_water_binding_context",
    from: ELEMENT_BADGE_ID_BY_SYMBOL.O,
    to: "astrochemistry.water.h_o_binding_context",
    relation: "requires",
    label: "Oxygen element context is required for water chemistry discussions.",
    claimBoundaryNote: "Oxygen availability does not guarantee water formation.",
  },
  {
    id: "molecular_cloud_inheritance_requires_water_binding_context",
    from: "astrochemistry.molecular_cloud.elemental_inheritance_context",
    to: "astrochemistry.water.h_o_binding_context",
    relation: "requires",
    label: "Water chemistry requires inherited elemental inventory and local molecular-cloud context.",
    claimBoundaryNote: "Inherited inventory is necessary context, not a guarantee of water abundance.",
  },
  {
    id: "dust_grain_surface_context_documents_water_binding_context",
    from: "astrochemistry.dust_grain.surface_reaction_context",
    to: "astrochemistry.water.h_o_binding_context",
    relation: "documents",
    label: "Dust-grain and gas-ice context documents one interstellar water formation route.",
    claimBoundaryNote: "Surface chemistry context remains condition-dependent and diagnostic.",
  },
  {
    id: "water_binding_context_documents_meteoritic_inventory",
    from: "astrochemistry.water.h_o_binding_context",
    to: "prebiotic.inventory.meteoritic_organics_context",
    relation: "documents",
    label: "Water chemistry context can document hydrated or aqueous inventory discussions.",
    claimBoundaryNote: "Water context is not a habitability, life, or prebiotic-success claim.",
  },
];

export const PERIODIC_ELEMENT_ORIGIN_THEORY_EDGES: TheoryBadgeEdgeV1[] = [
  ...ELEMENT_ORIGIN_REGISTRY.flatMap((entry) => originEdgesForEntry(entry)),
  ...ELEMENT_ORIGIN_REGISTRY.flatMap((entry) => observableEdgesForEntry(entry)),
  ...prebioticInventoryEdges,
  ...waterContextEdges,
];

export function buildPeriodicElementOriginTheoryBadgesV1(): {
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
} {
  return {
    badges: [
      ...MOLECULAR_CLOUD_ELEMENT_THEORY_BADGES.map((badge) => ({ ...badge })),
      ...PERIODIC_ELEMENT_ORIGIN_THEORY_BADGES.map((badge) => ({ ...badge })),
    ],
    edges: PERIODIC_ELEMENT_ORIGIN_THEORY_EDGES.map((edge) => ({ ...edge })),
  };
}
