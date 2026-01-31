import { describe, expect, it } from "vitest";
import {
  buildRepoSearchPlan,
  selectRepoSearchPaths,
} from "../server/services/helix-ask/repo-search";

describe("helix ask repo search", () => {
  it("builds a repo search plan for ideology prompts when evidence is weak", () => {
    process.env.HELIX_ASK_REPO_SEARCH = "1";
    process.env.HELIX_ASK_REPO_SEARCH_ON_EVIDENCE_FAIL = "1";
    const plan = buildRepoSearchPlan({
      question: "What is Mission Ethos?",
      topicTags: ["ideology"],
      intentDomain: "repo",
      evidenceGateOk: false,
    });
    expect(plan).not.toBeNull();
    expect(plan?.terms?.length).toBeGreaterThan(0);
  });

  it("includes ideology paths for ideology tags", () => {
    const paths = selectRepoSearchPaths(["ideology"]);
    expect(paths.some((entry) => entry.replace(/\\/g, "/").includes("docs/ethos"))).toBe(true);
  });
});
