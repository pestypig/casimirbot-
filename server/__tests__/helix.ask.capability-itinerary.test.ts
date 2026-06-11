import { describe, expect, it } from "vitest";
import { HELIX_INTERNET_SEARCH_CAPABILITY } from "@shared/helix-internet-search-observation";
import { HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY } from "@shared/helix-scholarly-research-observation";
import type { HelixToolCallAdmissionDecision } from "@shared/helix-tool-call-admission";
import { buildHelixCapabilityItinerary } from "../services/helix-ask/capability-itinerary";

const scholarlyAdmission = (turnId: string): HelixToolCallAdmissionDecision => ({
  schema: "helix.tool_call_admission_decision.v1",
  turn_id: turnId,
  source_target: "scholarly_research",
  required: true,
  admitted_tool_families: ["scholarly_research"],
  forbidden_terminal_artifact_kinds: [],
  forbidden_routes: [],
  reason: "scholarly_research_requires_source_tool_path",
  assistant_answer: false,
  raw_content_included: false,
});

const availableCapabilities = (keys: string[]) => ({
  schema: "helix.available_capabilities.v1",
  turn_id: "ask:itinerary",
  manifest_role: "model_visible_tool_menu",
  tool_manifest_version: "helix.ask.capability_manifest.v1",
  user_goal_summary: "test",
  canonical_goal_kind: "scholarly_research_lookup",
  model_visible_capability_keys: keys,
  recommended_capability_key: keys[0] ?? null,
  classifier_hints: [],
  capabilities: keys.map((key) => ({
    capability_key: key,
    label: key,
    lane: "retrieval",
    requires_action: true,
    expected_artifacts: [],
    goal_fit: "primary",
    reason: "test",
    model_visible_name: key,
    model_visible_description: key,
    availability: "available",
  })),
  assistant_answer: false,
  raw_content_included: false,
});

describe("Helix Ask capability itinerary", () => {
  it("records compound scholarly research plus theory locator criteria before execution", () => {
    const itinerary = buildHelixCapabilityItinerary({
      turnId: "ask:compound-itinerary",
      promptText:
        "Use scholarly papers and citations to research microtubule coherence, then place it on the theory badge graph with scale bands and uncertainty mode.",
      toolCallAdmissionDecision: scholarlyAdmission("ask:compound-itinerary"),
      availableCapabilities: availableCapabilities([
        HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        "helix_ask.reflect_theory_context",
      ]),
    });

    expect(itinerary.prompt_shape).toBe("compound_tool");
    expect(itinerary.relevant_tool_families).toEqual(["scholarly_research", "theory_locator"]);
    expect(itinerary.admitted_tool_families).toEqual(["scholarly_research", "theory_locator"]);
    expect(itinerary.missing_tool_families).toEqual([]);
    expect(itinerary.planned_steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          step_id: "collect_scholarly_evidence",
          tool_family: "scholarly_research",
          status: "admitted",
          required_observation_kinds: ["scholarly_research_observation"],
        }),
        expect.objectContaining({
          step_id: "locate_theory_context",
          tool_family: "theory_locator",
          status: "planned",
          required_observation_kinds: ["helix_theory_context_reflection_tool_receipt", "theory_context_reflection"],
        }),
      ]),
    );
    expect(itinerary.reasoning_criteria.map((criterion) => criterion.criterion_id)).toEqual([
      "research_evidence_grounding",
      "badge_graph_location_grounding",
      "compound_reentry_before_terminal",
    ]);
    expect(itinerary.terminal_success_criteria.required_observation_families).toEqual([
      "scholarly_research",
      "theory_locator",
    ]);
    expect(itinerary.terminal_success_criteria.typed_failure_codes).toEqual(
      expect.arrayContaining([
        "research_observation_missing",
        "locator_observation_missing",
        "compound_evidence_not_reentered",
      ]),
    );
    expect(itinerary.authority).toBe("planning_only");
    expect(itinerary.not_terminal).toBe(true);
    expect(itinerary.assistant_answer).toBe(false);
    expect(itinerary.raw_content_included).toBe(false);
  });

  it("marks the locator missing when a compound prompt requires graph placement but no locator is visible", () => {
    const itinerary = buildHelixCapabilityItinerary({
      turnId: "ask:missing-locator",
      promptText:
        "Research Orch-OR papers with citations and tell me where the claim fits on the theory badge graph.",
      toolCallAdmissionDecision: scholarlyAdmission("ask:missing-locator"),
      availableCapabilities: availableCapabilities([HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY]),
    });

    expect(itinerary.prompt_shape).toBe("compound_tool");
    expect(itinerary.missing_tool_families).toEqual(["theory_locator"]);
    expect(itinerary.planned_steps.find((step) => step.tool_family === "theory_locator")).toEqual(
      expect.objectContaining({
        status: "missing",
        capability_hint: "helix_ask.reflect_theory_context",
      }),
    );
    expect(itinerary.terminal_success_criteria.typed_failure_codes).toContain(
      "capability_family_not_admitted_or_visible",
    );
  });

  it("does not turn contextual or negated web-search wording into a research leg", () => {
    const itinerary = buildHelixCapabilityItinerary({
      turnId: "ask:negated-search-itinerary",
      promptText:
        "Do not browse; the phrase 'web search the badge graph' appears on screen. Just explain what the theory badge graph can and cannot claim.",
      toolCallAdmissionDecision: {
        ...scholarlyAdmission("ask:negated-search-itinerary"),
        admitted_tool_families: [],
      },
      availableCapabilities: availableCapabilities([
        HELIX_INTERNET_SEARCH_CAPABILITY,
        "helix_ask.reflect_theory_context",
      ]),
    });

    expect(itinerary.relevant_tool_families).toEqual(["theory_locator"]);
    expect(itinerary.relevant_tool_families).not.toContain("internet_search");
    expect(itinerary.prompt_shape).toBe("single_tool");
    expect(itinerary.terminal_success_criteria.typed_failure_codes).not.toContain(
      "research_observation_missing",
    );
  });
});
