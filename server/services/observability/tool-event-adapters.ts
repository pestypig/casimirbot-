import { appendToolLog, type ToolLogPolicyFlags } from "./tool-log-store";
import { stableJsonStringify } from "../../utils/stable-json";
import { sha256Hex } from "../../utils/information-boundary";

export type ToolEventCommon = {
  runId: string;
  tool?: string;
  traceId?: string;
  sessionId?: string;
  stepId?: string;
  version?: string;
  tenantId?: string;
  params?: unknown;
  paramsHash?: string;
  promptHash?: string;
  seed?: unknown;
  policy?: ToolLogPolicyFlags;
  essenceId?: string;
  text?: string;
  debateId?: string;
  strategy?: string;
  ts?: string | number | Date;
  durationMs?: number;
};

export type ToolStartEvent = ToolEventCommon & { kind: "start" };
export type ToolSuccessEvent = ToolEventCommon & {
  kind: "success";
  output?: unknown;
};
export type ToolErrorEvent = ToolEventCommon & {
  kind: "error";
  error?: unknown;
};

export type ToolEvent = ToolStartEvent | ToolSuccessEvent | ToolErrorEvent;

export type ToolEventAdapterOptions = {
  traceId?: string;
  sessionId?: string;
  version?: string;
  tenantId?: string;
  policy?: ToolLogPolicyFlags;
  clock?: () => number;
  hashPayload?: (value: unknown) => string;
};

type InFlight = {
  tool: string;
  startMs: number;
  paramsHash: string;
  promptHash?: string;
  traceId?: string;
  sessionId?: string;
  stepId?: string;
  version?: string;
  tenantId?: string;
  seed?: unknown;
  policy?: ToolLogPolicyFlags;
  essenceId?: string;
  text?: string;
  debateId?: string;
  strategy?: string;
};

type ToolCallOptions = Omit<
  ToolEventCommon,
  "runId" | "durationMs" | "ts"
> & { paramsHash?: string };

export type LangGraphToolEvent = {
  event?: string;
  name?: string;
  tool?: string;
  run_id?: string;
  runId?: string;
  parent_run_id?: string;
  parentRunId?: string;
  id?: string;
  trace_id?: string;
  traceId?: string;
  session_id?: string;
  sessionId?: string;
  step_id?: string;
  stepId?: string;
  time?: string | number;
  ts?: string | number;
  created_at?: string;
  data?: {
    input?: unknown;
    inputs?: unknown;
    output?: unknown;
    outputs?: unknown;
    error?: unknown;
  };
  input?: unknown;
  inputs?: unknown;
  output?: unknown;
  outputs?: unknown;
  error?: unknown;
  params?: unknown;
  params_hash?: string;
  seed?: unknown;
  version?: string;
  policy?: ToolLogPolicyFlags;
  metadata?: Record<string, unknown>;
  tags?: string[];
};

const DEFAULT_TOOL = "tool";
const START_EVENTS = new Set([
  "tool_start",
  "on_tool_start",
  "start",
  "tool_begin",
  "on_tool_begin",
]);
const END_EVENTS = new Set([
  "tool_end",
  "on_tool_end",
  "tool_result",
  "on_tool_result",
  "end",
  "finish",
]);
const ERROR_EVENTS = new Set([
  "tool_error",
  "on_tool_error",
  "error",
  "fail",
  "failure",
]);

const parseTimestamp = (value?: string | number | Date): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const normalizeTool = (value?: string): string => {
  if (typeof value !== "string") return DEFAULT_TOOL;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_TOOL;
};

const normalizeError = (error?: unknown): string | undefined => {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const mergePolicy = (
  base?: ToolLogPolicyFlags,
  override?: ToolLogPolicyFlags,
): ToolLogPolicyFlags | undefined => {
  if (!base && !override) return undefined;
  return { ...(base ?? {}), ...(override ?? {}) };
};

const defaultHashPayload = (value: unknown): string =>
  sha256Hex(stableJsonStringify(value));

const resolveParamsHash = (
  hashPayload: (value: unknown) => string,
  paramsHash?: string,
  params?: unknown,
): string => {
  if (paramsHash && paramsHash.trim()) return paramsHash.trim();
  if (params !== undefined) {
    try {
      return hashPayload(params);
    } catch {
      return "unknown";
    }
  }
  return "unknown";
};

const normalizeEventKind = (value?: string): ToolEvent["kind"] | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (START_EVENTS.has(normalized)) return "start";
  if (END_EVENTS.has(normalized)) return "success";
  if (ERROR_EVENTS.has(normalized)) return "error";
  return undefined;
};

