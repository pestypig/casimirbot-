import { describe, expect, it } from "vitest";
import { validateMoralBadgeLocatorV1 } from "../../moral-badge-locator";
import type { IdeologyGraphDocument } from "../ideology-graph-types";
import { buildIdeologyGraph, loadIdeologyGraphFromFile } from "../load-ideology-graph";
import { locateMoralBadges } from "../locate-moral-badges";

const graphDocument: IdeologyGraphDocument = {
  version: 1,
  rootId: "wisdom-first-principles",
  actionGatePolicy: {
    version: 1,
    covered_action_tags: ["covered-action"],
    legal_key_tags: ["legal-key"],
    ethos_key_tags: ["ethos-key"],
    hard_fail_ids: {
      missing_legal_key: "IDEOLOGY_MISSING_LEGAL_KEY",
    },
  },
  nodes: [
    {
      id: "wisdom-first-principles",
      title: "Wisdom First Principles",
      tags: ["objective_binding"],
      children: [
        "right-speech-and-accurate-formulation",
        "interdependence-yin-yang-balance",
        "two-key-approval",
        "restraint",
      ],
    },
    {
      id: "right-speech-and-accurate-formulation",
      title: "Right Speech and Accurate Formulation",
      aliases: ["accurate wording"],
      tags: ["first_principle", "right_speech", "formulation"],
      references: [{ kind: "doc", title: "Calibration protocol", path: "docs/voice/calibration.md" }],
      actions: [{ label: "Open calibrated wording panel", action: { kind: "openPanel" } }],
    },
    {
      id: "interdependence-yin-yang-balance",
      title: "Interdependence and Yin-Yang Balance",
      tags: ["first_principle", "balance", "interdependence"],
    },
    {
      id: "two-key-approval",
      title: "Two-Key Approval",
      tags: ["covered-action", "legal-key", "ethos-key"],
      actions: [{ label: "Require two-key review", action: { kind: "openPanel" } }],
    },
    {
      id: "restraint",
      title: "Restraint",
      tags: ["trait", "outer_edge"],
      summary: "Delay action when confidence is thin and consequences are high.",
    },
  ],
};

const graph = buildIdeologyGraph(graphDocument);

function locate(text: string) {
  return locateMoralBadges(graph, {
    kind: "user_prompt",
    text,
    refs: ["turn:test"],
    generatedAt: "2026-06-01T00:00:00.000Z",
    locatorId: "moral-badge-locator:test",
  });
}

