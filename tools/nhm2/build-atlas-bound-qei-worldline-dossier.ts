import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2QeiWorldlineDossier,
  type Nhm2QeiWorldlineDossierV1,
  type Nhm2QeiWorldlineDossierWorldlineV1,
  type Nhm2QeiWorldlineBoundStatus,
  type Nhm2QeiWorldlineRegionId,
  type Nhm2QeiWorldlineSamplingFunctionKind,
} from "../../shared/contracts/nhm2-qei-worldline-dossier.v1";
import {
  isNhm2QeiBoundReceipt,
  type Nhm2QeiBoundReceiptV1,
} from "../../shared/contracts/nhm2-qei-bound-receipt.v1";
import {
  isNhm2RegionalSupportFunctionAtlas,
  type Nhm2RegionalSupportFunctionAtlasV1,
} from "../../shared/contracts/nhm2-regional-support-function-atlas.v1";
import type {
  Nhm2RegionalSourceClosureRegionId,
  Nhm2RegionalTensor,
} from "../../shared/contracts/nhm2-regional-source-closure-evidence.v1";
import {
  fullTensorSourceHasFullAuthority,
  isNhm2TileEffectiveFullTensorSourceArtifact,
  type Nhm2TileEffectiveFullTensorSourceArtifact,
} from "../../shared/contracts/nhm2-tile-effective-full-tensor-source.v1";

type QeiBoundReceipt = {
  valueSI: number | null;
  provenanceRef: string | null;
  status: Nhm2QeiWorldlineBoundStatus;
  samplingKind: Nhm2QeiWorldlineSamplingFunctionKind | null;
  tauSeconds: number | null;
  samplingNormalized: boolean | null;
  dutyCycle: number | null;
  lightCrossingSeconds: number | null;
  modulationSeconds: number | null;
  blockers: string[];
};

const C = 299_792_458;

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

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

const readRequired = <T>(
  repoRoot: string,
  path: string,
  validator: (value: unknown) => value is T,
  label: string,
): T => {
  const resolved = resolvePath(repoRoot, path);
  const value = readJson(resolved);
  if (!validator(value)) throw new Error(`${label} has invalid contract: ${path}`);
  return value;
};

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const transitionSourceRegions = (
  regionId: "hull_wall_transition" | "wall_exterior_transition",
): [Nhm2RegionalSourceClosureRegionId, Nhm2RegionalSourceClosureRegionId] =>
  regionId === "hull_wall_transition" ? ["hull", "wall"] : ["wall", "exterior_shell"];

const sourceRegionMap = (
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
): Map<Nhm2RegionalSourceClosureRegionId, Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number]> =>
  new Map(source.regions.map((region) => [region.regionId, region]));

const t00FromTensor = (tensor: Nhm2RegionalTensor): number | null =>
  typeof tensor.T00 === "number" && Number.isFinite(tensor.T00) ? tensor.T00 : null;

const regionHasAuthority = (
  region: Nhm2TileEffectiveFullTensorSourceArtifact["regions"][number] | null | undefined,
): boolean =>
  region != null &&
  region.status === "pass" &&
  region.provenance.notDerivedFromMetricRequiredTensor === true &&
  fullTensorSourceHasFullAuthority(region.tensor, region.tensorAuthorityMode);

