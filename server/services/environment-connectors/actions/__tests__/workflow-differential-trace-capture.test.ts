import { describe, expect, it } from "vitest";
import type { EnvironmentActionDifferentialCaptureInput } from "../workflow-differential-trace-capture";
import { captureEnvironmentActionDifferentialTrace } from "../workflow-differential-trace-capture";
import { auditEnvironmentActionDifferentialTraces } from "../workflow-differential-audit";

const observationRef = "environment_action_observation:walk-proof";

const capture = (
  lane: "direct_codex" | "helix",
): EnvironmentActionDifferentialCaptureInput => ({
  scenario_id: "minecraft_player_workflow:walk",
  lane,
  action_kind: "walk",
  prompt: "Walk forward for 250 milliseconds and verify the final position.",
  starting_state: { z: 18.5, x: -0.5, dimension: "minecraft:overworld" },
  capability_contract: {
    capability_id: "com.casimirbot.minecraft.player.walk",
    capability_version: 1,
  },
  source_artifact_refs: [
    lane === "helix"
      ? "helix_ask_debug_export:walk-proof"
      : "direct_codex_public_trace:walk-proof",
  ],
  selected_capability_id: "com.casimirbot.minecraft.player.walk",
  normalized_arguments: { sprint: false, direction: "forward", duration_ms: 250 },
  admission_status: lane === "helix" ? "admitted" : "not_applicable",
  execution_outcome: "succeeded",
  normalized_progress: [
    { sequence: 0, event_type: "workflow.started", progress_fraction: 0 },
    { sequence: 1, event_type: "workflow.succeeded", progress_fraction: 1 },
  ],
  postcondition_status: "satisfied",
  observation_refs: [observationRef],
  observation_reentered: true,
  final_candidate_text: "The player moved forward and stopped at the verified position.",
  final_candidate_support_refs: [observationRef],
  route_product_text:
    lane === "helix"
      ? "The player moved forward and stopped at the verified position."
      : null,
  route_product_support_refs: lane === "helix" ? [observationRef] : [],
  terminal_outcome: "success",
  terminal_authority_status: lane === "helix" ? "passed" : "not_applicable",
  terminal_writer_text:
    lane === "helix"
      ? "The player moved forward and stopped at the verified position."
      : null,
  terminal_writer_support_refs: lane === "helix" ? [observationRef] : [],
  visible_text:
    lane === "helix"
      ? "The player moved forward and stopped at the verified position."
      : null,
  voice_projection_status: lane === "helix" ? "not_observed" : "not_applicable",
  voice_text: null,
  created_at: "2026-08-09T10:30:00.000Z",
  hidden_reasoning_included: false,
});

describe("environment action differential trace capture", () => {
  it("builds comparable public direct-Codex and Helix traces", () => {
    const reference = captureEnvironmentActionDifferentialTrace(
      capture("direct_codex"),
    );
    const helix = captureEnvironmentActionDifferentialTrace(capture("helix"));
    const audit = auditEnvironmentActionDifferentialTraces({
      reference,
      helix,
      comparedAt: "2026-08-09T10:31:00.000Z",
    });

    expect(audit).toMatchObject({
      ok: true,
      first_divergence_stage: null,
      observer_only: true,
      assistant_answer: false,
    });
    expect(reference.hidden_reasoning_included).toBe(false);
    expect(helix.raw_content_included).toBe(false);
    expect(reference.source_artifact_refs).toEqual([
      "direct_codex_public_trace:walk-proof",
    ]);
    expect(helix.public_capture_hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("canonicalizes structured fixture and argument key order", () => {
    const first = captureEnvironmentActionDifferentialTrace(capture("helix"));
    const reordered = capture("helix");
    reordered.starting_state = {
      dimension: "minecraft:overworld",
      x: -0.5,
      z: 18.5,
    };
    reordered.normalized_arguments = {
      duration_ms: 250,
      direction: "forward",
      sprint: false,
    };
    const second = captureEnvironmentActionDifferentialTrace(reordered);

    expect(second.starting_state_hash).toBe(first.starting_state_hash);
    expect(second.normalized_arguments_hash).toBe(
      first.normalized_arguments_hash,
    );
  });

  it("preserves a downstream public-text mismatch for the observer", () => {
    const helixCapture = capture("helix");
    helixCapture.route_product_text = "A deterministic adapter replaced the answer.";
    helixCapture.terminal_writer_text = helixCapture.route_product_text;
    helixCapture.visible_text = helixCapture.route_product_text;
    const audit = auditEnvironmentActionDifferentialTraces({
      reference: captureEnvironmentActionDifferentialTrace(
        capture("direct_codex"),
      ),
      helix: captureEnvironmentActionDifferentialTrace(helixCapture),
      comparedAt: "2026-08-09T10:31:00.000Z",
    });

    expect(audit.first_divergence_stage).toBe(
      "route_product_materialization",
    );
    expect(audit.mismatches.map((entry) => entry.code)).toContain(
      "final_candidate_route_product_text_mismatch",
    );
  });

  it("rejects captures that claim hidden reasoning was included", () => {
    const invalid = {
      ...capture("helix"),
      hidden_reasoning_included: true,
    };
    expect(() => captureEnvironmentActionDifferentialTrace(invalid as never))
      .toThrow();
  });
});
