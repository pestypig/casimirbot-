import { describe, expect, it } from "vitest";

import {
  buildHelixAskActiveTurnDisplayViewModel,
  HELIX_ASK_ACTIVE_TURN_QUIET_GAP_MS,
} from "@/components/helix/ask-console/HelixAskActiveTurnDisplayViewModel";
import type { HelixContinuousTurnStreamRow } from "@/lib/helix/ask-active-turn-stream";

const transcriptRow: HelixContinuousTurnStreamRow = {
  key: "row-1",
  source: "agent_work",
  label: "Model Re-entry",
  text: "Model re-entry completed.",
  meta: "source live_provider_transcript",
  status: "completed",
  tone: "checkpoint",
  evidenceRefs: [],
};

describe("HelixAskActiveTurnDisplayViewModel", () => {
  it("keeps quiet provider status outside numbered transcript rows", () => {
    const view = buildHelixAskActiveTurnDisplayViewModel({
      askBusy: true,
      rows: [transcriptRow],
      replyId: "ask:turn-1",
      lastTranscriptEventAppliedAtMs: 1000,
      nowMs: 1000 + HELIX_ASK_ACTIVE_TURN_QUIET_GAP_MS + 250,
    });

    expect(view.visibleRows).toEqual([transcriptRow]);
    expect(view.visibleRows).toHaveLength(1);
    expect(view.statusLine).toBe("Provider running; no new transcript event for 2s.");
    expect(view.quietGapVisible).toBe(true);
    expect(view.scrollToken).toContain("Provider running");
  });

  it("does not show quiet status before the threshold or after the turn is idle", () => {
    expect(buildHelixAskActiveTurnDisplayViewModel({
      askBusy: true,
      rows: [transcriptRow],
      replyId: "ask:turn-1",
      lastTranscriptEventAppliedAtMs: 1000,
      nowMs: 1500,
    }).statusLine).toBeNull();

    expect(buildHelixAskActiveTurnDisplayViewModel({
      askBusy: false,
      rows: [transcriptRow],
      replyId: "ask:turn-1",
      lastTranscriptEventAppliedAtMs: 1000,
      nowMs: 5000,
    }).statusLine).toBeNull();
  });
});
