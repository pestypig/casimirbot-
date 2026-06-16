import { describe, expect, it } from "vitest";

import { buildAskTurnSolverTrace, evaluateAskTurnSolverHardGate } from "../services/helix-ask/ask-turn-solver";
import {
  assertCapabilityAllowedByCommittedRoute,
  buildCommittedAskRoute,
  committedRouteAllowsTerminalKind,
} from "../services/helix-ask/committed-ask-route";
import { interpretHelixAskPrompt } from "../services/helix-ask/prompt-interpretation";
import { auditRouteAuthority } from "../services/helix-ask/route-authority-audit";
import { resolveTerminalAnswerEnvelope } from "../services/helix-ask/terminal-answer-envelope";
import { applyHelixTerminalAuthoritySingleWriter } from "../services/helix-ask/terminal-authority-single-writer";
import { inferFinalAnswerDraftRouteFamily } from "../services/helix-ask/final-answer-draft-quality-gate";
import { buildHelixModelTurnPacket } from "../services/helix-ask/model-turn-packet";
import { runHelixModelTurnToolContinuation } from "../services/helix-ask/model-turn-tool-continuation";

const turnId = "ask:test:committed-route";
const promptText =
  "Compare docs/helix-ask-flow.md and docs/helix-ask-codex-loop-discipline.md in a two-column table.";

const docsSourceTarget = {
  schema: "helix.ask_source_target_intent.v1",
  turn_id: turnId,
  thread_id: "thread:test",
  target_source: "docs_viewer",
  target_kind: "docs_viewer",
  strength: "hard",
  explicit_cues: ["docs_path_compare"],
  reasons: ["explicit_docs_path_compare_source_target"],
  requested_outputs: ["file_path", "tool_call_eligibility"],
  suppressed_routes: ["repo_code_evidence_question", "model_only_concept"],
  precedence_reason: "explicit_docs_path_compare_source_target",
  must_enter_backend_ask: true,
  allow_client_shortcut: false,
  allow_no_tool_direct: false,
  confidence: 0.99,
  assistant_answer: false,
  raw_content_included: false,
};

const docsRouteContract = {
  schema: "helix.route_product_contract.v1",
  turn_id: turnId,
  thread_id: "thread:test",
  source_target: "docs_viewer",
  allowed_terminal_artifact_kinds: ["doc_evidence_synthesis", "typed_failure", "request_user_input"],
  forbidden_terminal_artifact_kinds: ["direct_answer_text", "model_only_concept"],
  required_artifact_refs: [],
  precedence_reason: "explicit_docs_path_compare_source_target",
  assistant_answer: false,
  raw_content_included: false,
};

