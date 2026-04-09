import { normalizeEvidencePath, normalizeEvidenceRef } from "../../agi/refinery-identity";
import { extractFilePathsFromText } from "../paths";

const isStructuredCitationToken = (value: string): boolean =>
  /^(?:gate|certificate):/i.test(value.trim());

const normalizeVisibleCitationPath = (value: string): string | null => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  if (isStructuredCitationToken(trimmed) || /^https?:/i.test(trimmed)) return trimmed;
  const normalized =
    normalizeEvidencePath(trimmed, {
      repoRoot: process.cwd(),
      stripDecorators: true,
      stripPrefixes: true,
      stripCitationSuffix: true,
      normalizeExtensions: false,
      lowercase: false,
    }) ?? trimmed;
  const repoRelative = normalized.replace(/\\/g, "/").replace(/^\.\/+/, "").trim();
  if (!repoRelative || repoRelative.includes(",")) return null;
  if (/^[A-Za-z]:\//.test(repoRelative) || repoRelative.startsWith("../")) return null;
  return repoRelative;
};

const normalizeCitations = (citations: string[]): string[] =>
  Array.from(
    new Set(
      citations
        .filter((value) => typeof value === "string" && value.trim().length > 0)
        .map((value) => normalizeVisibleCitationPath(value) ?? String(value).trim())
        .filter((value) => value.length > 0),
    ),
  );

const cleanDanglingFileExtensionFragments = (value: string): string => {
  if (!value) return value;
  return value
    .replace(/([.!?])\s+(?:ts|tsx|js|jsx|md|json|yaml|yml|toml)\.(?=\s|$)/gi, "$1")
    .replace(/\[(?:\.(?:ts|tsx|js|jsx|md|json|yaml|yml|toml))\]/gi, "")
    .replace(
      /(^|[\s([])\.(?:ts|tsx|js|jsx|md|json|yaml|yml|toml)(?=(?:[\s)\].,;:!?]|$))/gi,
      "$1",
    );
};

const OPEN_WORLD_SOURCES_MARKER_RE =
  /^\s*sources?\s*:\s*open-world\s+best-effort(?:\s*\(no\s+repo\s+citations\s+required\))?\.?\s*$/i;
const CITATION_TOKEN_RE = /\b(?:gate|certificate):[a-z0-9._-]+/gi;

export const OPEN_WORLD_SOURCES_MARKER_TEXT =
  "Sources: open-world best-effort (no repo citations required).";

export const hasSourcesLine = (value: string): boolean => /(?:^|\n)sources?\s*:\s*\S/i.test(value);

export const extractCitationTokensFromText = (value: string): string[] => {
  if (!value) return [];
  const tokens = value.match(CITATION_TOKEN_RE) ?? [];
  return Array.from(new Set(tokens.map((token) => token.trim()).filter(Boolean)));
};

