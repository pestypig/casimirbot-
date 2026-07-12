import { describe, expect, it } from "vitest";

import {
  evaluateCompoundPromptCoverageGate,
  type HelixCompoundPromptCoverageGateInput,
} from "../services/helix-ask/compound-prompt-coverage-gate";
import { evaluateCompoundPromptCoverageGateFromAnswerArtifacts } from "../services/helix-ask/model-only-compound-coverage";
import type { HelixCompoundPromptContract } from "../services/helix-ask/prompt-interpretation";

const contractWith = (ids: string[]): HelixCompoundPromptContract => ({
  schema: "helix.compound_prompt_contract.v1",
  root_prompt_id: "compound:test",
  raw_prompt_hash: "hash",
  raw_prompt_chars: 120,
  root_objective: "answer the compound prompt",
  requirements: ids.map((id, index) => ({
    id,
    text: `Requirement ${id} asks for distinct topic ${index + 1}`,
    kind: "question",
    required: true,
    depends_on: [],
    status: "pending",
  })),
  global_constraints: [],
  negative_constraints: [],
  evidence_requirements: [],
  output_contract: {
    must_include_coverage_ledger: true,
    allow_partial_answer: false,
  },
  assistant_answer: false,
  raw_content_included: false,
});

const gate = (input: Partial<HelixCompoundPromptCoverageGateInput>) =>
  evaluateCompoundPromptCoverageGate({
    contract: contractWith(["R1", "R2", "R3"]),
    finalAnswerText: "",
    terminalArtifactKind: "direct_answer_text",
    finalAnswerSource: "model_direct_answer",
    ...input,
  });

describe("compound prompt coverage gate", () => {
  it("does not construct a stale execution gate for a canonical capability-help goal", () => {
    const result = evaluateCompoundPromptCoverageGateFromAnswerArtifacts({
      turnId: "ask:test:capability-help-coverage",
      payload: {
        canonical_goal_frame: {
          required_terminal_kind: "capability_help_summary",
        },
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
      },
      artifactLedger: [],
      promptText: "Does the paper tool use Image Lens?",
      contract: contractWith(["RESEARCH_PAPER_TOOL", "IMAGE_LENS"]),
      routeScope: "source_targeted",
    });

    expect(result.gate).toMatchObject({
      applies: false,
      passed: true,
      decision: "NOT_APPLICABLE",
      reason: "capability_help_terminal",
    });
  });

  it("does not reinterpret capability-help nouns as compound execution requirements", () => {
    const result = evaluateCompoundPromptCoverageGate({
      contract: contractWith(["RESEARCH_PAPER_TOOL", "IMAGE_LENS"]),
      finalAnswerText: "The research workflow uses Image Lens only when visual extraction is needed.",
      terminalArtifactKind: "capability_help_summary",
      finalAnswerSource: "capability_help_summary",
    });

    expect(result).toMatchObject({
      applies: false,
      passed: true,
      decision: "NOT_APPLICABLE",
      reason: "capability_help_terminal",
    });
  });

  it("fails terminal authority when compound coverage misses a required item", () => {
    const result = gate({
      finalAnswerText: "[REQ:R1] Answer one.\n[REQ:R2] Answer two.",
    });

    expect(result.applies).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.decision).toBe("FAIL_CLOSED");
    expect(result.unresolved_requirement_ids).toContain("R3");
  });

  it("does not count blocked requirements unless the block reason is terminal-visible", () => {
    const result = gate({
      finalAnswerText: "[REQ:R1] Answer one.",
      proposedResolutions: [
        { requirement_id: "R2", status: "blocked_with_reason", reason: "missing evidence" },
        { requirement_id: "R3", status: "blocked_with_reason", reason: "missing evidence" },
      ],
    });

    expect(result.passed).toBe(false);
    expect(result.non_visible_blocked_requirement_ids).toEqual(expect.arrayContaining(["R2", "R3"]));
  });

  it("passes when every required item is answered or visibly blocked", () => {
    const result = evaluateCompoundPromptCoverageGate({
      contract: contractWith(["R1", "R2"]),
      finalAnswerText: [
        "[REQ:R1] Answer one.",
        "[REQ:R2_BLOCKED] I could not answer this because the required repo evidence is missing.",
      ].join("\n"),
      terminalArtifactKind: "direct_answer_text",
      finalAnswerSource: "model_direct_answer",
    });

    expect(result.passed).toBe(true);
    expect(result.blocked_count).toBe(1);
  });

  it("does not apply compound coverage gate to non-compound prompts", () => {
    const result = evaluateCompoundPromptCoverageGate({
      contract: contractWith(["R1"]),
      finalAnswerText: "Answer one.",
    });

    expect(result.applies).toBe(false);
    expect(result.decision).toBe("NOT_APPLICABLE");
  });

  it("treats typed failures as explicit failed-closed coverage", () => {
    const result = gate({
      finalAnswerText: "I could not complete this turn.",
      terminalArtifactKind: "typed_failure",
      finalAnswerSource: "typed_failure",
    });

    expect(result.passed).toBe(true);
    expect(result.failed_closed_count).toBe(3);
  });
});
