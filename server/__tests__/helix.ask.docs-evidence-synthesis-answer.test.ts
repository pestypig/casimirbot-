import { describe, expect, it } from "vitest";

import { arbitrateAskSourceTarget } from "../services/helix-ask/ask-source-target-arbitrator";
import { buildCommittedAskRoute, committedRouteAllowsTerminalKind } from "../services/helix-ask/committed-ask-route";
import {
  buildDocEvidenceSynthesisPlan,
  evaluateDocEvidenceSynthesisCoverage,
  materializeDocEvidenceSynthesisAnswer,
} from "../services/helix-ask/doc-evidence-synthesis";
import { isExplicitDocsPathLocateSynthesisPrompt } from "../services/helix-ask/docs-viewer-intent";
import { materializeFinalAnswerDraftTerminal } from "../services/helix-ask/final-answer-draft-terminal-materializer";
import { applyHelixTerminalAuthoritySingleWriter } from "../services/helix-ask/terminal-authority-single-writer";
import { interpretHelixAskPrompt } from "../services/helix-ask/prompt-interpretation";

const turnId = "ask:test-doc-evidence-synthesis";
const threadId = "thread:test-doc-evidence-synthesis";

const synthesisPayload = (prompt: string) => ({
  turn_id: turnId,
  active_prompt: prompt,
  source_target_intent: {
    schema: "helix.ask_source_target_intent.v1",
    turn_id: turnId,
    thread_id: threadId,
    target_source: "docs_viewer",
    target_kind: "docs_viewer",
    strength: "hard",
    reasons: ["explicit_docs_path_compare_source_target"],
    allow_no_tool_direct: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  canonical_goal_frame: {
    turn_id: turnId,
    goal_kind: "doc_evidence_synthesis",
    answer_scope: "current_turn_doc",
    required_terminal_kind: "doc_evidence_synthesis_answer",
  },
  route_product_contract: {
    schema: "helix.route_product_contract.v1",
    turn_id: turnId,
    thread_id: threadId,
    source_target: "docs_viewer",
    allowed_terminal_artifact_kinds: ["doc_evidence_synthesis_answer", "typed_failure", "request_user_input"],
    forbidden_terminal_artifact_kinds: ["direct_answer_text", "model_only_concept", "doc_summary"],
    required_artifact_refs: [],
    precedence_reason: "explicit_docs_path_compare_source_target",
    assistant_answer: false,
    raw_content_included: false,
  },
});

const docsEvidenceArtifacts = [
  {
    artifact_id: "doc-summary:flow",
    turn_id: turnId,
    kind: "doc_summary",
    payload: {
      schema: "helix.doc_summary.v1",
      path: "/docs/helix-ask-flow.md",
      source_title: "Helix Ask Flow",
      anchors: ["Core flow"],
      answer_text: "Core flow explains prompt to route to tool observation to terminal authority.",
      assistant_answer: false,
      raw_content_included: false,
    },
  },
  {
    artifact_id: "doc-summary:discipline",
    turn_id: turnId,
    kind: "doc_summary",
    payload: {
      schema: "helix.doc_summary.v1",
      path: "/docs/helix-ask-codex-loop-discipline.md",
      source_title: "Helix Ask / Codex Loop Discipline",
      anchors: ["Patch-Time Contract", "Model Commentary Owns Step Choice"],
      answer_text: "The discipline doc separates Codex runtime ownership from Helix evidence policy.",
      assistant_answer: false,
      raw_content_included: false,
    },
  },
];

describe("Helix Ask docs evidence synthesis answer", () => {
  it("materializes multi-doc compare drafts into doc_evidence_synthesis_answer", () => {
    const prompt =
      "Compare docs/helix-ask-flow.md and docs/helix-ask-codex-loop-discipline.md in a two-column table of the main routing rules.";
    const payload: Record<string, unknown> = synthesisPayload(prompt);
    payload.committed_ask_route = buildCommittedAskRoute({
      turnId,
      promptText: prompt,
      selectedRoute: "docs_viewer.local_docs_path_compare",
      payload,
      promptInterpretation: interpretHelixAskPrompt(prompt),
    });
    const finalDraft = {
      artifact_id: "draft:compare",
      turn_id: turnId,
      kind: "final_answer_draft",
      payload: {
        schema: "helix.final_answer_draft.v1",
        artifact_id: "draft:compare",
        text: "Flow owns the operational Ask route sequence; discipline owns the Codex/Helix boundary. Both require observations before terminal authority.",
        artifact_refs: ["doc-summary:flow", "doc-summary:discipline"],
        assistant_answer: false,
        raw_content_included: false,
      },
    };

    const materialized = materializeFinalAnswerDraftTerminal({
      turnId,
      payload,
      artifactLedger: [...docsEvidenceArtifacts, finalDraft],
      routeProductContract: payload.route_product_contract as Record<string, unknown>,
    });

    expect(materialized?.ok).toBe(true);
    expect(materialized?.materialized_terminal_artifact_kind).toBe("doc_evidence_synthesis_answer");
    expect(payload.doc_evidence_synthesis_answer).toMatchObject({
      schema: "helix.doc_evidence_synthesis_answer.v1",
      terminal_artifact_kind: "doc_evidence_synthesis_answer",
      source_target: "docs_viewer",
      goal_kind: "doc_evidence_synthesis",
      synthesis_kind: "compare",
      source_docs: expect.arrayContaining([
        expect.objectContaining({ path: "/docs/helix-ask-flow.md" }),
        expect.objectContaining({ path: "/docs/helix-ask-codex-loop-discipline.md" }),
      ]),
      terminal_eligible: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("lets terminal authority select the materialized docs synthesis answer", () => {
    const prompt =
      "Compare docs/helix-ask-flow.md and docs/helix-ask-codex-loop-discipline.md and explain the implication for route authority.";
    const payload: Record<string, unknown> = synthesisPayload(prompt);
    payload.goal_satisfaction_evaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "satisfied",
      next_decision: "allow_terminal",
      assistant_answer: false,
      raw_content_included: false,
    };
    payload.committed_ask_route = buildCommittedAskRoute({
      turnId,
      promptText: prompt,
      selectedRoute: "docs_viewer.local_docs_path_compare",
      payload,
      promptInterpretation: interpretHelixAskPrompt(prompt),
    });
    const finalDraft = {
      artifact_id: "draft:terminal",
      turn_id: turnId,
      kind: "final_answer_draft",
      payload: {
        schema: "helix.final_answer_draft.v1",
        artifact_id: "draft:terminal",
        text: "The implication is that Docs receipts describe evidence, while route authority requires a completed synthesis artifact before visible final text.",
        artifact_refs: ["doc-summary:flow", "doc-summary:discipline"],
        assistant_answer: false,
        raw_content_included: false,
      },
    };

    const result = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      threadId,
      payload,
      artifactLedger: [...docsEvidenceArtifacts, finalDraft],
    });

    expect(result.selected_terminal_artifact_kind).toBe("doc_evidence_synthesis_answer");
    expect(result.visible_text).toContain("completed synthesis artifact");
    expect(payload.terminal_artifact_kind).toBe("doc_evidence_synthesis_answer");
    expect(payload.final_answer_source).toBe("final_answer_draft");
  });

  it("rejects doc_summary as the terminal product for a synthesis route", () => {
    const prompt =
      "Compare docs/helix-ask-flow.md and docs/helix-ask-codex-loop-discipline.md.";
    const payload: Record<string, unknown> = synthesisPayload(prompt);
    const committedRoute = buildCommittedAskRoute({
      turnId,
      promptText: prompt,
      selectedRoute: "docs_viewer.local_docs_path_compare",
      payload,
      promptInterpretation: interpretHelixAskPrompt(prompt),
    });

    expect(committedRouteAllowsTerminalKind({
      committedRoute,
      terminalArtifactKind: "doc_evidence_synthesis_answer",
      finalAnswerSource: "final_answer_draft",
    })).toBe(true);
    expect(committedRouteAllowsTerminalKind({
      committedRoute,
      terminalArtifactKind: "doc_summary",
      finalAnswerSource: "artifact_synthesis",
    })).toBe(false);
  });

  it("treats explicit single-doc cite-anchor explanations as synthesis, not summary-only", () => {
    const prompt =
      "Explain why model commentary owns step choice using docs/helix-ask-codex-loop-discipline.md and cite section anchors.";
    const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText: prompt });
    const plan = buildDocEvidenceSynthesisPlan({ turnId, promptText: prompt });
    const coverage = evaluateDocEvidenceSynthesisCoverage({
      turnId,
      plan,
      evidenceArtifacts: [docsEvidenceArtifacts[1]],
    });

    expect(isExplicitDocsPathLocateSynthesisPrompt(prompt)).toBe(true);
    expect(sourceTargetIntent.target_source).toBe("docs_viewer");
    expect(sourceTargetIntent.precedence_reason).toBe("explicit_docs_path_locate_synthesis_source_target");
    expect(plan.synthesis_kind).toBe("locate_then_explain");
    expect(coverage.sufficient).toBe(true);
  });

  it("keeps quoted docs-path prompts model-only and forbids docs terminals", () => {
    const prompt = '"Open docs/helix-ask-flow.md" is the command I typed earlier; explain whether that should run now.';
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        turn_id: turnId,
        thread_id: threadId,
        target_source: "model_only",
        target_kind: "general_background",
        strength: "soft",
        reasons: ["quoted_tool_command", "historical_tool_reference"],
        allow_no_tool_direct: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: {
        turn_id: turnId,
        goal_kind: "model_only_concept",
        required_terminal_kind: "direct_answer_text",
      },
      tool_call_admission_decision: {
        admitted_tool_families: ["model_only"],
        suppressed_tool_families: ["docs_viewer", "repo_code"],
      },
    };
    const committedRoute = buildCommittedAskRoute({
      turnId,
      promptText: prompt,
      selectedRoute: "conversation:simple",
      payload,
      promptInterpretation: interpretHelixAskPrompt(prompt),
    });

    expect(committedRoute.route.source_target).toBe("model_only");
    expect(committedRoute.capability_policy.suppressed_tool_families).toEqual(expect.arrayContaining(["docs_viewer"]));
    expect(committedRouteAllowsTerminalKind({
      committedRoute,
      terminalArtifactKind: "direct_answer_text",
      finalAnswerSource: "model_direct_answer",
    })).toBe(true);
    expect(committedRouteAllowsTerminalKind({
      committedRoute,
      terminalArtifactKind: "doc_evidence_synthesis_answer",
      finalAnswerSource: "final_answer_draft",
    })).toBe(false);
  });

  it("does not materialize when one requested compare document lacks evidence", () => {
    const prompt =
      "Compare docs/helix-ask-flow.md and docs/helix-ask-codex-loop-discipline.md.";
    const payload: Record<string, unknown> = synthesisPayload(prompt);
    const result = materializeDocEvidenceSynthesisAnswer({
      turnId,
      promptText: prompt,
      payload,
      artifactLedger: [docsEvidenceArtifacts[0]],
      answerText: "A one-sided comparison is not enough.",
      finalAnswerDraftRef: "draft:partial",
    });

    expect(result.ok).toBe(false);
    expect(result.blocked_reason).toBe("doc_evidence_coverage_missing");
    expect(result.coverage.missing_requirements).toEqual(expect.arrayContaining(["multi_doc_coverage"]));
  });
});
