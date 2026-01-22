import type {
  AgiEvidence,
  AgiExecutionEnvelope,
  AgiIntent,
  AgiQuery,
  AgiRefineryRequest,
  AgiTrajectory,
  AgiTrajectoryMeta,
} from "@shared/agi-refinery";
import type { GroundingReport, GroundingSource } from "@shared/grounding";
import type { KnowledgeProjectExport } from "@shared/knowledge";
import { hashStableJson, sha256Prefixed } from "../../utils/information-boundary";
import { stableJsonStringify } from "../../utils/stable-json";
import { isRestrictedEvidencePath } from "./refinery-gates";
import {
  normalizeEvidencePath,
  normalizeEvidenceRef,
} from "./refinery-identity";

const parseBoundedInt = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(min, Math.floor(parsed)), max);
};

const MAX_EVIDENCE = parseBoundedInt(
  process.env.AGI_REFINERY_MAX_EVIDENCE,
  80,
  5,
  500,
);
const MAX_RETRIEVAL = parseBoundedInt(
  process.env.AGI_REFINERY_MAX_RETRIEVAL,
  80,
  5,
  500,
);
const MAX_TEXT_CHARS = parseBoundedInt(
  process.env.AGI_REFINERY_MAX_TEXT_CHARS,
  8000,
  256,
  50000,
);
const MAX_CITATION_FALLBACK = parseBoundedInt(
  process.env.AGI_REFINERY_CITATION_COMPLETION_MAX,
  12,
  1,
  16,
);

const redactPatterns: Array<[RegExp, string]> = [
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]"],
  [/\bBearer\s+[A-Za-z0-9._-]+\b/g, "Bearer [redacted]"],
  [/\bAIza[0-9A-Za-z\-_]{30,}\b/g, "[redacted-key]"],
  [/\b(?:sk|rk|pk)-[A-Za-z0-9]{12,}\b/g, "[redacted-key]"],
  [/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, "[redacted-aws-key]"],
];

const clampText = (value: string, limit: number): string =>
  value.length > limit ? `${value.slice(0, limit)}...` : value;

export const scrubSensitiveText = (value: string): string => {
  let next = value;
  for (const [pattern, replacement] of redactPatterns) {
    next = next.replace(pattern, replacement);
  }
  return clampText(next.trim(), MAX_TEXT_CHARS);
};

const filterRestrictedEvidence = (items: AgiEvidence[]): AgiEvidence[] =>
  items.filter((item) => !isRestrictedEvidencePath(item.path));

const filterRestrictedStrings = (items?: string[]): string[] | undefined => {
  if (!items || items.length === 0) return items;
  const output: string[] = [];
  for (const item of items) {
    const normalized = normalizeEvidenceRef(item);
    if (!normalized) continue;
    if (isRestrictedEvidencePath(normalized)) continue;
    output.push(normalized);
  }
  return output;
};

const hashEvidenceRef = (input: Record<string, unknown>): string =>
  hashStableJson(input);

const isEssenceCitation = (value: string): boolean =>
  value.trim().toLowerCase().startsWith("essence:");

const resolveEvidenceCitation = (item: AgiEvidence): string | undefined => {
  if (item.path && !isRestrictedEvidencePath(item.path)) return item.path;
  if (item.id) return item.id;
  if (item.hash) return item.hash;
  return undefined;
};

const collectCitationFallback = (
  primary?: AgiEvidence[],
  secondary?: AgiEvidence[],
): string[] => {
  const output: string[] = [];
  const seen = new Set<string>();
  const addItem = (item: AgiEvidence): void => {
    if (output.length >= MAX_CITATION_FALLBACK) return;
    const citation = resolveEvidenceCitation(item);
    if (!citation) return;
    if (seen.has(citation)) return;
    seen.add(citation);
    output.push(citation);
  };
  primary?.forEach(addItem);
  secondary?.forEach(addItem);
  return output;
};

const buildEvidenceFromGrounding = (
  sources?: GroundingSource[],
): AgiEvidence[] => {
  if (!sources || sources.length === 0) return [];
  return sources.map((source) => {
    const kind = source.kind;
    const id = source.id?.trim() || undefined;
    const path = normalizeEvidencePath(source.path);
    const hash = hashEvidenceRef({ kind, id, path });
    return {
      kind,
      id,
      path,
      hash,
      hashType: "ref",
      source: "grounding_report",
      extra: source.extra ? { ...source.extra } : undefined,
    };
  });
};

