import {
  HELIX_SITUATION_SETUP_INTENT_SCHEMA,
  HELIX_SITUATION_SETUP_RECEIPT_SCHEMA,
  normalizeSituationSetupOutputMode,
  type SituationRoomSetupActionArgs,
  type SituationRoomSetupCapturePreference,
  type SituationRoomSetupIntent,
  type SituationRoomSetupIntentKind,
  type SituationRoomSetupMissingRequirement,
  type SituationRoomSetupReceipt,
  type SituationRoomSetupSpeakerMapping,
} from "@shared/helix-situation-setup";

type WorkspaceSnapshotLike = {
  situationRoomContext?: Record<string, unknown> | null;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));

const readString = (value: unknown): string | null => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
};

const readStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return uniqueStrings(value.map((entry) => readString(entry)));
  const single = readString(value);
  return single ? [single] : [];
};

export const isSituationRoomSetupPrompt = (prompt: string): boolean => {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return false;
  if (/\b(?:create|run|start|make)\b.*\b(?:job|pipeline)\b/.test(normalized) || /\btranslation\s+job\b/.test(normalized)) {
    return false;
  }
  const conversationCue = /\b(?:conversation|call|voice\s+chat|discord|meeting|room|microphone|mic|browser\s+tab|tab\s+audio)\b/.test(normalized);
  const setupCue = /\b(?:translate|translation|monitor|listen|summari[sz]e|compose\s+prompt|set\s+up|setup)\b/.test(normalized);
  return conversationCue && setupCue;
};

export const classifySituationRoomSetupIntentKind = (prompt: string): SituationRoomSetupIntentKind => {
  const normalized = prompt.trim().toLowerCase();
  if (/\b(?:summari[sz]e|summary)\b/.test(normalized)) return "summarize_conversation";
  if (/\b(?:compose\s+prompt|prompt\s+from)\b/.test(normalized)) return "compose_prompt_from_room";
  if (/\b(?:monitor|listen|watch)\b/.test(normalized) && !/\btranslat/.test(normalized)) return "monitor_conversation";
  return "translate_conversation";
};

export const classifySituationRoomCapturePreference = (prompt: string): SituationRoomSetupCapturePreference => {
  const normalized = prompt.trim().toLowerCase();
  if (/\b(?:same\s+)?(?:microphone|mic)\b/.test(normalized)) return "mic";
  if (/\b(?:discord|browser\s+tab|tab\s+audio|this\s+tab)\b/.test(normalized)) return "browser_tab_audio";
  if (/\b(?:display|screen|window|screen\s+share|screenshare)\b/.test(normalized)) return "display_audio";
  if (/\b(?:existing|attached|current|live)\s+(?:source|room)\b/.test(normalized)) return "existing_source";
  return "unknown";
};

const readSituationRoomContext = (workspaceSnapshot?: WorkspaceSnapshotLike | null): Record<string, unknown> | null => {
  const context = workspaceSnapshot?.situationRoomContext;
  return context && typeof context === "object" && !Array.isArray(context) ? context : null;
};

export const readSituationRoomSetupSourceIds = (workspaceSnapshot?: WorkspaceSnapshotLike | null): string[] => {
  const context = readSituationRoomContext(workspaceSnapshot);
  return uniqueStrings([
    ...readStringArray(context?.source_ids),
    ...readStringArray(context?.sourceIds),
    ...readStringArray(context?.source_id),
  ]);
};

export const readSituationRoomSetupRoomId = (workspaceSnapshot?: WorkspaceSnapshotLike | null): string | null => {
  const context = readSituationRoomContext(workspaceSnapshot);
  return readString(context?.room_id) ?? readString(context?.roomId) ?? null;
};

export const readSituationRoomSetupSpeakerMappings = (
  workspaceSnapshot?: WorkspaceSnapshotLike | null,
): SituationRoomSetupSpeakerMapping[] => {
  const context = readSituationRoomContext(workspaceSnapshot);
  const rawSpeakers = Array.isArray(context?.speaker_mappings)
    ? context?.speaker_mappings
    : Array.isArray(context?.speakers)
      ? context?.speakers
      : [];
  return rawSpeakers
    .map((entry): SituationRoomSetupSpeakerMapping | null => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const record = entry as Record<string, unknown>;
      const role = readString(record.role_hint) ?? readString(record.role);
      return {
        speaker_id: readString(record.speaker_id) ?? readString(record.id),
        display_name: readString(record.display_name) ?? readString(record.name),
        native_language: readString(record.native_language) ?? readString(record.language),
        role_hint: role === "self" || role === "friend" || role === "participant" ? role : undefined,
      };
    })
    .filter((entry): entry is SituationRoomSetupSpeakerMapping => Boolean(entry));
};

