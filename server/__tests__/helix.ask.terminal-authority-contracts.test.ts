import { describe, expect, it } from "vitest";

import { auditHelixAskContextForPoison } from "../services/helix-ask/ask-context-poison-audit";
import { auditTerminalPresentationCoverage } from "../services/helix-ask/terminal-presentation-coverage-audit";
import { applyTerminalAnswerEnvelope, resolveTerminalAnswerEnvelope } from "../services/helix-ask/terminal-answer-envelope";
import { buildHelixTurnTerminalAuthority } from "../services/helix-ask/turn-terminal-authority";
import {
  ALL_ROUTE_TERMINAL_PRODUCTS,
  buildRouteProductContract,
} from "../services/helix-ask/route-product-contract";

const allTerminalSurfacesEqual = (body: Record<string, any>): void => {
  const expected = String(body.selected_final_answer ?? "");
  const events = Array.isArray(body.current_turn_events)
    ? body.current_turn_events
    : Array.isArray(body.turn_events)
      ? body.turn_events
      : [body.current_turn_events?.terminal_answer];
  const terminalEvent = [...events].reverse().find((event) => event?.type === "terminal_answer");
  expect(body.terminal_presentation?.concise_text).toBe(expected);
  expect(body.terminal_answer_authority?.terminal_text_preview).toBe(expected);
  expect(terminalEvent?.text).toBe(expected);
  expect(body.answer ?? body.text ?? body.finalAnswer).toBe(expected);
};

