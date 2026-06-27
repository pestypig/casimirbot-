import {
  collectHelixRuntimeComposerInternetSearchSupportRefs,
  collectHelixRuntimeComposerScholarlySupportRefs,
  type HelixRuntimeComposerSupportRefArtifact,
} from "./runtime-composer-support-refs";

type RecordLike = Record<string, unknown>;

export type HelixRuntimeDocSummaryFallbackDependencies = {
  readArtifactPayloadRecord: (artifact: HelixRuntimeComposerSupportRefArtifact) => RecordLike | null;
  readString: (value: unknown) => string | null;
  normalizeDocPath: (value: unknown) => string | null;
  collectTextLines: (value: unknown, lines: string[]) => void;
  summarizeDocSummaryForFinal: (args: {
    transcript: string;
    docSummaryArtifact: Record<string, unknown>;
    activeDocPath?: string | null;
    forceConcise?: boolean;
  }) => string;
  readRequestedBulletCount: (transcript: string) => number | null;
  asksToIncludePath: (transcript: string) => boolean;
};

const readComposerFallbackString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const readComposerFallbackPayloadRecord = (
  artifact: HelixRuntimeComposerSupportRefArtifact,
): RecordLike | null =>
  artifact.payload && typeof artifact.payload === "object" && !Array.isArray(artifact.payload)
    ? (artifact.payload as RecordLike)
    : null;

const readComposerFallbackScalarText = (value: unknown): string | null => {
  const stringValue = readComposerFallbackString(value);
  if (stringValue) return stringValue;
  return typeof value === "number" && Number.isFinite(value) ? String(value) : null;
};

