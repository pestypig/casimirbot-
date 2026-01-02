#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

type AdapterAction = {
  id?: string;
  kind?: string;
  label?: string;
  params?: Record<string, unknown>;
  note?: string;
};

type AdapterBudget = {
  maxIterations?: number;
  maxTotalMs?: number;
  maxAttemptMs?: number;
};

type AdapterPolicy = {
  thresholds?: Record<string, number>;
  gate?: {
    mode?: "hard-only" | "all" | string;
    unknownAsFail?: boolean;
    minLadderTier?: "diagnostic" | "reduced-order" | "certified";
  };
};

type AdapterConstraintPack = {
  id: string;
  customerId?: string;
  policyProfileId?: string;
  policyOverride?: Record<string, unknown>;
  telemetry?: Record<string, unknown>;
  metrics?: Record<string, number | boolean | string | null>;
  certificate?: {
    status?: string;
    certificateHash?: string | null;
    certificateId?: string | null;
    integrityOk?: boolean;
  };
  deltas?: TrainingTraceDelta[];
  notes?: string[];
  proxy?: boolean;
  ladderTier?: "diagnostic" | "reduced-order" | "certified";
  autoTelemetry?: boolean;
  telemetryPath?: string;
  junitPath?: string;
};

type AdapterRunRequest = {
  traceId?: string;
  mode?: "gr" | "constraint-pack";
  pack?: AdapterConstraintPack;
  actions?: AdapterAction[];
  budget?: AdapterBudget;
  policy?: AdapterPolicy;
};

type TrainingTraceConstraint = {
  id: string;
  severity?: string;
  status?: string;
  value?: number | null;
  limit?: string | null;
  note?: string;
};

type TrainingTraceDelta = {
  key: string;
  from?: number | null;
  to?: number | null;
  delta?: number;
  unit?: string;
  change?: "added" | "removed" | "changed";
};

type AdapterArtifactRef = {
  kind: string;
  ref: string;
  label?: string;
};

type AdapterRunResponse = {
  traceId?: string;
  runId?: string;
  verdict?: "PASS" | "FAIL" | string;
  pass?: boolean;
  firstFail?: TrainingTraceConstraint | null;
  deltas?: TrainingTraceDelta[];
  artifacts?: AdapterArtifactRef[];
};

type ParsedArgs = {
  jsonPath?: string;
  rawJson?: string;
  url?: string;
  exportUrl?: string;
  traceOut?: string;
  traceLimit?: number;
  token?: string;
  tenant?: string;
  traceparent?: string;
  tracestate?: string;
  quiet?: boolean;
  help?: boolean;
};

const DEFAULT_TRACE_OUT = "training-trace.jsonl";
const DEFAULT_TRACE_LIMIT = 50;

const USAGE =
  "Usage: casimir verify --json request.json [--params '{...}'] " +
  "[--url https://host/api/agi/adapter/run] [--export-url https://host/api/agi/training-trace/export] " +
  `[--trace-out ${DEFAULT_TRACE_OUT}|-] [--trace-limit ${DEFAULT_TRACE_LIMIT}] ` +
  "[--token <jwt>] [--tenant <id>] [--quiet]";

const isHttpUrl = (value?: string): boolean =>
  typeof value === "string" && /^https?:\/\//i.test(value);

const normalizeEndpoint = (input: string, endpointPath: string): string => {
  if (!isHttpUrl(input)) {
    throw new Error(`Endpoint must be an absolute URL: ${input}`);
  }
  if (input.includes("/api/")) {
    return input;
  }
  return `${input.replace(/\/+$/, "")}${endpointPath}`;
};

const resolveBaseUrl = (): string => {
  const base =
    process.env.CASIMIR_PUBLIC_BASE_URL ??
    process.env.API_BASE ??
    process.env.HELIX_API_BASE ??
    process.env.API_PROXY_TARGET ??
    process.env.VITE_API_BASE;
  if (isHttpUrl(base)) return base as string;
  return "https://casimirbot.com";
};

