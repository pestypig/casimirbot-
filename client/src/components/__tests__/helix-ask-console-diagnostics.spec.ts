import { describe, expect, it } from "vitest";

import {
  buildHelixAskConsoleAssemblyDebugSnapshot,
  formatHelixAskConsoleCapabilityLaneSummaryText,
} from "@/components/helix/ask-console/HelixAskConsoleDiagnostics";
import { createHelixAskConsoleStreamIngressDebug } from "@/lib/helix/ask-active-turn-stream";

describe("Helix Ask console diagnostics", () => {
  it("builds a recrowned console assembly snapshot with stream counters and row source meta", () => {
    const streamIngress = createHelixAskConsoleStreamIngressDebug({
      turnId: "ask:turn-1",
      traceId: "trace-1",
      startedAtMs: 100,
    });
    const snapshot = buildHelixAskConsoleAssemblyDebugSnapshot({
      askBusy: true,
      activeTurnId: "ask:turn-1",
      activeTraceId: "trace-1",
      activeStartedAtMs: 100,
      activeQuestion: "hello",
      totalLiveEventCount: 4,
      retainedLiveEventCount: 3,
      activeLiveEventCount: 3,
      visibleActiveTurnStreamRows: [
        {
          key: "row-1",
          source: "agent_work",
          label: "Model Re-entry",
          text: "Codex is evaluating the observation.",
          meta: "source live_provider_transcript | reasoning | model_reentry",
          status: "running",
          tone: "working",
          evidenceRefs: [],
        },
        {
          key: "lane-visible",
          source: "agent_work",
          label: "Lane Visible",
          text: "Lane visible: live_translation.",
          meta: "source model_visible_capability_lane_manifest | lane_visible",
          status: "available",
          tone: "working",
          evidenceRefs: [],
        },
        {
          key: "lane-requested",
          source: "agent_work",
          label: "Lane Request",
          text: "Lane requested: live_translation.translate_text.",
          meta: "source capability_lane_call_results | lane_requested",
          status: "requested",
          tone: "checkpoint",
          evidenceRefs: [],
        },
        {
          key: "lane-backend",
          source: "agent_work",
          label: "Lane Backend",
          text: "Lane backend selected: live_translation.local_runtime.",
          meta: "source capability_lane_backend_selections | lane_backend_selected",
          status: "selected",
          tone: "checkpoint",
          evidenceRefs: [],
        },
        {
          key: "lane-observed",
          source: "agent_work",
          label: "Lane Observation",
          text: "Lane observation produced a translation receipt.",
          meta: "source capability_lane_call_results | live_translation | lane_observation | runtime provider codex | adapter boundary helix_agent_provider_edge | capability live_translation.translate_text | backend live_translation.local_runtime | observation ask:lane:translation:obs | receipt ask:lane:translation:obs:projection:receipt | source payload hash sha256:source-text-a | source payload chars 2048 | source event docs:event-1 | source event ms 100 | observed 125 | freshness stale | cancelled | target es | terminal authority not_terminal_authority",
          status: "succeeded",
          tone: "observation",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-receipt",
          source: "agent_work",
          label: "Lane Receipt",
          text: "Lane projection receipt recorded for docs UI.",
          meta: "source capability_lane_projection_receipts | live_translation | lane_projection_receipt | capability live_translation.translate_text | receipt ask:lane:translation:obs:projection:receipt | terminal authority not_terminal_authority",
          status: "recorded",
          tone: "observation",
          evidenceRefs: ["ask:lane:translation:obs:projection:receipt"],
        },
        {
          key: "lane-reentered",
          source: "agent_work",
          label: "Lane Re-entry",
          text: "Observation packet re-entered provider context.",
          meta: "source capability_lane_observation_packets | lane_reentered",
          status: "reentered",
          tone: "checkpoint",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-session",
          source: "agent_work",
          label: "Lane Session",
          text: "Lane session: live_translation.",
          meta: "source capability_lane_session_debug_summaries | live_translation | lane_session | latest event lane-session-docs:start:150 | has observation false",
          status: "running",
          tone: "working",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-mail",
          source: "agent_work",
          label: "Lane Mail",
          text: "Lane mail loop: live_translation.",
          meta: "source capability_lane_mail_loop_debug_summaries | live_translation | lane_mail_loop | materialized mail evidence true | session control key lane-session-docs::document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es | source binding key document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es | mail observation key document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es::chunk-goal::ask:lane:translation:obs:projection:receipt | observation session lane-session-docs | observation ask:lane:translation:obs",
          status: "healthy",
          tone: "observation",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-goal-binding",
          source: "agent_work",
          label: "Goal Lane",
          text: "Goal lane binding: live_translation.",
          meta: "source capability_lane_goal_binding_debug_summaries | live_translation | lane_goal_binding | goal goal:account-language | goal binding goal-binding-docs | goal binding key goal:account-language::goal-binding-docs::lane-session-docs::live_translation | lane session lane-session-docs | session control key lane-session-docs::document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es | source binding key document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es | mail observation key document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es::chunk-goal::ask:lane:translation:obs:projection:receipt | source document_markdown:docs/research/nhm2.md | source hash fnv1a32:goal-docs | source kind docs | source payload hash fnv1a32:goal-source-text | source payload chars 2048 | projection docs_chunk | account locale es-US | target es | chunk u0001 | chunk index 0 | dedupe document_markdown:docs/research/nhm2.md:u0001:es | observation obs:translation-goal-binding | receipt receipt:translation-goal-binding | report summary goal lane wake on salience; reason goal_binding_policy_requests_wake_on_salience | terminal authority pending_helix_terminal_authority",
          status: "bound",
          tone: "checkpoint",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-goal-dispatch-plan",
          source: "agent_work",
          label: "Goal Dispatch",
          text: "Goal dispatch plan: live_translation; target ask_wake; target es.",
          meta: "source capability_lane_goal_dispatch_plans | live_translation | lane_goal_dispatch_plan | lane session lane-session-docs | session control key lane-session-docs::document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es | source binding key document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es | mail observation key document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es::chunk-goal::ask:lane:translation:obs:projection:receipt",
          status: "pending",
          tone: "checkpoint",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-goal-dispatch-admission",
          source: "agent_work",
          label: "Goal Admission",
          text: "Goal dispatch admission: live_translation; target ask_wake; target es.",
          meta: "source capability_lane_goal_dispatch_admissions | live_translation | lane_goal_dispatch_admission | lane session lane-session-docs | session control key lane-session-docs::document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es | source binding key document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es | mail observation key document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es::chunk-goal::ask:lane:translation:obs:projection:receipt",
          status: "pending",
          tone: "checkpoint",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "lane-goal-dispatch-readiness",
          source: "agent_work",
          label: "Goal Readiness",
          text: "Goal dispatch readiness: plans 1; next wake kinds mailbox_wake; target languages es.",
          meta: "source capability_lane_goal_dispatch_readiness | live_translation | lane_goal_dispatch_readiness | lane session lane-session-docs | session control key lane-session-docs::document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es | source binding key document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es | mail observation key document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es::chunk-goal::ask:lane:translation:obs:projection:receipt | wake kind mailbox_wake",
          status: "pending",
          tone: "checkpoint",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "terminal-selected",
          source: "final",
          label: "Terminal",
          text: "Terminal answer selected after capability lane re-entry.",
          meta: "source capability_lane_turn_timeline | helix_terminal_authority | terminal_selected | observation ask:lane:translation:obs | receipt ask:lane:translation:obs:projection:receipt | terminal authority authorized_by_helix_provider_candidate_bridge",
          status: "final",
          tone: "final",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
      ],
      replies: [
        {
          id: "reply-1",
          canonicalKey: "ask:turn-0",
          createdAtMs: 50,
        },
      ],
      latestReplyId: "reply-1",
      streamIngress,
      activeStreamDom: { rowCount: 1 },
    });

    expect(snapshot).toMatchObject({
      schema: "helix.ask.console_assembly_debug.v1",
      askBusy: true,
      activeTurnId: "ask:turn-1",
      activeLiveEventCount: 3,
      activeRowCount: 14,
      filteredLiveEvents: 1,
      streamIngress,
      renderOrder: [
        {
          kind: "active_turn_stream",
          key: "ask:turn-1",
          rowCount: 14,
          renderPlacement: "inline_active_turn",
        },
        {
          kind: "completed_reply",
          replyId: "reply-1",
          canonicalKey: "ask:turn-0",
          isLatest: true,
        },
      ],
      capabilityLaneSummary: {
        lifecycleStatus: "terminal_selected",
        visibleCount: 1,
        requestedCount: 1,
        executedCount: 4,
        backendSelectedCount: 1,
        observedCount: 1,
        receiptCount: 1,
        reenteredCount: 1,
        sessionCount: 1,
        mailLoopCount: 1,
        goalBindingCount: 1,
        goalDispatchPlanCount: 1,
        goalDispatchAdmissionCount: 1,
        goalDispatchReadinessCount: 1,
        terminalSelectedCount: 1,
        terminalRejectedCount: 0,
        stageSequence: [
          "visible",
          "requested",
          "backend_selected",
          "observed",
          "receipt",
          "reentered",
          "session",
          "mail_loop",
          "goal_binding",
          "goal_dispatch_plan",
          "goal_dispatch_admission",
          "goal_dispatch_readiness",
          "terminal_selected",
        ],
        stageSequenceText:
          "visible > requested > backend > observed > receipt > reentered > session > mail > goal > goal_plan > goal_admission > goal_readiness > terminal_selected",
        visibleLaneDoesNotMeanExecuted: true,
      },
      capabilityLaneRows: [
        {
          key: "lane-visible",
          stage: "visible",
          label: "Lane Visible",
          status: "available",
        },
        {
          key: "lane-requested",
          stage: "requested",
          label: "Lane Request",
          status: "requested",
        },
        {
          key: "lane-backend",
          stage: "backend_selected",
          label: "Lane Backend",
          status: "selected",
        },
        {
          key: "lane-observed",
          stage: "observed",
          label: "Lane Observation",
          status: "succeeded",
          detail: {
            selectedRuntimeAgentProvider: "codex",
            adapterBoundary: "helix_agent_provider_edge",
            laneId: "live_translation",
            capabilityId: "live_translation.translate_text",
            selectedBackendProvider: "live_translation.local_runtime",
            observationRef: "ask:lane:translation:obs",
            receiptRef: "ask:lane:translation:obs:projection:receipt",
            sourceEventId: "docs:event-1",
            sourceEventMs: "100",
            observedAtMs: "125",
            freshnessStatus: "stale",
            cancelRequested: "true",
            sourceTextHash: "sha256:source-text-a",
            sourceTextCharCount: "2048",
            targetLanguage: "es",
            terminalAuthorityStatus: "not_terminal_authority",
          },
        },
        {
          key: "lane-receipt",
          stage: "receipt",
          label: "Lane Receipt",
          status: "recorded",
          detail: {
            laneId: "live_translation",
            capabilityId: "live_translation.translate_text",
            receiptRef: "ask:lane:translation:obs:projection:receipt",
            terminalAuthorityStatus: "not_terminal_authority",
          },
        },
        {
          key: "lane-reentered",
          stage: "reentered",
          label: "Lane Re-entry",
          status: "reentered",
        },
        {
          key: "lane-session",
          stage: "session",
          label: "Lane Session",
          status: "running",
          detail: {
            laneId: "live_translation",
            latestEventId: "lane-session-docs:start:150",
            hasObservation: "false",
          },
        },
        {
          key: "lane-mail",
          stage: "mail_loop",
          label: "Lane Mail",
          status: "healthy",
          detail: {
            laneId: "live_translation",
            materializedMailLoopEvidence: "true",
            sessionControlKey:
              "lane-session-docs::document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es",
            sourceBindingKey: "document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es",
            latestMailLoopObservationKey:
              "document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es::chunk-goal::ask:lane:translation:obs:projection:receipt",
            observationRef: "ask:lane:translation:obs",
            observationLaneSessionId: "lane-session-docs",
          },
        },
        {
          key: "lane-goal-binding",
          stage: "goal_binding",
          label: "Goal Lane",
          status: "bound",
          detail: {
            laneId: "live_translation",
            goalId: "goal:account-language",
            goalBindingId: "goal-binding-docs",
            goalBindingKey: "goal:account-language::goal-binding-docs::lane-session-docs::live_translation",
            laneSessionId: "lane-session-docs",
            sessionControlKey:
              "lane-session-docs::document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es",
            sourceBindingKey: "document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es",
            latestMailLoopObservationKey:
              "document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es::chunk-goal::ask:lane:translation:obs:projection:receipt",
            sourceId: "document_markdown:docs/research/nhm2.md",
            sourceHash: "fnv1a32:goal-docs",
            sourceKind: "docs",
            sourceTextHash: "fnv1a32:goal-source-text",
            sourceTextCharCount: "2048",
            projectionTarget: "docs_chunk",
            accountLocale: "es-US",
            targetLanguage: "es",
            chunkId: "u0001",
            chunkIndex: "0",
            dedupeKey: "document_markdown:docs/research/nhm2.md:u0001:es",
            observationRef: "obs:translation-goal-binding",
            receiptRef: "receipt:translation-goal-binding",
            reportSummaryText:
              "goal lane wake on salience; reason goal_binding_policy_requests_wake_on_salience",
            terminalAuthorityStatus: "pending_helix_terminal_authority",
          },
        },
        {
          key: "lane-goal-dispatch-plan",
          stage: "goal_dispatch_plan",
          label: "Goal Dispatch",
          status: "pending",
          detail: {
            laneId: "live_translation",
            laneSessionId: "lane-session-docs",
            sessionControlKey:
              "lane-session-docs::document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es",
            sourceBindingKey: "document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es",
            latestMailLoopObservationKey:
              "document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es::chunk-goal::ask:lane:translation:obs:projection:receipt",
          },
        },
        {
          key: "lane-goal-dispatch-admission",
          stage: "goal_dispatch_admission",
          label: "Goal Admission",
          status: "pending",
          detail: {
            laneId: "live_translation",
            laneSessionId: "lane-session-docs",
            sessionControlKey:
              "lane-session-docs::document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es",
            sourceBindingKey: "document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es",
            latestMailLoopObservationKey:
              "document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es::chunk-goal::ask:lane:translation:obs:projection:receipt",
          },
        },
        {
          key: "lane-goal-dispatch-readiness",
          stage: "goal_dispatch_readiness",
          label: "Goal Readiness",
          status: "pending",
          detail: {
            laneId: "live_translation",
            laneSessionId: "lane-session-docs",
            sessionControlKey:
              "lane-session-docs::document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es",
            sourceBindingKey: "document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es-US::es",
            latestMailLoopObservationKey:
              "document_markdown:docs/research/nhm2.md::fnv1a32:goal-docs::docs_chunk::es::chunk-goal::ask:lane:translation:obs:projection:receipt",
            wakeKind: "mailbox_wake",
          },
        },
        {
          key: "terminal-selected",
          stage: "terminal_selected",
          label: "Terminal",
          status: "final",
          detail: {
            laneId: "helix_terminal_authority",
            observationRef: "ask:lane:translation:obs",
            receiptRef: "ask:lane:translation:obs:projection:receipt",
            terminalAuthorityStatus: "authorized_by_helix_provider_candidate_bridge",
          },
        },
      ],
    });
    expect(formatHelixAskConsoleCapabilityLaneSummaryText(snapshot.capabilityLaneSummary)).toBe(
      "Lane timeline: visible 1 / requested 1 / executed 4 / backend 1 / observed 1 / receipt 1 / re-entered 1 / session 1 / mail 1 / goal 1 / dispatch plan 1 / dispatch admission 1 / dispatch readiness 1 / terminal selected 1. Path: visible > requested > backend > observed > receipt > reentered > session > mail > goal > goal_plan > goal_admission > goal_readiness > terminal_selected. Visible lanes are available, not executed.",
    );
    expect(snapshot.capabilityLaneRows.find((row) => row.key === "lane-visible")?.detailText).toContain(
      "Visible only, not executed",
    );
    expect(snapshot.capabilityLaneRows.find((row) => row.key === "lane-observed")?.detailText).toContain(
      "Provider codex | Adapter helix_agent_provider_edge | Lane live_translation | Capability live_translation.translate_text | Backend live_translation.local_runtime",
    );
    expect(snapshot.capabilityLaneRows.find((row) => row.key === "lane-observed")?.detailText).toContain(
      "Observation ask:lane:translation:obs | Receipt ask:lane:translation:obs:projection:receipt",
    );
    expect(snapshot.capabilityLaneRows.find((row) => row.key === "lane-observed")?.detailText).toContain(
      "Source text sha256:source-text-a | Source chars 2048 | Target es | Source event docs:event-1 | Source event ms 100 | Observed 125 | Freshness stale | Cancelled",
    );
    expect(snapshot.capabilityLaneRows.find((row) => row.key === "lane-goal-binding")?.detailText).toContain(
      "Source document_markdown:docs/research/nhm2.md | Source hash fnv1a32:goal-docs | Source kind docs | Source text fnv1a32:goal-source-text | Source chars 2048 | Projection docs_chunk | Account locale es-US | Target es | Chunk u0001 | Chunk index 0 | Dedupe document_markdown:docs/research/nhm2.md:u0001:es",
    );
    expect(snapshot.capabilityLaneRows.find((row) => row.key === "lane-goal-binding")?.detailText).toContain(
      "Report goal lane wake on salience; reason goal_binding_policy_requests_wake_on_salience",
    );
    expect(snapshot.activeRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: "row-1",
        source: "agent_work",
        label: "Model Re-entry",
        status: "running",
        meta: "source live_provider_transcript | reasoning | model_reentry",
      }),
    ]));
  });

  it("marks lane manifest rows as visible only until a lane is actually requested or executed", () => {
    const snapshot = buildHelixAskConsoleAssemblyDebugSnapshot({
      askBusy: true,
      activeTurnId: "ask:turn-visible-only",
      activeTraceId: "trace-visible-only",
      activeStartedAtMs: 100,
      activeQuestion: "what lanes can you see?",
      totalLiveEventCount: 1,
      retainedLiveEventCount: 1,
      activeLiveEventCount: 1,
      visibleActiveTurnStreamRows: [
        {
          key: "lane-visible",
          source: "agent_work",
          label: "Lane Visible",
          text: "Lane visible: live_translation.",
          meta: "source model_visible_capability_lane_manifest | lane_visible",
          status: "available",
          tone: "working",
          evidenceRefs: [],
        },
      ],
      replies: [],
      latestReplyId: null,
      streamIngress: createHelixAskConsoleStreamIngressDebug({
        turnId: "ask:turn-visible-only",
        traceId: "trace-visible-only",
        startedAtMs: 100,
      }),
      activeStreamDom: { rowCount: 1 },
    });

    expect(snapshot.capabilityLaneSummary).toMatchObject({
      lifecycleStatus: "visible_only",
      visibleCount: 1,
      requestedCount: 0,
      executedCount: 0,
      backendSelectedCount: 0,
      observedCount: 0,
      reenteredCount: 0,
      terminalSelectedCount: 0,
      terminalRejectedCount: 0,
      visibleLaneDoesNotMeanExecuted: true,
    });
    expect(snapshot.capabilityLaneRows).toEqual([
      expect.objectContaining({
        key: "lane-visible",
        stage: "visible",
        status: "available",
        detailText: expect.stringContaining("Visible only, not executed"),
      }),
    ]);
  });

  it("marks persistent lane session activity without pretending a one-shot lane executed", () => {
    const snapshot = buildHelixAskConsoleAssemblyDebugSnapshot({
      askBusy: true,
      activeTurnId: "ask:turn-session-only",
      activeTraceId: "trace-session-only",
      activeStartedAtMs: 100,
      activeQuestion: "keep translating this document",
      totalLiveEventCount: 1,
      retainedLiveEventCount: 1,
      activeLiveEventCount: 1,
      visibleActiveTurnStreamRows: [
        {
          key: "lane-session",
          source: "agent_work",
          label: "Lane Session",
          text: "Lane session: live_translation.",
          meta: "source capability_lane_session_debug_summaries | live_translation | lane_session | action record_observation | session control key lane-session-docs::docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es | source binding key docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es | observation key docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es::chunk-1::ask:lane:translation:obs:projection:receipt",
          status: "running",
          tone: "working",
          evidenceRefs: [],
        },
      ],
      replies: [],
      latestReplyId: null,
      streamIngress: createHelixAskConsoleStreamIngressDebug({
        turnId: "ask:turn-session-only",
        traceId: "trace-session-only",
        startedAtMs: 100,
      }),
      activeStreamDom: { rowCount: 1 },
    });

    expect(snapshot.capabilityLaneSummary).toMatchObject({
      lifecycleStatus: "session_active",
      requestedCount: 0,
      executedCount: 0,
      backendSelectedCount: 0,
      observedCount: 0,
      reenteredCount: 0,
      sessionCount: 1,
      terminalSelectedCount: 0,
      terminalRejectedCount: 0,
      visibleLaneDoesNotMeanExecuted: true,
    });
    expect(snapshot.capabilityLaneRows[0]?.detail).toMatchObject({
      laneId: "live_translation",
      sessionLifecycleAction: "record_observation",
      sessionControlKey:
        "lane-session-docs::docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es",
      sourceBindingKey: "docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es",
      latestObservationKey:
        "docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es::chunk-1::ask:lane:translation:obs:projection:receipt",
    });
    expect(snapshot.capabilityLaneRows[0]?.detailText).toContain(
      "Action record_observation | Session control lane-session-docs::docs:nhm2::sha256:doc-a::docs_viewer.inline_translation::es-US::es",
    );
  });

  it("marks lane terminal authority rejections separately from selected terminals", () => {
    const snapshot = buildHelixAskConsoleAssemblyDebugSnapshot({
      askBusy: true,
      activeTurnId: "ask:turn-terminal-rejected",
      activeTraceId: "trace-terminal-rejected",
      activeStartedAtMs: 100,
      activeQuestion: "translate this into Spanish",
      totalLiveEventCount: 3,
      retainedLiveEventCount: 3,
      activeLiveEventCount: 3,
      visibleActiveTurnStreamRows: [
        {
          key: "lane-visible",
          source: "agent_work",
          label: "Lane Visible",
          text: "Lane visible: live_translation.",
          meta: "source model_visible_capability_lane_manifest | lane_visible",
          status: "available",
          tone: "working",
          evidenceRefs: [],
        },
        {
          key: "lane-observed",
          source: "agent_work",
          label: "Lane Observation",
          text: "Lane observation produced a translation receipt.",
          meta: "source capability_lane_call_results | lane_observation",
          status: "succeeded",
          tone: "observation",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
        {
          key: "terminal-rejected",
          source: "final",
          label: "Terminal",
          text: "Terminal authority rejected direct lane output.",
          meta: "source capability_lane_call_results | terminal_rejected | terminal_authority_missing",
          status: "rejected",
          tone: "error",
          evidenceRefs: ["ask:lane:translation:obs"],
        },
      ],
      replies: [],
      latestReplyId: null,
      streamIngress: createHelixAskConsoleStreamIngressDebug({
        turnId: "ask:turn-terminal-rejected",
        traceId: "trace-terminal-rejected",
        startedAtMs: 100,
      }),
      activeStreamDom: { rowCount: 3 },
    });

    expect(snapshot.capabilityLaneSummary).toMatchObject({
      lifecycleStatus: "terminal_rejected",
      visibleCount: 1,
      executedCount: 1,
      observedCount: 1,
      terminalSelectedCount: 0,
      terminalRejectedCount: 1,
      visibleLaneDoesNotMeanExecuted: true,
    });
    expect(snapshot.capabilityLaneRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        key: "terminal-rejected",
        stage: "terminal_rejected",
        label: "Terminal",
        status: "rejected",
      }),
    ]));
  });

  it("marks mail-loop and goal-bound lane activity as lifecycle states", () => {
    const mailLoopSnapshot = buildHelixAskConsoleAssemblyDebugSnapshot({
      askBusy: true,
      activeTurnId: "ask:turn-mail-loop",
      activeTraceId: "trace-mail-loop",
      activeStartedAtMs: 100,
      activeQuestion: "watch translated source events",
      totalLiveEventCount: 1,
      retainedLiveEventCount: 1,
      activeLiveEventCount: 1,
      visibleActiveTurnStreamRows: [
        {
          key: "lane-mail",
          source: "agent_work",
          label: "Lane Mail",
          text: "Lane mail loop: live_translation.",
          meta: "source capability_lane_mail_loop_debug_summaries | lane_mail_loop",
          status: "healthy",
          tone: "observation",
          evidenceRefs: [],
        },
      ],
      replies: [],
      latestReplyId: null,
      streamIngress: createHelixAskConsoleStreamIngressDebug({
        turnId: "ask:turn-mail-loop",
        traceId: "trace-mail-loop",
        startedAtMs: 100,
      }),
      activeStreamDom: { rowCount: 1 },
    });
    const goalSnapshot = buildHelixAskConsoleAssemblyDebugSnapshot({
      askBusy: true,
      activeTurnId: "ask:turn-goal-bound",
      activeTraceId: "trace-goal-bound",
      activeStartedAtMs: 100,
      activeQuestion: "keep this translation goal active",
      totalLiveEventCount: 1,
      retainedLiveEventCount: 1,
      activeLiveEventCount: 1,
      visibleActiveTurnStreamRows: [
        {
          key: "lane-goal",
          source: "agent_work",
          label: "Goal Lane",
          text: "Goal lane binding: live_translation.",
          meta: "source capability_lane_goal_binding_debug_summaries | lane_goal_binding",
          status: "bound",
          tone: "checkpoint",
          evidenceRefs: [],
        },
      ],
      replies: [],
      latestReplyId: null,
      streamIngress: createHelixAskConsoleStreamIngressDebug({
        turnId: "ask:turn-goal-bound",
        traceId: "trace-goal-bound",
        startedAtMs: 100,
      }),
      activeStreamDom: { rowCount: 1 },
    });

    expect(mailLoopSnapshot.capabilityLaneSummary).toMatchObject({
      lifecycleStatus: "mail_loop_active",
      mailLoopCount: 1,
      requestedCount: 0,
      executedCount: 0,
      observedCount: 0,
      visibleLaneDoesNotMeanExecuted: true,
    });
    expect(goalSnapshot.capabilityLaneSummary).toMatchObject({
      lifecycleStatus: "goal_bound",
      goalBindingCount: 1,
      requestedCount: 0,
      executedCount: 0,
      observedCount: 0,
      visibleLaneDoesNotMeanExecuted: true,
    });
  });

  it("keeps inactive diagnostic rows out of active row counts", () => {
    const snapshot = buildHelixAskConsoleAssemblyDebugSnapshot({
      askBusy: false,
      activeTurnId: "ask:turn-1",
      activeTraceId: "trace-1",
      activeStartedAtMs: 100,
      activeQuestion: "hello",
      totalLiveEventCount: 4,
      retainedLiveEventCount: 4,
      activeLiveEventCount: 4,
      visibleActiveTurnStreamRows: [
        {
          key: "stale-row",
          source: "agent_work",
          label: "Thinking",
          text: "Stale row",
          meta: "source live_provider_transcript",
          status: "running",
          tone: "working",
          evidenceRefs: [],
        },
      ],
      replies: [],
      latestReplyId: null,
      streamIngress: createHelixAskConsoleStreamIngressDebug(),
      activeStreamDom: null,
    });

    expect(snapshot.activeLiveEventCount).toBe(0);
    expect(snapshot.activeRowCount).toBe(0);
    expect(snapshot.renderOrder).toEqual([]);
    expect(snapshot.activeRows).toEqual([]);
    expect(snapshot.capabilityLaneSummary.visibleCount).toBe(0);
    expect(snapshot.capabilityLaneSummary.executedCount).toBe(0);
    expect(snapshot.capabilityLaneSummary.lifecycleStatus).toBe("none");
    expect(snapshot.capabilityLaneRows).toEqual([]);
  });

  it("preserves stream ingress counters without keeping completed turns marked active", () => {
    const streamIngress = createHelixAskConsoleStreamIngressDebug({
      turnId: "ask:turn-1",
      traceId: "trace-1",
      startedAtMs: 100,
    });
    streamIngress.rawStreamPacketCount = 8;
    streamIngress.transcriptPacketCount = 7;
    streamIngress.acceptedLiveEventCount = 6;
    streamIngress.replayedTranscriptEventCount = 0;
    streamIngress.droppedEventCount = 0;

    const snapshot = buildHelixAskConsoleAssemblyDebugSnapshot({
      askBusy: false,
      activeTurnId: "ask:turn-1",
      activeTraceId: "trace-1",
      activeStartedAtMs: 100,
      activeQuestion: "solve 19*23",
      totalLiveEventCount: 6,
      retainedLiveEventCount: 6,
      activeLiveEventCount: 6,
      visibleActiveTurnStreamRows: [
        {
          key: "live-row",
          source: "agent_work",
          label: "Tool Observation",
          text: "Calculator observed 19*23 = 437.",
          meta: "source live_provider_transcript",
          status: "completed",
          tone: "observation",
          evidenceRefs: [],
        },
      ],
      replies: [
        {
          id: "ask:turn-1",
          canonicalKey: "ask:turn-1",
          createdAtMs: 200,
        },
      ],
      latestReplyId: "ask:turn-1",
      streamIngress,
      activeStreamDom: {
        activeStreamMounted: false,
        activeStreamHandoffState: "completed_reply",
        quietGapRowVisible: false,
      },
    });

    expect(snapshot.askBusy).toBe(false);
    expect(snapshot.activeRowCount).toBe(0);
    expect(snapshot.activeRows).toEqual([]);
    expect(snapshot.streamIngress).toMatchObject({
      rawStreamPacketCount: 8,
      transcriptPacketCount: 7,
      acceptedLiveEventCount: 6,
      replayedTranscriptEventCount: 0,
      droppedEventCount: 0,
    });
    expect(snapshot.renderOrder).toEqual([
      expect.objectContaining({
        kind: "completed_reply",
        replyId: "ask:turn-1",
        canonicalKey: "ask:turn-1",
        isLatest: true,
      }),
    ]);
    expect(snapshot.activeStreamDom).toMatchObject({
      activeStreamMounted: false,
      activeStreamHandoffState: "completed_reply",
      quietGapRowVisible: false,
    });
  });
});