const buildEvidenceFromKnowledgeContext = (
  knowledgeContext?: KnowledgeProjectExport[],
): AgiEvidence[] => {
  if (!knowledgeContext || knowledgeContext.length === 0) return [];
  const evidence: AgiEvidence[] = [];
  for (const project of knowledgeContext) {
    for (const file of project.files ?? []) {
      const path = normalizeEvidencePath(file.path || file.name);
      const isDoc =
        (path?.toLowerCase().endsWith(".md") ?? false) ||
        file.mime?.toLowerCase().includes("markdown");
      const kind = isDoc ? "doc" : "repo_file";
      const hash = file.hashSlug
        ? file.hashSlug
        : sha256Prefixed(
            stableJsonStringify({
              projectId: project.project.id,
              fileId: file.id,
              path,
            }),
          );
      evidence.push({
        id: file.id,
        kind,
        path,
        hash,
        hashType: file.hashSlug ? "hash_slug" : "ref",
        source: "knowledge_context",
        extra: {
          projectId: project.project.id,
          projectName: project.project.name,
          mime: file.mime,
          fileKind: file.kind,
        },
      });
    }
  }
  return evidence;
};

type RepoGraphHitInput = {
  id?: string;
  kind?: string;
  path?: string;
  file_path?: string;
  snippet?: string;
  snippet_id?: string;
  score?: number;
  symbol_name?: string;
};

