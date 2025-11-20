import type { TEssenceEnvelope } from "@shared/essence-schema";
import {
  EssenceThemeDeck,
  ThemeEvidence,
  ThemeFieldPanel,
  ThemePanelRecord,
  type TThemePanelRecord,
  type TThemeFieldPanel,
  type TThemeForce,
  type TThemeConstraint,
  type TThemeReframe,
  type TThemeStatePanel,
  type TThemeStateNode,
  type TThemeDualityAxis,
  type TEssenceThemeDeck,
  type TThemeEvidence,
} from "@shared/essence-themes";
import { listEnvelopeByCreator } from "./store";

const MAX_THEME_ENVELOPES = Number(process.env.ESSENCE_THEME_SCAN_LIMIT ?? 120);
const MAX_THEME_PANELS = Number(process.env.ESSENCE_THEME_PANEL_LIMIT ?? 4);

type ThemeDeckOptions = {
  limit?: number;
};

type ForcePattern = {
  id: string;
  label: string;
  summary: string;
  hints: string[];
};

type ConstraintPattern = ForcePattern;

type StagePattern = {
  id: string;
  label: string;
  hints: string[];
};

type RolePattern = {
  id: string;
  label: string;
  hints: string[];
};

type DualityPattern = {
  id: string;
  label: string;
  negative: string;
  positive: string;
  negativeHints: string[];
  positiveHints: string[];
};

type ThemeAccumulator = {
  key: string;
  label: string;
  docs: number;
  slug: string;
  latestMs: number;
  keywords: Map<string, number>;
  mediums: Record<string, number>;
  roles: Record<string, number>;
  states: Record<string, number>;
  stateEvidence: Map<string, TThemeEvidence>;
  forces: Map<string, { pattern: ForcePattern; hits: number; evidence: TThemeEvidence[] }>;
  constraints: Map<string, { pattern: ConstraintPattern; hits: number; evidence: TThemeEvidence[] }>;
  axisScores: Map<string, number>;
  axisEvidence: Map<string, TThemeEvidence[]>;
  zenStatements: string[];
  evidence: TThemeEvidence[];
};

const STOP_WORDS = new Set(
  [
    "the",
    "a",
    "an",
    "and",
    "or",
    "for",
    "with",
    "onto",
    "into",
    "from",
    "that",
    "this",
    "these",
    "those",
    "about",
    "your",
    "our",
    "their",
    "was",
    "were",
    "are",
    "have",
    "has",
    "had",
    "but",
    "not",
    "just",
    "like",
    "you",
    "i",
    "me",
    "my",
    "we",
    "they",
    "them",
    "it",
    "its",
    "be",
    "being",
    "been",
    "do",
    "did",
    "done",
    "of",
    "on",
    "at",
    "to",
    "in",
    "by",
    "as",
    "is",
    "if",
    "can",
    "could",
    "should",
    "would",
  ].map((token) => token.toLowerCase()),
);

const ROLE_PATTERNS: RolePattern[] = [
  { id: "problem", label: "Problem Map", hints: ["problem", "bug", "issue", "blocked", "failure", "risk"] },
  { id: "spec", label: "Specification", hints: ["spec", "design", "architecture", "plan", "requirements", "proposal"] },
  { id: "experiment", label: "Experiment", hints: ["experiment", "study", "test", "trial", "analysis", "prototype"] },
  { id: "reflection", label: "Reflection", hints: ["journal", "note", "reflection", "feeling", "retrospective", "thought"] },
  { id: "play", label: "Play", hints: ["play", "jam", "sketch", "sandbox", "draft", "exploration"] },
];

const ROLE_FALLBACK: RolePattern = { id: "reflection", label: "Reflection", hints: [] };

