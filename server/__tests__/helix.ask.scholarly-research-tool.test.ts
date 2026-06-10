import { describe, expect, it } from "vitest";
import {
  HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
} from "@shared/helix-scholarly-research-observation";
import { HELIX_INTERNET_SEARCH_CAPABILITY } from "@shared/helix-internet-search-observation";
import { arbitrateAskSourceTarget } from "../services/helix-ask/ask-source-target-arbitrator";
import { buildCapabilityPlan } from "../services/helix-ask/capability-planner";
import { buildCapabilityResultGate } from "../services/helix-ask/capability-result-gate";
import { evaluateFinalAnswerDraftQualityGate } from "../services/helix-ask/final-answer-draft-quality-gate";
import { buildRouteProductContract } from "../services/helix-ask/route-product-contract";
import { buildToolCallAdmissionDecision } from "../services/helix-ask/tool-call-admission";
import {
  __testHelixAgentStepRepairHints,
  __testHelixGoalSatisfaction,
  __testHelixRuntimeToolCallValidation,
  __testHelixScholarlyTerminalAuthorityRefresh,
  __testHelixScholarlyFinalFallback,
} from "../routes/agi.plan";
import {
  runScholarlyResearchLookup,
  type ScholarlyFetch,
} from "../services/helix-ask/retrieval/scholarly-research-lookup";
import { runScholarlyFullTextFetch } from "../services/helix-ask/retrieval/scholarly-full-text-fetch";

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
  it("rejects empty scholarly runtime tool args instead of falling back to the full prompt", () => {
    const availableCapabilities = {
      schema: "helix.available_capabilities.v1",
      turn_id: "ask:scholarly-validation",
      tool_admission_suppressed: false,
      capabilities: [
        {
          capability_key: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
          requires_action: true,
          availability: "available",
          goal_fit: "primary",
        },
        {
          capability_key: HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
          requires_action: true,
          availability: "available",
          goal_fit: "primary",
        },
      ],
    } as any;

    const emptyLookup = __testHelixRuntimeToolCallValidation.validateHelixRuntimeToolCall({
      availableCapabilities,
      call: {
        schema: "helix.runtime_tool_call.v1",
        turn_id: "ask:scholarly-validation",
        call_id: "call:lookup-empty",
        capability_key: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        args: {},
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(emptyLookup.validation.valid).toBe(false);
    expect(emptyLookup.validation.args_valid).toBe(false);
    expect(emptyLookup.validation.errors).toContain("missing_required_arg:query_or_identifier");

    const emptyFullText = __testHelixRuntimeToolCallValidation.validateHelixRuntimeToolCall({
      availableCapabilities,
      call: {
        schema: "helix.runtime_tool_call.v1",
        turn_id: "ask:scholarly-validation",
        call_id: "call:full-text-empty",
        capability_key: HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
        args: {},
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(emptyFullText.validation.valid).toBe(false);
    expect(emptyFullText.validation.args_valid).toBe(false);
    expect(emptyFullText.validation.errors).toContain("missing_required_arg:paper_result_or_source");

    const exactLookup = __testHelixRuntimeToolCallValidation.validateHelixRuntimeToolCall({
      availableCapabilities,
      call: {
        schema: "helix.runtime_tool_call.v1",
        turn_id: "ask:scholarly-validation",
        call_id: "call:lookup-arxiv",
        capability_key: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        args: { arxiv_id: "1402.3952" },
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(exactLookup.validation.valid).toBe(true);

    const selectedPaperFetch = __testHelixRuntimeToolCallValidation.validateHelixRuntimeToolCall({
      availableCapabilities,
      call: {
        schema: "helix.runtime_tool_call.v1",
        turn_id: "ask:scholarly-validation",
        call_id: "call:full-text-result",
        capability_key: HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
        args: { paper_result_id: "arxiv:1402.3952" },
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(selectedPaperFetch.validation.valid).toBe(true);
  });

  it("rejects runtime tool calls outside the admitted tool family", () => {
    const availableCapabilities = {
      schema: "helix.available_capabilities.v1",
      turn_id: "ask:runtime-admission-gate",
      tool_admission_suppressed: false,
      capabilities: [
        {
          capability_key: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
          requires_action: true,
          availability: "available",
          goal_fit: "primary",
        },
        {
          capability_key: "docs-viewer.locate_in_doc",
          requires_action: true,
          availability: "available",
          goal_fit: "primary",
        },
      ],
    } as any;
    const docsOnlyAdmission = {
      schema: "helix.tool_call_admission_decision.v1",
      turn_id: "ask:runtime-admission-gate",
      source_target: "docs_viewer",
      required: true,
      admitted_tool_families: ["docs_viewer"],
      forbidden_terminal_artifact_kinds: [],
      forbidden_routes: [],
      reason: "docs_viewer_requires_document_tool_path",
      assistant_answer: false,
      raw_content_included: false,
    };

    const rejectedScholarlyLookup = __testHelixRuntimeToolCallValidation.validateHelixRuntimeToolCall({
      availableCapabilities,
      toolCallAdmissionDecision: docsOnlyAdmission,
      call: {
        schema: "helix.runtime_tool_call.v1",
        turn_id: "ask:runtime-admission-gate",
        call_id: "call:scholarly-under-docs-policy",
        capability_key: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        args: { query: "NHM2 theory white paper" },
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(rejectedScholarlyLookup.validation.valid).toBe(false);
    expect(rejectedScholarlyLookup.validation.errors).toContain(
      `runtime_capability_not_admitted_by_tool_policy:${HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY}:scholarly_research`,
    );

    const admittedDocsLocate = __testHelixRuntimeToolCallValidation.validateHelixRuntimeToolCall({
      availableCapabilities,
      toolCallAdmissionDecision: docsOnlyAdmission,
      call: {
        schema: "helix.runtime_tool_call.v1",
        turn_id: "ask:runtime-admission-gate",
        call_id: "call:docs-under-docs-policy",
        capability_key: "docs-viewer.locate_in_doc",
        args: { query: "NHM2 theory white paper" },
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(admittedDocsLocate.validation.valid).toBe(true);
  });

  it("admits unknown artifact requests to bounded read-only discovery without external research tools", () => {
    const unknownIntent = {
      schema: "helix.ask_source_target_intent.v1",
      turn_id: "ask:unknown-source-discovery",
      target_source: "unknown",
      target_kind: "unknown",
      requested_outputs: [],
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
      confidence: "low",
      precedence_reason: "ambiguous_source_target",
      reasons: ["test"],
      suppressed_routes: [],
      assistant_answer: false,
      raw_content_included: false,
    };
    const admission = buildToolCallAdmissionDecision({
      turnId: "ask:unknown-source-discovery",
      promptText: "find NHM2 theory white paper",
      sourceTargetIntent: unknownIntent,
    });

    expect(admission).toMatchObject({
      source_target: "unknown",
      admission_mode: "unknown_source_discovery",
      required: true,
      reason: "unknown_source_artifact_request_requires_bounded_readonly_discovery",
    });
    expect(admission.admitted_tool_families).toEqual(
      expect.arrayContaining(["workspace_directory", "docs_viewer", "repo_code", "runtime_evidence"]),
    );
    expect(admission.forbidden_tool_families).toEqual(
      expect.arrayContaining(["scholarly_research", "internet_search"]),
    );
    expect(admission.discovery_policy).toMatchObject({
      state: "bounded_readonly",
      on_not_found: "ask_or_explain_searched_scope",
    });

    const availableCapabilities = {
      schema: "helix.available_capabilities.v1",
      turn_id: "ask:unknown-source-discovery",
      tool_admission_suppressed: false,
      capabilities: [
        {
          capability_key: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
          requires_action: true,
          availability: "available",
          goal_fit: "primary",
        },
        {
          capability_key: HELIX_INTERNET_SEARCH_CAPABILITY,
          requires_action: true,
          availability: "available",
          goal_fit: "primary",
        },
        {
          capability_key: "workspace-directory.resolve",
          requires_action: true,
          availability: "available",
          goal_fit: "primary",
        },
        {
          capability_key: "docs-viewer.search_docs",
          requires_action: true,
          availability: "available",
          goal_fit: "primary",
        },
        {
          capability_key: "docs-viewer.open_doc_by_path",
          requires_action: true,
          availability: "available",
          goal_fit: "primary",
        },
        {
          capability_key: "repo-code.search_concept",
          requires_action: true,
          availability: "available",
          goal_fit: "primary",
        },
      ],
    } as any;

    const admittedWorkspaceDirectoryResolve = __testHelixRuntimeToolCallValidation.validateHelixRuntimeToolCall({
      availableCapabilities,
      toolCallAdmissionDecision: admission,
      call: {
        schema: "helix.runtime_tool_call.v1",
        turn_id: "ask:unknown-source-discovery",
        call_id: "call:workspace-directory",
        capability_key: "workspace-directory.resolve",
        args: { query: "NHM2 theory white paper" },
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(admittedWorkspaceDirectoryResolve.validation.valid).toBe(true);

    const admittedDocsSearch = __testHelixRuntimeToolCallValidation.validateHelixRuntimeToolCall({
      availableCapabilities,
      toolCallAdmissionDecision: admission,
      call: {
        schema: "helix.runtime_tool_call.v1",
        turn_id: "ask:unknown-source-discovery",
        call_id: "call:docs-search",
        capability_key: "docs-viewer.search_docs",
        args: { query: "NHM2 theory white paper" },
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(admittedDocsSearch.validation.valid).toBe(true);

    const rejectedDocOpen = __testHelixRuntimeToolCallValidation.validateHelixRuntimeToolCall({
      availableCapabilities,
      toolCallAdmissionDecision: admission,
      call: {
        schema: "helix.runtime_tool_call.v1",
        turn_id: "ask:unknown-source-discovery",
        call_id: "call:docs-open",
        capability_key: "docs-viewer.open_doc_by_path",
        args: { path: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md" },
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(rejectedDocOpen.validation.valid).toBe(false);
    expect(rejectedDocOpen.validation.errors).toContain(
      "runtime_tool_forbidden_by_tool_policy:docs-viewer.open_doc_by_path",
    );

    const admittedRepoSearch = __testHelixRuntimeToolCallValidation.validateHelixRuntimeToolCall({
      availableCapabilities,
      toolCallAdmissionDecision: admission,
      call: {
        schema: "helix.runtime_tool_call.v1",
        turn_id: "ask:unknown-source-discovery",
        call_id: "call:repo-search",
        capability_key: "repo-code.search_concept",
        args: { query: "NHM2 theory white paper" },
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(admittedRepoSearch.validation.valid).toBe(true);

    const rejectedScholarlyLookup = __testHelixRuntimeToolCallValidation.validateHelixRuntimeToolCall({
      availableCapabilities,
      toolCallAdmissionDecision: admission,
      call: {
        schema: "helix.runtime_tool_call.v1",
        turn_id: "ask:unknown-source-discovery",
        call_id: "call:scholarly-search",
        capability_key: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        args: { query: "NHM2 theory white paper" },
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(rejectedScholarlyLookup.validation.valid).toBe(false);
    expect(rejectedScholarlyLookup.validation.errors).toContain(
      `runtime_capability_family_forbidden_by_tool_policy:${HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY}:scholarly_research`,
    );

    const rejectedInternetSearch = __testHelixRuntimeToolCallValidation.validateHelixRuntimeToolCall({
      availableCapabilities,
      toolCallAdmissionDecision: admission,
      call: {
        schema: "helix.runtime_tool_call.v1",
        turn_id: "ask:unknown-source-discovery",
        call_id: "call:internet-search",
        capability_key: HELIX_INTERNET_SEARCH_CAPABILITY,
        args: { query: "NHM2 theory white paper" },
        assistant_answer: false,
        raw_content_included: false,
      },
    });
    expect(rejectedInternetSearch.validation.valid).toBe(false);
    expect(rejectedInternetSearch.validation.errors).toContain(
      `runtime_capability_family_forbidden_by_tool_policy:${HELIX_INTERNET_SEARCH_CAPABILITY}:internet_search`,
    );
  });

  it("re-enters rejected scholarly args as compact repair hints for the model step", () => {
    const hints = __testHelixAgentStepRepairHints.buildHelixAgentStepInvalidArgsHintSummary([
      {
        artifact_id: "call:lookup-empty",
        turn_id: "ask:scholarly-validation",
        producer_item_id: "agent_runtime_tool_executor",
        kind: "runtime_tool_call",
        created_at_ms: 1,
        source_scope: "current_turn",
        goal_hash: "test",
        payload: {
          schema: "helix.runtime_tool_call.v1",
          turn_id: "ask:scholarly-validation",
          call_id: "call:lookup-empty",
          capability_key: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
          args: {},
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: "call:lookup-empty:runtime_tool_call_validation",
        turn_id: "ask:scholarly-validation",
        producer_item_id: "agent_runtime_tool_executor",
        kind: "runtime_tool_call_validation",
        created_at_ms: 2,
        source_scope: "current_turn",
        goal_hash: "test",
        payload: {
          schema: "helix.runtime_tool_call_validation.v1",
          turn_id: "ask:scholarly-validation",
          call_id: "call:lookup-empty",
          capability_key: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
          valid: false,
          errors: ["missing_required_arg:query_or_identifier"],
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: "call:lookup-empty:runtime_tool_observation",
        turn_id: "ask:scholarly-validation",
        producer_item_id: "agent_runtime_tool_executor",
        kind: "runtime_tool_observation",
        created_at_ms: 3,
        source_scope: "current_turn",
        goal_hash: "test",
        payload: {
          schema: "helix.runtime_tool_observation.v1",
          turn_id: "ask:scholarly-validation",
          call_id: "call:lookup-empty",
          capability_key: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
          status: "invalid_args",
          summary: "Runtime tool call rejected before execution: missing_required_arg:query_or_identifier.",
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ] as any);

    expect(hints).toHaveLength(1);
    expect(hints[0]).toMatchObject({
      capability_key: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      attempted_args: {},
      validation_errors: ["missing_required_arg:query_or_identifier"],
      occurrence_count: 1,
      latest_call_id: "call:lookup-empty",
    });
    expect(hints[0]?.repair_instruction).toContain("query");
    expect(hints[0]?.repair_instruction).toContain("user goal");
  });

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
      ["Do not fetch the PDF for arXiv:2401.00001; just explain what arXiv is.", "negated_tool_instruction"],
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

  it("plans the explicit full-text capability for PDF and paper text requests", () => {
    const promptText = "Do research: fetch the PDF/full text for arXiv:2401.00001 and extract the methods section.";
    const sourceTargetIntent = arbitrateAskSourceTarget({
      turnId: "ask:scholarly-full-text",
      threadId: "helix-ask:test",
      promptText,
    });
    expect(sourceTargetIntent).toMatchObject({
      target_source: "scholarly_research",
      target_kind: "scholarly_research",
      must_enter_backend_ask: true,
      allow_no_tool_direct: false,
    });
    expect(sourceTargetIntent.requested_outputs).toEqual(expect.arrayContaining([
      "scholarly_full_text",
      "paper_pdf_pages",
      "typed_failure",
    ]));

    const toolAdmission = buildToolCallAdmissionDecision({
      turnId: "ask:scholarly-full-text",
      sourceTargetIntent,
      routeProductContract: buildRouteProductContract({
        turnId: "ask:scholarly-full-text",
        threadId: "helix-ask:test",
        sourceTargetIntent,
        promptText,
      }),
      promptText,
    });
    const plan = buildCapabilityPlan({
      turnId: "ask:scholarly-full-text",
      promptText,
      sourceTargetIntent,
      toolCallAdmissionDecision: toolAdmission,
      canonicalGoalFrame: canonicalGoal("scholarly_research_lookup", "scholarly_research_answer"),
    });
    expect(plan).toMatchObject({
      capability_family: "scholarly_research",
      requested_action: HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
      source_target: "scholarly_research",
      admission_status: "needs_evidence",
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("marks scholarly lookup plus full-text observations satisfied before terminal synthesis", () => {
    const turnId = "ask:scholarly-full-text-satisfaction";
    const promptText = "Do research: fetch the PDF/full text for arXiv:1706.03762 and extract the model architecture details.";
    const evaluation = __testHelixGoalSatisfaction.buildHelixGoalSatisfactionEvaluation({
      turnId,
      transcript: promptText,
      canonicalGoalFrame: {
        ...canonicalGoal("scholarly_research_lookup", "scholarly_research_answer"),
        turn_id: turnId,
        corpus_anchors: ["1706.03762"],
        concept_tokens: ["paper_search", "arxiv_id", "scholarly_full_text_or_pdf"],
      },
      currentTurnArtifacts: [
        {
          artifact_id: `${turnId}:lookup:scholarly_research_observation`,
          turn_id: turnId,
          producer_item_id: "agent_runtime_scholarly_research_tool",
          kind: "scholarly_research_observation",
          created_at_ms: 1,
          source_scope: "current_turn",
          payload: {
            schema: "helix.scholarly_research_observation.v1",
            capability: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
            papers: [{ result_id: "arxiv:1706.03762", title: "Attention Is All You Need" }],
            evidence_refs: ["arxiv:1706.03762"],
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: `${turnId}:full-text:scholarly_full_text_observation`,
          turn_id: turnId,
          producer_item_id: "agent_runtime_scholarly_research_tool",
          kind: "scholarly_full_text_observation",
          created_at_ms: 2,
          source_scope: "current_turn",
          payload: {
            schema: "helix.scholarly_full_text_observation.v1",
            capability: HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
            paper_result_id: "arxiv:1706.03762",
            selected_for_answer: true,
            selected_chunks: [{ chunk_ref: "page:2#chunk:1", page_start: 2, text_excerpt: "The Transformer uses encoder and decoder stacks." }],
            page_text_refs: ["page:2#text"],
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ] as any,
      satisfactionReport: {
        satisfied: false,
        terminal_kind: "final_failure",
        terminal_source: "typed_failure",
        missing_artifacts: ["scholarly_research_answer"],
        missing_reason: "terminal_artifact_unavailable",
        confidence: "medium",
        rejected_terminal_candidates: [],
      } as any,
    });

    expect(evaluation.terminal_contract.required_actions).toEqual([
      HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
    ]);
    expect(evaluation.required_actions.every((action) => action.satisfied)).toBe(true);
    expect(evaluation.required_evidence.every((evidence) => evidence.satisfied)).toBe(true);
    expect(evaluation.satisfaction).toBe("satisfied");
    expect(evaluation.next_decision).toBe("allow_terminal");
    expect(evaluation.observed_results.filter((result) => result.supports_goal).map((result) => result.kind)).toEqual([
      "scholarly_research_observation",
      "scholarly_full_text_observation",
    ]);
  });

  it("keeps failed zero-chunk full-text observations from satisfying page-evidence requirements", () => {
    const turnId = "ask:scholarly-full-text-403";
    const promptText = "Do research: fetch a Hawking radiation paper with PDF/full text and summarize it with page evidence.";
    const evaluation = __testHelixGoalSatisfaction.buildHelixGoalSatisfactionEvaluation({
      turnId,
      transcript: promptText,
      canonicalGoalFrame: {
        ...canonicalGoal("scholarly_research_lookup", "scholarly_research_answer"),
        turn_id: turnId,
        concept_tokens: ["paper_search", "scholarly_full_text_or_pdf"],
      },
      currentTurnArtifacts: [
        {
          artifact_id: `${turnId}:lookup:scholarly_research_observation`,
          turn_id: turnId,
          producer_item_id: "agent_runtime_scholarly_research_tool",
          kind: "scholarly_research_observation",
          created_at_ms: 1,
          source_scope: "current_turn",
          payload: {
            schema: "helix.scholarly_research_observation.v1",
            capability: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
            selected_for_answer: true,
            papers: [{ result_id: "openalex:hawking-radiation", title: "Particle Creation by Black Holes" }],
            evidence_refs: ["openalex:hawking-radiation"],
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: `${turnId}:full-text:scholarly_full_text_observation`,
          turn_id: turnId,
          producer_item_id: "agent_runtime_scholarly_research_tool",
          kind: "scholarly_full_text_observation",
          created_at_ms: 2,
          source_scope: "current_turn",
          payload: {
            schema: "helix.scholarly_full_text_observation.v1",
            capability: HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
            paper_result_id: "openalex:hawking-radiation",
            selected_for_answer: false,
            selected_chunks: [],
            pages_parsed: 0,
            missing_requirements: ["full_text_http_403"],
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: `${turnId}:full-text:runtime_tool_observation`,
          turn_id: turnId,
          producer_item_id: "agent_runtime_tool_executor",
          kind: "runtime_tool_observation",
          created_at_ms: 3,
          source_scope: "current_turn",
          payload: {
            schema: "helix.runtime_tool_observation.v1",
            capability_key: HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
            call_id: "call:full-text-403",
            status: "failed",
            summary: "Full text fetch failed: HTTP 403.",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ] as any,
      satisfactionReport: {
        satisfied: false,
        terminal_kind: "final_failure",
        terminal_source: "typed_failure",
        missing_artifacts: ["scholarly_full_text_observation", "scholarly_research_answer"],
        missing_reason: "scholarly_full_text_unavailable",
        confidence: "high",
        rejected_terminal_candidates: [],
      } as any,
    });

    const lookupAction = evaluation.required_actions.find((action) => action.action_key === HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY);
    const fullTextAction = evaluation.required_actions.find((action) => action.action_key === HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY);
    const lookupEvidence = evaluation.required_evidence.find((evidence) => evidence.kind === "scholarly_research_observation");
    const fullTextEvidence = evaluation.required_evidence.find((evidence) => evidence.kind === "scholarly_full_text_observation");
    const failedFullTextObservation = evaluation.observed_results.find(
      (result) => result.ref === `${turnId}:full-text:scholarly_full_text_observation`,
    );

    expect(lookupAction?.satisfied).toBe(true);
    expect(lookupEvidence?.satisfied).toBe(true);
    expect(fullTextAction?.satisfied).toBe(false);
    expect(fullTextEvidence?.satisfied).toBe(false);
    expect(evaluation.satisfaction).toBe("partially_satisfied");
    expect(failedFullTextObservation?.supports_goal).toBe(false);
  });

  it("builds a scholarly fallback draft from compact full-text evidence and rejects retry boilerplate", () => {
    const turnId = "ask:scholarly-fallback";
    const artifacts = [
      {
        artifact_id: `${turnId}:lookup:scholarly_research_observation`,
        turn_id: turnId,
        producer_item_id: "agent_runtime_scholarly_research_tool",
        kind: "scholarly_research_observation",
        created_at_ms: 1,
        source_scope: "current_turn",
        payload: {
          schema: "helix.scholarly_research_observation.v1",
          capability: HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
          papers: [{
            result_id: "arxiv:1706.03762",
            title: "Attention Is All You Need",
            year: 2017,
            authors: [{ name: "Ashish Vaswani" }, { name: "Noam Shazeer" }],
            identifiers: { arxiv_id: "1706.03762" },
          }],
          evidence_refs: ["arxiv:1706.03762"],
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: `${turnId}:full-text:scholarly_full_text_observation`,
        turn_id: turnId,
        producer_item_id: "agent_runtime_scholarly_research_tool",
        kind: "scholarly_full_text_observation",
        created_at_ms: 2,
        source_scope: "current_turn",
        payload: {
          schema: "helix.scholarly_full_text_observation.v1",
          capability: HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
          selected_chunks: [{
            chunk_ref: "arxiv:1706.03762:p2:c1",
            page_start: 2,
            source_text_ref: "arxiv:1706.03762:p2#text",
            text_excerpt: "The Transformer uses stacked self-attention and point-wise fully connected layers for both the encoder and decoder.",
          }],
          page_text_refs: [{ text_ref: "arxiv:1706.03762:p2#text" }],
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ] as any;

    const fallbackText = __testHelixScholarlyFinalFallback.buildHelixScholarlyResearchFallbackText({
      prompt: "Do research: fetch the PDF/full text and extract architecture details.",
      artifacts,
    });
    expect(fallbackText).toContain("Attention Is All You Need");
    expect(fallbackText).toContain("Relevant PDF/full-text excerpts");
    expect(fallbackText).toContain("stacked self-attention");
    expect(fallbackText).toContain("arxiv:1706.03762:p2:c1");

    const qualityGate = evaluateFinalAnswerDraftQualityGate({
      turnId,
      finalAnswerDraftRef: `${turnId}:final_answer_draft`,
      draftText: "I couldn't produce a final answer for that turn. Please retry once.",
      payload: {
        canonical_goal_frame: canonicalGoal("scholarly_research_lookup", "scholarly_research_answer"),
      },
      artifactLedger: artifacts,
    });
    expect(qualityGate.ok).toBe(false);
    expect(qualityGate.violations).toContain("fallback_like_answer");
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

  it("pins explicit arXiv identifiers to exact arXiv-capable results", async () => {
    const arxivXml = `<?xml version="1.0" encoding="UTF-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <entry>
          <id>http://arxiv.org/abs/1706.03762</id>
          <updated>2023-08-02T00:00:00Z</updated>
          <published>2017-06-12T00:00:00Z</published>
          <title>Attention Is All You Need</title>
          <summary>The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.</summary>
          <author><name>Ashish Vaswani</name></author>
        </entry>
      </feed>`;
    const fetchImpl: ScholarlyFetch = async (url) => {
      if (url.includes("api.openalex.org")) {
        throw new Error("broad OpenAlex search should not run for an explicit arXiv ID");
      }
      if (url.includes("export.arxiv.org")) {
        expect(url).toContain("id_list=1706.03762");
        return { ok: true, status: 200, text: async () => arxivXml };
      }
      if (url.includes("api.semanticscholar.org")) {
        expect(url).toContain("ARXIV:1706.03762");
        return { ok: false, status: 404, json: async () => ({}) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    };

    const observation = await runScholarlyResearchLookup({
      turnId: "ask:scholarly-exact-arxiv",
      callId: "call:scholarly-exact-arxiv",
      query: "Do research: fetch the PDF/full text for arXiv:1706.03762.",
      providers: ["openalex", "arxiv", "semantic_scholar"],
      limit: 8,
      fetchImpl,
    });

    expect(observation.providers_called).toEqual(["arxiv", "semantic_scholar"]);
    expect(observation.papers).toHaveLength(1);
    expect(observation.papers[0]).toMatchObject({
      title: "Attention Is All You Need",
      identifiers: {
        arxiv_id: "1706.03762",
        pdf_url: "https://arxiv.org/pdf/1706.03762.pdf",
        full_text_url: "http://arxiv.org/abs/1706.03762",
      },
      source_providers: ["arxiv"],
      confidence: "high",
    });
  });

  it("fetches a selected PDF source and returns compact page chunks without answer authority", async () => {
    const bytes = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55]);
    const observation = await runScholarlyFullTextFetch({
      turnId: "ask:scholarly-full-text-service",
      callId: "call:scholarly-full-text",
      query: "extract methods and results for warp field mechanics",
      paper: {
        result_id: "arxiv:warp-field-mechanics",
        title: "Warp Field Mechanics 101",
        authors: [{ name: "Harold White" }],
        year: 2011,
        identifiers: {
          arxiv_id: "2401.00001",
          pdf_url: "https://arxiv.org/pdf/2401.00001.pdf",
        },
        evidence_refs: ["arxiv:2401.00001"],
        source_providers: ["arxiv"],
        confidence: "high",
      },
      cachePdf: false,
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        headers: { get: () => "application/pdf" },
        arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      }),
      extractPdfTextImpl: async () => ({
        totalPages: 3,
        pages: [
          { page: 1, text: "Abstract. Warp field mechanics are summarized here." },
          { page: 2, text: "Methods. The paper derives a compact field metric and extraction procedure." },
          { page: 3, text: "Results. The model reports constraints and caveats for the proposed field." },
        ],
      }),
      maxPages: 3,
      maxChunks: 2,
    });

    expect(observation).toMatchObject({
      schema: "helix.scholarly_full_text_observation.v1",
      artifact_id: "call:scholarly-full-text:scholarly_full_text_observation",
      capability: HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
      source_kind: "pdf",
      pages_parsed: 3,
      selected_for_answer: true,
      assistant_answer: false,
      raw_content_included: false,
      context_policy: "compact_context_pack_only",
    });
    expect(observation.source_pdf_ref).toMatch(/^artifact:\/\/scholarly-pdf\//);
    expect(observation.page_text_refs).toHaveLength(3);
    expect(observation.selected_chunks).toHaveLength(2);
    expect(observation.selected_chunks[0]).toMatchObject({
      page_start: expect.any(Number),
      text_excerpt: expect.any(String),
      source_text_ref: expect.stringContaining("#text"),
    });
    expect(observation.selected_chunks[0].text_excerpt.length).toBeLessThanOrEqual(1400);
  });

  it("refreshes stale fail-closed debug after scholarly terminal materialization", () => {
    const turnId = "ask:scholarly-terminal-refresh";
    const lookupRef = `${turnId}:lookup`;
    const fullTextRef = `${turnId}:full_text`;
    const terminalText = [
      "Hawking radiation is commonly framed as quantum field emission associated with black-hole horizons.",
      "The fetched full-text evidence supports the answer from the selected PDF chunks.",
      "",
      "Citations",
      "- [Hawking Radiation As Tunneling](https://arxiv.org/pdf/hep-th/9907001.pdf) (PDF/full text; 5 parsed pages)",
    ].join("\n");
    const artifacts = [
      {
        artifact_id: lookupRef,
        turn_id: turnId,
        kind: "scholarly_research_observation",
        source_scope: "current_turn",
        payload: {
          schema: "helix.scholarly_research_observation.v1",
          papers: [{
            result_id: "arxiv:hep-th/9907001",
            title: "Hawking Radiation As Tunneling",
            identifiers: { arxiv_id: "hep-th/9907001", pdf_url: "https://arxiv.org/pdf/hep-th/9907001.pdf" },
          }],
        },
      },
      {
        artifact_id: fullTextRef,
        turn_id: turnId,
        kind: "scholarly_full_text_observation",
        source_scope: "current_turn",
        payload: {
          schema: "helix.scholarly_full_text_observation.v1",
          paper_result_id: "arxiv:hep-th/9907001",
          title: "Hawking Radiation As Tunneling",
          source_url: "https://arxiv.org/pdf/hep-th/9907001.pdf",
          pages_parsed: 5,
          selected_chunks: [{
            chunk_ref: "artifact://scholarly-pdf/hawking/page/1#chunk/1",
            source_text_ref: "artifact://scholarly-pdf/hawking/page/1#text",
            text_excerpt: "Hawking radiation can be described as tunneling across the horizon.",
          }],
          page_text_refs: ["artifact://scholarly-pdf/hawking/page/1#text"],
        },
      },
    ];
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      thread_id: "thread:test",
      active_prompt: "Use scholarly research papers about Hawking radiation and cite the references.",
      canonical_goal_frame: {
        ...canonicalGoal("scholarly_research_lookup", "scholarly_research_answer"),
        turn_id: turnId,
      },
      current_turn_artifact_ledger: artifacts,
      source_target_intent: {
        schema: "helix.ask_source_target_intent.v1",
        turn_id: turnId,
        thread_id: "thread:test",
        target_source: "scholarly_research",
        target_kind: "scholarly_research_lookup",
        strength: "hard",
        requested_outputs: ["scholarly_research_answer"],
        must_enter_backend_ask: true,
        allow_client_shortcut: false,
        allow_no_tool_direct: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer_result.v1",
        selected_terminal_artifact_kind: "scholarly_research_answer",
        visible_text: terminalText,
        source: "final_answer_draft",
      },
      scholarly_research_answer: {
        schema: "helix.scholarly_research_answer.v1",
        artifact_id: `${turnId}:scholarly_research_answer`,
        answer_text: terminalText,
        text: terminalText,
        support_refs: [lookupRef, fullTextRef],
      },
      terminal_artifact_id: `${turnId}:scholarly_research_answer`,
      terminal_artifact_kind: "scholarly_research_answer",
      final_answer_source: "final_answer_draft",
      selected_final_answer: terminalText,
      answer: terminalText,
      text: terminalText,
      final_status: "final_answer",
      response_type: "final_answer",
      route_authority_audit: {
        schema: "helix.route_authority_audit.v1",
        terminal_artifact_kind: "model_synthesized_answer",
        route_authority_ok: false,
        route_authority_violation_code: "terminal_product_authority_mismatch",
      },
      solver_controller_decision: {
        schema: "helix.solver_controller_decision.v1",
        decision: "fail_closed",
        selected_terminal_artifact_kind: "model_synthesized_answer",
        blocking_reasons: ["route_authority_failed"],
      },
      agent_runtime_loop: {
        iterations: [
          {
            iteration: 1,
            decision_id: `${turnId}:agent-step:1`,
            next_step: "next_action",
            chosen_capability: "scholarly-research.lookup_papers",
            decision_authority: "llm",
            observed_artifact_refs: [lookupRef],
          },
          {
            iteration: 2,
            decision_id: `${turnId}:agent-step:2`,
            next_step: "next_action",
            chosen_capability: "scholarly-research.fetch_full_text",
            decision_authority: "llm",
            observed_artifact_refs: [fullTextRef],
          },
          {
            iteration: 3,
            decision_id: `${turnId}:agent-step:3`,
            next_step: "answer",
            chosen_capability: "model.synthesize_from_scholarly_research",
            decision_authority: "llm",
            decision_timing: "post_observation",
          },
        ],
      },
      agent_step_decision: {
        decision_id: `${turnId}:agent-step:3`,
        next_step: "answer",
        chosen_capability: "model.synthesize_from_scholarly_research",
        decision_authority: "llm",
        decision_timing: "post_observation",
      },
      goal_satisfaction_evaluation: {
        schema: "helix.goal_satisfaction_evaluation.v1",
        turn_id: turnId,
        canonical_goal_kind: "scholarly_research_lookup",
        required_terminal_kind: "scholarly_research_answer",
        terminal_contract: {
          goal_kind: "scholarly_research_lookup",
          required_terminal_kinds: ["scholarly_research_answer"],
          acceptable_fallbacks: [],
          forbidden_terminal_kinds: ["direct_answer_text", "model_synthesized_answer"],
        },
        required_actions: [],
        required_evidence: [],
        observed_results: [],
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
        assistant_answer: false,
        raw_content_included: false,
      },
      debug: {
        terminal_artifact_kind: "model_synthesized_answer",
        final_answer_source: "typed_failure",
        solver_controller_decision: {
          decision: "fail_closed",
          blocking_reasons: ["route_authority_failed"],
        },
      },
    };

    const refreshed = __testHelixScholarlyTerminalAuthorityRefresh.refreshScholarlyTerminalAuthorityAfterMaterialization({
      payload,
      threadId: "thread:test",
      turnId,
      route: "scholarly_research_lookup",
      prompt: "Use scholarly research papers about Hawking radiation and cite the references.",
    });

    expect(refreshed).toBe(true);
    expect(payload.route_authority_audit).toMatchObject({
      terminal_artifact_kind: "scholarly_research_answer",
      route_authority_ok: true,
    });
    expect(payload.terminal_consistency_check).toMatchObject({
      selected_terminal_kind: "scholarly_research_answer",
      consistent: true,
    });
    expect(payload.solver_controller_decision).toMatchObject({
      decision: "allow_terminal",
      selected_terminal_artifact_kind: "scholarly_research_answer",
      blocking_reasons: [],
    });
    expect(payload.terminal_equivalence_harness_result).toMatchObject({ ok: true });
    expect(payload.debug).toMatchObject({
      terminal_artifact_kind: "scholarly_research_answer",
      final_answer_source: "final_answer_draft",
      solver_controller_decision: expect.objectContaining({
        decision: "allow_terminal",
        selected_terminal_artifact_kind: "scholarly_research_answer",
      }),
    });
  });
});
