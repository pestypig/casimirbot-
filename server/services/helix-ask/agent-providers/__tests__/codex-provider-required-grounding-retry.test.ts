import { describe, expect, it } from "vitest";
import {
  buildCodexGatewayObservationReentryPrompt,
  buildCodexContinuationCapabilityInputContractLines,
  buildCodexCapabilityLaneRetryInstruction,
  buildCapabilityLaneMutationEpochHistory,
  buildCodexGenericContinuationDecisionInstruction,
  continuationStateRequiresCodexModelAuthoredCapabilityProposal,
  continuationStateAdmitsModelAuthoredRetryLaneRequest,
  continuationStateAdmitsPreparedRuntimeRetryLaneRequest,
  continuationStateAdmitsRuntimeRetryLaneRequest,
  providerMentionedAdmittedCapabilityIds,
  runtimeProviderRequiredGroundingCapabilityIdsFromBody,
  shouldAllowCodexObservationDependentCapabilityProposal,
  shouldEnterCodexPostObservationContinuation,
  shouldExtractCodexInitialCapabilityLaneRequest,
  shouldRetryCodexCapabilityLaneRequest,
  shouldRetryCodexPostObservationContinuationAffordance,
} from "../codex-provider";
import { environmentCommandMinecraftManifest } from "../../workstation-tool-gateway/environment-command";
import { environmentProbeMinecraftManifests } from "../../workstation-tool-gateway/environment-probe";
import type { HelixAgentContinuationState } from "../../runtime/agent-continuation-state";

const environmentSpatialRegionMinecraftManifest =
  environmentProbeMinecraftManifests.find(
    (manifest) =>
      manifest.capability_id ===
      "com.casimirbot.minecraft.spatial_region.inspect",
  )!;

