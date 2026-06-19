import { existsSync } from "node:fs";
import { isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildAtlasBoundQeiWorldlineDossier,
} from "./build-atlas-bound-qei-worldline-dossier";
import { buildQeiBoundReceipt } from "./build-qei-bound-receipt";
import {
  buildQeiPointwiseTransitionSourceSamples,
} from "./build-qei-pointwise-transition-source-samples";
import { buildQeiWorldlineSamplePlan } from "./build-qei-worldline-sample-plan";
import { buildQeiWorldlineSamplingReceipt } from "./build-qei-worldline-sampling-receipt";
import { buildRegionalSourceTransitionKernel } from "./build-regional-source-transition-kernel";
import type { Nhm2QeiWorldlineDossierV1 } from "../../shared/contracts/nhm2-qei-worldline-dossier.v1";

const DEFAULT_BOUND_SI = 0;
const DEFAULT_TAU_SECONDS = 1e-10;
const DEFAULT_DUTY_CYCLE = 0.5;
const DEFAULT_LIGHT_CROSSING_SECONDS = 1e-6;
const DEFAULT_MODULATION_SECONDS = 1e-6;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const requireExisting = (repoRoot: string, path: string, label: string): void => {
  if (!existsSync(resolvePath(repoRoot, path))) {
    throw new Error(`${label} not found: ${path}`);
  }
};

export const runNhm2CandidateQeiWorldlineDossier = (args: {
  repoRoot: string;
  runRoot: string;
  regionalSupportAtlasPath?: string | null;
  sourceFullTensorPath?: string | null;
  transitionKernelPath?: string | null;
  qeiWorldlineSamplePlanPath?: string | null;
  qeiPointwiseTransitionSourceSamplesPath?: string | null;
  qeiWorldlineSamplingReceiptPath?: string | null;
  qeiBoundReceiptPath?: string | null;
  outPath?: string | null;
  boundSI?: number | null;
  tauSeconds?: number | null;
  dutyCycle?: number | null;
  lightCrossingSeconds?: number | null;
  modulationSeconds?: number | null;
  auditOnly?: boolean;
}): Nhm2QeiWorldlineDossierV1 => {
  const runRoot = args.runRoot.replace(/\\/g, "/").replace(/\/+$/, "");
  const regionalSupportAtlasPath =
    args.regionalSupportAtlasPath ??
    `${runRoot}/nhm2-regional-support-function-atlas.json`;
  const sourceFullTensorPath =
    args.sourceFullTensorPath ??
    `${runRoot}/nhm2-candidate-tile-effective-full-tensor-source.json`;
  const transitionKernelPath =
    args.transitionKernelPath ??
    `${runRoot}/nhm2-regional-source-transition-kernel.json`;
  const qeiWorldlineSamplePlanPath =
    args.qeiWorldlineSamplePlanPath ??
    `${runRoot}/nhm2-qei-worldline-sample-plan.json`;
  const qeiPointwiseTransitionSourceSamplesPath =
    args.qeiPointwiseTransitionSourceSamplesPath ??
    `${runRoot}/nhm2-qei-pointwise-transition-source-samples.json`;
  const qeiWorldlineSamplingReceiptPath =
    args.qeiWorldlineSamplingReceiptPath ??
    `${runRoot}/nhm2-qei-worldline-sampling-receipt.json`;
  const qeiBoundReceiptPath =
    args.qeiBoundReceiptPath ?? `${runRoot}/nhm2-qei-bound-receipt.json`;
  const outPath = args.outPath ?? `${runRoot}/nhm2-qei-worldline-dossier.json`;

  if (
    !args.auditOnly &&
    [
      regionalSupportAtlasPath,
      sourceFullTensorPath,
      transitionKernelPath,
      qeiWorldlineSamplePlanPath,
      qeiPointwiseTransitionSourceSamplesPath,
      qeiWorldlineSamplingReceiptPath,
      qeiBoundReceiptPath,
      outPath,
    ].some(pathUsesLatestAlias)
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }

  requireExisting(args.repoRoot, regionalSupportAtlasPath, "regional support atlas");
  requireExisting(args.repoRoot, sourceFullTensorPath, "source full tensor");

  buildRegionalSourceTransitionKernel({
    repoRoot: args.repoRoot,
    tileFullTensorSourcePath: sourceFullTensorPath,
    regionalSupportAtlasPath,
    outPath: transitionKernelPath,
    auditOnly: args.auditOnly,
  });
  buildQeiWorldlineSamplePlan({
    repoRoot: args.repoRoot,
    regionalSupportAtlasPath,
    sourceFullTensorPath,
    transitionKernelPath,
    outPath: qeiWorldlineSamplePlanPath,
    auditOnly: args.auditOnly,
  });
  buildQeiPointwiseTransitionSourceSamples({
    repoRoot: args.repoRoot,
    qeiWorldlineSamplePlanPath,
    sourceFullTensorPath,
    transitionKernelPath,
    outPath: qeiPointwiseTransitionSourceSamplesPath,
    auditOnly: args.auditOnly,
  });
  buildQeiWorldlineSamplingReceipt({
    repoRoot: args.repoRoot,
    regionalSupportAtlasPath,
    sourceFullTensorPath,
    qeiWorldlineSamplePlanPath,
    explicitWorldlineSamplesPath: qeiPointwiseTransitionSourceSamplesPath,
    outPath: qeiWorldlineSamplingReceiptPath,
    auditOnly: args.auditOnly,
  });
  buildQeiBoundReceipt({
    repoRoot: args.repoRoot,
    regionalSupportAtlasPath,
    sourceFullTensorPath,
    outPath: qeiBoundReceiptPath,
    boundModelKind: "ford_roman_lorentzian",
    boundSI: args.boundSI ?? DEFAULT_BOUND_SI,
    boundProvenanceRef: "ford_roman_1996_quantum_inequality",
    tauSeconds: args.tauSeconds ?? DEFAULT_TAU_SECONDS,
    tauSourceRef: "candidate-qei-policy.json#tauSeconds",
    samplingKind: "lorentzian",
    samplingNormalized: true,
    dutyCycle: args.dutyCycle ?? DEFAULT_DUTY_CYCLE,
    dutyCycleSourceRef: "candidate-qei-policy.json#dutyCycle",
    lightCrossingSeconds:
      args.lightCrossingSeconds ?? DEFAULT_LIGHT_CROSSING_SECONDS,
    lightCrossingSourceRef: "candidate-qei-policy.json#lightCrossingSeconds",
    modulationSeconds: args.modulationSeconds ?? DEFAULT_MODULATION_SECONDS,
    modulationSourceRef: "candidate-qei-policy.json#modulationSeconds",
    qftStateRef: "candidate-qei-policy.json#declaredQftState",
    renormalizationConventionRef:
      "candidate-qei-policy.json#renormalizedStressEnergyConvention",
    stationaryWorldlineAssumption: true,
    appliesToRegions: ["wall", "hull_wall_transition", "wall_exterior_transition"],
    auditOnly: args.auditOnly,
  });

  return buildAtlasBoundQeiWorldlineDossier({
    repoRoot: args.repoRoot,
    regionalSupportAtlasPath,
    sourceFullTensorPath,
    qeiBoundReceiptPath,
    qeiWorldlineSamplingReceiptPath,
    outPath,
    auditOnly: args.auditOnly,
  });
};

