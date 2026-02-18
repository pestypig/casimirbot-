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

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const workspaceRoot = path.resolve(process.env.TOE_PREFLIGHT_ROOT ?? repoRoot);
const tsxCliPath = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");

const stageConfigs: StageConfig[] = [
  { id: "validate-toe-ticket-backlog", script: path.join("scripts", "validate-toe-ticket-backlog.ts"), required: true },
  { id: "validate-toe-ticket-results", script: path.join("scripts", "validate-toe-ticket-results.ts"), required: true },
  { id: "validate-resolver-owner-coverage", script: path.join("scripts", "validate-resolver-owner-coverage.ts"), required: true },
  { id: "validate-toe-research-gate-policy", script: path.join("scripts", "validate-toe-research-gate-policy.ts"), required: false },
  { id: "compute-toe-progress", script: path.join("scripts", "compute-toe-progress.ts"), required: true },
];

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

function main() {
  const stages = stageConfigs.map(runStage);
  const overallPass = stages.every((stage) => stage.pass);

  const summary = {
    schema_version: "toe_agent_preflight/1",
    generated_at: new Date().toISOString(),
    workspace_root: workspaceRoot,
    overall_pass: overallPass,
    stages,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exit(overallPass ? 0 : 1);
}

main();
