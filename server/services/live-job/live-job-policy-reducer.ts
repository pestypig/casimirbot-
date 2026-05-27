import type { LiveJobPolicyObservation } from "@shared/live-job-policy-observation";
import { LIVE_JOB_POLICY_OBSERVATION_SCHEMA } from "@shared/live-job-policy-observation";
import type { LiveSourceObservation } from "@shared/live-source-observation";
import type { SituationRoomLiveJobContract } from "@shared/situation-room-live-job-contract";
import { makeLiveJobPolicyObservationId } from "./live-job-policy-observation-store";

const thresholdRank: Record<"observed" | "likely" | "confirmed", number> = {
  observed: 1,
  likely: 2,
  confirmed: 3,
};

const routeEvidenceRank = (status: string | undefined): number => {
  if (status === "drift_confirmed") return 3;
  if (status === "drift_candidate") return 1;
  if (status === "on_route") return 3;
  return 0;
};

const policyThreshold = (
  contract: SituationRoomLiveJobContract,
): "observed" | "likely" | "confirmed" =>
  contract.compiled_policy.evidence_threshold ?? "observed";

const ruleMatches = (rules: string[], ...candidates: string[]): boolean =>
  rules.some((rule) => candidates.includes(rule));

const hasOutputBinding = (
  contract: SituationRoomLiveJobContract,
  outputKind: LiveJobPolicyObservation["output_candidates"][number]["output_kind"],
): boolean =>
  contract.output_bindings.some((binding) => binding.output_kind === outputKind && binding.status !== "disabled");

const voicePolicyAllowsProposal = (contract: SituationRoomLiveJobContract): boolean =>
  contract.voice_policy === "propose_only" ||
  contract.voice_policy === "confirm_speak_required" ||
  contract.voice_policy === "automatic_when_policy_allows";

const buildObservation = (input: {
  contract: SituationRoomLiveJobContract;
  sourceObservation: LiveSourceObservation;
  status: LiveJobPolicyObservation["status"];
  eventKind: LiveJobPolicyObservation["event_kind"];
  summary: string;
  triggerMatched: boolean;
  matchedRules?: string[];
  suppressed?: boolean;
  suppressionReason?: string;
  confidence?: "low" | "medium" | "high";
  missingRequirements?: LiveJobPolicyObservation["missing_requirements"];
  outputCandidates?: LiveJobPolicyObservation["output_candidates"];
}): LiveJobPolicyObservation => {
  const matchedRules = input.matchedRules ?? [];
  const observation: LiveJobPolicyObservation = {
    schema: LIVE_JOB_POLICY_OBSERVATION_SCHEMA,
    observation_id: makeLiveJobPolicyObservationId({
      contractId: input.contract.contract_id,
      sourceObservationRefs: [input.sourceObservation.observation_id],
      eventKind: input.eventKind,
      summary: input.summary,
    }),
    contract_id: input.contract.contract_id,
    source_observation_refs: [input.sourceObservation.observation_id],
    job_name: input.contract.name,
    status: input.status,
    event_kind: input.eventKind,
    summary: input.summary,
    policy_evaluation: {
      operating_prompt_ref: input.contract.contract_id,
      trigger_matched: input.triggerMatched,
      matched_rules: matchedRules,
      suppressed: input.suppressed ?? !input.triggerMatched,
      suppression_reason: input.suppressionReason,
      evidence_threshold: policyThreshold(input.contract),
      confidence: input.confidence ?? "medium",
    },
    missing_requirements: input.missingRequirements ?? [],
    output_candidates: input.outputCandidates ?? [],
    assistant_answer: false,
    raw_content_included: false,
    terminal_eligible: false,
  };
  return observation;
};

