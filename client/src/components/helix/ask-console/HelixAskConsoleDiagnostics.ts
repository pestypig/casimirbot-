import type {
  HelixAskConsoleStreamIngressDebug,
  HelixContinuousTurnStreamRow,
} from "@/lib/helix/ask-active-turn-stream";

export type HelixAskConsoleDiagnosticsReply = {
  id: string;
  canonicalKey: string;
  createdAtMs: number;
};

export type HelixAskConsoleDiagnosticsActiveDom = Record<string, unknown> | null;

export type HelixAskConsoleCapabilityLaneRowStage =
  | "visible"
  | "requested"
  | "backend_selected"
  | "observed"
  | "reentered"
  | "session"
  | "mail_loop"
  | "goal_binding"
  | "goal_dispatch_plan"
  | "goal_dispatch_admission"
  | "goal_dispatch_readiness"
  | "terminal_selected"
  | "terminal_rejected";

export type HelixAskConsoleCapabilityLaneSummary = {
  lifecycleStatus:
    | "none"
    | "visible_only"
    | "requested"
    | "executed"
    | "reentered"
    | "session_active"
    | "mail_loop_active"
    | "goal_bound"
    | "terminal_selected"
    | "terminal_rejected";
  visibleCount: number;
  requestedCount: number;
  backendSelectedCount: number;
  observedCount: number;
  reenteredCount: number;
  sessionCount: number;
  mailLoopCount: number;
  goalBindingCount: number;
  goalDispatchPlanCount: number;
  goalDispatchAdmissionCount: number;
  goalDispatchReadinessCount: number;
  terminalSelectedCount: number;
  terminalRejectedCount: number;
  visibleLaneDoesNotMeanExecuted: true;
};

export type HelixAskConsoleAssemblyDebugSnapshot = {
  schema: "helix.ask.console_assembly_debug.v1";
  askBusy: boolean;
  activeTurnId: string | null;
  activeTraceId: string | null;
  activeStartedAtMs: number | null;
  activeQuestion: string;
  totalLiveEventCount: number;
  retainedLiveEventCount: number;
  activeLiveEventCount: number;
  activeRowCount: number;
  replyCount: number;
  latestReplyId: string | null;
  streamIngress: HelixAskConsoleStreamIngressDebug;
  activeStreamDom: HelixAskConsoleDiagnosticsActiveDom;
  renderOrder: Array<
    | {
        kind: "active_turn_stream";
        key: string;
        rowCount: number;
        renderPlacement: "inline_active_turn";
      }
    | {
        kind: "completed_reply";
        index: number;
        replyId: string;
        canonicalKey: string;
        createdAtMs: number;
        isLatest: boolean;
      }
  >;
  filteredLiveEvents: number;
  activeRows: Array<{
    index: number;
    key: string;
    source: HelixContinuousTurnStreamRow["source"];
    label: string;
    status: string;
    text: string;
    meta: string;
  }>;
  capabilityLaneSummary: HelixAskConsoleCapabilityLaneSummary;
  capabilityLaneRows: Array<{
    index: number;
    key: string;
    stage: HelixAskConsoleCapabilityLaneRowStage;
    label: string;
    status: string;
    text: string;
    meta: string;
  }>;
};

