import type { TCollapseTraceEntry, TMemorySearchHit } from "@shared/essence-persona";
import type { ResonanceBundle, ResonanceCollapse } from "@shared/code-lattice";
import type { KnowledgeProjectExport } from "@shared/knowledge";
import type { WhyBelongs } from "@shared/rationale";
import type { ConsoleTelemetryBundle, PanelTelemetry } from "@shared/desktop";
import type { BadgeTelemetrySnapshot } from "@shared/badge-telemetry";
import type { EssenceProfile, EssenceProfileUpdate } from "@shared/inferenceProfile";
import type { PromptSpec } from "@shared/prompt-spec";
import type { ChatSession } from "@shared/agi-chat";
import type { AgiRefineryRequest } from "@shared/agi-refinery";
import type { HelixAskResponseEnvelope } from "@shared/helix-ask-envelope";
import { DEFAULT_DESKTOP_ID, pushConsoleTelemetry } from "@/lib/agi/consoleTelemetry";
import { ensureLatestLattice } from "@/lib/agi/resonanceVersion";
import { useResonanceStore } from "@/store/useResonanceStore";
import type { LumaMood } from "@/lib/luma-moods";
import type { CollapseDecision, CollapseStrategyName } from "./orchestrator";
import type { LocalCallSpec } from "@shared/local-call-spec";

export type PlanResponse = {
  traceId: string;
  plan: unknown;
  manifest?: unknown;
  plan_dsl?: string;
  plan_steps?: unknown[];
  executor_steps?: unknown[];
  prompt?: string;
  planner_prompt?: string;
  telemetry_bundle?: ConsoleTelemetryBundle | null;
  telemetry_summary?: string | Record<string, unknown> | null;
  lattice_version?: number | string | null;
  resonance_bundle?: ResonanceBundle | null;
  resonance_selection?: ResonanceCollapse | null;
  debate_id?: string | null;
  strategy?: string | null;
  strategy_notes?: string[];
  collapse_trace?: TCollapseTraceEntry | null;
  collapse_strategy?: string | null;
  call_spec?: LocalCallSpec | null;
  task_trace?: unknown;
};

export type ExecuteResponse = {
  ok: boolean;
  steps: unknown[];
  result_summary?: string;
  traceId?: string;
  why_belongs?: WhyBelongs;
  planner_prompt?: string;
  telemetry_bundle?: ConsoleTelemetryBundle | null;
  telemetry_summary?: string | Record<string, unknown> | null;
  lattice_version?: number | string | null;
  resonance_bundle?: ResonanceBundle | null;
  resonance_selection?: ResonanceCollapse | null;
  debate_id?: string | null;
};

export type LocalAskResponse = {
  text: string;
  envelope?: HelixAskResponseEnvelope;
  model?: string;
  essence_id?: string;
  seed?: number;
  duration_ms?: number;
  prompt_ingested?: boolean;
  prompt_ingest_source?: string;
  prompt_ingest_reason?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    max_tokens?: number;
  };
  debug?: {
    two_pass?: boolean;
    micro_pass?: boolean;
    micro_pass_auto?: boolean;
    micro_pass_reason?: string;
    scaffold?: string;
    evidence_cards?: string;
    query_hints?: string[];
    queries?: string[];
    context_files?: string[];
    prompt_ingested?: boolean;
    prompt_ingest_source?: string;
    prompt_ingest_reason?: string;
    prompt_chunk_count?: number;
    prompt_selected?: number;
    prompt_context_files?: string[];
    intent_id?: string;
    intent_domain?: string;
    intent_tier?: string;
    intent_secondary_tier?: string;
    intent_strategy?: string;
    intent_reason?: string;
    arbiter_mode?: "repo_grounded" | "hybrid" | "general" | "clarify";
    arbiter_reason?: string;
    arbiter_strictness?: "low" | "med" | "high";
    arbiter_user_expects_repo?: boolean;
    arbiter_repo_ok?: boolean;
    arbiter_hybrid_ok?: boolean;
    math_solver_ok?: boolean;
    math_solver_kind?: string;
    math_solver_final?: string;
    math_solver_reason?: string;
    math_solver_variable?: string;
    math_solver_gate_pass?: boolean;
    math_solver_gate_reason?: string;
    math_solver_domain_pass?: boolean;
    math_solver_residual_pass?: boolean;
    math_solver_residual_max?: number;
    math_solver_registry_id?: string;
    math_solver_selected_solution?: string;
    math_solver_admissible_count?: number;
    evidence_gate_ok?: boolean;
    evidence_match_ratio?: number;
    evidence_match_count?: number;
    evidence_token_count?: number;
    citation_repair?: boolean;
    format?: "steps" | "compare" | "brief";
    stage_tags?: boolean;
    verbosity?: "brief" | "normal" | "extended";
    junk_clean_applied?: boolean;
    junk_clean_reasons?: string[];
    concept_lint_applied?: boolean;
    concept_lint_reasons?: string[];
    coverage_token_count?: number;
    coverage_key_count?: number;
    coverage_missing_key_count?: number;
    coverage_ratio?: number;
    coverage_missing_keys?: string[];
    coverage_gate_applied?: boolean;
    coverage_gate_reason?: string;
    belief_claim_count?: number;
    belief_supported_count?: number;
    belief_unsupported_count?: number;
    belief_unsupported_rate?: number;
    belief_contradictions?: number;
    belief_gate_applied?: boolean;
    belief_gate_reason?: string;
    rattling_score?: number;
    rattling_gate_applied?: boolean;
  };
};