describe("Helix Ask committed route contract", () => {
  it("records docs route versus stale model-only goal as incompatible", () => {
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      active_prompt: promptText,
      source_target_intent: docsSourceTarget,
      route_product_contract: docsRouteContract,
      canonical_goal_frame: {
        turn_id: turnId,
        goal_kind: "model_only_concept",
        required_terminal_kind: "direct_answer_text",
      },
      tool_call_admission_decision: {
        admitted_tool_families: ["docs_viewer"],
      },
    };

    const trace = buildAskTurnSolverTrace({
      turnId,
      promptText,
      selectedRoute: "docs_viewer.local_docs_path_compare",
      terminalArtifactKind: "direct_answer_text",
      finalAnswerSource: "model_direct_answer",
      payload,
    });

    expect(trace.committed_ask_route?.route.source_target).toBe("docs_viewer");
    expect(trace.committed_ask_route?.canonical_goal.goal_kind).toBe("model_only_concept");
    expect(trace.committed_route_compatibility?.violations).toContain(
      "source_target_goal_mismatch:model_only_concept_for_source_backed_route",
    );
  });

  it("blocks a model-requested capability that is suppressed by the committed route", () => {
    const prompt = '"Open docs/helix-ask-flow.md" is the command I typed earlier; explain whether that should run now.';
    const promptInterpretation = interpretHelixAskPrompt(prompt);
    const committedRoute = buildCommittedAskRoute({
      turnId,
      promptText: prompt,
      selectedRoute: "conversation:simple",
      promptInterpretation,
      payload: {
        turn_id: turnId,
        source_target_intent: {
          ...docsSourceTarget,
          target_source: "model_only",
          target_kind: "general_background",
          strength: "soft",
          allow_no_tool_direct: true,
        },
        canonical_goal_frame: {
          turn_id: turnId,
          goal_kind: "model_only_concept",
          required_terminal_kind: "direct_answer_text",
        },
        tool_call_admission_decision: {
          admitted_tool_families: ["model_only"],
          suppressed_tool_families: ["docs_viewer", "repo_code"],
        },
      },
    });

    const admission = assertCapabilityAllowedByCommittedRoute({
      committedRoute,
      capabilityId: "docs-viewer.open_doc_by_path",
      args: { path: "docs/helix-ask-flow.md" },
    });

    expect(admission.allowed).toBe(false);
    expect(admission.reason).toBe("committed_route_tool_family_suppressed");
  });

  it("preserves the committed route through model-turn continuation and blocks dispatch", async () => {
    const committedRoute = buildCommittedAskRoute({
      turnId,
      promptText,
      selectedRoute: "docs_viewer.local_docs_path_compare",
      payload: {
        turn_id: turnId,
        source_target_intent: docsSourceTarget,
        route_product_contract: docsRouteContract,
        canonical_goal_frame: {
          turn_id: turnId,
          goal_kind: "doc_evidence_synthesis",
          required_terminal_kind: "doc_evidence_synthesis",
        },
        tool_call_admission_decision: {
          admitted_tool_families: ["docs_viewer"],
          suppressed_tool_families: ["live_environment"],
        },
      },
    });
    const packet = buildHelixModelTurnPacket({
      turnId,
      promptText,
      payload: {
        turn_id: turnId,
        committed_ask_route: committedRoute,
        source_target_intent: docsSourceTarget,
        route_product_contract: docsRouteContract,
      },
      artifactLedger: [],
      availableCapabilities: [],
    });
    let executed = false;

    const result = await runHelixModelTurnToolContinuation({
      packet,
      payload: { turn_id: turnId, committed_ask_route: committedRoute },
      executeCapability: () => {
        executed = true;
        return { status: "succeeded" };
      },
      testResponseOverrides: [{
        status: "tool_call_requested",
        requested_tool_call: {
          capability_id: "live_env.read_processed_live_source_mail",
          args: {},
        },
      }],
    });

    expect(executed).toBe(false);
    expect(result.status).toBe("tool_continuation_blocked");
    expect(result.payload.committed_route_tool_admission).toMatchObject({
      allowed: false,
      reason: "committed_route_tool_family_suppressed",
    });
    expect(result.packets[0].committed_ask_route?.commit_id).toBe(committedRoute.commit_id);
  });

  it("terminal envelope rejects terminal kinds outside the committed route product", () => {
    const committedRoute = buildCommittedAskRoute({
      turnId,
      promptText,
      selectedRoute: "docs_viewer.local_docs_path_compare",
      payload: {
        turn_id: turnId,
        source_target_intent: docsSourceTarget,
        route_product_contract: docsRouteContract,
        canonical_goal_frame: {
          turn_id: turnId,
          goal_kind: "doc_evidence_synthesis",
          required_terminal_kind: "doc_evidence_synthesis",
        },
      },
    });
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      committed_ask_route: committedRoute,
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
      selected_final_answer: "This stale model-only answer should not publish.",
    };

    const envelope = resolveTerminalAnswerEnvelope(payload);

    expect(envelope.terminal_artifact_kind).toBe("typed_failure");
    expect(payload.committed_route_terminal_rejection).toMatchObject({
      reason: "committed_route_terminal_product_mismatch",
    });
  });

  it("allows model-only answers for quoted docs-path explanations while keeping docs terminals forbidden", () => {
    const prompt = '"Open docs/helix-ask-flow.md" is the command I typed earlier; explain whether that should run now.';
    const promptInterpretation = interpretHelixAskPrompt(prompt);
    const committedRoute = buildCommittedAskRoute({
      turnId,
      promptText: prompt,
      selectedRoute: "conversation:simple",
      promptInterpretation,
      payload: {
        turn_id: turnId,
        source_target_intent: {
          schema: "helix.ask_source_target_intent.v1",
          turn_id: turnId,
          thread_id: "thread:test",
          target_source: "model_only",
          target_kind: "general_background",
          strength: "soft",
          reasons: ["quoted_tool_command", "historical_tool_reference"],
          allow_no_tool_direct: true,
          assistant_answer: false,
          raw_content_included: false,
        },
        canonical_goal_frame: {
          turn_id: turnId,
          goal_kind: "model_only_concept",
          required_terminal_kind: "direct_answer_text",
        },
        tool_call_admission_decision: {
          admitted_tool_families: ["model_only"],
          suppressed_tool_families: ["docs_viewer", "repo_code"],
        },
      },
    });

    expect(committedRoute.route.source_target).toBe("model_only");
    expect(committedRoute.canonical_goal.goal_kind).toBe("model_only_concept");
    expect(committedRoute.capability_policy.suppressed_tool_families).toEqual(
      expect.arrayContaining(["docs_viewer", "repo_code"]),
    );
    expect(committedRoute.canonical_goal.allowed_terminal_artifact_kinds).toEqual(
      expect.arrayContaining(["direct_answer_text", "model_synthesized_answer", "final_answer_draft"]),
    );

    expect(committedRouteAllowsTerminalKind({
      committedRoute,
      terminalArtifactKind: "direct_answer_text",
      finalAnswerSource: "model_direct_answer",
    })).toBe(true);
    expect(committedRouteAllowsTerminalKind({
      committedRoute,
      terminalArtifactKind: "final_answer_draft",
      finalAnswerSource: "final_answer_draft",
    })).toBe(true);
    expect(committedRouteAllowsTerminalKind({
      committedRoute,
      terminalArtifactKind: "doc_summary",
      finalAnswerSource: "artifact_synthesis",
    })).toBe(false);

    const payload: Record<string, unknown> = {
      turn_id: turnId,
      committed_ask_route: committedRoute,
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
      selected_final_answer: "No. That quoted path is historical text to analyze, not a Docs Viewer command.",
    };

    const envelope = resolveTerminalAnswerEnvelope(payload);

    expect(envelope.terminal_artifact_kind).toBe("direct_answer_text");
    expect(envelope.final_answer_source).toBe("model_direct_answer");
    expect(envelope.terminal_text).toContain("not a Docs Viewer command");
    expect(payload.committed_route_terminal_rejection).toBeUndefined();

    const docsTerminalPayload: Record<string, unknown> = {
      turn_id: turnId,
      committed_ask_route: committedRoute,
      terminal_artifact_kind: "doc_summary",
      final_answer_source: "artifact_synthesis",
      selected_final_answer: "Summary: Helix Ask Flow",
    };

    const rejectedEnvelope = resolveTerminalAnswerEnvelope(docsTerminalPayload);

    expect(rejectedEnvelope.terminal_artifact_kind).toBe("typed_failure");
    expect(docsTerminalPayload.committed_route_terminal_rejection).toMatchObject({
      reason: "committed_route_terminal_product_mismatch",
      rejected_terminal_artifact_kind: "doc_summary",
    });
  });

  it("normalizes stale docs goal metadata under a model-only quoted docs command route", () => {
    const prompt =
      '"Open docs/helix-ask-flow.md and summarize it" is a quoted command from an earlier turn, not an instruction for this turn. Explain briefly whether Helix Ask should execute Docs Viewer now, and why.';
    const promptInterpretation = interpretHelixAskPrompt(prompt);
    const committedRoute = buildCommittedAskRoute({
      turnId,
      promptText: prompt,
      selectedRoute: "dispatch:act",
      promptInterpretation,
      payload: {
        turn_id: turnId,
        source_target_intent: {
          schema: "helix.ask_source_target_intent.v1",
          turn_id: turnId,
          thread_id: "thread:test",
          target_source: "model_only",
          target_kind: "general_background",
          strength: "hard",
          reasons: ["quoted_tool_command", "historical_tool_reference"],
          precedence_reason: "explicit_model_only_target",
          allow_no_tool_direct: true,
          assistant_answer: false,
          raw_content_included: false,
        },
        route_product_contract: {
          schema: "helix.route_product_contract.v1",
          turn_id: turnId,
          thread_id: "thread:test",
          source_target: "docs_viewer",
          allowed_terminal_artifact_kinds: [
            "doc_location_result",
            "request_user_input",
            "typed_failure",
            "active_doc_identity",
            "doc_open_receipt",
            "doc_summary",
            "model_synthesized_answer",
          ],
          forbidden_terminal_artifact_kinds: [
            "repo_code_evidence_answer",
            "direct_answer_text",
            "model_only_concept",
          ],
          precedence_reason: "docs_source_target_allows_only_document_terminal_products",
          assistant_answer: false,
          raw_content_included: false,
        },
        canonical_goal_frame: {
          turn_id: turnId,
          goal_kind: "summarize_doc",
          required_terminal_kind: "unknown",
        },
        tool_call_admission_decision: {
          admitted_tool_families: ["model_only"],
          suppressed_tool_families: ["workstation_action"],
        },
      },
    });

    expect(committedRoute.route.source_target).toBe("model_only");
    expect(committedRoute.canonical_goal).toMatchObject({
      goal_kind: "model_only_concept",
      required_terminal_kind: "direct_answer_text",
    });
    expect(committedRoute.capability_policy.suppressed_tool_families).toEqual(
      expect.arrayContaining(["docs_viewer", "repo_code"]),
    );
    expect(committedRoute.canonical_goal.allowed_terminal_artifact_kinds).toEqual(
      expect.arrayContaining(["direct_answer_text", "model_synthesized_answer", "final_answer_draft"]),
    );
    expect(committedRoute.canonical_goal.allowed_terminal_artifact_kinds).not.toContain("doc_summary");
    expect(committedRoute.canonical_goal.forbidden_terminal_artifact_kinds).toEqual(
      expect.arrayContaining(["doc_summary", "doc_open_receipt", "doc_evidence_synthesis_answer"]),
    );
    expect(committedRoute.canonical_goal.forbidden_terminal_artifact_kinds).not.toContain("direct_answer_text");

    expect(committedRouteAllowsTerminalKind({
      committedRoute,
      terminalArtifactKind: "direct_answer_text",
      finalAnswerSource: "model_direct_answer",
    })).toBe(true);
    expect(committedRouteAllowsTerminalKind({
      committedRoute,
      terminalArtifactKind: "final_answer_draft",
      finalAnswerSource: "model_direct_answer",
    })).toBe(true);
    expect(committedRouteAllowsTerminalKind({
      committedRoute,
      terminalArtifactKind: "doc_summary",
      finalAnswerSource: "artifact_synthesis",
    })).toBe(false);

    const envelope = resolveTerminalAnswerEnvelope({
      turn_id: turnId,
      committed_ask_route: committedRoute,
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
      selected_final_answer: "No. The quoted command is historical text, not a Docs Viewer instruction.",
    });

    expect(envelope.terminal_artifact_kind).toBe("direct_answer_text");
    expect(envelope.terminal_text).toContain("historical text");

    const routeAuthority = auditRouteAuthority({
      turnId,
      promptText: prompt,
      selectedRoute: "dispatch:act",
      terminalArtifactKind: "direct_answer_text",
      finalAnswerSource: "model_direct_answer",
      sourceTargetIntent: {
        target_source: "model_only",
        target_kind: "general_background",
        strength: "hard",
      },
      routeProductContract: {
        schema: "helix.route_product_contract.v1",
        source_target: "docs_viewer",
        allowed_terminal_artifact_kinds: ["doc_summary", "model_synthesized_answer"],
        forbidden_terminal_artifact_kinds: ["direct_answer_text", "model_only_concept"],
        precedence_reason: "docs_source_target_allows_only_document_terminal_products",
      },
      terminalArtifactSelectionGuard: { allowed: true },
      productAuthorityGuard: { allowed: true },
      committedAskRoute: committedRoute,
    });

    expect(routeAuthority.source_target).toBe("model_only");
    expect(routeAuthority.allowed_terminal_artifact_kinds).toEqual(
      expect.arrayContaining(["direct_answer_text", "model_synthesized_answer", "final_answer_draft"]),
    );
    expect(routeAuthority.forbidden_terminal_artifact_kinds).toEqual(expect.arrayContaining(["doc_summary"]));
    expect(routeAuthority.terminal_artifact_allowed).toBe(true);
    expect(routeAuthority.route_authority_ok).toBe(true);
    expect(routeAuthority.violation_codes).toEqual([]);

    const staleRouteAuthority = {
      ...routeAuthority,
      route_authority_ok: false,
      primary_violation_code: "poison_clean_but_authority_failed",
      route_authority_violation_code: "poison_clean_but_authority_failed",
      violation_codes: ["poison_clean_but_authority_failed"],
    };
    const hardGatePayload: Record<string, unknown> = {
      turn_id: turnId,
      active_prompt: prompt,
      committed_ask_route: committedRoute,
      source_target_intent: {
        target_source: "model_only",
        target_kind: "general_background",
        strength: "hard",
      },
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        source_target: "docs_viewer",
        allowed_terminal_artifact_kinds: ["doc_summary", "model_synthesized_answer"],
        forbidden_terminal_artifact_kinds: ["direct_answer_text", "model_only_concept"],
      },
      canonical_goal_frame: {
        goal_kind: "summarize_doc",
        required_terminal_kind: "unknown",
      },
      route_authority_audit: staleRouteAuthority,
      poison_audit: { ok: true },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        server_authoritative: true,
        terminal_artifact_kind: "direct_answer_text",
        final_answer_source: "model_direct_answer",
      },
      terminal_artifact_kind: "direct_answer_text",
      final_answer_source: "model_direct_answer",
      goal_satisfaction_evaluation: {
        schema: "helix.goal_satisfaction_evaluation.v1",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      runtime_authority_audit: {
        schema: "helix.runtime_authority_audit.v1",
        ok: true,
      },
      current_turn_artifact_ledger: [
        {
          kind: "direct_answer_text",
          payload: {
            kind: "direct_answer_text",
            text: "No. The quoted command is historical text, not a Docs Viewer instruction.",
          },
        },
        {
          kind: "final_answer_draft",
          payload: {
            kind: "final_answer_draft",
            text: "No. The quoted command is historical text, not a Docs Viewer instruction.",
          },
        },
        {
          kind: "runtime_authority_audit",
          payload: {
            schema: "helix.runtime_authority_audit.v1",
            ok: true,
          },
        },
      ],
    };
    const trace = buildAskTurnSolverTrace({
      turnId,
      promptText: prompt,
      selectedRoute: "dispatch:act",
      terminalArtifactKind: "direct_answer_text",
      finalAnswerSource: "model_direct_answer",
      payload: hardGatePayload,
    });
    hardGatePayload.ask_turn_solver_trace = trace;

    const hardGate = evaluateAskTurnSolverHardGate({
      turnId,
      payload: hardGatePayload,
      trace,
      loopParityTrace: {
        route_authority_ok: false,
        poison_audit_ok: true,
        terminal_authority_ok: true,
        short_circuit_risk_flags: ["poison_clean_but_authority_failed"],
        actual_tool_calls: [],
      },
    });

    expect(hardGate.failed).toBe(false);
    expect(hardGate.failure_codes).not.toContain("poison_clean_but_authority_failed");
  });

  it("publishes model-only direct answers despite stale docs route-product contract metadata", () => {
    const prompt =
      '"Open docs/helix-ask-flow.md and summarize it" is a quoted command from an earlier turn, not an instruction for this turn. Explain briefly whether Helix Ask should execute Docs Viewer now, and why.';
    const promptInterpretation = interpretHelixAskPrompt(prompt);
    const committedRoute = buildCommittedAskRoute({
      turnId,
      promptText: prompt,
      selectedRoute: "dispatch:act",
      promptInterpretation,
      payload: {
        turn_id: turnId,
        source_target_intent: {
          target_source: "model_only",
          target_kind: "general_background",
          strength: "hard",
          reasons: ["quoted_tool_command", "historical_tool_reference"],
          precedence_reason: "explicit_model_only_target",
          allow_no_tool_direct: true,
          assistant_answer: false,
          raw_content_included: false,
        },
        route_product_contract: {
          schema: "helix.route_product_contract.v1",
          source_target: "docs_viewer",
          allowed_terminal_artifact_kinds: ["doc_summary", "model_synthesized_answer"],
          forbidden_terminal_artifact_kinds: ["direct_answer_text", "model_only_concept"],
          precedence_reason: "docs_source_target_allows_only_document_terminal_products",
          assistant_answer: false,
          raw_content_included: false,
        },
        canonical_goal_frame: {
          goal_kind: "summarize_doc",
          required_terminal_kind: "unknown",
        },
        tool_call_admission_decision: {
          admitted_tool_families: ["model_only"],
          suppressed_tool_families: ["docs_viewer", "repo_code"],
        },
      },
    });
    const answerText = "No. Helix Ask should not execute Docs Viewer because the quoted command is historical context for this turn.";
    const payload: Record<string, unknown> = {
      turn_id: turnId,
      active_prompt: prompt,
      committed_ask_route: committedRoute,
      source_target_intent: {
        target_source: "model_only",
        target_kind: "general_background",
        strength: "hard",
      },
      route_product_contract: {
        schema: "helix.route_product_contract.v1",
        source_target: "docs_viewer",
        allowed_terminal_artifact_kinds: ["doc_summary", "model_synthesized_answer"],
        forbidden_terminal_artifact_kinds: ["direct_answer_text", "model_only_concept"],
        precedence_reason: "docs_source_target_allows_only_document_terminal_products",
      },
      canonical_goal_frame: {
        goal_kind: "summarize_doc",
        required_terminal_kind: "unknown",
      },
      goal_satisfaction_evaluation: {
        schema: "helix.goal_satisfaction_evaluation.v1",
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      runtime_authority_audit: {
        schema: "helix.runtime_authority_audit.v1",
        ok: true,
      },
      terminal_answer_authority: {
        schema: "helix.turn_terminal_authority.v1",
        server_authoritative: true,
        terminal_artifact_kind: "direct_answer_text",
        final_answer_source: "model_direct_answer",
      },
    };
    const artifactLedger = [
      {
        kind: "direct_answer_text",
        artifact_id: `${turnId}:model_only:direct_answer_text`,
        payload: {
          schema: "helix.direct_answer_text.v1",
          kind: "direct_answer_text",
          text: answerText,
          answer_text: answerText,
        },
      },
      {
        kind: "final_answer_draft",
        artifact_id: `${turnId}:final_answer_draft`,
        payload: {
          schema: "helix.final_answer_draft.v1",
          kind: "final_answer_draft",
          text: answerText,
          answer_text: answerText,
        },
      },
      {
        kind: "direct_answer_text",
        artifact_id: `${turnId}:model_only:direct_answer_text:latest`,
        payload: {
          schema: "helix.direct_answer_text.v1",
          kind: "direct_answer_text",
          text: answerText,
          answer_text: answerText,
        },
      },
    ];
    payload.current_turn_artifact_ledger = artifactLedger;

    expect(inferFinalAnswerDraftRouteFamily({
      payload,
      routeProductContract: payload.route_product_contract as Record<string, unknown>,
      artifactLedger,
    })).toBe("model_only");

    const writer = applyHelixTerminalAuthoritySingleWriter({
      turnId,
      payload,
      artifactLedger,
    });
    expect(writer.selected_terminal_artifact_kind).toBe("direct_answer_text");
    expect(writer.source).toBe("direct_answer_text");
    expect(writer.visible_text).toBe(answerText);
    expect(payload.terminal_artifact_kind).toBe("direct_answer_text");
    expect(payload.final_answer_source).toBe("model_direct_answer");
    expect(payload.selected_final_answer).toBe(answerText);
  });
});
