import { z } from "zod";

export const HELIX_ASK_TYPED_FAIL_REASONS = [
  "SCHEMA_ERROR",
  "VALIDATION_FAIL",
  "GENERIC_COLLAPSE",
  "LOW_EVIDENCE_UTILIZATION",
  "TIMEOUT",
  "SCIENTIFIC_METHOD_MISSING_SLOT",
  "TELEMETRY_LEAK_IN_ANSWER",
] as const;

export type HelixAskTypedFailReason = (typeof HELIX_ASK_TYPED_FAIL_REASONS)[number];

export const HELIX_ASK_PROOF_PACKET_EVIDENCE_SCHEMA = z
  .object({
    id: z.string().min(1),
    citation: z.string().min(1),
    excerpt: z.string().min(1).optional(),
  })
  .strict();

export const HELIX_ASK_STRUCTURED_ANSWER_CONTRACT_V1_SCHEMA = z
  .object({
    schemaVersion: z.literal("v1"),
    summary: z.string().min(1),
    claims: z
      .array(
        z
          .object({
            id: z.string().min(1),
            text: z.string().min(1),
            evidenceIds: z.array(z.string().min(1)).max(8).default([]),
          })
          .strict(),
      )
      .max(8)
      .default([]),
    uncertainty: z.string().optional(),
  })
  .strict();

export type HelixAskStructuredAnswerContractV1 = z.infer<
  typeof HELIX_ASK_STRUCTURED_ANSWER_CONTRACT_V1_SCHEMA
>;

export const HELIX_ASK_PROOF_PACKET_V1_SCHEMA = z
  .object({
    schemaVersion: z.literal("v1"),
    question: z.string().min(1),
    evidence: z.array(HELIX_ASK_PROOF_PACKET_EVIDENCE_SCHEMA).max(24).default([]),
    contract: HELIX_ASK_STRUCTURED_ANSWER_CONTRACT_V1_SCHEMA,
  })
  .strict();

export type HelixAskProofPacketV1 = z.infer<typeof HELIX_ASK_PROOF_PACKET_V1_SCHEMA>;

export function renderDeterministicCitationsByEvidenceIds(
  evidenceIds: string[],
  evidence: Array<{ id: string; citation: string }>,
): string[] {
  if (!Array.isArray(evidenceIds) || evidenceIds.length === 0) return [];
  const evidenceLookup = new Map(evidence.map((entry) => [entry.id, entry.citation]));
  const unique = new Set<string>();
  for (const id of evidenceIds) {
    const citation = evidenceLookup.get(id);
    if (citation) unique.add(citation);
  }
  return Array.from(unique);
}

export function renderTaggedSectionFallback(args: {
  summary: string;
  claims: string[];
  citations: string[];
}): string {
  const sections = [
    `[answer.summary]\n${args.summary.trim()}`,
    `[answer.claims]\n${args.claims.filter(Boolean).map((claim) => `- ${claim.trim()}`).join("\n")}`,
    `[answer.sources]\n${args.citations.filter(Boolean).join(", ") || "none"}`,
  ];
  return sections.join("\n\n").trim();
}
