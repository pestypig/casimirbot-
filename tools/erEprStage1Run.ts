import fs from "node:fs/promises";
import path from "node:path";

import {
  erEprStage1RunPlanSchema,
  runErEprStage1Plan,
  summarizeErEprStage1Batch,
} from "../shared/er-epr-stage1-runner";
import {
  renderErEprStage1Claim,
  validateErEprSafeLanguage,
} from "../shared/er-epr-safe-language";

type CliArgs = {
  plan?: string;
  out?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--plan") args.plan = argv[index + 1];
    if (arg === "--out") args.out = argv[index + 1];
  }
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.plan || !args.out) {
    throw new Error("Usage: npm run er-epr:stage1 -- --plan <plan.json> --out <report.json>");
  }

  const planPath = path.resolve(args.plan);
  const outPath = path.resolve(args.out);
  const planRaw = JSON.parse(await fs.readFile(planPath, "utf8"));
  const plan = erEprStage1RunPlanSchema.parse(planRaw);
  const report = runErEprStage1Plan(plan);
  const markdown = [
    summarizeErEprStage1Batch(report),
    "",
    "## Claim Language",
    renderErEprStage1Claim(report),
    "",
  ].join("\n");
  const safeLanguage = validateErEprSafeLanguage(markdown);
  if (!safeLanguage.ok) {
    throw new Error(`Rendered ER=EPR report contains forbidden phrases: ${safeLanguage.forbiddenPhrases.join(", ")}`);
  }

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  const markdownPath = outPath.replace(/\.json$/i, ".md");
  await fs.writeFile(markdownPath, markdown, "utf8");
  console.log(JSON.stringify({
    report: outPath,
    markdown: markdownPath,
    strongestVerdict: report.strongestVerdict,
    reproducibilityStatus: report.reproducibilityStatus,
    claimIds: report.claimIds,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
