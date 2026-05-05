import type {
  HelixWorkstationActionLike,
  SituationRoomSetupCapturePreference,
  SituationRoomSetupMissingRequirement,
  SituationRoomSetupSpeakerMapping,
} from "@shared/helix-situation-setup";
import type { SituationCaptureSourceSnapshot } from "@shared/helix-situation-capture-context";
import {
  getHelixSituationGraphRecipe,
  matchHelixSituationGraphRecipeForPrompt,
} from "@shared/helix-situation-graph-recipes";
import {
  classifySituationRoomCapturePreference,
  readBlockedSituationSources,
  readSituationCaptureContext,
  readSituationRoomSetupRoomId,
  readSituationRoomSetupSourceIds,
  readSituationRoomSetupSpeakerMappings,
  readUsableSituationSources,
} from "./situation-room-setup-intent";

type WorkspaceSnapshotLike = {
  situationRoomContext?: Record<string, unknown> | null;
  situationCaptureContext?: Record<string, unknown> | null;
};

export type SituationGraphSetupIntentKind =
  | "two_way_interpreter"
  | "voice_chat_monitor"
  | "meeting_summary"
  | "prompt_composer_from_room"
  | "action_item_monitor"
  | "minecraft_situation_monitor"
  | "browser_video_translation"
  | "standby_voice_chat_monitor"
  | "standby_translation_mediator"
  | "minecraft_world_monitor"
  | "minecraft_goal_watch"
  | "screen_share_research_watch"
  | "custom_graph";

export type SituationGraphSetupPlan = {
  schema: "helix.situation_graph_setup_plan.v1";
  setup_call_id: string;
  recipe_id: string;
  intent_kind: SituationGraphSetupIntentKind;
  capture_preference: SituationRoomSetupCapturePreference;
  room_id?: string | null;
  source_ids: string[];
  bindings: Record<string, unknown>;
  missing_bindings: string[];
  missing_requirements: string[];
  next_actions: HelixWorkstationActionLike[];
  attachment_policy: "manual_only";
  context_injection: "explicit_attachment_only";
  command_lane_enabled: false;
};

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(
      values
        .map((value: string | null | undefined) => value?.trim())
        .filter((value: string | undefined): value is string => Boolean(value)),
    ),
  );

const readString = (value: unknown): string | null => {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
};

const hasBinding = (value: unknown): boolean => {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null;
};

const isNegativeControlPrompt = (prompt: string): boolean => {
  const normalized = prompt.toLowerCase();
  if (/\bopen\s+scientific\s+calculator\b/.test(normalized)) return true;
  if (/\btranslate\s+this\s+sentence\b/.test(normalized)) return true;
  if (/\b(?:create|run|start|make)\b.*\b(?:translation\s+job|job)\b/.test(normalized)) return true;
  return false;
};

