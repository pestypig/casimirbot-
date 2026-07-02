import { describe, expect, it } from "vitest";
import { buildHelixDebugExportEnvelopeFromMasterPayload } from "@/lib/agi/debugExport";

describe("Helix Ask debug export capability lanes", () => {
  it("preserves capability lane session, mail-loop, and goal-binding evidence in the client export", () => {
    const text = buildHelixDebugExportEnvelopeFromMasterPayload(
      {
        id: "turn-debug-lanes",
        question: "keep translating the document",
        content: "Translation lane is active.",
      },
      {
        selected_final_answer: "Translation lane is active.",
        agent_runtime: "codex",
        selected_agent_provider: {
          id: "codex",
          label: "Codex Workstation Mode",
        },
        capability_lane_ids: ["live_translation"],
        capability_lane_statuses: {
          live_translation: "available",
        },
        capability_lane_call_results: [
          {
            capability: "live_translation.translate_text",
            ok: true,
          },
        ],
        capability_lane_projection_receipts: [
          {
            receipt_ref: "receipt:projection",
            observation_ref: "obs:translation",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
        capability_lane_session_debug_summaries: [
          {
            lane_session_id: "lane-session-docs",
            lane_id: "live_translation",
            session_status: "running",
            session_health: "healthy",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
        capability_lane_mail_loop_debug_summaries: [
          {
            lane_session_id: "lane-session-docs",
            stage_play_mail_id: "stage-play-mail-docs",
            stage_play_wake_expected: true,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
        capability_lane_goal_binding_results: [
          {
            ok: true,
            goal_binding: {
              goal_binding_id: "goal-binding-docs",
              goal_id: "goal:account-language",
              lane_session_id: "lane-session-docs",
              lane_id: "live_translation",
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
            blocked_reason: null,
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
        capability_lane_goal_binding_debug_summaries: [
          {
            goal_binding_id: "goal-binding-docs",
            goal_id: "goal:account-language",
            lane_session_id: "lane-session-docs",
            lane_id: "live_translation",
            binding_status: "bound",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
        capability_lane_goal_dispatch_readiness: {
          next_lane_ids: ["live_translation"],
          next_lane_session_ids: ["lane-session-docs"],
          next_goal_binding_ids: ["goal-binding-docs"],
          terminal_eligible: false,
          assistant_answer: false,
          raw_content_included: false,
        },
        capability_lane_reentry_status: "observation_packet_required_for_provider_reentry",
        runtime_lane_request_loop: {
          status: "lane_observation_reentered",
        },
        debug: {
          turn_id: "turn-debug-lanes",
        },
      },
    );

    const exportPayload = JSON.parse(text) as Record<string, unknown>;
    expect(exportPayload.agent_runtime).toBe("codex");
    expect(exportPayload.selected_agent_provider).toMatchObject({
      id: "codex",
    });
    expect(exportPayload.capability_lane_ids).toEqual(["live_translation"]);
    expect(exportPayload.capability_lane_call_results).toEqual([
      expect.objectContaining({
        capability: "live_translation.translate_text",
        ok: true,
      }),
    ]);
    expect(exportPayload.capability_lane_projection_receipts).toEqual([
      expect.objectContaining({
        receipt_ref: "receipt:projection",
        terminal_eligible: false,
        assistant_answer: false,
      }),
    ]);
    expect(exportPayload.capability_lane_session_debug_summaries).toEqual([
      expect.objectContaining({
        lane_session_id: "lane-session-docs",
        session_status: "running",
        terminal_eligible: false,
        assistant_answer: false,
      }),
    ]);
    expect(exportPayload.capability_lane_mail_loop_debug_summaries).toEqual([
      expect.objectContaining({
        stage_play_mail_id: "stage-play-mail-docs",
        stage_play_wake_expected: true,
        terminal_eligible: false,
        assistant_answer: false,
      }),
    ]);
    expect(exportPayload.capability_lane_goal_binding_results).toEqual([
      expect.objectContaining({
        ok: true,
        goal_binding: expect.objectContaining({
          goal_binding_id: "goal-binding-docs",
          lane_session_id: "lane-session-docs",
          lane_id: "live_translation",
        }),
        terminal_eligible: false,
        assistant_answer: false,
      }),
    ]);
    expect(exportPayload.capability_lane_goal_binding_debug_summaries).toEqual([
      expect.objectContaining({
        goal_binding_id: "goal-binding-docs",
        binding_status: "bound",
        terminal_eligible: false,
        assistant_answer: false,
      }),
    ]);
    expect(exportPayload.capability_lane_goal_dispatch_readiness).toMatchObject({
      next_lane_session_ids: ["lane-session-docs"],
      next_goal_binding_ids: ["goal-binding-docs"],
    });
    expect(exportPayload.runtime_lane_request_loop).toMatchObject({
      status: "lane_observation_reentered",
    });
  });

  it("derives mail-loop evidence from goal-binding summaries when explicit mail-loop summaries are absent", () => {
    const text = buildHelixDebugExportEnvelopeFromMasterPayload(
      {
        id: "turn-debug-derived-mail",
        question: "keep translating the document",
        content: "Translation lane is active.",
      },
      {
        selected_final_answer: "Translation lane is active.",
        agent_runtime: "codex",
        capability_lane_goal_binding_debug_summaries: [
          {
            goal_binding_id: "goal-binding-docs",
            goal_id: "goal:account-language",
            lane_session_id: "lane-session-docs",
            lane_id: "live_translation",
            binding_status: "bound",
            latest_mail_loop_summary: {
              schema: "helix.capability_lane.mail_loop_debug_summary.v1",
              lane_session_id: "lane-session-docs",
              lane_id: "live_translation",
              capability: "live_translation.translate_text",
              stage_play_mail_id: "stage-play-mail-derived",
              stage_play_wake_expected: true,
              observation_ref: "ask:lane:translation:derived-obs",
              terminal_eligible: false,
              assistant_answer: false,
              raw_content_included: false,
            },
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
        ],
        debug: {
          turn_id: "turn-debug-derived-mail",
        },
      },
    );

    const exportPayload = JSON.parse(text) as Record<string, unknown>;
    expect(exportPayload.capability_lane_mail_loop_debug_summaries).toEqual([
      expect.objectContaining({
        schema: "helix.capability_lane.mail_loop_debug_summary.v1",
        lane_session_id: "lane-session-docs",
        stage_play_mail_id: "stage-play-mail-derived",
        observation_ref: "ask:lane:translation:derived-obs",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      }),
    ]);
  });
});
