import { describe, expect, it } from "vitest";

import {
  attachSynthesisSupportRefs,
  buildRepoDocsSynthesisRepairInstruction,
  buildRepoDocsSynthesisPacket,
  classifyRepoDocsSynthesisAttemptStatus,
  repoDocsSynthesisTerminalErrorCode,
} from "../services/helix-ask/repo-docs-synthesis-packet";
import { evaluateRepoAnswerTextQualityGate } from "../services/helix-ask/repo-answer-text-quality-gate";
import { getHelixCausalTurnTimeline } from "../services/helix-ask/causal-turn-timeline";

const turnId = "ask:test:repo-docs-synthesis";

const dottieObservation = {
  schema: "helix.repo_code_evidence_observation.v1",
  artifact_id: `${turnId}:repo_code_evidence_observation`,
  turn_id: turnId,
  concept: "Auntie Dottie",
  query: "What is Auntie Dottie in this app?",
  evidence_refs: [
    "shared/helix-dottie-manifest-preset.ts:1-80",
    "server/services/situation-room/dottie-manifest-preset.ts:1-80",
  ],
  observations: [],
  spans: [
    {
      ref: "shared/helix-dottie-manifest-preset.ts:1-80",
      path: "shared/helix-dottie-manifest-preset.ts",
      start_line: 1,
      end_line: 80,
      sanitized_excerpt: "Dottie manifest presets describe observer subscriptions, commentary policy, and child artifact refs for Dottie setup.",
      reason: "Defines the Dottie manifest/preset contract.",
      source_kind: "repo_code",
      score: 42,
    },
    {
      ref: "shared/workstation-dynamic-tools.ts:100-160",
      path: "shared/workstation-dynamic-tools.ts",
      start_line: 100,
      end_line: 160,
      sanitized_excerpt: "Situation Room pipeline actions expose Dottie observer creation and voice delivery proposal capabilities.",
      reason: "Shows Dottie as workstation/Situation Room capabilities.",
      source_kind: "repo_code",
      score: 37,
    },
    {
      ref: "docs/helix-ask-agent-policy.md:20-45",
      path: "docs/helix-ask-agent-policy.md",
      start_line: 20,
      end_line: 45,
      sanitized_excerpt: "Voice delivery proposal is not speech; confirm_speak is required before spoken output.",
      reason: "Defines voice/terminal authority policy for Dottie-like commentary.",
      source_kind: "repo_doc",
      score: 31,
    },
  ],
  selected_for_answer: true,
  assistant_answer: false,
  raw_content_included: false,
};

const ledger = [
  {
    artifact_id: dottieObservation.artifact_id,
    kind: "repo_code_evidence_observation",
    payload: dottieObservation,
  },
];