export type MoodHintResponse = {
  mood: LumaMood | null;
  confidence: number;
  reason?: string | null;
  source?: string;
  durationMs?: number;
  traceId?: string;
  sessionId?: string | null;
  raw?: string | null;
};

export async function searchCodeLattice(
  query: string,
  limit = 12,
): Promise<KnowledgeProjectExport> {
  return asJson(
    await fetch("/api/code-lattice/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit }),
    }),
  );
}

export type ToolLogEvent = {
  id?: string;
  seq?: number;
  ts?: string;
  traceId?: string;
  sessionId?: string;
  tool?: string;
  ok?: boolean;
  text?: string;
  debateId?: string;
  promptHash?: string;
  paramsHash?: string;
  durationMs?: number;
  stepId?: string;
  strategy?: string;
};

export type PersonaSummary = {
  id: string;
  display_name: string;
};

export type DebateTurnPayload = {
  id: string;
  debate_id: string;
  round: number;
  role: "proponent" | "skeptic" | "referee";
  text: string;
  citations: string[];
  verifier_results: { name: string; ok: boolean; reason: string }[];
  created_at: string;
  essence_id?: string;
};

export type DebateScoreboard = {
  proponent: number;
  skeptic: number;
};

export type DebateRoundMetricsPayload = {
  round?: number;
  verifier_pass?: number;
  coverage?: number;
  stability?: number;
  novelty_gain?: number;
  score?: number;
  improvement?: number;
  flags?: number;
  tool_calls?: number;
  time_used_ms?: number;
  time_left_ms?: number;
};

export type DebateOutcomePayload = {
  debate_id: string;
  verdict: string;
  confidence: number;
  winning_role?: "proponent" | "skeptic";
  key_turn_ids: string[];
  rounds?: number;
  score?: number;
  stop_reason?: string;
  metrics?: DebateRoundMetricsPayload;
  created_at: string;
};

export type DebateSnapshot = {
  id: string;
  goal: string;
  persona_id: string;
  status: "pending" | "running" | "completed" | "timeout" | "aborted";
  config: {
    max_rounds: number;
    max_wall_ms: number;
    max_tool_calls: number;
    satisfaction_threshold: number;
    min_improvement: number;
    stagnation_rounds: number;
    novelty_epsilon: number;
    verifiers: string[];
  };
  created_at: string;
  updated_at: string;
  turns: DebateTurnPayload[];
  scoreboard: DebateScoreboard;
  outcome: DebateOutcomePayload | null;
  context?: Record<string, unknown> | null;
};

