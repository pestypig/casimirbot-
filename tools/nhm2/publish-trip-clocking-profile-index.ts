import {
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildNhm2TripClockingDiagnosticContract,
  isNhm2TripClockingDiagnosticContract,
  type Nhm2TripClockingDiagnosticContractV1,
} from "../../shared/contracts/nhm2-trip-clocking-diagnostic.v1";
import {
  buildNhm2TripClockingProfileIndexContract,
  inferNhm2TripClockingProfileRole,
  isNhm2TripClockingProfileIndexContract,
  type Nhm2TripClockingProfileIndexContractV1,
  type Nhm2TripClockingProfileSourceRefsV1,
} from "../../shared/contracts/nhm2-trip-clocking-profile-index.v1";

const DEFAULT_BASE_DIR =
  "artifacts/research/full-solve/selected-family/nhm2-shift-lapse";
const DEFAULT_PROFILES = [
  "stage1_centerline_alpha_0p995_v1",
  "stage1_centerline_alpha_0p7000_v1",
];

type RawTripClockingSources = {
  routeTimeWorldline: unknown;
  missionTimeEstimator: unknown;
  missionTimeComparison: unknown;
};

type TripClockingSourcePaths = {
  routeTimeWorldline: string;
  missionTimeEstimator: string;
  missionTimeComparison: string;
};