const sampledDensityForRegion = (
  regionId: Nhm2QeiWorldlineRegionId,
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
): {
  valueSI: number | null;
  provenanceRef: string | null;
  status: "computed" | "proxy" | "missing";
  blockers: string[];
} => {
  const regions = sourceRegionMap(source);
  if (regionId === "hull" || regionId === "wall" || regionId === "exterior_shell") {
    const region = regions.get(regionId);
    const value = region == null ? null : t00FromTensor(region.tensor);
    const authority = regionHasAuthority(region);
    return {
      valueSI: value,
      provenanceRef: region == null ? null : `${source.artifactId}:${regionId}:T00`,
      status: value == null ? "missing" : authority ? "computed" : "proxy",
      blockers: [
        ...(region == null ? [`${regionId}:source_region_missing`] : []),
        ...(value == null ? [`${regionId}:sampled_rho_missing`] : []),
        ...(region != null && !authority
          ? [`${regionId}:source_full_tensor_authority_not_pass`]
          : []),
      ],
    };
  }

  if (regionId === "hull_wall_transition" || regionId === "wall_exterior_transition") {
    const [fromRegionId, toRegionId] = transitionSourceRegions(regionId);
    const from = regions.get(fromRegionId);
    const to = regions.get(toRegionId);
    const fromT00 = from == null ? null : t00FromTensor(from.tensor);
    const toT00 = to == null ? null : t00FromTensor(to.tensor);
    const value = fromT00 == null || toT00 == null ? null : (fromT00 + toT00) / 2;
    const authority = regionHasAuthority(from) && regionHasAuthority(to);
    return {
      valueSI: value,
      provenanceRef:
        value == null
          ? null
          : `${source.artifactId}:${fromRegionId}-${toRegionId}:transition:T00`,
      status: value == null ? "missing" : authority ? "computed" : "proxy",
      blockers: [
        "transition_worldline_reduced_order_interpolation",
        ...(value == null ? [`${regionId}:sampled_rho_missing`] : []),
        ...(!authority ? [`${regionId}:source_full_tensor_authority_not_pass`] : []),
      ],
    };
  }

  return {
    valueSI: null,
    provenanceRef: null,
    status: "missing",
    blockers: [`${regionId}:unsupported_qei_region`],
  };
};

const readBoundReceipt = (
  repoRoot: string,
  path: string | null,
  directValue: number | null,
  auditOnly: boolean,
  atlasHash: string,
  source: Nhm2TileEffectiveFullTensorSourceArtifact,
  sourceFullTensorPath: string,
): QeiBoundReceipt => {
  if (directValue != null) {
    return {
      valueSI: directValue,
      provenanceRef: "cli:qei-bound-si",
      status: auditOnly ? "literature_bound" : "proxy",
      samplingKind: null,
      tauSeconds: null,
      samplingNormalized: null,
      dutyCycle: null,
      lightCrossingSeconds: null,
      modulationSeconds: null,
      blockers: auditOnly
        ? []
        : ["qei_bound_receipt_missing", "qei_bound_direct_scalar_not_receipted"],
    };
  }
  if (path == null || !existsSync(resolvePath(repoRoot, path))) {
    return {
      valueSI: null,
      provenanceRef: null,
      status: "missing",
      samplingKind: null,
      tauSeconds: null,
      samplingNormalized: null,
      dutyCycle: null,
      lightCrossingSeconds: null,
      modulationSeconds: null,
      blockers: ["qei_bound_receipt_missing"],
    };
  }
  const record = readJson(resolvePath(repoRoot, path));
  if (!isNhm2QeiBoundReceipt(record)) {
    return {
      valueSI: null,
      provenanceRef: path,
      status: "missing",
      samplingKind: null,
      tauSeconds: null,
      samplingNormalized: null,
      dutyCycle: null,
      lightCrossingSeconds: null,
      modulationSeconds: null,
      blockers: ["qei_bound_receipt_invalid_contract"],
    };
  }
  const receipt = record;
  const sourceTensorRefs = new Set([source.artifactId, sourceFullTensorPath]);
  const status = mapReceiptBoundStatus(receipt);
  return {
    valueSI: receipt.bound.valueSI,
    provenanceRef: receipt.bound.provenanceRef ?? path,
    status,
    samplingKind: receipt.samplingFunction.kind,
    tauSeconds: receipt.samplingFunction.tauSeconds,
    samplingNormalized: receipt.samplingFunction.normalized,
    dutyCycle: receipt.tauPolicy.dutyCycle,
    lightCrossingSeconds: receipt.tauPolicy.lightCrossingSeconds,
    modulationSeconds: receipt.tauPolicy.modulationSeconds,
    blockers: [
      ...receipt.blockers,
      ...(receipt.status === "pass" ? [] : [`qei_bound_receipt_${receipt.status}`]),
      ...(receipt.atlasHash === atlasHash
        ? []
        : ["qei_bound_receipt_atlas_hash_mismatch"]),
      ...(sourceTensorRefs.has(receipt.tensorRef)
        ? []
        : ["qei_bound_receipt_tensor_ref_mismatch"]),
      ...(receipt.bound.status === "declared_reduced_order"
        ? ["qei_bound_declared_reduced_order_only"]
        : []),
    ],
  };
};

