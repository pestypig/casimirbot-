import {
  HELIX_MODEL_OBSERVATION_PACKET_SCHEMA,
  type HelixModelObservationPacket,
  type HelixModelObservationSource,
  type HelixModelObservationStatus,
} from "@shared/helix-model-observation-packet";

export const HELIX_MODEL_CONTEXT_ECONOMY_REPORT_SCHEMA =
  "helix.model_context_economy_report.v1" as const;

export type HelixModelContextEconomySection =
  | "user_goal"
  | "canonical_goal"
  | "capability_surface_compact"
  | "route_contract_compact"
  | "terminal_contract_compact"
  | "compact_observations"
  | "exact_excerpts"
  | "goal_satisfaction"
  | "final_answer_constraints"
  | "commentary"
  | "debug_excluded"
  | "raw_spans_excluded"
  | "receipts_excluded";

export type HelixModelContextEconomyReport = {
  schema: typeof HELIX_MODEL_CONTEXT_ECONOMY_REPORT_SCHEMA;
  estimated_input_tokens_by_section: Record<HelixModelContextEconomySection, number>;
  dropped_sections: string[];
  selected_observation_refs: string[];
  raw_debug_excluded_from_model_context: boolean;
  raw_span_refs_available: string[];
  exact_excerpt_refs_included: string[];
  section_char_caps: Record<string, number>;
};

export type HelixModelPromptContext = {
  compact_observations: HelixModelObservationPacket[];
  terminal_contract_compact: Record<string, unknown> | null;
  route_contract_compact: Record<string, unknown> | null;
  capability_surface_compact: Array<Record<string, unknown>>;
  exact_excerpts: Array<Record<string, unknown>>;
  economy_report: HelixModelContextEconomyReport;
};

const DEFAULT_COMMENTARY_MAX_CHARS = 280;
const DEFAULT_MODEL_OBSERVATION_MAX_PACKETS = 12;
const DEFAULT_MODEL_OBSERVATION_MAX_FINDINGS = 6;
const DEFAULT_MODEL_OBSERVATION_MAX_PROVES = 6;
const DEFAULT_EXACT_EXCERPT_MAX_CHARS = 1200;

const readEnvInt = (key: string, fallback: number, min: number, max: number): number => {
  const raw = Number(process.env[key]);
  if (!Number.isFinite(raw)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(raw)));
};

const config = () => ({
  commentaryMaxChars: readEnvInt("HELIX_ASK_COMMENTARY_MAX_CHARS", DEFAULT_COMMENTARY_MAX_CHARS, 80, 1000),
  observationMaxPackets: readEnvInt("HELIX_ASK_MODEL_OBSERVATION_MAX_PACKETS", DEFAULT_MODEL_OBSERVATION_MAX_PACKETS, 1, 48),
  observationMaxFindings: readEnvInt("HELIX_ASK_MODEL_OBSERVATION_MAX_FINDINGS", DEFAULT_MODEL_OBSERVATION_MAX_FINDINGS, 1, 20),
  observationMaxProves: readEnvInt("HELIX_ASK_MODEL_OBSERVATION_MAX_PROVES", DEFAULT_MODEL_OBSERVATION_MAX_PROVES, 1, 20),
  exactExcerptMaxChars: readEnvInt("HELIX_ASK_EXACT_EXCERPT_MAX_CHARS", DEFAULT_EXACT_EXCERPT_MAX_CHARS, 120, 6000),
  rawDebugInModelContext: String(process.env.HELIX_ASK_RAW_DEBUG_IN_MODEL_CONTEXT ?? "0").trim() === "1",
});

const SECTION_KEYS: HelixModelContextEconomySection[] = [
  "user_goal",
  "canonical_goal",
  "capability_surface_compact",
  "route_contract_compact",
  "terminal_contract_compact",
  "compact_observations",
  "exact_excerpts",
  "goal_satisfaction",
  "final_answer_constraints",
  "commentary",
  "debug_excluded",
  "raw_spans_excluded",
  "receipts_excluded",
];

const estimateTokens = (value: unknown): number => {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return Math.max(0, Math.ceil(text.length / 4));
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const readStringArray = (value: unknown): string[] =>
  readArray(value).map((entry) => readString(entry)).filter((entry): entry is string => Boolean(entry));

const compactText = (value: unknown, maxChars: number): string => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
};

const unique = (values: Array<string | null | undefined>, limit = 64): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
    if (out.length >= limit) break;
  }
  return out;
};

const normalizeStatus = (value: unknown): HelixModelObservationStatus => {
  const text = readString(value);
  if (
    text === "succeeded" ||
    text === "blocked" ||
    text === "missing_input" ||
    text === "needs_confirmation" ||
    text === "failed" ||
    text === "client_pending"
  ) {
    return text;
  }
  if (text === "completed" || text === "ok" || text === "observed") return "succeeded";
  return "unknown";
};

