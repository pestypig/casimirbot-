import fs from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { spawn, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";

type CorpusTask = { id: string; prompt: string; expected_files: string[] };
type Corpus = { version: string; tasks: CorpusTask[] };
type VariantSpec = { name: string; atlasLane: "0" | "1"; gitTrackedLane: "0" | "1" };
type MatchMode = "exact" | "normalized" | "alias" | "none";

type ScenarioMetrics = {
  gold_file_recall_at_5: number;
  gold_file_recall_at_10: number;
  consequential_file_retention_rate: number;
  rerank_mrr10: number;
  graph_edge_hit_rate: number;
  retrieval_confidence_mean: number;
  retrieval_doc_share_mean: number;
  unmatched_expected_file_rate: number;
};

type TaskResult = {
  taskId: string;
  expected_files: string[];
  top5: string[];
  top10: string[];
  rawHits5: number;
  rawHits10: number;
  canonHits5: number;
  canonHits10: number;
  rawRR: number;
  canonRR: number;
  mode: MatchMode;
  mismatchReasons: string[];
  mismatchTaxonomy: Array<"path_form_mismatch" | "alias_unmapped" | "retrieval_miss" | "context_shape_mismatch">;
  expectedNormalized: string[];
  retrievedNormalizedTop10: string[];
  graphEdgeHit: boolean;
  confidence: number | null;
  docShare: number | null;
};

const CORPUS_PATH = process.env.HELIX_ASK_RETRIEVAL_CORPUS ?? "configs/repo-atlas-bench-corpus.v1.json";
const OUTPUT_ROOT = process.env.HELIX_ASK_RETRIEVAL_ABLATION_OUT_ROOT ?? "artifacts/experiments/helix-ask-retrieval-ablation";
const TOP_K = Number(process.env.HELIX_ASK_RETRIEVAL_TOPK ?? 18);
const MAX_TASKS = Number(process.env.HELIX_ASK_RETRIEVAL_MAX_TASKS ?? 0);
const SEEDS = String(process.env.HELIX_ASK_RETRIEVAL_SEEDS ?? "7,11,13").split(",").map((v) => Number(v.trim())).filter(Number.isFinite);
const TEMPS = String(process.env.HELIX_ASK_RETRIEVAL_TEMPERATURES ?? "0.2").split(",").map((v) => Number(v.trim())).filter(Number.isFinite);
const READY_TIMEOUT_MS = Number(process.env.HELIX_ASK_RETRIEVAL_READY_TIMEOUT_MS ?? 240_000);
const ASK_TIMEOUT_MS = Number(process.env.HELIX_ASK_RETRIEVAL_ASK_TIMEOUT_MS ?? 15_000);
const ASK_RETRY_ATTEMPTS = Number(process.env.HELIX_ASK_RETRIEVAL_ASK_RETRY_ATTEMPTS ?? 1);
const VARIANT_WATCHDOG_TIMEOUT_MS = Number(process.env.HELIX_ASK_RETRIEVAL_VARIANT_TIMEOUT_MS ?? 600_000);

const VARIANTS: VariantSpec[] = [
  { name: "baseline_atlas_git_on", atlasLane: "1", gitTrackedLane: "1" },
  { name: "atlas_off_git_on", atlasLane: "0", gitTrackedLane: "1" },
  { name: "atlas_on_git_off", atlasLane: "1", gitTrackedLane: "0" },
  { name: "atlas_off_git_off", atlasLane: "0", gitTrackedLane: "0" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const normalizePath = (s: string) => s.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+/g, "/").replace(/\/$/, "").toLowerCase();
const EPS = 1e-9;
const require = createRequire(import.meta.url);
const TSX_CLI = require.resolve("tsx/cli");

const findOpenPort = async (): Promise<number> =>
  new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const addr = probe.address();
      if (!addr || typeof addr === "string") {
        probe.close(() => reject(new Error("failed to determine an open port")));
        return;
      }
      const { port } = addr;
      probe.close((err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
  });

const numberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const EVIDENCE_PREFIX = /^(file:|evidence:|repo:|path:)/i;
const REPO_PREFIX = /^\/?workspace\/casimirbot-\//i;
const TRAILING_LINE_SUFFIX = /:(\d+)(:\d+)?$/;
const normalizeEvidenceId = (raw: string) =>
  normalizePath(raw.trim().replace(/^`|`$/g, "").replace(EVIDENCE_PREFIX, "").replace(REPO_PREFIX, ""));
const normalizePathLoose = (raw: string) =>
  normalizePath(
    normalizeEvidenceId(raw)
      .replace(/[#?].*$/, "")
      .replace(TRAILING_LINE_SUFFIX, "")
      .replace(/\(\s*line\s+\d+\s*\)$/i, ""),
  );
const pathSegments = (raw: string) => normalizePathLoose(raw).split("/").filter(Boolean);
const pathTail = (raw: string, depth = 2) => {
  const parts = pathSegments(raw);
  return parts.slice(-depth).join("/");
};
const pathBase = (raw: string) => {
  const parts = pathSegments(raw);
  return parts.length ? parts[parts.length - 1] : normalizePathLoose(raw);
};
const canonicalPathSet = (s: string) => {
  const n = normalizeEvidenceId(s);
  const set = new Set([n]);
  set.add(n.replace(/^\.\//, ""));
  if (n.startsWith("./")) set.add(n.slice(2));
  if (n.startsWith("server/src/")) set.add(n.replace("server/src/", "server/"));
  if (n.startsWith("src/server/")) set.add(n.replace("src/server/", "server/"));
  if (n.startsWith("client/src/")) set.add(n.replace("client/src/", "client/"));
  if (n.startsWith("client/")) set.add(`client/src/${n.slice("client/".length)}`);
  return set;
};
const aliasSet = (s: string) => {
  const set = canonicalPathSet(s);
  for (const n of [...set]) {
    if (n.startsWith("server/utils/")) set.add(n.replace("server/utils/", "server/"));
    if (n.startsWith("server/")) set.add(n.replace("server/", "server/utils/"));
    if (n.startsWith("docs/audits/")) set.add(n.replace("docs/audits/", "docs/reports/"));
    if (n.startsWith("docs/reports/")) set.add(n.replace("docs/reports/", "docs/audits/"));
  }
  return set;
};
const bestMode = (expected: string, candidates: string[]): MatchMode => {
  if (candidates.includes(expected)) return "exact";
  const cn = candidates.map(normalizeEvidenceId);
  const expectedForms = canonicalPathSet(expected);
  if (cn.some((candidate) => expectedForms.has(candidate))) return "normalized";
  const aliases = aliasSet(expected);
  return cn.some((c) => aliases.has(c)) ? "alias" : "none";
};

const quantile = (vals: number[], q: number) => {
  if (!vals.length) return 0; const s=[...vals].sort((a,b)=>a-b); const i=(s.length-1)*q; const lo=Math.floor(i), hi=Math.ceil(i); if(lo===hi) return s[lo]; return s[lo]+(s[hi]-s[lo])*(i-lo);
};
let rngState = 123456789;
const rng = () => { rngState = (1664525 * rngState + 1013904223) >>> 0; return rngState / 0xffffffff; };
const ci95 = (vals: number[]) => {
  if (vals.length < 2) return { low: vals[0] ?? 0, high: vals[0] ?? 0 };
  const boots:number[]=[];
  for(let i=0;i<400;i++){ const sample:number[]=[]; for(let j=0;j<vals.length;j++) sample.push(vals[Math.floor(rng()*vals.length)]); boots.push(avg(sample)); }
  return { low: quantile(boots,0.025), high: quantile(boots,0.975) };
};

type ServerHandle = {
  child: ChildProcess;
  port: number;
  askUrl: string;
  readyUrl: string;
  stderrTail: string[];
};

const appendTail = (buffer: string[], chunk: string) => {
  const trimmed = chunk.trim();
  if (!trimmed) return;
  buffer.push(trimmed);
  if (buffer.length > 12) buffer.shift();
};

const startServer = async (variant: VariantSpec): Promise<ServerHandle> => {
  const port = await findOpenPort();
  const env = {
    ...process.env,
    NODE_ENV: "development",
    PORT: String(port),
    SKIP_VITE_MIDDLEWARE: process.env.SKIP_VITE_MIDDLEWARE ?? "0",
    DISABLE_VITE_HMR: "1",
    HELIX_ASK_ATLAS_LANE: variant.atlasLane,
    HELIX_ASK_GIT_TRACKED_LANE: variant.gitTrackedLane,
    SKIP_MODULE_INIT: process.env.SKIP_MODULE_INIT ?? "1",
  };
  const child = spawn(process.execPath, [TSX_CLI, "server/index.ts"], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  const stderrTail: string[] = [];
  child.stderr?.on("data", (chunk) => appendTail(stderrTail, String(chunk)));
  child.on("error", (err) => appendTail(stderrTail, `spawn error: ${err.message}`));
  const baseUrl = `http://127.0.0.1:${port}`;
  return {
    child,
    port,
    askUrl: new URL("/api/agi/ask", baseUrl).toString(),
    readyUrl: new URL("/api/ready", baseUrl).toString(),
    stderrTail,
  };
};

const stopServer = async (handle: ServerHandle) => {
  const { child } = handle;
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  for (let i = 0; i < 30; i += 1) {
    if (child.exitCode !== null) return;
    await sleep(100);
  }
  if (child.exitCode === null) child.kill("SIGKILL");
};

const waitReady = async (handle: ServerHandle) => {
  const attempts = Math.max(1, Math.ceil(READY_TIMEOUT_MS / 1000));
  for (let i = 0; i < attempts; i += 1) {
    if (handle.child.exitCode !== null) {
      throw new Error(
        `variant server exited before ready (port=${handle.port}, code=${handle.child.exitCode}) stderr=${handle.stderrTail.join(
          " | ",
        )}`,
      );
    }
    try {
      const r = await fetch(handle.readyUrl);
      const j = (await r.json()) as { ready?: boolean };
      if (j.ready) return;
    } catch {
      // keep polling until timeout
    }
    await sleep(1000);
  }
  throw new Error(`ready timeout (port=${handle.port}) stderr=${handle.stderrTail.join(" | ")}`);
};

const runTask = async (askUrl: string, task: CorpusTask, seed: number, temperature: number): Promise<TaskResult> => {
  let payload: {
    debug?: {
      context_files?: unknown;
      belief_graph_edge_count?: unknown;
      graph_evidence_count?: unknown;
      retrieval_confidence?: unknown;
      retrieval_doc_share?: unknown;
    };
  } | null = null;
  for (let attempt=0; attempt<ASK_RETRY_ATTEMPTS; attempt+=1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ASK_TIMEOUT_MS);
      const res = await fetch(askUrl, { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ question: task.prompt, dryRun:true, debug:true, topK:TOP_K, seed, temperature, sessionId:`retrieval-ablation:${task.id}:${seed}:${temperature}` }), signal: controller.signal });
      payload = (await res.json()) as {
        debug?: {
          context_files?: unknown;
          belief_graph_edge_count?: unknown;
          graph_evidence_count?: unknown;
          retrieval_confidence?: unknown;
          retrieval_doc_share?: unknown;
        };
      };
      break;
    } catch {
      await sleep(500 * (attempt + 1));
    }
  }
  if (!payload) {
    return {
      taskId: task.id,
      expected_files: task.expected_files,
      top5: [],
      top10: [],
      rawHits5: 0,
      rawHits10: 0,
      canonHits5: 0,
      canonHits10: 0,
      rawRR: 0,
      canonRR: 0,
      mode: "none",
      mismatchReasons: task.expected_files.map((expected) => `${expected}:retrieval_miss`),
      mismatchTaxonomy: ["retrieval_miss"],
      expectedNormalized: task.expected_files.map(normalizeEvidenceId),
      retrievedNormalizedTop10: [],
      graphEdgeHit: false,
      confidence: null,
      docShare: null,
    };
  }
  const contextFiles = Array.isArray(payload.debug?.context_files) ? payload.debug!.context_files : [];
  const contextShapeMismatch = contextFiles.some((v) => typeof v !== "string");
  const top10 = contextFiles.filter((v): v is string => typeof v === "string").slice(0,10);
  const top5 = top10.slice(0,5);
  const modes = task.expected_files.map((e)=>bestMode(e, top10));
  const mismatchTaxonomy = new Set<"path_form_mismatch" | "alias_unmapped" | "retrieval_miss" | "context_shape_mismatch">();
  if (contextShapeMismatch) mismatchTaxonomy.add("context_shape_mismatch");
  const mismatchReasons = task.expected_files.flatMap((expected) => {
    const mode = bestMode(expected, top10);
    if (mode !== "none") return [];
    if (!top10.length) {
      mismatchTaxonomy.add("retrieval_miss");
      return [`${expected}:retrieval_miss`];
    }
    const looseExpected = normalizePathLoose(expected);
    const looseCandidates = top10.map(normalizePathLoose);
    if (looseCandidates.includes(looseExpected)) {
      mismatchTaxonomy.add("path_form_mismatch");
      return [`${expected}:path_form_mismatch`];
    }
    const expectedBase = pathBase(expected);
    const expectedTail = pathTail(expected, 2);
    const aliasCandidatePresent = looseCandidates.some(
      (candidate) => pathBase(candidate) === expectedBase || pathTail(candidate, 2) === expectedTail,
    );
    if (aliasCandidatePresent) {
      mismatchTaxonomy.add("alias_unmapped");
      return [`${expected}:alias_unmapped`];
    }
    mismatchTaxonomy.add("retrieval_miss");
    return [`${expected}:retrieval_miss`];
  });
  const rawHits10 = task.expected_files.filter((e)=>top10.includes(e)).length;
  const rawHits5 = task.expected_files.filter((e)=>top5.includes(e)).length;
  const canonHits10 = modes.filter((m)=>m!=="none").length;
  const canonHits5 = task.expected_files.filter((e)=>bestMode(e, top5)!=="none").length;
  const rank = (cand:string[]) => { for(let i=0;i<cand.length;i++) if(task.expected_files.includes(cand[i])) return 1/(i+1); return 0; };
  const canonRank = () => { for(let i=0;i<top10.length;i++) if(task.expected_files.some((e)=>bestMode(e,[top10[i]])!=="none")) return 1/(i+1); return 0; };
  const mode:MatchMode = modes.includes("exact")?"exact":modes.includes("normalized")?"normalized":modes.includes("alias")?"alias":"none";
  const edgeCount =
    numberOrNull(payload.debug?.belief_graph_edge_count) ??
    numberOrNull(payload.debug?.graph_evidence_count) ??
    0;
  return {
    taskId: task.id,
    expected_files: task.expected_files,
    top5,
    top10,
    rawHits5,
    rawHits10,
    canonHits5,
    canonHits10,
    rawRR: rank(top10),
    canonRR: canonRank(),
    mode,
    mismatchReasons,
    mismatchTaxonomy: [...mismatchTaxonomy],
    expectedNormalized: task.expected_files.map(normalizeEvidenceId),
    retrievedNormalizedTop10: top10.map(normalizeEvidenceId),
    graphEdgeHit: edgeCount > 0,
    confidence: numberOrNull(payload.debug?.retrieval_confidence),
    docShare: numberOrNull(payload.debug?.retrieval_doc_share),
  };
};


const withWatchdog = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  let timer: NodeJS.Timeout | null = null;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`watchdog_timeout:${label}:${VARIANT_WATCHDOG_TIMEOUT_MS}ms`)), VARIANT_WATCHDOG_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const summarize = (results: TaskResult[], canonical: boolean): ScenarioMetrics => {
  const expected = results.reduce((n,r)=>n+r.expected_files.length,0);
  const hit5 = results.reduce((n,r)=>n+(canonical?r.canonHits5:r.rawHits5),0);
  const hit10 = results.reduce((n,r)=>n+(canonical?r.canonHits10:r.rawHits10),0);
  return {
    gold_file_recall_at_5: expected?hit5/expected:0,
    gold_file_recall_at_10: expected?hit10/expected:0,
    consequential_file_retention_rate: results.length?results.filter((r)=>(canonical?r.canonHits10:r.rawHits10)>0).length/results.length:0,
    rerank_mrr10: avg(results.map((r)=>canonical?r.canonRR:r.rawRR)),
    graph_edge_hit_rate: avg(results.map((r)=>r.graphEdgeHit?1:0)),
    retrieval_confidence_mean: avg(results.flatMap((r)=>r.confidence==null?[]:[r.confidence])),
    retrieval_doc_share_mean: avg(results.flatMap((r)=>r.docShare==null?[]:[r.docShare])),
    unmatched_expected_file_rate: results.length?results.filter((r)=>r.mode==="none").length/results.length:0,
  };
};

const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timeoutHandle: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(`${label}:watchdog_timeout_ms=${ms}`)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
};