export type DebateStreamEvent =
  | {
      type: "turn";
      seq: number;
      debateId: string;
      turn: DebateTurnPayload;
      scoreboard: DebateScoreboard;
    }
  | {
      type: "status";
      seq: number;
      debateId: string;
      status: DebateSnapshot["status"];
      scoreboard: DebateScoreboard;
      metrics?: DebateRoundMetricsPayload;
    }
  | {
      type: "outcome";
      seq: number;
      debateId: string;
      outcome: DebateOutcomePayload;
      scoreboard: DebateScoreboard;
      metrics?: DebateRoundMetricsPayload;
    };

export type DebateStartPayload = {
  goal: string;
  personaId: string;
  maxRounds?: number;
  maxWallMs?: number;
  verifiers?: string[];
};

export type DebateStartResponse = {
  debateId: string;
};

export type TraceMemoryHit = {
  id: string;
  kind: string;
  owner_id: string;
  created_at: string;
  keys: string[];
  snippet: string;
  essence_id?: string;
};

export type TraceMemoryResponse = {
  traceId: string;
  personaId: string;
  top_k: number;
  memories: TraceMemoryHit[];
  reflections: TraceMemoryHit[];
};

type PersonaListResponse = {
  personas: PersonaSummary[];
};

export type MemorySearchResponse = {
  items: TMemorySearchHit[];
  query?: string;
  top_k: number;
  debateOnly?: boolean;
};

export type PanelSnapshotResponse = {
  desktopId: string;
  capturedAt: string;
  panels: PanelTelemetry[];
  relatedPanels?: Array<{ id: string; title?: string }> | null;
  relationNotes?: string[] | null;
};

export type BadgeTelemetryResponse = BadgeTelemetrySnapshot;

async function asJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    const preview = await response
      .text()
      .then((text) => text.trim().slice(0, 200))
      .catch(() => "");
    const base = `${response.status} ${response.statusText || "Non-JSON response"}`;
    const hint =
      typeof response.url === "string" && response.url.includes("/api/agi")
        ? " Ensure the AGI server routes are enabled (ENABLE_AGI=1)."
        : "";
    throw new Error(preview ? `${base}: ${preview}${hint}` : `${base}${hint}`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${(error as Error).message}`);
  }

  if (!response.ok) {
    const message =
      (typeof (payload as any)?.message === "string" && (payload as any).message) ||
      (typeof (payload as any)?.error === "string" && (payload as any).error) ||
      `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return payload as T;
}

export type PlanRequestOptions = {
  desktopId?: string;
  includeTelemetry?: boolean;
  promptSpec?: PromptSpec;
  collapseTrace?: CollapseDecision;
  collapseStrategy?: CollapseStrategyName;
  callSpec?: LocalCallSpec | null;
  essenceConsole?: boolean;
  warpParams?: Record<string, unknown>;
  sessionId?: string;
  refinery?: AgiRefineryRequest;
};