export const classifySituationGraphSetupIntentKind = (prompt: string): SituationGraphSetupIntentKind | null => {
  const normalized = prompt.toLowerCase();
  if (isNegativeControlPrompt(prompt)) return null;
  if (/\b(?:prompt\s+composer|turn\s+(?:this\s+)?(?:call|conversation|voice\s+chat)\s+into\s+a\s+prompt|make\s+a\s+prompt)\b/.test(normalized)) {
    return "prompt_composer_from_room";
  }
  if (/\b(?:action\s+items?|to-?dos?)\b/.test(normalized)) return "action_item_monitor";
  if (/\bminecraft\b.*\b(?:goal|objective|track)\b/.test(normalized)) return "minecraft_goal_watch";
  if (/\b(?:stand\s*by|tell me when something important happens|watch)\b.*\bminecraft\b/.test(normalized)) return "minecraft_world_monitor";
  if (/\b(?:stand\s*by|watch)\b.*\b(?:translation|mediate|mediator)\b/.test(normalized)) return "standby_translation_mediator";
  if (/\b(?:stand\s*by|tell me when something important happens)\b.*\b(?:voice\s+chat|discord|call|conversation)\b/.test(normalized)) return "standby_voice_chat_monitor";
  if (/\b(?:screen\s*share|research\s+screen|monitor\s+this\s+screen)\b/.test(normalized)) return "screen_share_research_watch";
  if (/\bminecraft\b|\bdanger\b/.test(normalized)) return "minecraft_situation_monitor";
  if (/\b(?:meeting\s+summary|summari[sz]e\s+(?:this\s+)?(?:call|meeting|conversation)|summary)\b/.test(normalized)) return "meeting_summary";
  if (/\b(?:video|browser\s+video)\b.*\btranslat/.test(normalized)) return "browser_video_translation";
  if (/\b(?:live\s+interpreter|interpreter|interpret|two[-\s]?way|translate)\b/.test(normalized)) return "two_way_interpreter";
  if (/\b(?:monitor|watch|listen)\b/.test(normalized)) return "voice_chat_monitor";
  const matched = matchHelixSituationGraphRecipeForPrompt(prompt);
  return (matched?.recipe_id as SituationGraphSetupIntentKind | undefined) ?? null;
};

const recipeIdForIntent = (intentKind: SituationGraphSetupIntentKind): string => intentKind;

const createSetupCallId = (prompt: string): string => {
  const seed = prompt.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32) || "graph";
  return `situation-graph-setup:${Date.now().toString(36)}:${seed}`;
};

const buildSpeakerBindings = (speakerMappings: SituationRoomSetupSpeakerMapping[]): Record<string, unknown> => {
  const speakerA =
    speakerMappings.find((entry: SituationRoomSetupSpeakerMapping) => entry.role_hint === "self") ??
    speakerMappings[0];
  const speakerB =
    speakerMappings.find((entry: SituationRoomSetupSpeakerMapping) => entry.role_hint === "friend") ??
    speakerMappings.find((entry: SituationRoomSetupSpeakerMapping) => entry !== speakerA);
  return {
    ...(speakerA?.speaker_id ? { speaker_a_id: speakerA.speaker_id } : {}),
    ...(speakerB?.speaker_id ? { speaker_b_id: speakerB.speaker_id } : {}),
    ...(speakerA?.native_language ? { speaker_a_native_language: speakerA.native_language } : {}),
    ...(speakerB?.native_language ? { speaker_b_native_language: speakerB.native_language } : {}),
  };
};

const missingSourceRequirements = (args: {
  sourceIds: string[];
  usableSourceCount: number;
  blockedSourceCount: number;
  capturePreference: SituationRoomSetupCapturePreference;
}): SituationRoomSetupMissingRequirement[] => {
  const missing = new Set<SituationRoomSetupMissingRequirement>();
  if (args.usableSourceCount === 0 && args.sourceIds.length === 0) {
    missing.add("audio_source");
    if (["browser_tab_audio", "display_audio", "mic"].includes(args.capturePreference)) {
      missing.add("capture_permission");
    }
  }
  if (args.usableSourceCount === 0 && args.blockedSourceCount > 0) {
    missing.add("audio_source");
    missing.add("capture_permission");
  }
  return Array.from(missing);
};

