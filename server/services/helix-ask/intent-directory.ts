import * as fs from "node:fs";
import * as path from "node:path";

export type FalsifiabilityTier = "F0" | "F1" | "F2" | "F3";
export type HelixAskDomain = "general" | "repo" | "hybrid" | "falsifiable";
export type HelixAskStrategy =
  | "general_explain"
  | "repo_rag"
  | "repo_build_verify"
  | "constraint_report"
  | "hybrid_explain";
export type HelixAskFormatPolicy = "auto" | "steps" | "compare" | "brief";
export type HelixAskStageTagPolicy = "never" | "on_request" | "falsifiable_only";

export type HelixAskEvidenceKind =
  | "repo_chunk"
  | "prompt_chunk"
  | "gate_json"
  | "certificate"
  | "test_log";

export type HelixAskEvidencePolicy = {
  allowRepoCitations: boolean;
  requireCitations: boolean;
  allowedEvidenceKinds: HelixAskEvidenceKind[];
};

export type HelixAskIntentProfile = {
  id: string;
  label: string;
  domain: HelixAskDomain;
  tier: FalsifiabilityTier;
  secondaryTier?: FalsifiabilityTier;
  strategy: HelixAskStrategy;
  formatPolicy: HelixAskFormatPolicy;
  stageTags: HelixAskStageTagPolicy;
  evidencePolicy: HelixAskEvidencePolicy;
  gatesRequired?: string[];
  matchers: RegExp[];
  requireRepoHints?: boolean;
  requireFilePath?: boolean;
  requiresAllMatchers?: boolean;
  priority?: number;
};

export type HelixAskIntentMatch = {
  profile: HelixAskIntentProfile;
  score: number;
  reason: string;
};

export type HelixAskIntentMatchInput = {
  question: string;
  hasRepoHints: boolean;
  hasFilePathHints: boolean;
};

type IdeologyNodeRecord = {
  id?: string;
  slug?: string;
  title?: string;
};

type IdeologyTreeRecord = {
  nodes?: IdeologyNodeRecord[];
};

const IDEOLOGY_BASE_MATCHERS: RegExp[] = [
  /\b(ideology|ethos|mission ethos|ideology tree|ethos tree|two-key approval|stewardship ledger|citizens arc|verification checklist)\b/i,
];

const normalizeIdeologyTerm = (value: string): string =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const shouldIncludeIdeologyTerm = (term: string): boolean => {
  if (!term) return false;
  if (term.length < 6) return false;
  const words = term.split(" ").filter(Boolean);
  if (words.length >= 2) return true;
  return term.length >= 12;
};

const buildPhraseRegex = (term: string): RegExp => {
  const escaped = term
    .split(" ")
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .filter(Boolean)
    .join("\\s+");
  return new RegExp(`\\b${escaped}\\b`, "i");
};

const buildIdeologyNodeMatchers = (): RegExp[] => {
  try {
    const filePath = path.resolve(process.cwd(), "docs", "ethos", "ideology.json");
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as IdeologyTreeRecord;
    const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    const terms = new Set<string>();
    for (const node of nodes) {
      if (!node) continue;
      const title = node.title ? normalizeIdeologyTerm(node.title) : "";
      const slug = node.slug ? normalizeIdeologyTerm(node.slug.replace(/-/g, " ")) : "";
      const id = node.id ? normalizeIdeologyTerm(node.id.replace(/-/g, " ")) : "";
      for (const term of [title, slug, id]) {
        if (!shouldIncludeIdeologyTerm(term)) continue;
        terms.add(term);
      }
    }
    return Array.from(terms).map((term) => buildPhraseRegex(term));
  } catch {
    return [];
  }
};

const IDEOLOGY_NODE_MATCHERS = buildIdeologyNodeMatchers();

