import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  runStarSimFusionBenchmarkPlan,
  type StarSimFusionBenchmarkPlan,
} from "../shared/starsim-fusion-benchmark-runner";
import { renderStarSimFusionBenchmarkReport } from "../shared/starsim-fusion-benchmark-safe-language";

function arg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const planPath = arg("--plan");
const outPath = arg("--out") ?? "reports/starsim-fusion-benchmark-report.json";
if (!planPath) {
  throw new Error("Usage: npm run starsim:fusion:benchmark -- --plan <plan.json> --out <report.json>");
}

const plan = JSON.parse(readFileSync(planPath, "utf8")) as StarSimFusionBenchmarkPlan;
const report = runStarSimFusionBenchmarkPlan(plan);
const markdown = renderStarSimFusionBenchmarkReport(report);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(outPath.replace(/\.json$/i, ".md"), `${markdown}\n`);
console.log(`StarSim fusion benchmark report written to ${outPath}`);
