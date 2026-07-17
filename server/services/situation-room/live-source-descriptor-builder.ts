import crypto from "node:crypto";
import {
  HELIX_LIVE_SOURCE_DESCRIPTOR_SCHEMA,
  type HelixLiveSourceDescriptor,
  type HelixLiveSourceDescriptorModality,
  type HelixLiveSourceDescriptorState,
  type HelixLiveSourceOrigin,
  type HelixLiveSourceSurface,
} from "@shared/helix-live-source-descriptor";

const descriptorsById = new Map<string, HelixLiveSourceDescriptor>();
const latestDescriptorBySource = new Map<string, string>();

const stableJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex").slice(0, size);

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const normalizeModality = (value: unknown): HelixLiveSourceDescriptorModality => {
  if (
    value === "world_event" ||
    value === "environment_state" ||
    value === "environment_affordance" ||
    value === "audio_transcript" ||
    value === "text_chat" ||
    value === "calculator_stream" ||
    value === "simulation_stream" ||
    value === "document_context" ||
    value === "note_context" ||
    value === "procedure_graph" ||
    value === "process_graph"
  ) return value;
  return "visual_frame";
};

const normalizeOrigin = (value: unknown): HelixLiveSourceOrigin => {
  if (
    value === "browser_getUserMedia" ||
    value === "manual_upload" ||
    value === "discord_bridge" ||
    value === "minehut_plugin" ||
    value === "workstation_panel" ||
    value === "api"
  ) return value;
  return "browser_getDisplayMedia";
};

const normalizeState = (value: unknown): HelixLiveSourceDescriptorState => {
  if (
    value === "active_interval" ||
    value === "permission_required" ||
    value === "stale" ||
    value === "paused" ||
    value === "stopped" ||
    value === "error"
  ) return value;
  return "active";
};

const normalizeSurface = (value: unknown): HelixLiveSourceSurface | null => {
  if (
    value === "screen" ||
    value === "window" ||
    value === "browser_tab" ||
    value === "camera" ||
    value === "document" ||
    value === "game" ||
    value === "app" ||
    value === "terminal" ||
    value === "file_manager" ||
    value === "calculator" ||
    value === "simulation" ||
    value === "unknown"
  ) return value;
  return null;
};

export function inferLiveSourceSurface(input: {
  modality?: unknown;
  sourceOrigin?: unknown;
  sourceId?: unknown;
  appHint?: unknown;
  windowTitleHint?: unknown;
  userLabel?: unknown;
  surface?: unknown;
}): HelixLiveSourceSurface {
  const explicit = normalizeSurface(input.surface);
  if (explicit && explicit !== "unknown") return explicit;
  const origin = normalizeOrigin(input.sourceOrigin);
  const text = lower([
    input.sourceId,
    input.appHint,
    input.windowTitleHint,
    input.userLabel,
  ].filter(Boolean).join("\n"));
  const modality = normalizeModality(input.modality);
  if (origin === "minehut_plugin") return "game";
  if (origin === "browser_getUserMedia") return "camera";
  if (modality === "calculator_stream") return "calculator";
  if (modality === "simulation_stream") return "simulation";
  if (modality === "environment_state" || modality === "environment_affordance" || modality === "procedure_graph") return "app";
  if (modality === "document_context" || /\b(?:pdf|docx?|document|paper|page)\b/.test(text)) return "document";
  if (modality === "process_graph") return "app";
  if (/\b(?:file explorer|windows explorer|finder|folder|directory|downloads|documents|desktop|\.wav|\.asd|\.png|\.jpg)\b/.test(text)) {
    return "file_manager";
  }
  if (/\b(?:browser|chrome|edge|firefox|safari|tab|web page|localhost)\b/.test(text)) return "browser_tab";
  if (/\b(?:terminal|powershell|cmd|shell|console)\b/.test(text)) return "terminal";
  if (/\b(?:minecraft|minehut|game|java edition|hotbar|inventory)\b/.test(text)) return "game";
  if (explicit) return explicit;
  if (origin === "browser_getDisplayMedia") return "screen";
  return "unknown";
}