const inferSource = (record: Record<string, unknown>, kind?: string | null): HelixModelObservationSource => {
  const schema = readString(record.schema) ?? "";
  const capability = readString(record.capability_key) ?? "";
  const panelId = readString(record.panel_id) ?? "";
  const searchable = `${schema} ${kind ?? ""} ${capability} ${panelId}`.toLowerCase();
  if (searchable.includes("repo_code")) return "repo_code";
  if (searchable.includes("internet_search") || searchable.includes("internet-search")) return "internet_search";
  if (searchable.includes("scholarly_research") || searchable.includes("scholarly-research")) return "scholarly_research";
  if (searchable.includes("docs-viewer") || searchable.includes("doc_")) return "docs";
  if (searchable.includes("active_doc")) return "active_doc";
  if (searchable.includes("visual") || searchable.includes("screen")) return "visual_capture";
  if (searchable.includes("situation")) return "situation_room";
  if (searchable.includes("tool") || capability) return "tool";
  return "runtime_evidence";
};

const missingRequirements = (record: Record<string, unknown>, maxItems: number): string[] =>
  readArray(record.missing_requirements)
    .map((entry) => {
      const item = readRecord(entry);
      return compactText(
        readString(item?.message) ??
          readString(item?.code) ??
          readString(item?.repair_action) ??
          entry,
        220,
      );
    })
    .filter(Boolean)
    .slice(0, maxItems);

