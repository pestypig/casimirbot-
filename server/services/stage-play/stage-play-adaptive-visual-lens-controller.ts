import {
  STAGE_PLAY_ADAPTIVE_VISUAL_LENS_APPLY_RESULT_SCHEMA,
  type StagePlayAdaptiveVisualLensApplyResultV1,
  type StagePlayAdaptiveVisualLensDecisionV1,
  type StagePlayAdaptiveVisualLensDriftStateV1,
  type StagePlayAdaptiveVisualLensProposalV1,
  type StagePlayAdaptiveVisualLensSuggestedProfileDraftV1,
} from "@shared/contracts/stage-play-adaptive-visual-lens.v1";
import type { StagePlayVisualObserverProfileV1 } from "@shared/contracts/stage-play-visual-observer-profile.v1";
import {
  listStagePlayLiveSourceMailItems,
} from "./stage-play-live-source-mailbox-store";
import {
  getStagePlayAdaptiveVisualLensProposal,
  recordStagePlayAdaptiveVisualLensProposal,
} from "./stage-play-adaptive-visual-lens-store";
import {
  applyStagePlayVisualObserverProfile,
  getActiveStagePlayVisualObserverProfileForSource,
  getStagePlayVisualObserverProfile,
  listStagePlayVisualObserverProfiles,
  recordStagePlayVisualObserverProfile,
} from "./stage-play-visual-observer-profile-store";
import {
  listStagePlayMicroReasonerRuns,
} from "./stage-play-processed-mail-packet-store";

const ADAPTIVE_VISUAL_LENS_MIN_CONFIDENCE = 0.68;

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const normalizeText = (value: string): string => value.toLowerCase().replace(/\s+/g, " ").trim();

const textMatches = (text: string, patterns: RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(text));

const promptPreview = (prompt: string): string =>
  prompt.trim().split(/\n+/).slice(0, 18).join("\n");

const profileDraftFromProfile = (
  profile: StagePlayVisualObserverProfileV1,
): StagePlayAdaptiveVisualLensSuggestedProfileDraftV1 => ({
  title: profile.title,
  domain: profile.domain,
  subjectCategory: profile.subjectCategory ?? null,
  subject: profile.subject ?? null,
  prompt: profile.prompt,
  outputMode: profile.outputMode,
  expectedSchema: profile.expectedSchema ?? null,
});

const subjectProfileRules: Array<{
  subject: string;
  profileId: string;
  confidence: number;
  patterns: RegExp[];
}> = [
  {
    subject: "Minecraft gameplay",
    profileId: "stage_play_visual_observer_profile:minecraft-gameplay:v1",
    confidence: 0.92,
    patterns: [
      /\bminecraft\b/,
      /\bhotbar\b/,
      /\bcreeper\b|\bzombie\b|\bskeleton\b/,
      /\bhealth hearts?\b/,
      /\bcrafting\b|\bbiome\b|\bblock\b/,
    ],
  },
  {
    subject: "Solar activity / SDO AIA 193 angstrom",
    profileId: "stage_play_visual_observer_profile:solar-sdo-aia-193:v1",
    confidence: 0.9,
    patterns: [
      /\bsdo\b|\baia\b/,
      /\b193\b/,
      /\bcoronal\b|\bsunspot\b|\bsolar\b|\bflare\b|\bcme\b/,
      /\bactive region\b|\bprominence\b/,
    ],
  },
  {
    subject: "Browser workflow",
    profileId: "stage_play_visual_observer_profile:browser-workflow:v1",
    confidence: 0.78,
    patterns: [
      /\bbrowser\b|\bweb page\b|\btab\b/,
      /\bform\b|\bbutton\b|\bmodal\b|\burl\b/,
      /\blogin\b|\bauth\b|\bcheckout\b/,
    ],
  },
  {
    subject: "Document or slide",
    profileId: "stage_play_visual_observer_profile:document-slide:v1",
    confidence: 0.76,
    patterns: [
      /\bdocument\b|\bslide\b|\bpdf\b|\bpage\b/,
      /\bparagraph\b|\bequation\b|\bheading\b|\btable\b/,
    ],
  },
  {
    subject: "Debug UI",
    profileId: "stage_play_visual_observer_profile:debug-ui:v1",
    confidence: 0.74,
    patterns: [
      /\bdebug\b|\bconsole\b|\blog\b|\bstack trace\b/,
      /\bterminal\b|\berror\b|\bexception\b|\btrace\b/,
    ],
  },
  {
    subject: "Video scene",
    profileId: "stage_play_visual_observer_profile:video-scene:v1",
    confidence: 0.7,
    patterns: [
      /\bvideo\b|\bscene\b|\bcamera\b|\bframe\b/,
      /\bperson\b|\bobject\b|\bmotion\b/,
    ],
  },
];

