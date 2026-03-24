import fs from "node:fs/promises";
import path from "node:path";

export type CanonicalTargetType = "concept" | "system" | "equation" | "model";
export type CanonicalBindingRelation = "equivalent_to" | "refines" | "derives_from";
export type CanonicalDagNodeType = "entity" | "system" | "equation" | "model" | "theory";

export type CanonicalBindingMatch = {
  canonicalId: string;
  canonicalLabel: string;
  targetType: CanonicalTargetType;
  relation: CanonicalBindingRelation;
  score: number;
  sourceTree: string;
  evidencePaths: string[];
  nodeType: CanonicalDagNodeType;
};

export type CanonicalBindingSet = {
  concept: Record<string, CanonicalBindingMatch>;
  system: Record<string, CanonicalBindingMatch>;
  equation: Record<string, CanonicalBindingMatch>;
  model: CanonicalBindingMatch | null;
};

export type CanonicalBindingInput = {
  title: string;
  extractionText: string;
  claimTexts: string[];
  concepts: Array<{ concept_id: string; term: string; definition?: string }>;
  systems: Array<{ system_id: string; name: string; components: string[]; interactions: string[] }>;
  equations: Array<{ equation_id: string; canonical_form: string; variable_ids: string[] }>;
};

type CanonicalTreeNode = {
  id?: string;
  title?: string;
  summary?: string;
  bodyMD?: string;
  tags?: unknown;
  evidence?: unknown;
};

type CanonicalTreeDoc = {
  nodes?: CanonicalTreeNode[];
};

type CanonicalIndexNode = {
  id: string;
  label: string;
  sourceTree: string;
  tags: string[];
  evidencePaths: string[];
  searchableText: string;
  tokens: Set<string>;
  nodeType: CanonicalDagNodeType;
};

export type CanonicalNodeDescriptor = CanonicalIndexNode;

type CanonicalRule = {
  canonicalId: string;
  targetTypes: CanonicalTargetType[];
  relation: CanonicalBindingRelation;
  keywords: string[];
  priority: number;
};

type CanonicalIndex = {
  byId: Map<string, CanonicalIndexNode>;
};

const CANONICAL_TREE_FILES = [
  "docs/knowledge/dp-collapse-tree.json",
  "docs/knowledge/physics/uncertainty-mechanics-tree.json",
  "docs/knowledge/bridges/stellar-ps1-bridge-tree.json",
  "docs/knowledge/certainty-framework-tree.json",
  "docs/knowledge/physics/math-tree.json",
  "docs/knowledge/physics/atomic-systems-tree.json",
] as const;

export const PAPER_CANONICAL_TREE_FILES = [...CANONICAL_TREE_FILES] as const;

const CANONICAL_RULES: CanonicalRule[] = [
  {
    canonicalId: "bridge-orch-or-to-stellar-coherence",
    targetTypes: ["concept", "system", "model"],
    relation: "equivalent_to",
    keywords: [
      "orch or",
      "orchestrated objective reduction",
      "objective reduction",
      "stellar consciousness",
      "stellar coherence",
      "solar consciousness",
      "sun consciousness",
    ],
    priority: 0.1,
  },
  {
    canonicalId: "stellar-plasma-collapse-signature-model",
    targetTypes: ["system", "model", "equation"],
    relation: "refines",
    keywords: [
      "stellar plasma",
      "plasma collapse",
      "solar coherence",
      "flare cascade",
      "sun coherence",
      "terahertz",
    ],
    priority: 0.12,
  },
  {
    canonicalId: "bridge-noise-spectrum-to-collapse-proxy",
    targetTypes: ["system", "equation", "model"],
    relation: "refines",
    keywords: ["noise spectrum", "collapse proxy", "eeg", "delta wave", "gamma wave"],
    priority: 0.09,
  },
  {
    canonicalId: "dp-collapse-derivation",
    targetTypes: ["equation", "model", "concept"],
    relation: "derives_from",
    keywords: [
      "diosi penrose",
      "diosi-penrose",
      "penrose collapse",
      "wavefunction collapse",
      "wave function collapse",
      "objective reduction",
    ],
    priority: 0.14,
  },
  {
    canonicalId: "dp-collapse-estimator",
    targetTypes: ["model", "equation", "system"],
    relation: "derives_from",
    keywords: ["collapse estimator", "collapse time", "delta e", "tau", "r_c"],
    priority: 0.16,
  },
  {
    canonicalId: "uncertainty-collapse-constraints",
    targetTypes: ["equation", "system", "model"],
    relation: "refines",
    keywords: [
      "collapse constraints",
      "collapse benchmark",
      "collapse bounds",
      "uncertainty collapse",
      "causal collapse",
    ],
    priority: 0.1,
  },
  {
    canonicalId: "uncertainty-coherence-window",
    targetTypes: ["system", "equation", "concept"],
    relation: "refines",
    keywords: ["coherence window", "coherence bound", "coherence timing"],
    priority: 0.1,
  },
  {
    canonicalId: "uncertainty-quantum-stochastic",
    targetTypes: ["equation", "model", "concept"],
    relation: "derives_from",
    keywords: [
      "stochastic schrodinger",
      "stochastic schr",
      "quantum stochastic",
      "schrodinger wave function",
      "schrodinger equation",
    ],
    priority: 0.1,
  },
  {
    canonicalId: "atomic-quantum-route",
    targetTypes: ["equation", "concept", "model"],
    relation: "derives_from",
    keywords: ["wavefunction", "wave function", "schrodinger", "quantum orbital", "superposition"],
    priority: 0.08,
  },
  {
    canonicalId: "coherence-governor",
    targetTypes: ["system", "model"],
    relation: "refines",
    keywords: ["coherence governor", "collapse confidence", "coherence confidence"],
    priority: 0.08,
  },
  {
    canonicalId: "collapse-framework-constraints",
    targetTypes: ["system", "equation", "model"],
    relation: "refines",
    keywords: ["collapse framework constraints", "collapse policy gate", "causal footprint"],
    priority: 0.07,
  },
  {
    canonicalId: "stress-energy-equations",
    targetTypes: ["equation", "model"],
    relation: "derives_from",
    keywords: ["stress-energy tensor", "t00", "einstein tensor", "stress energy equations"],
    priority: 0.07,
  },
  {
    canonicalId: "solar-energy-calibration",
    targetTypes: ["system", "model"],
    relation: "refines",
    keywords: ["solar energy", "solar calibration", "stellar energy"],
    priority: 0.05,
  },
];

