import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2QeiBoundReceipt,
  type Nhm2QeiBoundModelKind,
  type Nhm2QeiBoundReceiptV1,
} from "../../shared/contracts/nhm2-qei-bound-receipt.v1";
import type {
  Nhm2QeiWorldlineConsistencyStatus,
  Nhm2QeiWorldlineRegionId,
  Nhm2QeiWorldlineSamplingFunctionKind,
} from "../../shared/contracts/nhm2-qei-worldline-dossier.v1";
import {
  isNhm2RegionalSupportFunctionAtlas,
  type Nhm2RegionalSupportFunctionAtlasV1,
} from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import {
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

const C = 299_792_458;

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

const asBoolean = (value: unknown): boolean =>
  value === true || value === "true" || value === "1" || value === "yes";

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

const readRequired = <T>(
  repoRoot: string,
  path: string,
  validator: (value: unknown) => value is T,
  label: string,
): T => {
  const value = readJson(resolvePath(repoRoot, path));
  if (!validator(value)) throw new Error(`${label} has invalid contract: ${path}`);
  return value;
};

const normalizeSamplingKind = (
  value: unknown,
): Nhm2QeiWorldlineSamplingFunctionKind => {
  const text = asString(value)?.toLowerCase();
  if (text === "compact" || text === "compact-support") return "compact_support";
  if (text === "lorentzian" || text === "gaussian" || text === "compact_support") {
    return text;
  }
  return "unknown";
};

const normalizeBoundModelKind = (value: unknown): Nhm2QeiBoundModelKind => {
  const text = asString(value);
  if (
    text === "ford_roman_lorentzian" ||
    text === "fewster_thompson_stationary" ||
    text === "declared_reduced_order"
  ) {
    return text;
  }
  return "missing";
};

const tauVsDuty = (
  tauSeconds: number | null,
  dutyCycle: number | null,
): Nhm2QeiWorldlineConsistencyStatus => {
  if (tauSeconds == null || dutyCycle == null) return "missing";
  return tauSeconds > 0 && dutyCycle > 0 && dutyCycle <= 1 ? "pass" : "fail";
};

const tauVsLightCrossing = (
  tauSeconds: number | null,
  lightCrossingSeconds: number | null,
): Nhm2QeiWorldlineConsistencyStatus => {
  if (tauSeconds == null || lightCrossingSeconds == null) return "missing";
  if (tauSeconds <= 0 || lightCrossingSeconds <= 0) return "fail";
  return tauSeconds <= lightCrossingSeconds ? "pass" : "fail";
};

const tauVsModulation = (
  tauSeconds: number | null,
  modulationSeconds: number | null,
): Nhm2QeiWorldlineConsistencyStatus => {
  if (tauSeconds == null || modulationSeconds == null) return "missing";
  if (tauSeconds <= 0 || modulationSeconds <= 0) return "fail";
  return tauSeconds <= modulationSeconds ? "pass" : "fail";
};

const lightCrossingForRegion = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1,
  regionId: Nhm2QeiWorldlineRegionId,
): number | null => {
  if (regionId === "hull_wall_transition" || regionId === "wall_exterior_transition") {
    const kernel = atlas.transitionKernels.find(
      (entry) => entry.supportRegion === regionId,
    );
    return kernel == null ? null : kernel.widthMeters / C;
  }
  if (regionId !== "hull" && regionId !== "wall" && regionId !== "exterior_shell") {
    return null;
  }
  const volume = atlas.regions[regionId]?.supportStats.effectiveVolume;
  return typeof volume === "number" && Number.isFinite(volume) && volume > 0
    ? Math.cbrt(volume) / C
    : null;
};

const lightCrossingFromAtlas = (
  atlas: Nhm2RegionalSupportFunctionAtlasV1,
  regions: Nhm2QeiWorldlineRegionId[],
): number | null => {
  const values = regions
    .map((regionId) => lightCrossingForRegion(atlas, regionId))
    .filter((value): value is number => value != null && value > 0);
  return values.length === 0 ? null : Math.min(...values);
};

