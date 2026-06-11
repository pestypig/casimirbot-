export type ElementZEntry = {
  name: string;
  Z: number;
};

export type ElementOriginFamily =
  | "big_bang_nucleosynthesis"
  | "hydrogen_burning"
  | "helium_burning_triple_alpha"
  | "alpha_capture"
  | "advanced_stellar_burning"
  | "explosive_nucleosynthesis"
  | "cosmic_ray_spallation"
  | "s_process"
  | "r_process"
  | "p_process_or_photodisintegration"
  | "radioactive_decay_chain"
  | "synthetic_lab";

export type ElementObservableRoute =
  | "atomic_line_spectroscopy"
  | "stellar_abundance_pattern"
  | "isotopic_abundance"
  | "meteorite_or_sample_inventory"
  | "molecular_cloud_inventory"
  | "laboratory_decay_chain";

export type ElementOriginSourceKey =
  | "bethe_1939"
  | "hoyle_1954"
  | "b2fh_1957"
  | "cameron_1957"
  | "wagoner_fowler_hoyle_1967"
  | "viola_mathews_1985"
  | "kappeler_2011"
  | "kobayashi_2020"
  | "cowan_2021"
  | "van_dishoeck_2013"
  | "nist_asd"
  | "oganessian_2019";

export type ElementOriginEntry = ElementZEntry & {
  symbol: string;
  originFamilies: ElementOriginFamily[];
  primaryOrigin: ElementOriginFamily;
  observableRoutes: ElementObservableRoute[];
  claimBoundaryNotes: string[];
  sourceKeys: ElementOriginSourceKey[];
};

const ELEMENT_NAMES = [
  "hydrogen", "helium", "lithium", "beryllium", "boron", "carbon", "nitrogen", "oxygen", "fluorine", "neon",
  "sodium", "magnesium", "aluminum", "silicon", "phosphorus", "sulfur", "chlorine", "argon", "potassium", "calcium",
  "scandium", "titanium", "vanadium", "chromium", "manganese", "iron", "cobalt", "nickel", "copper", "zinc",
  "gallium", "germanium", "arsenic", "selenium", "bromine", "krypton", "rubidium", "strontium", "yttrium", "zirconium",
  "niobium", "molybdenum", "technetium", "ruthenium", "rhodium", "palladium", "silver", "cadmium", "indium", "tin",
  "antimony", "tellurium", "iodine", "xenon", "cesium", "barium", "lanthanum", "cerium", "praseodymium", "neodymium",
  "promethium", "samarium", "europium", "gadolinium", "terbium", "dysprosium", "holmium", "erbium", "thulium", "ytterbium",
  "lutetium", "hafnium", "tantalum", "tungsten", "rhenium", "osmium", "iridium", "platinum", "gold", "mercury",
  "thallium", "lead", "bismuth", "polonium", "astatine", "radon", "francium", "radium", "actinium", "thorium",
  "protactinium", "uranium", "neptunium", "plutonium", "americium", "curium", "berkelium", "californium", "einsteinium", "fermium",
  "mendelevium", "nobelium", "lawrencium", "rutherfordium", "dubnium", "seaborgium", "bohrium", "hassium", "meitnerium", "darmstadtium",
  "roentgenium", "copernicium", "nihonium", "flerovium", "moscovium", "livermorium", "tennessine", "oganesson",
] as const;

const ELEMENT_SYMBOLS = [
  "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne",
  "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca",
  "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",
  "Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr",
  "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn",
  "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd",
  "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb",
  "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg",
  "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th",
  "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm",
  "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds",
  "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og",
] as const;

export const ELEMENT_Z_LOOKUP: ElementZEntry[] = ELEMENT_NAMES.map((name, index) => ({
  name,
  Z: index + 1,
}));

const SOURCE_KEYS_BY_ORIGIN: Record<ElementOriginFamily, ElementOriginSourceKey[]> = {
  big_bang_nucleosynthesis: ["wagoner_fowler_hoyle_1967"],
  hydrogen_burning: ["bethe_1939", "b2fh_1957"],
  helium_burning_triple_alpha: ["hoyle_1954", "b2fh_1957"],
  alpha_capture: ["hoyle_1954", "b2fh_1957", "kobayashi_2020"],
  advanced_stellar_burning: ["hoyle_1954", "b2fh_1957", "kobayashi_2020"],
  explosive_nucleosynthesis: ["cameron_1957", "b2fh_1957", "kobayashi_2020"],
  cosmic_ray_spallation: ["viola_mathews_1985"],
  s_process: ["b2fh_1957", "kappeler_2011"],
  r_process: ["b2fh_1957", "cowan_2021"],
  p_process_or_photodisintegration: ["b2fh_1957", "kobayashi_2020"],
  radioactive_decay_chain: ["cowan_2021", "kobayashi_2020"],
  synthetic_lab: ["oganessian_2019"],
};

