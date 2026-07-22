import crypto from "node:crypto";
import {
  HELIX_SOLVER_ARTIFACT_REENTRY_AUDIT_SCHEMA,
  type HelixSolverArtifactAuditEntry,
  type HelixSolverArtifactReentryAudit,
  type HelixSolverArtifactReentryFailureCode,
} from "@shared/helix-solver-artifact-reentry-audit";
import { applyCompoundTerminalPolicy } from "./compound-terminal-policy";
import { readVerifiedHelixRuntimeLifecycleFromPayload } from "./runtime/turn-lifecycle";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readBoolean = (value: unknown): boolean => value === true;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry: unknown): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const isReceiptKind = (kind: string): boolean =>
  /receipt|tool_evaluation|workstation_tool_evaluation/i.test(kind);

const isProjectionKind = (kind: string): boolean =>
  /projection|panel_generated_answer|client_projection|live_card_projection|no_tool_direct|model_only_concept/i.test(kind);

const classifyArtifact = (kind: string): HelixSolverArtifactAuditEntry["classified_as"] => {
  if (kind === "capability_result") return "capability_result";
  if (kind === "procedure_evidence_retrieval_plan") return "retrieval_plan";
  if (kind === "procedure_evidence_retrieval_result") return "retrieval_result";
  if (isReceiptKind(kind)) return "receipt";
  if (isProjectionKind(kind)) return "projection";
  if (/evidence|selection|context|evaluation|validation|situation_context_pack|repo_code_evidence_answer|procedure_epoch_replay|visual_scene_comparison_result/i.test(kind)) {
    return "evidence";
  }
  return "other";
};

const requiredTerminalKind = (payload: RecordLike): string => {
  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  const universalGoal = readRecord(payload.universal_goal_frame);
  const universalUserGoal = readRecord(universalGoal?.user_goal);
  const fallback = (
    readString(canonicalGoal?.required_terminal_kind) ||
    readString(universalGoal?.required_terminal_kind) ||
    readString(universalUserGoal?.required_terminal_kind)
  );
  return applyCompoundTerminalPolicy(payload, {
    allowed: [],
    forbidden: [],
    requiredTerminalKind: fallback,
  }).requiredTerminalKind ?? fallback;
};

const allowedTerminalKinds = (payload: RecordLike): string[] => {
  const contract = readRecord(payload.route_product_contract);
  return applyCompoundTerminalPolicy(payload, {
    allowed: readStringArray(contract?.allowed_terminal_artifact_kinds),
    forbidden: readStringArray(contract?.forbidden_terminal_artifact_kinds),
    requiredTerminalKind: readString(contract?.required_terminal_kind),
  }).allowed;
};

const forbiddenTerminalKinds = (payload: RecordLike): string[] => {
  const contract = readRecord(payload.route_product_contract);
  return applyCompoundTerminalPolicy(payload, {
    allowed: readStringArray(contract?.allowed_terminal_artifact_kinds),
    forbidden: readStringArray(contract?.forbidden_terminal_artifact_kinds),
    requiredTerminalKind: readString(contract?.required_terminal_kind),
  }).forbidden;
};

const collectPayloadRefs = (payload: RecordLike | null): string[] =>
  unique([
    readString(payload?.item_id),
    readString(payload?.receipt_id),
    readString(payload?.result_id),
    readString(payload?.selection_id),
    readString(payload?.context_id),
    readString(payload?.evaluation_id),
    readString(payload?.retrieval_plan_id),
    readString(payload?.capability_plan_id),
    ...readStringArray(payload?.evidence_refs),
    ...readStringArray(payload?.selected_current_refs),
    ...readStringArray(payload?.selected_prior_refs),
    ...readStringArray(payload?.selected_epoch_refs),
    ...readStringArray(payload?.selected_field_evaluation_refs),
    ...readStringArray(payload?.selected_interpretation_refs),
    ...readStringArray(payload?.selected_probe_refs),
    ...readStringArray(payload?.receipt_refs),
  ].filter(Boolean));

const collectTerminalSelectedRefs = (payload: RecordLike): Set<string> => {
  const refs = new Set<string>();
  const add = (value: unknown): void => {
    if (typeof value === "string" && value.trim()) refs.add(value.trim());
  };
  const terminalKind = readString(payload.terminal_artifact_kind);
  const terminalId = readString(payload.terminal_artifact_id);
  const terminalAuthority = readRecord(payload.terminal_authority_single_writer);
  const answerAuthority = readRecord(payload.terminal_answer_authority);
  add(readString(terminalAuthority?.selected_terminal_artifact_kind));
  add(readString(terminalAuthority?.selected_terminal_artifact_id));
  add(readString(answerAuthority?.terminal_artifact_kind));
  add(readString(answerAuthority?.terminal_artifact_id));
  add(terminalKind);
  add(terminalId);
  return refs;
};

