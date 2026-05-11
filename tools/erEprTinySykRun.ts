import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { tinySykPlanSchema, runTinySykSolver, tinySykEvidence } from "../shared/er-epr-tiny-syk";
import { buildTinySykControlPlans } from "../shared/er-epr-tiny-syk-controls";
import { tinySykSolverArtifactSchema, type TinySykSolverArtifact } from "../shared/er-epr-tiny-syk-artifact";
import { renderTinySykReportMarkdown } from "../shared/er-epr-tiny-syk-safe-language";

type CliArgs = {
  plan?: string;
  out?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--plan") args.plan = argv[++index];
    if (arg === "--out") args.out = argv[++index];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.plan || !args.out) {
    throw new Error("Usage: npm run er-epr:tiny-syk -- --plan <plan.json> --out <report.json>");
  }
  const planPath = resolve(args.plan);
  const outPath = resolve(args.out);
  const plan = tinySykPlanSchema.parse(JSON.parse(readFileSync(planPath, "utf8")));
  const run = runTinySykSolver(plan);
  const controls = buildTinySykControlPlans(plan);
  if (controls.length < 2) {
    throw new Error("Tiny SYK report requires declared controls");
  }
  const baseOut = outPath.replace(/\.json$/i, "");
  const rawPath = `${baseOut}-raw-telemetry.json`;
  const normalizedPath = `${baseOut}-normalized-observables.json`;
  const evaluationPath = `${baseOut}-stage1-evaluation.json`;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(rawPath, `${JSON.stringify(run.rawTelemetry, null, 2)}\n`);
  writeFileSync(normalizedPath, `${JSON.stringify(run.adapterResult.normalizedInput.observables, null, 2)}\n`);
  writeFileSync(evaluationPath, `${JSON.stringify(run.adapterResult.evaluation, null, 2)}\n`);
  const evidence = tinySykEvidence();
  const artifact: TinySykSolverArtifact = {
    schemaVersion: "er-epr-tiny-syk-artifact.v1",
    runId: `tiny-syk-artifact:${randomUUID()}`,
    planId: plan.planId,
    createdAt: new Date().toISOString(),
    backend: "two_sided_syk_tiny_exact_diag",
    numerical: run.numerical,
    hashes: run.hashes,
    outputs: {
      rawTelemetryRef: rawPath,
      normalizedObservablesRef: normalizedPath,
      erEprEvaluationRef: evaluationPath,
    },
    verdict: {
      solverVerdict: verdictFor(run.adapterResult.evaluation.evidence.verdict),
    },
    evidence: {
      stage: "ER_EPR_TINY_SYK_EXACT_DIAG_V1",
      claimTier: "Stage1_model_internal_toy_solver",
      claimIds: evidence.claimIds,
      citations: evidence.citations,
      sourceRoles: evidence.sourceRoles as TinySykSolverArtifact["evidence"]["sourceRoles"],
      uncertaintyNotes: evidence.uncertaintyNotes,
    },
    qstBoundary: {
      spacetimeCL: "proxy_only",
      mayPromoteToCL4: false,
      caveats: [
        "Tiny SYK-like output remains model-internal.",
        "QST annotations are proxy-only and cannot promote to CL0-CL4.",
        "No NHM2 source-closure or propulsion claim is supported.",
      ],
    },
  };
  const parsed = tinySykSolverArtifactSchema.parse(artifact);
  writeFileSync(outPath, `${JSON.stringify(parsed, null, 2)}\n`);
  writeFileSync(outPath.replace(/\.json$/i, ".md"), renderTinySykReportMarkdown(parsed));
}

function verdictFor(stage1Verdict: string): TinySykSolverArtifact["verdict"]["solverVerdict"] {
  if (stage1Verdict === "dual_model_support_strong" || stage1Verdict === "model_internal_er_epr_support") {
    return "solver_simulated_model_internal_support";
  }
  if (stage1Verdict === "overclaim_blocked") return "overclaim_blocked";
  return "solver_simulated_controls_failed";
}

main();
