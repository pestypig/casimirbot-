import { describe, expect, it } from "vitest";

import {
  applyGatewayFailureAuthorityGuard,
  buildCodexMoralGraphReflectionReceiptAnswer,
  buildMoralGraphObservationFallbackAnswer,
  committedDocsEvidenceSupersedesScholarlyGuard,
  compactPostToolRecoveryModelValue,
  currentCompoundCapabilityRailsCompleteForSolver,
  genericCurrentTurnToolRecoveryReadyForSolver,
  missingTheoryReferentGuardApplies,
  mergeUniqueGatewayCallResults,
  providerCommittedCapabilityRailsIncompleteForSolver,
  providerGatewayEvidenceReadyForSolver,
  settleCompletedItineraryContinuationForPostToolSynthesis,
  settleReenteredToolContinuationForPostToolSynthesis,
} from "../codex-provider";

const buildTheoryGraphGatewayResult = (capability: string, ok: boolean) => ({
  ok,
  capability_id: capability,
  gateway_admission: {
    requested_capability: capability,
    admission_reason: "read_only_gateway_capability",
    blocked_reason: ok ? null : "tavily_requires_TAVILY_API_KEY",
  },
  observation_packet: {
    status: ok ? "succeeded" : "blocked",
    produced_artifact_refs: ok ? [`ask:theory:${capability}`] : [],
    observation_summary: ok ? `${capability} observed.` : "Internet search unavailable.",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
  },
  observation: {
    status: ok ? "succeeded" : "blocked",
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  },
  artifact_refs: ok ? [`ask:theory:${capability}`] : [],
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
  error: ok ? null : "tavily_requires_TAVILY_API_KEY",
});

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

const buildRuntimeSelectedScholarlyFullTextResult = () => ({
  ok: true,
  capability_id: "scholarly-research.fetch_full_text",
  gateway_admission: {
    requested_capability: "scholarly-research.fetch_full_text",
    admission_reason: "scholarly_full_text_requested",
  },
  observation_packet: {
    status: "succeeded",
    observation_ref: "ask:scholarly:full-text:selected",
    produced_artifact_refs: ["ask:scholarly:full-text:selected"],
  },
  observation: {
    schema: "helix.scholarly_full_text_observation.v1",
    artifact_id: "ask:scholarly:full-text:selected",
    evidence_state: "full_text_usable",
    selected_chunks: [{ page_number: 3, text: "The measured value was 4.0 mJy." }],
    selected_for_answer: false,
  },
  artifact_refs: ["ask:scholarly:full-text:selected"],
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
});

