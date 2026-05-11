import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  erEprStage1BatchReportSchema,
  runErEprStage1Plan,
  type ErEprStage1RunPlan,
} from "../shared/er-epr-stage1-runner";
import { validateErEprSafeLanguage } from "../shared/er-epr-safe-language";

const planPath = path.resolve(process.cwd(), "tests/fixtures/er-epr-stage1/plan.fixture.json");
const reportPath = path.resolve(process.cwd(), "reports/er-epr-stage1-report.json");
const markdownPath = path.resolve(process.cwd(), "reports/er-epr-stage1-report.md");

function loadPlan(): ErEprStage1RunPlan {
  return JSON.parse(fs.readFileSync(planPath, "utf8")) as ErEprStage1RunPlan;
}

describe("ER=EPR Stage 1 report artifacts", () => {
  it("accepts fixture-only batch reports and rejects missing claim metadata", () => {
    const report = runErEprStage1Plan(loadPlan());

    expect(erEprStage1BatchReportSchema.parse(report).reproducibilityStatus).toBe("fixture_only");
    expect(erEprStage1BatchReportSchema.safeParse({ ...report, claimIds: [] }).success).toBe(false);
    expect(erEprStage1BatchReportSchema.safeParse({ ...report, citations: [] }).success).toBe(false);
  });

  it("CLI writes deterministic JSON and Markdown reports", () => {
    execFileSync(process.execPath, [
      path.resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs"),
      "tools/erEprStage1Run.ts",
      "--plan",
      planPath,
      "--out",
      reportPath,
    ], {
      cwd: process.cwd(),
      stdio: "pipe",
    });

    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    const markdown = fs.readFileSync(markdownPath, "utf8");

    expect(report.strongestVerdict).toBe("dual_model_support_strong");
    expect(report.reproducibilityStatus).toBe("fixture_only");
    expect(markdown).toContain("ER=EPR Stage 1 Report");
    expect(validateErEprSafeLanguage(markdown).ok).toBe(true);
  });
});