const main = (): void => {
  const raw = parseArgs(process.argv.slice(2));
  const runRoot = asString(raw["run-root"]);
  if (runRoot == null) {
    throw new Error("--run-root is required");
  }
  const artifact = runNhm2CandidateQeiWorldlineDossier({
    repoRoot: process.cwd(),
    runRoot,
    regionalSupportAtlasPath: asString(raw["regional-support-atlas"]),
    sourceFullTensorPath: asString(raw["source-full-tensor"]),
    transitionKernelPath: asString(raw["transition-kernel"]),
    qeiWorldlineSamplePlanPath: asString(raw["qei-worldline-sample-plan"]),
    qeiPointwiseTransitionSourceSamplesPath: asString(
      raw["qei-pointwise-transition-source-samples"],
    ),
    qeiWorldlineSamplingReceiptPath: asString(raw["qei-worldline-sampling-receipt"]),
    qeiBoundReceiptPath: asString(raw["qei-bound-receipt"]),
    outPath: asString(raw.out),
    boundSI: asNumber(raw["bound-si"]),
    tauSeconds: asNumber(raw["tau-seconds"]),
    dutyCycle: asNumber(raw["duty-cycle"]),
    lightCrossingSeconds: asNumber(raw["light-crossing-seconds"]),
    modulationSeconds: asNumber(raw["modulation-seconds"]),
    auditOnly: raw["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