const mapReceiptBoundStatus = (
  receipt: Nhm2QeiBoundReceiptV1,
): Nhm2QeiWorldlineBoundStatus => {
  if (receipt.bound.status === "computed") return "computed";
  if (receipt.bound.status === "literature_bound") return "literature_bound";
  if (receipt.bound.status === "declared_reduced_order") return "proxy";
  if (receipt.bound.status === "proxy") return "proxy";
  return "missing";
};

const consistency = (args: {
  tauSeconds: number | null;
  dutyCycle: number | null;
  lightCrossingSeconds: number | null;
  modulationSeconds: number | null;
}): Nhm2QeiWorldlineDossierWorldlineV1["consistency"] => ({
  tauVsDuty:
    args.tauSeconds == null || args.dutyCycle == null
      ? "missing"
      : args.tauSeconds > 0 && args.dutyCycle > 0 && args.dutyCycle <= 1
        ? "pass"
        : "fail",
  tauVsLightCrossing:
    args.tauSeconds == null || args.lightCrossingSeconds == null
      ? "missing"
      : args.tauSeconds > 0 &&
          args.lightCrossingSeconds > 0 &&
          args.tauSeconds <= args.lightCrossingSeconds
        ? "pass"
        : "fail",
  tauVsModulation:
    args.tauSeconds == null || args.modulationSeconds == null
      ? "missing"
      : args.tauSeconds > 0 &&
          args.modulationSeconds > 0 &&
          args.tauSeconds <= args.modulationSeconds
        ? "pass"
        : "fail",
});

