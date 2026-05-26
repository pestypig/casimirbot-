import { beforeEach, describe, expect, it } from "vitest";

import {
  applySituationRoomDottieManifestPreset,
  buildSituationRoomDottieManifestPreset,
} from "../services/situation-room/dottie-manifest-preset";
import {
  listDottieManifestRuns,
  resetDottieManifestRunsForTest,
} from "../services/situation-room/dottie-manifest-run-store";
import { clearInterpretedEventLogForTest } from "../services/situation-room/interpreted-event-log-store";
import {
  listLiveEnvironmentCommentary,
  resetLiveEnvironmentCommentaryForTest,
} from "../services/situation-room/live-environment-commentary-store";

const resetAll = () => {
  resetDottieManifestRunsForTest();
  resetLiveEnvironmentCommentaryForTest();
  clearInterpretedEventLogForTest();
};

describe("Dottie manifest run ledger", () => {
  beforeEach(resetAll);

  it("records applied manifest runs as evidence-only receipt ledgers", () => {
    const preset = buildSituationRoomDottieManifestPreset({
      threadId: "thread:dottie-run",
      roomId: "room:dottie-run",
      targetRunId: "run:ask:dottie-run",
      voiceMode: "propose_only",
    });

    const receipt = applySituationRoomDottieManifestPreset(preset);
    const runs = listDottieManifestRuns({
      threadId: "thread:dottie-run",
      roomId: "room:dottie-run",
      limit: 10,
    });
    const commentary = listLiveEnvironmentCommentary({
      threadId: "thread:dottie-run",
      roomId: "room:dottie-run",
      subject: "dottie_observer",
      limit: 10,
    });

    expect(receipt).toMatchObject({
      kind: "dottie_manifest_preset_receipt",
      assistant_answer: false,
      raw_content_included: false,
      command_lane_enabled: false,
    });
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      schema: "helix.dottie_manifest_run.v1",
      preset_id: "auntie_dottie",
      status: "applied_as_receipts",
      safety: {
        command_lane_enabled: false,
        assistant_answer: false,
        raw_content_included: false,
        instruction_authority: "none",
      },
    });
    expect(runs[0]?.receipt_refs).toEqual(expect.arrayContaining(receipt.child_artifact_refs));
    expect(runs[0]?.applied_steps.map((step) => step.step)).toEqual([
      "live_answer_environment",
      "commentary_policy",
      "observer_subscription",
      "voice_policy",
      "field_worker_policy",
    ]);
    expect(runs[0]?.applied_steps.every((step) =>
      step.status !== "created" || Boolean(step.artifact_ref)
    )).toBe(true);
    expect(runs[0]?.applied_steps.every((step) => step.status === "receipt_only")).toBe(true);
    expect(commentary.at(-1)).toMatchObject({
      schema: "helix.live_environment_commentary.v1",
      subject: "dottie_observer",
      kind: "tool_trace",
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      ask_context_policy: "evidence_only",
    });
    expect(runs[0]?.commentary_refs).toContain(commentary.at(-1)?.commentary_id);
  });
});