const INTENT_PROFILES: HelixAskIntentProfile[] = [
  {
    id: "general.conceptual_define_compare",
    label: "General conceptual/compare",
    domain: "general",
    tier: "F0",
    strategy: "general_explain",
    formatPolicy: "compare",
    stageTags: "on_request",
    evidencePolicy: {
      allowRepoCitations: false,
      requireCitations: false,
      allowedEvidenceKinds: ["prompt_chunk"],
    },
    matchers: [
      /\b(what is|what's|why|explain|define|meaning|concept|theory)\b/i,
      /\b(platonic|epistemology|metaphysics|ontology|axiom|axiomatic)\b/i,
      /\b(compare|versus|difference|tradeoff|advantage)\b/i,
    ],
    priority: 20,
  },
  {
    id: "general.general_how_to_process",
    label: "General how-to/process",
    domain: "general",
    tier: "F0",
    strategy: "general_explain",
    formatPolicy: "steps",
    stageTags: "on_request",
    evidencePolicy: {
      allowRepoCitations: false,
      requireCitations: false,
      allowedEvidenceKinds: ["prompt_chunk"],
    },
    matchers: [/\b(how to|how do|steps?|step-by-step|process|procedure)\b/i],
    priority: 15,
  },
  {
    id: "hybrid.concept_plus_system_mapping",
    label: "Concept + system mapping",
    domain: "hybrid",
    tier: "F1",
    secondaryTier: "F0",
    strategy: "hybrid_explain",
    formatPolicy: "compare",
    stageTags: "on_request",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: false,
      allowedEvidenceKinds: ["repo_chunk", "prompt_chunk"],
    },
    matchers: [
      /\b(platonic|epistemology|metaphysics|scientific method|falsifiable|verification|axiom)\b/i,
      /\b(this system|helix ask|repo|codebase|pipeline|how does this system)\b/i,
    ],
    requiresAllMatchers: true,
    priority: 35,
  },
  {
    id: "hybrid.warp_future_context",
    label: "Warp future context",
    domain: "hybrid",
    tier: "F1",
    secondaryTier: "F0",
    strategy: "hybrid_explain",
    formatPolicy: "compare",
    stageTags: "on_request",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: false,
      allowedEvidenceKinds: ["repo_chunk", "prompt_chunk"],
    },
    matchers: [
      /\b(warp|warp bubble|warp drive|alcubierre|natario)\b/i,
      /\b(future|humanity|feasible|viable|realistic|practical)\b/i,
    ],
    requiresAllMatchers: true,
    priority: 49,
  },
  {
    id: "hybrid.warp_ethos_relation",
    label: "Warp + ethos relation mapping",
    domain: "hybrid",
    tier: "F1",
    secondaryTier: "F0",
    strategy: "hybrid_explain",
    formatPolicy: "compare",
    stageTags: "on_request",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["repo_chunk", "prompt_chunk"],
    },
    matchers: [
      /\b(relate|relation|relationship|related|connect(?:ed|ion)?|link(?:ed|ing)?|tied?|tie|association|associated|mapping|map to|interplay)\b/i,
      /\b(warp bubble|warp drive|warp|alcubierre|natario)\b/i,
      /\b(mission ethos|ethos|ideology)\b/i,
    ],
    requiresAllMatchers: true,
    priority: 72,
  },
  {
    id: "hybrid.composite_system_synthesis",
    label: "Composite system synthesis",
    domain: "hybrid",
    tier: "F1",
    secondaryTier: "F0",
    strategy: "hybrid_explain",
    formatPolicy: "compare",
    stageTags: "on_request",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: false,
      allowedEvidenceKinds: ["repo_chunk", "prompt_chunk", "gate_json", "certificate"],
    },
    matchers: [],
    priority: 25,
  },
  {
    id: "repo.warp_definition_docs_first",
    label: "Warp definition (docs-first)",
    domain: "repo",
    tier: "F1",
    strategy: "repo_rag",
    formatPolicy: "brief",
    stageTags: "never",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["repo_chunk"],
    },
    matchers: [
      /\b(what is|what's|define|definition|meaning|explain)\b/i,
      /\b(warp bubble|warp drive|warp|alcubierre|natario)\b/i,
    ],
    requiresAllMatchers: true,
    priority: 65,
  },
  {
    id: "repo.helix_ask_pipeline_explain",
    label: "Helix Ask pipeline explain",
    domain: "repo",
    tier: "F1",
    strategy: "repo_rag",
    formatPolicy: "auto",
    stageTags: "on_request",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["repo_chunk"],
    },
    matchers: [
      /\b(helix ask|helixask|agi ask|\/api\/agi\/ask|ask system)\b/i,
      /\b(pipeline|architecture|workflow|flow)\b/i,
    ],
    requiresAllMatchers: true,
    priority: 50,
  },
  {
    id: "repo.helix_ask_routing_explain",
    label: "Helix Ask routing internals",
    domain: "repo",
    tier: "F1",
    strategy: "repo_rag",
    formatPolicy: "brief",
    stageTags: "never",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["repo_chunk"],
    },
    matchers: [
      /\b(helix ask|helixask|agi ask|\/api\/agi\/ask)\b/i,
      /\b(intent|topic|format|routing|route)\b/i,
    ],
    requiresAllMatchers: true,
    priority: 52,
  },
  {
    id: "repo.helix_ask_gate_explain",
    label: "Helix Ask evidence gates",
    domain: "repo",
    tier: "F1",
    strategy: "repo_rag",
    formatPolicy: "brief",
    stageTags: "never",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["repo_chunk"],
    },
    matchers: [
      /\b(evidence gates?|coverage gates?|belief gates?|rattling gates?|citation repair|cite repair|repair citations|evidence threshold|coverage threshold)\b/i,
    ],
    priority: 48,
  },
  {
    id: "repo.warp_conceptual_explain",
    label: "Warp concept (repo grounded)",
    domain: "repo",
    tier: "F1",
    strategy: "repo_rag",
    formatPolicy: "compare",
    stageTags: "on_request",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["repo_chunk"],
    },
    matchers: [/\b(warp|warp bubble|warp drive|alcubierre|natario)\b/i],
    priority: 47,
  },
  {
    id: "repo.system_pipeline_explain",
    label: "System pipeline explain",
    domain: "repo",
    tier: "F1",
    strategy: "repo_rag",
    formatPolicy: "auto",
    stageTags: "on_request",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["repo_chunk"],
    },
    matchers: [
      /\b(helix ask|ask pipeline|ask system|pipeline|architecture|workflow|flow)\b/i,
      /\b(this system|repo|codebase|server|client)\b/i,
    ],
    requiresAllMatchers: true,
    requireRepoHints: true,
    priority: 40,
  },
  {
    id: "repo.repo_api_lookup",
    label: "Repo API lookup",
    domain: "repo",
    tier: "F1",
    strategy: "repo_rag",
    formatPolicy: "brief",
    stageTags: "never",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["repo_chunk"],
    },
    matchers: [/\b(endpoint|api|route|path|file|module|component)\b/i],
    requireRepoHints: true,
    priority: 30,
  },
  {
    id: "repo.ideology_reference",
    label: "Ideology reference",
    domain: "repo",
    tier: "F1",
    strategy: "repo_rag",
    formatPolicy: "brief",
    stageTags: "never",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["repo_chunk"],
    },
    matchers: [...IDEOLOGY_BASE_MATCHERS, ...IDEOLOGY_NODE_MATCHERS],
    priority: 55,
  },
  {
    id: "repo.repo_debugging_root_cause",
    label: "Repo debugging",
    domain: "repo",
    tier: "F1",
    strategy: "repo_rag",
    formatPolicy: "steps",
    stageTags: "never",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["repo_chunk"],
    },
    matchers: [/\b(error|exception|stacktrace|bug|crash|failed|failure)\b/i],
    requireRepoHints: true,
    priority: 38,
  },
  {
    id: "repo.repo_change_request",
    label: "Repo change request",
    domain: "repo",
    tier: "F2",
    strategy: "repo_build_verify",
    formatPolicy: "steps",
    stageTags: "never",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["repo_chunk", "test_log"],
    },
    gatesRequired: ["tests", "build"],
    matchers: [/\b(add|implement|change|refactor|update|fix|improve)\b/i],
    requireRepoHints: true,
    priority: 36,
  },
  {
    id: "falsifiable.constraints.gr_viability_certificate",
    label: "GR viability",
    domain: "falsifiable",
    tier: "F3",
    strategy: "constraint_report",
    formatPolicy: "brief",
    stageTags: "falsifiable_only",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["gate_json", "certificate", "repo_chunk"],
    },
    gatesRequired: ["gr-constraint-gate", "warp-viability"],
    matchers: [
      /\b(warp|bubble|alcubierre|natario|gr)\b/i,
      /\b(viability|certificate|constraint gate|constraint gates|admissible|gate|gates)\b/i,
    ],
    requiresAllMatchers: true,
    priority: 60,
  },
  {
    id: "falsifiable.constraints.analysis_noise_field",
    label: "Noise field constraints",
    domain: "falsifiable",
    tier: "F3",
    strategy: "constraint_report",
    formatPolicy: "brief",
    stageTags: "falsifiable_only",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["gate_json", "repo_chunk"],
    },
    gatesRequired: ["noise-field-loop"],
    matchers: [/\b(noise field|laplacian|noise loop)\b/i],
    priority: 45,
  },
  {
    id: "falsifiable.constraints.analysis_diffusion_field",
    label: "Diffusion field constraints",
    domain: "falsifiable",
    tier: "F3",
    strategy: "constraint_report",
    formatPolicy: "brief",
    stageTags: "falsifiable_only",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["gate_json", "repo_chunk"],
    },
    gatesRequired: ["diffusion-loop"],
    matchers: [/\b(diffusion|score field|denoise|fidelity)\b/i],
    priority: 44,
  },
  {
    id: "falsifiable.constraints.belief_graph_consistency",
    label: "Belief graph consistency",
    domain: "falsifiable",
    tier: "F3",
    strategy: "constraint_report",
    formatPolicy: "brief",
    stageTags: "falsifiable_only",
    evidencePolicy: {
      allowRepoCitations: true,
      requireCitations: true,
      allowedEvidenceKinds: ["gate_json", "repo_chunk"],
    },
    gatesRequired: ["belief-graph-loop"],
    matchers: [/\b(belief graph|consistency|contradiction|axiom)\b/i],
    priority: 43,
  },
];

