import type { HelixRouteProductContract } from "@shared/helix-route-product-contract";
import {
  HELIX_COMMITTED_ASK_ROUTE_SCHEMA,
  type HelixCommittedAskRoute,
} from "@shared/helix-committed-ask-route";
import { evaluateRepoAnswerTextQualityGate } from "./repo-answer-text-quality-gate";
import { committedRouteAllowsTerminalKind } from "./committed-ask-route";
import {
  collectFinalAnswerDraftSupportRefs,
  evaluateFinalAnswerDraftQualityGate,
  inferFinalAnswerDraftRouteFamily,
  type FinalAnswerDraftQualityGate,
} from "./final-answer-draft-quality-gate";
import { materializeDocEvidenceSynthesisAnswer } from "./doc-evidence-synthesis";

export type FinalAnswerDraftTerminalMaterializerResult = {
  schema: "helix.final_answer_draft_terminal_materializer_result.v1";
  turn_id: string;
  final_answer_draft_ref: string;
  ok: boolean;
  materialized_terminal_artifact_ref?: string;
  materialized_terminal_artifact_kind?:
    | "model_synthesized_answer"
    | "repo_code_evidence_answer"
    | "compound_research_locator_answer"
    | "doc_evidence_synthesis_answer"
    | "scholarly_research_answer"
    | "internet_search_answer"
    | "situation_room_live_job_setup_answer"
    | "request_user_input"
    | "typed_failure";
  blocked_reason?:
    | "draft_empty"
    | "draft_refusal"
    | "draft_not_later_than_selected_direct_answer"
    | "route_contract_forbids_model_synthesized_answer"
    | "repo_evidence_required_but_missing"
    | "repo_support_refs_missing"
    | "repo_quality_gate_failed"
    | "doc_evidence_required_but_missing"
    | "doc_evidence_coverage_missing"
    | "doc_support_refs_missing"
    | "scholarly_evidence_required_but_missing"
    | "scholarly_support_refs_missing"
    | "internet_search_evidence_required_but_missing"
    | "internet_search_support_refs_missing"
    | "draft_contradicts_observed_scholarly_full_text"
    | "live_job_contract_missing"
    | "deterministic_receipt_fallback_nonterminal"
    | "unsupported_route_terminal_kind";
  route_allowed_terminal_artifact_kinds: string[];
  final_answer_draft_quality_gate: FinalAnswerDraftQualityGate;
  assistant_answer: false;
  raw_content_included: false;
};

type ArtifactLike = {
  artifact_id?: unknown;
  kind?: unknown;
  payload?: unknown;
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const artifactPayload = (artifact: ArtifactLike): Record<string, unknown> | null =>
  readRecord(artifact.payload);

const artifactKind = (artifact: ArtifactLike): string =>
  readString(artifact.kind) ?? readString(artifactPayload(artifact)?.kind) ?? "";

const artifactSchema = (artifact: ArtifactLike): string =>
  readString(artifactPayload(artifact)?.schema) ?? "";

const artifactId = (artifact: ArtifactLike): string | null =>
  readString(artifact.artifact_id) ?? readString(artifactPayload(artifact)?.artifact_id);

const artifactText = (artifact: ArtifactLike): string | null => {
  const payload = artifactPayload(artifact);
  return readString(payload?.answer_text) ?? readString(payload?.text) ?? readString(payload?.visible_text);
};

const artifactAuthority = (artifact: ArtifactLike): string | null =>
  readString(artifactPayload(artifact)?.authority);

const isDeterministicStagePlayReceiptText = (value: unknown): boolean =>
  /^Stage Play tool receipt:\s*live_env\.reflect_stage_play_context\b/i.test(readString(value) ?? "");

export const isFinalAnswerDraftArtifact = (artifact: ArtifactLike): boolean =>
  artifactKind(artifact) === "final_answer_draft" ||
  artifactSchema(artifact) === "helix.final_answer_draft.v1";

const isDirectAnswerArtifact = (artifact: ArtifactLike): boolean =>
  artifactKind(artifact) === "direct_answer_text" ||
  artifactSchema(artifact) === "helix.direct_answer_text.v1";

const isRepoEvidenceObservation = (artifact: ArtifactLike): boolean =>
  /repo_code_evidence_observation/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" "));

const isScholarlyResearchObservation = (artifact: ArtifactLike): boolean =>
  /scholarly_research_observation|scholarly_full_text_observation/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" "));

