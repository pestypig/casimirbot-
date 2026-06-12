import type {
  StagePlayMicroReasonerPromptPresetV1,
  StagePlayMicroReasonerRoleV1,
  StagePlayMicroReasonerPromptV1,
  StagePlayMicroReasonerRunV1,
  StagePlayProcessedMailPacketV1,
} from "@shared/contracts/stage-play-live-source-mail.v1";
import {
  STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_SCHEMA,
  STAGE_PLAY_MICRO_REASONER_PROMPT_SCHEMA,
} from "@shared/contracts/stage-play-live-source-mail.v1";

const promptsById = new Map<string, StagePlayMicroReasonerPromptV1>();
const promptPresetsById = new Map<string, StagePlayMicroReasonerPromptPresetV1>();
const runsById = new Map<string, StagePlayMicroReasonerRunV1>();
const packetsById = new Map<string, StagePlayProcessedMailPacketV1>();
const promptToolActivitiesById = new Map<string, StagePlayMicroReasonerPromptToolActivityV1>();

const DEFAULT_PROMPT_UPDATED_AT = "2026-06-01T00:00:00.000Z";

export type StagePlayMicroReasonerPromptToolActivityV1 = {
  artifactId: "stage_play_micro_reasoner_prompt_tool_activity";
  schemaVersion: "stage_play_micro_reasoner_prompt_tool_activity/v1";
  activityId: string;
  toolName: string;
  action: "query" | "apply" | "create" | "update" | "test";
  status: "running" | "completed" | "failed";
  summary: string;
  sourceIds: string[];
  presetId?: string | null;
  promptId?: string | null;
  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
};

const defaultPromptIdForRole = (role: StagePlayMicroReasonerRoleV1): string =>
  `stage_play_micro_reasoner_prompt:${role}:v1`;

const presetPromptIdForRole = (
  preset: "calculator-tool-call" | "science-visual",
  role: StagePlayMicroReasonerRoleV1,
): string => `stage_play_micro_reasoner_prompt:${preset}:${role}:v1`;

const MINECRAFT_MINIMAL_OPERATOR_ARBITER_PROMPT_ID =
  "stage_play_micro_reasoner_prompt:minecraft_minimal_operator_arbiter:v1";

const customSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "custom";

const DEFAULT_PROMPTED_MICRO_REASONER_ROLES: StagePlayMicroReasonerRoleV1[] = [
  "claim_extractor",
  "observation_classifier",
  "salience_scorer",
  "hypothesis_arbiter",
  "decision_selector",
];

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