export const compactAgentStepObservationPacketForModel = (input: {
  turnId: string;
  observation: unknown;
  source?: HelixModelObservationSource;
  userRequested?: string;
}): HelixModelObservationPacket | null => {
  const record = readRecord(input.observation);
  if (!record) return null;
  const cfg = config();
  const receipts = readArray(record.receipts).map((entry) => readRecord(entry));
  const receiptRefs = receipts.map((entry) => readString(entry?.receipt_ref));
  const producedRefs = readStringArray(record.produced_artifact_refs);
  const observationRef =
    readString(record.call_id) ??
    readString(record.observation_id) ??
    readString(record.artifact_id) ??
    producedRefs[0] ??
    "observation";
  const summary =
    readString(record.observation_summary) ??
    readString(record.summary) ??
    "Tool produced a non-terminal observation.";
  const found = unique([compactText(summary, 420)], cfg.observationMaxFindings);
  const supportRefs = unique([...producedRefs, ...receiptRefs], 64);
  const missing = missingRequirements(record, cfg.observationMaxFindings);
  return {
    schema: HELIX_MODEL_OBSERVATION_PACKET_SCHEMA,
    turn_id: readString(record.turn_id) ?? input.turnId,
    iteration: typeof record.iteration === "number" ? record.iteration : undefined,
    observation_ref: observationRef,
    source: input.source ?? inferSource(record),
    source_target: readString(record.source_target) ?? undefined,
    capability_key: readString(record.capability_key) ?? undefined,
    panel_id: readString(record.panel_id) ?? undefined,
    action: readString(record.action) ?? undefined,
    status: normalizeStatus(record.status),
    user_requested: compactText(input.userRequested ?? record.user_requested ?? "", 320),
    found,
    proves: unique(supportRefs.map((ref) => `Observation is supported by ${ref}.`), cfg.observationMaxProves),
    support_refs: supportRefs,
    missing_or_uncertain: missing,
    suggested_next_steps: readStringArray(record.suggested_next_steps)
      .filter((entry): entry is HelixModelObservationPacket["suggested_next_steps"][number] =>
        entry === "answer" ||
        entry === "ask_user" ||
        entry === "use_another_tool" ||
        entry === "repair" ||
        entry === "fail_closed",
      )
      .slice(0, 5),
    raw_debug_ref: `${observationRef}:raw_debug`,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const compactDocsEvidenceArtifactForModel = (input: {
  turnId: string;
  artifact: unknown;
  userRequested?: string;
}): HelixModelObservationPacket | null => {
  const artifact = readRecord(input.artifact);
  const payload = readRecord(artifact?.payload) ?? artifact;
  if (!payload) return null;
  const cfg = config();
  const kind = readString(artifact?.kind) ?? readString(payload.kind) ?? "doc_location_matches";
  const observationRef =
    readString(artifact?.artifact_id) ??
    readString(payload.artifact_id) ??
    readString(payload.observation_id) ??
    `${input.turnId}:${kind}`;
  const matches = readArray(payload.matches).map(readRecord).filter(Boolean) as Record<string, unknown>[];
  const snippets = readArray(payload.snippets).map(readRecord).filter(Boolean) as Record<string, unknown>[];
  const locations = readArray(payload.locations).map(readRecord).filter(Boolean) as Record<string, unknown>[];
  const lineSpans = readArray(payload.line_spans).map(readRecord).filter(Boolean) as Record<string, unknown>[];
  const matchCount = Number(payload.match_count);
  const hasConcreteLocation =
    (Number.isFinite(matchCount) && matchCount > 0) ||
    matches.length > 0 ||
    snippets.length > 0 ||
    locations.length > 0 ||
    lineSpans.length > 0 ||
    readString(payload.status) === "located";
  const compactMatch = (record: Record<string, unknown>, fallback: string): string => {
    const path = readString(record.path) ?? readString(record.source_path);
    const line =
      readString(record.line) ??
      readString(record.line_number) ??
      readString(record.start_line) ??
      readString(record.line_start);
    const text =
      readString(record.snippet) ??
      readString(record.text) ??
      readString(record.excerpt) ??
      readString(record.raw_excerpt);
    return compactText([path, line ? `line ${line}` : null, text ?? fallback].filter(Boolean).join(" - "), 420);
  };
  const found = hasConcreteLocation
    ? [
        ...matches.map((entry, index) => compactMatch(entry, `Document match ${index + 1}`)),
        ...snippets.map((entry, index) => compactMatch(entry, `Document snippet ${index + 1}`)),
        ...locations.map((entry, index) => compactMatch(entry, `Document location ${index + 1}`)),
        ...lineSpans.map((entry, index) => compactMatch(entry, `Document line span ${index + 1}`)),
      ].filter(Boolean).slice(0, cfg.observationMaxFindings)
    : [
        compactText(
          `No document locations were found for ${readString(payload.query) ?? readString(payload.locate_query) ?? "the requested location"}.`,
          360,
        ),
      ];
  const supportRefs = unique([
    observationRef,
    readString(payload.source_ref),
    readString(payload.target_ref),
    readString(payload.path),
    readString(payload.source_path),
    ...readStringArray(payload.support_refs),
    ...readStringArray(payload.evidence_refs),
    ...matches.map((entry) => readString(entry.ref)),
    ...snippets.map((entry) => readString(entry.ref)),
    ...locations.map((entry) => readString(entry.ref)),
    ...lineSpans.map((entry) => readString(entry.ref)),
  ], 96);
  return {
    schema: HELIX_MODEL_OBSERVATION_PACKET_SCHEMA,
    turn_id: readString(payload.turn_id) ?? input.turnId,
    observation_ref: observationRef,
    source: "docs",
    source_target: "docs_viewer",
    capability_key: readString(payload.capability_key) ?? "docs-viewer.locate_in_doc",
    status: hasConcreteLocation ? "succeeded" : "failed",
    user_requested: compactText(input.userRequested ?? readString(payload.query) ?? readString(payload.locate_query) ?? "", 320),
    found,
    proves: hasConcreteLocation
      ? ["Document location evidence is available for final synthesis."]
      : ["The docs locate tool executed but returned no concrete matches."],
    support_refs: supportRefs,
    missing_or_uncertain: hasConcreteLocation
      ? []
      : ["No doc match, snippet, location, or line span was returned."],
    suggested_next_steps: hasConcreteLocation ? ["answer", "repair"] : ["repair", "use_another_tool", "fail_closed"],
    raw_debug_ref: `${observationRef}:raw_doc_location_payload`,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const compactCalculatorArtifactForModel = (input: {
  turnId: string;
  artifact: unknown;
  userRequested?: string;
}): HelixModelObservationPacket | null => {
  const artifact = readRecord(input.artifact);
  const payload = readRecord(artifact?.payload) ?? artifact;
  if (!payload) return null;
  const kind = readString(artifact?.kind) ?? readString(payload.kind) ?? "calculator_receipt";
  const observationRef =
    readString(artifact?.artifact_id) ??
    readString(payload.artifact_id) ??
    readString(payload.receipt_id) ??
    `${input.turnId}:${kind}`;
  const expression =
    readString(payload.expression) ??
    readString(payload.latex) ??
    readString(payload.equation) ??
    readString(readRecord(payload.calculator_setup)?.expression);
  const result =
    readString(payload.result_text) ??
    readString(payload.result) ??
    (typeof payload.result_value === "number" && Number.isFinite(payload.result_value) ? String(payload.result_value) : null) ??
    readString(payload.result_box_output);
  const status = readString(payload.status);
  const succeeded = Boolean(result) && !/^(?:failed|error|blocked|rejected)$/i.test(status ?? "");
  const supportRefs = unique([
    observationRef,
    readString(payload.receipt_id),
    readString(payload.evaluation_id),
    ...readStringArray(payload.support_refs),
    ...readStringArray(payload.evidence_refs),
  ], 96);
  return {
    schema: HELIX_MODEL_OBSERVATION_PACKET_SCHEMA,
    turn_id: readString(payload.turn_id) ?? input.turnId,
    observation_ref: observationRef,
    source: "tool",
    source_target: "calculator",
    capability_key: readString(payload.action_key) ?? readString(payload.trace_source) ?? "scientific-calculator.solve_expression",
    panel_id: readString(payload.panel_id) ?? "scientific-calculator",
    action: readString(payload.action_id) ?? "solve_expression",
    status: succeeded ? "succeeded" : "failed",
    user_requested: compactText(input.userRequested ?? expression ?? "", 320),
    found: [
      compactText(
        `Calculator evaluated${expression ? ` ${expression}` : ""}${result ? ` = ${result}` : ""}.`,
        360,
      ),
    ],
    proves: result
      ? [`Calculator result is ${result}${expression ? ` for ${expression}` : ""}.`]
      : ["Calculator receipt did not include a usable result."],
    support_refs: supportRefs,
    missing_or_uncertain: result ? [] : ["Calculator result text/value is missing."],
    suggested_next_steps: result ? ["answer"] : ["repair", "fail_closed"],
    raw_debug_ref: `${observationRef}:raw_calculator_payload`,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const compactRepoEvidenceArtifactForModel = (input: {
  turnId: string;
  artifact: unknown;
  userRequested?: string;
  requiresExactExcerpts?: boolean;
}): HelixModelObservationPacket | null => {
  const artifact = readRecord(input.artifact);
  const payload = readRecord(artifact?.payload) ?? artifact;
  if (!payload) return null;
  const cfg = config();
  const observations = readArray(payload.observations).map((entry) => readRecord(entry)).filter(Boolean) as Record<string, unknown>[];
  const spans = readArray(payload.spans).map((entry) => readRecord(entry)).filter(Boolean) as Record<string, unknown>[];
  const supportRefs = unique([
    readString(artifact?.artifact_id),
    ...readStringArray(payload.evidence_refs),
    ...observations.flatMap((entry) => readStringArray(entry.refs)),
    ...spans.map((entry) => readString(entry.ref)),
  ], 96);
  const matchedFiles = unique([
    ...observations.map((entry) => readString(entry.filePath)),
    ...spans.map((entry) => readString(entry.path)),
  ], cfg.observationMaxFindings);
  const found = matchedFiles.length
    ? matchedFiles.map((file) => `${file} matched the repo evidence query.`)
    : [compactText(`Repo evidence found for ${readString(payload.concept) ?? "the requested concept"}.`, 360)];
  const proves = observations
    .map((entry) => {
      const file = readString(entry.filePath) ?? readString(entry.source_id) ?? "repo evidence";
      const term = readString(entry.term) ?? readString(payload.concept) ?? "requested concept";
      return compactText(`${file} contributes implementation evidence for ${term}.`, 260);
    })
    .filter(Boolean)
    .slice(0, cfg.observationMaxProves);
  const exactExcerptRefs = input.requiresExactExcerpts
    ? spans.map((entry) => readString(entry.ref)).filter((entry): entry is string => Boolean(entry)).slice(0, 8)
    : undefined;
  return {
    schema: HELIX_MODEL_OBSERVATION_PACKET_SCHEMA,
    turn_id: readString(payload.turn_id) ?? input.turnId,
    observation_ref: readString(payload.artifact_id) ?? readString(artifact?.artifact_id) ?? `${input.turnId}:repo_code_evidence_observation`,
    source: "repo_code",
    source_target: "repo_code",
    capability_key: "repo-code.search_concept",
    status: readArray(payload.observations).length > 0 || readArray(payload.spans).length > 0 ? "succeeded" : "failed",
    user_requested: compactText(input.userRequested ?? readString(payload.query) ?? readString(payload.concept) ?? "", 320),
    found: found.slice(0, cfg.observationMaxFindings),
    proves: proves.length ? proves : ["Repo evidence is available for final synthesis."],
    support_refs: supportRefs,
    missing_or_uncertain: readArray(payload.observations).length || readArray(payload.spans).length
      ? []
      : ["No repo evidence observations were present in the artifact payload."],
    suggested_next_steps: ["answer", "repair"],
    raw_debug_ref: `${readString(payload.artifact_id) ?? readString(artifact?.artifact_id) ?? input.turnId}:raw_spans`,
    exact_excerpt_refs: exactExcerptRefs,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const compactScholarlyResearchArtifactForModel = (input: {
  turnId: string;
  artifact: unknown;
  userRequested?: string;
}): HelixModelObservationPacket | null => {
  const artifact = readRecord(input.artifact);
  const payload = readRecord(artifact?.payload) ?? artifact;
  if (!payload) return null;
  const cfg = config();
  const papers = readArray(payload.papers).map((entry) => readRecord(entry)).filter(Boolean) as Record<string, unknown>[];
  const evidenceRefs = readArray(payload.evidence_refs).map((entry) => readRecord(entry)).filter(Boolean) as Record<string, unknown>[];
  const supportRefs = unique([
    readString(artifact?.artifact_id),
    readString(payload.artifact_id),
    ...evidenceRefs.map((entry) => readString(entry.ref)),
    ...papers.flatMap((entry) => readStringArray(entry.evidence_refs)),
  ], 96);
  const found = papers.length
    ? papers.slice(0, cfg.observationMaxFindings).map((paper) => {
        const title = readString(paper.title) ?? "Untitled paper";
        const venue = readString(paper.venue);
        const year = typeof paper.year === "number" ? paper.year : null;
        return compactText([title, venue, year].filter(Boolean).join(" - "), 300);
      })
    : [compactText(`No scholarly paper records were returned for ${readString(payload.query) ?? "the requested query"}.`, 300)];
  const proves = papers.length
    ? papers.slice(0, cfg.observationMaxProves).map((paper) => {
        const title = readString(paper.title) ?? "paper";
        const citations = typeof paper.citation_count === "number" ? `${paper.citation_count} citation(s)` : null;
        const references = typeof paper.reference_count === "number" ? `${paper.reference_count} reference(s)` : null;
        const identifiers = readRecord(paper.identifiers);
        const doi = readString(identifiers?.doi);
        return compactText([title, doi ? `DOI ${doi}` : null, citations, references].filter(Boolean).join("; "), 300);
      })
    : [];
  return {
    schema: HELIX_MODEL_OBSERVATION_PACKET_SCHEMA,
    turn_id: readString(payload.turn_id) ?? input.turnId,
    observation_ref: readString(payload.artifact_id) ?? readString(artifact?.artifact_id) ?? `${input.turnId}:scholarly_research_observation`,
    source: "scholarly_research",
    source_target: "scholarly_research",
    capability_key: "scholarly-research.lookup_papers",
    status: papers.length > 0 ? "succeeded" : "failed",
    user_requested: compactText(input.userRequested ?? readString(payload.query) ?? "", 320),
    found,
    proves: proves.length ? proves : ["Scholarly research lookup completed, but no paper metadata was selected for synthesis."],
    support_refs: supportRefs,
    missing_or_uncertain: readStringArray(payload.missing_requirements),
    suggested_next_steps: papers.length ? ["answer", "repair"] : ["repair", "use_another_tool", "fail_closed"],
    raw_debug_ref: `${readString(payload.artifact_id) ?? readString(artifact?.artifact_id) ?? input.turnId}:raw_scholarly_payload`,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const compactScholarlyFullTextArtifactForModel = (input: {
  turnId: string;
  artifact: unknown;
  userRequested?: string;
}): HelixModelObservationPacket | null => {
  const artifact = readRecord(input.artifact);
  const payload = readRecord(artifact?.payload) ?? artifact;
  if (!payload) return null;
  const cfg = config();
  const savedPages = readArray(payload.selected_pages).map((entry: unknown) => readRecord(entry)).filter(Boolean) as Record<string, unknown>[];
  const chunks = [
    ...readArray(payload.selected_chunks).map((entry: unknown) => readRecord(entry)).filter(Boolean) as Record<string, unknown>[],
    ...savedPages.map((page) => ({
      page_start: page.page,
      page_end: page.page,
      text_excerpt: page.text_excerpt,
      first_nonblank_sentence: page.first_nonblank_sentence,
      last_nonblank_sentence: page.last_nonblank_sentence,
      source_text_ref: page.source_text_ref,
      citation_ref: page.source_text_ref,
      section_hint: "saved Research Library page",
    })),
  ];
  const pageRefs = [
    ...readArray(payload.page_text_refs).map((entry: unknown) => readRecord(entry)).filter(Boolean) as Record<string, unknown>[],
    ...savedPages.map((page) => ({ text_ref: page.source_text_ref, page: page.page })),
  ];
  const visualCandidates = readArray(payload.visual_candidates).map((entry: unknown) => readRecord(entry)).filter(Boolean) as Record<string, unknown>[];
  const searchTerm = readString(payload.search_term);
  const matchCount = Number(payload.match_count);
  const matchPages = readArray(payload.match_pages).filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry));
  const completedSavedSearch = Boolean(
    searchTerm && Number.isFinite(matchCount) && readString(payload.evidence_state) === "full_text_usable",
  );
  const observationRef = readString(payload.artifact_id) ?? readString(artifact?.artifact_id) ?? `${input.turnId}:scholarly_full_text_observation`;
  const supportRefs = unique([
    readString(artifact?.artifact_id),
    readString(payload.artifact_id),
    readString(payload.source_pdf_ref),
    ...pageRefs.map((entry: Record<string, unknown>) => readString(entry.text_ref)),
    ...chunks.flatMap((entry: Record<string, unknown>) => [readString(entry.source_text_ref), readString(entry.citation_ref)]),
  ], 128);
  const found = chunks.length
    ? [
        ...(completedSavedSearch
          ? [`Saved full-text scan for "${searchTerm}" found ${matchCount} match(es) on page(s): ${matchPages.length ? matchPages.join(", ") : "none"}.`]
          : []),
        ...chunks.flatMap((chunk: Record<string, unknown>) => {
          const page = typeof chunk.page_start === "number" ? `p. ${chunk.page_start}` : "page unknown";
          const first = readString(chunk.first_nonblank_sentence);
          const last = readString(chunk.last_nonblank_sentence);
          return [
            first ? `${page} exact first nonblank sentence: ${first}` : null,
            last ? `${page} exact last nonblank sentence: ${last}` : null,
          ].filter((entry): entry is string => Boolean(entry));
        }),
        ...chunks.slice(0, cfg.observationMaxFindings).map((chunk: Record<string, unknown>) => {
        const page = typeof chunk.page_start === "number" ? `p. ${chunk.page_start}` : "page unknown";
        const section = readString(chunk.section_hint);
        const excerpt = readString(chunk.text_excerpt) ?? "";
        return compactText([page, section, excerpt].filter(Boolean).join(" - "), 520);
      }),
      ].slice(0, cfg.observationMaxFindings)
    : [compactText(
        completedSavedSearch
          ? `Saved full-text scan for "${searchTerm}" found ${matchCount} matches; matching pages: ${matchPages.length ? matchPages.join(", ") : "none"}.`
          : `No full-text chunks were selected for ${readString(payload.title) ?? readString(payload.query) ?? "the requested paper"}.`,
        320,
      )];
  const proves = chunks.length
    ? chunks.slice(0, cfg.observationMaxProves).map((chunk: Record<string, unknown>) => {
        const page = typeof chunk.page_start === "number" ? `page ${chunk.page_start}` : "selected page";
        const ref = readString(chunk.citation_ref) ?? readString(chunk.source_text_ref) ?? "full-text evidence";
        return compactText(`${ref} provides selected full-text evidence from ${page}.`, 260);
      })
    : [];
  const visualUncertainty = visualCandidates.map((candidate: Record<string, unknown>) => {
    const page = typeof candidate.page === "number" ? `page ${candidate.page}` : "a page";
    const reason = readString(candidate.reason) ?? "visual pass may be needed";
    return `${page}: ${reason}`;
  });
  return {
    schema: HELIX_MODEL_OBSERVATION_PACKET_SCHEMA,
    turn_id: readString(payload.turn_id) ?? input.turnId,
    observation_ref: observationRef,
    source: "scholarly_research",
    source_target: "scholarly_research",
    capability_key: readString(payload.capability) ?? "scholarly-research.fetch_full_text",
    status: chunks.length > 0 || completedSavedSearch ? "succeeded" : "failed",
    user_requested: compactText(input.userRequested ?? readString(payload.query) ?? "", 320),
    found,
    proves: proves.length
      ? proves
      : completedSavedSearch
        ? [`The saved full-text scan completed with ${matchCount} match(es) across ${matchPages.length} page(s).`]
        : ["Full-text fetch completed, but no selected text chunks were available for synthesis."],
    support_refs: supportRefs,
    missing_or_uncertain: [
      ...readStringArray(payload.missing_requirements),
      ...visualUncertainty,
    ].slice(0, cfg.observationMaxFindings),
    suggested_next_steps: chunks.length || completedSavedSearch ? ["answer", "use_another_tool", "repair"] : ["repair", "use_another_tool", "fail_closed"],
    raw_debug_ref: `${observationRef}:raw_full_text_payload`,
    exact_excerpt_refs: chunks.map((entry: Record<string, unknown>) => readString(entry.source_text_ref)).filter((entry): entry is string => Boolean(entry)).slice(0, 8),
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const compactInternetSearchArtifactForModel = (input: {
  turnId: string;
  artifact: unknown;
  userRequested?: string;
}): HelixModelObservationPacket | null => {
  const artifact = readRecord(input.artifact);
  const payload = readRecord(artifact?.payload) ?? artifact;
  if (!payload) return null;
  const cfg = config();
  const results = readArray(payload.results).map((entry) => readRecord(entry)).filter(Boolean) as Record<string, unknown>[];
  const evidenceRefs = readArray(payload.evidence_refs).map((entry) => readRecord(entry)).filter(Boolean) as Record<string, unknown>[];
  const supportRefs = unique([
    readString(artifact?.artifact_id),
    readString(payload.artifact_id),
    ...evidenceRefs.map((entry) => readString(entry.ref)),
    ...results.flatMap((entry) => [
      readString(entry.result_id),
      readString(entry.url),
      ...readStringArray(entry.evidence_refs),
    ]),
  ], 96);
  const found = results.length
    ? results.slice(0, cfg.observationMaxFindings).map((result) => {
        const title = readString(result.title) ?? "Untitled web result";
        const url = readString(result.url);
        const snippet = readString(result.snippet) ?? readString(result.content_excerpt);
        return compactText([title, url, snippet].filter(Boolean).join(" - "), 420);
      })
    : [compactText(`No internet search results were returned for ${readString(payload.query) ?? "the requested query"}.`, 300)];
  const proves = results.length
    ? results.slice(0, cfg.observationMaxProves).map((result) => {
        const title = readString(result.title) ?? "web result";
        const url = readString(result.url) ?? "unknown URL";
        return compactText(`${title} is an external web source at ${url}.`, 260);
      })
    : [];
  return {
    schema: HELIX_MODEL_OBSERVATION_PACKET_SCHEMA,
    turn_id: readString(payload.turn_id) ?? input.turnId,
    observation_ref: readString(payload.artifact_id) ?? readString(artifact?.artifact_id) ?? `${input.turnId}:internet_search_observation`,
    source: "internet_search",
    source_target: "internet_search",
    capability_key: "internet-search.search_web",
    status: results.length > 0 ? "succeeded" : "failed",
    user_requested: compactText(input.userRequested ?? readString(payload.query) ?? "", 320),
    found,
    proves: proves.length ? proves : ["Internet search completed, but no web results were selected for synthesis."],
    support_refs: supportRefs,
    missing_or_uncertain: readStringArray(payload.missing_requirements),
    suggested_next_steps: results.length ? ["answer", "repair"] : ["repair", "use_another_tool", "fail_closed"],
    raw_debug_ref: `${readString(payload.artifact_id) ?? readString(artifact?.artifact_id) ?? input.turnId}:raw_internet_search_payload`,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
};

export const compactRouteOrTerminalContractForModel = (
  value: unknown,
  options: { includeForbidden?: boolean; failedValidation?: boolean } = {},
): Record<string, unknown> | null => {
  const record = readRecord(value);
  if (!record) return null;
  const includeForbidden =
    options.includeForbidden ||
    options.failedValidation ||
    String(process.env.HELIX_ASK_ROUTE_CONTRACT_COMPACT ?? "1").trim() === "0";
  const sourceTarget = readString(record.source_target) ?? readString(record.target_source) ?? readString(record.goal_kind);
  const allowedTerminalKinds = unique([
    ...readStringArray(record.allowed_terminal_artifact_kinds),
    ...readStringArray(record.allowed_terminal_products),
    ...readStringArray(record.required_terminal_kinds),
    ...readStringArray(record.acceptable_fallbacks),
  ], 24);
  const requiredArtifactRefs = unique([
    ...readStringArray(record.required_artifact_refs),
    ...readStringArray(record.required_evidence),
    ...readStringArray(record.required_actions),
  ], 24);
  return {
    source_target: sourceTarget ?? null,
    allowed_terminal_artifact_kinds: allowedTerminalKinds,
    required_artifact_refs: requiredArtifactRefs,
    precedence_reason:
      readString(record.precedence_reason) ??
      readString(record.precedenceReason) ??
      readString(record.reason) ??
      null,
    ...(readArray(record.side_artifact_kinds_allowed).length
      ? { side_artifact_kinds_allowed: readStringArray(record.side_artifact_kinds_allowed) }
      : {}),
    ...(includeForbidden
      ? { forbidden_terminal_kinds: readStringArray(record.forbidden_terminal_kinds).slice(0, 48) }
      : {}),
  };
};

export const compactToolSurfaceForModel = (
  surface: unknown,
  options: { includeInputSchema?: boolean } = {},
): Array<Record<string, unknown>> => {
  const entries = readArray(readRecord(surface)?.entries ?? surface);
  return entries
    .map((entry) => {
      const record = readRecord(entry);
      if (!record) return null;
      return {
        capability_key: readString(record.capability_key),
        display_name: readString(record.display_name),
        description: compactText(record.description, 260),
        runtime_shape: readString(record.runtime_shape),
        execution_target: readString(record.execution_target),
        source_requirements: readArray(record.source_requirements).slice(0, 6),
        safety_tags: readStringArray(record.safety_tags).slice(0, 10),
        expected_observation_schema: readString(record.expected_observation_schema),
        ...(options.includeInputSchema ? { input_schema: record.input_schema ?? null } : {}),
      };
    })
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .slice(0, 48);
};

export const buildHelixModelContextEconomyReport = (input: {
  sections: Partial<Record<HelixModelContextEconomySection, unknown>>;
  selectedObservationRefs?: string[];
  rawSpanRefsAvailable?: string[];
  exactExcerptRefsIncluded?: string[];
  droppedSections?: string[];
  sectionCharCaps?: Record<string, number>;
  rawDebugExcludedFromModelContext?: boolean;
}): HelixModelContextEconomyReport => {
  const estimates = Object.fromEntries(
    SECTION_KEYS.map((key) => [key, estimateTokens(input.sections[key] ?? "")]),
  ) as Record<HelixModelContextEconomySection, number>;
  return {
    schema: HELIX_MODEL_CONTEXT_ECONOMY_REPORT_SCHEMA,
    estimated_input_tokens_by_section: estimates,
    dropped_sections: unique(input.droppedSections ?? [], 64),
    selected_observation_refs: unique(input.selectedObservationRefs ?? [], 96),
    raw_debug_excluded_from_model_context: input.rawDebugExcludedFromModelContext ?? !config().rawDebugInModelContext,
    raw_span_refs_available: unique(input.rawSpanRefsAvailable ?? [], 96),
    exact_excerpt_refs_included: unique(input.exactExcerptRefsIncluded ?? [], 96),
    section_char_caps: input.sectionCharCaps ?? {
      commentary: config().commentaryMaxChars,
      exact_excerpt: config().exactExcerptMaxChars,
    },
  };
};

export const buildHelixModelPromptContext = (input: {
  turnId: string;
  userGoal: string;
  canonicalGoal?: unknown;
  terminalContract?: unknown;
  routeContract?: unknown;
  capabilitySurface?: unknown;
  selectedArtifacts?: unknown[];
  toolObservations?: unknown[];
  goalSatisfaction?: unknown;
  finalAnswerConstraints?: unknown;
  commentary?: unknown;
  requiresExactExcerpts?: boolean;
}): HelixModelPromptContext => {
  const cfg = config();
  const artifactPackets = (input.selectedArtifacts ?? [])
    .map((artifact) => {
      const record = readRecord(artifact);
      const payload = readRecord(record?.payload) ?? record;
      const kind = readString(record?.kind) ?? readString(payload?.kind) ?? readString(payload?.schema);
      if (/repo_code_evidence_observation/i.test(kind ?? "")) {
        return compactRepoEvidenceArtifactForModel({
          turnId: input.turnId,
          artifact,
          userRequested: input.userGoal,
          requiresExactExcerpts: input.requiresExactExcerpts,
        });
      }
      if (/scholarly_research_observation/i.test(kind ?? "")) {
        return compactScholarlyResearchArtifactForModel({
          turnId: input.turnId,
          artifact,
          userRequested: input.userGoal,
        });
      }
      if (/scholarly_full_text_observation|research_library_observation/i.test(kind ?? "")) {
        return compactScholarlyFullTextArtifactForModel({
          turnId: input.turnId,
          artifact,
          userRequested: input.userGoal,
        });
      }
      if (/internet_search_observation/i.test(kind ?? "")) {
        return compactInternetSearchArtifactForModel({
          turnId: input.turnId,
          artifact,
          userRequested: input.userGoal,
        });
      }
      if (/doc_location_result|doc_evidence_location|doc_location_matches|doc_equation_context/i.test(kind ?? "")) {
        return compactDocsEvidenceArtifactForModel({
          turnId: input.turnId,
          artifact,
          userRequested: input.userGoal,
        });
      }
      if (/calculator_receipt|calculator_subgoal_receipt|calculator_result_trace|workstation_tool_evaluation/i.test(kind ?? "")) {
        return compactCalculatorArtifactForModel({
          turnId: input.turnId,
          artifact,
          userRequested: input.userGoal,
        });
      }
      if (/agent_step_observation_packet|runtime_tool_observation|tool_observation/i.test(kind ?? "")) {
        return compactAgentStepObservationPacketForModel({
          turnId: input.turnId,
          observation: payload ?? artifact,
          userRequested: input.userGoal,
        });
      }
      return null;
    })
    .filter((entry): entry is HelixModelObservationPacket => Boolean(entry));
  const toolPackets = (input.toolObservations ?? [])
    .map((observation) => compactAgentStepObservationPacketForModel({
      turnId: input.turnId,
      observation,
      userRequested: input.userGoal,
      source: "tool",
    }))
    .filter((entry): entry is HelixModelObservationPacket => Boolean(entry));
  const compactObservations = [...artifactPackets, ...toolPackets]
    .filter((packet, index, arr) => arr.findIndex((entry) => entry.observation_ref === packet.observation_ref) === index)
    .slice(0, cfg.observationMaxPackets);
  const exactExcerpts = input.requiresExactExcerpts
    ? (input.selectedArtifacts ?? [])
        .flatMap((artifact: unknown) => {
          const record = readRecord(artifact);
          const payload = readRecord(record?.payload) ?? record;
          const spanExcerpts = readArray(payload?.spans).map((span: unknown) => {
            const spanRecord = readRecord(span);
            return {
              ref: readString(spanRecord?.ref),
              excerpt: compactText(
                readString(spanRecord?.sanitized_excerpt) ??
                  readString(spanRecord?.excerpt) ??
                  readString(spanRecord?.raw_excerpt) ??
                  "",
                cfg.exactExcerptMaxChars,
              ),
            };
          });
          const scholarlyChunkExcerpts = readArray(payload?.selected_chunks).map((chunk: unknown) => {
            const chunkRecord = readRecord(chunk);
            return {
              ref: readString(chunkRecord?.source_text_ref) ?? readString(chunkRecord?.citation_ref),
              excerpt: compactText(readString(chunkRecord?.text_excerpt) ?? "", cfg.exactExcerptMaxChars),
            };
          });
          return [...spanExcerpts, ...scholarlyChunkExcerpts];
        })
        .filter((entry: { ref: string | null; excerpt: string }) => entry.ref && entry.excerpt)
        .slice(0, 8)
    : [];
  const rawSpanRefsAvailable = (input.selectedArtifacts ?? []).flatMap((artifact: unknown) => {
    const record = readRecord(artifact);
    const payload = readRecord(record?.payload) ?? record;
    return [
      ...readArray(payload?.spans).map((span: unknown) => readString(readRecord(span)?.ref)),
      ...readArray(payload?.selected_chunks).map((chunk: unknown) => {
        const chunkRecord = readRecord(chunk);
        return readString(chunkRecord?.source_text_ref) ?? readString(chunkRecord?.citation_ref);
      }),
    ].filter((entry): entry is string => Boolean(entry));
  });
  const terminalContractCompact = compactRouteOrTerminalContractForModel(input.terminalContract);
  const routeContractCompact = compactRouteOrTerminalContractForModel(input.routeContract);
  const capabilitySurfaceCompact = compactToolSurfaceForModel(input.capabilitySurface);
  const commentary = compactText(input.commentary, cfg.commentaryMaxChars);
  const economyReport = buildHelixModelContextEconomyReport({
    sections: {
      user_goal: input.userGoal,
      canonical_goal: input.canonicalGoal,
      capability_surface_compact: capabilitySurfaceCompact,
      route_contract_compact: routeContractCompact,
      terminal_contract_compact: terminalContractCompact,
      compact_observations: compactObservations,
      exact_excerpts: exactExcerpts,
      goal_satisfaction: input.goalSatisfaction,
      final_answer_constraints: input.finalAnswerConstraints,
      commentary,
      debug_excluded: "raw debug excluded from model context",
      raw_spans_excluded: rawSpanRefsAvailable,
      receipts_excluded: "receipt JSON excluded; receipt refs retained in support_refs",
    },
    selectedObservationRefs: compactObservations.map((packet) => packet.observation_ref),
    rawSpanRefsAvailable,
    exactExcerptRefsIncluded: exactExcerpts.map((entry) => String(entry.ref)),
    droppedSections: [
      "raw_debug_snapshots",
      "raw_receipt_json",
      "raw_selected_artifact_payloads",
      ...(input.requiresExactExcerpts ? [] : ["exact_excerpts"]),
    ],
    rawDebugExcludedFromModelContext: !cfg.rawDebugInModelContext,
    sectionCharCaps: {
      commentary: cfg.commentaryMaxChars,
      exact_excerpt: cfg.exactExcerptMaxChars,
      model_observation_packets: cfg.observationMaxPackets,
      model_observation_findings: cfg.observationMaxFindings,
      model_observation_proves: cfg.observationMaxProves,
    },
  });
  return {
    compact_observations: compactObservations,
    terminal_contract_compact: terminalContractCompact,
    route_contract_compact: routeContractCompact,
    capability_surface_compact: capabilitySurfaceCompact,
    exact_excerpts: exactExcerpts,
    economy_report: economyReport,
  };
};