const isInternetSearchObservation = (artifact: ArtifactLike): boolean =>
  /internet_search_observation/i.test([artifactKind(artifact), artifactSchema(artifact)].join(" "));

const isDocsEvidenceObservation = (artifact: ArtifactLike): boolean =>
  /\b(?:doc_summary|doc_location_result|doc_evidence_location|doc_location_matches|doc_equation_context|doc_equation_location|doc_calculator_evidence|agent_step_observation_packet)\b/i.test(
    [artifactKind(artifact), artifactSchema(artifact), artifactId(artifact)].join(" "),
  );

const isCompleteCompoundResearchLocatorItinerary = (payload: Record<string, unknown>): boolean => {
  const itinerary = readRecord(payload.capability_itinerary);
  const executionState = readRecord(itinerary?.execution_state);
  if (executionState?.complete !== true) return false;
  const families = new Set(readArray(executionState?.required_observation_families).map(readString).filter(Boolean));
  return families.has("theory_locator") && (families.has("scholarly_research") || families.has("internet_search"));
};

export const findLatestFinalAnswerDraftCandidate = (
  artifacts: ArtifactLike[],
): { artifact: ArtifactLike; sequence: number; text: string; ref: string } | null => {
  for (let index = artifacts.length - 1; index >= 0; index -= 1) {
    const artifact = artifacts[index];
    if (!artifact || !isFinalAnswerDraftArtifact(artifact)) continue;
    const text = artifactText(artifact);
    const ref = artifactId(artifact);
    if (!text || !ref) continue;
    return { artifact, sequence: index, text, ref };
  }
  return null;
};

export const latestDirectAnswerSequence = (artifacts: ArtifactLike[]): number =>
  artifacts.reduce((latest, artifact, index) => isDirectAnswerArtifact(artifact) ? index : latest, -1);

const allowedKinds = (contract?: HelixRouteProductContract | Record<string, unknown> | null): string[] =>
  readArray(contract?.allowed_terminal_artifact_kinds)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));

const readCommittedRoute = (payload: Record<string, unknown>): HelixCommittedAskRoute | null => {
  const committedRoute = readRecord(payload.committed_ask_route);
  return committedRoute?.schema === HELIX_COMMITTED_ASK_ROUTE_SCHEMA
    ? (committedRoute as unknown as HelixCommittedAskRoute)
    : null;
};

const effectiveAllowedKinds = (
  payload: Record<string, unknown>,
  contract?: HelixRouteProductContract | Record<string, unknown> | null,
): string[] => {
  const committedRoute = readCommittedRoute(payload);
  const committedAllowed = committedRoute?.canonical_goal.allowed_terminal_artifact_kinds ?? [];
  return committedAllowed.length > 0 ? committedAllowed : allowedKinds(contract);
};

const contractAllows = (
  payload: Record<string, unknown>,
  contract: HelixRouteProductContract | Record<string, unknown> | null | undefined,
  kind: string,
): boolean => {
  const committedRoute = readCommittedRoute(payload);
  if (committedRoute) {
    return committedRouteAllowsTerminalKind({
      committedRoute,
      terminalArtifactKind: kind,
      finalAnswerSource: kind === "model_synthesized_answer" ? "final_answer_draft" : null,
    });
  }
  const allowed = allowedKinds(contract);
  return allowed.length === 0 ||
    allowed.includes(kind) ||
    (kind === "doc_evidence_synthesis_answer" && allowed.includes("doc_evidence_synthesis"));
};

const materializedRef = (turnId: string, kind: string): string =>
  `${turnId}:${kind}:from_final_answer_draft`;

const persistDocEvidenceSynthesisAnswerArtifact = (input: {
  turnId: string;
  payload: Record<string, unknown>;
  artifactLedger: ArtifactLike[];
  answer: Record<string, unknown>;
}): void => {
  const artifactIdRef = readString(input.answer.artifact_id);
  if (!artifactIdRef) return;
  const alreadyPresent = input.artifactLedger.some((artifact) => artifactId(artifact) === artifactIdRef);
  if (alreadyPresent) return;
  const artifact: ArtifactLike & Record<string, unknown> = {
    artifact_id: artifactIdRef,
    turn_id: input.turnId,
    producer_item_id: "doc_evidence_synthesis_materializer",
    kind: "doc_evidence_synthesis_answer",
    created_at_ms: Date.now(),
    source_scope: "current_turn",
    payload: input.answer,
  };
  input.artifactLedger.push(artifact);
  input.payload.current_turn_artifact_ledger = input.artifactLedger;
};

