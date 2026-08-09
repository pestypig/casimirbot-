import crypto from "node:crypto";
import { canonicalizeCasimirSpecValueV1 } from "@shared/contracts/casimir-spec-scientific-claim-ir.v1";
import {
  THEORY_EXPERIMENT_EXECUTION_CLOSURE_HASH_DOMAIN,
  THEORY_EXPERIMENT_EXECUTION_CLOSURE_RANKING_POLICY_V1,
  validateTheoryExperimentExecutionClosureV1,
} from "@shared/contracts/theory-experiment-execution-closure.v1";
import { missingRequestedTheoryContextIdentities } from "./requested-theory-context-identity";

export type HelixTheoryExecutionClosureTerminalReadiness = {
  artifactRef: string;
  closureSha256: string;
  status: "blocked" | "bounded_proposal_ready" | "bounded_comparison_ready";
  claimCeiling:
    | "procedure_only"
    | "semantic_comparison"
    | "formally_checked_comparison"
    | "numerically_checked_comparison"
    | "empirically_grounded_comparison";
  modelSynthesisAllowed: boolean;
  requiredSupportRefs: string[];
  terminalSupportRefs: string[];
  missingRequiredSupportRefs: string[];
  blockerCodes: string[];
  openRequirementCodes: string[];
  uncoveredOpenRequirementCodes: string[];
  reason: string;
};

export type HelixVisibleAnswerPolicyFaithfulnessGate = {
  schema: "helix.visible_answer_policy_faithfulness_gate.v1";
  turn_id: string;
  applies: boolean;
  ok: boolean;
  checked_text_ref?: string;
  violations: Array<
    | "receipt_promoted_to_authority"
    | "tool_observation_promoted_to_answer"
    | "voice_proposal_promoted_to_spoken"
    | "repo_evidence_claim_inverted"
    | "source_evidence_claim_inverted"
    | "explicit_no_tool_acknowledgement_missing"
    | "requested_theory_identity_coverage_missing"
    | "unsupported_lanyon_boundary_coverage_missing"
    | "theory_execution_closure_terminal_binding_invalid"
    | "theory_execution_closure_artifact_invalid"
    | "theory_execution_closure_synthesis_blocked"
    | "theory_execution_closure_support_refs_missing"
    | "theory_execution_closure_open_requirements_omitted"
    | "theory_execution_closure_claim_ceiling_exceeded"
    | "theory_execution_closure_physical_truth_overclaim"
  >;
  theory_execution_closure_readiness?: HelixTheoryExecutionClosureTerminalReadiness;
  theory_execution_closure_invalid_terminal_ref?: string;
  theory_execution_closure_invalid_artifact_ref?: string;
  repair_allowed: boolean;
  assistant_answer: false;
  raw_content_included: false;
};

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const readStrictStringArray = (value: unknown): string[] | null => {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string" || !entry.trim())
  ) {
    return null;
  }
  return Array.from(new Set(value.map((entry) => entry.trim())));
};

const readActivePrompt = (payload: RecordLike | undefined): string => {
  if (!payload) return "";
  const directPrompt =
    readString(payload.active_prompt) ||
    readString(payload.prompt) ||
    readString(payload.user_prompt);
  if (directPrompt) return directPrompt;
  return (
    readString(readRecord(payload.runtime_intent_packet)?.user_prompt) ||
    readString(readRecord(payload.provider_gateway_debug_summary)?.prompt) ||
    readString(readRecord(payload.tool_use_restatement)?.userGoal)
  );
};

const hasExplicitNoToolConstraint = (
  prompt: string,
  payload: RecordLike | undefined,
): boolean => {
  const solverTrace = readRecord(payload?.ask_turn_solver_trace);
  const promptInterpretation = readRecord(solverTrace?.prompt_interpretation);
  const recordedNegativeConstraints = readArray(
    promptInterpretation?.negative_constraints,
  )
    .map(readString)
    .filter(Boolean);
  const promptStatesNoToolConstraint =
    /\b(?:do not|don't|never)\s+(?:call|invoke|execute|run|use|open|browse|search|retrieve)\b/i.test(
      prompt,
    ) ||
    /\bwithout\s+(?:calling|invoking|executing|running|using|opening|browsing|searching|retrieving)\b/i.test(
      prompt,
    ) ||
    /\b(?:no|zero)\s+(?:other\s+)?tools?\b/i.test(prompt);
  const interpretationConfirmsNoToolConstraint =
    recordedNegativeConstraints.some((constraint) =>
      /\b(?:do not|don't|never|without|no)\b.{0,80}\b(?:call|invoke|execute|run|use|tool|browse|search|retrieve)\b/i.test(
        constraint,
      ),
    );
  return (
    promptStatesNoToolConstraint &&
    (recordedNegativeConstraints.length === 0 ||
      interpretationConfirmsNoToolConstraint)
  );
};

