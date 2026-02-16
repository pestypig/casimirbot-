const RUNAWAY_SECTION_MARKERS = [
  "Hide Additional Repo Context",
  "Additional repo context:",
  "Expand With Retrieved Evidence",
  "Details",
  "Tree Walk",
  "Proof",
  "Key files",
  "Execution log",
  "Ask debug",
  "Context sources",
];

const RUNAWAY_MARKER_RE = new RegExp(
  `\\n\\s*(?:${RUNAWAY_SECTION_MARKERS.map((marker) => marker.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")).join("|")})\\s*$`,
  "im",
);

const stripDuplicateTrailingSources = (value: string): string => {
  const lines = value.split(/\r?\n/);
  const out: string[] = [];
  let lastSourcesNormalized = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^sources\s*:/i.test(trimmed)) {
      const normalized = trimmed.replace(/\s+/g, " ").toLowerCase();
      if (normalized === lastSourcesNormalized) {
        continue;
      }
      lastSourcesNormalized = normalized;
      out.push(line);
      continue;
    }
    if (trimmed) {
      lastSourcesNormalized = "";
    }
    out.push(line);
  }
  return out.join("\n");
};

export const stripRunawayAnswerArtifacts = (value: string): string => {
  if (!value) return value;
  let cleaned = value;
  cleaned = cleaned.replace(/^\s*in answer,\s*use the context and evidence bullets to craft your response\.?\s*/i, "");
  cleaned = cleaned.replace(/^\s*in plain language,\s*in answer,\s*use the context and evidence bullets to craft your response\.?\s*/i, "In plain language, ");
  cleaned = cleaned.replace(/^\s*certainly!?\s*let'?s dive into\b[^\n]*\.?\s*/i, "");
  cleaned = cleaned.replace(/^\s*in plain language,\s*in practice,\s*/i, "In plain language, ");
  cleaned = cleaned.replace(/\bEND_OF_ANSWER\b/gi, "");
  cleaned = cleaned.replace(/(?:\bEND\.\s*){3,}/gi, "");
  cleaned = cleaned.replace(/(?:\s*END\.\s*)+$/i, "");
  const markerMatch = cleaned.match(RUNAWAY_MARKER_RE);
  if (markerMatch && typeof markerMatch.index === "number") {
    cleaned = cleaned.slice(0, markerMatch.index);
  }
  cleaned = stripDuplicateTrailingSources(cleaned);
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();
  return cleaned;
};

