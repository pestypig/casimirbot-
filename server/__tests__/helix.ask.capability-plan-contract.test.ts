import { describe, expect, it } from "vitest";
import { buildCapabilityPlan } from "../services/helix-ask/capability-planner";
import { buildCapabilityResultGate } from "../services/helix-ask/capability-result-gate";
import { buildToolCallAdmissionDecision } from "../services/helix-ask/tool-call-admission";
import { isAskCapabilityCatalogPrompt } from "../services/helix-ask/capability-catalog-intent";

const baseSourceTarget = (target_source: string, target_kind = target_source) => ({
  schema: "helix.ask_source_target_intent.v1",
  turn_id: "ask:capability",
  thread_id: "helix-ask:test",
  target_source,
  target_kind,
  strength: "hard",
  explicit_cues: [],
  reasons: [],
  requested_outputs: [],
  suppressed_routes: [],
  precedence_reason: "test",
  must_enter_backend_ask: true,
  allow_client_shortcut: false,
  allow_no_tool_direct: false,
  confidence: 0.9,
  assistant_answer: false,
  raw_content_included: false,
});

const toolAdmission = (sourceTarget: string, admitted: string[]) => ({
  schema: "helix.tool_call_admission_decision.v1",
  turn_id: "ask:capability",
  source_target: sourceTarget,
  required: admitted.length > 0,
  admitted_tool_families: admitted,
  forbidden_terminal_artifact_kinds: ["no_tool_direct", "model_only_concept"],
  forbidden_routes: [],
  reason: "test",
  assistant_answer: false,
  raw_content_included: false,
});

const canonicalGoal = (goal_kind: string, required_terminal_kind: string | null) => ({
  turn_id: "ask:capability",
  goal_kind,
  answer_scope: "current_turn_doc",
  required_terminal_kind,
  allows_workspace_context: true,
  allows_prior_artifacts: false,
  corpus_anchors: [],
  numeric_tokens: [],
  concept_tokens: [],
  confidence: "high",
  classifier_reasons: ["test"],
});