export function reduceLiveJobPolicyObservation(params: {
  contract: SituationRoomLiveJobContract;
  sourceObservation: LiveSourceObservation;
  now?: Date;
}): LiveJobPolicyObservation {
  const { contract, sourceObservation } = params;
  const triggerRules = contract.compiled_policy.trigger_rules ?? [];
  const relevantRequirements = contract.source_requirements.filter(
    (source) => source.source_kind === sourceObservation.source_kind,
  );
  const missingRequiredSources = contract.source_requirements.filter(
    (source) => source.required && source.status !== "connected",
  );

  if (missingRequiredSources.length > 0 && sourceObservation.freshness.status === "missing") {
    const missingRequirements = missingRequiredSources.map((source) => ({
      requirement: source.source_kind,
      reason: source.missing_reason ?? "Required source is not connected.",
      repair_action: "attach_source",
    }));
    const voiceEligible = voicePolicyAllowsProposal(contract) &&
      ruleMatches(triggerRules, "required_source_missing", "missing_required_source", "source_missing");
    return buildObservation({
      contract,
      sourceObservation,
      status: "blocked",
      eventKind: "source_missing",
      summary: `${contract.name} is blocked by missing required source.`,
      triggerMatched: voiceEligible,
      matchedRules: voiceEligible ? ["required_source_missing"] : [],
      suppressed: !voiceEligible,
      suppressionReason: voiceEligible ? undefined : "missing_source_callout_not_enabled",
      confidence: "high",
      missingRequirements,
      outputCandidates: [
        {
          output_kind: "source_health_status",
          eligible: hasOutputBinding(contract, "source_health_status") || true,
          text: "Minecraft source missing.",
          reason: "Required live source is missing.",
        },
        {
          output_kind: "voice_proposal",
          eligible: voiceEligible,
          text: "Minecraft source missing.",
          reason: voiceEligible ? "Voice policy allows missing-source proposal." : "Voice callout is suppressed by policy.",
        },
      ],
    });
  }

  if (
    sourceObservation.freshness.status === "stale" ||
    relevantRequirements.some((source) => source.status === "stale")
  ) {
    const voiceEligible = voicePolicyAllowsProposal(contract) &&
      ruleMatches(triggerRules, "required_source_stale", "source_stale");
    return buildObservation({
      contract,
      sourceObservation,
      status: "stale",
      eventKind: "source_stale",
      summary: `${contract.name} observed stale source evidence.`,
      triggerMatched: voiceEligible,
      matchedRules: voiceEligible ? ["required_source_stale"] : [],
      suppressed: !voiceEligible,
      suppressionReason: voiceEligible ? undefined : "stale_source_callout_not_enabled",
      confidence: "high",
      missingRequirements: [],
      outputCandidates: [
        {
          output_kind: "source_health_status",
          eligible: true,
          text: "World source is stale.",
          reason: "Live source freshness exceeded the stale threshold.",
        },
        {
          output_kind: "voice_proposal",
          eligible: voiceEligible,
          text: "World source is stale.",
          reason: voiceEligible ? "Voice policy allows stale-source proposal." : "Voice callout is suppressed by policy.",
        },
      ],
    });
  }

  if (sourceObservation.payload_summary?.route_state?.status === "on_route") {
    return buildObservation({
      contract,
      sourceObservation,
      status: "suppressed",
      eventKind: "route_clean",
      summary: `${contract.name} is holding quiet; route evidence is clean.`,
      triggerMatched: false,
      suppressed: true,
      suppressionReason: "route_clean",
      confidence: "high",
      outputCandidates: [
        {
          output_kind: "route_evidence",
          eligible: hasOutputBinding(contract, "route_evidence"),
          text: "Route evidence is clean.",
          reason: "Current route state is on_route.",
        },
        {
          output_kind: "live_answers_card",
          eligible: hasOutputBinding(contract, "live_answers_card"),
          text: "Route clean.",
          reason: "Live Answers may project non-terminal route status.",
        },
      ],
    });
  }

  if (sourceObservation.payload_summary?.route_state?.status === "drift_candidate") {
    const threshold = policyThreshold(contract);
    const triggerMatched = thresholdRank[threshold] <= routeEvidenceRank("drift_candidate") &&
      ruleMatches(triggerRules, "route_drift_candidate", "drift_candidate");
    return buildObservation({
      contract,
      sourceObservation,
      status: triggerMatched ? "trigger_matched" : "observed",
      eventKind: "route_drift_candidate",
      summary: triggerMatched
        ? `${contract.name} matched route drift candidate policy.`
        : `${contract.name} observed route drift candidate below callout threshold.`,
      triggerMatched,
      matchedRules: triggerMatched ? ["route_drift_candidate"] : [],
      suppressed: !triggerMatched,
      suppressionReason: triggerMatched ? undefined : "below_confirmed_threshold",
      confidence: "medium",
      outputCandidates: [
        {
          output_kind: "route_evidence",
          eligible: hasOutputBinding(contract, "route_evidence"),
          text: "Route drift candidate observed.",
          reason: "Minecraft route state reported drift_candidate.",
        },
        {
          output_kind: "voice_proposal",
          eligible: triggerMatched && voicePolicyAllowsProposal(contract),
          text: "Route drift candidate.",
          reason: triggerMatched ? "Policy threshold permits candidate callout." : "Policy threshold requires stronger evidence.",
        },
      ],
    });
  }

  if (sourceObservation.payload_summary?.route_state?.status === "drift_confirmed") {
    const triggerMatched = ruleMatches(triggerRules, "route_drift_confirmed", "confirmed_route_drift", "route_drift");
    const voiceEligible = triggerMatched && voicePolicyAllowsProposal(contract);
    return buildObservation({
      contract,
      sourceObservation,
      status: "trigger_matched",
      eventKind: "route_drift_confirmed",
      summary: `${contract.name} detected confirmed route drift.`,
      triggerMatched,
      matchedRules: triggerMatched ? ["route_drift_confirmed"] : [],
      suppressed: !triggerMatched,
      suppressionReason: triggerMatched ? undefined : "route_drift_trigger_not_configured",
      confidence: "high",
      outputCandidates: [
        {
          output_kind: "route_evidence",
          eligible: hasOutputBinding(contract, "route_evidence"),
          text: "Route drift confirmed.",
          reason: "Minecraft route state reported drift_confirmed.",
        },
        {
          output_kind: "typed_commentary",
          eligible: hasOutputBinding(contract, "typed_commentary"),
          text: "Route drift confirmed.",
          reason: "Confirmed route drift is eligible for typed commentary.",
        },
        {
          output_kind: "voice_proposal",
          eligible: voiceEligible,
          text: "Route drift confirmed.",
          reason: voiceEligible ? "Voice proposal is policy-eligible." : "Voice proposal is not enabled by policy.",
        },
        {
          output_kind: "live_answers_card",
          eligible: hasOutputBinding(contract, "live_answers_card"),
          text: "Route drift confirmed.",
          reason: "Live Answers may project route evidence.",
        },
      ],
    });
  }

  if (sourceObservation.event_kind === "direct_address") {
    const triggerMatched = ruleMatches(triggerRules, "direct_address_detected", "direct_question");
    return buildObservation({
      contract,
      sourceObservation,
      status: "trigger_matched",
      eventKind: "direct_address_detected",
      summary: `${contract.name} detected direct address for Helix Ask.`,
      triggerMatched,
      matchedRules: triggerMatched ? ["direct_address_detected"] : [],
      suppressed: false,
      confidence: "medium",
      outputCandidates: [
        {
          output_kind: "typed_commentary",
          eligible: true,
          text: "Direct address detected.",
          reason: "Direct address should re-enter Helix Ask rather than become a Dottie answer.",
        },
      ],
    });
  }

  if (sourceObservation.event_kind === "visual_summary") {
    return buildObservation({
      contract,
      sourceObservation,
      status: "suppressed",
      eventKind: "visual_context_updated",
      summary: `${contract.name} received visual context with no trigger matched.`,
      triggerMatched: false,
      suppressed: true,
      suppressionReason: "visual_update_no_trigger",
      confidence: sourceObservation.provenance.confidence,
      outputCandidates: [
        {
          output_kind: "live_answers_card",
          eligible: hasOutputBinding(contract, "live_answers_card"),
          text: "Visual context updated.",
          reason: "Visual updates project to Live Answers unless a trigger matches.",
        },
      ],
    });
  }

  return buildObservation({
    contract,
    sourceObservation,
    status: "suppressed",
    eventKind: "no_trigger_matched",
    summary: `${contract.name} observed source evidence with no trigger matched.`,
    triggerMatched: false,
    suppressed: true,
    suppressionReason: "no_trigger_matched",
    confidence: sourceObservation.provenance.confidence,
    outputCandidates: [
      {
        output_kind: "live_answers_card",
        eligible: hasOutputBinding(contract, "live_answers_card"),
        text: "Live source updated.",
        reason: "Source update is evidence only.",
      },
    ],
  });
}
