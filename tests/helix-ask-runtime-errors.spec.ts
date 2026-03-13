import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { isFastModeRuntimeMissingSymbolError } from "../server/services/helix-ask/runtime-errors";
import {
  __testHelixAskReliabilityGuards,
  __testOnlyNonReportGuard,
} from "../server/routes/agi.plan";

describe("isFastModeRuntimeMissingSymbolError", () => {
  it("detects missing runHelperWithinStageBudget symbol from Node reference errors", () => {
    const error = new ReferenceError("runHelperWithinStageBudget is not defined");
    expect(isFastModeRuntimeMissingSymbolError(error)).toBe(true);
  });

  it("detects missing getAskElapsedMs symbol from Safari-style messages", () => {
    const message = "ReferenceError: Can't find variable: getAskElapsedMs";
    expect(isFastModeRuntimeMissingSymbolError(message)).toBe(true);
  });

  it("detects quoted/function-form missing symbol messages", () => {
    expect(isFastModeRuntimeMissingSymbolError("ReferenceError: 'getAskElapsedMs' is not defined")).toBe(true);
    expect(isFastModeRuntimeMissingSymbolError("ReferenceError: getAskElapsedMs() is not defined")).toBe(true);
  });

  it("ignores unrelated runtime errors", () => {
    const error = new Error("database connection reset");
    expect(isFastModeRuntimeMissingSymbolError(error)).toBe(false);
  });
});


describe("non-report guard ordering for runtime fallback", () => {
  it("strips report scaffolding for non-report runtime fallback context", () => {
    const context = __testOnlyNonReportGuard.resolveNonReportGuardContext(
      "Where is ask route logic?",
    );
    const guarded = __testOnlyNonReportGuard.enforceNonReportModeGuard(
      "Executive summary:\n- Runtime fallback excerpt surfaced.\n\nCoverage map:\n- Grounded: 0\n\nSources: server/routes/agi.plan.ts",
      context.reportModeEnabled,
      context.intentStrategy,
    );

    expect(context.reportModeEnabled).toBe(false);
    expect(context.intentStrategy).not.toBe("constraint_report");
    expect(guarded.text).not.toMatch(/Executive summary:/i);
    expect(guarded.text).toMatch(/Runtime fallback excerpt surfaced/i);
    expect(guarded.hadScaffold).toBe(true);
  });

  it("preserves report scaffolding for explicit report requests", () => {
    const context = __testOnlyNonReportGuard.resolveNonReportGuardContext(
      "Generate a report for helix ask with executive summary and coverage map.",
    );
    const answer = "Executive summary:\n- item\n\nCoverage map:\n- Grounded: 1";
    const guarded = __testOnlyNonReportGuard.enforceNonReportModeGuard(
      answer,
      context.reportModeEnabled,
      context.intentStrategy,
    );

    expect(context.reportModeEnabled).toBe(true);
    expect(guarded.text).toBe(answer);
    expect(guarded.hadScaffold).toBe(false);
  });
});

