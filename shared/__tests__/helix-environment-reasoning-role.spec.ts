import { describe, expect, it } from "vitest";
import {
  buildHelixEnvironmentReasoningRoleEvent,
  buildHelixEnvironmentReasoningRoleOutput,
  evaluateHelixEnvironmentReasoningRoleCurrentness,
  HelixEnvironmentReasoningRoleReductionError,
  helixEnvironmentReasoningRoleSha256,
  reduceHelixEnvironmentReasoningRoleEvents,
  type HelixEnvironmentReasoningRoleEvent,
  type HelixEnvironmentReasoningRoleEventPayload,
  type HelixEnvironmentReasoningRoleIdentity,
} from "../helix-environment-reasoning-role";

const NOW = "2026-08-23T16:00:00.000Z";

const identity = (
  overrides: Partial<HelixEnvironmentReasoningRoleIdentity> = {},
): HelixEnvironmentReasoningRoleIdentity => ({
  owner_profile_id: "profile:owner",
  room_id: "room:one",
  participant_id: "participant:one",
  environment_binding_id: "environment:one",
  room_source_binding_id: "room_source_binding:one",
  source_id: "source:minecraft",
  world_id: "minecraft:overworld",
  producer_epoch_ref: "producer_epoch:one",
  subject_binding_id: "subject_binding:one",
  subject_native_id: "player:one",
  action_authority_id: "authority:one",
  authority_policy_version: 4,
  authority_expires_at: "2026-08-23T18:00:00.000Z",
  goal_id: "environment_durable_goal:one",
  goal_revision: 19,
  observation_revision: 42,
  principal_turn_id: "ask:principal",
  ...overrides,
});

const proposal = () =>
  buildHelixEnvironmentReasoningRoleOutput({
    roleOutputId: "environment_reasoning_role_output:proposal-one",
    identity: identity(),
    producer: {
      selected_runtime_provider_id: "codex",
      supporting_provider_id: "terra",
      role_profile_id: "environment.prospective.shadow.v1",
      role_artifact_version: "v1",
    },
    inputEvidenceRefs: ["environment_situation_digest:42"],
    payload: {
      role_kind: "prospective_planning",
      proposal_id: "environment_reasoning_proposal:one",
      objective_summary: "Inspect the nearby hazard before moving.",
      capability_id: "com.casimirbot.minecraft.hazards.nearby",
      capability_arguments: { radius: 12 },
      predicted_postconditions: [
        {
          postcondition_id: "postcondition:hazard-scan-current",
          expected_state: "A current bounded hazard observation is available.",
          verification_capability_ids: [
            "com.casimirbot.minecraft.hazards.nearby",
          ],
        },
      ],
      assumptions: ["The selected player remains in the same world."],
      resource_keys: ["minecraft:player:one:observation"],
      confidence: 0.78,
      abstain: false,
    },
    createdAt: NOW,
    expiresAt: "2026-08-23T16:02:00.000Z",
  });

const eventChain = (
  payloads: HelixEnvironmentReasoningRoleEventPayload[],
): HelixEnvironmentReasoningRoleEvent[] => {
  const events: HelixEnvironmentReasoningRoleEvent[] = [];
  payloads.forEach((payload, index) => {
    events.push(
      buildHelixEnvironmentReasoningRoleEvent({
        eventId: `environment_reasoning_role_event:${index + 1}`,
        goalId: "environment_durable_goal:one",
        sequence: index + 1,
        previousEventHash: events.at(-1)?.event_hash ?? null,
        payload,
        occurredAt: `2026-08-23T16:00:0${index}.000Z`,
      }),
    );
  });
  return events;
};

