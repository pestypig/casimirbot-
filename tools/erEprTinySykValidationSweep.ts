import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  runTinySykValidationSweep,
  tinySykValidationSweepPlanSchema,
} from "../shared/er-epr-tiny-syk-validation-sweep";
import {
  tinySykValidationSweepReportSchema,
} from "../shared/er-epr-tiny-syk-validation-artifact";
import { renderTinySykValidationMarkdown } from "../shared/er-epr-tiny-syk-validation-safe-language";

type CliArgs = { plan?: string; out?: string };

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--plan") args.plan = argv[++index];
    if (argv[index] === "--out") args.out = argv[++index];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.plan || !args.out) {
    throw new Error("Usage: npm run er-epr:tiny-syk:validate -- --plan <plan.json> --out <report.json>");
  }
  const plan = tinySykValidationSweepPlanSchema.parse(JSON.parse(readFileSync(resolve(args.plan), "utf8")));
  const report = tinySykValidationSweepReportSchema.parse(runTinySykValidationSweep(plan));
  const outPath = resolve(args.out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(outPath.replace(/\.json$/i, ".md"), renderTinySykValidationMarkdown(report));
  writeFileSync(outPath.replace(/\.json$/i, "-per-seed.json"), `${JSON.stringify(report.perSeedSummaries, null, 2)}\n`);
}

main();
