import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildHelixAskObjectiveMiniAnswers,
  buildHelixAskObjectiveMiniCritiquePrompt,
  buildHelixAskObjectiveMiniSynthPrompt,
  summarizeHelixAskObjectiveMiniValidation,
} from "../services/helix-ask/contracts/turn-contract-objective-mini-answers";
import type { HelixAskEvidencePackObligationCoverage } from "../services/helix-ask/obligation-coverage";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(
  repoRoot,
  "server/services/helix-ask/contracts/turn-contract-objective-mini-answers.ts",
);

const coverage = (entry: Partial<HelixAskEvidencePackObligationCoverage>): HelixAskEvidencePackObligationCoverage => ({
  obligation_id: "obligation",
  label: "Mechanism Coverage",
  kind: "direct_answer",
  status: "covered",
  matched_slots: [],
  missing_slots: [],
  evidence_refs: [],
  doc_refs: [],
  code_refs: [],
  ...entry,
});

describe("Helix Ask objective mini-answer extraction boundary", () => {
  it("keeps objective mini-answer assembly out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/contracts/turn-contract-objective-mini-answers");
    expect(routeSource).not.toMatch(/const\s+buildHelixAskObjectiveMiniAnswers\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+buildHelixAskObjectiveMiniCritiquePrompt\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+buildHelixAskObjectiveMiniSynthPrompt\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+summarizeHelixAskObjectiveMiniValidation\s*=\s*\(/);
    expect(serviceSource).toMatch(/export\s+const\s+buildHelixAskObjectiveMiniAnswers\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+buildHelixAskObjectiveMiniCritiquePrompt\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+buildHelixAskObjectiveMiniSynthPrompt\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+summarizeHelixAskObjectiveMiniValidation\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../../../routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves mini-answer assembly from state, support, coverage, retrieval files, and fallback refs", () => {
    expect(
      buildHelixAskObjectiveMiniAnswers({
        states: [
          {
            objective_id: "obj_1",
            objective_label: "Mechanism Coverage",
            required_slots: ["mechanism", "repo-mapping", "retrieval-reasoning"],
            matched_slots: [],
            status: "synthesizing",
            retrieval_confidence: 0.6,
          },
          {
            objective_id: "obj_2",
            objective_label: "Missing Force",
            required_slots: ["force-value"],
            matched_slots: [],
            status: "blocked",
            retrieval_confidence: 0,
          },
        ],
        support: [
          {
            objective: "Mechanism Coverage",
            supported: true,
            matched_slots: ["mechanism"],
          },
        ],
        obligationCoverage: [
          coverage({
            label: "Mechanism Coverage",
            evidence_refs: ["docs/research/nhm2.md"],
            code_refs: ["server/routes/evidence-reasoning.ts"],
          }),
        ],
        objectiveRetrievalSelectedFiles: [
          {
            objective_id: "obj_1",
            pass_index: 1,
            files: ["docs/research/nhm2-current-status-whitepaper-2026-05-02.md"],
          },
        ],
        fallbackEvidenceRefs: ["docs/fallback.md"],
        enableHeuristicInference: true,
      }),
    ).toEqual([
      {
        objective_id: "obj_1",
        objective_label: "Mechanism Coverage",
        status: "covered",
        matched_slots: ["mechanism", "repo-mapping", "retrieval-reasoning"],
        missing_slots: [],
        evidence_refs: [
          "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          "mechanism",
          "docs/research/nhm2.md",
          "server/routes/evidence-reasoning.ts",
        ],
        linked_evidence_refs: [
          "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          "mechanism",
          "docs/research/nhm2.md",
          "server/routes/evidence-reasoning.ts",
        ],
        summary:
          "Mechanism Coverage: covered. Evidence: docs/research/nhm2-current-status-whitepaper-2026-05-02.md, mechanism, docs/research/nhm2.md, server/routes/evidence-reasoning.ts. Missing slots: none.",
        unknown_block: undefined,
      },
      {
        objective_id: "obj_2",
        objective_label: "Missing Force",
        status: "blocked",
        matched_slots: [],
        missing_slots: ["force-value"],
        evidence_refs: ["docs/fallback.md"],
        linked_evidence_refs: [],
        summary: "Missing Force: blocked. Evidence: docs/fallback.md. Missing slots: force-value.",
        unknown_block: {
          unknown: "Required objective unresolved: Missing Force.",
          why: "required objective unresolved; missing force-value",
          what_i_checked: ["docs/fallback.md"],
          next_retrieval:
            'Run objective-scoped retrieval for "Missing Force" and collect evidence for slots: force-value.',
        },
      },
    ]);
  });

  it("preserves mini-answer validation summary counts", () => {
    expect(
      summarizeHelixAskObjectiveMiniValidation([
        {
          objective_id: "covered",
          objective_label: "Covered",
          status: "covered",
          matched_slots: [],
          missing_slots: [],
          evidence_refs: [],
          summary: "covered",
        },
        {
          objective_id: "partial",
          objective_label: "Partial",
          status: "partial",
          matched_slots: [],
          missing_slots: ["evidence"],
          evidence_refs: [],
          summary: "partial",
        },
        {
          objective_id: "blocked",
          objective_label: "Blocked",
          status: "blocked",
          matched_slots: [],
          missing_slots: ["evidence"],
          evidence_refs: [],
          summary: "blocked",
        },
      ]),
    ).toEqual({
      total: 3,
      covered: 1,
      partial: 1,
      blocked: 1,
      unresolved: 2,
    });
  });

  it("preserves objective mini-synth prompt rendering", () => {
    expect(
      buildHelixAskObjectiveMiniSynthPrompt({
        question: "Where is the evidence?",
        responseLanguage: "en",
        miniAnswers: [
          {
            objective_id: "obj_1",
            objective_label: "Evidence Coverage",
            status: "partial",
            matched_slots: ["doc-evidence"],
            missing_slots: ["numeric-result"],
            evidence_refs: [
              "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
              "server/services/helix-ask/evidence.ts",
            ],
            summary: "Evidence Coverage: partially covered.",
          },
        ],
      }),
    ).toContain(
      [
        "You are Helix Ask objective mini-synthesizer.",
        "Return strict JSON only. No markdown. No commentary.",
        "Schema:",
        '{ "objectives": [{"objective_id":"string","status":"covered|partial|blocked","matched_slots":["slot-id"],"missing_slots":["slot-id"],"summary":"string","evidence_refs":["path"],"unknown_block":{"unknown":"string","why":"string","what_i_checked":["string"],"next_retrieval":"string"}}] }',
        "Rules:",
        "- Include each objective_id exactly once.",
        "- Use only objective-local evidence refs already provided unless absolutely needed.",
        "- If status=covered, missing_slots must be empty.",
        "- If status=partial|blocked, include meaningful missing_slots.",
        "- Keep summary concise.",
        "responseLanguage=en",
        "",
        "Question: Where is the evidence?",
        "",
        "Objective checkpoints:",
        "1. objective_id=obj_1",
        "label=Evidence Coverage",
        "baseline_status=partial",
        "matched_slots=doc-evidence",
        "missing_slots=numeric-result",
        "evidence_refs=docs/research/nhm2-current-status-whitepaper-2026-05-02.md, server/services/helix-ask/evidence.ts",
        "summary=Evidence Coverage: partially covered.",
      ].join("\n"),
    );
  });

  it("preserves objective mini-critic prompt rendering", () => {
    expect(
      buildHelixAskObjectiveMiniCritiquePrompt({
        question: "Where is the evidence?",
        responseLanguage: "en",
        miniAnswers: [
          {
            objective_id: "obj_1",
            objective_label: "Evidence Coverage",
            status: "covered",
            matched_slots: ["doc-evidence", "numeric-result"],
            missing_slots: [],
            evidence_refs: ["docs/research/nhm2-current-status-whitepaper-2026-05-02.md"],
            summary: "Evidence Coverage: covered.",
          },
        ],
      }),
    ).toContain(
      [
        "You are Helix Ask objective mini-critic.",
        "Return strict JSON only. No markdown. No commentary.",
        "Schema:",
        '{ "objectives": [{"objective_id":"string","status":"covered|partial|blocked","missing_slots":["slot-id"],"reason":"string"}] }',
        "Rules:",
        "- Include each objective_id exactly once.",
        "- Status must be one of covered|partial|blocked.",
        "- missing_slots must use only slot ids from that objective context when possible.",
        "- If status=covered, missing_slots must be empty.",
        "- Keep reason brief.",
        "responseLanguage=en",
        "",
        "Question: Where is the evidence?",
        "",
        "Objective checkpoints:",
        "1. objective_id=obj_1",
        "label=Evidence Coverage",
        "current_status=covered",
        "matched_slots=doc-evidence, numeric-result",
        "missing_slots=none",
        "evidence_refs=docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        "summary=Evidence Coverage: covered.",
      ].join("\n"),
    );
  });
});
