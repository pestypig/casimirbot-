import type {
  HelixCompanionPolicy,
  HelixConversationModeClassification,
} from "@shared/helix-conversation-mode";
import type { LiveAnswerEnvironment } from "@shared/helix-live-answer-environment";
import type { LiveCommentaryProposal } from "@shared/helix-live-commentary";
import type {
  HelixVoiceOutputAction,
  HelixVoiceOutputDecision,
} from "@shared/helix-voice-output-decision";

const buildDecision = (
  action: HelixVoiceOutputAction,
  reason: HelixVoiceOutputDecision["reason"],
): HelixVoiceOutputDecision => ({
  schema: "helix.voice_output_decision.v1",
  action,
  reason,
  speakable: action === "voice_now",
  requires_confirmation: action === "voice_on_confirm",
  assistant_answer: false,
  raw_audio_included: false,
  raw_transcript_included: false,
  context_policy: "compact_context_pack_only",
});

export function decideVoiceOutputAction(input: {
  policy: HelixCompanionPolicy;
  classification?: HelixConversationModeClassification | null;
  environment?: LiveAnswerEnvironment | null;
  environmentMode?: LiveAnswerEnvironment["mode"] | null;
  commentary?: LiveCommentaryProposal | null;
  cooldownOk: boolean;
}): HelixVoiceOutputDecision {
  const { policy, classification, environment, commentary, cooldownOk } = input;
  const environmentMode = environment?.mode ?? input.environmentMode ?? null;

  if (!policy.voice_output_enabled) {
    return buildDecision(
      commentary?.user_visible ? "show_text" : "journal_only",
      "voice_output_disabled",
    );
  }

  if (
    classification &&
    (classification.transcript_kind === "ambient" ||
      classification.conversation_mode === "ambient_listening")
  ) {
    return buildDecision("journal_only", "ambient_context");
  }

  if (classification?.command_candidate && classification.direct_addressed) {
    return buildDecision("voice_now", "command_candidate");
  }

  if (classification?.direct_addressed) {
    return buildDecision("voice_now", "direct_address");
  }

  if (
    environmentMode === "critical_voice" &&
    commentary?.priority === "critical" &&
    cooldownOk
  ) {
    return buildDecision("voice_now", "critical_commentary");
  }

  if (
    environmentMode === "voice_on_confirm" &&
    commentary?.user_visible &&
    cooldownOk
  ) {
    return buildDecision("voice_on_confirm", "voice_confirmation_required");
  }

  if (
    policy.companion_mode === "active_companion" &&
    commentary?.user_visible &&
    cooldownOk
  ) {
    return buildDecision("show_text", "companion_text_surface");
  }

  if (policy.companion_mode === "debug_trace" && commentary?.user_visible) {
    return buildDecision("show_text", "debug_text_surface");
  }

  return buildDecision("remain_silent", "silent_policy");
}
