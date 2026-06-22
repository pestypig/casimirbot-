import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { isCasimirMaterialReceipt } from "../../shared/contracts/casimir-material-receipt.v1";
import { isNhm2ReferenceRunArtifact } from "../../shared/contracts/nhm2-reference-run.v1";
import {
  buildNhm2SourceSideSameBasisTensorAuthorityArtifact,
  isNhm2SourceSideSameBasisTensorAuthorityArtifact,
  type BuildNhm2SourceSideSameBasisTensorAuthorityInput,
  type Nhm2SourceSideSameBasisTensorAuthorityArtifactV1,
} from "../../shared/contracts/nhm2-source-side-same-basis-tensor-authority.v1";
import {
  isNhm2TileEffectiveCounterpartArtifact,
  type Nhm2TileEffectiveCounterpartArtifact,
} from "../../shared/contracts/nhm2-tile-effective-counterpart.v1";
import {
  isNhm2TileSourceAuthorityHandoff,
} from "../../shared/contracts/nhm2-tile-source-authority-handoff.v1";
import {
  isNhm2TileSourceFullApparatusTensorValues,
} from "../../shared/contracts/nhm2-tile-source-full-apparatus-tensor-values.v1";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

const pathUsesLatestAlias = (path: string | null | undefined): boolean =>
  path != null && /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

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

const chartIdFor = (artifact: Nhm2TileEffectiveCounterpartArtifact): string => {
  const charts = Array.from(new Set(artifact.regions.map((region) => region.chartRef)));
  if (charts.length === 1) return charts[0];
  return "mixed";
};

const sourceClosureRegions = (sourceClosure: unknown): NonNullable<
  BuildNhm2SourceSideSameBasisTensorAuthorityInput["sourceClosureRegions"]
> => {
  const regions = asRecord(asRecord(sourceClosure)?.regionComparisons)?.regions;
  return Array.isArray(regions)
    ? regions
        .map((entry) => asRecord(entry))
        .filter((entry): entry is Record<string, unknown> => entry != null)
    : [];
};

