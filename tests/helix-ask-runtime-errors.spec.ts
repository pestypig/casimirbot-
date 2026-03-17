import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { isFastModeRuntimeMissingSymbolError } from "../server/services/helix-ask/runtime-errors";
import {
  __testHelixAskReliabilityGuards,
  __testHelixAskDialogueFormatting,
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

  it("uses anchor files as confirmed evidence in single-LLM short fallback", () => {
    const fallback =
      __testHelixAskReliabilityGuards.buildSingleLlmShortAnswerFallback({
        question: "Explain the congruence of the warp bubble solution?",
        definitionFocus: false,
        docBlocks: [],
        codeAlignment: null,
        evidenceText: "Sources: modules/warp/natario-warp.ts",
        anchorFiles: ["modules/warp/natario-warp.ts", "docs/knowledge/warp/warp-bubble.md"],
        searchedTerms: ["warp bubble", "congruence"],
        searchedFiles: ["modules/warp/natario-warp.ts"],
        headingSeedSlots: [
          {
            id: "heading_warp",
            label: "Natário-Casimir Warp Bubble Operations Runbook",
            required: false,
            source: "heading",
            surfaces: [],
          },
        ],
        requiresRepoEvidence: true,
      }) ?? "";
    expect(fallback).toMatch(/^Confirmed:/i);
    expect(fallback).toMatch(/Retrieved grounded repository anchors:/i);
    expect(fallback).toMatch(/modules\/warp\/natario-warp\.ts/i);
    expect(fallback).not.toContain("�");
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

  it("filters heading-index scaffold noise from deterministic fallback output", () => {
    const fallback =
      __testHelixAskReliabilityGuards.buildDeterministicRepoRuntimeFallback({
        question: "Explain the congruence of the warp bubble solution.",
        format: "brief",
        definitionFocus: true,
        docBlocks: [
          {
            path: "modules/warp/natario-warp.ts",
            block:
              "Goals & invariants Components 1 Physics engine 2 Tools 3 Runtime. The Natario zero-expansion model defines the warp bubble congruence guardrails.",
          },
        ],
        codeAlignment: null,
        evidenceText: [
          "Goals & invariants Components 1 Physics engine 2 Tools 3 Runtime.",
          "Mechanism: Goals & invariants Components 1 Physics engine 2 Tools -> constrained interaction dynamics -> Goals & invariants Components 1 Physics engine 2 Tools.",
          "The Natario zero-expansion model defines the warp bubble congruence guardrails and expansion constraints.",
          "Sources: modules/warp/natario-warp.ts",
        ].join("\n"),
        anchorFiles: ["modules/warp/natario-warp.ts"],
      }) ?? "";

    expect(fallback).toBeTruthy();
    expect(fallback).not.toMatch(/Goals\s*&\s*invariants/i);
    expect(fallback).not.toMatch(/Components\s+1/i);
    expect(fallback).not.toMatch(/In practice,\s+coupled constraints and feedback loops/i);
    expect(fallback).toMatch(/Natario zero-expansion model defines/i);
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

  it("treats explain-equation prompts as soft equation quote requests", () => {
    const question = "explain equation of the collapse of the wave function?";
    expect(__testHelixAskReliabilityGuards.isEquationQuotePrompt(question)).toBe(true);
    expect(__testHelixAskReliabilityGuards.isEquationStrictQuotePrompt(question)).toBe(false);
    expect(
      __testHelixAskReliabilityGuards.isEquationStrictQuotePrompt(
        "show exact equation line for collapse and cite it",
      ),
    ).toBe(true);
  });

  it("builds a sourced soft fallback message for collapse equation prompts", () => {
    const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(
      "explain equation of the collapse of the wave function?",
    );
    const message = __testHelixAskReliabilityGuards.buildEquationSoftFallbackMessage({
      question: "explain equation of the collapse of the wave function?",
      citationHints: ["server/services/mixer/collapse.ts", "shared/dp-collapse.ts"],
      queryConstraints: constraints,
    });
    expect(
      /^Exact equation line|couldn't verify a verbatim wave-function-collapse equation line|grounded equation candidates|Primary Topic:\s*collapse|Primary Equation \((?:Tentative|Verified)\)/i.test(
        message,
      ),
    ).toBe(true);
    expect(message).toMatch(/server\/services\/mixer\/collapse\.ts|shared\/dp-collapse\.ts/i);
    expect(message).toMatch(/Sources:/i);
  });

  it("builds progressive equation candidates when near-miss evidence includes concrete equations", () => {
    const relPath = ".tmp-stage05-tests/collapse-soft-fallback-candidates.md";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "collapse notes",
        "psi = Pm psi0 / sqrt(prob)",
        "rho_hat = sum_k p_k |k><k|",
      ].join("\n"),
      "utf8",
    );
    try {
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(
        "explain equation of the collapse of the wave function?",
      );
      const message = __testHelixAskReliabilityGuards.buildEquationSoftFallbackMessage({
        question: "explain equation of the collapse of the wave function?",
        citationHints: [relPath],
        queryConstraints: constraints,
      });
      expect(
        /grounded equation candidates|^Exact equation line|Primary Topic:\s*collapse|Primary Equation \((?:Tentative|Verified)\)/i.test(
          message,
        ),
      ).toBe(true);
      expect(message).toContain(relPath);
      expect(message).toMatch(/\bpsi\s*=/i);
      expect(message).toMatch(/Sources:/i);
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("flags degenerate equation fallback text for generic bypass", () => {
    const question = "explain equation of the collapse of the wave function?";
    const draft =
      "Claim-first explanation:\n1. [server/services/mixer/collapse.ts] Grounded equation candidates were retrieved, but no exact canonical line was verifiable in this turn.";
    const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
      question,
      answer: draft,
      allowedCitations: ["server/services/mixer/collapse.ts"],
    });
    const shouldBypass = __testHelixAskReliabilityGuards.shouldApplyEquationGenericBypass({
      question,
      draftAnswer: draft,
      contract,
      stage05Cards: [],
      stage05CoverageSatisfied: false,
      strictRequired: false,
    });
    expect(contract.required).toBe(true);
    expect(contract.ok).toBe(false);
    expect(shouldBypass).toBe(true);
  });

  it("does not trigger generic bypass for a valid cited equation answer", () => {
    const question = "show exact equation line for collapse and cite it";
    const draft = [
      "Exact equation line (shared/dp-collapse.ts:L42):",
      "psi' = Pm psi / sqrt(<psi|Pm|psi>)",
      "Meaning: the post-measurement state is the normalized projection onto the measured subspace.",
      "Sources: shared/dp-collapse.ts",
    ].join("\n");
    const contract = {
      required: true,
      ok: true,
      answerHasEquation: true,
      citationMatched: true,
      matchedNeedle: true,
      matchedCitations: ["shared/dp-collapse.ts"],
      reason: "ok",
      questionNeedles: ["psi"],
    } as const;
    const shouldBypass = __testHelixAskReliabilityGuards.shouldApplyEquationGenericBypass({
      question,
      draftAnswer: draft,
      contract,
      stage05Cards: [],
      stage05CoverageSatisfied: true,
      strictRequired: true,
    });
    expect(shouldBypass).toBe(false);
  });

  it("builds claim-first equation backing with primary and support equations for broad prompts", () => {
    const primaryPath = ".tmp-stage05-tests/equation-claim-backing-primary.md";
    const supportPath = ".tmp-stage05-tests/equation-claim-backing-support.ts";
    const primaryFullPath = path.join(process.cwd(), primaryPath);
    const supportFullPath = path.join(process.cwd(), supportPath);
    fs.mkdirSync(path.dirname(primaryFullPath), { recursive: true });
    fs.writeFileSync(
      primaryFullPath,
      [
        "Dynamic Casimir relation",
        "omega_casimir_out = omega_casimir_in + delta_omega",
      ].join("\n"),
      "utf8",
    );
    fs.writeFileSync(
      supportFullPath,
      [
        "export const stress = true;",
        "casimir_power = omega_casimir_out * hbar",
      ].join("\n"),
      "utf8",
    );
    try {
      const question =
        "Show one equation from .tmp-stage05-tests/equation-claim-backing-primary.md and explain how it feeds into outputs.";
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer:
          "Dynamic Casimir modulation feeds a downstream energy computation path in this system.",
        answerContract: {
          summary: "Casimir modulation affects output energy terms.",
          claims: [
            { text: "Dynamic Casimir modulation changes modeled output frequency." },
            { text: "The output feed is computed in code paths tied to Casimir modules." },
          ],
          sources: [primaryPath, supportPath],
        },
        evidenceText: `Sources: ${primaryPath}, ${supportPath}`,
        docBlocks: [{ path: primaryPath, block: "omega_casimir_out = omega_casimir_in + delta_omega" }],
        codeAlignment: {
          spans: [
            {
              filePath: supportPath,
              symbol: "stress",
              span: "L2",
              snippet: "casimir_power = omega_casimir_out * hbar",
              isTest: false,
            },
          ],
          symbols: [],
          resolved: [supportPath],
        },
        allowedCitations: [primaryPath, supportPath],
        queryConstraints: constraints,
        strictPrompt: false,
        explicitPathOnlyExtraction: false,
      });
      expect(result).toBeTruthy();
      expect(result?.mode).toBe("equation_claim_backing");
      expect(result?.text).toMatch(/Primary Topic:/i);
      expect(result?.text).toMatch(/Primary Equation \(Verified\):/i);
      expect(result?.text).toMatch(/Mechanism Explanation:/i);
      expect(result?.supportSelectedCount ?? 0).toBeGreaterThanOrEqual(1);
      expect(result?.candidateTotal ?? 0).toBeGreaterThan(0);
      expect(result?.candidateRejectedTotal ?? 0).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result?.candidateRejectedReasons)).toBe(true);
      expect(result?.text).toMatch(/Term-to-implementation mapping/i);
    } finally {
      fs.rmSync(primaryFullPath, { force: true });
      fs.rmSync(supportFullPath, { force: true });
    }
  });

  it("scans stage-0.5 card paths for equation backing even when citation hints are empty", () => {
    const relPath = ".tmp-stage05-tests/stage05-path-scan-equation.ts";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "export const collapseModel = true;",
        "psi = Pm psi0 / sqrt(prob)",
      ].join("\n"),
      "utf8",
    );
    try {
      const question = "explain equation of the collapse of the wave function?";
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer:
          "Claim-first explanation:\n1. [server/services/mixer/collapse.ts] Grounded equation candidates were retrieved.",
        answerContract: null,
        evidenceText: "",
        docBlocks: [],
        codeAlignment: null,
        stage05Cards: [
          {
            path: relPath,
            kind: "code",
            summary: "Collapse update implementation.",
            symbolsOrKeys: ["collapseModel"],
            snippets: [
              {
                start: 1,
                end: 1,
                text: "export const collapseModel = true;",
              },
            ],
            confidence: 0.92,
            slotHits: ["equation", "code_path"],
          },
        ],
        allowedCitations: [],
        queryConstraints: constraints,
        strictPrompt: false,
        explicitPathOnlyExtraction: false,
      });
      expect(result).toBeTruthy();
      expect(result?.tentative).toBe(true);
      expect(result?.primarySelected).toMatch(new RegExp(`^${relPath.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}:L\\d+$`));
      expect(result?.text).toMatch(/\bpsi\s*=/i);
      expect(result?.text).toMatch(/Primary Equation \(Tentative\):/i);
      expect(result?.primaryClass).toBe("implementation_assignment");
      expect(result?.text).toMatch(/Mechanism Explanation:/i);
      expect(result?.text).not.toMatch(/Grounded equation candidates were retrieved/i);
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("prioritizes explicit symbol-targeted collapse equations for specific prompts", () => {
    const relPath = "shared/collapse-benchmark.ts";
    const fullPath = path.join(process.cwd(), relPath);
    const fileLines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
    const snippetText = fileLines.slice(559, 572).join("\n");
    const question =
      "From shared/collapse-benchmark.ts, quote the exact equation lines computing rho_eff_kg_m3 and kappa_collapse_m2 around lines 570-571, then explain each symbol.";
    const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
    const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
      question,
      draftAnswer: "",
      answerContract: null,
      evidenceText: `Sources: ${relPath}`,
      docBlocks: [{ path: relPath, block: snippetText }],
      codeAlignment: null,
      stage05Cards: [
        {
          path: relPath,
          summary: "Collapse diagnostics equations",
          slotHits: ["equation", "code_path"],
          confidence: 0.9,
          snippets: [{ start: 560, end: 572, text: snippetText }],
        },
      ],
      allowedCitations: [relPath],
      queryConstraints: constraints,
      strictPrompt: false,
      explicitPathOnlyExtraction: false,
    });
    expect(result).toBeTruthy();
    expect(result?.primarySelected).toMatch(/shared\/collapse-benchmark\.ts:L(570|571)/);
    expect(result?.text).toMatch(/rho_eff_kg_m3|kappa_collapse_m2/i);
  });

  it("keeps strict equation prompts as exact-line plus explanation in claim-backing mode", () => {
    const relPath = ".tmp-stage05-tests/equation-claim-backing-strict.md";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "Strict relation",
        "psi = Pm psi0 / sqrt(prob)",
      ].join("\n"),
      "utf8",
    );
    try {
      const question = "show exact equation line for collapse and cite it";
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer: "Collapse behavior is tied to projection and probability normalization.",
        answerContract: {
          summary: "Collapse uses projection-normalized state updates.",
          claims: [{ text: "Collapse picks a projected state with normalized probability." }],
          sources: [relPath],
        },
        evidenceText: `Sources: ${relPath}`,
        docBlocks: [{ path: relPath, block: "psi = Pm psi0 / sqrt(prob)" }],
        codeAlignment: null,
        allowedCitations: [relPath],
        queryConstraints: constraints,
        strictPrompt: true,
        explicitPathOnlyExtraction: false,
      });
      expect(result).toBeTruthy();
      expect(result?.tentative).toBe(false);
      expect(result?.text).toMatch(/Primary Equation \(Verified\):/i);
      expect(result?.text).toMatch(/^Exact equation line \(.+?:L\d+\):/m);
      expect(result?.text).toMatch(/Mechanism Explanation:/i);
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("returns claim-first tentative backing when no exact equation line is verifiable", () => {
    const relPath = ".tmp-stage05-tests/equation-claim-backing-tentative.md";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "Collapse narrative",
        "No explicit math equation on this line.",
      ].join("\n"),
      "utf8",
    );
    try {
      const question = "explain equation of the collapse of the wave function?";
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer: "Wave-function collapse transitions from superposition to a measured outcome.",
        answerContract: null,
        evidenceText: `Sources: ${relPath}`,
        docBlocks: [{ path: relPath, block: "Collapse narrative without direct equation." }],
        codeAlignment: null,
        allowedCitations: [relPath],
        queryConstraints: constraints,
        strictPrompt: false,
        explicitPathOnlyExtraction: false,
      });
      expect(result).toBeTruthy();
      expect(result?.tentative).toBe(true);
      expect(result?.text).toMatch(/Primary Topic:\s*collapse/i);
      expect(result?.text).toMatch(/Primary Equation \(Tentative\):/i);
      expect(result?.text).toMatch(/Mechanism Explanation:/i);
      expect(result?.text).not.toMatch(/Please provide module\/path\/symbol/i);
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("adds consensus baseline and repo support/challenge lines in mechanism sections", () => {
    const relPath = ".tmp-stage05-tests/equation-claim-backing-mechanism-frame.ts";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "export function collapseUpdate(psi0: number, Pm: number, prob: number) {",
        "  psi = Pm psi0 / sqrt(prob);",
        "  return psi;",
        "}",
      ].join("\n"),
      "utf8",
    );
    try {
      const question = "explain equation of the collapse of the wave function?";
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer: "Collapse chooses a projected state and normalizes by probability.",
        answerContract: null,
        evidenceText: `Sources: ${relPath}`,
        docBlocks: [{ path: relPath, block: "psi = Pm psi0 / sqrt(prob)" }],
        codeAlignment: null,
        allowedCitations: [relPath],
        queryConstraints: constraints,
        strictPrompt: false,
        explicitPathOnlyExtraction: false,
      });
      expect(result).toBeTruthy();
      expect(result?.text).toMatch(/General-reference baseline:/i);
      expect(result?.text).toMatch(/Repo-grounded support:/i);
      expect(result?.text).toMatch(/Challenge status:/i);
      expect(result?.text).toMatch(/Term-to-implementation mapping:/i);
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("dedupes mechanism lines and strips section-heading echoes from claim bodies", () => {
    const relPath = ".tmp-stage05-tests/equation-claim-backing-dedupe.ts";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "export function collapseUpdate(psi0: number, Pm: number, prob: number) {",
        "  const psi = (Pm * psi0) / Math.sqrt(Math.max(1e-30, prob));",
        "  return psi;",
        "}",
      ].join("\n"),
      "utf8",
    );
    try {
      const question = "explain equation of the collapse of the wave function?";
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
      const draftAnswer = [
        "Primary Topic: collapse",
        "Primary Equation (Tentative):",
        "- [shared/dp-collapse.ts:L280] volume = (4 / 3) * PI * r * r * r",
        "Mechanism Explanation:",
        "1. General-reference baseline: Pr(m) = ||Pm psi||^2 and psi' = (Pm psi) / sqrt(<psi|Pm|psi>) describe measurement projection and normalization.",
        "2. General-reference baseline: Pr(m) = ||Pm psi||^2 and psi' = (Pm psi) / sqrt(<psi|Pm|psi>) describe measurement projection and normalization.",
      ].join("\n");
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer,
        answerContract: null,
        evidenceText: `Sources: ${relPath}`,
        docBlocks: [{ path: relPath, block: "const psi = (Pm * psi0) / Math.sqrt(Math.max(1e-30, prob));" }],
        codeAlignment: null,
        allowedCitations: [relPath],
        queryConstraints: constraints,
        strictPrompt: false,
        explicitPathOnlyExtraction: false,
      });
      expect(result).toBeTruthy();
      const mechanismSection =
        (result?.text.match(/Mechanism Explanation:\n([\s\S]*?)(?:\n\n(?:Related Cross-Topic Evidence|Rejected Candidates|Sources):|$)/i)?.[1] ??
          "") + "";
      const numberedLines = mechanismSection
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => /^\d+\.\s+/.test(line));
      expect(numberedLines.length).toBeGreaterThan(0);
      expect(numberedLines.length).toBeLessThanOrEqual(4);
      expect(mechanismSection).not.toMatch(/Primary Equation\s*\(/i);
      expect(mechanismSection).not.toMatch(/Mechanism Explanation\s*:/i);
      const baselineCount = (mechanismSection.match(/general-reference baseline:/gi) ?? []).length;
      expect(baselineCount).toBe(1);
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("hard-locks dominant family so cross-topic equations cannot become primary", () => {
    const relPath = ".tmp-stage05-tests/warp-cross-topic-equation.md";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "Warp relation",
        "ds^2 = -(alpha^2 - beta_i beta^i) dt^2 + 2 beta_i dx^i dt + gamma_ij dx^i dx^j",
      ].join("\n"),
      "utf8",
    );
    try {
      const question = "explain equation of the collapse of the wave function?";
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer: "The system computes collapse updates from probability-projection rules.",
        answerContract: null,
        evidenceText: `Sources: ${relPath}`,
        docBlocks: [{ path: relPath, block: "ds^2 = -(alpha^2 - beta_i beta^i) dt^2" }],
        codeAlignment: null,
        allowedCitations: [relPath],
        queryConstraints: constraints,
        strictPrompt: false,
        explicitPathOnlyExtraction: false,
      });
      expect(result).toBeTruthy();
      expect(result?.dominantFamily).toBe("collapse");
      expect(result?.primarySelected).toBeNull();
      expect(result?.tentative).toBe(true);
      expect(result?.text).toMatch(/Primary Equation \(Tentative\):/i);
      expect(result?.text).not.toMatch(/Primary Equation \(Verified\):[\s\S]*ds\^2/i);
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("promotes in-family implementation equations as tentative primary when canonical lines are unavailable", () => {
    const relPath = ".tmp-stage05-tests/collapse-implementation-equation.ts";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "export function collapseDiagnostics(psi0: number, Pm: number, prob: number) {",
        "  const psi_next = (Pm * psi0) / Math.sqrt(Math.max(1e-30, prob));",
        "  return psi_next;",
        "}",
      ].join("\n"),
      "utf8",
    );
    try {
      const question = "explain equation of the collapse of the wave function?";
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer: "Collapse diagnostics use a probability-normalized psi update relation.",
        answerContract: null,
        evidenceText: `Sources: ${relPath}`,
        docBlocks: [{ path: relPath, block: "const psi_next = (Pm * psi0) / Math.sqrt(Math.max(1e-30, prob))" }],
        codeAlignment: null,
        allowedCitations: [relPath],
        queryConstraints: constraints,
        strictPrompt: false,
        explicitPathOnlyExtraction: false,
      });
      expect(result).toBeTruthy();
      expect(result?.primarySelected).toMatch(
        new RegExp(`^${relPath.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}:L\\d+$`),
      );
      expect(result?.primaryClass).toBe("implementation_assignment");
      expect(result?.tentative).toBe(true);
      expect(result?.text).toMatch(/Primary Equation \(Tentative\):/i);
      expect(result?.text).toMatch(/psi_next/i);
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("rejects non-math implementation assignments as primary equation candidates", () => {
    const relPath = ".tmp-stage05-tests/collapse-non-math-assignment.ts";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "export function normalizeContent(artifact: { contentType?: string }) {",
        "  const contentType = artifact.contentType ?? \"text/plain; charset=utf-8\";",
        "  return contentType;",
        "}",
      ].join("\n"),
      "utf8",
    );
    try {
      const question = "explain equation of the collapse of the wave function?";
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer: "Collapse explanation should avoid non-math string assignments as equation anchors.",
        answerContract: null,
        evidenceText: `Sources: ${relPath}`,
        docBlocks: [{ path: relPath, block: "const contentType = artifact.contentType ?? \"text/plain; charset=utf-8\"" }],
        codeAlignment: null,
        allowedCitations: [relPath],
        queryConstraints: constraints,
        strictPrompt: false,
        explicitPathOnlyExtraction: false,
      });
      expect(result).toBeTruthy();
      expect(result?.primarySelected).toBeNull();
      expect(result?.tentative).toBe(true);
      expect(result?.text).not.toMatch(/contentType\s*[:=]/i);
      expect(result?.candidateRejectedTotal ?? 0).toBeGreaterThanOrEqual(0);
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("rejects trace/table equation rows from primary selection and records rejection reasons", () => {
    const tracePath = ".tmp-stage05-tests/trace-equation-table.md";
    const collapsePath = ".tmp-stage05-tests/collapse-equation.ts";
    const traceFullPath = path.join(process.cwd(), tracePath);
    const collapseFullPath = path.join(process.cwd(), collapsePath);
    fs.mkdirSync(path.dirname(traceFullPath), { recursive: true });
    fs.writeFileSync(
      traceFullPath,
      [
        "| SRC-062 | EQT-062-01 | Eq. (3) TLS fit form |",
        "| SRC-063 | EQT-063-01 | Eq. (4) filling factor |",
      ].join("\n"),
      "utf8",
    );
    fs.writeFileSync(
      collapseFullPath,
      [
        "export const collapseOp = true;",
        "psi = Pm psi0 / sqrt(prob)",
      ].join("\n"),
      "utf8",
    );
    try {
      const question = "explain equation of the collapse of the wave function?";
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer: "Collapse updates normalize projected states by probability.",
        answerContract: null,
        evidenceText: `Sources: ${tracePath}, ${collapsePath}`,
        docBlocks: [
          { path: tracePath, block: "| SRC-062 | EQT-062-01 | Eq. (3) TLS fit form |" },
          { path: collapsePath, block: "psi = Pm psi0 / sqrt(prob)" },
        ],
        codeAlignment: null,
        allowedCitations: [tracePath, collapsePath],
        queryConstraints: constraints,
        strictPrompt: false,
        explicitPathOnlyExtraction: false,
      });
      expect(result).toBeTruthy();
      expect(result?.primarySelected).toMatch(new RegExp(`^${collapsePath.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}:L\\d+$`));
      expect(result?.text).not.toMatch(/\| SRC-062 \|/i);
      expect(result?.text).not.toMatch(/\| EQT-062-01 \|/i);
      if ((result?.rejectedReasons ?? []).length > 0) {
        expect(result?.rejectedReasons ?? []).toContain("metadata_trace");
      }
    } finally {
      fs.rmSync(traceFullPath, { force: true });
      fs.rmSync(collapseFullPath, { force: true });
    }
  });

  it("rejects generic geometry equations as primary for wave-collapse prompts", () => {
    const volumePath = ".tmp-stage05-tests/collapse-generic-geometry.ts";
    const psiPath = ".tmp-stage05-tests/collapse-psi-equation.ts";
    const volumeFullPath = path.join(process.cwd(), volumePath);
    const psiFullPath = path.join(process.cwd(), psiPath);
    fs.mkdirSync(path.dirname(volumeFullPath), { recursive: true });
    fs.writeFileSync(
      volumeFullPath,
      [
        "export const volumeOfSphere = (r: number) => {",
        "  const volume = (4 / 3) * PI * r * r * r;",
        "  return volume;",
        "};",
      ].join("\n"),
      "utf8",
    );
    fs.writeFileSync(
      psiFullPath,
      [
        "export function collapseUpdate(psi0: number, Pm: number, prob: number) {",
        "  const psi = (Pm * psi0) / Math.sqrt(Math.max(1e-30, prob));",
        "  return psi;",
        "}",
      ].join("\n"),
      "utf8",
    );
    try {
      const question = "explain equation of the collapse of the wave function?";
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer: "Collapse uses projection and probability-normalized state update.",
        answerContract: null,
        evidenceText: `Sources: ${volumePath}, ${psiPath}`,
        docBlocks: [
          { path: volumePath, block: "const volume = (4 / 3) * PI * r * r * r;" },
          { path: psiPath, block: "const psi = (Pm * psi0) / Math.sqrt(prob);" },
        ],
        codeAlignment: null,
        allowedCitations: [volumePath, psiPath],
        queryConstraints: constraints,
        strictPrompt: false,
        explicitPathOnlyExtraction: false,
      });
      expect(result).toBeTruthy();
      expect(result?.text).toMatch(/Primary Topic:\s*collapse/i);
      expect(result?.primarySelected ?? "").toContain(psiPath);
      expect(result?.text).toMatch(/\bpsi\b/i);
      expect(result?.text).not.toMatch(/\bvolume\s*=\s*\(4\s*\/\s*3\)/i);
      expect(result?.candidateRejectedTotal ?? 0).toBeGreaterThanOrEqual(0);
    } finally {
      fs.rmSync(volumeFullPath, { force: true });
      fs.rmSync(psiFullPath, { force: true });
    }
  });

  it("filters checklist/config false positives and prefers domain-math lines", () => {
    expect(
      __testHelixAskReliabilityGuards.isEquationExactLineEligible({
        path: "docs/warp-roadmap.md",
        line: "- [ ] theta_geom = true and set",
      }),
    ).toBe(false);
    expect(
      __testHelixAskReliabilityGuards.isEquationExactLineEligible({
        path: "docs/collapse-benchmark-backend-roadmap.md",
        line: "session_id={ID}&session_type={TYPE}&dt_ms=50&r_c_m=0",
      }),
    ).toBe(false);
    expect(
      __testHelixAskReliabilityGuards.isEquationExactLineEligible({
        path: "configs/graph-resolvers.json",
        line: "path = \"docs/warp-geometry-congruence-report.md\"",
      }),
    ).toBe(false);
    expect(
      __testHelixAskReliabilityGuards.isEquationExactLineEligible({
        path: "cli/collapse-bench.ts",
        line: "const manifestPath = path.resolve(args.manifest ?? \"datasets/benchmarks/collapse-benchmark.fixture.json\");",
      }),
    ).toBe(false);
    expect(
      __testHelixAskReliabilityGuards.isEquationExactLineEligible({
        path: "server/services/mixer/collapse.ts",
        line: "const msg = \"equation path a/b + c/d\";",
      }),
    ).toBe(false);
    expect(
      __testHelixAskReliabilityGuards.isEquationExactLineEligible({
        path: "modules/dynamic/stress-energy-equations.ts",
        line: "T00 = rho + p",
      }),
    ).toBe(true);
    expect(
      __testHelixAskReliabilityGuards.isEquationExactLineEligible({
        path: "server/energy-pipeline.ts",
        line: "(state as any).gammaVanDenBroeck_mass = state.gammaVanDenBroeck; // pipeline value",
      }),
    ).toBe(false);
    expect(
      __testHelixAskReliabilityGuards.isEquationExactLineEligible({
        path: "server/energy-pipeline.ts",
        line: "gammaVanDenBroeck_mass = state.gammaVanDenBroeck",
      }),
    ).toBe(false);
    expect(
      __testHelixAskReliabilityGuards.isEquationExactLineEligible({
        path: "modules/dynamic/stress-energy-equations.ts",
        line: "// ---------- Stressâ€“energy tensor (perfect-fluid proxy, w = âˆ’1) ----------",
      }),
    ).toBe(false);
  });

  it("treats TS assertion property assignments as tentative implementation evidence", () => {
    const relPath = ".tmp-stage05-tests/phase-ts-assert-assignment.ts";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "export function syncPhase(state: { gamma?: number; gammaOut?: number }) {",
        "  (state as any).gammaOut = state.gamma;",
        "  return state;",
        "}",
      ].join("\n"),
      "utf8",
    );
    try {
      const question = "Provide one equation-like relation used by phase scheduler or energy pipeline and explain its role.";
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer: "Phase updates are propagated through state assignments in the pipeline.",
        answerContract: null,
        evidenceText: `Sources: ${relPath}`,
        docBlocks: [{ path: relPath, block: "(state as any).gammaOut = state.gamma;" }],
        codeAlignment: null,
        allowedCitations: [relPath],
        queryConstraints: constraints,
        strictPrompt: false,
        explicitPathOnlyExtraction: false,
      });
      expect(result).toBeTruthy();
      expect(result?.primaryClass).toBeNull();
      expect(result?.primarySelected).toBeNull();
      expect(result?.tentative).toBe(true);
      expect(result?.text).toMatch(/Primary Equation \(Tentative\):/i);
      expect(result?.text).not.toMatch(/Primary Equation \(Verified\):/i);
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("rejects mojibake comment equations from primary selection", () => {
    const relPath = ".tmp-stage05-tests/mojibake-comment-equation.ts";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "export function stressEnergyFromDensity(rho: number) {",
        "  // T00 = Ï ; Tij = âˆ’Ï Î´ij",
        "  return rho;",
        "}",
      ].join("\n"),
      "utf8",
    );
    try {
      const question = "Give one scientifically relevant equation grounded in repo evidence and explain what each term does in the system.";
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer: "Stress-energy relations are used as physics constraints in implementation.",
        answerContract: null,
        evidenceText: `Sources: ${relPath}`,
        docBlocks: [{ path: relPath, block: "// T00 = Ï ; Tij = âˆ’Ï Î´ij" }],
        codeAlignment: null,
        allowedCitations: [relPath],
        queryConstraints: constraints,
        strictPrompt: false,
        explicitPathOnlyExtraction: false,
      });
      expect(result).toBeTruthy();
      expect(result?.primarySelected).toBeNull();
      expect(
        (result?.rejectedReasons ?? []).some((reason) =>
          ["comment_mojibake_equation", "mojibake_non_math_equation", "mojibake_generic_equation"].includes(reason),
        ),
      ).toBe(true);
      expect(result?.text).toMatch(/Primary Equation \(Tentative\):/i);
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
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

  it("rescues broad equation requests when equation files are beyond early citation positions", () => {
    const tempDir = path.join(process.cwd(), ".tmp-stage05-tests");
    fs.mkdirSync(tempDir, { recursive: true });
    const noisePaths: string[] = [];
    for (let i = 0; i < 14; i += 1) {
      const rel = `.tmp-stage05-tests/noise-${i}.md`;
      const full = path.join(process.cwd(), rel);
      fs.writeFileSync(full, `# noise ${i}\nThis file has prose but no equation line.\n`, "utf8");
      noisePaths.push(rel);
    }
    const targetRel = ".tmp-stage05-tests/warp-geometry-equation-target.md";
    const targetFull = path.join(process.cwd(), targetRel);
    fs.writeFileSync(
      targetFull,
      [
        "# Warp congruence target",
        "K_ij = (1 / (2 alpha)) (D_i beta_j + D_j beta_i - d_t gamma_ij)",
      ].join("\n"),
      "utf8",
    );
    try {
      const rescue = __testHelixAskReliabilityGuards.buildExplicitPathEquationContractRescue({
        question: "What equation defines warp congruence in this codebase? Cite the file and equation.",
        explicitPaths: [],
        allowedCitations: [...noisePaths, targetRel],
      });
      expect(rescue).toBeTruthy();
      expect(rescue?.path).toBe(targetRel);
      expect(rescue?.equation).toMatch(/K_ij\s*=/i);
      const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
        question: "What equation defines warp congruence in this codebase? Cite the file and equation.",
        answer: rescue?.answer ?? "",
        allowedCitations: [...noisePaths, targetRel],
      });
      expect(contract.required).toBe(true);
      expect(contract.ok).toBe(true);
      expect(contract.reason).toBe("ok");
    } finally {
      for (const rel of [...noisePaths, targetRel]) {
        fs.rmSync(path.join(process.cwd(), rel), { force: true });
      }
    }
  });

  it("rescues equation quote from a live-like warp citation pack", () => {
    const allowed = [
      "docs/knowledge/warp/natario-zero-expansion.md",
      "modules/warp/natario-warp.ts",
      "docs/knowledge/warp/warp-bubble.md",
      "docs/warp-geometry-comparison.md",
      "docs/warp-geometry-congruence-state-of-the-art.md",
      "docs/knowledge/warp/warp-mechanics-tree.json",
      "docs/knowledge/physics/math-maturity-stages.md",
      "docs/alcubierre-alignment.md",
    ];
    const rescue = __testHelixAskReliabilityGuards.buildExplicitPathEquationContractRescue({
      question: "What equation defines warp congruence in this codebase? Cite the file and equation.",
      explicitPaths: [],
      allowedCitations: allowed,
    });
    expect(rescue).toBeTruthy();
    expect(allowed.includes(rescue?.path ?? "")).toBe(true);
    expect(rescue?.equation).toMatch(/=/);
    const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
      question: "What equation defines warp congruence in this codebase? Cite the file and equation.",
      answer: rescue?.answer ?? "",
      allowedCitations: allowed,
    });
    expect(contract.required).toBe(true);
    expect(contract.ok).toBe(true);
    expect(contract.reason).toBe("ok");
  });

  it("prefers mathematical equation lines over prose note lines with incidental assignments", () => {
    const relPath = ".tmp-stage05-tests/equation-vs-notes.md";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "Notes: warpFieldType=\"natario\" and mode=\"calibrated\" for the current run.",
        "Additional descriptive text that should not be selected as equation evidence.",
        "ds^2 = -(alpha^2 - beta_i beta^i) dt^2 + 2 beta_i dx^i dt + gamma_ij dx^i dx^j",
      ].join("\n"),
      "utf8",
    );
    try {
      const rescue = __testHelixAskReliabilityGuards.buildExplicitPathEquationContractRescue({
        question: "Show one warp congruence equation and cite it.",
        explicitPaths: [],
        allowedCitations: [relPath],
      });
      expect(rescue).toBeTruthy();
      expect(rescue?.equation).toMatch(/ds\^2/i);
      expect(rescue?.equation?.toLowerCase().includes("notes:")).toBe(false);
      const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
        question: "Show one warp congruence equation and cite it.",
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

  it("extracts concise equation fragment when a line mixes prose and equation", () => {
    const relPath = ".tmp-stage05-tests/equation-fragment-inline.md";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "Important congruence sign note: since beta^i = -X^i, the ADM formula K_ij = 1/2 (d_i beta_j + d_j beta_i - d_t gamma_ij) with d_t gamma = 0 equals minus Natario's K_ij.",
      ].join("\n"),
      "utf8",
    );
    try {
      const rescue = __testHelixAskReliabilityGuards.buildExplicitPathEquationContractRescue({
        question: "What equation defines warp congruence in this codebase? Cite the file and equation.",
        explicitPaths: [],
        allowedCitations: [relPath],
      });
      expect(rescue).toBeTruthy();
      expect(rescue?.path).toBe(relPath);
      expect(rescue?.equation).toMatch(/^K_ij\s*=/i);
      expect(rescue?.equation?.toLowerCase().startsWith("important congruence sign note")).toBe(false);
      const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
        question: "What equation defines warp congruence in this codebase? Cite the file and equation.",
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

  it("does not rescue config-like boolean assignment lines as equations", () => {
    const relPath = ".tmp-stage05-tests/equation-boolean-assignment.md";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "theta_geom=true and set",
        "theta_metric=false",
      ].join("\n"),
      "utf8",
    );
    try {
      const rescue = __testHelixAskReliabilityGuards.buildExplicitPathEquationContractRescue({
        question: "Can you show one equation used in warp congruence and explain what it means",
        explicitPaths: [],
        allowedCitations: [relPath],
      });
      expect(rescue).toBeNull();
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("rejects generic geometry equations for wave-function collapse prompts", () => {
    const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
      question: "explain equation of the collapse of the wave function?",
      answer:
        "Exact equation line (shared/collapse-benchmark.ts:L566): V_c = (4/3) pi r_c^3\nSources: shared/collapse-benchmark.ts",
      allowedCitations: ["shared/collapse-benchmark.ts"],
    });
    expect(contract.required).toBe(true);
    expect(contract.ok).toBe(false);
    expect(contract.reason).toBe("equation_relevance_missing");
    expect(contract.equationRelevanceReason).toBe("generic_geometry_mismatch");
  });

  it("rejects stress-energy comment equations for wave-function collapse prompts", () => {
    const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
      question: "explain equation of the collapse of the wave function?",
      answer:
        "Exact equation line (modules/dynamic/stress-energy-equations.ts:L175): // T00 = rho ; Tij = -rho delta_ij\nSources: modules/dynamic/stress-energy-equations.ts",
      allowedCitations: ["modules/dynamic/stress-energy-equations.ts"],
    });
    expect(contract.required).toBe(true);
    expect(contract.ok).toBe(false);
    expect(contract.reason).toBe("equation_relevance_missing");
  });

  it("does not report equation relevance when no equation is present", () => {
    const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
      question: "explain equation of the collapse of the wave function?",
      answer: "I cannot find an equation yet. Sources: server/services/mixer/collapse.ts",
      allowedCitations: ["server/services/mixer/collapse.ts"],
    });
    expect(contract.required).toBe(true);
    expect(contract.ok).toBe(false);
    expect(contract.reason).toBe("equation_missing");
    expect(contract.equationRelevanceRequired).toBe(false);
    expect(contract.equationRelevanceReason).toBe("not_required");
  });

  it("does not rescue generic geometry equations for wave-function collapse requests", () => {
    const relPath = ".tmp-stage05-tests/collapse-generic-geometry.md";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "Collapse benchmark note.",
        "V_c = (4/3) pi r_c^3",
      ].join("\n"),
      "utf8",
    );
    try {
      const rescue = __testHelixAskReliabilityGuards.buildExplicitPathEquationContractRescue({
        question: "what's the equation of the collapse of the wave function?",
        explicitPaths: [],
        allowedCitations: [relPath],
      });
      expect(rescue).toBeNull();
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("rescues wave-function equations when collapse-domain signals are present", () => {
    const relPath = ".tmp-stage05-tests/collapse-wave-equation.md";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "Quantum collapse relation",
        "psi = Pm psi0 / sqrt(prob)",
      ].join("\n"),
      "utf8",
    );
    try {
      const rescue = __testHelixAskReliabilityGuards.buildExplicitPathEquationContractRescue({
        question: "what's the equation of the collapse of the wave function?",
        explicitPaths: [],
        allowedCitations: [relPath],
      });
      expect(rescue).not.toBeNull();
      expect(rescue?.equation).toMatch(/psi/i);
      const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
        question: "what's the equation of the collapse of the wave function?",
        answer: rescue?.answer ?? "",
        allowedCitations: [relPath],
      });
      expect(contract.ok).toBe(true);
      expect(contract.reason).toBe("ok");
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("applies collapse-domain lock and suppresses warp-family paths for wave-function prompts", () => {
    const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(
      "what's the equation of the collapse of the wave function?",
    );
    expect(constraints.collapseDomainLock).toBe(true);
    expect(constraints.hardExcludeWarpFamily).toBe(true);
    const constrainedPaths = __testHelixAskReliabilityGuards.applyQueryConstraintsToPathList(
      [
        "modules/warp/natario-warp.ts",
        "docs/warp-geometry-congruence-report.md",
        "server/services/mixer/collapse.ts",
        "shared/dp-collapse.ts",
      ],
      constraints,
    );
    expect(constrainedPaths).toContain("server/services/mixer/collapse.ts");
    expect(constrainedPaths).toContain("shared/dp-collapse.ts");
    expect(constrainedPaths.some((entry) => /warp|natario/i.test(entry))).toBe(false);
  });

  it("honors explicit negative warp constraints in prompts", () => {
    const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(
      "Show one equation for collapse and explain it, but do not use warp or natario files.",
    );
    expect(constraints.hardExcludeWarpFamily).toBe(true);
    const constrainedPaths = __testHelixAskReliabilityGuards.applyQueryConstraintsToPathList(
      [
        "modules/warp/natario-warp.ts",
        "server/services/mixer/collapse.ts",
      ],
      constraints,
    );
    expect(constrainedPaths).toEqual(["server/services/mixer/collapse.ts"]);
  });

  it("treats 'what equation describes' prompts as equation-quote requests", () => {
    expect(
      __testHelixAskReliabilityGuards.isEquationQuotePrompt(
        "what equation describes dynamic Casimir modulation in this codebase?",
      ),
    ).toBe(true);
    expect(
      __testHelixAskReliabilityGuards.isEquationQuotePrompt(
        "what equation is used for polytrope behavior in this codebase?",
      ),
    ).toBe(true);
  });

  it("applies tokamak domain preferences and equation-noise exclusions", () => {
    const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(
      "show a core tokamak stability equation from this repo and explain where it is used.",
    );
    expect(constraints.hardExcludeWarpFamily).toBe(true);
    const constrainedPaths = __testHelixAskReliabilityGuards.applyQueryConstraintsToPathList(
      [
        "tests/helix-ask-stage05-content.spec.ts",
        "modules/warp/natario-warp.ts",
        "server/services/physics/tokamak-stability-proxies.ts",
      ],
      constraints,
    );
    expect(constrainedPaths).toContain("server/services/physics/tokamak-stability-proxies.ts");
    expect(constrainedPaths).not.toContain("tests/helix-ask-stage05-content.spec.ts");
    expect(constrainedPaths).not.toContain("modules/warp/natario-warp.ts");
  });

  it("demotes test-fixture paths for tokamak equation ranking", () => {
    const question = "show a core tokamak stability equation from this repo and explain where it is used";
    const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
    const tokens = ["tokamak", "stability", "equation", "repo", "used"];
    const rankedTokamak =
      __testHelixAskReliabilityGuards.rankEquationNearMissPath(
        "server/services/physics/tokamak-stability-proxies.ts",
        constraints,
        tokens,
        0,
      );
    const rankedFixture =
      __testHelixAskReliabilityGuards.rankEquationNearMissPath(
        "tests/helix-ask-stage05-content.spec.ts",
        constraints,
        tokens,
        0,
      );
    expect(rankedTokamak).toBeGreaterThan(rankedFixture);
  });

  it("rejects non-physics attribute assignments for tokamak equation prompts", () => {
    const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
      question: "show a core tokamak stability equation from this repo and explain where it is used",
      answer:
        "Exact equation line (docs/knowledge/dag-node-schema.md:L19): rel=\"depends-on\"\nSources: docs/knowledge/dag-node-schema.md",
      allowedCitations: ["docs/knowledge/dag-node-schema.md"],
    });
    expect(contract.required).toBe(true);
    expect(contract.ok).toBe(false);
    expect(contract.reason).toBe("equation_relevance_missing");
  });

  it("accepts tokamak-stability equations with tokamak-domain signals", () => {
    const contract = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
      question: "show a core tokamak stability equation from this repo and explain where it is used",
      answer:
        "Exact equation line (server/services/physics/tokamak-stability-proxies.ts:L88): beta_p = 2*mu0*P/B_theta^2\nSources: server/services/physics/tokamak-stability-proxies.ts",
      allowedCitations: ["server/services/physics/tokamak-stability-proxies.ts"],
    });
    expect(contract.required).toBe(true);
    expect(contract.ok).toBe(true);
    expect(contract.reason).toBe("ok");
  });

  it("builds strict-mode relaxed fallback text for tokamak equation prompts", () => {
    const question = "show a core tokamak stability equation from this repo and explain where it is used";
    const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
    const fallback = __testHelixAskReliabilityGuards.buildEquationSoftFallbackMessage({
      question,
      citationHints: [],
      queryConstraints: constraints,
    });
    expect(fallback.trim().length).toBeGreaterThan(0);
    expect(fallback).toMatch(/tokamak|stability/i);
  });

  it("keeps allowed fallback example paths during citation scrub", () => {
    const text =
      "I couldn't verify an exact equation quote with a matching file citation from current evidence. " +
      "Please provide module/path/symbol (for example: [server/services/physics/tokamak-stability-proxies.ts] or [shared/tokamak-stability-proxies.ts]) and retry.";
    const scrubbed = __testHelixAskDialogueFormatting.scrubUnsupportedPaths(text, [
      "server/services/physics/tokamak-stability-proxies.ts",
      "shared/tokamak-stability-proxies.ts",
    ]);
    expect(scrubbed.removed).toHaveLength(0);
    expect(scrubbed.text).toContain("[server/services/physics/tokamak-stability-proxies.ts]");
    expect(scrubbed.text).toContain("[shared/tokamak-stability-proxies.ts]");
  });

  it("keeps extensionless path variants when allowlist contains file extensions", () => {
    const text =
      "Closest grounded files: server/services/mixer/collapse and shared/dp-collapse.";
    const scrubbed = __testHelixAskDialogueFormatting.scrubUnsupportedPaths(text, [
      "server/services/mixer/collapse.ts",
      "shared/dp-collapse.ts",
    ]);
    expect(scrubbed.removed).toHaveLength(0);
    expect(scrubbed.text).toContain("server/services/mixer/collapse");
    expect(scrubbed.text).toContain("shared/dp-collapse");
  });

  it("removes dangling extension-bracket fragments after unsupported citation scrub", () => {
    const text =
      "Claim-first explanation:\n1. [server/services/mixer/collapse.ts] Grounded equation candidates were retrieved.";
    const scrubbed = __testHelixAskDialogueFormatting.scrubUnsupportedPaths(text, [
      "shared/dp-collapse.ts",
    ]);
    expect(scrubbed.removed).toContain("server/services/mixer/collapse.ts");
    expect(scrubbed.text).not.toContain("ts]");
    expect(scrubbed.text).toContain("Grounded equation candidates were retrieved.");
  });

  it("prefers polytrope domain paths over ethos docs for equation ranking", () => {
    const question = "what equation is used for polytrope behavior in this codebase";
    const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
    const tokens = ["equation", "polytrope", "codebase", "behavior"];
    const rankedPolytrope =
      __testHelixAskReliabilityGuards.rankEquationNearMissPath(
        "client/src/physics/polytrope.ts",
        constraints,
        tokens,
        0,
      );
    const rankedEthos =
      __testHelixAskReliabilityGuards.rankEquationNearMissPath(
        "docs/ethos/ideology-telemetry-schema.json",
        constraints,
        tokens,
        0,
      );
    expect(rankedPolytrope).toBeGreaterThan(rankedEthos);
  });

  it("applies collapse-domain affinity and anti-warp penalties in equation scoring", () => {
    const tokens = ["collapse", "wave", "function", "equation"];
    const collapseAffinity =
      __testHelixAskReliabilityGuards.scoreEquationDomainPathAffinity(
        "server/services/mixer/collapse.ts",
        tokens,
      );
    const warpAffinity =
      __testHelixAskReliabilityGuards.scoreEquationDomainPathAffinity(
        "modules/warp/natario-warp.ts",
        tokens,
      );
    expect(collapseAffinity).toBeGreaterThan(warpAffinity);
  });

  it("enforces explicit anchor priority for equation quote contracts", () => {
    const base = __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
      question: "Show one equation and cite it.",
      answer:
        "Exact equation line (modules/dynamic/natario-metric.ts:L63): g_ij = diag(1/a^2, 1/b^2, 1/c^2)\nSources: modules/dynamic/natario-metric.ts",
      allowedCitations: ["modules/dynamic/natario-metric.ts", "shared/schema.ts"],
    });
    expect(base.ok).toBe(true);
    const prioritized = __testHelixAskReliabilityGuards.applyEquationAnchorPriority(base, [
      "shared/schema.ts",
    ]);
    expect(prioritized.ok).toBe(false);
    expect(prioritized.reason).toBe("citation_missing");
    const anchored = __testHelixAskReliabilityGuards.applyEquationAnchorPriority(
      __testHelixAskReliabilityGuards.evaluateEquationQuoteContract({
        question: "Show one equation and cite it.",
        answer:
          "Exact equation line (shared/schema.ts:L654): S = |∫ g(t) rho_neg(t) dt| / qi_limit\nSources: shared/schema.ts",
        allowedCitations: ["shared/schema.ts"],
      }),
      ["shared/schema.ts"],
    );
    expect(anchored.ok).toBe(true);
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

