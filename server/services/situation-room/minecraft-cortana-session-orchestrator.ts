import type { HelixMinecraftCortanaReadinessItem, HelixMinecraftCortanaSessionReceipt } from "@shared/helix-minecraft-cortana-session";
import { HELIX_MINECRAFT_CORTANA_SESSION_RECEIPT_SCHEMA } from "@shared/helix-minecraft-cortana-session";
import type { ContinuousCategorizationSourceFamily } from "@shared/helix-continuous-categorization-job";
import type { LiveAnswerLineDefinition } from "@shared/helix-live-answer-environment";
import { attachMinecraftToDiscordSession, getDiscordVoiceSession } from "./discord-session-store";
import { upsertCompanionPolicy } from "./companion-policy-engine";
import { startContinuousCategorizationJob } from "./continuous-categorization-job-store";
import { startVisualSnapshotSource } from "./visual-snapshot-store";
import { createLiveAnswerEnvironment, setLiveAnswerEnvironmentLineSchema } from "./live-answer-environment-store";
import { appendInterpretedEvent } from "./interpreted-event-log-store";

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const nowIso = (): string => new Date().toISOString();

const minecraftCortanaLineSchema: LiveAnswerLineDefinition[] = [
  { key: "place", label: "Place", update_policy: "episode_based", visibility: "answer_card" },
  { key: "activity", label: "Activity", update_policy: "episode_based", visibility: "answer_card" },
  { key: "structure", label: "Structure", update_policy: "episode_based", visibility: "answer_card" },
  { key: "entities", label: "Entities", update_policy: "episode_based", visibility: "answer_card" },
  { key: "goal", label: "Goal", update_policy: "episode_based", visibility: "answer_card" },
  { key: "risk", label: "Risk", update_policy: "salience_only", visibility: "answer_card", priority: "warn" },
  { key: "missing_evidence", label: "Missing evidence", update_policy: "projection_only", visibility: "answer_card" },
  { key: "next_check", label: "Next check", update_policy: "episode_based", visibility: "answer_card" },
  { key: "last_decision", label: "Last decision", update_policy: "salience_only", visibility: "answer_card" },
];

const readiness = (
  key: HelixMinecraftCortanaReadinessItem["key"],
  ok: boolean,
  summary: string,
  artifactRef?: string | null,
  blockedStatus: HelixMinecraftCortanaReadinessItem["status"] = "blocked",
): HelixMinecraftCortanaReadinessItem => ({
  key,
  ok,
  status: ok ? "ready" : blockedStatus,
  summary,
  artifact_ref: artifactRef ?? null,
});

function startCategorization(input: {
  threadId: string;
  roomId?: string | null;
  profileId?: string | null;
  sourceFamily: ContinuousCategorizationSourceFamily;
  sourceIds: string[];
  worldId?: string | null;
  objective: string;
  now: string;
}) {
  return startContinuousCategorizationJob({
    threadId: input.threadId,
    profileId: input.profileId,
    roomId: input.roomId,
    sourceFamily: input.sourceFamily,
    sourceIds: input.sourceIds,
    worldId: input.worldId,
    objective: input.objective,
    policy: {
      mode: "windowed",
      evidence_budget: "compact",
      surface_policy: "danger_progress",
      archive_on_stop: true,
      profile_archive_policy: "compact_summary_only",
    },
    now: input.now,
  });
}

