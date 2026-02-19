import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const BASE_URL = process.env.HELIX_ASK_BASE_URL ?? "http://127.0.0.1:5173";
const BASELINE_RUN_ID = "versatility-1771461446899";
const BASELINE = {
  report_mode_mismatch: 21,
  relation_failures: 12,
  citation_missing: 9,
  clocka_tool_cap_stop_rate: 0.463,
  latency_total_p95_ms: 1931,
  invalid_error_rate: 0,
};

const GATES = {
  report_mode_mismatch: 10,
  relation_failures: 6,
  citation_missing: 4,
  clocka_tool_cap_stop_rate: 0.35,
  latency_total_p95_ms: 1600,
  invalid_error_rate: 0,
};

type Candidate = {
  id: string;
  weights: {
    balanced: { goal: number; evidenceGain: number; latencyCost: number; risk: number; budgetPressure: number };
    evidence_first: { goal: number; evidenceGain: number; latencyCost: number; risk: number; budgetPressure: number };
    latency_first: { goal: number; evidenceGain: number; latencyCost: number; risk: number; budgetPressure: number };
  };
};

type EvalResult = {
  id: string;
  metrics: {
    report_mode_mismatch: number;
    relation_failures: number;
    citation_missing: number;
    clocka_tool_cap_stop_rate: number;
    latency_total_p95_ms: number;
    invalid_error_rate: number;
  };
  passes: boolean;
  score: number;
  summaryPath: string;
};

const nowStamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");

const postAskProbe = async (): Promise<{ status: number; ok: boolean; body: Record<string, unknown> }> => {
  const response = await fetch(new URL("/api/agi/ask", BASE_URL), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      question: "health check",
      temperature: 0,
      seed: 7,
      debug: true,
      sessionId: `helix-ps3-availability-${Date.now()}`,
    }),
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, ok: response.status === 200, body };
};

const runCommand = async (command: string, args: string[], env: NodeJS.ProcessEnv): Promise<{ code: number; stdout: string; stderr: string }> => {
  const { spawn } = await import("node:child_process");
  return await new Promise((resolve) => {
    const child = spawn(command, args, { env: { ...process.env, ...env }, cwd: process.cwd(), shell: process.platform === "win32" });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      const text = String(chunk);
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = String(chunk);
      stderr += text;
      process.stderr.write(text);
    });
    child.on("exit", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
};


export const extractStopReason = (row: Record<string, unknown>): string => {
  const debug = row.debug;
  const debugRecord = debug && typeof debug === "object" ? (debug as Record<string, unknown>) : undefined;
  return String(
    debugRecord?.agent_stop_reason ??
      debugRecord?.controller_stop_reason ??
      row.stop_reason ??
      "",
  );
};

const countFailures = (failures: Array<{ key: string; count: number }>, key: string): number =>
  failures
    .filter((entry) => entry.key === key || entry.key.startsWith(`${key}:`))
    .reduce((sum, entry) => sum + entry.count, 0);

const percentile = (values: number[], q: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil((q / 100) * sorted.length) - 1);
  return sorted[index] ?? 0;
};