const PRESET_MICRO_REASONER_PROMPTS: Array<Omit<StagePlayMicroReasonerPromptV1, "createdAt" | "updatedAt">> = [
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: STAGE_PLAY_MICRO_REASONER_PROMPT_SCHEMA,
    promptId: MINECRAFT_MINIMAL_OPERATOR_ARBITER_PROMPT_ID,
    title: "Minecraft Minimal Operator Arbiter",
    role: "hypothesis_arbiter",
    version: 1,
    active: true,
    template: [
      "You are the minimal operator for a Minecraft live-source packet.",
      "",
      "Use only the supplied packet evidence and prior state.",
      "",
      "Return the smallest procedural next step.",
      "",
      "Decide:",
      "- current player effort",
      "- key axioms that constrain the next scene beat",
      "- whether the packet is routine or salient",
      "- whether Helix Ask should wake",
      "- whether a voice callout candidate should be prepared",
      "",
      "Rules:",
      "- Do not create a final answer.",
      "- Do not speak.",
      "- Do not invent unseen details.",
      "- Prefer wait_for_next_summary for routine base/inventory/walking.",
      "- Prefer record_interpretation for meaningful scene transition or prediction contradiction.",
      "- Prefer request_voice_callout only for danger/urgent cues such as fire, damage, hostile mob, lava, low health, fall risk, or profile-specified urgent opportunity.",
      "- Preserve uncertainty.",
      "",
      "Return JSON only:",
      "{",
      '  "recommendedNext": "wait_for_next_summary" | "record_interpretation" | "draft_text_answer" | "request_voice_callout" | "request_more_evidence" | "request_stage_play_checkpoint",',
      '  "wakeAsk": boolean,',
      '  "reason": string,',
      '  "confidence": "low" | "medium" | "high",',
      '  "currentEffort": string,',
      '  "axioms": string[],',
      '  "selectedHypothesis": string | null,',
      '  "voiceCandidate": boolean,',
      '  "calloutDraft": string | null,',
      '  "missingEvidence": string[]',
      "}",
    ].join("\n"),
    inputSchemaName: "StagePlayProcessedMailPacketV1",
    outputSchemaName: "MinecraftMinimalOperatorArbiterOutputV1",
    modelPreference: "small_fast_llm",
    maxInputItems: 1,
    maxOutputTokens: 260,
    linkedNoteId: null,
    presetIds: ["stage_play_micro_reasoner_prompt_preset:minecraft_minimal_operator:v1"],
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: STAGE_PLAY_MICRO_REASONER_PROMPT_SCHEMA,
    promptId: presetPromptIdForRole("calculator-tool-call", "claim_extractor"),
    title: "Calculator Stream Claim Extractor",
    role: "claim_extractor",
    version: 1,
    active: true,
    template: [
      "You are extracting claims from a live calculator or structured tool stream.",
      "",
      "Input may contain scalar rows, equation updates, runtime traces, gates, or tool result deltas.",
      "",
      "Rules:",
      "- Preserve numeric values with units when present.",
      "- Separate direct stream facts from inferred implications.",
      "- Mark missing variables or stale rows as uncertainty.",
      "- Do not solve the user's problem and do not execute a tool.",
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
    maxOutputTokens: 520,
    linkedNoteId: null,
    presetIds: ["stage_play_micro_reasoner_prompt_preset:calculator-tool-call:v1"],
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: STAGE_PLAY_MICRO_REASONER_PROMPT_SCHEMA,
    promptId: presetPromptIdForRole("calculator-tool-call", "decision_selector"),
    title: "Calculator Tool-Call Decision Selector",
    role: "decision_selector",
    version: 1,
    active: true,
    template: [
      "You select the next procedural action for a calculator-backed live-source mail loop.",
      "",
      "Rules:",
      "- Do not answer the user.",
      "- Do not execute tools.",
      "- If a follow-up calculator/tool action is justified, name it only as recommendedNextTool.",
      "- If evidence is enough only to update state, select record_interpretation.",
      "- If evidence is stale or missing required variables, select request_more_evidence.",
      "- Keep the recommendation a receipt for the deterministic arbiter.",
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
    modelPreference: "small_fast_llm",
    maxInputItems: 3,
    maxOutputTokens: 260,
    linkedNoteId: null,
    presetIds: ["stage_play_micro_reasoner_prompt_preset:calculator-tool-call:v1"],
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt",
    schemaVersion: STAGE_PLAY_MICRO_REASONER_PROMPT_SCHEMA,
    promptId: presetPromptIdForRole("science-visual", "claim_extractor"),
    title: "Science Visual Claim Extractor",
    role: "claim_extractor",
    version: 1,
    active: true,
    template: [
      "You are extracting cautious claims from a scientific visual live source.",
      "",
      "Rules:",
      "- Preserve observable morphology and instrument/channel context.",
      "- Do not over-claim classifications that need another wavelength, sensor, or dataset.",
      "- Separate observed structures, inferred activity, and uncertainty.",
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
    maxOutputTokens: 560,
    linkedNoteId: null,
    presetIds: ["stage_play_micro_reasoner_prompt_preset:science-visual:v1"],
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
];

const DEFAULT_WAKE_COALESCING_POLICY: StagePlayMicroReasonerPromptPresetV1["wakeCoalescingPolicy"] = {
  coalescePendingSameSource: true,
  supersedeOnlyBeforeAskTurn: true,
  preserveSupersededRefs: true,
};

const DEFAULT_MICRO_REASONER_PROMPT_PRESETS: Array<Omit<StagePlayMicroReasonerPromptPresetV1, "createdAt" | "updatedAt">> = [
  {
    artifactId: "stage_play_micro_reasoner_prompt_preset",
    schemaVersion: STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_SCHEMA,
    presetId: "stage_play_micro_reasoner_prompt_preset:generic-live-source:v1",
    title: "Generic Live Source",
    description: "Default watch-officer micro-reasoners for routine visual or mixed live-source mail.",
    domain: "generic",
    sourceKinds: ["visual_frame", "screen_summary", "manual_feed", "custom"],
    sourceIds: [],
    rolePromptIds: {},
    promptedRoles: DEFAULT_PROMPTED_MICRO_REASONER_ROLES,
    deckRunPlan: "baseline_plus_prompted",
    wakeCoalescingPolicy: DEFAULT_WAKE_COALESCING_POLICY,
    outputPolicy: "watch_officer",
    active: true,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt_preset",
    schemaVersion: STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_SCHEMA,
    presetId: "stage_play_micro_reasoner_prompt_preset:minecraft-gameplay:v1",
    title: "Minecraft Gameplay Watch",
    description: "Visual gameplay monitoring with effort, risk, salience, and smallest-next-step receipts.",
    domain: "minecraft_gameplay",
    sourceKinds: ["visual_frame", "minecraft_world_event", "screen_summary"],
    sourceIds: [],
    rolePromptIds: {},
    promptedRoles: [
      "claim_extractor",
      "observation_classifier",
      "effort_estimator",
      "salience_scorer",
      "hypothesis_arbiter",
      "decision_selector",
    ],
    deckRunPlan: "baseline_plus_prompted",
    wakeCoalescingPolicy: DEFAULT_WAKE_COALESCING_POLICY,
    outputPolicy: "watch_officer",
    active: true,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt_preset",
    schemaVersion: STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_SCHEMA,
    presetId: "stage_play_micro_reasoner_prompt_preset:minecraft_minimal_operator:v1",
    title: "Minecraft Minimal Operator",
    description: "Fast single-arbiter Minecraft live-source deck for packet-level wake/no-wake and voice candidate decisions.",
    domain: "minecraft_gameplay",
    sourceKinds: ["visual_frame"],
    sourceIds: [],
    rolePromptIds: {
      hypothesis_arbiter: MINECRAFT_MINIMAL_OPERATOR_ARBITER_PROMPT_ID,
    },
    promptedRoles: ["hypothesis_arbiter"],
    deckRunPlan: "minimal_prompted_arbiter",
    wakeCoalescingPolicy: DEFAULT_WAKE_COALESCING_POLICY,
    outputPolicy: "voice_candidate",
    active: true,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt_preset",
    schemaVersion: STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_SCHEMA,
    presetId: "stage_play_micro_reasoner_prompt_preset:calculator-tool-call:v1",
    title: "Calculator Tool-Call Monitor",
    description: "Structured calculator streams that may recommend a follow-up tool as a decision receipt.",
    domain: "calculator_stream",
    sourceKinds: ["manual_feed", "custom", "screen_summary"],
    sourceIds: [],
    rolePromptIds: {
      claim_extractor: presetPromptIdForRole("calculator-tool-call", "claim_extractor"),
      decision_selector: presetPromptIdForRole("calculator-tool-call", "decision_selector"),
    },
    promptedRoles: ["claim_extractor", "observation_classifier", "salience_scorer", "decision_selector"],
    deckRunPlan: "baseline_plus_prompted",
    wakeCoalescingPolicy: DEFAULT_WAKE_COALESCING_POLICY,
    outputPolicy: "tool_call_candidate",
    active: true,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
  {
    artifactId: "stage_play_micro_reasoner_prompt_preset",
    schemaVersion: STAGE_PLAY_MICRO_REASONER_PROMPT_PRESET_SCHEMA,
    presetId: "stage_play_micro_reasoner_prompt_preset:science-visual:v1",
    title: "Science Visual Watch",
    description: "Scientific image/video monitoring that emphasizes instrument limits and uncertainty.",
    domain: "science_visual",
    sourceKinds: ["visual_frame"],
    sourceIds: [],
    rolePromptIds: {
      claim_extractor: presetPromptIdForRole("science-visual", "claim_extractor"),
    },
    promptedRoles: DEFAULT_PROMPTED_MICRO_REASONER_ROLES,
    deckRunPlan: "baseline_plus_prompted",
    wakeCoalescingPolicy: DEFAULT_WAKE_COALESCING_POLICY,
    outputPolicy: "record_only",
    active: true,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  },
];

export function ensureDefaultStagePlayMicroReasonerPrompts(): StagePlayMicroReasonerPromptV1[] {
  for (const prompt of [...DEFAULT_MICRO_REASONER_PROMPTS, ...PRESET_MICRO_REASONER_PROMPTS]) {
    if (promptsById.has(prompt.promptId)) continue;
    promptsById.set(prompt.promptId, {
      ...prompt,
      createdAt: DEFAULT_PROMPT_UPDATED_AT,
      updatedAt: DEFAULT_PROMPT_UPDATED_AT,
    });
  }
  return Array.from(promptsById.values()).filter((prompt: StagePlayMicroReasonerPromptV1) => prompt.active);
}

export function ensureDefaultStagePlayMicroReasonerPromptPresets(): StagePlayMicroReasonerPromptPresetV1[] {
  ensureDefaultStagePlayMicroReasonerPrompts();
  for (const preset of DEFAULT_MICRO_REASONER_PROMPT_PRESETS) {
    if (promptPresetsById.has(preset.presetId)) continue;
    promptPresetsById.set(preset.presetId, {
      ...preset,
      createdAt: DEFAULT_PROMPT_UPDATED_AT,
      updatedAt: DEFAULT_PROMPT_UPDATED_AT,
    });
  }
  return Array.from(promptPresetsById.values()).filter((preset: StagePlayMicroReasonerPromptPresetV1) => preset.active);
}

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value: string | null | undefined) => String(value ?? "").trim()).filter(Boolean)));

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

