import fs from "node:fs/promises";
import type { FileHandle } from "node:fs/promises";
import path from "node:path";
import { exec as execCallback } from "node:child_process";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { loadAtlas, resolveIdentifier, traceIdentifier, type RepoAtlas } from "./repo-atlas-query";

const execAsync = promisify(execCallback);

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
  command_check_pass: boolean | null;
  task_pass: boolean;
  hard_gate: boolean;
};

export type LaneSummary = {
  lane: AtlasBenchLane;
  task_count: number;
  hard_gate_task_count: number;
  pass_rate: number;
  hard_gate_pass_rate: number | null;
  median_time_to_first_correct_file_ms: number | null;
  p90_time_to_first_correct_file_ms: number | null;
  median_time_to_first_valid_patch_ms: number | null;
  p90_time_to_first_valid_patch_ms: number | null;
  median_files_opened_count: number;
  median_commands_run_count: number;
};

export type AtlasBenchArtifact = {
  version: "repo-atlas-bench/1";
  generatedAt: string;
  corpusVersion: string;
  sampleSize: number;
  sampling: {
    strategy: "stratified_hard_gate";
    hard_gate_tasks_in_corpus: number;
    hard_gate_tasks_in_sample: number;
    ensure_hard_gate_coverage: boolean;
  };
  limits: {
    max_files_to_open: number;
  };
  lanes: Record<AtlasBenchLane, LaneSummary>;
  deltas: {
    median_time_to_first_correct_file_improvement_pct: number | null;
    pass_rate_improvement_pct: number;
    hard_gate_pass_rate_delta_pct: number | null;
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
const DEFAULT_MAX_FILES_TO_OPEN = 128;
const DEFAULT_COMMAND_TIMEOUT_MS = 120_000;

const toRelative = (candidate: string) => {
  const normalized = candidate.replace(/\\/g, "/");
  const cwd = process.cwd().replace(/\\/g, "/");
  if (normalized.startsWith(`${cwd}/`)) return normalized.slice(cwd.length + 1);
  return normalized.replace(/^\.\//, "");
};

const isHardGateTask = (task: AtlasBenchTask): boolean => task.success_check.hard_gate === true;

export const loadCorpus = async (corpusPath = DEFAULT_CORPUS_PATH): Promise<AtlasBenchCorpus> => {
  const raw = await fs.readFile(corpusPath, "utf8");
  const parsed = JSON.parse(raw) as AtlasBenchCorpus;
  validateCorpus(parsed);
  return parsed;
};

const validatePolicy = (policy: AtlasBenchPolicy): void => {
  if (policy.version !== "repo-atlas-bench-policy/1") {
    throw new Error(`Unsupported policy version: ${String(policy.version)}`);
  }
  const thresholds = policy.thresholds ?? {};
  const values = [
    thresholds.median_time_to_first_correct_file_improvement_pct,
    thresholds.task_pass_rate_improvement_pct,
    thresholds.hard_gate_pass_rate_drop_allowed_pct,
  ];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Policy thresholds must be finite non-negative numbers.");
  }
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
  const ttfc = rows.map((row) => row.time_to_first_correct_file_ms).filter((value): value is number => value != null);
  const ttfp = rows.map((row) => row.time_to_first_valid_patch_ms).filter((value): value is number => value != null);
  const filesOpened = rows.map((row) => row.files_opened_count);
  const commands = rows.map((row) => row.commands_run_count);
  const hardGateRows = rows.filter((row) => row.hard_gate);
  const hardGatePassRate =
    hardGateRows.length > 0 ? hardGateRows.filter((row) => row.task_pass).length / hardGateRows.length : null;
  const passRate = rows.filter((row) => row.task_pass).length / Math.max(1, rows.length);

  return {
    lane,
    task_count: rows.length,
    hard_gate_task_count: hardGateRows.length,
    pass_rate: passRate,
    hard_gate_pass_rate: hardGatePassRate,
    median_time_to_first_correct_file_ms: ttfc.length > 0 ? quantile(ttfc, 0.5) : null,
    p90_time_to_first_correct_file_ms: ttfc.length > 0 ? quantile(ttfc, 0.9) : null,
    median_time_to_first_valid_patch_ms: ttfp.length > 0 ? quantile(ttfp, 0.5) : null,
    p90_time_to_first_valid_patch_ms: ttfp.length > 0 ? quantile(ttfp, 0.9) : null,
    median_files_opened_count: quantile(filesOpened, 0.5),
    median_commands_run_count: quantile(commands, 0.5),
  };
};

const loadPolicy = async (policyPath = DEFAULT_POLICY_PATH): Promise<AtlasBenchPolicy> => {
  const raw = await fs.readFile(policyPath, "utf8");
  const parsed = JSON.parse(raw) as AtlasBenchPolicy;
  validatePolicy(parsed);
  return parsed;
};

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^a-z0-9_./-]+/g)
    .filter((token) => token.length >= 3);

