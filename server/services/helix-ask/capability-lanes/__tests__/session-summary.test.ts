import { describe, expect, it } from "vitest";
import type { HelixAgentProvider } from "../../agent-providers/types";
import { createHelixCapabilityLaneSessionStore } from "../session-manager";
import {
  buildHelixCapabilityLaneSessionDebugSummaries,
  buildHelixCapabilityLaneSessionDebugSummary,
} from "../session-summary";

const buildProvider = (id: "helix" | "codex"): HelixAgentProvider => ({
  id,
  label: id === "helix" ? "Helix Ask Native" : "Codex Workstation Mode",
  permissionProfile: {
    id: id === "helix" ? "helix-native" : "read-observe-act",
    label: "Read/observe plus non-mutating workstation action",
    allows: {
      observe: true,
      read: true,
      act: true,
      write: false,
      shell: false,
      codeMutation: false,
    },
  },
  enabled: () => true,
  supports: {
    streaming: id === "helix",
    workstationTools: true,
    capabilityLanes: true,
    capabilityLaneOneShot: true,
    capabilityLaneSessions: false,
    codeMutation: false,
  },
  runTurn: async () => ({
    ok: false,
    runtime: id,
    response_type: "test",
    final_status: "test",
  }),
});

const buildObservedSession = () => {
  const store = createHelixCapabilityLaneSessionStore();
  store.start({
    provider: buildProvider("codex"),
    laneId: "live_translation",
    laneSessionId: "lane-session-summary-only",
    sourceBinding: {
      source_id: "docs:session-summary",
      source_hash: "sha256:session-summary-v1",
      source_kind: "docs",
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es",
    },
    requestedBackendProvider: "google_gemini",
    env: {} as NodeJS.ProcessEnv,
    nowMs: 100,
  });
  const observed = store.recordObservation({
    laneSessionId: "lane-session-summary-only",
    observationRef: "ask:lane:translation:session-obs",
    receiptRef: "ask:lane:translation:session-obs:projection:receipt",
    chunkId: "chunk-summary",
    chunkIndex: 1,
    dedupeKey: "docs:session-summary:chunk-summary:es",
    sourceEventId: "docs:session-summary:event-1",
    sourceEventMs: 90,
    observedAtMs: 120,
    freshnessStatus: "fresh",
    sourceTextHash: "sha256:text-session-summary",
    sourceTextCharCount: 43,
    sourceId: "docs:session-summary",
    sourceHash: "sha256:session-summary-v1",
    targetLanguage: "es",
    projectionTarget: "docs_chunk",
    cancelRequested: true,
    nowMs: 120,
  });
  if (!observed.lane_session) throw new Error("expected observed lane session");
  return observed.lane_session;
};

