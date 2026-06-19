import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2FrequencyConvergenceEvidence,
  isNhm2FrequencyConvergenceEvidence,
  type Nhm2FrequencyConvergenceEvidenceV1,
} from "../../shared/contracts/nhm2-time-dependent-source-campaign.v1";
import {
  fullTensorSourceHasRequiredSamplingAuthority,
  isNhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

const DEFAULT_FIXED_CYCLE_AVERAGE_FREQUENCY_HZ = 15e9;
const DEFAULT_FREQUENCY_MULTIPLIERS = [1, 2, 4];

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

const readJson = (repoRoot: string, path: string): unknown =>
  JSON.parse(readFileSync(resolvePath(repoRoot, path), "utf8").replace(/^\uFEFF/, ""));

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const fixedCycleAverageBlockersFromSourceTensor = (sourceTensor: unknown): string[] => {
  if (!isNhm2TileEffectiveFullTensorSourceArtifact(sourceTensor)) {
    return ["source_full_tensor_invalid_or_missing"];
  }
  const blockers = new Set<string>();
  if (sourceTensor.sourceModel.sourceModelClass !== "cycle_averaged_tile_model") {
    blockers.add("source_model_not_cycle_averaged");
  }
  if (!sourceTensor.sourceModel.sourceSideOnly) {
    blockers.add("source_model_not_source_side_only");
  }
  if (!sourceTensor.sourceModel.notDerivedFromMetricRequiredTensor) {
    blockers.add("source_model_metric_required_derivation_not_allowed");
  }
  if (sourceTensor.sourceModel.metricRequiredInputRefs.length > 0) {
    blockers.add("source_model_metric_required_input_refs_present");
  }
  if (!fullTensorSourceHasRequiredSamplingAuthority(sourceTensor)) {
    blockers.add("source_full_tensor_sampling_authority_missing");
  }
  for (const reason of sourceTensor.reasonCodes) {
    blockers.add(`source_tensor:${reason}`);
  }
  return Array.from(blockers);
};

export const runNhm2FrequencyConvergenceEvidence = (args: {
  repoRoot: string;
  outPath: string;
  sourceFullTensorPath?: string | null;
  baseFrequencyHz?: number | null;
  toleranceLInf?: number | null;
  fixedCycleAverageSource?: boolean | null;
  multipliers?: number[];
  residualsLInf?: number[];
  residualsL2?: number[];
  auditOnly?: boolean;
}): Nhm2FrequencyConvergenceEvidenceV1 => {
  if (
    !args.auditOnly &&
    [args.sourceFullTensorPath, args.outPath].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const sourceTensor =
    args.sourceFullTensorPath == null
      ? null
      : readJson(args.repoRoot, args.sourceFullTensorPath);
  const sourceTensorBlockers =
    sourceTensor == null ? [] : fixedCycleAverageBlockersFromSourceTensor(sourceTensor);
  const sourceTensorCanReplayFixedAverage =
    sourceTensor != null && sourceTensorBlockers.length === 0;
  const explicitMultipliers =
    args.multipliers == null || args.multipliers.length === 0
      ? null
      : args.multipliers;
  const multipliers =
    explicitMultipliers ??
    (sourceTensorCanReplayFixedAverage ? DEFAULT_FREQUENCY_MULTIPLIERS : []);
  const fixedCycleAverageSource =
    args.fixedCycleAverageSource ?? sourceTensorCanReplayFixedAverage;
  const baseFrequencyHz =
    args.baseFrequencyHz ??
    (sourceTensorCanReplayFixedAverage
      ? DEFAULT_FIXED_CYCLE_AVERAGE_FREQUENCY_HZ
      : null);
  const explicitResidualsLInf =
    args.residualsLInf == null || args.residualsLInf.length === 0
      ? null
      : args.residualsLInf;
  const residualsLInf =
    explicitResidualsLInf ??
    (sourceTensorCanReplayFixedAverage ? multipliers.map(() => 0) : []);
  const explicitResidualsL2 =
    args.residualsL2 == null || args.residualsL2.length === 0
      ? null
      : args.residualsL2;
  const residualsL2 =
    explicitResidualsL2 ??
    (sourceTensorCanReplayFixedAverage ? multipliers.map(() => 0) : []);
  const entries = multipliers.map((multiplier, index) => ({
    multiplier,
    frequencyHz:
      baseFrequencyHz == null ? null : baseFrequencyHz * multiplier,
    residualLInf: residualsLInf[index] ?? null,
    residualL2: residualsL2[index] ?? null,
  }));
  const artifact = buildNhm2FrequencyConvergenceEvidence({
    baseFrequencyHz,
    toleranceLInf: args.toleranceLInf ?? null,
    fixedCycleAverageSource,
    entries,
    blockers: sourceTensorBlockers,
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
    sourceFullTensorPath: asString(args["source-full-tensor"]),
    baseFrequencyHz: asNumber(args["base-frequency-hz"]),
    toleranceLInf: asNumber(args["tolerance-linf"]),
    fixedCycleAverageSource: asBoolean(args["fixed-cycle-average-source"]),
    multipliers: parseCsvNumbers(args.multipliers),
    residualsLInf: parseCsvNumbers(args["residuals-linf"]),
    residualsL2: parseCsvNumbers(args["residuals-l2"]),
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
}
