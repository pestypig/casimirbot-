import type {
  HelixScholarlyFullTextChunk,
  HelixScholarlyFullTextObservation,
  HelixScholarlyPaperResult,
  HelixScholarlyResearchObservation,
} from "../helix-scholarly-research-observation";
import {
  buildTheoryFrontierLiteratureMapV1,
  THEORY_FRONTIER_LITERATURE_MAP_SCHEMA_VERSION,
  type TheoryFrontierExtractedEvidenceV1,
  type TheoryFrontierLiteratureEffectV1,
  type TheoryFrontierLiteratureMapV1,
  type TheoryFrontierLiteratureMappingV1,
  type TheoryFrontierLiteratureSourceV1,
} from "../contracts/theory-frontier-literature-map.v1";
import type { TheoryBadgeGraphV1 } from "../contracts/theory-badge-graph.v1";
import type { TheoryFrontierCandidateV1 } from "../contracts/theory-frontier-candidate.v1";
import { buildTheoryBiomeLayoutV1 } from "./theory-biome-layout";
import { locateTheoryBadges } from "./theory-badge-overlap-locator";
import {
  hashTheoryFrontierGraph,
  THEORY_FRONTIER_SCORING_VERSION,
  THEORY_FRONTIER_TAXONOMY_VERSION,
} from "./theory-frontier-search";

export { buildTheoryFrontierScholarlyLookupRequests } from "./theory-frontier-search";

export type BuildTheoryFrontierLiteratureMapInput = {
  graph: TheoryBadgeGraphV1;
  query: string;
  searchSeed: string;
  candidates: TheoryFrontierCandidateV1[];
  sources: TheoryFrontierLiteratureSourceV1[];
  extractedEvidence: TheoryFrontierExtractedEvidenceV1[];
  generatedAt?: string;
  mapSeed?: string;
};

export type BuildTheoryFrontierLiteratureMapFromScholarlyObservationsInput = {
  graph: TheoryBadgeGraphV1;
  query: string;
  searchSeed: string;
  candidates: TheoryFrontierCandidateV1[];
  researchObservation?: HelixScholarlyResearchObservation | null;
  fullTextObservation?: HelixScholarlyFullTextObservation | null;
  generatedAt?: string;
  mapSeed?: string;
};

const normalizeKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\\_/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const unique = <T>(values: T[]): T[] =>
  Array.from(new Set(values.filter((value: T): value is T => Boolean(value))));

