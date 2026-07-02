import { describe, expect, it } from "vitest";
import { validateIdeologyContextReflectionV1 } from "../../ideology-context-reflection";
import type { IdeologyGraphDocument } from "../ideology-graph-types";
import { buildIdeologyGraph } from "../load-ideology-graph";
import { reflectIdeologyContext } from "../reflect-ideology-context";

const graphDocument: IdeologyGraphDocument = {
  version: 1,
  rootId: "mission-ethos",
  actionGatePolicy: {
    version: 1,
    covered_action_tags: ["covered-action"],
    legal_key_tags: ["legal-key"],
    ethos_key_tags: ["ethos-key"],
    jurisdiction_floor_ok_tags: ["jurisdiction-floor-ok"],
    hard_fail_ids: {
      missing_legal_key: "IDEOLOGY_MISSING_LEGAL_KEY",
      missing_ethos_key: "IDEOLOGY_MISSING_ETHOS_KEY",
    },
  },
  nodes: [
    {
      id: "mission-ethos",
      title: "Mission Ethos",
      tags: ["root"],
      children: ["right-speech-infrastructure", "restraint", "two-key-approval"],
    },
    {
      id: "right-speech-infrastructure",
      title: "Right Speech Infrastructure",
      aliases: ["truthful interface"],
      tags: ["speech", "posture"],
      children: ["skillful-mediation"],
      links: [{ rel: "see-also", to: "two-key-approval" }],
      references: [{ kind: "doc", title: "Voice event protocol", path: "docs/voice/right-speech.md" }],
      actions: [{ label: "Open speech lens", action: { kind: "openPanel" } }],
    },
    {
      id: "skillful-mediation",
      title: "Skillful Mediation",
      tags: ["trait", "outer_edge", "conflict"],
      references: [{ kind: "scenario", title: "Mediation case", path: "docs/scenarios/mediation.md" }],
    },
    {
      id: "restraint",
      title: "Restraint",
      tags: ["trait"],
      summary: "Delay action when confidence is thin and consequences are high.",
    },
    {
      id: "two-key-approval",
      title: "Two-Key Approval",
      tags: ["covered-action", "legal-key"],
      actions: [{ label: "Run gate check", action: { kind: "openPanel" } }],
    },
  ],
};

const graph = buildIdeologyGraph(graphDocument);

function reflect(text: string, refs: string[] = ["turn:test"]) {
  return reflectIdeologyContext(graph, {
    kind: "user_prompt",
    text,
    refs,
    generatedAt: "2026-06-01T00:00:00.000Z",
    reflectionId: "ideology-reflection:test",
  });
}

describe("deterministic MoralGraph ideology reflection", () => {
  it("produces a complete valid ideology_context_reflection/v1 artifact", () => {
    const reflection = reflect("right-speech-infrastructure should guide this workstation event.");

    expect(validateIdeologyContextReflectionV1(reflection)).toEqual([]);
    expect(reflection.artifactId).toBe("ideology_context_reflection");
    expect(reflection.schemaVersion).toBe("ideology_context_reflection/v1");
    expect(reflection.authority).toMatchObject({
      assistant_answer: false,
      raw_content_included: false,
      terminal_eligible: false,
      context_role: "tool_policy",
      ask_context_policy: "evidence_only",
      agent_executable: false,
    });
  });

  it("matches exact node ids with confidence 1.00", () => {
    const reflection = reflect("Use right-speech-infrastructure.");

    expect(reflection.matches.exact[0]).toMatchObject({
      nodeId: "right-speech-infrastructure",
      score: 1,
    });
  });

  it("matches exact labels and aliases with confidence 0.90", () => {
    const labelReflection = reflect("Use Right Speech Infrastructure here.");
    const aliasReflection = reflect("Use the truthful interface posture.");

    expect(labelReflection.matches.exact.find((match) => match.nodeId === "right-speech-infrastructure")?.score).toBe(
      0.9,
    );
    expect(aliasReflection.matches.exact.find((match) => match.nodeId === "right-speech-infrastructure")?.score).toBe(
      0.9,
    );
  });

  it("matches tags and action labels with confidence 0.75", () => {
    const tagReflection = reflect("This needs a speech lens.");
    const actionReflection = reflect("Open speech lens.");

    expect(tagReflection.matches.exact.find((match) => match.nodeId === "right-speech-infrastructure")?.score).toBe(
      0.75,
    );
    expect(actionReflection.matches.exact.find((match) => match.nodeId === "right-speech-infrastructure")?.score).toBe(
      0.75,
    );
  });

  it("matches references with confidence 0.75 and likely keyword overlap with confidence 0.50", () => {
    const referenceReflection = reflect("Check docs/voice/right-speech.md.");
    const likelyReflection = reflect("Confidence consequences should delay action.");

    expect(referenceReflection.matches.exact.find((match) => match.nodeId === "right-speech-infrastructure")?.score).toBe(
      0.75,
    );
    expect(likelyReflection.matches.likely.find((match) => match.nodeId === "restraint")?.score).toBe(0.5);
  });

  it("activates outer-edge traits and walks path to root", () => {
    const reflection = reflect("Skillful Mediation should frame this conflict.");

    expect(reflection.matches.inferred_lenses.find((match) => match.nodeId === "skillful-mediation")).toBeTruthy();
    expect(reflection.activated_traits[0]).toMatchObject({
      nodeId: "skillful-mediation",
      pathToRoot: ["skillful-mediation", "right-speech-infrastructure", "mission-ethos"],
    });
  });

  it("detects nearby safeguards and action gate warnings", () => {
    const reflection = reflect("Right Speech Infrastructure applies before action.");

    expect(reflection.action_gate_warnings?.[0]).toMatchObject({
      gateId: "two-key-approval",
      label: "Two-Key Approval",
      requiredCheck: "legal_key_and_ethos_key",
    });
    expect(reflection.recommended_actions.map((action) => action.id)).toContain("moral-graph.show_nearby_safeguard");
  });

  it("generates claim boundaries and missing evidence", () => {
    const reflection = reflectIdeologyContext(graph, {
      kind: "note",
      text: "No known lens words here.",
      generatedAt: "2026-06-01T00:00:00.000Z",
      reflectionId: "ideology-reflection:missing",
    });

    expect(reflection.claim_boundaries).toMatchObject({
      diagnostic_only: true,
      avoid_character_judgment: true,
      needs_user_confirmation: true,
    });
    expect(reflection.claim_boundaries.missing_evidence).toEqual(
      expect.arrayContaining(["input_refs", "deterministic_ideology_lens_match"]),
    );
  });
});
