import fs from "node:fs/promises";
import path from "node:path";
import { hashStableJson, sha256Prefixed } from "../../utils/information-boundary";
import type { CanonicalStar, StarSimArtifactRef, StarSimLaneResult } from "./contract";

type StructureMesaManifest = {
  schema_version: "star-sim-cache/1";
  lane_id: "structure_mesa";
  cache_key: string;
  runtime_kind: string;
  solver_id: string;
  benchmark_case_id: string | null;
  request_hash: string;
  canonical_observables_hash: string;
  created_at_iso: string;
  artifact_refs: StarSimArtifactRef[];
};

type OscillationGyreManifest = {
  schema_version: "star-sim-cache/1";
  lane_id: "oscillation_gyre";
  cache_key: string;
  parent_structure_cache_key: string;
  runtime_kind: string;
  solver_id: string;
  benchmark_case_id: string | null;
  request_hash: string;
  canonical_observables_hash: string;
  created_at_iso: string;
  artifact_refs: StarSimArtifactRef[];
};

const asRelative = (filePath: string): string =>
  path.relative(process.cwd(), filePath).replace(/\\/g, "/");

const hashFile = async (filePath: string): Promise<string> =>
  sha256Prefixed(await fs.readFile(filePath));

const writeJson = async (filePath: string, value: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const writeText = async (filePath: string, contents: string): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
};

const normalizeHashSegment = (value: string): string => value.replace(/^sha256:/, "");

export const resolveStarSimArtifactRoot = (): string =>
  path.resolve(process.env.STAR_SIM_ARTIFACT_ROOT?.trim() || path.join("artifacts", "research", "starsim"));

export const buildStructureMesaCacheKey = (star: CanonicalStar): string =>
  hashStableJson({
    lane: "structure_mesa",
    target: star.target,
    fields: star.fields,
    evidence_refs: star.evidence_refs,
    strict_lanes: star.strict_lanes,
    solver_manifest: "structure_mesa/1",
  });

export const buildOscillationGyreCacheKey = (
  star: CanonicalStar,
  structureCacheKey: string,
): string =>
  hashStableJson({
    lane: "oscillation_gyre",
    target: star.target,
    asteroseismology: star.fields.asteroseismology,
    structure_cache_key: structureCacheKey,
    solver_manifest: "oscillation_gyre/1",
  });