export function startMinecraftCortanaCompanionSession(input: {
  discordSessionId?: string | null;
  threadId?: string | null;
  profileId?: string | null;
  minecraftSourceId?: string | null;
  worldId?: string | null;
  roomId?: string | null;
  visualCadenceMs?: number | null;
  directAddressNames?: string[] | null;
}): HelixMinecraftCortanaSessionReceipt {
  const now = nowIso();
  const sessionId = normalize(input.discordSessionId);
  const session = sessionId ? getDiscordVoiceSession(sessionId) : null;
  const threadId =
    normalize(input.threadId) ||
    normalize(session?.thread_id) ||
    (session ? `helix-ask:discord:${session.guild_id}:${session.voice_channel_id}` : "helix-ask:desktop");
  const profileId = normalize(input.profileId) || normalize(session?.linked_profile_id) || null;
  const roomId = normalize(input.roomId) || normalize(session?.room_id) || (session ? `discord:${session.guild_id}:${session.voice_channel_id}` : "room:minecraft-cortana");
  const voiceSourceId = session ? `discord:${session.session_id}:voice` : `discord:${threadId}:voice`;
  const visualSourceId = `visual_source:minecraft_cortana:${threadId.replace(/[^a-z0-9:_-]/gi, "_")}`;
  const directAddressNames = input.directAddressNames?.length ? input.directAddressNames : ["helix", "cortana", "dottie"];
  const readinessItems: HelixMinecraftCortanaReadinessItem[] = [];

  readinessItems.push(readiness(
    "discord_session",
    Boolean(session || !sessionId),
    session ? "Discord session resolved." : sessionId ? "Discord session was not found." : "No Discord session supplied; desktop-only Cortana setup requested.",
    session?.session_id ?? null,
    "blocked",
  ));

  if (sessionId && !session) {
    return {
      schema: HELIX_MINECRAFT_CORTANA_SESSION_RECEIPT_SCHEMA,
      ok: false,
      preset: "minecraft_cortana_companion",
      session_id: sessionId,
      thread_id: threadId,
      room_id: roomId,
      profile_id: profileId,
      environment_id: null,
      minecraft_source_id: null,
      visual_source_id: null,
      categorization_job_ids: [],
      readiness: readinessItems,
      message: "Minecraft Cortana mode could not start because the Discord session was not found.",
      error: "missing_discord_session",
      assistant_answer: false,
      raw_logs_included: false,
      raw_image_included: false,
      raw_transcript_included: false,
      context_policy: "compact_context_pack_only",
      created_at: now,
    };
  }

  readinessItems.push(readiness(
    "profile_link",
    Boolean(profileId || !session),
    profileId ? "Casimir profile link is active." : "Link the Discord session to a Casimir profile before attaching profile-owned Minecraft sources.",
    profileId,
    "needs_profile_link",
  ));

  let environmentId: string | null = null;
  let minecraftSourceId = normalize(input.minecraftSourceId);
  let worldId = normalize(input.worldId) || null;
  let minecraftOk = false;
  let minecraftMessage = "No Minecraft source was attached.";

  if (session) {
    const attached = attachMinecraftToDiscordSession({
      session_id: session.session_id,
      source_id: minecraftSourceId || null,
      world_id: worldId,
    });
    minecraftOk = attached.ok;
    minecraftSourceId = attached.resolution?.source_id ?? minecraftSourceId;
    worldId = attached.resolution?.world_id ?? worldId ?? "minecraft:minehut";
    environmentId = attached.environment_id ?? null;
    if (environmentId) {
      setLiveAnswerEnvironmentLineSchema({
        environment_id: environmentId,
        line_schema: minecraftCortanaLineSchema,
        now,
      });
    }
    minecraftMessage = attached.message;
  } else if (minecraftSourceId) {
    const created = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: `turn:minecraft-cortana:${threadId}`,
      objective: "Minecraft Cortana mode: keep a present-state card from Minecraft events, visual snapshots, and Discord voice evidence.",
      room_id: roomId,
      source_ids: [minecraftSourceId, voiceSourceId, visualSourceId],
      preset: "minecraft_cortana_companion",
      mode: "text_only",
      line_schema: minecraftCortanaLineSchema,
      now,
    });
    environmentId = created.environment.environment_id;
    minecraftOk = true;
    minecraftMessage = "Explicit Minecraft source attached to desktop Cortana setup.";
  }

  readinessItems.push(readiness(
    "minecraft_source",
    minecraftOk,
    minecraftMessage,
    minecraftSourceId || null,
    "needs_minecraft_source",
  ));

  if (!environmentId && minecraftOk) {
    const created = createLiveAnswerEnvironment({
      thread_id: threadId,
      created_turn_id: `turn:minecraft-cortana:${threadId}`,
      objective: "Minecraft Cortana mode: keep a present-state card from Minecraft events, visual snapshots, and Discord voice evidence.",
      room_id: roomId,
      source_ids: [minecraftSourceId, voiceSourceId, visualSourceId].filter(Boolean),
      preset: "minecraft_cortana_companion",
      mode: "text_only",
      line_schema: minecraftCortanaLineSchema,
      now,
    });
    environmentId = created.environment.environment_id;
  }

  readinessItems.push(readiness(
    "live_answer_environment",
    Boolean(environmentId),
    environmentId ? "Live answer environment is active for Minecraft Cortana mode." : "Live answer environment requires a Minecraft source.",
    environmentId,
    "needs_minecraft_source",
  ));

  const visualReceipt = startVisualSnapshotSource({
    source_id: visualSourceId,
    thread_id: threadId,
    room_id: roomId,
    session_id: session?.session_id ?? null,
    profile_id: profileId,
    source_family: "screen_capture",
    capture_mode: "interval",
    source_surface: "minecraft_client_window",
    cadence_ms: typeof input.visualCadenceMs === "number" ? input.visualCadenceMs : 15000,
    raw_image_storage_policy: "ephemeral",
  });
  readinessItems.push(readiness(
    "visual_source",
    visualReceipt.ok,
    "Visual source request is registered. The Helix web/desktop client still needs explicit screen/window permission before frames are available.",
    visualReceipt.source?.source_id ?? visualSourceId,
    "needs_visual_permission",
  ));

  const policy = upsertCompanionPolicy({
    thread_id: threadId,
    voice_input_active: true,
    voice_output_enabled: false,
    companion_mode: "direct_address_only",
    commentary_mode: "milestones_only",
    direct_address_names: directAddressNames,
  });
  readinessItems.push(readiness(
    "companion_policy",
    true,
    `Companion policy set to ${policy.companion_mode}; voice output remains approval/policy gated.`,
    threadId,
  ));
  readinessItems.push(readiness(
    "discord_voice",
    true,
    "Discord voice/transcript lane is available as source evidence; ambient speech will not create hidden Ask answers.",
    voiceSourceId,
  ));

  const categorizationJobIds: string[] = [];
  if (minecraftSourceId) {
    categorizationJobIds.push(startCategorization({
      threadId,
      roomId,
      profileId,
      sourceFamily: "minecraft_events",
      sourceIds: [minecraftSourceId],
      worldId,
      objective: "Categorize Minecraft events into compact present-state evidence for Minecraft Cortana mode.",
      now,
    }).job.job_id);
  }
  categorizationJobIds.push(startCategorization({
    threadId,
    roomId,
    profileId,
    sourceFamily: "discord_voice",
    sourceIds: [voiceSourceId],
    worldId,
    objective: "Categorize Discord voice/direct-address evidence for Minecraft Cortana mode without hidden answers.",
    now,
  }).job.job_id);
  categorizationJobIds.push(startCategorization({
    threadId,
    roomId,
    profileId,
    sourceFamily: "custom",
    sourceIds: [visualSourceId],
    worldId,
    objective: "Track compact visual snapshot evidence for Minecraft Cortana mode.",
    now,
  }).job.job_id);
  readinessItems.push(readiness(
    "categorization_jobs",
    categorizationJobIds.length > 0,
    `Started or reused ${categorizationJobIds.length} continuous categorization jobs.`,
    categorizationJobIds.at(0) ?? null,
  ));

  const interpreted = appendInterpretedEvent({
    thread_id: threadId,
    room_id: roomId,
    source_family: "minecraft_cortana_companion",
    kind: "agentic_review",
    title: "Minecraft Cortana mode",
    summary: minecraftOk
      ? "Minecraft Cortana mode is staged with Minecraft event, Discord voice, visual source, live card, and categorization evidence lanes."
      : "Minecraft Cortana mode is partially staged but still needs a linked Minecraft source.",
    evidence_refs: [
      environmentId ? `live_environment:${environmentId}` : null,
      minecraftSourceId ? `source:${minecraftSourceId}` : null,
      `source:${voiceSourceId}`,
      `source:${visualSourceId}`,
      ...categorizationJobIds.map((jobId) => `categorization_job:${jobId}`),
    ].filter((entry): entry is string => Boolean(entry)),
    related_artifact_ids: [environmentId, visualSourceId].filter((entry): entry is string => Boolean(entry)),
    related_job_ids: categorizationJobIds,
    model_invoked: false,
    deterministic: true,
    created_at: now,
  });

  const ok = Boolean(environmentId && minecraftOk);
  return {
    schema: HELIX_MINECRAFT_CORTANA_SESSION_RECEIPT_SCHEMA,
    ok,
    preset: "minecraft_cortana_companion",
    session_id: session?.session_id ?? null,
    thread_id: threadId,
    room_id: roomId,
    profile_id: profileId,
    environment_id: environmentId,
    minecraft_source_id: minecraftSourceId || null,
    visual_source_id: visualReceipt.source?.source_id ?? visualSourceId,
    categorization_job_ids: categorizationJobIds,
    readiness: readinessItems,
    message: ok
      ? "Minecraft Cortana mode is ready. Visual frames still require explicit local capture permission."
      : "Minecraft Cortana mode is partially staged. Link/attach a Minecraft source to finish setup.",
    error: ok ? null : "minecraft_source_required",
    assistant_answer: false,
    raw_logs_included: false,
    raw_image_included: false,
    raw_transcript_included: false,
    context_policy: "compact_context_pack_only",
    created_at: interpreted.created_at,
  };
}
