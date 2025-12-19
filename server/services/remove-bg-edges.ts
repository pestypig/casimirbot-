import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

type RemoveBgMethod = "largest-contour" | "grabcut";

export type RemoveBgEdgesOptions = {
  method?: RemoveBgMethod;
  morph?: number;
  feather?: number;
  blur?: number;
  sigma?: number;
  cannyLow?: number;
  cannyHigh?: number;
  grabcutBorder?: number;
  invert?: boolean;
};

const PY_BIN = process.env.REMOVE_BG_PYTHON_BIN || process.env.SUNPY_PYTHON_BIN || "python";
const SCRIPT_PATH = path.resolve(process.cwd(), "tools", "remove_bg_edges.py");

const toFinite = (value: unknown): number | undefined => {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(n) ? (n as number) : undefined;
};

function buildArgs(inputPath: string, outputDir: string, opts: RemoveBgEdgesOptions): string[] {
  const args = [SCRIPT_PATH, "--input", inputPath, "--output", outputDir];
  if (opts.method === "grabcut") {
    args.push("--method", "grabcut");
  }
  if (toFinite(opts.morph) !== undefined) args.push("--morph", String(opts.morph));
  if (toFinite(opts.feather) !== undefined) args.push("--feather", String(opts.feather));
  if (toFinite(opts.blur) !== undefined) args.push("--blur", String(opts.blur));
  if (toFinite(opts.sigma) !== undefined) args.push("--sigma", String(opts.sigma));
  if (toFinite(opts.cannyLow) !== undefined) args.push("--canny-low", String(opts.cannyLow));
  if (toFinite(opts.cannyHigh) !== undefined) args.push("--canny-high", String(opts.cannyHigh));
  if (toFinite(opts.grabcutBorder) !== undefined) args.push("--grabcut-border", String(opts.grabcutBorder));
  if (opts.invert) args.push("--invert");
  return args;
}

export async function removeBackgroundEdges(
  buffer: Buffer,
  filename: string,
  opts: RemoveBgEdgesOptions = {}
): Promise<Buffer> {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "remove-bg-"));
  const safeName = (filename || "image.png").replace(/[^a-zA-Z0-9._-]/g, "_");
  const inputPath = path.join(tmpRoot, safeName || `${randomUUID()}.png`);
  const outputPath = path.join(tmpRoot, safeName || "output.png");

  await fs.writeFile(inputPath, buffer);

  const args = buildArgs(inputPath, tmpRoot, opts);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(PY_BIN, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`remove_bg_edges.py exit ${code}: ${stderr.trim()}`));
    });
  });

  try {
    const out = await fs.readFile(outputPath);
    return out;
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true }).catch(() => {});
  }
}
