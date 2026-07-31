import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildCasimirDpStudyTheoryBadgesV1 } from "../shared/theory/casimir-dp-study-theory-badges";

const root = process.cwd();
const mainPath = path.resolve(root, "docs/research/casimir-dp-quantum-foam-study.md");
const supplementPath = path.resolve(
  root,
  "docs/research/casimir-dp-quantum-foam-study-reproducibility-supplement.md",
);
const mainSourcePath = path.resolve(
  root,
  "docs/research/casimir-dp-quantum-foam-study.equation-actions.source.json",
);
const mainGeneratedPath = path.resolve(
  root,
  "docs/research/casimir-dp-quantum-foam-study.equation-actions.json",
);
const supplementSourcePath = path.resolve(
  root,
  "docs/research/casimir-dp-quantum-foam-study-reproducibility-supplement.equation-actions.source.json",
);
const supplementGeneratedPath = path.resolve(
  root,
  "docs/research/casimir-dp-quantum-foam-study-reproducibility-supplement.equation-actions.json",
);

const main = readFileSync(mainPath, "utf8");
const supplement = readFileSync(supplementPath, "utf8");

type Sidecar = {
  docPath: string;
  entries: Array<{ equationId: string }>;
};

const loadSidecar = (pathname: string): Sidecar =>
  JSON.parse(readFileSync(pathname, "utf8")) as Sidecar;

function markerIds(markdown: string): string[] {
  return [
    ...markdown.matchAll(/helix-doc-equation-action\/v1 id=([^\s]+)\s*-->/g),
  ].map((match) => match[1]);
}