const collectSupportSelectedRefs = (payload: RecordLike): Set<string> => {
  const refs = new Set<string>();
  const add = (value: unknown): void => {
    if (typeof value === "string" && value.trim()) refs.add(value.trim());
  };
  const addArray = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(add);
  };
  const loopTrace = readRecord(payload.loop_parity_trace);
  addArray(loopTrace?.evidence_selected_for_answer);
  const solverTrace = readRecord(payload.ask_turn_solver_trace);
  const evidenceReentry = readRecord(solverTrace?.evidence_reentry_gate);
  addArray(evidenceReentry?.selected_evidence_refs);
  const capabilityResult = readRecord(payload.capability_result);
  if (capabilityResult?.selected_for_answer === true) {
    add(readString(capabilityResult.capability_plan_id));
    addArray(capabilityResult.receipt_refs);
    addArray(capabilityResult.evidence_refs);
  }
  const terminalAuthority = readRecord(payload.terminal_authority_single_writer);
  const answerAuthority = readRecord(payload.terminal_answer_authority);
  addArray(terminalAuthority?.support_refs);
  addArray(answerAuthority?.support_refs);
  return refs;
};

const collectRejectedRefs = (payload: RecordLike): Set<string> => {
  const refs = new Set<string>();
  const add = (value: unknown): void => {
    if (typeof value === "string" && value.trim()) refs.add(value.trim());
  };
  const loopTrace = readRecord(payload.loop_parity_trace);
  for (const entry of Array.isArray(loopTrace?.evidence_rejected_for_answer) ? loopTrace.evidence_rejected_for_answer : []) {
    const record = readRecord(entry);
    add(record?.ref);
  }
  const evidenceReentry = readRecord(readRecord(payload.ask_turn_solver_trace)?.evidence_reentry_gate);
  for (const entry of Array.isArray(evidenceReentry?.rejected_evidence_refs) ? evidenceReentry.rejected_evidence_refs : []) {
    const record = readRecord(entry);
    add(record?.ref);
  }
  return refs;
};

const collectCompatibilityReenteredRefs = (payload: RecordLike): Set<string> => {
  const refs = new Set<string>();
  const add = (value: unknown): void => {
    if (typeof value === "string" && value.trim()) refs.add(value.trim());
  };
  const addArray = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(add);
  };
  const evidenceReentry = readRecord(readRecord(payload.ask_turn_solver_trace)?.evidence_reentry_gate);
  addArray(evidenceReentry?.selected_evidence_refs);
  addArray(evidenceReentry?.receipts_reentered);
  addArray(evidenceReentry?.projections_reentered);
  const capabilityResult = readRecord(payload.capability_result);
  if (capabilityResult?.reentered_solver === true) {
    addArray(capabilityResult.receipt_refs);
    addArray(capabilityResult.evidence_refs);
    add(readString(capabilityResult.capability_plan_id));
  }
  return refs;
};

const collectReenteredRefs = (input: {
  payload: RecordLike;
  turnId: string;
}): {
  refs: Set<string>;
  authority: "runtime_event_log" | "compatibility_projection";
  runtimeLifecycleVerified: boolean;
} => {
  const lifecycle = readVerifiedHelixRuntimeLifecycleFromPayload({
    payload: input.payload,
    turnId: input.turnId,
  });
  if (lifecycle) {
    return {
      refs: new Set(lifecycle.reduction.observation_reentry_refs),
      authority: "runtime_event_log",
      runtimeLifecycleVerified: true,
    };
  }
  return {
    refs: collectCompatibilityReenteredRefs(input.payload),
    authority: "compatibility_projection",
    runtimeLifecycleVerified: false,
  };
};

const artifactRefsOverlap = (artifact: {
  ref: string;
  kind: string;
  payloadRefs: string[];
}, refs: Set<string>): boolean =>
  refs.has(artifact.ref) ||
  refs.has(artifact.kind) ||
  artifact.payloadRefs.some((ref) => refs.has(ref));

const terminalAuthorityAllows = (input: {
  terminalAuthority: RecordLike | null;
  artifactRef: string;
  artifactKind: string;
  terminalArtifactKind: string;
  terminalArtifactId: string;
}): boolean =>
  readBoolean(input.terminalAuthority?.server_authoritative) &&
  (
    input.artifactKind !== "terminal" ||
    input.artifactKind === input.terminalArtifactKind ||
    input.artifactRef === input.terminalArtifactId ||
    input.artifactRef === input.terminalArtifactKind
  );

