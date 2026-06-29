import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { buildHelixGoalSatisfactionEvaluationArtifact } from "./goal-satisfaction-artifact";
import {
  buildAskTurnCompositeFollowupAudit,
  buildAskTurnCompositeHandoffDecision,
  type HelixAskCompositeSubgoalReferenceIntent,
} from "./composite-followup-helpers";
import {
  buildStagePlayAskCheckpointReceiptPayload,
  type StagePlayCheckpointReceiptArtifactLike,
} from "./live-source/stage-play-checkpoint-receipt";
import {
  HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
  executeWorkspaceDirectoryResolveTool,
} from "./workspace-directory-resolver";
import { STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA } from "../../../shared/contracts/stage-play-live-source-mail.v1";

type RecordLike = Record<string, unknown>;

export const HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA = "helix.ask_golden_path_runtime.v1";
export const HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG = "HELIX_ASK_GOLDEN_PATH_RUNTIME";
export const HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY =
  "helix_ask.inspect_capability_catalog" as const;
export const HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY =
  "scientific-calculator.solve_expression" as const;
export const HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY = "docs-viewer.locate_in_doc" as const;
export const HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY = "repo-code.search_concept" as const;
export const HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY = "workspace_os.status" as const;
export const HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY =
  "live_env.read_processed_live_source_mail" as const;

export type HelixAskGoldenPathRuntimeTerminalResult = {
  schema: "helix.ask_golden_path_terminal_result.v1";
  result_id: string;
  artifact_id: string;
  artifact_kind:
    | "golden_path_contract_answer"
    | "capability_help_summary"
    | "doc_location_matches"
    | "repo_code_evidence_answer"
    | "workstation_tool_evaluation"
    | "workspace_directory_resolution"
    | "workspace_status_answer"
    | "model_synthesized_answer"
    | "typed_failure"
    | "compound_evidence_synthesis_answer";
  final_answer_source:
    | "helix_ask_golden_path_runtime"
    | "capability_help_summary"
    | "doc_location_matches"
    | "repo_code_evidence_answer"
    | "workstation_tool_evaluation"
    | "workspace_directory_resolution"
    | "workspace_status_answer"
    | "model_synthesized_answer"
    | "typed_failure"
    | "compound_evidence_synthesis_answer";
  text: string;
  support_refs: string[];
  terminal_authority_ok: true;
  route_authority_ok: true;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixAskGoldenPathRuntimeDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
  buildCompositeHandoffDecision: typeof buildAskTurnCompositeHandoffDecision;
  buildCompositeFollowupAudit: typeof buildAskTurnCompositeFollowupAudit;
  buildStagePlayCheckpointReceiptPayload: typeof buildStagePlayAskCheckpointReceiptPayload;
};

export type HelixAskGoldenPathRuntimeDecision =
  | { handled: false; reason: "flag_disabled" | "not_requested" }
  | { handled: true; payload: RecordLike };

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => readString(item)).filter((item): item is string => Boolean(item));
};

const flagEnabled = (value: unknown): boolean => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "enabled";
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as RecordLike;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
};

const defaultHashGoalFrame = (value: unknown): string => {
  let hash = 0x811c9dc5;
  const text = stableStringify(value);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `golden_path:${hash.toString(16).padStart(8, "0")}`;
};

export const createHelixAskGoldenPathRuntimeDependencies = (
  overrides: Partial<HelixAskGoldenPathRuntimeDependencies> = {},
): HelixAskGoldenPathRuntimeDependencies => ({
  now: () => new Date(),
  hashGoalFrame: defaultHashGoalFrame,
  buildGoalSatisfactionEvaluationArtifact: buildHelixGoalSatisfactionEvaluationArtifact,
  buildCompositeHandoffDecision: buildAskTurnCompositeHandoffDecision,
  buildCompositeFollowupAudit: buildAskTurnCompositeFollowupAudit,
  buildStagePlayCheckpointReceiptPayload: buildStagePlayAskCheckpointReceiptPayload,
  ...overrides,
});

export const isHelixAskGoldenPathRuntimeEnabled = (
  env: Record<string, string | undefined> = process.env,
): boolean => flagEnabled(env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG]);

export const readHelixAskGoldenPathPrompt = (body: RecordLike): string => {
  return (
    readString(body.prompt) ??
    readString(body.question) ??
    readString(body.transcript) ??
    readString(body.raw_user_prompt) ??
    ""
  );
};

export const isHelixAskGoldenPathRequested = (body: RecordLike): boolean => {
  if (readBoolean(body.goldenPathRuntime) === true) return true;
  if (readBoolean(body.golden_path_runtime) === true) return true;
  if (readBoolean(body.helixAskGoldenPathRuntime) === true) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return prompt.includes("helix_ask_golden_path_runtime") || prompt.includes("helix ask golden path runtime");
};

const isHelixAskGoldenPathCatalogWorkspaceCompoundRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  const hasCatalog = requestedCapabilities.includes(HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY);
  const hasWorkspace = requestedCapabilities.includes(HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY);
  if (hasCatalog && hasWorkspace) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY) &&
    prompt.includes(HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY)
  );
};

const isHelixAskGoldenPathCapabilityCatalogRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY)) return true;
  const requestedCapability = readString(body.requested_capability ?? body.requestedCapability);
  if (requestedCapability === HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return prompt.includes(HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY);
};

const isHelixAskGoldenPathWorkspaceStatusRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY)) return true;
  const requestedCapability = readString(body.requested_capability ?? body.requestedCapability);
  if (requestedCapability === HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return prompt.includes(HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY);
};

const isHelixAskGoldenPathWorkspaceDirectoryRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY) ||
    /\bworkspace[_\s-]?directory(?:[_\s-]?resolve|[_\s-]?resolution)?\b/.test(prompt)
  );
};

const readWorkspaceDirectoryQuery = (body: RecordLike): string | null => {
  const direct =
    readString(body.workspace_directory_query) ??
    readString(body.workspaceDirectoryQuery) ??
    readString(body.query) ??
    readString(body.uri) ??
    readString(body.path) ??
    readString(body.target);
  if (direct) return direct;
  const prompt = readHelixAskGoldenPathPrompt(body);
  const afterCapability = prompt.match(/workspace-directory\.resolve(?:\s+for|\s+query|\s*:)?\s*([^\n\r]+)/i);
  if (afterCapability?.[1]) return afterCapability[1].trim();
  const docPathMatch = prompt.match(/\bdocs\/[^\s"'`<>]+/i);
  if (docPathMatch?.[0]) return docPathMatch[0].replace(/[),.;:!?]+$/g, "");
  const forMatch = prompt.match(/\b(?:for|resolve|locate|find)\s+([A-Za-z0-9._/\\:-]{4,})/i);
  return forMatch?.[1]?.replace(/[),.;:!?]+$/g, "") ?? null;
};