const scoreByProfileSubject = (
  text: string,
  profile: StagePlayVisualObserverProfileV1,
): { confidence: number; reason: string } => {
  const tokens = [
    profile.title,
    profile.subjectCategory ?? "",
    profile.subject ?? "",
    profile.domain,
  ]
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);
  const uniqueTokens = Array.from(new Set(tokens));
  if (uniqueTokens.length === 0) return { confidence: 0, reason: "profile has no subject tokens" };
  const matched = uniqueTokens.filter((token) => text.includes(token));
  const confidence = Math.min(0.72, matched.length / Math.max(5, uniqueTokens.length));
  return {
    confidence,
    reason: matched.length > 0
      ? `Matched profile subject token(s): ${matched.slice(0, 5).join(", ")}.`
      : "No profile subject token matched the recent summaries.",
  };
};

const chooseCandidateProfile = (args: {
  combinedText: string;
  profiles: StagePlayVisualObserverProfileV1[];
}): {
  profile: StagePlayVisualObserverProfileV1 | null;
  subject: string;
  confidence: number;
  reason: string;
} => {
  const text = normalizeText(args.combinedText);
  for (const rule of subjectProfileRules) {
    if (!textMatches(text, rule.patterns)) continue;
    const profile = args.profiles.find((entry) => entry.profileId === rule.profileId) ?? null;
    if (profile) {
      return {
        profile,
        subject: profile.subject ?? rule.subject,
        confidence: rule.confidence,
        reason: `Recognized ${rule.subject} from recent visual mail cues.`,
      };
    }
  }
  const scored = args.profiles
    .map((profile) => ({
      profile,
      ...scoreByProfileSubject(text, profile),
    }))
    .sort((left, right) => right.confidence - left.confidence);
  const best = scored[0] ?? null;
  if (best && best.confidence >= 0.35) {
    return {
      profile: best.profile,
      subject: best.profile.subject ?? best.profile.title,
      confidence: best.confidence,
      reason: best.reason,
    };
  }
  return {
    profile: null,
    subject: text.length > 0 ? "unknown visual subject" : "no visual subject evidence",
    confidence: 0.2,
    reason: "Recent visual mail did not contain enough subject evidence for a confident adaptive lens proposal.",
  };
};

export function evaluateStagePlayAdaptiveVisualLens(input: {
  threadId?: string | null;
  sourceId: string;
  limit?: number;
  now?: string;
}): StagePlayAdaptiveVisualLensProposalV1 {
  const threadId = input.threadId?.trim() || "helix-ask:desktop";
  const sourceId = input.sourceId.trim();
  const limit = Math.max(1, Math.min(input.limit ?? 5, 12));
  const now = input.now ?? new Date().toISOString();
  const mailItems = listStagePlayLiveSourceMailItems({
    threadId,
    sourceId,
    sourceKind: "visual_frame",
    limit,
  });
  const activeProfile = getActiveStagePlayVisualObserverProfileForSource({ sourceId });
  const profiles = listStagePlayVisualObserverProfiles({
    sourceId,
    includePresets: true,
    status: "active",
    limit: 250,
  });
  const microReasonerRuns = listStagePlayMicroReasonerRuns({
    sourceId,
    limit: 25,
  }).filter((run) => run.mailIds.some((mailId) => mailItems.some((item) => item.mailId === mailId)));
  const combinedText = mailItems.map((item) => item.summary.text).join("\n");
  const candidate = chooseCandidateProfile({ combinedText, profiles });
  const sameProfile = Boolean(
    activeProfile &&
      candidate.profile &&
      activeProfile.profileId === candidate.profile.profileId,
  );
  const hasEvidence = mailItems.length > 0 && combinedText.trim().length > 0;
  const recognizedSubjectConfidence = hasEvidence ? candidate.confidence : 0;
  let decision: StagePlayAdaptiveVisualLensDecisionV1 = "needs_more_evidence";
  let driftState: StagePlayAdaptiveVisualLensDriftStateV1 = "uncertain";
  let blockedReason: string | null = null;
  let reason = candidate.reason;

  if (!sourceId) {
    decision = "blocked";
    blockedReason = "missing_source";
    reason = "Adaptive lens evaluation requires a visual source id.";
  } else if (!hasEvidence) {
    decision = "needs_more_evidence";
    blockedReason = "missing_visual_mail";
    reason = "No recent visual mail summaries were available for adaptive lens evaluation.";
  } else if (!candidate.profile || recognizedSubjectConfidence < ADAPTIVE_VISUAL_LENS_MIN_CONFIDENCE) {
    decision = "needs_more_evidence";
    blockedReason = "low_subject_confidence";
    driftState = "uncertain";
  } else if (sameProfile) {
    decision = "keep_current";
    driftState = "same_subject";
    reason = `${candidate.reason} Current visual capture shade already matches.`;
  } else {
    decision = "suggest_profile";
    driftState = activeProfile ? "possible_drift" : "new_subject";
    reason = `${candidate.reason} Suggested capture shade: ${candidate.profile.title}.`;
  }

  const suggestedProfileDraft = candidate.profile ? profileDraftFromProfile(candidate.profile) : null;
  return recordStagePlayAdaptiveVisualLensProposal({
    threadId,
    sourceId,
    activeProfileId: activeProfile?.profileId ?? null,
    activeProfileTitle: activeProfile?.title ?? null,
    activeProfilePromptHash: activeProfile?.promptHash ?? null,
    recognizedSubject: candidate.subject,
    recognizedSubjectConfidence,
    driftState,
    decision,
    reason,
    candidateProfileId: candidate.profile?.profileId ?? null,
    candidateProfileTitle: candidate.profile?.title ?? null,
    candidateProfilePromptHash: candidate.profile?.promptHash ?? null,
    suggestedProfileDraft: suggestedProfileDraft
      ? {
          ...suggestedProfileDraft,
          prompt: promptPreview(suggestedProfileDraft.prompt),
        }
      : null,
    blockedReason,
    applyable: decision === "suggest_profile" &&
      recognizedSubjectConfidence >= ADAPTIVE_VISUAL_LENS_MIN_CONFIDENCE &&
      Boolean(candidate.profile || suggestedProfileDraft),
    mailIds: mailItems.map((item) => item.mailId),
    microReasonerRunRefs: microReasonerRuns.map((run) => run.runId),
    evidenceRefs: uniqueStrings([
      ...mailItems.map((item) => item.mailId),
      ...mailItems.flatMap((item) => item.evidenceRefs),
      ...microReasonerRuns.map((run) => run.runId),
      ...microReasonerRuns.flatMap((run) => run.outputRefs),
      activeProfile?.profileId ?? null,
      candidate.profile?.profileId ?? null,
    ]),
    createdAt: now,
  });
}