const FORCE_PATTERNS: ForcePattern[] = [
  {
    id: "deadline",
    label: "Deadline Gravity",
    summary: "Timeboxes and schedules push this system forward.",
    hints: ["deadline", "due", "schedule", "milestone", "eta", "sprint"],
  },
  {
    id: "optimization",
    label: "Optimization Pressure",
    summary: "You keep trying to shrink waste or amplify efficiency.",
    hints: ["optimize", "reduce", "increase", "maximize", "minimize", "efficiency"],
  },
  {
    id: "curiosity",
    label: "Curiosity Flow",
    summary: "Exploration and learning impulses keep this theme alive.",
    hints: ["curious", "explore", "wonder", "learn", "discover", "question"],
  },
  {
    id: "feedback",
    label: "Feedback Loop",
    summary: "External feedback or signals are shaping decisions.",
    hints: ["feedback", "signal", "metric", "telemetry", "review", "response"],
  },
  {
    id: "resources",
    label: "Resource Tension",
    summary: "Budgets, energy, or attention are explicit drivers.",
    hints: ["budget", "cost", "energy", "token", "limit", "capacity"],
  },
  {
    id: "stability",
    label: "Stability Guard",
    summary: "Keeping things safe and predictable is a dominant push.",
    hints: ["safety", "stability", "reliable", "compliant", "guard", "hull"],
  },
];

const CONSTRAINT_PATTERNS: ConstraintPattern[] = [
  {
    id: "privacy",
    label: "Privacy Boundary",
    summary: "Never leak or expose sensitive material.",
    hints: ["privacy", "secret", "sensitive", "seal", "private"],
  },
  {
    id: "latency",
    label: "Latency Ceiling",
    summary: "Keep response times low and systems responsive.",
    hints: ["latency", "lag", "real-time", "fast", "responsive"],
  },
  {
    id: "quality",
    label: "Quality Bar",
    summary: "A high craft bar that cannot be compromised.",
    hints: ["quality", "polish", "craft", "grade", "bar", "accuracy"],
  },
  {
    id: "ethics",
    label: "Ethical Guardrail",
    summary: "Moral or ideological constraints are shaping moves.",
    hints: ["ethic", "ethos", "values", "mission", "consent"],
  },
  {
    id: "joy",
    label: "Joy Requirement",
    summary: "Keeping this fun or meaningful is a non-negotiable.",
    hints: ["joy", "fun", "meaning", "flow", "delight", "zen"],
  },
];

const STAGE_PATTERNS: StagePattern[] = [
  { id: "idea", label: "Idea", hints: ["idea", "dream", "vision", "seed", "concept"] },
  { id: "research", label: "Research", hints: ["research", "explore", "study", "investigate", "learn", "prototype"] },
  { id: "build", label: "Build", hints: ["build", "implement", "code", "construct", "fabricate"] },
  { id: "calibrate", label: "Calibrate", hints: ["calibrate", "tune", "refine", "debug", "stabilize", "balance"] },
  { id: "ship", label: "Ship", hints: ["ship", "deploy", "release", "launch", "deliver"] },
];

const DUALITY_AXES: DualityPattern[] = [
  {
    id: "freedom_structure",
    label: "Freedom vs Structure",
    negative: "improvisational flow",
    positive: "structured execution",
    negativeHints: ["explore", "wild", "open", "play", "freeform", "improv"],
    positiveHints: ["plan", "process", "structure", "discipline", "schedule"],
  },
  {
    id: "speed_depth",
    label: "Speed vs Depth",
    negative: "rapid moves",
    positive: "deep craft",
    negativeHints: ["quick", "fast", "rapid", "ship", "sprint"],
    positiveHints: ["depth", "rigor", "thorough", "detail", "precision"],
  },
  {
    id: "risk_safety",
    label: "Risk vs Safety",
    negative: "risk / experimentation",
    positive: "safety / caution",
    negativeHints: ["risk", "bold", "wild", "try", "experiment"],
    positiveHints: ["safe", "guard", "compliance", "secure", "stable"],
  },
];

const PANEL_COLORS = ["#0f172a", "#0f766e", "#1d4ed8", "#6d28d9", "#9d174d", "#7c2d12"];

export async function buildThemeDeckForOwner(
  ownerId: string | null,
  opts?: ThemeDeckOptions,
): Promise<TEssenceThemeDeck> {
  const limit = clampLimit(opts?.limit ?? MAX_THEME_ENVELOPES);
  if (!ownerId) {
    return EssenceThemeDeck.parse({
      ownerId: null,
      generatedAt: new Date().toISOString(),
      totalEnvelopes: 0,
      themes: [],
    });
  }
  const envelopes = await listEnvelopeByCreator(ownerId, limit);
  return buildThemeDeckFromEnvelopes(ownerId, envelopes);
}