const evaluateCandidate = async (candidate: Candidate, rootOutDir: string): Promise<EvalResult> => {
  const runLabel = `${candidate.id}-${Date.now()}`;
  const runOutDir = path.join(rootOutDir, runLabel);
  await fs.mkdir(runOutDir, { recursive: true });

  const env = {
    HELIX_ASK_MOVE_PROFILE_WEIGHTS: JSON.stringify(candidate.weights),
    HELIX_ASK_VERSATILITY_OUT: runOutDir,
    HELIX_ASK_VERSATILITY_REPORT: path.join(runOutDir, "report.md"),
    HELIX_ASK_VERSATILITY_ISOLATE_RUN_DIR: "1",
    HELIX_ASK_VERSATILITY_RESUME_FROM_LATEST: "0",
    HELIX_ASK_VERSATILITY_START_SERVER: "0",
    HELIX_ASK_VERSATILITY_SEEDS: "7,11,13",
    HELIX_ASK_VERSATILITY_TEMPS: "0.2",
    HELIX_ASK_VERSATILITY_MAX_RETRIES: "3",
    HELIX_ASK_VERSATILITY_TIMEOUT_MS: "15000",
    HELIX_ASK_VERSATILITY_MAX_CASE_WALL_MS: "25000",
    HELIX_ASK_VERSATILITY_CHECKPOINT_EVERY: "10",
    HELIX_ASK_VERSATILITY_FAIL_ON_INCOMPLETE: "1",
  };

  const result = await runCommand("npx", ["tsx", "scripts/helix-ask-versatility-record.ts"], env);
  if (result.code !== 0) {
    return {
      id: candidate.id,
      metrics: {
        report_mode_mismatch: Number.MAX_SAFE_INTEGER,
        relation_failures: Number.MAX_SAFE_INTEGER,
        citation_missing: Number.MAX_SAFE_INTEGER,
        clocka_tool_cap_stop_rate: 1,
        latency_total_p95_ms: Number.MAX_SAFE_INTEGER,
        invalid_error_rate: 1,
      },
      passes: false,
      score: Number.NEGATIVE_INFINITY,
      summaryPath: path.join(runOutDir, "(failed run)"),
    };
  }

  const latestRaw = await fs.readFile(path.join(runOutDir, "latest.json"), "utf8");
  const latest = JSON.parse(latestRaw) as { output_run_dir: string };
  const summaryPath = path.resolve(latest.output_run_dir, "summary.json");
  const failuresPath = path.resolve(latest.output_run_dir, "failures.json");
  const rawDir = path.resolve(latest.output_run_dir, "raw");

  const [summaryRaw, failuresRaw, rawFiles] = await Promise.all([
    fs.readFile(summaryPath, "utf8"),
    fs.readFile(failuresPath, "utf8"),
    fs.readdir(rawDir),
  ]);

  const summary = JSON.parse(summaryRaw) as Record<string, unknown>;
  const failureBundle = JSON.parse(failuresRaw) as { top_failure_signatures?: Array<{ key: string; count: number }> };
  const failures = failureBundle.top_failure_signatures ?? [];
  const rows: Array<Record<string, unknown>> = [];
  for (const file of rawFiles.filter((f) => f.endsWith(".json"))) {
    const one = JSON.parse(await fs.readFile(path.join(rawDir, file), "utf8")) as Record<string, unknown>;
    rows.push(one);
  }

  const clockaStops = rows.filter((row) => extractStopReason(row) === "clocka_tool_cap").length;
  const invalidErrors = rows.filter((row) => {
    const failures = (row.failures ?? []) as unknown[];
    return failures.some((f) => String(f).startsWith("request_failed:"));
  }).length;
  const latencies = rows.map((row) => Number(row.latency_ms ?? 0)).filter((v) => Number.isFinite(v) && v >= 0);

  const metrics = {
    report_mode_mismatch: countFailures(failures, "report_mode_mismatch"),
    relation_failures: countFailures(failures, "relation_packet_built"),
    citation_missing: countFailures(failures, "citation_missing"),
    clocka_tool_cap_stop_rate: rows.length ? clockaStops / rows.length : 1,
    latency_total_p95_ms: Number((summary.latency?.["total"]?.["p95"] ?? percentile(latencies, 95)) || percentile(latencies, 95)),
    invalid_error_rate: rows.length ? invalidErrors / rows.length : 1,
  };

  const passes =
    metrics.report_mode_mismatch <= GATES.report_mode_mismatch &&
    metrics.relation_failures <= GATES.relation_failures &&
    metrics.citation_missing <= GATES.citation_missing &&
    metrics.clocka_tool_cap_stop_rate <= GATES.clocka_tool_cap_stop_rate &&
    metrics.latency_total_p95_ms <= GATES.latency_total_p95_ms &&
    metrics.invalid_error_rate === GATES.invalid_error_rate;

  const score =
    (BASELINE.report_mode_mismatch - metrics.report_mode_mismatch) * 4 +
    (BASELINE.relation_failures - metrics.relation_failures) * 4 +
    (BASELINE.citation_missing - metrics.citation_missing) * 3 +
    (BASELINE.clocka_tool_cap_stop_rate - metrics.clocka_tool_cap_stop_rate) * 100 +
    (BASELINE.latency_total_p95_ms - metrics.latency_total_p95_ms) / 20 -
    metrics.invalid_error_rate * 1000;

  return { id: candidate.id, metrics, passes, score, summaryPath };
};

