import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, normalize, posix, win32 } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

import {
  buildNhm2ReferenceRunArtifact,
  type Nhm2ReferenceRunArtifact,
} from "../../shared/contracts/nhm2-reference-run.v1";

type ArtifactRef = { artifactId: string; path: string };
type ArtifactSetEntry = Nhm2ReferenceRunArtifact["artifactSet"][number];

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

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

const quoteCommandArg = (value: string): string =>
  /\s/.test(value) ? JSON.stringify(value) : value;

export const renderPortableInvocation = (
  argv: readonly string[],
  repoRoot: string,
): string =>
  argv
    .map((value: string) => {
      const flavor = win32.isAbsolute(value)
        ? win32
        : posix.isAbsolute(value)
          ? posix
          : null;
      if (flavor == null) return quoteCommandArg(value);
      const repoRootUsesSameFlavor = flavor.isAbsolute(repoRoot);
      const repoRelative = repoRootUsesSameFlavor
        ? flavor.relative(repoRoot, value)
        : null;
      const portable =
        repoRelative != null &&
        repoRelative.length > 0 &&
        !repoRelative.startsWith("..") &&
        !flavor.isAbsolute(repoRelative)
          ? repoRelative.replace(/\\/g, "/")
          : flavor.basename(value);
      return quoteCommandArg(portable);
    })
    .join(" ");

const sha256Buffer = (buffer: Buffer | string): string =>
  createHash("sha256").update(buffer).digest("hex");

const sha256File = (path: string): string | null =>
  existsSync(path) && statSync(path).isFile()
    ? sha256Buffer(readFileSync(path))
    : null;

const readJson = (path: string): Record<string, unknown> | null => {
  if (!existsSync(path)) return null;
  try {
    return asRecord(JSON.parse(readFileSync(path, "utf8")));
  } catch {
    return null;
  }
};

const git = (repoRoot: string, args: string[]): string | null => {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
};

const extractProfileId = (artifact: Record<string, unknown> | null): string | null =>
  asString(artifact?.shiftLapseProfileId) ??
  asString(artifact?.selectedProfileId) ??
  asString(artifact?.profileId) ??
  asString(asRecord(artifact?.selectedFamily)?.selectedProfileId) ??
  asString(asRecord(artifact?.family_semantics)?.selectedProfileId);

const extractGeneratedAt = (artifact: Record<string, unknown> | null): string | null =>
  asString(artifact?.generatedAt) ?? asString(artifact?.allArtifactsGeneratedAt);

const extractStatus = (artifact: Record<string, unknown> | null): string | null =>
  asString(artifact?.status) ?? asString(artifact?.overallState);

const extractSchemaVersion = (artifact: Record<string, unknown> | null): string | null =>
  asString(artifact?.schemaVersion) ?? asString(artifact?.contractVersion);

const pathUsesLatestAlias = (path: string): boolean =>
  /(^|[-/\\])latest(\.|[-/\\]|$)/i.test(path);

const findFullLoopAuditPath = (artifactRoot: string): string | null => {
  const latestPath = join(artifactRoot, "nhm2-full-loop-audit-latest.json");
  if (existsSync(latestPath)) return latestPath;
  const candidates = readdirSync(artifactRoot)
    .filter((name: string) =>
      /^nhm2-full-loop-audit-\d{4}-\d{2}-\d{2}\.json$/.test(name),
    )
    .sort();
  const last = candidates.at(-1);
  return last == null ? null : join(artifactRoot, last);
};

const collectArtifactRefs = (
  fullLoopAudit: Record<string, unknown> | null,
): ArtifactRef[] => {
  const refs: ArtifactRef[] = [];
  const sections = asRecord(fullLoopAudit?.sections);
  if (sections == null) return refs;
  for (const section of Object.values(sections)) {
    const artifactRefs = asRecord(section)?.artifactRefs;
    if (!Array.isArray(artifactRefs)) continue;
    for (const ref of artifactRefs) {
      const record = asRecord(ref);
      const artifactId = asString(record?.artifactId);
      const path = asString(record?.path);
      if (artifactId != null && path != null) refs.push({ artifactId, path });
    }
  }
  return refs;
};