export function applyStagePlayAdaptiveVisualLensProposal(input: {
  proposalId: string;
  sourceId: string;
  minConfidence?: number;
  now?: string;
}): StagePlayAdaptiveVisualLensApplyResultV1 {
  const now = input.now ?? new Date().toISOString();
  const proposal = getStagePlayAdaptiveVisualLensProposal(input.proposalId);
  const sourceId = input.sourceId.trim();
  const minConfidence = input.minConfidence ?? ADAPTIVE_VISUAL_LENS_MIN_CONFIDENCE;
  let profile: StagePlayVisualObserverProfileV1 | null = null;
  let createdProfile: StagePlayVisualObserverProfileV1 | null = null;
  let applied = false;
  let reason = "proposal_not_found";

  if (!proposal) {
    return {
      artifactId: "stage_play_adaptive_visual_lens_apply_result",
      schemaVersion: STAGE_PLAY_ADAPTIVE_VISUAL_LENS_APPLY_RESULT_SCHEMA,
      proposalId: input.proposalId,
      sourceId,
      applied: false,
      reason,
      profile: null,
      createdProfile: null,
      evidenceRefs: uniqueStrings([input.proposalId, sourceId]),
      createdAt: now,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    };
  }

  if (proposal.sourceId !== sourceId) {
    reason = "source_mismatch";
  } else if (!proposal.applyable || proposal.decision !== "suggest_profile") {
    reason = proposal.blockedReason ?? "proposal_not_applyable";
  } else if (proposal.recognizedSubjectConfidence < minConfidence) {
    reason = "confidence_below_threshold";
  } else if (proposal.candidateProfileId) {
    const candidate = getStagePlayVisualObserverProfile(proposal.candidateProfileId);
    profile = candidate
      ? applyStagePlayVisualObserverProfile({
          profileId: candidate.profileId,
          sourceIds: [sourceId],
          now,
        })
      : null;
    applied = Boolean(profile);
    reason = applied ? "applied_existing_profile" : "candidate_profile_not_found";
  } else if (proposal.suggestedProfileDraft) {
    createdProfile = recordStagePlayVisualObserverProfile({
      title: proposal.suggestedProfileDraft.title,
      domain: proposal.suggestedProfileDraft.domain,
      subjectCategory: proposal.suggestedProfileDraft.subjectCategory ?? "Adaptive",
      subject: proposal.suggestedProfileDraft.subject ?? proposal.recognizedSubject,
      prompt: proposal.suggestedProfileDraft.prompt,
      outputMode: proposal.suggestedProfileDraft.outputMode,
      expectedSchema: proposal.suggestedProfileDraft.expectedSchema ?? null,
      sourceIds: [],
      now,
    });
    profile = applyStagePlayVisualObserverProfile({
      profileId: createdProfile.profileId,
      sourceIds: [sourceId],
      now,
    });
    applied = Boolean(profile);
    reason = applied ? "created_and_applied_profile" : "created_profile_apply_failed";
  } else {
    reason = "missing_candidate_profile";
  }

  return {
    artifactId: "stage_play_adaptive_visual_lens_apply_result",
    schemaVersion: STAGE_PLAY_ADAPTIVE_VISUAL_LENS_APPLY_RESULT_SCHEMA,
    proposalId: proposal.proposalId,
    sourceId,
    applied,
    reason,
    profile,
    createdProfile,
    evidenceRefs: uniqueStrings([
      proposal.proposalId,
      ...proposal.evidenceRefs,
      profile?.profileId ?? null,
      createdProfile?.profileId ?? null,
      sourceId,
    ]),
    createdAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    context_role: "tool_evidence",
    ask_context_policy: "evidence_only",
  };
}
