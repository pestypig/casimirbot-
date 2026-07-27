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

    expect(markerIds).toHaveLength(41);
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
    expect(paper).toContain("### 7.4 Cross-runtime authority order");
    expect(paper).toContain("### 8.1 Runtime-to-artifact contract");
    for (const runner of [
      "run-casimir-dp-quantum-foam-study.ts",
      "run-casimir-dp-experiment-design.ts",
      "run-casimir-dp-next-computations.ts",
      "run-casimir-dp-data-readiness.ts",
      "run-casimir-dp-proposal-closure.ts",
      "run-casimir-dp-or-phase-stage2.ts",
      "run-casimir-dp-evidence-map-stage3.ts",
      "run-casimir-dp-polarization-congruence-stage4.ts",
      "run-casimir-dp-qed-scale-hierarchy-stage4-1.ts",
      "run-casimir-dp-apparatus-coherence-residual-stage4-2b.ts",
    ]) {
      expect(paper).toContain(runner);
    }
    expect(paper).toContain("9e0f1e8aa01f8ff3e7faf0c070853e0cd4887a191115c51804fa5c71a7c2be5d");
    expect(paper).toContain("aae5cf37e01df022509bc9f997287719eafd5670c6156fdd626d24ce94dbb4c0");
    expect(paper).toContain("casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T123523358Z");
    expect(paper).toContain("signature_not_identifiable");
    expect(paper).toContain("0.9999771044199663");
    expect(paper).toContain("179103.91134865975");
    expect(paper).toContain("50632b32c4133fe3f0f5eee3cbbb157a983d0a9da69de6239d58563ca88f569c");
    expect(paper).toContain("2ebd9971bacc393842dc71bfd80063d7b244231947074bc70b3be25bd7ad5b67");
    expect(paper).toContain("e29564c6cedcace388233f6006b98683fab54f9326b96ab9bbaf3334f33adcbe");
    expect(paper).toContain("727d78249462f0b4171532af37db97be5500a3a7a870cc56b2e533cae0ae0df7");
    expect(paper).toContain(
      "docs/research/casimir-dp-apparatus-coherence-residual-stage4-2b-verification-receipt.json",
    );
    expect(paper).toContain(
      "casimir-dp-apparatus-coherence-residual-stage4-2b-v1-20260726T130100867Z-final",
    );
    expect(paper).toContain("run `2325`");
    expect(paper).toContain(
      "3894af959e1f3de8d28ede457727a97688c2fd64031c3512f941f5b89a889ffd",
    );
    expect(paper).toContain(
      "194a58bcfa4cc855c8a50a8a862fac391a01ee55c4dc9feeb1d6e98526b8bf3d",
    );
    expect(paper).not.toContain("| pending | pending | pending |");
  });

  it("registers the scientific-standing baseline and fails closed on a frequency-to-cavity bridge", () => {
    expect(paper).toContain("### 4.1 Compton-frequency non-bridge");
    expect(paper).toContain("### 4.2 Scientific and runtime claim baseline");
    expect(paper).toContain("cdp-compton-dp-frequency-identities");
    expect(paper).toContain("cdp-frequency-cavity-bridge-gate");
    expect(paper).toContain("\\mathcal K_{cavity\\rightarrow branch/coherence}\\ \\text{not registered}");
    expect(paper).toContain("A boundary-conditioned coherence residual proves objective collapse");
    expect(paper).toContain("### 2.4 Penrose OR motivation, notation, and scope");
    expect(paper).toContain("cdp-or-branch-geometry-context");
    expect(paper).toContain("cdp-ambient-gravity-phase-control");
    expect(paper).toContain("cdp-interferometric-phase-visibility-readout");
    expect(paper).toContain("No numerical plausibility score");
    expect(paper).toContain("### 8.2 Validation standing");
    expect(paper).toContain("Math-stage registry | 213 entries; validation `pass`");
    expect(paper).toContain("10 files, 67 tests `pass`");
    expect(paper).toContain("18 files, 179 tests `pass`");
    expect(paper).toContain(
      "6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45",
    );
    expect(paper).toContain(
      "38b2e69264ac9e846676fced5d7318a0ab6e35affcb572246bcae7bf6606fa34",
    );
    expect(paper).toContain(
      "measured evidence `not_ready`; collapse identification `blocked`; manifold dynamics `blocked`",
    );
  });

  it("prints the current byte hashes for every frozen runtime config", () => {
    const expected = {
      "configs/research/casimir-dp-quantum-foam-study.v1.json":
        "56ab76ca85f4ef4da7ce1ac9da3e87d2eb4e898b02cbc09aca0ad301e0a3f2d2",
      "configs/research/casimir-dp-experiment-design.v1.json":
        "bd5528824d70de65e8b181dc18a78c3a287b2fd9c2cdd66bb5a9a79a3c97fe84",
      "configs/research/casimir-dp-next-computations.v1.json":
        "5b12c758228dc68865f4a91d3ae1aa9ade698932546c686aab5cb9e5773b5e93",
      "configs/research/casimir-dp-data-readiness.v1.json":
        "a95e7a22c20e29ed9c34f45ece90916748a9264a32be8315663819171b406475",
      "configs/research/casimir-dp-proposal-closure.v1.json":
        "7b3b2673c95d4eebca060261385f3b0659365c1112c1d9d42bc1d8700686b8ba",
      "configs/research/casimir-dp-or-phase-stage2.v1.json":
        "b517e8fbf002303258a5269e7f37c6b16d4bc3c45c609072bdb2a9e5184e596d",
      "configs/research/casimir-dp-polarization-congruence-stage4.v1.json":
        "ade06cd7b95e27fe414614ad36512d5764d439c4fa6623f8499ad218ba07c3d7",
      "configs/research/casimir-dp-apparatus-coherence-residual-stage4-2b.v1.json":
        "2abf8808fe73f6099d3e9e93e1bed2c8ca33d1094b6a93e9ad926f5fd900fa3e",
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
    expect(graph.badges).toHaveLength(27);
    expect(graph.edges).toHaveLength(79);
    expect(paper).toContain("27 study badges connected by");
    expect(paper).toContain("79 dependency, requirement, documentation, and blocking edges");
  });
});