const clipComposerFallbackText = (value: string | undefined, limit: number): string => {
  if (!value) return "";
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}...`;
};

export const createHelixRuntimeDocSummaryFallbackTextBuilder = (
  deps: HelixRuntimeDocSummaryFallbackDependencies,
) => (args: {
  prompt: string;
  artifacts: HelixRuntimeComposerSupportRefArtifact[];
}): string => {
  const summaryArtifact =
    [...args.artifacts].reverse().find((artifact) => artifact.kind === "doc_summary") ??
    [...args.artifacts].reverse().find((artifact) => ["focused_doc_answer", "doc_concept_explanation"].includes(artifact.kind));
  if (!summaryArtifact) return "";
  const payload = deps.readArtifactPayloadRecord(summaryArtifact);
  if (!payload) return "";
  const path =
    deps.normalizeDocPath(payload.path) ??
    deps.normalizeDocPath(payload.source_path) ??
    deps.normalizeDocPath(payload.active_doc_path) ??
    deps.normalizeDocPath(payload.doc_path);
  const textLines: string[] = [];
  deps.collectTextLines(payload.bullets, textLines);
  deps.collectTextLines(payload.key_points, textLines);
  deps.collectTextLines(payload.takeaways, textLines);
  const summaryText =
    deps.readString(payload.summary) ??
    deps.readString(payload.summary_text) ??
    deps.readString(payload.text) ??
    deps.readString(payload.answer_text) ??
    deps.readString(payload.markdown) ??
    deps.readString(payload.content) ??
    "";
  const summarizedText = deps.summarizeDocSummaryForFinal({
    transcript: args.prompt,
    docSummaryArtifact: {
      ...payload,
      text: summaryText || textLines.join("\n"),
    },
    activeDocPath: path,
    forceConcise: true,
  });
  if (summarizedText && !/no summary artifact was produced/i.test(summarizedText)) return summarizedText;
  if (textLines.length === 0 && summaryText) {
    const existingBullets = summaryText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^\s*(?:[-*\u2022]|\d+[.)])\s+\S/.test(line));
    if (existingBullets.length > 0) {
      textLines.push(...existingBullets.map((line) => line.replace(/^\s*(?:[-*â€¢]|\d+[.)])\s+/, "").trim()));
    } else {
      textLines.push(
        ...summaryText
          .split(/\r?\n+/)
          .map((line) => line.trim())
          .filter(Boolean),
      );
    }
  }
  const requestedBulletCount = deps.readRequestedBulletCount(args.prompt) ?? 0;
  const fallbackLines = textLines
    .flatMap((line) => line.split(/(?<=[.!?])\s+(?=[A-Z0-9])/))
    .map((line) => line.trim())
    .filter(Boolean);
  const bulletLines = fallbackLines
    .slice(0, Math.max(requestedBulletCount, Math.min(fallbackLines.length, 4)))
    .map((line) => `- ${line.replace(/^\s*(?:[-*â€¢]|\d+[.)])\s+/, "")}`);
  const output: string[] = [];
  if (path && deps.asksToIncludePath(args.prompt)) output.push(`Path: ${path}`);
  output.push(...bulletLines);
  if (output.length === 0 && path) output.push(`Path: ${path}`);
  return output.join("\n").trim();
};

export const buildHelixScholarlyResearchFallbackText = (args: {
  prompt: string;
  artifacts: HelixRuntimeComposerSupportRefArtifact[];
}): string | null => {
  const lookupPayload = [...args.artifacts]
    .reverse()
    .filter((artifact) => artifact.kind === "scholarly_research_observation")
    .map((artifact) => readComposerFallbackPayloadRecord(artifact))
    .find((payload): payload is RecordLike => Boolean(payload)) ?? null;
  const fullTextPayload = [...args.artifacts]
    .reverse()
    .filter((artifact) => artifact.kind === "scholarly_full_text_observation")
    .map((artifact) => readComposerFallbackPayloadRecord(artifact))
    .find((payload): payload is RecordLike => Boolean(payload)) ?? null;
  if (!lookupPayload && !fullTextPayload) return null;

  const papers = Array.isArray(lookupPayload?.papers) ? lookupPayload.papers : [];
  const firstPaper = papers
    .map((paper) => (paper && typeof paper === "object" && !Array.isArray(paper) ? (paper as RecordLike) : null))
    .find((paper): paper is RecordLike => Boolean(paper)) ?? null;
  const identifiers = firstPaper?.identifiers && typeof firstPaper.identifiers === "object" && !Array.isArray(firstPaper.identifiers)
    ? (firstPaper.identifiers as RecordLike)
    : {};
  const authors = Array.isArray(firstPaper?.authors)
    ? firstPaper.authors
        .map((author) => author && typeof author === "object" && !Array.isArray(author) ? readComposerFallbackString((author as RecordLike).name) : readComposerFallbackString(author))
        .filter((entry): entry is string => Boolean(entry))
        .slice(0, 3)
    : [];
  const title =
    readComposerFallbackString(firstPaper?.title) ??
    readComposerFallbackString(fullTextPayload?.paper_title) ??
    readComposerFallbackString(fullTextPayload?.title) ??
    "selected paper";
  const year = readComposerFallbackScalarText(firstPaper?.year);
  const idText = [
    readComposerFallbackString(identifiers.arxiv_id) ? `arXiv:${readComposerFallbackString(identifiers.arxiv_id)}` : null,
    readComposerFallbackString(identifiers.doi) ? `DOI:${readComposerFallbackString(identifiers.doi)}` : null,
  ].filter((entry): entry is string => Boolean(entry)).join(", ");

  const lines = [
    `Paper: ${title}${authors.length ? `, ${authors.join(", ")}` : ""}${year ? ` (${year})` : ""}${idText ? ` [${idText}]` : ""}.`,
  ];
  const selectedChunks = Array.isArray(fullTextPayload?.selected_chunks) ? fullTextPayload.selected_chunks : [];
  const chunkLines = selectedChunks
    .map((chunk) => (chunk && typeof chunk === "object" && !Array.isArray(chunk) ? (chunk as RecordLike) : null))
    .filter((chunk): chunk is RecordLike => Boolean(chunk))
    .slice(0, 5)
    .map((chunk) => {
      const pageStart = readComposerFallbackScalarText(chunk.page_start);
      const pageEnd = readComposerFallbackScalarText(chunk.page_end);
      const pageLabel = pageStart
        ? pageEnd && pageEnd !== pageStart
          ? `pages ${pageStart}-${pageEnd}`
          : `page ${pageStart}`
        : "selected excerpt";
      const ref =
        readComposerFallbackString(chunk.chunk_ref) ??
        readComposerFallbackString(chunk.source_text_ref) ??
        readComposerFallbackString(chunk.citation_ref);
      const excerpt = clipComposerFallbackText(
        readComposerFallbackString(chunk.summary) ?? readComposerFallbackString(chunk.text_excerpt) ?? "",
        420,
      );
      return excerpt ? `- ${pageLabel}${ref ? ` (${ref})` : ""}: ${excerpt}` : null;
    })
    .filter((entry): entry is string => Boolean(entry));

  if (chunkLines.length > 0) {
    lines.push("Relevant PDF/full-text excerpts selected for this prompt:");
    lines.push(...chunkLines);
  } else if (papers.length > 0) {
    lines.push("I found paper metadata, but no selected full-text chunks were available for extraction in this turn.");
  }

  const supportRefs = collectHelixRuntimeComposerScholarlySupportRefs(args.artifacts);
  if (supportRefs.length > 0) {
    lines.push(`Support refs: ${supportRefs.slice(0, 8).join("; ")}.`);
  }
  return lines.join("\n");
};

export const buildHelixInternetSearchFallbackText = (args: {
  prompt: string;
  artifacts: HelixRuntimeComposerSupportRefArtifact[];
}): string | null => {
  const observationPayload = [...args.artifacts]
    .reverse()
    .filter((artifact) => artifact.kind === "internet_search_observation")
    .map((artifact) => readComposerFallbackPayloadRecord(artifact))
    .find((payload): payload is RecordLike => Boolean(payload)) ?? null;
  if (!observationPayload) return null;
  const results = Array.isArray(observationPayload.results) ? observationPayload.results : [];
  const resultLines = results
    .map((result) => (result && typeof result === "object" && !Array.isArray(result) ? (result as RecordLike) : null))
    .filter((result): result is RecordLike => Boolean(result))
    .slice(0, 5)
    .map((result) => {
      const title = readComposerFallbackString(result.title) ?? readComposerFallbackString(result.url) ?? "web result";
      const url = readComposerFallbackString(result.url);
      const snippet = clipComposerFallbackText(
        readComposerFallbackString(result.snippet) ?? readComposerFallbackString(result.summary) ?? "",
        420,
      );
      return `- ${title}${url ? ` (${url})` : ""}${snippet ? `: ${snippet}` : ""}`;
    });
  if (resultLines.length === 0) {
    const missing = Array.isArray(observationPayload.missing_requirements)
      ? observationPayload.missing_requirements.map((entry) => readComposerFallbackString(entry)).filter((entry): entry is string => Boolean(entry))
      : [];
    return `Internet search did not return selected web results${missing.length ? ` (${missing.join(", ")})` : ""}.`;
  }
  const lines = [
    "Web sources found for the prompt:",
    ...resultLines,
  ];
  const supportRefs = collectHelixRuntimeComposerInternetSearchSupportRefs(args.artifacts);
  if (supportRefs.length > 0) {
    lines.push(`Support refs: ${supportRefs.slice(0, 8).join("; ")}.`);
  }
  return lines.join("\n");
};

export const buildHelixRuntimeWorkspaceOsStatusFallbackText = (
  artifacts: HelixRuntimeComposerSupportRefArtifact[],
): string => {
  const statusArtifact = [...artifacts].reverse().find((artifact) => artifact.kind === "workspace_os_status_observation");
  const payload = statusArtifact ? readComposerFallbackPayloadRecord(statusArtifact) : null;
  if (!payload) return "";
  const summary = payload.summary && typeof payload.summary === "object" && !Array.isArray(payload.summary)
    ? (payload.summary as RecordLike)
    : {};
  const counts = [
    `available ${Number(summary.available_count ?? 0)}`,
    `degraded ${Number(summary.degraded_count ?? 0)}`,
    `blocked ${Number(summary.blocked_count ?? 0)}`,
    `error ${Number(summary.error_count ?? 0)}`,
    `unknown ${Number(summary.unknown_count ?? 0)}`,
  ].join(", ");
  const noteworthy = Array.isArray(payload.noteworthy_capabilities)
    ? payload.noteworthy_capabilities
        .map((entry) => (entry && typeof entry === "object" && !Array.isArray(entry) ? (entry as RecordLike) : null))
        .filter((entry): entry is RecordLike => Boolean(entry))
        .slice(0, 8)
    : [];
  const lines = [`Workspace OS status is diagnostic only. Summary: ${counts}.`];
  if (noteworthy.length > 0) {
    lines.push("Notable capabilities:");
    for (const capability of noteworthy) {
      const id = readComposerFallbackString(capability.capability_id) ?? "unknown";
      const status = readComposerFallbackString(capability.status) ?? "unknown";
      const reason =
        readComposerFallbackString(capability.failure_reason) ??
        readComposerFallbackString(capability.missing_reason) ??
        readComposerFallbackString(capability.next_required_action);
      lines.push(`- ${id}: ${status}${reason ? ` (${reason})` : ""}`);
    }
  }
  return lines.join("\n").trim();
};