const producedArtifacts = (payload: RecordLike): Array<{ ref: string; kind: string; payloadRefs: string[] }> => {
  const entries: Array<{ ref: string; kind: string; payloadRefs: string[] }> = [];
  for (const artifact of Array.isArray(payload.current_turn_artifact_ledger) ? payload.current_turn_artifact_ledger : []) {
    const record = readRecord(artifact);
    if (!record) continue;
    const kind = readString(record.kind);
    const ref = readString(record.artifact_id) || readString(record.item_id) || kind;
    if (!ref || !kind) continue;
    entries.push({ ref, kind, payloadRefs: collectPayloadRefs(readRecord(record.payload)) });
  }
  const addTopLevel = (kind: string, value: unknown): void => {
    const record = readRecord(value);
    if (!record) return;
    const ref = readString(record.item_id) || readString(record.audit_id) || readString(record.result_id) || readString(record.retrieval_plan_id) || kind;
    entries.push({ ref, kind, payloadRefs: collectPayloadRefs(record) });
  };
  addTopLevel("capability_result", payload.capability_result);
  addTopLevel("procedure_evidence_retrieval_plan", payload.procedure_evidence_retrieval_plan);
  addTopLevel("procedure_evidence_retrieval_result", payload.procedure_evidence_retrieval_result);
  return entries;
};

const dedupeArtifacts = (artifacts: Array<{ ref: string; kind: string; payloadRefs: string[] }>): Array<{ ref: string; kind: string; payloadRefs: string[] }> => {
  const byKey = new Map<string, { ref: string; kind: string; payloadRefs: string[] }>();
  for (const artifact of artifacts) {
    const key = `${artifact.ref}:${artifact.kind}`;
    const existing = byKey.get(key);
    byKey.set(key, existing
      ? { ...existing, payloadRefs: unique([...existing.payloadRefs, ...artifact.payloadRefs]) }
      : artifact);
  }
  return [...byKey.values()];
};

