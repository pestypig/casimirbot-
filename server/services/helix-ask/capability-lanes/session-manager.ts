import crypto from "node:crypto";
import type {
  HelixCapabilityLaneSession,
  HelixCapabilityLaneSessionAction,
  HelixCapabilityLaneSessionEventAction,
  HelixCapabilityLaneSessionEvent,
  HelixCapabilityLaneSessionPermissions,
  HelixCapabilityLaneSessionResult,
  HelixCapabilityLaneSessionSourceBinding,
} from "@shared/helix-capability-lane-session";
import {
  HELIX_CAPABILITY_LANE_SESSION_EVENT_SCHEMA,
  HELIX_CAPABILITY_LANE_SESSION_SCHEMA,
} from "@shared/helix-capability-lane-session";
import type {
  HelixCapabilityLaneBackendSelectionDecision,
  HelixCapabilityLaneId,
} from "@shared/helix-capability-lane";
import {
  HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN,
  normalizeHelixLiveTranslationProjectionTarget,
} from "@shared/helix-live-translation-projection-target";
import {
  normalizeHelixLiveTranslationSourceIdentityKey,
  normalizeHelixLiveTranslationSourceKind,
} from "@shared/helix-live-translation-source-kind";
import type { HelixAgentProvider } from "../agent-providers/types";
import { listHelixCapabilityLanes, resolveHelixCapabilityLaneRequest } from "./registry";

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeProjectionTargetText = (value: unknown): string =>
  (() => {
    const normalized = normalizeText(value).toLowerCase();
    if (!normalized) return "";
    const canonical = normalizeHelixLiveTranslationProjectionTarget(
      normalized,
      HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN,
    );
    return canonical === HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN &&
      normalized !== HELIX_LIVE_TRANSLATION_PROJECTION_TARGET_UNKNOWN
      ? normalized
      : canonical;
  })();

const normalizeSessionSourceKind = (
  value: unknown,
): HelixCapabilityLaneSessionSourceBinding["source_kind"] | null => {
  const normalized = normalizeHelixLiveTranslationSourceKind(value, "");
  if (!normalized) return null;
  if (
    normalized === "docs" ||
    normalized === "docs_hover" ||
    normalized === "docs_selection" ||
    normalized === "audio" ||
    normalized === "visual" ||
    normalized === "ask_turn" ||
    normalized === "unknown"
  ) {
    return normalized;
  }
  return "unknown";
};

const languageMatches = (candidate: string | null | undefined, expected: string | null | undefined): boolean => {
  const normalizedCandidate = normalizeText(candidate).toLowerCase();
  const normalizedExpected = normalizeText(expected).toLowerCase();
  if (!normalizedCandidate || !normalizedExpected) return true;
  return normalizedCandidate === normalizedExpected ||
    normalizedCandidate.startsWith(`${normalizedExpected}-`) ||
    normalizedExpected.startsWith(`${normalizedCandidate}-`);
};

const targetLanguageForBinding = (binding: {
  target_language?: string | null;
  account_locale?: string | null;
}): string | null =>
  normalizeText(binding.target_language) ||
  normalizeText(binding.account_locale).split("-")[0] ||
  null;

const compactKey = (parts: Array<string | null | undefined>): string | null => {
  const compacted = parts
    .map((part) => normalizeText(part))
    .filter(Boolean)
    .join("::");
  return compacted || null;
};

const sourceIdentityKeyFor = (input: {
  sourceId?: string | null;
  sourceHash?: string | null;
  sourceTextHash?: string | null;
  sourceTextCharCount?: number | null;
  sourceKind?: HelixCapabilityLaneSessionSourceBinding["source_kind"] | null;
  projectionTarget?: string | null;
  accountLocale?: string | null;
  targetLanguage?: string | null;
}): string | null =>
  compactKey([
    input.sourceId,
    input.sourceHash,
    input.sourceTextHash,
    typeof input.sourceTextCharCount === "number" && Number.isFinite(input.sourceTextCharCount)
      ? String(Math.trunc(input.sourceTextCharCount))
      : null,
    normalizeSessionSourceKind(input.sourceKind) ?? null,
    input.projectionTarget,
    input.accountLocale,
    input.targetLanguage,
  ]);

