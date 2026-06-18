import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2FrequencyConvergenceEvidence,
  isNhm2FrequencyConvergenceEvidence,
  type Nhm2FrequencyConvergenceEvidenceV1,
} from "../../shared/contracts/nhm2-time-dependent-source-campaign.v1";

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

const parseCsvNumbers = (value: unknown): number[] => {
  const text = asString(value);
  if (text == null) return [];
  return text
    .split(",")
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry));
};

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

export const runNhm2FrequencyConvergenceEvidence = (args: {
  repoRoot: string;
  outPath: string;
  baseFrequencyHz?: number | null;
  toleranceLInf?: number | null;
  fixedCycleAverageSource?: boolean | null;
  multipliers?: number[];
  residualsLInf?: number[];
  residualsL2?: number[];
}): Nhm2FrequencyConvergenceEvidenceV1 => {
  const multipliers = args.multipliers ?? [];
  const entries = multipliers.map((multiplier, index) => ({
    multiplier,
    frequencyHz:
      args.baseFrequencyHz == null ? null : args.baseFrequencyHz * multiplier,
    residualLInf: args.residualsLInf?.[index] ?? null,
    residualL2: args.residualsL2?.[index] ?? null,
  }));
  const artifact = buildNhm2FrequencyConvergenceEvidence({
    baseFrequencyHz: args.baseFrequencyHz ?? null,
    toleranceLInf: args.toleranceLInf ?? null,
    fixedCycleAverageSource: args.fixedCycleAverageSource ?? null,
    entries,
  });
  if (!isNhm2FrequencyConvergenceEvidence(artifact)) {
    throw new Error(
      "built artifact failed nhm2_frequency_convergence_evidence/v1 validation",
    );
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
  const artifact = runNhm2FrequencyConvergenceEvidence({
    repoRoot: process.cwd(),
    outPath,
    baseFrequencyHz: asNumber(args["base-frequency-hz"]),
    toleranceLInf: asNumber(args["tolerance-linf"]),
    fixedCycleAverageSource: asBoolean(args["fixed-cycle-average-source"]),
    multipliers: parseCsvNumbers(args.multipliers),
    residualsLInf: parseCsvNumbers(args["residuals-linf"]),
    residualsL2: parseCsvNumbers(args["residuals-l2"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
}