export const buildSolverArtifactReentryAudit = (input: {
  turnId: string;
  payload: RecordLike;
  terminalArtifactKind?: string | null;
  terminalArtifactId?: string | null;
  finalAnswerSource?: string | null;
}): HelixSolverArtifactReentryAudit => {
  const terminalArtifactKind = readString(input.terminalArtifactKind) || readString(input.payload.terminal_artifact_kind) || "unknown";
  const terminalArtifactId = readString(input.terminalArtifactId) || readString(input.payload.terminal_artifact_id);
  const finalAnswerSource = readString(input.finalAnswerSource) || readString(input.payload.final_answer_source) || "unknown";
  const terminalSelectedRefs = collectTerminalSelectedRefs(input.payload);
  const supportSelectedRefs = collectSupportSelectedRefs(input.payload);
  const rejectedRefs = collectRejectedRefs(input.payload);
  const reentry = collectReenteredRefs({ payload: input.payload, turnId: input.turnId });
  const reenteredRefs = reentry.refs;
  const requiredTerminal = requiredTerminalKind(input.payload);
  const allowedKinds = allowedTerminalKinds(input.payload);
  const forbiddenKinds = forbiddenTerminalKinds(input.payload);
  const terminalAuthority = readRecord(input.payload.terminal_answer_authority);
  const solverTrace = readRecord(input.payload.ask_turn_solver_trace);
  const evidenceSelected = supportSelectedRefs.size > 0 || reenteredRefs.size > 0;
  const retrievalPlan = readRecord(input.payload.procedure_evidence_retrieval_plan);
  const retrievalResult = readRecord(input.payload.procedure_evidence_retrieval_result);
  const artifacts = dedupeArtifacts([
    ...producedArtifacts(input.payload),
    { ref: terminalArtifactId || terminalArtifactKind, kind: terminalArtifactKind, payloadRefs: [] },
    ...(retrievalPlan ? [{ ref: readString(retrievalPlan.retrieval_plan_id) || "procedure_evidence_retrieval_plan", kind: "procedure_evidence_retrieval_plan", payloadRefs: collectPayloadRefs(retrievalPlan) }] : []),
    ...(retrievalResult ? [{ ref: readString(retrievalResult.result_id) || "procedure_evidence_retrieval_result", kind: "procedure_evidence_retrieval_result", payloadRefs: collectPayloadRefs(retrievalResult) }] : []),
  ]);
  const terminalRelevantArtifacts = artifacts
    .filter((artifact) => {
      const classification = classifyArtifact(artifact.kind);
      return (
        classification !== "other" ||
        artifact.kind === terminalArtifactKind ||
        artifact.ref === terminalArtifactId ||
        artifactRefsOverlap(artifact, terminalSelectedRefs) ||
        artifactRefsOverlap(artifact, supportSelectedRefs) ||
        artifactRefsOverlap(artifact, rejectedRefs)
      );
    })
    .map((artifact): HelixSolverArtifactAuditEntry => {
      const classification =
        artifact.kind === terminalArtifactKind || artifact.ref === terminalArtifactId
          ? "terminal"
          : classifyArtifact(artifact.kind);
      const selectedForAnswer =
        artifact.kind === terminalArtifactKind ||
        artifact.ref === terminalArtifactId ||
        artifactRefsOverlap(artifact, terminalSelectedRefs);
      const selectedAsSupport = artifactRefsOverlap(artifact, supportSelectedRefs);
      const rejectedForAnswer = artifactRefsOverlap(artifact, rejectedRefs);
      const reenteredSolver = artifactRefsOverlap(artifact, reenteredRefs);
      const allowedByCanonicalGoal =
        !selectedForAnswer ||
        !isReceiptKind(artifact.kind) ||
        (requiredTerminal.length > 0 && requiredTerminal === artifact.kind);
      const allowedByRouteProductContract =
        !selectedForAnswer ||
        (
          !forbiddenKinds.includes(artifact.kind) &&
          (allowedKinds.length === 0 || allowedKinds.includes(artifact.kind) || artifact.kind !== terminalArtifactKind)
        );
      const allowedByTerminalAuthority = terminalAuthorityAllows({
        terminalAuthority,
        artifactRef: artifact.ref,
        artifactKind: classification,
        terminalArtifactKind,
        terminalArtifactId,
      });
      const failureCodes = unique<HelixSolverArtifactReentryFailureCode>([
        (selectedForAnswer || selectedAsSupport) && !reenteredSolver && classification !== "terminal" ? "artifact_not_reentered" : "",
        selectedForAnswer && isReceiptKind(artifact.kind) && !allowedByCanonicalGoal ? "receipt_selected_without_goal_authority" : "",
        selectedForAnswer && isProjectionKind(artifact.kind) && !evidenceSelected ? "projection_selected_without_evidence" : "",
        classification === "capability_result" && readRecord(input.payload.capability_result)?.selected_for_answer === true && !reenteredSolver
          ? "capability_result_not_reentered"
          : "",
        classification === "retrieval_plan" && retrievalPlan && !retrievalResult ? "retrieval_plan_without_result" : "",
        classification === "retrieval_result" && retrievalResult && !reenteredSolver ? "retrieval_result_not_arbitrated" : "",
        terminalAuthority?.server_authoritative === true && solverTrace && readBoolean(solverTrace.completed_solver_path) === false
          ? "terminal_answer_before_solver_completion"
          : "",
      ].filter((code): code is HelixSolverArtifactReentryFailureCode => Boolean(code)));
      return {
        ref: artifact.ref,
        kind: artifact.kind,
        produced: true,
        classified_as: classification,
        selected_for_answer: selectedForAnswer,
        selected_as_support: selectedAsSupport,
        rejected_for_answer: rejectedForAnswer,
        reentered_solver: reenteredSolver,
        allowed_by_canonical_goal: allowedByCanonicalGoal,
        allowed_by_route_product_contract: allowedByRouteProductContract,
        allowed_by_terminal_authority: allowedByTerminalAuthority,
        failure_codes: failureCodes,
        assistant_answer: false,
        raw_content_included: false,
      };
    });
  const failureCodes = unique(terminalRelevantArtifacts.flatMap((artifact) => artifact.failure_codes));
  return {
    schema: HELIX_SOLVER_ARTIFACT_REENTRY_AUDIT_SCHEMA,
    audit_id: `solver-artifact-reentry:${hashShort([input.turnId, terminalArtifactKind, terminalArtifactId, failureCodes])}`,
    turn_id: input.turnId,
    reentry_authority: reentry.authority,
    runtime_lifecycle_verified: reentry.runtimeLifecycleVerified,
    terminal_artifact_kind: terminalArtifactKind,
    terminal_artifact_id: terminalArtifactId || null,
    final_answer_source: finalAnswerSource,
    ok: failureCodes.length === 0,
    failure_codes: failureCodes,
    terminal_relevant_artifacts: terminalRelevantArtifacts,
    assistant_answer: false,
    raw_content_included: false,
  };
};
