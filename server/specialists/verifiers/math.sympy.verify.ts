import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { z } from "zod";
import { VerifierSpec, VerifierInput, CheckResult } from "@shared/agi-specialists";

const scriptPath = fileURLToPath(new URL("../../../scripts/py/math_check.py", import.meta.url));

export const mathSympyVerifierSpec = {
  name: "math.sympy.verify",
  desc: "Symbolic equivalence checker using SymPy (env gated).",
  inputSchema: VerifierInput,
  outputSchema: CheckResult,
} satisfies z.infer<typeof VerifierSpec>;

export const mathSympyVerifierHandler = async (rawInput: unknown) => {
  const input = VerifierInput.parse(rawInput);
  if (process.env.ENABLE_PY_CHECKERS !== "1") {
    return CheckResult.parse({
      ok: false,
      reason: "python_checker_disabled",
      citations: input.solver_output.essence_ids,
    });
  }

  const pythonBin = process.env.PYTHON_BIN || "python3";
  const solverData = (input.solver_output.data ?? {}) as Record<string, unknown>;
  const finalValue =
    typeof solverData.final === "string" && solverData.final.trim()
      ? solverData.final.trim()
      : typeof input.solver_output.summary === "string"
      ? input.solver_output.summary.trim()
      : "";
  const groundTruthValue =
    typeof input.problem.context?.ground_truth === "string"
      ? input.problem.context?.ground_truth.trim()
      : "";
  const payload = JSON.stringify({
    final_answer: finalValue,
    ground_truth: groundTruthValue,
  });

  const check = await runPythonChecker(pythonBin, payload);

  return CheckResult.parse({
    ok: !!check.ok,
    reason: check.reason ?? "",
    metrics: {},
    citations: input.solver_output.essence_ids,
  });
};

type PythonResult = { ok: boolean; reason?: string };

function runPythonChecker(pythonBin: string, payload: string): Promise<PythonResult> {
  return new Promise((resolve) => {
    const child = spawn(pythonBin, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      resolve({ ok: false, reason: `spawn_error:${error.message}` });
    });
    child.on("close", (code) => {
      if (!stdout.trim()) {
        const suffix = stderr.trim() ? `:${stderr.trim().slice(0, 160)}` : "";
        resolve({ ok: false, reason: `python_exit_${code ?? "unknown"}${suffix}` });
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve({ ok: Boolean(parsed.ok), reason: typeof parsed.reason === "string" ? parsed.reason : undefined });
      } catch (error) {
        resolve({ ok: false, reason: `parse_error:${(error as Error).message}` });
      }
    });
    child.stdin.write(payload);
    child.stdin.end();
  });
}
