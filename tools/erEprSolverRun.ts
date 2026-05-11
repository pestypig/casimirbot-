import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import {
  runErEprSolverAdapter,
  erEprSolverAdapterRequestSchema,
} from "../shared/er-epr-solver-adapter";
import { erEprSolverAdapterArtifactSchema } from "../shared/er-epr-solver-artifact";
import { renderErEprSolverAdapterReport } from "../shared/er-epr-solver-safe-language";

const args = parseArgs({
  options: {
    request: { type: "string" },
    out: { type: "string" },
  },
});

const requestPath = args.values.request;
const outPath = args.values.out;

if (!requestPath || !outPath) {
  throw new Error("Usage: npm run er-epr:solver -- --request <request.json> --out <report.json>");
}

const request = erEprSolverAdapterRequestSchema.parse(
  JSON.parse(readFileSync(requestPath, "utf8")),
);
const result = runErEprSolverAdapter(request);
erEprSolverAdapterArtifactSchema.parse(result);
const markdown = renderErEprSolverAdapterReport(result);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(result, null, 2));
writeFileSync(outPath.replace(/\.json$/i, ".md"), markdown);
console.log(`ER=EPR solver adapter report written to ${outPath}`);
