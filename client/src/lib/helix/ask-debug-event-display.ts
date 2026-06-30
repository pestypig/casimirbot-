export type AskLiveEventEntry = {
  id: string;
  text: string;
  tool?: string;
  ts?: string | number;
  tsMs?: number;
  seq?: number;
  durationMs?: number;
  meta?: Record<string, unknown>;
};

export type AskLiveEventIdentity = {
  turnId: string | null;
  traceId: string | null;
};

export const HELIX_ASK_PROGRESS_PLACEHOLDER_TEXT = "Reasoning in progress...";

function summarizeVoiceDebugText(source: string, maxChars = 220): string {
  const text = source.replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function safeJsonStringify(value: unknown, fallback = "Unable to render debug payload."): string {
  const normalize = (input: unknown, stack: WeakSet<object>): unknown => {
    if (typeof input === "bigint") return input.toString();
    if (!input || typeof input !== "object") return input;
    if (stack.has(input)) return "[Circular]";
    stack.add(input);
    if (Array.isArray(input)) {
      const out = input.map((entry) => normalize(entry, stack));
      stack.delete(input);
      return out;
    }
    const out: Record<string, unknown> = {};
    Object.entries(input as Record<string, unknown>).forEach(([key, entry]) => {
      out[key] = normalize(entry, stack);
    });
    stack.delete(input);
    return out;
  };
  try {
    return JSON.stringify(normalize(value, new WeakSet<object>()), null, 2);
  } catch {
    return fallback;
  }
}

export function parseAskLiveEventTimestampMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return Math.trunc(numeric);
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export function resolveAskLiveEventTimestampMs(event: AskLiveEventEntry): number | null {
  if (typeof event.tsMs === "number" && Number.isFinite(event.tsMs)) {
    return Math.trunc(event.tsMs);
  }
  return parseAskLiveEventTimestampMs(event.ts);
}

export function formatAskLiveEventLogLine(event: AskLiveEventEntry): string {
  const tsMs = resolveAskLiveEventTimestampMs(event);
  const timestamp =
    tsMs === null
      ? "time"
      : new Date(tsMs).toISOString().split("T")[1]?.replace("Z", "") ?? "time";
  const toolLabel = event.tool?.trim()
    ? event.tool.startsWith("helix.ask.")
      ? event.tool.replace("helix.ask.", "").replace(/\./g, " ")
      : event.tool
    : "event";
  const stageLabel =
    event.meta && typeof event.meta.stage === "string" ? String(event.meta.stage).trim() : "";
  const detailLabel =
    event.meta && typeof event.meta.detail === "string" ? String(event.meta.detail).trim() : "";
  const statusLabel =
    event.meta && typeof event.meta.status === "string" ? String(event.meta.status).trim() : "";
  const parts: string[] = [`tool=${toolLabel}`];
  if (stageLabel) parts.push(`stage=${stageLabel}`);
  if (statusLabel) parts.push(`status=${statusLabel}`);
  if (detailLabel) parts.push(`detail=${detailLabel}`);
  if (typeof event.seq === "number" && Number.isFinite(event.seq)) {
    parts.push(`seq=${Math.max(0, Math.trunc(event.seq))}`);
  }
  if (typeof event.durationMs === "number" && Number.isFinite(event.durationMs)) {
    parts.push(`dur=${Math.max(0, Math.round(event.durationMs))}ms`);
  }
  const text = summarizeVoiceDebugText(event.text ?? "", 220) || "event";
  return `[${timestamp}] ${parts.join(" | ")} | text=${text}`;
}

export function buildAskLiveEventLogExport(events: AskLiveEventEntry[]): string {
  if (!events.length) return "";
  return events.map((event) => formatAskLiveEventLogLine(event)).join("\n");
}

export function buildAskLiveEventLogDetailPayload(event: AskLiveEventEntry): string {
  const payload = {
    id: event.id,
    ts: event.ts ?? null,
    tsMs: resolveAskLiveEventTimestampMs(event),
    tool: typeof event.tool === "string" ? event.tool : null,
    seq: typeof event.seq === "number" && Number.isFinite(event.seq) ? event.seq : null,
    durationMs:
      typeof event.durationMs === "number" && Number.isFinite(event.durationMs)
        ? Math.max(0, Math.round(event.durationMs))
        : null,
    text: typeof event.text === "string" ? event.text : "",
    meta: event.meta ?? null,
  };
  return safeJsonStringify(payload);
}

export function readEventMetaString(
  meta: Record<string, unknown> | undefined,
  keys: string[],
): string | null {
  if (!meta) return null;
  for (const key of keys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function readAskLiveEventIdentity(event: AskLiveEventEntry): AskLiveEventIdentity {
  return {
    turnId:
      readEventMetaString(event.meta, ["turn_id", "turnId", "active_turn_id", "activeTurnId", "ask_turn_id", "askTurnId"]) ??
      null,
    traceId: readEventMetaString(event.meta, ["trace_id", "traceId", "ask_trace_id", "askTraceId"]) ?? null,
  };
}

export function parseHelixAskQueuedQuestionsInput(value: string): string[] {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  return normalized ? [normalized] : [];
}

function coerceDisplayText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function readDisplayRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function cleanHelixRenderedQuestionText(value: unknown): string | null {
  const cleaned = coerceDisplayText(value)
    .replace(/^\s*\d*\s*Question\s*question\s*/i, "")
    .replace(/\s*user prompt\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

export function cleanHelixRenderedFinalAnswerText(value: unknown): string | null {
  const cleaned = coerceDisplayText(value)
    .replace(/^\s*\d*\s*Final answer\s*final\s*/i, "")
    .replace(/\s*(?:typed failure|chat final answer|compound evidence synthesis answer|workstation tool evaluation)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

export function normalizedDebugReplyText(value: unknown): string {
  return coerceDisplayText(value).replace(/\s+/g, " ").trim();
}

export function isHelixAskProgressPlaceholderText(value: string | null | undefined): boolean {
  return coerceDisplayText(value).trim().toLowerCase() === HELIX_ASK_PROGRESS_PLACEHOLDER_TEXT.toLowerCase();
}

export function classifyCompactToolTraceAction(panelId: string | null, actionId: string | null) {
  const panel = (panelId ?? "").toLowerCase();
  const action = (actionId ?? "").toLowerCase();
  const tool = `${panelId}.${actionId}`;
  if (tool === "theory-badge-graph.reflect_discussion_context") {
    return { role: "context_locator", authority: "evidence_only", summary: "Located the prompt in theory graph space." };
  }
  if (tool === "theory-badge-graph.explain_reflected_context") {
    return { role: "context_route_builder", authority: "evidence_only", summary: "Built a first-principles context route from the reflection." };
  }
  if (tool === "scientific-calculator.solve_expression" || tool === "scientific-calculator.solve_with_steps") {
    return { role: "scalar_solver", authority: "numeric_observation", summary: "Computed the scalar result in the Scientific Calculator." };
  }
  if (action === "open" || action === "focus" || action === "show" || action === "switch_to") {
    return { role: "ui_navigation", authority: "ui_state", summary: "Opened or focused a workstation panel." };
  }
  if (
    panel.includes("doc") ||
    panel.includes("paper") ||
    panel.includes("source") ||
    action.includes("search") ||
    action.includes("lookup") ||
    action.includes("read") ||
    action.includes("open_doc") ||
    action.includes("retrieve")
  ) {
    return { role: "source_lookup", authority: "source_evidence", summary: "Retrieved source or reference evidence." };
  }
  if (action.includes("runtime") || action.includes("trace") || action.includes("receipt")) {
    return { role: "runtime_observer", authority: "runtime_observation", summary: "Returned runtime or trace observation evidence." };
  }
  if (
    action.includes("create") ||
    action.includes("update") ||
    action.includes("delete") ||
    action.includes("append") ||
    action.includes("save") ||
    action.includes("load") ||
    action.includes("clear") ||
    action.includes("set_")
  ) {
    return { role: "state_mutation", authority: "mutation_receipt", summary: "Changed workstation panel state." };
  }
  return { role: "panel_state", authority: "ui_state", summary: "Updated workstation panel state." };
}

export function answerNoteForCompactToolTraceItems(items: Array<{ role: string }>): string | null {
  const hasTheoryReflection = items.some((item) => item.role === "context_locator" || item.role === "context_route_builder");
  const hasScalarSolver = items.some((item) => item.role === "scalar_solver");
  const hasRuntimeObserver = items.some((item) => item.role === "runtime_observer");
  const hasSourceLookup = items.some((item) => item.role === "source_lookup");
  const hasStateMutation = items.some((item) => item.role === "state_mutation");
  if (hasTheoryReflection && hasScalarSolver) {
    return "Evidence note: theory graph reflection supplied context; Scientific Calculator receipts supplied the numeric result.";
  }
  if (hasTheoryReflection && hasRuntimeObserver) {
    return "Evidence note: theory graph reflection supplied context; runtime receipts supplied system-level observations.";
  }
  if (hasTheoryReflection) return "Evidence note: theory graph reflection supplied context only; it is not a solve.";
  if (hasScalarSolver && hasRuntimeObserver) {
    return "Evidence note: calculator receipts supplied scalar results; runtime receipts supplied system-level observations.";
  }
  if (hasSourceLookup && hasScalarSolver) {
    return "Evidence note: source lookup supplied evidence; Scientific Calculator receipts supplied the numeric result.";
  }
  if (hasSourceLookup) return "Evidence note: workstation source lookup supplied evidence only; it is not a solve.";
  if (hasStateMutation) {
    return "Evidence note: workstation mutation receipts confirm panel state changes; they are not factual support by themselves.";
  }
  return null;
}

export function buildCompactToolTraceDisclosure(actionEnvelope: Record<string, unknown> | null, turnId: string) {
  const workstationActions = Array.isArray(actionEnvelope?.workstation_actions)
    ? actionEnvelope.workstation_actions
        .map((entry) => readDisplayRecord(entry))
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
        .map((entry) => {
          const action = coerceDisplayText(entry.action).trim();
          if (action === "restore_view_state") {
            return {
              panel_id: "workstation",
              action_id: "restore_view_state",
            };
          }
          return {
            panel_id: coerceDisplayText(entry.panel_id).trim() || null,
            action_id: coerceDisplayText(entry.action_id).trim() || null,
          };
        })
        .filter((entry) => Boolean(entry.panel_id && entry.action_id))
    : [];
  if (workstationActions.length === 0) return null;
  const actionKeys = workstationActions.map((action) => `${action.panel_id}.${action.action_id}`);
  const items = workstationActions.map((action) => ({
    tool: `${action.panel_id}.${action.action_id}`,
    ...classifyCompactToolTraceAction(action.panel_id, action.action_id),
  }));
  return {
    schema: "helix.ask_tool_trace_disclosure.v1",
    disclosureId: `${turnId}:tool_trace_disclosure`,
    turnId,
    action_keys: actionKeys,
    items,
    workstation_actions: workstationActions,
    answerNote: answerNoteForCompactToolTraceItems(items),
    assistant_answer: false,
    terminal_eligible: false,
  };
}