const isHelixAskGoldenPathProcessedLiveSourceMailRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY) ||
    /\bread[_\s-]?processed[_\s-]?live[_\s-]?source[_\s-]?mail\b/.test(prompt) ||
    /\bprocessed\s+live[-\s]?source\s+mail\b/.test(prompt)
  );
};

const readProcessedMailPacketInput = (body: RecordLike): RecordLike | null =>
  readRecord(body.processed_mail_packet) ??
  readRecord(body.processedMailPacket) ??
  readRecord(body.stage_play_processed_mail_packet) ??
  readRecord(body.stagePlayProcessedMailPacket) ??
  null;

const readProcessedMailPacketStringArray = (packet: RecordLike, camelKey: string, snakeKey: string): string[] =>
  readStringArray(packet[camelKey] ?? packet[snakeKey]);

const buildProcessedMailPacketPayload = (args: {
  body: RecordLike;
  turnId: string;
  createdAtMs: number;
}): RecordLike | null => {
  const input = readProcessedMailPacketInput(args.body);
  if (!input) return null;
  const packetId =
    readString(input.packetId) ??
    readString(input.packet_id) ??
    readString(input.artifactId) ??
    readString(input.artifact_id) ??
    `${args.turnId}:stage_play_processed_mail_packet`;
  const evidenceRefs = readProcessedMailPacketStringArray(input, "evidenceRefs", "evidence_refs");
  return {
    artifactId: "stage_play_processed_mail_packet",
    schemaVersion: STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA,
    packetId,
    jobId: readString(input.jobId) ?? readString(input.job_id) ?? `${args.turnId}:live_source_job`,
    sourceId: readString(input.sourceId) ?? readString(input.source_id) ?? "golden_path_compact_mail_source",
    mailIds: readProcessedMailPacketStringArray(input, "mailIds", "mail_ids"),
    observedFacts: readProcessedMailPacketStringArray(input, "observedFacts", "observed_facts"),
    inferredFacts: readProcessedMailPacketStringArray(input, "inferredFacts", "inferred_facts"),
    uncertainties: readProcessedMailPacketStringArray(input, "uncertainties", "uncertainties"),
    sceneTags: readProcessedMailPacketStringArray(input, "sceneTags", "scene_tags"),
    visualEvidenceRefs: readProcessedMailPacketStringArray(input, "visualEvidenceRefs", "visual_evidence_refs"),
    recommendedNext: readString(input.recommendedNext) ?? readString(input.recommended_next) ?? "inspect_if_needed",
    watchNext: readProcessedMailPacketStringArray(input, "watchNext", "watch_next"),
    resolutionState: readString(input.resolutionState) ?? readString(input.resolution_state) ?? "processed",
    microReasonerRunRefs: readProcessedMailPacketStringArray(input, "microReasonerRunRefs", "micro_reasoner_run_refs"),
    evidenceRefs: evidenceRefs.length ? evidenceRefs : [packetId],
    createdAt: readString(input.createdAt) ?? new Date(args.createdAtMs).toISOString(),
    assistant_answer: false,
    terminal_eligible: false,
  };
};

const isHelixAskGoldenPathCalculatorSolveRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY) ||
    /\b(?:scientific\s+calculator|calculator)\b[\s\S]{0,120}\b(?:solve|evaluate|calculate|compute)\b/.test(prompt) ||
    /\b(?:solve|evaluate|calculate|compute)\b[\s\S]{0,120}\b(?:scientific\s+calculator|calculator)\b/.test(prompt)
  );
};

const isHelixAskGoldenPathDocsLocateRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY) ||
    /\b(?:locate|find|cite|check)\b[\s\S]{0,120}\b(?:doc|document|white\s*paper|paper)\b/.test(prompt) ||
    /\b(?:doc|document|white\s*paper|paper)\b[\s\S]{0,120}\b(?:locate|find|cite|check)\b/.test(prompt)
  );
};

const isHelixAskGoldenPathRepoSearchConceptRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY) ||
    /\b(?:repo|codebase|source\s+code)\b[\s\S]{0,120}\b(?:search|find|where|concept|evidence)\b/.test(prompt) ||
    /\b(?:search|find|where)\b[\s\S]{0,120}\b(?:repo|codebase|source\s+code)\b/.test(prompt)
  );
};

const readRepoSearchConcept = (body: RecordLike): string | null => {
  const direct =
    readString(body.concept) ??
    readString(body.query) ??
    readString(body.search_concept) ??
    readString(body.searchConcept);
  if (direct) return direct;
  const prompt = readHelixAskGoldenPathPrompt(body);
  const afterCapability = prompt.match(/repo-code\.search_concept(?:\s+for|\s+query|\s*:)?\s*([^\n\r]+)/i);
  if (afterCapability?.[1]) return afterCapability[1].trim();
  const cleaned = prompt
    .replace(/helix_ask_golden_path_runtime/gi, "")
    .replace(/repo-code\.search_concept/gi, "")
    .replace(/\b(?:use|run|call|search|find|where|repo|codebase|source\s+code|concept|evidence|for|the)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
};

const repoSearchTerms = (concept: string): string[] =>
  Array.from(
    new Set(
      concept
        .split(/[^a-zA-Z0-9_.-]+/g)
        .map((term) => term.trim())
        .filter((term) => term.length > 2),
    ),
  );

type GoldenPathRepoSearchFile = { path: string; content: string };

const readRepoSearchFixtureFiles = (body: RecordLike): GoldenPathRepoSearchFile[] => {
  const value = body.repo_files ?? body.repoFiles;
  if (!Array.isArray(value)) return [];
  return value
    .map((entry): GoldenPathRepoSearchFile | null => {
      const record = readRecord(entry);
      if (!record) return null;
      const filePath = readString(record.path) ?? readString(record.filePath) ?? readString(record.file_path);
      const content = readString(record.content) ?? readString(record.text);
      return filePath && content ? { path: filePath.replace(/\\/g, "/"), content } : null;
    })
    .filter((entry): entry is GoldenPathRepoSearchFile => Boolean(entry))
    .slice(0, 40);
};

const GOLDEN_PATH_REPO_TEXT_FILE_RE =
  /\.(?:ts|tsx|js|jsx|mjs|cjs|mts|cts|md|mdx|json|jsonc|py|txt|css|scss|html|yml|yaml)$/i;

const enumerateGoldenPathRepoFilesFromGit = (): string[] => {
  try {
    return execFileSync("git", ["ls-files"], {
      cwd: process.cwd(),
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    })
      .split(/\r?\n/g)
      .map((entry) => entry.trim().replace(/\\/g, "/"))
      .filter((entry) => GOLDEN_PATH_REPO_TEXT_FILE_RE.test(entry))
      .filter((entry) => !/(^|\/)(?:node_modules|dist|build|coverage|\.git)(\/|$)/i.test(entry))
      .slice(0, 600);
  } catch {
    return [];
  }
};

const enumerateGoldenPathRepoFilesFromFs = (): string[] => {
  const out: string[] = [];
  const walk = (relativeDir: string): void => {
    if (out.length >= 600) return;
    const absoluteDir = path.resolve(process.cwd(), relativeDir);
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(absoluteDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (out.length >= 600) return;
      if (/^(?:node_modules|dist|build|coverage|\.git)$/i.test(entry.name)) continue;
      const relativePath = path.join(relativeDir, entry.name).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        walk(relativePath);
      } else if (entry.isFile() && GOLDEN_PATH_REPO_TEXT_FILE_RE.test(relativePath)) {
        out.push(relativePath);
      }
    }
  };
  walk("");
  return out;
};