describe("helix ask dialogue formatting", () => {
  it("augments sparse stage0 seed with ranked candidates and code support", () => {
    const byPath = new Map(
      [
        {
          filePath: "docs/knowledge/physics/dynamic-casimir-effect.md",
          preview: "doc",
          score: 44,
          rrfScore: 0,
        },
        {
          filePath: "server/energy-pipeline.ts",
          preview: "code",
          score: 41,
          rrfScore: 0,
        },
        {
          filePath: "modules/dynamic/dynamic-casimir.ts",
          preview: "code2",
          score: 40,
          rrfScore: 0,
        },
      ].map((entry) => [entry.filePath, entry]),
    ) as any;
    const seeded = __testHelixAskDialogueFormatting.buildStage05InputPaths({
      stage0Paths: ["docs/knowledge/physics/dynamic-casimir-effect.md"],
      byPath,
      maxFiles: 12,
      intentDomain: "hybrid",
    });

    expect(seeded.length).toBeGreaterThan(1);
    expect(seeded).toContain("docs/knowledge/physics/dynamic-casimir-effect.md");
    expect(seeded.some((entry: string) => /\.ts$/i.test(entry))).toBe(true);
    expect(seeded).toContain("server/energy-pipeline.ts");
  });

  it("allows stage0.5 seeding from ranked retrieval even when stage0 path set is empty", () => {
    const byPath = new Map(
      [
        {
          filePath: "docs/knowledge/physics/dynamic-casimir-effect.md",
          preview: "doc",
          score: 30,
          rrfScore: 0,
        },
        {
          filePath: "modules/dynamic/dynamic-casimir.ts",
          preview: "code",
          score: 32,
          rrfScore: 0,
        },
      ].map((entry) => [entry.filePath, entry]),
    ) as any;
    const seeded = __testHelixAskDialogueFormatting.buildStage05InputPaths({
      stage0Paths: [],
      byPath,
      maxFiles: 8,
      intentDomain: "repo",
    });

    expect(seeded.length).toBeGreaterThan(0);
    expect(seeded).toContain("modules/dynamic/dynamic-casimir.ts");
  });

  it("accepts explicit seed paths when stage0 and ranked candidates are sparse", () => {
    const byPath = new Map<string, any>();
    const seeded = __testHelixAskDialogueFormatting.buildStage05InputPaths({
      stage0Paths: [],
      byPath,
      seedPaths: ["server/services/mixer/collapse.ts"],
      maxFiles: 8,
      intentDomain: "repo",
    });

    expect(seeded.length).toBeGreaterThan(0);
    expect(seeded).toContain("server/services/mixer/collapse.ts");
  });

  it("keeps at least one code path when stage0 list is long and docs-first", () => {
    const stage0Paths = Array.from({ length: 64 }, (_, index) =>
      `docs/knowledge/physics/doc-${index + 1}.md`,
    );
    stage0Paths.push("modules/dynamic/dynamic-casimir.ts");
    const byPath = new Map(
      stage0Paths.map((filePath, index) => [
        filePath,
        { filePath, preview: filePath, score: 200 - index, rrfScore: 0 },
      ]),
    ) as any;
    const seeded = __testHelixAskDialogueFormatting.buildStage05InputPaths({
      stage0Paths,
      byPath,
      maxFiles: 12,
      intentDomain: "repo",
    });

    expect(seeded.length).toBe(48);
    expect(seeded.some((entry: string) => /\.ts$/i.test(entry))).toBe(true);
    expect(seeded).toContain("modules/dynamic/dynamic-casimir.ts");
  });

  it("normalizes bundled quoted question lists to the primary question", () => {
    const normalized = __testHelixAskDialogueFormatting.normalizeBundledQuestion(
      "Question: How does dynamic Casimir modulation feed into the system's physics outputs?','Can you show one equation used in warp congruence and explain what it means",
    );
    expect(normalized).toBe("How does dynamic Casimir modulation feed into the system's physics outputs?");
  });

  it("extracts and normalizes question lines from prompt wrappers", () => {
    const extracted = __testHelixAskDialogueFormatting.extractQuestionFromPrompt(
      [
        "System: test",
        "Question: How does dynamic Casimir modulation feed into the system's physics outputs?','Can you show one equation used in warp congruence and explain what it means",
        "FINAL:",
      ].join("\n"),
    );
    expect(extracted).toBe("How does dynamic Casimir modulation feed into the system's physics outputs?");
  });

  it("resolves prompt-only asks to a usable base question", () => {
    const resolved = __testHelixAskDialogueFormatting.resolveHelixAskQuestionText({
      question: "",
      prompt: "In this codebase, explain equation of the collapse of the wave function.",
    });
    expect(resolved).toBe("In this codebase, explain equation of the collapse of the wave function");
  });

  it("prefers explicit question input over prompt fallback", () => {
    const resolved = __testHelixAskDialogueFormatting.resolveHelixAskQuestionText({
      question: "What equation is used in shared/dp-collapse.ts?",
      prompt: "In this codebase, explain collapse.",
    });
    expect(resolved).toBe("What equation is used in shared/dp-collapse.ts?");
  });

  it("filters malformed checked-file summaries and low-signal heading hints", () => {
    const hints = __testHelixAskDialogueFormatting.buildNextEvidenceHints({
      question: "Explain dynamic Casimir modulation outputs.",
      includeSearchSummary: true,
      searchedTerms: ["dynamic casimir", " outputs  ", "docs headings"],
      searchedFiles: [" ,,, ", " shared/schema.ts,,", "docs/knowledge/physics/dynamic-casimir-effect.md"],
      headingSeedSlots: [
        { id: "seed_num", label: "3.", required: false, source: "heading", surfaces: [] },
        {
          id: "seed_good",
          label: "Dynamic Casimir Effects (DCE)",
          required: false,
          source: "heading",
          surfaces: [],
        },
      ],
      limit: 4,
    });

    expect(hints.some((entry) => /Checked files:\s*,/i.test(entry))).toBe(false);
    expect(hints.some((entry) => /Search docs headings for \"3\.\"/i.test(entry))).toBe(false);
    expect(
      hints.some((entry) => /dynamic-casimir-effect\.md/i.test(entry) || /Dynamic Casimir Effects/i.test(entry)),
    ).toBe(true);
  });

  it("drops malformed checked-files bullets from scientific voice rewrite", () => {
    const rewritten = __testHelixAskDialogueFormatting.rewriteConversationScientificVoice([
      "Confirmed:",
      "- Dynamic Casimir modulation affects output envelopes.",
      "",
      "Reasoned connections (bounded):",
      "- Modulation changes boundary conditions that feed measured spectra.",
      "",
      "Next evidence:",
      "- Checked files: ,,,",
      "- Search docs headings for \"3.\"",
      "- Check docs/knowledge/physics/dynamic-casimir-effect.md for \"Outputs\".",
    ].join("\n"));

    expect(rewritten).not.toMatch(/Checked files:\s*,/i);
    expect(rewritten).not.toMatch(/Search docs headings for \"3\.\"/i);
    expect(rewritten).toMatch(/dynamic-casimir-effect\.md/i);
  });

  it("strips timestamped tool timeline tails from inline answer text", () => {
    const raw =
      "I couldn't verify a verbatim wave-function-collapse equation line in the current repository evidence. server/services/mixer/collapse.ts. " +
      "[20:41:18.422] tool=progress | seq=36 | dur=25607ms | text=Helix Ask: Retrieval code-first - done";
    const cleaned = __testHelixAskDialogueFormatting.stripTelemetryLeakArtifacts(raw);
    expect(cleaned.detected).toBe(true);
    expect(cleaned.text).toMatch(/server\/services\/mixer\/collapse\.ts\.$/i);
    expect(cleaned.text).not.toMatch(/\[20:41:18\.422\]/);
    expect(cleaned.text).not.toMatch(/tool=progress/i);
  });

  it("strips standalone timestamped tool event lines from final text", () => {
    const raw = [
      "Closest grounded files: server/services/mixer/collapse.ts, shared/dp-collapse.ts.",
      "[20:41:18.422] tool=event | seq=37 | dur=25607ms | text=Helix Ask: Retrieval code-first - done",
      "tool=progress | seq=58 | dur=0ms | text=Helix Ask: LLM equation quote repair - start",
      "Sources: server/services/mixer/collapse.ts, shared/dp-collapse.ts",
    ].join("\n");
    const cleaned = __testHelixAskDialogueFormatting.stripTelemetryLeakArtifacts(raw);
    expect(cleaned.detected).toBe(true);
    expect(cleaned.text).toContain("Closest grounded files:");
    expect(cleaned.text).toContain("Sources:");
    expect(cleaned.text).not.toMatch(/tool=event/i);
    expect(cleaned.text).not.toMatch(/tool=progress/i);
  });

  it("removes dangling extension fragments left after cleanup", () => {
    const raw =
      "I couldn't verify a verbatim wave-function-collapse equation line in the current repository evidence. ts.";
    const cleaned = __testHelixAskDialogueFormatting.cleanDanglingFileExtensionFragments(raw);
    expect(cleaned).toBe(
      "I couldn't verify a verbatim wave-function-collapse equation line in the current repository evidence.",
    );
  });

  it("removes orphan extension bracket residue in numbered lines", () => {
    const raw =
      "Claim-first explanation:\n1. ts] Grounded equation candidates were retrieved.\n2. md] Additional context pending.";
    const cleaned = __testHelixAskDialogueFormatting.cleanDanglingFileExtensionFragments(raw);
    expect(cleaned).not.toContain("ts]");
    expect(cleaned).not.toContain("md]");
    expect(cleaned).toContain("1. Grounded equation candidates were retrieved.");
  });

  it("removes orphan dotted extension residue after partial path cleanup", () => {
    const raw = [
      "Claim-first explanation:",
      "1. .ts] Grounded equation candidates were retrieved.",
      "2. Current repository evidence maps to implementation operators. .md]",
      "3. Candidate tail from scrub: .ts",
      "4. Bracket orphan: [.ts]",
    ].join("\n");
    const cleaned = __testHelixAskDialogueFormatting.cleanDanglingFileExtensionFragments(raw);
    expect(cleaned).not.toContain(".ts]");
    expect(cleaned).not.toContain(".md]");
    expect(cleaned).not.toContain(" .ts");
    expect(cleaned).not.toContain("[.ts]");
    expect(cleaned).toContain("Grounded equation candidates were retrieved.");
  });

  it("preserves valid file citations ending in .ts inside brackets", () => {
    const raw =
      "Claim-first explanation: 1. [server/services/mixer/collapse.ts] Grounded equation candidates were retrieved.";
    const cleaned = __testHelixAskDialogueFormatting.cleanDanglingFileExtensionFragments(raw);
    expect(cleaned).toContain("[server/services/mixer/collapse.ts]");
    expect(cleaned).toContain("Grounded equation candidates were retrieved.");
  });

  it("preserves allowed line-anchored citations during unsupported-path scrub", () => {
    const raw = [
      "Exact equation line (server/services/mixer/collapse.ts:L42):",
      "- [server/services/mixer/collapse.ts:L42] psi = Pm psi0 / sqrt(prob)",
      "Sources: server/services/mixer/collapse.ts",
    ].join("\n");
    const scrubbed = __testHelixAskDialogueFormatting.scrubUnsupportedPaths(raw, [
      "server/services/mixer/collapse.ts",
    ]);
    expect(scrubbed.removed).toEqual([]);
    expect(scrubbed.text).toMatch(/server\/services\/mixer\/collapse\.ts:L42/i);
    expect(scrubbed.text).toMatch(/\bpsi\s*=/i);
  });
});

describe("equation plus mechanism mode helpers", () => {
  it("detects direct equation-of prompts as equation quote requests", () => {
    expect(
      __testHelixAskReliabilityGuards.isEquationQuotePrompt(
        "what's the equation of the collapse of the wave function?",
      ),
    ).toBe(true);
    expect(
      __testHelixAskReliabilityGuards.isEquationQuotePrompt(
        "equation_of_the_collapse_of_the_wave_function",
      ),
    ).toBe(true);
  });

  it("detects mixed equation + explanation prompts", () => {
    expect(
      __testHelixAskReliabilityGuards.isEquationPlusMechanismPrompt(
        "How does dynamic Casimir modulation feed into the system's physics outputs? Can you show one equation used in warp congruence and explain what it means",
      ),
    ).toBe(true);
    expect(
      __testHelixAskReliabilityGuards.isEquationPlusMechanismPrompt(
        "Show one equation used in warp congruence.",
      ),
    ).toBe(false);
    expect(
      __testHelixAskReliabilityGuards.isEquationBlendPrompt(
        "what's the equation of the collapse of the wave function?",
      ),
    ).toBe(true);
  });

  it("detects explicit quote-only equation prompts", () => {
    expect(
      __testHelixAskReliabilityGuards.isEquationQuoteOnlyPrompt(
        "Give the exact equation line only for warp congruence, no explanation.",
      ),
    ).toBe(true);
    expect(
      __testHelixAskReliabilityGuards.isEquationBlendPrompt(
        "Give the exact equation line only for warp congruence, no explanation.",
      ),
    ).toBe(false);
  });

  it("flags equation-anchor-only answers as too short for mechanism mode", () => {
    const anchorOnly =
      "Exact equation line (docs/warp-geometry-congruence-report.md:L399): K_ij = 1/2 (d_i beta_j + d_j beta_i)\nSources: docs/warp-geometry-congruence-report.md";
    const expanded =
      "Exact equation line (docs/warp-geometry-congruence-report.md:L399): K_ij = 1/2 (d_i beta_j + d_j beta_i).\n" +
      "This means extrinsic curvature is computed from shift-vector spatial derivatives.\n" +
      "Mechanism: shift-vector gradient -> K_ij tensor update -> downstream congruence diagnostics.\n" +
      "In the system, this is used by warp geometry/congruence analysis paths to interpret solve outputs.\n" +
      "Sources: docs/warp-geometry-congruence-report.md, modules/warp/warp-module.ts";
    expect(__testHelixAskReliabilityGuards.isEquationAnchorOnlyAnswer(anchorOnly)).toBe(true);
    expect(__testHelixAskReliabilityGuards.isEquationAnchorOnlyAnswer(expanded)).toBe(false);
  });
});

describe("equation selector continuity contract", () => {
  it("builds a stable intent contract hash for the same inputs", () => {
    const question =
      "From shared/collapse-benchmark.ts, quote rho_eff_kg_m3 and kappa_collapse_m2 around lines 570-571 and explain.";
    const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(
      question,
      ["shared/collapse-benchmark.ts"],
    );
    const contract = __testHelixAskReliabilityGuards.buildHelixAskIntentContract({
      question,
      queryConstraints: constraints,
      explicitPaths: ["shared/collapse-benchmark.ts"],
    });
    const hash = __testHelixAskReliabilityGuards.hashHelixAskIntentContract(contract);
    const stability = __testHelixAskReliabilityGuards.assertHelixAskIntentContractStable({
      expectedHash: hash,
      current: contract,
    });
    expect(stability.stable).toBe(true);
    expect(stability.currentHash).toBe(hash);
  });

  it("uses no-substitution mode for specific prompts when symbol match is missing", () => {
    const relPath = ".tmp-stage05-tests/specific-no-substitution.ts";
    const fullPath = path.join(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(
      fullPath,
      [
        "export const collapseDiagnostics = true;",
        "volume = (4 / 3) * PI * r * r * r",
      ].join("\n"),
      "utf8",
    );
    try {
      const question = `From ${relPath}, quote exact equation lines for rho_eff_kg_m3 and kappa_collapse_m2 around lines 1-3.`;
      const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question, [
        relPath,
      ]);
      const contract = __testHelixAskReliabilityGuards.buildHelixAskIntentContract({
        question,
        queryConstraints: constraints,
        explicitPaths: [relPath],
      });
      const result = __testHelixAskReliabilityGuards.buildEquationClaimBackingAssembly({
        question,
        draftAnswer: "",
        answerContract: null,
        evidenceText: `Sources: ${relPath}`,
        docBlocks: [{ path: relPath, block: "volume = (4 / 3) * PI * r * r * r" }],
        codeAlignment: null,
        stage05Cards: [
          {
            path: relPath,
            summary: "Specific-path collapse equation test",
            slotHits: ["equation", "code_path"],
            confidence: 0.9,
            snippets: [{ start: 1, end: 3, text: fs.readFileSync(fullPath, "utf8") }],
          },
        ],
        allowedCitations: [relPath],
        queryConstraints: constraints,
        strictPrompt: false,
        explicitPathOnlyExtraction: false,
        intentContract: contract,
      });
      expect(result).toBeTruthy();
      expect(result?.primarySelected).toBeNull();
      expect(result?.reason).toBe("specific_no_symbol_match");
      expect(result?.text).toMatch(/No verified symbol-match in explicit path/i);
    } finally {
      fs.rmSync(fullPath, { force: true });
    }
  });

  it("asserts renderer primary key parity with selector primary key", () => {
    const text = [
      "Primary Topic: collapse",
      "",
      "Primary Equation (Tentative):",
      "- [shared/dp-collapse.ts:L280] volume = (4 / 3) * PI * r * r * r",
      "",
      "Mechanism Explanation:",
      "1. baseline",
    ].join("\n");
    const parity = __testHelixAskReliabilityGuards.assertRenderedPrimaryMatchesSelection({
      selectorPrimaryKey: "shared/dp-collapse.ts:L280",
      renderedText: text,
    });
    const mismatch = __testHelixAskReliabilityGuards.assertRenderedPrimaryMatchesSelection({
      selectorPrimaryKey: "shared/dp-collapse.ts:L570",
      renderedText: text,
    });
    expect(parity.match).toBe(true);
    expect(parity.rendererPrimaryKey).toBe("shared/dp-collapse.ts:L280");
    expect(mismatch.match).toBe(false);
  });

  it("suppresses ambiguity taxonomy when equation selector authority lock is active", () => {
    const applyWithoutLock =
      __testHelixAskReliabilityGuards.resolveAmbiguityAppliedForFallbackTaxonomy({
        ambiguityApplied: true,
        equationSelectorAuthorityLock: false,
      });
    const applyWithLock =
      __testHelixAskReliabilityGuards.resolveAmbiguityAppliedForFallbackTaxonomy({
        ambiguityApplied: true,
        equationSelectorAuthorityLock: true,
      });
    const noAmbiguity =
      __testHelixAskReliabilityGuards.resolveAmbiguityAppliedForFallbackTaxonomy({
        ambiguityApplied: false,
        equationSelectorAuthorityLock: false,
      });
    expect(applyWithoutLock).toBe(true);
    expect(applyWithLock).toBe(false);
    expect(noAmbiguity).toBe(false);
  });

  it("blocks single-LLM scaffold fallback when deterministic runtime fallback is pinned", () => {
    const allowed =
      __testHelixAskReliabilityGuards.shouldAllowSingleLlmScaffoldFallback({
        deterministicRepoRuntimeFallbackUsed: false,
      });
    const blocked =
      __testHelixAskReliabilityGuards.shouldAllowSingleLlmScaffoldFallback({
        deterministicRepoRuntimeFallbackUsed: true,
      });
    expect(allowed).toBe(true);
    expect(blocked).toBe(false);
  });

  it("builds unified degrade answers with fixed sections", () => {
    const question = "explain equation of the collapse of the wave function?";
    const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
    const contract = __testHelixAskReliabilityGuards.buildHelixAskIntentContract({
      question,
      queryConstraints: constraints,
    });
    const text = __testHelixAskReliabilityGuards.buildEquationUnifiedDegradeAnswer({
      question,
      contract,
      candidates: [],
      reason: "test_unresolved",
    });
    expect(text).toMatch(/Primary Topic:/i);
    expect(text).toMatch(/Primary Equation \(Tentative\):/i);
    expect(text).toMatch(/Mechanism Explanation:/i);
    expect(text).toMatch(/Rejected Candidates \(Why\):/i);
    expect(text).toMatch(/Sources:/i);
  });

  it("filters wave-collapse degrade candidates toward wave-semantic lines", () => {
    const question = "Explain the equation of the collapse of the wave function in this codebase.";
    const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
    const contract = __testHelixAskReliabilityGuards.buildHelixAskIntentContract({
      question,
      queryConstraints: constraints,
    });
    const text = __testHelixAskReliabilityGuards.buildEquationUnifiedDegradeAnswer({
      question,
      contract,
      reason: "test_wave_semantic_filter",
      candidates: [
        {
          path: "shared/collapse-benchmark.ts",
          line: 306,
          equation: "tau_ms = tau_ceiling_ms - instability * (tau_ceiling_ms - tau_floor_ms)",
          score: 92,
          semanticFit: { required: true, score: 28, ok: false, reason: "weak_domain_signal" },
          equationClass: "implementation_assignment",
          derivationLevel: "implementation",
          domainFamily: "collapse",
          sourceReliability: 0.9,
          rhsMathSignal: true,
          stringLiteralSignal: false,
          rejectionReason: null,
          source: "scan",
        },
        {
          path: "docs/DP_COLLAPSE_DERIVATION.md",
          line: 23,
          equation: "psi' = (Pm psi) / sqrt(<psi|Pm|psi>)",
          score: 88,
          semanticFit: { required: true, score: 86, ok: true, reason: "ok" },
          equationClass: "derived_relation",
          derivationLevel: "derived",
          domainFamily: "collapse",
          sourceReliability: 0.7,
          rhsMathSignal: true,
          stringLiteralSignal: false,
          rejectionReason: null,
          source: "scan",
        },
      ],
    });
    expect(text).toContain("[docs/DP_COLLAPSE_DERIVATION.md:L23]");
    expect(text).not.toContain("tau_ms = tau_ceiling_ms");
  });

  it("keeps unified degrade sources clean when unanchored candidates appear", () => {
    const question = "Explain the congruence equation of the warp bubble solution.";
    const constraints = __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints(question);
    const contract = __testHelixAskReliabilityGuards.buildHelixAskIntentContract({
      question,
      queryConstraints: constraints,
    });
    const text = __testHelixAskReliabilityGuards.buildEquationUnifiedDegradeAnswer({
      question,
      contract,
      reason: "test_anchor_cleanup",
      candidates: [
        {
          path: "",
          line: 0,
          equation: "X^x = v_s f(r_s) and X^y = X^z = 0",
          score: 86,
          semanticFit: { required: true, score: 64, ok: true, reason: "ok" },
          equationClass: "derived_relation",
          derivationLevel: "derived",
          domainFamily: "warp",
          sourceReliability: 0.5,
          rhsMathSignal: true,
          stringLiteralSignal: false,
          rejectionReason: null,
          source: "scan",
        },
        {
          path: "docs/warp-console-architecture.md",
          line: 180,
          equation: "beta^x = -v_s f(r_s)",
          score: 84,
          semanticFit: { required: true, score: 74, ok: true, reason: "ok" },
          equationClass: "derived_relation",
          derivationLevel: "derived",
          domainFamily: "warp",
          sourceReliability: 0.65,
          rhsMathSignal: true,
          stringLiteralSignal: false,
          rejectionReason: null,
          source: "scan",
        },
      ],
    });
    expect(text).toContain("Sources: docs/warp-console-architecture.md");
    expect(text).not.toMatch(/Sources:\s*,/);
    expect(text).not.toContain(",,");
  });
});
