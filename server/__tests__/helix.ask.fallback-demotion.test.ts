import { describe, expect, it } from "vitest";

import {
  buildFallbackDemotedObservation,
  classifyDeterministicFallbackUse,
} from "../services/helix-ask/deterministic-fallback-policy";
import { enforceModelAuthoredTerminalInvariant } from "../services/helix-ask/model-authored-terminal-invariant";
import { applyHelixTerminalAuthoritySingleWriter } from "../services/helix-ask/terminal-authority-single-writer";

const richPrompt =
  'Can you relate to the theory concept badge ? "Yea but what exactly is a field anyways? Both electrons and photons are considered zero-dimensional point particles without physical volume, radius, or a hard surface. Since we are all made of these invisible building blocks we actually do not exist in the physical sense! dimension are mathematical representations of reality and that notation is also not real fields emerge from electron movement and this is known as a probability in a sphere"';

describe("Helix Ask deterministic fallback demotion", () => {
  it("demotes generic electron fallback to observation on compound concept prompts", () => {
    const policy = classifyDeterministicFallbackUse({
      promptText: richPrompt,
      fallbackId: "model_only_fallback.generic_electron",
      fallbackText: "An electron is a fundamental subatomic particle.",
      payload: {},
    });

    expect(policy.terminal_allowed).toBe(false);
    expect(policy.demote_to_observation).toBe(true);
    expect(policy.reason_codes).toEqual(expect.arrayContaining(["rich_model_only_concept_signal"]));
    expect(buildFallbackDemotedObservation(policy)).toMatchObject({
      schema: "helix.fallback_demoted_observation.v1",
      terminal_allowed: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("allows simple electron definition fallback", () => {
    const policy = classifyDeterministicFallbackUse({
      promptText: "What is an electron?",
      fallbackId: "model_only_fallback.generic_electron",
      fallbackText: "An electron is a fundamental subatomic particle with a negative electric charge.",
      payload: {},
    });

    expect(policy.terminal_allowed).toBe(true);
    expect(policy.demote_to_observation).toBe(false);
  });

  it("blocks final drafts cloned from nonterminal fallback text", () => {
    const fallbackText = "An electron is a fundamental subatomic particle.";
    const result = enforceModelAuthoredTerminalInvariant({
      turnId: "turn-1",
      payload: {
        active_prompt: richPrompt,
        terminal_artifact_kind: "model_synthesized_answer",
        selected_final_answer: fallbackText,
        final_answer_draft: {
          schema: "helix.final_answer_draft.v1",
          text: fallbackText,
          authority: "deterministic_receipt_fallback",
        },
      },
      artifactLedger: [
        {
          artifact_id: "direct-1",
          kind: "direct_answer_text",
          payload: {
            fallback_id: "model_only_fallback.generic_electron",
            text: fallbackText,
          },
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.violations).toContain("final_draft_cloned_from_nonterminal_fallback");
    expect(result.repair_required).toBe(true);
  });

  it("does not select direct answer while solver continuation is pending", () => {
    const payload: Record<string, unknown> = {
      solver_continuation_observation: {
        schema: "helix.solver_continuation_observation.v1",
        required_next_step: "model_followup_reasoning",
      },
      solver_continuation_count: 1,
      selected_final_answer: "An electron is a fundamental subatomic particle.",
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId: "turn-2",
      payload,
      artifactLedger: [],
    });

    expect(result.selected_terminal_artifact_kind).not.toBe("direct_answer_text");
    expect(result.rejected_candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: "solver_continuation_pending",
        }),
      ]),
    );
  });
});