export function recordStagePlayMicroReasonerPromptToolActivity(
  input: Omit<StagePlayMicroReasonerPromptToolActivityV1, "artifactId" | "schemaVersion" | "evidenceRefs" | "assistant_answer" | "terminal_eligible" | "context_role"> & {
    evidenceRefs?: string[];
  },
): StagePlayMicroReasonerPromptToolActivityV1 {
  const activity: StagePlayMicroReasonerPromptToolActivityV1 = {
    artifactId: "stage_play_micro_reasoner_prompt_tool_activity",
    schemaVersion: "stage_play_micro_reasoner_prompt_tool_activity/v1",
    ...input,
    sourceIds: uniqueStrings(input.sourceIds),
    evidenceRefs: uniqueStrings(input.evidenceRefs ?? []),
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
  };
  promptToolActivitiesById.set(activity.activityId, activity);
  return activity;
}

export function listStagePlayMicroReasonerPromptToolActivities(input: {
  sourceId?: string | null;
  presetId?: string | null;
  status?: StagePlayMicroReasonerPromptToolActivityV1["status"] | null;
  limit?: number;
} = {}): StagePlayMicroReasonerPromptToolActivityV1[] {
  const limit = Math.max(1, Math.min(input.limit ?? 20, 100));
  return Array.from(promptToolActivitiesById.values())
    .filter((activity) => !input.sourceId || activity.sourceIds.includes(input.sourceId))
    .filter((activity) => !input.presetId || activity.presetId === input.presetId)
    .filter((activity) => input.status == null || activity.status === input.status)
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))
    .slice(-limit);
}

