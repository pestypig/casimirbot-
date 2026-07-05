import { afterEach, describe, expect, it } from "vitest";
import { helixRuntimeGoalSessionStore } from "../services/helix-ask/agent-providers/goal-runtime-session";
import { routeHelixRuntimeGoalCommand } from "../services/helix-ask/runtime-goal-command-router";
import { dispatchRuntimeGoalWakeCandidate } from "../services/helix-ask/runtime-goals/runtime-goal-wake-dispatcher";
import { clearRuntimeGoalWakeAdmissionDedupe } from "../services/helix-ask/runtime-goals/runtime-goal-wake-admission";

const originalEnableCodexAgent = process.env.ENABLE_CODEX_AGENT;
const originalCodexFakeStdout = process.env.CODEX_AGENT_FAKE_STDOUT;
const originalCodexFakeExitCode = process.env.CODEX_AGENT_FAKE_EXIT_CODE;

const restoreEnv = () => {
  if (originalEnableCodexAgent === undefined) {
    delete process.env.ENABLE_CODEX_AGENT;
  } else {
    process.env.ENABLE_CODEX_AGENT = originalEnableCodexAgent;
  }
  if (originalCodexFakeStdout === undefined) {
    delete process.env.CODEX_AGENT_FAKE_STDOUT;
  } else {
    process.env.CODEX_AGENT_FAKE_STDOUT = originalCodexFakeStdout;
  }
  if (originalCodexFakeExitCode === undefined) {
    delete process.env.CODEX_AGENT_FAKE_EXIT_CODE;
  } else {
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = originalCodexFakeExitCode;
  }
};

const visibleDocSnapshot = (docPath: string, visibleText: string, sourceHash = "fnv1a32:auto-wake") => ({
  activePanel: "docs-viewer",
  active_doc_path: docPath,
  active_doc_visible_translation_context: {
    schema: "helix.ask.active_doc_visible_translation_context.v1",
    doc_path: docPath,
    source_id: `document_markdown:${docPath}`,
    source_hash: sourceHash,
    chunks: [
      {
        chunk_id: `${sourceHash}:visible-1`,
        visible_text: visibleText,
      },
    ],
  },
});

afterEach(() => {
  helixRuntimeGoalSessionStore.clear();
  clearRuntimeGoalWakeAdmissionDedupe();
  restoreEnv();
});