const isQuotedOrScreenVisibleExplanation = (prompt: string): boolean => {
  const asksForExplanation =
    /\b(?:explain|describe|interpret|define)\b/i.test(prompt) ||
    /\bwhat\b.{0,100}\bmeans?\b/i.test(prompt) ||
    /\bmeaning\b/i.test(prompt);
  const hasQuotedText =
    /`[^`\r\n]{1,180}`/.test(prompt) ||
    /["“”'][^"“”'\r\n]{1,180}["“”']/.test(prompt);
  const hasScreenVisibleLabel =
    /\b(?:screen|button|menu|dialog|interface|ui|tooltip|label|visible text)\b.{0,100}\b(?:says?|shows?|reads?|display(?:s|ed)?|label(?:s|ed)?)\b/i.test(
      prompt,
    ) ||
    /\b(?:says?|shows?|reads?)\b.{0,100}\b(?:on|in)\s+(?:the\s+)?(?:screen|ui|interface|button|menu|dialog)\b/i.test(
      prompt,
    );
  return asksForExplanation && (hasQuotedText || hasScreenVisibleLabel);
};

const hasVerifiedZeroToolCalls = (payload: RecordLike | undefined): boolean => {
  if (!payload) return false;
  const debug = readRecord(payload.debug);
  const loopParityTrace = readRecord(payload.loop_parity_trace);
  const gatewayCallSurfaces = [
    payload.workstation_gateway_call_results,
    debug?.workstation_gateway_call_results,
  ].filter(Array.isArray);
  const capabilityLaneCallSurfaces = [
    payload.capability_lane_call_results,
    debug?.capability_lane_call_results,
  ].filter(Array.isArray);
  const loopParityCalls = loopParityTrace?.actual_tool_calls;
  const lifecycleTraces = payload.tool_lifecycle_traces;
  const gatewaySurfacePresent =
    gatewayCallSurfaces.length > 0 && capabilityLaneCallSurfaces.length > 0;
  const runtimeSurfaces = [
    ...(Array.isArray(loopParityCalls) ? [loopParityCalls] : []),
    ...(Array.isArray(lifecycleTraces) ? [lifecycleTraces] : []),
  ];
  if (!gatewaySurfacePresent) return false;
  return (
    gatewayCallSurfaces.every((surface) => surface.length === 0) &&
    capabilityLaneCallSurfaces.every((surface) => surface.length === 0) &&
    runtimeSurfaces.every((surface) => surface.length === 0)
  );
};

const hasAffirmativeOperatorCommand = (
  payload: RecordLike | undefined,
): boolean => {
  const solverTrace = readRecord(payload?.ask_turn_solver_trace);
  const promptInterpretation = readRecord(solverTrace?.prompt_interpretation);
  return (
    readArray(promptInterpretation?.executable_operator_commands).length > 0
  );
};

const isModelOnlyDirectAnswer = (payload: RecordLike | undefined): boolean => {
  if (!payload) return false;
  const terminalKind = readString(payload.terminal_artifact_kind);
  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  const committedRoute = readRecord(payload.committed_ask_route);
  const committedRouteRecord = readRecord(committedRoute?.route);
  return (
    terminalKind === "direct_answer_text" &&
    (readString(canonicalGoal?.answer_scope) === "model_only" ||
      readString(canonicalGoal?.goal_kind) === "model_only_concept" ||
      readString(committedRouteRecord?.source_target) === "model_only")
  );
};

const answerAcknowledgesNoToolExecution = (text: string): boolean =>
  /\b(?:I|we)\s+(?:did|have)\s+not\s+(?:call|execute|run|invoke|use)\b.{0,60}\btools?\b/i.test(
    text,
  ) ||
  /\b(?:no|zero)\s+(?:other\s+)?tools?\s+(?:(?:were|was|have been|are)\s+)?(?:called|executed|run|invoked|used)\b/i.test(
    text,
  ) ||
  /\b(?:this|the)\s+(?:answer|explanation|response)\s+(?:does|did)\s+not\s+(?:call|execute|run|invoke|use)\b.{0,60}\btools?\b/i.test(
    text,
  ) ||
  /\bwithout\s+(?:calling|executing|running|invoking|using)\b.{0,60}\btools?\b/i.test(
    text,
  );

const readAuthenticUnsupportedLanyonCaseId = (
  payload: RecordLike | undefined,
): string => {
  if (!payload) return "";
  const activeTurnId = readString(payload.turn_id);
  if (!activeTurnId) return "";
  for (const artifactValue of readArray(payload.current_turn_artifact_ledger)) {
    const artifact = readRecord(artifactValue);
    const observation = readRecord(artifact?.payload);
    const procedure = readRecord(observation?.procedure);
    const lanyonEligibility = readRecord(procedure?.lanyonEligibility);
    const authority = readRecord(procedure?.authority);
    const blockers = readArray(lanyonEligibility?.blockers)
      .map(readString)
      .filter(Boolean);
    if (
      readString(artifact?.kind) !==
        "theory_experiment_procedure_observation" ||
      !readString(artifact?.artifact_id).startsWith(`${activeTurnId}:`) ||
      readString(observation?.schema) !==
        "casimir.theory_experiment_procedure.observation.v1" ||
      readString(observation?.turn_id) !== activeTurnId ||
      readString(observation?.status) !== "succeeded" ||
      observation?.terminal_eligible !== false ||
      observation?.assistant_answer !== false ||
      observation?.raw_content_included !== false ||
      lanyonEligibility?.requested !== true ||
      readString(lanyonEligibility?.status) !== "ineligible" ||
      !blockers.includes("unsupported_lanyon_case") ||
      authority?.preparesProcedureOnly !== true ||
      authority?.executesTools !== false ||
      authority?.terminalEligible !== false ||
      authority?.assistantAnswer !== false
    ) {
      continue;
    }
    return readString(lanyonEligibility?.requestedCaseId);
  }
  return "";
};

const humanizeUnsupportedLanyonCaseId = (caseId: string): string =>
  caseId
    .replace(/^unregistered_/i, "")
    .replace(/(^|_)2d(?=_|$)/i, "$12D")
    .replace(/_/g, " ")
    .trim();

export const unsupportedLanyonBoundaryPresentationLine = (
  payload: RecordLike | undefined,
): string => {
  const caseId = readAuthenticUnsupportedLanyonCaseId(payload);
  if (!caseId) return "";
  const humanCase = humanizeUnsupportedLanyonCaseId(caseId);
  return (
    `Requested Lanyon case: \`${caseId}\`` +
    `${humanCase ? ` (${humanCase})` : ""}. ` +
    "The preparation rail did not run code or execute a Lanyon job; it only reported the typed ineligibility boundary."
  );
};

