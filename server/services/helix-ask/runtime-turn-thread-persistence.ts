import {
  appendHelixThreadCompletedItemLifecycle,
} from "./runtime/request-context";
import {
  appendHelixTurnEvent,
  getHelixThreadLedgerEvents,
} from "../helix-thread/ledger";

export type HelixRuntimeThreadFinalStatus =
  | "final_answer"
  | "final_failure"
  | "pending_input";

const normalizeText = (value: unknown): string =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map(normalizeText)
        .filter((entry) => entry.length > 0 && entry.length <= 512)
    : [];

const workspaceDocumentPath = (value: unknown): string | null => {
  const path = normalizeText(value).replace(/\\/g, "/");
  if (
    !path ||
    path === "docs" ||
    path.startsWith("/") ||
    /^[a-z]:\//i.test(path) ||
    path.split("/").some((segment) => segment === "..") ||
    !/\.(?:md|mdx|txt|tex|pdf|json|ya?ml|csv|tsv)$/i.test(path)
  ) {
    return null;
  }
  return path;
};

export const extractRuntimeDocumentEvidencePaths = (
  payload: Record<string, unknown>,
): string[] => {
  const paths: string[] = [];
  const calls = Array.isArray(payload.workstation_gateway_call_results)
    ? payload.workstation_gateway_call_results
    : [];
  for (const entry of calls) {
    const call = readRecord(entry);
    const observation = readRecord(call?.observation);
    if (!call || !observation) continue;
    const capabilityId = normalizeText(call.capability_id);
    if (
      capabilityId !== "docs.search" &&
      capabilityId !== "docs-viewer.open_doc" &&
      capabilityId !== "docs-viewer.search_docs"
    ) {
      continue;
    }
    const candidates = Array.isArray(observation.document_candidates)
      ? observation.document_candidates
      : [];
    const firstCandidate = readRecord(candidates[0]);
    const candidatePath = workspaceDocumentPath(firstCandidate?.path);
    if (candidatePath) paths.push(candidatePath);
    const directPath =
      workspaceDocumentPath(observation.selected_path) ??
      workspaceDocumentPath(observation.path) ??
      workspaceDocumentPath(readRecord(observation.document)?.path);
    if (directPath) paths.push(directPath);
    if (Array.isArray(observation.paths)) {
      for (const value of observation.paths) {
        const path = workspaceDocumentPath(value);
        if (path) paths.push(path);
      }
    }
  }
  return Array.from(new Set(paths)).slice(0, 12);
};

export const extractRuntimeSelectedObservationRefs = (
  payload: Record<string, unknown>,
): string[] => {
  const terminalPresentation = readRecord(payload.terminal_presentation);
  const solverTrace = readRecord(payload.ask_turn_solver_trace);
  const directEvidenceGate = readRecord(solverTrace?.evidence_reentry_gate);
  const evidenceProof = readRecord(payload.evidence_reentry_proof);
  const proofEvidenceGate = readRecord(evidenceProof?.evidence_reentry_gate);
  const evidenceGate =
    proofEvidenceGate?.schema === "helix.evidence_reentry_gate.v1"
      ? proofEvidenceGate
      : directEvidenceGate?.schema === "helix.evidence_reentry_gate.v1"
        ? directEvidenceGate
        : null;
  const terminalAuthority = readRecord(payload.terminal_answer_authority);
  const gateCompleted =
    evidenceGate?.completed === true &&
    readStringArray(evidenceGate.violation_codes).length === 0;
  const serverAuthoritative = terminalAuthority?.server_authoritative === true;
  if (
    terminalPresentation?.schema !== "helix.terminal_presentation.v1" ||
    !gateCompleted ||
    !serverAuthoritative
  ) {
    return [];
  }

  const selectedByPresentation = new Set([
    ...readStringArray(terminalPresentation.selected_observation_refs),
    ...readStringArray(terminalPresentation.support_refs),
  ]);
  const reenteredByGate = new Set(
    readStringArray(evidenceGate.selected_evidence_refs),
  );
  const ledgerArtifactIds = new Set(
    (Array.isArray(payload.current_turn_artifact_ledger)
      ? payload.current_turn_artifact_ledger
      : []
    )
      .map(readRecord)
      .map((entry) => normalizeText(entry?.artifact_id))
      .filter(Boolean),
  );
  return Array.from(selectedByPresentation)
    .filter(
      (ref) => reenteredByGate.has(ref) && ledgerArtifactIds.has(ref),
    )
    .slice(0, 32);
};

