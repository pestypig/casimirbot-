import { describe, expect, it } from "vitest";

import { sanitizeRepoEvidenceExcerptForPresentation } from "../services/helix-ask/repo-evidence-presentation-sanitizer";
import { evaluateRepoAnswerTextQualityGate } from "../services/helix-ask/repo-answer-text-quality-gate";

describe("repo evidence presentation sanitizer", () => {
  it("normalizes renderer-hostile excerpts for presentation while preserving raw identity", () => {
    const raw = "client/src/foo.ts\u200B\r\nconst 𝐒𝐢𝐭𝐮𝐚𝐭𝐢𝐨𝐧Room = true;\u0007";
    const result = sanitizeRepoEvidenceExcerptForPresentation({ raw, maxChars: 120 });

    expect(result.sanitized).toContain("SituationRoom");
    expect(result.sanitized).not.toMatch(/[\u200B-\u200D\uFEFF]/u);
    expect(result.sanitized).not.toMatch(/[\u{1D400}-\u{1D7FF}]/u);
    expect(result.changed).toBe(true);
    expect(result.rawHash).toHaveLength(16);
    expect(result.warnings).toEqual(expect.arrayContaining(["normalized_math_styled_alphanumerics", "removed_control_characters"]));
  });

  it("rejects deterministic repo evidence fallback text as terminal answer quality", () => {
    const gate = evaluateRepoAnswerTextQualityGate({
      turnId: "turn:repo-quality",
      answerRef: "answer:repo",
      answerText: [
        "I found current repo evidence for Situation Room.",
        "",
        "Key evidence:",
        "- client/src/components/workstation/SituationRoomPipelinesPanel.tsx: export function SituationRoomPipelinesPanel()",
      ].join("\n"),
      payload: {
        final_answer_draft: {
          authority: "deterministic_receipt_fallback",
        },
        current_turn_artifact_ledger: [
          {
            kind: "repo_code_evidence_observation",
            payload: {
              schema: "helix.repo_code_evidence_observation.v1",
              evidence_refs: ["client/src/components/workstation/SituationRoomPipelinesPanel.tsx:1"],
            },
          },
        ],
      },
    });

    expect(gate.ok).toBe(false);
    expect(gate.violations).toEqual(expect.arrayContaining(["missing_model_synthesis", "canned_fallback_text"]));
    expect(gate.terminal_allowed).toBe(false);
  });

  it("allows concise model-authored repo prose with support refs", () => {
    const gate = evaluateRepoAnswerTextQualityGate({
      turnId: "turn:repo-quality-ok",
      answerRef: "answer:repo",
      answerText:
        "The Situation Room is the workstation control surface for live sources, pipeline setup, observer workflows, and Ask-visible evidence handoffs. Sources: client/src/components/workstation/SituationRoomPipelinesPanel.tsx; shared/workstation-dynamic-tools.ts.",
      payload: {
        final_answer_draft: {
          authority: "llm_post_observation_composer",
        },
        repo_code_evidence_answer: {
          model_authored: true,
          synthesis_attempt_ref: "turn:repo-quality-ok:repo_evidence_synthesis_attempt",
          support_refs: [
            "client/src/components/workstation/SituationRoomPipelinesPanel.tsx:1",
            "shared/workstation-dynamic-tools.ts:1",
          ],
        },
      },
    });

    expect(gate.ok).toBe(true);
    expect(gate.violations).toEqual([]);
    expect(gate.terminal_allowed).toBe(true);
  });

  it("rejects model-authored missing-evidence refusals when repo evidence is present", () => {
    const gate = evaluateRepoAnswerTextQualityGate({
      turnId: "turn:repo-quality-refusal",
      answerRef: "answer:repo",
      answerText:
        "I could not answer that as a repo/code evidence turn because no current-turn repo evidence observations proved the requested code paths, symbols, or line-backed sources.",
      payload: {
        final_answer_draft: {
          authority: "llm_post_observation_composer",
        },
        repo_code_evidence_answer: {
          model_authored: true,
          synthesis_attempt_ref: "turn:repo-quality-refusal:repo_evidence_synthesis_attempt",
          support_refs: ["client/src/components/workstation/SituationRoomPipelinesPanel.tsx:1"],
        },
      },
    });

    expect(gate.ok).toBe(false);
    expect(gate.violations).toContain("unsupported_repo_claim");
  });
});
