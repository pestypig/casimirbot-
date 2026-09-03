import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import {
  dirname,
  extname,
  join,
  normalize,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";

export const NHM2_ET0_LAYER_AUTHORITY_INVENTORY_CONTRACT_VERSION =
  "nhm2_et0_layer_authority_inventory/v1";

export const NHM2_ET0_LAYER_AUTHORITY_DEFAULT_OUTPUT =
  "docs/research/nhm2-et0-447-authority-inventory.v1.json";

export const NHM2_ET0_LAYER_AUTHORITY_SCAN_ROOTS = [
  "shared",
  "server",
  "client/src",
  "tools/nhm2",
  "tests",
  "docs/research",
  "configs",
] as const;

export const NHM2_ET0_LAYER_AUTHORITY_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".md",
  ".json",
  ".jsonl",
] as const;

export const NHM2_ET0_LAYER_AUTHORITY_EXCLUDED_PREFIXES = [
  "server/_generated/",
  "client/src/assets/",
] as const;

export const NHM2_ET0_LAYER_AUTHORITY_EXCLUDED_EXACT_PATHS = [
  "client/src/lib/docs/docMetadata.generated.ts",
  NHM2_ET0_LAYER_AUTHORITY_DEFAULT_OUTPUT,
] as const;

export type Nhm2Et0LayerAuthorityCategoryV1 =
  | "scalar_equivalence"
  | "architecture_identity"
  | "geometry_or_thickness"
  | "mechanics_or_load"
  | "material_or_fatigue"
  | "source_retention_or_scaling"
  | "regional_tensor_sampling"
  | "test_fixture"
  | "ui_or_theory_projection"
  | "historical_or_planning_prose"
  | "other_exact_token";

export type Nhm2Et0LayerAuthorityDispositionV1 =
  | "preserve_v1_create_versioned_successor"
  | "preserve_v1_regression_add_v2_fixture"
  | "migrate_future_consumer_to_architecture_ref"
  | "ui_projection_requires_architecture_ref"
  | "historical_or_planning_reference_only"
  | "review_unclassified_exact_token";

export type Nhm2Et0LayerAuthorityOccurrenceV1 = {
  path: string;
  line: number;
  column: number;
  sourceFileSha256: string;
  category: Nhm2Et0LayerAuthorityCategoryV1;
  disposition: Nhm2Et0LayerAuthorityDispositionV1;
  context: string;
};

export type Nhm2Et0LayerAuthorityInventoryV1 = {
  contractVersion: typeof NHM2_ET0_LAYER_AUTHORITY_INVENTORY_CONTRACT_VERSION;
  scanPolicy: {
    roots: string[];
    extensions: string[];
    excludedPrefixes: string[];
    excludedExactPaths: string[];
    translatedMessagePolicy: "source_locale_only";
    tokenRule: "exact_447_not_adjacent_to_ascii_alphanumeric";
  };
  summary: {
    sourceFileCount: number;
    occurrenceCount: number;
    byCategory: Record<Nhm2Et0LayerAuthorityCategoryV1, number>;
    byDisposition: Record<Nhm2Et0LayerAuthorityDispositionV1, number>;
  };
  files: Array<{
    path: string;
    sha256: string;
    occurrenceCount: number;
  }>;
  occurrences: Nhm2Et0LayerAuthorityOccurrenceV1[];
  inventoryDigestSha256: string;
  claimBoundary: {
    diagnosticOnly: true;
    inventoryDoesNotSelectArchitecture: true;
    inventoryDoesNotPromoteV1Evidence: true;
    physicalViabilityClaimAllowed: false;
    proposalReadyClaimAllowed: false;
  };
};

const CATEGORY_ORDER: Nhm2Et0LayerAuthorityCategoryV1[] = [
  "scalar_equivalence",
  "architecture_identity",
  "geometry_or_thickness",
  "mechanics_or_load",
  "material_or_fatigue",
  "source_retention_or_scaling",
  "regional_tensor_sampling",
  "test_fixture",
  "ui_or_theory_projection",
  "historical_or_planning_prose",
  "other_exact_token",
];

const DISPOSITION_ORDER: Nhm2Et0LayerAuthorityDispositionV1[] = [
  "preserve_v1_create_versioned_successor",
  "preserve_v1_regression_add_v2_fixture",
  "migrate_future_consumer_to_architecture_ref",
  "ui_projection_requires_architecture_ref",
  "historical_or_planning_reference_only",
  "review_unclassified_exact_token",
];

const sha256 = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

const toPosix = (value: string): string => value.replaceAll("\\", "/");

const isExact447At = (line: string, index: number): boolean => {
  if (line.slice(index, index + 3) !== "447") return false;
  const before = index === 0 ? "" : line[index - 1];
  const after = index + 3 >= line.length ? "" : line[index + 3];
  return !/[0-9A-Za-z]/.test(before) && !/[0-9A-Za-z]/.test(after);
};

export const findExact447Columns = (line: string): number[] => {
  const columns: number[] = [];
  let start = 0;
  while (start <= line.length - 3) {
    const index = line.indexOf("447", start);
    if (index < 0) break;
    if (isExact447At(line, index)) columns.push(index + 1);
    start = index + 3;
  }
  return columns;
};

