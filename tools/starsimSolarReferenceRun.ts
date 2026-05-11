import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import {
  runStarSimSolarReferenceRun,
  starSimSolarReferenceRunPlanSchema,
} from "../shared/starsim-solar-reference-run";
import { renderStarSimSolarReferenceRun } from "../shared/starsim-solar-reference-safe-language";

const args = parseArgs({
  options: {
    plan: { type: "string" },
    out: { type: "string" },
  },
});

const planPath = args.values.plan;
const outPath = args.values.out;

if (!planPath || !outPath) {
  throw new Error(
    "Usage: npm run starsim:solar:reference -- --plan <plan.json> --out <report.json>",
  );
}

const plan = starSimSolarReferenceRunPlanSchema.parse(
  JSON.parse(readFileSync(planPath, "utf8")),
);
const artifact = runStarSimSolarReferenceRun({ plan, outPath });
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(artifact, null, 2));
writeFileSync(outPath.replace(/\.json$/i, ".md"), renderStarSimSolarReferenceRun(artifact));
console.log(`StarSim solar reference report written to ${outPath}`);
