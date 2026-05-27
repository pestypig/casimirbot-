import type { LiveJobPolicyObservation } from "@shared/live-job-policy-observation";
import type { LiveSourceObservation } from "@shared/live-source-observation";
import type { VoiceProposal } from "@shared/voice-proposal";
import type { SituationRoomLiveJobContract } from "@shared/situation-room-live-job-contract";
import { recordLiveSourceObservation } from "../live-source/live-source-observation-store";
import { createVoiceProposalFromPolicyObservation } from "../voice/voice-proposal-store";
import { recordLiveJobPolicyObservation } from "./live-job-policy-observation-store";
import { reduceLiveJobPolicyObservation } from "./live-job-policy-reducer";

export type LiveJobRuntimeReductionResult = {
  source_observation: LiveSourceObservation;
  policy_observation: LiveJobPolicyObservation;
  voice_proposal: VoiceProposal | null;
  assistant_answer: false;
  raw_content_included: false;
};

export function reduceAndRecordLiveJobSourceObservation(input: {
  contract: SituationRoomLiveJobContract;
  sourceObservation: LiveSourceObservation;
  thread_id?: string | null;
  room_id?: string | null;
  environment_id?: string | null;
  now?: Date;
}): LiveJobRuntimeReductionResult {
  const sourceObservation = recordLiveSourceObservation({
    ...input.sourceObservation,
    job_contract_ids: Array.from(new Set([
      ...(input.sourceObservation.job_contract_ids ?? []),
      input.contract.contract_id,
    ])),
  });
  const policyObservation = reduceLiveJobPolicyObservation({
    contract: input.contract,
    sourceObservation,
    now: input.now,
  });
  const recordedPolicyObservation = recordLiveJobPolicyObservation({
    observation: policyObservation,
    thread_id: input.thread_id ?? sourceObservation.thread_id ?? null,
    room_id: input.room_id ?? sourceObservation.room_id ?? null,
    environment_id: input.environment_id ?? sourceObservation.environment_id ?? null,
  });
  const voiceProposal = createVoiceProposalFromPolicyObservation({
    contract: input.contract,
    policyObservation: recordedPolicyObservation,
  });

  return {
    source_observation: sourceObservation,
    policy_observation: recordedPolicyObservation,
    voice_proposal: voiceProposal,
    assistant_answer: false,
    raw_content_included: false,
  };
}
