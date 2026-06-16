import { describe, expect, it } from "vitest";

import { arbitrateAskSourceTarget } from "../services/helix-ask/ask-source-target-arbitrator";
import { buildToolCallAdmissionDecision } from "../services/helix-ask/tool-call-admission";
import { buildHelixCapabilityItinerary } from "../services/helix-ask/capability-itinerary";
import { buildToolUseRestatement } from "../services/helix-ask/internet-search-intent";
import { __testHelixRuntimeToolCallValidation } from "../routes/agi.plan";

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
