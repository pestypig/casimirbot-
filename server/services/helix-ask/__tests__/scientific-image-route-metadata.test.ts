import { describe, expect, it } from "vitest";
import { buildCommittedAskRoute } from "../committed-ask-route";
import { readHardToolBackendEntrypointRouteMetadata } from "../hard-tool-route-metadata";
import {
  buildAskTurnScientificImageComparisonRouteMetadata,
  isAskTurnScientificImageTextComparisonPrompt,
} from "../scientific-image-route-metadata";

describe("scientific Image Lens comparison route metadata", () => {
  const prompt =
    "Using the saved machine-readable page-8 text and the Image Lens crop, compare equation (47) row by row. Report the actual detected display-row count, symbol/subscript agreements, and mismatches.";

  it("commits a retained-sidecar route without forcing a fresh crop", () => {
    expect(isAskTurnScientificImageTextComparisonPrompt(prompt)).toBe(true);
    const built = buildAskTurnScientificImageComparisonRouteMetadata({
      turnId: "ask:scientific-comparison",
      threadId: "thread:scientific-comparison",
    });

    expect(readHardToolBackendEntrypointRouteMetadata(built.metadata)).toBeTruthy();
    expect(built.metadata).toMatchObject({
      source: "hard_tool_backend_entrypoint",
      sourceTarget: "scientific_image_evidence",
      source_target_intent: {
        target_source: "scientific_image_evidence",
        target_kind: "scientific_image_evidence_sidecar",
        reuse_retained_scientific_image_sidecar: true,
        requested_outputs: expect.arrayContaining([
          "scientific_evidence_sidecar",
          "machine_text_visual_comparison",
          "model_authored_synthesis",
        ]),
      },
    });
    expect(built.metadata).not.toHaveProperty("requiredToolFamily");
    expect(built.metadata).not.toHaveProperty("required_tool_family");
    expect(built.metadata).not.toHaveProperty("mandatory_next_tool");

    const committed = buildCommittedAskRoute({
      turnId: "ask:scientific-comparison",
      promptText: prompt,
      selectedRoute: "scientific_image_evidence",
      payload: {
        source_target_intent: built.sourceTargetIntent,
        canonical_goal_frame: {
          goal_kind: "scholarly_research_lookup",
          required_terminal_kind: "scholarly_research_answer",
        },
        route_product_contract: {
          source_target: "scientific_image_evidence",
          required_terminal_kind: "scholarly_research_answer",
          allowed_terminal_artifact_kinds: ["scholarly_research_answer", "typed_failure"],
        },
      },
    });
    expect(committed.route).toMatchObject({
      source_target: "scientific_image_evidence",
      target_kind: "scientific_image_evidence_sidecar",
      strength: "hard",
    });
    expect(committed.capability_policy.required_capability_families).not.toContain("visual_analysis");
    expect(committed.terminal_product.evidence_reentry_required).toBe(true);
  });

  it("reconstructs a terminal-capable comparison route without client goal metadata", () => {
    const committed = buildCommittedAskRoute({
      turnId: "ask:scientific-comparison-provider-reconstruction",
      promptText: prompt,
      selectedRoute: "/ask/turn",
      payload: {},
    });

    expect(committed.route).toMatchObject({
      source_target: "scientific_image_evidence",
      target_kind: "scientific_image_evidence_sidecar",
      strength: "hard",
    });
    expect(committed.canonical_goal).toMatchObject({
      goal_kind: "scholarly_research_lookup",
      required_terminal_kind: "scholarly_research_answer",
      allowed_terminal_artifact_kinds: expect.arrayContaining([
        "scholarly_research_answer",
        "agent_provider_terminal_candidate",
        "model_synthesized_answer",
        "typed_failure",
      ]),
    });
    expect(committed.terminal_product).toMatchObject({
      required_terminal_product: "scholarly_research_answer",
      evidence_reentry_required: true,
      followup_reasoning_required: true,
    });
  });
});