type TripClockingProfileSelection = {
  profileId: string;
  sources: RawTripClockingSources;
  sourcePaths: TripClockingSourcePaths;
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

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const resolvePath = (repoRoot: string, path: string): string =>
  isAbsolute(path) ? path : join(repoRoot, path);

const toRepoPath = (repoRoot: string, path: string): string =>
  normalize(relative(repoRoot, resolvePath(repoRoot, path))).replace(/\\/g, "/");

const readJson = (repoRoot: string, path: string): unknown =>
  JSON.parse(readFileSync(resolvePath(repoRoot, path), "utf8").replace(/^\uFEFF/, ""));

const writeJson = (repoRoot: string, path: string, value: unknown): void => {
  const absolutePath = resolvePath(repoRoot, path);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const getProfileId = (artifact: unknown): string | null => {
  if (!artifact || typeof artifact !== "object") return null;
  const sourceSurface = (artifact as Record<string, unknown>).sourceSurface;
  if (!sourceSurface || typeof sourceSurface !== "object") return null;
  const surface = sourceSurface as Record<string, unknown>;
  const gate = surface.shiftLapseTransportPromotionGate;
  if (gate && typeof gate === "object") {
    const gateProfileId = (gate as Record<string, unknown>).shiftLapseProfileId;
    if (typeof gateProfileId === "string" && gateProfileId.trim().length > 0) {
      return gateProfileId;
    }
  }
  const directProfileId = surface.shiftLapseProfileId;
  return typeof directProfileId === "string" && directProfileId.trim().length > 0
    ? directProfileId
    : null;
};

const getGeneratedAt = (artifact: unknown): string => {
  if (!artifact || typeof artifact !== "object") return "";
  const record = artifact as Record<string, unknown>;
  const generatedAt = record.generatedAt;
  if (typeof generatedAt === "string") return generatedAt;
  const generatedOn = record.generatedOn;
  return typeof generatedOn === "string" ? generatedOn : "";
};

const candidateFiles = (repoRoot: string, baseDir: string, prefix: string): string[] =>
  readdirSync(resolvePath(repoRoot, baseDir))
    .filter((name) => name.startsWith(prefix) && name.endsWith(".json"))
    .filter((name) => !name.includes("-latest"))
    .map((name) => join(baseDir, name));

const newestForProfile = (
  repoRoot: string,
  paths: string[],
  profileId: string,
): { path: string; artifact: unknown } | null => {
  const matches = paths
    .map((path) => ({ path, artifact: readJson(repoRoot, path) }))
    .filter((candidate) => getProfileId(candidate.artifact) === profileId)
    .sort((lhs, rhs) => {
      const byGeneratedAt = getGeneratedAt(rhs.artifact).localeCompare(
        getGeneratedAt(lhs.artifact),
      );
      return byGeneratedAt === 0 ? rhs.path.localeCompare(lhs.path) : byGeneratedAt;
    });
  return matches[0] ?? null;
};

const selectProfileSources = (
  repoRoot: string,
  baseDir: string,
  profileId: string,
): TripClockingProfileSelection => {
  const route = newestForProfile(
    repoRoot,
    candidateFiles(repoRoot, baseDir, "nhm2-route-time-worldline-"),
    profileId,
  );
  const estimator = newestForProfile(
    repoRoot,
    candidateFiles(repoRoot, baseDir, "nhm2-mission-time-estimator-"),
    profileId,
  );
  const comparison = newestForProfile(
    repoRoot,
    candidateFiles(repoRoot, baseDir, "nhm2-mission-time-comparison-"),
    profileId,
  );

  if (!route || !estimator || !comparison) {
    throw new Error(`missing coherent trip-clock source set for ${profileId}`);
  }

  return {
    profileId,
    sources: {
      routeTimeWorldline: route.artifact,
      missionTimeEstimator: estimator.artifact,
      missionTimeComparison: comparison.artifact,
    },
    sourcePaths: {
      routeTimeWorldline: toRepoPath(repoRoot, route.path),
      missionTimeEstimator: toRepoPath(repoRoot, estimator.path),
      missionTimeComparison: toRepoPath(repoRoot, comparison.path),
    },
  };
};

const renderIndexMarkdown = (index: Nhm2TripClockingProfileIndexContractV1): string => {
  const rows = index.profiles
    .map(
      (profile) =>
        `| \`${profile.profileId}\` | ${profile.alphaCenterline.toFixed(4)} | ${profile.role} | ${profile.oneWay.shipProperYears.toFixed(6)} | ${profile.oneWay.shipYoungerByDays.toFixed(6)} | ${profile.claimStatus} |`,
    )
    .join("\n");

  return `# NHM2 Trip Clocking Profile Index

Generated: ${index.generatedAt}

This index compares profile-scoped trip clocking diagnostics only. It does not certify ship speed, route ETA, physical viability, full-solve closure, or lower-alpha promotion.

| Profile | alpha | role | one-way ship proper years | one-way saved days | status |
| --- | ---: | --- | ---: | ---: | --- |
${rows}

## Alias Policy

- Latest aliases are profile-scoped.
- Mixed-profile latest evidence is forbidden.
- The index does not override the stricter per-profile trip-clock diagnostic coherence checks.

## Non-Claims

${index.nonClaims.map((claim) => `- ${claim}`).join("\n")}
`;
};

export const publishTripClockingProfileIndex = (args: {
  repoRoot: string;
  baseDir?: string | null;
  profiles?: string[] | null;
  diagnosticsOutDir?: string | null;
  indexOut?: string | null;
  indexMarkdownOut?: string | null;
  generatedAt?: string | null;
}): Nhm2TripClockingProfileIndexContractV1 => {
  const baseDir = args.baseDir ?? DEFAULT_BASE_DIR;
  const profiles = args.profiles?.length ? args.profiles : DEFAULT_PROFILES;
  const diagnosticsOutDir = args.diagnosticsOutDir ?? join(baseDir, "trip-clocking");
  const indexOut = args.indexOut ?? join(baseDir, "nhm2-trip-clocking-profile-index-latest.json");
  const indexMarkdownOut =
    args.indexMarkdownOut ?? join(baseDir, "nhm2-trip-clocking-profile-index-latest.md");

  const indexInputs = profiles.map((profileId) => {
    const selection = selectProfileSources(args.repoRoot, baseDir, profileId);
    const diagnostic = buildNhm2TripClockingDiagnosticContract({
      routeTimeWorldline: selection.sources.routeTimeWorldline as never,
      missionTimeEstimator: selection.sources.missionTimeEstimator as never,
      missionTimeComparison: selection.sources.missionTimeComparison as never,
      expectedSelectedProfileId: profileId,
      generatedAt: args.generatedAt ?? undefined,
    });
    if (!diagnostic || !isNhm2TripClockingDiagnosticContract(diagnostic)) {
      throw new Error(`failed to build coherent trip-clock diagnostic for ${profileId}`);
    }

    const diagnosticRef = join(
      diagnosticsOutDir,
      profileId,
      "nhm2-trip-clocking-diagnostic.json",
    );
    writeJson(args.repoRoot, diagnosticRef, diagnostic);

    return {
      diagnostic,
      diagnosticRef: toRepoPath(args.repoRoot, diagnosticRef),
      sourceRefs: selection.sourcePaths satisfies Nhm2TripClockingProfileSourceRefsV1,
      role: inferNhm2TripClockingProfileRole(profileId),
    };
  });

  const index = buildNhm2TripClockingProfileIndexContract({
    profiles: indexInputs,
    generatedAt: args.generatedAt ?? undefined,
  });
  if (!index || !isNhm2TripClockingProfileIndexContract(index)) {
    throw new Error("internal error: produced invalid trip clocking profile index");
  }

  writeJson(args.repoRoot, indexOut, index);
  const markdownPath = resolvePath(args.repoRoot, indexMarkdownOut);
  mkdirSync(dirname(markdownPath), { recursive: true });
  writeFileSync(markdownPath, renderIndexMarkdown(index), "utf8");

  return index;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const profiles = asString(args.profiles)
    ?.split(",")
    .map((profile) => profile.trim())
    .filter(Boolean);
  const artifact = publishTripClockingProfileIndex({
    repoRoot: process.cwd(),
    baseDir: asString(args["base-dir"]),
    profiles,
    diagnosticsOutDir: asString(args["diagnostics-out-dir"]),
    indexOut: asString(args.out),
    indexMarkdownOut: asString(args["out-md"]),
    generatedAt: asString(args["generated-at"]),
  });
  process.stdout.write(`${JSON.stringify(artifact, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  main();
}