export function recordStagePlayCustomMicroReasonerPromptPreset(input: {
  title?: string | null;
  description?: string | null;
  basePresetId?: string | null;
  role: StagePlayMicroReasonerRoleV1;
  template: string;
  sourceIds?: string[];
  promptedRoles?: StagePlayMicroReasonerRoleV1[];
  now?: string;
}): {
  preset: StagePlayMicroReasonerPromptPresetV1;
  prompt: StagePlayMicroReasonerPromptV1;
} | null {
  ensureDefaultStagePlayMicroReasonerPromptPresets();
  const template = input.template.trim();
  if (!template) return null;
  const now = input.now ?? new Date().toISOString();
  const basePreset =
    (input.basePresetId ? getStagePlayMicroReasonerPromptPreset(input.basePresetId) : null) ??
    getStagePlayMicroReasonerPromptPreset("stage_play_micro_reasoner_prompt_preset:generic-live-source:v1");
  if (!basePreset) return null;
  const basePrompt =
    getStagePlayMicroReasonerPrompt(basePreset.rolePromptIds[input.role] ?? defaultPromptIdForRole(input.role)) ??
    getStagePlayMicroReasonerPrompt(defaultPromptIdForRole(input.role));
  if (!basePrompt) return null;
  const title = input.title?.trim() || `Custom ${basePrompt.title}`;
  const presetSlug = customSlug(`${title}-${input.role}-${Date.now().toString(36)}`);
  const presetId = `stage_play_micro_reasoner_prompt_preset:custom:${presetSlug}:v1`;
  const promptId = `stage_play_micro_reasoner_prompt:custom:${presetSlug}:${input.role}:v1`;
  const promptedRoles = uniqueStrings([
    ...(input.promptedRoles ?? basePreset.promptedRoles),
    input.role,
  ]) as StagePlayMicroReasonerRoleV1[];
  const prompt: StagePlayMicroReasonerPromptV1 = {
    ...basePrompt,
    promptId,
    title,
    role: input.role,
    version: basePrompt.version + 1,
    active: true,
    template,
    linkedNoteId: basePrompt.linkedNoteId ?? null,
    presetIds: [presetId],
    createdAt: now,
    updatedAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  };
  const preset: StagePlayMicroReasonerPromptPresetV1 = {
    ...basePreset,
    presetId,
    title: title.endsWith("Deck") ? title : `${title} Deck`,
    description: input.description?.trim() ||
      `Custom MicroDeck based on ${basePreset.title}; overrides ${basePrompt.title}.`,
    domain: "custom",
    sourceIds: uniqueStrings(input.sourceIds ?? []),
    rolePromptIds: {
      ...basePreset.rolePromptIds,
      [input.role]: promptId,
    },
    promptedRoles,
    deckRunPlan: "custom",
    baselineRoles: basePreset.baselineRoles,
    wakeCoalescingPolicy: basePreset.wakeCoalescingPolicy ?? DEFAULT_WAKE_COALESCING_POLICY,
    active: true,
    createdAt: now,
    updatedAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  };
  promptsById.set(prompt.promptId, prompt);
  promptPresetsById.set(preset.presetId, preset);
  return { preset, prompt };
}