const inferStageFaultMatrix = (variant: any) => {
  const tasks = variant?.diagnostics?.mismatch_reasons ?? [];
  const total = tasks.length || 1;
  const reasonCount = (name: string) => tasks.reduce((n: number, t: any) => n + (Array.isArray(t.mismatchReasons) ? t.mismatchReasons.filter((r: any) => r.reason === name).length : 0), 0);
  const retrieval = reasonCount("retrieval_miss") / total;
  const candidateFiltering = reasonCount("alias_unmapped") / total;
  const rerank = reasonCount("path_form_mismatch") / total;
  const synthesisPacking = reasonCount("context_shape_mismatch") / total;
  const finalCleanup = Math.max(0, 1 - Math.min(1, retrieval + candidateFiltering + rerank + synthesisPacking));
  return {
    retrieval,
    candidate_filtering: candidateFiltering,
    rerank,
    synthesis_packing: synthesisPacking,
    final_cleanup: finalCleanup,
  };
};

const classifyFaultOwner = (matrix: { retrieval: number; candidate_filtering: number; rerank: number; synthesis_packing: number; final_cleanup: number }) => {
  const retrievalMass = matrix.retrieval;
  const routingMass = matrix.candidate_filtering;
  const postProcessingMass = matrix.rerank + matrix.synthesis_packing + matrix.final_cleanup;
  if (retrievalMass >= routingMass && retrievalMass >= postProcessingMass) return "retrieval";
  if (routingMass >= postProcessingMass) return "routing";
  return "post_processing";
};

