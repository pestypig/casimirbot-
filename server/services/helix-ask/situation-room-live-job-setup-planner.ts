import crypto from "node:crypto";
import {
  SITUATION_ROOM_LIVE_JOB_CONTRACT_SCHEMA,
  type SituationRoomLiveJobContract,
  type SituationRoomLiveJobPurpose,
  type SituationRoomVoicePolicy,
} from "@shared/situation-room-live-job-contract";

export type SituationRoomLiveJobSetupPlan = {
  purpose: SituationRoomLiveJobPurpose;
  selected_recipe: string;
  operating_prompt: string;
  required_sources: SituationRoomLiveJobContract["source_requirements"];
  output_bindings: SituationRoomLiveJobContract["output_bindings"];
  missing_inputs: string[];
  voice_policy: SituationRoomVoicePolicy;
  authority_policy: SituationRoomLiveJobContract["authority_policy"];
  live_job_contract: SituationRoomLiveJobContract;
};

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const hasMinecraftCue = (prompt: string): boolean => /\bminecraft|route|off\s+route|world\s+events?\b/i.test(prompt);
const hasChromeAudioCue = (prompt: string): boolean => /\b(?:chrome|browser|tab)\b[\s\S]{0,80}\baudio\b/i.test(prompt);
const hasTwoPersonTranslationCue = (prompt: string): boolean =>
  /\b(?:two[-\s]?person|two\s+users?|same\s+mic|translation\s+room)\b/i.test(prompt);
const asksForReadAloud = (prompt: string): boolean => /\b(?:read|speak|say)\b[\s\S]{0,60}\b(?:out\s+loud|aloud|voice)\b/i.test(prompt);

const sourceStatus = (
  sourceKind: SituationRoomLiveJobContract["source_requirements"][number]["source_kind"],
  required: boolean,
  sourceIds: string[],
  missingReason: string,
): SituationRoomLiveJobContract["source_requirements"][number] => ({
  source_kind: sourceKind,
  required,
  status: sourceIds.length > 0 ? "connected" : required ? "missing" : "unknown",
  binding_id: sourceIds[0],
  missing_reason: sourceIds.length > 0 ? undefined : missingReason,
});

