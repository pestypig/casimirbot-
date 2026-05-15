import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import {
  completeDiscordProfileLink,
  createDiscordLinkCode,
  createDiscordVoiceSession,
  resetDiscordSessionStore,
} from "../services/situation-room/discord-session-store";
import {
  createProfileIngressToken,
  ingestProfileIngressEvent,
  resetProfileIngressStore,
} from "../services/helix-account/profile-ingress-store";
import { resetCompanionPolicies } from "../services/situation-room/companion-policy-engine";
import { clearContinuousCategorizationJobsForTest, listContinuousCategorizationJobs } from "../services/situation-room/continuous-categorization-job-store";
import { resetLiveAnswerEnvironments } from "../services/situation-room/live-answer-environment-store";
import { listVisualSnapshotSources, resetVisualSnapshotStoreForTest } from "../services/situation-room/visual-snapshot-store";
import { clearInterpretedEventLogForTest, listInterpretedEvents } from "../services/situation-room/interpreted-event-log-store";
import { getMinecraftCortanaCompanionStatus, startMinecraftCortanaCompanionSession } from "../services/situation-room/minecraft-cortana-session-orchestrator";

const createApp = async (): Promise<express.Express> => {
  const { planRouter } = await import("../routes/agi.plan");
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use("/api/agi", planRouter);
  return app;
};

function createLinkedMinecraftSession() {
  const started = createDiscordVoiceSession({
    guild_id: "guild-cortana",
    voice_channel_id: "voice-cortana",
    text_channel_id: "text-cortana",
    thread_id: "helix-ask:discord-cortana",
  });
  expect(started.ok).toBe(true);
  const link = createDiscordLinkCode({
    session_id: started.session!.session_id,
    discord_user_id: "discord-cortana-user",
  });
  expect(link.ok).toBe(true);
  const completed = completeDiscordProfileLink({
    code: link.code!.code,
    profile_id: "profile:cortana",
    discord_user_id: "discord-cortana-user",
  });
  expect(completed.ok).toBe(true);
  const token = createProfileIngressToken({
    profile_id: "profile:cortana",
    label: "Minehut bridge",
    scopes: ["source_event", "minecraft_bridge"],
  });
  expect(token.ok).toBe(true);
  const ingress = ingestProfileIngressEvent({
    profile_id: "profile:cortana",
    authorization: `Bearer ${token.token_value}`,
    source_id: "source:minehut:cortana",
    payload: {
      source_family: "minecraft_events",
      world_id: "minecraft:minehut",
      room_id: "room:minehut",
      event_type: "source_health",
    },
  });
  expect(ingress.ok).toBe(true);
  return started.session!;
}

describe("Minecraft Cortana companion session orchestrator", () => {
  beforeEach(() => {
    resetDiscordSessionStore();
    resetProfileIngressStore();
    resetCompanionPolicies();
    resetLiveAnswerEnvironments();
    resetVisualSnapshotStoreForTest();
    clearContinuousCategorizationJobsForTest();
    clearInterpretedEventLogForTest();
  });

  it("starts a linked Minecraft Cortana session with typed evidence lanes but no assistant answer", () => {
    const session = createLinkedMinecraftSession();
    const receipt = startMinecraftCortanaCompanionSession({
      discordSessionId: session.session_id,
    });

    expect(receipt).toMatchObject({
      ok: true,
      preset: "minecraft_cortana_companion",
      session_id: session.session_id,
      thread_id: "helix-ask:discord-cortana",
      profile_id: "profile:cortana",
      minecraft_source_id: "source:minehut:cortana",
      assistant_answer: false,
      raw_logs_included: false,
      raw_image_included: false,
      raw_transcript_included: false,
      context_policy: "compact_context_pack_only",
    });
    expect(receipt.environment_id).toBeTruthy();
    expect(receipt.visual_source_id).toContain("visual_source:minecraft_cortana");
    expect(receipt.categorization_job_ids.length).toBeGreaterThanOrEqual(3);
    expect(receipt.readiness).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "visual_source", ok: false, status: "needs_visual_permission" }),
      expect.objectContaining({ key: "minecraft_source", ok: true }),
      expect.objectContaining({ key: "live_answer_environment", ok: true }),
    ]));
    expect(listVisualSnapshotSources({ threadId: receipt.thread_id }).at(-1)).toMatchObject({
      source_id: receipt.visual_source_id,
      status: "permission_required",
      raw_image_included: false,
      assistant_answer: false,
    });

    const jobs = listContinuousCategorizationJobs({ threadId: receipt.thread_id, status: "active" });
    expect(jobs.map((job) => job.source_family)).toEqual(
      expect.arrayContaining(["minecraft_events", "discord_voice", "custom"]),
    );
    expect(jobs.every((job) => job.assistant_answer === false && job.raw_logs_included === false)).toBe(true);

    const interpreted = listInterpretedEvents({ threadId: receipt.thread_id });
    expect(interpreted.some((event) => event.title === "Minecraft Cortana mode" && event.assistant_answer === false)).toBe(true);

    const status = getMinecraftCortanaCompanionStatus({ threadId: receipt.thread_id });
    expect(status).toMatchObject({
      ok: true,
      preset: "minecraft_cortana_companion",
      minecraft_source_id: "source:minehut:cortana",
      next_required_action: "grant_visual_capture_permission",
      raw_logs_included: false,
      raw_image_included: false,
      raw_transcript_included: false,
      assistant_answer: false,
    });
  });

  it("exposes the start route and reports missing Minecraft source without fabricating one", async () => {
    const app = await createApp();
    const response = await request(app)
      .post("/api/agi/situation/companion-session/start")
      .send({
        preset: "minecraft_cortana_companion",
        thread_id: "helix-ask:desktop-cortana",
        profile_id: "profile:desktop",
      })
      .expect(409);

    expect(response.body).toMatchObject({
      ok: false,
      preset: "minecraft_cortana_companion",
      minecraft_source_id: null,
      assistant_answer: false,
      raw_logs_included: false,
      raw_image_included: false,
      raw_transcript_included: false,
    });
    expect(response.body.readiness).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "minecraft_source",
          ok: false,
          status: "needs_minecraft_source",
        }),
      ]),
    );
  }, 15000);

  it("returns runtime status through the status endpoint", async () => {
    const session = createLinkedMinecraftSession();
    const receipt = startMinecraftCortanaCompanionSession({
      discordSessionId: session.session_id,
    });
    const app = await createApp();

    const response = await request(app)
      .get(`/api/agi/situation/companion-session/status/${encodeURIComponent(session.session_id)}`)
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      preset: "minecraft_cortana_companion",
      session_id: session.session_id,
      thread_id: receipt.thread_id,
      minecraft_source_id: "source:minehut:cortana",
      next_required_action: "grant_visual_capture_permission",
      visual_source: {
        status: "permission_required",
        raw_image_included: false,
      },
      live_environment: {
        environment_id: receipt.environment_id,
        status: "active",
      },
      raw_logs_included: false,
      assistant_answer: false,
    });
    expect(response.body.categorization_jobs.length).toBeGreaterThanOrEqual(3);
  }, 15000);
});