const boundedContext = (line: string): string => {
  const normalized = line.trim().replace(/\s+/g, " ");
  return normalized.length <= 240
    ? normalized
    : `${normalized.slice(0, 237)}...`;
};

export const classifyNhm2Et0LayerAuthorityOccurrence = (
  path: string,
  line: string,
): Nhm2Et0LayerAuthorityCategoryV1 => {
  const normalizedPath = toPosix(path).toLowerCase();
  const text = line.toLowerCase();

  if (normalizedPath.startsWith("tests/")) return "test_fixture";
  if (
    normalizedPath.startsWith("client/") ||
    normalizedPath.startsWith("shared/theory/")
  ) {
    return "ui_or_theory_projection";
  }
  if (normalizedPath.startsWith("docs/research/")) {
    return "historical_or_planning_prose";
  }
  if (
    text.includes("regionaltensorsample") ||
    text.includes("regional sample") ||
    text.includes("tensor samples") ||
    text.includes("sample_count")
  ) {
    return "regional_tensor_sampling";
  }
  if (
    text.includes("nhm2_447_layer") ||
    text.includes("candidateid") ||
    text.includes("frozencandidate") ||
    text.includes("architecture")
  ) {
    return "architecture_identity";
  }
  if (
    text.includes("force") ||
    text.includes("load") ||
    text.includes("stress") ||
    text.includes("support") ||
    text.includes("pull-in") ||
    text.includes("stiffness") ||
    text.includes("actuator")
  ) {
    return "mechanics_or_load";
  }
  if (
    text.includes("coupon") ||
    text.includes("material") ||
    text.includes("fatigue") ||
    text.includes("roughness") ||
    text.includes("patch") ||
    text.includes("adhesion") ||
    text.includes("cycle") ||
    text.includes("creep") ||
    text.includes("delamination")
  ) {
    return "material_or_fatigue";
  }
  if (
    text.includes("retention") ||
    text.includes("scaling") ||
    text.includes("nonadditivity") ||
    text.includes("active area") ||
    text.includes("effective layer")
  ) {
    return "source_retention_or_scaling";
  }
  if (
    text.includes("thickness") ||
    text.includes("geometry") ||
    text.includes("layercount") ||
    text.includes("layer_count") ||
    text.includes("stack")
  ) {
    return "geometry_or_thickness";
  }
  if (
    normalizedPath.includes("wall-source-layering-sweep") ||
    text.includes("scalar") ||
    text.includes("fixed-control-volume") ||
    text.includes("fixed_control_volume")
  ) {
    return "scalar_equivalence";
  }
  return "other_exact_token";
};

export const dispositionForNhm2Et0LayerAuthorityOccurrence = (
  path: string,
): Nhm2Et0LayerAuthorityDispositionV1 => {
  const normalizedPath = toPosix(path).toLowerCase();
  if (normalizedPath.startsWith("tests/")) {
    return "preserve_v1_regression_add_v2_fixture";
  }
  if (
    normalizedPath.startsWith("client/") ||
    normalizedPath.startsWith("shared/theory/")
  ) {
    return "ui_projection_requires_architecture_ref";
  }
  if (normalizedPath.startsWith("docs/research/")) {
    return "historical_or_planning_reference_only";
  }
  if (
    normalizedPath.includes(".v1.") ||
    normalizedPath.endsWith("build-wall-source-layering-sweep.ts") ||
    normalizedPath.endsWith("publish-tile-source-material-evidence-receipts.ts")
  ) {
    return "preserve_v1_create_versioned_successor";
  }
  if (
    normalizedPath.startsWith("shared/") ||
    normalizedPath.startsWith("server/") ||
    normalizedPath.startsWith("tools/")
  ) {
    return "migrate_future_consumer_to_architecture_ref";
  }
  return "review_unclassified_exact_token";
};

const shouldExclude = (relativePath: string): boolean => {
  const path = toPosix(relativePath);
  if (
    NHM2_ET0_LAYER_AUTHORITY_EXCLUDED_PREFIXES.some((prefix) =>
      path.startsWith(prefix),
    )
  ) {
    return true;
  }
  if (
    NHM2_ET0_LAYER_AUTHORITY_EXCLUDED_EXACT_PATHS.includes(
      path as (typeof NHM2_ET0_LAYER_AUTHORITY_EXCLUDED_EXACT_PATHS)[number],
    )
  ) {
    return true;
  }
  if (/\.equation-actions(?:\.source)?\.json$/i.test(path)) return true;
  if (
    path.startsWith("client/src/lib/i18n/messages/") &&
    path !== "client/src/lib/i18n/messages/source.ts"
  ) {
    return true;
  }
  return false;
};