export function buildThemeDeckFromEnvelopes(
  ownerId: string | null,
  envelopes: TEssenceEnvelope[],
): TEssenceThemeDeck {
  const accMap = new Map<string, ThemeAccumulator>();
  for (const env of envelopes) {
    const text = collectText(env);
    const tokens = tokenize(text);
    const key = selectThemeKey(env, tokens);
    if (!key) {
      continue;
    }
    const normalized = key.toLowerCase();
    const accumulator = ensureAccumulator(accMap, normalized, key);
    accumulator.docs += 1;
    accumulator.latestMs = Math.max(accumulator.latestMs, parseTimestamp(env.header.created_at));
    accumulator.mediums[env.header.modality] = (accumulator.mediums[env.header.modality] ?? 0) + 1;
    const role = detectRole(tokens, env);
    accumulator.roles[role.id] = (accumulator.roles[role.id] ?? 0) + 1;
    const state = detectStage(tokens);
    accumulator.states[state.id] = (accumulator.states[state.id] ?? 0) + 1;
    if (!accumulator.stateEvidence.has(state.id)) {
      accumulator.stateEvidence.set(state.id, buildEvidence(env, text, state.label));
    }
    for (const token of tokens) {
      accumulator.keywords.set(token, (accumulator.keywords.get(token) ?? 0) + 1);
    }
    accumulator.evidence = appendEvidence(accumulator.evidence, buildEvidence(env, text));
    accumulator.zenStatements.push(...extractZenStatements(text));
    for (const force of detectForces(tokens)) {
      const bucket = ensureForceBucket(accumulator.forces, force.pattern);
      bucket.hits += force.weight;
      bucket.evidence = appendEvidence(bucket.evidence, buildEvidence(env, text, force.pattern.label));
    }
    for (const constraint of detectConstraints(tokens)) {
      const bucket = ensureConstraintBucket(accumulator.constraints, constraint.pattern);
      bucket.hits += constraint.weight;
      bucket.evidence = appendEvidence(bucket.evidence, buildEvidence(env, text, constraint.pattern.label));
    }
    for (const axis of detectAxisLeaning(tokens)) {
      accumulator.axisScores.set(axis.id, (accumulator.axisScores.get(axis.id) ?? 0) + axis.weight);
      const existing = accumulator.axisEvidence.get(axis.id) ?? [];
      if (existing.length < 3) {
        existing.push(buildEvidence(env, text, axis.word));
        accumulator.axisEvidence.set(axis.id, existing);
      }
    }
  }

  const ordered = [...accMap.values()]
    .map((record, index) => toThemeRecord(record, index))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, clampLimit(MAX_THEME_PANELS));

  const deck = EssenceThemeDeck.parse({
    ownerId: ownerId ?? null,
    generatedAt: new Date().toISOString(),
    totalEnvelopes: envelopes.length,
    themes: ordered,
  });
  return deck;
}

function ensureAccumulator(map: Map<string, ThemeAccumulator>, key: string, rawLabel: string): ThemeAccumulator {
  const existing = map.get(key);
  if (existing) {
    return existing;
  }
  const label = formatLabel(rawLabel);
  const slug = slugify(rawLabel);
  const accumulator: ThemeAccumulator = {
    key,
    label,
    docs: 0,
    slug,
    latestMs: 0,
    keywords: new Map(),
    mediums: {},
    roles: {},
    states: {},
    stateEvidence: new Map(),
    forces: new Map(),
    constraints: new Map(),
    axisScores: new Map(),
    axisEvidence: new Map(),
    zenStatements: [],
    evidence: [],
  };
  map.set(key, accumulator);
  return accumulator;
}

function ensureForceBucket(
  map: Map<string, { pattern: ForcePattern; hits: number; evidence: TThemeEvidence[] }>,
  pattern: ForcePattern,
) {
  const existing = map.get(pattern.id);
  if (existing) {
    return existing;
  }
  const bucket = { pattern, hits: 0, evidence: [] as TThemeEvidence[] };
  map.set(pattern.id, bucket);
  return bucket;
}

function ensureConstraintBucket(
  map: Map<string, { pattern: ConstraintPattern; hits: number; evidence: TThemeEvidence[] }>,
  pattern: ConstraintPattern,
) {
  const existing = map.get(pattern.id);
  if (existing) {
    return existing;
  }
  const bucket = { pattern, hits: 0, evidence: [] as TThemeEvidence[] };
  map.set(pattern.id, bucket);
  return bucket;
}

