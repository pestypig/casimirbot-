import { describe, expect, it } from "vitest";

import {
  applyGatewayFailureAuthorityGuard,
  buildCodexMoralGraphReflectionReceiptAnswer,
  buildMoralGraphObservationFallbackAnswer,
} from "../codex-provider";

const buildScholarlyNumericMissingResult = () => ({
  ok: false,
  capability_id: "scholarly-research.extract_numeric_parameters",
  gateway_admission: {
    requested_capability: "scholarly-research.extract_numeric_parameters",
    admission_reason: "scholarly_numeric_extraction_requested",
  },
  observation_packet: {
    status: "failed",
    produced_artifact_refs: ["ask:scholarly:numeric:missing-vars"],
    observation_summary: "Numeric extraction found missing requested variables.",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
  },
  observation: {
    schema: "helix.scholarly_numeric_parameter_observation.v1",
    missing_requirements: ["missing_requested_numeric_variables"],
    requested_variables: ["n_m3", "B_T"],
    missing_variables: ["B_T"],
    scholarly_numeric_recovery_affordance: {
      schema: "helix.scholarly_numeric_recovery_affordance.v1",
      status: "available",
      reason: "missing_requested_numeric_variables",
      recommended_next_capability: "scholarly-research.lookup_papers",
      missing_variables: ["B_T"],
      recovery_queries: ["tokamak toroidal magnetic field parameter table B_T"],
      assistant_answer: false,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      raw_content_included: false,
    },
    selected_for_answer: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  artifact_refs: ["ask:scholarly:numeric:missing-vars"],
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
  error: "missing_requested_numeric_variables",
});

const buildCalculatorUnsupportedExpressionResult = () => ({
  ok: false,
  capability_id: "scientific-calculator.solve_expression",
  gateway_admission: {
    requested_capability: "scientific-calculator.solve_expression",
    admission_reason: "calculator_expression_blocked",
    blocked_reason: "unsupported_expression_syntax",
  },
  observation_packet: {
    status: "blocked",
    produced_artifact_refs: ["ask:calculator:blocked-expression"],
    observation_summary: "Calculator gateway blocked expression: unsupported_expression_syntax.",
    missing_requirements: [{
      code: "unsupported_expression_syntax",
      repair_action: "ask_user",
      rejected_expression: "explain why receipts matter",
      required_affordance_kind: "bound_calculator_expression",
    }],
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
  },
  observation: {
    schema: "helix.calculator_solve_observation.v1",
    capability_key: "scientific-calculator.solve_expression",
    expression: "explain why receipts matter",
    normalized_expression: "explain why receipts matter",
    rejected_expression: "explain why receipts matter",
    result: null,
    status: "blocked",
    blocked_reason: "unsupported_expression_syntax",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  },
  artifact_refs: ["ask:calculator:blocked-expression"],
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
  error: "unsupported_expression_syntax",
});

describe("Codex provider terminal pass-through", () => {
  it("does not overwrite Codex research explanation for scholarly numeric missing-variable observations", () => {
    const providerText =
      "I fetched the paper evidence and found density values, but the magnetic-field binding B_T was missing, so the calculator step cannot be completed from the retrieved text.";

    const guarded = applyGatewayFailureAuthorityGuard({
      text: providerText,
      gatewayCallResults: [buildScholarlyNumericMissingResult() as never],
    });

    expect(guarded).toBe(providerText);
    expect(guarded).not.toContain("I cannot claim the requested workstation tool or UI action ran");
    expect(guarded).not.toContain("This is a fail-closed evidence result");
  });

  it("preserves Codex recovery explanation for scholarly numeric recovery affordances", () => {
    const providerText =
      "The extraction reached the paper text, but B_T was still missing. I should re-query for a tokamak operating-parameter table with toroidal magnetic field before any calculator step.";

    const guarded = applyGatewayFailureAuthorityGuard({
      text: providerText,
      gatewayCallResults: [buildScholarlyNumericMissingResult() as never],
    });

    expect(guarded).toBe(providerText);
    expect(guarded).not.toContain("I cannot claim the requested workstation tool or UI action ran");
  });

  it("still blocks ordinary failed gateway requests from becoming final answer authority", () => {
    const guarded = applyGatewayFailureAuthorityGuard({
      text: "Codex says the tool succeeded.",
      gatewayCallResults: [
        {
          ok: false,
          capability_id: "scholarly-research.fetch_full_text",
          gateway_admission: {
            requested_capability: "scholarly-research.fetch_full_text",
            admission_reason: "scholarly_full_text_requested",
            blocked_reason: "fetchable_paper_identity_required",
          },
          observation_packet: {
            status: "failed",
            produced_artifact_refs: [],
          },
          observation: {},
          artifact_refs: [],
          terminal_eligible: false,
          post_tool_model_step_required: true,
          assistant_answer: false,
          raw_content_included: false,
          error: "fetchable_paper_identity_required",
        } as never,
      ],
    });

    expect(guarded).toContain("I cannot claim the requested workstation tool or UI action ran");
    expect(guarded).toContain("scholarly-research.fetch_full_text: fetchable_paper_identity_required");
  });

  it("preserves Moral Graph synthesis when adjacent external evidence is unavailable", () => {
    const providerText =
      "The Moral Graph observation supports purpose as inquiry and goalpost integrity as procedural lenses, but it does not prove the philosophy true.";

    const guarded = applyGatewayFailureAuthorityGuard({
      text: providerText,
      gatewayCallResults: [
        {
          ok: true,
          capability_id: "moral-graph.reflect_context",
          gateway_admission: {
            requested_capability: "moral-graph.reflect_context",
            admission_reason: "moral_graph_reflection_requested",
          },
          observation_packet: {
            status: "succeeded",
            produced_artifact_refs: ["ask:moral:reflection"],
            observation_summary: "Moral Graph reflection located procedural badges.",
            terminal_eligible: false,
            post_tool_model_step_required: true,
            assistant_answer: false,
          },
          observation: {
            schema: "helix.moral_graph_reflection_observation.v1",
            located_badge_ids: ["purpose-as-inquiry", "goalpost-integrity"],
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          artifact_refs: ["ask:moral:reflection"],
          terminal_eligible: false,
          post_tool_model_step_required: true,
          assistant_answer: false,
          raw_content_included: false,
        } as never,
        {
          ok: false,
          capability_id: "internet-search.search_web",
          gateway_admission: {
            requested_capability: "internet-search.search_web",
            admission_reason: "internet_search_requested",
            blocked_reason: "tavily_requires_TAVILY_API_KEY",
          },
          observation_packet: {
            status: "blocked",
            produced_artifact_refs: [],
            observation_summary: "Internet search unavailable: tavily_requires_TAVILY_API_KEY.",
            terminal_eligible: false,
            post_tool_model_step_required: true,
            assistant_answer: false,
          },
          observation: {
            schema: "helix.internet_search_observation.v1",
            status: "blocked",
            blocked_reason: "tavily_requires_TAVILY_API_KEY",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          },
          artifact_refs: [],
          terminal_eligible: false,
          post_tool_model_step_required: true,
          assistant_answer: false,
          raw_content_included: false,
          error: "tavily_requires_TAVILY_API_KEY",
        } as never,
      ],
    });

    expect(guarded).toContain(providerText);
    expect(guarded).toContain("External evidence unavailable: internet-search.search_web: tavily_requires_TAVILY_API_KEY.");
    expect(guarded).not.toContain("I cannot claim the requested workstation tool or UI action ran");
  });

  it("builds a bounded Moral Graph fallback answer from the reflection observation when provider text is absent", () => {
    const answer = buildMoralGraphObservationFallbackAnswer({
      promptText:
        "Use moral-graph.reflect_context. Reflect on delayed disclosure in a shared obligation. Identify the dependency, who needed the information, what deadline preserves agency, and what repair path should be considered. Do not use calculator, image, PDF, page, or web evidence.",
      normalizedArtifacts: [{
        artifact_id: "ask:moral:reflection",
        kind: "moral_graph_reflection",
        capability_key: "moral-graph.reflect_context",
        payload_schema: "helix.moral_graph_reflection_observation.v1",
        payload: {
          schema: "helix.moral_graph_reflection_observation.v1",
          located_badge_ids: [
            "dependency-transparency-gate",
            "agency-preserving-disclosure",
            "fallout-transfer-check",
          ],
          claim_boundary_notes: ["procedural reflection only; not a character verdict"],
          summary: "Moral Graph reflection located agency-preserving disclosure badges.",
        },
      }],
    });

    expect(answer).toContain("Dependency:");
    expect(answer).toContain("Who needs the information:");
    expect(answer).toContain("Agency-preserving deadline:");
    expect(answer).toContain("Repair path:");
    expect(answer).toContain("dependency-transparency-gate");
    expect(answer).not.toMatch(/calculator|PDF|web evidence|internet search/i);
  });

  it("materializes Moral Graph observations as route-approved synthesized answers", () => {
    const projection = buildCodexMoralGraphReflectionReceiptAnswer({
      turnId: "ask:test:moral-graph-receipt-answer",
      threadId: "helix-agent-provider",
      route: "/ask",
      promptText:
        "Use only the Moral Graph. Reflect on whether I should apologize after snapping at a coworker. Do not use web, papers, calculator, image, or PDF context.",
      normalizedArtifacts: [{
        artifact_id: "ask:test:moral-graph-receipt-answer:codex_normalized:moral_graph_reflection:1",
        kind: "moral_graph_reflection",
        capability_key: "moral-graph.reflect_context",
        payload_schema: "helix.moral_graph_reflection_observation.v1",
        payload: {
          schema: "helix.moral_graph_reflection_observation.v1",
          located_badge_ids: [
            "right-speech-and-accurate-formulation",
            "repair-before-justification",
          ],
          claim_boundary_notes: ["procedural reflection only; not a final moral verdict"],
          summary: "Moral Graph reflection located repair and accurate-formulation lenses.",
        },
      }],
    });

    expect(projection?.answer.answer_text).toContain("The Moral Graph treats this as");
    expect(projection?.answer.answer_text).toContain("Repair direction:");
    expect(projection?.answer.answer_text).not.toContain("Dependency:");
    expect(projection?.answer.support_refs).toContain(
      "ask:test:moral-graph-receipt-answer:codex_normalized:moral_graph_reflection:1",
    );
    expect(projection?.authority.terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(projection?.authority.final_answer_source).toBe("moral_graph_reflection_answer");
    expect(projection?.authority.terminal_item_id).toBe(
      "ask:test:moral-graph-receipt-answer:codex_moral_graph_reflection_answer",
    );
  });

  it("preserves Codex explanation for calculator expression syntax blocks", () => {
    const providerText =
      "The calculator request was admitted as a tool attempt, but the supplied expression was prose rather than a bound arithmetic expression, so no calculator result exists.";

    const guarded = applyGatewayFailureAuthorityGuard({
      text: providerText,
      gatewayCallResults: [buildCalculatorUnsupportedExpressionResult() as never],
    });

    expect(guarded).toBe(providerText);
    expect(guarded).not.toContain("I cannot claim the requested workstation tool or UI action ran");
    expect(guarded).toContain("no calculator result exists");
  });

  it("preserves Codex explanation for scholarly lookup recovery affordances", () => {
    const providerText =
      "The lookup was formula-aware, but the returned papers did not cover D-T fusion reactivity inputs. I should re-query for sigma-v and cross-section tables before any calculator step.";

    const guarded = applyGatewayFailureAuthorityGuard({
      text: providerText,
      gatewayCallResults: [
        {
          ok: true,
          capability_id: "scholarly-research.lookup_papers",
          gateway_admission: {
            requested_capability: "scholarly-research.lookup_papers",
            admission_reason: "read_only_gateway_capability",
          },
          observation_packet: {
            status: "succeeded",
            produced_artifact_refs: ["ask:scholarly:lookup:recovery"],
            observation_summary: "Scholarly lookup returned irrelevant papers and recovery query guidance.",
            terminal_eligible: false,
            post_tool_model_step_required: true,
            assistant_answer: false,
            state_delta: {
              scholarly_lookup_recovery_affordance: {
                schema: "helix.scholarly_lookup_recovery_affordance.v1",
                status: "available",
                recovery_queries: [{
                  query: "deuterium tritium fusion Maxwellian averaged reactivity sigma v cross section table",
                }],
                assistant_answer: false,
                terminal_eligible: false,
              },
            },
          },
          observation: {
            schema: "helix.scholarly_research_observation.v1",
            lookup_relevance_gate: {
              status: "blocked",
              code: "lookup_result_irrelevant",
            },
            scholarly_lookup_recovery_affordance: {
              schema: "helix.scholarly_lookup_recovery_affordance.v1",
              status: "available",
              assistant_answer: false,
              terminal_eligible: false,
            },
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
          artifact_refs: ["ask:scholarly:lookup:recovery"],
          terminal_eligible: false,
          post_tool_model_step_required: true,
          assistant_answer: false,
          raw_content_included: false,
        } as never,
      ],
    });

    expect(guarded).toBe(providerText);
    expect(guarded).not.toContain("I cannot claim the requested workstation tool or UI action ran");
  });

  it("preserves Codex explanation for scholarly full-text recovery affordances", () => {
    const providerText =
      "The formula-aware lookup ran, but the selected paper identity did not include a fetchable DOI, arXiv id, PDF URL, or full-text URL. I should re-query for an accessible fusion reactivity paper before extracting numerics.";

    const guarded = applyGatewayFailureAuthorityGuard({
      text: providerText,
      gatewayCallResults: [
        {
          ok: false,
          capability_id: "scholarly-research.fetch_full_text",
          gateway_admission: {
            requested_capability: "scholarly-research.fetch_full_text",
            admission_reason: "scholarly_full_text_requested",
            blocked_reason: "fetchable_paper_identity_required",
          },
          observation_packet: {
            status: "blocked",
            produced_artifact_refs: ["ask:scholarly:full-text:recovery"],
            state_delta: {
              scholarly_full_text_recovery_affordance: {
                schema: "helix.scholarly_full_text_recovery_affordance.v1",
                status: "available",
                reason: "fetchable_paper_identity_required",
                recovery_queries: [{
                  query: "deuterium tritium fusion Maxwellian averaged reactivity sigma v cross section table accessible pdf",
                }],
                assistant_answer: false,
                terminal_eligible: false,
              },
            },
          },
          observation: {
            schema: "helix.scholarly_full_text_observation.v1",
            status: "blocked",
            blocked_reason: "fetchable_paper_identity_required",
            scholarly_full_text_recovery_affordance: {
              schema: "helix.scholarly_full_text_recovery_affordance.v1",
              status: "available",
              assistant_answer: false,
              terminal_eligible: false,
            },
            assistant_answer: false,
            raw_content_included: false,
            terminal_eligible: false,
          },
          artifact_refs: ["ask:scholarly:full-text:recovery"],
          terminal_eligible: false,
          post_tool_model_step_required: true,
          assistant_answer: false,
          raw_content_included: false,
          error: "fetchable_paper_identity_required",
        } as never,
      ],
    });

    expect(guarded).toBe(providerText);
    expect(guarded).not.toContain("I cannot claim the requested workstation tool or UI action ran");
  });
});