const readGoldenPathRepoSearchFiles = (body: RecordLike): GoldenPathRepoSearchFile[] => {
  const fixtures = readRepoSearchFixtureFiles(body);
  if (fixtures.length > 0) return fixtures;
  const repoRoot = process.cwd();
  const selectedFiles = enumerateGoldenPathRepoFilesFromGit();
  const out: GoldenPathRepoSearchFile[] = [];
  for (const relativePath of selectedFiles.length > 0 ? selectedFiles : enumerateGoldenPathRepoFilesFromFs()) {
    const absolutePath = path.resolve(repoRoot, relativePath);
    const relative = path.relative(repoRoot, absolutePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
    try {
      const stat = statSync(absolutePath);
      if (!stat.isFile() || stat.size > 750_000) continue;
      out.push({ path: relativePath, content: readFileSync(absolutePath, "utf8") });
    } catch {
      // Ignore unreadable files; repo search should fail closed if no evidence is found.
    }
    if (out.length >= 120) break;
  }
  return out;
};

const findGoldenPathRepoEvidence = (args: {
  files: GoldenPathRepoSearchFile[];
  concept: string;
}): Array<{ file_path: string; line: number; snippet: string; matched_terms: string[] }> => {
  const terms = repoSearchTerms(args.concept);
  if (terms.length === 0) return [];
  const matches: Array<{ file_path: string; line: number; snippet: string; matched_terms: string[]; score: number }> = [];
  for (const file of args.files) {
    const lines = file.content.split(/\r?\n/g);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      const normalizedLine = line.toLowerCase();
      const matchedTerms = terms.filter((term) => normalizedLine.includes(term.toLowerCase()));
      if (matchedTerms.length === 0) continue;
      matches.push({
        file_path: file.path,
        line: index + 1,
        snippet: line.trim().slice(0, 240),
        matched_terms: matchedTerms,
        score: matchedTerms.length,
      });
    }
  }
  return matches
    .sort((left, right) => right.score - left.score || left.file_path.localeCompare(right.file_path) || left.line - right.line)
    .slice(0, 8)
    .map(({ score: _score, ...match }) => match);
};

const readGoldenPathDocPath = (body: RecordLike): string | null => {
  const direct =
    readString(body.doc_path) ??
    readString(body.docPath) ??
    readString(body.active_doc_path) ??
    readString(body.activeDocPath);
  if (direct) return direct.replace(/\\/g, "/").replace(/[),.;:!?]+$/g, "");
  const prompt = readHelixAskGoldenPathPrompt(body);
  const match = prompt.match(/\bdocs\/[^\s"'`<>]+/i);
  return match?.[0] ? match[0].replace(/[),.;:!?]+$/g, "") : null;
};

const readGoldenPathDocContent = (body: RecordLike): string | null => {
  return (
    readString(body.doc_content) ??
    readString(body.docContent) ??
    readString(body.document_content) ??
    readString(body.documentContent) ??
    readString(body.active_doc_content) ??
    readString(body.activeDocContent)
  );
};

