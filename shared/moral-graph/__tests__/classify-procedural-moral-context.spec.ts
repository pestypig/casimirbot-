import { describe, expect, it } from "vitest";
import { validateProceduralMoralClassificationV1 } from "../../procedural-moral-classification";
import type { IdeologyGraphDocument } from "../ideology-graph-types";
import { buildIdeologyGraph } from "../load-ideology-graph";
import { reflectIdeologyContext } from "../reflect-ideology-context";
import { classifyProceduralMoralContext } from "../classify-procedural-moral-context";

const nodeIds = [
  "direct-observation-before-claim",
  "identity-view-and-non-attachment",
  "rumination-to-practice",
  "right-effort-loop",
  "mindful-consumption",
  "middle-way",
  "middle-way-information-diet",
  "spiritual-friendship-mirror",
  "comparison-pressure-and-equanimity",
  "small-experiment-vow",
  "art-as-skillful-means",
  "shadow-without-identification",
  "ignorance-and-consideration",
  "consideration-debt",
  "unseen-harm-inquiry",
  "due-care-before-judgment",
  "guilt-to-repair",
  "moral-residue-after-awareness",
  "feedback-loop-hygiene",
  "inherited-conditioning-check",
  "purpose-as-inquiry",
  "inspiration-without-imitation",
  "goalpost-integrity",
  "recognition-before-transcendence",
  "dependency-transparency-gate",
  "agency-preserving-disclosure",
  "shame-avoidance-loop",
  "fallout-transfer-check",
  "familiarity-anonymity-balance",
  "trust-medium-translation",
  "domain-bounded-accountability",
  "contestable-reentry-threshold",
  "participation-consent-separation",
  "inherited-order-participation",
  "proximity-norm-reciprocity",
  "voice-exit-contestability",
  "adherence-legitimacy-separation",
  "coordination-pluralism",
  "need-before-allocation",
  "efficiency-without-erasure",
  "mandate-bounded-hierarchy",
  "legible-rules-bounded-confidentiality",
  "cooperation-without-assimilation",
  "specialization-without-caste",
] as const;

const graphDocument: IdeologyGraphDocument = {
  version: 1,
  rootId: "wisdom-first-principles",
  nodes: [
    {
      id: "wisdom-first-principles",
      title: "Wisdom First Principles",
      tags: ["root"],
      children: [...nodeIds],
    },
    ...nodeIds.map((id) => ({
      id,
      title: id.split("-").map((part) => part[0]!.toUpperCase() + part.slice(1)).join(" "),
      tags: ["inner_practice", id.replace(/-/g, "_")],
      links: [{ rel: "parent", to: "wisdom-first-principles" }],
    })),
  ],
};

const graph = buildIdeologyGraph(graphDocument);

function classify(text: string) {
  const reflection = reflectIdeologyContext(graph, {
    kind: "user_prompt",
    text,
    refs: ["turn:conversation"],
    generatedAt: "2026-06-09T00:00:00.000Z",
    reflectionId: "ideology-reflection:conversation",
  });
  return classifyProceduralMoralContext({
    graph,
    reflection,
    text,
    generatedAt: "2026-06-09T00:00:00.000Z",
    classificationId: "procedural-moral:conversation",
  });
}