export function planSituationRoomLiveJobSetup(input: {
  prompt: string;
  turnId: string;
  sourceIds?: string[] | null;
  now?: string | null;
}): SituationRoomLiveJobSetupPlan {
  const prompt = normalizeText(input.prompt) ?? "";
  const sourceIds = Array.isArray(input.sourceIds)
    ? Array.from(new Set(input.sourceIds.map(normalizeText).filter((entry): entry is string => Boolean(entry))))
    : [];
  const now = normalizeText(input.now) ?? new Date().toISOString();
  const isTwoPersonTranslation = hasTwoPersonTranslationCue(prompt);
  const isTranslation = isTwoPersonTranslation || /\btranslat(?:e|ion)\b/i.test(prompt);
  const isTranscription = /\btranscrib(?:e|er|ing|tion)\b/i.test(prompt);
  const isMinecraft = hasMinecraftCue(prompt);
  const isChromeAudio = hasChromeAudioCue(prompt);
  const explicitAutomaticVoice = /\bautomatic(?:ally)?\b/i.test(prompt) && asksForReadAloud(prompt);

  const purpose: SituationRoomLiveJobPurpose = isTranslation
    ? "translation"
    : isMinecraft
      ? "voice_witness"
      : isTranscription
        ? "transcription"
        : "custom";
  const selectedRecipe = isTwoPersonTranslation
    ? "two_person_translation_room"
    : isTranslation && isChromeAudio
      ? "browser_audio_translation"
      : isTranscription && isChromeAudio
        ? "browser_audio_transcriber"
      : isMinecraft
        ? "auntie_dottie_minecraft_watch"
        : "custom_live_job";
  const name = selectedRecipe === "auntie_dottie_minecraft_watch"
    ? "Auntie Dottie Minecraft Watch"
    : selectedRecipe === "browser_audio_translation"
      ? "Browser Audio Translation"
      : selectedRecipe === "browser_audio_transcriber"
        ? "Browser Audio Transcriber"
      : selectedRecipe === "two_person_translation_room"
        ? "Two-Person Translation Room"
        : "Situation Room Live Job";
  const voicePolicy: SituationRoomVoicePolicy = explicitAutomaticVoice
    ? "automatic_when_policy_allows"
    : asksForReadAloud(prompt)
      ? "confirm_speak_required"
      : selectedRecipe === "auntie_dottie_minecraft_watch"
        ? "propose_only"
        : "muted";
  const operatingPrompt = prompt || `Run ${name} as an evidence-only Situation Room live job.`;

  const requiredSources: SituationRoomLiveJobContract["source_requirements"] = selectedRecipe === "auntie_dottie_minecraft_watch"
    ? [
        sourceStatus("minecraft_world_events", true, sourceIds.filter((source) => /minecraft|world/i.test(source)), "Minecraft world-event source is required for route watching."),
        sourceStatus("mic_audio", false, sourceIds.filter((source) => /mic|audio/i.test(source)), "Mic is optional for direct address."),
        sourceStatus("screen_capture", false, sourceIds.filter((source) => /screen|visual|capture/i.test(source)), "Screen capture is optional supporting evidence."),
      ]
    : selectedRecipe === "browser_audio_translation" || selectedRecipe === "browser_audio_transcriber"
      ? [
          sourceStatus("browser_audio", true, sourceIds.filter((source) => /browser|chrome|tab|display|audio/i.test(source)), "Browser audio source is required for translation."),
        ]
      : selectedRecipe === "two_person_translation_room"
        ? [
            sourceStatus("mic_audio", true, sourceIds.filter((source) => /mic|audio/i.test(source)), "Mic audio source is required for same-mic translation."),
          ]
        : [
            sourceStatus("operator_text", false, sourceIds, "No live source requirement inferred yet."),
          ];

  const missingInputs = requiredSources
    .filter((source) => source.required && source.status !== "connected")
    .map((source) => source.source_kind);

  const outputBindings: SituationRoomLiveJobContract["output_bindings"] =
    selectedRecipe === "auntie_dottie_minecraft_watch"
      ? [
          { output_kind: "typed_commentary", status: "planned", policy: { authority: "evidence_only" } },
          { output_kind: "route_evidence", status: "planned", policy: { threshold: "confirmed" } },
          { output_kind: "voice_proposal", status: "planned", policy: { voice_policy: voicePolicy } },
          { output_kind: "live_answers_card", status: "planned", policy: { projection_only: true } },
        ]
      : selectedRecipe === "browser_audio_translation" || selectedRecipe === "browser_audio_transcriber" || selectedRecipe === "two_person_translation_room"
        ? selectedRecipe === "browser_audio_transcriber"
          ? [
              { output_kind: "transcript_stream", status: "planned", policy: { raw_audio_included: false } },
              { output_kind: "typed_commentary", status: "planned", policy: { authority: "evidence_only" } },
            ]
          : [
              { output_kind: "translated_transcript", status: "planned", policy: { raw_audio_included: false } },
              { output_kind: "translated_speech", status: "planned", policy: { voice_policy: voicePolicy } },
            ]
        : [{ output_kind: "typed_commentary", status: "planned", policy: { authority: "evidence_only" } }];

  const contract: SituationRoomLiveJobContract = {
    schema: SITUATION_ROOM_LIVE_JOB_CONTRACT_SCHEMA,
    contract_id: `situation_live_job:${hashShort([input.turnId, selectedRecipe, operatingPrompt])}`,
    turn_id: input.turnId,
    name,
    purpose,
    selected_recipe: selectedRecipe,
    operating_prompt: operatingPrompt,
    operating_prompt_history: [{
      prompt: operatingPrompt,
      changed_at: now,
      changed_by: "user",
      reason: "initial_live_job_setup_prompt",
    }],
    compiled_policy: {
      callout_style: selectedRecipe === "auntie_dottie_minecraft_watch" ? "tactical" : "short",
      interruption_policy: selectedRecipe === "auntie_dottie_minecraft_watch" ? "policy_triggered" : "direct_questions_only",
      evidence_threshold: /\bconfirmed|actually|only\s+if\b/i.test(prompt) ? "confirmed" : "observed",
      cadence: "event_driven",
      suppress_until_trigger: true,
      trigger_rules: selectedRecipe === "auntie_dottie_minecraft_watch"
        ? ["confirmed_route_drift", "missing_required_source", "direct_question"]
        : ["source_available", "translation_segment_ready", "direct_question"],
      stop_conditions: ["user_stops_job", "source_detached", "operating_prompt_replaced"],
    },
    source_requirements: requiredSources,
    output_bindings: outputBindings,
    voice_policy: voicePolicy,
    authority_policy: {
      assistant_answer: false,
      construct_answer_authority: selectedRecipe === "auntie_dottie_minecraft_watch" ? "witness_only" : "evidence_only",
      helix_ask_terminal_authority_required: true,
    },
    runtime_status: missingInputs.length > 0 ? "blocked" : "proposed",
    diagnostics: missingInputs.map((missing) => ({
      code: `missing_${missing}`,
      severity: "warning" as const,
      message: `Required source is missing: ${missing}.`,
      repair_action: "attach_source",
    })),
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    purpose,
    selected_recipe: selectedRecipe,
    operating_prompt: operatingPrompt,
    required_sources: requiredSources,
    output_bindings: outputBindings,
    missing_inputs: missingInputs,
    voice_policy: voicePolicy,
    authority_policy: contract.authority_policy,
    live_job_contract: contract,
  };
}
