import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

type StageStatus = "pass" | "fail" | "skipped";

type StageSummary = {
  id: string;
  command: string;
  required: boolean;
  status: StageStatus;
  pass: boolean;
  present: boolean;
  exit_code: number | null;
  duration_ms: number;
  stdout: string;
  stderr: string;
};

type StageConfig = {
  id: string;
  script: string;
  required: boolean;
};


type StrictReadySnapshot = {
  schema_version?: string;
  totals?: {
    strict_ready_progress_pct?: number;
    strict_ready_release_gate?: {
      status?: "ready" | "blocked";
      blocked_reasons?: Array<"missing_verified_pass" | "missing_research_artifacts">;
      blocked_ticket_count?: number;
      ready_ticket_count?: number;
    };
  };
  strict_ready_delta_targets?: unknown[];
};

type StrictReadyStallWarning = {
  warning: "strict_ready_stall";
  strict_ready_progress_pct: number | null;
  strict_ready_delta_ticket_count: number;
  guidance: string;
};

type StrictReadyEnforcement = {
  enforced: boolean;
  blocked: boolean;
  reason: "strict_ready_stall" | "strict_ready_release_gate" | null;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const workspaceRoot = path.resolve(process.env.TOE_PREFLIGHT_ROOT ?? repoRoot);
const tsxCliPath = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");

const stageConfigs: StageConfig[] = [
  { id: "validate-toe-ticket-backlog", script: path.join("scripts", "validate-toe-ticket-backlog.ts"), required: true },
  { id: "validate-toe-ticket-results", script: path.join("scripts", "validate-toe-ticket-results.ts"), required: true },
  { id: "validate-physics-equation-backbone", script: path.join("scripts", "validate-physics-equation-backbone.ts"), required: true },
  { id: "validate-resolver-owner-coverage", script: path.join("scripts", "validate-resolver-owner-coverage.ts"), required: true },
  { id: "validate-toe-research-gate-policy", script: path.join("scripts", "validate-toe-research-gate-policy.ts"), required: false },
  { id: "compute-toe-progress", script: path.join("scripts", "compute-toe-progress.ts"), required: true },
];



type StrictReadyReleaseGateSummary = {
  status: "ready" | "blocked";
  blocked_reasons: Array<"missing_verified_pass" | "missing_research_artifacts">;
  blocked_ticket_count: number;
  ready_ticket_count: number;
};

const TOE_PROGRESS_SNAPSHOT_PATH = path.resolve(
  workspaceRoot,
  process.env.TOE_PROGRESS_SNAPSHOT_PATH ?? path.join("docs", "audits", "toe-progress-snapshot.json"),
);

function runStage(stage: StageConfig): StageSummary {
  const scriptPath = path.resolve(workspaceRoot, stage.script);
  const command = `node ${path.relative(workspaceRoot, tsxCliPath)} ${path.relative(workspaceRoot, scriptPath)}`;
  const start = Date.now();
  const present = fs.existsSync(scriptPath);

  if (!present && !stage.required) {
    return {
      id: stage.id,
      command,
      required: stage.required,
      status: "skipped",
      pass: true,
      present,
      exit_code: null,
      duration_ms: Date.now() - start,
      stdout: "",
      stderr: "optional stage script not present",
    };
  }

  if (!present) {
    return {
      id: stage.id,
      command,
      required: stage.required,
      status: "fail",
      pass: false,
      present,
      exit_code: null,
      duration_ms: Date.now() - start,
      stdout: "",
      stderr: `required stage script not present: ${scriptPath}`,
    };
  }

  const result = spawnSync(process.execPath, [tsxCliPath, scriptPath], {
    cwd: workspaceRoot,
    env: process.env,
    encoding: "utf8",
  });

  const status: StageStatus = result.status === 0 ? "pass" : "fail";

  return {
    id: stage.id,
    command,
    required: stage.required,
    status,
    pass: status === "pass",
    present,
    exit_code: result.status,
    duration_ms: Date.now() - start,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}


function readStrictReadyStallWarning(stages: StageSummary[]): StrictReadyStallWarning | null {
  const computeStage = stages.find((stage) => stage.id === "compute-toe-progress");
  if (!computeStage || !computeStage.pass) {
    return null;
  }

  if (!fs.existsSync(TOE_PROGRESS_SNAPSHOT_PATH)) {
    return null;
  }

  const parsed = JSON.parse(
    fs.readFileSync(TOE_PROGRESS_SNAPSHOT_PATH, "utf8"),
  ) as StrictReadySnapshot;

  if (parsed.schema_version !== "toe_progress_snapshot/1") {
    return null;
  }

  const strictReadyProgressRaw = parsed.totals?.strict_ready_progress_pct;
  const strictReadyProgress =
    typeof strictReadyProgressRaw === "number" ? strictReadyProgressRaw : null;
  const deltaTargets = Array.isArray(parsed.strict_ready_delta_targets)
    ? parsed.strict_ready_delta_targets
    : [];
  const deltaTicketCount = deltaTargets.length;

  if (strictReadyProgress !== null && strictReadyProgress > 0) {
    return null;
  }

  if (deltaTicketCount === 0) {
    return null;
  }

  return {
    warning: "strict_ready_stall",
    strict_ready_progress_pct: strictReadyProgress,
    strict_ready_delta_ticket_count: deltaTicketCount,
    guidance:
      "strict_ready_progress_pct is stalled; resolve strict_ready_delta_targets in toe-progress snapshot before scaling.",
  };
}


function readStrictReadyReleaseGate(stages: StageSummary[]): StrictReadyReleaseGateSummary | null {
  const computeStage = stages.find((stage) => stage.id === "compute-toe-progress");
  if (!computeStage || !computeStage.pass) {
    return null;
  }

  if (!fs.existsSync(TOE_PROGRESS_SNAPSHOT_PATH)) {
    return null;
  }

  const parsed = JSON.parse(
    fs.readFileSync(TOE_PROGRESS_SNAPSHOT_PATH, "utf8"),
  ) as StrictReadySnapshot;

  if (parsed.schema_version !== "toe_progress_snapshot/1") {
    return null;
  }

  const gate = parsed.totals?.strict_ready_release_gate;
  if (!gate || (gate.status !== "ready" && gate.status !== "blocked")) {
    return null;
  }

  return {
    status: gate.status,
    blocked_reasons: Array.isArray(gate.blocked_reasons)
      ? gate.blocked_reasons.filter(
          (reason): reason is "missing_verified_pass" | "missing_research_artifacts" =>
            reason === "missing_verified_pass" || reason === "missing_research_artifacts",
        )
      : [],
    blocked_ticket_count:
      typeof gate.blocked_ticket_count === "number" ? gate.blocked_ticket_count : 0,
    ready_ticket_count: typeof gate.ready_ticket_count === "number" ? gate.ready_ticket_count : 0,
  };
}

function main() {
  const stages = stageConfigs.map(runStage);
  const stagePass = stages.every((stage) => stage.pass);

  const strictReadyStallWarning = readStrictReadyStallWarning(stages);
  const strictReadyReleaseGate = readStrictReadyReleaseGate(stages);
  const strictReadyEnforced = process.env.TOE_STRICT_READY_ENFORCE === "1";
  const strictReadyReleaseGateEnforced = process.env.TOE_STRICT_READY_RELEASE_GATE_ENFORCE === "1";
  const strictReadyStallBlocked = strictReadyEnforced && strictReadyStallWarning !== null;
  const strictReadyReleaseGateBlocked =
    strictReadyReleaseGateEnforced && strictReadyReleaseGate?.status === "blocked";
  const strictReadyBlocked = strictReadyStallBlocked || strictReadyReleaseGateBlocked;
  const overallPass = stagePass && !strictReadyBlocked;

  const strictReadyEnforcement: StrictReadyEnforcement = {
    enforced: strictReadyEnforced || strictReadyReleaseGateEnforced,
    blocked: strictReadyBlocked,
    reason: strictReadyStallBlocked
      ? "strict_ready_stall"
      : strictReadyReleaseGateBlocked
        ? "strict_ready_release_gate"
        : null,
  };

  const summary = {
    schema_version: "toe_agent_preflight/1",
    generated_at: new Date().toISOString(),
    workspace_root: workspaceRoot,
    stage_pass: stagePass,
    overall_pass: overallPass,
    strict_ready_stall_warning: strictReadyStallWarning,
    strict_ready_release_gate: strictReadyReleaseGate,
    strict_ready_enforcement: strictReadyEnforcement,
    stages,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exit(overallPass ? 0 : 1);
}

main();
