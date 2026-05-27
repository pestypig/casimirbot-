import crypto from "node:crypto";
import type { LiveJobPolicyObservation } from "@shared/live-job-policy-observation";
import {
  VOICE_PROPOSAL_SCHEMA,
  type VoiceProposal,
} from "@shared/voice-proposal";
import type { SituationRoomLiveJobContract } from "@shared/situation-room-live-job-contract";

const proposalsById = new Map<string, VoiceProposal>();
const proposalIdsByContract = new Map<string, string[]>();

const hashShort = (value: unknown, size = 20): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export function createVoiceProposalFromPolicyObservation(input: {
  contract: SituationRoomLiveJobContract;
  policyObservation: LiveJobPolicyObservation;
}): VoiceProposal | null {
  const candidate = input.policyObservation.output_candidates.find(
    (entry) => entry.output_kind === "voice_proposal" && entry.eligible && entry.text,
  );
  if (!candidate?.text) return null;
  if (input.contract.voice_policy === "muted") return null;

  const proposal: VoiceProposal = {
    schema: VOICE_PROPOSAL_SCHEMA,
    proposal_id: `voice_proposal:${hashShort([
      input.contract.contract_id,
      input.policyObservation.observation_id,
      candidate.text,
    ])}`,
    source_observation_refs: [
      input.policyObservation.observation_id,
      ...input.policyObservation.source_observation_refs,
    ],
    proposed_text: candidate.text,
    reason: candidate.reason,
    voice_policy: input.contract.voice_policy,
    spoken: false,
    confirm_speak_receipt_present: false,
    output_authority: "proposal",
    assistant_answer: false,
    raw_content_included: false,
  };

  proposalsById.set(proposal.proposal_id, proposal);
  const current = proposalIdsByContract.get(input.contract.contract_id) ?? [];
  proposalIdsByContract.set(
    input.contract.contract_id,
    Array.from(new Set([...current, proposal.proposal_id])).slice(-200),
  );
  return proposal;
}

export function getVoiceProposal(proposalId: string): VoiceProposal | null {
  return proposalsById.get(proposalId) ?? null;
}

export function listVoiceProposals(input: {
  contractId?: string | null;
  limit?: number;
} = {}): VoiceProposal[] {
  const limit = Number.isFinite(input.limit) ? Math.max(0, Math.min(200, Math.trunc(input.limit ?? 50))) : 50;
  const ids = input.contractId
    ? proposalIdsByContract.get(input.contractId) ?? []
    : Array.from(proposalsById.keys());
  return ids
    .map((id) => proposalsById.get(id))
    .filter((entry): entry is VoiceProposal => Boolean(entry))
    .slice(-limit);
}

export function resetVoiceProposalStoreForTest(): void {
  proposalsById.clear();
  proposalIdsByContract.clear();
}