export const scrubUnsupportedPaths = (
  value: string,
  allowedPaths: string[],
): { text: string; removed: string[] } => {
  if (!value.trim()) return { text: value, removed: [] };
  if (allowedPaths.length === 0) return { text: value, removed: [] };
  const normalizeCitationComparablePath = (input: string): string => {
    const normalized = (normalizeEvidenceRef(input) ?? input).replace(/\\/g, "/").trim();
    if (!normalized) return "";
    return normalized
      .replace(/#L\d+(?:C\d+)?$/i, "")
      .replace(/:L?\d+(?::\d+)?$/i, "")
      .trim();
  };
  const dropComparableExtension = (input: string): string =>
    input.replace(
      /\.(?:ts|tsx|js|jsx|mjs|cjs|md|json|yaml|yml|toml|sql|py|go|rs|java|c|cc|cpp|h|hpp|cs|swift|kt)$/i,
      "",
    );
  const escapeRegExp = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const allowed = new Set<string>();
  for (const path of allowedPaths) {
    const normalized = normalizeEvidenceRef(path) ?? path;
    if (normalized) allowed.add(normalized);
    const comparable = normalizeCitationComparablePath(path);
    if (comparable) allowed.add(comparable);
    const comparableNoExt = comparable ? dropComparableExtension(comparable) : "";
    if (comparableNoExt) allowed.add(comparableNoExt);
    if (path) allowed.add(path);
  }
  const presentPaths = extractFilePathsFromText(value);
  if (presentPaths.length === 0) return { text: value, removed: [] };
  let cleaned = value;
  const removed: string[] = [];
  for (const candidate of presentPaths) {
    if (/^(gate|certificate):/i.test(candidate)) continue;
    const normalized = normalizeEvidenceRef(candidate) ?? candidate;
    const comparable = normalizeCitationComparablePath(candidate);
    const comparableNoExt = comparable ? dropComparableExtension(comparable) : "";
    if (
      allowed.has(normalized) ||
      allowed.has(candidate) ||
      (comparable ? allowed.has(comparable) : false) ||
      (comparableNoExt ? allowed.has(comparableNoExt) : false)
    ) {
      continue;
    }
    removed.push(candidate);
    const escaped = escapeRegExp(candidate);
    cleaned = cleaned.replace(new RegExp(`\\[[^\\]]*${escaped}[^\\]]*\\]`, "g"), "");
    cleaned = cleaned.replace(new RegExp(`\\s*\\|\\s*(?:symbol|file)=${escaped}\\b`, "gi"), "");
    cleaned = cleaned.replace(new RegExp(`\\b(?:symbol|file)=${escaped}\\b`, "gi"), "");
    cleaned = cleaned.split(candidate).join("");
  }
  if (removed.length) {
    cleaned = cleaned.replace(/\[(?:r|g|s|c):\s*\]/gi, "");
    cleaned = cleaned.replace(/\s*\|\s*(?:symbol|file)=\s*(?=\s|$)/gi, "");
    cleaned = cleaned.replace(/\b(?:symbol|file)=\s*(?=\s|$)/gi, "");
    cleaned = cleaned.replace(/\s*\|\s*(?=\s*(?:\n|$))/g, "");
    cleaned = cleanDanglingFileExtensionFragments(cleaned);
    cleaned = cleaned.replace(/[ \t]{2,}/g, " ");
    cleaned = cleaned.replace(/ +([,.;:])/g, "$1");
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
  }
  return { text: cleaned, removed };
};

export const sanitizeSourcesLine = (
  value: string,
  allowedPaths: string[],
  allowedTokens: string[],
): string => {
  if (!value) return value;
  const allowedPathSet = new Set(allowedPaths.map((path) => path.toLowerCase()));
  const allowedTokenSet = new Set(allowedTokens.map((token) => token.toLowerCase()));
  const lines = value.split(/\r?\n/);
  const output: string[] = [];
  const sourcePool: string[] = [];
  let openWorldMarkerRequested = false;
  for (const line of lines) {
    const match = line.match(/^\s*sources?\s*:\s*(.+)$/i);
    if (!match) {
      output.push(line);
      continue;
    }
    if (OPEN_WORLD_SOURCES_MARKER_RE.test(line)) {
      openWorldMarkerRequested = true;
      continue;
    }
    const rawPaths = normalizeCitations(extractFilePathsFromText(line));
    const rawTokens = extractCitationTokensFromText(line);
    const filteredPaths = rawPaths.filter((entry) => {
      const normalized = (normalizeEvidenceRef(entry) ?? entry).toLowerCase();
      return allowedPathSet.has(normalized) || allowedPathSet.has(entry.toLowerCase());
    });
    const filteredTokens = rawTokens.filter((token) => allowedTokenSet.has(token.toLowerCase()));
    const combined = normalizeCitations([...filteredPaths, ...filteredTokens]);
    if (combined.length === 0) continue;
    sourcePool.push(...combined);
  }
  const mergedSources = normalizeCitations(sourcePool);
  if (mergedSources.length > 0) {
    while (output.length > 0 && !output[output.length - 1]?.trim()) {
      output.pop();
    }
    if (output.length > 0) {
      output.push("");
    }
    output.push(`Sources: ${mergedSources.join(", ")}`);
  } else if (openWorldMarkerRequested) {
    while (output.length > 0 && !output[output.length - 1]?.trim()) {
      output.pop();
    }
    if (output.length > 0) {
      output.push("");
    }
    output.push(OPEN_WORLD_SOURCES_MARKER_TEXT);
  }
  return output.join("\n").trim();
};

export const appendSourcesLine = (value: string, citations: string[], limit = 8): string => {
  const normalized = normalizeCitations(citations).slice(0, limit);
  if (normalized.length === 0) return value.trim();
  return `${value}\n\nSources: ${normalized.join(", ")}`.trim();
};

export const appendOpenWorldSourcesMarker = (value: string): string =>
  `${value}\n\n${OPEN_WORLD_SOURCES_MARKER_TEXT}`.trim();

export const shouldAppendOpenWorldSourcesMarker = (args: {
  answerText: string;
  treeWalkBlock?: string | null;
}): boolean => {
  if (hasSourcesLine(args.answerText)) return false;
  const treeWalkCitations = extractFilePathsFromText(args.treeWalkBlock ?? "").filter(Boolean);
  return treeWalkCitations.length === 0;
};
