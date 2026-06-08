import {
  HELIX_SITUATION_SETUP_INTENT_SCHEMA,
  HELIX_SITUATION_SETUP_RECEIPT_SCHEMA,
  normalizeSituationSetupOutputMode,
  type SituationRoomSetupActionArgs,
  type SituationRoomSetupCorrelation,
  type SituationRoomSetupCapturePreference,
  type SituationRoomSetupIntent,
  type SituationRoomSetupIntentKind,
  type SituationRoomSetupMissingRequirement,
  type SituationRoomSetupPlanReceipt,
  type SituationRoomSetupSpeakerMapping,
} from "@shared/helix-situation-setup";
import type { SituationRoomCaptureContext, SituationCaptureSourceSnapshot } from "@shared/helix-situation-capture-context";

type WorkspaceSnapshotLike = {
  situationRoomContext?: Record<string, unknown> | null;
  situationCaptureContext?: Record<string, unknown> | null;
};

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value: string | null | undefined) => value?.trim()).filter((value: string | undefined): value is string => Boolean(value))));

const readString = (value: unknown): string | null => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
};

const readStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return uniqueStrings(value.map((entry: unknown) => readString(entry)));
  const single = readString(value);
  return single ? [single] : [];
};

export const isSituationRoomSetupPrompt = (prompt: string): boolean => {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return false;
  const liveSourceInterpreterProfileCue =
    /\b(?:interpreter\s+profile|profile\s+for\s+(?:this|the)\s+(?:source|live\s+source|visual\s+source)|guidelines\s+for\s+interpreting\s+(?:the\s+)?(?:source|live\s+source|visual\s+source)|survival\s+coach|browser\s+workflow\s+watcher|video\s+scene\s+interpreter|code\s+log\s+failure\s+watcher|call\s+out\s+(?:danger|rare\s+resources|strategic\s+decisions?)|ignore\s+routine)\b/.test(
      normalized,
    );
  if (liveSourceInterpreterProfileCue) return false;
  const promptComposerCue =
    /\b(?:prompt\s+composer|compose\s+a\s+prompt|make\s+a\s+prompt|turn\s+(?:the\s+)?(?:call|conversation|voice\s+chat)\s+into\s+a\s+prompt)\b/.test(
      normalized,
    );
  if (
    !promptComposerCue &&
    (/\b(?:create|run|start|make)\b.*\b(?:job|pipeline)\b/.test(normalized) || /\btranslation\s+job\b/.test(normalized))
  ) {
    return false;
  }
  const conversationCue =
    /\b(?:conversation|call(?!\s+out\b)|voice\s+chat|discord(?:\s+voice\s+chat)?|meeting|room|microphone|mic|same\s+microphone|shared\s+mic|one\s+mic|browser\s+tab|browser\s+call|tab\s+audio)\b/.test(
      normalized,
    );
  const setupCue =
    promptComposerCue ||
    /\b(?:translate|translation|monitor|listen|summari[sz]e|compose\s+prompt|set\s+up|setup|live\s+interpreter|interpreter|interpret(?:\s+this)?|make\s+a\s+live\s+interpreter)\b/.test(
      normalized,
    );
  return conversationCue && setupCue;
};

export const classifySituationRoomSetupIntentKind = (prompt: string): SituationRoomSetupIntentKind => {
  const normalized = prompt.trim().toLowerCase();
  if (/\b(?:summari[sz]e|summary)\b/.test(normalized)) return "summarize_conversation";
  if (
    /\b(?:prompt\s+composer|prompt\s+composer\s+pipeline|compose\s+(?:a\s+)?prompt|prompt\s+from|turn\s+(?:the\s+)?(?:call|conversation|voice\s+chat)\s+into\s+a\s+prompt|make\s+a\s+prompt\s+from)\b/.test(
      normalized,
    )
  ) {
    return "compose_prompt_from_room";
  }
  if (/\b(?:monitor|listen|watch)\b/.test(normalized) && !/\btranslat/.test(normalized)) return "monitor_conversation";
  return "translate_conversation";
};

export const classifySituationRoomCapturePreference = (prompt: string): SituationRoomSetupCapturePreference => {
  const normalized = prompt.trim().toLowerCase();
  if (/\b(?:(?:same|shared|one)\s+)?(?:microphone|mic)\b/.test(normalized)) return "mic";
  if (/\b(?:discord|discord\s+voice\s+chat|browser\s+tab|browser\s+call|tab\s+audio|this\s+tab|this\s+voice\s+chat|this\s+call)\b/.test(normalized)) return "browser_tab_audio";
  if (/\b(?:display|screen|window|screen\s+share|screenshare)\b/.test(normalized)) return "display_audio";
  if (/\b(?:existing|attached|current|live)\s+(?:source|room)\b/.test(normalized)) return "existing_source";
  return "unknown";
};

