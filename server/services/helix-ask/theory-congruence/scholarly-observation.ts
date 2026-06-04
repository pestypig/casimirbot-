import type {
  TheoryCongruenceTraceV1,
  TheoryEvidenceObservation,
} from "../../../../shared/helix-theory-congruence-trace";
import type {
  HelixScholarlyFullTextObservation,
  HelixScholarlyResearchObservation,
} from "../../../../shared/helix-scholarly-research-observation";

export type BuildScholarlyTheoryObservationInput = {
  turnId: string;
  researchObservation?: HelixScholarlyResearchObservation | null;
  fullTextObservation?: HelixScholarlyFullTextObservation | null;
  metadataFailed?: boolean;
};

function extractArxivId(query: string): string | null {
  return query.match(/\barxiv:\s*([0-9]{4}\.[0-9]{4,5}(?:v\d+)?)\b/i)?.[1] ?? null;
}

function arxivPdfUrl(arxivId: string): string {
  return `https://arxiv.org/pdf/${arxivId.replace(/v\d+$/i, "")}.pdf`;
}

export function buildScholarlyPaperSources(
  input: BuildScholarlyTheoryObservationInput,
): TheoryCongruenceTraceV1["paper_sources"] {
  const papers = input.researchObservation?.papers ?? [];
  const exactArxiv = extractArxivId(input.researchObservation?.query ?? input.fullTextObservation?.query ?? "");
  const fullText = input.fullTextObservation ?? null;
  if (fullText && fullText.pages_parsed > 0) {
    return [{
      paper_id: fullText.paper_result_id ?? exactArxiv ?? fullText.artifact_id,
      source_kind: exactArxiv ? "direct_pdf" : "manual",
      status: "pdf_extracted",
      ...(fullText.title ? { title: fullText.title } : {}),
      ...(fullText.source_url ? { pdf_url: fullText.source_url } : exactArxiv ? { pdf_url: arxivPdfUrl(exactArxiv) } : {}),
      page_count: fullText.total_pages ?? fullText.pages_parsed,
      span_refs: fullText.selected_chunks.map((chunk) => chunk.citation_ref),
    }];
  }

  if (papers.length > 0) {
    return papers.slice(0, 4).map((paper) => ({
      paper_id: paper.identifiers.arxiv_id ?? paper.identifiers.doi ?? paper.result_id,
      source_kind: paper.identifiers.arxiv_id ? "arxiv" : paper.source_providers.includes("semantic_scholar") ? "semantic_scholar" : "manual",
      status: "resolved",
      title: paper.title,
      ...(paper.identifiers.pdf_url ? { pdf_url: paper.identifiers.pdf_url } : {}),
      span_refs: paper.evidence_refs,
    }));
  }

  if (exactArxiv && input.metadataFailed) {
    return [{
      paper_id: exactArxiv,
      source_kind: "direct_pdf",
      status: "metadata_failed",
      pdf_url: arxivPdfUrl(exactArxiv),
      span_refs: [],
    }];
  }

  return [];
}

export function buildScholarlyTheoryObservation(
  input: BuildScholarlyTheoryObservationInput,
): TheoryEvidenceObservation {
  const paperSources = buildScholarlyPaperSources(input);
  return {
    id: `scholarly-probe:${input.turnId}`,
    lane: "scholarly_probe",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    status: paperSources.length > 0 ? "ok" : "missing",
    source_refs: paperSources.flatMap((paper) => [paper.paper_id, paper.pdf_url ?? ""]).filter(Boolean),
    compact_summary: paperSources.length > 0
      ? `Resolved ${paperSources.length} scholarly paper source(s) for theory trace.`
      : "No scholarly paper source was resolved.",
    missing_requirements: paperSources.length > 0 ? [] : ["paper_source_observation"],
    suggested_next_tools: paperSources.length > 0 ? [] : ["scholarly_probe"],
  };
}
