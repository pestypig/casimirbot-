import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";

import { arbitrateAskSourceTarget } from "../services/helix-ask/ask-source-target-arbitrator";
import { buildToolCallAdmissionDecision } from "../services/helix-ask/tool-call-admission";
import { buildHelixCapabilityItinerary } from "../services/helix-ask/capability-itinerary";
import { buildToolUseRestatement } from "../services/helix-ask/internet-search-intent";
import { detectRepoCodeEvidenceIntent } from "../services/helix-ask/repo-code-intent-detector";
import { planRouter, __testHelixRuntimeToolCallValidation } from "../routes/agi.plan";

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

const turnId = "ask:test-docs-search-admission";
const threadId = "thread:test-docs-search-admission";
const prompt = "Search docs for Helix Ask console debug and tell me which document path you found.";

describe("Helix Ask docs-search admission", () => {
  it("treats affirmative local docs search as a hard docs-viewer evidence path", () => {
    const restatement = buildToolUseRestatement(prompt);
    const sourceTargetIntent = arbitrateAskSourceTarget({
      turnId,
      threadId,
      promptText: prompt,
    });
    const admission = buildToolCallAdmissionDecision({
      turnId,
      promptText: prompt,
      sourceTargetIntent,
    });
    const itinerary = buildHelixCapabilityItinerary({
      turnId,
      promptText: prompt,
      toolCallAdmissionDecision: admission,
      availableCapabilities: {
        capabilities: [
          {
            capability_key: "docs-viewer.search_docs",
            availability: "available",
          },
        ],
      },
    });

    expect(restatement.requiredToolFamilies).toContain("docs_viewer");
    expect(restatement.requiredToolFamilies).not.toContain("internet_search");
    expect(sourceTargetIntent).toMatchObject({
      target_source: "docs_viewer",
      strength: "hard",
      precedence_reason: "explicit_docs_search_source_target",
      allow_no_tool_direct: false,
    });
    expect(admission).toMatchObject({
      source_target: "docs_viewer",
      required: true,
      admitted_tool_families: ["docs_viewer"],
      reason: "docs_viewer_requires_document_tool_path",
    });
    expect(admission.forbidden_routes).toEqual(expect.arrayContaining(["model_only_concept", "no_tool_direct"]));
    expect(admission.forbidden_terminal_artifact_kinds).toEqual(expect.arrayContaining(["no_tool_direct", "model_only_concept"]));
    expect(itinerary.relevant_tool_families).toContain("docs_viewer");
    expect(itinerary.planned_steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tool_family: "docs_viewer",
          capability_hint: "docs-viewer.search_docs",
          required_observation_kinds: expect.arrayContaining(["doc_search_results", "doc_candidate_validation", "doc_open_receipt"]),
        }),
      ]),
    );
    expect(itinerary.terminal_success_criteria.typed_failure_codes).toContain("docs_viewer_observation_missing");
  });

  it("does not admit docs viewer from negated, quoted, historical, or explanatory docs-search mentions", () => {
    const prompts = [
      "Do not search docs for Helix Ask console debug; just explain what the prompt is asking.",
      '"Search docs for Helix Ask console debug" is the command I typed earlier; explain whether it should run.',
      "Earlier we searched docs for Helix Ask console debug; what kind of evidence should the next patch require?",
      "Explain what the docs viewer search tool is for without searching docs.",
    ];

    for (const promptText of prompts) {
      const restatement = buildToolUseRestatement(promptText);
      const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText });
      const admission = buildToolCallAdmissionDecision({ turnId, promptText, sourceTargetIntent });

      expect(restatement.requiredToolFamilies).not.toContain("docs_viewer");
      expect(sourceTargetIntent.target_source).not.toBe("docs_viewer");
      expect(admission.admitted_tool_families).not.toContain("docs_viewer");
    }
  });

  it("does not treat a Docs Viewer topic label as an active document command", () => {
    const promptText =
      "Docs Viewer: strongest dynamic surface for Helix Ask console evidence. Review this as an implementation claim, not the current document.";
    const restatement = buildToolUseRestatement(promptText);
    const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText });
    const admission = buildToolCallAdmissionDecision({ turnId, promptText, sourceTargetIntent });

    expect(restatement.requiredToolFamilies).not.toContain("docs_viewer");
    expect(sourceTargetIntent.target_source).not.toBe("docs_viewer");
    expect(sourceTargetIntent.target_source).not.toBe("active_doc");
    expect(sourceTargetIntent.requested_outputs).not.toContain("file_path");
    expect(admission.admitted_tool_families).not.toContain("docs_viewer");
    expect(admission.reason).not.toBe("docs_viewer_requires_document_tool_path");
  });

  it("does not treat a Docs Viewer capability-coverage claim as an active document command", () => {
    const promptText =
      "Docs Viewer: strongest dynamic surface. All 14 dynamic actions have some test evidence; core actions like open, locate_in_doc, summarize_doc, search_docs, and explain_paper are well represented.";
    const restatement = buildToolUseRestatement(promptText);
    const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText });
    const admission = buildToolCallAdmissionDecision({ turnId, promptText, sourceTargetIntent });

    expect(restatement.requiredToolFamilies).not.toContain("docs_viewer");
    expect(sourceTargetIntent.target_source).not.toBe("docs_viewer");
    expect(sourceTargetIntent.target_source).not.toBe("active_doc");
    expect(sourceTargetIntent.requested_outputs).not.toContain("file_path");
    expect(admission.admitted_tool_families).not.toContain("docs_viewer");
    expect(admission.reason).not.toBe("docs_viewer_requires_document_tool_path");
  });

  it("routes exact two-doc markdown comparison to Docs Viewer instead of repo-code", () => {
    const promptText =
      "Compare docs/helix-ask-flow.md and docs/helix-ask-codex-loop-discipline.md in a two-column table of the main routing rules.";
    const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText });
    const admission = buildToolCallAdmissionDecision({ turnId, promptText, sourceTargetIntent });
    const repoIntent = detectRepoCodeEvidenceIntent(promptText);

    expect(repoIntent).toMatchObject({
      repoEvidenceRequested: false,
      strength: "none",
    });
    expect(repoIntent.reasons).toContain("docs_viewer_exact_doc_path_request_not_repo_code");
    expect(sourceTargetIntent).toMatchObject({
      target_source: "docs_viewer",
      strength: "hard",
      precedence_reason: "explicit_docs_path_compare_source_target",
      allow_no_tool_direct: false,
    });
    expect(sourceTargetIntent.reasons).toEqual(expect.arrayContaining(["local_docs_path_suppresses_repo_code"]));
    expect(admission.admitted_tool_families).toContain("docs_viewer");
    expect(admission.admitted_tool_families).not.toContain("repo_code");
  });

  it("routes exact markdown locate plus synthesis to Docs Viewer locate instead of repo-code", () => {
    const promptText =
      "In docs/helix-ask-codex-loop-discipline.md, locate Patch-Time Contract and turn the evidence into a short runbook.";
    const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText });
    const admission = buildToolCallAdmissionDecision({ turnId, promptText, sourceTargetIntent });
    const repoIntent = detectRepoCodeEvidenceIntent(promptText);

    expect(repoIntent).toMatchObject({
      repoEvidenceRequested: false,
      strength: "none",
    });
    expect(sourceTargetIntent).toMatchObject({
      target_source: "docs_viewer",
      strength: "hard",
      precedence_reason: "explicit_docs_path_locate_synthesis_source_target",
      allow_no_tool_direct: false,
    });
    expect(sourceTargetIntent.requested_outputs).toEqual(expect.arrayContaining(["file_path", "tool_call_eligibility"]));
    expect(admission.admitted_tool_families).toContain("docs_viewer");
    expect(admission.admitted_tool_families).not.toContain("repo_code");
  });

  it("does not execute quoted bare docs-path commands as Docs Viewer or repo-code", () => {
    const promptText =
      '"Open docs/helix-ask-flow.md" is the command I typed earlier; explain whether that should run now.';
    const restatement = buildToolUseRestatement(promptText);
    const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText });
    const admission = buildToolCallAdmissionDecision({ turnId, promptText, sourceTargetIntent });
    const repoIntent = detectRepoCodeEvidenceIntent(promptText);

    expect(restatement.requiredToolFamilies).not.toContain("docs_viewer");
    expect(repoIntent.repoEvidenceRequested).toBe(false);
    expect(sourceTargetIntent.target_source).not.toBe("docs_viewer");
    expect(sourceTargetIntent.target_source).not.toBe("repo_code");
    expect(sourceTargetIntent.reasons).toEqual(expect.arrayContaining(["explicit_model_only_target"]));
    expect(admission.admitted_tool_families).not.toContain("docs_viewer");
    expect(admission.admitted_tool_families).not.toContain("repo_code");
    expect(admission.tool_admission_suppressed).toBe(true);
    expect(admission.suppression_reason).toBe("quoted_tool_command");
  });

  it("does not leave exact docs-path compare turns with a model-only canonical goal", async () => {
    const app = createApp();
    const promptText =
      "Compare docs/helix-ask-flow.md and docs/helix-ask-codex-loop-discipline.md in a two-column table of the main routing rules.";

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        thread_id: threadId,
        question: promptText,
        debug: true,
      })
      .expect(200);

    expect(response.body?.source_target_intent?.target_source).toBe("docs_viewer");
    expect(response.body?.source_target_intent?.precedence_reason).toBe("explicit_docs_path_compare_source_target");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("doc_evidence_synthesis");
    expect(response.body?.canonical_goal_frame?.answer_scope).toBe("current_turn_doc");
    expect(response.body?.canonical_goal_frame?.required_terminal_kind).toBe("doc_evidence_synthesis_answer");
    expect(response.body?.canonical_goal_frame?.classifier_reasons ?? []).toEqual(
      expect.arrayContaining(["explicit_docs_path_compare_goal", "evidence_target_arbitration_selected_docs_viewer"]),
    );
    expect(response.body?.terminal_error_code).not.toBe("poison_clean_but_authority_failed");
  }, 30000);

  it("does not turn a Docs Viewer capability-coverage claim into a doc-open Ask turn", async () => {
    const app = createApp();
    const promptText =
      "Docs Viewer: strongest dynamic surface. All 14 dynamic actions have some test evidence; core actions like open, locate_in_doc, summarize_doc, search_docs, and explain_paper are well represented.";

    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        thread_id: threadId,
        question: promptText,
      })
      .expect(200);

    const body = response.body ?? {};
    const sourceTargetIntent = body.source_target_intent ?? {};
    const canonicalGoal = body.canonical_goal_frame ?? {};
    const universalGoal = body.universal_goal_frame ?? {};
    const runtimeLoop = body.agent_runtime_loop ?? [];
    const runtimeText = JSON.stringify(runtimeLoop);

    expect(sourceTargetIntent.target_source).not.toBe("docs_viewer");
    expect(sourceTargetIntent.target_source).not.toBe("active_doc");
    expect(sourceTargetIntent.reasons ?? []).toContain("docs_viewer_topic_label_not_active_doc_command");
    expect(sourceTargetIntent.suppressed_routes ?? []).toEqual(
      expect.arrayContaining(["active_doc_identity", "active_doc_summary", "doc_open_best"]),
    );
    expect(canonicalGoal.goal_kind).not.toMatch(/doc_open|doc_summary|active_doc_summary/);
    expect(universalGoal.user_goal?.goal_kind).not.toBe("open_workspace");
    expect(universalGoal.requested_outputs ?? []).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "doc_open" })]),
    );
    expect(String(body.selected_capability ?? "")).not.toMatch(/^docs-viewer\./);
    expect(runtimeText).not.toMatch(/docs-viewer\.(?:open|summarize|search|locate|explain)/);
    expect(JSON.stringify(body)).not.toMatch(/active_doc_path/);
  }, 15000);

  it("rejects repo-code runtime calls under hard docs-viewer admission", () => {
    const sourceTargetIntent = arbitrateAskSourceTarget({
      turnId,
      threadId,
      promptText: prompt,
    });
    const admission = buildToolCallAdmissionDecision({
      turnId,
      promptText: prompt,
      sourceTargetIntent,
    });
    const availableCapabilities = {
      capabilities: [
        {
          capability_key: "repo-code.search_concept",
          requires_action: true,
          availability: "available",
          goal_fit: "forbidden",
        },
        {
          capability_key: "docs-viewer.search_docs",
          requires_action: true,
          availability: "available",
          goal_fit: "primary",
        },
      ],
    } as any;

    const rejectedRepoCall = __testHelixRuntimeToolCallValidation.validateHelixRuntimeToolCall({
      availableCapabilities,
      toolCallAdmissionDecision: admission,
      call: {
        schema: "helix.runtime_tool_call.v1",
        turn_id: turnId,
        call_id: "call:repo-search",
        capability_key: "repo-code.search_concept",
        args: { query: "Helix Ask console debug" },
        assistant_answer: false,
        raw_content_included: false,
      },
    });

    expect(rejectedRepoCall.validation.valid).toBe(false);
    expect(rejectedRepoCall.validation.errors).toEqual(
      expect.arrayContaining([
        "forbidden_capability_for_goal",
        "runtime_capability_not_admitted_by_tool_policy:repo-code.search_concept:repo_code|runtime_evidence",
        "runtime_tool_forbidden_by_tool_policy:repo-code.search_concept",
      ]),
    );
  });
});