export function upsertLiveSourceDescriptor(input: Record<string, unknown>): HelixLiveSourceDescriptor {
  const sourceId = normalizeString(input.source_id) ?? normalizeString(input.sourceId) ?? `source:unknown:${hashShort(input, 12)}`;
  const threadId = normalizeString(input.thread_id) ?? normalizeString(input.threadId) ?? "helix-ask:desktop";
  const serving = input.serving_context && typeof input.serving_context === "object"
    ? input.serving_context as Record<string, unknown>
    : {};
  const modality = normalizeModality(input.modality);
  const sourceOrigin = normalizeOrigin(serving.source_origin ?? input.source_origin);
  const appHint = normalizeString(serving.app_hint) ?? normalizeString(input.app_hint);
  const windowTitleHint = normalizeString(serving.window_title_hint) ?? normalizeString(input.window_title_hint);
  const userLabel = normalizeString(input.user_label) ?? normalizeString(input.label);
  const surface = inferLiveSourceSurface({
    modality,
    sourceOrigin,
    sourceId,
    appHint,
    windowTitleHint,
    userLabel,
    surface: serving.surface ?? input.surface,
  });
  const priorId = latestDescriptorBySource.get(sourceId);
  const prior = priorId ? descriptorsById.get(priorId) ?? null : null;
  const descriptorId = prior?.descriptor_id ?? `live_source_descriptor:${hashShort([threadId, sourceId])}`;
  const latestObservationRefs = Array.isArray(input.latest_observation_refs)
    ? input.latest_observation_refs.map((entry) => normalizeString(entry)).filter((entry): entry is string => Boolean(entry))
    : prior?.latest_observation_refs ?? [];
  const capabilities = Array.isArray(input.capabilities)
    ? input.capabilities.map((entry) => normalizeString(entry)).filter((entry): entry is string => Boolean(entry))
    : prior?.capabilities ?? [];
  const descriptor: HelixLiveSourceDescriptor = {
    schema: HELIX_LIVE_SOURCE_DESCRIPTOR_SCHEMA,
    descriptor_id: descriptorId,
    source_id: sourceId,
    thread_id: threadId,
    environment_id: normalizeString(input.environment_id) ?? normalizeString(input.environmentId) ?? prior?.environment_id ?? null,
    pipeline_id: normalizeString(input.pipeline_id) ?? normalizeString(input.pipelineId) ?? prior?.pipeline_id ?? null,
    modality,
    user_label: userLabel ?? prior?.user_label ?? null,
    serving_context: {
      surface,
      app_hint: appHint ?? prior?.serving_context.app_hint ?? null,
      window_title_hint: windowTitleHint ?? prior?.serving_context.window_title_hint ?? null,
      source_origin: sourceOrigin,
      participant_id: normalizeString(serving.participant_id) ?? normalizeString(input.participant_id) ?? prior?.serving_context.participant_id ?? null,
    },
    capabilities,
    current_state: normalizeState(input.current_state ?? input.status),
    cadence_ms: typeof input.cadence_ms === "number" && Number.isFinite(input.cadence_ms) ? Math.max(0, Math.round(input.cadence_ms)) : prior?.cadence_ms ?? null,
    latest_observation_refs: latestObservationRefs,
    raw_content_included: false,
    assistant_answer: false,
  };
  descriptorsById.set(descriptor.descriptor_id, descriptor);
  latestDescriptorBySource.set(sourceId, descriptor.descriptor_id);
  return descriptor;
}

export function listLiveSourceDescriptors(input: {
  threadId?: string | null;
  sourceId?: string | null;
  environmentId?: string | null;
  pipelineId?: string | null;
  limit?: number | null;
} = {}): HelixLiveSourceDescriptor[] {
  const limit = Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80)));
  return Array.from(descriptorsById.values())
    .filter((descriptor) => !input.threadId || descriptor.thread_id === input.threadId)
    .filter((descriptor) => !input.sourceId || descriptor.source_id === input.sourceId)
    .filter((descriptor) => !input.environmentId || descriptor.environment_id === input.environmentId)
    .filter((descriptor) => !input.pipelineId || descriptor.pipeline_id === input.pipelineId)
    .slice(-limit);
}

export function getLatestLiveSourceDescriptorForSource(sourceId: string): HelixLiveSourceDescriptor | null {
  const descriptorId = latestDescriptorBySource.get(sourceId);
  return descriptorId ? descriptorsById.get(descriptorId) ?? null : null;
}

export function resetLiveSourceDescriptorsForTest(): void {
  descriptorsById.clear();
  latestDescriptorBySource.clear();
}
