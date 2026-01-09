#!/usr/bin/env -S tsx
import fs from "node:fs/promises";
import path from "node:path";
import { loadTokamakPrecursorDataset, runTokamakPrecursorDataset } from "../tools/tokamak-precursor-runner";
import { TokamakPrecursorScoreKey } from "@shared/tokamak-precursor";

type CliArgs = {
  dataset?: string;
  out?: string;
  score?: string;
};

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: CliArgs = {};
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if ((token === "-d" || token === "--dataset") && args[i + 1]) {
      parsed.dataset = args[i + 1];
      i += 1;
    } else if ((token === "-o" || token === "--out") && args[i + 1]) {
      parsed.out = args[i + 1];
      i += 1;
    } else if (token === "--score" && args[i + 1]) {
      parsed.score = args[i + 1];
      i += 1;
    }
  }
  return parsed;
}

async function main() {
  const args = parseArgs();
  const datasetPath = path.resolve(args.dataset ?? "datasets/tokamak-rz-precursor.fixture.json");
  const dataset = await loadTokamakPrecursorDataset(datasetPath);
  const scoreKey = args.score ? TokamakPrecursorScoreKey.parse(args.score) : undefined;
  const report = runTokamakPrecursorDataset(dataset, {
    dataset_path: datasetPath,
    score_key: scoreKey,
  });

  if (args.out) {
    const outPath = path.resolve(args.out);
    await fs.writeFile(outPath, JSON.stringify(report, null, 2));
    console.error(`wrote report to ${outPath}`);
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