const DEFAULT_PROFILE: HelixAskIntentProfile = {
  id: "general.fallback",
  label: "General fallback",
  domain: "general",
  tier: "F0",
  strategy: "general_explain",
  formatPolicy: "auto",
  stageTags: "on_request",
  evidencePolicy: {
    allowRepoCitations: false,
    requireCitations: false,
    allowedEvidenceKinds: ["prompt_chunk"],
  },
  matchers: [],
};

const countMatches = (matchers: RegExp[], value: string): number => {
  let count = 0;
  for (const matcher of matchers) {
    if (matcher.test(value)) count += 1;
  }
  return count;
};

export function matchHelixAskIntent(input: HelixAskIntentMatchInput): HelixAskIntentMatch {
  const question = input.question.trim();
  if (!question) {
    return {
      profile: DEFAULT_PROFILE,
      score: 0,
      reason: "empty",
    };
  }
  let best: HelixAskIntentMatch | null = null;
  const normalized = question.toLowerCase();
  for (const profile of INTENT_PROFILES) {
    const matches = countMatches(profile.matchers, normalized);
    if (matches <= 0) continue;
    if (profile.requireRepoHints && !input.hasRepoHints) continue;
    if (profile.requireFilePath && !input.hasFilePathHints) continue;
    if (profile.requiresAllMatchers && matches < profile.matchers.length) continue;
    const score = matches * 10 + (profile.priority ?? 0);
    if (!best || score > best.score) {
      best = { profile, score, reason: `match:${matches}` };
    }
  }
  if (best) return best;
  return {
    profile: DEFAULT_PROFILE,
    score: 0,
    reason: "default",
  };
}

const cloneProfile = (profile: HelixAskIntentProfile): HelixAskIntentProfile => ({
  ...profile,
  evidencePolicy: { ...profile.evidencePolicy },
  gatesRequired: profile.gatesRequired ? [...profile.gatesRequired] : undefined,
});

export function getDefaultHelixAskIntentProfile(): HelixAskIntentProfile {
  return cloneProfile(DEFAULT_PROFILE);
}

export function getHelixAskIntentProfileById(id: string): HelixAskIntentProfile | null {
  if (!id) return null;
  if (id === DEFAULT_PROFILE.id) return cloneProfile(DEFAULT_PROFILE);
  const found = INTENT_PROFILES.find((profile) => profile.id === id);
  return found ? cloneProfile(found) : null;
}
