import express from "express";
import { spawn } from "node:child_process";
import { relative, resolve } from "node:path";
import { z } from "zod";

const devTerminalRouter = express.Router();

const DevTerminalInput = z.object({
  command: z.string().min(1),
  cwd: z.string().optional(),
  timeoutMs: z.number().int().min(1000).max(120000).optional(),
  maxOutputBytes: z.number().int().min(1024).max(1_000_000).optional(),
});

const DEV_TERMINAL_ENABLED = process.env.ENABLE_DEV_TERMINAL === "1";
const DEV_TERMINAL_ALLOW_REMOTE = process.env.DEV_TERMINAL_ALLOW_REMOTE === "1";
const DEV_TERMINAL_ALLOW_PROD = process.env.DEV_TERMINAL_ALLOW_PROD === "1";
const DEV_TERMINAL_ROOT = process.env.DEV_TERMINAL_ROOT?.trim() || process.cwd();
const DEFAULT_TIMEOUT_MS = toPositiveInt(process.env.DEV_TERMINAL_TIMEOUT_MS, 15000);
const DEFAULT_MAX_OUTPUT_BYTES = toPositiveInt(process.env.DEV_TERMINAL_MAX_OUTPUT_BYTES, 64_000);

devTerminalRouter.post("/run", async (req, res) => {
  if (!DEV_TERMINAL_ENABLED) {
    return res.status(403).json({ error: "dev_terminal_disabled" });
  }
  if (!DEV_TERMINAL_ALLOW_PROD && process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "dev_terminal_prod_disabled" });
  }
  const remote = req.socket.remoteAddress;
  if (!DEV_TERMINAL_ALLOW_REMOTE && !isLoopback(remote)) {
    return res.status(403).json({ error: "dev_terminal_forbidden" });
  }

  const parsed = DevTerminalInput.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
  }

  const root = resolve(DEV_TERMINAL_ROOT);
  const runCwd = resolve(root, parsed.data.cwd ?? ".");
  if (!isWithinRoot(root, runCwd)) {
    return res.status(400).json({ error: "invalid_cwd" });
  }

  const timeoutMs = parsed.data.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxOutputBytes = parsed.data.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  const command = parsed.data.command;
  const { shell, args } = resolveShell(command);
  const started = Date.now();

  let stdout = "";
  let stderr = "";
  let truncated = false;
  let remainingBytes = maxOutputBytes;
  let timedOut = false;
  let responded = false;

  const appendOutput = (chunk: Buffer, target: "stdout" | "stderr") => {
    if (remainingBytes <= 0) {
      truncated = true;
      return;
    }
    const slice = chunk.length > remainingBytes ? chunk.subarray(0, remainingBytes) : chunk;
    if (target === "stdout") {
      stdout += slice.toString("utf8");
    } else {
      stderr += slice.toString("utf8");
    }
    remainingBytes -= slice.length;
    if (slice.length < chunk.length) {
      truncated = true;
    }
  };

  const child = spawn(shell, args, { cwd: runCwd, env: process.env });
  const timeout = setTimeout(() => {
    timedOut = true;
    truncated = true;
    try {
      child.kill();
    } catch {
      // ignore kill failures
    }
  }, timeoutMs);

  child.stdout.on("data", (chunk: Buffer) => {
    appendOutput(chunk, "stdout");
    if (remainingBytes <= 0) {
      try {
        child.kill();
      } catch {
        // ignore kill failures
      }
    }
  });

  child.stderr.on("data", (chunk: Buffer) => {
    appendOutput(chunk, "stderr");
    if (remainingBytes <= 0) {
      try {
        child.kill();
      } catch {
        // ignore kill failures
      }
    }
  });

  const respondOnce = (payload: Record<string, unknown>, status = 200) => {
    if (responded) return;
    responded = true;
    clearTimeout(timeout);
    res.status(status).json(payload);
  };

  child.on("error", (error) => {
    respondOnce(
      {
        error: "dev_terminal_spawn_failed",
        message: error instanceof Error ? error.message : "spawn_failed",
      },
      500,
    );
  });

  child.on("close", (code, signal) => {
    const durationMs = Date.now() - started;
    respondOnce({
      ok: code === 0 && !timedOut,
      code,
      signal,
      stdout,
      stderr,
      truncated,
      timedOut,
      durationMs,
      cwd: runCwd,
    });
  });
});

export { devTerminalRouter };

function isLoopback(address?: string | null): boolean {
  if (!address) return false;
  if (address === "127.0.0.1" || address === "::1") return true;
  return address.startsWith("::ffff:127.0.0.1");
}

function isWithinRoot(root: string, target: string): boolean {
  const rel = relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !rel.startsWith("../") && !rel.startsWith("..\\"));
}

function resolveShell(command: string): { shell: string; args: string[] } {
  const override = process.env.DEV_TERMINAL_SHELL?.trim();
  if (override) {
    return process.platform === "win32"
      ? { shell: override, args: ["-NoProfile", "-Command", command] }
      : { shell: override, args: ["-lc", command] };
  }
  if (process.platform === "win32") {
    return { shell: "powershell.exe", args: ["-NoProfile", "-Command", command] };
  }
  return { shell: "bash", args: ["-lc", command] };
}

function toPositiveInt(value: string | number | undefined, fallback: number): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    return fallback;
  }
  return Math.round(num);
}