function stableHashHex(input: string): string {
  let h = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    h ^= input.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

const confidenceScore = (value: HelixScholarlyPaperResult["confidence"] | undefined): number => {
  if (value === "high") return 0.86;
  if (value === "low") return 0.58;
  return 0.72;
};

const compactText = (value: string, maxChars = 900): string => {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxChars) return compact;
  return `${compact.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
};

const allKnownSymbols = (graph: TheoryBadgeGraphV1): string[] =>
  unique(graph.badges.flatMap((badge) => badge.hintKeys.symbols)).sort();

const allKnownEquationFamilies = (graph: TheoryBadgeGraphV1): string[] =>
  unique(graph.badges.flatMap((badge) => badge.hintKeys.equationFamilies)).sort();

const allKnownUnitSignatures = (graph: TheoryBadgeGraphV1): string[] =>
  unique(graph.badges.flatMap((badge) => badge.hintKeys.unitSignatures)).sort();

const textMentionsKey = (textKey: string, key: string): boolean => {
  const normalized = normalizeKey(key);
  if (!normalized) return false;
  return textKey.includes(normalized);
};

const extractKnownKeys = (text: string, keys: string[]): string[] => {
  const textKey = normalizeKey(text);
  return unique(keys.filter((key) => textMentionsKey(textKey, key))).sort();
};

const inferUnitSignatures = (text: string, graph: TheoryBadgeGraphV1): string[] => {
  const explicit = allKnownUnitSignatures(graph).filter((signature) => text.includes(signature));
  const derived = [
    /\b(?:J\s*\/\s*m\^?3|J\s*m\^-?3|Pa|pascal|energy\s+density|stress[-\s]?energy)\b/i.test(text)
      ? "M L^-1 T^-2"
      : "",
    /\b(?:second|seconds|\bs\b|time|duration)\b/i.test(text) ? "T" : "",
    /\b(?:meter|metre|\bm\b|length|distance)\b/i.test(text) ? "L" : "",
  ];
  return unique([...explicit, ...derived].filter(Boolean)).sort();
};

const extractValues = (text: string): string[] =>
  unique(text.match(/[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?\s*(?:J\/m\^?3|Pa|m\/s|kg|m|s|Hz|eV|K|%)/gi) ?? []).sort();

const limitationPhrases = (text: string): string[] =>
  unique(
    [
      ...text.match(/\b(?:cannot|does not|do not|fails? to|insufficient|uncertain|unknown|requires|limitation|limited by|future work)[^.]*\./gi) ?? [],
    ].map(compactText),
  ).sort();

const classifyExtractedKind = (args: {
  text: string;
  values: string[];
  equationFamilies: string[];
}): TheoryFrontierExtractedEvidenceV1["kind"] => {
  if (/\b(?:cannot|does not|do not|fails? to|insufficient|uncertain|unknown|limitation|limited by)\b/i.test(args.text)) {
    return "limitation";
  }
  if (/[A-Za-z0-9_{}]\s*=\s*[A-Za-z0-9_{}]/.test(args.text) || args.equationFamilies.length > 0) {
    return "equation";
  }
  if (args.values.length > 0) return "value";
  return "claim";
};

const sourceIdForPaper = (paper: HelixScholarlyPaperResult): string => `paper:${paper.result_id}`;

const sourceIdForFullText = (
  fullText: HelixScholarlyFullTextObservation,
  paper?: HelixScholarlyPaperResult | null,
): string => paper ? sourceIdForPaper(paper) : `paper:${fullText.paper_result_id ?? fullText.artifact_id}`;

const sourceFromPaper = (paper: HelixScholarlyPaperResult, fullText?: HelixScholarlyFullTextObservation | null): TheoryFrontierLiteratureSourceV1 => ({
  sourceId: sourceIdForPaper(paper),
  title: paper.title,
  url: paper.identifiers.url ?? paper.identifiers.full_text_url ?? paper.identifiers.pdf_url ?? null,
  doi: paper.identifiers.doi ?? null,
  authors: paper.authors.map((author) => author.name).filter(Boolean),
  year: paper.year ?? null,
  retrieval: {
    targetSource: "scholarly_research",
    requestedOutputs: unique([
      "scholarly_paper_refs",
      "doi_metadata",
      fullText ? "scholarly_full_text" : "",
      fullText ? "paper_pdf_pages" : "",
    ].filter(Boolean)) as TheoryFrontierLiteratureSourceV1["retrieval"]["requestedOutputs"],
    fullTextRetrieved: Boolean(fullText && fullText.pages_parsed > 0),
    fullTextDigest: fullText?.cache_integrity_hash ?? fullText?.source_pdf_ref ?? null,
  },
});

const sourceFromFullTextOnly = (fullText: HelixScholarlyFullTextObservation): TheoryFrontierLiteratureSourceV1 => ({
  sourceId: sourceIdForFullText(fullText),
  title: fullText.title ?? fullText.paper_result_id ?? fullText.artifact_id,
  url: fullText.source_url ?? null,
  doi: null,
  authors: [],
  year: null,
  retrieval: {
    targetSource: "scholarly_research",
    requestedOutputs: ["scholarly_full_text", "paper_pdf_pages"],
    fullTextRetrieved: fullText.pages_parsed > 0,
    fullTextDigest: fullText.cache_integrity_hash ?? fullText.source_pdf_ref ?? null,
  },
});

const evidenceFromText = (args: {
  itemId: string;
  sourceId: string;
  text: string;
  graph: TheoryBadgeGraphV1;
  pageRefs: string[];
  confidence: number;
}): TheoryFrontierExtractedEvidenceV1 | null => {
  const text = compactText(args.text);
  if (!text) return null;
  const symbols = extractKnownKeys(text, allKnownSymbols(args.graph));
  const equationFamilies = extractKnownKeys(text, allKnownEquationFamilies(args.graph));
  const unitSignatures = inferUnitSignatures(text, args.graph);
  const values = extractValues(text);
  const limitations = limitationPhrases(text);
  const kind = classifyExtractedKind({ text, values, equationFamilies });
  return {
    itemId: args.itemId,
    sourceId: args.sourceId,
    kind,
    text,
    symbols,
    equationFamilies,
    unitSignatures,
    values,
    limitations,
    pageRefs: args.pageRefs,
    confidence: Math.max(0, Math.min(1, Number(args.confidence.toFixed(3)))),
  };
};

const evidenceFromPaper = (args: {
  paper: HelixScholarlyPaperResult;
  graph: TheoryBadgeGraphV1;
}): TheoryFrontierExtractedEvidenceV1[] => {
  const sourceId = sourceIdForPaper(args.paper);
  return [
    args.paper.abstract
      ? evidenceFromText({
          itemId: `${sourceId}:abstract`,
          sourceId,
          text: args.paper.abstract,
          graph: args.graph,
          pageRefs: args.paper.evidence_refs,
          confidence: confidenceScore(args.paper.confidence),
        })
      : null,
    evidenceFromText({
      itemId: `${sourceId}:title`,
      sourceId,
      text: args.paper.title,
      graph: args.graph,
      pageRefs: args.paper.evidence_refs,
      confidence: Math.max(0.4, confidenceScore(args.paper.confidence) - 0.12),
    }),
  ].filter((entry: TheoryFrontierExtractedEvidenceV1 | null): entry is TheoryFrontierExtractedEvidenceV1 => Boolean(entry));
};

const evidenceFromFullTextChunk = (args: {
  chunk: HelixScholarlyFullTextChunk;
  sourceId: string;
  graph: TheoryBadgeGraphV1;
}): TheoryFrontierExtractedEvidenceV1 | null =>
  evidenceFromText({
    itemId: `${args.sourceId}:chunk:${args.chunk.chunk_id}`,
    sourceId: args.sourceId,
    text: args.chunk.text_excerpt,
    graph: args.graph,
    pageRefs: [args.chunk.citation_ref, args.chunk.source_text_ref].filter(Boolean),
    confidence: Math.max(0.45, Math.min(0.95, 0.5 + args.chunk.relevance_score * 0.45)),
  });

function findPaperForFullText(
  fullText: HelixScholarlyFullTextObservation,
  papers: HelixScholarlyPaperResult[],
): HelixScholarlyPaperResult | null {
  const target = fullText.paper_result_id;
  if (!target) return null;
  return papers.find((paper) => paper.result_id === target || paper.identifiers.doi === target || paper.identifiers.arxiv_id === target) ?? null;
}

function sourceEvidenceReference(source: TheoryFrontierLiteratureSourceV1): string {
  return [
    "literature_ref",
    source.doi ? `doi:${source.doi}` : "",
    source.url ?? "",
    source.sourceId,
  ].join("::");
}

function textHasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function classifyEffect(args: {
  evidence: TheoryFrontierExtractedEvidenceV1;
  mappedBadgeIds: string[];
  candidateIds: string[];
}): TheoryFrontierLiteratureEffectV1 {
  const text = `${args.evidence.text} ${args.evidence.limitations.join(" ")}`;
  if (args.mappedBadgeIds.length === 0 && args.candidateIds.length === 0) return "unrelated";
  if (
    args.evidence.kind === "limitation" ||
    textHasAny(text, [/\bconflict/i, /\bfail/i, /\binvalid/i, /\bnot\s+support/i, /\bcontradict/i, /\bcannot\b/i])
  ) {
    return "conflict_with_badge";
  }
  if (textHasAny(text, [/\bmissing\b/i, /\bunknown\b/i, /\brequires\b/i, /\binsufficient\b/i, /\buncertain\b/i])) {
    return "identify_missing_evidence";
  }
  if (
    args.candidateIds.length === 0 &&
    args.mappedBadgeIds.length > 0 &&
    textHasAny(text, [/\bbridge\b/i, /\bintermediate\b/i, /\bconnect/i, /\bsuggest/i])
  ) {
    return "suggest_missing_badge";
  }
  return "support_existing_context";
}

function itemQuery(evidence: TheoryFrontierExtractedEvidenceV1): string {
  return unique([
    evidence.text,
    ...evidence.symbols,
    ...evidence.equationFamilies,
    ...evidence.unitSignatures,
    ...evidence.values,
    ...evidence.limitations,
  ]).join(" ");
}

function candidateIdsForBadgeIds(candidates: TheoryFrontierCandidateV1[], badgeIds: string[]): string[] {
  const badgeSet = new Set(badgeIds);
  return candidates
    .filter((candidate) => candidate.badgeIds.some((badgeId) => badgeSet.has(badgeId)))
    .map((candidate) => candidate.candidateId)
    .sort();
}

function candidateIdsForChunkIds(
  candidates: TheoryFrontierCandidateV1[],
  renderChunkIds: string[],
  semanticChunkIds: string[],
): string[] {
  const renderSet = new Set(renderChunkIds);
  const semanticSet = new Set(semanticChunkIds);
  return candidates
    .filter(
      (candidate) =>
        candidate.biomeRegion.renderChunkIds.some((chunkId) => renderSet.has(chunkId)) ||
        candidate.biomeRegion.semanticChunkIds.some((chunkId) => semanticSet.has(chunkId)),
    )
    .map((candidate) => candidate.candidateId)
    .sort();
}

function mappingForEvidence(args: {
  graph: TheoryBadgeGraphV1;
  candidates: TheoryFrontierCandidateV1[];
  evidence: TheoryFrontierExtractedEvidenceV1;
  source: TheoryFrontierLiteratureSourceV1 | undefined;
  coordinatesByBadgeId: Map<string, { renderChunkId: string; semanticChunkId: string }>;
}): TheoryFrontierLiteratureMappingV1 {
  const matches = locateTheoryBadges({
    graph: args.graph,
    input: {
      query: itemQuery(args.evidence),
      symbols: args.evidence.symbols,
      unitSignatures: args.evidence.unitSignatures,
      equationFamilies: args.evidence.equationFamilies,
      limit: 8,
    },
  });
  const badgeIds = matches.map((match) => match.badgeId).sort();
  const renderChunkIds = unique(
    badgeIds.map((badgeId) => args.coordinatesByBadgeId.get(badgeId)?.renderChunkId ?? ""),
  ).sort();
  const semanticChunkIds = unique(
    badgeIds.map((badgeId) => args.coordinatesByBadgeId.get(badgeId)?.semanticChunkId ?? ""),
  ).sort();
  const directCandidateIds = candidateIdsForBadgeIds(args.candidates, badgeIds);
  const chunkCandidateIds = candidateIdsForChunkIds(args.candidates, renderChunkIds, semanticChunkIds);
  const candidateIds = unique([...directCandidateIds, ...chunkCandidateIds]).sort();
  const effect = classifyEffect({
    evidence: args.evidence,
    mappedBadgeIds: badgeIds,
    candidateIds,
  });
  const extractedEquations =
    args.evidence.kind === "equation" ? [args.evidence.text] : args.evidence.equationFamilies;
  const reasons = unique([
    ...matches.flatMap((match) => match.reasons),
    directCandidateIds.length > 0 ? "paper evidence overlaps candidate badge ids" : "",
    chunkCandidateIds.length > 0 ? "paper evidence overlaps candidate biome chunks" : "",
    args.source?.retrieval.fullTextRetrieved ? "full text was available for extraction" : "metadata or excerpt evidence only",
    `literature effect is ${effect}; no theory edge promotion is authorized`,
  ]).sort();

  return {
    mappingId: `literature_mapping:${stableHashHex(`${args.evidence.sourceId}:${args.evidence.itemId}:${badgeIds.join("|")}`)}`,
    sourceId: args.evidence.sourceId,
    sourceItemId: args.evidence.itemId,
    effect,
    candidateIds,
    badgeIds,
    renderChunkIds,
    semanticChunkIds,
    extractedClaims: args.evidence.kind === "claim" ? [args.evidence.text] : [],
    extractedEquations,
    extractedValues: args.evidence.values,
    extractedLimitations: args.evidence.kind === "limitation" ? [args.evidence.text, ...args.evidence.limitations] : args.evidence.limitations,
    reasons,
  };
}

export function buildTheoryFrontierLiteratureMap(
  input: BuildTheoryFrontierLiteratureMapInput,
): TheoryFrontierLiteratureMapV1 {
  const graphHash = hashTheoryFrontierGraph(input.graph);
  const layout = buildTheoryBiomeLayoutV1(input.graph);
  const coordinatesByBadgeId = new Map(
    layout.coordinates.map((coordinate) => [
      coordinate.badgeId,
      {
        renderChunkId: coordinate.renderChunkId,
        semanticChunkId: coordinate.semanticChunkId,
      },
    ]),
  );
  const sourcesById = new Map(input.sources.map((source) => [source.sourceId, source]));
  const mappings = input.extractedEvidence
    .map((evidence) =>
      mappingForEvidence({
        graph: input.graph,
        candidates: input.candidates,
        evidence,
        source: sourcesById.get(evidence.sourceId),
        coordinatesByBadgeId,
      }),
    )
    .sort((left, right) => left.mappingId.localeCompare(right.mappingId));
  const evidenceReferenceIds = unique([
    ...input.sources.map(sourceEvidenceReference),
    ...input.extractedEvidence.map((evidence) => `literature_item::${evidence.sourceId}::${evidence.itemId}`),
  ]).sort();
  const mapSeed = input.mapSeed ?? `${input.searchSeed}:literature`;

  return buildTheoryFrontierLiteratureMapV1({
    generatedAt: input.generatedAt,
    mapId: `literature_map:${stableHashHex(`${graphHash}:${input.query}:${mapSeed}:${evidenceReferenceIds.join("|")}`)}`,
    frontierCandidateIds: input.candidates.map((candidate) => candidate.candidateId).sort(),
    replay: {
      graphHash,
      graphId: input.graph.graphId,
      query: input.query,
      searchSeed: input.searchSeed,
      taxonomyVersion: THEORY_FRONTIER_TAXONOMY_VERSION,
      scoringVersion: THEORY_FRONTIER_SCORING_VERSION,
      literatureMapVersion: THEORY_FRONTIER_LITERATURE_MAP_SCHEMA_VERSION,
      evidenceReferenceIds,
    },
    sources: input.sources,
    extractedEvidence: input.extractedEvidence,
    mappings,
  });
}

export function buildTheoryFrontierLiteratureMapFromScholarlyObservations(
  input: BuildTheoryFrontierLiteratureMapFromScholarlyObservationsInput,
): TheoryFrontierLiteratureMapV1 | null {
  const papers = input.researchObservation?.papers ?? [];
  const fullText = input.fullTextObservation ?? null;
  const fullTextPaper = fullText ? findPaperForFullText(fullText, papers) : null;
  const sourceById = new Map<string, TheoryFrontierLiteratureSourceV1>();

  for (const paper of papers) {
    const matchedFullText = fullTextPaper?.result_id === paper.result_id ? fullText : null;
    sourceById.set(sourceIdForPaper(paper), sourceFromPaper(paper, matchedFullText));
  }
  if (fullText && !sourceById.has(sourceIdForFullText(fullText, fullTextPaper))) {
    sourceById.set(sourceIdForFullText(fullText, fullTextPaper), sourceFromFullTextOnly(fullText));
  }

  const extractedEvidence = unique([
    ...papers.flatMap((paper) => evidenceFromPaper({ paper, graph: input.graph })),
    ...(fullText
      ? fullText.selected_chunks
          .map((chunk) =>
            evidenceFromFullTextChunk({
              chunk,
              sourceId: sourceIdForFullText(fullText, fullTextPaper),
              graph: input.graph,
            }),
          )
          .filter((entry: TheoryFrontierExtractedEvidenceV1 | null): entry is TheoryFrontierExtractedEvidenceV1 => Boolean(entry))
      : []),
  ]);

  const sources = Array.from(sourceById.values()).sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  if (sources.length === 0 && extractedEvidence.length === 0) return null;

  return buildTheoryFrontierLiteratureMap({
    graph: input.graph,
    query: input.query,
    searchSeed: input.searchSeed,
    candidates: input.candidates,
    sources,
    extractedEvidence: extractedEvidence.sort((left, right) => left.itemId.localeCompare(right.itemId)),
    generatedAt: input.generatedAt,
    mapSeed: input.mapSeed,
  });
}
