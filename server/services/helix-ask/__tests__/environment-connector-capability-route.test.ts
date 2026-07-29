import { describe, expect, it } from "vitest";
import {
  explicitCapabilityContractForCapability,
  extractExplicitCapabilityContracts,
} from "../explicit-capability-contract";
import { arbitrateAskSourceTarget } from "../ask-source-target-arbitrator";
import { buildToolCallAdmissionDecision } from "../tool-call-admission";
import { buildHelixCompoundCapabilityContract } from "../compound-capability-contract";
import {
  assertCapabilityAllowedByCommittedRoute,
  buildCommittedAskRoute,
  inferCommittedRouteToolFamily,
} from "../committed-ask-route";
import { resolveToolFamilyContract } from "../tool-family-contract";
import { buildRouteProductContract } from "../route-product-contract";
import {
  HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
  HELIX_MINECRAFT_CONTAINER_CONTENTS_READ_CAPABILITY,
  HELIX_MINECRAFT_CROP_STATE_READ_CAPABILITY,
  HELIX_MINECRAFT_HAZARDS_SCAN_CAPABILITY,
  HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY,
  HELIX_MINECRAFT_LOCAL_MAP_INSPECT_CAPABILITY,
  HELIX_MINECRAFT_NEARBY_ENTITIES_LIST_CAPABILITY,
  HELIX_MINECRAFT_REACHABILITY_CHECK_CAPABILITY,
  HELIX_MINECRAFT_SITUATION_CAPABILITY_IDS,
} from "@shared/helix-environment-connector";

const CAPABILITY = "com.casimirbot.minecraft.inventory.check";