describe("capability lane session debug summary", () => {
  it("projects a standalone lane session without goal binding or terminal authority", () => {
    const summary = buildHelixCapabilityLaneSessionDebugSummary(buildObservedSession());

    expect(summary).toMatchObject({
      schema: "helix.capability_lane.session_debug_summary.v1",
      lane_session_id: "lane-session-summary-only",
      lane_id: "live_translation",
      selected_runtime_agent_provider: "codex",
      selected_backend_provider: "live_translation.local_runtime",
      cost_class: "free_local",
      latency_class: "interactive",
      privacy_class: "local_only",
      fallback_backend_provider: null,
      backend_selection_decision: expect.objectContaining({
        outcome: "fallback_selected",
        requested_backend_provider: "google_gemini",
        selected_backend_provider: "live_translation.local_runtime",
        selected_runtime_provider_remains_root: true,
        backend_provider_becomes_root_agent: false,
        live_backend_execution_enabled: false,
        terminal_authority_owner: "helix",
      }),
      session_status: "running",
      session_health: "healthy",
      source_id: "docs:session-summary",
      source_hash: "sha256:session-summary-v1",
      source_kind: "docs",
      projection_target: "docs_chunk",
      account_locale: "es-US",
      target_language: "es",
      permissions: {
        read: true,
        observe: true,
        act: true,
        write: false,
        shell: false,
        code_mutation: false,
      },
      permission_profile: "permissions non-mutating",
      created_at_ms: 100,
      updated_at_ms: 120,
      last_observation_ref: "ask:lane:translation:session-obs",
      last_receipt_ref: "ask:lane:translation:session-obs:projection:receipt",
      permissions: expect.objectContaining({
        read: true,
        observe: true,
        write: false,
        shell: false,
        code_mutation: false,
      }),
      latest_chunk_id: "chunk-summary",
      latest_chunk_index: 1,
      latest_source_id: "docs:session-summary",
      latest_source_hash: "sha256:session-summary-v1",
      latest_target_language: "es",
      latest_dedupe_key: "docs:session-summary:chunk-summary:es",
      latest_source_event_id: "docs:session-summary:event-1",
      latest_source_event_ms: 90,
      latest_observed_at_ms: 120,
      latest_freshness_status: "fresh",
      source_text_hash: "sha256:text-session-summary",
      source_text_char_count: 43,
      latest_projection_target: "docs_chunk",
      latest_cancel_requested: true,
      session_event_count: 2,
      terminal_authority_status: "pending_helix_terminal_authority",
      reentry_required: true,
      backend_provider_becomes_root_agent: false,
      final_reports_require_terminal_authority: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
    expect(summary.latest_session_event).toMatchObject({
      lane_session_id: "lane-session-summary-only",
      action: "record_observation",
      selected_backend_provider: "live_translation.local_runtime",
      cost_class: "free_local",
      latency_class: "interactive",
      privacy_class: "local_only",
      fallback_backend_provider: null,
      backend_selection_decision: expect.objectContaining({
        outcome: "fallback_selected",
        selected_backend_provider: "live_translation.local_runtime",
      }),
      reason: "lane_session_observation_recorded",
      observation_ref: "ask:lane:translation:session-obs",
      receipt_ref: "ask:lane:translation:session-obs:projection:receipt",
      chunk_id: "chunk-summary",
      chunk_index: 1,
      dedupe_key: "docs:session-summary:chunk-summary:es",
      source_event_id: "docs:session-summary:event-1",
      source_id: "docs:session-summary",
      source_hash: "sha256:session-summary-v1",
      target_language: "es",
      source_event_ms: 90,
      observed_at_ms: 120,
      freshness_status: "fresh",
      source_text_hash: "sha256:text-session-summary",
      source_text_char_count: 43,
      projection_target: "docs_chunk",
      cancel_requested: true,
      terminal_authority_status: "pending_helix_terminal_authority",
      reentry_required: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });

  it("builds array summaries for debug export projection", () => {
    const summaries = buildHelixCapabilityLaneSessionDebugSummaries([buildObservedSession()]);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      lane_session_id: "lane-session-summary-only",
      selected_backend_provider: "live_translation.local_runtime",
      cost_class: "free_local",
      latency_class: "interactive",
      privacy_class: "local_only",
      fallback_backend_provider: null,
      backend_selection_decision: expect.objectContaining({
        outcome: "fallback_selected",
        selected_backend_provider: "live_translation.local_runtime",
      }),
      last_receipt_ref: "ask:lane:translation:session-obs:projection:receipt",
      latest_chunk_id: "chunk-summary",
      source_hash: "sha256:session-summary-v1",
      latest_source_id: "docs:session-summary",
      latest_source_hash: "sha256:session-summary-v1",
      latest_target_language: "es",
      latest_dedupe_key: "docs:session-summary:chunk-summary:es",
      latest_freshness_status: "fresh",
      source_text_hash: "sha256:text-session-summary",
      source_text_char_count: 43,
      latest_cancel_requested: true,
      permission_profile: "permissions non-mutating",
      terminal_authority_status: "pending_helix_terminal_authority",
      reentry_required: true,
      backend_provider_becomes_root_agent: false,
      final_reports_require_terminal_authority: true,
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    });
  });
});
