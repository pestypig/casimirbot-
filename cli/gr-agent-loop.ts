#!/usr/bin/env -S tsx
import fs from "node:fs/promises";
import { runGrAgentLoop } from "../server/gr/gr-agent-loop.js";
import {
  grAgentLoopOptionsSchema,
  type GrAgentLoopOptionsInput,
} from "../server/gr/gr-agent-loop-schema.js";

type ParsedArgs = {
  jsonPath?: string;
  rawJson?: string;
  maxIterations?: number;
  commitAccepted?: boolean;
  useLiveSnapshot?: boolean;
  url?: string;
  requireAccept?: boolean;
  help?: boolean;
};

const USAGE =
  'Usage: tsx cli/gr-agent-loop.ts [--json path] [--params "{...}"] ' +
  "[--max-iterations N] [--commit] [--use-live-snapshot] [--ci|--require-accept] " +
  "[--url http://localhost:5173/api/helix/gr-agent-loop]";

const resolveEndpoint = (explicit?: string): string | undefined => {
  if (explicit) return explicit;
  if (process.env.GR_AGENT_LOOP_URL) return process.env.GR_AGENT_LOOP_URL;
  const base =
    process.env.API_BASE ??
    process.env.HELIX_API_BASE ??
    process.env.API_PROXY_TARGET ??
    process.env.VITE_API_BASE;
  if (!base) return undefined;
  if (!/^https?:\/\//i.test(base)) return undefined;
  return `${base.replace(/\/+$/, "")}/api/helix/gr-agent-loop`;
};

const readAccepted = (payload: unknown): boolean | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const result = (payload as { result?: { accepted?: boolean } }).result;
  return typeof result?.accepted === "boolean" ? result.accepted : undefined;
};

const readState = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const result = (payload as { result?: { state?: string } }).result;
  return typeof result?.state === "string" ? result.state : undefined;
};

const parseArgs = (): ParsedArgs => {
  const args = process.argv.slice(2);
  const parsed: ParsedArgs = {};
  const takeValue = (token: string, next?: string): string | undefined => {
    if (token.includes("=")) return token.split("=", 2)[1];
    return next;
  };

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    const next = args[i + 1];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--json" || token === "-j") {
      const value = takeValue(token, next);
      if (value !== undefined) {
        parsed.jsonPath = value;
        if (!token.includes("=")) i += 1;
      }
    } else if (token === "--params" || token === "-p") {
      const value = takeValue(token, next);
      if (value !== undefined) {
        parsed.rawJson = value;
        if (!token.includes("=")) i += 1;
      }
    } else if (token === "--max-iterations" || token === "-n") {
      const value = takeValue(token, next);
      if (value !== undefined) {
        parsed.maxIterations = Number(value);
        if (!token.includes("=")) i += 1;
      }
    } else if (token === "--commit" || token === "--commit-accepted") {
      parsed.commitAccepted = true;
    } else if (token === "--use-live-snapshot") {
      parsed.useLiveSnapshot = true;
    } else if (token === "--ci" || token === "--require-accept") {
      parsed.requireAccept = true;
    } else if (token === "--url") {
      const value = takeValue(token, next);
      if (value !== undefined) {
        parsed.url = value;
        if (!token.includes("=")) i += 1;
      }
    }
  }

  return parsed;
};

const loadOptions = async (
  jsonPath?: string,
  rawJson?: string,
): Promise<Record<string, unknown>> => {
  const options: Record<string, unknown> = {};
  if (jsonPath) {
    const src = await fs.readFile(jsonPath, "utf8");
    const parsed = JSON.parse(src);
    if (parsed && typeof parsed === "object") {
      Object.assign(options, parsed as Record<string, unknown>);
    } else {
      throw new Error("Options JSON must be an object.");
    }
  }
  if (rawJson) {
    const parsed = JSON.parse(rawJson);
    if (parsed && typeof parsed === "object") {
      Object.assign(options, parsed as Record<string, unknown>);
    } else {
      throw new Error("Inline params must be a JSON object.");
    }
  }
  return options;
};

const normalizeOptions = (
  base: Record<string, unknown>,
  overrides: ParsedArgs,
): GrAgentLoopOptionsInput => {
  const options: Record<string, unknown> = { ...base };
  if (overrides.maxIterations !== undefined) {
    options.maxIterations = overrides.maxIterations;
  }
  if (overrides.commitAccepted !== undefined) {
    options.commitAccepted = overrides.commitAccepted;
  }
  if (overrides.useLiveSnapshot !== undefined) {
    options.useLiveSnapshot = overrides.useLiveSnapshot;
  }
  return options as GrAgentLoopOptionsInput;
};

const runViaApi = async (
  url: string,
  options: GrAgentLoopOptionsInput,
): Promise<{ accepted?: boolean; state?: string }> => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`Request failed: ${response.status} ${text}`);
  }
  const payload = await response.json();
  console.log(JSON.stringify(payload, null, 2));
  return { accepted: readAccepted(payload), state: readState(payload) };
};

const runDirect = async (
  options: GrAgentLoopOptionsInput,
): Promise<{ accepted?: boolean; state?: string }> => {
  const start = Date.now();
  const result = await runGrAgentLoop(options);
  const durationMs = Date.now() - start;
  console.log(JSON.stringify({ result, durationMs }, null, 2));
  return { accepted: result.accepted, state: result.state };
};

async function main() {
  const args = parseArgs();
  if (args.help) {
    console.error(USAGE);
    process.exit(0);
  }
  const baseOptions = await loadOptions(args.jsonPath, args.rawJson);
  const options = normalizeOptions(baseOptions, args);
  const parsed = grAgentLoopOptionsSchema.safeParse(options);
  if (!parsed.success) {
    console.error("Invalid GR agent loop options:");
    console.error(JSON.stringify(parsed.error.flatten(), null, 2));
    process.exit(1);
  }

  const url = resolveEndpoint(args.url);
  const outcome = url
    ? await runViaApi(url, parsed.data)
    : await runDirect(parsed.data);
  if (args.requireAccept && outcome.state === "budget-exhausted") {
    console.error("GR agent loop stopped due to budget exhaustion.");
    process.exit(3);
  }
  if (args.requireAccept && outcome.accepted !== true) {
    console.error("GR agent loop did not accept a configuration.");
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