describe("Minecraft environment connector capability routing", () => {
  it.each([
    "Monitor my Minecraft session and only tell me about danger or progress.",
    "Set up a Minecraft Cortana live environment using the active visual source.",
  ])("keeps Minecraft session setup on the action lane: %s", (prompt) => {
    const sourceTargetIntent = arbitrateAskSourceTarget({
      turnId: "turn:minecraft-session-setup",
      threadId: "thread:minecraft-session-setup",
      promptText: prompt,
    });
    expect(sourceTargetIntent).toMatchObject({
      target_source: "workspace_panel",
      target_kind: "workspace_panel",
      strength: "hard",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
      precedence_reason:
        "minecraft_situation_session_setup_is_action_not_evidence",
    });
    expect(extractExplicitCapabilityContracts(prompt)).toEqual([]);
  });

  it("classifies the exact capability as live environment evidence", () => {
    expect(explicitCapabilityContractForCapability(CAPABILITY)).toMatchObject({
      capability: CAPABILITY,
      capability_family: "live_environment",
      source_target: "live_environment",
      required_terminal_kind: "model_synthesized_answer",
      required_observation_kinds: expect.arrayContaining([
        "helix.environment_connector.probe_observation.v1",
      ]),
    });
    expect(inferCommittedRouteToolFamily(CAPABILITY)).toBe("live_environment");
    expect(resolveToolFamilyContract({ toolName: CAPABILITY })).toMatchObject({
      toolFamily: "live_environment",
      authority: "evidence_only",
      mutating: false,
      requiredReentry: true,
    });
    for (const capability of HELIX_MINECRAFT_SITUATION_CAPABILITY_IDS) {
      expect(explicitCapabilityContractForCapability(capability)).toMatchObject(
        {
          capability,
          capability_family: "live_environment",
          source_target: "live_environment",
          required_terminal_kind: "model_synthesized_answer",
          required_observation_kinds: expect.arrayContaining([
            "helix.environment_connector.probe_observation.v1",
          ]),
        },
      );
      expect(resolveToolFamilyContract({ toolName: capability })).toMatchObject(
        {
          toolFamily: "live_environment",
          authority: "evidence_only",
          mutating: false,
          requiredReentry: true,
        },
      );
    }
  });

  it.each([
    [
      "Check my current health and hunger in Minecraft.",
      HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
    ],
    [
      "In Minecraft, list the mobs nearby around me.",
      HELIX_MINECRAFT_NEARBY_ENTITIES_LIST_CAPABILITY,
    ],
    [
      "In Minecraft, am I in danger from hostile mobs nearby right now?",
      HELIX_MINECRAFT_HAZARDS_SCAN_CAPABILITY,
    ],
    [
      "Inspect the local terrain around me in Minecraft.",
      HELIX_MINECRAFT_LOCAL_MAP_INSPECT_CAPABILITY,
    ],
    [
      "In Minecraft, check whether I have line of sight to that position.",
      HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY,
    ],
    [
      "In Minecraft, check whether the wheat crop is mature.",
      HELIX_MINECRAFT_CROP_STATE_READ_CAPABILITY,
    ],
    [
      "In Minecraft, check whether I can reach that position.",
      HELIX_MINECRAFT_REACHABILITY_CHECK_CAPABILITY,
    ],
  ])(
    "admits the natural read-only situation request %s",
    (prompt, expected) => {
      expect(extractExplicitCapabilityContracts(prompt)).toContainEqual(
        expect.objectContaining({
          capability: expected,
          source: "natural_capability_intent",
        }),
      );
    },
  );

  it("can admit several evidence probes for one situation question without making any observation terminal", () => {
    const capabilities = extractExplicitCapabilityContracts(
      "In Minecraft, check my health and current Minecraft inventory, then tell me whether hostile mobs are nearby right now.",
    ).map((entry) => entry.capability);

    expect(capabilities).toEqual(
      expect.arrayContaining([
        HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
        CAPABILITY,
        HELIX_MINECRAFT_HAZARDS_SCAN_CAPABILITY,
      ]),
    );
  });

  it("recognizes closed-container knowledge as an exact unsupported frontier without advertising it as an implemented situation probe", () => {
    const prompt =
      "In this Minecraft room, inspect the contents of the nearest closed chest without opening it and tell me exactly what is inside.";
    const contracts = extractExplicitCapabilityContracts(prompt);

    expect(contracts).toContainEqual(
      expect.objectContaining({
        capability: HELIX_MINECRAFT_CONTAINER_CONTENTS_READ_CAPABILITY,
        source: "natural_capability_intent",
      }),
    );
    expect(HELIX_MINECRAFT_SITUATION_CAPABILITY_IDS).not.toContain(
      HELIX_MINECRAFT_CONTAINER_CONTENTS_READ_CAPABILITY,
    );
    expect(
      buildHelixCompoundCapabilityContract({
        turnId: "ask:test:minecraft-closed-container-frontier",
        promptText: prompt,
      })?.subgoals,
    ).toEqual([
      expect.objectContaining({
        requested_capability:
          HELIX_MINECRAFT_CONTAINER_CONTENTS_READ_CAPABILITY,
        runtime_capability: HELIX_MINECRAFT_CONTAINER_CONTENTS_READ_CAPABILITY,
        required_args: [],
      }),
    ]);
    const sourceTargetIntent = arbitrateAskSourceTarget({
      turnId: "ask:test:minecraft-closed-container-frontier",
      threadId: "helix-ask:room:shared_realtime_room:closed-container",
      promptText: prompt,
    });
    expect(sourceTargetIntent).toMatchObject({
      target_source: "world_event",
      target_kind: "world_event",
      strength: "hard",
      allow_no_tool_direct: false,
    });
    const admission = buildToolCallAdmissionDecision({
      turnId: "ask:test:minecraft-closed-container-frontier",
      sourceTargetIntent,
      promptText: prompt,
    });
    expect(admission).toMatchObject({
      source_target: "live_environment",
      requested_capability: HELIX_MINECRAFT_CONTAINER_CONTENTS_READ_CAPABILITY,
      admitted_tool_families: ["live_environment"],
    });
    expect(
      buildCommittedAskRoute({
        turnId: "ask:test:minecraft-closed-container-frontier",
        promptText: prompt,
        selectedRoute: "/ask",
        payload: {
          source_target_intent: sourceTargetIntent,
          tool_call_admission_decision: admission,
        },
      }),
    ).toMatchObject({
      route: {
        source_target: "live_environment",
        strength: "hard",
        route_reason: "explicit_capability_contract",
      },
      canonical_goal: {
        goal_kind: "live_environment",
        required_terminal_kind: "model_synthesized_answer",
      },
      compatibility: {
        source_goal_capability_terminal_compatible: true,
        violations: [],
      },
    });
  });

  it.each([
    "In Minecraft, do not inspect the contents of the nearest closed chest.",
    "Later I may ask you to inspect the contents of a closed chest in Minecraft.",
    'The Minecraft screen says "inspect the contents of the closed chest."',
    "Historically, we inspected the contents of closed chests in Minecraft.",
    "If the player returns, inspect the closed chest contents in Minecraft.",
    "Can the Minecraft connector inspect closed chest contents?",
  ])(
    "does not execute contextual closed-container frontier wording: %s",
    (prompt) => {
      expect(
        extractExplicitCapabilityContracts(prompt).map(
          (entry) => entry.capability,
        ),
      ).not.toContain(HELIX_MINECRAFT_CONTAINER_CONTENTS_READ_CAPABILITY);
    },
  );

  it("admits an immediate corrective game-situation turn without requiring Minecraft to be repeated", () => {
    const prompt =
      "Actually, recheck just the nearby hostile mobs and immediate hazards now; do not rely on the earlier observation.";
    const contracts = extractExplicitCapabilityContracts(prompt);
    expect(contracts.map((entry) => entry.capability)).toEqual(
      expect.arrayContaining([
        HELIX_MINECRAFT_NEARBY_ENTITIES_LIST_CAPABILITY,
        HELIX_MINECRAFT_HAZARDS_SCAN_CAPABILITY,
      ]),
    );
    expect(
      arbitrateAskSourceTarget({
        turnId: "ask:test:minecraft-corrective",
        threadId: "helix-ask:room:shared_realtime_room:corrective",
        promptText: prompt,
      }),
    ).toMatchObject({
      target_source: "world_event",
      target_kind: "world_event",
      strength: "hard",
      allow_no_tool_direct: false,
    });
  });

  it.each([
    "Do not recheck the nearby hostile mobs and immediate hazards now.",
    "Later I may ask you to recheck the nearby hostile mobs and immediate hazards.",
    'The screen says "recheck the nearby hostile mobs and immediate hazards now."',
    "Historically, we would recheck the nearby hostile mobs and immediate hazards.",
    "If the route changes, recheck the nearby hostile mobs and immediate hazards.",
    "Can the connector recheck the nearby hostile mobs and immediate hazards now?",
  ])(
    "does not execute contextual game-situation continuation wording: %s",
    (prompt) => {
      expect(extractExplicitCapabilityContracts(prompt)).toEqual([]);
      expect(
        arbitrateAskSourceTarget({
          turnId: `ask:test:minecraft-corrective:${prompt.length}`,
          threadId: "helix-ask:room:shared_realtime_room:corrective",
          promptText: prompt,
        }).target_source,
      ).not.toBe("world_event");
    },
  );

  it("keeps the Minecraft room context for a natural status, armor, and inventory request", () => {
    const capabilities = extractExplicitCapabilityContracts(
      "In this Minecraft room, check my current health, hunger or effects, armor, and inventory now. Am I equipped to explore for a few minutes?",
    ).map((entry) => entry.capability);

    expect(capabilities).toEqual(
      expect.arrayContaining([
        HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
        CAPABILITY,
      ]),
    );
  });

  it("materializes trusted semantic targets for compound Minecraft probes", () => {
    const actorContract = buildHelixCompoundCapabilityContract({
      turnId: "ask:test:minecraft-targets",
      promptText:
        "In this Minecraft room, check my current health and inventory now.",
    });
    expect(actorContract?.subgoals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requested_capability: HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
          required_args: ["target"],
          args_hint: { target: "current_actor" },
        }),
        expect.objectContaining({
          requested_capability: CAPABILITY,
          required_args: ["target"],
          args_hint: { target: "current_actor" },
        }),
      ]),
    );

    const positionContract = buildHelixCompoundCapabilityContract({
      turnId: "ask:test:minecraft-position-targets",
      promptText:
        "In this Minecraft room, check both line of sight and straight-line geometric reachability to x=100 y=80 z=103 now.",
    });
    expect(positionContract?.subgoals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requested_capability: HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY,
          required_args: ["target", "position"],
          args_hint: {
            target: "position",
            position: { x: 100, y: 80, z: 103 },
          },
        }),
        expect.objectContaining({
          requested_capability: HELIX_MINECRAFT_REACHABILITY_CHECK_CAPABILITY,
          required_args: ["target", "position"],
          args_hint: {
            target: "position",
            position: { x: 100, y: 80, z: 103 },
          },
        }),
      ]),
    );

    const cropContract = buildHelixCompoundCapabilityContract({
      turnId: "ask:test:minecraft-crop-target",
      promptText:
        "In this Minecraft room, check whether the wheat at x=100 y=80 z=103 is mature now.",
    });
    expect(cropContract?.subgoals).toEqual([
      expect.objectContaining({
        requested_capability: HELIX_MINECRAFT_CROP_STATE_READ_CAPABILITY,
        required_args: ["target"],
        args_hint: {
          target: "position",
          position: { x: 100, y: 80, z: 103 },
        },
      }),
    ]);
  });

  it("routes an affirmative Crimson Curse state question through the current actor observation", () => {
    expect(
      extractExplicitCapabilityContracts(
        "In Minecraft, check the current Crimson Curse infection phase, mass, and points now.",
      ),
    ).toContainEqual(
      expect.objectContaining({
        capability: HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
        source: "natural_capability_intent",
      }),
    );
  });

  it.each([
    "In Minecraft, do not check the Crimson Curse infection phase.",
    "In Minecraft, later I may ask you to check the Crimson Curse infection phase.",
    'The Minecraft guide says "check the Crimson Curse infection phase now."',
    "Can the Minecraft connector check the Crimson Curse infection phase?",
  ])(
    "does not execute contextual Crimson Curse state wording: %s",
    (prompt) => {
      expect(
        extractExplicitCapabilityContracts(prompt).map(
          (entry) => entry.capability,
        ),
      ).not.toContain(HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY);
    },
  );

  it.each([
    "In Minecraft, check my health but do not check my inventory.",
    "In Minecraft, later I may ask you to check my health and inventory.",
    'The Minecraft guide says "check my health and inventory now."',
    "Can the Minecraft connector check my health and inventory?",
  ])(
    "does not admit contextual or non-affirmative inventory wording from a broader Minecraft clause: %s",
    (prompt) => {
      expect(
        extractExplicitCapabilityContracts(prompt).map(
          (entry) => entry.capability,
        ),
      ).not.toContain(CAPABILITY);
    },
  );

  it.each([
    "Check my current Minecraft inventory now using the connected environment.",
    "What is the player carrying in Minecraft right now? Inspect the connected world before answering.",
  ])(
    "admits an affirmative natural inventory request without inventing internet search: %s",
    (prompt) => {
      expect(extractExplicitCapabilityContracts(prompt)).toContainEqual(
        expect.objectContaining({
          capability: CAPABILITY,
          source: "natural_capability_intent",
          contract: expect.objectContaining({
            source_target: "live_environment",
            capability_family: "live_environment",
          }),
        }),
      );
    },
  );

  it("lets the exact connector contract replace generic world-event tool admission", () => {
    const turnId = "ask:test:minecraft-environment-connector-admission";
    const prompt =
      "Check my current Minecraft inventory now using the connected environment.";
    const sourceTargetIntent = arbitrateAskSourceTarget({
      turnId,
      threadId: "thread:test",
      promptText: prompt,
    });
    const admission = buildToolCallAdmissionDecision({
      turnId,
      sourceTargetIntent,
      promptText: prompt,
    });

    expect(admission).toMatchObject({
      original_source_target: "world_event",
      effective_source_target: "live_environment",
      source_target: "live_environment",
      requested_capability: CAPABILITY,
      requested_capability_family: "live_environment",
      admitted_tool_families: ["live_environment"],
      mandatory_capability_admitted: true,
    });
    expect(admission.admitted_tool_families).not.toContain("world_event");
  });

  it("narrows an exact Minecraft contract to live-environment tool admission", () => {
    const turnId = "ask:test:minecraft-exact-committed-route";
    const prompt =
      "What is the player carrying in Minecraft right now? Inspect the connected world before answering.";
    const sourceTargetIntent = arbitrateAskSourceTarget({
      turnId,
      threadId: "thread:test",
      promptText: prompt,
    });
    const admission = buildToolCallAdmissionDecision({
      turnId,
      sourceTargetIntent,
      promptText: prompt,
    });
    const committedRoute = buildCommittedAskRoute({
      turnId,
      promptText: prompt,
      selectedRoute: "/ask",
      payload: {
        source_target_intent: {
          ...sourceTargetIntent,
          // A stale/soft upstream projection must not weaken the exact
          // capability contract that commits this route as hard.
          strength: "soft",
        },
        tool_call_admission_decision: admission,
      },
    });

    expect(committedRoute.route).toMatchObject({
      source_target: "live_environment",
      strength: "hard",
      route_reason: "explicit_capability_contract",
    });
    expect(committedRoute.capability_policy.allowed_tool_families).toEqual([
      "live_environment",
    ]);
    expect(
      assertCapabilityAllowedByCommittedRoute({
        committedRoute,
        capabilityId: CAPABILITY,
      }),
    ).toMatchObject({ allowed: true });
    expect(
      assertCapabilityAllowedByCommittedRoute({
        committedRoute,
        capabilityId: "internet-search.search_web",
      }),
    ).toMatchObject({
      allowed: false,
      reason: "selected_capability_not_allowed_by_committed_route",
    });
  });

  it("commits a prior Minecraft observation follow-up as live-environment evidence synthesis", () => {
    const turnId = "ask:test:minecraft-prior-evidence";
    const prompt =
      "Given the current Minecraft observations you just gathered, what should I fix first?";
    const sourceTargetIntent = {
      schema: "helix.ask.source_target_intent.v1",
      turn_id: turnId,
      thread_id: "helix-ask:room:shared_realtime_room:prior-evidence",
      target_source: "world_event",
      target_kind: "world_event",
      strength: "hard",
      precedence_reason: "explicit_current_world_followup",
    };
    const routeProductContract = buildRouteProductContract({
      turnId,
      threadId: sourceTargetIntent.thread_id,
      sourceTargetIntent,
      promptText: prompt,
    });
    const committedRoute = buildCommittedAskRoute({
      turnId,
      promptText: prompt,
      selectedRoute: "/ask",
      payload: {
        source_target_intent: sourceTargetIntent,
        route_product_contract: routeProductContract,
        canonical_goal_frame: {
          goal_kind: "model_only_concept",
          required_terminal_kind: "direct_answer_text",
        },
        conversation_memory_packet: {
          schema: "helix.conversation_memory_packet.v1",
          current_turn_id: turnId,
          allowed_for_current_goal: true,
          allowed_use: "reuse_prior_evidence_refs",
          reusable_evidence_refs: ["ask:turn-1:environment:reachability"],
        },
      },
    });

    expect(routeProductContract.allowed_terminal_artifact_kinds).toContain(
      "model_synthesized_answer",
    );
    expect(committedRoute).toMatchObject({
      route: {
        source_target: "world_event",
        strength: "hard",
      },
      canonical_goal: {
        goal_kind: "environment_evidence_synthesis",
        required_terminal_kind: "model_synthesized_answer",
      },
      capability_policy: {
        allowed_tool_families: ["live_environment"],
        required_capability_families: ["live_environment"],
      },
      terminal_product: {
        evidence_reentry_required: true,
        followup_reasoning_required: true,
        required_terminal_product: "model_synthesized_answer",
      },
      compatibility: {
        source_goal_capability_terminal_compatible: true,
        violations: [],
      },
    });
  });

  it.each([
    "Do not check my Minecraft inventory.",
    "Later, I may ask you to check my Minecraft inventory.",
    'The docs say "check my Minecraft inventory" as an example.',
    "Why did the previous turn say it checked my Minecraft inventory?",
    "Can the connector check my Minecraft inventory?",
    "Do not check what the player is carrying in Minecraft.",
    "Later I may ask what the player is carrying in Minecraft.",
    'The docs say "what is the player carrying in Minecraft?" as an example.',
    "Why did the previous turn say what the player was carrying in Minecraft?",
  ])("does not admit contextual or non-executable wording: %s", (prompt) => {
    expect(
      extractExplicitCapabilityContracts(prompt).some(
        (entry) => entry.capability === CAPABILITY,
      ),
    ).toBe(false);
  });

  it.each([
    [
      "Do not check my current health in Minecraft.",
      HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
    ],
    [
      "Later, I may ask you to list the mobs nearby in Minecraft.",
      HELIX_MINECRAFT_NEARBY_ENTITIES_LIST_CAPABILITY,
    ],
    [
      'The docs use "In Minecraft, am I in danger from hostile mobs nearby?" as an example.',
      HELIX_MINECRAFT_HAZARDS_SCAN_CAPABILITY,
    ],
    [
      "Why did the previous turn inspect the local terrain around me in Minecraft?",
      HELIX_MINECRAFT_LOCAL_MAP_INSPECT_CAPABILITY,
    ],
    [
      "Can the connector check line of sight in Minecraft?",
      HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY,
    ],
    [
      "Do not check whether the Minecraft wheat crop is mature.",
      HELIX_MINECRAFT_CROP_STATE_READ_CAPABILITY,
    ],
    [
      "If we later ask, check whether I can reach that position in Minecraft.",
      HELIX_MINECRAFT_REACHABILITY_CHECK_CAPABILITY,
    ],
    [
      'The screen shows "check line of sight in Minecraft" as suggested text.',
      HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY,
    ],
  ])("rejects contextual Minecraft probe wording: %s", (prompt, capability) => {
    expect(
      extractExplicitCapabilityContracts(prompt).some(
        (entry) => entry.capability === capability,
      ),
    ).toBe(false);
  });

  it("admits the affirmative half of a mixed geometry request without admitting its negated half", () => {
    const capabilities = extractExplicitCapabilityContracts(
      "In Minecraft, check line of sight to x=100 y=80 z=103, but do not check reachability.",
    ).map((entry) => entry.capability);

    expect(capabilities).toContain(
      HELIX_MINECRAFT_LINE_OF_SIGHT_CHECK_CAPABILITY,
    );
    expect(capabilities).not.toContain(
      HELIX_MINECRAFT_REACHABILITY_CHECK_CAPABILITY,
    );
  });
});