export function getStagePlayMicroReasonerPromptPreset(
  presetId: string,
): StagePlayMicroReasonerPromptPresetV1 | null {
  ensureDefaultStagePlayMicroReasonerPromptPresets();
  return promptPresetsById.get(presetId) ?? null;
}

export function listStagePlayMicroReasonerPromptPresets(input: {
  sourceId?: string | null;
  includePresets?: boolean;
  active?: boolean | null;
  limit?: number;
} = {}): StagePlayMicroReasonerPromptPresetV1[] {
  ensureDefaultStagePlayMicroReasonerPromptPresets();
  const limit = Math.max(1, Math.min(input.limit ?? 100, 250));
  return Array.from(promptPresetsById.values())
    .filter((preset) => input.active == null || preset.active === input.active)
    .filter((preset) =>
      !input.sourceId ||
      preset.sourceIds.includes(input.sourceId) ||
      (input.includePresets === true && preset.sourceIds.length === 0)
    )
    .filter((preset) => input.includePresets !== false || preset.sourceIds.length > 0)
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))
    .slice(-limit);
}

export function getActiveStagePlayMicroReasonerPromptPresetForSource(input: {
  sourceId?: string | null;
  presetId?: string | null;
} = {}): StagePlayMicroReasonerPromptPresetV1 | null {
  ensureDefaultStagePlayMicroReasonerPromptPresets();
  if (input.presetId) {
    const preset = getStagePlayMicroReasonerPromptPreset(input.presetId);
    if (preset?.active) return preset;
  }
  if (input.sourceId) {
    const scoped = listStagePlayMicroReasonerPromptPresets({
      sourceId: input.sourceId,
      active: true,
      includePresets: false,
      limit: 25,
    }).at(-1);
    if (scoped) return scoped;
  }
  return getStagePlayMicroReasonerPromptPreset("stage_play_micro_reasoner_prompt_preset:generic-live-source:v1");
}

