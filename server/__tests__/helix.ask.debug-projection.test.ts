import { describe, expect, it } from "vitest";

import { __testHelixDebugProjection } from "../routes/agi.plan";

describe("Helix Ask debug projection", () => {
  it("projects MicroDeck runtime capability over stale docs planner fields", () => {
    const payload: Record<string, unknown> = {
      selected_capability: "docs-viewer.search_docs",
      agent_step_decision: {
        chosen_capability: "docs-viewer.search_docs",
        selected_tool: "docs-viewer.search_docs",
      },
      capability_plan: {
        selected_capability: "docs-viewer.search_docs",
        selected_capability_key: "docs-viewer.search_docs",
      },
      tool_call_admission_decision: {
        selected_capability: "docs-viewer.search_docs",
        admitted_tool: "docs-viewer.search_docs",
      },
      current_turn_artifact_ledger: [
        {
          kind: "runtime_tool_call",
          payload: {
            capability_key: "live_env.query_micro_reasoner_presets",
            args: { include_presets: true },
          },
        },
        {
          kind: "live_environment_tool_observation",
          payload: {
            tool_name: "live_env.query_micro_reasoner_presets",
            observation: {
              schema: "stage_play_micro_reasoner_prompt_preset_query_result/v1",
              preset_id: "visual_capture_default",
            },
          },
        },
      ],
      agent_runtime_loop: {
        iterations: [
          {
            chosen_capability: "docs-viewer.search_docs",
            executed_action_key: "live_env.query_micro_reasoner_presets",
            observation_role: "tool_observation",
            tool_observation: {
              tool_name: "live_env.query_micro_reasoner_presets",
              observation: {
                schema: "stage_play_micro_reasoner_prompt_preset_query_result/v1",
              },
            },
          },
        ],
      },
    };

    expect(__testHelixDebugProjection.readMailboxWakeSelectedCapabilityForDebug(payload)).toBe(
      "live_env.query_micro_reasoner_presets",
    );

    const transaction = __testHelixDebugProjection.buildStagePlayWakeTransactionDebug({
      activeTurnId: "ask:microdeck-projection",
      payload,
      routeMetadata: {
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:microdeck-projection",
      } as any,
      stagePlayMailboxDebug: {
        route: "live_source_mailbox",
        route_selected: "live_source_mailbox",
      },
    });

    expect(transaction).toMatchObject({
      schema: "stage_play_wake_transaction_debug/v1",
      selectedCapability: "live_env.query_micro_reasoner_presets",
    });
    expect(transaction?.selectedCapability).not.toBe("docs-viewer.search_docs");
  });

  it("uses terminal-authority-selected MicroDeck capability when runtime artifacts are absent", () => {
    const payload: Record<string, unknown> = {
      selected_capability: "docs-viewer.search_docs",
      capability_plan: {
        selected_capability: "docs-viewer.search_docs",
      },
      terminal_authority_single_writer: {
        selected_capability: "live_env.query_micro_reasoner_presets",
      },
    };

    expect(__testHelixDebugProjection.readMailboxWakeSelectedCapabilityForDebug(payload)).toBe(
      "live_env.query_micro_reasoner_presets",
    );
  });
});
