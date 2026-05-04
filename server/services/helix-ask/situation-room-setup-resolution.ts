import {
  HELIX_SITUATION_SETUP_RESOLUTION_RECEIPT_SCHEMA,
  normalizeSituationSetupOutputMode,
  type HelixWorkstationActionLike,
  type SituationRoomSetupIntent,
  type SituationRoomSetupMissingRequirement,
  type SituationRoomSetupResolutionInput,
  type SituationRoomSetupResolutionReceipt,
  type SituationRoomSetupSpeakerMapping,
} from "@shared/helix-situation-setup";
import { appendHelixThreadEvent } from "../helix-thread/ledger";
import { buildSituationRoomSetupActionArgs } from "./situation-room-setup-intent";
import { getSituationRoomSetupPlan } from "./situation-room-setup-registry";

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const mergeSpeakerMappings = (
  existing: SituationRoomSetupSpeakerMapping[] | undefined,
  incoming: SituationRoomSetupSpeakerMapping[] | undefined,
): SituationRoomSetupSpeakerMapping[] => {
  const merged = new Map<string, SituationRoomSetupSpeakerMapping>();
  for (const entry of [...(existing ?? []), ...(incoming ?? [])]) {
    const key = entry.role_hint ?? entry.speaker_id ?? entry.display_name ?? `speaker:${merged.size}`;
    merged.set(key, { ...(merged.get(key) ?? {}), ...entry });
  }
  return Array.from(merged.values());
};

const recomputeMissing = (intent: SituationRoomSetupIntent): SituationRoomSetupMissingRequirement[] => {
  const missing = new Set<SituationRoomSetupMissingRequirement>();
  if (!intent.source_ids?.length) {
    missing.add("audio_source");
    if (
      intent.capture_preference === "browser_tab_audio" ||
      intent.capture_preference === "display_audio" ||
      intent.capture_preference === "mic"
    ) {
      missing.add("capture_permission");
    }
  }
  if (intent.kind === "translate_conversation") {
    const speakerA =
      intent.speaker_mappings?.find((entry: SituationRoomSetupSpeakerMapping) => entry.role_hint === "self") ??
      intent.speaker_mappings?.[0];
    const speakerB =
      intent.speaker_mappings?.find((entry: SituationRoomSetupSpeakerMapping) => entry.role_hint === "friend") ??
      intent.speaker_mappings?.find((entry: SituationRoomSetupSpeakerMapping) => entry !== speakerA);
    if (!speakerA?.speaker_id) missing.add("speaker_a");
    if (!speakerB?.speaker_id) missing.add("speaker_b");
    if (!speakerA?.native_language) missing.add("speaker_a_native_language");
    if (!speakerB?.native_language) missing.add("speaker_b_native_language");
  }
  return Array.from(missing);
};

export const resolveSituationRoomSetupRequest = (args: {
  input: SituationRoomSetupResolutionInput;
  threadId?: string | null;
  turnId?: string | null;
  sessionId?: string | null;
  traceId?: string | null;
}): SituationRoomSetupResolutionReceipt => {
  const remembered = getSituationRoomSetupPlan(args.input.setup_call_id);
  const baseIntent =
    remembered?.intent ??
    ({
      schema: "helix.situation_setup_intent.v1",
      kind: "translate_conversation",
      capture_preference: "unknown",
      output_mode: "visual_only",
      missing_requirements: [],
    } satisfies SituationRoomSetupIntent);
  const before = new Set(baseIntent.missing_requirements ?? []);
  const nextIntent: SituationRoomSetupIntent = {
    ...baseIntent,
    room_id: args.input.room_id ?? baseIntent.room_id,
    source_ids: unique([...(baseIntent.source_ids ?? []), ...(args.input.source_ids ?? [])]),
    speaker_mappings: mergeSpeakerMappings(
      baseIntent.speaker_mappings,
      args.input.speaker_mappings,
    ),
    output_mode: normalizeSituationSetupOutputMode(args.input.output_mode ?? baseIntent.output_mode),
  };
  nextIntent.missing_requirements = recomputeMissing(nextIntent);
  if (args.input.capture_permission_granted && nextIntent.source_ids?.length) {
      nextIntent.missing_requirements = nextIntent.missing_requirements.filter(
      (entry: SituationRoomSetupMissingRequirement) => entry !== "capture_permission" && entry !== "audio_source",
    );
  }
  const remaining = nextIntent.missing_requirements;
  const resolved = Array.from(before).filter((entry: SituationRoomSetupMissingRequirement) => !remaining.includes(entry));
  const correlation = remembered?.plan_receipt.correlation ?? {
    setup_call_id: args.input.setup_call_id,
    thread_id: args.threadId ?? null,
    turn_id: args.turnId ?? null,
    session_id: args.sessionId ?? null,
    trace_id: args.traceId ?? null,
    request_id: args.input.request_id ?? null,
  };
  const setupArgs = buildSituationRoomSetupActionArgs(nextIntent, correlation);
  const nextActions: HelixWorkstationActionLike[] =
    remaining.length === 0
      ? [
          {
            schema_version: "helix.workstation.action/v1",
            action: "run_panel_action",
            panel_id: "situation-room-pipelines",
            action_id: "setup_from_prompt",
            args: setupArgs as Record<string, unknown>,
          },
        ]
      : [
          {
            schema_version: "helix.workstation.action/v1",
            action: "open_panel",
            panel_id: remaining.includes("audio_source") || remaining.includes("capture_permission")
              ? "situation-room-sources"
              : "situation-room-pipelines",
          },
        ];
  const receipt: SituationRoomSetupResolutionReceipt = {
    schema: HELIX_SITUATION_SETUP_RESOLUTION_RECEIPT_SCHEMA,
    ok: remaining.length === 0,
    setup_call_id: args.input.setup_call_id,
    request_id: args.input.request_id ?? correlation.request_id ?? null,
    resolved_requirements: resolved,
    remaining_requirements: remaining,
    next_actions: nextActions,
    message:
      remaining.length === 0
        ? "Situation Room setup requirements are resolved. The workstation can execute setup_from_prompt."
        : `Situation Room setup still needs: ${remaining.join(", ")}.`,
  };

  if (args.input.request_id && args.threadId && args.turnId) {
    appendHelixThreadEvent({
      route: "/ask",
      event_type: "server_request_resolved",
      thread_id: args.threadId,
      turn_id: args.turnId,
      session_id: args.sessionId ?? null,
      trace_id: args.traceId ?? null,
      request_id: args.input.request_id,
      request_kind: "request_user_input",
      item_status: remaining.length === 0 ? "completed" : "in_progress",
      request_payload: receipt as unknown as Record<string, unknown>,
      meta: { kind: "situation_room_setup_resolution_receipt", setup_call_id: args.input.setup_call_id },
    });
  }
  if (args.threadId && args.turnId) {
    appendHelixThreadEvent({
      route: "/ask",
      event_type: "item_completed",
      thread_id: args.threadId,
      turn_id: args.turnId,
      session_id: args.sessionId ?? null,
      trace_id: args.traceId ?? null,
      item_id: `situation_setup_resolution:${args.input.setup_call_id}`,
      item_type: "toolObservation",
      item_status: receipt.ok ? "completed" : "in_progress",
      item_stream: "observation",
      observation_ref: receipt as unknown as Record<string, unknown>,
      meta: { kind: "situation_room_setup_resolution_receipt", setup_call_id: args.input.setup_call_id },
    });
  }
  return receipt;
};
