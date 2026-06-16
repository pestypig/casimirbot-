import { describe, expect, it } from "vitest";

import { buildAskTurnSolverTrace } from "../services/helix-ask/ask-turn-solver";
import {
  assertCapabilityAllowedByCommittedRoute,
  buildCommittedAskRoute,
} from "../services/helix-ask/committed-ask-route";
import { interpretHelixAskPrompt } from "../services/helix-ask/prompt-interpretation";
import { resolveTerminalAnswerEnvelope } from "../services/helix-ask/terminal-answer-envelope";
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
});
