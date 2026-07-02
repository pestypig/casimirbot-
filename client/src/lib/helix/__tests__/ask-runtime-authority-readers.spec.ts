import { describe, expect, it } from "vitest";

import { extractAskLevelTheoryReflection } from "../ask-runtime-authority-readers";

describe("ask runtime authority readers", () => {
  it("extracts theory formula context from Codex gateway observations", () => {
    const reflection = extractAskLevelTheoryReflection({
      workstation_gateway_call_results: [
        {
          ok: true,
          capability_id: "theory-badge-graph.reflect_discussion_context",
          observation: {
            schema: "helix.theory_context_reflection_observation.v1",
            capability_key: "theory-badge-graph.reflect_discussion_context",
            prompt: "no i mean retry theory badge graph reflection for fusion",
            reflection_id: "reflection:fusion-ui",
            summary: "Theory Badge Graph reflection found a thermonuclear rate context.",
            exact_badge_ids: [],
            likely_badge_ids: ["physics.nuclear.reaction.thermonuclear_rate_context"],
            highlighted_badge_ids: ["physics.nuclear.reaction.thermonuclear_rate_context"],
            claim_boundary_notes: ["diagnostic/proxy only"],
            calculator_payloads: [
              {
                badge_id: "physics.nuclear.reaction.thermonuclear_rate_context",
                badge_title: "Thermonuclear Rate Context",
                payload_id: "thermonuclear-rate-context",
                expression: "rate_proxy_m3_s = n1_m3 * n2_m3 * sigma_m2 * v_m_s",
                target_variable: "rate_proxy_m3_s",
                claim_boundary_notes: ["diagnostic/proxy only"],
              },
            ],
          },
        },
      ],
    });

    expect(reflection).toMatchObject({
      reflectionId: "reflection:fusion-ui",
      input: {
        prompt: "no i mean retry theory badge graph reflection for fusion",
        source: "helix_ask",
      },
      evidenceForAsk: {
        calculatorPayloads: [
          expect.objectContaining({
            badgeId: "physics.nuclear.reaction.thermonuclear_rate_context",
            expression: "rate_proxy_m3_s = n1_m3 * n2_m3 * sigma_m2 * v_m_s",
            targetVariable: "rate_proxy_m3_s",
          }),
        ],
      },
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
    });
  });
});
