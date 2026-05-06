import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalize } from "node:path";

const CLAIM_BOUNDARY = {
  validationClaimAllowed: false,
  physicalMechanismClaimAllowed: false,
  promotionAllowed: false,
} as const;

type CommandSummary = {
  name: string;
  command: string[];
  status: "pass" | "fail" | "timed_out" | "incomplete";
  exitCode: number | null;
  timedOut: boolean;
  logRefs: Record<string, string | null>;
};

const COMMANDS = [
  { name: "render-layered-ledger-atlas", command: ["npm", "run", "nhm2:render-layered-ledger-atlas"] },
  { name: "validate-layered-ledger-atlas", command: ["npm", "run", "nhm2:validate-layered-ledger-atlas"] },
  { name: "ricci4-turntable", command: ["npm", "run", "render:nhm2:ricci4-turntable"] },
  { name: "reference-validation-chain-latest", command: ["npm", "run", "nhm2:run-reference-validation-chain:latest"] },
  { name: "physics-validate-bounded", command: ["npm", "run", "physics:validate:bounded"] },
  { name: "test-nhm2-atlas", command: ["npm", "run", "test:nhm2:atlas"] },
] as const;

const newestManifest = (): { path: string; outDir: string; runId: string } | null => {
  const root = path.join(process.cwd(), "artifacts", "research", "full-solve", "rendered", "layered-ledger-atlas");
  if (!fs.existsSync(root)) return null;
  const candidates = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name, "manifest.json"))
    .filter((candidate) => fs.existsSync(candidate))
    .map((candidate) => {
      let generatedAt = "";
      let runId = path.basename(path.dirname(candidate));
      try {
        const json = JSON.parse(fs.readFileSync(candidate, "utf8"));
        generatedAt = String(json.generatedAt ?? "");
        runId = String(json.runId ?? runId);
      } catch {
        generatedAt = "";
      }
      return { path: candidate, outDir: path.dirname(candidate), generatedAt, runId, mtimeMs: fs.statSync(candidate).mtimeMs };
    });
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const byGenerated = b.generatedAt.localeCompare(a.generatedAt);
    if (byGenerated !== 0) return byGenerated;
    const byMtime = b.mtimeMs - a.mtimeMs;
    if (byMtime !== 0) return byMtime;
    return b.path.localeCompare(a.path);
  });
  return candidates[0];
};

const rel = (filePath: string | null): string | null => {
  if (filePath == null) return null;
  const relative = path.relative(process.cwd(), filePath);
  return relative.length > 0 && !relative.startsWith("..") ? relative : filePath;
};

const readPhysicsResult = (): { timedOut: boolean; status: CommandSummary["status"]; exitCode: number | null; resultPath: string | null } => {
  const resultPath = path.join("artifacts", "research", "full-solve", "logs", "physics-validate", "run-result.json");
  if (!fs.existsSync(resultPath)) return { timedOut: false, status: "incomplete", exitCode: null, resultPath: null };
  try {
    const result = JSON.parse(fs.readFileSync(resultPath, "utf8"));
    if (result.timedOut === true) return { timedOut: true, status: "timed_out", exitCode: result.exitCode ?? null, resultPath };
    return { timedOut: false, status: result.exitCode === 0 ? "pass" : "fail", exitCode: result.exitCode ?? null, resultPath };
  } catch {
    return { timedOut: false, status: "incomplete", exitCode: null, resultPath };
  }
};

const runCommand = (name: string, command: string[], logsDir: string): CommandSummary => {
  fs.mkdirSync(logsDir, { recursive: true });
  const stdoutPath = path.join(logsDir, `${name}.stdout.log`);
  const stderrPath = path.join(logsDir, `${name}.stderr.log`);
  const result = spawnSync(command[0], command.slice(1), {
    cwd: process.cwd(),
    shell: process.platform === "win32",
    encoding: "utf8",
  });
  fs.writeFileSync(stdoutPath, result.stdout ?? "", "utf8");
  fs.writeFileSync(stderrPath, result.stderr ?? "", "utf8");
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (name === "physics-validate-bounded") {
    const physics = readPhysicsResult();
    return {
      name,
      command,
      status: physics.status,
      exitCode: physics.exitCode ?? result.status,
      timedOut: physics.timedOut,
      logRefs: {
        stdout: rel(stdoutPath),
        stderr: rel(stderrPath),
        boundedResult: physics.resultPath,
      },
    };
  }

  return {
    name,
    command,
    status: result.status === 0 ? "pass" : "fail",
    exitCode: result.status,
    timedOut: false,
    logRefs: { stdout: rel(stdoutPath), stderr: rel(stderrPath) },
  };
};

const main = (): void => {
  let manifest = newestManifest();
  const fallbackRoot = path.join(
    process.cwd(),
    "artifacts",
    "research",
    "full-solve",
    "rendered",
    "layered-ledger-atlas",
    new Date().toISOString().slice(0, 10),
  );
  const initialOutDir = manifest?.outDir ?? fallbackRoot;
  const logsDir = path.join(initialOutDir, "verification-logs");
  const commands: CommandSummary[] = [];

  for (const entry of COMMANDS) {
    commands.push(runCommand(entry.name, [...entry.command], logsDir));
    if (entry.name === "render-layered-ledger-atlas") manifest = newestManifest() ?? manifest;
  }

  const outDir = manifest?.outDir ?? initialOutDir;
  fs.mkdirSync(outDir, { recursive: true });
  const rendererGate = commands
    .filter((entry) => ["render-layered-ledger-atlas", "validate-layered-ledger-atlas", "ricci4-turntable", "test-nhm2-atlas"].includes(entry.name))
    .every((entry) => entry.status === "pass");
  const referenceGate = commands.find((entry) => entry.name === "reference-validation-chain-latest")?.status === "pass";
  const physicsGate = commands.find((entry) => entry.name === "physics-validate-bounded")?.status === "pass";
  const fullRepoGate = false;
  const anyFail = commands.some((entry) => entry.status === "fail");
  const anyTimedOutOrIncomplete = commands.some((entry) => entry.status === "timed_out" || entry.status === "incomplete");
  const status = rendererGate && referenceGate && physicsGate && !anyFail && !anyTimedOutOrIncomplete ? "partial" : anyFail ? "fail" : "partial";

  const summary = {
    feature: "nhm2-layered-ledger-atlas-renderer",
    status,
    generatedAt: new Date().toISOString(),
    commands,
    acceptedRendererGate: rendererGate,
    acceptedReferenceChainGate: referenceGate,
    acceptedPhysicsValidationGate: physicsGate,
    acceptedFullRepoTestGate: fullRepoGate,
    knownExternalFailures: {
      status: "not_baselined_in_this_command",
      procedure: [
        "Checkout main.",
        "Run npm test.",
        "Record failures.",
        "Checkout feature branch.",
        "Run npm test.",
        "Compare failures and fix branch-only failures before merge.",
      ],
      previouslyObservedSuites: ["proof-surface lock", "Helix", "bounded-stack", "voice", "doc-acquisition"],
    },
    claimBoundary: CLAIM_BOUNDARY,
  };
  fs.writeFileSync(path.join(outDir, "verification-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ ok: true, summary: rel(path.join(outDir, "verification-summary.json")), status }, null, 2)}\n`);
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