export async function plan(
  goal: string,
  personaId?: string,
  knowledgeContext?: KnowledgeProjectExport[],
  knowledgeProjects?: string[],
  options?: PlanRequestOptions,
): Promise<PlanResponse> {
  await ensureLatestLattice();
  const body: Record<string, unknown> = { goal, personaId };
  if (Array.isArray(knowledgeContext) && knowledgeContext.length > 0) {
    body.knowledgeContext = knowledgeContext;
  }
  if (Array.isArray(knowledgeProjects) && knowledgeProjects.length > 0) {
    body.knowledgeProjects = knowledgeProjects;
  }
  if (options?.promptSpec) {
    body.prompt_spec = options.promptSpec;
  }
  if (options?.collapseTrace) {
    body.collapse_trace = options.collapseTrace;
  }
  if (options?.collapseStrategy) {
    body.collapse_strategy = options.collapseStrategy;
  }
  if (options?.callSpec) {
    body.call_spec = options.callSpec;
  }
  if (options?.essenceConsole) {
    body.essenceConsole = true;
  }
  if (options?.warpParams) {
    body.warpParams = options.warpParams;
  }
  if (options?.sessionId) {
    body.sessionId = options.sessionId;
  }
  if (options?.refinery) {
    body.refinery = options.refinery;
  }
  const desktopId = options?.desktopId ?? DEFAULT_DESKTOP_ID;
  if (desktopId) {
    body.desktopId = desktopId;
  }
  if (options?.includeTelemetry !== false) {
    try {
      await pushConsoleTelemetry(desktopId);
    } catch (error) {
      console.warn("[agi] console telemetry push failed", error);
    }
  }
  const payload = await asJson<PlanResponse>(
    await fetch("/api/agi/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  const latticeVersionValue =
    payload.lattice_version === null || payload.lattice_version === undefined
      ? null
      : Number.isFinite(Number(payload.lattice_version))
        ? Number(payload.lattice_version)
        : null;
  useResonanceStore.getState().setResonancePayload({
    bundle: payload.resonance_bundle ?? null,
    selection: payload.resonance_selection ?? null,
    latticeVersion: latticeVersionValue,
    traceId: payload.traceId,
  });
  return payload;
}

export async function execute(traceId: string): Promise<ExecuteResponse> {
  return asJson(
    await fetch("/api/agi/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ traceId })
    })
  );
}

export async function askLocal(
  prompt?: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    seed?: number;
    stop?: string | string[];
    sessionId?: string;
    traceId?: string;
    personaId?: string;
    question?: string;
    debug?: boolean;
    verbosity?: "brief" | "normal" | "extended";
    searchQuery?: string;
    topK?: number;
    context?: string;
    signal?: AbortSignal;
  },
): Promise<LocalAskResponse> {
  const body: Record<string, unknown> = {};
  const trimmedPrompt = typeof prompt === "string" ? prompt.trim() : "";
  if (trimmedPrompt) {
    body.prompt = prompt;
  }
  if (typeof options?.maxTokens === "number") body.max_tokens = options.maxTokens;
  if (typeof options?.temperature === "number") body.temperature = options.temperature;
  if (typeof options?.seed === "number") body.seed = options.seed;
  if (options?.stop) body.stop = options.stop;
  if (options?.sessionId) body.sessionId = options.sessionId;
  if (options?.traceId) body.traceId = options.traceId;
  if (options?.personaId) body.personaId = options.personaId;
  if (options?.question) body.question = options.question;
  if (typeof options?.debug === "boolean") body.debug = options.debug;
  if (options?.verbosity) body.verbosity = options.verbosity;
  if (typeof options?.searchQuery === "string" && options.searchQuery.trim()) {
    body.searchQuery = options.searchQuery.trim();
  }
  if (typeof options?.topK === "number") body.topK = options.topK;
  if (typeof options?.context === "string" && options.context.trim()) {
    body.context = options.context;
  }
  return asJson(
    await fetch("/api/agi/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: options?.signal,
    }),
  );
}

export async function askMoodHint(
  text: string,
  options?: { sessionId?: string; personaId?: string; signal?: AbortSignal },
): Promise<MoodHintResponse> {
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (!trimmed) {
    return { mood: null, confidence: 0 };
  }
  const body: Record<string, unknown> = { text: trimmed };
  if (options?.sessionId) body.sessionId = options.sessionId;
  if (options?.personaId) body.personaId = options.personaId;
  return asJson(
    await fetch("/api/agi/mood-hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: options?.signal,
    }),
  );
}

export function subscribeToolLogs(
  onEvent: (event: ToolLogEvent) => void,
  options?: { tool?: string; sessionId?: string; traceId?: string; limit?: number },
): () => void {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    return () => {};
  }
  const params = new URLSearchParams();
  if (options?.tool) params.set("tool", options.tool);
  if (options?.sessionId) params.set("sessionId", options.sessionId);
  if (options?.traceId) params.set("traceId", options.traceId);
  if (typeof options?.limit === "number") params.set("limit", String(options.limit));
  const url = params.toString()
    ? `/api/agi/tools/logs/stream?${params.toString()}`
    : "/api/agi/tools/logs/stream";
  const source = new EventSource(url);
  source.onmessage = (event) => {
    try {
      onEvent(JSON.parse(event.data) as ToolLogEvent);
    } catch {
      /* ignore malformed events */
    }
  };
  source.onerror = () => {
    /* best-effort stream, do nothing on error */
  };
  return () => {
    source.close();
  };
}

