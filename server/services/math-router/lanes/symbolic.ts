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
  const m = text.match(/\[\[.*\]\]/);
  const matrix = m?.[0] ? parseMatrixLiteral(m[0]) : null;
  if (/\bdet(?:erminant)?\b/i.test(text) && matrix) return { op: "determinant", matrix };
  if (/\binverse\b/i.test(text) && matrix) return { op: "inverse", matrix };
  if (/\btrace\b/i.test(text) && matrix) return { op: "trace", matrix };
  if (/\beigen(?:value|vector)?s?\b/i.test(text) && matrix) return { op: "eigenvalues", matrix };
  const d = text.match(/derivative of\s+(.+)$/i);
  if (d?.[1]) return { op: "derivative", expr: d[1].trim(), variable: "x" };
  return null;
}

function runPython(payload: string): Promise<SymbolicLaneResult> {
  const pythonBin = process.env.PYTHON_BIN || "python3";
  return new Promise((resolve) => {
    const child = spawn(pythonBin, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    child.stdout.on("data", (c) => (stdout += c.toString()));
    child.on("close", () => {
      if (!stdout.trim()) return resolve({ ok: false, reason: "empty_output" });
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