const readGoldenPathDocLocateQuery = (body: RecordLike): string | null => {
  const direct =
    readString(body.query) ??
    readString(body.search_query) ??
    readString(body.searchQuery) ??
    readString(body.locate_query) ??
    readString(body.locateQuery);
  if (direct) return direct;
  const prompt = readHelixAskGoldenPathPrompt(body);
  const quoted = prompt.match(/["“]([^"”]{3,160})["”]/);
  if (quoted?.[1]) return quoted[1].trim();
  const afterCapability = prompt.match(/docs-viewer\.locate_in_doc(?:\s+for|\s+query|\s*:)?\s*([^\n\r]+)/i);
  if (afterCapability?.[1]) return afterCapability[1].replace(/\bdocs\/[^\s"'`<>]+/gi, "").trim();
  return (
    prompt
      .replace(/helix_ask_golden_path_runtime/gi, "")
      .replace(/docs-viewer\.locate_in_doc/gi, "")
      .replace(/\bdocs\/[^\s"'`<>]+/gi, "")
      .replace(/\b(?:check|locate|find|cite|in|the|white\s*paper|document|doc|paper|for|use)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim() || null
  );
};

const findGoldenPathDocLocationMatches = (args: {
  content: string;
  query: string;
  docPath: string | null;
}): Array<{ line: number; snippet: string; doc_path: string | null; score: number }> => {
  const queryTokens = Array.from(
    new Set(
      args.query
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length > 2),
    ),
  );
  if (queryTokens.length === 0) return [];
  return args.content
    .split(/\r?\n/)
    .map((line, index) => {
      const normalizedLine = line.toLowerCase();
      const hits = queryTokens.filter((token) => normalizedLine.includes(token)).length;
      return {
        line: index + 1,
        snippet: line.trim(),
        doc_path: args.docPath,
        score: hits,
      };
    })
    .filter((match) => match.snippet && match.score >= Math.min(2, queryTokens.length))
    .sort((left, right) => right.score - left.score || left.line - right.line)
    .slice(0, 5);
};

const normalizeCalculatorExpression = (value: string): string =>
  value.trim().replace(/[;,.!?]+$/g, "").replace(/\s+/g, " ");

const readCalculatorExpression = (body: RecordLike): string | null => {
  const direct =
    readString(body.calculator_expression) ??
    readString(body.calculatorExpression) ??
    readString(body.expression) ??
    readString(body.solve_expression) ??
    readString(body.solveExpression);
  if (direct) return normalizeCalculatorExpression(direct);
  const prompt = readHelixAskGoldenPathPrompt(body);
  const exactMatch = prompt.match(/\b(?:exact\s+)?expression\s*:\s*([^\n\r]+)/i);
  if (exactMatch?.[1]) return normalizeCalculatorExpression(exactMatch[1]);
  const capabilityMatch = prompt.match(
    /scientific-calculator\.solve_expression(?:\s+with)?(?:\s+this\s+exact\s+expression)?\s*:?\s*([^\n\r]+)/i,
  );
  if (capabilityMatch?.[1]) return normalizeCalculatorExpression(capabilityMatch[1]);
  const compactMath = prompt.match(/((?:sqrt|ln|log|sin|cos|tan|pi|e|\d|\(|\)|\+|\-|\*|\/|\^|\s|\.){3,})/i);
  return compactMath?.[1] ? normalizeCalculatorExpression(compactMath[1]) : null;
};

const evaluateGoldenPathCalculatorExpression = (expression: string): number | null => {
  const normalized = expression
    .replace(/\^/g, "**")
    .replace(/\blog\s*\(/gi, "Math.log10(")
    .replace(/\bln\s*\(/gi, "Math.log(")
    .replace(/\bsqrt\s*\(/gi, "Math.sqrt(")
    .replace(/\bsin\s*\(/gi, "Math.sin(")
    .replace(/\bcos\s*\(/gi, "Math.cos(")
    .replace(/\btan\s*\(/gi, "Math.tan(")
    .replace(/\bpi\b/gi, "Math.PI")
    .replace(/\be\b/g, "Math.E");
  if (!/^[0-9eE+\-*/().,\sMathlogsqrtincotaPIE]+$/.test(normalized)) return null;
  try {
    const value = Function(`"use strict"; return (${normalized});`)() as unknown;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

const formatGoldenPathNumber = (value: number): string => {
  if (Number.isInteger(value)) return String(value);
  const rounded = Number(value.toPrecision(12));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const buildGoldenPathCapabilityCatalogObservation = (): RecordLike => ({
  schema: "helix.capability_registry.v1",
  capability_key: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  available_capabilities: [
    HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
    HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  ],
  assistant_answer: false,
  raw_content_included: false,
});

const capabilityCatalogSummaryText = (observation: RecordLike): string => {
  const capabilities = readStringArray(observation.available_capabilities);
  const capabilityList = capabilities.length ? capabilities.join(", ") : "no capabilities reported";
  return `Capability catalog inspection completed. Available golden-path capabilities: ${capabilityList}.`;
};

const workspaceStatusSummaryText = (observation: RecordLike): string => {
  const counts = readRecord(observation.capability_counts) ?? {};
  return `Workspace OS status completed: ${readNumber(counts.total) ?? 0} total, ${readNumber(counts.available) ?? 0} available, ${readNumber(counts.degraded) ?? 0} degraded, ${readNumber(counts.blocked) ?? 0} blocked, ${readNumber(counts.error) ?? 0} error, ${readNumber(counts.unknown) ?? 0} unknown.`;
};

const buildGoldenPathWorkspaceStatusObservation = (args: {
  body: RecordLike;
  turnId: string;
  createdAtMs: number;
}): RecordLike => {
  const statusRecord = readRecord(args.body.workspace_os_status) ?? readRecord(args.body.workspaceOsStatus) ?? {};
  const countsRecord = readRecord(statusRecord.counts) ?? readRecord(statusRecord.capability_counts) ?? {};
  const total = readNumber(countsRecord.total) ?? 0;
  const available = readNumber(countsRecord.available) ?? 0;
  const degraded = readNumber(countsRecord.degraded) ?? 0;
  const blocked = readNumber(countsRecord.blocked) ?? 0;
  const error = readNumber(countsRecord.error) ?? 0;
  const unknown = readNumber(countsRecord.unknown) ?? Math.max(0, total - available - degraded - blocked - error);
  return {
    schema: "helix.workspace_os_status_observation.v1",
    artifact_id: `${args.turnId}:workspace_os_status_observation`,
    created_at_ms: args.createdAtMs,
    capability_key: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
    status: readString(statusRecord.status) ?? "available",
    capability_counts: {
      total,
      available,
      degraded,
      blocked,
      error,
      unknown,
    },
    assistant_answer: false,
    raw_content_included: false,
  };
};

const buildGoldenPathCompositeDebug = (args: {
  deps: HelixAskGoldenPathRuntimeDependencies;
  turnId: string;
}): { decision: RecordLike; audit: RecordLike } => {
  const intent: HelixAskCompositeSubgoalReferenceIntent = {
    required: false,
    reference_kind: "that_result",
    requested_action: "inspect_debug",
    matched_phrases: [],
    confidence: "low",
  };
  const binding = {
    current_turn_id: args.turnId,
    prior_composite_turn_id: null,
    prior_composite_receipt_id: null,
    selected_subgoal_ids: [],
    candidate_subgoals: [],
    rejected_subgoals: [],
    binding_status: "no_usable_subgoal",
    non_authoritative_debug_probe: true,
  };
  const decision = args.deps.buildCompositeHandoffDecision({ turnId: args.turnId, binding, intent });
  const audit = args.deps.buildCompositeFollowupAudit({ priorEnvelope: null, binding, handoffDecision: decision });
  return { decision, audit };
};

export const buildHelixAskGoldenPathRuntimePayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-path:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const modelPacketRef = `${turnId}:golden_path_model_turn_packet`;
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const artifactId = `${turnId}:golden_path_contract_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const answerText =
    "Helix Ask golden path runtime returned a contract-only final answer. This scaffold verifies routing, ledger, and terminal-source invariants without entering a private runtime loop.";

  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "golden_path_runtime_contract",
    answer_scope: "current_turn",
    required_terminal_kind: "golden_path_contract_answer",
    allows_workspace_context: false,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_golden_path_runtime_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "golden_path_runtime_contract",
    required_terminal_kind: "golden_path_contract_answer",
    selected_terminal_artifact_kind: "golden_path_contract_answer",
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const compositeDebug = buildGoldenPathCompositeDebug({ deps, turnId });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: artifactId,
    artifact_kind: "golden_path_contract_answer",
    final_answer_source: "helix_ask_golden_path_runtime",
    text: answerText,
    support_refs: [routeGateArtifactId, modelPacketRef, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const stagePlayCheckpointReceiptPayload = deps.buildStagePlayCheckpointReceiptPayload({
    payload: {
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1" },
      final_answer_source: terminalResult.final_answer_source,
      terminal_artifact_kind: terminalResult.artifact_kind,
      thread_id: threadId,
      session_id: sessionId,
    },
    turnId,
    artifacts: [] as StagePlayCheckpointReceiptArtifactLike[],
    finalAnswerDraft: { text: answerText, authority: "golden_path_contract" },
    finalAnswerDraftRef: artifactId,
    createdAt: now.toISOString(),
  });

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "contract_only",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      model_turn_packet_ref: modelPacketRef,
      route_gate_artifact_ref: routeGateArtifactId,
      terminal_artifact_ref: artifactId,
      terminal_result_id: terminalResultId,
      terminal_result_count: 1,
      reused_extracted_helpers: ["S275", "S276", "S277"],
      assistant_answer: false,
      raw_content_included: false,
    },
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    canonical_goal_frame: canonicalGoalFrame,
    route_reason_code: "golden_path_runtime / contract_only",
    route: "golden_path_runtime / contract_only",
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    model_turn_packet: {
      schema: "helix.model_turn_packet.v1",
      packet_ref: modelPacketRef,
      turn_id: turnId,
      prompt_text: promptText,
      available_capabilities: [],
      model_visible_artifacts: [goalSatisfactionArtifact.artifact_id],
      loop_policy: {
        max_model_steps: 1,
        allow_tools: false,
        require_model_authored_terminal: false,
        deterministic_fallback_terminal_allowed: false,
      },
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / contract_only",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          model_turn_packet_ref: modelPacketRef,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          reused_extracted_helpers: ["S275", "S276", "S277"],
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: artifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_contract_answer",
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_contract_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    stage_play_checkpoint_receipt_payload: stagePlayCheckpointReceiptPayload,
    composite_handoff_decision: { ...compositeDebug.decision, non_authoritative_debug_probe: true },
    composite_followup_anti_determinism_audit: { ...compositeDebug.audit, non_authoritative_debug_probe: true },
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "contract_only",
      private_runtime_loop_entered: false,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      composite_handoff_decision: compositeDebug.decision,
      composite_followup_anti_determinism_audit: compositeDebug.audit,
      stage_play_checkpoint_receipt_payload: stagePlayCheckpointReceiptPayload,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathCapabilityCatalogPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-capability-catalog:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:capability_registry`;
  const terminalArtifactId = `${turnId}:capability_help_summary`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "capability_help_summary";
  const catalogObservation = buildGoldenPathCapabilityCatalogObservation();
  const answerText = capabilityCatalogSummaryText(catalogObservation);
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "capability_catalog_runtime",
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: false,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_capability_catalog_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "capability_catalog_runtime",
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "capability_catalog",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      observed_artifact_kind: "capability_registry",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    capability_registry: catalogObservation,
    capability_help_summary: {
      schema: "helix.capability_help_summary.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      source_target: "capability_catalog",
      family: "capability_catalog",
      required_observation_kinds: ["capability_registry"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / capability_catalog",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      observed_artifact_kind: "capability_registry",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "capability_registry",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: catalogObservation,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.capability_help_summary.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "capability_catalog",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
      observed_artifact_kind: "capability_registry",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathWorkspaceStatusPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-workspace-status:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const workspaceObservation = buildGoldenPathWorkspaceStatusObservation({ body: args.body, turnId, createdAtMs });
  const observationArtifactId = readString(workspaceObservation.artifact_id) ?? `${turnId}:workspace_os_status_observation`;
  const terminalArtifactId = `${turnId}:workspace_status_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "workspace_status_answer";
  const answerText = workspaceStatusSummaryText(workspaceObservation);
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "workspace_status_diagnostic",
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_workspace_status_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "workspace_status_diagnostic",
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "workspace_status",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      observed_artifact_kind: "workspace_os_status_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    workspace_os_status_observation: workspaceObservation,
    workspace_status_answer: {
      schema: "helix.workspace_status_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      source_target: "workspace_os",
      family: "workspace_status",
      required_observation_kinds: ["workspace_os_status_observation"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / workspace_status",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      observed_artifact_kind: "workspace_os_status_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "workspace_os_status_observation",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: workspaceObservation,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.workspace_status_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "workspace_status",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
      observed_artifact_kind: "workspace_os_status_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathCalculatorSolvePayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-calculator:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "workstation_tool_evaluation";
  const goalKind = "calculator_solve";

  const makeFailurePayload = (params: {
    errorCode: "missing_calculator_expression" | "invalid_calculator_expression";
    brokenRail: "argument_extraction" | "capability_execution";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const terminalArtifactId = `${turnId}:typed_failure`;
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_calculator_solve_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: [params.missingRequirement],
      first_broken_rail: params.brokenRail,
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: terminalArtifactId,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: params.text,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalArtifactId,
      terminal_error_code: params.errorCode,
      answer: params.text,
      text: params.text,
      assistant_answer: params.text,
      selected_final_answer: params.text,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "calculator_solve_failed",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        executed_capability: null,
        terminal_result_count: 1,
        first_broken_rail: params.brokenRail,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        executed_capability: null,
        source_target: "calculator",
        family: "calculator",
        required_observation_kinds: ["calculator_receipt", "workstation_tool_evaluation"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalArtifactId,
        terminal_artifact_id: terminalArtifactId,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: terminalResult.text,
        final_answer_source: "typed_failure",
        terminal_authority_ok: true,
        route: "golden_path_runtime / calculator_solve",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalArtifactId,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: terminalResult.text,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        golden_path_runtime: true,
        requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        executed_capability: null,
        first_broken_rail: params.brokenRail,
        terminal_artifact_kind: "typed_failure",
        private_runtime_loop_entered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            error_code: params.errorCode,
            first_broken_rail: params.brokenRail,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  };

  const expression = readCalculatorExpression(args.body);
  if (!expression) {
    return makeFailurePayload({
      errorCode: "missing_calculator_expression",
      brokenRail: "argument_extraction",
      missingRequirement: "calculator_expression",
      text: "I could not complete this golden-path calculator turn because no calculator expression was provided.",
    });
  }
  const result = evaluateGoldenPathCalculatorExpression(expression);
  if (result === null) {
    return makeFailurePayload({
      errorCode: "invalid_calculator_expression",
      brokenRail: "capability_execution",
      missingRequirement: "calculator_receipt",
      text: `I could not complete this golden-path calculator turn because the expression could not be evaluated: ${expression}`,
    });
  }

  const observationArtifactId = `${turnId}:calculator_receipt`;
  const terminalArtifactId = `${turnId}:workstation_tool_evaluation`;
  const resultText = formatGoldenPathNumber(result);
  const answerText = [
    "Calculator verification plan completed.",
    `Expression: ${expression}`,
    `Result: ${resultText}`,
    `Trace source: ${HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY}.`,
  ].join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: false,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_calculator_solve_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const calculatorReceipt = {
    schema: "helix.calculator_receipt.v1",
    capability_key: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
    expression,
    result,
    result_text: resultText,
    unit: null,
    assistant_answer: false,
    raw_content_included: false,
  };
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    calculator_receipt: calculatorReceipt,
    workstation_tool_evaluation: {
      schema: "helix.workstation_tool_evaluation.v1",
      capability_key: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      expression,
      result,
      result_text: resultText,
      trace_source: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      assistant_answer: false,
      raw_content_included: false,
    },
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "calculator_solve",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      observed_artifact_kind: "calculator_receipt",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      private_runtime_loop_entered: false,
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      source_target: "calculator",
      family: "calculator",
      args: { expression },
      required_observation_kinds: ["calculator_receipt", "workstation_tool_evaluation"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / calculator_solve",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      observed_artifact_kind: "calculator_receipt",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "calculator_receipt",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: calculatorReceipt,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.workstation_tool_evaluation.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          expression,
          result,
          result_text: resultText,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "calculator_solve",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
      observed_artifact_kind: "calculator_receipt",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathDocsLocatePayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-docs-locate:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "doc_location_matches";
  const goalKind = "locate_in_doc";
  const docPath = readGoldenPathDocPath(args.body);
  const query = readGoldenPathDocLocateQuery(args.body);
  const docContent = readGoldenPathDocContent(args.body);

  const makeFailurePayload = (params: {
    errorCode: "missing_doc_location_query" | "missing_doc_content" | "no_doc_location_matches";
    brokenRail: "argument_extraction" | "observation";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const terminalArtifactId = `${turnId}:typed_failure`;
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_docs_locate_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: [params.missingRequirement],
      first_broken_rail: params.brokenRail,
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: terminalArtifactId,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: params.text,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalArtifactId,
      terminal_error_code: params.errorCode,
      answer: params.text,
      text: params.text,
      assistant_answer: params.text,
      selected_final_answer: params.text,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "docs_locate_failed",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        executed_capability: null,
        first_broken_rail: params.brokenRail,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        terminal_result_count: 1,
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        executed_capability: null,
        source_target: "docs_viewer",
        family: "docs_viewer",
        args: { doc_path: docPath, query },
        required_observation_kinds: ["doc_location_matches"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalArtifactId,
        terminal_artifact_id: terminalArtifactId,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: terminalResult.text,
        final_answer_source: "typed_failure",
        terminal_authority_ok: true,
        route: "golden_path_runtime / docs_locate_in_doc",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalArtifactId,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: terminalResult.text,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        golden_path_runtime: true,
        requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        executed_capability: null,
        first_broken_rail: params.brokenRail,
        terminal_artifact_kind: "typed_failure",
        private_runtime_loop_entered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            error_code: params.errorCode,
            first_broken_rail: params.brokenRail,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  };

  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_doc_location_query",
      brokenRail: "argument_extraction",
      missingRequirement: "doc_location_query",
      text: "I could not complete this golden-path docs locate turn because no document search query was provided.",
    });
  }
  if (!docContent) {
    return makeFailurePayload({
      errorCode: "missing_doc_content",
      brokenRail: "observation",
      missingRequirement: "doc_content",
      text: "I could not complete this golden-path docs locate turn because no readable document content was available.",
    });
  }
  const matches = findGoldenPathDocLocationMatches({ content: docContent, query, docPath });
  if (matches.length === 0) {
    return makeFailurePayload({
      errorCode: "no_doc_location_matches",
      brokenRail: "observation",
      missingRequirement: "doc_location_matches",
      text: `I could not locate matching document evidence for: ${query}`,
    });
  }

  const observationArtifactId = `${turnId}:doc_location_matches`;
  const terminalArtifactId = observationArtifactId;
  const answerText = [
    `Located ${matches.length} document evidence match${matches.length === 1 ? "" : "es"} for: ${query}`,
    docPath ? `Document: ${docPath}` : null,
    ...matches.map((match, index) => `${index + 1}. Line ${match.line}: ${match.snippet}`),
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_docs_locate_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const docLocationMatches = {
    schema: "helix.doc_location_matches.v1",
    capability_key: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
    doc_path: docPath,
    query,
    match_count: matches.length,
    matches,
    assistant_answer: false,
    raw_content_included: false,
  };
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    doc_location_matches: docLocationMatches,
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "docs_locate_in_doc",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      observed_artifact_kind: "doc_location_matches",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      private_runtime_loop_entered: false,
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      source_target: "docs_viewer",
      family: "docs_viewer",
      args: { doc_path: docPath, query },
      required_observation_kinds: ["doc_location_matches"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / docs_locate_in_doc",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      observed_artifact_kind: "doc_location_matches",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "doc_location_matches",
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: docLocationMatches,
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "docs_locate_in_doc",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      observed_artifact_kind: "doc_location_matches",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathRepoSearchConceptPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-repo:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:repo_code_evidence_observation`;
  const relevanceGateArtifactId = `${turnId}:repo_evidence_relevance_gate`;
  const terminalArtifactId = `${turnId}:repo_code_evidence_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "repo_code_evidence_answer";
  const goalKind = "repo_concept_explanation";
  const concept = readRepoSearchConcept(args.body);

  const makeFailurePayload = (params: {
    errorCode: "missing_repo_search_concept" | "repo_evidence_weak_after_repair";
    brokenRail: "argument_extraction" | "evidence_reentry";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const terminalArtifactIdForFailure = `${turnId}:typed_failure`;
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_repo_search_concept_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: [params.missingRequirement],
      first_broken_rail: params.brokenRail,
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: terminalArtifactIdForFailure,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: params.text,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalArtifactIdForFailure,
      terminal_error_code: params.errorCode,
      answer: terminalResult.text,
      text: terminalResult.text,
      assistant_answer: terminalResult.text,
      selected_final_answer: terminalResult.text,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "repo_search_concept_failed",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        executed_capability: null,
        first_broken_rail: params.brokenRail,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        terminal_result_count: 1,
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        executed_capability: null,
        source_target: "repo_code",
        family: "repo_code",
        args: { concept },
        required_observation_kinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalArtifactIdForFailure,
        terminal_artifact_id: terminalArtifactIdForFailure,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: terminalResult.text,
        final_answer_source: "typed_failure",
        terminal_authority_ok: true,
        route: "golden_path_runtime / repo_search_concept",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalArtifactIdForFailure,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: terminalResult.text,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        golden_path_runtime: true,
        requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        executed_capability: null,
        first_broken_rail: params.brokenRail,
        terminal_artifact_kind: "typed_failure",
        private_runtime_loop_entered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalArtifactIdForFailure,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            error_code: params.errorCode,
            first_broken_rail: params.brokenRail,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  };

  if (!concept) {
    return makeFailurePayload({
      errorCode: "missing_repo_search_concept",
      brokenRail: "argument_extraction",
      missingRequirement: "repo_search_concept",
      text: "I could not complete this golden-path repo search turn because no repo concept was provided.",
    });
  }
  const evidence = findGoldenPathRepoEvidence({ concept, files: readGoldenPathRepoSearchFiles(args.body) });
  if (evidence.length === 0) {
    return makeFailurePayload({
      errorCode: "repo_evidence_weak_after_repair",
      brokenRail: "evidence_reentry",
      missingRequirement: "repo_code_evidence_observation",
      text: `I could not find strong repo evidence for: ${concept}`,
    });
  }

  const selectedPaths = Array.from(new Set(evidence.map((entry) => entry.file_path)));
  const answerText = [
    `Repo evidence answer for: ${concept}`,
    ...evidence.slice(0, 5).map((entry, index) => `${index + 1}. ${entry.file_path}:${entry.line} - ${entry.snippet}`),
  ].join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_repo_search_concept_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const repoEvidenceObservation = {
    schema: "helix.repo_code_evidence_observation.v1",
    capability_key: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
    concept,
    selected_paths: selectedPaths,
    evidence,
    match_count: evidence.length,
    assistant_answer: false,
    raw_content_included: false,
  };
  const repoEvidenceRelevanceGate = {
    schema: "helix.repo_evidence_relevance_gate.v1",
    turn_id: turnId,
    concept,
    selected_paths: selectedPaths,
    coverage: evidence.length >= 2 ? "adequate" : "weak",
    terminal_allowed: true,
    repair_required: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [observationArtifactId, relevanceGateArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    repo_code_evidence_observation: repoEvidenceObservation,
    repo_evidence_relevance_gate: repoEvidenceRelevanceGate,
    repo_code_evidence_answer: {
      schema: "helix.repo_code_evidence_answer.v1",
      concept,
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      selected_paths: selectedPaths,
      assistant_answer: false,
      raw_content_included: false,
    },
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "repo_search_concept",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      observed_artifact_kind: "repo_code_evidence_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      private_runtime_loop_entered: false,
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      source_target: "repo_code",
      family: "repo_code",
      args: { concept },
      required_observation_kinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / repo_search_concept",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      observed_artifact_kind: "repo_code_evidence_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "repo_code_evidence_observation",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: repoEvidenceObservation,
      },
      {
        artifact_id: relevanceGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "repo_evidence_relevance_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: repoEvidenceRelevanceGate,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.repo_code_evidence_answer.v1",
          concept,
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          selected_paths: selectedPaths,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "repo_search_concept",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      observed_artifact_kind: "repo_code_evidence_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathWorkspaceDirectoryPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-workspace-directory:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const query = readWorkspaceDirectoryQuery(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "workspace_directory_resolution";
  const goalKind = "workspace_directory_resolution";

  if (!query) {
    const failureText =
      "I could not complete this golden-path Ask turn because workspace-directory.resolve was requested without a path, URI, or query.";
    const terminalArtifactId = `${turnId}:typed_failure`;
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_workspace_directory_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: ["workspace_directory_query"],
      first_broken_rail: "argument_extraction",
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: terminalArtifactId,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: failureText,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalArtifactId,
      terminal_error_code: "missing_workspace_directory_query",
      answer: failureText,
      text: failureText,
      assistant_answer: failureText,
      selected_final_answer: failureText,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        executed_capability: null,
        source_target: "workspace_directory",
        family: "workspace_directory",
        required_observation_kinds: ["workspace_directory_resolution"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalArtifactId,
        terminal_artifact_id: terminalArtifactId,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: terminalResult.text,
        final_answer_source: "typed_failure",
        terminal_authority_ok: true,
        route: "golden_path_runtime / workspace_directory_resolution",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalArtifactId,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: terminalResult.text,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        golden_path_runtime: true,
        requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        executed_capability: null,
        first_broken_rail: "argument_extraction",
        terminal_artifact_kind: "typed_failure",
        private_runtime_loop_entered: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            terminal_error_code: "missing_workspace_directory_query",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: "argument_extraction",
        terminal_error_code: "missing_workspace_directory_query",
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  }

  const callId = `${turnId}:call:workspace_directory_resolve`;
  const resolution = executeWorkspaceDirectoryResolveTool({
    turnId,
    callId,
    query,
    workspaceRoot: readString(args.body.workspace_root) ?? readString(args.body.workspaceRoot) ?? process.cwd(),
  });
  const answerText = [
    `Workspace directory resolution for: ${query}`,
    `Status: ${resolution.status}`,
    resolution.selected_doc_path ? `Selected doc: ${resolution.selected_doc_path}` : null,
    resolution.selected_uri ? `Selected URI: ${resolution.selected_uri}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_workspace_directory_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: resolution.artifact_id,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [resolution.artifact_id, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    workspace_directory_resolution: resolution,
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "workspace_directory_resolution",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      executed_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      observed_artifact_kind: "workspace_directory_resolution",
      observed_artifact_ref: resolution.artifact_id,
      terminal_artifact_ref: resolution.artifact_id,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      private_runtime_loop_entered: false,
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      executed_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      source_target: "workspace_directory",
      family: "workspace_directory",
      required_observation_kinds: ["workspace_directory_resolution"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / workspace_directory_resolution",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      executed_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      observed_artifact_kind: "workspace_directory_resolution",
      observed_artifact_ref: resolution.artifact_id,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: resolution.artifact_id,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "workspace_directory_resolution",
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: resolution,
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "workspace_directory_resolution",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      selected_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      executed_capability: HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY,
      observed_artifact_kind: "workspace_directory_resolution",
      observed_artifact_ref: resolution.artifact_id,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathProcessedLiveSourceMailPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-processed-mail:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const packetPayload = buildProcessedMailPacketPayload({ body: args.body, turnId, createdAtMs });
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = readString(packetPayload?.packetId) ?? `${turnId}:stage_play_processed_mail_packet`;
  const terminalArtifactId = `${turnId}:model_synthesized_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "model_synthesized_answer";
  const goalKind = "processed_live_source_mail_read";

  if (!packetPayload) {
    const failureText =
      "I could not complete this golden-path Ask turn because no processed live-source mail packet was provided.";
    const terminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: failureText,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      allows_workspace_context: false,
      allows_prior_artifacts: false,
      classifier_reasons: ["explicit_processed_live_source_mail_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: ["stage_play_processed_mail_packet"],
      first_broken_rail: "observation",
      assistant_answer: false,
      raw_content_included: false,
    };

    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: "missing_processed_live_source_mail_packet",
      answer: failureText,
      text: failureText,
      assistant_answer: failureText,
      selected_final_answer: failureText,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "processed_live_source_mail_missing_packet",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        executed_capability: null,
        observed_artifact_kind: null,
        observed_artifact_ref: null,
        terminal_artifact_ref: terminalResult.artifact_id,
        terminal_result_id: terminalResultId,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        terminal_result_count: 1,
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        executed_capability: null,
        source_target: "live_source_mailbox",
        family: "live_environment",
        required_observation_kinds: ["stage_play_processed_mail_packet"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        completed_solver_path: false,
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: failureText,
        final_answer_source: "typed_failure",
        first_broken_rail: "observation",
        terminal_authority_ok: true,
        route: "golden_path_runtime / processed_live_source_mail",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: failureText,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        route_authority_ok: true,
        terminal_authority_ok: true,
        goal_satisfaction: "not_satisfied",
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        executed_capability: null,
        observed_artifact_kind: null,
        observed_artifact_ref: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: "observation",
        terminal_error_code: "missing_processed_live_source_mail_packet",
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          payload: {
            schema: "helix.typed_failure.v1",
            text: failureText,
            answer_text: failureText,
            terminal_error_code: "missing_processed_live_source_mail_packet",
            first_broken_rail: "observation",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "processed_live_source_mail_missing_packet",
        private_runtime_loop_entered: false,
        requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        terminal_result_count: 1,
        final_answer_source: "typed_failure",
        terminal_error_code: "missing_processed_live_source_mail_packet",
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  }

  const observedFacts = readStringArray(packetPayload.observedFacts);
  const inferredFacts = readStringArray(packetPayload.inferredFacts);
  const uncertainties = readStringArray(packetPayload.uncertainties);
  const recommendedNext = readString(packetPayload.recommendedNext) ?? "inspect_if_needed";
  const answerText = [
    `Processed live-source mail packet read: ${observationArtifactId}.`,
    observedFacts.length ? `Observed facts: ${observedFacts.join("; ")}.` : "Observed facts: none supplied.",
    inferredFacts.length ? `Inferred facts: ${inferredFacts.join("; ")}.` : "Inferred facts: none supplied.",
    uncertainties.length ? `Uncertainties: ${uncertainties.join("; ")}.` : "Uncertainties: none supplied.",
    `Recommended next: ${recommendedNext}.`,
  ].join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: false,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_processed_live_source_mail_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "processed_live_source_mail",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      observed_artifact_kind: "stage_play_processed_mail_packet",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    stage_play_processed_mail_packet: packetPayload,
    model_synthesized_answer: {
      schema: "helix.model_synthesized_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      assistant_answer: false,
      raw_content_included: false,
    },
    model_turn_input: {
      schema: "helix.ask_model_turn_input.v1",
      turn_id: turnId,
      prompt_text: promptText,
      available_capabilities: [HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY],
      function_call_outputs: [
        {
          call_id: `${turnId}:call:read_processed_live_source_mail`,
          name: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
          output_ref: observationArtifactId,
          output_kind: "stage_play_processed_mail_packet",
        },
      ],
      model_visible_artifacts: [observationArtifactId, goalSatisfactionArtifact.artifact_id],
      loop_policy: {
        max_model_steps: 1,
        private_runtime_loop_entered: false,
      },
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      source_target: "live_source_mailbox",
      family: "live_environment",
      required_observation_kinds: ["stage_play_processed_mail_packet"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / processed_live_source_mail",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      observed_artifact_kind: "stage_play_processed_mail_packet",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "stage_play_processed_mail_packet",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: packetPayload,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.model_synthesized_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "processed_live_source_mail",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      observed_artifact_kind: "stage_play_processed_mail_packet",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathCatalogWorkspaceCompoundPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-catalog-workspace:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const catalogObservationArtifactId = `${turnId}:capability_registry`;
  const workspaceObservation = buildGoldenPathWorkspaceStatusObservation({ body: args.body, turnId, createdAtMs });
  const workspaceObservationArtifactId =
    readString(workspaceObservation.artifact_id) ?? `${turnId}:workspace_os_status_observation`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const catalogObservation = buildGoldenPathCapabilityCatalogObservation();
  const counts = readRecord(workspaceObservation.capability_counts) ?? {};
  const workspaceSummary = `Workspace status: ${readNumber(counts.total) ?? 0} total, ${readNumber(counts.available) ?? 0} available, ${readNumber(counts.degraded) ?? 0} degraded, ${readNumber(counts.blocked) ?? 0} blocked, ${readNumber(counts.error) ?? 0} error, ${readNumber(counts.unknown) ?? 0} unknown.`;
  const compoundCapabilityContract = {
    schema: "helix.compound_capability_contract.v1",
    turn_id: turnId,
    ordered_subgoals: [
      {
        subgoal_id: `${turnId}:subgoal:capability_catalog`,
        requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        args: {},
        observation_kind: "capability_registry",
        observation_ref: catalogObservationArtifactId,
        satisfaction: "satisfied",
      },
      {
        subgoal_id: `${turnId}:subgoal:workspace_status`,
        requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        args: {},
        observation_kind: "workspace_os_status_observation",
        observation_ref: workspaceObservationArtifactId,
        satisfaction: "satisfied",
      },
    ],
    satisfaction: "satisfied",
    assistant_answer: false,
    raw_content_included: false,
  };
  const answerText = [
    "Compound capability/workspace synthesis completed.",
    "Capability catalog observation completed.",
    workspaceSummary,
  ].join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "compound_capability_contract",
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_catalog_workspace_compound_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "compound_capability_contract",
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [
      catalogObservationArtifactId,
      workspaceObservationArtifactId,
      routeGateArtifactId,
      goalSatisfactionArtifact.artifact_id,
    ],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "catalog_workspace_compound",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: catalogObservationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    compound_capability_contract: compoundCapabilityContract,
    capability_registry: catalogObservation,
    workspace_os_status_observation: workspaceObservation,
    compound_evidence_synthesis_answer: {
      schema: "helix.compound_evidence_synthesis_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      satisfied_subgoal_count: 2,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      source_target: "compound",
      family: "compound",
      required_observation_kinds: ["capability_registry", "workspace_os_status_observation"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / catalog_workspace_compound",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: catalogObservationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      compound_subgoal_count: 2,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: "compound_capability_contract",
          compound_capability_contract: compoundCapabilityContract,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: catalogObservationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "capability_registry",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: catalogObservation,
      },
      {
        artifact_id: workspaceObservationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "workspace_os_status_observation",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: workspaceObservation,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.compound_evidence_synthesis_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          satisfied_subgoal_count: 2,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "catalog_workspace_compound",
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      compound_capability_contract: compoundCapabilityContract,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

export const runHelixAskGoldenPathRuntime = (args: {
  body: RecordLike;
  env?: Record<string, string | undefined>;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): HelixAskGoldenPathRuntimeDecision => {
  if (!isHelixAskGoldenPathRuntimeEnabled(args.env)) return { handled: false, reason: "flag_disabled" };
  if (!isHelixAskGoldenPathRequested(args.body)) return { handled: false, reason: "not_requested" };
  const body = readRecord(args.body) ?? {};
  if (isHelixAskGoldenPathCatalogWorkspaceCompoundRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCatalogWorkspaceCompoundPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathProcessedLiveSourceMailRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathProcessedLiveSourceMailPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathCalculatorSolveRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCalculatorSolvePayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathDocsLocateRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathDocsLocatePayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathRepoSearchConceptRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathRepoSearchConceptPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathWorkspaceDirectoryRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathWorkspaceDirectoryPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathCapabilityCatalogRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCapabilityCatalogPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathWorkspaceStatusRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathWorkspaceStatusPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  return {
    handled: true,
    payload: buildHelixAskGoldenPathRuntimePayload({
      body,
      deps: args.deps,
      now: args.now,
    }),
  };
};
