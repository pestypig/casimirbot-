import { describe, expect, it } from "vitest";
import {
  buildRepoSearchPlan,
  PACKAGES_RETRIEVAL_FAIL_REASON,
  resolvePackagesRetrievalMetadata,
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

  it("attaches additive packages retrieval provenance metadata", () => {
    const metadata = resolvePackagesRetrievalMetadata(["packages"]);
    expect(metadata).toEqual({
      provenance_class: "inferred",
      claim_tier: "diagnostic",
      certifying: false,
    });
  });

  it("keeps non-packages retrieval metadata unchanged", () => {
    const metadata = resolvePackagesRetrievalMetadata(["ideology"]);
    expect(metadata).toBeNull();
  });

  it("exposes deterministic strict fail_reason constant for packages provenance", () => {
    const plan = buildRepoSearchPlan({
      question: "How does the packages tree work?",
      topicTags: ["packages"],
      intentDomain: "repo",
      evidenceGateOk: false,
      strictProvenance: true,
    });
    expect(plan?.retrievalMetadata).toEqual({
      provenance_class: "inferred",
      claim_tier: "diagnostic",
      certifying: false,
    });
    expect(plan?.fail_reason).toBeUndefined();
    expect(PACKAGES_RETRIEVAL_FAIL_REASON).toBe("PACKAGES_EVIDENCE_PROVENANCE_MISSING");
  });
});
