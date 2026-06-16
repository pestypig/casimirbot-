import crypto from "node:crypto";
import {
  STAGE_PLAY_ADAPTIVE_VISUAL_LENS_PROPOSAL_SCHEMA,
  type StagePlayAdaptiveVisualLensProposalV1,
} from "@shared/contracts/stage-play-adaptive-visual-lens.v1";

const proposalsById = new Map<string, StagePlayAdaptiveVisualLensProposalV1>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

export function recordStagePlayAdaptiveVisualLensProposal(
  input: Omit<StagePlayAdaptiveVisualLensProposalV1,
    | "artifactId"
    | "schemaVersion"
    | "proposalId"
    | "evidenceRefs"
    | "assistant_answer"
    | "terminal_eligible"
    | "raw_content_included"
    | "context_role"
    | "ask_context_policy"
  > & {
    proposalId?: string;
    evidenceRefs?: string[];
  },
): StagePlayAdaptiveVisualLensProposalV1 {
  const proposalId = input.proposalId ?? `stage_play_adaptive_visual_lens_proposal:${hashShort([
    input.threadId,
    input.sourceId,
    input.activeProfileId ?? null,
    input.candidateProfileId ?? null,
    input.recognizedSubject,
    input.decision,
    input.mailIds,
    input.createdAt,
  ])}`;
  const proposal: StagePlayAdaptiveVisualLensProposalV1 = {
    artifactId: "stage_play_adaptive_visual_lens_proposal",
    schemaVersion: STAGE_PLAY_ADAPTIVE_VISUAL_LENS_PROPOSAL_SCHEMA,
    ...input,
    proposalId,
    evidenceRefs: uniqueStrings([
      proposalId,
      input.sourceId,
      input.activeProfileId ?? null,
      input.candidateProfileId ?? null,
      ...(input.mailIds ?? []),
      ...(input.microReasonerRunRefs ?? []),
      ...(input.evidenceRefs ?? []),
    ]),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
  };
  proposalsById.set(proposal.proposalId, proposal);
  return proposal;
}

export function getStagePlayAdaptiveVisualLensProposal(
  proposalId: string,
): StagePlayAdaptiveVisualLensProposalV1 | null {
  return proposalsById.get(proposalId) ?? null;
}

export function listStagePlayAdaptiveVisualLensProposals(input: {
  threadId?: string | null;
  sourceId?: string | null;
  limit?: number;
} = {}): StagePlayAdaptiveVisualLensProposalV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 50, 250));
  return Array.from(proposalsById.values())
    .filter((proposal) => !input.threadId || proposal.threadId === input.threadId)
    .filter((proposal) => !input.sourceId || proposal.sourceId === input.sourceId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-limit);
}

export function getLatestStagePlayAdaptiveVisualLensProposal(input: {
  threadId?: string | null;
  sourceId?: string | null;
} = {}): StagePlayAdaptiveVisualLensProposalV1 | null {
  return listStagePlayAdaptiveVisualLensProposals({
    threadId: input.threadId,
    sourceId: input.sourceId,
    limit: 1,
  }).at(-1) ?? null;
}

export function resetStagePlayAdaptiveVisualLensStoreForTest(): void {
  proposalsById.clear();
}