describe("repo/docs synthesis reliability", () => {
  it("builds compact synthesis packets from repo evidence observations", () => {
    const packet = buildRepoDocsSynthesisPacket({
      turnId,
      promptText: "What is Auntie Dottie in this app?",
      routeFamily: "repo_evidence",
      artifactLedger: ledger,
      maxEvidenceItems: 2,
    });

    expect(packet.schema).toBe("helix.repo_docs_synthesis_packet.v1");
    expect(packet.compact_evidence.length).toBeLessThanOrEqual(2);
    expect(packet.source_observation_refs).toContain(dottieObservation.artifact_id);
    expect(packet.answer_contract).toMatchObject({
      required_model_step_capability: "model.synthesize_from_repo_evidence",
      required_terminal_kind: "repo_code_evidence_answer",
      must_not_emit_file_inventory: true,
    });
    expect(packet.model_instruction).toMatch(/Explain what the evidence means/i);
    expect(packet.assistant_answer).toBe(false);
    expect(packet.raw_content_included).toBe(false);
  });

  it("attaches support refs from the packet so valid prose can pass the repo quality gate", () => {
    const packet = buildRepoDocsSynthesisPacket({
      turnId,
      promptText: "What is Auntie Dottie in this app?",
      routeFamily: "repo_evidence",
      artifactLedger: ledger,
    });
    const draft = attachSynthesisSupportRefs({
      draft: {
        schema: "helix.final_answer_draft.v1",
        text: "Auntie Dottie is a Situation Room/Helix Ask construct for setting up Dottie observer/commentary behavior from evidence and policy. The repo evidence shows manifest presets, workstation capabilities, and voice policy, including that voice delivery is proposed first and requires confirmation before speech.",
        artifact_refs: [],
        model_step_capability: "model.synthesize_from_repo_evidence",
        authority: "llm_post_observation_composer",
      },
      packet,
      observation: dottieObservation,
    });
    const payload = {
      final_answer_draft: draft,
      repo_code_evidence_answer: {
        schema: "helix.repo_code_evidence_answer.v1",
        artifact_id: `${turnId}:repo_code_evidence_answer`,
        answer_text: draft.text,
        model_authored: true,
        model_step_capability: "model.synthesize_from_repo_evidence",
        synthesis_attempt_ref: `${turnId}:repo_evidence_synthesis_attempt`,
        support_refs: draft.support_refs,
      },
      current_turn_artifact_ledger: [
        ...ledger,
        {
          artifact_id: `${turnId}:repo_evidence_synthesis_attempt`,
          kind: "repo_evidence_synthesis_attempt",
          payload: {
            schema: "helix.repo_evidence_synthesis_attempt.v1",
            model_step_capability: "model.synthesize_from_repo_evidence",
          },
        },
      ],
    };

    const gate = evaluateRepoAnswerTextQualityGate({
      turnId,
      answerRef: `${turnId}:repo_code_evidence_answer`,
      answerText: draft.text,
      payload,
    });

    expect(draft.support_refs.length).toBeGreaterThan(0);
    expect(gate.ok).toBe(true);
    expect(gate.violations).toEqual([]);
  });

  it("keeps file inventories and no-evidence refusals from passing the quality gate", () => {
    const packet = buildRepoDocsSynthesisPacket({
      turnId,
      promptText: "What is Auntie Dottie in this app?",
      routeFamily: "repo_evidence",
      artifactLedger: ledger,
    });
    const payload = {
      repo_docs_synthesis_packet: packet,
      repo_code_evidence_answer: {
        schema: "helix.repo_code_evidence_answer.v1",
        support_refs: packet.compact_evidence.map((entry) => entry.ref),
        model_authored: true,
        model_step_capability: "model.synthesize_from_repo_evidence",
        synthesis_attempt_ref: `${turnId}:repo_evidence_synthesis_attempt`,
      },
      final_answer_draft: {
        authority: "llm_post_observation_composer",
        model_step_capability: "model.synthesize_from_repo_evidence",
        artifact_refs: packet.compact_evidence.map((entry) => entry.ref),
      },
      current_turn_artifact_ledger: [
        ...ledger,
        {
          artifact_id: `${turnId}:repo_evidence_synthesis_attempt`,
          kind: "repo_evidence_synthesis_attempt",
          payload: {
            schema: "helix.repo_evidence_synthesis_attempt.v1",
            model_step_capability: "model.synthesize_from_repo_evidence",
          },
        },
      ],
    };

    const fileList = evaluateRepoAnswerTextQualityGate({
      turnId,
      answerRef: "candidate:file-list",
      answerText: "shared/helix-dottie-manifest-preset.ts\nserver/services/situation-room/dottie-manifest-preset.ts",
      payload,
    });
    const refusal = evaluateRepoAnswerTextQualityGate({
      turnId,
      answerRef: "candidate:refusal",
      answerText: "I cannot answer because no repo evidence observations were provided.",
      payload,
    });

    expect(fileList.violations).toContain("file_list_only");
    expect(refusal.violations).toContain("unsupported_repo_claim");
  });

  it("rejects policy claim inversions about receipts and final-answer authority", () => {
    const packet = buildRepoDocsSynthesisPacket({
      turnId,
      promptText: "Summarize what the loop discipline says about receipts and final answers.",
      routeFamily: "repo_evidence",
      artifactLedger: ledger,
    });
    const payload = {
      repo_docs_synthesis_packet: packet,
      repo_code_evidence_answer: {
        schema: "helix.repo_code_evidence_answer.v1",
        support_refs: packet.compact_evidence.map((entry) => entry.ref),
        model_authored: true,
        model_step_capability: "model.synthesize_from_repo_evidence",
        synthesis_attempt_ref: `${turnId}:repo_evidence_synthesis_attempt`,
      },
      final_answer_draft: {
        authority: "llm_post_observation_composer",
        model_step_capability: "model.synthesize_from_repo_evidence",
        artifact_refs: packet.compact_evidence.map((entry) => entry.ref),
      },
      current_turn_artifact_ledger: [
        ...ledger,
        {
          artifact_id: `${turnId}:repo_evidence_synthesis_attempt`,
          kind: "repo_evidence_synthesis_attempt",
          payload: {
            schema: "helix.repo_evidence_synthesis_attempt.v1",
            model_step_capability: "model.synthesize_from_repo_evidence",
          },
        },
      ],
    };

    const gate = evaluateRepoAnswerTextQualityGate({
      turnId,
      answerRef: "candidate:inverted-policy",
      answerText:
        "Receipts are essential because they validate final answers. Final answers must be derived from validated receipts to maintain the integrity of Helix Ask.",
      payload,
    });
    const instruction = buildRepoDocsSynthesisRepairInstruction({
      violations: gate.violations,
      packet,
    });
    const errorCode = repoDocsSynthesisTerminalErrorCode({
      status: classifyRepoDocsSynthesisAttemptStatus({ ok: gate.ok, violations: gate.violations }),
      repairAttempted: true,
      violations: gate.violations,
    });

    expect(gate.violations).toContain("policy_claim_inversion");
    expect(instruction).toMatch(/receipts\/tool outputs are observations/i);
    expect(errorCode).toBe("repo_docs_synthesis_policy_claim_inversion_after_repair");
  });

  it("builds targeted repair instructions and precise terminal codes for bad synthesis drafts", () => {
    const packet = buildRepoDocsSynthesisPacket({
      turnId,
      promptText: "What is Auntie Dottie in this app?",
      routeFamily: "repo_evidence",
      artifactLedger: ledger,
    });
    const instruction = buildRepoDocsSynthesisRepairInstruction({
      violations: ["excerpt_like_answer", "file_list_only"],
      packet,
    });
    const status = classifyRepoDocsSynthesisAttemptStatus({
      ok: false,
      violations: ["excerpt_like_answer", "file_list_only"],
    });
    const errorCode = repoDocsSynthesisTerminalErrorCode({
      status,
      repairAttempted: true,
      violations: ["excerpt_like_answer", "file_list_only"],
    });

    expect(status).toBe("excerpt_like");
    expect(instruction).toMatch(/previous answer was excerpt-like or file-list-like/i);
    expect(instruction).toMatch(/compact evidence refs/i);
    expect(errorCode).toBe("repo_docs_synthesis_file_inventory_after_repair");
  });

  it("adds repo/docs packet and quality events to the causal timeline", () => {
    const packet = buildRepoDocsSynthesisPacket({
      turnId,
      promptText: "What is Auntie Dottie in this app?",
      routeFamily: "repo_evidence",
      artifactLedger: ledger,
    });
    const payload = {
      turn_id: turnId,
      route_reason_code: "repo_code_evidence",
      terminal_artifact_kind: "repo_code_evidence_answer",
      final_answer_source: "model_synthesis_from_repo_evidence",
      selected_final_answer: "Auntie Dottie is a Situation Room/Helix Ask construct.",
      canonical_goal_frame: {
        turn_id: turnId,
        goal_kind: "repo_entity_definition",
      },
      source_target_intent: {
        target_source: "repo_code",
      },
      agent_step_decision: {
        next_step: "answer",
        chosen_capability: "model.synthesize_from_repo_evidence",
      },
      current_turn_artifact_ledger: [
        ...ledger,
        {
          artifact_id: packet.packet_id,
          kind: "repo_docs_synthesis_packet",
          payload: packet,
        },
        {
          artifact_id: `${turnId}:repo_answer_text_quality_gate`,
          kind: "repo_answer_text_quality_gate",
          payload: {
            schema: "helix.repo_answer_text_quality_gate.v1",
            ok: true,
            violations: [],
          },
        },
        {
          artifact_id: `${turnId}:repo_code_evidence_answer`,
          kind: "repo_code_evidence_answer",
          payload: {
            schema: "helix.repo_code_evidence_answer.v1",
            support_refs: packet.compact_evidence.map((entry) => entry.ref),
          },
        },
      ],
      repo_docs_synthesis_packet: packet,
      repo_answer_text_quality_gate: {
        schema: "helix.repo_answer_text_quality_gate.v1",
        ok: true,
        violations: [],
      },
      goal_satisfaction_evaluation: {
        satisfaction: "satisfied",
        next_decision: "allow_terminal",
      },
      solver_controller_decision: {
        decision: "allow_terminal",
      },
      terminal_answer_authority: {
        terminal_artifact_kind: "repo_code_evidence_answer",
      },
    };

    const stages = getHelixCausalTurnTimeline(payload).events.map((event) => event.stage);

    expect(stages).toEqual(expect.arrayContaining([
      "repo_evidence_observation_created",
      "repo_docs_synthesis_packet_created",
      "quality_gate_evaluated",
      "terminal_artifact_materialized",
      "terminal_artifact_selected",
    ]));
  });
});
