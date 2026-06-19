import {
  WORKSTATION_AGENT_GOAL_ACTUATORS,
  WORKSTATION_AGENT_GOAL_CONTEXT_FEED_KINDS,
  queryActuatorForAgentGoalContextFeedV1,
  validateAgentGoalSessionV1,
  validateWorkstationGoalContextUpdateV1,
  type AgentGoalActuatorV1,
  type AgentGoalContextFeedKindV1,
  type AgentGoalSessionV1,
  type GoalContextProducerKindV1,
  type GoalContextUpdateKindV1,
  type WorkstationGoalContextUpdateV1,
} from "./workstation-goal-context.v1";

export const WORKSTATION_CONTEXT_FEED_QUERY_RESULT_SCHEMA =
  "stage_play_workstation_context_feed_query_result/v1" as const;

export type WorkstationContextFeedQueryTerminalAuthorityV1 = {
  status: "not_terminal";
  finalAnswerEligible: false;
  completedSolverPathRequired: true;
  terminalAuthoritySingleWriterRequired: true;
};

export type WorkstationContextFeedPacketCircuitRefV1 = {
  updateId: string;
  producerKind: GoalContextProducerKindV1;
  updateKind: GoalContextUpdateKindV1;
  contentRef: string;
  sourceRefs: string[];
  loopRefs: string[];
  packetRefs: string[];
  microDeckRefs: string[];
  receiptRefs: string[];
  freshnessStatus: WorkstationGoalContextUpdateV1["freshness"]["status"];
  assistant_answer: false;
  terminal_eligible: false;
};

export type WorkstationContextFeedQueryResultV1 = {
  schema: typeof WORKSTATION_CONTEXT_FEED_QUERY_RESULT_SCHEMA;
  resultId: string;
  feedKind: AgentGoalContextFeedKindV1;
  label: string;
  mailboxThreadId: string;
  mailboxThreadResolution: unknown;
  sourceRef?: string | null;
  goalId?: string | null;
  status: "read" | "blocked";
  missingRequirements: string[];
  policyEvidenceRefs: string[];
  sourceRefs: string[];
  loopRefs: string[];
  evidenceRefs: string[];
  freshnessStatus: "fresh" | "stale" | "blocked" | "unknown";
  goalSessionFound: boolean | null;
  feedAllowed: boolean;
  requiredActuator: AgentGoalActuatorV1;
  actuatorAllowed: boolean;
  matchedContextFeeds: AgentGoalSessionV1["contextFeeds"];
  matchedContextFeedRefs: string[];
  matchedAllowedActuators: AgentGoalActuatorV1[];
  matchedAllowedActuatorRefs: string[];
  agentGoalSession: unknown | null;
  agentGoalSessions: unknown[];
  goalContextUpdates: WorkstationGoalContextUpdateV1[];
  authoritySummary: unknown;
  packetCircuitRefs: WorkstationContextFeedPacketCircuitRefV1[];
  updateCount: number;
  syncedWindow: {
    mailItemCount: number;
    processedPacketCount: number;
    microReasonerRunCount: number;
  };
  goalContextUpdateId: string;
  terminalAuthority: WorkstationContextFeedQueryTerminalAuthorityV1;
  post_tool_model_step_required: true;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
};