describe("Helix Ask terminal authority contracts", () => {
  it("lets selected terminal presentation beat fallback visible text", () => {
    const payload: Record<string, unknown> = {
      turn_id: "ask:test:fallback",
      thread_id: "thread:test",
      selected_final_answer: "Correct terminal answer.",
      terminal_artifact_kind: "situation_context_pack",
      final_answer_source: "artifact_synthesis",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        concise_text: "Correct terminal answer.",
      },
      answer: "Retrying after tool timeout...",
      text: "Retrying after tool timeout...",
      assistant_answer: "Retrying after tool timeout...",
    };

    const envelope = resolveTerminalAnswerEnvelope(payload);
    applyTerminalAnswerEnvelope(payload, envelope);

    expect(payload.terminal_answer_authority).toMatchObject({
      authority_origin: "terminal_presentation",
      terminal_text_preview: "Correct terminal answer.",
    });
    expect((payload.terminal_answer_authority as Record<string, unknown>).terminal_text_preview).not.toBe("Retrying after tool timeout...");
    expect((payload.poison_audit as Record<string, unknown>).ok).toBe(true);
    expect((payload.terminal_presentation_coverage_audit as Record<string, unknown>).violations).toEqual([]);
    allTerminalSurfacesEqual(payload);
  });

  it("does not let stale presentation text override typed failure authority", () => {
    const payload: Record<string, unknown> = {
      turn_id: "ask:test:typed-failure-stale-presentation",
      thread_id: "thread:test",
      selected_final_answer: "You're viewing a developer environment.",
      answer: "You're viewing a developer environment.",
      text: "You're viewing a developer environment.",
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_error_code: "terminal_authority_before_solver_completion",
      typed_failure: {
        schema: "helix.typed_failure.v1",
        message: "I could not complete this Ask turn because solver authority failed (terminal_authority_before_solver_completion).",
      },
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        concise_text: "You're viewing a developer environment.",
      },
    };

    const envelope = resolveTerminalAnswerEnvelope(payload);
    applyTerminalAnswerEnvelope(payload, envelope);

    expect(envelope).toMatchObject({
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      authority_origin: "typed_failure",
      terminal_text:
        "I could not complete this Ask turn because solver authority failed (terminal_authority_before_solver_completion).",
    });
    allTerminalSurfacesEqual(payload);
    expect(payload.selected_final_answer).not.toBe("You're viewing a developer environment.");
  });

  it("treats typed failure source as failure even when artifact kind is stale", () => {
    const payload: Record<string, unknown> = {
      turn_id: "ask:test:typed-failure-stale-artifact",
      thread_id: "thread:test",
      selected_final_answer: "Created workstation note \"Open document summary\".",
      answer: "Created workstation note \"Open document summary\".",
      text: "Created workstation note \"Open document summary\".",
      terminal_artifact_kind: "note_mutation_result",
      final_answer_source: "typed_failure",
      terminal_failure_text: "I could not complete this turn because the note tool call was missing required arguments.",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        concise_text: "Created workstation note \"Open document summary\".",
      },
    };

    const envelope = resolveTerminalAnswerEnvelope(payload);
    applyTerminalAnswerEnvelope(payload, envelope);

    expect(envelope).toMatchObject({
      terminal_artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      authority_origin: "typed_failure",
      terminal_text: "I could not complete this turn because the note tool call was missing required arguments.",
    });
    allTerminalSurfacesEqual(payload);
    expect(payload.selected_final_answer).not.toMatch(/Created workstation note/i);
  });

  it("flags stale typed failure presentation text as non-authoritative", () => {
    const failureText =
      "I could not complete this Ask turn because solver authority failed (terminal_authority_before_solver_completion).";
    const payload: Record<string, unknown> = {
      turn_id: "ask:test:typed-failure-coverage",
      thread_id: "thread:test",
      selected_final_answer: "You're viewing a developer environment.",
      answer: "You're viewing a developer environment.",
      terminal_artifact_kind: "typed_failure",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        concise_text: "You're viewing a developer environment.",
      },
      terminal_answer_authority: buildHelixTurnTerminalAuthority({
        thread_id: "thread:test",
        turn_id: "ask:test:typed-failure-coverage",
        final_answer_source: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        terminal_text: failureText,
        authority_origin: "typed_failure",
      }),
      poison_audit: {
        schema: "helix.turn_poison_audit.v1",
        ok: true,
      },
      current_turn_events: [{ type: "terminal_answer", text: failureText }],
    };

    const audit = auditTerminalPresentationCoverage({
      payload,
      turnId: "ask:test:typed-failure-coverage",
      route: "situation_context_question",
      terminalArtifactKind: "typed_failure",
      selectedFinalAnswer: failureText,
    });

    expect(audit.violations).toContain("terminal_presentation_not_authority_text");
    expect(audit.canonical_terminal_text_hash).toBe(audit.authority_text_hash);
  });

  it("detects authority text drift from presentation text", () => {
    const payload: Record<string, unknown> = {
      turn_id: "ask:test:authority-drift",
      thread_id: "thread:test",
      selected_final_answer: "A",
      answer: "A",
      text: "A",
      finalAnswer: "A",
      terminal_artifact_kind: "situation_context_pack",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        concise_text: "A",
      },
      current_turn_events: {
        terminal_answer: { type: "terminal_answer", text: "A" },
      },
      terminal_answer_authority: buildHelixTurnTerminalAuthority({
        thread_id: "thread:test",
        turn_id: "ask:test:authority-drift",
        final_answer_source: "artifact_synthesis",
        terminal_artifact_kind: "situation_context_pack",
        terminal_text: "B",
        authority_origin: "selected_final_answer",
      }),
    };

    const audit = auditHelixAskContextForPoison({
      thread_id: "thread:test",
      turn_id: "ask:test:authority-drift",
      payload,
      terminal_authority: payload.terminal_answer_authority as any,
      client_visible_text: "A",
    });

    expect(audit.ok).toBe(false);
    expect(audit.violations.map((violation) => violation.kind)).toContain("terminal_authority_presentation_mismatch");
  });

  it("detects current-turn terminal answer event drift", () => {
    const payload: Record<string, unknown> = {
      turn_id: "ask:test:event-drift",
      thread_id: "thread:test",
      selected_final_answer: "A",
      answer: "A",
      text: "A",
      finalAnswer: "A",
      terminal_artifact_kind: "situation_context_pack",
      terminal_presentation: {
        schema: "helix.terminal_presentation.v1",
        concise_text: "A",
      },
      current_turn_events: {
        terminal_answer: { type: "terminal_answer", text: "Retrying..." },
      },
      terminal_answer_authority: buildHelixTurnTerminalAuthority({
        thread_id: "thread:test",
        turn_id: "ask:test:event-drift",
        final_answer_source: "artifact_synthesis",
        terminal_artifact_kind: "situation_context_pack",
        terminal_text: "A",
        authority_origin: "terminal_presentation",
      }),
    };

    const audit = auditHelixAskContextForPoison({
      thread_id: "thread:test",
      turn_id: "ask:test:event-drift",
      payload,
      terminal_authority: payload.terminal_answer_authority as any,
      client_visible_text: "A",
    });

    expect(audit.ok).toBe(false);
    expect(audit.violations.map((violation) => violation.kind)).toContain("terminal_event_presentation_mismatch");
  });

  it("makes every route-product contract total over known terminal products", () => {
    const sourceTargets = [
      "visual_capture",
      "procedure_memory",
      "situation_epoch",
      "live_pipeline",
      "world_event",
      "docs_viewer",
      "active_doc",
      "repo_code",
      "runtime_evidence",
      "visual_scene_memory",
      "process_graph",
      "model_only",
      "general_background",
      "unknown",
    ] as const;

    for (const sourceTarget of sourceTargets) {
      const contract = buildRouteProductContract({
        turnId: `ask:test:${sourceTarget}`,
        threadId: "thread:test",
        sourceTargetIntent: {
          schema: "helix.ask_source_target_intent.v1",
          target_source: sourceTarget,
        },
        promptText: "test prompt",
      });

      for (const product of ALL_ROUTE_TERMINAL_PRODUCTS) {
        const allowed = contract.allowed_terminal_artifact_kinds.includes(product);
        const forbidden = contract.forbidden_terminal_artifact_kinds.includes(product);
        expect(allowed).not.toBe(forbidden);
      }
    }
  });
});
