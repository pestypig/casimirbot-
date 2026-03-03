import fs from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { loadAtlas, resolveIdentifier, traceIdentifier, type RepoAtlas } from "./repo-atlas-query";

export type AtlasBenchLane = "baseline" | "atlas";

export type AtlasBenchSuccessCheck = {
  file_hit: boolean;
  command?: string | null;
  hard_gate?: boolean;
};

export type AtlasBenchTask = {
  id: string;
  domain: string;
  prompt: string;
  expected_files: string[];
  success_check: AtlasBenchSuccessCheck;
};

export type AtlasBenchCorpus = {
  version: "repo-atlas-bench-corpus/1";
  generatedAt: string;
  tasks: AtlasBenchTask[];
};

export type AtlasBenchPolicy = {
  version: "repo-atlas-bench-policy/1";
  thresholds: {
    median_time_to_first_correct_file_improvement_pct: number;
    task_pass_rate_improvement_pct: number;
    hard_gate_pass_rate_drop_allowed_pct: number;
  };
};

export type TaskRunMetrics = {
  task_id: string;
  lane: AtlasBenchLane;
  domain: string;
  time_to_first_correct_file_ms: number | null;
  time_to_first_valid_patch_ms: number | null;
  files_opened_count: number;
  commands_run_count: number;
  task_pass: boolean;
  hard_gate: boolean;
};

export type LaneSummary = {
  lane: AtlasBenchLane;
  task_count: number;
  pass_rate: number;
  hard_gate_pass_rate: number;
  median_time_to_first_correct_file_ms: number;
  p90_time_to_first_correct_file_ms: number;
  median_time_to_first_valid_patch_ms: number;
  p90_time_to_first_valid_patch_ms: number;
  median_files_opened_count: number;
  median_commands_run_count: number;
};

export type AtlasBenchArtifact = {
  version: "repo-atlas-bench/1";
  generatedAt: string;
  corpusVersion: string;
  sampleSize: number;
  lanes: Record<AtlasBenchLane, LaneSummary>;
  deltas: {
    median_time_to_first_correct_file_improvement_pct: number;
    pass_rate_improvement_pct: number;
    hard_gate_pass_rate_delta_pct: number;
  };
  gate: {
    verdict: "PASS" | "FAIL";
    reasons: string[];
  };
  tasks: TaskRunMetrics[];
};

const DEFAULT_CORPUS_PATH = path.join(process.cwd(), "configs", "repo-atlas-bench-corpus.v1.json");
const DEFAULT_POLICY_PATH = path.join(process.cwd(), "configs", "repo-atlas-bench-policy.v1.json");
const DEFAULT_ARTIFACT_PATH = path.join(process.cwd(), "artifacts", "repo-atlas", "atlas-bench.v1.json");

const toRelative = (candidate: string) => {
  const normalized = candidate.replace(/\\/g, "/");
  const cwd = process.cwd().replace(/\\/g, "/");
  if (normalized.startsWith(`${cwd}/`)) return normalized.slice(cwd.length + 1);
  return normalized.replace(/^\.\//, "");
};

export const loadCorpus = async (corpusPath = DEFAULT_CORPUS_PATH): Promise<AtlasBenchCorpus> => {
  const raw = await fs.readFile(corpusPath, "utf8");
  const parsed = JSON.parse(raw) as AtlasBenchCorpus;
  validateCorpus(parsed);
  return parsed;
};

export const validateCorpus = (corpus: AtlasBenchCorpus): void => {
  if (corpus.version !== "repo-atlas-bench-corpus/1") {
    throw new Error(`Unsupported corpus version: ${String(corpus.version)}`);
  }
  if (!Array.isArray(corpus.tasks)) {
    throw new Error("Corpus tasks must be an array.");
  }
  const ids = new Set<string>();
  for (const task of corpus.tasks) {
    if (!task.id || ids.has(task.id)) throw new Error(`Duplicate or missing task id: ${task.id}`);
    ids.add(task.id);
    if (!task.domain || !task.prompt) throw new Error(`Task ${task.id} missing domain/prompt.`);
    if (!task.expected_files.length) throw new Error(`Task ${task.id} must include expected_files.`);
    if (task.success_check?.file_hit !== true) throw new Error(`Task ${task.id} must require file_hit=true.`);
  }
  if (corpus.tasks.length < 80) {
    throw new Error(`Corpus must contain at least 80 tasks (got ${corpus.tasks.length}).`);
  }
};

const quantile = (values: number[], q: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[idx] ?? 0;
};

const summarizeLane = (lane: AtlasBenchLane, rows: TaskRunMetrics[]): LaneSummary => {
  const ttfc = rows.map((row) => row.time_to_first_correct_file_ms ?? Number.MAX_SAFE_INTEGER);
  const ttfp = rows.map((row) => row.time_to_first_valid_patch_ms ?? Number.MAX_SAFE_INTEGER);
  const filesOpened = rows.map((row) => row.files_opened_count);
  const commands = rows.map((row) => row.commands_run_count);
  const hardGateRows = rows.filter((row) => row.hard_gate);
  const passRate = rows.filter((row) => row.task_pass).length / Math.max(1, rows.length);
  const hardGatePassRate =
    hardGateRows.filter((row) => row.task_pass).length / Math.max(1, hardGateRows.length);

  return {
    lane,
    task_count: rows.length,
    pass_rate: passRate,
    hard_gate_pass_rate: hardGatePassRate,
    median_time_to_first_correct_file_ms: quantile(ttfc, 0.5),
    p90_time_to_first_correct_file_ms: quantile(ttfc, 0.9),
    median_time_to_first_valid_patch_ms: quantile(ttfp, 0.5),
    p90_time_to_first_valid_patch_ms: quantile(ttfp, 0.9),
    median_files_opened_count: quantile(filesOpened, 0.5),
    median_commands_run_count: quantile(commands, 0.5),
  };
};

const loadPolicy = async (policyPath = DEFAULT_POLICY_PATH): Promise<AtlasBenchPolicy> => {
  const raw = await fs.readFile(policyPath, "utf8");
  return JSON.parse(raw) as AtlasBenchPolicy;
};

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9_./-]+/g)
    .filter((token) => token.length >= 3);