async function main() {
  const timestamp = nowStamp();
  const outDir = path.join("artifacts", "experiments", "helix-ask-quake-weight-tuning", timestamp);
  await fs.mkdir(outDir, { recursive: true });

  const probes = [] as Array<{ idx: number; status: number; ok: boolean; reason?: string }>;
  for (let i = 0; i < 3; i += 1) {
    const probe = await postAskProbe();
    probes.push({
      idx: i + 1,
      status: probe.status,
      ok: probe.ok,
      reason: String(probe.body.fail_reason ?? probe.body.error ?? probe.body.message ?? ""),
    });
  }

  const availabilityOk = probes.every((p) => p.ok);
  if (!availabilityOk) {
    const blocked = {
      status: "BLOCKED",
      baseline_run_id: BASELINE_RUN_ID,
      probes,
      message: "Availability gate failed: expected 3/3 POST /api/agi/ask = 200",
    };
    await fs.writeFile(path.join(outDir, "summary.json"), `${JSON.stringify(blocked, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(blocked, null, 2));
    process.exit(2);
  }

  const candidates: Candidate[] = [
    {
      id: "quake-balance-a",
      weights: {
        balanced: { goal: 1.03, evidenceGain: 1.15, latencyCost: 0.92, risk: 1, budgetPressure: 0.92 },
        evidence_first: { goal: 1.02, evidenceGain: 1.6, latencyCost: 0.66, risk: 0.98, budgetPressure: 0.8 },
        latency_first: { goal: 0.95, evidenceGain: 1.02, latencyCost: 1.25, risk: 1, budgetPressure: 1.08 },
      },
    },
    {
      id: "quake-balance-b",
      weights: {
        balanced: { goal: 1.01, evidenceGain: 1.08, latencyCost: 0.94, risk: 1, budgetPressure: 0.9 },
        evidence_first: { goal: 1.0, evidenceGain: 1.48, latencyCost: 0.7, risk: 1, budgetPressure: 0.82 },
        latency_first: { goal: 0.95, evidenceGain: 0.98, latencyCost: 1.22, risk: 1, budgetPressure: 1.06 },
      },
    },
    {
      id: "quake-latency-c",
      weights: {
        balanced: { goal: 0.98, evidenceGain: 1.02, latencyCost: 0.9, risk: 1, budgetPressure: 0.9 },
        evidence_first: { goal: 0.98, evidenceGain: 1.4, latencyCost: 0.72, risk: 1, budgetPressure: 0.86 },
        latency_first: { goal: 0.92, evidenceGain: 0.9, latencyCost: 1.4, risk: 1, budgetPressure: 1.2 },
      },
    },
  ];

  const results: EvalResult[] = [];
  for (const candidate of candidates) {
    const result = await evaluateCandidate(candidate, outDir);
    results.push(result);
  }

  const winner = [...results].sort((a, b) => b.score - a.score)[0];
  const promoted = winner?.passes === true;

  const deltaVsBaseline = winner
    ? {
        baseline_run_id: BASELINE_RUN_ID,
        winner_id: winner.id,
        promoted,
        delta: {
          report_mode_mismatch: winner.metrics.report_mode_mismatch - BASELINE.report_mode_mismatch,
          relation_failures: winner.metrics.relation_failures - BASELINE.relation_failures,
          citation_missing: winner.metrics.citation_missing - BASELINE.citation_missing,
          clocka_tool_cap_stop_rate: Number((winner.metrics.clocka_tool_cap_stop_rate - BASELINE.clocka_tool_cap_stop_rate).toFixed(4)),
          latency_total_p95_ms: winner.metrics.latency_total_p95_ms - BASELINE.latency_total_p95_ms,
          invalid_error_rate: winner.metrics.invalid_error_rate - BASELINE.invalid_error_rate,
        },
      }
    : { baseline_run_id: BASELINE_RUN_ID, promoted: false, reason: "no_candidates" };

  const summary = {
    status: "OK",
    baseline_run_id: BASELINE_RUN_ID,
    probes,
    gates: GATES,
    promoted,
    winner_id: winner?.id ?? null,
    candidate_count: results.length,
  };

  await fs.writeFile(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(outDir, "candidates.json"), `${JSON.stringify({ candidates, results }, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(outDir, "winner.json"), `${JSON.stringify(winner ?? null, null, 2)}\n`, "utf8");
  await fs.writeFile(path.join(outDir, "delta-vs-baseline.json"), `${JSON.stringify(deltaVsBaseline, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({ outDir, summary, winner }, null, 2));
}

const isMainModule = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;

if (isMainModule) {
  main().catch((error) => {
    console.error("[helix-ask-quake-weight-tuning] failed", error);
    process.exit(1);
  });
}