export async function syncKnowledgeProjects(
  projects: KnowledgeProjectExport[],
): Promise<{ synced: number; projectIds: string[] }> {
  if (!Array.isArray(projects) || projects.length === 0) {
    return { synced: 0, projectIds: [] };
  }
  const payload = await asJson<{ synced: number; projectIds: string[]; skipped?: string }>(
    await fetch("/api/knowledge/projects/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projects }),
    }),
  );
  if (payload.skipped) {
    return { synced: 0, projectIds: [] };
  }
  return payload;
}

export async function getTraceMemories(traceId: string, k = 10): Promise<TraceMemoryResponse> {
  const search = new URLSearchParams({ k: String(k) });
  return asJson(
    await fetch(`/api/agi/memory/by-trace/${encodeURIComponent(traceId)}?${search.toString()}`, {
      headers: { Accept: "application/json" }
    })
  );
}

export type MemorySearchParams = {
  q: string;
  k?: number;
  personaId?: string;
  debateOnly?: boolean;
};

export async function memorySearch({
  q,
  k = 10,
  personaId,
  debateOnly = false,
}: MemorySearchParams): Promise<MemorySearchResponse> {
  const search = new URLSearchParams();
  search.set("q", q);
  if (k) search.set("k", String(k));
  if (personaId) search.set("owner", personaId);
  if (debateOnly) search.set("debateOnly", "1");
  return asJson(
    await fetch(`/api/agi/memory/search?${search.toString()}`, {
      headers: { Accept: "application/json" },
    }),
  );
}

export async function listChatSessions(opts?: {
  limit?: number;
  offset?: number;
  includeMessages?: boolean;
}): Promise<ChatSession[]> {
  const params = new URLSearchParams();
  if (typeof opts?.limit === "number") params.set("limit", String(opts.limit));
  if (typeof opts?.offset === "number") params.set("offset", String(opts.offset));
  if (opts?.includeMessages === false) params.set("includeMessages", "0");
  const suffix = params.toString();
  const payload = await asJson<{ sessions?: ChatSession[] }>(
    await fetch(`/api/agi/chat/sessions${suffix ? `?${suffix}` : ""}`, {
      headers: { Accept: "application/json" },
    }),
  );
  return payload.sessions ?? [];
}

export async function getChatSession(id: string): Promise<ChatSession | null> {
  if (!id) return null;
  const payload = await asJson<{ session?: ChatSession }>(
    await fetch(`/api/agi/chat/sessions/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
    }),
  );
  return payload.session ?? null;
}

export async function upsertChatSession(session: ChatSession): Promise<ChatSession> {
  const payload = await asJson<{ session: ChatSession }>(
    await fetch("/api/agi/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    }),
  );
  return payload.session;
}

export async function deleteChatSession(id: string): Promise<void> {
  if (!id) return;
  await asJson(
    await fetch(`/api/agi/chat/sessions/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    }),
  );
}

export async function listPersonas(): Promise<PersonaSummary[]> {
  const payload = await asJson<PersonaListResponse>(
    await fetch("/api/agi/persona/list", {
      headers: { Accept: "application/json" }
    })
  ).catch((error) => {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  });
  if (!payload || !Array.isArray(payload.personas)) {
    return [];
  }
  return payload.personas;
}

