import { describe, expect, it } from "vitest";
import {
  buildHelixModelContextEconomyReport,
  buildHelixModelPromptContext,
  compactAgentStepObservationPacketForModel,
  compactRouteOrTerminalContractForModel,
} from "../services/helix-ask/model-context-economy";

describe("Helix Ask context economy", () => {
  it("compacts tool observations without raw payloads", () => {
    const packet = compactAgentStepObservationPacketForModel({
      turnId: "turn-context-economy",
      userRequested: "Search docs and summarize the relevant result.",
      observation: {
        schema: "helix.agent_step_observation_packet.v1",
        turn_id: "turn-context-economy",
        iteration: 1,
        call_id: "call-doc-search",
        capability_key: "docs-viewer.search_docs",
        panel_id: "docs-viewer",
        action: "search_docs",
        status: "succeeded",
        observation_summary: "Docs search found the active paper section.",
        produced_artifact_refs: ["artifact:doc-search"],
        receipts: [{ receipt_ref: "receipt:doc-search", kind: "doc_search", status: "observed" }],
        missing_requirements: [{ code: "quote_needed", message: "Exact quote was not requested." }],
        raw: { giant: "RAW_SECRET_PAYLOAD_SHOULD_NOT_APPEAR" },
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      },
    });

    expect(packet).toMatchObject({
      schema: "helix.model_observation_packet.v1",
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      observation_ref: "call-doc-search",
    });
    expect(packet?.support_refs).toEqual(expect.arrayContaining(["artifact:doc-search", "receipt:doc-search"]));
    expect(packet?.missing_or_uncertain).toEqual(expect.arrayContaining(["Exact quote was not requested."]));
    expect(JSON.stringify(packet)).not.toContain("RAW_SECRET_PAYLOAD_SHOULD_NOT_APPEAR");
  });

  it("compacts terminal contracts without forbidden lists by default", () => {
    const compact = compactRouteOrTerminalContractForModel({
      goal_kind: "repo_code_evidence_question",
      required_terminal_kinds: ["repo_code_evidence_answer"],
      acceptable_fallbacks: ["typed_failure"],
      required_evidence: ["repo_code_evidence_observation"],
      required_actions: ["repo-code.search_concept"],
      forbidden_terminal_kinds: ["direct_answer_text", "no_tool_direct", "panel_generated_answer"],
      precedence_reason: "repo evidence is required before synthesis",
    });

    expect(compact).toMatchObject({
      source_target: "repo_code_evidence_question",
      allowed_terminal_artifact_kinds: expect.arrayContaining(["repo_code_evidence_answer", "typed_failure"]),
      required_artifact_refs: expect.arrayContaining(["repo_code_evidence_observation", "repo-code.search_concept"]),
      precedence_reason: "repo evidence is required before synthesis",
    });
    expect(compact).not.toHaveProperty("forbidden_terminal_kinds");
  });

  it("builds composer context from compact observations and excludes raw debug", () => {
    const context = buildHelixModelPromptContext({
      turnId: "turn-composer",
      userGoal: "Explain the repo evidence without dumping raw spans.",
      canonicalGoal: { goal_kind: "repo_code_evidence_question" },
      terminalContract: {
        goal_kind: "repo_code_evidence_question",
        required_terminal_kinds: ["repo_code_evidence_answer"],
        forbidden_terminal_kinds: ["direct_answer_text"],
      },
      selectedArtifacts: [
        {
          artifact_id: "artifact:repo-observation",
          kind: "repo_code_evidence_observation",
          payload: {
            schema: "helix.repo_code_evidence_observation.v1",
            artifact_id: "artifact:repo-observation",
            turn_id: "turn-composer",
            concept: "terminal authority",
            query: "terminal authority",
            evidence_refs: ["server/foo.ts:10"],
            observations: [
              {
                filePath: "server/foo.ts",
                term: "terminal authority",
                refs: ["server/foo.ts:10"],
                snippet: "RAW_SPAN_DUMP_SHOULD_NOT_APPEAR",
              },
            ],
            spans: [
              {
                ref: "server/foo.ts:10",
                path: "server/foo.ts",
                sanitized_excerpt: "RAW_SPAN_DUMP_SHOULD_NOT_APPEAR",
              },
            ],
          },
        },
      ],
      toolObservations: [
        {
          call_id: "call-tool",
          capability_key: "docs-viewer.search_docs",
          status: "succeeded",
          observation_summary: "Tool observation summary.",
          receipts: [{ receipt_ref: "receipt:tool", kind: "tool", status: "observed" }],
          raw: { debug: "RAW_DEBUG_MARKER_SHOULD_NOT_APPEAR" },
        },
      ],
    });

    expect(context.compact_observations.length).toBeGreaterThan(0);
    expect(context.economy_report.raw_debug_excluded_from_model_context).toBe(true);
    expect(context.economy_report.dropped_sections).toEqual(
      expect.arrayContaining(["raw_debug_snapshots", "raw_receipt_json", "raw_selected_artifact_payloads"]),
    );
    expect(JSON.stringify(context.compact_observations)).not.toContain("RAW_DEBUG_MARKER_SHOULD_NOT_APPEAR");
    expect(JSON.stringify(context.exact_excerpts)).not.toContain("RAW_SPAN_DUMP_SHOULD_NOT_APPEAR");
  });

  it("compacts direct docs and calculator artifacts for post-observation synthesis", () => {
    const context = buildHelixModelPromptContext({
      turnId: "turn-docs-calculator",
      userGoal: "Locate terminal authority, then calculate 19 + 23.",
      selectedArtifacts: [
        {
          artifact_id: "obs:doc-location",
          kind: "doc_location_matches",
          payload: {
            kind: "doc_location_matches",
            artifact_id: "obs:doc-location",
            query: "terminal authority",
            match_count: 1,
            matches: [
              {
                path: "docs/helix-ask-turn-solver-spine.md",
                start_line: 30,
                snippet: "Only the completed solver path may answer.",
                ref: "docs/helix-ask-turn-solver-spine.md:30",
              },
            ],
          },
        },
        {
          artifact_id: "obs:calculator",
          kind: "calculator_receipt",
          payload: {
            kind: "calculator_receipt",
            receipt_id: "receipt:calculator",
            expression: "19 + 23",
            result_text: "42",
            status: "completed",
            action_key: "scientific-calculator.solve_expression",
          },
        },
      ],
    });

    expect(context.compact_observations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          observation_ref: "obs:doc-location",
          source: "docs",
          status: "succeeded",
          support_refs: expect.arrayContaining(["obs:doc-location", "docs/helix-ask-turn-solver-spine.md:30"]),
        }),
        expect.objectContaining({
          observation_ref: "obs:calculator",
          source: "tool",
          source_target: "calculator",
          status: "succeeded",
          found: expect.arrayContaining(["Calculator evaluated 19 + 23 = 42."]),
        }),
      ]),
    );
    expect(context.economy_report.selected_observation_refs).toEqual(
      expect.arrayContaining(["obs:doc-location", "obs:calculator"]),
    );
  });

  it("preserves admitted saved-page sentence boundaries for exact synthesis", () => {
    const context = buildHelixModelPromptContext({
      turnId: "turn-research-boundaries",
      userGoal: "Return the first and last nonblank sentences exactly as extracted from page 8.",
      selectedArtifacts: [{
        artifact_id: "obs:research-boundaries",
        kind: "research_library_observation",
        payload: {
          schema: "helix.research_library_observation.v1",
          artifact_id: "obs:research-boundaries",
          turn_id: "turn-research-boundaries",
          capability: "research-library.read_document",
          evidence_state: "full_text_usable",
          selected_pages: [{
            page: 8,
            text_excerpt: "8 1 ∼ 6. First actual sentence has enough words.",
            first_nonblank_sentence: "First actual sentence has enough words.",
            last_nonblank_sentence: "Last actual sentence also has enough words.",
            source_text_ref: "artifact://paper.pdf#page=8&text",
          }],
          missing_requirements: [],
        },
      }],
    });

    expect(context.compact_observations[0]).toMatchObject({
      status: "succeeded",
      found: expect.arrayContaining([
        "p. 8 exact first nonblank sentence: First actual sentence has enough words.",
        "p. 8 exact last nonblank sentence: Last actual sentence also has enough words.",
      ]),
      support_refs: expect.arrayContaining([
        "obs:research-boundaries",
        "artifact://paper.pdf#page=8&text",
      ]),
    });
  });

  it("marks empty docs locate artifacts as failed compact observations", () => {
    const context = buildHelixModelPromptContext({
      turnId: "turn-empty-doc-location",
      userGoal: "Locate terminal authority in the active doc.",
      selectedArtifacts: [
        {
          artifact_id: "obs:empty-doc-location",
          kind: "doc_location_matches",
          payload: {
            kind: "doc_location_matches",
            artifact_id: "obs:empty-doc-location",
            query: "terminal authority",
            match_count: 0,
            matches: [],
            snippets: [],
          },
        },
      ],
    });

    expect(context.compact_observations).toEqual([
      expect.objectContaining({
        observation_ref: "obs:empty-doc-location",
        source: "docs",
        status: "failed",
        missing_or_uncertain: expect.arrayContaining(["No doc match, snippet, location, or line span was returned."]),
        suggested_next_steps: expect.arrayContaining(["fail_closed"]),
      }),
    ]);
  });

  it("includes exact excerpts only through the escape hatch", () => {
    const context = buildHelixModelPromptContext({
      turnId: "turn-exact",
      userGoal: "Quote the exact line.",
      requiresExactExcerpts: true,
      selectedArtifacts: [
        {
          artifact_id: "artifact:repo-observation",
          kind: "repo_code_evidence_observation",
          payload: {
            artifact_id: "artifact:repo-observation",
            turn_id: "turn-exact",
            observations: [],
            spans: [
              {
                ref: "server/foo.ts:42",
                sanitized_excerpt: "Exact compact excerpt.",
              },
            ],
          },
        },
      ],
    });

    expect(context.exact_excerpts).toEqual([
      { ref: "server/foo.ts:42", excerpt: "Exact compact excerpt." },
    ]);
    expect(context.economy_report.exact_excerpt_refs_included).toEqual(["server/foo.ts:42"]);
    expect(context.economy_report.raw_debug_excluded_from_model_context).toBe(true);
  });

  it("reports stable per-section token estimates", () => {
    const report = buildHelixModelContextEconomyReport({
      sections: {
        user_goal: "Summarize this.",
        compact_observations: [{ ref: "obs:1", found: ["fact"] }],
        debug_excluded: "raw debug excluded",
      },
      selectedObservationRefs: ["obs:1"],
      rawSpanRefsAvailable: ["span:1"],
      exactExcerptRefsIncluded: [],
      droppedSections: ["raw_debug_snapshots"],
      rawDebugExcludedFromModelContext: true,
    });

    expect(Object.keys(report.estimated_input_tokens_by_section).sort()).toEqual([
      "canonical_goal",
      "capability_surface_compact",
      "commentary",
      "compact_observations",
      "debug_excluded",
      "exact_excerpts",
      "final_answer_constraints",
      "goal_satisfaction",
      "raw_spans_excluded",
      "receipts_excluded",
      "route_contract_compact",
      "terminal_contract_compact",
      "user_goal",
    ].sort());
    expect(report.selected_observation_refs).toEqual(["obs:1"]);
    expect(report.raw_span_refs_available).toEqual(["span:1"]);
    expect(report.raw_debug_excluded_from_model_context).toBe(true);
  });
});