describe("runtime goal wake dispatcher", () => {
  it("admits a visible source change and resumes the runtime goal through governed document evidence", async () => {
    process.env.ENABLE_CODEX_AGENT = "1";
    process.env.CODEX_AGENT_FAKE_STDOUT = "Auto wake summary: the new document section was inspected.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const start = await routeHelixRuntimeGoalCommand({
      body: {
        agent_runtime: "codex",
        turn_id: "ask:test:auto-wake-start",
        question: "/goal Keep a cumulative summary of the visible document section.",
        workspace_context_snapshot: visibleDocSnapshot(
          "docs/original.md",
          "The original visible section is only the starting point.",
          "fnv1a32:auto-start",
        ),
      },
    });
    expect(start.statusCode).toBe(200);
    const goalId = String((start.payload.runtime_goal_session as Record<string, unknown>).goal_id);

    const result = await dispatchRuntimeGoalWakeCandidate({
      body: {
        agent_runtime: "codex",
        turn_id: "ask:test:auto-wake",
        event_kind: "visible_source_changed",
        goal_id: goalId,
        source_kind: "docs_viewer_visible_surface",
        doc_path: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        active_panel_id: "docs-viewer",
        source_freshness_ms: 11,
        source_hash: "fnv1a32:auto-new",
        reason: "docs_viewer_active_doc_changed",
        dedupe_key: "docs-viewer:docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        workspace_context_snapshot: visibleDocSnapshot(
          "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          "The NHM2 document frames current status as diagnostic and artifact-limited.",
          "fnv1a32:auto-new",
        ),
      },
    });

    expect(result.statusCode).toBe(200);
    expect(result.payload).toMatchObject({
      ok: true,
      goal_id: goalId,
      wake_event_id: expect.stringContaining("goal-wake:"),
      runtime_goal_wake_candidate: {
        event_kind: "visible_source_changed",
        doc_path: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        dedupe_key: "docs-viewer:docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
      },
      runtime_goal_wake_admission: {
        status: "admitted",
        reason: "visible_source_changed",
        goal_id: goalId,
      },
      runtime_goal_wake_event: {
        wake_event_id: expect.stringContaining("goal-wake:"),
        goal_id: goalId,
        kind: "visible_source_changed",
      },
      runtime_goal_session: {
        goal_id: goalId,
        status: "waiting",
        runtime_agent_provider: "codex",
        terminal_authority_status: "authorized",
      },
      runtime_goal_source_binding: {
        doc_path: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        source_kind: "docs_viewer_visible_surface",
      },
      runtime_goal_wake_plan: {
        requested_observation_or_lane: "docs-viewer.read_visible_surface",
      },
      runtime_goal_debug_export: {
        latest_wake_candidate: {
          event_kind: "visible_source_changed",
        },
        latest_wake_admission: {
          status: "admitted",
        },
      },
    });
    expect(String(result.payload.selected_final_answer)).toContain("Auto wake summary");
    expect(String(result.payload.selected_final_answer)).toContain(
      "Observed source: docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
    );
    expect((result.payload.runtime_goal_session as Record<string, unknown>).latest_observation_refs).toEqual(
      expect.arrayContaining([expect.stringContaining("docs-viewer.read_visible_surface")]),
    );
    const debugEvents = ((result.payload.runtime_goal_debug_export as Record<string, unknown>).debug_events ?? []) as Array<Record<string, unknown>>;
    expect(debugEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stage: "wake_received" }),
        expect.objectContaining({ stage: "tool_or_lane_admitted" }),
        expect.objectContaining({ stage: "evidence_reentered" }),
        expect.objectContaining({ stage: "terminal_authority_evaluated", terminal_authority_status: "authorized" }),
      ]),
    );
  }, 15_000);

  it("admits a same-document visible surface change and resumes the runtime goal once", async () => {
    process.env.ENABLE_CODEX_AGENT = "1";
    process.env.CODEX_AGENT_FAKE_STDOUT = "Visible surface wake summary: the next section was inspected.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const start = await routeHelixRuntimeGoalCommand({
      body: {
        agent_runtime: "codex",
        turn_id: "ask:test:surface-wake-start",
        question: "/goal Keep a cumulative summary of the visible document section.",
        workspace_context_snapshot: visibleDocSnapshot(
          "docs/current.md",
          "The first visible section opens the document.",
          "fnv1a32:surface-doc",
        ),
      },
    });
    expect(start.statusCode).toBe(200);
    const goalId = String((start.payload.runtime_goal_session as Record<string, unknown>).goal_id);

    const result = await dispatchRuntimeGoalWakeCandidate({
      body: {
        agent_runtime: "codex",
        turn_id: "ask:test:surface-wake",
        event_kind: "visible_surface_changed",
        goal_id: goalId,
        source_kind: "docs_viewer_visible_surface",
        doc_path: "docs/current.md",
        active_panel_id: "docs-viewer",
        source_id: "document_markdown:docs/current.md",
        source_hash: "fnv1a32:surface-doc",
        reason: "docs_viewer_visible_surface_changed",
        dedupe_key: "docs-viewer:docs/current.md:visible-surface:u0003:fnv1a32:surface-chunk",
        workspace_context_snapshot: visibleDocSnapshot(
          "docs/current.md",
          "The second visible section changes within the same document.",
          "fnv1a32:surface-doc",
        ),
      },
    });

    expect(result.statusCode).toBe(200);
    expect(result.payload).toMatchObject({
      ok: true,
      goal_id: goalId,
      runtime_goal_wake_candidate: {
        event_kind: "visible_surface_changed",
        reason: "docs_viewer_visible_surface_changed",
        doc_path: "docs/current.md",
        source_hash: "fnv1a32:surface-doc",
      },
      runtime_goal_wake_admission: {
        status: "admitted",
        reason: "visible_surface_changed",
        goal_id: goalId,
      },
      runtime_goal_wake_event: {
        wake_event_id: expect.stringContaining("goal-wake:"),
        goal_id: goalId,
        kind: "visible_surface_changed",
      },
      runtime_goal_session: {
        goal_id: goalId,
        status: "waiting",
        runtime_agent_provider: "codex",
        terminal_authority_status: "authorized",
      },
      runtime_goal_wake_plan: {
        requested_observation_or_lane: "docs-viewer.read_visible_surface",
      },
    });
    expect(String(result.payload.selected_final_answer)).toContain("Visible surface wake summary");
    expect(String(result.payload.selected_final_answer)).toContain("Observed source: docs/current.md");
    expect((result.payload.runtime_goal_session as Record<string, unknown>).latest_observation_refs).toEqual(
      expect.arrayContaining([expect.stringContaining("docs-viewer.read_visible_surface")]),
    );
  }, 15_000);

  it("admits a visible source change without a goal id by resolving the latest active runtime goal", async () => {
    process.env.ENABLE_CODEX_AGENT = "1";
    process.env.CODEX_AGENT_FAKE_STDOUT = "Server-resolved wake summary: the latest active goal was resumed.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const start = await routeHelixRuntimeGoalCommand({
      body: {
        agent_runtime: "codex",
        turn_id: "ask:test:server-resolved-start",
        question: "/goal Keep a cumulative summary of the visible document section.",
        workspace_context_snapshot: visibleDocSnapshot(
          "docs/original.md",
          "The original visible section is only the starting point.",
          "fnv1a32:server-resolved-start",
        ),
      },
    });
    expect(start.statusCode).toBe(200);
    const goalId = String((start.payload.runtime_goal_session as Record<string, unknown>).goal_id);

    const result = await dispatchRuntimeGoalWakeCandidate({
      body: {
        agent_runtime: "codex",
        turn_id: "ask:test:server-resolved-wake",
        event_kind: "visible_source_changed",
        source_kind: "docs_viewer_visible_surface",
        doc_path: "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
        active_panel_id: "docs-viewer",
        source_hash: "fnv1a32:server-resolved-new",
        reason: "docs_viewer_active_doc_changed",
        dedupe_key: "docs-viewer:docs/research/nhm2-current-status-whitepaper-2026-05-02.md:server-resolved",
        workspace_context_snapshot: visibleDocSnapshot(
          "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
          "The NHM2 document frames current status as diagnostic and artifact-limited.",
          "fnv1a32:server-resolved-new",
        ),
      },
    });

    expect(result.statusCode).toBe(200);
    expect(result.payload).toMatchObject({
      ok: true,
      goal_id: goalId,
      runtime_goal_wake_candidate: {
        goal_id: null,
        event_kind: "visible_source_changed",
      },
      runtime_goal_wake_admission: {
        status: "admitted",
        reason: "visible_source_changed",
        goal_id: goalId,
      },
      runtime_goal_wake_event: {
        goal_id: goalId,
        kind: "visible_source_changed",
      },
    });
    expect(String(result.payload.selected_final_answer)).toContain("Server-resolved wake summary");
  }, 15_000);

  it("rejects a duplicate visible source wake candidate instead of waking repeatedly", async () => {
    process.env.ENABLE_CODEX_AGENT = "1";
    process.env.CODEX_AGENT_FAKE_STDOUT = "First auto wake accepted.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const start = await routeHelixRuntimeGoalCommand({
      body: {
        agent_runtime: "codex",
        turn_id: "ask:test:auto-dup-start",
        question: "/goal Track visible source changes.",
      },
    });
    const goalId = String((start.payload.runtime_goal_session as Record<string, unknown>).goal_id);
    const candidateBody = {
      agent_runtime: "codex",
      turn_id: "ask:test:auto-dup",
      event_kind: "visible_source_changed",
      goal_id: goalId,
      source_kind: "docs_viewer_visible_surface",
      doc_path: "docs/current.md",
      active_panel_id: "docs-viewer",
      reason: "docs_viewer_active_doc_changed",
      dedupe_key: "docs-viewer:docs/current.md",
      workspace_context_snapshot: visibleDocSnapshot("docs/current.md", "Visible text."),
    };

    const first = await dispatchRuntimeGoalWakeCandidate({ body: candidateBody });
    expect(first.statusCode).toBe(200);

    const duplicate = await dispatchRuntimeGoalWakeCandidate({
      body: {
        ...candidateBody,
        turn_id: "ask:test:auto-dup-second",
      },
    });

    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.payload).toMatchObject({
      ok: false,
      blocked_reason: "duplicate_wake_candidate",
      runtime_goal_wake_admission: {
        status: "rejected",
        reason: "duplicate_wake_candidate",
        goal_id: goalId,
      },
    });
  }, 15_000);

  it("rejects source-change candidates for stopped runtime goals", async () => {
    process.env.ENABLE_CODEX_AGENT = "1";
    process.env.CODEX_AGENT_FAKE_STDOUT = "This should not run.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const start = await routeHelixRuntimeGoalCommand({
      body: {
        agent_runtime: "codex",
        turn_id: "ask:test:auto-stopped-start",
        question: "/goal Track visible source changes.",
      },
    });
    const goalId = String((start.payload.runtime_goal_session as Record<string, unknown>).goal_id);
    const stopped = helixRuntimeGoalSessionStore.stopGoalRuntimeSession({ goalId });
    expect(stopped.session.status).toBe("cancelled");

    const result = await dispatchRuntimeGoalWakeCandidate({
      body: {
        agent_runtime: "codex",
        turn_id: "ask:test:auto-stopped",
        event_kind: "visible_source_changed",
        goal_id: goalId,
        source_kind: "docs_viewer_visible_surface",
        doc_path: "docs/current.md",
        active_panel_id: "docs-viewer",
        reason: "docs_viewer_active_doc_changed",
        dedupe_key: "docs-viewer:docs/current.md:stopped",
        workspace_context_snapshot: visibleDocSnapshot("docs/current.md", "Visible text."),
      },
    });

    expect(result.statusCode).toBe(409);
    expect(result.payload).toMatchObject({
      ok: false,
      blocked_reason: "goal_not_resumable",
      runtime_goal_wake_admission: {
        status: "rejected",
        reason: "goal_not_resumable",
        goal_id: goalId,
      },
    });
  }, 15_000);

  it("keeps timer candidates policy-gated without starting a hidden loop", async () => {
    process.env.ENABLE_CODEX_AGENT = "1";
    process.env.CODEX_AGENT_FAKE_STDOUT = "Timer wake evidence inspected.";
    process.env.CODEX_AGENT_FAKE_EXIT_CODE = "0";

    const deniedStart = await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
      objective: "Track timer wakes.",
      runtimeAgentProvider: "codex",
      wakePolicy: {
        timer_ms: null,
      },
    });
    const deniedGoalId = deniedStart.session.goal_id;
    const denied = await dispatchRuntimeGoalWakeCandidate({
      body: {
        agent_runtime: "codex",
        turn_id: "ask:test:timer-denied",
        event_kind: "timer",
        goal_id: deniedGoalId,
        source_kind: "runtime_goal_timer",
        source_id: deniedGoalId,
        reason: "timer_elapsed",
        dedupe_key: `${deniedGoalId}:timer:1`,
      },
    });

    expect(denied.statusCode).toBe(409);
    expect(denied.payload).toMatchObject({
      ok: false,
      blocked_reason: "wake_policy_denied",
      runtime_goal_wake_admission: {
        status: "rejected",
        reason: "wake_policy_denied",
        goal_id: deniedGoalId,
      },
    });

    const admittedStart = await helixRuntimeGoalSessionStore.startGoalRuntimeSession({
      objective: "Track timer wakes.",
      runtimeAgentProvider: "codex",
      wakePolicy: {
        timer_ms: 30_000,
      },
    });
    const admittedGoalId = admittedStart.session.goal_id;
    const admitted = await dispatchRuntimeGoalWakeCandidate({
      body: {
        agent_runtime: "codex",
        turn_id: "ask:test:timer-admitted",
        event_kind: "timer",
        goal_id: admittedGoalId,
        source_kind: "runtime_goal_timer",
        source_id: admittedGoalId,
        reason: "timer_elapsed",
        dedupe_key: `${admittedGoalId}:timer:1`,
        workstation_gateway_call: {
          tool: "docs-viewer.read_visible_surface",
          arguments: {},
        },
      },
    });

    expect(admitted.statusCode).toBe(200);
    expect(admitted.payload).toMatchObject({
      ok: true,
      goal_id: admittedGoalId,
      runtime_goal_wake_candidate: {
        event_kind: "timer",
        reason: "timer_elapsed",
      },
      runtime_goal_wake_admission: {
        status: "admitted",
        reason: "timer_wake_admitted",
        goal_id: admittedGoalId,
      },
      runtime_goal_wake_event: {
        kind: "timer",
        goal_id: admittedGoalId,
      },
      runtime_goal_debug_summary: {
        wake_timer_status: "armed",
        wake_timer_ms: 30_000,
      },
    });
  }, 15_000);

  it("rejects source-change candidates when no runtime goal is active", async () => {
    const result = await dispatchRuntimeGoalWakeCandidate({
      body: {
        event_kind: "visible_source_changed",
        source_kind: "docs_viewer_visible_surface",
        doc_path: "docs/current.md",
        active_panel_id: "docs-viewer",
        dedupe_key: "docs-viewer:docs/current.md",
      },
    });

    expect(result.statusCode).toBe(404);
    expect(result.payload).toMatchObject({
      ok: false,
      blocked_reason: "goal_session_not_found",
      runtime_goal_wake_admission: {
        status: "rejected",
        reason: "goal_session_not_found",
      },
    });
  });
});