describe("helix ask reliability guards", () => {
  it("overrides clarify for grounded repo-required evidence under alignment fail", () => {
    const shouldOverride =
      __testHelixAskReliabilityGuards.shouldOverrideClarifyForGroundedEvidence(
        {
          alignmentGateDecision: "FAIL",
          openWorldBypassMode: "off",
          atlasRequirementFailed: false,
          requiresRepoEvidence: true,
          evidenceGateOk: true,
          mustIncludeOk: true,
          viabilityMustIncludeOk: true,
          topicMustIncludeOk: true,
          retrievalConfidence: 0.9,
          repoThreshold: 0.6,
          hasRepoHints: true,
          hasFilePathHints: true,
          contextFileCount: 2,
        },
      );
    expect(shouldOverride).toBe(true);
  });

  it("does not override clarify when evidence is weak", () => {
    const shouldOverride =
      __testHelixAskReliabilityGuards.shouldOverrideClarifyForGroundedEvidence(
        {
          alignmentGateDecision: "FAIL",
          openWorldBypassMode: "off",
          atlasRequirementFailed: false,
          requiresRepoEvidence: true,
          evidenceGateOk: false,
          mustIncludeOk: true,
          viabilityMustIncludeOk: true,
          topicMustIncludeOk: true,
          retrievalConfidence: 0.4,
          repoThreshold: 0.6,
          hasRepoHints: false,
          hasFilePathHints: false,
          contextFileCount: 0,
        },
      );
    expect(shouldOverride).toBe(false);
  });

  it("does not override clarify for open-world requests", () => {
    const shouldOverride =
      __testHelixAskReliabilityGuards.shouldOverrideClarifyForGroundedEvidence(
        {
          alignmentGateDecision: "FAIL",
          openWorldBypassMode: "off",
          atlasRequirementFailed: false,
          requiresRepoEvidence: false,
          evidenceGateOk: true,
          mustIncludeOk: true,
          viabilityMustIncludeOk: true,
          topicMustIncludeOk: true,
          retrievalConfidence: 0.95,
          repoThreshold: 0.6,
          hasRepoHints: true,
          hasFilePathHints: true,
          contextFileCount: 2,
        },
      );
    expect(shouldOverride).toBe(false);
  });

  it("builds deterministic repo runtime fallback from evidence", () => {
    const fallback =
      __testHelixAskReliabilityGuards.buildDeterministicRepoRuntimeFallback({
        question: "What is a warp bubble Natario solve?",
        format: "brief",
        definitionFocus: true,
        docBlocks: [
          {
            path: "docs/knowledge/warp/warp-bubble.md",
            block:
              "docs/knowledge/warp/warp-bubble.md\nDefinition: In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints.",
          },
        ],
        codeAlignment: null,
        evidenceText:
          "Definition: In this repo, a warp bubble is a modeled spacetime region.\nSources: docs/knowledge/warp/warp-bubble.md",
        anchorFiles: ["docs/knowledge/warp/warp-bubble.md"],
      });
    expect(fallback).toBeTruthy();
    expect(fallback).not.toMatch(/Runtime fallback: Unable to complete a repo-grounded LLM pass/i);
    expect(fallback).toMatch(/docs\/knowledge\/warp\/warp-bubble\.md/i);
  });

  it("filters stage0 score/symbol/file metadata noise from deterministic fallback output", () => {
    const fallback =
      __testHelixAskReliabilityGuards.buildDeterministicRepoRuntimeFallback({
        question: "Define warp solve in full congruence.",
        format: "brief",
        definitionFocus: true,
        docBlocks: [
          {
            path: "docs/warp-geometry-congruence-report.md",
            block:
              "docs/warp-geometry-congruence-report.md\nDefinition: Warp solve in this repo is a constrained metric + guardrail solve pipeline.",
          },
        ],
        codeAlignment: null,
        evidenceText: [
          "Stage-0 candidate: docs/warp-canonical-runtime-overview.md",
          "score=30.000 | symbol=stage0 | file=docs/warp-canonical-runtime-overview.md",
          "Definition: Warp solve in this repo is a constrained metric + guardrail solve pipeline.",
          "Sources: docs/warp-geometry-congruence-report.md",
        ].join("\n"),
        anchorFiles: ["docs/warp-geometry-congruence-report.md"],
      }) ?? "";

    expect(fallback).toBeTruthy();
    expect(fallback).not.toMatch(/score=\d/i);
    expect(fallback).not.toMatch(/\bsymbol=/i);
    expect(fallback).not.toMatch(/\bfile=/i);
  });

  it("builds evidence packet v2 with canonical retrieval and coverage snapshot", () => {
    const packet = __testHelixAskReliabilityGuards.buildHelixAskEvidencePacketV2({
      route: "repo",
      question: "What is a warp bubble Natario solve?",
      intentId: "repo.warp_definition_docs_first",
      intentDomain: "repo",
      contextFiles: ["docs/knowledge/warp/warp-bubble.md"],
      contextText:
        "Definition docs: docs/knowledge/warp/warp-bubble.md\nSources: docs/knowledge/warp/warp-bubble.md",
      docBlocks: [
        {
          path: "docs/knowledge/warp/warp-bubble.md",
          block:
            "docs/knowledge/warp/warp-bubble.md\nDefinition: In this repo, a warp bubble model is represented with Natario-compatible shift and guardrail checks.",
        },
      ],
      retrievalConfidence: 0.91,
      retrievalDocShare: 0.88,
      slotCoverage: { ratio: 0.75, missingSlots: ["warp_equation_anchor"] },
      docCoverage: { ratio: 1, missingSlots: [] },
      channelContributions: { atlas: { hits: 4, used: true } },
      sections: [
        {
          id: "repo",
          label: "Repo evidence",
          content:
            "Definition: docs/knowledge/warp/warp-bubble.md describes the repo-specific warp bubble abstraction.\nSources: docs/knowledge/warp/warp-bubble.md",
        },
        {
          id: "constraint",
          label: "Constraint evidence",
          content: "Constraint path: server/routes/agi.plan.ts",
        },
      ],
      preferredEvidenceText:
        "Definition: docs/knowledge/warp/warp-bubble.md describes the repo-specific warp bubble abstraction.\nSources: docs/knowledge/warp/warp-bubble.md",
    });

    expect(packet.version).toBe("repo_atlas_evidence_packet_v2");
    expect(packet.route).toBe("repo");
    expect(packet.sections.map((section) => section.id)).toEqual(["repo", "constraint"]);
    expect(packet.evidenceText).toContain("warp-bubble.md");
    expect(packet.evidenceCardsText).toMatch(/Repo evidence:/);
    expect(packet.contextFiles).toContain("docs/knowledge/warp/warp-bubble.md");
    expect(packet.sources).toContain("docs/knowledge/warp/warp-bubble.md");
    expect(packet.coverage.slotMissing).toEqual(["warp_equation_anchor"]);
    expect(packet.retrieval.confidence).toBeGreaterThan(0.8);
  });

  it("does not require equation-quote contract for broad congruence definitions", () => {
    const question = "Okay, define what a warp solve is in full congruence.";
    const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
      question,
      answer:
        "A warp solve is the repo's constrained solve flow for metric + guardrail checks. [docs/warp-geometry-congruence-report.md]",
      allowedCitations: ["docs/warp-geometry-congruence-report.md"],
    });

    expect(__testHelixAskReliabilityGuards.isWarpMathBroadPrompt(question)).toBe(true);
    expect(__testHelixAskReliabilityGuards.isEquationQuotePrompt(question)).toBe(false);
    expect(contract.required).toBe(false);
    expect(contract.ok).toBe(true);
    expect(contract.reason).toBe("not_required");
  });

  it("requires equation-quote contract for explicit equation requests", () => {
    const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
      question: "Show one warp congruence equation from docs and explain it.",
      answer: "Warp congruence is discussed in the report. [docs/warp-geometry-congruence-report.md]",
      allowedCitations: ["docs/warp-geometry-congruence-report.md"],
    });

    expect(__testHelixAskReliabilityGuards.isEquationQuotePrompt("show one equation from docs")).toBe(true);
    expect(contract.required).toBe(true);
    expect(contract.ok).toBe(false);
    expect(contract.reason === "equation_missing" || contract.reason === "equation_and_citation_missing").toBe(true);
  });

  it("rescues explicit-path equation requests by scanning the requested file", () => {
    const relPath = ".tmp-stage05-tests/explicit-equation-rescue.md";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "# Congruence note",
        "Intermediate text",
        "ds^2 = -alpha^2 dt^2 + gamma_ij (dx^i - beta^i dt)(dx^j - beta^j dt)",
      ].join("\n"),
      "utf8",
    );
    try {
      const rescue = __testHelixAskReliabilityGuards.buildExplicitPathEquationContractRescue({
        question: "Show one warp congruence equation from docs and explain it.",
        explicitPaths: [relPath],
        allowedCitations: [relPath],
      });
      expect(rescue).toBeTruthy();
      expect(rescue?.path).toBe(relPath);
      expect(rescue?.equation).toMatch(/ds\^2/i);
      const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
        question: "Show one warp congruence equation from docs and explain it.",
        answer: rescue?.answer ?? "",
        allowedCitations: [relPath],
      });
      expect(contract.required).toBe(true);
      expect(contract.ok).toBe(true);
      expect(contract.reason).toBe("ok");
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("rescues non-explicit equation requests by scanning allowed citation files", () => {
    const relPath = ".tmp-stage05-tests/general-equation-rescue.md";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "# Warp congruence context",
        "alpha note",
        "ds^2 = -(alpha^2 - beta_i beta^i) dt^2 + 2 beta_i dx^i dt + gamma_ij dx^i dx^j",
      ].join("\n"),
      "utf8",
    );
    try {
      const rescue = __testHelixAskReliabilityGuards.buildExplicitPathEquationContractRescue({
        question: "Can you show one warp congruence equation and explain it with citation?",
        explicitPaths: [],
        allowedCitations: [relPath],
      });
      expect(rescue).toBeTruthy();
      expect(rescue?.path).toBe(relPath);
      expect(rescue?.equation).toMatch(/ds\^2/i);
      const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
        question: "Can you show one warp congruence equation and explain it with citation?",
        answer: rescue?.answer ?? "",
        allowedCitations: [relPath],
      });
      expect(contract.required).toBe(true);
      expect(contract.ok).toBe(true);
      expect(contract.reason).toBe("ok");
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("scores evidence mass higher when source diversity and coverage are strong", () => {
    const rich = __testHelixAskReliabilityGuards.computeHelixAskEvidenceMassScore({
      sourceCount: 10,
      independentSourceCount: 6,
      slotCoverageRatio: 0.92,
      docCoverageRatio: 0.88,
      retrievalConfidence: 0.9,
      retrievalDocShare: 0.7,
    });
    const thin = __testHelixAskReliabilityGuards.computeHelixAskEvidenceMassScore({
      sourceCount: 1,
      independentSourceCount: 1,
      slotCoverageRatio: 0.2,
      docCoverageRatio: 0.15,
      retrievalConfidence: 0.25,
      retrievalDocShare: 0.1,
    });
    expect(rich.score).toBeGreaterThan(thin.score);
    expect(rich.band).toBe("rich");
    expect(thin.band).toBe("thin");
  });

  it("moves unsupported contract claims into uncertainty when grounding is enforced", () => {
    const grounded = __testHelixAskReliabilityGuards.applyHelixAskClaimGroundingGate({
      contract: {
        summary: "Repo answer summary.",
        claims: [
          {
            text: "Supported claim from route logic.",
            evidence: ["server/routes/agi.plan.ts"],
          },
          {
            text: "Ungrounded claim with no evidence mapping.",
          },
        ],
        sources: ["server/routes/agi.plan.ts"],
      },
      allowedCitations: ["server/routes/agi.plan.ts", "docs/helix-ask-flow.md"],
      evidenceText:
        "Sources: server/routes/agi.plan.ts\nRoute pipeline and citation repair behavior are defined in this file.",
      enforce: true,
    });

    expect(grounded.groundedCount).toBe(1);
    expect(grounded.unsupportedCount).toBe(1);
    expect(grounded.contract.claims?.length).toBe(1);
    expect(grounded.contract.claims?.[0]?.evidence).toContain("server/routes/agi.plan.ts");
    expect(grounded.contract.uncertainty ?? "").toMatch(/Unsupported claims moved to uncertainty/i);
  });
});
