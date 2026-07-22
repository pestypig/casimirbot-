import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildCasimirDpStudyTheoryBadgesV1 } from "../shared/theory/casimir-dp-study-theory-badges";

const root = process.cwd();
const paperPath = path.resolve(root, "docs/research/casimir-dp-quantum-foam-study.md");
const sourcePath = path.resolve(
  root,
  "docs/research/casimir-dp-quantum-foam-study.equation-actions.source.json",
);
const generatedPath = path.resolve(
  root,
  "docs/research/casimir-dp-quantum-foam-study.equation-actions.json",
);

const paper = readFileSync(paperPath, "utf8");
const source = JSON.parse(readFileSync(sourcePath, "utf8")) as {
  entries: Array<{ equationId: string }>;
};
const generated = JSON.parse(readFileSync(generatedPath, "utf8")) as {
  entries: Array<{ equationId: string }>;
};

describe("Casimir-DP paper provenance parity", () => {
  it("keeps paper markers and both equation-action sidecars in exact parity", () => {
    const markerIds = [...paper.matchAll(/helix-doc-equation-action\/v1 id=([^\s]+)\s*-->/g)]
      .map((match) => match[1]);
    const sourceIds = source.entries.map((entry) => entry.equationId);
    const generatedIds = generated.entries.map((entry) => entry.equationId);

    expect(markerIds).toHaveLength(20);
    expect(new Set(markerIds).size).toBe(markerIds.length);
    expect(new Set(sourceIds).size).toBe(sourceIds.length);
    expect(new Set(generatedIds).size).toBe(generatedIds.length);
    expect([...sourceIds].sort()).toEqual([...markerIds].sort());
    expect([...generatedIds].sort()).toEqual([...markerIds].sort());
  });

  it("maps every equation into the paper's artifact-and-claim appendix", () => {
    const appendix = paper.split("## Appendix A. Equation-to-artifact and equation-to-claim map")[1];
    expect(appendix).toBeDefined();
    for (const entry of generated.entries) {
      expect(appendix).toContain(`\`${entry.equationId}\``);
    }
  });

  it("documents the cross-runtime rail, frozen inputs, receipts, and current ledgers", () => {
    expect(paper).toContain("### 7.1 Cross-runtime authority order");
    expect(paper).toContain("### 8.1 Runtime-to-artifact contract");
    for (const runner of [
      "run-casimir-dp-quantum-foam-study.ts",
      "run-casimir-dp-experiment-design.ts",
      "run-casimir-dp-next-computations.ts",
      "run-casimir-dp-data-readiness.ts",
      "run-casimir-dp-proposal-closure.ts",
    ]) {
      expect(paper).toContain(runner);
    }
    expect(paper).toContain("9e0f1e8aa01f8ff3e7faf0c070853e0cd4887a191115c51804fa5c71a7c2be5d");
    expect(paper).toContain("aae5cf37e01df022509bc9f997287719eafd5670c6156fdd626d24ce94dbb4c0");
    expect(paper).not.toContain("| pending | pending | pending |");
  });

  it("registers the scientific-standing baseline and fails closed on a frequency-to-cavity bridge", () => {
    expect(paper).toContain("### 4.1 Compton-frequency non-bridge");
    expect(paper).toContain("### 4.2 Scientific and runtime claim baseline");
    expect(paper).toContain("cdp-compton-dp-frequency-identities");
    expect(paper).toContain("cdp-frequency-cavity-bridge-gate");
    expect(paper).toContain("\\mathcal K_{cavity\\rightarrow branch/coherence}\\ \\text{not registered}");
    expect(paper).toContain("A boundary-conditioned coherence residual proves objective collapse");
  });

  it("prints the current byte hashes for every frozen runtime config", () => {
    const expected = {
      "configs/research/casimir-dp-quantum-foam-study.v1.json":
        "56ab76ca85f4ef4da7ce1ac9da3e87d2eb4e898b02cbc09aca0ad301e0a3f2d2",
      "configs/research/casimir-dp-experiment-design.v1.json":
        "bd5528824d70de65e8b181dc18a78c3a287b2fd9c2cdd66bb5a9a79a3c97fe84",
      "configs/research/casimir-dp-next-computations.v1.json":
        "9f19359ee6ab02930e1cba25045183ad8931fc3f62e88e1363028f8852fea420",
      "configs/research/casimir-dp-data-readiness.v1.json":
        "a95e7a22c20e29ed9c34f45ece90916748a9264a32be8315663819171b406475",
      "configs/research/casimir-dp-proposal-closure.v1.json":
        "7b3b2673c95d4eebca060261385f3b0659365c1112c1d9d42bc1d8700686b8ba",
    } as const;

    for (const [relativePath, expectedHash] of Object.entries(expected)) {
      const actualHash = createHash("sha256")
        .update(readFileSync(path.resolve(root, relativePath)))
        .digest("hex");
      expect(actualHash).toBe(expectedHash);
      expect(paper).toContain(expectedHash);
    }
  });

  it("keeps the paper canonical, sidecar-bundled, and badge-count synchronized", () => {
    const taxonomy = JSON.parse(
      readFileSync(path.resolve(root, "docs/doc-taxonomy.v1.json"), "utf8"),
    ) as {
      documents: Array<{
        path: string;
        canonical?: boolean;
        sidecars?: string[];
      }>;
    };
    const document = taxonomy.documents.find((entry) =>
      entry.path === "docs/research/casimir-dp-quantum-foam-study.md"
    );
    expect(document?.canonical).toBe(true);
    expect(document?.sidecars).toEqual([
      "docs/research/casimir-dp-quantum-foam-study.equation-actions.json",
      "docs/research/casimir-dp-quantum-foam-study.equation-actions.source.json",
    ]);

    const graph = buildCasimirDpStudyTheoryBadgesV1();
    expect(graph.badges).toHaveLength(11);
    expect(graph.edges).toHaveLength(28);
    expect(paper).toContain("11 study badges connected by");
    expect(paper).toContain("28 dependency, requirement, documentation, and blocking edges");
  });
});