const resolveAdapterEndpoint = (explicit?: string): string => {
  if (explicit) {
    return normalizeEndpoint(explicit, "/api/agi/adapter/run");
  }
  const direct = process.env.CASIMIR_VERIFY_URL ?? process.env.AGI_ADAPTER_URL;
  if (direct) {
    return normalizeEndpoint(direct, "/api/agi/adapter/run");
  }
  return normalizeEndpoint(resolveBaseUrl(), "/api/agi/adapter/run");
};

const resolveExportEndpoint = (
  explicit: string | undefined,
  adapterUrl: string,
): string => {
  if (explicit) {
    return normalizeEndpoint(explicit, "/api/agi/training-trace/export");
  }
  const direct = process.env.CASIMIR_TRACE_EXPORT_URL;
  if (direct) {
    return normalizeEndpoint(direct, "/api/agi/training-trace/export");
  }
  try {
    const parsed = new URL(adapterUrl);
    parsed.pathname = "/api/agi/training-trace/export";
    parsed.search = "";
    return parsed.toString();
  } catch {
    return normalizeEndpoint(resolveBaseUrl(), "/api/agi/training-trace/export");
  }
};

const normalizeToken = (value?: string): string | undefined => {
  if (!value) return undefined;
  return value.startsWith("Bearer ") ? value : `Bearer ${value}`;
};

const buildAuthHeaders = (args: ParsedArgs): Record<string, string> => {
  const headers: Record<string, string> = {};
  const token = normalizeToken(args.token);
  if (token) headers.Authorization = token;
  if (args.tenant) headers["X-Tenant-Id"] = args.tenant;
  if (args.traceparent) headers.traceparent = args.traceparent;
  if (args.tracestate) headers.tracestate = args.tracestate;
  return headers;
};

const parseArgs = (): ParsedArgs => {
  const args = process.argv.slice(2);
  if (args[0] === "verify") {
    args.shift();
  }
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
    } else if (token === "--url") {
      const value = takeValue(token, next);
      if (value !== undefined) {
        parsed.url = value;
        if (!token.includes("=")) i += 1;
      }
    } else if (token === "--export-url") {
      const value = takeValue(token, next);
      if (value !== undefined) {
        parsed.exportUrl = value;
        if (!token.includes("=")) i += 1;
      }
    } else if (token === "--trace-out" || token === "-o") {
      const value = takeValue(token, next);
      if (value !== undefined) {
        parsed.traceOut = value;
        if (!token.includes("=")) i += 1;
      }
    } else if (token === "--trace-limit" || token === "-l") {
      const value = takeValue(token, next);
      if (value !== undefined) {
        parsed.traceLimit = Number(value);
        if (!token.includes("=")) i += 1;
      }
    } else if (token === "--token") {
      const value = takeValue(token, next);
      if (value !== undefined) {
        parsed.token = value;
        if (!token.includes("=")) i += 1;
      }
    } else if (token === "--tenant") {
      const value = takeValue(token, next);
      if (value !== undefined) {
        parsed.tenant = value;
        if (!token.includes("=")) i += 1;
      }
    } else if (token === "--traceparent") {
      const value = takeValue(token, next);
      if (value !== undefined) {
        parsed.traceparent = value;
        if (!token.includes("=")) i += 1;
      }
    } else if (token === "--tracestate") {
      const value = takeValue(token, next);
      if (value !== undefined) {
        parsed.tracestate = value;
        if (!token.includes("=")) i += 1;
      }
    } else if (token === "--quiet" || token === "-q") {
      parsed.quiet = true;
    }
  }

  return parsed;
};

const loadPayload = async (
  jsonPath?: string,
  rawJson?: string,
): Promise<Record<string, unknown>> => {
  const payload: Record<string, unknown> = {};
  if (jsonPath) {
    const src = await fs.readFile(jsonPath, "utf8");
    const parsed = JSON.parse(src);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Request JSON must be an object.");
    }
    Object.assign(payload, parsed as Record<string, unknown>);
  }
  if (rawJson) {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Inline params must be a JSON object.");
    }
    Object.assign(payload, parsed as Record<string, unknown>);
  }
  return payload;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const validateAdapterRequest = (payload: Record<string, unknown>): string[] => {
  const errors: string[] = [];
  if (!isPlainObject(payload)) {
    errors.push("request must be an object");
    return errors;
  }
  if (payload.traceId !== undefined && typeof payload.traceId !== "string") {
    errors.push("traceId must be a string");
  }
  if (payload.actions !== undefined && !Array.isArray(payload.actions)) {
    errors.push("actions must be an array");
  }
  if (payload.budget !== undefined && !isPlainObject(payload.budget)) {
    errors.push("budget must be an object");
  }
  if (payload.policy !== undefined && !isPlainObject(payload.policy)) {
    errors.push("policy must be an object");
  }
  return errors;
};