describe("Moral badge locator", () => {
  it("produces a valid moral_badge_locator/v1 artifact with evidence-only authority", () => {
    const locator = locate("right-speech-and-accurate-formulation should guide this prompt.");

    expect(validateMoralBadgeLocatorV1(locator)).toEqual([]);
    expect(locator.probabilityTerrain?.graphKind).toBe("moral_badge_graph");
    expect(locator.probabilityTerrain?.normalizedMass).toBe(1);
    expect(locator.probabilityTerrain?.interpretation).toBe("placement_probability_not_truth_claim");
    expect(locator.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
    });
  });

  it("locates exact badge ids and maps them to objective binding paths", () => {
    const locator = locate("Use right-speech-and-accurate-formulation.");
    const location = locator.locatedBadges.exact.find(
      (badge) => badge.nodeId === "right-speech-and-accurate-formulation",
    );

    expect(location).toMatchObject({
      matchType: "node_id",
      confidence: 1,
      pathToBinding: ["right-speech-and-accurate-formulation", "wisdom-first-principles"],
      proceduralExpression:
        "principle.right-speech-and-accurate-formulation constrains result.procedural_posture",
    });
    expect(locator.locatedBindings[0]).toMatchObject({
      id: "wisdom-first-principles",
      bindingType: "objective_binding",
      pathNodeIds: ["right-speech-and-accurate-formulation", "wisdom-first-principles"],
    });
  });

  it("classifies label, alias, tag, action label, reference, and likely keyword matches", () => {
    expect(
      locate("Right Speech and Accurate Formulation").locatedBadges.exact.find(
        (badge) => badge.nodeId === "right-speech-and-accurate-formulation",
      )?.matchType,
    ).toBe("label");
    expect(
      locate("Use accurate wording.").locatedBadges.exact.find(
        (badge) => badge.nodeId === "right-speech-and-accurate-formulation",
      )?.matchType,
    ).toBe("alias");
    expect(
      locate("This needs formulation.").locatedBadges.exact.find(
        (badge) => badge.nodeId === "right-speech-and-accurate-formulation",
      )?.matchType,
    ).toBe("tag");
    expect(
      locate("Open calibrated wording panel.").locatedBadges.exact.find(
        (badge) => badge.nodeId === "right-speech-and-accurate-formulation",
      )?.matchType,
    ).toBe("action_label");
    expect(
      locate("Check docs/voice/calibration.md.").locatedBadges.exact.find(
        (badge) => badge.nodeId === "right-speech-and-accurate-formulation",
      )?.matchType,
    ).toBe("reference");
    expect(locate("Confidence consequences should delay action.").locatedBadges.likely[0]).toMatchObject({
      nodeId: "restraint",
      matchType: "keyword_overlap",
      confidence: 0.5,
    });
  });

  it("locates gate terms and yields a requires-check comparison seed", () => {
    const locator = locate("This covered action needs legal-key approval.");
    const gate = locator.locatedBadges.exact.find((badge) => badge.nodeId === "two-key-approval");

    expect(gate).toMatchObject({
      matchType: "gate_term",
      proceduralExpression: "principle.two-key-approval requires result.procedural_posture",
    });
    expect(locator.comparisonSeed).toMatchObject({
      expectedFruitionPosture: "requires_check",
    });
    expect(locator.comparisonSeed.proceduralExpression).toContain("=> requires_check");
  });

  it("includes inferred outer-edge lenses in the comparison seed", () => {
    const locator = locate("Restraint should guide this high consequence action.");

    expect(locator.locatedBadges.inferred.find((badge) => badge.nodeId === "restraint")).toMatchObject({
      matchType: "outer_edge_inference",
    });
    expect(locator.comparisonSeed.selectedNodeIds).toEqual(
      expect.arrayContaining(["restraint", "wisdom-first-principles"]),
    );
    expect(locator.probabilityTerrain?.candidateProbabilityById.restraint).toBeGreaterThan(0);
    expect(locator.probabilityTerrain?.dominantSemanticChunkId).toMatch(/^moral:/);
  });

  it("locates canonical philosophy-derived badges and alias-only cues", async () => {
    const canonicalGraph = await loadIdeologyGraphFromFile();
    const locator = locateMoralBadges(canonicalGraph, {
      kind: "user_prompt",
      text: [
        "Use inherited-conditioning-check to ask if this is my belief or an inherited norm.",
        "Then use purpose-as-inquiry to investigate the dream with evidence based purpose.",
        "Check inspiration-without-imitation for idol worship and approval seeking.",
        "Use goalpost-integrity for criteria drift and recognition-before-transcendence for forgotten people.",
        "Also check ego trapdoor, use only what you need, indomitable spirit, and probability truth.",
      ].join(" "),
      refs: ["turn:canonical"],
      generatedAt: "2026-07-03T00:00:00.000Z",
      locatorId: "moral-badge-locator:canonical-philosophy",
    });
    const locatedIds = [
      ...locator.locatedBadges.exact,
      ...locator.locatedBadges.likely,
      ...locator.locatedBadges.inferred,
    ].map((badge) => badge.nodeId);

    expect(validateMoralBadgeLocatorV1(locator)).toEqual([]);
    expect(locatedIds).toEqual(
      expect.arrayContaining([
        "inherited-conditioning-check",
        "purpose-as-inquiry",
        "inspiration-without-imitation",
        "goalpost-integrity",
        "recognition-before-transcendence",
        "feedback-loop-hygiene",
        "mindful-consumption",
        "right-effort-loop",
        "falsifiability-and-truth-convergence",
      ]),
    );
  });
});
