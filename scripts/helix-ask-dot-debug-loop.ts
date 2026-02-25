import * as fs from "node:fs";
import * as path from "node:path";

type JsonObject = Record<string, unknown>;

type LaneDebug = {
  llm_route_expected_backend: unknown;
  llm_invoke_attempted: unknown;
  llm_skip_reason: unknown;
  llm_skip_reason_detail: unknown;
  llm_backend_used: unknown;
  llm_provider_called: unknown;
  llm_http_status: unknown;
  llm_model: unknown;
  llm_routed_via: unknown;
  llm_calls: unknown;
  llm_error_code: unknown;
  llm_error_message: unknown;
};

type LaneResult = {
  request: JsonObject;
  status: number;
  payload: unknown;
  debug: LaneDebug;
  classification: "A_short_circuit" | "B_invoked_or_config_fail" | "C_http_success" | "unknown";
};

const argValue = (flag: string): string | undefined => {
  const index = process.argv.indexOf(flag);
  if (index < 0) return undefined;
  return process.argv[index + 1];
};

const asObject = (value: unknown): JsonObject | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : null;

const readDebug = (payload: unknown): LaneDebug => {
  const root = asObject(payload);
  const debug = asObject(root?.debug) ?? asObject(asObject(root?.result)?.debug) ?? {};
  return {
    llm_route_expected_backend: debug.llm_route_expected_backend ?? null,
    llm_invoke_attempted: debug.llm_invoke_attempted ?? null,
    llm_skip_reason: debug.llm_skip_reason ?? null,
    llm_skip_reason_detail: debug.llm_skip_reason_detail ?? null,
    llm_backend_used: debug.llm_backend_used ?? null,
    llm_provider_called: debug.llm_provider_called ?? null,
    llm_http_status: debug.llm_http_status ?? null,
    llm_model: debug.llm_model ?? null,
    llm_routed_via: debug.llm_routed_via ?? null,
    llm_calls: debug.llm_calls ?? null,
    llm_error_code: debug.llm_error_code ?? null,
    llm_error_message: debug.llm_error_message ?? null,
  };
};

const classifyLane = (debug: LaneDebug): LaneResult["classification"] => {
  const invoke = debug.llm_invoke_attempted === true;
  const shortCircuit = debug.llm_invoke_attempted === false && typeof debug.llm_skip_reason === "string";
  const callsNonEmpty = Array.isArray(debug.llm_calls) && debug.llm_calls.length > 0;
  const httpSuccess =
    invoke &&
    debug.llm_backend_used === "http" &&
    debug.llm_provider_called === true &&
    debug.llm_http_status === 200 &&
    callsNonEmpty &&
    !debug.llm_error_code;
  if (shortCircuit) return "A_short_circuit";
  if (httpSuccess) return "C_http_success";
  if (invoke) return "B_invoked_or_config_fail";
  return "unknown";
};

const fetchJson = async (
  url: string,
  init?: RequestInit,
): Promise<{ status: number; payload: unknown; text: string }> => {
  const res = await fetch(url, init);
  const text = await res.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }
  return { status: res.status, payload, text };
};

const main = async (): Promise<void> => {
  const baseUrl = (argValue("--base-url") ?? process.env.HELIX_ASK_BASE_URL ?? "http://127.0.0.1:5050").replace(
    /\/$/,
    "",
  );
  const outPath =
    argValue("--out") ??
    process.env.HELIX_ASK_DEBUG_LOOP_OUT ??
    path.join("artifacts", "helix-ask-dot-lane-summary.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const envPreflight = {
    marker: process.env.ENV_MARKER ?? null,
    base: process.env.LLM_HTTP_BASE ?? null,
    baseHttps: (process.env.LLM_HTTP_BASE ?? "").startsWith("https://"),
    hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
    hasHttp: Boolean(process.env.LLM_HTTP_API_KEY),
    keySource: process.env.OPENAI_API_KEY ? "OPENAI_API_KEY" : process.env.LLM_HTTP_API_KEY ? "LLM_HTTP_API_KEY" : "none",
    policy: process.env.LLM_POLICY ?? null,
    runtime: process.env.LLM_RUNTIME ?? null,
    hullMode: process.env.HULL_MODE ?? null,
    allowHostsRaw: process.env.HULL_ALLOW_HOSTS ?? null,
  };

  const hull = await fetchJson(`${baseUrl}/api/hull/status`);

  const laneARequest = {
    question: "What is 2 + 2?",
    debug: true,
    sessionId: "dot-loop-lane-a",
  };
  const laneAResponse = await fetchJson(`${baseUrl}/api/agi/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(laneARequest),
  });
  const laneADebug = readDebug(laneAResponse.payload);
  const laneA: LaneResult = {
    request: laneARequest,
    status: laneAResponse.status,
    payload: laneAResponse.payload,
    debug: laneADebug,
    classification: classifyLane(laneADebug),
  };

  const laneBRequest = {
    question: "How does Feedback Loop Hygiene affect society?",
    debug: true,
    verbosity: "brief",
    sessionId: "dot-loop-lane-b",
  };
  const laneBResponse = await fetchJson(`${baseUrl}/api/agi/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(laneBRequest),
  });
  const laneBDebug = readDebug(laneBResponse.payload);
  const laneB: LaneResult = {
    request: laneBRequest,
    status: laneBResponse.status,
    payload: laneBResponse.payload,
    debug: laneBDebug,
    classification: classifyLane(laneBDebug),
  };

  const laneCRequest = {
    question: "How does Feedback Loop Hygiene affect society?",
    debug: true,
    sessionId: "dot-loop-lane-c",
  };
  const laneCCreate = await fetchJson(`${baseUrl}/api/agi/ask/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(laneCRequest),
  });
  const created = asObject(laneCCreate.payload);
  const jobId = typeof created?.jobId === "string" ? created.jobId : null;
  let laneCFinalStatus = laneCCreate.status;
  let laneCFinalPayload: unknown = laneCCreate.payload;
  if (jobId) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const polled = await fetchJson(`${baseUrl}/api/agi/ask/jobs/${jobId}`);
      laneCFinalStatus = polled.status;
      laneCFinalPayload = polled.payload;
      const status = asObject(polled.payload)?.status;
      if (status === "completed" || status === "failed") break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  const laneCDebug = readDebug(laneCFinalPayload);
  const laneC: LaneResult = {
    request: laneCRequest,
    status: laneCFinalStatus,
    payload: laneCFinalPayload,
    debug: laneCDebug,
    classification: classifyLane(laneCDebug),
  };

  const overallGo =
    laneA.classification === "A_short_circuit" &&
    laneB.classification === "C_http_success" &&
    laneC.classification === "C_http_success";

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    envPreflight,
    hullStatusHttp: hull.status,
    hullStatus: hull.payload,
    lanes: {
      A: laneA,
      B: laneB,
      C: laneC,
    },
    goNoGo: overallGo ? "GO" : "NO-GO",
    goNoGoTarget: "OpenAI-backed Helix Ask lane proven (A short-circuit + B/C HTTP success)",
  };

  fs.writeFileSync(outPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`helix-ask-dot-debug-loop failed: ${message}\n`);
  process.exitCode = 1;
});
