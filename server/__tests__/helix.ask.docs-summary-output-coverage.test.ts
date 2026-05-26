import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

const docPath = "/docs/research/nhm2-current-status-whitepaper-2026-05-02.md";

const workspaceSnapshot = (sessionId: string) => ({
  sessionId,
  activePanel: "docs-viewer",
  activeDocPath: docPath,
  hasDocContext: true,
  hasNoteContext: false,
});

const visibleBulletCount = (text: string): number =>
  text.split(/\r?\n/).filter((line) => /^\s*(?:[-*•]|\d+[.)])\s+\S/.test(line)).length;

describe("Helix Ask docs summary output coverage", () => {
  it("covers requested summary bullet count and path before allowing terminal success", async () => {
    const app = createApp();
    const sessionId = `docs-summary-covered-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: `Summarize ${docPath} from docs in 5 bullets. Include the path.`,
        mode: "read",
        debug: true,
        sessionId,
        workspace_context_snapshot: workspaceSnapshot(sessionId),
      })
      .expect(200);

    const answerText = String(response.body?.selected_final_answer ?? response.body?.answer ?? response.body?.text ?? "");
    const coverage = response.body?.prompt_requirement_coverage;
    expect(response.body?.terminal_artifact_kind).not.toBe("typed_failure");
    expect(answerText).toContain(docPath);
    expect(visibleBulletCount(answerText)).toBeGreaterThanOrEqual(5);
    expect(
      response.body?.agent_runtime_loop?.iterations?.some(
        (iteration: any) =>
          iteration?.chosen_capability === "docs-viewer.summarize_doc" &&
          ["executed_tool_result", "preobserved_tool_result"].includes(iteration?.observation_role) &&
          Array.isArray(iteration?.observed_artifact_refs) &&
          iteration.observed_artifact_refs.some((ref: unknown) => String(ref).includes(":doc_summary:")),
      ),
    ).toBe(true);
    expect(coverage?.coverage).toBe("complete");
    expect(response.body?.doc_retrieval_coverage?.coverage).toBe("complete");
    expect(response.body?.doc_retrieval_coverage?.requested_scope).toBe("full_doc");
    expect(coverage?.requirements?.some((entry: any) => entry?.id === "doc_summary_min_5_bullets" && entry?.satisfied === true)).toBe(true);
    expect(coverage?.requirements?.some((entry: any) => entry?.id === "doc_summary_path_included" && entry?.satisfied === true)).toBe(true);
    expect(
      response.body?.job_ready_links?.some((link: any) => link?.label === "Open cited doc" && link?.args?.path === docPath),
    ).toBe(true);
    expect(
      response.body?.job_ready_links?.some((link: any) => link?.label === "Open current doc" && link?.args?.path === docPath),
    ).toBe(false);
    expect(response.body?.debug?.doc_summary_terminal_promotion).toBeUndefined();
    expect(response.body?.debug?.doc_summary_observation_candidate?.terminal_authority).toBe(false);
  }, 60000);

  it("searches docs before summarizing when no exact or active document is supplied", async () => {
    const app = createApp();
    const sessionId = `docs-summary-search-then-read-${Date.now()}`;
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Summarize docs about NHM2 current status in 4 bullets. Include the path.",
        mode: "read",
        debug: true,
        sessionId,
        workspace_context_snapshot: {
          sessionId,
          activePanel: "docs-viewer",
          activeDocPath: docPath,
          hasDocContext: true,
          hasNoteContext: false,
        },
      })
      .expect(200);

    const answerText = String(response.body?.selected_final_answer ?? response.body?.answer ?? response.body?.text ?? "");
    const iterations = response.body?.agent_runtime_loop?.iterations ?? [];
    const plannerItems = response.body?.planner_contract?.plan_items ?? [];
    expect(response.body?.terminal_artifact_kind).not.toBe("typed_failure");
    expect(response.body?.final_status).toBe("final_answer");
    expect(iterations.some((iteration: any) => iteration?.chosen_capability === "docs-viewer.search_docs")).toBe(true);
    expect(response.body?.initial_agent_step_decision?.chosen_capability).toBe("docs-viewer.search_docs");
    expect(
      iterations.some(
        (iteration: any) =>
          iteration?.chosen_capability === "docs-viewer.summarize_doc" &&
          Array.isArray(iteration?.observed_artifact_refs) &&
          iteration.observed_artifact_refs.some((ref: unknown) => String(ref).includes(":doc_summary:")),
      ),
    ).toBe(true);
    expect(answerText).toMatch(/\/docs\//);
    expect(visibleBulletCount(answerText)).toBeGreaterThanOrEqual(4);
    expect(
      plannerItems.some((item: any) => String(item?.id ?? "").includes("reasoning_followup_opened_doc_answer")),
    ).toBe(false);
    expect(response.body?.satisfaction_report?.missing_artifacts ?? []).not.toContain("doc_concept_explanation");
    expect(response.body?.agent_loop_budget?.missing_requirement_ids ?? []).not.toContain("doc_concept_explanation");
    expect(response.body?.prompt_requirement_coverage?.coverage).toBe("complete");
    expect(response.body?.doc_retrieval_coverage?.coverage).toBe("complete");
    expect(response.body?.doc_retrieval_coverage?.requested_scope).toBe("broad_topic");
    expect(
      response.body?.doc_retrieval_coverage?.requirements?.some(
        (entry: any) => entry?.id === "doc_search_results_observed" && entry?.satisfied === true,
      ),
    ).toBe(true);
    const docLinks = (response.body?.job_ready_links ?? []).filter((link: any) => link?.panel_id === "docs-viewer");
    const docLinkPaths = docLinks.map((link: any) => String(link?.args?.path ?? link?.path ?? ""));
    expect(docLinks.some((link: any) => link?.label === "Open cited doc")).toBe(true);
    expect(new Set(docLinkPaths).size).toBe(docLinkPaths.length);
    expect(response.body?.debug?.doc_summary_terminal_promotion).toBeUndefined();
    if (response.body?.debug?.doc_summary_observation_candidate) {
      expect(response.body.debug.doc_summary_observation_candidate.terminal_authority).toBe(false);
    }
  }, 60000);
});