const buildRuntimeSelectedScholarlyLookupResult = () => ({
  ok: false,
  capability_id: "scholarly-research.lookup_papers",
  gateway_admission: {
    requested_capability: "scholarly-research.lookup_papers",
    admission_reason: "scholarly_lookup_requested",
  },
  observation_packet: {
    status: "failed",
    observation_ref: "ask:scholarly:lookup:partial",
    produced_artifact_refs: ["ask:scholarly:lookup:partial"],
  },
  observation: {
    schema: "helix.scholarly_research_observation.v1",
    artifact_id: "ask:scholarly:lookup:partial",
    evidence_state: "lookup_weak_match",
    papers: [{
      result_id: "arxiv:magnetar-review",
      title: "Magnetars: neutron stars with huge magnetic storms",
      evidence_refs: ["arxiv:1211.2086v1"],
      identifiers: { arxiv_id: "1211.2086v1" },
    }],
    selected_for_answer: false,
  },
  artifact_refs: ["ask:scholarly:lookup:partial"],
  terminal_eligible: false,
  post_tool_model_step_required: true,
  assistant_answer: false,
  raw_content_included: false,
  error: "semantic_scholar_http_429",
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
  it("keeps a hard local Docs observation authoritative over a lexical scholarly cue", () => {
    const docsResult = {
      ok: true,
      capability_id: "docs.search",
      gateway_admission: {
        requested_capability: "docs.search",
        admission_reason: "docs_search_requested",
      },
      observation_packet: {
        status: "succeeded",
        produced_artifact_refs: ["ask:docs:nhm2"],
      },
      observation: {
        schema: "helix.docs_search_observation.v1",
        hits: [{
          path: "docs/research/nhm2-current-status-whitepaper.md",
          evidence_passages: [{
            text: "NHM2 is a bounded diagnostic candidate, not a propulsion claim.",
            citation_ref: "workspace://docs/research/nhm2-current-status-whitepaper.md#line=1-4",
          }],
        }],
      },
      artifact_refs: ["ask:docs:nhm2"],
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };

    expect(
      committedDocsEvidenceSupersedesScholarlyGuard({
        sourceTargetIntent: {
          target_source: "docs_viewer",
          target_kind: "docs_viewer",
          strength: "hard",
        },
        gatewayCallResults: [docsResult as never],
      }),
    ).toBe(true);
    expect(
      committedDocsEvidenceSupersedesScholarlyGuard({
        sourceTargetIntent: {
          target_source: "scholarly_research",
          strength: "hard",
        },
        gatewayCallResults: [docsResult as never],
      }),
    ).toBe(false);
    expect(
      committedDocsEvidenceSupersedesScholarlyGuard({
        sourceTargetIntent: {
          target_source: "docs_viewer",
          strength: "hard",
        },
        gatewayCallResults: [{ ...docsResult, ok: false } as never],
      }),
    ).toBe(false);
  });

  it("retains a later successful retry when a gateway reuses the call id", () => {
    const failed = {
      ok: false,
      capability_id: "com.casimirbot.minecraft.hazards.scan",
      mode: "read",
      gateway_admission: {
        requested_capability: "com.casimirbot.minecraft.hazards.scan",
        admission_reason: "environment_probe_requested",
        blocked_reason: "schema_validation_failed",
      },
      observation_packet: {
        call_id: "turn:test:hazards.scan:call",
        status: "failed",
        produced_artifact_refs: [],
        observation_summary:
          "The probe arguments failed the trusted schema at $.purpose.",
      },
      observation: {
        status: "failed",
        error_code: "schema_validation_failed",
      },
      artifact_refs: [],
      tool_lifecycle_trace: {
        retry_recommendation: "retry_same_tool",
      },
      tool_followup_decision: {
        next_action: "retry",
      },
      error: "schema_validation_failed",
    };
    const succeeded = {
      ok: true,
      capability_id: "com.casimirbot.minecraft.hazards.scan",
      mode: "read",
      gateway_admission: {
        requested_capability: "com.casimirbot.minecraft.hazards.scan",
        admission_reason: "environment_probe_requested",
        blocked_reason: null,
      },
      observation_packet: {
        call_id: "turn:test:hazards.scan:call",
        status: "succeeded",
        produced_artifact_refs: ["ask:test:hazards:success"],
        observation_summary: "Hazard check read-only probe completed.",
      },
      observation: {
        status: "succeeded",
        probe_type: "fire_safety",
        safe_fireplace_candidates: [{ x: -50, y: 68, z: -2 }],
      },
      artifact_refs: ["ask:test:hazards:success"],
      tool_lifecycle_trace: {
        retry_recommendation: "allow_terminal",
      },
      tool_followup_decision: {
        next_action: "terminal_answer",
      },
      error: null,
    };

    const merged = mergeUniqueGatewayCallResults(
      [failed as never],
      [failed as never, succeeded as never],
    );

    expect(merged).toEqual([failed, succeeded]);
    expect(
      applyGatewayFailureAuthorityGuard({
        text: failed.observation_packet.observation_summary,
        gatewayCallResults: merged,
      }),
    ).toContain(
      "the later observation succeeded, so the earlier schema error is not the current blocker",
    );

    const narrative =
      "The fresh fire-safety observation found a safe fireplace candidate at (-50, 68, -2).";
    expect(
      applyGatewayFailureAuthorityGuard({
        text: narrative,
        gatewayCallResults: [succeeded as never, failed as never],
      }),
    ).toBe(narrative);
  });

  it("preserves the Codex answer when a later verification supersedes an ineligible read attempt", () => {
    const capability = "com.casimirbot.minecraft.spatial_region.inspect";
    const failed = {
      ok: false,
      capability_id: capability,
      mode: "verify",
      gateway_admission: {
        requested_capability: capability,
        admission_reason: "environment_probe_requested",
        blocked_reason: null,
      },
      observation_packet: {
        status: "failed",
        produced_artifact_refs: ["ask:minecraft:spatial:stale"],
        observation_summary:
          "The authentic observation was not eligible for current-turn re-entry.",
      },
      observation: { error_code: "current_turn_reentry_ineligible" },
      artifact_refs: ["ask:minecraft:spatial:stale"],
      tool_followup_decision: { next_action: "finish" },
      error: "current_turn_reentry_ineligible",
    };
    const succeeded = {
      ...failed,
      ok: true,
      observation_packet: {
        ...failed.observation_packet,
        status: "succeeded",
        produced_artifact_refs: ["ask:minecraft:spatial:fresh"],
        observation_summary:
          "Fresh structure verification observed one matching fire block.",
      },
      observation: {
        status: "succeeded",
        total_cells: 1,
        matched_cells: 1,
        mismatched_cells: 0,
      },
      artifact_refs: ["ask:minecraft:spatial:fresh"],
      error: null,
    };
    const answer =
      "Fresh verification confirmed the one requested cell is minecraft:fire.";

    expect(
      applyGatewayFailureAuthorityGuard({
        text: answer,
        gatewayCallResults: [failed as never, succeeded as never],
      }),
    ).toBe(answer);
    expect(
      providerGatewayEvidenceReadyForSolver({
        gatewayCallResults: [failed as never, succeeded as never],
        scholarlyRecoveryObservationReentered: false,
      }),
    ).toBe(true);
  });

  it("does not overwrite a narrative answer when selected full text supersedes an optional numeric helper", () => {
    const providerText =
      "I fetched the paper evidence and found density values, but the magnetic-field binding B_T was missing, so the calculator step cannot be completed from the retrieved text.";

    const guarded = applyGatewayFailureAuthorityGuard({
      text: providerText,
      gatewayCallResults: [
        buildRuntimeSelectedScholarlyFullTextResult() as never,
        buildScholarlyNumericMissingResult() as never,
      ],
      selectedScholarlyResultIds: ["ask:scholarly:full-text:selected"],
      structuredNumericEvidenceRequired: false,
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
      gatewayCallResults: [
        buildRuntimeSelectedScholarlyFullTextResult() as never,
        buildScholarlyNumericMissingResult() as never,
      ],
      selectedScholarlyResultIds: ["ask:scholarly:full-text:selected"],
      structuredNumericEvidenceRequired: false,
    });

    expect(guarded).toBe(providerText);
    expect(guarded).not.toContain("I cannot claim the requested workstation tool or UI action ran");
  });

  it("keeps numeric extraction fail-closed when structured numeric evidence is required", () => {
    const guarded = applyGatewayFailureAuthorityGuard({
      text: "The structured extraction succeeded.",
      gatewayCallResults: [
        buildRuntimeSelectedScholarlyFullTextResult() as never,
        buildScholarlyNumericMissingResult() as never,
      ],
      selectedScholarlyResultIds: ["ask:scholarly:full-text:selected"],
      structuredNumericEvidenceRequired: true,
    });

    expect(guarded).toContain("could not extract the requested numeric parameters");
    expect(guarded).toContain("Missing variables: B_T");
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

  it("accepts exact runtime-selected lookup papers despite an unrelated provider failure", () => {
    const gatewayCallResults = [buildRuntimeSelectedScholarlyLookupResult()] as never;

    expect(providerGatewayEvidenceReadyForSolver({
      gatewayCallResults,
      scholarlyRecoveryObservationReentered: false,
      selectedScholarlyResultIds: ["arxiv:magnetar-review"],
    })).toBe(true);
    expect(providerGatewayEvidenceReadyForSolver({
      gatewayCallResults,
      scholarlyRecoveryObservationReentered: false,
      selectedScholarlyResultIds: ["arxiv:unknown"],
    })).toBe(false);
    expect(applyGatewayFailureAuthorityGuard({
      text: "The observed search found a relevant magnetar review.",
      gatewayCallResults,
      selectedScholarlyResultIds: ["arxiv:magnetar-review"],
    })).toBe("The observed search found a relevant magnetar review.");
  });

  it("admits bounded post-tool recovery only for a completed current-turn itinerary", () => {
    const completedItinerary = {
      schema: "helix.capability_itinerary_execution_state.v1",
      applies: true,
      complete: true,
    };

    expect(genericCurrentTurnToolRecoveryReadyForSolver({
      providerGatewayEvidenceReady: true,
      normalizedObservationArtifactCount: 1,
      capabilityItineraryExecutionState: completedItinerary,
    })).toBe(true);

    for (const input of [
      {
        providerGatewayEvidenceReady: false,
        normalizedObservationArtifactCount: 1,
        capabilityItineraryExecutionState: completedItinerary,
      },
      {
        providerGatewayEvidenceReady: true,
        normalizedObservationArtifactCount: 0,
        capabilityItineraryExecutionState: completedItinerary,
      },
      {
        providerGatewayEvidenceReady: true,
        normalizedObservationArtifactCount: 1,
        capabilityItineraryExecutionState: {
          ...completedItinerary,
          complete: false,
        },
      },
      {
        providerGatewayEvidenceReady: true,
        normalizedObservationArtifactCount: 1,
        capabilityItineraryExecutionState: {
          ...completedItinerary,
          applies: false,
        },
      },
    ]) {
      expect(genericCurrentTurnToolRecoveryReadyForSolver(input)).toBe(false);
    }
  });

  it("prefers settled current-turn compound rails over a stale pre-execution itinerary", () => {
    const staleProjection = {
      schema: "helix.capability_itinerary_execution_state.v1",
      applies: true,
      complete: false,
      required_capabilities: ["docs.search", "scholarly-research.lookup_papers"],
      missing_required_capabilities: ["scholarly-research.lookup_papers"],
      missing_compound_subgoal_ids: ["R2"],
    };
    const settledLedger = {
      schema: "helix.compound_capability_contract.v1",
      rail_status: "satisfied",
      subgoals: [
        { requested_capability: "docs.search", satisfaction: "satisfied" },
        {
          requested_capability: "scholarly-research.lookup_papers",
          satisfaction: "satisfied",
        },
      ],
    };

    expect(currentCompoundCapabilityRailsCompleteForSolver(settledLedger)).toBe(true);
    expect(
      providerCommittedCapabilityRailsIncompleteForSolver({
        projectedExecutionState: staleProjection,
        currentCompoundCapabilityLedger: settledLedger,
      }),
    ).toBe(false);
    expect(
      genericCurrentTurnToolRecoveryReadyForSolver({
        providerGatewayEvidenceReady: true,
        normalizedObservationArtifactCount: 2,
        capabilityItineraryExecutionState: staleProjection,
        currentCompoundCapabilityLedger: settledLedger,
      }),
    ).toBe(true);
  });

  it("does not let a stale theory referent guard override a bound procedure request", () => {
    const resolutionBlockReason =
      "referent_resolution_required:missing_previous_assistant_final_answer";

    expect(missingTheoryReferentGuardApplies({
      question: "Can you reflect this in the Theory Badge Graph?",
      resolutionBlockReason,
      currentTurnTheoryExperimentProcedureRequestCount: 0,
    })).toBe(true);
    expect(missingTheoryReferentGuardApplies({
      question:
        "Prepare a seven-stage experiment plan for the Stage 3 Casimir-DP evidence map using the registered one-dimensional advection-diffusion example. Do not run anything.",
      resolutionBlockReason,
      currentTurnTheoryExperimentProcedureRequestCount: 1,
    })).toBe(false);
  });

  it("closes optional affordances once a complete itinerary only needs synthesis", () => {
    const state = {
      schema: "helix.agent_continuation_state.v1",
      state_id: "ask:test:continuation:1",
      turn_id: "ask:test",
      sequence: 1,
      trigger: "terminal_rejection",
      goal: {
        status: "in_progress",
        satisfied: false,
        terminal_product_allowed: false,
      },
      missing_requirement_ids: [],
      consumed_observation_refs: ["ask:test:observation"],
      next_admissible_affordances: [{
        affordance_id: "ask:test:optional-tool",
        decision: "act",
        capability_id: "helix_ask.reflect_theory_context",
        admissible: true,
        reason: "Optional context reflection remains available.",
      }],
      progress: {
        made_progress: false,
        no_progress_repeat_count: 1,
        reason_codes: [],
      },
      budget: {
        hard: {
          iterations: { max: 6, consumed: 2, remaining: 4 },
          tool_calls: { max: 6, consumed: 2, remaining: 4 },
          model_decisions: { max: 6, consumed: 2, remaining: 4 },
          exhausted: false,
        },
      },
      last_attempt: null,
      allowed_decisions: ["act", "retry"],
      assistant_answer: false,
      raw_content_included: false,
    } as never;

    expect(
      settleCompletedItineraryContinuationForPostToolSynthesis(state, true),
    ).toMatchObject({
      goal: {
        status: "in_progress",
        satisfied: false,
        terminal_product_allowed: true,
      },
      next_admissible_affordances: [{ admissible: false }],
      progress: {
        made_progress: true,
        no_progress_repeat_count: 0,
        reason_codes: [
          "current_turn_itinerary_complete_pending_synthesis",
        ],
      },
      allowed_decisions: ["answer"],
    });
    expect(
      settleCompletedItineraryContinuationForPostToolSynthesis(state, false),
    ).toBe(state);
  });

  it("allows Codex synthesis immediately after a completed tool itinerary re-enters", () => {
    const state = {
      schema: "helix.agent_continuation_state.v1",
      state_id: "ask:test:continuation:2",
      turn_id: "ask:test",
      sequence: 2,
      trigger: "post_attempt",
      goal: {
        status: "in_progress",
        satisfied: false,
        terminal_product_allowed: false,
      },
      missing_requirement_ids: ["R2"],
      next_admissible_affordances: [],
      progress: {
        made_progress: true,
        no_progress_repeat_count: 0,
        reason_codes: ["new_observation"],
      },
      budget: { hard: { exhausted: false } },
      last_attempt: null,
      allowed_decisions: ["ask_user"],
      assistant_answer: false,
      raw_content_included: false,
    } as never;

    expect(
      settleReenteredToolContinuationForPostToolSynthesis({
        state,
        trigger: "post_attempt",
        providerGatewayEvidenceReady: true,
        normalizedObservationArtifactCount: 1,
        capabilityItineraryExecutionState: {
          schema: "helix.capability_itinerary_execution_state.v1",
          applies: true,
          complete: true,
        },
      }),
    ).toMatchObject({
      goal: {
        status: "in_progress",
        satisfied: false,
        terminal_product_allowed: true,
      },
      allowed_decisions: ["answer"],
      progress: {
        reason_codes: [
          "new_observation",
          "current_turn_itinerary_complete_pending_synthesis",
        ],
      },
    });

    expect(
      settleReenteredToolContinuationForPostToolSynthesis({
        state,
        trigger: "initial",
        providerGatewayEvidenceReady: true,
        normalizedObservationArtifactCount: 1,
        capabilityItineraryExecutionState: {
          applies: true,
          complete: true,
        },
      }),
    ).toBe(state);

    const completedReceiptState = {
      ...state,
      goal: {
        status: "satisfied",
        satisfied: true,
        terminal_product_allowed: true,
      },
      allowed_decisions: ["answer"],
    } as never;

    expect(
      settleReenteredToolContinuationForPostToolSynthesis({
        state: completedReceiptState,
        trigger: "post_attempt",
        providerGatewayEvidenceReady: true,
        normalizedObservationArtifactCount: 1,
        capabilityItineraryExecutionState: {
          applies: true,
          complete: true,
        },
      }),
    ).toBe(completedReceiptState);
  });

  it("bounds nested recovery evidence without erasing its top-level structure", () => {
    const projected = compactPostToolRecoveryModelValue({
      schema: "helix.test_observation.v1",
      summary: "x".repeat(2_500),
      rows: Array.from({ length: 20 }, (_, index) => ({
        id: `row:${index}`,
      })),
    }) as Record<string, unknown>;

    expect(projected.schema).toBe("helix.test_observation.v1");
    expect(String(projected.summary)).toContain(
      "[recovery value truncated]",
    );
    expect(projected.rows).toHaveLength(13);
    expect((projected.rows as unknown[]).at(-1)).toBe(
      "[8 additional entries omitted]",
    );
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

  it("keeps a complete Theory Badge Graph context route answerable when optional web corroboration fails", () => {
    const gatewayCallResults = [
      buildTheoryGraphGatewayResult("theory-badge-graph.current_context", true),
      buildTheoryGraphGatewayResult("theory-badge-graph.reflect_discussion_context", true),
      buildTheoryGraphGatewayResult("internet-search.search_web", false),
    ];
    const providerText =
      "The selected badges form a compatible diagnostic path, but the arrangement is not proof of a physical state or a measured transition.";

    const guarded = applyGatewayFailureAuthorityGuard({
      text: providerText,
      gatewayCallResults: gatewayCallResults as never,
    });

    expect(providerGatewayEvidenceReadyForSolver({
      gatewayCallResults: gatewayCallResults as never,
      scholarlyRecoveryObservationReentered: false,
    })).toBe(true);
    expect(guarded).toContain(providerText);
    expect(guarded).toContain(
      "External evidence unavailable: internet-search.search_web: tavily_requires_TAVILY_API_KEY.",
    );
    expect(guarded).not.toContain("I cannot claim the requested workstation tool or UI action ran");
  });

  it("does not excuse a failed web search when either required Theory graph observation is missing", () => {
    const gatewayCallResults = [
      buildTheoryGraphGatewayResult("theory-badge-graph.current_context", true),
      buildTheoryGraphGatewayResult("internet-search.search_web", false),
    ];

    expect(providerGatewayEvidenceReadyForSolver({
      gatewayCallResults: gatewayCallResults as never,
      scholarlyRecoveryObservationReentered: false,
    })).toBe(false);
    expect(applyGatewayFailureAuthorityGuard({
      text: "The graph is enough.",
      gatewayCallResults: gatewayCallResults as never,
    })).toContain("I cannot claim the requested workstation tool or UI action ran");
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

  it("materializes moral badge graph karma prompts as bounded Moral Graph synthesized answers", () => {
    const projection = buildCodexMoralGraphReflectionReceiptAnswer({
      turnId: "ask:test:moral-badge-graph-karma",
      threadId: "helix-agent-provider",
      route: "/ask",
      promptText:
        "what could karma really mean in terms of the moral badge graph? reflect on the idea and what may really happen?",
      normalizedArtifacts: [{
        artifact_id: "ask:test:moral-badge-graph-karma:codex_normalized:moral_graph_reflection:1",
        kind: "moral_graph_reflection",
        capability_key: "moral-graph.reflect_context",
        payload_schema: "helix.moral_graph_reflection_observation.v1",
        payload: {
          schema: "helix.moral_graph_reflection_observation.v1",
          located_badge_ids: [
            "feedback-loop-hygiene",
            "moral-residue-after-awareness",
            "falsifiability-and-truth-convergence",
          ],
          claim_boundary_notes: ["diagnostic reflection only; not proof of cosmic repayment"],
          summary: "Moral Graph reflection located consequence and feedback-loop lenses.",
        },
      }],
    });

    expect(projection?.answer.answer_text).toContain("karma as a bounded reflection");
    expect(projection?.answer.answer_text).toContain("ordinary feedback loops");
    expect(projection?.answer.answer_text).not.toContain("Dependency:");
    expect(projection?.answer.support_refs).toContain(
      "ask:test:moral-badge-graph-karma:codex_normalized:moral_graph_reflection:1",
    );
    expect(projection?.authority.terminal_artifact_kind).toBe("model_synthesized_answer");
    expect(projection?.authority.final_answer_source).toBe("moral_graph_reflection_answer");
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
