import path from "node:path";

export type EvidenceIdentityOptions = {
  repoRoot?: string;
  lowercase?: boolean;
  normalizeExtensions?: boolean;
  extensionAliases?: Record<string, string>;
  stripPrefixes?: boolean;
  stripCitationSuffix?: boolean;
  stripDecorators?: boolean;
  allowHttp?: boolean;
};

const DEFAULT_EXTENSION_ALIASES: Record<string, string> = {
  ".tsx": ".ts",
  ".jsx": ".js",
  ".mdx": ".md",
};

const normalizeSlashes = (value: string): string => value.replace(/\\/g, "/");

const stripDecorators = (value: string): string =>
  value.replace(/^#+/, "").replace(/^\[|\]$/g, "").replace(/[.,;:]+$/g, "");

const stripPrefixes = (value: string): string => {
  const projectMatch = value.match(/project:[^/]+\/file:([^\]]+)/i);
  if (projectMatch) return projectMatch[1];
  if (value.toLowerCase().startsWith("file:")) {
    return value.slice(5);
  }
  return value;
};

const stripCitationSuffix = (value: string): string => {
  let next = value;
  const hashIndex = next.indexOf("#");
  if (hashIndex >= 0) next = next.slice(0, hashIndex);
  const chunkIndex = next.indexOf("::");
  if (chunkIndex >= 0) next = next.slice(0, chunkIndex);
  const atMatch = next.match(/^(.*\.[a-z0-9]+)@[^/]+$/i);
  if (atMatch) next = atMatch[1];
  return next;
};

const applyExtensionAliases = (
  value: string,
  aliases: Record<string, string>,
): string => {
  const ext = path.posix.extname(value);
  if (!ext) return value;
  const replacement = aliases[ext.toLowerCase()];
  if (!replacement) return value;
  return value.slice(0, -ext.length) + replacement;
};

const toRepoRelative = (
  value: string,
  repoRoot: string,
  lowercase: boolean,
): string => {
  const rootResolved = normalizeSlashes(path.resolve(repoRoot));
  const normalized = normalizeSlashes(value);
  const compareValue = lowercase ? normalized.toLowerCase() : normalized;
  const compareRoot = lowercase ? rootResolved.toLowerCase() : rootResolved;
  if (compareValue.startsWith(`${compareRoot}/`)) {
    return normalized.slice(rootResolved.length + 1);
  }
  if (path.isAbsolute(value)) {
    const relative = normalizeSlashes(path.relative(rootResolved, value));
    return relative.startsWith("..") ? normalized : relative;
  }
  return normalized;
};

export const normalizeEvidencePath = (
  value?: string,
  options?: EvidenceIdentityOptions,
): string | undefined => {
  if (!value) return undefined;
  let normalized = value.trim();
  if (!normalized) return undefined;
  if (!options?.allowHttp && /^https?:/i.test(normalized)) return undefined;
  if (options?.stripDecorators) {
    normalized = stripDecorators(normalized);
  }
  if (options?.stripPrefixes ?? true) {
    normalized = stripPrefixes(normalized);
  }
  if (options?.stripCitationSuffix ?? true) {
    normalized = stripCitationSuffix(normalized);
  }
  normalized = normalizeSlashes(normalized).trim();
  if (!normalized) return undefined;
  if (options?.repoRoot) {
    normalized = toRepoRelative(
      normalized,
      options.repoRoot,
      options.lowercase ?? false,
    );
  }
  normalized = path.posix.normalize(normalized);
  normalized = normalized.replace(/^\.\/+/, "").replace(/^\/+/, "");
  if (options?.normalizeExtensions) {
    normalized = applyExtensionAliases(
      normalized,
      options.extensionAliases ?? DEFAULT_EXTENSION_ALIASES,
    );
  }
  if (options?.lowercase) {
    normalized = normalized.toLowerCase();
  }
  return normalized;
};

export const normalizeEvidenceRef = (
  value?: string,
  options?: EvidenceIdentityOptions,
): string | undefined =>
  normalizeEvidencePath(value, {
    stripDecorators: true,
    lowercase: true,
    normalizeExtensions: true,
    ...options,
  });