function toThemeRecord(record: ThemeAccumulator, index: number): TThemePanelRecord {
  const corpusSize = record.docs;
  const recencyDays = computeRecencyDays(record.latestMs);
  const topKeywords = selectTopEntries(record.keywords, 6);
  const role = selectTopKey(record.roles) ?? ROLE_FALLBACK.id;
  const dominantState = selectTopKey(record.states) ?? "idea";
  const field = buildField(record, corpusSize);
  const stateSpace = buildStatePanel(record, dominantState);
  const dualities = buildDualities(record, corpusSize);
  const reframes = buildReframes(record, field.forces, stateSpace, dualities);
  const summary = buildSummary(record, role, stateSpace, field);
  const color = PANEL_COLORS[index % PANEL_COLORS.length];
  const priority = computePriority(corpusSize, recencyDays, Object.keys(record.mediums).length);

  return ThemePanelRecord.parse({
    id: `${record.slug}-${index}`,
    label: record.label,
    summary,
    color,
    priority,
    corpusSize,
    recencyDays,
    topKeywords,
    mediums: record.mediums,
    roles: record.roles,
    field,
    stateSpace,
    dualities,
    reframes,
    evidence: record.evidence.slice(0, 5),
  });
}

function buildField(record: ThemeAccumulator, corpusSize: number): TThemeFieldPanel {
  const forces: TThemeForce[] = [...record.forces.values()]
    .map((entry) => ({
      id: entry.pattern.id,
      label: entry.pattern.label,
      summary: entry.pattern.summary,
      magnitude: clamp01(entry.hits / Math.max(1, corpusSize)),
      evidence: entry.evidence.slice(0, 3),
    }))
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 4);

  const constraints: TThemeConstraint[] = [...record.constraints.values()]
    .map((entry) => ({
      id: entry.pattern.id,
      label: entry.pattern.label,
      summary: entry.pattern.summary,
      weight: clamp01(entry.hits / Math.max(1, corpusSize)),
      evidence: entry.evidence.slice(0, 3),
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);

  return ThemeFieldPanel.parse({
    forces,
    constraints,
  }) as TThemeFieldPanel;
}

function buildStatePanel(record: ThemeAccumulator, dominantId: string): TThemeStatePanel {
  const nodes: TThemeStateNode[] = STAGE_PATTERNS.map((pattern) => {
    const count = record.states[pattern.id] ?? 0;
    const evidence = record.stateEvidence.get(pattern.id);
    return {
      id: pattern.id,
      label: pattern.label,
      count,
      emphasis: clamp01(count / Math.max(1, record.docs)),
      evidence,
    };
  });
  const stuckIn =
    nodes.length > 0 && nodes.some((node) => node.count > 0)
      ? detectStuckState(nodes, dominantId)
      : undefined;

  return {
    dominant: dominantId,
    stuckIn,
    nodes,
  };
}

function buildDualities(record: ThemeAccumulator, corpusSize: number): TThemeDualityAxis[] {
  return DUALITY_PATTERNS.map((pattern) => {
    const score = clampBetween(
      (record.axisScores.get(pattern.id) ?? 0) / Math.max(1, corpusSize),
      -1,
      1,
    );
    return {
      id: pattern.id,
      label: pattern.label,
      negative: pattern.negative,
      positive: pattern.positive,
      leaning: score,
      evidence: record.axisEvidence.get(pattern.id) ?? [],
    };
  });
}

const DUALITY_PATTERNS = DUALITY_AXES;

function buildReframes(
  record: ThemeAccumulator,
  forces: TThemeForce[],
  state: TThemeStatePanel,
  dualities: TThemeDualityAxis[],
): TThemeReframe[] {
  const reframes: TThemeReframe[] = [];
  const strongestForce = forces[0];
  const leaningAxis = dualities.sort((a, b) => Math.abs(b.leaning) - Math.abs(a.leaning))[0];

  if (state.stuckIn) {
    const nextState = nextStageAfter(state.stuckIn);
    reframes.push({
      id: "state-shift",
      prompt: `What experiment would gently move ${record.label} from ${formatLabel(
        state.stuckIn,
      )} to ${nextState ? formatLabel(nextState) : "the next state"}?`,
      emphasis: "State shift",
      evidence: state.nodes.find((node) => node.id === state.stuckIn)?.evidence,
      relatedForces: [],
    });
  }
  if (strongestForce) {
    reframes.push({
      id: "force-reframe",
      prompt: `If ${strongestForce.label.toLowerCase()} stopped leading, which quieter signal would you follow in ${record.label}?`,
      emphasis: strongestForce.label,
      relatedForces: [strongestForce.id],
      evidence: strongestForce.evidence[0],
    });
  }
  if (leaningAxis && Math.abs(leaningAxis.leaning) > 0.3) {
    const direction = leaningAxis.leaning > 0 ? leaningAxis.positive : leaningAxis.negative;
    reframes.push({
      id: "axis-flip",
      prompt: `You keep favoring ${direction}. Try a one-day sprint that deliberately embraces ${
        leaningAxis.leaning > 0 ? leaningAxis.negative : leaningAxis.positive
      }.`,
      emphasis: leaningAxis.label,
      evidence: leaningAxis.evidence[0],
      relatedForces: [],
    });
  }

  if (!reframes.length && record.evidence.length) {
    reframes.push({
      id: "default",
      prompt: `What would make ${record.label} feel playful without losing its physics?`,
      evidence: record.evidence[0],
      relatedForces: [],
    });
  }

  return reframes.slice(0, 3);
}

function buildSummary(
  record: ThemeAccumulator,
  roleId: string,
  state: TThemeStatePanel,
  field: TThemeFieldPanel,
): string {
  const roleLabel = ROLE_PATTERNS.find((pattern) => pattern.id === roleId)?.label ?? ROLE_FALLBACK.label;
  const leadingForce = field.forces[0]?.label;
  const leadingConstraint = field.constraints[0]?.label;
  const stateLabel = STAGE_PATTERNS.find((entry) => entry.id === state.dominant)?.label ?? "Idea";

  const pieces = [
    `${record.label} shows up mostly as a ${roleLabel.toLowerCase()} with work living in the ${stateLabel} state.`,
  ];
  if (leadingForce) {
    pieces.push(`${leadingForce} keeps pushing it forward`);
  }
  if (leadingConstraint) {
    pieces.push(`while ${leadingConstraint.toLowerCase()} stays non-negotiable`);
  }
  return pieces.join(", ") + ".";
}

function detectRole(tokens: string[], env: TEssenceEnvelope): RolePattern {
  const uri = env.header.source?.uri?.toLowerCase() ?? "";
  for (const pattern of ROLE_PATTERNS) {
    const hit = pattern.hints.some((hint) => tokens.includes(hint) || uri.includes(hint));
    if (hit) {
      return pattern;
    }
  }
  return ROLE_FALLBACK;
}

function detectStage(tokens: string[]): StagePattern {
  for (const pattern of STAGE_PATTERNS) {
    if (pattern.hints.some((hint) => tokens.includes(hint))) {
      return pattern;
    }
  }
  return STAGE_PATTERNS[0];
}

function detectForces(tokens: string[]) {
  return FORCE_PATTERNS.filter((pattern) => pattern.hints.some((hint) => tokens.includes(hint))).map(
    (pattern) => ({ pattern, weight: 1 }),
  );
}

function detectConstraints(tokens: string[]) {
  return CONSTRAINT_PATTERNS.filter((pattern) =>
    pattern.hints.some((hint) => tokens.includes(hint)),
  ).map((pattern) => ({ pattern, weight: 1 }));
}

function detectAxisLeaning(tokens: string[]) {
  return DUALITY_PATTERNS.flatMap((pattern) => {
    let score = 0;
    let word = "";
    for (const hint of pattern.negativeHints) {
      if (tokens.includes(hint)) {
        score -= 1;
        word = hint;
        break;
      }
    }
    for (const hint of pattern.positiveHints) {
      if (tokens.includes(hint)) {
        score += 1;
        word = hint;
        break;
      }
    }
    if (score === 0) {
      return [];
    }
    return [{ id: pattern.id, weight: score, word }];
  });
}

function detectStuckState(nodes: TThemeStateNode[], dominant: string): string | undefined {
  const total = nodes.reduce((sum, node) => sum + node.count, 0);
  if (!total) {
    return undefined;
  }
  const dominantNode = nodes.find((node) => node.id === dominant);
  if (dominantNode && dominantNode.count / total >= 0.6) {
    return dominantNode.id;
  }
  return undefined;
}

function selectThemeKey(env: TEssenceEnvelope, tokens: string[]): string {
  const tags = Array.isArray(env.features?.text?.tags) ? env.features?.text?.tags : [];
  if (tags.length) {
    return tags[0];
  }
  const uri = env.header.source?.uri ?? env.header.id;
  const parts = uri.split(/[/\\]/).filter(Boolean);
  if (parts.length) {
    const last = parts[parts.length - 1];
    return last.replace(/\.[^.]+$/, "");
  }
  return tokens[0] ?? env.header.id;
}

function collectText(env: TEssenceEnvelope): string {
  const textParts = [
    env.features?.text?.summary,
    env.features?.text?.transcript,
    env.features?.text?.caption,
    env.header.source?.uri,
  ].filter(Boolean) as string[];
  return textParts.join("\n").toLowerCase();
}

function tokenize(text: string): string[] {
  return (text.match(/[a-z0-9]+/g) ?? [])
    .map((token) => token.toLowerCase())
    .filter((token) => token && !STOP_WORDS.has(token))
    .slice(0, 2048);
}

function selectTopEntries(map: Map<string, number>, limit: number): string[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}

function selectTopKey(record: Record<string, number>): string | undefined {
  return Object.entries(record).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function appendEvidence(list: TThemeEvidence[], entry: TThemeEvidence | null): TThemeEvidence[] {
  if (!entry) {
    return list;
  }
  if (list.some((existing) => existing.envelopeId === entry.envelopeId && existing.excerpt === entry.excerpt)) {
    return list;
  }
  if (list.length >= 8) {
    return list;
  }
  return [...list, entry];
}

function buildEvidence(env: TEssenceEnvelope, text: string, keyword?: string): TThemeEvidence {
  const excerpt = extractExcerpt(text, keyword);
  return ThemeEvidence.parse({
    envelopeId: env.header.id,
    label: describeEnvelope(env),
    uri: env.header.source?.uri,
    excerpt,
  });
}

function describeEnvelope(env: TEssenceEnvelope): string {
  const uri = env.header.source?.uri;
  if (!uri) {
    return env.header.id;
  }
  const parts = uri.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] ?? env.header.id;
}

function extractExcerpt(text: string, keyword?: string): string | undefined {
  if (!text) {
    return undefined;
  }
  const sentences = text
    .split(/[\n\r\.!?]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (keyword) {
    const match = sentences.find((sentence) => sentence.includes(keyword.toLowerCase()));
    if (match) {
      return truncate(match, 140);
    }
  }
  return truncate(sentences[0] ?? text.slice(0, 140), 140);
}

function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1).trim()}…`;
}

function nextStageAfter(stageId: string): string | undefined {
  const index = STAGE_PATTERNS.findIndex((pattern) => pattern.id === stageId);
  if (index === -1) {
    return undefined;
  }
  return STAGE_PATTERNS[index + 1]?.id;
}

function computeRecencyDays(timestamp: number): number {
  if (!timestamp) {
    return 999;
  }
  const diff = Date.now() - timestamp;
  return diff > 0 ? diff / (1000 * 60 * 60 * 24) : 0;
}

function computePriority(corpusSize: number, recencyDays: number, mediumCount: number): number {
  const recencyBoost = Math.max(0, 120 - recencyDays) / 120;
  return corpusSize + recencyBoost + mediumCount * 0.3;
}

function clampLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return MAX_THEME_ENVELOPES;
  }
  return Math.max(1, Math.min(Math.floor(value), 512));
}

function parseTimestamp(input?: string): number {
  if (!input) {
    return 0;
  }
  const ms = Date.parse(input);
  return Number.isFinite(ms) ? ms : 0;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function clampBetween(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function slugify(raw: string): string {
  const base = raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return base || "theme";
}

function formatLabel(label: string): string {
  return label
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function extractZenStatements(text: string): string[] {
  const statements: string[] = [];
  const matches = text.match(/i (?:want|need|refuse|aim)[^\.!\n]+/gi);
  if (matches) {
    for (const statement of matches) {
      statements.push(truncate(statement.trim(), 160));
    }
  }
  return statements;
}