const readSituationRoomContext = (workspaceSnapshot?: WorkspaceSnapshotLike | null): Record<string, unknown> | null => {
  const context = workspaceSnapshot?.situationRoomContext;
  return context && typeof context === "object" && !Array.isArray(context) ? context : null;
};

export const readSituationCaptureContext = (
  workspaceSnapshot?: WorkspaceSnapshotLike | null,
): SituationRoomCaptureContext | null => {
  const context = workspaceSnapshot?.situationCaptureContext;
  if (!context || typeof context !== "object" || Array.isArray(context)) return null;
  const record = context as Record<string, unknown>;
  const sources = Array.isArray(record.sources)
    ? record.sources.filter(
        (source: unknown): source is SituationCaptureSourceSnapshot =>
          Boolean(source && typeof source === "object" && !Array.isArray(source) && readString((source as Record<string, unknown>).source_id)),
      )
    : [];
  return {
    schema: "helix.situation_capture_context.v1",
    room_id: readString(record.room_id) ?? readString(record.roomId),
    source_ids: readStringArray(record.source_ids ?? record.sourceIds),
    sources,
    context_policy: "explicit_attachment_only",
    command_lane_enabled: false,
  };
};

export const readUsableSituationSources = (
  workspaceSnapshot?: WorkspaceSnapshotLike | null,
): SituationCaptureSourceSnapshot[] => {
  const context = readSituationCaptureContext(workspaceSnapshot);
  return context?.sources.filter((source: SituationCaptureSourceSnapshot) => source.status === "active" && source.permission_state?.capture_granted) ?? [];
};

