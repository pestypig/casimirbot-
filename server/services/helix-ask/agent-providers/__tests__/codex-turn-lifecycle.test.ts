import { describe, expect, it } from "vitest";
import { buildCodexProviderTurnLifecycle } from "../codex-turn-lifecycle";

const gatewayResult = (capabilityId: string, index: number) => ({
  ok: true,
  capability_id: capabilityId,
  gateway_admission: {
    requested_capability: capabilityId,
    admission_status: "admitted",
  },
  tool_lifecycle_trace: {
    tool_call_id: `call:${index}`,
    observation_refs: [`observation:${index}`],
  },
  observation_packet: {
    produced_artifact_refs: [`artifact:${index}`],
  },
  artifact_refs: [],
}) as any;

describe("Codex provider outer turn lifecycle", () => {
  it("records compatibility gateway calls, re-entry, reasoning, and terminal completion", () => {
    const lifecycle = buildCodexProviderTurnLifecycle({
      turnId: "ask:test:compatibility-lifecycle",
      routeCommitId: "route:test:scholarly",
      gatewayCallResults: [
        gatewayResult("scholarly-research.lookup_papers", 1),
        gatewayResult("scholarly-research.fetch_full_text", 2),
      ],
      providerReasoningReentry: {
        evidence_reentered: true,
        input_observation_refs: [
          "observation:1",
          "artifact:1",
          "observation:2",
          "artifact:2",
        ],
      },
      providerText: "Selected one paper from the fetched full text.",
      terminalArtifactKind: "scholarly_research_answer",
      terminalEligible: true,
      ok: true,
    });

    expect(lifecycle).toMatchObject({
      scope: "helix_ask_turn",
      reduction: {
        route_commit_id: "route:test:scholarly",
        admitted_capability_ids: [
          "scholarly-research.lookup_papers",
          "scholarly-research.fetch_full_text",
        ],
        observation_reentry_refs: expect.arrayContaining([
          "observation:1",
          "observation:2",
        ]),
        post_observation_reasoning_completed: true,
        runtime_turn_completed: true,
        terminal_outcome: "completed",
        complete: true,
      },
      integrity: { ok: true, violations: [] },
    });
    expect(lifecycle.events.map((event) => event.kind)).toEqual([
      "turn.started",
      "route.committed",
      "capability.admitted",
      "tool.call.started",
      "tool.call.completed",
      "observation.reentered",
      "capability.admitted",
      "tool.call.started",
      "tool.call.completed",
      "observation.reentered",
      "agent.message.completed",
      "runtime.turn.completed",
      "terminal.eligibility.checked",
      "turn.completed",
    ]);
  });

  it("records model-requested capability-lane observations in the same lifecycle", () => {
    const lifecycle = buildCodexProviderTurnLifecycle({
      turnId: "ask:test:capability-lane-lifecycle",
      routeCommitId: "route:test:image-lens",
      gatewayCallResults: [],
      capabilityLaneObservationPackets: [{
        turn_id: "ask:test:capability-lane-lifecycle",
        call_id: "call:image-lens:1",
        decision_id: "decision:image-lens:1",
        capability_key: "visual_analysis.inspect_image_region",
        status: "succeeded",
        produced_artifact_refs: ["artifact:image-lens:page-2"],
      } as any],
      providerReasoningReentry: {
        evidence_reentered: true,
        input_observation_refs: ["artifact:image-lens:page-2"],
      },
      providerText: "The observed page contains a usable field-strength equation.",
      terminalArtifactKind: "agent_provider_terminal_candidate",
      terminalEligible: true,
      ok: true,
    });

    expect(lifecycle.reduction).toMatchObject({
      admitted_capability_ids: ["visual_analysis.inspect_image_region"],
      observation_reentry_refs: ["artifact:image-lens:page-2"],
      post_observation_reasoning_completed: true,
      complete: true,
    });
    expect(lifecycle.integrity).toEqual(expect.objectContaining({ ok: true }));
  });

  it("records a delegated lane gateway call once when both projections are present", () => {
    const delegated = gatewayResult("helix_ask.reflect_theory_context", 1);
    const lifecycle = buildCodexProviderTurnLifecycle({
      turnId: "ask:test:delegated-lane-lifecycle",
      routeCommitId: "route:test:theory",
      gatewayCallResults: [delegated],
      capabilityLaneObservationPackets: [{
        turn_id: "ask:test:delegated-lane-lifecycle",
        call_id: "call:1",
        decision_id: "decision:theory:1",
        capability_key: "helix_ask.reflect_theory_context",
        status: "succeeded",
        produced_artifact_refs: ["artifact:theory:1"],
      } as any],
      providerReasoningReentry: {
        evidence_reentered: true,
        input_observation_refs: ["observation:1", "artifact:1", "artifact:theory:1"],
      },
      providerText: "The graph has no exact match; the mechanism remains unresolved.",
      terminalArtifactKind: "agent_provider_terminal_candidate",
      terminalEligible: true,
      ok: true,
    });

    expect(lifecycle.reduction.tool_calls).toHaveLength(1);
    expect(lifecycle.reduction.tool_calls[0]).toMatchObject({
      call_id: "call:1",
      reentered: true,
      observation_refs: expect.arrayContaining([
        "observation:1",
        "artifact:1",
        "artifact:theory:1",
      ]),
    });
    expect(lifecycle.integrity).toEqual(expect.objectContaining({ ok: true }));
  });

  it("does not project a global re-entry flag onto an unmatched tool call", () => {
    const lifecycle = buildCodexProviderTurnLifecycle({
      turnId: "ask:test:partial-reentry",
      routeCommitId: "route:test:partial-reentry",
      gatewayCallResults: [
        gatewayResult("scholarly-research.lookup_papers", 1),
        gatewayResult("scholarly-research.fetch_full_text", 2),
      ],
      providerReasoningReentry: {
        evidence_reentered: true,
        input_observation_refs: ["observation:1", "artifact:1"],
      },
      providerText: "I only observed the lookup result.",
      terminalArtifactKind: "scholarly_research_answer",
      terminalEligible: true,
      ok: true,
    });

    expect(lifecycle.reduction.tool_calls).toEqual([
      expect.objectContaining({ call_id: "call:1", reentered: true }),
      expect.objectContaining({ call_id: "call:2", reentered: false }),
    ]);
    expect(lifecycle.integrity).toMatchObject({
      ok: false,
      violations: expect.arrayContaining([
        expect.objectContaining({
          code: "completed_tool_observation_not_reentered",
          call_id: "call:2",
        }),
      ]),
    });
  });

  it("records blocked gateway admission as rejection rather than admitted execution", () => {
    const blocked = gatewayResult("visual_analysis.inspect_image_region", 1);
    blocked.ok = false;
    blocked.gateway_admission.admission_status = "blocked";
    blocked.gateway_admission.blocked_reason = "active_image_lens_source_missing";

    const lifecycle = buildCodexProviderTurnLifecycle({
      turnId: "ask:test:blocked-admission",
      routeCommitId: "route:test:image-lens",
      gatewayCallResults: [blocked],
      providerReasoningReentry: { evidence_reentered: false },
      providerText: "The active image source is unavailable.",
      terminalArtifactKind: "typed_failure",
      terminalEligible: true,
      ok: false,
      terminalReasonCode: "active_image_lens_source_missing",
    });

    expect(lifecycle.reduction.admitted_capability_ids).toEqual([]);
    expect(lifecycle.events.map((event) => event.kind)).toEqual(expect.arrayContaining([
      "capability.rejected",
      "tool.call.rejected",
      "turn.failed",
    ]));
    expect(lifecycle.events.map((event) => event.kind)).not.toContain("tool.call.started");
  });
});