export const publishSourceSideSameBasisTensorAuthority = (args: {
  repoRoot: string;
  referenceRunPath: string;
  tileEffectiveCounterpartPath: string;
  outPath: string;
  sourceClosurePath?: string | null;
  casimirMaterialReceiptPath?: string | null;
  tileSourceAuthorityHandoffPath?: string | null;
  fullApparatusTensorValuesPath?: string | null;
  auditOnly?: boolean;
}): Nhm2SourceSideSameBasisTensorAuthorityArtifactV1 => {
  const paths = [
    args.referenceRunPath,
    args.tileEffectiveCounterpartPath,
    args.sourceClosurePath,
    args.casimirMaterialReceiptPath,
    args.tileSourceAuthorityHandoffPath,
    args.fullApparatusTensorValuesPath,
  ];
  if (!args.auditOnly && paths.some(pathUsesLatestAlias)) {
    throw new Error("latest aliases are forbidden unless --audit-only is passed");
  }
  for (const path of paths.filter((entry): entry is string => entry != null)) {
    if (!existsSync(resolvePath(args.repoRoot, path))) {
      throw new Error(`required source-authority input missing: ${path}`);
    }
  }

  const referenceRun = readJson(resolvePath(args.repoRoot, args.referenceRunPath));
  if (!isNhm2ReferenceRunArtifact(referenceRun)) {
    throw new Error("reference run must be nhm2_reference_run/v1");
  }
  const counterpart = readJson(resolvePath(args.repoRoot, args.tileEffectiveCounterpartPath));
  if (!isNhm2TileEffectiveCounterpartArtifact(counterpart)) {
    throw new Error("tile-effective counterpart must be nhm2_tile_effective_counterpart/v1");
  }
  if (counterpart.runId !== referenceRun.runId) {
    throw new Error("tile-effective counterpart runId must match the reference run");
  }
  if (
    counterpart.selectedProfileId !== referenceRun.selectedFamily.selectedProfileId ||
    counterpart.expectedProfileId !== referenceRun.selectedFamily.expectedProfileId
  ) {
    throw new Error("tile-effective counterpart profile must match the reference run");
  }

  const sourceClosure =
    args.sourceClosurePath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.sourceClosurePath));
  const materialReceipt =
    args.casimirMaterialReceiptPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.casimirMaterialReceiptPath));
  if (materialReceipt != null && !isCasimirMaterialReceipt(materialReceipt)) {
    throw new Error("Casimir material receipt must be casimir_material_receipt/v1");
  }
  const tileSourceAuthorityHandoff =
    args.tileSourceAuthorityHandoffPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.tileSourceAuthorityHandoffPath));
  if (tileSourceAuthorityHandoff != null && !isNhm2TileSourceAuthorityHandoff(tileSourceAuthorityHandoff)) {
    throw new Error("tile-source authority handoff must be nhm2_tile_source_authority_handoff/v1");
  }
  const fullApparatusTensorValues =
    args.fullApparatusTensorValuesPath == null
      ? null
      : readJson(resolvePath(args.repoRoot, args.fullApparatusTensorValuesPath));
  if (
    fullApparatusTensorValues != null &&
    !isNhm2TileSourceFullApparatusTensorValues(fullApparatusTensorValues)
  ) {
    throw new Error("full apparatus tensor values must be nhm2_tile_source_full_apparatus_tensor_values/v1");
  }

  const artifact = buildNhm2SourceSideSameBasisTensorAuthorityArtifact({
    generatedAt: new Date().toISOString(),
    laneId: "nhm2_shift_lapse",
    selectedProfileId: referenceRun.selectedFamily.selectedProfileId,
    chartId: chartIdFor(counterpart),
    sourceModelId: asString(counterpart.sourceAuthorityMode),
    sourceTensorArtifactRef: counterpart.sourceTensorArtifactRef ?? null,
    counterpartArtifactRef: args.tileEffectiveCounterpartPath,
    tileSourceAuthorityHandoffRef: args.tileSourceAuthorityHandoffPath ?? null,
    tileSourceAuthorityHandoff: isNhm2TileSourceAuthorityHandoff(tileSourceAuthorityHandoff)
      ? tileSourceAuthorityHandoff
      : null,
    fullApparatusTensorValues: isNhm2TileSourceFullApparatusTensorValues(fullApparatusTensorValues)
      ? fullApparatusTensorValues
      : null,
    counterpartArtifact: counterpart,
    sourceClosureRegions: sourceClosureRegions(sourceClosure),
    casimirMaterialReceipt: isCasimirMaterialReceipt(materialReceipt)
      ? materialReceipt
      : null,
  });
  if (!isNhm2SourceSideSameBasisTensorAuthorityArtifact(artifact)) {
    throw new Error("internal error: produced invalid source-side authority artifact");
  }
  const outPath = resolvePath(args.repoRoot, args.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const referenceRunPath = asString(args["reference-run"]);
  const tileEffectiveCounterpartPath = asString(args["tile-effective-counterpart"]);
  const outPath = asString(args.out);
  if (referenceRunPath == null || tileEffectiveCounterpartPath == null || outPath == null) {
    throw new Error("--reference-run, --tile-effective-counterpart, and --out are required");
  }
  const artifact = publishSourceSideSameBasisTensorAuthority({
    repoRoot: process.cwd(),
    referenceRunPath,
    tileEffectiveCounterpartPath,
    sourceClosurePath: asString(args["source-closure"]),
    casimirMaterialReceiptPath: asString(args["casimir-material-receipt"]),
    tileSourceAuthorityHandoffPath: asString(args["tile-source-authority-handoff"]),
    fullApparatusTensorValuesPath: asString(args["full-apparatus-tensor-values"]),
    outPath,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
