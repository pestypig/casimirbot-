import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2AveragedSourceTensorReceipt,
  isNhm2AveragedSourceTensorReceipt,
  parseNhm2AveragedSourceReceiptInputs,
  type Nhm2AveragedSourceTensorReceiptV1,
} from "../../shared/contracts/nhm2-averaged-source-tensor-receipt.v1";

const parseArgs = (argv: string[]): Record<string, string | boolean> => {
  const parsed: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (next == null || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
};

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (repoRoot: string, path: string | null): unknown => {
  if (path == null) return null;
  const resolved = resolvePath(repoRoot, path);
  if (!existsSync(resolved)) {
    throw new Error(`artifact missing: ${path}`);
  }
  return JSON.parse(readFileSync(resolved, "utf8")) as unknown;
};

export const runNhm2AveragedSourceTensorReceipt = (args: {
  repoRoot: string;
  outPath: string;
  laneId?: string | null;
  selectedProfileId?: string | null;
  runId?: string | null;
  chartId?: string | null;
  atlasRef?: string | null;
  atlasHash?: string | null;
  sourceTensorPath?: string | null;
  frequencyConvergencePath?: string | null;
  switchingConservationPath?: string | null;
  averagingWindowSeconds?: number | null;
  cycleAverageSourceFixed?: boolean | null;
}): Nhm2AveragedSourceTensorReceiptV1 => {
  const parsed = parseNhm2AveragedSourceReceiptInputs(
    readJson(args.repoRoot, args.sourceTensorPath ?? null),
    readJson(args.repoRoot, args.frequencyConvergencePath ?? null),
    readJson(args.repoRoot, args.switchingConservationPath ?? null),
  );
  const artifact = buildNhm2AveragedSourceTensorReceipt({
    laneId: args.laneId ?? null,
    selectedProfileId: args.selectedProfileId ?? null,
    runId: args.runId ?? null,
    chartId: args.chartId ?? null,
    atlasRef: args.atlasRef ?? null,
    atlasHash: args.atlasHash ?? null,
    sourceTensorRef: args.sourceTensorPath ?? null,
    sourceTensor: parsed.sourceTensor,
    frequencyConvergenceRef: args.frequencyConvergencePath ?? null,
    frequencyConvergence: parsed.frequencyConvergence,
    switchingConservationRef: args.switchingConservationPath ?? null,
    switchingConservation: parsed.switchingConservation,
    averagingWindowSeconds: args.averagingWindowSeconds ?? null,
    cycleAverageSourceFixed: args.cycleAverageSourceFixed ?? null,
  });
  if (!isNhm2AveragedSourceTensorReceipt(artifact)) {
    throw new Error("built artifact failed nhm2_averaged_source_tensor_receipt/v1 validation");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  const args = parseArgs(process.argv.slice(2));
  const outPath = asString(args.out);
  if (outPath == null) {
    throw new Error("missing required --out");
  }
  const artifact = runNhm2AveragedSourceTensorReceipt({
    repoRoot: process.cwd(),
    outPath,
    laneId: asString(args["lane-id"]),
    selectedProfileId: asString(args["selected-profile-id"]),
    runId: asString(args["run-id"]),
    chartId: asString(args["chart-id"]),
    atlasRef: asString(args["atlas-ref"]),
    atlasHash: asString(args["atlas-hash"]),
    sourceTensorPath: asString(args["source-tensor"]),
    frequencyConvergencePath: asString(args["frequency-convergence"]),
    switchingConservationPath: asString(args["switching-conservation"]),
    averagingWindowSeconds: asNumber(args["averaging-window-seconds"]),
    cycleAverageSourceFixed: asBoolean(args["cycle-average-source-fixed"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
}