const sourceBindingKeyFor = (input: {
  sourceId?: string | null;
  sourceHash?: string | null;
  projectionTarget?: string | null;
  accountLocale?: string | null;
  targetLanguage?: string | null;
}): string | null =>
  compactKey([
    input.sourceId,
    input.sourceHash,
    input.projectionTarget,
    input.accountLocale,
    input.targetLanguage,
  ]);

const sessionPermissionsFor = (provider: HelixAgentProvider): HelixCapabilityLaneSessionPermissions => ({
  read: provider.permissionProfile?.allows.read ?? true,
  observe: provider.permissionProfile?.allows.observe ?? true,
  act: provider.permissionProfile?.allows.act ?? false,
  write: false,
  shell: false,
  code_mutation: false,
});

const eventFor = (input: {
  laneSessionId: string;
  laneId: HelixCapabilityLaneId;
  selectedRuntimeAgentProvider: HelixAgentProvider["id"];
  selectedBackendProvider: string | null;
  backendSelectionDecision: HelixCapabilityLaneBackendSelectionDecision;
  costClass: HelixCapabilityLaneSessionEvent["cost_class"];
  latencyClass: HelixCapabilityLaneSessionEvent["latency_class"];
  privacyClass: HelixCapabilityLaneSessionEvent["privacy_class"];
  fallbackBackendProvider: string | null;
  action: HelixCapabilityLaneSessionEventAction;
  status: HelixCapabilityLaneSession["status"];
  reason: string;
  atMs: number;
  sourceId?: string | null;
  sourceHash?: string | null;
  sourceBindingKey?: string | null;
  sourceIdentityKey?: string | null;
  sourceKind?: HelixCapabilityLaneSessionSourceBinding["source_kind"] | null;
  accountLocale?: string | null;
  targetLanguage?: string | null;
  observationRef?: string | null;
  receiptRef?: string | null;
  chunkId?: string | null;
  chunkIndex?: number | null;
  dedupeKey?: string | null;
  sourceEventId?: string | null;
  sourceEventMs?: number | null;
  observedAtMs?: number | null;
  freshnessStatus?: string | null;
  sourceTextHash?: string | null;
  sourceTextCharCount?: number | null;
  projectionTarget?: string | null;
  cancelRequested?: boolean | null;
}): HelixCapabilityLaneSessionEvent => ({
  schema: HELIX_CAPABILITY_LANE_SESSION_EVENT_SCHEMA,
  event_id: `${input.laneSessionId}:${input.action}:${input.atMs}`,
  lane_session_id: input.laneSessionId,
  lane_id: input.laneId,
  selected_runtime_agent_provider: input.selectedRuntimeAgentProvider,
  selected_backend_provider: input.selectedBackendProvider,
  backend_selection_decision: input.backendSelectionDecision,
  cost_class: input.costClass,
  latency_class: input.latencyClass,
  privacy_class: input.privacyClass,
  fallback_backend_provider: input.fallbackBackendProvider,
  action: input.action,
  status: input.status,
  at_ms: input.atMs,
  reason: input.reason,
  source_id: normalizeText(input.sourceId) || null,
  source_hash: normalizeText(input.sourceHash) || null,
  source_binding_key:
    normalizeText(input.sourceBindingKey) ||
    sourceBindingKeyFor(input) ||
    null,
  source_identity_key:
    normalizeHelixLiveTranslationSourceIdentityKey(input.sourceIdentityKey) ||
    sourceIdentityKeyFor(input),
  source_kind: normalizeSessionSourceKind(input.sourceKind),
  account_locale: normalizeText(input.accountLocale) || null,
  target_language: normalizeText(input.targetLanguage) || null,
  observation_ref: normalizeText(input.observationRef) || null,
  receipt_ref: normalizeText(input.receiptRef) || null,
  chunk_id: normalizeText(input.chunkId) || null,
  chunk_index:
    typeof input.chunkIndex === "number" && Number.isFinite(input.chunkIndex)
      ? Math.trunc(input.chunkIndex)
      : null,
  dedupe_key: normalizeText(input.dedupeKey) || null,
  source_event_id: normalizeText(input.sourceEventId) || null,
  source_event_ms:
    typeof input.sourceEventMs === "number" && Number.isFinite(input.sourceEventMs)
      ? Math.trunc(input.sourceEventMs)
      : null,
  observed_at_ms:
    typeof input.observedAtMs === "number" && Number.isFinite(input.observedAtMs)
      ? Math.trunc(input.observedAtMs)
      : null,
  freshness_status: normalizeText(input.freshnessStatus) || null,
  source_text_hash: normalizeText(input.sourceTextHash) || null,
  source_text_char_count:
    typeof input.sourceTextCharCount === "number" && Number.isFinite(input.sourceTextCharCount)
      ? Math.trunc(input.sourceTextCharCount)
      : null,
  projection_target: normalizeProjectionTargetText(input.projectionTarget) || null,
  cancel_requested: input.cancelRequested === true,
  terminal_authority_status: input.observationRef || input.receiptRef
    ? "pending_helix_terminal_authority"
    : "not_terminal_authority",
  reentry_required: true,
  context_role: "tool_evidence",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

const blocked = (
  action: HelixCapabilityLaneSessionEventAction,
  blockedReason: string,
  metadata: Partial<Pick<
    HelixCapabilityLaneSessionResult,
    | "lane_id"
    | "lane_session_id"
    | "selected_runtime_agent_provider"
    | "requested_backend_provider"
    | "session_supported"
    | "source_id"
    | "source_hash"
    | "source_binding_key"
    | "source_identity_key"
    | "source_text_hash"
    | "source_text_char_count"
    | "projection_target"
    | "account_locale"
    | "target_language"
  >> = {},
): HelixCapabilityLaneSessionResult => ({
  ok: false,
  action,
  ...metadata,
  lane_session: null,
  blocked_reason: blockedReason,
  reentry_required: true,
  context_role: "tool_evidence",
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
  raw_content_included: false,
});

export type HelixCapabilityLaneSessionStore = ReturnType<typeof createHelixCapabilityLaneSessionStore>;

export const createHelixCapabilityLaneSessionStore = () => {
  const sessions = new Map<string, HelixCapabilityLaneSession>();

  const start = (input: {
    provider: HelixAgentProvider;
    laneId: HelixCapabilityLaneId;
    sourceBinding: HelixCapabilityLaneSessionSourceBinding;
    env?: NodeJS.ProcessEnv;
    nowMs?: number;
    laneSessionId?: string | null;
    requestedBackendProvider?: string | null;
    sourceIdentityKey?: string | null;
  }): HelixCapabilityLaneSessionResult => {
    const trace = resolveHelixCapabilityLaneRequest({
      provider: input.provider,
      requestedLane: input.laneId,
      requestedBackendProvider: input.requestedBackendProvider,
      env: input.env,
    });
    const manifest = listHelixCapabilityLanes({
      provider: input.provider,
      env: input.env,
    });
    const lane = manifest.lanes.find((candidate) => candidate.lane_id === input.laneId);
    const requestedSourceIdentityKey =
      normalizeHelixLiveTranslationSourceIdentityKey(input.sourceIdentityKey) ||
      normalizeHelixLiveTranslationSourceIdentityKey(input.sourceBinding.source_identity_key);
    const requestedSourceBindingKey = normalizeText(input.sourceBinding.source_binding_key);
    const expectedTargetLanguage = targetLanguageForBinding(input.sourceBinding);
    const projectionTarget = normalizeProjectionTargetText(input.sourceBinding.projection_target);
    const expectedSourceBindingKey = sourceBindingKeyFor({
      sourceId: input.sourceBinding.source_id,
      sourceHash: input.sourceBinding.source_hash,
      projectionTarget,
      accountLocale: input.sourceBinding.account_locale,
      targetLanguage: expectedTargetLanguage,
    });
    const expectedSourceIdentityKey = sourceIdentityKeyFor({
      sourceId: input.sourceBinding.source_id,
      sourceHash: input.sourceBinding.source_hash,
      sourceTextHash: input.sourceBinding.source_text_hash,
      sourceTextCharCount: input.sourceBinding.source_text_char_count,
      sourceKind: normalizeSessionSourceKind(input.sourceBinding.source_kind),
      projectionTarget,
      accountLocale: input.sourceBinding.account_locale,
      targetLanguage: expectedTargetLanguage,
    });
    const blockedMetadata = {
      lane_id: input.laneId,
      lane_session_id: normalizeText(input.laneSessionId) || null,
      selected_runtime_agent_provider: input.provider.id,
      requested_backend_provider: input.requestedBackendProvider ?? null,
      session_supported: lane?.session_contract.supported ?? null,
      source_id: normalizeText(input.sourceBinding.source_id) || null,
      source_hash: normalizeText(input.sourceBinding.source_hash) || null,
      source_binding_key: requestedSourceBindingKey || expectedSourceBindingKey,
      source_identity_key: requestedSourceIdentityKey || expectedSourceIdentityKey,
      source_text_hash: normalizeText(input.sourceBinding.source_text_hash) || null,
      source_text_char_count:
        typeof input.sourceBinding.source_text_char_count === "number" &&
        Number.isFinite(input.sourceBinding.source_text_char_count)
          ? Math.trunc(input.sourceBinding.source_text_char_count)
          : null,
      projection_target: projectionTarget || null,
      account_locale: normalizeText(input.sourceBinding.account_locale) || null,
      target_language: expectedTargetLanguage,
    };
    if (!lane) return blocked("start", "unknown_capability_lane", blockedMetadata);
    if (!lane.requestable_by_runtime_provider) return blocked("start", lane.status_reason, blockedMetadata);
    if (!lane.session_contract.supported) return blocked("start", "capability_lane_session_not_supported", blockedMetadata);
    if (!normalizeText(input.sourceBinding.source_id)) return blocked("start", "missing_source_binding", blockedMetadata);
    if (
      requestedSourceBindingKey &&
      expectedSourceBindingKey &&
      requestedSourceBindingKey !== expectedSourceBindingKey
    ) {
      return blocked("start", "source_binding_key_mismatch", blockedMetadata);
    }
    if (
      requestedSourceIdentityKey &&
      expectedSourceIdentityKey &&
      requestedSourceIdentityKey !==
        normalizeHelixLiveTranslationSourceIdentityKey(expectedSourceIdentityKey)
    ) {
      return blocked("start", "source_identity_key_mismatch", blockedMetadata);
    }

    const nowMs = input.nowMs ?? Date.now();
    const laneSessionId =
      normalizeText(input.laneSessionId) ||
      `lane_session:${input.laneId}:${crypto.randomUUID()}`;
    if (sessions.has(laneSessionId)) {
      return blocked("start", "lane_session_already_exists", blockedMetadata);
    }
    const event = eventFor({
      laneSessionId,
      laneId: input.laneId,
      selectedRuntimeAgentProvider: input.provider.id,
      selectedBackendProvider: trace.selected_backend_provider,
      backendSelectionDecision: trace.backend_selection_decision,
      costClass: trace.cost_class,
      latencyClass: trace.latency_class,
      privacyClass: trace.privacy_class,
      fallbackBackendProvider: trace.fallback_backend_provider,
      action: "start",
      status: "running",
      reason: "lane_session_started",
      atMs: nowMs,
      sourceId: input.sourceBinding.source_id,
      sourceHash: input.sourceBinding.source_hash,
      sourceIdentityKey: expectedSourceIdentityKey,
      sourceTextHash: input.sourceBinding.source_text_hash,
      sourceTextCharCount: input.sourceBinding.source_text_char_count,
      sourceKind: normalizeSessionSourceKind(input.sourceBinding.source_kind),
      accountLocale: input.sourceBinding.account_locale,
      targetLanguage: expectedTargetLanguage,
      projectionTarget,
    });
    const session: HelixCapabilityLaneSession = {
      schema: HELIX_CAPABILITY_LANE_SESSION_SCHEMA,
      lane_session_id: laneSessionId,
      lane_id: input.laneId,
      selected_runtime_agent_provider: input.provider.id,
      selected_backend_provider: trace.selected_backend_provider,
      backend_selection_decision: trace.backend_selection_decision,
      cost_class: trace.cost_class,
      latency_class: trace.latency_class,
      privacy_class: trace.privacy_class,
      fallback_backend_provider: trace.fallback_backend_provider,
      status: "running",
      health: "healthy",
      source_binding: {
        ...input.sourceBinding,
        source_id: normalizeText(input.sourceBinding.source_id),
        source_hash: normalizeText(input.sourceBinding.source_hash) || null,
        source_binding_key: expectedSourceBindingKey,
        source_text_hash: normalizeText(input.sourceBinding.source_text_hash) || null,
        source_text_char_count:
          typeof input.sourceBinding.source_text_char_count === "number" &&
          Number.isFinite(input.sourceBinding.source_text_char_count)
            ? Math.trunc(input.sourceBinding.source_text_char_count)
            : null,
        source_identity_key: expectedSourceIdentityKey,
        source_kind: normalizeSessionSourceKind(input.sourceBinding.source_kind) ?? "unknown",
        projection_target: projectionTarget || null,
        target_language: expectedTargetLanguage,
      },
      permissions: sessionPermissionsFor(input.provider),
      created_at_ms: nowMs,
      updated_at_ms: nowMs,
      last_observation_ref: null,
      last_receipt_ref: null,
      debug_history: [event],
      context_role: "tool_evidence",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
    sessions.set(laneSessionId, session);
    return {
      ok: true,
      action: "start",
      lane_id: input.laneId,
      selected_runtime_agent_provider: input.provider.id,
      requested_backend_provider: input.requestedBackendProvider ?? null,
      session_supported: true,
      lane_session: session,
      blocked_reason: null,
      reentry_required: true,
      context_role: "tool_evidence",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  };

  const transition = (input: {
    laneSessionId: string;
    action: Exclude<HelixCapabilityLaneSessionAction, "start">;
    nowMs?: number;
    reason?: string | null;
  }): HelixCapabilityLaneSessionResult => {
    const session = sessions.get(input.laneSessionId);
    if (!session) return blocked(input.action, "unknown_lane_session");
    const resultMetadata = {
      lane_id: session.lane_id,
      lane_session_id: session.lane_session_id,
      selected_runtime_agent_provider: session.selected_runtime_agent_provider,
      requested_backend_provider: session.backend_selection_decision.requested_backend_provider,
      session_supported: true,
      source_id: session.source_binding.source_id || null,
      source_hash: session.source_binding.source_hash ?? null,
      source_binding_key: session.source_binding.source_binding_key ?? null,
      source_identity_key: session.source_binding.source_identity_key ?? null,
      source_text_hash: session.source_binding.source_text_hash ?? null,
      source_text_char_count: session.source_binding.source_text_char_count ?? null,
      projection_target: session.source_binding.projection_target ?? null,
      account_locale: session.source_binding.account_locale ?? null,
      target_language: session.source_binding.target_language ?? null,
    };
    if (session.status === "stopped") return blocked(input.action, "lane_session_already_stopped", resultMetadata);
    if (input.action === "pause" && session.status === "paused") {
      return blocked(input.action, "lane_session_already_paused", resultMetadata);
    }
    if (input.action === "resume" && session.status === "running") {
      return blocked(input.action, "lane_session_already_running", resultMetadata);
    }

    const nowMs = input.nowMs ?? Date.now();
    const status = input.action === "pause"
      ? "paused"
      : input.action === "resume"
        ? "running"
        : "stopped";
    const health = status === "running"
      ? "healthy"
      : status === "paused"
        ? "degraded"
        : "stopped";
    const event = eventFor({
      laneSessionId: input.laneSessionId,
      laneId: session.lane_id,
      selectedRuntimeAgentProvider: session.selected_runtime_agent_provider,
      selectedBackendProvider: session.selected_backend_provider,
      backendSelectionDecision: session.backend_selection_decision,
      costClass: session.cost_class,
      latencyClass: session.latency_class,
      privacyClass: session.privacy_class,
      fallbackBackendProvider: session.fallback_backend_provider,
      action: input.action,
      status,
      reason: normalizeText(input.reason) || `lane_session_${input.action}`,
      atMs: nowMs,
      sourceId: session.source_binding.source_id,
      sourceHash: session.source_binding.source_hash,
      sourceBindingKey: session.source_binding.source_binding_key,
      sourceIdentityKey: session.source_binding.source_identity_key,
      sourceTextHash: session.source_binding.source_text_hash,
      sourceTextCharCount: session.source_binding.source_text_char_count,
      sourceKind: session.source_binding.source_kind,
      accountLocale: session.source_binding.account_locale,
      targetLanguage: session.source_binding.target_language,
      projectionTarget: session.source_binding.projection_target,
    });
    const updated: HelixCapabilityLaneSession = {
      ...session,
      status,
      health,
      updated_at_ms: nowMs,
      debug_history: [...session.debug_history, event],
    };
    sessions.set(input.laneSessionId, updated);
    return {
      ok: true,
      action: input.action,
      ...resultMetadata,
      lane_session: updated,
      blocked_reason: null,
      reentry_required: true,
      context_role: "tool_evidence",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  };

  const recordObservation = (input: {
    laneSessionId: string;
    observationRef?: string | null;
    receiptRef?: string | null;
    sourceId?: string | null;
    chunkId?: string | null;
    chunkIndex?: number | null;
    dedupeKey?: string | null;
    sourceEventId?: string | null;
    sourceHash?: string | null;
    sourceKind?: HelixCapabilityLaneSessionSourceBinding["source_kind"] | null;
    accountLocale?: string | null;
    targetLanguage?: string | null;
    sourceEventMs?: number | null;
    observedAtMs?: number | null;
    freshnessStatus?: string | null;
    sourceTextHash?: string | null;
    sourceTextCharCount?: number | null;
    sourceBindingKey?: string | null;
    sourceIdentityKey?: string | null;
    projectionTarget?: string | null;
    cancelRequested?: boolean | null;
    nowMs?: number;
  }): HelixCapabilityLaneSessionResult => {
    const session = sessions.get(input.laneSessionId);
    if (!session) return blocked("record_observation", "unknown_lane_session");
    const resultMetadata = {
      lane_id: session.lane_id,
      lane_session_id: session.lane_session_id,
      selected_runtime_agent_provider: session.selected_runtime_agent_provider,
      requested_backend_provider: session.backend_selection_decision.requested_backend_provider,
      session_supported: true,
      source_id: session.source_binding.source_id || null,
      source_hash: session.source_binding.source_hash ?? null,
      source_binding_key: session.source_binding.source_binding_key ?? null,
      source_identity_key: session.source_binding.source_identity_key ?? null,
      source_text_hash: session.source_binding.source_text_hash ?? null,
      source_text_char_count: session.source_binding.source_text_char_count ?? null,
      projection_target: session.source_binding.projection_target ?? null,
      account_locale: session.source_binding.account_locale ?? null,
      target_language: session.source_binding.target_language ?? null,
    };
    if (session.status === "stopped") {
      return blocked("record_observation", "lane_session_already_stopped", resultMetadata);
    }
    if (session.status === "paused") {
      return blocked("record_observation", "lane_session_paused", resultMetadata);
    }
    const observationRef = normalizeText(input.observationRef) || null;
    const receiptRef = normalizeText(input.receiptRef) || null;
    if (!observationRef && !receiptRef) return blocked("record_observation", "missing_evidence_ref", resultMetadata);
    const sourceId = normalizeText(input.sourceId);
    if (
      sourceId &&
      session.source_binding.source_id &&
      sourceId !== session.source_binding.source_id
    ) {
      return blocked("record_observation", "source_id_mismatch", resultMetadata);
    }
    const sourceHash = normalizeText(input.sourceHash);
    if (
      sourceHash &&
      session.source_binding.source_hash &&
      sourceHash !== session.source_binding.source_hash
    ) {
      return blocked("record_observation", "source_hash_mismatch", resultMetadata);
    }
    if (
      normalizeSessionSourceKind(input.sourceKind) &&
      normalizeSessionSourceKind(input.sourceKind) !== "unknown" &&
      session.source_binding.source_kind &&
      session.source_binding.source_kind !== "unknown" &&
      normalizeSessionSourceKind(input.sourceKind) !==
        normalizeSessionSourceKind(session.source_binding.source_kind)
    ) {
      return blocked("record_observation", "source_kind_mismatch", resultMetadata);
    }
    const sourceTextHash = normalizeText(input.sourceTextHash);
    if (
      sourceTextHash &&
      session.source_binding.source_text_hash &&
      sourceTextHash !== session.source_binding.source_text_hash
    ) {
      return blocked("record_observation", "source_text_hash_mismatch", resultMetadata);
    }
    if (
      typeof input.sourceTextCharCount === "number" &&
      Number.isFinite(input.sourceTextCharCount) &&
      typeof session.source_binding.source_text_char_count === "number" &&
      Math.trunc(input.sourceTextCharCount) !== session.source_binding.source_text_char_count
    ) {
      return blocked("record_observation", "source_text_char_count_mismatch", resultMetadata);
    }
    const requestedSourceBindingKey = normalizeText(input.sourceBindingKey);
    if (
      requestedSourceBindingKey &&
      session.source_binding.source_binding_key &&
      requestedSourceBindingKey !== session.source_binding.source_binding_key
    ) {
      return blocked("record_observation", "source_binding_key_mismatch", resultMetadata);
    }
    const requestedSourceIdentityKey = normalizeHelixLiveTranslationSourceIdentityKey(input.sourceIdentityKey);
    const projectionTarget = normalizeProjectionTargetText(input.projectionTarget);
    if (
      projectionTarget &&
      session.source_binding.projection_target &&
      projectionTarget !== session.source_binding.projection_target
    ) {
      return blocked("record_observation", "projection_target_mismatch", resultMetadata);
    }
    if (!languageMatches(input.targetLanguage, session.source_binding.target_language)) {
      return blocked("record_observation", "target_language_mismatch", resultMetadata);
    }
    const accountLocale = normalizeText(input.accountLocale);
    if (
      accountLocale &&
      session.source_binding.account_locale &&
      accountLocale.toLowerCase() !== session.source_binding.account_locale.toLowerCase()
    ) {
      return blocked("record_observation", "account_locale_mismatch", resultMetadata);
    }
    const expectedSourceIdentityKey = sourceIdentityKeyFor({
      sourceId: sourceId || session.source_binding.source_id,
      sourceHash: sourceHash || session.source_binding.source_hash,
      sourceTextHash: sourceTextHash || session.source_binding.source_text_hash,
      sourceTextCharCount:
        typeof input.sourceTextCharCount === "number" && Number.isFinite(input.sourceTextCharCount)
          ? input.sourceTextCharCount
          : session.source_binding.source_text_char_count,
      sourceKind:
        normalizeSessionSourceKind(input.sourceKind) ??
        normalizeSessionSourceKind(session.source_binding.source_kind),
      projectionTarget: projectionTarget || session.source_binding.projection_target,
      accountLocale: accountLocale || session.source_binding.account_locale,
      targetLanguage: normalizeText(input.targetLanguage) || session.source_binding.target_language,
    });
    if (
      requestedSourceIdentityKey &&
      expectedSourceIdentityKey &&
      requestedSourceIdentityKey !==
        normalizeHelixLiveTranslationSourceIdentityKey(expectedSourceIdentityKey) &&
      requestedSourceIdentityKey !==
        normalizeHelixLiveTranslationSourceIdentityKey(session.source_binding.source_identity_key)
    ) {
      return blocked("record_observation", "source_identity_key_mismatch", resultMetadata);
    }
    const nowMs = input.nowMs ?? Date.now();
    const event = eventFor({
      laneSessionId: input.laneSessionId,
      laneId: session.lane_id,
      selectedRuntimeAgentProvider: session.selected_runtime_agent_provider,
      selectedBackendProvider: session.selected_backend_provider,
      backendSelectionDecision: session.backend_selection_decision,
      costClass: session.cost_class,
      latencyClass: session.latency_class,
      privacyClass: session.privacy_class,
      fallbackBackendProvider: session.fallback_backend_provider,
      action: "record_observation",
      status: session.status,
      reason: "lane_session_observation_recorded",
      atMs: nowMs,
      sourceId: sourceId || session.source_binding.source_id,
      sourceHash: sourceHash || session.source_binding.source_hash,
      sourceBindingKey: session.source_binding.source_binding_key,
      sourceIdentityKey: session.source_binding.source_identity_key,
      sourceKind:
        normalizeSessionSourceKind(input.sourceKind) ??
        normalizeSessionSourceKind(session.source_binding.source_kind),
      accountLocale: accountLocale || session.source_binding.account_locale,
      targetLanguage: normalizeText(input.targetLanguage) || session.source_binding.target_language,
      observationRef,
      receiptRef,
      chunkId: input.chunkId,
      chunkIndex: input.chunkIndex,
      dedupeKey: input.dedupeKey,
      sourceEventId: input.sourceEventId,
      sourceEventMs: input.sourceEventMs,
      observedAtMs: input.observedAtMs,
      freshnessStatus: input.freshnessStatus,
      sourceTextHash: sourceTextHash || session.source_binding.source_text_hash,
      sourceTextCharCount:
        typeof input.sourceTextCharCount === "number" && Number.isFinite(input.sourceTextCharCount)
          ? input.sourceTextCharCount
          : session.source_binding.source_text_char_count,
      projectionTarget: projectionTarget || session.source_binding.projection_target,
      cancelRequested: input.cancelRequested,
    });
    const updated: HelixCapabilityLaneSession = {
      ...session,
      health: session.status === "running" ? "healthy" : session.health,
      updated_at_ms: nowMs,
      last_observation_ref: observationRef,
      last_receipt_ref: receiptRef,
      debug_history: [...session.debug_history, event],
    };
    sessions.set(input.laneSessionId, updated);
    return {
      ok: true,
      action: "record_observation",
      ...resultMetadata,
      lane_session: updated,
      blocked_reason: null,
      reentry_required: true,
      context_role: "tool_evidence",
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    };
  };

  return {
    start,
    pause: (input: { laneSessionId: string; nowMs?: number; reason?: string | null }) =>
      transition({ ...input, action: "pause" }),
    resume: (input: { laneSessionId: string; nowMs?: number; reason?: string | null }) =>
      transition({ ...input, action: "resume" }),
    stop: (input: { laneSessionId: string; nowMs?: number; reason?: string | null }) =>
      transition({ ...input, action: "stop" }),
    recordObservation,
    get: (laneSessionId: string) => sessions.get(laneSessionId) ?? null,
    list: () => Array.from(sessions.values()),
    clear: () => sessions.clear(),
  };
};

export const helixCapabilityLaneSessionStore = createHelixCapabilityLaneSessionStore();
