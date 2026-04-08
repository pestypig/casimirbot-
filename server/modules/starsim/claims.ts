import type { CanonicalStar, TreeDagClaim } from "./contract";

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))));

export function collectCanonicalEvidenceRefs(star: CanonicalStar): string[] {
  const provenanceRefs = Object.values(star.fields)
    .flatMap((section) => Object.values(section).map((field) => field.provenance_ref))
    .filter((value): value is string => Boolean(value));
  return uniqueStrings([...star.evidence_refs, ...provenanceRefs]);
}

export function buildTreeDagClaim(input: {
  claim_id: string;
  parent_claim_ids?: string[];
  equation_refs?: string[];
  evidence_refs?: string[];
}): TreeDagClaim {
  return {
    claim_id: input.claim_id,
    parent_claim_ids: uniqueStrings(input.parent_claim_ids ?? []),
    equation_refs: uniqueStrings(input.equation_refs ?? []),
    evidence_refs: uniqueStrings(input.evidence_refs ?? []),
  };
}