const dedupeEvidence = (items: AgiEvidence[]): AgiEvidence[] => {
  const seen = new Set<string>();
  const output: AgiEvidence[] = [];
  for (const item of items) {
    const key = item.hash ?? `${item.kind ?? ""}:${item.id ?? ""}:${item.path ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
};

const clampEvidence = (items: AgiEvidence[]): AgiEvidence[] =>
  items.length > MAX_EVIDENCE ? items.slice(0, MAX_EVIDENCE) : items;

const clampRetrieval = (items: AgiEvidence[]): AgiEvidence[] =>
  items.length > MAX_RETRIEVAL ? items.slice(0, MAX_RETRIEVAL) : items;

export const buildEvidenceFromRepoGraphHits = (
  hits: RepoGraphHitInput[] | undefined,
  source: string,
): AgiEvidence[] => {
  if (!hits || hits.length === 0) return [];
  const items = hits.map((hit) => {
    const path = normalizeEvidencePath(hit.file_path ?? hit.path);
    const kind = hit.kind ?? "repo_hit";
    const snippetHash = hit.snippet
      ? hashStableJson({ snippet: clampText(hit.snippet, 2000) })
      : undefined;
    const hash = hashEvidenceRef({
      kind,
      id: hit.id,
      path,
      snippetHash,
      symbol: hit.symbol_name,
    });
    return {
      id: hit.id,
      kind,
      path,
      hash,
      hashType: "ref",
      score: hit.score,
      snippetHash,
      source,
      extra: {
        snippetId: hit.snippet_id,
        symbolName: hit.symbol_name,
      },
    };
  });
  return clampRetrieval(dedupeEvidence(items));
};

export type BuildRefineryTrajectoryArgs = {
  trajectoryId: string;
  traceId: string;
  sessionId?: string;
  personaId?: string;
  createdAt: string;
  goal: string;
  intent?: AgiIntent;
  strategy?: string;
  searchQuery?: string;
  topK?: number;
  summaryFocus?: string;
  model?: string;
  plannerVersion?: string;
  executorVersion?: string;
  toolVersions?: Record<string, string>;
  knowledgeContext?: KnowledgeProjectExport[];
  groundingReport?: GroundingReport;
  knowledgeHash?: string | null;
  resourceHints?: string[];
  knowledgeProjects?: string[];
  summary?: string;
  citations?: string[];
  durationMs?: number;
  tokens?: number;
  executionOk?: boolean;
  executionErrorTypes?: string[];
  executionEnvelopes?: AgiExecutionEnvelope[];
  formatOk?: boolean;
  testsRun?: boolean;
  testsOk?: boolean;
  testsRequired?: boolean;
  codeTouched?: boolean;
  codeTouchedPaths?: string[];
  contractRequired?: boolean;
  contractOk?: boolean;
  contractIssues?: string[];
  constraintRequired?: boolean;
  constraintOk?: boolean;
  constraintSources?: string[];
  constraintIssues?: string[];
  budgetOk?: boolean;
  safetyOk?: boolean;
  sanitizeEvidence?: boolean;
  retrievalCandidates?: AgiEvidence[];
  retrievalSelected?: AgiEvidence[];
  citationCompletionApplied?: boolean;
  candidateRecallPreCompletion?: number;
  candidateRecallPostCompletion?: number;
  selectedRecallPreCompletion?: number;
  selectedRecallPostCompletion?: number;
  citationsPreCompletion?: number;
  citationsPostCompletion?: number;
  completionQueriesCount?: number;
  completionLatencyMs?: number;
  refinery?: AgiRefineryRequest;
};

export const buildRefineryTrajectory = (
  args: BuildRefineryTrajectoryArgs,
): AgiTrajectory => {
  const x = scrubSensitiveText(args.goal);
  const summary = args.summary ? scrubSensitiveText(args.summary) : undefined;
  const sanitizeEvidence = Boolean(args.sanitizeEvidence);
  const queries: AgiQuery[] = [];
  if (args.searchQuery || args.topK) {
    queries.push({
      text: scrubSensitiveText(args.searchQuery ?? args.goal),
      topK: args.topK,
      source: "plan",
    });
  }

  const evidence = clampEvidence(
    dedupeEvidence([
      ...buildEvidenceFromGrounding(args.groundingReport?.sources),
      ...buildEvidenceFromKnowledgeContext(args.knowledgeContext),
    ]),
  );
  const sanitizedEvidence = sanitizeEvidence
    ? filterRestrictedEvidence(evidence)
    : evidence;
  const baseCitations =
    args.citations && args.citations.length > 0
      ? args.citations.filter(
          (value) => typeof value === "string" && value.trim().length > 0,
        )
      : (sanitizedEvidence.map((item) => item.hash).filter(Boolean) as string[]);
  let citations = sanitizeEvidence
    ? baseCitations.filter((value) => !isRestrictedEvidencePath(value))
    : baseCitations;
  const retrievalCandidates = args.retrievalCandidates
    ? clampRetrieval(dedupeEvidence(args.retrievalCandidates))
    : undefined;
  const retrievalSelected = args.retrievalSelected
    ? clampRetrieval(dedupeEvidence(args.retrievalSelected))
    : undefined;
  const sanitizedCandidates =
    sanitizeEvidence && retrievalCandidates
      ? filterRestrictedEvidence(retrievalCandidates)
      : retrievalCandidates;
  const sanitizedSelected =
    sanitizeEvidence && retrievalSelected
      ? filterRestrictedEvidence(retrievalSelected)
      : retrievalSelected;
  const sanitizedHints = sanitizeEvidence
    ? filterRestrictedStrings(args.resourceHints)
    : args.resourceHints;
  if (
    citations.length > 0 &&
    citations.every((value) => isEssenceCitation(value))
  ) {
    const fallback = collectCitationFallback(
      sanitizedSelected,
      sanitizedCandidates,
    );
    if (fallback.length > 0) {
      citations = fallback;
    }
  }
  const meta: AgiTrajectoryMeta = {
    origin: args.refinery?.origin,
    model: args.model,
    plannerVersion: args.plannerVersion,
    executorVersion: args.executorVersion,
    toolVersions: args.toolVersions,
    knowledgeHash: args.knowledgeHash ?? undefined,
    knowledgeProjects: args.knowledgeProjects,
    resourceHints: sanitizedHints,
    searchQuery: args.searchQuery,
    summaryFocus: args.summaryFocus,
    topK: args.topK,
    durationMs: args.durationMs,
    tokens: args.tokens,
    executionOk: args.executionOk,
    executionErrorTypes: args.executionErrorTypes,
    executionEnvelopes: args.executionEnvelopes,
    formatOk: args.formatOk,
    testsRun: args.testsRun,
    testsOk: args.testsOk,
    testsRequired: args.testsRequired,
    codeTouched: args.codeTouched,
    codeTouchedPaths: args.codeTouchedPaths,
    contractRequired: args.contractRequired,
    contractOk: args.contractOk,
    contractIssues: args.contractIssues,
    constraintRequired: args.constraintRequired,
    constraintOk: args.constraintOk,
    constraintSources: args.constraintSources,
    constraintIssues: args.constraintIssues,
    budgetOk: args.budgetOk,
    safetyOk: args.safetyOk,
    groundingCount: sanitizedEvidence.length,
    retrievalCandidates: sanitizedCandidates,
    retrievalSelected: sanitizedSelected,
    citationCompletionApplied: args.citationCompletionApplied,
    candidateRecallPreCompletion: args.candidateRecallPreCompletion,
    candidateRecallPostCompletion: args.candidateRecallPostCompletion,
    selectedRecallPreCompletion: args.selectedRecallPreCompletion,
    selectedRecallPostCompletion: args.selectedRecallPostCompletion,
    citationsPreCompletion: args.citationsPreCompletion,
    citationsPostCompletion: args.citationsPostCompletion,
    completionQueriesCount: args.completionQueriesCount,
    completionLatencyMs: args.completionLatencyMs,
    variantOf: args.refinery?.seedId,
    variantId: args.refinery?.variantId,
    tags: args.refinery?.tags,
  };

  return {
    id: args.trajectoryId,
    traceId: args.traceId,
    sessionId: args.sessionId,
    personaId: args.personaId,
    createdAt: args.createdAt,
    x,
    z: args.intent,
    s: args.strategy,
    q: queries,
    E: sanitizedEvidence,
    y: summary
      ? {
          summary,
          text: summary,
          citations: citations.length > 0 ? citations : undefined,
        }
      : undefined,
    meta: Object.keys(meta).length > 0 ? meta : undefined,
  };
};
