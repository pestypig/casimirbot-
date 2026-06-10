import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  buildWorkstationPanelPathRef,
  buildWorkstationPathRef,
  isRawAbsoluteWorkstationPath,
  normalizeWorkstationDocPath,
  normalizeWorkstationPathInput,
} from "@shared/workstation-view-state";
import {
  WORKSPACE_ACTION_REGISTRY,
  WORKSPACE_ACTION_VISIBLE_PANEL_IDS,
  type WorkspaceActionRegistryEntry,
} from "@shared/workstation-dynamic-tools";

export const HELIX_WORKSPACE_DIRECTORY_RESOLVE_CAPABILITY = "workspace-directory.resolve" as const;
export const HELIX_WORKSPACE_DIRECTORY_RESOLUTION_SCHEMA = "helix.workspace_directory_resolution.v1" as const;

export type HelixWorkspaceDirectoryTargetKind = "doc" | "panel" | "path";

export type HelixWorkspaceDirectoryResolutionCandidate = {
  uri: string;
  target_kind: HelixWorkspaceDirectoryTargetKind;
  relative_path?: string;
  doc_path?: string;
  panel_id?: string;
  label: string;
  score: number;
  reasons: string[];
  snippets?: Array<{
    line: number;
    text: string;
  }>;
};

export type HelixWorkspaceDirectoryResolution = {
  schema: typeof HELIX_WORKSPACE_DIRECTORY_RESOLUTION_SCHEMA;
  resolution_id: string;
  artifact_id: string;
  turn_id: string;
  call_id: string;
  query: string;
  normalized_query: string;
  uri?: string;
  status: "resolved" | "ambiguous" | "not_found" | "invalid_uri";
  selected_uri?: string;
  selected_target_kind?: HelixWorkspaceDirectoryTargetKind;
  selected_doc_path?: string;
  selected_panel_id?: string;
  candidates: HelixWorkspaceDirectoryResolutionCandidate[];
  searched_scopes: string[];
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

const DOC_EXTENSIONS = new Set([".md", ".mdx", ".txt", ".json", ".yaml", ".yml"]);
const MAX_DOC_BYTES = 64_000;
const DEFAULT_LIMIT = 8;

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[_\-./\\]+/g, " ")
    .replace(/\bwhite\s+paper\b/g, "whitepaper")
    .replace(/\s+/g, " ")
    .trim();

const tokenSet = (value: string): string[] => {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  const stopTokens = new Set([
    "find",
    "locate",
    "search",
    "retrieve",
    "get",
    "pull",
    "open",
    "show",
    "read",
    "the",
    "a",
    "an",
  ]);
  const tokens = normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !stopTokens.has(token));
  if (/\bwhitepaper\b/.test(normalized)) tokens.push("white", "paper");
  return Array.from(new Set(tokens));
};

const stableId = (parts: unknown[]): string => {
  const text = JSON.stringify(parts);
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(31, hash) + text.charCodeAt(index) | 0;
  }
  return Math.abs(hash).toString(36);
};