export const PAPER_CANONICAL_RULES: ReadonlyArray<CanonicalRule> = CANONICAL_RULES;

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "into",
  "between",
  "within",
  "under",
  "over",
  "across",
  "about",
  "paper",
  "review",
  "model",
  "theory",
  "system",
  "systems",
  "framework",
  "concept",
  "concepts",
  "value",
  "values",
  "equation",
  "equations",
]);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_\-]+/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  return normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function extractEvidencePaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const paths = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = (entry as { path?: unknown }).path;
      return typeof candidate === "string" ? candidate.trim() : null;
    })
    .filter((entry): entry is string => Boolean(entry));
  return Array.from(new Set(paths));
}

function inferNodeType(node: CanonicalTreeNode): CanonicalDagNodeType {
  const tags = normalizeStringArray(node.tags).map((tag) => normalizeText(tag));
  const id = normalizeText(node.id ?? "");
  const merged = `${id} ${tags.join(" ")}`;
  if (/\b(equation|tensor|derivation|estimate|estimator|solver)\b/.test(merged)) return "equation";
  if (/\b(model|adapter|route)\b/.test(merged)) return "model";
  if (/\b(system|coherence|governor|stack|window)\b/.test(merged)) return "system";
  if (/\b(bridge|constraints|policy)\b/.test(merged)) return "theory";
  return "entity";
}

async function loadCanonicalIndex(repoRoot: string): Promise<CanonicalIndex> {
  const byId = new Map<string, CanonicalIndexNode>();
  for (const relativePath of CANONICAL_TREE_FILES) {
    const absolutePath = path.resolve(repoRoot, relativePath);
    let parsed: CanonicalTreeDoc;
    try {
      const raw = await fs.readFile(absolutePath, "utf8");
      parsed = JSON.parse(raw) as CanonicalTreeDoc;
    } catch {
      continue;
    }
    for (const node of parsed.nodes ?? []) {
      const nodeId = typeof node.id === "string" ? node.id.trim() : "";
      if (!nodeId) continue;
      const label = (typeof node.title === "string" && node.title.trim().length > 0
        ? node.title
        : nodeId
      ).trim();
      const tags = normalizeStringArray(node.tags);
      const searchableText = [
        nodeId,
        label,
        typeof node.summary === "string" ? node.summary : "",
        typeof node.bodyMD === "string" ? node.bodyMD : "",
        ...tags,
      ]
        .filter(Boolean)
        .join(" ");
      byId.set(nodeId, {
        id: nodeId,
        label,
        sourceTree: relativePath,
        tags,
        evidencePaths: extractEvidencePaths(node.evidence),
        searchableText,
        tokens: new Set(tokenize(searchableText)),
        nodeType: inferNodeType(node),
      });
    }
  }
  return { byId };
}

function phraseHitCount(text: string, keywords: string[]): number {
  if (!text) return 0;
  let hits = 0;
  for (const keyword of keywords) {
    const normalized = normalizeText(keyword);
    if (!normalized) continue;
    if (text.includes(normalized)) hits += 1;
  }
  return hits;
}