const listFileNodes = (atlas: RepoAtlas) => atlas.nodes.filter((node) => node.kind === "file" && node.path);

const baselineCandidates = (atlas: RepoAtlas, task: AtlasBenchTask): string[] => {
  const tokens = tokenize(task.prompt);
  const domainHints = [task.domain.toLowerCase(), task.domain.split("-")[0]?.toLowerCase() ?? ""].filter(Boolean);
  const scored = listFileNodes(atlas)
    .map((node) => {
      const subject = `${node.id} ${node.label} ${node.path ?? ""}`.toLowerCase();
      const tokenScore = tokens.reduce((sum, token) => sum + (subject.includes(token) ? 1 : 0), 0);
      const domainScore = domainHints.reduce((sum, hint) => sum + (subject.includes(hint) ? 1 : 0), 0);
      return { path: toRelative(node.path!), score: tokenScore * 10 + domainScore };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));

  const deduped = new Set<string>();
  for (const row of scored) deduped.add(row.path);
  return Array.from(deduped);
};

const atlasCandidates = (atlas: RepoAtlas, nodeById: Map<string, RepoAtlas["nodes"][number]>, task: AtlasBenchTask): string[] => {
  const ids = new Set<string>();
  const anchors = [task.domain, ...tokenize(task.prompt).slice(0, 8)];
  for (const anchor of anchors) {
    const resolved = resolveIdentifier(atlas, anchor);
    if (!resolved) continue;
    if (resolved.path) ids.add(toRelative(resolved.path));
    const trace = traceIdentifier(atlas, resolved.id, "downstream");
    for (const chain of trace?.paths ?? []) {
      for (const nodeId of chain) {
        const node = nodeById.get(nodeId);
        if (node?.path) ids.add(toRelative(node.path));
      }
    }
  }

  const domainHint = task.domain.toLowerCase();
  const domainPrefix = task.domain.split("-")[0]?.toLowerCase() ?? "";
  for (const fileNode of listFileNodes(atlas)) {
    const candidate = toRelative(fileNode.path!);
    const normalized = candidate.toLowerCase();
    if (normalized.includes(domainHint) || (domainPrefix && normalized.includes(domainPrefix))) {
      ids.add(candidate);
    }
  }
  return Array.from(ids);
};

const probeFileReadable = async (candidate: string): Promise<boolean> => {
  const absolutePath = path.isAbsolute(candidate) ? candidate : path.resolve(process.cwd(), candidate);
  let handle: FileHandle | null = null;
  try {
    handle = await fs.open(absolutePath, "r");
    const probe = Buffer.alloc(1);
    await handle.read(probe, 0, 1, 0);
    return true;
  } catch {
    return false;
  } finally {
    if (handle) {
      await handle.close().catch(() => undefined);
    }
  }
};

const runCommandCheck = async (command: string): Promise<{ ok: boolean; durationMs: number }> => {
  const start = performance.now();
  try {
    await execAsync(command, {
      cwd: process.cwd(),
      timeout: DEFAULT_COMMAND_TIMEOUT_MS,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
      shell: true,
    });
    return { ok: true, durationMs: performance.now() - start };
  } catch {
    return { ok: false, durationMs: performance.now() - start };
  }
};

const computeTaskMetrics = async (
  lane: AtlasBenchLane,
  task: AtlasBenchTask,
  candidates: string[],
  maxFilesToOpen: number,
): Promise<TaskRunMetrics> => {
  const start = performance.now();
  const expected = new Set(task.expected_files.map(toRelative));
  let filesOpened = 0;
  let firstCorrect: number | null = null;
  for (const candidate of candidates) {
    if (filesOpened >= maxFilesToOpen) break;
    filesOpened += 1;
    const readable = await probeFileReadable(candidate);
    if (!readable) continue;
    if (expected.has(toRelative(candidate))) {
      firstCorrect = performance.now() - start;
      break;
    }
  }

  const command = task.success_check.command;
  let commandsRun = 0;
  let commandCheckPass: boolean | null = null;
  let commandDuration = 0;
  if (command) {
    commandsRun = 1;
    const commandCheck = await runCommandCheck(command);
    commandCheckPass = commandCheck.ok;
    commandDuration = commandCheck.durationMs;
  }

  return {
    task_id: task.id,
    lane,
    domain: task.domain,
    time_to_first_correct_file_ms: firstCorrect,
    time_to_first_valid_patch_ms: firstCorrect == null ? null : firstCorrect + commandDuration,
    files_opened_count: filesOpened,
    commands_run_count: commandsRun,
    command_check_pass: commandCheckPass,
    task_pass: firstCorrect != null && (commandCheckPass ?? true),
    hard_gate: task.success_check.hard_gate === true,
  };
};