const feedKinds = new Set<string>(WORKSTATION_AGENT_GOAL_CONTEXT_FEED_KINDS);
const actuators = new Set<string>(WORKSTATION_AGENT_GOAL_ACTUATORS);
const freshnessStatuses = new Set<WorkstationContextFeedQueryResultV1["freshnessStatus"]>([
  "fresh",
  "stale",
  "blocked",
  "unknown",
]);
const feedUpdateLanes: Readonly<Record<AgentGoalContextFeedKindV1, {
  producerKinds: readonly GoalContextProducerKindV1[];
  updateKinds: readonly GoalContextUpdateKindV1[];
}>> = {
  visual_summaries: {
    producerKinds: ["visual_capture"],
    updateKinds: ["visual_observation", "classification", "summary"],
  },
  audio_transcripts: {
    producerKinds: ["audio_capture", "transcription_loop"],
    updateKinds: ["transcript_window"],
  },
  translated_transcripts: {
    producerKinds: ["translation_loop"],
    updateKinds: ["translated_transcript"],
  },
  microdeck_outputs: {
    producerKinds: ["microdeck"],
    updateKinds: ["summary", "visual_observation", "classification", "translated_transcript", "route_evidence", "reflection"],
  },
  live_answer_lines: {
    producerKinds: ["live_answer"],
    updateKinds: ["summary", "preset_state", "source_status", "route_evidence"],
  },
  source_health: {
    producerKinds: ["source_health"],
    updateKinds: ["source_status"],
  },
  trace_memory: {
    producerKinds: ["trace_memory"],
    updateKinds: ["route_evidence", "summary"],
  },
  narrator_events: {
    producerKinds: ["narrator"],
    updateKinds: ["suggested_action", "automation_status", "route_evidence"],
  },
  packet_traces: {
    producerKinds: ["visual_capture", "audio_capture", "transcription_loop", "translation_loop", "microdeck", "route_watch"],
    updateKinds: ["visual_observation", "transcript_window", "translated_transcript", "classification", "route_evidence", "suggested_action", "error"],
  },
  route_evidence: {
    producerKinds: ["route_watch", "automation"],
    updateKinds: ["route_evidence", "suggested_action", "source_status", "automation_status"],
  },
  automation_policies: {
    producerKinds: ["automation", "route_watch"],
    updateKinds: ["automation_status"],
  },
};