describe("procedural Moral context classifier", () => {
  it("classifies a reflective conversation into procedural next moves", () => {
    const classification = classify(
      [
        "I feel behind and lost my serious taste.",
        "The blues became a feedback loop of non growth and rumination.",
        "No reflection grants understanding without falsifiable experimentation.",
        "Taking in too much information leaves my lens dysregulated.",
        "Our private language made us feel like brothers with a strong essence.",
      ].join(" "),
    );

    expect(validateProceduralMoralClassificationV1(classification)).toEqual([]);
    expect(classification.classifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          observedPattern: "comparison_pressure",
          moralRootId: "comparison-pressure-and-equanimity",
          proceduralMove: "separate_observation_from_story",
        }),
        expect.objectContaining({
          observedPattern: "rumination_loop",
          moralRootId: "rumination-to-practice",
          proceduralMove: "convert_reflection_to_experiment",
        }),
        expect.objectContaining({
          observedPattern: "information_overload",
          moralRootId: "mindful-consumption",
          proceduralMove: "reduce_input_noise",
        }),
        expect.objectContaining({
          observedPattern: "practice_commitment",
          moralRootId: "right-effort-loop",
          proceduralMove: "ask_for_concrete_evidence",
        }),
        expect.objectContaining({
          observedPattern: "identity_view",
          moralRootId: "identity-view-and-non-attachment",
          proceduralMove: "reframe_without_finality",
        }),
        expect.objectContaining({
          observedPattern: "private_language_bond",
          moralRootId: "spiritual-friendship-mirror",
          proceduralMove: "preserve_uncertainty",
        }),
        expect.objectContaining({
          observedPattern: "feedback_loop",
          moralRootId: "feedback-loop-hygiene",
          proceduralMove: "check_for_feedback_loop",
        }),
      ]),
    );
  });

  it("keeps unclear prompts diagnostic and asks for concrete evidence", () => {
    const classification = classify("Please reflect on this.");

    expect(validateProceduralMoralClassificationV1(classification)).toEqual([]);
    expect(classification.classifications).toEqual([
      expect.objectContaining({
        observedPattern: "unclear_evidence",
        moralRootId: "direct-observation-before-claim",
        proceduralMove: "ask_for_concrete_evidence",
      }),
    ]);
    expect(classification.authority).toMatchObject({
      assistant_answer: false,
      terminal_eligible: false,
      agent_executable: false,
      character_verdict: false,
      moral_finality: false,
    });
  });

  it("classifies ignorance, guilt, and missing consideration as inquiry and repair posture", () => {
    const classification = classify(
      [
        "Ignorance is bliss because if something is not seen as wrong there may be no guilt.",
        "But the missing consideration may affect well-being for affected parties.",
        "We need to research what is not being considered and ask what was reasonably knowable.",
        "Once awareness appears, responsibility and repair readiness should update without a character verdict.",
      ].join(" "),
    );

    expect(validateProceduralMoralClassificationV1(classification)).toEqual([]);
    expect(classification.classifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          observedPattern: "ignorance_boundary",
          moralRootId: "ignorance-and-consideration",
          proceduralMove: "ask_what_was_reasonably_knowable",
        }),
        expect.objectContaining({
          observedPattern: "unconsidered_harm",
          moralRootId: "unseen-harm-inquiry",
          proceduralMove: "research_missing_considerations",
        }),
        expect.objectContaining({
          observedPattern: "unconsidered_harm",
          moralRootId: "consideration-debt",
          proceduralMove: "identify_affected_parties",
        }),
        expect.objectContaining({
          observedPattern: "guilt_signal",
          moralRootId: "guilt-to-repair",
          proceduralMove: "separate_guilt_from_repair",
        }),
        expect.objectContaining({
          observedPattern: "repair_readiness",
          moralRootId: "moral-residue-after-awareness",
          proceduralMove: "route_to_repair_or_review",
        }),
      ]),
    );
    expect(classification.recommendedNextMoves).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "procedural-moral-action:research-missing-considerations",
        }),
        expect.objectContaining({
          id: "procedural-moral-action:ask-reasonably-knowable",
        }),
        expect.objectContaining({
          id: "procedural-moral-action:separate-guilt-from-repair",
        }),
      ]),
    );
    expect(JSON.stringify(classification)).not.toMatch(/bad person|morally approved|morally failed/i);
  });

  it("classifies philosophy-derived procedural lenses without moral finality", () => {
    const classification = classify(
      [
        "Use a conditioning check: is this my belief or an inherited norm?",
        "Treat purpose formation as evidence based purpose and investigate the dream.",
        "Avoid idol worship by keeping inspiration not imitation.",
        "Name criteria drift instead of moving the goal post.",
        "For forgotten people and cultural difference, no one gets left behind should become recognition before action.",
      ].join(" "),
    );

    expect(validateProceduralMoralClassificationV1(classification)).toEqual([]);
    expect(classification.classifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moralRootId: "inherited-conditioning-check",
          proceduralMove: "reframe_without_finality",
        }),
        expect.objectContaining({
          moralRootId: "purpose-as-inquiry",
          proceduralMove: "choose_small_practice",
        }),
        expect.objectContaining({
          moralRootId: "inspiration-without-imitation",
          proceduralMove: "reframe_without_finality",
        }),
        expect.objectContaining({
          moralRootId: "goalpost-integrity",
          proceduralMove: "ask_for_concrete_evidence",
        }),
        expect.objectContaining({
          moralRootId: "recognition-before-transcendence",
          proceduralMove: "identify_affected_parties",
        }),
      ]),
    );
    expect(classification.authority).toMatchObject({
      terminal_eligible: false,
      character_verdict: false,
      moral_finality: false,
    });
  });

  it("classifies hidden dependency risk as agency-preserving repair work, not a verdict", () => {
    const classification = classify(
      [
        "There was hidden shared risk in a shared obligation, and late disclosure meant the affected people could not plan.",
        "The person withheld information, which stripped away agency and created planning harm.",
        "A shame-avoidance loop kept delaying conflict until there was compounding damage.",
        "Now there is externalized fallout, shifted burden, and transferred damage from the cost of hiding.",
      ].join(" "),
    );

    expect(validateProceduralMoralClassificationV1(classification)).toEqual([]);
    expect(classification.classifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moralRootId: "dependency-transparency-gate",
          proceduralMove: "identify_affected_parties",
        }),
        expect.objectContaining({
          moralRootId: "agency-preserving-disclosure",
          proceduralMove: "identify_affected_parties",
        }),
        expect.objectContaining({
          moralRootId: "shame-avoidance-loop",
          proceduralMove: "separate_guilt_from_repair",
        }),
        expect.objectContaining({
          moralRootId: "fallout-transfer-check",
          proceduralMove: "identify_affected_parties",
        }),
      ]),
    );
    expect(classification.recommendedNextMoves).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "procedural-moral-action:identify-affected-parties",
        }),
        expect.objectContaining({
          id: "procedural-moral-action:separate-guilt-from-repair",
        }),
      ]),
    );
    expect(classification.authority).toMatchObject({
      terminal_eligible: false,
      character_verdict: false,
      moral_finality: false,
    });
    expect(JSON.stringify(classification)).not.toMatch(/bad person|morally approved|morally failed/i);
  });

  it("classifies civic trust translation as evidence scope and contestable access, not moral worth", () => {
    const classification = classify(
      [
        "Do not infer patience from rural or urban population density; inspect repeated contact and network overlap.",
        "Trace relational trust into an institutional trust channel and formal record.",
        "A credit score must stay domain-bounded accountability evidence, not character or moral worth.",
        "An excluded applicant needs a contestable re-entry threshold with criteria, appeal, repair, and review.",
      ].join(" "),
    );

    expect(validateProceduralMoralClassificationV1(classification)).toEqual([]);
    expect(classification.classifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ moralRootId: "familiarity-anonymity-balance" }),
        expect.objectContaining({ moralRootId: "trust-medium-translation" }),
        expect.objectContaining({ moralRootId: "domain-bounded-accountability" }),
        expect.objectContaining({ moralRootId: "contestable-reentry-threshold" }),
      ]),
    );
    expect(classification.authority).toMatchObject({ character_verdict: false, moral_finality: false });
  });

  it("separates civic participation from consent, legitimacy, and ideology ranking", () => {
    const classification = classify(
      [
        "A tenant pays rent and uses the system without explicit consent because there is no affordable alternative.",
        "The order was inherited, formal exit exists but feasible exit does not, and compliance is not endorsement.",
        "Compare capitalism and socialism through allocation channel, authority channel, and accountability channel.",
      ].join(" "),
    );

    expect(classification.classifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ moralRootId: "participation-consent-separation" }),
        expect.objectContaining({ moralRootId: "inherited-order-participation" }),
        expect.objectContaining({ moralRootId: "voice-exit-contestability" }),
        expect.objectContaining({ moralRootId: "adherence-legitimacy-separation" }),
        expect.objectContaining({ moralRootId: "coordination-pluralism" }),
      ]),
    );
    expect(classification.authority).toMatchObject({ terminal_eligible: false, moral_finality: false });
  });

  it("routes provisioning claims through explicit lenses and blocks biology-to-policy shortcuts", () => {
    const classification = classify(
      [
        "A plant captures energy directly, so should biology dictate a universal tax budget?",
        "Do not use an overall efficiency score or civilization balance score.",
        "A shared research project needs cooperation without assimilation and a reviewable delegated authority scope.",
      ].join(" "),
    );

    expect(classification.classifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ moralRootId: "need-before-allocation" }),
        expect.objectContaining({ moralRootId: "efficiency-without-erasure" }),
        expect.objectContaining({ moralRootId: "mandate-bounded-hierarchy" }),
        expect.objectContaining({ moralRootId: "cooperation-without-assimilation" }),
      ]),
    );
    expect(JSON.stringify(classification)).not.toMatch(/best ideology|best civilization/i);
  });
});