function clipDiagnosticText(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(0, limit - 3))}...`;
}

export function resolveHelixAskConsoleCapabilityLaneRowStage(
  row: HelixContinuousTurnStreamRow,
): HelixAskConsoleCapabilityLaneRowStage | null {
  const label = row.label.toLowerCase();
  const haystack = `${row.label} ${row.status} ${row.meta} ${row.text}`.toLowerCase();
  if (label === "lane visible" || haystack.includes("source_event_type\":\"lane_visible")) {
    return "visible";
  }
  if (label === "lane request" || haystack.includes("source_event_type\":\"lane_requested")) {
    return "requested";
  }
  if (label === "lane backend" || haystack.includes("source_event_type\":\"lane_backend_selected")) {
    return "backend_selected";
  }
  if (label === "lane observation" || haystack.includes("source_event_type\":\"lane_observation")) {
    return "observed";
  }
  if (label === "lane re-entry" || haystack.includes("source_event_type\":\"lane_reentered")) {
    return "reentered";
  }
  if (label === "lane session" || haystack.includes("source_event_type\":\"lane_session")) {
    return "session";
  }
  if (label === "lane mail" || haystack.includes("source_event_type\":\"lane_mail_loop")) {
    return "mail_loop";
  }
  if (label === "goal lane" || haystack.includes("source_event_type\":\"lane_goal_binding")) {
    return "goal_binding";
  }
  if (label === "goal dispatch" || haystack.includes("source_event_type\":\"lane_goal_dispatch_plan")) {
    return "goal_dispatch_plan";
  }
  if (label === "goal admission" || haystack.includes("source_event_type\":\"lane_goal_dispatch_admission")) {
    return "goal_dispatch_admission";
  }
  if (label === "goal readiness" || haystack.includes("source_event_type\":\"lane_goal_dispatch_readiness")) {
    return "goal_dispatch_readiness";
  }
  if (
    label === "terminal" &&
    (haystack.includes("terminal_rejected") ||
      haystack.includes("terminal rejected") ||
      haystack.includes("terminal_authority_missing") ||
      haystack.includes("terminal authority missing")) &&
    (haystack.includes("capability_lane") || haystack.includes("lane"))
  ) {
    return "terminal_rejected";
  }
  if (
    label === "terminal" &&
    (haystack.includes("capability_lane") || haystack.includes("terminal_selected"))
  ) {
    return "terminal_selected";
  }
  return null;
}

export function buildHelixAskConsoleCapabilityLaneSummary(
  rows: Array<{ stage: HelixAskConsoleCapabilityLaneRowStage }>,
): HelixAskConsoleCapabilityLaneSummary {
  const visibleCount = rows.filter((row) => row.stage === "visible").length;
  const requestedCount = rows.filter((row) => row.stage === "requested").length;
  const backendSelectedCount = rows.filter((row) => row.stage === "backend_selected").length;
  const observedCount = rows.filter((row) => row.stage === "observed").length;
  const reenteredCount = rows.filter((row) => row.stage === "reentered").length;
  const sessionCount = rows.filter((row) => row.stage === "session").length;
  const mailLoopCount = rows.filter((row) => row.stage === "mail_loop").length;
  const goalBindingCount = rows.filter((row) => row.stage === "goal_binding").length;
  const goalDispatchPlanCount = rows.filter((row) => row.stage === "goal_dispatch_plan").length;
  const goalDispatchAdmissionCount = rows.filter((row) => row.stage === "goal_dispatch_admission").length;
  const goalDispatchReadinessCount = rows.filter((row) => row.stage === "goal_dispatch_readiness").length;
  const terminalSelectedCount = rows.filter((row) => row.stage === "terminal_selected").length;
  const terminalRejectedCount = rows.filter((row) => row.stage === "terminal_rejected").length;
  const hasGoalActivity =
    goalBindingCount > 0 ||
    goalDispatchPlanCount > 0 ||
    goalDispatchAdmissionCount > 0 ||
    goalDispatchReadinessCount > 0;
  const lifecycleStatus =
    terminalSelectedCount > 0
      ? "terminal_selected"
      : terminalRejectedCount > 0
        ? "terminal_rejected"
      : reenteredCount > 0
        ? "reentered"
        : observedCount > 0 || backendSelectedCount > 0
          ? "executed"
          : requestedCount > 0
            ? "requested"
            : hasGoalActivity
              ? "goal_bound"
              : mailLoopCount > 0
                ? "mail_loop_active"
                : sessionCount > 0
                  ? "session_active"
                  : visibleCount > 0
                    ? "visible_only"
                    : "none";
  return {
    lifecycleStatus,
    visibleCount,
    requestedCount,
    backendSelectedCount,
    observedCount,
    reenteredCount,
    sessionCount,
    mailLoopCount,
    goalBindingCount,
    goalDispatchPlanCount,
    goalDispatchAdmissionCount,
    goalDispatchReadinessCount,
    terminalSelectedCount,
    terminalRejectedCount,
    visibleLaneDoesNotMeanExecuted: true,
  };
}

export function buildHelixAskConsoleAssemblyDebugSnapshot(input: {
  askBusy: boolean;
  activeTurnId: string | null;
  activeTraceId: string | null;
  activeStartedAtMs: number | null;
  activeQuestion: string;
  totalLiveEventCount: number;
  retainedLiveEventCount: number;
  activeLiveEventCount: number;
  visibleActiveTurnStreamRows: HelixContinuousTurnStreamRow[];
  replies: HelixAskConsoleDiagnosticsReply[];
  latestReplyId: string | null;
  streamIngress: HelixAskConsoleStreamIngressDebug;
  activeStreamDom: HelixAskConsoleDiagnosticsActiveDom;
}): HelixAskConsoleAssemblyDebugSnapshot {
  const activeRows = input.askBusy && input.activeTurnId ? input.visibleActiveTurnStreamRows : [];
  const capabilityLaneRows = activeRows
    .map((row, index) => {
      const stage = resolveHelixAskConsoleCapabilityLaneRowStage(row);
      if (!stage) return null;
      return {
        index,
        key: row.key,
        stage,
        label: row.label,
        status: row.status,
        text: clipDiagnosticText(row.text, 180),
        meta: clipDiagnosticText(row.meta, 240),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
  return {
    schema: "helix.ask.console_assembly_debug.v1",
    askBusy: input.askBusy,
    activeTurnId: input.activeTurnId,
    activeTraceId: input.activeTraceId,
    activeStartedAtMs: input.activeStartedAtMs,
    activeQuestion: input.activeQuestion,
    totalLiveEventCount: input.totalLiveEventCount,
    retainedLiveEventCount: input.retainedLiveEventCount,
    activeLiveEventCount: input.askBusy && input.activeTurnId ? input.activeLiveEventCount : 0,
    activeRowCount: activeRows.length,
    replyCount: input.replies.length,
    latestReplyId: input.latestReplyId,
    streamIngress: input.streamIngress,
    activeStreamDom: input.activeStreamDom,
    renderOrder: [
      ...(input.askBusy && input.visibleActiveTurnStreamRows.length > 0
        ? [
            {
              kind: "active_turn_stream" as const,
              key: input.activeTurnId ?? input.activeTraceId ?? "active",
              rowCount: input.visibleActiveTurnStreamRows.length,
              renderPlacement: "inline_active_turn" as const,
            },
          ]
        : []),
      ...input.replies.map((reply, index) => ({
        kind: "completed_reply" as const,
        index,
        replyId: reply.id,
        canonicalKey: reply.canonicalKey,
        createdAtMs: reply.createdAtMs,
        isLatest: reply.id === input.latestReplyId,
      })),
    ],
    filteredLiveEvents: Math.max(0, input.totalLiveEventCount - input.retainedLiveEventCount),
    activeRows: activeRows.map((row, index) => ({
      index,
      key: row.key,
      source: row.source,
      label: row.label,
      status: row.status,
      text: clipDiagnosticText(row.text, 180),
      meta: clipDiagnosticText(row.meta, 240),
    })),
    capabilityLaneSummary: buildHelixAskConsoleCapabilityLaneSummary(capabilityLaneRows),
    capabilityLaneRows,
  };
}