export async function startDebateSession(payload: DebateStartPayload): Promise<DebateStartResponse> {
  const body: Record<string, unknown> = {
    goal: payload.goal,
    persona_id: payload.personaId,
  };
  if (Number.isFinite(payload.maxRounds)) {
    body.max_rounds = payload.maxRounds;
  }
  if (Number.isFinite(payload.maxWallMs)) {
    body.max_wall_ms = payload.maxWallMs;
  }
  if (Array.isArray(payload.verifiers) && payload.verifiers.length > 0) {
    body.verifiers = payload.verifiers.map((name) => name?.toString().trim()).filter((name) => !!name);
  }
  return asJson(
    await fetch("/api/agi/debate/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  );
}

export async function getDebateStatus(debateId: string): Promise<DebateSnapshot> {
  return asJson(
    await fetch(`/api/agi/debate/${encodeURIComponent(debateId)}`, {
      headers: { Accept: "application/json" }
    })
  );
}

export async function getPanelSnapshots(params: { desktopId?: string; panelIds?: string[] } = {}): Promise<PanelSnapshotResponse> {
  const search = new URLSearchParams();
  if (params.desktopId) {
    search.set("desktopId", params.desktopId);
  }
  if (params.panelIds && params.panelIds.length > 0) {
    search.set("panelIds", params.panelIds.join(","));
  }
  return asJson(
    await fetch(`/api/agi/telemetry/panels?${search.toString()}`, {
      headers: { Accept: "application/json" },
    }),
  );
}

export async function getBadgeTelemetry(params: { desktopId?: string; includeRaw?: boolean } = {}): Promise<BadgeTelemetryResponse> {
  const search = new URLSearchParams();
  if (params.desktopId) {
    search.set("desktopId", params.desktopId);
  }
  if (params.includeRaw) {
    search.set("includeRaw", "1");
  }
  return asJson(
    await fetch(`/api/agi/telemetry/badges?${search.toString()}`, {
      headers: { Accept: "application/json" },
    }),
  );
}

export async function fetchEssenceProfile(
  essenceId: string,
  options?: { stateless?: boolean },
): Promise<EssenceProfile | null> {
  const params = new URLSearchParams();
  if (options?.stateless) params.set("stateless", "1");
  const res = await fetch(`/api/essence/profile/${essenceId}?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch essence profile");
  }
  const json = (await res.json()) as { profile?: EssenceProfile | null };
  return json.profile ?? null;
}

export async function updateEssenceProfile(
  essenceId: string,
  update: EssenceProfileUpdate,
  options?: { stateless?: boolean },
): Promise<EssenceProfile> {
  const params = new URLSearchParams();
  if (options?.stateless) params.set("stateless", "1");
  const res = await fetch(`/api/essence/profile/${essenceId}?${params.toString()}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update ?? {}),
  });
  if (!res.ok) {
    throw new Error("Failed to update essence profile");
  }
  const json = (await res.json()) as { profile: EssenceProfile };
  return json.profile;
}

export async function resetEssenceProfile(
  essenceId: string,
  options?: { stateless?: boolean },
): Promise<void> {
  const params = new URLSearchParams();
  if (options?.stateless) params.set("stateless", "1");
  const res = await fetch(`/api/essence/profile/${essenceId}?${params.toString()}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to reset essence profile");
  }
}

export type DebateStreamHandlers = {
  onEvent?: (event: DebateStreamEvent) => void;
  onError?: (event: Event) => void;
};

type EventPayload<T extends DebateStreamEvent["type"]> = Omit<Extract<DebateStreamEvent, { type: T }>, "type">;

const parseEventPayload = <T extends DebateStreamEvent["type"]>(event: Event): EventPayload<T> | null => {
  try {
    const data = JSON.parse((event as MessageEvent<string>).data || "{}") as EventPayload<T>;
    return data;
  } catch {
    return null;
  }
};

export function connectDebateStream(debateId: string, handlers: DebateStreamHandlers = {}): () => void {
  if (!debateId || typeof window === "undefined" || typeof EventSource === "undefined") {
    return () => {};
  }
  const params = new URLSearchParams({ debateId });
  const source = new EventSource(`/api/agi/debate/stream?${params.toString()}`);
  const dispatch = <T extends DebateStreamEvent["type"]>(type: T) => (event: Event) => {
    const payload = parseEventPayload<T>(event);
    if (!payload) return;
    handlers.onEvent?.({ ...payload, type } as Extract<DebateStreamEvent, { type: T }>);
  };
  const handleTurn = dispatch("turn");
  const handleStatus = dispatch("status");
  const handleOutcome = dispatch("outcome");
  source.addEventListener("turn", handleTurn);
  source.addEventListener("status", handleStatus);
  source.addEventListener("outcome", handleOutcome);
  source.onerror = (event) => {
    handlers.onError?.(event);
  };
  return () => {
    source.removeEventListener("turn", handleTurn);
    source.removeEventListener("status", handleStatus);
    source.removeEventListener("outcome", handleOutcome);
    source.close();
  };
}
