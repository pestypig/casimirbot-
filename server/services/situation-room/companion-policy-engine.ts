import type {
  HelixCompanionMode,
  HelixCompanionPolicy,
  HelixConversationModeClassification,
} from "@shared/helix-conversation-mode";
import type { HelixVoiceLaneIngestDecision } from "@shared/helix-voice-lane-event";

const policiesByThread = new Map<string, HelixCompanionPolicy>();

const normalizeCompanionMode = (value?: string | null): HelixCompanionMode => {
  if (
    value === "off" ||
    value === "direct_address_only" ||
    value === "active_companion" ||
    value === "critical_voice" ||
    value === "debug_trace"
  ) {
    return value;
  }
  return "direct_address_only";
};

export function defaultCompanionPolicy(threadId = "helix-ask:desktop", now = new Date().toISOString()): HelixCompanionPolicy {
  return {
    schema: "helix.companion_policy.v1",
    thread_id: threadId,
    voice_input_active: false,
    voice_output_enabled: false,
    companion_mode: "direct_address_only",
    commentary_mode: "milestones_only",
    direct_address_names: ["helix", "dottie"],
    allowed_outputs: [
      "silent_keep_in_context",
      "show_text",
      "voice_on_confirm",
      "request_agentic_review",
      "start_user_turn",
    ],
    context_policy: "compact_context_pack_only",
    raw_audio_included: false,
    raw_transcript_included: false,
    updated_at: now,
  };
}

export function upsertCompanionPolicy(input: {
  thread_id?: string | null;
  voice_input_active?: boolean;
  voice_output_enabled?: boolean;
  companion_mode?: string | null;
  commentary_mode?: HelixCompanionPolicy["commentary_mode"];
  direct_address_names?: string[];
  allowed_outputs?: HelixCompanionPolicy["allowed_outputs"];
  now?: string;
}): HelixCompanionPolicy {
  const threadId = input.thread_id?.trim() || "helix-ask:desktop";
  const existing = policiesByThread.get(threadId) ?? defaultCompanionPolicy(threadId, input.now);
  const names = input.direct_address_names?.length
    ? input.direct_address_names.map((name: string) => name.trim().toLowerCase()).filter(Boolean)
    : existing.direct_address_names;
  const policy: HelixCompanionPolicy = {
    ...existing,
    voice_input_active: input.voice_input_active ?? existing.voice_input_active,
    voice_output_enabled: input.voice_output_enabled ?? existing.voice_output_enabled,
    companion_mode: normalizeCompanionMode(input.companion_mode ?? existing.companion_mode),
    commentary_mode: input.commentary_mode ?? existing.commentary_mode,
    direct_address_names: Array.from(new Set(names)),
    allowed_outputs: input.allowed_outputs ?? existing.allowed_outputs,
    updated_at: input.now ?? new Date().toISOString(),
  };
  policiesByThread.set(threadId, policy);
  return policy;
}

export function getCompanionPolicy(threadId: string): HelixCompanionPolicy {
  return policiesByThread.get(threadId) ?? defaultCompanionPolicy(threadId);
}

export function decideVoiceLaneAction(input: {
  policy: HelixCompanionPolicy;
  classification: HelixConversationModeClassification;
}): HelixVoiceLaneIngestDecision {
  const { policy, classification } = input;
  if (!policy.voice_input_active) return "silent_keep_in_context";
  if (policy.companion_mode === "off") return "record_context";
  if (
    classification.direct_addressed &&
    classification.speaker_authority !== "authorized_user"
  ) {
    return "record_context";
  }
  if (classification.command_candidate && classification.direct_addressed) return "start_user_turn";
  if (classification.direct_addressed) return "start_user_turn";
  if (classification.active_companion_requested) {
    return "request_agentic_review";
  }
  if (policy.companion_mode === "active_companion" && classification.conversation_mode === "active_companion") {
    return "request_agentic_review";
  }
  if (policy.companion_mode === "debug_trace") return "show_text";
  return "record_context";
}

export function resetCompanionPolicies(): void {
  policiesByThread.clear();
}