export type RuntimeSelectedEnvironmentProbeLocator = {
  artifactRef: string;
  probeRequestRef: string;
  capabilityId: string;
};

export const extractRuntimeSelectedEnvironmentProbeLocators = (
  payload: Record<string, unknown>,
): RuntimeSelectedEnvironmentProbeLocator[] => {
  const selectedRefs = new Set(extractRuntimeSelectedObservationRefs(payload));
  if (selectedRefs.size === 0) return [];
  const locators: RuntimeSelectedEnvironmentProbeLocator[] = [];
  const calls = Array.isArray(payload.workstation_gateway_call_results)
    ? payload.workstation_gateway_call_results
    : [];
  for (const entry of calls) {
    const call = readRecord(entry);
    const observation = readRecord(call?.observation);
    const packet = readRecord(call?.observation_packet);
    const capabilityId = normalizeText(call?.capability_id);
    const probeRequestRef = normalizeText(observation?.probe_request_ref);
    if (
      observation?.schema !==
        "helix.environment_connector.probe_observation.v1" ||
      observation?.outcome !== "succeeded" ||
      observation?.provenance_valid !== true ||
      observation?.eligible_for_current_turn_reentry !== true ||
      observation?.assistant_answer !== false ||
      observation?.terminal_eligible !== false ||
      observation?.raw_content_included !== false ||
      !capabilityId ||
      normalizeText(observation?.capability_id) !== capabilityId ||
      !probeRequestRef
    ) {
      continue;
    }
    const artifactRefs = Array.from(
      new Set([
        ...readStringArray(call?.artifact_refs),
        ...readStringArray(packet?.produced_artifact_refs),
      ]),
    );
    for (const artifactRef of artifactRefs) {
      if (!selectedRefs.has(artifactRef)) continue;
      locators.push({ artifactRef, probeRequestRef, capabilityId });
    }
  }
  return locators
    .filter(
      (entry, index, entries) =>
        entries.findIndex(
          (candidate) => candidate.artifactRef === entry.artifactRef,
        ) === index,
    )
    .slice(0, 32);
};

