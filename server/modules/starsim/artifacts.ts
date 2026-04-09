import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { hashStableJson, sha256Prefixed } from "../../utils/information-boundary";
import type {
  CanonicalStar,
  StarSimArtifactIntegrityStatus,
  StarSimArtifactRef,
  StarSimExternalRuntimeKind,
  StarSimJobRecord,
  StarSimLaneResult,
  StarSimRequest,
  StarSimResponse,
} from "./contract";
import type { StarSimRuntimeArtifactPayload } from "./worker/starsim-worker-types";

export const STAR_SIM_ARTIFACT_SCHEMA_VERSION = "star-sim-cache/4";
export const STAR_SIM_JOB_SCHEMA_VERSION = "star-sim-job/3";

type CacheLaneId = "structure_mesa" | "oscillation_gyre";
type CacheMissReason = "missing" | "stale" | "corrupt" | "incompatible";

type CacheFileEntry = {
  kind: string;
  path: string;
  hash: string;
  size_bytes: number;
};

type BaseCacheManifest = {
  artifact_schema_version: typeof STAR_SIM_ARTIFACT_SCHEMA_VERSION;
  lane_id: CacheLaneId;
  cache_key: string;
  runtime_mode: StarSimExternalRuntimeKind;
  runtime_fingerprint: string;
  solver_manifest: string;
  benchmark_case_id: string | null;
  benchmark_pack_id: string | null;
  fit_profile_id: string | null;
  fit_constraints: Record<string, unknown>;
  supported_domain_id: string | null;
  supported_domain_version: string | null;
  request_hash: string;
  canonical_observables_hash: string;
  created_at: string;
  expires_at: string | null;
  artifact_refs: StarSimArtifactRef[];
  files: CacheFileEntry[];
};

type StructureMesaManifest = BaseCacheManifest;

type OscillationGyreManifest = BaseCacheManifest & {
  parent_structure_cache_key: string;
};

type PersistedJobManifest = {
  artifact_schema_version: typeof STAR_SIM_JOB_SCHEMA_VERSION;
  job: StarSimJobRecord;
  request_path: string;
  request_hash: string;
  result_path: string | null;
  result_hash: string | null;
};

export type StarSimCacheIdentity = {
  runtime_mode: StarSimExternalRuntimeKind;
  runtime_fingerprint: string;
  solver_manifest: string;
};

export type StarSimCacheControls = {
  benchmark_pack_id: string | null;
  fit_profile_id: string | null;
  fit_constraints: Record<string, unknown>;
  supported_domain_id: string | null;
  supported_domain_version: string | null;
};

export type StarSimCacheReadResult =
  | {
      status: "hit";
      manifest: StructureMesaManifest | OscillationGyreManifest;
      laneResult: StarSimLaneResult;
      artifact_integrity_status: "verified";
    }
  | {
      status: "miss";
      miss_reason: CacheMissReason;
      detail: string;
      artifact_integrity_status: StarSimArtifactIntegrityStatus;
    };

type CachePaths = {
  root: string;
  manifestPath: string;
  canonicalRequestPath: string;
  summaryPath: string;
  laneResultPath: string;
  modelPlaceholderPath?: string;
};

const asRelative = (filePath: string): string => path.relative(process.cwd(), filePath).replace(/\\/g, "/");

const resolveFromRelative = (relativePath: string): string => path.resolve(process.cwd(), relativePath);

const readFileHash = async (filePath: string): Promise<string> => sha256Prefixed(await fs.readFile(filePath));

const writeJsonAtomic = async (filePath: string, value: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, filePath);
};

const writeTextAtomic = async (filePath: string, contents: string): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(tempPath, contents, "utf8");
  await fs.rename(tempPath, filePath);
};

const writeBufferAtomic = async (filePath: string, contents: Buffer): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(tempPath, contents);
  await fs.rename(tempPath, filePath);
};

const normalizeHashSegment = (value: string): string => value.replace(/^sha256:/, "");

const getCacheTtlMs = (): number => {
  const value = Number(process.env.STAR_SIM_CACHE_TTL_MS);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
};

const maybeExpiresAt = (createdAt: string): string | null => {
  const ttlMs = getCacheTtlMs();
  if (ttlMs <= 0) {
    return null;
  }
  return new Date(Date.parse(createdAt) + ttlMs).toISOString();
};

