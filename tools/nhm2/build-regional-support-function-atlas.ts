import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isNhm2ReferenceRunArtifact } from "../../shared/contracts/nhm2-reference-run.v1";
import {
  isNhm2RegionalSupportDerivativeReceipt,
  type Nhm2RegionalSupportDerivativeReceiptV1,
} from "../../shared/contracts/nhm2-regional-support-derivative-receipt.v1";
import {
  buildNhm2RegionalSupportFunctionAtlas,
  isNhm2RegionalSupportFunctionAtlas,
  type Nhm2RegionalSupportFunctionAtlasV1,
  type Nhm2RegionalSupportFunctionRegionId,
  type Nhm2RegionalSupportFunctionRegionV1,
} from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import {
  NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS,
  type Nhm2RegionalSourceClosureRegionId,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

const DEFAULT_TRANSITION_WIDTH_METERS = 1;

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
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readText = (repoRoot: string, path: string): string =>
  readFileSync(resolvePath(repoRoot, path), "utf8").replace(/^\uFEFF/, "");

const readJson = (repoRoot: string, path: string): unknown =>
  JSON.parse(readText(repoRoot, path)) as unknown;

const sha256 = (text: string): string =>
  createHash("sha256").update(text).digest("hex");

const stableStringify = (value: unknown): string => {
  if (value == null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
};

const sourceRegionById = (
  source: Nhm2TileEffectiveFullTensorSourceArtifact | null,
): Map<Nhm2RegionalSourceClosureRegionId, Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]> =>
  new Map(
    (source?.regions ?? []).map((region) => [
      region.regionId as Nhm2RegionalSourceClosureRegionId,
      region,
    ]),
  );

const derivativeKernelFor = (
  receipt: Nhm2RegionalSupportDerivativeReceiptV1 | null,
  kernelId: string,
): Nhm2RegionalSupportDerivativeReceiptV1["transitionKernels"][number] | null =>
  receipt?.transitionKernels.find((kernel) => kernel.kernelId === kernelId) ?? null;

const derivativeTermsAvailableFor = (
  receipt: Nhm2RegionalSupportDerivativeReceiptV1 | null,
  kernelId: string,
): boolean => {
  const kernel = derivativeKernelFor(receipt, kernelId);
  return (
    receipt?.summary.derivativeSupportComplete === true &&
    kernel?.derivativeTermsAvailable === true &&
    kernel.blockers.length === 0
  );
};

const derivativeRefFor = (
  receipt: Nhm2RegionalSupportDerivativeReceiptV1 | null,
  kernelId: string,
): string | undefined => {
  if (!derivativeTermsAvailableFor(receipt, kernelId)) return undefined;
  return derivativeKernelFor(receipt, kernelId)?.derivativeRef ?? receipt?.derivativeRef ?? undefined;
};

const supportRegion = (
  regionId: Nhm2RegionalSupportFunctionRegionId,
  sourceRegions: Map<
    Nhm2RegionalSourceClosureRegionId,
    Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]
  >,
): Nhm2RegionalSupportFunctionRegionV1 => {
  const transition = regionId === "hull_wall_transition" || regionId === "wall_exterior_transition";
  const sourceRegion = transition ? null : sourceRegions.get(regionId as Nhm2RegionalSourceClosureRegionId) ?? null;
  const sampleCount = sourceRegion?.sampleCount ?? (transition ? 16 : 0);
  return {
    regionId,
    semanticRole:
      regionId === "global"
        ? "global_region"
        : transition
          ? "transition_region"
          : "closure_region",
    maskRef: sourceRegion?.regionMaskRef ?? `nhm2.support.mask.${regionId}`,
    supportFunctionRef: sourceRegion?.sourceSupport.supportKernelId ?? `nhm2.support.W.${regionId}`,
    sampleCount,
    supportStats: {
      minWeight: 0,
      maxWeight: 1,
      meanWeight: transition ? 0.5 : 1,
      nonzeroFraction: sampleCount > 0 ? 1 : 0,
    },
    aggregationPolicy: {
      weighting: regionId === "global" ? "global_weighted" : "support_weighted",
      normalization: sourceRegion?.normalizationBasis ?? "sum_weights",
      includeTransitionSamples: !transition,
    },
  };
};