export const persistHelixAskRuntimeTurnThreadCompletion = (input: {
  threadId: string | null;
  turnId: string;
  sessionId?: string | null;
  traceId?: string | null;
  promptText?: string | null;
  terminalText?: string | null;
  finalStatus: HelixRuntimeThreadFinalStatus;
  failureCode?: string | null;
  documentEvidencePaths?: string[];
  selectedObservationRefs?: string[];
  selectedEnvironmentProbeLocators?: RuntimeSelectedEnvironmentProbeLocator[];
}): void => {
  const threadId = normalizeText(input.threadId);
  const turnId = normalizeText(input.turnId);
  if (!threadId || !turnId) return;
  const promptText = normalizeText(input.promptText);
  const terminalText = normalizeText(input.terminalText);
  const userItemId = `${turnId}:runtime_user_message`;
  const answerItemId = `${turnId}:runtime_terminal_answer`;
  const existingEvents = getHelixThreadLedgerEvents({
    threadId,
    turnId,
    limit: 200,
  });
  const hasTurnStart = existingEvents.some(
    (event) => event.event_type === "turn_started",
  );
  const hasUserItem = existingEvents.some(
    (event) =>
      event.item_id === userItemId && event.event_type === "item_completed",
  );
  const hasAnswerItem = existingEvents.some(
    (event) =>
      event.item_id === answerItemId && event.event_type === "item_completed",
  );
  const hasTerminalTurnEvent = existingEvents.some(
    (event) =>
      event.event_type === "turn_completed" ||
      event.event_type === "turn_failed" ||
      event.event_type === "turn_interrupted",
  );
  if (!hasTurnStart) {
    appendHelixTurnEvent({
      thread_id: threadId,
      route: "/ask",
      event_type: "turn_started",
      turn_id: turnId,
      session_id: input.sessionId ?? null,
      trace_id: input.traceId ?? null,
      turn_kind: "ask",
      thread_status: "active",
      user_text: promptText || null,
    });
  }
  if (promptText && !hasUserItem) {
    appendHelixThreadCompletedItemLifecycle({
      threadId,
      turnId,
      route: "/ask",
      sessionId: input.sessionId ?? null,
      traceId: input.traceId ?? null,
      turnKind: "ask",
      itemId: userItemId,
      itemType: "userMessage",
      text: promptText,
      userText: promptText,
    });
  }
  const terminalSourceItemIds: string[] = [];
  for (const [index, path] of (input.documentEvidencePaths ?? [])
    .map(workspaceDocumentPath)
    .filter((entry): entry is string => Boolean(entry))
    .entries()) {
    const itemId = `${turnId}:runtime_document_evidence:${index + 1}`;
    terminalSourceItemIds.push(itemId);
    if (
      existingEvents.some(
        (event) =>
          event.item_id === itemId && event.event_type === "item_completed",
      )
    ) {
      continue;
    }
    appendHelixThreadCompletedItemLifecycle({
      threadId,
      turnId,
      route: "/ask",
      sessionId: input.sessionId ?? null,
      traceId: input.traceId ?? null,
      turnKind: "ask",
      itemId,
      itemType: "retrieval",
      itemStream: "observation",
      observationRef: {
        path,
        note: "current-turn Docs observation identity",
      },
      meta: {
        role: "current_turn_document_evidence_identity",
        evidence_authority: "requires_fresh_read_on_followup",
      },
    });
  }
  if (input.finalStatus === "final_answer") {
    const environmentProbeLocatorByArtifactRef = new Map(
      (input.selectedEnvironmentProbeLocators ?? []).map((entry) => [
        normalizeText(entry.artifactRef),
        entry,
      ]),
    );
    for (const [index, artifactRef] of Array.from(
      new Set(
        (input.selectedObservationRefs ?? [])
          .map(normalizeText)
          .filter((entry) => entry.length > 0 && entry.length <= 512),
      ),
    )
      .slice(0, 32)
      .entries()) {
      const itemId = `${turnId}:runtime_selected_observation:${index + 1}`;
      terminalSourceItemIds.push(itemId);
      if (
        existingEvents.some(
          (event) =>
            event.item_id === itemId && event.event_type === "item_completed",
        )
      ) {
        continue;
      }
      appendHelixThreadCompletedItemLifecycle({
        threadId,
        turnId,
        route: "/ask",
        sessionId: input.sessionId ?? null,
        traceId: input.traceId ?? null,
        turnKind: "ask",
        itemId,
        itemType: "toolObservation",
        itemStream: "observation",
        observationRef: {
          artifact_ref: artifactRef,
          ...(environmentProbeLocatorByArtifactRef.has(artifactRef)
            ? {
                environment_probe_request_ref:
                  environmentProbeLocatorByArtifactRef.get(artifactRef)
                    ?.probeRequestRef,
                capability_id:
                  environmentProbeLocatorByArtifactRef.get(artifactRef)
                    ?.capabilityId,
              }
            : {}),
          note: "verified current-turn terminal-support observation identity",
        },
        meta: {
          role: "current_turn_selected_evidence_identity",
          evidence_authority: "verified_runtime_reentry_and_terminal_support",
          raw_observation_persisted: false,
        },
      });
    }
  }
  if (terminalText && !hasAnswerItem) {
    appendHelixThreadCompletedItemLifecycle({
      threadId,
      turnId,
      route: "/ask",
      sessionId: input.sessionId ?? null,
      traceId: input.traceId ?? null,
      turnKind: "ask",
      itemId: answerItemId,
      itemType: "answer",
      itemStream: "answer",
      text: terminalText,
      assistantText: terminalText,
      sourceItemIds:
        terminalSourceItemIds.length > 0 ? terminalSourceItemIds : null,
      meta: {
        role: "authoritative_runtime_terminal",
        document_citations_are_fresh_read_locators_only: true,
        selected_observation_refs_are_nonterminal_identities_only: true,
      },
    });
  }
  if (!hasTerminalTurnEvent) {
    appendHelixTurnEvent({
      thread_id: threadId,
      route: "/ask",
      event_type:
        input.finalStatus === "pending_input"
          ? "turn_interrupted"
          : input.finalStatus === "final_failure"
            ? "turn_failed"
            : "turn_completed",
      turn_id: turnId,
      session_id: input.sessionId ?? null,
      trace_id: input.traceId ?? null,
      turn_kind: "ask",
      thread_status:
        input.finalStatus === "pending_input"
          ? "interrupted"
          : input.finalStatus === "final_failure"
            ? "failed"
            : "idle",
      user_text: promptText || null,
      assistant_text: terminalText || null,
      fail_reason:
        input.finalStatus === "final_failure"
          ? normalizeText(input.failureCode) || "runtime_turn_failed"
          : null,
    });
  }
};