const enumerateFiles = (repoRoot: string): string[] => {
  const files: string[] = [];
  const visit = (absolutePath: string): void => {
    for (const name of readdirSync(absolutePath).sort()) {
      const child = join(absolutePath, name);
      const stat = statSync(child);
      if (stat.isDirectory()) {
        visit(child);
        continue;
      }
      const relativePath = toPosix(relative(repoRoot, child));
      if (shouldExclude(relativePath)) continue;
      if (
        !NHM2_ET0_LAYER_AUTHORITY_EXTENSIONS.includes(
          extname(
            child,
          ) as (typeof NHM2_ET0_LAYER_AUTHORITY_EXTENSIONS)[number],
        )
      ) {
        continue;
      }
      files.push(relativePath);
    }
  };

  for (const root of NHM2_ET0_LAYER_AUTHORITY_SCAN_ROOTS) {
    visit(resolve(repoRoot, root));
  }
  return files.sort();
};

const zeroCounts = <T extends string>(keys: T[]): Record<T, number> =>
  Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;

export const buildNhm2Et0LayerAuthorityInventory = (
  repoRoot: string,
): Nhm2Et0LayerAuthorityInventoryV1 => {
  const occurrences: Nhm2Et0LayerAuthorityOccurrenceV1[] = [];
  const files: Nhm2Et0LayerAuthorityInventoryV1["files"] = [];

  for (const relativePath of enumerateFiles(repoRoot)) {
    const absolutePath = resolve(repoRoot, relativePath);
    const bytes = readFileSync(absolutePath);
    const text = bytes.toString("utf8");
    const fileHash = sha256(bytes);
    let fileOccurrenceCount = 0;

    text.split(/\r?\n/).forEach((line, lineIndex) => {
      for (const column of findExact447Columns(line)) {
        fileOccurrenceCount += 1;
        occurrences.push({
          path: relativePath,
          line: lineIndex + 1,
          column,
          sourceFileSha256: fileHash,
          category: classifyNhm2Et0LayerAuthorityOccurrence(relativePath, line),
          disposition:
            dispositionForNhm2Et0LayerAuthorityOccurrence(relativePath),
          context: boundedContext(line),
        });
      }
    });

    if (fileOccurrenceCount > 0) {
      files.push({
        path: relativePath,
        sha256: fileHash,
        occurrenceCount: fileOccurrenceCount,
      });
    }
  }

  const byCategory = zeroCounts(CATEGORY_ORDER);
  const byDisposition = zeroCounts(DISPOSITION_ORDER);
  for (const occurrence of occurrences) {
    byCategory[occurrence.category] += 1;
    byDisposition[occurrence.disposition] += 1;
  }

  const scanPolicy = {
    roots: [...NHM2_ET0_LAYER_AUTHORITY_SCAN_ROOTS],
    extensions: [...NHM2_ET0_LAYER_AUTHORITY_EXTENSIONS],
    excludedPrefixes: [...NHM2_ET0_LAYER_AUTHORITY_EXCLUDED_PREFIXES],
    excludedExactPaths: [...NHM2_ET0_LAYER_AUTHORITY_EXCLUDED_EXACT_PATHS],
    translatedMessagePolicy: "source_locale_only" as const,
    tokenRule: "exact_447_not_adjacent_to_ascii_alphanumeric" as const,
  };
  const digestPayload = { scanPolicy, files, occurrences };

  return {
    contractVersion: NHM2_ET0_LAYER_AUTHORITY_INVENTORY_CONTRACT_VERSION,
    scanPolicy,
    summary: {
      sourceFileCount: files.length,
      occurrenceCount: occurrences.length,
      byCategory,
      byDisposition,
    },
    files,
    occurrences,
    inventoryDigestSha256: sha256(JSON.stringify(digestPayload)),
    claimBoundary: {
      diagnosticOnly: true,
      inventoryDoesNotSelectArchitecture: true,
      inventoryDoesNotPromoteV1Evidence: true,
      physicalViabilityClaimAllowed: false,
      proposalReadyClaimAllowed: false,
    },
  };
};

export const publishNhm2Et0LayerAuthorityInventory = (args: {
  repoRoot: string;
  outPath?: string;
}): Nhm2Et0LayerAuthorityInventoryV1 => {
  const artifact = buildNhm2Et0LayerAuthorityInventory(args.repoRoot);
  const outputPath = resolve(
    args.repoRoot,
    args.outPath ?? NHM2_ET0_LAYER_AUTHORITY_DEFAULT_OUTPUT,
  );
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const parseOutPath = (argv: string[]): string | undefined => {
  const index = argv.indexOf("--out");
  if (index < 0) return undefined;
  const value = argv[index + 1];
  if (value == null || value.startsWith("--")) {
    throw new Error("--out requires a path");
  }
  return value;
};

const main = (): void => {
  const requestedOutput =
    parseOutPath(process.argv.slice(2)) ??
    NHM2_ET0_LAYER_AUTHORITY_DEFAULT_OUTPUT;
  const artifact = publishNhm2Et0LayerAuthorityInventory({
    repoRoot: process.cwd(),
    outPath: requestedOutput,
  });
  process.stdout.write(
    `${JSON.stringify({
      output: requestedOutput,
      sourceFileCount: artifact.summary.sourceFileCount,
      occurrenceCount: artifact.summary.occurrenceCount,
      inventoryDigestSha256: artifact.inventoryDigestSha256,
    })}\n`,
  );
};

if (
  normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))
) {
  main();
}
