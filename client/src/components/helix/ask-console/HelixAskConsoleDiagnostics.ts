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
  | "receipt"
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
  executedCount: number;
  backendSelectedCount: number;
  observedCount: number;
  receiptCount: number;
  reenteredCount: number;
  sessionCount: number;
  mailLoopCount: number;
  goalBindingCount: number;
  goalDispatchPlanCount: number;
  goalDispatchAdmissionCount: number;
  goalDispatchReadinessCount: number;
  terminalSelectedCount: number;
  terminalRejectedCount: number;
  stageSequence: HelixAskConsoleCapabilityLaneRowStage[];
  stageSequenceText: string;
  visibleLaneDoesNotMeanExecuted: true;
};

export type HelixAskConsoleCapabilityLaneRowDetail = {
  normalizedStage: string | null;
  stateLabel: string | null;
  selectedRuntimeAgentProvider: string | null;
  adapterBoundary: string | null;
  laneId: string | null;
  capabilityId: string | null;
  selectedBackendProvider: string | null;
  observationRef: string | null;
  receiptRef: string | null;
  sourceId: string | null;
  sourceHash: string | null;
  sourceKind: string | null;
  sourceTextHash: string | null;
  sourceTextCharCount: string | null;
  projectionKey: string | null;
  projectionTarget: string | null;
  accountLocale: string | null;
  targetLanguage: string | null;
  chunkId: string | null;
  chunkIndex: string | null;
  dedupeKey: string | null;
  sourceEventId: string | null;
  sourceEventMs: string | null;
  observedAtMs: string | null;
  freshnessStatus: string | null;
  cancelRequested: string | null;
  goalId: string | null;
  goalBindingId: string | null;
  goalBindingKey: string | null;
  bindingStatus: string | null;
  activationPolicy: string | null;
  attentionPolicy: string | null;
  stopCondition: string | null;
  reportPolicy: string | null;
  quietBehavior: string | null;
  reportAction: string | null;
  reportReason: string | null;
  laneSessionId: string | null;
  sessionStatus: string | null;
  sessionHealth: string | null;
  sessionLifecycleAction: string | null;
  blockedReason: string | null;
  sessionControlKey: string | null;
  sourceBindingKey: string | null;
  latestObservationKey: string | null;
  latestMailLoopObservationKey: string | null;
  latestEventId: string | null;
  stagePlayMailId: string | null;
  stagePlayMailDeliveryStatus: string | null;
  previousStagePlayMailId: string | null;
  mailboxThreadId: string | null;
  mailStatus: string | null;
  wakeKind: string | null;
  materializedMailLoopEvidence: string | null;
  hasObservation: string | null;
  observationLaneSessionId: string | null;
  reportSummaryText: string | null;
  terminalAuthorityStatus: string | null;
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
    detail: HelixAskConsoleCapabilityLaneRowDetail;
    detailText: string | null;
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
  const hasStage = (stage: string): boolean =>
    haystack.includes(`source_event_type":"${stage}`) ||
    haystack.includes(`"stage":"${stage}`) ||
    haystack.includes(`stage ${stage}`);
  if (label === "lane state" || hasStage("lane_console_state")) {
    if (
      haystack.includes("state terminal_rejected") ||
      haystack.includes("normalized stage terminal_rejected") ||
      haystack.includes("terminal authority missing")
    ) {
      return "terminal_rejected";
    }
    if (haystack.includes("state terminal_selected") || haystack.includes("normalized stage terminal_selected")) {
      return "terminal_selected";
    }
    if (haystack.includes("normalized stage reentered") || haystack.includes("state reentered")) {
      return "reentered";
    }
    if (haystack.includes("normalized stage receipt") || haystack.includes("state receipt")) {
      return "receipt";
    }
    if (
      haystack.includes("normalized stage observed") ||
      haystack.includes("state observed") ||
      haystack.includes("observed_pending_reentry")
    ) {
      return "observed";
    }
    if (haystack.includes("normalized stage backend") || haystack.includes("state backend")) {
      return "backend_selected";
    }
    if (haystack.includes("normalized stage requested") || haystack.includes("state requested")) {
      return "requested";
    }
    if (haystack.includes("normalized stage visible") || haystack.includes("visible_only")) {
      return "visible";
    }
  }
  if (label === "lane visible" || hasStage("lane_visible")) {
    return "visible";
  }
  if (label === "lane request" || hasStage("lane_requested")) {
    return "requested";
  }
  if (label === "lane backend" || hasStage("lane_backend_selected")) {
    return "backend_selected";
  }
  if (label === "lane observation" || hasStage("lane_observation")) {
    return "observed";
  }
  if (label === "lane receipt" || hasStage("lane_projection_receipt")) {
    return "receipt";
  }
  if (label === "lane re-entry" || hasStage("lane_reentered")) {
    return "reentered";
  }
  if (label === "lane session" || hasStage("lane_session")) {
    return "session";
  }
  if (label === "lane mail" || hasStage("lane_mail_loop")) {
    return "mail_loop";
  }
  if (label === "goal lane" || hasStage("lane_goal_binding")) {
    return "goal_binding";
  }
  if (label === "goal dispatch" || hasStage("lane_goal_dispatch_plan")) {
    return "goal_dispatch_plan";
  }
  if (label === "goal admission" || hasStage("lane_goal_dispatch_admission")) {
    return "goal_dispatch_admission";
  }
  if (label === "goal readiness" || hasStage("lane_goal_dispatch_readiness")) {
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

const laneStageTokens = new Set<string>([
  "lane_visible",
  "lane_requested",
  "lane_backend_selected",
  "lane_observation",
  "lane_projection_receipt",
  "lane_reentered",
  "lane_session",
  "lane_mail_loop",
  "lane_goal_binding",
  "lane_goal_dispatch_plan",
  "lane_goal_dispatch_admission",
  "lane_goal_dispatch_readiness",
  "terminal_selected",
  "terminal_rejected",
]);

const readMetaTokenValue = (tokens: string[], prefix: string): string | null => {
  const token = tokens.find((entry) => {
    const normalized = entry.toLowerCase();
    if (prefix === "observation " && normalized.startsWith("observation session ")) return false;
    if (prefix === "source event " && normalized.startsWith("source event ms ")) return false;
    return normalized.startsWith(prefix);
  });
  return token ? token.slice(prefix.length).trim() || null : null;
};

const readSourceIdMetaToken = (tokens: string[]): string | null => {
  const explicit = readMetaTokenValue(tokens, "source id ");
  if (explicit) return explicit;
  const genericSources = tokens
    .map((entry) => entry.trim())
    .filter((entry) => {
      const normalized = entry.toLowerCase();
      return (
        normalized.startsWith("source ") &&
        !normalized.startsWith("source hash ") &&
        !normalized.startsWith("source kind ") &&
        !normalized.startsWith("source payload ") &&
        !normalized.startsWith("source text ") &&
        !normalized.startsWith("source projection ") &&
        !normalized.startsWith("source event ")
      );
    })
    .map((entry) => entry.slice("source ".length).trim())
    .filter((entry) => entry.includes(":") || entry.includes("/") || entry.includes("\\"));
  return genericSources.length > 0 ? genericSources[genericSources.length - 1] : null;
};

const readProjectionTargetMetaToken = (tokens: string[]): string | null =>
  readMetaTokenValue(tokens, "projection target ") ||
  readMetaTokenValue(tokens, "source projection ") ||
  readMetaTokenValue(tokens, "latest projection ") ||
  readMetaTokenValue(tokens, "projection ");

export function resolveHelixAskConsoleCapabilityLaneRowDetail(
  row: HelixContinuousTurnStreamRow,
): HelixAskConsoleCapabilityLaneRowDetail {
  const tokens = row.meta
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const laneId = tokens.find((entry) => {
    const normalized = entry.toLowerCase();
    if (normalized.startsWith("source ")) return false;
    if (laneStageTokens.has(normalized)) return false;
    if (normalized.includes(" ")) return false;
    return /^[a-z][a-z0-9_-]*$/.test(normalized);
  }) ?? null;
  return {
    normalizedStage: readMetaTokenValue(tokens, "normalized stage "),
    stateLabel: readMetaTokenValue(tokens, "state "),
    selectedRuntimeAgentProvider:
      readMetaTokenValue(tokens, "runtime provider ") ||
      readMetaTokenValue(tokens, "selected runtime ") ||
      readMetaTokenValue(tokens, "agent provider "),
    adapterBoundary:
      readMetaTokenValue(tokens, "adapter boundary ") ||
      readMetaTokenValue(tokens, "adapter "),
    laneId,
    capabilityId: readMetaTokenValue(tokens, "capability "),
    selectedBackendProvider: readMetaTokenValue(tokens, "backend "),
    observationRef: readMetaTokenValue(tokens, "observation "),
    receiptRef: readMetaTokenValue(tokens, "receipt "),
    sourceId: readSourceIdMetaToken(tokens),
    sourceHash: readMetaTokenValue(tokens, "source hash "),
    sourceKind: readMetaTokenValue(tokens, "source kind "),
    sourceTextHash:
      readMetaTokenValue(tokens, "source text hash ") ||
      readMetaTokenValue(tokens, "source payload hash "),
    sourceTextCharCount:
      readMetaTokenValue(tokens, "source text char count ") ||
      readMetaTokenValue(tokens, "source payload chars "),
    projectionKey: readMetaTokenValue(tokens, "projection key "),
    projectionTarget: readProjectionTargetMetaToken(tokens),
    accountLocale: readMetaTokenValue(tokens, "account locale "),
    targetLanguage:
      readMetaTokenValue(tokens, "target ") ||
      readMetaTokenValue(tokens, "language "),
    chunkId: readMetaTokenValue(tokens, "chunk "),
    chunkIndex: readMetaTokenValue(tokens, "chunk index "),
    dedupeKey: readMetaTokenValue(tokens, "dedupe "),
    sourceEventId: readMetaTokenValue(tokens, "source event "),
    sourceEventMs: readMetaTokenValue(tokens, "source event ms "),
    observedAtMs: readMetaTokenValue(tokens, "observed "),
    freshnessStatus: readMetaTokenValue(tokens, "freshness "),
    cancelRequested: tokens.some((entry) => entry.toLowerCase() === "cancelled") ? "true" : null,
    goalId: readMetaTokenValue(tokens, "goal "),
    goalBindingId: readMetaTokenValue(tokens, "goal binding "),
    goalBindingKey: readMetaTokenValue(tokens, "goal binding key "),
    bindingStatus:
      readMetaTokenValue(tokens, "binding status ") ||
      readMetaTokenValue(tokens, "binding "),
    activationPolicy: readMetaTokenValue(tokens, "activation policy "),
    attentionPolicy: readMetaTokenValue(tokens, "attention policy "),
    stopCondition: readMetaTokenValue(tokens, "stop condition "),
    reportPolicy: readMetaTokenValue(tokens, "report policy "),
    quietBehavior: readMetaTokenValue(tokens, "quiet behavior "),
    reportAction: readMetaTokenValue(tokens, "report action "),
    reportReason: readMetaTokenValue(tokens, "report reason "),
    laneSessionId: readMetaTokenValue(tokens, "lane session "),
    sessionStatus: readMetaTokenValue(tokens, "session status "),
    sessionHealth: readMetaTokenValue(tokens, "session health "),
    sessionLifecycleAction:
      readMetaTokenValue(tokens, "session lifecycle action ") ||
      readMetaTokenValue(tokens, "lifecycle action ") ||
      readMetaTokenValue(tokens, "session action ") ||
      readMetaTokenValue(tokens, "action "),
    blockedReason:
      readMetaTokenValue(tokens, "blocked reason ") ||
      readMetaTokenValue(tokens, "blocked "),
    sessionControlKey: readMetaTokenValue(tokens, "session control key "),
    sourceBindingKey: readMetaTokenValue(tokens, "source binding key "),
    latestObservationKey: readMetaTokenValue(tokens, "observation key "),
    latestMailLoopObservationKey:
      readMetaTokenValue(tokens, "mail observation key ") ||
      readMetaTokenValue(tokens, "mail loop observation key "),
    latestEventId: readMetaTokenValue(tokens, "latest event "),
    stagePlayMailId:
      readMetaTokenValue(tokens, "stage play mail ") ||
      readMetaTokenValue(tokens, "stage play mail id ") ||
      readMetaTokenValue(tokens, "mail id "),
    stagePlayMailDeliveryStatus:
      readMetaTokenValue(tokens, "delivery status ") ||
      readMetaTokenValue(tokens, "mail delivery status ") ||
      readMetaTokenValue(tokens, "stage play mail delivery status "),
    previousStagePlayMailId:
      readMetaTokenValue(tokens, "previous stage play mail ") ||
      readMetaTokenValue(tokens, "previous mail "),
    mailboxThreadId:
      readMetaTokenValue(tokens, "mailbox thread ") ||
      readMetaTokenValue(tokens, "mailbox thread id "),
    mailStatus: readMetaTokenValue(tokens, "mail status "),
    wakeKind: readMetaTokenValue(tokens, "wake kind "),
    materializedMailLoopEvidence: readMetaTokenValue(tokens, "materialized mail evidence "),
    hasObservation: readMetaTokenValue(tokens, "has observation "),
    observationLaneSessionId: readMetaTokenValue(tokens, "observation session "),
    reportSummaryText: readMetaTokenValue(tokens, "report summary "),
    terminalAuthorityStatus: readMetaTokenValue(tokens, "terminal authority "),
  };
}

export function formatHelixAskConsoleCapabilityLaneStageDisplayText(
  stage: HelixAskConsoleCapabilityLaneRowStage,
): string {
  switch (stage) {
    case "visible":
      return "available only";
    case "requested":
      return "requested by runtime";
    case "backend_selected":
      return "backend selected";
    case "observed":
      return "observation produced";
    case "receipt":
      return "receipt produced";
    case "reentered":
      return "observation re-entered";
    case "session":
      return "session active";
    case "mail_loop":
      return "mail loop active";
    case "goal_binding":
      return "goal bound";
    case "goal_dispatch_plan":
      return "dispatch planned";
    case "goal_dispatch_admission":
      return "dispatch admitted";
    case "goal_dispatch_readiness":
      return "dispatch readiness";
    case "terminal_selected":
      return "terminal selected";
    case "terminal_rejected":
      return "terminal rejected";
  }
}

export function formatHelixAskConsoleCapabilityLaneRowDetailText(
  stage: HelixAskConsoleCapabilityLaneRowStage,
  detail: HelixAskConsoleCapabilityLaneRowDetail,
): string | null {
  const parts = [
    detail.stateLabel ? `State ${detail.stateLabel}` : "",
    detail.normalizedStage ? `Normalized ${detail.normalizedStage}` : "",
    detail.selectedRuntimeAgentProvider ? `Provider ${detail.selectedRuntimeAgentProvider}` : "",
    detail.adapterBoundary ? `Adapter ${detail.adapterBoundary}` : "",
    detail.laneId ? `Lane ${detail.laneId}` : "",
    detail.capabilityId ? `Capability ${detail.capabilityId}` : "",
    detail.selectedBackendProvider ? `Backend ${detail.selectedBackendProvider}` : "",
    detail.observationRef ? `Observation ${detail.observationRef}` : "",
    detail.receiptRef ? `Receipt ${detail.receiptRef}` : "",
    detail.sourceId ? `Source ${detail.sourceId}` : "",
    detail.sourceHash ? `Source hash ${detail.sourceHash}` : "",
    detail.sourceKind ? `Source kind ${detail.sourceKind}` : "",
    detail.sourceTextHash ? `Source text ${detail.sourceTextHash}` : "",
    detail.sourceTextCharCount ? `Source chars ${detail.sourceTextCharCount}` : "",
    detail.projectionKey ? `Projection key ${detail.projectionKey}` : "",
    detail.projectionTarget ? `Projection ${detail.projectionTarget}` : "",
    detail.accountLocale ? `Account locale ${detail.accountLocale}` : "",
    detail.targetLanguage ? `Target ${detail.targetLanguage}` : "",
    detail.chunkId ? `Chunk ${detail.chunkId}` : "",
    detail.chunkIndex ? `Chunk index ${detail.chunkIndex}` : "",
    detail.dedupeKey ? `Dedupe ${detail.dedupeKey}` : "",
    detail.sourceEventId ? `Source event ${detail.sourceEventId}` : "",
    detail.sourceEventMs ? `Source event ms ${detail.sourceEventMs}` : "",
    detail.observedAtMs ? `Observed ${detail.observedAtMs}` : "",
    detail.freshnessStatus ? `Freshness ${detail.freshnessStatus}` : "",
    detail.cancelRequested === "true" ? "Cancelled" : "",
    detail.goalId ? `Goal ${detail.goalId}` : "",
    detail.goalBindingId ? `Goal binding ${detail.goalBindingId}` : "",
    detail.goalBindingKey ? `Goal binding key ${detail.goalBindingKey}` : "",
    detail.bindingStatus ? `Binding ${detail.bindingStatus}` : "",
    detail.activationPolicy ? `Activation ${detail.activationPolicy}` : "",
    detail.attentionPolicy ? `Attention ${detail.attentionPolicy}` : "",
    detail.stopCondition ? `Stop ${detail.stopCondition}` : "",
    detail.reportPolicy ? `Report policy ${detail.reportPolicy}` : "",
    detail.quietBehavior ? `Quiet ${detail.quietBehavior}` : "",
    detail.reportAction ? `Report action ${detail.reportAction}` : "",
    detail.reportReason ? `Report reason ${detail.reportReason}` : "",
    detail.laneSessionId ? `Session ${detail.laneSessionId}` : "",
    detail.sessionStatus ? `Session status ${detail.sessionStatus}` : "",
    detail.sessionHealth ? `Session health ${detail.sessionHealth}` : "",
    detail.sessionLifecycleAction ? `Action ${detail.sessionLifecycleAction}` : "",
    detail.blockedReason ? `Blocked ${detail.blockedReason}` : "",
    detail.sessionControlKey ? `Session control ${detail.sessionControlKey}` : "",
    detail.sourceBindingKey ? `Source binding key ${detail.sourceBindingKey}` : "",
    detail.latestObservationKey ? `Observation key ${detail.latestObservationKey}` : "",
    detail.latestMailLoopObservationKey ? `Mail observation key ${detail.latestMailLoopObservationKey}` : "",
    detail.latestEventId ? `Latest event ${detail.latestEventId}` : "",
    detail.stagePlayMailId ? `Mail ${detail.stagePlayMailId}` : "",
    detail.stagePlayMailDeliveryStatus ? `Delivery ${detail.stagePlayMailDeliveryStatus}` : "",
    detail.previousStagePlayMailId ? `Previous mail ${detail.previousStagePlayMailId}` : "",
    detail.mailboxThreadId ? `Mailbox ${detail.mailboxThreadId}` : "",
    detail.mailStatus ? `Mail status ${detail.mailStatus}` : "",
    detail.wakeKind ? `Wake ${detail.wakeKind}` : "",
    detail.materializedMailLoopEvidence ? `Materialized mail ${detail.materializedMailLoopEvidence}` : "",
    detail.hasObservation ? `Has observation ${detail.hasObservation}` : "",
    detail.observationLaneSessionId ? `Observation session ${detail.observationLaneSessionId}` : "",
    detail.reportSummaryText ? `Report ${detail.reportSummaryText}` : "",
    detail.terminalAuthorityStatus ? `Authority ${detail.terminalAuthorityStatus}` : "",
  ].filter(Boolean);
  if (stage === "visible") {
    parts.push("Visible only, not executed");
  }
  return parts.length > 0 ? `Lane detail: ${parts.join(" | ")}.` : null;
}

export function formatHelixAskConsoleCapabilityLaneStageToken(
  stage: HelixAskConsoleCapabilityLaneRowStage,
): string {
  switch (stage) {
    case "backend_selected":
      return "backend";
    case "goal_dispatch_admission":
      return "goal_admission";
    case "goal_dispatch_plan":
      return "goal_plan";
    case "goal_dispatch_readiness":
      return "goal_readiness";
    case "mail_loop":
      return "mail";
    case "terminal_rejected":
      return "terminal_rejected";
    case "terminal_selected":
      return "terminal_selected";
    case "goal_binding":
      return "goal";
    default:
      return stage;
  }
}

export function buildHelixAskConsoleCapabilityLaneSummary(
  rows: Array<{ stage: HelixAskConsoleCapabilityLaneRowStage }>,
): HelixAskConsoleCapabilityLaneSummary {
  const visibleCount = rows.filter((row) => row.stage === "visible").length;
  const requestedCount = rows.filter((row) => row.stage === "requested").length;
  const backendSelectedCount = rows.filter((row) => row.stage === "backend_selected").length;
  const observedCount = rows.filter((row) => row.stage === "observed").length;
  const receiptCount = rows.filter((row) => row.stage === "receipt").length;
  const reenteredCount = rows.filter((row) => row.stage === "reentered").length;
  const executedCount = backendSelectedCount + observedCount + receiptCount + reenteredCount;
  const sessionCount = rows.filter((row) => row.stage === "session").length;
  const mailLoopCount = rows.filter((row) => row.stage === "mail_loop").length;
  const goalBindingCount = rows.filter((row) => row.stage === "goal_binding").length;
  const goalDispatchPlanCount = rows.filter((row) => row.stage === "goal_dispatch_plan").length;
  const goalDispatchAdmissionCount = rows.filter((row) => row.stage === "goal_dispatch_admission").length;
  const goalDispatchReadinessCount = rows.filter((row) => row.stage === "goal_dispatch_readiness").length;
  const terminalSelectedCount = rows.filter((row) => row.stage === "terminal_selected").length;
  const terminalRejectedCount = rows.filter((row) => row.stage === "terminal_rejected").length;
  const stageSequence = rows.map((row) => row.stage);
  const stageSequenceText = stageSequence.map(formatHelixAskConsoleCapabilityLaneStageToken).join(" > ");
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
        : executedCount > 0
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
    executedCount,
    backendSelectedCount,
    observedCount,
    receiptCount,
    reenteredCount,
    sessionCount,
    mailLoopCount,
    goalBindingCount,
    goalDispatchPlanCount,
    goalDispatchAdmissionCount,
    goalDispatchReadinessCount,
    terminalSelectedCount,
    terminalRejectedCount,
    stageSequence,
    stageSequenceText,
    visibleLaneDoesNotMeanExecuted: true,
  };
}

export function formatHelixAskConsoleCapabilityLaneSummaryText(
  summary: HelixAskConsoleCapabilityLaneSummary,
): string | null {
  if (summary.lifecycleStatus === "none") return null;
  const counts = [
    summary.visibleCount > 0 ? `visible ${summary.visibleCount}` : "",
    summary.requestedCount > 0 ? `requested ${summary.requestedCount}` : "",
    summary.executedCount > 0 ? `executed ${summary.executedCount}` : "",
    summary.backendSelectedCount > 0 ? `backend ${summary.backendSelectedCount}` : "",
    summary.observedCount > 0 ? `observed ${summary.observedCount}` : "",
    summary.receiptCount > 0 ? `receipt ${summary.receiptCount}` : "",
    summary.reenteredCount > 0 ? `re-entered ${summary.reenteredCount}` : "",
    summary.sessionCount > 0 ? `session ${summary.sessionCount}` : "",
    summary.mailLoopCount > 0 ? `mail ${summary.mailLoopCount}` : "",
    summary.goalBindingCount > 0 ? `goal ${summary.goalBindingCount}` : "",
    summary.goalDispatchPlanCount > 0 ? `dispatch plan ${summary.goalDispatchPlanCount}` : "",
    summary.goalDispatchAdmissionCount > 0 ? `dispatch admission ${summary.goalDispatchAdmissionCount}` : "",
    summary.goalDispatchReadinessCount > 0 ? `dispatch readiness ${summary.goalDispatchReadinessCount}` : "",
    summary.terminalSelectedCount > 0 ? `terminal selected ${summary.terminalSelectedCount}` : "",
    summary.terminalRejectedCount > 0 ? `terminal rejected ${summary.terminalRejectedCount}` : "",
  ].filter(Boolean);
  const detail = counts.length ? counts.join(" / ") : summary.lifecycleStatus.replace(/_/g, " ");
  const lifecycle = ` Status: ${summary.lifecycleStatus.replace(/_/g, " ")}.`;
  const sequence = summary.stageSequenceText ? ` Path: ${summary.stageSequenceText}.` : "";
  const visibleOnlyNote = summary.visibleCount > 0
    ? " Visible lanes are available, not executed."
    : "";
  return `Lane timeline: ${detail}.${lifecycle}${sequence}${visibleOnlyNote}`;
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
      const detail = resolveHelixAskConsoleCapabilityLaneRowDetail(row);
      return {
        index,
        key: row.key,
        stage,
        label: row.label,
        status: row.status,
        text: clipDiagnosticText(row.text, 180),
        meta: clipDiagnosticText(row.meta, 240),
        detail,
        detailText: formatHelixAskConsoleCapabilityLaneRowDetailText(stage, detail),
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