export const freezeNhm2ReferenceRun = (args: {
  repoRoot: string;
  profile: string;
  runId: string;
  artifactRoot: string;
  out: string;
  auditOnly?: boolean;
  repositoryFullName?: string;
}): Nhm2ReferenceRunArtifact => {
  const artifactRoot = resolvePath(args.repoRoot, args.artifactRoot);
  const fullLoopPath = findFullLoopAuditPath(artifactRoot);
  const fullLoopAudit = fullLoopPath == null ? null : readJson(fullLoopPath);
  const artifactRefs = collectArtifactRefs(fullLoopAudit);
  if (fullLoopPath != null) {
    artifactRefs.unshift({
      artifactId: "nhm2_full_loop",
      path: normalize(fullLoopPath).startsWith(normalize(args.repoRoot))
        ? normalize(fullLoopPath).slice(normalize(args.repoRoot).length + 1)
        : fullLoopPath,
    });
  }

  const artifactSet: ArtifactSetEntry[] = artifactRefs.map(
    (ref: ArtifactRef): ArtifactSetEntry => {
      const artifactPath = resolvePath(args.repoRoot, ref.path);
      const json = readJson(artifactPath);
      const profileId = extractProfileId(json);
      return {
        artifactId: ref.artifactId,
        path: ref.path,
        schemaVersion: extractSchemaVersion(json),
        status: extractStatus(json),
        sha256: sha256File(artifactPath),
        generatedAt: extractGeneratedAt(json),
        usesLatestAlias: pathUsesLatestAlias(ref.path),
        profileId,
        profileMatch: profileId == null ? null : profileId === args.profile,
      };
    },
  );

  const latestAliasEntries = artifactSet.filter(
    (entry: ArtifactSetEntry) => entry.usesLatestAlias,
  );
  const profileMismatchEntries = artifactSet.filter(
    (entry: ArtifactSetEntry) => entry.profileMatch === false,
  );
  if (!args.auditOnly && latestAliasEntries.length > 0) {
    throw new Error(
      `latest aliases are forbidden in validation mode: ${latestAliasEntries
        .map((entry: ArtifactSetEntry) => entry.path)
        .join(", ")}`,
    );
  }
  if (!args.auditOnly && profileMismatchEntries.length > 0) {
    throw new Error(
      `profile mismatch is a hard blocker: ${profileMismatchEntries
        .map((entry: ArtifactSetEntry) => `${entry.path}:${entry.profileId}`)
        .join(", ")}`,
    );
  }

  const dirtyStatus = git(args.repoRoot, ["status", "--porcelain"]);
  const commitSha = git(args.repoRoot, ["rev-parse", "HEAD"]) ?? "unknown";
  const branch = git(args.repoRoot, ["branch", "--show-current"]) ?? "unknown";
  const remoteUrl = git(args.repoRoot, ["config", "--get", "remote.origin.url"]);
  const repositoryFullName =
    args.repositoryFullName ??
    remoteUrl?.match(/[:/]([^/:]+\/[^/]+?)(?:\.git)?$/)?.[1] ??
    "unknown/unknown";

  const artifactSetSha256 = sha256Buffer(JSON.stringify(artifactSet, null, 2));
  const literaturePath = resolvePath(
    args.repoRoot,
    "docs/research/nhm2-literature-claim-map.v1.json",
  );
  const toleranceCandidates = [
    resolvePath(args.repoRoot, "artifacts/research/full-solve/tolerance-manifest.json"),
    resolvePath(args.repoRoot, "configs/nhm2/tolerance-manifest.json"),
  ];

  const blockingReasons = [
    ...latestAliasEntries.map(
      (entry: ArtifactSetEntry) => `latest_alias:${entry.path}`,
    ),
    ...profileMismatchEntries.map(
      (entry: ArtifactSetEntry) => `profile_mismatch:${entry.path}`,
    ),
    ...((Array.isArray(fullLoopAudit?.blockingReasons)
      ? fullLoopAudit?.blockingReasons
      : []) as unknown[]).filter((entry): entry is string => typeof entry === "string"),
  ];
  const fullLoopSections = asRecord(fullLoopAudit?.sections);
  const familySemantics = asRecord(fullLoopSections?.family_semantics);
  const selectedProfileId =
    asString(familySemantics?.selectedProfileId) ?? args.profile;

  const referenceRun = buildNhm2ReferenceRunArtifact({
    generatedAt: new Date().toISOString(),
    runId: args.runId,
    repo: {
      repositoryFullName,
      branch,
      commitSha,
      dirtyTreeStatus:
        dirtyStatus == null ? "unknown" : dirtyStatus.length > 0 ? "dirty" : "clean",
    },
    selectedFamily: {
      laneId: "nhm2_shift_lapse",
      selectedProfileId,
      expectedProfileId: args.profile,
      profileMatch: true,
    },
    claimLock: {
      currentClaimTier:
        fullLoopAudit?.currentClaimTier === "diagnostic" ||
        fullLoopAudit?.currentClaimTier === "reduced-order" ||
        fullLoopAudit?.currentClaimTier === "certified"
          ? fullLoopAudit.currentClaimTier
          : "unknown",
      maximumClaimTier:
        fullLoopAudit?.maximumClaimTier === "diagnostic" ||
        fullLoopAudit?.maximumClaimTier === "reduced-order" ||
        fullLoopAudit?.maximumClaimTier === "certified"
          ? fullLoopAudit.maximumClaimTier
          : "unknown",
      validationMode: "red_team_hardening",
      validationClaimAllowed: false,
      latestAliasForbidden: true,
    },
    commands: [
      {
        id: "freeze_reference_run",
        command: renderPortableInvocation(process.argv, args.repoRoot),
        status: "pass",
        startedAt: null,
        completedAt: new Date().toISOString(),
      },
    ],
    artifactSet,
    hashLock: {
      inputManifestSha256: null,
      toleranceManifestSha256:
        toleranceCandidates
          .map((candidatePath: string): string | null => sha256File(candidatePath))
          .find((hash: string | null): hash is string => hash != null) ?? null,
      artifactSetSha256,
      literatureClaimMapSha256: sha256File(literaturePath),
    },
    blockerSummary: {
      overallState:
        fullLoopAudit?.overallState === "pass" ||
        fullLoopAudit?.overallState === "review" ||
        fullLoopAudit?.overallState === "fail"
          ? fullLoopAudit.overallState
          : blockingReasons.length > 0
            ? "review"
            : "unknown",
      blockingReasons,
      observerConsistencyStatus: "unknown",
      sourceClosureRegionalStatus: "unknown",
      qeiDossierStatus: "missing",
      reproducibilityStatus: "missing",
    },
  });

  const outPath = resolvePath(args.repoRoot, args.out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(referenceRun, null, 2)}\n`, "utf8");
  return referenceRun;
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const profile = asString(args.profile) ?? "stage1_centerline_alpha_0p995_v1";
  const runId =
    asString(args["run-id"]) ??
    `nhm2-reference-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const artifactRoot =
    asString(args["artifact-root"]) ?? "artifacts/research/full-solve";
  const out =
    asString(args.out) ??
    `artifacts/research/full-solve/reference/nhm2-reference-run-${runId}.json`;
  const referenceRun = freezeNhm2ReferenceRun({
    repoRoot: process.cwd(),
    profile,
    runId,
    artifactRoot,
    out,
    auditOnly: args["audit-only"] === true,
  });
  process.stdout.write(`${JSON.stringify(referenceRun, null, 2)}\n`);
};

const invokedPath = process.argv[1] ? normalize(process.argv[1]) : "";
if (invokedPath === normalize(fileURLToPath(import.meta.url))) {
  main();
}
