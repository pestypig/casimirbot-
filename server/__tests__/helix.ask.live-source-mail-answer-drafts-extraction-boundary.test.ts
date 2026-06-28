import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildStagePlayMailBatchInterpretationPayload,
  buildStagePlayMailBatchTextAnswerDraft,
  buildStagePlayMailVoiceCalloutCandidate,
  compactStagePlayMailSummarySentence,
  formatStagePlayMailUserRelevantMeaning,
  stagePlayWatchPolicyWantsTextForEveryMailBatch,
} from "../services/helix-ask/live-source/mail-answer-drafts";

const repoRoot = process.cwd();
const routeSource = readFileSync(join(repoRoot, "server/routes/agi.plan.ts"), "utf8");
const serviceSource = readFileSync(
  join(repoRoot, "server/services/helix-ask/live-source/mail-answer-drafts.ts"),
  "utf8",
);

describe("Helix Ask live-source mail answer draft extraction boundary", () => {
  it("keeps deterministic mail draft helpers out of the route", () => {
    expect(routeSource).toContain("../services/helix-ask/live-source/mail-answer-drafts");
    expect(routeSource).not.toMatch(/const\s+stagePlayWatchPolicyWantsTextForEveryMailBatch\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+compactStagePlayMailSummarySentence\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+buildStagePlayMailBatchTextAnswerDraft\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+collectStagePlayMailBatchSummaries\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+buildStagePlayMailVoiceCalloutCandidate\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+formatStagePlayMailUserRelevantMeaning\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+buildStagePlayMailBatchInterpretationPayload\s*=\s*\(/);
    expect(serviceSource).toMatch(/export\s+const\s+stagePlayWatchPolicyWantsTextForEveryMailBatch\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+compactStagePlayMailSummarySentence\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+buildStagePlayMailBatchTextAnswerDraft\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+collectStagePlayMailBatchSummaries\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+buildStagePlayMailVoiceCalloutCandidate\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+formatStagePlayMailUserRelevantMeaning\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+buildStagePlayMailBatchInterpretationPayload\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../../../routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
  });

  it("preserves watch policy text-for-every-batch detection", () => {
    expect(stagePlayWatchPolicyWantsTextForEveryMailBatch(null)).toBe(false);
    expect(stagePlayWatchPolicyWantsTextForEveryMailBatch({
      interpretationMode: "latest_scene_answer",
    })).toBe(true);
    expect(stagePlayWatchPolicyWantsTextForEveryMailBatch({
      interpretationMode: "checkpoint_only",
    })).toBe(false);
    expect(stagePlayWatchPolicyWantsTextForEveryMailBatch({
      objectiveText: "Record draft_text_answer for each new visual-summary mail batch.",
    })).toBe(true);
  });

  it("preserves compact summary and text answer drafting", () => {
    expect(compactStagePlayMailSummarySentence("")).toBe("the latest visual summary contains a compact observation");
    expect(compactStagePlayMailSummarySentence("**Player opens inventory.** More text.")).toBe("Player opens inventory.");
    expect(buildStagePlayMailBatchTextAnswerDraft([
      { summary: { preview: "First scene." } },
      { summary: { text: "Second scene!" } },
    ])).toBe("The latest visual-summary mail reports Second scene.");
  });

  it("preserves mail voice-callout salience candidates", () => {
    expect(buildStagePlayMailVoiceCalloutCandidate([
      { summary: { text: "The player is on fire near lava." } },
    ])).toEqual({
      shouldRequest: true,
      draft: "The player appears to be on fire or taking damage; watch for recovery or combat.",
      reasonCodes: [
        "minecraft_fire_or_damage_cue",
        "minecraft_visible_danger_cue",
      ],
      rationale: "The visual-summary mail contains fire/damage cues, so the commentary policy should request a short provisional voice callout.",
    });

    expect(buildStagePlayMailVoiceCalloutCandidate([
      { summary: { text: "The player is in the same base interior and walking routinely." } },
    ])).toEqual({
      shouldRequest: false,
      draft: null,
      reasonCodes: ["routine_or_stable_scene_suppressed"],
      rationale: "The visual-summary mail looks routine or stable, so voice should be suppressed.",
    });
  });

  it("preserves mail interpretation payload assembly", () => {
    expect(formatStagePlayMailUserRelevantMeaning("A player opens a chest.")).toBe(
      "The visual source shows a player opens a chest.",
    );
    expect(formatStagePlayMailUserRelevantMeaning("The screen shows an app grid.")).toBe(
      "The screen shows an app grid.",
    );

    expect(buildStagePlayMailBatchInterpretationPayload([
      {
        mailId: "mail-1",
        summary: { text: "A desktop app grid is visible." },
      },
      {
        mail_id: "mail-2",
        summary: { preview: "A browser window opens with content." },
      },
    ])).toMatchObject({
      currentSceneSummary: "A browser window opens with content.",
      runningStorySummary: "Latest visual mail interpretation: A browser window opens with content.",
      setting: "visual live source",
      activeWindowOrScene: "app or screen navigation scene",
      entities: [],
      activities: ["compact visual mail interpretation"],
      userRelevantMeaning: "The visual source shows a browser window opens with content.",
      watchNextReason: "Watch for a change in active window, opened app, visible scene, or new content replacing the current view.",
      predictionHorizon: "next_mail",
      predictionConfidence: 0.45,
      mailCoverage: {
        readMailIds: ["mail-1", "mail-2"],
        interpretedMailIds: ["mail-1", "mail-2"],
        compressedMailIds: ["mail-1", "mail-2"],
        skippedMailIds: [],
        mode: "chronological_batch",
        reason: "Multiple unread mail items interpreted as a time-ordered observation batch.",
      },
    });
  });
});