export const workstationContextFeedUpdateMatchesV1 = (
  feedKind: AgentGoalContextFeedKindV1,
  update: Pick<WorkstationGoalContextUpdateV1, "producerKind" | "updateKind">,
): boolean => {
  const lane = feedUpdateLanes[feedKind];
  return Boolean(lane?.producerKinds.includes(update.producerKind) && lane.updateKinds.includes(update.updateKind));
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const stringArrayIssues = (value: unknown, field: string, options: { requireNonEmpty?: boolean } = {}): string[] => {
  if (!Array.isArray(value)) return [`${field} must be an array`];
  const issues: string[] = [];
  if (options.requireNonEmpty && value.length === 0) issues.push(`${field} must include at least one reference`);
  value.forEach((entry, index) => {
    if (!isNonEmptyString(entry)) issues.push(`${field}[${index}] must be a non-empty string`);
  });
  return issues;
};

const terminalAuthorityIssues = (value: unknown): string[] => {
  const issues: string[] = [];
  if (!isRecord(value)) return ["terminalAuthority must be an object"];
  if (value.status !== "not_terminal") issues.push("terminalAuthority.status must be not_terminal");
  if (value.finalAnswerEligible !== false) issues.push("terminalAuthority.finalAnswerEligible must be false");
  if (value.completedSolverPathRequired !== true) {
    issues.push("terminalAuthority.completedSolverPathRequired must be true");
  }
  if (value.terminalAuthoritySingleWriterRequired !== true) {
    issues.push("terminalAuthority.terminalAuthoritySingleWriterRequired must be true");
  }
  return issues;
};

const packetCircuitRefIssues = (
  value: unknown,
  updates: WorkstationGoalContextUpdateV1[],
): string[] => {
  if (!Array.isArray(value)) return ["packetCircuitRefs must be an array"];
  const issues: string[] = [];
  const updatesById = new Map(updates.map((update) => [update.updateId, update]));
  if (value.length !== updates.length) {
    issues.push("packetCircuitRefs must include one entry for every goalContextUpdates item");
  }
  value.forEach((entry, index) => {
    if (!isRecord(entry)) {
      issues.push(`packetCircuitRefs[${index}] must be an object`);
      return;
    }
    const update = isNonEmptyString(entry.updateId) ? updatesById.get(entry.updateId) : null;
    if (!isNonEmptyString(entry.updateId)) issues.push(`packetCircuitRefs[${index}].updateId is required`);
    if (!update) {
      issues.push(`packetCircuitRefs[${index}].updateId must match a goalContextUpdates item`);
    } else {
      if (entry.producerKind !== update.producerKind) issues.push(`packetCircuitRefs[${index}].producerKind must match update`);
      if (entry.updateKind !== update.updateKind) issues.push(`packetCircuitRefs[${index}].updateKind must match update`);
      if (entry.contentRef !== update.contentRef) issues.push(`packetCircuitRefs[${index}].contentRef must match update`);
      if (entry.freshnessStatus !== update.freshness.status) issues.push(`packetCircuitRefs[${index}].freshnessStatus must match update`);
    }
    issues.push(...stringArrayIssues(entry.sourceRefs, `packetCircuitRefs[${index}].sourceRefs`));
    issues.push(...stringArrayIssues(entry.loopRefs, `packetCircuitRefs[${index}].loopRefs`));
    issues.push(...stringArrayIssues(entry.packetRefs, `packetCircuitRefs[${index}].packetRefs`));
    issues.push(...stringArrayIssues(entry.microDeckRefs, `packetCircuitRefs[${index}].microDeckRefs`));
    issues.push(...stringArrayIssues(entry.receiptRefs, `packetCircuitRefs[${index}].receiptRefs`));
    if (entry.assistant_answer !== false) issues.push(`packetCircuitRefs[${index}].assistant_answer must be false`);
    if (entry.terminal_eligible !== false) issues.push(`packetCircuitRefs[${index}].terminal_eligible must be false`);
  });
  return issues;
};

const authoritySummaryIssues = (
  value: unknown,
  expected: {
    goalContextUpdateRefs: string[];
    goalSessionRefs: string[];
    updateCount: number;
    observationOnlyUpdateCount: number;
    assistantAnswerCount: number;
    terminalEligibleCount: number;
    rawContentIncludedCount: number;
    postToolModelStepRequiredCount: number;
    activeGoalSessionCount: number;
    finalReportsRequireTerminalAuthorityCount: number;
  },
): string[] => {
  const issues: string[] = [];
  if (!isRecord(value)) return ["authoritySummary must be an object"];
  if (value.assistant_answer !== false) issues.push("authoritySummary.assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("authoritySummary.terminal_eligible must be false");
  if (value.raw_content_included !== false) issues.push("authoritySummary.raw_content_included must be false");
  if (value.post_tool_model_step_required !== true) {
    issues.push("authoritySummary.post_tool_model_step_required must be true");
  }
  if (value.answerAuthority !== "completed_solver_path_required") {
    issues.push("authoritySummary.answerAuthority must require completed solver path");
  }
  if (value.updateCount !== expected.updateCount) {
    issues.push("authoritySummary.updateCount must match goalContextUpdates length");
  }
  if (value.observationOnlyUpdateCount !== expected.observationOnlyUpdateCount) {
    issues.push("authoritySummary.observationOnlyUpdateCount must match observation-only updates");
  }
  if (value.assistantAnswerCount !== expected.assistantAnswerCount) {
    issues.push("authoritySummary.assistantAnswerCount must match assistant-answer updates");
  }
  if (value.terminalEligibleCount !== expected.terminalEligibleCount) {
    issues.push("authoritySummary.terminalEligibleCount must match terminal-eligible updates");
  }
  if (value.rawContentIncludedCount !== expected.rawContentIncludedCount) {
    issues.push("authoritySummary.rawContentIncludedCount must match raw-content updates");
  }
  if (value.postToolModelStepRequiredCount !== expected.postToolModelStepRequiredCount) {
    issues.push("authoritySummary.postToolModelStepRequiredCount must match post-tool update count");
  }
  if (value.activeGoalSessionCount !== expected.activeGoalSessionCount) {
    issues.push("authoritySummary.activeGoalSessionCount must match active goal sessions");
  }
  if (value.finalReportsRequireTerminalAuthorityCount !== expected.finalReportsRequireTerminalAuthorityCount) {
    issues.push("authoritySummary.finalReportsRequireTerminalAuthorityCount must match authority-bound sessions");
  }
  issues.push(...stringArrayIssues(value.goalContextUpdateRefs, "authoritySummary.goalContextUpdateRefs"));
  if (Array.isArray(value.goalContextUpdateRefs)) {
    for (const ref of expected.goalContextUpdateRefs) {
      if (!value.goalContextUpdateRefs.includes(ref)) {
        issues.push("authoritySummary.goalContextUpdateRefs must include every goalContextUpdates updateId");
        break;
      }
    }
  }
  issues.push(...stringArrayIssues(value.goalSessionRefs, "authoritySummary.goalSessionRefs"));
  if (Array.isArray(value.goalSessionRefs)) {
    for (const ref of expected.goalSessionRefs) {
      if (!value.goalSessionRefs.includes(ref)) {
        issues.push("authoritySummary.goalSessionRefs must include every agentGoalSessions goalId");
        break;
      }
    }
  }
  return issues;
};

const goalSessionIssues = (
  value: unknown,
  field: string,
  expectedGoalId: string | null | undefined,
): string[] => {
  if (!isRecord(value)) return [`${field} must be an object`];
  const issues = validateAgentGoalSessionV1(value as AgentGoalSessionV1)
    .map((issue) => `${field}.${issue}`);
  if (isNonEmptyString(expectedGoalId) && value.goalId !== expectedGoalId) {
    issues.push(`${field}.goalId must match goalId`);
  }
  return issues;
};

export function validateWorkstationContextFeedQueryResultV1(
  value: WorkstationContextFeedQueryResultV1,
): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["workstation context feed query result must be an object"];
  if (value.schema !== WORKSTATION_CONTEXT_FEED_QUERY_RESULT_SCHEMA) {
    issues.push(`schema must be ${WORKSTATION_CONTEXT_FEED_QUERY_RESULT_SCHEMA}`);
  }
  if (!isNonEmptyString(value.resultId)) issues.push("resultId must be a non-empty string");
  if (!feedKinds.has(value.feedKind)) issues.push("feedKind is invalid");
  if (!isNonEmptyString(value.label)) issues.push("label must be a non-empty string");
  if (!isNonEmptyString(value.mailboxThreadId)) issues.push("mailboxThreadId must be a non-empty string");
  if (!isRecord(value.mailboxThreadResolution)) issues.push("mailboxThreadResolution must be an object");
  if (value.sourceRef != null && !isNonEmptyString(value.sourceRef)) issues.push("sourceRef must be a non-empty string or null");
  if (value.goalId != null && !isNonEmptyString(value.goalId)) issues.push("goalId must be a non-empty string or null");
  if (value.status !== "read" && value.status !== "blocked") issues.push("status must be read or blocked");
  issues.push(...stringArrayIssues(value.missingRequirements, "missingRequirements"));
  if (value.status === "blocked" && Array.isArray(value.missingRequirements) && value.missingRequirements.length === 0) {
    issues.push("blocked feed query results must include missingRequirements");
  }
  issues.push(...stringArrayIssues(value.policyEvidenceRefs, "policyEvidenceRefs", { requireNonEmpty: true }));
  if (
    Array.isArray(value.policyEvidenceRefs) &&
    feedKinds.has(value.feedKind) &&
    !value.policyEvidenceRefs.includes(`context_feed:${value.feedKind}`)
  ) {
    issues.push("policyEvidenceRefs must include context feed policy ref");
  }
  if (value.goalSessionFound !== null && typeof value.goalSessionFound !== "boolean") {
    issues.push("goalSessionFound must be boolean or null");
  }
  if (typeof value.feedAllowed !== "boolean") issues.push("feedAllowed must be boolean");
  if (!actuators.has(value.requiredActuator)) issues.push("requiredActuator is invalid");
  const expectedQueryActuator = feedKinds.has(value.feedKind)
    ? queryActuatorForAgentGoalContextFeedV1(value.feedKind)
    : null;
  if (
    expectedQueryActuator &&
    actuators.has(value.requiredActuator) &&
    value.requiredActuator !== expectedQueryActuator
  ) {
    issues.push("requiredActuator must match feedKind query actuator");
  }
  if (
    Array.isArray(value.policyEvidenceRefs) &&
    actuators.has(value.requiredActuator) &&
    !value.policyEvidenceRefs.includes(`allowed_actuator:${value.requiredActuator}`)
  ) {
    issues.push("policyEvidenceRefs must include actuator policy ref");
  }
  if (
    Array.isArray(value.policyEvidenceRefs) &&
    expectedQueryActuator &&
    !value.policyEvidenceRefs.includes(`allowed_actuator:${expectedQueryActuator}`)
  ) {
    issues.push("policyEvidenceRefs must include feed query actuator policy ref");
  }
  if (!Array.isArray(value.matchedContextFeeds)) {
    issues.push("matchedContextFeeds must be an array");
  } else {
    value.matchedContextFeeds.forEach((feed, index) => {
      if (!isRecord(feed)) {
        issues.push(`matchedContextFeeds[${index}] must be an object`);
        return;
      }
      if (!isNonEmptyString(feed.feedId)) issues.push(`matchedContextFeeds[${index}].feedId is required`);
      if (feed.sourceKind !== value.feedKind) {
        issues.push(`matchedContextFeeds[${index}].sourceKind must match feedKind`);
      }
      if (feed.query !== undefined && !isNonEmptyString(feed.query)) {
        issues.push(`matchedContextFeeds[${index}].query must be a non-empty string`);
      }
      if (feed.freshnessMs !== undefined && (!Number.isFinite(feed.freshnessMs) || feed.freshnessMs <= 0)) {
        issues.push(`matchedContextFeeds[${index}].freshnessMs must be a positive number`);
      }
      if (feed.relevancePolicy !== undefined && !isNonEmptyString(feed.relevancePolicy)) {
        issues.push(`matchedContextFeeds[${index}].relevancePolicy must be a non-empty string`);
      }
    });
  }
  issues.push(...stringArrayIssues(value.matchedContextFeedRefs, "matchedContextFeedRefs"));
  if (Array.isArray(value.matchedContextFeeds) && Array.isArray(value.matchedContextFeedRefs)) {
    for (const feed of value.matchedContextFeeds) {
      if (isRecord(feed) && isNonEmptyString(feed.feedId) && !value.matchedContextFeedRefs.includes(feed.feedId)) {
        issues.push("matchedContextFeedRefs must include every matchedContextFeeds feedId");
        break;
      }
    }
  }
  if (value.goalSessionFound === true && value.feedAllowed === true && Array.isArray(value.matchedContextFeeds) && value.matchedContextFeeds.length === 0) {
    issues.push("feedAllowed=true for a goal session requires matchedContextFeeds");
  }
  if (value.feedAllowed === false && Array.isArray(value.matchedContextFeeds) && value.matchedContextFeeds.length > 0) {
    issues.push("feedAllowed=false must not expose matchedContextFeeds");
  }
  issues.push(...stringArrayIssues(value.matchedAllowedActuators, "matchedAllowedActuators"));
  if (Array.isArray(value.matchedAllowedActuators)) {
    value.matchedAllowedActuators.forEach((actuator, index) => {
      if (expectedQueryActuator && actuator !== expectedQueryActuator) {
        issues.push(`matchedAllowedActuators[${index}] must match feedKind query actuator`);
      }
    });
  }
  issues.push(...stringArrayIssues(value.matchedAllowedActuatorRefs, "matchedAllowedActuatorRefs"));
  if (Array.isArray(value.matchedAllowedActuators) && Array.isArray(value.matchedAllowedActuatorRefs)) {
    const expectedRefs = value.matchedAllowedActuators.map((actuator) => `agent_goal_allowed_actuator:${actuator}`);
    for (const ref of expectedRefs) {
      if (!value.matchedAllowedActuatorRefs.includes(ref)) {
        issues.push("matchedAllowedActuatorRefs must include every matchedAllowedActuators policy ref");
        break;
      }
    }
  }
  if (value.goalSessionFound === true && value.actuatorAllowed === true && Array.isArray(value.matchedAllowedActuators) && value.matchedAllowedActuators.length === 0) {
    issues.push("actuatorAllowed=true for a goal session requires matchedAllowedActuators");
  }
  if (value.actuatorAllowed === false && Array.isArray(value.matchedAllowedActuators) && value.matchedAllowedActuators.length > 0) {
    issues.push("actuatorAllowed=false must not expose matchedAllowedActuators");
  }
  if (Array.isArray(value.policyEvidenceRefs) && Array.isArray(value.matchedContextFeedRefs)) {
    for (const ref of value.matchedContextFeedRefs) {
      if (!value.policyEvidenceRefs.includes(`agent_goal_context_feed:${ref}`)) {
        issues.push("policyEvidenceRefs must include every matched context feed policy ref");
        break;
      }
    }
  }
  if (Array.isArray(value.policyEvidenceRefs) && Array.isArray(value.matchedAllowedActuatorRefs)) {
    for (const ref of value.matchedAllowedActuatorRefs) {
      if (!value.policyEvidenceRefs.includes(ref)) {
        issues.push("policyEvidenceRefs must include every matched allowed actuator policy ref");
        break;
      }
    }
  }
  issues.push(...stringArrayIssues(value.sourceRefs, "sourceRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssues(value.loopRefs, "loopRefs", { requireNonEmpty: true }));
  issues.push(...stringArrayIssues(value.evidenceRefs, "evidenceRefs", { requireNonEmpty: true }));
  if (!freshnessStatuses.has(value.freshnessStatus)) issues.push("freshnessStatus is invalid");
  if (value.status === "read" && value.freshnessStatus === "blocked") {
    issues.push("read feed query results must not have blocked freshnessStatus");
  }
  if (value.status === "blocked" && value.freshnessStatus !== "blocked") {
    issues.push("blocked feed query results must have blocked freshnessStatus");
  }
  if (Array.isArray(value.loopRefs) && feedKinds.has(value.feedKind)) {
    if (!value.loopRefs.includes(`workstation_context_feed:${value.feedKind}`)) {
      issues.push("loopRefs must include workstation context feed loop ref");
    }
  }
  if (Array.isArray(value.loopRefs) && actuators.has(value.requiredActuator)) {
    if (!value.loopRefs.includes(`workstation_actuator:${value.requiredActuator}`)) {
      issues.push("loopRefs must include required actuator loop ref");
    }
  }
  if (Array.isArray(value.loopRefs) && expectedQueryActuator) {
    if (!value.loopRefs.includes(`workstation_actuator:${expectedQueryActuator}`)) {
      issues.push("loopRefs must include feed query actuator loop ref");
    }
  }
  if (Array.isArray(value.evidenceRefs)) {
    if (isNonEmptyString(value.resultId) && !value.evidenceRefs.includes(value.resultId)) {
      issues.push("evidenceRefs must include resultId");
    }
    if (Array.isArray(value.policyEvidenceRefs)) {
      for (const ref of value.policyEvidenceRefs) {
        if (!value.evidenceRefs.includes(ref)) {
          issues.push("evidenceRefs must include every policyEvidenceRefs entry");
          break;
        }
      }
    }
    if (Array.isArray(value.matchedContextFeedRefs)) {
      for (const ref of value.matchedContextFeedRefs) {
        if (!value.evidenceRefs.includes(ref)) {
          issues.push("evidenceRefs must include every matchedContextFeedRefs entry");
          break;
        }
      }
    }
    if (Array.isArray(value.matchedAllowedActuatorRefs)) {
      for (const ref of value.matchedAllowedActuatorRefs) {
        if (!value.evidenceRefs.includes(ref)) {
          issues.push("evidenceRefs must include every matchedAllowedActuatorRefs entry");
          break;
        }
      }
    }
    if (Array.isArray(value.sourceRefs)) {
      for (const ref of value.sourceRefs) {
        if (!value.evidenceRefs.includes(ref)) {
          issues.push("evidenceRefs must include every sourceRefs entry");
          break;
        }
      }
    }
    if (Array.isArray(value.loopRefs)) {
      for (const ref of value.loopRefs) {
        if (!value.evidenceRefs.includes(ref)) {
          issues.push("evidenceRefs must include every loopRefs entry");
          break;
        }
      }
    }
  }
  if (typeof value.actuatorAllowed !== "boolean") issues.push("actuatorAllowed must be boolean");
  if (value.status === "read" && value.feedAllowed !== true) issues.push("read feed query results must have feedAllowed=true");
  if (value.status === "read" && value.actuatorAllowed !== true) {
    issues.push("read feed query results must have actuatorAllowed=true");
  }
  if (value.goalSessionFound === true) {
    if (!isRecord(value.agentGoalSession)) {
      issues.push("goalSessionFound=true requires agentGoalSession");
    } else {
      issues.push(...goalSessionIssues(value.agentGoalSession, "agentGoalSession", value.goalId));
    }
  }
  if (!Array.isArray(value.agentGoalSessions)) issues.push("agentGoalSessions must be an array");
  if (value.goalSessionFound === true && Array.isArray(value.agentGoalSessions) && value.agentGoalSessions.length === 0) {
    issues.push("goalSessionFound=true requires at least one agentGoalSessions entry");
  }
  if (Array.isArray(value.agentGoalSessions)) {
    value.agentGoalSessions.forEach((session, index) => {
      issues.push(...goalSessionIssues(session, `agentGoalSessions[${index}]`, value.goalId));
    });
  }
  if (!Array.isArray(value.goalContextUpdates)) {
    issues.push("goalContextUpdates must be an array");
  } else {
    if (value.status === "blocked" && value.goalContextUpdates.length > 0) {
      issues.push("blocked feed query results must not include goalContextUpdates");
    }
    value.goalContextUpdates.forEach((update, index) => {
      for (const issue of validateWorkstationGoalContextUpdateV1(update)) {
        issues.push(`goalContextUpdates[${index}].${issue}`);
      }
      if (feedKinds.has(value.feedKind) && !workstationContextFeedUpdateMatchesV1(value.feedKind, update)) {
        issues.push(`goalContextUpdates[${index}] does not match feedKind ${value.feedKind}`);
      }
    });
  }
  const validGoalContextUpdates = Array.isArray(value.goalContextUpdates)
    ? value.goalContextUpdates.filter(isRecord) as WorkstationGoalContextUpdateV1[]
    : [];
  issues.push(...packetCircuitRefIssues(value.packetCircuitRefs, validGoalContextUpdates));
  const expectedGoalContextUpdateRefs = Array.isArray(value.goalContextUpdates)
    ? value.goalContextUpdates
      .map((update) => update?.updateId)
      .filter(isNonEmptyString)
    : [];
  const observationOnlyUpdateCount = validGoalContextUpdates.filter((update) =>
    isRecord(update.authority) &&
    update.authority.assistantAnswer === false &&
    update.authority.terminalEligible === false &&
    update.authority.rawContentIncluded === false
  ).length;
  const assistantAnswerCount = validGoalContextUpdates.filter((update) =>
    isRecord(update.authority) && update.authority.assistantAnswer !== false
  ).length;
  const terminalEligibleCount = validGoalContextUpdates.filter((update) =>
    isRecord(update.authority) && update.authority.terminalEligible !== false
  ).length;
  const rawContentIncludedCount = validGoalContextUpdates.filter((update) =>
    isRecord(update.authority) && update.authority.rawContentIncluded !== false
  ).length;
  const postToolModelStepRequiredCount = validGoalContextUpdates.filter((update) =>
    isRecord(update.authority) && update.authority.postToolModelStepRequired === true
  ).length;
  const expectedGoalSessionRefs = Array.isArray(value.agentGoalSessions)
    ? value.agentGoalSessions
      .map((session) => isRecord(session) ? session.goalId : null)
      .filter(isNonEmptyString)
    : [];
  const validGoalSessions = Array.isArray(value.agentGoalSessions)
    ? value.agentGoalSessions.filter(isRecord)
    : [];
  const activeGoalSessionCount = validGoalSessions.filter((session) =>
    session.status === "active" ||
    session.status === "blocked" ||
    session.status === "paused"
  ).length;
  const finalReportsRequireTerminalAuthorityCount = validGoalSessions.filter((session) =>
    isRecord(session.authority) && session.authority.finalReportsRequireTerminalAuthority === true
  ).length;
  issues.push(...authoritySummaryIssues(value.authoritySummary, {
    goalContextUpdateRefs: expectedGoalContextUpdateRefs,
    goalSessionRefs: expectedGoalSessionRefs,
    updateCount: validGoalContextUpdates.length,
    observationOnlyUpdateCount,
    assistantAnswerCount,
    terminalEligibleCount,
    rawContentIncludedCount,
    postToolModelStepRequiredCount,
    activeGoalSessionCount,
    finalReportsRequireTerminalAuthorityCount,
  }));
  if (!Number.isFinite(value.updateCount) || value.updateCount !== (Array.isArray(value.goalContextUpdates) ? value.goalContextUpdates.length : -1)) {
    issues.push("updateCount must match goalContextUpdates length");
  }
  if (!isRecord(value.syncedWindow)) {
    issues.push("syncedWindow must be an object");
  } else {
    for (const field of ["mailItemCount", "processedPacketCount", "microReasonerRunCount"] as const) {
      if (!Number.isFinite(value.syncedWindow[field])) issues.push(`syncedWindow.${field} must be numeric`);
    }
  }
  if (!isNonEmptyString(value.goalContextUpdateId)) issues.push("goalContextUpdateId must be a non-empty string");
  issues.push(...terminalAuthorityIssues(value.terminalAuthority));
  if (value.post_tool_model_step_required !== true) issues.push("post_tool_model_step_required must be true");
  if (value.assistant_answer !== false) issues.push("assistant_answer must be false");
  if (value.terminal_eligible !== false) issues.push("terminal_eligible must be false");
  if (value.raw_content_included !== false) issues.push("raw_content_included must be false");
  if (value.context_role !== "tool_evidence") issues.push("context_role must be tool_evidence");
  if (value.ask_context_policy !== "evidence_only") issues.push("ask_context_policy must be evidence_only");
  return issues;
}
