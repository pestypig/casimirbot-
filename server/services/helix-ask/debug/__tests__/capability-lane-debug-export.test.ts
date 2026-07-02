import { describe, expect, it } from "vitest";
import { buildCapabilityLaneDebugExportFields } from "../capability-lane-debug-export";

describe("capability lane debug export fields", () => {
  it("projects lane lifecycle and runtime request fields from payload", () => {
    const fields = buildCapabilityLaneDebugExportFields({
      capability_lane_manifest: {
        schema: "helix.capability_lane_manifest.v1",
        lane_ids: ["live_translation"],
      },
      model_visible_capability_lane_manifest: {
        schema: "helix.agent_model_visible_capability_lane_manifest.v1",
        lanes: [
          {
            lane_id: "live_translation",
            status: "dry_run",
          },
        ],
      },
      capability_lane_call_results: [
        {
          capability: "live_translation.translate_text",
          ok: true,
        },
      ],
      capability_lane_backend_selections: [
        {
          selected_backend_provider: "live_translation.local_runtime",
        },
      ],
      runtime_lane_request_contract: {
        schema: "helix.codex_runtime_lane_request_contract.v1",
        execution_status: "lane_observation_reentered",
      },
      runtime_lane_request_loop: {
        schema: "helix.codex_runtime_lane_request_loop.v1",
        status: "lane_observation_reentered",
      },
    });

    expect(fields).toMatchObject({
      capability_lane_manifest: {
        schema: "helix.capability_lane_manifest.v1",
        lane_ids: ["live_translation"],
      },
      model_visible_capability_lane_manifest: {
        schema: "helix.agent_model_visible_capability_lane_manifest.v1",
        lanes: [
          {
            lane_id: "live_translation",
            status: "dry_run",
          },
        ],
      },
      capability_lane_call_results: [
        {
          capability: "live_translation.translate_text",
          ok: true,
        },
      ],
      capability_lane_backend_selections: [
        {
          selected_backend_provider: "live_translation.local_runtime",
        },
      ],
      runtime_lane_request_contract: {
        execution_status: "lane_observation_reentered",
      },
      runtime_lane_request_loop: {
        status: "lane_observation_reentered",
      },
    });
  });

  it("falls back to nested debug fields when payload-level fields are absent", () => {
    const fields = buildCapabilityLaneDebugExportFields({
      debug: {
        model_visible_capability_lane_manifest: {
          schema: "helix.agent_model_visible_capability_lane_manifest.v1",
          lanes: [
            {
              lane_id: "utility_text",
              status: "available",
            },
          ],
        },
        capability_lane_observation_packets: [
          {
            capability_key: "live_translation.translate_text",
          },
        ],
        capability_lane_reentry_status: "observation_packet_required_for_provider_reentry",
        runtime_lane_request_retry: {
          status: "runtime_provider_emitted_lane_request",
        },
      },
    });

    expect(fields).toMatchObject({
      model_visible_capability_lane_manifest: {
        schema: "helix.agent_model_visible_capability_lane_manifest.v1",
        lanes: [
          {
            lane_id: "utility_text",
            status: "available",
          },
        ],
      },
      capability_lane_observation_packets: [
        {
          capability_key: "live_translation.translate_text",
        },
      ],
      capability_lane_reentry_status: "observation_packet_required_for_provider_reentry",
      runtime_lane_request_retry: {
        status: "runtime_provider_emitted_lane_request",
      },
    });
  });
});