export function materializeFinalAnswerDraftTerminal(input: {
  turnId: string;
  payload: Record<string, unknown>;
  artifactLedger: ArtifactLike[];
  routeProductContract?: HelixRouteProductContract | Record<string, unknown> | null;
  finalAnswerDraftRef?: string | null;
}): FinalAnswerDraftTerminalMaterializerResult | null {
  const draft = findLatestFinalAnswerDraftCandidate(input.artifactLedger);
  if (!draft) return null;
  if (input.finalAnswerDraftRef && input.finalAnswerDraftRef !== draft.ref) return null;

  const draftPayload = artifactPayload(draft.artifact);
  const contract = input.routeProductContract ?? readRecord(input.payload.route_product_contract);
  const routeAllowed = effectiveAllowedKinds(input.payload, contract);
  const qualityGate = evaluateFinalAnswerDraftQualityGate({
    turnId: input.turnId,
    finalAnswerDraftRef: draft.ref,
    draftText: draft.text,
    draftPayload,
    promptText: readString(input.payload.active_prompt),
    routeProductContract: contract,
    payload: input.payload,
    artifactLedger: input.artifactLedger,
  });
  input.payload.final_answer_draft_quality_gate = qualityGate;
  const draftAuthority =
    artifactAuthority(draft.artifact) ??
    readString(readRecord(input.payload.final_answer_draft)?.authority);
  if (draftAuthority === "deterministic_receipt_fallback" || isDeterministicStagePlayReceiptText(draft.text)) {
    return {
      schema: "helix.final_answer_draft_terminal_materializer_result.v1",
      turn_id: input.turnId,
      final_answer_draft_ref: draft.ref,
      ok: false,
      blocked_reason: "deterministic_receipt_fallback_nonterminal",
      route_allowed_terminal_artifact_kinds: routeAllowed,
      final_answer_draft_quality_gate: qualityGate,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const directSequence = latestDirectAnswerSequence(input.artifactLedger);
  const routeFamily = inferFinalAnswerDraftRouteFamily({
    routeProductContract: contract,
    payload: input.payload,
    artifactLedger: input.artifactLedger,
  });
  if (!qualityGate.ok) {
    const blocked = qualityGate.violations.includes("empty_draft")
      ? "draft_empty"
      : qualityGate.violations.includes("contradicts_observed_scholarly_full_text")
        ? "draft_contradicts_observed_scholarly_full_text"
      : qualityGate.violations.includes("refusal_without_error")
        ? "draft_refusal"
      : qualityGate.violations.includes("missing_support_refs_for_repo_route")
        ? "repo_support_refs_missing"
        : qualityGate.violations.includes("missing_support_refs_for_scholarly_route")
          ? "scholarly_support_refs_missing"
        : qualityGate.violations.includes("missing_support_refs_for_internet_search_route")
          ? "internet_search_support_refs_missing"
          : "unsupported_route_terminal_kind";
    return {
      schema: "helix.final_answer_draft_terminal_materializer_result.v1",
      turn_id: input.turnId,
      final_answer_draft_ref: draft.ref,
      ok: false,
      blocked_reason: blocked,
      route_allowed_terminal_artifact_kinds: routeAllowed,
      final_answer_draft_quality_gate: qualityGate,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (routeFamily === "repo_evidence") {
    if (!input.artifactLedger.some(isRepoEvidenceObservation)) {
      return {
        schema: "helix.final_answer_draft_terminal_materializer_result.v1",
        turn_id: input.turnId,
        final_answer_draft_ref: draft.ref,
        ok: false,
        blocked_reason: "repo_evidence_required_but_missing",
        route_allowed_terminal_artifact_kinds: routeAllowed,
        final_answer_draft_quality_gate: qualityGate,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const supportRefs = collectFinalAnswerDraftSupportRefs({
      draftPayload,
      artifactLedger: input.artifactLedger,
    });
    if (supportRefs.length === 0) {
      return {
        schema: "helix.final_answer_draft_terminal_materializer_result.v1",
        turn_id: input.turnId,
        final_answer_draft_ref: draft.ref,
        ok: false,
        blocked_reason: "repo_support_refs_missing",
        route_allowed_terminal_artifact_kinds: routeAllowed,
        final_answer_draft_quality_gate: qualityGate,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const repoAnswerRef = materializedRef(input.turnId, "repo_code_evidence_answer");
    input.payload.repo_code_evidence_answer = {
      schema: "helix.repo_code_evidence_answer.v1",
      artifact_id: repoAnswerRef,
      turn_id: input.turnId,
      text: draft.text,
      answer_text: draft.text,
      support_refs: supportRefs,
      model_authored: true,
      synthesis_attempt_ref:
        readString(input.artifactLedger.find((artifact) =>
          artifactKind(artifact) === "repo_evidence_synthesis_attempt" ||
          artifactSchema(artifact) === "helix.repo_evidence_synthesis_attempt.v1",
        )?.artifact_id) ?? `${input.turnId}:repo_evidence_synthesis_attempt:from_final_answer_draft`,
      model_step_capability:
        readString(draftPayload?.model_step_capability) ??
        "model.synthesize_from_repo_evidence",
      final_answer_draft_ref: draft.ref,
      assistant_answer: false,
      raw_content_included: false,
    };
    const repoGate = evaluateRepoAnswerTextQualityGate({
      turnId: input.turnId,
      answerRef: repoAnswerRef,
      answerText: draft.text,
      payload: input.payload,
    });
    input.payload.repo_answer_text_quality_gate = repoGate;
    if (!repoGate.ok) {
      return {
        schema: "helix.final_answer_draft_terminal_materializer_result.v1",
        turn_id: input.turnId,
        final_answer_draft_ref: draft.ref,
        ok: false,
        blocked_reason: "repo_quality_gate_failed",
        route_allowed_terminal_artifact_kinds: routeAllowed,
        final_answer_draft_quality_gate: qualityGate,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    return {
      schema: "helix.final_answer_draft_terminal_materializer_result.v1",
      turn_id: input.turnId,
      final_answer_draft_ref: draft.ref,
      ok: true,
      materialized_terminal_artifact_ref: repoAnswerRef,
      materialized_terminal_artifact_kind: "repo_code_evidence_answer",
      route_allowed_terminal_artifact_kinds: routeAllowed,
      final_answer_draft_quality_gate: qualityGate,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (routeFamily === "scholarly_research") {
    if (!input.artifactLedger.some(isScholarlyResearchObservation)) {
      return {
        schema: "helix.final_answer_draft_terminal_materializer_result.v1",
        turn_id: input.turnId,
        final_answer_draft_ref: draft.ref,
        ok: false,
        blocked_reason: "scholarly_evidence_required_but_missing",
        route_allowed_terminal_artifact_kinds: routeAllowed,
        final_answer_draft_quality_gate: qualityGate,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const supportRefs = collectFinalAnswerDraftSupportRefs({
      draftPayload,
      artifactLedger: input.artifactLedger,
    });
    if (supportRefs.length === 0) {
      return {
        schema: "helix.final_answer_draft_terminal_materializer_result.v1",
        turn_id: input.turnId,
        final_answer_draft_ref: draft.ref,
        ok: false,
        blocked_reason: "scholarly_support_refs_missing",
        route_allowed_terminal_artifact_kinds: routeAllowed,
        final_answer_draft_quality_gate: qualityGate,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const compoundResearchLocator = isCompleteCompoundResearchLocatorItinerary(input.payload);
    const targetKind = compoundResearchLocator
      ? "compound_research_locator_answer"
      : "scholarly_research_answer";
    if (!contractAllows(input.payload, contract, targetKind)) {
      return {
        schema: "helix.final_answer_draft_terminal_materializer_result.v1",
        turn_id: input.turnId,
        final_answer_draft_ref: draft.ref,
        ok: false,
        blocked_reason: "route_contract_forbids_model_synthesized_answer",
        route_allowed_terminal_artifact_kinds: routeAllowed,
        final_answer_draft_quality_gate: qualityGate,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const scholarlyAnswerRef = materializedRef(input.turnId, targetKind);
    const answerPayload = {
      schema: compoundResearchLocator
        ? "helix.compound_research_locator_answer.v1"
        : "helix.scholarly_research_answer.v1",
      artifact_id: scholarlyAnswerRef,
      turn_id: input.turnId,
      text: draft.text,
      answer_text: draft.text,
      support_refs: supportRefs,
      model_authored: true,
      model_step_capability: compoundResearchLocator
        ? "model.synthesize_from_compound_research_locator"
        : "model.synthesize_from_scholarly_research",
      final_answer_draft_ref: draft.ref,
      source_families: compoundResearchLocator
        ? ["scholarly_research", "theory_locator"]
        : ["scholarly_research"],
      assistant_answer: false,
      raw_content_included: false,
    };
    if (compoundResearchLocator) {
      input.payload.compound_research_locator_answer = answerPayload;
    } else {
      input.payload.scholarly_research_answer = answerPayload;
    }
    return {
      schema: "helix.final_answer_draft_terminal_materializer_result.v1",
      turn_id: input.turnId,
      final_answer_draft_ref: draft.ref,
      ok: true,
      materialized_terminal_artifact_ref: scholarlyAnswerRef,
      materialized_terminal_artifact_kind: targetKind,
      route_allowed_terminal_artifact_kinds: routeAllowed,
      final_answer_draft_quality_gate: qualityGate,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (routeFamily === "internet_search") {
    if (!input.artifactLedger.some(isInternetSearchObservation)) {
      return {
        schema: "helix.final_answer_draft_terminal_materializer_result.v1",
        turn_id: input.turnId,
        final_answer_draft_ref: draft.ref,
        ok: false,
        blocked_reason: "internet_search_evidence_required_but_missing",
        route_allowed_terminal_artifact_kinds: routeAllowed,
        final_answer_draft_quality_gate: qualityGate,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const supportRefs = collectFinalAnswerDraftSupportRefs({
      draftPayload,
      artifactLedger: input.artifactLedger,
    });
    if (supportRefs.length === 0) {
      return {
        schema: "helix.final_answer_draft_terminal_materializer_result.v1",
        turn_id: input.turnId,
        final_answer_draft_ref: draft.ref,
        ok: false,
        blocked_reason: "internet_search_support_refs_missing",
        route_allowed_terminal_artifact_kinds: routeAllowed,
        final_answer_draft_quality_gate: qualityGate,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const compoundResearchLocator = isCompleteCompoundResearchLocatorItinerary(input.payload);
    const targetKind = compoundResearchLocator
      ? "compound_research_locator_answer"
      : "internet_search_answer";
    if (!contractAllows(input.payload, contract, targetKind)) {
      return {
        schema: "helix.final_answer_draft_terminal_materializer_result.v1",
        turn_id: input.turnId,
        final_answer_draft_ref: draft.ref,
        ok: false,
        blocked_reason: "route_contract_forbids_model_synthesized_answer",
        route_allowed_terminal_artifact_kinds: routeAllowed,
        final_answer_draft_quality_gate: qualityGate,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const internetAnswerRef = materializedRef(input.turnId, targetKind);
    const answerPayload = {
      schema: compoundResearchLocator
        ? "helix.compound_research_locator_answer.v1"
        : "helix.internet_search_answer.v1",
      artifact_id: internetAnswerRef,
      turn_id: input.turnId,
      text: draft.text,
      answer_text: draft.text,
      support_refs: supportRefs,
      model_authored: true,
      model_step_capability: compoundResearchLocator
        ? "model.synthesize_from_compound_research_locator"
        : "model.synthesize_from_internet_search",
      final_answer_draft_ref: draft.ref,
      source_families: compoundResearchLocator
        ? ["internet_search", "theory_locator"]
        : ["internet_search"],
      assistant_answer: false,
      raw_content_included: false,
    };
    if (compoundResearchLocator) {
      input.payload.compound_research_locator_answer = answerPayload;
    } else {
      input.payload.internet_search_answer = answerPayload;
    }
    return {
      schema: "helix.final_answer_draft_terminal_materializer_result.v1",
      turn_id: input.turnId,
      final_answer_draft_ref: draft.ref,
      ok: true,
      materialized_terminal_artifact_ref: internetAnswerRef,
      materialized_terminal_artifact_kind: targetKind,
      route_allowed_terminal_artifact_kinds: routeAllowed,
      final_answer_draft_quality_gate: qualityGate,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (routeFamily === "docs_source") {
    if (!contractAllows(input.payload, contract, "doc_evidence_synthesis_answer")) {
      return {
        schema: "helix.final_answer_draft_terminal_materializer_result.v1",
        turn_id: input.turnId,
        final_answer_draft_ref: draft.ref,
        ok: false,
        blocked_reason: "route_contract_forbids_model_synthesized_answer",
        route_allowed_terminal_artifact_kinds: routeAllowed,
        final_answer_draft_quality_gate: qualityGate,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    if (!input.artifactLedger.some(isDocsEvidenceObservation)) {
      return {
        schema: "helix.final_answer_draft_terminal_materializer_result.v1",
        turn_id: input.turnId,
        final_answer_draft_ref: draft.ref,
        ok: false,
        blocked_reason: "doc_evidence_required_but_missing",
        route_allowed_terminal_artifact_kinds: routeAllowed,
        final_answer_draft_quality_gate: qualityGate,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const supportRefs = collectFinalAnswerDraftSupportRefs({
      draftPayload,
      artifactLedger: input.artifactLedger,
    });
    if (supportRefs.length === 0) {
      return {
        schema: "helix.final_answer_draft_terminal_materializer_result.v1",
        turn_id: input.turnId,
        final_answer_draft_ref: draft.ref,
        ok: false,
        blocked_reason: "doc_support_refs_missing",
        route_allowed_terminal_artifact_kinds: routeAllowed,
        final_answer_draft_quality_gate: qualityGate,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    const materialized = materializeDocEvidenceSynthesisAnswer({
      turnId: input.turnId,
      promptText: readString(input.payload.active_prompt) ?? "",
      payload: input.payload,
      artifactLedger: input.artifactLedger,
      answerText: draft.text,
      finalAnswerDraftRef: draft.ref,
    });
    if (!materialized.ok || !materialized.answer) {
      return {
        schema: "helix.final_answer_draft_terminal_materializer_result.v1",
        turn_id: input.turnId,
        final_answer_draft_ref: draft.ref,
        ok: false,
        blocked_reason: materialized.blocked_reason === "doc_evidence_coverage_missing"
          ? "doc_evidence_coverage_missing"
          : "unsupported_route_terminal_kind",
        route_allowed_terminal_artifact_kinds: routeAllowed,
        final_answer_draft_quality_gate: qualityGate,
        assistant_answer: false,
        raw_content_included: false,
      };
    }
    persistDocEvidenceSynthesisAnswerArtifact({
      turnId: input.turnId,
      payload: input.payload,
      artifactLedger: input.artifactLedger,
      answer: materialized.answer as unknown as Record<string, unknown>,
    });
    return {
      schema: "helix.final_answer_draft_terminal_materializer_result.v1",
      turn_id: input.turnId,
      final_answer_draft_ref: draft.ref,
      ok: true,
      materialized_terminal_artifact_ref: materialized.answer.artifact_id,
      materialized_terminal_artifact_kind: "doc_evidence_synthesis_answer",
      route_allowed_terminal_artifact_kinds: routeAllowed,
      final_answer_draft_quality_gate: qualityGate,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (directSequence >= draft.sequence) {
    return {
      schema: "helix.final_answer_draft_terminal_materializer_result.v1",
      turn_id: input.turnId,
      final_answer_draft_ref: draft.ref,
      ok: false,
      blocked_reason: "draft_not_later_than_selected_direct_answer",
      route_allowed_terminal_artifact_kinds: routeAllowed,
      final_answer_draft_quality_gate: qualityGate,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (!contractAllows(input.payload, contract, "model_synthesized_answer")) {
    return {
      schema: "helix.final_answer_draft_terminal_materializer_result.v1",
      turn_id: input.turnId,
      final_answer_draft_ref: draft.ref,
      ok: false,
      blocked_reason: "route_contract_forbids_model_synthesized_answer",
      route_allowed_terminal_artifact_kinds: routeAllowed,
      final_answer_draft_quality_gate: qualityGate,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  const ref = materializedRef(input.turnId, "model_synthesized_answer");
  input.payload.model_synthesized_answer = {
    schema: "helix.model_synthesized_answer.v1",
    artifact_id: ref,
    turn_id: input.turnId,
    text: draft.text,
    answer_text: draft.text,
    final_answer_draft_ref: draft.ref,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    schema: "helix.final_answer_draft_terminal_materializer_result.v1",
    turn_id: input.turnId,
    final_answer_draft_ref: draft.ref,
    ok: true,
    materialized_terminal_artifact_ref: ref,
    materialized_terminal_artifact_kind: "model_synthesized_answer",
    route_allowed_terminal_artifact_kinds: routeAllowed,
    final_answer_draft_quality_gate: qualityGate,
    assistant_answer: false,
    raw_content_included: false,
  };
}