export const selectSampleTasks = (
  tasks: AtlasBenchTask[],
  sampleSize: number,
  options?: { ensureHardGateCoverage?: boolean },
): AtlasBenchTask[] => {
  const total = tasks.length;
  const sample = Math.max(1, Math.min(sampleSize, total));
  if (sample >= total) return tasks.slice();

  const ensureHardGateCoverage = options?.ensureHardGateCoverage ?? true;
  if (!ensureHardGateCoverage) return tasks.slice(0, sample);

  const hardGateTasks = tasks.filter((task) => isHardGateTask(task));
  if (hardGateTasks.length === 0) return tasks.slice(0, sample);

  const softTasks = tasks.filter((task) => !isHardGateTask(task));
  const targetHard = Math.min(
    hardGateTasks.length,
    Math.max(1, Math.round((hardGateTasks.length / Math.max(1, tasks.length)) * sample)),
  );
  const targetSoft = Math.max(0, sample - targetHard);

  const selectedIds = new Set<string>();
  for (const task of hardGateTasks.slice(0, targetHard)) selectedIds.add(task.id);
  for (const task of softTasks.slice(0, targetSoft)) selectedIds.add(task.id);

  if (selectedIds.size < sample) {
    for (const task of tasks) {
      selectedIds.add(task.id);
      if (selectedIds.size >= sample) break;
    }
  }

  return tasks.filter((task) => selectedIds.has(task.id)).slice(0, sample);
};

export const evaluateRegressionGate = (
  summary: Record<AtlasBenchLane, LaneSummary>,
  policy: AtlasBenchPolicy,
  context?: { hardGateTasksInCorpus: number; hardGateTasksInSample: number },
): AtlasBenchArtifact["gate"] & AtlasBenchArtifact["deltas"] => {
  const baseline = summary.baseline;
  const atlas = summary.atlas;
  const reasons: string[] = [];

  if (baseline.task_count === 0 || atlas.task_count === 0) {
    reasons.push("Benchmark summary is empty for one or both lanes.");
  }

  const hasCorpusHardGates = (context?.hardGateTasksInCorpus ?? 0) > 0;
  const hasSampleHardGates = (context?.hardGateTasksInSample ?? 0) > 0;
  if (hasCorpusHardGates && !hasSampleHardGates) {
    reasons.push("No hard-gate tasks were included in the sampled benchmark.");
  }

  const baselineMedian = baseline.median_time_to_first_correct_file_ms;
  const atlasMedian = atlas.median_time_to_first_correct_file_ms;
  let medianImprove: number | null = null;
  if (baselineMedian == null || atlasMedian == null) {
    reasons.push("Median TTFC is non-actionable because one lane has zero successful tasks.");
  } else if (baselineMedian <= 0) {
    reasons.push(`Baseline median TTFC must be positive (got ${baselineMedian}).`);
  } else {
    medianImprove = ((baselineMedian - atlasMedian) / baselineMedian) * 100;
  }

  const passRateImprove = (atlas.pass_rate - baseline.pass_rate) * 100;

  let hardGateDelta: number | null = null;
  if (hasCorpusHardGates) {
    if (baseline.hard_gate_pass_rate == null || atlas.hard_gate_pass_rate == null) {
      reasons.push("Hard-gate pass-rate is non-actionable because sampled hard-gate coverage is missing.");
    } else {
      hardGateDelta = (atlas.hard_gate_pass_rate - baseline.hard_gate_pass_rate) * 100;
    }
  }

  if (medianImprove != null && medianImprove < policy.thresholds.median_time_to_first_correct_file_improvement_pct) {
    reasons.push(
      `Median TTFC improvement ${medianImprove.toFixed(2)}% below required ${policy.thresholds.median_time_to_first_correct_file_improvement_pct}%`,
    );
  }
  if (passRateImprove < policy.thresholds.task_pass_rate_improvement_pct) {
    reasons.push(
      `Pass-rate improvement ${passRateImprove.toFixed(2)}% below required ${policy.thresholds.task_pass_rate_improvement_pct}%`,
    );
  }
  if (hardGateDelta != null && hardGateDelta < -policy.thresholds.hard_gate_pass_rate_drop_allowed_pct) {
    reasons.push(
      `Hard-gate pass-rate delta ${hardGateDelta.toFixed(2)}% below allowed drop ${policy.thresholds.hard_gate_pass_rate_drop_allowed_pct}%`,
    );
  }

  return {
    verdict: reasons.length === 0 ? "PASS" : "FAIL",
    reasons,
    median_time_to_first_correct_file_improvement_pct:
      medianImprove == null ? null : Number(medianImprove.toFixed(4)),
    pass_rate_improvement_pct: Number(passRateImprove.toFixed(4)),
    hard_gate_pass_rate_delta_pct: hardGateDelta == null ? null : Number(hardGateDelta.toFixed(4)),
  };
};

