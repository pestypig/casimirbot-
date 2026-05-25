import { openDocPanel } from "@/lib/docs/openDocPanel";
import { DOC_MANIFEST, findDocEntry } from "@/lib/docs/docManifest";
import { getPanelDef } from "@/lib/desktop/panelRegistry";
import { launchHelixAskPrompt } from "@/lib/helix/ask-prompt-launch";
import type { HelixAskAnswerContract } from "@/lib/helix/ask-prompt-launch";
import type { SettingsTab } from "@/hooks/useHelixStartSettings";
import { dispatchScientificCalculatorMathPicked } from "@/lib/scientific-calculator/events";
import {
  buildScientificCalculatorDebugSnapshot,
  formatScientificCalculatorDebugLog,
} from "@/lib/scientific-calculator/debugLog";
import { runScientificSolve } from "@/lib/scientific-calculator/solver";
import { recordClipboardReceipt } from "@/lib/workstation/workstationClipboard";
import { useDocViewerStore } from "@/store/useDocViewerStore";
import { useScientificCalculatorStore } from "@/store/useScientificCalculatorStore";
import { useScientificCalculatorLiveSourceStore } from "@/store/useScientificCalculatorLiveSourceStore";
import {
  useSituationRoomStore,
  selectSituationRoomEvents,
  type SituationRoom,
  type SituationRoomSource,
} from "@/store/useSituationRoomStore";
import {
  useSituationRoomJobStore,
  type SituationRoomJobKind,
  type SituationRoomJobInputTextPolicy,
  type SituationRoomJobOutputRenderPolicy,
} from "@/store/useSituationRoomJobStore";
import { useSituationRoomGraphStore } from "@/store/useSituationRoomGraphStore";
import {
  normalizeSituationRoomSetupActionArgs,
  setupSituationRoomFromPrompt,
} from "@/lib/workstation/situationRoomSetupActions";
import { useWorkstationClipboardStore } from "@/store/useWorkstationClipboardStore";
import { useWorkstationNotesStore } from "@/store/useWorkstationNotesStore";
import { useWorkstationProcessGraphStore } from "@/store/useWorkstationProcessGraphStore";
import { renderWorkstationProcessGraphSvg } from "@/lib/workstation/processGraph/renderProcessGraphSvg";
import type {
  SituationGraphLane,
  SituationGraphNodeColumn,
  SituationGraphNodeStatus,
  SituationGraphNodeType,
  TranslationPairNodeConfig,
} from "@shared/helix-situation-graph";
import type { HelixCalculatorSetupContext } from "@shared/helix-calculator-setup-context";

export type HelixPanelActionRequest = {
  panel_id: string;
  action_id: string;
  args?: Record<string, unknown>;
};

export type HelixPanelActionExecutionResult = {
  ok: boolean;
  panel_id: string;
  action_id: string;
  artifact?: Record<string, unknown> | null;
  message?: string;
};

export type HelixPanelActionExecutionContext = {
  openPanel: (panelId: string, groupId?: string) => void;
  focusPanel: (panelId: string, groupId?: string) => void;
  closePanel: (panelId: string, groupId?: string) => void;
  openSettings: (tab?: SettingsTab) => void;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parensBalanced(value: string): boolean {
  let depth = 0;
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function stripCalculatorProseTail(value: string): string {
  return value
    .replace(/\s*,?\s*(?:then|and)\s+(?:explain|describe|interpret|summari[sz]e|tell|show|give|report)\b[\s\S]*$/i, "")
    .replace(/\s+(?:with|using|in)\s+(?:the\s+)?(?:scientific\s+)?calculator\b[\s\S]*$/i, "")
    .replace(/\s+(?:with\s+)?(?:steps?|show\s+work|trace)$/i, "")
    .trim();
}

function normalizeCalculatorActionLatex(value: string): string {
  const cleaned = stripCalculatorProseTail(value);
  const directiveTail = cleaned.match(/\b(?:solve|evaluate|compute|calculate|check|verify)\s+(.+)$/i)?.[1];
  const candidate = directiveTail ? stripCalculatorProseTail(directiveTail) : cleaned;
  const equation = candidate.match(/(?:[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?\s*\*\s*)?[A-Za-z_][A-Za-z0-9_]*(?:\s*\^\s*[-+]?\d+(?:\.\d+)?)?(?:\s*[+\-*/]\s*[-+()A-Za-z0-9_.*\/^\\\s]+)*\s*=\s*[-+()A-Za-z0-9_.*\/^\\\s]+/i)?.[0];
  if (equation) return equation.trim();
  if (candidate.includes("=")) return candidate;
  const arithmeticMatches = candidate.match(/[()+\-*/^\d.eE\s]+/g) ?? [];
  for (const match of arithmeticMatches) {
    const candidate = match.replace(/\s+/g, "").replace(/[.!?,"'`\]\)}]+$/g, "");
    if (!candidate || !/\d/.test(candidate) || !/[+\-*/^]/.test(candidate)) continue;
    if (!parensBalanced(candidate)) continue;
    if (/^[()+\-*/^\d.eE]+$/.test(candidate)) return candidate;
  }
  return candidate;
}

function isCalculatorActionExpression(value: string | null | undefined): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/\b(?:einstein\s+tensor|qi\s+guardrail|natario|warp\.?metric|adm|stress[-\s]?energy)\b/i.test(trimmed)) {
    return true;
  }
  if (/\\(?:frac|sqrt|lambda|sum|int)\b/i.test(trimmed)) return true;
  if (/[=+\-*/^]/.test(trimmed) && /[A-Za-z0-9]/.test(trimmed)) return true;
  return false;
}

function resolveCalculatorActionLatex(rawLatex: string | null, calculatorSetup: HelixCalculatorSetupContext | null): string | null {
  const setupExpression = calculatorSetup?.display_latex ?? calculatorSetup?.expression ?? null;
  const normalizedSetup = setupExpression ? normalizeCalculatorActionLatex(setupExpression) : null;
  const normalizedRaw = rawLatex ? normalizeCalculatorActionLatex(rawLatex) : null;
  if (isCalculatorActionExpression(normalizedSetup)) return normalizedSetup;
  if (isCalculatorActionExpression(normalizedRaw)) return normalizedRaw;
  return null;
}

function asCalculatorSetupContext(value: unknown): HelixCalculatorSetupContext | null {
  const record = asRecord(value);
  if (!record) return null;
  const expression = asNonEmptyString(record.expression);
  const displayLatex = asNonEmptyString(record.display_latex) ?? expression;
  const subgoal = asNonEmptyString(record.subgoal);
  if (!expression || !displayLatex || !subgoal) return null;
  return record as HelixCalculatorSetupContext;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "true" || trimmed === "yes" || trimmed === "y" || trimmed === "1") return true;
    if (trimmed === "false" || trimmed === "no" || trimmed === "n" || trimmed === "0") return false;
  }
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => asNonEmptyString(entry))
      .filter((entry): entry is string => Boolean(entry));
  }
  const single = asNonEmptyString(value);
  return single ? [single] : [];
}