const createTempDirectory = async (finalRoot: string): Promise<string> => {
  const parent = path.dirname(finalRoot);
  await fs.mkdir(parent, { recursive: true });
  const tempRoot = path.join(parent, `${path.basename(finalRoot)}.tmp-${process.pid}-${randomUUID()}`);
  await fs.mkdir(tempRoot, { recursive: true });
  return tempRoot;
};

const replaceDirectoryAtomic = async (tempRoot: string, finalRoot: string): Promise<void> => {
  const backupRoot = `${finalRoot}.bak-${process.pid}-${randomUUID()}`;
  let backedUp = false;
  try {
    try {
      await fs.rename(finalRoot, backupRoot);
      backedUp = true;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        throw error;
      }
    }
    await fs.rename(tempRoot, finalRoot);
    if (backedUp) {
      await fs.rm(backupRoot, { recursive: true, force: true });
    }
  } catch (error) {
    if (backedUp) {
      try {
        await fs.rename(backupRoot, finalRoot);
      } catch {
        // Best effort restore; the caller will still get the original error.
      }
    }
    await fs.rm(tempRoot, { recursive: true, force: true });
    throw error;
  }
};

const buildFileEntry = async (args: {
  kind: string;
  stagedPath: string;
  finalPath: string;
}): Promise<CacheFileEntry> => {
  const stat = await fs.stat(args.stagedPath);
  return {
    kind: args.kind,
    path: asRelative(args.finalPath),
    hash: await readFileHash(args.stagedPath),
    size_bytes: stat.size,
  };
};

const ensureFinalizedRefs = (args: {
  manifestPath: string;
  laneResultPath: string;
  files: CacheFileEntry[];
}): StarSimArtifactRef[] => {
  const byPath = new Map(args.files.map((file) => [file.path, file]));
  const refs: StarSimArtifactRef[] = [
    {
      kind: "manifest",
      path: asRelative(args.manifestPath),
      integrity_status: "verified",
    },
    {
      kind: "lane_result",
      path: asRelative(args.laneResultPath),
      integrity_status: "verified",
    },
  ];
  for (const file of args.files) {
    if (file.kind === "lane_result") {
      continue;
    }
    refs.push({
      kind: file.kind,
      path: file.path,
      hash: byPath.get(file.path)?.hash,
      integrity_status: "verified",
    });
  }
  return refs;
};