describe("Casimir-Diósi article and reproducibility supplement", () => {
  it("keeps the canonical article focused on the exact tested model", () => {
    expect(main).toMatch(
      /^# An Identifiability-First Feasibility Protocol for a Gaussian-Regularized Diósi Collapse Test with a Casimir-Boundary Control/,
    );
    expect(main).toContain("## 2. Exact tested dynamics");
    expect(main).toContain("nondissipative, Gaussian-regularized Diósi");
    expect(main).toContain("single effective particle");
    expect(main).toContain("Penrose's objective-reduction argument motivates");
    expect(main).toMatch(/they\s+are not the same theory object/);
    expect(main).toContain("not a representation-independent or generic DP test");
  });

  it("freezes one authoritative apparatus and demotes older geometries", () => {
    expect(main).toContain("## 3. Current Authoritative Apparatus Manifest");
    expect(main).toContain("276.302 nm");
    expect(main).toContain("1.94385×10^-16 kg");
    expect(main).toContain("160 nm");
    expect(main).toContain("250 ms");
    expect(main).toContain("1.2 μm");
    expect(main).toContain("`superseded_design_record`");
    expect(main).toContain(
      "75 nm radius, 20 nm separation, 0.1 s, 5 μm nominal gap, 10–4 μm commissioning ladder",
    );
    expect(main).toMatch(/about\s+\\\(6\.89\\times10\^5\\\) times more massive/);
    expect(main).toContain("State preparation is the first physical go/no-go");
  });

  it("makes the two coherence-loss values impossible to conflate", () => {
    expect(main).toContain("0.598308\\%");
    expect(main).toMatch(
      /This is the only headline coherence-loss forecast for the authoritative\s+apparatus/,
    );
    expect(main).toContain("3.32% loss");
    expect(main).toMatch(
      /It is a\s+different point, not a second estimate of Eq\. \(4\)\./,
    );
  });

  it("preserves hypothesis and observable separation", () => {
    for (const heading of [
      "### 4.1 Ordinary-physics null, H0",
      "### 4.2 Frozen Diósi hypothesis, HD",
      "### 4.3 Lane C: boundary-conditioned extension, HB",
      "### 4.4 Manifold-response hypothesis",
      "### 4.5 Compton-frequency non-bridge",
      "## 9. Observable-separation gate",
      "## 11. Discussion",
      "## 12. Claim boundaries",
    ]) {
      expect(main).toContain(heading);
    }
    expect(main).toContain(
      "No Casimir variable enters the registered collapse generator",
    );
    expect(main).toMatch(
      /A Casimir-correlated residual cannot move from the left branch to\s+the right branch without a registered transfer kernel/,
    );
    expect(main).toMatch(
      /renormalized negative energy density is not automatically negative spacetime\s+curvature/,
    );
  });

  it("reports nominal identifiability honestly and requires a robustness envelope", () => {
    expect(main).toContain("0.999977");
    expect(main).toContain("179,104");
    expect(main).toContain("0.717724");
    expect(main).toContain("6.53169");
    expect(main).toContain("0.997858");
    expect(main).toContain("542");
    expect(main).toMatch(
      /The next computation must report an envelope rather than a single\s+number/,
    );
    for (const requiredStress of [
      "finite-pilot covariance",
      "shrinkage/regularization",
      "drift and non-Gaussian tails",
      "response amplitude/phase error",
      "missing nuisance",
      "branch and hold-time jitter",
      "leave-one-control-out",
      "selection optimism",
    ]) {
      expect(main).toContain(requiredStress);
    }
  });

  it("states the external-bound screen and its convention limitation", () => {
    expect(main).toContain("\\(R_0>4.9\\times10^{-10}\\) m at 90% confidence");
    expect(main).toContain("\\(R_0>4.5\\times10^{-10}\\) m at 95% confidence");
    expect(main).toContain("about 204 times");
    expect(main).toMatch(
      /the\s+mass-density smearing definition, normalization convention, charged-constituent\s+radiation map, and treatment of the effective composite particle/,
    );
  });

  it("downgrades positive interpretation while the companion is infeasible", () => {
    expect(main).toContain("1.92979\\times10^{-40}");
    expect(main).toContain("3.85958\\times10^{-40}");
    expect(main).toContain("Equation (13) is not an instrument model");
    expect(main).toContain(
      "replicated DP-shaped coherence residual may be reported as unexplained",
    );
    expect(main).toContain(
      "model-consistent phenomenology, but not as support-eligible identification",
    );
  });

  it("includes publication elements and six scientific figures", () => {
    for (const figure of [
      "apparatus-schematic.svg",
      "timing-sequence.svg",
      "hypothesis-graph.svg",
      "identifiability-geometry.svg",
      "constraint-screen.svg",
      "coherence-forecast.svg",
    ]) {
      expect(main).toContain(figure);
    }
    for (const element of [
      "## Publication declarations",
      "**Author contributions.**",
      "**Code and data availability.**",
      "**Competing interests.**",
      "**Acknowledgments.**",
      "## References",
      "## 13. Conclusion",
    ]) {
      expect(main).toContain(element);
    }
  });

  it("keeps main and supplement equation sidecars in exact parity", () => {
    for (const [markdown, sourcePath, generatedPath, expectedDocPath] of [
      [
        main,
        mainSourcePath,
        mainGeneratedPath,
        "docs/research/casimir-dp-quantum-foam-study.md",
      ],
      [
        supplement,
        supplementSourcePath,
        supplementGeneratedPath,
        "docs/research/casimir-dp-quantum-foam-study-reproducibility-supplement.md",
      ],
    ] as const) {
      const markers = markerIds(markdown);
      const source = loadSidecar(sourcePath);
      const generated = loadSidecar(generatedPath);
      expect(new Set(markers).size).toBe(markers.length);
      expect(source.docPath).toBe(expectedDocPath);
      expect(generated.docPath).toBe(expectedDocPath);
      expect(source.entries.map((entry) => entry.equationId).sort()).toEqual(
        [...markers].sort(),
      );
      expect(generated.entries.map((entry) => entry.equationId).sort()).toEqual(
        [...markers].sort(),
      );
    }
  });

  it("preserves the long-form audit as a noncanonical supplement", () => {
    expect(supplement).toMatch(
      /^# Reproducibility Supplement: Casimir–Diósi Coherence Feasibility Program/,
    );
    expect(supplement).toContain("## Reproducibility and status ledger");
    expect(supplement).toContain("## 13. Source register");
    expect(supplement).toContain("## 14. Repository evidence map");
    expect(supplement).toContain("## Appendix A. Equation-to-artifact and equation-to-claim map");

    const taxonomy = JSON.parse(
      readFileSync(path.resolve(root, "docs/doc-taxonomy.v1.json"), "utf8"),
    ) as {
      documents: Array<{ path: string; canonical?: boolean; sidecars?: string[] }>;
    };
    expect(
      taxonomy.documents.find((entry) => entry.path.endsWith("quantum-foam-study.md"))
        ?.canonical,
    ).toBe(true);
    expect(
      taxonomy.documents.find((entry) =>
        entry.path.endsWith("quantum-foam-study-reproducibility-supplement.md")
      )?.canonical,
    ).toBe(false);
  });

  it("keeps the canonical article connected to the live Theory Badge graph", () => {
    const graph = buildCasimirDpStudyTheoryBadgesV1();
    expect(graph.badges).toHaveLength(33);
    expect(graph.edges).toHaveLength(98);
    expect(
      graph.badges.some((badge) =>
        badge.sourceRefs.some((source) =>
          source.path === "docs/research/casimir-dp-quantum-foam-study.md"
        )
      ),
    ).toBe(true);
  });
});