export const resolveStructureMesaPaths = (cacheKey: string) => {
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

export const resolveOscillationGyrePaths = (cacheKey: string) => {
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

export const readCachedLaneResult = async (laneResultPath: string): Promise<StarSimLaneResult | null> => {
  try {
    const raw = await fs.readFile(laneResultPath, "utf8");
    return JSON.parse(raw) as StarSimLaneResult;
  } catch {
    return null;
  }
};

export const writeStructureMesaCache = async (args: {
  star: CanonicalStar;
  cacheKey: string;
  runtimeKind: string;
  benchmarkCaseId: string | null;
  summary: Record<string, unknown>;
  laneResult: StarSimLaneResult;
  modelPlaceholder: Record<string, unknown> | null;
}): Promise<StarSimArtifactRef[]> => {
  const paths = resolveStructureMesaPaths(args.cacheKey);
  await writeJson(paths.canonicalRequestPath, {
    schema_version: args.star.schema_version,
    target: args.star.target,
    fields: args.star.fields,
    evidence_refs: args.star.evidence_refs,
  });
  await writeJson(paths.summaryPath, args.summary);
  if (args.modelPlaceholder) {
    await writeJson(paths.modelPlaceholderPath, args.modelPlaceholder);
  }

  const laneArtifacts: StarSimArtifactRef[] = [
    { kind: "canonical_request", path: asRelative(paths.canonicalRequestPath) },
    { kind: "mesa_summary", path: asRelative(paths.summaryPath) },
  ];
  if (args.modelPlaceholder) {
    laneArtifacts.push({
      kind: "gsm_placeholder",
      path: asRelative(paths.modelPlaceholderPath),
    });
  }

  await writeJson(paths.laneResultPath, {
    ...args.laneResult,
    artifact_refs: laneArtifacts,
  });

  laneArtifacts.push({
    kind: "lane_result",
    path: asRelative(paths.laneResultPath),
  });

  const manifest: StructureMesaManifest = {
    schema_version: "star-sim-cache/1",
    lane_id: "structure_mesa",
    cache_key: args.cacheKey,
    runtime_kind: args.runtimeKind,
    solver_id: args.laneResult.solver_id,
    benchmark_case_id: args.benchmarkCaseId,
    request_hash: hashStableJson({
      target: args.star.target,
      requested_lanes: args.star.requested_lanes,
      evidence_refs: args.star.evidence_refs,
    }),
    canonical_observables_hash: hashStableJson(args.star.fields),
    created_at_iso: new Date().toISOString(),
    artifact_refs: laneArtifacts,
  };
  await writeJson(paths.manifestPath, manifest);
  laneArtifacts.unshift({
    kind: "manifest",
    path: asRelative(paths.manifestPath),
  });

  const finalized = await Promise.all(
    laneArtifacts.map(async (artifact) => ({
      ...artifact,
      hash:
        artifact.kind === "manifest" || artifact.kind === "lane_result"
          ? undefined
          : await hashFile(path.resolve(artifact.path)),
    })),
  );

  await writeJson(paths.manifestPath, {
    ...manifest,
    artifact_refs: finalized,
  });
  await writeJson(paths.laneResultPath, {
    ...args.laneResult,
    artifact_refs: finalized,
  });
  return finalized;
};

export const writeOscillationGyreCache = async (args: {
  star: CanonicalStar;
  cacheKey: string;
  parentStructureCacheKey: string;
  runtimeKind: string;
  benchmarkCaseId: string | null;
  summary: Record<string, unknown>;
  laneResult: StarSimLaneResult;
}): Promise<StarSimArtifactRef[]> => {
  const paths = resolveOscillationGyrePaths(args.cacheKey);
  await writeJson(paths.canonicalRequestPath, {
    schema_version: args.star.schema_version,
    target: args.star.target,
    asteroseismology: args.star.fields.asteroseismology,
    structure: args.star.fields.structure,
  });
  await writeJson(paths.summaryPath, args.summary);

  const laneArtifacts: StarSimArtifactRef[] = [
    { kind: "canonical_request", path: asRelative(paths.canonicalRequestPath) },
    { kind: "gyre_summary", path: asRelative(paths.summaryPath) },
  ];

  await writeJson(paths.laneResultPath, {
    ...args.laneResult,
    artifact_refs: laneArtifacts,
  });
  laneArtifacts.push({
    kind: "lane_result",
    path: asRelative(paths.laneResultPath),
  });

  const manifest: OscillationGyreManifest = {
    schema_version: "star-sim-cache/1",
    lane_id: "oscillation_gyre",
    cache_key: args.cacheKey,
    parent_structure_cache_key: args.parentStructureCacheKey,
    runtime_kind: args.runtimeKind,
    solver_id: args.laneResult.solver_id,
    benchmark_case_id: args.benchmarkCaseId,
    request_hash: hashStableJson({
      target: args.star.target,
      requested_lanes: args.star.requested_lanes,
      evidence_refs: args.star.evidence_refs,
    }),
    canonical_observables_hash: hashStableJson(args.star.fields),
    created_at_iso: new Date().toISOString(),
    artifact_refs: laneArtifacts,
  };
  await writeJson(paths.manifestPath, manifest);
  laneArtifacts.unshift({
    kind: "manifest",
    path: asRelative(paths.manifestPath),
  });

  const finalized = await Promise.all(
    laneArtifacts.map(async (artifact) => ({
      ...artifact,
      hash:
        artifact.kind === "manifest" || artifact.kind === "lane_result"
          ? undefined
          : await hashFile(path.resolve(artifact.path)),
    })),
  );

  await writeJson(paths.manifestPath, {
    ...manifest,
    artifact_refs: finalized,
  });
  await writeJson(paths.laneResultPath, {
    ...args.laneResult,
    artifact_refs: finalized,
  });
  return finalized;
};

export const persistStarSimJobArtifacts = async (args: {
  jobId: string;
  request: Record<string, unknown>;
  result: Record<string, unknown>;
  status: string;
  error?: string | null;
}): Promise<void> => {
  const paths = resolveStarSimJobPaths(args.jobId);
  await writeJson(paths.requestPath, args.request);
  await writeJson(paths.resultPath, args.result);
  await writeJson(paths.manifestPath, {
    schema_version: "star-sim-job/1",
    job_id: args.jobId,
    status: args.status,
    error: args.error ?? null,
    created_at_iso: new Date().toISOString(),
    request_path: asRelative(paths.requestPath),
    result_path: asRelative(paths.resultPath),
  });
};

export const persistStarSimJobFailure = async (args: {
  jobId: string;
  request: Record<string, unknown>;
  error: string;
}): Promise<void> => {
  const paths = resolveStarSimJobPaths(args.jobId);
  await writeJson(paths.requestPath, args.request);
  await writeText(
    paths.resultPath,
    `${JSON.stringify({ error: args.error, job_id: args.jobId }, null, 2)}\n`,
  );
  await writeJson(paths.manifestPath, {
    schema_version: "star-sim-job/1",
    job_id: args.jobId,
    status: "failed",
    error: args.error,
    created_at_iso: new Date().toISOString(),
    request_path: asRelative(paths.requestPath),
    result_path: asRelative(paths.resultPath),
  });
};
