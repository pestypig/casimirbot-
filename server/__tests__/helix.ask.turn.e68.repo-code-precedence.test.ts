import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { planRouter } from "../routes/agi.plan";
import { detectDeicticReference } from "../services/helix-ask/deictic-reference-detector";
import { detectRepoCodeEvidenceIntent } from "../services/helix-ask/repo-code-intent-detector";

const createApp = (): express.Express => {
  const app = express();
  app.use(express.json());
  app.use("/api/agi", planRouter);
  return app;
};

const visibleAnswerText = (body: any): string =>
  String(body?.selected_final_answer ?? body?.answer ?? body?.text ?? body?.finalAnswer ?? "");

describe("helix ask repo/code intent precedence", () => {
  it("detects hard repo/code evidence prompts", () => {
    const intent = detectRepoCodeEvidenceIntent(
      "Using repo/code evidence only, what lanes does StarSim support, and where is that enforced in code? Cite exact file paths and line-backed sources from the repository.",
    );

    expect(intent.repoEvidenceRequested).toBe(true);
    expect(intent.strength).toBe("hard");
    expect(intent.reasons).toEqual(
      expect.arrayContaining([
        "repo_code_evidence_only",
        "line_backed_sources",
        "implementation_enforcement_location",
      ]),
    );
    expect(intent.requestedOutputs).toEqual(
      expect.arrayContaining(["repo_code", "file_path", "line_backed_source", "implementation_location"]),
    );
  });

  it("detects project-local agent loop prompts as hard repo/runtime evidence", () => {
    const intent = detectRepoCodeEvidenceIntent(
      "Starting from the top of the agentic turn-based system.",
    );

    expect(intent.repoEvidenceRequested).toBe(true);
    expect(intent.strength).toBe("hard");
    expect(intent.reasons).toContain("project_local_agent_loop");
    expect(intent.requestedOutputs).toEqual(
      expect.arrayContaining([
        "repo_code",
        "implementation_location",
        "route_trace",
        "tool_call_eligibility",
        "terminal_contract",
        "codex_comparison",
        "line_backed_source",
      ]),
    );
  });

  it("does not treat active-doc line-backed location prompts as repo/code evidence", () => {
    const intent = detectRepoCodeEvidenceIntent(
      "Find lapse shift in the current doc and return the line-backed locations.",
    );

    expect(intent.repoEvidenceRequested).toBe(false);
    expect(intent.strength).toBe("none");
    expect(intent.reasons).toContain("active_docs_viewer_location_request_not_repo_code");
  });

  it("does not treat repo file-path requests as selected visible file references", () => {
    const ref = detectDeicticReference({
      threadId: "test",
      promptText: "Using repo/code evidence only, where is source-target admission enforced? Cite exact file paths and line-backed sources from the repository.",
      inputModality: "typed",
    });

    expect(ref.candidate_signal).toBe(false);
    expect(ref.reference_type).toBe("unknown");
  });

  it("still treats selected visible file prompts as Situation Room references", () => {
    const ref = detectDeicticReference({
      threadId: "test",
      promptText: "Can you see the file I'm clicking on right now?",
      inputModality: "typed",
    });

    expect(ref.candidate_signal).toBe(true);
    expect(ref.reference_type).toBe("selected_visible_file");
  });

  it("routes explicit repo/code evidence prompts away from Situation Room and direct answer paths", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question:
          "Using repo/code evidence only, what lanes does StarSim support, and where is that enforced in code? Cite exact file paths and line-backed sources from the repository.",
        mode: "read",
        debug: true,
        sessionId: `repo-code-starsim-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.route_reason_code).not.toBe("situation_context_question");
    expect(response.body?.final_answer_source).not.toBe("artifact_synthesis");
    expect(response.body?.final_answer_source).not.toBe("no_tool_direct");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("repo_code_evidence_question");
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "repo_code",
      target_kind: "repo_code",
      strength: "hard",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
      precedence_reason: "explicit_repo_code_source_target",
    });
    expect(response.body?.route_product_contract).toMatchObject({
      source_target: "repo_code",
    });
    expect(response.body?.route_product_contract?.forbidden_terminal_artifact_kinds).toContain("situation_context_pack");
    expect(response.body?.retrieval_required_signal?.required).toBe(true);
    expect(response.body?.retrieval_required_signal?.strength).toBe("hard");
    expect(response.body?.repo_claim_observation_gate).toBeTruthy();
    expect(response.body?.repo_claim_support).toBeTruthy();
  }, 90000);

  it("routes source-target admission enforcement questions to repo evidence before visual deictic routing", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question:
          "Using repo/code evidence only, where is source-target admission enforced? Cite exact file paths and line-backed sources from the repository.",
        mode: "read",
        debug: true,
        sessionId: `repo-code-source-target-${Date.now()}`,
      })
      .expect(200);

    const ref = detectDeicticReference({
      threadId: "test",
      promptText:
        "Using repo/code evidence only, where is source-target admission enforced? Cite exact file paths and line-backed sources from the repository.",
      inputModality: "typed",
    });

    expect(ref.candidate_signal).toBe(false);
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "repo_code",
      strength: "hard",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
    });
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("repo_code_evidence_question");
    expect(response.body?.retrieval_required_signal).toMatchObject({
      required: true,
      strength: "hard",
    });
    expect(response.body?.route_product_contract?.forbidden_terminal_artifact_kinds).toEqual(
      expect.arrayContaining([
        "situation_context_pack",
        "visual_frame_evidence",
        "process_graph_overview",
        "no_tool_direct",
        "model_only_concept",
      ]),
    );
    expect(response.body?.final_answer_source).not.toBe("no_tool_direct");
    expect(response.body?.final_answer_source).not.toBe("model_only_concept");
  }, 90000);

  it("routes project-local agent loop prompts away from model-only direct answers", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Starting from the top of the agentic turn-based system.",
        mode: "read",
        debug: true,
        sessionId: `agent-loop-top-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("repo_code_evidence_question");
    expect(response.body?.retrieval_required_signal).toMatchObject({
      required: true,
      strength: "hard",
    });
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "repo_code",
      target_kind: "repo_code",
      strength: "hard",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
    });
    expect(response.body?.source_target_intent?.requested_outputs).toEqual(
      expect.arrayContaining(["tool_call_eligibility", "terminal_contract", "codex_comparison", "line_backed_source"]),
    );
    expect(response.body?.final_answer_source).not.toBe("no_tool_direct");
    expect(response.body?.tool_eligibility_diagnosis).toMatchObject({
      schema: "helix.tool_eligibility_diagnosis.v1",
      retrieval_required: true,
      retrieval_strength: "hard",
      source_target: "repo_code",
      allow_no_tool_direct: false,
      tool_path_allowed: true,
      blocking_reason: "none",
    });
    expect(response.body?.route_product_contract?.forbidden_terminal_artifact_kinds).toEqual(
      expect.arrayContaining(["direct_answer_text", "no_tool_direct", "model_only_concept", "process_graph_overview"]),
    );
  }, 90000);

  it("diagnoses tool-call eligibility questions from repo/runtime evidence", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Why didn't it make the repo grep call?",
        mode: "read",
        debug: true,
        sessionId: `repo-grep-eligibility-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("repo_code_evidence_question");
    expect(response.body?.final_answer_source).not.toBe("no_tool_direct");
    expect(response.body?.tool_eligibility_diagnosis).toMatchObject({
      retrieval_required: true,
      source_target: "repo_code",
      allow_no_tool_direct: false,
      tool_path_allowed: true,
    });
  }, 90000);

  it("routes project-local entity definition prompts to repo evidence", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "What is StarSim?",
        mode: "read",
        debug: true,
        sessionId: `repo-entity-starsim-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.final_answer_source).not.toBe("no_tool_direct");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("repo_entity_definition");
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "repo_code",
      target_kind: "repo_code",
      strength: "soft",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
      precedence_reason: "project_local_entity_source_target",
    });
    expect(response.body?.retrieval_required_signal?.required).toBe(true);
  }, 90000);

  it("detects internal workstation concepts as repo-backed entity definitions", () => {
    const cases = [
      ["What is the Situation Room?", "Situation Room"],
      ["What is Auntie Dottie in this app?", "Auntie Dottie"],
      ["What is Route Evidence supposed to be?", "Route Evidence"],
      ["How does the docs panel work?", "docs panel"],
      ["What are field workers?", "field worker"],
      ["What is the perturbation broker?", "perturbation broker"],
    ] as const;

    for (const [prompt, entity] of cases) {
      const intent = detectRepoCodeEvidenceIntent(prompt);
      expect(intent.repoEvidenceRequested, prompt).toBe(true);
      expect(["soft", "hard"], prompt).toContain(intent.strength);
      expect(intent.reasons, prompt).toEqual(
        expect.arrayContaining(
          intent.strength === "hard" ? ["project_local_agent_loop"] : ["project_local_entity_definition"],
        ),
      );
      expect(intent.projectEntity, prompt).toBe(entity);
      expect(intent.requestedOutputs, prompt).toContain("repo_code");
      if (intent.strength === "soft") {
        expect(intent.requestedOutputs, prompt).toContain("file_path");
      }
    }
  });

  it("routes Situation Room concept questions through repo evidence instead of generic direct answer", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "What is the Situation Room?",
        mode: "read",
        debug: true,
        sessionId: `repo-entity-situation-room-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("repo_entity_definition");
    expect(response.body?.source_target_intent).toMatchObject({
      target_source: "repo_code",
      target_kind: "repo_code",
      strength: "soft",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
      precedence_reason: "project_local_entity_source_target",
    });
    expect(response.body?.retrieval_required_signal).toMatchObject({
      required: true,
    });
    expect(["soft", "hard"]).toContain(response.body?.retrieval_required_signal?.strength);
    expect(response.body?.available_capabilities?.recommended_capability_key).toBe("repo-code.search_concept");
    expect(response.body?.available_capabilities?.model_visible_capability_keys).toContain("repo-code.search_concept");
    expect(response.body?.capability_plan).toMatchObject({
      capability_family: "repo_evidence",
      requested_action: "repo-code.search_concept",
      source_target: "repo_code",
    });
    expect(response.body?.agent_runtime_loop?.iterations?.some((iteration: any) =>
      iteration?.chosen_capability === "repo-code.search_concept" &&
      iteration?.observation_role === "executed_tool_result"
    )).toBe(true);
    expect(response.body?.current_turn_artifact_ledger?.some((artifact: any) =>
      artifact?.kind === "repo_code_evidence_observation" &&
      artifact?.payload?.schema === "helix.repo_code_evidence_observation.v1"
    )).toBe(true);
    expect(response.body?.post_tool_observation_reviews?.length).toBeGreaterThan(0);
    expect(response.body?.final_answer_source).not.toBe("no_tool_direct");
    expect(response.body?.final_answer_source).not.toBe("model_direct_answer");
    expect(response.body?.terminal_artifact_kind).toBe("repo_code_evidence_answer");
    expect(response.body?.terminal_artifact_kind).not.toBe("direct_answer_text");
    expect(visibleAnswerText(response.body)).not.toMatch(/required artifacts.*doc_summary/i);
    expect(visibleAnswerText(response.body)).toMatch(/repo evidence|key evidence|situation room/i);
    expect(response.body?.repo_claim_observation_gate).toMatchObject({
      decision: "observe",
      failedClosed: false,
    });
    expect(Array.isArray(response.body?.evidence_observations)).toBe(true);
    expect(response.body?.evidence_observations.length).toBeGreaterThan(0);
  }, 90000);

  it("keeps explicit background-only prompts direct", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Background only: what is a generic stellar simulation?",
        mode: "read",
        debug: true,
        sessionId: `background-only-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.retrieval_required_signal?.required).toBe(false);
    expect(response.body?.dispatch_policy).toBe("direct_answer_only");
  }, 60000);

  it("keeps background-only agent loop prompts direct", async () => {
    const app = createApp();
    const response = await request(app)
      .post("/api/agi/ask/turn")
      .send({
        question: "Background only: starting from the top of the agentic turn-based system.",
        mode: "read",
        debug: true,
        sessionId: `background-agent-loop-${Date.now()}`,
      })
      .expect(200);

    expect(response.body?.retrieval_required_signal?.required).toBe(false);
    expect(response.body?.dispatch_policy).toBe("direct_answer_only");
    expect(response.body?.canonical_goal_frame?.goal_kind).toBe("model_only_concept");
  }, 60000);
});