const defaultRegions: Nhm2QeiWorldlineRegionId[] = [
  "wall",
  "hull_wall_transition",
  "wall_exterior_transition",
];

const regionsFromCli = (value: string | null): Nhm2QeiWorldlineRegionId[] => {
  if (value == null) return defaultRegions;
  const allowed = new Set<Nhm2QeiWorldlineRegionId>([
    "hull",
    "wall",
    "exterior_shell",
    "hull_wall_transition",
    "wall_exterior_transition",
    "centerline",
    "custom",
  ]);
  const parsed = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is Nhm2QeiWorldlineRegionId =>
      allowed.has(entry as Nhm2QeiWorldlineRegionId),
    );
  return parsed.length === 0 ? defaultRegions : parsed;
};

const boundStatus = (
  modelKind: Nhm2QeiBoundModelKind,
  boundSI: number | null,
): Nhm2QeiBoundReceiptV1["bound"]["status"] => {
  if (boundSI == null) return "missing";
  if (modelKind === "declared_reduced_order") return "declared_reduced_order";
  if (modelKind === "missing") return "proxy";
  return "literature_bound";
};

export const buildQeiBoundReceipt = (args: {
  repoRoot: string;
  regionalSupportAtlasPath: string;
  sourceFullTensorPath: string;
  outPath: string;
  boundModelKind?: Nhm2QeiBoundModelKind | null;
  boundSI?: number | null;
  boundProvenanceRef?: string | null;
  tauSeconds?: number | null;
  tauSourceRef?: string | null;
  samplingKind?: Nhm2QeiWorldlineSamplingFunctionKind | null;
  samplingNormalized?: boolean;
  dutyCycle?: number | null;
  dutyCycleSourceRef?: string | null;
  lightCrossingSeconds?: number | null;
  lightCrossingSourceRef?: string | null;
  modulationSeconds?: number | null;
  modulationSourceRef?: string | null;
  qftStateRef?: string | null;
  renormalizationConventionRef?: string | null;
  stationaryWorldlineAssumption?: boolean;
  appliesToRegions?: Nhm2QeiWorldlineRegionId[] | null;
  auditOnly?: boolean;
}): Nhm2QeiBoundReceiptV1 => {
  if (
    !args.auditOnly &&
    [args.regionalSupportAtlasPath, args.sourceFullTensorPath].some((path) =>
      /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path),
    )
  ) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  const atlas = readRequired(
    args.repoRoot,
    args.regionalSupportAtlasPath,
    isNhm2RegionalSupportFunctionAtlas,
    "regional support-function atlas",
  );
  const source = readRequired(
    args.repoRoot,
    args.sourceFullTensorPath,
    isNhm2TileEffectiveFullTensorSourceArtifact,
    "source full tensor",
  );
  const regions = args.appliesToRegions ?? defaultRegions;
  const modelKind = args.boundModelKind ?? "missing";
  const atlasLightCrossingSeconds =
    args.lightCrossingSeconds == null ? lightCrossingFromAtlas(atlas, regions) : null;
  const lightCrossingSeconds =
    args.lightCrossingSeconds ?? atlasLightCrossingSeconds;
  const lightCrossingSourceRef =
    args.lightCrossingSourceRef ??
    (atlasLightCrossingSeconds == null
      ? null
      : `${args.regionalSupportAtlasPath}:support_light_crossing_min`);
  const blockers = [
    ...(atlas.eligibility.atlasEligibleForClosureHarness
      ? []
      : ["qei_atlas_not_eligible"]),
    ...(source.overallState === "pass"
      ? []
      : ["source_full_tensor_authority_not_pass"]),
  ];
  const receipt = buildNhm2QeiBoundReceipt({
    generatedAt: new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: atlas.runIdentity.profileId,
    atlasRef: args.regionalSupportAtlasPath,
    atlasHash: atlas.provenance.atlasHash,
    tensorRef: source.artifactId,
    boundModelKind: modelKind,
    samplingFunction: {
      kind: args.samplingKind ?? "unknown",
      tauSeconds: args.tauSeconds ?? null,
      normalized: args.samplingNormalized === true,
    },
    bound: {
      valueSI: args.boundSI ?? null,
      unit: args.boundSI == null ? null : "J/m^3",
      ...(args.boundProvenanceRef == null
        ? {}
        : { provenanceRef: args.boundProvenanceRef }),
      status: boundStatus(modelKind, args.boundSI ?? null),
    },
    tauPolicy: {
      tauVsDuty: tauVsDuty(args.tauSeconds ?? null, args.dutyCycle ?? null),
      tauVsLightCrossing: tauVsLightCrossing(
        args.tauSeconds ?? null,
        lightCrossingSeconds,
      ),
      tauVsModulation: tauVsModulation(
        args.tauSeconds ?? null,
        args.modulationSeconds ?? null,
      ),
      dutyCycle: args.dutyCycle ?? null,
      lightCrossingSeconds,
      modulationSeconds: args.modulationSeconds ?? null,
    },
    provenance: {
      boundProvenanceRef: args.boundProvenanceRef ?? null,
      qftStateRef: args.qftStateRef ?? null,
      renormalizationConventionRef: args.renormalizationConventionRef ?? null,
      tauSourceRef: args.tauSourceRef ?? null,
      dutyCycleSourceRef: args.dutyCycleSourceRef ?? null,
      modulationSourceRef: args.modulationSourceRef ?? null,
      lightCrossingSourceRef,
    },
    applicability: {
      appliesToRegions: regions,
      stationaryWorldlineAssumption: args.stationaryWorldlineAssumption === true,
      reducedOrderOnly: modelKind === "declared_reduced_order",
      qftStateSpecified: args.qftStateRef != null,
      renormalizationConventionSpecified: args.renormalizationConventionRef != null,
    },
    blockers,
    warnings: [],
  });
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return receipt;
};