const listDocFiles = (rootDir: string, relativeDir = "docs", depth = 0): string[] => {
  if (depth > 8) return [];
  const absoluteDir = path.join(rootDir, relativeDir);
  if (!existsSync(absoluteDir)) return [];
  const entries = readdirSync(absoluteDir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const relativePath = `${relativeDir}/${entry.name}`.replace(/\\/g, "/");
    const absolutePath = path.join(rootDir, relativePath);
    if (entry.isDirectory()) {
      files.push(...listDocFiles(rootDir, relativePath, depth + 1));
      continue;
    }
    if (!entry.isFile() || !DOC_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
    try {
      if (statSync(absolutePath).size <= 1_500_000) files.push(relativePath);
    } catch {
      // Ignore files that disappear while resolving.
    }
  }
  return files;
};

const readDocPreview = (rootDir: string, relativePath: string): { text: string; snippets: Array<{ line: number; text: string }> } => {
  const absolutePath = path.join(rootDir, relativePath);
  try {
    const content = readFileSync(absolutePath, "utf8").slice(0, MAX_DOC_BYTES);
    const lines = content.split(/\r?\n/);
    const snippets = lines
      .map((line, index) => ({ line: index + 1, text: line.trim() }))
      .filter((line) => line.text.length > 0)
      .slice(0, 8);
    return {
      text: content,
      snippets,
    };
  } catch {
    return { text: "", snippets: [] };
  }
};

const scoreCandidateText = (args: {
  query: string;
  label: string;
  pathText: string;
  bodyText?: string;
}): { score: number; reasons: string[] } => {
  const query = normalizeText(args.query);
  const label = normalizeText(args.label);
  const pathText = normalizeText(args.pathText);
  const bodyText = normalizeText(args.bodyText ?? "");
  const tokens = tokenSet(args.query);
  const reasons: string[] = [];
  let score = 0;

  if (query && pathText.includes(query)) {
    score += 35;
    reasons.push("query_phrase_in_path");
  }
  if (query && label.includes(query)) {
    score += 30;
    reasons.push("query_phrase_in_label");
  }
  if (query && bodyText.includes(query)) {
    score += 18;
    reasons.push("query_phrase_in_content");
  }

  let matchedTokens = 0;
  for (const token of tokens) {
    const inPath = pathText.includes(token);
    const inLabel = label.includes(token);
    const inBody = bodyText.includes(token);
    if (inPath || inLabel || inBody) matchedTokens += 1;
    if (inPath) score += 10;
    if (inLabel) score += 8;
    if (inBody) score += 3;
  }
  if (tokens.length > 0) {
    const coverage = matchedTokens / tokens.length;
    score += coverage * 25;
    if (coverage >= 0.6) reasons.push("high_query_token_coverage");
  }
  if (/\bwhitepaper|white paper\b/i.test(args.query) && /\bwhitepaper|white-paper|white_paper|paper\b/i.test(args.pathText)) {
    score += 10;
    reasons.push("whitepaper_path_match");
  }
  if (/^docs\/research\//i.test(args.pathText)) {
    score += 3;
    reasons.push("research_docs_scope");
  }
  const datedPath = args.pathText.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (datedPath) {
    const dateScore = Number(`${datedPath[1]}${datedPath[2]}${datedPath[3]}`);
    if (Number.isFinite(dateScore)) {
      score += dateScore / 10_000_000;
      reasons.push("dated_workspace_artifact_tiebreak");
    }
    if (/\bcurrent-status-whitepaper\b/i.test(args.pathText)) {
      const timestamp = Date.UTC(Number(datedPath[1]), Number(datedPath[2]) - 1, Number(datedPath[3]));
      if (Number.isFinite(timestamp)) {
        score += (timestamp / 86_400_000) / 10;
        reasons.push("current_status_whitepaper_recency_tiebreak");
      }
    }
  }
  if (/\bwhite\s*paper|whitepaper\b/i.test(args.query) && /\bwhitepaper\b/i.test(args.pathText)) {
    score += 12;
    reasons.push("whitepaper_filename_match");
  }
  if (/\b(?:current|status|white\s*paper|whitepaper)\b/i.test(args.query) && /\bcurrent-status-whitepaper\b/i.test(args.pathText)) {
    score += 15;
    reasons.push("current_status_whitepaper_path_match");
  }
  if (/\b(?:doc|document|paper|white\s*paper|whitepaper|report|memo)\b/i.test(args.query) && /\.mdx?$/i.test(args.pathText)) {
    score += 20;
    reasons.push("markdown_document_format_match");
  }
  if (/\.mdx?$/i.test(args.pathText)) {
    score += 2;
    reasons.push("markdown_path_tiebreak");
  }
  if (/\.(?:json|yaml|yml)$/i.test(args.pathText)) {
    score -= 8;
    reasons.push("sidecar_metadata_penalty");
  }

  return { score: Math.round(score * 10000) / 10000, reasons };
};

const buildDocCandidates = (rootDir: string, query: string): HelixWorkspaceDirectoryResolutionCandidate[] => {
  return listDocFiles(rootDir).map((relativePath) => {
    const preview = readDocPreview(rootDir, relativePath);
    const label = path.basename(relativePath).replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    const score = scoreCandidateText({
      query,
      label,
      pathText: relativePath,
      bodyText: preview.text,
    });
    const pathRef = buildWorkstationPathRef(relativePath);
    return {
      uri: pathRef?.virtualUri ?? `workspace://workspace/${relativePath.split("/").map(encodeURIComponent).join("/")}`,
      target_kind: "doc" as const,
      relative_path: relativePath,
      doc_path: normalizeWorkstationDocPath(relativePath) ?? relativePath,
      label,
      score: score.score,
      reasons: score.reasons,
      snippets: preview.snippets,
    };
  });
};

const panelLabel = (panelId: string): string => {
  const registryEntry = WORKSPACE_ACTION_REGISTRY.find((entry: WorkspaceActionRegistryEntry) => entry.target_id === panelId);
  return registryEntry?.label ?? panelId.replace(/[-_]+/g, " ");
};

const buildPanelCandidates = (query: string): HelixWorkspaceDirectoryResolutionCandidate[] => {
  return WORKSPACE_ACTION_VISIBLE_PANEL_IDS.map((panelId) => {
    const registryEntries = WORKSPACE_ACTION_REGISTRY.filter((entry: WorkspaceActionRegistryEntry) => entry.target_id === panelId);
    const label = panelLabel(panelId);
    const searchable = [
      panelId,
      label,
      ...registryEntries.flatMap((entry: WorkspaceActionRegistryEntry) => [entry.action_key, entry.label, ...entry.aliases]),
    ].join(" ");
    const score = scoreCandidateText({
      query,
      label,
      pathText: `panels/${panelId}`,
      bodyText: searchable,
    });
    const pathRef = buildWorkstationPanelPathRef(panelId, label);
    return {
      uri: pathRef?.virtualUri ?? `workspace://workspace/panels/${encodeURIComponent(panelId)}`,
      target_kind: "panel" as const,
      relative_path: `panels/${panelId}`,
      panel_id: panelId,
      label,
      score: score.score,
      reasons: score.reasons,
    };
  });
};

const candidateForSafePath = (rootDir: string, relativePath: string): HelixWorkspaceDirectoryResolutionCandidate | null => {
  const normalized = normalizeWorkstationPathInput(relativePath);
  if (!normalized) return null;
  const panelMatch = normalized.match(/^panels\/([^/]+)$/i);
  if (panelMatch) {
    const panelId = panelMatch[1];
    const label = panelLabel(panelId);
    const pathRef = buildWorkstationPanelPathRef(panelId, label);
    return {
      uri: pathRef?.virtualUri ?? `workspace://workspace/panels/${encodeURIComponent(panelId)}`,
      target_kind: "panel",
      relative_path: `panels/${panelId}`,
      panel_id: panelId,
      label,
      score: 100,
      reasons: ["exact_safe_workspace_path"],
    };
  }
  if (/^docs(?:\/|$)/i.test(normalized)) {
    const docPath = normalizeWorkstationDocPath(normalized);
    if (!docPath) return null;
    const exists = existsSync(path.join(rootDir, docPath));
    const pathRef = buildWorkstationPathRef(docPath);
    return {
      uri: pathRef?.virtualUri ?? `workspace://workspace/${docPath.split("/").map(encodeURIComponent).join("/")}`,
      target_kind: "doc",
      relative_path: docPath,
      doc_path: docPath,
      label: path.basename(docPath).replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
      score: exists ? 100 : 45,
      reasons: [exists ? "exact_existing_doc_path" : "safe_doc_path_not_found"],
    };
  }
  const pathRef = buildWorkstationPathRef(normalized);
  return {
    uri: pathRef?.virtualUri ?? `workspace://workspace/${normalized.split("/").map(encodeURIComponent).join("/")}`,
    target_kind: "path",
    relative_path: normalized,
    label: normalized,
    score: existsSync(path.join(rootDir, normalized)) ? 75 : 25,
    reasons: ["safe_workspace_path"],
  };
};

export function executeWorkspaceDirectoryResolveTool(input: {
  turnId: string;
  callId: string;
  query?: string | null;
  uri?: string | null;
  limit?: number | null;
  targetKinds?: HelixWorkspaceDirectoryTargetKind[] | null;
  workspaceRoot?: string;
}): HelixWorkspaceDirectoryResolution {
  const workspaceRoot = input.workspaceRoot ?? process.cwd();
  const rawQuery = String(input.query ?? "").trim();
  const rawUri = String(input.uri ?? "").trim();
  const query = rawQuery || rawUri;
  const normalizedQuery = normalizeText(query);
  const limit = Math.max(1, Math.min(20, Math.floor(Number(input.limit ?? DEFAULT_LIMIT)) || DEFAULT_LIMIT));
  const targetKindSet = new Set(input.targetKinds?.length ? input.targetKinds : ["doc", "panel", "path"]);
  const candidates: HelixWorkspaceDirectoryResolutionCandidate[] = [];

  if ((rawUri && isRawAbsoluteWorkstationPath(rawUri)) || (!rawUri && rawQuery && isRawAbsoluteWorkstationPath(rawQuery))) {
    const artifactId = `${input.turnId}:workspace_directory_resolution:${stableId([input.callId, query, "invalid_uri"])}`;
    return {
      schema: HELIX_WORKSPACE_DIRECTORY_RESOLUTION_SCHEMA,
      resolution_id: artifactId,
      artifact_id: artifactId,
      turn_id: input.turnId,
      call_id: input.callId,
      query,
      normalized_query: normalizedQuery,
      ...(rawUri ? { uri: rawUri } : {}),
      status: "invalid_uri",
      candidates: [],
      searched_scopes: ["workspace_safe_uri_parser"],
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  }

  const directInput = rawUri || rawQuery;
  const directPath = directInput ? normalizeWorkstationPathInput(directInput) : null;
  if (directPath) {
    const directCandidate = candidateForSafePath(workspaceRoot, directPath);
    if (directCandidate && targetKindSet.has(directCandidate.target_kind)) candidates.push(directCandidate);
  }

  if (targetKindSet.has("doc")) candidates.push(...buildDocCandidates(workspaceRoot, query));
  if (targetKindSet.has("panel")) candidates.push(...buildPanelCandidates(query));

  const deduped = new Map<string, HelixWorkspaceDirectoryResolutionCandidate>();
  for (const candidate of candidates) {
    const key = candidate.uri;
    const existing = deduped.get(key);
    if (!existing || candidate.score > existing.score) deduped.set(key, candidate);
  }
  const ranked = Array.from(deduped.values())
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.uri.localeCompare(right.uri))
    .slice(0, limit);
  const selected = ranked[0];
  const second = ranked[1];
  const status = selected
    ? second && selected.score - second.score < 8
      ? "ambiguous"
      : "resolved"
    : "not_found";
  const artifactId = `${input.turnId}:workspace_directory_resolution:${stableId([input.callId, query, ranked.map((candidate) => candidate.uri)])}`;

  return {
    schema: HELIX_WORKSPACE_DIRECTORY_RESOLUTION_SCHEMA,
    resolution_id: artifactId,
    artifact_id: artifactId,
    turn_id: input.turnId,
    call_id: input.callId,
    query,
    normalized_query: normalizedQuery,
    ...(rawUri ? { uri: rawUri } : {}),
    status,
    ...(selected?.uri ? { selected_uri: selected.uri } : {}),
    ...(selected?.target_kind ? { selected_target_kind: selected.target_kind } : {}),
    ...(selected?.doc_path ? { selected_doc_path: selected.doc_path } : {}),
    ...(selected?.panel_id ? { selected_panel_id: selected.panel_id } : {}),
    candidates: ranked,
    searched_scopes: [
      "workspace_safe_uri_parser",
      ...(targetKindSet.has("doc") ? ["workspace_docs_directory"] : []),
      ...(targetKindSet.has("panel") ? ["workspace_panel_registry"] : []),
    ],
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
}
