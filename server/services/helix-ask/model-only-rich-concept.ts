import { detectGeneralScienceConceptPrompt } from "./general-science-concept-guard";

export type HelixRichModelOnlyConceptSignal = {
  schema: "helix.rich_model_only_concept_signal.v1";
  applies: boolean;
  reason_codes: string[];
  should_use_long_form_composer: boolean;
  should_block_generic_fallback: boolean;
  concept_terms: string[];
  assistant_answer: false;
  raw_content_included: false;
};

type ConceptPattern = {
  term: string;
  pattern: RegExp;
};

const physicsConceptTerms: ConceptPattern[] = [
  { term: "field", pattern: /\bfield(?:s)?\b/i },
  { term: "electron", pattern: /\belectron(?:s)?\b/i },
  { term: "photon", pattern: /\bphoton(?:s)?\b/i },
  { term: "point_particle", pattern: /\bpoint[-\s]?particle(?:s)?\b/i },
  { term: "point_particle", pattern: /\bzero[-\s]?dimensional\b/i },
  { term: "dimension", pattern: /\bdimension(?:s|al)?\b/i },
  { term: "probability", pattern: /\bprobabilit(?:y|ies)\b/i },
  { term: "orbital", pattern: /\borbital(?:s)?\b/i },
  { term: "reality", pattern: /\breality\b/i },
  { term: "existence", pattern: /\bexist(?:s|ence|ent|ing)?\b/i },
  { term: "qft", pattern: /\bquantum\s+field\s+theory\b|\bQFT\b/i },
  { term: "theory_concept_badge", pattern: /\btheory\s+concept\s+badge\b/i },
  { term: "spacetime", pattern: /\bspace[-\s]?time|spacetime\b/i },
  { term: "curvature", pattern: /\bcurvature|curved\b/i },
  { term: "gravity", pattern: /\bgravity|gravitational\b/i },
  { term: "geodesic", pattern: /\bgeodesic(?:s)?\b/i },
  { term: "inertial_frame", pattern: /\binertial\s+frames?\b/i },
  { term: "tidal_force", pattern: /\btidal\s+forces?\b/i },
  { term: "virtual_particle", pattern: /\bvirtual\s+particles?\b/i },
  { term: "vacuum_fluctuation", pattern: /\bvacuum[-\s]+fluctuation(?:s)?\b/i },
  { term: "entropy", pattern: /\bentropy\b/i },
  { term: "arrow_of_time", pattern: /\barrow\s+of\s+time\b/i },
  { term: "statistical_mechanics", pattern: /\bstatistical\s+mechanics\b/i },
  { term: "measurement_problem", pattern: /\bmeasurement\s+problem\b/i },
  { term: "observer", pattern: /\bobservers?\b/i },
  { term: "measurement", pattern: /\bmeasurement(?:s)?\b/i },
  { term: "wavefunction", pattern: /\bwave\s*function|wavefunction\b/i },
  { term: "collapse", pattern: /\bcollapse\b/i },
  { term: "decoherence", pattern: /\bdecoherence\b/i },
  { term: "many_worlds", pattern: /\bmany[-\s]?worlds\b/i },
  { term: "energy_momentum", pattern: /\benergy[-\s]?momentum\b/i },
  { term: "rest_mass", pattern: /\brest\s+mass\b/i },
];

const compoundConceptCues: RegExp[] = [
  /\brelate\b/i,
  /\bconnect\b/i,
  /\bexplain(?:\s+how)?\b/i,
  /\bwhat\s+exactly\b/i,
  /\bwhy\b/i,
  /\bconcept\b/i,
  /\btheory\b/i,
  /\bmisconception\b/i,
  /\bis\s+it\s+accurate\b/i,
  /\bcompare\b/i,
  /\bclarif(?:y|ication)\b/i,
  /\buntangle\b/i,
];

const explicitConciseCues: RegExp[] = [
  /\bbrief(?:ly)?\b/i,
  /\bshort\b/i,
  /\bconcise\b/i,
  /\bone\s+sentence\b/i,
  /\bsingle\s+sentence\b/i,
  /\btl;?dr\b/i,
];

const normalizePrompt = (promptText: string): string => promptText.trim().replace(/\s+/g, " ");

const unique = (values: string[]): string[] => Array.from(new Set(values));

export function detectRichModelOnlyConceptPrompt(promptText: string): HelixRichModelOnlyConceptSignal {
  const prompt = normalizePrompt(promptText);
  const generalScienceSignal = detectGeneralScienceConceptPrompt(prompt);
  const conceptTerms = unique(
    [
      ...physicsConceptTerms
      .filter((entry) => entry.pattern.test(prompt))
      .map((entry) => entry.term),
      ...generalScienceSignal.concept_terms,
    ],
  );
  const hasConceptQuestion = compoundConceptCues.some((pattern) => pattern.test(prompt));
  const hasMultiplePhysicsTerms = conceptTerms.filter((term) => term !== "theory_concept_badge").length >= 2;
  const isLongish = prompt.length >= 180;
  const hasCompoundContractLikeShape =
    /[?？]/.test(prompt) &&
    /\b(?:and|also|since|instead|because|then|both|while)\b/i.test(prompt);
  const wantsConcise = explicitConciseCues.some((pattern) => pattern.test(prompt));
  const applies =
    !wantsConcise &&
    (hasConceptQuestion || generalScienceSignal.applies) &&
    (hasMultiplePhysicsTerms || isLongish || hasCompoundContractLikeShape);
  const reasonCodes: string[] = [];
  if (hasConceptQuestion) reasonCodes.push("compound_concept_prompt");
  if (hasMultiplePhysicsTerms) reasonCodes.push("physics_field_particle_terms");
  if (generalScienceSignal.applies) reasonCodes.push("general_science_concept_prompt");
  if (isLongish || hasCompoundContractLikeShape) reasonCodes.push("long_form_explanation_expected");
  if (applies) reasonCodes.push("generic_definition_fallback_forbidden");
  if (wantsConcise) reasonCodes.push("explicit_concise_cue");
  if (reasonCodes.length === 0) reasonCodes.push("not_rich_model_only_concept");

  return {
    schema: "helix.rich_model_only_concept_signal.v1",
    applies,
    reason_codes: unique(reasonCodes),
    should_use_long_form_composer: applies,
    should_block_generic_fallback: applies,
    concept_terms: conceptTerms,
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function isSimpleElectronDefinitionPrompt(promptText: string): boolean {
  const prompt = normalizePrompt(promptText);
  if (!prompt) return false;
  if (detectRichModelOnlyConceptPrompt(prompt).should_block_generic_fallback) return false;
  return (
    /^(?:what(?:'s| is)|define)\s+(?:an\s+)?electron\??$/i.test(prompt) ||
    /^what\s+are\s+electrons\??$/i.test(prompt) ||
    /^briefly\s+explain\s+(?:an\s+)?electron\??$/i.test(prompt)
  );
}

export function asksForHelixTheoryConceptBadgeImplementation(promptText: string): boolean {
  const prompt = normalizePrompt(promptText);
  return (
    /\btheory\s+concept\s+badge\b/i.test(prompt) &&
    /\b(?:in\s+helix|in\s+this\s+app|in\s+the\s+code|repo|repository|source|implementation|where\s+is|defined)\b/i.test(prompt)
  );
}