export const readBlockedSituationSources = (
  workspaceSnapshot?: WorkspaceSnapshotLike | null,
): SituationCaptureSourceSnapshot[] => {
  const context = readSituationCaptureContext(workspaceSnapshot);
  return (
    context?.sources.filter((source: SituationCaptureSourceSnapshot) => ["permission_denied", "error", "stopped"].includes(source.status)) ?? []
  );
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
    .map((entry: unknown): SituationRoomSetupSpeakerMapping | null => {
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
    .filter((entry: SituationRoomSetupSpeakerMapping | null): entry is SituationRoomSetupSpeakerMapping => Boolean(entry));
};

export const buildSituationRoomSetupIntent = (args: {
  prompt: string;
  workspaceSnapshot?: WorkspaceSnapshotLike | null;
}): SituationRoomSetupIntent | null => {
  if (!isSituationRoomSetupPrompt(args.prompt)) return null;
  const kind = classifySituationRoomSetupIntentKind(args.prompt);
  const capturePreference = classifySituationRoomCapturePreference(args.prompt);
  const captureContext = readSituationCaptureContext(args.workspaceSnapshot);
  const usableSources = readUsableSituationSources(args.workspaceSnapshot);
  const blockedSources = readBlockedSituationSources(args.workspaceSnapshot);
  const fallbackSourceIds = readSituationRoomSetupSourceIds(args.workspaceSnapshot);
  const sourceIds = usableSources.length > 0 ? usableSources.map((source: SituationCaptureSourceSnapshot) => source.source_id) : fallbackSourceIds;
  const roomId = captureContext?.room_id ?? readSituationRoomSetupRoomId(args.workspaceSnapshot);
  const speakerMappings = readSituationRoomSetupSpeakerMappings(args.workspaceSnapshot);
  const speakerA = speakerMappings.find((entry: SituationRoomSetupSpeakerMapping) => entry.role_hint === "self") ?? speakerMappings[0] ?? null;
  const speakerB = speakerMappings.find((entry: SituationRoomSetupSpeakerMapping) => entry.role_hint === "friend") ?? speakerMappings.find((entry: SituationRoomSetupSpeakerMapping) => entry !== speakerA) ?? null;
  const missing = new Set<SituationRoomSetupMissingRequirement>();

  if (usableSources.length === 0 && sourceIds.length === 0) {
    missing.add("audio_source");
    if (capturePreference === "browser_tab_audio" || capturePreference === "display_audio" || capturePreference === "mic") {
      missing.add("capture_permission");
    }
  }
  if (usableSources.length === 0 && blockedSources.length > 0) {
    missing.add("audio_source");
    missing.add("capture_permission");
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
    blocked_source_reasons: blockedSources.map((source: SituationCaptureSourceSnapshot) => `${source.source_id}:${source.status}`).slice(0, 8),
    speaker_mappings: speakerMappings,
    output_mode: "visual_only",
    missing_requirements: Array.from(missing),
  };
};

export const buildSituationRoomSetupActionArgs = (
  intent: SituationRoomSetupIntent,
  correlation?: SituationRoomSetupCorrelation,
): SituationRoomSetupActionArgs => {
  const speakerA = intent.speaker_mappings?.find((entry: SituationRoomSetupSpeakerMapping) => entry.role_hint === "self") ?? intent.speaker_mappings?.[0];
  const speakerB =
    intent.speaker_mappings?.find((entry: SituationRoomSetupSpeakerMapping) => entry.role_hint === "friend") ??
    intent.speaker_mappings?.find((entry: SituationRoomSetupSpeakerMapping) => entry !== speakerA);
  return {
    intent:
      intent.kind === "monitor_conversation"
        ? "monitor_conversation"
        : intent.kind === "summarize_conversation"
          ? "summarize_conversation"
          : intent.kind === "compose_prompt_from_room"
            ? "compose_prompt_from_room"
            : "translate_conversation",
    capture_preference: intent.capture_preference,
    ...(intent.room_id ? { room_id: intent.room_id } : {}),
    ...(intent.source_ids?.length ? { source_ids: intent.source_ids } : {}),
    ...(speakerA?.speaker_id ? { speaker_a_id: speakerA.speaker_id } : {}),
    ...(speakerB?.speaker_id ? { speaker_b_id: speakerB.speaker_id } : {}),
    ...(speakerA?.native_language ? { speaker_a_native_language: speakerA.native_language } : {}),
    ...(speakerB?.native_language ? { speaker_b_native_language: speakerB.native_language } : {}),
    output_mode: intent.output_mode,
    ...(correlation ? { correlation } : {}),
  };
};

const fallbackSetupCorrelation = (intent: SituationRoomSetupIntent): SituationRoomSetupCorrelation => ({
  setup_call_id: `situation-setup:local:${intent.kind}:${Date.now().toString(36)}`,
});

export const buildSituationRoomSetupReceipt = (args: {
  intent: SituationRoomSetupIntent;
  setupActionArgs?: SituationRoomSetupActionArgs;
  correlation?: SituationRoomSetupCorrelation;
  graphId?: string | null;
  jobIds?: string[];
}): SituationRoomSetupPlanReceipt => {
  const missing = args.intent.missing_requirements;
  const setupStatus =
    missing.includes("capture_permission") || missing.includes("audio_source")
      ? "needs_capture_permission"
      : missing.length > 0
        ? "needs_user_input"
        : "complete";
  const correlation = args.correlation ?? args.setupActionArgs?.correlation ?? fallbackSetupCorrelation(args.intent);
  const setupArgs = args.setupActionArgs ?? buildSituationRoomSetupActionArgs(args.intent, correlation);
  const lifecycleStatus =
    setupStatus === "needs_capture_permission"
      ? "awaiting_capture_permission"
      : setupStatus === "needs_user_input"
        ? "awaiting_user_input"
        : "planned";
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
      ? "Planned Situation Room setup. The client workstation action must execute before graph or job creation is confirmed."
      : setupStatus === "needs_capture_permission"
        ? "I can prepare the Situation Room workflow, but you need to attach an audio source before capture can start."
        : `I need ${missing.join(", ")} before creating the Situation Room workflow.`;

  return {
    schema: HELIX_SITUATION_SETUP_RECEIPT_SCHEMA,
    ok: setupStatus === "complete",
    correlation,
    setup_status: setupStatus,
    lifecycle_status: lifecycleStatus,
    execution_required: setupStatus === "complete",
    ...(args.intent.room_id ? { room_id: args.intent.room_id } : {}),
    ...(args.intent.source_ids?.length ? { source_ids: args.intent.source_ids } : {}),
    speaker_ids: uniqueStrings(args.intent.speaker_mappings?.map((entry: SituationRoomSetupSpeakerMapping) => entry.speaker_id ?? null) ?? []),
    missing_requirements: missing,
    next_actions: nextActions,
    attachment_policy: "manual_only",
    context_injection: "explicit_attachment_only",
    command_lane_enabled: false,
    output_mode: normalizeSituationSetupOutputMode(args.intent.output_mode),
    message,
  };
};