const unsupportedLanyonBoundaryCoverageMissing = (
  payload: RecordLike | undefined,
  text: string,
): boolean => {
  const caseId = readAuthenticUnsupportedLanyonCaseId(payload);
  if (!caseId) return false;
  const humanCase = humanizeUnsupportedLanyonCaseId(caseId);
  const caseCovered =
    text.toLowerCase().includes(caseId.toLowerCase()) ||
    (/\b(?:2d|two[- ]dimensional)\b/i.test(text) &&
      /\badaptive(?:[- ]mesh)?\b/i.test(text)) ||
    (Boolean(humanCase) &&
      humanCase
        .split(/\s+/)
        .filter((token) => token.length > 2)
        .every((token) =>
          new RegExp(
            `\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "i",
          ).test(text),
        ));
  const nonExecutionCovered =
    /\b(?:did|does|will|was|were|has|have)\s+not\s+(?:run|execute|start)\b/i.test(
      text,
    ) ||
    /\b(?:not|never)\s+(?:run|executed|started)\b/i.test(text) ||
    /\bno\b.{0,60}\b(?:code|job|run|execution)\b.{0,40}\b(?:run|executed|started|occurred|performed)\b/i.test(
      text,
    ) ||
    /\bcannot\b.{0,80}\b(?:run|execute|support)\b/i.test(text);
  return !caseCovered || !nonExecutionCovered;
};

type AuthenticTheoryExecutionClosureReadiness = Omit<
  HelixTheoryExecutionClosureTerminalReadiness,
  | "terminalSupportRefs"
  | "missingRequiredSupportRefs"
  | "uncoveredOpenRequirementCodes"
>;

const canonicalTheoryExecutionClosureSha256 = (
  closure: RecordLike,
): string | null => {
  try {
    const unsigned = { ...closure };
    delete unsigned.closureSha256;
    delete unsigned.artifactId;
    delete unsigned.schemaVersion;
    return crypto
      .createHash("sha256")
      .update(
        canonicalizeCasimirSpecValueV1({
          domain: THEORY_EXPERIMENT_EXECUTION_CLOSURE_HASH_DOMAIN,
          value: unsigned,
        }),
      )
      .digest("hex");
  } catch {
    return null;
  }
};

const canonicalTheoryExecutionClosureRankingPolicySha256 = (): string | null => {
  try {
    return crypto
      .createHash("sha256")
      .update(
        canonicalizeCasimirSpecValueV1({
          domain:
            "theory-experiment-execution-closure-ranking-policy/v1",
          value: THEORY_EXPERIMENT_EXECUTION_CLOSURE_RANKING_POLICY_V1,
        }),
      )
      .digest("hex");
  } catch {
    return null;
  }
};

const readAuthenticTheoryExecutionClosureReadiness = (
  payload: RecordLike | undefined,
  boundArtifactRef: string,
): {
  readiness: AuthenticTheoryExecutionClosureReadiness | null;
  invalidArtifactRef: string;
} => {
  if (!payload) return { readiness: null, invalidArtifactRef: "" };
  const activeTurnId = readString(payload.turn_id);
  if (!activeTurnId || !boundArtifactRef) {
    return { readiness: null, invalidArtifactRef: "" };
  }
  const boundArtifacts = readArray(payload.current_turn_artifact_ledger)
    .map(readRecord)
    .filter(
      (artifact): artifact is RecordLike =>
        Boolean(artifact) &&
        readString(artifact?.artifact_id) === boundArtifactRef,
    );
  if (boundArtifacts.length !== 1) {
    return {
      readiness: null,
      invalidArtifactRef: boundArtifactRef,
    };
  }
  let invalidArtifactRef = "";
  for (const artifact of boundArtifacts) {
    const observation = readRecord(artifact?.payload);
    const closure = readRecord(observation?.closure);
    const readiness = readRecord(closure?.synthesisReadiness);
    const authority = readRecord(closure?.authority);
    const ranking = readRecord(closure?.ranking);
    const closureSha256 = readString(closure?.closureSha256);
    const expectedClosureSha256 = closure
      ? canonicalTheoryExecutionClosureSha256(closure)
      : null;
    const expectedRankingPolicySha256 =
      canonicalTheoryExecutionClosureRankingPolicySha256();
    const artifactRef = readString(artifact?.artifact_id);
    const status = readString(readiness?.status);
    const claimCeiling = readString(readiness?.claimCeiling);
    const requiredSupportRefs = readStrictStringArray(
      readiness?.requiredSupportRefs,
    );
    const blockerCodes = readStrictStringArray(readiness?.blockerCodes);
    const openRequirementCodes = readStrictStringArray(
      readiness?.openRequirementCodes,
    );
    const reason = readString(readiness?.reason);
    const claimsNormalizedClosure =
      readString(artifact?.kind) === "theory_experiment_execution_closure" ||
      readString(artifact?.observation_kind) ===
        "theory_experiment_execution_closure" ||
      readString(artifact?.source_capability_id) ===
        "theory-experiment-procedure.evaluate_closure" ||
      readString(observation?.schema) ===
        "casimir.theory_experiment_execution_closure.observation.v1";
    if (
      readString(artifact?.schema) !== "helix.current_turn_artifact.v1" ||
      readString(artifact?.kind) !== "theory_experiment_execution_closure" ||
      readString(artifact?.observation_kind) !==
        "theory_experiment_execution_closure" ||
      readString(artifact?.payload_schema) !==
        "casimir.theory_experiment_execution_closure.observation.v1" ||
      !artifactRef.startsWith(`${activeTurnId}:`) ||
      readString(artifact?.turn_id) !== activeTurnId ||
      readString(artifact?.capability_key) !==
        "theory-experiment-procedure.evaluate_closure" ||
      readString(artifact?.source_capability_id) !==
        "theory-experiment-procedure.evaluate_closure" ||
      readString(artifact?.source_observation_schema) !==
        "casimir.theory_experiment_execution_closure.observation.v1" ||
      readString(artifact?.source_observation_status) !== "succeeded" ||
      readString(artifact?.status) !== "succeeded" ||
      artifact?.terminal_eligible !== false ||
      artifact?.post_tool_model_step_required !== true ||
      artifact?.assistant_answer !== false ||
      artifact?.raw_content_included !== false ||
      !/^[a-f0-9]{64}$/.test(closureSha256) ||
      readString(artifact?.content_sha256) !== closureSha256 ||
      readString(observation?.schema) !==
        "casimir.theory_experiment_execution_closure.observation.v1" ||
      readString(observation?.kind) !== "theory_experiment_execution_closure" ||
      readString(observation?.capability_key) !==
        "theory-experiment-procedure.evaluate_closure" ||
      readString(observation?.source_capability_id) !==
        "theory-experiment-procedure.evaluate_closure" ||
      readString(observation?.status) !== "succeeded" ||
      readString(observation?.output_role) !==
        "evidence_for_bounded_synthesis" ||
      readString(observation?.observation_role) !==
        "evidence_not_assistant_answer" ||
      observation?.terminal_eligible !== false ||
      observation?.post_tool_model_step_required !== true ||
      observation?.assistant_answer !== false ||
      observation?.raw_content_included !== false ||
      closure?.artifactId !== "theory_experiment_execution_closure" ||
      closure?.schemaVersion !== "theory_experiment_execution_closure/v1" ||
      validateTheoryExperimentExecutionClosureV1(closure).length !== 0 ||
      closureSha256 !== expectedClosureSha256 ||
      readString(ranking?.policySha256) !== expectedRankingPolicySha256 ||
      readString(closure?.turnId) !== activeTurnId ||
      authority?.executorOwner !== "agent_runtime" ||
      authority?.evaluatesEvidenceOnly !== true ||
      authority?.executesTools !== false ||
      authority?.ranksEvidenceCoverageOnly !== true ||
      authority?.validatesTheory !== false ||
      authority?.validatesGeneratedCode !== false ||
      authority?.proofAuthority !== false ||
      authority?.numericalAuthority !== false ||
      authority?.empiricalAuthority !== false ||
      authority?.physicalTruthAuthority !== false ||
      authority?.terminalEligible !== false ||
      authority?.assistantAnswer !== false ||
      authority?.postToolModelStepRequired !== true ||
      ![
        "blocked",
        "bounded_proposal_ready",
        "bounded_comparison_ready",
      ].includes(status) ||
      ![
        "procedure_only",
        "semantic_comparison",
        "formally_checked_comparison",
        "numerically_checked_comparison",
        "empirically_grounded_comparison",
      ].includes(claimCeiling) ||
      typeof readiness?.modelSynthesisAllowed !== "boolean" ||
      (status === "blocked") !== (readiness.modelSynthesisAllowed === false) ||
      requiredSupportRefs === null ||
      blockerCodes === null ||
      openRequirementCodes === null ||
      !reason
    ) {
      if (claimsNormalizedClosure) {
        invalidArtifactRef = artifactRef || `${activeTurnId}:closure:invalid`;
      }
      continue;
    }
    return {
      readiness: {
        artifactRef,
        closureSha256,
        status: status as AuthenticTheoryExecutionClosureReadiness["status"],
        claimCeiling:
          claimCeiling as AuthenticTheoryExecutionClosureReadiness["claimCeiling"],
        modelSynthesisAllowed: readiness.modelSynthesisAllowed,
        requiredSupportRefs,
        blockerCodes,
        openRequirementCodes,
        reason,
      },
      invalidArtifactRef: "",
    };
  }
  return { readiness: null, invalidArtifactRef };
};

const THEORY_EXECUTION_CLOSURE_SYNTHESIS_TERMINAL_KINDS = new Set([
  "model_synthesized_answer",
  "compound_evidence_synthesis_answer",
  "theory_context_reflection_answer",
  "agent_provider_terminal_candidate",
]);

const isTheoryExecutionClosureSynthesisTerminal = (
  payload: RecordLike | undefined,
): boolean => {
  const terminalKind = readString(payload?.terminal_artifact_kind);
  const finalAnswerSource = readString(payload?.final_answer_source);
  return (
    THEORY_EXECUTION_CLOSURE_SYNTHESIS_TERMINAL_KINDS.has(terminalKind) ||
    THEORY_EXECUTION_CLOSURE_SYNTHESIS_TERMINAL_KINDS.has(finalAnswerSource)
  );
};

const theoryExecutionClosureArtifactClaimed = (
  artifact: RecordLike,
): boolean => {
  const observation = readRecord(artifact.payload);
  return (
    readString(artifact.kind) === "theory_experiment_execution_closure" ||
    readString(artifact.observation_kind) ===
      "theory_experiment_execution_closure" ||
    readString(artifact.source_capability_id) ===
      "theory-experiment-procedure.evaluate_closure" ||
    readString(observation?.schema) ===
      "casimir.theory_experiment_execution_closure.observation.v1"
  );
};

const terminalSupportRefsFromRecord = (
  record: RecordLike | null,
): string[] =>
  record
    ? Array.from(
        new Set(
          [
            ...readArray(record.support_refs),
            ...readArray(record.source_observation_refs),
            ...readArray(record.artifact_refs),
            ...readArray(record.evidence_refs),
            ...readArray(record.grounded_in_observation_refs),
            ...readArray(record.subgoal_observation_refs),
          ]
            .map(readString)
            .filter(Boolean),
        ),
      )
    : [];

const terminalRecordIdentityRefs = (
  record: RecordLike | null,
): string[] =>
  record
    ? Array.from(
        new Set(
          [
            record.artifact_id,
            record.answer_id,
            record.candidate_id,
            record.draft_id,
            record.terminal_item_id,
            record.id,
          ]
            .map(readString)
            .filter(Boolean),
        ),
      )
    : [];

const selectedTerminalRecordForKind = (
  payload: RecordLike,
  terminalKind: string,
): RecordLike | null => {
  if (terminalKind === "agent_provider_terminal_candidate") {
    return (
      readRecord(payload.provider_terminal_candidate) ??
      readRecord(payload.agent_provider_terminal_candidate)
    );
  }
  return readRecord(payload[terminalKind]);
};

const ledgerArtifactMatchesSelectedTerminalKind = (
  artifact: RecordLike,
  selectedKind: string,
): boolean => {
  const nested = readRecord(artifact.payload);
  const identityText = [
    artifact.kind,
    artifact.observation_kind,
    nested?.kind,
    nested?.terminal_artifact_kind,
    nested?.schema,
  ]
    .map(readString)
    .join(" ");
  if (
    selectedKind === "model_synthesized_answer" &&
    /\b(?:model_synthesized_answer|final_answer_draft)\b/i.test(identityText)
  ) {
    return true;
  }
  if (
    selectedKind === "agent_provider_terminal_candidate" &&
    /\b(?:agent_provider_terminal_candidate|provider_terminal_candidate)\b/i.test(
      identityText,
    )
  ) {
    return true;
  }
  return identityText.includes(selectedKind);
};

type SelectedTheoryExecutionClosureTerminalBinding = {
  applies: boolean;
  selectedKind: string;
  selectedRef: string;
  supportRefs: string[];
  invalidRef: string;
};

const readSelectedTheoryExecutionClosureTerminalBinding = (
  payload: RecordLike | undefined,
): SelectedTheoryExecutionClosureTerminalBinding => {
  if (!payload) {
    return {
      applies: false,
      selectedKind: "",
      selectedRef: "",
      supportRefs: [],
      invalidRef: "",
    };
  }
  const writer = readRecord(payload.terminal_authority_single_writer);
  const authority = readRecord(payload.terminal_answer_authority);
  const presentation = readRecord(payload.terminal_presentation);
  const materialization = readRecord(
    payload.provider_route_product_materialization,
  );
  const materializedKind = readString(
    materialization?.materialized_terminal_artifact_kind,
  );
  const materializedRef = readString(
    materialization?.materialized_terminal_artifact_ref,
  );
  const hasExactMaterializedSelection =
    Boolean(materializedRef) &&
    THEORY_EXECUTION_CLOSURE_SYNTHESIS_TERMINAL_KINDS.has(materializedKind);
  const selectedKinds = hasExactMaterializedSelection
    ? [materializedKind]
    : Array.from(
        new Set(
          [
            payload.terminal_artifact_kind,
            writer?.selected_terminal_artifact_kind,
            writer?.terminal_artifact_kind,
            authority?.terminal_artifact_kind,
            presentation?.terminal_artifact_kind,
          ]
            .map(readString)
            .filter((kind) =>
              THEORY_EXECUTION_CLOSURE_SYNTHESIS_TERMINAL_KINDS.has(kind),
            ),
        ),
      );
  if (selectedKinds.length === 0) {
    return {
      applies: false,
      selectedKind: "",
      selectedRef: "",
      supportRefs: [],
      invalidRef: "",
    };
  }
  if (selectedKinds.length !== 1) {
    return {
      applies: true,
      selectedKind: selectedKinds.join("|"),
      selectedRef: "",
      supportRefs: [],
      invalidRef: "ambiguous_terminal_kind",
    };
  }

  const selectedKind = selectedKinds[0];
  const mappedTerminalRecord = selectedTerminalRecordForKind(
    payload,
    selectedKind,
  );
  const authorityRefs = hasExactMaterializedSelection
    ? [materializedRef]
    : Array.from(
        new Set(
          [
            payload.terminal_artifact_id,
            writer?.selected_terminal_artifact_ref,
            writer?.selectedArtifactRef,
            authority?.terminal_item_id,
            authority?.terminal_artifact_ref,
            presentation?.terminal_authority_ref,
          ]
            .map(readString)
            .filter(Boolean),
        ),
      );
  const recordRefs = terminalRecordIdentityRefs(mappedTerminalRecord);
  const selectedRefs =
    authorityRefs.length > 0 ? authorityRefs : recordRefs;
  if (selectedRefs.length !== 1) {
    return {
      applies: true,
      selectedKind,
      selectedRef: selectedRefs.join("|"),
      supportRefs: [],
      invalidRef:
        selectedRefs.length === 0
          ? "selected_terminal_ref_missing"
          : selectedRefs.join("|"),
    };
  }
  const selectedRef = selectedRefs[0];
  const exactLedgerArtifacts = readArray(
    payload.current_turn_artifact_ledger,
  )
    .map(readRecord)
    .filter(
      (artifact): artifact is RecordLike =>
        Boolean(artifact) &&
        readString(artifact?.artifact_id) === selectedRef,
    );
  if (exactLedgerArtifacts.length > 1) {
    return {
      applies: true,
      selectedKind,
      selectedRef,
      supportRefs: [],
      invalidRef: selectedRef,
    };
  }
  if (exactLedgerArtifacts.length === 1) {
    const selectedArtifact = exactLedgerArtifacts[0];
    if (
      !ledgerArtifactMatchesSelectedTerminalKind(
        selectedArtifact,
        selectedKind,
      )
    ) {
      return {
        applies: true,
        selectedKind,
        selectedRef,
        supportRefs: [],
        invalidRef: selectedRef,
      };
    }
    return {
      applies: true,
      selectedKind,
      selectedRef,
      supportRefs: Array.from(
        new Set([
          ...terminalSupportRefsFromRecord(selectedArtifact),
          ...terminalSupportRefsFromRecord(
            readRecord(selectedArtifact.payload),
          ),
        ]),
      ),
      invalidRef: "",
    };
  }

  if (
    !mappedTerminalRecord ||
    !terminalRecordIdentityRefs(mappedTerminalRecord).includes(selectedRef)
  ) {
    return {
      applies: true,
      selectedKind,
      selectedRef,
      supportRefs: [],
      invalidRef: selectedRef,
    };
  }
  return {
    applies: true,
    selectedKind,
    selectedRef,
    supportRefs: terminalSupportRefsFromRecord(mappedTerminalRecord),
    invalidRef: "",
  };
};

const readBoundTheoryExecutionClosureRef = (
  payload: RecordLike | undefined,
  terminalSupportRefs: string[],
): {
  closureArtifactsPresent: boolean;
  boundArtifactRef: string;
  invalidRef: string;
} => {
  if (!payload) {
    return {
      closureArtifactsPresent: false,
      boundArtifactRef: "",
      invalidRef: "",
    };
  }
  const closureArtifacts = readArray(payload.current_turn_artifact_ledger)
    .map(readRecord)
    .filter(
      (artifact): artifact is RecordLike =>
        Boolean(artifact) && theoryExecutionClosureArtifactClaimed(artifact),
    );
  if (closureArtifacts.length === 0) {
    return {
      closureArtifactsPresent: false,
      boundArtifactRef: "",
      invalidRef: "",
    };
  }
  const boundRefs = Array.from(
    new Set(
      closureArtifacts
        .map((artifact) => readString(artifact.artifact_id))
        .filter((ref) => ref && terminalSupportRefs.includes(ref)),
    ),
  );
  if (boundRefs.length === 0) {
    return {
      closureArtifactsPresent: true,
      boundArtifactRef: "",
      invalidRef: "selected_terminal_does_not_bind_execution_closure",
    };
  }
  if (boundRefs.length > 1) {
    const supportedClosures = closureArtifacts.filter((artifact) =>
      boundRefs.includes(readString(artifact.artifact_id)),
    );
    const orderedRetries = supportedClosures
      .map((artifact) => {
        const observation = readRecord(artifact.payload);
        const closure = readRecord(observation?.closure);
        const procedureBinding = readRecord(closure?.procedureBinding);
        return {
          artifactRef: readString(artifact.artifact_id),
          procedureSha256: readString(procedureBinding?.procedureSha256),
          generatedAtMs: Date.parse(readString(closure?.generatedAt)),
        };
      })
      .sort((left, right) => right.generatedAtMs - left.generatedAtMs);
    const procedureHashes = new Set(
      orderedRetries
        .map((lineage) => lineage.procedureSha256)
        .filter(Boolean),
    );
    const retryLineageIsUnambiguous =
      procedureHashes.size === 1 &&
      orderedRetries.every(
        (lineage) =>
          Boolean(lineage.procedureSha256) &&
          Number.isFinite(lineage.generatedAtMs),
      ) &&
      orderedRetries[0]?.generatedAtMs !== orderedRetries[1]?.generatedAtMs;
    return {
      closureArtifactsPresent: true,
      boundArtifactRef: retryLineageIsUnambiguous
        ? orderedRetries[0]?.artifactRef ?? ""
        : "",
      invalidRef: retryLineageIsUnambiguous ? "" : boundRefs.join("|"),
    };
  }
  return {
    closureArtifactsPresent: true,
    boundArtifactRef: boundRefs[0],
    invalidRef: "",
  };
};

const openRequirementCoveragePattern = (code: string): RegExp | null => {
  if (/semantic/i.test(code)) return /\bsemantic(?:s|ally)?\b/i;
  if (/formal|theorem|proof|lean/i.test(code)) {
    return /\b(?:formal|theorem|proof|lean)\b/i;
  }
  if (/numerical|solver|simulation|convergence|precision/i.test(code)) {
    return /\b(?:numerical|solver|simulation|convergence|precision)\b/i;
  }
  if (/empirical|observation|measurement|experiment/i.test(code)) {
    return /\b(?:empirical|observational?|measurement|experiment)\b/i;
  }
  if (/lanyon|artifact|fixture|bundle|sandbox/i.test(code)) {
    return /\b(?:lanyon|artifact|fixture|bundle|sandbox)\b/i;
  }
  if (/graph|congruence/i.test(code)) return /\b(?:graph|congruence)\b/i;
  if (/derivation|equation/i.test(code)) return /\b(?:derivation|equation)\b/i;
  if (/observable/i.test(code)) return /\bobservables?\b/i;
  if (/frame|coordinate/i.test(code)) return /\b(?:frame|coordinate)\b/i;
  if (/unit|dimension/i.test(code)) return /\b(?:unit|dimension)\b/i;
  if (/boundary|initial_condition/i.test(code)) {
    return /\b(?:boundary|initial condition)\b/i;
  }
  if (/source|provenance/i.test(code)) return /\b(?:source|provenance)\b/i;
  if (/candidate|comparab/i.test(code)) {
    return /\b(?:candidate|comparable|comparison)\b/i;
  }
  return null;
};

const uncoveredOpenRequirementCodes = (
  codes: string[],
  text: string,
): string[] => {
  if (codes.length === 0) return [];
  const clauses = text
    .split(/(?<=[.!?;])\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean);
  const pendingBoundaryPattern =
    /\b(?:remain(?:s|ed)?\s+open|open requirements?|still\s+(?:missing|pending|unresolved|requires?)|not\s+yet|pending|unresolved|missing|required\s+before|requires?\b.{0,80}\bbefore|has\s+not\s+been|have\s+not\s+been|not\s+(?:run|executed|checked|verified|validated|completed|satisfied))\b/i;
  const successPattern =
    String.raw`\b(?:passed|satisfied|complete(?:d)?|verified|validated|confirmed|established|resolved|closed)\b`;
  return codes.filter((code) => {
    const pattern = openRequirementCoveragePattern(code);
    if (!pattern) return true;
    const exactCode = code.toLowerCase();
    const spacedCode = code.replaceAll("_", " ").toLowerCase();
    return !clauses.some((clause) => {
      const foldedClause = clause.toLowerCase();
      const categoryPresent =
        foldedClause.includes(exactCode) ||
        foldedClause.includes(spacedCode) ||
        pattern.test(clause);
      if (!categoryPresent || !pendingBoundaryPattern.test(clause)) {
        return false;
      }
      const categoryThenSuccess = new RegExp(
        `${pattern.source}[\\s\\S]{0,70}${successPattern}`,
        "i",
      );
      const successThenCategory = new RegExp(
        `${successPattern}[\\s\\S]{0,70}${pattern.source}`,
        "i",
      );
      return (
        !categoryThenSuccess.test(clause) &&
        !successThenCategory.test(clause)
      );
    });
  });
};

const closureClaimCeilingExceeded = (
  claimCeiling: string,
  text: string,
): boolean => {
  if (!claimCeiling) return false;
  const formalClaim =
    /\b(?:formally|lean(?:\s*4)?|proof[-\s]assistant)\s+(?:proved|verified|certified|established)\b/i.test(
      text,
    ) ||
    /\bformal\s+(?:proof|certificate|replay)\s+(?:passed|proved|verified|established)\b/i.test(
      text,
    );
  const numericalClaim =
    /\b(?:numerically|simulation|solver)\s+(?:verified|validated|confirmed|converged|passed)\b/i.test(
      text,
    ) ||
    /\bindependent\s+numerical\s+(?:certificate|replay)\s+(?:passed|verified|validated)\b/i.test(
      text,
    );
  const empiricalClaim =
    /\b(?:empirically|experimentally|observationally)\s+(?:verified|validated|confirmed|established|observed)\b/i.test(
      text,
    ) ||
    /\bmeasurements?\s+(?:prove|proved|confirm|confirmed|validate|validated|establish|established)\b/i.test(
      text,
    );
  if (claimCeiling === "procedure_only") {
    return formalClaim || numericalClaim || empiricalClaim;
  }
  if (claimCeiling === "semantic_comparison") {
    return formalClaim || numericalClaim || empiricalClaim;
  }
  if (claimCeiling === "formally_checked_comparison") {
    return numericalClaim || empiricalClaim;
  }
  if (claimCeiling === "numerically_checked_comparison") {
    return empiricalClaim;
  }
  return false;
};

const closurePhysicalTruthOverclaim = (
  claimCeiling: string,
  text: string,
): boolean => {
  if (!claimCeiling) return false;
  const directTruthClaim =
    /\b(?:proves?|proved|establishes?|established|certifies?|certified)\s+(?:the\s+)?physical\s+truth\b/i.test(
      text,
    ) ||
    /\b(?:the|this)\s+(?:theory|mechanism|model)\s+(?:is|has\s+been|was)\s+(?:true|proven\s+true|physically\s+proven|validated\s+as\s+true)\b/i.test(
      text,
    );
  if (directTruthClaim) return true;
  return text
    .split(/(?<=[.!?;])\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean)
    .some((clause) => {
      const truthProbabilityClaim =
        /\b(?:\d{1,3}(?:\.\d+)?\s*%\s+)?(?:likely|probable|probability|chance|odds|confidence)\b[\s\S]{0,90}\b(?:physically\s+correct|physical\s+truth|true|real|works?|valid)\b/i.test(
          clause,
        ) ||
        /\b(?:physically\s+correct|physical\s+truth|theory|mechanism|model)\b[\s\S]{0,90}\b(?:\d{1,3}(?:\.\d+)?\s*%\s+)?(?:likely|probable|probability|chance|odds|confidence)\b/i.test(
          clause,
        );
      if (!truthProbabilityClaim) return false;
      return !/\b(?:not|no|cannot|can't|does\s+not|is\s+not)\b[\s\S]{0,45}\b(?:truth\s+probability|probability|likely|confidence|odds|chance)\b/i.test(
        clause,
      );
    });
};

export function evaluateVisibleAnswerPolicyFaithfulnessGate(input: {
  turnId: string;
  text: string;
  payload?: RecordLike;
  checkedTextRef?: string;
}): HelixVisibleAnswerPolicyFaithfulnessGate {
  const text = String(input.text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const activePrompt = readActivePrompt(input.payload);
  const terminalKind = readString(input.payload?.terminal_artifact_kind);
  const sourceTarget = readString(
    readRecord(input.payload?.source_target_intent)?.target_source,
  );
  const missingRequestedTheoryIdentities =
    terminalKind === "theory_context_reflection_answer"
      ? missingRequestedTheoryContextIdentities(activePrompt, text)
      : [];
  const requiresNoToolAcknowledgement =
    Boolean(text) &&
    isModelOnlyDirectAnswer(input.payload) &&
    hasExplicitNoToolConstraint(activePrompt, input.payload) &&
    isQuotedOrScreenVisibleExplanation(activePrompt) &&
    hasVerifiedZeroToolCalls(input.payload) &&
    !hasAffirmativeOperatorCommand(input.payload);
  const requiresUnsupportedLanyonBoundaryCoverage =
    Boolean(text) &&
    unsupportedLanyonBoundaryCoverageMissing(input.payload, text);
  const closureSynthesisTerminal = isTheoryExecutionClosureSynthesisTerminal(
    input.payload,
  );
  const selectedClosureTerminalBinding =
    readSelectedTheoryExecutionClosureTerminalBinding(input.payload);
  const boundClosureSelection = readBoundTheoryExecutionClosureRef(
    input.payload,
    selectedClosureTerminalBinding.supportRefs,
  );
  const invalidClosureTerminalRef =
    closureSynthesisTerminal &&
    boundClosureSelection.closureArtifactsPresent
      ? selectedClosureTerminalBinding.invalidRef ||
        boundClosureSelection.invalidRef
      : "";
  const closureReadinessAdmission =
    boundClosureSelection.boundArtifactRef && !invalidClosureTerminalRef
      ? readAuthenticTheoryExecutionClosureReadiness(
          input.payload,
          boundClosureSelection.boundArtifactRef,
        )
      : { readiness: null, invalidArtifactRef: "" };
  const authenticClosureReadiness = closureReadinessAdmission.readiness;
  const invalidClosureArtifactRef =
    closureReadinessAdmission.invalidArtifactRef;
  const closureClaimCeiling = authenticClosureReadiness?.claimCeiling ?? "";
  const terminalSupportRefs = authenticClosureReadiness
    ? selectedClosureTerminalBinding.supportRefs
    : [];
  const missingRequiredSupportRefs = authenticClosureReadiness
    ? Array.from(
        new Set([
          authenticClosureReadiness.artifactRef,
          ...authenticClosureReadiness.requiredSupportRefs,
        ]),
      ).filter((ref) => !terminalSupportRefs.includes(ref))
    : [];
  const uncoveredClosureOpenRequirements = authenticClosureReadiness
    ? uncoveredOpenRequirementCodes(
        authenticClosureReadiness.openRequirementCodes,
        text,
      )
    : [];
  const closureTerminalReadiness: HelixTheoryExecutionClosureTerminalReadiness | null =
    authenticClosureReadiness
      ? {
          ...authenticClosureReadiness,
          terminalSupportRefs,
          missingRequiredSupportRefs,
          uncoveredOpenRequirementCodes: uncoveredClosureOpenRequirements,
        }
      : null;
  const exactBlockedClosureStatusReport =
    closureTerminalReadiness?.modelSynthesisAllowed === false &&
    closureTerminalReadiness.openRequirementCodes.length > 0 &&
    closureTerminalReadiness.openRequirementCodes.every((code) =>
      text.includes(code),
    ) &&
    /\b(?:blocked|ineligible|unsupported|not (?:run|executed)|procedure_only)\b/i.test(
      text,
    );
  const applies =
    Boolean(text) &&
    (/repo|doc|tool|receipt|voice|dottie|paper|scholarly|doi|journal|citation/i.test(
      text,
    ) ||
      /repo|doc|tool|voice|situation|scholarly/i.test(
        `${terminalKind} ${sourceTarget}`,
      ) ||
      requiresNoToolAcknowledgement ||
      missingRequestedTheoryIdentities.length > 0 ||
      requiresUnsupportedLanyonBoundaryCoverage ||
      Boolean(closureTerminalReadiness) ||
      Boolean(invalidClosureTerminalRef) ||
      Boolean(invalidClosureArtifactRef));
  const violations: HelixVisibleAnswerPolicyFaithfulnessGate["violations"] = [];
  if (
    /\breceipts?\b.{0,140}\b(validat(?:e|es|ing)|authoriz(?:e|es|ing)|confirm(?:s|ing)?|derive[sd]?|determine)\b.{0,140}\b(final|terminal|visible)\s+answers?\b/i.test(
      text,
    )
  ) {
    violations.push("receipt_promoted_to_authority");
  }
  if (
    /\b(final|terminal|visible)\s+answers?\b.{0,140}\b(derived from|validated by|confirmed by|based on)\b.{0,80}\breceipts?\b/i.test(
      text,
    )
  ) {
    violations.push("receipt_promoted_to_authority");
  }
  if (
    /\breceipts?\b/i.test(text) &&
    /\bfinal answers?\s+must\s+be\s+derived\s+from\s+(?:the\s+)?observations?\b/i.test(
      text,
    )
  ) {
    violations.push("receipt_promoted_to_authority");
  }
  if (
    /\b(tool outputs?|tool observations?|workspace action receipts?)\b.{0,120}\b(are|become|serve as)\b.{0,40}\b(final|terminal|visible)\s+answers?\b/i.test(
      text,
    )
  ) {
    violations.push("tool_observation_promoted_to_answer");
  }
  if (
    /\bvoice (?:proposal|draft|callout)\b.{0,120}\b(spoken|read aloud|said out loud|delivered)\b/i.test(
      text,
    )
  ) {
    violations.push("voice_proposal_promoted_to_spoken");
  }
  if (
    /\bno\s+(?:repo|repository|code)\s+evidence\b/i.test(text) &&
    /repo_code_evidence_observation|repo_docs_synthesis_packet/i.test(
      JSON.stringify(input.payload ?? {}).slice(0, 6000),
    )
  ) {
    violations.push("repo_evidence_claim_inverted");
  }
  if (
    /\bno\s+(?:paper|scholarly|citation|doi|journal)\s+evidence\b/i.test(
      text,
    ) &&
    /scholarly_research_observation|scholarly_full_text_observation|helix\.scholarly_(?:research|full_text)_observation\.v1/i.test(
      JSON.stringify(input.payload ?? {}).slice(0, 6000),
    )
  ) {
    violations.push("source_evidence_claim_inverted");
  }
  if (
    requiresNoToolAcknowledgement &&
    !answerAcknowledgesNoToolExecution(text)
  ) {
    violations.push("explicit_no_tool_acknowledgement_missing");
  }
  if (missingRequestedTheoryIdentities.length > 0) {
    violations.push("requested_theory_identity_coverage_missing");
  }
  if (requiresUnsupportedLanyonBoundaryCoverage) {
    violations.push("unsupported_lanyon_boundary_coverage_missing");
  }
  if (invalidClosureTerminalRef) {
    violations.push("theory_execution_closure_terminal_binding_invalid");
  }
  if (invalidClosureArtifactRef) {
    violations.push("theory_execution_closure_artifact_invalid");
  }
  if (
    closureSynthesisTerminal &&
    closureTerminalReadiness?.modelSynthesisAllowed === false &&
    !exactBlockedClosureStatusReport
  ) {
    violations.push("theory_execution_closure_synthesis_blocked");
  }
  if (
    closureSynthesisTerminal &&
    closureTerminalReadiness?.modelSynthesisAllowed === true &&
    missingRequiredSupportRefs.length > 0
  ) {
    violations.push("theory_execution_closure_support_refs_missing");
  }
  if (
    closureSynthesisTerminal &&
    closureTerminalReadiness?.modelSynthesisAllowed === true &&
    uncoveredClosureOpenRequirements.length > 0
  ) {
    violations.push("theory_execution_closure_open_requirements_omitted");
  }
  if (closureClaimCeilingExceeded(closureClaimCeiling, text)) {
    violations.push("theory_execution_closure_claim_ceiling_exceeded");
  }
  if (closurePhysicalTruthOverclaim(closureClaimCeiling, text)) {
    violations.push("theory_execution_closure_physical_truth_overclaim");
  }
  const uniqueViolations = Array.from(new Set(violations));
  const closureRetryRequired = uniqueViolations.some((violation) =>
    violation.startsWith("theory_execution_closure_"),
  );
  return {
    schema: "helix.visible_answer_policy_faithfulness_gate.v1",
    turn_id: input.turnId,
    applies,
    ok: uniqueViolations.length === 0,
    checked_text_ref: input.checkedTextRef,
    violations: uniqueViolations,
    ...(closureTerminalReadiness
      ? {
          theory_execution_closure_readiness: closureTerminalReadiness,
        }
      : {}),
    ...(invalidClosureTerminalRef
      ? {
          theory_execution_closure_invalid_terminal_ref:
            invalidClosureTerminalRef,
        }
      : {}),
    ...(invalidClosureArtifactRef
      ? {
          theory_execution_closure_invalid_artifact_ref:
            invalidClosureArtifactRef,
        }
      : {}),
    repair_allowed: uniqueViolations.length > 0 && !closureRetryRequired,
    assistant_answer: false,
    raw_content_included: false,
  };
}
