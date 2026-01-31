import { describe, expect, it } from "vitest";
import {
  buildHelixAskTopicProfile,
  inferHelixAskTopicTags,
  pathMatchesAny,
  topicMustIncludeSatisfied,
} from "../server/services/helix-ask/topic";

describe("Helix Ask topic routing", () => {
  it("tags helix ask prompts", () => {
    const tags = inferHelixAskTopicTags("How does the Helix Ask pipeline work in this system?");
    expect(tags).toContain("helix_ask");
  });

  it("tags platonic reasoning as concepts", () => {
    const tags = inferHelixAskTopicTags("What is platonic reasoning?");
    expect(tags).toContain("concepts");
  });

  it("tags wavefunction prompts as concepts", () => {
    const tags = inferHelixAskTopicTags("Explain the uncertainty principle and wavefunction.");
    expect(tags).toContain("concepts");
  });

  it("tags evidence gate prompts as helix ask", () => {
    const tags = inferHelixAskTopicTags(
      "Where is the evidence gate computed and what thresholds are enforced? Cite files.",
    );
    expect(tags).toContain("helix_ask");
  });

  it("builds core allowlist for helix ask", () => {
    const profile = buildHelixAskTopicProfile(["helix_ask"]);
    expect(profile).not.toBeNull();
    expect(profile?.allowlistTiers.length).toBeGreaterThan(0);
    expect(profile?.mustIncludePaths.length).toBeGreaterThan(0);
  });

  it("requires helix ask core evidence when configured", () => {
    const profile = buildHelixAskTopicProfile(["helix_ask"]);
    expect(
      topicMustIncludeSatisfied(["server/services/helix-ask/format.ts"], profile),
    ).toBe(true);
    expect(topicMustIncludeSatisfied(["server/energy-pipeline.ts"], profile)).toBe(false);
  });

  it("anchors ideology prompts to the ideology tree", () => {
    const tags = inferHelixAskTopicTags(
      "Using the system ideology, what does the ethos say about verification vs persuasion?",
    );
    expect(tags).toContain("ideology");
    const profile = buildHelixAskTopicProfile(["ideology"]);
    expect(profile).not.toBeNull();
    expect(
      topicMustIncludeSatisfied(["docs/ethos/ideology.json"], profile),
    ).toBe(true);
    expect(topicMustIncludeSatisfied(["server/routes/agi.plan.ts"], profile)).toBe(false);
  });

  it("anchors sun-ledger prompts to ledger core files", () => {
    const tags = inferHelixAskTopicTags(
      "What does it mean to tend the Sun ledger in this system?",
    );
    expect(tags).toContain("ledger");
    const profile = buildHelixAskTopicProfile(["ledger"]);
    expect(profile).not.toBeNull();
    expect(topicMustIncludeSatisfied(["docs/ethos/ideology.json"], profile)).toBe(true);
    expect(topicMustIncludeSatisfied(["server/energy-pipeline.ts"], profile)).toBe(false);
  });

  it("anchors star prompts to star-hydrostatic sources", () => {
    const tags = inferHelixAskTopicTags(
      "How does the star hydrostatic panel compute the stellar ledger?",
    );
    expect(tags).toContain("star");
    const profile = buildHelixAskTopicProfile(["star"]);
    expect(profile).not.toBeNull();
    expect(
      topicMustIncludeSatisfied(["client/src/pages/star-hydrostatic-panel.tsx"], profile),
    ).toBe(true);
    expect(topicMustIncludeSatisfied(["modules/warp/warp-core.ts"], profile)).toBe(false);
  });

  it("boosts warp docs for warp prompts", () => {
    const profile = buildHelixAskTopicProfile(["warp"]);
    expect(profile).not.toBeNull();
    expect(
      pathMatchesAny("docs/warp-console-architecture.md", profile?.boostPaths),
    ).toBe(true);
  });

  it("tags save-the-sun prompts as star", () => {
    const tags = inferHelixAskTopicTags(
      "Give a staged plan to save the Sun during the red giant phase.",
    );
    expect(tags).toContain("star");
  });
});
