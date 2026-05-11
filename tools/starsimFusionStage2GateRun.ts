import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { runStarSimFusionStage2Gate } from "../shared/starsim-fusion-stage2-gate";
import { parseStarSimFusionExternalReproManifest } from "../shared/starsim-fusion-external-repro";
import { parseStarSimSolarFusionAnchor } from "../shared/starsim-fusion-solar-anchor";
import { starSimFusionNeutrinoClosureSchema } from "../shared/starsim-fusion-neutrino-closure";
import { starSimFusionAsteroseismicClosureSchema } from "../shared/starsim-fusion-asteroseismic-closure";
import { starSimFusionBenchmarkReportSchema } from "../shared/starsim-fusion-benchmark-runner";
import type { StarSimFusionBenchmarkReport } from "../shared/starsim-fusion-benchmark-runner";
import { renderStarSimFusionStage2GateReport } from "../shared/starsim-fusion-stage2-gate-safe-language";

const manifestFileSchema = z.object({
  externalReproManifest: z.unknown(),
  solarAnchor: z.unknown().optional(),
  neutrinoClosure: z.unknown().optional(),
  asteroseismicClosure: z.unknown().optional(),
});

const args = parseArgs({
  options: {
    manifest: { type: "string" },
    benchmark: { type: "string" },
    out: { type: "string" },
  },
});

const manifestPath = args.values.manifest;
const benchmarkPath = args.values.benchmark;
const outPath = args.values.out;

if (!manifestPath || !benchmarkPath || !outPath) {
  throw new Error(
    "Usage: npm run starsim:fusion:stage2-gate -- --manifest <fixture.json> --benchmark <benchmark-report.json> --out <report.json>",
  );
}

const rawManifest = manifestFileSchema.parse(
  JSON.parse(readFileSync(manifestPath, "utf8")),
);
const benchmarkReport = starSimFusionBenchmarkReportSchema.parse(
  JSON.parse(readFileSync(benchmarkPath, "utf8")),
) as StarSimFusionBenchmarkReport;
const gate = runStarSimFusionStage2Gate({
  externalReproManifest: parseStarSimFusionExternalReproManifest(
    rawManifest.externalReproManifest,
  ),
  benchmarkReport,
  benchmarkReportRef: benchmarkPath,
  solarAnchor: rawManifest.solarAnchor
    ? parseStarSimSolarFusionAnchor(rawManifest.solarAnchor)
    : undefined,
  neutrinoClosure: rawManifest.neutrinoClosure
    ? starSimFusionNeutrinoClosureSchema.parse(rawManifest.neutrinoClosure)
    : undefined,
  asteroseismicClosure: rawManifest.asteroseismicClosure
    ? starSimFusionAsteroseismicClosureSchema.parse(rawManifest.asteroseismicClosure)
    : undefined,
});

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(gate, null, 2));
const mdPath = outPath.replace(/\.json$/i, ".md");
writeFileSync(mdPath, renderStarSimFusionStage2GateReport(gate));
console.log(`StarSim fusion Stage 2 gate report written to ${outPath}`);
