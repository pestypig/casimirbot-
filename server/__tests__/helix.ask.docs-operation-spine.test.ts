import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import { arbitrateAskSourceTarget } from "../services/helix-ask/ask-source-target-arbitrator";
import { buildCommittedAskRoute } from "../services/helix-ask/committed-ask-route";
import { buildHelixDomainContinuationDecision } from "../services/helix-ask/domain-continuation-decision";
import { isCurrentOpenDocsViewerSummaryPrompt } from "../services/helix-ask/docs-viewer-intent";
import { interpretHelixAskPrompt } from "../services/helix-ask/prompt-interpretation";
import { buildRouteProductContract } from "../services/helix-ask/route-product-contract";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

const turnId = "ask:test-docs-operation-spine";
const threadId = "thread:test-docs-operation-spine";

describe("Helix Ask Docs operation spine", () => {
  it("routes two explicit docs paths to docs evidence synthesis, not doc_summary", () => {
    const prompt =
      "Compare docs/helix-ask-flow.md and docs/helix-ask-codex-loop-discipline.md in a two-column table of the main routing rules.";
    const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText: prompt });
    const routeProductContract = buildRouteProductContract({
      turnId,
      threadId,
      sourceTargetIntent,
      promptText: prompt,
    });
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      source_target_intent: sourceTargetIntent,
      canonical_goal_frame: {
        turn_id: turnId,
        goal_kind: "doc_evidence_synthesis",
        required_terminal_kind: "doc_evidence_synthesis_answer",
      },
      route_product_contract: routeProductContract,
      tool_call_admission_decision: {
        admitted_tool_families: ["docs_viewer"],
        suppressed_tool_families: ["repo_code"],
      },
    };
    const committedRoute = buildCommittedAskRoute({
      turnId,
      promptText: prompt,
      selectedRoute: "docs_viewer.local_docs_path_compare",
      payload,
      promptInterpretation: interpretHelixAskPrompt(prompt),
    });

    expect(sourceTargetIntent.target_source).toBe("docs_viewer");
    expect(sourceTargetIntent.explicit_cues).toContain("explicit_docs_path_compare");
    expect(routeProductContract.allowed_terminal_artifact_kinds).toContain("doc_evidence_synthesis_answer");
    expect(routeProductContract.forbidden_terminal_artifact_kinds).toContain("doc_summary");
    expect(committedRoute.canonical_goal.goal_kind).toBe("doc_evidence_synthesis");
    expect(committedRoute.canonical_goal.required_terminal_kind).toBe("doc_evidence_synthesis_answer");
    expect(committedRoute.canonical_goal.forbidden_terminal_artifact_kinds).toContain("doc_summary");
  });

  it("continues multi-doc compare by requesting the missing doc summary evidence", () => {
    const prompt =
      "Compare docs/helix-ask-flow.md and docs/helix-ask-codex-loop-discipline.md. Give three differences in what each document is responsible for.";
    const decision = buildHelixDomainContinuationDecision({
      turnId,
      prompt,
      payload: {
        canonical_goal_frame: {
          goal_kind: "doc_evidence_synthesis",
          required_terminal_kind: "doc_evidence_synthesis_answer",
        },
        current_turn_artifact_ledger: [
          {
            artifact_id: "doc-summary:flow",
            kind: "doc_summary",
            payload: {
              path: "/docs/helix-ask-flow.md",
              answer_text: "Flow summary.",
            },
          },
        ],
      },
    });

    expect(decision.decision).toBe("continue");
    expect(decision.reason).toBe("doc_evidence_synthesis_requires_missing_doc_summary");
    expect(decision.docs_continuation_contract).toMatchObject({
      current_docs_phase: "multi_doc_summary_required",
      required_next_capability: "docs-viewer.summarize_doc",
      expected_next_artifact: "doc_summary",
    });
    expect(decision.recommended_capability_hint?.suggested_action).toMatchObject({
      panel_id: "docs-viewer",
      action_id: "summarize_doc",
      args: {
        path: "/docs/helix-ask-codex-loop-discipline.md",
      },
    });
  });

  it("continues locate plus checklist by requesting location evidence before synthesis", () => {
    const prompt =
      "Locate Patch-Time Contract in docs/helix-ask-codex-loop-discipline.md and turn it into a five-step checklist.";
    const sourceTargetIntent = arbitrateAskSourceTarget({ turnId, threadId, promptText: prompt });
    const routeProductContract = buildRouteProductContract({
      turnId,
      threadId,
      sourceTargetIntent,
      promptText: prompt,
    });
    const decision = buildHelixDomainContinuationDecision({
      turnId,
      prompt,
      payload: {
        source_target_intent: sourceTargetIntent,
        route_product_contract: routeProductContract,
        canonical_goal_frame: {
          goal_kind: "doc_evidence_synthesis",
          required_terminal_kind: "doc_evidence_synthesis_answer",
        },
      },
    });

    expect(sourceTargetIntent.explicit_cues).toContain("explicit_docs_path_locate_synthesis");
    expect(routeProductContract.forbidden_terminal_artifact_kinds).toContain("doc_summary");
    expect(decision.decision).toBe("continue");
    expect(decision.reason).toBe("doc_evidence_synthesis_requires_location");
    expect(decision.docs_continuation_contract).toMatchObject({
      current_docs_phase: "location_required",
      required_next_capability: "docs-viewer.locate_in_doc",
    });
    expect(decision.recommended_capability_hint?.suggested_action).toMatchObject({
      panel_id: "docs-viewer",
      action_id: "locate_in_doc",
      args: {
        path: "/docs/helix-ask-codex-loop-discipline.md",
      },
    });
  });

  it("recognizes currently open Docs Viewer summary prompts as active-doc summary", async () => {
    const prompt = "Summarize the currently open document in Docs Viewer in four bullets, and include the document path.";
    const activePath = "/docs/helix-ask-flow.md";

    expect(isCurrentOpenDocsViewerSummaryPrompt(prompt)).toBe(true);
    const sourceTargetIntent = arbitrateAskSourceTarget({
      turnId,
      threadId,
      promptText: prompt,
      activeWorkspaceSourceResolution: {
        schema: "helix.active_workspace_source_resolution.v1",
        turn_id: turnId,
        prompt_hash: "test",
        active_panel: "docs-viewer",
        active_doc_path: activePath,
        doc_context_valid: true,
        generic_deictic: true,
        explicit_visual: false,
        resolved_source_target: "active_doc",
        resolved_target_kind: "active_doc",
        requested_terminal_kind: "doc_summary",
        reason: "active_docs_viewer_valid_doc",
        confidence: 0.99,
        assistant_answer: false,
        raw_content_included: false,
      },
    });

    expect(sourceTargetIntent.target_source).toBe("active_doc");
    expect(sourceTargetIntent.explicit_cues).toContain("active_docs_viewer_summary");

    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: prompt,
        mode: "read",
        debug: true,
        sessionId: `docs-operation-spine-active-${Date.now()}`,
        workspace_context_snapshot: {
          activePanel: "docs-viewer",
          activeDocPath: activePath,
          hasDocContext: true,
          docContextValid: true,
        },
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("active_doc_summary");
    expect(response.body?.terminal_artifact_kind).toBe("doc_summary");
    expect(String(response.body?.selected_final_answer ?? "")).toContain(activePath);
  }, 90000);
});