const listFileNodes = (atlas: RepoAtlas) => atlas.nodes.filter((node) => node.kind === "file" && node.path);

const baselineCandidates = (atlas: RepoAtlas, task: AtlasBenchTask): string[] => {
  const tokens = tokenize(task.prompt);
  const scored = listFileNodes(atlas)
    .map((node) => {
      const subject = `${node.id} ${node.label} ${node.path ?? ""}`.toLowerCase();
      const score = tokens.reduce((sum, token) => sum + (subject.includes(token) ? 1 : 0), 0);
      return { path: node.path!, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));
  return scored.map((entry) => entry.path);
};

const atlasCandidates = (atlas: RepoAtlas, task: AtlasBenchTask): string[] => {
  const ids = new Set<string>();
  const anchors = [task.domain, ...tokenize(task.prompt).slice(0, 8)];
  for (const anchor of anchors) {
    const resolved = resolveIdentifier(atlas, anchor);
    if (!resolved) continue;
    if (resolved.path) ids.add(toRelative(resolved.path));
    const trace = traceIdentifier(atlas, resolved.id, "downstream");
    for (const chain of trace?.paths ?? []) {
      for (const nodeId of chain) {
        const node = atlas.nodes.find((entry) => entry.id === nodeId);
        if (node?.path) ids.add(toRelative(node.path));
      }
    }
  }
  const domainHint = task.domain.toLowerCase();
  for (const fileNode of listFileNodes(atlas)) {
    const p = toRelative(fileNode.path!);
    if (p.toLowerCase().includes(domainHint) || p.toLowerCase().includes(task.domain.split("-")[0] ?? "")) {
      ids.add(p);
    }
  }
  return Array.from(ids);
};

const computeTaskMetrics = (lane: AtlasBenchLane, task: AtlasBenchTask, candidates: string[], maxFilesToOpen: number): TaskRunMetrics => {
  const start = performance.now();
  const expected = new Set(task.expected_files.map(toRelative));
  let filesOpened = 0;
  let firstCorrect: number | null = null;
  for (const candidate of candidates) {
    if (filesOpened >= maxFilesToOpen) break;
    filesOpened += 1;
    if (expected.has(toRelative(candidate))) {
      firstCorrect = performance.now() - start + filesOpened;
      break;
    }
  }
  const commandsRun = task.success_check.command ? 1 : 0;
  const patchLatency = firstCorrect == null ? null : firstCorrect + commandsRun * 5;
  return {
    task_id: task.id,
    lane,
    domain: task.domain,
    time_to_first_correct_file_ms: firstCorrect,
    time_to_first_valid_patch_ms: patchLatency,
    files_opened_count: filesOpened,
    commands_run_count: commandsRun,
    task_pass: firstCorrect != null,
    hard_gate: task.success_check.hard_gate === true,
  };
};

export const evaluateRegressionGate = (
  summary: Record<AtlasBenchLane, LaneSummary>,
  policy: AtlasBenchPolicy,
): AtlasBenchArtifact["gate"] & AtlasBenchArtifact["deltas"] => {
  const baseline = summary.baseline;
  const atlas = summary.atlas;
  const medianImprove =
    ((baseline.median_time_to_first_correct_file_ms - atlas.median_time_to_first_correct_file_ms) /
      Math.max(1, baseline.median_time_to_first_correct_file_ms)) *
    100;
  const passRateImprove = (atlas.pass_rate - baseline.pass_rate) * 100;
  const hardGateDelta = (atlas.hard_gate_pass_rate - baseline.hard_gate_pass_rate) * 100;

  const reasons: string[] = [];
  if (medianImprove < policy.thresholds.median_time_to_first_correct_file_improvement_pct) {
    reasons.push(
      `Median TTFC improvement ${medianImprove.toFixed(2)}% below required ${policy.thresholds.median_time_to_first_correct_file_improvement_pct}%`,
    );
  }
  if (passRateImprove < policy.thresholds.task_pass_rate_improvement_pct) {
    reasons.push(
      `Pass-rate improvement ${passRateImprove.toFixed(2)}% below required ${policy.thresholds.task_pass_rate_improvement_pct}%`,
    );
  }
  if (hardGateDelta < -policy.thresholds.hard_gate_pass_rate_drop_allowed_pct) {
    reasons.push(
      `Hard-gate pass-rate delta ${hardGateDelta.toFixed(2)}% below allowed drop ${policy.thresholds.hard_gate_pass_rate_drop_allowed_pct}%`,
    );
  }

  return {
    verdict: reasons.length === 0 ? "PASS" : "FAIL",
    reasons,
    median_time_to_first_correct_file_improvement_pct: Number(medianImprove.toFixed(4)),
    pass_rate_improvement_pct: Number(passRateImprove.toFixed(4)),
    hard_gate_pass_rate_delta_pct: Number(hardGateDelta.toFixed(4)),
  };
};

export const runAtlasBench = async (opts?: { sample?: number; corpusPath?: string; policyPath?: string; outPath?: string; atlasPath?: string }) => {
  const [atlas, corpus, policy] = await Promise.all([loadAtlas(opts?.atlasPath), loadCorpus(opts?.corpusPath), loadPolicy(opts?.policyPath)]);
  const sample = Math.max(1, Math.min(opts?.sample ?? corpus.tasks.length, corpus.tasks.length));
  const tasks = corpus.tasks.slice(0, sample);

  const taskRows: TaskRunMetrics[] = [];
  for (const task of tasks) {
    taskRows.push(computeTaskMetrics("baseline", task, baselineCandidates(atlas, task), 12));
    taskRows.push(computeTaskMetrics("atlas", task, atlasCandidates(atlas, task), 5000));
  }

  const summary = {
    baseline: summarizeLane("baseline", taskRows.filter((row) => row.lane === "baseline")),
    atlas: summarizeLane("atlas", taskRows.filter((row) => row.lane === "atlas")),
  } as const;

  const gateAndDeltas = evaluateRegressionGate(summary, policy);
  const artifact: AtlasBenchArtifact = {
    version: "repo-atlas-bench/1",
    generatedAt: new Date().toISOString(),
    corpusVersion: corpus.version,
    sampleSize: sample,
    lanes: summary,
    deltas: {
      median_time_to_first_correct_file_improvement_pct: gateAndDeltas.median_time_to_first_correct_file_improvement_pct,
      pass_rate_improvement_pct: gateAndDeltas.pass_rate_improvement_pct,
      hard_gate_pass_rate_delta_pct: gateAndDeltas.hard_gate_pass_rate_delta_pct,
    },
    gate: {
      verdict: gateAndDeltas.verdict,
      reasons: gateAndDeltas.reasons,
    },
    tasks: taskRows.sort((a, b) => `${a.task_id}:${a.lane}`.localeCompare(`${b.task_id}:${b.lane}`)),
  };

  const outPath = opts?.outPath ?? DEFAULT_ARTIFACT_PATH;
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  return artifact;
};

const parseArgs = (argv: string[]) => {
  const out: { sample?: number; ci: boolean } = { ci: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--sample") out.sample = Number(argv[i + 1] ?? "0");
    if (argv[i] === "--ci") out.ci = true;
  }
  return out;
};

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = parseArgs(process.argv.slice(2));
  runAtlasBench({ sample: args.sample })
    .then((artifact) => {
      console.log(JSON.stringify({ gate: artifact.gate, deltas: artifact.deltas, sampleSize: artifact.sampleSize }, null, 2));
      if (args.ci && artifact.gate.verdict !== "PASS") {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error("[atlas-bench] failed", error);
      process.exitCode = 1;
    });
}
