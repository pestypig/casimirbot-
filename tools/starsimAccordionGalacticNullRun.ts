import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import {
  runStarSimAccordionGalacticNullModel,
  starSimAccordionGalacticNullPlanSchema,
} from "../shared/starsim-accordion-galactic-null-model";
import { starSimGalacticDynamicsArtifactSchema } from "../shared/starsim-galactic-dynamics-artifact";
import { renderStarSimGalacticDynamicsReport } from "../shared/starsim-galactic-dynamics-safe-language";

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
    "Usage: npm run starsim:accordion:galactic-null -- --plan <plan.json> --out <report.json>",
  );
}

const plan = starSimAccordionGalacticNullPlanSchema.parse(
  JSON.parse(readFileSync(planPath, "utf8")),
);
const report = starSimGalacticDynamicsArtifactSchema.parse(
  runStarSimAccordionGalacticNullModel(plan),
);
const markdown = renderStarSimGalacticDynamicsReport(report);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(report, null, 2));
writeFileSync(outPath.replace(/\.json$/i, ".md"), markdown);
console.log(`StarSim Accordion galactic null report written to ${outPath}`);
