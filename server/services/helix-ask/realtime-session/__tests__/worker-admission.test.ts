import { describe, expect, it } from "vitest";
import type { HelixRealtimeStagePlayGoalBindingV1 } from "@shared/contracts/helix-realtime-stage-play.v1";
import { readWorkstationGatewayCallRequestsForTurn } from "../../agent-providers/explicit-workstation-gateway";
import {
  buildRealtimeTranscriptWorkerAdmission,
  resolveRealtimeFinalWorkerAdmission,
  resolveRealtimeTranscriptSourceTargetIntent,
} from "../worker-admission";

const buildAdmission = (
  transcriptText: string,
  suffix: string,
  activeGoalBinding: HelixRealtimeStagePlayGoalBindingV1 | null = null,
) => buildRealtimeTranscriptWorkerAdmission({
  handoffId: `handoff:${suffix}`,
  realtimeSessionId: "realtime:test",
  threadId: "helix-ask:desktop",
  transcriptText,
  sourceBinding: {
    focus_panel_id: "scientific-calculator",
    document_ref: "docs/research/example.md",
  },
  activeGoalBinding,
  selectedRuntimeAgentProvider: "codex",
  evidenceRefs: [`evidence:${suffix}`],
  nowMs: 100,
});

describe("Realtime transcript worker admission", () => {
  it("binds a natural Minecraft inventory probe to the exact read-only connector capability", () => {
    const capability = "com.casimirbot.minecraft.inventory.check";
    const admission = buildAdmission(
      "Check my current Minecraft inventory now using the connected environment.",
      "minecraft-inventory",
    );

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "worker_required",
      selected_route: "live_environment",
      candidate_readonly_capability_ids: [capability],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "ask_runtime",
        requested: true,
        read_only: true,
      },
    });
    expect(admission.reason_codes).toContain(
      "explicit_readonly_capability_contract",
    );
  });

  it.each([
    "Do not check my Minecraft inventory.",
    "Later, I may ask you to check my Minecraft inventory.",
    'The screen says "check my Minecraft inventory".',
    "Why did the previous turn say it checked my Minecraft inventory?",
    "Can the connector check my Minecraft inventory?",
  ])(
    "does not bind contextual Minecraft inventory wording to a Realtime probe: %s",
    (prompt) => {
      const admission = buildAdmission(
        prompt,
        `minecraft-contextual:${prompt.length}`,
      );

      expect(admission.candidate_readonly_capability_ids).not.toContain(
        "com.casimirbot.minecraft.inventory.check",
      );
    },
  );

  it("routes a natural named-doc explanation through the read-only Docs worker", () => {
    const transcriptText = "Okay, can you look at the NHM tube doc and explain what it's about?";
    const sourceTargetIntent = resolveRealtimeTranscriptSourceTargetIntent({
      handoffId: "handoff:natural-named-doc",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: { focus_panel_id: "account-session" },
    });
    const admission = buildRealtimeTranscriptWorkerAdmission({
      handoffId: "handoff:natural-named-doc",
      realtimeSessionId: "realtime:test",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: { focus_panel_id: "account-session" },
      sourceTargetIntent,
      selectedRuntimeAgentProvider: "codex",
      nowMs: 100,
    });

    expect(sourceTargetIntent).toMatchObject({
      target_source: "docs_viewer",
      precedence_reason: "natural_docs_topic_summary_source_target",
      allow_no_tool_direct: false,
    });
    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "worker_required",
      selected_route: "docs_viewer",
      candidate_readonly_capability_ids: ["docs.search"],
    });
  });

  it("routes a named status document main-idea request through docs.search", () => {
    const transcriptText = "Look at the NHM2 Status Document and give me the main idea.";
    const sourceTargetIntent = resolveRealtimeTranscriptSourceTargetIntent({
      handoffId: "handoff:named-status-doc",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: { focus_panel_id: "account-session" },
    });
    const admission = buildRealtimeTranscriptWorkerAdmission({
      handoffId: "handoff:named-status-doc",
      realtimeSessionId: "realtime:test",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: { focus_panel_id: "account-session" },
      sourceTargetIntent,
      selectedRuntimeAgentProvider: "codex",
      nowMs: 100,
    });

    expect(sourceTargetIntent).toMatchObject({
      target_source: "docs_viewer",
      allow_no_tool_direct: false,
    });
    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "worker_required",
      selected_route: "docs_viewer",
      candidate_readonly_capability_ids: ["docs.search"],
    });
  });

  it("routes an explicit search of our docs through the required Docs worker", () => {
    const transcriptText =
      "Search our docs for NHM2 and summarize its treatment of boundary conditions.";
    const sourceTargetIntent = resolveRealtimeTranscriptSourceTargetIntent({
      handoffId: "handoff:our-docs-search",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: { focus_panel_id: "account-session" },
    });
    const admission = buildRealtimeTranscriptWorkerAdmission({
      handoffId: "handoff:our-docs-search",
      realtimeSessionId: "realtime:test",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: { focus_panel_id: "account-session" },
      sourceTargetIntent,
      selectedRuntimeAgentProvider: "codex",
      nowMs: 100,
    });

    expect(sourceTargetIntent).toMatchObject({
      target_source: "docs_viewer",
      strength: "hard",
      must_enter_backend_ask: true,
      allow_no_tool_direct: false,
    });
    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "worker_required",
      selected_route: "docs_viewer",
      candidate_readonly_capability_ids: ["docs.search"],
    });
  });

  it("routes a named document relation follow-up through docs.search", () => {
    const transcriptText = "And how does this relate to the Casimir DP quantum foam document?";
    const sourceTargetIntent = resolveRealtimeTranscriptSourceTargetIntent({
      handoffId: "handoff:named-doc-relation",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: { focus_panel_id: "account-session" },
    });
    const admission = buildRealtimeTranscriptWorkerAdmission({
      handoffId: "handoff:named-doc-relation",
      realtimeSessionId: "realtime:test",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: { focus_panel_id: "account-session" },
      sourceTargetIntent,
      selectedRuntimeAgentProvider: "codex",
      nowMs: 100,
    });

    expect(sourceTargetIntent).toMatchObject({
      target_source: "docs_viewer",
      precedence_reason: "named_doc_relation_source_target",
      allow_no_tool_direct: false,
    });
    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "worker_required",
      selected_route: "docs_viewer",
      candidate_readonly_capability_ids: ["docs.search"],
    });
  });

  it("keeps a current-status whitepaper comparison on the Docs tool surface", () => {
    const transcriptText =
      "Okay, and how does this relate to the NHM2 Current Status Whitepaper in the docs that we have?";
    const sourceTargetIntent = resolveRealtimeTranscriptSourceTargetIntent({
      handoffId: "handoff:current-status-whitepaper-comparison",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: { focus_panel_id: "docs-viewer" },
    });
    const admission = buildRealtimeTranscriptWorkerAdmission({
      handoffId: "handoff:current-status-whitepaper-comparison",
      realtimeSessionId: "realtime:test",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: { focus_panel_id: "docs-viewer" },
      sourceTargetIntent,
      selectedRuntimeAgentProvider: "codex",
      nowMs: 100,
    });

    expect(sourceTargetIntent).toMatchObject({
      target_source: "docs_viewer",
      strength: "hard",
      allow_no_tool_direct: false,
    });
    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "worker_required",
      selected_route: "docs_viewer",
      candidate_readonly_capability_ids: ["docs.search"],
    });
    expect(admission.candidate_readonly_capability_ids).not.toContain(
      "internet-search.search_web",
    );
  });

  it.each([
    "What does it mean by saying some response functions are noncomputable until a model and falsifier are registered?",
    "Can you quote the exact passage where it says that and explain what the surrounding section is doing?",
    "Is 'noncomputable' here claiming Turing incomputability, or only that the response operator is not specified yet?",
  ])("binds a natural document-evidence follow-up to the active document: %s", (transcriptText) => {
    const sourceTargetIntent = resolveRealtimeTranscriptSourceTargetIntent({
      handoffId: "handoff:active-doc-followup",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: {
        focus_panel_id: "docs-viewer",
        document_ref: "docs/research/example.md",
      },
    });

    expect(sourceTargetIntent).toMatchObject({
      target_source: "active_doc",
      target_kind: "active_doc",
      must_enter_backend_ask: true,
      allow_no_tool_direct: false,
      precedence_reason: "active_doc_evidence_followup_source_target",
      requested_outputs: expect.arrayContaining(["line_backed_source", "doc_evidence_synthesis_answer"]),
    });
    const admission = buildRealtimeTranscriptWorkerAdmission({
      handoffId: "handoff:active-doc-followup",
      realtimeSessionId: "realtime:test",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: {
        focus_panel_id: "docs-viewer",
        document_ref: "docs/research/example.md",
      },
      selectedRuntimeAgentProvider: "codex",
      nowMs: 100,
    });
    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "worker_required",
      selected_route: "active_doc",
      candidate_readonly_capability_ids: ["docs.search"],
      action_candidate_capability_ids: [],
    });
    const nestedRouteRequests = readWorkstationGatewayCallRequestsForTurn({
      body: {
        question: transcriptText,
        route_metadata: {
          source_target_intent: {
            ...sourceTargetIntent,
            active_doc_path: "docs/research/example.md",
            active_panel: "docs-viewer",
          },
        },
      },
      includePlannerDerived: true,
    });
    expect(nestedRouteRequests).toEqual([
      expect.objectContaining({
        capability_id: "docs.search",
        mode: "read",
        arguments: expect.objectContaining({
          paths: ["docs/research/example.md"],
        }),
      }),
    ]);
  });

  it.each([
    "Do not quote the exact passage from this document.",
    "Later, quote the exact passage where it says that.",
    "Earlier you quoted the exact passage where it says that.",
    "The UI text says 'quote the exact passage where it says that'.",
    "What does noncomputable mean in mathematics generally?",
  ])("does not bind contextual or unrelated text to the active document: %s", (transcriptText) => {
    const sourceTargetIntent = resolveRealtimeTranscriptSourceTargetIntent({
      handoffId: "handoff:inactive-doc-followup",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: {
        focus_panel_id: "docs-viewer",
        document_ref: "docs/research/example.md",
      },
    });

    expect(sourceTargetIntent.precedence_reason).not.toBe("active_doc_evidence_followup_source_target");
  });

  it("derives bounded document-search terms from the retained answer for a natural exact-quote follow-up", () => {
    const transcriptText =
      "Can you quote the exact passage where it says that and explain what the surrounding section is doing?";
    const sourceTargetIntent = resolveRealtimeTranscriptSourceTargetIntent({
      handoffId: "handoff:active-doc-quote-followup",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: {
        focus_panel_id: "docs-viewer",
        document_ref: "docs/research/example.md",
      },
    });
    const requests = readWorkstationGatewayCallRequestsForTurn({
      body: {
        question: transcriptText,
        route_metadata: {
          source_target_intent: {
            ...sourceTargetIntent,
            active_doc_path: "docs/research/example.md",
            active_panel: "docs-viewer",
          },
        },
        workspace_context_snapshot: {
          chat_referent_context: {
            previous_assistant_final_answer: {
              text:
                "The response is intentionally noncomputable until the model and its falsifier are registered.",
              source_ref: "chat.final_answer:meaning",
            },
          },
        },
      },
      includePlannerDerived: true,
    });

    expect(requests).toEqual([
      expect.objectContaining({
        capability_id: "docs.search",
        arguments: expect.objectContaining({
          paths: ["docs/research/example.md"],
          exact_terms: expect.arrayContaining(["noncomputable", "falsifier", "registered"]),
          source_target_intent: expect.objectContaining({
            evidence_query_derivation: "retained_assistant_answer_salient_terms",
            evidence_query_terms: expect.arrayContaining(["noncomputable", "falsifier", "registered"]),
            referent_resolution: expect.objectContaining({
              referent_detected: true,
              resolved_source_ref: "chat.final_answer:meaning",
            }),
          }),
        }),
      }),
    ]);
  });

  it("admits docs.search for a hard active-document turn outside the exact-quote precedence", () => {
    const transcriptText =
      "So can you tell me about the warp profile? Is it a relativistic profile? And how fast does that go, like in terms of saving time? I think we have some comparisons on days that it saves?";
    const admission = buildRealtimeTranscriptWorkerAdmission({
      handoffId: "handoff:active-doc-trip-comparison",
      realtimeSessionId: "realtime:test",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: {
        focus_panel_id: "docs-viewer",
        document_ref: "docs/research/nhm2-current-status-whitepaper.md",
      },
      sourceTargetIntent: {
        schema: "helix.ask.source_target_intent.v1",
        target_source: "active_doc",
        target_kind: "active_doc",
        strength: "hard",
        explicit_cues: ["active_workspace_source_resolution"],
        reasons: ["active_workspace_source_resolution"],
        requested_outputs: ["line_backed_source", "doc_evidence_synthesis_answer"],
        suppressed_routes: ["model_only_concept", "no_tool_direct"],
        precedence_reason: "active_workspace_source_resolution",
        confidence: 0.95,
        must_enter_backend_ask: true,
        allow_client_shortcut: false,
        allow_no_tool_direct: false,
      },
      selectedRuntimeAgentProvider: "codex",
      nowMs: 100,
    });

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "worker_required",
      selected_route: "active_doc",
      candidate_readonly_capability_ids: ["docs.search"],
      action_candidate_capability_ids: [],
    });
  });

  it("admits a natural paper lookup through the scholarly read-only worker route", () => {
    const transcriptText = "Okay, can you look for papers about a magnetar?";
    const sourceTargetIntent = resolveRealtimeTranscriptSourceTargetIntent({
      handoffId: "handoff:magnetar-papers",
      threadId: "helix-ask:desktop",
      transcriptText,
      sourceBinding: {
        focus_panel_id: "docs-viewer",
        document_ref: "docs/research/example.md",
      },
    });
    const admission = buildAdmission(transcriptText, "magnetar-papers");

    expect(sourceTargetIntent).toMatchObject({
      target_source: "scholarly_research",
      target_kind: "scholarly_research",
      must_enter_backend_ask: true,
      allow_no_tool_direct: false,
    });
    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "worker_required",
      selected_route: "scholarly_research",
      candidate_readonly_capability_ids: ["scholarly-research.lookup_papers"],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "ask_runtime",
        requested: true,
        read_only: true,
      },
      spoken_relay_eligible: true,
    });
  });

  it("keeps greeting-only conversation local despite a soft freshness suggestion", () => {
    const admission = buildAdmission("How are you today?", "smalltalk");

    expect(admission).toMatchObject({
      schema: "helix.realtime_worker_admission.v2",
      outcome: "conversation_local",
      interaction_mode: "conversation_local",
      dispatch: {
        kind: "none",
        state: "not_required",
        requested: false,
        suppress_parallel_ask_turn: true,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: false,
      workstation_action_execution_allowed: false,
      realtime_provider_tool_execution_allowed: false,
    });
    expect(admission.reason_codes).toContain("ask_smalltalk_greeting_only_policy");
  });

  it.each([
    "Can you hear me?",
    "Okay, you can hear me?",
    "Could you hear me?",
    "Is my microphone working?",
    "Okay, my microphone is on.",
    "I've enabled my microphone.",
  ])("keeps microphone and connection checks in the Live conversation: %s", (prompt) => {
    const admission = buildAdmission(prompt, `audio-check:${prompt.length}`);

    expect(admission).toMatchObject({
      outcome: "conversation_local",
      interaction_mode: "conversation_local",
      dispatch: {
        kind: "none",
        requested: false,
      },
    });
    expect(admission.reason_codes).toContain("realtime_conversation_check_local");
  });

  it.each([
    "Right.",
    "Sure.",
    "Great.",
    "Yeah.",
    "Thanks.",
    "Got it.",
    "That makes sense.",
  ])("keeps acknowledgement-only fragments in the Live conversation: %s", (prompt) => {
    const admission = buildAdmission(prompt, `conversation-fragment:${prompt.length}`);

    expect(admission).toMatchObject({
      outcome: "conversation_local",
      interaction_mode: "conversation_local",
      dispatch: {
        kind: "none",
        requested: false,
      },
      spoken_relay_eligible: false,
    });
    expect(admission.reason_codes).toContain("realtime_conversation_fragment_local");
  });

  it.each([
    'The status label says "right".',
    'Do not just say "okay"; explain why boundary conditions matter.',
    'If I say "thanks" later, keep the conversation open.',
    'Earlier I said "right" while the answer was loading.',
    'The screen visibly shows "sure" beside the microphone.',
  ])("does not treat contextual acknowledgement wording as a local fragment: %s", (prompt) => {
    const admission = buildAdmission(prompt, `contextual-fragment:${prompt.length}`);

    expect(admission.reason_codes).not.toContain("realtime_conversation_fragment_local");
  });

  it("does not let an acknowledgement prefix suppress an affirmative docs request", () => {
    const admission = buildAdmission(
      "Sure, search the docs for NHM2 boundary conditions.",
      "fragment-prefix-with-docs-request",
    );

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "worker_required",
      candidate_readonly_capability_ids: ["docs.search"],
      dispatch: {
        kind: "ask_runtime",
        requested: true,
      },
    });
    expect(admission.reason_codes).not.toContain("realtime_conversation_fragment_local");
  });

  it("does not let an audio-check prefix suppress an affirmative worker request", () => {
    const admission = buildAdmission(
      "Can you hear me, and then search the docs for the Casimir effect?",
      "audio-check-with-docs-request",
    );

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "worker_required",
      dispatch: {
        kind: "ask_runtime",
        requested: true,
      },
    });
    expect(admission.reason_codes).not.toContain("realtime_conversation_check_local");
  });

  it("offers a substantive model turn to the selected runtime without making Live wait", () => {
    const admission = buildAdmission(
      "Explain why the Casimir effect depends on boundary conditions.",
      "selected-runtime-model-turn",
    );

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "parallel_conversation",
      selected_runtime_agent_provider: "codex",
      candidate_readonly_capability_ids: [],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "ask_runtime",
        requested: true,
        target_runtime_agent_provider: "codex",
        suppress_parallel_ask_turn: false,
      },
      workstation_action_execution_allowed: false,
      realtime_provider_tool_execution_allowed: false,
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(admission.reason_codes).toContain(
      "selected_runtime_receives_substantive_utterance",
    );
    expect(admission.reason_codes).toContain("realtime_parallel_conversation");
    expect(admission.reason_codes).not.toContain("realtime_worker_result_required");
  });

  it("keeps contextual tool language non-executable while still allowing a selected-runtime answer", () => {
    const admission = buildAdmission(
      "Do not search the docs yet; explain what the Casimir effect is.",
      "selected-runtime-negated-tool",
    );

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "parallel_conversation",
      candidate_readonly_capability_ids: [],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "ask_runtime",
        requested: true,
      },
      workstation_action_execution_allowed: false,
      realtime_provider_tool_execution_allowed: false,
    });
    expect(admission.reason_codes).toContain("realtime_parallel_conversation");
    expect(admission.reason_codes).not.toContain("realtime_worker_result_required");
  });

  it.each([
    "What is two plus two?",
    "Do you think that idea is exciting?",
    "You cannot handle the flow, son!",
  ])("keeps ordinary selected-runtime conversation parallel: %s", (prompt) => {
    const admission = buildAdmission(prompt, `parallel-model-turn:${prompt.length}`);

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      interaction_mode: "parallel_conversation",
      selected_runtime_agent_provider: "codex",
      candidate_readonly_capability_ids: [],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "ask_runtime",
        requested: true,
        target_runtime_agent_provider: "codex",
      },
    });
    expect(admission.reason_codes).toContain("realtime_parallel_conversation");
    expect(admission.reason_codes).not.toContain("realtime_worker_result_required");
  });

  it("retains greeting-only suppression after an incidental successful observation", () => {
    const preliminary = buildAdmission("How are you today?", "smalltalk-final");
    const final = resolveRealtimeFinalWorkerAdmission({
      preliminary,
      payload: {
        workstation_gateway_call_results: [{
          capability_id: "internet-search.search_web",
          ok: true,
          observation_packet: { status: "succeeded" },
        }],
      },
      nowMs: 200,
    });

    expect(final).toMatchObject({
      decision_phase: "solver_final",
      outcome: "conversation_local",
      observed_readonly_capability_ids: ["internet-search.search_web"],
      dispatch: {
        kind: "none",
        state: "not_required",
        requested: false,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: false,
    });
    expect(final.reason_codes).toContain("ask_smalltalk_greeting_only_policy_retained");
  });

  it.each([
    {
      name: "active panel",
      prompt: "What panel in the workstation is active?",
      route: "workspace_panel",
      capability: "workstation.active_context",
    },
    {
      name: "open workstation state",
      prompt: "What is currently open in the workstation?",
      route: "workspace_panel",
      capability: "workstation.active_context",
    },
    {
      name: "docs retrieval",
      prompt: "Search the open document for the boundary conditions.",
      route: "docs_viewer",
      capability: null,
    },
    {
      name: "calculation",
      prompt: "Use the scientific calculator to evaluate 17 * 23.",
      route: "calculator_stream",
      capability: "scientific-calculator.solve_expression",
    },
    {
      name: "reflection",
      prompt: "Reflect on the active moral graph evidence.",
      route: "unknown",
      capability: "moral-graph.reflect_context",
    },
  ])("admits a read-only $name worker turn", ({ prompt, route, capability }) => {
    const admission = buildAdmission(prompt, route);

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      selected_route: route,
      dispatch: {
        kind: "ask_runtime",
        state: "requested",
        requested: true,
        target_runtime_agent_provider: "codex",
        runtime_selection_source: "ask_ui_selected_runtime",
        suppress_parallel_ask_turn: false,
      },
      selected_runtime_agent_provider: "codex",
      worker_turn_dispatched: false,
      spoken_relay_eligible: true,
      workstation_action_execution_allowed: false,
      realtime_provider_tool_execution_allowed: false,
      answer_authority: false,
      terminal_eligible: false,
    });
    if (capability) {
      expect(admission.candidate_readonly_capability_ids).toContain(capability);
    }
  });

  it("keeps a delayed-result clause attached to the affirmative active-panel query", () => {
    const admission = buildAdmission(
      "Use the workstation agent to verify which panel is active, tell me you're checking, then give me the verified result when it returns.",
      "active-panel-delayed-result",
    );

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      candidate_readonly_capability_ids: ["workstation.active_context"],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "ask_runtime",
        read_only: true,
      },
      spoken_relay_eligible: true,
    });
  });

  it.each([
    "Use the workstation agent to verify the active panel.",
    "You can use the workstation agent to verify the active panel.",
    "Could you ask the runtime agent to check the current workspace?",
  ])("dispatches an explicit active-context delegation without a wh-question: %s", (prompt) => {
    const admission = buildAdmission(prompt, `active-panel-delegation:${prompt.length}`);

    expect(admission).toMatchObject({
      outcome: "worker_grounded",
      candidate_readonly_capability_ids: ["workstation.active_context"],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "ask_runtime",
        requested: true,
        read_only: true,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: true,
    });
  });

  it("keeps a bare panel transcript fragment in the local Realtime conversation", () => {
    const admission = buildAdmission("active panel", "active-panel-fragment");

    expect(admission).toMatchObject({
      outcome: "conversation_local",
      selected_route: "workspace_panel",
      candidate_readonly_capability_ids: [],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "none",
        state: "not_required",
        requested: false,
        suppress_parallel_ask_turn: true,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: false,
    });
    expect(admission.reason_codes).toContain(
      "realtime_workspace_panel_fragment_without_affirmative_request",
    );
    expect(admission.reason_codes).not.toContain("source_target_workspace_panel");
  });

  it.each([
    "The button says \"active panel\".",
    "Earlier we discussed the active panel.",
    "If the active panel changes later, we can inspect it then.",
    "Do not answer which panel is active; explain the phrase.",
    "I am not asking about the current open panels; explain what a panel means in general.",
  ])("does not dispatch contextual panel wording as an Ask turn: %s", (prompt) => {
    const admission = buildAdmission(prompt, `panel-context:${prompt.length}`);

    expect(admission).toMatchObject({
      outcome: "conversation_local",
      candidate_readonly_capability_ids: [],
      action_candidate_capability_ids: [],
      dispatch: {
        kind: "none",
        requested: false,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: false,
    });
  });

  it("binds a transcript to the existing durable runtime goal without transferring authority", () => {
    const admission = buildAdmission(
      "What has the worker found so far?",
      "goal",
      {
        goal_id: "goal:live-proof",
        status: "active",
        runtime_session_ref: "runtime:goal:1",
        runtime_agent_provider: "codex",
        source_refs: ["goal:live-proof"],
        evidence_refs: ["runtime:goal:1"],
        answer_authority: false,
        terminal_eligible: false,
      },
    );

    expect(admission).toMatchObject({
      outcome: "durable_goal_bound",
      selected_runtime_agent_provider: "codex",
      dispatch: {
        kind: "goal_wake",
        state: "requested",
        goal_id: "goal:live-proof",
        runtime_goal_session_ref: "runtime:goal:1",
        suppress_parallel_ask_turn: true,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: true,
      answer_authority: false,
      terminal_eligible: false,
    });
  });

  it("classifies an admitted mutating capability only as an action candidate", () => {
    const admission = buildAdmission(
      "Run docs-viewer.open_doc for docs/research/example.md.",
      "action",
    );

    expect(admission.outcome).toBe("action_candidate");
    expect(admission.action_candidate_capability_ids).toContain("docs-viewer.open_doc");
    expect(admission).toMatchObject({
      dispatch: {
        kind: "ask_runtime_read_only",
        state: "requested",
        read_only: true,
        workstation_action_execution_allowed: false,
      },
      worker_turn_dispatched: false,
      spoken_relay_eligible: false,
      workstation_action_execution_allowed: false,
      realtime_provider_tool_execution_allowed: false,
    });
  });

  it.each([
    "Do not open the docs panel.",
    "The phrase 'run docs-viewer.open_doc' is quoted on screen.",
    "Earlier I ran docs-viewer.open_doc to inspect that document.",
    "Tomorrow, open the docs panel.",
    "If needed later, run docs-viewer.open_doc for docs/research/example.md.",
    "The screen says run docs-viewer.open_doc for docs/research/example.md.",
  ])("does not promote contextual action language into executable authority: %s", (prompt) => {
    const admission = buildAdmission(prompt, `contextual:${prompt.length}`);

    expect(admission.action_candidate_capability_ids).toEqual([]);
    expect(admission.workstation_action_execution_allowed).toBe(false);
    expect(admission.realtime_provider_tool_execution_allowed).toBe(false);
  });

  it.each([
    "The screen says \"What is currently open in the workstation?\"",
    "Earlier I asked what was open in the workstation.",
    "If we later ask what is open in the workstation, wait for that request.",
    "Do not check what is currently open in the workstation; explain the wording.",
  ])("does not dispatch contextual open-workstation wording: %s", (prompt) => {
    const admission = buildAdmission(prompt, `open-workstation-context:${prompt.length}`);

    expect(admission.candidate_readonly_capability_ids).toEqual([]);
    expect(admission.action_candidate_capability_ids).toEqual([]);
    expect(admission.dispatch.requested).toBe(false);
    expect(admission.workstation_action_execution_allowed).toBe(false);
  });

  it("keeps mixed read/action intent non-executable even when an action candidate is retained", () => {
    const admission = buildAdmission(
      "Run docs-viewer.open_doc for docs/research/example.md, then tell me which panel is active.",
      "mixed",
    );

    expect(admission.workstation_action_execution_allowed).toBe(false);
    expect(admission.realtime_provider_tool_execution_allowed).toBe(false);
    expect(admission.answer_authority).toBe(false);
  });

  it("upgrades relay eligibility only from completed read-only observations and records provider selection", () => {
    const preliminary = buildAdmission(
      "Search the open document for the boundary conditions.",
      "final",
    );
    const final = resolveRealtimeFinalWorkerAdmission({
      preliminary,
      payload: {
        selected_agent_provider: "codex",
        language_model_policy: { resolved_model: "gpt-5.4" },
        workstation_gateway_call_results: [{
          capability_id: "docs.search",
          ok: true,
          observation_packet: { status: "succeeded" },
        }],
      },
      evidenceRefs: ["gateway-call:docs"],
      nowMs: 200,
    });

    expect(final).toMatchObject({
      decision_phase: "solver_final",
      outcome: "worker_grounded",
      selected_runtime_agent_provider: "codex",
      selected_model: "gpt-5.4",
      observed_readonly_capability_ids: ["docs.search"],
      dispatch: {
        kind: "ask_runtime",
        state: "completed",
        completed: true,
      },
      worker_turn_dispatched: true,
      spoken_relay_eligible: true,
    });
  });

  it("retains a completed selected-runtime model answer without inventing a gateway observation", () => {
    const preliminary = buildAdmission(
      "Explain why the Casimir effect depends on boundary conditions.",
      "final-selected-runtime-model-turn",
    );
    const final = resolveRealtimeFinalWorkerAdmission({
      preliminary,
      payload: {
        selected_agent_provider: "codex",
        language_model_policy: { resolved_model: "gpt-5.4" },
      },
      solverTrace: {
        selected_primary_intent: "general_reasoning",
        final_arbitration: { selected_route: "/ask" },
      },
      nowMs: 200,
    });

    expect(final).toMatchObject({
      decision_phase: "solver_final",
      outcome: "worker_grounded",
      selected_runtime_agent_provider: "codex",
      selected_model: "gpt-5.4",
      observed_readonly_capability_ids: [],
      dispatch: {
        kind: "ask_runtime",
        state: "completed",
        completed: true,
      },
      worker_turn_dispatched: true,
      spoken_relay_eligible: true,
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(final.reason_codes).toContain(
      "selected_runtime_model_turn_completed_without_gateway_observation",
    );
  });

  it("keeps a completed active-panel observation relay-eligible when solver intent is control_command", () => {
    const preliminary = buildAdmission(
      "What panel am I looking at?",
      "final-active-panel-control-label",
    );
    const final = resolveRealtimeFinalWorkerAdmission({
      preliminary,
      payload: {
        selected_agent_provider: "codex",
        language_model_policy: { resolved_model: "gpt-5.5" },
        workstation_gateway_call_results: [{
          capability_id: "workstation.active_context",
          ok: true,
          observation_packet: { status: "succeeded" },
        }],
      },
      solverTrace: {
        selected_primary_intent: "control_command",
        final_arbitration: { selected_route: "/ask" },
      },
      evidenceRefs: ["gateway-call:active-context"],
      nowMs: 200,
    });

    expect(preliminary).toMatchObject({
      outcome: "worker_grounded",
      action_candidate_capability_ids: [],
    });
    expect(final).toMatchObject({
      decision_phase: "solver_final",
      outcome: "worker_grounded",
      selected_primary_intent: "control_command",
      observed_readonly_capability_ids: ["workstation.active_context"],
      action_candidate_capability_ids: [],
      spoken_relay_eligible: true,
      workstation_action_execution_allowed: false,
      realtime_provider_tool_execution_allowed: false,
    });
    expect(final.reason_codes).toContain(
      "control_command_label_overridden_by_readonly_observation",
    );
    expect(final.reason_codes).not.toContain(
      "read_only_realtime_action_execution_forbidden",
    );
  });

  it("does not let an incidental read-only observation clear a real action candidate", () => {
    const preliminary = buildAdmission(
      "Run docs-viewer.open_doc for docs/research/example.md.",
      "final-action-with-read-observation",
    );
    const final = resolveRealtimeFinalWorkerAdmission({
      preliminary,
      payload: {
        workstation_gateway_call_results: [{
          capability_id: "workstation.active_context",
          ok: true,
          observation_packet: { status: "succeeded" },
        }],
      },
      solverTrace: { selected_primary_intent: "control_command" },
      nowMs: 200,
    });

    expect(preliminary.action_candidate_capability_ids).toContain("docs-viewer.open_doc");
    expect(final).toMatchObject({
      outcome: "action_candidate",
      spoken_relay_eligible: false,
      workstation_action_execution_allowed: false,
      realtime_provider_tool_execution_allowed: false,
    });
    expect(final.reason_codes).toContain("read_only_realtime_action_execution_forbidden");
    expect(final.reason_codes).not.toContain(
      "control_command_label_overridden_by_readonly_observation",
    );
  });
});