export const buildSituationRoomSetupIntent = (args: {
  prompt: string;
  workspaceSnapshot?: WorkspaceSnapshotLike | null;
}): SituationRoomSetupIntent | null => {
  if (!isSituationRoomSetupPrompt(args.prompt)) return null;
  const kind = classifySituationRoomSetupIntentKind(args.prompt);
  const capturePreference = classifySituationRoomCapturePreference(args.prompt);
  const sourceIds = readSituationRoomSetupSourceIds(args.workspaceSnapshot);
  const roomId = readSituationRoomSetupRoomId(args.workspaceSnapshot);
  const speakerMappings = readSituationRoomSetupSpeakerMappings(args.workspaceSnapshot);
  const speakerA = speakerMappings.find((entry) => entry.role_hint === "self") ?? speakerMappings[0] ?? null;
  const speakerB = speakerMappings.find((entry) => entry.role_hint === "friend") ?? speakerMappings.find((entry) => entry !== speakerA) ?? null;
  const missing = new Set<SituationRoomSetupMissingRequirement>();

  if (sourceIds.length === 0) {
    missing.add("audio_source");
    if (capturePreference === "browser_tab_audio" || capturePreference === "display_audio" || capturePreference === "mic") {
      missing.add("capture_permission");
    }
  }
  if (kind === "translate_conversation") {
    if (!speakerA?.speaker_id) missing.add("speaker_a");
    if (!speakerB?.speaker_id) missing.add("speaker_b");
    if (!speakerA?.native_language) missing.add("speaker_a_native_language");
    if (!speakerB?.native_language) missing.add("speaker_b_native_language");
  }

  return {
    schema: HELIX_SITUATION_SETUP_INTENT_SCHEMA,
    kind,
    capture_preference: capturePreference,
    room_id: roomId,
    source_ids: sourceIds,
    speaker_mappings: speakerMappings,
    output_mode: "visual_only",
    missing_requirements: Array.from(missing),
  };
};

export const buildSituationRoomSetupActionArgs = (intent: SituationRoomSetupIntent): SituationRoomSetupActionArgs => {
  const speakerA = intent.speaker_mappings?.find((entry) => entry.role_hint === "self") ?? intent.speaker_mappings?.[0];
  const speakerB =
    intent.speaker_mappings?.find((entry) => entry.role_hint === "friend") ??
    intent.speaker_mappings?.find((entry) => entry !== speakerA);
  return {
    intent:
      intent.kind === "monitor_conversation"
        ? "monitor_conversation"
        : intent.kind === "summarize_conversation"
          ? "summarize_conversation"
          : "translate_conversation",
    capture_preference: intent.capture_preference,
    ...(intent.room_id ? { room_id: intent.room_id } : {}),
    ...(intent.source_ids?.length ? { source_ids: intent.source_ids } : {}),
    ...(speakerA?.speaker_id ? { speaker_a_id: speakerA.speaker_id } : {}),
    ...(speakerB?.speaker_id ? { speaker_b_id: speakerB.speaker_id } : {}),
    ...(speakerA?.native_language ? { speaker_a_native_language: speakerA.native_language } : {}),
    ...(speakerB?.native_language ? { speaker_b_native_language: speakerB.native_language } : {}),
    output_mode: intent.output_mode,
  };
};

export const buildSituationRoomSetupReceipt = (args: {
  intent: SituationRoomSetupIntent;
  setupActionArgs?: SituationRoomSetupActionArgs;
  graphId?: string | null;
  jobIds?: string[];
}): SituationRoomSetupReceipt => {
  const missing = args.intent.missing_requirements;
  const setupStatus =
    missing.includes("capture_permission") || missing.includes("audio_source")
      ? "needs_capture_permission"
      : missing.length > 0
        ? "needs_user_input"
        : "complete";
  const setupArgs = args.setupActionArgs ?? buildSituationRoomSetupActionArgs(args.intent);
  const nextActions =
    setupStatus === "needs_capture_permission"
      ? [
          {
            schema_version: "helix.workstation.action/v1" as const,
            action: "open_panel" as const,
            panel_id: "situation-room-sources",
          },
          {
            schema_version: "helix.workstation.action/v1" as const,
            action: "run_panel_action" as const,
            panel_id: "situation-room-pipelines",
            action_id: "setup_from_prompt",
            args: setupArgs as Record<string, unknown>,
          },
        ]
      : [
          {
            schema_version: "helix.workstation.action/v1" as const,
            action: "run_panel_action" as const,
            panel_id: "situation-room-pipelines",
            action_id: "setup_from_prompt",
            args: setupArgs as Record<string, unknown>,
          },
        ];

  const message =
    setupStatus === "complete"
      ? "Prepared Situation Room translation setup. The graph/jobs remain manual-only and explicit-context-only."
      : setupStatus === "needs_capture_permission"
        ? "I can prepare the Situation Room workflow, but you need to attach an audio source before capture can start."
        : `I need ${missing.join(", ")} before creating the Situation Room workflow.`;

  return {
    schema: HELIX_SITUATION_SETUP_RECEIPT_SCHEMA,
    ok: setupStatus === "complete",
    setup_status: setupStatus,
    ...(args.graphId ? { graph_id: args.graphId } : {}),
    ...(args.jobIds?.length ? { job_ids: args.jobIds } : {}),
    ...(args.intent.room_id ? { room_id: args.intent.room_id } : {}),
    ...(args.intent.source_ids?.length ? { source_ids: args.intent.source_ids } : {}),
    speaker_ids: uniqueStrings(args.intent.speaker_mappings?.map((entry) => entry.speaker_id ?? null) ?? []),
    missing_requirements: missing,
    next_actions: nextActions,
    attachment_policy: "manual_only",
    context_injection: "explicit_attachment_only",
    command_lane_enabled: false,
    output_mode: normalizeSituationSetupOutputMode(args.intent.output_mode),
    message,
  };
};
