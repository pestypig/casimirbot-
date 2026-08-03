import fs from "node:fs";
import path from "node:path";

const INSTALL_KEY = Symbol.for("casimir.runtime.process-diagnostics.installed");
const MAX_ERROR_TEXT = 320;

type DiagnosticGlobal = typeof globalThis & {
  [INSTALL_KEY]?: boolean;
};

const sanitizeErrorText = (value: unknown): string =>
  String(value ?? "unknown")
    .replace(/(authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi, "Bearer [redacted]")
    .slice(0, MAX_ERROR_TEXT);

const diagnosticDirectory = (): string =>
  path.resolve(process.cwd(), process.env.HELIX_RUNTIME_CRASH_REPORT_DIR ?? ".cal/runtime-crash-reports");

const appendRuntimeEvent = (event: Record<string, unknown>): void => {
  try {
    const directory = diagnosticDirectory();
    fs.mkdirSync(directory, { recursive: true });
    fs.appendFileSync(
      path.join(directory, "node-runtime-events.jsonl"),
      `${JSON.stringify({ ts: new Date().toISOString(), pid: process.pid, ...event })}\n`,
      { encoding: "utf8" },
    );
  } catch {
    // Diagnostics must never become a second process failure.
  }
};

export const installRuntimeProcessDiagnostics = (): void => {
  const diagnosticGlobal = globalThis as DiagnosticGlobal;
  if (diagnosticGlobal[INSTALL_KEY]) return;
  diagnosticGlobal[INSTALL_KEY] = true;

  try {
    const directory = diagnosticDirectory();
    fs.mkdirSync(directory, { recursive: true });
    if (process.report) {
      process.report.directory = directory;
      process.report.reportOnFatalError = true;
      process.report.reportOnUncaughtException = true;
      if ("excludeEnv" in process.report) {
        process.report.excludeEnv = true;
      }
    }
  } catch (error) {
    appendRuntimeEvent({
      kind: "diagnostic_initialization_failed",
      error: sanitizeErrorText(error instanceof Error ? error.message : error),
    });
  }

  process.on("uncaughtExceptionMonitor", (error, origin) => {
    appendRuntimeEvent({
      kind: "uncaught_exception",
      origin,
      error_name: error.name,
      error_code: "code" in error ? sanitizeErrorText(error.code) : undefined,
      message: sanitizeErrorText(error.message),
      memory: process.memoryUsage(),
    });
  });

  process.on("exit", (code) => {
    appendRuntimeEvent({
      kind: "process_exit",
      exit_code: code,
      memory: process.memoryUsage(),
    });
  });
};

export const runtimeProcessDiagnostics = {
  install: installRuntimeProcessDiagnostics,
};
