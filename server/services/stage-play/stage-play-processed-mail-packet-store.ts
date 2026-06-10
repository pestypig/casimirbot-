import type {
  StagePlayMicroReasonerRoleV1,
  StagePlayMicroReasonerPromptV1,
  StagePlayMicroReasonerRunV1,
  StagePlayProcessedMailPacketV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";

const promptsById = new Map<string, StagePlayMicroReasonerPromptV1>();
const runsById = new Map<string, StagePlayMicroReasonerRunV1>();
const packetsById = new Map<string, StagePlayProcessedMailPacketV1>();

const DEFAULT_PROMPT_UPDATED_AT = "2026-06-01T00:00:00.000Z";

const defaultPromptIdForRole = (role: StagePlayMicroReasonerRoleV1): string =>
  `stage_play_micro_reasoner_prompt:${role}:v1`;

const DEFAULT_MICRO_REASONER_PROMPTS: Array<Omit<StagePlayMicroReasonerPromptV1, "createdAt" | "updatedAt">> = [
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: "stage_play_micro_reasoner_prompt/v1",
    promptId: defaultPromptIdForRole("claim_extractor"),
    title: "Claim Extractor",
    role: "claim_extractor",
    version: 1,
    active: true,
    template: [
      "You are a live-source claim extractor.",
      "",
      "Input is a compact visual-summary mail item. Convert it into short claimlets.",
      "",
      "Rules:",
      "- Preserve observed facts separately from inferences.",
      "- Do not add new facts.",
      "- Use concise phrases.",
      "- Keep uncertainty explicit.",
      "- Return JSON only.",
      "",
      "Output:",
      "{",
      '  "observedFacts": string[],',
      '  "inferredFacts": string[],',
      '  "uncertainties": string[],',
      '  "sceneTags": string[],',
      '  "activityTags": string[],',
      '  "objectTags": string[],',
      '  "riskTags": string[],',
      '  "opportunityTags": string[]',
      "}",
    ].join("\n"),
    inputSchemaName: "StagePlayLiveSourceMailItemV1",
    outputSchemaName: "ClaimExtractorOutputV1",
    modelPreference: "small_fast_llm",
    maxInputItems: 5,
    maxOutputTokens: 600,
    linkedNoteId: null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: "stage_play_micro_reasoner_prompt/v1",
    promptId: defaultPromptIdForRole("observation_classifier"),
    title: "Observation Classifier",
    role: "observation_classifier",
    version: 1,
    active: true,
    template: [
      "You classify extracted live-source claimlets.",
      "",
      "Input:",
      "- observedFacts",
      "- inferredFacts",
      "- uncertainties",
      "- prior stableFacts",
      "",
      "Task:",
      "- mark which facts are stable repeats",
      "- mark which facts are new",
      "- mark which facts are contradictory or unclear",
      "- do not decide whether to answer the user",
      "",
      "Return JSON only:",
      "{",
      '  "stableFactsUsed": string[],',
      '  "changedFacts": string[],',
      '  "contradictions": string[],',
      '  "uncertainties": string[]',
      "}",
    ].join("\n"),
    inputSchemaName: "ClaimExtractorOutputV1",
    outputSchemaName: "ObservationClassifierOutputV1",
    modelPreference: "small_fast_llm",
    maxInputItems: 5,
    maxOutputTokens: 500,
    linkedNoteId: null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: "stage_play_micro_reasoner_prompt/v1",
    promptId: defaultPromptIdForRole("effort_estimator"),
    title: "Effort Estimator",
    role: "effort_estimator",
    version: 1,
    active: true,
    template: [
      "You estimate the active effort in a live Minecraft visual source.",
      "",
      "Input:",
      "- observedFacts",
      "- inferredFacts",
      "- changedFacts",
      "- prior effort if any",
      "",
      "Task:",
      "Identify what the player appears to be trying to do now. Do not invent goals. Use cautious labels.",
      "",
      "Allowed efforts:",
      "- base_management",
      "- inventory_management",
      "- surface_exploration",
      "- cave_exploration",
      "- combat_or_recovery",
      "- building_or_crafting",
      "- resource_gathering",
      "- travel_or_navigation",
      "- menu_or_video_state",
      "- unknown",
      "",
      "Return JSON only:",
      "{",
      '  "currentEffort": string,',
      '  "evidenceFor": string[],',
      '  "evidenceAgainst": string[],',
      '  "confidence": number,',
      '  "nextLikelyEfforts": string[]',
      "}",
    ].join("\n"),
    inputSchemaName: "ObservationClassifierOutputV1",
    outputSchemaName: "StagePlayEffortEstimateV1",
    modelPreference: "deterministic",
    maxInputItems: 5,
    maxOutputTokens: 220,
    linkedNoteId: null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: "stage_play_micro_reasoner_prompt/v1",
    promptId: defaultPromptIdForRole("axiom_extractor"),
    title: "Axiom Extractor",
    role: "axiom_extractor",
    version: 1,
    active: true,
    template: [
      "You extract state variables that constrain the next scene beat.",
      "",
      "Input:",
      "- observedFacts",
      "- currentEffort",
      "- profile criteria",
      "- prior immersion state",
      "",
      "Task:",
      "List only constraints supported by evidence. Separate missing state from known state.",
      "",
      "Return JSON only:",
      "{",
      '  "axioms": string[],',
      '  "missingAxioms": string[],',
      '  "predictionRelevantVariables": string[]',
      "}",
    ].join("\n"),
    inputSchemaName: "StagePlayEffortEstimateV1",
    outputSchemaName: "StagePlayAxiomFrameV1",
    modelPreference: "deterministic",
    maxInputItems: 5,
    maxOutputTokens: 260,
    linkedNoteId: null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: "stage_play_micro_reasoner_prompt/v1",
    promptId: defaultPromptIdForRole("hypothesis_generator"),
    title: "Hypothesis Generator",
    role: "hypothesis_generator",
    version: 1,
    active: true,
    template: [
      "You generate plausible next scene-beat hypotheses.",
      "",
      "Input:",
      "- currentEffort",
      "- axioms",
      "- changedFacts",
      "- prior prediction",
      "- interpreter contract",
      "",
      "Task:",
      "Generate 2-4 plausible next scene beats. Each hypothesis must include validation and contradiction signals.",
      "",
      "Return JSON only:",
      "{",
      '  "hypotheses": [',
      "    {",
      '      "label": string,',
      '      "prediction": string,',
      '      "confidence": number,',
      '      "validationSignals": string[],',
      '      "whatWouldContradictIt": string[]',
      "    }",
      "  ]",
      "}",
    ].join("\n"),
    inputSchemaName: "StagePlayAxiomFrameV1",
    outputSchemaName: "StagePlaySceneBeatHypothesisV1[]",
    modelPreference: "deterministic",
    maxInputItems: 5,
    maxOutputTokens: 420,
    linkedNoteId: null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: "stage_play_micro_reasoner_prompt/v1",
    promptId: defaultPromptIdForRole("profile_comparator"),
    title: "Profile Comparator",
    role: "profile_comparator",
    version: 1,
    active: true,
    template: [
      "You compare live-source facts against an interpreter profile.",
      "",
      "Important:",
      "The profile is a lens, not a replacement for observations.",
      "Preserve observed facts.",
      "Mark which profile criteria match, which suppress, and which remain uncertain.",
      "",
      "Return JSON only:",
      "{",
      '  "matchedCriteria": string[],',
      '  "suppressedCriteria": string[],',
      '  "riskMatches": string[],',
      '  "opportunityMatches": string[],',
      '  "voiceCalloutMatches": string[],',
      '  "recommendedNextWatch": string[],',
      '  "profileUncertainties": string[]',
      "}",
    ].join("\n"),
    inputSchemaName: "InterpreterProfileComparisonInputV1",
    outputSchemaName: "StagePlayLiveSourceInterpreterProfileComparisonV1",
    modelPreference: "deterministic",
    maxInputItems: 5,
    maxOutputTokens: 500,
    linkedNoteId: null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: "stage_play_micro_reasoner_prompt/v1",
    promptId: defaultPromptIdForRole("hypothesis_arbiter"),
    title: "Hypothesis Arbiter",
    role: "hypothesis_arbiter",
    version: 1,
    active: true,
    template: [
      "You arbitrate micro-reasoner findings for a live-source mail loop.",
      "",
      "Input:",
      "- processed packet",
      "- effort estimate",
      "- axioms",
      "- hypotheses",
      "- prediction validation",
      "- profile comparison",
      "- salience score",
      "- voice policy",
      "",
      "Task:",
      "Choose the smallest correct next procedural action. Do not create a final answer. Do not speak.",
      "Prefer wait if evidence is routine. Prefer record_interpretation if state changed meaningfully.",
      "Prefer request_voice_callout only for urgent/high-salience events that match policy.",
      "Prefer request_more_evidence if uncertainty blocks action.",
      "",
      "Return JSON only:",
      "{",
      '  "recommendedNext": "wait_for_next_summary" | "record_interpretation" | "draft_text_answer" | "request_voice_callout" | "request_more_evidence" | "request_stage_play_checkpoint",',
      '  "wakeAsk": boolean,',
      '  "reason": string,',
      '  "confidence": "low" | "medium" | "high",',
      '  "selectedHypothesis": string | null,',
      '  "voiceCandidate": boolean,',
      '  "calloutDraft": string | null,',
      '  "missingEvidence": string[]',
      "}",
    ].join("\n"),
    inputSchemaName: "StagePlayProcessedMailPacketV1",
    outputSchemaName: "StagePlayHypothesisArbiterV1",
    modelPreference: "deterministic",
    maxInputItems: 5,
    maxOutputTokens: 300,
    linkedNoteId: null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: "stage_play_micro_reasoner_prompt/v1",
    promptId: defaultPromptIdForRole("delta_extractor"),
    title: "Delta Extractor",
    role: "delta_extractor",
    version: 1,
    active: true,
    template: [
      "You compare the current processed observation to the previous immersion state.",
      "",
      "Task:",
      "- identify meaningful changes",
      "- classify current activity",
      "- carry forward stable source identity",
      "- flag scene transitions",
      "- flag repeated routine state",
      "",
      "Return JSON only:",
      "{",
      '  "sourceIdentity": {',
      '    "label": string,',
      '    "confidence": number,',
      '    "stable": boolean',
      "  },",
      '  "currentActivity": string,',
      '  "meaningfulDeltas": string[],',
      '  "repeatedPatterns": string[],',
      '  "sceneTransition": boolean',
      "}",
    ].join("\n"),
    inputSchemaName: "DeltaExtractorInputV1",
    outputSchemaName: "DeltaExtractorOutputV1",
    modelPreference: "deterministic",
    maxInputItems: 5,
    maxOutputTokens: 500,
    linkedNoteId: null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: "stage_play_micro_reasoner_prompt/v1",
    promptId: defaultPromptIdForRole("prediction_validator"),
    title: "Prediction Validator",
    role: "prediction_validator",
    version: 1,
    active: true,
    template: [
      "You validate a prior prediction against new live-source facts.",
      "",
      "Input:",
      "- priorPrediction",
      "- validationSignals",
      "- new observedFacts",
      "- changedFacts",
      "",
      "Task:",
      "Decide whether the prior prediction was supported, partially supported, contradicted, unresolved, or absent.",
      "",
      "Return JSON only:",
      "{",
      '  "result": "supported" | "partially_supported" | "contradicted" | "unresolved" | "no_prior_prediction",',
      '  "supportedSignals": string[],',
      '  "contradictedSignals": string[],',
      '  "newSignals": string[],',
      '  "salienceHint": "low" | "medium" | "high" | "urgent"',
      "}",
    ].join("\n"),
    inputSchemaName: "PredictionValidatorInputV1",
    outputSchemaName: "StagePlayLiveSourcePredictionValidationV1",
    modelPreference: "deterministic",
    maxInputItems: 5,
    maxOutputTokens: 500,
    linkedNoteId: null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: "stage_play_micro_reasoner_prompt/v1",
    promptId: defaultPromptIdForRole("salience_scorer"),
    title: "Salience / Voice Candidate Scorer",
    role: "salience_scorer",
    version: 1,
    active: true,
    template: [
      "You score whether a processed live-source packet should wake the main Ask agent or prepare a voice candidate.",
      "",
      "Input:",
      "- changedFacts",
      "- riskMatches",
      "- opportunityMatches",
      "- voiceCalloutMatches",
      "- predictionValidation",
      "- active output policy",
      "",
      "Return JSON only:",
      "{",
      '  "salienceLevel": "low" | "medium" | "high" | "urgent",',
      '  "reasons": string[],',
      '  "voiceCandidate": boolean,',
      '  "calloutDraft": string | null,',
      '  "recommendedNext": "wait_for_next_summary" | "record_interpretation" | "draft_text_answer" | "request_voice_callout" | "request_more_evidence" | "request_stage_play_checkpoint"',
      "}",
    ].join("\n"),
    inputSchemaName: "SalienceScorerInputV1",
    outputSchemaName: "SalienceScorerOutputV1",
    modelPreference: "deterministic",
    maxInputItems: 5,
    maxOutputTokens: 500,
    linkedNoteId: null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: "stage_play_micro_reasoner_prompt/v1",
    promptId: defaultPromptIdForRole("packet_composer"),
    title: "Packet Composer",
    role: "packet_composer",
    version: 1,
    active: true,
    template: [
      "You compose a processed mail packet from micro-reasoner outputs.",
      "",
      "Rules:",
      "- Do not create a final answer.",
      "- Preserve evidence refs.",
      "- Prefer structured facts over prose.",
      "- Include reason for recommendedNext.",
      "- If uncertain, recommend request_more_evidence or record_interpretation, not voice.",
      "",
      "Return JSON matching StagePlayProcessedMailPacketV1.",
    ].join("\n"),
    inputSchemaName: "ProcessedMailPacketComposerInputV1",
    outputSchemaName: "StagePlayProcessedMailPacketV1",
    modelPreference: "deterministic",
    maxInputItems: 5,
    maxOutputTokens: 900,
    linkedNoteId: null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: "stage_play_micro_reasoner_prompt/v1",
    promptId: defaultPromptIdForRole("decision_selector"),
    title: "Decision Selector",
    role: "decision_selector",
    version: 1,
    active: true,
    template: [
      "You select the next live-source mail-loop decision from packet evidence.",
      "",
      "Rules:",
      "- Do not create a final answer.",
      "- Do not execute voice output.",
      "- Select the smallest procedural next step supported by the processed packet.",
      "- If the packet requests voice, select request_voice_callout only as a decision receipt.",
      "- Keep evidence and missing evidence explicit.",
      "",
      "Return JSON only:",
      "{",
      '  "selectedDecision": "wait_for_next_summary" | "record_interpretation" | "draft_text_answer" | "request_voice_callout" | "request_more_evidence" | "request_stage_play_checkpoint",',
      '  "recommendedNextTool": string | null,',
      '  "confidence": "low" | "medium" | "high",',
      '  "reasons": string[],',
      '  "missingEvidence": string[]',
      "}",
    ].join("\n"),
    inputSchemaName: "StagePlayProcessedMailPacketV1",
    outputSchemaName: "MailLoopDecisionSelectorOutputV1",
    modelPreference: "deterministic",
    maxInputItems: 3,
    maxOutputTokens: 260,
    linkedNoteId: null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: "stage_play_micro_reasoner_prompt/v1",
    promptId: defaultPromptIdForRole("voice_callout_drafter"),
    title: "Voice Callout Drafter",
    role: "voice_callout_drafter",
    version: 1,
    active: true,
    template: [
      "You draft a short interim voice callout from processed packet evidence.",
      "",
      "Rules:",
      "- Do not send voice.",
      "- Do not claim the voice callout happened.",
      "- Use only packet facts and salience reasons.",
      "- Keep the draft short enough for low-noise operator delivery.",
      "",
      "Return JSON only:",
      "{",
      '  "calloutDraft": string | null,',
      '  "reasonCodes": string[],',
      '  "missingEvidence": string[]',
      "}",
    ].join("\n"),
    inputSchemaName: "StagePlayProcessedMailPacketV1",
    outputSchemaName: "VoiceCalloutDraftOutputV1",
    modelPreference: "deterministic",
    maxInputItems: 3,
    maxOutputTokens: 180,
    linkedNoteId: null,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
];

export function ensureDefaultStagePlayMicroReasonerPrompts(): StagePlayMicroReasonerPromptV1[] {
  for (const prompt of DEFAULT_MICRO_REASONER_PROMPTS) {
    if (promptsById.has(prompt.promptId)) continue;
    promptsById.set(prompt.promptId, {
      ...prompt,
      createdAt: DEFAULT_PROMPT_UPDATED_AT,
      updatedAt: DEFAULT_PROMPT_UPDATED_AT,
    });
  }
  return Array.from(promptsById.values()).filter((prompt) => prompt.active);
}

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const runScopeMatches = (
  run: StagePlayMicroReasonerRunV1,
  input: {
    jobId?: string | null;
    sourceId?: string | null;
    mailId?: string | null;
  },
): boolean => {
  if (input.jobId && run.jobId !== input.jobId) return false;
  if (input.sourceId && run.sourceId !== input.sourceId) return false;
  if (input.mailId && !run.mailIds.includes(input.mailId)) return false;
  return true;
};

const packetScopeMatches = (
  packet: StagePlayProcessedMailPacketV1,
  input: {
    jobId?: string | null;
    sourceId?: string | null;
    mailId?: string | null;
  },
): boolean => {
  if (input.jobId && packet.jobId !== input.jobId) return false;
  if (input.sourceId && packet.sourceId !== input.sourceId) return false;
  if (input.mailId && !packet.mailIds.includes(input.mailId)) return false;
  return true;
};

export function recordStagePlayMicroReasonerPrompt(
  prompt: StagePlayMicroReasonerPromptV1,
): StagePlayMicroReasonerPromptV1 {
  ensureDefaultStagePlayMicroReasonerPrompts();
  promptsById.set(prompt.promptId, prompt);
  return prompt;
}

export function getStagePlayMicroReasonerPrompt(
  promptId: string,
): StagePlayMicroReasonerPromptV1 | null {
  ensureDefaultStagePlayMicroReasonerPrompts();
  return promptsById.get(promptId) ?? null;
}

export function getActiveStagePlayMicroReasonerPromptForRole(
  role: StagePlayMicroReasonerRoleV1,
): StagePlayMicroReasonerPromptV1 | null {
  return listStagePlayMicroReasonerPrompts({ active: true, role, limit: 1 }).at(-1) ?? null;
}

export function listStagePlayMicroReasonerPrompts(input: {
  active?: boolean | null;
  role?: StagePlayMicroReasonerPromptV1["role"] | null;
  limit?: number;
} = {}): StagePlayMicroReasonerPromptV1[] {
  ensureDefaultStagePlayMicroReasonerPrompts();
  return Array.from(promptsById.values())
    .filter((prompt) => input.active == null || prompt.active === input.active)
    .filter((prompt) => !input.role || prompt.role === input.role)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    .slice(-(input.limit ?? 100));
}

export function recordStagePlayMicroReasonerRun(
  run: StagePlayMicroReasonerRunV1,
): StagePlayMicroReasonerRunV1 {
  runsById.set(run.runId, run);
  return run;
}

export function getStagePlayMicroReasonerRun(
  runId: string,
): StagePlayMicroReasonerRunV1 | null {
  return runsById.get(runId) ?? null;
}

export function listStagePlayMicroReasonerRuns(input: {
  jobId?: string | null;
  sourceId?: string | null;
  mailId?: string | null;
  limit?: number;
} = {}): StagePlayMicroReasonerRunV1[] {
  return Array.from(runsById.values())
    .filter((run) => runScopeMatches(run, input))
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .slice(-(input.limit ?? 100));
}

export function recordStagePlayProcessedMailPacket(
  packet: StagePlayProcessedMailPacketV1,
): StagePlayProcessedMailPacketV1 {
  packetsById.set(packet.packetId, {
    ...packet,
    evidenceRefs: uniqueStrings(packet.evidenceRefs),
    microReasonerRunRefs: uniqueStrings(packet.microReasonerRunRefs),
  });
  return packetsById.get(packet.packetId)!;
}

export function getStagePlayProcessedMailPacket(
  packetId: string,
): StagePlayProcessedMailPacketV1 | null {
  return packetsById.get(packetId) ?? null;
}

export function listStagePlayProcessedMailPackets(input: {
  jobId?: string | null;
  sourceId?: string | null;
  mailId?: string | null;
  limit?: number;
} = {}): StagePlayProcessedMailPacketV1[] {
  return Array.from(packetsById.values())
    .filter((packet) => packetScopeMatches(packet, input))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-(input.limit ?? 100));
}

export function getLatestStagePlayProcessedMailPacket(input: {
  jobId?: string | null;
  sourceId?: string | null;
  mailId?: string | null;
} = {}): StagePlayProcessedMailPacketV1 | null {
  return listStagePlayProcessedMailPackets({ ...input, limit: 1 }).at(-1) ?? null;
}

export function resetStagePlayProcessedMailPacketStoreForTest(): void {
  promptsById.clear();
  runsById.clear();
  packetsById.clear();
}