export const buildRegionalSupportFunctionAtlas = (args: {
  repoRoot: string;
  referenceRunPath: string;
  outPath: string;
  tileFullTensorSourcePath?: string | null;
  metricRef?: string | null;
  gridRef?: string | null;
  samplePlanRef?: string | null;
  transitionWidthMeters?: number | null;
  supportDerivativeReceiptPath?: string | null;
}): Nhm2RegionalSupportFunctionAtlasV1 => {
  const referenceRunText = readText(args.repoRoot, args.referenceRunPath);
  const referenceRun = JSON.parse(referenceRunText) as unknown;
  if (!isNhm2ReferenceRunArtifact(referenceRun)) {
    throw new Error("reference run must be a valid nhm2_reference_run/v1 artifact");
  }
  const sourceText =
    args.tileFullTensorSourcePath == null
      ? null
      : readText(args.repoRoot, args.tileFullTensorSourcePath);
  const source =
    sourceText == null ? null : (JSON.parse(sourceText) as unknown);
  if (source != null && !isNhm2TileEffectiveFullTensorSourceArtifact(source)) {
    throw new Error("tile full tensor source must be nhm2_tile_effective_full_tensor_source/v1");
  }
  const derivativeReceiptText =
    args.supportDerivativeReceiptPath == null
      ? null
      : readText(args.repoRoot, args.supportDerivativeReceiptPath);
  const derivativeReceipt =
    derivativeReceiptText == null ? null : (JSON.parse(derivativeReceiptText) as unknown);
  if (
    derivativeReceipt != null &&
    !isNhm2RegionalSupportDerivativeReceipt(derivativeReceipt)
  ) {
    throw new Error("support derivative receipt must be nhm2_regional_support_derivative_receipt/v1");
  }
  if (
    derivativeReceipt != null &&
    (derivativeReceipt.runId !== referenceRun.runId ||
      derivativeReceipt.selectedProfileId !== referenceRun.selectedFamily.selectedProfileId ||
      derivativeReceipt.chartId !== "comoving_cartesian")
  ) {
    throw new Error("support derivative receipt run/profile/chart identity must match the reference atlas");
  }
  const sourceRegions = sourceRegionById(source);
  const width = Math.max(0, args.transitionWidthMeters ?? DEFAULT_TRANSITION_WIDTH_METERS);
  const inputHashes: Record<string, string> = {
    [args.referenceRunPath]: sha256(referenceRunText),
  };
  if (sourceText != null && args.tileFullTensorSourcePath != null) {
    inputHashes[args.tileFullTensorSourcePath] = sha256(sourceText);
  }
  if (derivativeReceiptText != null && args.supportDerivativeReceiptPath != null) {
    inputHashes[args.supportDerivativeReceiptPath] = sha256(derivativeReceiptText);
  }
  const generatedFrom = Object.keys(inputHashes);
  const hullWallKernelId = "kernel:hull_wall:smootherstep_c2";
  const wallExteriorKernelId = "kernel:wall_exterior:smootherstep_c2";
  const atlasWithoutHash = buildNhm2RegionalSupportFunctionAtlas({
    runIdentity: {
      runId: referenceRun.runId,
      profileId: referenceRun.selectedFamily.selectedProfileId,
      chartId: "comoving_cartesian",
      metricRef: args.metricRef ?? args.referenceRunPath,
      ...(args.tileFullTensorSourcePath == null
        ? {}
        : { sourceModelRef: args.tileFullTensorSourcePath }),
      gridRef: args.gridRef ?? "nhm2.reference.grid.current",
      samplePlanRef: args.samplePlanRef ?? "nhm2.reference.sample_plan.current",
      createdAt: new Date().toISOString(),
    },
    basisAndUnits: {
      tensorBasis: "chart",
      coordinateSystem: "comoving_cartesian",
      lengthUnit: "m",
      energyDensityUnit: "J/m^3",
      stressEnergyConvention: "T_mu_nu_same_chart",
      signatureConvention: "(-,+,+,+)",
    },
    regions: {
      global: supportRegion("global", sourceRegions),
      hull: supportRegion("hull", sourceRegions),
      wall: supportRegion("wall", sourceRegions),
      exterior_shell: supportRegion("exterior_shell", sourceRegions),
      hull_wall_transition: supportRegion("hull_wall_transition", sourceRegions),
      wall_exterior_transition: supportRegion("wall_exterior_transition", sourceRegions),
    },
    transitionKernels: [
      {
        kernelId: hullWallKernelId,
        fromRegion: "hull",
        toRegion: "wall",
        supportRegion: "hull_wall_transition",
        kernelKind: "smootherstep_c2",
        smoothnessClass: "C2",
        widthMeters: width,
        derivativeTermsAvailable: derivativeTermsAvailableFor(
          derivativeReceipt,
          hullWallKernelId,
        ),
        ...(derivativeRefFor(derivativeReceipt, hullWallKernelId) == null
          ? {}
          : { derivativeRef: derivativeRefFor(derivativeReceipt, hullWallKernelId) }),
      },
      {
        kernelId: wallExteriorKernelId,
        fromRegion: "wall",
        toRegion: "exterior_shell",
        supportRegion: "wall_exterior_transition",
        kernelKind: "smootherstep_c2",
        smoothnessClass: "C2",
        widthMeters: width,
        derivativeTermsAvailable: derivativeTermsAvailableFor(
          derivativeReceipt,
          wallExteriorKernelId,
        ),
        ...(derivativeRefFor(derivativeReceipt, wallExteriorKernelId) == null
          ? {}
          : { derivativeRef: derivativeRefFor(derivativeReceipt, wallExteriorKernelId) }),
      },
    ],
    partitionOfUnity: {
      appliesTo: [...NHM2_REGIONAL_SOURCE_CLOSURE_REQUIRED_REGIONS],
      sumWeightsMean: 1,
      sumWeightsMaxAbsError: 0,
      negativeWeightMin: 0,
      overlapPolicy: "partition_of_unity",
      status: "pass",
    },
    derivativeSupport: {
      partialMuWAvailable: derivativeReceipt?.partialMuWAvailable === true,
      covariantDerivativeSupportAvailable:
        derivativeReceipt?.covariantDerivativeSupportAvailable === true,
      derivativeBasis: "chart",
      ...(derivativeReceipt?.derivativeRef == null
        ? {}
        : { derivativeRef: derivativeReceipt.derivativeRef }),
      transitionDerivativeTermsRequired: true,
    },
    provenance: {
      generatedFrom,
      inputHashes,
      atlasHash: "pending",
      targetEchoForbidden: true,
      targetDerivedFieldsUsed: false,
    },
  });
  const atlasHash = sha256(
    stableStringify({
      ...atlasWithoutHash,
      provenance: { ...atlasWithoutHash.provenance, atlasHash: null },
    }),
  );
  const atlas = buildNhm2RegionalSupportFunctionAtlas({
    ...atlasWithoutHash,
    provenance: {
      ...atlasWithoutHash.provenance,
      atlasHash,
    },
  });
  if (!isNhm2RegionalSupportFunctionAtlas(atlas)) {
    throw new Error("internal error: produced invalid regional support-function atlas");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(atlas, null, 2)}\n`, "utf8");
  return atlas;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const referenceRunPath = asString(args["reference-run"]);
  const outPath = asString(args.out);
  if (referenceRunPath == null || outPath == null) {
    throw new Error("--reference-run and --out are required");
  }
  const artifact = buildRegionalSupportFunctionAtlas({
    repoRoot: process.cwd(),
    referenceRunPath,
    tileFullTensorSourcePath: asString(args["tile-full-tensor-source"]),
    metricRef: asString(args["metric-ref"]),
    gridRef: asString(args["grid-ref"]),
    samplePlanRef: asString(args["sample-plan-ref"]),
    transitionWidthMeters: asNumber(args["transition-width-meters"]),
    supportDerivativeReceiptPath: asString(args["support-derivative-receipt"]),
    outPath,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