describe("Helix capability plan contract", () => {
  it("exposes repo-code.search_concept for internal concept questions", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:repo-concept",
      promptText: "What is the Situation Room?",
      sourceTargetIntent: baseSourceTarget("unknown", "unknown"),
      toolCallAdmissionDecision: toolAdmission("unknown", []),
      canonicalGoalFrame: canonicalGoal("model_only_concept", "direct_answer_text"),
    });

    expect(plan).toMatchObject({
      schema: "helix.capability_plan.v1",
      capability_family: "repo_evidence",
      requested_action: "repo-code.search_concept",
      mutating: false,
      operator_command_required: false,
      operator_command_present: false,
      source_target: "repo_code",
      goal_kind: "repo_concept_explanation",
      required_terminal_kind: "repo_code_evidence_answer",
      admission_status: "needs_evidence",
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("plans docs capability and only selects doc_open_receipt for doc-open canonical goals", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:docs-open",
      promptText: "Open the NH-M2 white paper from docs.",
      sourceTargetIntent: baseSourceTarget("docs_viewer"),
      toolCallAdmissionDecision: toolAdmission("docs_viewer", ["docs_viewer"]),
      canonicalGoalFrame: canonicalGoal("doc_open_best", "doc_open_receipt"),
    });

    expect(plan).toMatchObject({
      schema: "helix.capability_plan.v1",
      capability_family: "docs",
      requested_action: "open_or_validate_document",
      mutating: true,
      operator_command_required: true,
      operator_command_present: true,
      admission_status: "admitted",
      required_terminal_kind: "doc_open_receipt",
      assistant_answer: false,
      raw_content_included: false,
    });

    const result = buildCapabilityResultGate({
      plan,
      terminalArtifactKind: "doc_open_receipt",
      terminalArtifactId: "ask:docs-open:doc_open_receipt",
      currentTurnArtifacts: [
        {
          artifact_id: "ask:docs-open:doc_candidate_validation",
          kind: "doc_candidate_validation",
          turn_id: "ask:docs-open",
          payload: {
            schema: "helix.doc_candidate_validation.v1",
            evidence_refs: ["doc_candidate:nhm2"],
          },
        },
        {
          artifact_id: "ask:docs-open:doc_open_receipt",
          kind: "doc_open_receipt",
          turn_id: "ask:docs-open",
          payload: {
            kind: "doc_open_receipt",
            receipt_id: "ask:docs-open:doc_open_receipt",
          },
        },
      ],
      reenteredRefs: ["ask:docs-open:doc_candidate_validation", "ask:docs-open:doc_open_receipt"],
    });

    expect(result).toMatchObject({
      schema: "helix.capability_result.v1",
      status: "succeeded",
      receipt_refs: expect.arrayContaining(["ask:docs-open:doc_open_receipt"]),
      evidence_refs: expect.arrayContaining(["ask:docs-open:doc_candidate_validation", "doc_candidate:nhm2"]),
      selected_for_answer: true,
      reentered_solver: true,
      assistant_answer: false,
      raw_content_included: false,
    });

    const summaryOnlyPlan = buildCapabilityPlan({
      turnId: "ask:docs-summary",
      promptText: "Open the NH-M2 white paper from docs.",
      sourceTargetIntent: baseSourceTarget("docs_viewer"),
      toolCallAdmissionDecision: toolAdmission("docs_viewer", ["docs_viewer"]),
      canonicalGoalFrame: canonicalGoal("doc_summary", "doc_summary"),
    });
    const rejectedReceipt = buildCapabilityResultGate({
      plan: summaryOnlyPlan,
      terminalArtifactKind: "doc_open_receipt",
      terminalArtifactId: "ask:docs-summary:doc_open_receipt",
      currentTurnArtifacts: [
        {
          artifact_id: "ask:docs-summary:doc_open_receipt",
          kind: "doc_open_receipt",
          turn_id: "ask:docs-summary",
          payload: { kind: "doc_open_receipt", receipt_id: "ask:docs-summary:doc_open_receipt" },
        },
      ],
      reenteredRefs: ["ask:docs-summary:doc_open_receipt"],
    });

    expect(rejectedReceipt).toMatchObject({
      status: "failed",
      selected_for_answer: false,
      failure_reason: "receipt_terminal_without_goal_authority",
    });
  });

  it("treats a future click mention inside a visual review prompt as contextual, not an admitted workstation action", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:visual-before-click",
      promptText: "Review the current screen before I click Start.",
      sourceTargetIntent: baseSourceTarget("visual_capture"),
      toolCallAdmissionDecision: toolAdmission("visual_capture", ["situation_run"]),
      canonicalGoalFrame: canonicalGoal("situation_context_question", "situation_context_pack"),
    });

    expect(plan).toMatchObject({
      capability_family: "visual_capture",
      requested_action: "situation-room.describe_visual_capture",
      mutating: false,
      operator_command_required: false,
      operator_command_present: false,
      admission_status: "needs_evidence",
    });
    expect(plan.capability_family).not.toBe("workstation_action");
  });

  it("does not admit repo/docs tools for contextual docs-viewer open references", () => {
    const prompts = [
      ["Do not open the docs viewer; just explain what the docs viewer is for.", "negated_tool_instruction"],
      ["Explain what would happen if I opened the docs viewer.", "hypothetical_tool_reference"],
      ['"Open the docs viewer" is the command I typed; explain what it means.', "quoted_tool_command"],
      ["I opened the docs viewer earlier; what is it for?", "historical_tool_reference"],
    ] as const;

    for (const [promptText, suppressionReason] of prompts) {
      const plan = buildCapabilityPlan({
        turnId: "ask:contextual-docs-viewer",
        promptText,
        sourceTargetIntent: baseSourceTarget("model_only", "general_background"),
        toolCallAdmissionDecision: toolAdmission("model_only", ["model_only"]),
        canonicalGoalFrame: canonicalGoal("model_only_concept", "direct_answer_text"),
      });

      expect(plan).toMatchObject({
        capability_family: "debug_export",
        requested_action: "suppressed_contextual_tool_reference",
        selected_capability: "suppressed_contextual_tool_reference",
        source_target: "model_only",
        mutating: false,
        operator_command_required: false,
        operator_command_present: false,
        tool_admission_suppressed: true,
        suppression_reason: suppressionReason,
      });
      expect(plan.capability_family).not.toBe("repo_evidence");
      expect(plan.capability_family).not.toBe("docs");
    }
  });

  it("admits a workstation action only when the prompt contains the operator command and goal accepts action receipt", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:click-start",
      promptText: "Click Start and report whether the click was accepted.",
      sourceTargetIntent: baseSourceTarget("workstation_panel", "workstation_panel"),
      toolCallAdmissionDecision: toolAdmission("workstation_panel", []),
      canonicalGoalFrame: canonicalGoal("panel_control", "workspace_action_receipt"),
    });

    expect(plan).toMatchObject({
      capability_family: "workstation_action",
      requested_action: "click_or_activate_control",
      mutating: true,
      operator_command_required: true,
      operator_command_present: true,
      admission_status: "admitted",
      required_terminal_kind: "workspace_action_receipt",
    });

    const result = buildCapabilityResultGate({
      plan,
      terminalArtifactKind: "workspace_action_receipt",
      terminalArtifactId: "ask:click-start:workspace_action_receipt",
      currentTurnArtifacts: [
        {
          artifact_id: "ask:click-start:workspace_action_receipt",
          kind: "workspace_action_receipt",
          turn_id: "ask:click-start",
          payload: {
            kind: "workspace_action_receipt",
            receipt_id: "ask:click-start:workspace_action_receipt",
            status: "completed",
          },
        },
      ],
      reenteredRefs: ["ask:click-start:workspace_action_receipt"],
    });

    expect(result).toMatchObject({
      status: "succeeded",
      selected_for_answer: true,
      reentered_solver: true,
    });
  });

  it("routes set_rate history questions through debug evidence without admitting a new live-source mutation", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:set-rate-debug",
      promptText: "Why did the last turn call set_rate?",
      sourceTargetIntent: baseSourceTarget("runtime_evidence", "runtime_evidence"),
      toolCallAdmissionDecision: toolAdmission("runtime_evidence", ["runtime_evidence", "repo_code"]),
      canonicalGoalFrame: canonicalGoal("debug_diagnosis", "repo_code_evidence_answer"),
    });

    expect(plan).toMatchObject({
      capability_family: "debug_export",
      requested_action: "diagnose_debug_or_runtime_evidence",
      mutating: false,
      operator_command_required: false,
      operator_command_present: false,
      admission_status: "needs_evidence",
      source_target: "runtime_evidence",
    });
    expect(plan.capability_family).not.toBe("live_source");
  });

  it("routes Helix Ask tool availability prompts through the capability catalog contract", () => {
    for (const promptText of [
      "What tools are available for the helix ask to use?",
      "Could you tell me what tools Helix Ask can use?",
      "Can you show what capabilities this agent can access?",
    ]) {
      const admission = buildToolCallAdmissionDecision({
        turnId: "ask:capability-catalog",
        promptText,
        sourceTargetIntent: baseSourceTarget("runtime_evidence", "runtime_evidence"),
        canonicalGoalFrame: canonicalGoal("capability_help", "capability_help_summary"),
      });

      expect(admission).toMatchObject({
        source_target: "runtime_evidence",
        admitted_tool_families: expect.arrayContaining(["capability_catalog", "runtime_evidence"]),
        reason: "capability_catalog_prompt_requires_runtime_catalog_observation",
      });
      expect(admission.admitted_tool_families).not.toContain("model_only");

      const plan = buildCapabilityPlan({
        turnId: "ask:capability-catalog",
        promptText,
        sourceTargetIntent: baseSourceTarget("runtime_evidence", "runtime_evidence"),
        toolCallAdmissionDecision: admission,
        canonicalGoalFrame: canonicalGoal("capability_help", "capability_help_summary"),
      });

      expect(plan).toMatchObject({
        capability_family: "capability_catalog",
        requested_action: "helix_ask.inspect_capability_catalog",
        selected_capability: "helix_ask.inspect_capability_catalog",
        mutating: false,
        operator_command_required: false,
        operator_command_present: false,
        source_target: "runtime_evidence",
        goal_kind: "capability_help",
        required_terminal_kind: "capability_help_summary",
        admission_status: "needs_evidence",
        capability_contract_arbitration: expect.objectContaining({
          contract_state: "classifier_hypothesis",
          selected_source_target: "runtime_evidence",
          selected_plan_family: "capability_catalog",
          canonical_goal_kind: "capability_help",
          required_terminal_kind: "capability_help_summary",
        }),
      });
    }
  });

  it("does not execute capability catalog routing from contextual tool availability mentions", () => {
    const contextualPrompts = [
      'The document says "what tools are available for the helix ask to use"; summarize that label.',
      "Could we ask what tools Helix Ask can use later?",
      "The screen shows text saying what capabilities the agent can use.",
      "Do not list Helix Ask tools for now; just explain why that would be useful.",
    ];

    for (const promptText of contextualPrompts) {
      expect(isAskCapabilityCatalogPrompt(promptText)).toBe(false);
      const admission = buildToolCallAdmissionDecision({
        turnId: "ask:contextual-capability-catalog",
        promptText,
        sourceTargetIntent: baseSourceTarget("runtime_evidence", "runtime_evidence"),
        canonicalGoalFrame: canonicalGoal("debug_diagnosis", "repo_code_evidence_answer"),
      });
      expect(admission.admitted_tool_families).not.toContain("capability_catalog");

      const plan = buildCapabilityPlan({
        turnId: "ask:contextual-capability-catalog",
        promptText,
        sourceTargetIntent: baseSourceTarget("runtime_evidence", "runtime_evidence"),
        toolCallAdmissionDecision: admission,
        canonicalGoalFrame: canonicalGoal("debug_diagnosis", "repo_code_evidence_answer"),
      });
      expect(plan.capability_family).not.toBe("capability_catalog");
      expect(plan.selected_capability).not.toBe("helix_ask.inspect_capability_catalog");
    }
  });

  it("repairs forbidden live-source mailbox reads to the phase-allowed decision tool", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:mailbox-phase-record-decision",
      promptText: "Read the processed live source mail and decide whether the voice candidate should be called out.",
      sourceTargetIntent: baseSourceTarget("live_source_mailbox", "live_source_mailbox"),
      toolCallAdmissionDecision: toolAdmission("live_source_mailbox", ["live_environment"]),
      canonicalGoalFrame: canonicalGoal("live_source_processed_mail_interpretation", "model_synthesized_answer"),
      liveSourceTurnPhaseResolution: {
        artifactId: "live_source_turn_phase_resolution",
        schemaVersion: "live_source_turn_phase_resolution/v1",
        phase: "record_decision",
        canonicalGoal: "processed_mail_voice_decision",
        allowedTools: ["live_env.record_live_source_mail_decision"],
        forbiddenTools: [
          "live_env.read_processed_live_source_mail",
          "live_env.process_live_source_mail",
          "live_env.read_live_source_mail",
          "live_env.request_interim_voice_callout",
          "final_answer",
        ],
        requiredEvidence: ["stage_play_processed_mail_packet"],
        completionEvidence: ["stage_play_live_source_mail_decision"],
        phaseLock: {
          locked: false,
          reason: "Decision tool is allowed by the phase but not locked by metadata.",
        },
      },
    });

    expect(plan).toMatchObject({
      capability_family: "live_environment",
      requested_action: "live_env.record_live_source_mail_decision",
      selected_capability: "live_env.record_live_source_mail_decision",
      phase_repaired: true,
      phase_violation_reason: "live_source_phase_forbidden_capability_repaired",
      admission_status: "needs_evidence",
      source_target: "live_source_mailbox",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(plan.phase_constraint).toMatchObject({
      phase: "record_decision",
      allowed_tools: ["live_env.record_live_source_mail_decision"],
      forbidden_tools: expect.arrayContaining(["live_env.read_processed_live_source_mail"]),
      selected_before_repair: "live_env.read_processed_live_source_mail",
      selected_after_repair: "live_env.record_live_source_mail_decision",
    });
  });

  it("plans the read-only live-source mail-loop reflection tool for mailbox causality prompts", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:mail-loop-reflection",
      promptText:
        "Explain why the final answer feels disconnected from the processed mail loop and MicroDeck causality.",
      sourceTargetIntent: baseSourceTarget("live_source_mailbox", "live_source_mailbox"),
      toolCallAdmissionDecision: toolAdmission("live_source_mailbox", ["live_environment"]),
      canonicalGoalFrame: canonicalGoal("live_source_processed_mail_interpretation", "model_synthesized_answer"),
      liveSourceTurnPhaseResolution: {
        artifactId: "live_source_turn_phase_resolution",
        schemaVersion: "live_source_turn_phase_resolution/v1",
        phase: "reflect_mail_loop",
        reason: "Reflect causal mailbox loop.",
        canonicalGoal: "processed_mail_interpretation",
        allowedTools: ["live_env.reflect_live_source_mail_loop"],
        fallbackTools: [],
        forbiddenTools: [
          "live_env.read_processed_live_source_mail",
          "live_env.process_live_source_mail",
          "live_env.record_live_source_mail_decision",
          "live_env.request_interim_voice_callout",
          "final_answer",
        ],
        requiredEvidence: ["stage_play_live_source_mail_loop_reflection"],
        completionEvidence: ["stage_play_live_source_mail_loop_reflection"],
        nextPhase: "terminal_checkpoint",
        phaseLock: {
          locked: true,
          reason: "Mail-loop reflection is read-only causal inspection.",
        },
        evidenceRefs: [],
        assistant_answer: false,
        terminal_eligible: false,
        context_role: "tool_policy",
      },
    });

    expect(plan).toMatchObject({
      capability_family: "live_environment",
      requested_action: "live_env.reflect_live_source_mail_loop",
      selected_capability: "live_env.reflect_live_source_mail_loop",
      mutating: false,
      operator_command_required: false,
      admission_status: "needs_evidence",
      source_target: "live_source_mailbox",
    });
    expect(plan.phase_constraint).toMatchObject({
      phase: "reflect_mail_loop",
      allowed_tools: ["live_env.reflect_live_source_mail_loop"],
      forbidden_tools: expect.arrayContaining(["live_env.process_live_source_mail"]),
      selected_before_repair: "live_env.reflect_live_source_mail_loop",
      selected_after_repair: "live_env.reflect_live_source_mail_loop",
    });
  });

  it("lets hard mailbox wake route metadata outrank internet and repo capability cues", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:mailbox-hard-route-search-bait",
      promptText:
        "Review the latest Stage Play mailbox wake; do not browse the latest internet news or search the repo.",
      sourceTargetIntent: baseSourceTarget("unknown", "unknown"),
      toolCallAdmissionDecision: toolAdmission("unknown", []),
      canonicalGoalFrame: canonicalGoal("processed_mail_voice_decision", "model_synthesized_answer"),
      routeMetadata: {
        schema: "helix.ask.route_metadata.v1",
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:test",
        mailboxThreadId: "helix-ask:desktop",
        sourceTarget: "live_source_mailbox",
        requiredCanonicalGoal: "processed_mail_voice_decision",
        requiredPhase: "record_decision",
        allowedCapabilities: ["live_env.record_live_source_mail_decision"],
        forbiddenCapabilities: [
          "internet.search",
          "repo-code.search_concept",
          "live_env.read_processed_live_source_mail",
        ],
        evidenceRefs: ["stage_play_processed_mail_packet:test"],
      },
      liveSourceTurnPhaseResolution: {
        artifactId: "live_source_turn_phase_resolution",
        schemaVersion: "live_source_turn_phase_resolution/v1",
        phase: "record_decision",
        canonicalGoal: "processed_mail_voice_decision",
        allowedTools: ["live_env.record_live_source_mail_decision"],
        forbiddenTools: [
          "internet.search",
          "repo-code.search_concept",
          "live_env.read_processed_live_source_mail",
          "final_answer",
        ],
        requiredEvidence: ["stage_play_processed_mail_packet"],
        completionEvidence: ["stage_play_live_source_mail_decision"],
        phaseLock: {
          locked: true,
          reason: "Decision authority must be recorded before voice output.",
        },
      },
    });

    expect(plan).toMatchObject({
      capability_family: "live_environment",
      source_target: "live_source_mailbox",
      requested_action: "live_env.record_live_source_mail_decision",
      selected_capability: "live_env.record_live_source_mail_decision",
      admission_status: "needs_evidence",
      goal_kind: "processed_mail_voice_decision",
      required_terminal_kind: "model_synthesized_answer",
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(plan.capability_family).not.toBe("internet_search");
    expect(plan.capability_family).not.toBe("repo_evidence");
    expect(plan.selected_capability).not.toBe("internet.search");
    expect(plan.selected_capability).not.toBe("repo-code.search_concept");
  });

  it("does not inherit repo terminal contracts for hard mailbox wake route metadata", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:mailbox-hard-route-repo-terminal-bait",
      promptText:
        "Search the latest internet update, inspect repo-code.search_concept, describe the visual capture, or answer directly. Use the structured mailbox route metadata attached to this wake.",
      sourceTargetIntent: baseSourceTarget("live_source_mailbox", "live_source_mailbox"),
      toolCallAdmissionDecision: toolAdmission("live_source_mailbox", ["live_environment"]),
      canonicalGoalFrame: canonicalGoal("repo_concept_explanation", "repo_code_evidence_answer"),
      routeMetadata: {
        schema: "helix.ask.route_metadata.v1",
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:test-repo-bait",
        mailboxThreadId: "helix-ask:desktop",
        sourceTarget: "live_source_mailbox",
        requiredCanonicalGoal: "processed_mail_interpretation",
        requiredPhase: "read_mailbox",
        evidenceRefs: ["stage_play_processed_mail_packet:test-repo-bait"],
      },
      liveSourceTurnPhaseResolution: {
        artifactId: "live_source_turn_phase_resolution",
        schemaVersion: "live_source_turn_phase_resolution/v1",
        phase: "read_processed_mail",
        canonicalGoal: "processed_mail_interpretation",
        allowedTools: ["live_env.read_processed_live_source_mail"],
        forbiddenTools: ["repo-code.search_concept", "internet-search.search_web", "final_answer"],
        requiredEvidence: ["stage_play_processed_mail_packet"],
        completionEvidence: ["stage_play_processed_mail_packet"],
        phaseLock: {
          locked: true,
          reason: "Mailbox wake metadata requires the mailbox read phase.",
        },
      },
    });

    expect(plan).toMatchObject({
      capability_family: "live_environment",
      source_target: "live_source_mailbox",
      selected_capability: "live_env.read_processed_live_source_mail",
      goal_kind: "processed_mail_interpretation",
      required_terminal_kind: "model_synthesized_answer",
      admission_status: "needs_evidence",
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "hard_live_source_phase",
      selected_source_target: "live_source_mailbox",
      selected_plan_family: "live_environment",
      canonical_goal_kind: "processed_mail_interpretation",
      required_terminal_kind: "model_synthesized_answer",
    });
    expect(plan.required_terminal_kind).not.toBe("repo_code_evidence_answer");
  });

  it("does not inherit process graph or panel receipt terminal contracts for hard mailbox wake route metadata", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:mailbox-hard-route-process-graph-terminal-bait",
      promptText:
        "The Stage Play graph shows a process graph focus and a workspace action receipt, but use the structured mailbox route metadata attached to this wake.",
      sourceTargetIntent: baseSourceTarget("live_source_mailbox", "live_source_mailbox"),
      toolCallAdmissionDecision: toolAdmission("live_source_mailbox", ["live_environment"]),
      canonicalGoalFrame: canonicalGoal("panel_control", "workspace_action_receipt"),
      routeMetadata: {
        schema: "helix.ask.route_metadata.v1",
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:test-process-graph-bait",
        mailboxThreadId: "helix-ask:desktop",
        sourceTarget: "live_source_mailbox",
        requiredCanonicalGoal: "processed_mail_interpretation",
        requiredPhase: "read_processed_mail",
        evidenceRefs: ["stage_play_processed_mail_packet:test-process-graph-bait"],
      },
      liveSourceTurnPhaseResolution: {
        artifactId: "live_source_turn_phase_resolution",
        schemaVersion: "live_source_turn_phase_resolution/v1",
        phase: "read_processed_mail",
        canonicalGoal: "processed_mail_interpretation",
        allowedTools: ["live_env.read_processed_live_source_mail"],
        forbiddenTools: ["live_env.focus_process_graph", "workspace.click", "final_answer"],
        requiredEvidence: ["stage_play_processed_mail_packet"],
        completionEvidence: ["stage_play_processed_mail_packet"],
        phaseLock: {
          locked: true,
          reason: "Mailbox wake metadata requires mailbox evidence before any process-graph projection can inform the answer.",
        },
      },
    });

    expect(plan).toMatchObject({
      capability_family: "live_environment",
      source_target: "live_source_mailbox",
      selected_capability: "live_env.read_processed_live_source_mail",
      goal_kind: "processed_mail_interpretation",
      required_terminal_kind: "model_synthesized_answer",
      admission_status: "needs_evidence",
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "hard_live_source_phase",
      selected_source_target: "live_source_mailbox",
      selected_plan_family: "live_environment",
      canonical_goal_kind: "processed_mail_interpretation",
      required_terminal_kind: "model_synthesized_answer",
    });
    expect(plan.required_terminal_kind).not.toBe("workspace_action_receipt");
    expect(plan.selected_capability).not.toBe("live_env.focus_process_graph");
  });

  it("defaults hard mailbox wakes without a phase tool to processed mailbox reads", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:mailbox-hard-route-default-read",
      promptText: "Review the latest current mailbox wake and search nothing else.",
      sourceTargetIntent: baseSourceTarget("unknown", "unknown"),
      toolCallAdmissionDecision: toolAdmission("unknown", []),
      canonicalGoalFrame: canonicalGoal("processed_mail_interpretation", "model_synthesized_answer"),
      routeMetadata: {
        schema: "helix.ask.route_metadata.v1",
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:test-default",
        mailboxThreadId: "helix-ask:desktop",
        sourceTarget: "live_source_mailbox",
        requiredCanonicalGoal: "processed_mail_interpretation",
        evidenceRefs: ["stage_play_processed_mail_packet:test-default"],
      },
    });

    expect(plan).toMatchObject({
      capability_family: "live_environment",
      source_target: "live_source_mailbox",
      requested_action: "live_env.read_processed_live_source_mail",
      selected_capability: "live_env.read_processed_live_source_mail",
      admission_status: "needs_evidence",
    });
    expect(plan.capability_family).not.toBe("internet_search");
    expect(plan.capability_family).not.toBe("repo_evidence");
  });

  it("uses the first phase-allowed tool for hard mailbox wakes before defaulting", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:mailbox-hard-route-allowed-tool",
      promptText: "Review the mailbox wake and do not search anything.",
      sourceTargetIntent: baseSourceTarget("unknown", "unknown"),
      toolCallAdmissionDecision: toolAdmission("unknown", []),
      canonicalGoalFrame: canonicalGoal("processed_mail_interpretation", "model_synthesized_answer"),
      routeMetadata: {
        schema: "helix.ask.route_metadata.v1",
        invocationKind: "stage_play_mail_wake",
        wakeRequestId: "stage_play_live_source_mail_wake:test-allowed",
        mailboxThreadId: "helix-ask:desktop",
        sourceTarget: "live_source_mailbox",
        requiredCanonicalGoal: "processed_mail_interpretation",
        evidenceRefs: ["stage_play_processed_mail_packet:test-allowed"],
      },
      liveSourceTurnPhaseResolution: {
        artifactId: "live_source_turn_phase_resolution",
        schemaVersion: "live_source_turn_phase_resolution/v1",
        phase: "read_processed_mail",
        canonicalGoal: "processed_mail_interpretation",
        allowedTools: ["live_env.read_processed_live_source_mail"],
        forbiddenTools: ["internet.search", "repo-code.search_concept", "final_answer"],
        requiredEvidence: [],
        completionEvidence: ["stage_play_processed_mail_packet"],
        phaseLock: {
          locked: false,
          reason: "Read phase is allowed but not locked.",
        },
      },
    });

    expect(plan).toMatchObject({
      capability_family: "live_environment",
      source_target: "live_source_mailbox",
      requested_action: "live_env.read_processed_live_source_mail",
      selected_capability: "live_env.read_processed_live_source_mail",
      admission_status: "needs_evidence",
    });
    expect(plan.capability_family).not.toBe("internet_search");
    expect(plan.capability_family).not.toBe("repo_evidence");
  });

  it("lets explicit calculator capability beat hard live-source mailbox route metadata", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:explicit-calculator-not-mailbox",
      promptText:
        "Use scientific-calculator.solve_expression to evaluate 2 + 2 and return the workstation_tool_evaluation.",
      sourceTargetIntent: baseSourceTarget("unknown", "unknown"),
      toolCallAdmissionDecision: toolAdmission("live_source_mailbox", ["live_environment"]),
      canonicalGoalFrame: canonicalGoal("live_source_processed_mail_interpretation", "model_synthesized_answer"),
      routeMetadata: {
        schema: "helix.ask.route_metadata.v1",
        invocationKind: "stage_play_mail_wake",
        sourceTarget: "live_source_mailbox",
        requiredPhase: "read_processed_mail",
      },
      liveSourceTurnPhaseResolution: {
        artifactId: "live_source_turn_phase_resolution",
        schemaVersion: "live_source_turn_phase_resolution/v1",
        phase: "read_processed_mail",
        allowedTools: ["live_env.read_processed_live_source_mail"],
        forbiddenTools: ["scientific-calculator.solve_expression", "final_answer"],
        requiredEvidence: ["stage_play_processed_mail_packet"],
        completionEvidence: ["stage_play_processed_mail_packet"],
        phaseLock: {
          locked: false,
          reason: "Fixture only verifies explicit calculator dominance.",
        },
      },
    });

    expect(plan).toMatchObject({
      capability_family: "workstation_action",
      source_target: "calculator_stream",
      requested_capability: "scientific-calculator.solve_expression",
      requested_action: "scientific-calculator.solve_expression",
      selected_capability: "scientific-calculator.solve_expression",
      goal_kind: "calculator_solve",
      required_terminal_kind: "workstation_tool_evaluation",
    });
    expect(plan.phase_repaired).toBeUndefined();
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "explicit_capability_command",
      route_metadata_demoted: true,
      demotion_reason: "explicit_capability_contract_demoted_route_metadata",
    });
  });

  it("lets explicit workspace status capability beat stale model-only canonical goal", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:workspace-status-explicit",
      promptText: "Use workspace_os.status to inspect workstation status.",
      sourceTargetIntent: baseSourceTarget("model_only", "general_background"),
      toolCallAdmissionDecision: toolAdmission("model_only", ["model_only"]),
      canonicalGoalFrame: canonicalGoal("model_only_concept", "direct_answer_text"),
    });

    expect(plan).toMatchObject({
      capability_family: "workspace_diagnostic",
      source_target: "workspace_diagnostic",
      requested_capability: "workspace_os.status",
      requested_action: "workspace_os.status",
      selected_capability: "workspace_os.status",
      goal_kind: "workspace_status_diagnostic",
      required_terminal_kind: "model_synthesized_answer",
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "explicit_capability_command",
      requested_capability: "workspace_os.status",
    });
  });

  it("routes explicit narrator say through a governed live-environment control contract", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:narrator-say-explicit",
      promptText:
        'Run live_env.narrator_say goal_id=goal:translate text="Translation is now routed through Narrator." source_id=helix_ask:translation delivery_mode=confirm_to_speak.',
      sourceTargetIntent: baseSourceTarget("model_only", "general_background"),
      toolCallAdmissionDecision: toolAdmission("live_environment", ["live_environment"]),
      canonicalGoalFrame: canonicalGoal("model_only_concept", "direct_answer_text"),
    });

    expect(plan).toMatchObject({
      capability_family: "live_environment",
      source_target: "live_environment",
      requested_capability: "live_env.narrator_say",
      requested_action: "live_env.narrator_say",
      selected_capability: "live_env.narrator_say",
      goal_kind: "live_environment_review",
      required_terminal_kind: "helix.narrator_say_request.v1",
      mutating: true,
      operator_command_required: true,
      operator_command_present: true,
      admission_status: "needs_evidence",
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "explicit_capability_command",
      requested_capability: "live_env.narrator_say",
      selected_source_target: "live_environment",
      selected_plan_family: "live_environment",
      required_observation_kinds: expect.arrayContaining([
        "live_environment_tool_observation",
        "helix.narrator_say_request.v1",
      ]),
    });
  });

  it("routes explicit narrator stream binding through a governed non-terminal request contract", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:narrator-bind-stream-explicit",
      promptText:
        "Run live_env.narrator_bind_stream goal_id=goal:translate source_ref=source:browser-audio stream_kind=translated_transcript delivery_mode=visible_only.",
      sourceTargetIntent: baseSourceTarget("live_source_mailbox", "live_source_mailbox"),
      toolCallAdmissionDecision: toolAdmission("live_environment", ["live_environment"]),
      canonicalGoalFrame: canonicalGoal("live_source_processed_mail_interpretation", "model_synthesized_answer"),
      routeMetadata: {
        schema: "helix.ask.route_metadata.v1",
        invocationKind: "stage_play_mail_wake",
        sourceTarget: "live_source_mailbox",
        requiredPhase: "read_processed_mail",
      },
    });

    expect(plan).toMatchObject({
      capability_family: "live_environment",
      source_target: "live_environment",
      requested_capability: "live_env.narrator_bind_stream",
      requested_action: "live_env.narrator_bind_stream",
      selected_capability: "live_env.narrator_bind_stream",
      goal_kind: "live_environment_review",
      required_terminal_kind: "helix.narrator_bind_stream_request.v1",
      mutating: true,
      operator_command_present: true,
      admission_status: "needs_evidence",
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "explicit_capability_command",
      requested_capability: "live_env.narrator_bind_stream",
      route_metadata_demoted: true,
      demotion_reason: "explicit_capability_contract_demoted_route_metadata",
    });
  });

  it("routes explicit goal-satisfaction evaluation through a governed evidence-only contract", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:goal-satisfaction-explicit",
      promptText:
        "Run live_env.evaluate_goal_satisfaction goal_id=goal:frog evidence_refs=goal_context_update:frog,terminal_authority_single_writer.",
      sourceTargetIntent: baseSourceTarget("model_only", "general_background"),
      toolCallAdmissionDecision: toolAdmission("live_environment", ["live_environment"]),
      canonicalGoalFrame: canonicalGoal("model_only_concept", "direct_answer_text"),
    });

    expect(plan).toMatchObject({
      capability_family: "live_environment",
      source_target: "live_environment",
      requested_capability: "live_env.evaluate_goal_satisfaction",
      requested_action: "live_env.evaluate_goal_satisfaction",
      selected_capability: "live_env.evaluate_goal_satisfaction",
      goal_kind: "live_environment_review",
      required_terminal_kind: "helix.live_environment_goal_satisfaction.v1",
      mutating: false,
      admission_status: "needs_evidence",
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "explicit_capability_command",
      requested_capability: "live_env.evaluate_goal_satisfaction",
      selected_source_target: "live_environment",
      selected_plan_family: "live_environment",
      required_observation_kinds: expect.arrayContaining([
        "live_environment_tool_observation",
        "helix.live_environment_goal_satisfaction.v1",
      ]),
    });
  });

  it.each([
    {
      label: "source health",
      capability: "live_env.query_source_health",
      observationKind: "helix.situation_source_capability_read.v1",
      prompt: "Run live_env.query_source_health goal_id=goal:frog source_ref=source:visual:active.",
    },
    {
      label: "trace memory",
      capability: "live_env.query_trace_memory",
      observationKind: "helix.workstation_reasoning_trace_query_result.v1",
      prompt: "Run live_env.query_trace_memory goal_id=goal:frog trace_id=trace:frog.",
    },
    {
      label: "packet traces",
      capability: "live_env.query_packet_traces",
      observationKind: "stage_play_packet_trace_query_result/v1",
      prompt: "Run live_env.query_packet_traces goal_id=goal:frog source_ref=source:visual:active.",
    },
    {
      label: "visual summaries",
      capability: "live_env.query_visual_summaries",
      observationKind: "stage_play_workstation_context_feed_query_result/v1",
      prompt: "Run live_env.query_visual_summaries goal_id=goal:frog source_ref=source:visual:active.",
    },
    {
      label: "audio transcripts",
      capability: "live_env.query_audio_transcripts",
      observationKind: "stage_play_workstation_context_feed_query_result/v1",
      prompt: "Run live_env.query_audio_transcripts goal_id=goal:translate source_ref=source:audio:active.",
    },
    {
      label: "translation segments",
      capability: "live_env.query_translation_segments",
      observationKind: "stage_play_workstation_context_feed_query_result/v1",
      prompt: "Run live_env.query_translation_segments goal_id=goal:translate source_ref=source:audio:active.",
    },
    {
      label: "MicroDeck outputs",
      capability: "live_env.query_microdeck_outputs",
      observationKind: "stage_play_workstation_context_feed_query_result/v1",
      prompt: "Run live_env.query_microdeck_outputs goal_id=goal:frog source_ref=source:visual:active.",
    },
    {
      label: "Live Answer state",
      capability: "live_env.query_live_answer_state",
      observationKind: "stage_play_workstation_context_feed_query_result/v1",
      prompt: "Run live_env.query_live_answer_state goal_id=goal:frog source_ref=live-answer:visual.",
    },
    {
      label: "narrator events",
      capability: "live_env.query_narrator_events",
      observationKind: "stage_play_workstation_context_feed_query_result/v1",
      prompt: "Run live_env.query_narrator_events goal_id=goal:translate source_ref=narrator:translation.",
    },
    {
      label: "route evidence",
      capability: "live_env.query_route_evidence",
      observationKind: "stage_play_workstation_context_feed_query_result/v1",
      prompt: "Run live_env.query_route_evidence goal_id=goal:frog source_ref=route-watch:frog.",
    },
    {
      label: "automation policies",
      capability: "live_env.query_automation_policies",
      observationKind: "stage_play_workstation_context_feed_query_result/v1",
      prompt: "Run live_env.query_automation_policies goal_id=goal:frog source_ref=automation:frog-watch.",
    },
  ])("routes explicit workstation query contract: $label", ({ prompt, capability, observationKind }) => {
    const plan = buildCapabilityPlan({
      turnId: `ask:${capability.replace(/[^a-z0-9]+/gi, "-")}`,
      promptText: prompt,
      sourceTargetIntent: baseSourceTarget("model_only", "general_background"),
      toolCallAdmissionDecision: toolAdmission("live_environment", ["live_environment"]),
      canonicalGoalFrame: canonicalGoal("model_only_concept", "direct_answer_text"),
    });

    expect(plan).toMatchObject({
      capability_family: "live_environment",
      source_target: "live_environment",
      requested_capability: capability,
      requested_action: capability,
      selected_capability: capability,
      goal_kind: "live_environment_review",
      required_terminal_kind: "model_synthesized_answer",
      mutating: false,
      admission_status: "needs_evidence",
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "explicit_capability_command",
      requested_capability: capability,
      selected_source_target: "live_environment",
      selected_plan_family: "live_environment",
      required_observation_kinds: expect.arrayContaining([
        "live_environment_tool_observation",
        observationKind,
        "helix.workstation_goal_context_update.v1",
      ]),
      required_terminal_kind: "model_synthesized_answer",
    });
  });

  it("suppresses contextual narrator capability mentions instead of admitting voice control", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:narrator-contextual-reference",
      promptText: "Do not run live_env.narrator_say; explain what the narrator policy would require first.",
      sourceTargetIntent: baseSourceTarget("live_environment", "live_environment"),
      toolCallAdmissionDecision: toolAdmission("live_environment", ["live_environment"]),
      canonicalGoalFrame: canonicalGoal("live_environment_review", "direct_answer_text"),
      routeMetadata: {
        schema: "helix.ask.route_metadata.v1",
        sourceTarget: "live_environment",
        mandatoryNextTool: { name: "live_env.narrator_say" },
      },
    });

    expect(plan).toMatchObject({
      capability_family: "debug_export",
      source_target: "model_only",
      requested_action: "suppressed_contextual_tool_reference",
      selected_capability: "suppressed_contextual_tool_reference",
      tool_admission_suppressed: true,
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "suppressed_contextual_reference",
      route_metadata_demoted: true,
      demotion_reason: "contextual_tool_reference_demoted_route_metadata",
    });
  });

  it.each([
    {
      label: "preset change",
      prompt:
        "Run live_env.change_workstation_preset goal_id=goal:frog target_ref=source:visual:active preset_id=preset:frog-classifier.",
      capability: "live_env.change_workstation_preset",
      terminalKind: "stage_play_workstation_control_receipt",
    },
    {
      label: "visual preset change",
      prompt:
        "Run live_env.set_visual_preset goal_id=goal:frog target_ref=source:visual:active preset_id=preset:frog-classifier.",
      capability: "live_env.set_visual_preset",
      terminalKind: "stage_play_workstation_control_receipt",
    },
    {
      label: "audio preset change",
      prompt:
        "Run live_env.set_audio_preset goal_id=goal:translate target_ref=source:audio:active preset_id=preset:earbud-translation.",
      capability: "live_env.set_audio_preset",
      terminalKind: "stage_play_workstation_control_receipt",
    },
    {
      label: "source bind",
      prompt:
        "Run live_env.bind_workstation_source goal_id=goal:frog source_ref=source:visual:active target_ref=live-answer:visual.",
      capability: "live_env.bind_workstation_source",
      terminalKind: "stage_play_workstation_control_receipt",
    },
    {
      label: "source unbind",
      prompt:
        "Run live_env.unbind_workstation_source goal_id=goal:frog source_ref=source:visual:active.",
      capability: "live_env.unbind_workstation_source",
      terminalKind: "stage_play_workstation_control_receipt",
    },
    {
      label: "loop pause",
      prompt:
        "Run live_env.pause_workstation_loop goal_id=goal:frog loop_ref=loop:visual-mail.",
      capability: "live_env.pause_workstation_loop",
      terminalKind: "stage_play_workstation_control_receipt",
    },
    {
      label: "loop resume",
      prompt:
        "Run live_env.resume_workstation_loop goal_id=goal:frog loop_ref=loop:visual-mail.",
      capability: "live_env.resume_workstation_loop",
      terminalKind: "stage_play_workstation_control_receipt",
    },
    {
      label: "loop state",
      prompt:
        "Run live_env.set_workstation_loop_state goal_id=goal:frog loop_ref=loop:visual-mail state=paused.",
      capability: "live_env.set_workstation_loop_state",
      terminalKind: "stage_play_workstation_control_receipt",
    },
    {
      label: "loop repair",
      prompt:
        "Run live_env.repair_loop goal_id=goal:frog loop_ref=loop:visual-mail.",
      capability: "live_env.repair_loop",
      terminalKind: "stage_play_workstation_control_receipt",
    },
    {
      label: "source repair",
      prompt:
        "Run live_env.repair_workstation_source goal_id=goal:frog loop_ref=loop:visual-mail.",
      capability: "live_env.repair_workstation_source",
      terminalKind: "stage_play_workstation_control_receipt",
    },
    {
      label: "Live Answer projection",
      prompt:
        "Run live_env.update_live_answer_projection goal_id=goal:frog line_key=translation.",
      capability: "live_env.update_live_answer_projection",
      terminalKind: "stage_play_workstation_control_receipt",
    },
    {
      label: "process graph focus",
      prompt:
        "Run live_env.focus_process_graph goal_id=goal:frog node_ref=packet:visual-shade.",
      capability: "live_env.focus_process_graph",
      terminalKind: "stage_play_workstation_control_receipt",
    },
    {
      label: "agent goal session",
      prompt:
        "Run live_env.start_agent_goal_session goal_id=goal:frog objective=\"Monitor visual frog classification.\"",
      capability: "live_env.start_agent_goal_session",
      terminalKind: "stage_play_agent_goal_session_tool_result",
    },
  ])("routes explicit workstation control contract: $label", ({ prompt, capability, terminalKind }) => {
    const plan = buildCapabilityPlan({
      turnId: `ask:${capability.replace(/[^a-z0-9]+/gi, "-")}`,
      promptText: prompt,
      sourceTargetIntent: baseSourceTarget("model_only", "general_background"),
      toolCallAdmissionDecision: toolAdmission("live_environment", ["live_environment"]),
      canonicalGoalFrame: canonicalGoal("model_only_concept", "direct_answer_text"),
    });

    expect(plan).toMatchObject({
      capability_family: "live_environment",
      source_target: "live_environment",
      requested_capability: capability,
      requested_action: capability,
      selected_capability: capability,
      goal_kind: "live_environment_review",
      required_terminal_kind: terminalKind,
      mutating: true,
      operator_command_required: true,
      operator_command_present: true,
      admission_status: "needs_evidence",
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "explicit_capability_command",
      requested_capability: capability,
      selected_source_target: "live_environment",
      selected_plan_family: "live_environment",
      required_observation_kinds: expect.arrayContaining([
        "live_environment_tool_observation",
        terminalKind,
      ]),
      required_terminal_kind: terminalKind,
    });
  });

  it.each([
    {
      prompt:
        "Do not run live_env.query_visual_summaries; explain what evidence would be needed first.",
      mandatory: "live_env.query_visual_summaries",
    },
    {
      prompt:
        'The UI label says "live_env.query_narrator_events"; summarize that label without querying anything.',
      mandatory: "live_env.query_narrator_events",
    },
    {
      prompt:
        "If we run live_env.query_trace_memory later, what trace refs should we gather?",
      mandatory: "live_env.query_trace_memory",
    },
    {
      prompt:
        "Do not run live_env.change_workstation_preset; explain what evidence would be needed first.",
      mandatory: "live_env.change_workstation_preset",
    },
    {
      prompt:
        "If we run live_env.set_visual_preset later, what target_ref and preset_id should we gather?",
      mandatory: "live_env.set_visual_preset",
    },
    {
      prompt:
        'The UI label says "live_env.focus_process_graph"; summarize that label without focusing anything.',
      mandatory: "live_env.focus_process_graph",
    },
    {
      prompt:
        "If we run live_env.repair_loop later, what loop refs should we gather?",
      mandatory: "live_env.repair_loop",
    },
    {
      prompt:
        "If we run live_env.repair_workstation_source later, what loop refs should we gather?",
      mandatory: "live_env.repair_workstation_source",
    },
  ])("suppresses contextual workstation control mention: $mandatory", ({ prompt, mandatory }) => {
    const plan = buildCapabilityPlan({
      turnId: `ask:contextual-${mandatory.replace(/[^a-z0-9]+/gi, "-")}`,
      promptText: prompt,
      sourceTargetIntent: baseSourceTarget("live_environment", "live_environment"),
      toolCallAdmissionDecision: toolAdmission("live_environment", ["live_environment"]),
      canonicalGoalFrame: canonicalGoal("live_environment_review", "direct_answer_text"),
      routeMetadata: {
        schema: "helix.ask.route_metadata.v1",
        sourceTarget: "live_environment",
        mandatoryNextTool: { name: mandatory },
      },
    });

    expect(plan).toMatchObject({
      capability_family: "debug_export",
      source_target: "model_only",
      requested_action: "suppressed_contextual_tool_reference",
      selected_capability: "suppressed_contextual_tool_reference",
      tool_admission_suppressed: true,
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "suppressed_contextual_reference",
      route_metadata_demoted: true,
      demotion_reason: "contextual_tool_reference_demoted_route_metadata",
    });
  });

  it("maps explicit ImageLens inspection to the governed visual-capture runtime capability", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:image-lens-explicit",
      promptText: "Use image_lens.inspect to inspect the current ImageLens visual source.",
      sourceTargetIntent: baseSourceTarget("model_only", "general_background"),
      toolCallAdmissionDecision: toolAdmission("model_only", ["model_only"]),
      canonicalGoalFrame: canonicalGoal("model_only_concept", "direct_answer_text"),
    });

    expect(plan).toMatchObject({
      capability_family: "visual_capture",
      source_target: "visual_capture",
      requested_capability: "image_lens.inspect",
      requested_action: "situation-room.describe_visual_capture",
      selected_capability: "situation-room.describe_visual_capture",
      goal_kind: "visual_capture_describe",
      required_terminal_kind: "situation_context_pack",
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "explicit_capability_command",
      requested_capability: "image_lens.inspect",
      selected_source_target: "visual_capture",
      selected_plan_family: "visual_capture",
      canonical_goal_kind: "visual_capture_describe",
      required_observation_kinds: expect.arrayContaining([
        "visual_frame_evidence",
        "situation_context_pack",
        "visual_capture_coverage",
      ]),
      required_terminal_kind: "situation_context_pack",
    });
  });

  it("lets explicit docs locate capability beat stale panel-control canonical goal", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:docs-locate-explicit",
      promptText: "Use docs-viewer.locate_in_doc, not summarize_doc, to locate the Codex parity claim.",
      sourceTargetIntent: baseSourceTarget("workstation_panel", "panel_control"),
      toolCallAdmissionDecision: toolAdmission("workstation_panel", ["workstation_action"]),
      canonicalGoalFrame: canonicalGoal("panel_control", "workspace_action_receipt"),
    });

    expect(plan).toMatchObject({
      capability_family: "docs",
      source_target: "docs_viewer",
      requested_capability: "docs-viewer.locate_in_doc",
      requested_action: "docs-viewer.locate_in_doc",
      selected_capability: "docs-viewer.locate_in_doc",
      goal_kind: "locate_in_doc",
      required_terminal_kind: "doc_location_matches",
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "explicit_capability_command",
      requested_capability: "docs-viewer.locate_in_doc",
    });
  });

  it("keeps exact docs locate commands explicit when the prompt also asks for explanation", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:docs-locate-explain-explicit",
      promptText:
        "Use docs-viewer.locate_in_doc to find where docs/helix-ask-codex-loop-discipline.md says receipts are observations, not answers. Explain the rule using only the docs-viewer observation and cite the line-backed evidence.",
      sourceTargetIntent: {
        ...baseSourceTarget("model_only", "general_background"),
        reasons: ["explicit_model_only_target", "negative_workspace_scope"],
      },
      toolCallAdmissionDecision: toolAdmission("model_only", ["model_only"]),
      canonicalGoalFrame: canonicalGoal("model_only_concept", "direct_answer_text"),
    });

    expect(plan).toMatchObject({
      capability_family: "docs",
      source_target: "docs_viewer",
      requested_capability: "docs-viewer.locate_in_doc",
      requested_action: "docs-viewer.locate_in_doc",
      selected_capability: "docs-viewer.locate_in_doc",
      goal_kind: "locate_in_doc",
      required_terminal_kind: "doc_location_matches",
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "explicit_capability_command",
      requested_capability: "docs-viewer.locate_in_doc",
      selected_source_target: "docs_viewer",
      selected_plan_family: "docs",
    });
  });

  it("lets negated calculator references suppress hard calculator metadata", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:negated-calculator-reference",
      promptText:
        "Do not call any tools. Explain what evidence would be needed before running scientific-calculator.solve_expression.",
      sourceTargetIntent: baseSourceTarget("calculator_stream", "calculator_stream"),
      toolCallAdmissionDecision: toolAdmission("calculator_stream", ["calculator", "workstation_action"]),
      canonicalGoalFrame: canonicalGoal("calculator_solve", "workstation_tool_evaluation"),
      routeMetadata: {
        schema: "helix.ask.route_metadata.v1",
        sourceTarget: "calculator_stream",
        mandatoryNextTool: { name: "scientific-calculator.solve_expression" },
      },
    });

    expect(plan).toMatchObject({
      capability_family: "debug_export",
      source_target: "model_only",
      requested_action: "suppressed_contextual_tool_reference",
      selected_capability: "suppressed_contextual_tool_reference",
      goal_kind: "model_only_concept",
      required_terminal_kind: "direct_answer_text",
      tool_admission_suppressed: true,
    });
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "suppressed_contextual_reference",
      route_metadata_demoted: true,
      demotion_reason: "contextual_tool_reference_demoted_route_metadata",
    });
  });

  it("lets explicit calculator capability beat negated live-source mailbox cues", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:explicit-calculator-not-live-mailbox",
      promptText:
        "Do not use live source mail. Use scientific-calculator.solve_expression to evaluate 2 + 2 and return the workstation_tool_evaluation.",
      sourceTargetIntent: baseSourceTarget("live_source_mailbox", "live_source_mailbox"),
      toolCallAdmissionDecision: toolAdmission("live_source_mailbox", ["live_environment"]),
      canonicalGoalFrame: canonicalGoal("live_source_processed_mail_interpretation", "model_synthesized_answer"),
      routeMetadata: {
        schema: "helix.ask.route_metadata.v1",
        invocationKind: "stage_play_mail_wake",
        sourceTarget: "live_source_mailbox",
        requiredPhase: "read_processed_mail",
      },
      liveSourceTurnPhaseResolution: {
        artifactId: "live_source_turn_phase_resolution",
        schemaVersion: "live_source_turn_phase_resolution/v1",
        phase: "read_processed_mail",
        allowedTools: ["live_env.read_processed_live_source_mail"],
        forbiddenTools: ["scientific-calculator.solve_expression", "final_answer"],
        requiredEvidence: ["stage_play_processed_mail_packet"],
        completionEvidence: ["stage_play_processed_mail_packet"],
        phaseLock: {
          locked: false,
          reason: "Fixture verifies explicit calculator dominance over negated live-source cue.",
        },
      },
    });

    expect(plan).toMatchObject({
      source_target: "calculator_stream",
      requested_capability: "scientific-calculator.solve_expression",
      selected_capability: "scientific-calculator.solve_expression",
      goal_kind: "calculator_solve",
      required_terminal_kind: "workstation_tool_evaluation",
    });
    expect(plan.phase_repaired).toBeUndefined();
    expect(plan.capability_contract_arbitration).toMatchObject({
      contract_state: "explicit_capability_command",
      route_metadata_demoted: true,
    });
  });

  it("plans selected context attachments through context reflection", () => {
    const plan = buildCapabilityPlan({
      turnId: "ask:context-reflection",
      promptText: "Use this microreasoner cutout as context for the next prompt.",
      sourceTargetIntent: {
        ...baseSourceTarget("context_reflection", "context_attachment"),
        requested_outputs: ["context_attachment_reflection", "bounded_context_reference"],
      },
      toolCallAdmissionDecision: toolAdmission("context_reflection", ["context_reflection"]),
      canonicalGoalFrame: canonicalGoal("context_attachment_reflection", "model_synthesized_answer"),
    });

    expect(plan).toMatchObject({
      capability_family: "context_reflection",
      requested_action: "helix_ask.reflect_context_attachments",
      selected_capability: "helix_ask.reflect_context_attachments",
      mutating: false,
      operator_command_required: false,
      operator_command_present: true,
      source_target: "context_reflection",
      admission_status: "needs_evidence",
    });
  });
});