const OBSERVABLES_BY_ORIGIN: Record<ElementOriginFamily, ElementObservableRoute[]> = {
  big_bang_nucleosynthesis: ["isotopic_abundance", "stellar_abundance_pattern"],
  hydrogen_burning: ["stellar_abundance_pattern", "atomic_line_spectroscopy"],
  helium_burning_triple_alpha: ["stellar_abundance_pattern", "atomic_line_spectroscopy"],
  alpha_capture: ["stellar_abundance_pattern", "atomic_line_spectroscopy", "molecular_cloud_inventory"],
  advanced_stellar_burning: ["stellar_abundance_pattern", "atomic_line_spectroscopy"],
  explosive_nucleosynthesis: ["stellar_abundance_pattern", "isotopic_abundance"],
  cosmic_ray_spallation: ["isotopic_abundance", "meteorite_or_sample_inventory"],
  s_process: ["stellar_abundance_pattern", "isotopic_abundance"],
  r_process: ["stellar_abundance_pattern", "isotopic_abundance"],
  p_process_or_photodisintegration: ["isotopic_abundance", "stellar_abundance_pattern"],
  radioactive_decay_chain: ["isotopic_abundance", "laboratory_decay_chain"],
  synthetic_lab: ["laboratory_decay_chain", "atomic_line_spectroscopy"],
};

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function originsForAtomicNumber(Z: number): ElementOriginFamily[] {
  if (Z === 1) return ["big_bang_nucleosynthesis"];
  if (Z === 2) return ["big_bang_nucleosynthesis", "hydrogen_burning"];
  if (Z === 3) return ["big_bang_nucleosynthesis", "cosmic_ray_spallation"];
  if (Z === 4 || Z === 5) return ["cosmic_ray_spallation"];
  if (Z === 6) return ["helium_burning_triple_alpha"];
  if (Z === 7) return ["hydrogen_burning", "explosive_nucleosynthesis"];
  if (Z === 8 || Z === 10 || Z === 12 || Z === 14 || Z === 16 || Z === 18 || Z === 20) {
    return ["alpha_capture", "advanced_stellar_burning"];
  }
  if (Z >= 9 && Z <= 30) return ["advanced_stellar_burning", "explosive_nucleosynthesis"];
  if (Z >= 31 && Z <= 56) return ["s_process", "r_process", "explosive_nucleosynthesis"];
  if (Z >= 57 && Z <= 83) return ["s_process", "r_process"];
  if (Z >= 84 && Z <= 92) return ["r_process", "radioactive_decay_chain"];
  return ["synthetic_lab"];
}

function claimBoundaryNotesForOrigins(name: string, origins: ElementOriginFamily[]): string[] {
  const notes = [
    `${name}: element-origin badge is diagnostic context, not a proof of molecular formation or life.`,
    `${name}: observable identification requires spectral, abundance, isotopic, sample, or laboratory evidence.`,
  ];
  if (origins.includes("synthetic_lab")) {
    notes.push(`${name}: superheavy element context is laboratory synthesis unless a source explicitly supports otherwise.`);
  }
  if (origins.includes("cosmic_ray_spallation")) {
    notes.push(`${name}: light-element origin depends on isotope and environment; do not collapse Li-Be-B to stellar fusion only.`);
  }
  return notes;
}

export const ELEMENT_ORIGIN_REGISTRY: ElementOriginEntry[] = ELEMENT_Z_LOOKUP.map((entry, index) => {
  const symbol = ELEMENT_SYMBOLS[index];
  const originFamilies = originsForAtomicNumber(entry.Z);
  return {
    ...entry,
    symbol,
    originFamilies,
    primaryOrigin: originFamilies[0],
    observableRoutes: unique([
      "atomic_line_spectroscopy",
      ...originFamilies.flatMap((origin) => OBSERVABLES_BY_ORIGIN[origin]),
    ]),
    claimBoundaryNotes: claimBoundaryNotesForOrigins(entry.name, originFamilies),
    sourceKeys: unique([
      "nist_asd",
      ...originFamilies.flatMap((origin) => SOURCE_KEYS_BY_ORIGIN[origin]),
    ]),
  };
});