function postSituationThreadBinding(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/thread-binding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postSituationGoalSession(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/goal-session/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postLiveAnswerEnvironment(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/live-answer-environment/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postLiveWorkstationPipeline(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/live-workstation-pipeline/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postLiveEnvironmentControl(path: string, body?: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }).catch(() => undefined);
}

function normalizeLiveCommentaryCadence(value: unknown): string {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  if (
    text === "off" ||
    text === "milestones_only" ||
    text === "anomalies_and_milestones" ||
    text === "windowed_companion" ||
    text === "active_dialogue" ||
    text === "continuous_debug"
  ) {
    return text;
  }
  if (text === "risk_and_progress" || text === "progress_and_risk") return "anomalies_and_milestones";
  if (text === "codex" || text === "codex_style" || text === "dialogue") return "active_dialogue";
  return "milestones_only";
}

function normalizeLiveCommentaryStatus(value: unknown, cadence: string): "active" | "paused" | "stopped" {
  const text = asNonEmptyString(value)?.toLowerCase();
  if (text === "active" || text === "paused" || text === "stopped") return text;
  return cadence === "off" ? "paused" : "active";
}

function normalizeLiveCommentaryVoiceMode(value: unknown): string | undefined {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  if (text === "text_only" || text === "voice_on_confirm" || text === "critical_voice" || text === "direct_address_only") {
    return text;
  }
  return undefined;
}

function postLiveCommentarySession(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/live-commentary/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postLiveCommentarySessionWhenEnvironmentReady(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  const explicitEnvironmentId = asNonEmptyString(body.environment_id);
  if (explicitEnvironmentId) {
    postLiveCommentarySession(body);
    return;
  }
  const threadId = asNonEmptyString(body.thread_id) ?? "helix-ask:desktop";
  const attempt = (remaining: number): void => {
    void fetch(`/api/agi/situation/live-answer-environment?thread_id=${encodeURIComponent(threadId)}&limit=1`)
      .then((response) => response.json())
      .then((payload: unknown) => {
        const record = asRecord(payload);
        const environment = asRecord(record?.environment);
        const environmentId = asNonEmptyString(environment?.environment_id);
        if (environmentId) {
          postLiveCommentarySession({ ...body, environment_id: environmentId });
          return;
        }
        if (remaining > 0) {
          globalThis.setTimeout(() => attempt(remaining - 1), 250);
        }
      })
      .catch(() => {
        if (remaining > 0) globalThis.setTimeout(() => attempt(remaining - 1), 250);
      });
  };
  attempt(12);
}

function postLiveAgenticReviewRequest(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/live-agentic-review/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postLiveAgenticReviewRequestWhenEnvironmentReady(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  const explicitEnvironmentId = asNonEmptyString(body.environment_id);
  if (explicitEnvironmentId) {
    postLiveAgenticReviewRequest(body);
    return;
  }
  const threadId = asNonEmptyString(body.thread_id) ?? "helix-ask:desktop";
  const attempt = (remaining: number): void => {
    void fetch(`/api/agi/situation/live-answer-environment?thread_id=${encodeURIComponent(threadId)}&limit=1`)
      .then((response) => response.json())
      .then((payload: unknown) => {
        const record = asRecord(payload);
        const environment = asRecord(record?.environment);
        const environmentId = asNonEmptyString(environment?.environment_id);
        if (environmentId) {
          postLiveAgenticReviewRequest({ ...body, environment_id: environmentId });
          return;
        }
        if (remaining > 0) globalThis.setTimeout(() => attempt(remaining - 1), 250);
      })
      .catch(() => {
        if (remaining > 0) globalThis.setTimeout(() => attempt(remaining - 1), 250);
      });
  };
  attempt(12);
}

function postCompanionPolicy(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/companion-policy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postSituationMissionMemoryRefresh(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/mission-memory/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function postInterjectionInvestigation(body: Record<string, unknown>): void {
  if (typeof fetch !== "function") return;
  void fetch("/api/agi/situation/interjection-investigator/review-latest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

function normalizeSituationJobKind(value: unknown): SituationRoomJobKind | null {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  if (!text) return null;
  if (text === "translation") return "translate";
  if (text === "summary") return "rolling_summary";
  if (text === "actions" || text === "todos" || text === "todo") return "action_items";
  if (
    text === "translate" ||
    text === "rolling_summary" ||
    text === "action_items" ||
    text === "prompt_composer"
  ) {
    return text;
  }
  return null;
}

function normalizeSituationInputTextPolicy(value: unknown): SituationRoomJobInputTextPolicy | undefined {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  return text === "transcript_text" || text === "source_text_preferred" || text === "source_text_only"
    ? text
    : undefined;
}

function normalizeSituationOutputRenderPolicy(value: unknown): SituationRoomJobOutputRenderPolicy | undefined {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  return text === "target_language" || text === "native_language" || text === "dual" ? text : undefined;
}

function normalizeSituationGraphNodeType(value: unknown): SituationGraphNodeType | null {
  const text = asNonEmptyString(value);
  const allowed = new Set<SituationGraphNodeType>([
    "source.audio.mic",
    "source.audio.display",
    "source.screen",
    "speaker.identity",
    "speaker.filter",
    "transcript.buffer",
    "language.detect",
    "translate",
    "helix.reason",
    "helix.interjection_gate",
    "output.voice",
    "output.panel",
    "output.note",
    "output.history",
  ]);
  return text && allowed.has(text as SituationGraphNodeType) ? (text as SituationGraphNodeType) : null;
}

function normalizeSituationGraphColumn(value: unknown): SituationGraphNodeColumn | undefined {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  return text === "sources" || text === "speakers" || text === "jobs" || text === "outputs" || text === "helix"
    ? text
    : undefined;
}

function normalizeSituationGraphStatus(value: unknown): SituationGraphNodeStatus | undefined {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  return text === "idle" || text === "active" || text === "running" || text === "blocked" || text === "complete" || text === "error"
    ? text
    : undefined;
}

function normalizeSituationGraphLane(value: unknown): SituationGraphLane | null {
  const text = asNonEmptyString(value)?.toLowerCase().replace(/[\s-]+/g, "_");
  return text === "audio" ||
    text === "speaker_identity" ||
    text === "transcript" ||
    text === "translation" ||
    text === "context" ||
    text === "command" ||
    text === "voice_output" ||
    text === "receipt" ||
    text === "monitor_signal"
    ? text
    : null;
}

function resolveSituationRoom(args: Record<string, unknown>, options?: { createIfMissing?: boolean }): SituationRoom | null {
  const situationState = useSituationRoomStore.getState();
  const explicitRoomId = asNonEmptyString(args.room_id ?? args.roomId);
  if (explicitRoomId && situationState.rooms[explicitRoomId]) return situationState.rooms[explicitRoomId];

  const title = asNonEmptyString(args.title ?? args.room_title ?? args.roomTitle ?? args.label);
  if (title) {
    const normalizedTitle = title.toLowerCase();
    const foundId = situationState.room_order.find((roomId) => {
      const room = situationState.rooms[roomId];
      return room?.title.trim().toLowerCase() === normalizedTitle;
    });
    if (foundId) return situationState.rooms[foundId] ?? null;
  }

  if (situationState.active_room_id && situationState.rooms[situationState.active_room_id]) {
    return situationState.rooms[situationState.active_room_id];
  }

  const firstRoomId = situationState.room_order[0];
  if (firstRoomId && situationState.rooms[firstRoomId]) return situationState.rooms[firstRoomId];

  return options?.createIfMissing
    ? useSituationRoomStore.getState().createRoom(title ?? "Situation Room")
    : null;
}

function resolveSituationSourceIds(room: SituationRoom, args: Record<string, unknown>): string[] {
  const situationState = useSituationRoomStore.getState();
  const requested = asStringArray(args.source_ids ?? args.sourceIds ?? args.source_id ?? args.sourceId);
  if (requested.length > 0) return requested.filter((sourceId) => Boolean(situationState.sources[sourceId]));
  return room.source_ids.filter((sourceId) => Boolean(situationState.sources[sourceId]));
}

function summarizeSituationRoom(room: SituationRoom): Record<string, unknown> {
  const state = useSituationRoomStore.getState();
  const sources = room.source_ids
    .map((sourceId) => state.sources[sourceId])
    .filter((source): source is SituationRoomSource => Boolean(source));
  return {
    room_id: room.room_id,
    title: room.title,
    status: room.status,
    source_count: sources.length,
    event_count: room.event_ids.length,
    transcript_count: selectSituationRoomEvents(state, room.room_id).filter(
      (event) => event.event_type === "voice_transcript",
    ).length,
    sources: sources.map((source) => ({
      source_id: source.source_id,
      label: source.label,
      status: source.status,
      capture_source: source.capture_source,
      chunk_index: source.chunk_index,
    })),
  };
}

function buildDeterministicNoteId(title: string, existingIds: string[]): string {
  const base = slugify(title) || "untitled-note";
  const stem = `note:${base}`;
  if (!existingIds.includes(stem)) return stem;
  let index = 2;
  while (existingIds.includes(`${stem}-${index}`)) index += 1;
  return `${stem}-${index}`;
}

function normalizeDocRoute(value: string): string {
  const normalized = value.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized) return "";
  return `/${normalized.startsWith("docs/") ? normalized : `docs/${normalized}`}`.replace(/\/{2,}/g, "/");
}

function tokenizeDocTopic(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !["the", "doc", "docs", "document", "paper", "latest", "newest", "recent"].includes(token));
}

function searchDocManifest(query: string, limit = 8) {
  const tokens = tokenizeDocTopic(query);
  if (tokens.length === 0) return [];
  return DOC_MANIFEST
    .map((entry) => {
      const searchText = entry.searchText.toLowerCase();
      const score = tokens.reduce((sum, token) => sum + (searchText.includes(token) ? 1 : 0), 0);
      return { entry, score: score + (/\blatest\b/i.test(entry.relativePath) ? 0.25 : 0) };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.route.localeCompare(b.entry.route))
    .slice(0, Math.max(1, Math.min(24, limit)));
}

function resolveNoteId(args: Record<string, unknown>, options?: { allowActiveFallback?: boolean }): string | null {
  const notesState = useWorkstationNotesStore.getState();
  const directId = asNonEmptyString(args.note_id ?? args.id);
  if (directId && notesState.notes[directId]) return directId;
  const targetTitle = asNonEmptyString(args.title ?? args.note_title ?? args.name);
  if (targetTitle) {
    const needle = targetTitle.trim().toLowerCase();
    const foundId = notesState.order.find((id) => {
      const note = notesState.notes[id];
      return note?.title?.trim().toLowerCase() === needle;
    });
    if (foundId) return foundId;
  }
  if (options?.allowActiveFallback && notesState.active_note_id && notesState.notes[notesState.active_note_id]) {
    return notesState.active_note_id;
  }
  return null;
}

function requireConfirmation(
  request: HelixPanelActionRequest,
  panelId: string,
  actionId: string,
  actionLabel: string,
): HelixPanelActionExecutionResult | null {
  const args = asRecord(request.args) ?? {};
  const confirmed = asBoolean(args.confirmed ?? args.confirm ?? args.approved);
  if (confirmed === true) return null;
  return {
    ok: false,
    panel_id: panelId,
    action_id: actionId,
    message: `${actionLabel} requires confirmation. Re-run with args.confirmed=true.`,
    artifact: {
      requires_confirmation: true,
      action_id: actionId,
    },
  };
}

function buildDocReasoningPrompt(args: {
  mode: "summarize_doc" | "summarize_section" | "explain_paper" | "locate_in_doc";
  path: string;
  anchor?: string;
  selectedText?: string;
  query?: string;
}): string {
  const pathLine = `Document path: ${args.path}`;
  const anchorLine = args.anchor ? `Section anchor: #${args.anchor}` : null;
  const selectionLine = args.selectedText ? `Selected text: "${args.selectedText}"` : null;
  const queryLine = args.query ? `Locate query: "${args.query}"` : null;
  const contextLines = [pathLine, anchorLine, selectionLine, queryLine].filter(Boolean).join("\n");

  if (args.mode === "summarize_section") {
    return `Summarize this section from the current docs viewer selection. Start with one sentence on what this section is for, then key points.\n${contextLines}`;
  }
  if (args.mode === "explain_paper") {
    return `Explain this paper from the current docs viewer context in plain language.\n${contextLines}`;
  }
  if (args.mode === "locate_in_doc") {
    return `Find where this topic is addressed in the current docs viewer context. Return a short "Locations:" list with anchors/sections and one-line evidence snippets.\n${contextLines}`;
  }
  return `Summarize this document from the current docs viewer context. Start with one sentence on what this document is for, then key findings and caveats.\n${contextLines}`;
}

function buildDocAnswerContract(mode: "summarize_doc" | "summarize_section" | "explain_paper" | "locate_in_doc"): HelixAskAnswerContract {
  const sharedSections = [
    { id: "purpose", heading: "Purpose", required: true, synonyms: ["What this document is for"] },
  ];
  if (mode === "summarize_section") {
    return {
      schema: "helix.ask.answer_contract.v1",
      source: "docs_viewer",
      mode,
      strict_sections: true,
      min_tokens: 900,
      sections: [
        ...sharedSections,
        { id: "key_points", heading: "Key Points", required: true, synonyms: ["Findings"] },
        { id: "caveats", heading: "Caveats", required: true, synonyms: ["Limits", "Limitations"] },
        { id: "next_checks", heading: "Next Checks", required: false, synonyms: ["Follow-ups"] },
      ],
    };
  }
  if (mode === "explain_paper") {
    return {
      schema: "helix.ask.answer_contract.v1",
      source: "docs_viewer",
      mode,
      strict_sections: true,
      min_tokens: 1000,
      sections: [
        ...sharedSections,
        { id: "core_mechanism", heading: "Core Mechanism", required: true, synonyms: ["How it works"] },
        { id: "evidence", heading: "Evidence", required: true, synonyms: ["Findings"] },
        { id: "caveats", heading: "Caveats", required: true, synonyms: ["Limits", "Limitations"] },
      ],
    };
  }
  if (mode === "locate_in_doc") {
    return {
      schema: "helix.ask.answer_contract.v1",
      source: "docs_viewer",
      mode,
      strict_sections: true,
      min_tokens: 500,
      sections: [
        ...sharedSections,
        { id: "locations", heading: "Locations", required: true, synonyms: ["Matches", "Where It Appears"] },
      ],
    };
  }
  return {
    schema: "helix.ask.answer_contract.v1",
    source: "docs_viewer",
    mode,
    strict_sections: true,
    min_tokens: 1100,
    sections: [
      ...sharedSections,
      { id: "findings", heading: "Findings", required: true, synonyms: ["Key Findings", "Key Points"] },
      { id: "caveats", heading: "Caveats", required: true, synonyms: ["Limits", "Limitations"] },
      { id: "next_checks", heading: "Next Checks", required: false, synonyms: ["Follow-ups"] },
    ],
  };
}

export function executeHelixPanelAction(
  request: HelixPanelActionRequest,
  context: HelixPanelActionExecutionContext,
): HelixPanelActionExecutionResult {
  const panelId = request.panel_id?.trim();
  const actionId = request.action_id?.trim().toLowerCase();
  if (!panelId || !actionId) {
    return {
      ok: false,
      panel_id: request.panel_id || "",
      action_id: request.action_id || "",
      message: "panel_id and action_id are required.",
    };
  }

  if (actionId === "open") {
    context.openPanel(panelId, undefined);
    context.focusPanel(panelId, undefined);
    return { ok: true, panel_id: panelId, action_id: actionId };
  }

  if (actionId === "focus") {
    context.focusPanel(panelId, undefined);
    return { ok: true, panel_id: panelId, action_id: actionId };
  }

  if (actionId === "close") {
    context.closePanel(panelId, undefined);
    return { ok: true, panel_id: panelId, action_id: actionId };
  }

  if (panelId === "workstation-process-graph") {
    const args = asRecord(request.args) ?? {};
    const graphStore = useWorkstationProcessGraphStore.getState();
    const maxNodes = asNumber(args.max_nodes ?? args.maxNodes) ?? undefined;
    const scope = asNonEmptyString(args.scope)?.toLowerCase();
    const includeTimeline = asBoolean(args.include_timeline ?? args.includeTimeline) ?? true;
    const includeArtifacts = asBoolean(args.include_artifacts ?? args.includeArtifacts) ?? true;

    if (actionId === "get_snapshot") {
      if (scope === "compact" || scope === "context_pack") {
        return {
          ok: true,
          panel_id: panelId,
          action_id: actionId,
          artifact: graphStore.getContextPack({
            maxActive: maxNodes,
            maxArtifacts: asNumber(args.max_artifacts ?? args.maxArtifacts) ?? undefined,
            maxTimeline: includeTimeline ? asNumber(args.max_timeline ?? args.maxTimeline) ?? undefined : 0,
          }) as unknown as Record<string, unknown>,
          message: "Returned compact workstation process graph context pack.",
        };
      }
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: graphStore.getSnapshotArtifact({ maxNodes, includeTimeline, includeArtifacts }) as unknown as Record<string, unknown>,
        message: "Returned workstation process graph snapshot.",
      };
    }

    if (actionId === "get_context_pack") {
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: graphStore.getContextPack({
          maxActive: maxNodes,
          maxArtifacts: asNumber(args.max_artifacts ?? args.maxArtifacts) ?? undefined,
          maxTimeline: includeTimeline ? asNumber(args.max_timeline ?? args.maxTimeline) ?? undefined : 0,
        }) as unknown as Record<string, unknown>,
        message: "Returned compact workstation process graph context pack.",
      };
    }

    if (actionId === "query_snapshot") {
      const query = asNonEmptyString(args.query ?? args.filter);
      if (!query) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "workstation-process-graph.query_snapshot requires query.",
        };
      }
      const snapshot = graphStore.getSnapshotArtifact({ maxNodes, includeTimeline, includeArtifacts });
      const needle = query.toLowerCase();
      const nodes = snapshot.nodes.filter((node) =>
        [node.id, node.kind, node.label, node.status, node.panelId, node.traceId, node.jobId]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle)),
      );
      const nodeIds = new Set(nodes.map((node) => node.id));
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          ...snapshot,
          query,
          nodes,
          edges: snapshot.edges.filter((edge) => nodeIds.has(edge.from) || nodeIds.has(edge.to)),
          timeline: snapshot.timeline.filter((entry) =>
            [entry.label, entry.traceId, ...(entry.nodeIds ?? [])]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(needle)),
          ),
        },
        message: `Returned process graph query snapshot for "${query}".`,
      };
    }

    if (actionId === "focus_node") {
      const nodeId = asNonEmptyString(args.node_id ?? args.nodeId);
      if (!nodeId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "workstation-process-graph.focus_node requires node_id.",
        };
      }
      graphStore.focusNode(nodeId);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: { kind: "workstation_process_graph_view_receipt", focused_node_id: nodeId },
        message: `Focused process graph node ${nodeId}.`,
      };
    }

    if (actionId === "filter_view") {
      const filter = asNonEmptyString(args.filter ?? args.query);
      graphStore.filterView(filter ?? undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: { kind: "workstation_process_graph_view_receipt", filter: filter ?? null },
        message: filter ? `Filtered process graph by "${filter}".` : "Cleared process graph filter.",
      };
    }

    if (actionId === "export_svg") {
      const mode = asNonEmptyString(args.mode) === "ambient" ? "ambient" : "panel";
      const graph = graphStore.graph;
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "workstation_process_graph_svg",
          schemaVersion: "helix.workstation.process_graph.svg/v1",
          sessionId: graph.sessionId,
          generatedAt: new Date().toISOString(),
          mode,
          svg: renderWorkstationProcessGraphSvg({
            graph,
            density: mode,
            labels: mode === "ambient" ? "minimal" : "full",
            maxNodes: maxNodes ?? (mode === "ambient" ? 18 : 160),
          }),
        },
        message: "Exported process graph SVG.",
      };
    }

    if (actionId === "clear_historical") {
      graphStore.clearHistorical();
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: { kind: "workstation_process_graph_view_receipt", cleared_historical: true },
        message: "Pruned historical process graph state.",
      };
    }
  }

  if (panelId === "docs-viewer" && (actionId === "open_doc" || actionId === "open_doc_by_path")) {
    const args = asRecord(request.args) ?? {};
    const path = asNonEmptyString(args.path ?? args.doc_path ?? args.target);
    const anchor = asNonEmptyString(args.anchor);
    if (!path) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.open_doc requires a path.",
      };
    }
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    const route = normalizeDocRoute(path);
    openDocPanel(anchor ? { path: route, anchor } : { path: route });
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { path: route, anchor: anchor ?? null },
      message: `Opened document: ${route}`,
    };
  }

  if (panelId === "docs-viewer" && actionId === "open_latest_doc_by_topic") {
    const args = asRecord(request.args) ?? {};
    const topic = asNonEmptyString(args.topic ?? args.query ?? args.target);
    const providedPath = asNonEmptyString(args.path ?? args.doc_path);
    if (!topic && !providedPath) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.open_latest_doc_by_topic requires a topic or resolved path.",
      };
    }
    const route =
      providedPath ? normalizeDocRoute(providedPath) : searchDocManifest(topic ?? "", 1)[0]?.entry.route ?? null;
    if (!route) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        artifact: { topic: topic ?? null, candidates: [] },
        message: `No local docs matched topic: ${topic ?? "unknown"}.`,
      };
    }
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    openDocPanel({ path: route });
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { topic: topic ?? null, path: route },
      message: topic ? `Opened latest ${topic} document: ${route}` : `Opened document: ${route}`,
    };
  }

  if (panelId === "docs-viewer" && actionId === "search_docs") {
    const args = asRecord(request.args) ?? {};
    const query = asNonEmptyString(args.query ?? args.topic ?? args.target);
    if (!query) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.search_docs requires query.",
      };
    }
    const limitRaw = typeof args.limit === "number" ? args.limit : 8;
    const matches = searchDocManifest(query, limitRaw).map(({ entry }) => ({
      path: entry.route,
      title: entry.title,
    }));
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { query, matches },
      message: matches.length
        ? `Found ${matches.length} doc(s): ${matches.map((entry) => entry.path).join(", ")}`
        : `No docs matched: ${query}`,
    };
  }

  if (panelId === "docs-viewer" && actionId === "open_doc_and_read") {
    const args = asRecord(request.args) ?? {};
    const path = asNonEmptyString(args.path ?? args.doc_path ?? args.target);
    const anchor = asNonEmptyString(args.anchor);
    if (!path) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.open_doc_and_read requires a path.",
      };
    }
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    openDocPanel(anchor ? { path, anchor, autoRead: true } : { path, autoRead: true });
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { path, anchor: anchor ?? null, autoRead: true },
    };
  }

  if (panelId === "docs-viewer" && actionId === "open_directory") {
    useDocViewerStore.getState().viewDirectory();
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { mode: "directory" },
    };
  }

  if (panelId === "docs-viewer" && (actionId === "identify_current_doc" || actionId === "verify_active_doc")) {
    const store = useDocViewerStore.getState();
    const path = asNonEmptyString(store.currentPath);
    const anchor = asNonEmptyString(store.anchor);
    const entry = findDocEntry(path);
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: {
        path: path ?? null,
        anchor: anchor ?? null,
        mode: store.mode,
        title: entry?.title ?? null,
        has_doc_context: Boolean(path),
      },
      message: path ? `Current document: ${path}` : "No active document in Docs Viewer.",
    };
  }

  if (
    panelId === "docs-viewer" &&
    (actionId === "summarize_doc" || actionId === "summarize_section" || actionId === "explain_paper" || actionId === "locate_in_doc")
  ) {
    const args = asRecord(request.args) ?? {};
    const store = useDocViewerStore.getState();
    const path =
      asNonEmptyString(args.path ?? args.doc_path ?? args.target) ??
      asNonEmptyString(store.currentPath);
    const anchor = asNonEmptyString(args.anchor) ?? asNonEmptyString(store.anchor);
    const selectedText = asNonEmptyString(args.selected_text ?? args.selection_text ?? args.selection);
    const query = asNonEmptyString(args.query ?? args.topic ?? args.find);
    if (!path) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "No active docs context to summarize/explain.",
      };
    }
    if (actionId === "locate_in_doc" && !query) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.locate_in_doc requires query.",
      };
    }
    const prompt = buildDocReasoningPrompt({
      mode: actionId,
      path,
      anchor: anchor ?? undefined,
      selectedText: selectedText ?? undefined,
      query: query ?? undefined,
    });
    launchHelixAskPrompt({
      question: prompt,
      autoSubmit: true,
      panelId: "docs-viewer",
      bypassWorkstationDispatch: true,
      forceReasoningDispatch: true,
      suppressWorkstationPayloadActions: true,
      answerContract: buildDocAnswerContract(actionId),
    });
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: {
        path,
        anchor: anchor ?? null,
        query: query ?? null,
        selected_text: selectedText ?? null,
        launched_prompt: true,
      },
      message:
        actionId === "summarize_section"
          ? "Summarizing current section in Helix Ask."
          : actionId === "explain_paper"
            ? "Explaining current paper in Helix Ask."
            : actionId === "locate_in_doc"
              ? "Locating topic in current document in Helix Ask."
            : "Summarizing current document in Helix Ask.",
    };
  }

  if (panelId === "agi-essence-console" && actionId === "open_settings") {
    const args = asRecord(request.args) ?? {};
    const tabRaw = asNonEmptyString(args.tab);
    const tab: SettingsTab = tabRaw === "knowledge" ? "knowledge" : "preferences";
    context.openSettings(tab);
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { tab },
    };
  }

  if (panelId === "workstation-notes") {
    const args = asRecord(request.args) ?? {};
    const notesState = useWorkstationNotesStore.getState();
    if (actionId === "create_note") {
      const title = asNonEmptyString(args.title ?? args.name) ?? "Untitled note";
      const topic = asNonEmptyString(args.topic) ?? title;
      const body = asNonEmptyString(args.body) ?? "";
      const explicitId = asNonEmptyString(args.note_id);
      const noteId =
        explicitId && !notesState.notes[explicitId]
          ? explicitId
          : buildDeterministicNoteId(title, Object.keys(notesState.notes));
      const note = notesState.upsertWorkflowNote({
        id: noteId,
        title,
        topic,
        body,
        citations: [],
        snippets: [],
      });
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: note.id,
          title: note.title,
          active_note_id: note.id,
          created: true,
        },
      };
    }

    if (actionId === "append_to_note") {
      const text = asNonEmptyString(args.text ?? args.content ?? args.append);
      if (!text) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "workstation-notes.append_to_note requires text.",
        };
      }
      let noteId = resolveNoteId(args, { allowActiveFallback: true });
      let created = false;
      if (!noteId) {
        const fallback = notesState.upsertWorkflowNote({
          id: buildDeterministicNoteId("Untitled note", Object.keys(notesState.notes)),
          title: "Untitled note",
          topic: "general",
          body: "",
          citations: [],
          snippets: [],
        });
        noteId = fallback.id;
        created = true;
      }
      const current = useWorkstationNotesStore.getState().notes[noteId];
      const nextBody = current?.body ? `${current.body.replace(/\s+$/g, "")}\n${text}` : text;
      notesState.updateNoteBody(noteId, nextBody);
      notesState.setActiveNote(noteId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      const updated = useWorkstationNotesStore.getState().notes[noteId];
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          title: updated?.title ?? null,
          appended_text: text,
          body_length: updated?.body.length ?? nextBody.length,
          created_note: created,
        },
      };
    }

    if (actionId === "create_live_note_sink" || actionId === "append_live_note_chunk") {
      const title = asNonEmptyString(args.title) ?? "Live source note";
      const topic = asNonEmptyString(args.topic) ?? "live-source";
      const noteId = asNonEmptyString(args.note_id) ?? buildDeterministicNoteId(title, Object.keys(notesState.notes));
      const chunk = asNonEmptyString(args.chunk_text ?? args.text) ?? "";
      const traceId = asNonEmptyString(args.trace_id) ?? `live-note:${noteId}:${Date.now()}`;
      const note = actionId === "append_live_note_chunk"
        ? notesState.appendLiveNoteChunk({
            note_id: noteId,
            title,
            topic,
            chunk_text: chunk,
            trace_id: traceId,
            citation: {
              id: `citation:${traceId}`,
              path: `live-pipeline://${traceId}`,
              heading: "Live pipeline transform",
              start_offset: 0,
              end_offset: chunk.length,
            },
            snippet: {
              id: `snippet:${traceId}`,
              citation_id: `citation:${traceId}`,
              excerpt: chunk.slice(0, 240),
            },
          })
        : notesState.upsertWorkflowNote({
            id: noteId,
            title,
            topic,
            body: "",
            citations: [],
            snippets: [],
            trace_id: traceId,
          });
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "live_output_sink_receipt",
          schema: "helix.live_output_sink_receipt.v1",
          sink_id: `sink:${note.id}`,
          pipeline_id: asNonEmptyString(args.pipeline_id) ?? "client_live_note_sink",
          target_id: note.id,
          ok: true,
          action: actionId === "append_live_note_chunk" ? "append" : "replace_section",
          written_chars: actionId === "append_live_note_chunk" ? chunk.length : 0,
          source_event_ids: [],
          evidence_refs: [`note:${note.id}`, `trace:${traceId}`],
          raw_transcript_included: false,
        },
        message: actionId === "append_live_note_chunk" ? `Appended live chunk to ${note.title}.` : `Created live note sink ${note.title}.`,
      };
    }

    if (actionId === "set_active_note") {
      const noteId = resolveNoteId(args);
      if (!noteId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "Note not found. Provide note_id or note title.",
        };
      }
      notesState.setActiveNote(noteId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      const note = useWorkstationNotesStore.getState().notes[noteId];
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          title: note?.title ?? null,
          active_note_id: noteId,
        },
      };
    }

    if (actionId === "rename_note") {
      const nextTitle = asNonEmptyString(args.title ?? args.new_title ?? args.to_title ?? args.name);
      if (!nextTitle) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "workstation-notes.rename_note requires title.",
        };
      }
      const lookupArgs: Record<string, unknown> = {
        ...args,
        title: args.from_title ?? args.note_title ?? args.note_name ?? args.title ?? args.name,
      };
      const noteId = resolveNoteId(lookupArgs, { allowActiveFallback: true });
      if (!noteId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "Note not found. Provide note_id or existing note title.",
        };
      }
      notesState.renameNote(noteId, nextTitle);
      notesState.setActiveNote(noteId);
      const renamed = useWorkstationNotesStore.getState().notes[noteId];
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          title: renamed?.title ?? nextTitle,
        },
      };
    }

    if (actionId === "delete_note") {
      const confirmationResult = requireConfirmation(
        request,
        panelId,
        actionId,
        "workstation-notes.delete_note",
      );
      if (confirmationResult) return confirmationResult;
      const noteId = resolveNoteId(args, { allowActiveFallback: true });
      if (!noteId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "Note not found. Provide note_id or note title.",
        };
      }
      const previous = useWorkstationNotesStore.getState().notes[noteId];
      notesState.deleteNote(noteId);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          deleted_note_id: noteId,
          deleted_title: previous?.title ?? null,
          active_note_id: useWorkstationNotesStore.getState().active_note_id ?? null,
        },
      };
    }

    if (actionId === "list_notes") {
      const snapshot = useWorkstationNotesStore.getState();
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          active_note_id: snapshot.active_note_id ?? null,
          count: snapshot.order.length,
          notes: snapshot.order
            .map((id) => snapshot.notes[id])
            .filter(Boolean)
            .map((note) => ({
              note_id: note.id,
              title: note.title,
              topic: note.topic,
              updated_at: note.updated_at,
            })),
        },
      };
    }
  }

  const situationSourceActionIds = new Set([
    "attach_display_audio_source",
    "attach_mic_audio_source",
    "save_room_as_note",
    "attach_room_to_helix_ask",
    "stop_room",
  ]);

  if (panelId === "situation-room-sources" || (panelId === "situation-room-pipelines" && situationSourceActionIds.has(actionId))) {
    const args = asRecord(request.args) ?? {};
    const situationState = useSituationRoomStore.getState();
    const unifiedPanelId = "situation-room-pipelines";

    if (actionId === "attach_display_audio_source") {
      const room = resolveSituationRoom(args, { createIfMissing: true });
      if (!room) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No situation room is available for the display audio source.",
        };
      }
      context.openPanel(unifiedPanelId, undefined);
      context.focusPanel(unifiedPanelId, undefined);
      const label = asNonEmptyString(args.label ?? args.source_label ?? args.sourceLabel) ?? undefined;
      void useSituationRoomStore.getState().attachDisplayAudioSource(room.room_id, label);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          ...summarizeSituationRoom(room),
          capture_picker_requested: true,
          label: label ?? null,
        },
        message: `Opening display picker for ${room.title}.`,
      };
    }

    if (actionId === "attach_mic_audio_source") {
      const room = resolveSituationRoom(args, { createIfMissing: true });
      if (!room) {
        return {
          ok: false,
          panel_id: unifiedPanelId,
          action_id: actionId,
          message: "No situation room is available for the microphone source.",
        };
      }
      context.openPanel(unifiedPanelId, undefined);
      context.focusPanel(unifiedPanelId, undefined);
      const label = asNonEmptyString(args.label ?? args.source_label ?? args.sourceLabel) ?? undefined;
      void useSituationRoomStore.getState().attachMicAudioSource(room.room_id, label);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          ...summarizeSituationRoom(room),
          mic_permission_requested: true,
          label: label ?? null,
          capture_source: "mic",
        },
        message: `Requesting microphone permission for ${room.title}.`,
      };
    }

    if (actionId === "save_room_as_note") {
      const room = resolveSituationRoom(args);
      if (!room) {
        return {
          ok: false,
          panel_id: unifiedPanelId,
          action_id: actionId,
          message: "No situation room is available to save.",
        };
      }
      const note = situationState.saveRoomAsNote(room.room_id);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: Boolean(note),
        panel_id: unifiedPanelId,
        action_id: actionId,
        artifact: {
          ...summarizeSituationRoom(useSituationRoomStore.getState().rooms[room.room_id] ?? room),
          note_id: note?.id ?? null,
          note_title: note?.title ?? null,
        },
        message: note ? `Saved situation room "${room.title}" as a note.` : "Situation room save failed.",
      };
    }

    if (actionId === "attach_room_to_helix_ask") {
      const room = resolveSituationRoom(args);
      if (!room) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No situation room is available to attach.",
        };
      }
      const sourceId = asNonEmptyString(args.source_id ?? args.sourceId);
      situationState.attachRoomToHelixAsk(room.room_id, sourceId ?? undefined);
      return {
        ok: true,
        panel_id: unifiedPanelId,
        action_id: actionId,
        artifact: {
          ...summarizeSituationRoom(room),
          attached_source_id: sourceId ?? null,
        },
        message: `Attached situation room "${room.title}" to Helix Ask.`,
      };
    }

    if (actionId === "stop_room") {
      const room = resolveSituationRoom(args);
      if (!room) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No situation room is available to stop.",
        };
      }
      situationState.stopRoom(room.room_id);
      return {
        ok: true,
        panel_id: unifiedPanelId,
        action_id: actionId,
        artifact: summarizeSituationRoom(useSituationRoomStore.getState().rooms[room.room_id] ?? room),
        message: `Stopped active sources for "${room.title}".`,
      };
    }
  }

  if (panelId === "situation-room-pipelines") {
    const args = asRecord(request.args) ?? {};
    const jobState = useSituationRoomJobStore.getState();

    if (actionId === "setup_from_prompt") {
      const setupArgs = normalizeSituationRoomSetupActionArgs(args);
      const receipt = setupSituationRoomFromPrompt(setupArgs);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      if (receipt.setup_status === "needs_capture_permission") {
        context.openPanel("situation-room-pipelines", undefined);
        context.focusPanel("situation-room-pipelines", undefined);
      }
      return {
        ok: receipt.ok,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "situation_room_setup_execution_receipt",
          ...receipt,
        } as unknown as Record<string, unknown>,
        message: receipt.message,
      };
    }

    if (actionId === "create_job") {
      const room = resolveSituationRoom(args);
      const kind = normalizeSituationJobKind(args.kind ?? args.job_kind ?? args.jobKind ?? args.type);
      if (!room || !kind) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: !room
            ? "No situation room is available for a source job."
            : "situation-room-pipelines.create_job requires kind.",
          artifact: {
            missing: [!room ? "room_id" : "", !kind ? "kind" : ""].filter(Boolean),
          },
        };
      }
      const sourceIds = resolveSituationSourceIds(room, args);
      const attachmentPolicy = asNonEmptyString(args.attachment_policy ?? args.attachmentPolicy) ?? "manual_only";
      const contextInjection =
        asNonEmptyString(args.context_injection ?? args.contextInjection) ?? "explicit_attachment_only";
      const job = jobState.createJob({
        room_id: room.room_id,
        kind,
        source_ids: sourceIds,
        title: asNonEmptyString(args.title ?? args.job_title ?? args.jobTitle) ?? undefined,
        target_language: asNonEmptyString(args.target_language ?? args.targetLanguage ?? args.language) ?? undefined,
        native_language: asNonEmptyString(args.native_language ?? args.nativeLanguage) ?? undefined,
        input_text_policy: normalizeSituationInputTextPolicy(args.input_text_policy ?? args.inputTextPolicy),
        output_render_policy: normalizeSituationOutputRenderPolicy(args.output_render_policy ?? args.outputRenderPolicy),
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          job_id: job.job_id,
          room_id: job.room_id,
          kind: job.kind,
          source_ids: job.source_ids,
          target_language: job.target_language ?? null,
          native_language: job.native_language ?? null,
          input_text_policy: job.input_text_policy,
          output_render_policy: job.output_render_policy,
          attachment_policy: attachmentPolicy,
          context_injection: contextInjection,
          derived_outputs_auto_attach: false,
          command_lane_enabled: false,
        },
        message: `Created ${job.kind} job for "${room.title}".`,
      };
    }

    if (actionId === "run_job") {
      const jobId = asNonEmptyString(args.job_id ?? args.jobId);
      if (!jobId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.run_job requires job_id.",
        };
      }
      const outputs = jobState.processJobNow(jobId);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: Boolean(jobState.jobs[jobId]),
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          job_id: jobId,
          output_count: outputs.length,
          output_ids: outputs.map((output) => output.output_id),
        },
        message: jobState.jobs[jobId] ? `Processed job ${jobId}.` : `Unknown situation room job: ${jobId}`,
      };
    }

    if (actionId === "attach_job_to_helix_ask") {
      const jobId = asNonEmptyString(args.job_id ?? args.jobId);
      if (!jobId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.attach_job_to_helix_ask requires job_id.",
        };
      }
      jobState.attachJobToHelixAsk(jobId);
      return {
        ok: Boolean(useSituationRoomJobStore.getState().jobs[jobId]),
        panel_id: panelId,
        action_id: actionId,
        artifact: { job_id: jobId },
        message: `Attached job ${jobId} to Helix Ask.`,
      };
    }

    if (actionId === "save_job_as_note") {
      const jobId = asNonEmptyString(args.job_id ?? args.jobId);
      if (!jobId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.save_job_as_note requires job_id.",
        };
      }
      const note = jobState.saveJobAsNote(jobId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: Boolean(note),
        panel_id: panelId,
        action_id: actionId,
        artifact: { job_id: jobId, note_id: note?.id ?? null, note_title: note?.title ?? null },
        message: note ? `Saved job ${jobId} as a note.` : `No output available to save for job ${jobId}.`,
      };
    }

    if (actionId === "stop_job") {
      const jobId = asNonEmptyString(args.job_id ?? args.jobId);
      if (!jobId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.stop_job requires job_id.",
        };
      }
      jobState.stopJob(jobId);
      return {
        ok: Boolean(useSituationRoomJobStore.getState().jobs[jobId]),
        panel_id: panelId,
        action_id: actionId,
        artifact: { job_id: jobId, status: useSituationRoomJobStore.getState().jobs[jobId]?.status ?? null },
        message: `Stopped job ${jobId}.`,
      };
    }

    const graphState = useSituationRoomGraphStore.getState();

    if (actionId === "create_graph_from_recipe") {
      const recipeId = asNonEmptyString(args.recipe_id ?? args.recipeId);
      const bindings = asRecord(args.bindings) ?? {};
      if (!recipeId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.create_graph_from_recipe requires recipe_id.",
          artifact: { missing: ["recipe_id"] },
        };
      }
      const room = resolveSituationRoom({ ...args, ...bindings });
      const sourceIds =
        asStringArray(args.source_ids ?? args.sourceIds).length > 0
          ? asStringArray(args.source_ids ?? args.sourceIds)
          : asStringArray(bindings.source_ids ?? bindings.sourceIds);
      const receipt = graphState.createGraphFromRecipe({
        recipe_id: recipeId,
        room_id: asNonEmptyString(args.room_id ?? args.roomId) ?? room?.room_id ?? undefined,
        source_ids: sourceIds.length > 0 ? sourceIds : undefined,
        bindings,
        title: asNonEmptyString(args.title ?? args.graph_title ?? args.graphTitle) ?? undefined,
      });
      if (receipt.ok) {
        context.openPanel(panelId, undefined);
        context.focusPanel(panelId, undefined);
      }
      return {
        ok: receipt.ok,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "situation_room_graph_execution_receipt",
          ...receipt,
        },
        message: receipt.ok
          ? `Created ${receipt.recipe_id ?? recipeId} graph ${receipt.graph_id}.`
          : `Could not create ${recipeId}: missing ${receipt.missing_bindings.join(", ") || "recipe"}.`,
      };
    }

    if (actionId === "create_graph") {
      const room = resolveSituationRoom(args);
      if (!room) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No situation room is available for a graph.",
          artifact: { missing: ["room_id"] },
        };
      }
      const graph = graphState.createGraph({
        room_id: room.room_id,
        title: asNonEmptyString(args.title ?? args.graph_title ?? args.graphTitle) ?? `${room.title} graph`,
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          graph_id: graph.graph_id,
          room_id: graph.room_id,
          title: graph.title,
          node_count: graph.nodes.length,
          edge_count: graph.edges.length,
          attachment_policy: "manual_only",
          context_injection: "explicit_attachment_only",
        },
        message: `Created graph "${graph.title}" for "${room.title}".`,
      };
    }

    if (actionId === "add_node") {
      const graphId = asNonEmptyString(args.graph_id ?? args.graphId);
      const type = normalizeSituationGraphNodeType(args.type ?? args.node_type ?? args.nodeType);
      const title = asNonEmptyString(args.title ?? args.label);
      if (!graphId || !type || !title) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.add_node requires graph_id, type, and title.",
          artifact: {
            missing: [!graphId ? "graph_id" : "", !type ? "type" : "", !title ? "title" : ""].filter(Boolean),
          },
        };
      }
      const node = graphState.addNode({
        graph_id: graphId,
        type,
        title,
        column: normalizeSituationGraphColumn(args.column),
        status: normalizeSituationGraphStatus(args.status),
        source_id: asNonEmptyString(args.source_id ?? args.sourceId) ?? undefined,
        speaker_id: asNonEmptyString(args.speaker_id ?? args.speakerId) ?? undefined,
        job_id: asNonEmptyString(args.job_id ?? args.jobId) ?? undefined,
      });
      return {
        ok: Boolean(node),
        panel_id: panelId,
        action_id: actionId,
        artifact: { graph_id: graphId, node_id: node?.node_id ?? null },
        message: node ? `Added ${type} node to graph ${graphId}.` : `Unknown situation room graph: ${graphId}`,
      };
    }

    if (actionId === "connect_nodes") {
      const graphId = asNonEmptyString(args.graph_id ?? args.graphId);
      const fromNodeId = asNonEmptyString(args.from_node_id ?? args.fromNodeId);
      const toNodeId = asNonEmptyString(args.to_node_id ?? args.toNodeId);
      const lane = normalizeSituationGraphLane(args.lane);
      if (!graphId || !fromNodeId || !toNodeId || !lane) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.connect_nodes requires graph_id, from_node_id, to_node_id, and lane.",
          artifact: {
            missing: [
              !graphId ? "graph_id" : "",
              !fromNodeId ? "from_node_id" : "",
              !toNodeId ? "to_node_id" : "",
              !lane ? "lane" : "",
            ].filter(Boolean),
          },
        };
      }
      const edge = graphState.connectNodes({
        graph_id: graphId,
        from_node_id: fromNodeId,
        from_port: asNonEmptyString(args.from_port ?? args.fromPort) ?? undefined,
        to_node_id: toNodeId,
        to_port: asNonEmptyString(args.to_port ?? args.toPort) ?? undefined,
        lane,
      });
      return {
        ok: Boolean(edge),
        panel_id: panelId,
        action_id: actionId,
        artifact: { graph_id: graphId, edge_id: edge?.edge_id ?? null },
        message: edge ? `Connected graph lane ${lane}.` : `Could not connect nodes in graph ${graphId}.`,
      };
    }

    if (actionId === "create_translation_pair") {
      const room = resolveSituationRoom(args);
      const speakerAId = asNonEmptyString(args.speaker_a_id ?? args.speakerAId);
      const speakerBId = asNonEmptyString(args.speaker_b_id ?? args.speakerBId);
      const speakerALanguage = asNonEmptyString(args.speaker_a_native_language ?? args.speakerANativeLanguage);
      const speakerBLanguage = asNonEmptyString(args.speaker_b_native_language ?? args.speakerBNativeLanguage);
      if (!room || !speakerAId || !speakerBId || !speakerALanguage || !speakerBLanguage) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message:
            "situation-room-pipelines.create_translation_pair requires a room and two speaker ids/native languages.",
          artifact: {
            missing: [
              !room ? "room_id" : "",
              !speakerAId ? "speaker_a_id" : "",
              !speakerBId ? "speaker_b_id" : "",
              !speakerALanguage ? "speaker_a_native_language" : "",
              !speakerBLanguage ? "speaker_b_native_language" : "",
            ].filter(Boolean),
          },
        };
      }
      const renderPolicy =
        normalizeSituationOutputRenderPolicy(args.render_policy ?? args.renderPolicy) ?? "dual";
      const rawVoiceOutput = asNonEmptyString(args.voice_output ?? args.voiceOutput);
      const voiceOutput: TranslationPairNodeConfig["voice_output"] =
        rawVoiceOutput === "on_confirm" || rawVoiceOutput === "auto_when_direct_addressed"
          ? rawVoiceOutput
          : "off";
      const result = graphState.createTranslationPair({
        graph_id: asNonEmptyString(args.graph_id ?? args.graphId) ?? undefined,
        room_id: room.room_id,
        speaker_a_id: speakerAId,
        speaker_b_id: speakerBId,
        speaker_a_native_language: speakerALanguage,
        speaker_b_native_language: speakerBLanguage,
        source_ids: resolveSituationSourceIds(room, args),
        render_policy: renderPolicy,
        voice_output: voiceOutput,
        title: asNonEmptyString(args.title ?? args.label) ?? undefined,
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: Boolean(result),
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          graph_id: result?.graph.graph_id ?? null,
          node_id: result?.node.node_id ?? null,
          job_ids: result?.job_ids ?? [],
          attachment_policy: "manual_only",
          context_injection: "explicit_attachment_only",
          command_lane_enabled: false,
        },
        message: result
          ? `Created two-way translation graph for ${speakerAId} and ${speakerBId}.`
          : "Could not create translation pair.",
      };
    }

    if (actionId === "attach_graph_to_helix_ask") {
      const graphId = asNonEmptyString(args.graph_id ?? args.graphId);
      if (!graphId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "situation-room-pipelines.attach_graph_to_helix_ask requires graph_id.",
        };
      }
      graphState.attachGraphToHelixAsk(graphId);
      const graph = useSituationRoomGraphStore.getState().graphs[graphId];
      return {
        ok: Boolean(graph),
        panel_id: panelId,
        action_id: actionId,
        artifact: { graph_id: graphId, node_count: graph?.nodes.length ?? 0, edge_count: graph?.edges.length ?? 0 },
        message: graph ? `Attached graph ${graphId} to Helix Ask.` : `Unknown situation room graph: ${graphId}`,
      };
    }

    if (actionId === "attach_standby_to_helix_thread") {
      const room = resolveSituationRoom(args);
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId);
      if (!room || !threadId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          artifact: {
            kind: "situation_thread_binding_receipt",
            ok: false,
            missing: [!room ? "room_id" : "", !threadId ? "thread_id" : ""].filter(Boolean),
          },
          message: !room
            ? "No situation room is available to bind to Helix Ask."
            : "situation-room-pipelines.attach_standby_to_helix_thread requires thread_id.",
        };
      }
      const sourceIds = resolveSituationSourceIds(room, args);
      const bindingRequest = {
        room_id: room.room_id,
        source_id: asNonEmptyString(args.source_id ?? args.sourceId) ?? sourceIds[0] ?? null,
        graph_id: asNonEmptyString(args.graph_id ?? args.graphId) ?? null,
        world_id: asNonEmptyString(args.world_id ?? args.worldId) ?? "minecraft:minehut",
        thread_id: threadId,
        turn_id: asNonEmptyString(args.turn_id ?? args.turnId) ?? null,
        session_id: asNonEmptyString(args.session_id ?? args.sessionId) ?? null,
        trace_id: asNonEmptyString(args.trace_id ?? args.traceId) ?? null,
        mode: "standby_receipts",
        append_policy:
          asNonEmptyString(args.append_policy ?? args.appendPolicy) === "all_receipts_debug"
            ? "all_receipts_debug"
            : "salient_only",
      };
      postSituationThreadBinding(bindingRequest);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "situation_thread_binding_receipt",
          ok: true,
          binding_request: bindingRequest,
          context_policy: "explicit_attachment_only",
          command_lane_enabled: false,
        },
        message: `Submitted standby receipt binding for ${room.title}.`,
      };
    }

    if (actionId === "start_situation_goal_session") {
      const room = resolveSituationRoom(args);
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const roomId = asNonEmptyString(args.room_id ?? args.roomId) ?? room?.room_id ?? "room:minecraft-minehut";
      const sourceIdsFromRoom = room ? resolveSituationSourceIds(room, args) : [];
      const worldEventSourceMissing =
        args.world_event_source_status === "configured_missing" ||
        args.no_world_event_source === true ||
        args.source_id === null ||
        args.sourceId === null;
      const sourceId =
        worldEventSourceMissing
          ? null
          : asNonEmptyString(args.source_id ?? args.sourceId) ?? sourceIdsFromRoom[0] ?? "source:minecraft-server";
      const sourceIds = Array.from(
        new Set([
          ...asStringArray(args.source_ids ?? args.sourceIds),
          ...(sourceId ? [sourceId] : []),
        ].filter(Boolean)),
      );
      const worldId = worldEventSourceMissing ? null : asNonEmptyString(args.world_id ?? args.worldId) ?? "minecraft:minehut";
      const existingGraphId = asNonEmptyString(args.graph_id ?? args.graphId) ?? graphState.active_graph_id_by_room[roomId];
      const graphReceipt = existingGraphId
        ? null
        : graphState.createGraphFromRecipe({
            recipe_id: "minecraft_world_monitor",
            room_id: roomId,
            source_ids: sourceIds,
            bindings: {
              room_id: roomId,
              source_ids: sourceIds,
              standby_mode: "high_salience",
              world_id: worldId,
            },
            title: "Minecraft world monitor",
          });
      const graphId = existingGraphId ?? (graphReceipt?.ok ? graphReceipt.graph_id : null);
      if (graphId) {
        graphState.attachGraphToHelixAsk(graphId);
      }
      const appendPolicy =
        asNonEmptyString(args.append_policy ?? args.appendPolicy) === "episodes_and_salience"
          ? "episodes_and_salience"
          : asNonEmptyString(args.append_policy ?? args.appendPolicy) === "callouts_only"
            ? "callouts_only"
            : "salient_only";
      const standbyMode =
        asNonEmptyString(args.standby_mode ?? args.standbyMode) === "voice_on_confirm"
          ? "voice_on_confirm"
          : asNonEmptyString(args.standby_mode ?? args.standbyMode) === "critical_voice"
            ? "critical_voice"
            : asNonEmptyString(args.standby_mode ?? args.standbyMode) === "direct_address_only"
              ? "direct_address_only"
              : asNonEmptyString(args.standby_mode ?? args.standbyMode) === "off"
                ? "off"
                : "text_only";
      const bindingRequest = {
        room_id: roomId,
        source_id: sourceId,
        graph_id: graphId,
        world_id: worldId,
        thread_id: threadId,
        turn_id: asNonEmptyString(args.turn_id ?? args.turnId) ?? null,
        session_id: asNonEmptyString(args.session_id ?? args.sessionId) ?? null,
        trace_id: asNonEmptyString(args.trace_id ?? args.traceId) ?? null,
        mode: "standby_receipts",
        append_policy: "salient_only",
      };
      const sessionRequest = {
        thread_id: threadId,
        room_id: roomId,
        source_ids: sourceIds,
        graph_id: graphId,
        world_id: worldId,
        objective:
          asNonEmptyString(args.objective) ??
          "Monitor my Minecraft session and surface danger or meaningful progress.",
        standby_mode: standbyMode,
        append_policy: appendPolicy,
      };
      postSituationThreadBinding(bindingRequest);
      postSituationGoalSession(sessionRequest);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "situation_goal_session_receipt",
          ok: true,
          session_request: sessionRequest,
          binding_request: bindingRequest,
          graph_receipt: graphReceipt,
          context_policy: "explicit_attachment_only",
          command_lane_enabled: false,
        },
        message: worldEventSourceMissing
          ? "Started a visible situation goal session without a world-event source."
          : `Started a visible situation goal session for ${worldId}.`,
      };
    }

    if (actionId === "create_live_answer_environment") {
      const room = resolveSituationRoom(args);
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const objective =
        asNonEmptyString(args.objective) ??
        "Create a live answer environment for this source.";
      const roomId = asNonEmptyString(args.room_id ?? args.roomId) ?? room?.room_id ?? undefined;
      const worldEventSourceMissing =
        args.world_event_source_status === "configured_missing" ||
        args.no_world_event_source === true ||
        args.source_id === null ||
        args.sourceId === null;
      const sourceIds = Array.from(
        new Set([
          ...asStringArray(args.source_ids ?? args.sourceIds),
          ...(worldEventSourceMissing ? [] : asStringArray(args.source_id ?? args.sourceId)),
          ...(worldEventSourceMissing || !room ? [] : resolveSituationSourceIds(room, args)),
        ].filter(Boolean)),
      );
      const request = {
        thread_id: threadId,
        objective,
        room_id: roomId,
        source_ids: sourceIds,
        graph_id: asNonEmptyString(args.graph_id ?? args.graphId) ?? undefined,
        preset: asNonEmptyString(args.preset) ?? "custom",
        line_schema: Array.isArray(args.line_schema) ? args.line_schema : undefined,
        mode: asNonEmptyString(args.mode) ?? "text_only",
        source_config:
          args.source_config && typeof args.source_config === "object"
            ? args.source_config as Record<string, unknown>
            : undefined,
      };
      postLiveAnswerEnvironment(request);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "live_answer_environment_receipt",
          ok: true,
          request,
          context_policy: "compact_context_pack_only",
          deterministic_content_role: "observation_not_assistant_answer",
          command_lane_enabled: false,
        },
        message: `Created a live answer environment for ${objective}.`,
      };
    }

    if (actionId === "set_live_commentary_policy") {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const cadence = normalizeLiveCommentaryCadence(args.cadence ?? args.commentary_cadence ?? args.commentaryCadence);
      const status = normalizeLiveCommentaryStatus(args.status, cadence);
      const voiceMode = normalizeLiveCommentaryVoiceMode(args.voice_mode ?? args.voiceMode);
      const environmentId = asNonEmptyString(args.environment_id ?? args.environmentId);
      const request = {
        thread_id: threadId,
        environment_id: environmentId ?? undefined,
        cadence,
        status,
        ...(voiceMode ? { voice_mode: voiceMode } : {}),
      };
      postLiveCommentarySessionWhenEnvironmentReady(request);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "live_commentary_session_receipt",
          ok: true,
          request,
          pending_environment_resolution: !environmentId,
          context_policy: "compact_context_pack_only",
          raw_logs_included: false,
          deterministic_content_role: "observation_not_assistant_answer",
        },
        message: environmentId
          ? `Set live commentary cadence to ${cadence}.`
          : `Queued live commentary setup for the active ${threadId} environment.`,
      };
    }

    if (actionId === "request_agentic_review") {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const environmentId = asNonEmptyString(args.environment_id ?? args.environmentId);
      const question =
        asNonEmptyString(args.question) ??
        "Review the latest compact live environment state.";
      const trigger = asNonEmptyString(args.trigger) ?? "manual_button";
      const request = {
        thread_id: threadId,
        environment_id: environmentId ?? undefined,
        question,
        trigger,
      };
      postLiveAgenticReviewRequestWhenEnvironmentReady(request);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "live_agentic_review_receipt",
          ok: true,
          request,
          pending_environment_resolution: !environmentId,
          context_policy: "compact_context_pack_only",
          raw_logs_included: false,
          deterministic_content_role: "observation_not_assistant_answer",
        },
        message: environmentId
          ? "Requested an agentic review for the live environment."
          : `Queued an agentic review request for the active ${threadId} environment.`,
      };
    }

    if (actionId === "set_companion_policy") {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const companionMode = asNonEmptyString(args.companion_mode ?? args.companionMode) ?? "active_companion";
      const commentaryMode = asNonEmptyString(args.commentary_mode ?? args.commentaryMode) ?? "anomalies_and_milestones";
      const request = {
        thread_id: threadId,
        voice_input_active: asBoolean(args.voice_input_active ?? args.voiceInputActive) ?? true,
        voice_output_enabled: asBoolean(args.voice_output_enabled ?? args.voiceOutputEnabled) ?? false,
        companion_mode: companionMode,
        commentary_mode: commentaryMode,
        direct_address_names: asStringArray(args.direct_address_names ?? args.directAddressNames).length
          ? asStringArray(args.direct_address_names ?? args.directAddressNames)
          : ["helix", "dottie"],
      };
      postCompanionPolicy(request);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "companion_policy_receipt",
          ok: true,
          request,
          context_policy: "compact_context_pack_only",
          raw_audio_included: false,
          raw_transcript_included: false,
          deterministic_content_role: "observation_not_assistant_answer",
        },
        message: `Set companion mode to ${companionMode}.`,
      };
    }

    if (actionId === "create_live_workstation_pipeline") {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const objective =
        asNonEmptyString(args.objective) ??
        "Create a live workstation pipeline.";
      const request = {
        thread_id: threadId,
        objective,
        source_ids: Array.from(new Set([
          ...asStringArray(args.source_ids ?? args.sourceIds),
          ...asStringArray(args.source_id ?? args.sourceId),
        ])),
        environment_id: asNonEmptyString(args.environment_id ?? args.environmentId) ?? undefined,
        mode: asNonEmptyString(args.mode) ?? "text_only",
        line_schema: Array.isArray(args.line_schema) ? args.line_schema : undefined,
      };
      postLiveWorkstationPipeline(request);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "live_workstation_pipeline_receipt",
          ok: true,
          request,
          context_policy: "compact_context_pack_only",
          raw_logs_included: false,
          raw_transcript_included: false,
          deterministic_content_role: "observation_not_assistant_answer",
        },
        message: `Created a live workstation pipeline for ${objective}.`,
      };
    }

    if (
      actionId === "pause_live_workstation_pipeline" ||
      actionId === "resume_live_workstation_pipeline" ||
      actionId === "stop_live_workstation_pipeline" ||
      actionId === "set_pipeline_transform" ||
      actionId === "set_pipeline_sink" ||
      actionId === "attach_pipeline_to_live_answer_environment"
    ) {
      const pipelineId = asNonEmptyString(args.pipeline_id ?? args.pipelineId);
      if (!pipelineId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: `${actionId} requires pipeline_id.`,
        };
      }
      const actionPath =
        actionId === "pause_live_workstation_pipeline"
          ? "pause"
          : actionId === "resume_live_workstation_pipeline"
            ? "resume"
            : actionId === "stop_live_workstation_pipeline"
              ? "stop"
              : null;
      if (actionPath) {
        postLiveEnvironmentControl(`/api/agi/situation/live-workstation-pipeline/${encodeURIComponent(pipelineId)}/${actionPath}`);
      }
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "live_workstation_pipeline_receipt",
          ok: true,
          pipeline_id: pipelineId,
          request: args,
          raw_logs_included: false,
          raw_transcript_included: false,
          context_policy: "compact_context_pack_only",
        },
        message: `Queued ${actionId.replace(/_/g, " ")} for ${pipelineId}.`,
      };
    }

    if (
      actionId === "pause_live_answer_environment" ||
      actionId === "resume_live_answer_environment" ||
      actionId === "stop_live_answer_environment" ||
      actionId === "set_live_line_schema" ||
      actionId === "set_live_answer_line_schema" ||
      actionId === "attach_live_source"
    ) {
      const environmentId = asNonEmptyString(args.environment_id ?? args.environmentId);
      if (!environmentId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: `${actionId} requires environment_id.`,
        };
      }
      if (actionId === "pause_live_answer_environment") {
        postLiveEnvironmentControl(`/api/agi/situation/live-answer-environment/${encodeURIComponent(environmentId)}/pause`);
      } else if (actionId === "resume_live_answer_environment") {
        postLiveEnvironmentControl(`/api/agi/situation/live-answer-environment/${encodeURIComponent(environmentId)}/resume`);
      } else if (actionId === "stop_live_answer_environment") {
        postLiveEnvironmentControl(`/api/agi/situation/live-answer-environment/${encodeURIComponent(environmentId)}/stop`);
      } else if (actionId === "set_live_line_schema" || actionId === "set_live_answer_line_schema") {
        postLiveEnvironmentControl(`/api/agi/situation/live-answer-environment/${encodeURIComponent(environmentId)}/line-schema`, {
          line_schema: Array.isArray(args.line_schema) ? args.line_schema : [],
        });
      } else {
        const sourceId = asNonEmptyString(args.source_id ?? args.sourceId);
        postLiveEnvironmentControl("/api/agi/situation/live-source/event", {
          source_id: sourceId ?? "source:manual-feed",
          environment_id: environmentId,
          thread_id: asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop",
          kind: asNonEmptyString(args.kind) ?? asNonEmptyString(args.source_family) ?? "manual_feed",
          panel_id: asNonEmptyString(args.panel_id) ?? panelId,
          event_type: "source_attached",
          payload: {
            attached: true,
            source_id: sourceId ?? "source:manual-feed",
          },
          evidence_refs: [`live_answer_environment:${environmentId}:source_attached`],
        });
      }
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: actionId === "attach_live_source" ? "workstation_live_source_receipt" : "live_answer_environment_receipt",
          ok: true,
          environment_id: environmentId,
          request: args,
          deterministic: true,
          model_invoked: false,
          context_role: "observation_not_assistant_answer",
        },
        message: `Queued ${actionId.replace(/_/g, " ")} for ${environmentId}.`,
      };
    }

    if (
      actionId === "live-source.set_rate" ||
      actionId === "pause_live_source" ||
      actionId === "resume_live_source" ||
      actionId === "stop_live_source" ||
      actionId === "set_live_source_tick_rate"
    ) {
      const sourceId = asNonEmptyString(args.source_id ?? args.sourceId);
      if (!sourceId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: `${actionId} requires source_id.`,
        };
      }
      if (actionId === "live-source.set_rate") {
        const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
        const cadenceMs = typeof args.cadence_ms === "number" ? args.cadence_ms : 15_000;
        const captureMode = asNonEmptyString(args.capture_mode ?? args.captureMode) ?? "interval";
        postLiveEnvironmentControl("/api/agi/situation/live-source/producer/set-cadence", {
          source_id: sourceId,
          producer_id: asNonEmptyString(args.producer_id ?? args.producerId) ?? undefined,
          thread_id: threadId,
          environment_id: asNonEmptyString(args.environment_id ?? args.environmentId) ?? undefined,
          pipeline_id: asNonEmptyString(args.pipeline_id ?? args.pipelineId) ?? undefined,
          modality: asNonEmptyString(args.modality) ?? "visual_frame",
          capture_mode: captureMode,
          cadence_ms: cadenceMs,
          client_stream_confirmed: args.client_stream_confirmed === true,
        });
        return {
          ok: true,
          panel_id: panelId,
          action_id: actionId,
          artifact: {
            kind: "visual_producer_cadence_receipt",
            schema: "helix.visual_producer_cadence_receipt.v1",
            ok: true,
            action_id: "situation-room.live-source.set_rate",
            source_id: sourceId,
            producer_id: asNonEmptyString(args.producer_id ?? args.producerId) ?? null,
            thread_id: threadId,
            cadence_ms: cadenceMs,
            capture_mode: captureMode,
            raw_content_included: false,
            assistant_answer: false,
            context_policy: "compact_context_pack_only",
          },
          message: `Queued visual source cadence ${Math.round(cadenceMs / 1000)}s for ${sourceId}.`,
        };
      }
      const actionPath =
        actionId === "pause_live_source"
          ? "pause"
          : actionId === "resume_live_source"
            ? "resume"
            : actionId === "stop_live_source"
              ? "stop"
              : "tick-rate";
      postLiveEnvironmentControl(`/api/agi/situation/live-source/${encodeURIComponent(sourceId)}/${actionPath}`, {
        tick_rate_ms: typeof args.tick_rate_ms === "number" ? args.tick_rate_ms : undefined,
      });
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "workstation_live_source_receipt",
          ok: true,
          source_id: sourceId,
          action_id: actionId,
          thread_id: asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop",
          raw_logs_included: false,
          context_policy: "compact_context_pack_only",
        },
        message: `Queued ${actionId.replace(/_/g, " ")} for ${sourceId}.`,
      };
    }

    if (actionId === "mission_memory.refresh") {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const body = {
        thread_id: threadId,
        room_id: asNonEmptyString(args.room_id ?? args.roomId) ?? null,
        session_id: asNonEmptyString(args.session_id ?? args.sessionId) ?? null,
      };
      postSituationMissionMemoryRefresh(body);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "mission_memory_update",
          ok: true,
          request: body,
          deterministic: true,
          model_invoked: false,
          context_policy: "compact_context_only",
        },
        message: "Requested a compact mission memory refresh.",
      };
    }

    if (actionId === "interjection_investigator.review_latest") {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      const body = {
        thread_id: threadId,
        trigger: asNonEmptyString(args.trigger) ?? "manual_review",
        room_id: asNonEmptyString(args.room_id ?? args.roomId) ?? null,
        session_id: asNonEmptyString(args.session_id ?? args.sessionId) ?? null,
      };
      postInterjectionInvestigation(body);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "interjection_decision",
          ok: true,
          request: body,
          deterministic_gate: true,
          model_invoked: false,
          allowed_outputs: ["silent_keep_in_context", "show_text", "voice_on_confirm", "request_user_input"],
        },
        message: "Requested deterministic interjection review for the latest mission state.",
      };
    }

    if (
      actionId === "episode_timeline.summarize_window" ||
      actionId === "situation_context.attach_to_ask" ||
      actionId.startsWith("goal_ledger.") ||
      actionId === "callout_policy.set_mode" ||
      actionId === "voice_delivery.confirm_speak"
    ) {
      const threadId = asNonEmptyString(args.thread_id ?? args.threadId) ?? "helix-ask:desktop";
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind:
            actionId === "episode_timeline.summarize_window"
              ? "situation_episode_summary"
              : actionId === "situation_context.attach_to_ask"
                ? "situation_context_pack"
                : actionId.startsWith("goal_ledger.")
                  ? "situation_goal_ledger_receipt"
                  : actionId === "callout_policy.set_mode"
                    ? "standby_callout_policy_receipt"
                    : "standby_callout_delivery_receipt",
          ok: true,
          thread_id: threadId,
          request: args,
          command_lane_enabled: false,
          minecraft_actions_enabled: false,
        },
        message: `Recorded ${actionId} as a bounded Situation Room tool request.`,
      };
    }
  }

  if (panelId === "workstation-clipboard-history") {
    const args = asRecord(request.args) ?? {};
    const clipboardState = useWorkstationClipboardStore.getState();
    if (actionId === "read_clipboard") {
      const latest = clipboardState.receipts[0] ?? null;
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        void navigator.clipboard
          .readText()
          .then((text) => {
            recordClipboardReceipt({
              direction: "read",
              text,
              source: "workstation-clipboard-history.read_clipboard",
            });
          })
          .catch(() => undefined);
      }
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          text: latest?.text ?? "",
          receipt_id: latest?.id ?? null,
          source: latest ? "history" : "empty",
        },
      };
    }

    if (actionId === "write_clipboard") {
      const text = asNonEmptyString(args.text ?? args.content ?? args.value);
      if (!text) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "workstation-clipboard-history.write_clipboard requires text.",
        };
      }
      const source = asNonEmptyString(args.source) ?? "workstation-clipboard-history.write_clipboard";
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(text).catch(() => undefined);
      }
      recordClipboardReceipt({
        direction: "write",
        text,
        source,
      });
      const latest = useWorkstationClipboardStore.getState().receipts[0] ?? null;
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          text,
          receipt_id: latest?.id ?? null,
          direction: "write",
        },
      };
    }

    if (actionId === "clear_history") {
      const confirmationResult = requireConfirmation(
        request,
        panelId,
        actionId,
        "workstation-clipboard-history.clear_history",
      );
      if (confirmationResult) return confirmationResult;
      const cleared = clipboardState.receipts.length;
      clipboardState.clearReceipts();
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          cleared_count: cleared,
          remaining_count: 0,
        },
      };
    }

    if (actionId === "copy_receipt_to_clipboard") {
      const requestedReceiptId = asNonEmptyString(args.receipt_id);
      const receipt =
        (requestedReceiptId
          ? clipboardState.receipts.find((entry) => entry.id === requestedReceiptId)
          : clipboardState.receipts[0]) ?? null;
      if (!receipt) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No clipboard receipt available to copy.",
        };
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(receipt.text).catch(() => undefined);
      }
      recordClipboardReceipt({
        direction: "write",
        text: receipt.text,
        source: "workstation-clipboard-history.copy_receipt_to_clipboard",
        meta: { from_receipt_id: receipt.id },
      });
      const latest = useWorkstationClipboardStore.getState().receipts[0] ?? null;
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          from_receipt_id: receipt.id,
          to_receipt_id: latest?.id ?? null,
          text: receipt.text,
        },
      };
    }

    if (actionId === "copy_receipt_to_note") {
      const requestedReceiptId = asNonEmptyString(args.receipt_id);
      const receipt =
        (requestedReceiptId
          ? clipboardState.receipts.find((entry) => entry.id === requestedReceiptId)
          : clipboardState.receipts[0]) ?? null;
      if (!receipt) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No clipboard receipt available to append to a note.",
        };
      }
      const noteLookup: Record<string, unknown> = {
        note_id: args.note_id,
        title: args.note_title ?? args.title,
      };
      let noteId = resolveNoteId(noteLookup, { allowActiveFallback: true });
      if (!noteId) {
        const notesSnapshot = useWorkstationNotesStore.getState();
        const created = notesSnapshot.upsertWorkflowNote({
          id: buildDeterministicNoteId("Untitled note", Object.keys(notesSnapshot.notes)),
          title: "Untitled note",
          topic: "clipboard",
          body: "",
          citations: [],
          snippets: [],
        });
        noteId = created.id;
      }
      const notesState = useWorkstationNotesStore.getState();
      const current = notesState.notes[noteId];
      const nextBody = current?.body
        ? `${current.body.replace(/\s+$/g, "")}\n${receipt.text}`
        : receipt.text;
      notesState.updateNoteBody(noteId, nextBody);
      notesState.setActiveNote(noteId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          from_receipt_id: receipt.id,
          appended_text: receipt.text,
          body_length: useWorkstationNotesStore.getState().notes[noteId]?.body.length ?? nextBody.length,
        },
      };
    }

    if (actionId === "copy_selection_to_note") {
      const selectionText =
        typeof window !== "undefined" && typeof window.getSelection === "function"
          ? window.getSelection()?.toString().trim() ?? ""
          : "";
      const fallbackReceipt = clipboardState.receipts[0] ?? null;
      const text = selectionText || fallbackReceipt?.text || "";
      if (!text.trim()) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No selected text or clipboard receipt available to copy into note.",
        };
      }
      if (selectionText) {
        recordClipboardReceipt({
          direction: "copy",
          text: selectionText,
          source: "workstation-clipboard-history.copy_selection_to_note",
        });
      }
      const noteLookup: Record<string, unknown> = {
        note_id: args.note_id,
        title: args.note_title ?? args.title,
      };
      let noteId = resolveNoteId(noteLookup, { allowActiveFallback: true });
      if (!noteId) {
        const notesSnapshot = useWorkstationNotesStore.getState();
        const created = notesSnapshot.upsertWorkflowNote({
          id: buildDeterministicNoteId("Untitled note", Object.keys(notesSnapshot.notes)),
          title: "Untitled note",
          topic: "selection",
          body: "",
          citations: [],
          snippets: [],
        });
        noteId = created.id;
      }
      const notesState = useWorkstationNotesStore.getState();
      const current = notesState.notes[noteId];
      const nextBody = current?.body ? `${current.body.replace(/\s+$/g, "")}\n${text}` : text;
      notesState.updateNoteBody(noteId, nextBody);
      notesState.setActiveNote(noteId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          appended_text: text,
          source: selectionText ? "selection" : "clipboard_receipt",
          body_length: useWorkstationNotesStore.getState().notes[noteId]?.body.length ?? nextBody.length,
        },
      };
    }
  }

  if (panelId === "scientific-calculator") {
    const args = asRecord(request.args) ?? {};
    const scientificState = useScientificCalculatorStore.getState();
    const calculatorSetup = asCalculatorSetupContext(args.calculator_setup ?? args.setup_context ?? args.setup);
    const compoundRunId = asNonEmptyString(args.compound_run_id ?? args.run_id ?? args.turn_id);
    const compoundSubgoalId = asNonEmptyString(args.compound_subgoal_id ?? args.subgoal_id);

    if (actionId === "ingest_latex") {
      const rawLatex = asNonEmptyString(args.latex ?? args.expression ?? args.text);
      let latex = rawLatex === "$clipboard" ? rawLatex : resolveCalculatorActionLatex(rawLatex, calculatorSetup);
      if (rawLatex === "$clipboard" && typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        // Non-blocking clipboard fallback for deterministic action calls.
        void navigator.clipboard.readText().then((clipboardText) => {
          const trimmed = clipboardText.trim();
          if (!trimmed) return;
          scientificState.ingestLatex(trimmed, {
            sourcePath: "clipboard",
            anchor: null,
            source: "clipboard",
            calculatorSetup,
          });
          dispatchScientificCalculatorMathPicked({
            latex: trimmed,
            sourcePath: "clipboard",
          });
        });
      }
      if (!latex || latex === "$clipboard") {
        return {
          ok: rawLatex === "$clipboard",
          panel_id: panelId,
          action_id: actionId,
          message:
            rawLatex === "$clipboard"
              ? "Attempting clipboard ingest for scientific-calculator."
              : "scientific-calculator.ingest_latex requires a calculator expression, not prose.",
        };
      }
      const sourcePath = asNonEmptyString(args.source_path ?? args.path ?? args.source);
      const anchor = asNonEmptyString(args.anchor);
      const entry = scientificState.ingestLatex(latex, {
        sourcePath,
        anchor,
        source: "workstation_action",
        calculatorSetup,
        compoundRunId,
        compoundSubgoalId,
      });
      dispatchScientificCalculatorMathPicked({
        latex: entry.latex,
        sourcePath: entry.sourcePath,
        anchor: entry.anchor,
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      const latestDebugEvents = useScientificCalculatorStore.getState().debugEvents;
      const ingestDebugEvent =
        latestDebugEvents.find((event) => event.action_id === "ingest_latex" && event.source === "workstation_action") ??
        latestDebugEvents[0] ??
        null;
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          latex: entry.latex,
          source_path: entry.sourcePath,
          anchor: entry.anchor,
          calculator_setup: entry.calculatorSetup ?? null,
          history_id: entry.id,
          debug_event: ingestDebugEvent,
          debug_log_tail: buildScientificCalculatorDebugSnapshot(latestDebugEvents, 8),
        },
      };
    }

    if (actionId === "solve_expression" || actionId === "solve_with_steps") {
      const rawLatexArg = asNonEmptyString(args.latex ?? args.expression ?? args.text);
      const latexArg = resolveCalculatorActionLatex(rawLatexArg, calculatorSetup);
      if (rawLatexArg && !latexArg) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "scientific-calculator.solve_expression requires a calculator expression, not prose.",
        };
      }
      const latex = latexArg ?? scientificState.currentLatex;
      if (!latex.trim()) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No calculator input available to solve.",
        };
      }
      if (latexArg) {
        scientificState.ingestLatex(latexArg, {
          sourcePath: asNonEmptyString(args.source_path ?? args.path ?? args.source),
          anchor: asNonEmptyString(args.anchor),
          source: "workstation_action",
          calculatorSetup,
          compoundRunId,
          compoundSubgoalId,
        });
      }
      const solveResult = runScientificSolve(latex, actionId === "solve_with_steps");
      scientificState.setSolveResult(solveResult, {
        actionId: actionId === "solve_with_steps" ? "solve_with_steps" : "solve_expression",
        source: "workstation_action",
        calculatorSetup,
        compoundRunId,
        compoundSubgoalId,
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      const latestCalculatorState = useScientificCalculatorStore.getState();
      return {
        ok: solveResult.ok,
        panel_id: panelId,
        action_id: actionId,
        message: solveResult.ok ? undefined : solveResult.error ?? "Solve failed.",
        artifact: {
          mode: solveResult.mode,
          normalized_expression: solveResult.normalized_expression,
          result_text: solveResult.result_text,
          result_latex: solveResult.result_latex ?? "",
          calculator_setup: calculatorSetup,
          result_unit: calculatorSetup?.result_unit ?? null,
          result_quantity: calculatorSetup?.result_quantity ?? calculatorSetup?.quantity ?? null,
          result_dimension: calculatorSetup?.result_dimension ?? null,
          result_dimension_signature: calculatorSetup?.result_dimension_signature ?? null,
          unit_system: calculatorSetup?.unit_system ?? null,
          input_units: calculatorSetup?.input_units ?? null,
          unit_options: calculatorSetup?.unit_options ?? [],
          assumptions: calculatorSetup?.assumptions ?? [],
          variable: solveResult.variable,
          steps_count: solveResult.steps.length,
          steps: solveResult.steps,
          artifact_v1: solveResult.artifact_v1 ?? null,
          result_kind: solveResult.artifact_v1?.result.kind ?? null,
          confidence: solveResult.artifact_v1?.quality.confidence ?? null,
          fallback_reason: solveResult.artifact_v1?.quality.fallbackReason ?? null,
          trace: solveResult.trace,
          route: solveResult.trace.route,
          engine: solveResult.trace.engine,
          sourceOfTruth: solveResult.trace.sourceOfTruth,
          capabilityClass: solveResult.trace.capabilityClass,
          warnings: solveResult.trace.warnings,
          error: solveResult.error ?? null,
          debug_event: latestCalculatorState.debugEvents[0] ?? null,
          debug_log_tail: buildScientificCalculatorDebugSnapshot(latestCalculatorState.debugEvents, 8),
        },
      };
    }

    if (actionId === "copy_result") {
      const resultText = scientificState.lastSolve?.result_text?.trim();
      if (!resultText) {
        const debugEvent = scientificState.recordDebugEvent({
          action_id: "copy_result",
          source: "workstation_action",
          ok: false,
          message: "No calculator result available to copy.",
        });
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No calculator result available to copy.",
          artifact: {
            debug_event: debugEvent,
            debug_log_tail: buildScientificCalculatorDebugSnapshot(useScientificCalculatorStore.getState().debugEvents, 8),
          },
        };
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(resultText).catch(() => undefined);
      }
      const debugEvent = scientificState.recordDebugEvent({
        action_id: "copy_result",
        source: "workstation_action",
        ok: true,
        input_latex: scientificState.lastSolve?.input_latex,
        result_text: resultText,
        normalized_expression: scientificState.lastSolve?.normalized_expression,
        trace_id: scientificState.lastSolve?.trace.traceId ?? null,
        route: scientificState.lastSolve?.trace.route ?? null,
        engine: scientificState.lastSolve?.trace.engine ?? null,
        message: "result_copied",
      });
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          copied: true,
          text: resultText,
          trace: scientificState.lastSolve?.trace ?? null,
          debug_event: debugEvent,
          debug_log_tail: buildScientificCalculatorDebugSnapshot(useScientificCalculatorStore.getState().debugEvents, 8),
        },
      };
    }

    if (actionId === "copy_debug_log") {
      const beforeCopy = useScientificCalculatorStore.getState().debugEvents;
      const debugText = formatScientificCalculatorDebugLog(beforeCopy);
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(debugText).catch(() => undefined);
      }
      const debugEvent = scientificState.recordDebugEvent({
        action_id: "copy_debug_log",
        source: "workstation_action",
        ok: true,
        message: "debug_log_copied",
      });
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          copied: true,
          text: debugText,
          debug_event: debugEvent,
          debug_log_tail: buildScientificCalculatorDebugSnapshot(useScientificCalculatorStore.getState().debugEvents, 8),
        },
      };
    }

    if (actionId === "clear_workspace") {
      scientificState.clear({ source: "workstation_action" });
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          cleared: true,
          debug_event: useScientificCalculatorStore.getState().debugEvents[0] ?? null,
          debug_log_tail: buildScientificCalculatorDebugSnapshot(useScientificCalculatorStore.getState().debugEvents, 8),
        },
      };
    }

    if (
      actionId === "start_equation_live_source" ||
      actionId === "start_prime_stream" ||
      actionId === "restart_live_source" ||
      actionId === "stop_live_source" ||
      actionId === "emit_live_tick"
    ) {
      const liveSource = useScientificCalculatorLiveSourceStore.getState();
      const requestedEquation = asNonEmptyString(args.equation ?? args.latex ?? args.expression ?? args.text);
      const calculatorSetup = asCalculatorSetupContext(args.calculator_setup ?? args.setup_context ?? args.setup);
      const requestedEquationContext =
        asNonEmptyString(args.equation_context ?? args.equationContext ?? args.context) ??
        calculatorSetup?.subgoal ??
        null;
      const streamInput = {
        environmentId: asNonEmptyString(args.environment_id ?? args.environmentId),
        sourceId: asNonEmptyString(args.source_id ?? args.sourceId),
        tickRateMs: typeof args.tick_rate_ms === "number" ? args.tick_rate_ms : undefined,
        maxTicks: typeof args.max_ticks === "number" ? args.max_ticks : undefined,
        start: typeof args.start === "number" ? args.start : undefined,
      };
      if (actionId === "start_equation_live_source") {
        void liveSource.startEquationLiveSource({
          ...streamInput,
          equation: requestedEquation ? normalizeCalculatorActionLatex(requestedEquation) : undefined,
          equationContext: requestedEquationContext,
          calculatorSetup,
          mode: "current_equation",
        });
      } else if (actionId === "start_prime_stream") {
        void liveSource.startPrimeStream(streamInput);
      } else if (actionId === "restart_live_source") {
        void liveSource.restartPrimeStream();
      } else if (actionId === "stop_live_source") {
        liveSource.stopPrimeStream();
      } else {
        void liveSource.emitNextTick();
      }
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      const latestLiveSource = useScientificCalculatorLiveSourceStore.getState();
      const latestPayload =
        latestLiveSource.latestTick?.payload && typeof latestLiveSource.latestTick.payload === "object"
          ? latestLiveSource.latestTick.payload as Record<string, unknown>
          : null;
      return {
        ok: latestLiveSource.status !== "error",
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          kind: "workstation_live_source_receipt",
          mode: actionId === "start_equation_live_source" ? "current_equation" : latestLiveSource.mode,
          source_id: latestLiveSource.sourceId || streamInput.sourceId || null,
          environment_id: latestLiveSource.environmentId || streamInput.environmentId || null,
          status: latestLiveSource.status,
          seq: latestLiveSource.mode === "current_equation" ? latestLiveSource.equationState.seq : latestLiveSource.state.seq,
          requested_equation: requestedEquation ? normalizeCalculatorActionLatex(requestedEquation) : null,
          source_equation: latestLiveSource.sourceEquation || (requestedEquation ? normalizeCalculatorActionLatex(requestedEquation) : null),
          equation_context: latestLiveSource.equationContext || requestedEquationContext || null,
          latest_result_text: typeof latestPayload?.result_text === "string" ? latestPayload.result_text : null,
          latest_tick: latestLiveSource.latestTick,
          live_workbench_expression: latestLiveSource.liveWorkbenchExpression,
          live_solve_steps: latestLiveSource.liveSolveSteps,
          active_live_step_id: latestLiveSource.activeLiveStepId,
          calculator_setup: latestLiveSource.calculatorSetup ?? calculatorSetup ?? null,
          result_unit: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.result_unit ?? null,
          result_quantity: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.result_quantity ?? (latestLiveSource.calculatorSetup ?? calculatorSetup)?.quantity ?? null,
          result_dimension: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.result_dimension ?? null,
          result_dimension_signature: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.result_dimension_signature ?? null,
          unit_system: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.unit_system ?? null,
          input_units: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.input_units ?? null,
          unit_options: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.unit_options ?? [],
          assumptions: (latestLiveSource.calculatorSetup ?? calculatorSetup)?.assumptions ?? [],
          evidence_refs: latestLiveSource.latestTick
            ? [`calculator:live:${latestLiveSource.latestTick.trace.calculator_trace_id}`]
            : requestedEquation
              ? [`calculator:requested:${normalizeCalculatorActionLatex(requestedEquation)}`]
              : [],
          deterministic: true,
          model_invoked: false,
          context_role: "observation_not_assistant_answer",
          debug_log_tail: latestLiveSource.debugLog.slice(0, 12),
        },
      };
    }
  }

  if (!getPanelDef(panelId)) {
    return {
      ok: false,
      panel_id: panelId,
      action_id: actionId,
      message: `Unknown panel: ${panelId}`,
    };
  }

  return {
    ok: false,
    panel_id: panelId,
    action_id: actionId,
    message: `Action not supported for panel: ${panelId}.${actionId}`,
  };
}
