import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { MathRouterConstantPolicy } from "@shared/math-router";

const scriptPath = fileURLToPath(new URL("../../../../scripts/py/math_router_symbolic.py", import.meta.url));

export type SymbolicLaneInput = {
  prompt: string;
  constants: MathRouterConstantPolicy;
};

export type SymbolicLaneResult = {
  ok: boolean;
  op?: "determinant" | "inverse" | "trace" | "eigenvalues" | "derivative";
  result?: string;
  reason?: string;
};

export async function runSymbolicLane(input: SymbolicLaneInput): Promise<SymbolicLaneResult> {
  const parsed = parsePrompt(input.prompt);
  if (!parsed) return { ok: false, reason: "unsupported_prompt" };
  const payload = JSON.stringify({ ...parsed, constants: input.constants });
  return await runPython(payload);
}

function parsePrompt(prompt: string): { op: SymbolicLaneResult["op"]; matrix?: unknown; expr?: string; variable?: string } | null {
  const text = (prompt ?? "").trim();
  const matrix = parseMatrixFromPrompt(text);
  if (/\bdet(?:erminant)?\b/i.test(text) && matrix) return { op: "determinant", matrix };
  if (/\binverse\b/i.test(text) && matrix) return { op: "inverse", matrix };
  if (/\btrace\b/i.test(text) && matrix) return { op: "trace", matrix };
  if (/\beigen(?:value|vector)?s?\b/i.test(text) && matrix) return { op: "eigenvalues", matrix };
  const d = text.match(/derivative of\s+(.+)$/i);
  if (d?.[1]) return { op: "derivative", expr: d[1].trim(), variable: "x" };
  return null;
}

async function runPython(payload: string): Promise<SymbolicLaneResult> {
  const requested = process.env.PYTHON_BIN?.trim();
  const bins = Array.from(new Set([requested, "python", "python3"].filter((v): v is string => Boolean(v))));
  let last: SymbolicLaneResult = { ok: false, reason: "python_bin_unavailable" };

  for (const bin of bins) {
    const current = await runPythonWithBin(bin, payload);
    if (current.ok) return current;
    last = current;
    if (!isRetryablePythonFailure(current.reason)) {
      return current;
    }
  }

  return last;
}

function runPythonWithBin(pythonBin: string, payload: string): Promise<SymbolicLaneResult> {
  return new Promise((resolve) => {
    const child = spawn(pythonBin, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (c) => (stdout += c.toString()));
    child.stderr.on("data", (c) => (stderr += c.toString()));
    child.on("close", () => {
      if (!stdout.trim()) {
        const detail = stderr.trim().slice(0, 120);
        return resolve({ ok: false, reason: detail ? `empty_output:${detail}` : "empty_output" });
      }
      try {
        const parsed = JSON.parse(stdout) as SymbolicLaneResult;
        resolve(parsed);
      } catch {
        resolve({ ok: false, reason: "parse_error" });
      }
    });
    child.on("error", (e) => resolve({ ok: false, reason: `spawn_error:${e.message}` }));
    child.stdin.write(payload);
    child.stdin.end();
  });
}


function parseMatrixFromPrompt(text: string): (number | string)[][] | null {
  const literal = text.match(/\[\[.*\]\]/)?.[0];
  if (literal) {
    const parsed = parseMatrixLiteral(literal);
    if (parsed) return parsed;
  }

  const matrixCall = text.match(/matrix\s*\((.+)\)/i)?.[1];
  if (!matrixCall) return null;
  return parseMatrixCallRows(matrixCall);
}

function parseMatrixLiteral(raw: string): (number | string)[][] | null {
  const t = raw.trim();
  if (!t.startsWith("[[") || !t.endsWith("]]")) return null;
  const body = t.slice(2, -2);
  const rows = body.split(/\],\s*\[/);
  return rows.map((row) => row.split(",").map((cell) => {
    const c = cell.trim();
    const n = Number(c);
    return Number.isFinite(n) ? n : c;
  }));
}

function parseMatrixCallRows(raw: string): (number | string)[][] | null {
  const rows = Array.from(raw.matchAll(/\[([^\[\]]+)\]/g)).map((m) => m[1]);
  if (!rows.length) return null;
  return rows.map((row) =>
    row.split(",").map((cell) => {
      const c = cell.trim();
      const n = Number(c);
      return Number.isFinite(n) ? n : c;
    }),
  );
}

function isRetryablePythonFailure(reason?: string): boolean {
  if (!reason) return false;
  return reason.startsWith("spawn_error:") || reason.startsWith("empty_output");
}
