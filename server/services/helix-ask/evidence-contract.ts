import { explainPrecedenceConflicts, rankPathsByPrecedence, type RetrievalContract } from "./retrieval-contract";

export type ObligationEvidenceStatus = "covered" | "partial" | "missing";

export type ObligationEvidence = {
  obligation_id: string;
  status: ObligationEvidenceStatus;
  supporting_repo_paths: string[];
  supporting_snippets: string[];
  claim_tier: "canonical-authoritative" | "promoted-candidate" | "exploratory" | "UNKNOWN";
  conflict_markers: Array<{
    higher_precedence_path: string;
    lower_precedence_path: string;
    note: string;
  }>;
};

type ObligationCoverageInput = {
  obligation_id: string;
  status: ObligationEvidenceStatus;
  evidence_refs: string[];
};

type EvidenceBlockInput = {
  content: string;
  citations: string[];
};

const normalizeWhitespace = (value: string): string =>
  String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();

const unique = (values: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = normalizeWhitespace(value).replace(/\\/g, "/");
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
};

const inferClaimTier = (paths: string[], retrievalContract?: RetrievalContract | null) => {
  const normalizedPaths = unique(paths);
  const precedence = new Set(
    (retrievalContract?.precedence_paths ?? []).map((entry) => entry.toLowerCase()),
  );
  const mustRead = new Set(
    (retrievalContract?.must_read_paths ?? []).map((entry) => entry.toLowerCase()),
  );
  if (normalizedPaths.some((entry) => precedence.has(entry.toLowerCase()))) {
    return "canonical-authoritative" as const;
  }
  if (normalizedPaths.some((entry) => mustRead.has(entry.toLowerCase()))) {
    return "canonical-authoritative" as const;
  }
  if (
    normalizedPaths.some((entry) =>
      /^(?:docs\/audits\/research|docs\/specs|artifacts\/research)\//i.test(entry),
    )
  ) {
    return "promoted-candidate" as const;
  }
  if (normalizedPaths.some((entry) => /^(?:docs|modules|server|client|shared|scripts)\//i.test(entry))) {
    return "exploratory" as const;
  }
  return "UNKNOWN" as const;
};

export const buildObligationEvidence = (args: {
  obligationCoverage: ObligationCoverageInput[];
  evidenceBlocks: EvidenceBlockInput[];
  retrievalContract?: RetrievalContract | null;
}): ObligationEvidence[] => {
  return args.obligationCoverage.map((coverage) => {
    const supportingRepoPaths = rankPathsByPrecedence(
      coverage.evidence_refs,
      args.retrievalContract?.precedence_paths ?? [],
      8,
    );
    const supportingSnippets = args.evidenceBlocks
      .filter((block) =>
        block.citations.some((citation) =>
          supportingRepoPaths.some((path) => path.toLowerCase() === citation.toLowerCase()),
        ),
      )
      .map((block) => normalizeWhitespace(block.content))
      .filter(Boolean)
      .slice(0, 4);
    return {
      obligation_id: coverage.obligation_id,
      status: coverage.status,
      supporting_repo_paths: supportingRepoPaths,
      supporting_snippets: supportingSnippets,
      claim_tier: inferClaimTier(supportingRepoPaths, args.retrievalContract),
      conflict_markers: explainPrecedenceConflicts(
        supportingRepoPaths,
        args.retrievalContract?.precedence_paths ?? [],
      ),
    };
  });
};
