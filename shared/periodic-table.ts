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
  originSummary: string;
  observableRoutes: ElementObservableRoute[];
  evidenceNotes: string[];
  claimBoundaryNotes: string[];
  sourceKeys: ElementOriginSourceKey[];
};

export type ElementOriginProfile = {
  originFamilies: ElementOriginFamily[];
  primaryOrigin?: ElementOriginFamily;
  originSummary: string;
  observableRoutes?: ElementObservableRoute[];
  evidenceNotes?: string[];
  sourceKeys?: ElementOriginSourceKey[];
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

const defaultEvidenceNote = (summary: string): string =>
  `${summary} Observable support should come from atomic spectra, abundance patterns, isotopic ratios, sample inventory, or laboratory decay-chain evidence.`;

function profile(
  originFamilies: ElementOriginFamily[],
  originSummary: string,
  options?: Omit<ElementOriginProfile, "originFamilies" | "originSummary">,
): ElementOriginProfile {
  return {
    originFamilies,
    primaryOrigin: options?.primaryOrigin ?? originFamilies[0],
    originSummary,
    observableRoutes: options?.observableRoutes,
    evidenceNotes: options?.evidenceNotes ?? [defaultEvidenceNote(originSummary)],
    sourceKeys: options?.sourceKeys,
  };
}

function assignProfile(
  target: Record<string, ElementOriginProfile>,
  symbols: readonly string[],
  assignedProfile: ElementOriginProfile,
): void {
  for (const symbol of symbols) {
    target[symbol] = assignedProfile;
  }
}

function buildElementOriginProfileMap(): Record<string, ElementOriginProfile> {
  const profiles: Record<string, ElementOriginProfile> = {};

  profiles.H = profile(
    ["big_bang_nucleosynthesis"],
    "Hydrogen is anchored primarily to Big Bang nucleosynthesis and survives as the dominant baryonic fuel for later stellar burning.",
    {
      observableRoutes: ["isotopic_abundance", "atomic_line_spectroscopy", "molecular_cloud_inventory"],
      sourceKeys: ["wagoner_fowler_hoyle_1967", "nist_asd", "van_dishoeck_2013"],
    },
  );
  profiles.He = profile(
    ["big_bang_nucleosynthesis", "hydrogen_burning"],
    "Helium is anchored to primordial light-element production and to stellar hydrogen burning through proton-proton and CNO-cycle contexts.",
    {
      observableRoutes: ["isotopic_abundance", "stellar_abundance_pattern", "atomic_line_spectroscopy"],
      sourceKeys: ["wagoner_fowler_hoyle_1967", "bethe_1939", "b2fh_1957", "nist_asd"],
    },
  );
  profiles.Li = profile(
    ["big_bang_nucleosynthesis", "cosmic_ray_spallation"],
    "Lithium is a mixed light-element case: Big Bang nucleosynthesis is relevant, while cosmic-ray spallation and isotope-specific astrophysics constrain later inventories.",
    {
      observableRoutes: ["isotopic_abundance", "meteorite_or_sample_inventory", "atomic_line_spectroscopy"],
      sourceKeys: ["wagoner_fowler_hoyle_1967", "viola_mathews_1985", "nist_asd"],
    },
  );
  assignProfile(
    profiles,
    ["Be", "B"],
    profile(
      ["cosmic_ray_spallation"],
      "Beryllium and boron are anchored primarily to cosmic-ray spallation of CNO nuclei in low-density interstellar material.",
      {
        observableRoutes: ["isotopic_abundance", "meteorite_or_sample_inventory", "atomic_line_spectroscopy"],
        sourceKeys: ["viola_mathews_1985", "nist_asd"],
      },
    ),
  );
  profiles.C = profile(
    ["helium_burning_triple_alpha"],
    "Carbon is anchored to helium burning through the triple-alpha pathway before later stellar, dust, and organic chemistry contexts.",
    {
      observableRoutes: ["stellar_abundance_pattern", "atomic_line_spectroscopy", "molecular_cloud_inventory"],
      sourceKeys: ["hoyle_1954", "b2fh_1957", "kobayashi_2020", "nist_asd"],
    },
  );
  profiles.N = profile(
    ["hydrogen_burning", "explosive_nucleosynthesis"],
    "Nitrogen is anchored to CNO-cycle processing and stellar yield context, with abundance interpretation depending on stellar mass and chemical-evolution environment.",
    {
      observableRoutes: ["stellar_abundance_pattern", "atomic_line_spectroscopy", "molecular_cloud_inventory"],
      sourceKeys: ["bethe_1939", "b2fh_1957", "kobayashi_2020", "nist_asd"],
    },
  );
  profiles.O = profile(
    ["alpha_capture", "advanced_stellar_burning"],
    "Oxygen is anchored to helium-burning and alpha-capture stellar nucleosynthesis, not direct hydrogen burning.",
    {
      observableRoutes: ["stellar_abundance_pattern", "atomic_line_spectroscopy", "molecular_cloud_inventory"],
      sourceKeys: ["hoyle_1954", "b2fh_1957", "kobayashi_2020", "nist_asd", "van_dishoeck_2013"],
    },
  );

  assignProfile(
    profiles,
    ["Ne", "Mg", "Si", "S", "Ar", "Ca"],
    profile(
      ["alpha_capture", "advanced_stellar_burning"],
      "The even-Z alpha elements from neon through calcium are anchored to alpha-capture and massive-star burning contexts.",
      {
        observableRoutes: ["stellar_abundance_pattern", "atomic_line_spectroscopy", "molecular_cloud_inventory"],
        sourceKeys: ["hoyle_1954", "b2fh_1957", "kobayashi_2020", "nist_asd"],
      },
    ),
  );
  assignProfile(
    profiles,
    ["F", "Na", "Al", "P", "Cl", "K", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn"],
    profile(
      ["advanced_stellar_burning", "explosive_nucleosynthesis"],
      "Elements from fluorine through zinc are anchored to advanced stellar burning, explosive nucleosynthesis, and stellar-yield abundance evidence at element-level resolution.",
      {
        observableRoutes: ["stellar_abundance_pattern", "atomic_line_spectroscopy", "isotopic_abundance"],
        sourceKeys: ["hoyle_1954", "b2fh_1957", "cameron_1957", "kobayashi_2020", "nist_asd"],
      },
    ),
  );
  assignProfile(
    profiles,
    ["Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr", "Nb", "Mo"],
    profile(
      ["s_process", "r_process", "explosive_nucleosynthesis"],
      "Elements from gallium through molybdenum are represented as mixed heavy-element yield context with s-process, r-process, and explosive contributions depending on isotope and environment.",
      {
        observableRoutes: ["stellar_abundance_pattern", "isotopic_abundance", "atomic_line_spectroscopy"],
        sourceKeys: ["b2fh_1957", "kappeler_2011", "cowan_2021", "kobayashi_2020", "nist_asd"],
      },
    ),
  );
  profiles.Tc = profile(
    ["s_process", "radioactive_decay_chain"],
    "Technetium is an unstable element-level marker tied to s-process stellar evidence and radioactive decay-chain observability.",
    {
      observableRoutes: ["stellar_abundance_pattern", "laboratory_decay_chain", "atomic_line_spectroscopy"],
      sourceKeys: ["b2fh_1957", "kappeler_2011", "nist_asd"],
    },
  );
  assignProfile(
    profiles,
    ["Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe", "Cs", "Ba"],
    profile(
      ["s_process", "r_process", "p_process_or_photodisintegration"],
      "Elements from ruthenium through barium are represented as isotope-dependent neutron-capture and proton-rich isotope context.",
      {
        observableRoutes: ["stellar_abundance_pattern", "isotopic_abundance", "atomic_line_spectroscopy"],
        sourceKeys: ["b2fh_1957", "kappeler_2011", "cowan_2021", "kobayashi_2020", "nist_asd"],
      },
    ),
  );
  assignProfile(
    profiles,
    ["La", "Ce", "Pr", "Nd"],
    profile(
      ["s_process", "r_process"],
      "The early lanthanides are represented as mixed s-process and r-process heavy-element abundance context.",
      {
        observableRoutes: ["stellar_abundance_pattern", "isotopic_abundance", "atomic_line_spectroscopy"],
        sourceKeys: ["b2fh_1957", "kappeler_2011", "cowan_2021", "kobayashi_2020", "nist_asd"],
      },
    ),
  );
  profiles.Pm = profile(
    ["r_process", "radioactive_decay_chain"],
    "Promethium is represented as unstable heavy-element context tied to rapid neutron-capture inheritance and radioactive decay-chain observability.",
    {
      observableRoutes: ["isotopic_abundance", "laboratory_decay_chain", "atomic_line_spectroscopy"],
      sourceKeys: ["cowan_2021", "kobayashi_2020", "nist_asd"],
    },
  );
  assignProfile(
    profiles,
    ["Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au"],
    profile(
      ["r_process", "s_process"],
      "Lanthanides and heavy elements through gold are represented as mixed neutron-capture context, with r-process and s-process weights depending on isotope and abundance pattern.",
      {
        observableRoutes: ["stellar_abundance_pattern", "isotopic_abundance", "atomic_line_spectroscopy"],
        sourceKeys: ["b2fh_1957", "kappeler_2011", "cowan_2021", "kobayashi_2020", "nist_asd"],
      },
    ),
  );
  assignProfile(
    profiles,
    ["Hg", "Tl", "Pb", "Bi"],
    profile(
      ["s_process", "r_process", "radioactive_decay_chain"],
      "Mercury through bismuth are represented as heavy neutron-capture and decay-chain endpoint context at element-level resolution.",
      {
        observableRoutes: ["stellar_abundance_pattern", "isotopic_abundance", "laboratory_decay_chain", "atomic_line_spectroscopy"],
        sourceKeys: ["b2fh_1957", "kappeler_2011", "cowan_2021", "kobayashi_2020", "nist_asd"],
      },
    ),
  );
  assignProfile(
    profiles,
    ["Po", "At", "Rn", "Fr", "Ra", "Ac", "Th", "Pa", "U"],
    profile(
      ["r_process", "radioactive_decay_chain"],
      "Polonium through uranium are represented as actinide-side r-process inheritance and radioactive decay-chain context.",
      {
        observableRoutes: ["isotopic_abundance", "laboratory_decay_chain", "atomic_line_spectroscopy"],
        sourceKeys: ["cowan_2021", "kobayashi_2020", "nist_asd"],
      },
    ),
  );
  assignProfile(
    profiles,
    ["Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr"],
    profile(
      ["synthetic_lab", "radioactive_decay_chain"],
      "Neptunium through lawrencium are represented as laboratory/actinide radioactive-chain context at graph level, with natural trace claims requiring separate evidence.",
      {
        observableRoutes: ["laboratory_decay_chain", "atomic_line_spectroscopy"],
        sourceKeys: ["oganessian_2019", "nist_asd"],
      },
    ),
  );
  assignProfile(
    profiles,
    ["Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"],
    profile(
      ["synthetic_lab"],
      "Transactinide superheavy elements are represented as laboratory synthesis and decay-chain identification context, not naturally abundant astrophysical inventory.",
      {
        observableRoutes: ["laboratory_decay_chain", "atomic_line_spectroscopy"],
        sourceKeys: ["oganessian_2019", "nist_asd"],
      },
    ),
  );

  return profiles;
}

export const ELEMENT_ORIGIN_PROFILE_BY_SYMBOL: Record<string, ElementOriginProfile> =
  buildElementOriginProfileMap();

function profileForSymbol(symbol: string): ElementOriginProfile {
  const profileForElement = ELEMENT_ORIGIN_PROFILE_BY_SYMBOL[symbol];
  if (!profileForElement) {
    throw new Error(`missing element origin profile for symbol: ${symbol}`);
  }
  return profileForElement;
}

function claimBoundaryNotesForProfile(name: string, profileForElement: ElementOriginProfile): string[] {
  const origins = profileForElement.originFamilies;
  const notes = [
    `${name}: element-origin badge is diagnostic context, not a proof of molecular formation or life.`,
    `${name}: observable identification requires spectral, abundance, isotopic, sample, or laboratory evidence.`,
    `${name}: ${profileForElement.originSummary}`,
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
  const profileForElement = profileForSymbol(symbol);
  const originFamilies = profileForElement.originFamilies;
  return {
    ...entry,
    symbol,
    originFamilies,
    primaryOrigin: profileForElement.primaryOrigin ?? originFamilies[0],
    originSummary: profileForElement.originSummary,
    observableRoutes: unique([
      "atomic_line_spectroscopy",
      ...originFamilies.flatMap((origin) => OBSERVABLES_BY_ORIGIN[origin]),
      ...(profileForElement.observableRoutes ?? []),
    ]),
    evidenceNotes: profileForElement.evidenceNotes ?? [defaultEvidenceNote(profileForElement.originSummary)],
    claimBoundaryNotes: claimBoundaryNotesForProfile(entry.name, profileForElement),
    sourceKeys: unique([
      "nist_asd",
      ...originFamilies.flatMap((origin) => SOURCE_KEYS_BY_ORIGIN[origin]),
      ...(profileForElement.sourceKeys ?? []),
    ]),
  };
});