const readMetaString = (
  metadata: Record<string, unknown> | undefined,
  keys: string[],
): string | undefined => {
  if (!metadata) return undefined;
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

const readMetaUnknown = (
  metadata: Record<string, unknown> | undefined,
  keys: string[],
): unknown => {
  if (!metadata) return undefined;
  for (const key of keys) {
    if (metadata[key] !== undefined) {
      return metadata[key];
    }
  }
  return undefined;
};

export const mapLangGraphToolEvent = (
  event: LangGraphToolEvent,
): ToolEvent | null => {
  const kind = normalizeEventKind(event.event ?? event.tool);
  if (!kind) return null;
  const runId =
    event.run_id ??
    event.runId ??
    event.id ??
    readMetaString(event.metadata, ["run_id", "runId", "id"]);
  if (!runId) return null;

  const tool = normalizeTool(
    event.name ??
      event.tool ??
      readMetaString(event.metadata, ["tool", "name", "tool_name"]),
  );
  const traceId =
    event.trace_id ??
    event.traceId ??
    readMetaString(event.metadata, ["trace_id", "traceId"]);
  const sessionId =
    event.session_id ??
    event.sessionId ??
    readMetaString(event.metadata, ["session_id", "sessionId"]);
  const stepId =
    event.step_id ??
    event.stepId ??
    event.parent_run_id ??
    event.parentRunId ??
    readMetaString(event.metadata, ["step_id", "stepId", "parent_run_id"]);
  const params =
    event.data?.input ??
    event.data?.inputs ??
    event.input ??
    event.inputs ??
    event.params ??
    readMetaUnknown(event.metadata, ["input", "inputs", "params"]);
  const paramsHash =
    event.params_hash ??
    readMetaString(event.metadata, ["params_hash", "paramsHash"]);
  const policy =
    event.policy ??
    (readMetaUnknown(event.metadata, ["policy"]) as ToolLogPolicyFlags | undefined);
  const version =
    event.version ??
    readMetaString(event.metadata, ["version", "tool_version"]);
  const seed =
    event.seed ??
    readMetaUnknown(event.metadata, ["seed"]);
  const ts =
    event.ts ??
    event.time ??
    event.created_at ??
    readMetaString(event.metadata, ["ts", "time", "created_at"]);
  const error = event.data?.error ?? event.error;

  if (kind === "start") {
    return {
      kind,
      runId,
      tool,
      traceId,
      sessionId,
      stepId,
      params,
      paramsHash,
      policy,
      version,
      seed,
      ts,
    };
  }

  if (kind === "success") {
    return {
      kind,
      runId,
      tool,
      traceId,
      sessionId,
      stepId,
      params,
      paramsHash,
      policy,
      version,
      seed,
      ts,
      output: event.data?.output ?? event.data?.outputs ?? event.output ?? event.outputs,
    };
  }

  return {
    kind: "error",
    runId,
    tool,
    traceId,
    sessionId,
    stepId,
    params,
    paramsHash,
    policy,
    version,
    seed,
    ts,
    error,
  };
};

export const createToolEventAdapter = (
  options: ToolEventAdapterOptions = {},
): {
  start: (event: Omit<ToolStartEvent, "kind"> & { kind?: "start" }) => void;
  success: (event: Omit<ToolSuccessEvent, "kind"> & { kind?: "success" }) => void;
  error: (event: Omit<ToolErrorEvent, "kind"> & { kind?: "error" }) => void;
  handle: (event: ToolEvent) => void;
} => {
  const inFlight = new Map<string, InFlight>();
  const clock = options.clock ?? (() => Date.now());
  const hashPayload = options.hashPayload ?? defaultHashPayload;

  const start = (event: Omit<ToolStartEvent, "kind">): void => {
    const tool = normalizeTool(event.tool);
    const startMs = parseTimestamp(event.ts) ?? clock();
    const paramsHash = resolveParamsHash(hashPayload, event.paramsHash, event.params);
    inFlight.set(event.runId, {
      tool,
      startMs,
      paramsHash,
      promptHash: event.promptHash,
      traceId: event.traceId ?? options.traceId,
      sessionId: event.sessionId ?? options.sessionId,
      stepId: event.stepId,
      version: event.version ?? options.version,
      tenantId: event.tenantId ?? options.tenantId,
      seed: event.seed,
      policy: mergePolicy(options.policy, event.policy),
      essenceId: event.essenceId,
      text: event.text,
      debateId: event.debateId,
      strategy: event.strategy,
    });
  };

  const finish = (
    event: Omit<ToolSuccessEvent, "kind"> | Omit<ToolErrorEvent, "kind">,
    ok: boolean,
  ): void => {
    const cached = inFlight.get(event.runId);
    if (cached) {
      inFlight.delete(event.runId);
    }
    const endMs = parseTimestamp(event.ts) ?? clock();
    const durationMs =
      event.durationMs ??
      (cached ? Math.max(0, endMs - cached.startMs) : 0);
    const paramsHash = resolveParamsHash(
      hashPayload,
      event.paramsHash ?? cached?.paramsHash,
      event.params ?? undefined,
    );
    const tool = normalizeTool(event.tool ?? cached?.tool);
    appendToolLog({
      tool,
      version: event.version ?? cached?.version ?? options.version ?? "unknown",
      paramsHash,
      promptHash: event.promptHash ?? cached?.promptHash,
      durationMs,
      tenantId: event.tenantId ?? cached?.tenantId ?? options.tenantId,
      sessionId: event.sessionId ?? cached?.sessionId ?? options.sessionId,     
      traceId: event.traceId ?? cached?.traceId ?? options.traceId,
      stepId: event.stepId ?? cached?.stepId,
      seed: event.seed ?? cached?.seed,
      ok,
      error: ok ? undefined : normalizeError((event as ToolErrorEvent).error),
      policy: mergePolicy(cached?.policy, event.policy),
      essenceId: event.essenceId ?? cached?.essenceId,
      text: event.text ?? cached?.text,
      debateId: event.debateId ?? cached?.debateId,
      strategy: event.strategy ?? cached?.strategy,
    });
  };

  const success = (event: Omit<ToolSuccessEvent, "kind">): void => {
    finish(event, true);
  };

  const error = (event: Omit<ToolErrorEvent, "kind">): void => {
    finish(event, false);
  };

  const handle = (event: ToolEvent): void => {
    if (event.kind === "start") start(event);
    if (event.kind === "success") success(event);
    if (event.kind === "error") error(event);
  };

  return { start, success, error, handle };
};

export const createLangGraphToolEventAdapter = (
  options: ToolEventAdapterOptions = {},
): {
  handleEvent: (event: LangGraphToolEvent) => ToolEvent | null;
  adapter: ReturnType<typeof createToolEventAdapter>;
} => {
  const adapter = createToolEventAdapter(options);
  const handleEvent = (event: LangGraphToolEvent): ToolEvent | null => {
    const mapped = mapLangGraphToolEvent(event);
    if (mapped) adapter.handle(mapped);
    return mapped;
  };
  return { handleEvent, adapter };
};

export async function withToolLog<T>(
  tool: string,
  params: unknown,
  run: () => Promise<T>,
  options: ToolCallOptions = {},
): Promise<T> {
  const started = Date.now();
  const paramsHash = resolveParamsHash(
    defaultHashPayload,
    options.paramsHash,
    params,
  );
  try {
    const result = await run();
    appendToolLog({
      tool: normalizeTool(tool),
      version: options.version ?? "unknown",
      paramsHash,
      promptHash: options.promptHash,
      durationMs: Date.now() - started,
      tenantId: options.tenantId,
      sessionId: options.sessionId,
      traceId: options.traceId,
      stepId: options.stepId,
      seed: options.seed,
      ok: true,
      policy: options.policy,
      essenceId: options.essenceId,
      text: options.text,
      debateId: options.debateId,
      strategy: options.strategy,
    });
    return result;
  } catch (err) {
    appendToolLog({
      tool: normalizeTool(tool),
      version: options.version ?? "unknown",
      paramsHash,
      promptHash: options.promptHash,
      durationMs: Date.now() - started,
      tenantId: options.tenantId,
      sessionId: options.sessionId,
      traceId: options.traceId,
      stepId: options.stepId,
      seed: options.seed,
      ok: false,
      error: normalizeError(err),
      policy: options.policy,
      essenceId: options.essenceId,
      text: options.text,
      debateId: options.debateId,
      strategy: options.strategy,
    });
    throw err;
  }
}

export const wrapToolHandler = <TInput, TResult>(
  tool: string,
  handler: (input: TInput) => Promise<TResult>,
  options: ToolCallOptions = {},
): ((input: TInput) => Promise<TResult>) => {
  return async (input: TInput): Promise<TResult> =>
    withToolLog(tool, input, () => handler(input), options);
};