export const runAtlasBench = async (opts?: {
  sample?: number;
  corpusPath?: string;
  policyPath?: string;
  outPath?: string;
  atlasPath?: string;
  maxFilesToOpen?: number;
  ensureHardGateCoverage?: boolean;
}) => {
  const [atlas, corpus, policy] = await Promise.all([
    loadAtlas(opts?.atlasPath),
    loadCorpus(opts?.corpusPath),
    loadPolicy(opts?.policyPath),
  ]);
  const nodeById = new Map(atlas.nodes.map((node) => [node.id, node] as const));
  const sample = Math.max(1, Math.min(opts?.sample ?? corpus.tasks.length, corpus.tasks.length));
  const ensureHardGateCoverage = opts?.ensureHardGateCoverage ?? true;
  const maxFilesToOpen = Math.max(1, Math.floor(opts?.maxFilesToOpen ?? DEFAULT_MAX_FILES_TO_OPEN));

  const tasks = selectSampleTasks(corpus.tasks, sample, { ensureHardGateCoverage });
  const hardGateTasksInCorpus = corpus.tasks.filter((task) => isHardGateTask(task)).length;
  const hardGateTasksInSample = tasks.filter((task) => isHardGateTask(task)).length;

  const taskRows: TaskRunMetrics[] = [];
  for (const task of tasks) {
    const baseline = await computeTaskMetrics("baseline", task, baselineCandidates(atlas, task), maxFilesToOpen);
    const atlasRow = await computeTaskMetrics("atlas", task, atlasCandidates(atlas, nodeById, task), maxFilesToOpen);
    taskRows.push(baseline, atlasRow);
  }

  const summary = {
    baseline: summarizeLane("baseline", taskRows.filter((row) => row.lane === "baseline")),
    atlas: summarizeLane("atlas", taskRows.filter((row) => row.lane === "atlas")),
  } as const;

  const gateAndDeltas = evaluateRegressionGate(summary, policy, {
    hardGateTasksInCorpus,
    hardGateTasksInSample,
  });

  const artifact: AtlasBenchArtifact = {
    version: "repo-atlas-bench/1",
    generatedAt: new Date().toISOString(),
    corpusVersion: corpus.version,
    sampleSize: tasks.length,
    sampling: {
      strategy: "stratified_hard_gate",
      hard_gate_tasks_in_corpus: hardGateTasksInCorpus,
      hard_gate_tasks_in_sample: hardGateTasksInSample,
      ensure_hard_gate_coverage: ensureHardGateCoverage,
    },
    limits: {
      max_files_to_open: maxFilesToOpen,
    },
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
  const out: { sample?: number; ci: boolean; maxFilesToOpen?: number; ensureHardGateCoverage: boolean } = {
    ci: false,
    ensureHardGateCoverage: true,
  };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--sample") out.sample = Number(argv[i + 1] ?? "0");
    if (argv[i] === "--max-files-to-open") out.maxFilesToOpen = Number(argv[i + 1] ?? "0");
    if (argv[i] === "--allow-no-hard-gate-coverage") out.ensureHardGateCoverage = false;
    if (argv[i] === "--ci") out.ci = true;
  }
  return out;
};

export const isDirectExecution = (importMetaUrl: string, argvPath = process.argv[1]): boolean => {
  if (!argvPath) return false;
  return importMetaUrl === pathToFileURL(path.resolve(argvPath)).href;
};

if (isDirectExecution(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  runAtlasBench({
    sample: args.sample,
    maxFilesToOpen: args.maxFilesToOpen,
    ensureHardGateCoverage: args.ensureHardGateCoverage,
  })
    .then((artifact) => {
      console.log(
        JSON.stringify(
          {
            gate: artifact.gate,
            deltas: artifact.deltas,
            sampleSize: artifact.sampleSize,
            sampling: artifact.sampling,
            limits: artifact.limits,
          },
          null,
          2,
        ),
      );
      if (args.ci && artifact.gate.verdict !== "PASS") {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error("[atlas-bench] failed", error);
      process.exitCode = 1;
    });
}
