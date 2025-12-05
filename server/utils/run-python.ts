import { execFile } from "node:child_process";
import path from "node:path";

type RunPythonOptions = {
  args?: string[];
  cwd?: string;
  env?: Record<string, string | undefined>;
  timeoutMs?: number;
  pythonBin?: string;
};

/**
 * Execute a Python script (default: SUNPY_PYTHON_BIN) and parse JSON from stdout.
 * Rejects on non-zero exit, stderr noise, or invalid JSON.
 */
export async function runPythonScript(scriptPath: string, options: RunPythonOptions = {}): Promise<any> {
  const {
    args = [],
    cwd,
    env,
    timeoutMs = 300_000,
    pythonBin = process.env.SUNPY_PYTHON_BIN || process.env.PYTHON_BIN || "python",
  } = options;

  const resolvedScript = path.isAbsolute(scriptPath) ? scriptPath : path.resolve(process.cwd(), scriptPath);

  return new Promise((resolve, reject) => {
    const child = execFile(
      pythonBin,
      [resolvedScript, ...args],
      {
        cwd,
        env: { ...process.env, ...env },
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024, // safeguard: allow moderately large JSON
      },
      (error, stdout, stderr) => {
        if (error) {
          // Enrich the error with exit metadata and a short stderr/stdout preview.
          const meta = [
            error.code ? `code=${error.code}` : "",
            error.killed ? "killed=true" : "",
            error.signal ? `signal=${error.signal}` : "",
            error.message?.includes("timeout") ? "reason=timeout" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const stderrPreview = stderr && stderr.trim() ? ` stderr=${stderr.trim().slice(0, 500)}` : "";
          const stdoutPreview = stdout && stdout.trim() ? ` stdout=${stdout.trim().slice(0, 300)}` : "";
          return reject(new Error(`[run-python] ${error.message}${meta ? ` (${meta})` : ""}${stderrPreview}${stdoutPreview}`));
        }
        const text = stdout?.toString()?.trim();
        if (!text) {
          return reject(new Error("[run-python] empty stdout from python script"));
        }
        try {
          const parsed = JSON.parse(text);
          return resolve(parsed);
        } catch (err) {
          return reject(
            new Error(
              `[run-python] failed to parse JSON: ${(err as Error)?.message ?? err} :: stdout=${text.slice(0, 800)}`,
            ),
          );
        }
      },
    );

    child.on("error", (err) => {
      reject(err);
    });
  });
}
