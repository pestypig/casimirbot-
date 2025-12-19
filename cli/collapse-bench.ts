#!/usr/bin/env -S tsx

import fs from "node:fs/promises";
import path from "node:path";
import { loadCollapseBenchmarkManifest, runCollapseBenchmarkManifest } from "../tools/collapse-benchmark-runner";

type CliArgs = {
  manifest?: string;
  out?: string;
  csv?: string;
};

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: CliArgs = {};
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if ((token === "-m" || token === "--manifest") && args[i + 1]) {
      parsed.manifest = args[i + 1];
      i += 1;
    } else if (token === "-o" || token === "--out") {
      parsed.out = args[i + 1];
      i += 1;
    } else if (token === "--csv") {
      parsed.csv = args[i + 1];
      i += 1;
    }
  }
  return parsed;
}

function toCsv(report: ReturnType<typeof runCollapseBenchmarkManifest>): string {
  const header = ["id", "p_trigger", "trigger_rate", "tau_ms", "r_c_m", "inputs_hash", "features_hash", "run_hash"];
  const rows = report.runs.map((run) => [
    run.id,
    run.result.p_trigger.toFixed(12),
    run.result.trigger_rate.toFixed(12),
    run.result.tau_ms.toFixed(6),
    run.result.r_c_m.toFixed(6),
    run.result.inputs_hash,
    run.result.features_hash,
    run.run_hash,
  ]);
  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

async function main() {
  const args = parseArgs();
  const manifestPath = path.resolve(args.manifest ?? "datasets/benchmarks/collapse-benchmark.fixture.json");
  const manifest = await loadCollapseBenchmarkManifest(manifestPath);

  const report = runCollapseBenchmarkManifest(manifest, { manifest_path: manifestPath });

  if (args.out) {
    const outPath = path.resolve(args.out);
    await fs.writeFile(outPath, JSON.stringify(report, null, 2));
    console.error(`wrote report to ${outPath}`);
  }

  if (args.csv) {
    const csvPath = path.resolve(args.csv);
    await fs.writeFile(csvPath, toCsv(report));
    console.error(`wrote csv to ${csvPath}`);
  }

  // Always emit JSON to stdout so CI can capture a golden.
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