const main = async () => {
  const corpus = JSON.parse(await fs.readFile(CORPUS_PATH, "utf8")) as Corpus;
  const tasks = [...corpus.tasks].sort((a,b)=>a.id.localeCompare(b.id));
  const scoped = MAX_TASKS>0?tasks.slice(0,MAX_TASKS):tasks;
  const runId=`retrieval-ablation-${Date.now()}`; const outDir=path.join(OUTPUT_ROOT,runId); await fs.mkdir(outDir,{recursive:true});
  const score: any = {
    runId,
    generatedAt:new Date().toISOString(),
    seeds:SEEDS,
    temperatures:TEMPS,
    maxTasks: MAX_TASKS,
    expectedTaskCount: scoped.length,
    expectedScenarioCount: VARIANTS.length * SEEDS.length * TEMPS.length,
    run_complete: false,
    blocked_reason: null,
    variants:{},
  };
  let completedScenarioCount = 0;

  for (const variant of VARIANTS) {
    const server = await startServer(variant);
    try {
      await withWatchdog(`variant:${variant.name}:ready`, async () => {
        await waitReady(server);
      });
      const scenarios:any[]=[];
      for (const seed of SEEDS) for (const temperature of TEMPS) {
        console.log(`[ablation] variant=${variant.name} seed=${seed} temperature=${temperature} tasks=${scoped.length}`);
        const results:TaskResult[]=[];
        await withWatchdog(`variant:${variant.name}:seed:${seed}:temp:${temperature}`, async () => {
          for (const task of scoped) {
            results.push(await runTask(server.askUrl, task,seed,temperature));
          }
        });
        const raw = summarize(results,false); const canon = summarize(results,true);
        scenarios.push({ seed, temperature, raw_metrics: raw, canonicalized_metrics: canon, task_results: results });
        completedScenarioCount += 1;
      }
      const metrics = [
        "gold_file_recall_at_5",
        "gold_file_recall_at_10",
        "consequential_file_retention_rate",
        "rerank_mrr10",
        "graph_edge_hit_rate",
        "retrieval_confidence_mean",
        "retrieval_doc_share_mean",
        "unmatched_expected_file_rate",
      ] as const;
      const aggregate:any={};
      for(const m of metrics){ const vals=scenarios.map((s)=>s.canonicalized_metrics[m] ?? s.raw_metrics[m]); aggregate[m]={ point_estimate:avg(vals), ci95:ci95(vals) }; }
      const flattenedTaskResults = scenarios.flatMap((scenario) =>
        scenario.task_results.map((taskResult: TaskResult) => ({
          seed: scenario.seed,
          temperature: scenario.temperature,
          taskId: taskResult.taskId,
          mode: taskResult.mode,
          mismatchReasons: taskResult.mismatchReasons,
          mismatchTaxonomy: taskResult.mismatchTaxonomy,
          expectedNormalized: taskResult.expectedNormalized,
          retrievedNormalizedTop10: taskResult.retrievedNormalizedTop10,
        })),
      );
      const mismatchCounts = flattenedTaskResults.reduce(
        (
          counts: Record<
            "path_form_mismatch" | "alias_unmapped" | "retrieval_miss" | "context_shape_mismatch",
            number
          >,
          task,
        ) => {
          for (const reason of task.mismatchTaxonomy as Array<
            "path_form_mismatch" | "alias_unmapped" | "retrieval_miss" | "context_shape_mismatch"
          >) {
            counts[reason] += 1;
          }
          return counts;
        },
        {
          path_form_mismatch: 0,
          alias_unmapped: 0,
          retrieval_miss: 0,
          context_shape_mismatch: 0,
        },
      );
      score.variants[variant.name]={
        scenarios,
        aggregate,
        diagnostics: {
          unmatched_expected_file_rate: avg(scenarios.map((s)=>s.raw_metrics.unmatched_expected_file_rate)),
          expected_file_match_mode: {
            exact: flattenedTaskResults.filter((task) => task.mode === "exact").length,
            normalized: flattenedTaskResults.filter((task) => task.mode === "normalized").length,
            alias: flattenedTaskResults.filter((task) => task.mode === "alias").length,
            none: flattenedTaskResults.filter((task) => task.mode === "none").length,
          },
          mismatch_taxonomy_counts: mismatchCounts,
          mismatch_reasons: flattenedTaskResults.filter((task) => task.mismatchReasons.length > 0),
        };
      const stage_fault_matrix = inferStageFaultMatrix({ diagnostics });
      const fault_owner = classifyFaultOwner(stage_fault_matrix);
      score.variants[variant.name]={
        scenarios,
        aggregate,
        diagnostics,
        stage_fault_matrix,
        fault_owner,
      };
      await fs.writeFile(path.join(outDir,`${variant.name}.json`),JSON.stringify(score.variants[variant.name],null,2)+"\n");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      score.blocked_reason = `variant_failed:${variant.name}:${message}`;
      score.variants[variant.name] = {
        ...(score.variants[variant.name] ?? {}),
        status: "blocked",
        fail_reason: message,
      };
      await fs.writeFile(path.join(outDir,"summary.partial.json"),JSON.stringify({ ...score, completedScenarioCount },null,2)+"\n");
      console.error(`[ablation] blocked ${score.blocked_reason}`);
      break;
    } finally { await stopServer(server); }
  }

  score.completedScenarioCount = completedScenarioCount;
  score.run_complete = score.blocked_reason === null && completedScenarioCount === score.expectedScenarioCount;

  if (!score.run_complete) {
    score.driver_verdict = {
      retrieval_lift_proven: "no",
      dominant_channel: "none",
      contributions: { atlas: 0, git_tracked: 0 },
      contribution_ci95: {
        atlas: { low: 0, high: 0 },
        git_tracked: { low: 0, high: 0 },
      },
      bounded_confidence: false,
      strict_gate: {
        positive_lane_ablation_delta: false,
        bounded_confidence: false,
        fault_owner_points_to_retrieval: false,
      },
      stage_fault_matrix: null,
      fault_owner: "unknown",
      status: "blocked",
      blocked_reason: score.blocked_reason ?? "unknown",
      confidence_statement: "run blocked before complete scenario set",
    };
    const jsonPath = "reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.json";
    const mdPath = "reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.md";
    await fs.writeFile(path.join(outDir,"summary.comparison.json"),JSON.stringify(score,null,2)+"\n");
    await fs.writeFile(
      path.join(outDir,"summary.comparison.md"),
      [
        `# Helix Ask Retrieval Ablation Summary (BLOCKED)`,
        "",
        `Run: ${runId}`,
        `run_complete=false`,
        `blocked_reason=${score.blocked_reason ?? "unknown"}`,
        `completedScenarioCount=${completedScenarioCount}/${score.expectedScenarioCount}`,
        "",
      ].join("\n"),
    );
    await fs.writeFile(jsonPath,JSON.stringify(score,null,2)+"\n");
    await fs.writeFile(
      mdPath,
      [
        "# Helix Ask Retrieval Ablation Scorecard (2026-03-03)",
        "",
        `Run: ${runId}`,
        "run_complete=false",
        `blocked_reason=${score.blocked_reason ?? "unknown"}`,
        `completedScenarioCount=${completedScenarioCount}/${score.expectedScenarioCount}`,
        "",
        "Driver verdict: retrieval_lift_proven=no, dominant_channel=none (blocked run).",
        "",
      ].join("\n"),
    );
    await fs.writeFile(
      "reports/helix-ask-retrieval-stage-fault-matrix-2026-03-04.md",
      [
        "# Helix Ask Retrieval Stage-Fault Matrix (2026-03-04)",
        "",
        `Run: ${runId}`,
        "Fault owner: unknown (blocked run)",
        "",
        "No stage matrix emitted because run was blocked before full scenario completion.",
        "",
      ].join("\n"),
    );
    await fs.writeFile(
      "reports/helix-ask-retrieval-attribution-go-no-go-2026-03-03.md",
      [
        "# Helix Ask Retrieval Attribution Go/No-Go (2026-03-03)",
        "",
        `Run: ${runId}`,
        "run_complete=false",
        `blocked_reason=${score.blocked_reason ?? "unknown"}`,
        "",
        "retrieval_lift_proven=no",
        "dominant_channel=none",
        "fault_owner=unknown",
        "",
        "Decision: NO-GO for retrieval-lift claim (run blocked before complete scenario set).",
        "",
      ].join("\n"),
    );
    console.log(`Ablation blocked artifacts written to ${outDir}`);
    return;
  }

  const base = score.variants.baseline_atlas_git_on.aggregate.gold_file_recall_at_10.point_estimate;
  const atlasOff = score.variants.atlas_off_git_on.aggregate.gold_file_recall_at_10.point_estimate;
  const gitOff = score.variants.atlas_on_git_off.aggregate.gold_file_recall_at_10.point_estimate;
  const atlasContribution = base - atlasOff;
  const gitContribution = base - gitOff;
  const maxContribution = Math.max(atlasContribution, gitContribution);
  let dominantChannel = "none";
  if (maxContribution > EPS) {
    if (Math.abs(atlasContribution - gitContribution) <= EPS) dominantChannel = "mixed";
    else dominantChannel = atlasContribution > gitContribution ? "atlas" : "git";
  }
  const baseCI = score.variants.baseline_atlas_git_on.aggregate.gold_file_recall_at_10.ci95;
  const atlasOffCI = score.variants.atlas_off_git_on.aggregate.gold_file_recall_at_10.ci95;
  const gitOffCI = score.variants.atlas_on_git_off.aggregate.gold_file_recall_at_10.ci95;
  const atlasDeltaCI = { low: baseCI.low - atlasOffCI.high, high: baseCI.high - atlasOffCI.low };
  const gitDeltaCI = { low: baseCI.low - gitOffCI.high, high: baseCI.high - gitOffCI.low };
  const boundedConfidence = atlasDeltaCI.low > 0 || gitDeltaCI.low > 0;
  const unmatchedRate = score.variants.baseline_atlas_git_on.diagnostics.unmatched_expected_file_rate;
  const recall10 = score.variants.baseline_atlas_git_on.aggregate.gold_file_recall_at_10.point_estimate;
  const retention = score.variants.baseline_atlas_git_on.aggregate.consequential_file_retention_rate.point_estimate;
  const retrievalStageFault = 1 - Math.max(0, 1 - unmatchedRate) * Math.max(0, recall10);
  const stage_fault_matrix = {
    retrieval: retrievalStageFault,
    candidate_filtering: 1 - recall10,
    rerank: 1 - score.variants.baseline_atlas_git_on.aggregate.rerank_mrr10.point_estimate,
    synthesis_packing: 1 - retention,
    final_cleanup: 1 - score.variants.baseline_atlas_git_on.aggregate.retrieval_doc_share_mean.point_estimate,
  };
  const fault_owner = retrievalStageFault >= 0.5 ? "retrieval" : retention < 0.5 ? "post_processing" : "routing";
  const retrievalLiftProven = maxContribution > EPS && base > EPS && boundedConfidence && fault_owner === "retrieval";
  score.driver_verdict = {
    retrieval_lift_proven: retrievalLiftProven ? "yes" : "no",
    dominant_channel: dominantChannel,
    contributions: {
      atlas: atlasContribution,
      git_tracked: gitContribution,
    },
    contribution_ci95: {
      atlas: atlasDeltaCI,
      git_tracked: gitDeltaCI,
    },
    bounded_confidence: boundedConfidence,
    strict_gate: {
      positive_lane_ablation_delta: maxContribution > EPS,
      bounded_confidence: boundedConfidence,
      fault_owner_points_to_retrieval: fault_owner === "retrieval",
    },
    stage_fault_matrix,
    fault_owner,
    confidence_statement: "95% bootstrap intervals computed over seed/temperature scenarios.",
  };

  const jsonPath="reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.json";
  const mdPath="reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.md";
  await fs.writeFile(path.join(outDir,"summary.comparison.json"),JSON.stringify(score,null,2)+"\n");
  if (score.run_complete) {
    await fs.writeFile(jsonPath,JSON.stringify(score,null,2)+"\n");
  } else {
    await fs.writeFile(path.join(outDir,"scorecard.partial.json"),JSON.stringify(score,null,2)+"\n");
  }
  const rows=Object.entries(score.variants).map(([name,v]:any)=>`| ${name} | ${v.aggregate.gold_file_recall_at_10.point_estimate.toFixed(6)} | ${v.aggregate.gold_file_recall_at_10.ci95.low.toFixed(6)} | ${v.aggregate.gold_file_recall_at_10.ci95.high.toFixed(6)} | ${v.diagnostics.unmatched_expected_file_rate.toFixed(6)} |`);
  const mdContent = [
      `# Helix Ask Retrieval Ablation Scorecard (2026-03-03)`,
      "",
      `Run: ${runId}`,
      `run_complete=${score.run_complete}`,
      "",
      `run_complete=${score.run_complete}`,
      ...(score.blocked ? [`blocked=${JSON.stringify(score.blocked)}`, ""] : []),
      "| Variant | recall@10 point | ci95 low | ci95 high | unmatched_expected_file_rate |",
      "| --- | ---: | ---: | ---: | ---: |",
      ...rows,
      "",
      `Driver verdict: retrieval_lift_proven=${score.driver_verdict.retrieval_lift_proven}, dominant_channel=${score.driver_verdict.dominant_channel}.`,
      `Attribution guard: lane_ablation_delta_positive=${score.driver_verdict.attribution_guard.lane_ablation_delta_positive}, bounded_confidence=${score.driver_verdict.attribution_guard.bounded_confidence}, fault_owner_retrieval=${score.driver_verdict.attribution_guard.fault_owner_retrieval}.`,
      `Contributions: atlas=${score.driver_verdict.contributions.atlas.toFixed(6)}, git_tracked=${score.driver_verdict.contributions.git_tracked.toFixed(6)}.`,
      `Strict gate: positive_lane_ablation_delta=${score.driver_verdict.strict_gate.positive_lane_ablation_delta}, bounded_confidence=${score.driver_verdict.strict_gate.bounded_confidence}, fault_owner_points_to_retrieval=${score.driver_verdict.strict_gate.fault_owner_points_to_retrieval}.`,
      "",
    ].join("\n"),
  );
  await fs.writeFile(path.join(outDir,"summary.comparison.md"),await fs.readFile(mdPath,"utf8"));
  await fs.writeFile(
    "reports/helix-ask-retrieval-stage-fault-matrix-2026-03-04.md",
    [
      "# Helix Ask Retrieval Stage-Fault Matrix (2026-03-04)",
      "",
      `Run: ${runId}`,
      `Fault owner: ${score.driver_verdict.fault_owner}`,
      "",
      "| Stage | Fault score |",
      "| --- | ---: |",
      `| retrieval | ${score.driver_verdict.stage_fault_matrix.retrieval.toFixed(6)} |`,
      `| candidate_filtering | ${score.driver_verdict.stage_fault_matrix.candidate_filtering.toFixed(6)} |`,
      `| rerank | ${score.driver_verdict.stage_fault_matrix.rerank.toFixed(6)} |`,
      `| synthesis_packing | ${score.driver_verdict.stage_fault_matrix.synthesis_packing.toFixed(6)} |`,
      `| final_cleanup | ${score.driver_verdict.stage_fault_matrix.final_cleanup.toFixed(6)} |`,
      "",
    ].join("\n"),
  );
  await fs.writeFile(
    "reports/helix-ask-retrieval-attribution-go-no-go-2026-03-03.md",
    [
      "# Helix Ask Retrieval Attribution Go/No-Go (2026-03-03)",
      "",
      `Run: ${runId}`,
      "",
      `retrieval_lift_proven=${score.driver_verdict.retrieval_lift_proven}`,
      `dominant_channel=${score.driver_verdict.dominant_channel}`,
      `fault_owner=${score.driver_verdict.fault_owner}`,
      "",
      "Strict retrieval-lift claim gate:",
      `- positive lane-ablation delta: ${score.driver_verdict.strict_gate.positive_lane_ablation_delta}`,
      `- bounded confidence: ${score.driver_verdict.strict_gate.bounded_confidence}`,
      `- stage-fault owner points to retrieval: ${score.driver_verdict.strict_gate.fault_owner_points_to_retrieval}`,
      "",
      score.driver_verdict.retrieval_lift_proven === "yes"
        ? "Decision: GO for retrieval-lift claim (strict gate passed)."
        : "Decision: NO-GO for retrieval-lift claim (strict gate not satisfied).",
      "",
    ].join("\n"),
  );
  console.log(`Ablation artifacts written to ${outDir}`);
};

await main();
