import fs from "node:fs/promises";
import path from "node:path";
import {
  CollapseBenchmarkManifest,
  type TCollapseBenchmarkManifest,
  type TCollapseBenchmarkRunInput,
} from "@shared/collapse-benchmark";
import { executeCollapseRun } from "../server/services/collapse-benchmark";
import { hashStableJson } from "../server/utils/information-boundary";

export type CollapseBenchmarkReportRun = {
  id: string;
  data_cutoff_iso: string;
  result: ReturnType<typeof executeCollapseRun>;
  run_hash: string;
};

export type CollapseBenchmarkReport = {
  schema_version: "collapse_benchmark_report/1";
  kind: "collapse_benchmark_report";
  manifest_created_at: string;
  generated_at_iso: string;
  manifest_path?: string;
  runs: CollapseBenchmarkReportRun[];
  report_hash: string;
};

const DEFAULT_MANIFEST_PATH = path.resolve(process.cwd(), "datasets", "benchmarks", "collapse-benchmark.fixture.json");

export async function loadCollapseBenchmarkManifest(manifestPath = DEFAULT_MANIFEST_PATH): Promise<TCollapseBenchmarkManifest> {
  const src = await fs.readFile(manifestPath, "utf8");
  const parsed = CollapseBenchmarkManifest.parse(JSON.parse(src));
  return parsed;
}

function computeRunHash(run: { id: string; result: ReturnType<typeof executeCollapseRun> }): string {
  return hashStableJson({
    id: run.id,
    inputs_hash: run.result.inputs_hash,
    features_hash: run.result.features_hash,
    p_trigger: run.result.p_trigger,
    trigger_count: run.result.trigger_count,
    trigger_rate: run.result.trigger_rate,
    tau_ms: run.result.tau_ms,
    r_c_m: run.result.r_c_m,
    tau_source: run.result.tau_source,
    r_c_source: run.result.r_c_source,
    histogram_u: run.result.histogram_u,
    estimator: run.result.tau_estimator ?? null,
  });
}

type RunManifestOptions = {
  manifest_path?: string;
  generated_at_iso?: string;
  data_cutoff_iso?: string;
};

export function normalizeManifest(manifest: TCollapseBenchmarkManifest): TCollapseBenchmarkManifest {
  return CollapseBenchmarkManifest.parse(manifest);
}

export function runCollapseBenchmarkManifest(
  manifest: TCollapseBenchmarkManifest,
  opts: RunManifestOptions = {},
): CollapseBenchmarkReport {
  const normalized = normalizeManifest(manifest);
  const runs: CollapseBenchmarkReportRun[] = normalized.runs.map((entry) => {
    const data_cutoff_iso = opts.data_cutoff_iso ?? entry.asOf ?? normalized.created_at;
    const result = executeCollapseRun(entry.run as TCollapseBenchmarkRunInput, data_cutoff_iso);
    const run_hash = computeRunHash({ id: entry.id, result });
    return { id: entry.id, data_cutoff_iso, result, run_hash };
  });

  const generated_at_iso = opts.generated_at_iso ?? new Date().toISOString();
  const report_hash = hashStableJson({
    manifest_created_at: normalized.created_at,
    runs: runs.map((r) => ({ id: r.id, run_hash: r.run_hash, inputs_hash: r.result.inputs_hash, features_hash: r.result.features_hash })),
  });

  return {
    schema_version: "collapse_benchmark_report/1",
    kind: "collapse_benchmark_report",
    manifest_created_at: normalized.created_at,
    generated_at_iso,
    manifest_path: opts.manifest_path,
    runs,
    report_hash,
  };
}