const lightCrossingFromAtlas = (
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

export const buildAtlasBoundQeiWorldlineDossier = (args: {
  repoRoot: string;
  regionalSupportAtlasPath: string;
  sourceFullTensorPath: string;
  outPath: string;
  qeiBoundReceiptPath?: string | null;
  qeiBoundSI?: number | null;
  tauSeconds?: number | null;
  dutyCycle?: number | null;
  lightCrossingSeconds?: number | null;
  modulationSeconds?: number | null;
  samplingKind?: "lorentzian" | "gaussian" | "compact_support" | "unknown";
  samplingNormalized?: boolean;
  auditOnly?: boolean;
}): Nhm2QeiWorldlineDossierV1 => {
  const paths = [
    args.regionalSupportAtlasPath,
    args.sourceFullTensorPath,
    args.qeiBoundReceiptPath,
  ];
  if (!args.auditOnly && paths.some(pathUsesLatestAlias)) {
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
  const bound = readBoundReceipt(
    args.repoRoot,
    args.qeiBoundReceiptPath ?? null,
    args.qeiBoundSI ?? null,
    args.auditOnly === true,
    atlas.provenance.atlasHash,
    source,
    args.sourceFullTensorPath,
  );
  const regions: Nhm2QeiWorldlineRegionId[] = [
    "wall",
    "hull_wall_transition",
    "wall_exterior_transition",
  ];
  const worldlines = regions.map((regionId) => {
    const density = sampledDensityForRegion(regionId, source);
    const lightCrossing =
      bound.lightCrossingSeconds ??
      args.lightCrossingSeconds ??
      lightCrossingFromAtlas(atlas, regionId);
    const tauSeconds = bound.tauSeconds ?? args.tauSeconds ?? null;
    const dutyCycle = bound.dutyCycle ?? args.dutyCycle ?? null;
    const modulationSeconds =
      bound.modulationSeconds ?? args.modulationSeconds ?? null;
    const samplingKind = bound.samplingKind ?? args.samplingKind ?? "unknown";
    const samplingNormalized =
      bound.samplingNormalized ?? (args.samplingNormalized === true);
    const margin =
      density.valueSI == null || bound.valueSI == null
        ? null
        : bound.valueSI - density.valueSI;
    const blockers = [
      ...density.blockers,
      ...bound.blockers,
      ...(tauSeconds == null ? ["sampling_tau_missing"] : []),
      ...(samplingNormalized === true
        ? []
        : ["sampling_function_not_normalized"]),
      ...(bound.valueSI == null ? ["qei_bound_missing"] : []),
      ...(bound.provenanceRef == null ? ["qei_bound_provenance_missing"] : []),
      ...(bound.status === "proxy" ? ["qei_bound_proxy"] : []),
      ...(margin != null && margin < 0 ? ["qei_margin_failed"] : []),
    ];
    return {
      worldlineId: `qei:${regionId}:atlas`,
      regionId,
      chartId: atlas.runIdentity.chartId,
      samplingFunction: {
        kind: samplingKind,
        tauSeconds,
        normalized: samplingNormalized,
      },
      sampledRho: {
        valueSI: density.valueSI,
        ...(density.provenanceRef == null ? {} : { provenanceRef: density.provenanceRef }),
        status: density.status,
      },
      bound: {
        valueSI: bound.valueSI,
        ...(bound.provenanceRef == null ? {} : { provenanceRef: bound.provenanceRef }),
        status: bound.status,
      },
      margin: {
        valueSI: margin,
        pass: margin == null ? null : margin >= 0,
      },
      consistency: consistency({
        tauSeconds,
        dutyCycle,
        lightCrossingSeconds: lightCrossing,
        modulationSeconds,
      }),
      blockers,
    };
  });
  const artifact = buildNhm2QeiWorldlineDossier({
    generatedAt: new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: atlas.runIdentity.profileId,
    atlasRef: args.regionalSupportAtlasPath,
    atlasHash: atlas.provenance.atlasHash,
    worldlines,
  });
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const raw = parseArgs(process.argv.slice(2));
  const regionalSupportAtlasPath = asString(raw["regional-support-atlas"]);
  const sourceFullTensorPath = asString(raw["source-full-tensor"]);
  const outPath = asString(raw.out);
  if (regionalSupportAtlasPath == null || sourceFullTensorPath == null || outPath == null) {
    throw new Error("--regional-support-atlas, --source-full-tensor, and --out are required");
  }
  const artifact = buildAtlasBoundQeiWorldlineDossier({
    repoRoot: process.cwd(),
    regionalSupportAtlasPath,
    sourceFullTensorPath,
    outPath,
    qeiBoundReceiptPath: asString(raw["qei-bound-receipt"]),
    qeiBoundSI: asNumber(raw["qei-bound-si"]),
    tauSeconds: asNumber(raw["tau-seconds"]),
    dutyCycle: asNumber(raw["duty-cycle"]),
    lightCrossingSeconds: asNumber(raw["light-crossing-seconds"]),
    modulationSeconds: asNumber(raw["modulation-seconds"]),
    samplingKind:
      raw["sampling-kind"] === "lorentzian" ||
      raw["sampling-kind"] === "gaussian" ||
      raw["sampling-kind"] === "compact_support"
        ? raw["sampling-kind"]
        : "unknown",
    samplingNormalized: raw["sampling-normalized"] === true || raw["sampling-normalized"] === "true",
    auditOnly: raw["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
