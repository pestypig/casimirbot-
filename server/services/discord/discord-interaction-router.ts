import type { Request, Response } from "express";
import type { HelixDiscordInteractionReceipt } from "@shared/helix-discord-interaction";
import {
  HELIX_DISCORD_INTERACTION_RECEIPT_SCHEMA,
} from "@shared/helix-discord-interaction";
import {
  attachMinecraftToDiscordSession,
  createDiscordLinkCode,
  createDiscordVoiceSession,
  getDiscordVoiceSession,
  listDiscordVoiceSessions,
} from "../situation-room/discord-session-store";
import { getCompanionPolicy, upsertCompanionPolicy } from "../situation-room/companion-policy-engine";
import { sendDiscordInteractionFollowup } from "./discord-followup-client";
import { runDiscordHelixAskTurn } from "./discord-helix-ask-bridge";
import { verifyDiscordInteractionRequest } from "./discord-interaction-signature";

const DISCORD_INTERACTION_PING = 1;
const DISCORD_INTERACTION_APPLICATION_COMMAND = 2;
const DISCORD_RESPONSE_PONG = 1;
const DISCORD_RESPONSE_CHANNEL_MESSAGE_WITH_SOURCE = 4;
const DISCORD_RESPONSE_DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5;
const OPTION_SUB_COMMAND = 1;
const OPTION_SUB_COMMAND_GROUP = 2;
const interactionReceipts: HelixDiscordInteractionReceipt[] = [];

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const clipDiscord = (value: string, max = 1900): string =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 3))}...`;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

function interactionUserId(body: Record<string, unknown>): string {
  const member = asRecord(body.member);
  const memberUser = asRecord(member?.user);
  const user = asRecord(body.user);
  return normalize(memberUser?.id) || normalize(user?.id);
}

function interactionDisplayName(body: Record<string, unknown>): string | null {
  const member = asRecord(body.member);
  const memberUser = asRecord(member?.user);
  const user = asRecord(body.user);
  return normalize(member?.nick) || normalize(memberUser?.global_name) || normalize(memberUser?.username) || normalize(user?.global_name) || normalize(user?.username) || null;
}

function readOptions(data: Record<string, unknown> | null): Array<Record<string, unknown>> {
  const options = data?.options;
  return Array.isArray(options) ? options.filter((entry): entry is Record<string, unknown> => Boolean(asRecord(entry))) : [];
}

function parseHelixCommand(body: Record<string, unknown>): {
  command: string;
  subcommand: string | null;
  subcommandGroup: string | null;
  values: Record<string, string>;
} {
  const data = asRecord(body.data);
  const command = normalize(data?.name);
  let subcommand: string | null = null;
  let subcommandGroup: string | null = null;
  let leafOptions = readOptions(data);
  const first = leafOptions[0];
  const firstType = Number(first?.type);
  if (first && firstType === OPTION_SUB_COMMAND_GROUP) {
    subcommandGroup = normalize(first.name) || null;
    const nested = readOptions(first);
    const nestedFirst = nested[0];
    if (nestedFirst && Number(nestedFirst.type) === OPTION_SUB_COMMAND) {
      subcommand = normalize(nestedFirst.name) || null;
      leafOptions = readOptions(nestedFirst);
    }
  } else if (first && firstType === OPTION_SUB_COMMAND) {
    subcommand = normalize(first.name) || null;
    leafOptions = readOptions(first);
  }
  const values: Record<string, string> = {};
  for (const option of leafOptions) {
    const name = normalize(option.name);
    if (!name) continue;
    const value = option.value;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      values[name] = String(value);
    }
  }
  return { command, subcommand, subcommandGroup, values };
}

function findSessionForInteraction(body: Record<string, unknown>) {
  const guildId = normalize(body.guild_id) || "dm";
  const channelId = normalize(body.channel_id) || "dm";
  const discordUserId = interactionUserId(body);
  const sessions = listDiscordVoiceSessions();
  return (
    sessions.find((session) => session.guild_id === guildId && session.voice_channel_id === channelId) ??
    sessions.find((session) => session.guild_id === guildId && session.text_channel_id === channelId) ??
    sessions.find((session) => discordUserId && session.commander_discord_user_id === discordUserId) ??
    null
  );
}

function ensureSessionForInteraction(body: Record<string, unknown>) {
  const existing = findSessionForInteraction(body);
  if (existing) return existing;
  const guildId = normalize(body.guild_id) || "dm";
  const channelId = normalize(body.channel_id) || "dm";
  const receipt = createDiscordVoiceSession({
    guild_id: guildId,
    voice_channel_id: channelId,
    text_channel_id: channelId,
    thread_id: `helix-ask:discord:${guildId}:${channelId}`,
    room_id: `discord:${guildId}:${channelId}`,
  });
  return receipt.session;
}

function response(content: string, ephemeral = false) {
  return {
    type: DISCORD_RESPONSE_CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: clipDiscord(content),
      ...(ephemeral ? { flags: 64 } : {}),
    },
  };
}

type DiscordInteractionRouteResult = {
  status: number;
  body: ReturnType<typeof response>;
  receipt?: HelixDiscordInteractionReceipt | null;
};

function buildReceipt(input: Partial<HelixDiscordInteractionReceipt>): HelixDiscordInteractionReceipt {
  return {
    schema: HELIX_DISCORD_INTERACTION_RECEIPT_SCHEMA,
    ok: input.ok ?? true,
    interaction_id: input.interaction_id ?? null,
    application_id: input.application_id ?? null,
    guild_id: input.guild_id ?? null,
    channel_id: input.channel_id ?? null,
    discord_user_id: input.discord_user_id ?? null,
    command: input.command ?? null,
    subcommand: input.subcommand ?? null,
    session_id: input.session_id ?? null,
    thread_id: input.thread_id ?? null,
    terminal_answer_source: input.terminal_answer_source ?? null,
    terminal_artifact_kind: input.terminal_artifact_kind ?? null,
    terminal_hash: input.terminal_hash ?? null,
    poison_audit_ok: input.poison_audit_ok ?? null,
    deferred: input.deferred ?? false,
    answer_created: input.answer_created ?? false,
    credential_collection_allowed: false,
    context_policy: "compact_context_pack_only",
    error: input.error ?? null,
    created_at: new Date().toISOString(),
  };
}

export function listDiscordInteractionReceipts(): HelixDiscordInteractionReceipt[] {
  return [...interactionReceipts];
}

export function resetDiscordInteractionReceipts(): void {
  interactionReceipts.splice(0, interactionReceipts.length);
}

function recordInteractionReceipt(receipt?: HelixDiscordInteractionReceipt | null): void {
  if (receipt) interactionReceipts.push(receipt);
}

async function routeQuickCommand(body: Record<string, unknown>): Promise<DiscordInteractionRouteResult> {
  const parsed = parseHelixCommand(body);
  const guildId = normalize(body.guild_id) || "dm";
  const channelId = normalize(body.channel_id) || "dm";
  const userId = interactionUserId(body);
  const displayName = interactionDisplayName(body);
  const interactionId = normalize(body.id);
  const applicationId = normalize(body.application_id);
  const subcommand = parsed.subcommandGroup === "visual" ? `visual ${parsed.subcommand ?? ""}`.trim() : parsed.subcommand;

  if (parsed.command !== "helix") {
    return { status: 400, body: response("Unknown Discord command.", true) };
  }

  if (subcommand === "start") {
    const receipt = createDiscordVoiceSession({
      guild_id: guildId,
      voice_channel_id: channelId,
      text_channel_id: channelId,
      thread_id: `helix-ask:discord:${guildId}:${channelId}`,
      room_id: `discord:${guildId}:${channelId}`,
    });
    const session = receipt.session;
    const interactionReceipt = buildReceipt({
      ok: receipt.ok,
      interaction_id: interactionId,
      application_id: applicationId,
      guild_id: guildId,
      channel_id: channelId,
      discord_user_id: userId,
      command: "start",
      subcommand,
      session_id: session?.session_id ?? null,
      thread_id: session?.thread_id ?? null,
      error: receipt.error ?? null,
    });
    return {
      status: receipt.ok ? 200 : 400,
      body: response(
        receipt.ok && session
          ? `Started Helix Discord session.\nThread: ${session.thread_id}`
          : `Could not start Helix Discord session: ${receipt.message}`,
        !receipt.ok,
      ),
      receipt: interactionReceipt,
    };
  }

  if (subcommand === "link") {
    const session = ensureSessionForInteraction(body);
    if (!session) return { status: 400, body: response("Could not create a Discord session for linking.", true) };
    const link = createDiscordLinkCode({
      session_id: session.session_id,
      discord_user_id: userId,
      display_name: displayName,
      public_base_url: process.env.CASIMIRBOT_PUBLIC_URL,
    });
    return {
      status: link.ok ? 200 : 400,
      body: response(
        link.ok && link.code
          ? `Sign in and link your Casimir profile:\n${link.code.link_url}`
          : `Could not create link code: ${link.message}`,
        !link.ok,
      ),
      receipt: buildReceipt({
        ok: link.ok,
        interaction_id: interactionId,
        application_id: applicationId,
        guild_id: guildId,
        channel_id: channelId,
        discord_user_id: userId,
        command: "link",
        subcommand,
        session_id: session.session_id,
        thread_id: session.thread_id ?? null,
        error: link.error ?? null,
      }),
    };
  }

  if (subcommand === "status") {
    const session = findSessionForInteraction(body);
    if (!session) return { status: 200, body: response("No Helix Discord session is active for this channel.", true) };
    const policy = session.thread_id ? getCompanionPolicy(session.thread_id) : null;
    return {
      status: 200,
      body: response(
        [
          `Helix Discord session: ${session.status}`,
          `Thread: ${session.thread_id ?? "unbound"}`,
          `Profile: ${session.linked_profile_id ?? "unlinked"}`,
          `Commander: ${session.commander_discord_user_id ?? "none"}`,
          `Companion: ${policy?.companion_mode ?? "unknown"}`,
          `Live environments: ${session.live_environment_ids.length}`,
        ].join("\n"),
      ),
      receipt: buildReceipt({
        interaction_id: interactionId,
        application_id: applicationId,
        guild_id: guildId,
        channel_id: channelId,
        discord_user_id: userId,
        command: "status",
        subcommand,
        session_id: session.session_id,
        thread_id: session.thread_id ?? null,
      }),
    };
  }

  if (subcommand === "attach-minecraft") {
    const session = findSessionForInteraction(body);
    if (!session) return { status: 200, body: response("Start and link a Helix Discord session before attaching Minecraft.", true) };
    const attached = attachMinecraftToDiscordSession({
      session_id: session.session_id,
      source_id: parsed.values.source,
      world_id: parsed.values.world,
    });
    return {
      status: attached.ok ? 200 : 400,
      body: response(
        attached.ok
          ? `Minecraft attached.\nSource: ${attached.resolution?.source_id ?? "unknown"}\nEnvironment: ${attached.environment_id ?? "none"}`
          : `Minecraft source not attached: ${attached.message}`,
        !attached.ok,
      ),
      receipt: buildReceipt({
        ok: attached.ok,
        interaction_id: interactionId,
        application_id: applicationId,
        guild_id: guildId,
        channel_id: channelId,
        discord_user_id: userId,
        command: "attach-minecraft",
        subcommand,
        session_id: session.session_id,
        thread_id: session.thread_id ?? null,
        error: attached.error ?? null,
      }),
    };
  }

  if (subcommand === "companion-mode") {
    const session = ensureSessionForInteraction(body);
    if (!session?.thread_id) return { status: 400, body: response("Could not resolve a Helix Discord session.", true) };
    const mode = parsed.values.mode || "direct_address_only";
    const policy = upsertCompanionPolicy({
      thread_id: session.thread_id,
      voice_input_active: true,
      voice_output_enabled: mode === "active_companion" || mode === "critical_voice",
      companion_mode: mode,
      commentary_mode: mode === "debug_trace" ? "debug_trace" : "off",
      direct_address_names: ["helix", "dottie"],
    });
    return {
      status: 200,
      body: response(`Companion mode set: ${policy.companion_mode}\nVoice output: ${String(policy.voice_output_enabled)}`),
      receipt: buildReceipt({
        interaction_id: interactionId,
        application_id: applicationId,
        guild_id: guildId,
        channel_id: channelId,
        discord_user_id: userId,
        command: "companion-mode",
        subcommand,
        session_id: session.session_id,
        thread_id: session.thread_id,
      }),
    };
  }

  if (subcommand?.startsWith("visual")) {
    return {
      status: 200,
      body: response(
        "Visual source control is permission-bound in Helix desktop. Use the Helix visual source panel to attach a screen/window source; Discord will not secretly capture screen share.",
        true,
      ),
      receipt: buildReceipt({
        interaction_id: interactionId,
        application_id: applicationId,
        guild_id: guildId,
        channel_id: channelId,
        discord_user_id: userId,
        command: "visual",
        subcommand,
      }),
    };
  }

  return { status: 400, body: response("Unsupported /helix subcommand.", true) };
}

async function handleAskCommand(body: Record<string, unknown>): Promise<void> {
  const parsed = parseHelixCommand(body);
  const session = ensureSessionForInteraction(body);
  const applicationId = normalize(body.application_id);
  const token = normalize(body.token);
  const prompt = parsed.values.prompt;
  if (!session?.thread_id || !applicationId || !token || !prompt) {
    if (applicationId && token) {
      await sendDiscordInteractionFollowup({
        applicationId,
        interactionToken: token,
        payload: { content: "Helix Ask could not start because the Discord session or prompt was missing.", flags: 64 },
      });
    }
    return;
  }
  const ask = await runDiscordHelixAskTurn({
    thread_id: session.thread_id,
    session_id: session.session_id,
    prompt,
    discord_session_id: session.session_id,
    discord_interaction_id: normalize(body.id),
    discord_user_id: interactionUserId(body),
  });
  const clean = ask.poison_audit_ok === true ? "clean" : ask.poison_audit_ok === false ? "blocked" : "unknown";
  recordInteractionReceipt(buildReceipt({
    ok: ask.ok && ask.poison_audit_ok !== false,
    interaction_id: normalize(body.id),
    application_id: applicationId,
    guild_id: normalize(body.guild_id) || "dm",
    channel_id: normalize(body.channel_id) || "dm",
    discord_user_id: interactionUserId(body),
    command: "ask",
    subcommand: "ask",
    session_id: session.session_id,
    thread_id: session.thread_id,
    terminal_answer_source: ask.final_answer_source ?? null,
    terminal_artifact_kind: ask.terminal_artifact_kind ?? null,
    terminal_hash: ask.terminal_hash ?? null,
    poison_audit_ok: ask.poison_audit_ok ?? null,
    deferred: true,
    answer_created: ask.ok,
    error: ask.error ?? null,
  }));
  const content = ask.ok && ask.poison_audit_ok !== false
    ? `Helix: ${ask.answer}\nsource: ${ask.final_answer_source ?? "unknown"}\npoison_audit: ${clean}`
    : `Helix could not return a clean terminal answer.\nreason: ${ask.error ?? "poison_or_terminal_guard"}\npoison_audit: ${clean}`;
  await sendDiscordInteractionFollowup({
    applicationId,
    interactionToken: token,
    payload: { content: clipDiscord(content) },
  });
}

export async function handleDiscordInteraction(req: Request, res: Response): Promise<void> {
  const signature = verifyDiscordInteractionRequest(req);
  if (!signature.ok) {
    res.status(401).json({ ok: false, error: signature.reason });
    return;
  }
  const body = asRecord(req.body);
  if (!body) {
    res.status(400).json({ ok: false, error: "invalid_json_body" });
    return;
  }
  const type = Number(body.type);
  if (type === DISCORD_INTERACTION_PING) {
    res.json({ type: DISCORD_RESPONSE_PONG });
    return;
  }
  if (type !== DISCORD_INTERACTION_APPLICATION_COMMAND) {
    res.status(400).json(response("Unsupported Discord interaction type.", true));
    return;
  }
  const parsed = parseHelixCommand(body);
  const subcommand = parsed.subcommandGroup === "visual" ? `visual ${parsed.subcommand ?? ""}`.trim() : parsed.subcommand;
  if (parsed.command === "helix" && subcommand === "ask") {
    const session = ensureSessionForInteraction(body);
    recordInteractionReceipt(buildReceipt({
      ok: Boolean(session),
      interaction_id: normalize(body.id),
      application_id: normalize(body.application_id),
      guild_id: normalize(body.guild_id) || "dm",
      channel_id: normalize(body.channel_id) || "dm",
      discord_user_id: interactionUserId(body),
      command: "ask",
      subcommand: "ask",
      session_id: session?.session_id ?? null,
      thread_id: session?.thread_id ?? null,
      deferred: true,
      answer_created: false,
      error: session ? null : "missing_session",
    }));
    res.json({ type: DISCORD_RESPONSE_DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE });
    void handleAskCommand(body).catch((error) => {
      console.error("[discord-interactions] /helix ask followup failed", error);
    });
    return;
  }
  const routed = await routeQuickCommand(body);
  recordInteractionReceipt(routed.receipt ?? null);
  res.status(routed.status).json(routed.body);
}
