import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (repoPath: string): string =>
  fs.readFileSync(path.resolve(process.cwd(), repoPath), "utf8");

describe("Helix Ask UI ownership boundaries", () => {
  it("keeps observer lifecycle event builders in the non-React observer event module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const observer = read("client/src/lib/helix/ask-observer-events.ts");

    expect(pill).toContain('from "@/lib/helix/ask-observer-events"');
    for (const symbol of [
      "buildObserverPlanDeltaEvent",
      "buildObserverPlanItemCompletedEvent",
      "buildObserverFinalizationEvent",
      "buildObserverHandoffEvent",
      "buildWorkstationProceduralStepEvent",
      "buildNeedsRetrievalPlanEvent",
    ]) {
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(observer).toContain(`export function ${symbol}`);
    }
    expect(observer).not.toMatch(/from ["']react["']/);
    expect(observer).not.toContain("@/store/");
    expect(observer).not.toContain("@/components/helix/HelixAskPill");
    expect(observer).not.toContain("setAskReplies");
    expect(observer).not.toContain("enqueueVoicePlaybackIntent");
    expect(observer).not.toContain("runAskTurn");
  });

  it("keeps pure active-turn stream helpers in the non-React active stream module", () => {
    const pill = read("client/src/components/helix/HelixAskPill.tsx");
    const activeStream = read("client/src/lib/helix/ask-active-turn-stream.ts");

    expect(pill).toContain('from "@/lib/helix/ask-active-turn-stream"');
    for (const symbol of [
      "createHelixAskConsoleStreamIngressDebug",
      "attachHelixAskClientTraceToLiveEvent",
      "buildAskLiveAgenticEventRows",
      "buildHelixActiveTurnStreamRows",
      "shouldAdmitHelixAskExternalLiveEventToActiveStream",
      "filterHelixAskActiveTurnStreamRows",
    ]) {
      expect(pill).not.toContain(`export function ${symbol}`);
      expect(activeStream).toContain(`export function ${symbol}`);
    }
    expect(pill).toContain("export function shouldRenderHelixAskActiveTurnStream");
    expect(activeStream).not.toMatch(/from ["']react["']/);
    expect(activeStream).not.toContain("@/store/");
    expect(activeStream).not.toContain("@/components/helix/HelixAskPill");
    expect(activeStream).not.toContain("setAskReplies");
    expect(activeStream).not.toContain("enqueueVoicePlaybackIntent");
    expect(activeStream).not.toContain("runAskTurn");
  });
});
