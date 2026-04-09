import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { sha256Prefixed } from "../../../utils/information-boundary";
import {
  resolveStarSimArtifactRoot,
} from "../artifacts";
import type {
  StarSimArtifactRef,
  StarSimResolveResponse,
  StarSimSourceFetchMode,
} from "../contract";
import type {
  StarSimSourceCacheIdentity,
  StarSimSourceCacheReadResult,
  StarSimSourceCacheWriteArgs,
  StarSimSourceCacheWriteResult,
  StarSimSourceRecord,
} from "./types";
import { STAR_SIM_SOURCE_CACHE_SCHEMA_VERSION } from "./types";

type SourceCacheFileEntry = {
  kind: string;
  path: string;
  hash: string;
  size_bytes: number;
};

type SourceCacheManifest = {
  artifact_schema_version: typeof STAR_SIM_SOURCE_CACHE_SCHEMA_VERSION;
  cache_key: string;
  request_hash: string;
  registry_version: string;
  adapter_versions: Record<string, string>;
  fetch_modes: Record<string, Exclude<StarSimSourceFetchMode, "cache">>;
  runtime_identities: Record<string, string>;
  created_at: string;
  expires_at: string | null;
  artifact_refs: StarSimArtifactRef[];
  files: SourceCacheFileEntry[];
};

type SourceCachePaths = {
  root: string;
  manifestPath: string;
  requestPath: string;
  resolvedRequestPath: string;
  responsePath: string;
  selectionManifestPath: string;
};

const asRelative = (filePath: string): string => path.relative(process.cwd(), filePath).replace(/\\/g, "/");

const resolveFromRelative = (relativePath: string): string => path.resolve(process.cwd(), relativePath);

const normalizeHashSegment = (value: string): string => value.replace(/^sha256:/, "");

const readFileHash = async (filePath: string): Promise<string> => sha256Prefixed(await fs.readFile(filePath));

const writeJsonAtomic = async (filePath: string, value: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, filePath);
};

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
        // best effort restore
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
}): Promise<SourceCacheFileEntry> => {
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
  files: SourceCacheFileEntry[];
}): StarSimArtifactRef[] => {
  const refs: StarSimArtifactRef[] = [
    {
      kind: "manifest",
      path: asRelative(args.manifestPath),
      integrity_status: "verified",
    },
  ];
  for (const file of args.files) {
    refs.push({
      kind: file.kind,
      path: file.path,
      hash: file.hash,
      integrity_status: "verified",
    });
  }
  return refs;
};

const safeFileStem = (value: string): string =>
  value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "record";

export const resolveStarSimSourceCachePaths = (cacheKey: string): SourceCachePaths => {
  const root = path.join(resolveStarSimArtifactRoot(), "sources", normalizeHashSegment(cacheKey));
  return {
    root,
    manifestPath: path.join(root, "manifest.json"),
    requestPath: path.join(root, "resolution-request.json"),
    resolvedRequestPath: path.join(root, "canonical-request.json"),
    responsePath: path.join(root, "resolve-response.json"),
    selectionManifestPath: path.join(root, "selection-manifest.json"),
  };
};

export const readStarSimSourceCache = async (args: {
  cacheKey: string;
  cacheIdentity: StarSimSourceCacheIdentity;
}): Promise<StarSimSourceCacheReadResult> => {
  const paths = resolveStarSimSourceCachePaths(args.cacheKey);
  let rawManifest = "";
  try {
    rawManifest = await fs.readFile(paths.manifestPath, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return {
      status: "miss",
      miss_reason: code === "ENOENT" ? "missing" : "corrupt",
      detail: code === "ENOENT" ? "Source manifest not found." : String(error),
      artifact_integrity_status: code === "ENOENT" ? "missing" : "corrupt",
    };
  }

  let manifest: SourceCacheManifest;
  try {
    manifest = JSON.parse(rawManifest) as SourceCacheManifest;
  } catch (error) {
    return {
      status: "miss",
      miss_reason: "corrupt",
      detail: `Source manifest JSON is invalid: ${error instanceof Error ? error.message : String(error)}`,
      artifact_integrity_status: "corrupt",
    };
  }

  if (
    manifest.artifact_schema_version !== STAR_SIM_SOURCE_CACHE_SCHEMA_VERSION
    || manifest.cache_key !== args.cacheKey
    || manifest.registry_version !== args.cacheIdentity.registry_version
    || JSON.stringify(manifest.fetch_modes) !== JSON.stringify(args.cacheIdentity.fetch_modes)
    || JSON.stringify(manifest.runtime_identities) !== JSON.stringify(args.cacheIdentity.runtime_identities)
    || JSON.stringify(manifest.adapter_versions) !== JSON.stringify(args.cacheIdentity.adapter_versions)
  ) {
    return {
      status: "miss",
      miss_reason: "incompatible",
      detail: "Source cache identity no longer matches the current registry or adapter versions.",
      artifact_integrity_status: "unknown",
    };
  }

  if (manifest.expires_at && Date.now() > Date.parse(manifest.expires_at)) {
    return {
      status: "miss",
      miss_reason: "stale",
      detail: `Source cache artifact expired at ${manifest.expires_at}.`,
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
          detail: `Source cache file is missing or invalid: ${file.path}`,
          artifact_integrity_status: "corrupt",
        };
      }
      const hash = await readFileHash(absolutePath);
      if (hash !== file.hash) {
        return {
          status: "miss",
          miss_reason: "corrupt",
          detail: `Source cache file hash mismatch: ${file.path}`,
          artifact_integrity_status: "corrupt",
        };
      }
    } catch (error) {
      return {
        status: "miss",
        miss_reason: "corrupt",
        detail: `Source cache validation failed for ${file.path}: ${error instanceof Error ? error.message : String(error)}`,
        artifact_integrity_status: "corrupt",
      };
    }
  }

  try {
    const rawResponse = await fs.readFile(paths.responsePath, "utf8");
    const response = JSON.parse(rawResponse) as StarSimResolveResponse;
    return {
      status: "hit",
      artifact_integrity_status: "verified",
      response: {
        ...response,
        source_resolution: {
          ...response.source_resolution,
          cache_status: "hit",
          fetch_mode: "cache",
          fetch_modes_by_catalog: response.source_resolution.fetch_modes_by_catalog,
          artifact_integrity_status: "verified",
          artifact_refs: manifest.artifact_refs,
        },
      },
    };
  } catch (error) {
    return {
      status: "miss",
      miss_reason: "corrupt",
      detail: `Source cache response validation failed: ${error instanceof Error ? error.message : String(error)}`,
      artifact_integrity_status: "corrupt",
    };
  }
};