const isAdapterRunResponse = (value: unknown): value is AdapterRunResponse => {
  if (!isPlainObject(value)) return false;
  if (typeof value.pass === "boolean") return true;
  if (typeof value.verdict === "string") return true;
  return false;
};

const runAdapter = async (
  url: string,
  payload: AdapterRunRequest,
  headers: Record<string, string>,
): Promise<AdapterRunResponse> => {
  const response = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`Adapter request failed: ${response.status} ${text}`);      
  }
  const json = await response.json();
  if (!isAdapterRunResponse(json)) {
    throw new Error("Unexpected adapter response shape.");
  }
  return json;
};

const buildExportUrl = (
  baseUrl: string,
  limit?: number,
  tenant?: string,
): string => {
  const url = new URL(baseUrl);
  if (Number.isFinite(limit) && (limit as number) > 0) {
    url.searchParams.set("limit", String(limit));
  }
  if (tenant) {
    url.searchParams.set("tenantId", tenant);
  }
  return url.toString();
};

const exportTraces = async (
  url: string,
  headers: Record<string, string>,
): Promise<string> => {
  const response = await fetch(url, {
    method: "GET",
    headers: { ...headers, Accept: "application/x-ndjson" },
  });
  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`Trace export failed: ${response.status} ${text}`);
  }
  return response.text();
};

const writeTraceOutput = async (output: string, outPath: string): Promise<void> => {
  const content = output.endsWith("\n") ? output : `${output}\n`;
  if (outPath === "-") {
    process.stdout.write(content);
    return;
  }
  const dir = path.dirname(outPath);
  if (dir && dir !== ".") {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(outPath, content, "utf8");
};

async function main() {
  const args = parseArgs();
  if (args.help) {
    console.error(USAGE);
    process.exit(0);
  }

  if (!args.jsonPath && !args.rawJson) {
    console.error("Adapter request payload is required.");
    console.error(USAGE);
    process.exit(1);
  }

  const payload = await loadPayload(args.jsonPath, args.rawJson);
  const requestErrors = validateAdapterRequest(payload);
  if (requestErrors.length) {
    console.error("Invalid adapter run request:");
    for (const error of requestErrors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  const adapterUrl = resolveAdapterEndpoint(args.url);
  const exportUrl = resolveExportEndpoint(args.exportUrl, adapterUrl);
  const traceOut = args.traceOut ?? DEFAULT_TRACE_OUT;
  const traceLimit = Number.isFinite(args.traceLimit)
    ? (args.traceLimit as number)
    : DEFAULT_TRACE_LIMIT;
  const authHeaders = buildAuthHeaders(args);

  const response = await runAdapter(
    adapterUrl,
    payload as AdapterRunRequest,
    authHeaders,
  );
  const responsePayload = JSON.stringify(response, null, 2);
  if (!args.quiet) {
    const responseStream = traceOut === "-" ? process.stderr : process.stdout;
    responseStream.write(`${responsePayload}\n`);
  }

  let traceExported = false;
  try {
    const exportRequestUrl = buildExportUrl(
      exportUrl,
      traceLimit,
      args.tenant,
    );
    const jsonl = await exportTraces(exportRequestUrl, authHeaders);
    await writeTraceOutput(jsonl, traceOut);
    traceExported = true;
  } catch (error) {
    console.error("[casimir-verify] trace export failed:", error);
  }

  const pass = response.pass === true || response.verdict === "PASS";
  if (!pass) {
    if (!args.quiet) {
      console.error("[casimir-verify] verdict: FAIL");
    }
    process.exit(2);
  }

  if (!args.quiet && traceExported) {
    console.error("[casimir-verify] verdict: PASS");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
