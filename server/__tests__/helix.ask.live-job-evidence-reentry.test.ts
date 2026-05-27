import { beforeEach, describe, expect, it } from "vitest";
import { planSituationRoomLiveJobSetup } from "../services/helix-ask/situation-room-live-job-setup-planner";
import { executeLiveEnvironmentTool } from "../services/helix-ask/live-environment-tool-adapter";
import { reduceAndRecordLiveJobSourceObservation } from "../services/live-job/live-job-runtime";
import { resetLiveJobPolicyObservationStoreForTest } from "../services/live-job/live-job-policy-observation-store";
import { resetLiveSourceObservationStoreForTest } from "../services/live-source/live-source-observation-store";
import { normalizeMinecraftSourceEvent } from "../services/live-source/normalize-minecraft-source-event";
import { resetLiveEnvironmentCommentaryForTest } from "../services/situation-room/live-environment-commentary-store";
import { resetVoiceProposalStoreForTest } from "../services/voice/voice-proposal-store";

describe("Helix Ask live job evidence re-entry", () => {
  beforeEach(() => {
    resetLiveSourceObservationStoreForTest();
    resetLiveJobPolicyObservationStoreForTest();
    resetLiveEnvironmentCommentaryForTest();
    resetVoiceProposalStoreForTest();
  });

  it("returns live job evidence as a non-terminal live_env observation", () => {
    const contract = planSituationRoomLiveJobSetup({
      prompt: "Go into Auntie Dottie mode while I play Minecraft. Only interrupt for confirmed route drift.",
      turnId: "turn:live-job-query",
      sourceIds: ["minecraft:local"],
      now: "2026-05-27T10:00:00.000Z",
    }).live_job_contract;
    reduceAndRecordLiveJobSourceObservation({
      contract,
      sourceObservation: normalizeMinecraftSourceEvent({
        thread_id: "thread:live-job-query",
        source_id: "minecraft:local",
        observed_at: "2026-05-27T10:00:10.000Z",
        now: new Date("2026-05-27T10:00:11.000Z"),
        route_state: { status: "on_route" },
      }),
      thread_id: "thread:live-job-query",
    });

    const toolObservation = executeLiveEnvironmentTool({
      tool_name: "live_env.query_job_evidence",
      thread_id: "thread:live-job-query",
      args: {
        query: "Why is Dottie quiet?",
        contract_id: contract.contract_id,
      },
    });

    expect(toolObservation.schema).toBe("helix.live_environment_tool_observation.v1");
    expect(toolObservation.tool_name).toBe("live_env.query_job_evidence");
    expect(toolObservation.observation).toMatchObject({
      schema: "helix.live_answers_query_observation.v1",
      current_state: {
        job_status: "quiet",
        last_suppression_reason: "route_clean",
        spoken: false,
      },
      assistant_answer: false,
      terminal_eligible: false,
    });
    expect(toolObservation.assistant_answer).toBe(false);
    expect(toolObservation.raw_content_included).toBe(false);
  });
});