export function applyStagePlayMicroReasonerPromptPreset(input: {
  presetId: string;
  sourceIds: string[];
  now?: string;
}): StagePlayMicroReasonerPromptPresetV1 | null {
  ensureDefaultStagePlayMicroReasonerPromptPresets();
  const preset = getStagePlayMicroReasonerPromptPreset(input.presetId);
  if (!preset) return null;
  const now = input.now ?? new Date().toISOString();
  const sourceIds = uniqueStrings([...preset.sourceIds, ...input.sourceIds]);
  const updated: StagePlayMicroReasonerPromptPresetV1 = {
    ...preset,
    sourceIds,
    updatedAt: now,
  };
  promptPresetsById.set(updated.presetId, updated);
  return updated;
}

export function getStagePlayMicroReasonerPrompt(
  promptId: string,
): StagePlayMicroReasonerPromptV1 | null {
  ensureDefaultStagePlayMicroReasonerPrompts();
  return promptsById.get(promptId) ?? null;
}

export function getActiveStagePlayMicroReasonerPromptForRole(
  role: StagePlayMicroReasonerRoleV1,
  input: {
    sourceId?: string | null;
    presetId?: string | null;
  } = {},
): StagePlayMicroReasonerPromptV1 | null {
  const preset = getActiveStagePlayMicroReasonerPromptPresetForSource(input);
  const promptId = preset?.rolePromptIds[role];
  if (promptId) {
    const presetPrompt = getStagePlayMicroReasonerPrompt(promptId);
    if (presetPrompt?.active) return presetPrompt;
  }
  const defaultPrompt = getStagePlayMicroReasonerPrompt(defaultPromptIdForRole(role));
  if (defaultPrompt?.active) return defaultPrompt;
  return listStagePlayMicroReasonerPrompts({ active: true, role, limit: 1 }).at(-1) ?? null;
}

export function listStagePlayActiveMicroReasonerPromptsForSource(input: {
  sourceId?: string | null;
  presetId?: string | null;
  roles?: StagePlayMicroReasonerRoleV1[];
  limit?: number;
} = {}): StagePlayMicroReasonerPromptV1[] {
  ensureDefaultStagePlayMicroReasonerPromptPresets();
  const roles = input.roles ?? [
    "claim_extractor",
    "observation_classifier",
    "effort_estimator",
    "axiom_extractor",
    "hypothesis_generator",
    "profile_comparator",
    "delta_extractor",
    "prediction_validator",
    "salience_scorer",
    "hypothesis_arbiter",
    "decision_selector",
    "voice_callout_drafter",
    "packet_composer",
  ];
  return roles
    .map((role) => getActiveStagePlayMicroReasonerPromptForRole(role, input))
    .filter((prompt): prompt is StagePlayMicroReasonerPromptV1 => Boolean(prompt))
    .slice(0, input.limit ?? roles.length);
}

export function getStagePlayPromptedMicroReasonerRolesForSource(input: {
  sourceId?: string | null;
  presetId?: string | null;
} = {}): StagePlayMicroReasonerRoleV1[] {
  return getActiveStagePlayMicroReasonerPromptPresetForSource(input)?.promptedRoles ?? DEFAULT_PROMPTED_MICRO_REASONER_ROLES;
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
  promptPresetsById.clear();
  runsById.clear();
  packetsById.clear();
  promptToolActivitiesById.clear();
}
