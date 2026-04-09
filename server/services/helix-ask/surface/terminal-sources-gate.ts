import { normalizeEvidencePath } from "../../agi/refinery-identity";

type MutableDebugPayload = Record<string, unknown> | null | undefined;

const normalizeVisibleCitationPath = (value: string): string | null => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  if (/^(?:gate|certificate):/i.test(trimmed) || /^https?:/i.test(trimmed)) return trimmed;
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

export const collectTerminalCitationHints = (debugPayload: MutableDebugPayload): string[] => {
  if (!debugPayload || !Array.isArray(debugPayload.citation_contract_sources)) return [];
  return normalizeCitations(
    (debugPayload.citation_contract_sources as unknown[])
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean),
  );
};

export const shouldAddSourcesMissingReason = (args: {
  visibleSourcesRequired: boolean;
  hasSourcesLine: boolean;
}): boolean => args.visibleSourcesRequired && !args.hasSourcesLine;

export const buildObjectiveTerminalSourcesRepairContext = (args: {
  debugPayload: MutableDebugPayload;
  planAllowedCitations: string[];
  normalizeConstraintPath: (value: string) => string;
}): {
  allowlist: string[];
  lineCandidates: string[];
  filtered: boolean;
} => {
  if (!args.debugPayload) {
    return {
      allowlist: args.planAllowedCitations.slice(0, 16),
      lineCandidates: args.planAllowedCitations.slice(0, 8),
      filtered: false,
    };
  }
  const objectiveMiniAnswersRaw = Array.isArray(args.debugPayload.objective_mini_answers)
    ? (args.debugPayload.objective_mini_answers as unknown[])
    : [];
  const objectiveSelectedFilesRaw = Array.isArray(args.debugPayload.objective_retrieval_selected_files)
    ? (args.debugPayload.objective_retrieval_selected_files as unknown[])
    : [];
  const candidates = Array.from(
    new Set(
      [
        ...objectiveMiniAnswersRaw.flatMap((entry) => {
          if (!entry || typeof entry !== "object") return [];
          const record = entry as Record<string, unknown>;
          if (!Array.isArray(record.evidence_refs)) return [];
          return (record.evidence_refs as unknown[])
            .map((value) => String(value ?? "").trim())
            .filter(Boolean);
        }),
        ...objectiveSelectedFilesRaw.flatMap((entry) => {
          if (!entry || typeof entry !== "object") return [];
          const record = entry as Record<string, unknown>;
          if (!Array.isArray(record.files)) return [];
          return (record.files as unknown[])
            .map((value) => String(value ?? "").trim())
            .filter(Boolean);
        }),
      ].filter(Boolean),
    ),
  ).slice(0, 8);
  const planAllowedSet = new Set(
    args.planAllowedCitations.map((entry) => args.normalizeConstraintPath(entry).toLowerCase()),
  );
  const filteredCandidates =
    planAllowedSet.size > 0
      ? candidates.filter((entry) =>
          planAllowedSet.has(args.normalizeConstraintPath(entry).toLowerCase()),
        )
      : candidates;
  return {
    allowlist:
      args.planAllowedCitations.length > 0
        ? args.planAllowedCitations.slice(0, 16)
        : filteredCandidates.slice(0, 16),
    lineCandidates:
      filteredCandidates.length > 0
        ? filteredCandidates.slice(0, 8)
        : args.planAllowedCitations.slice(0, 8),
    filtered: filteredCandidates.length !== candidates.length,
  };
};