export const buildSituationGraphSetupPlan = (args: {
  prompt: string;
  workspaceSnapshot?: WorkspaceSnapshotLike | null;
  setupCallId?: string | null;
}): SituationGraphSetupPlan | null => {
  const intentKind = classifySituationGraphSetupIntentKind(args.prompt);
  if (!intentKind) return null;
  const recipeId = recipeIdForIntent(intentKind);
  const recipe = getHelixSituationGraphRecipe(recipeId);
  if (!recipe) return null;

  const capturePreference = classifySituationRoomCapturePreference(args.prompt);
  const captureContext = readSituationCaptureContext(args.workspaceSnapshot);
  const usableSources = readUsableSituationSources(args.workspaceSnapshot);
  const blockedSources = readBlockedSituationSources(args.workspaceSnapshot);
  const fallbackSourceIds = readSituationRoomSetupSourceIds(args.workspaceSnapshot);
  const sourceIds =
    usableSources.length > 0
      ? usableSources.map((source: SituationCaptureSourceSnapshot) => source.source_id)
      : fallbackSourceIds;
  const roomId = captureContext?.room_id ?? readSituationRoomSetupRoomId(args.workspaceSnapshot);
  const speakerMappings = readSituationRoomSetupSpeakerMappings(args.workspaceSnapshot);
  const setupCallId = args.setupCallId ?? createSetupCallId(args.prompt);
  const bindings: Record<string, unknown> = {
    ...(roomId ? { room_id: roomId } : {}),
    ...(sourceIds.length > 0 ? { source_ids: sourceIds } : {}),
    ...buildSpeakerBindings(speakerMappings),
    output_mode: "visual_only",
  };
  if (
    intentKind === "voice_chat_monitor" ||
    intentKind === "minecraft_situation_monitor" ||
    intentKind === "standby_voice_chat_monitor" ||
    intentKind === "minecraft_world_monitor" ||
    intentKind === "minecraft_goal_watch" ||
    intentKind === "screen_share_research_watch"
  ) {
    bindings.monitor_mode = intentKind === "minecraft_situation_monitor" ? "danger" : "activity";
    bindings.interjection_policy =
      intentKind === "minecraft_situation_monitor" || intentKind === "minecraft_world_monitor" || intentKind === "minecraft_goal_watch"
        ? "high_salience"
        : "direct_address_only";
    bindings.standby_mode =
      intentKind === "minecraft_world_monitor" || intentKind === "minecraft_goal_watch"
        ? "game_master"
        : intentKind === "screen_share_research_watch"
          ? "research_assistant"
          : "high_salience";
  }
  if (intentKind === "standby_translation_mediator") {
    bindings.standby_mode = "translation_mediator";
    bindings.output_mode = "dual";
  }
  if (intentKind === "browser_video_translation") {
    bindings.target_language = readString((args.workspaceSnapshot?.situationRoomContext as Record<string, unknown> | undefined)?.target_language) ?? "en";
  }

  const missingRequirements = missingSourceRequirements({
    sourceIds,
    usableSourceCount: usableSources.length,
    blockedSourceCount: blockedSources.length,
    capturePreference,
  });
  const missingBindings = recipe.required_bindings.filter((bindingKey: string) => !hasBinding(bindings[bindingKey]));

  const nextActions: HelixWorkstationActionLike[] =
    missingRequirements.length > 0 || missingBindings.length > 0
      ? [
          {
            schema_version: "helix.workstation.action/v1",
            action: "open_panel",
            panel_id: missingRequirements.includes("capture_permission") ? "situation-room-sources" : "situation-room-pipelines",
          },
        ]
      : [
          {
            schema_version: "helix.workstation.action/v1",
            action: "run_panel_action",
            panel_id: "situation-room-pipelines",
            action_id: "create_graph_from_recipe",
            args: {
              recipe_id: recipeId,
              ...bindings,
              room_id: roomId,
              source_ids: sourceIds,
              bindings,
              title: recipe.title,
              correlation: { setup_call_id: setupCallId },
            },
          },
        ];

  return {
    schema: "helix.situation_graph_setup_plan.v1",
    setup_call_id: setupCallId,
    recipe_id: recipeId,
    intent_kind: intentKind,
    capture_preference: capturePreference,
    room_id: roomId,
    source_ids: unique(sourceIds),
    bindings,
    missing_bindings: missingBindings,
    missing_requirements: unique(missingRequirements),
    next_actions: nextActions,
    attachment_policy: "manual_only",
    context_injection: "explicit_attachment_only",
    command_lane_enabled: false,
  };
};
