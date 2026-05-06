import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalize } from "node:path";

type ParsedArgs = {
  timeoutMs: number;
  outDir: string;
  command: string[];
};

const parseArgs = (argv: string[]): ParsedArgs => {
  const separator = argv.indexOf("--");
  if (separator < 0 || separator === argv.length - 1) {
    throw new Error("usage: tsx tools/ci/run-with-timeout.ts --timeout-ms <ms> --out <dir> -- <command...>");
  }
  const options = argv.slice(0, separator);
  const command = argv.slice(separator + 1);
  const valueAfter = (flag: string): string | null => {
    const index = options.indexOf(flag);
    return index >= 0 ? options[index + 1] ?? null : null;
  };
  const timeoutRaw = valueAfter("--timeout-ms");
  const outDir = valueAfter("--out");
  const timeoutMs = Number(timeoutRaw);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("invalid --timeout-ms");
  if (outDir == null || outDir.trim().length === 0) throw new Error("missing --out");
  return { timeoutMs, outDir, command };
};

const killProcessTree = (pid: number): void => {
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/pid", String(pid), "/t", "/f"], { stdio: "ignore" });
      return;
    }
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      process.kill(pid, "SIGTERM");
    }
  } catch {
    // Best-effort cleanup; the result JSON still records timeout state.
  }
};

const run = async (): Promise<number> => {
  const parsed = parseArgs(process.argv.slice(2));
  fs.mkdirSync(parsed.outDir, { recursive: true });

  const stdoutPath = path.join(parsed.outDir, "stdout.log");
  const stderrPath = path.join(parsed.outDir, "stderr.log");
  const resultPath = path.join(parsed.outDir, "run-result.json");
  const stdout = fs.createWriteStream(stdoutPath, { flags: "w" });
  const stderr = fs.createWriteStream(stderrPath, { flags: "w" });
  const startedAt = new Date().toISOString();

  let timedOut = false;
  let signal: NodeJS.Signals | null = null;
  let exitCode: number | null = null;

  const child = spawn(parsed.command[0], parsed.command.slice(1), {
    cwd: process.cwd(),
    shell: process.platform === "win32",
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk: Buffer) => {
    process.stdout.write(chunk);
    stdout.write(chunk);
  });
  child.stderr.on("data", (chunk: Buffer) => {
    process.stderr.write(chunk);
    stderr.write(chunk);
  });

  const timeout = setTimeout(() => {
    timedOut = true;
    if (child.pid != null) killProcessTree(child.pid);
  }, parsed.timeoutMs);

  await new Promise<void>((resolve) => {
    child.on("close", (code, closeSignal) => {
      clearTimeout(timeout);
      exitCode = code;
      signal = closeSignal;
      resolve();
    });
  });

  await new Promise<void>((resolve) => stdout.end(resolve));
  await new Promise<void>((resolve) => stderr.end(resolve));

  const finishedAt = new Date().toISOString();
  const result = {
    command: parsed.command,
    timeoutMs: parsed.timeoutMs,
    startedAt,
    finishedAt,
    exitCode,
    timedOut,
    signal,
    stdoutPath,
    stderrPath,
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  if (timedOut) return 124;
  return exitCode ?? 1;
};

if (normalize(process.argv[1] ?? "") === normalize(fileURLToPath(import.meta.url))) {
  run()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