const main = (): void => {
  const raw = parseArgs(process.argv.slice(2));
  const regionalSupportAtlasPath = asString(raw["regional-support-atlas"]);
  const sourceFullTensorPath = asString(raw["source-full-tensor"]);
  const outPath = asString(raw.out);
  if (regionalSupportAtlasPath == null || sourceFullTensorPath == null || outPath == null) {
    throw new Error("--regional-support-atlas, --source-full-tensor, and --out are required");
  }
  const artifact = buildQeiBoundReceipt({
    repoRoot: process.cwd(),
    regionalSupportAtlasPath,
    sourceFullTensorPath,
    outPath,
    boundModelKind: normalizeBoundModelKind(raw["bound-model-kind"]),
    boundSI: asNumber(raw["bound-si"]),
    boundProvenanceRef: asString(raw["bound-provenance-ref"]),
    tauSeconds: asNumber(raw["tau-seconds"]),
    tauSourceRef: asString(raw["tau-source-ref"]),
    samplingKind: normalizeSamplingKind(raw["sampling-kind"]),
    samplingNormalized: asBoolean(raw["sampling-normalized"]),
    dutyCycle: asNumber(raw["duty-cycle"]),
    dutyCycleSourceRef: asString(raw["duty-cycle-source-ref"]),
    lightCrossingSeconds: asNumber(raw["light-crossing-seconds"]),
    lightCrossingSourceRef: asString(raw["light-crossing-source-ref"]),
    modulationSeconds: asNumber(raw["modulation-seconds"]),
    modulationSourceRef: asString(raw["modulation-source-ref"]),
    qftStateRef: asString(raw["qft-state-ref"]),
    renormalizationConventionRef:
      asString(raw["renormalization-convention-ref"]) ?? asString(raw["renormalization-ref"]),
    stationaryWorldlineAssumption: asBoolean(raw["stationary-worldline-assumption"]),
    appliesToRegions: regionsFromCli(asString(raw["applies-to-regions"])),
    auditOnly: raw["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (
  existsSync(normalize(process.argv[1] ?? "")) &&
  normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))
) {
  main();
}