function tokenOverlapCount(left: Set<string>, right: Set<string>): number {
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  return overlap;
}

function scoreRuleMatch(args: {
  textNormalized: string;
  textTokens: Set<string>;
  rule: CanonicalRule;
  node: CanonicalIndexNode;
}): number {
  const hits = phraseHitCount(args.textNormalized, args.rule.keywords);
  if (hits <= 0) return 0;
  const overlap = tokenOverlapCount(args.textTokens, args.node.tokens);
  const keywordScore = Math.min(0.36, hits * 0.12);
  const overlapScore = Math.min(0.18, overlap * 0.03);
  return Math.min(0.99, 0.45 + args.rule.priority + keywordScore + overlapScore);
}

function targetThreshold(targetType: CanonicalTargetType): number {
  if (targetType === "equation") return 0.64;
  if (targetType === "model") return 0.66;
  if (targetType === "system") return 0.64;
  return 0.62;
}

function buildMatchFromRule(args: {
  rule: CanonicalRule;
  node: CanonicalIndexNode;
  targetType: CanonicalTargetType;
  score: number;
}): CanonicalBindingMatch {
  return {
    canonicalId: args.rule.canonicalId,
    canonicalLabel: args.node.label,
    targetType: args.targetType,
    relation: args.rule.relation,
    score: args.score,
    sourceTree: args.node.sourceTree,
    evidencePaths: args.node.evidencePaths.slice(0, 8),
    nodeType: args.node.nodeType,
  };
}

function bestRuleMatch(
  text: string,
  targetType: CanonicalTargetType,
  index: CanonicalIndex,
): CanonicalBindingMatch | null {
  const normalized = normalizeText(text);
  if (!normalized) return null;
  const textTokens = new Set(tokenize(normalized));
  let best: CanonicalBindingMatch | null = null;
  for (const rule of CANONICAL_RULES) {
    if (!rule.targetTypes.includes(targetType)) continue;
    const node = index.byId.get(rule.canonicalId);
    if (!node) continue;
    const score = scoreRuleMatch({
      textNormalized: normalized,
      textTokens,
      rule,
      node,
    });
    if (score < targetThreshold(targetType)) continue;
    if (!best || score > best.score) {
      best = buildMatchFromRule({ rule, node, targetType, score });
    }
  }
  return best;
}

export async function resolveCanonicalFrameworkBindings(
  input: CanonicalBindingInput,
  repoRoot = process.cwd(),
): Promise<{ bindings: CanonicalBindingSet; nodesById: Map<string, CanonicalNodeDescriptor> }> {
  const index = await loadCanonicalIndex(repoRoot);
  const bindings: CanonicalBindingSet = {
    concept: {},
    system: {},
    equation: {},
    model: null,
  };

  for (const concept of input.concepts) {
    const text = [concept.term, concept.definition ?? "", input.title].filter(Boolean).join(" ");
    const match = bestRuleMatch(text, "concept", index);
    if (match) bindings.concept[concept.concept_id] = match;
  }

  for (const system of input.systems) {
    const text = [
      system.name,
      system.components.join(" "),
      system.interactions.join(" "),
      input.title,
      input.extractionText.slice(0, 800),
    ]
      .filter(Boolean)
      .join(" ");
    const match = bestRuleMatch(text, "system", index);
    if (match) bindings.system[system.system_id] = match;
  }

  for (const equation of input.equations) {
    const text = [equation.canonical_form, input.title, ...input.claimTexts.slice(0, 2)].filter(Boolean).join(" ");
    const match = bestRuleMatch(text, "equation", index);
    if (match) bindings.equation[equation.equation_id] = match;
  }

  const modelText = [input.title, ...input.claimTexts.slice(0, 6), input.extractionText.slice(0, 1600)]
    .filter(Boolean)
    .join(" ");
  bindings.model = bestRuleMatch(modelText, "model", index);
  return { bindings, nodesById: index.byId };
}

export function collectCanonicalBindingMatches(bindings: CanonicalBindingSet): CanonicalBindingMatch[] {
  const byId = new Map<string, CanonicalBindingMatch>();
  const register = (match: CanonicalBindingMatch | null | undefined): void => {
    if (!match) return;
    const existing = byId.get(match.canonicalId);
    if (!existing || match.score > existing.score) {
      byId.set(match.canonicalId, match);
    }
  };
  for (const match of Object.values(bindings.concept)) register(match);
  for (const match of Object.values(bindings.system)) register(match);
  for (const match of Object.values(bindings.equation)) register(match);
  register(bindings.model);
  return Array.from(byId.values()).sort((a, b) => b.score - a.score || a.canonicalId.localeCompare(b.canonicalId));
}