describe("Codex required-grounding correction", () => {
  it("allows the same read probe after a successful mutation epoch", () => {
    const spatial = {
      capability: "com.casimirbot.minecraft.spatial_region.inspect",
      arguments: { center: "@s", horizontal_radius: 8 },
    };
    const command = {
      capability: "com.casimirbot.minecraft.command",
      arguments: { command: "fill 1 64 1 1 64 1 minecraft:stone" },
    };
    const history = buildCapabilityLaneMutationEpochHistory({
      requests: [spatial, command, spatial],
      gatewayCallResults: [
        {
          ok: true,
          capability_id: spatial.capability,
          gateway_admission: { requested_capability: spatial.capability },
        },
        {
          ok: true,
          capability_id: command.capability,
          gateway_admission: { requested_capability: command.capability },
        },
        {
          ok: true,
          capability_id: spatial.capability,
          gateway_admission: { requested_capability: spatial.capability },
        },
      ] as any,
      mutatingCapabilityIds: [command.capability],
    });

    expect(history.mutation_epoch).toBe(1);
    expect(history.request_fingerprints[0]).not.toBe(
      history.request_fingerprints[2],
    );
    expect(history.request_fingerprints[0]).toContain("mutation_epoch:0");
    expect(history.request_fingerprints[2]).toContain("mutation_epoch:1");
  });

  it("keeps repeated writes duplicate-stable and does not advance on a failed mutation", () => {
    const spatial = {
      capability: "com.casimirbot.minecraft.spatial_region.inspect",
      arguments: { center: "@s", horizontal_radius: 8 },
    };
    const command = {
      capability: "com.casimirbot.minecraft.command",
      arguments: { command: "fill 1 64 1 1 64 1 minecraft:stone" },
    };
    const history = buildCapabilityLaneMutationEpochHistory({
      requests: [spatial, command, spatial, command],
      gatewayCallResults: [
        {
          ok: true,
          capability_id: spatial.capability,
          gateway_admission: { requested_capability: spatial.capability },
        },
        {
          ok: false,
          capability_id: command.capability,
          gateway_admission: { requested_capability: command.capability },
        },
        {
          ok: true,
          capability_id: spatial.capability,
          gateway_admission: { requested_capability: spatial.capability },
        },
        {
          ok: true,
          capability_id: command.capability,
          gateway_admission: { requested_capability: command.capability },
        },
      ] as any,
      mutatingCapabilityIds: [command.capability],
    });

    expect(history.mutation_epoch).toBe(1);
    expect(history.request_fingerprints[0]).toBe(
      history.request_fingerprints[2],
    );
    expect(history.request_fingerprints[1]).toBe(
      history.request_fingerprints[3],
    );
  });

  it("reads required grounding capabilities from the Realtime route contract", () => {
    expect(runtimeProviderRequiredGroundingCapabilityIdsFromBody({
      route_metadata: {
        requiredGroundingCapabilityIds: ["docs.search"],
        source_target_intent: {
          required_grounding_capability_ids: ["docs.search"],
        },
      },
      realtime_grounded_feedback_binding: {
        required_grounding_capability_ids: ["docs.search"],
      },
    })).toEqual(["docs.search"]);
  });

  it("reads mandatory runtime capabilities from the projected provider itinerary", () => {
    expect(runtimeProviderRequiredGroundingCapabilityIdsFromBody({
      capability_itinerary: {
        compound_capability_contract: {
          subgoals: [
            {
              requested_capability: "docs-viewer.search_docs",
              runtime_capability: "docs.search",
              mandatory: true,
            },
          ],
        },
      },
    })).toEqual(["docs.search"]);
  });

  it("retries a direct locator answer when the required Docs observation is absent", () => {
    expect(shouldRetryCodexCapabilityLaneRequest({
      question: "Find the NHM2 current status whitepaper.",
      providerText:
        "The NHM2 current status whitepaper is docs/research/nhm2-current-status-whitepaper.md.",
      existingObservationPacketCount: 0,
      requiredCapabilityIds: ["docs.search"],
    })).toBe(true);
  });

  it("does not retry once a required observation packet exists", () => {
    expect(shouldRetryCodexCapabilityLaneRequest({
      question: "Find the NHM2 current status whitepaper.",
      providerText: "The document is available.",
      existingObservationPacketCount: 1,
      requiredCapabilityIds: ["docs.search"],
    })).toBe(false);
  });

  it("names the required capability instead of falling back to translation", () => {
    const instruction = buildCodexCapabilityLaneRetryInstruction(
      "Find the NHM2 current status whitepaper.",
      ["docs.search"],
    );

    expect(instruction).toContain("docs.search");
    expect(instruction).not.toContain("live_translation.translate_text");
  });

  it("keeps an unclassified environment retry capability-neutral", () => {
    const instruction = buildCodexCapabilityLaneRetryInstruction(
      "Check my selected Minecraft player right now.",
    );

    expect(instruction).toContain("exactly one admitted capability");
    expect(instruction).toContain("Do not default to translation");
    expect(instruction).not.toContain(
      "compact JSON for live_translation.translate_text",
    );
  });

  it("turns the provider's exact admitted Minecraft capability mention into a bounded retry candidate", () => {
    const actorStatusCapability =
      "com.casimirbot.minecraft.actor.status.read";
    const mentioned = providerMentionedAdmittedCapabilityIds({
      providerText: [
        "I need a live observation before I can answer.",
        `The exact next capability is ${actorStatusCapability} with target current_actor.`,
      ].join(" "),
      admittedCapabilityIds: [
        "docs.search",
        actorStatusCapability,
        "live_translation.translate_text",
      ],
    });
    const instruction = buildCodexCapabilityLaneRetryInstruction(
      "Check my selected Minecraft player right now.",
      [],
      mentioned,
    );

    expect(mentioned).toEqual([actorStatusCapability]);
    expect(instruction).toContain(actorStatusCapability);
    expect(instruction).toContain(
      "Naming or describing a capability did not execute it",
    );
    expect(instruction).not.toContain(
      "compact JSON for live_translation.translate_text",
    );
  });

  it("retries a provider-authored prose proposal for an admitted environment capability", () => {
    const capability = "com.casimirbot.minecraft.spatial_region.inspect";
    expect(shouldRetryCodexCapabilityLaneRequest({
      question:
        "Without changing anything, inspect for a stone-brick wall within 16 blocks.",
      providerText: `Proposing ${capability} to inspect the bounded area.`,
      existingObservationPacketCount: 0,
      providerMentionedCapabilityIds: [capability],
    })).toBe(true);
  });

  it("does not turn an explanatory capability mention into execution", () => {
    const capability = "com.casimirbot.minecraft.spatial_region.inspect";
    expect(shouldRetryCodexCapabilityLaneRequest({
      question: "Explain the environment capability shown on the screen.",
      providerText: `The screen describes ${capability} as a read-only probe.`,
      existingObservationPacketCount: 0,
      providerMentionedCapabilityIds: [capability],
    })).toBe(false);
  });

  it("retains the dedicated translation retry for an affirmative translation request", () => {
    const instruction = buildCodexCapabilityLaneRetryInstruction(
      "Translate hello into Spanish.",
    );

    expect(instruction).toContain(
      "compact JSON for live_translation.translate_text",
    );
  });

  it("requires the exact untried affordance instead of accepting a post-observation refusal", () => {
    const instruction = buildCodexGenericContinuationDecisionInstruction({
      schema: "helix.agent_continuation_state.v1",
      turn_id: "ask:test:exact-compound-continuation",
      state_id: "state:test:exact-compound-continuation",
      sequence: 4,
      trigger: "post_attempt",
      goal: {
        status: "in_progress",
        satisfied: false,
        terminal_product_allowed: false,
      },
      observation_refs: { existing: [], new: [], all: [] },
      missing_requirement_ids: ["com.casimirbot.minecraft.command.catalog"],
      last_attempt: null,
      next_admissible_affordances: [
        {
          affordance_id: "affordance:fill-catalog",
          capability_id: "com.casimirbot.minecraft.command.catalog",
          action: null,
          args: { path_prefix: "fill", limit: 64 },
          lane_request: {
            capability: "com.casimirbot.minecraft.command.catalog",
            path_prefix: "fill",
            limit: 64,
          },
          source_ref: "state:prior",
          reason: "The compound itinerary still needs command grammar.",
          admissible: true,
          tried: false,
          action_fingerprint: "sha256:fill-catalog",
        },
      ],
      capability_proposal: {
        allowed: true,
        admitted_capability_ids: [
          "com.casimirbot.minecraft.command.catalog",
          "com.casimirbot.minecraft.command",
        ],
        authority: "helix_policy_admits_runtime_proposal",
      },
      tried_action_fingerprints: [],
      progress: {
        made_progress: true,
        new_observation_count: 1,
        resolved_requirement_ids: [],
        added_requirement_ids: [],
        new_affordance_count: 1,
        no_progress_repeat_count: 0,
        reason_codes: ["new_observation"],
      },
      budget: {
        soft: {
          iterations: { max: null, consumed: 0, remaining: null },
          tool_calls: { max: null, consumed: 0, remaining: null },
          model_decisions: { max: null, consumed: 0, remaining: null },
          pressure: "none",
          exhausted: false,
        },
        hard: {
          iterations: { max: null, consumed: 0, remaining: null },
          tool_calls: { max: null, consumed: 0, remaining: null },
          model_decisions: { max: null, consumed: 0, remaining: null },
          exhausted: false,
        },
        extension_count: 0,
        max_extensions: null,
      },
      allowed_decisions: ["act", "retry"],
      authority: "runtime_agent_decides_within_admitted_boundaries",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    expect(instruction).toContain(
      "Helix continuation policy does not allow a terminal answer yet",
    );
    expect(instruction).toContain(
      '"capability": "com.casimirbot.minecraft.command.catalog"',
    );
    expect(instruction).toContain("Do not replace");
  });

  it("requires Codex to repair a retryable malformed Minecraft command request", () => {
    const state = {
      schema: "helix.agent_continuation_state.v1",
      turn_id: "ask:test:minecraft-command-repair",
      state_id: "state:test:minecraft-command-repair",
      sequence: 3,
      trigger: "post_attempt",
      goal: {
        status: "in_progress",
        satisfied: false,
        terminal_product_allowed: false,
      },
      observation_refs: { existing: [], new: [], all: [] },
      missing_requirement_ids: [],
      last_attempt: {
        attempt_id: "attempt:malformed-command",
        capability_id: "com.casimirbot.minecraft.command",
        action_fingerprint: "sha256:malformed-command",
        status: "failed",
        failure_class: "invalid_args",
        failure_code: "command_parse_failed",
        failure_message:
          "The Minecraft command capability requires exactly one non-empty command string in command.",
        retryability: "retryable",
        observation_refs: ["observation:malformed-command"],
      },
      next_admissible_affordances: [],
      capability_proposal: {
        allowed: false,
        admitted_capability_ids: ["com.casimirbot.minecraft.command"],
        authority: "helix_policy_admits_runtime_proposal",
      },
      tried_action_fingerprints: ["sha256:malformed-command"],
      progress: {
        made_progress: false,
        new_observation_count: 0,
        resolved_requirement_ids: [],
        added_requirement_ids: [],
        new_affordance_count: 0,
        no_progress_repeat_count: 0,
        reason_codes: ["failed_attempt_observation_only"],
      },
      budget: {
        soft: { pressure: "none", exhausted: false },
        hard: { exhausted: false },
        extension_count: 0,
        max_extensions: 2,
      },
      allowed_decisions: ["retry"],
      authority: "runtime_agent_decides_within_admitted_boundaries",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    } as unknown as HelixAgentContinuationState;

    const instruction = buildCodexGenericContinuationDecisionInstruction(state);

    expect(instruction).toContain("failed retryably");
    expect(instruction).toContain("command_parse_failed");
    expect(instruction).toContain("exactly one non-empty command string");
    expect(instruction).toContain("semantic intent fields are not executable");
    expect(instruction).toContain('"arguments":{"command":"<one concrete Minecraft command>"');
    expect(instruction).toContain("translate only its first unfinished action");
    expect(instruction).toContain("Never emit commands, an array-valued command");
    expect(instruction).not.toContain("Otherwise produce the final grounded answer");
    expect(
      shouldRetryCodexPostObservationContinuationAffordance({
        state,
        providerText:
          "The command arguments were invalid, so the user must provide the exact command.",
      }),
    ).toBe(true);
    expect(
      shouldRetryCodexPostObservationContinuationAffordance({
        state,
        providerText:
          'HELIX_CAPABILITY_LANE_REQUEST_JSON:{"capability":"com.casimirbot.minecraft.command","arguments":{"command":"setblock -50 68 -2 minecraft:fire"}}',
      }),
    ).toBe(false);
    expect(shouldEnterCodexPostObservationContinuation(state)).toBe(true);
  });

  it("does not force a provider retry after the hard boundary is exhausted", () => {
    const state = {
      allowed_decisions: ["retry", "fail"],
      last_attempt: {
        capability_id: "com.casimirbot.minecraft.command",
        failure_code: "command_parse_failed",
        retryability: "retryable",
      },
      next_admissible_affordances: [],
      budget: { hard: { exhausted: true } },
    } as unknown as HelixAgentContinuationState;

    expect(
      shouldRetryCodexPostObservationContinuationAffordance({
        state,
        providerText: "The bounded command repair budget is exhausted.",
      }),
    ).toBe(false);
  });

  it("admits only the failed capability for a model-authored retry without a precomputed affordance", () => {
    const state = {
      allowed_decisions: ["retry"],
      last_attempt: {
        capability_id: "com.casimirbot.minecraft.actor.status.read",
        failure_code: "current_turn_reentry_ineligible",
        retryability: "retryable",
      },
      next_admissible_affordances: [],
      budget: { hard: { exhausted: false } },
    } as unknown as HelixAgentContinuationState;

    expect(
      continuationStateAdmitsModelAuthoredRetryLaneRequest({
        state,
        candidate: {
          capability: "com.casimirbot.minecraft.actor.status.read",
          target: "current_actor",
          freshness_requirement_ms: 5_000,
        },
        admittedCapabilityIds: [
          "com.casimirbot.minecraft.actor.status.read",
          "com.casimirbot.minecraft.inventory.read",
        ],
      }),
    ).toBe(true);
    expect(
      continuationStateAdmitsModelAuthoredRetryLaneRequest({
        state,
        candidate: {
          capability: "com.casimirbot.minecraft.inventory.read",
          target: "current_actor",
        },
        admittedCapabilityIds: [
          "com.casimirbot.minecraft.actor.status.read",
          "com.casimirbot.minecraft.inventory.read",
        ],
      }),
    ).toBe(false);
    expect(
      continuationStateAdmitsModelAuthoredRetryLaneRequest({
        state: {
          ...state,
          budget: { hard: { exhausted: true } },
        } as unknown as HelixAgentContinuationState,
        candidate: {
          capability: "com.casimirbot.minecraft.actor.status.read",
          target: "current_actor",
          freshness_requirement_ms: 5_000,
        },
        admittedCapabilityIds: [
          "com.casimirbot.minecraft.actor.status.read",
        ],
      }),
    ).toBe(false);
  });

  it("admits a semantic same-capability retry even when deterministic affordances use different arguments", () => {
    const state = {
      allowed_decisions: ["retry", "fail"],
      capability_proposal: {
        allowed: true,
        admitted_capability_ids: ["scholarly-research.lookup_papers"],
      },
      last_attempt: {
        capability_id: "scholarly-research.lookup_papers",
        failure_code: "semantic_scholar_http_429",
        retryability: "retryable",
      },
      next_admissible_affordances: [
        {
          affordance_id: "retry:literal-query",
          admissible: true,
          tried: false,
          reason: "Try the prompt-derived query through another source.",
          lane_request: {
            capability: "scholarly-research.lookup_papers",
            query: "one primary gives strongest reality check assumption",
          },
        },
      ],
      budget: { hard: { exhausted: false } },
    } as unknown as HelixAgentContinuationState;

    expect(
      continuationStateAdmitsRuntimeRetryLaneRequest({
        state,
        candidate: {
          capability: "scholarly-research.lookup_papers",
          query:
            "Jacobson thermodynamics of spacetime Einstein equation of state accessible primary paper",
        },
        admittedCapabilityIds: ["scholarly-research.lookup_papers"],
      }),
    ).toBe(true);
    expect(
      continuationStateAdmitsPreparedRuntimeRetryLaneRequest({
        state,
        requestedCandidate: {
          capability: "scholarly-research.lookup_papers",
          query:
            "Jacobson thermodynamics of spacetime Einstein equation of state accessible primary paper",
        },
        preparedCandidate: {
          capability: "scholarly-research.lookup_papers",
          query:
            "Jacobson thermodynamics of spacetime Einstein equation of state accessible primary paper",
          providers: ["semantic_scholar", "arxiv"],
          limit: 5,
        },
        admittedCapabilityIds: ["scholarly-research.lookup_papers"],
      }),
    ).toBe(true);
    expect(
      continuationStateAdmitsRuntimeRetryLaneRequest({
        state,
        candidate: {
          capability: "scholarly-research.fetch_full_text",
          url: "https://example.test/paper.pdf",
        },
        admittedCapabilityIds: [
          "scholarly-research.lookup_papers",
          "scholarly-research.fetch_full_text",
        ],
      }),
    ).toBe(false);
    expect(
      continuationStateAdmitsRuntimeRetryLaneRequest({
        state: {
          ...state,
          budget: { hard: { exhausted: true } },
        } as unknown as HelixAgentContinuationState,
        candidate: {
          capability: "scholarly-research.lookup_papers",
          query:
            "Jacobson thermodynamics of spacetime Einstein equation of state accessible primary paper",
        },
        admittedCapabilityIds: ["scholarly-research.lookup_papers"],
      }),
    ).toBe(false);
  });

  it("admits a Docs search affordance when only transcript sentence punctuation changes", () => {
    const prompt =
      "Find the NHM2 current status whitepaper and explain its least established assumption.";
    const state = {
      allowed_decisions: ["act"],
      capability_proposal: {
        allowed: false,
        admitted_capability_ids: ["docs-viewer.search_docs"],
      },
      last_attempt: null,
      next_admissible_affordances: [{
        affordance_id: "docs-search",
        admissible: true,
        tried: false,
        reason: "doc_evidence_synthesis_requires_doc_search",
        lane_request: {
          capability: "docs-viewer.search_docs",
          authority: "hint_only_agent_must_decide",
          capability_key: "docs-viewer.search_docs",
          query: prompt,
          target_transcript: prompt,
        },
      }],
      budget: { hard: { exhausted: false } },
    } as unknown as HelixAgentContinuationState;

    expect(
      continuationStateAdmitsRuntimeRetryLaneRequest({
        state,
        candidate: {
          capability: "docs-viewer.search_docs",
          authority: "hint_only_agent_must_decide",
          capability_key: "docs-viewer.search_docs",
          query: prompt,
          target_transcript: `${prompt.slice(0, -1)}?`,
        },
        admittedCapabilityIds: ["docs-viewer.search_docs"],
      }),
    ).toBe(true);
    expect(
      continuationStateAdmitsRuntimeRetryLaneRequest({
        state,
        candidate: {
          capability: "docs-viewer.search_docs",
          authority: "hint_only_agent_must_decide",
          capability_key: "docs-viewer.search_docs",
          query: "Find a different document.",
          target_transcript: prompt,
        },
        admittedCapabilityIds: ["docs-viewer.search_docs"],
      }),
    ).toBe(false);
  });

  it("teaches Codex to repair installed command category and effect metadata", () => {
    const state = {
      allowed_decisions: ["retry"],
      last_attempt: {
        capability_id: "com.casimirbot.minecraft.command",
        failure_code: "command_category_mismatch",
        retryability: "retryable",
      },
      next_admissible_affordances: [],
      budget: { hard: { exhausted: false } },
    } as unknown as HelixAgentContinuationState;

    const instruction = buildCodexGenericContinuationDecisionInstruction(state);

    expect(instruction).toContain("category and effect fields");
    expect(instruction).toContain("server_administration/server_administration");
    expect(instruction).toContain("world_build/world_mutation");
    expect(instruction).toContain("query/read_only");
    expect(instruction).toContain("helixgame checkpoint capture_box");
    expect(instruction).toContain("Never join commands with semicolons");
    expect(instruction).toContain("Do not ask the user");
  });

  it("requires a model-authored next request for act-only observation-dependent continuation", () => {
    const instruction = buildCodexGenericContinuationDecisionInstruction({
      schema: "helix.agent_continuation_state.v1",
      turn_id: "ask:test:authored-compound-continuation",
      state_id: "state:test:authored-compound-continuation",
      sequence: 5,
      trigger: "post_attempt",
      goal: {
        status: "in_progress",
        satisfied: false,
        terminal_product_allowed: false,
      },
      observation_refs: { existing: [], new: [], all: [] },
      missing_requirement_ids: ["com.casimirbot.minecraft.command"],
      last_attempt: null,
      next_admissible_affordances: [],
      capability_proposal: {
        allowed: true,
        admitted_capability_ids: ["com.casimirbot.minecraft.command"],
        authority: "helix_policy_admits_runtime_proposal",
      },
      tried_action_fingerprints: [],
      progress: {
        made_progress: true,
        new_observation_count: 1,
        resolved_requirement_ids: [],
        added_requirement_ids: [],
        new_affordance_count: 0,
        no_progress_repeat_count: 0,
        reason_codes: ["new_observation"],
      },
      budget: {
        soft: {
          iterations: { max: null, consumed: 0, remaining: null },
          tool_calls: { max: null, consumed: 0, remaining: null },
          model_decisions: { max: null, consumed: 0, remaining: null },
          pressure: "none",
          exhausted: false,
        },
        hard: {
          iterations: { max: null, consumed: 0, remaining: null },
          tool_calls: { max: null, consumed: 0, remaining: null },
          model_decisions: { max: null, consumed: 0, remaining: null },
          exhausted: false,
        },
        extension_count: 0,
        max_extensions: null,
      },
      allowed_decisions: ["act"],
      authority: "runtime_agent_decides_within_admitted_boundaries",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });

    expect(instruction).toContain("act-only");
    expect(instruction).toContain("schema-valid arguments authored");
    expect(instruction).toContain("Do not answer, refuse, defer");
  });

  it("keeps action available when supporting evidence unlocks a different required admitted capability", () => {
    const commandCapability = "com.casimirbot.minecraft.command";
    expect(
      shouldAllowCodexObservationDependentCapabilityProposal({
        trigger: "post_attempt",
        payload: {
          capability_itinerary_execution_state: {
            missing_required_capabilities: [commandCapability],
          },
        },
        admittedCapabilityIds: [commandCapability, "docs.search"],
        lastAttempt: {
          capability_id: "docs.search",
          status: "succeeded",
        },
      }),
    ).toBe(true);
  });

  it("does not reopen the completed capability or a failed supporting attempt", () => {
    const payload = {
      capability_itinerary_execution_state: {
        missing_required_capabilities: ["docs.search"],
      },
    };
    expect(
      shouldAllowCodexObservationDependentCapabilityProposal({
        trigger: "post_attempt",
        payload,
        admittedCapabilityIds: ["docs.search"],
        lastAttempt: {
          capability_id: "docs.search",
          status: "succeeded",
        },
      }),
    ).toBe(false);
    expect(
      shouldAllowCodexObservationDependentCapabilityProposal({
        trigger: "post_attempt",
        payload: {
          capability_itinerary_execution_state: {
            missing_required_capabilities: [
              "com.casimirbot.minecraft.command",
            ],
          },
        },
        admittedCapabilityIds: ["com.casimirbot.minecraft.command"],
        lastAttempt: {
          capability_id: "docs.search",
          status: "failed",
        },
      }),
    ).toBe(false);
  });

  it("tells Codex to author observation-dependent arguments before answering", () => {
    const prompt = buildCodexGatewayObservationReentryPrompt({
      question:
        "Can you make me glow for ten seconds in the connected Minecraft world?",
      normalizedObservationArtifacts: [],
      continuationState: {
        schema: "helix.agent_continuation_state.v1",
        turn_id: "ask:test:observation-dependent-command",
        state_id: "state:test:observation-dependent-command",
        sequence: 2,
        trigger: "post_attempt",
        goal: {
          status: "in_progress",
          satisfied: false,
          terminal_product_allowed: false,
        },
        observation_refs: { existing: [], new: [], all: [] },
        missing_requirement_ids: ["com.casimirbot.minecraft.command"],
        last_attempt: null,
        next_admissible_affordances: [],
        capability_proposal: {
          allowed: true,
          admitted_capability_ids: ["com.casimirbot.minecraft.command"],
          authority: "helix_policy_admits_runtime_proposal",
        },
        tried_action_fingerprints: [],
        progress: {
          made_progress: true,
          new_observation_count: 1,
          resolved_requirement_ids: [],
          added_requirement_ids: [],
          new_affordance_count: 0,
          no_progress_repeat_count: 0,
          reason_codes: ["new_observation"],
        },
        budget: {
          soft: {
            iterations: { max: null, consumed: 0, remaining: null },
            tool_calls: { max: null, consumed: 0, remaining: null },
            model_decisions: { max: null, consumed: 0, remaining: null },
            pressure: "none",
            exhausted: false,
          },
          hard: {
            iterations: { max: null, consumed: 0, remaining: null },
            tool_calls: { max: null, consumed: 0, remaining: null },
            model_decisions: { max: null, consumed: 0, remaining: null },
            exhausted: false,
          },
          extension_count: 0,
          max_extensions: null,
        },
        allowed_decisions: ["act"],
        authority: "runtime_agent_decides_within_admitted_boundaries",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      availableCapabilities: [environmentCommandMinecraftManifest],
      admittedCapabilityIds: ["com.casimirbot.minecraft.command"],
    });

    expect(prompt).toContain(
      "Codex must author one new structured request for the missing admitted capability with all required arguments",
    );
    expect(prompt).toContain("HELIX_CAPABILITY_LANE_REQUEST_JSON:");
    expect(prompt).toContain("Do not answer while the required capability remains unobserved");
    expect(prompt).toContain(
      '"schema": "helix.continuation_capability_input_contracts.v1"',
    );
    expect(prompt).toContain('"required": [\n          "command"');
    expect(prompt).toContain(
      "A semantic intent, plan, structure, or constraints object is reasoning context only",
    );
  });

  it("keeps retry schemas bounded to the failed capability and explicit repair affordance", () => {
    const lines = buildCodexContinuationCapabilityInputContractLines({
      continuationState: {
        schema: "helix.agent_continuation_state.v1",
        turn_id: "ask:test:bounded-schema-repair",
        state_id: "state:test:bounded-schema-repair",
        sequence: 3,
        trigger: "post_attempt",
        goal: {
          status: "in_progress",
          satisfied: false,
          terminal_product_allowed: false,
        },
        observation_refs: { existing: [], new: [], all: [] },
        missing_requirement_ids: ["com.casimirbot.minecraft.command"],
        last_attempt: {
          attempt_id: null,
          capability_id: "com.casimirbot.minecraft.command",
          action_fingerprint: "sha256:retry",
          status: "failed",
          failure_class: "invalid_args",
          failure_code: "command_parse_failed",
          failure_message: "command_parse_failed",
          retryability: "retryable",
          observation_refs: [],
        },
        next_admissible_affordances: [],
        capability_proposal: {
          allowed: true,
          admitted_capability_ids: [
            "com.casimirbot.minecraft.command",
            "docs.search",
          ],
          authority: "helix_policy_admits_runtime_proposal",
        },
        tried_action_fingerprints: [],
        progress: {
          made_progress: false,
          new_observation_count: 0,
          resolved_requirement_ids: [],
          added_requirement_ids: [],
          new_affordance_count: 0,
          no_progress_repeat_count: 1,
          reason_codes: ["failed_attempt_observation_only"],
        },
        budget: {
          soft: {
            iterations: { max: null, consumed: 0, remaining: null },
            tool_calls: { max: null, consumed: 0, remaining: null },
            model_decisions: { max: null, consumed: 0, remaining: null },
            pressure: "none",
            exhausted: false,
          },
          hard: {
            iterations: { max: null, consumed: 0, remaining: null },
            tool_calls: { max: null, consumed: 0, remaining: null },
            model_decisions: { max: null, consumed: 0, remaining: null },
            exhausted: false,
          },
          extension_count: 0,
          max_extensions: null,
        },
        allowed_decisions: ["retry", "act"],
        authority: "runtime_agent_decides_within_admitted_boundaries",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      availableCapabilities: [environmentCommandMinecraftManifest],
      admittedCapabilityIds: ["com.casimirbot.minecraft.command"],
    });
    const text = lines.join("\n");

    expect(text).toContain('"capability_id": "com.casimirbot.minecraft.command"');
    expect(text).toContain('"required": [\n          "command"');
    expect(text).not.toContain('"capability_id": "docs.search"');
  });

  it("drops a consumed repair schema and prioritizes the still-requested action contract", () => {
    const lines = buildCodexContinuationCapabilityInputContractLines({
      continuationState: {
        schema: "helix.agent_continuation_state.v1",
        turn_id: "ask:test:consumed-spatial-repair",
        state_id: "state:test:consumed-spatial-repair",
        sequence: 6,
        trigger: "post_attempt",
        goal: {
          status: "in_progress",
          satisfied: false,
          terminal_product_allowed: false,
        },
        observation_refs: { existing: [], new: [], all: [] },
        missing_requirement_ids: ["wall_not_built"],
        last_attempt: {
          attempt_id: "call:spatial:3",
          capability_id:
            "com.casimirbot.minecraft.spatial_region.inspect",
          action_fingerprint: "sha256:spatial-repair",
          status: "succeeded",
          failure_class: "none",
          failure_code: null,
          failure_message: "Bounded spatial-region read-only probe completed.",
          retryability: "not_applicable",
          observation_refs: ["observation:spatial:3"],
        },
        next_admissible_affordances: [
          {
            affordance_id: "repair:spatial",
            capability_id:
              "com.casimirbot.minecraft.spatial_region.inspect",
            action: null,
            args: { target: "current_actor" },
            lane_request: {
              capability:
                "com.casimirbot.minecraft.spatial_region.inspect",
              target: "current_actor",
            },
            source_ref: "observation:spatial:failed",
            reason: "Retry the repaired probe.",
            admissible: true,
            tried: true,
            action_fingerprint: "sha256:spatial-repair",
          },
        ],
        capability_proposal: {
          allowed: true,
          admitted_capability_ids: [
            "com.casimirbot.minecraft.spatial_region.inspect",
            "com.casimirbot.minecraft.command",
          ],
          authority: "helix_policy_admits_runtime_proposal",
        },
        tried_action_fingerprints: ["sha256:spatial-repair"],
        progress: {
          made_progress: true,
          new_observation_count: 1,
          resolved_requirement_ids: [],
          added_requirement_ids: [],
          new_affordance_count: 0,
          no_progress_repeat_count: 0,
          reason_codes: ["new_observation"],
        },
        budget: {
          soft: {
            iterations: { max: null, consumed: 0, remaining: null },
            tool_calls: { max: null, consumed: 0, remaining: null },
            model_decisions: { max: null, consumed: 0, remaining: null },
            pressure: "none",
            exhausted: false,
          },
          hard: {
            iterations: { max: null, consumed: 0, remaining: null },
            tool_calls: { max: null, consumed: 0, remaining: null },
            model_decisions: { max: null, consumed: 0, remaining: null },
            exhausted: false,
          },
          extension_count: 0,
          max_extensions: null,
        },
        allowed_decisions: ["act"],
        authority: "runtime_agent_decides_within_admitted_boundaries",
        terminal_eligible: false,
        assistant_answer: false,
        raw_content_included: false,
      },
      availableCapabilities: [
        environmentCommandMinecraftManifest,
        environmentSpatialRegionMinecraftManifest,
      ],
      admittedCapabilityIds: [
        "com.casimirbot.minecraft.spatial_region.inspect",
        "com.casimirbot.minecraft.command",
      ],
      preferredCapabilityIds: ["com.casimirbot.minecraft.command"],
    });
    const text = lines.join("\n");

    expect(text).toContain('"capability_id": "com.casimirbot.minecraft.command"');
    expect(text).not.toContain(
      '"capability_id": "com.casimirbot.minecraft.spatial_region.inspect"',
    );
  });

  it("requires a bounded model-authored proposal only for act-only authorized continuation", () => {
    const state = {
      schema: "helix.agent_continuation_state.v1" as const,
      turn_id: "ask:test:proposal-required",
      state_id: "state:test:proposal-required",
      sequence: 2,
      trigger: "post_attempt" as const,
      goal: {
        status: "in_progress" as const,
        satisfied: false,
        terminal_product_allowed: false,
      },
      observation_refs: { existing: [], new: [], all: [] },
      missing_requirement_ids: ["com.casimirbot.minecraft.command"],
      last_attempt: null,
      next_admissible_affordances: [],
      capability_proposal: {
        allowed: true,
        admitted_capability_ids: ["com.casimirbot.minecraft.command"],
        authority: "helix_policy_admits_runtime_proposal" as const,
      },
      tried_action_fingerprints: [],
      progress: {
        made_progress: true,
        new_observation_count: 1,
        resolved_requirement_ids: [],
        added_requirement_ids: [],
        new_affordance_count: 0,
        no_progress_repeat_count: 0,
        reason_codes: ["new_observation"],
      },
      budget: {
        soft: {
          iterations: { max: null, consumed: 0, remaining: null },
          tool_calls: { max: null, consumed: 0, remaining: null },
          model_decisions: { max: null, consumed: 0, remaining: null },
          pressure: "none" as const,
          exhausted: false,
        },
        hard: {
          iterations: { max: null, consumed: 0, remaining: null },
          tool_calls: { max: null, consumed: 0, remaining: null },
          model_decisions: { max: null, consumed: 0, remaining: null },
          exhausted: false,
        },
        extension_count: 0,
        max_extensions: null,
      },
      allowed_decisions: ["act"] as const,
      authority: "runtime_agent_decides_within_admitted_boundaries" as const,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };

    expect(
      continuationStateRequiresCodexModelAuthoredCapabilityProposal(state),
    ).toBe(true);
    expect(
      continuationStateRequiresCodexModelAuthoredCapabilityProposal({
        ...state,
        allowed_decisions: ["act", "answer"],
      }),
    ).toBe(false);
    expect(
      continuationStateRequiresCodexModelAuthoredCapabilityProposal({
        ...state,
        capability_proposal: {
          ...state.capability_proposal,
          allowed: false,
        },
      }),
    ).toBe(false);
  });

  it("extracts the newly authorized command request after supporting evidence re-entry", () => {
    const continuationState = {
      schema: "helix.agent_continuation_state.v1" as const,
      turn_id: "ask:test:extract-observation-dependent-command",
      state_id: "state:test:extract-observation-dependent-command",
      sequence: 2,
      trigger: "post_attempt" as const,
      goal: {
        status: "in_progress" as const,
        satisfied: false,
        terminal_product_allowed: false,
      },
      observation_refs: { existing: [], new: ["artifact:docs"], all: ["artifact:docs"] },
      missing_requirement_ids: ["com.casimirbot.minecraft.command"],
      last_attempt: null,
      next_admissible_affordances: [],
      capability_proposal: {
        allowed: true,
        admitted_capability_ids: ["com.casimirbot.minecraft.command"],
        authority: "helix_policy_admits_runtime_proposal" as const,
      },
      tried_action_fingerprints: [],
      progress: {
        made_progress: true,
        new_observation_count: 1,
        resolved_requirement_ids: [],
        added_requirement_ids: [],
        new_affordance_count: 0,
        no_progress_repeat_count: 0,
        reason_codes: ["new_observation"],
      },
      budget: {
        soft: {
          iterations: { max: null, consumed: 0, remaining: null },
          tool_calls: { max: null, consumed: 0, remaining: null },
          model_decisions: { max: null, consumed: 0, remaining: null },
          pressure: "none" as const,
          exhausted: false,
        },
        hard: {
          iterations: { max: null, consumed: 0, remaining: null },
          tool_calls: { max: null, consumed: 0, remaining: null },
          model_decisions: { max: null, consumed: 0, remaining: null },
          exhausted: false,
        },
        extension_count: 0,
        max_extensions: null,
      },
      allowed_decisions: ["act"] as const,
      authority: "runtime_agent_decides_within_admitted_boundaries" as const,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };

    expect(
      shouldExtractCodexInitialCapabilityLaneRequest({
        observationPacketCount: 1,
        continuationState,
      }),
    ).toBe(true);
  });

  it("does not extract another request after observations without explicit act-only proposal authority", () => {
    const baseState = {
      schema: "helix.agent_continuation_state.v1" as const,
      turn_id: "ask:test:no-post-observation-proposal",
      state_id: "state:test:no-post-observation-proposal",
      sequence: 2,
      trigger: "post_attempt" as const,
      goal: {
        status: "in_progress" as const,
        satisfied: false,
        terminal_product_allowed: false,
      },
      observation_refs: { existing: [], new: ["artifact:docs"], all: ["artifact:docs"] },
      missing_requirement_ids: [],
      last_attempt: null,
      next_admissible_affordances: [],
      tried_action_fingerprints: [],
      progress: {
        made_progress: true,
        new_observation_count: 1,
        resolved_requirement_ids: [],
        added_requirement_ids: [],
        new_affordance_count: 0,
        no_progress_repeat_count: 0,
        reason_codes: ["new_observation"],
      },
      budget: {
        soft: {
          iterations: { max: null, consumed: 0, remaining: null },
          tool_calls: { max: null, consumed: 0, remaining: null },
          model_decisions: { max: null, consumed: 0, remaining: null },
          pressure: "none" as const,
          exhausted: false,
        },
        hard: {
          iterations: { max: null, consumed: 0, remaining: null },
          tool_calls: { max: null, consumed: 0, remaining: null },
          model_decisions: { max: null, consumed: 0, remaining: null },
          exhausted: false,
        },
        extension_count: 0,
        max_extensions: null,
      },
      authority: "runtime_agent_decides_within_admitted_boundaries" as const,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };

    expect(
      shouldExtractCodexInitialCapabilityLaneRequest({
        observationPacketCount: 1,
        continuationState: {
          ...baseState,
          capability_proposal: {
            allowed: false,
            admitted_capability_ids: ["com.casimirbot.minecraft.command"],
            authority: "helix_policy_admits_runtime_proposal" as const,
          },
          allowed_decisions: ["act"] as const,
        },
      }),
    ).toBe(false);
    expect(
      shouldExtractCodexInitialCapabilityLaneRequest({
        observationPacketCount: 1,
        continuationState: {
          ...baseState,
          capability_proposal: {
            allowed: true,
            admitted_capability_ids: ["com.casimirbot.minecraft.command"],
            authority: "helix_policy_admits_runtime_proposal" as const,
          },
          allowed_decisions: ["act", "answer"] as const,
        },
      }),
    ).toBe(false);
  });
});
