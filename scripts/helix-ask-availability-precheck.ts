import { setTimeout as delay } from "node:timers/promises";

export type HelixAskAvailabilityPrecheckOptions = {
  baseUrl: string;
  timeoutMs?: number;
  question?: string;
  fetchImpl?: typeof fetch;
};

export type HelixAskAvailabilityPrecheckResult = {
  ok: boolean;
  status: number;
  latencyMs: number;
  error?: string;
  message?: string;
};

const PRECHECK_ROUTE = "/api/agi/ask";

const stringifyError = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  return "unknown_error";
};

const parseJsonSafe = async (response: Response): Promise<Record<string, unknown> | null> => {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }
  try {
    const parsed = (await response.json()) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const runHelixAskAvailabilityPrecheck = async (
  options: HelixAskAvailabilityPrecheckOptions,
): Promise<HelixAskAvailabilityPrecheckResult> => {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(1000, options.timeoutMs ?? 10000) : 10000;
  const question = options.question?.trim().length ? options.question.trim() : "health check";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetchImpl(new URL(PRECHECK_ROUTE, options.baseUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, debug: false, temperature: 0 }),
      signal: controller.signal,
    });
    const latencyMs = Date.now() - started;
    const payload = await parseJsonSafe(response);
    const error = typeof payload?.error === "string" ? payload.error : undefined;
    const message = typeof payload?.message === "string" ? payload.message : undefined;
    return {
      ok: response.status === 200,
      status: response.status,
      latencyMs,
      error,
      message,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - started,
      error: "request_failed",
      message: stringifyError(error),
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const assertHelixAskAvailability = async (
  options: HelixAskAvailabilityPrecheckOptions,
): Promise<HelixAskAvailabilityPrecheckResult> => {
  const result = await runHelixAskAvailabilityPrecheck(options);
  if (result.ok) return result;
  const fragments = [
    `status=${result.status}`,
    result.error ? `error=${result.error}` : null,
    result.message ? `message=${result.message}` : null,
  ].filter(Boolean);
  throw new Error(
    `Helix Ask availability precheck failed (${fragments.join(" ")}). Aborting heavy campaign early.`,
  );
};

const main = async () => {
  const baseUrl = process.env.HELIX_ASK_BASE_URL ?? "http://127.0.0.1:5173";
  const timeoutMs = Number(process.env.HELIX_ASK_PRECHECK_TIMEOUT_MS ?? 10000);
  const result = await assertHelixAskAvailability({ baseUrl, timeoutMs });
  console.log(
    `[helix-ask-precheck] PASS status=${result.status} latency_ms=${result.latencyMs} base=${baseUrl}`,
  );
  await delay(0);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[helix-ask-precheck] FAIL ${message}`);
    process.exit(1);
  });
}
