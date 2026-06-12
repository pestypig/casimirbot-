export type HelixModelOnlyConceptSourceSignal = {
  schema: "helix.model_only_concept_source_signal.v1";
  applies: boolean;
  reason_codes: string[];
  concept_terms: string[];
  explicit_model_only_scope: boolean;
  explicit_project_source_request: boolean;
  explicit_visual_input_request: boolean;
  should_prefer_model_only_concept: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

type ConceptPattern = {
  term: string;
  pattern: RegExp;
};

const conceptTerms: ConceptPattern[] = [
  { term: "source", pattern: /\bsource(?:s)?\b/i },
  { term: "picture", pattern: /\bpicture\b/i },
  { term: "observer", pattern: /\bobservers?\b/i },
  { term: "measurement", pattern: /\bmeasurement(?:s)?\b/i },
  { term: "model", pattern: /\bmodels?\b/i },
  { term: "analogy", pattern: /\banalog(?:y|ies|ical)\b/i },
  { term: "reality", pattern: /\breality\b/i },
  { term: "identity", pattern: /\bidentity\b/i },
  { term: "causality", pattern: /\bcausality|causal\b/i },
  { term: "free_will", pattern: /\bfree\s+will\b/i },
  { term: "consciousness", pattern: /\bconsciousness\b/i },
  { term: "ethics", pattern: /\bethics|ethical\b/i },
  { term: "justice", pattern: /\bjustice\b/i },
  { term: "incentives", pattern: /\bincentives?\b/i },
  { term: "market", pattern: /\bmarkets?\b/i },
  { term: "evolution", pattern: /\bevolution(?:ary)?\b/i },
  { term: "selection", pattern: /\bselection\b/i },
  { term: "ecosystem", pattern: /\becosystems?\b/i },
  { term: "empire", pattern: /\bempires?\b/i },
  { term: "revolution", pattern: /\brevolutions?\b/i },
  { term: "narrative", pattern: /\bnarratives?\b/i },
  { term: "proof", pattern: /\bproofs?\b/i },
  { term: "infinity", pattern: /\binfinit(?:y|e)\b/i },
  { term: "geometry", pattern: /\bgeometry|geometric\b/i },
  { term: "field", pattern: /\bfield(?:s)?\b/i },
  { term: "spacetime", pattern: /\bspace[-\s]?time|spacetime\b/i },
  { term: "curvature", pattern: /\bcurvature|curved\b/i },
  { term: "gravity", pattern: /\bgravity|gravitational\b/i },
  { term: "geodesic", pattern: /\bgeodesic(?:s)?\b/i },
  { term: "inertial_frame", pattern: /\binertial\s+frames?\b/i },
  { term: "tidal_force", pattern: /\btidal\s+forces?\b/i },
  { term: "quantum", pattern: /\bquantum\b/i },
  { term: "qft", pattern: /\bquantum\s+field\s+theory\b|\bqft\b/i },
  { term: "virtual_particle", pattern: /\bvirtual\s+particles?\b/i },
  { term: "vacuum_fluctuation", pattern: /\bvacuum[-\s]+fluctuation(?:s)?\b/i },
  { term: "entropy", pattern: /\bentropy\b/i },
  { term: "arrow_of_time", pattern: /\barrow\s+of\s+time\b/i },
  { term: "statistical_mechanics", pattern: /\bstatistical\s+mechanics\b/i },
  { term: "measurement_problem", pattern: /\bmeasurement\s+problem\b/i },
  { term: "wavefunction", pattern: /\bwave\s*function|wavefunction\b/i },
  { term: "collapse", pattern: /\bcollapse\b/i },
  { term: "decoherence", pattern: /\bdecoherence\b/i },
  { term: "many_worlds", pattern: /\bmany[-\s]?worlds\b/i },
  { term: "photon", pattern: /\bphoton(?:s)?\b/i },
  { term: "energy_momentum", pattern: /\benergy[-\s]?momentum\b/i },
  { term: "rest_mass", pattern: /\brest\s+mass\b/i },
];

const conceptQuestionCues: RegExp[] = [
  /\b(?:explain|clarify|interpret|understand|relate|connect|compare|contrast|untangle|evaluate|analyze)\b/i,
  /\bwhat\s+(?:does|is|are)\b/i,
  /\bhow\s+(?:should|do|does|can|could)\b/i,
  /\bwhy\b/i,
  /\bconcept(?:ual|s)?\b/i,
  /\btheory\b/i,
  /\bmisconception\b/i,
  /\bis\s+it\s+accurate\b/i,
];

const explicitProjectSourceRequestPatterns: RegExp[] = [
  /\b(?:repo|repository|codebase|source\s+code)\b/i,
  /\b(?:in|inside|from)\s+(?:the\s+)?(?:code|repo|repository|codebase|source|implementation)\b/i,
  /\b(?:where\s+is|where\s+are|where\s+in|find|locate)\b[\s\S]{0,80}\b(?:implemented|defined|declared|wired|source\s+path|file\s+path|line-backed|line\s+backed)\b/i,
  /\b(?:file\s+paths?|line-backed|line\s+backed|implementation\s+location|module|symbol|endpoint|schema)\b/i,
  /\b(?:helix|casimirbot|this\s+app)\b[\s\S]{0,100}\b(?:implementation|code|repo|source|defined|wired)\b/i,
  /\b(?:server|client|shared|docs|scripts|tools)\/[A-Za-z0-9_./-]+|\b[A-Za-z0-9_-]+\.(?:ts|tsx|js|jsx|md|json|py)\b/i,
];

const explicitModelOnlyScopePatterns: RegExp[] = [
  /\b(?:keep\s+it|make\s+it|answer\s+in)\s+(?:plain\s+language|conceptual|conceptually|general|non[-\s]?technical)\b/i,
  /\b(?:plain\s+language|conceptual|conceptually|general)\s+(?:answer|explanation|overview|summary)\b/i,
  /\b(?:background\s+only|background\s+mode|concept\s+background\s+only|concept\s+check\s+only|general\s+concept\s+only|general\s+reasoning|general\s+explanation\s+only)\b/i,
  /\bjust\s+answer\s+from\s+general\s+reasoning\b/i,
  /\bno\s+(?:workspace|repo|repository|code|source|implementation)\s+lookup\b/i,
  /\b(?:do\s+not|don't|dont|no\s+need\s+to|without)\s+(?:use|search|inspect|look\s+in|read|check)\s+(?:the\s+)?(?:repo|repository|code|codebase|source|workspace|implementation)\b/i,
  /\bnot\s+(?:code|repo|repository|source|implementation|file|line)[-\s]?(?:specific|based|grounded|level)?\b/i,
  /\bnot\s+(?:about\s+)?(?:the\s+)?(?:code|repo|repository|source|implementation|internals?)\b/i,
  /\bwithout\s+(?:code|repo|repository|source|implementation|file|line)\s+(?:details?|evidence|lookup|citations?)\b/i,
];

const explicitVisualInputPatterns: RegExp[] = [
  /\b(?:attached|uploaded|provided)\b[\s\S]{0,60}\b(?:image|screenshot|picture|photo|frame)\b/i,
  /\b(?:image|screenshot|picture|photo|frame)\b[\s\S]{0,60}\b(?:attached|uploaded|provided)\b/i,
  /\b(?:this|that|the)\s+(?:image|screenshot|picture|photo|frame)\b/i,
  /\b(?:look\s+at|describe|what'?s\s+in|what\s+is\s+in|analyze)\b[\s\S]{0,80}\b(?:image|screenshot|picture|photo)\b/i,
  /\b(?:on|visible\s+on|showing\s+on)\s+(?:my|the)\s+screen\b/i,
  /\b(?:current|latest)\s+(?:screen|visual|frame|screenshot)\b/i,
];

const explicitTheoryIdeologyBridgeSourcePatterns: RegExp[] = [
  /\btheory\s+(?:badge\s*)?graph\b[\s\S]{0,180}\b(?:zen\s*(?:badge\s*)?graph|zengraph|fruition|due\s+process|justice|fairness)\b/i,
  /\b(?:zen\s*(?:badge\s*)?graph|zengraph|fruition)\b[\s\S]{0,180}\b(?:theory\s+(?:badge\s*)?graph|physics\s+(?:badge\s*)?graph|entropy|conservation|self[-\s]?organization|observable\s+physics)\b/i,
];

const explicitExternalEvidenceSourcePatterns: RegExp[] = [
  /\b(?:scholarly\s+research|scholarly\s+sources?|research\s+papers?|peer[-\s]?reviewed|citations?|references?|bibliograph(?:y|ies)|arxiv|crossref|openalex|semantic\s+scholar|pubmed|doi)\b/i,
  /\b(?:repo\/code|repo\s+code|repo\s+evidence|code\s+evidence|repository\s+evidence|file-backed|file\s+backed)\b/i,
  /\b(?:web\s+search|internet\s+search|browse|check\s+online|verify\s+online|latest|current|recent)\b/i,
  /\b(?:theory\s+badge\s+graph|theory\s+locator|theory\s+graph|graph\s+placement|scale\s+bands?|semantic\s+chunks?|uncertainty\s+mode)\b/i,
];

const figurativePicturePatterns: RegExp[] = [
  /\b(?:popular|standard|usual|common|classical|physical|conceptual|mental|intuitive|big)\s+picture\b/i,
  /\b(?:vacuum[-\s]?fluctuation|field|quantum|geometric|statistical|historical|economic|philosophical|biological)\s+picture\b/i,
  /\b(?:rubber[-\s]?sheet|spacetime|curvature|relativity|gravity|geodesic|observer|measurement|decoherence|wavefunction|collapse)\s+picture\b/i,
  /\bpictured\s+as\b/i,
  /\bpicture\s+of\s+(?:reality|the\s+world|how|what|why)\b/i,
  /\bpicture\s+(?:is|says|suggests|where|that|gets|becomes|uses|ignores|seems|sounds)\b/i,
  /\bthat\s+picture\s+(?:is|says|suggests|uses|ignores|seems|sounds|gets|becomes)\b/i,
];

const normalizePrompt = (promptText: string): string => promptText.trim().replace(/\s+/g, " ");
const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

export function isExplicitProjectSourceRequest(promptText: string): boolean {
  const prompt = normalizePrompt(promptText);
  return explicitProjectSourceRequestPatterns.some((pattern) => pattern.test(prompt)) ||
    explicitTheoryIdeologyBridgeSourcePatterns.some((pattern) => pattern.test(prompt));
}

export function isExplicitEvidenceSourceRequest(promptText: string): boolean {
  const prompt = normalizePrompt(promptText);
  return isExplicitProjectSourceRequest(prompt) ||
    explicitExternalEvidenceSourcePatterns.some((pattern) => pattern.test(prompt));
}

export function hasExplicitModelOnlyConceptScope(promptText: string): boolean {
  const prompt = normalizePrompt(promptText);
  return explicitModelOnlyScopePatterns.some((pattern) => pattern.test(prompt));
}

export function isExplicitVisualInputRequest(promptText: string): boolean {
  const prompt = normalizePrompt(promptText);
  if (figurativePicturePatterns.some((pattern) => pattern.test(prompt))) return false;
  return explicitVisualInputPatterns.some((pattern) => pattern.test(prompt));
}

export function isFigurativePicturePrompt(promptText: string): boolean {
  return figurativePicturePatterns.some((pattern) => pattern.test(normalizePrompt(promptText)));
}

export function detectModelOnlyConceptSourceSignal(promptText: string): HelixModelOnlyConceptSourceSignal {
  const prompt = normalizePrompt(promptText);
  const matchedConceptTerms = unique(
    conceptTerms
      .filter((entry) => entry.pattern.test(prompt))
      .map((entry) => entry.term),
  );
  const hasConceptQuestion = conceptQuestionCues.some((pattern) => pattern.test(prompt));
  const hasMultipleConceptTerms = matchedConceptTerms.length >= 2;
  const isLongish = prompt.length >= 160;
  const hasCompoundShape =
    /[?？]/.test(prompt) &&
    /\b(?:and|also|since|because|but|while|instead|then|both|versus|vs\.?)\b/i.test(prompt);
  const explicitModelOnlyScope = hasExplicitModelOnlyConceptScope(prompt);
  const explicitProjectSourceRequest = !explicitModelOnlyScope && isExplicitProjectSourceRequest(prompt);
  const explicitEvidenceSourceRequest = !explicitModelOnlyScope && isExplicitEvidenceSourceRequest(prompt);
  const explicitVisualInputRequest = isExplicitVisualInputRequest(prompt);
  const applies =
    hasConceptQuestion &&
    (hasMultipleConceptTerms || isLongish || hasCompoundShape || explicitModelOnlyScope) &&
    !explicitEvidenceSourceRequest &&
    !explicitVisualInputRequest;
  const reasonCodes: string[] = [];
  if (hasConceptQuestion) reasonCodes.push("concept_explanation_prompt");
  if (hasMultipleConceptTerms) reasonCodes.push("multiple_concept_terms");
  if (isLongish || hasCompoundShape) reasonCodes.push("long_or_compound_concept_prompt");
  if (explicitModelOnlyScope) reasonCodes.push("explicit_model_only_concept_scope");
  if (isFigurativePicturePrompt(prompt)) reasonCodes.push("figurative_picture_reference");
  if (explicitProjectSourceRequest) reasonCodes.push("explicit_project_source_request");
  if (explicitEvidenceSourceRequest && !explicitProjectSourceRequest) reasonCodes.push("explicit_evidence_source_request");
  if (explicitVisualInputRequest) reasonCodes.push("explicit_visual_input_request");
  if (applies) reasonCodes.push("prefer_model_only_concept");
  if (reasonCodes.length === 0) reasonCodes.push("not_model_only_concept_source_signal");

  return {
    schema: "helix.model_only_concept_source_signal.v1",
    applies,
    reason_codes: unique(reasonCodes),
    concept_terms: matchedConceptTerms,
    explicit_model_only_scope: explicitModelOnlyScope,
    explicit_project_source_request: explicitProjectSourceRequest,
    explicit_visual_input_request: explicitVisualInputRequest,
    should_prefer_model_only_concept: applies,
    assistant_answer: false,
    raw_content_included: false,
  };
}