const validateCacheManifest = async (args: {
  paths: CachePaths;
  expectedCacheKey: string;
  expectedIdentity: StarSimCacheIdentity;
  expectedLaneId: CacheLaneId;
}): Promise<StarSimCacheReadResult> => {
  let rawManifest = "";
  try {
    rawManifest = await fs.readFile(args.paths.manifestPath, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return {
      status: "miss",
      miss_reason: code === "ENOENT" ? "missing" : "corrupt",
      detail: code === "ENOENT" ? "Cache manifest not found." : String(error),
      artifact_integrity_status: code === "ENOENT" ? "missing" : "corrupt",
    };
  }

  let manifest: StructureMesaManifest | OscillationGyreManifest;
  try {
    manifest = JSON.parse(rawManifest) as StructureMesaManifest | OscillationGyreManifest;
  } catch (error) {
    return {
      status: "miss",
      miss_reason: "corrupt",
      detail: `Cache manifest JSON is invalid: ${error instanceof Error ? error.message : String(error)}`,
      artifact_integrity_status: "corrupt",
    };
  }

  if (
    manifest.artifact_schema_version !== STAR_SIM_ARTIFACT_SCHEMA_VERSION
    || manifest.lane_id !== args.expectedLaneId
    || manifest.cache_key !== args.expectedCacheKey
    || manifest.runtime_mode !== args.expectedIdentity.runtime_mode
    || manifest.runtime_fingerprint !== args.expectedIdentity.runtime_fingerprint
    || manifest.solver_manifest !== args.expectedIdentity.solver_manifest
  ) {
    return {
      status: "miss",
      miss_reason: "incompatible",
      detail: "Cache manifest identity no longer matches the current lane/runtime/artifact schema.",
      artifact_integrity_status: "unknown",
    };
  }

  if (manifest.expires_at && Date.now() > Date.parse(manifest.expires_at)) {
    return {
      status: "miss",
      miss_reason: "stale",
      detail: `Cache artifact expired at ${manifest.expires_at}.`,
      artifact_integrity_status: "stale",
    };
  }

  for (const file of manifest.files) {
    const absolutePath = resolveFromRelative(file.path);
    try {
      const stat = await fs.stat(absolutePath);
      if (!stat.isFile()) {
        return {
          status: "miss",
          miss_reason: "corrupt",
          detail: `Cache file is missing or invalid: ${file.path}`,
          artifact_integrity_status: "corrupt",
        };
      }
      const hash = await readFileHash(absolutePath);
      if (hash !== file.hash) {
        return {
          status: "miss",
          miss_reason: "corrupt",
          detail: `Cache file hash mismatch: ${file.path}`,
          artifact_integrity_status: "corrupt",
        };
      }
    } catch (error) {
      return {
        status: "miss",
        miss_reason: "corrupt",
        detail: `Cache file validation failed for ${file.path}: ${error instanceof Error ? error.message : String(error)}`,
        artifact_integrity_status: "corrupt",
      };
    }
  }

  try {
    const rawLaneResult = await fs.readFile(args.paths.laneResultPath, "utf8");
    const laneResult = JSON.parse(rawLaneResult) as StarSimLaneResult;
    return {
      status: "hit",
      manifest,
      laneResult: {
        ...laneResult,
        artifact_refs: manifest.artifact_refs,
        artifact_integrity_status: "verified",
        cache_status: "hit",
      },
      artifact_integrity_status: "verified",
    };
  } catch (error) {
    return {
      status: "miss",
      miss_reason: "corrupt",
      detail: `Lane result validation failed: ${error instanceof Error ? error.message : String(error)}`,
      artifact_integrity_status: "corrupt",
    };
  }
};

const writeCacheBundle = async (args: {
  paths: CachePaths;
  manifest: StructureMesaManifest | OscillationGyreManifest;
  canonicalRequest: Record<string, unknown>;
  summary: Record<string, unknown>;
  laneResult: StarSimLaneResult;
  modelPlaceholder?: Record<string, unknown> | null;
  runtimeArtifacts?: StarSimRuntimeArtifactPayload[];
}): Promise<StarSimArtifactRef[]> => {
  const tempRoot = await createTempDirectory(args.paths.root);
  const stagedPaths: CachePaths = {
    root: tempRoot,
    manifestPath: path.join(tempRoot, "manifest.json"),
    canonicalRequestPath: path.join(tempRoot, path.basename(args.paths.canonicalRequestPath)),
    summaryPath: path.join(tempRoot, path.basename(args.paths.summaryPath)),
    laneResultPath: path.join(tempRoot, "lane-result.json"),
    modelPlaceholderPath: args.paths.modelPlaceholderPath
      ? path.join(tempRoot, path.basename(args.paths.modelPlaceholderPath))
      : undefined,
  };

  try {
    await writeJsonAtomic(stagedPaths.canonicalRequestPath, args.canonicalRequest);
    await writeJsonAtomic(stagedPaths.summaryPath, args.summary);
    if (args.modelPlaceholder && stagedPaths.modelPlaceholderPath) {
      await writeJsonAtomic(stagedPaths.modelPlaceholderPath, args.modelPlaceholder);
    }

    const runtimeArtifactEntries: CacheFileEntry[] = [];
    for (const artifact of args.runtimeArtifacts ?? []) {
      const safeName = path.basename(artifact.file_name);
      const stagedPath = path.join(tempRoot, safeName);
      const finalPath = path.join(args.paths.root, safeName);
      if (artifact.content_encoding === "base64") {
        await writeBufferAtomic(stagedPath, Buffer.from(artifact.content, "base64"));
      } else {
        await writeTextAtomic(stagedPath, artifact.content);
      }
      runtimeArtifactEntries.push(
        await buildFileEntry({
          kind: artifact.kind,
          stagedPath,
          finalPath,
        }),
      );
    }

    const stagedFileEntries: CacheFileEntry[] = [
      await buildFileEntry({
        kind: "canonical_request",
        stagedPath: stagedPaths.canonicalRequestPath,
        finalPath: args.paths.canonicalRequestPath,
      }),
      await buildFileEntry({
        kind: path.basename(stagedPaths.summaryPath).includes("mesa") ? "mesa_summary" : "gyre_summary",
        stagedPath: stagedPaths.summaryPath,
        finalPath: args.paths.summaryPath,
      }),
    ];

    if (args.modelPlaceholder && stagedPaths.modelPlaceholderPath) {
      stagedFileEntries.push(
        await buildFileEntry({
          kind: "gsm_placeholder",
          stagedPath: stagedPaths.modelPlaceholderPath,
          finalPath: args.paths.modelPlaceholderPath!,
        }),
      );
    }
    stagedFileEntries.push(...runtimeArtifactEntries);

    const publicRefsBeforeManifest: StarSimArtifactRef[] = [
      {
        kind: "manifest",
        path: asRelative(args.paths.manifestPath),
        integrity_status: "verified",
      },
      {
        kind: "lane_result",
        path: asRelative(args.paths.laneResultPath),
        integrity_status: "verified",
      },
      ...stagedFileEntries
        .filter((file) => file.kind !== "lane_result")
        .map((file) => ({
          kind: file.kind,
          path: file.path,
          hash: file.hash,
          integrity_status: "verified" as const,
        })),
    ];

    await writeJsonAtomic(stagedPaths.laneResultPath, {
      ...args.laneResult,
      artifact_refs: publicRefsBeforeManifest,
      artifact_integrity_status: "verified",
      cache_status: "hit",
    });
    stagedFileEntries.push(
      await buildFileEntry({
        kind: "lane_result",
        stagedPath: stagedPaths.laneResultPath,
        finalPath: args.paths.laneResultPath,
      }),
    );

    const finalizedRefs = ensureFinalizedRefs({
      manifestPath: args.paths.manifestPath,
      laneResultPath: args.paths.laneResultPath,
      files: stagedFileEntries,
    });

    await writeJsonAtomic(stagedPaths.manifestPath, {
      ...args.manifest,
      artifact_refs: finalizedRefs,
      files: stagedFileEntries,
    });

    await replaceDirectoryAtomic(tempRoot, args.paths.root);
    return finalizedRefs;
  } catch (error) {
    await fs.rm(tempRoot, { recursive: true, force: true });
    throw error;
  }
};

export const resolveStarSimArtifactRoot = (): string =>
  path.resolve(process.env.STAR_SIM_ARTIFACT_ROOT?.trim() || path.join("artifacts", "research", "starsim"));

export const buildStructureMesaCacheKey = (
  star: CanonicalStar,
  identity: StarSimCacheIdentity,
  controls?: Partial<StarSimCacheControls>,
): string =>
  hashStableJson({
    artifact_schema_version: STAR_SIM_ARTIFACT_SCHEMA_VERSION,
    lane: "structure_mesa",
    target: star.target,
    fields: star.fields,
    benchmark_case_id: star.benchmark_case_id,
    benchmark_pack_id: controls?.benchmark_pack_id ?? null,
    fit_profile_id: controls?.fit_profile_id ?? star.fit_profile_id,
    fit_constraints: controls?.fit_constraints ?? star.fit_constraints,
    supported_domain_id: controls?.supported_domain_id ?? null,
    supported_domain_version: controls?.supported_domain_version ?? null,
    physics_flags: star.physics_flags,
    evidence_refs: star.evidence_refs,
    requested_lanes: star.requested_lanes,
    strict_lanes: star.strict_lanes,
    precondition_policy: star.precondition_policy,
    source_context: star.source_context,
    runtime_mode: identity.runtime_mode,
    runtime_fingerprint: identity.runtime_fingerprint,
    solver_manifest: identity.solver_manifest,
  });

export const buildOscillationGyreCacheKey = (
  star: CanonicalStar,
  structureCacheKey: string,
  identity: StarSimCacheIdentity,
  controls?: Partial<StarSimCacheControls>,
): string =>
  hashStableJson({
    artifact_schema_version: STAR_SIM_ARTIFACT_SCHEMA_VERSION,
    lane: "oscillation_gyre",
    target: star.target,
    asteroseismology: star.fields.asteroseismology,
    benchmark_case_id: star.benchmark_case_id,
    benchmark_pack_id: controls?.benchmark_pack_id ?? null,
    fit_profile_id: controls?.fit_profile_id ?? star.fit_profile_id,
    fit_constraints: controls?.fit_constraints ?? star.fit_constraints,
    supported_domain_id: controls?.supported_domain_id ?? null,
    supported_domain_version: controls?.supported_domain_version ?? null,
    physics_flags: star.physics_flags,
    source_context: star.source_context,
    structure_cache_key: structureCacheKey,
    runtime_mode: identity.runtime_mode,
    runtime_fingerprint: identity.runtime_fingerprint,
    solver_manifest: identity.solver_manifest,
  });

export const resolveStructureMesaPaths = (cacheKey: string): CachePaths => {
  const root = path.join(resolveStarSimArtifactRoot(), "mesa", normalizeHashSegment(cacheKey));
  return {
    root,
    manifestPath: path.join(root, "manifest.json"),
    canonicalRequestPath: path.join(root, "canonical-request.json"),
    summaryPath: path.join(root, "mesa-summary.json"),
    laneResultPath: path.join(root, "lane-result.json"),
    modelPlaceholderPath: path.join(root, "model.gsm.h5.placeholder.json"),
  };
};

export const resolveOscillationGyrePaths = (cacheKey: string): CachePaths => {
  const root = path.join(resolveStarSimArtifactRoot(), "gyre", normalizeHashSegment(cacheKey));
  return {
    root,
    manifestPath: path.join(root, "manifest.json"),
    canonicalRequestPath: path.join(root, "canonical-request.json"),
    summaryPath: path.join(root, "gyre-summary.json"),
    laneResultPath: path.join(root, "lane-result.json"),
  };
};

export const resolveStarSimJobPaths = (jobId: string) => {
  const root = path.join(resolveStarSimArtifactRoot(), "jobs", jobId);
  return {
    root,
    requestPath: path.join(root, "request.json"),
    resultPath: path.join(root, "result.json"),
    manifestPath: path.join(root, "manifest.json"),
  };
};

export const readStructureMesaCache = async (
  cacheKey: string,
  identity: StarSimCacheIdentity,
): Promise<StarSimCacheReadResult> =>
  validateCacheManifest({
    paths: resolveStructureMesaPaths(cacheKey),
    expectedCacheKey: cacheKey,
    expectedIdentity: identity,
    expectedLaneId: "structure_mesa",
  });

export const readOscillationGyreCache = async (
  cacheKey: string,
  identity: StarSimCacheIdentity,
): Promise<StarSimCacheReadResult> =>
  validateCacheManifest({
    paths: resolveOscillationGyrePaths(cacheKey),
    expectedCacheKey: cacheKey,
    expectedIdentity: identity,
    expectedLaneId: "oscillation_gyre",
  });

export const writeStructureMesaCache = async (args: {
  star: CanonicalStar;
  cacheKey: string;
  runtimeMode: StarSimExternalRuntimeKind;
  runtimeFingerprint: string;
  solverManifest: string;
  benchmarkCaseId: string | null;
  benchmarkPackId: string | null;
  fitProfileId: string | null;
  fitConstraints: Record<string, unknown>;
  supportedDomainId: string | null;
  supportedDomainVersion: string | null;
  summary: Record<string, unknown>;
  laneResult: StarSimLaneResult;
  modelPlaceholder: Record<string, unknown> | null;
  runtimeArtifacts?: StarSimRuntimeArtifactPayload[];
}): Promise<StarSimArtifactRef[]> => {
  const paths = resolveStructureMesaPaths(args.cacheKey);
  const createdAt = new Date().toISOString();
  const expiresAt = maybeExpiresAt(createdAt);
  return writeCacheBundle({
    paths,
    manifest: {
      artifact_schema_version: STAR_SIM_ARTIFACT_SCHEMA_VERSION,
      lane_id: "structure_mesa",
      cache_key: args.cacheKey,
      runtime_mode: args.runtimeMode,
      runtime_fingerprint: args.runtimeFingerprint,
      solver_manifest: args.solverManifest,
      benchmark_case_id: args.benchmarkCaseId,
      benchmark_pack_id: args.benchmarkPackId,
      fit_profile_id: args.fitProfileId,
      fit_constraints: args.fitConstraints,
      supported_domain_id: args.supportedDomainId,
      supported_domain_version: args.supportedDomainVersion,
      request_hash: hashStableJson({
        target: args.star.target,
        requested_lanes: args.star.requested_lanes,
        evidence_refs: args.star.evidence_refs,
        benchmark_case_id: args.star.benchmark_case_id,
        fit_profile_id: args.fitProfileId,
        fit_constraints: args.fitConstraints,
        benchmark_pack_id: args.benchmarkPackId,
        supported_domain_id: args.supportedDomainId,
        supported_domain_version: args.supportedDomainVersion,
        physics_flags: args.star.physics_flags,
      }),
      canonical_observables_hash: hashStableJson(args.star.fields),
      created_at: createdAt,
      expires_at: expiresAt,
      artifact_refs: [],
      files: [],
    },
    canonicalRequest: {
      schema_version: args.star.schema_version,
      target: args.star.target,
      fields: args.star.fields,
      evidence_refs: args.star.evidence_refs,
      requested_lanes: args.star.requested_lanes,
      strict_lanes: args.star.strict_lanes,
      precondition_policy: args.star.precondition_policy,
      benchmark_case_id: args.star.benchmark_case_id,
      fit_profile_id: args.fitProfileId,
      fit_constraints: args.fitConstraints,
      benchmark_pack_id: args.benchmarkPackId,
      supported_domain_id: args.supportedDomainId,
      supported_domain_version: args.supportedDomainVersion,
      physics_flags: args.star.physics_flags,
      source_context: args.star.source_context,
    },
    summary: args.summary,
    laneResult: args.laneResult,
    modelPlaceholder: args.modelPlaceholder,
    runtimeArtifacts: args.runtimeArtifacts,
  });
};

export const writeOscillationGyreCache = async (args: {
  star: CanonicalStar;
  cacheKey: string;
  parentStructureCacheKey: string;
  runtimeMode: StarSimExternalRuntimeKind;
  runtimeFingerprint: string;
  solverManifest: string;
  benchmarkCaseId: string | null;
  benchmarkPackId: string | null;
  fitProfileId: string | null;
  fitConstraints: Record<string, unknown>;
  supportedDomainId: string | null;
  supportedDomainVersion: string | null;
  summary: Record<string, unknown>;
  laneResult: StarSimLaneResult;
  runtimeArtifacts?: StarSimRuntimeArtifactPayload[];
}): Promise<StarSimArtifactRef[]> => {
  const paths = resolveOscillationGyrePaths(args.cacheKey);
  const createdAt = new Date().toISOString();
  const expiresAt = maybeExpiresAt(createdAt);
  return writeCacheBundle({
    paths,
    manifest: {
      artifact_schema_version: STAR_SIM_ARTIFACT_SCHEMA_VERSION,
      lane_id: "oscillation_gyre",
      cache_key: args.cacheKey,
      parent_structure_cache_key: args.parentStructureCacheKey,
      runtime_mode: args.runtimeMode,
      runtime_fingerprint: args.runtimeFingerprint,
      solver_manifest: args.solverManifest,
      benchmark_case_id: args.benchmarkCaseId,
      benchmark_pack_id: args.benchmarkPackId,
      fit_profile_id: args.fitProfileId,
      fit_constraints: args.fitConstraints,
      supported_domain_id: args.supportedDomainId,
      supported_domain_version: args.supportedDomainVersion,
      request_hash: hashStableJson({
        target: args.star.target,
        requested_lanes: args.star.requested_lanes,
        evidence_refs: args.star.evidence_refs,
        benchmark_case_id: args.star.benchmark_case_id,
        fit_profile_id: args.fitProfileId,
        fit_constraints: args.fitConstraints,
        benchmark_pack_id: args.benchmarkPackId,
        supported_domain_id: args.supportedDomainId,
        supported_domain_version: args.supportedDomainVersion,
        physics_flags: args.star.physics_flags,
      }),
      canonical_observables_hash: hashStableJson(args.star.fields),
      created_at: createdAt,
      expires_at: expiresAt,
      artifact_refs: [],
      files: [],
    },
    canonicalRequest: {
      schema_version: args.star.schema_version,
      target: args.star.target,
      asteroseismology: args.star.fields.asteroseismology,
      structure: args.star.fields.structure,
      evidence_refs: args.star.evidence_refs,
      source_context: args.star.source_context,
      benchmark_case_id: args.star.benchmark_case_id,
      fit_profile_id: args.fitProfileId,
      fit_constraints: args.fitConstraints,
      benchmark_pack_id: args.benchmarkPackId,
      supported_domain_id: args.supportedDomainId,
      supported_domain_version: args.supportedDomainVersion,
      physics_flags: args.star.physics_flags,
    },
    summary: args.summary,
    laneResult: args.laneResult,
    runtimeArtifacts: args.runtimeArtifacts,
  });
};

export const persistStarSimJobArtifacts = async (args: {
  job: StarSimJobRecord;
  request: StarSimRequest | Record<string, unknown>;
  result: StarSimResponse | Record<string, unknown> | null;
}): Promise<void> => {
  const paths = resolveStarSimJobPaths(args.job.job_id);
  await fs.mkdir(paths.root, { recursive: true });
  await writeJsonAtomic(paths.requestPath, args.request);
  const requestHash = await readFileHash(paths.requestPath);
  let resultHash: string | null = null;
  if (args.result !== null) {
    await writeJsonAtomic(paths.resultPath, args.result);
    resultHash = await readFileHash(paths.resultPath);
  }
  const manifest: PersistedJobManifest = {
    artifact_schema_version: STAR_SIM_JOB_SCHEMA_VERSION,
    job: args.job,
    request_path: asRelative(paths.requestPath),
    request_hash: requestHash,
    result_path: args.result === null ? null : asRelative(paths.resultPath),
    result_hash: resultHash,
  };
  await writeJsonAtomic(paths.manifestPath, manifest);
};

export const persistStarSimJobFailure = async (args: {
  job: StarSimJobRecord;
  request: StarSimRequest | Record<string, unknown>;
  error: string;
}): Promise<void> => {
  const paths = resolveStarSimJobPaths(args.job.job_id);
  await fs.mkdir(paths.root, { recursive: true });
  await writeJsonAtomic(paths.requestPath, args.request);
  const requestHash = await readFileHash(paths.requestPath);
  await writeTextAtomic(
    paths.resultPath,
    `${JSON.stringify({ error: args.error, job_id: args.job.job_id }, null, 2)}\n`,
  );
  const resultHash = await readFileHash(paths.resultPath);
  const manifest: PersistedJobManifest = {
    artifact_schema_version: STAR_SIM_JOB_SCHEMA_VERSION,
    job: args.job,
    request_path: asRelative(paths.requestPath),
    request_hash: requestHash,
    result_path: asRelative(paths.resultPath),
    result_hash: resultHash,
  };
  await writeJsonAtomic(paths.manifestPath, manifest);
};

export const readPersistedStarSimJobResult = async (jobId: string): Promise<StarSimResponse | null> => {
  const manifest = await readPersistedStarSimJobManifest(jobId);
  if (!manifest?.result_path || !manifest.result_hash) {
    return null;
  }
  const resultPath = resolveFromRelative(manifest.result_path);
  try {
    const hash = await readFileHash(resultPath);
    if (hash !== manifest.result_hash) {
      return null;
    }
    const raw = await fs.readFile(resultPath, "utf8");
    return JSON.parse(raw) as StarSimResponse;
  } catch {
    return null;
  }
};

export const readPersistedStarSimJobManifest = async (jobId: string): Promise<PersistedJobManifest | null> => {
  const paths = resolveStarSimJobPaths(jobId);
  try {
    const raw = await fs.readFile(paths.manifestPath, "utf8");
    const manifest = JSON.parse(raw) as PersistedJobManifest;
    if (manifest.artifact_schema_version !== STAR_SIM_JOB_SCHEMA_VERSION) {
      return null;
    }
    return manifest;
  } catch {
    return null;
  }
};

export const listPersistedStarSimJobManifests = async (): Promise<PersistedJobManifest[]> => {
  const jobsRoot = path.join(resolveStarSimArtifactRoot(), "jobs");
  try {
    const entries = await fs.readdir(jobsRoot, { withFileTypes: true });
    const manifests = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => readPersistedStarSimJobManifest(entry.name)),
    );
    return manifests.filter((manifest): manifest is PersistedJobManifest => manifest !== null);
  } catch {
    return [];
  }
};
