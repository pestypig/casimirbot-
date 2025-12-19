/**
 * Harness for running patterns from external/agentic-architectures and collapsing
 * LangGraph node/judge outputs into Essence envelopes.
 *
 * Usage:
 *   pnpm ts-node tools/agentic/run.ts --arch reflection --device cpu --trace ./trace.jsonl
 *
 * Flags:
 *   --arch            Architecture name (defaults to config/env)
 *   --device          Preferred device (cpu/gpu)
 *   --data-dir        Working directory for agentic repo data/cache
 *   --trace           JSON/JSONL file of LangGraph events to collapse
 *   --persona         Creator id for Essence provenance
 *   --trace-id        Trace id for console/SSE logs
 *   --run-id          Override run id (defaults to random UUID)
 *   --data-cutoff     ISO timestamp for information_boundary
 *   --license         Default license to stamp on envelopes
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { LangGraphNodeArtifact } from "./collapse";
import { collapseLangGraphTrace, loadAgenticTraceFile } from "./collapse";

type AgenticConfig = {
  repoPath: string;
  dataDir: string;
  defaultDevice?: string;
  defaultArch?: string;
  env?: Record<string, string | number | boolean>;
};

const args = process.argv.slice(2);
const getArg = (flag: string): string | undefined => {
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
};

function loadConfig(): AgenticConfig {
  const configPath = path.resolve("configs/agentic-architectures.json");
  const raw = fs.readFileSync(configPath, "utf8");
  return JSON.parse(raw) as AgenticConfig;
}

async function main(): Promise<void> {
  const cfg = loadConfig();

  const arch = getArg("--arch") || process.env.AGI_AGENTIC_ARCH || cfg.defaultArch || "reflection";
  const device = getArg("--device") || process.env.AGI_AGENTIC_DEVICE || cfg.defaultDevice || "cpu";
  const dataDir = path.resolve(
    getArg("--data-dir") || process.env.AGI_AGENTIC_DATA_DIR || cfg.dataDir || "data/essence/tmp/agentic",
  );
  const repoPath = path.resolve(cfg.repoPath);
  const tracePath = getArg("--trace") || process.env.AGI_AGENTIC_TRACE;
  const personaId = getArg("--persona") || process.env.AGI_AGENTIC_PERSONA || "persona:agentic";
  const traceId = getArg("--trace-id") || process.env.AGI_AGENTIC_TRACE_ID;
  const sessionId = process.env.AGI_AGENTIC_SESSION_ID;
  const dataCutoffIso = getArg("--data-cutoff") || process.env.AGI_AGENTIC_DATA_CUTOFF;
  const defaultLicense = getArg("--license") || process.env.AGI_AGENTIC_LICENSE;
  const runId = getArg("--run-id") || process.env.AGI_AGENTIC_RUN_ID || crypto.randomUUID();

  fs.mkdirSync(dataDir, { recursive: true });

  const env = {
    ...cfg.env,
    AGI_AGENTIC_ARCH: arch,
    AGI_AGENTIC_DEVICE: device,
    AGI_AGENTIC_DATA_DIR: dataDir,
  };

  console.log("[agentic-harness] config loaded:", { repoPath, dataDir, arch, device });
  console.log("[agentic-harness] env preview:", env);

  let events: LangGraphNodeArtifact[] = [];
  if (tracePath) {
    const resolved = path.resolve(tracePath);
    events = await loadAgenticTraceFile(resolved);
    console.log(`[agentic-harness] loaded ${events.length} LangGraph events from ${resolved}`);
  } else {
    console.warn("[agentic-harness] no --trace provided; skipping collapse (pass JSON/JSONL trace)");
  }

  if (events.length === 0) {
    console.log("[agentic-harness] nothing to collapse; exiting");
    return;
  }

  const result = await collapseLangGraphTrace({
    architecture: arch,
    runId,
    personaId,
    sessionId,
    traceId,
    dataCutoffIso,
    defaultLicense,
    events,
  });

  console.log("[agentic-harness] collapse complete", {
    arch,
    runId: result.runId,
    stored: result.artifacts.length,
    failed: result.failed,
  });
  for (const entry of result.artifacts) {
    console.log(
      `[essence/${entry.modality}] ${entry.node} (${entry.kind}) -> ${entry.essenceId} uri=${entry.blobUri}`,
    );
  }
}

main().catch((err) => {
  console.error("[agentic-harness] run failed", err);
  process.exit(1);
});
