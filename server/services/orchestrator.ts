import {
  helixPlanJsonSchema,
  helixPlanSchema,
  helixSurfaceStateSchema,
  HELIX_PLAN_VERSION,
  type HelixPlan,
  type HelixSurfaceState,
} from "@shared/helix-plan";
import crypto from "node:crypto";

const SURFACE_MODEL = process.env.HELIX_SURFACE_MODEL || "gpt-5-codex";
const API_KEY = process.env.HELIX_SURFACE_API_KEY || process.env.OPENAI_API_KEY || "";
const BASE_URL = process.env.HELIX_SURFACE_BASE_URL || "https://api.openai.com/v1";
const RESPONSES_ENDPOINT = `${BASE_URL.replace(/\/+$/, "")}/responses`;

if (!API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    "[orchestrator] HELIX_SURFACE_API_KEY or OPENAI_API_KEY not configured. /api/orchestrator/interpret will return 503 until a key is provided.",
  );
}

export interface SurfacePlanResponse {
  planId: string;
  plan: HelixPlan;
  raw: unknown;
  tokenEstimate: number;
  model: string;
}

const MAX_REQUESTS_PER_MINUTE = Number(process.env.HELIX_SURFACE_RPM || 12);
const recentCalls: number[] = [];

function recordCallAndCheckLimit(now: number) {
  if (MAX_REQUESTS_PER_MINUTE <= 0) return true;
  while (recentCalls.length && now - recentCalls[0] > 60_000) {
    recentCalls.shift();
  }
  if (recentCalls.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  recentCalls.push(now);
  return true;
}

function estimateTokens(input: string) {
  const cleaned = input.replace(/\s+/g, " ").trim();
  if (!cleaned) return 0;
  return Math.ceil(cleaned.length / 4);
}

export class SurfacePlannerError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function requestSurfacePlan(payload: {
  utterance: string;
  state?: unknown;
  schemaVersion?: string;
}): Promise<SurfacePlanResponse> {
  if (!API_KEY) {
    throw new SurfacePlannerError("Surface planner unavailable: API key missing.", 503);
  }

  const { utterance, schemaVersion = HELIX_PLAN_VERSION } = payload;
  if (!utterance || typeof utterance !== "string" || !utterance.trim()) {
    throw new SurfacePlannerError("utterance required", 400);
  }

  if (schemaVersion !== HELIX_PLAN_VERSION) {
    throw new SurfacePlannerError(
      `Unsupported schema version: ${schemaVersion}. Expected ${HELIX_PLAN_VERSION}.`,
      400,
    );
  }

  let sanitizedState: HelixSurfaceState | undefined;
  if (payload.state !== undefined) {
    try {
      sanitizedState = helixSurfaceStateSchema.parse(payload.state);
    } catch (err) {
      throw new SurfacePlannerError(
        `Invalid state payload: ${(err as Error).message ?? "unable to parse state"}`,
        400,
      );
    }
  }
  const now = Date.now();
  if (!recordCallAndCheckLimit(now)) {
    throw new SurfacePlannerError("Rate limit exceeded. Try again shortly.", 429);
  }

  const stateSummary = sanitizedState
    ? JSON.stringify(
        {
          seed: sanitizedState.seed,
          branch: sanitizedState.branch,
          rc: sanitizedState.rc,
          T: sanitizedState.T,
          peaks: sanitizedState.peaks?.count,
          capabilities: sanitizedState.capabilities,
        },
        null,
        0,
      )
    : "{}";

  const systemPrompt =
    "You translate natural language intents into Helix control plans that strictly comply with the provided JSON schema. " +
    "Return only the plan JSON. Prefer relative adjustments unless the user is explicit. Never include actions outside the schema.";

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Schema version: ${HELIX_PLAN_VERSION}` },
    { role: "user", content: `Current state (redacted): ${stateSummary}` },
    { role: "user", content: utterance.trim() },
  ];

  const body = {
    model: SURFACE_MODEL,
    input: messages,
    response_format: {
      type: "json_schema",
      json_schema: { name: "helix_plan", schema: helixPlanJsonSchema },
    },
    max_output_tokens: 600,
  };

  const serialized = JSON.stringify(body);
  const promptEstimate = messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);

  const res = await fetch(RESPONSES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: serialized,
  });

  if (!res.ok) {
    const errorPayload = await res.text();
    throw new SurfacePlannerError(
      `Surface planner error ${res.status}: ${errorPayload || res.statusText}`,
      res.status === 429 ? 429 : 502,
    );
  }

  const json = (await res.json()) as Record<string, unknown>;
  const output = Array.isArray(json?.output) ? json.output : [];
  const content = output.find((chunk) => chunk?.content)?.content;

  const planPayload = Array.isArray(content)
    ? content
        .map((item) => (typeof item?.text === "string" ? item.text : undefined))
        .filter(Boolean)
        .join("")
    : undefined;

  if (!planPayload) {
    throw new SurfacePlannerError("Surface planner did not return plan JSON.", 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(planPayload);
  } catch (err) {
    throw new SurfacePlannerError(
      `Surface planner returned invalid JSON: ${(err as Error).message}`,
      502,
    );
  }

  const plan = helixPlanSchema.parse(parsed);
  const planId = crypto.randomUUID();

  return {
    planId,
    plan,
    raw: json,
    tokenEstimate: promptEstimate,
    model: SURFACE_MODEL,
  };
}