export const writeStarSimSourceCache = async (
  args: StarSimSourceCacheWriteArgs,
): Promise<StarSimSourceCacheWriteResult> => {
  const paths = resolveStarSimSourceCachePaths(args.cache_key);
  const tempRoot = await createTempDirectory(paths.root);
  const stagedPaths = {
    root: tempRoot,
    manifestPath: path.join(tempRoot, "manifest.json"),
    requestPath: path.join(tempRoot, "resolution-request.json"),
    resolvedRequestPath: path.join(tempRoot, "canonical-request.json"),
    responsePath: path.join(tempRoot, "resolve-response.json"),
    selectionManifestPath: path.join(tempRoot, "selection-manifest.json"),
  };

  try {
    await writeJsonAtomic(stagedPaths.requestPath, args.request);
    await writeJsonAtomic(stagedPaths.resolvedRequestPath, args.response.canonical_request_draft);
    await writeJsonAtomic(stagedPaths.responsePath, {
      ...args.response,
      source_resolution: {
        ...args.response.source_resolution,
        artifact_refs: [],
      },
    });
    await writeJsonAtomic(stagedPaths.selectionManifestPath, args.selection_manifest);

    const fileEntries: SourceCacheFileEntry[] = [
      await buildFileEntry({ kind: "resolution_request", stagedPath: stagedPaths.requestPath, finalPath: paths.requestPath }),
      await buildFileEntry({ kind: "canonical_request", stagedPath: stagedPaths.resolvedRequestPath, finalPath: paths.resolvedRequestPath }),
      await buildFileEntry({ kind: "resolve_response", stagedPath: stagedPaths.responsePath, finalPath: paths.responsePath }),
      await buildFileEntry({ kind: "selection_manifest", stagedPath: stagedPaths.selectionManifestPath, finalPath: paths.selectionManifestPath }),
    ];

    for (const record of args.raw_records) {
      const fileName = `${record.catalog}.${safeFileStem(record.record_id)}.raw.json`;
      const stagedPath = path.join(tempRoot, fileName);
      const finalPath = path.join(paths.root, fileName);
      await writeJsonAtomic(stagedPath, record.raw_payload);
      fileEntries.push(await buildFileEntry({ kind: `${record.catalog}_raw`, stagedPath, finalPath }));
    }

    const createdAt = new Date().toISOString();
    const manifest: SourceCacheManifest = {
      artifact_schema_version: STAR_SIM_SOURCE_CACHE_SCHEMA_VERSION,
      cache_key: args.cache_key,
      request_hash: args.request_hash,
      registry_version: args.cache_identity.registry_version,
      adapter_versions: args.cache_identity.adapter_versions,
      fetch_modes: args.cache_identity.fetch_modes,
      runtime_identities: args.cache_identity.runtime_identities,
      created_at: createdAt,
      expires_at: maybeExpiresAt(createdAt),
      artifact_refs: [],
      files: fileEntries,
    };
    const artifactRefs = ensureFinalizedRefs({
      manifestPath: paths.manifestPath,
      files: fileEntries,
    });
    manifest.artifact_refs = artifactRefs;
    await writeJsonAtomic(stagedPaths.manifestPath, manifest);

    await replaceDirectoryAtomic(tempRoot, paths.root);
    return {
      artifact_refs: artifactRefs,
    };
  } catch (error) {
    await fs.rm(tempRoot, { recursive: true, force: true });
    throw error;
  }
};
