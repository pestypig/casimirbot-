import { describe, expect, it } from "vitest";
import { HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY } from "@shared/helix-scholarly-research-observation";
import { arbitrateAskSourceTarget } from "../services/helix-ask/ask-source-target-arbitrator";
import { buildCapabilityPlan } from "../services/helix-ask/capability-planner";
import { buildCapabilityResultGate } from "../services/helix-ask/capability-result-gate";
import { buildRouteProductContract } from "../services/helix-ask/route-product-contract";
import { buildToolCallAdmissionDecision } from "../services/helix-ask/tool-call-admission";
import {
  runScholarlyResearchLookup,
  type ScholarlyFetch,
} from "../services/helix-ask/retrieval/scholarly-research-lookup";

const canonicalGoal = (goal_kind: string, required_terminal_kind: string | null) => ({
  turn_id: "ask:scholarly",
  goal_kind,
  answer_scope: "external_scholarly_research",
  required_terminal_kind,
  allows_workspace_context: false,
  allows_prior_artifacts: false,
  corpus_anchors: [],
  numeric_tokens: [],
  concept_tokens: [],
  confidence: "high",
  classifier_reasons: ["test"],
});

describe("Helix scholarly research tool admission", () => {
  it("routes DOI citations and references to external scholarly research instead of Docs Viewer", () => {
    const promptText = "Do research: find citations and references for DOI 10.1103/PhysRevD.84.024020.";
    const sourceTargetIntent = arbitrateAskSourceTarget({
      turnId: "ask:scholarly",
      threadId: "helix-ask:test",
      promptText,
    });
    expect(sourceTargetIntent).toMatchObject({
      target_source: "scholarly_research",
      target_kind: "scholarly_research",
      must_enter_backend_ask: true,
      allow_no_tool_direct: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(sourceTargetIntent.requested_outputs).toEqual(expect.arrayContaining([
      "scholarly_paper_refs",
      "doi_metadata",
      "citation_graph",
      "typed_failure",
    ]));
    expect(sourceTargetIntent.suppressed_routes).toEqual(expect.arrayContaining([
      "active_doc_identity",
      "active_doc_summary",
      "doc_open_best",
      "repo_code_evidence_question",
      "model_only_concept",
    ]));

    const routeProductContract = buildRouteProductContract({
      turnId: "ask:scholarly",
      threadId: "helix-ask:test",
      sourceTargetIntent,
      promptText,
    });
    expect(routeProductContract).toMatchObject({
      source_target: "scholarly_research",
      precedence_reason: "scholarly_research_source_target_allows_only_external_paper_evidence_terminal_products",
    });
    expect(routeProductContract.allowed_terminal_artifact_kinds).toContain("scholarly_research_answer");
    expect(routeProductContract.forbidden_terminal_artifact_kinds).toEqual(expect.arrayContaining([
      "docs_viewer_receipt",
      "active_doc_identity",
      "doc_summary",
      "repo_code_evidence_answer",
      "direct_answer_text",
      "model_only_concept",
    ]));

    const toolAdmission = buildToolCallAdmissionDecision({
      turnId: "ask:scholarly",
      sourceTargetIntent,
      routeProductContract,
      promptText,
    });
    expect(toolAdmission).toMatchObject({
      source_target: "scholarly_research",
      required: true,
      admitted_tool_families: ["scholarly_research"],
      reason: "scholarly_research_requires_external_paper_evidence_path",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(toolAdmission.forbidden_routes).toEqual(expect.arrayContaining([
      "active_doc_identity",
      "active_doc_summary",
      "doc_open_best",
      "repo_code_evidence_question",
      "model_only_concept",
      "no_tool_direct",
    ]));

    const plan = buildCapabilityPlan({
      turnId: "ask:scholarly",
      promptText,
      sourceTargetIntent,
      routeProductContract,
      toolCallAdmissionDecision: toolAdmission,
      canonicalGoalFrame: canonicalGoal("scholarly_research_lookup", "scholarly_research_answer"),
    });
    expect(plan).toMatchObject({
      capability_family: "scholarly_research",
      requested_action: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      source_target: "scholarly_research",
      required_terminal_kind: "scholarly_research_answer",
      mutating: false,
      operator_command_required: false,
      operator_command_present: false,
      admission_status: "needs_evidence",
    });

    const result = buildCapabilityResultGate({
      plan,
      terminalArtifactKind: "scholarly_research_observation",
      terminalArtifactId: "ask:scholarly:scholarly_research_observation",
      currentTurnArtifacts: [
        {
          artifact_id: "ask:scholarly:scholarly_research_observation",
          kind: "scholarly_research_observation",
          turn_id: "ask:scholarly",
          payload: {
            schema: "helix.scholarly_research_observation.v1",
            artifact_id: "ask:scholarly:scholarly_research_observation",
            evidence_refs: ["crossref:10.1103/physrevd.84.024020"],
          },
        },
      ],
      reenteredRefs: ["ask:scholarly:scholarly_research_observation"],
    });
    expect(result).toMatchObject({
      status: "succeeded",
      selected_for_answer: true,
      reentered_solver: true,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("suppresses contextual scholarly lookup mentions instead of executing from lexical DOI cues", () => {
    const prompts = [
      ["Do not look up DOI 10.1103/PhysRevD.84.024020; just explain what a DOI is.", "negated_tool_instruction"],
      ['"Search Crossref for this DOI" is the command I typed earlier; explain what it means.', "quoted_tool_command"],
      ["I looked up the DOI earlier; what is a DOI used for?", "historical_tool_reference"],
      ["Explain what would happen if I searched Semantic Scholar for citations.", "hypothetical_tool_reference"],
    ] as const;

    for (const [promptText, suppressionReason] of prompts) {
      const sourceTargetIntent = arbitrateAskSourceTarget({
        turnId: "ask:scholarly-contextual",
        threadId: "helix-ask:test",
        promptText,
      });
      expect(sourceTargetIntent.target_source).toBe("model_only");

      const plan = buildCapabilityPlan({
        turnId: "ask:scholarly-contextual",
        promptText,
        sourceTargetIntent,
        toolCallAdmissionDecision: {
          schema: "helix.tool_call_admission_decision.v1",
          turn_id: "ask:scholarly-contextual",
          source_target: "model_only",
          required: false,
          admitted_tool_families: ["model_only"],
          forbidden_terminal_artifact_kinds: [],
          forbidden_routes: [],
          reason: "contextual_tool_reference_suppressed",
          assistant_answer: false,
          raw_content_included: false,
        },
        canonicalGoalFrame: canonicalGoal("model_only_concept", "direct_answer_text"),
      });
      expect(plan).toMatchObject({
        capability_family: "debug_export",
        requested_action: "suppressed_contextual_tool_reference",
        tool_admission_suppressed: true,
        suppression_reason: suppressionReason,
      });
      expect(plan.capability_family).not.toBe("scholarly_research");
    }
  });

  it("normalizes provider metadata into one scholarly observation without answer authority", async () => {
    const fetchImpl: ScholarlyFetch = async (url) => {
      if (url.includes("api.openalex.org")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            results: [
              {
                id: "https://openalex.org/W123",
                title: "Warp Field Mechanics 101",
                publication_year: 2011,
                doi: "https://doi.org/10.1103/PhysRevD.84.024020",
                cited_by_count: 42,
                referenced_works_count: 17,
                authorships: [{ author: { display_name: "Harold White" } }],
                primary_location: { source: { display_name: "Physical Review D" } },
                open_access: { is_oa: true },
              },
            ],
          }),
        };
      }
      if (url.includes("api.crossref.org")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            message: {
              title: ["Warp Field Mechanics 101"],
              DOI: "10.1103/PhysRevD.84.024020",
              author: [{ given: "Harold", family: "White" }],
              "container-title": ["Physical Review D"],
              "is-referenced-by-count": 42,
              "reference-count": 17,
              URL: "https://doi.org/10.1103/PhysRevD.84.024020",
            },
          }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    };

    const observation = await runScholarlyResearchLookup({
      turnId: "ask:scholarly-service",
      callId: "call:scholarly",
      query: "Find citations for DOI 10.1103/PhysRevD.84.024020",
      providers: ["openalex", "crossref"],
      limit: 5,
      fetchImpl,
    });

    expect(observation).toMatchObject({
      schema: "helix.scholarly_research_observation.v1",
      artifact_id: "call:scholarly:scholarly_research_observation",
      capability: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      intent: "citation_lookup",
      providers_called: ["openalex", "crossref"],
      selected_for_answer: true,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(observation.papers).toHaveLength(1);
    expect(observation.papers[0]).toMatchObject({
      title: "Warp Field Mechanics 101",
      identifiers: { doi: "10.1103/physrevd.84.024020" },
      citation_count: 42,
      reference_count: 17,
      source_providers: expect.arrayContaining(["openalex", "crossref"]),
    });
    expect(observation.evidence_refs.map((ref) => ref.provider)).toEqual(["openalex", "crossref"]);
  });
});