describe("environment reasoning role contract", () => {
  it("builds a nonterminal revision-bound proposal", () => {
    const output = proposal();
    expect(output.identity).toMatchObject({
      goal_revision: 19,
      observation_revision: 42,
      principal_turn_id: "ask:principal",
    });
    expect(output.execution_authority).toBe(false);
    expect(output.answer_authority).toBe(false);
    expect(output.terminal_eligible).toBe(false);
    expect(output.input_evidence_hash).toBe(
      helixEnvironmentReasoningRoleSha256([
        "environment_situation_digest:42",
      ]),
    );
    expect(
      evaluateHelixEnvironmentReasoningRoleCurrentness({
        output,
        currentIdentity: identity(),
        now: NOW,
      }),
    ).toEqual({ current: true, reason: "current", mismatch_fields: [] });
  });

  it.each([
    ["goal_revision_stale", { goal_revision: 20 }],
    ["goal_revision_future", { goal_revision: 18 }],
    ["observation_revision_stale", { observation_revision: 43 }],
    ["observation_revision_future", { observation_revision: 41 }],
    ["identity_mismatch", { world_id: "minecraft:the_end" }],
    ["authority_mismatch", { action_authority_id: "authority:two" }],
  ] as const)("rejects %s output before arbitration", (reason, currentOverrides) => {
    expect(
      evaluateHelixEnvironmentReasoningRoleCurrentness({
        output: proposal(),
        currentIdentity: identity(currentOverrides),
        now: NOW,
      }),
    ).toMatchObject({ current: false, reason });
  });

  it("rejects expired output and expired authority independently", () => {
    expect(
      evaluateHelixEnvironmentReasoningRoleCurrentness({
        output: proposal(),
        currentIdentity: identity(),
        now: "2026-08-23T16:03:00.000Z",
      }),
    ).toMatchObject({ current: false, reason: "role_output_expired" });
    expect(
      evaluateHelixEnvironmentReasoningRoleCurrentness({
        output: proposal(),
        currentIdentity: identity({
          authority_expires_at: "2026-08-23T15:59:00.000Z",
        }),
        now: NOW,
      }),
    ).toMatchObject({ current: false, reason: "authority_expired" });
  });

  it("reduces principal adoption through one execution and measured re-entry", () => {
    const output = proposal();
    const events = eventChain([
      { kind: "role_output_recorded", output },
      {
        kind: "principal_disposition_recorded",
        role_output_id: output.role_output_id,
        disposition: "adopted",
        principal_turn_id: "ask:principal",
        adopted_capability_id: "com.casimirbot.minecraft.hazards.nearby",
        adopted_capability_arguments_hash:
          helixEnvironmentReasoningRoleSha256({ radius: 12 }),
        rationale_summary: "A current hazard scan is the next useful step.",
      },
      {
        kind: "proposal_arbitrated",
        arbitration_id: "environment_reasoning_arbitration:one",
        considered_role_output_ids: [output.role_output_id],
        selected_role_output_id: output.role_output_id,
        status: "selected_one",
        reason: "The principal adopted one current proposal.",
      },
      {
        kind: "execution_link_recorded",
        arbitration_id: "environment_reasoning_arbitration:one",
        role_output_id: output.role_output_id,
        environment_action_request_id: "environment_action_request:one",
        capability_id: "com.casimirbot.minecraft.hazards.nearby",
      },
      {
        kind: "measured_result_link_recorded",
        environment_action_request_id: "environment_action_request:one",
        environment_action_result_ref: "environment_action_evidence:one",
        principal_turn_id: "ask:principal",
        reentry_observation_ref: "agent_step_observation:one",
      },
    ]);

    const projection = reduceHelixEnvironmentReasoningRoleEvents(events);
    expect(projection).toMatchObject({
      revision: 5,
      answer_authority: false,
      terminal_eligible: false,
    });
    expect(projection.execution_links).toHaveLength(1);
    expect(projection.measured_result_links).toHaveLength(1);
  });

  it("does not let an unadopted or invalidated proposal reach execution", () => {
    const output = proposal();
    const unadopted = () =>
      reduceHelixEnvironmentReasoningRoleEvents(
        eventChain([
          { kind: "role_output_recorded", output },
          {
            kind: "proposal_arbitrated",
            arbitration_id: "environment_reasoning_arbitration:bad",
            considered_role_output_ids: [output.role_output_id],
            selected_role_output_id: output.role_output_id,
            status: "selected_one",
            reason: "Attempted selection without principal adoption.",
          },
        ]),
      );
    expect(unadopted).toThrow(HelixEnvironmentReasoningRoleReductionError);
    try {
      unadopted();
    } catch (error) {
      expect(error).toMatchObject({
        code: "reasoning_role_arbitration_selection_invalid",
      });
    }

    const invalidated = () =>
      reduceHelixEnvironmentReasoningRoleEvents(
        eventChain([
          { kind: "role_output_recorded", output },
          {
            kind: "principal_disposition_recorded",
            role_output_id: output.role_output_id,
            disposition: "adopted",
            principal_turn_id: "ask:principal",
            adopted_capability_id:
              "com.casimirbot.minecraft.hazards.nearby",
            adopted_capability_arguments_hash:
              helixEnvironmentReasoningRoleSha256({ radius: 12 }),
            rationale_summary: "Adopted while current.",
          },
          {
            kind: "role_output_invalidated",
            role_output_id: output.role_output_id,
            reason: "observation_revision_advanced",
            superseding_goal_revision: 19,
            superseding_observation_revision: 43,
            evidence_refs: ["environment_situation_digest:43"],
          },
          {
            kind: "proposal_arbitrated",
            arbitration_id: "environment_reasoning_arbitration:stale",
            considered_role_output_ids: [output.role_output_id],
            selected_role_output_id: output.role_output_id,
            status: "selected_one",
            reason: "Attempted stale selection.",
          },
        ]),
      );
    expect(invalidated).toThrow(HelixEnvironmentReasoningRoleReductionError);
    try {
      invalidated();
    } catch (error) {
      expect(error).toMatchObject({
        code: "reasoning_role_arbitration_selection_invalid",
      });
    }
  });

  it("detects poisoned event projections without rewriting history", () => {
    const events = eventChain([
      { kind: "role_output_recorded", output: proposal() },
    ]);
    const poisoned = structuredClone(events);
    poisoned[0].payload = {
      ...(poisoned[0].payload as Extract<
        HelixEnvironmentReasoningRoleEventPayload,
        { kind: "role_output_recorded" }
      >),
      output: {
        ...(poisoned[0].payload as Extract<
          HelixEnvironmentReasoningRoleEventPayload,
          { kind: "role_output_recorded" }
        >).output,
        terminal_eligible: true as never,
      },
    };
    expect(() => reduceHelixEnvironmentReasoningRoleEvents(poisoned)).toThrow();
  });
});
